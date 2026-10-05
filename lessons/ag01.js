/* 01차시 AI 에이전트란 무엇인가? */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  const FIG_LEVELS = `<svg viewBox="0 0 720 300" role="img" aria-label="단순 프롬프트, 고정 워크플로우, 에이전트의 세 단계 비교">
  ${ARROW('m01a1')}
  <rect x="10" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <rect x="250" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <rect x="490" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <text x="120" y="40" text-anchor="middle" class="tx-b">① 단순 프롬프트</text>
  <text x="120" y="60" text-anchor="middle" class="tx-m">질문 한 번 → 답 한 번</text>
  <rect x="60" y="90" width="120" height="40" rx="8" class="p3s"/><text x="120" y="115" text-anchor="middle" class="tx">사용자 질문</text>
  <rect x="60" y="160" width="120" height="44" rx="8" class="p1"/><text x="120" y="187" text-anchor="middle" class="tx-w">LLM</text>
  <rect x="60" y="234" width="120" height="40" rx="8" class="p5s"/><text x="120" y="259" text-anchor="middle" class="tx">답</text>
  <line x1="120" y1="132" x2="120" y2="156" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <line x1="120" y1="206" x2="120" y2="230" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <text x="360" y="40" text-anchor="middle" class="tx-b">② 고정 워크플로우</text>
  <text x="360" y="60" text-anchor="middle" class="tx-m">사람이 정한 순서대로</text>
  <rect x="300" y="78" width="120" height="34" rx="8" class="p3s"/><text x="360" y="100" text-anchor="middle" class="tx" font-size="12">입력 글</text>
  <rect x="300" y="126" width="120" height="34" rx="8" class="p1"/><text x="360" y="148" text-anchor="middle" class="tx-w" font-size="12">LLM: 요약</text>
  <rect x="300" y="174" width="120" height="34" rx="8" class="p2"/><text x="360" y="196" text-anchor="middle" class="tx-w" font-size="12">코드: 길이 검사</text>
  <rect x="300" y="222" width="120" height="34" rx="8" class="p1"/><text x="360" y="244" text-anchor="middle" class="tx-w" font-size="12">LLM: 번역</text>
  <line x1="360" y1="114" x2="360" y2="122" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <line x1="360" y1="162" x2="360" y2="170" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <line x1="360" y1="210" x2="360" y2="218" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <text x="360" y="276" text-anchor="middle" class="tx-m" font-size="11">순서는 코드에 고정 · 예측 가능</text>
  <text x="600" y="40" text-anchor="middle" class="tx-b">③ 에이전트</text>
  <text x="600" y="60" text-anchor="middle" class="tx-m">LLM 이 다음 행동을 스스로 결정</text>
  <rect x="540" y="84" width="120" height="44" rx="8" class="p1"/><text x="600" y="111" text-anchor="middle" class="tx-w">LLM 판단</text>
  <rect x="540" y="184" width="120" height="44" rx="8" class="p2"/><text x="600" y="211" text-anchor="middle" class="tx-w">도구 실행</text>
  <path d="M665 128 C700 150 700 170 665 184" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <path d="M535 184 C500 170 500 150 535 128" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
  <text x="700" y="160" text-anchor="end" class="tx-m" font-size="11">행동</text>
  <text x="500" y="160" class="tx-m" font-size="11">관찰</text>
  <rect x="540" y="244" width="120" height="34" rx="8" class="p5s"/><text x="600" y="266" text-anchor="middle" class="tx" font-size="12">충분하면 → 답</text>
  <line x1="600" y1="230" x2="600" y2="240" class="ln" stroke-width="2" marker-end="url(#m01a1)"/>
</svg>`;

  const FIG_FOUR = `<svg viewBox="0 0 720 320" role="img" aria-label="에이전트의 4대 요소: 가운데 LLM 을 둘러싼 역할, 도구, 기억, 계획과 반성">
  ${ARROW('m01a2')}
  <circle cx="360" cy="160" r="62" class="p1"/>
  <text x="360" y="152" text-anchor="middle" class="tx-w" font-weight="700" font-size="18">LLM</text>
  <text x="360" y="174" text-anchor="middle" class="tx-w" font-size="12">판단 · 생성</text>
  <rect x="40" y="30" width="200" height="80" rx="14" class="p3s"/>
  <text x="140" y="58" text-anchor="middle" class="tx-b">🎭 역할 (페르소나)</text>
  <text x="140" y="80" text-anchor="middle" class="tx-m">시스템 프롬프트 · 말투 · 규칙</text>
  <text x="140" y="98" text-anchor="middle" class="tx-m" font-size="11">03차시</text>
  <rect x="480" y="30" width="200" height="80" rx="14" class="p2s"/>
  <text x="580" y="58" text-anchor="middle" class="tx-b">🔧 도구 (Tools)</text>
  <text x="580" y="80" text-anchor="middle" class="tx-m">날씨 · 검색 · 계산 · 파일 · API</text>
  <text x="580" y="98" text-anchor="middle" class="tx-m" font-size="11">04차시</text>
  <rect x="40" y="210" width="200" height="80" rx="14" class="p5s"/>
  <text x="140" y="238" text-anchor="middle" class="tx-b">🧠 기억 (Memory)</text>
  <text x="140" y="260" text-anchor="middle" class="tx-m">대화 기록 · 벡터 저장소</text>
  <text x="140" y="278" text-anchor="middle" class="tx-m" font-size="11">05차시</text>
  <rect x="480" y="210" width="200" height="80" rx="14" class="p4s"/>
  <text x="580" y="238" text-anchor="middle" class="tx-b">🗺️ 계획 · 반성</text>
  <text x="580" y="260" text-anchor="middle" class="tx-m">ReAct · Plan-and-Execute · 자기 수정</text>
  <text x="580" y="278" text-anchor="middle" class="tx-m" font-size="11">06차시</text>
  <line x1="240" y1="90" x2="308" y2="130" class="ln" stroke-width="2" marker-end="url(#m01a2)"/>
  <line x1="480" y1="90" x2="412" y2="130" class="ln" stroke-width="2" marker-end="url(#m01a2)"/>
  <line x1="240" y1="230" x2="308" y2="190" class="ln" stroke-width="2" marker-end="url(#m01a2)"/>
  <line x1="480" y1="230" x2="412" y2="190" class="ln" stroke-width="2" marker-end="url(#m01a2)"/>
  <text x="360" y="305" text-anchor="middle" class="tx-m">에이전트 = LLM + 역할 + 도구 + 기억 + 계획/반성</text>
</svg>`;

  const FIG_LOOP = `<svg viewBox="0 0 720 300" role="img" aria-label="에이전트 루프: 생각, 행동, 관찰을 반복하다가 충분하면 최종 답">
  ${ARROW('m01a3')}
  <rect x="20" y="120" width="120" height="60" rx="12" class="p3s"/><text x="80" y="146" text-anchor="middle" class="tx-b">목표 · 질문</text><text x="80" y="166" text-anchor="middle" class="tx-m" font-size="11">“서울 날씨 어때?”</text>
  <rect x="200" y="40" width="150" height="64" rx="12" class="p1"/><text x="275" y="66" text-anchor="middle" class="tx-w" font-weight="700">💭 생각 (Thought)</text><text x="275" y="88" text-anchor="middle" class="tx-w" font-size="11">무엇을 해야 하지?</text>
  <rect x="420" y="40" width="150" height="64" rx="12" class="p2"/><text x="495" y="66" text-anchor="middle" class="tx-w" font-weight="700">🔧 행동 (Action)</text><text x="495" y="88" text-anchor="middle" class="tx-w" font-size="11">get_weather('서울')</text>
  <rect x="420" y="190" width="150" height="64" rx="12" class="p5"/><text x="495" y="216" text-anchor="middle" class="tx-w" font-weight="700">👁 관찰 (Observation)</text><text x="495" y="238" text-anchor="middle" class="tx-w" font-size="11">{"temperature": 18.4, …}</text>
  <rect x="200" y="190" width="150" height="64" rx="12" class="p1"/><text x="275" y="216" text-anchor="middle" class="tx-w" font-weight="700">💭 생각</text><text x="275" y="238" text-anchor="middle" class="tx-w" font-size="11">충분한가? → 답 / 더 행동</text>
  <rect x="600" y="120" width="110" height="60" rx="12" class="p4s"/><text x="655" y="146" text-anchor="middle" class="tx-b">✅ 최종 답</text><text x="655" y="166" text-anchor="middle" class="tx-m" font-size="11">“맑음, 18.4°C”</text>
  <line x1="142" y1="140" x2="196" y2="80" class="ln" stroke-width="2" marker-end="url(#m01a3)"/>
  <line x1="352" y1="72" x2="416" y2="72" class="ln" stroke-width="2" marker-end="url(#m01a3)"/>
  <line x1="495" y1="106" x2="495" y2="186" class="ln" stroke-width="2" marker-end="url(#m01a3)"/>
  <line x1="418" y1="222" x2="354" y2="222" class="ln" stroke-width="2" marker-end="url(#m01a3)"/>
  <path d="M230 188 C200 150 200 130 230 106" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m01a3)"/>
  <text x="190" y="150" text-anchor="end" class="tx-m" font-size="11">더 필요하면 반복</text>
  <line x1="352" y1="222" x2="596" y2="160" class="ln" stroke-width="2" marker-end="url(#m01a3)"/>
  <text x="360" y="290" text-anchor="middle" class="tx-m">LLM 이 “생각 → 행동(도구 선택) → 관찰”을 반복하고, 더 할 일이 없으면 답을 씁니다</text>
</svg>`;

  const FIG_EXAMPLES = `<svg viewBox="0 0 720 260" role="img" aria-label="실생활 에이전트 예 세 가지: 여행 비서, 코딩 에이전트, 고객센터 에이전트와 각각이 쓰는 도구">
  <rect x="10" y="10" width="220" height="240" rx="14" class="p1s"/>
  <rect x="250" y="10" width="220" height="240" rx="14" class="p2s"/>
  <rect x="490" y="10" width="220" height="240" rx="14" class="p3s"/>
  <text x="120" y="42" text-anchor="middle" class="tx-b">✈️ 여행 비서</text>
  <text x="120" y="66" text-anchor="middle" class="tx-m">“다음 주 부산 1박 2일 짜 줘”</text>
  <text x="30" y="100" class="tx">🔧 날씨 API · 지도 · 숙소 검색</text>
  <text x="30" y="126" class="tx">🧠 내 취향(바다 · 매운 음식)</text>
  <text x="30" y="152" class="tx">🗺️ 날짜 → 날씨 → 일정 → 예산</text>
  <text x="30" y="178" class="tx">✅ 일정표 + 메모 저장</text>
  <text x="120" y="230" text-anchor="middle" class="tx-m" font-size="11">11차시 프로젝트</text>
  <text x="360" y="42" text-anchor="middle" class="tx-b">💻 코딩 에이전트</text>
  <text x="360" y="66" text-anchor="middle" class="tx-m">“테스트 실패 원인 찾아 고쳐 줘”</text>
  <text x="270" y="100" class="tx">🔧 파일 읽기 · 쓰기 · 테스트 실행</text>
  <text x="270" y="126" class="tx">🧠 프로젝트 구조 · 이전 수정</text>
  <text x="270" y="152" class="tx">🗺️ 읽기 → 수정 → 테스트 → 반복</text>
  <text x="270" y="178" class="tx">✅ 통과할 때까지 자기 수정</text>
  <text x="360" y="230" text-anchor="middle" class="tx-m" font-size="11">06차시 반성 루프</text>
  <text x="600" y="42" text-anchor="middle" class="tx-b">🎧 고객센터</text>
  <text x="600" y="66" text-anchor="middle" class="tx-m">“주문 환불해 주세요”</text>
  <text x="510" y="100" class="tx">🔧 주문 조회 · 환불 처리 · FAQ 검색</text>
  <text x="510" y="126" class="tx">🧠 고객 정보 · 이전 문의</text>
  <text x="510" y="152" class="tx">🗺️ 조회 → 규정 확인 → 처리</text>
  <text x="510" y="178" class="tx">⚠ 규정 밖이면 사람에게 넘김</text>
  <text x="600" y="230" text-anchor="middle" class="tx-m" font-size="11">13차시 안전 · 배포</text>
</svg>`;

  const FIG_RISKS = `<svg viewBox="0 0 720 230" role="img" aria-label="에이전트의 네 가지 위험과 각각의 안전장치">
  ${ARROW('m01a4')}
  <rect x="10" y="20" width="160" height="80" rx="12" class="p4s"/><text x="90" y="48" text-anchor="middle" class="tx-b">🌀 환각</text><text x="90" y="70" text-anchor="middle" class="tx-m" font-size="11">모르는 걸 지어냄</text><text x="90" y="88" text-anchor="middle" class="tx-m" font-size="11">없는 도구 · 틀린 인자</text>
  <rect x="190" y="20" width="160" height="80" rx="12" class="p4s"/><text x="270" y="48" text-anchor="middle" class="tx-b">💸 비용</text><text x="270" y="70" text-anchor="middle" class="tx-m" font-size="11">작업 하나 = 호출 여러 번</text><text x="270" y="88" text-anchor="middle" class="tx-m" font-size="11">토큰 · 시간 · 한도</text>
  <rect x="370" y="20" width="160" height="80" rx="12" class="p4s"/><text x="450" y="48" text-anchor="middle" class="tx-b">♾️ 무한 루프</text><text x="450" y="70" text-anchor="middle" class="tx-m" font-size="11">같은 도구를 계속 호출</text><text x="450" y="88" text-anchor="middle" class="tx-m" font-size="11">끝낼 줄 모름</text>
  <rect x="550" y="20" width="160" height="80" rx="12" class="p4s"/><text x="630" y="48" text-anchor="middle" class="tx-b">💥 위험한 행동</text><text x="630" y="70" text-anchor="middle" class="tx-m" font-size="11">파일 삭제 · 결제 · 메일</text><text x="630" y="88" text-anchor="middle" class="tx-m" font-size="11">되돌릴 수 없는 도구</text>
  <line x1="90" y1="102" x2="90" y2="136" class="ln" stroke-width="2" marker-end="url(#m01a4)"/>
  <line x1="270" y1="102" x2="270" y2="136" class="ln" stroke-width="2" marker-end="url(#m01a4)"/>
  <line x1="450" y1="102" x2="450" y2="136" class="ln" stroke-width="2" marker-end="url(#m01a4)"/>
  <line x1="630" y1="102" x2="630" y2="136" class="ln" stroke-width="2" marker-end="url(#m01a4)"/>
  <rect x="10" y="140" width="160" height="70" rx="12" class="p2s"/><text x="90" y="166" text-anchor="middle" class="tx-b" font-size="13">도구 결과로만 답</text><text x="90" y="188" text-anchor="middle" class="tx-m" font-size="11">{'error': …} 돌려주기</text>
  <rect x="190" y="140" width="160" height="70" rx="12" class="p2s"/><text x="270" y="166" text-anchor="middle" class="tx-b" font-size="13">llm.calls · usage 추적</text><text x="270" y="188" text-anchor="middle" class="tx-m" font-size="11">예산 넘으면 중단</text>
  <rect x="370" y="140" width="160" height="70" rx="12" class="p2s"/><text x="450" y="166" text-anchor="middle" class="tx-b" font-size="13">max_steps 상한</text><text x="450" y="188" text-anchor="middle" class="tx-m" font-size="11">넘으면 지금까지로 정리</text>
  <rect x="550" y="140" width="160" height="70" rx="12" class="p2s"/><text x="630" y="166" text-anchor="middle" class="tx-b" font-size="13">사람 확인 (HITL)</text><text x="630" y="188" text-anchor="middle" class="tx-m" font-size="11">읽기 전용 도구부터</text>
</svg>`;

  const FIG_HANDLOOP = `<svg viewBox="0 0 720 330" role="img" aria-label="직접 짜는 에이전트 루프의 순서도: 메시지 목록으로 LLM 호출, 도구 호출 요청이 있으면 실행해 tool 메시지로 추가하고 반복, 없으면 최종 답">
  ${ARROW('m01a5')}
  <rect x="20" y="20" width="200" height="50" rx="10" class="p3s"/><text x="120" y="42" text-anchor="middle" class="tx-b" font-size="13">messages = [system, user]</text><text x="120" y="60" text-anchor="middle" class="tx-m" font-size="11">대화 기록 (리스트)</text>
  <rect x="20" y="110" width="200" height="50" rx="10" class="p1"/><text x="120" y="132" text-anchor="middle" class="tx-w" font-size="13">r = llm.chat(messages,</text><text x="120" y="150" text-anchor="middle" class="tx-w" font-size="13">tools=[...])</text>
  <polygon points="120,200 220,240 120,280 20,240" class="p5s"/><text x="120" y="236" text-anchor="middle" class="tx-b" font-size="12">r.tool_calls</text><text x="120" y="254" text-anchor="middle" class="tx-m" font-size="11">있나?</text>
  <line x1="120" y1="72" x2="120" y2="106" class="ln" stroke-width="2" marker-end="url(#m01a5)"/>
  <line x1="120" y1="162" x2="120" y2="196" class="ln" stroke-width="2" marker-end="url(#m01a5)"/>
  <rect x="300" y="190" width="200" height="100" rx="10" class="p2s"/>
  <text x="400" y="212" text-anchor="middle" class="tx-b" font-size="12">예: 도구 실행</text>
  <text x="310" y="234" class="tx" font-family="monospace" font-size="11">messages += [r.message()]</text>
  <text x="310" y="252" class="tx" font-family="monospace" font-size="11">result = tool.call(args)</text>
  <text x="310" y="270" class="tx" font-family="monospace" font-size="11">messages += [tool 메시지]</text>
  <line x1="222" y1="240" x2="296" y2="240" class="ln" stroke-width="2" marker-end="url(#m01a5)"/>
  <text x="258" y="232" text-anchor="middle" class="tx-m" font-size="11">예</text>
  <path d="M500 240 L560 240 L560 135 L224 135" class="ln" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#m01a5)"/>
  <text x="400" y="128" text-anchor="middle" class="tx-m" font-size="11">반복 (최대 max_steps 번)</text>
  <rect x="300" y="40" width="200" height="50" rx="10" class="p4s"/><text x="400" y="62" text-anchor="middle" class="tx-b" font-size="13">아니오: r.content 가 답</text><text x="400" y="80" text-anchor="middle" class="tx-m" font-size="11">루프 종료 (break)</text>
  <line x1="120" y1="282" x2="120" y2="300" class="ln" stroke-width="2"/>
  <path d="M120 300 L640 300 L640 65 L504 65" class="ln" stroke-width="2" fill="none" marker-end="url(#m01a5)"/>
  <text x="640" y="190" text-anchor="middle" class="tx-m" font-size="11">아니오</text>
  <text x="400" y="322" text-anchor="middle" class="tx-m">이 20줄이 al.Agent 가 하는 일의 전부입니다</text>
</svg>`;

  const FIG_MESSAGES = `<svg viewBox="0 0 720 250" role="img" aria-label="루프가 돌 때 messages 리스트가 system, user, assistant(tool_calls), tool, assistant(답) 순으로 자라는 모습">
  ${ARROW('m01a6')}
  <text x="20" y="28" class="tx-b">messages 리스트가 자라는 모습</text>
  <rect x="20" y="44" width="130" height="36" rx="8" class="p3s"/><text x="85" y="67" text-anchor="middle" class="tx" font-size="12">system</text>
  <rect x="20" y="90" width="130" height="36" rx="8" class="p1s"/><text x="85" y="113" text-anchor="middle" class="tx" font-size="12">user: 123 * 45 는?</text>
  <rect x="20" y="136" width="130" height="36" rx="8" class="p2s"/><text x="85" y="159" text-anchor="middle" class="tx" font-size="12">assistant: 🔧 calculator</text>
  <rect x="20" y="182" width="130" height="36" rx="8" class="p5s"/><text x="85" y="205" text-anchor="middle" class="tx" font-size="12">tool: {"result": 5535}</text>
  <text x="210" y="67" class="tx-m" font-size="12">역할 · 규칙 — 처음 한 번</text>
  <text x="210" y="113" class="tx-m" font-size="12">사용자의 질문 — 루프 시작 전에 추가</text>
  <text x="210" y="159" class="tx-m" font-size="12">LLM 의 도구 호출 요청 — r.message() 로 추가 (content 는 비어 있음)</text>
  <text x="210" y="205" class="tx-m" font-size="12">도구 실행 결과 — role='tool', tool_call_id 로 요청과 짝을 맞춤</text>
  <rect x="520" y="44" width="180" height="174" rx="10" class="card-bg"/>
  <text x="610" y="70" text-anchor="middle" class="tx-b" font-size="12">다음 호출 llm.chat(messages)</text>
  <text x="610" y="96" text-anchor="middle" class="tx-m" font-size="11">네 메시지를 전부 보냄</text>
  <text x="610" y="120" text-anchor="middle" class="tx-m" font-size="11">→ LLM 은 tool 결과를 보고</text>
  <text x="610" y="140" text-anchor="middle" class="tx-m" font-size="11">더 할 일이 없으면</text>
  <rect x="540" y="156" width="140" height="36" rx="8" class="p4s"/><text x="610" y="179" text-anchor="middle" class="tx" font-size="12">assistant: 5535 입니다</text>
  <text x="610" y="210" text-anchor="middle" class="tx-m" font-size="11">tool_calls 없음 → 종료</text>
  <text x="360" y="242" text-anchor="middle" class="tx-m">LLM 은 매 호출이 독립적이므로, 기억은 전부 이 리스트에 있습니다 (05차시)</text>
</svg>`;

  const QUIZ1 = [
    { q: '다음 중 “에이전트”에 가장 가까운 것은?', options: ['질문 한 번에 답 한 번을 돌려주는 챗봇', '요약 → 번역 순서가 코드에 고정된 파이프라인', 'LLM 이 도구를 골라 실행하고 결과를 보고 다음 행동을 스스로 정하는 루프', '규칙 기반으로 항상 같은 답을 내는 프로그램'], answer: 2,
      explain: '에이전트의 핵심은 <b>다음 행동을 LLM 이 결정</b>하는 루프입니다. 순서가 코드에 고정되어 있으면 워크플로우, 한 번 묻고 끝나면 단순 프롬프트입니다.' },
    { q: '에이전트의 4대 요소가 <b>아닌</b> 것은?', options: ['도구 (Tools)', '기억 (Memory)', '계획과 반성 (Planning · Reflection)', 'GPU (그래픽 처리 장치)'], answer: 3,
      explain: '에이전트 = LLM + 역할 + <b>도구 + 기억 + 계획/반성</b>. GPU 는 모델을 돌리는 하드웨어일 뿐 에이전트 설계 요소가 아닙니다.' },
    { q: '<code>al.Agent(llm, tools=[al.get_weather]).run(\'서울 날씨 어때?\')</code> 를 실행했을 때 결과 창에 찍히는 순서로 알맞은 것은?', options: ['✅ 최종 답 → 🔧 도구 호출 → 👁 관찰', '🔧 도구 호출 → 👁 관찰 → ✅ 최종 답', '👁 관찰 → 🔧 도구 호출 → ✅ 최종 답', '🔧 도구 호출 → ✅ 최종 답 → 👁 관찰'], answer: 1,
      explain: 'LLM 이 먼저 도구 호출을 요청하고(🔧 행동), 프로그램이 도구를 실행한 결과를 돌려주면(👁 관찰), LLM 이 그 결과로 답을 씁니다(✅).' },
    { q: 'LLM 에게 도구 없이 “서울 날씨 어때?” 라고 물으면 생기는 문제는?', options: ['오류가 나서 프로그램이 멈춘다', '항상 정확한 현재 날씨를 알려 준다', '실시간 정보를 모르므로 모른다고 하거나 그럴듯하게 지어낼(환각) 수 있다', '자동으로 날씨 사이트에 접속한다'], answer: 2,
      explain: 'LLM 은 학습 데이터로만 답하므로 현재 정보가 없습니다. 그래서 <b>도구</b>가 필요하고, 도구 결과로만 답하게 해야 환각을 줄일 수 있습니다.' }
  ];
  const QUIZ2 = [
    { q: '직접 짠 에이전트 루프에서 <code>r.tool_calls</code> 가 <b>비어 있으면</b> 무엇을 뜻할까?', options: ['도구가 없어서 오류', 'LLM 이 더 할 일이 없다고 판단해 최종 답을 썼다 → 루프 종료', '도구 결과가 아직 안 왔다', '다시 처음부터 시작해야 한다'], answer: 1,
      explain: '도구 호출 요청이 없다는 것은 LLM 이 <code>r.content</code> 에 최종 답을 썼다는 뜻입니다. 이때 <code>break</code> 로 루프를 끝냅니다.' },
    { q: '도구 실행 결과를 대화 기록에 넣을 때 메시지의 <code>role</code> 은?', options: ['<code>user</code>', '<code>assistant</code>', '<code>tool</code>', '<code>system</code>'], answer: 2,
      explain: '도구 결과는 <code>{\'role\': \'tool\', \'tool_call_id\': …, \'content\': 결과}</code> 로 넣어 LLM 의 요청과 짝을 맞춥니다. agentlab 의 <code>tool_result()</code> 헬퍼가 이 dict 를 만들어 줍니다.' },
    { q: '<code>max_steps</code> 안전장치가 필요한 가장 큰 이유는?', options: ['코드를 짧게 하려고', 'LLM 이 같은 도구를 끝없이 호출하는 무한 루프를 막고 비용을 제한하려고', '도구가 더 빨리 실행되게 하려고', '메시지 목록을 정렬하려고'], answer: 1,
      explain: 'LLM 은 가끔 끝낼 줄 모르고 도구를 반복 호출합니다. 호출마다 토큰(비용)과 시간이 들기 때문에 <b>단계 수 상한</b>을 두고, 넘으면 지금까지의 정보로 답을 정리하게 합니다.' },
    { q: '도구 함수 안에서 예외가 났을 때 <code>Tool.call()</code> 이 하는 일은?', options: ['프로그램 전체를 멈춘다', '예외를 <code>{\'error\': …}</code> 로 바꿔 돌려주어 LLM 이 상황을 알고 대처하게 한다', '아무 결과도 돌려주지 않는다', '자동으로 다른 도구를 호출한다'], answer: 1,
      explain: '도구 오류로 루프가 죽으면 안 됩니다. 오류를 <b>관찰 결과</b>로 돌려주면 LLM 이 “0 으로 나눌 수 없다” 처럼 설명하거나 다른 방법을 시도할 수 있습니다.' },
    { q: '질문 하나에 에이전트가 도구를 두 번 호출했다. LLM 호출 횟수는 최소 몇 번일까?', options: ['1번', '2번', '3번', '6번'], answer: 2,
      explain: '도구 호출 요청 2번 + 최종 답 1번 = 최소 <b>3번</b>. 에이전트는 작업 하나에 LLM 을 여러 번 부르므로 <code>llm.calls</code> 와 <code>total_usage</code> 로 비용을 추적해야 합니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag01',
    no: '01',
    title: 'AI 에이전트란 무엇인가?',
    subtitle: 'LLM → 워크플로우 → 에이전트 · 4대 요소 · 루프 직접 구현',
    summary: '단순 프롬프트, 고정 워크플로우, 에이전트의 차이를 그림으로 구분하고, <b>에이전트 = LLM + 도구 + 기억 + 계획/반성</b>이라는 큰 그림을 잡습니다. 같은 질문을 LLM 에게만 물었을 때와 에이전트에게 물었을 때를 비교한 뒤, <b>생각 → 행동 → 관찰 루프를 20줄 안팎의 파이썬으로 직접</b> 짜 보며 <code>al.Agent</code> 가 하는 일을 이해합니다.',
    goals: [
      '단순 프롬프트 · 고정 워크플로우 · 에이전트를 “누가 다음 행동을 정하는가”로 구분할 수 있다',
      '에이전트의 4대 요소(역할 · 도구 · 기억 · 계획/반성)와 생각 → 행동 → 관찰 루프를 설명할 수 있다',
      '<code>al.Agent</code> 와 <code>al.ReActAgent</code> 로 같은 질문을 실행하고 <code>trace()</code> 로 단계를 읽을 수 있다',
      '<code>llm.chat(messages, tools=…)</code> 와 <code>r.tool_calls</code> 로 에이전트 루프를 직접 구현할 수 있다',
      '<code>max_steps</code> · 도구 오류 처리 · 호출 횟수 추적 같은 안전장치의 필요성을 설명할 수 있다'
    ],
    sections: [
      {
        id: 'ag01-1',
        title: 'LLM → 워크플로우 → 에이전트',
        minutes: 50,
        goals: ['세 단계(프롬프트 · 워크플로우 · 에이전트)를 구분한다', '4대 요소와 생각 → 행동 → 관찰 루프를 그림으로 설명한다', 'LLM 단독과 에이전트의 답을 코드로 비교한다', '에이전트의 한계와 위험을 안다'],
        flow: [['도입: 챗봇의 한계', 7], ['프롬프트 · 워크플로우 · 에이전트', 12], ['4대 요소와 루프', 10], ['코드로 비교하기', 15], ['퀴즈 · 정리', 6]],
        content: [
          { type: 'p', html: '챗봇에게 “서울 날씨 어때?” 라고 물으면 어떻게 될까요? 모델은 인터넷을 볼 수 없으니 “실시간 정보를 알 수 없습니다” 라고 하거나, 더 나쁘게는 그럴듯한 숫자를 <b>지어냅니다</b>. 사람 비서라면 날씨 앱을 열어 보고 답할 것입니다. <b>AI 에이전트</b>는 바로 그 “앱을 열어 보는” 행동을 LLM 이 스스로 하도록 만든 프로그램입니다.' },
          { type: 'h', text: '단순 프롬프트 → 고정 워크플로우 → 에이전트' },
          { type: 'p', html: 'LLM 을 쓰는 프로그램은 “<b>다음에 무엇을 할지 누가 정하는가</b>”에 따라 세 단계로 나눌 수 있습니다.' },
          { type: 'figure', html: FIG_LEVELS, caption: '그림 1-1. ① 한 번 묻고 끝 ② 사람이 정한 순서를 코드가 실행 ③ LLM 이 다음 행동을 결정하고 결과를 보며 반복.' },
          { type: 'table', head: ['단계', '다음 행동을 정하는 주체', '예', '장점', '단점'], rows: [
            ['① 단순 프롬프트', '없음 (한 번 호출)', '“이 글을 요약해 줘”', '단순 · 싸다', '정보 부족 · 행동 불가'],
            ['② 고정 워크플로우', '<b>사람(코드)</b>', '요약 → 길이 검사 → 번역', '예측 가능 · 디버깅 쉬움', '정해진 순서 밖의 상황에 약함'],
            ['③ 에이전트', '<b>LLM</b>', '“부산 출장 일정 짜 줘” → 날씨 조회 → 숙소 검색 → 메모', '유연 · 복잡한 작업', '비용 · 예측 어려움 · 무한 루프 위험']
          ] },
          { type: 'callout', kind: 'tip', title: '한 줄 정의', html: '<b>AI 에이전트</b> = 목표를 받아 LLM 이 <b>스스로 계획</b>하고, <b>도구를 호출</b>하며, 결과를 <b>관찰</b>해 다음 행동을 정하는 프로그램. 핵심 단어는 <b>“스스로 다음 행동을 정한다”</b>입니다. 워크플로우가 나쁜 것은 아닙니다. 순서가 뻔한 일은 워크플로우가 더 싸고 안정적이며, 실제 서비스는 둘을 섞어 씁니다.' },
          { type: 'h', text: '에이전트의 4대 요소' },
          { type: 'p', html: 'LLM 만으로는 에이전트가 되지 않습니다. LLM 을 가운데 두고 네 가지를 붙여야 합니다. 이 네 가지가 바로 Part 2(03~06차시)의 차례입니다.' },
          { type: 'figure', html: FIG_FOUR, caption: '그림 1-2. 에이전트의 4대 요소. 역할(03차시) · 도구(04차시) · 기억(05차시) · 계획과 반성(06차시).' },
          { type: 'list', items: [
            '<b>🎭 역할(페르소나)</b> — 시스템 프롬프트로 “누구로서, 어떤 규칙으로” 행동할지 정합니다. “당신은 여행 비서입니다. 모르는 정보는 도구로 확인합니다.”',
            '<b>🔧 도구(Tools)</b> — LLM 이 호출할 수 있는 함수. 날씨 API · 검색 · 계산기 · 파일 · 데이터베이스. LLM 은 “어떤 도구를 어떤 인자로” 부를지만 정하고, 실행은 우리 프로그램이 합니다.',
            '<b>🧠 기억(Memory)</b> — 지금까지의 대화(단기)와 오래 보관할 사실(장기 · 벡터 저장소). LLM 은 매 호출이 독립적이라 기억을 우리가 챙겨 넣어야 합니다.',
            '<b>🗺️ 계획과 반성</b> — 큰 목표를 단계로 쪼개고(Plan), 결과를 스스로 검토해 고치는(Reflection) 능력. ReAct · Plan-and-Execute 같은 패턴.'
          ] },
          { type: 'h', text: '생각 → 행동 → 관찰 루프' },
          { type: 'p', html: '네 요소가 실제로 돌아가는 방식은 하나의 <b>루프</b>입니다. LLM 이 <b>생각</b>(무엇을 해야 하지?)하고, 도구를 골라 <b>행동</b>하고, 돌아온 결과를 <b>관찰</b>한 뒤, 충분하면 답을 쓰고 아니면 다시 생각합니다. 이 패턴을 <b>ReAct</b>(Reason + Act)라고 부릅니다.' },
          { type: 'figure', html: FIG_LOOP, caption: '그림 1-3. 에이전트 루프. 결과 창의 🔧(행동) · 👁(관찰) · ✅(답) 표시가 이 그림의 각 단계입니다.' },
          { type: 'h', text: '코드로 비교하기: LLM 혼자 vs 에이전트' },
          { type: 'code', title: '예제 1-1. LLM 에게만 묻기 (도구 없음)', code: `import agentlab as al

llm = al.LLM()
print(llm.ask('서울 날씨 어때?'))
print(llm.ask('1500 * 0.15 는 얼마야?'))`,
            expect: '"서울 날씨 어때?" 에 대한 답변: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계로 나누어 검증하며 진행하는 것입니다.\n"1500 * 0.15 는 얼마야?" 에 대한 답변: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계로 나누어 검증하며 진행하는 것입니다.',
            desc: '모의 LLM 은 날씨도 계산도 모르니 엉뚱한 일반론을 늘어놓습니다. 실제 모델이라면 “실시간 날씨는 알 수 없습니다” 라고 하거나, 계산은 맞힐 때도 틀릴 때도 있습니다. 둘 다 <b>도구가 없어서</b> 생기는 한계입니다. (예시 출력은 모의 LLM 기준)' },
          { type: 'code', title: '예제 1-2. 같은 질문을 에이전트에게 (도구 있음)', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator], verbose=True)
print('답:', agent.run('서울 날씨 어때?'))`,
            nondeterministic: true,
            expect: '🔧 도구 호출 1: get_weather({"city": "서울"})\n👁 관찰: {"city": "서울", "temperature": 18.4, "condition": "맑음", "humidity": 42, "wind_kmh": 2.1, "source": "sample (offline)"}\n✅ 최종 답: 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.\n답: 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.',
            desc: '<code>verbose=True</code> 면 루프의 각 단계가 결과 창에 찍힙니다. 🔧 LLM 이 <code>get_weather</code> 를 고르고 → 👁 프로그램이 실행한 결과(Open-Meteo 실제 날씨)를 돌려주고 → ✅ LLM 이 그 결과로 답을 씁니다. 브라우저에서는 실제 날씨 API 를 부르므로 숫자는 매번 다릅니다.' },
          { type: 'code', title: '예제 1-3. trace() 로 단계 읽기', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator])   # verbose 없이
answer = agent.run('1500 * 0.15 는 얼마야?')
print('답:', answer)
print('--- 밟은 단계 ---')
agent.trace()
print('단계 수:', len(agent.steps), '| LLM 호출:', llm.calls)`,
            expect: '답: 계산 결과는 225 입니다.\n--- 밟은 단계 ---\n 1. 🔧 calculator({"expression": "1500 * 0.15"})\n 2. 👁 {"expression": "1500 * 0.15", "result": 225}\n 3. ✅ 계산 결과는 225 입니다.\n단계 수: 3 | LLM 호출: 2',
            desc: '이번에는 LLM 이 두 도구 중 <code>calculator</code> 를 골랐습니다. 도구 선택은 LLM 의 판단이지 우리가 if 문으로 정한 것이 아닙니다. 질문 하나에 LLM 이 2번(도구 선택 + 답 작성) 호출된 점도 눈여겨보세요.' },
          { type: 'code', title: '예제 1-4. ReAct 텍스트 형식으로 루프 보기', code: `import agentlab as al

llm = al.LLM()
react = al.ReActAgent(llm, tools=[al.calculator, al.now])
answer = react.run('3 더하기 4는?')
print('=== 최종 ===')
print(answer)`,
            expect: 'Thought: "3 더하기 4는?" 에 답하려면 calculator 도구가 필요하다.\nAction: calculator\nAction Input: {"expression": "3 + 4"}\nObservation: {"expression": "3 + 4", "result": 7}\nThought: 관찰 결과로 충분히 답할 수 있다.\nFinal Answer: 계산 결과는 7 입니다.\n=== 최종 ===\n계산 결과는 7 입니다.',
            desc: '<code>ReActAgent</code> 는 함수 호출 API 없이 <b>텍스트</b>로 루프를 돕니다. Thought(생각) → Action(행동) → Observation(관찰) → Final Answer 가 그림 1-3 과 정확히 대응합니다. 초기 에이전트들은 모두 이 형식이었고, 지금은 공급자가 제공하는 함수 호출 기능(<code>al.Agent</code> 방식)을 더 많이 씁니다. 06차시에서 자세히 다룹니다.' },
          { type: 'code', title: '예제 1-5. 고정 워크플로우와의 차이', code: `import agentlab as al

llm = al.LLM()
text = '에이전트는 목표를 받아 스스로 행동한다. 도구를 호출해 정보를 얻는다. 결과를 관찰하고 다음 행동을 정한다.'

# ② 고정 워크플로우: 순서를 사람이 코드로 정한다 (요약 → 길이 검사 → 번역)
summary = llm.ask('다음 글을 한 줄로 요약해줘.\\n' + text)
print('1단계 요약:', summary)
if len(summary) > 10:                       # 코드로 하는 검사
    english = llm.ask(summary + ' 를 영어로 번역해줘')
    print('2단계 번역:', english)

# ③ 에이전트: 어떤 도구를 쓸지 LLM 이 정한다
agent = al.Agent(llm, tools=[al.calculator, al.now])
print('에이전트  :', agent.run('12 * 12 는?'))`,
            expect: '1단계 요약: 요약: 에이전트는 목표를 받아 스스로 행동한다 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.\n2단계 번역: Translation: 에이전트는 목표를 받아 스스로 행동한다 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.\n에이전트  : 계산 결과는 144 입니다.',
            desc: '워크플로우에서는 “요약 다음에 번역” 이라는 순서와 “10자 넘으면” 이라는 조건을 <b>우리가 코드로</b> 썼습니다. 에이전트에서는 계산기를 쓸지 시계를 쓸지 <b>LLM 이</b> 골랐습니다. 두 방식은 경쟁 관계가 아니라 섞어 쓰는 도구입니다.' },
          { type: 'h', text: '실생활의 에이전트' },
          { type: 'figure', html: FIG_EXAMPLES, caption: '그림 1-4. 여행 비서 · 코딩 에이전트 · 고객센터. 모두 “도구 + 기억 + 계획” 의 조합이고, 이 강좌의 프로젝트와 이어집니다.' },
          { type: 'h', text: '한계와 위험' },
          { type: 'p', html: '에이전트는 강력하지만 “LLM 이 다음 행동을 정한다”는 말은 곧 “<b>LLM 이 틀리면 행동도 틀린다</b>”는 뜻입니다. 설계할 때 반드시 안전장치를 함께 넣습니다. 이 차시 2교시와 13차시에서 하나씩 코드로 확인합니다.' },
          { type: 'figure', html: FIG_RISKS, caption: '그림 1-5. 네 가지 위험과 안전장치. 환각 → 도구 결과로만 답하기, 비용 → 호출 추적, 무한 루프 → max_steps, 위험한 행동 → 사람 확인.' },
          { type: 'table', head: ['위험', '증상', '안전장치 (코드)'], rows: [
            ['🌀 환각', '없는 도구 이름 · 틀린 인자 · 지어낸 결과', '도구 결과(관찰)로만 답하게 하는 프롬프트, <code>{\'error\': …}</code> 를 돌려주어 다시 시도'],
            ['💸 비용', '작업 하나에 호출 5~10번, 토큰 수천 개', '<code>llm.calls</code> · <code>llm.total_usage</code> 추적, 예산 초과 시 중단'],
            ['♾️ 무한 루프', '같은 도구를 계속 호출, 끝낼 줄 모름', '<code>max_steps</code> 상한 → 넘으면 지금까지의 정보로 정리'],
            ['💥 위험한 행동', '파일 삭제 · 결제 · 메일 발송을 멋대로', '읽기 전용 도구부터, 되돌릴 수 없는 도구는 사람 확인(Human-in-the-loop)']
          ] },
          { type: 'colab', title: 'Colab 실습 01 — 실제 API 로 LLM 단독 vs 에이전트', html: '<p>Colab 노트북에서 OpenAI 호환 API(Groq · OpenRouter · OpenAI)의 <b>function calling</b> 으로 같은 비교를 해 봅니다. 실제 모델이 “서울 날씨 어때?” 에 도구 없이 뭐라고 답하는지, 도구를 주면 어떻게 달라지는지 직접 확인하세요. 2교시에서 짜는 손 루프도 Colab 에서 실제 모델로 다시 돌립니다.</p>' }
        ],
        practice: [
          { title: '실습 1-1. 에이전트에게 계산 시키기', level: 1,
            desc: '<p><code>al.Agent</code> 에 <code>al.calculator</code> 를 주고 “(12 + 8) * 3 은?” 을 물어보세요. <code>verbose=True</code> 로 루프를 보고, <code>agent.trace()</code> 로 단계를 다시 출력해 보세요.</p>',
            hint: '<code>agent = al.Agent(llm, tools=[al.calculator], verbose=True)</code> → <code>agent.run(...)</code> → <code>agent.trace()</code>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: calculator 도구를 가진 에이전트 만들기 (verbose=True)

# TODO: '(12 + 8) * 3 은?' 을 run 하고 답 출력

# TODO: agent.trace() 로 단계 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator], verbose=True)
print('답:', agent.run('(12 + 8) * 3 은?'))
agent.trace()
`,
            expect: '🔧 도구 호출 1: calculator({"expression": "(12 + 8) * 3"})\n👁 관찰: {"expression": "(12 + 8) * 3", "result": 60}\n✅ 최종 답: 계산 결과는 60 입니다.\n답: 계산 결과는 60 입니다.\n 1. 🔧 calculator({"expression": "(12 + 8) * 3"})\n 2. 👁 {"expression": "(12 + 8) * 3", "result": 60}\n 3. ✅ 계산 결과는 60 입니다.' },
          { title: '실습 1-2. 다른 도시 날씨를 ReAct 형식으로', level: 2,
            desc: '<p><code>al.ReActAgent</code> 에 <code>al.get_weather</code> 와 <code>al.calculator</code> 를 주고 “부산 날씨 어때?” 를 물어보세요. Thought / Action / Observation 이 어떻게 찍히는지 확인하고, 질문을 “파리 날씨 알려줘” 로 바꿔 다시 실행해 보세요.</p>',
            hint: '<code>al.ReActAgent(llm, tools=[al.get_weather, al.calculator]).run(\'부산 날씨 어때?\')</code>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: ReActAgent 만들기 (도구: get_weather, calculator)

# TODO: '부산 날씨 어때?' 실행하고 최종 답 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
react = al.ReActAgent(llm, tools=[al.get_weather, al.calculator])
print('최종:', react.run('부산 날씨 어때?'))
`,
            nondeterministic: true }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'AI 에이전트란 무엇인가?', subtitle: 'LLM → 워크플로우 → 에이전트', notes: '<p>1교시. “챗봇에게 날씨를 물으면?” 으로 시작합니다. 교사 PC 에 실제 키가 있다면 챗봇 답을 실제로 보여 주세요.</p><p>⏱ 도입 7분</p>' },
          { layout: 'bullets', title: '챗봇에게 “서울 날씨 어때?”', lead: '모델은 인터넷을 볼 수 없습니다', bullets: ['😶 “실시간 정보를 알 수 없습니다”', '🌀 또는 그럴듯한 숫자를 <b>지어냄</b> (환각)', '🙋 사람 비서라면? → 날씨 앱을 열어 본다', '🤖 에이전트 = 그 “앱을 열어 보는” 행동을 LLM 이 스스로', '오늘: 그 구조를 그림과 코드로'],
            notes: '<p><b>발문:</b> “사람 비서가 날씨 질문을 받으면 머릿속에서 어떤 순서로 일할까요?” → 생각(앱을 봐야겠다) → 행동(앱 열기) → 관찰(18도 맑음) → 답. 이 순서가 그대로 루프가 됩니다.</p>' },
          { layout: 'diagram', title: '프롬프트 · 워크플로우 · 에이전트', html: FIG_LEVELS, caption: '다음 행동을 누가 정하는가: 없음 / 사람(코드) / LLM',
            notes: '<p>칠판에 세 단어를 적고 각각 “다음 행동을 누가 정하나?” 를 쓰게 합니다. 워크플로우가 나쁜 게 아니라는 점을 꼭 짚습니다(뻔한 순서는 워크플로우가 더 싸고 안정적).</p><p>⏱ 12분</p>' },
          { layout: 'table', title: '세 단계 비교', head: ['단계', '결정 주체', '장점', '단점'], rows: [
            ['단순 프롬프트', '없음', '단순 · 싸다', '정보 부족 · 행동 불가'], ['고정 워크플로우', '사람(코드)', '예측 가능', '정해진 순서 밖에 약함'], ['에이전트', 'LLM', '유연 · 복잡한 작업', '비용 · 무한 루프 위험']
          ], notes: '<p><b>발문:</b> “학교 급식 메뉴를 매일 아침 요약해 알려 주는 봇은 워크플로우일까 에이전트일까?” → 순서가 고정이므로 워크플로우. “사용자가 묻는 아무 질문에 답하는 비서는?” → 에이전트.</p>' },
          { layout: 'diagram', title: '에이전트의 4대 요소', html: FIG_FOUR, caption: '역할(03) · 도구(04) · 기억(05) · 계획과 반성(06)',
            notes: '<p>Part 2 의 로드맵이기도 합니다. 각 요소를 사람 비서에 비유: 역할 = 직무 설명서, 도구 = 앱과 전화, 기억 = 수첩, 계획/반성 = 할 일 목록과 자기 점검.</p>' },
          { layout: 'diagram', title: '생각 → 행동 → 관찰 루프', html: FIG_LOOP, caption: '결과 창의 🔧 👁 ✅ 가 이 그림의 각 단계',
            notes: '<p>ReAct = Reason + Act. 다음 코드 슬라이드에서 이 그림이 결과 창에 그대로 찍히는 것을 보여 줍니다.</p><p>⏱ 10분</p>' },
          { layout: 'code', title: 'LLM 혼자 vs 에이전트', code: `import agentlab as al

llm = al.LLM()
print('LLM 혼자 :', llm.ask('서울 날씨 어때?'))

agent = al.Agent(llm, tools=[al.get_weather, al.calculator], verbose=True)
print('에이전트 :', agent.run('서울 날씨 어때?'))`, points: ['도구 없음 → 모르거나 지어냄', '도구 있음 → 🔧 선택 → 👁 결과 → ✅ 답', '도구 선택은 <b>LLM 의 판단</b>'],
            notes: '<p>▶ 실행 후 결과 창을 위에서부터 읽습니다. “우리가 if 문으로 get_weather 를 고르라고 했나요?” → 아니오, LLM 이 골랐다. 브라우저에서는 실제 Open-Meteo 날씨가 나옵니다.</p>' },
          { layout: 'code', title: 'trace() 와 ReAct 형식', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator])
print(agent.run('1500 * 0.15 는 얼마야?'))
agent.trace()
print('LLM 호출:', llm.calls)

react = al.ReActAgent(llm, tools=[al.calculator])
print(react.run('3 더하기 4는?'))`, points: ['같은 도구 목록, 다른 질문 → 다른 도구', '질문 하나 = LLM 호출 2번', 'ReAct = 텍스트로 Thought/Action/Observation'],
            notes: '<p>호출이 2번인 이유(도구 고르기 + 답 쓰기)를 학생이 설명하게 합니다. 2교시 손 루프의 복선입니다.</p>' },
          { layout: 'diagram', title: '실생활의 에이전트', html: FIG_EXAMPLES, caption: '여행 비서 · 코딩 에이전트 · 고객센터 — 모두 도구 + 기억 + 계획',
            notes: '<p>모둠 활동(5분): 우리 학교 · 일상에서 에이전트로 만들고 싶은 것 하나를 정하고 “필요한 도구 3개”를 적어 발표. 11차시 프로젝트 아이디어로 이어집니다.</p>' },
          { layout: 'diagram', title: '한계와 위험', html: FIG_RISKS, caption: 'LLM 이 틀리면 행동도 틀린다 → 안전장치는 설계의 일부',
            notes: '<p>“에이전트에게 결제 도구를 주면?” 같은 질문으로 사람 확인(HITL)의 필요성을 끌어냅니다. 2교시에서 max_steps · 오류 처리 · 비용 추적을 코드로 봅니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[0].q, options: QUIZ1[0].options, answer: QUIZ1[0].answer, explain: QUIZ1[0].explain, notes: '<p>“누가 다음 행동을 정하는가” 로 판별하게 합니다.</p>' },
          { layout: 'practice', title: '실습 1-1. 에이전트에게 계산 시키기', desc: '<p><code>calculator</code> 도구로 “(12 + 8) * 3 은?” 을 풀게 하고 <code>trace()</code> 로 단계를 보세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: Agent(tools=[al.calculator], verbose=True) 만들고 run → trace`, solution: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator], verbose=True)
