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
const HIDDEN_KEYS = ['minutes'];

// 하루가 바뀌는 시각: 새벽 4시 전에 남긴 기록은 전날 기록으로 쳐요. (자정 기준으로 돌리려면 0)
const DAY_STARTS_AT = 4;

// 연습량(살짝 / 적당히 / 듬뿍)과 하고 나서 기분. 시간을 숫자로 적지 않고 버튼으로만 골라요.
//   v: 저장되는 값, icon: 버튼과 카드에 보이는 그림, label: 이름
const AMOUNTS = [
  { v: 1, icon: '●○○', label: '살짝' },
  { v: 2, icon: '●●○', label: '적당히' },
  { v: 3, icon: '●●●', label: '듬뿍' },
];
const MOODS = [
  { v: 'good', icon: '😊', label: '좋았어요' },
  { v: 'ok', icon: '🙂', label: '보통이에요' },
  { v: 'tired', icon: '😮‍💨', label: '지쳤어요' },
];

/* ---------------------------------------------------------------------
   ✏️ 칩(눌러서 고르는 버튼) 선택지 - 메모장으로 고쳐도 돼요
   - 따옴표 안의 글자만 바꾸거나, 쉼표로 이어서 더하거나 빼세요. (따옴표와 쉼표는 지우지 마세요)
   - 이미 저장한 기록은 그대로 남아요. (예전에 고른 글자는 지워도 카드에 계속 보여요)
   - 투자 기분(investFeeling)은 앞의 그림이 그대로 버튼에 보여요.
   - 투자 '언제 돌아볼까?'(investReviewIn)는 "3개월 뒤"처럼 숫자+개월이 들어 있으면 그 날짜가 자동 계산돼요.
   --------------------------------------------------------------------- */
const CHIPS = {
  // 📚 경제 공부
  studyMethod: ['뉴스·기사', '책', '유튜브·강의', '개념 정리'],
  studyArea: ['금리·물가', '환율', '주식·ETF', '채권', '부동산', '세금·절세', '연금', '경제 일반'],
  // 📊 투자 (기록과 복기 전용)
  investAction: ['관심만', '샀음', '팔았음', '보유 중 점검'],
  investReason: ['뉴스·이슈', '실적·숫자', '장기 성장', '배당', '분산 목적', '가격이 내려서', '주변 추천', '그냥 친숙해서'],
  investFeeling: ['😌 차분', '😬 조급', '🤩 들뜸', '😟 불안'],
  investReviewIn: ['1개월 뒤', '3개월 뒤', '6개월 뒤', '정하지 않음'],
  reviewGrounds: ['대체로 맞음', '반반', '빗나감', '아직 모름'],   // 복기: 근거는 맞았나?
  reviewMood: ['예', '아니오', '모르겠음'],                        // 복기: 기분이 판단에 영향을 줬나?
  // 🧘 요가 / 🏃 슬로조깅
  yogaDid: ['스트레칭', '코어', '밸런스', '호흡·명상', '영상 따라하기'],
  yogaRelief: ['목·어깨', '등', '허리', '골반·고관절', '다리', '전신'],
  weather: ['맑음', '흐림', '더움', '추움', '비'],
  pace: ['여유', '적당', '조금 벅참'],
  // 🎻 바이올린
  violinDid: ['개방현·활', '스케일', '에튀드', '곡', '레슨 과제'],
  violinFocus: ['음정', '박자', '보잉', '운지', '소리', '외우기'],
  violinStage: ['악보 익히는 중', '천천히 치는 중', '원래 템포 가까이', '다듬는 중'],
  // 🎨 그림
  artKind: ['모작', '창작', '연습'],
  artArea: ['선·형태', '인체·포즈', '얼굴·표정', '손', '명암', '채색', '배경', '캐릭터'],
};
const ART_KINDS = CHIPS.artKind;

/* ---------------------------------------------------------------------
   입력 칸 설정 (SCHEMAS)
   - 위에서부터 차례로 "기본 층"이에요. 항상 보이고, 이것만 채워도 저장돼요.
   - more: true 인 칸은 "✍ 더 적기" 접힘 영역 안에 들어가요. (새 기록에서는 접혀 있고, 수정할 때 내용이 있으면 펼쳐져요)
   - legacy: true 는 예전 칸이에요. 새 기록에서는 안 보이고, 값이 들어 있는 예전 기록을 고칠 때만 보여요. (카드에는 값이 있으면 계속 보여요)
   - only: 해당 종류일 때만 보이는 칸   placeholder: 회색 예시 문장   suggest: true 는 전에 쓴 값을 최근 순으로 제안
   - type: text / textarea / number / date / select / choice(버튼 하나) / chips(버튼 여러 개) / lines(한 줄에 하나) / tasks(체크 목록) / image / images
   - keep: 이 창에서 고치지 않아도 그대로 보관할 칸 (복기 창에서 적는 값 등)
   --------------------------------------------------------------------- */
const AMOUNT_FIELD = { key: 'amount', label: '연습량 - 선택', type: 'choice', choices: AMOUNTS, hint: '시간 대신 느낌으로 골라요. 다시 누르면 선택이 풀려요.' };
const MOOD_FIELD = { key: 'mood', label: '하고 나서 기분 - 선택', type: 'choice', choices: MOODS };

const SCHEMAS = {
  // 🧘 운동 기록 (요가 / 슬로조깅)
  workout: {
    label: '운동 기록',
    kindKey: 'kind', // '종류'에 따라 보이는 칸이 달라져요
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['요가', '슬로조깅'], required: true },
      { key: 'did', label: '주로 한 것 - 선택', type: 'chips', choices: CHIPS.yogaDid, only: '요가' },
      { key: 'distance', label: '거리 (km) - 선택', type: 'number', min: 0, step: 0.01, only: '슬로조깅', placeholder: '예: 3.2' },
      { key: 'weather', label: '날씨 - 선택', type: 'choice', choices: CHIPS.weather, only: '슬로조깅' },
      AMOUNT_FIELD,
      MOOD_FIELD,
      { key: 'memo', label: '한 줄 메모 - 선택', type: 'textarea', rows: 2, placeholder: '예: 퇴근 후 짧게 했다' },
      // ✍ 더 적기
      { key: 'relief', label: '시원했던 곳', type: 'chips', choices: CHIPS.yogaRelief, only: '요가', more: true },
      { key: 'bodyNote', label: '몸이 어땠나 한 줄', type: 'text', only: '요가', more: true, placeholder: '예: 오른쪽 골반이 더 뻣뻣했다' },
      { key: 'course', label: '따라 한 영상·수업', type: 'text', suggest: true, only: '요가', more: true, placeholder: '영상 제목이나 강사 이름 (전에 쓴 것이 제안돼요)' },
      { key: 'refs', label: '영상·수업 링크', type: 'textarea', links: true, rows: 2, only: '요가', more: true, hint: '한 줄에 링크 하나씩 적어 주세요.' },
      { key: 'place', label: '장소', type: 'text', suggest: true, only: '슬로조깅', more: true, placeholder: '예: 중랑천 (전에 쓴 것이 제안돼요)' },
      { key: 'pace', label: '대화할 수 있는 속도였나?', type: 'choice', choices: CHIPS.pace, only: '슬로조깅', more: true },
      { key: 'runThought', label: '달리며 든 생각 한 줄', type: 'text', only: '슬로조깅', more: true, placeholder: '예: 바람이 시원해서 발이 가벼웠다' },
      { key: 'shots', label: '워치 캡처', type: 'images', noun: '워치 캡처', more: true, hint: '갤럭시 워치·삼성 헬스 화면을 캡처해서 붙여 두세요.' },
      { key: 'claude', label: '클로드 피드백', type: 'textarea', more: true, hint: '클로드가 해 준 말을 그대로 붙여넣어 두세요. 나중에 카드나 캘린더의 날짜 창에서 다시 볼 수 있어요.' },
      { key: 'condition', label: '컨디션 (예전 칸)', type: 'select', options: ['좋음', '보통', '피곤함'], legacy: true, more: true },
    ],
  },
  // 🎻 바이올린 기록 (연습 / 레슨)
  violin: {
    label: '바이올린 기록',
    kindKey: 'kind',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['연습', '레슨'], required: true },
      { key: 'piece', label: '곡 이름', type: 'text', required: true, only: '연습', suggest: true, placeholder: '예: 바흐 미뉴에트 G장조 (전에 쓴 곡이 제안돼요)' },
      { key: 'did', label: '오늘 한 것 - 선택', type: 'chips', choices: CHIPS.violinDid, only: '연습' },
      { key: 'focus', label: '집중한 점 - 선택', type: 'chips', choices: CHIPS.violinFocus, only: '연습' },
      { ...AMOUNT_FIELD, only: '연습' },
      MOOD_FIELD,
      { key: 'feedback', label: '선생님 피드백', type: 'textarea', only: '레슨', placeholder: '예: 활을 줄에 수직으로 두는 연습을 더 하면 좋겠다고 하셨다' },
      { key: 'homework', label: '다음 레슨까지 과제', type: 'tasks', only: '레슨', hint: '한 줄에 과제 하나씩 적어 주세요. 체크는 목록에서 바로 할 수 있어요.', placeholder: '예: G장조 스케일 두 옥타브, 매일' },
      // ✍ 더 적기 (연습) - 잘 된 것을 가장 먼저
      { key: 'good', label: '오늘 잘 된 것 하나', type: 'text', only: '연습', more: true, placeholder: '예: 3포지션 이동이 덜 흔들렸다' },
      { key: 'tempo', label: '템포 (BPM) - 선택', type: 'number', min: 1, step: 1, only: '연습', more: true, placeholder: '예: 60', hint: '메트로놈 숫자예요. 곡 이름을 누르면 템포 변화를 그래프로 볼 수 있어요.' },
      { key: 'part', label: '연습한 부분', type: 'textarea', rows: 2, only: '연습', more: true, placeholder: '예: 1~8마디 운지, 활 다운-업' },
      { key: 'next', label: '다음에 해볼 것 하나', type: 'textarea', rows: 2, only: '연습', more: true, placeholder: '예: 메트로놈 60에 맞춰 9~16마디 이어서 치기' },
      { key: 'ask', label: '레슨 때 물어볼 것', type: 'tasks', only: '연습', more: true, hint: '한 줄에 하나씩. 물어봤으면 운동·바이올린 화면 위쪽의 레슨 패널에서 체크해요.', placeholder: '예: 3포지션에서 손목은 어떻게 두는지' },
      { key: 'stage', label: '이 곡 지금 어디쯤?', type: 'choice', choices: CHIPS.violinStage, only: '연습', more: true },
      { key: 'audio', label: '🎙 녹음', type: 'audio', only: '연습', more: true }, // 녹음 파일은 기록이 아니라 곡에 붙어서 따로 저장돼요
      { key: 'hard', label: '어려웠던 점 (예전 칸)', type: 'textarea', only: '연습', legacy: true, more: true },
      // ✍ 더 적기 (레슨)
      { key: 'praise', label: '선생님이 좋다고 한 것', type: 'text', only: '레슨', more: true, placeholder: '예: 활 쓰는 자세가 안정적이라고 하셨다' },
      { key: 'newLearn', label: '새로 배운 것 한 줄', type: 'text', only: '레슨', more: true, placeholder: '예: 자리를 옮길 때 팔꿈치를 먼저 움직인다' },
    ],
  },
  // 📚 경제 공부 메모
  study: {
    label: '경제 공부 메모',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'method', label: '공부 방식 - 선택', type: 'choice', choices: CHIPS.studyMethod },
      { key: 'areas', label: '분야 - 선택', type: 'chips', choices: CHIPS.studyArea },
      { key: 'topic', label: '주제', type: 'text', required: true, placeholder: '예: 금리와 물가의 관계' },
      AMOUNT_FIELD,
      MOOD_FIELD,
      // ✍ 더 적기
      { key: 'summary', label: '한 줄로 요약하면?', type: 'text', more: true, placeholder: '예: 금리가 오르면 대출이 줄고 소비가 식는다' },
      { key: 'terms', label: '새로 알게 된 용어', type: 'textarea', rows: 3, more: true, hint: '한 줄에 "용어 : 뜻"으로 적으면 📒 용어장에 모여요.', placeholder: '예: 기준금리 : 한국은행이 정하는 금리의 기준' },
      { key: 'connect', label: '내 생활·내 돈과 연결하면?', type: 'textarea', rows: 2, more: true, placeholder: '예: 내 예금 금리도 곧 바뀔 수 있겠다' },
      { key: 'unclear', label: '아직 헷갈리는 것', type: 'tasks', more: true, hint: '한 줄에 하나씩. 체크는 목록이나 ❓ 헷갈리는 것 화면에서 바로 할 수 있어요.', placeholder: '예: 금리가 오르면 환율은 왜 움직일까?' },
      { key: 'links', label: '참고 링크', type: 'textarea', links: true, more: true, hint: '한 줄에 링크 하나씩 적어 주세요.' },
      { key: 'learned', label: '더 자세한 내용 (자유롭게)', type: 'textarea', more: true },
    ],
  },
  // 📊 투자 기록 (기록과 복기 전용 - 추천·주문·시세·수익률 없음)
  invest: {
    label: '투자 기록',
    keep: ['rvGrounds', 'rvMood', 'rvAgain', 'lesson', 'reviewedOn'], // 복기 창에서 적는 값은 이 창에서 고쳐도 그대로 보관
    derive: (d) => { // '언제 돌아볼까?'에서 돌아볼 날짜를 계산해 둬요
      const n = /(\d+)\s*개월/.exec(d.reviewIn || '');
      return { reviewOn: n && d.date ? monthsAgo(d.date, -Number(n[1])) : '' };
    },
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'action', label: '기록 종류 - 선택', type: 'choice', choices: CHIPS.investAction },
      { key: 'asset', label: '관심 자산 / 종목', type: 'text', required: true, suggest: true, placeholder: '예: 국내 대형주 ETF (전에 쓴 것이 제안돼요)' },
      { key: 'reasons', label: '관심 이유 - 선택', type: 'chips', choices: CHIPS.investReason },
      { key: 'feeling', label: '그때 기분 - 선택', type: 'choice', choices: CHIPS.investFeeling },
      // ✍ 더 적기
      { key: 'grounds', label: '근거 세 가지', type: 'lines', max: 3, rows: 3, more: true, hint: '한 줄에 하나씩, 최대 3개까지예요.', placeholder: '예: 최근 실적이 꾸준히 늘었다\n배당을 꾸준히 준다\n내가 아는 회사다' },
      { key: 'wrongIf', label: '이 판단이 틀린다면, 이유는 뭘까?', type: 'textarea', rows: 2, more: true, placeholder: '예: 금리가 계속 오르면 기업 이익이 줄 수 있다' },
      { key: 'check', label: '확인하고 싶은 점', type: 'textarea', rows: 2, more: true, placeholder: '예: 구성 종목과 운용 보수는 어떻게 되는지' },
      { key: 'reviewIn', label: '언제 돌아볼까?', type: 'choice', choices: CHIPS.investReviewIn, more: true, hint: '고르면 그 날짜가 지난 뒤 "⏰ 돌아볼 때가 된 기록"에 조용히 모여요.' },
      { ...MOOD_FIELD, label: '적고 난 뒤 기분 - 선택', more: true },
      { key: 'thought', label: '당시 생각과 근거 (예전 칸)', type: 'textarea', legacy: true, more: true },
      { key: 'review', label: '나중에 돌아본 결과 (예전 칸)', type: 'textarea', legacy: true, more: true },
    ],
  },
  // 🎨 그림 발전 기록
  art: {
    label: '그림 기록',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'image', label: '그림 이미지', type: 'image' },
      { key: 'kind', label: '그림 종류 - 선택', type: 'choice', choices: CHIPS.artKind },
      { key: 'areas', label: '연습 영역 - 선택', type: 'chips', choices: CHIPS.artArea },
      { key: 'topic', label: '연습 주제', type: 'text', required: true, placeholder: '예: 손 그리기' },
      AMOUNT_FIELD,
      MOOD_FIELD,
      // ✍ 더 적기 - 마음에 드는 곳을 가장 먼저
      { key: 'liked', label: '마음에 드는 곳 하나', type: 'text', more: true, placeholder: '예: 머리카락 흐름' },
      { key: 'next', label: '다음에 해볼 것 하나', type: 'textarea', rows: 2, more: true, placeholder: '예: 손가락 마디 비율 다시 보기' },
      { key: 'course', label: '참고한 강의·영상 이름', type: 'text', suggest: true, more: true, placeholder: '유튜브 강의 제목 (전에 쓴 것이 제안돼요)' },
      { key: 'refs', label: '참고 링크', type: 'textarea', links: true, rows: 2, more: true, hint: '한 줄에 링크 하나씩 적어 주세요. 링크는 눌러서 열 수 있어요.' },
      { key: 'origin', label: '원작자 이름 (모작이면)', type: 'text', suggest: true, more: true, placeholder: '예: 작가 이름' },
      { key: 'tried', label: '새로 시도한 점', type: 'textarea', rows: 2, more: true },
      { key: 'tools', label: '사용한 도구', type: 'text', more: true, placeholder: '예: 클립 스튜디오, 아이패드' },
      { key: 'hard', label: '어려웠던 점 (예전 칸)', type: 'textarea', legacy: true, more: true },
    ],
  },
  // 😴 쉰 날 (쉬는 날도 기록이에요)
  rest: {
    label: '쉰 날',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'memo', label: '메모 - 선택', type: 'text' },
    ],
  },
  // 🎵 곡 메모 (곡 노트 창에서 곡마다 한 줄씩 남겨요. 백업 파일에도 들어가요)
  piecenote: {
    label: '곡 메모',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'piece', label: '곡 이름', type: 'text', required: true },
      { key: 'memo', label: '곡 메모', type: 'text' },
      // 📚 레퍼토리 책장: status 가 'done' 이면 "마무리한 곡"(doneAt 은 마무리한 날). 비어 있으면 연습 중이에요.
      { key: 'status', label: '상태', type: 'text' },
    ],
  },
};

