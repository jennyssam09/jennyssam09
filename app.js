'use strict';

/* =====================================================================
   나의 기록장
   ---------------------------------------------------------------------
   ✏️ 글자를 바꾸고 싶다면 바로 아래 "1. 설정" 부분만 고치면 돼요.
      - label  : 화면에 보이는 항목 이름
      - options: 고르기 목록 (예: 운동 종류) - 따옴표 안의 글자만 바꾸거나 추가하세요
      - required: true 이면 꼭 써야 하는 칸
   ⚠️ 따옴표(' ')와 쉼표(,)는 지우지 않게 조심해 주세요.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. 설정 (항목 이름과 선택지)
   --------------------------------------------------------------------- */
const SCHEMAS = {
  // 운동 기록
  workout: {
    label: '운동 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['요가', '슬로조깅'], required: true },
      { key: 'minutes', label: '시간 (분)', type: 'number', min: 1, step: 1, required: true },
      { key: 'distance', label: '거리 (km) - 선택', type: 'number', min: 0, step: 0.01 },
      { key: 'condition', label: '컨디션', type: 'select', options: ['좋음', '보통', '피곤함'] },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
  },
  // 바이올린 기록
  violin: {
    label: '바이올린 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'piece', label: '곡', type: 'text', required: true },
      { key: 'minutes', label: '연습 시간 (분)', type: 'number', min: 1, step: 1, required: true },
      { key: 'part', label: '연습한 부분', type: 'textarea' },
      { key: 'hard', label: '어려웠던 점', type: 'textarea' },
      { key: 'next', label: '다음 연습 목표', type: 'textarea' },
    ],
  },
  // 경제 공부 메모
  study: {
    label: '경제 공부 메모',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'topic', label: '주제', type: 'text', required: true },
      { key: 'learned', label: '배운 내용', type: 'textarea' },
      { key: 'links', label: '참고 링크', type: 'textarea', hint: '한 줄에 링크 하나씩 적어 주세요.' },
    ],
  },
  // 투자 기록 (기록과 복기 전용 - 추천·주문 기능 없음)
  invest: {
    label: '투자 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'asset', label: '관심 자산 / 종목', type: 'text', required: true },
      { key: 'thought', label: '당시 생각과 근거', type: 'textarea' },
      { key: 'check', label: '확인하고 싶은 점', type: 'textarea' },
      { key: 'review', label: '나중에 돌아본 결과', type: 'textarea', hint: '시간이 지난 뒤에 이 칸을 채워 보세요. 처음엔 비워 둬도 돼요.' },
    ],
  },
  // 그림 발전 기록
  art: {
    label: '그림 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'image', label: '그림 이미지', type: 'image' },
      { key: 'topic', label: '연습 주제', type: 'text', required: true },
      { key: 'tools', label: '사용한 도구', type: 'text' },
      { key: 'tried', label: '새로 시도한 점', type: 'textarea' },
      { key: 'hard', label: '어려웠던 점', type: 'textarea' },
      { key: 'next', label: '다음 목표', type: 'textarea' },
    ],
  },
};

// 메뉴 이름 (위쪽 탭)
const TABS = [
  { id: 'body', label: '🧘 운동·바이올린' },
  { id: 'econ', label: '📚 경제 공부·투자' },
  { id: 'art', label: '🎨 그림 기록' },
];

// 사진을 저장할 때 긴 변의 최대 크기(픽셀). 커질수록 선명하지만 저장 공간을 더 써요.
const IMAGE_MAX_SIZE = 1600;

/* ---------------------------------------------------------------------
   2. 작은 도구들 (날짜, 글자 처리)
   --------------------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toStr(d); };
const todayStr = () => toStr(new Date());
const mondayOf = (s) => addDays(s, -((parseDate(s).getDay() + 6) % 7));
const dayLabel = (s) => {
  const d = parseDate(s);
  const y = d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}년 `;
  return `${y}${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
};
const shortDay = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const fmtNum = (n) => (Math.round(n * 100) / 100).toString();
const byNewest = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0);
const byOldest = (a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0);

// 여러 줄 글자를 화면에 안전하게 보여주기 (내용이 비어 있으면 아무것도 안 보여줘요)
function textBlock(label, value) {
  if (!value) return '';
  return `<div class="label">${esc(label)}</div><p class="pre">${esc(value)}</p>`;
}

// 링크 목록: http(s)로 시작하거나 주소처럼 보이는 줄만 클릭 가능한 링크로 바꿔요
function linksBlock(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return '';
  const html = lines.map((line) => {
    let url = null;
    if (/^https?:\/\/\S+$/i.test(line)) url = line;
    else if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(line)) url = `https://${line}`;
    return url
      ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(line)}</a>`
      : esc(line);
  }).join('<br>');
  return `<div class="label">참고 링크</div><p class="pre">${html}</p>`;
}

/* ---------------------------------------------------------------------
   3. 저장소
      기본: 브라우저의 IndexedDB (그림 이미지도 저장 가능)
      IndexedDB를 못 쓰는 환경이면 localStorage로 대신 저장해요.
   --------------------------------------------------------------------- */