print(agent.run('(12 + 8) * 3 은?'))
agent.trace()`, notes: '<p>빨리 끝낸 학생은 도구를 빼고(<code>tools=[]</code>) 같은 질문을 해 보게 합니다 → 모의 LLM 은 일반론, 실제 모델은 암산(가끔 틀림).</p>' },
          { layout: 'summary', title: '정리', bullets: ['에이전트 = LLM 이 <b>다음 행동을 스스로</b> 정하는 루프', '4대 요소: 역할 · 도구 · 기억 · 계획/반성', '생각 → 행동(🔧) → 관찰(👁) → 답(✅)', '도구 없는 LLM 은 모르거나 지어낸다', '위험: 환각 · 비용 · 무한 루프 · 위험한 행동 → 안전장치', '다음 교시: 이 루프를 20줄로 직접 짠다'], notes: '<p>⏱ 정리 6분. 출구 티켓: “에이전트를 한 문장으로 정의하기”.</p>' }
        ]
      },
      {
        id: 'ag01-2',
        title: '에이전트 루프를 직접 짜 보기',
        minutes: 50,
        goals: ['llm.chat(messages, tools=…) 의 응답에서 tool_calls 를 읽는다', 'while/for 루프로 도구 실행과 tool 메시지 추가를 구현한다', 'max_steps · 도구 오류 · 호출 횟수 추적을 넣는다', '4대 요소 로드맵(03~06차시)을 안다'],
        flow: [['루프의 뼈대', 10], ['손으로 구현하기', 18], ['안전장치 · 오류 · 비용', 14], ['로드맵 · 퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '1교시의 <code>al.Agent</code> 는 마법이 아닙니다. 안에서 하는 일은 <b>LLM 호출 → 도구 호출 요청이 있으면 실행 → 결과를 대화에 추가 → 반복</b>, 이것이 전부입니다. 이번 교시에는 그 루프를 20줄 안팎으로 직접 짜 봅니다. 한 번 손으로 짜 보면 LangChain · LangGraph 같은 프레임워크가 무엇을 대신해 주는지 정확히 보입니다.' },
          { type: 'figure', html: FIG_HANDLOOP, caption: '그림 1-6. 직접 짜는 에이전트 루프. 마름모(도구 호출 요청이 있나?)가 루프를 계속할지 끝낼지 정합니다.' },
          { type: 'h', text: '1단계: 도구를 주고 한 번만 호출해 보기' },
          { type: 'p', html: '<code>llm.ask()</code> 는 문자열만 돌려주지만, <code>llm.chat()</code> 은 <b>Response</b> 객체를 돌려줍니다. 여기에 <code>content</code>(텍스트)와 <code>tool_calls</code>(도구 호출 요청 목록)가 들어 있습니다. 도구를 주면 LLM 은 답 대신 “이 도구를 이 인자로 불러 달라”는 요청을 보낼 수 있습니다.' },
          { type: 'code', title: '예제 1-6. 도구 호출 요청 읽기', code: `import agentlab as al