// 메뉴 이름 (위쪽 탭)
const TABS = [
  { id: 'today', label: '✏️ 오늘' },
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

// "오늘" 탭의 큰 버튼. 누르면 연습량을 고르고, 한 번 더 누르면 오늘 날짜로 '간단 기록'이 저장돼요.
//   type/data: 만들어지는 기록의 종류, memoKey: 한 줄 메모가 들어갈 칸, hint: 메모 칸 안내 글
const TODAY_BUTTONS = [
  { key: 'yoga', icon: '🧘', label: '요가', type: 'workout', data: { kind: '요가' }, memoKey: 'memo', hint: '예: 아침 스트레칭' },
  { key: 'jog', icon: '🏃', label: '슬로조깅', type: 'workout', data: { kind: '슬로조깅' }, memoKey: 'memo', hint: '예: 동네 한 바퀴' },
  { key: 'violin', icon: '🎻', label: '바이올린', type: 'violin', data: { kind: '연습' }, memoKey: 'part', hint: '예: 미뉴에트 1~8마디' },
  { key: 'art', icon: '🎨', label: '그림', type: 'art', data: {}, memoKey: 'topic', hint: '예: 명암 연습' },
  { key: 'study', icon: '📚', label: '경제 공부', type: 'study', data: {}, memoKey: 'topic', hint: '예: 금리와 물가' },
];

// 도장: 기록을 저장하면 이 중에서 하나가 랜덤으로 나타나요. 앞의 그림이 도장, 뒤가 한 마디예요.
//   문구는 마음대로 고치거나 더해도 돼요. (평가나 비교하는 말은 넣지 않아요)
//   workout / practice(바이올린 연습) / lesson / study / invest / art / rest : 종류별 문구
//   general : 위에 없는 종류일 때, night : 밤에 저장했을 때(NIGHT_START시 ~ 다음 날 NIGHT_END시)
const STAMPS = {
  general: ['🌱 한 칸 남겼어요', '📌 도장 꾹!', '🍀 오늘의 기록 완료', '☕ 잠깐 숨 돌리기', '✨ 꾹, 도장', '📓 기록장에 한 줄', '🌱 남겨 뒀어요'],
  workout: ['🧘 오늘도 몸을 움직였다', '🌿 몸을 한번 풀었다', '🍃 숨을 크게 쉬었다', '☀️ 몸이 기억해요', '🧘 몸을 챙긴 하루', '🏃 한 걸음 남겼어요', '🌿 숨 한 번 크게'],
  practice: ['🎻 오늘도 켰다', '🎼 활을 잡았다', '🎶 소리를 냈다', '🎼 한 소절 남겼어요', '🎻 활이 지나간 자리'],
  lesson: ['🎓 레슨 기록 완료', '📝 배운 것을 적어 뒀다', '🎼 선생님 말씀을 남겼다'],
  study: ['📚 하나 알게 됐다', '💡 머릿속에 한 줄 새겼다', '📖 오늘도 펼쳤다', '📚 한 줄 배웠어요', '💡 메모 쏙', '📚 오늘의 한 페이지'],
  invest: ['📝 생각을 적어 뒀다', '🔍 나중에 돌아볼 기록', '🗒️ 근거를 남겼다', '📊 생각을 적어 뒀어요', '📝 나중의 나에게 남긴 메모'],
  art: ['🎨 오늘도 그렸다', '✏️ 선을 그었다', '🖌️ 손이 움직였다', '🎨 한 장 남겼어요', '✏️ 선 하나 더', '🖌 오늘의 그림 도장'],
  rest: ['😴 쉬는 것도 기록이에요', '🛋️ 충전하는 날', '🍵 푹 쉬었다', '😴 쉬는 날도 기록', '🛋 푹 쉬어요', '🌿 오늘은 쉬어 가기'],
  night: ['🌙 늦은 밤 수고했어요', '⭐ 하루 마무리 도장 꾹', '🌃 밤에도 남겼어요', '🛌 이제 쉬어도 돼요', '🌙 오늘 하루도 여기까지', '⭐ 이제 푹 쉬어요', '🌙 밤의 기록 한 줄'],
};
const NIGHT_START = 22; // 밤 10시부터
const NIGHT_END = 5;    // 새벽 5시 전까지는 밤 문구를 써요

// "그때의 나": 오늘 탭 아래에, 몇 달 전 오늘의 기록이 있으면 하나만 보여줘요. (위에서부터 먼저 있는 것 하나)
const MEMORY_LOOKBACKS = [{ months: 1, label: '한 달 전' }, { months: 3, label: '석 달 전' }, { months: 12, label: '1년 전' }];

// 백업 알림: 며칠이 지나면 알려줄지, '나중에'를 누르면 며칠 동안 숨길지
const BACKUP_REMIND_DAYS = 14;
const BACKUP_SNOOZE_DAYS = 3;

// 사진을 저장할 때 긴 변의 최대 크기(픽셀). 커질수록 선명하지만 저장 공간을 더 써요.
const IMAGE_MAX_SIZE = 1600;

// 운동 기록 하나에 붙일 수 있는 워치 캡처의 최대 장수
const SHOT_MAX = 4;

// 🎙 녹음: 한 곡에 붙일 수 있는 개수, 한 파일의 최대 길이(초)와 크기(바이트)
//   곡마다 처음 올린 녹음("🌱 첫 녹음")은 항상 보관되고 백업 파일에도 들어가요. 나머지는 이 브라우저 안에만 저장돼요.
const AUDIO_MAX_PER_PIECE = 5;
const AUDIO_MAX_SECONDS = 300;              // 5분
const AUDIO_MAX_BYTES = 15 * 1024 * 1024;   // 15MB

// 🍂 계절 장식: 달마다 위쪽 제목 옆과 화면 오른쪽 아래 모서리에 이모지 하나가 나타나요. (1월부터 12월 순서. 마음대로 바꿔도 돼요)
const SEASON_DECOR = ['⛄', '🧣', '🌱', '🌸', '🌿', '☔', '🍉', '🌻', '🌾', '🍂', '🍁', '❄️'];

// '클로드에게 보낼 요약'의 맨 아래에 붙는 부탁 글이에요. 마음에 드는 말로 바꿔도 돼요.
const CLAUDE_REQUEST = '위 기록을 참고해서, 함께 올리는 갤럭시 워치 캡처를 보고 이번 주를 돌아보는 피드백을 부탁해요. 잘했는지 점수를 매기기보다, 눈에 띄는 변화와 다음 주에 해 볼 만한 작은 제안을 알려 주세요.';

/* ---------------------------------------------------------------------
   2. 작은 도구들 (날짜, 글자 처리)
   --------------------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toStr(d); };
// 오늘 날짜 (새벽 DAY_STARTS_AT시 전이면 아직 어제로 쳐요)
const todayStr = () => {
  const d = new Date();
  if (d.getHours() < DAY_STARTS_AT) d.setDate(d.getDate() - 1);
  return toStr(d);
};
const mondayOf = (s) => addDays(s, -((parseDate(s).getDay() + 6) % 7));
const dayLabel = (s) => {
  const d = parseDate(s);
  const y = d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}년 `;
  return `${y}${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
};
const shortDay = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

const fmtNum = (n) => (Math.round(n * 100) / 100).toString();
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
function linksBlock(text, label = '참고 링크') {
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
  return `<div class="label">${esc(label)}</div><p class="pre">${html}</p>`;
}

// 칸에 값이 들어 있는지 (글자·목록·숫자 모두)
const hasValue = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : typeof v === 'string' ? v.trim() !== '' : !!v);
// 카드·창에서 "- 선택" 꼬리는 떼고 보여줘요
const cleanLabel = (l) => String(l).replace(/\s*-\s*선택$/, '').replace(/\s*\(예전 칸\)$/, '');
// 자동완성용: 그 종류의 기록에서 전에 쓴 값을 최근 순으로 (같은 값은 한 번만)
function suggestions(type, key) {
  const seen = new Set();
  const out = [];
  ofType(type).filter((r) => typeof r[key] === 'string' && r[key].trim()).sort(byNewest).forEach((r) => {
    const v = r[key].trim();
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  });
  return out.slice(0, 40);
}
// 한 줄에 "용어 : 뜻"으로 적은 글을 나눠요 (뜻이 없어도 용어로 남겨요)
function parseTerms(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.search(/[:：]/);
    return i < 0 ? { term: line, meaning: '' } : { term: line.slice(0, i).trim(), meaning: line.slice(i + 1).trim() };
  }).filter((t) => t.term);
}

// 다른 곳(기능 확장 프로젝트)에서 만든 기록은 연습량이 글자, 기분이 이모지로 들어 있어요. 이 앱의 값으로 맞춰서 읽어요.
const LEGACY_AMOUNT = { '살짝': 1, '약간': 1, '적당히': 2, '중': 2, '듬뿍': 3, '많이': 3 };
const LEGACY_MOOD = { '😊': 'good', '🙂': 'ok', '😮‍💨': 'tired' };
function normalizeRecord(r) {
  if (typeof r.amount === 'string' && r.amount !== '') r.amount = LEGACY_AMOUNT[r.amount.trim()] || Number(r.amount) || '';
  if (typeof r.mood === 'string' && LEGACY_MOOD[r.mood]) r.mood = LEGACY_MOOD[r.mood];
  return r;
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
   3-2. 녹음 저장소
      녹음 파일은 용량이 커서 기록(records)과 다른 IndexedDB('my-journal-audio')에 파일 그대로 저장해요.
      (기록이 든 'my-journal' 저장소는 건드리지 않아서, 예전 기록과 백업은 그대로 열려요.)
   --------------------------------------------------------------------- */
const AudioStore = {
  db: null,
  ok() { return !!this.db; },
  async init() {
    if (Store.mode !== 'indexeddb') return;
    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('my-journal-audio', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('audio', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('blocked'));
      });
    } catch (e) { this.db = null; }
  },
  _tx(mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('audio', mode);
      const out = fn(tx.objectStore('audio'));
      tx.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  },
  all() { return this.ok() ? this._tx('readonly', (s) => s.getAll()) : Promise.resolve([]); },
  get(id) { return this._tx('readonly', (s) => s.get(id)); },
  put(rec) { return this._tx('readwrite', (s) => { s.put(rec); }); },
  remove(ids) { return this._tx('readwrite', (s) => { ids.forEach((id) => s.delete(id)); }); },
  clear() { return this.ok() ? this._tx('readwrite', (s) => { s.clear(); }) : Promise.resolve(); },
};

/* ---------------------------------------------------------------------
   4. 앱 상태
   --------------------------------------------------------------------- */
let records = [];   // 전체 기록 (메모리에 복사해 두고 화면에 사용)
let audios = [];    // 녹음 정보 (파일 자체는 빼고 이름·날짜·메모만. 파일은 재생할 때 꺼내 와요)
let seeded = false; // 예시 기록을 이미 한 번 넣었는지
// 마지막 백업 날짜, 알림 미루기, 축하 한 줄 끄기, 녹음을 백업에서 빼기, 계절 장식 끄기
let settings = { lastBackupAt: null, snoozeUntil: null, celebrateOff: false, audioSkip: false, seasonOff: false };
// 자동 저장: 내 컴퓨터의 파일 하나에 기록이 바뀔 때마다 저장해요 (크롬·엣지 컴퓨터 버전)
//   status: 'off' 꺼짐 / 'on' 켜짐 / 'paused' 브라우저를 다시 열어 한 번 연결이 필요함
const autosave = { handle: null, name: '', status: 'off', lastSavedAt: null };
let autosaveTimer = null;

const ui = {
  tab: 'today',       // 처음 열면 '오늘' 탭
  todayKey: null,     // 오늘 탭에서 눌러 둔 큰 버튼 (연습량을 고르는 중)
  weekOffset: 0,      // 0 = 이번 주, -1 = 지난 주 ...
  bodyFilter: 'all',  // all | workout | violin
  bodyAllRange: true, // true = 전체 기간, false = 선택한 주만
  econTab: 'study',   // study | invest
  query: '',
  artView: 'book',    // book | compare | course
  artOrder: 'newest', // newest | oldest
  artKind: 'all',     // all | 모작 | 창작 | 연습
  artArea: 'all',     // all | 연습 영역 칩 이름
  cmpA: null,
  cmpB: null,
  calMonth: null,       // 캘린더에서 보고 있는 달 (예: '2026-09')
  calHidden: new Set(), // 캘린더에서 잠시 숨긴 종류
  dayOpen: null,        // 캘린더에서 열어 둔 날짜
  backToDay: null,      // 입력 창을 닫고 돌아갈 날짜
};
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
    // 🧘 운동
    mk('workout', d(1), { stamp: '🍃', kind: '요가', amount: 2, mood: 'good', did: ['스트레칭', '호흡·명상'], relief: ['목·어깨'], bodyNote: '오른쪽 어깨가 더 뻣뻣했다', course: '아침 요가 20분 (예시)', refs: 'https://www.youtube.com', condition: '좋음', memo: '아침에 스트레칭 위주로 했다. 어깨가 한결 가벼워졌다. (예시 기록)' }),
    mk('workout', d(2), { stamp: '🏃', kind: '슬로조깅', amount: 1, mood: 'ok', distance: 3.1, weather: '맑음', place: '중랑천', pace: '여유', runThought: '바람이 시원해서 발이 가벼웠다', condition: '보통', memo: '대화할 수 있는 속도로 천천히. (예시 기록)' }),
    mk('workout', d(4), { stamp: '🌿', kind: '요가', amount: 1, mood: 'tired', did: ['스트레칭'], condition: '피곤함', memo: '피곤해서 가볍게만 했다. (예시 기록)' }),
    mk('workout', d(8), { kind: '슬로조깅', distance: 3.6, weather: '흐림', place: '중랑천', pace: '적당', condition: '좋음', memo: '' }),
    mk('workout', d(9), { kind: '요가', did: ['코어', '밸런스'], relief: ['허리'], course: '아침 요가 20분 (예시)', condition: '보통', memo: '' }),
    mk('workout', d(3), { kind: '요가', amount: 1, memo: '퇴근 후 짧게 (간단 기록 예시)', quick: true }),
    mk('rest', d(7), { stamp: '😴', memo: '야근한 날. 푹 잤다. (예시 기록)' }),
    // 🎻 바이올린
    mk('violin', d(1), { stamp: '🎶', kind: '연습', amount: 3, mood: 'good', tempo: 60, piece: '바흐 미뉴에트 G장조', did: ['스케일', '곡'], focus: ['음정', '보잉'], good: '3포지션 이동이 덜 흔들렸다', part: '1~8마디 운지', stage: '천천히 치는 중', ask: [{ text: '3포지션에서 손목은 어떻게 두는지', done: false }, { text: '활을 줄에서 떼는 타이밍', done: false }], hard: '3포지션으로 옮길 때 음정이 흔들렸다.', next: '메트로놈 60에 맞춰 9~16마디 연습하기 (예시 기록)' }),
    mk('violin', d(3), { stamp: '🎼', kind: '연습', amount: 2, tempo: 52, piece: '바흐 미뉴에트 G장조', did: ['개방현·활'], focus: ['보잉'], good: '활이 줄에 수직으로 유지되는 순간이 늘었다', part: '활 쓰는 법(다운-업)', stage: '악보 익히는 중', hard: '활이 줄 위에서 미끄러졌다.', next: '활을 줄에 수직으로 유지하기' }),
    mk('violin', d(9), { kind: '연습', tempo: 76, piece: '스즈키 1권 - 반짝반짝 변주곡', did: ['곡'], focus: ['박자'], stage: '원래 템포 가까이', part: '변주 A, B', hard: '리듬이 자꾸 빨라진다.', next: '천천히 박자 세며 치기' }),
    mk('violin', d(6), { kind: '연습', amount: 2, mood: 'ok', tempo: 48, piece: '바흐 미뉴에트 G장조', did: ['에튀드', '곡'], focus: ['운지'], part: '9~16마디', stage: '천천히 치는 중', hard: '느린 템포에서도 손가락이 꼬였다.', next: '천천히 정확하게' }),
    mk('violin', d(5), { stamp: '🎓', kind: '레슨', mood: 'good', feedback: '활을 줄에 수직으로 두는 연습을 더 하면 좋겠어요. 음정은 지난주보다 안정적이에요. (예시 기록)', praise: '음정이 지난주보다 안정적이라고 하셨다', newLearn: '자리를 옮길 때 팔꿈치를 먼저 움직인다', homework: [{ text: '스케일 G장조 두 옥타브, 매일', done: true }, { text: '미뉴에트 1~16마디 메트로놈 60', done: false }, { text: '빈 줄 연습', done: false }] }),
    mk('violin', monthsAgo(t, 1), { kind: '연습', amount: 2, mood: 'good', piece: '스즈키 1권 - 반짝반짝 변주곡', did: ['곡'], part: '처음으로 변주 A를 끝까지 이어서 켜 봤다. (한 달 전 예시 기록)' }),
    mk('piecenote', d(1), { piece: '바흐 미뉴에트 G장조', memo: '5마디부터 멜로디가 올라가는 부분이 제일 좋다 (예시)' }),
    // 📚 레퍼토리 책장 예시: 미뉴에트는 책상 위(연습 중), 반짝반짝 변주곡은 책장(마무리)
    mk('piecenote', d(2), { piece: '스즈키 1권 - 반짝반짝 변주곡', memo: '', status: 'done', doneAt: d(2) }),
    // 📚 경제 공부
    mk('study', d(2), { stamp: '💡', method: '뉴스·기사', areas: ['금리·물가'], amount: 2, mood: 'ok', topic: '금리와 물가의 관계', summary: '물가가 오르면 중앙은행이 금리를 올려 소비를 조금 식힌다', terms: '기준금리 : 한국은행이 정하는 금리의 기준\n인플레이션 : 물가가 지속적으로 오르는 현상', connect: '내 예금 금리도 곧 바뀔 수 있겠다', unclear: [{ text: '금리가 오르면 환율은 왜 움직일까?', done: false }, { text: '물가상승률과 기준금리는 같은 뜻일까?', done: true }], learned: '물가가 오르면 중앙은행이 금리를 올려 소비를 조금 식히려고 한다는 흐름을 알게 되었다. 예금·대출 금리에도 영향을 준다. (예시 기록)', links: 'https://www.bok.or.kr' }),
    mk('study', d(10), { method: '개념 정리', areas: ['주식·ETF'], topic: '분산 투자란?', summary: '나눠 담으면 한 곳이 흔들려도 전체 충격이 줄어든다', terms: '분산 투자 : 한곳에 몰아두지 않고 나누어 두는 방법\nETF : 여러 종목을 묶어 주식처럼 사고파는 펀드', unclear: [{ text: 'ETF와 펀드는 뭐가 다른지', done: false }], learned: '한곳에 몰아두지 않고 나누어 두면 한 자산이 흔들려도 전체 충격이 줄어든다는 개념.', links: '' }),
    mk('study', d(15), { method: '책', areas: ['경제 일반'], topic: '기회비용', summary: '무언가를 고르면 포기한 것의 가치가 비용이 된다', terms: '기회비용 : 무언가를 선택하느라 포기한 것 중 가장 큰 가치', connect: '퇴근 후 쉬는 시간도 기회비용이 있다' }),
    // 📊 투자 (기록과 복기만)
    mk('invest', d(3), { action: '관심만', reasons: ['뉴스·이슈', '그냥 친숙해서'], feeling: '😌 차분', asset: '국내 대형주 ETF (예시)', grounds: ['뉴스에서 자주 언급된다', '여러 종목에 나눠 담는 상품이다', '수수료는 더 확인해 볼 만하다'], wrongIf: '금리가 계속 오르면 주가가 눌릴 수 있다', check: '구성 종목과 운용 보수는 어떻게 되는지.', reviewIn: '1개월 뒤', reviewOn: monthsAgo(d(3), -1), thought: '뉴스에서 자주 언급되어 관심이 생김. 어떤 기업들이 들어 있는지 궁금했다. (예시 기록)', review: '' }),
    mk('invest', d(20), { action: '샀음', reasons: ['그냥 친숙해서'], feeling: '🤩 들뜸', asset: '예시 관심 종목 B', grounds: ['평소 자주 쓰는 서비스다'], wrongIf: '친숙함 말고 다른 근거가 약하다', check: '실적 발표 후 내 생각이 바뀌는지 보기.', reviewIn: '1개월 뒤', reviewOn: monthsAgo(d(20), -1), thought: '평소 자주 쓰는 서비스라 친숙해서 관심을 가졌다.', review: '친숙함만으로 판단했다는 걸 알게 됐다. 다음엔 근거를 두세 가지 적어 두기.', rvGrounds: '반반', rvMood: '예', rvAgain: '근거를 두세 가지 적어 보고 결정할래요', lesson: '친숙하다는 이유만으로 고르지 않는다', reviewedOn: d(2) }),
    mk('invest', d(45), { action: '관심만', reasons: ['가격이 내려서', '주변 추천'], feeling: '😟 불안', asset: '예시 관심 종목 C', grounds: ['가격이 많이 내려 보였다', '아는 사람이 추천했다'], wrongIf: '내려간 데는 이유가 있을 수 있다', reviewIn: '1개월 뒤', reviewOn: monthsAgo(d(45), -1) }),
    // 🎨 그림
    mk('art', d(21), { image: SAMPLE_IMAGES.outline, kind: '연습', areas: ['선·형태'], course: '명암 기초 강의 (예시)', topic: '기본 도형 그리기', tools: '연필 HB', tried: '원과 사각형을 한 번에 그려 보기.', hard: '원이 찌그러진다.', next: '명암 넣어 입체감 내기 (예시 기록)' }),
    mk('art', d(8), { stamp: '🎨', image: SAMPLE_IMAGES.shaded, kind: '모작', areas: ['명암'], amount: 2, course: '명암 기초 강의 (예시)', refs: '유튜브 - 명암 기초 강의 따라 하기 (예시)\nhttps://www.youtube.com', origin: '예시 작가', liked: '그림자 경계가 부드럽게 나왔다', topic: '명암 연습', tools: '연필 HB, 2B', tried: '빛이 오는 방향을 정하고 그림자를 그려 보기.', hard: '밝은 곳과 어두운 곳의 경계 처리.', next: '색연필로 색 입히기' }),
    mk('art', d(1), { stamp: '🖌️', image: SAMPLE_IMAGES.color, kind: '창작', areas: ['채색'], amount: 3, mood: 'good', course: '색연필 채색 입문 (예시)', liked: '따뜻한 색이 자연스럽게 섞였다', topic: '색 넣기 연습', tools: '색연필 12색', tried: '따뜻한 색 두 가지를 겹쳐 그러데이션 만들기.', hard: '색을 겹칠수록 종이가 매끈해져서 더 칠하기 어렵다.', next: '차가운 색과 따뜻한 색 함께 써 보기' }),
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
  if (ui.tab === 'today') renderToday();
  else if (ui.tab === 'body') renderBody();
  else if (ui.tab === 'econ') renderEcon();
  else if (ui.tab === 'cal') renderCalendar();
  else renderArt();
  applySeason();
  syncPlayButtons();
}

const quickTag = (r) => (r.quick ? '<span class="tag quick">간단 기록</span>' : '');

// 연습량 ●●○ 와 기분 😊 (카드 머리줄에 작게 붙어요. 안 적었으면 아무것도 안 보여요)
const amountOf = (r) => AMOUNTS.find((a) => a.v === Number(r.amount));
const moodOf = (r) => MOODS.find((m) => m.v === r.mood);
function marksHTML(r) {
  const a = amountOf(r);
  const m = moodOf(r);
  return `${a ? `<span class="amt" role="img" aria-label="연습량 ${a.label}" title="연습량 ${a.label}">${a.icon} ${a.label}</span>` : ''}${m ? `<span class="mood" role="img" aria-label="기분 ${m.label}" title="하고 나서 기분: ${m.label}">${m.icon}</span>` : ''}`;
}

// 칩 선택지 하나를 {v, icon, label}로 맞춰요 (글자만 있는 것도 돼요)
const normChoice = (c) => (c !== null && typeof c === 'object' ? c : { v: c, label: String(c) });

