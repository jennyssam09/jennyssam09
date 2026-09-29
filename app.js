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
// 화면에서는 뺐지만, 예전에 적어 둔 값은 지우지 않고 보관하는 칸
const HIDDEN_KEYS = ['minutes', 'distance', 'tempo'];

const SCHEMAS = {
  // 운동 기록
  workout: {
    label: '운동 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['요가', '슬로조깅'], required: true },
      { key: 'condition', label: '컨디션', type: 'select', options: ['좋음', '보통', '피곤함'] },
      { key: 'memo', label: '메모', type: 'textarea' },
      { key: 'shots', label: '워치 캡처', type: 'images', noun: '워치 캡처', hint: '갤럭시 워치·삼성 헬스 화면을 캡처해서 붙여 두세요.' },
      { key: 'claude', label: '클로드 피드백', type: 'textarea', hint: '클로드가 해 준 말을 그대로 붙여넣어 두세요. 나중에 카드나 캘린더의 날짜 창에서 다시 볼 수 있어요.' },
    ],
  },
  // 바이올린 기록
  violin: {
    label: '바이올린 기록',
    kindKey: 'kind', // '종류'(연습/레슨)에 따라 보이는 칸이 달라져요. only: 는 해당 종류일 때만 보이는 칸
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['연습', '레슨'], required: true },
      { key: 'piece', label: '곡 이름', type: 'text', required: true, only: '연습', suggest: true },
      { key: 'part', label: '연습한 부분', type: 'textarea', only: '연습' },
      { key: 'hard', label: '어려웠던 점', type: 'textarea', only: '연습' },
      { key: 'next', label: '다음 연습 목표', type: 'textarea', only: '연습' },
      { key: 'feedback', label: '선생님 피드백', type: 'textarea', only: '레슨' },
      { key: 'homework', label: '다음 레슨까지 과제', type: 'tasks', only: '레슨', hint: '한 줄에 과제 하나씩 적어 주세요. 체크는 목록에서 바로 할 수 있어요.' },
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
  { id: 'cal', label: '📅 캘린더' },
];

// 캘린더가 시작되는 달 (이 달부터 앞으로 계속 이어져요)
const CALENDAR_START = '2026-01';

// 빠른 기록: 메뉴마다 '종류' 목록과, 한 줄 메모가 어느 칸에 저장될지 정해요.
//   memoKey: 한 줄 메모가 들어갈 칸
const QUICK = {
  body: {
    title: '빠른 기록 - 운동·바이올린', memoRequired: false,
    kinds: [
      { label: '요가', type: 'workout', data: { kind: '요가' }, memoKey: 'memo', hint: '예: 아침 스트레칭' },
      { label: '슬로조깅', type: 'workout', data: { kind: '슬로조깅' }, memoKey: 'memo', hint: '예: 동네 한 바퀴' },
      { label: '바이올린 연습', type: 'violin', data: { kind: '연습' }, memoKey: 'part', hint: '예: 미뉴에트 1~8마디' },
    ],
  },
  econ: {
    title: '빠른 기록 - 경제 공부·투자', memoRequired: true,
    kinds: [
      { label: '공부 메모', type: 'study', data: {}, memoKey: 'topic', hint: '공부한 주제를 한 줄로' },
      { label: '투자 기록', type: 'invest', data: {}, memoKey: 'asset', hint: '관심 자산·종목 이름' },
    ],
  },
  art: {
    title: '빠른 기록 - 그림', memoRequired: true,
    kinds: ['연필·드로잉', '색연필', '수채·물감', '디지털', '기타'].map((t) => (
      { label: t, type: 'art', data: { tools: t }, memoKey: 'topic', hint: '연습 주제를 한 줄로' })),
  },
};

// 백업 알림: 며칠이 지나면 알려줄지, '나중에'를 누르면 며칠 동안 숨길지
const BACKUP_REMIND_DAYS = 14;
const BACKUP_SNOOZE_DAYS = 3;

// 사진을 저장할 때 긴 변의 최대 크기(픽셀). 커질수록 선명하지만 저장 공간을 더 써요.
const IMAGE_MAX_SIZE = 1600;

// 운동 기록 하나에 붙일 수 있는 워치 캡처의 최대 장수
const SHOT_MAX = 4;

// '클로드에게 보낼 요약'의 맨 아래에 붙는 부탁 글이에요. 마음에 드는 말로 바꿔도 돼요.
const CLAUDE_REQUEST = '위 기록을 참고해서, 함께 올리는 갤럭시 워치 캡처를 보고 이번 주를 돌아보는 피드백을 부탁해요. 잘했는지 점수를 매기기보다, 눈에 띄는 변화와 다음 주에 해 볼 만한 작은 제안을 알려 주세요.';

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
    await this._putMany(list);
    if (list.some((r) => r.type !== 'meta')) scheduleAutosave(); // 설정 저장만으로는 자동 저장하지 않아요
  },
  async remove(ids) {
    await this._remove(ids);
    scheduleAutosave();
  },
  async _putMany(list) {
    if (this.mode === 'indexeddb') return this._tx('readwrite', (s) => { list.forEach((r) => s.put(r)); });
    const map = new Map((this.mode === 'localstorage' ? this._lsRead() : this._mem).map((r) => [r.id, r]));
    list.forEach((r) => map.set(r.id, r));
    const merged = [...map.values()];
    if (this.mode === 'localstorage') this._lsWrite(merged); else this._mem = merged;
  },
  async _remove(ids) {
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
let settings = { lastBackupAt: null, snoozeUntil: null, celebrateOff: false }; // 마지막 백업 날짜, 알림 미루기, 축하 한 줄 끄기
// 자동 저장: 내 컴퓨터의 파일 하나에 기록이 바뀔 때마다 저장해요 (크롬·엣지 컴퓨터 버전)
//   status: 'off' 꺼짐 / 'on' 켜짐 / 'paused' 브라우저를 다시 열어 한 번 연결이 필요함
const autosave = { handle: null, name: '', status: 'off', lastSavedAt: null };
let autosaveTimer = null;

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
  calMonth: null,       // 캘린더에서 보고 있는 달 (예: '2026-09')
  calHidden: new Set(), // 캘린더에서 잠시 숨긴 종류
  dayOpen: null,        // 캘린더에서 열어 둔 날짜
  backToDay: null,      // 입력 창을 닫고 돌아갈 날짜
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
    mk('workout', d(1), { kind: '요가', condition: '좋음', memo: '아침에 스트레칭 위주로 했다. 어깨가 한결 가벼워졌다. (예시 기록)' }),
    mk('workout', d(2), { kind: '슬로조깅', condition: '보통', memo: '대화할 수 있는 속도로 천천히. (예시 기록)' }),
    mk('workout', d(4), { kind: '요가', condition: '피곤함', memo: '피곤해서 가볍게만 했다. (예시 기록)' }),
    mk('workout', d(8), { kind: '슬로조깅', condition: '좋음', memo: '' }),
    mk('workout', d(9), { kind: '요가', condition: '보통', memo: '' }),
    mk('violin', d(1), { kind: '연습', piece: '바흐 미뉴에트 G장조', part: '1~8마디 운지', hard: '3포지션으로 옮길 때 음정이 흔들렸다.', next: '메트로놈 60에 맞춰 9~16마디 연습하기 (예시 기록)' }),
    mk('violin', d(3), { kind: '연습', piece: '바흐 미뉴에트 G장조', part: '활 쓰는 법(다운-업)', hard: '활이 줄 위에서 미끄러졌다.', next: '활을 줄에 수직으로 유지하기' }),
    mk('violin', d(9), { kind: '연습', piece: '스즈키 1권 - 반짝반짝 변주곡', part: '변주 A, B', hard: '리듬이 자꾸 빨라진다.', next: '천천히 박자 세며 치기' }),
    mk('violin', d(6), { kind: '연습', piece: '바흐 미뉴에트 G장조', part: '9~16마디', hard: '느린 템포에서도 손가락이 꼬였다.', next: '천천히 정확하게' }),
    mk('violin', d(5), { kind: '레슨', feedback: '활을 줄에 수직으로 두는 연습을 더 하면 좋겠어요. 음정은 지난주보다 안정적이에요. (예시 기록)', homework: [{ text: '스케일 G장조 두 옥타브, 매일', done: true }, { text: '미뉴에트 1~16마디 메트로놈 60', done: false }, { text: '빈 줄 연습', done: false }] }),
    mk('workout', d(3), { kind: '요가', memo: '퇴근 후 짧게 (간단 기록 예시)', quick: true }),
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
  renderBackupBar();
  if (ui.tab === 'body') renderBody();
  else if (ui.tab === 'econ') renderEcon();
  else if (ui.tab === 'cal') renderCalendar();
  else renderArt();
}