llm = al.LLM()
messages = [al.system('너는 계산을 도와주는 비서다.'), al.user('123 * 45 는 얼마야?')]

r = llm.chat(messages, tools=[al.calculator])      # 도구 목록을 함께 보낸다
print('content   :', repr(r.content))              # 비어 있음!
print('tool_calls:', r.tool_calls)                 # 대신 도구 호출 요청
call = r.tool_calls[0]
print('도구 이름 :', call.name)
print('인자      :', call.args)`,
            expect: 'content   : \'\'\ntool_calls: [ToolCall(calculator, {"expression": "123 * 45"})]\n도구 이름 : calculator\n인자      : {\'expression\': \'123 * 45\'}',
            desc: 'LLM 은 계산을 <b>직접 하지 않고</b> “calculator 를 expression=\'123 * 45\' 로 불러 달라”고 요청했습니다. 실행은 아직 아무도 하지 않았습니다. 이 요청을 실행하는 것은 <b>우리 프로그램의 몫</b>입니다.' },
          { type: 'h', text: '2단계: 도구를 실행하고 결과를 돌려주기' },
          { type: 'p', html: '요청받은 도구를 실행한 뒤, 그 결과를 <code>role=\'tool\'</code> 메시지로 대화 기록에 넣고 LLM 을 <b>다시</b> 호출합니다. 이때 LLM 의 요청(assistant 메시지)도 기록에 넣어야 “어떤 요청에 대한 결과인지”를 <code>tool_call_id</code> 로 짝지을 수 있습니다.' },
          { type: 'figure', html: FIG_MESSAGES, caption: '그림 1-7. 루프가 한 바퀴 돌 때 messages 가 자라는 모습. LLM 은 매 호출이 독립적이므로 기록 전체를 다시 보냅니다.' },
          { type: 'code', title: '예제 1-7. 실행 결과를 tool 메시지로 넣고 다시 호출', code: `import json
