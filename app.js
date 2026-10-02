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

// 🎨 그림 종류와 한 기록에 붙일 수 있는 사진 수
//   예전 기록의 "단계"는 종류로 읽어요: 그대로 모작·조금 바꿔 그리기 → 모작, 창작 → 창작, 값이 없으면 모작
const ART_KINDS = ['크로키', '모작', '창작'];
const ART_STAGE_TO_KIND = { '그대로 모작': '모작', '조금 바꿔 그리기': '모작', '창작': '창작' };
const ART_MAX_PHOTOS = 30;

/* ---------------------------------------------------------------------
   ✏️ 칩(눌러서 고르는 버튼) 선택지 - 메모장으로 고쳐도 돼요
   - 따옴표 안의 글자만 바꾸거나, 쉼표로 이어서 더하거나 빼세요. (따옴표와 쉼표는 지우지 마세요)
   - 이미 저장한 기록은 그대로 남아요. (예전에 고른 글자는 지워도 카드에 계속 보여요)
   --------------------------------------------------------------------- */
const CHIPS = {
  // 🎻 바이올린 (기본기 = 스케일·에튀드·개방현·포지션 이동을 모두 포함해요)
  violinDid: ['활', '기본기', '곡'],
};

// 🎻 교재 칩의 처음 목록이에요. 그 뒤로는 바이올린 기록 창의 "⚙︎ 교재 관리"에서 더하고·숨기고·순서를 바꿔요. (그 목록은 백업에 함께 들어가요)
const TEXTBOOKS_DEFAULT = ['스즈키 4권'];

/* ---------------------------------------------------------------------
   입력 칸 설정 (SCHEMAS)
   - 위에서부터 차례로 "기본 층"이에요. 항상 보이고, 이것만 채워도 저장돼요.
   - more: true 인 칸은 "✍ 더 적기" 접힘 영역 안에 들어가요. (새 기록에서는 접혀 있고, 수정할 때 내용이 있으면 펼쳐져요)
   - legacy: true 는 예전 칸이에요. 새 기록에서는 안 보이고, 값이 들어 있는 예전 기록을 고칠 때만 보여요. (카드에는 값이 있으면 계속 보여요)
   - only: 해당 종류일 때만 보이는 칸   placeholder: 회색 예시 문장   suggest: true 는 전에 쓴 값을 최근 순으로 제안
   - type: text / textarea / number / date / select / choice(버튼 하나) / chips(버튼 여러 개) / lines(한 줄에 하나) / tasks(체크 목록) / image / images
   - keep: 이 창에서 고치지 않아도 그대로 보관할 칸 (복기 창에서 적는 값 등)
   --------------------------------------------------------------------- */
// 🧘 운동 "한 줄" 칸의 회색 예시 문장 (종류별)
const WORKOUT_LINE_HINTS = { '요가': '예: 골반이 좀 풀렸다', '슬로조깅': '예: 바람이 시원했다' };
const AMOUNT_FIELD = { key: 'amount', label: '연습량 - 선택', type: 'choice', choices: AMOUNTS, hint: '시간 대신 느낌으로 골라요. 다시 누르면 선택이 풀려요.' };
const WORKOUT_AMOUNT_FIELD = { ...AMOUNT_FIELD, label: '운동량 - 선택' }; // 운동은 "운동량", 바이올린·그림은 "연습량"이에요
const MOOD_FIELD = { key: 'mood', label: '하고 나서 기분 - 선택', type: 'choice', choices: MOODS };

const SCHEMAS = {
  // 🧘 운동 기록 (요가 / 슬로조깅): 날짜 · 종류 · 거리 · 운동량 · 기분 · 한 줄, 이게 전부예요 ("더 적기"는 없어요)
  workout: {
    label: '운동 기록',
    kindKey: 'kind', // '종류'에 따라 보이는 칸이 달라져요
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['요가', '슬로조깅'], required: true },
      { key: 'distance', label: '거리 (km) - 선택', type: 'number', min: 0, step: 0.01, only: '슬로조깅', placeholder: '예: 3.2' },
      WORKOUT_AMOUNT_FIELD,
      MOOD_FIELD,
      // 한 줄 (예전 "한 줄 메모", "몸이 어땠나 한 줄", "달리며 든 생각 한 줄"이 모두 여기에 모여요). 종류마다 회색 예시 문장이 달라요
      { key: 'memo', label: '한 줄 - 선택', type: 'text', flat: true, placeholder: '예: 퇴근 후 짧게 했다', placeholderByKind: WORKOUT_LINE_HINTS },
    ],
  },
  // 🎻 바이올린 기록 (연습 / 레슨)
  violin: {
    label: '바이올린 기록',
    kindKey: 'kind',
    keep: ['stage'], // 예전에 고른 "이 곡 지금 어디쯤?"은 이 창에서 고치지 않아도 그대로 보관 (곡 노트에서 보여요)
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'kind', label: '종류', type: 'select', options: ['연습', '레슨'], required: true },
      { key: 'whatDid', label: '오늘 한 것 - 선택', type: 'chips', choices: CHIPS.violinDid, only: '연습', hint: '기본기 = 스케일·에튀드·개방현·포지션 이동' },
      // 교재 칩을 켜면 그 교재의 "곡 이름이나 번호" 한 줄 칸이 생겨요. 저장은 books: [{ name, piece }] (칩 순서). 하루에 기록 하나는 그대로예요.
      { key: 'books', label: '교재 - 선택', type: 'bookLines', manage: 'books', only: '연습' },
      { key: 'piece', label: '그 밖에 연습한 곡 - 선택', type: 'text', only: '연습', suggest: true, placeholder: '예: 비발디 a단조 1악장, 자이츠 협주곡 5번' },
      { ...AMOUNT_FIELD, only: '연습' },
      MOOD_FIELD,
      { key: 'feedback', label: '선생님 피드백', type: 'textarea', only: '레슨', placeholder: '예: 활을 줄에 수직으로 두는 연습을 더 하면 좋겠다고 하셨다' },
      { key: 'homework', label: '다음 레슨까지 과제', type: 'tasks', only: '레슨', hint: '한 줄에 과제 하나씩 적어 주세요. 체크는 목록에서 바로 할 수 있어요.', placeholder: '예: G장조 스케일 두 옥타브, 매일' },
      // ✍ 더 적기 (연습) - 잘 된 것을 가장 먼저
      { key: 'good', label: '오늘 잘 된 것 하나', type: 'text', only: '연습', more: true, placeholder: '예: 비브라토가 두 박 정도 고르게 됐다' },
      { key: 'next', label: '다음에 해볼 것 하나', type: 'textarea', rows: 2, only: '연습', more: true, placeholder: '예: 메트로놈 60에 비브라토 4박 느리게 두 번' },
      { key: 'ask', label: '레슨 때 물어볼 것', type: 'tasks', only: '연습', more: true, hint: '한 줄에 하나씩. 물어봤으면 바이올린 화면 위쪽의 레슨 패널에서 체크해요.', placeholder: '예: 비브라토할 때 손목은 어떻게 두는지' },
      { key: 'tempo', label: '템포 (BPM) - 선택', type: 'number', min: 1, step: 1, only: '연습', more: true, placeholder: '예: 60', hint: '메트로놈 숫자예요. 곡 이름을 누르면 템포 변화를 그래프로 볼 수 있어요. (적은 곡 모두에 기록돼요)' },
      { key: 'part', label: '연습한 부분', type: 'textarea', rows: 2, only: '연습', more: true, placeholder: '예: 1~8마디 운지, 활 다운-업' },
      { key: 'audio', label: '🎙 녹음', type: 'audio', only: '연습', more: true }, // 녹음 파일은 기록이 아니라 곡에 붙어서 따로 저장돼요
      { key: 'hard', label: '어려웠던 점 (예전 칸)', type: 'textarea', only: '연습', legacy: true, more: true },
      // ✍ 더 적기 (레슨)
      { key: 'praise', label: '선생님이 좋다고 한 것', type: 'text', only: '레슨', more: true, placeholder: '예: 활 쓰는 자세가 안정적이라고 하셨다' },
      { key: 'newLearn', label: '새로 배운 것 한 줄', type: 'text', only: '레슨', more: true, placeholder: '예: 자리를 옮길 때 팔꿈치를 먼저 움직인다' },
    ],
  },
  // ✅ 오늘의 경제 루틴: 하루에 기록 하나. 입력 창 없이 경제 화면에서 바로 체크해요.
  //   checks: { 항목id: true } (한 것만) / letters: 읽은 뉴스레터 / note: 오늘 한 줄
  econRoutine: {
    label: '경제 루틴',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
    ],
  },
  // 🎨 그림 기록 (사진 여러 장 = 기록 하나. 종류는 크로키 / 모작 / 창작)
  //   예전 칸(image·stage·origin·diff·carry·nextChips·course·refs)은 화면에서 입력 칸으로는 없지만 지우지 않고 보관해요. (상세 창 맨 아래 "예전 메모"로 읽기만 해요)
  art: {
    label: '그림 기록',
    kindKey: 'artKind', // 종류에 따라 "원본 사진" 칸이 보이거나 숨겨져요
    keep: ['stage', 'origin', 'diff', 'carry', 'nextChips', 'course', 'refs', 'mood', 'srcImage'], // 예전 칸과, 이 창에서 안 고치는 값은 그대로 보관해요
    fields: [
      { key: 'images', label: '사진', type: 'images', noun: '그림 사진', max: ART_MAX_PHOTOS, hint: '여러 장을 한 번에 올리면 기록 하나로 묶여요. ◀ ▶ 로 순서를 바꾸고, 빼기로 한 장씩 뺄 수 있어요.' },
      { key: 'artKind', label: '종류', type: 'choice', choices: ART_KINDS },
      AMOUNT_FIELD,
      { key: 'topic', label: '한 줄 - 선택', type: 'text', placeholder: '예: 손 크로키 1분씩' },
      { key: 'date', label: '날짜', type: 'date', required: true, small: true },
      // ✍ 더 적기
      { key: 'srcImage', label: '원본 사진', type: 'image', noun: '원본 그림', optional: true, only: '모작', more: true, hint: '모작이면 원본을 같이 올려 두세요. 상세 창에서 "원본 | 내 그림"으로 나란히 보여요.' },
      { key: 'liked', label: '마음에 드는 곳 하나', type: 'text', more: true, placeholder: '예: 머리카락 흐름' },
      { key: 'next', label: '다음에 해볼 것 하나', type: 'text', more: true, placeholder: '예: 표정만 웃는 얼굴로 바꿔 보기' },
      { key: 'image', label: '내 그림 (예전 칸)', type: 'image', hidden: true }, // 예전에 한 장만 넣던 칸. 동기화가 이미지를 올릴 수 있도록 남겨 두고, 화면에는 나오지 않아요.
    ],
  },
  // 📰 영어 기사 (주 1회, 읽고 세 줄로 정리해요)
  englishArticle: {
    label: '영어 기사',
    fields: [
      { key: 'date', label: '날짜', type: 'date', required: true },
      { key: 'link', label: '기사 링크 - 선택', type: 'text', placeholder: '붙여 넣으면 도메인(예: theguardian.com)이 카드에 나와요' },
      { key: 'title', label: '기사 제목 - 선택', type: 'text', placeholder: '예: Why prices keep rising' },
      { key: 'sum', label: '요약 3줄 - 선택', type: 'multi', keys: ['sum1', 'sum2', 'sum3'], placeholders: ['1. What happened', '2. Why it matters', "3. What's next / my takeaway"], hint: '영어로 한두 줄만 써도 저장돼요.' },
      // ✍ 더 적기
      { key: 'phrases', label: '가져갈 표현 (최대 3개)', type: 'lines', max: 3, rows: 3, more: true, hint: '한 줄에 하나씩, 최대 3개까지예요.', placeholder: '예: crack down on' },
      { key: 'thought', label: '내 생각 한 줄', type: 'text', more: true, placeholder: '영어로 써도, 한국어로 써도 돼요' },
      { key: 'speak', label: '말해 볼 주제로 표시', type: 'check', more: true },
    ],
  },
  // 💬 클로드에게 받은 피드백: scope('violin'|'exercise'|'econ'|'english'|'drawing') / period('day'|'week'|'month'|'card') / rangeStart·rangeEnd / targetId(카드에서 보낸 기록) / question / text(붙여 넣은 답변) / todo(해볼 것 한 줄) / todoDone / todoHidden
  claudeFeedback: {
    label: '클로드 피드백',
    fields: [
      { key: 'date', label: '받은 날짜', type: 'date' },
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
  // ⚙︎ 설정 값 (교재 목록·클로드 요청 문구처럼 백업에 함께 들어가야 하는 작은 설정. 화면에는 나타나지 않아요)
  config: {
    label: '설정 값',
    fields: [
      { key: 'date', label: '날짜', type: 'date' },
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
  { id: 'cal', label: '📅 캘린더' },
  { id: 'violin', label: '🎻 바이올린' },
  { id: 'exercise', label: '🧘 운동' },
  { id: 'econ', label: '📚 경제 루틴' },
  { id: 'english', label: '📰 영어' },
];
// 🎈 놀이터: 그림이 사는 곳이에요. 메인 메뉴에는 없고, ⚙ 백업·설정 안의 "놀이터" 칸으로 들어가요. (그리고 싶은 날 놀러 가는 곳이라, 안 그리는 날엔 눈에 안 띄어요)
//   이름은 여기서 바꿀 수 있어요. (예: '가끔', '낙서장')
const PLAYGROUND = { id: 'art', icon: '🎈', name: '놀이터' };
const HIDDEN_TABS = [PLAYGROUND.id]; // 메뉴에는 없지만 열 수 있는 화면

// 빈 화면 문구: "다음에 뭘 하면 되는지"만 알려 줘요. (평가나 재촉하는 말은 넣지 않아요. 여기서 고치면 모든 화면에 반영돼요)
const EMPTY_TEXT = {
  feedback: '아직 받은 피드백이 없어요. 캘린더의 🤖 클로드에게 보내기로 시작해 보세요.', // 💬 피드백 모음 (모든 영역)
  violin: '아직 기록이 없어요. 위의 + 바이올린 기록으로 오늘 연습을 남겨 보세요. 10분도 괜찮아요.',
  shelf: '곡 이름을 적은 기록이 생기면 여기에 책처럼 꽂혀요.',
  workout: '아직 기록이 없어요. 위의 + 운동 기록으로 남겨 보세요.',
  english: '이번 주 기사 하나를 올려 보세요. 세 줄이면 돼요.',
  phrases: '기사 요약에 가져갈 표현을 적으면 여기에 모여요.',
  speak: '말해 볼 주제로 표시한 기사가 여기에 모여요.',
  pastNotes: '저장한 한 줄이 여기에 쌓여요.', // 경제 루틴 "지난 한 줄 보기"
};
// 🌱 "지금까지 쌓인 기록" 카드는 첫 기록으로부터 이만큼 날이 지난 뒤에 숫자를 보여 줘요. (그전에는 "이제 시작했어요"만)
const TOTALS_AFTER_DAYS = 10;

// 캘린더가 시작되는 달 (이 달부터 앞으로 계속 이어져요)
const CALENDAR_START = '2026-01';

// 도장: 기록을 저장하면 이 중에서 하나가 랜덤으로 나타나요. 앞의 그림이 도장, 뒤가 한 마디예요.
//   문구는 마음대로 고치거나 더해도 돼요. (평가나 비교하는 말은 넣지 않아요)
//   workout / practice(바이올린 연습) / lesson / routine(경제 루틴) / english(영어) / art / rest : 종류별 문구
//   general : 위에 없는 종류일 때, night : 밤에 저장했을 때(NIGHT_START시 ~ 다음 날 NIGHT_END시)
const STAMPS = {
  general: ['🌱 한 칸 남겼어요', '📌 도장 꾹!', '🍀 오늘의 기록 완료', '☕ 잠깐 숨 돌리기', '✨ 꾹, 도장', '📓 기록장에 한 줄', '🌱 남겨 뒀어요'],
  workout: ['🧘 오늘도 몸을 움직였다', '🌿 몸을 한번 풀었다', '🍃 숨을 크게 쉬었다', '☀️ 몸이 기억해요', '🧘 몸을 챙긴 하루', '🏃 한 걸음 남겼어요', '🌿 숨 한 번 크게'],
  practice: ['🎻 오늘도 켰다', '🎼 활을 잡았다', '🎶 소리를 냈다', '🎼 한 소절 남겼어요', '🎻 활이 지나간 자리'],
  lesson: ['🎓 레슨 기록 완료', '📝 배운 것을 적어 뒀다', '🎼 선생님 말씀을 남겼다'],
  english: ['📰 기사 하나 읽었어요', '✍ 세 줄로 정리했어요', '🔤 표현 하나 챙겼어요', '☕ 영어 한 줄 남겼어요'],
  routine: ['🎧 귀로 한 줄 배웠어요', '📮 한 통 읽었어요', '📰 오늘의 경제 한 칸', '✅ 루틴 한 칸', '☕ 가볍게 체크', '💡 흐름 하나 잡았어요'],
  art: ['🎨 오늘도 그렸다', '✏️ 선을 그었다', '🖌️ 손이 움직였다', '🎨 한 장 남겼어요', '✏️ 선 하나 더', '🖌 오늘의 그림 도장'],
  rest: ['😴 쉬는 것도 기록이에요', '🛋️ 충전하는 날', '🍵 푹 쉬었다', '😴 쉬는 날도 기록', '🛋 푹 쉬어요', '🌿 오늘은 쉬어 가기'],
  night: ['🌙 늦은 밤 수고했어요', '⭐ 하루 마무리 도장 꾹', '🌃 밤에도 남겼어요', '🛌 이제 쉬어도 돼요', '🌙 오늘 하루도 여기까지', '⭐ 이제 푹 쉬어요', '🌙 밤의 기록 한 줄'],
};
const NIGHT_START = 22; // 밤 10시부터
const NIGHT_END = 5;    // 새벽 5시 전까지는 밤 문구를 써요

// "그때의 나": 캘린더 아래에, 몇 달 전 오늘의 기록이 있으면 하나만 보여줘요. (위에서부터 먼저 있는 것 하나)
const MEMORY_LOOKBACKS = [{ months: 1, label: '한 달 전' }, { months: 3, label: '석 달 전' }, { months: 12, label: '1년 전' }];

// 백업 알림: 며칠이 지나면 알려줄지, '나중에'를 누르면 며칠 동안 숨길지
const BACKUP_REMIND_DAYS = 14;
const BACKUP_SNOOZE_DAYS = 3;

// 사진을 저장할 때 긴 변의 최대 크기(픽셀). 커질수록 선명하지만 저장 공간을 더 써요.
const IMAGE_MAX_SIZE = 1600;

// ✅ 오늘의 경제 루틴 (경제 화면의 체크 목록)
//   id: 저장되는 이름 (한 번 정하면 바꾸지 마세요)  icon: 그림  label: 화면에 보이는 이름  chips: 읽은 것을 눌러 표시하는 칩 (있으면 체크 옆에 나타나요)
//   항목을 더하거나 빼도 예전 기록은 그대로예요. (목록에 없는 id는 화면에서 조용히 무시돼요)
const ECON_ROUTINES = [
  { id: 'podcast', icon: '🎧', label: '경제 팟캐스트 듣기' },
  { id: 'newsletter', icon: '📮', label: '뉴스레터 읽기', chips: ['잘쓸레터', '머니레터'] },
];

// 🎙 녹음: 한 곡에 붙일 수 있는 개수, 한 파일의 최대 길이(초)와 크기(바이트)
//   곡마다 처음 올린 녹음("🌱 첫 녹음")은 항상 보관되고 백업 파일에도 들어가요. 나머지는 이 브라우저 안에만 저장돼요.
const AUDIO_MAX_PER_PIECE = 5;
const AUDIO_MAX_SECONDS = 300;              // 5분
const AUDIO_MAX_BYTES = 15 * 1024 * 1024;   // 15MB

// 🍂 계절 장식: 달마다 위쪽 제목 옆과 화면 오른쪽 아래 모서리에 이모지 하나가 나타나요. (1월부터 12월 순서. 마음대로 바꿔도 돼요)
const SEASON_DECOR = ['⛄', '🧣', '🌱', '🌸', '🌿', '☔', '🍉', '🌻', '🌾', '🍂', '🍁', '❄️'];

// 🤖 클로드에게 보내기: 범위마다 "내 정보"와 "요청 문구"의 처음 값이에요. (화면의 "✎ 내 정보·요청 문구"에서 고치면 그 값이 우선이고, 백업에도 들어가요)
//   복사되는 글 순서: 내 정보 → 요청 문구 + 공통 문장 → 이번에 특히 물어볼 것 → 지난번 받은 제안 → 기록 본문 → 요약 한 줄
const CLAUDE_SCOPES = [
  { id: 'violin', icon: '🎻', label: '바이올린',
    info: '바이올린 취미 4년차(메인 취미). 스즈키 4권 수준. 지금 비브라토 배우는 중. 쉬었다 하다를 반복해서 기본기가 얕고 연습량도 많지 않음. 평일은 밤늦게 짧게 연습하는 편.',
    request: '아래 기록을 보고 부담 없는 다음 연습을 제안해 줘.' },
  { id: 'exercise', icon: '🧘', label: '운동',
    info: '요가와 슬로조깅을 가볍게 하는 중. 평일은 밤늦게 일이 끝남.',
    request: '아래 기록을 보고 무리 없는 다음 루틴을 제안해 줘.' },
  { id: 'econ', icon: '📚', label: '경제 루틴',
    info: '경제 공부 입문 중. 경제 팟캐스트와 뉴스레터(잘쓸레터, 머니레터)로 루틴을 만드는 중.',
    request: '아래 기록과 한 줄 메모를 보고 이번 흐름을 쉽게 정리해 주고, 다음에 눈여겨볼 것 하나를 알려 줘.' },
  { id: 'english', icon: '📰', label: '영어',
    info: '영어 강사라 영어는 능숙한 편. 주 1회 기사를 읽고 3줄 요약으로 감을 유지하는 중.',
    request: '요약을 더 자연스럽고 간결하게 고쳐 주고 바꾼 이유를 짧게 알려 줘. 가져갈 표현은 예문을 하나씩 만들어 줘. 기사를 직접 확인할 수 있으면 요약 내용이 맞는지도 봐 줘.' },
  { id: 'drawing', icon: '🎨', label: '그림',
    info: '그림은 사이드 취미. 이제 크로키부터 주 1~2회 그리려고 함. 모작 위주였고, 창작할 실력을 키우는 게 목표.',
    request: '원본과 내 그림(첨부)을 비교해서 다음에 연습할 것을 알려 줘.' },
];
// 모든 범위의 요청 문구 끝에 자동으로 붙는 공통 문장
const CLAUDE_COMMON = '제안은 3개 이내로, 가장 중요한 것 하나를 맨 앞에 써 줘. 밤에 읽기 편하게 짧게.';
// 받은 피드백을 저장했을 때 나타나는 도장 문구 (앞의 그림이 도장, 뒤가 한 마디예요)
const FEEDBACK_STAMPS = ['💬 피드백 저장했어요', '🌱 해볼 것 하나 남겼어요', '📌 피드백 도장 꾹', '✨ 다음에 써먹을 한 줄 저장'];


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
  return `<div class="label">${esc(label)}</div><p class="pre links">${html}</p>`;
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

  // 다른 사이트와 같은 주소(예: 내아이디.github.io)를 쓰더라도 섞이지 않도록 이름에 앱 이름을 넣어요. (예전 이름 'journal.records'는 읽어서 옮겨요)
  _lsRead() {
    try {
      const cur = localStorage.getItem('my-journal.records');
      return JSON.parse(cur !== null ? cur : (localStorage.getItem('journal.records') || '[]'));
    } catch (e) { return []; }
  },
  _lsWrite(list) { localStorage.setItem('my-journal.records', JSON.stringify(list)); try { localStorage.removeItem('journal.records'); } catch (e) { /* 괜찮아요 */ } },
  _mem: [],

  async all() {
    if (this.mode === 'indexeddb') return this._tx('readonly', (s) => s.getAll());
    return this.mode === 'localstorage' ? this._lsRead() : this._mem.slice();
  },
  async get(id) { // 한 줄만 꺼내요 (동기화 정보 같은 작은 것용)
    if (this.mode === 'indexeddb') return this._tx('readonly', (s) => s.get(id));
    return (this.mode === 'localstorage' ? this._lsRead() : this._mem).find((r) => r.id === id);
  },
  async putMany(list, opts = {}) {
    await this._putMany(list);
    if (list.some((r) => r.type !== 'meta')) { // 설정 저장만으로는 자동 저장·동기화를 하지 않아요
      scheduleAutosave();
      if (!opts.silent && window.Sync) window.Sync.notify(); // ☁ 동기화(sync.js). silent 는 동기화가 가져온 것을 쓸 때예요
    }
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
  // 한 줄을 읽고 고치는 일을 한 번에 해요. (☁ 동기화와 화면이 같은 녹음을 동시에 고쳐도 서로 덮어쓰지 않게요)
  //   fn(옛 줄 또는 undefined) → 새 줄 / null 이면 지워요 / undefined 면 그대로 둬요. fn 은 바로 끝나는 함수여야 해요.
  update(id, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('audio', 'readwrite');
      const store = tx.objectStore('audio');
      let result;
      const req = store.get(id);
      req.onsuccess = () => {
        result = fn(req.result);
        if (result === null) store.delete(id); else if (result !== undefined) store.put(result);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('aborted'));
    });
  },
};

/* ---------------------------------------------------------------------
   4. 앱 상태
   --------------------------------------------------------------------- */
let records = [];   // 전체 기록 (메모리에 복사해 두고 화면에 사용)
let audios = [];    // 녹음 정보 (파일 자체는 빼고 이름·날짜·메모만. 파일은 재생할 때 꺼내 와요)
//   local: 이 기기에 파일이 있나 (☁ 로 다른 기기에서 정보만 받은 녹음은 false 예요) · rf: Drive에 올라간 파일의 id · updatedAt: 바꾼 시각
let audioTombs = []; // 지운 녹음의 "삭제 표시" (☁ 동기화용. 기록의 삭제 표시와 같은 방식으로 60일 남아요)
let seeded = false; // 예시 기록을 이미 한 번 넣었는지
// 마지막 백업 날짜, 알림 미루기, 축하 한 줄 끄기, 녹음을 백업에서 빼기, 계절 장식 끄기, 업데이트 정리를 이미 했는지(cleanupV2 · cleanupV3 · artKindV1 · workoutLiteV1 · quickFlagV1),
// 캘린더 아래 '🤖 클로드에게 보내기'를 펼쳐 두었는지(claudeBoxOpen, 이 기기에서만 기억해요)
let settings = { lastBackupAt: null, snoozeUntil: null, celebrateOff: false, audioSkip: false, seasonOff: false, cleanupV2: false, cleanupV3: false, artKindV1: false, workoutLiteV1: false, quickFlagV1: false, booksV1: false, claudeBoxOpen: false };
// 자동 저장: 내 컴퓨터의 파일 하나에 기록이 바뀔 때마다 저장해요 (크롬·엣지 컴퓨터 버전)
//   status: 'off' 꺼짐 / 'on' 켜짐 / 'paused' 브라우저를 다시 열어 한 번 연결이 필요함
const autosave = { handle: null, name: '', status: 'off', lastSavedAt: null };
let autosaveTimer = null;

const ui = {
  tab: 'cal',         // 처음 열면 캘린더 (이번 달)
  // 영역 화면의 칩 (다른 메뉴에서 들어올 때마다 첫 칩으로 돌아가요: 📖 기록 · ✅ 오늘 루틴 · 📖 기사)
  exView: 'records',  // 운동: records | feedback
  vnView: 'records',  // 바이올린: records | shelf | feedback
  econView: 'routine', // 경제 루틴: routine | feedback
  enView: 'list',     // 영어: list | phrases | speak | feedback
  noteDraft: null,    // 경제 루틴 "오늘 한 줄"에 쓰는 중이지만 아직 저장하지 않은 글 { date, text }
  noteSavedUntil: 0,  // 한 줄을 저장한 직후 "저장됨 ✓"를 보여 주는 시각
  claudePeriod: 'day', // 🤖 클로드에게 보내기: 기간 day | week | month
  claudeScope: 'violin', // 범위 violin | exercise | econ | english
  claudeQuestion: {}, // 범위마다 "이번에 특히 물어볼 것" (피드백을 저장하면 비워져요)
  claudePending: null, // 복사한 뒤 피드백을 붙여 넣을 때 쓰는 기간·범위
  cardFbOpen: new Set(), // 🤖 를 눌러 피드백 입력 칸을 펼쳐 둔 카드
  cardFbShown: new Set(), // 💬 N 을 눌러 피드백을 펼쳐 둔 카드
  fbOpenText: new Set(), // 답변 "더 보기"를 펼쳐 둔 피드백
  query: '',
  artView: 'gallery', // gallery | feedback
  artOpen: null,      // 상세 창으로 열어 둔 그림 기록
  artPhoto: 0,        // 상세 창에서 보고 있는 사진 번호
  calMonth: null,       // 캘린더에서 보고 있는 달 (예: '2026-09')
  calHidden: new Set(), // 캘린더에서 잠시 숨긴 종류
  dayOpen: null,        // 캘린더에서 열어 둔 날짜
  backToDay: null,      // 입력 창을 닫고 돌아갈 날짜
};
const ofType = (type) => records.filter((r) => r.type === type);

/* ---------------------------------------------------------------------
   5. 기록 저장/수정/삭제
   --------------------------------------------------------------------- */
// 기록을 저장해요. 바꾼 시각(updatedAt)은 여기서 항상 새로 정해요. (☁ 동기화가 "어느 쪽이 바뀌었나"를 알아보는 기준이에요)
async function saveRecord(rec) {
  const i = records.findIndex((r) => r.id === rec.id);
  const prev = i >= 0 ? records[i].updatedAt || 0 : 0;
  rec.updatedAt = Math.max(Date.now(), prev + 1);
  try {
    await Store.putMany([rec]);
  } catch (err) {
    alert('저장하지 못했어요. 저장 공간이 부족할 수 있어요. (그림 파일이 너무 크지 않은지 확인해 주세요.)');
    return false;
  }
  if (i >= 0) records[i] = rec; else records.push(rec);
  if (tombstones.length) tombstones = tombstones.filter((t) => t.id !== rec.id); // 지웠던 흔적 위에 다시 저장한 경우
  return true;
}

/* 지운 기록의 흔적("삭제 표시"). 지운 기록은 저장소에서 없애지 않고, 같은 id 자리에 이 작은 표시만 남겨요.
   ☁ 동기화에서 "지운 것"과 "아직 못 받은 것"을 구분하려고요. 화면과 백업 파일에는 나타나지 않고, 60일 뒤 정리돼요. */
let tombstones = [];
const isTomb = (r) => !!(r && r.deletedAt);
function makeTomb(r) {
  const at = Math.max(Date.now(), (r.updatedAt || 0) + 1);
  return { id: r.id, type: r.type, date: r.date, deletedAt: at, updatedAt: at };
}
const isSyncedRecord = (r) => !!r && !r.sample && !!SCHEMAS[r.type];

async function deleteRecord(id) {
  const old = records.find((r) => r.id === id);
  if (old && isSyncedRecord(old)) {
    const t = makeTomb(old);
    await Store.putMany([t]); // 같은 id 자리를 삭제 표시로 바꿔요
    tombstones = [...tombstones.filter((x) => x.id !== id), t];
  } else {
    await Store.remove([id]); // 예시 기록처럼 동기화하지 않는 것은 흔적 없이 지워요
  }
  records = records.filter((r) => r.id !== id);
}

// ☁ 동기화가 가져온 변경을 저장소와 화면에 반영해요. put: 기록, tombs: 삭제 표시, drop: 흔적 없이 지울 id
async function applySyncChanges({ put = [], tombs = [], drop = [] }) {
  const rows = [...put, ...tombs];
  if (rows.length) await Store.putMany(rows, { silent: true });
  if (drop.length) await Store.remove(drop);
  const ids = new Set([...put.map((r) => r.id), ...tombs.map((r) => r.id), ...drop]);
  records = records.filter((r) => !ids.has(r.id)).concat(put);
  tombstones = tombstones.filter((t) => !ids.has(t.id)).concat(tombs);
}

// 입력 중이면 잠깐 미뤘다가 그려요 (동기화가 가져온 변경 때문에 쓰던 글이 사라지지 않게)
let renderDeferred = false;
const typingInView = () => { const a = document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !!view.contains(a); };
function renderSoon() {
  if (typingInView()) { renderDeferred = true; return; }
  render();
  refreshDay();
}
document.addEventListener('focusout', () => {
  if (!renderDeferred) return;
  setTimeout(() => { if (renderDeferred && !typingInView()) { renderDeferred = false; render(); refreshDay(); } }, 250);
});

/* ---------------------------------------------------------------------
   6. 예시 기록 (처음 한 번만 들어가요. ⚙ 백업·설정 에서 한 번에 지울 수 있어요)
   --------------------------------------------------------------------- */
function svgUrl(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fbf8f0"/>${inner}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const SAMPLE_IMAGES = {
  shaded: svgUrl('<defs><radialGradient id="g" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#f4efe4"/><stop offset="1" stop-color="#6b6558"/></radialGradient></defs><ellipse cx="170" cy="225" rx="80" ry="14" fill="#d9d2c2"/><circle cx="140" cy="150" r="70" fill="url(#g)" stroke="#555" stroke-width="2"/><rect x="230" y="100" width="100" height="100" fill="#e6dfd0" stroke="#555" stroke-width="2"/><text x="20" y="284" font-size="14" fill="#999">예시 그림 (명암 연습)</text>'),
  color: svgUrl('<defs><radialGradient id="g" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#b5683a"/></radialGradient></defs><ellipse cx="200" cy="235" rx="120" ry="16" fill="#e3d6c0"/><circle cx="200" cy="150" r="80" fill="url(#g)" stroke="#7a4a2a" stroke-width="2"/><text x="20" y="284" font-size="14" fill="#999">예시 그림 (색 넣기)</text>'),
};

function buildSamples() {
  const t = todayStr();
  const d = (n) => addDays(t, -n);
  const now = Date.now();
  let seq = 0;
  const mk = (type, date, data) => ({ id: newId(), type, date, sample: true, createdAt: now + (seq++), updatedAt: now, ...data });
  const artA = mk('art', d(8), { stamp: '🎨', artKind: '모작', images: [SAMPLE_IMAGES.shaded], srcImage: SAMPLE_IMAGES.color, amount: 2, topic: '명암 연습', liked: '그림자 경계가 부드럽게 나왔다', next: '표정만 웃는 얼굴로 바꿔 보기 (예시 기록)' });
  return [
    // 🧘 운동
    mk('workout', d(1), { stamp: '🍃', kind: '요가', amount: 2, mood: 'good', memo: '아침에 스트레칭 위주로 했다. 어깨가 한결 가벼워졌다. (예시 기록)' }),
    mk('workout', d(2), { stamp: '🏃', kind: '슬로조깅', amount: 1, mood: 'ok', distance: 3.1, memo: '바람이 시원해서 발이 가벼웠다. 대화할 수 있는 속도로 천천히. (예시 기록)' }),
    mk('workout', d(4), { stamp: '🌿', kind: '요가', amount: 1, mood: 'tired', memo: '피곤해서 가볍게만 했다. (예시 기록)' }),
    mk('workout', d(8), { kind: '슬로조깅', distance: 3.6, memo: '' }),
    mk('workout', d(9), { kind: '요가', memo: '' }),
    mk('workout', d(3), { kind: '요가', amount: 1, memo: '퇴근 후 짧게 (예시 기록)' }),
    mk('rest', d(7), { stamp: '😴', memo: '야근한 날. 푹 잤다. (예시 기록)' }),
    // 🎻 바이올린
    mk('violin', d(1), { stamp: '🎶', kind: '연습', amount: 3, mood: 'good', tempo: 60, whatDid: ['기본기', '곡'], books: [{ name: '스즈키 4권', piece: '비발디 a단조 1악장' }], good: '비브라토가 두 박 정도 고르게 됐다', part: '1~8마디 운지', stage: '천천히 치는 중', ask: [{ text: '비브라토할 때 손목은 어떻게 두는지', done: false }, { text: '활을 줄에서 떼는 타이밍', done: false }], next: '메트로놈 60에 비브라토 4박 느리게 두 번 (예시 기록)' }),
    mk('violin', d(3), { stamp: '🎼', kind: '연습', amount: 2, tempo: 52, whatDid: ['활'], books: [{ name: '스즈키 4권', piece: '비발디 a단조 1악장' }], good: '활이 줄에 수직으로 유지되는 순간이 늘었다', part: '활 쓰는 법(다운-업)', stage: '악보 익히는 중', next: '활을 줄에 수직으로 유지하기' }),
    mk('violin', d(9), { kind: '연습', tempo: 76, whatDid: ['곡'], books: [{ name: '스즈키 4권', piece: '자이츠 협주곡 5번' }], stage: '원래 템포 가까이', part: '1악장 앞부분', next: '천천히 박자 세며 치기' }),
    mk('violin', d(6), { kind: '연습', amount: 2, mood: 'ok', tempo: 48, whatDid: ['기본기', '곡'], books: [{ name: '스즈키 4권', piece: '비발디 a단조 1악장' }], part: '9~16마디', stage: '천천히 치는 중', hard: '느린 템포에서도 손가락이 꼬였다.', next: '천천히 정확하게' }),
    mk('violin', d(5), { stamp: '🎓', kind: '레슨', mood: 'good', feedback: '활을 줄에 수직으로 두는 연습을 더 하면 좋겠어요. 음정은 지난주보다 안정적이에요. (예시 기록)', praise: '음정이 지난주보다 안정적이라고 하셨다', newLearn: '자리를 옮길 때 팔꿈치를 먼저 움직인다', homework: [{ text: '스케일 G장조 두 옥타브, 매일', done: true }, { text: '비발디 1~16마디 메트로놈 60', done: false }, { text: '빈 줄 연습', done: false }] }),
    mk('violin', monthsAgo(t, 1), { kind: '연습', amount: 2, mood: 'good', whatDid: ['곡'], books: [{ name: '스즈키 4권', piece: '자이츠 협주곡 5번' }], part: '처음으로 1악장을 끝까지 이어서 켜 봤다. (한 달 전 예시 기록)' }),
    mk('piecenote', d(1), { piece: '비발디 a단조 1악장', memo: '5마디부터 멜로디가 올라가는 부분이 제일 좋다 (예시)' }),
    // 📚 레퍼토리 책장 예시: 비발디는 책상 위(연습 중), 자이츠 5번은 책장(마무리)
    mk('piecenote', d(2), { piece: '자이츠 협주곡 5번', memo: '', status: 'done', doneAt: d(2) }),
    // ✅ 경제 루틴 (며칠치. 오늘은 비워 두었으니 직접 체크해 보세요)
    mk('econRoutine', d(1), { stamp: '📮', checks: { podcast: true, newsletter: true }, letters: ['잘쓸레터'], note: '환율이 올라 수입 물가가 걱정된다는 얘기 (예시)' }),
    mk('econRoutine', d(2), { checks: { podcast: true }, letters: [], note: '' }),
    mk('econRoutine', d(3), { stamp: '💡', checks: { newsletter: true }, letters: ['머니레터'], note: '금리를 내리면 대출 이자 부담이 줄어든다고 한다 (예시)' }),
    mk('econRoutine', d(5), { checks: { podcast: true, newsletter: true }, letters: ['잘쓸레터', '머니레터'], note: '물가가 오를 때 금리를 왜 올리는지 조금 이해됐다 (예시)' }),
    mk('econRoutine', d(6), { checks: { podcast: true }, letters: [], note: '' }),
    // 📰 영어 (기사 하나)
    mk('englishArticle', d(4), { stamp: '📰', link: 'https://www.theguardian.com/business/2026/sep/20/rents-keep-rising-example', title: 'Rents keep rising in big cities (예시)', sum1: 'Rents in major cities rose again this quarter.', sum2: 'Housing costs now take a bigger share of monthly income.', sum3: 'Governments are looking at ways to crack down on sharp rent hikes.', phrases: ['crack down on', 'a wave of'], thought: '월세 얘기는 어느 나라나 비슷하다', speak: true }),
    // 🎨 그림 (원본 없이, 단계와 가져갈 것을 채운 예시)
    artA,
    mk('art', d(1), { stamp: '🖌️', artKind: '크로키', images: [SAMPLE_IMAGES.color, SAMPLE_IMAGES.shaded, SAMPLE_IMAGES.color], amount: 3, mood: 'good', topic: '손 크로키 1분씩 (예시)', liked: '따뜻한 색이 자연스럽게 섞였다', next: '머리색만 차가운 색으로 바꿔 보기' }),
    // 💬 클로드 피드백 (바이올린 이번 주 1개 - 해볼 것 아직, 그림 카드 1개 - 해봤음)
    mk('claudeFeedback', d(1), { scope: 'violin', period: 'week', rangeStart: mondayOf(t), rangeEnd: addDays(mondayOf(t), 6), targetId: '', question: '3포지션에서 음정이 자꾸 높아지는 이유', text: '3포지션으로 옮길 때 손 전체가 앞으로 쏠리면서 음정이 높아지는 경우가 많아요.\n엄지 위치를 먼저 옮기고 손가락을 따라오게 하면 좋아요.\n이번 주는 활을 줄에 수직으로 두는 연습도 잘 이어졌어요. (예시)', todo: '비브라토는 개방현 옆 줄에서 4번 손가락으로 먼저', todoDone: false }),
    mk('claudeFeedback', d(7), { scope: 'drawing', period: 'card', rangeStart: d(8), rangeEnd: d(8), targetId: artA.id, question: '', text: '그림자 경계가 부드러워서 입체감이 잘 살았어요. 다음에는 빛이 오는 방향을 한 번 더 확인하고 그림자 색을 한 톤만 정해 보세요. (예시)', todo: '그림자 색을 한 톤으로 정해서 칠하기', todoDone: true }),
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
  if (!TABS.some((t) => t.id === ui.tab) && !HIDDEN_TABS.includes(ui.tab)) ui.tab = 'cal'; // 없어진 메뉴(예전 '오늘')는 캘린더로
  renderTabs();
  renderBackupBar();
  if (ui.tab === 'exercise') renderExercise();
  else if (ui.tab === 'violin') renderViolin();
  else if (ui.tab === 'english') renderEnglish();
  else if (ui.tab === 'econ') renderEcon();
  else if (ui.tab === 'cal') renderCalendar();
  else renderArt();
  applySeason();
  syncPlayButtons();
}


// 연습량 ●●○ 와 기분 😊 (카드 머리줄에 작게 붙어요. 안 적었으면 아무것도 안 보여요)
const amountOf = (r) => AMOUNTS.find((a) => a.v === Number(r.amount));
const amountWord = (r) => (r && r.type === 'workout' ? '운동량' : '연습량'); // 운동은 "운동량", 바이올린·그림은 "연습량"
const moodOf = (r) => MOODS.find((m) => m.v === r.mood);
function marksHTML(r) {
  const a = amountOf(r);
  const m = moodOf(r);
  return `${a ? `<span class="amt" role="img" aria-label="${amountWord(r)} ${a.label}" title="${amountWord(r)} ${a.label}">${a.icon} ${a.label}</span>` : ''}${m ? `<span class="mood" role="img" aria-label="기분 ${m.label}" title="하고 나서 기분: ${m.label}">${m.icon}</span>` : ''}`;
}

// 칩 선택지 하나를 {v, icon, label}로 맞춰요 (글자만 있는 것도 돼요)
const normChoice = (c) => (c !== null && typeof c === 'object' ? c : { v: c, label: String(c) });

// 칩(버튼) 칸: 하나만 고르는 것(연습량·기분 등)과 여러 개 고르는 것(multi). 고른 값은 숨은 칸(name)에 들어가요.
// 하나짜리는 다시 누르면 풀려요. (여러 개짜리는 JSON 목록으로 들어가요)
function choiceHTML(name, choices, value, multi = false, extra = '') {
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
    }).join('')}${extra}
  </div>`;
}
// 칩 칸의 선택지 (목록이 자주 바뀌는 칸은 choices 를 함수로 두어요)
const choicesOf = (f) => (typeof f.choices === 'function' ? f.choices() : f.choices);
// 칩 칸에서 고른 값 읽기 (연습량처럼 숫자 선택지면 숫자로)
function readChoice(form, f) {
  const raw = form.elements[f.key].value;
  if (f.type === 'chips') { try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  if (raw === '') return '';
  return typeof normChoice(choicesOf(f)[0]).v === 'number' ? Number(raw) : raw;
}
// 이 종류의 기록에 '연습량' 칸이 있는지 (바이올린은 연습에만, 투자·쉼에는 없어요)
const supportsAmount = (type, kind) => !!SCHEMAS[type] && SCHEMAS[type].fields.some((f) => f.key === 'amount' && (!f.only || f.only === kind));

function actionButtons(type, id, extra = '') {
  return `<div class="actions">${extra}
    <button type="button" class="btn ghost small" data-act="edit" data-type="${type}" data-id="${esc(id)}">수정</button>
    <button type="button" class="btn danger small" data-act="del" data-type="${type}" data-id="${esc(id)}">삭제</button>
  </div>`;
}

/* ---------------------------------------------------------------------
   7-2. 🕰 그때의 나 (캘린더 아래)
   --------------------------------------------------------------------- */
// n달 전 같은 날짜 (그 달에 그 날짜가 없으면 그 달의 마지막 날)
function monthsAgo(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(y, m - 1 - n, 1);
  t.setDate(Math.min(d, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return toStr(t);
}

// 그때의 나: 한 달 전 → 석 달 전 → 1년 전 중 기록이 있는 첫 날에서 하나 (그림이 있으면 그림 먼저)
const hasArtPic = (r) => r.type === 'art' && artPhotos(r).length > 0;
function memoryPick(today) {
  const pool = records.filter((r) => r.type !== 'rest' && r.date && catOf(r) && (r.type !== 'econRoutine' || hasValue(r.note))); // 경제 루틴은 한 줄을 남긴 날만
  for (const look of MEMORY_LOOKBACKS) {
    const date = monthsAgo(today, look.months);
    const list = pool.filter((r) => r.date === date).sort((a, b) => (hasArtPic(b) ? 1 : 0) - (hasArtPic(a) ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0));
    if (list.length) return { label: look.label, date, rec: list[0] };
  }
  return null;
}

function memoryText(r) {
  const raw = { workout: r.memo, violin: r.kind === '레슨' ? r.feedback : (r.part || r.hard), econRoutine: r.note, englishArticle: r.thought || r.title, art: r.liked || r.next || r.topic }[r.type] || '';
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
      ${hasArtPic(rec) ? `<img class="memory-img" src="${esc(artPhotos(rec)[0])}" alt="${esc(rec.topic || '그림')}">` : ''}
      <span class="memory-text">
        <span class="meta">${esc(dayLabel(m.date))}</span>
        <span><b>${iconOf(rec)} ${esc(calTitle(rec))}</b> ${marksHTML(rec)}</span>
        ${text ? `<span class="memory-line">${esc(text)}</span>` : ''}
      </span>
    </button>
  </section>`;
}