const quickTag = (r) => (r.quick ? '<span class="tag quick">간단 기록</span>' : '');

function actionButtons(type, id) {
  return `<div class="actions">
    <button type="button" class="btn ghost small" data-act="edit" data-type="${type}" data-id="${esc(id)}">수정</button>
    <button type="button" class="btn danger small" data-act="del" data-type="${type}" data-id="${esc(id)}">삭제</button>
  </div>`;
}

/* ---------------------------------------------------------------------
   8. 메뉴 1: 운동·바이올린
   --------------------------------------------------------------------- */
// 워치 캡처 작은 그림들 (누르면 크게 보여요)
function shotsHTML(r) {
  const list = Array.isArray(r.shots) ? r.shots : [];
  if (!list.length) return '';
  return `<div class="shot-row">${list.map((src, i) => `<img class="shot-img" src="${esc(src)}" alt="워치 캡처 ${i + 1}" data-act="zoomShot" data-id="${esc(r.id)}" data-i="${i}">`).join('')}</div>`;
}

function workoutCard(r) {
  const parts = [];
  if (r.condition) parts.push(`컨디션 ${esc(r.condition)}`);
  return `<div class="card">
    <div class="item-head">
      <div><span class="tag">${esc(r.kind || '운동')}</span> ${parts.join(' · ')} ${quickTag(r)}</div>
      ${actionButtons('workout', r.id)}
    </div>
    ${r.memo ? `<p class="pre">${esc(r.memo)}</p>` : ''}
    ${shotsHTML(r)}
    ${r.claude ? `<details class="claude-fb"><summary>💬 클로드 피드백</summary><p class="pre">${esc(r.claude)}</p></details>` : ''}
  </div>`;
}

// 과제 체크 목록 (여기서 체크하면 바로 저장돼요)
function hwList(r) {
  const list = Array.isArray(r.homework) ? r.homework : [];
  if (!list.length) return '';
  return `<ul class="hw">${list.map((t, i) => `<li><label>
    <input type="checkbox" data-act="hw" data-id="${esc(r.id)}" data-i="${i}" ${t.done ? 'checked' : ''}>
    <span class="${t.done ? 'done' : ''}">${esc(t.text)}</span></label></li>`).join('')}</ul>`;
}

async function toggleHomework(id, i, done) {
  const r = records.find((x) => x.id === id);
  if (r && Array.isArray(r.homework) && r.homework[i]) {
    const homework = r.homework.map((t, j) => (j === i ? { ...t, done } : t));
    await saveRecord({ ...r, homework, updatedAt: Date.now() });
  }
  render();
  refreshDay();
}

// 바이올린 탭 맨 위: 가장 최근 레슨의 과제
function lessonPanel() {
  const l = ofType('violin').filter((r) => r.kind === '레슨').sort(byNewest)[0];
  const list = l && Array.isArray(l.homework) ? l.homework : [];
  if (!list.length) return '';
  const done = list.filter((t) => t.done).length;
  return `<section class="card lesson-panel">
    <div class="item-head">
      <div><h3>📌 다음 레슨까지 과제</h3>
        <div class="meta">${esc(dayLabel(l.date))} 레슨 · ${done}/${list.length} 완료${done === list.length ? ' · 모두 끝냈어요' : ''}</div></div>
      <button type="button" class="btn ghost purple small" data-act="edit" data-type="violin" data-id="${esc(l.id)}">수정</button>
    </div>
    ${hwList(l)}
  </section>`;
}

function violinCard(r) {
  if (r.kind === '레슨') {
    return `<div class="card">
      <div class="item-head">
        <div><span class="tag lesson">레슨</span> ${quickTag(r)}</div>
        ${actionButtons('violin', r.id)}
      </div>
      ${textBlock('선생님 피드백', r.feedback)}
      ${Array.isArray(r.homework) && r.homework.length ? `<div class="label">다음 레슨까지 과제</div>${hwList(r)}` : ''}
    </div>`;
  }
  return `<div class="card">
    <div class="item-head">
      <div><span class="tag violin">바이올린</span> ${r.piece ? `<b>${esc(r.piece)}</b>` : '<span class="meta">(곡 이름 미입력)</span>'}${quickTag(r)}</div>
      ${actionButtons('violin', r.id)}
    </div>
    ${textBlock('연습한 부분', r.part)}
    ${textBlock('어려웠던 점', r.hard)}
    ${textBlock('다음 연습 목표', r.next)}
  </div>`;
}

// 곡 이름 자동완성용: 지금까지 쓴 곡 (최근에 쓴 순)
function knownPieces() {
  const seen = new Set();
  const out = [];
  ofType('violin').filter((r) => r.piece).sort(byNewest).forEach((r) => {
    if (!seen.has(r.piece)) { seen.add(r.piece); out.push(r.piece); }
  });
  return out;
}

// 한 주의 숫자들 (화면의 주간 요약과 '클로드에게 보낼 요약'이 함께 써요)
function weekStats(start) {
  const end = addDays(start, 6);
  const inWeek = (r) => r.date >= start && r.date <= end;
  const ws = ofType('workout').filter(inWeek);
  const vs = ofType('violin').filter(inWeek);
  const count = (list, k, v) => list.filter((r) => r[k] === v).length;
  const prac = vs.filter((r) => r.kind !== '레슨'); // 연습 기록만 (레슨은 따로 세요)
  const wOptions = SCHEMAS.workout.fields.find((f) => f.key === 'kind').options;
  const condOptions = SCHEMAS.workout.fields.find((f) => f.key === 'condition').options;
  return {
    end, ws, vs, prac,
    lessons: vs.length - prac.length,
    violinDays: new Set(prac.map((r) => r.date)).size,
    kindText: wOptions.map((k) => `${k} ${count(ws, 'kind', k)}회`).join(' · '),
    condText: condOptions.map((c) => `${c} ${count(ws, 'condition', c)}`).join(' · '),
    pieces: [...new Set(prac.map((r) => r.piece).filter(Boolean))],
    lastNext: prac.filter((r) => r.next).sort(byNewest)[0],
  };
}

function weekSummaryHTML(start) {
  const { end, ws, vs, lessons, violinDays, kindText, condText, pieces, lastNext } = weekStats(start);
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
      <div class="stat"><b>${violinDays}일</b><span>바이올린 연습한 날</span></div>
    </div>
    ${ws.length ? `<p class="meta" style="margin:10px 0 0">운동 종류: ${esc(kindText)} · 컨디션: ${esc(condText)}</p>` : ''}
    ${lessons ? `<p class="meta" style="margin:4px 0 0">레슨 ${lessons}회</p>` : ''}
    ${pieces.length ? `<p class="meta" style="margin:4px 0 0">이 주에 연습한 곡: ${pieces.map(esc).join(', ')}</p>` : ''}
    ${lastNext ? `<p class="meta" style="margin:4px 0 0">가장 최근에 적은 다음 연습 목표: ${esc(lastNext.next)}</p>` : ''}
    ${!ws.length && !vs.length ? '<p class="meta" style="margin:10px 0 0">이 주에는 아직 기록이 없어요.</p>' : `<div class="row" style="margin-top:12px">
      <button type="button" class="btn ghost purple small" data-act="copyWeek">📋 클로드에게 보낼 요약 복사</button>
    </div>`}
  </section>`;
}

// 클로드에게 붙여넣을 한 주의 글 (워치 캡처는 그림이라 글에 들어가지 않아요. 대화창에 따로 올려 주세요)
const oneLine = (s) => String(s || '').trim().replace(/\s*\n\s*/g, ' / ');
const mdLabel = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}/${d.getDate()}(${'일월화수목금토'[d.getDay()]})`; };