import agentlab as al

llm = al.LLM()
messages = [al.system('너는 계산을 도와주는 비서다.'), al.user('123 * 45 는 얼마야?')]
r = llm.chat(messages, tools=[al.calculator])
call = r.tool_calls[0]

result = al.calculator.call(call.args)             # ① 우리 프로그램이 도구 실행
print('도구 결과:', result)
messages.append(r.message())                       # ② LLM 의 요청을 기록에 추가
messages.append({'role': 'tool', 'tool_call_id': call.id,   # ③ 결과를 tool 메시지로
                 'name': call.name, 'content': json.dumps(result, ensure_ascii=False)})

r2 = llm.chat(messages, tools=[al.calculator])     # ④ 다시 호출
print('tool_calls:', r2.tool_calls)                # 이제 비어 있음 → 끝
print('최종 답   :', r2.content)
print('메시지 수 :', len(messages), '| LLM 호출:', llm.calls)`,
            expect: '도구 결과: {\'expression\': \'123 * 45\', \'result\': 5535}\ntool_calls: []\n최종 답   : [계산을 도와주는 비서] 계산 결과는 5535 입니다.\n메시지 수 : 4 | LLM 호출: 2',
            desc: '두 번째 호출에서는 도구 호출 요청이 없고 <code>content</code> 에 답이 들어 있습니다. 이것이 루프를 끝내는 신호입니다. <code>agentlab.llm.tool_result(call.id, call.name, result)</code> 헬퍼가 ③의 dict 를 만들어 주지만, 처음 한 번은 직접 써 보는 것이 구조를 이해하는 데 좋습니다.' },
          { type: 'h', text: '3단계: 루프로 묶기 — 20줄 에이전트' },
          { type: 'code', title: '예제 1-8. 직접 만든 에이전트 루프', code: `import json