// 쉰 날 기록 (하루에 하나만)
async function saveRest(date) {
  if (records.some((r) => r.type === 'rest' && r.date === date)) { toast('이 날은 이미 쉼으로 남겨 두었어요.'); return null; }
  const rec = { id: newId(), type: 'rest', date, createdAt: Date.now(), updatedAt: Date.now() };
  assignStamp(rec);
  return (await saveRecord(rec)) ? rec : null;
}

// 😴 쉰 날: 누르면 남기고, 다시 누르면 지워요
async function toggleRest(date) {
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
  afterNewRecord(rec);
}

function restButtonHTML(date) {
  const on = records.some((r) => r.type === 'rest' && r.date === date);
  const word = date === todayStr() ? '오늘은' : '이 날은';
  return `<button type="button" class="btn ghost purple${dlg.open ? ' small' : ''}" data-act="rest" data-date="${date}" aria-pressed="${on}"${on ? ' title="다시 누르면 쉰 날 표시를 지워요"' : ''}>😴 ${on ? '쉰 날로 남겼어요 ✓' : `${word} 쉼`}</button>`;
}

/* ---------------------------------------------------------------------
   8. 메뉴 1: 운동·바이올린
   --------------------------------------------------------------------- */
// 카드에 보여 줄 칸들: 스키마 순서대로, 값이 있는 칸만. 칩은 작은 표시로 먼저, 글은 제목+내용으로 그 아래에.
// (skip: 카드 머리줄 등에서 이미 보여준 칸)
// opts.readonly: 체크 목록을 눌러서 바꿀 수 없는 글자로만 보여줘요 (예전 메모용)
function guideHTML(type, r, skip = [], opts = {}) {
  const tags = [];
  const blocks = [];
  SCHEMAS[type].fields.forEach((f) => {
    const value = r[f.key];
    if (['date', 'image', 'images', 'audio', 'number', 'select', 'multi', 'check', 'bookLines'].includes(f.type) || ['amount', 'mood'].includes(f.key) || skip.includes(f.key) || !hasValue(value)) return;
    const label = cleanLabel(f.label);
    if (f.type === 'choice' || f.type === 'chips') {
      const list = Array.isArray(value) ? value : [value];
      tags.push(`<div class="chip-line"><span class="chip-label">${esc(label)}</span>${list.map((v) => `<span class="tag chip-tag">${esc(v)}</span>`).join('')}</div>`);
    } else if (f.type === 'lines') {
      blocks.push(`<div class="label">${esc(label)}</div><ol class="lines">${value.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);
    } else if (f.type === 'tasks') {
      blocks.push(`<div class="label">${esc(label)}</div>${opts.readonly ? `<ul class="lines">${value.map((t) => `<li>${t.done ? '✓ ' : ''}${esc(t.text)}</li>`).join('')}</ul>` : tasksList(r, f.key)}`);
    } else if (f.links) {
      blocks.push(linksBlock(value, label));
    } else {
      blocks.push(textBlock(label, value));
    }
  });
  return `${tags.join('')}${blocks.join('')}`;
}

function workoutCard(r) {
  const parts = [];
  if (r.distance) parts.push(`${esc(fmtNum(r.distance))}km`);
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><span class="tag">${esc(r.kind || '운동')}</span> ${parts.join(' · ')} ${marksHTML(r)}</div>
      ${actionButtons('workout', r.id, claudeBtns(r))}
    </div>
    ${r.memo ? `<p class="pre">${esc(r.memo)}</p>` : ''}
    ${feedbackDoneNote(r)}
    ${cardFeedbackHTML(r)}
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
    <span>${esc(text)}</span> <span class="meta">${pieceNamesOf(r).length ? `${esc(pieceNamesOf(r).join(', '))} · ` : ''}${esc(shortDay(r.date))}</span></label></li>`).join('')}</ul>`;
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

// 🎻 카드의 곡 줄: 교재마다 "스즈키 5권 · 비발디 사단조 1악장" 한 줄씩 (곡이 없는 교재는 이름만), "그 밖에 연습한 곡"은 마지막 줄. 곡 이름을 누르면 곡 노트예요.
function bookLinesHTML(r) {
  const lines = bookRows(r).map((b) => `<div class="book-line"><span class="book-nm">${esc(b.name)}</span>${b.piece ? ` · <b>${pieceButton(b.piece)}</b>` : ''}</div>`);
  if (pieceKey(r.piece)) lines.push(`<div class="book-line"><b>${pieceButton(pieceKey(r.piece))}</b></div>`);
  return `<div class="book-lines">${lines.length ? lines.join('') : '<span class="meta">(곡 이름 미입력)</span>'}</div>`;
}

function violinCard(r) {
  if (r.kind === '레슨') {
    return `<div class="card" data-rid="${esc(r.id)}">
      <div class="item-head">
        <div><span class="tag lesson">레슨</span> ${marksHTML(r)}</div>
        ${actionButtons('violin', r.id, claudeBtns(r))}
      </div>
      ${textBlock('선생님 피드백', r.feedback)}
      ${Array.isArray(r.homework) && r.homework.length ? `<div class="label">다음 레슨까지 과제</div>${tasksList(r, 'homework')}` : ''}
      ${guideHTML('violin', r, ['feedback', 'homework'])}
      ${cardFeedbackHTML(r)}
    </div>`;
  }
  return `<div class="card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><span class="tag violin">바이올린</span>${r.tempo ? ` · 템포 ${esc(r.tempo)} BPM` : ''} ${marksHTML(r)} ${recMarksHTML(r)}</div>
      ${actionButtons('violin', r.id, claudeBtns(r))}
    </div>
    ${bookLinesHTML(r)}
    ${guideHTML('violin', r, ['kind', 'piece', 'books', 'tempo', 'feedback', 'homework'])}
    ${feedbackDoneNote(r)}
    ${cardFeedbackHTML(r)}
  </div>`;
}

/* ---------------------------------------------------------------------
   ⚙︎ 설정 값 기록 (교재 목록 등): 백업에 함께 들어가도록 일반 기록(type 'config')으로 저장해요
   --------------------------------------------------------------------- */
const configRec = (key) => records.find((r) => r.type === 'config' && r.key === key);
const getConfig = (key, fallback) => { const r = configRec(key); return r && r.value !== undefined ? r.value : fallback; };
async function setConfig(key, value) {
  const old = configRec(key);
  return saveRecord({ id: old ? old.id : `cfg-${key}`, type: 'config', key, value, date: todayStr(), createdAt: old ? old.createdAt : Date.now(), updatedAt: Date.now() });
}

// 🎻 교재 목록: [{ name, hidden }] 순서대로. 숨겨도 예전 기록의 교재 이름은 그대로 보여요.
function textbookList() {
  const v = getConfig('textbooks', null);
  const list = Array.isArray(v) ? v : TEXTBOOKS_DEFAULT.map((name) => ({ name, hidden: false }));
  return list.filter((b) => b && typeof b.name === 'string' && b.name.trim()).map((b) => ({ name: b.name.trim(), hidden: !!b.hidden }));
}
const textbookChoices = () => textbookList().filter((b) => !b.hidden).map((b) => b.name);
const MANAGE_BOOKS_BTN = '<button type="button" class="btn ghost small manage-btn" data-act="manageBooks">⚙︎ 교재 관리</button>';

// 🎻 교재별 한 줄: books = [{ name, piece }] (교재 칩 순서). 예전 기록의 books(교재 이름만 있는 목록)도 읽어요 (그때는 곡이 빈칸).
//   piece(예전 "곡 이름" 칸)는 이제 "그 밖에 연습한 곡"이에요. 예전 기록은 한 번만 새 모양으로 옮겨요 (booksCopy)
const bookRows = (r) => (r && Array.isArray(r.books) ? r.books : [])
  .map((b) => (b !== null && typeof b === 'object' ? { name: String(b.name || '').trim(), piece: String(b.piece || '').trim() } : { name: String(b === undefined || b === null ? '' : b).trim(), piece: '' }))
  .filter((b) => b.name);

// 한 기록에 적힌 곡들: 교재별 한 줄(칩 순서) → 그 밖에 연습한 곡. 같은 곡은 하나로 (어느 교재에서 나왔는지는 books 에 모아요)
function piecesOf(r) {
  const out = [];
  const add = (name, book) => {
    const k = pieceKey(name);
    if (!k) return;
    const hit = out.find((p) => p.name === k);
    if (hit) { if (book && !hit.books.includes(book)) hit.books.push(book); return; }
    out.push({ name: k, books: book ? [book] : [] });
  };
  bookRows(r).forEach((b) => add(b.piece, b.name));
  add(r && r.piece, '');
  return out;
}
const pieceNamesOf = (r) => piecesOf(r).map((p) => p.name);

// 교재 칸 자동완성: 그 교재의 한 줄 칸에 적었던 값만 최근 순
function bookPieceSuggestions(name) {
  const seen = new Set();
  const out = [];
  ofType('violin').filter((r) => r.kind !== '레슨').sort(byNewest).forEach((r) => bookRows(r).forEach((b) => {
    if (b.name === name && b.piece && !seen.has(b.piece)) { seen.add(b.piece); out.push(b.piece); }
  }));
  return out.slice(0, 40);
}

// 곡 이름 자동완성용: 지금까지 쓴 곡 (최근에 쓴 순)
function knownPieces() {
  const seen = new Set();
  const out = [];
  ofType('violin').filter((r) => r.kind !== '레슨').sort(byNewest).forEach((r) => pieceNamesOf(r).forEach((p) => { if (!seen.has(p)) { seen.add(p); out.push(p); } }));
  return out;
}
// "그 밖에 연습한 곡" 자동완성
const pieceSuggestions = () => knownPieces().slice(0, 40);

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
  const prac = ofType('violin').filter((r) => r.kind !== '레슨' && pieceNamesOf(r).includes(piece)).sort(byOldest);
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

// 목록 맨 위 요약 한 줄 (이번 주, 작게). 값이 없는 부분은 빼고, 아무것도 없으면 줄 자체를 그리지 않아요. 숫자 합계는 없어요.
//   바이올린: "이 주에 연습한 곡: … · 다음에 해볼 것: …"   운동: "이 주: 요가 2 · 슬로조깅 1" (한 것만)
function areaLineHTML(area) {
  const start = mondayOf(todayStr());
  const end = addDays(start, 6);
  const inWeek = (r) => r.date >= start && r.date <= end;
  const parts = [];
  if (area === 'exercise') {
    const ws = ofType('workout').filter(inWeek);
    const kinds = SCHEMAS.workout.fields.find((f) => f.key === 'kind').options
      .map((k) => [k, ws.filter((r) => r.kind === k).length]).filter(([, n]) => n > 0);
    if (kinds.length) parts.push(`이 주: ${kinds.map(([k, n]) => `${esc(k)} ${n}`).join(' · ')}`);
  } else {
    const prac = ofType('violin').filter(inWeek).filter((r) => r.kind !== '레슨'); // 연습 기록만
    const pieces = [...new Set(prac.flatMap(pieceNamesOf))];
    const lastNext = prac.filter((r) => hasValue(r.next)).sort(byNewest)[0];
    if (pieces.length) parts.push(`이 주에 연습한 곡: ${pieces.map(pieceButton).join(', ')}`);
    if (lastNext) parts.push(`다음에 해볼 것: ${esc(oneLine(lastNext.next))}`);
  }
  return parts.length ? `<p class="meta area-line">${parts.join(' · ')}</p>` : '';
}

// 글 만들기에 쓰는 작은 도구들
const oneLine = (s) => String(s || '').trim().replace(/\s*\n\s*/g, ' / ');
const mdLabel = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}/${d.getDate()} (${'일월화수목금토'[d.getDay()]})`; };

// 글을 복사하고 알려줘요. 자동 복사가 안 되면 글을 창에 보여 줘서 직접 복사할 수 있게 해요.
async function copyText(text, okMsg, title = '복사할 글') {
  let ok = false;
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { /* 아래의 예전 방식으로 다시 해 봐요 */ }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
  }
  if (ok) toast(okMsg, 4000);
  else openDlg(`<h2>${esc(title)}</h2><p class="meta" style="margin-top:0">자동으로 복사하지 못했어요. 아래 글을 직접 선택해서 복사해 주세요. (Ctrl+C)</p><textarea class="copy-text" readonly>${esc(text)}</textarea><div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`, true);
  return ok;
}

// 지금까지 쌓인 기록 (예시 기록은 세지 않아요). area: 'exercise' | 'violin'. 목록 맨 아래에 작게 보여요.
//   첫 기록으로부터 TOTALS_AFTER_DAYS(10)일이 지나기 전에는 숫자 대신 "이제 시작했어요"만. 진짜 기록이 아직 없으면 아무것도 그리지 않아요.
function totalsCardHTML(area) {
  const real = records.filter((r) => !r.sample);
  const sampleNote = records.some((r) => r.sample) ? '예시 기록은 세지 않았어요.' : '';
  const mine = real.filter((r) => r.type === (area === 'exercise' ? 'workout' : 'violin'));
  if (!mine.length) return '';
  const first = mine.reduce((m, r) => (r.date < m ? r.date : m), mine[0].date);
  const passed = Math.round((parseDate(todayStr()) - parseDate(first)) / 86400000);
  if (passed < TOTALS_AFTER_DAYS) return '<section class="card total-card total-start"><p class="meta">🌱 이제 시작했어요</p></section>';
  const note = sampleNote ? `<p class="meta" style="margin:8px 0 0">${sampleNote}</p>` : '';
  if (area === 'exercise') {
    return `<section class="card total-card"><h3>🌱 지금까지 쌓인 기록</h3>
      <div class="stats" style="margin-top:8px"><div class="stat"><b>${mine.length}회</b><span>운동</span></div></div>${note}
    </section>`;
  }
  const prac = mine.filter((r) => r.kind !== '레슨');
  const lessons = mine.length - prac.length;
  const pieces = new Set(prac.flatMap(pieceNamesOf)).size;
  return `<section class="card total-card"><h3>🌱 지금까지 쌓인 기록</h3>
    <div class="stats" style="margin-top:8px">
      <div class="stat"><b>${new Set(prac.map((r) => r.date)).size}일</b><span>바이올린 연습한 날</span></div>
      <div class="stat"><b>${pieces}곡</b><span>연습한 곡</span></div>
      ${lessons ? `<div class="stat"><b>${lessons}회</b><span>레슨</span></div>` : ''}
    </div>${note}
  </section>`;
}

/* ---------------------------------------------------------------------
   📚 레퍼토리 책장: 연습 중인 곡은 "책상 위"에 펼친 악보로, 마무리한 곡은 "책장"에 책등으로 꽂혀요.
   (곡 노트의 📕 이 곡 마무리 버튼으로 옮겨요. 개수나 완료율은 보여주지 않아요.)
   --------------------------------------------------------------------- */
function repertoire() {
  const prac = ofType('violin').filter((r) => r.kind !== '레슨' && pieceNamesOf(r).length);
  const names = new Set([...prac.flatMap(pieceNamesOf), ...ofType('piecenote').filter((n) => n.status === 'done').map((n) => n.piece)]); // 같은 곡이 여러 교재에 있어도 하나로
  return [...names].map((name) => {
    const mine = prac.filter((r) => pieceNamesOf(r).includes(name)).sort(byOldest);
    const note = pieceNoteOf(name);
    const stage = mine.filter((r) => hasValue(r.stage)).sort(byNewest)[0];
    const books = [...new Set([...mine].reverse().flatMap((r) => (piecesOf(r).find((p) => p.name === name) || { books: [] }).books))]; // 이 곡을 적은 교재들 (최근에 쓴 교재부터)
    return {
      name, note, done: !!note && note.status === 'done', doneAt: note && note.doneAt ? note.doneAt : '', books,
      firstDate: mine.length ? mine[0].date : '', lastDate: mine.length ? mine[mine.length - 1].date : '',
      stage: stage ? stage.stage : '', hasAudio: audios.some((a) => a.piece === name),
    };
  });
}

const monthLabel = (date) => { const d = parseDate(date); return `${d.getFullYear()}년 ${d.getMonth() + 1}월`; };

function shelfHTML() {
  const all = repertoire();
  if (!all.length) return `<div class="empty">${esc(EMPTY_TEXT.shelf)}</div>`;
  const desk = all.filter((p) => !p.done).sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || '') || a.name.localeCompare(b.name, 'ko'));
  const shelf = all.filter((p) => p.done).sort((a, b) => (a.doneAt || '').localeCompare(b.doneAt || '') || a.name.localeCompare(b.name, 'ko'));
  const mic = (p) => (p.hasAudio ? '<span class="book-mic" title="녹음이 있어요" aria-label="녹음 있음">🎙</span>' : '');
  const book = (p) => `<button type="button" class="book" data-act="piece" data-piece="${esc(p.name)}" title="${esc(p.name)} · 곡 노트 열기">
      <span class="book-page left"><b>${esc(p.name)}</b>${p.books.length ? `<span class="book-tags">${p.books.map((b) => `<span class="tag small">${esc(b)}</span>`).join('')}</span>` : ''}${p.firstDate ? `<span class="meta">${esc(monthLabel(p.firstDate))}에 처음 연습</span>` : ''}</span>
      <span class="book-page right">${p.stage ? `<span>${esc(p.stage)}</span>` : ''}${p.note && hasValue(p.note.memo) ? `<span class="meta">${esc(p.note.memo)}</span>` : ''}${p.lastDate ? `<span class="meta">마지막 연습 ${esc(shortDay(p.lastDate))}</span>` : ''}${mic(p)}</span>
    </button>`;
  const spine = (p, i) => `<button type="button" class="spine c${i % 3}" data-act="piece" data-piece="${esc(p.name)}" title="${esc(p.name)}${p.books.length ? ` · ${esc(p.books.join(', '))}` : ''}${p.firstDate ? ` · ${esc(monthLabel(p.firstDate))}에 처음 연습` : ''}" aria-label="${esc(p.name)} 곡 노트 열기">
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

// 영역 위쪽 칩 줄 (key: ui 안의 보기 이름, cur: 지금 보기)
const viewChips = (key, cur, items) => items.map(([id, text]) => `<button type="button" class="chip ${cur === id ? 'active' : ''}" data-act="setView" data-key="${key}" data-id="${id}" aria-pressed="${cur === id}">${text}</button>`).join('');

// 날짜별로 묶은 기록 카드 목록
function dayGroupedHTML(list, cardFn, emptyText) {
  if (!list.length) return `<div class="empty">${esc(emptyText)}</div>`;
  let out = '';
  let lastDate = '';
  list.forEach((r) => {
    if (r.date !== lastDate) { out += `<div class="day">${esc(dayLabel(r.date))}</div>`; lastDate = r.date; }
    out += cardFn(r);
  });
  return out;
}

// 영역 화면의 공통 틀 (위에서 아래로): 제목·설명 한 줄 → ＋ 기록 버튼 → 칩 줄(첫 칩이 기본) → [기록 보기] 요약 한 줄 → 목록
function renderExercise() {
  const feedback = ui.exView === 'feedback';
  const list = ofType('workout').sort(byNewest);
  view.innerHTML = `
    <h2 class="page-title">운동</h2>
    <p class="page-sub">요가와 슬로조깅을 가볍게 남겨요. 잘했는지 못했는지 점수는 매기지 않아요.</p>
    <div class="row actions-row add-row">
      <button type="button" class="btn" data-act="add" data-type="workout">＋ 운동 기록</button>
    </div>
    <div class="chips">${viewChips('exView', ui.exView, [['records', '📖 기록'], ['feedback', '💬 피드백']])}</div>
    ${feedback ? feedbackViewHTML('exercise') : `${areaLineHTML('exercise')}${dayGroupedHTML(list, workoutCard, EMPTY_TEXT.workout)}${totalsCardHTML('exercise')}`}`;
}

function renderViolin() {
  const mode = ui.vnView;
  const list = ofType('violin').sort(byNewest);
  view.innerHTML = `
    <h2 class="page-title">바이올린</h2>
    <p class="page-sub">손을 쓴 날을 가볍게 남겨요. 잘했는지 못했는지 점수는 매기지 않아요.</p>
    <div class="row actions-row add-row">
      <button type="button" class="btn" data-act="add" data-type="violin">＋ 바이올린 기록</button>
    </div>
    <div class="chips">${viewChips('vnView', mode, [['records', '📖 기록'], ['shelf', '📚 레퍼토리 책장'], ['feedback', '💬 피드백']])}</div>
    ${mode === 'shelf' ? shelfHTML() : mode === 'feedback' ? feedbackViewHTML('violin') : `${lessonPanel()}${areaLineHTML('violin')}${dayGroupedHTML(list, violinCard, EMPTY_TEXT.violin)}${totalsCardHTML('violin')}`}`;
}

/* ---------------------------------------------------------------------
   9. 메뉴 4: 경제 루틴
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   ✅ 오늘의 경제 루틴: 입력 창 없이 체크만 해요. 날짜마다 기록 하나(type 'econRoutine')가 생기고,
   체크를 모두 풀고 한 줄·태그도 비어 있으면 그 기록은 저절로 사라져요.
   --------------------------------------------------------------------- */
const routineOn = (date) => records.find((r) => r.type === 'econRoutine' && r.date === date);
const routineChecked = (r, id) => !!(r && r.checks && r.checks[id]);
const chipRoutine = () => ECON_ROUTINES.find((x) => Array.isArray(x.chips) && x.chips.length); // 칩(읽은 뉴스레터)이 달린 항목
const routineIcons = (r) => ECON_ROUTINES.filter((x) => routineChecked(r, x.id)).map((x) => x.icon); // 목록에 없는 id는 조용히 무시
const dayWithDow = (s) => `${shortDay(s)} (${'일월화수목금토'[parseDate(s).getDay()]})`;
const noteDay = (s) => (s.slice(0, 4) === String(new Date().getFullYear()) ? shortDay(s) : `${s.slice(0, 4)}년 ${shortDay(s)}`);

// 한 날의 루틴 기록을 바꿔요. 순서대로 하나씩 실행해서, 한 줄 저장과 체크가 서로 덮어쓰지 않아요.
let routineQueue = Promise.resolve();
function updateRoutine(date, patch) {
  const run = async () => {
    const old = routineOn(date);
    const { sample, ...keep } = old || {}; // 예시를 고치면 내 기록이 돼요
    const rec = {
      ...keep, id: old ? old.id : newId(), type: 'econRoutine', date, createdAt: old ? old.createdAt : Date.now(),
      checks: { ...(keep.checks || {}) }, letters: [...(keep.letters || [])], note: keep.note || '',
    };
    delete rec.tags; // 예전 태그 값은 고칠 때 함께 정리돼요
    patch(rec);
    rec.updatedAt = Date.now();
    const empty = !Object.values(rec.checks).some(Boolean) && !rec.letters.length && !rec.note;
    if (empty) { if (old) await deleteRecord(old.id); return null; }
    if (!old) assignStamp(rec);
    return (await saveRecord(rec)) ? rec : undefined; // null: 비어서 지움, undefined: 저장 못 함
  };
  routineQueue = routineQueue.then(run, run);
  return routineQueue;
}

// 체크했을 때 도장 토스트 (꺼 두었으면 나오지 않아요)
function routineToast(rec) {
  const s = stampPhrases.get(rec.id) || pickStamp(rec);
  stampPhrases.delete(rec.id);
  if (!settings.celebrateOff) toast(s.text, 3500, { stamp: s.icon });
}

const refreshRoutineViews = () => { render(); refreshDay(); };

async function setRoutineCheck(date, id, on) {
  if (date > todayStr() || !ECON_ROUTINES.some((x) => x.id === id)) return; // 미래 날짜는 체크할 수 없어요
  const was = routineChecked(routineOn(date), id);
  const item = ECON_ROUTINES.find((x) => x.id === id);
  const rec = await updateRoutine(date, (r) => {
    if (on) r.checks[id] = true;
    else { delete r.checks[id]; if (item.chips) r.letters = []; } // 체크를 풀면 그 칩 표시도 함께 풀려요
  });
  if (rec === undefined) return;
  refreshRoutineViews();
  if (on && !was && rec) routineToast(rec);
}

// 뉴스레터 칩: 누르면 그 뉴스레터를 읽은 것으로 표시하고, 뉴스레터 체크가 안 되어 있으면 함께 체크해요
async function toggleRoutineChip(date, chip) {
  const cr = chipRoutine();
  if (!cr || date > todayStr()) return;
  const was = routineChecked(routineOn(date), cr.id);
  const rec = await updateRoutine(date, (r) => {
    const i = r.letters.indexOf(chip);
    if (i >= 0) r.letters.splice(i, 1); else { r.letters.push(chip); r.checks[cr.id] = true; }
  });
  if (rec === undefined) return;
  refreshRoutineViews();
  if (!was && rec && routineChecked(rec, cr.id)) routineToast(rec);
}

// 오늘 한 줄: 입력 칸 오른쪽의 [저장] 버튼이나 Enter 로 저장해요. (저절로 저장되지는 않아요)
//   쓰는 중인 글은 ui.noteDraft 에 두어서, 체크를 눌러 화면이 다시 그려져도 사라지지 않아요.
const noteSavedText = (date) => { const r = routineOn(date); return r && r.note ? r.note : ''; };
const noteDraftText = (date) => (ui.noteDraft && ui.noteDraft.date === date ? ui.noteDraft.text : noteSavedText(date));
const noteDirty = (date) => !!ui.noteDraft && ui.noteDraft.date === date && ui.noteDraft.text.trim() !== noteSavedText(date);

// 저장 버튼 자리: 고친 글이 있으면 [저장], 방금 저장했으면 잠깐 "저장됨 ✓", 그 밖에는 눌리지 않는 흐린 [저장]
function noteBtnHTML(date) {
  if (noteDirty(date)) return '<button type="submit" class="btn small rt-save" id="rtSave">저장</button>';
  if (ui.noteSavedUntil > Date.now()) return '<span class="rt-saved" id="rtSave" role="status">저장됨 ✓</span>';
  return '<button type="submit" class="btn small rt-save" id="rtSave" disabled>저장</button>';
}
function syncNoteBtn(date) {
  const el = $('#rtSave');
  if (el) el.outerHTML = noteBtnHTML(date);
}

async function saveRoutineNote(date) {
  const input = $('#rtNote');
  const text = (input && input.dataset.date === date ? input.value : noteDraftText(date)).trim();
  if (text === noteSavedText(date)) { ui.noteDraft = null; syncNoteBtn(date); return true; }
  const rec = await updateRoutine(date, (r) => { r.note = text; });
  if (rec === undefined) return false;
  ui.noteDraft = null;
  ui.noteSavedUntil = Date.now() + 2200;
  setTimeout(() => { if (ui.noteSavedUntil <= Date.now()) syncNoteBtn(date); }, 2300);
  refreshRoutineViews();
  return true;
}

// 다른 탭으로 가기 전에: 저장하지 않은 한 줄이 있으면 물어봐요. 저장하고 가면 true, 취소하면 그 자리에 머물러요(쓰던 글은 그대로).
async function confirmLeaveNote() {
  const date = todayStr();
  if (ui.tab !== 'econ' || !noteDirty(date)) return true;
  if (!confirm('저장하지 않은 한 줄이 있어요. 저장할까요?')) return false;
  return saveRoutineNote(date);
}

// 지난 한 줄 보기: 날짜 + 한 줄만 최신순 (작은 창)
function openPastNotes() {
  const list = ofType('econRoutine').filter((r) => hasValue(r.note)).sort(byNewest);
  openDlg(`<h2>지난 한 줄</h2>
    ${list.length
    ? `<ul class="note-list">${list.map((r) => `<li><span class="meta">${esc(noteDay(r.date))}</span><span class="pre">${esc(r.note)}</span></li>`).join('')}</ul>`
    : `<p class="meta">${esc(EMPTY_TEXT.pastNotes)}</p>`}
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>`);
}

// 체크 목록 (경제 화면)
function routineRowsHTML(date) {
  const rec = routineOn(date);
  return `<div class="rt-list">${ECON_ROUTINES.map((x) => {
    const on = routineChecked(rec, x.id);
    const chips = Array.isArray(x.chips) && x.chips.length
      ? `<span class="rt-chips${on ? '' : ' faint'}">${x.chips.map((c) => {
        const sel = !!(rec && Array.isArray(rec.letters) && rec.letters.includes(c));
        return `<button type="button" class="chip small${sel ? ' active' : ''}" data-act="routineChip" data-date="${date}" data-chip="${esc(c)}" aria-pressed="${sel}">${esc(c)}</button>`;
      }).join('')}</span>` : '';
    return `<div class="rt-row${on ? ' on' : ''}" data-routine-row="${esc(x.id)}">
      <label class="rt-main"><input type="checkbox" class="rt-check" data-routine="${esc(x.id)}" data-date="${date}" ${on ? 'checked' : ''}><span class="rt-icon" aria-hidden="true">${x.icon}</span><span class="rt-label">${esc(x.label)}</span></label>${chips}
    </div>`;
  }).join('')}</div>`;
}

function routineNoteHTML(date) {
  return `<div class="rt-note">
    <label class="rt-h" for="rtNote">오늘 한 줄 <span class="meta">(선택)</span></label>
    <form id="rtNoteForm" class="rt-note-form" data-date="${date}" novalidate>
      <input id="rtNote" class="rt-note-in" type="text" maxlength="300" autocomplete="off" data-routine-note data-date="${date}" value="${esc(noteDraftText(date))}" placeholder="오늘 기억나는 흐름 하나 (예: 환율이 올라 수입 물가가 걱정된다는 얘기)">
      ${noteBtnHTML(date)}
    </form>
  </div>`;
}

// 이번 주(월~일): 항목마다 한 줄. 한 날은 ●, 안 한 날은 흐린 · (숫자·퍼센트 없이). 지난 날짜의 점을 누르면 그날 체크를 켜고 끌 수 있어요.
function routineWeekHTML() {
  const today = todayStr();
  const mon = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  return `<div class="wk">
    <div class="rt-h">이번 주</div>
    <div class="wk-grid">
      <div class="wk-row wk-head"><span class="wk-lab"></span>${days.map((d, i) => `<span class="wk-d${d === today ? ' today' : ''}">${'월화수목금토일'[i]}</span>`).join('')}</div>
      ${ECON_ROUTINES.map((x) => `<div class="wk-row" data-week-row="${esc(x.id)}"><span class="wk-lab" title="${esc(x.label)}">${x.icon}</span>${days.map((d) => {
        const on = routineChecked(routineOn(d), x.id);
        return `<button type="button" class="wk-dot${on ? ' on' : ''}" data-act="routineDot" data-routine="${esc(x.id)}" data-date="${d}" ${d > today ? 'disabled' : ''} aria-pressed="${on}" aria-label="${esc(`${dayWithDow(d)} ${x.label}`)}">${on ? '●' : '·'}</button>`;
      }).join('')}</div>`).join('')}
    </div>
    <p class="meta wk-note">지난 날짜의 점을 누르면 그날 체크를 켜고 끌 수 있어요.</p>
    <button type="button" class="link-btn past-notes" data-act="pastNotes">지난 한 줄 보기</button>
  </div>`;
}

function routineScreenHTML() {
  const today = todayStr();
  return `<section class="routine card">
    <div class="rt-date">${esc(dayWithDow(today))}</div>
    ${routineRowsHTML(today)}
    ${routineHintHTML()}
    ${routineNoteHTML(today)}
    ${routineWeekHTML()}
  </section>`;
}

function renderEcon() {
  view.dataset.today = todayStr(); // 밤새 열어 두었다가 날짜가 바뀌면 다시 그리려고 기억해 둬요
  view.innerHTML = `
    <h2 class="page-title">경제 루틴</h2>
    <p class="page-sub">매일 조금씩, 가볍게 점검해요.</p>
    <div class="chips">${viewChips('econView', ui.econView, [['routine', '✅ 오늘 루틴'], ['feedback', '💬 피드백']])}</div>
    ${ui.econView === 'feedback' ? feedbackViewHTML('econ') : routineScreenHTML()}`;
}

// 다른 화면의 기록으로 이동해서 잠깐 표시해 줘요 (도장 모음판 등에서)
function goToRecord(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  closeDlg();
  if (r.type === 'econRoutine') { ui.tab = 'econ'; }
  else if (r.type === 'art') { ui.tab = 'art'; ui.artView = 'gallery'; }
  else if (r.type === 'englishArticle') { ui.tab = 'english'; ui.enView = 'list'; }
  else if (r.type === 'violin') { ui.tab = 'violin'; ui.vnView = 'records'; }
  else { ui.tab = 'exercise'; ui.exView = 'records'; }
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

/* ---------------------------------------------------------------------
   10. 🎈 놀이터 = 🎨 그림 (갤러리 하나. 지금까지 그린 것을 큰 썸네일 격자로만 보여요. 날짜별 묶음·빈 칸·숫자는 없어요)
   --------------------------------------------------------------------- */
// 종류: 새 기록은 artKind 에, 예전 기록은 "단계"로 읽어요 (그대로 모작·조금 바꿔 그리기 → 모작, 창작 → 창작, 없으면 모작)
const artKindOf = (r) => (ART_KINDS.includes(r.artKind) ? r.artKind : (ART_STAGE_TO_KIND[r.stage] || '모작'));
// 사진: 새 기록은 images(여러 장), 예전 기록은 image(한 장)
const artPhotos = (r) => (Array.isArray(r.images) && r.images.length ? r.images : (r.image ? [r.image] : []));
const artCount = (r) => Math.max(1, artPhotos(r).length); // 그린 양은 사진 수로 세요 (사진이 없는 예전 기록은 1장)
const artTitle = (r) => r.topic || artKindOf(r);

function artTileHTML(r) {
  const photos = artPhotos(r);
  const n = photos.length;
  const say = `${dayLabel(r.date)}, ${artKindOf(r)}${n > 1 ? ` ${n}장` : ''}${r.topic ? `, ${r.topic}` : ''}`;
  return `<button type="button" class="art-tile" data-act="artOpen" data-id="${esc(r.id)}" data-rid="${esc(r.id)}" aria-label="${esc(say)}">
    <span class="art-thumb">${photos[0] ? `<img src="${esc(photos[0])}" alt="" loading="lazy" decoding="async">` : '<span class="art-noimg">사진 없음</span>'}${n > 1 ? `<span class="art-count">×${n}</span>` : ''}</span>
    <span class="art-cap"><span>${esc(shortDay(r.date))}</span><span class="tag art-kind small">${esc(artKindOf(r))}</span></span>
  </button>`;
}

function artGalleryHTML() {
  const list = ofType('art').sort(byNewest);
  if (!list.length) return '<div class="empty">그리고 싶은 날, 그린 그림을 올려 보세요. 사진을 끌어다 놓거나 붙여넣어도 돼요.</div>';
  return `<div class="art-grid art-playground">${list.map(artTileHTML).join('')}</div>`;
}

function renderArt() {
  const feedback = ui.artView === 'feedback';
  view.innerHTML = `
    <div class="playground-head">
      <h2 class="page-title">${PLAYGROUND.icon} ${esc(PLAYGROUND.name)}</h2>
      <button type="button" class="link-btn" data-act="tab" data-id="cal">← 캘린더로</button>
    </div>
    <p class="page-sub">그리고 싶은 날 놀러 오는 곳이에요. 안 그려도 괜찮아요.</p>
    <div class="row between actions-row" style="margin:6px 0 14px">
      ${feedback ? '<button type="button" class="link-btn" data-act="artGallery">← 그림 보기</button>' : '<button type="button" class="btn" data-act="add" data-type="art">＋ 그림 올리기</button>'}
      ${feedback ? '' : '<button type="button" class="link-btn art-fb-link" data-act="artFeedback">💬 피드백</button>'}
    </div>
    ${feedback ? feedbackViewHTML('drawing') : artGalleryHTML()}`;
}

// 놀이터로 들어가요 (⚙ 백업·설정의 "놀이터" 칸에서)
function openPlayground() {
  closeDlg();
  ui.tab = PLAYGROUND.id; ui.artView = 'gallery'; ui.query = '';
  render(); window.scrollTo(0, 0);
}

// 예전에 적어 둔 값 (원작자·원본과 다른 점·가져갈 것·참고 강의 등). 지우지 않고 읽기만 해요.
function legacyArtMemoHTML(r) {
  const rows = [];
  const add = (label, v) => { if (hasValue(v)) rows.push([label, Array.isArray(v) ? v.join('·') : v]); };
  add('단계', r.stage); add('원작자', r.origin); add('원본과 다른 점', r.diff); add('내 그림에 가져갈 것', r.carry);
  add('다음엔 바꿔 그려 보기', r.nextChips); add('참고한 강의·영상', r.course);
  const refs = hasValue(r.refs) ? linksBlock(r.refs, '참고 링크') : '';
  if (!rows.length && !refs) return '';
  return `<div class="legacy-memo"><div class="label">예전 메모 <span class="meta">(읽기만 해요)</span></div>
    ${rows.map(([l, v]) => `<p class="pre"><span class="meta">${esc(l)}</span> ${esc(v)}</p>`).join('')}${refs}</div>`;
}

// 썸네일을 누르면 열리는 상세 창: 사진 크게(여러 장이면 ◀ ▶), 원본이 있으면 "원본 | 내 그림" 나란히
function openArt(id, i = 0) {
  const r = records.find((x) => x.id === id && x.type === 'art');
  if (!r) return;
  const photos = artPhotos(r);
  ui.artOpen = id;
  ui.artPhoto = Math.min(Math.max(0, i), Math.max(0, photos.length - 1));
  const fig = (src, alt, cap, extra = '') => `<figure class="art-fig"><img class="art-img" src="${esc(src)}" alt="${esc(alt)}" ${extra}><figcaption class="meta" ${extra.includes('id=') ? '' : ''}>${cap}</figcaption></figure>`;
  const mine = photos.length
    ? `<figure class="art-fig"><img class="art-img" id="artMainImg" src="${esc(photos[ui.artPhoto])}" alt="${esc(artTitle(r))}">
        ${photos.length > 1 ? `<div class="art-nav"><button type="button" class="btn ghost small" data-act="artNav" data-d="-1" aria-label="이전 사진">◀</button><span class="meta" id="artNavNo">${ui.artPhoto + 1} / ${photos.length}</span><button type="button" class="btn ghost small" data-act="artNav" data-d="1" aria-label="다음 사진">▶</button></div>` : ''}
        ${r.srcImage ? '<figcaption class="meta">내 그림</figcaption>' : ''}</figure>`
    : '<div class="art-noimg">사진 없음</div>';
  const src = r.srcImage ? fig(r.srcImage, '원본 그림', '원본') : '';
  openDlg(`<div class="art-detail" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div><span class="tag art-kind">${esc(artKindOf(r))}</span> <span class="meta">${esc(dayLabel(r.date))}</span> ${marksHTML(r)}</div>
    </div>
    ${r.topic ? `<h2 style="margin:6px 0 10px">${esc(r.topic)}</h2>` : ''}
    <div class="art-pair${src ? '' : ' one'}">${src}${mine}</div>
    ${textBlock('마음에 드는 곳', r.liked)}
    ${textBlock('다음에 해볼 것', r.next)}
    ${feedbackDoneNote(r)}
    <div class="row" style="margin-top:12px">
      <button type="button" class="btn ghost purple small" data-act="claudeCard" data-id="${esc(r.id)}" title="이 그림 기록을 클로드에게 보낼 글로 복사해요">🤖 클로드에게 보내기</button>
      ${feedbackBadge(r)}
      <button type="button" class="btn ghost small" data-act="edit" data-type="art" data-id="${esc(r.id)}">수정</button>
      <button type="button" class="btn danger small" data-act="del" data-type="art" data-id="${esc(r.id)}">삭제</button>
    </div>
    ${cardFeedbackHTML(r)}
    ${legacyArtMemoHTML(r)}
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">닫기</button></div>
  </div>`, 'roomy');
}
// 사진 넘기기: 창을 다시 그리지 않고 사진과 번호만 바꿔요
function artNav(d) {
  const r = records.find((x) => x.id === ui.artOpen);
  const img = $('#artMainImg');
  if (!r || !img) return;
  const photos = artPhotos(r);
  ui.artPhoto = (ui.artPhoto + d + photos.length) % photos.length;
  img.src = photos[ui.artPhoto];
  const no = $('#artNavNo');
  if (no) no.textContent = `${ui.artPhoto + 1} / ${photos.length}`;
}
// 열려 있는 상세 창을 새로 그려요 (피드백을 붙여 넣거나 고친 뒤)
function refreshArtDetail() { if (dlg.open && ui.artOpen && dlg.querySelector('.art-detail')) openArt(ui.artOpen, ui.artPhoto); }

// 캘린더 날짜 창 안의 그림 카드 (작은 사진 + 종류·한 줄. 사진을 누르면 상세 창)
function artDayCard(r) {
  const photos = artPhotos(r);
  return `<div class="card art-day" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div class="art-day-main">
        <button type="button" class="art-day-thumb" data-act="artOpen" data-id="${esc(r.id)}" aria-label="그림 크게 보기">${photos[0] ? `<img src="${esc(photos[0])}" alt="">` : '🎨'}${photos.length > 1 ? `<span class="art-count">×${photos.length}</span>` : ''}</button>
        <div><div><span class="tag art-kind">${esc(artKindOf(r))}</span> ${marksHTML(r)}</div>${r.topic ? `<div class="pre">${esc(r.topic)}</div>` : ''}</div>
      </div>
      ${actionButtons('art', r.id, claudeBtns(r))}
    </div>
    ${feedbackDoneNote(r)}
    ${cardFeedbackHTML(r)}
  </div>`;
}

/* ---------------------------------------------------------------------
   10-1. 📰 영어 (주 1회 기사를 읽고 세 줄로 정리해요. 링크의 제목을 가져오는 등 밖으로 나가는 요청은 없어요)
   --------------------------------------------------------------------- */
function linkHref(link) {
  const t = String(link || '').trim();
  return !t ? '' : /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
function domainOf(link) {
  const href = linkHref(link);
  if (!href) return '';
  try { return new URL(href).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function englishCard(r) {
  const dom = domainOf(r.link);
  const sums = [r.sum1, r.sum2, r.sum3].map((t, i) => ({ n: i + 1, t: String(t || '').trim() })).filter((x) => x.t);
  const phrases = Array.isArray(r.phrases) ? r.phrases : [];
  return `<article class="card en-card" data-rid="${esc(r.id)}">
    <div class="item-head">
      <div class="meta">${esc(dayLabel(r.date))}${dom ? ` · <a href="${esc(linkHref(r.link))}" target="_blank" rel="noopener noreferrer" class="en-dom">${esc(dom)}</a>` : ''}${r.speak ? ' <span class="tag">🗣 말해 볼 주제</span>' : ''}</div>
    </div>
    <h3>${esc(r.title || dom || '(제목 없음)')}</h3>
    ${sums.length ? `<ol class="en-sum">${sums.map((x) => `<li value="${x.n}">${esc(x.t)}</li>`).join('')}</ol>` : ''}
    ${phrases.length ? `<div class="chip-line"><span class="chip-label">가져갈 표현</span>${phrases.map((c) => `<span class="tag chip-tag">${esc(c)}</span>`).join('')}</div>` : ''}
    ${hasValue(r.thought) ? textBlock('내 생각', r.thought) : ''}
    ${feedbackDoneNote(r)}
    <div class="row card-btns" style="margin-top:10px">
      <button type="button" class="btn ghost purple small" data-act="claudeCard" data-id="${esc(r.id)}">🤖 첨삭 받기</button>
      ${feedbackBadge(r)}
      <button type="button" class="btn ghost small" data-act="edit" data-type="englishArticle" data-id="${esc(r.id)}">✍ 수정</button>
      <button type="button" class="btn danger small" data-act="del" data-type="englishArticle" data-id="${esc(r.id)}">삭제</button>
    </div>
    ${cardFeedbackHTML(r)}
  </article>`;
}

// 이번 주(월~일) 표시: 기록이 하나라도 있으면 ✓ (연속 주 수·빠진 주는 세지 않아요)
function englishWeekLabel() {
  const mon = mondayOf(todayStr());
  const sun = addDays(mon, 6);
  const has = ofType('englishArticle').some((r) => r.date >= mon && r.date <= sun);
  const f = (d) => `${parseDate(d).getMonth() + 1}/${parseDate(d).getDate()}`;
  return `이번 주 ${has ? '✓ ' : ''}(${f(mon)} ~ ${f(sun)})`;
}

function englishBodyHTML() {
  const arts = ofType('englishArticle').sort(byNewest);
  if (ui.enView === 'phrases') {
    const rows = arts.flatMap((r) => (Array.isArray(r.phrases) ? r.phrases : []).map((ph) => ({ ph, r })));
    if (!rows.length) return `<div class="empty">${esc(EMPTY_TEXT.phrases)}</div>`;
    return rows.map(({ ph, r }) => `<button type="button" class="card phrase-item" data-act="goto" data-id="${esc(r.id)}" title="누르면 그 기사로 가요">
      <b>${esc(ph)}</b><span class="meta">${esc(dayLabel(r.date))} · ${esc(r.title || domainOf(r.link) || '영어 기사')}</span></button>`).join('');
  }
  if (ui.enView === 'speak') {
    const rows = arts.filter((r) => r.speak);
    if (!rows.length) return `<div class="empty">${esc(EMPTY_TEXT.speak)}</div>`;
    return rows.map((r) => `<div class="card speak-item" data-rid="${esc(r.id)}">
      <div class="row between"><div><button type="button" class="link-btn" data-act="goto" data-id="${esc(r.id)}"><b>${esc(r.title || domainOf(r.link) || '영어 기사')}</b></button>
        <div class="meta">${esc(dayLabel(r.date))}</div></div>
        <label class="meta"><input type="checkbox" data-en-speak="${esc(r.id)}" checked> 말해 볼 주제</label></div>
      ${hasValue(r.sum1) ? `<p class="pre" style="margin:6px 0 0">1. ${esc(r.sum1)}</p>` : ''}
    </div>`).join('');
  }
  if (ui.enView === 'feedback') return feedbackViewHTML('english');
  return `<p class="meta area-line" id="enWeek">${esc(englishWeekLabel())}</p>${arts.length ? arts.map(englishCard).join('') : `<div class="empty">${esc(EMPTY_TEXT.english)}</div>`}`;
}

function renderEnglish() {
  view.innerHTML = `
    <h2 class="page-title">영어</h2>
    <p class="page-sub">일주일에 기사 하나, 세 줄로 정리해요.</p>
    <div class="row actions-row add-row">
      <button type="button" class="btn" data-act="add" data-type="englishArticle">＋ 이번 주 기사 추가</button>
    </div>
    <div class="chips">${viewChips('enView', ui.enView, [['list', '📖 기사'], ['phrases', '💬 표현 모음'], ['speak', '🗣 말해 볼 주제'], ['feedback', '💬 피드백']])}</div>
    ${englishBodyHTML()}`;
}

/* ---------------------------------------------------------------------
   10-2. 메뉴 4: 캘린더 (2026년부터, 한눈에 보기)
   --------------------------------------------------------------------- */
// 달력에 표시할 종류 (icon: 달력에 보이는 그림, label: 이름, chip: 위쪽 종류 버튼)
const CAL_CATS = [
  { id: 'workout', chip: 'workout', icon: '🧘', label: '운동', test: (r) => r.type === 'workout' },
  { id: 'practice', chip: 'violin', icon: '🎻', label: '바이올린 연습', test: (r) => r.type === 'violin' && r.kind !== '레슨' },
  { id: 'lesson', chip: 'violin', icon: '🎓', label: '레슨', test: (r) => r.type === 'violin' && r.kind === '레슨' },
  { id: 'routine', chip: 'routine', icon: '✅', label: '경제 루틴', iconOnly: true, test: (r) => r.type === 'econRoutine' },
  { id: 'english', chip: 'english', icon: '📰', label: '영어', iconOnly: true, test: (r) => r.type === 'englishArticle' },
  { id: 'art', chip: 'art', icon: '🎨', label: '그림', test: (r) => r.type === 'art' },
  { id: 'rest', chip: 'rest', icon: '😴', label: '쉼', test: (r) => r.type === 'rest' },
];
// 달력 위쪽의 종류 버튼 (바이올린 버튼 하나가 연습과 레슨을 함께 켜고 꺼요)
const CAL_CHIPS = [
  { id: 'workout', icon: '🧘', label: '운동' },
  { id: 'violin', icon: '🎻', label: '바이올린' },
  { id: 'routine', icon: '🎧', label: '경제 루틴' },
  { id: 'english', icon: '📰', label: '영어' },
  { id: 'art', icon: '🎨', label: '그림' },
  { id: 'rest', icon: '😴', label: '쉼' },
];
const catOf = (r) => CAL_CATS.find((c) => c.test(r));
// 기록 하나의 그림 (슬로조깅은 🏃)
const iconOf = (r) => (r.type === 'workout' && r.kind === '슬로조깅' ? '🏃' : (catOf(r) || {}).icon || '📝');

function calTitle(r) {
  switch (r.type) {
    case 'workout': return r.kind || '운동';
    case 'violin': return r.kind === '레슨' ? '레슨' : (pieceNamesOf(r)[0] || '연습');
    case 'econRoutine': return '경제 루틴';
    case 'englishArticle': return r.title || domainOf(r.link) || '영어 기사';
    case 'rest': return '쉼';
    default: return r.topic || artKindOf(r);
  }
}

const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// 머리 줄 맨 앞의 [오늘] 버튼 (캘린더와 도장 모음판이 함께 써요). 항상 같은 자리에 있어요.
// 다른 달을 보고 있으면 이번 달로 가기만 해요. 이미 이번 달이면 흐리게 보이고, 눌러도 아무 일도 없어요.
const todayBtnHTML = (act, here) => `<button type="button" class="btn ghost small cal-today-btn${here ? ' dim' : ''}" data-act="${act}"${here ? ' aria-disabled="true"' : ''} title="${here ? '지금 이번 달이에요' : '이번 달로 가요'}" aria-label="오늘로 가기">오늘</button>`;

function renderCalendar() {
  const today = todayStr();
  view.dataset.today = today; // 밤새 창을 열어 두었다가 날짜가 바뀌면 다시 그리려고 기억해 둬요
  if (!ui.calMonth) ui.calMonth = today.slice(0, 7);
  if (ui.calMonth < CALENDAR_START) ui.calMonth = CALENDAR_START;
  const [y, m] = ui.calMonth.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 월요일 시작
  const dayCount = new Date(y, m, 0).getDate();

  // 이 달의 기록을 날짜별·종류별로 모아요
  const byDate = new Map();
  const monthCount = new Map();
  records.forEach((r) => {
    if (!r.date || r.date.slice(0, 7) !== ui.calMonth) return;
    const c = catOf(r);
    if (!c) return;
    if (c.id === 'routine' && !routineIcons(r).length) return; // 체크한 항목이 없는 날(한 줄만 남긴 날)은 달력에 표시하지 않아요
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
    const withAmt = groups.flatMap((g) => g.items).filter((r) => amountOf(r) && supportsAmount(r.type, r.kind));
    const top = Math.max(0, ...withAmt.map((r) => amountOf(r).v)); // 그날 가장 높은 연습량·운동량
    const topRec = withAmt.find((r) => amountOf(r).v === top);
    const onlyRest = groups.length > 0 && groups.every((g) => g.c.id === 'rest');
    const shade = `${groups.length && !onlyRest ? ' has' : ''}${onlyRest ? ' rest-only' : ''}${top ? ` amt${top}` : ''}`;
    cells.push(`<button type="button" class="cal-cell${shade}${date === today ? ' today' : ''}" data-act="calDay" data-date="${date}" aria-label="${esc(dayLabel(date))}, ${esc(say)}${top ? `, ${amountWord(topRec)} ${AMOUNTS[top - 1].label}` : ''}">
      <span class="cal-num">${d}</span>
      <span class="cal-marks">${groups.map((g) => (g.c.iconOnly
        ? `<span class="cal-mark icon-only ${g.c.id}" title="${esc(g.c.label)}">${(g.c.id === 'routine' ? routineIcons(g.items[0]) : [g.c.icon]).map((i) => `<span class="cal-ico">${i}</span>`).join('')}</span>` // 그림만 (루틴은 그날 체크한 항목, 영어는 📰)
        : `<span class="cal-mark${g.c.id === 'rest' ? ' rest' : ''}" title="${esc(g.c.label)}"><span class="cal-ico">${g.c.icon}</span>${g.items.length > 1 ? `<sup>${g.items.length}</sup>` : ''}<span class="cal-t">${esc(calTitle(g.items[0]))}</span></span>`)).join('')}</span>
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
      ${todayBtnHTML('calToday', ui.calMonth === today.slice(0, 7))}
      <button type="button" class="btn ghost small" data-act="calShift" data-d="-1" ${ui.calMonth <= CALENDAR_START ? 'disabled' : ''}>◀ 이전 달</button>
      <span class="cal-pick"><select class="search" data-cal="year" aria-label="연도" style="min-width:0">${yearOpts.join('')}</select>
      <select class="search" data-cal="month" aria-label="월" style="min-width:0">${monthOpts}</select></span>
      <button type="button" class="btn ghost small" data-act="calShift" data-d="1">다음 달 ▶</button>
    </div>
    ${filled}
    <div class="chips">${CAL_CHIPS.filter((c) => c.id !== 'art' || records.some((r) => r.type === 'art')).map((c) => `<button type="button" class="chip ${ui.calHidden.has(c.id) ? '' : 'active'}" data-act="calCat" data-id="${c.id}" aria-pressed="${!ui.calHidden.has(c.id)}">${c.icon} ${esc(c.label)}</button>`).join('')}</div>
    <div class="cal-grid" role="grid" aria-label="${y}년 ${m}월">
      ${['월', '화', '수', '목', '금', '토', '일'].map((w) => `<div class="cal-dow">${w}</div>`).join('')}
      ${cells.join('')}
    </div>
    <p class="meta" style="margin-top:12px">${summary ? `${y}년 ${m}월의 기록: ${summary}` : `${y}년 ${m}월에는 기록이 없어요.`}</p>
    <div class="row" style="margin-top:14px">
      <button type="button" class="btn purple" data-act="recap">📖 ${ui.calMonth === today.slice(0, 7) ? '이번 달' : `${m}월`} 돌아보기</button>
      <button type="button" class="btn ghost purple" data-act="board">💮 도장 모음판</button>
    </div>
    ${older ? `<p class="meta">${startYear}년 이전 기록 ${older}개는 달력에 나타나지 않아요. (각 메뉴의 목록에서는 볼 수 있어요.)</p>` : ''}
    ${claudeBoxHTML()}
    ${memoryHTML(today)}`;
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
   💮 도장 모음판: 기록을 남기고 받은 도장이 받은 순서대로 한 달에 한 장씩 차곡차곡 붙어요.
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
    <h2>💮 도장 모음판</h2>
    <div class="row board-nav">
      ${todayBtnHTML('boardToday', ym === todayStr().slice(0, 7))}
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
    const rows = CAL_CATS.filter((cat) => cat.id !== 'routine').map((cat) => { // 경제 루틴은 아래 "경제 루틴" 항목에서 따로 보여줘요
      const items = c.real.filter((r) => cat.test(r));
      const sub = cat.id === 'workout' ? kinds.map((k) => [k, items.filter((r) => r.kind === k).length]).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(' · ') : '';
      return [cat.icon, `${cat.label}${sub && items.length ? ` (${sub})` : ''}`, items.length];
    }).filter((row) => row[2]);
    return rows.length ? { title: '종류별 횟수', html: chipsOf(rows) } : null;
  } },
  { id: 'amount', build: (c) => { // 운동은 "운동량", 바이올린·그림은 "연습량"으로 따로 세요 (개수만)
    const all = c.real.filter((r) => amountOf(r) && supportsAmount(r.type, r.kind));
    const rowsOf = (list) => AMOUNTS.map((a) => [a.icon, a.label, list.filter((r) => amountOf(r).v === a.v).length]).filter((row) => row[2]);
    const ex = rowsOf(all.filter((r) => r.type === 'workout'));
    const pr = rowsOf(all.filter((r) => r.type !== 'workout'));
    if (ex.length && pr.length) return { title: '운동량 · 연습량 (개수만)', html: `<div class="label">운동량</div>${chipsOf(ex)}<div class="label">연습량</div>${chipsOf(pr)}` };
    if (ex.length) return { title: '운동량 (개수만)', html: chipsOf(ex) };
    return pr.length ? { title: '연습량 (개수만)', html: chipsOf(pr) } : null;
  } },
  { id: 'piece', build: (c) => {
    const byPiece = new Map(); // 곡 이름 → 연습한 날들
    c.real.filter((r) => r.type === 'violin' && r.kind !== '레슨').forEach((r) => pieceNamesOf(r).forEach((k) => {
      if (!byPiece.has(k)) byPiece.set(k, new Set());
      byPiece.get(k).add(r.date);
    }));
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
  { id: 'routine', build: (c) => { // 경제 루틴: 🎧 N번 · 📮 N번 과 이번 달 "오늘 한 줄" (다른 달과 비교하지 않아요)
    const mine = c.real.filter((r) => r.type === 'econRoutine');
    const counts = ECON_ROUTINES.map((x) => `${x.icon} ${mine.filter((r) => routineChecked(r, x.id)).length}번`);
    const notes = mine.filter((r) => hasValue(r.note)).sort(byNewest);
    if (!mine.some((r) => routineIcons(r).length) && !notes.length) return null;
    return { title: '경제 루틴', html: `<p class="recap-big">${counts.map(esc).join(' · ')}</p>${notes.length ? `<div class="label">오늘 한 줄</div><ul class="note-list">${notes.map((r) => `<li><span class="meta">${esc(shortDay(r.date))}</span><span class="pre">${esc(r.note)}</span></li>`).join('')}</ul>` : ''}` };
  } },
  { id: 'art', build: (c) => { // 그림: "크로키 N장 · 모작 N장 · 창작 N장" + 이 달의 썸네일 (기록마다 첫 장, 최대 6장)
    const list = c.real.filter((r) => r.type === 'art').sort(byOldest);
    if (!list.length) return null;
    const counts = ART_KINDS.map((k) => [k, list.filter((r) => artKindOf(r) === k).reduce((n, r) => n + artCount(r), 0)]).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}장`);
    const thumbs = list.filter((r) => artPhotos(r).length).slice(-6);
    return { title: '그림', html: `<p class="recap-big">${counts.map(esc).join(' · ')}</p>${thumbs.length ? `<div class="recap-thumbs">${thumbs.map((r) => `<img class="recap-thumb" src="${esc(artPhotos(r)[0])}" alt="${esc(artTitle(r))}" title="${esc(shortDay(r.date))}">`).join('')}</div>` : ''}` };
  } },
  { id: 'lessons', build: (c) => {
    const ls = c.real.filter((r) => r.type === 'violin' && r.kind === '레슨' && ((r.feedback || '').trim() || hasValue(r.praise) || hasValue(r.newLearn))).sort(byOldest);
    if (!ls.length) return null;
    return { title: '레슨 피드백 모음', html: ls.map((r) => `<div class="recap-quote"><div class="meta">${esc(dayLabel(r.date))}</div>${hasValue(r.feedback) ? `<p class="pre">${esc(r.feedback)}</p>` : ''}${hasValue(r.praise) ? `<p class="pre">👍 ${esc(r.praise)}</p>` : ''}${hasValue(r.newLearn) ? `<p class="pre">📝 ${esc(r.newLearn)}</p>` : ''}</div>`).join('') };
  } },
  { id: 'english', build: (c) => { // 영어: 이번 달 기사 수와 가져갈 표현 (다른 달과 비교하지 않아요)
    const mine = c.real.filter((r) => r.type === 'englishArticle').sort(byOldest);
    if (!mine.length) return null;
    const phrases = mine.flatMap((r) => (Array.isArray(r.phrases) ? r.phrases : []).map((ph) => ({ ph, r })));
    return { title: '영어', html: `<p class="recap-big">📰 기사 ${mine.length}개</p>${phrases.length ? `<div class="label">가져갈 표현</div><ul class="note-list">${phrases.map(({ ph, r }) => `<li><span class="meta">${esc(shortDay(r.date))}</span><span class="pre">${esc(ph)}</span></li>`).join('')}</ul>` : ''}` };
  } },
  { id: 'feedbackTodos', build: (c) => { // 💬 이번 달 받은 해볼 것 (해봤음 표시만. 개수·퍼센트는 없어요)
    const list = records.filter((r) => r.type === 'claudeFeedback' && !r.sample && hasValue(r.todo) && (r.date || '').slice(0, 7) === c.ym).sort(byOldest);
    if (!list.length) return null;
    return { title: '💬 이번 달 받은 해볼 것', html: `<ul class="note-list">${list.map((f) => `<li><span class="meta">${esc(shortDay(f.date))}</span><span class="pre">${scopeMeta(f.scope).icon} ${esc(f.todo)}${f.todoDone ? ' <span class="fb-done-mark">✓ 해봤음</span>' : ''}</span></li>`).join('')}</ul>` };
  } },
  { id: 'stamps', build: (c) => (c.real.length ? { title: '이 달의 도장판', html: stampButtons([...c.real].sort(byReceived), true) } : null) }, // 💮 도장 모음판을 작게
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