const Store = {
  mode: 'indexeddb',
  db: null,

  async init() {
    try {
      if (!window.indexedDB) throw new Error('no indexedDB');
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('my-journal', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('records', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('blocked'));
      });
    } catch (err) {
      this.mode = 'localstorage';
      try { localStorage.getItem('x'); } catch (e2) { this.mode = 'memory'; }
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  },

  _tx(mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('records', mode);
      const store = tx.objectStore('records');
      const result = fn(store);
      tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  },

  _lsRead() { try { return JSON.parse(localStorage.getItem('journal.records') || '[]'); } catch (e) { return []; } },
  _lsWrite(list) { localStorage.setItem('journal.records', JSON.stringify(list)); },
  _mem: [],

  async all() {
    if (this.mode === 'indexeddb') return this._tx('readonly', (s) => s.getAll());
    return this.mode === 'localstorage' ? this._lsRead() : this._mem.slice();
  },
  async putMany(list) {
    if (this.mode === 'indexeddb') return this._tx('readwrite', (s) => { list.forEach((r) => s.put(r)); });
    const map = new Map((this.mode === 'localstorage' ? this._lsRead() : this._mem).map((r) => [r.id, r]));
    list.forEach((r) => map.set(r.id, r));
    const merged = [...map.values()];
    if (this.mode === 'localstorage') this._lsWrite(merged); else this._mem = merged;
  },
  async remove(ids) {
    if (this.mode === 'indexeddb') return this._tx('readwrite', (s) => { ids.forEach((id) => s.delete(id)); });
    const keep = (this.mode === 'localstorage' ? this._lsRead() : this._mem).filter((r) => !ids.includes(r.id));
    if (this.mode === 'localstorage') this._lsWrite(keep); else this._mem = keep;
  },
};

/* ---------------------------------------------------------------------
   4. 앱 상태
   --------------------------------------------------------------------- */
let records = [];   // 전체 기록 (메모리에 복사해 두고 화면에 사용)
let seeded = false; // 예시 기록을 이미 한 번 넣었는지

const ui = {
  tab: 'body',
  weekOffset: 0,      // 0 = 이번 주, -1 = 지난 주 ...
  bodyFilter: 'all',  // all | workout | violin
  bodyAllRange: true, // true = 전체 기간, false = 선택한 주만
  econTab: 'study',   // study | invest
  query: '',
  artView: 'book',    // book | compare
  artOrder: 'newest', // newest | oldest
  cmpA: null,
  cmpB: null,
};
try {
  const saved = localStorage.getItem('journal.tab');
  if (TABS.some((t) => t.id === saved)) ui.tab = saved;
} catch (e) { /* 저장 못 해도 괜찮아요 */ }

const ofType = (type) => records.filter((r) => r.type === type);

/* ---------------------------------------------------------------------
   5. 기록 저장/수정/삭제
   --------------------------------------------------------------------- */
async function saveRecord(rec) {
  try {
    await Store.putMany([rec]);
  } catch (err) {
    alert('저장하지 못했어요. 저장 공간이 부족할 수 있어요. (그림 파일이 너무 크지 않은지 확인해 주세요.)');
    return false;
  }
  const i = records.findIndex((r) => r.id === rec.id);
  if (i >= 0) records[i] = rec; else records.push(rec);
  return true;
}

async function deleteRecord(id) {
  await Store.remove([id]);
  records = records.filter((r) => r.id !== id);
}

/* ---------------------------------------------------------------------
   6. 예시 기록 (처음 한 번만 들어가요. ⚙ 백업·설정 에서 한 번에 지울 수 있어요)
   --------------------------------------------------------------------- */
function svgUrl(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fbf8f0"/>${inner}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const SAMPLE_IMAGES = {
  outline: svgUrl('<circle cx="140" cy="150" r="70" fill="none" stroke="#555" stroke-width="2"/><rect x="230" y="100" width="100" height="100" fill="none" stroke="#555" stroke-width="2"/><text x="20" y="284" font-size="14" fill="#999">예시 그림 (선만 그림)</text>'),
  shaded: svgUrl('<defs><radialGradient id="g" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#f4efe4"/><stop offset="1" stop-color="#6b6558"/></radialGradient></defs><ellipse cx="170" cy="225" rx="80" ry="14" fill="#d9d2c2"/><circle cx="140" cy="150" r="70" fill="url(#g)" stroke="#555" stroke-width="2"/><rect x="230" y="100" width="100" height="100" fill="#e6dfd0" stroke="#555" stroke-width="2"/><text x="20" y="284" font-size="14" fill="#999">예시 그림 (명암 연습)</text>'),
  color: svgUrl('<defs><radialGradient id="g" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#b5683a"/></radialGradient></defs><ellipse cx="200" cy="235" rx="120" ry="16" fill="#e3d6c0"/><circle cx="200" cy="150" r="80" fill="url(#g)" stroke="#7a4a2a" stroke-width="2"/><text x="20" y="284" font-size="14" fill="#999">예시 그림 (색 넣기)</text>'),
};

