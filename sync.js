'use strict';

/* =====================================================================
   ☁ 구글 드라이브 동기화
   ---------------------------------------------------------------------
   - 로그인: 구글 GIS "토큰 방식". 액세스 토큰은 메모리에만 두고 어디에도 저장하지 않아요. (client secret·API 키·서버는 없어요)
   - 권한: drive.file 하나뿐이에요. 이 앱이 만든 파일만 볼 수 있어요.
   - Drive에 생기는 것 (내 드라이브 → "나의 기록장 (동기화)" 폴더)
       journal.json                        기록 글 전체 + 삭제 표시 + 동기화 정보 (이미지 데이터는 없어요)
       img-<기록id>-<칸>-<번호>-<해시>.jpg  그림·원본·워치 캡처 한 장에 파일 하나
   - 합치는 규칙: 두 기기의 시계를 견주지 않고, 각 기기가 "마지막 동기화 때의 나"(base)와만 비교해서 바뀌었는지 알아봐요.
   - 녹음 파일은 동기화하지 않아요 (이 기기에만 저장돼요).
   - file:// 로 열었거나 로그인하지 않았어도 기록·백업·자동 저장은 전부 그대로 써져요.
   ===================================================================== */
(() => {
  const CFG = { clientId: '', deployUrl: '', folderName: '나의 기록장 (동기화)', tombstoneDays: 60, staleDays: 60, ...(window.SYNC_CONFIG || {}) };
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
  const JOURNAL_NAME = 'journal.json';
  const DAY = 86400000;
  const T = { debounce: 5000, refocus: 60000, backoff: [5, 15, 60, 300, 900].map((s) => s * 1000), fast: false };

  let nowFn = () => Date.now();
  const now = () => nowFn();
  const q$ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  async function sha256(str) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))); }
  function b64ToBytes(b64) { const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function bytesToB64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function stable(v) {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach((k) => { if (v[k] !== undefined) o[k] = stable(v[k]); }); return o; }
    return v;
  }
  function limiter(n) {
    let active = 0; const queue = [];
    const next = () => {
      if (active >= n || !queue.length) return;
      active += 1;
      const { fn, res, rej } = queue.shift();
      fn().then(res, rej).finally(() => { active -= 1; next(); });
    };
    return (fn) => new Promise((res, rej) => { queue.push({ fn, res, rej }); next(); });
  }
  const imgLimit = limiter(3);

  /* ---------------------------------------------------------------------
     0. 환경과 상태
     --------------------------------------------------------------------- */
  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const secure = location.protocol === 'https:' || isLocalHost;
  const envMode = () => (location.protocol === 'file:' ? 'file' : !CFG.clientId ? 'noconfig' : !secure ? 'insecure' : 'ok');

  // status: idle 정상 / syncing 동기화 중 / offline 인터넷 없음 / error 문제가 생김(다시 시도) / reconnect 다시 연결 필요
  //         stale 오랜만에 켬(확인 필요) / missing Drive 파일이 사라짐 / welcome 첫 로그인 진행 중
  const S = {
    meta: null, status: 'idle', lastError: '', token: null, tokenExp: 0, tokenP: null, needReconnect: false,
    running: false, dirty: false, force: null, staleOk: false, gisP: null, backoffIdx: 0, nextRetryAt: 0,
    debounceT: null, retryT: null, lastRunAt: 0, progress: null, remote: { version: '', journal: null }, shaCache: new Map(), conflictsSeen: 0,
  };

  class SyncError extends Error {
    constructor(kind, msg, extra) { super(msg || kind); this.kind = kind; Object.assign(this, extra || {}); }
  }
  const FRIENDLY = {
    offline: '인터넷에 연결되면 자동으로 올릴게요.',
    auth: '다시 연결이 필요해요. 위쪽 ☁ 를 한 번 눌러 주세요.',
    rate: '구글이 잠깐 바쁘대요. 조금 뒤에 다시 해 볼게요.',
    server: '구글 서버가 잠깐 불안정해요. 조금 뒤에 다시 해 볼게요.',
    quota: 'Drive 저장 공간이 부족해요. Drive에서 공간을 비운 뒤 "지금 동기화"를 눌러 주세요.',
    notfound: 'Drive에서 파일을 찾지 못했어요.',
    missing: 'Drive에서 동기화 폴더나 파일이 사라졌어요.',
    gis: '구글 로그인 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.',
    denied: '로그인을 취소했거나 권한을 주지 않았어요.',
    popup: '로그인 창이 열리지 않았어요. 브라우저의 팝업 허용을 확인해 주세요.',
    origin: '이 주소가 구글 설정의 "승인된 JavaScript 원본"에 없을 수 있어요. README의 문제 해결을 확인해 주세요.',
    apidisabled: 'Google Drive API가 켜져 있지 않을 수 있어요. README의 문제 해결을 확인해 주세요.',
    forbidden: '구글이 요청을 허락하지 않았어요. 로그인한 계정과 권한(drive.file)을 확인해 주세요.',
    fatal: '동기화 중 문제가 생겼어요. 조금 뒤에 다시 해 볼게요.',
  };

  /* ---------------------------------------------------------------------
     1. 이 기기에만 두는 동기화 정보 (토큰은 저장하지 않아요)
     --------------------------------------------------------------------- */
  const emptyMeta = () => ({
    id: '__meta_sync', type: 'meta', deviceId: newId(), enabled: false, email: '', folderId: '', journalId: '', remoteVersion: '',
    firstDone: false, lastSyncAt: 0,
    base: {},       // 기록 id → { lu: 마지막으로 맞췄을 때 이 기기의 updatedAt, ld: 그때 지워진 상태였나, ru: Drive 쪽 updatedAt, rd }
    conflicts: {},  // 아직 풀지 못한 충돌 id → { kind, remote }
    last: null,     // 로그아웃할 때 남겨 두는 마지막 동기화 정보 (같은 계정으로 다시 로그인하면 이어서 써요. 비밀 값은 없어요)
  });
  async function loadMeta() {
    const m = await Store.get('__meta_sync');
    S.meta = m ? { ...emptyMeta(), ...m } : emptyMeta();
    S.meta.base = S.meta.base || {};
    S.meta.conflicts = S.meta.conflicts || {};
  }
  const saveMeta = () => Store.putMany([S.meta], { silent: true });

  /* ---------------------------------------------------------------------
     2. 로그인 (GIS 토큰 방식. 토큰은 메모리에만)
     --------------------------------------------------------------------- */
  const gisReady = () => !!(window.google && google.accounts && google.accounts.oauth2);
  function loadGIS() {
    if (gisReady()) return Promise.resolve();
    if (S.gisP) return S.gisP;
    S.gisP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; // 구글 로그인 도구 (동기화를 쓸 때만 불러와요)
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { S.gisP = null; reject(new SyncError('gis')); };
      document.head.appendChild(s);
    });
    return S.gisP;
  }
  const tokenValid = () => !!S.token && now() < S.tokenExp;
  function authError(r) {
    const type = r && (r.type || r.error);
    if (type === 'popup_failed_to_open') return new SyncError('popup');
    if (type === 'popup_closed' || type === 'access_denied') return new SyncError('denied');
    if (['interaction_required', 'immediate_failed', 'login_required', 'consent_required', 'user_logged_out'].includes(type)) return new SyncError('auth', String(type));
    if (['invalid_request', 'redirect_uri_mismatch', 'origin_mismatch', 'idpiframe_initialization_failed'].includes(type)) return new SyncError('origin', String(type));
    return new SyncError('auth', String(type || (r && r.message) || 'auth'));
  }
  // prompt: '' 은 필요할 때만 창을 보여요 / 'none' 은 조용히 (창 없이) 새로 받기를 시도해요
  function requestToken({ prompt = '', hint = '' } = {}) {
    return new Promise((resolve, reject) => {
      try {
        const tc = google.accounts.oauth2.initTokenClient({
          client_id: CFG.clientId, scope: SCOPE, ...(hint ? { hint } : {}),
          callback: (resp) => {
            if (resp && resp.access_token) {
              S.token = resp.access_token; // 메모리에만! (localStorage·IndexedDB에 저장하지 않아요)
              S.tokenExp = now() + Math.max(60, (Number(resp.expires_in) || 3600) - 120) * 1000;
              resolve(resp.access_token);
            } else reject(authError(resp));
          },
          error_callback: (err) => reject(authError(err)),
        });
        tc.requestAccessToken({ prompt, ...(hint ? { hint } : {}) });
      } catch (e) { reject(authError(e)); }
    });
  }
  function ensureToken() {
    if (tokenValid()) return Promise.resolve(S.token);
    if (!S.meta || !S.meta.enabled || S.needReconnect) return Promise.reject(new SyncError('auth'));
    if (S.tokenP) return S.tokenP;
    S.tokenP = (async () => {
      try {
        if (!gisReady()) await loadGIS();
        return await requestToken({ prompt: 'none', hint: S.meta.email });
      } catch (e) {
        S.token = null;
        if (e.kind === 'gis') throw e;
        S.needReconnect = true; // 조용히 새로 받지 못했어요 → 칩을 한 번 누르면 바로 로그인 창이 떠요
        throw new SyncError('auth', 'silent-failed');
      } finally { S.tokenP = null; }
    })();
    return S.tokenP;
  }

  /* ---------------------------------------------------------------------
     3. Drive 호출 (fetch로 REST v3 직접. 실패하면 알아듣기 쉬운 오류로 바꿔요)
     --------------------------------------------------------------------- */
  async function drive(path, opt = {}) {
    const { method = 'GET', params, json, body, contentType, raw = false, upload = false } = opt;
    const url = new URL((upload ? UPLOAD : API) + path);
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) url.searchParams.set(k, v); });
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const token = await ensureToken();
      const headers = { Authorization: `Bearer ${token}` };
      let b = body;
      if (json !== undefined) { headers['Content-Type'] = 'application/json'; b = JSON.stringify(json); } else if (contentType) headers['Content-Type'] = contentType;
      let res;
      try { res = await fetch(url, { method, headers, body: b }); } catch (e) { throw new SyncError('offline'); }
      if (res.ok) return raw ? res : (res.status === 204 ? null : res.json());
      const status = res.status;
      let reason = ''; let msg = '';
      try { const j = await res.clone().json(); reason = (j.error && ((j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || j.error.status)) || ''; msg = (j.error && j.error.message) || ''; } catch (e) { /* 본문이 없어도 괜찮아요 */ }
      if (status === 401) { S.token = null; if (attempt === 0) continue; throw new SyncError('auth'); } // 한 번은 조용히 새로 받아 봐요
      if (status === 404) throw new SyncError('notfound', msg);
      if (status === 403 && /storageQuotaExceeded/i.test(reason)) throw new SyncError('quota');
      if (status === 403 && /accessNotConfigured|SERVICE_DISABLED/i.test(reason + msg)) throw new SyncError('apidisabled', msg);
      if (status === 429 || status >= 500 || (status === 403 && /rate|limit/i.test(reason))) {
        lastErr = new SyncError(status >= 500 ? 'server' : 'rate', msg, { status });
        if (attempt < 2) { const ra = Number(res.headers.get('retry-after')); await sleep(T.fast ? 5 : (ra ? Math.min(ra * 1000, 10000) : 800 * 2 ** attempt)); continue; }
        throw lastErr;
      }
      if (status === 403) throw new SyncError('forbidden', msg);
      throw new SyncError('server', msg || `HTTP ${status}`, { status });
    }
    throw lastErr || new SyncError('server');
  }
  function multipart(meta, blob, mime) {
    const boundary = `mj${Math.random().toString(36).slice(2)}`;
    return {
      body: new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`, blob, `\r\n--${boundary}--`]),
      contentType: `multipart/related; boundary=${boundary}`,
    };
  }
  const qEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  async function fetchEmail() {
    const r = await drive('/about', { params: { fields: 'user(emailAddress,displayName)' } });
    return (r && r.user && r.user.emailAddress) || '';
  }
  async function findFolder() {
    const r = await drive('/files', { params: { q: `name='${qEsc(CFG.folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields: 'files(id,name,createdTime)', orderBy: 'createdTime', pageSize: '10' } });
    return (r.files || [])[0] || null;
  }
  const createFolder = () => drive('/files', { method: 'POST', json: { name: CFG.folderName, mimeType: 'application/vnd.google-apps.folder' }, params: { fields: 'id,name' } });
  // 폴더 id를 확인해요. create=true 이면 없을 때 만들어요.
  async function ensureFolder(create) {
    if (S.meta.folderId) {
      try {
        const f = await drive(`/files/${S.meta.folderId}`, { params: { fields: 'id,trashed' } });
        if (f && !f.trashed) return f.id;
      } catch (e) { if (e.kind !== 'notfound') throw e; }
      S.meta.folderId = ''; S.meta.journalId = ''; S.meta.remoteVersion = ''; S.remote = { version: '', journal: null };
    }
    const found = await findFolder();
    if (found) { S.meta.folderId = found.id; return found.id; }
    if (!create) return null;
    const nf = await createFolder();
    S.meta.folderId = nf.id;
    return nf.id;
  }
  async function findJournal(folderId) {
    const r = await drive('/files', { params: { q: `name='${JOURNAL_NAME}' and '${qEsc(folderId)}' in parents and trashed=false`, fields: 'files(id,version,modifiedTime)', pageSize: '5' } });
    return (r.files || [])[0] || null;
  }
  async function journalMeta(id) {
    try {
      const m = await drive(`/files/${id}`, { params: { fields: 'id,version,modifiedTime,trashed' } });
      return m && !m.trashed ? m : null;
    } catch (e) { if (e.kind === 'notfound') return null; throw e; }
  }
  async function downloadJournal(id) { return (await drive(`/files/${id}`, { params: { alt: 'media' }, raw: true })).json(); }
  async function uploadJournal(existingId, folderId, obj) {
    const mp = multipart(existingId ? {} : { name: JOURNAL_NAME, parents: [folderId], mimeType: 'application/json' }, new Blob([JSON.stringify(obj)], { type: 'application/json' }), 'application/json');
    return drive(existingId ? `/files/${existingId}` : '/files', { method: existingId ? 'PATCH' : 'POST', upload: true, params: { uploadType: 'multipart', fields: 'id,version,modifiedTime' }, body: mp.body, contentType: mp.contentType });
  }
  const trashFile = (fid) => drive(`/files/${fid}`, { method: 'PATCH', json: { trashed: true }, params: { fields: 'id' } }); // 휴지통으로 (30일 안에 되살릴 수 있어요)

  /* ---------------------------------------------------------------------
     4. 기록 ↔ Drive 형태 바꾸기 (이미지는 파일로 따로)
     --------------------------------------------------------------------- */
  const syncable = (r) => isSyncedRecord(r);
  const isB64 = (v) => typeof v === 'string' && /^data:[\w.+\-/]+;base64,/.test(v);
  const isRef = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && !!v.$img && !!v.$img.f;
  const isTombLike = (r) => !!(r && r.deletedAt);
  const imageFields = (type) => ((SCHEMAS[type] && SCHEMAS[type].fields) || []).filter((f) => f.type === 'image' || f.type === 'images').map((f) => ({ key: f.key, multi: f.type === 'images' }));
  function imagesOf(rec) {
    const out = [];
    imageFields(rec.type).forEach((f) => {
      const v = rec[f.key];
      if (f.multi && Array.isArray(v)) v.forEach((x, i) => { if (isB64(x)) out.push({ key: f.key, idx: i, value: x }); });
      else if (!f.multi && isB64(v)) out.push({ key: f.key, idx: null, value: v });
    });
    return out;
  }
  async function imgSha(rec, im) {
    const k = `${rec.id}|${rec.updatedAt}|${im.key}|${im.idx}|${im.value.length}`;
    if (S.shaCache.has(k)) return S.shaCache.get(k);
    const h = await sha256(im.value);
    if (S.shaCache.size > 400) S.shaCache.clear();
    S.shaCache.set(k, h);
    return h;
  }
  // 내용이 같은지 비교하는 글자 (바꾼 시각은 빼고, 이미지는 해시로)
  async function sigLocal(rec) {
    const out = {};
    const fields = new Map(imageFields(rec.type).map((f) => [f.key, f]));
    for (const k of Object.keys(rec)) {
      if (k === 'updatedAt') continue;
      const v = rec[k]; const f = fields.get(k);
      if (f && f.multi && Array.isArray(v)) out[k] = await Promise.all(v.map(async (x, i) => (isB64(x) ? { $h: await imgSha(rec, { key: k, idx: i, value: x }) } : x)));
      else if (f && !f.multi && isB64(v)) out[k] = { $h: await imgSha(rec, { key: k, idx: null, value: v }) };
      else out[k] = v;
    }
    return JSON.stringify(stable(out));
  }
  function sigRemote(rec) {
    const conv = (v) => (isRef(v) ? { $h: v.$img.h } : Array.isArray(v) ? v.map(conv) : v);
    const out = {};
    Object.keys(rec).forEach((k) => { if (k !== 'updatedAt') out[k] = conv(rec[k]); });
    return JSON.stringify(stable(out));
  }
  const refsOfRecord = (rec) => {
    const out = [];
    const scan = (v) => { if (isRef(v)) out.push(v.$img); else if (Array.isArray(v)) v.forEach(scan); };
    imageFields(rec.type).forEach((f) => scan(rec[f.key]));
    return out;
  };
  const refFileIds = (journal) => { const s = new Set(); (journal.records || []).forEach((r) => refsOfRecord(r).forEach((x) => s.add(x.f))); return s; };

  async function uploadImage(rec, im, sha, folderId) {
    const mime = (im.value.match(/^data:([\w.+\-/]+);base64,/) || [])[1] || 'image/jpeg';
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime] || 'img';
    const bytes = b64ToBytes(im.value.slice(im.value.indexOf(',') + 1));
    const name = `img-${rec.id}-${im.key}${im.idx == null ? '' : `-${im.idx}`}-${sha.slice(0, 8)}.${ext}`;
    const mp = multipart({ name, parents: [folderId], mimeType: mime, appProperties: { rid: rec.id, key: im.key, sha } }, new Blob([bytes], { type: mime }), mime);
    const r = await drive('/files', { method: 'POST', upload: true, params: { uploadType: 'multipart', fields: 'id' }, body: mp.body, contentType: mp.contentType });
    return { f: r.id, h: sha, m: mime };
  }
  async function downloadImage(ref) {
    const res = await drive(`/files/${ref.f}`, { params: { alt: 'media' }, raw: true });
    const bytes = new Uint8Array(await res.arrayBuffer());
    const url = `data:${ref.m || 'image/jpeg'};base64,${bytesToB64(bytes)}`;
    if (ref.h && (await sha256(url)) !== ref.h) throw new SyncError('server', '이미지 내용이 달라요');
    return url;
  }
  // 이 기기의 기록 → Drive 기록 (이미지는 파일로 올리고 참조로 바꿔요. 같은 그림이 이미 올라가 있으면 다시 올리지 않아요)
  async function toRemoteRecord(rec, prevRemote, folderId) {
    const out = clone(rec);
    const reuse = new Map();
    if (prevRemote && !isTombLike(prevRemote)) refsOfRecord(prevRemote).forEach((x) => reuse.set(x.h, x));
    const ims = imagesOf(rec);
    for (let n = 0; n < ims.length; n += 1) {
      const im = ims[n];
      S.progress = { label: '이미지 올리는 중', i: (S.progress && S.progress.label === '이미지 올리는 중' ? S.progress.i : 0) + 1, n: (S.progress && S.progress.n) || ims.length };
      renderChip();
      const sha = await imgSha(rec, im);
      const ref = reuse.get(sha) || await imgLimit(() => uploadImage(rec, im, sha, folderId));
      if (im.idx == null) out[im.key] = { $img: ref }; else out[im.key][im.idx] = { $img: ref };
    }
    return out;
  }
  // Drive 기록 → 이 기기 기록 (참조를 이미지로 바꿔요)
  async function fromRemoteRecord(rrec) {
    const out = clone(rrec);
    const jobs = [];
    imageFields(rrec.type).forEach((f) => {
      const v = out[f.key];
      if (f.multi && Array.isArray(v)) v.forEach((x, i) => { if (isRef(x)) jobs.push(imgLimit(() => downloadImage(x.$img)).then((u) => { out[f.key][i] = u; })); });
      else if (isRef(v)) jobs.push(imgLimit(() => downloadImage(v.$img)).then((u) => { out[f.key] = u; }));
    });
    await Promise.all(jobs);
    return out;
  }

  /* ---------------------------------------------------------------------
     5. 무엇을 할지 정하기 (이 기기 ↔ Drive, base 와 비교)
     --------------------------------------------------------------------- */
  function localMap() {
    const m = new Map();
    tombstones.forEach((t) => m.set(t.id, t));
    records.filter(syncable).forEach((r) => m.set(r.id, r));
    return m;
  }
  const remoteMap = (j) => { const m = new Map(); (j.tombs || []).forEach((t) => m.set(t.id, t)); (j.records || []).forEach((r) => m.set(r.id, r)); return m; };
  const tombOf = (t) => ({ id: t.id, type: t.type, date: t.date, deletedAt: t.deletedAt, updatedAt: t.updatedAt });

  async function decide(L, R, b) {
    const lt = isTombLike(L); const rt = isTombLike(R);
    if (!L && !R) return { act: 'skip' };
    if (L && !lt && !R) return { act: 'push' };
    if (!L && R && !rt) return { act: 'pull' };
    if (L && lt && !R) return { act: 'pushDel' };
    if (!L && R && rt) return { act: 'skip' };
    if (lt && rt) return { act: 'skip', both: true };
    const lchg = !b || L.updatedAt !== b.lu || lt !== !!b.ld;
    const rchg = !b || R.updatedAt !== b.ru || rt !== !!b.rd;
    if (!lt && !rt) { // 둘 다 살아 있음
      if (L.type !== R.type) return { act: 'conflict', kind: 'edit' };
      if (b && !lchg && !rchg) return { act: 'skip' };
      if (b && lchg && !rchg) return { act: 'push' };
      if (b && !lchg && rchg) return R.updatedAt < b.ru ? { act: 'push' } : { act: 'pull' }; // Drive가 뒤로 돌아갔다면(다른 기기가 덮어씀) 내 것을 다시 올려요
      if ((await sigLocal(L)) === sigRemote(R)) return { act: 'converge' };
      if (L.type === 'config') return L.updatedAt >= R.updatedAt ? { act: 'push' } : { act: 'pull' }; // 설정은 최신 것으로 자동
      return { act: 'conflict', kind: 'edit' };
    }
    if (!lt && rt) { // 나는 살아 있고 Drive에서는 지웠어요
      if (!b) return { act: 'conflict', kind: 'remoteDeleted' };
      if (!lchg) return { act: 'pullDel' };
      if (!rchg) return { act: 'push' };
      return { act: 'conflict', kind: 'remoteDeleted' };
    }
    // 나는 지웠고 Drive에는 살아 있어요
    if (!b) return { act: 'conflict', kind: 'localDeleted' };
    if (!rchg) return { act: 'pushDel' };
    if (!lchg) return { act: 'pull' };
    return { act: 'conflict', kind: 'localDeleted' };
  }

  async function makePlan(remote, remoteEff) {
    const L = localMap(); const R = remoteMap(remoteEff); const items = [];
    const ids = new Set([...L.keys(), ...R.keys()]);
    for (const id of ids) {
      const l = L.get(id); const r = R.get(id);
      const d = await decide(l, r, S.meta.base[id]);
      items.push({ id, L: l, R: r, ...d });
    }
    return items;
  }

  /* ---------------------------------------------------------------------
     6. 한 번의 동기화
     --------------------------------------------------------------------- */
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('my-journal-sync') : null;
  const tellOtherTabs = () => { try { if (bc) bc.postMessage('changed'); } catch (e) { /* 괜찮아요 */ } };

  function setStatus(st, err) { S.status = st; if (err !== undefined) S.lastError = err; renderChip(); refreshCard(); }

  const pendingCount = () => {
    if (!S.meta) return 0;
    let n = 0; const base = S.meta.base;
    records.filter(syncable).forEach((r) => { const b = base[r.id]; if (!b || b.lu !== r.updatedAt || b.ld) n += 1; });
    tombstones.forEach((t) => { const b = base[t.id]; if (!b || b.lu !== t.updatedAt || !b.ld) n += 1; });
    return n;
  };
  const conflictCount = () => (S.meta ? Object.keys(S.meta.conflicts).length : 0);

  function runSync(reason) {
    if (!S.meta || !S.meta.enabled || envMode() !== 'ok') return Promise.resolve();
    if (S.running) { S.dirty = true; return Promise.resolve(); }
    const body = () => syncBody(reason);
    if (navigator.locks && navigator.locks.request) {
      return navigator.locks.request('my-journal-sync', { ifAvailable: true }, (lock) => (lock ? body() : undefined));
    }
    return body();
  }

  async function syncBody(reason) {
    S.running = true;
    S.lastRunAt = now();
    clearTimeout(S.retryT);
    try {
      if (navigator.onLine === false) throw new SyncError('offline');
      await loadMetaKeepMemory();
      if (S.needReconnect && !tokenValid()) { setStatus('reconnect'); return; }
      setStatus('syncing');
      if (!(await staleGate())) return;
      await ensureToken();
      await pass();
      S.backoffIdx = 0;
      S.meta.lastSyncAt = now();
      S.meta.firstDone = true;
      S.force = null; S.staleOk = false;
      await saveMeta();
      S.progress = null;
      setStatus('idle', '');
      const n = conflictCount();
      if (n && n !== S.conflictsSeen && typeof toast === 'function') toast(`☁ 충돌 ${n}개가 있어요. 위쪽 ☁ 를 눌러 확인해 주세요.`, 6000);
      S.conflictsSeen = n;
    } catch (e) {
      S.progress = null;
      handleError(e);
    } finally {
      S.running = false;
      renderChip();
      if (S.dirty) { S.dirty = false; clearTimeout(S.debounceT); S.debounceT = setTimeout(() => { S.debounceT = null; runSync('again'); }, T.fast ? 20 : 2000); }
    }
  }

  // 다른 탭이 바꿨을 수 있으니, 동기화를 시작할 때 저장된 동기화 정보를 다시 읽어요 (토큰 등 메모리 상태는 그대로)
  async function loadMetaKeepMemory() {
    const m = await Store.get('__meta_sync');
    if (m) { S.meta = { ...emptyMeta(), ...m }; S.meta.base = S.meta.base || {}; S.meta.conflicts = S.meta.conflicts || {}; }
  }

  function handleError(e) {
    if (!(e instanceof SyncError)) { e = new SyncError('fatal', e && e.message); console.error(e); }
    const msg = FRIENDLY[e.kind] || FRIENDLY.fatal;
    switch (e.kind) {
      case 'auth': S.needReconnect = true; setStatus('reconnect', msg); return;
      case 'missing': setStatus('missing', msg); return;
      case 'offline': case 'gis': setStatus('offline', msg); scheduleRetry(); return;
      case 'rate': case 'server': case 'fatal': setStatus('error', msg); scheduleRetry(); return;
      default: setStatus('error', msg); // 사용자가 손봐야 하는 문제(공간 부족·권한 등)는 자동으로 계속 시도하지 않아요
    }
  }
  function scheduleRetry() {
    clearTimeout(S.retryT);
    const base = T.backoff[Math.min(S.backoffIdx, T.backoff.length - 1)];
    S.backoffIdx += 1;
    const wait = T.fast ? 30 : Math.round(base * (0.85 + Math.random() * 0.3));
    S.nextRetryAt = now() + wait;
    S.retryT = setTimeout(() => runSync('retry'), wait);
    renderChip();
  }

  // 마지막 동기화가 오래됐으면(60일 넘게) 합치기 전에 먼저 물어봐요
  async function staleGate() {
    const m = S.meta;
    if (!m.firstDone || !m.lastSyncAt || S.staleOk || S.force) return true;
    if (now() - m.lastSyncAt <= CFG.staleDays * DAY) return true;
    setStatus('stale');
    if (!dlg.open && !dlg2.open && !S.staleShown) { S.staleShown = true; openStale(); } // 자동으로는 한 번만 띄워요 (그 뒤에는 칩을 누르면 열려요)
    return false;
  }

  async function pass() {
    const firstOrForce = !S.meta.firstDone || S.force === 'replaceRemote';
    let folderId = await ensureFolder(firstOrForce || S.createMissing);
    if (!folderId) throw new SyncError('missing');
    let jm = S.meta.journalId ? await journalMeta(S.meta.journalId) : null;
    if (!jm) {
      S.meta.journalId = '';
      const found = await findJournal(folderId);
      if (found) { jm = found; S.meta.journalId = found.id; }
    }
    if (!jm && S.meta.firstDone && !S.createMissing) throw new SyncError('missing');
    for (let round = 0; round < 3; round += 1) {
      const remote = jm ? await getRemote(jm) : emptyJournal();
      const remoteEff = S.force === 'replaceRemote' ? emptyJournal() : remote;
      const items = S.force === 'replaceLocal' ? planReplaceLocal(remote) : await makePlan(remote, remoteEff);
      await applyPulls(items);
      const res = await pushAll(items, remote, jm, folderId);
      if (res === 'retry') { jm = await journalMeta(S.meta.journalId); if (!jm) throw new SyncError('missing'); continue; }
      finishPass(items, remote);
      break;
    }
    S.createMissing = false;
  }
  const emptyJournal = () => ({ app: 'my-journal', kind: 'sync', syncVersion: 1, rev: 0, writtenAt: '', writer: '', records: [], tombs: [] });
  async function getRemote(jm) {
    if (S.remote.journal && S.remote.version === jm.version) return S.remote.journal;
    const j = await downloadJournal(jm.id);
    if (!j || !Array.isArray(j.records)) throw new SyncError('server', 'journal.json 형식이 달라요');
    S.remote = { version: jm.version, journal: j };
    S.meta.remoteVersion = jm.version;
    return j;
  }

  // "Drive 기준으로 새로 받기": 이 기기의 동기화 대상 기록을 Drive 것으로 바꿔요
  function planReplaceLocal(remote) {
    const R = remoteMap(remote); const L = localMap(); const items = [];
    R.forEach((r, id) => { items.push({ id, L: L.get(id), R: r, act: isTombLike(r) ? 'dropLocal' : 'pull', force: true }); });
    L.forEach((l, id) => { if (!R.has(id)) items.push({ id, L: l, R: undefined, act: 'dropLocal', force: true }); });
    return items;
  }

  async function applyPulls(items) {
    const put = []; const tombs = []; const drop = []; let failed = 0;
    const pulls = items.filter((it) => it.act === 'pull');
    let done = 0;
    await Promise.all(pulls.map(async (it) => {
      try {
        const full = await fromRemoteRecord(it.R);
        const cur = localMap().get(it.id);
        // 가져오는 사이에 이 기기에서 또 고쳤다면 덮어쓰지 않아요 (다음 동기화에서 충돌로 알려 줘요)
        if (!it.force && cur && it.L && cur.updatedAt !== it.L.updatedAt) { it.act = 'skip'; it.skipped = true; return; }
        put.push(full); it.applied = true;
      } catch (e) {
        if (e.kind === 'auth') throw e;
        failed += 1; it.act = 'skip'; it.failed = true;
      }
      done += 1;
      S.progress = { label: '기록 받는 중', i: done, n: pulls.length };
      renderChip();
    }));
    items.forEach((it) => {
      if (it.act === 'pullDel' && it.L && !isTombLike(it.L)) { tombs.push(tombOf(it.R)); it.applied = true; }
      if (it.act === 'dropLocal') { drop.push(it.id); it.applied = true; }
    });
    if (put.length || tombs.length || drop.length) {
      await applySyncChanges({ put, tombs, drop });
      tellOtherTabs();
      renderSoon();
    }
    if (failed) { S.pullFailed = failed; }
  }

  async function pushAll(items, remote, jm, folderId) {
    const pushes = items.filter((it) => it.act === 'push' || it.act === 'pushDel');
    const needCreate = !jm;
    if (!pushes.length && !needCreate) return 'nothing';
    const outR = new Map((S.force === 'replaceRemote' ? [] : remote.records || []).map((r) => [r.id, r]));
    const outT = new Map((S.force === 'replaceRemote' ? [] : remote.tombs || []).map((t) => [t.id, t]));
    const prevById = new Map((remote.records || []).map((r) => [r.id, r]));
    const total = pushes.filter((it) => it.act === 'push').reduce((n, it) => n + imagesOf(it.L).length, 0);
    S.progress = total ? { label: '이미지 올리는 중', i: 0, n: total } : null;
    for (const it of pushes) {
      if (it.act === 'push') { outR.set(it.id, await toRemoteRecord(it.L, prevById.get(it.id), folderId)); outT.delete(it.id); } else { outR.delete(it.id); outT.set(it.id, tombOf(it.L)); }
    }
    const cutoff = now() - CFG.tombstoneDays * DAY;
    [...outT.values()].forEach((t) => { if (t.deletedAt < cutoff) outT.delete(t.id); });
    const journal = { app: 'my-journal', kind: 'sync', syncVersion: 1, rev: (remote.rev || 0) + 1, writtenAt: new Date(now()).toISOString(), writer: S.meta.deviceId, records: [...outR.values()], tombs: [...outT.values()] };
    if (jm) { // 올리기 전에 Drive의 버전을 다시 확인해요. 그사이 다른 기기가 올렸다면 처음부터 다시 합쳐요.
      const cur = await journalMeta(jm.id);
      if (!cur) throw new SyncError('missing');
      if (cur.version !== jm.version) { S.remote = { version: '', journal: null }; return 'retry'; }
    }
    const up = await uploadJournal(jm && jm.id, folderId, journal);
    S.meta.journalId = up.id;
    S.meta.remoteVersion = up.version;
    S.remote = { version: up.version, journal };
    // 더 이상 쓰이지 않는 이미지 파일은 휴지통으로
    const keep = refFileIds(journal);
    for (const f of refFileIds(remote)) { if (!keep.has(f)) { try { await trashFile(f); } catch (e) { /* 이미 없어도 괜찮아요 */ } } }
    items.forEach((it) => { if (it.act === 'push' || it.act === 'pushDel') it.applied = true; });
    return 'pushed';
  }

  // 결과를 base 에 적어 두고, 충돌 목록과 오래된 삭제 표시를 정리해요
  function finishPass(items, remote) {
    const base = S.meta.base; const conflicts = {};
    const cutoff = now() - CFG.tombstoneDays * DAY;
    const dropTombs = [];
    items.forEach((it) => {
      const { id, L, R } = it; const lt = isTombLike(L); const rt = isTombLike(R);
      if (it.act === 'conflict') { conflicts[id] = { kind: it.kind, remote: R ? clone(R) : null }; return; }
      if (it.failed || it.skipped) return;
      if (it.act === 'push' || it.act === 'pushDel') base[id] = { lu: L.updatedAt, ld: lt, ru: L.updatedAt, rd: lt };
      else if (it.act === 'pull') base[id] = { lu: R.updatedAt, ld: false, ru: R.updatedAt, rd: false };
      else if (it.act === 'pullDel') base[id] = { lu: R.updatedAt, ld: true, ru: R.updatedAt, rd: true };
      else if (it.act === 'dropLocal') delete base[id];
      else if (it.act === 'converge') base[id] = { lu: L.updatedAt, ld: false, ru: R.updatedAt, rd: false };
      else if (it.act === 'skip' && L && R) base[id] = { lu: L.updatedAt, ld: lt, ru: R.updatedAt, rd: rt };
    });
    // 양쪽에 없는 것은 base 에서 빼요. 60일 지난 삭제 표시는 이 기기에서도 정리해요.
    const live = new Set([...localMap().keys(), ...remoteMap(S.remote.journal || remote).keys()]);
    Object.keys(base).forEach((id) => { if (!live.has(id)) delete base[id]; });
    tombstones.forEach((t) => { if (t.deletedAt < cutoff && base[t.id] && base[t.id].ld) dropTombs.push(t.id); });
    if (dropTombs.length) { applySyncChanges({ drop: dropTombs }); dropTombs.forEach((id) => { delete base[id]; }); }
    S.meta.conflicts = conflicts;
    if (S.pullFailed) { const n = S.pullFailed; S.pullFailed = 0; throw new SyncError('server', `${n}개는 이번에 받지 못했어요`); }
  }

  /* ---------------------------------------------------------------------
     7. 상태 칩 (위쪽) · 설정 창의 카드
     --------------------------------------------------------------------- */
  function ago(t) {
    const m = Math.max(0, Math.round((now() - t) / 60000));
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.round(h / 24)}일 전`;
  }
  function chipModel() {
    const env = envMode();
    if (env === 'file') return { text: '☁ 배포된 주소에서 사용할 수 있어요', cls: 'off', title: '지금은 파일(file://)로 열었어요. 동기화는 배포된 주소에서만 쓸 수 있어요. 기록·백업은 그대로 써져요.' };
    if (env === 'noconfig') return { text: '☁ 설정 필요', cls: 'off', title: 'sync-config.js 에 구글 클라이언트 ID를 넣어야 해요. (README 참고)' };
    if (env === 'insecure') return { text: '☁ https 주소에서 사용할 수 있어요', cls: 'off', title: '동기화는 https:// 또는 localhost 주소에서만 쓸 수 있어요.' };
    if (!S.meta || !S.meta.enabled) return { text: '☁ 로그인', cls: 'off', title: '구글 드라이브와 동기화하려면 눌러 주세요' };
    const pend = pendingCount(); const c = conflictCount();
    if (S.needReconnect || S.status === 'reconnect') return { text: '☁ ⚠ 다시 연결', cls: 'warn', title: '눌러서 다시 로그인하면 쌓인 변경이 바로 올라가요' };
    if (S.status === 'stale') return { text: '☁ ⚠ 오랜만이에요 — 눌러 주세요', cls: 'warn', title: '오랜만에 동기화해요. 어떻게 할지 골라 주세요' };
    if (S.status === 'missing') return { text: '☁ ⚠ Drive 파일이 없어요', cls: 'warn', title: FRIENDLY.missing };
    if (S.status === 'welcome') return { text: '☁ 처음 연결 중…', cls: 'busy', title: '' };
    if (S.status === 'syncing') return { text: `☁ 동기화 중…${S.progress ? ` ${S.progress.label} ${S.progress.i}/${S.progress.n}` : ''}`, cls: 'busy', title: '' };
    if (c) return { text: `☁ ⚠ 충돌 ${c}개`, cls: 'warn', title: '눌러서 어느 쪽을 남길지 골라 주세요' };
    if (S.status === 'offline') return { text: `☁ 대기 중${pend ? ` · ${pend}개` : ''} (오프라인)`, cls: 'busy', title: S.lastError };
    if (S.status === 'error') return { text: '☁ ⚠ 동기화 실패 · 다시 시도할게요', cls: 'err', title: S.lastError };
    if (pend) return { text: `☁ 대기 중 · ${pend}개`, cls: 'busy', title: '곧 올라가요' };
    return { text: `☁ ✓ 동기화됨 · ${S.meta.lastSyncAt ? ago(S.meta.lastSyncAt) : '방금'}`, cls: 'ok', title: '눌러서 자세히 보기' };
  }
  function renderChip() {
    const b = q$('#syncBtn');
    if (!b) return;
    const m = chipModel();
    b.hidden = false;
    b.textContent = m.text;
    b.className = `sync-chip ${m.cls}`;
    b.title = m.title || '';
    b.setAttribute('aria-label', `구글 드라이브 동기화: ${m.text.replace(/^☁\s*/, '')}`);
  }
  function cardHTML() {
    const m = chipModel();
    return `<div class="card" id="syncCard" style="margin:0"><h3>☁ 구글 드라이브 동기화</h3>
      <p class="meta">${esc(m.text.replace(/^☁\s*/, ''))}</p>
      <p class="meta">🎙 녹음은 이 기기에만 저장돼요. (Drive로 올라가지 않아요)</p>
      <button type="button" class="btn ${S.meta && S.meta.enabled ? 'ghost' : ''}" data-sync="detail">☁ 동기화 열기</button></div>`;
  }
  function refreshCard() {
    const c = q$('#syncCard');
    if (c && dlg.open) c.outerHTML = cardHTML();
  }

  /* ---------------------------------------------------------------------
     8. 창들: 자세히 · 로그아웃 · 첫 로그인 · 오랜만이에요 · 충돌
     --------------------------------------------------------------------- */
  const AUDIO_NOTE = '<p class="meta">🎙 <b>녹음은 이 기기에만 저장돼요.</b> Drive로 올라가지 않아요. (백업 파일의 "첫 녹음"과는 별개예요)</p>';

  function openDetail() {
    const env = envMode();
    if (env === 'file') {
      openDlg(`<h2>☁ 구글 드라이브 동기화</h2>
        <p>동기화는 <b>배포된 주소에서 사용할 수 있어요.</b></p>
        <p class="meta">지금은 파일(file://)로 열어서 쓰고 있어요. 이대로도 기록·백업·자동 저장은 <b>전부 그대로</b> 써져요.${CFG.deployUrl ? `<br>배포 주소: ${esc(CFG.deployUrl)}` : ''}<br>배포하는 방법은 README의 「☁ 구글 드라이브 동기화」를 봐 주세요.</p>
        ${AUDIO_NOTE}
        <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`);
      return;
    }
    if (env === 'noconfig' || env === 'insecure') {
      openDlg(`<h2>☁ 구글 드라이브 동기화</h2>
        <p>${env === 'noconfig' ? '<b>sync-config.js</b> 에 구글 클라이언트 ID를 넣으면 쓸 수 있어요.' : '동기화는 <b>https://</b> 주소(또는 localhost)에서만 쓸 수 있어요.'}</p>
        <p class="meta">README의 「☁ 구글 드라이브 동기화 → 구글 설정」을 따라 해 주세요. 그동안 기록·백업은 그대로 써져요.</p>
        ${AUDIO_NOTE}
        <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`);
      return;
    }
    if (!S.meta.enabled) {
      loadGIS().catch(() => { /* 버튼을 눌렀을 때 다시 알려 줘요 */ });
      openDlg(`<h2>☁ 구글 드라이브 동기화</h2>
        <p>내 구글 드라이브에 기록을 저장해서, <b>아이맥과 갤럭시 Z 폴드가 같은 기록</b>을 보게 해요.</p>
        <ul class="meta">
          <li>이 앱이 만든 <b>"${esc(CFG.folderName)}" 폴더</b>만 사용해요. 내 다른 파일은 볼 수 없어요. (권한: drive.file)</li>
          <li>로그인 정보(토큰)는 <b>저장하지 않아요.</b> 창을 닫으면 사라져요.</li>
          <li>처음 로그인하면 <b>이 기기의 백업 파일이 자동으로 내려받아져요.</b></li>
        </ul>
        ${AUDIO_NOTE}
        <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button><button type="button" class="btn" data-sync="login">구글로 로그인</button></div>`);
      return;
    }
    const pend = pendingCount(); const c = conflictCount(); const m = chipModel();
    openDlg(`<h2>☁ 구글 드라이브 동기화</h2>
      <div class="sync-rows">
        <div><span class="meta">계정</span><b>${esc(S.meta.email || '(알 수 없음)')}</b></div>
        <div><span class="meta">상태</span><b>${esc(m.text.replace(/^☁\s*/, ''))}</b></div>
        <div><span class="meta">마지막 동기화</span><b>${S.meta.lastSyncAt ? `${esc(new Date(S.meta.lastSyncAt).toLocaleString('ko-KR'))} (${esc(ago(S.meta.lastSyncAt))})` : '아직 없어요'}</b></div>
        <div><span class="meta">대기 중인 변경</span><b>${pend}개</b></div>
        ${S.status === 'error' || S.status === 'offline' ? `<div><span class="meta">자세히</span><span>${esc(S.lastError)}</span></div>` : ''}
      </div>
      ${AUDIO_NOTE}
      <div class="row" style="margin-top:12px">
        <button type="button" class="btn" data-sync="now" ${S.running ? 'disabled' : ''}>지금 동기화</button>
        <button type="button" class="btn ghost" data-sync="folder">Drive 폴더 열기</button>
        ${c ? `<button type="button" class="btn ghost purple" data-sync="conflicts">충돌 ${c}개 보기</button>` : ''}
        <button type="button" class="btn danger" data-sync="logout">로그아웃</button>
      </div>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`);
  }

  async function openFolder() {
    try {
      const f = await drive(`/files/${S.meta.folderId}`, { params: { fields: 'webViewLink' } });
      if (f && f.webViewLink) window.open(f.webViewLink, '_blank', 'noopener');
    } catch (e) { toast('폴더 주소를 가져오지 못했어요. 잠시 뒤에 다시 눌러 주세요.', 3500); }
  }

  /* ---- 로그인 ---- */
  function login() { // 버튼을 누르는 그 순간에 로그인 창을 열어야 브라우저가 막지 않아요 (그래서 await 전에 요청해요)
    if (envMode() !== 'ok') { openDetail(); return; }
    if (!gisReady()) { loadGIS().then(() => toast('로그인 도구를 불러왔어요. 한 번 더 눌러 주세요.', 3000), () => toast(FRIENDLY.gis, 4000)); return; }
    requestToken({ prompt: '' }).then(async () => {
      let email = '';
      try { email = await fetchEmail(); } catch (e) { /* 이메일 표시는 없어도 돼요 */ }
      const keepDevice = S.meta.deviceId; const last = S.meta.last;
      const same = !!(last && last.email && last.email === email && last.firstDone); // 로그아웃했던 그 계정이면 이어서 써요
      S.meta = { ...emptyMeta(), deviceId: keepDevice, enabled: true, email, ...(same ? { base: last.base, folderId: last.folderId, journalId: last.journalId, firstDone: true, lastSyncAt: last.lastSyncAt, conflicts: last.conflicts || {} } : {}) };
      S.needReconnect = false; S.remote = { version: '', journal: null };
      await saveMeta();
      closeDlg(); // 로그인 안내 창을 닫아요
      renderChip();
      if (same) { toast('☁ 다시 연결했어요. 이어서 동기화해요', 3500); await runSync('login'); } else await firstLogin();
    }).catch((e) => { toast(FRIENDLY[e.kind] || FRIENDLY.auth, 5000); renderChip(); });
  }
  function reconnectNow() { // 칩 한 번 누르기 → 바로 로그인 창 (중간 확인 창 없이). 성공하면 쌓인 변경을 바로 올려요.
    if (!gisReady()) { loadGIS().then(() => toast('로그인 도구를 불러왔어요. 한 번 더 눌러 주세요.', 3000), () => toast(FRIENDLY.gis, 4000)); return; }
    requestToken({ prompt: '', hint: S.meta.email }).then(() => {
      S.needReconnect = false;
      setStatus('idle', '');
      return runSync('reconnect');
    }).catch((e) => { toast(FRIENDLY[e.kind] || FRIENDLY.auth, 5000); renderChip(); });
  }

  /* ---- 처음 로그인 ---- */
  async function firstLogin() {
    setStatus('welcome');
    try {
      const real = records.filter(syncable);
      if (real.length && !S.backedUp) { await downloadBackup(`my-journal-backup-before-sync-${todayStr().replace(/-/g, '')}.json`); S.backedUp = true; } // 먼저 이 기기 백업 (같은 창 세션에서는 한 번만)
      const folderId = await ensureFolder(false);
      const jm = folderId ? await findJournal(folderId) : null;
      let remote = emptyJournal();
      if (jm) { S.meta.journalId = jm.id; remote = await getRemote(jm); }
      const rn = (remote.records || []).length;
      if (!rn || !real.length) {
        if (rn) toast(`☁ Drive의 기록 ${rn}개를 받아요`, 4000); else if (real.length) toast(`☁ 이 기기의 기록 ${real.length}개를 Drive에 올려요`, 4000);
        S.meta.firstDone = false; await saveMeta();
        await runSync('login');
        return;
      }
      openDlg(`<h2>☁ 처음 연결했어요</h2>
        <p>이 기기에 기록 <b>${real.length}개</b>, Drive에 기록 <b>${rn}개</b>가 있어요. 어떻게 할까요?</p>
        <div class="fl-opts">
          <button type="button" class="btn" data-sync="fl-merge">합치기 <small>(추천)</small></button>
          <p class="meta">양쪽 기록을 모두 남겨요. 같은 기록이 다르게 적혀 있을 때만 어느 쪽을 남길지 물어봐요.</p>
          <button type="button" class="btn danger" data-sync="fl-upload">이 기기 → Drive 로 덮어쓰기</button>
          <p class="meta">Drive에 있던 기록이 이 기기 기록으로 바뀌어요. (Drive 폴더의 "버전 관리"에서 한동안 되돌릴 수 있어요)</p>
          <button type="button" class="btn danger" data-sync="fl-download">Drive → 이 기기 로 덮어쓰기</button>
          <p class="meta">이 기기의 기록이 Drive 기록으로 바뀌어요. 방금 이 기기 백업 파일을 내려받았어요.</p>
        </div>
        <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">나중에</button></div>`);
      setStatus('welcome');
    } catch (e) { handleError(e); }
  }
  async function firstChoice(kind) {
    if (kind === 'fl-upload' && !confirm('Drive에 있던 기록이 이 기기 기록으로 바뀌어요.\n계속할까요?')) return;
    if (kind === 'fl-download' && !confirm('이 기기의 기록이 Drive 기록으로 바뀌어요.\n(이 기기 백업 파일은 이미 내려받았어요)\n계속할까요?')) return;
    closeDlg();
    S.force = kind === 'fl-upload' ? 'replaceRemote' : kind === 'fl-download' ? 'replaceLocal' : null;
    S.meta.firstDone = false;
    await saveMeta();
    await runSync('login');
  }

  /* ---- 오랜만이에요 ---- */
  function openStale() {
    const days = Math.floor((now() - S.meta.lastSyncAt) / DAY);
    openDlg(`<h2>☁ 오랜만이에요</h2>
      <p>마지막 동기화가 <b>${days}일 전</b>이에요. 지운 기록의 흔적은 ${CFG.tombstoneDays}일 뒤에 정리돼서, 그대로 합치면 예전에 지운 기록이 되살아날 수 있어요.</p>
      <p><b>Drive 기준으로 새로 받을까요?</b></p>
      <div class="fl-opts">
        <button type="button" class="btn" data-sync="stale-fresh">Drive 기준으로 새로 받기 <small>(추천)</small></button>
        <p class="meta">이 기기의 기록이 Drive 기록으로 바뀌어요. <b>먼저 이 기기 백업 파일을 자동으로 내려받아요.</b></p>
        <button type="button" class="btn ghost" data-sync="stale-merge">그래도 합치기</button>
        <p class="meta">이 기기에서 바꾼 것도 그대로 남기면서 합쳐요.</p>
      </div>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">나중에</button></div>`);
  }
  async function staleChoice(kind) {
    closeDlg();
    if (kind === 'stale-fresh') {
      try { await downloadBackup(`my-journal-backup-before-refresh-${todayStr().replace(/-/g, '')}.json`); } catch (e) { toast('백업 파일을 만들지 못해서 멈췄어요.', 4000); return; }
      S.force = 'replaceLocal';
    } else S.staleOk = true;
    await runSync('stale');
  }

  /* ---- Drive 파일이 사라졌을 때 ---- */
  function openMissing() {
    openDlg(`<h2>☁ Drive에서 파일이 사라졌어요</h2>
      <p>"${esc(CFG.folderName)}" 폴더나 <b>journal.json</b>을 찾지 못했어요. Drive에서 지웠거나 옮겼을 수 있어요.</p>
      <p class="meta"><b>이 기기의 기록은 그대로예요.</b> 이 기기의 기록으로 Drive에 다시 만들까요?</p>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">나중에</button><button type="button" class="btn" data-sync="recreate">이 기기 기록으로 다시 만들기</button></div>`);
  }

  /* ---- 로그아웃 ---- */
  function openLogout() {
    const pend = pendingCount();
    openDlg(`<h2>☁ 로그아웃</h2>
      <p>구글 연결을 끊고 로그인 정보를 지워요. <b>이 기기의 기록은 그대로 남겨요.</b></p>
      ${pend ? `<p class="meta" style="color:var(--red)">아직 Drive에 올라가지 않은 변경이 ${pend}개 있어요. 먼저 "지금 동기화"를 하는 걸 권해요.</p>` : ''}
      <div class="fl-opts">
        <button type="button" class="btn" data-sync="logout-keep">로그아웃 (이 기기 기록은 남기기)</button>
        <button type="button" class="btn danger" data-sync="logout-wipe">로그아웃하고 이 기기의 기록도 지우기</button>
        <p class="meta">지우기 전에 백업 파일을 자동으로 내려받아요. 🎙 녹음은 이 기기에만 있어서 지우지 않아요.</p>
      </div>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">취소</button></div>`);
  }
  async function doLogout(wipe) {
    if (wipe) {
      if (!confirm('이 기기의 기록을 지울까요?\n(백업 파일을 먼저 내려받아요. Drive의 기록은 그대로예요.)')) return;
      try { await downloadBackup(`my-journal-backup-before-wipe-${todayStr().replace(/-/g, '')}.json`); } catch (e) { toast('백업 파일을 만들지 못해서 멈췄어요.', 4000); return; }
    }
    const tok = S.token;
    try {
      if (gisReady()) {
        let t = tok;
        if (!t) { try { t = await requestToken({ prompt: 'none', hint: S.meta.email }); } catch (e) { t = null; } }
        if (t) await new Promise((res) => { try { google.accounts.oauth2.revoke(t, () => res()); } catch (e) { res(); } });
      }
    } catch (e) { /* 취소하지 못해도 이 기기에서는 끊어요 */ }
    S.token = null; S.tokenExp = 0; S.needReconnect = false; S.remote = { version: '', journal: null };
    clearTimeout(S.debounceT); clearTimeout(S.retryT);
    const keepDevice = S.meta.deviceId; const m0 = S.meta;
    S.meta = { ...emptyMeta(), deviceId: keepDevice, email: m0.email, last: wipe ? null : { email: m0.email, base: m0.base, folderId: m0.folderId, journalId: m0.journalId, firstDone: m0.firstDone, lastSyncAt: m0.lastSyncAt, conflicts: m0.conflicts } };
    await saveMeta();
    if (wipe) {
      await Store.remove([...records.map((r) => r.id), ...tombstones.map((t) => t.id)]);
      records = []; tombstones = [];
    }
    setStatus('idle', '');
    closeDlg();
    renderSoon();
    tellOtherTabs();
    toast(wipe ? '☁ 로그아웃했어요. 이 기기의 기록도 지웠어요.' : '☁ 로그아웃했어요. 이 기기의 기록은 그대로예요.', 4500);
  }

  /* ---- 충돌 ---- */
  const HIDE_KEYS = new Set(['id', 'type', 'createdAt', 'updatedAt', 'sample', 'stamp', 'quick', 'deletedAt']);
  const typeLabel = (t) => (SCHEMAS[t] ? SCHEMAS[t].label : t);
  function labelOf(type, key) {
    const f = ((SCHEMAS[type] && SCHEMAS[type].fields) || []).find((x) => x.key === key || (x.keys && x.keys.includes(key)));
    return f ? String(f.label).replace(/\s*-\s*선택$/, '') : key;
  }
  function fmtVal(v) {
    if (v == null || v === '') return '(비어 있음)';
    if (isRef(v) || isB64(v)) return '🖼 그림';
    if (Array.isArray(v)) return v.length ? v.map(fmtVal).join(', ') : '(비어 있음)';
    if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}: ${fmtVal(x)}`).join(' · ');
    return String(v);
  }
  function titleOf(rec) {
    if (!rec) return '';
    const k = { violin: 'piece', art: 'topic', englishArticle: 'title', workout: 'kind', rest: 'memo', econRoutine: 'note', claudeFeedback: 'todo', piecenote: 'piece' }[rec.type];
    return (k && rec[k]) || '';
  }
  async function valSigLocal(rec, k, v) {
    const f = imageFields(rec.type).find((x) => x.key === k);
    if (f && f.multi && Array.isArray(v)) return JSON.stringify(await Promise.all(v.map(async (x, i) => (isB64(x) ? { $h: await imgSha(rec, { key: k, idx: i, value: x }) } : x))));
    if (f && !f.multi && isB64(v)) return JSON.stringify({ $h: await imgSha(rec, { key: k, idx: null, value: v }) });
    return JSON.stringify(stable(v === undefined ? null : v));
  }
  function valSigRemote(v) { const conv = (x) => (isRef(x) ? { $h: x.$img.h } : Array.isArray(x) ? x.map(conv) : x); return JSON.stringify(stable(conv(v === undefined ? null : v))); }

  async function conflictCard(id, c) {
    const L = localMap().get(id); const R = c.remote;
    const kindText = { edit: '양쪽에서 다르게 고쳤어요', remoteDeleted: 'Drive에서는 지웠고, 이 기기에서는 고쳤어요', localDeleted: '이 기기에서는 지웠고, Drive에서는 고쳤어요' }[c.kind] || '';
    const lt = isTombLike(L); const rt = isTombLike(R);
    const head = `${typeLabel((L && L.type) || (R && R.type))} · ${(L && L.date) || (R && R.date) || ''}${titleOf(rt ? L : R) || titleOf(L) ? ` · ${esc(titleOf(rt ? L : R) || titleOf(L))}` : ''}`;
    let rows = '';
    if (!lt && !rt && L && R) {
      const keys = [...new Set([...Object.keys(L), ...Object.keys(R)])].filter((k) => !HIDE_KEYS.has(k));
      for (const k of keys) {
        if ((await valSigLocal(L, k, L[k])) === valSigRemote(R[k])) continue;
        const lv = imageFields(L.type).some((f) => f.key === k) && L[k] ? `<div class="cf-thumbs">${[].concat(L[k]).filter(isB64).map((u) => `<img src="${esc(u)}" alt="이 기기의 그림">`).join('')}</div>` : esc(fmtVal(L[k]));
        const rv = imageFields(R.type).some((f) => f.key === k) && R[k] ? `<div class="cf-thumbs">${[].concat(R[k]).filter(isRef).map((x) => `<img data-fid="${esc(x.$img.f)}" data-mime="${esc(x.$img.m || 'image/jpeg')}" alt="Drive의 그림" src="">`).join('')}</div>` : esc(fmtVal(R[k]));
        rows += `<div class="cf-row"><div class="cf-k">${esc(labelOf(L.type, k))}</div><div class="cf-l pre">${lv}</div><div class="cf-r pre">${rv}</div></div>`;
      }
    } else if (lt) {
      rows = `<div class="cf-row"><div class="cf-k">상태</div><div class="cf-l">이 기기에서 지웠어요</div><div class="cf-r pre">${esc(Object.keys(R || {}).filter((k) => !HIDE_KEYS.has(k)).map((k) => `${labelOf(R.type, k)}: ${fmtVal(R[k])}`).join('\n'))}</div></div>`;
    } else if (rt) {
      rows = `<div class="cf-row"><div class="cf-k">상태</div><div class="cf-l pre">${esc(Object.keys(L || {}).filter((k) => !HIDE_KEYS.has(k)).map((k) => `${labelOf(L.type, k)}: ${fmtVal(L[k])}`).join('\n'))}</div><div class="cf-r">Drive에서 지웠어요</div></div>`;
    }
    const btns = c.kind === 'edit'
      ? `<button type="button" class="btn small" data-sync="cf-local" data-id="${esc(id)}">이 기기 것으로</button>
         <button type="button" class="btn small" data-sync="cf-remote" data-id="${esc(id)}">Drive 것으로</button>
         <button type="button" class="btn small ghost" data-sync="cf-both" data-id="${esc(id)}">둘 다 남기기</button>`
      : c.kind === 'localDeleted'
        ? `<button type="button" class="btn small" data-sync="cf-local" data-id="${esc(id)}">삭제 유지하기</button><button type="button" class="btn small" data-sync="cf-remote" data-id="${esc(id)}">Drive 것 되살리기</button>`
        : `<button type="button" class="btn small" data-sync="cf-local" data-id="${esc(id)}">이 기기 것 남기기</button><button type="button" class="btn small" data-sync="cf-remote" data-id="${esc(id)}">Drive 따라 지우기</button>`;
    return `<div class="card cf-card" data-cf="${esc(id)}"><div class="cf-head"><b>${head}</b><span class="meta">${esc(kindText)}</span></div>
      <div class="cf-cols"><div class="cf-colh">이 기기</div><div class="cf-colh">Drive</div></div>${rows || '<p class="meta">내용은 같은데 저장 시각만 달라요.</p>'}
      <div class="row" style="margin-top:8px">${btns}</div></div>`;
  }
  async function openConflicts() {
    const ids = Object.keys(S.meta.conflicts);
    if (!ids.length) { openDetail(); return; }
    const cards = [];
    for (const id of ids) cards.push(await conflictCard(id, S.meta.conflicts[id]));
    openDlg(`<h2>☁ 충돌 ${ids.length}개</h2>
      <p class="meta">두 기기에서 같은 기록을 다르게 바꿨어요. 어느 쪽을 남길지 골라 주세요. 고르기 전까지 이 기기의 기록은 그대로예요.</p>
      ${cards.join('')}
      <div class="row" style="margin-top:8px"><button type="button" class="btn ghost" data-sync="cf-newest">남은 것 모두 최신 시각 것으로</button></div>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, 'wide');
    loadRemoteThumbs();
  }
  async function loadRemoteThumbs() {
    for (const img of document.querySelectorAll('#dlg img[data-fid]')) {
      try { img.src = await downloadImage({ f: img.dataset.fid, m: img.dataset.mime }); } catch (e) { img.alt = '(Drive 그림을 불러오지 못했어요)'; }
    }
  }
  const bumpAbove = (rec, ru) => Math.max(now(), (rec.updatedAt || 0) + 1, (ru || 0) + 1);
  async function resolveConflict(id, choice, quiet = false) {
    const c = S.meta.conflicts[id]; if (!c) return;
    const L = localMap().get(id); const R = c.remote; const base = S.meta.base;
    try {
      if (choice === 'cf-local' || choice === 'cf-both') {
        if (c.kind === 'localDeleted') {
          const t = { ...tombOf(L), updatedAt: bumpAbove(L, R && R.updatedAt) };
          await applySyncChanges({ tombs: [t] });
          base[id] = { lu: 0, ld: false, ru: R.updatedAt, rd: false };
        } else {
          const rec = { ...L, updatedAt: bumpAbove(L, R && R.updatedAt) };
          await applySyncChanges({ put: [rec] });
          base[id] = { lu: 0, ld: false, ru: R.updatedAt, rd: isTombLike(R) };
        }
        if (choice === 'cf-both' && R && !isTombLike(R)) {
          const copy = await fromRemoteRecord(R);
          const tk = { violin: 'piece', art: 'topic', englishArticle: 'title', workout: 'memo', rest: 'memo', econRoutine: 'note', claudeFeedback: 'text', piecenote: 'memo' }[copy.type] || 'memo';
          copy.id = newId(); copy.createdAt = Date.now(); copy[tk] = `${copy[tk] || ''} (Drive에서 온 사본)`.trim();
          delete copy.stamp;
          await saveRecord(copy);
        }
      } else if (choice === 'cf-remote') {
        if (isTombLike(R)) { await applySyncChanges({ tombs: [tombOf(R)] }); base[id] = { lu: R.updatedAt, ld: true, ru: R.updatedAt, rd: true }; } else {
          const full = await fromRemoteRecord(R);
          await applySyncChanges({ put: [full] });
          base[id] = { lu: R.updatedAt, ld: false, ru: R.updatedAt, rd: false };
        }
      }
      delete S.meta.conflicts[id];
      await saveMeta();
      tellOtherTabs(); renderSoon(); renderChip();
    } catch (e) { toast('충돌을 풀지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.', 4000); return; }
    if (quiet) return;
    if (conflictCount()) openConflicts(); else { closeDlg(); toast('☁ 충돌을 모두 풀었어요. 동기화할게요.', 3000); }
    runSync('resolved');
  }
  async function resolveAllNewest() {
    for (const id of Object.keys(S.meta.conflicts)) {
      const c = S.meta.conflicts[id]; const L = localMap().get(id); const R = c.remote;
      const localNewer = !R || (L && L.updatedAt >= R.updatedAt);
      await resolveConflict(id, localNewer ? 'cf-local' : 'cf-remote', true);
    }
    closeDlg();
    toast('☁ 충돌을 모두 풀었어요. 동기화할게요.', 3000);
    runSync('resolved');
  }

  /* ---------------------------------------------------------------------
     9. 클릭 처리 · 시작
     --------------------------------------------------------------------- */
  function onChipClick() {
    const env = envMode();
    if (env !== 'ok' || !S.meta.enabled) { openDetail(); return; }
    if (S.needReconnect || S.status === 'reconnect') { reconnectNow(); return; } // 한 번 누르면 바로 로그인 창
    if (S.status === 'stale') { openStale(); return; }
    if (S.status === 'missing') { openMissing(); return; }
    if (S.status === 'welcome') { firstLogin(); return; }
    if (conflictCount()) { openConflicts(); return; }
    openDetail();
  }
  document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('#syncBtn');
    if (chip) { onChipClick(); return; }
    const b = e.target.closest && e.target.closest('[data-sync]');
    if (!b) return;
    const act = b.dataset.sync;
    switch (act) {
      case 'detail': openDetail(); break;
      case 'login': login(); break; // await 없이 바로 (로그인 창이 막히지 않게)
      case 'now':
        if (S.needReconnect && !tokenValid()) { closeDlg(); reconnectNow(); break; } // 로그인이 풀려 있으면 바로 로그인 창을 열어요
        closeDlg(); S.backoffIdx = 0; runSync('manual');
        break;
      case 'folder': openFolder(); break;
      case 'logout': openLogout(); break;
      case 'logout-keep': doLogout(false); break;
      case 'logout-wipe': doLogout(true); break;
      case 'conflicts': openConflicts(); break;
      case 'fl-merge': case 'fl-upload': case 'fl-download': firstChoice(act); break;
      case 'stale-fresh': case 'stale-merge': staleChoice(act); break;
      case 'recreate': closeDlg(); S.createMissing = true; S.meta.journalId = ''; S.meta.base = {}; runSync('recreate'); break;
      case 'cf-local': case 'cf-remote': case 'cf-both': resolveConflict(b.dataset.id, act); break;
      case 'cf-newest': resolveAllNewest(); break;
      default: break;
    }
  });

  function notify() {
    tellOtherTabs(); // 같은 브라우저의 다른 탭 화면도 바뀐 기록을 보게 해요
    renderChip();
    if (!S.meta || !S.meta.enabled || envMode() !== 'ok' || S.needReconnect) return;
    clearTimeout(S.debounceT);
    S.debounceT = setTimeout(() => { S.debounceT = null; runSync('save'); }, T.fast ? 60 : T.debounce); // 저장하고 잠깐 뒤에 한 번에 올려요
  }

  function purgeOldTombs() { // 동기화를 안 쓰는 동안에도 60일 지난 삭제 표시는 정리해요
    const cutoff = now() - CFG.tombstoneDays * DAY;
    const old = tombstones.filter((t) => t.deletedAt < cutoff && (!S.meta.enabled || (S.meta.base[t.id] && S.meta.base[t.id].ld)));
    if (old.length) applySyncChanges({ drop: old.map((t) => t.id) });
  }

  async function boot() {
    await loadMeta();
    renderChip();
    if (bc) bc.onmessage = () => { // 다른 탭이 바꿨어요 → 저장된 것을 다시 읽어 와요 (몰려 와도 한 번만)
      clearTimeout(S.bcT);
      S.bcT = setTimeout(async () => { records = await loadRecords(); await loadMeta(); renderSoon(); renderChip(); }, 200);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !S.meta || !S.meta.enabled || envMode() !== 'ok') return;
      if (S.needReconnect) { S.needReconnect = false; ensureToken().then(() => runSync('focus')).catch(() => renderChip()); return; } // 그사이 구글에 로그인했다면 조용히 이어져요
      if (now() - S.lastRunAt > T.refocus) runSync('focus');
      renderChip();
    });
    window.addEventListener('online', () => { S.backoffIdx = 0; if (S.meta && S.meta.enabled) runSync('online'); });
    window.addEventListener('offline', () => { if (S.meta && S.meta.enabled) setStatus('offline', FRIENDLY.offline); });
    setInterval(renderChip, 60000); // "N분 전" 갱신
    purgeOldTombs();
    if (envMode() !== 'ok' || !S.meta.enabled) return;
    loadGIS().catch(() => { /* 오프라인이면 나중에 다시 해요 */ });
    const go = () => { if (S.meta.firstDone) runSync('open'); else if (S.meta.enabled) firstLogin(); };
    if (window.__cleanupDone) go(); else { document.addEventListener('journal:cleanup-done', go, { once: true }); setTimeout(() => { if (!window.__cleanupDone) go(); }, 20000); }
  }
  if (window.__journalReady) boot(); else document.addEventListener('journal:ready', boot, { once: true });

  window.Sync = {
    notify, cardHTML, isEnabled: () => !!(S.meta && S.meta.enabled), openDetail,
    // 자동 시험용 (화면에서는 쓰지 않아요)
    __t: {
      S, T, CFG, runSync, envMode, chipModel, pendingCount, conflictCount, loadMeta, saveMeta, firstLogin, decide, sigLocal, sigRemote,
      setNow: (fn) => { nowFn = fn; }, resetNow: () => { nowFn = () => Date.now(); }, gisReady, requestToken,
    },
  };
})();