// 날짜 창 안의 경제 루틴 카드 (체크한 것·읽은 뉴스레터·한 줄·태그를 보여줘요. 체크 켜고 끄기는 경제 화면의 "이번 주"에서 해요)
function routineDayCard(r) {
  const items = ECON_ROUTINES.filter((x) => routineChecked(r, x.id));
  const letters = Array.isArray(r.letters) ? r.letters : [];
  return `<div class="card" data-rid="${esc(r.id)}">
    <div><span class="tag">✅ 경제 루틴</span> ${items.length ? items.map((x) => `<span class="rt-day-item">${x.icon} ${esc(x.label)}</span>`).join(' · ') : '<span class="meta">체크한 항목은 없어요</span>'}</div>
    ${letters.length ? `<div class="chip-line"><span class="chip-label">읽은 뉴스레터</span>${letters.map((c) => `<span class="tag chip-tag">${esc(c)}</span>`).join('')}</div>` : ''}
    ${hasValue(r.note) ? textBlock('오늘 한 줄', r.note) : ''}
  </div>`;
}

// 날짜를 누르면 그날의 기록을 한 창에 모아 보여줘요
function openDay(date) {
  ui.dayOpen = date;
  const list = records.filter((r) => r.date === date && catOf(r)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const card = { workout: workoutCard, violin: violinCard, econRoutine: routineDayCard, englishArticle: englishCard, art: artDayCard, rest: restCard };
  const add = [['workout', '운동'], ['violin', '바이올린'], ['englishArticle', '영어 기사']]
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

// extra.stamp: 맨 앞에 크게 찍히는 도장 그림
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
  if (!c || !rec.date || c.id === 'routine') return ''; // 경제 루틴 체크는 축하 문구 없이 도장만 나와요
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

// 새 기록을 저장하기 직전에 부르면, 이 기록이 받는 도장을 골라서 기록에 남겨 둬요(stamp). 💮 도장 모음판이 이 그림을 써요.
// 쉰 날은 늘 😴 도장이에요. remember=false 이면 화면에 보여줄 한 마디는 따로 기억하지 않아요.
const stampPhrases = new Map();
function assignStamp(rec, remember = true) {
  const s = pickStamp(rec);
  if (rec.type === 'rest') s.icon = '😴';
  rec.stamp = s.icon;
  if (remember) stampPhrases.set(rec.id, s);
  return rec;
}

// 새 기록을 저장한 직후에 부르는 함수. 축하 한 줄(도장)을 잠깐 보여줘요. (축하를 꺼 두면 아무것도 안 보여요)
function afterNewRecord(rec) {
  const s = stampPhrases.get(rec.id) || pickStamp(rec);
  stampPhrases.delete(rec.id);
  if (settings.celebrateOff) return;
  const m = milestoneText(rec);
  if (m) { toast(m, 5000); return; }
  toast(s.text, 5000, { stamp: s.icon });
}

// 사진 파일(여러 장도 돼요) → 사진이 붙은 새 그림 올리기 창. 여러 장은 기록 하나로 묶여요.
async function addArtFromFiles(files) {
  const imgs = files.filter(isImage);
  if (!imgs.length) { toast('이미지 파일(사진)만 올릴 수 있어요.'); return; }
  openForm('art', undefined, undefined, { artKind: '크로키' });
  const dateInput = $('#f_date');
  if (dateInput) dateInput.value = dateOfFile(imgs[0]); // 사진 파일의 날짜를 미리 넣어 둬요 (바꿀 수 있어요)
  await attachShots(imgs);
}

const hasFiles = (e) => !!(e.dataTransfer && [...e.dataTransfer.types].includes('Files'));
const imgFormOpen = () => dlg.open && !!dlg.querySelector('#dropZone, .dropzone[data-key]');
const firstImageKey = () => { const z = dlg.querySelector('.dropzone[data-key]'); return z ? z.dataset.key : 'image'; };
const multiFormOpen = () => dlg.open && !!dlg.querySelector('#dropZone[data-multi]');
// 사진을 화면에 바로 놓았을 때 새 기록이 만들어지는 화면: 🎈 놀이터(그림 기록)
const dropTarget = () => (dlg.open ? null : ui.tab === 'art' ? 'art' : null);
const DROP_HINT = { art: '🖼 여기에 놓으면 그림 올리기 창이 열려요' };
let dragTimer = null;

function endDrag() {
  clearTimeout(dragTimer);
  $('#dropOverlay').hidden = true;
  document.querySelectorAll('.dropzone.over').forEach((z) => z.classList.remove('over'));
  document.querySelectorAll('.audio-drop.over').forEach((a) => a.classList.remove('over'));
}

document.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault(); // 이렇게 해야 브라우저가 사진을 열어 버리면서 기록장이 사라지지 않아요
  document.querySelectorAll('.dropzone').forEach((z) => z.classList.toggle('over', !!(e.target.closest && e.target.closest('.dropzone') === z)));
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
    const onSingle = e.target.closest && e.target.closest('.dropzone[data-key]'); // 한 장짜리 칸(원본 사진)에 놓았으면 그 칸에 들어가요
    if (multiFormOpen() && !onSingle) await attachShots(imgs);
    else {
      const zone = onSingle; // 놓은 자리의 칸에 들어가요
      const key = zone ? zone.dataset.key : firstImageKey();
      if (await attachImage(imgs[0], key) && imgs.length > 1) {
        const note = $(`#imgNote_${key}`);
        if (note) note.textContent = '한 칸에는 그림을 한 장만 넣을 수 있어서 첫 번째만 넣었어요. 여러 장은 놀이터에 한꺼번에 놓아 보세요.';
      }
    }
  } else if (target === 'art') {
    await addArtFromFiles(files);
  } else if (!dlg.open) {
    toast(`사진은 ${PLAYGROUND.icon} ${PLAYGROUND.name}에 끌어다 놓아 주세요.`);
  }
});