import agentlab as al

llm = al.LLM()
registry = {t.name: t for t in [al.calculator, al.now]}     # 이름 → 도구
messages = [al.system('너는 도구를 활용하는 비서다.'), al.user('123 * 45 는 얼마야?')]

for step in range(1, 6):                                     # 최대 5단계
    r = llm.chat(messages, tools=list(registry.values()))
    if not r.tool_calls:                                     # 도구 요청 없음 → 답
        print('✅ 최종 답:', r.content)
        break
    messages.append(r.message())
    for call in r.tool_calls:
        tool = registry.get(call.name)
        result = tool.call(call.args) if tool else {'error': f'{call.name} 도구 없음'}
        print(f'🔧 {step}단계: {call.name}({call.args}) → 👁 {result}')
        messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                         'content': json.dumps(result, ensure_ascii=False)})
print('LLM 호출:', llm.calls, '| 토큰:', llm.total_usage)`,
            expect: '🔧 1단계: calculator({\'expression\': \'123 * 45\'}) → 👁 {\'expression\': \'123 * 45\', \'result\': 5535}\n✅ 최종 답: [도구를 활용하는 비서] 계산 결과는 5535 입니다.\nLLM 호출: 2 | 토큰: Usage(prompt=35, completion=19)',
            desc: '이 코드가 <code>al.Agent.run()</code> 의 핵심입니다. <code>registry</code> 가 이름으로 도구를 찾고(<code>al.ToolRegistry</code> 와 같은 역할), <code>for step in range(1, 6)</code> 이 <code>max_steps</code> 안전장치입니다. 실제 모델로 바꿔도 코드는 한 글자도 바뀌지 않습니다.' },
          { type: 'code', title: '예제 1-9. 함수로 감싸서 여러 질문에 쓰기', code: `import json