function buildSamples() {
  const t = todayStr();
  const d = (n) => addDays(t, -n);
  const now = Date.now();
  let seq = 0;
  const mk = (type, date, data) => ({ id: newId(), type, date, sample: true, createdAt: now + (seq++), updatedAt: now, ...data });
  return [
    mk('workout', d(1), { kind: '요가', minutes: 30, condition: '좋음', memo: '아침에 스트레칭 위주로 했다. 어깨가 한결 가벼워졌다. (예시 기록)' }),
    mk('workout', d(2), { kind: '슬로조깅', minutes: 25, distance: 3.1, condition: '보통', memo: '대화할 수 있는 속도로 천천히. (예시 기록)' }),
    mk('workout', d(4), { kind: '요가', minutes: 40, condition: '피곤함', memo: '피곤해서 가볍게만 했다. (예시 기록)' }),
    mk('workout', d(8), { kind: '슬로조깅', minutes: 30, distance: 3.6, condition: '좋음', memo: '' }),
    mk('workout', d(9), { kind: '요가', minutes: 20, condition: '보통', memo: '' }),
    mk('violin', d(1), { piece: '바흐 미뉴에트 G장조', minutes: 20, part: '1~8마디 운지', hard: '3포지션으로 옮길 때 음정이 흔들렸다.', next: '메트로놈 60에 맞춰 9~16마디 연습하기 (예시 기록)' }),
    mk('violin', d(3), { piece: '바흐 미뉴에트 G장조', minutes: 15, part: '활 쓰는 법(다운-업)', hard: '활이 줄 위에서 미끄러졌다.', next: '활을 줄에 수직으로 유지하기' }),
    mk('violin', d(9), { piece: '스즈키 1권 - 반짝반짝 변주곡', minutes: 25, part: '변주 A, B', hard: '리듬이 자꾸 빨라진다.', next: '천천히 박자 세며 치기' }),
    mk('study', d(2), { topic: '금리와 물가의 관계', learned: '물가가 오르면 중앙은행이 금리를 올려 소비를 조금 식히려고 한다는 흐름을 알게 되었다. 예금·대출 금리에도 영향을 준다. (예시 기록)', links: 'https://www.bok.or.kr' }),
    mk('study', d(10), { topic: '분산 투자란?', learned: '한곳에 몰아두지 않고 나누어 두면 한 자산이 흔들려도 전체 충격이 줄어든다는 개념.', links: '' }),
    mk('invest', d(3), { asset: '국내 대형주 ETF (예시)', thought: '뉴스에서 자주 언급되어 관심이 생김. 어떤 기업들이 들어 있는지 궁금했다. (예시 기록)', check: '구성 종목과 운용 보수는 어떻게 되는지.', review: '' }),
    mk('invest', d(20), { asset: '예시 관심 종목 B', thought: '평소 자주 쓰는 서비스라 친숙해서 관심을 가졌다.', check: '실적 발표 후 내 생각이 바뀌는지 보기.', review: '친숙함만으로 판단했다는 걸 알게 됐다. 다음엔 근거를 두세 가지 적어 두기.' }),
    mk('art', d(21), { image: SAMPLE_IMAGES.outline, topic: '기본 도형 그리기', tools: '연필 HB', tried: '원과 사각형을 한 번에 그려 보기.', hard: '원이 찌그러진다.', next: '명암 넣어 입체감 내기 (예시 기록)' }),
    mk('art', d(8), { image: SAMPLE_IMAGES.shaded, topic: '명암 연습', tools: '연필 HB, 2B', tried: '빛이 오는 방향을 정하고 그림자를 그려 보기.', hard: '밝은 곳과 어두운 곳의 경계 처리.', next: '색연필로 색 입히기' }),
    mk('art', d(1), { image: SAMPLE_IMAGES.color, topic: '색 넣기 연습', tools: '색연필 12색', tried: '따뜻한 색 두 가지를 겹쳐 그러데이션 만들기.', hard: '색을 겹칠수록 종이가 매끈해져서 더 칠하기 어렵다.', next: '차가운 색과 따뜻한 색 함께 써 보기' }),
  ];
}

/* ---------------------------------------------------------------------
   7. 화면 그리기 - 공통 부분
   --------------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const dlg = $('#dlg');

function renderTabs() {
  $('#tabs').innerHTML = TABS.map((t) =>
    `<button type="button" class="tab ${t.id === ui.tab ? 'active' : ''}" data-act="tab" data-id="${t.id}">${esc(t.label)}</button>`).join('');
}

function render() {
  renderTabs();
  if (ui.tab === 'body') renderBody();
  else if (ui.tab === 'econ') renderEcon();
  else renderArt();
}

function actionButtons(type, id) {
  return `<div class="actions">
    <button type="button" class="btn ghost small" data-act="edit" data-type="${type}" data-id="${esc(id)}">수정</button>
    <button type="button" class="btn danger small" data-act="del" data-type="${type}" data-id="${esc(id)}">삭제</button>
  </div>`;
}

/* ---------------------------------------------------------------------
   8. 메뉴 1: 운동·바이올린
   --------------------------------------------------------------------- */
function workoutCard(r) {
  const parts = [`<b>${esc(r.minutes)}분</b>`];
  if (r.distance) parts.push(`${esc(fmtNum(r.distance))}km`);
  if (r.condition) parts.push(`컨디션 ${esc(r.condition)}`);
  return `<div class="card">
    <div class="item-head">
      <div><span class="tag">${esc(r.kind || '운동')}</span> ${parts.join(' · ')}</div>
      ${actionButtons('workout', r.id)}
    </div>
    ${r.memo ? `<p class="pre">${esc(r.memo)}</p>` : ''}
  </div>`;
}