// 칩(버튼) 칸: 하나만 고르는 것(연습량·기분 등)과 여러 개 고르는 것(multi). 고른 값은 숨은 칸(name)에 들어가요.
// 하나짜리는 다시 누르면 풀려요. (여러 개짜리는 JSON 목록으로 들어가요)
function choiceHTML(name, choices, value, multi = false) {
  const list = choices.map(normChoice);
  const sel = multi ? (Array.isArray(value) ? value.map(String) : []) : [value === undefined || value === null ? '' : String(value)];
  const known = new Set(list.map((c) => String(c.v)));
  // 선택지에서 빠진 예전 값도, 이미 골랐던 것이면 버튼으로 남겨 둬요 (수정해서 저장해도 사라지지 않게)
  const all = [...list, ...sel.filter((v) => v !== '' && !known.has(v)).map((v) => ({ v, label: v }))];
  return `<div class="choice" role="group" data-multi="${multi ? 1 : 0}">
    <input type="hidden" id="f_${name}" name="${name}" value="${esc(multi ? JSON.stringify(sel) : sel[0])}">
    ${all.map((c) => {
      const on = sel.includes(String(c.v));
      return `<button type="button" class="choice-btn${on ? ' on' : ''}" data-act="pick" data-val="${esc(c.v)}" aria-pressed="${on}">${c.icon ? `<span class="ci">${c.icon}</span> ` : ''}${esc(c.label)}</button>`;
    }).join('')}
  </div>`;
}
// 칩 칸에서 고른 값 읽기 (연습량처럼 숫자 선택지면 숫자로)
function readChoice(form, f) {
  const raw = form.elements[f.key].value;
  if (f.type === 'chips') { try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  if (raw === '') return '';
  return typeof normChoice(f.choices[0]).v === 'number' ? Number(raw) : raw;
}
// 이 종류의 기록에 '연습량' 칸이 있는지 (바이올린은 연습에만, 투자·쉼에는 없어요)
const supportsAmount = (type, kind) => SCHEMAS[type].fields.some((f) => f.key === 'amount' && (!f.only || f.only === kind));

function actionButtons(type, id) {
  return `<div class="actions">
    <button type="button" class="btn ghost small" data-act="edit" data-type="${type}" data-id="${esc(id)}">수정</button>
    <button type="button" class="btn danger small" data-act="del" data-type="${type}" data-id="${esc(id)}">삭제</button>
  </div>`;
}

/* ---------------------------------------------------------------------
   7-2. 메뉴 0: ✏️ 오늘 (큰 버튼으로 가볍게 남기기)
   --------------------------------------------------------------------- */
// n달 전 같은 날짜 (그 달에 그 날짜가 없으면 그 달의 마지막 날)
function monthsAgo(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(y, m - 1 - n, 1);
  t.setDate(Math.min(d, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return toStr(t);
}

// 그때의 나: 한 달 전 → 석 달 전 → 1년 전 중 기록이 있는 첫 날에서 하나 (그림이 있으면 그림 먼저)
function memoryPick(today) {
  const pool = records.filter((r) => r.type !== 'rest' && r.date && catOf(r));
  for (const look of MEMORY_LOOKBACKS) {
    const date = monthsAgo(today, look.months);
    const list = pool.filter((r) => r.date === date).sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));
    if (list.length) return { label: look.label, date, rec: list[0] };
  }
  return null;
}

function memoryText(r) {
  const raw = { workout: r.memo, violin: r.kind === '레슨' ? r.feedback : (r.part || r.hard), study: r.learned, invest: r.thought, art: r.tried || r.hard }[r.type] || '';
  const t = String(raw).replace(/\s+/g, ' ').trim();
  return t.length > 120 ? `${t.slice(0, 120)}…` : t;
}

function memoryHTML(today) {
  const m = memoryPick(today);
  if (!m) return '';
  const { rec } = m;
  const c = catOf(rec);
  const text = memoryText(rec);
  return `<section class="card memory">
    <h3>🕰 그때의 나 <span class="meta">· ${esc(m.label)}</span></h3>
    <button type="button" class="memory-body" data-act="calDay" data-date="${m.date}" title="그날 기록 보기">
      ${rec.image ? `<img class="memory-img" src="${esc(rec.image)}" alt="${esc(rec.topic || '그림')}">` : ''}
      <span class="memory-text">
        <span class="meta">${esc(dayLabel(m.date))}</span>
        <span><b>${iconOf(rec)} ${esc(calTitle(rec))}</b> ${marksHTML(rec)}</span>
        ${text ? `<span class="memory-line">${esc(text)}</span>` : ''}
      </span>
    </button>
  </section>`;
}

// 오늘 남긴 기록을 작은 칩으로 (누르면 수정 창)
const recChipHTML = (r) => `<button type="button" class="rec-chip" data-act="edit" data-type="${r.type}" data-id="${esc(r.id)}" title="누르면 수정"><span>${iconOf(r)}</span><span>${esc(calTitle(r))}</span>${marksHTML(r)}</button>`;

// 큰 버튼을 눌렀을 때 아래에 열리는 창: 연습량 → 기분 → 한 줄 메모 (모두 선택)
function todayPanelHTML(b, date) {
  return `<form id="todayForm" class="card today-panel" data-key="${b.key}" data-date="${date}" novalidate>
    <h3>${b.icon} ${esc(b.label)} <span class="meta">· 간단 기록으로 남겨요</span></h3>
    ${b.type === 'violin' && knownPieces().length ? `<div class="field"><label>곡 - 선택 <span class="meta">(최근에 연습한 곡)</span></label>${choiceHTML('piece', knownPieces().slice(0, 4), '')}</div>` : ''}
    ${supportsAmount(b.type, b.data.kind) ? `<div class="field"><label>연습량 - 선택</label>${choiceHTML('amount', AMOUNTS, '')}</div>` : ''}
    <div class="field"><label>하고 나서 기분 - 선택</label>${choiceHTML('mood', MOODS, '')}</div>
    <div class="field"><label for="todayMemo">한 줄 메모 - 선택</label><input id="todayMemo" name="memo" type="text" maxlength="200" autocomplete="off" placeholder="${esc(b.hint || '')}"></div>
    <div class="row">
      <button type="submit" class="btn">저장</button>
      <button type="button" class="btn ghost" data-act="todayCancel">취소</button>
      <span class="meta">위의 ${esc(b.label)} 버튼을 한 번 더 눌러도 저장돼요.</span>
    </div>
  </form>`;
}

function renderToday() {
  const today = todayStr();
  view.dataset.today = today; // 밤새 창을 열어 두었다가 날짜가 바뀌면 다시 그리려고 기억해 둬요
  const pick = TODAY_BUTTONS.find((b) => b.key === ui.todayKey);
  const mine = records.filter((r) => r.date === today && catOf(r)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const btn = (b) => `<button type="button" class="today-btn${pick && pick.key === b.key ? ' on' : ''}" data-act="todayPick" data-key="${b.key}" aria-pressed="${!!(pick && pick.key === b.key)}"><span class="ti">${b.icon}</span><span>${esc(b.label)}</span></button>`;
  view.innerHTML = `
    <h2 class="page-title">✏️ 오늘</h2>
    <p class="page-sub">${esc(dayLabel(today))} · 버튼을 눌러 가볍게 남겨요. 잘했는지 못했는지 점수는 매기지 않아요.${new Date().getHours() < DAY_STARTS_AT ? `<br>🌙 새벽 ${DAY_STARTS_AT}시 전이라 ${esc(shortDay(today))} 기록으로 남겨요.` : ''}</p>
    <div class="today-grid">${TODAY_BUTTONS.map(btn).join('')}</div>
    ${pick ? todayPanelHTML(pick, today) : ''}
    <div class="row" style="margin:14px 0 4px">
      ${restButtonHTML(today)}
      <span class="meta">쉬는 날도 기록이에요.</span>
    </div>
    <div class="label" style="margin:18px 0 6px">오늘 남긴 기록${mine.length ? ' · 누르면 고칠 수 있어요' : ''}</div>
    ${mine.length ? `<div class="rec-chips">${mine.map(recChipHTML).join('')}</div>` : '<p class="meta" style="margin:0">여기에 오늘 남긴 기록이 모여요. 누르면 고칠 수 있어요.</p>'}
    ${memoryHTML(today)}`;
  if (pick) { const memo = $('#todayMemo'); if (memo) memo.focus(); }
}

// 오늘 탭의 '저장': 오늘 날짜로 '간단 기록'을 만들어요
async function saveToday(form) {
  const b = TODAY_BUTTONS.find((x) => x.key === form.dataset.key);
  if (!b) return;
  const rec = { id: newId(), type: b.type, createdAt: Date.now(), updatedAt: Date.now(), quick: true, date: form.dataset.date || todayStr(), ...b.data };
  const memo = form.elements.memo.value.trim();
  if (memo) rec[b.memoKey] = memo;
  const amount = form.elements.amount ? Number(form.elements.amount.value) : 0;
  if (amount) rec.amount = amount;
  if (form.elements.mood.value) rec.mood = form.elements.mood.value;
  if (form.elements.piece && form.elements.piece.value) rec.piece = form.elements.piece.value;
  assignStamp(rec);
  if (!(await saveRecord(rec))) return;
  ui.todayKey = null;
  render();
  afterNewRecord(rec, { action: { label: '✍ 자세히 적기', act: 'toastEdit', id: rec.id } });
}

// 쉰 날 기록 (하루에 하나만)
async function saveRest(date) {
  if (records.some((r) => r.type === 'rest' && r.date === date)) { toast('이 날은 이미 쉼으로 남겨 두었어요.'); return null; }
  const rec = { id: newId(), type: 'rest', date, createdAt: Date.now(), updatedAt: Date.now() };
  assignStamp(rec);
  return (await saveRecord(rec)) ? rec : null;
}

// 😴 쉰 날: 누르면 남기고, 다시 누르면 지워요
async function toggleRest(date, withUndo) {
  const old = records.find((r) => r.type === 'rest' && r.date === date);
  if (old) {
    if (hasValue(old.memo) && !confirm('쉰 날 표시와 적어 둔 메모를 지울까요?')) return;
    await deleteRecord(old.id);
    render(); refreshDay();
    toast('쉰 날 표시를 지웠어요.', 2500);
    return;
  }
  const rec = await saveRest(date);
  if (!rec) return;
  render(); refreshDay();
  afterNewRecord(rec, withUndo ? { action: { label: '되돌리기', act: 'undoRest', id: rec.id } } : {});
}

function restButtonHTML(date) {
  const on = records.some((r) => r.type === 'rest' && r.date === date);
  const word = date === todayStr() ? '오늘은' : '이 날은';
  return `<button type="button" class="btn ghost purple${dlg.open ? ' small' : ''}" data-act="rest" data-date="${date}" aria-pressed="${on}"${on ? ' title="다시 누르면 쉰 날 표시를 지워요"' : ''}>😴 ${on ? '쉰 날로 남겼어요 ✓' : `${word} 쉼`}</button>`;
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

// 카드에 보여 줄 칸들: 스키마 순서대로, 값이 있는 칸만. 칩은 작은 표시로 먼저, 글은 제목+내용으로 그 아래에.
// (skip: 카드 머리줄 등에서 이미 보여준 칸)
function guideHTML(type, r, skip = []) {
  const tags = [];
  const blocks = [];
  SCHEMAS[type].fields.forEach((f) => {
    const value = r[f.key];
    if (['date', 'image', 'images', 'audio', 'number', 'select'].includes(f.type) || ['amount', 'mood'].includes(f.key) || skip.includes(f.key) || !hasValue(value)) return;
    const label = cleanLabel(f.label);
    if (f.type === 'choice' || f.type === 'chips') {
      const list = Array.isArray(value) ? value : [value];
      tags.push(`<div class="chip-line"><span class="chip-label">${esc(label)}</span>${list.map((v) => `<span class="tag chip-tag">${esc(v)}</span>`).join('')}</div>`);
    } else if (f.type === 'lines') {
      blocks.push(`<div class="label">${esc(label)}</div><ol class="lines">${value.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);
    } else if (f.type === 'tasks') {
      blocks.push(`<div class="label">${esc(label)}</div>${tasksList(r, f.key)}`);
    } else if (f.links) {
      blocks.push(linksBlock(value, label));
    } else {
      blocks.push(textBlock(label, value));
    }
  });
  return `${tags.join('')}${blocks.join('')}`;
}

// 워치 캡처 작은 그림들 (누르면 크게 보여요)
function shotsHTML(r) {
  const list = Array.isArray(r.shots) ? r.shots : [];
  if (!list.length) return '';
  return `<div class="shot-row">${list.map((src, i) => `<img class="shot-img" src="${esc(src)}" alt="워치 캡처 ${i + 1}" data-act="zoomShot" data-id="${esc(r.id)}" data-i="${i}">`).join('')}</div>`;
}

function workoutCard(r) {
  const parts = [];
  if (r.distance) parts.push(`${esc(fmtNum(r.distance))}km`);
  if (r.condition) parts.push(`컨디션 ${esc(r.condition)}`);
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><span class="tag">${esc(r.kind || '운동')}</span> ${parts.join(' · ')} ${marksHTML(r)} ${quickTag(r)}</div>
      ${actionButtons('workout', r.id)}
    </div>
    ${r.memo ? `<p class="pre">${esc(r.memo)}</p>` : ''}
    ${guideHTML('workout', r, ['kind', 'memo', 'distance', 'condition', 'claude'])}
    ${shotsHTML(r)}
    ${r.claude ? `<details class="claude-fb"><summary>💬 클로드 피드백</summary><p class="pre">${esc(r.claude)}</p></details>` : ''}
  </div>`;
}

// 쉰 날 카드 (쉬는 날도 기록이에요)
function restCard(r) {
  return `<div class="card">
    <div class="item-head">
      <div><span class="tag rest">😴 쉰 날</span> ${r.memo ? esc(r.memo) : '<span class="meta">쉬는 것도 기록이에요.</span>'}</div>
      ${actionButtons('rest', r.id)}
    </div>
  </div>`;
}

// 체크 목록 (레슨 과제 · 레슨 때 물어볼 것 · 헷갈리는 것). 여기서 체크하면 바로 저장돼요.
function tasksList(r, key) {
  const list = Array.isArray(r[key]) ? r[key] : [];
  if (!list.length) return '';
  return `<ul class="hw">${list.map((t, i) => `<li><label>
    <input type="checkbox" data-act="task" data-key="${key}" data-id="${esc(r.id)}" data-i="${i}" ${t.done ? 'checked' : ''}>
    <span class="${t.done ? 'done' : ''}">${esc(t.text)}</span></label></li>`).join('')}</ul>`;
}

async function toggleTask(id, key, i, done) {
  const r = records.find((x) => x.id === id);
  if (r && Array.isArray(r[key]) && r[key][i]) {
    const list = r[key].map((t, j) => (j === i ? { ...t, done } : t));
    await saveRecord({ ...r, [key]: list, updatedAt: Date.now() });
  }
  render();
  refreshDay();
}

// 아직 안 물어본 "레슨 때 물어볼 것" (바이올린 연습 기록들에서 모아요)
function collectAsks() {
  const out = [];
  ofType('violin').filter((r) => r.kind !== '레슨' && Array.isArray(r.ask)).sort(byNewest)
    .forEach((r) => r.ask.forEach((t, i) => { if (!t.done) out.push({ r, i, text: t.text }); }));
  return out;
}

function asksListHTML(items) {
  return `<ul class="hw">${items.map(({ r, i, text }) => `<li><label>
    <input type="checkbox" data-act="task" data-key="ask" data-id="${esc(r.id)}" data-i="${i}">
    <span>${esc(text)}</span> <span class="meta">${r.piece ? `${esc(r.piece)} · ` : ''}${esc(shortDay(r.date))}</span></label></li>`).join('')}</ul>`;
}

// 바이올린 탭 맨 위: 가장 최근 레슨의 과제, 그리고 다음 레슨 때 물어볼 것
function lessonPanel() {
  const l = ofType('violin').filter((r) => r.kind === '레슨').sort(byNewest)[0];
  const hw = l && Array.isArray(l.homework) ? l.homework : [];
  const asks = collectAsks();
  if (!hw.length && !asks.length) return '';
  return `<section class="card lesson-panel">
    ${hw.length ? `<div class="item-head">
      <div><h3>📌 다음 레슨까지 과제</h3><div class="meta">${esc(dayLabel(l.date))} 레슨</div></div>
      <button type="button" class="btn ghost purple small" data-act="edit" data-type="violin" data-id="${esc(l.id)}">수정</button>
    </div>${tasksList(l, 'homework')}` : ''}
    ${asks.length ? `<div class="${hw.length ? 'lp-sep' : ''}">
      <h3>🙋 다음 레슨 때 물어볼 것</h3><div class="meta">물어봤으면 체크해 주세요. 체크한 것은 목록에서 빠져요.</div>
      ${asksListHTML(asks)}</div>` : ''}
  </section>`;
}

const pieceButton = (p) => `<button type="button" class="piece-link" data-act="piece" data-piece="${esc(p)}">${esc(p)}</button>`;

function violinCard(r) {
  if (r.kind === '레슨') {
    return `<div class="card" data-rid="${esc(r.id)}">
      <div class="item-head">
        <div><span class="tag lesson">레슨</span> ${marksHTML(r)} ${quickTag(r)}</div>
        ${actionButtons('violin', r.id)}
      </div>
      ${textBlock('선생님 피드백', r.feedback)}
      ${Array.isArray(r.homework) && r.homework.length ? `<div class="label">다음 레슨까지 과제</div>${tasksList(r, 'homework')}` : ''}
      ${guideHTML('violin', r, ['feedback', 'homework'])}
    </div>`;
  }
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><span class="tag violin">바이올린</span> ${r.piece ? `<b>${pieceButton(r.piece)}</b>` : '<span class="meta">(곡 이름 미입력)</span>'}${r.tempo ? ` · 템포 ${esc(r.tempo)} BPM` : ''} ${marksHTML(r)} ${recMarksHTML(r)} ${quickTag(r)}</div>
      ${actionButtons('violin', r.id)}
    </div>
    ${guideHTML('violin', r, ['kind', 'piece', 'tempo', 'feedback', 'homework'])}
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

// 곡별 템포 변화 그래프 (외부 도구 없이 SVG로 그려요)
function tempoChartSVG(pts) {
  const W = 600, H = 280, L = 48, R = 36, T = 28, B = 44;
  const vals = pts.map((p) => p.tempo);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (lo === hi) { lo -= 10; hi += 10; } else { const g = Math.max(5, Math.round((hi - lo) * 0.15)); lo -= g; hi += g; }
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((n) => n >= (hi - lo) / 4) || 100; // 눈금은 5·10 단위처럼 딱 떨어지게
  lo = Math.max(0, Math.floor(lo / step) * step);
  hi = Math.ceil(hi / step) * step;
  const t0 = parseDate(pts[0].date).getTime();
  const t1 = parseDate(pts[pts.length - 1].date).getTime();
  const x = (d) => (t1 === t0 ? (L + W - R) / 2 : L + ((parseDate(d).getTime() - t0) / (t1 - t0)) * (W - L - R));
  const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  let grid = '';
  for (let v = lo; v <= hi; v += step) {
    grid += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
  }
  let xlabels = '';
  let lastX = -999;
  pts.forEach((p, i) => {
    const px = x(p.date);
    if (i === 0 || i === pts.length - 1 || px - lastX >= 70) {
      if (i === pts.length - 1 && px - lastX < 70 && i !== 0) return; // 겹치면 마지막 날짜는 표 쪽에서 봐요
      xlabels += `<text class="axis-label" x="${px}" y="${H - 16}" text-anchor="middle">${esc(shortDay(p.date))}</text>`;
      lastX = px;
    }
  });
  const line = pts.length > 1 ? `<polyline class="line" points="${pts.map((p) => `${x(p.date)},${y(p.tempo)}`).join(' ')}"/>` : '';
  const dots = pts.map((p) => `<circle class="dot" cx="${x(p.date)}" cy="${y(p.tempo)}" r="5"/><text class="val" x="${x(p.date)}" y="${y(p.tempo) - 12}" text-anchor="middle">${p.tempo}</text>`).join('');
  const alt = pts.map((p) => `${shortDay(p.date)} ${p.tempo}BPM`).join(', ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="템포 변화: ${esc(alt)}">${grid}${line}${dots}${xlabels}</svg>`;
}

// 🎵 곡 노트: 곡 이름(보라색 밑줄)을 누르면 열려요. 곡 메모, 처음 연습한 날, 연습량, 지금 단계, 잘 된 것, 템포 변화를 한곳에 모아요.
const pieceNoteOf = (piece) => records.find((r) => r.type === 'piecenote' && r.piece === piece);

function openPiece(piece) {
  const prac = ofType('violin').filter((r) => r.kind !== '레슨' && (r.piece || '').trim() === piece).sort(byOldest);
  const note = pieceNoteOf(piece);
  const days = new Set(prac.map((r) => r.date)).size;
  const goods = prac.filter((r) => hasValue(r.good)).sort(byNewest);
  const lastNext = prac.filter((r) => hasValue(r.next)).sort(byNewest)[0];
  const lastStage = prac.filter((r) => hasValue(r.stage)).sort(byNewest)[0];
  const hards = prac.filter((r) => hasValue(r.hard)).sort(byNewest);
  const byDay = new Map(); // 같은 날 여러 번 연습했으면 마지막 기록을 써요
  prac.filter((r) => Number(r.tempo) > 0).forEach((r) => byDay.set(r.date, { date: r.date, tempo: Number(r.tempo) }));
  const pts = [...byDay.values()];
  const withAmount = prac.filter(amountOf);
  const tempo = !pts.length
    ? '<p class="meta">템포(BPM)가 적힌 연습 기록이 없어요. 연습 기록의 "✍ 더 적기"에 템포를 적으면 여기에 그래프가 그려져요.</p>'
    : `${tempoChartSVG(pts)}
      ${pts.length === 1 ? '<p class="meta">템포가 적힌 기록이 하나뿐이에요. 두 번 이상 적으면 선으로 이어져요.</p>' : ''}
      <table class="tempo-table"><thead><tr><th>날짜</th><th>템포 (BPM)</th></tr></thead>
      <tbody>${pts.map((p) => `<tr><td>${esc(dayLabel(p.date))}</td><td>${p.tempo}</td></tr>`).join('')}</tbody></table>`;
  const done = !!note && note.status === 'done';
  openDlg(`<div class="row between piece-head"><h2>🎼 ${esc(piece)}</h2>
      <button type="button" class="btn ghost purple small" data-act="pieceDone" data-piece="${esc(piece)}" aria-pressed="${done}"${done ? ' title="다시 누르면 연습 중으로 되돌려요"' : ''}>${done ? '📕 마무리한 곡 ✓' : '📕 이 곡 마무리'}</button></div>
    <form id="pieceMemoForm" class="field piece-memo" data-piece="${esc(piece)}" novalidate>
      <label for="pieceMemo">곡 메모 - 선택</label>
      <div class="row">
        <input id="pieceMemo" name="memo" type="text" maxlength="200" value="${esc(note ? note.memo : '')}" placeholder="예: 좋아하는 부분, 이 곡을 고른 이유">
        <button type="submit" class="btn purple small">저장</button>
      </div>
    </form>
    ${prac.length ? `<div class="stats">
      <div class="stat"><b>${esc(dayLabel(prac[0].date))}</b><span>처음 연습한 날</span></div>
      <div class="stat"><b>${days}일</b><span>연습한 날</span></div>
      ${lastStage ? `<div class="stat"><b>${esc(lastStage.stage)}</b><span>지금 단계 · ${esc(shortDay(lastStage.date))} 기준</span></div>` : ''}
    </div>` : '<div class="empty">아직 이 곡의 연습 기록이 없어요.</div>'}
    <section class="audio-sec" id="pieceAudio" data-piece="${esc(piece)}">${pieceAudioInner(piece)}</section>
    ${withAmount.length ? `<div class="label">연습량</div><p class="pre piece-amounts">${AMOUNTS.map((a) => `<span class="amt">${a.icon}</span> ${esc(a.label)} ${withAmount.filter((r) => amountOf(r).v === a.v).length}`).join(' · ')}</p>` : ''}
    ${goods.length ? `<div class="label">잘 된 것 모아보기</div>
      <ul class="note-list">${goods.map((r) => `<li><span class="meta">${esc(shortDay(r.date))}</span><span class="pre">${esc(r.good)}</span></li>`).join('')}</ul>` : ''}
    ${lastNext ? `<div class="label">가장 최근 다음에 해볼 것 <span class="meta">(${esc(shortDay(lastNext.date))})</span></div><p class="pre">${esc(lastNext.next)}</p>` : ''}
    <div class="label">템포 변화</div>
    ${tempo}
    ${hards.length ? `<div class="label">어려웠던 점 모아보기 <span class="meta">(예전 칸)</span></div>
      <ul class="note-list">${hards.map((r) => `<li><span class="meta">${esc(shortDay(r.date))}</span><span class="pre">${esc(r.hard)}</span></li>`).join('')}</ul>` : ''}
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
}

async function savePieceMemo(piece, memo) {
  const old = pieceNoteOf(piece);
  if (!memo && !(old && old.status === 'done')) { // 메모도 없고 마무리 표시도 없으면 곡 메모 기록은 필요 없어요
    if (old) await deleteRecord(old.id);
  } else {
    const { sample, ...keep } = old || {}; // 예시를 고치면 내 기록이 돼요
    const ok = await saveRecord({
      ...keep, id: old ? old.id : newId(), type: 'piecenote', piece, memo,
      date: todayStr(), createdAt: old ? old.createdAt : Date.now(), updatedAt: Date.now(),
    });
    if (!ok) return;
  }
  openPiece(piece);
  toast(memo ? '곡 메모를 남겼어요.' : '곡 메모를 비웠어요.', 2500);
}

// 📕 이 곡 마무리: 누르면 마무리한 곡(책장에 꽂혀요), 다시 누르면 연습 중(책상 위)으로 돌아가요. 곡 메모와 같은 기록(piecenote)에 status 로 저장돼요.
async function togglePieceDone(piece) {
  const old = pieceNoteOf(piece);
  const done = !(old && old.status === 'done');
  if (!done && old && !hasValue(old.memo)) { // 되돌렸는데 남길 메모도 없으면 기록 자체를 지워요
    await deleteRecord(old.id);
  } else {
    const { sample, ...keep } = old || {}; // 예시를 고치면 내 기록이 돼요
    const ok = await saveRecord({
      ...keep, id: old ? old.id : newId(), type: 'piecenote', piece, memo: old ? old.memo || '' : '',
      status: done ? 'done' : '', doneAt: done ? todayStr() : '',
      date: old ? old.date : todayStr(), createdAt: old ? old.createdAt : Date.now(), updatedAt: Date.now(),
    });
    if (!ok) return;
  }
  render();
  openPiece(piece);
  toast(done ? '📕 이 곡을 마무리했어요. 책장에 꽂아 뒀어요.' : '다시 연습 중인 곡으로 돌려놨어요.', 2500);
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
  // 연습량은 그림·공부까지 함께 세요 (합계나 점수는 만들지 않고 개수만 보여줘요)
  const moved = records.filter((r) => inWeek(r) && amountOf(r) && supportsAmount(r.type, r.kind));
  return {
    end, ws, vs, prac,
    amountText: moved.length ? AMOUNTS.map((a) => `${a.label} ${moved.filter((r) => amountOf(r).v === a.v).length}`).join(' · ') : '',
    restDays: new Set(ofType('rest').filter(inWeek).map((r) => r.date)).size,
    lessons: vs.length - prac.length,
    violinDays: new Set(prac.map((r) => r.date)).size,
    kindText: wOptions.map((k) => `${k} ${count(ws, 'kind', k)}회`).join(' · '),
    condText: condOptions.map((c) => `${c} ${count(ws, 'condition', c)}`).join(' · '),
    pieces: [...new Set(prac.map((r) => r.piece).filter(Boolean))],
    lastNext: prac.filter((r) => r.next).sort(byNewest)[0],
  };
}

function weekSummaryHTML(start) {
  const { end, ws, vs, lessons, violinDays, kindText, condText, pieces, lastNext, amountText, restDays } = weekStats(start);
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
    ${amountText ? `<p class="meta" style="margin:4px 0 0">연습량 (그림·공부 포함): ${esc(amountText)}</p>` : ''}
    ${restDays ? `<p class="meta" style="margin:4px 0 0">쉰 날 ${restDays}일</p>` : ''}
    ${lessons ? `<p class="meta" style="margin:4px 0 0">레슨 ${lessons}회</p>` : ''}
    ${pieces.length ? `<p class="meta" style="margin:4px 0 0">이 주에 연습한 곡: ${pieces.map(pieceButton).join(', ')}</p>` : ''}
    ${lastNext ? `<p class="meta" style="margin:4px 0 0">가장 최근에 적은 다음 연습 목표: ${esc(lastNext.next)}</p>` : ''}
    ${!ws.length && !vs.length && !restDays ? '<p class="meta" style="margin:10px 0 0">이 주에는 운동·바이올린 기록이 없어요.</p>' : ''}
    ${!ws.length && !vs.length ? '' : `<div class="row" style="margin-top:12px">
      <button type="button" class="btn ghost purple small" data-act="copyWeek">📋 클로드에게 보낼 요약 복사</button>
    </div>`}
  </section>`;
}

// 클로드에게 붙여넣을 한 주의 글 (워치 캡처는 그림이라 글에 들어가지 않아요. 대화창에 따로 올려 주세요)
const oneLine = (s) => String(s || '').trim().replace(/\s*\n\s*/g, ' / ');
// 연습량·기분을 글로 (요약 복사에 써요)
const feelBits = (r) => [amountOf(r) && `연습량 ${amountOf(r).label}`, moodOf(r) && `기분 ${moodOf(r).icon}${moodOf(r).label}`];
const mdLabel = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}/${d.getDate()}(${'일월화수목금토'[d.getDay()]})`; };

function weekTextForClaude(start) {
  const { end, ws, vs, violinDays, lessons, kindText, condText, amountText, restDays } = weekStats(start);
  const L = [
    `📓 주간 기록 요약 (${shortDay(start)} ~ ${shortDay(end)})`,
    '',
    '■ 한눈에',
    `- 운동 ${ws.length}회${ws.length ? ` (${kindText}) · 컨디션: ${condText}` : ''}`,
    `- 바이올린 연습한 날 ${violinDays}일${lessons ? `, 레슨 ${lessons}회` : ''}`,
  ];
  if (amountText) L.push(`- 연습량: ${amountText}`);
  if (restDays) L.push(`- 쉰 날 ${restDays}일`);
  if (ws.length) {
    L.push('', '■ 운동');
    ws.sort(byOldest).forEach((r) => L.push(`- ${[mdLabel(r.date), r.kind || '운동', ...feelBits(r), r.distance && `${fmtNum(r.distance)}km`, hasValue(r.did) && `한 것: ${r.did.join('·')}`, r.weather && `날씨 ${r.weather}`, r.pace && `속도 ${r.pace}`, r.bodyNote && `몸: ${oneLine(r.bodyNote)}`, r.runThought && `생각: ${oneLine(r.runThought)}`, r.condition && `컨디션 ${r.condition}`, r.memo && `메모: ${oneLine(r.memo)}`].filter(Boolean).join(' · ')}`));
  }
  if (vs.length) {
    L.push('', '■ 바이올린');
    vs.sort(byOldest).forEach((r) => {
      if (r.kind === '레슨') {
        const hw = (Array.isArray(r.homework) ? r.homework : []).map((t) => `${t.done ? '[완료]' : '[미완료]'} ${t.text}`).join(' / ');
        L.push(`- ${[mdLabel(r.date), '레슨', ...feelBits(r), r.praise && `좋다고 한 것: ${oneLine(r.praise)}`, r.newLearn && `새로 배운 것: ${oneLine(r.newLearn)}`, r.feedback && `선생님 피드백: ${oneLine(r.feedback)}`, hw && `과제: ${hw}`].filter(Boolean).join(' · ')}`);
      } else {
        L.push(`- ${[mdLabel(r.date), '연습', r.piece && `곡: ${r.piece}`, ...feelBits(r), r.tempo && `템포 ${r.tempo}`, hasValue(r.did) && `한 것: ${r.did.join('·')}`, hasValue(r.focus) && `집중: ${r.focus.join('·')}`, r.stage && `단계: ${r.stage}`, r.good && `잘 된 것: ${oneLine(r.good)}`, r.part && `연습한 부분: ${oneLine(r.part)}`, r.hard && `어려웠던 점: ${oneLine(r.hard)}`, r.next && `다음 목표: ${oneLine(r.next)}`].filter(Boolean).join(' · ')}`);
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

/* ---------------------------------------------------------------------
   📚 레퍼토리 책장: 연습 중인 곡은 "책상 위"에 펼친 악보로, 마무리한 곡은 "책장"에 책등으로 꽂혀요.
   (곡 노트의 📕 이 곡 마무리 버튼으로 옮겨요. 개수나 완료율은 보여주지 않아요.)
   --------------------------------------------------------------------- */
function repertoire() {
  const prac = ofType('violin').filter((r) => r.kind !== '레슨' && pieceKey(r.piece));
  const names = new Set([...prac.map((r) => pieceKey(r.piece)), ...ofType('piecenote').filter((n) => n.status === 'done').map((n) => n.piece)]);
  return [...names].map((name) => {
    const mine = prac.filter((r) => pieceKey(r.piece) === name).sort(byOldest);
    const note = pieceNoteOf(name);
    const stage = mine.filter((r) => hasValue(r.stage)).sort(byNewest)[0];
    return {
      name, note, done: !!note && note.status === 'done', doneAt: note && note.doneAt ? note.doneAt : '',
      firstDate: mine.length ? mine[0].date : '', lastDate: mine.length ? mine[mine.length - 1].date : '',
      stage: stage ? stage.stage : '', hasAudio: audios.some((a) => a.piece === name),
    };
  });
}

const monthLabel = (date) => { const d = parseDate(date); return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; };

function shelfHTML() {
  const all = repertoire();
  const desk = all.filter((p) => !p.done).sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || '') || a.name.localeCompare(b.name, 'ko'));
  const shelf = all.filter((p) => p.done).sort((a, b) => (a.doneAt || '').localeCompare(b.doneAt || '') || a.name.localeCompare(b.name, 'ko'));
  const mic = (p) => (p.hasAudio ? '<span class="book-mic" title="녹음이 있어요" aria-label="녹음 있음">🎙</span>' : '');
  const book = (p) => `<button type="button" class="book" data-act="piece" data-piece="${esc(p.name)}" title="${esc(p.name)} · 곡 노트 열기">
      <span class="book-page left"><b>${esc(p.name)}</b>${p.firstDate ? `<span class="meta">${esc(monthLabel(p.firstDate))}에 처음 연습</span>` : ''}</span>
      <span class="book-page right">${p.stage ? `<span>${esc(p.stage)}</span>` : ''}${p.note && hasValue(p.note.memo) ? `<span class="meta">${esc(p.note.memo)}</span>` : ''}${p.lastDate ? `<span class="meta">마지막 연습 ${esc(shortDay(p.lastDate))}</span>` : ''}${mic(p)}</span>
    </button>`;
  const spine = (p, i) => `<button type="button" class="spine c${i % 3}" data-act="piece" data-piece="${esc(p.name)}" title="${esc(p.name)}${p.firstDate ? ` · ${esc(monthLabel(p.firstDate))}에 처음 연습` : ''}" aria-label="${esc(p.name)} 곡 노트 열기">
      <span class="spine-title">${esc(p.name)}</span>${p.firstDate ? `<span class="spine-month">${esc(p.firstDate.slice(2, 4))}.${esc(p.firstDate.slice(5, 7))}</span>` : ''}${p.hasAudio ? '<span class="spine-mic" aria-hidden="true">🎙</span>' : ''}
    </button>`;
  return `<section class="shelf-sec">
    <h3 class="shelf-h">✏️ 책상 위</h3>
    ${desk.length ? `<div class="desk">${desk.map(book).join('')}</div>` : '<p class="meta shelf-empty">지금 연습 중인 곡이 여기에 펼쳐져요. 바이올린 연습 기록에 곡 이름을 적으면 올라와요.</p>'}
    <h3 class="shelf-h">📚 책장</h3>
    <div class="shelf">${shelf.map(spine).join('')}</div>
    ${shelf.length ? '' : '<p class="meta shelf-empty">마무리한 곡은 곡 노트의 <b>📕 이 곡 마무리</b>를 누르면 여기에 꽂혀요.</p>'}
  </section>`;
}

function renderBody() {
  const start = addDays(mondayOf(todayStr()), ui.weekOffset * 7);
  const end = addDays(start, 6);
  const shelf = ui.bodyFilter === 'shelf';
  let list = shelf ? [] : [...ofType('workout'), ...ofType('violin')];
  if (ui.bodyFilter !== 'all' && !shelf) list = list.filter((r) => r.type === ui.bodyFilter);
  if (!ui.bodyAllRange) list = list.filter((r) => r.date >= start && r.date <= end);
  list.sort(byNewest);

  let listHTML = '';
  if (shelf) {
    listHTML = shelfHTML();
  } else if (!list.length) {
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
      <div class="chips">${chip('all', '전체')}${chip('workout', '운동')}${chip('violin', '바이올린')}<span class="chip-sep" aria-hidden="true"></span><button type="button" class="chip ${shelf ? 'active' : ''}" data-act="shelf" aria-pressed="${shelf}">📚 레퍼토리 책장</button></div>
      ${shelf ? '' : `<label class="meta"><input type="checkbox" data-act="bodyRange" ${ui.bodyAllRange ? '' : 'checked'}> 위에서 고른 주만 보기</label>`}
    </div>
    ${listHTML}`;
}

/* ---------------------------------------------------------------------
   9. 메뉴 2: 경제 공부·투자 기록
   --------------------------------------------------------------------- */
function studyCard(r) {
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><h3>${esc(r.topic || '(주제 미입력)')}</h3>
        <div class="meta">${esc(dayLabel(r.date))} ${r.method ? `<span class="tag">${esc(r.method)}</span>` : ''} ${marksHTML(r)} ${quickTag(r)}</div></div>
      ${actionButtons('study', r.id)}
    </div>
    ${guideHTML('study', r, ['topic', 'method'])}
  </div>`;
}

// 복기를 적었는지 (예전 '나중에 돌아본 결과' 글이나 새 복기 질문 중 하나라도 있으면)
const isReviewed = (r) => hasValue(r.review) || hasValue(r.rvGrounds) || hasValue(r.rvMood) || hasValue(r.rvAgain) || hasValue(r.lesson);

function reviewBoxHTML(r) {
  const rows = [['근거는 맞았나?', r.rvGrounds], ['기분이 판단에 영향을 줬나?', r.rvMood], ['다음에도 똑같이 할까?', r.rvAgain]].filter(([, v]) => hasValue(v));
  return `<div class="review-box">
    <div class="label" style="margin-top:0">복기${r.reviewedOn ? ` <span class="meta">· ${esc(shortDay(r.reviewedOn))}에 적었어요</span>` : ''}</div>
    ${rows.map(([q, a]) => `<div class="rv-row"><span class="meta">${esc(q)}</span> <b>${esc(a)}</b></div>`).join('')}
    ${hasValue(r.lesson) ? `<div class="rv-lesson">💡 ${esc(r.lesson)}</div>` : ''}
    ${hasValue(r.review) ? textBlock('나중에 돌아본 결과', r.review) : ''}
  </div>`;
}

function investCard(r) {
  const reviewed = isReviewed(r);
  const today = todayStr();
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div>
        <h3>${esc(r.asset || '(자산·종목 미입력)')}</h3>
        <div class="meta">${esc(dayLabel(r.date))} ${r.action ? `<span class="tag">${esc(r.action)}</span>` : ''} ${reviewed ? '<span class="tag">복기 완료</span>' : '<span class="tag todo">복기 전</span>'} ${marksHTML(r)} ${quickTag(r)}${!reviewed && r.reviewOn ? ` <span class="meta">· 복기 ${r.reviewOn <= today ? '해 볼 때예요' : `예정 ${esc(shortDay(r.reviewOn))}`}</span>` : ''}</div>
      </div>
      ${actionButtons('invest', r.id)}
    </div>
    ${guideHTML('invest', r, ['asset', 'action', 'reviewIn', 'review'])}
    ${reviewed
      ? `${reviewBoxHTML(r)}<button type="button" class="btn ghost small" data-act="review" data-id="${esc(r.id)}">복기 고치기</button>`
      : `<div class="label">복기</div>
         <p class="meta" style="margin:2px 0 6px">아직 적지 않았어요.</p>
         <button type="button" class="btn ghost small" data-act="review" data-id="${esc(r.id)}">복기 쓰기</button>`}
  </div>`;
}

// 경제 화면의 칩 (위쪽: 공부 / 아래쪽: 투자)
const ECON_TABS = [
  { id: 'study', group: 'study', label: '경제 공부 메모' },
  { id: 'terms', group: 'study', label: '📒 용어장' },
  { id: 'unclear', group: 'study', label: '❓ 헷갈리는 것' },
  { id: 'invest', group: 'invest', label: '투자 기록·복기' },
  { id: 'due', group: 'invest', label: '⏰ 돌아볼 때가 된 기록' },
  { id: 'lessons', group: 'invest', label: '💡 교훈 모음' },
];

// 검색용: 기록 안의 글자(칩·목록 포함)를 한 줄로
const searchText = (r) => Object.values(r).flatMap((v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : (x && x.text) || '')) : typeof v === 'string' ? [v] : [])).join(' ').toLowerCase();

// 칩별 개수 (평가 없이 개수만. 칩을 만든 순서대로 보여줘요)
function tally(list, key, order) {
  const has = (r, c) => (Array.isArray(r[key]) ? r[key].includes(c) : r[key] === c);
  const extra = [...new Set(list.flatMap((r) => (Array.isArray(r[key]) ? r[key] : [r[key]])).filter((v) => v && !order.includes(v)))];
  return [...order, ...extra].map((c) => [c, list.filter((r) => has(r, c)).length]).filter(([, n]) => n);
}

function investStatsHTML(list) {
  const reasons = tally(list, 'reasons', CHIPS.investReason);
  const feelings = tally(list, 'feeling', CHIPS.investFeeling);
  if (!reasons.length && !feelings.length) return '';
  const line = (title, rows) => (rows.length ? `<p class="meta" style="margin:2px 0">${title}: ${rows.map(([c, n]) => `${esc(c)} ${n}번`).join(' · ')}</p>` : '');
  return `<div class="card stat-line">${line('관심 이유', reasons)}${line('그때 기분', feelings)}</div>`;
}

// 초성으로 묶어서 보여주려고 (가나다순 제목)
function initialOf(term) {
  const ch = term.trim().charAt(0);
  const code = ch.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return 'ㄱㄱㄴㄷㄷㄹㅁㅂㅂㅅㅅㅇㅈㅈㅊㅋㅌㅍㅎ'[Math.floor((code - 0xAC00) / 588)];
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : '#';
}

// 📒 용어장: 공부 메모의 "용어 : 뜻"을 모두 모아 가나다순으로
function termsListHTML() {
  const q = ui.query.trim().toLowerCase();
  const map = new Map();
  ofType('study').forEach((r) => parseTerms(r.terms).forEach((t) => {
    const k = t.term.toLowerCase();
    if (!map.has(k)) map.set(k, { term: t.term, items: [] });
    map.get(k).items.push({ meaning: t.meaning, r });
  }));
  const list = [...map.values()]
    .filter((e) => !q || e.term.toLowerCase().includes(q) || e.items.some((i) => i.meaning.toLowerCase().includes(q)))
    .sort((a, b) => a.term.localeCompare(b.term, 'ko'));
  if (!list.length) {
    return `<div class="empty">${q ? '검색 결과가 없어요.' : '아직 용어가 없어요. 공부 메모의 "✍ 더 적기"에 <b>용어 : 뜻</b> 형태로 적으면 여기에 모여요.'}</div>`;
  }
  let lastInitial = '';
  return `<p class="meta" style="margin:0 0 8px">용어 ${list.length}개 · 가나다순이에요. 누르면 그 공부 메모로 이동해요.</p>` + list.map((e) => {
    const ini = initialOf(e.term);
    const head = ini !== lastInitial ? `<h4 class="term-initial">${esc(ini)}</h4>` : '';
    lastInitial = ini;
    return `${head}<div class="card term">
      <b>${esc(e.term)}</b>
      ${e.items.map((i) => `<div class="term-row">${i.meaning ? `<span>${esc(i.meaning)}</span>` : '<span class="meta">(뜻은 아직 안 적었어요)</span>'}
        <button type="button" class="link-btn" data-act="goto" data-id="${esc(i.r.id)}">📖 ${esc(i.r.topic || '공부 메모')} · ${esc(shortDay(i.r.date))}</button></div>`).join('')}
    </div>`;
  }).join('');
}

// ❓ 헷갈리는 것: 체크하지 않은 것만 모아서, 그 자리에서 체크
function unclearListHTML() {
  const recs = ofType('study').filter((r) => Array.isArray(r.unclear) && r.unclear.some((t) => !t.done)).sort(byNewest);
  if (!recs.length) return '<div class="empty">체크하지 않은 헷갈리는 것이 없어요.</div>';
  const n = recs.reduce((a, r) => a + r.unclear.filter((t) => !t.done).length, 0);
  return `<p class="meta" style="margin:0 0 8px">아직 체크하지 않은 것 ${n}개예요. 이해했다 싶으면 체크해 주세요. 체크한 것은 공부 메모 카드에서 볼 수 있어요.</p>` + recs.map((r) => `<div class="card">
    <div class="item-head"><div><button type="button" class="link-btn" data-act="goto" data-id="${esc(r.id)}"><b>${esc(r.topic || '공부 메모')}</b></button> <span class="meta">${esc(dayLabel(r.date))}</span></div></div>
    <ul class="hw">${r.unclear.map((t, i) => (t.done ? '' : `<li><label>
      <input type="checkbox" data-act="task" data-key="unclear" data-id="${esc(r.id)}" data-i="${i}"><span>${esc(t.text)}</span></label></li>`)).join('')}</ul>
  </div>`).join('');
}

// ⏰ 돌아볼 때가 된 기록: 정한 날짜가 지난 복기 전 기록만 (알림 줄 없이 조용한 목록으로)
const dueRecords = () => ofType('invest').filter((r) => r.reviewOn && r.reviewOn <= todayStr() && !isReviewed(r)).sort((a, b) => a.reviewOn.localeCompare(b.reviewOn));

function dueListHTML() {
  const list = dueRecords();
  if (!list.length) return '<div class="empty">지금 돌아볼 때가 된 기록이 없어요.</div>';
  return `<p class="meta" style="margin:0 0 8px">정해 둔 복기 날짜가 지난 기록이에요. 서두르지 않아도 돼요.</p>` + list.map((r) => `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><h3>${esc(r.asset || '(자산·종목 미입력)')}</h3>
        <div class="meta">${esc(dayLabel(r.date))}에 기록 · 복기 예정 ${esc(shortDay(r.reviewOn))}${r.action ? ` · ${esc(r.action)}` : ''}</div></div>
      <button type="button" class="btn ghost small" data-act="review" data-id="${esc(r.id)}">복기 쓰기</button>
    </div>
    ${hasValue(r.grounds) ? `<ol class="lines">${r.grounds.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>` : ''}
  </div>`).join('');
}

// 💡 교훈 모음: 복기에서 적은 "한 줄 교훈"을 최신순으로
function lessonsListHTML() {
  const list = ofType('invest').filter((r) => hasValue(r.lesson)).sort((a, b) => (b.reviewedOn || b.date).localeCompare(a.reviewedOn || a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  if (!list.length) return '<div class="empty">아직 교훈이 없어요. 투자 기록의 "복기 쓰기"에서 한 줄 교훈을 남기면 여기에 모여요.</div>';
  return list.map((r) => `<div class="card">
    <div class="rv-lesson">💡 ${esc(r.lesson)}</div>
    <div class="row between" style="margin-top:6px">
      <span class="meta">${esc(r.asset || '투자 기록')} · ${esc(shortDay(r.reviewedOn || r.date))}</span>
      <button type="button" class="link-btn" data-act="goto" data-id="${esc(r.id)}">기록 보기</button>
    </div>
  </div>`).join('');
}

function econListHTML() {
  const type = ui.econTab;
  const q = ui.query.trim().toLowerCase();
  const all = ofType(type).sort(byNewest);
  const list = all.filter((r) => !q || searchText(r).includes(q));
  const stats = type === 'invest' && !q ? investStatsHTML(all) : '';
  if (!list.length) {
    return `<div class="empty">${q ? '검색 결과가 없어요.' : '아직 기록이 없어요. 위의 버튼으로 남겨 보세요.'}</div>`;
  }
  return stats + list.map(type === 'study' ? studyCard : investCard).join('');
}

// 지금 고른 칩에 맞는 화면
function econBodyHTML() {
  switch (ui.econTab) {
    case 'terms': return termsListHTML();
    case 'unclear': return unclearListHTML();
    case 'due': return dueListHTML();
    case 'lessons': return lessonsListHTML();
    default: return econListHTML();
  }
}

function renderEcon() {
  if (!ECON_TABS.some((t) => t.id === ui.econTab)) ui.econTab = 'study';
  const cur = ECON_TABS.find((t) => t.id === ui.econTab);
  const chip = (t) => `<button type="button" class="chip ${ui.econTab === t.id ? 'active' : ''}" data-act="econTab" data-id="${t.id}">${t.label}</button>`;
  const isInvest = cur.group === 'invest';
  const searchable = ['study', 'terms', 'invest'].includes(ui.econTab);
  view.innerHTML = `
    <h2 class="page-title">경제 공부·투자 기록</h2>
    <p class="page-sub">배운 것과 그때의 생각을 남기고, 시간이 지난 뒤 돌아보는 공간이에요.</p>
    <div class="chips">${ECON_TABS.filter((t) => t.group === 'study').map(chip).join('')}<span class="chip-sep" aria-hidden="true"></span>${ECON_TABS.filter((t) => t.group === 'invest').map(chip).join('')}</div>
    ${isInvest ? `<div class="notice" style="margin:0 0 14px;max-width:none">
      이곳은 <b>기록과 복기 전용</b>이에요. 사고팔기를 추천하거나 주문하는 기능, 시세·수익률 표시, 계좌 연결은 없어요.
    </div>` : ''}
    <div class="row between" style="margin-bottom:14px">
      <div class="row actions-row">
        <button type="button" class="btn purple" data-act="quick" data-menu="econ">⚡ 빠른 기록</button>
        <button type="button" class="btn" data-act="add" data-type="${isInvest ? 'invest' : 'study'}">＋ ${isInvest ? '투자 기록' : '공부 메모'} 추가</button>
      </div>
      ${searchable ? `<input class="search" id="search" type="search" placeholder="🔍 ${ui.econTab === 'terms' ? '용어 검색' : '기록 검색'}" value="${esc(ui.query)}">` : ''}
    </div>
    <div id="listBox">${econBodyHTML()}</div>`;
}

// 다른 화면의 기록으로 이동해서 잠깐 표시해 줘요 (용어장·교훈 모음 등에서)
function goToRecord(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  closeDlg();
  if (r.type === 'study' || r.type === 'invest') { ui.tab = 'econ'; ui.econTab = r.type; }
  else if (r.type === 'art') { ui.tab = 'art'; ui.artView = 'book'; ui.artKind = 'all'; ui.artArea = 'all'; }
  else { ui.tab = 'body'; ui.bodyFilter = 'all'; ui.bodyAllRange = true; }
  ui.query = '';
  render();
  setTimeout(() => {
    const el = document.querySelector(`[data-rid="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 2000);
  }, 60);
}

// 투자 복기 창: 질문에 답하는 방식. 예전 '나중에 돌아본 결과' 칸은 그대로 두고, 새 질문은 따로 저장해요.
function openReview(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  ui.backToDay = dlg.open && dlg.querySelector('.day-list') ? ui.dayOpen : null;
  openDlg(`
    <h2>복기 쓰기 · ${esc(r.asset || '투자 기록')}</h2>
    <div class="review-ref">
      <div class="meta">${esc(dayLabel(r.date))}에 남긴 기록${r.action ? ` · ${esc(r.action)}` : ''}${hasValue(r.reasons) ? ` · 관심 이유: ${esc(r.reasons.join(', '))}` : ''}</div>
      ${hasValue(r.grounds) ? `<div class="label">그때 적은 근거</div><ol class="lines">${r.grounds.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>` : ''}
      ${textBlock('그때 적은 "틀린다면 이유"', r.wrongIf)}
      ${textBlock('당시 생각과 근거 (예전 칸)', r.thought)}
    </div>
    <form id="reviewForm" data-id="${esc(id)}" novalidate>
      <div class="field"><label>근거는 맞았나?</label>${choiceHTML('rvGrounds', CHIPS.reviewGrounds, r.rvGrounds)}</div>
      <div class="field"><label>기분이 판단에 영향을 줬나?</label>${choiceHTML('rvMood', CHIPS.reviewMood, r.rvMood)}</div>
      <div class="field"><label for="f_rvAgain">다음에도 똑같이 할까?</label><input id="f_rvAgain" name="rvAgain" type="text" value="${esc(r.rvAgain || '')}" placeholder="예: 근거를 두세 가지 적어 보고 결정할래요"></div>
      <div class="field"><label for="f_lesson">한 줄 교훈</label><input id="f_lesson" name="lesson" type="text" value="${esc(r.lesson || '')}" placeholder="예: 친숙하다는 이유만으로 고르지 않는다"></div>
      <div class="field"><label for="f_review">나중에 돌아본 결과 - 자유롭게</label><textarea id="f_review" name="review" rows="3" placeholder="예: 생각보다 뉴스에 흔들렸다">${esc(r.review || '')}</textarea></div>
      <p class="hint">모두 선택이에요. 적고 싶은 것만 적어도 돼요.</p>
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`, 'roomy');
  formBase = formSnapshot();
}

async function saveReview(form) {
  const old = records.find((x) => x.id === form.dataset.id);
  if (!old) return;
  const rec = {
    ...old,
    rvGrounds: form.elements.rvGrounds.value,
    rvMood: form.elements.rvMood.value,
    rvAgain: form.elements.rvAgain.value.trim(),
    lesson: form.elements.lesson.value.trim(),
    review: form.elements.review.value.trim(),
    updatedAt: Date.now(),
  };
  delete rec.sample; // 예시를 고치면 내 기록이 돼요
  const any = isReviewed(rec);
  rec.reviewedOn = any ? (old.reviewedOn || todayStr()) : '';
  if (!(await saveRecord(rec))) return;
  const back = ui.backToDay;
  render();
  if (back) openDay(back); else closeDlg();
  toast(any ? '복기를 남겼어요.' : '복기를 비웠어요.', 2500);
}

/* ---------------------------------------------------------------------
   10. 메뉴 3: 그림 발전 기록
   --------------------------------------------------------------------- */
const artKindTag = (r) => (r.kind ? `<span class="tag art-kind">${esc(r.kind)}</span>` : '');

function artCard(r) {
  const details = guideHTML('art', r, ['topic', 'kind', 'tools']);
  return `<article class="card art-card" data-rid="${esc(r.id)}">
    ${r.image
      ? `<img class="art-img" src="${esc(r.image)}" alt="${esc(r.topic)}" data-act="zoom" data-id="${esc(r.id)}">`
      : '<div class="art-noimg">이미지 없음</div>'}
    <h3>${artKindTag(r)}${esc(r.topic || '(주제 미입력)')}</h3>
    <div class="meta">${esc(dayLabel(r.date))}${r.tools ? ` · ${esc(r.tools)}` : ''} ${marksHTML(r)} ${quickTag(r)}</div>
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
    <h3 style="margin-top:8px">${artKindTag(r)}${esc(r.topic)}</h3>
    <div class="meta">${esc(dayLabel(r.date))}${r.tools ? ` · ${esc(r.tools)}` : ''}</div>
    ${textBlock('마음에 드는 곳', r.liked)}
    ${textBlock('새로 시도한 점', r.tried)}
    ${textBlock('어려웠던 점', r.hard)}
    ${textBlock('다음 목표', r.next)}
  </div>`;
}

// 📺 강의별 보기: 같은 강의·영상 이름을 적은 그림들을 날짜순으로 나란히
function courseViewHTML() {
  const groups = new Map();
  ofType('art').filter((r) => hasValue(r.course)).forEach((r) => {
    const k = r.course.trim();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  });
  if (!groups.size) {
    return '<div class="empty">아직 강의 이름이 적힌 그림이 없어요. 그림 기록의 "✍ 더 적기"에 참고한 강의·영상 이름을 적으면 여기에 모여요.</div>';
  }
  const list = [...groups].map(([name, items]) => ({ name, items: items.sort(byOldest) }))
    .sort((a, b) => byNewest(a.items[a.items.length - 1], b.items[b.items.length - 1])); // 최근에 그린 강의부터
  return list.map((g) => `<section class="card course-group">
    <div class="item-head"><h3>📺 ${esc(g.name)}</h3>
      <span class="meta">${g.items.length}장 · ${esc(shortDay(g.items[0].date))}${g.items.length > 1 ? ` ~ ${esc(shortDay(g.items[g.items.length - 1].date))}` : ''}</span></div>
    <div class="course-row">${g.items.map((r) => `<figure class="course-item" data-rid="${esc(r.id)}">
      ${r.image ? `<img class="art-img course-img" src="${esc(r.image)}" alt="${esc(r.topic)}" data-act="zoom" data-id="${esc(r.id)}">` : '<div class="art-noimg course-img">이미지 없음</div>'}
      <figcaption><span class="meta">${esc(shortDay(r.date))}</span> ${artKindTag(r)}${esc(r.topic || '(주제 미입력)')}</figcaption></figure>`).join('')}</div>
  </section>`).join('');
}

function renderArt() {
  const arts = ofType('art');
  const withImg = arts.filter((r) => r.image).sort(byOldest);
  const chip = (id, text) => `<button type="button" class="chip ${ui.artView === id ? 'active' : ''}" data-act="artView" data-id="${id}">${text}</button>`;

  let body = '';
  if (ui.artView === 'book') {
    const list = arts
      .filter((r) => ui.artKind === 'all' || r.kind === ui.artKind)
      .filter((r) => ui.artArea === 'all' || (Array.isArray(r.areas) && r.areas.includes(ui.artArea)))
      .sort(ui.artOrder === 'newest' ? byNewest : byOldest);
    const filterChip = (act, cur, id, text) => `<button type="button" class="chip small ${cur === id ? 'active' : ''}" data-act="${act}" data-id="${esc(id)}" aria-pressed="${cur === id}">${esc(text)}</button>`;
    const filtered = ui.artKind !== 'all' || ui.artArea !== 'all';
    body = `
      <div class="filter-box">
        <div class="chips"><span class="chip-label">종류</span>${filterChip('artKind', ui.artKind, 'all', '전체')}${ART_KINDS.map((k) => filterChip('artKind', ui.artKind, k, k)).join('')}</div>
        <div class="chips"><span class="chip-label">연습 영역</span>${filterChip('artArea', ui.artArea, 'all', '전체')}${CHIPS.artArea.map((k) => filterChip('artArea', ui.artArea, k, k)).join('')}</div>
      </div>
      <div class="row between" style="margin-bottom:12px">
        <span class="meta">${filtered ? `${list.length}개` : ''}</span>
        <div class="row"><span class="meta">정렬</span>
          <select id="artOrder" class="search" style="min-width:0">
            <option value="newest" ${ui.artOrder === 'newest' ? 'selected' : ''}>최근 것부터</option>
            <option value="oldest" ${ui.artOrder === 'oldest' ? 'selected' : ''}>오래된 것부터</option>
          </select>
        </div>
      </div>
      ${list.length ? `<div class="art-grid">${list.map(artCard).join('')}</div>`
        : `<div class="empty">${filtered ? '이 조건에 맞는 그림 기록이 없어요. 그림 카드의 \'수정\'에서 종류와 연습 영역을 고를 수 있어요.' : '아직 기록이 없어요. 위의 버튼으로 첫 그림을 남겨 보세요.'}</div>`}`;
  } else if (ui.artView === 'course') {
    body = courseViewHTML();
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
      <div class="chips" style="margin:0">${chip('book', '📖 기록장')}${chip('compare', '↔ 나란히 비교')}${chip('course', '📺 강의별 보기')}</div>
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
  { id: 'rest', chip: 'rest', icon: '😴', label: '쉼', test: (r) => r.type === 'rest' },
];
// 달력 위쪽의 종류 버튼 (바이올린 버튼 하나가 연습과 레슨을 함께 켜고 꺼요)
const CAL_CHIPS = [
  { id: 'workout', icon: '🧘', label: '운동' },
  { id: 'violin', icon: '🎻', label: '바이올린' },
  { id: 'study', icon: '📚', label: '경제 공부' },
  { id: 'invest', icon: '📊', label: '투자 기록' },
  { id: 'art', icon: '🎨', label: '그림' },
  { id: 'rest', icon: '😴', label: '쉼' },
];
const catOf = (r) => CAL_CATS.find((c) => c.test(r));
// 기록 하나의 그림 (슬로조깅은 🏃)
const iconOf = (r) => (r.type === 'workout' && r.kind === '슬로조깅' ? '🏃' : (catOf(r) || {}).icon || '📝');

function calTitle(r) {
  switch (r.type) {
    case 'workout': return r.kind || '운동';
    case 'violin': return r.kind === '레슨' ? '레슨' : (r.piece || '연습');
    case 'study': return r.topic || '공부 메모';
    case 'invest': return r.asset || '투자 기록';
    case 'rest': return '쉼';
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
    const top = Math.max(0, ...groups.flatMap((g) => g.items.map((r) => (amountOf(r) ? amountOf(r).v : 0)))); // 그날 가장 높은 연습량
    const onlyRest = groups.length > 0 && groups.every((g) => g.c.id === 'rest');
    const shade = `${groups.length && !onlyRest ? ' has' : ''}${onlyRest ? ' rest-only' : ''}${top ? ` amt${top}` : ''}`;
    cells.push(`<button type="button" class="cal-cell${shade}${date === today ? ' today' : ''}" data-act="calDay" data-date="${date}" aria-label="${esc(dayLabel(date))}, ${esc(say)}${top ? `, 연습량 ${AMOUNTS[top - 1].label}` : ''}">
      <span class="cal-num">${d}</span>
      <span class="cal-marks">${groups.map((g) => `<span class="cal-mark${g.c.id === 'rest' ? ' rest' : ''}" title="${esc(g.c.label)}"><span class="cal-ico">${g.c.icon}</span>${g.items.length > 1 ? `<sup>${g.items.length}</sup>` : ''}<span class="cal-t">${esc(calTitle(g.items[0]))}</span></span>`).join('')}</span>
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
    <p class="meta cal-legend">배경 진하기는 그날 가장 많이 한 연습량이에요:
      ${AMOUNTS.map((a, i) => `<span class="cal-swatch has amt${i + 1}" aria-hidden="true"></span>${esc(a.label)}`).join(' ')} · 😴 쉰 날</p>
    <p class="meta" style="margin-top:12px">${summary ? `${y}년 ${m}월의 기록: ${summary}` : `${y}년 ${m}월에는 기록이 없어요.`}</p>
    <div class="row" style="margin-top:14px">
      <button type="button" class="btn purple" data-act="recap">📖 ${ui.calMonth === today.slice(0, 7) ? '이번 달' : `${m}월`} 돌아보기</button>
      <button type="button" class="btn ghost purple" data-act="board">🎴 도장 모음판</button>
    </div>
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

/* ---------------------------------------------------------------------
   🎴 도장 모음판: 기록을 남기고 받은 도장이 받은 순서대로 한 달에 한 장씩 차곡차곡 붙어요.
   (날짜 칸이나 빈 칸은 없고, 받은 도장만 쌓여요. 예전 기록은 종류에 맞는 기본 도장으로 보여요.)
   --------------------------------------------------------------------- */
const stampOf = (r) => (r.type === 'rest' ? '😴' : r.stamp || iconOf(r));
const byReceived = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
const dowOf = (date) => '일월화수목금토'[parseDate(date).getDay()];

function stampButtons(list, mini = false) {
  return `<div class="board${mini ? ' mini' : ''}">${list.map((r, i) => {
    const tip = `${shortDay(r.date)} (${dowOf(r.date)}) · ${calTitle(r)}`;
    return `<button type="button" class="board-stamp t${i % 2}" style="--rot:${((i * 37) % 13) - 6}deg" data-act="boardGo" data-id="${esc(r.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${esc(stampOf(r))}</button>`;
  }).join('')}</div>`;
}

function openBoard(ym) {
  ui.boardMonth = ym;
  const [y, m] = ym.split('-').map(Number);
  const list = records.filter((r) => r.date && r.date.slice(0, 7) === ym && catOf(r)).sort(byReceived);
  openDlg(`
    <h2>🎴 도장 모음판</h2>
    <div class="row between board-nav">
      <button type="button" class="btn ghost small" data-act="boardShift" data-d="-1" ${ym <= CALENDAR_START ? 'disabled' : ''}>◀ 이전 달</button>
      <strong>${y}년 ${m}월</strong>
      <button type="button" class="btn ghost small" data-act="boardShift" data-d="1">다음 달 ▶</button>
    </div>
    ${list.length ? stampButtons(list) : '<div class="empty">이 달에 받은 도장이 아직 없어요.</div>'}
    <p class="meta" style="margin:10px 0 0">기록을 남길 때 받은 도장이 받은 순서대로 붙어요. 도장에 마우스를 올리면 날짜와 기록 제목이 보이고, 누르면 그 기록으로 가요.</p>
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
}

// 도장을 누르면 그 기록으로 (쉰 날은 그날의 기록 창으로)
function goToStamp(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  if (r.type === 'rest') { openDay(r.date); return; }
  goToRecord(id);
}

// 도장에 마우스를 올리면 날짜와 기록 제목이 말풍선으로 나타나요 (창 가장자리에서도 잘리지 않게 화면 안으로 맞춰요)
function showStampTip(btn) {
  let tip = dlg.querySelector('.stamp-tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'stamp-tip'; tip.setAttribute('role', 'tooltip'); dlg.append(tip); }
  tip.textContent = btn.dataset.tip || '';
  tip.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  tip.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  tip.style.top = `${r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8}px`;
}
function hideStampTip() { const tip = dlg.querySelector('.stamp-tip'); if (tip) tip.hidden = true; }
document.addEventListener('mouseover', (e) => { const b = e.target.closest && e.target.closest('.board-stamp'); if (b) showStampTip(b); });
document.addEventListener('mouseout', (e) => { if (e.target.closest && e.target.closest('.board-stamp')) hideStampTip(); });
document.addEventListener('focusin', (e) => { const b = e.target.closest && e.target.closest('.board-stamp'); if (b) showStampTip(b); });
document.addEventListener('focusout', (e) => { if (e.target.closest && e.target.closest('.board-stamp')) hideStampTip(); });

/* ---------------------------------------------------------------------
   🍂 계절 장식: 달마다 제목 옆과 오른쪽 아래 모서리에 이모지 하나 (움직이지 않아요)
   --------------------------------------------------------------------- */
function applySeason() {
  const icon = settings.seasonOff ? '' : (SEASON_DECOR[parseDate(todayStr()).getMonth()] || '');
  const t = $('#seasonIcon');
  const c = $('#seasonCorner');
  if (t) t.textContent = icon;
  if (c) { c.textContent = icon; c.hidden = !icon; }
}

/* ---------------------------------------------------------------------
   📖 이번 달 돌아보기 (점수·퍼센트·지난달과의 비교 없이, 남긴 것을 모아 보여줘요)
   --------------------------------------------------------------------- */
// ✏️ 항목을 더하려면 이 배열에 { id, build } 를 하나 추가하면 돼요. (예: 경제 용어 모음, 투자 교훈 모음)
//   build(c) 는 { title, html } 을 돌려주면 창에 순서대로 나타나고, 보여줄 게 없으면 null 을 돌려주면 그 항목은 빠져요.
//   c.real : 이 달의 기록 전부 (예시 기록 제외)   c.ym / c.y / c.m : 보고 있는 달   c.days : 기록한 날 수
const chipsOf = (rows) => `<div class="recap-chips">${rows.map(([icon, label, n]) => `<span class="recap-chip">${icon} ${esc(label)} <b>${n}</b></span>`).join('')}</div>`;
const RECAP_SECTIONS = [
  { id: 'days', build: (c) => {
    if (!c.real.length) return null;
    const restDays = new Set(c.real.filter((r) => r.type === 'rest').map((r) => r.date)).size;
    return { title: '기록한 날', html: `<div class="stats"><div class="stat"><b>${c.days}일</b><span>${c.m}월에 기록한 날</span></div>${restDays ? `<div class="stat"><b>${restDays}일</b><span>쉰 날</span></div>` : ''}</div>` };
  } },
  { id: 'kinds', build: (c) => {
    const kinds = SCHEMAS.workout.fields.find((f) => f.key === 'kind').options;
    const rows = CAL_CATS.map((cat) => {
      const items = c.real.filter((r) => cat.test(r));
      const sub = cat.id === 'workout' ? kinds.map((k) => [k, items.filter((r) => r.kind === k).length]).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(' · ') : '';
      return [cat.icon, `${cat.label}${sub && items.length ? ` (${sub})` : ''}`, items.length];
    }).filter((row) => row[2]);
    return rows.length ? { title: '종류별 횟수', html: chipsOf(rows) } : null;
  } },
  { id: 'amount', build: (c) => {
    const list = c.real.filter((r) => amountOf(r) && supportsAmount(r.type, r.kind));
    const rows = AMOUNTS.map((a) => [a.icon, a.label, list.filter((r) => amountOf(r).v === a.v).length]).filter((row) => row[2]);
    return rows.length ? { title: '연습량 (개수만)', html: chipsOf(rows) } : null;
  } },
  { id: 'piece', build: (c) => {
    const byPiece = new Map(); // 곡 이름 → 연습한 날들
    c.real.filter((r) => r.type === 'violin' && r.kind !== '레슨' && (r.piece || '').trim()).forEach((r) => {
      const k = r.piece.trim();
      if (!byPiece.has(k)) byPiece.set(k, new Set());
      byPiece.get(k).add(r.date);
    });
    if (!byPiece.size) return null;
    const most = Math.max(...[...byPiece.values()].map((d) => d.size));
    const names = [...byPiece].filter(([, d]) => d.size === most).map(([k]) => k);
    return { title: '가장 많이 연습한 곡', html: `<p class="recap-big">${names.map((n) => `🎼 ${pieceButton(n)}`).join('<br>')}</p><p class="meta" style="margin:0">${most}일 연습했어요${names.length > 1 ? ' (같은 날 수의 곡이 여럿이에요)' : ''}</p>` };
  } },
  { id: 'mood', build: (c) => {
    const rows = MOODS.map((m) => [m.icon, m.label, c.real.filter((r) => r.mood === m.v).length]).filter((row) => row[2]);
    return rows.length ? { title: '하고 나서 기분', html: chipsOf(rows) } : null;
  } },
  { id: 'good', build: (c) => { // 이번 달 "잘 된 것": 바이올린 '오늘 잘 된 것', 그림 '마음에 드는 곳'
    const items = [
      ...c.real.filter((r) => r.type === 'violin' && hasValue(r.good)).map((r) => ({ r, icon: '🎻', text: r.good })),
      ...c.real.filter((r) => r.type === 'art' && hasValue(r.liked)).map((r) => ({ r, icon: '🎨', text: r.liked })),
    ].sort((a, b) => byNewest(a.r, b.r)).slice(0, 8);
    return items.length ? { title: '이 달의 "잘 된 것"', html: `<ul class="note-list">${items.map(({ r, icon, text }) => `<li><span class="meta">${esc(shortDay(r.date))}</span><span class="pre">${icon} ${esc(text)}</span></li>`).join('')}</ul>` } : null;
  } },
  { id: 'terms', build: (c) => { // 이번 달 새로 알게 된 경제 용어
    const seen = new Set();
    const rows = [];
    c.real.filter((r) => r.type === 'study').sort(byOldest).forEach((r) => parseTerms(r.terms).forEach((t) => {
      if (!seen.has(t.term.toLowerCase())) { seen.add(t.term.toLowerCase()); rows.push(t); }
    }));
    return rows.length ? { title: '이 달 새로 알게 된 경제 용어', html: `<ul class="note-list">${rows.map((t) => `<li><b>${esc(t.term)}</b><span class="pre">${esc(t.meaning)}</span></li>`).join('')}</ul>` } : null;
  } },
  { id: 'investLessons', build: (c) => { // 이번 달 투자 교훈: 복기에서 교훈을 적은 달 기준 (날짜가 없으면 기록한 달)
    const list = c.all.filter((r) => r.type === 'invest' && hasValue(r.lesson) && (r.reviewedOn || r.date).slice(0, 7) === c.ym).sort((a, b) => (b.reviewedOn || b.date).localeCompare(a.reviewedOn || a.date));
    return list.length ? { title: '이 달의 투자 교훈', html: list.map((r) => `<div class="recap-quote"><div class="meta">${esc(r.asset || '투자 기록')} · ${esc(shortDay(r.reviewedOn || r.date))}</div><p class="pre">💡 ${esc(r.lesson)}</p></div>`).join('') } : null;
  } },
  { id: 'art', build: (c) => {
    const imgs = c.real.filter((r) => r.type === 'art' && r.image).sort(byOldest);
    if (!imgs.length) return null;
    const fig = (r, cap) => `<figure class="recap-fig"><img class="art-img recap-img" src="${esc(r.image)}" alt="${esc(r.topic || '그림')}"><figcaption><b>${cap}</b> · ${esc(dayLabel(r.date))}${r.topic ? ` · ${esc(r.topic)}` : ''}</figcaption></figure>`;
    const first = imgs[0];
    const last = imgs[imgs.length - 1];
    return { title: '그림', html: `<div class="recap-figs">${imgs.length === 1 ? fig(first, '이 달의 그림') : `${fig(first, '첫 그림')}${fig(last, '마지막 그림')}`}</div>` };
  } },
  { id: 'lessons', build: (c) => {
    const ls = c.real.filter((r) => r.type === 'violin' && r.kind === '레슨' && ((r.feedback || '').trim() || hasValue(r.praise) || hasValue(r.newLearn))).sort(byOldest);
    if (!ls.length) return null;
    return { title: '레슨 피드백 모음', html: ls.map((r) => `<div class="recap-quote"><div class="meta">${esc(dayLabel(r.date))}</div>${hasValue(r.feedback) ? `<p class="pre">${esc(r.feedback)}</p>` : ''}${hasValue(r.praise) ? `<p class="pre">👍 ${esc(r.praise)}</p>` : ''}${hasValue(r.newLearn) ? `<p class="pre">📝 ${esc(r.newLearn)}</p>` : ''}</div>`).join('') };
  } },
  { id: 'stamps', build: (c) => (c.real.length ? { title: '이 달의 도장판', html: stampButtons([...c.real].sort(byReceived), true) } : null) }, // 🎴 도장 모음판을 작게
];

function openRecap() {
  const ym = ui.calMonth || todayStr().slice(0, 7);
  const [y, m] = ym.split('-').map(Number);
  const inMonth = records.filter((r) => r.date && r.date.slice(0, 7) === ym && catOf(r));
  const real = inMonth.filter((r) => !r.sample); // 예시 기록은 세지 않아요 (위의 '기록한 날'과 같은 기준)
  const all = records.filter((r) => !r.sample && r.date);
  const c = { ym, y, m, real, all, days: new Set(real.map((r) => r.date)).size };
  const sections = RECAP_SECTIONS.map((sec) => sec.build(c)).filter(Boolean);
  openDlg(`
    <h2>📖 ${y}년 ${m}월 돌아보기</h2>
    <p class="meta" style="margin-top:0">점수나 비교 없이, 이 달에 남긴 것을 모아 봤어요.${inMonth.length > real.length ? ' 예시 기록은 넣지 않았어요.' : ''}</p>
    ${sections.length
      ? sections.map((sec) => `<section class="recap-sec"><h3>${esc(sec.title)}</h3>${sec.html}</section>`).join('')
      : '<div class="empty">이 달에는 기록이 없어요.</div>'}
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
}

// 날짜를 누르면 그날의 기록을 한 창에 모아 보여줘요
function openDay(date) {
  ui.dayOpen = date;
  const list = records.filter((r) => r.date === date && catOf(r)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const card = { workout: workoutCard, violin: violinCard, study: studyCard, invest: investCard, art: artCard, rest: restCard };
  const add = [['workout', '운동'], ['violin', '바이올린'], ['study', '경제 공부'], ['invest', '투자 기록'], ['art', '그림']]
    .map(([t, l]) => `<button type="button" class="btn ghost small" data-act="addOn" data-type="${t}" data-date="${date}">＋ ${l}</button>`).join('')
    + restButtonHTML(date);
  openDlg(`
    <h2>${esc(dayLabel(date))}</h2>
    <div class="day-list">${list.length ? list.map((r) => card[r.type](r)).join('') : '<div class="empty">기록이 없어요.</div>'}</div>
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
function hideToast() {
  const el = $('#toast');
  clearTimeout(toastTimer);
  el.hidden = true;
  try { if (el.hidePopover && el.matches(':popover-open')) el.hidePopover(); } catch (e) { /* 괜찮아요 */ }
}

// extra.stamp: 맨 앞에 크게 찍히는 도장 그림, extra.action: 토스트 안의 버튼 { label, act, id }
function toast(msg, ms = 6000, extra = {}) {
  const el = $('#toast');
  el.replaceChildren();
  if (extra.stamp) {
    const st = document.createElement('span');
    st.className = 'stamp';
    st.textContent = extra.stamp;
    el.append(st);
  }
  const text = document.createElement('span');
  text.textContent = msg;
  el.append(text);
  if (extra.action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-btn';
    b.dataset.act = extra.action.act;
    if (extra.action.id) b.dataset.id = extra.action.id;
    b.textContent = extra.action.label;
    el.append(b);
  }
  el.hidden = false;
  // popover로 띄우면 열려 있는 창(날짜 창 등) 위에도 보여요. 못 쓰는 브라우저에서는 그냥 아래쪽에 떠요.
  try { if (el.showPopover) { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } } catch (e) { /* 괜찮아요 */ }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms);
}

/* ---------------------------------------------------------------------
   도장과 축하 한 줄 (새 기록을 저장한 뒤 잠깐 나타나요. 점수나 평가가 아니라 '남겼다'는 사실만 알려줘요)
   --------------------------------------------------------------------- */
const isMilestone = (n) => [5, 10, 20, 30, 50].includes(n) || (n >= 100 && n % 50 === 0);

// 첫 기록이거나 딱 떨어지는 숫자에 닿았을 때만 나오는 한 줄 (아니면 빈 글자)
function milestoneText(rec) {
  const c = catOf(rec);
  if (!c || !rec.date) return '';
  const real = records.filter((r) => !r.sample && r.date && catOf(r)); // 예시 기록은 세지 않아요
  if (real.length === 1) return '🌱 첫 기록을 남겼어요. 여기서부터 차곡차곡 쌓여요.';
  const newDay = real.filter((r) => r.date === rec.date).length === 1; // 이 날의 첫 기록인지
  const allDays = new Set(real.map((r) => r.date)).size;
  if (newDay && isMilestone(allDays)) return `🎉 기록한 날이 모두 ${allDays}일이 되었어요.`;
  const nth = real.filter((r) => catOf(r).id === c.id).length;
  if (c.id !== 'rest' && isMilestone(nth)) return `${c.icon} ${c.label} ${nth}번째${c.label.endsWith('기록') ? '예요' : ' 기록이에요'} 🎉`;
  return '';
}

// 도장 하나 고르기: 밤이면 밤 문구, 아니면 종류별 문구 (바로 전에 나온 것은 피해요)
let lastStamp = '';
function pickStamp(rec) {
  const h = new Date().getHours();
  const night = h >= NIGHT_START || h < NIGHT_END;
  const c = catOf(rec);
  const pool = night ? STAMPS.night : [...((c && STAMPS[c.id]) || []), ...STAMPS.general];
  const options = pool.length > 1 ? pool.filter((p) => p !== lastStamp) : pool;
  const phrase = options[Math.floor(Math.random() * options.length)];
  lastStamp = phrase;
  const i = phrase.indexOf(' ');
  return i < 0 ? { icon: '', text: phrase } : { icon: phrase.slice(0, i), text: phrase.slice(i + 1) };
}

// 새 기록을 저장하기 직전에 부르면, 이 기록이 받는 도장을 골라서 기록에 남겨 둬요(stamp). 🎴 도장 모음판이 이 그림을 써요.
// 쉰 날은 늘 😴 도장이에요. remember=false 이면 화면에 보여줄 한 마디는 따로 기억하지 않아요.
const stampPhrases = new Map();
function assignStamp(rec, remember = true) {
  const s = pickStamp(rec);
  if (rec.type === 'rest') s.icon = '😴';
  rec.stamp = s.icon;
  if (remember) stampPhrases.set(rec.id, s);
  return rec;
}

// 새 기록을 저장한 직후에 부르는 함수. extra.action 이 있으면(오늘 탭) 축하를 꺼 두어도 그 버튼은 보여줘요.
function afterNewRecord(rec, extra = {}) {
  const ms = extra.action ? 8000 : 5000;
  const s = stampPhrases.get(rec.id) || pickStamp(rec);
  stampPhrases.delete(rec.id);
  if (settings.celebrateOff) { if (extra.action) toast('저장했어요', ms, extra); return; }
  const m = milestoneText(rec);
  if (m) { toast(m, ms, extra); return; }
  toast(s.text, ms, { ...extra, stamp: s.icon });
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
      const saved = await saveRecord(assignStamp({
        id: newId(), type: 'art', createdAt: Date.now() + i, updatedAt: Date.now(),
        quick: true, date: dateOfFile(imgs[i]), topic: '', image,
      }, false));
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
  document.querySelectorAll('.audio-drop.over').forEach((a) => a.classList.remove('over'));
}

document.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault(); // 이렇게 해야 브라우저가 사진을 열어 버리면서 기록장이 사라지지 않아요
  const z = $('#dropZone');
  if (z) z.classList.toggle('over', !!(e.target.closest && e.target.closest('#dropZone')));
  document.querySelectorAll('.audio-drop').forEach((a) => a.classList.toggle('over', !!(e.target.closest && e.target.closest('.audio-drop'))));
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
  if (dlg.open && dlg.querySelector('.audio-drop') && files.some(isAudioFile)) { await stageAudioFiles(files); return; } // 🎙 녹음
  if (!dlg.open && files.some(isAudioFile) && !files.some(isImage)) { toast('녹음 파일은 곡 노트나 바이올린 기록 창의 🎙 칸에 놓아 주세요.'); return; }
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
   10-4. 🎙 바이올린 녹음 (휴대폰으로 녹음한 파일을 곡에 붙여 두고, 나중에 처음과 지금을 들어 봐요)
   --------------------------------------------------------------------- */
const AUDIO_MIME_BY_EXT = { m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac', amr: 'audio/amr', wma: 'audio/x-ms-wma', aif: 'audio/aiff', aiff: 'audio/aiff', caf: 'audio/x-caf', '3gp': 'audio/3gpp' };
const extOf = (name) => { const m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; };
const pieceKey = (p) => String(p || '').trim();
const fmtMB = (bytes) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)}MB`;

// 오디오 파일인지 (형식 이름이 audio/ 로 시작하거나, 형식이 비어 있고 확장자가 녹음 파일일 때)
function isAudioFile(f) {
  if (!f) return false;
  const t = typeof f.type === 'string' ? f.type : '';
  if (t.startsWith('audio/')) return true;
  return (!t || t === 'application/octet-stream' || t === 'video/mp4') && !!AUDIO_MIME_BY_EXT[extOf(f.name)];
}

// 파일 이름 안의 날짜 찾기: 20260930 · 2026-09-30 · 2026.09.30 · 260930 (삼성 음성 녹음 "음성 260930_143012.m4a", 카카오톡 "KakaoTalk_20260930_…")
function dateFromFileName(name) {
  const base = String(name || '').replace(/\.[^.]*$/, '');
  const found = [];
  const add = (re, toYMD) => { for (const m of base.matchAll(re)) found.push({ i: m.index, ymd: toYMD(m) }); };
  add(/(?<!\d)(20\d{2})[-._ /](\d{1,2})[-._ /](\d{1,2})(?!\d)/g, (m) => [+m[1], +m[2], +m[3]]);
  add(/(?<!\d)(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/g, (m) => [+m[1], +m[2], +m[3]]);
  add(/(?<!\d)(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/g, (m) => [2000 + +m[1], +m[2], +m[3]]);
  add(/(?<!\d)(\d{2})[-._](\d{2})[-._](\d{2})(?!\d)/g, (m) => [2000 + +m[1], +m[2], +m[3]]);
  const today = todayStr();
  for (const { ymd: [y, mo, d] } of found.sort((a, b) => a.i - b.i)) {
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && toStr(dt) <= today) return toStr(dt);
  }
  return '';
}
// 녹음한 날: ① 파일 이름 안의 날짜 ② 없으면 파일의 날짜 (카카오톡·구글 드라이브로 옮기면 파일 날짜가 옮긴 날로 바뀔 수 있어서요)
const recordingDateOf = (f) => dateFromFileName(f.name) || dateOfFile(f);

// 녹음 길이(초). 읽을 수 없으면 NaN (그럴 땐 파일 크기만 봐요)
function probeDuration(file) {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    let done = false;
    const finish = (d) => { if (done) return; done = true; URL.revokeObjectURL(url); a.removeAttribute('src'); resolve(d); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => finish(Number.isFinite(a.duration) ? a.duration : NaN);
    a.onerror = () => finish(NaN);
    setTimeout(() => finish(NaN), 4000);
    a.src = url;
  });
}

const audiosOf = (piece) => audios.filter((a) => a.piece === pieceKey(piece)).sort(byOldest);

/* ---- 올리려고 고른 녹음들 (아직 저장 전. 날짜와 메모를 고칠 수 있어요) ---- */
let staged = [];
const TOO_LONG_MSG = "5분 이내 녹음만 올릴 수 있어요. 녹음 앱 설정에서 음질을 '중간'으로 낮추면 파일이 작아져요.";

async function stageAudioFiles(files) {
  const note = $('#audioNote');
  const say = (t) => { if (note) note.textContent = t; };
  const good = files.filter(isAudioFile);
  const notAudio = files.length - good.length;
  if (!good.length) { say('녹음 파일(m4a, mp3, wav, aac 등)만 올릴 수 있어요.'); return; }
  let tooBig = 0;
  let room = AUDIO_MAX_PER_PIECE - staged.length;
  let over = 0;
  for (const f of good) {
    if (f.size > AUDIO_MAX_BYTES) { tooBig += 1; continue; }
    const dur = await probeDuration(f);
    if (dur > AUDIO_MAX_SECONDS + 0.5) { tooBig += 1; continue; }
    if (room <= 0) { over += 1; continue; }
    staged.push({ sid: newId(), file: f, name: f.name || '녹음', date: recordingDateOf(f), memo: '' });
    room -= 1;
  }
  say([tooBig ? TOO_LONG_MSG : '', notAudio ? `녹음 파일이 아닌 ${notAudio}개는 뺐어요.` : '', over ? `한 번에 ${AUDIO_MAX_PER_PIECE}개까지 고를 수 있어서 ${over}개는 뺐어요.` : ''].filter(Boolean).join(' '));
  const moreBox = $('#moreBox');
  if (moreBox && staged.length) moreBox.open = true;
  renderStaged();
}

function stagedHTML(withUpload) {
  if (!staged.length) return '';
  return `<div class="stage-list">${staged.map((s) => `<div class="stage-row">
      <div class="stage-name">🎙 <b>${esc(s.name)}</b> <span class="meta">${esc(fmtMB(s.file.size))}</span></div>
      <label class="stage-f"><span class="meta">녹음한 날</span><input type="date" data-stage="date" data-sid="${esc(s.sid)}" value="${esc(s.date)}" max="${todayStr()}"></label>
      <label class="stage-f grow"><span class="meta">메모 - 선택</span><input type="text" maxlength="120" data-stage="memo" data-sid="${esc(s.sid)}" value="${esc(s.memo)}" placeholder="예: 2마디 음정 신경 씀"></label>
      <button type="button" class="btn ghost small" data-act="unstage" data-sid="${esc(s.sid)}">빼기</button>
    </div>`).join('')}
    ${withUpload ? '<div class="row"><button type="button" class="btn purple small" data-act="uploadStaged">올리기</button></div>' : '<p class="hint" style="margin:4px 0 0">기록을 저장하면 곡에 붙어요.</p>'}
  </div>`;
}
function renderStaged() {
  const box = $('#audioStage');
  if (box) box.innerHTML = stagedHTML(!!$('#pieceAudio'));
}

// 곡에 녹음 하나 저장. 곡에 이미 5개가 있으면 (첫 녹음을 뺀) 가장 오래된 것을 지울지 물어봐요. 저장하면 true
async function addRecording(piece, { file, date, memo, name, recId }) {
  piece = pieceKey(piece);
  if (!AudioStore.ok()) { alert('이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.'); return false; }
  const list = audiosOf(piece);
  let victim = null;
  if (list.length >= AUDIO_MAX_PER_PIECE) {
    victim = list.find((a) => !a.first);
    if (!victim) return false;
    const what = `${dayLabel(victim.date)}${victim.memo ? ` · ${victim.memo}` : ''}`;
    if (!confirm(`'${piece}'에는 녹음이 ${AUDIO_MAX_PER_PIECE}개 있어요.\n가장 오래된 녹음(첫 녹음 제외)을 지우고 올릴까요?\n\n지워지는 녹음: ${what}`)) return false;
  }
  const mime = file.type && file.type.startsWith('audio/') ? file.type : (AUDIO_MIME_BY_EXT[extOf(file.name)] || 'audio/mpeg');
  const meta = { id: newId(), piece, date: date || todayStr(), memo: memo || '', createdAt: Date.now(), size: file.size, mime, name: name || file.name || '', first: list.length === 0, recId: recId || '' };
  try {
    await AudioStore.put({ ...meta, blob: new Blob([file], { type: mime }) });
  } catch (e) { alert('녹음을 저장하지 못했어요. 저장 공간이 부족할 수 있어요.'); return false; }
  audios.push(meta);
  if (victim) await dropAudio(victim.id);
  if (meta.first) scheduleAutosave();
  return true;
}

// 고른 녹음들을 곡에 붙여요 (날짜가 이른 것부터. 곡의 첫 녹음이 되는 건 가장 먼저 저장된 것이에요)
async function commitStaged(piece, recId) {
  const list = [...staged].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  staged = [];
  let added = 0;
  for (const s of list) {
    if (await addRecording(piece, { file: s.file, date: s.date, memo: s.memo.trim(), name: s.name, recId })) added += 1;
  }
  if (added) render();
  return added;
}

const audioB64 = new Map(); // 백업용으로 한 번 바꿔 둔 글자 (녹음 파일은 그대로라서 다시 바꾸지 않아요)
async function dropAudio(id) {
  const a = audios.find((x) => x.id === id);
  if (!a) return;
  if (cardPlayer.aid === id && cardPlayer.el) cardPlayer.el.pause();
  try { await AudioStore.remove([id]); } catch (e) { /* 이미 없어도 괜찮아요 */ }
  audios = audios.filter((x) => x.id !== id);
  audioB64.delete(id);
  if (a.first) scheduleAutosave();
}

async function deleteRecording(id) {
  const a = audios.find((x) => x.id === id);
  if (!a) return;
  const msg = a.first
    ? `🌱 첫 녹음이에요. 지우면 되돌릴 수 없어요.\n(${dayLabel(a.date)})\n그래도 지울까요?`
    : `이 녹음을 지울까요? 되돌릴 수 없어요.\n(${dayLabel(a.date)}${a.memo ? ` · ${a.memo}` : ''})`;
  if (!confirm(msg)) return;
  await dropAudio(id);
  refreshAudioUI();
}

async function saveAudioMemo(id, memo) {
  const a = audios.find((x) => x.id === id);
  if (!a || a.memo === memo) return;
  try {
    const full = await AudioStore.get(id);
    if (full) await AudioStore.put({ ...full, memo });
  } catch (e) { return; }
  a.memo = memo;
  if (a.first) scheduleAutosave();
  toast('녹음 메모를 남겼어요.', 1800);
}

/* ---- 재생 (한 번에 하나만 재생돼요) ---- */
let playing = null;
function playExclusive(el) {
  if (playing && playing !== el) { try { playing.pause(); } catch (e) { /* 괜찮아요 */ } }
  playing = el;
}
async function hydrateAudio(root) {
  for (const el of [...root.querySelectorAll('audio[data-aid]')]) {
    if (el.dataset.ready) continue;
    el.dataset.ready = '1';
    el.addEventListener('play', () => playExclusive(el));
    try {
      const full = await AudioStore.get(el.dataset.aid);
      if (full && full.blob && el.isConnected) el.src = URL.createObjectURL(full.blob);
    } catch (e) { /* 파일을 못 찾으면 재생 칸만 비어 있어요 */ }
  }
}
function revokeAudioUrls(root) {
  root.querySelectorAll('audio').forEach((a) => {
    try { a.pause(); } catch (e) { /* 괜찮아요 */ }
    if (playing === a) playing = null;
    if (a.src && a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
  });
}

// 바이올린 카드의 작은 🎙: 누르면 창을 열지 않고 바로 재생, 다시 누르면 멈춰요
const cardPlayer = { el: null, aid: null, url: '' };
function syncPlayButtons() {
  document.querySelectorAll('.rec-play').forEach((b) => {
    const on = !!cardPlayer.el && !cardPlayer.el.paused && cardPlayer.aid === b.dataset.aid;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
async function toggleCardPlay(aid) {
  if (!cardPlayer.el) {
    const el = new Audio();
    ['play', 'pause', 'ended'].forEach((ev) => el.addEventListener(ev, syncPlayButtons));
    el.addEventListener('play', () => playExclusive(el));
    cardPlayer.el = el;
  }
  const el = cardPlayer.el;
  if (cardPlayer.aid === aid && !el.paused) { el.pause(); return; }
  let full = null;
  try { full = await AudioStore.get(aid); } catch (e) { /* 아래에서 알려줘요 */ }
  if (!full || !full.blob) { toast('녹음 파일을 찾을 수 없어요.'); return; }
  if (cardPlayer.url) URL.revokeObjectURL(cardPlayer.url);
  cardPlayer.url = URL.createObjectURL(full.blob);
  cardPlayer.aid = aid;
  el.src = cardPlayer.url;
  try { await el.play(); } catch (e) { toast('재생하지 못했어요. 이 브라우저에서 열 수 없는 형식일 수 있어요.'); }
  syncPlayButtons();
}
const recMarksHTML = (r) => audios.filter((a) => a.recId === r.id).sort(byOldest).map((a) => `<button type="button" class="rec-play" data-act="playRec" data-aid="${esc(a.id)}" title="녹음 듣기${a.memo ? ` · ${esc(a.memo)}` : ''}" aria-label="녹음 재생" aria-pressed="false">🎙</button>`).join('');

/* ---- 녹음 목록 (곡 노트와 입력 창에서 같이 써요) ---- */
function audioRowHTML(a) {
  return `<div class="rec-row" data-aid="${esc(a.id)}">
    <div class="rec-row-head">
      ${a.first ? '<span class="tag first-rec">🌱 첫 녹음</span>' : ''}<span class="rec-date">${esc(dayLabel(a.date))}</span>
      <input class="rec-memo" type="text" maxlength="120" data-audio-memo="${esc(a.id)}" value="${esc(a.memo)}" placeholder="메모 - 선택" aria-label="녹음 메모">
      <button type="button" class="btn danger small" data-act="delAudio" data-aid="${esc(a.id)}">삭제</button>
    </div>
    <audio class="rec-player" controls preload="metadata" data-aid="${esc(a.id)}"></audio>
  </div>`;
}

// 처음 vs 지금: 첫 녹음(없으면 가장 오래된 것)과 가장 최근 녹음을 나란히
function audioPairHTML(list) {
  if (list.length < 2) return '';
  const start = list.find((a) => a.first) || list[0];
  const now = list.filter((a) => a.id !== start.id).pop();
  const col = (title, a) => `<div class="rec-pair-col"><div class="label" style="margin-top:0">${title} <span class="meta">${esc(dayLabel(a.date))}${a.memo ? ` · ${esc(a.memo)}` : ''}</span></div>
    <audio class="rec-player" controls preload="metadata" data-aid="${esc(a.id)}"></audio></div>`;
  return `<div class="rec-pair"><div class="label" style="margin:0 0 6px">처음 vs 지금</div><div class="rec-pair-cols">${col(start.first ? '🌱 처음 (첫 녹음)' : '처음', start)}${col('지금', now)}</div></div>`;
}

const AUDIO_ACCEPT = 'audio/*,.m4a,.mp3,.wav,.aac';
const AUDIO_HINT = `m4a · mp3 · wav · aac · 한 파일 5분(15MB)까지 · 곡마다 최대 ${AUDIO_MAX_PER_PIECE}개`;

function pieceAudioInner(piece) {
  const list = audiosOf(piece);
  if (!AudioStore.ok()) return '<h3 class="audio-h">🎙 녹음</h3><p class="meta">이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.</p>';
  return `<h3 class="audio-h">🎙 녹음</h3>
    <input id="p_audio" type="file" accept="${AUDIO_ACCEPT}" multiple class="sr-only" data-audio-input>
    <label class="audio-drop" for="p_audio"><span>🎙 녹음 올리기</span><small>파일을 끌어다 놓거나 눌러서 고르세요 · ${esc(AUDIO_HINT)}</small></label>
    <div class="hint" id="audioNote"></div>
    <div class="audio-stage" id="audioStage"></div>
    ${audioPairHTML(list)}
    ${list.length ? `<div class="rec-list">${list.map(audioRowHTML).join('')}</div>` : '<p class="meta" style="margin:6px 0 0">아직 올린 녹음이 없어요. 휴대폰 녹음 파일을 올려 두면 나중에 처음과 지금을 나란히 들어 볼 수 있어요.</p>'}`;
}

// 녹음이 바뀐 뒤: 뒤의 화면(카드의 🎙, 책장)과 열려 있는 창의 녹음 칸을 새로 그려요
function refreshAudioUI() {
  render();
  const swap = (box, html) => { revokeAudioUrls(box); box.innerHTML = html; hydrateAudio(box); renderStaged(); };
  if (!dlg.open) return;
  const pb = dlg.querySelector('#pieceAudio');
  if (pb) swap(pb, pieceAudioInner(pb.dataset.piece));
  const fb = dlg.querySelector('#formAudioList');
  if (fb) swap(fb, audios.filter((a) => a.recId === fb.dataset.rec).sort(byOldest).map(audioRowHTML).join(''));
}

/* ---- 백업에 넣기: 곡마다 첫 녹음만 (⚙ 에서 "녹음은 백업에서 빼기"를 켜면 하나도 넣지 않아요) ---- */
const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(fr.error);
  fr.readAsDataURL(blob);
});

async function audiosForBackup() {
  if (settings.audioSkip || !AudioStore.ok()) return [];
  const out = [];
  for (const a of audios.filter((x) => x.first)) {
    let data = audioB64.get(a.id);
    if (!data) {
      const full = await AudioStore.get(a.id);
      if (!full || !full.blob) continue;
      data = await blobToDataURL(full.blob);
      audioB64.set(a.id, data);
    }
    out.push({ id: a.id, piece: a.piece, date: a.date, memo: a.memo, createdAt: a.createdAt, mime: a.mime, name: a.name, size: a.size, first: true, recId: a.recId, data });
  }
  return out;
}

// 백업·자동 저장 파일에서 녹음 불러오기. 이 브라우저에 이미 있는 녹음은 지우지도 덮어쓰지도 않아요. 새로 넣은 개수를 돌려줘요.
async function importAudios(payload) {
  const list = payload && Array.isArray(payload.audios) ? payload.audios : [];
  if (!list.length || !AudioStore.ok()) return 0;
  let added = 0;
  for (const a of list) {
    try {
      if (!a || typeof a.id !== 'string' || typeof a.data !== 'string' || !pieceKey(a.piece) || audios.some((x) => x.id === a.id)) continue;
      const have = audiosOf(a.piece);
      if (have.length >= AUDIO_MAX_PER_PIECE) continue;
      const blob = await (await fetch(a.data)).blob();
      const meta = { id: a.id, piece: pieceKey(a.piece), date: typeof a.date === 'string' ? a.date : todayStr(), memo: typeof a.memo === 'string' ? a.memo : '', createdAt: Number(a.createdAt) || Date.now(), size: blob.size, mime: typeof a.mime === 'string' && a.mime ? a.mime : blob.type || 'audio/mpeg', name: typeof a.name === 'string' ? a.name : '', first: !!a.first && !have.some((x) => x.first), recId: typeof a.recId === 'string' ? a.recId : '' };
      await AudioStore.put({ ...meta, blob: new Blob([blob], { type: meta.mime }) });
      audios.push(meta);
      added += 1;
    } catch (e) { /* 이 녹음만 건너뛰어요 */ }
  }
  return added;
}

/* ---------------------------------------------------------------------
   11. 입력 창 (추가/수정)
   --------------------------------------------------------------------- */
function openDlg(html, size) {
  revokeAudioUrls(dlg); // 창 안에서 듣던 녹음은 멈추고 정리해요
  dlg.className = size === 'roomy' ? 'roomy' : size ? 'wide' : '';
  dlg.innerHTML = `<div class="dlg-body">${html}</div>`;
  if (!dlg.open) dlg.showModal();
  hydrateAudio(dlg);
  renderStaged();
  syncPlayButtons();
}
function closeDlg() { if (dlg.open) dlg.close(); }

let formImage = null; // 입력 창에서 선택한 이미지(데이터 주소)
let formShots = []; // 입력 창에서 고른 워치 캡처들
let formBase = '';  // 입력 창을 열었을 때의 내용 (Esc로 닫을 때 뭔가 적었는지 비교해요)

// 지금 열려 있는 입력 창(기록·빠른 기록)의 내용을 글자 하나로 만들어 둬요
function formSnapshot() {
  const f = dlg.open ? dlg.querySelector('#recForm, #quickForm, #reviewForm') : null;
  if (!f) return '';
  return `${JSON.stringify([...new FormData(f)].map(([k, v]) => [k, typeof v === 'string' ? v : '']))}|${(formImage || '').length}|${formShots.length}|${staged.length}`;
}
const isFormDirty = () => { const now = formSnapshot(); return now !== '' && now !== formBase; };

function fieldHTML(f, value, type) {
  const id = `f_${f.key}`;
  const req = f.required ? ' <span class="req">*</span>' : '';
  const v = value ?? '';
  const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
  const rows = f.rows ? ` rows="${f.rows}"` : '';
  let input;
  if (f.type === 'textarea') {
    input = `<textarea id="${id}" name="${f.key}"${rows}${ph}>${esc(v)}</textarea>`;
  } else if (f.type === 'lines') { // 한 줄에 하나씩 (근거 세 가지 등)
    input = `<textarea id="${id}" name="${f.key}"${rows}${ph}>${esc(Array.isArray(value) ? value.join('\n') : v)}</textarea>`;
  } else if (f.type === 'tasks') { // 한 줄에 하나씩 적는 체크 목록 (레슨 과제, 헷갈리는 것, 레슨 때 물어볼 것)
    const text = Array.isArray(value) ? value.map((t) => t.text).join('\n') : '';
    input = `<textarea id="${id}" name="${f.key}"${rows || ' rows="2"'}${ph}>${esc(text)}</textarea>`;
  } else if (f.type === 'select') {
    const opts = (f.options || []).map((o) => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');
    input = `<select id="${id}" name="${f.key}">${f.required ? '' : '<option value="">(선택 안 함)</option>'}${opts}</select>`;
  } else if (f.type === 'choice' || f.type === 'chips') { // 버튼 칸 (연습량·기분·각종 칩)
    input = choiceHTML(f.key, f.choices, value, f.type === 'chips');
  } else if (f.type === 'images') { // 여러 장 (워치 캡처)
    input = `<input id="${id}" type="file" accept="image/*" multiple class="sr-only">
      <label class="dropzone" id="dropZone" data-multi="1" for="${id}"><span>🖼 여기에 ${esc(f.noun || '사진')}를 끌어다 놓거나, 눌러서 고르세요</span>
        <small>컴퓨터에서는 Ctrl+V(붙여넣기)도 돼요 · 최대 ${SHOT_MAX}장 · 휴대폰은 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote"></div>
      <div id="imgPreviewBox"></div>`;
  } else if (f.type === 'audio') { // 🎙 녹음 (value 는 이 기록의 id예요. 이미 붙어 있는 녹음을 보여주려고요)
    input = AudioStore.ok()
      ? `<input id="${id}" type="file" accept="${AUDIO_ACCEPT}" multiple class="sr-only" data-audio-input>
        <label class="audio-drop" for="${id}"><span>🎙 녹음 파일을 끌어다 놓거나, 눌러서 고르세요</span><small>${esc(AUDIO_HINT)} · 위에 적은 곡의 곡 노트에 함께 모여요</small></label>
        <div class="hint" id="audioNote"></div>
        <div class="audio-stage" id="audioStage"></div>
        <div class="rec-list" id="formAudioList" data-rec="${esc(v)}">${v ? audios.filter((a) => a.recId === v).sort(byOldest).map(audioRowHTML).join('') : ''}</div>`
      : '<div class="hint">이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.</div>';
  } else if (f.type === 'image') {
    input = `<input id="${id}" type="file" accept="image/*" class="sr-only">
      <label class="dropzone" id="dropZone" for="${id}"><span>🖼 여기에 그림을 끌어다 놓거나, 눌러서 고르세요</span>
        <small>컴퓨터에서는 Ctrl+V(붙여넣기)도 돼요 · 휴대폰은 카메라나 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote"></div>
      <div id="imgPreviewBox"></div>`;
  } else {
    const extra = f.type === 'number' ? ` min="${f.min ?? ''}" step="${f.step ?? 1}" inputmode="decimal"` : '';
    const sugg = f.suggest ? ` list="dl_${type}_${f.key}" autocomplete="off"` : '';
    input = `<input id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}"${extra}${sugg}${ph}>`;
  }
  const labelFor = f.type === 'choice' || f.type === 'chips' || f.type === 'audio' ? '' : ` for="${id}"`;
  return `<div class="field" data-only="${esc(f.only || '')}" data-key="${esc(f.key)}"><label${labelFor}>${esc(f.label)}${req}</label>${input}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
}

// 종류(연습/레슨, 요가/슬로조깅)에 맞지 않는 칸은 숨겨요. 보일 칸이 하나도 없으면 "더 적기" 상자도 숨겨요.
function syncKindFields(form) {
  const schema = SCHEMAS[form.dataset.type];
  if (!schema.kindKey) return;
  const kind = form.elements[schema.kindKey].value;
  form.querySelectorAll('.field[data-only]').forEach((el) => { el.hidden = !!el.dataset.only && el.dataset.only !== kind; });
  const more = form.querySelector('#moreBox');
  if (more) more.hidden = !more.querySelector('.field:not([hidden])');
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

// 레슨 기록을 만들 때 창 위쪽에 보여줄 "아직 안 물어본 것" 목록
function askBoxHTML() {
  const items = collectAsks();
  if (!items.length) return '';
  return `<div class="field ask-box" data-only="레슨" data-key="askBox"><label>🙋 레슨 때 물어보려던 것 <span class="meta">(물어봤으면 체크)</span></label>
    ${asksListHTML(items)}</div>`;
}

function openForm(type, existing, presetDate) {
  const schema = SCHEMAS[type];
  ui.backToDay = dlg.open && dlg.querySelector('.day-list') ? ui.dayOpen : null;
  const rec = existing ? { ...existing } : { date: presetDate || todayStr() };
  // 종류 칸이 없던 예전 바이올린 기록은 '연습'으로 봐요
  if (schema.kindKey && !rec[schema.kindKey]) rec[schema.kindKey] = schema.fields.find((f) => f.key === schema.kindKey).options[0];
  formImage = rec.image || null;
  formShots = Array.isArray(rec.shots) ? [...rec.shots] : [];
  staged = [];
  const valueFor = (f) => (f.type === 'audio' ? (existing ? existing.id : '') : rec[f.key]);
  const base = schema.fields.filter((f) => !f.more && !f.legacy);
  // 더 적기: 예전 칸(legacy)은 값이 들어 있을 때만 보여요
  const more = schema.fields.filter((f) => (f.more || f.legacy) && !(f.legacy && !hasValue(rec[f.key])));
  const moreOpen = !!existing && (more.some((f) => hasValue(rec[f.key])) || audios.some((a) => a.recId === existing.id)); // 수정할 때 내용이 있으면 펼친 채로
  const datalists = schema.fields.filter((f) => f.suggest)
    .map((f) => `<datalist id="dl_${type}_${f.key}">${suggestions(type, f.key).map((p) => `<option value="${esc(p)}">`).join('')}</datalist>`).join('');
  openDlg(`
    <h2>${esc(schema.label)} ${existing ? '수정' : '추가'}</h2>
    ${existing && existing.quick ? '<p class="hint" style="margin:-6px 0 12px">간단 기록이에요. 나머지 칸은 천천히 채워도 돼요. 꼭 써야 하는 칸까지 채워 저장하면 \'간단 기록\' 표시가 사라져요.</p>' : ''}
    <form id="recForm" novalidate>
      ${type === 'violin' && !existing ? askBoxHTML() : ''}
      ${base.map((f) => fieldHTML(f, valueFor(f), type)).join('')}
      ${more.length ? `<details class="more" id="moreBox"${moreOpen ? ' open' : ''}>
        <summary>✍ 더 적기 <span class="meta">(선택이에요)</span></summary>
        ${more.map((f) => fieldHTML(f, valueFor(f), type)).join('')}
      </details>` : ''}
      ${datalists}
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`, 'roomy');
  const form = dlg.querySelector('#recForm');
  form.dataset.type = type;
  form.dataset.id = existing ? existing.id : '';
  syncKindFields(form);
  updateImagePreview();
  const first = dlg.querySelector('input:not([type=file]):not([type=date]):not([type=hidden]), textarea');
  if (first && !existing) first.focus();
  formBase = formSnapshot();
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
  const moreBox = $('#moreBox');
  if (moreBox) moreBox.open = true; // 캡처를 붙이면 "더 적기"를 펼쳐서 보이게
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
    if (f.legacy && !form.elements[f.key]) continue; // 안 보였던 예전 칸은 손대지 않아요
    if (f.type === 'audio') continue; // 녹음은 기록 안에 저장하지 않고, 저장한 뒤 곡에 붙여요
    if (f.type === 'image') { data[f.key] = formImage || ''; continue; }
    if (f.type === 'images') { data[f.key] = [...formShots]; continue; }
    if (f.type === 'choice' || f.type === 'chips') { data[f.key] = readChoice(form, f); continue; } // 안 골랐으면 빈 값 (연습량은 숫자로 저장)
    if (f.type === 'lines') {
      data[f.key] = form.elements[f.key].value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, f.max || 99);
      continue;
    }
    if (f.type === 'tasks') {
      const prev = new Map((old && Array.isArray(old[f.key]) ? old[f.key] : []).map((t) => [t.text, !!t.done]));
      data[f.key] = form.elements[f.key].value.split('\n').map((l) => l.trim()).filter(Boolean)
        .map((text) => ({ text, done: prev.get(text) || false }));
      continue;
    }
    const raw = (form.elements[f.key].value || '').trim();
    if (f.required && !raw) {
      complete = false;
      if (!(relaxed && !old[f.key])) { err.textContent = `'${cleanLabel(f.label)}' 칸을 채워 주세요.`; form.elements[f.key].focus(); return; }
    }
    if (f.type === 'number') {
      if (raw === '') { data[f.key] = ''; continue; }
      const n = Number(raw);
      if (!Number.isFinite(n) || (f.min !== undefined && n < f.min)) { err.textContent = `'${cleanLabel(f.label)}' 칸에는 올바른 숫자를 써 주세요.`; form.elements[f.key].focus(); return; }
      data[f.key] = n;
    } else {
      data[f.key] = raw;
    }
  }
  const newAudio = type === 'violin' && kind === '연습' ? staged.length : 0;
  if (newAudio && !data.piece) { err.textContent = '녹음을 붙이려면 곡 이름을 먼저 적어 주세요.'; form.elements.piece.focus(); return; }
  if (schema.derive) Object.assign(data, schema.derive(data)); // 예: 돌아볼 날짜 계산
  const carry = [...HIDDEN_KEYS, 'stamp', ...(schema.keep || [])]; // 이 창에서 고치지 않는 칸은 그대로 보관
  const rec = {
    id: old ? old.id : newId(),
    type,
    createdAt: old ? old.createdAt : Date.now(),
    updatedAt: Date.now(),
    ...Object.fromEntries(carry.filter((k) => old && old[k] !== undefined).map((k) => [k, old[k]])),
    ...data,
  }; // 예시 표시(sample)는 직접 고치면 사라져요. 내 기록이 되었다는 뜻이에요.
  if (relaxed && !complete) rec.quick = true; // 아직 덜 채웠으면 '간단 기록' 표시 유지
  if (!old) assignStamp(rec); // 새 기록만 도장을 받아요 (고칠 때는 받은 도장이 그대로예요)
  if (!(await saveRecord(rec))) return;
  if (newAudio) await commitStaged(rec.piece, rec.id);
  afterSave();
  if (!old) afterNewRecord(rec);
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
      <div class="field" id="q_amountRow"><label>연습량 - 선택</label>${choiceHTML('amount', AMOUNTS, '')}</div>
      <div class="field"><label>하고 나서 기분 - 선택</label>${choiceHTML('mood', MOODS, '')}</div>
      <div class="field"><label for="q_memo">한 줄 메모${q.memoRequired ? ' <span class="req">*</span>' : ' - 선택'}</label><input id="q_memo" name="memo" type="text" maxlength="200"></div>
      <div class="error" id="formError" role="alert"></div>
      <div class="dlg-actions">
        <button type="button" class="btn ghost" data-act="closeDlg">취소</button>
        <button type="submit" class="btn">저장</button>
      </div>
    </form>`, 'roomy');
  syncQuick();
  $('#q_memo').focus();
  formBase = formSnapshot();
}

// 고른 종류에 맞게 연습량 칸을 보이거나 숨기고, 메모 칸 안내 글을 바꿔요
function syncQuick() {
  const form = $('#quickForm');
  if (!form) return;
  const k = QUICK[form.dataset.menu].kinds[form.elements.kind.value];
  $('#q_memo').placeholder = k.hint || '';
  $('#q_amountRow').hidden = !supportsAmount(k.type, k.data.kind);
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
  const amount = supportsAmount(k.type, k.data.kind) ? Number(form.elements.amount.value) : 0;
  if (amount) rec.amount = amount;
  if (form.elements.mood.value) rec.mood = form.elements.mood.value;
  assignStamp(rec);
  if (await saveRecord(rec)) { afterSave(); afterNewRecord(rec); }
}

/* ---------------------------------------------------------------------
   자동 저장 (내 컴퓨터의 파일에 저장)
   --------------------------------------------------------------------- */
const autosaveSupported = () => 'showSaveFilePicker' in window && Store.mode === 'indexeddb';

// 백업 파일의 모양은 그대로예요. 곡마다 첫 녹음이 있을 때만 audios 목록이 더해져요. (예전 파일에는 없어요)
async function backupPayload() {
  const payload = { app: 'my-journal', version: 1, exportedAt: new Date().toISOString(), records };
  const list = await audiosForBackup();
  if (list.length) payload.audios = list;
  return payload;
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
    await w.write(JSON.stringify(await backupPayload()));
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
        await importAudios(JSON.parse(text));
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
        <h3>🎉 도장과 축하 한 줄</h3>
        <p class="meta">새 기록을 저장하면 화면 아래에 도장과 짧은 한 마디가 잠깐 나타나요. 점수나 평가가 아니라, 남겼다는 사실만 알려줘요. 문구는 <b>app.js 맨 위의 STAMPS</b>에서 고칠 수 있어요. 예시 기록은 세지 않아요.</p>
        <label class="meta"><input type="checkbox" data-act="celebrate" ${settings.celebrateOff ? '' : 'checked'}> 새 기록을 저장할 때 도장·축하 한 줄 보이기</label>
      </div>
      <div class="card" style="margin:0">
        <h3>🎙 녹음</h3>
        ${AudioStore.ok() ? `<p class="meta">녹음은 곡마다 첫 녹음만 백업돼요. 나머지는 이 브라우저에만 저장돼서, 사이트 데이터를 지우면 사라져요.</p>
        <label class="meta"><input type="checkbox" data-act="audioSkip" ${settings.audioSkip ? 'checked' : ''}> 녹음은 백업에서 빼기 <span class="hint">(켜면 첫 녹음도 백업 파일·자동 저장 파일에 넣지 않아요)</span></label>
        <p class="meta audio-size" style="margin:8px 0 0">저장된 녹음 ${esc(fmtMB(audios.reduce((n, a) => n + (a.size || 0), 0)))}</p>` : '<p class="meta">이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.</p>'}
      </div>
      <div class="card" style="margin:0">
        <h3>🍂 계절 장식</h3>
        <p class="meta">달마다 위쪽 제목 옆과 화면 오른쪽 아래에 작은 그림이 바뀌어요. 그림은 <b>app.js 맨 위의 SEASON_DECOR</b>에서 고칠 수 있어요.</p>
        <label class="meta"><input type="checkbox" data-act="season" ${settings.seasonOff ? '' : 'checked'}> 계절 장식 보기</label>
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
  const payload = await backupPayload();
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
    const audioCount = Array.isArray(payload.audios) ? payload.audios.length : 0;
    if (!confirm(`기록 ${good.length}개${audioCount ? `와 녹음 ${audioCount}개` : ''}를 불러올까요?`)) return;
    await Store.putMany(good);
    records = await loadRecords();
    const addedAudio = await importAudios(payload); // 이 브라우저에 있던 녹음은 그대로 두고, 없던 것만 더해요
    closeDlg();
    render();
    alert(`${good.length}개를 불러왔어요.${addedAudio ? `\n녹음 ${addedAudio}개도 불러왔어요.` : ''}`);
  } catch (e) {
    alert('백업 파일을 읽지 못했어요. 이 사이트에서 만든 백업 파일이 맞는지 확인해 주세요.');
  }
}

/* ---------------------------------------------------------------------
   13. 클릭·입력 처리
   --------------------------------------------------------------------- */
document.addEventListener('click', async (e) => {
  // 바깥(어두운 부분)을 누르면 창 닫기 (입력 중인 창은 실수로 닫히지 않게 제외)
  if (e.target === dlg) { if (!dlg.querySelector('#recForm, #reviewForm')) closeDlg(); return; }

  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' && el.type === 'checkbox') return;
  const { act, id, type } = el.dataset;

  switch (act) {
    case 'tab':
      ui.tab = id; ui.query = '';
      ui.todayKey = null;
      render(); window.scrollTo(0, 0); break;
    case 'week': ui.weekOffset = el.dataset.d === '0' ? 0 : ui.weekOffset + Number(el.dataset.d); render(); break;
    case 'bodyFilter': ui.bodyFilter = id; render(); break;
    case 'econTab': ui.econTab = id; ui.query = ''; render(); break;
    case 'artView': ui.artView = id; render(); break;
    case 'artKind': ui.artKind = id; render(); break;
    case 'artArea': ui.artArea = id; render(); break;
    case 'add': openForm(type); break;
    case 'edit': openForm(type, records.find((r) => r.id === id)); break;
    case 'del': {
      const r = records.find((x) => x.id === id);
      const name = r ? (r.type === 'rest' ? '쉰 날' : (r.topic || r.piece || r.asset || r.kind || '이 기록')) : '이 기록';
      if (confirm(`'${name}' 기록을 지울까요?\n지운 기록은 되돌릴 수 없어요.`)) { await deleteRecord(id); render(); refreshDay(); }
      break;
    }
    case 'closeDlg':
      if (ui.backToDay && dlg.querySelector('#recForm, #reviewForm')) openDay(ui.backToDay); else closeDlg();
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
    case 'pick': { // 칩 버튼: 하나짜리는 다시 누르면 풀리고, 여러 개짜리는 눌러서 켜고 끄기
      const box = el.closest('.choice');
      const input = box.querySelector('input[type=hidden]');
      if (box.dataset.multi === '1') {
        el.classList.toggle('on');
        el.setAttribute('aria-pressed', String(el.classList.contains('on')));
        input.value = JSON.stringify([...box.querySelectorAll('.choice-btn.on')].map((b) => b.dataset.val));
      } else {
        const on = input.value !== el.dataset.val;
        input.value = on ? el.dataset.val : '';
        box.querySelectorAll('.choice-btn').forEach((b) => { b.classList.toggle('on', on && b === el); b.setAttribute('aria-pressed', String(on && b === el)); });
      }
      break;
    }
    case 'todayPick':
      if (ui.todayKey === el.dataset.key) { const f = $('#todayForm'); if (f) f.requestSubmit(); } // 한 번 더 누르면 저장
      else { ui.todayKey = el.dataset.key; render(); }
      break;
    case 'todayCancel': ui.todayKey = null; render(); break;
    case 'rest': await toggleRest(el.dataset.date, !dlg.open); break;
    case 'undoRest': hideToast(); await deleteRecord(id); render(); break;
    case 'toastEdit': { hideToast(); const r = records.find((x) => x.id === id); if (r) openForm(r.type, r); break; }
    case 'recap': openRecap(); break;
    case 'playRec': await toggleCardPlay(el.dataset.aid); break;
    case 'delAudio': await deleteRecording(el.dataset.aid); break;
    case 'unstage': staged = staged.filter((x) => x.sid !== el.dataset.sid); renderStaged(); break;
    case 'uploadStaged': {
      const box = dlg.querySelector('#pieceAudio');
      if (!box || !staged.length) break;
      const n = await commitStaged(box.dataset.piece, '');
      refreshAudioUI();
      if (n) toast(`녹음 ${n}개를 올렸어요.`, 2500);
      break;
    }
    case 'pieceDone': await togglePieceDone(el.dataset.piece); break;
    case 'board': openBoard(ui.calMonth || todayStr().slice(0, 7)); break;
    case 'boardShift': openBoard(shiftMonth(ui.boardMonth, Number(el.dataset.d))); break;
    case 'boardGo': goToStamp(id); break;
    case 'shelf': ui.bodyFilter = ui.bodyFilter === 'shelf' ? 'all' : 'shelf'; render(); break;
    case 'review': openReview(id); break;
    case 'goto': goToRecord(id); break;
    case 'piece': openPiece(el.dataset.piece); break;
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
      if (confirm(`정말 모든 기록을 지울까요? 되돌릴 수 없어요.${audios.length ? '\n곡에 붙여 둔 녹음도 함께 지워져요.' : ''}`)) {
        await Store.remove(records.map((r) => r.id));
        records = [];
        if (audios.length) { try { await AudioStore.clear(); } catch (err) { /* 괜찮아요 */ } audios = []; audioB64.clear(); }
        closeDlg(); render();
      }
      break;
    default: break;
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.id === 'recForm') { e.preventDefault(); submitForm(e.target); }
  else if (e.target.id === 'quickForm') { e.preventDefault(); submitQuick(e.target); }
  else if (e.target.id === 'todayForm') { e.preventDefault(); saveToday(e.target); }
  else if (e.target.id === 'reviewForm') { e.preventDefault(); saveReview(e.target); }
  else if (e.target.id === 'pieceMemoForm') { e.preventDefault(); savePieceMemo(e.target.dataset.piece, e.target.elements.memo.value.trim()); }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.act === 'task') { await toggleTask(t.dataset.id, t.dataset.key, Number(t.dataset.i), t.checked); }
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
  else if (t.matches('[data-audio-input]') && t.files.length) { const files = [...t.files]; t.value = ''; await stageAudioFiles(files); }
  else if (t.dataset.audioMemo) { await saveAudioMemo(t.dataset.audioMemo, t.value.trim()); }
  else if (t.dataset.act === 'audioSkip') { settings.audioSkip = t.checked; await saveSettings(); scheduleAutosave(); }
  else if (t.dataset.act === 'season') { settings.seasonOff = !t.checked; await saveSettings(); applySeason(); }
  else if (t.id === 'artMulti' && t.files.length) { const files = [...t.files]; t.value = ''; await addArtFromFiles(files); }
});

document.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.stage) { // 올리려는 녹음의 날짜·메모
    const s = staged.find((x) => x.sid === e.target.dataset.sid);
    if (s) s[e.target.dataset.stage] = e.target.value;
    return;
  }
  if (e.target.id === 'search') { ui.query = e.target.value; $('#listBox').innerHTML = econBodyHTML(); }
});

$('#settingsBtn').addEventListener('click', openSettings);

// 창이 닫히면(취소·Esc 포함) 안에 있던 입력 내용도 비워요
dlg.addEventListener('close', () => { revokeAudioUrls(dlg); dlg.innerHTML = ''; formImage = null; formShots = []; staged = []; formBase = ''; ui.dayOpen = null; ui.backToDay = null; });

/* ---------------------------------------------------------------------
   데스크톱 단축키: 입력 창에서 Cmd+Enter(Ctrl+Enter)로 저장, Esc로 닫기
   (뭔가 적어 둔 창을 Esc로 닫을 때는 한 번 물어봐요)
   --------------------------------------------------------------------- */
function requestClose() {
  if (!dlg.open) return;
  if (isFormDirty() && !confirm('적어 둔 내용이 있어요.\n저장하지 않고 닫을까요?')) return;
  if (ui.backToDay && dlg.querySelector('#recForm, #reviewForm')) openDay(ui.backToDay); else closeDlg();
}

document.addEventListener('keydown', (e) => {
  if (!dlg.open) return;
  if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) {
    const form = dlg.querySelector('#recForm, #quickForm, #reviewForm');
    if (form) { e.preventDefault(); form.requestSubmit(); }
  }
});
dlg.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); }); // 위에서 못 잡은 경우를 위한 예비