import agentlab as al

def run_agent(llm, task, tools, max_steps=5):
    registry = {t.name: t for t in tools}
    messages = [al.system('너는 도구를 활용하는 비서다. 도구 결과로만 답한다.'), al.user(task)]
    for step in range(1, max_steps + 1):
        r = llm.chat(messages, tools=tools)
        if not r.tool_calls:
            return r.content
        messages.append(r.message())
        for call in r.tool_calls:
            result = registry[call.name].call(call.args)
            messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                             'content': json.dumps(result, ensure_ascii=False)})
    return '(단계 초과) 답을 찾지 못했습니다.'

llm = al.LLM()
for q in ['(7 + 8) * 2 는?', '에이전트가 뭐야?', '250 의 20 퍼센트는?']:
    print('Q:', q)
    print('A:', run_agent(llm, q, [al.calculator]))
print('총 호출:', llm.calls)`,
            expect: 'Q: (7 + 8) * 2 는?\nA: [도구를 활용하는 비서] 계산 결과는 30 입니다.\nQ: 에이전트가 뭐야?\nA: [도구를 활용하는 비서] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\nQ: 250 의 20 퍼센트는?\nA: [도구를 활용하는 비서] 계산 결과는 50 입니다.\n총 호출: 5',
            desc: '두 번째 질문은 도구가 필요 없어 LLM 이 바로 답했습니다(호출 1번). 나머지는 도구를 한 번씩 썼습니다(호출 2번씩). 총 5번 — 에이전트의 비용은 이렇게 질문마다 달라집니다.' },
          { type: 'h', text: '안전장치 ①: max_steps — 무한 루프 막기' },
          { type: 'p', html: 'LLM 이 끝낼 줄 모르고 같은 도구를 계속 부르면 어떻게 될까요? 상한이 없으면 토큰(돈)과 시간이 끝없이 나갑니다. <code>al.LLM(mock_responses=…)</code> 로 “도구만 계속 요청하는 고장 난 LLM” 을 흉내 내어 안전장치가 작동하는 모습을 봅시다.' },
          { type: 'code', title: '예제 1-10. 끝낼 줄 모르는 LLM 과 max_steps', code: `import agentlab as al

# 키가 없을 때: 도구 호출 요청만 3번 반복한 뒤 네 번째에 정리하는 "고장 난 LLM"
stuck = al.Response('', [al.ToolCall('now', {})])
llm = al.LLM(mock_responses=[stuck, stuck, stuck, '지금까지의 정보로 정리하면, 현재 시각을 세 번 확인했습니다.'])

agent = al.Agent(llm, tools=[al.now], max_steps=3, verbose=True)
print('답:', agent.run('지금 몇 시야?'))
print('LLM 호출:', llm.calls)`,
            expect: '🔧 도구 호출 1: now({})\n👁 관찰: {"now": "2026-10-05 09:30", "weekday": "월요일"}\n🔧 도구 호출 2: now({})\n👁 관찰: {"now": "2026-10-05 09:30", "weekday": "월요일"}\n🔧 도구 호출 3: now({})\n👁 관찰: {"now": "2026-10-05 09:30", "weekday": "월요일"}\n⚠ 3단계 안에 끝내지 못했습니다\n답: 지금까지의 정보로 정리하면, 현재 시각을 세 번 확인했습니다.\nLLM 호출: 4',
            nondeterministic: true,
            desc: '3단계를 넘기자 <code>al.Agent</code> 가 루프를 끊고 “지금까지의 정보로 최종 답을 정리하라”고 한 번 더 요청했습니다(호출 4번). <code>max_steps</code> 가 없었다면 이 LLM 은 영원히 시계만 봤을 것입니다. 실제 키가 있으면 모의 대사가 아닌 실제 모델이 답하므로 출력이 달라집니다.' },
          { type: 'h', text: '안전장치 ②: 도구 오류를 관찰 결과로 돌려주기' },
          { type: 'p', html: '도구 안에서 예외가 나도 루프가 죽으면 안 됩니다. <code>Tool.call()</code> 은 예외를 <code>{\'error\': …}</code> 로 바꿔 돌려주고, LLM 은 그 오류를 <b>관찰</b>해 사용자에게 설명하거나 다른 방법을 시도합니다.' },
          { type: 'code', title: '예제 1-11. 0 으로 나누기 — 오류도 관찰이다', code: `import agentlab as al

print('직접 호출 :', al.calculator.call({'expression': '10 / 0'}))
print('잘못된 인자:', al.calculator.call({'expr': '1 + 1'}))
print('위험한 식  :', al.calculator.call({'expression': 'import os'}))
print()
llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator], verbose=True)
print('답:', agent.run('10 나누기 0 은?'))`,
            expect: '직접 호출 : {\'error\': \'0 으로 나눌 수 없습니다\', \'expression\': \'10 / 0\'}\n잘못된 인자: {\'error\': "인자 오류: calculator() got an unexpected keyword argument \'expr\'"}\n위험한 식  : {\'error\': \'계산 실패: invalid syntax (<string>, line 1)\', \'expression\': \'import os\'}\n\n🔧 도구 호출 1: calculator({"expression": "10 / 0"})\n👁 관찰: {"error": "0 으로 나눌 수 없습니다", "expression": "10 / 0"}\n✅ 최종 답: calculator 도구가 실패했습니다: 0 으로 나눌 수 없습니다\n답: calculator 도구가 실패했습니다: 0 으로 나눌 수 없습니다',
            desc: '세 가지 오류(0 나누기 · 잘못된 인자 이름 · 허용되지 않는 식)가 모두 예외 대신 <code>dict</code> 로 돌아왔습니다. 에이전트는 멈추지 않고 오류를 설명했습니다. 도구를 직접 만들 때(04차시)도 이 원칙을 지킵니다: <b>예외를 던지지 말고 오류를 돌려줘라</b>.' },
          { type: 'h', text: '안전장치 ③: 비용 추적' },
          { type: 'code', title: '예제 1-12. 호출마다 무슨 일이 있었나 — verbose 와 usage', code: `import agentlab as al