function violinCard(r) {
  return `<div class="card">
    <div class="item-head">
      <div><span class="tag violin">바이올린</span> <b>${esc(r.piece)}</b> · ${esc(r.minutes)}분</div>
      ${actionButtons('violin', r.id)}
    </div>
    ${textBlock('연습한 부분', r.part)}
    ${textBlock('어려웠던 점', r.hard)}
    ${textBlock('다음 연습 목표', r.next)}
  </div>`;
}

function weekSummaryHTML(start) {
  const end = addDays(start, 6);
  const inWeek = (r) => r.date >= start && r.date <= end;
  const ws = ofType('workout').filter(inWeek);
  const vs = ofType('violin').filter(inWeek);
  const sum = (list, k) => list.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const count = (list, k, v) => list.filter((r) => r[k] === v).length;
  const violinDays = new Set(vs.map((r) => r.date)).size;
  const wOptions = SCHEMAS.workout.fields.find((f) => f.key === 'kind').options;
  const kindText = wOptions.map((k) => `${k} ${count(ws, 'kind', k)}회`).join(' · ');
  const condOptions = SCHEMAS.workout.fields.find((f) => f.key === 'condition').options;
  const condText = condOptions.map((c) => `${c} ${count(ws, 'condition', c)}`).join(' · ');
  const pieces = [...new Set(vs.map((r) => r.piece))];
  const lastNext = vs.filter((r) => r.next).sort(byNewest)[0];
  const km = sum(ws, 'distance');

  const label = ui.weekOffset === 0 ? '이번 주' : ui.weekOffset === -1 ? '지난 주' : '';
  return `<section class="card">
    <div class="week-head">
      <button type="button" class="btn ghost small" data-act="week" data-d="-1">◀ 이전 주</button>
      <strong>${label ? label + ' · ' : ''}${esc(shortDay(start))} ~ ${esc(shortDay(end))}</strong>
      <button type="button" class="btn ghost small" data-act="week" data-d="1">다음 주 ▶</button>
      ${ui.weekOffset !== 0 ? '<button type="button" class="btn ghost small" data-act="week" data-d="0">이번 주로</button>' : ''}
    </div>
    <div class="stats">
      <div class="stat"><b>${ws.length}회</b><span>운동 횟수</span></div>
      <div class="stat"><b>${sum(ws, 'minutes')}분</b><span>운동 시간</span></div>
      <div class="stat"><b>${esc(fmtNum(km))}km</b><span>이동 거리</span></div>
      <div class="stat"><b>${violinDays}일</b><span>바이올린 연습한 날</span></div>
      <div class="stat"><b>${sum(vs, 'minutes')}분</b><span>바이올린 연습 시간</span></div>
    </div>
    ${ws.length ? `<p class="meta" style="margin:10px 0 0">운동 종류: ${esc(kindText)} · 컨디션: ${esc(condText)}</p>` : ''}
    ${pieces.length ? `<p class="meta" style="margin:4px 0 0">이 주에 연습한 곡: ${esc(pieces.join(', '))}</p>` : ''}
    ${lastNext ? `<p class="meta" style="margin:4px 0 0">가장 최근에 적은 다음 연습 목표: ${esc(lastNext.next)}</p>` : ''}
    ${!ws.length && !vs.length ? '<p class="meta" style="margin:10px 0 0">이 주에는 아직 기록이 없어요.</p>' : ''}
  </section>`;
}

function renderBody() {
  const start = addDays(mondayOf(todayStr()), ui.weekOffset * 7);
  const end = addDays(start, 6);
  let list = [...ofType('workout'), ...ofType('violin')];
  if (ui.bodyFilter !== 'all') list = list.filter((r) => r.type === ui.bodyFilter);
  if (!ui.bodyAllRange) list = list.filter((r) => r.date >= start && r.date <= end);
  list.sort(byNewest);

  let listHTML = '';
  if (!list.length) {
    listHTML = '<div class="empty">보이는 기록이 없어요. 위의 버튼으로 첫 기록을 남겨 보세요.</div>';
  } else {
    let lastDate = '';
    list.forEach((r) => {
      if (r.date !== lastDate) { listHTML += `<div class="day">${esc(dayLabel(r.date))}</div>`; lastDate = r.date; }
      listHTML += r.type === 'workout' ? workoutCard(r) : violinCard(r);
    });
  }

  const chip = (id, text) => `<button type="button" class="chip ${ui.bodyFilter === id ? 'active' : ''}" data-act="bodyFilter" data-id="${id}">${text}</button>`;
  view.innerHTML = `
    <h2 class="page-title">운동·바이올린</h2>
    <p class="page-sub">몸과 손을 쓴 날을 가볍게 남겨요. 잘했는지 못했는지 점수는 매기지 않아요.</p>
    ${weekSummaryHTML(start)}
    <div class="row" style="margin:14px 0">
      <button type="button" class="btn" data-act="add" data-type="workout">＋ 운동 기록</button>
      <button type="button" class="btn" data-act="add" data-type="violin">＋ 바이올린 기록</button>
    </div>
    <div class="row between">
      <div class="chips">${chip('all', '전체')}${chip('workout', '운동')}${chip('violin', '바이올린')}</div>
      <label class="meta"><input type="checkbox" data-act="bodyRange" ${ui.bodyAllRange ? '' : 'checked'}> 위에서 고른 주만 보기</label>
    </div>
    ${listHTML}`;
}