// Ctrl+V(붙여넣기): 캡처하거나 복사한 그림을 바로 넣어요
document.addEventListener('paste', async (e) => {
  const imgs = [...(e.clipboardData ? e.clipboardData.files : [])].filter(isImage);
  if (!imgs.length) return;
  const target = dropTarget();
  if (imgFormOpen()) { e.preventDefault(); if (multiFormOpen()) await attachShots(imgs); else await attachImage(imgs[0], firstImageKey()); }
  else if (target === 'art') { e.preventDefault(); await addArtFromFiles(imgs); }
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
  const at = Date.now();
  const meta = { id: newId(), piece, date: date || todayStr(), memo: memo || '', createdAt: at, updatedAt: at, size: file.size, mime, name: name || file.name || '', first: list.length === 0, recId: recId || '' };
  try {
    await AudioStore.put({ ...meta, blob: new Blob([file], { type: mime }) });
  } catch (e) { alert('녹음을 저장하지 못했어요. 저장 공간이 부족할 수 있어요.'); return false; }
  audios.push({ ...meta, local: true });
  if (victim) await dropAudio(victim.id);
  if (meta.first) scheduleAutosave();
  if (window.Sync) window.Sync.notify(); // ☁ 로그인 상태면 Drive에도 올라가요 (파일을 먼저, 정보는 그 뒤에)
  return true;
}

/* ---- 녹음 저장소 ↔ 메모리 (☁ 동기화가 같이 써요) ---- */
const isAudioTomb = (r) => !!(r && r.deletedAt);
// 저장된 줄 → 화면용 정보. 파일은 빼고, 이 기기에 파일이 있는지만 local 로 알려요. (바꾼 시각이 없던 예전 녹음은 올린 시각으로 봐요)
function audioInfo(row) { const { blob, ...meta } = row; meta.local = !!blob; if (!meta.updatedAt) meta.updatedAt = meta.createdAt || 0; return meta; }
function loadAudioRows(rows) {
  audioTombs = rows.filter(isAudioTomb);
  audios = rows.filter((r) => !isAudioTomb(r)).map(audioInfo);
}
async function reloadAudios() { if (AudioStore.ok()) loadAudioRows(await AudioStore.all()); }
// 바꾼 시각(updatedAt)이 없던 예전 녹음에 올린 시각을 한 번 적어 둬요 (☁ 동기화가 기준으로 써요)
async function backfillAudioTimes(rows) {
  for (const r of rows) {
    if (isAudioTomb(r) || r.updatedAt) continue;
    try { await AudioStore.update(r.id, (cur) => (cur && !cur.updatedAt ? { ...cur, updatedAt: cur.createdAt || Date.now() } : undefined)); } catch (e) { /* 괜찮아요. 이번 사용에는 올린 시각으로 봐요 */ }
  }
}

// ☁ 동기화가 가져온 녹음 변경을 반영해요.
//   put: 녹음 정보 줄 (파일이 없어도 돼요. 이 기기에 이미 있는 파일은 그대로 남겨요) · tombs: 삭제 표시 · drop: 흔적 없이 지울 id
async function applyAudioChanges({ put = [], tombs = [], drop = [] }) {
  if (!AudioStore.ok()) return;
  for (const r of put) await AudioStore.update(r.id, (cur) => ({ ...(cur && !isAudioTomb(cur) ? cur : {}), ...r }));
  for (const t of tombs) await AudioStore.update(t.id, () => ({ ...t })); // 같은 id 자리를 삭제 표시로 바꿔요 (파일도 함께 사라져요)
  if (drop.length) await AudioStore.remove(drop);
  const gone = new Set([...tombs.map((t) => t.id), ...drop]);
  gone.forEach((id) => { if (cardPlayer.aid === id && cardPlayer.el) cardPlayer.el.pause(); audioB64.delete(id); });
  const putMap = new Map(put.map((r) => [r.id, r]));
  audios = audios.filter((a) => !gone.has(a.id)).map((a) => (putMap.has(a.id) ? { ...a, ...putMap.get(a.id) } : a))
    .concat(put.filter((r) => !gone.has(r.id) && !audios.some((a) => a.id === r.id)).map((r) => ({ ...r, local: false })));
  const ids = new Set([...putMap.keys(), ...gone]);
  audioTombs = audioTombs.filter((t) => !ids.has(t.id)).concat(tombs);
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
  // 파일은 지우고, 같은 id 자리에 작은 "삭제 표시"만 남겨요. (☁ 다른 기기가 "지운 것"과 "아직 못 받은 것"을 구분하게요. rf: Drive 파일을 휴지통으로 보내려고 기억해 둬요)
  const at = Math.max(Date.now(), (a.updatedAt || 0) + 1);
  const tomb = { id, piece: a.piece, deletedAt: at, updatedAt: at, rf: a.rf || '' };
  try { await AudioStore.put(tomb); } catch (e) { try { await AudioStore.remove([id]); } catch (e2) { /* 이미 없어도 괜찮아요 */ } }
  audios = audios.filter((x) => x.id !== id);
  audioTombs = [...audioTombs.filter((t) => t.id !== id), tomb];
  audioB64.delete(id);
  if (a.first) scheduleAutosave();
  if (window.Sync) window.Sync.notify();
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
  const at = Math.max(Date.now(), (a.updatedAt || 0) + 1); // 바꾼 시각은 늘 앞으로만 가요 (☁ 동기화가 어느 쪽이 바뀌었나 알아보는 기준이에요)
  try {
    await AudioStore.update(id, (row) => (row ? { ...row, memo, updatedAt: at } : undefined));
  } catch (e) { return; }
  const cur = audios.find((x) => x.id === id) || a;
  cur.memo = memo; cur.updatedAt = at;
  if (cur.first) scheduleAutosave();
  toast('녹음 메모를 남겼어요.', 1800);
  if (window.Sync) window.Sync.notify();
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
  const info = audios.find((x) => x.id === aid);
  if (info && !info.local && !(await fetchAudioFile(aid))) return; // 다른 기기에서 올린 녹음이면 Drive에서 먼저 받아요 (진행은 ☁ 표시로 보여요)
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
// 재생 칸. 다른 기기에서 올려서 아직 이 기기에 파일이 없는 녹음은 "☁ 눌러서 받기" 버튼이에요 (받고 나면 재생 칸으로 바뀌어요)
function audioPlayerHTML(a) {
  return a.local
    ? `<audio class="rec-player" controls preload="metadata" data-aid="${esc(a.id)}"></audio>`
    : `<button type="button" class="btn ghost small rec-fetch" data-act="fetchAudio" data-aid="${esc(a.id)}">${esc(window.Sync ? window.Sync.fetchLabel(a) : '☁ Drive에 있어요')}</button>`;
}
function audioRowHTML(a) {
  return `<div class="rec-row" data-aid="${esc(a.id)}">
    <div class="rec-row-head">
      ${a.first ? '<span class="tag first-rec">🌱 첫 녹음</span>' : ''}<span class="rec-date">${esc(dayLabel(a.date))}</span>
      <input class="rec-memo" type="text" maxlength="120" data-audio-memo="${esc(a.id)}" value="${esc(a.memo)}" placeholder="메모 - 선택" aria-label="녹음 메모">
      <span class="rec-cloud" data-aid="${esc(a.id)}">${esc(window.Sync ? window.Sync.audioBadge(a) : '')}</span>
      <button type="button" class="btn ghost small" data-act="saveAudio" data-aid="${esc(a.id)}" title="녹음 파일을 이 컴퓨터(기기)에 저장해요">⬇ 파일로 저장</button>
      <button type="button" class="btn danger small" data-act="delAudio" data-aid="${esc(a.id)}">삭제</button>
    </div>
    ${audioPlayerHTML(a)}
  </div>`;
}

// 다른 기기에서 올린 녹음의 파일을 Drive에서 받아 이 기기에 보관해요. 이 기기에 파일이 있으면 true
async function fetchAudioFile(aid) {
  const a = audios.find((x) => x.id === aid);
  if (!a) return false;
  if (a.local) return true;
  if (!window.Sync || !(await window.Sync.fetchAudio(aid))) return false;
  const now = audios.find((x) => x.id === aid);
  if (dlg.open) refreshAudioUI(); else render();
  return !!(now && now.local);
}

// ⬇ 파일로 저장: 원래 파일 형식 그대로. 이름은 원래 파일 이름이 있으면 그것, 없으면 "곡이름_날짜.확장자"
const AUDIO_EXT_BY_MIME = { 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/amr': 'amr', 'audio/x-ms-wma': 'wma', 'audio/aiff': 'aiff', 'audio/x-caf': 'caf', 'audio/3gpp': '3gp' };
function audioFileName(a) {
  const clean = (s) => String(s).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  const ext = extOf(a.name) || AUDIO_EXT_BY_MIME[a.mime] || 'm4a';
  if (a.name && clean(a.name)) return extOf(a.name) ? clean(a.name) : `${clean(a.name)}.${ext}`;
  return `${clean(a.piece) || '녹음'}_${a.date || todayStr()}.${ext}`;
}
async function saveAudioFile(aid) {
  const a = audios.find((x) => x.id === aid);
  if (!a) return;
  if (!a.local && !(await fetchAudioFile(aid))) return; // 다른 기기에서 올린 것이면 Drive에서 받은 다음 저장해요
  let full = null;
  try { full = await AudioStore.get(aid); } catch (e) { /* 아래에서 알려줘요 */ }
  if (!full || !full.blob) { toast('녹음 파일을 찾을 수 없어요.'); return; }
  const name = audioFileName(audios.find((x) => x.id === aid) || a);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(full.blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  toast(`⬇ "${name}" 파일로 저장했어요. (다운로드 폴더를 확인해 주세요)`, 4000);
}

// 처음 vs 지금: 첫 녹음(없으면 가장 오래된 것)과 가장 최근 녹음을 나란히
function audioPairHTML(list) {
  if (list.length < 2) return '';
  const start = list.find((a) => a.first) || list[0];
  const now = list.filter((a) => a.id !== start.id).pop();
  const col = (title, a) => `<div class="rec-pair-col"><div class="label" style="margin-top:0">${title} <span class="meta">${esc(dayLabel(a.date))}${a.memo ? ` · ${esc(a.memo)}` : ''}</span></div>
    ${audioPlayerHTML(a)}</div>`;
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
      if (!a || typeof a.id !== 'string' || typeof a.data !== 'string' || !pieceKey(a.piece)) continue;
      const mine = audios.find((x) => x.id === a.id);
      if (mine && mine.local) continue; // 이 기기에 이미 있는 녹음은 그대로 둬요
      const have = audiosOf(a.piece);
      if (!mine && have.length >= AUDIO_MAX_PER_PIECE) continue;
      const blob = await (await fetch(a.data)).blob();
      const gone = audioTombs.find((t) => t.id === a.id); // 지웠던 녹음을 백업에서 되살리는 경우는 "새로 고친 것"으로 봐요 (☁ 동기화에서 삭제가 다시 덮어쓰지 않게)
      const at = Math.max(Date.now(), gone ? gone.updatedAt + 1 : 0, mine ? mine.updatedAt + 1 : 0);
      const meta = { id: a.id, piece: pieceKey(a.piece), date: typeof a.date === 'string' ? a.date : todayStr(), memo: typeof a.memo === 'string' ? a.memo : '', createdAt: Number(a.createdAt) || Date.now(), updatedAt: at, size: blob.size, mime: typeof a.mime === 'string' && a.mime ? a.mime : blob.type || 'audio/mpeg', name: typeof a.name === 'string' ? a.name : '', first: !!a.first && !have.some((x) => x.first && x.id !== a.id), recId: typeof a.recId === 'string' ? a.recId : '', ...(mine && mine.rf ? { rf: mine.rf } : {}) };
      await AudioStore.put({ ...meta, blob: new Blob([blob], { type: meta.mime }) });
      audios = audios.filter((x) => x.id !== a.id).concat({ ...meta, local: true });
      audioTombs = audioTombs.filter((t) => t.id !== a.id);
      added += 1;
    } catch (e) { /* 이 녹음만 건너뛰어요 */ }
  }
  if (added && window.Sync) window.Sync.notify();
  return added;
}

/* ---------------------------------------------------------------------
   10-5. 🎻 교재 관리 (바이올린 기록 창의 "⚙︎ 교재 관리"): 추가 · 숨기기 · 순서 바꾸기 · 숨긴 교재 다시 보이기
   숨겨도 지우는 게 아니라서, 예전 기록에는 교재 이름이 그대로 보여요.
   --------------------------------------------------------------------- */
const dlg2 = document.getElementById('dlg2');

function openBooksManager(msg = '') {
  const list = textbookList();
  const visIdx = list.map((b, i) => (b.hidden ? -1 : i)).filter((i) => i >= 0);
  const row = (i, pos) => `<li class="bk-row"><span class="bk-name">${esc(list[i].name)}</span>
      <span class="bk-btns">
        <button type="button" class="btn ghost small" data-act="bookMove" data-i="${i}" data-d="-1" ${pos === 0 ? 'disabled' : ''} aria-label="${esc(list[i].name)} 위로">▲</button>
        <button type="button" class="btn ghost small" data-act="bookMove" data-i="${i}" data-d="1" ${pos === visIdx.length - 1 ? 'disabled' : ''} aria-label="${esc(list[i].name)} 아래로">▼</button>
        <button type="button" class="btn ghost small" data-act="bookHide" data-i="${i}">숨기기</button>
      </span></li>`;
  const hidden = list.map((b, i) => (b.hidden ? i : -1)).filter((i) => i >= 0);
  dlg2.innerHTML = `<div class="dlg-body">
    <h2>⚙︎ 교재 관리</h2>
    <form id="bookAddForm" class="row" novalidate>
      <input id="bookNew" class="search" type="text" maxlength="40" autocomplete="off" placeholder="교재 이름 (예: 스즈키 5권)" style="flex:1">
      <button type="submit" class="btn purple">추가</button>
    </form>
    <p class="hint" id="bookMsg" role="status">${esc(msg)}</p>
    ${visIdx.length ? `<ul class="bk-list">${visIdx.map((i, pos) => row(i, pos)).join('')}</ul>` : '<p class="meta">보이는 교재가 없어요. 위에서 추가해 보세요.</p>'}
    ${hidden.length ? `<div class="label" style="margin-top:14px">숨긴 교재 <span class="meta">(예전 기록에는 그대로 보여요)</span></div>
      <ul class="bk-list dim">${hidden.map((i) => `<li class="bk-row"><span class="bk-name">${esc(list[i].name)}</span><span class="bk-btns"><button type="button" class="btn ghost small" data-act="bookShow" data-i="${i}">다시 보이기</button></span></li>`).join('')}</ul>` : ''}
    <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg2">닫기</button></div>
  </div>`;
  if (!dlg2.open) dlg2.showModal();
  const input = dlg2.querySelector('#bookNew');
  if (input && !msg) input.focus();
}

// 목록을 바꾸고 저장한 뒤, 열려 있는 창의 교재 칩도 새로 그려요 (이미 고른 것은 그대로 남아요)
async function saveBooks(list, msg = '') {
  await setConfig('textbooks', list);
  openBooksManager(msg);
  refreshBooksChips();
}

function refreshBooksChips() {
  const box = dlg.querySelector('.field[data-key=books] .choice');
  if (!box) return;
  readBookDraft();
  const cur = selectedBookNames();
  box.outerHTML = choiceHTML('books', textbookChoices(), cur, true, MANAGE_BOOKS_BTN);
  const input = dlg.querySelector('input[name=books]'); // 교재 순서를 바꿨을 수 있어서 칩 순서대로 다시 적어요
  input.value = JSON.stringify([...input.closest('.choice').querySelectorAll('.choice-btn.on')].map((b) => b.dataset.val));
  syncBookRows();
}

async function addBook(name) {
  name = name.trim();
  if (!name) return;
  const list = textbookList();
  const same = list.find((b) => b.name.toLowerCase() === name.toLowerCase());
  if (same && !same.hidden) { openBooksManager('이미 있는 교재예요.'); return; }
  if (same) { same.hidden = false; await saveBooks(list, `숨겨 둔 "${same.name}"을 다시 보이게 했어요.`); return; }
  list.push({ name, hidden: false });
  await saveBooks(list, `"${name}"을 더했어요.`);
}

async function moveBook(i, d) { // 보이는 교재끼리 위·아래로 자리를 바꿔요
  const list = textbookList();
  let j = i + d;
  while (j >= 0 && j < list.length && list[j].hidden) j += d;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await saveBooks(list);
}

async function hideBook(i, hide) {
  const list = textbookList();
  if (!list[i]) return;
  list[i].hidden = hide;
  await saveBooks(list, hide ? `"${list[i].name}"을 숨겼어요. 예전 기록에는 그대로 보여요.` : `"${list[i].name}"을 다시 보이게 했어요.`);
}

dlg2.addEventListener('close', () => { dlg2.innerHTML = ''; });
dlg2.addEventListener('cancel', (e) => { e.preventDefault(); dlg2.close(); });

/* ---------------------------------------------------------------------
   10-6. 🤖 클로드에게 보내기 + 💬 받은 피드백
   기록 → 글로 복사 → 클로드에게 붙여 넣기 → 받은 답변 저장 → 해볼 것 하나 → 다음 기록 창에서 "해봤음" 체크.
   (밖으로 나가는 요청은 없어요. 복사하고 붙여 넣는 방식이에요.)
   --------------------------------------------------------------------- */
const SCOPE_OF_TYPE = { violin: 'violin', workout: 'exercise', art: 'drawing', englishArticle: 'english' };
const COPY_SCOPES = ['violin', 'exercise', 'econ', 'english']; // 메인 복사칸의 범위 (그림은 카드마다 버튼으로 보내요)
const PERIODS = [{ id: 'day', label: '오늘' }, { id: 'week', label: '이번 주' }, { id: 'month', label: '이번 달' }];
const scopeMeta = (id) => CLAUDE_SCOPES.find((x) => x.id === id) || CLAUDE_SCOPES[0];
const byCreatedDesc = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);

/* ---- 내 정보·요청 문구 (범위마다. 고치면 Store에 저장되고 백업에 들어가요) ---- */
const claudeStored = () => getConfig('claudeSettings', {}) || {};
function claudeField(scope, key) {
  const st = claudeStored()[scope];
  return st && typeof st[key] === 'string' ? st[key] : scopeMeta(scope)[key];
}
const claudeInfo = (scope) => claudeField(scope, 'info');
const claudeRequest = (scope) => claudeField(scope, 'request');

/* ---- 기간과 기록 모으기 ---- */
function claudeRange(period) {
  const t = todayStr();
  if (period === 'week') { const m = mondayOf(t); return [m, addDays(m, 6)]; }
  if (period === 'month') return [`${t.slice(0, 7)}-01`, t];
  return [t, t];
}
const SCOPE_TYPE = { violin: 'violin', exercise: 'workout', econ: 'econRoutine', english: 'englishArticle', drawing: 'art' };
const scopeRecords = (scope, start, end) => ofType(SCOPE_TYPE[scope]).filter((r) => r.date >= start && r.date <= end).sort(byOldest);
const joinList = (a) => (Array.isArray(a) ? a.join(', ') : '');

// 기록 한 줄 (채운 칸만)
function claudeLine(r) {
  const bits = [mdLabel(r.date)];
  const add = (label, v) => { if (hasValue(v)) bits.push(label ? `${label}: ${oneLine(v)}` : oneLine(v)); };
  const feel = () => { if (amountOf(r)) bits.push(`${amountWord(r)}: ${amountOf(r).label}`); if (moodOf(r)) bits.push(`기분: ${moodOf(r).label}`); };
  const done = () => { const f = r.feedbackId && records.find((x) => x.id === r.feedbackId); if (f && hasValue(f.todo)) bits.push(`해본 것(지난 제안): ${oneLine(f.todo)}`); };
  if (r.type === 'violin' && r.kind === '레슨') {
    bits.push('레슨');
    add('선생님 피드백', r.feedback); add('좋다고 한 것', r.praise); add('새로 배운 것', r.newLearn);
    if (Array.isArray(r.homework) && r.homework.length) bits.push(`과제: ${r.homework.map((t) => `[${t.done ? '완료' : '미완료'}] ${t.text}`).join(' / ')}`);
    feel();
  } else if (r.type === 'violin') {
    const bks = bookRows(r);
    add(bks.length ? '그 밖에 연습한 곡' : '곡', r.piece); add('한 것', joinList(r.whatDid));
    if (bks.length) bits.push(`교재: ${bks.map((b) => (b.piece ? `${b.name} · ${oneLine(b.piece)}` : b.name)).join(' / ')}`);
    add('교재 위치', r.bookPart); // 아직 옮기지 않은 예전 기록에만 있어요
    if (r.tempo) bits.push(`템포: ${r.tempo}`);
    feel(); add('잘 된 것', r.good); add('연습한 부분', r.part); add('다음에', r.next); add('단계', r.stage);
    if (Array.isArray(r.ask) && r.ask.length) bits.push(`레슨 때 물어볼 것: ${r.ask.map((t) => t.text).join(' / ')}`);
    done();
  } else if (r.type === 'workout') {
    bits.push(r.kind || '운동');
    if (r.distance) bits.push(`거리: ${fmtNum(r.distance)}km`);
    feel(); add('한 줄', r.memo);
    done();
  } else if (r.type === 'econRoutine') {
    ECON_ROUTINES.filter((x) => routineChecked(r, x.id)).forEach((x) => {
      const chips = x.chips && Array.isArray(r.letters) ? r.letters.filter((c) => x.chips.includes(c)) : [];
      bits.push(`${x.icon} ${x.label}${chips.length ? `(${chips.join(', ')})` : ''}`);
    });
    add('한 줄', r.note);
  } else if (r.type === 'englishArticle') {
    add('제목', r.title); add('링크', r.link);
    const sums = [r.sum1, r.sum2, r.sum3].map((t, i) => (String(t || '').trim() ? `${i + 1}) ${oneLine(t)}` : '')).filter(Boolean);
    if (sums.length) bits.push(`요약: ${sums.join(' ')}`);
    add('표현', joinList(r.phrases)); add('내 생각', r.thought);
    if (r.speak) bits.push('말해 볼 주제');
    done();
  } else if (r.type === 'art') { // 그림: 종류 · 장수 · 한 줄 · 마음에 드는 곳 · 다음에 해볼 것
    bits.push(`종류: ${artKindOf(r)}`);
    bits.push(`${artCount(r)}장`);
    add('한 줄', r.topic); feel();
    add('마음에 드는 곳', r.liked); add('다음에 해볼 것', r.next);
    done();
  }
  return bits.join(' · ');
}

// 이번 주·이번 달 요약 한 줄 (쉰 날·빈 날은 쓰지 않아요)
function claudeSummary(scope, list) {
  if (scope === 'econ') return ECON_ROUTINES.map((x) => `${x.icon} ${list.filter((r) => routineChecked(r, x.id)).length}번`).join(' · ');
  if (scope === 'english') return `기사 ${list.length}개`;
  const days = new Set(list.map((r) => r.date)).size;
  return [`기록한 날 ${days}일`, ...AMOUNTS.map((a) => `${a.label} ${list.filter((r) => amountOf(r) && supportsAmount(r.type, r.kind) && amountOf(r).v === a.v).length}`)].join(' · ');
}

// 같은 범위에서 가장 최근에 받은 "해볼 것" 최대 2개
function lastSuggestionsBlock(scope) {
  const fbs = ofType('claudeFeedback').filter((f) => f.scope === scope && hasValue(f.todo)).sort(byCreatedDesc).slice(0, 2);
  if (!fbs.length) return '';
  return [...fbs.map((f) => `지난번 받은 제안: ${oneLine(f.todo)} (${f.todoDone ? '해봤음' : '아직'})`), '이번 기록에 반영됐는지도 봐 줘.'].join('\n');
}

// 복사되는 글: 내 정보 → 요청(+공통 문장) → 물어볼 것 → 지난번 제안 → 기록 본문 → 요약 한 줄 (블록 사이는 빈 줄 하나)
function claudeText({ scope, period, list, question = '' }) {
  const blocks = [];
  const info = String(claudeInfo(scope) || '').trim();
  if (info) blocks.push(info);
  blocks.push(`${String(claudeRequest(scope) || '').trim()} ${CLAUDE_COMMON}`.trim());
  if (question.trim()) blocks.push(`이번에 특히 물어볼 것: ${oneLine(question)}`);
  const prev = lastSuggestionsBlock(scope);
  if (prev) blocks.push(prev);
  blocks.push([...list].sort(byOldest).map(claudeLine).join('\n'));
  if (period === 'week' || period === 'month') blocks.push(claudeSummary(scope, list));
  return blocks.join('\n\n');
}

/* ---- 받은 피드백 저장·바꾸기 ---- */
function feedbackStamp() {
  const phrase = FEEDBACK_STAMPS[Math.floor(Math.random() * FEEDBACK_STAMPS.length)] || '💬 피드백 저장했어요';
  const i = phrase.indexOf(' ');
  return i < 0 ? { icon: '', text: phrase } : { icon: phrase.slice(0, i), text: phrase.slice(i + 1) };
}

async function saveFeedback({ scope, period, rangeStart, rangeEnd, targetId = '', question = '', text = '', todo = '' }) {
  text = text.trim();
  todo = todo.trim();
  if (!text && !todo) { toast('붙여 넣은 답변이나 해볼 것을 적어 주세요.', 3000); return null; }
  const lastAt = ofType('claudeFeedback').reduce((m, f) => Math.max(m, f.createdAt || 0), 0);
  const at = Math.max(Date.now(), lastAt + 1); // 받은 순서가 항상 구분되게 (아주 짧은 사이에 저장해도)
  const rec = { id: newId(), type: 'claudeFeedback', date: todayStr(), scope, period, rangeStart, rangeEnd, targetId, question, text, todo, todoDone: false, createdAt: at, updatedAt: at };
  if (!(await saveRecord(rec))) return null;
  if (settings.celebrateOff) toast('피드백을 저장했어요', 3000);
  else { const s = feedbackStamp(); toast(s.text, 4000, { stamp: s.icon }); }
  return rec;
}

async function setTodoDone(id, done) {
  const f = records.find((x) => x.id === id);
  if (!f) return;
  await saveRecord({ ...f, todoDone: done, updatedAt: Date.now() });
  refreshFeedbackViews();
}

async function hideTodo(id) { // 입력 창에 더 이상 안 뜨게 (지우는 게 아니에요)
  const f = records.find((x) => x.id === id);
  if (!f) return;
  await saveRecord({ ...f, todoHidden: true, updatedAt: Date.now() });
}

const refreshFeedbackViews = () => { render(); refreshDay(); refreshArtDetail(); };

/* ---- 지난 피드백에서 "해볼 것" ---- */
// 이 범위에서 아직 해봤음 체크가 안 됐고 숨기지도 않은 가장 최근 해볼 것 하나
const pendingTodo = (scope) => ofType('claudeFeedback').filter((f) => f.scope === scope && hasValue(f.todo) && !f.todoDone && !f.todoHidden).sort(byCreatedDesc)[0];

// 입력 창 맨 위 (체크하고 저장하면 그 기록에 "오늘 해본 것"으로 연결돼요)
function feedbackHintHTML(scope, existing) {
  if (existing && existing.feedbackId) return '';
  const f = pendingTodo(scope);
  if (!f) return '';
  return `<div class="fb-hint" data-fb-hint="${esc(f.id)}"><span class="fb-hint-t">💡 지난 피드백에서: ${esc(f.todo)}</span>
    <label class="fb-hint-c"><input type="checkbox" name="feedbackDone" value="${esc(f.id)}"> 오늘 해봤음</label>
    <button type="button" class="link-btn" data-act="fbHide" data-id="${esc(f.id)}">✕ 숨기기</button></div>`;
}

// 경제 루틴 화면: 체크박스 아래 한 줄 (그 자리에서 바로 체크)
function routineHintHTML() {
  const f = pendingTodo('econ');
  if (!f) return '';
  return `<div class="fb-hint routine-hint"><span class="fb-hint-t">💡 지난 피드백에서: ${esc(f.todo)}</span>
    <label class="fb-hint-c"><input type="checkbox" data-fb-done="${esc(f.id)}"> 오늘 해봤음</label>
    <button type="button" class="link-btn" data-act="fbHide" data-id="${esc(f.id)}" data-refresh="1">✕ 숨기기</button></div>`;
}

/* ---- 기록 카드 안의 🤖 · 💬 ---- */
const feedbacksOf = (id) => ofType('claudeFeedback').filter((f) => f.targetId === id).sort(byCreatedDesc);
const claudeBtns = (r) => `<button type="button" class="btn ghost purple small" data-act="claudeCard" data-id="${esc(r.id)}" title="이 기록을 클로드에게 보낼 글로 복사해요" aria-label="클로드에게 보내기">🤖</button>${feedbackBadge(r)}`;
function feedbackBadge(r) {
  const n = feedbacksOf(r.id).length;
  return n ? `<button type="button" class="btn ghost small fb-badge" data-act="fbToggle" data-id="${esc(r.id)}" aria-pressed="${ui.cardFbShown.has(r.id)}" title="받은 피드백 보기">💬 ${n}</button>` : '';
}
function feedbackDoneNote(r) {
  const f = r.feedbackId && records.find((x) => x.id === r.feedbackId);
  return f && hasValue(f.todo) ? `<p class="fb-done">💡 오늘 해본 것: ${esc(f.todo)}</p>` : '';
}

// 답변 + 해볼 것 입력 칸 (메인 복사칸과 카드가 함께 써요)
function fbInputHTML(targetId) {
  return `<div class="fb-input" data-target="${esc(targetId)}">
    <div class="label" style="margin-top:0">💬 받은 피드백 붙여넣기</div>
    <textarea class="fb-text-in" data-fb="text" rows="6" placeholder="클로드의 답변을 여기에 붙여 넣어요"></textarea>
    <label class="rt-h" style="margin:10px 0 4px">이번에 해볼 것 하나 <span class="meta">(한 줄)</span></label>
    <input class="fb-todo-in" data-fb="todo" type="text" maxlength="200" autocomplete="off" placeholder="예: 비브라토는 개방현 옆 줄에서 4번 손가락으로 먼저">
    <div class="row" style="margin-top:10px"><button type="button" class="btn purple" data-act="fbSave" data-target="${esc(targetId)}">저장</button>${targetId ? `<button type="button" class="btn ghost" data-act="fbClose" data-id="${esc(targetId)}">닫기</button>` : ''}</div>
  </div>`;
}

const periodLabel = (f) => ({ day: '오늘', week: '이번 주', month: '이번 달', card: '카드' }[f.period] || '');
function fbRangeText(f) {
  if (!f.rangeStart || f.period === 'card' || f.period === 'day') return '';
  return ` (${shortDay(f.rangeStart)} ~ ${shortDay(f.rangeEnd || f.rangeStart)})`;
}

// 카드 아래: 입력 칸(열려 있을 때)과 이 카드에 연결된 피드백 전문(💬 N을 눌렀을 때)
function cardFeedbackHTML(r) {
  const attached = feedbacksOf(r.id);
  return `${ui.cardFbOpen.has(r.id) ? `<div class="fb-box">${fbInputHTML(r.id)}</div>` : ''}${ui.cardFbShown.has(r.id) && attached.length ? `<div class="fb-attached">${attached.map((f) => fbItemHTML(f, { full: true, compact: true })).join('')}</div>` : ''}`;
}

/* ---- 피드백 한 건 (모음 화면과 카드 아래가 함께 써요) ---- */
function fbAnswerHTML(f, full) {
  const text = String(f.text || '').trim();
  if (!text) return '';
  const long = text.split('\n').length > 3 || text.length > 200;
  const open = full || ui.fbOpenText.has(f.id);
  return `<p class="pre fb-answer${long && !open ? ' clamp' : ''}">${esc(text)}</p>${long && !full ? `<button type="button" class="link-btn" data-act="fbMore" data-id="${esc(f.id)}">${open ? '접기' : '더 보기'}</button>` : ''}`;
}
function fbItemHTML(f, { full = false, compact = false } = {}) {
  const target = f.targetId && records.find((x) => x.id === f.targetId);
  return `<div class="card fb-item${compact ? ' compact' : ''}" data-rid="${esc(f.id)}">
    <div class="meta">${esc(dayLabel(f.date))} · ${esc(periodLabel(f))}${esc(fbRangeText(f))}</div>
    ${hasValue(f.question) ? `<p class="fb-q"><span class="meta">물어본 것</span> ${esc(f.question)}</p>` : ''}
    ${hasValue(f.todo) ? `<label class="fb-todo"><input type="checkbox" data-fb-done="${esc(f.id)}" ${f.todoDone ? 'checked' : ''}> <span class="${f.todoDone ? 'done' : ''}"><b>해볼 것</b> ${esc(f.todo)}</span></label>` : ''}
    ${fbAnswerHTML(f, full)}
    <div class="row" style="margin-top:8px">
      <button type="button" class="btn ghost small" data-act="fbEdit" data-id="${esc(f.id)}">수정</button>
      <button type="button" class="btn danger small" data-act="fbDelete" data-id="${esc(f.id)}">삭제</button>
      ${target && !compact ? `<button type="button" class="btn ghost small" data-act="goto" data-id="${esc(f.targetId)}">기록 보기</button>` : ''}
    </div>
  </div>`;
}

// 💬 피드백 모음 (영역마다): 받은 피드백을 최신순으로. 각 피드백의 "해볼 것" 옆 체크(해봤음)로 표시해요.
function feedbackViewHTML(scope) {
  const all = ofType('claudeFeedback').filter((f) => f.scope === scope).sort(byCreatedDesc);
  if (!all.length) return `<div class="empty">${esc(EMPTY_TEXT.feedback)}</div>`;
  return all.map((f) => fbItemHTML(f)).join('');
}

function openFeedbackEdit(id) {
  const f = records.find((x) => x.id === id);
  if (!f) return;
  openDlg(`<h2>💬 피드백 수정</h2>
    <form id="fbEditForm" data-id="${esc(id)}" novalidate>
      <div class="field"><label for="fe_q">물어본 것</label><input id="fe_q" name="question" type="text" value="${esc(f.question || '')}"></div>
      <div class="field"><label for="fe_t">받은 답변</label><textarea id="fe_t" name="text" rows="8">${esc(f.text || '')}</textarea></div>
      <div class="field"><label for="fe_d">이번에 해볼 것 하나</label><input id="fe_d" name="todo" type="text" value="${esc(f.todo || '')}"></div>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="closeDlg">취소</button><button type="submit" class="btn">저장</button></div>
    </form>`, 'roomy');
}
async function saveFeedbackEdit(form) {
  const f = records.find((x) => x.id === form.dataset.id);
  if (!f) return;
  const { sample, ...keep } = f; // 예시를 고치면 내 기록이 돼요
  await saveRecord({ ...keep, question: form.elements.question.value.trim(), text: form.elements.text.value.trim(), todo: form.elements.todo.value.trim(), updatedAt: Date.now() });
  closeDlg();
  refreshFeedbackViews();
  toast('피드백을 고쳤어요.', 2500);
}

/* ---- 메인 복사칸 (캘린더 아래, 접어 둘 수 있어요) ---- */
function claudeCurrent() {
  const [start, end] = claudeRange(ui.claudePeriod);
  const list = scopeRecords(ui.claudeScope, start, end);
  const question = ui.claudeQuestion[ui.claudeScope] || '';
  return { scope: ui.claudeScope, period: ui.claudePeriod, start, end, list, question, text: list.length ? claudeText({ scope: ui.claudeScope, period: ui.claudePeriod, list, question }) : '' };
}

function claudeBoxHTML() {
  const cur = claudeCurrent();
  return `<details class="card claude-fold" id="claudeFold"${settings.claudeBoxOpen ? ' open' : ''}>
    <summary>🤖 클로드에게 보내기</summary>
    <div class="claude-box" id="claudeBox">
    <div class="cl-row"><span class="chip-label">기간</span><div class="chips" style="margin:0">${PERIODS.map((p) => `<button type="button" class="chip ${ui.claudePeriod === p.id ? 'active' : ''}" data-act="claudePeriod" data-id="${p.id}" aria-pressed="${ui.claudePeriod === p.id}">${p.label}</button>`).join('')}</div></div>
    <div class="cl-row"><span class="chip-label">범위</span><div class="chips" style="margin:0">${COPY_SCOPES.map((id) => `<button type="button" class="chip ${ui.claudeScope === id ? 'active' : ''}" data-act="claudeScope" data-id="${id}" aria-pressed="${ui.claudeScope === id}">${scopeMeta(id).icon} ${esc(scopeMeta(id).label)}</button>`).join('')}</div></div>
    <label class="rt-h" for="claudeQ" style="margin-top:12px">이번에 특히 물어볼 것 <span class="meta">(선택, 한 줄)</span></label>
    <input id="claudeQ" class="rt-note-in" type="text" maxlength="200" autocomplete="off" value="${esc(cur.question)}" placeholder="예: 3포지션에서 음정이 자꾸 높아지는 이유">
    <textarea id="claudePreview" class="copy-text" spellcheck="false" aria-label="복사할 글 미리보기">${esc(cur.list.length ? cur.text : '이 기간엔 기록이 없어요')}</textarea>
    <div class="row" style="margin-top:8px">
      <button type="button" class="btn purple" id="claudeCopyBtn" data-act="claudeCopy" ${cur.list.length ? '' : 'disabled'}>📋 복사하기</button>
      <button type="button" class="btn ghost" data-act="claudeSettings">✎ 내 정보·요청 문구</button>
    </div>
    <details class="fb-fold" id="mainFb"${ui.claudePending ? ' open' : ''}><summary>💬 받은 피드백 붙여넣기</summary>${fbInputHTML('')}</details>
    </div>
  </details>`;
}

// 펼치거나 접으면 이 기기에 기억해요 (다른 기기와 맞추지 않아요)
document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d || d.id !== 'claudeFold' || d.open === settings.claudeBoxOpen) return;
  settings.claudeBoxOpen = d.open;
  saveSettings();
}, true);