llm = al.LLM()
llm.verbose = True                       # LLM 호출을 하나하나 보여 준다
agent = al.Agent(llm, tools=[al.calculator])
agent.run('99 * 99 는?')
llm.verbose = False
print()
print('호출 횟수 :', llm.calls)
print('입력 토큰 :', llm.total_usage.prompt_tokens)
print('출력 토큰 :', llm.total_usage.completion_tokens)
BUDGET = 1000
left = BUDGET - llm.total_usage.total_tokens
print('예산 1000 토큰 중 남은 토큰:', left, '→', '계속' if left > 0 else '중단')`,
            expect: '  ↗ LLM 호출 #1 (mock/mock-1) — user: \'99 * 99 는?\'\n  ↙ 응답: \'\' 도구호출 [ToolCall(calculator, {"expression": "99 * 99"})]\n  ↗ LLM 호출 #2 (mock/mock-1) — tool: \'{"expression": "99 * 99", "result": 9801}\'\n  ↙ 응답: \'계산 결과는 9801 입니다.\'\n\n호출 횟수 : 2\n입력 토큰 : 20\n출력 토큰 : 14\n예산 1000 토큰 중 남은 토큰: 966 → 계속',
            desc: '<code>llm.verbose = True</code> 는 호출마다 “마지막 메시지가 무엇이었고 응답이 무엇인지”를 보여 줍니다. 두 번째 호출의 입력이 <code>tool</code> 메시지인 것을 확인하세요. 실제 서비스에서는 이렇게 토큰 예산을 정해 두고 넘으면 루프를 끊습니다.' },
          { type: 'h', text: '4대 요소 로드맵' },
          { type: 'p', html: '오늘 짠 루프에는 LLM 과 도구만 있었습니다. 다음 차시부터 나머지 요소를 하나씩 더해 갑니다.' },
          { type: 'table', head: ['차시', '요소', '오늘 루프에서의 위치', '배울 것'], rows: [
            ['02', '(기초) LLM API', '<code>llm.chat(messages)</code>', '메시지 구조 · 시스템 프롬프트 · JSON 출력 · 토큰과 비용'],
            ['03', '🎭 역할', '<code>al.system(\'너는 …\')</code>', '페르소나 설계 · 규칙 · 말투 · 역할별 비교'],
            ['04', '🔧 도구', '<code>tools=[…]</code> · <code>registry</code>', '<code>@al.tool</code> 로 내 함수를 도구로 · 스키마 · 실제 API 연결'],
            ['05', '🧠 기억', '<code>messages</code> 리스트', '대화 창(window) · 요약 메모리 · 벡터 저장소(장기 기억)'],
            ['06', '🗺️ 계획 · 반성', '<code>for step in range(…)</code>', 'ReAct · Plan-and-Execute · 자기 수정 루프']
          ], caption: '오늘의 20줄이 Part 2 전체의 뼈대입니다' },
          { type: 'code', title: '예제 1-13. Colab 에서 실행 — 같은 루프를 실제 API 로 (OpenAI 호환)', run: false, code: `# Groq · OpenRouter · OpenAI 는 모두 같은 "OpenAI 호환" 형식을 씁니다
import json
from openai import OpenAI
from google.colab import userdata

client = OpenAI(api_key=userdata.get('GROQ_API_KEY'), base_url='https://api.groq.com/openai/v1')
MODEL = 'llama-3.3-70b-versatile'

def calculator(expression: str) -> dict:
    return {'expression': expression, 'result': eval(expression, {'__builtins__': {}})}

tools = [{'type': 'function', 'function': {'name': 'calculator', 'description': '수식을 계산한다',
          'parameters': {'type': 'object', 'properties': {'expression': {'type': 'string'}}, 'required': ['expression']}}}]
messages = [{'role': 'system', 'content': '너는 도구를 활용하는 비서다.'}, {'role': 'user', 'content': '123 * 45 는 얼마야?'}]

for step in range(5):
    resp = client.chat.completions.create(model=MODEL, messages=messages, tools=tools)
    msg = resp.choices[0].message
    if not msg.tool_calls:
        print('✅', msg.content); break
    messages.append(msg)
    for tc in msg.tool_calls:
        result = calculator(**json.loads(tc.function.arguments))
        print('🔧', tc.function.name, tc.function.arguments, '→', result)
        messages.append({'role': 'tool', 'tool_call_id': tc.id, 'content': json.dumps(result)})`,
            desc: '구조가 예제 1-8 과 똑같습니다. 다른 점은 도구 스키마를 손으로 쓴다는 것(agentlab 은 <code>@al.tool</code> 이 자동으로 만듭니다)과 응답 객체의 필드 이름뿐입니다. 02차시에서 공급자별 형식 차이를 표로 정리합니다.' },
          { type: 'colab', title: 'Colab 실습 01 — 실제 모델로 손 루프 돌리기', html: '<p>노트북에서 ① 도구 없이 질문 ② function calling 한 번 ③ 손 루프 ④ max_steps 실험을 Groq(또는 OpenAI · OpenRouter) 실제 모델로 해 봅니다. ✏️ 문제: 도구를 하나 더 추가하고(예: 글자 수 세기) 루프가 그 도구를 고르게 만들기.</p>' },
          { type: 'callout', kind: 'info', teacher: true, title: '지도 팁 · 오개념 · 평가', html: '<ul><li><b>핵심 오개념: “LLM 이 도구를 실행한다”</b> → 아닙니다. LLM 은 “이 도구를 이 인자로” 라는 <b>요청(텍스트/JSON)</b>만 만들고, 실행은 우리 파이썬 코드가 합니다. 예제 1-6 에서 <code>content</code> 가 비어 있고 아무것도 실행되지 않았다는 점을 반드시 짚으세요.</li><li>예제 1-7 의 ②(assistant 메시지 추가)를 빼먹으면 실제 API 는 “tool 메시지에 대응하는 tool_call 이 없다”는 오류를 냅니다. 왜 짝을 맞춰야 하는지 그림 1-7 로 설명합니다.</li><li>예제 1-10 은 모의 LLM 전용 시나리오입니다. 키를 넣은 학생은 실제 모델이 한 번에 끝내므로 ⚠ 가 안 나옵니다 → “실제 모델은 똑똑해서 안 걸렸지만, 안전장치는 그래도 필요하다”.</li><li>루브릭(실습 1-3): 루프가 도구 결과로 답한다(2) · max_steps 가 동작한다(1) · 오류를 관찰로 돌려준다(1) · 호출 횟수를 출력한다(1).</li><li>시간이 남으면 <code>py/agentlab/agent.py</code> 의 <code>Agent.run</code> 을 열어 보여 주세요. 학생이 짠 코드와 거의 같습니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 1-3. 내 루프에 호출 횟수와 오류 처리 넣기', level: 2,
            desc: '<p>예제 1-9 의 <code>run_agent</code> 를 고쳐 ① 없는 도구 이름이 오면 <code>{\'error\': \'… 도구 없음\'}</code> 을 돌려주고 ② 끝날 때 <code>f\'(LLM 호출 {n}번)\'</code> 을 답 뒤에 붙이세요. 질문 “10 나누기 0 은?” 과 “(3 + 5) * 4 는?” 으로 확인합니다.</p>',
            hint: '<code>tool = registry.get(call.name)</code> → <code>result = tool.call(call.args) if tool else {\'error\': f\'{call.name} 도구 없음\'}</code>. 호출 횟수는 <code>llm.calls</code> 의 시작값과 끝값 차이.',
            starter: `import json
import agentlab as al

def run_agent(llm, task, tools, max_steps=5):
    registry = {t.name: t for t in tools}
    messages = [al.system('너는 도구를 활용하는 비서다.'), al.user(task)]
    start = llm.calls
    for step in range(max_steps):
        r = llm.chat(messages, tools=tools)
        if not r.tool_calls:
            # TODO: 답 뒤에 ' (LLM 호출 N번)' 붙여서 반환
            return r.content
        messages.append(r.message())
        for call in r.tool_calls:
            # TODO: registry 에 없는 도구면 {'error': ...} 돌려주기
            result = registry[call.name].call(call.args)
            messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                             'content': json.dumps(result, ensure_ascii=False)})
    return '(단계 초과)'

llm = al.LLM()
print(run_agent(llm, '10 나누기 0 은?', [al.calculator]))
print(run_agent(llm, '(3 + 5) * 4 는?', [al.calculator]))
`,
            solution: `import json
import agentlab as al

def run_agent(llm, task, tools, max_steps=5):
    registry = {t.name: t for t in tools}
    messages = [al.system('너는 도구를 활용하는 비서다.'), al.user(task)]
    start = llm.calls
    for step in range(max_steps):
        r = llm.chat(messages, tools=tools)
        if not r.tool_calls:
            return r.content + f' (LLM 호출 {llm.calls - start}번)'
        messages.append(r.message())
        for call in r.tool_calls:
            tool = registry.get(call.name)
            result = tool.call(call.args) if tool else {'error': f'{call.name} 도구 없음'}
            messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                             'content': json.dumps(result, ensure_ascii=False)})
    return '(단계 초과)'

llm = al.LLM()
print(run_agent(llm, '10 나누기 0 은?', [al.calculator]))
print(run_agent(llm, '(3 + 5) * 4 는?', [al.calculator]))
`,
            expect: '[도구를 활용하는 비서] calculator 도구가 실패했습니다: 0 으로 나눌 수 없습니다 (LLM 호출 2번)\n[도구를 활용하는 비서] 계산 결과는 32 입니다. (LLM 호출 2번)' },
          { title: '실습 1-4. (도전) max_steps 실험', level: 3,
            desc: '<p>예제 1-10 의 “고장 난 LLM” 으로 <code>max_steps</code> 를 1, 2, 5 로 바꿔 가며 <code>al.Agent</code> 를 실행하고, 각각 LLM 호출 횟수가 몇 번인지 표로 출력하세요. (매번 <code>al.LLM(mock_responses=…)</code> 을 새로 만들어야 호출 횟수가 0 부터 셉니다)</p>',
            hint: '<code>for n in [1, 2, 5]: llm = al.LLM(mock_responses=[...]); agent = al.Agent(llm, tools=[al.now], max_steps=n); agent.run(...); print(n, llm.calls)</code>',
            starter: `import agentlab as al

stuck = al.Response('', [al.ToolCall('now', {})])
# TODO: max_steps 를 1, 2, 5 로 바꿔 가며 실행하고 'max_steps=N → 호출 M번' 출력
for n in [1, 2, 5]:
    llm = al.LLM(mock_responses=[stuck, stuck, stuck, stuck, stuck, '정리: 시각을 확인했습니다.'])
    pass
`,
            solution: `import agentlab as al

stuck = al.Response('', [al.ToolCall('now', {})])
for n in [1, 2, 5]:
    llm = al.LLM(mock_responses=[stuck, stuck, stuck, stuck, stuck, '정리: 시각을 확인했습니다.'])
    agent = al.Agent(llm, tools=[al.now], max_steps=n)
    answer = agent.run('지금 몇 시야?')
    print(f'max_steps={n} → LLM 호출 {llm.calls}번 | 답: {answer[:30]}')