function weekTextForClaude(start) {
  const { end, ws, vs, violinDays, lessons, kindText, condText } = weekStats(start);
  const L = [
    `📓 주간 기록 요약 (${shortDay(start)} ~ ${shortDay(end)})`,
    '',
    '■ 한눈에',
    `- 운동 ${ws.length}회${ws.length ? ` (${kindText}) · 컨디션: ${condText}` : ''}`,
    `- 바이올린 연습한 날 ${violinDays}일${lessons ? `, 레슨 ${lessons}회` : ''}`,
  ];
  if (ws.length) {
    L.push('', '■ 운동');
    ws.sort(byOldest).forEach((r) => L.push(`- ${[mdLabel(r.date), r.kind || '운동', r.condition && `컨디션 ${r.condition}`, r.memo && `메모: ${oneLine(r.memo)}`].filter(Boolean).join(' · ')}`));
  }
  if (vs.length) {
    L.push('', '■ 바이올린');
    vs.sort(byOldest).forEach((r) => {
      if (r.kind === '레슨') {
        const hw = (Array.isArray(r.homework) ? r.homework : []).map((t) => `${t.done ? '[완료]' : '[미완료]'} ${t.text}`).join(' / ');
        L.push(`- ${[mdLabel(r.date), '레슨', r.feedback && `선생님 피드백: ${oneLine(r.feedback)}`, hw && `과제: ${hw}`].filter(Boolean).join(' · ')}`);
      } else {
        L.push(`- ${[mdLabel(r.date), '연습', r.piece && `곡: ${r.piece}`, r.part && `연습한 부분: ${oneLine(r.part)}`, r.hard && `어려웠던 점: ${oneLine(r.hard)}`, r.next && `다음 목표: ${oneLine(r.next)}`].filter(Boolean).join(' · ')}`);
      }
    });
  }
  L.push('', '■ 부탁', CLAUDE_REQUEST);
  return L.join('\n');
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* 아래의 예전 방식으로 다시 해 봐요 */ }
  try {
    const ta = $('#copyText');
    ta.focus(); ta.select();
    return document.execCommand('copy');
  } catch (e) { return false; }
}

async function copyFromBox() {
  const ta = $('#copyText');
  if (!ta) return;
  const ok = await copyToClipboard(ta.value);
  $('#copyState').textContent = ok
    ? '✓ 복사했어요. 클로드 대화창에 붙여넣고(Ctrl+V), 워치 캡처는 함께 올려 주세요. 글을 고친 뒤 다시 복사해도 돼요.'
    : '자동으로 복사하지 못했어요. 아래 글을 직접 선택해서 복사해 주세요. (Ctrl+C)';
  if (!ok) { ta.focus(); ta.select(); }
}

function openWeekCopy() {
  const start = addDays(mondayOf(todayStr()), ui.weekOffset * 7);
  openDlg(`
    <h2>📋 클로드에게 보낼 요약</h2>
    <p class="meta" style="margin-top:0">고른 주의 기록을 글로 정리했어요. 열면서 자동으로 복사돼요. 마지막의 부탁 글은 <b>app.js 맨 위의 CLAUDE_REQUEST</b>에서 바꿀 수 있어요.</p>
    <textarea id="copyText" class="copy-text" spellcheck="false">${esc(weekTextForClaude(start))}</textarea>
    <p class="copy-state" id="copyState" role="status"></p>
    <div class="dlg-actions">
      <button type="button" class="btn ghost" data-act="closeDlg">닫기</button>
      <button type="button" class="btn purple" data-act="copyAgain">📋 다시 복사</button>
    </div>`, true);
  copyFromBox();
}

// 운동 탭: 지금까지 쌓인 기록 (예시 기록은 세지 않아요)
function totalsCardHTML() {
  const real = records.filter((r) => !r.sample);
  const w = real.filter((r) => r.type === 'workout');
  const v = real.filter((r) => r.type === 'violin');
  const prac = v.filter((r) => r.kind !== '레슨');
  const lessons = v.length - prac.length;
  const pieces = new Set(prac.map((r) => (r.piece || '').trim()).filter(Boolean)).size;
  const sampleNote = records.some((r) => r.sample) ? ' 예시 기록은 세지 않았어요.' : '';
  if (!w.length && !v.length) {
    return `<section class="card total-card"><h3>🌱 지금까지 쌓인 기록</h3>
      <p class="meta" style="margin:4px 0 0">첫 기록을 남기면 여기에 차곡차곡 쌓여요.${sampleNote}</p></section>`;
  }
  return `<section class="card total-card"><h3>🌱 지금까지 쌓인 기록</h3>
    <div class="stats" style="margin-top:8px">
      <div class="stat"><b>${w.length}회</b><span>운동</span></div>
      <div class="stat"><b>${new Set(prac.map((r) => r.date)).size}일</b><span>바이올린 연습한 날</span></div>
      <div class="stat"><b>${pieces}곡</b><span>연습한 곡</span></div>
      ${lessons ? `<div class="stat"><b>${lessons}회</b><span>레슨</span></div>` : ''}
    </div>${sampleNote ? `<p class="meta" style="margin:8px 0 0">${sampleNote.trim()}</p>` : ''}
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
    ${lessonPanel()}
    ${weekSummaryHTML(start)}
    ${totalsCardHTML()}
    <div class="row actions-row" style="margin:14px 0">
      <button type="button" class="btn purple" data-act="quick" data-menu="body">⚡ 빠른 기록</button>
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
      <div><h3>${esc(r.topic || '(주제 미입력)')}</h3><div class="meta">${esc(dayLabel(r.date))} ${quickTag(r)}</div></div>
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
        <h3>${esc(r.asset || '(자산·종목 미입력)')}</h3>
        <div class="meta">${esc(dayLabel(r.date))} ${reviewed ? '<span class="tag">복기 완료</span>' : '<span class="tag todo">복기 전</span>'} ${quickTag(r)}</div>
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
      <div class="row actions-row">
        <button type="button" class="btn purple" data-act="quick" data-menu="econ">⚡ 빠른 기록</button>
        <button type="button" class="btn" data-act="add" data-type="${ui.econTab}">＋ ${isInvest ? '투자 기록' : '공부 메모'} 추가</button>
      </div>
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
    <h3>${esc(r.topic || '(주제 미입력)')}</h3>
    <div class="meta">${esc(dayLabel(r.date))}${r.tools ? ` · ${esc(r.tools)}` : ''} ${quickTag(r)}</div>
    ${details ? `<details open><summary>돌아보기 메모</summary>${details}</details>` : ''}
    <div class="row" style="margin-top:10px">
      ${r.image ? `<button type="button" class="btn ghost small" data-act="compare-prev" data-id="${esc(r.id)}">이전 작업과 비교</button>` : ''}
      <button type="button" class="btn ghost small" data-act="edit" data-type="art" data-id="${esc(r.id)}">수정</button>
      <button type="button" class="btn danger small" data-act="del" data-type="art" data-id="${esc(r.id)}">삭제</button>
    </div>
  </article>`;
}