/* ---------------------------------------------------------------------
   9. 메뉴 2: 경제 공부·투자 기록
   --------------------------------------------------------------------- */
function studyCard(r) {
  return `<div class="card">
    <div class="item-head">
      <div><h3>${esc(r.topic)}</h3><div class="meta">${esc(dayLabel(r.date))}</div></div>
      ${actionButtons('study', r.id)}
    </div>
    ${textBlock('배운 내용', r.learned)}
    ${linksBlock(r.links)}
  </div>`;
}

function investCard(r) {
  const reviewed = !!(r.review && r.review.trim());
  return `<div class="card">
    <div class="item-head">
      <div>
        <h3>${esc(r.asset)}</h3>
        <div class="meta">${esc(dayLabel(r.date))} ${reviewed ? '<span class="tag">복기 완료</span>' : '<span class="tag todo">복기 전</span>'}</div>
      </div>
      ${actionButtons('invest', r.id)}
    </div>
    ${textBlock('당시 생각과 근거', r.thought)}
    ${textBlock('확인하고 싶은 점', r.check)}
    ${reviewed
      ? textBlock('나중에 돌아본 결과', r.review)
      : `<div class="label">나중에 돌아본 결과</div>
         <p class="meta" style="margin:2px 0 6px">아직 적지 않았어요.</p>
         <button type="button" class="btn ghost small" data-act="edit" data-type="invest" data-id="${esc(r.id)}">복기 쓰기</button>`}
  </div>`;
}

function econListHTML() {
  const type = ui.econTab;
  const q = ui.query.trim().toLowerCase();
  const list = ofType(type)
    .filter((r) => !q || Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)))
    .sort(byNewest);
  if (!list.length) {
    return `<div class="empty">${q ? '검색 결과가 없어요.' : '아직 기록이 없어요. 위의 버튼으로 남겨 보세요.'}</div>`;
  }
  return list.map(type === 'study' ? studyCard : investCard).join('');
}

function renderEcon() {
  const chip = (id, text) => `<button type="button" class="chip ${ui.econTab === id ? 'active' : ''}" data-act="econTab" data-id="${id}">${text}</button>`;
  const isInvest = ui.econTab === 'invest';
  view.innerHTML = `
    <h2 class="page-title">경제 공부·투자 기록</h2>
    <p class="page-sub">배운 것과 그때의 생각을 남기고, 시간이 지난 뒤 돌아보는 공간이에요.</p>
    <div class="chips">${chip('study', '경제 공부 메모')}${chip('invest', '투자 기록·복기')}</div>
    ${isInvest ? `<div class="notice" style="margin:0 0 14px;max-width:none">
      이곳은 <b>기록과 복기 전용</b>이에요. 사고팔기를 추천하거나 주문하는 기능, 계좌 연결은 없어요.
    </div>` : ''}
    <div class="row between" style="margin-bottom:14px">
      <button type="button" class="btn" data-act="add" data-type="${ui.econTab}">＋ ${isInvest ? '투자 기록' : '공부 메모'} 추가</button>
      <input class="search" id="search" type="search" placeholder="🔍 기록 검색" value="${esc(ui.query)}">
    </div>
    <div id="listBox">${econListHTML()}</div>`;
}

/* ---------------------------------------------------------------------
   10. 메뉴 3: 그림 발전 기록
   --------------------------------------------------------------------- */
function artCard(r) {
  const details = [
    textBlock('새로 시도한 점', r.tried),
    textBlock('어려웠던 점', r.hard),
    textBlock('다음 목표', r.next),
  ].join('');
  return `<article class="card art-card">
    ${r.image
      ? `<img class="art-img" src="${esc(r.image)}" alt="${esc(r.topic)}" data-act="zoom" data-id="${esc(r.id)}">`
      : '<div class="art-noimg">이미지 없음</div>'}
    <h3>${esc(r.topic)}</h3>
    <div class="meta">${esc(dayLabel(r.date))}${r.tools ? ` · ${esc(r.tools)}` : ''}</div>
    ${details ? `<details open><summary>돌아보기 메모</summary>${details}</details>` : ''}
    <div class="row" style="margin-top:10px">
      ${r.image ? `<button type="button" class="btn ghost small" data-act="compare-prev" data-id="${esc(r.id)}">이전 작업과 비교</button>` : ''}
      <button type="button" class="btn ghost small" data-act="edit" data-type="art" data-id="${esc(r.id)}">수정</button>
      <button type="button" class="btn danger small" data-act="del" data-type="art" data-id="${esc(r.id)}">삭제</button>
    </div>
  </article>`;
}

function artOptionLabel(r) { return `${r.date} · ${r.topic}`; }

function comparePanel(r) {
  if (!r) return '<div class="card empty">기록을 골라 주세요.</div>';
  return `<div class="card">
    <img class="art-img" src="${esc(r.image)}" alt="${esc(r.topic)}" data-act="zoom" data-id="${esc(r.id)}">
    <h3 style="margin-top:8px">${esc(r.topic)}</h3>
    <div class="meta">${esc(dayLabel(r.date))}${r.tools ? ` · ${esc(r.tools)}` : ''}</div>
    ${textBlock('새로 시도한 점', r.tried)}
    ${textBlock('어려웠던 점', r.hard)}
    ${textBlock('다음 목표', r.next)}
  </div>`;
}

