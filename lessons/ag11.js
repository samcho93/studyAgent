/* 11차시 프로젝트 ①: 날씨 · 검색 비서 에이전트 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 11-1. 요구사항: 질문 → 최신 정보 → 요약 답변 */
  const FIG_REQ = `<svg viewBox="0 0 700 250" role="img" aria-label="사용자 질문이 최신 정보 검색을 거쳐 요약 답변으로 이어지는 세 단계와 각 단계의 요구사항">
  ${ARROW('m11a1')}
  <rect x="15" y="40" width="200" height="120" rx="14" class="p1s"/>
  <text x="115" y="70" text-anchor="middle" class="tx-b">① 사용자 질문</text>
  <text x="115" y="95" text-anchor="middle" class="tx-m">“내일 부산 날씨 어때?</text>
  <text x="115" y="113" text-anchor="middle" class="tx-m">우산 챙겨야 해?”</text>
  <text x="115" y="140" text-anchor="middle" class="tx-m">자연어 · 여러 요구가 섞임</text>
  <rect x="250" y="40" width="200" height="120" rx="14" class="p2s"/>
  <text x="350" y="70" text-anchor="middle" class="tx-b">② 최신 정보 검색</text>
  <text x="350" y="95" text-anchor="middle" class="tx-m">날씨 API · 위키백과</text>
  <text x="350" y="113" text-anchor="middle" class="tx-m">현재 시각 · 계산</text>
  <text x="350" y="140" text-anchor="middle" class="tx-m">LLM 이 모르는 “지금” 정보</text>
  <rect x="485" y="40" width="200" height="120" rx="14" class="p3s"/>
  <text x="585" y="70" text-anchor="middle" class="tx-b">③ 요약 답변</text>
  <text x="585" y="95" text-anchor="middle" class="tx-m">“구름 조금, 21°C.</text>
  <text x="585" y="113" text-anchor="middle" class="tx-m">우산은 필요 없어요”</text>
  <text x="585" y="140" text-anchor="middle" class="tx-m">짧고 정확 · 근거 있음</text>
  <line x1="217" y1="100" x2="246" y2="100" class="ln" stroke-width="2" marker-end="url(#m11a1)"/>
  <line x1="452" y1="100" x2="481" y2="100" class="ln" stroke-width="2" marker-end="url(#m11a1)"/>
  <rect x="15" y="185" width="670" height="50" rx="10" class="card-bg"/>
  <text x="30" y="206" class="tx-b" font-size="13">비기능 요구사항</text>
  <text x="30" y="226" class="tx-m">응답 5초 이내 · API 키 없이도 동작(무료 API) · 도구 실패 시 사과하고 안내 · 이전 대화 기억 · 결과 저장</text>
</svg>`;

  /* 그림 11-2. 아키텍처 */
  const FIG_ARCH = `<svg viewBox="0 0 720 320" role="img" aria-label="사용자가 에이전트 루프에 질문하면 에이전트가 네 가지 도구 중 알맞은 것을 호출하고 결과를 관찰해 답을 만드는 아키텍처">
  ${ARROW('m11a2')}
  <rect x="15" y="120" width="110" height="70" rx="12" class="p1s"/>
  <text x="70" y="150" text-anchor="middle" class="tx-b">사용자</text>
  <text x="70" y="172" text-anchor="middle" class="tx-m">질문 · 답</text>
  <rect x="175" y="60" width="230" height="190" rx="16" class="card-bg"/>
  <text x="290" y="88" text-anchor="middle" class="tx-b">에이전트 루프 (al.Agent)</text>
  <rect x="195" y="105" width="190" height="34" rx="8" class="p2"/><text x="290" y="127" text-anchor="middle" class="tx-w">시스템 프롬프트 (비서 페르소나)</text>
  <rect x="195" y="148" width="90" height="34" rx="8" class="p2s"/><text x="240" y="170" text-anchor="middle" class="tx">LLM 판단</text>
  <rect x="295" y="148" width="90" height="34" rx="8" class="p3s"/><text x="340" y="170" text-anchor="middle" class="tx">관찰 · 답</text>
  <rect x="195" y="191" width="190" height="34" rx="8" class="p5s"/><text x="290" y="213" text-anchor="middle" class="tx">대화 메모리 (memory)</text>
  <text x="290" y="242" text-anchor="middle" class="tx-m">max_steps 안에 생각 → 행동 → 관찰 반복</text>
  <rect x="470" y="30" width="235" height="52" rx="10" class="p1s"/>
  <text x="482" y="52" class="tx-b" font-size="13">get_weather(city)</text><text x="482" y="70" class="tx-m">Open-Meteo 무료 API · 키 불필요</text>
  <rect x="470" y="94" width="235" height="52" rx="10" class="p2s"/>
  <text x="482" y="116" class="tx-b" font-size="13">wiki_search(query)</text><text x="482" y="134" class="tx-m">위키백과 요약 · 키 불필요</text>
  <rect x="470" y="158" width="235" height="52" rx="10" class="p3s"/>
  <text x="482" y="180" class="tx-b" font-size="13">now()</text><text x="482" y="198" class="tx-m">현재 날짜 · 시각 · 요일</text>
  <rect x="470" y="222" width="235" height="52" rx="10" class="p5s"/>
  <text x="482" y="244" class="tx-b" font-size="13">calculator(expression)</text><text x="482" y="262" class="tx-m">섭씨→화씨 같은 계산</text>
  <line x1="127" y1="145" x2="171" y2="145" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <line x1="171" y1="170" x2="127" y2="170" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <line x1="407" y1="120" x2="466" y2="60" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <line x1="407" y1="140" x2="466" y2="120" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <line x1="407" y1="165" x2="466" y2="184" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <line x1="407" y1="185" x2="466" y2="248" class="ln" stroke-width="2" marker-end="url(#m11a2)"/>
  <text x="440" y="300" text-anchor="middle" class="tx-m">도구 결과(JSON)는 “관찰”로 LLM 에 돌아간다</text>
</svg>`;

  /* 그림 11-3. 도구 먼저, 에이전트는 나중에 */
  const FIG_TEST = `<svg viewBox="0 0 700 220" role="img" aria-label="도구를 하나씩 단독으로 테스트한 뒤 에이전트에 연결하는 순서">
  ${ARROW('m11a3')}
  <rect x="15" y="30" width="200" height="150" rx="14" class="p1s"/>
  <text x="115" y="58" text-anchor="middle" class="tx-b">1단계 · 도구 단독 테스트</text>
  <text x="115" y="84" text-anchor="middle" class="tx-m">al.get_weather('서울')</text>
  <text x="115" y="104" text-anchor="middle" class="tx-m">al.calculator('(21*9/5)+32')</text>
  <text x="115" y="124" text-anchor="middle" class="tx-m">결과 키 · 오류 형태 확인</text>
  <text x="115" y="158" text-anchor="middle" class="tx-m">LLM 없이, 비용 0</text>
  <rect x="250" y="30" width="200" height="150" rx="14" class="p2s"/>
  <text x="350" y="58" text-anchor="middle" class="tx-b">2단계 · 스키마 확인</text>
  <text x="350" y="84" text-anchor="middle" class="tx-m">tool.schema()</text>
  <text x="350" y="104" text-anchor="middle" class="tx-m">설명 · 매개변수 이름이</text>
  <text x="350" y="124" text-anchor="middle" class="tx-m">LLM 이 고를 만큼 분명한가?</text>
  <text x="350" y="158" text-anchor="middle" class="tx-m">docstring 이 곧 프롬프트</text>
  <rect x="485" y="30" width="200" height="150" rx="14" class="p3s"/>
  <text x="585" y="58" text-anchor="middle" class="tx-b">3단계 · 에이전트 연결</text>
  <text x="585" y="84" text-anchor="middle" class="tx-m">al.Agent(llm, tools=[...])</text>
  <text x="585" y="104" text-anchor="middle" class="tx-m">verbose=True 로 호출 관찰</text>
  <text x="585" y="124" text-anchor="middle" class="tx-m">trace() 로 단계 복기</text>
  <text x="585" y="158" text-anchor="middle" class="tx-m">문제가 나면 1단계로</text>
  <line x1="217" y1="105" x2="246" y2="105" class="ln" stroke-width="2" marker-end="url(#m11a3)"/>
  <line x1="452" y1="105" x2="481" y2="105" class="ln" stroke-width="2" marker-end="url(#m11a3)"/>
  <text x="350" y="208" text-anchor="middle" class="tx-m">“에이전트가 이상하다” 의 원인은 대부분 도구 또는 도구 설명에 있다</text>
</svg>`;

  /* 그림 11-4. 기온 구간 → 옷차림 */
  const FIG_OUTFIT = `<svg viewBox="0 0 700 170" role="img" aria-label="기온 구간을 다섯 단계로 나누어 옷차림을 추천하는 순수 파이썬 규칙">
  <text x="20" y="28" class="tx-b">recommend_outfit(temperature) — 규칙 기반 도구 (LLM 불필요)</text>
  <rect x="20" y="50" width="130" height="44" rx="8" class="p1"/><text x="85" y="70" text-anchor="middle" class="tx-w" font-size="13">5°C 미만</text><text x="85" y="86" text-anchor="middle" class="tx-w" font-size="12">두꺼운 패딩 · 목도리</text>
  <rect x="155" y="50" width="130" height="44" rx="8" class="p2"/><text x="220" y="70" text-anchor="middle" class="tx-w" font-size="13">5 ~ 12°C</text><text x="220" y="86" text-anchor="middle" class="tx-w" font-size="12">코트와 니트</text>
  <rect x="290" y="50" width="130" height="44" rx="8" class="p3"/><text x="355" y="70" text-anchor="middle" class="tx-w" font-size="13">12 ~ 20°C</text><text x="355" y="86" text-anchor="middle" class="tx-w" font-size="12">가벼운 재킷 · 가디건</text>
  <rect x="425" y="50" width="130" height="44" rx="8" class="p5"/><text x="490" y="70" text-anchor="middle" class="tx-w" font-size="13">20 ~ 28°C</text><text x="490" y="86" text-anchor="middle" class="tx-w" font-size="12">얇은 긴팔 · 반팔</text>
  <rect x="560" y="50" width="120" height="44" rx="8" class="p4"/><text x="620" y="70" text-anchor="middle" class="tx-w" font-size="13">28°C 이상</text><text x="620" y="86" text-anchor="middle" class="tx-w" font-size="12">반팔 · 반바지 · 모자</text>
  <line x1="20" y1="115" x2="680" y2="115" class="ax"/>
  <text x="20" y="138" class="tx-m">입력: 숫자(섭씨)</text>
  <text x="350" y="138" text-anchor="middle" class="tx-m">출력: {'temperature': 18.4, 'outfit': '가벼운 재킷이나 가디건'}</text>
  <text x="680" y="138" text-anchor="end" class="tx-m">항상 같은 답 · 테스트 쉬움</text>
  <text x="350" y="160" text-anchor="middle" class="tx-m">LLM 은 “언제 부를지”, 파이썬은 “정확한 계산” — 역할을 나눈다</text>
</svg>`;

  /* 그림 11-5. 멀티턴 메모리 */
  const FIG_MEMORY = `<svg viewBox="0 0 700 260" role="img" aria-label="세 번의 대화가 메모리에 쌓이고 매 호출마다 시스템 프롬프트와 함께 LLM 에 전달되는 모습">
  ${ARROW('m11a4')}
  <rect x="15" y="20" width="300" height="220" rx="14" class="card-bg"/>
  <text x="165" y="46" text-anchor="middle" class="tx-b">agent.memory (ConversationMemory)</text>
  <rect x="30" y="60" width="270" height="26" rx="6" class="p1s"/><text x="40" y="78" class="tx" font-size="13">user  | 서울 날씨 어때?</text>
  <rect x="30" y="90" width="270" height="26" rx="6" class="p3s"/><text x="40" y="108" class="tx" font-size="13">tool  | {"city": "서울", "temperature": 18.4 …}</text>
  <rect x="30" y="120" width="270" height="26" rx="6" class="p2s"/><text x="40" y="138" class="tx" font-size="13">assistant | 서울은 맑음, 18.4°C 입니다.</text>
  <rect x="30" y="150" width="270" height="26" rx="6" class="p1s"/><text x="40" y="168" class="tx" font-size="13">user  | 내 이름은 민수야</text>
  <rect x="30" y="180" width="270" height="26" rx="6" class="p2s"/><text x="40" y="198" class="tx" font-size="13">assistant | 반갑습니다, 민수님.</text>
  <rect x="30" y="210" width="270" height="26" rx="6" class="p1s"/><text x="40" y="228" class="tx-b" font-size="13">user  | 내 이름이 뭐지?   ← 새 질문</text>
  <line x1="320" y1="130" x2="385" y2="130" class="ln" stroke-width="2" marker-end="url(#m11a4)"/>
  <text x="352" y="118" text-anchor="middle" class="tx-m">매 호출</text>
  <rect x="390" y="60" width="295" height="140" rx="14" class="p2s"/>
  <text x="537" y="88" text-anchor="middle" class="tx-b">LLM 에 보내는 메시지</text>
  <text x="537" y="114" text-anchor="middle" class="tx-m">[system] 당신은 친절한 날씨 비서입니다</text>
  <text x="537" y="134" text-anchor="middle" class="tx-m">+ 메모리의 모든(또는 최근 N개) 메시지</text>
  <text x="537" y="154" text-anchor="middle" class="tx-m">→ “당신의 이름은 민수 입니다.”</text>
  <text x="537" y="184" text-anchor="middle" class="tx-m">LLM 자체는 기억이 없다 — 매번 다시 보여 준다</text>
  <text x="537" y="230" text-anchor="middle" class="tx-m">agent.reset() 으로 비우기 · window 로 길이 제한</text>
</svg>`;

  /* 그림 11-6. 오류 처리 */
  const FIG_ERROR = `<svg viewBox="0 0 700 230" role="img" aria-label="도구가 예외를 던져도 error 딕셔너리로 바뀌어 LLM 에 전달되고 에이전트는 사과하거나 다른 도구를 시도한다">
  ${ARROW('m11a5')}
  <rect x="15" y="70" width="150" height="70" rx="12" class="p1s"/>
  <text x="90" y="98" text-anchor="middle" class="tx-b">도구 호출</text><text x="90" y="120" text-anchor="middle" class="tx-m">city_weather('도쿄')</text>
  <rect x="205" y="70" width="150" height="70" rx="12" class="p4s"/>
  <text x="280" y="98" text-anchor="middle" class="tx-b">파이썬 예외</text><text x="280" y="120" text-anchor="middle" class="tx-m">raise ValueError(…)</text>
  <rect x="395" y="70" width="150" height="70" rx="12" class="p3s"/>
  <text x="470" y="98" text-anchor="middle" class="tx-b">tool.call() 이 포장</text><text x="470" y="120" text-anchor="middle" class="tx-m">{'error': 'ValueError: …'}</text>
  <rect x="585" y="55" width="100" height="100" rx="12" class="p2s"/>
  <text x="635" y="82" text-anchor="middle" class="tx-b">LLM</text><text x="635" y="104" text-anchor="middle" class="tx-m">사과 · 안내</text><text x="635" y="122" text-anchor="middle" class="tx-m">다른 도구</text><text x="635" y="140" text-anchor="middle" class="tx-m">되묻기</text>
  <line x1="167" y1="105" x2="201" y2="105" class="ln" stroke-width="2" marker-end="url(#m11a5)"/>
  <line x1="357" y1="105" x2="391" y2="105" class="ln" stroke-width="2" marker-end="url(#m11a5)"/>
  <line x1="547" y1="105" x2="581" y2="105" class="ln" stroke-width="2" marker-end="url(#m11a5)"/>
  <text x="350" y="180" text-anchor="middle" class="tx-m">루프가 멈추지 않는 것이 핵심 — 예외를 삼키고 “데이터”로 바꿔 LLM 이 판단하게 한다</text>
  <text x="350" y="205" text-anchor="middle" class="tx-m">도구 안에서 미리 검사(허용 도시 목록 · 빈 입력)하면 더 친절한 오류 메시지를 만들 수 있다</text>
</svg>`;

  /* 그림 11-7. 도구 연쇄 */
  const FIG_CHAIN = `<svg viewBox="0 0 700 230" role="img" aria-label="날씨 도구의 결과 기온을 계산기 도구에 넘겨 화씨로 바꾸는 두 단계 연쇄 호출">
  ${ARROW('m11a6')}
  <rect x="15" y="30" width="180" height="60" rx="12" class="p1s"/>
  <text x="105" y="55" text-anchor="middle" class="tx-b">질문</text><text x="105" y="76" text-anchor="middle" class="tx-m">부산 기온을 화씨로?</text>
  <rect x="245" y="30" width="200" height="60" rx="12" class="p2s"/>
  <text x="345" y="55" text-anchor="middle" class="tx-b">1. get_weather('부산')</text><text x="345" y="76" text-anchor="middle" class="tx-m">→ temperature: 21.0</text>
  <rect x="495" y="30" width="190" height="60" rx="12" class="p3s"/>
  <text x="590" y="55" text-anchor="middle" class="tx-b">2. calculator(…)</text><text x="590" y="76" text-anchor="middle" class="tx-m">'21.0 * 9/5 + 32' → 69.8</text>
  <line x1="197" y1="60" x2="241" y2="60" class="ln" stroke-width="2" marker-end="url(#m11a6)"/>
  <line x1="447" y1="60" x2="491" y2="60" class="ln" stroke-width="2" marker-end="url(#m11a6)"/>
  <path d="M590 92 C590 150 200 150 110 150" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m11a6)"/>
  <rect x="15" y="130" width="180" height="46" rx="10" class="p5s"/>
  <text x="105" y="158" text-anchor="middle" class="tx">답: 69.8°F (21°C)</text>
  <text x="350" y="205" text-anchor="middle" class="tx-m">1단계 관찰값(21.0)이 2단계 인자로 들어간다 — LLM 이 두 번 판단하고, 루프가 두 바퀴 돈다</text>
</svg>`;

  /* 그림 11-8. CLI 루프 */
  const FIG_CLI = `<svg viewBox="0 0 700 220" role="img" aria-label="입력을 받아 종료어면 끝내고 아니면 에이전트에 넘겨 답을 출력하는 while 루프">
  ${ARROW('m11a7')}
  <rect x="20" y="80" width="130" height="56" rx="12" class="p1s"/><text x="85" y="113" text-anchor="middle" class="tx-b">input('나: ')</text>
  <path d="M200 108 L260 70 L320 108 L260 146 Z" class="p3s"/><text x="260" y="104" text-anchor="middle" class="tx" font-size="13">'종료'?</text><text x="260" y="122" text-anchor="middle" class="tx-m">빈 입력?</text>
  <rect x="380" y="80" width="150" height="56" rx="12" class="p2s"/><text x="455" y="104" text-anchor="middle" class="tx-b">agent.run(q)</text><text x="455" y="124" text-anchor="middle" class="tx-m">메모리 유지</text>
  <rect x="570" y="80" width="110" height="56" rx="12" class="p5s"/><text x="625" y="113" text-anchor="middle" class="tx-b">print(답)</text>
  <rect x="200" y="170" width="120" height="36" rx="10" class="p4s"/><text x="260" y="193" text-anchor="middle" class="tx">break (끝)</text>
  <line x1="152" y1="108" x2="196" y2="108" class="ln" stroke-width="2" marker-end="url(#m11a7)"/>
  <line x1="322" y1="108" x2="376" y2="108" class="ln" stroke-width="2" marker-end="url(#m11a7)"/>
  <text x="348" y="100" text-anchor="middle" class="tx-m">아니오</text>
  <line x1="532" y1="108" x2="566" y2="108" class="ln" stroke-width="2" marker-end="url(#m11a7)"/>
  <line x1="260" y1="148" x2="260" y2="166" class="ln" stroke-width="2" marker-end="url(#m11a7)"/>
  <text x="285" y="162" class="tx-m">예</text>
  <path d="M625 78 C625 30 85 30 85 76" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m11a7)"/>
  <text x="355" y="42" text-anchor="middle" class="tx-m">while True — 같은 agent 객체를 쓰므로 이전 대화를 기억한다</text>
</svg>`;

  /* 그림 11-9. agentlab ↔ LangChain 매핑 */
  const FIG_REAL = `<svg viewBox="0 0 700 250" role="img" aria-label="브라우저 agentlab 구성 요소가 Colab 의 LangChain 구성 요소와 하나씩 대응되는 그림">
  ${ARROW('m11a8')}
  <text x="160" y="30" text-anchor="middle" class="tx-b">브라우저 · agentlab</text>
  <text x="540" y="30" text-anchor="middle" class="tx-b">Colab · LangChain + LangGraph</text>
  <rect x="20" y="45" width="280" height="36" rx="8" class="p1s"/><text x="160" y="68" text-anchor="middle" class="tx" font-size="13">al.LLM()</text>
  <rect x="400" y="45" width="280" height="36" rx="8" class="p1s"/><text x="540" y="68" text-anchor="middle" class="tx" font-size="13">ChatGoogleGenerativeAI / ChatGroq</text>
  <rect x="20" y="90" width="280" height="36" rx="8" class="p2s"/><text x="160" y="113" text-anchor="middle" class="tx" font-size="13">@al.tool def get_weather(city)</text>
  <rect x="400" y="90" width="280" height="36" rx="8" class="p2s"/><text x="540" y="113" text-anchor="middle" class="tx" font-size="13">@tool + OpenWeatherMap(requests)</text>
  <rect x="20" y="135" width="280" height="36" rx="8" class="p3s"/><text x="160" y="158" text-anchor="middle" class="tx" font-size="13">al.wiki_search</text>
  <rect x="400" y="135" width="280" height="36" rx="8" class="p3s"/><text x="540" y="158" text-anchor="middle" class="tx" font-size="13">DuckDuckGoSearchRun (무료 검색)</text>
  <rect x="20" y="180" width="280" height="36" rx="8" class="p5s"/><text x="160" y="203" text-anchor="middle" class="tx" font-size="13">al.Agent(llm, tools, system).run()</text>
  <rect x="400" y="180" width="280" height="36" rx="8" class="p5s"/><text x="540" y="203" text-anchor="middle" class="tx" font-size="13">create_react_agent(llm, tools).invoke()</text>
  <line x1="304" y1="63" x2="396" y2="63" class="ln" stroke-width="2" marker-end="url(#m11a8)"/>
  <line x1="304" y1="108" x2="396" y2="108" class="ln" stroke-width="2" marker-end="url(#m11a8)"/>
  <line x1="304" y1="153" x2="396" y2="153" class="ln" stroke-width="2" marker-end="url(#m11a8)"/>
  <line x1="304" y1="198" x2="396" y2="198" class="ln" stroke-width="2" marker-end="url(#m11a8)"/>
  <text x="350" y="240" text-anchor="middle" class="tx-m">이름을 맞춰 두었으므로 코드 구조가 거의 같다 — 바뀌는 것은 import 와 도구 구현뿐</text>
</svg>`;

  /* ------------------------------------------------------------------ 퀴즈 */
  const QUIZ1 = [
    { q: '이 프로젝트에서 LLM 이 <b>직접 답할 수 없어</b> 도구가 꼭 필요한 정보는?', options: ['“우산” 이라는 단어의 뜻', '부산의 지금 날씨', '섭씨와 화씨의 관계', '비서가 인사하는 말투'], answer: 1,
      explain: 'LLM 은 학습 시점 이후의 “지금” 정보를 모릅니다. 현재 날씨 · 현재 시각 · 최신 뉴스처럼 바뀌는 정보는 도구(API)로 가져와야 합니다. 나머지는 모델이 이미 알고 있는 지식이나 스타일입니다.' },
    { q: '에이전트를 조립하기 전에 <code>al.get_weather(\'서울\')</code> 처럼 도구를 <b>단독으로</b> 먼저 실행해 보는 가장 큰 이유는?', options: ['LLM 호출 횟수를 늘리기 위해', '도구의 결과 형식과 오류 형태를 LLM 없이(비용 없이) 확인하기 위해', '브라우저가 도구를 자동으로 등록하기 때문에', '단독 실행을 해야 API 키가 생기기 때문에'], answer: 1,
      explain: '“에이전트가 이상하다”의 원인은 대부분 도구에 있습니다. 도구를 먼저 단독으로 돌려 결과 키(temperature, condition …)와 오류 모양을 확인하면, 이후 에이전트 디버깅이 훨씬 쉬워집니다.' },
    { q: '<code>@al.tool</code> 로 만든 <code>recommend_outfit</code> 의 docstring 첫 줄과 <code>temperature: 섭씨 기온</code> 줄은 어디에 쓰일까?', options: ['파이썬 문법 검사에만 쓰인다', 'LLM 에게 보내는 도구 스키마(설명 · 매개변수 설명)가 된다', '브라우저 화면의 제목이 된다', '아무 데도 쓰이지 않는다'], answer: 1,
      explain: '<code>tool.schema()</code> 를 출력해 보면 docstring 첫 줄이 <code>description</code>, “이름: 설명” 줄이 매개변수 설명으로 들어갑니다. LLM 은 이 설명을 읽고 언제 어떤 인자로 도구를 부를지 결정하므로, docstring 이 곧 프롬프트입니다.' },
    { q: '시스템 프롬프트를 “당신은 친절한 날씨 비서입니다” 로 두었을 때 모의 LLM 답 앞에 <code>[친절한 날씨 비서]</code> 가 붙는다. 이것이 보여 주는 것은?', options: ['페르소나(역할)가 응답 스타일에 반영되고 있다는 표시', '도구 호출이 실패했다는 표시', 'API 키가 없다는 경고', '메모리가 가득 찼다는 표시'], answer: 0,
      explain: '모의 LLM 은 시스템 프롬프트의 역할을 읽어 답 앞에 <code>[역할]</code> 을 붙여 줍니다. 실제 모델은 접두어 대신 말투 · 길이 · 관점이 바뀌는 식으로 페르소나가 드러납니다.' }
  ];
  const QUIZ2 = [
    { q: '같은 <code>agent</code> 객체로 <code>run()</code> 을 세 번 부르면 세 번째 질문 “내 이름이 뭐지?” 에 답할 수 있는 이유는?', options: ['LLM 이 사용자를 기억하기 때문에', '<code>agent.memory</code> 에 쌓인 이전 메시지를 매 호출마다 함께 보내기 때문에', '브라우저 쿠키에 저장되기 때문에', '도구가 이름을 저장하기 때문에'], answer: 1,
      explain: 'LLM 자체는 상태가 없습니다. 에이전트가 <code>ConversationMemory</code> 에 대화를 쌓아 두고 매번 시스템 프롬프트 + 전체(또는 최근 N개) 메시지를 보내기 때문에 이전 대화를 “기억”하는 것처럼 보입니다.' },
    { q: '도구 함수 안에서 <code>raise ValueError(\'지원하지 않는 도시\')</code> 가 일어났다. 에이전트 루프에는 어떤 일이 생길까?', options: ['프로그램 전체가 예외로 종료된다', '<code>tool.call()</code> 이 예외를 <code>{\'error\': …}</code> 로 바꿔 LLM 에 전달하고 루프는 계속된다', 'LLM 이 자동으로 도시를 바꿔 다시 호출한다', '메모리가 초기화된다'], answer: 1,
      explain: '<code>Tool.call()</code> 은 예외를 잡아 <code>{\'error\': \'ValueError: …\'}</code> 딕셔너리로 돌려줍니다. 이 “데이터”를 받은 LLM 이 사과하거나 되묻거나 다른 도구를 시도합니다. 루프가 멈추지 않는 것이 핵심입니다.' },
    { q: '“부산 기온을 화씨로 알려줘” 를 제대로 처리하려면 에이전트 루프가 최소 몇 바퀴 돌아야 할까? (도구: get_weather, calculator)', options: ['0바퀴 — LLM 이 바로 답한다', '1바퀴 — 도구 하나만 부른다', '2바퀴 — 날씨 → 계산 순서로 두 번 도구를 부른다', '도구 수와 관계없이 항상 6바퀴'], answer: 2,
      explain: '먼저 get_weather 로 기온(21.0)을 얻고, 그 관찰값을 calculator 의 인자로 넣어 화씨를 계산해야 하므로 LLM 판단 → 도구 → 관찰이 두 번 반복됩니다. 모의 LLM 은 한 번에 도구 하나만 고르므로 수업에서는 대본(mock_responses)으로 연쇄를 재현합니다.' },
    { q: 'Colab 의 LangChain 구현에서 브라우저의 <code>al.Agent(llm, tools, system).run(q)</code> 에 해당하는 것은?', options: ['<code>PromptTemplate | llm</code>', '<code>create_react_agent(llm, tools, prompt=...).invoke({"messages": [...]})</code>', '<code>DuckDuckGoSearchRun()</code>', '<code>requests.get(OpenWeatherMap URL)</code>'], answer: 1,
      explain: 'LangGraph 의 <code>create_react_agent</code> 가 “LLM 판단 → 도구 실행 → 관찰” 루프를 만들어 주는 에이전트 생성 함수입니다. 검색 · 날씨는 도구이고, 프롬프트 템플릿은 체인의 한 조각입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag11',
    no: '11',
    title: '프로젝트 ①: 날씨 · 검색 비서 에이전트',
    subtitle: '요구사항 → 도구 → 에이전트 → 대화 · 오류 처리 · 저장 · 배포 준비',
    summary: 'Part 2~3 에서 배운 요소(역할 · 도구 · 기억 · 루프)를 모두 모아 <b>실제로 쓸 만한 비서 에이전트</b>를 완성합니다. 무료 날씨 API(Open-Meteo)와 위키백과 검색, 현재 시각, 계산기를 도구로 붙이고, 옷차림 추천 같은 나만의 도구를 추가한 뒤, 여러 번 대화하고 오류를 처리하고 결과를 파일로 남기는 비서를 만듭니다. Colab 에서는 같은 설계를 LangChain + DuckDuckGo + OpenWeatherMap 으로 다시 구현합니다.',
    goals: [
      '사용자 요구를 기능 · 비기능 요구사항과 아키텍처 그림으로 정리할 수 있다',
      '도구를 단독 테스트 → 스키마 확인 → 에이전트 연결 순서로 조립하고 trace 로 동작을 설명할 수 있다',
      '순수 파이썬 커스텀 도구와 페르소나 시스템 프롬프트로 에이전트의 기능과 말투를 설계할 수 있다',
      '멀티턴 대화 · 오류 처리 · 도구 연쇄 · 결과 저장 · CLI 루프를 갖춘 비서를 완성하고 체크리스트로 점검할 수 있다'
    ],
    sections: [
      {
        id: 'ag11-1',
        title: '요구사항 정의와 도구 조립',
        minutes: 50,
        goals: ['프로젝트 요구사항과 아키텍처를 그림으로 설명한다', '내장 도구 4개를 단독 테스트하고 결과 형식을 안다', '커스텀 도구와 페르소나를 추가해 첫 에이전트를 실행하고 trace 를 읽는다'],
        flow: [['도입 · 프로젝트 소개', 5], ['요구사항 · 아키텍처', 10], ['도구 단독 테스트', 12], ['커스텀 도구 · 페르소나', 13], ['에이전트 실행 · 정리', 10]],
        content: [
          { type: 'p', html: '지금까지는 에이전트의 부품을 하나씩 배웠습니다. 이번 차시부터는 <b>프로젝트</b>입니다. 첫 번째 프로젝트는 “내일 부산 날씨 알려주고 우산이 필요한지도 말해 줘” 같은 질문에 <b>최신 정보를 찾아 짧게 답하는 비서</b>입니다. 소프트웨어 프로젝트답게 요구사항을 적고 → 구조를 그리고 → 부품(도구)을 먼저 검사하고 → 조립하고 → 대화 · 오류 · 저장까지 다듬는 순서로 진행합니다.' },
          { type: 'h', text: '1. 요구사항 정의' },
          { type: 'p', html: '좋은 프로젝트는 “무엇을 만들지”를 한 문장으로 말할 수 있어야 합니다. 우리 비서의 한 문장 목표는 <b>“사용자의 자연어 질문을 받아, 필요한 최신 정보를 도구로 찾고, 근거가 있는 짧은 답을 돌려준다”</b> 입니다. 이를 기능 요구사항(무엇을 하는가)과 비기능 요구사항(어떻게 동작해야 하는가)으로 나누어 적어 봅니다.' },
          { type: 'figure', html: FIG_REQ, caption: '그림 11-1. 질문 → 최신 정보 검색 → 요약 답변. LLM 이 모르는 “지금” 정보를 도구가 채웁니다.' },
          { type: 'table', head: ['구분', '요구사항', '확인 방법'], rows: [
            ['기능 F1', '도시 이름을 받아 <b>현재 날씨</b>(기온 · 상태 · 습도 · 풍속)를 답한다', '“부산 날씨 어때?” → 기온과 상태가 포함된 답'],
            ['기능 F2', '모르는 주제는 <b>위키백과</b>에서 찾아 두세 문장으로 요약한다', '“전기차가 뭐야?” → 출처가 있는 요약'],
            ['기능 F3', '<b>현재 시각 · 간단한 계산</b>(섭씨→화씨 등)을 처리한다', '“지금 몇 시야?”, “21도는 화씨로?”'],
            ['기능 F4', '기온에 따른 <b>옷차림 추천</b>처럼 우리만의 규칙 도구를 가진다', '18°C → “가벼운 재킷”'],
            ['비기능 N1', 'API 키가 없어도 동작한다 (무료 API · 모의 LLM)', '키 없이 예제 전체 실행'],
            ['비기능 N2', '도구가 실패해도 멈추지 않고 사과 · 안내한다', '없는 도시 → 오류 안내'],
            ['비기능 N3', '이전 대화를 기억하고, 결과를 파일로 남긴다', '“내 이름이 뭐지?” · report.md']
          ], caption: '표 11-1. 비서 에이전트 요구사항. 체크리스트(2교시 끝)에서 다시 확인합니다.' },
          { type: 'h', text: '2. 아키텍처: 루프 하나, 도구 넷' },
          { type: 'p', html: '구조는 단순합니다. 가운데에 <b>에이전트 루프</b>(<code>al.Agent</code>)가 있고, 왼쪽에 사용자, 오른쪽에 도구들이 있습니다. 루프는 매 바퀴마다 “시스템 프롬프트 + 대화 메모리”를 LLM 에 보내고, LLM 이 도구 호출을 요청하면 실행해 결과(관찰)를 다시 보여 줍니다. 도구 호출이 없으면 그 답이 최종 답입니다.' },
          { type: 'figure', html: FIG_ARCH, caption: '그림 11-2. 비서 에이전트 아키텍처. 도구는 모두 키 없이 쓸 수 있는 것들로 골랐습니다.' },
          { type: 'table', head: ['도구', '하는 일', '정보 출처', 'API 키'], rows: [
            ['<code>al.get_weather(city)</code>', '현재 기온 · 날씨 상태 · 습도 · 풍속', '<a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> (도시 이름 → 좌표 → 예보)', '불필요'],
            ['<code>al.wiki_search(query)</code>', '주제 검색 → 제목 · 요약 · URL', '한국어 위키백과 API', '불필요'],
            ['<code>al.now()</code>', '현재 날짜 · 시각 · 요일', '파이썬 <code>datetime</code>', '불필요'],
            ['<code>al.calculator(expression)</code>', '사칙연산 · 괄호 · sqrt · 퍼센트', '안전한 <code>eval</code>', '불필요'],
            ['<code>recommend_outfit(temperature)</code>', '기온 구간 → 옷차림 추천 (우리가 작성)', '순수 파이썬 규칙', '불필요']
          ], caption: '표 11-2. 도구 목록. 네트워크가 없거나 검증 도구로 실행할 때는 준비된 예시 데이터를 돌려줍니다.' },
          { type: 'h', text: '3. 도구를 하나씩 단독으로 테스트하기' },
          { type: 'p', html: '에이전트를 만들기 전에 <b>도구부터</b> 실행해 봅니다. LLM 없이 파이썬 함수처럼 호출하면 비용도 없고 결과 형식(어떤 키가 있는지)과 오류 모양을 바로 볼 수 있습니다. 에이전트가 엉뚱하게 행동할 때 원인의 대부분은 도구나 도구 설명에 있으므로, 이 단계가 나중의 디버깅 시간을 크게 줄여 줍니다.' },
          { type: 'figure', html: FIG_TEST, caption: '그림 11-3. 도구 단독 테스트 → 스키마 확인 → 에이전트 연결. 문제가 생기면 1단계로 돌아갑니다.' },
          { type: 'code', title: '예제 11-1. 날씨 도구 단독 테스트 — Open-Meteo 무료 API', nondeterministic: true, code: `import agentlab as al

# 도구는 그냥 파이썬 함수처럼 부를 수 있다 (LLM 불필요)
for city in ['서울', '부산', 'Tokyo']:
    r = al.get_weather(city)
    print(city, '→', r)

# 결과 딕셔너리의 키를 확인해 둔다 (에이전트가 이 키로 답을 만든다)
r = al.get_weather('제주')
print('키 목록:', list(r.keys()))
print('기온만:', r['temperature'], '°C /', r['condition'])
print('출처:', r.get('source'))`,
            expect: `서울 → {'city': '서울', 'temperature': 18.4, 'condition': '맑음', 'humidity': 42, 'wind_kmh': 2.1, 'source': 'sample (offline)'}
부산 → {'city': '부산', 'temperature': 21.0, 'condition': '구름 조금', 'humidity': 60, 'wind_kmh': 4.3, 'source': 'sample (offline)'}
Tokyo → {'city': 'Tokyo', 'temperature': 18.0, 'condition': '맑음', 'humidity': 50, 'wind_kmh': 2.0, 'source': 'sample (offline)'}
키 목록: ['city', 'temperature', 'condition', 'humidity', 'wind_kmh', 'source']
기온만: 22.3 °C / 구름 많음
출처: sample (offline)`,
            desc: '브라우저에서는 실제 Open-Meteo API 를 불러 <code>source</code> 가 <code>open-meteo.com</code> 이 되고 값도 지금 날씨입니다. 네트워크가 없으면 예시 데이터(<code>sample (offline)</code>)를 돌려주므로 수업은 항상 진행됩니다. 예시 출력은 오프라인 기준입니다.' },
          { type: 'code', title: '예제 11-2. 검색 · 시각 · 계산 도구 테스트와 스키마 확인', nondeterministic: true, code: `import agentlab as al

w = al.wiki_search('전기차')
print('제목:', w['title'])
print('요약:', w['summary'][:60], '…')

print('지금:', al.now())
print('계산:', al.calculator('21.0 * 9/5 + 32'))      # 섭씨 → 화씨
print('오류:', al.calculator('10 / 0'))               # 실패해도 예외 대신 error 키

# LLM 에게 전달되는 도구 설명(스키마) — docstring 이 곧 프롬프트
s = al.get_weather.schema()
print('이름:', s['name'])
print('설명:', s['description'])
print('매개변수:', list(s['parameters']['properties']))`,
            expect: `제목: 전기 자동차
요약: 전기 자동차는 배터리에 저장된 전기로 모터를 구동하는 자동차로, 배출가스가 없고 유지비가 낮아 보급이 빠르게 늘고 있다. …
지금: {'now': '2026-10-05 09:30', 'weekday': '월요일'}
계산: {'expression': '21.0 * 9/5 + 32', 'result': 69.8}
오류: {'error': '0 으로 나눌 수 없습니다', 'expression': '10 / 0'}
이름: get_weather
설명: 도시의 현재 날씨(기온 · 날씨 상태 · 습도 · 풍속)를 알려준다. Open-Meteo 무료 API 사용 (키 불필요)
매개변수: ['city']`,
            desc: '<code>calculator(\'10 / 0\')</code> 가 예외 대신 <code>{\'error\': …}</code> 를 돌려주는 것에 주목하세요. 에이전트 루프는 이 딕셔너리를 그대로 LLM 에 보여 주고, LLM 이 사과하거나 다시 시도합니다(2교시). 브라우저에서 <code>wiki_search</code> 와 <code>now()</code> 는 실제 값을 돌려주므로 출력이 달라집니다.' },
          { type: 'callout', kind: 'tip', title: '도구 설명을 다듬는 기준', html: 'LLM 은 <code>schema()</code> 의 <code>description</code> 만 보고 도구를 고릅니다. “도시의 현재 날씨를 알려준다” 처럼 <b>언제 써야 하는지</b>가 드러나는 한 문장과, 매개변수마다 “city: 도시 이름 (한글 또는 영문)” 처럼 <b>형식과 예시</b>를 적어 두면 잘못된 호출이 크게 줄어듭니다.' },
          { type: 'h', text: '4. 커스텀 도구 추가: 옷차림 추천' },
          { type: 'p', html: '내장 도구만으로는 “뭘 입을까?” 에 답할 수 없습니다. 기온 구간마다 옷차림을 돌려주는 <b>순수 파이썬 함수</b>를 <code>@al.tool</code> 로 감싸면 바로 도구가 됩니다. 이 도구는 LLM 을 전혀 쓰지 않으므로 항상 같은 답을 내고, 테스트도 쉽습니다. LLM 의 역할은 “지금 이 도구를 부를 때인가?” 를 판단하고 결과를 자연스러운 문장으로 바꾸는 것뿐입니다.' },
          { type: 'figure', html: FIG_OUTFIT, caption: '그림 11-4. 기온 구간 → 옷차림. 정확한 계산과 규칙은 파이썬이, 판단과 문장은 LLM 이 맡습니다.' },
          { type: 'code', title: '예제 11-3. 옷차림 추천 도구 만들고 단독 테스트하기', code: `import agentlab as al

@al.tool
def recommend_outfit(temperature: float) -> dict:
    """기온에 맞는 옷차림을 추천한다
    temperature: 섭씨 기온 (숫자)
    """
    t = float(temperature)
    if t >= 28:
        tip = '반팔과 반바지, 모자'
    elif t >= 20:
        tip = '얇은 긴팔 또는 반팔'
    elif t >= 12:
        tip = '가벼운 재킷이나 가디건'
    elif t >= 5:
        tip = '코트와 니트'
    else:
        tip = '두꺼운 패딩, 목도리'
    return {'temperature': t, 'outfit': tip}

# 1) 함수처럼 단독 테스트
for t in [31, 18.4, 7, -3]:
    print(t, '°C →', recommend_outfit(t)['outfit'])
# 2) 에이전트가 쓰는 방식 (dict 인자) — 잘못된 인자는 error 로
print(recommend_outfit.call({'temperature': 21.0}))
print(recommend_outfit.call({'temperature': '추움'}))
# 3) LLM 에게 보일 스키마
print(recommend_outfit.schema()['description'])`,
            expect: `31 °C → 반팔과 반바지, 모자
18.4 °C → 가벼운 재킷이나 가디건
7 °C → 코트와 니트
-3 °C → 두꺼운 패딩, 목도리
{'temperature': 21.0, 'outfit': '얇은 긴팔 또는 반팔'}
{'error': "ValueError: could not convert string to float: '추움'"}
기온에 맞는 옷차림을 추천한다
temperature: 섭씨 기온 (숫자)`,
            desc: '<code>recommend_outfit.call({...})</code> 는 에이전트가 쓰는 호출 방식입니다. 문자열 “추움” 처럼 잘못된 인자가 와도 프로그램이 죽지 않고 <code>error</code> 를 돌려줍니다. 경계값(28, 20, 12, 5)을 바꾸거나 “비 오면 우산” 규칙을 추가해 보세요.' },
          { type: 'h', text: '5. 페르소나: 비서의 말투와 원칙' },
          { type: 'p', html: '시스템 프롬프트는 비서의 <b>역할 · 말투 · 원칙</b>을 정합니다. “당신은 친절한 날씨 비서입니다” 한 줄에 더해, <b>도구 결과를 근거로만 답한다 · 모르면 모른다고 한다 · 두 문장 이내</b> 같은 원칙을 적어 두면 실제 모델의 답이 훨씬 안정적입니다. 모의 LLM 은 역할을 읽어 답 앞에 <code>[역할]</code> 을 붙여 주므로 페르소나가 바뀌는 것을 눈으로 확인할 수 있습니다.' },
          { type: 'code', title: '예제 11-4. 페르소나 비교 — 같은 질문, 다른 시스템 프롬프트', code: `import agentlab as al

llm = al.LLM()
al.status()

ASSISTANT = """당신은 친절한 날씨 비서입니다.
원칙: 도구 결과를 근거로만 답하고, 모르면 모른다고 말합니다. 답은 두 문장 이내로 짧게.
비가 오면 우산을, 기온이 낮으면 따뜻한 옷을 권합니다."""

BRIEF = '당신은 간결한 기상 캐스터입니다. 숫자 위주로 한 문장으로만 답합니다.'

for name, system in [('비서', ASSISTANT), ('캐스터', BRIEF)]:
    print(f'[{name}]', llm.ask('안녕하세요, 자기소개 해주세요', system_prompt=system))
    print(f'[{name}]', llm.ask('오늘 뭘 입으면 좋을까요?', system_prompt=system))
    print()`,
            expect: `🤖 LLM: 모의 LLM (API 키 없음) — 왼쪽 아래 🔑 API 키 에서 무료 키를 넣으면 실제 모델이 답합니다.
[비서] [친절한 날씨 비서] 안녕하세요! 무엇을 도와드릴까요?
[비서] [친절한 날씨 비서] "오늘 뭘 입으면 좋을까요?" 에 대한 답변 (친절하게 설명): 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계로 나누어 검증하며 진행하는 것입니다.

[캐스터] [간결한 기상 캐스터] 안녕하세요! 무엇을 도와드릴까요?
[캐스터] [간결한 기상 캐스터] "오늘 뭘 입으면 좋을까요?" 에 대한 답변 (간결하게): 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계로 나누어 검증하며 진행하는 것입니다.`,
            desc: '예시 출력은 모의 LLM 기준입니다. 모의 LLM 은 역할 접두어와 “(친절하게 설명) / (간결하게)” 표시로 페르소나 차이를 흉내 냅니다. 🔑 키를 넣으면 실제 모델이 말투와 길이를 바꿔 답합니다. 도구가 없으니 옷차림 질문에 제대로 답하지 못하는 점도 확인하세요 — 다음 예제에서 도구를 붙입니다.' },
          { type: 'h', text: '6. 조립: 첫 번째 비서 실행' },
          { type: 'p', html: '이제 LLM + 도구 4개 + 페르소나를 <code>al.Agent</code> 에 넣습니다. <code>verbose=True</code> 로 두면 🔧 도구 호출 → 👁 관찰 → ✅ 최종 답이 오른쪽 결과 창에 그대로 찍히고, 실행 뒤 <code>agent.trace()</code> 로 단계를 복기할 수 있습니다.' },
          { type: 'code', title: '예제 11-5. 비서 에이전트 조립과 첫 질문', nondeterministic: true, code: `import agentlab as al

SYSTEM = """당신은 친절한 날씨 비서입니다.
원칙: 도구 결과를 근거로만 답하고, 모르면 모른다고 말합니다. 답은 두 문장 이내로 짧게.
비가 오면 우산을, 기온이 낮으면 따뜻한 옷을 권합니다."""

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.wiki_search, al.now, al.calculator],
                 system=SYSTEM, max_steps=6, verbose=True)

answer = agent.run('내일 부산 날씨 알려주고 우산이 필요한지 말해줘')
print('--- 최종 답 ---')
print(answer)
print('--- trace ---')
agent.trace()
print('호출된 도구:', [s.data['name'] for s in agent.steps if s.kind == 'tool'])
print('LLM 호출 횟수:', llm.calls, '· 토큰:', llm.total_usage.total_tokens)`,
            expect: `🔧 도구 호출 1: get_weather({"city": "부산"})
👁 관찰: {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3, "source": "sample (offline)"}
✅ 최종 답: [친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
--- 최종 답 ---
[친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
--- trace ---
 1. 🔧 get_weather({"city": "부산"})
 2. 👁 {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3,…(생략)
 3. ✅ [친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
호출된 도구: ['get_weather']
LLM 호출 횟수: 2 · 토큰: 146`,
            desc: '루프가 두 바퀴 돌았습니다: 1바퀴째 LLM 이 <code>get_weather(부산)</code> 를 요청 → 실행 · 관찰, 2바퀴째 관찰을 보고 최종 답. <code>agent.steps</code> 에는 tool / observe / answer 단계가 객체로 남아 있어 13차시의 자동 평가에 그대로 씁니다. 실제 모델은 “내일” 이라는 말에 “현재 날씨만 알 수 있다”고 덧붙이기도 합니다.' },
          { type: 'code', title: '예제 11-6. 날씨 → 옷차림 두 도구 연쇄 (대본으로 재현)', nondeterministic: true, code: `import agentlab as al

@al.tool
def recommend_outfit(temperature: float) -> dict:
    """기온에 맞는 옷차림을 추천한다
    temperature: 섭씨 기온 (숫자)
    """
    t = float(temperature)
    tip = '반팔' if t >= 24 else '가벼운 재킷' if t >= 12 else '두꺼운 외투'
    return {'temperature': t, 'outfit': tip}

# 모의 LLM 은 한 번에 도구 하나만 고르므로, 실제 모델이 하는 연쇄 호출을 대본으로 재현한다
# (🔑 키가 있으면 대본은 무시되고 실제 모델이 스스로 두 도구를 차례로 부른다)
script = al.LLM(mock_responses=[
    al.Response('', [al.ToolCall('get_weather', {'city': '서울'})]),
    al.Response('', [al.ToolCall('recommend_outfit', {'temperature': 18.4})]),
    '서울은 맑고 18.4°C 입니다. 가벼운 재킷을 추천합니다.',
])
agent = al.Agent(script, tools=[al.get_weather, recommend_outfit],
                 system='당신은 친절한 날씨 비서입니다.', verbose=True)
print(agent.run('서울 날씨에 맞는 옷차림 알려줘'))
print('루프 바퀴 수:', sum(1 for s in agent.steps if s.kind == 'tool') + 1)`,
            expect: `🔧 도구 호출 1: get_weather({"city": "서울"})
👁 관찰: {"city": "서울", "temperature": 18.4, "condition": "맑음", "humidity": 42, "wind_kmh": 2.1, "source": "sample (offline)"}
🔧 도구 호출 2: recommend_outfit({"temperature": 18.4})
👁 관찰: {"temperature": 18.4, "outfit": "가벼운 재킷"}
✅ 최종 답: 서울은 맑고 18.4°C 입니다. 가벼운 재킷을 추천합니다.
서울은 맑고 18.4°C 입니다. 가벼운 재킷을 추천합니다.
루프 바퀴 수: 3`,
            desc: '<code>al.Response(\'\', [al.ToolCall(...)])</code> 는 “LLM 이 이 도구를 이 인자로 부르겠다고 답했다”는 대본입니다. 1단계 관찰값 18.4 가 2단계 인자로 들어가는 흐름을 눈으로 확인하세요. 브라우저에서는 실제 날씨 값이 들어오므로 대본의 18.4 와 다를 수 있습니다 — 실제 모델이라면 관찰값을 그대로 넘깁니다.' },
          { type: 'callout', kind: 'warn', title: '모의 LLM 의 한계를 알고 쓰기', html: '모의 LLM 은 질문의 <b>키워드</b>(날씨 · 계산 · 검색 · 몇 시 · 저장)로 도구를 고르고, 한 대화에서 같은 도구를 두 번 고르지 않습니다. “그럼 도쿄는?” 처럼 맥락에 기대는 질문이나 두 도구 연쇄는 처리하지 못하므로, 수업에서는 <b>명시적인 질문</b>이나 <b>대본(mock_responses)</b>을 씁니다. 🔑 키를 넣으면 실제 모델이 이 모든 것을 스스로 합니다.' }
        ],
        practice: [
          { title: '실습 11-1. 체감온도 도구 추가하기', level: 1,
            desc: '<p>풍속이 세면 더 춥게 느껴집니다. 기온(°C)과 풍속(km/h)을 받아 <b>체감온도</b>를 돌려주는 도구 <code>feels_like</code> 를 만드세요. 간단한 근사식 <code>체감 = 기온 - 0.2 × 풍속</code> 을 쓰고, 결과는 소수점 한 자리로 반올림해 <code>{\'feels_like\': 값}</code> 로 돌려줍니다. 단독 테스트와 <code>schema()</code> 출력까지 확인하세요.</p>',
            hint: '<code>round(temperature - 0.2 * wind_kmh, 1)</code>. docstring 에 매개변수 설명 두 줄을 꼭 적으세요.',
            starter: `import agentlab as al

@al.tool
def feels_like(temperature: float, wind_kmh: float) -> dict:
    """기온과 풍속으로 체감온도를 계산한다
    temperature: 섭씨 기온
    wind_kmh: 풍속 (km/h)
    """
    # TODO: 체감 = 기온 - 0.2 * 풍속 (소수점 한 자리)
    return {'feels_like': None}

print(feels_like(18.4, 2.1))
print(feels_like(5.0, 30.0))
print(feels_like.call({'temperature': 21.0, 'wind_kmh': 4.3}))
print(list(feels_like.schema()['parameters']['properties']))
`,
            solution: `import agentlab as al

@al.tool
def feels_like(temperature: float, wind_kmh: float) -> dict:
    """기온과 풍속으로 체감온도를 계산한다
    temperature: 섭씨 기온
    wind_kmh: 풍속 (km/h)
    """
    value = round(float(temperature) - 0.2 * float(wind_kmh), 1)
    return {'feels_like': value}

print(feels_like(18.4, 2.1))
print(feels_like(5.0, 30.0))
print(feels_like.call({'temperature': 21.0, 'wind_kmh': 4.3}))
print(list(feels_like.schema()['parameters']['properties']))
`,
            expect: `{'feels_like': 18.0}
{'feels_like': -1.0}
{'feels_like': 20.1}
['temperature', 'wind_kmh']` },
          { title: '실습 11-2. 나만의 페르소나로 비서 만들기', level: 2, nondeterministic: true,
            desc: '<p>시스템 프롬프트를 바꿔 <b>“당신은 등산 안내 비서입니다”</b> 페르소나를 만들고, 도구 <code>get_weather</code> · <code>now</code> 를 붙여 “강릉 날씨 알려줘” 와 “지금 몇 시야?” 두 질문을 차례로 실행하세요. 답 앞의 역할 표시가 바뀌는지, 각 질문에 어떤 도구가 호출되는지 <code>agent.steps</code> 로 출력합니다.</p>',
            hint: '역할 문장은 “당신은 OO입니다” 형식이어야 모의 LLM 이 역할을 읽습니다. 호출된 도구: <code>[s.data[\'name\'] for s in agent.steps if s.kind == \'tool\']</code>',
            starter: `import agentlab as al

SYSTEM = '당신은 등산 안내 비서입니다. 날씨와 시각을 확인해 산행 준비물을 짧게 권합니다.'
llm = al.LLM()
# TODO: get_weather, now 도구를 붙인 에이전트 만들기 (verbose=True)
agent = None

for q in ['강릉 날씨 알려줘', '지금 몇 시야?']:
    # TODO: 질문 실행 → 답과 호출된 도구 이름 출력
    pass
`,
            solution: `import agentlab as al

SYSTEM = '당신은 등산 안내 비서입니다. 날씨와 시각을 확인해 산행 준비물을 짧게 권합니다.'
llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.now], system=SYSTEM, verbose=True)

for q in ['강릉 날씨 알려줘', '지금 몇 시야?']:
    answer = agent.run(q)
    used = [s.data['name'] for s in agent.steps if s.kind == 'tool']
    print('Q:', q)
    print('A:', answer)
    print('도구:', used)
    print()
`,
            expect: `🔧 도구 호출 1: get_weather({"city": "강릉"})
👁 관찰: {"city": "강릉", "temperature": 16.8, "condition": "맑음", "humidity": 50, "wind_kmh": 3.6, "source": "sample (offline)"}
✅ 최종 답: [등산 안내 비서] 강릉의 현재 날씨는 맑음, 기온 16.8°C 입니다.
Q: 강릉 날씨 알려줘
A: [등산 안내 비서] 강릉의 현재 날씨는 맑음, 기온 16.8°C 입니다.
도구: ['get_weather']

🔧 도구 호출 1: now({})
👁 관찰: {"now": "2026-10-05 09:30", "weekday": "월요일"}
✅ 최종 답: [등산 안내 비서] 지금은 2026-10-05 09:30 입니다.
Q: 지금 몇 시야?
A: [등산 안내 비서] 지금은 2026-10-05 09:30 입니다.
도구: ['now']
` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: '프로젝트 ①: 날씨 · 검색 비서 에이전트', subtitle: '요구사항 → 도구 테스트 → 조립 → 첫 실행', notes: '<p>첫 프로젝트 차시입니다. Part 2~3 의 부품(역할 · 도구 · 기억 · 루프)을 모두 쓴다는 점을 강조하고, 오늘은 “도구부터 검사하고 조립한다”는 엔지니어링 순서를 체험한다고 안내합니다.</p><p>💬 발문: “챗봇에게 ‘지금 부산 날씨’를 물으면 왜 못 맞힐까요?” → 학습 시점 이후 정보를 모른다 → 도구가 필요하다.</p><p>⏱ 도입 5분</p>' },
          { layout: 'bullets', title: '오늘 만들 것', lead: '“내일 부산 날씨 알려주고 우산이 필요한지 말해 줘”', bullets: ['🌤️ 날씨 — Open-Meteo 무료 API (키 불필요)', '📚 검색 — 위키백과 요약', '🕒 현재 시각 · 🧮 계산 (섭씨 → 화씨)', '👕 옷차림 추천 — 우리가 만드는 규칙 도구', '🎭 친절한 비서 페르소나 + 🔁 대화 기억'],
            notes: '<p>요구사항 표(표 11-1)를 화면에 띄우거나 칠판에 F1~F4, N1~N3 으로 적습니다. 학생에게 “우리 비서가 꼭 해야 하는 것 3가지”를 먼저 말하게 한 뒤 표와 비교합니다.</p><p>비기능 요구사항(키 없이 동작 · 실패해도 멈추지 않음 · 기억)이 2교시 주제라고 예고합니다.</p>' },
          { layout: 'diagram', title: '요구사항: 질문 → 최신 정보 → 요약 답변', html: FIG_REQ, caption: 'LLM 이 모르는 “지금” 정보를 도구가 채운다',
            notes: '<p>세 단계 중 ②가 에이전트의 존재 이유입니다. ③의 “근거 있음”은 13차시 평가 · 안전과 연결됩니다.</p><p>💬 발문: “사용자 질문 하나에 요구가 몇 개 들어 있나요?” → 날씨 + 우산 판단 = 2개. 그래서 도구 + 판단이 모두 필요.</p>' },
          { layout: 'diagram', title: '아키텍처: 루프 하나, 도구 넷', html: FIG_ARCH, caption: '도구 결과(JSON)는 “관찰”로 LLM 에 돌아간다',
            notes: '<p>04차시 도구 호출 루프 그림과 같은 구조임을 상기시킵니다. 새로운 점은 (1) 도구가 넷 (2) 페르소나 (3) 메모리가 모두 들어간다는 것.</p><p>오개념: “LLM 이 인터넷에 접속한다” → 아니다, 파이썬 도구 함수가 접속하고 LLM 은 결과 텍스트만 본다.</p>' },
          { layout: 'table', title: '도구 목록', head: ['도구', '하는 일', '출처', '키'], rows: [
            ['get_weather(city)', '현재 기온 · 상태 · 습도 · 풍속', 'Open-Meteo', '불필요'],
            ['wiki_search(query)', '제목 · 요약 · URL', '위키백과', '불필요'],
            ['now()', '날짜 · 시각 · 요일', 'datetime', '불필요'],
            ['calculator(expr)', '사칙연산 · sqrt · %', '안전한 eval', '불필요'],
            ['recommend_outfit(t)', '기온 → 옷차림', '우리 코드', '불필요']
          ], lead: '모두 키 없이 쓸 수 있는 도구로 구성', notes: '<p>“키 불필요”를 강조합니다. 실제 서비스에서는 OpenWeatherMap · Tavily 처럼 키가 필요한 API 가 흔하며, Colab 에서 그 방식을 봅니다.</p><p>네트워크가 없을 때 예시 데이터로 대체된다는 점도 안내(검증 · 오프라인 수업 대비).</p>' },
          { layout: 'code', title: '도구 단독 테스트 — 에이전트보다 먼저', code: `import agentlab as al

for city in ['서울', '부산', 'Tokyo']:
    print(city, '→', al.get_weather(city))

r = al.get_weather('제주')
print('키 목록:', list(r.keys()))
print(al.wiki_search('전기차')['title'])
print(al.now())
print(al.calculator('21.0 * 9/5 + 32'))
print(al.calculator('10 / 0'))          # error 키로 돌아온다
print(al.get_weather.schema()['description'])`, points: ['LLM 없이 · 비용 0 으로 결과 형식 확인', '실패는 예외가 아니라 <code>{\'error\': …}</code>', '<code>schema()</code> 의 설명이 곧 프롬프트'],
            notes: '<p>▶ 실행 후 결과 키(temperature, condition …)를 가리키며 “에이전트는 이 키로 문장을 만든다”고 설명합니다.</p><p>브라우저에서는 실제 API 가 호출되어 source 가 open-meteo.com 으로 바뀝니다. 학교 네트워크가 막혀 있으면 sample (offline) 이 나올 수 있다고 미리 말해 둡니다.</p>' },
          { layout: 'diagram', title: '순서: 도구 → 스키마 → 에이전트', html: FIG_TEST, caption: '문제가 생기면 1단계로 돌아간다',
            notes: '<p>디버깅 습관을 가르치는 슬라이드. “에이전트가 이상하다”는 보고의 80% 는 도구 결과가 이상하거나 설명이 모호한 경우라고 경험을 공유합니다.</p>' },
          { layout: 'code', title: '커스텀 도구: 옷차림 추천', code: `import agentlab as al

@al.tool
def recommend_outfit(temperature: float) -> dict:
    """기온에 맞는 옷차림을 추천한다
    temperature: 섭씨 기온 (숫자)
    """
    t = float(temperature)
    if t >= 28:   tip = '반팔과 반바지, 모자'
    elif t >= 20: tip = '얇은 긴팔 또는 반팔'
    elif t >= 12: tip = '가벼운 재킷이나 가디건'
    elif t >= 5:  tip = '코트와 니트'
    else:         tip = '두꺼운 패딩, 목도리'
    return {'temperature': t, 'outfit': tip}

for t in [31, 18.4, 7, -3]:
    print(t, '→', recommend_outfit(t)['outfit'])
print(recommend_outfit.call({'temperature': '추움'}))`, points: ['순수 파이썬 규칙 = 항상 같은 답', 'LLM 은 “언제 부를지”만 판단', '잘못된 인자도 error 로 안전하게'],
            notes: '<p>경계값을 즉석에서 바꿔 다시 실행해 보입니다. 💬 “비가 오면?” → 조건 매개변수를 하나 더 받는 확장을 실습 과제로 제안.</p><p>학생들이 docstring 을 생략하는 실수가 많습니다 — schema() 를 출력해 설명이 비는 것을 보여 주면 효과적입니다.</p>' },
          { layout: 'code', title: '페르소나: 같은 질문, 다른 시스템 프롬프트', code: `import agentlab as al

llm = al.LLM()
ASSISTANT = """당신은 친절한 날씨 비서입니다.
원칙: 도구 결과를 근거로만 답하고, 모르면 모른다고 말합니다. 두 문장 이내."""
BRIEF = '당신은 간결한 기상 캐스터입니다. 숫자 위주로 한 문장으로만 답합니다.'

for name, system in [('비서', ASSISTANT), ('캐스터', BRIEF)]:
    print(name, '|', llm.ask('안녕하세요, 자기소개 해주세요', system_prompt=system))
    print(name, '|', llm.ask('오늘 뭘 입으면 좋을까요?', system_prompt=system))`, points: ['역할 · 말투 · 원칙을 한 곳에', '모의 LLM 은 <code>[역할]</code> 접두어로 표시', '도구가 없으면 옷차림에 답 못 함 → 다음 슬라이드'],
            notes: '<p>▶ 실행 → 접두어가 바뀌는 것을 확인. 키가 있는 학생은 실제 모델의 말투 차이를 발표하게 합니다.</p><p>“원칙” 세 줄(근거만 · 모르면 모른다 · 짧게)은 13차시 안전과 연결되는 복선입니다.</p>' },
          { layout: 'code', title: '조립: 첫 번째 비서 실행', code: `import agentlab as al

SYSTEM = """당신은 친절한 날씨 비서입니다.
원칙: 도구 결과를 근거로만 답하고, 모르면 모른다고 말합니다. 두 문장 이내.
비가 오면 우산을, 기온이 낮으면 따뜻한 옷을 권합니다."""
llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.wiki_search, al.now, al.calculator],
                 system=SYSTEM, verbose=True)

print(agent.run('내일 부산 날씨 알려주고 우산이 필요한지 말해줘'))
agent.trace()
print('도구:', [s.data['name'] for s in agent.steps if s.kind == 'tool'])
print('LLM 호출:', llm.calls, '토큰:', llm.total_usage.total_tokens)`, points: ['🔧 호출 → 👁 관찰 → ✅ 답 두 바퀴', '<code>trace()</code> · <code>steps</code> 로 복기', '호출 횟수 · 토큰 = 비용'],
            notes: '<p>▶ 실행 → 결과 창의 🔧 👁 ✅ 를 가리키며 루프를 설명. 💬 “LLM 호출이 왜 2번일까?” → 도구 요청 1번 + 최종 답 1번.</p><p>질문을 “광주에 비 와?” 로 바꾸면 모의 LLM 도 “우산을 챙기세요”를 덧붙입니다(예시 데이터에서 광주는 비).</p>' },
          { layout: 'code', title: '두 도구 연쇄: 날씨 → 옷차림 (대본)', code: `import agentlab as al

@al.tool
def recommend_outfit(temperature: float) -> dict:
    """기온에 맞는 옷차림을 추천한다
    temperature: 섭씨 기온
    """
    t = float(temperature)
    return {'outfit': '반팔' if t >= 24 else '가벼운 재킷' if t >= 12 else '두꺼운 외투'}

script = al.LLM(mock_responses=[
    al.Response('', [al.ToolCall('get_weather', {'city': '서울'})]),
    al.Response('', [al.ToolCall('recommend_outfit', {'temperature': 18.4})]),
    '서울은 맑고 18.4°C 입니다. 가벼운 재킷을 추천합니다.'])
agent = al.Agent(script, tools=[al.get_weather, recommend_outfit], verbose=True)
print(agent.run('서울 날씨에 맞는 옷차림 알려줘'))`, points: ['1단계 관찰값 → 2단계 인자', '모의 LLM 은 도구를 하나만 고름 → 대본', '🔑 키가 있으면 실제 모델이 스스로 연쇄'],
            notes: '<p>대본(mock_responses)의 의미를 분명히: “LLM 이 이렇게 답했다고 치자”. 실제 모델에서는 대본이 무시됩니다.</p><p>💬 “대본 2번째 줄의 18.4 는 어디서 왔나?” → 1단계 관찰. 실제 모델은 관찰값을 읽어 스스로 넣는다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[2].q, options: QUIZ1[2].options, answer: QUIZ1[2].answer, explain: QUIZ1[2].explain, notes: '<p>schema() 출력을 다시 보여 주며 정답 확인. docstring 을 빠뜨린 도구의 스키마와 비교하면 좋습니다.</p>' },
          { layout: 'practice', title: '실습 11-1. 체감온도 도구', desc: '<p>기온 − 0.2 × 풍속 (소수점 한 자리) 을 돌려주는 <code>feels_like</code> 도구를 완성하세요.</p>',
            starter: `import agentlab as al

@al.tool
def feels_like(temperature: float, wind_kmh: float) -> dict:
    """기온과 풍속으로 체감온도를 계산한다
    temperature: 섭씨 기온
    wind_kmh: 풍속 (km/h)
    """
    # TODO
    return {'feels_like': None}

print(feels_like(18.4, 2.1))
print(feels_like(5.0, 30.0))`, solution: `import agentlab as al

@al.tool
def feels_like(temperature: float, wind_kmh: float) -> dict:
    """기온과 풍속으로 체감온도를 계산한다
    temperature: 섭씨 기온
    wind_kmh: 풍속 (km/h)
    """
    return {'feels_like': round(float(temperature) - 0.2 * float(wind_kmh), 1)}

print(feels_like(18.4, 2.1))
print(feels_like(5.0, 30.0))`, notes: '<p>5분. 빨리 끝낸 학생은 실습 11-2(페르소나) 로. 매개변수가 둘인 도구의 schema() 를 출력하게 해 required 목록을 확인시킵니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['요구사항(기능 · 비기능) → 아키텍처(루프 + 도구) 순서로 설계', '<b>도구 단독 테스트 → 스키마 → 에이전트</b> — 디버깅의 80% 를 아낀다', '커스텀 도구 = 순수 파이썬 + docstring(프롬프트)', '페르소나 = 역할 · 말투 · 원칙 / <code>trace()</code> 로 루프 복기', '다음 교시: 대화 기억 · 오류 처리 · 연쇄 · 저장 · CLI · 체크리스트'],
            notes: '<p>⏱ 정리 3분. 다음 교시에서 비기능 요구사항(N1~N3)을 채운다고 예고. 과제: 실습 11-2.</p>' }
        ]
      },
      {
        id: 'ag11-2',
        title: '완성과 개선: 대화 · 오류 · 연쇄 · 저장 · CLI',
        minutes: 50,
        goals: ['멀티턴 대화에서 메모리가 하는 일을 설명하고 확인한다', '도구 오류를 멈추지 않고 처리하며, 두 도구를 연쇄해 섭씨를 화씨로 바꾼다', '결과를 파일로 저장하고 CLI 루프를 만들며, 체크리스트로 프로젝트를 점검한다'],
        flow: [['멀티턴 대화', 10], ['오류 처리 · 도구 연쇄', 12], ['저장 · CLI 루프', 13], ['실제 구현 · 체크리스트', 10], ['정리', 5]],
        content: [
          { type: 'p', html: '1교시의 비서는 한 번 묻고 한 번 답했습니다. 실제 비서는 <b>대화가 이어지고</b>, 도구가 가끔 실패하며, 질문 하나에 도구 두 개가 필요하기도 하고, 결과를 남겨 두어야 합니다. 이번 교시에는 이 비기능 요구사항을 하나씩 채워 프로젝트를 완성합니다.' },
          { type: 'h', text: '1. 멀티턴 대화: 비서가 이전 질문을 기억하려면' },
          { type: 'p', html: 'LLM 은 호출이 끝나면 아무것도 기억하지 않습니다. 에이전트가 “기억”하는 것처럼 보이는 이유는 <code>agent.memory</code>(<code>ConversationMemory</code>)에 사용자 · 도구 · 비서 메시지를 모두 쌓아 두고, <b>매 호출마다 시스템 프롬프트와 함께 다시 보내기</b> 때문입니다. 같은 <code>agent</code> 객체로 <code>run()</code> 을 여러 번 부르면 됩니다.' },
          { type: 'figure', html: FIG_MEMORY, caption: '그림 11-5. 메모리에 쌓인 메시지가 매 호출마다 LLM 에 전달됩니다. 05차시의 단기 기억이 그대로 쓰입니다.' },
          { type: 'code', title: '예제 11-7. 같은 에이전트로 세 번 대화하기', nondeterministic: true, code: `import agentlab as al

SYSTEM = '당신은 친절한 날씨 비서입니다. 도구 결과를 근거로 두 문장 이내로 답합니다.'
llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.now], system=SYSTEM)

for q in ['서울 날씨 어때?', '내 이름은 민수야', '내 이름이 뭐지?', '지금 몇 시야?']:
    print('나 :', q)
    print('비서:', agent.run(q))

print('--- 메모리에 쌓인 메시지', len(agent.memory), '개 ---')
agent.memory.show()
agent.reset()
print('reset 후:', len(agent.memory), '개')`,
            expect: `나 : 서울 날씨 어때?
비서: [친절한 날씨 비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.
나 : 내 이름은 민수야
비서: [친절한 날씨 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
나 : 내 이름이 뭐지?
비서: [친절한 날씨 비서] 당신의 이름은 민수 입니다.
나 : 지금 몇 시야?
비서: [친절한 날씨 비서] 지금은 2026-10-05 09:30 입니다.
--- 메모리에 쌓인 메시지 12 개 ---
  user     | 서울 날씨 어때?
  assistant|
  tool     | {"city": "서울", "temperature": 18.4, "condition": "맑음", "humidity": 42,
  assistant| [친절한 날씨 비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.
  user     | 내 이름은 민수야
  assistant| [친절한 날씨 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
  user     | 내 이름이 뭐지?
  assistant| [친절한 날씨 비서] 당신의 이름은 민수 입니다.
  user     | 지금 몇 시야?
  assistant|
  tool     | {"now": "2026-10-05 09:30", "weekday": "월요일"}
  assistant| [친절한 날씨 비서] 지금은 2026-10-05 09:30 입니다.
reset 후: 0 개`,
            desc: '세 번째 질문에 “민수”라고 답한 근거는 메모리의 두 번째 사용자 메시지입니다. <code>memory.show()</code> 를 보면 도구 호출 메시지(빈 assistant + tool)까지 기록되어 있습니다 — 그래서 긴 대화는 토큰이 빠르게 늘고, 05차시의 <code>window</code> 나 <code>SummaryMemory</code> 가 필요해집니다. 모의 LLM 은 “그럼 도쿄는?” 같은 맥락 질문은 처리하지 못하므로 명시적으로 묻습니다.' },
          { type: 'callout', kind: 'info', title: '메모리 길이 제한하기', html: '대화가 길어지면 <code>al.Agent(llm, tools, memory=al.ConversationMemory(window=8))</code> 처럼 최근 8개 메시지만 보내거나, <code>al.SummaryMemory(llm, window=4)</code> 로 오래된 대화를 요약해 압축합니다. 도구 호출 한 번이 메시지 2개(요청 + 결과)를 차지한다는 점을 계산에 넣으세요.' },
          { type: 'h', text: '2. 오류 처리: 실패해도 멈추지 않기' },
          { type: 'p', html: '없는 도시, 끊긴 네트워크, 0 으로 나누기 … 도구는 언젠가 실패합니다. agentlab 의 <code>Tool.call()</code> 은 도구 안에서 난 예외를 잡아 <code>{\'error\': \'…\'}</code> 로 바꿔 LLM 에 보냅니다. LLM 은 이것을 “데이터”로 읽고 사과하거나 되묻습니다. 더 좋은 방법은 <b>도구 안에서 미리 검사</b>해 친절한 오류 메시지를 만드는 것입니다.' },
          { type: 'figure', html: FIG_ERROR, caption: '그림 11-6. 예외 → error 딕셔너리 → LLM 판단. 루프가 멈추지 않는 것이 핵심입니다.' },
          { type: 'code', title: '예제 11-8. 지원하지 않는 도시 — 오류를 데이터로 바꾸기', code: `import agentlab as al

SUPPORTED = ['서울', '부산', '대구', '인천', '광주', '대전', '제주']

@al.tool
def city_weather(city: str) -> dict:
    """지원 도시의 현재 날씨를 알려준다
    city: 도시 이름 (서울 · 부산 · 대구 · 인천 · 광주 · 대전 · 제주)
    """
    city = str(city).strip()
    if not city:
        raise ValueError('도시 이름이 비어 있습니다')
    if city not in SUPPORTED:
        raise ValueError(f'{city} 는 지원하지 않는 도시입니다. 지원: ' + ', '.join(SUPPORTED))
    return al.get_weather(city)

# 1) 도구 단독: 예외가 error 딕셔너리로 바뀐다
print(city_weather.call({'city': '도쿄'}))
print(city_weather.call({'city': ''}))

# 2) 에이전트: 실패해도 루프가 멈추지 않고 LLM 이 안내한다
llm = al.LLM()
agent = al.Agent(llm, tools=[city_weather, al.calculator], system='당신은 친절한 날씨 비서입니다.', verbose=True)
print(agent.run('도쿄 날씨 알려줘'))
print(agent.run('100 / 0 계산해줘'))`,
            expect: `{'error': 'ValueError: 도쿄 는 지원하지 않는 도시입니다. 지원: 서울, 부산, 대구, 인천, 광주, 대전, 제주'}
{'error': 'ValueError: 도시 이름이 비어 있습니다'}
🔧 도구 호출 1: city_weather({"city": "도쿄"})
👁 관찰: {"error": "ValueError: 도쿄 는 지원하지 않는 도시입니다. 지원: 서울, 부산, 대구, 인천, 광주, 대전, 제주"}
✅ 최종 답: [친절한 날씨 비서] city_weather 도구가 실패했습니다: ValueError: 도쿄 는 지원하지 않는 도시입니다. 지원: 서울, 부산, 대구, 인천, 광주, 대전, 제주
[친절한 날씨 비서] city_weather 도구가 실패했습니다: ValueError: 도쿄 는 지원하지 않는 도시입니다. 지원: 서울, 부산, 대구, 인천, 광주, 대전, 제주
🔧 도구 호출 1: calculator({"expression": "100 / 0"})
👁 관찰: {"error": "0 으로 나눌 수 없습니다", "expression": "100 / 0"}
✅ 최종 답: [친절한 날씨 비서] calculator 도구가 실패했습니다: 0 으로 나눌 수 없습니다
[친절한 날씨 비서] calculator 도구가 실패했습니다: 0 으로 나눌 수 없습니다`,
            desc: '오류 메시지에 <b>지원 목록</b>을 넣어 두면 실제 모델은 “도쿄는 지원하지 않습니다. 서울이나 부산은 어떠세요?” 처럼 되묻습니다 — 오류 메시지도 LLM 에게 주는 프롬프트입니다. 모의 LLM 은 “도구가 실패했습니다: …” 로 그대로 전달합니다. 예시 출력은 모의 LLM 기준입니다.' },
          { type: 'h', text: '3. 여러 도구 연쇄: 날씨 + 계산' },
          { type: 'p', html: '“부산 기온을 화씨로 알려줘” 는 도구 두 개가 순서대로 필요합니다. 먼저 <code>get_weather</code> 로 섭씨 기온을 얻고, 그 값을 <code>calculator</code> 의 식에 넣어야 합니다. 루프가 두 바퀴 돌고, 1바퀴의 관찰값이 2바퀴의 인자가 됩니다. 파이썬으로 손수 연쇄해 본 뒤, 에이전트가 같은 일을 하도록 대본으로 재현합니다.' },
          { type: 'figure', html: FIG_CHAIN, caption: '그림 11-7. 관찰값(21.0)이 다음 도구의 인자로 들어가는 연쇄 호출.' },
          { type: 'code', title: '예제 11-9. 섭씨 → 화씨: 손으로 연쇄한 뒤 에이전트로 재현', nondeterministic: true, code: `import agentlab as al

# 1) 파이썬으로 직접 연쇄 — 에이전트가 할 일을 먼저 손으로
w = al.get_weather('부산')
c = w['temperature']
f = al.calculator(f'{c} * 9/5 + 32')['result']
print(f"손으로: 부산 {c}°C = {f}°F ({w['condition']})")

# 2) 에이전트로 — 실제 모델은 스스로 두 바퀴를 돈다. 모의 LLM 은 대본으로 재현
script = al.LLM(mock_responses=[
    al.Response('', [al.ToolCall('get_weather', {'city': '부산'})]),
    al.Response('', [al.ToolCall('calculator', {'expression': f'{c} * 9/5 + 32'})]),
    f'부산은 현재 {w["condition"]}, {c}°C 이며 화씨로는 {f}°F 입니다.',
])
agent = al.Agent(script, tools=[al.get_weather, al.calculator],
                 system='당신은 친절한 날씨 비서입니다.', verbose=True)
print(agent.run('부산 기온을 화씨로 알려줘'))
agent.trace()`,
            expect: `손으로: 부산 21.0°C = 69.8°F (구름 조금)
🔧 도구 호출 1: get_weather({"city": "부산"})
👁 관찰: {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3, "source": "sample (offline)"}
🔧 도구 호출 2: calculator({"expression": "21.0 * 9/5 + 32"})
👁 관찰: {"expression": "21.0 * 9/5 + 32", "result": 69.8}
✅ 최종 답: 부산은 현재 구름 조금, 21.0°C 이며 화씨로는 69.8°F 입니다.
부산은 현재 구름 조금, 21.0°C 이며 화씨로는 69.8°F 입니다.
 1. 🔧 get_weather({"city": "부산"})
 2. 👁 {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3, "s…(생략)
 3. 🔧 calculator({"expression": "21.0 * 9/5 + 32"})
 4. 👁 {"expression": "21.0 * 9/5 + 32", "result": 69.8}
 5. ✅ 부산은 현재 구름 조금, 21.0°C 이며 화씨로는 69.8°F 입니다.`,
            desc: '“손으로” 버전이 곧 에이전트가 따라야 할 정답 경로입니다. 복잡한 요청을 설계할 때는 이렇게 <b>파이썬으로 먼저 연쇄를 써 보고</b>, 그 단계가 도구 설명만으로 LLM 에게 전달되는지 확인합니다. 브라우저에서는 실제 날씨 값이 대본에 들어가므로 숫자가 달라집니다.' },
          { type: 'h', text: '4. 결과를 파일로 저장하기' },
          { type: 'p', html: '비서의 답을 모아 <b>보고서 파일</b>로 남기면 나중에 다시 보거나 다른 프로그램에 넘길 수 있습니다. <code>al.write_file</code> 을 도구로 에이전트에게 맡길 수도 있지만, 저장 형식을 우리가 정확히 통제하고 싶을 때는 파이썬에서 직접 쓰는 편이 안전합니다. 두 방식을 모두 봅니다.' },
          { type: 'code', title: '예제 11-10. 여러 도시 날씨 보고서를 마크다운으로 저장', nondeterministic: true, code: `import agentlab as al

SYSTEM = '당신은 친절한 날씨 비서입니다. 도구 결과를 근거로 한 문장으로 답합니다.'
llm = al.LLM()

lines = ['# 오늘의 날씨 보고서', '', '| 도시 | 비서의 답 |', '|---|---|']
for city in ['서울', '부산', '제주']:
    agent = al.Agent(llm, tools=[al.get_weather], system=SYSTEM)   # 도시마다 새 대화
    answer = agent.run(f'{city} 날씨 알려줘')
    lines.append(f'| {city} | {answer} |')

# 1) 파이썬에서 직접 저장 — 형식을 우리가 통제
report = '\\n'.join(lines)
print(al.write_file('weather_report.md', report))

# 2) 에이전트에게 메모 저장을 맡기기 — 도구 write_file / read_file
memo_agent = al.Agent(llm, tools=[al.write_file, al.read_file], system=SYSTEM, verbose=True)
memo_agent.run('"내일 오전 10시 팀 회의" 를 memo.txt 에 저장해줘')
print(memo_agent.run('memo.txt 읽어줘'))

print('--- weather_report.md ---')
print(al.read_file('weather_report.md')['content'])`,
            expect: `{'path': 'weather_report.md', 'bytes': 380, 'ok': True}
🔧 도구 호출 1: write_file({"path": "memo.txt", "content": "\\"내일 오전 10시 팀 회의\\" 를 memo.txt 에 저장해줘"})
👁 관찰: {"path": "memo.txt", "bytes": 62, "ok": true}
✅ 최종 답: [친절한 날씨 비서] {"path": "memo.txt", "bytes": 62, "ok": true}
🔧 도구 호출 1: read_file({"path": "memo.txt"})
👁 관찰: {"path": "memo.txt", "content": "\\"내일 오전 10시 팀 회의\\" 를 memo.txt 에 저장해줘"}
✅ 최종 답: [친절한 날씨 비서] {"path": "memo.txt", "content": "\\"내일 오전 10시 팀 회의\\" 를 memo.txt 에 저장해줘"}
[친절한 날씨 비서] {"path": "memo.txt", "content": "\\"내일 오전 10시 팀 회의\\" 를 memo.txt 에 저장해줘"}
--- weather_report.md ---
# 오늘의 날씨 보고서

| 도시 | 비서의 답 |
|---|---|
| 서울 | [친절한 날씨 비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다. |
| 부산 | [친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다. |
| 제주 | [친절한 날씨 비서] 제주의 현재 날씨는 구름 많음, 기온 22.3°C 입니다. |`,
            desc: '도시마다 새 에이전트를 만든 이유는 모의 LLM 이 한 대화에서 같은 도구를 두 번 고르지 않기 때문입니다(실제 모델은 한 에이전트로 계속 물어도 됩니다). 에이전트에게 저장을 맡기면 모의 LLM 은 요청 문장 전체를 내용으로 저장합니다 — 실제 모델은 “내일 오전 10시 팀 회의” 만 추려 저장합니다. 브라우저의 작업 폴더에 파일이 생기므로 다른 예제에서 <code>read_file</code> 로 다시 읽을 수 있습니다.' },
          { type: 'h', text: '5. 간단한 CLI 루프: 진짜 비서처럼 대화하기' },
          { type: 'p', html: '마지막으로 <code>while True</code> 와 <code>input()</code> 으로 <b>대화형 루프</b>를 만듭니다. 같은 <code>agent</code> 객체를 계속 쓰므로 이전 대화가 기억되고, “종료” 또는 빈 입력이면 끝납니다. 브라우저 결과 창은 <code>input()</code> 을 지원하므로 직접 입력해 보세요. 아래 예제는 자동 검증을 위해 입력이 미리 들어 있습니다.' },
          { type: 'figure', html: FIG_CLI, caption: '그림 11-8. CLI 루프. 종료어 검사 → agent.run → 출력 → 반복.' },
          { type: 'code', title: '예제 11-11. 대화형 비서 (입력: 서울 날씨 어때? / 지금 몇 시야? / 종료)', nondeterministic: true, stdin: '서울 날씨 어때?\n지금 몇 시야?\n종료\n', code: `import agentlab as al

SYSTEM = '당신은 친절한 날씨 비서입니다. 도구 결과를 근거로 두 문장 이내로 답합니다.'
llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.wiki_search, al.now, al.calculator], system=SYSTEM)

print('날씨 비서입니다. "종료" 를 입력하면 끝납니다.')
turns = 0
while True:
    q = input('나: ').strip()
    if q in ('종료', 'exit', ''):
        print('비서: 안녕히 가세요! (대화', turns, '번)')
        break
    print('비서:', agent.run(q))
    turns += 1

print('LLM 호출', llm.calls, '번 · 토큰', llm.total_usage.total_tokens)`,
            expect: `날씨 비서입니다. "종료" 를 입력하면 끝납니다.
나: 서울 날씨 어때?
비서: [친절한 날씨 비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.
나: 지금 몇 시야?
비서: [친절한 날씨 비서] 지금은 2026-10-05 09:30 입니다.
나: 종료
비서: 안녕히 가세요! (대화 2 번)
LLM 호출 4 번 · 토큰 270`,
            desc: '입력 줄은 결과 창에 그대로 보입니다. 코드를 편집기에 복사해 실행하면 직접 입력할 수 있습니다. 실제 모델에서는 “그럼 부산은?” 처럼 앞 대화에 기대는 질문도 처리됩니다. 매 턴 토큰이 늘어나는 것을 보고 메모리 제한이 왜 필요한지 다시 생각해 보세요.' },
          { type: 'h', text: '6. 실제 구현: LangChain + DuckDuckGo + OpenWeatherMap' },
          { type: 'p', html: 'Colab 에서는 같은 설계를 실제 프레임워크로 구현합니다. LLM 은 Gemini(무료 키), 검색은 키가 필요 없는 <b>DuckDuckGo</b>, 날씨는 <b>OpenWeatherMap</b>(무료 키 필요, 키가 없으면 Open-Meteo 로 대체) 을 씁니다. 에이전트 루프는 LangGraph 의 <code>create_react_agent</code> 가 만들어 줍니다.' },
          { type: 'figure', html: FIG_REAL, caption: '그림 11-9. agentlab ↔ LangChain 구성 요소 대응. 바뀌는 것은 import 와 도구 구현뿐입니다.' },
          { type: 'code', title: '예제 11-12. (Colab 에서 실행) LangChain 비서 에이전트', run: false, code: `# pip install -q langchain langchain-google-genai langgraph duckduckgo-search requests
import os, requests
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0)

@tool
def get_weather(city: str) -> dict:
    """도시의 현재 날씨(기온 · 상태 · 습도)를 알려준다. city: 도시 이름 (영문 권장, 예: Busan)"""
    key = os.environ.get('OPENWEATHER_API_KEY')
    if key:                       # OpenWeatherMap (무료 키)
        r = requests.get('https://api.openweathermap.org/data/2.5/weather',
                         params={'q': city, 'appid': key, 'units': 'metric', 'lang': 'kr'}, timeout=10).json()
        return {'city': city, 'temperature': r['main']['temp'], 'condition': r['weather'][0]['description'], 'humidity': r['main']['humidity']}
    g = requests.get('https://geocoding-api.open-meteo.com/v1/search', params={'name': city, 'count': 1}, timeout=10).json()['results'][0]
    c = requests.get('https://api.open-meteo.com/v1/forecast', params={'latitude': g['latitude'], 'longitude': g['longitude'],
                     'current': 'temperature_2m,relative_humidity_2m,weather_code'}, timeout=10).json()['current']
    return {'city': city, 'temperature': c['temperature_2m'], 'humidity': c['relative_humidity_2m'], 'weather_code': c['weather_code']}

@tool
def recommend_outfit(temperature: float) -> str:
    """기온(섭씨)에 맞는 옷차림을 추천한다"""
    t = float(temperature)
    return '반팔' if t >= 24 else '가벼운 재킷' if t >= 12 else '두꺼운 외투'

search = DuckDuckGoSearchRun()      # 키 불필요 웹 검색
tools = [get_weather, recommend_outfit, search]

SYSTEM = '당신은 친절한 날씨 비서입니다. 도구 결과를 근거로만 두 문장 이내로 답하고, 모르면 모른다고 합니다.'
agent = create_react_agent(llm, tools, prompt=SYSTEM)

result = agent.invoke({'messages': [('user', '부산 날씨 알려주고 뭘 입을지 추천해줘')]})
for m in result['messages']:
    print(m.type, '|', getattr(m, 'content', '')[:120])`,
            desc: '<code>create_react_agent</code> 가 돌려주는 <code>messages</code> 에는 human → ai(tool_calls) → tool → ai(tool_calls) → tool → ai 순서로 루프 전체가 남습니다. agentlab 의 <code>agent.memory.show()</code> 와 같은 모양입니다. 멀티턴은 <code>checkpointer=MemorySaver()</code> 와 <code>thread_id</code> 로 구현합니다(노트북 참고).' },
          { type: 'colab', title: 'Colab 실습 11 — LangChain 비서 에이전트 완성하기', html: '<p>노트북에서는 ① 도구 단독 테스트(DuckDuckGo · Open-Meteo/OpenWeatherMap) ② <code>create_react_agent</code> 조립 ③ <code>MemorySaver</code> 로 멀티턴 ④ 오류 처리 도구 ⑤ 대화 로그를 마크다운으로 저장 ⑥ CLI 루프까지 같은 순서로 진행합니다. API 키는 Colab 왼쪽 🔑 <b>Secrets</b> 에 <code>GEMINI_API_KEY</code>(필수) · <code>OPENWEATHER_API_KEY</code>(선택) 로 넣고 <code>userdata.get()</code> 으로 읽습니다. ✏️ 실습 문제 4개가 있습니다.</p>' },
          { type: 'h', text: '7. 확장 아이디어와 프로젝트 체크리스트' },
          { type: 'list', items: [
            '<b>📰 뉴스 RSS 도구</b>: <code>https://news.google.com/rss/search?q=키워드&hl=ko</code> 를 읽어 제목 3개를 돌려주는 도구 (Colab: <code>feedparser</code>)',
            '<b>💱 환율 도구</b>: 고정 환율표(수업용) 또는 무료 환율 API 로 “100달러는 원화로?” — 계산기와 연쇄',
            '<b>📅 일정 도구</b>: <code>remember_note</code> 로 약속을 기억하고 <code>now()</code> 와 비교해 “오늘 일정” 알려주기',
            '<b>🌡️ 체감온도 · 미세먼지</b>: 실습 11-1 의 체감온도, Open-Meteo Air Quality API',
            '<b>🗣️ 말투 선택</b>: 시스템 프롬프트를 사용자가 고르게 (친절 / 간결 / 아이용)'
          ] },
          { type: 'table', head: ['#', '체크 항목', '확인 방법'], rows: [
            ['1', '도구 5개(날씨 · 검색 · 시각 · 계산 · 옷차림)가 단독으로 동작하고 오류를 <code>error</code> 로 돌려준다', '예제 11-1 · 11-2 · 11-3'],
            ['2', '시스템 프롬프트에 역할 · 원칙(근거만 · 모르면 모른다 · 짧게)이 있다', '예제 11-4'],
            ['3', '“부산 날씨 알려주고 우산 필요해?” 에 도구를 호출해 근거 있는 답을 한다', '예제 11-5 · trace'],
            ['4', '이전 대화(이름 · 앞선 질문)를 기억한다', '예제 11-7'],
            ['5', '없는 도시 · 0 나누기 같은 실패에 멈추지 않고 안내한다', '예제 11-8'],
            ['6', '섭씨→화씨처럼 두 도구를 연쇄한다', '예제 11-9'],
            ['7', '결과를 파일로 저장하고 다시 읽는다', '예제 11-10'],
            ['8', 'CLI 루프로 여러 번 대화하고 “종료”로 끝난다', '예제 11-11'],
            ['9', 'LLM 호출 횟수 · 토큰을 출력할 수 있다 (비용 의식)', '<code>llm.calls</code> · <code>total_usage</code>'],
            ['10', 'Colab 에서 LangChain 으로 같은 비서가 동작한다', 'Colab 노트북']
          ], caption: '표 11-3. 프로젝트 ① 완성 체크리스트. 10개 중 8개 이상이면 발표 준비 완료입니다.' },
          { type: 'callout', kind: 'more', title: '한 걸음 더: 날씨 “예보” 는 왜 안 되나?', html: '<code>get_weather</code> 는 <b>현재</b> 날씨만 가져옵니다. “내일” 을 제대로 답하려면 Open-Meteo 의 <code>daily=temperature_2m_max,precipitation_probability_max</code> 매개변수로 예보를 받는 도구 <code>get_forecast(city, days)</code> 를 추가해야 합니다. 도구를 하나 더 만드는 것만으로 비서의 능력이 늘어난다는 것이 에이전트 설계의 매력입니다.' },
          { type: 'table', teacher: true, head: ['항목', '내용'], rows: [
            ['수업 운영', '1교시는 전원 같은 코드로 따라 하기, 2교시는 2인 1조로 체크리스트 10개를 채우는 미니 프로젝트. 마지막 10분에 조별 1분 시연(“가장 재미있는 질문과 답”)'],
            ['준비물', '브라우저 실습 페이지(네트워크 허용 여부 확인 — Open-Meteo · 위키백과 도메인), 선택: Gemini 무료 키. 네트워크가 막히면 예시 데이터로 진행 가능'],
            ['자주 막히는 곳', '① docstring 을 빼먹어 schema 설명이 빈 도구 ② 같은 도구를 두 번 묻는 멀티턴(모의 LLM 은 한 번만 고름 → 질문 종류를 바꾸게 함) ③ 파이썬 문자열 안의 따옴표 충돌 ④ while 루프에서 종료어를 안 넣어 무한 대기'],
            ['시간 조절', '늦는 조: 예제 11-9(연쇄)는 설명만 듣고 건너뛰어도 체크리스트 8개 달성 가능. 빠른 조: 확장 아이디어의 환율 도구(실습 11-3)'],
            ['연결', '12차시(팀 에이전트)는 이 비서의 wiki_search 를 조사원 역할에 재사용, 13차시 평가는 이 비서의 agent.steps 를 채점에 사용']
          ], caption: '🧑‍🏫 수업 운영 메모' },
          { type: 'table', teacher: true, head: ['영역 (배점)', '상', '중', '하'], rows: [
            ['설계 (20)', '<b>17~20</b> 요구사항 표와 아키텍처 그림이 있고, 도구 선택 이유(키 불필요 · 역할 분리)를 설명함', '<b>10~16</b> 표 또는 그림 중 하나만 있거나 도구 이유가 모호', '<b>0~9</b> 설계 문서 없이 코드만 있음'],
            ['도구 (25)', '<b>21~25</b> 내장 4개 + 커스텀 1개 이상이 단독 테스트되고 docstring · 오류 처리가 있음', '<b>13~20</b> 커스텀 도구는 있으나 오류 처리나 설명이 부족', '<b>0~12</b> 내장 도구만 사용, 단독 테스트 없음'],
            ['에이전트 (25)', '<b>21~25</b> 페르소나 · 멀티턴 · 연쇄 · 파일 저장 · CLI 가 모두 동작하고 trace 로 설명 가능', '<b>13~20</b> 체크리스트 6~7개 달성', '<b>0~12</b> 단일 질문만 동작'],
            ['품질 · 비용 (15)', '<b>13~15</b> 호출 횟수 · 토큰을 측정해 보고하고 메모리 제한을 적용', '<b>8~12</b> 측정은 했으나 개선 없음', '<b>0~7</b> 측정 없음'],
            ['발표 (15)', '<b>13~15</b> 질문 → 도구 → 답 흐름을 1분 안에 시연하고 실패 사례와 대응을 설명', '<b>8~12</b> 시연은 되나 실패 사례 설명 없음', '<b>0~7</b> 시연 실패 또는 설명 없음']
          ], caption: '🧑‍🏫 프로젝트 ① 평가 루브릭 (100점)' },
          { type: 'callout', teacher: true, kind: 'info', title: '🧑‍🏫 실습 정답 해설', html: '<b>11-1</b> 체감온도: <code>round(t - 0.2*w, 1)</code>. 매개변수 둘인 도구는 <code>required</code> 가 둘인지 schema 로 확인. <b>11-2</b> 페르소나: “당신은 OO입니다” 형식이 아니면 모의 LLM 이 역할을 못 읽음. <b>11-3</b> 환율: 고정 환율표로 결정적 결과, 소수 둘째 자리 반올림. <b>11-4</b> 대화 로그: 각 턴을 <code>- 나: … / - 비서: …</code> 두 줄로 쌓고 마지막에 한 번만 <code>write_file</code>. 학생들이 루프 안에서 매번 파일을 덮어쓰는 실수를 자주 합니다.' }
        ],
        practice: [
          { title: '실습 11-3. 환율 변환 도구 추가하기', level: 2,
            desc: '<p>수업용 고정 환율표 <code>RATES = {\'USD\': 1380.0, \'JPY\': 9.2, \'EUR\': 1490.0}</code> 로 외화 금액을 원화로 바꾸는 도구 <code>to_krw(amount, currency)</code> 를 만드세요. 결과는 <code>{\'krw\': 원화(소수 둘째 자리), \'rate\': 환율}</code>, 모르는 통화는 <code>ValueError</code> 를 내서 <code>error</code> 로 돌아오게 합니다. 단독 테스트 후, 에이전트에 붙여 “100 달러는 원화로 얼마야?” 를 대본(mock_responses)으로 실행하세요.</p>',
            hint: '<code>rate = RATES[currency.upper()]</code> 가 없으면 KeyError → 먼저 <code>if cur not in RATES: raise ValueError(...)</code>. 대본: <code>al.Response(\'\', [al.ToolCall(\'to_krw\', {\'amount\': 100, \'currency\': \'USD\'})])</code> 다음에 최종 문장.',
            starter: `import agentlab as al

RATES = {'USD': 1380.0, 'JPY': 9.2, 'EUR': 1490.0}

@al.tool
def to_krw(amount: float, currency: str) -> dict:
    """외화 금액을 원화(KRW)로 바꾼다
    amount: 금액 (숫자)
    currency: 통화 코드 (USD · JPY · EUR)
    """
    # TODO: 통화 검사 → 환율 곱하기 → {'krw': ..., 'rate': ...}
    return {}

print(to_krw(100, 'USD'))
print(to_krw.call({'amount': 1000, 'currency': 'jpy'}))
print(to_krw.call({'amount': 5, 'currency': 'GBP'}))

# TODO: 대본으로 에이전트 실행
`,
            solution: `import agentlab as al

RATES = {'USD': 1380.0, 'JPY': 9.2, 'EUR': 1490.0}

@al.tool
def to_krw(amount: float, currency: str) -> dict:
    """외화 금액을 원화(KRW)로 바꾼다
    amount: 금액 (숫자)
    currency: 통화 코드 (USD · JPY · EUR)
    """
    cur = str(currency).upper()
    if cur not in RATES:
        raise ValueError(f'{cur} 는 지원하지 않는 통화입니다. 지원: ' + ', '.join(RATES))
    rate = RATES[cur]
    return {'krw': round(float(amount) * rate, 2), 'rate': rate}

print(to_krw(100, 'USD'))
print(to_krw.call({'amount': 1000, 'currency': 'jpy'}))
print(to_krw.call({'amount': 5, 'currency': 'GBP'}))

script = al.LLM(mock_responses=[
    al.Response('', [al.ToolCall('to_krw', {'amount': 100, 'currency': 'USD'})]),
    '100 달러는 약 138,000 원입니다 (환율 1,380원).',
])
agent = al.Agent(script, tools=[to_krw], system='당신은 친절한 비서입니다.', verbose=True)
print(agent.run('100 달러는 원화로 얼마야?'))
`,
            expect: `{'krw': 138000.0, 'rate': 1380.0}
{'krw': 9200.0, 'rate': 9.2}
{'error': 'ValueError: GBP 는 지원하지 않는 통화입니다. 지원: USD, JPY, EUR'}
🔧 도구 호출 1: to_krw({"amount": 100, "currency": "USD"})
👁 관찰: {"krw": 138000.0, "rate": 1380.0}
✅ 최종 답: 100 달러는 약 138,000 원입니다 (환율 1,380원).
100 달러는 약 138,000 원입니다 (환율 1,380원).` },
          { title: '실습 11-4. (도전) 대화 로그를 파일로 남기는 CLI 비서', level: 3, nondeterministic: true, stdin: '부산 날씨 어때?\n지금 몇 시야?\n종료\n',
            desc: '<p>예제 11-11 의 CLI 루프를 고쳐, 대화가 끝나면 모든 턴을 <code>- 나: … / - 비서: …</code> 형식의 마크다운으로 <code>chat_log.md</code> 에 저장하고 다시 읽어 출력하세요. 파일은 루프가 끝난 뒤 <b>한 번만</b> 써야 합니다.</p>',
            hint: '리스트 <code>log</code> 에 두 줄씩 append 하고, break 뒤에 <code>al.write_file(\'chat_log.md\', \'\\n\'.join(log))</code>.',
            starter: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.now], system='당신은 친절한 날씨 비서입니다.')
log = ['# 대화 로그']
while True:
    q = input('나: ').strip()
    if q in ('종료', ''):
        break
    a = agent.run(q)
    print('비서:', a)
    # TODO: log 에 두 줄 추가
# TODO: chat_log.md 로 저장하고 다시 읽어 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.now], system='당신은 친절한 날씨 비서입니다.')
log = ['# 대화 로그']
while True:
    q = input('나: ').strip()
    if q in ('종료', ''):
        break
    a = agent.run(q)
    print('비서:', a)
    log.append('- 나: ' + q)
    log.append('- 비서: ' + a)

print(al.write_file('chat_log.md', '\\n'.join(log)))
print(al.read_file('chat_log.md')['content'])
`,
            expect: `나: 부산 날씨 어때?
비서: [친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
나: 지금 몇 시야?
비서: [친절한 날씨 비서] 지금은 2026-10-05 09:30 입니다.
나: 종료
{'path': 'chat_log.md', 'bytes': 248, 'ok': True}
# 대화 로그
- 나: 부산 날씨 어때?
- 비서: [친절한 날씨 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
- 나: 지금 몇 시야?
- 비서: [친절한 날씨 비서] 지금은 2026-10-05 09:30 입니다.` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '완성과 개선: 대화 · 오류 · 연쇄 · 저장 · CLI', subtitle: '비기능 요구사항을 채워 프로젝트 ① 완성', notes: '<p>2교시. 1교시 비서의 한계(한 번 묻고 끝, 실패하면?) 를 묻고 오늘 채울 다섯 가지를 예고합니다. 2인 1조 구성.</p><p>⏱ 도입 2분</p>' },
          { layout: 'diagram', title: '멀티턴: 메모리가 하는 일', html: FIG_MEMORY, caption: 'LLM 자체는 기억이 없다 — 매번 다시 보여 준다',
            notes: '<p>05차시 복습. 💬 “세 번째 질문에 민수라고 답한 근거는 어디 있나?” → 메모리의 두 번째 user 메시지.</p><p>도구 호출 한 번이 메시지 2개(빈 assistant + tool)를 차지한다는 점을 memory.show() 로 보여 주면 토큰 비용 이야기로 자연스럽게 이어집니다.</p>' },
          { layout: 'code', title: '같은 에이전트로 여러 번 대화', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.now],
                 system='당신은 친절한 날씨 비서입니다. 두 문장 이내로 답합니다.')

for q in ['서울 날씨 어때?', '내 이름은 민수야', '내 이름이 뭐지?', '지금 몇 시야?']:
    print('나 :', q)
    print('비서:', agent.run(q))

print('메시지', len(agent.memory), '개')
agent.memory.show()`, points: ['같은 객체 → 메모리 누적', '<code>memory.show()</code> 로 LLM 이 보는 것 확인', '<code>window</code> · SummaryMemory 로 길이 제한'],
            notes: '<p>▶ 실행. 모의 LLM 은 “그럼 부산은?” 을 못 알아듣는다는 점을 미리 말합니다(키가 있으면 됨).</p><p>주의: 모의 LLM 은 한 대화에서 같은 도구를 두 번 고르지 않으므로 날씨를 두 번 묻는 시연은 피합니다.</p>' },
          { layout: 'diagram', title: '오류 처리: 실패해도 멈추지 않기', html: FIG_ERROR, caption: '예외 → error 딕셔너리 → LLM 판단',
            notes: '<p>💬 “도구가 예외를 던지면 프로그램이 죽어야 할까?” → 아니다, LLM 에게 알려서 사과 · 되묻기 · 다른 도구 선택을 하게 한다.</p><p>오류 메시지에 지원 목록을 넣으면 실제 모델이 대안을 제시한다 — 오류 메시지도 프롬프트.</p>' },
          { layout: 'code', title: '지원하지 않는 도시 — 오류를 데이터로', code: `import agentlab as al

SUPPORTED = ['서울', '부산', '대구', '인천', '광주', '대전', '제주']

@al.tool
def city_weather(city: str) -> dict:
    """지원 도시의 현재 날씨를 알려준다
    city: 도시 이름 (서울 · 부산 · 대구 · 인천 · 광주 · 대전 · 제주)
    """
    if city not in SUPPORTED:
        raise ValueError(f'{city} 는 지원하지 않는 도시입니다. 지원: ' + ', '.join(SUPPORTED))
    return al.get_weather(city)

print(city_weather.call({'city': '도쿄'}))
agent = al.Agent(al.LLM(), tools=[city_weather, al.calculator],
                 system='당신은 친절한 날씨 비서입니다.', verbose=True)
print(agent.run('도쿄 날씨 알려줘'))
print(agent.run('100 / 0 계산해줘'))`, points: ['도구 안에서 미리 검사 → 친절한 메시지', '<code>Tool.call()</code> 이 예외를 포장', '루프는 계속 · LLM 이 안내'],
            notes: '<p>▶ 실행. 두 번째 질문(0 나누기)도 멈추지 않음을 확인. 💬 “오류 메시지를 더 친절하게 바꾸려면?” → 지원 목록 · 예시 추가.</p>' },
          { layout: 'diagram', title: '두 도구 연쇄: 날씨 → 계산', html: FIG_CHAIN, caption: '관찰값이 다음 도구의 인자가 된다',
            notes: '<p>“손으로 먼저 연쇄해 보기”를 강조합니다: 복잡한 요청은 파이썬으로 정답 경로를 써 본 뒤 에이전트가 같은 경로를 가는지 확인.</p>' },
          { layout: 'code', title: '섭씨 → 화씨: 손으로, 그리고 에이전트로', code: `import agentlab as al

w = al.get_weather('부산')
c = w['temperature']
f = al.calculator(f'{c} * 9/5 + 32')['result']
print(f"손으로: 부산 {c}°C = {f}°F")

script = al.LLM(mock_responses=[
    al.Response('', [al.ToolCall('get_weather', {'city': '부산'})]),
    al.Response('', [al.ToolCall('calculator', {'expression': f'{c} * 9/5 + 32'})]),
    f'부산은 {c}°C, 화씨로는 {f}°F 입니다.'])
agent = al.Agent(script, tools=[al.get_weather, al.calculator], verbose=True)
print(agent.run('부산 기온을 화씨로 알려줘'))
agent.trace()`, points: ['루프 두 바퀴 · LLM 판단 세 번', '1단계 관찰 21.0 → 2단계 식', '실제 모델은 대본 없이 스스로'],
            notes: '<p>▶ 실행 후 trace 의 1→3 단계 번호를 가리키며 연쇄를 설명. 키가 있는 학생은 대본을 지우고 실제 모델로 실행해 비교 발표.</p>' },
          { layout: 'code', title: '결과를 파일로: 날씨 보고서', code: `import agentlab as al

llm = al.LLM()
lines = ['# 오늘의 날씨 보고서', '', '| 도시 | 비서의 답 |', '|---|---|']
for city in ['서울', '부산', '제주']:
    agent = al.Agent(llm, tools=[al.get_weather], system='당신은 친절한 날씨 비서입니다.')
    lines.append(f'| {city} | {agent.run(f"{city} 날씨 알려줘")} |')

print(al.write_file('weather_report.md', '\\n'.join(lines)))
print(al.read_file('weather_report.md')['content'])`, points: ['형식은 파이썬이 통제', '에이전트에게 맡기려면 <code>write_file</code> 도구', '작업 폴더에 파일 생성 → 다시 읽기'],
            notes: '<p>▶ 실행. 💬 “왜 도시마다 새 에이전트를 만들었나?” → 모의 LLM 이 같은 도구를 두 번 고르지 않아서(실제 모델은 한 에이전트로 가능).</p>' },
          { layout: 'diagram', title: 'CLI 루프', html: FIG_CLI, caption: 'while True · 종료어 · 같은 agent 객체',
            notes: '<p>학생이 가장 좋아하는 순간 — 진짜 비서처럼 대화. 종료어를 꼭 넣게 하고(무한 대기 방지), 토큰이 턴마다 늘어나는 것을 출력하게 합니다.</p>' },
          { layout: 'code', title: '대화형 비서', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.wiki_search, al.now, al.calculator],
                 system='당신은 친절한 날씨 비서입니다. 두 문장 이내로 답합니다.')
print('날씨 비서입니다. "종료" 를 입력하면 끝납니다.')
while True:
    q = input('나: ').strip()
    if q in ('종료', 'exit', ''):
        print('비서: 안녕히 가세요!')
        break
    print('비서:', agent.run(q))
print('LLM 호출', llm.calls, '번 · 토큰', llm.total_usage.total_tokens)`, stdin: '광주에 비 와?\n종료\n', points: ['결과 창에서 직접 입력 가능', '같은 agent → 이전 대화 기억', '토큰 증가 = 비용'],
            notes: '<p>슬라이드에서는 입력이 미리 들어 있습니다(광주에 비 와? → 우산 안내). 학생 화면에서는 직접 입력하게 합니다.</p>' },
          { layout: 'diagram', title: '실제 구현: LangChain 으로 옮기기', html: FIG_REAL, caption: 'import 와 도구 구현만 바뀐다',
            notes: '<p>Colab 노트북 구조(도구 테스트 → create_react_agent → MemorySaver → 저장 → CLI)를 설명하고 과제로 안내. OpenWeatherMap 키는 선택(없으면 Open-Meteo).</p>' },
          { layout: 'table', title: '프로젝트 ① 체크리스트', head: ['#', '항목', '확인'], rows: [
            ['1', '도구 5개 단독 동작 + error 반환', '11-1~3'], ['2', '페르소나 · 원칙', '11-4'], ['3', '근거 있는 답 + trace', '11-5'],
            ['4', '멀티턴 기억', '11-7'], ['5', '오류에도 계속', '11-8'], ['6', '두 도구 연쇄', '11-9'],
            ['7', '파일 저장 · 읽기', '11-10'], ['8', 'CLI 루프', '11-11'], ['9', '호출 · 토큰 측정', 'llm.calls'], ['10', 'Colab LangChain', '노트북']
          ], lead: '8개 이상이면 발표 준비 완료', notes: '<p>조별로 체크리스트를 채우게 하고 마지막 10분에 1분 시연. 루브릭(교사용 본문)을 미리 공개하면 학생들이 “실패 사례 설명”을 준비합니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>예제 11-8 결과를 다시 보여 주며 정답 확인. 13차시 “위험한 도구 가드”와도 연결된다고 예고.</p>' },
          { layout: 'summary', title: '정리', bullets: ['멀티턴 = <b>메모리를 매번 다시 보내기</b> · window 로 제한', '오류 = 예외를 <code>{\'error\'}</code> 데이터로 → LLM 이 안내', '연쇄 = 관찰값이 다음 인자 · 손으로 먼저 써 보기', '저장 · CLI 루프로 “쓸 만한 비서” 완성, 체크리스트 10개', '다음 차시: 역할을 나눈 <b>에이전트 팀</b>으로 마케팅 글 자동화'],
            notes: '<p>⏱ 정리 3분. 과제: Colab 노트북 ✏️ 문제, 실습 11-3 · 11-4. 다음 차시는 CrewAI 팀 프로젝트.</p>' }
        ]
      }
    ]
  });
})();