// 기간·범위·물어볼 것이 바뀌면 미리보기만 새로 만들어요 (아래에 붙여 넣던 피드백은 그대로)
function syncClaudeBox() {
  const box = $('#claudeBox');
  if (!box) return;
  const cur = claudeCurrent();
  box.querySelectorAll('[data-act=claudePeriod]').forEach((b) => { const on = b.dataset.id === ui.claudePeriod; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  box.querySelectorAll('[data-act=claudeScope]').forEach((b) => { const on = b.dataset.id === ui.claudeScope; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  const q = $('#claudeQ');
  if (q && document.activeElement !== q) q.value = cur.question;
  $('#claudePreview').value = cur.list.length ? cur.text : '이 기간엔 기록이 없어요';
  $('#claudeCopyBtn').disabled = !cur.list.length;
}

async function claudeCopy() {
  const cur = claudeCurrent();
  if (!cur.list.length) return;
  const text = $('#claudePreview').value;
  const ok = await copyText(text, '복사했어요');
  ui.claudePending = { scope: cur.scope, period: cur.period, rangeStart: cur.start, rangeEnd: cur.end, question: cur.question };
  const fold = $('#mainFb');
  if (fold) { fold.open = true; if (ok) { const ta = fold.querySelector('[data-fb=text]'); if (ta) ta.focus(); } }
}

// 답변을 저장해요. targetId 가 있으면 그 카드에서 보낸 피드백이에요.
async function fbSave(container, targetId) {
  const text = container.querySelector('[data-fb=text]').value;
  const todo = container.querySelector('[data-fb=todo]').value;
  let payload;
  if (targetId) {
    const r = records.find((x) => x.id === targetId);
    if (!r) return;
    payload = { scope: SCOPE_OF_TYPE[r.type], period: 'card', rangeStart: r.date, rangeEnd: r.date, targetId, question: '' };
  } else {
    const p = ui.claudePending || (() => { const c = claudeCurrent(); return { scope: c.scope, period: c.period, rangeStart: c.start, rangeEnd: c.end, question: c.question }; })();
    payload = { ...p, targetId: '' };
  }
  const rec = await saveFeedback({ ...payload, text, todo });
  if (!rec) return;
  if (targetId) { ui.cardFbOpen.delete(targetId); ui.cardFbShown.add(targetId); }
  else { ui.claudeQuestion[payload.scope] = ''; ui.claudePending = null; } // 물어볼 것은 저장하면 비워져요
  refreshFeedbackViews();
}

// 카드의 🤖: 그 기록 하나만으로 글을 만들어 복사하고, 카드 안에 피드백 칸을 펼쳐요
async function claudeCard(id) {
  const r = records.find((x) => x.id === id);
  if (!r || !SCOPE_OF_TYPE[r.type]) return;
  const scope = SCOPE_OF_TYPE[r.type];
  const text = claudeText({ scope, period: 'card', list: [r] });
  await copyText(text, scope === 'drawing' ? '복사했어요. 그림 이미지는 직접 첨부해 주세요.' : '복사했어요');
  ui.cardFbOpen.add(id);
  refreshFeedbackViews();
  const ta = document.querySelector(`[data-target="${CSS.escape(id)}"] [data-fb=text]`);
  if (ta) ta.focus();
}

/* ---- ✎ 내 정보·요청 문구 창 ---- */
let clDraft = {};
function openClaudeSettings(scope) {
  scope = scope || ui.claudeScope;
  const meta = scopeMeta(scope);
  const d = clDraft[scope] || { info: claudeInfo(scope), request: claudeRequest(scope) };
  clDraft[scope] = d;
  openDlg(`<h2>✎ 내 정보·요청 문구</h2>
    <p class="meta" style="margin-top:0">한 번 써 두면 복사할 때 글 맨 위에 자동으로 붙어요. 그림·영어 카드의 🤖 도 같은 설정을 써요.</p>
    <div class="chips" id="clScopes">${CLAUDE_SCOPES.map((x) => `<button type="button" class="chip ${x.id === scope ? 'active' : ''}" data-act="clScope" data-id="${x.id}" aria-pressed="${x.id === scope}">${x.icon} ${esc(x.label)}</button>`).join('')}</div>
    <form id="clForm" data-scope="${scope}" novalidate>
      <div class="field"><label for="clInfo">내 정보 <span class="meta">(${esc(meta.label)})</span></label><textarea id="clInfo" name="info" rows="5">${esc(d.info)}</textarea>
        <button type="button" class="btn ghost small" data-act="clReset" data-field="info" style="margin-top:6px">기본값으로 되돌리기</button></div>
      <div class="field"><label for="clReq">요청 문구 <span class="meta">(${esc(meta.label)})</span></label><textarea id="clReq" name="request" rows="4">${esc(d.request)}</textarea>
        <button type="button" class="btn ghost small" data-act="clReset" data-field="request" style="margin-top:6px">기본값으로 되돌리기</button></div>
      <p class="hint">모든 요청 문구 끝에 자동으로 붙는 공통 문장: “${esc(CLAUDE_COMMON)}” (app.js 맨 위 <b>CLAUDE_COMMON</b>에서 바꿔요)</p>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="clCancel">닫기</button><button type="submit" class="btn">저장</button></div>
    </form>`, 'roomy');
}
async function saveClaudeSettings() {
  const cur = { ...claudeStored() };
  const form = $('#clForm');
  if (form) clDraft[form.dataset.scope] = { info: form.elements.info.value, request: form.elements.request.value };
  Object.entries(clDraft).forEach(([sc, v]) => {
    const meta = scopeMeta(sc);
    const entry = {};
    if (v.info !== meta.info) entry.info = v.info; // 기본값과 같으면 저장하지 않아요 (나중에 기본값이 바뀌어도 따라가요)
    if (v.request !== meta.request) entry.request = v.request;
    if (Object.keys(entry).length) cur[sc] = entry; else delete cur[sc];
  });
  await setConfig('claudeSettings', cur);
  clDraft = {};
  closeDlg();
  syncClaudeBox();
  toast('내 정보·요청 문구를 저장했어요.', 2500);
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
function closeDlg() { if (dlg2.open) dlg2.close(); if (dlg.open) dlg.close(); }

let formImages = {}; // 입력 창에서 선택한 이미지들 (칸 이름 → 데이터 주소). 그림 기록은 '내 그림'과 '원본 이미지' 두 칸이에요
let formShots = []; // 입력 창에서 고른 그림 사진들
let formBase = '';  // 입력 창을 열었을 때의 내용 (Esc로 닫을 때 뭔가 적었는지 비교해요)

// 지금 열려 있는 입력 창(기록)의 내용을 글자 하나로 만들어 둬요
function formSnapshot() {
  const f = dlg.open ? dlg.querySelector('#recForm') : null;
  if (!f) return '';
  return `${JSON.stringify([...new FormData(f)].map(([k, v]) => [k, typeof v === 'string' ? v : '']))}|${Object.values(formImages).map((v) => (v || '').length).join(',')}|${formShots.length}|${staged.length}`;
}
const isFormDirty = () => { const now = formSnapshot(); return now !== '' && now !== formBase; };

// 🎻 교재 칸: 교재 칩(여러 개, ⚙︎ 교재 관리) + 켠 교재마다 "교재 이름 + 한 줄 칸" (끄면 칸이 사라져요. 쓰던 글은 이 창 안에서는 기억해 둬요)
let bookDraft = {};
function bookRowsHTML(names, pieces) {
  return names.map((n, i) => `<div class="book-row" data-book="${esc(n)}"><label class="book-name" for="bp_${i}">${esc(n)}</label>
    <input id="bp_${i}" name="bookPiece" type="text" class="book-piece" data-book-piece="${esc(n)}" list="dl_book_${i}" autocomplete="off" maxlength="120" value="${esc(pieces[n] || '')}" placeholder="곡 이름이나 번호 (선택)">
    <datalist id="dl_book_${i}">${bookPieceSuggestions(n).map((p) => `<option value="${esc(p)}">`).join('')}</datalist></div>`).join('');
}
function bookFieldHTML(f, value) {
  const rows = bookRows({ books: value });
  const order = [...textbookChoices(), ...rows.map((b) => b.name)];
  const names = [...new Set(order)].filter((n) => rows.some((b) => b.name === n)); // 칩 순서대로
  bookDraft = Object.fromEntries(rows.map((b) => [b.name, b.piece]));
  return `<div class="field" data-only="${esc(f.only || '')}" data-key="${esc(f.key)}"><label>${esc(f.label)}</label>
    ${choiceHTML('books', textbookChoices(), names, true, MANAGE_BOOKS_BTN)}
    <div class="book-rows" id="bookRows">${bookRowsHTML(names, bookDraft)}</div></div>`;
}
const selectedBookNames = () => { const i = dlg.querySelector('input[name=books]'); try { const a = JSON.parse(i ? i.value || '[]' : '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
const readBookDraft = () => dlg.querySelectorAll('#bookRows [data-book-piece]').forEach((i) => { bookDraft[i.dataset.bookPiece] = i.value; });
// 교재 칩을 켜고 끌 때: 켠 교재의 칸만 칩 순서대로 다시 그려요
function syncBookRows() {
  const box = dlg.querySelector('#bookRows');
  if (!box) return;
  readBookDraft();
  box.innerHTML = bookRowsHTML(selectedBookNames(), bookDraft);
}

function fieldHTML(f, value, type) {
  const id = `f_${f.key}`;
  if (f.type === 'bookLines') return bookFieldHTML(f, value);
  if (f.type === 'check') { // 체크 상자 하나
    return `<div class="field" data-only="${esc(f.only || '')}" data-key="${esc(f.key)}"><label class="chk-line" for="${id}"><input type="checkbox" id="${id}" name="${f.key}" value="1" ${value ? 'checked' : ''}> ${esc(f.label)}</label>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
  }
  if (f.type === 'multi') { // 한 칸 제목 아래 입력 칸 여러 개 (영어 요약 3줄)
    const vals = value || {};
    return `<div class="field" data-only="${esc(f.only || '')}" data-key="${esc(f.key)}"><label>${esc(f.label)}</label>${f.keys.map((k, i) => `<input id="f_${k}" name="${k}" type="text" class="multi-in" value="${esc(vals[k] || '')}" placeholder="${esc((f.placeholders || [])[i] || '')}" autocomplete="off">`).join('')}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
  }
  const req = f.required ? ' <span class="req">*</span>' : '';
  const v = f.flat && typeof value === 'string' ? oneLine(value) : (value ?? ''); // flat: 한 줄짜리 칸 (예전에 줄바꿈이 들어 있으면 " / "로 이어서 보여줘요)
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
    input = choiceHTML(f.key, choicesOf(f), value, f.type === 'chips', f.manage === 'books' ? MANAGE_BOOKS_BTN : '');
  } else if (f.type === 'images') { // 여러 장 (그림 사진)
    input = `<input id="${id}" type="file" accept="image/*" multiple class="sr-only" data-shots>
      <label class="dropzone" id="dropZone" data-multi="1" for="${id}"><span>🖼 여기에 ${esc(withJosa(f.noun || '사진', '을/를'))} 끌어다 놓거나, 눌러서 고르세요</span>
        <small>컴퓨터에서는 Ctrl+V(붙여넣기)도 돼요 · 최대 ${f.max || ART_MAX_PHOTOS}장 · 휴대폰은 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote"></div>
      <div id="imgPreviewBox"></div>`;
  } else if (f.type === 'audio') { // 🎙 녹음 (value 는 이 기록의 id예요. 이미 붙어 있는 녹음을 보여주려고요)
    input = AudioStore.ok()
      ? `<input id="${id}" type="file" accept="${AUDIO_ACCEPT}" multiple class="sr-only" data-audio-input>
        <label class="audio-drop" for="${id}"><span>🎙 녹음 파일을 끌어다 놓거나, 눌러서 고르세요</span><small>${esc(AUDIO_HINT)} · 위에 적은 첫 번째 곡의 곡 노트에 함께 모여요</small></label>
        <div class="hint" id="audioNote"></div>
        <div class="audio-stage" id="audioStage"></div>
        <div class="rec-list" id="formAudioList" data-rec="${esc(v)}">${v ? audios.filter((a) => a.recId === v).sort(byOldest).map(audioRowHTML).join('') : ''}</div>`
      : '<div class="hint">이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.</div>';
  } else if (f.type === 'image') {
    input = `<input id="${id}" type="file" accept="image/*" class="sr-only" data-image-input="${esc(f.key)}">
      <label class="dropzone" data-key="${esc(f.key)}" for="${id}"><span>🖼 여기에 ${esc(f.noun || '그림')}을 끌어다 놓거나, 눌러서 고르세요</span>
        <small>${f.optional ? '선택이에요 · ' : ''}컴퓨터에서는 ${f.optional ? '끌어다 놓기' : 'Ctrl+V(붙여넣기)'}도 돼요 · 휴대폰은 카메라나 앨범에서 고를 수 있어요</small></label>
      <div class="hint" id="imgNote_${esc(f.key)}"></div>
      <div class="img-preview" id="imgPreview_${esc(f.key)}"></div>`;
  } else {
    const extra = f.type === 'number' ? ` min="${f.min ?? ''}" step="${f.step ?? 1}" inputmode="decimal"` : '';
    const sugg = f.suggest ? ` list="dl_${type}_${f.key}" autocomplete="off"` : '';
    input = `<input id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}"${extra}${sugg}${ph}>`;
  }
  const labelFor = f.type === 'choice' || f.type === 'chips' || f.type === 'audio' ? '' : ` for="${id}"`;
  return `<div class="field${f.small ? ' field-small' : ''}" data-only="${esc(f.only || '')}" data-key="${esc(f.key)}"><label${labelFor}>${esc(f.label)}${req}</label>${input}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
}

// 새벽 DAY_STARTS_AT시 전에 입력 창을 열었을 때만, 날짜 칸 아래에 어느 날 기록으로 남는지 작게 알려줘요. (날짜를 바꾸면 사라져요)
function addDawnNote(dateInput) {
  const t = todayStr();
  if (!dateInput || new Date().getHours() >= DAY_STARTS_AT || dateInput.value !== t) return;
  const note = document.createElement('div');
  note.className = 'dawn-note';
  note.dataset.date = t;
  note.textContent = `🌙 새벽 ${DAY_STARTS_AT}시 전이라 어제(${shortDay(t)}) 기록으로 남겨요`;
  dateInput.after(note);
}

// 종류(연습/레슨, 요가/슬로조깅)에 맞지 않는 칸은 숨겨요. 보일 칸이 하나도 없으면 "더 적기" 상자도 숨겨요.
function syncKindFields(form) {
  const schema = SCHEMAS[form.dataset.type];
  if (!schema.kindKey) return;
  const kind = form.elements[schema.kindKey].value;
  form.querySelectorAll('.field[data-only]').forEach((el) => { el.hidden = !!el.dataset.only && el.dataset.only !== kind; });
  schema.fields.filter((f) => f.placeholderByKind).forEach((f) => { // 종류마다 다른 회색 예시 문장
    const input = form.elements[f.key];
    if (input) input.placeholder = f.placeholderByKind[kind] || f.placeholder || '';
  });
  const more = form.querySelector('#moreBox');
  if (more) more.hidden = !more.querySelector('.field:not([hidden])');
}

// 여러 장(그림 사진): 작은 그림들과 '빼기' 버튼
function updateShotsPreview() {
  const box = $('#imgPreviewBox');
  if (!box) return;
  const n = formShots.length;
  box.innerHTML = n
    ? `<div class="shot-row">${formShots.map((src, i) => `<div class="shot"><img class="shot-img" src="${esc(src)}" alt="고른 사진 ${i + 1}">
        <div class="shot-btns">${n > 1 ? `<button type="button" class="btn ghost small" data-act="moveShot" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="앞으로">◀</button><button type="button" class="btn ghost small" data-act="moveShot" data-i="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} aria-label="뒤로">▶</button>` : ''}<button type="button" class="btn ghost small" data-act="removeShot" data-i="${i}">빼기</button></div></div>`).join('')}</div>`
    : '';
}
// 한 장짜리 그림 칸 하나의 미리보기
function updateImagePreview(key) {
  const box = $(`#imgPreview_${key}`);
  if (!box) return;
  const src = formImages[key];
  box.innerHTML = src
    ? `<img class="preview" src="${esc(src)}" alt="선택한 그림"><button type="button" class="btn ghost small" data-act="clearImage" data-key="${esc(key)}" style="margin-top:6px">이미지 빼기</button>`
    : '';
}

// 저장하고 나면: 캘린더의 '날짜 창'에서 온 거라면 그 창으로 돌아가고, 아니면 창을 닫아요
function afterSave() {
  const back = ui.backToDay;
  const backArt = ui.backToArt;
  render();
  if (back) openDay(back); else if (backArt && records.some((r) => r.id === backArt)) openArt(backArt, ui.artPhoto); else closeDlg();
}

// 레슨 기록을 만들 때 창 위쪽에 보여줄 "아직 안 물어본 것" 목록
function askBoxHTML() {
  const items = collectAsks();
  if (!items.length) return '';
  return `<div class="field ask-box" data-only="레슨" data-key="askBox"><label>🙋 레슨 때 물어보려던 것 <span class="meta">(물어봤으면 체크)</span></label>
    ${asksListHTML(items)}</div>`;
}

function openForm(type, existing, presetDate, preset) {
  const schema = SCHEMAS[type];
  ui.backToDay = dlg.open && dlg.querySelector('.day-list') ? ui.dayOpen : null;
  ui.backToArt = dlg.open && dlg.querySelector('.art-detail') ? ui.artOpen : null; // 그림 상세 창에서 "수정"을 눌렀다면 저장·취소 뒤 그 창으로 돌아가요
  const rec = existing ? { ...(type === 'workout' ? workoutLiteCopy(existing) : type === 'violin' ? booksCopy(existing) : existing) } : { date: presetDate || todayStr(), ...(preset || {}) }; // 아직 정리하지 않은 예전 운동 기록은 "한 줄"로 옮겨 담은 모습으로 열려요
  if (type === 'art') { rec.artKind = existing ? artKindOf(existing) : (rec.artKind || '크로키'); rec.images = existing ? artPhotos(existing) : []; }
  // 종류 칸이 없던 예전 바이올린 기록은 '연습'으로 봐요
  if (schema.kindKey && !rec[schema.kindKey]) rec[schema.kindKey] = schema.fields.find((f) => f.key === schema.kindKey).options[0];
  formImages = {};
  schema.fields.filter((f) => f.type === 'image' && !f.hidden).forEach((f) => { formImages[f.key] = rec[f.key] || null; });
  formShots = type === 'art' ? [...rec.images] : [];
  staged = [];
  const valueFor = (f) => (f.type === 'audio' ? (existing ? existing.id : '') : f.type === 'multi' ? Object.fromEntries(f.keys.map((k) => [k, rec[k]])) : rec[f.key]);
  const base = schema.fields.filter((f) => !f.more && !f.legacy && !f.hidden);
  // 더 적기: 예전 칸(legacy)은 값이 들어 있을 때만 보여요
  const more = schema.fields.filter((f) => !f.hidden && (f.more || f.legacy) && !(f.legacy && !hasValue(rec[f.key])));
  const moreOpen = !!existing && (more.some((f) => hasValue(rec[f.key])) || audios.some((a) => a.recId === existing.id)); // 수정할 때 내용이 있으면 펼친 채로
  const datalists = schema.fields.filter((f) => f.suggest)
    .map((f) => `<datalist id="dl_${type}_${f.key}">${(type === 'violin' && f.key === 'piece' ? pieceSuggestions() : suggestions(type, f.key)).map((p) => `<option value="${esc(p)}">`).join('')}</datalist>`).join('');
  openDlg(`
    <h2>${esc(schema.label)} ${existing ? '수정' : '추가'}</h2>
    <form id="recForm" novalidate>
      ${SCOPE_OF_TYPE[type] ? feedbackHintHTML(SCOPE_OF_TYPE[type], existing) : ''}
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
  if (!existing) addDawnNote($('#f_date'));
  updateShotsPreview();
  Object.keys(formImages).forEach(updateImagePreview);
  const first = dlg.querySelector('input:not([type=file]):not([type=date]):not([type=hidden]), textarea');
  if (first && !existing) first.focus();
  formBase = formSnapshot();
}

// 받침이 있으면 앞, 없으면 뒤 (예: 사진 + 을/를 → 사진을 · 캡처 + 을/를 → 캡처를)
function withJosa(word, pair) {
  const [a, b] = pair.split('/');
  const c = word.charCodeAt(word.length - 1);
  return `${word}${c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? a : b}`;
}
const isImage = (f) => !!f && typeof f.type === 'string' && f.type.startsWith('image/');
// 사진 파일의 날짜 (미래 날짜는 오늘로)
function dateOfFile(f) {
  const t = toStr(new Date(f.lastModified || Date.now()));
  return t > todayStr() ? todayStr() : t;
}

// 입력 창에 그림 한 장 붙이기
async function attachImage(file, key = 'image') {
  const err = $('#formError');
  if (!isImage(file)) { if (err) err.textContent = '이미지 파일(사진)만 넣을 수 있어요.'; return false; }
  try {
    formImages[key] = await readImage(file);
    updateImagePreview(key);
    if (err) err.textContent = '';
    return true;
  } catch (e) {
    if (err) err.textContent = '이 파일은 이미지로 열 수 없어요. 다른 파일을 골라 주세요.';
    return false;
  }
}

// 입력 창에 그림 사진 여러 장 붙이기
async function attachShots(files) {
  const err = $('#formError');
  const note = $('#imgNote');
  const imgs = files.filter(isImage);
  if (!imgs.length) { if (err) err.textContent = '이미지 파일(사진)만 넣을 수 있어요.'; return false; }
  const form = $('#recForm');
  const fld = form ? SCHEMAS[form.dataset.type].fields.find((f) => f.type === 'images') : null; // 사진을 넣는 칸 (운동: 워치 캡처 · 그림: 사진)
  const max = (fld && fld.max) || ART_MAX_PHOTOS;
  const room = max - formShots.length;
  if (room <= 0) { if (note) note.textContent = `사진은 한 기록에 ${max}장까지 넣을 수 있어요. 필요 없는 것은 '빼기'를 눌러 주세요.`; return false; }
  let added = 0;
  for (const f of imgs.slice(0, room)) {
    try { formShots.push(await readImage(f)); added += 1; } catch (e) { if (err) err.textContent = '이미지로 열 수 없는 파일은 건너뛰었어요.'; }
  }
  updateShotsPreview();
  const moreBox = $('#moreBox');
  if (moreBox && fld && fld.more) moreBox.open = true; // 캡처를 붙이면 "더 적기"를 펼쳐서 보이게 (그림 사진은 기본 칸이라 그대로)
  if (added && err) err.textContent = '';
  if (note) note.textContent = imgs.length > room ? `${max}장까지만 넣을 수 있어서 ${room}장만 넣었어요.` : '';
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
  const data = {};
  for (const f of schema.fields) {
    if (f.only && f.only !== kind) continue; // 다른 종류의 칸은 저장하지 않아요
    if (f.legacy && !form.elements[f.key]) continue; // 안 보였던 예전 칸은 손대지 않아요
    if (f.hidden) continue; // 화면에 없는 칸
    if (f.type === 'audio') continue; // 녹음은 기록 안에 저장하지 않고, 저장한 뒤 곡에 붙여요
    if (f.type === 'check') { data[f.key] = !!form.elements[f.key].checked; continue; }
    if (f.type === 'bookLines') { // 교재 칩 + 교재마다 한 줄 → books: [{ name, piece }] (칩 순서)
      const lines = new Map([...form.querySelectorAll('#bookRows [data-book-piece]')].map((i) => [i.dataset.bookPiece, i.value.trim()]));
      data.books = readChoice(form, { key: 'books', type: 'chips' }).map((name) => ({ name, piece: lines.get(name) || '' }));
      continue;
    }
    if (f.type === 'multi') { f.keys.forEach((k) => { data[k] = (form.elements[k].value || '').trim(); }); continue; }
    if (f.type === 'image') { data[f.key] = formImages[f.key] || ''; continue; }
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
      err.textContent = `'${cleanLabel(f.label)}' 칸을 채워 주세요.`; form.elements[f.key].focus(); return;
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
  if (type === 'art') {
    if (!old && !formShots.length) { err.textContent = '사진을 한 장 이상 넣어 주세요.'; return; }
    if (!data.artKind) data.artKind = '크로키';
  }
  const newAudio = type === 'violin' && kind === '연습' ? staged.length : 0;
  const pieceList = type === 'violin' ? piecesOf(data) : [];
  if (newAudio && !pieceList.length) { err.textContent = '녹음을 붙이려면 곡 이름을 먼저 적어 주세요.'; (form.querySelector('#bookRows [data-book-piece]') || form.elements.piece).focus(); return; }
  const carry = [...HIDDEN_KEYS, 'stamp', 'feedbackId', ...(schema.keep || [])]; // 이 창에서 고치지 않는 칸은 그대로 보관
  const rec = {
    id: old ? old.id : newId(),
    type,
    createdAt: old ? old.createdAt : Date.now(),
    updatedAt: Date.now(),
    ...Object.fromEntries(carry.filter((k) => old && old[k] !== undefined).map((k) => [k, old[k]])),
    ...data,
  }; // 예시 표시(sample)는 직접 고치면 사라져요. 내 기록이 되었다는 뜻이에요.
  if (!old) assignStamp(rec); // 새 기록만 도장을 받아요 (고칠 때는 받은 도장이 그대로예요)
  const doneEl = form.elements.feedbackDone; // "지난 피드백에서 … ☐ 오늘 해봤음"을 체크했으면 이 기록에 "오늘 해본 것"으로 연결해요
  const doneId = doneEl && doneEl.checked ? doneEl.value : '';
  if (doneId) rec.feedbackId = doneId;
  if (!(await saveRecord(rec))) return;
  if (doneId) { const fb = records.find((x) => x.id === doneId); if (fb) await saveRecord({ ...fb, todoDone: true, updatedAt: Date.now() }); }
  if (newAudio) await commitStaged(pieceList[0].name, rec.id); // 녹음은 적은 곡 중 첫 번째 곡에 붙어요
  afterSave();
  if (!old) afterNewRecord(rec);
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
function validRecords(payload, bump = false) {
  if (!payload || payload.app !== 'my-journal' || !Array.isArray(payload.records)) return null;
  // 더 이상 쓰지 않는 종류(경제 공부 메모·투자 기록)와 칸 값은 불러올 때 조용히 버려요.
  // 🧘 운동의 없어진 칸도 같아요: 지우고, 예전 "몸이 어땠나 한 줄"·"달리며 든 생각 한 줄"은 "한 줄"로 옮겨요. (bump: 바뀐 기록은 바꾼 시각도 새로 적어요)
  return payload.records.filter((r) => r && typeof r.id === 'string' && SCHEMAS[r.type] && typeof r.date === 'string').map((r) => booksCopy(stripQuick(workoutLiteCopy(cleanedCopy(r), bump), bump), bump));
}

/* ---------------------------------------------------------------------
   0. 업데이트 정리: 없어진 기능의 데이터(경제 공부 메모·투자 기록, 바이올린 예전 칩, 그림 예전 칩·도구 등)를 한 번만 정리해요.
      정리하기 직전에 전체 백업 파일을 내려받고, 확인을 눌러야만 진행해요. (정리 대상은 아래 두 목록에 적힌 것뿐이에요)
   --------------------------------------------------------------------- */
const CLEAN_DROP_TYPES = ['study', 'invest'];                // 통째로 지우는 기록 종류
const CLEAN_FIELDS = {                                        // 종류별로 지우는 칸
  violin: ['did', 'focus'],                                   // 예전 "오늘 한 것" 칩, "집중한 점" 칩
  art: ['kind', 'areas', 'tools', 'tried', 'hard'],           // 예전 종류·연습 영역 칩, 사용한 도구, 새로 시도한 점, 어려웠던 점
  econRoutine: ['tags'],                                      // 경제 루틴의 태그 (금리·인플레이션·환율)
};
const dirtyKeys = (r) => (CLEAN_FIELDS[r.type] || []).filter((k) => k in r);
const needsCleanup = (r) => CLEAN_DROP_TYPES.includes(r.type) || dirtyKeys(r).length > 0;
function cleanedCopy(r) {
  if (!dirtyKeys(r).length) return r;
  const c = { ...r };
  dirtyKeys(r).forEach((k) => delete c[k]);
  return c;
}

// 🧹 데이터 정리 확인 창: 백업 파일 안내 + "정리 전 백업 파일 불러오기" 버튼 한 줄 + [취소] [정리하기]. true 면 정리해요. (닫거나 Esc 를 눌러도 취소예요)
let cleanupAsk = null;
async function askCleanup(message, name) {
  while (dlg.open) await new Promise((r) => setTimeout(r, 300)); // 다른 창이 열려 있으면 닫힐 때까지 기다려요
  return new Promise((resolve) => {
    cleanupAsk = { resolve };
    openDlg(`<h2>🧹 데이터 정리</h2>
      <p class="pre cleanup-msg">${esc(message)}</p>
      <div class="row cleanup-restore"><button type="button" class="btn ghost small" data-act="cleanRestore">📂 정리 전 백업 파일 불러오기</button><input type="file" id="cleanRestoreFile" accept=".json,application/json" hidden></div>
      <p class="meta" style="margin:6px 0 0">백업 파일 이름: ${esc(name)} · 불러올 때도 없어진 칸은 같은 규칙으로 정리돼요. 값은 백업 파일 안에 그대로 있어요.</p>
      <div class="dlg-actions"><button type="button" class="btn ghost" data-act="cleanNo">취소</button><button type="button" class="btn" data-act="cleanYes">정리하기</button></div>`);
  });
}
function answerCleanup(yes) {
  const a = cleanupAsk;
  if (!a) return;
  cleanupAsk = null;
  a.resolve(yes);
  closeDlg();
}

async function runUpdateCleanup() {
  if (settings.cleanupV3) return;
  const dirty = records.filter(needsCleanup);
  if (!dirty.length) { settings.cleanupV2 = true; settings.cleanupV3 = true; await saveSettings(); return; } // 정리할 것이 없으면 조용히 끝나요
  const name = `my-journal-backup-before-update-${todayStr().replace(/-/g, '')}.json`;
  await downloadBackup(name); // 정리하기 직전에 전체 백업
  if (!(await askCleanup(`업데이트 전에 백업을 저장했어요. 예전 투자·경제 메모, 경제 루틴 태그와 일부 칩 값을 정리합니다.\n(백업 파일은 다운로드 폴더에 있어요)`, name))) return; // 취소하면 아무것도 지우지 않고, 다음에 열 때 다시 물어봐요
  const drop = dirty.filter((r) => CLEAN_DROP_TYPES.includes(r.type)).map((r) => r.id);
  const emptied = (r) => { const c = cleanedCopy(r); return r.type === 'econRoutine' && !Object.values(c.checks || {}).some(Boolean) && !(c.letters || []).length && !c.note; }; // 태그만 남아 있던 빈 루틴 기록
  const emptyIds = dirty.filter((r) => !CLEAN_DROP_TYPES.includes(r.type) && emptied(r)).map((r) => r.id);
  const at = Date.now();
  const edit = dirty.filter((r) => !CLEAN_DROP_TYPES.includes(r.type) && !emptyIds.includes(r.id)).map((r, i) => ({ ...cleanedCopy(r), updatedAt: Math.max(at + i, (r.updatedAt || 0) + 1) })); // 바뀐 기록은 바꾼 시각도 새로 적어서 ☁ 다른 기기에도 반영돼요
  if (edit.length) await Store.putMany(edit);
  if (drop.length) await Store.remove(drop);
  for (const id of emptyIds) await deleteRecord(id); // 빈 루틴 기록은 삭제 표시를 남겨서 ☁ 다른 기기에서도 사라져요
  records = await loadRecords();
  settings.cleanupV2 = true;
  settings.cleanupV3 = true;
  await saveSettings();
  render();
  toast('정리했어요. 백업 파일은 다운로드 폴더에 있어요.', 5000);
}

/* ---------------------------------------------------------------------
   0-2. 🧘 운동 입력 단순화 정리 (한 번만): 요가·슬로조깅의 칩과 "✍ 더 적기" 칸이 없어졌어요.
        없어진 칸의 값은 지우고, 예전 "몸이 어땠나 한 줄"·"달리며 든 생각 한 줄"은 "한 줄"(memo)로 옮겨요. (둘 다 있으면 " · "로 이어 붙여요)
        정리하기 직전에 백업 파일을 내려받고 확인을 물어봐요. 바뀐 기록은 바꾼 시각을 새로 적어서 ☁ 다른 기기에도 반영돼요. 한 번 하고 나면 flag(workoutLiteV1)가 켜져요.
        예전 백업 파일을 불러올 때, 그리고 ☁ 에서 받아 올 때도 같은 규칙을 써요(workoutLiteCopy).
   --------------------------------------------------------------------- */
const WORKOUT_GONE = {                                         // 운동 기록에서 없어진 칸 (저장 이름 → 화면에 있던 이름)
  did: '주로 한 것(요가 칩)', weather: '날씨(슬로조깅 칩)',
  relief: '시원했던 곳(요가 칩)', course: '따라 한 영상·수업', refs: '영상·수업 링크',
  place: '장소', pace: '대화할 수 있는 속도였나(칩)',
  shots: '워치 캡처', claude: '클로드 피드백(붙여 둔 글)', condition: '컨디션(예전 칸)',
};
const WORKOUT_TO_LINE = { bodyNote: '몸이 어땠나 한 줄', runThought: '달리며 든 생각 한 줄' }; // 이 두 칸은 지우기 전에 "한 줄"(memo)로 옮겨요
const workoutDirtyKeys = (r) => (r && r.type === 'workout' ? [...Object.keys(WORKOUT_GONE), ...Object.keys(WORKOUT_TO_LINE)].filter((k) => k in r) : []);
function workoutLiteCopy(r, bump = false) {
  const keys = workoutDirtyKeys(r);
  if (!keys.length) return r;
  const c = { ...r };
  const base = hasValue(r.memo) ? String(r.memo).trim() : '';
  let line = base;
  Object.keys(WORKOUT_TO_LINE).forEach((k) => { // 옮길 글: 원래 한 줄 + 몸이 어땠나 + 달리며 든 생각 (이미 같은 글이 들어 있으면 또 붙이지 않아요)
    const v = hasValue(r[k]) ? String(r[k]).trim() : '';
    if (v && !line.includes(v)) line = line ? `${line} · ${v}` : v;
  });
  if (line !== base) c.memo = line;
  keys.forEach((k) => delete c[k]);
  if (bump) c.updatedAt = Math.max(Date.now(), (r.updatedAt || 0) + 1);
  return c;
}
// 지워지는 값이 얼마나 되는지 세요 (확인 창에 보여줘요)
function workoutLiteCounts(list) {
  const has = (r, k) => (k === 'shots' ? Array.isArray(r.shots) && r.shots.length > 0 : hasValue(r[k]));
  const out = {};
  Object.keys(WORKOUT_GONE).forEach((k) => { out[k] = list.filter((r) => has(r, k)).length; });
  out.shotCount = list.reduce((n, r) => n + (Array.isArray(r.shots) ? r.shots.length : 0), 0);
  out.linkCount = list.reduce((n, r) => n + String(r.refs || '').split(/\s+/).filter(Boolean).length, 0);
  out.moved = list.filter((r) => Object.keys(WORKOUT_TO_LINE).some((k) => hasValue(r[k]))).length;
  return out;
}
function workoutLiteMessage(c, name) {
  const lines = Object.entries(WORKOUT_GONE).filter(([k]) => c[k]).map(([k, label]) => `· ${label}: ${c[k]}개${k === 'shots' ? ` (사진 ${c.shotCount}장)` : k === 'refs' ? ` (링크 ${c.linkCount}개)` : ''}`);
  return `🧘 운동 기록 입력이 간단해졌어요. 요가·슬로조깅의 칩과 "더 적기" 칸에 적어 둔 값을 지웁니다.\n${lines.length ? `${lines.join('\n')}\n` : ''}${c.moved ? `\n"몸이 어땠나 한 줄"·"달리며 든 생각 한 줄" ${c.moved}개는 지우지 않고 "한 줄"로 옮겨요.\n` : ''}\n정리하기 전에 백업을 저장했어요. (백업 파일은 다운로드 폴더에 있어요)`;
}

async function migrateWorkoutLite() {
  if (settings.workoutLiteV1) return;
  const dirty = records.filter((r) => workoutDirtyKeys(r).length);
  const real = dirty.filter((r) => !r.sample);
  const counts = workoutLiteCounts(real);
  const valuable = Object.keys(WORKOUT_GONE).some((k) => counts[k]) || counts.moved; // 진짜 기록에 지워질 값이 들어 있을 때만 백업·확인을 해요 (예시 기록이나 빈 칸뿐이면 조용히 정리)
  if (valuable) {
    const name = `my-journal-backup-before-workout-lite-${todayStr().replace(/-/g, '')}.json`;
    await downloadBackup(name); // 정리하기 직전에 전체 백업
    if (!(await askCleanup(workoutLiteMessage(counts, name), name))) return; // 취소하면 아무것도 지우지 않고, 다음에 열 때 다시 물어봐요
  }
  if (dirty.length) {
    const at = Date.now();
    const next = dirty.map((r, i) => { const c = workoutLiteCopy(r); c.updatedAt = Math.max(at + i, (r.updatedAt || 0) + 1); return c; }); // 바꾼 시각을 새로 적어서 ☁ 다른 기기에도 반영돼요
    await Store.putMany(next);
    const byId = new Map(next.map((r) => [r.id, r]));
    records = records.map((r) => byId.get(r.id) || r);
  }
  settings.workoutLiteV1 = true;
  await saveSettings();
  if (dirty.length) { render(); if (valuable) toast('운동 기록을 정리했어요. 백업 파일은 다운로드 폴더에 있어요.', 5000); }
}

// 🎻 빠른 기록이 없어져서(🧘 운동은 앞서 없어졌어요) 모든 기록의 "간단 기록" 표시(quick)를 한 번만 지워요. 값이 아니라 표시라서 확인 없이 조용히 지워요.
//   바뀐 기록은 바꾼 시각도 새로 적어서 ☁ 다른 기기에도 반영돼요. 한 번 하고 나면 flag(quickFlagV1)가 켜져요.
//   예전 백업 파일을 불러올 때와 ☁ 에서 받아 올 때도 같은 규칙이에요(stripQuick).
function stripQuick(r, bump = false) {
  if (!r || !('quick' in r)) return r;
  const c = { ...r };
  delete c.quick;
  if (bump) c.updatedAt = Math.max(Date.now(), (r.updatedAt || 0) + 1);
  return c;
}
async function migrateQuickFlags() {
  if (settings.quickFlagV1) return;
  const todo = records.filter((r) => 'quick' in r);
  if (todo.length) {
    const at = Date.now();
    const next = todo.map((r, i) => { const c = stripQuick(r); c.updatedAt = Math.max(at + i, (r.updatedAt || 0) + 1); return c; });
    try { await Store.putMany(next); } catch (e) { return; } // 저장하지 못하면 다음에 다시 해요
    const byId = new Map(next.map((r) => [r.id, r]));
    records = records.map((r) => byId.get(r.id) || r);
  }
  settings.quickFlagV1 = true;
  await saveSettings();
}

/* ---------------------------------------------------------------------
   0-3. 🎻 교재별 한 줄 옮기기 (한 번만): 예전 기록의 "교재 + 곡 이름 + 교재 몇 번·몇 쪽"을 교재별 한 줄(books: [{ name, piece }])로 옮겨요.
        · 교재와 곡 이름이 같이 있으면: 첫 교재의 한 줄에 곡 이름, 나머지 교재는 빈칸, "그 밖에 연습한 곡"은 비워요.
        · 교재 없이 곡 이름만 있으면: "그 밖에 연습한 곡"에 그대로 둬요.
        · "교재 몇 번·몇 쪽"은 첫 교재의 한 줄이 비었으면 거기로, 차 있으면 " · "로 이어 붙여요. (교재가 하나도 없으면 "그 밖에 연습한 곡" 뒤에 이어 붙여요)
        옮기기 직전에 백업 파일을 내려받고 확인을 물어봐요. 바뀐 기록은 바꾼 시각을 새로 적어서 ☁ 다른 기기에도 반영돼요. 한 번 하고 나면 flag(booksV1)가 켜져요.
        예전 백업 파일을 불러올 때, 그리고 ☁ 에서 받아 올 때도 같은 규칙을 써요(booksCopy).
   --------------------------------------------------------------------- */
const booksNeedConvert = (r) => !!r && r.type === 'violin' && ((Array.isArray(r.books) && r.books.some((b) => typeof b === 'string')) || hasValue(r.bookPart));
function booksCopy(r, bump = false) {
  if (!booksNeedConvert(r)) return r;
  const c = { ...r };
  const rows = bookRows(r);
  const oldShape = Array.isArray(r.books) && r.books.some((b) => typeof b === 'string');
  let other = pieceKey(r.piece);
  if (oldShape && rows.length) { // 교재 + 곡 이름: 첫 교재의 한 줄로
    if (other && !rows[0].piece) { rows[0].piece = other; other = ''; }
  }
  if (hasValue(r.bookPart)) { // 교재 몇 번·몇 쪽
    const part = String(r.bookPart).trim();
    if (rows.length) rows[0].piece = rows[0].piece ? `${rows[0].piece} · ${part}` : part;
    else other = other ? `${other} · ${part}` : part;
  }
  if (Array.isArray(r.books)) c.books = rows;
  if ('piece' in r || other) c.piece = other;
  delete c.bookPart;
  if (bump) c.updatedAt = Math.max(Date.now(), (r.updatedAt || 0) + 1);
  return c;
}
function booksCounts(list) {
  const withBooks = list.filter((r) => Array.isArray(r.books) && r.books.some((b) => typeof b === 'string'));
  return {
    records: list.length,
    moved: withBooks.filter((r) => pieceKey(r.piece)).length,       // 곡 이름을 첫 교재의 한 줄로 옮기는 기록
    part: list.filter((r) => hasValue(r.bookPart)).length,          // "교재 몇 번·몇 쪽" 값이 있는 기록
  };
}
function booksMessage(c, name) {
  return `🎻 바이올린 기록이 "교재별 한 줄"로 바뀌었어요. 예전 모양으로 적힌 연습 기록 ${c.records}개를 새 모양으로 옮깁니다.\n${c.moved ? `· 곡 이름 ${c.moved}개는 첫 교재의 한 줄로 옮겨요\n` : ''}${c.part ? `· "교재 몇 번·몇 쪽" ${c.part}개는 첫 교재의 한 줄에 이어 붙여요\n` : ''}값은 지우지 않아요.\n\n옮기기 전에 백업을 저장했어요. (백업 파일은 다운로드 폴더에 있어요)`;
}
async function migrateBooks() {
  if (settings.booksV1) return;
  const dirty = records.filter(booksNeedConvert);
  const real = dirty.filter((r) => !r.sample);
  if (real.length) { // 진짜 기록이 있을 때만 백업·확인을 해요 (예시 기록뿐이면 조용히 옮겨요)
    const name = `my-journal-backup-before-books-${todayStr().replace(/-/g, '')}.json`;
    await downloadBackup(name); // 옮기기 직전에 전체 백업
    if (!(await askCleanup(booksMessage(booksCounts(real), name), name))) return; // 취소하면 아무것도 바꾸지 않고, 다음에 열 때 다시 물어봐요
  }
  if (dirty.length) {
    const at = Date.now();
    const next = dirty.map((r, i) => { const c = booksCopy(r); c.updatedAt = Math.max(at + i, (r.updatedAt || 0) + 1); return c; }); // 바꾼 시각을 새로 적어서 ☁ 다른 기기에도 반영돼요
    await Store.putMany(next);
    const byId = new Map(next.map((r) => [r.id, r]));
    records = records.map((r) => byId.get(r.id) || r);
  }
  settings.booksV1 = true;
  await saveSettings();
  if (dirty.length) { render(); if (real.length) toast('바이올린 기록을 교재별 한 줄로 옮겼어요. 백업 파일은 다운로드 폴더에 있어요.', 5000); }
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
      ${window.Sync ? Sync.cardHTML() : ''}
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
        ${AudioStore.ok() ? `<p class="meta">백업 파일에는 곡마다 첫 녹음만 들어가요. ${window.Sync && Sync.isEnabled() ? '☁ 동기화를 켜 두어서 <b>녹음도 Drive에 올라가요.</b> (백업 파일과는 별개예요)' : '나머지는 이 브라우저에만 저장돼서, 사이트 데이터를 지우면 사라져요. (☁ 동기화를 켜면 녹음도 Drive에 올라가요)'}</p>
        <label class="meta"><input type="checkbox" data-act="audioSkip" ${settings.audioSkip ? 'checked' : ''}> 녹음은 백업에서 빼기 <span class="hint">(켜면 첫 녹음도 백업 파일·자동 저장 파일에 넣지 않아요)</span></label>
        <p class="meta audio-size" style="margin:8px 0 0">이 기기에 저장된 녹음 ${esc(fmtMB(audios.filter((a) => a.local).reduce((n, a) => n + (a.size || 0), 0)))}</p>` : '<p class="meta">이 브라우저에서는 녹음을 저장할 수 없어요. 크롬에서 열어 주세요.</p>'}
      </div>
      <div class="card" style="margin:0">
        <h3>🍂 계절 장식</h3>
        <p class="meta">달마다 위쪽 제목 옆과 화면 오른쪽 아래에 작은 그림이 바뀌어요. 그림은 <b>app.js 맨 위의 SEASON_DECOR</b>에서 고칠 수 있어요.</p>
        <label class="meta"><input type="checkbox" data-act="season" ${settings.seasonOff ? '' : 'checked'}> 계절 장식 보기</label>
      </div>
      <div class="card" style="margin:0">
        <h3>${PLAYGROUND.icon} ${esc(PLAYGROUND.name)}</h3>
        <p class="meta">그림이 모여 있는 곳이에요. 그리고 싶은 날 들어가서 올리면 돼요. 안 그리는 날엔 여기 말고는 어디에도 나오지 않아요.</p>
        <button type="button" class="btn" data-act="playground">${PLAYGROUND.icon} ${esc(PLAYGROUND.name)} 들어가기</button>
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

const exportBackup = () => downloadBackup(`나의기록장-백업-${todayStr()}.json`);

async function downloadBackup(filename) {
  const payload = await backupPayload();
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
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
    const good = validRecords(payload, true);
    if (!good) throw new Error('형식 오류');
    if (!good.length) throw new Error('가져올 기록이 없어요');
    const audioCount = Array.isArray(payload.audios) ? payload.audios.length : 0;
    if (!confirm(`기록 ${good.length}개${audioCount ? `와 녹음 ${audioCount}개` : ''}를 불러올까요?`)) return;
    const goneIds = new Set(tombstones.map((t) => t.id)); // 지웠던 기록을 백업에서 되살리는 경우는 "새로 고친 것"으로 봐요 (☁ 동기화에서 삭제가 다시 덮어쓰지 않게)
    good.forEach((r) => { if (goneIds.has(r.id)) r.updatedAt = Date.now(); });
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
  if (e.target === dlg2) { dlg2.close(); return; }
  if (e.target === dlg) { if (!dlg.querySelector('#recForm')) closeDlg(); return; }

  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' && el.type === 'checkbox') return;
  const { act, id, type } = el.dataset;

  switch (act) {
    case 'tab':
      if (ui.tab !== id && !(await confirmLeaveNote())) break; // 저장하지 않은 한 줄이 있으면 물어봐요
      if (ui.tab !== id) { ui.exView = 'records'; ui.vnView = 'records'; ui.econView = 'routine'; ui.enView = 'list'; } // 다른 메뉴에서 들어오면 늘 첫 칩(기록)부터
      ui.tab = id; ui.query = '';
      render(); window.scrollTo(0, 0); break;
    case 'setView': ui[el.dataset.key] = id; render(); break;
    case 'playground': openPlayground(); break;
    case 'artFeedback': ui.artView = 'feedback'; render(); break;
    case 'artGallery': ui.artView = 'gallery'; render(); break;
    case 'artOpen': openArt(id); break;
    case 'artNav': artNav(Number(el.dataset.d)); break;
    case 'add': openForm(type); break;
    case 'edit': openForm(type, records.find((r) => r.id === id)); break;
    case 'del': {
      const r = records.find((x) => x.id === id);
      const name = r ? (r.type === 'rest' ? '쉰 날' : (r.topic || (r.type === 'violin' ? pieceNamesOf(r)[0] : r.piece) || r.asset || r.kind || '이 기록')) : '이 기록';
      if (confirm(`'${name}' 기록을 지울까요?\n지운 기록은 되돌릴 수 없어요.`)) {
        await deleteRecord(id); render(); refreshDay();
        if (ui.artOpen === id && dlg.querySelector('.art-detail')) closeDlg(); // 열어 둔 그림 상세 창이면 닫아요
      }
      break;
    }
    case 'closeDlg':
      if (ui.backToDay && dlg.querySelector('#recForm')) openDay(ui.backToDay);
      else if (ui.backToArt && dlg.querySelector('#recForm') && records.some((r) => r.id === ui.backToArt)) openArt(ui.backToArt, ui.artPhoto);
      else closeDlg();
      break;
    case 'calDay': openDay(el.dataset.date); break;
    case 'addOn': openForm(type, undefined, el.dataset.date); break;
    case 'calShift': ui.calMonth = shiftMonth(ui.calMonth, Number(el.dataset.d)); render(); break;
    case 'calToday': { // 이번 달로 가기만 해요 (이미 이번 달이면 아무 일도 없어요)
      const ym = todayStr().slice(0, 7);
      if (ui.calMonth !== ym) { ui.calMonth = ym; render(); }
      break;
    }
    case 'boardToday': { const ym = todayStr().slice(0, 7); if (ui.boardMonth !== ym) openBoard(ym); break; }
    case 'calCat':
      if (ui.calHidden.has(id)) ui.calHidden.delete(id); else ui.calHidden.add(id);
      render();
      break;
    case 'clearImage': formImages[el.dataset.key] = null; updateImagePreview(el.dataset.key); break;
    case 'moveShot': { // 사진 순서 바꾸기
      const i = Number(el.dataset.i); const j = i + Number(el.dataset.d);
      if (j >= 0 && j < formShots.length) { [formShots[i], formShots[j]] = [formShots[j], formShots[i]]; updateShotsPreview(); }
      break;
    }
    case 'removeShot': formShots.splice(Number(el.dataset.i), 1); updateShotsPreview(); { const n = $('#imgNote'); if (n) n.textContent = ''; } break;
    case 'pick': { // 칩 버튼: 하나짜리는 다시 누르면 풀리고, 여러 개짜리는 눌러서 켜고 끄기
      const box = el.closest('.choice');
      const input = box.querySelector('input[type=hidden]');
      if (box.dataset.multi === '1') {
        el.classList.toggle('on');
        el.setAttribute('aria-pressed', String(el.classList.contains('on')));
        input.value = JSON.stringify([...box.querySelectorAll('.choice-btn.on')].map((b) => b.dataset.val));
        if (input.name === 'books') syncBookRows();
      } else {
        const on = input.value !== el.dataset.val;
        input.value = on ? el.dataset.val : '';
        box.querySelectorAll('.choice-btn').forEach((b) => { b.classList.toggle('on', on && b === el); b.setAttribute('aria-pressed', String(on && b === el)); });
        if (input.name === 'artKind' && input.form) syncKindFields(input.form); // 종류가 모작일 때만 "원본 사진" 칸이 보여요
      }
      break;
    }
    case 'rest': await toggleRest(el.dataset.date); break;
    case 'recap': openRecap(); break;
    case 'routineChip': await toggleRoutineChip(el.dataset.date, el.dataset.chip); break;
    case 'pastNotes': openPastNotes(); break;
    case 'routineDot': await setRoutineCheck(el.dataset.date, el.dataset.routine, !routineChecked(routineOn(el.dataset.date), el.dataset.routine)); break;
    case 'playRec': await toggleCardPlay(el.dataset.aid); break;
    case 'claudeCard': await claudeCard(id); break;
    case 'claudePeriod': ui.claudePeriod = id; syncClaudeBox(); break;
    case 'claudeScope': ui.claudeScope = id; ui.claudePending = null; syncClaudeBox(); break;
    case 'claudeCopy': await claudeCopy(); break;
    case 'claudeSettings': clDraft = {}; openClaudeSettings(); break;
    case 'clScope': { const f = $('#clForm'); if (f) clDraft[f.dataset.scope] = { info: f.elements.info.value, request: f.elements.request.value }; openClaudeSettings(id); break; }
    case 'clReset': { const f = $('#clForm'); const m = scopeMeta(f.dataset.scope); f.elements[el.dataset.field].value = m[el.dataset.field]; break; }
    case 'clCancel': clDraft = {}; closeDlg(); break;
    case 'fbSave': await fbSave(el.closest('.fb-input'), el.dataset.target); break;
    case 'fbClose': ui.cardFbOpen.delete(id); refreshFeedbackViews(); break;
    case 'fbToggle': if (ui.cardFbShown.has(id)) ui.cardFbShown.delete(id); else ui.cardFbShown.add(id); refreshFeedbackViews(); break;
    case 'fbMore': if (ui.fbOpenText.has(id)) ui.fbOpenText.delete(id); else ui.fbOpenText.add(id); render(); break;
    case 'fbEdit': openFeedbackEdit(id); break;
    case 'fbDelete': if (confirm('이 피드백을 지울까요?\n지운 피드백은 되돌릴 수 없어요.')) { await deleteRecord(id); refreshFeedbackViews(); } break;
    case 'fbHide': {
      await hideTodo(id);
      const hint = el.closest('.fb-hint');
      if (el.dataset.refresh) render(); else if (hint) hint.remove(); // 입력 창은 그대로 두고 그 줄만 없애요
      break;
    }
    case 'manageBooks': openBooksManager(); break;
    case 'closeDlg2': dlg2.close(); break;
    case 'bookMove': await moveBook(Number(el.dataset.i), Number(el.dataset.d)); break;
    case 'bookHide': await hideBook(Number(el.dataset.i), true); break;
    case 'bookShow': await hideBook(Number(el.dataset.i), false); break;
    case 'delAudio': await deleteRecording(el.dataset.aid); break;
    case 'saveAudio': await saveAudioFile(el.dataset.aid); break;
    case 'fetchAudio': await fetchAudioFile(el.dataset.aid); break;
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
    case 'goto': goToRecord(id); break;
    case 'piece': openPiece(el.dataset.piece); break;
    case 'autosaveOn': await enableAutosave(); break;
    case 'autosaveReconnect': await reconnectAutosave(); break;
    case 'autosaveOff': await disableAutosave(); break;
    case 'cleanYes': answerCleanup(true); break;
    case 'cleanNo': answerCleanup(false); break;
    case 'cleanRestore': { const f = $('#cleanRestoreFile'); if (f) f.click(); break; }
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
      if (confirm(`정말 모든 기록을 지울까요? 되돌릴 수 없어요.${audios.length ? '\n곡에 붙여 둔 녹음도 함께 지워져요.' : ''}${window.Sync && Sync.isEnabled() ? '\n\n☁ 동기화가 켜져 있어서 Drive와 다른 기기에서도 지워져요.\n(이 기기에서만 지우려면 먼저 ☁ 에서 로그아웃해 주세요.)' : ''}`)) {
        const tombs = records.filter(isSyncedRecord).map(makeTomb); // 지운 흔적을 남겨서 다른 기기도 따라 지워요
        if (tombs.length) await Store.putMany(tombs);
        await Store.remove(records.filter((r) => !isSyncedRecord(r)).map((r) => r.id));
        tombstones = [...tombstones.filter((t) => !tombs.some((x) => x.id === t.id)), ...tombs];
        records = [];
        if (audios.length || audioTombs.length) { // 녹음도 지워요. 지운 흔적은 남겨서 ☁ 다른 기기와 Drive도 따라 지워요 (Drive 파일은 휴지통으로 가요)
          const at = Date.now();
          const atombs = audios.map((a, i) => ({ id: a.id, piece: a.piece, deletedAt: at + i, updatedAt: Math.max(at + i, (a.updatedAt || 0) + 1), rf: a.rf || '' }));
          try { await AudioStore.clear(); for (const t of atombs) await AudioStore.put(t); } catch (err) { /* 괜찮아요 */ }
          audioTombs = [...audioTombs.filter((t) => !atombs.some((x) => x.id === t.id)), ...atombs];
          audios = []; audioB64.clear();
          if (window.Sync) window.Sync.notify();
        }
        closeDlg(); render();
      }
      break;
    default: break;
  }
});

/* ---------------------------------------------------------------------
   한글 입력 중(글자를 조합하는 중) Enter 는 저장하지 않아요.
   한 줄짜리 입력란은 폼 안에 있어서 Enter 를 누르면 브라우저가 폼을 바로 보내요. 그런데 한글을 치다가 누르는 Enter 는
   "마지막 글자를 확정"하려는 것이라, 그때 저장되면 마지막 글자가 빠지거나 두 번 저장될 수 있어요. (휴대폰 키보드에서 특히 그래요)
   keydown(조합 중 Enter 를 눌렀을 때)과 submit(폼이 보내질 때) 두 곳에서 막아요. 조합이 끝난 뒤 다시 누른 Enter 부터 저장돼요.
   --------------------------------------------------------------------- */
let imeOn = false;   // 지금 글자를 조합하는 중인지
let imeAt = 0;       // 조합이 마지막으로 움직인 시각 (compositionstart·update·input). 끝났다는 신호(compositionend)가 안 와도 오래되면 조합이 끝난 것으로 봐요
let imeEndAt = 0;    // 마지막으로 조합이 끝난 시각
let imeEnterAt = 0;  // 조합 중(또는 막 끝난 직후)에 Enter 가 눌린 시각
const IME_GRACE = 150; // 조합이 끝난 직후 이 시간(ms) 안에 오는 Enter 는 "글자 확정"으로 봐요
const IME_STALE = 3000; // 조합이 이만큼(ms) 아무 움직임이 없으면 "조합 중" 표시가 남아 있어도 풀어요 (입력 창이 조합 도중에 닫히는 경우 등)
const IME_SUBMIT_GAP = 60; // 그런 Enter 로 곧바로 이어진 폼 보내기는 막아요 (일부러 다시 누른 Enter 는 이보다 늦어서 괜찮아요)
const imeTouch = () => { imeAt = Date.now(); };
document.addEventListener('compositionstart', () => { imeOn = true; imeTouch(); }, true);
document.addEventListener('compositionupdate', imeTouch, true);
document.addEventListener('input', (e) => { if (e.isComposing) imeTouch(); }, true);
document.addEventListener('compositionend', () => { imeOn = false; imeEndAt = Date.now(); }, true);
document.addEventListener('focusout', () => { imeOn = false; }, true); // 다른 곳으로 옮기면 조합은 끝나요
const imeBusy = (e) => !!(e && (e.isComposing || e.keyCode === 229)) || (imeOn && Date.now() - imeAt < IME_STALE) || Date.now() - imeEndAt < IME_GRACE;
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !imeBusy(e)) return;
  imeEnterAt = Date.now();
  if (e.target && e.target.tagName === 'INPUT') e.preventDefault(); // 한 줄짜리 입력란: 브라우저가 폼을 바로 보내지 못하게 해요
}, true);

// 저장을 두 번 누르거나(Enter 두 번) 저장하는 중에 또 보내지 않게, 폼마다 잠깐 잠가요
const busyForms = new WeakSet();
async function once(form, fn) {
  if (busyForms.has(form)) return;
  busyForms.add(form);
  try { await fn(); } finally { setTimeout(() => busyForms.delete(form), 400); }
}

document.addEventListener('submit', (e) => {
  if (Date.now() - imeEnterAt < IME_SUBMIT_GAP) { e.preventDefault(); e.stopImmediatePropagation(); return; } // 글자를 확정하는 Enter 로 보내진 폼은 저장하지 않아요
  const f = e.target;
  if (f.id === 'recForm') { e.preventDefault(); once(f, () => submitForm(f)); }
  else if (f.id === 'clForm') { e.preventDefault(); once(f, () => saveClaudeSettings()); }
  else if (f.id === 'fbEditForm') { e.preventDefault(); once(f, () => saveFeedbackEdit(f)); }
  else if (f.id === 'bookAddForm') { e.preventDefault(); once(f, () => addBook(f.elements[0].value)); }
  else if (f.id === 'rtNoteForm') { e.preventDefault(); once(f, () => saveRoutineNote(f.dataset.date)); }
  else if (f.id === 'pieceMemoForm') { e.preventDefault(); once(f, () => savePieceMemo(f.dataset.piece, f.elements.memo.value.trim())); }
}, true);

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.act === 'task') { await toggleTask(t.dataset.id, t.dataset.key, Number(t.dataset.i), t.checked); }
  else if ('fbDone' in t.dataset) { await setTodoDone(t.dataset.fbDone, t.checked); }
  else if (t.dataset.enSpeak) { const r = records.find((x) => x.id === t.dataset.enSpeak); if (r) { await saveRecord({ ...r, speak: t.checked, updatedAt: Date.now() }); render(); } }
  else if (t.dataset.routine && t.type === 'checkbox') { await setRoutineCheck(t.dataset.date, t.dataset.routine, t.checked); }
  else if (t.id === 'f_kind' && t.form && t.form.id === 'recForm') { syncKindFields(t.form); }
  else if (t.id === 'f_date') { // 날짜를 바꾸면 "새벽 4시 전이라 어제 기록" 안내는 사라져요
    const n = t.parentElement.querySelector('.dawn-note');
    if (n) n.hidden = t.value !== n.dataset.date;
  }
  else if (t.dataset.cal) {
    const [cy, cm] = ui.calMonth.split('-').map(Number);
    const ny = t.dataset.cal === 'year' ? Number(t.value) : cy;
    const nm = t.dataset.cal === 'month' ? Number(t.value) : cm;
    ui.calMonth = `${ny}-${pad(nm)}`;
    render();
  }
  else if (t.id === 'importFile' && t.files[0]) { await importBackup(t.files[0]); }
  else if (t.id === 'cleanRestoreFile' && t.files[0]) { const f = t.files[0]; t.value = ''; await importBackup(f); } // 정리 확인 창의 "정리 전 백업 파일 불러오기"
  else if (t.dataset.imageInput && t.files[0]) { await attachImage(t.files[0], t.dataset.imageInput); t.value = ''; }
  else if ('shots' in t.dataset && t.files.length) { const files = [...t.files]; t.value = ''; await attachShots(files); }
  else if (t.dataset.act === 'celebrate') { settings.celebrateOff = !t.checked; await saveSettings(); }
  else if (t.matches('[data-audio-input]') && t.files.length) { const files = [...t.files]; t.value = ''; await stageAudioFiles(files); }
  else if (t.dataset.audioMemo) { await saveAudioMemo(t.dataset.audioMemo, t.value.trim()); }
  else if (t.dataset.act === 'audioSkip') { settings.audioSkip = t.checked; await saveSettings(); scheduleAutosave(); }
  else if (t.dataset.act === 'season') { settings.seasonOff = !t.checked; await saveSettings(); applySeason(); }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'claudeQ') { ui.claudeQuestion[ui.claudeScope] = e.target.value; syncClaudeBox(); return; } // 복사할 글 미리보기
  if (e.target.dataset && 'routineNote' in e.target.dataset) { ui.noteDraft = { date: e.target.dataset.date, text: e.target.value }; ui.noteSavedUntil = 0; syncNoteBtn(e.target.dataset.date); return; } // 오늘 한 줄: 고치면 다시 [저장]
  if (e.target.dataset && e.target.dataset.stage) { // 올리려는 녹음의 날짜·메모
    const s = staged.find((x) => x.sid === e.target.dataset.sid);
    if (s) s[e.target.dataset.stage] = e.target.value;
    return;
  }
  if (e.target.id === 'search') { ui.query = e.target.value; $('#listBox').innerHTML = econBodyHTML(); }
});

$('#settingsBtn').addEventListener('click', openSettings);

// 창이 닫히면(취소·Esc 포함) 안에 있던 입력 내용도 비워요
dlg.addEventListener('close', () => { if (cleanupAsk) { const a = cleanupAsk; cleanupAsk = null; a.resolve(false); } revokeAudioUrls(dlg); dlg.innerHTML = ''; formImages = {}; formShots = []; staged = []; formBase = ''; ui.dayOpen = null; ui.backToDay = null; ui.backToArt = null; ui.artOpen = null; });

/* ---------------------------------------------------------------------
   데스크톱 단축키: 입력 창에서 Cmd+Enter(Ctrl+Enter)로 저장, Esc로 닫기
   (뭔가 적어 둔 창을 Esc로 닫을 때는 한 번 물어봐요)
   --------------------------------------------------------------------- */
function requestClose() {
  if (!dlg.open) return;
  if (isFormDirty() && !confirm('적어 둔 내용이 있어요.\n저장하지 않고 닫을까요?')) return;
  if (ui.backToDay && dlg.querySelector('#recForm')) openDay(ui.backToDay);
  else if (ui.backToArt && dlg.querySelector('#recForm') && records.some((r) => r.id === ui.backToArt)) openArt(ui.backToArt, ui.artPhoto);
  else closeDlg();
}

document.addEventListener('keydown', (e) => {
  if (dlg2.open) { if (e.key === 'Escape') { e.preventDefault(); dlg2.close(); } return; } // 작은 창(교재 관리)이 열려 있으면 그것만 닫아요
  if (!dlg.open) return;
  if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && dlg.querySelector('.art-detail') && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); artNav(e.key === 'ArrowLeft' ? -1 : 1); return; }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !imeBusy(e)) {
    const form = dlg.querySelector('#recForm');
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
  if (st) settings = { lastBackupAt: st.lastBackupAt || null, snoozeUntil: st.snoozeUntil || null, celebrateOff: !!st.celebrateOff, audioSkip: !!st.audioSkip, seasonOff: !!st.seasonOff, cleanupV2: !!st.cleanupV2, cleanupV3: !!st.cleanupV3, artKindV1: !!st.artKindV1, workoutLiteV1: !!st.workoutLiteV1, quickFlagV1: !!st.quickFlagV1, booksV1: !!st.booksV1, claudeBoxOpen: !!st.claudeBoxOpen };
  seeded = all.some((r) => r.id === '__meta_seeded');
  const rows = all.filter((r) => r.type !== 'meta');
  tombstones = rows.filter(isTomb); // 삭제 표시는 화면용 기록에 넣지 않아요
  const live = rows.filter((r) => !isTomb(r)).map(normalizeRecord);
  // 바꾼 시각(updatedAt)이 없던 예전 기록은 만든 시각으로 한 번 채워 둬요 (☁ 동기화가 기준으로 써요)
  const missing = live.filter((r) => !r.updatedAt);
  if (missing.length) {
    missing.forEach((r) => { r.updatedAt = r.createdAt || Date.parse(`${r.date}T12:00:00`) || Date.now(); });
    try { await Store._putMany(missing); } catch (e) { /* 저장하지 못해도 이번 사용에는 문제없어요 */ }
  }
  return live;
}

// 🎨 그림 "단계"를 "종류"로 한 번만 바꿔 적어 둬요 (그대로 모작·조금 바꿔 그리기 → 모작, 창작 → 창작, 없으면 모작).
//   예전 값(단계·원작자 등)은 그대로 남겨요. 바뀐 기록은 바꾼 시각도 새로 적어서 ☁ 다른 기기에도 반영돼요. 한 번 하고 나면 flag(artKindV1)가 켜져요.
async function migrateArtKinds() {
  if (settings.artKindV1) return;
  const at = Date.now();
  const todo = records.filter((r) => r.type === 'art' && !ART_KINDS.includes(r.artKind));
  if (todo.length) {
    const next = todo.map((r, i) => ({ ...r, artKind: artKindOf(r), updatedAt: Math.max(at + i, (r.updatedAt || 0) + 1) }));
    try { await Store.putMany(next); } catch (e) { return; } // 저장하지 못하면 다음에 다시 해요
    const byId = new Map(next.map((r) => [r.id, r]));
    records = records.map((r) => byId.get(r.id) || r);
  }
  settings.artKindV1 = true;
  await saveSettings();
}

async function start() {
  await Store.init();
  records = await loadRecords();
  await AudioStore.init();
  const audioRows = await AudioStore.all();
  loadAudioRows(audioRows); // 녹음 파일은 재생할 때만 꺼내 와요 (여기서는 정보만 메모리에 둬요)
  backfillAudioTimes(audioRows);
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
  await migrateArtKinds();
  await migrateQuickFlags();
  render();
  window.__journalReady = true;
  document.dispatchEvent(new Event('journal:ready')); // ☁ 동기화(sync.js)가 이때부터 시작해요
  setTimeout(() => { // 화면이 먼저 보인 뒤에 물어봐요
    runUpdateCleanup().catch(() => { /* 정리하지 못하면 다음에 열 때 다시 해요 */ })
      .then(() => migrateWorkoutLite()).catch(() => { /* 정리하지 못하면 다음에 열 때 다시 해요 */ })
      .then(() => migrateBooks()).catch(() => { /* 옮기지 못하면 다음에 열 때 다시 해요 */ })
      .finally(() => {
        window.__cleanupDone = true;
        document.dispatchEvent(new Event('journal:cleanup-done')); // 정리 확인이 끝난 뒤에 첫 동기화를 해요
      });
  }, 500);
}

// 휴대폰: 입력 칸을 누르면 화면 키보드가 올라와도 그 칸이 가려지지 않게 가운데로 보여줘요. (컴퓨터 화면에서는 아무 일도 하지 않아요)
document.addEventListener('focusin', (e) => {
  const t = e.target;
  if (!t || !t.matches || !t.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select')) return;
  if (!window.matchMedia('(max-width: 900px)').matches) return;
  setTimeout(() => { try { if (document.activeElement === t) t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { /* 괜찮아요 */ } }, 300);
});

document.addEventListener('visibilitychange', () => { if (document.hidden) { if (autosaveTimer) runAutosave(); } }); // 탭을 닫기 직전에도 저장
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && (ui.tab === 'cal' || ui.tab === 'econ') && !dlg.open && view.dataset.today && view.dataset.today !== todayStr()) render();
});

start().catch((err) => {
  view.innerHTML = `<div class="notice" style="max-width:none">시작하는 중 문제가 생겼어요: ${esc(err.message)}<br>크롬 같은 다른 브라우저로 열어 보세요.</div>`;
});