function renderArt() {
  const arts = ofType('art');
  const withImg = arts.filter((r) => r.image).sort(byOldest);
  const chip = (id, text) => `<button type="button" class="chip ${ui.artView === id ? 'active' : ''}" data-act="artView" data-id="${id}">${text}</button>`;

  let body = '';
  if (ui.artView === 'book') {
    const list = [...arts].sort(ui.artOrder === 'newest' ? byNewest : byOldest);
    body = `
      <div class="row between" style="margin-bottom:12px">
        <div class="row"><span class="meta">정렬</span>
          <select id="artOrder" class="search" style="min-width:0">
            <option value="newest" ${ui.artOrder === 'newest' ? 'selected' : ''}>최근 것부터</option>
            <option value="oldest" ${ui.artOrder === 'oldest' ? 'selected' : ''}>오래된 것부터</option>
          </select>
        </div>
      </div>
      ${list.length ? `<div class="art-grid">${list.map(artCard).join('')}</div>` : '<div class="empty">아직 기록이 없어요. 위의 버튼으로 첫 그림을 남겨 보세요.</div>'}`;
  } else if (withImg.length < 2) {
    body = '<div class="empty">비교하려면 이미지가 있는 기록이 2개 이상 필요해요.</div>';
  } else {
    if (!withImg.some((r) => r.id === ui.cmpA)) ui.cmpA = withImg[0].id;
    if (!withImg.some((r) => r.id === ui.cmpB)) ui.cmpB = withImg[withImg.length - 1].id;
    const a = withImg.find((r) => r.id === ui.cmpA);
    const b = withImg.find((r) => r.id === ui.cmpB);
    const opts = (sel) => withImg.map((r) => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(artOptionLabel(r))}</option>`).join('');
    body = `
      <div class="row" style="margin-bottom:12px">
        <select class="search" data-cmp="a" style="min-width:0">${opts(ui.cmpA)}</select>
        <span class="meta">와(과)</span>
        <select class="search" data-cmp="b" style="min-width:0">${opts(ui.cmpB)}</select>
        <button type="button" class="btn ghost small" data-act="cmp-first-last">처음 ↔ 최근</button>
      </div>
      ${a.next ? `<div class="reflect"><b>왼쪽 기록에서 세웠던 다음 목표</b><p class="pre">${esc(a.next)}</p>
        <span class="meta">오른쪽 작업에서 어떻게 이어졌는지 살펴보세요. 잘하고 못하고를 따지지 않고, 달라진 점을 찾아보는 시간이에요.</span></div>` : ''}
      <div class="compare">${comparePanel(a)}${comparePanel(b)}</div>`;
  }

  view.innerHTML = `
    <h2 class="page-title">그림 발전 기록</h2>
    <p class="page-sub">점수나 순위 없이, 내가 걸어온 연습 과정을 돌아보는 기록장이에요. 이 기록은 이 컴퓨터에만 저장돼요.</p>
    <div class="row between" style="margin-bottom:12px">
      <div class="chips" style="margin:0">${chip('book', '📖 기록장')}${chip('compare', '↔ 나란히 비교')}</div>
      <button type="button" class="btn" data-act="add" data-type="art">＋ 그림 기록 추가</button>
    </div>
    ${body}`;
}

/* ---------------------------------------------------------------------
   11. 입력 창 (추가/수정)
   --------------------------------------------------------------------- */
function openDlg(html, wide) {
  dlg.className = wide ? 'wide' : '';
  dlg.innerHTML = `<div class="dlg-body">${html}</div>`;
  if (!dlg.open) dlg.showModal();
}
function closeDlg() { if (dlg.open) dlg.close(); }

let formImage = null; // 입력 창에서 선택한 이미지(데이터 주소)

function fieldHTML(f, value) {
  const id = `f_${f.key}`;
  const req = f.required ? ' <span class="req">*</span>' : '';
  const v = value ?? '';
  let input;
  if (f.type === 'textarea') {
    input = `<textarea id="${id}" name="${f.key}">${esc(v)}</textarea>`;
  } else if (f.type === 'select') {
    const opts = (f.options || []).map((o) => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');
    input = `<select id="${id}" name="${f.key}">${f.required ? '' : '<option value="">(선택 안 함)</option>'}${opts}</select>`;
  } else if (f.type === 'image') {
    input = `<input id="${id}" type="file" accept="image/*">
      <div id="imgPreviewBox"></div>`;
  } else {
    const extra = f.type === 'number' ? ` min="${f.min ?? ''}" step="${f.step ?? 1}" inputmode="decimal"` : '';
    input = `<input id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}"${extra}>`;
  }
  return `<div class="field"><label for="${id}">${esc(f.label)}${req}</label>${input}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
}

function updateImagePreview() {
  const box = $('#imgPreviewBox');
  if (!box) return;
  box.innerHTML = formImage
    ? `<img class="preview" src="${esc(formImage)}" alt="선택한 그림"><button type="button" class="btn ghost small" data-act="clearImage" style="margin-top:6px">이미지 빼기</button>`
    : '';
}

function openForm(type, existing) {
  const schema = SCHEMAS[type];
  const rec = existing || { date: todayStr() };
  formImage = rec.image || null;
  openDlg(`
    <h2>${esc(schema.label)} ${existing ? '수정' : '추가'}</h2>
    <form id="recForm" novalidate>
      ${schema.fields.map((f) => fieldHTML(f, rec[f.key])).join('')}
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`);
  dlg.querySelector('#recForm').dataset.type = type;
  dlg.querySelector('#recForm').dataset.id = existing ? existing.id : '';
  updateImagePreview();
  const first = dlg.querySelector('input:not([type=file]):not([type=date]), textarea');
  if (first && !existing) first.focus();
}

// 사진을 적당한 크기로 줄여서 저장해요 (저장 공간 절약)
function readImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 열 수 없어요'));
      img.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_SIZE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

async function submitForm(form) {
  const type = form.dataset.type;
  const schema = SCHEMAS[type];
  const err = $('#formError');
  const data = {};
  for (const f of schema.fields) {
    if (f.type === 'image') { data[f.key] = formImage || ''; continue; }
    const raw = (form.elements[f.key].value || '').trim();
    if (f.required && !raw) { err.textContent = `'${f.label}' 칸을 채워 주세요.`; form.elements[f.key].focus(); return; }
    if (f.type === 'number') {
      if (raw === '') { data[f.key] = ''; continue; }
      const n = Number(raw);
      if (!Number.isFinite(n) || (f.min !== undefined && n < f.min)) { err.textContent = `'${f.label}' 칸에는 올바른 숫자를 써 주세요.`; form.elements[f.key].focus(); return; }
      data[f.key] = n;
    } else {
      data[f.key] = raw;
    }
  }
  const old = records.find((r) => r.id === form.dataset.id);
  const rec = {
    id: old ? old.id : newId(),
    type,
    createdAt: old ? old.createdAt : Date.now(),
    updatedAt: Date.now(),
    ...data,
  }; // 예시 표시(sample)는 직접 고치면 사라져요. 내 기록이 되었다는 뜻이에요.
  if (await saveRecord(rec)) { closeDlg(); render(); }
}

/* ---------------------------------------------------------------------
   12. 백업·설정 창
   --------------------------------------------------------------------- */
function openSettings() {
  const sampleCount = records.filter((r) => r.sample).length;
  const modeText = { indexeddb: '브라우저 저장소(IndexedDB)', localstorage: '브라우저 저장소(localStorage)', memory: '임시 저장(창을 닫으면 사라져요!)' }[Store.mode];
  openDlg(`
    <h2>⚙ 백업·설정</h2>
    <p class="meta">기록 ${records.length}개 · 저장 방식: ${esc(modeText)}</p>
    <div class="settings-list">
      <div class="card" style="margin:0">
        <h3>백업 파일 만들기</h3>
        <p class="meta">모든 기록(그림 포함)을 파일 하나로 저장해요. 브라우저 기록을 지우기 전이나 컴퓨터를 바꿀 때 꼭 해 두세요.</p>
        <button type="button" class="btn" data-act="export">백업 파일 내려받기</button>
      </div>
      <div class="card" style="margin:0">
        <h3>백업 파일 불러오기</h3>
        <p class="meta">백업 파일의 기록을 지금 기록에 더해요. (같은 기록은 덮어써요)</p>
        <input type="file" id="importFile" accept=".json,application/json">
      </div>
      <div class="card" style="margin:0">
        <h3>예시 기록 지우기</h3>
        <p class="meta">처음에 들어 있던 예시 기록 ${sampleCount}개를 한 번에 지워요. 내가 쓴 기록은 그대로 남아요. (예시를 직접 수정했다면 내 기록으로 바뀐 거라 남아요.)</p>
        <button type="button" class="btn danger" data-act="clearSamples" ${sampleCount ? '' : 'disabled'}>예시 기록만 지우기</button>
      </div>
      <div class="card" style="margin:0">
        <h3>모든 기록 지우기</h3>
        <p class="meta">되돌릴 수 없어요. 먼저 백업을 해 두는 걸 권해요.</p>
        <button type="button" class="btn danger" data-act="clearAll">모든 기록 지우기</button>
      </div>
    </div>
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`);
}

function exportBackup() {
  const payload = { app: 'my-journal', version: 1, exportedAt: new Date().toISOString(), records };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `나의기록장-백업-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || payload.app !== 'my-journal' || !Array.isArray(payload.records)) throw new Error('형식 오류');
    const good = payload.records.filter((r) => r && typeof r.id === 'string' && SCHEMAS[r.type] && typeof r.date === 'string');
    if (!good.length) throw new Error('가져올 기록이 없어요');
    if (!confirm(`기록 ${good.length}개를 불러올까요?`)) return;
    await Store.putMany(good);
    records = await loadRecords();
    closeDlg();
    render();
    alert(`${good.length}개를 불러왔어요.`);
  } catch (e) {
    alert('백업 파일을 읽지 못했어요. 이 사이트에서 만든 백업 파일이 맞는지 확인해 주세요.');
  }
}