/* ---------------------------------------------------------------------
   14. 시작
   --------------------------------------------------------------------- */
async function loadRecords() {
  const all = await Store.all();
  const st = all.find((r) => r.id === '__meta_settings');
  const as = all.find((r) => r.id === '__meta_autosave');
  if (as && as.handle) { autosave.handle = as.handle; autosave.name = as.name || as.handle.name || ''; }
  if (st) settings = { lastBackupAt: st.lastBackupAt || null, snoozeUntil: st.snoozeUntil || null, celebrateOff: !!st.celebrateOff, audioSkip: !!st.audioSkip, seasonOff: !!st.seasonOff };
  seeded = all.some((r) => r.id === '__meta_seeded');
  return all.filter((r) => r.type !== 'meta').map(normalizeRecord);
}

async function start() {
  await Store.init();
  records = await loadRecords();
  await AudioStore.init();
  audios = (await AudioStore.all()).map(({ blob, ...meta }) => meta); // 녹음 파일은 재생할 때만 꺼내 와요
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
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && ui.tab === 'today' && !dlg.open && view.dataset.today && view.dataset.today !== todayStr()) render();
});

start().catch((err) => {
  view.innerHTML = `<div class="notice" style="max-width:none">시작하는 중 문제가 생겼어요: ${esc(err.message)}<br>크롬 같은 다른 브라우저로 열어 보세요.</div>`;
});