function artOptionLabel(r) { return `${r.date} · ${r.topic || '(주제 미입력)'}`; }

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
      <div class="row actions-row">
        <button type="button" class="btn purple" data-act="quick" data-menu="art">⚡ 빠른 기록</button>
        <button type="button" class="btn" data-act="add" data-type="art">＋ 그림 기록 추가</button>
        <input id="artMulti" type="file" accept="image/*" multiple class="sr-only">
        <label class="btn ghost purple" for="artMulti">🖼 사진 여러 장 올리기</label>
      </div>
    </div>
    <p class="meta" style="margin:-4px 0 12px">💡 컴퓨터에서는 사진을 이 화면에 끌어다 놓거나 Ctrl+V로 붙여넣어도 돼요. 여러 장을 한꺼번에 올리면 한 장씩 "간단 기록"이 만들어져요.</p>
    ${body}`;
}

/* ---------------------------------------------------------------------
   10-2. 메뉴 4: 캘린더 (2026년부터, 한눈에 보기)
   --------------------------------------------------------------------- */
// 달력에 표시할 종류 (icon: 달력에 보이는 그림, label: 이름, chip: 위쪽 종류 버튼)
const CAL_CATS = [
  { id: 'workout', chip: 'workout', icon: '🧘', label: '운동', test: (r) => r.type === 'workout' },
  { id: 'practice', chip: 'violin', icon: '🎻', label: '바이올린 연습', test: (r) => r.type === 'violin' && r.kind !== '레슨' },
  { id: 'lesson', chip: 'violin', icon: '🎓', label: '레슨', test: (r) => r.type === 'violin' && r.kind === '레슨' },
  { id: 'study', chip: 'study', icon: '📚', label: '경제 공부', test: (r) => r.type === 'study' },
  { id: 'invest', chip: 'invest', icon: '📊', label: '투자 기록', test: (r) => r.type === 'invest' },
  { id: 'art', chip: 'art', icon: '🎨', label: '그림', test: (r) => r.type === 'art' },
];
// 달력 위쪽의 종류 버튼 (바이올린 버튼 하나가 연습과 레슨을 함께 켜고 꺼요)
const CAL_CHIPS = [
  { id: 'workout', icon: '🧘', label: '운동' },
  { id: 'violin', icon: '🎻', label: '바이올린' },
  { id: 'study', icon: '📚', label: '경제 공부' },
  { id: 'invest', icon: '📊', label: '투자 기록' },
  { id: 'art', icon: '🎨', label: '그림' },
];
const catOf = (r) => CAL_CATS.find((c) => c.test(r));

function calTitle(r) {
  switch (r.type) {
    case 'workout': return r.kind || '운동';
    case 'violin': return r.kind === '레슨' ? '레슨' : (r.piece || '연습');
    case 'study': return r.topic || '공부 메모';
    case 'invest': return r.asset || '투자 기록';
    default: return r.topic || '그림';
  }
}

const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

function renderCalendar() {
  const today = todayStr();
  if (!ui.calMonth) ui.calMonth = today.slice(0, 7);
  if (ui.calMonth < CALENDAR_START) ui.calMonth = CALENDAR_START;
  const [y, m] = ui.calMonth.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 월요일 시작 (주간 요약과 같아요)
  const dayCount = new Date(y, m, 0).getDate();

  // 이 달의 기록을 날짜별·종류별로 모아요
  const byDate = new Map();
  const monthCount = new Map();
  records.forEach((r) => {
    if (!r.date || r.date.slice(0, 7) !== ui.calMonth) return;
    const c = catOf(r);
    if (!c) return;
    monthCount.set(c.id, (monthCount.get(c.id) || 0) + 1);
    if (ui.calHidden.has(c.chip)) return;
    if (!byDate.has(r.date)) byDate.set(r.date, new Map());
    const g = byDate.get(r.date);
    if (!g.has(c.id)) g.set(c.id, []);
    g.get(c.id).push(r);
  });

  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push('<div class="cal-cell blank" aria-hidden="true"></div>');
  for (let d = 1; d <= dayCount; d += 1) {
    const date = `${ui.calMonth}-${pad(d)}`;
    const groups = CAL_CATS.filter((c) => byDate.get(date) && byDate.get(date).has(c.id)).map((c) => ({ c, items: byDate.get(date).get(c.id) }));
    const say = groups.length ? groups.map((g) => `${g.c.label}${g.items.length > 1 ? ` ${g.items.length}개` : ''}`).join(', ') : '기록 없음';
    cells.push(`<button type="button" class="cal-cell${groups.length ? ' has' : ''}${date === today ? ' today' : ''}" data-act="calDay" data-date="${date}" aria-label="${esc(dayLabel(date))}, ${esc(say)}">
      <span class="cal-num">${d}</span>
      <span class="cal-marks">${groups.map((g) => `<span class="cal-mark" title="${esc(g.c.label)}"><span class="cal-ico">${g.c.icon}</span>${g.items.length > 1 ? `<sup>${g.items.length}</sup>` : ''}<span class="cal-t">${esc(calTitle(g.items[0]))}</span></span>`).join('')}</span>
    </button>`);
  }

  const startYear = Number(CALENDAR_START.slice(0, 4));
  const latest = records.reduce((a, r) => Math.max(a, Number((r.date || '0').slice(0, 4)) || 0), 0);
  const lastYear = Math.max(new Date().getFullYear(), latest) + 10; // 앞으로 10년 이상 넉넉히
  const yearOpts = [];
  for (let yy = startYear; yy <= lastYear; yy += 1) yearOpts.push(`<option value="${yy}" ${yy === y ? 'selected' : ''}>${yy}년</option>`);
  const monthOpts = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === m ? 'selected' : ''}>${i + 1}월</option>`).join('');
  const summary = CAL_CATS.filter((c) => monthCount.get(c.id)).map((c) => `${c.icon} ${c.label} ${monthCount.get(c.id)}`).join(' · ');
  const older = records.filter((r) => r.date && r.date.slice(0, 7) < CALENDAR_START).length;
  const filled = filledDaysHTML(y, m);

  view.innerHTML = `
    <h2 class="page-title">캘린더</h2>
    <p class="page-sub">${startYear}년부터 이어지는 달력이에요. 날짜를 누르면 그날의 기록을 보고, 기록을 더할 수 있어요.</p>
    <div class="cal-head">
      <button type="button" class="btn ghost small" data-act="calShift" data-d="-1" ${ui.calMonth <= CALENDAR_START ? 'disabled' : ''}>◀ 이전 달</button>
      <select class="search" data-cal="year" aria-label="연도" style="min-width:0">${yearOpts.join('')}</select>
      <select class="search" data-cal="month" aria-label="월" style="min-width:0">${monthOpts}</select>
      <button type="button" class="btn ghost small" data-act="calShift" data-d="1">다음 달 ▶</button>
      ${ui.calMonth !== today.slice(0, 7) ? '<button type="button" class="btn ghost small" data-act="calToday">이번 달로</button>' : ''}
    </div>
    ${filled}
    <div class="chips">${CAL_CHIPS.map((c) => `<button type="button" class="chip ${ui.calHidden.has(c.id) ? '' : 'active'}" data-act="calCat" data-id="${c.id}" aria-pressed="${!ui.calHidden.has(c.id)}">${c.icon} ${esc(c.label)}</button>`).join('')}</div>
    <div class="cal-grid" role="grid" aria-label="${y}년 ${m}월">
      ${['월', '화', '수', '목', '금', '토', '일'].map((w) => `<div class="cal-dow">${w}</div>`).join('')}
      ${cells.join('')}
    </div>
    <p class="meta" style="margin-top:12px">${summary ? `${y}년 ${m}월의 기록: ${summary}` : `${y}년 ${m}월에는 아직 기록이 없어요.`}</p>
    ${older ? `<p class="meta">${startYear}년 이전 기록 ${older}개는 달력에 나타나지 않아요. (각 메뉴의 목록에서는 볼 수 있어요.)</p>` : ''}`;
}

// 기록한 날이 며칠인지 (하루에 여러 개를 남겨도 1일이에요. 예시 기록은 세지 않아요)
function filledDaysHTML(y, m) {
  const real = records.filter((r) => !r.sample && r.date && catOf(r));
  const days = (list) => new Set(list.map((r) => r.date)).size;
  const sampleNote = records.some((r) => r.sample) ? ' (예시 기록은 세지 않아요)' : '';
  if (!real.length) {
    return `<section class="card total-card"><p class="meta" style="margin:0">🌱 첫 기록을 남기면 여기에 기록한 날이 쌓여요.${sampleNote}</p></section>`;
  }
  const first = real.map((r) => r.date).sort()[0];
  const since = daysSince(first);
  return `<section class="card total-card">
    <div class="stats">
      <div class="stat"><b>${days(real.filter((r) => r.date.slice(0, 7) === ui.calMonth))}일</b><span>${m}월에 기록한 날</span></div>
      <div class="stat"><b>${days(real.filter((r) => r.date.slice(0, 4) === String(y)))}일</b><span>${y}년에 기록한 날</span></div>
      <div class="stat"><b>${days(real)}일</b><span>지금까지 기록한 날</span></div>
    </div>
    <p class="meta" style="margin:8px 0 0">🌱 ${since > 0 ? `${esc(dayLabel(first))}에 처음 남긴 뒤로 ${since}일이 지났어요.` : '오늘 첫 기록을 남겼어요.'}${sampleNote}</p>
  </section>`;
}

