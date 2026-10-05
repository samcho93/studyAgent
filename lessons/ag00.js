/* 00 시작하기: 강좌 안내 · 실습 환경 · API 키 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  const FIG_SERIES = `<svg viewBox="0 0 720 210" role="img" aria-label="시리즈 다섯 과정: 머신러닝 기초, MLStudio, LLM, RAG, 에이전트. 이 과정은 다섯 번째">
  ${ARROW('m00a1')}
  <rect x="10" y="40" width="120" height="70" rx="12" class="p2s"/><text x="70" y="68" text-anchor="middle" class="tx-b">① ML 기초</text><text x="70" y="90" text-anchor="middle" class="tx-m">회귀 · 분류 · 딥러닝</text>
  <rect x="155" y="40" width="120" height="70" rx="12" class="p2s"/><text x="215" y="68" text-anchor="middle" class="tx-b">② MLStudio</text><text x="215" y="90" text-anchor="middle" class="tx-m">실전 모델링</text>
  <rect x="300" y="40" width="120" height="70" rx="12" class="p3s"/><text x="360" y="68" text-anchor="middle" class="tx-b">③ LLM</text><text x="360" y="90" text-anchor="middle" class="tx-m">트랜스포머 · 프롬프트</text>
  <rect x="445" y="40" width="120" height="70" rx="12" class="p3s"/><text x="505" y="68" text-anchor="middle" class="tx-b">④ RAG</text><text x="505" y="90" text-anchor="middle" class="tx-m">검색 증강 생성</text>
  <rect x="590" y="30" width="120" height="90" rx="12" class="p1"/><text x="650" y="62" text-anchor="middle" class="tx-w" font-weight="700">⑤ 에이전트</text><text x="650" y="84" text-anchor="middle" class="tx-w">도구 · 기억 · 계획</text><text x="650" y="104" text-anchor="middle" class="tx-w">프레임워크</text>
  <line x1="132" y1="75" x2="151" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a1)"/>
  <line x1="277" y1="75" x2="296" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a1)"/>
  <line x1="422" y1="75" x2="441" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a1)"/>
  <line x1="567" y1="75" x2="586" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a1)"/>
  <text x="650" y="145" text-anchor="middle" class="tx-b">이 과정</text>
  <text x="360" y="160" text-anchor="middle" class="tx-m">③ 과 ④ 에서 배운 LLM 호출 · 프롬프트 · 검색을 “스스로 행동하는 프로그램”으로 엮습니다</text>
  <text x="360" y="190" text-anchor="middle" class="tx-m">파이썬 기초와 LLM API 를 한 번쯤 써 본 적이 있으면 충분합니다</text>
</svg>`;

  const FIG_SCREEN = `<svg viewBox="0 0 720 340" role="img" aria-label="강좌 화면 구성: 왼쪽 목차와 API 키 버튼, 가운데 강의 문서와 코드 편집기, 오른쪽 실행 결과 창">
  ${ARROW('m00a2')}
  <rect x="10" y="10" width="700" height="320" rx="12" class="card-bg"/>
  <rect x="10" y="10" width="150" height="320" rx="12" class="bg"/>
  <text x="85" y="38" text-anchor="middle" class="tx-b" font-size="13">📚 목차</text>
  <rect x="22" y="50" width="126" height="20" rx="5" class="p1s"/><text x="30" y="64" class="tx-m" font-size="11">Part 1. 시작하기</text>
  <text x="34" y="88" class="tx-m" font-size="11">00 시작하기 ◀</text>
  <text x="34" y="106" class="tx-m" font-size="11">01 에이전트란?</text>
  <text x="34" y="124" class="tx-m" font-size="11">02 LLM API</text>
  <rect x="22" y="138" width="126" height="20" rx="5" class="p2s"/><text x="30" y="152" class="tx-m" font-size="11">Part 2. 4대 요소</text>
  <text x="34" y="176" class="tx-m" font-size="11">03 ~ 06</text>
  <rect x="22" y="250" width="126" height="26" rx="6" class="p3s"/><text x="85" y="267" text-anchor="middle" class="tx" font-size="11">🎓 학생 / 🧑‍🏫 교사</text>
  <rect x="22" y="286" width="126" height="26" rx="6" class="p5s"/><text x="85" y="303" text-anchor="middle" class="tx" font-size="11">🔑 API 키 (모의 LLM)</text>
  <rect x="170" y="22" width="320" height="180" rx="8" class="bg"/>
  <text x="184" y="44" class="tx-b" font-size="13">00 시작하기: 강좌 안내</text>
  <line x1="184" y1="58" x2="470" y2="58" class="ln"/><line x1="184" y1="72" x2="430" y2="72" class="ln"/><line x1="184" y1="86" x2="455" y2="86" class="ln"/>
  <rect x="184" y="100" width="290" height="50" rx="6" class="p1s"/><text x="196" y="120" class="tx" font-family="monospace" font-size="11">import agentlab as al</text><text x="196" y="138" class="tx" font-family="monospace" font-size="11">print(al.LLM().ask('안녕'))</text>
  <rect x="404" y="158" width="70" height="24" rx="6" class="p1"/><text x="439" y="175" text-anchor="middle" class="tx-w" font-size="11">▶ 실행</text>
  <rect x="170" y="212" width="320" height="106" rx="8" class="bg"/>
  <text x="184" y="232" class="tx-b" font-size="12">✏️ 코드 편집기</text>
  <text x="184" y="254" class="tx-m" font-family="monospace" font-size="11">import agentlab as al</text>
  <text x="184" y="272" class="tx-m" font-family="monospace" font-size="11">llm = al.LLM()</text>
  <text x="184" y="290" class="tx-m" font-family="monospace" font-size="11">print(llm.ask('안녕'))</text>
  <rect x="500" y="22" width="200" height="296" rx="8" class="bg"/>
  <text x="600" y="44" text-anchor="middle" class="tx-b" font-size="13">▶ 실행 결과</text>
  <text x="512" y="72" class="tx" font-family="monospace" font-size="11">🤖 LLM: 모의 LLM</text>
  <text x="512" y="96" class="tx" font-family="monospace" font-size="11">🔧 get_weather(서울)</text>
  <text x="512" y="116" class="tx" font-family="monospace" font-size="11">👁 {"temperature": 18}</text>
  <text x="512" y="136" class="tx" font-family="monospace" font-size="11">✅ 서울은 맑음 18°C</text>
  <text x="512" y="170" class="tx-m" font-size="11">에이전트의 생각 → 행동</text>
  <text x="512" y="186" class="tx-m" font-size="11">→ 관찰 → 답 과정이</text>
  <text x="512" y="202" class="tx-m" font-size="11">여기에 찍힙니다</text>
  <line x1="330" y1="200" x2="330" y2="208" class="ln" stroke-width="2" marker-end="url(#m00a2)"/>
  <text x="340" y="207" class="tx-m" font-size="10">▶ 를 누르면 코드가 편집기로</text>
</svg>`;

  const FIG_ENV = `<svg viewBox="0 0 720 240" role="img" aria-label="브라우저 실습(agentlab)과 Colab 실습(실제 프레임워크)의 역할 분담">
  ${ARROW('m00a3')}
  <rect x="10" y="10" width="320" height="220" rx="14" class="p1s"/>
  <rect x="390" y="10" width="320" height="220" rx="14" class="p3s"/>
  <text x="170" y="42" text-anchor="middle" class="tx-b">🌐 이 페이지 (브라우저 파이썬)</text>
  <text x="30" y="76" class="tx">• 설치 · 로그인 없이 바로 ▶ 실행</text>
  <text x="30" y="102" class="tx">• 강좌 모듈 <tspan font-family="monospace">agentlab</tspan> 으로 원리 구현</text>
  <text x="30" y="128" class="tx">• 키가 없으면 모의 LLM, 있으면 실제 모델</text>
  <text x="30" y="154" class="tx">• 에이전트 루프가 결과 창에 한 줄씩</text>
  <text x="170" y="200" text-anchor="middle" class="tx-m">원리 이해 · 작은 실험 · 수업 중 실습</text>
  <text x="550" y="42" text-anchor="middle" class="tx-b">🟠 Google Colab (본인 계정)</text>
  <text x="410" y="76" class="tx">• pip 로 실제 SDK · 프레임워크 설치</text>
  <text x="410" y="102" class="tx">• LangChain · LangGraph · CrewAI · AutoGen</text>
  <text x="410" y="128" class="tx">• API 키는 Colab Secrets(🔑) 에</text>
  <text x="410" y="154" class="tx">• 차시별 노트북 + 교사용 정답</text>
  <text x="550" y="200" text-anchor="middle" class="tx-m">실제 도구로 같은 것을 다시 만들기</text>
  <line x1="334" y1="110" x2="386" y2="110" class="ln" stroke-width="2.5" marker-end="url(#m00a3)"/>
  <text x="360" y="98" text-anchor="middle" class="tx-m" font-size="11">같은 이름</text>
  <text x="360" y="132" text-anchor="middle" class="tx-m" font-size="11">같은 개념</text>
</svg>`;

  const FIG_KEYFLOW = `<svg viewBox="0 0 720 270" role="img" aria-label="API 키의 흐름: 발급 페이지에서 복사해 키 버튼에 붙여 넣으면 탭 세션에만 저장되고 브라우저 파이썬이 공급자 API 를 직접 호출한다. 코드나 GitHub 에는 절대 넣지 않는다">
  ${ARROW('m00a4')}
  <rect x="10" y="40" width="140" height="70" rx="12" class="p3s"/><text x="80" y="68" text-anchor="middle" class="tx-b">키 발급 페이지</text><text x="80" y="90" text-anchor="middle" class="tx-m">AI Studio · Groq …</text>
  <rect x="190" y="40" width="140" height="70" rx="12" class="p5s"/><text x="260" y="68" text-anchor="middle" class="tx-b">🔑 API 키 버튼</text><text x="260" y="90" text-anchor="middle" class="tx-m">공급자 선택 · 붙여넣기</text>
  <rect x="370" y="40" width="140" height="70" rx="12" class="p1s"/><text x="440" y="68" text-anchor="middle" class="tx-b">탭 세션 저장소</text><text x="440" y="90" text-anchor="middle" class="tx-m">탭을 닫으면 사라짐</text>
  <rect x="550" y="40" width="160" height="70" rx="12" class="p1"/><text x="630" y="68" text-anchor="middle" class="tx-w" font-weight="700">공급자 API 서버</text><text x="630" y="90" text-anchor="middle" class="tx-w">브라우저가 직접 호출</text>
  <line x1="152" y1="75" x2="186" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a4)"/>
  <line x1="332" y1="75" x2="366" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a4)"/>
  <line x1="512" y1="75" x2="546" y2="75" class="ln" stroke-width="2" marker-end="url(#m00a4)"/>
  <text x="80" y="130" text-anchor="middle" class="tx-m" font-size="11">① 복사</text>
  <text x="260" y="130" text-anchor="middle" class="tx-m" font-size="11">② 저장 · 연결 테스트</text>
  <text x="440" y="130" text-anchor="middle" class="tx-m" font-size="11">③ agentlab 이 환경 변수로 읽음</text>
  <text x="630" y="130" text-anchor="middle" class="tx-m" font-size="11">④ 요청마다 키를 헤더에 실어 보냄</text>
  <rect x="60" y="165" width="600" height="90" rx="12" class="card-bg"/>
  <text x="360" y="190" text-anchor="middle" class="tx-b">❌ 키가 절대 가면 안 되는 곳</text>
  <text x="130" y="222" text-anchor="middle" class="tx">코드 파일 안</text>
  <text x="290" y="222" text-anchor="middle" class="tx">GitHub · 공유 문서</text>
  <text x="450" y="222" text-anchor="middle" class="tx">채팅 · 화면 캡처</text>
  <text x="600" y="222" text-anchor="middle" class="tx">이 강좌 서버</text>
  <text x="360" y="245" text-anchor="middle" class="tx-m" font-size="11">(이 사이트는 서버가 없는 정적 페이지라 키를 받을 곳 자체가 없습니다)</text>
</svg>`;

  const FIG_MOCKREAL = `<svg viewBox="0 0 700 250" role="img" aria-label="같은 코드가 키가 없으면 모의 LLM 으로, 키가 있으면 실제 모델로 실행되어 다른 답을 낸다">
  ${ARROW('m00a5')}
  <rect x="10" y="80" width="200" height="90" rx="12" class="card-bg"/>
  <text x="110" y="106" text-anchor="middle" class="tx-b">같은 코드</text>
  <text x="24" y="130" class="tx" font-family="monospace" font-size="12">llm = al.LLM()</text>
  <text x="24" y="150" class="tx" font-family="monospace" font-size="12">llm.ask('안녕')</text>
  <rect x="300" y="20" width="170" height="80" rx="12" class="p3s"/><text x="385" y="48" text-anchor="middle" class="tx-b">🔑 없음</text><text x="385" y="70" text-anchor="middle" class="tx-m">모의 LLM (규칙 기반)</text><text x="385" y="88" text-anchor="middle" class="tx-m">항상 같은 답 · 무료 · 즉시</text>
  <rect x="300" y="150" width="170" height="80" rx="12" class="p1s"/><text x="385" y="178" text-anchor="middle" class="tx-b">🔑 있음</text><text x="385" y="200" text-anchor="middle" class="tx-m">Gemini · Groq · … 실제 모델</text><text x="385" y="218" text-anchor="middle" class="tx-m">매번 조금 다른 답 · 1~5초</text>
  <line x1="212" y1="110" x2="296" y2="62" class="ln" stroke-width="2" marker-end="url(#m00a5)"/>
  <line x1="212" y1="140" x2="296" y2="188" class="ln" stroke-width="2" marker-end="url(#m00a5)"/>
  <rect x="510" y="30" width="180" height="60" rx="10" class="bg"/><text x="600" y="55" text-anchor="middle" class="tx" font-size="12">"안녕하세요! 무엇을</text><text x="600" y="75" text-anchor="middle" class="tx" font-size="12">도와드릴까요?"</text>
  <rect x="510" y="160" width="180" height="60" rx="10" class="bg"/><text x="600" y="185" text-anchor="middle" class="tx" font-size="12">"안녕하세요! 오늘 기분은</text><text x="600" y="205" text-anchor="middle" class="tx" font-size="12">어떠세요? 😊"</text>
  <line x1="472" y1="60" x2="506" y2="60" class="ln" stroke-width="2" marker-end="url(#m00a5)"/>
  <line x1="472" y1="190" x2="506" y2="190" class="ln" stroke-width="2" marker-end="url(#m00a5)"/>
  <text x="350" y="130" text-anchor="middle" class="tx-m" font-size="11">에이전트의 구조(판단 → 도구 → 관찰 → 답)는 양쪽이 똑같습니다</text>
</svg>`;

  const FIG_RATE = `<svg viewBox="0 0 680 220" role="img" aria-label="분당 요청 한도 개념: 1분 안에 허용된 횟수를 넘긴 요청은 429 오류를 받는다">
  ${ARROW('m00a6')}
  <line x1="40" y1="150" x2="640" y2="150" class="ax" marker-end="url(#m00a6)"/>
  <text x="650" y="154" class="tx-m" font-size="11">시간</text>
  <line x1="60" y1="140" x2="60" y2="160" class="ax"/><text x="60" y="178" text-anchor="middle" class="tx-m" font-size="11">0초</text>
  <line x1="420" y1="140" x2="420" y2="160" class="ax"/><text x="420" y="178" text-anchor="middle" class="tx-m" font-size="11">60초</text>
  <rect x="60" y="60" width="360" height="90" rx="6" class="p1s" opacity=".5"/>
  <text x="240" y="50" text-anchor="middle" class="tx-b">1분 창(window) — 예: 분당 15회 허용</text>
  <g class="p1">
    <rect x="80" y="100" width="10" height="50" rx="2"/><rect x="100" y="100" width="10" height="50" rx="2"/><rect x="120" y="100" width="10" height="50" rx="2"/><rect x="140" y="100" width="10" height="50" rx="2"/><rect x="160" y="100" width="10" height="50" rx="2"/>
    <rect x="190" y="100" width="10" height="50" rx="2"/><rect x="210" y="100" width="10" height="50" rx="2"/><rect x="230" y="100" width="10" height="50" rx="2"/><rect x="250" y="100" width="10" height="50" rx="2"/><rect x="270" y="100" width="10" height="50" rx="2"/>
    <rect x="300" y="100" width="10" height="50" rx="2"/><rect x="320" y="100" width="10" height="50" rx="2"/><rect x="340" y="100" width="10" height="50" rx="2"/><rect x="360" y="100" width="10" height="50" rx="2"/><rect x="380" y="100" width="10" height="50" rx="2"/>
  </g>
  <rect x="400" y="100" width="10" height="50" rx="2" class="p4"/>
  <text x="405" y="92" text-anchor="middle" class="tx-b" font-size="11">16번째</text>
  <text x="405" y="78" text-anchor="middle" class="tx-b" font-size="11">HTTP 429</text>
  <rect x="460" y="100" width="10" height="50" rx="2" class="p2"/><rect x="490" y="100" width="10" height="50" rx="2" class="p2"/>
  <text x="480" y="92" text-anchor="middle" class="tx-m" font-size="11">잠시 뒤 다시 OK</text>
  <text x="340" y="205" text-anchor="middle" class="tx-m">RPM(분당 요청) · TPM(분당 토큰) · RPD(하루 요청) — 무료 등급은 셋 모두 제한이 있습니다</text>
</svg>`;

  const QUIZ1 = [
    { q: '이 강좌 웹 페이지에서 <code>al.LLM()</code> 을 만들었을 때, 🔑 API 키를 넣지 않았다면 어떤 일이 일어날까?', options: ['오류가 나서 실행이 멈춘다', '모의 LLM 이 규칙 기반으로 항상 같은 답을 돌려준다', '자동으로 무료 키를 발급받는다', '아무 답도 돌려주지 않는다'], answer: 1,
      explain: '키가 없으면 <b>모의 LLM</b>(MockLLM)이 대신 답합니다. 진짜 모델보다 단순하지만 에이전트 루프의 구조는 똑같이 체험할 수 있습니다.' },
    { q: '에이전트가 도구를 호출하고 관찰한 과정(🔧 · 👁 · ✅)은 화면의 어디에 나타날까?', options: ['왼쪽 목차 아래', '오른쪽 실행 결과 창', '새 브라우저 탭', '파일로만 저장된다'], answer: 1,
      explain: '파이썬 출력은 모두 오른쪽 <b>실행 결과 창</b>에 찍힙니다. 에이전트의 생각 → 행동 → 관찰 → 답 흐름을 여기서 읽는 연습이 이 강좌의 핵심입니다.' },
    { q: '이 강좌에서 브라우저 실습(agentlab)과 Colab 실습의 역할 분담으로 알맞은 것은?', options: ['브라우저는 이론만, Colab 은 코드만', '브라우저에서 원리를 직접 구현하고, Colab 에서 실제 프레임워크로 같은 것을 다시 만든다', '브라우저는 교사만, Colab 은 학생만 사용한다', '둘은 완전히 다른 내용을 다룬다'], answer: 1,
      explain: '브라우저에서는 설치 없이 <code>agentlab</code> 으로 원리를 체험하고, Colab 에서는 pip 로 LangChain · CrewAI 같은 실제 프레임워크를 설치해 같은 개념을 다시 만듭니다. 이름을 맞춰 두어 코드가 거의 같습니다.' },
    { q: '<code>llm.ask(\'에이전트가 뭐야?\', system_prompt=\'당신은 친절한 조교입니다.\')</code> 를 모의 LLM 으로 실행하면 답 앞에 무엇이 붙을까?', options: ['<code>[친절한 조교]</code>', '<code>[mock]</code>', '아무것도 붙지 않는다', '<code>[system]</code>'], answer: 0,
      explain: '모의 LLM 은 시스템 프롬프트의 “당신은 OO입니다” 에서 역할을 읽어 답 앞에 <code>[OO]</code> 를 붙입니다. 역할(페르소나)이 바뀌는 것을 눈으로 확인하기 위한 장치입니다.' }
  ];
  const QUIZ2 = [
    { q: '🔑 버튼으로 넣은 API 키는 어디에 저장될까?', options: ['강좌 서버의 데이터베이스', 'GitHub 저장소', '이 브라우저 탭의 세션 저장소 (탭을 닫으면 사라짐)', '코드 파일 안'], answer: 2,
      explain: '키는 <b>sessionStorage</b> 에만 저장되고 탭을 닫으면 사라집니다. 서버나 저장소로 보내지 않으며, 파이썬 쪽에서는 환경 변수로만 읽습니다.' },
    { q: '다음 중 API 키를 다루는 방법으로 <b>가장 위험한</b> 것은?', options: ['🔑 버튼에 붙여 넣고 세션에만 저장한다', 'Colab Secrets 에 넣고 <code>userdata.get()</code> 으로 읽는다', '코드에 <code>api_key=\'AIza...\'</code> 로 직접 적고 GitHub 에 올린다', '환경 변수에 넣고 <code>os.environ.get()</code> 으로 읽는다'], answer: 2,
      explain: '공개 저장소에 올라간 키는 자동 스캔 봇이 몇 분 안에 찾아내 악용합니다. 키는 코드와 분리해 세션 · Secrets · 환경 변수에만 둡니다.' },
    { q: '무료 등급 API 를 쓰다가 <code>HTTP 429</code> 오류가 났다. 가장 알맞은 대처는?', options: ['키가 틀렸으니 다시 발급받는다', '요청 한도(RPM 등)를 넘긴 것이므로 잠시 기다렸다가 다시 시도한다', '모델 이름을 바꾼다', '브라우저를 재설치한다'], answer: 1,
      explain: '429 = Too Many Requests. 분당 · 하루 요청 한도를 넘긴 것입니다. 잠시 기다리거나 호출 횟수를 줄입니다. 401/403 이 키 오류, 404 가 모델 이름 오류입니다.' },
    { q: '모의 LLM 과 실제 LLM 의 차이로 <b>옳지 않은</b> 것은?', options: ['모의 LLM 은 항상 같은 답을 돌려준다', '실제 LLM 은 같은 질문에도 매번 조금 다른 답을 낼 수 있다', '모의 LLM 을 쓰면 에이전트 루프의 구조(판단 → 도구 → 관찰 → 답)도 달라진다', '실제 LLM 은 호출당 1~5초가 걸리고 토큰을 소모한다'], answer: 2,
      explain: '모의 LLM 은 답의 내용만 단순할 뿐, <code>al.Agent</code> 가 도는 구조는 실제 모델과 똑같습니다. 그래서 키 없이도 수업이 그대로 진행됩니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag00',
    no: '00',
    title: '시작하기: 강좌 안내 · 실습 환경 · API 키',
    subtitle: '브라우저 agentlab · Google Colab · 무료 API 키',
    summary: '이 강좌의 학습 경로와 화면 사용법을 익히고, <b>첫 LLM 호출 코드</b>를 실행해 봅니다. 이어서 Gemini · Groq · OpenRouter · Ollama 같은 <b>무료 API 키</b>를 발급받아 안전하게 설정하는 방법과, 키가 없을 때 동작하는 <b>모의 LLM</b> 의 역할을 알아봅니다.',
    goals: [
      '강좌 화면(목차 · 강의 · 결과 창)과 학생용/교사용 보기, 🔑 API 키 버튼을 사용할 수 있다',
      '브라우저 실습(agentlab)과 Colab 실습(실제 프레임워크)의 역할을 구분할 수 있다',
      '<code>al.LLM().ask()</code> 로 첫 LLM 호출을 실행하고 결과 창을 읽을 수 있다',
      '무료 API 키를 발급받아 세션에만 저장하고, 키를 코드에 쓰면 안 되는 이유를 설명할 수 있다',
      '요청 한도(RPM)와 토큰 사용량의 개념을 알고 <code>llm.total_usage</code> 로 확인할 수 있다'
    ],
    sections: [
      {
        id: 'ag00-1',
        title: '강좌 안내 · 화면 사용법 · 첫 코드 실행',
        minutes: 50,
        goals: ['시리즈 학습 경로에서 이 과정의 위치를 안다', '화면의 세 영역과 ▶ 실행 흐름을 사용한다', 'agentlab 으로 첫 LLM 호출을 실행한다', '브라우저 실습과 Colab 실습의 역할을 구분한다'],
        flow: [['강좌 소개 · 학습 경로', 10], ['화면 사용법', 8], ['첫 코드 실행', 17], ['두 가지 실습 환경', 10], ['퀴즈 · 정리', 5]],
        content: [
          { type: 'p', html: '챗봇에게 질문하면 답이 돌아옵니다. 그런데 “다음 주 부산 출장 일정을 짜고, 날씨를 확인하고, 숙소를 찾아 메모해 줘” 같은 일은 질문 한 번으로 끝나지 않습니다. 모델이 <b>스스로 계획을 세우고, 도구를 쓰고, 결과를 보고 다음 행동을 정해야</b> 합니다. 이렇게 행동하는 LLM 프로그램이 <b>AI 에이전트</b>이고, 이 강좌는 그것을 파이썬으로 직접 만드는 과정입니다.' },
          { type: 'h', text: '시리즈 학습 경로와 이 과정의 위치' },
          { type: 'p', html: '이 강좌는 다섯 개 과정으로 이어지는 시리즈의 <b>다섯 번째</b>입니다. ③ LLM 과정에서 모델 자체를, ④ RAG 과정에서 검색으로 답을 보강하는 방법을 배웠다면, 이번에는 그 LLM 을 <b>행동하는 프로그램</b>으로 묶습니다. 앞 과정을 듣지 않았더라도 파이썬 기초와 “LLM API 를 한 번 호출해 본 경험” 정도면 충분히 따라올 수 있습니다.' },
          { type: 'figure', html: FIG_SERIES, caption: '그림 0-1. 시리즈 ①~⑤. 이 과정(⑤)은 LLM 호출 · 프롬프트 · 검색을 “도구 · 기억 · 계획”으로 엮어 에이전트를 만듭니다.' },
          { type: 'table', head: ['Part', '차시', '내용', '핵심 도구'], rows: [
            ['1. 에이전트 시작하기', '00~02', '실습 환경 · API 키, 에이전트 개념, LLM API 다루기', 'agentlab · Gemini/OpenAI SDK'],
            ['2. 4대 핵심 요소', '03~06', '역할(페르소나), 도구 호출, 기억(단기 · 벡터), 계획과 반성', 'agentlab'],
            ['3. 핵심 프레임워크', '07~10', 'LangChain, LangGraph, CrewAI, AutoGen', 'Colab + 실제 프레임워크'],
            ['4. 프로젝트와 운영', '11~13', '날씨 · 검색 비서, 마케팅 에이전트 팀, 평가 · 안전 · 배포', '종합']
          ], caption: '강좌 로드맵 (14차시, 차시당 2~3교시)' },
          { type: 'h', text: '화면 사용법' },
          { type: 'p', html: '화면은 세 영역입니다. <b>왼쪽</b>은 목차와 학생용/교사용 전환, 그리고 <b>🔑 API 키</b> 버튼입니다. <b>가운데</b>는 강의 문서(개념 · 그림 · 예제 · 실습 · 퀴즈)와 그 아래의 코드 편집기, <b>오른쪽</b>은 파이썬의 출력이 찍히는 <b>실행 결과 창</b>입니다. 예제의 <b>▶ 실행</b>을 누르면 코드가 편집기로 들어가면서 바로 실행됩니다.' },
          { type: 'figure', html: FIG_SCREEN, caption: '그림 0-2. 화면 구성. 이 강좌에서는 오른쪽 결과 창에서 에이전트의 “생각 → 행동 → 관찰 → 답” 흐름을 읽는 일이 가장 중요합니다.' },
          { type: 'table', head: ['동작', '방법'], rows: [
            ['예제 실행', '예제 상자의 <b>▶ 실행</b> → 편집기에 코드가 들어가며 실행'],
            ['코드 고쳐서 다시 실행', '편집기에서 수정 후 <b>▶</b> 또는 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>'],
            ['결과 창 지우기', '결과 창의 🧹 버튼'],
            ['실습 정답 보기', '🧑‍🏫 교사용 화면에서만 표시 (비밀번호 필요)'],
            ['API 키 설정', '왼쪽 아래 <b>🔑</b> → 공급자 선택 → 키 붙여넣기 → 저장 · 연결 테스트']
          ], caption: '자주 쓰는 동작' },
          { type: 'h', text: '첫 코드 실행: agentlab 과 LLM' },
          { type: 'p', html: '이 강좌의 브라우저 실습은 모두 강좌 모듈 <code>agentlab</code> 으로 합니다. 보통 <code>import agentlab as al</code> 로 가져옵니다. 가장 먼저 지금 어떤 LLM 이 연결되어 있는지 확인해 봅시다.' },
          { type: 'code', title: '예제 0-1. 지금 연결된 LLM 확인하기', code: `import agentlab as al

al.status()          # 현재 LLM 설정 (모의 LLM / 실제 모델)
print('agentlab 버전:', al.__version__)`,
            expect: '🤖 LLM: 모의 LLM (API 키 없음) — 왼쪽 아래 🔑 API 키 에서 무료 키를 넣으면 실제 모델이 답합니다.\nagentlab 버전: 0.1.0',
            nondeterministic: true,
            desc: '처음 한 번은 브라우저 파이썬을 준비하느라 몇 초 걸립니다. 🔑 키를 넣지 않았다면 “모의 LLM” 이라고 나옵니다. 키를 넣으면 공급자와 모델 이름이 나옵니다.' },
          { type: 'code', title: '예제 0-2. 사용할 수 있는 공급자 목록', code: `import agentlab as al

al.providers()       # 공급자 표 (▶ 가 지금 선택된 것)`,
            nondeterministic: true,
            desc: '키가 없으면 <code>mock</code>(모의 LLM)이 선택됩니다. 2교시에서 Gemini · Groq · OpenRouter · Ollama 의 무료 키를 발급받아 넣어 봅니다. 표의 “키” 열은 지금 세션에 키가 있는지를 보여 줍니다.' },
          { type: 'p', html: '이제 LLM 에게 말을 걸어 봅시다. <code>al.LLM()</code> 이 LLM 객체를 만들고, <code>ask()</code> 가 한 번 묻고 문자열로 답을 받습니다.' },
          { type: 'code', title: '예제 0-3. 첫 LLM 호출', code: `import agentlab as al

llm = al.LLM()                       # 키가 있으면 실제 모델, 없으면 모의 LLM
print(llm)                           # 어떤 공급자 · 모델인지
print(llm.ask('간단히 자기소개 해 주세요.'))
print(llm.ask('AI 에이전트가 무엇인지 한 문장으로 설명해줘'))`,
            expect: 'LLM(mock, mock-1)\n저는 수업용 모의 LLM 입니다. API 키를 넣으면 실제 모델이 답합니다.\nAI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.',
            desc: '예시 출력은 모의 LLM 기준입니다. 실제 키를 넣으면 모델이 쓴 답이 나오고, 실행할 때마다 조금씩 달라질 수 있습니다. 모의 LLM 은 규칙으로 답하기 때문에 항상 같은 답을 줍니다.' },
          { type: 'code', title: '예제 0-4. 역할(시스템 프롬프트) 주기', code: `import agentlab as al

llm = al.LLM()
q = '에이전트가 뭐야?'
print('역할 없음 :', llm.ask(q))
print('조교 역할 :', llm.ask(q, system_prompt='당신은 친절한 조교입니다.'))
print('교수 역할 :', llm.ask(q, system_prompt='당신은 컴퓨터공학과 교수입니다.'))`,
            expect: '역할 없음 : AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\n조교 역할 : [친절한 조교] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\n교수 역할 : [컴퓨터공학과 교수] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.',
            desc: '<code>system_prompt</code> 는 모델에게 “누구로서 답할지”를 정해 주는 지시문입니다. 모의 LLM 은 역할을 알아보기 쉽도록 답 앞에 <code>[역할]</code> 을 붙입니다. 실제 모델은 말투와 내용 자체가 달라집니다. 03차시에서 자세히 다룹니다.' },
          { type: 'code', title: '예제 0-5. 호출 횟수와 토큰 사용량', code: `import agentlab as al

llm = al.LLM()
for q in ['안녕하세요', '에이전트가 뭐야?', '두 수를 더하는 함수를 작성해줘']:
    answer = llm.ask(q)
    print('Q:', q)
    print('A:', answer.split('\\n')[0])          # 첫 줄만
print('호출 횟수:', llm.calls)
print('누적 토큰:', llm.total_usage)`,
            expect: 'Q: 안녕하세요\nA: 안녕하세요! 무엇을 도와드릴까요?\nQ: 에이전트가 뭐야?\nA: AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\nQ: 두 수를 더하는 함수를 작성해줘\nA: def add(a, b):\n호출 횟수: 3\n누적 토큰: Usage(prompt=9, completion=52)',
            desc: 'LLM 은 호출할 때마다 <b>토큰</b>(단어 조각)을 소모하고, 유료 공급자는 토큰 수로 요금을 매깁니다. <code>llm.calls</code> 와 <code>llm.total_usage</code> 로 언제든 확인할 수 있습니다. 모의 LLM 의 토큰 수는 글자 수로 어림한 값입니다.' },
          { type: 'callout', kind: 'tip', title: '모의 LLM(Mock LLM)이란?', html: 'API 키가 없을 때 <code>al.LLM()</code> 이 대신 쓰는 <b>규칙 기반 가짜 모델</b>입니다. 인사 · 요약 · 번역 · 계획 · JSON 분류 같은 수업용 요청을 알아듣고, 도구가 있으면 질문의 키워드로 알맞은 도구를 고릅니다. 진짜 모델보다 훨씬 단순하지만 <b>에이전트 루프의 구조는 똑같이</b> 돌기 때문에 키 없이도 모든 실습이 동작합니다. 키를 넣는 순간 같은 코드가 실제 모델로 실행됩니다.' },
          { type: 'h', text: '두 가지 실습 환경' },
          { type: 'p', html: '브라우저에서는 pip 패키지를 설치할 수 없습니다. 그래서 LangChain · CrewAI 같은 실제 프레임워크는 <b>Google Colab</b> 에서 사용합니다. 대신 브라우저의 <code>agentlab</code> 은 실제 프레임워크와 <b>이름을 맞춰</b> 두었기 때문에, 원리를 브라우저에서 익힌 뒤 Colab 에서 import 문만 바꾸면 거의 같은 코드가 됩니다.' },
          { type: 'figure', html: FIG_ENV, caption: '그림 0-3. 브라우저에서 원리를 구현하고, Colab 에서 실제 프레임워크로 같은 것을 다시 만듭니다.' },
          { type: 'table', head: ['개념', '브라우저 (agentlab)', 'Colab (실제 프레임워크)', '차시'], rows: [
            ['LLM 호출', '<code>al.LLM().chat(messages)</code>', '<code>google-genai</code> · <code>openai</code> · <code>anthropic</code> SDK', '02'],
            ['도구', '<code>@al.tool</code>', 'LangChain <code>@tool</code>', '04 · 07'],
            ['에이전트 루프', '<code>al.Agent</code> · <code>al.ReActAgent</code>', 'LangChain 에이전트 · LangGraph', '01 · 08'],
            ['체인', '<code>al.PromptTemplate | llm | al.StrOutputParser()</code>', 'LangChain LCEL (같은 문법)', '07'],
            ['상태 그래프', '<code>al.StateGraph</code>', 'LangGraph <code>StateGraph</code>', '08'],
            ['에이전트 팀', '<code>al.Crew</code> · <code>al.GroupChat</code>', 'CrewAI · AutoGen', '09 · 10']
          ], caption: 'agentlab 과 실제 프레임워크의 대응' },
          { type: 'colab', title: 'Colab 실습 00 — 환경 준비와 첫 SDK 호출', html: '<p>Colab 에서 <code>google-genai</code> · <code>openai</code> SDK 를 설치하고, 2교시에서 발급받을 API 키를 <b>Colab Secrets(🔑)</b> 에 넣어 첫 호출을 해 봅니다. 버튼을 눌러 노트북을 열고 <b>본인 Google 계정</b>으로 로그인한 뒤 <b>파일 → Drive에 사본 저장</b>을 누르세요. 셀은 <b>Shift + Enter</b> 로 실행합니다.</p>' },
          { type: 'h', text: '한 학기 운영 계획 (예시)', teacher: true },
          { type: 'table', teacher: true, head: ['주', '차시', '주제', '비고'], rows: [
            ['1', '00 · 01', '강좌 안내 · API 키 · 에이전트란?', '키 발급 숙제 공지'], ['2', '02', 'LLM API 다루기', 'Colab Secrets 점검'], ['3', '03', '역할과 페르소나', ''],
            ['4', '04', '도구 호출', ''], ['5', '05', '기억 장치', ''], ['6', '06', '계획과 반성', '형성평가 1'],
            ['7', '07', 'LangChain', 'Colab 중심'], ['8', '08', 'LangGraph', ''], ['9', '09', 'CrewAI', ''], ['10', '10', 'AutoGen', '형성평가 2'],
            ['11–12', '11', '프로젝트 ① 비서 에이전트', ''], ['13–14', '12', '프로젝트 ② 마케팅 팀', '팀 프로젝트'], ['15', '13', '평가 · 안전 · 배포', ''], ['16', '—', '발표 · 동료 평가', '수행평가']
          ] },
          { type: 'table', teacher: true, head: ['평가 영역', '비율', '방법'], rows: [
            ['차시별 실습', '30%', '실습 과제 / Colab ✏️ 문제 → 공유 링크 또는 .ipynb 제출'],
            ['형성평가(퀴즈)', '20%', '차시별 퀴즈 + 6주 · 10주 형성평가'],
            ['프로젝트', '40%', '11 · 12차시 루브릭(목표 정의 · 도구 설계 · 루프 안정성 · 평가 · 발표 · 안전)'],
            ['참여 · 동료 평가', '10%', '수업 참여, 동료 평가지']
          ], caption: '평가 계획 (예시)' },
          { type: 'callout', kind: 'info', teacher: true, title: '수업 운영 팁', html: '<ul><li><b>교사용 화면</b>은 슬라이드(PPT) 모드입니다: <kbd>F</kbd> 전체 화면 · <kbd>←</kbd><kbd>→</kbd> 이동 · <kbd>R</kbd> 결과 창 · <kbd>N</kbd> 노트 · <kbd>T</kbd> 타이머. 슬라이드의 코드는 바로 수정 · ▶ 실행할 수 있습니다. 비밀번호는 <code>js/course.js</code> 의 <code>teacherPass</code>.</li><li>첫 시간은 <b>키 없이(모의 LLM)</b> 진행해도 모든 예제가 돌아갑니다. 키 발급은 2교시에 함께 하거나 숙제로 내고, 다음 시간에 실제 모델과 답을 비교하게 하면 동기 유발에 좋습니다.</li><li>학교 계정은 Google AI Studio · Colab 이 막혀 있을 수 있습니다. 개인 계정을 쓰게 하고, 만 18세 미만은 AI Studio 이용 약관을 확인하세요.</li><li>교실 공용 키는 권하지 않습니다. 30명이 한 키를 쓰면 분당 한도(RPM)에 바로 걸립니다. 꼭 필요하면 Groq 처럼 RPM 이 넉넉한 공급자를 고르고, 예제의 호출 횟수를 줄이세요.</li><li>정답 노트북은 공개 저장소에 있어 기술적으로 접근 가능합니다. 평가 과제는 질문 · 도구를 바꿔 출제하세요.</li></ul>' }
        ],
        practice: [
          { title: '실습 0-1. 질문 바꿔서 물어보기', level: 1,
            desc: '<p>LLM 에게 <b>질문 두 개</b>를 더 던지고(<code>llm.ask</code>), 마지막에 호출 횟수와 누적 토큰을 출력해 보세요. 모의 LLM 이 “요약해줘”, “번역해줘”, “계획을 세워줘” 같은 요청에 어떻게 답하는지도 살펴보세요.</p>',
            hint: '<code>print(llm.ask(\'...\'))</code> 를 두 번 더 쓰고 <code>print(llm.calls, llm.total_usage)</code>',
            starter: `import agentlab as al

llm = al.LLM()
print(llm.ask('안녕하세요'))
# TODO: 질문 두 개를 더 던져 보기

# TODO: 호출 횟수(llm.calls)와 누적 토큰(llm.total_usage) 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
print(llm.ask('안녕하세요'))
print(llm.ask('다음 글을 한 줄로 요약해줘.\\n에이전트는 목표를 받아 스스로 행동한다. 도구를 호출해 정보를 얻는다. 결과를 관찰하고 다음 행동을 정한다.'))
print(llm.ask('주말 나들이 계획을 세워줘'))
print(llm.calls, llm.total_usage)
`,
            expect: '안녕하세요! 무엇을 도와드릴까요?\n요약: 에이전트는 목표를 받아 스스로 행동한다 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.\n계획: 1) 목표를 작은 작업으로 나눈다 2) 필요한 도구를 고른다 3) 순서대로 실행한다 4) 결과를 검토하고 보완한다\n3 Usage(prompt=30, completion=45)' },
          { title: '실습 0-2. 역할 세 가지로 자기소개 시키기', level: 2,
            desc: '<p><code>system_prompt</code> 를 바꿔 가며 같은 질문 “자기소개 해 주세요” 를 세 가지 역할(예: 여행 가이드, 요리사, 로봇)로 물어보고 답을 비교하세요. 역할 목록을 리스트에 넣고 <code>for</code> 문으로 돌리면 간단합니다.</p>',
            hint: '<code>for role in [...]: print(llm.ask(q, system_prompt=f\'당신은 {role}입니다.\'))</code>',
            starter: `import agentlab as al

llm = al.LLM()
q = '자기소개 해 주세요'
roles = ['여행 가이드', '요리사', '로봇']
# TODO: 역할마다 system_prompt 를 바꿔 가며 q 를 묻고 출력하기
`,
            solution: `import agentlab as al

llm = al.LLM()
q = '자기소개 해 주세요'
roles = ['여행 가이드', '요리사', '로봇']
for role in roles:
    print(llm.ask(q, system_prompt=f'당신은 {role}입니다.'))
`,
            expect: '[여행 가이드] 저는 여행 가이드 입니다. 무엇이든 물어보세요.\n[요리사] 저는 요리사 입니다. 무엇이든 물어보세요.\n[로봇] 저는 로봇 입니다. 무엇이든 물어보세요.' }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'AI 에이전트 구축', subtitle: '강좌 안내 · 실습 환경 · 첫 코드 실행', notes: '<p>첫 시간입니다. “챗봇과 에이전트가 무엇이 다른가?”로 시작해 강좌 전체 로드맵을 보여 주고, 오늘 목표는 “실습 환경에 익숙해지고 첫 LLM 호출을 해 보기”라고 안내합니다.</p><p>⏱ 도입 · 로드맵 10분</p>' },
          { layout: 'bullets', title: '챗봇과 에이전트는 무엇이 다를까?', lead: '“다음 주 부산 출장 일정 짜고, 날씨 확인하고, 숙소 찾아서 메모해 줘”', bullets: ['💬 챗봇: 질문 한 번 → 답 한 번', '🤖 에이전트: 목표를 받아 <b>스스로 계획</b>하고', '🔧 <b>도구</b>(날씨 API · 검색 · 메모)를 호출하고', '👁 결과를 <b>관찰</b>해 다음 행동을 정한다', '이 강좌: 그런 프로그램을 파이썬으로 직접 만든다'],
            notes: '<p><b>발문:</b> “챗GPT 에게 ‘내일 서울 날씨 알려줘’ 라고 하면 뭐라고 답할까요?” → 실시간 정보를 모른다고 답하거나 지어낸다. “그럼 날씨 사이트를 대신 봐 주려면 무엇이 필요할까?” → 도구. 이 질문이 1차시로 이어집니다.</p>' },
          { layout: 'diagram', title: '시리즈 학습 경로', html: FIG_SERIES, caption: '이 과정은 ⑤ — LLM 을 “행동하는 프로그램”으로',
            notes: '<p>앞 과정(③ LLM, ④ RAG)을 안 들은 학생도 괜찮다고 안심시킵니다. 필요한 선수 지식: 파이썬 기초(함수 · 딕셔너리 · 반복문), LLM API 를 한 번쯤 호출해 본 경험.</p>' },
          { layout: 'table', title: '강좌 로드맵', head: ['Part', '차시', '내용'], rows: [
            ['1', '00~02', '실습 환경 · 에이전트 개념 · LLM API'], ['2', '03~06', '역할 · 도구 · 기억 · 계획/반성'], ['3', '07~10', 'LangChain · LangGraph · CrewAI · AutoGen'], ['4', '11~13', '프로젝트 2개 · 평가 · 안전 · 배포']
          ], notes: '<p>Part 2 가 핵심 원리, Part 3 이 실제 도구, Part 4 가 프로젝트. 중간에 형성평가 2회와 마지막 팀 프로젝트 발표가 있다고 예고합니다.</p>' },
          { layout: 'diagram', title: '화면 사용법', html: FIG_SCREEN, caption: '왼쪽 목차 · 🔑 / 가운데 문서 + 편집기 / 오른쪽 실행 결과',
            notes: '<p>프로젝터로 실제 화면을 띄워 세 영역을 짚습니다. 예제의 ▶ 실행을 눌러 코드가 편집기로 들어가고 결과 창에 출력이 찍히는 것을 보여 줍니다.</p><p>⏱ 8분</p>' },
          { layout: 'code', title: '첫 코드: 지금 연결된 LLM', code: `import agentlab as al

al.status()
al.providers()`, points: ['<code>agentlab</code> = 강좌 모듈', '키 없음 → 모의 LLM(mock)', '2교시에 무료 키를 넣어 봅니다'],
            notes: '<p>학생들도 각자 실행하게 합니다. 처음 실행은 환경 준비로 몇 초 걸린다고 미리 말해 주세요. “키 열이 전부 없음인 이유?” → 아직 아무 키도 넣지 않았기 때문.</p>' },
          { layout: 'code', title: '첫 LLM 호출', code: `import agentlab as al

llm = al.LLM()
print(llm)
print(llm.ask('간단히 자기소개 해 주세요.'))
print(llm.ask('AI 에이전트가 무엇인지 한 문장으로 설명해줘'))
print(llm.ask('에이전트가 뭐야?', system_prompt='당신은 친절한 조교입니다.'))`, points: ['<code>al.LLM()</code> → LLM 객체', '<code>ask()</code> → 문자열 답', '<code>system_prompt</code> = 역할 → 모의 LLM 은 <code>[역할]</code> 표시'],
            notes: '<p>▶ 실행 후 “저는 수업용 모의 LLM 입니다” 를 가리키며 모의 LLM 의 역할을 설명합니다. 교사 PC 에 키를 미리 넣어 두었다면 같은 코드를 실제 모델로 다시 실행해 답이 달라지는 것을 보여 주면 효과적입니다.</p>' },
          { layout: 'code', title: '호출 횟수와 토큰', code: `import agentlab as al

llm = al.LLM()
for q in ['안녕하세요', '에이전트가 뭐야?']:
    print(llm.ask(q))
print('호출 횟수:', llm.calls)
print('누적 토큰:', llm.total_usage)`, points: ['LLM 은 호출마다 <b>토큰</b>을 소모', '유료 공급자는 토큰 수로 과금', '<code>llm.total_usage</code> 로 누적 확인'],
            notes: '<p>토큰 = 단어 조각(한글은 대략 1~2글자, 영어는 단어의 3/4 정도)이라고만 소개하고 02차시에서 자세히 다룬다고 예고합니다.</p>' },
          { layout: 'diagram', title: '두 가지 실습 환경', html: FIG_ENV, caption: '브라우저에서 원리를 구현 → Colab 에서 실제 프레임워크로 다시',
            notes: '<p><b>발문:</b> “왜 브라우저에서 LangChain 을 바로 쓰지 않을까요?” → 브라우저 파이썬(Pyodide)에는 pip 패키지를 설치할 수 없다. 대신 agentlab 이 이름을 맞춰 두어 Colab 코드가 거의 같다는 점을 강조.</p>' },
          { layout: 'table', title: 'agentlab ↔ 실제 프레임워크', head: ['개념', 'agentlab', '실제'], rows: [
            ['도구', '<code>@al.tool</code>', 'LangChain <code>@tool</code>'], ['에이전트', '<code>al.Agent</code>', 'LangChain · LangGraph'], ['체인', '<code>prompt | llm | parser</code>', 'LCEL (같은 문법)'], ['팀', '<code>al.Crew</code> · <code>al.GroupChat</code>', 'CrewAI · AutoGen']
          ], notes: '<p>표를 외울 필요는 없습니다. “이름이 같다”는 것만 기억하게 합니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[0].q, options: QUIZ1[0].options, answer: QUIZ1[0].answer, explain: QUIZ1[0].explain, notes: '<p>손을 들게 해 확인. 모의 LLM 의 존재를 확실히 각인시킵니다.</p>' },
          { layout: 'practice', title: '실습 0-2. 역할 바꿔 자기소개', desc: '<p>세 가지 역할로 “자기소개 해 주세요” 를 물어보세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
q = '자기소개 해 주세요'
roles = ['여행 가이드', '요리사', '로봇']
# TODO: 역할마다 system_prompt 를 바꿔 묻기`, solution: `import agentlab as al

llm = al.LLM()
q = '자기소개 해 주세요'
for role in ['여행 가이드', '요리사', '로봇']:
    print(llm.ask(q, system_prompt=f'당신은 {role}입니다.'))`, notes: '<p>f-string 으로 역할을 끼워 넣는 것이 포인트. 빨리 끝낸 학생은 역할을 더 추가하거나 질문을 바꿔 보게 합니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['에이전트 = 스스로 계획 · 도구 호출 · 관찰하는 LLM 프로그램', '화면: 목차 · 🔑 / 문서 + 편집기 / 실행 결과', '<code>al.LLM().ask()</code> — 키 없으면 모의 LLM, 있으면 실제 모델', '브라우저(agentlab) 로 원리 → Colab 으로 실제 프레임워크', '다음 교시: 무료 API 키 발급과 설정'], notes: '<p>⏱ 정리 5분. 쉬는 시간 뒤 2교시에서 키를 발급받으니 Google 계정 로그인을 미리 해 두라고 안내합니다.</p>' }
        ]
      },
      {
        id: 'ag00-2',
        title: '무료 API 키 발급과 설정',
        minutes: 50,
        goals: ['무료 LLM 공급자(Gemini · Groq · OpenRouter · Ollama)의 특징을 비교한다', '키를 발급받아 🔑 버튼으로 세션에만 저장하고 연결 테스트를 한다', '키를 코드에 쓰면 안 되는 이유와 유출 사고를 설명한다', '요청 한도(RPM)와 토큰 사용량을 확인한다'],
        flow: [['API 키란?', 7], ['무료 공급자 비교 · 발급', 15], ['키 설정 · 연결 테스트', 13], ['보안 · 사용량', 10], ['퀴즈 · 정리', 5]],
        content: [
          { type: 'p', html: 'LLM 은 내 컴퓨터가 아니라 공급자의 서버에서 돌아갑니다(Ollama 는 예외). 그 서버에 요청을 보내려면 “누가 보냈는지”를 증명하는 <b>API 키</b>가 필요합니다. 키는 건물 출입증과 같아서, 남에게 넘어가면 <b>그 사람이 내 이름으로 요금을 쓰게</b> 됩니다. 이번 교시의 목표는 두 가지입니다. 무료 키를 발급받아 실제 모델을 써 보는 것, 그리고 키를 <b>안전하게</b> 다루는 습관을 들이는 것입니다.' },
          { type: 'figure', html: FIG_KEYFLOW, caption: '그림 0-4. 키의 흐름. 이 사이트는 서버가 없는 정적 페이지이므로 키는 브라우저 탭 안에만 머물고, 브라우저가 공급자 API 를 직접 호출합니다.' },
          { type: 'h', text: '무료로 쓸 수 있는 공급자' },
          { type: 'table', head: ['공급자', '무료?', '발급 위치', '기본 모델', '특징'], rows: [
            ['<b>Google Gemini</b>', '✅ 무료 등급', 'Google AI Studio → Get API key', '<code>gemini-2.5-flash</code>', '가장 쉬움 · 함수 호출 · JSON 모드 지원 · 분당 요청 제한'],
            ['<b>Groq</b>', '✅ 무료 등급', 'console.groq.com → API Keys', '<code>llama-3.3-70b-versatile</code>', '오픈소스 모델을 매우 빠르게 · OpenAI 호환 API'],
            ['<b>OpenRouter</b>', '✅ <code>:free</code> 모델', 'openrouter.ai → Keys', '<code>…llama-3.3-70b-instruct:free</code>', '여러 회사 모델을 한 키로 · 이름 끝 <code>:free</code> 만 무료'],
            ['<b>Ollama</b>', '✅ 완전 무료', '내 PC 에 설치 (키 없음)', '<code>llama3.2</code>', '오프라인 · 개인정보 안전 · PC 성능 필요 · <code>OLLAMA_ORIGINS=*</code>'],
            ['OpenAI', '💳 유료', 'platform.openai.com', '<code>gpt-4o-mini</code>', '선불 충전 필요 · 가장 널리 쓰이는 API 형식'],
            ['Anthropic', '💳 유료', 'console.anthropic.com', '<code>claude-haiku-4-5</code>', '선불 충전 필요 · 긴 문맥 · 도구 사용에 강함']
          ], caption: '공급자 비교. 무료 등급의 한도와 모델 이름은 자주 바뀌므로 발급 페이지의 최신 안내를 확인하세요.' },
          { type: 'list', ordered: true, items: [
            '<b>Gemini</b>: Google 계정으로 <b>AI Studio</b>(aistudio.google.com) 접속 → <b>Get API key</b> → <b>Create API key</b> → 키 복사. 결제 수단 없이 무료 등급으로 시작됩니다.',
            '<b>Groq</b>: console.groq.com 가입 → 왼쪽 <b>API Keys</b> → <b>Create API Key</b> → 이름 입력 → 키 복사(한 번만 보여 줍니다).',
            '<b>OpenRouter</b>: openrouter.ai 가입 → <b>Keys</b> → <b>Create Key</b>. 모델은 이름 끝에 <code>:free</code> 가 붙은 것만 고릅니다.',
            '<b>Ollama</b>: ollama.com 에서 설치 → 터미널에서 <code>ollama pull llama3.2</code> → 브라우저에서 접근하려면 <code>OLLAMA_ORIGINS=* ollama serve</code> 로 실행. 키는 필요 없고 주소(<code>http://localhost:11434/v1</code>)만 적습니다.'
          ] },
          { type: 'callout', kind: 'warn', title: '키는 한 번만 보여 줍니다', html: '대부분의 공급자는 발급 직후 <b>한 번만</b> 키 전체를 보여 줍니다. 복사하기 전에 창을 닫았다면 그 키는 <b>삭제</b>하고 새로 만드세요. 어디에 적어 둘지 고민된다면 <b>암호 관리자</b>(브라우저 내장 또는 전용 앱)에 넣는 것이 정답입니다. 메모장 · 채팅 · 이메일은 안 됩니다.' },
          { type: 'h', text: '키 넣기와 연결 테스트' },
          { type: 'p', html: '왼쪽 아래 <b>🔑 API 키</b> 버튼을 누르면 설정 창이 열립니다. ① 공급자를 고르고 ② 키를 붙여 넣은 뒤 ③ <b>저장</b> 또는 <b>연결 테스트</b>를 누릅니다. 연결 테스트는 아래 예제와 같은 코드를 실행해 결과 창에 답을 보여 줍니다. 키는 <b>이 탭의 세션</b>에만 저장되고, 탭을 닫으면 사라지므로 다음 시간에는 다시 넣어야 합니다.' },
          { type: 'code', title: '예제 0-6. 연결 테스트 (🔑 의 “연결 테스트” 버튼과 같은 코드)', code: `import agentlab as al

al.status()
llm = al.LLM()
print('응답:', llm.ask('안녕하세요, 한 문장으로 인사해줘'))
print('토큰:', llm.total_usage)`,
            expect: '🤖 LLM: 모의 LLM (API 키 없음) — 왼쪽 아래 🔑 API 키 에서 무료 키를 넣으면 실제 모델이 답합니다.\n응답: 안녕하세요! 무엇을 도와드릴까요?\n토큰: Usage(prompt=5, completion=6)',
            nondeterministic: true,
            desc: '키를 넣기 전과 후에 각각 실행해 보세요. 예시 출력은 모의 LLM 기준이며, 키를 넣으면 첫 줄에 공급자와 모델 이름이, 둘째 줄에 모델이 쓴 인사가 나옵니다. 토큰 수도 실제 값으로 바뀝니다.' },
          { type: 'figure', html: FIG_MOCKREAL, caption: '그림 0-5. 같은 코드, 다른 답. 모의 LLM 은 규칙으로, 실제 모델은 확률로 답을 만듭니다. 에이전트의 구조는 양쪽이 같습니다.' },
          { type: 'code', title: '예제 0-7. 모의 LLM 을 일부러 고르기', code: `import agentlab as al

auto = al.LLM()              # 자동: 키가 있으면 실제 모델
mock = al.LLM('mock')        # 항상 모의 LLM
print('자동 선택 :', auto)
print('모의 고정 :', mock)
q = '에이전트가 뭐야?'
print('자동 →', auto.ask(q))
print('모의 →', mock.ask(q))`,
            expect: '자동 선택 : LLM(mock, mock-1)\n모의 고정 : LLM(mock, mock-1)\n자동 → AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\n모의 → AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.',
            nondeterministic: true,
            desc: '키가 없으면 두 줄이 같습니다. 키를 넣으면 첫 줄은 실제 모델, 둘째 줄은 모의 LLM 의 답이 나와 바로 비교할 수 있습니다. 수업 시나리오처럼 <b>정해진 대사</b>가 필요할 때는 <code>al.LLM(mock_responses=[\'첫 답\', \'둘째 답\'])</code> 로 모의 답을 직접 정할 수도 있습니다(키가 없을 때만 적용).' },
          { type: 'code', title: '예제 0-8. 키가 없을 때 나는 오류 읽기', code: `import agentlab as al

try:
    llm = al.LLM('gemini')          # 키 없이 특정 공급자를 고르면?
    print(llm.ask('안녕'))
except ValueError as e:
    print('ValueError:', e)`,
            expect: 'ValueError: Google Gemini (무료 등급) 의 API 키가 없습니다. LLM(api_key=\'...\') 또는 🔑 API 키 메뉴에서 설정하세요.',
            nondeterministic: true,
            desc: '<code>al.LLM()</code>(자동)은 키가 없으면 조용히 모의 LLM 으로 넘어가지만, 공급자를 <b>직접 지정</b>하면 키가 없을 때 바로 <code>ValueError</code> 가 납니다. 오류 메시지를 끝까지 읽는 습관을 들이세요. Gemini 키를 넣은 상태라면 이 예제는 오류 없이 실제 답을 출력합니다.' },
          { type: 'h', text: '키 보안: 절대 코드에 쓰지 않기' },
          { type: 'callout', kind: 'warn', title: '유출 사고는 이렇게 일어납니다', html: '<ul><li>과제 코드에 <code>api_key = "AIza..."</code> 를 적은 채 <b>GitHub 공개 저장소</b>에 올립니다.</li><li>공개 저장소를 24시간 훑는 <b>자동 스캔 봇</b>이 몇 분 안에 키를 찾아냅니다. (실제로 연구자들이 일부러 올린 테스트 키가 1분 안에 사용된 사례가 보고되었습니다)</li><li>유료 계정이면 밤사이 수십만 원의 요금이, 무료 계정이면 한도 초과로 내 요청이 모두 거부됩니다.</li><li>저장소에서 지워도 <b>커밋 기록</b>에 남아 있습니다. 유일한 해결은 키를 <b>즉시 폐기(revoke)</b>하고 새로 발급받는 것입니다.</li></ul>' },
          { type: 'code', title: '예제 0-9. 나쁜 예와 좋은 예 (실행하지 않음)', run: false, code: `# ❌ 나쁜 예: 키를 코드에 직접 적음 → 저장소 · 화면 공유 · 캡처로 유출
llm = al.LLM('gemini', api_key='AIzaSyD-이런식으로-적으면-안됩니다')

# ✅ 좋은 예 1: 이 사이트 — 🔑 버튼으로 세션에만 저장, 코드에는 아무것도 없음
llm = al.LLM()

# ✅ 좋은 예 2: 내 PC — 환경 변수에서 읽음 (키는 터미널 · .env 에, 코드에는 이름만)
import os
llm = al.LLM('gemini', api_key=os.environ.get('GEMINI_API_KEY'))

# ✅ 좋은 예 3: Colab — Secrets(🔑) 에서 읽음
from google.colab import userdata
llm = al.LLM('gemini', api_key=userdata.get('GEMINI_API_KEY'))`,
            desc: '세 가지 좋은 예의 공통점은 <b>키 값이 코드 파일 밖</b>에 있다는 것입니다. 코드에는 “어디서 읽을지”만 적습니다.' },
          { type: 'code', title: '예제 0-10. 환경 변수로 키가 설정되었는지 확인하기', code: `import os

names = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
for n in names:
    v = os.environ.get(n)
    # 키 값은 절대 출력하지 않는다! 있는지와 길이만 확인
    print(f'{n:<20}', '설정됨 (길이 %d)' % len(v) if v else '없음')`,
            nondeterministic: true,
            desc: '🔑 버튼으로 넣은 키는 파이썬 쪽에서 이런 <b>환경 변수</b>로 보입니다. 값 자체를 <code>print</code> 하면 결과 창 · 화면 공유로 새어 나가므로, 확인할 때도 <b>있는지와 길이만</b> 출력하는 습관을 들이세요.' },
          { type: 'list', items: [
            '키는 <b>세션 · Secrets · 환경 변수</b>에만. 코드 · 노트북 출력 · 채팅 · 캡처에는 절대 넣지 않습니다.',
            '공급자 콘솔에서 <b>사용량 알림 · 지출 한도</b>를 설정해 둡니다(유료 계정이라면 필수).',
            '키를 잃어버리거나 노출이 의심되면 <b>폐기(revoke) → 재발급</b>. 고민할 시간에 폐기하는 것이 빠릅니다.',
            '프로젝트마다 <b>키를 따로</b> 만들고 이름을 붙여 두면 문제가 생겼을 때 하나만 폐기하면 됩니다.',
            '팀 과제라도 키를 <b>공유하지 않습니다</b>. 각자 발급받습니다.'
          ] },
          { type: 'h', text: '사용량과 한도' },
          { type: 'p', html: '무료 등급은 “공짜지만 무제한은 아닙니다”. 공급자는 <b>분당 요청 수(RPM)</b>, <b>분당 토큰 수(TPM)</b>, <b>하루 요청 수(RPD)</b> 를 제한하고, 넘기면 <code>HTTP 429</code>(Too Many Requests) 로 거절합니다. 에이전트는 작업 하나에 LLM 을 여러 번 호출하므로, 한도는 생각보다 빨리 닿습니다.' },
          { type: 'figure', html: FIG_RATE, caption: '그림 0-6. 분당 요청 한도. 창(window) 안에서 허용 횟수를 넘긴 요청은 429 를 받고, 잠시 뒤에는 다시 성공합니다.' },
          { type: 'table', head: ['등급 (예시)', 'RPM', 'RPD', '비용', '수업에서의 의미'], rows: [
            ['Gemini Flash 무료 등급', '약 10~15', '약 250~1,500', '0원', '한 학생이 쓰기엔 충분, 30명이 한 키는 불가'],
            ['Groq 무료 등급', '약 30', '약 1,000~14,000', '0원', '빠르고 넉넉한 편'],
            ['OpenRouter <code>:free</code>', '약 20', '약 50~1,000', '0원', '모델마다 다름, 가끔 느림'],
            ['Ollama (로컬)', '제한 없음', '제한 없음', '전기세', 'PC 성능에 따라 답이 느릴 수 있음'],
            ['유료 등급', '수백~수천', '사실상 없음', '토큰당 과금', '프로젝트 · 배포 단계']
          ], caption: '한도 예시 (대략값 — 공급자가 수시로 바꾸므로 실제 수치는 각 콘솔의 Limits 페이지에서 확인)' },
          { type: 'code', title: '예제 0-11. 에이전트 한 번에 LLM 을 몇 번 호출할까?', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator])
print(agent.run('1500 * 0.15 는 얼마야?'))
print('LLM 호출 횟수:', llm.calls)          # 도구 호출 1번 + 최종 답 1번
print('누적 토큰    :', llm.total_usage)
print('분당 15회 한도라면 이런 작업을 1분에 약', 15 // llm.calls, '번')`,
            expect: '계산 결과는 225 입니다.\nLLM 호출 횟수: 2\n누적 토큰    : Usage(prompt=27, completion=15)\n분당 15회 한도라면 이런 작업을 1분에 약 7 번',
            desc: '질문 하나에 LLM 이 두 번 불렸습니다(도구를 고르는 호출 + 결과로 답을 쓰는 호출). 도구를 여러 번 쓰는 작업이면 호출이 더 늘어납니다. 01차시에서 이 루프를 직접 짜 보며 호출 횟수를 세어 봅니다.' },
          { type: 'callout', kind: 'tip', title: '429 가 나면', html: '① 잠시(수십 초) 기다렸다 다시 실행 ② 예제의 호출 횟수를 줄이기 ③ 다른 무료 공급자로 바꾸기(🔑 에서 공급자만 바꾸면 코드는 그대로) ④ 모의 LLM 으로 구조만 먼저 확인하고 나중에 실제 모델로. <code>agentlab</code> 은 429 를 받으면 “요청 한도 초과” 라는 힌트를 오류 메시지에 붙여 줍니다.' },
          { type: 'h', text: 'Colab 에서 키 다루기: Secrets' },
          { type: 'p', html: 'Colab 노트북에서는 왼쪽 세로 메뉴의 <b>🔑 보안 비밀(Secrets)</b> 에 키를 넣습니다. 이름(예: <code>GEMINI_API_KEY</code>)과 값을 적고 <b>노트북 액세스</b>를 켠 뒤, 코드에서는 <code>userdata.get()</code> 으로 읽습니다. 노트북을 공유해도 Secrets 는 따라가지 않으므로 안전합니다.' },
          { type: 'code', title: '예제 0-12. Colab 에서 실행 — Secrets 에서 키 읽어 첫 호출', run: false, code: `!pip -q install google-genai

from google.colab import userdata
from google import genai

client = genai.Client(api_key=userdata.get('GEMINI_API_KEY'))   # 키 값은 코드에 없다
resp = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='AI 에이전트가 무엇인지 한 문장으로 설명해줘')
print(resp.text)
print(resp.usage_metadata)        # 토큰 사용량`,
            desc: 'Colab 노트북 00 에서 이 코드를 실행합니다. <code>google-genai</code> 는 Gemini 공식 SDK 입니다. 02차시에서 OpenAI · Anthropic SDK 와 비교합니다.' },
          { type: 'colab', title: 'Colab 실습 00 — API 키 설정과 첫 SDK 호출', html: '<p>노트북을 열어 <b>Secrets 에 키 등록 → SDK 설치 → 첫 호출 → 토큰 확인</b> 순서로 진행합니다. 키가 아직 없다면 모의 호출 셀로 흐름만 확인해도 됩니다. ✏️ 문제: 같은 질문을 두 공급자에게 보내 답과 토큰 수를 비교하기.</p>' },
          { type: 'callout', kind: 'info', teacher: true, title: '수업 전 체크리스트 · 오개념', html: '<ul><li>수업 전 공지: Google 개인 계정 준비, 가능하면 AI Studio 키 발급을 숙제로. 수업 중 발급은 10분 이상 걸리고 가입 인증(휴대폰)이 막히는 학생이 꼭 나옵니다.</li><li>교사 PC 에는 키를 넣어 두고 시작 → 학생 화면(모의 LLM)과 교사 화면(실제 모델)의 답을 나란히 비교하면 모의 LLM 의 역할이 바로 이해됩니다.</li><li>오개념 1: “키를 넣으면 요금이 나간다” → 무료 등급은 결제 수단 없이 시작하며 한도를 넘기면 거절될 뿐 과금되지 않습니다(유료 등급으로 올리지 않는 한).</li><li>오개념 2: “키를 코드에서 지우면 안전하다” → git 기록에 남습니다. 폐기 · 재발급만이 해결책.</li><li>오개념 3: “429 = 키가 틀렸다” → 401/403 이 키 오류, 429 는 한도. 상태 코드 표를 칠판에 적어 둡니다.</li><li>실습 0-4(키 검사기)는 정규식을 처음 보는 학생이 있으므로 패턴 뜻을 먼저 설명합니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 0-3. 사용량 계산기', level: 1,
            desc: '<p>질문 세 개를 차례로 물어본 뒤, 누적 토큰 수와 “예시 단가(100만 토큰당 입력 $0.30 · 출력 $2.50)” 로 추정 비용을 계산해 출력하세요. (단가는 설명용 예시값입니다)</p>',
            hint: '<code>u = llm.total_usage</code> → <code>u.prompt_tokens / 1_000_000 * 0.30 + u.completion_tokens / 1_000_000 * 2.50</code>',
            starter: `import agentlab as al

llm = al.LLM()
for q in ['안녕하세요', '에이전트가 뭐야?', '주말 계획을 세워줘']:
    llm.ask(q)
u = llm.total_usage
print('호출:', llm.calls, '| 입력 토큰:', u.prompt_tokens, '| 출력 토큰:', u.completion_tokens)
# TODO: 추정 비용(달러) 계산해서 소수점 6자리로 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
for q in ['안녕하세요', '에이전트가 뭐야?', '주말 계획을 세워줘']:
    llm.ask(q)
u = llm.total_usage
print('호출:', llm.calls, '| 입력 토큰:', u.prompt_tokens, '| 출력 토큰:', u.completion_tokens)
cost = u.prompt_tokens / 1_000_000 * 0.30 + u.completion_tokens / 1_000_000 * 2.50
print('추정 비용: %.6f 달러' % cost)
`,
            expect: '호출: 3 | 입력 토큰: 7 | 출력 토큰: 50\n추정 비용: 0.000127 달러' },
          { title: '실습 0-4. 키 유출 검사기 만들기', level: 2,
            desc: '<p>코드 문자열에 API 키처럼 보이는 패턴이 있는지 검사하는 함수 <code>has_secret(code)</code> 를 만드세요. Gemini 키는 <code>AIza</code> 로 시작하고, OpenAI · Groq · Anthropic 키는 <code>sk-</code> 또는 <code>gsk_</code> 로 시작합니다. 정규식 <code>re.search</code> 를 쓰면 한 줄입니다.</p>',
            hint: '<code>re.search(r\'(AIza[0-9A-Za-z_\\-]{20,}|sk-[0-9A-Za-z_\\-]{20,}|gsk_[0-9A-Za-z]{20,})\', code)</code>',
            starter: `import re

def has_secret(code):
    # TODO: AIza… / sk-… / gsk_… 패턴이 있으면 True
    return False

samples = [
    "llm = al.LLM()",
    "llm = al.LLM('gemini', api_key='AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')",
    "client = OpenAI(api_key='sk-proj-abcdefghijklmnopqrstuvwxyz0123456789')",
    "key = os.environ.get('GROQ_API_KEY')",
]
for s in samples:
    print('🚨 유출 의심' if has_secret(s) else '✅ 안전     ', '|', s[:60])
`,
            solution: `import re

def has_secret(code):
    pattern = r'(AIza[0-9A-Za-z_\\-]{20,}|sk-[0-9A-Za-z_\\-]{20,}|gsk_[0-9A-Za-z]{20,})'
    return re.search(pattern, code) is not None

samples = [
    "llm = al.LLM()",
    "llm = al.LLM('gemini', api_key='AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')",
    "client = OpenAI(api_key='sk-proj-abcdefghijklmnopqrstuvwxyz0123456789')",
    "key = os.environ.get('GROQ_API_KEY')",
]
for s in samples:
    print('🚨 유출 의심' if has_secret(s) else '✅ 안전     ', '|', s[:60])
`,
            expect: "✅ 안전      | llm = al.LLM()\n🚨 유출 의심 | llm = al.LLM('gemini', api_key='AIzaSyDxxxxxxxxxxxxxxxxxxxxx\n🚨 유출 의심 | client = OpenAI(api_key='sk-proj-abcdefghijklmnopqrstuvwxyz0\n✅ 안전      | key = os.environ.get('GROQ_API_KEY')" }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '무료 API 키 발급과 설정', subtitle: 'Gemini · Groq · OpenRouter · Ollama — 그리고 키를 지키는 법', notes: '<p>2교시. 목표는 “실제 모델로 첫 답을 받아 보기”와 “키를 안전하게 다루는 습관”. 학생들은 Google 계정에 로그인해 둔 상태로 시작합니다.</p><p>⏱ 도입 7분</p>' },
          { layout: 'bullets', title: 'API 키란?', lead: 'LLM 은 공급자의 서버에서 돌아갑니다 — 요청에는 출입증이 필요합니다', bullets: ['🔑 API 키 = “누가 보냈는지” 증명하는 긴 문자열', '요청마다 헤더에 실려 서버로 감', '남에게 넘어가면 <b>내 이름으로 요금 · 한도</b>를 씀', '무료 등급도 한도가 있으므로 키는 소중함', 'Ollama 는 내 PC 에서 돌아가므로 키가 없음'],
            notes: '<p>비유: 학교 출입증. 잃어버리면 바로 재발급하듯 키도 폐기 → 재발급. <b>발문:</b> “키를 친구에게 빌려주면 무슨 일이?” → 친구의 요청이 내 한도를 쓰고, 유료면 내 돈이 나간다.</p>' },
          { layout: 'diagram', title: '키는 어디로 가고, 어디로 가면 안 되나', html: FIG_KEYFLOW, caption: '탭 세션 → 브라우저가 공급자 API 직접 호출. 코드 · GitHub · 채팅 ❌',
            notes: '<p>이 사이트는 서버가 없는 정적 페이지라 키를 받을 곳 자체가 없다는 점을 강조해 신뢰를 줍니다. 탭을 닫으면 키가 사라지므로 매 시간 다시 넣어야 한다는 점도 미리 알립니다.</p>' },
          { layout: 'table', title: '무료 공급자 비교', head: ['공급자', '무료', '발급', '특징'], rows: [
            ['Gemini', '무료 등급', 'AI Studio → Get API key', '가장 쉬움 · 함수 호출 · JSON'], ['Groq', '무료 등급', 'console.groq.com', '오픈소스 모델 · 매우 빠름'], ['OpenRouter', ':free 모델', 'openrouter.ai → Keys', '여러 모델 한 키'], ['Ollama', '완전 무료', '내 PC 설치', '오프라인 · OLLAMA_ORIGINS=*'], ['OpenAI · Anthropic', '유료', '선불 충전', '배포 단계에서']
          ], notes: '<p>수업 기본은 Gemini(가장 쉬움). 가입이 막힌 학생은 Groq 로. PC 성능이 좋은 학생은 Ollama 도전. ⏱ 발급 15분 — 프로젝터로 AI Studio 화면을 띄워 함께 진행합니다.</p>' },
          { layout: 'bullets', title: '키 넣기 · 연결 테스트', bullets: ['왼쪽 아래 <b>🔑 API 키</b> 버튼', '① 공급자 선택 → ② 키 붙여넣기', '③ <b>저장</b> 또는 <b>연결 테스트</b>', '결과 창에 공급자 · 모델 · 모델의 인사가 나오면 성공', '키는 <b>이 탭의 세션</b>에만 — 탭을 닫으면 사라짐'],
            notes: '<p>연결 테스트가 실패하면 결과 창의 오류 메시지 마지막 줄을 읽게 합니다: 401/403 키 오류, 404 모델 이름, 429 한도, “연결하지 못했습니다” 는 인터넷 · Ollama 설정.</p>' },
          { layout: 'code', title: '연결 테스트 코드', code: `import agentlab as al

al.status()
llm = al.LLM()
print('응답:', llm.ask('안녕하세요, 한 문장으로 인사해줘'))
print('토큰:', llm.total_usage)`, points: ['🔑 의 “연결 테스트” 와 같은 코드', '키 전 · 후를 비교해 보기', '토큰 수가 실제 값으로 바뀜'],
            notes: '<p>교사 화면(키 있음)과 학생 화면(키 없음)을 나란히 보여 주면 모의 LLM 과 실제 모델의 차이가 한눈에 들어옵니다.</p>' },
          { layout: 'diagram', title: '같은 코드, 다른 답', html: FIG_MOCKREAL, caption: '모의 LLM 은 규칙으로, 실제 모델은 확률로 — 에이전트의 구조는 같다',
            notes: '<p><b>발문:</b> “실제 모델은 왜 매번 답이 조금씩 다를까요?” → 다음 단어를 확률로 고르기 때문. 02차시 temperature 와 연결됩니다.</p>' },
          { layout: 'code', title: '키가 없을 때 나는 오류', code: `import agentlab as al

try:
    llm = al.LLM('gemini')     # 공급자를 직접 지정
    print(llm.ask('안녕'))
except ValueError as e:
    print('ValueError:', e)`, points: ['<code>al.LLM()</code> 자동 = 조용히 모의로', '공급자 지정 = 키 없으면 ValueError', '오류 메시지를 끝까지 읽기'],
            notes: '<p>키를 넣은 학생은 오류 대신 실제 답이 나옵니다. 둘 다 정상이라고 알려 주세요.</p>' },
          { layout: 'bullets', title: '유출 사고는 이렇게 일어난다', bullets: ['과제 코드에 <code>api_key="AIza…"</code> → GitHub 에 push', '스캔 봇이 <b>몇 분 안에</b> 키를 찾아 사용', '유료면 밤사이 요금 폭탄, 무료면 한도 소진', '지워도 <b>커밋 기록</b>에 남음 → 폐기 · 재발급만이 해결', '규칙: 키는 세션 · Secrets · 환경 변수에만'],
            notes: '<p>실제 뉴스 사례(클라우드 키 유출로 수천만 원 청구)를 하나 검색해 보여 주면 효과적입니다. “지우면 되지 않나요?” 에 git 기록 이야기를 꼭 합니다.</p><p>⏱ 보안 · 사용량 10분</p>' },
          { layout: 'two', title: '나쁜 예 vs 좋은 예', left: { title: '❌ 코드에 직접', code: `llm = al.LLM('gemini',
    api_key='AIzaSyD-절대-안됨')`, run: false }, right: { title: '✅ 코드 밖에서 읽기', code: `# 이 사이트: 🔑 버튼 → 세션
llm = al.LLM()

# 내 PC: 환경 변수
import os
k = os.environ.get('GEMINI_API_KEY')

# Colab: Secrets
from google.colab import userdata
k = userdata.get('GEMINI_API_KEY')`, run: false },
            notes: '<p>공통점: 코드에는 “어디서 읽을지”만 있고 값은 없다. 환경 변수 값을 print 하는 것도 금지라고 덧붙입니다.</p>' },
          { layout: 'diagram', title: '사용량과 한도 (RPM · TPM · RPD)', html: FIG_RATE, caption: '한도를 넘기면 429 — 잠시 뒤 다시 OK',
            notes: '<p>에이전트는 작업 하나에 LLM 을 여러 번 부르므로 한도에 빨리 닿는다는 점을 다음 코드로 보여 줍니다.</p>' },
          { layout: 'code', title: '에이전트 한 번 = LLM 호출 몇 번?', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator])
print(agent.run('1500 * 0.15 는 얼마야?'))
print('LLM 호출 횟수:', llm.calls)
print('누적 토큰    :', llm.total_usage)`, points: ['도구 고르기 1번 + 답 쓰기 1번 = 2회', '도구를 여러 번 쓰면 더 늘어남', '분당 15회 한도면 1분에 7작업'],
            notes: '<p>“질문 하나가 왜 2회인가?” 를 학생이 설명하게 합니다. 01차시에서 이 루프를 직접 짭니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>전원이 맞혀야 하는 문제. 틀린 학생이 있으면 유출 사례를 다시 짚습니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['무료 공급자: Gemini · Groq · OpenRouter · Ollama / 유료: OpenAI · Anthropic', '🔑 버튼 → 세션에만 저장 · 탭 닫으면 사라짐', '키는 코드 · GitHub · 채팅에 절대 ❌ → 유출 시 폐기 · 재발급', '한도(RPM · TPM · RPD) → 429 는 기다렸다 재시도', 'Colab 은 Secrets + <code>userdata.get()</code>', '다음 차시: AI 에이전트란 무엇인가?'], notes: '<p>과제: Colab 노트북 00 의 ✏️ 문제(두 공급자 비교) 또는 키 발급이 안 된 학생은 모의 LLM 셀 실행 → 공유 링크 제출.</p><p>⏱ 정리 5분</p>' }
        ]
      }
    ]
  });
})();