/* ---------------------------------------------------------------------
   13. 클릭·입력 처리
   --------------------------------------------------------------------- */
document.addEventListener('click', async (e) => {
  // 바깥(어두운 부분)을 누르면 창 닫기 (입력 중인 창은 실수로 닫히지 않게 제외)
  if (e.target === dlg) { if (!dlg.querySelector('#recForm')) closeDlg(); return; }

  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' && el.type === 'checkbox') return;
  const { act, id, type } = el.dataset;

  switch (act) {
    case 'tab':
      ui.tab = id; ui.query = '';
      try { localStorage.setItem('journal.tab', id); } catch (err) { /* 무시 */ }
      render(); window.scrollTo(0, 0); break;
    case 'week': ui.weekOffset = el.dataset.d === '0' ? 0 : ui.weekOffset + Number(el.dataset.d); render(); break;
    case 'bodyFilter': ui.bodyFilter = id; render(); break;
    case 'econTab': ui.econTab = id; ui.query = ''; render(); break;
    case 'artView': ui.artView = id; render(); break;
    case 'add': openForm(type); break;
    case 'edit': openForm(type, records.find((r) => r.id === id)); break;
    case 'del': {
      const r = records.find((x) => x.id === id);
      const name = r ? (r.topic || r.piece || r.asset || r.kind || '이 기록') : '이 기록';
      if (confirm(`'${name}' 기록을 지울까요?\n지운 기록은 되돌릴 수 없어요.`)) { await deleteRecord(id); render(); }
      break;
    }
    case 'closeDlg': closeDlg(); break;
    case 'clearImage': formImage = null; updateImagePreview(); break;
    case 'zoom': {
      const r = records.find((x) => x.id === id);
      if (r) openDlg(`<img class="zoom-img" src="${esc(r.image)}" alt="${esc(r.topic)}"><p class="meta" style="text-align:center">${esc(artOptionLabel(r))}</p><div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
      break;
    }
    case 'compare-prev': {
      const imgs = ofType('art').filter((r) => r.image).sort(byOldest);
      const i = imgs.findIndex((r) => r.id === id);
      if (i <= 0) { alert('이 작업보다 먼저 기록한 그림이 없어요.'); break; }
      ui.cmpA = imgs[i - 1].id; ui.cmpB = id; ui.artView = 'compare'; render(); window.scrollTo(0, 0);
      break;
    }
    case 'cmp-first-last': ui.cmpA = null; ui.cmpB = null; render(); break;
    case 'export': exportBackup(); break;
    case 'clearSamples':
      if (confirm('예시 기록을 모두 지울까요? (내가 쓴 기록은 남아요)')) {
        await Store.remove(records.filter((r) => r.sample).map((r) => r.id));
        records = records.filter((r) => !r.sample);
        closeDlg(); render();
      }
      break;
    case 'clearAll':
      if (confirm('정말 모든 기록을 지울까요? 되돌릴 수 없어요.')) {
        await Store.remove(records.map((r) => r.id));
        records = []; closeDlg(); render();
      }
      break;
    default: break;
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.id === 'recForm') { e.preventDefault(); submitForm(e.target); }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.act === 'bodyRange') { ui.bodyAllRange = !t.checked; render(); }
  else if (t.id === 'artOrder') { ui.artOrder = t.value; render(); }
  else if (t.dataset.cmp) { ui[t.dataset.cmp === 'a' ? 'cmpA' : 'cmpB'] = t.value; render(); }
  else if (t.id === 'importFile' && t.files[0]) { await importBackup(t.files[0]); }
  else if (t.id === 'f_image' && t.files[0]) {
    try { formImage = await readImage(t.files[0]); updateImagePreview(); $('#formError').textContent = ''; }
    catch (err) { $('#formError').textContent = '이 파일은 이미지로 열 수 없어요. 다른 파일을 골라 주세요.'; }
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search') { ui.query = e.target.value; $('#listBox').innerHTML = econListHTML(); }
});

$('#settingsBtn').addEventListener('click', openSettings);

// 창이 닫히면(취소·Esc 포함) 안에 있던 입력 내용도 비워요
dlg.addEventListener('close', () => { dlg.innerHTML = ''; formImage = null; });

/* ---------------------------------------------------------------------
   14. 시작
   --------------------------------------------------------------------- */
async function loadRecords() {
  const all = await Store.all();
  seeded = all.some((r) => r.id === '__meta_seeded');
  return all.filter((r) => r.type !== 'meta');
}

async function start() {
  await Store.init();
  records = await loadRecords();
  if (!seeded && records.length === 0) {
    const samples = buildSamples();
    await Store.putMany([...samples, { id: '__meta_seeded', type: 'meta' }]);
    records = samples;
  } else if (!seeded) {
    await Store.putMany([{ id: '__meta_seeded', type: 'meta' }]);
  }
  if (Store.mode === 'memory') {
    const n = $('#notice');
    n.hidden = false;
    n.textContent = '⚠ 이 브라우저에서는 기록을 저장할 수 없어요. 창을 닫으면 사라지니, 다른 브라우저(크롬 등)로 열어 주세요.';
  }
  render();
}

start().catch((err) => {
  view.innerHTML = `<div class="notice" style="max-width:none">시작하는 중 문제가 생겼어요: ${esc(err.message)}<br>크롬 같은 다른 브라우저로 열어 보세요.</div>`;
});