// 날짜를 누르면 그날의 기록을 한 창에 모아 보여줘요
function openDay(date) {
  ui.dayOpen = date;
  const list = records.filter((r) => r.date === date && catOf(r)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const card = { workout: workoutCard, violin: violinCard, study: studyCard, invest: investCard, art: artCard };
  const add = [['workout', '운동'], ['violin', '바이올린'], ['study', '경제 공부'], ['invest', '투자 기록'], ['art', '그림']]
    .map(([t, l]) => `<button type="button" class="btn ghost small" data-act="addOn" data-type="${t}" data-date="${date}">＋ ${l}</button>`).join('');
  openDlg(`
    <h2>${esc(dayLabel(date))}</h2>
    <div class="day-list">${list.length ? list.map((r) => card[r.type](r)).join('') : '<div class="empty">이 날은 아직 기록이 없어요.</div>'}</div>
    <div class="label" style="margin:14px 0 6px">이 날짜에 기록 더하기</div>
    <div class="row actions-row">${add}</div>
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
}

// 날짜 창 안에서 지우거나 체크했을 때 창의 내용을 새로 고쳐요
function refreshDay() {
  if (ui.dayOpen && dlg.open && dlg.querySelector('.day-list')) openDay(ui.dayOpen);
}

/* ---------------------------------------------------------------------
   10-3. 그림 올리기 편하게 (끌어다 놓기 · 붙여넣기 · 여러 장 한 번에)
   --------------------------------------------------------------------- */
let toastTimer = null;
function toast(msg, ms = 6000) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  // popover로 띄우면 열려 있는 창(날짜 창 등) 위에도 보여요. 못 쓰는 브라우저에서는 그냥 아래쪽에 떠요.
  try { if (el.showPopover) { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } } catch (e) { /* 괜찮아요 */ }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
    try { if (el.hidePopover && el.matches(':popover-open')) el.hidePopover(); } catch (e) { /* 괜찮아요 */ }
  }, ms);
}

/* ---------------------------------------------------------------------
   축하 한 줄 (새 기록을 저장한 뒤 잠깐 나타나요. 점수나 평가가 아니라 '남겼다'는 사실만 알려줘요)
   --------------------------------------------------------------------- */
const isMilestone = (n) => [5, 10, 20, 30, 50].includes(n) || (n >= 100 && n % 50 === 0);

function celebrationText(rec) {
  const c = catOf(rec);
  if (!c || !rec.date) return '';
  const real = records.filter((r) => !r.sample && r.date && catOf(r)); // 예시 기록은 세지 않아요
  const dayCount = (list) => new Set(list.map((r) => r.date)).size;
  if (real.length === 1) return '🌱 첫 기록을 남겼어요. 여기서부터 차곡차곡 쌓여요.';
  const newDay = real.filter((r) => r.date === rec.date).length === 1; // 이 날의 첫 기록인지
  const allDays = dayCount(real);
  if (newDay && isMilestone(allDays)) return `🎉 기록한 날이 모두 ${allDays}일이 되었어요.`;
  const nth = real.filter((r) => catOf(r).id === c.id).length;
  if (isMilestone(nth)) return `${c.icon} ${c.label} ${nth}번째${c.label.endsWith('기록') ? '예요' : ' 기록이에요'} 🎉`;
  const ym = rec.date.slice(0, 7);
  const monthDays = dayCount(real.filter((r) => r.date.slice(0, 7) === ym));
  const head = rec.date === todayStr() ? '오늘도 남겼어요' : `${shortDay(rec.date)} 기록을 남겼어요`;
  return `🌱 ${head}${newDay && monthDays >= 2 ? ` · ${Number(ym.slice(5))}월에 ${monthDays}일 기록했어요` : ''}`;
}

function celebrate(rec) {
  if (settings.celebrateOff) return;
  const msg = celebrationText(rec);
  if (msg) toast(msg, 5000);
}

// 사진 파일 하나 → 새 그림 입력 창(사진이 붙은 채로 열림), 여러 장 → 한 장씩 "간단 기록"으로 만들기
async function addArtFromFiles(files) {
  const imgs = files.filter(isImage);
  if (!imgs.length) { toast('이미지 파일(사진)만 올릴 수 있어요.'); return; }
  if (imgs.length === 1) {
    openForm('art');
    const dateInput = $('#f_date');
    if (dateInput) dateInput.value = dateOfFile(imgs[0]); // 사진 파일의 날짜를 미리 넣어 둬요 (바꿀 수 있어요)
    await attachImage(imgs[0]);
    return;
  }
  let added = 0;
  let skipped = 0;
  for (let i = 0; i < imgs.length; i += 1) {
    toast(`올리는 중이에요… ${i + 1}/${imgs.length}`, 60000);
    try {
      const image = await readImage(imgs[i]);
      const saved = await saveRecord({
        id: newId(), type: 'art', createdAt: Date.now() + i, updatedAt: Date.now(),
        quick: true, date: dateOfFile(imgs[i]), topic: '', image,
      });
      if (!saved) break; // 저장 공간이 모자라면 saveRecord가 이미 알려 줬어요
      added += 1;
    } catch (e) { skipped += 1; }
  }
  render();
  toast(added
    ? `${added}장을 "간단 기록"으로 추가했어요. 카드의 '수정'에서 주제와 메모를 채워 보세요.${skipped ? ` (${skipped}장은 이미지로 열 수 없어 건너뛰었어요)` : ''}`
    : '올리지 못했어요. 이미지 파일인지 확인해 주세요.');
}

const hasFiles = (e) => !!(e.dataTransfer && [...e.dataTransfer.types].includes('Files'));
const imgFormOpen = () => dlg.open && !!dlg.querySelector('#dropZone');
const multiFormOpen = () => dlg.open && !!dlg.querySelector('#dropZone[data-multi]');
// 사진을 화면에 바로 놓았을 때 새 기록이 만들어지는 화면: 그림 화면(그림 기록), 운동·바이올린 화면(운동 기록에 워치 캡처)
const dropTarget = () => (dlg.open ? null : ui.tab === 'art' ? 'art' : ui.tab === 'body' ? 'body' : null);
const DROP_HINT = { art: '🖼 여기에 놓으면 새 그림 기록이 만들어져요', body: '🖼 여기에 놓으면 새 운동 기록에 워치 캡처가 붙어요' };
let dragTimer = null;

// 운동 기록 입력 창을 열고 워치 캡처를 붙여 줘요 (날짜는 사진 파일의 날짜)
async function addWorkoutFromFiles(files) {
  const imgs = files.filter(isImage);
  if (!imgs.length) { toast('이미지 파일(사진)만 올릴 수 있어요.'); return; }
  openForm('workout');
  const dateInput = $('#f_date');
  if (dateInput) dateInput.value = dateOfFile(imgs[0]);
  await attachShots(imgs);
}

function endDrag() {
  clearTimeout(dragTimer);
  $('#dropOverlay').hidden = true;
  const z = $('#dropZone');
  if (z) z.classList.remove('over');
}

document.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault(); // 이렇게 해야 브라우저가 사진을 열어 버리면서 기록장이 사라지지 않아요
  const z = $('#dropZone');
  if (z) z.classList.toggle('over', !!(e.target.closest && e.target.closest('#dropZone')));
  const target = dropTarget();
  if (target) {
    const box = $('#dropOverlay');
    box.firstElementChild.textContent = DROP_HINT[target];
    box.hidden = false;
  }
  clearTimeout(dragTimer);
  dragTimer = setTimeout(endDrag, 250); // 끌고 있는 동안만 안내를 보여줘요
});

document.addEventListener('drop', async (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  endDrag();
  const files = [...e.dataTransfer.files];
  const target = dropTarget();
  if (imgFormOpen()) {
    const imgs = files.filter(isImage);
    if (!imgs.length) { $('#formError').textContent = '이미지 파일(사진)만 넣을 수 있어요.'; return; }
    if (multiFormOpen()) await attachShots(imgs);
    else if (await attachImage(imgs[0]) && imgs.length > 1) {
      $('#imgNote').textContent = '한 기록에는 그림을 한 장만 넣을 수 있어서 첫 번째만 넣었어요. 여러 장은 그림 화면에 한꺼번에 놓아 보세요.';
    }
  } else if (target === 'art') {
    await addArtFromFiles(files);
  } else if (target === 'body') {
    await addWorkoutFromFiles(files);
  } else if (!dlg.open) {
    toast('사진은 🎨 그림 기록 화면이나 🧘 운동·바이올린 화면에 끌어다 놓아 주세요.');
  }
});

// Ctrl+V(붙여넣기): 캡처하거나 복사한 그림을 바로 넣어요
document.addEventListener('paste', async (e) => {
  const imgs = [...(e.clipboardData ? e.clipboardData.files : [])].filter(isImage);
  if (!imgs.length) return;
  const target = dropTarget();
  if (imgFormOpen()) { e.preventDefault(); if (multiFormOpen()) await attachShots(imgs); else await attachImage(imgs[0]); }
  else if (target === 'art') { e.preventDefault(); await addArtFromFiles([imgs[0]]); }
  else if (target === 'body') { e.preventDefault(); await addWorkoutFromFiles(imgs); }
});

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
let formShots = []; // 입력 창에서 고른 워치 캡처들

function fieldHTML(f, value) {
  const id = `f_${f.key}`;
  const req = f.required ? ' <span class="req">*</span>' : '';
  const v = value ?? '';
  let input;
  if (f.type === 'textarea') {
    input = `<textarea id="${id}" name="${f.key}">${esc(v)}</textarea>`;
  } else if (f.type === 'tasks') { // 한 줄에 하나씩 적는 목록 (레슨 과제)
    const text = Array.isArray(value) ? value.map((t) => t.text).join('\n') : '';
    input = `<textarea id="${id}" name="${f.key}">${esc(text)}</textarea>`;
  } else if (f.type === 'select') {
    const opts = (f.options || []).map((o) => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');
    input = `<select id="${id}" name="${f.key}">${f.required ? '' : '<option value="">(선택 안 함)</option>'}${opts}</select>`;
  } else if (f.type === 'images') { // 여러 장 (워치 캡처)
    input = `<input id="${id}" type="file" accept="image/*" multiple class="sr-only">
      <label class="dropzone" id="dropZone" data-multi="1" for="${id}"><span>🖼 여기에 ${esc(f.noun || '사진')}를 끌어다 놓거나, 눌러서 고르세요</span>
        <small>컴퓨터에서는 Ctrl+V(붙여넣기)도 돼요 · 최대 ${SHOT_MAX}장 · 휴대폰은 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote"></div>
      <div id="imgPreviewBox"></div>`;
  } else if (f.type === 'image') {
    input = `<input id="${id}" type="file" accept="image/*" class="sr-only">
      <label class="dropzone" id="dropZone" for="${id}"><span>🖼 여기에 그림을 끌어다 놓거나, 눌러서 고르세요</span>
        <small>컴퓨터에서는 Ctrl+V(붙여넣기)도 돼요 · 휴대폰은 카메라나 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote"></div>
      <div id="imgPreviewBox"></div>`;
  } else {
    const extra = f.type === 'number' ? ` min="${f.min ?? ''}" step="${f.step ?? 1}" inputmode="decimal"` : '';
    const sugg = f.suggest ? ' list="pieceList" autocomplete="off"' : '';
    input = `<input id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}"${extra}${sugg}>`;
  }
  return `<div class="field" data-only="${esc(f.only || '')}"><label for="${id}">${esc(f.label)}${req}</label>${input}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
}

// 종류(연습/레슨)에 맞지 않는 칸은 숨겨요
function syncKindFields(form) {
  const schema = SCHEMAS[form.dataset.type];
  if (!schema.kindKey) return;
  const kind = form.elements[schema.kindKey].value;
  form.querySelectorAll('.field[data-only]').forEach((el) => { el.hidden = !!el.dataset.only && el.dataset.only !== kind; });
}

function updateImagePreview() {
  const box = $('#imgPreviewBox');
  if (!box) return;
  if ($('#dropZone').dataset.multi) { // 여러 장: 작은 그림들과 '빼기' 버튼
    box.innerHTML = formShots.length
      ? `<div class="shot-row">${formShots.map((src, i) => `<div class="shot"><img class="shot-img" src="${esc(src)}" alt="고른 사진 ${i + 1}"><button type="button" class="btn ghost small" data-act="removeShot" data-i="${i}">빼기</button></div>`).join('')}</div>`
      : '';
    return;
  }
  box.innerHTML = formImage
    ? `<img class="preview" src="${esc(formImage)}" alt="선택한 그림"><button type="button" class="btn ghost small" data-act="clearImage" style="margin-top:6px">이미지 빼기</button>`
    : '';
}

// 저장하고 나면: 캘린더의 '날짜 창'에서 온 거라면 그 창으로 돌아가고, 아니면 창을 닫아요
function afterSave() {
  const back = ui.backToDay;
  render();
  if (back) openDay(back); else closeDlg();
}

function openForm(type, existing, presetDate) {
  const schema = SCHEMAS[type];
  ui.backToDay = dlg.open && dlg.querySelector('.day-list') ? ui.dayOpen : null;
  const rec = existing ? { ...existing } : { date: presetDate || todayStr() };
  // 종류 칸이 없던 예전 바이올린 기록은 '연습'으로 봐요
  if (schema.kindKey && !rec[schema.kindKey]) rec[schema.kindKey] = schema.fields.find((f) => f.key === schema.kindKey).options[0];
  formImage = rec.image || null;
  formShots = Array.isArray(rec.shots) ? [...rec.shots] : [];
  const datalist = type === 'violin'
    ? `<datalist id="pieceList">${knownPieces().map((p) => `<option value="${esc(p)}">`).join('')}</datalist>` : '';
  openDlg(`
    <h2>${esc(schema.label)} ${existing ? '수정' : '추가'}</h2>
    ${existing && existing.quick ? '<p class="hint" style="margin:-6px 0 12px">간단 기록이에요. 나머지 칸은 천천히 채워도 돼요. 꼭 써야 하는 칸까지 채워 저장하면 \'간단 기록\' 표시가 사라져요.</p>' : ''}
    <form id="recForm" novalidate>
      ${schema.fields.map((f) => fieldHTML(f, rec[f.key])).join('')}
      ${datalist}
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`);
  const form = dlg.querySelector('#recForm');
  form.dataset.type = type;
  form.dataset.id = existing ? existing.id : '';
  syncKindFields(form);
  updateImagePreview();
  const first = dlg.querySelector('input:not([type=file]):not([type=date]), textarea');
  if (first && !existing) first.focus();
}

const isImage = (f) => !!f && typeof f.type === 'string' && f.type.startsWith('image/');
// 사진 파일의 날짜 (미래 날짜는 오늘로)
function dateOfFile(f) {
  const t = toStr(new Date(f.lastModified || Date.now()));
  return t > todayStr() ? todayStr() : t;
}

// 입력 창에 그림 한 장 붙이기
async function attachImage(file) {
  const err = $('#formError');
  if (!isImage(file)) { if (err) err.textContent = '이미지 파일(사진)만 넣을 수 있어요.'; return false; }
  try {
    formImage = await readImage(file);
    updateImagePreview();
    if (err) err.textContent = '';
    return true;
  } catch (e) {
    if (err) err.textContent = '이 파일은 이미지로 열 수 없어요. 다른 파일을 골라 주세요.';
    return false;
  }
}

// 입력 창에 워치 캡처 여러 장 붙이기 (SHOT_MAX장까지)
async function attachShots(files) {
  const err = $('#formError');
  const note = $('#imgNote');
  const imgs = files.filter(isImage);
  if (!imgs.length) { if (err) err.textContent = '이미지 파일(사진)만 넣을 수 있어요.'; return false; }
  const room = SHOT_MAX - formShots.length;
  if (room <= 0) { if (note) note.textContent = `캡처는 한 기록에 ${SHOT_MAX}장까지 넣을 수 있어요. 필요 없는 것은 '빼기'를 눌러 주세요.`; return false; }
  let added = 0;
  for (const f of imgs.slice(0, room)) {
    try { formShots.push(await readImage(f)); added += 1; } catch (e) { if (err) err.textContent = '이미지로 열 수 없는 파일은 건너뛰었어요.'; }
  }
  updateImagePreview();
  if (added && err) err.textContent = '';
  if (note) note.textContent = imgs.length > room ? `${SHOT_MAX}장까지만 넣을 수 있어서 ${room}장만 넣었어요.` : '';
  return added > 0;
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
  const kind = schema.kindKey ? form.elements[schema.kindKey].value : null;
  const old = records.find((r) => r.id === form.dataset.id);
  const relaxed = !!(old && old.quick); // 간단 기록은 아직 비어 있던 필수 칸을 그대로 비워 둬도 저장돼요
  let complete = true;
  const data = {};
  for (const f of schema.fields) {
    if (f.only && f.only !== kind) continue; // 다른 종류의 칸은 저장하지 않아요
    if (f.type === 'image') { data[f.key] = formImage || ''; continue; }
    if (f.type === 'images') { data[f.key] = [...formShots]; continue; }
    if (f.type === 'tasks') {
      const prev = new Map((old && Array.isArray(old[f.key]) ? old[f.key] : []).map((t) => [t.text, !!t.done]));
      data[f.key] = form.elements[f.key].value.split('\n').map((l) => l.trim()).filter(Boolean)
        .map((text) => ({ text, done: prev.get(text) || false }));
      continue;
    }
    const raw = (form.elements[f.key].value || '').trim();
    if (f.required && !raw) {
      complete = false;
      if (!(relaxed && !old[f.key])) { err.textContent = `'${f.label}' 칸을 채워 주세요.`; form.elements[f.key].focus(); return; }
    }
    if (f.type === 'number') {
      if (raw === '') { data[f.key] = ''; continue; }
      const n = Number(raw);
      if (!Number.isFinite(n) || (f.min !== undefined && n < f.min)) { err.textContent = `'${f.label}' 칸에는 올바른 숫자를 써 주세요.`; form.elements[f.key].focus(); return; }
      data[f.key] = n;
    } else {
      data[f.key] = raw;
    }
  }
  const rec = {
    id: old ? old.id : newId(),
    type,
    createdAt: old ? old.createdAt : Date.now(),
    updatedAt: Date.now(),
    ...Object.fromEntries(HIDDEN_KEYS.filter((k) => old && old[k] !== undefined).map((k) => [k, old[k]])), // 화면에서 뺀 예전 칸(분·거리·템포)은 숨기기만 하고 값은 보관
    ...data,
  }; // 예시 표시(sample)는 직접 고치면 사라져요. 내 기록이 되었다는 뜻이에요.
  if (relaxed && !complete) rec.quick = true; // 아직 덜 채웠으면 '간단 기록' 표시 유지
  if (await saveRecord(rec)) { afterSave(); if (!old) celebrate(rec); }
}

/* ---------------------------------------------------------------------
   빠른 기록 (날짜, 종류, 한 줄 메모만 적는 짧은 입력 창)
   --------------------------------------------------------------------- */
function openQuick(menu) {
  const q = QUICK[menu];
  const opts = q.kinds.map((k, i) => `<option value="${i}">${esc(k.label)}</option>`).join('');
  openDlg(`
    <h2>⚡ ${esc(q.title)}</h2>
    <p class="meta" style="margin-top:0">가볍게 남기고, 나머지 칸은 나중에 카드의 '수정'에서 채워요.</p>
    <form id="quickForm" data-menu="${menu}" novalidate>
      <div class="field"><label for="q_date">날짜 <span class="req">*</span></label><input id="q_date" name="date" type="date" value="${todayStr()}"></div>
      <div class="field"><label for="q_kind">종류 <span class="req">*</span></label><select id="q_kind" name="kind">${opts}</select></div>
      <div class="field"><label for="q_memo">한 줄 메모${q.memoRequired ? ' <span class="req">*</span>' : ' - 선택'}</label><input id="q_memo" name="memo" type="text" maxlength="200"></div>
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`);
  syncQuick();
  $('#q_memo').focus();
}

// 고른 종류에 맞게 시간 칸을 보이거나 숨기고, 메모 칸 안내 글을 바꿔요
function syncQuick() {
  const form = $('#quickForm');
  if (!form) return;
  const k = QUICK[form.dataset.menu].kinds[form.elements.kind.value];
  $('#q_memo').placeholder = k.hint || '';
}

async function submitQuick(form) {
  const q = QUICK[form.dataset.menu];
  const k = q.kinds[form.elements.kind.value];
  const err = $('#formError');
  const date = form.elements.date.value;
  const memo = form.elements.memo.value.trim();
  if (!date) { err.textContent = "'날짜' 칸을 채워 주세요."; return; }
  if (q.memoRequired && !memo) { err.textContent = "'한 줄 메모' 칸을 채워 주세요."; return; }
  const rec = { id: newId(), type: k.type, createdAt: Date.now(), updatedAt: Date.now(), quick: true, date, ...k.data };
  if (memo) rec[k.memoKey] = memo;
  if (await saveRecord(rec)) { afterSave(); celebrate(rec); }
}

/* ---------------------------------------------------------------------
   자동 저장 (내 컴퓨터의 파일에 저장)
   --------------------------------------------------------------------- */
const autosaveSupported = () => 'showSaveFilePicker' in window && Store.mode === 'indexeddb';

function backupPayload() {
  return { app: 'my-journal', version: 1, exportedAt: new Date().toISOString(), records };
}

// 백업 파일에서 쓸 수 있는 기록만 골라요 (형식이 다르면 null)
function validRecords(payload) {
  if (!payload || payload.app !== 'my-journal' || !Array.isArray(payload.records)) return null;
  return payload.records.filter((r) => r && typeof r.id === 'string' && SCHEMAS[r.type] && typeof r.date === 'string');
}

async function refreshAutosaveState() {
  if (!autosave.handle) { autosave.status = 'off'; return; }
  try {
    autosave.status = (await autosave.handle.queryPermission({ mode: 'readwrite' })) === 'granted' ? 'on' : 'paused';
  } catch (e) { autosave.status = 'paused'; }
}

function scheduleAutosave() {
  if (autosave.status !== 'on') return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(runAutosave, 1200); // 짧은 시간에 여러 번 바꿔도 한 번에 저장해요
}

async function runAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = null;
  if (!autosave.handle || autosave.status !== 'on') return;
  try {
    const w = await autosave.handle.createWritable(); // 다 쓴 뒤에 바뀌어서, 저장 도중 멈춰도 예전 파일이 남아요
    await w.write(JSON.stringify(backupPayload()));
    await w.close();
    autosave.lastSavedAt = new Date();
  } catch (e) {
    autosave.status = 'paused';
  }
  renderBackupBar();
  refreshSettings();
}

function refreshSettings() {
  if (dlg.open && dlg.querySelector('.settings-list')) openSettings();
}

async function enableAutosave() {
  let handle;
  try {
    handle = await window.showSaveFilePicker({
      suggestedName: '나의기록장-자동저장.json',
      types: [{ description: '기록장 파일', accept: { 'application/json': ['.json'] } }],
    });
  } catch (e) { return; } // 파일 고르기를 취소함
  // 이미 기록이 들어 있는 파일이면 먼저 합쳐요. (빈 기록으로 덮어써서 잃어버리지 않도록)
  try {
    const text = await (await handle.getFile()).text();
    if (text.trim()) {
      const good = validRecords(JSON.parse(text));
      if (good === null) throw new Error('형식 오류');
      if (good.length) {
        if (!confirm(`이 파일에 기록이 ${good.length}개 들어 있어요.\n지금 기록과 합쳐서 계속 사용할까요?\n(취소하면 자동 저장을 켜지 않아요)`)) return;
        const mine = new Map(records.map((r) => [r.id, r]));
        await Store.putMany(good.filter((r) => !mine.has(r.id) || (mine.get(r.id).updatedAt || 0) < (r.updatedAt || 0)));
        records = await loadRecords();
      }
    }
  } catch (e) {
    if (!confirm('이 파일은 기록장 파일이 아니에요. 그래도 이 파일에 자동 저장할까요?\n(파일의 기존 내용은 지워져요)')) return;
  }
  autosave.handle = handle;
  autosave.name = handle.name || '';
  autosave.status = 'on';
  try {
    await Store.putMany([{ id: '__meta_autosave', type: 'meta', handle, name: autosave.name }]);
  } catch (e) { /* 저장 못 하면 이번 사용 중에만 켜져 있어요 */ }
  await runAutosave();
  render();
  refreshSettings();
}

async function reconnectAutosave() {
  try {
    if ((await autosave.handle.requestPermission({ mode: 'readwrite' })) === 'granted') autosave.status = 'on';
  } catch (e) { /* 허락하지 않으면 그대로 멈춰 있어요 */ }
  if (autosave.status === 'on') await runAutosave();
  render();
  refreshSettings();
}

async function disableAutosave() {
  autosave.status = 'off';
  autosave.handle = null;
  autosave.name = '';
  clearTimeout(autosaveTimer);
  await Store.remove(['__meta_autosave']);
  render();
  refreshSettings();
}

function autosaveCardHTML() {
  const t = autosave.lastSavedAt ? `${pad(autosave.lastSavedAt.getHours())}:${pad(autosave.lastSavedAt.getMinutes())}` : null;
  let state;
  if (!autosaveSupported()) {
    state = '<p class="meta">이 브라우저에서는 자동 저장을 쓸 수 없어요. 크롬이나 엣지(컴퓨터)에서 열면 쓸 수 있어요. 지금은 아래의 백업 파일을 가끔 내려받아 주세요.</p>';
  } else if (autosave.status === 'on') {
    state = `<p class="meta"><b>켜져 있어요</b> · 저장 파일: ${esc(autosave.name)}${t ? ` · 마지막 저장 ${t}` : ''}</p>
      <button type="button" class="btn ghost small" data-act="autosaveOff">자동 저장 끄기</button>`;
  } else if (autosave.handle) {
    state = `<p class="meta"><b>잠시 멈춰 있어요</b> · 저장 파일: ${esc(autosave.name)}<br>브라우저를 다시 열면 한 번 눌러 주세요.</p>
      <button type="button" class="btn red" data-act="autosaveReconnect">다시 연결</button>
      <button type="button" class="btn ghost small" data-act="autosaveOff">자동 저장 끄기</button>`;
  } else {
    state = '<p class="meta">아직 꺼져 있어요. 켜면서 저장할 파일 위치를 한 번만 골라 주세요.</p><button type="button" class="btn" data-act="autosaveOn">자동 저장 켜기</button>';
  }
  return `<div class="card" style="margin:0">
    <h3>💾 자동 저장 (내 컴퓨터의 파일)</h3>
    <p class="meta">기록을 바꿀 때마다 내가 고른 파일에도 저장해요. 브라우저의 "쿠키 및 사이트 데이터"를 지워서 기록이 사라져도, 이 파일을 <b>백업 파일 불러오기</b>로 불러오면 되살아나요.</p>
    ${state}
  </div>`;
}

/* ---------------------------------------------------------------------
   백업 알림 (마지막 백업 날짜 기억하기)
   --------------------------------------------------------------------- */
const daysSince = (dateStr) => Math.round((parseDate(todayStr()) - parseDate(dateStr)) / 86400000);

async function saveSettings() {
  try { await Store.putMany([{ id: '__meta_settings', type: 'meta', ...settings }]); } catch (e) { /* 저장 못 해도 기록은 안전해요 */ }
}

function lastBackupText() {
  if (!settings.lastBackupAt) return '아직 없어요';
  const d = daysSince(settings.lastBackupAt);
  return `${settings.lastBackupAt} (${d <= 0 ? '오늘' : `${d}일 전`})`;
}

function renderBackupBar() {
  const bar = $('#backupBar');
  const last = settings.lastBackupAt;
  const days = last ? daysSince(last) : null;
  const snoozed = settings.snoozeUntil && todayStr() < settings.snoozeUntil;
  let html = '';
  if (autosave.handle && autosave.status === 'paused') {
    html = `<span>💾 자동 저장이 멈춰 있어요 (브라우저를 다시 열면 한 번 연결이 필요해요)</span>
      <span class="row"><button type="button" class="btn red small" data-act="autosaveReconnect">다시 연결</button></span>`;
  } else if (autosave.status !== 'on' && records.length > 0 && !snoozed && (last === null || days >= BACKUP_REMIND_DAYS)) {
    html = `<span>🔔 ${last === null ? '아직 백업한 적이 없어요' : `마지막 백업 후 ${days}일이 지났어요`}</span>
      <span class="row">
        <button type="button" class="btn red small" data-act="backupNow">지금 백업</button>
        <button type="button" class="btn ghost small" data-act="snooze">나중에</button>
      </span>`;
  }
  bar.hidden = !html;
  bar.innerHTML = html;
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
      ${autosaveCardHTML()}
      <div class="card" style="margin:0">
        <h3>백업 파일 만들기</h3>
        <p class="meta">모든 기록(그림 포함)을 파일 하나로 저장해요. 브라우저 기록을 지우기 전이나 컴퓨터를 바꿀 때 꼭 해 두세요.</p>
        <p class="meta"><b>마지막 백업: ${esc(lastBackupText())}</b></p>
        <button type="button" class="btn" data-act="export">백업 파일 내려받기</button>
      </div>
      <div class="card" style="margin:0">
        <h3>백업 파일 불러오기</h3>
        <p class="meta">백업 파일의 기록을 지금 기록에 더해요. (같은 기록은 덮어써요)</p>
        <input type="file" id="importFile" accept=".json,application/json">
      </div>
      <div class="card" style="margin:0">
        <h3>🎉 축하 한 줄</h3>
        <p class="meta">새 기록을 저장하면 화면 아래에 잠깐 나타나는 한 줄이에요. 점수나 평가가 아니라, 남겼다는 사실만 알려줘요. 예시 기록은 세지 않아요.</p>
        <label class="meta"><input type="checkbox" data-act="celebrate" ${settings.celebrateOff ? '' : 'checked'}> 새 기록을 저장할 때 축하 한 줄 보이기</label>
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

async function exportBackup() {
  const payload = backupPayload();
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `나의기록장-백업-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  settings.lastBackupAt = todayStr();
  settings.snoozeUntil = null;
  await saveSettings();
  renderBackupBar();
  if (dlg.open && dlg.querySelector('[data-act=export]')) openSettings(); // 설정 창의 날짜 새로 고침
}