`,
            nondeterministic: true }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '에이전트 루프를 직접 짜 보기', subtitle: 'llm.chat · tool_calls · tool 메시지 — 20줄 에이전트', notes: '<p>2교시. 목표: “al.Agent 는 마법이 아니다”. 학생이 직접 루프를 짜고, 마지막에 agent.py 와 비교합니다.</p><p>⏱ 뼈대 설명 10분</p>' },
          { layout: 'diagram', title: '루프의 뼈대', html: FIG_HANDLOOP, caption: '호출 → 도구 요청 있나? → 실행 · tool 메시지 추가 → 반복 / 없으면 답',
            notes: '<p>순서도를 손가락으로 따라가며 설명합니다. 마름모가 핵심: “LLM 이 더 할 일이 없다고 하면 끝”.</p>' },
          { layout: 'code', title: '1단계: 도구 호출 요청 읽기', code: `import agentlab as al

llm = al.LLM()
messages = [al.system('너는 계산을 도와주는 비서다.'),
            al.user('123 * 45 는 얼마야?')]
r = llm.chat(messages, tools=[al.calculator])
print('content   :', repr(r.content))
print('tool_calls:', r.tool_calls)
print(r.tool_calls[0].name, r.tool_calls[0].args)`, points: ['<code>chat()</code> → Response 객체', '<code>content</code> 는 비어 있고 <code>tool_calls</code> 에 요청', '<b>아직 아무것도 실행되지 않았다</b>'],
            notes: '<p><b>핵심 오개념 교정:</b> “LLM 이 계산했나요?” → 아니오. 요청만 만들었다. 실행은 우리 코드가 한다. 이 한 줄이 이 교시에서 가장 중요합니다.</p>' },
          { layout: 'diagram', title: 'messages 가 자라는 모습', html: FIG_MESSAGES, caption: 'assistant(요청) 와 tool(결과) 을 짝지어 넣고 전체를 다시 보낸다',
            notes: '<p>“LLM 은 매 호출이 독립적” → 기록을 전부 다시 보내야 한다. 05차시 기억의 복선. tool_call_id 로 짝을 맞추는 이유: 도구를 여러 개 동시에 요청할 수 있기 때문.</p>' },
          { layout: 'code', title: '2단계: 실행하고 결과 돌려주기', code: `import json
import agentlab as al

llm = al.LLM()
messages = [al.system('너는 계산을 도와주는 비서다.'), al.user('123 * 45 는 얼마야?')]
r = llm.chat(messages, tools=[al.calculator])
call = r.tool_calls[0]
result = al.calculator.call(call.args)            # ① 실행
messages.append(r.message())                      # ② 요청 기록
messages.append({'role': 'tool', 'tool_call_id': call.id,
                 'name': call.name, 'content': json.dumps(result)})   # ③ 결과
r2 = llm.chat(messages, tools=[al.calculator])    # ④ 재호출
print(r2.tool_calls, '|', r2.content)`, points: ['① 우리 코드가 도구 실행', '② 요청 + ③ 결과를 짝으로 추가', '④ 다시 호출 → 요청 없음 = 답'],
            notes: '<p>②를 빼고 실행하면 모의 LLM 은 괜찮지만 실제 API 는 오류를 냅니다. 왜 그런지 학생에게 묻습니다 → 결과가 어느 요청의 것인지 모르기 때문.</p><p>⏱ 구현 18분</p>' },
          { layout: 'code', title: '3단계: 20줄 에이전트', code: `import json
import agentlab as al

llm = al.LLM()
registry = {t.name: t for t in [al.calculator, al.now]}
messages = [al.system('너는 도구를 활용하는 비서다.'), al.user('123 * 45 는 얼마야?')]
for step in range(1, 6):                              # max_steps
    r = llm.chat(messages, tools=list(registry.values()))
    if not r.tool_calls:
        print('✅', r.content); break
    messages.append(r.message())
    for call in r.tool_calls:
        tool = registry.get(call.name)
        result = tool.call(call.args) if tool else {'error': '도구 없음'}
        print('🔧', call.name, call.args, '→', result)
        messages.append({'role': 'tool', 'tool_call_id': call.id,
                         'name': call.name, 'content': json.dumps(result, ensure_ascii=False)})
print('호출:', llm.calls, llm.total_usage)`, points: ['registry = 이름 → 도구', '<code>range(1, 6)</code> = max_steps', '이것이 <code>al.Agent.run()</code> 의 전부'],
            notes: '<p>학생들이 타이핑하게 합니다(복붙 금지 권장). 질문을 “지금 몇 시야?” 로 바꿔 now 도구가 선택되는 것도 보여 줍니다.</p>' },
          { layout: 'code', title: '안전장치 ①: max_steps', code: `import agentlab as al

stuck = al.Response('', [al.ToolCall('now', {})])      # 도구만 계속 요청
llm = al.LLM(mock_responses=[stuck, stuck, stuck,
                             '지금까지의 정보로 정리하면, 시각을 세 번 확인했습니다.'])
agent = al.Agent(llm, tools=[al.now], max_steps=3, verbose=True)
print('답:', agent.run('지금 몇 시야?'))
print('LLM 호출:', llm.calls)`, points: ['끝낼 줄 모르는 LLM 흉내', '3단계 후 ⚠ → 정리 요청 1번 더', '상한이 없으면 토큰이 끝없이'],
            notes: '<p>모의 LLM 전용 시나리오. 키를 넣은 학생은 실제 모델이 바로 끝내므로 ⚠ 가 안 나옵니다 — 그래도 안전장치는 필요하다고 설명.</p><p>⏱ 안전장치 14분</p>' },
          { layout: 'code', title: '안전장치 ②: 오류도 관찰이다', code: `import agentlab as al

print(al.calculator.call({'expression': '10 / 0'}))
print(al.calculator.call({'expr': '1 + 1'}))

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator], verbose=True)
print('답:', agent.run('10 나누기 0 은?'))`, points: ['예외 대신 <code>{\'error\': …}</code>', '루프가 죽지 않고 LLM 이 설명', '내 도구를 만들 때도 같은 원칙'],
            notes: '<p>“도구가 예외를 던지면 프로그램이 멈추고 사용자는 아무 답도 못 받는다” → 오류를 관찰로 돌려주면 LLM 이 대처. 04차시 도구 만들기의 원칙.</p>' },
          { layout: 'code', title: '안전장치 ③: 비용 추적', code: `import agentlab as al

llm = al.LLM()
llm.verbose = True
agent = al.Agent(llm, tools=[al.calculator])
agent.run('99 * 99 는?')
llm.verbose = False
print('호출:', llm.calls, '| 토큰:', llm.total_usage.total_tokens)
BUDGET = 1000
print('남은 예산:', BUDGET - llm.total_usage.total_tokens)`, points: ['<code>verbose</code> → 호출마다 입력 · 응답', '두 번째 호출의 입력은 tool 메시지', '예산 넘으면 루프 중단'],
            notes: '<p>실제 키로 실행하면 토큰 수가 수백 단위로 커집니다. 분당 한도(0차시)와 연결해 “에이전트 하나가 한도를 얼마나 빨리 쓰는지” 계산하게 합니다.</p>' },
          { layout: 'table', title: '4대 요소 로드맵', head: ['차시', '요소', '오늘 루프의 위치', '배울 것'], rows: [
            ['02', 'LLM API', '<code>llm.chat(messages)</code>', '메시지 · 시스템 프롬프트 · JSON'], ['03', '🎭 역할', '<code>al.system(…)</code>', '페르소나 설계'], ['04', '🔧 도구', '<code>tools=[…]</code>', '<code>@al.tool</code> · 실제 API'], ['05', '🧠 기억', '<code>messages</code>', '대화 창 · 벡터 저장소'], ['06', '🗺️ 계획 · 반성', '<code>for step …</code>', 'ReAct · Plan-and-Execute']
          ], notes: '<p>오늘의 20줄 각 부분이 어느 차시로 확장되는지 손가락으로 짚어 줍니다.</p><p>⏱ 로드맵 · 퀴즈 · 정리 8분</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[0].q, options: QUIZ2[0].options, answer: QUIZ2[0].answer, explain: QUIZ2[0].explain, notes: '<p>루프 종료 조건을 묻는 문제. tool_calls 가 비면 끝.</p>' },
          { layout: 'practice', title: '실습 1-3. 오류 처리와 호출 횟수', desc: '<p><code>run_agent</code> 에 없는 도구 처리와 호출 횟수 표시를 넣으세요.</p>',
            starter: `import json
import agentlab as al

def run_agent(llm, task, tools, max_steps=5):
    registry = {t.name: t for t in tools}
    messages = [al.system('너는 도구를 활용하는 비서다.'), al.user(task)]
    start = llm.calls
    for step in range(max_steps):
        r = llm.chat(messages, tools=tools)
        if not r.tool_calls:
            return r.content            # TODO: ' (LLM 호출 N번)' 붙이기
        messages.append(r.message())
        for call in r.tool_calls:
            result = registry[call.name].call(call.args)   # TODO: 없는 도구 처리
            messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                             'content': json.dumps(result, ensure_ascii=False)})
    return '(단계 초과)'

llm = al.LLM()
print(run_agent(llm, '(3 + 5) * 4 는?', [al.calculator]))`, solution: `import json
import agentlab as al

def run_agent(llm, task, tools, max_steps=5):
    registry = {t.name: t for t in tools}
    messages = [al.system('너는 도구를 활용하는 비서다.'), al.user(task)]
    start = llm.calls
    for step in range(max_steps):
        r = llm.chat(messages, tools=tools)
        if not r.tool_calls:
            return r.content + f' (LLM 호출 {llm.calls - start}번)'
        messages.append(r.message())
        for call in r.tool_calls:
            tool = registry.get(call.name)
            result = tool.call(call.args) if tool else {'error': f'{call.name} 도구 없음'}
            messages.append({'role': 'tool', 'tool_call_id': call.id, 'name': call.name,
                             'content': json.dumps(result, ensure_ascii=False)})
    return '(단계 초과)'

llm = al.LLM()
print(run_agent(llm, '(3 + 5) * 4 는?', [al.calculator]))`, notes: '<p>루브릭: 도구 결과로 답(2) · 없는 도구 처리(1) · 호출 횟수(1) · 코드 설명(1).</p>' },
          { layout: 'summary', title: '정리', bullets: ['<code>llm.chat(messages, tools=…)</code> → <code>r.tool_calls</code> 가 있으면 실행, 없으면 답', '도구 실행은 <b>우리 코드</b>가, LLM 은 요청만', 'assistant(요청) + tool(결과) 를 짝으로 messages 에 추가', '안전장치: max_steps · 오류를 관찰로 · 호출/토큰 추적', '이 20줄 = <code>al.Agent.run()</code> = 프레임워크의 핵심', '다음 차시: LLM API 다루기 (메시지 · 시스템 프롬프트 · JSON)'], notes: '<p>과제: Colab 01 노트북에서 실제 모델로 손 루프 실행 + ✏️ 문제(도구 추가). 키가 없는 학생은 브라우저 실습 1-3 제출.</p>' }
        ]
      }
    ]
  });
})();