async function importBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    const good = validRecords(payload);
    if (!good) throw new Error('형식 오류');
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
      if (confirm(`'${name}' 기록을 지울까요?\n지운 기록은 되돌릴 수 없어요.`)) { await deleteRecord(id); render(); refreshDay(); }
      break;
    }
    case 'closeDlg':
      if (ui.backToDay && dlg.querySelector('#recForm')) openDay(ui.backToDay); else closeDlg();
      break;
    case 'calDay': openDay(el.dataset.date); break;
    case 'addOn': openForm(type, undefined, el.dataset.date); break;
    case 'calShift': ui.calMonth = shiftMonth(ui.calMonth, Number(el.dataset.d)); render(); break;
    case 'calToday': ui.calMonth = todayStr().slice(0, 7); render(); break;
    case 'calCat':
      if (ui.calHidden.has(id)) ui.calHidden.delete(id); else ui.calHidden.add(id);
      render();
      break;
    case 'clearImage': formImage = null; updateImagePreview(); break;
    case 'removeShot': formShots.splice(Number(el.dataset.i), 1); updateImagePreview(); { const n = $('#imgNote'); if (n) n.textContent = ''; } break;
    case 'zoomShot': {
      const r = records.find((x) => x.id === id);
      const src = r && Array.isArray(r.shots) ? r.shots[Number(el.dataset.i)] : null;
      if (src) openDlg(`<img class="zoom-img" src="${esc(src)}" alt="워치 캡처"><p class="meta" style="text-align:center">${esc(dayLabel(r.date))} · ${esc(r.kind || '운동')} · 워치 캡처 ${Number(el.dataset.i) + 1}/${r.shots.length}</p><div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
      break;
    }
    case 'copyWeek': openWeekCopy(); break;
    case 'copyAgain': await copyFromBox(); break;
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
    case 'autosaveOn': await enableAutosave(); break;
    case 'autosaveReconnect': await reconnectAutosave(); break;
    case 'autosaveOff': await disableAutosave(); break;
    case 'quick': openQuick(el.dataset.menu); break;
    case 'backupNow': case 'export': exportBackup(); break;
    case 'snooze':
      settings.snoozeUntil = addDays(todayStr(), BACKUP_SNOOZE_DAYS);
      await saveSettings(); renderBackupBar();
      break;
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
  else if (e.target.id === 'quickForm') { e.preventDefault(); submitQuick(e.target); }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.act === 'hw') { await toggleHomework(t.dataset.id, Number(t.dataset.i), t.checked); }
  else if (t.id === 'f_kind' && t.form && t.form.id === 'recForm') { syncKindFields(t.form); }
  else if (t.id === 'q_kind') { syncQuick(); }
  else if (t.dataset.act === 'bodyRange') { ui.bodyAllRange = !t.checked; render(); }
  else if (t.dataset.cal) {
    const [cy, cm] = ui.calMonth.split('-').map(Number);
    const ny = t.dataset.cal === 'year' ? Number(t.value) : cy;
    const nm = t.dataset.cal === 'month' ? Number(t.value) : cm;
    ui.calMonth = `${ny}-${pad(nm)}`;
    render();
  } else if (t.id === 'artOrder') { ui.artOrder = t.value; render(); }
  else if (t.dataset.cmp) { ui[t.dataset.cmp === 'a' ? 'cmpA' : 'cmpB'] = t.value; render(); }
  else if (t.id === 'importFile' && t.files[0]) { await importBackup(t.files[0]); }
  else if (t.id === 'f_image' && t.files[0]) { await attachImage(t.files[0]); t.value = ''; }
  else if (t.id === 'f_shots' && t.files.length) { const files = [...t.files]; t.value = ''; await attachShots(files); }
  else if (t.dataset.act === 'celebrate') { settings.celebrateOff = !t.checked; await saveSettings(); }
  else if (t.id === 'artMulti' && t.files.length) { const files = [...t.files]; t.value = ''; await addArtFromFiles(files); }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search') { ui.query = e.target.value; $('#listBox').innerHTML = econListHTML(); }
});

$('#settingsBtn').addEventListener('click', openSettings);

// 창이 닫히면(취소·Esc 포함) 안에 있던 입력 내용도 비워요
dlg.addEventListener('close', () => { dlg.innerHTML = ''; formImage = null; formShots = []; ui.dayOpen = null; ui.backToDay = null; });

/* ---------------------------------------------------------------------
   14. 시작
   --------------------------------------------------------------------- */
async function loadRecords() {
  const all = await Store.all();
  const st = all.find((r) => r.id === '__meta_settings');
  const as = all.find((r) => r.id === '__meta_autosave');
  if (as && as.handle) { autosave.handle = as.handle; autosave.name = as.name || as.handle.name || ''; }
  if (st) settings = { lastBackupAt: st.lastBackupAt || null, snoozeUntil: st.snoozeUntil || null, celebrateOff: !!st.celebrateOff };
  seeded = all.some((r) => r.id === '__meta_seeded');
  return all.filter((r) => r.type !== 'meta');
}

async function start() {
  await Store.init();
  records = await loadRecords();
  await refreshAutosaveState();
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

document.addEventListener('visibilitychange', () => { if (document.hidden && autosaveTimer) runAutosave(); }); // 탭을 닫기 직전에도 저장

start().catch((err) => {
  view.innerHTML = `<div class="notice" style="max-width:none">시작하는 중 문제가 생겼어요: ${esc(err.message)}<br>크롬 같은 다른 브라우저로 열어 보세요.</div>`;
});
