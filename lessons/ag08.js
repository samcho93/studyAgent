/* 08차시 LangGraph: 상태 그래프로 설계하는 에이전트 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 8-1. 체인은 직선, 에이전트는 루프와 분기 */
  const FIG_CHAINVSGRAPH = `<svg viewBox="0 0 720 280" role="img" aria-label="위쪽은 직선으로 이어진 체인, 아래쪽은 분기와 루프가 있는 그래프">
  ${ARROW('m08a1')}
  <text x="20" y="30" class="tx-b">체인 (07차시): 직선</text>
  <rect x="20" y="50" width="110" height="44" rx="10" class="p1"/><text x="75" y="77" text-anchor="middle" class="tx-w">prompt</text>
  <rect x="180" y="50" width="110" height="44" rx="10" class="p2"/><text x="235" y="77" text-anchor="middle" class="tx-w">llm</text>
  <rect x="340" y="50" width="110" height="44" rx="10" class="p3"/><text x="395" y="77" text-anchor="middle" class="tx-w">parser</text>
  <line x1="132" y1="72" x2="176" y2="72" class="ln" stroke-width="2.5" marker-end="url(#m08a1)"/>
  <line x1="292" y1="72" x2="336" y2="72" class="ln" stroke-width="2.5" marker-end="url(#m08a1)"/>
  <text x="480" y="77" class="tx-m">한 번 지나가면 끝 · 되돌아갈 수 없다</text>
  <line x1="20" y1="115" x2="700" y2="115" class="ln" stroke-dasharray="4 4"/>
  <text x="20" y="145" class="tx-b">에이전트: 루프와 분기 = 그래프</text>
  <rect x="20" y="180" width="100" height="44" rx="10" class="p5s"/><text x="70" y="207" text-anchor="middle" class="tx">START</text>
  <rect x="170" y="180" width="110" height="44" rx="10" class="p1"/><text x="225" y="207" text-anchor="middle" class="tx-w">call_llm</text>
  <rect x="400" y="180" width="110" height="44" rx="10" class="p2"/><text x="455" y="207" text-anchor="middle" class="tx-w">call_tools</text>
  <rect x="600" y="180" width="100" height="44" rx="10" class="p4"/><text x="650" y="207" text-anchor="middle" class="tx-w">END</text>
  <line x1="122" y1="202" x2="166" y2="202" class="ln" stroke-width="2.5" marker-end="url(#m08a1)"/>
  <line x1="282" y1="196" x2="396" y2="196" class="ln" stroke-width="2.5" marker-end="url(#m08a1)"/>
  <text x="340" y="188" text-anchor="middle" class="tx-m">도구 요청 있음</text>
  <path d="M455 226 C455 262 225 262 225 228" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m08a1)"/>
  <text x="340" y="268" text-anchor="middle" class="tx-m">결과를 들고 다시 (루프)</text>
  <path d="M282 190 C330 150 560 150 596 196" class="ln" stroke-width="2.5" fill="none" stroke-dasharray="6 4" marker-end="url(#m08a1)"/>
  <text x="440" y="160" text-anchor="middle" class="tx-m">도구 요청 없음 → 끝 (분기)</text>
</svg>`;

  /* 그림 8-2. 상태 · 노드 · 엣지 · 조건부 엣지 */
  const FIG_STATEGRAPH = `<svg viewBox="0 0 720 320" role="img" aria-label="공유 상태 dict 를 가운데 두고 노드 함수들이 바뀐 키만 돌려주며, 엣지와 조건부 엣지로 다음 노드가 정해지는 그림">
  ${ARROW('m08a2')}
  <rect x="250" y="20" width="220" height="70" rx="14" class="p5s"/>
  <text x="360" y="45" text-anchor="middle" class="tx-b">📦 State (dict)</text>
  <text x="360" y="68" text-anchor="middle" class="tx-m">{'topic': …, 'notes': …, 'draft': …}</text>
  <rect x="20" y="150" width="90" height="44" rx="10" class="card-bg"/><text x="65" y="177" text-anchor="middle" class="tx">START</text>
  <rect x="150" y="150" width="120" height="44" rx="10" class="p1"/><text x="210" y="177" text-anchor="middle" class="tx-w">research</text>
  <rect x="320" y="150" width="120" height="44" rx="10" class="p2"/><text x="380" y="177" text-anchor="middle" class="tx-w">write</text>
  <rect x="490" y="150" width="120" height="44" rx="10" class="p3"/><text x="550" y="177" text-anchor="middle" class="tx-w">review</text>
  <rect x="640" y="150" width="70" height="44" rx="10" class="card-bg"/><text x="675" y="177" text-anchor="middle" class="tx">END</text>
  <line x1="112" y1="172" x2="146" y2="172" class="ln" stroke-width="2.5" marker-end="url(#m08a2)"/>
  <line x1="272" y1="172" x2="316" y2="172" class="ln" stroke-width="2.5" marker-end="url(#m08a2)"/>
  <line x1="442" y1="172" x2="486" y2="172" class="ln" stroke-width="2.5" marker-end="url(#m08a2)"/>
  <line x1="612" y1="172" x2="636" y2="172" class="ln" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#m08a2)"/>
  <path d="M550 196 C550 240 380 240 380 196" class="ln" stroke-width="2.5" fill="none" stroke-dasharray="6 4" marker-end="url(#m08a2)"/>
  <text x="465" y="250" text-anchor="middle" class="tx-m">⇢ 조건부 엣지: router(state) → 'ok': END | 'redo': write</text>
  <line x1="210" y1="148" x2="300" y2="92" class="ln" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#m08a2)"/>
  <line x1="380" y1="148" x2="360" y2="92" class="ln" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#m08a2)"/>
  <line x1="550" y1="148" x2="420" y2="92" class="ln" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#m08a2)"/>
  <text x="150" y="120" class="tx-m">{'notes': …}</text>
  <text x="340" y="120" class="tx-m">{'draft': …}</text>
  <text x="520" y="120" class="tx-m">{'review': …}</text>
  <text x="360" y="290" text-anchor="middle" class="tx-m">노드 = 함수(state) → 바뀐 키만 dict 로 · 엣지(→) = 항상 다음 · 조건부 엣지(⇢) = 라우터가 고름</text>
  <text x="360" y="310" text-anchor="middle" class="tx-m">리스트 키(messages · logs 처럼 s 로 끝나는 키)는 덮어쓰지 않고 이어 붙인다</text>
</svg>`;

  /* 그림 8-3. 루프와 안전장치 */
  const FIG_LOOP = `<svg viewBox="0 0 700 260" role="img" aria-label="작업 노드가 충분한가를 묻는 라우터로 자기 자신에게 되돌아가는 루프와 최대 단계 안전장치">
  ${ARROW('m08a3')}
  <rect x="30" y="100" width="90" height="50" rx="10" class="card-bg"/><text x="75" y="130" text-anchor="middle" class="tx">START</text>
  <rect x="190" y="90" width="140" height="70" rx="14" class="p1"/><text x="260" y="120" text-anchor="middle" class="tx-w">work</text><text x="260" y="142" text-anchor="middle" class="tx-w">count += 1</text>
  <polygon points="430,85 500,125 430,165 360,125" class="p4"/><text x="430" y="130" text-anchor="middle" class="tx-w">충분한가?</text>
  <rect x="570" y="100" width="100" height="50" rx="10" class="card-bg"/><text x="620" y="130" text-anchor="middle" class="tx">END</text>
  <line x1="122" y1="125" x2="186" y2="125" class="ln" stroke-width="2.5" marker-end="url(#m08a3)"/>
  <line x1="332" y1="125" x2="356" y2="125" class="ln" stroke-width="2.5" marker-end="url(#m08a3)"/>
  <line x1="502" y1="125" x2="566" y2="125" class="ln" stroke-width="2.5" marker-end="url(#m08a3)"/>
  <text x="534" y="115" text-anchor="middle" class="tx-m">'done'</text>
  <path d="M430 167 C430 215 260 215 260 162" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m08a3)"/>
  <text x="345" y="222" text-anchor="middle" class="tx-m">'again' (루프)</text>
  <rect x="30" y="20" width="300" height="40" rx="10" class="p3s"/><text x="180" y="45" text-anchor="middle" class="tx">🛡 compile(max_steps=N): 넘으면 RuntimeError</text>
  <text x="520" y="45" text-anchor="middle" class="tx-m">라우터가 영영 'again' 이면? → 무한 루프 방지</text>
</svg>`;

  /* 그림 8-4. 에이전트 그래프 */
  const FIG_AGENTGRAPH = `<svg viewBox="0 0 720 300" role="img" aria-label="call_llm 노드와 call_tools 노드가 messages 리스트를 누적하며 tool_calls 유무로 분기하는 에이전트 그래프">
  ${ARROW('m08a4')}
  <rect x="20" y="120" width="90" height="50" rx="10" class="card-bg"/><text x="65" y="150" text-anchor="middle" class="tx">START</text>
  <rect x="170" y="105" width="150" height="80" rx="14" class="p1"/><text x="245" y="135" text-anchor="middle" class="tx-w">call_llm</text><text x="245" y="158" text-anchor="middle" class="tx-w">llm.chat(messages, tools)</text>
  <polygon points="420,100 500,145 420,190 340,145" class="p4"/><text x="420" y="140" text-anchor="middle" class="tx-w">tool_calls</text><text x="420" y="158" text-anchor="middle" class="tx-w">있나?</text>
  <rect x="540" y="30" width="150" height="70" rx="14" class="p2"/><text x="615" y="58" text-anchor="middle" class="tx-w">call_tools</text><text x="615" y="80" text-anchor="middle" class="tx-w">실행 → tool 메시지</text>
  <rect x="580" y="200" width="100" height="50" rx="10" class="card-bg"/><text x="630" y="230" text-anchor="middle" class="tx">END</text>
  <line x1="112" y1="145" x2="166" y2="145" class="ln" stroke-width="2.5" marker-end="url(#m08a4)"/>
  <line x1="322" y1="145" x2="336" y2="145" class="ln" stroke-width="2.5" marker-end="url(#m08a4)"/>
  <line x1="470" y1="117" x2="536" y2="75" class="ln" stroke-width="2.5" marker-end="url(#m08a4)"/>
  <text x="490" y="85" text-anchor="middle" class="tx-m">'tools'</text>
  <line x1="470" y1="173" x2="576" y2="215" class="ln" stroke-width="2.5" marker-end="url(#m08a4)"/>
  <text x="540" y="210" text-anchor="middle" class="tx-m">'end'</text>
  <path d="M538 50 C300 10 245 40 245 101" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m08a4)"/>
  <text x="360" y="30" text-anchor="middle" class="tx-m">결과를 들고 다시 LLM 에게</text>
  <rect x="20" y="230" width="500" height="50" rx="10" class="p5s"/>
  <text x="270" y="251" text-anchor="middle" class="tx-b">State = {'messages': [user, assistant(tool_calls), tool, assistant, …]}</text>
  <text x="270" y="270" text-anchor="middle" class="tx-m">노드는 새 메시지만 돌려주고 그래프가 이어 붙인다 (LangGraph 의 add_messages)</text>
</svg>`;

  /* 그림 8-5. 체크포인트와 사람의 승인 */
  const FIG_CHECKPOINT = `<svg viewBox="0 0 720 300" role="img" aria-label="왼쪽은 thread_id 별로 상태를 저장하는 체크포인트, 오른쪽은 실행 전에 사람의 승인을 받는 노드">
  ${ARROW('m08a5')}
  <text x="180" y="28" text-anchor="middle" class="tx-b">체크포인트 (MemorySaver)</text>
  <rect x="20" y="50" width="320" height="120" rx="14" class="p4s"/>
  <text x="40" y="78" class="tx-b">🗂 thread_id → 마지막 상태</text>
  <text x="40" y="104" class="tx-m">'u1': {'messages': [내 이름은 영준…, 답…]}</text>
  <text x="40" y="128" class="tx-m">'u2': {'messages': [안녕…, 답…]}</text>
  <text x="40" y="154" class="tx-m">invoke(입력, {'thread_id': 'u1'}) → 이어서 실행</text>
  <text x="180" y="200" text-anchor="middle" class="tx-m">같은 thread 로 부르면 이전 상태 위에서 시작</text>
  <text x="180" y="222" text-anchor="middle" class="tx-m">= 05차시 대화 기록 · 07차시 session_id</text>
  <line x1="370" y1="20" x2="370" y2="280" class="ln" stroke-dasharray="4 4"/>
  <text x="545" y="28" text-anchor="middle" class="tx-b">Human-in-the-loop (승인 노드)</text>
  <rect x="400" y="60" width="110" height="44" rx="10" class="p1"/><text x="455" y="87" text-anchor="middle" class="tx-w">propose</text>
  <rect x="400" y="140" width="110" height="44" rx="10" class="p3"/><text x="455" y="167" text-anchor="middle" class="tx-w">👤 approve</text>
  <rect x="580" y="110" width="110" height="44" rx="10" class="p2"/><text x="635" y="137" text-anchor="middle" class="tx-w">execute</text>
  <rect x="580" y="200" width="110" height="44" rx="10" class="card-bg"/><text x="635" y="227" text-anchor="middle" class="tx">cancel</text>
  <line x1="455" y1="106" x2="455" y2="136" class="ln" stroke-width="2.5" marker-end="url(#m08a5)"/>
  <line x1="512" y1="155" x2="576" y2="137" class="ln" stroke-width="2.5" marker-end="url(#m08a5)"/>
  <text x="540" y="138" text-anchor="middle" class="tx-m">yes</text>
  <line x1="512" y1="170" x2="576" y2="215" class="ln" stroke-width="2.5" marker-end="url(#m08a5)"/>
  <text x="540" y="205" text-anchor="middle" class="tx-m">no</text>
  <text x="545" y="270" text-anchor="middle" class="tx-m">실제 LangGraph: interrupt_before=['execute'] 로 멈췄다가 재개</text>
</svg>`;

  /* 그림 8-6. 계획 - 실행 - 반성 그래프 */
  const FIG_PER = `<svg viewBox="0 0 720 280" role="img" aria-label="plan, execute 루프, reflect, revise 노드로 이루어진 계획 실행 반성 그래프">
  ${ARROW('m08a6')}
  <rect x="20" y="110" width="80" height="44" rx="10" class="card-bg"/><text x="60" y="137" text-anchor="middle" class="tx">START</text>
  <rect x="130" y="110" width="100" height="44" rx="10" class="p1"/><text x="180" y="137" text-anchor="middle" class="tx-w">plan</text>
  <rect x="270" y="110" width="110" height="44" rx="10" class="p2"/><text x="325" y="137" text-anchor="middle" class="tx-w">execute</text>
  <rect x="430" y="110" width="100" height="44" rx="10" class="p3"/><text x="480" y="137" text-anchor="middle" class="tx-w">reflect</text>
  <rect x="430" y="200" width="100" height="44" rx="10" class="p5"/><text x="480" y="227" text-anchor="middle" class="tx-w">revise</text>
  <rect x="610" y="110" width="80" height="44" rx="10" class="card-bg"/><text x="650" y="137" text-anchor="middle" class="tx">END</text>
  <line x1="102" y1="132" x2="126" y2="132" class="ln" stroke-width="2.5" marker-end="url(#m08a6)"/>
  <line x1="232" y1="132" x2="266" y2="132" class="ln" stroke-width="2.5" marker-end="url(#m08a6)"/>
  <line x1="382" y1="132" x2="426" y2="132" class="ln" stroke-width="2.5" marker-end="url(#m08a6)"/>
  <text x="404" y="122" text-anchor="middle" class="tx-m">끝</text>
  <path d="M345 108 C345 60 305 60 305 108" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m08a6)"/>
  <text x="325" y="62" text-anchor="middle" class="tx-m">단계 남음 (루프)</text>
  <line x1="532" y1="132" x2="606" y2="132" class="ln" stroke-width="2.5" marker-end="url(#m08a6)"/>
  <text x="570" y="122" text-anchor="middle" class="tx-m">score ≥ 8 또는 rounds ≥ 2</text>
  <line x1="480" y1="156" x2="480" y2="196" class="ln" stroke-width="2.5" marker-end="url(#m08a6)"/>
  <text x="520" y="180" class="tx-m">점수 미달</text>
  <path d="M428 222 C390 222 390 160 426 148" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m08a6)"/>
  <text x="360" y="245" text-anchor="middle" class="tx-m">06차시의 Planner · Reflector 가 노드가 된다</text>
</svg>`;

  const QUIZ1 = [
    { q: 'LangGraph 의 <b>노드(node)</b> 함수가 돌려줘야 하는 것은?', options: ['전체 상태를 복사한 새 dict', '바뀐 키만 담은 dict', '문자열 하나', '다음 노드 이름'], answer: 1,
      explain: '노드는 <code>state</code> 를 받아 <b>바뀐 키만</b> dict 로 돌려줍니다. 그래프가 기존 상태에 합쳐 줍니다. 다음 노드는 엣지 · 라우터가 정합니다.' },
    { q: '<code>add_conditional_edges(\'work\', router, {\'again\': \'work\', \'done\': END})</code> 에서 <code>router</code> 가 돌려주는 값은?', options: ['노드 함수', '상태 dict', 'mapping 의 키 중 하나 (\'again\' 또는 \'done\')', 'True / False'], answer: 2,
      explain: '라우터는 상태를 보고 <b>mapping 의 키</b>를 돌려주고, 그래프가 그 키에 해당하는 노드로 이동합니다. 키가 mapping 에 없으면 오류가 납니다.' },
    { q: '체인(LCEL) 대신 그래프를 써야 하는 경우로 가장 알맞은 것은?', options: ['번역 한 번', '프롬프트 → 모델 → 파서 순서가 고정된 작업', '결과에 따라 같은 단계를 다시 돌거나 다른 길로 가야 하는 작업', 'JSON 파싱'], answer: 2,
      explain: '체인은 직선입니다. <b>루프와 분기</b>가 필요하면 그래프가 자연스럽습니다. 07차시의 라우터 함수는 분기까지는 되지만 루프를 표현하기 어렵습니다.' },
    { q: '<code>app.stream(state)</code> 와 <code>app.invoke(state)</code> 의 차이는?', options: ['stream 은 노드마다 중간 결과를 하나씩 내고, invoke 는 최종 상태만 돌려준다', 'stream 은 더 빠르다', 'invoke 는 루프를 돌지 않는다', '차이가 없다'], answer: 0,
      explain: '<code>stream</code> 은 노드가 끝날 때마다 <code>{노드이름: 바뀐 값}</code> 을 내어 진행 과정을 볼 수 있고, <code>invoke</code> 는 끝까지 돈 뒤 최종 상태를 돌려줍니다.' }
  ];
  const QUIZ2 = [
    { q: '에이전트 그래프에서 <code>call_llm</code> 다음의 라우터가 보는 것은?', options: ['상태의 글자 수', '마지막 메시지에 <code>tool_calls</code> 가 있는지', '사용자 이름', 'LLM 의 온도'], answer: 1,
      explain: 'LLM 이 도구 호출을 요청했으면 <code>call_tools</code> 로, 아니면 최종 답이므로 <code>END</code> 로 갑니다. 04차시 루프의 <code>if not r.tool_calls: break</code> 가 라우터가 된 것입니다.' },
    { q: '체크포인트(<code>MemorySaver</code>)와 <code>thread_id</code> 의 역할은?', options: ['그래프를 그림으로 그린다', 'thread 별로 마지막 상태를 저장해 다음 호출이 이어서 실행되게 한다', '도구를 병렬로 실행한다', 'LLM 호출 횟수를 줄인다'], answer: 1,
      explain: '같은 <code>thread_id</code> 로 다시 부르면 저장된 상태(예: messages) 위에서 시작합니다. 05차시 대화 기록, 07차시 session_id 와 같은 생각입니다.' },
    { q: 'Human-in-the-loop 가 특히 필요한 노드는?', options: ['글자 수를 세는 노드', '이메일 발송 · 결제 · 삭제처럼 되돌리기 어려운 행동을 하는 노드', '요약 노드', 'START 노드'], answer: 1,
      explain: '되돌리기 어려운 부작용이 있는 행동 앞에 승인 노드(또는 <code>interrupt_before</code>)를 두어 사람이 확인하게 합니다. 13차시 안전에서 다시 다룹니다.' },
    { q: '계획-실행-반성 그래프에서 <code>reflect</code> 뒤 라우터가 <code>rounds &gt;= 2</code> 조건을 함께 보는 이유는?', options: ['점수를 더 높이려고', '평가 점수가 영영 기준을 못 넘어도 그래프가 끝나게 하려고', 'LLM 을 더 많이 부르려고', '계획을 다시 세우려고'], answer: 1,
      explain: '06차시의 최대 횟수 안전장치와 같습니다. 그래프의 <code>max_steps</code> 는 최후의 보루이고, 라우터에서 먼저 상한을 두는 것이 좋은 설계입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag08',
    no: '08',
    title: 'LangGraph: 상태 그래프로 설계하는 에이전트',
    subtitle: '상태 · 노드 · 엣지 · 조건부 엣지로 루프와 분기를 그리다',
    summary: '체인은 직선이지만 에이전트는 <b>루프와 분기</b>가 필요합니다. <b>LangGraph</b> 는 에이전트를 <b>상태(State)</b>를 공유하는 <b>노드(함수)</b>와 <b>엣지</b>의 그래프로 그립니다. <code>agentlab</code> 의 미니 LangGraph(<code>al.StateGraph</code>)로 3노드 그래프 · 조건 분기 루프 · 도구 에이전트 그래프 · 체크포인트 · 사람의 승인 · 계획-실행-반성 그래프를 직접 만들고, Colab 에서 실제 <code>langgraph</code> 로 같은 그래프를 실행합니다.',
    goals: [
      '체인(직선)과 그래프(루프 · 분기)의 차이를 설명하고 그래프가 필요한 상황을 고를 수 있다',
      'State · Node · Edge · 조건부 엣지 · START/END 로 그래프를 만들고 compile → invoke / stream 할 수 있다',
      '조건부 엣지로 루프를 만들고 max_steps 안전장치의 역할을 설명할 수 있다',
      'call_llm / call_tools 노드와 라우터로 도구 에이전트를 그래프로 다시 만들 수 있다',
      '체크포인트(MemorySaver · thread_id)로 대화를 이어가고, 승인 노드와 계획-실행-반성 그래프를 설계할 수 있다'
    ],
    sections: [
      {
        id: 'ag08-1',
        title: '왜 그래프인가: 상태 · 노드 · 엣지 · 조건 분기',
        minutes: 50,
        goals: ['체인과 그래프의 차이를 말한다', 'StateGraph 로 3노드 그래프를 만들어 invoke · stream · draw 한다', '조건부 엣지로 루프를 만들고 max_steps 를 설명한다'],
        flow: [['도입 · 체인의 한계', 6], ['상태 · 노드 · 엣지 개념', 10], ['3노드 그래프 (코드)', 14], ['조건 분기 루프 · 안전장치 (코드)', 12], ['퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '07차시의 체인 <code>prompt | llm | parser</code> 는 한 번 지나가면 끝나는 <b>직선</b>입니다. 그런데 04차시의 도구 루프는 "도구 요청이 있으면 실행하고 <b>다시 LLM 에게</b>", 06차시의 반성은 "점수가 낮으면 <b>다시 수정</b>"이었습니다. 되돌아가는 화살표(<b>루프</b>)와 갈림길(<b>분기</b>)이 있는 구조는 직선으로 그릴 수 없습니다. 그래서 <b>그래프</b>가 필요합니다.' },
          { type: 'figure', html: FIG_CHAINVSGRAPH, caption: '그림 8-1. 체인은 직선, 에이전트는 루프와 분기. LangGraph 는 LangChain 팀이 만든 "그래프로 에이전트를 그리는" 라이브러리입니다.' },
          { type: 'h', text: '네 가지 재료: 상태 · 노드 · 엣지 · 조건부 엣지' },
          { type: 'table', head: ['재료', '뜻', 'agentlab / LangGraph'], rows: [
            ['<b>State</b> 상태', '노드들이 함께 읽고 쓰는 <b>dict</b> 하나', '<code>{\'topic\': …, \'draft\': …}</code> / <code>TypedDict</code>'],
            ['<b>Node</b> 노드', '<b>함수(state) → 바뀐 키만 dict</b>', '<code>g.add_node(\'write\', write_fn)</code>'],
            ['<b>Edge</b> 엣지', '항상 다음 노드로', '<code>g.add_edge(\'research\', \'write\')</code>'],
            ['<b>조건부 엣지</b>', '라우터 함수가 상태를 보고 다음을 고름', '<code>g.add_conditional_edges(\'review\', router, {\'ok\': END, \'redo\': \'write\'})</code>'],
            ['<b>START / END</b>', '시작점과 끝점', '<code>g.add_edge(al.START, \'research\')</code> · <code>al.END</code>']
          ], caption: '표 8-1. 메서드 이름은 실제 LangGraph 와 같습니다 (StateGraph · add_node · add_edge · add_conditional_edges · compile · invoke · stream).' },
          { type: 'figure', html: FIG_STATEGRAPH, caption: '그림 8-2. 노드는 상태를 읽고 바뀐 키만 돌려줍니다. 그래프가 상태에 합쳐 주고, 엣지(또는 라우터)가 다음 노드를 정합니다.' },
          { type: 'code', title: '예제 8-1. 3노드 그래프: 만들기 → compile → invoke → draw', code: `import agentlab as al

llm = al.LLM()

def research(state):                       # 노드 = 함수(state) → 바뀐 키만
    notes = llm.ask(state['topic'] + ' 에 대해 조사해 줘')
    return {'notes': notes}

def write(state):
    draft = llm.ask(state['topic'] + ' 블로그 글 작성해 줘', system_prompt='참고: ' + state['notes'][:80])
    return {'draft': draft}

def review(state):
    return {'review': llm.ask('다음 글을 검토해 줘:\\n' + state['draft'])}

g = al.StateGraph()
g.add_node('research', research)
g.add_node('write', write)
g.add_node('review', review)
g.add_edge(al.START, 'research')           # 엣지: 항상 다음으로
g.add_edge('research', 'write')
g.add_edge('write', 'review')
g.add_edge('review', al.END)
g.draw()                                   # 구조를 텍스트로

app = g.compile()
final = app.invoke({'topic': '전기차'})     # 처음 상태 → 끝까지 실행 → 최종 상태
print('---')
print('최종 상태의 키:', list(final))
print('리뷰:', final['review'][:50])`,
            expect: `__start__ → research
research → write
write → review
review → __end__
---
최종 상태의 키: ['topic', 'notes', 'draft', 'review']
리뷰: 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고,`,
            desc: '세 노드가 차례로 상태에 <code>notes</code> → <code>draft</code> → <code>review</code> 를 보탭니다. 노드는 전체 상태를 돌려주지 않고 <b>바뀐 키만</b> 돌려주는 것이 규칙입니다. <code>g.draw()</code> 는 실제 LangGraph 의 <code>get_graph().draw_mermaid()</code> 에 해당합니다.' },
          { type: 'code', title: '예제 8-2. stream 으로 노드별 중간 상태 보기', code: `import agentlab as al

def research(state):
    return {'notes': state['topic'] + ' 에 관한 메모 3개'}

def write(state):
    return {'draft': state['notes'] + ' 를 바탕으로 쓴 초안'}

def review(state):
    return {'review': '초안 길이 ' + str(len(state['draft'])) + '자 — 통과'}

g = al.StateGraph()
g.add_node('research', research).add_node('write', write).add_node('review', review)
g.add_edge(al.START, 'research').add_edge('research', 'write').add_edge('write', 'review').add_edge('review', al.END)
app = g.compile()

for event in app.stream({'topic': '전기차'}):          # {노드이름: 그 노드가 돌려준 dict}
    for node, update in event.items():
        print(f'▶ {node:<9} {update}')`,
            expect: `▶ research  {'notes': '전기차 에 관한 메모 3개'}
▶ write     {'draft': '전기차 에 관한 메모 3개 를 바탕으로 쓴 초안'}
▶ review    {'review': '초안 길이 26자 — 통과'}`,
            desc: '<code>stream</code> 은 노드가 끝날 때마다 <code>{노드이름: 바뀐 값}</code> 을 하나씩 냅니다. 진행 상황을 화면에 보여 주거나 디버깅할 때 씁니다. 이 예제는 LLM 없이 그래프의 흐름만 봅니다 — 노드는 <b>그냥 파이썬 함수</b>라는 점이 핵심입니다. (메서드가 <code>self</code> 를 돌려주므로 <code>.add_node(...).add_node(...)</code> 처럼 이어 쓸 수 있습니다)' },
          { type: 'code', title: '예제 8-3. 리스트 키는 이어 붙는다 (messages 처럼)', code: `import agentlab as al

def step_a(state):
    return {'logs': ['A 실행'], 'count': state['count'] + 1}       # logs 는 리스트 → 이어 붙음

def step_b(state):
    return {'logs': ['B 실행'], 'count': state['count'] + 1}       # count 는 숫자 → 덮어씀

g = al.StateGraph()
g.add_node('a', step_a).add_node('b', step_b)
g.add_edge(al.START, 'a').add_edge('a', 'b').add_edge('b', al.END)
final = g.compile().invoke({'logs': ['시작'], 'count': 0})
print(final)`,
            expect: `{'logs': ['시작', 'A 실행', 'B 실행'], 'count': 2}`,
            desc: '<code>agentlab</code> 의 그래프는 <b>s 로 끝나는 리스트 키</b>(logs · messages · results …)를 덮어쓰지 않고 이어 붙입니다. 실제 LangGraph 에서는 <code>Annotated[list, add_messages]</code> 처럼 <b>리듀서(reducer)</b>를 지정해 같은 일을 합니다. 2교시의 에이전트 그래프가 <code>messages</code> 를 쌓는 방식입니다.' },
          { type: 'h', text: '조건부 엣지로 루프 만들기' },
          { type: 'p', html: '루프는 <b>조건부 엣지</b>로 만듭니다. 노드가 끝난 뒤 <b>라우터 함수</b>가 상태를 보고 <code>\'again\'</code> 이면 같은 노드로, <code>\'done\'</code> 이면 END 로 보냅니다. 06차시의 "점수가 기준 이상인가?", 04차시의 "도구 요청이 있는가?"가 모두 이런 라우터입니다.' },
          { type: 'figure', html: FIG_LOOP, caption: '그림 8-3. 라우터가 자기 자신으로 되돌리면 루프. 라우터가 영영 \'again\' 을 내면 무한 루프이므로 max_steps 안전장치가 있습니다.' },
          { type: 'code', title: '예제 8-4. 카운터 루프: "충분한가?" 라우터', code: `import agentlab as al

def work(state):
    n = state['count'] + 1
    return {'count': n, 'logs': [f'작업 {n}회']}

def enough(state):                          # 라우터: mapping 의 키를 돌려준다
    return 'done' if state['count'] >= 3 else 'again'

g = al.StateGraph()
g.add_node('work', work)
g.add_edge(al.START, 'work')
g.add_conditional_edges('work', enough, {'again': 'work', 'done': al.END})
g.draw()
app = g.compile()
for event in app.stream({'count': 0, 'logs': []}):
    print(event)
print('최종:', app.invoke({'count': 0, 'logs': []}))`,
            expect: `__start__ → work
work ⇢ again:work | done:__end__
{'work': {'count': 1, 'logs': ['작업 1회']}}
{'work': {'count': 2, 'logs': ['작업 2회']}}
{'work': {'count': 3, 'logs': ['작업 3회']}}
최종: {'count': 3, 'logs': ['작업 1회', '작업 2회', '작업 3회']}`,
            desc: '<code>work</code> 노드가 세 번 돌고 라우터가 <code>\'done\'</code> 을 내자 END 로 빠져나갑니다. <code>draw()</code> 의 <code>⇢</code> 가 조건부 엣지입니다. 라우터는 <b>mapping 에 있는 키</b>만 돌려줘야 합니다(없는 키를 내면 <code>KeyError</code>).' },
          { type: 'code', title: '예제 8-5. 무한 루프 안전장치: compile(max_steps=…)', code: `import agentlab as al

def work(state):
    return {'count': state['count'] + 1}

def never_done(state):                      # 잘못 만든 라우터: 늘 'again'
    return 'again'

g = al.StateGraph()
g.add_node('work', work)
g.add_edge(al.START, 'work')
g.add_conditional_edges('work', never_done, {'again': 'work', 'done': al.END})
app = g.compile(max_steps=5)                # 5단계를 넘으면 멈춘다 (기본값 50)
try:
    app.invoke({'count': 0})
except RuntimeError as e:
    print('RuntimeError:', e)`,
            expect: `RuntimeError: 5단계를 넘었다 — 무한 루프를 확인해라`,
            desc: '라우터의 버그나 LLM 의 반복 때문에 그래프가 끝나지 않을 수 있습니다. <code>max_steps</code> 는 최후의 보루이고, 실제 LangGraph 에서는 <code>recursion_limit</code> 이 같은 역할을 합니다(기본 25). 좋은 설계는 06차시처럼 <b>라우터 안에서 먼저 횟수 상한</b>을 두는 것입니다.' },
          { type: 'code', title: '예제 8-6. 실제 LangGraph 코드 — 같은 이름, TypedDict 상태 (Colab 에서 실행)', run: false, code: `# pip install langgraph
from typing import TypedDict
from langgraph.graph import StateGraph, START, END      # al.StateGraph, al.START, al.END

class State(TypedDict):                                   # 상태의 모양을 타입으로 선언
    count: int
    logs: list

def work(state: State):
    n = state['count'] + 1
    return {'count': n, 'logs': state['logs'] + [f'작업 {n}회']}   # 리듀서가 없으면 직접 이어 붙인다

def enough(state: State):
    return 'done' if state['count'] >= 3 else 'again'

g = StateGraph(State)
g.add_node('work', work)
g.add_edge(START, 'work')
g.add_conditional_edges('work', enough, {'again': 'work', 'done': END})
app = g.compile()
print(app.invoke({'count': 0, 'logs': []}))
for event in app.stream({'count': 0, 'logs': []}):
    print(event)
# 그림으로: app.get_graph().draw_mermaid_png()  (Colab 에서 표시)`,
            desc: '예제 8-4 와 비교하면 <code>StateGraph(State)</code> 에 <b>TypedDict</b> 를 넘기는 것만 다릅니다. 상태의 키와 타입을 미리 선언하면 오타를 잡아 주고, 리스트 키에 리듀서(<code>Annotated[list, add_messages]</code> 등)를 붙일 수 있습니다. 나머지 메서드 이름은 모두 같습니다.' },
          { type: 'callout', kind: 'tip', title: '그래프 설계 순서', html: '① <b>상태</b>에 어떤 키가 필요한지 적는다 → ② 키를 바꾸는 <b>노드 함수</b>를 하나씩 쓴다(바뀐 키만 반환) → ③ 항상 가는 길은 <b>엣지</b>, 조건이 있으면 <b>라우터 + 조건부 엣지</b> → ④ <code>draw()</code> 로 그림을 확인하고 <code>stream</code> 으로 한 노드씩 검증한다. 노드가 LLM 을 부르든 파이썬 계산을 하든 그래프는 신경 쓰지 않습니다.' }
        ],
        practice: [
          { title: '실습 8-1. 나의 3노드 그래프', level: 1,
            desc: '<p>문자열을 다듬는 3노드 그래프를 만드세요: <code>trim</code>(앞뒤 공백 제거) → <code>upper</code>(대문자) → <code>wrap</code>(앞뒤에 <code>[ ]</code> 붙이기). 상태 키는 <code>text</code> 하나이며, 각 노드는 <code>{\'text\': …}</code> 를 돌려줍니다. <code>draw()</code> 와 <code>invoke({\'text\': \'  hello graph  \'})</code> 결과를 출력하세요.</p>',
            hint: '세 함수를 만들고 <code>add_node</code> 3번, <code>add_edge</code> 4번(START 포함).',
            starter: `import agentlab as al

def trim(state):
    return {'text': state['text'].strip()}
# TODO: upper, wrap 노드 함수

g = al.StateGraph()
g.add_node('trim', trim)
# TODO: 노드 2개 추가 · 엣지 연결 (START → trim → upper → wrap → END)
g.draw()
print(g.compile().invoke({'text': '  hello graph  '}))
`,
            solution: `import agentlab as al

def trim(state):
    return {'text': state['text'].strip()}

def upper(state):
    return {'text': state['text'].upper()}

def wrap(state):
    return {'text': '[' + state['text'] + ']'}

g = al.StateGraph()
g.add_node('trim', trim).add_node('upper', upper).add_node('wrap', wrap)
g.add_edge(al.START, 'trim').add_edge('trim', 'upper').add_edge('upper', 'wrap').add_edge('wrap', al.END)
g.draw()
print(g.compile().invoke({'text': '  hello graph  '}))
`,
            expect: `__start__ → trim
trim → upper
upper → wrap
wrap → __end__
{'text': '[HELLO GRAPH]'}` },
          { title: '실습 8-2. 100 이 넘을 때까지 두 배로', level: 2,
            desc: '<p><code>double</code> 노드가 <code>value</code> 를 두 배로 만들고 <code>steps</code> 리스트에 값을 기록합니다. 라우터는 <code>value &gt;= 100</code> 이면 <code>\'done\'</code>, 아니면 <code>\'again\'</code> 을 돌려줍니다. <code>{\'value\': 3, \'steps\': []}</code> 로 시작해 최종 상태와 반복 횟수(<code>len(steps)</code>)를 출력하세요.</p>',
            hint: '예제 8-4 의 구조에서 노드와 라우터만 바꿉니다.',
            starter: `import agentlab as al

def double(state):
    # TODO: value 두 배, steps 에 새 값 기록
    return {}

def router(state):
    # TODO: 100 이상이면 'done', 아니면 'again'
    return 'done'

g = al.StateGraph()
g.add_node('double', double)
g.add_edge(al.START, 'double')
g.add_conditional_edges('double', router, {'again': 'double', 'done': al.END})
final = g.compile().invoke({'value': 3, 'steps': []})
print(final)
# TODO: 반복 횟수 출력
`,
            solution: `import agentlab as al

def double(state):
    v = state['value'] * 2
    return {'value': v, 'steps': [v]}

def router(state):
    return 'done' if state['value'] >= 100 else 'again'

g = al.StateGraph()
g.add_node('double', double)
g.add_edge(al.START, 'double')
g.add_conditional_edges('double', router, {'again': 'double', 'done': al.END})
final = g.compile().invoke({'value': 3, 'steps': []})
print(final)
print('반복 횟수:', len(final['steps']))
`,
            expect: `{'value': 192, 'steps': [6, 12, 24, 48, 96, 192]}
반복 횟수: 6` },
          { title: '실습 8-3. (도전) 실행 경로 기록하기', level: 3,
            desc: '<p>예제 8-1 의 세 노드 뒤에 <b>조건부 엣지</b>를 붙여, <code>review</code> 결과에 <code>\'근거\'</code> 라는 단어가 있고 <code>rounds &lt; 2</code> 이면 <code>write</code> 로 되돌아가고(재작성), 아니면 END 로 가게 하세요. <code>write</code> 노드는 <code>rounds</code> 를 1 늘립니다(처음 작성 후 1, 재작성 후 2). <code>stream</code> 으로 실행하며 지나간 노드 이름을 리스트에 모아 출력하세요.</p>',
            hint: '라우터: <code>return \'redo\' if \'근거\' in state[\'review\'] and state[\'rounds\'] < 2 else \'ok\'</code>',
            starter: `import agentlab as al

llm = al.LLM()

def research(state):
    return {'notes': llm.ask(state['topic'] + ' 에 대해 조사해 줘')}

def write(state):
    return {'draft': llm.ask(state['topic'] + ' 블로그 글 작성해 줘'), 'rounds': state['rounds'] + 1}

def review(state):
    return {'review': llm.ask('다음 글을 검토해 줘:\\n' + state['draft'])}

def router(state):
    # TODO: '근거' 가 리뷰에 있고 rounds < 2 이면 'redo', 아니면 'ok'
    return 'ok'

g = al.StateGraph()
g.add_node('research', research).add_node('write', write).add_node('review', review)
g.add_edge(al.START, 'research').add_edge('research', 'write').add_edge('write', 'review')
# TODO: review 뒤 조건부 엣지 {'redo': 'write', 'ok': al.END}
path = []
for event in g.compile().stream({'topic': '전기차', 'rounds': 0}):
    path.append(list(event)[0])
print('경로:', path)
`,
            solution: `import agentlab as al

llm = al.LLM()

def research(state):
    return {'notes': llm.ask(state['topic'] + ' 에 대해 조사해 줘')}

def write(state):
    return {'draft': llm.ask(state['topic'] + ' 블로그 글 작성해 줘'), 'rounds': state['rounds'] + 1}

def review(state):
    return {'review': llm.ask('다음 글을 검토해 줘:\\n' + state['draft'])}

def router(state):
    return 'redo' if '근거' in state['review'] and state['rounds'] < 2 else 'ok'

g = al.StateGraph()
g.add_node('research', research).add_node('write', write).add_node('review', review)
g.add_edge(al.START, 'research').add_edge('research', 'write').add_edge('write', 'review')
g.add_conditional_edges('review', router, {'redo': 'write', 'ok': al.END})
path = []
for event in g.compile().stream({'topic': '전기차', 'rounds': 0}):
    path.append(list(event)[0])
print('경로:', path)
`,
            expect: `경로: ['research', 'write', 'review', 'write', 'review']` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'LangGraph: 상태 그래프', subtitle: '왜 그래프인가 · 상태 · 노드 · 엣지 · 조건 분기', notes: '<p>💬 "07차시 체인으로 04차시 도구 루프를 그릴 수 있을까?" → 되돌아가는 화살표가 없다. 그래서 그래프.</p><p>⏱ 도입 6분</p>' },
          { layout: 'diagram', title: '체인은 직선, 에이전트는 루프와 분기', html: FIG_CHAINVSGRAPH, caption: '되돌아가는 화살표 = 루프, 갈림길 = 분기',
            notes: '<p>아래 그림이 2교시에 만들 에이전트 그래프임을 예고합니다.</p>' },
          { layout: 'table', title: '네 가지 재료', head: ['재료', '뜻', '메서드'], rows: [
            ['State', '함께 읽고 쓰는 dict', '<code>StateGraph()</code>'],
            ['Node', '함수(state) → 바뀐 키만', '<code>add_node</code>'],
            ['Edge', '항상 다음 노드', '<code>add_edge</code>'],
            ['조건부 엣지', '라우터가 고름', '<code>add_conditional_edges</code>'],
            ['START / END', '시작 · 끝', '<code>al.START</code> · <code>al.END</code>']
          ], lead: '이름은 실제 LangGraph 와 같다', notes: '<p>표를 보며 "노드는 바뀐 키만 돌려준다"를 세 번 강조합니다. 퀴즈 1번.</p>' },
          { layout: 'diagram', title: '상태 · 노드 · 엣지', html: FIG_STATEGRAPH, caption: '노드가 돌려준 dict 를 그래프가 상태에 합친다',
            notes: '<p>💬 "write 노드가 notes 를 바꾸지 않았는데 최종 상태에 notes 가 남아 있을까?" → 남는다. 바뀐 키만 합치므로.</p>' },
          { layout: 'code', title: '3노드 그래프', code: `import agentlab as al

llm = al.LLM()
def research(state):
    return {'notes': llm.ask(state['topic'] + ' 에 대해 조사해 줘')}
def write(state):
    return {'draft': llm.ask(state['topic'] + ' 블로그 글 작성해 줘')}
def review(state):
    return {'review': llm.ask('다음 글을 검토해 줘:\\n' + state['draft'])}

g = al.StateGraph()
g.add_node('research', research).add_node('write', write).add_node('review', review)
g.add_edge(al.START, 'research').add_edge('research', 'write')
g.add_edge('write', 'review').add_edge('review', al.END)
g.draw()
final = g.compile().invoke({'topic': '전기차'})
print(list(final))`, points: ['노드 = 그냥 파이썬 함수', '<code>compile()</code> → <code>invoke(초기 상태)</code>', '<code>draw()</code> 로 구조 확인'],
            notes: '<p>▶ 실행. 최종 상태의 키가 늘어난 것을 확인시킵니다.</p>' },
          { layout: 'code', title: 'stream: 노드별 중간 상태', code: `import agentlab as al

def research(state):
    return {'notes': state['topic'] + ' 메모'}
def write(state):
    return {'draft': state['notes'] + ' → 초안'}
def review(state):
    return {'review': '통과'}

g = al.StateGraph()
g.add_node('research', research).add_node('write', write).add_node('review', review)
g.add_edge(al.START, 'research').add_edge('research', 'write')
g.add_edge('write', 'review').add_edge('review', al.END)
for event in g.compile().stream({'topic': '전기차'}):
    print(event)`, points: ['<code>{노드이름: 바뀐 값}</code> 을 하나씩', '진행 표시 · 디버깅', 'LLM 없이도 그래프는 돈다'],
            notes: '<p>▶ 실행. 퀴즈 4번(stream vs invoke)의 근거.</p>' },
          { layout: 'diagram', title: '조건부 엣지로 루프', html: FIG_LOOP, caption: '라우터가 자기 자신으로 되돌리면 루프 · max_steps 가 안전장치',
            notes: '<p>06차시 "점수가 기준 이상인가?"와 04차시 "도구 요청이 있는가?"가 모두 라우터라고 연결.</p>' },
          { layout: 'code', title: '카운터 루프', code: `import agentlab as al

def work(state):
    n = state['count'] + 1
    return {'count': n, 'logs': [f'작업 {n}회']}

def enough(state):
    return 'done' if state['count'] >= 3 else 'again'

g = al.StateGraph()
g.add_node('work', work)
g.add_edge(al.START, 'work')
g.add_conditional_edges('work', enough, {'again': 'work', 'done': al.END})
g.draw()
print(g.compile().invoke({'count': 0, 'logs': []}))`, points: ['라우터 → mapping 의 키', '리스트 키 <code>logs</code> 는 이어 붙음', '<code>max_steps</code> 로 무한 루프 방지'],
            notes: '<p>▶ 실행. 라우터를 늘 \'again\' 으로 바꿔 RuntimeError 를 보여 주면 안전장치가 와닿습니다(예제 8-5).</p>' },
          { layout: 'two', title: '실제 LangGraph 와 비교', left: { title: 'agentlab', bullets: ['<code>g = al.StateGraph()</code>', '<code>g.add_node / add_edge / add_conditional_edges</code>', '<code>app = g.compile()</code>', '<code>app.invoke(state)</code> · <code>app.stream(state)</code>', 's 로 끝나는 리스트 키는 자동으로 이어 붙음'] }, right: { title: 'langgraph (Colab)', bullets: ['<code>class State(TypedDict): …</code>', '<code>g = StateGraph(State)</code>', '같은 메서드 이름', '<code>Annotated[list, add_messages]</code> 리듀서', '<code>app.get_graph().draw_mermaid_png()</code>'] },
            notes: '<p>예제 8-6(run:false) 을 함께 읽습니다. TypedDict 로 상태를 선언하는 것만 추가된다고 안심시킵니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>정답 ③. 없는 키를 내면 KeyError 가 난다는 것도 언급.</p>' },
          { layout: 'practice', title: '실습 8-2. 100 이 넘을 때까지 두 배로', desc: '<p>value 를 두 배로 만드는 노드와 100 이상이면 done 인 라우터로 루프를 만드세요.</p>',
            starter: `import agentlab as al

def double(state):
    return {}            # TODO: value 두 배, steps 기록

def router(state):
    return 'done'        # TODO

g = al.StateGraph()
g.add_node('double', double)
g.add_edge(al.START, 'double')
g.add_conditional_edges('double', router, {'again': 'double', 'done': al.END})
print(g.compile().invoke({'value': 3, 'steps': []}))`, solution: `import agentlab as al

def double(state):
    v = state['value'] * 2
    return {'value': v, 'steps': [v]}

def router(state):
    return 'done' if state['value'] >= 100 else 'again'

g = al.StateGraph()
g.add_node('double', double)
g.add_edge(al.START, 'double')
g.add_conditional_edges('double', router, {'again': 'double', 'done': al.END})
print(g.compile().invoke({'value': 3, 'steps': []}))`, notes: '<p>6분. 3 → 6 → 12 → 24 → 48 → 96 → 192, 6회.</p>' },
          { layout: 'summary', title: '정리', bullets: ['체인은 직선, 에이전트는 <b>루프와 분기</b> → 그래프', '<b>State</b>(dict) · <b>Node</b>(함수 → 바뀐 키) · <b>Edge</b> · <b>조건부 엣지</b>(라우터) · START/END', '<code>compile()</code> → <code>invoke</code>(최종) / <code>stream</code>(노드별) · <code>draw()</code>', '리스트 키는 이어 붙고, <code>max_steps</code> 가 무한 루프를 막는다', '다음 교시: 도구 에이전트 · 체크포인트 · 승인 · 계획-실행-반성을 그래프로'], notes: '<p>⏱ 정리 8분(퀴즈 포함).</p>' }
        ]
      },
      {
        id: 'ag08-2',
        title: 'LangGraph 로 에이전트 다시 만들기',
        minutes: 50,
        goals: ['call_llm / call_tools 노드와 라우터로 도구 에이전트 그래프를 만든다', 'MemorySaver 체크포인트와 thread_id 로 대화를 이어간다', '승인 노드(Human-in-the-loop)와 계획-실행-반성 그래프를 설계한다'],
        flow: [['도입 · 04차시 루프를 그래프로', 5], ['에이전트 그래프 (코드)', 14], ['체크포인트 · 승인 노드 (코드)', 13], ['계획-실행-반성 그래프 (코드)', 10], ['Colab 안내 · 퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '04차시에서 직접 쓴 도구 루프를 떠올려 봅시다: <b>LLM 호출 → 도구 요청이 있으면 실행하고 결과를 메시지에 추가 → 다시 LLM 호출 → 요청이 없으면 끝</b>. 이것은 노드 두 개(<code>call_llm</code> · <code>call_tools</code>)와 라우터 하나로 된 그래프입니다. 상태는 <code>messages</code> 리스트 하나면 충분합니다.' },
          { type: 'figure', html: FIG_AGENTGRAPH, caption: '그림 8-4. 에이전트 그래프. 두 노드가 messages 에 새 메시지를 보태고, 라우터가 tool_calls 유무로 갈림길을 정합니다.' },
          { type: 'code', title: '예제 8-7. call_llm / call_tools 노드와 라우터로 에이전트 그래프 만들기', code: `import agentlab as al
from agentlab.llm import tool_result
from agentlab.tools import result_text

llm = al.LLM()
tools = al.ToolRegistry([al.calculator])

def call_llm(state):                                   # 노드 1: LLM 에게 messages + 도구 목록
    r = llm.chat(state['messages'], tools=list(tools))
    return {'messages': [r.message()]}                 # 새 assistant 메시지만 돌려준다 (이어 붙음)

def call_tools(state):                                 # 노드 2: 요청된 도구를 실행해 tool 메시지로
    last = state['messages'][-1]
    out = []
    for tc in last.get('tool_calls') or []:
        call = al.ToolCall(tc['name'], tc['args'], tc['id'])
        out.append(tool_result(call.id, call.name, result_text(tools.execute(call))))
    return {'messages': out}

def route(state):                                      # 라우터: 도구 요청이 있으면 tools, 없으면 end
    return 'tools' if state['messages'][-1].get('tool_calls') else 'end'

g = al.StateGraph()
g.add_node('call_llm', call_llm).add_node('call_tools', call_tools)
g.add_edge(al.START, 'call_llm')
g.add_conditional_edges('call_llm', route, {'tools': 'call_tools', 'end': al.END})
g.add_edge('call_tools', 'call_llm')                   # 결과를 들고 다시 LLM 으로 (루프)
g.draw()
app = g.compile()

for event in app.stream({'messages': [al.user('1500 * 0.15 는 얼마야?')]}):
    node, update = list(event.items())[0]
    m = update['messages'][-1]
    calls = [f'{tc["name"]}({tc["args"]})' for tc in m.get('tool_calls') or []]
    print(f'▶ {node:<10} {m["role"]:<9} {calls or m["content"]}')`,
            expect: `__start__ → call_llm
call_tools → call_llm
call_llm ⇢ tools:call_tools | end:__end__
▶ call_llm   assistant ["calculator({'expression': '1500 * 0.15'})"]
▶ call_tools tool      {"expression": "1500 * 0.15", "result": 225}
▶ call_llm   assistant 계산 결과는 225 입니다.`,
            desc: '<code>call_llm</code> → (요청 있음) <code>call_tools</code> → <code>call_llm</code> → (요청 없음) END. <code>al.Agent</code> 가 안에서 하던 일을 그래프로 펼친 것입니다. 상태의 <code>messages</code> 는 s 로 끝나는 리스트 키이므로 노드가 돌려준 새 메시지가 <b>이어 붙습니다</b> — LangGraph 의 <code>add_messages</code> 리듀서와 같은 동작입니다.' },
          { type: 'code', title: '예제 8-8. 같은 그래프에 도구를 더 주고 invoke 로 최종 답만 받기', nondeterministic: true, code: `import agentlab as al
from agentlab.llm import tool_result
from agentlab.tools import result_text

llm = al.LLM()
tools = al.ToolRegistry([al.calculator, al.get_weather, al.wiki_search])

def call_llm(state):
    r = llm.chat([al.system('당신은 여행 비서입니다.')] + state['messages'], tools=list(tools))
    return {'messages': [r.message()]}

def call_tools(state):
    out = []
    for tc in state['messages'][-1].get('tool_calls') or []:
        call = al.ToolCall(tc['name'], tc['args'], tc['id'])
        print('  🔧', call.name, call.args)
        out.append(tool_result(call.id, call.name, result_text(tools.execute(call))))
    return {'messages': out}

g = al.StateGraph()
g.add_node('call_llm', call_llm).add_node('call_tools', call_tools)
g.add_edge(al.START, 'call_llm')
g.add_conditional_edges('call_llm', lambda s: 'tools' if s['messages'][-1].get('tool_calls') else 'end',
                        {'tools': 'call_tools', 'end': al.END})
g.add_edge('call_tools', 'call_llm')
app = g.compile(max_steps=10)

for q in ['부산 날씨 알려줘', '파이썬에 대해 검색해줘']:
    final = app.invoke({'messages': [al.user(q)]})
    print('Q:', q)
    print('A:', final['messages'][-1]['content'])
    print('   메시지 수:', len(final['messages']))`,
            desc: '질문에 따라 다른 도구가 호출되고 최종 상태의 <code>messages</code> 는 user → assistant(tool_calls) → tool → assistant 네 개가 됩니다. <code>get_weather</code> · <code>wiki_search</code> 는 브라우저에서 실제 API 를 부르므로 출력이 달라질 수 있습니다. <code>max_steps=10</code> 은 LLM 이 도구를 끝없이 부르는 상황을 막습니다.' },
          { type: 'code', title: '예제 8-9. 실제 LangGraph 도구 에이전트 (Colab 에서 실행)', run: false, code: `from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages          # messages 리듀서 (이어 붙이기)
from langgraph.prebuilt import ToolNode, tools_condition   # call_tools 노드 · 라우터가 미리 만들어져 있다
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

@tool
def calculator(expression: str) -> str:
    """수식을 계산한다"""
    return str(eval(expression, {'__builtins__': {}}, {}))

class State(TypedDict):
    messages: Annotated[list, add_messages]               # ← s 로 끝나는 리스트 키의 자동 이어 붙이기

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash').bind_tools([calculator])

def call_llm(state: State):
    return {'messages': [llm.invoke(state['messages'])]}

g = StateGraph(State)
g.add_node('call_llm', call_llm)
g.add_node('tools', ToolNode([calculator]))               # 예제 8-7 의 call_tools 와 같다
g.add_edge(START, 'call_llm')
g.add_conditional_edges('call_llm', tools_condition)      # tool_calls 있으면 'tools', 없으면 END
g.add_edge('tools', 'call_llm')
app = g.compile()
result = app.invoke({'messages': [('user', '1500 * 0.15 는 얼마야?')]})
print(result['messages'][-1].content)

# 같은 것을 한 줄로: from langgraph.prebuilt import create_react_agent
# app = create_react_agent(llm, [calculator])`,
            desc: '예제 8-7 과 노드 · 엣지가 하나씩 대응합니다. LangGraph 는 <code>ToolNode</code>(call_tools)와 <code>tools_condition</code>(라우터)을 미리 제공하고, 전체를 <code>create_react_agent</code> 한 줄로 줄일 수도 있습니다. 07차시에서 쓴 <code>create_react_agent</code> 의 속이 바로 이 그래프입니다.' },
          { type: 'h', text: '체크포인트: 대화를 이어가기' },
          { type: 'p', html: '그래프는 <code>invoke</code> 가 끝나면 상태를 잊습니다. <b>체크포인트(checkpointer)</b>를 붙이면 <code>thread_id</code> 별로 마지막 상태를 저장하고, 같은 <code>thread_id</code> 로 다시 부르면 <b>그 상태 위에서</b> 실행합니다. 05차시의 대화 기록, 07차시의 <code>session_id</code> 와 같은 생각을 그래프 수준에서 하는 것입니다.' },
          { type: 'figure', html: FIG_CHECKPOINT, caption: '그림 8-5. 왼쪽: thread_id 별 상태 저장. 오른쪽: 되돌리기 어려운 행동 앞의 승인 노드.' },
          { type: 'code', title: '예제 8-10. MemorySaver + thread_id 로 대화 이어가기', code: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()

def chat(state):                                        # 입력(input)을 기록에 붙여 LLM 에게
    msgs = state['messages'] + [al.user(state['input'])]
    r = llm.chat([al.system('당신은 비서입니다.')] + msgs)
    print('🤖', r.content)
    return {'messages': [al.user(state['input']), al.assistant(r.content)]}   # 질문과 답을 기록에 추가

g = al.StateGraph()
g.add_node('chat', chat)
g.add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())              # 체크포인트 연결

u1 = {'thread_id': 'u1'}
app.invoke({'input': '내 이름은 영준이야', 'messages': []}, u1)
app.invoke({'input': '내 이름이 뭐지?'}, u1)              # 같은 thread: 이전 messages 위에서 실행
app.invoke({'input': '내 이름이 뭐지?', 'messages': []}, {'thread_id': 'u2'})   # 다른 thread: 모른다
print('u1 기록:', len(app.get_state(u1)['messages']), '개 메시지')`,
            expect: `🤖 [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
🤖 [비서] 당신의 이름은 영준 입니다.
🤖 [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
u1 기록: 4 개 메시지`,
            desc: '두 번째 호출은 <code>messages</code> 를 넘기지 않았는데도 u1 의 저장된 기록 위에서 실행되어 이름을 기억합니다. <code>app.get_state(config)</code> 로 저장된 상태를 꺼낼 수 있습니다. 실제 LangGraph 에서는 <code>config={\'configurable\': {\'thread_id\': \'u1\'}}</code> 형태이며 agentlab 도 이 형태를 받아들입니다.' },
          { type: 'h', text: 'Human-in-the-loop: 사람의 승인 노드' },
          { type: 'p', html: '이메일 발송 · 결제 · 파일 삭제처럼 <b>되돌리기 어려운 행동</b>은 에이전트가 혼자 결정하면 안 됩니다. 실행 노드 앞에 <b>승인 노드</b>를 두고 라우터가 승인 여부로 분기하게 합니다. 실제 LangGraph 는 <code>interrupt_before=[\'execute\']</code> 로 그래프를 <b>멈췄다가</b> 사람이 확인한 뒤 <b>재개</b>하는 기능을 제공합니다.' },
          { type: 'code', title: '예제 8-11. 승인 노드가 있는 그래프', code: `import agentlab as al

def propose(state):
    return {'action': f"'{state['request']}' 를 위해 고객 120명에게 이메일 발송"}

def approve(state):                                     # 사람 역할 (수업에서는 auto_approve 로 흉내)
    print('👤 승인 요청:', state['action'])
    return {'approved': state.get('auto_approve', False)}

def execute(state):
    print('✅ 실행:', state['action'])
    return {'result': 'sent'}

def cancel(state):
    print('⛔ 취소: 사람이 승인하지 않음')
    return {'result': 'cancelled'}

g = al.StateGraph()
g.add_node('propose', propose).add_node('approve', approve).add_node('execute', execute).add_node('cancel', cancel)
g.add_edge(al.START, 'propose').add_edge('propose', 'approve')
g.add_conditional_edges('approve', lambda s: 'yes' if s['approved'] else 'no', {'yes': 'execute', 'no': 'cancel'})
g.add_edge('execute', al.END).add_edge('cancel', al.END)
app = g.compile()

for ok in (True, False):
    final = app.invoke({'request': '신제품 홍보', 'auto_approve': ok})
    print('  결과:', final['result'])`,
            expect: `👤 승인 요청: '신제품 홍보' 를 위해 고객 120명에게 이메일 발송
✅ 실행: '신제품 홍보' 를 위해 고객 120명에게 이메일 발송
  결과: sent
👤 승인 요청: '신제품 홍보' 를 위해 고객 120명에게 이메일 발송
⛔ 취소: 사람이 승인하지 않음
  결과: cancelled`,
            desc: '브라우저에서는 <code>input()</code> 대신 상태의 <code>auto_approve</code> 로 사람의 결정을 흉내 냈습니다. 실제 서비스에서는 승인 노드에서 그래프를 멈추고(체크포인트에 저장), 사람이 버튼을 누르면 같은 <code>thread_id</code> 로 재개합니다 — 체크포인트와 승인이 함께 쓰이는 이유입니다.' },
          { type: 'code', title: '예제 8-12. 실제 LangGraph 의 interrupt_before 와 MemorySaver (Colab 에서 실행)', run: false, code: `from langgraph.checkpoint.memory import MemorySaver       # agentlab.graph.MemorySaver

memory = MemorySaver()
app = g.compile(checkpointer=memory, interrupt_before=['execute'])   # execute 직전에 멈춘다
config = {'configurable': {'thread_id': 'order-1'}}

app.invoke({'request': '신제품 홍보'}, config)        # propose → approve 까지 실행하고 멈춤
print(app.get_state(config).next)                     # ('execute',) — 다음에 실행될 노드

# 사람이 확인한 뒤 … 재개: 입력을 None 으로 주면 멈춘 곳부터 이어서 실행
app.invoke(None, config)

# 대화형 에이전트에 체크포인트 붙이기 (예제 8-10 에 해당)
from langgraph.prebuilt import create_react_agent
agent = create_react_agent(llm, tools, checkpointer=MemorySaver())
agent.invoke({'messages': [('user', '내 이름은 영준이야')]}, {'configurable': {'thread_id': 'u1'}})
agent.invoke({'messages': [('user', '내 이름이 뭐지?')]}, {'configurable': {'thread_id': 'u1'}})   # 기억한다`,
            desc: '<code>interrupt_before</code> 로 멈춘 그래프는 체크포인트에 상태가 남아 있어 <code>invoke(None, config)</code> 로 재개됩니다. 상태를 고쳐서(<code>update_state</code>) 재개할 수도 있어 "사람이 계획을 수정한 뒤 계속"도 가능합니다. 13차시 안전 · 운영에서 다시 만납니다.' },
          { type: 'h', text: '계획-실행-반성 그래프: 06차시를 그래프로' },
          { type: 'figure', html: FIG_PER, caption: '그림 8-6. Planner 와 Reflector 가 노드가 되고, 두 라우터(단계 남음? · 점수 충분?)가 루프를 만듭니다.' },
          { type: 'code', title: '예제 8-13. plan → execute(루프) → reflect → revise(루프) 그래프', code: `import agentlab as al

llm = al.LLM()
planner, reflector = al.Planner(llm, max_steps=3), al.Reflector(llm)

def plan(state):
    return {'steps': planner.plan(state['goal']), 'idx': 0}

def execute(state):                                      # 한 번에 한 단계만
    step = state['steps'][state['idx']]
    result = llm.ask(step + '해 줘')
    return {'results': [result], 'idx': state['idx'] + 1}

def more_steps(state):
    return 'more' if state['idx'] < len(state['steps']) else 'reflect'

def reflect(state):
    ev = reflector.score(state['results'][-1])
    print(f'  📊 평가 {state["rounds"] + 1}: {ev["score"]}점 — {ev["suggestion"]}')
    return {'score': ev['score'], 'suggestion': ev['suggestion'], 'rounds': state['rounds'] + 1}

def good_enough(state):                                  # 점수 또는 횟수 상한
    return 'done' if state['score'] >= 8 or state['rounds'] >= 2 else 'revise'

def revise(state):
    return {'results': [reflector.revise(state['results'][-1], state['suggestion'])]}

g = al.StateGraph()
for name, fn in [('plan', plan), ('execute', execute), ('reflect', reflect), ('revise', revise)]:
    g.add_node(name, fn)
g.add_edge(al.START, 'plan').add_edge('plan', 'execute')
g.add_conditional_edges('execute', more_steps, {'more': 'execute', 'reflect': 'reflect'})
g.add_conditional_edges('reflect', good_enough, {'revise': 'revise', 'done': al.END})
g.add_edge('revise', 'reflect')
g.draw()
app = g.compile(max_steps=20)
path = []
for event in app.stream({'goal': '전기차 시장 조사 보고서 만들기', 'results': [], 'rounds': 0}):
    path.append(list(event)[0])
print('경로:', ' → '.join(path))
print('결과물 수:', len(app.invoke({'goal': '전기차 시장 조사 보고서 만들기', 'results': [], 'rounds': 0})['results']))`,
            expect: `__start__ → plan
plan → execute
revise → reflect
execute ⇢ more:execute | reflect:reflect
reflect ⇢ revise:revise | done:__end__
  📊 평가 1: 7점 — 근거 문장을 추가하고 문장을 짧게 나눈다
  📊 평가 2: 7점 — 근거 문장을 추가하고 문장을 짧게 나눈다
경로: plan → execute → execute → execute → reflect → revise → reflect
  📊 평가 1: 7점 — 근거 문장을 추가하고 문장을 짧게 나눈다
  📊 평가 2: 7점 — 근거 문장을 추가하고 문장을 짧게 나눈다
결과물 수: 4`,
            desc: '<code>execute</code> 가 3단계를 돌고(루프 1), <code>reflect</code> 가 7점을 주어 <code>revise</code> 로 갔다가 다시 평가(루프 2), <code>rounds >= 2</code> 상한에 걸려 END 로 갑니다. 모의 LLM 은 항상 7점이므로 상한이 없으면 끝나지 않습니다 — 06차시의 안전장치가 라우터 안에 들어간 모습입니다. <code>results</code> 는 리스트 키라 단계 결과 3개 + 수정본 1개 = 4개가 쌓입니다.' },
          { type: 'table', head: ['Part 2 에서 직접 만든 것', '그래프에서의 모습', '실제 LangGraph'], rows: [
            ['04 도구 루프 <code>while</code>', '<code>call_llm</code> ⇄ <code>call_tools</code> + 라우터', '<code>ToolNode</code> · <code>tools_condition</code> · <code>create_react_agent</code>'],
            ['05 대화 기록 <code>ConversationMemory</code>', '<code>messages</code> 상태 + 체크포인트', '<code>add_messages</code> · <code>MemorySaver</code> · <code>thread_id</code>'],
            ['06 <code>Planner.execute</code>', '<code>plan</code> → <code>execute</code> 루프', '조건부 엣지 <code>more_steps</code>'],
            ['06 <code>Reflector</code> while 루프', '<code>reflect</code> ⇄ <code>revise</code> + 상한 라우터', '조건부 엣지 <code>good_enough</code>'],
            ['(새로) 사람의 승인', '<code>approve</code> 노드 + 분기', '<code>interrupt_before</code> · <code>update_state</code>']
          ], caption: '표 8-2. 지금까지의 모든 루프가 그래프의 노드와 라우터로 옮겨집니다.' },
          { type: 'colab', title: 'Colab 실습 08 — 실제 LangGraph 로 에이전트 그래프 만들기', html: '<p><code>pip install langgraph langchain-google-genai</code> 로 설치하고 ① <code>TypedDict</code> 상태 + 카운터 루프 ② <code>add_messages</code> · <code>ToolNode</code> · <code>tools_condition</code> 으로 도구 에이전트 그래프 ③ <code>MemorySaver</code> + <code>thread_id</code> 로 대화 이어가기 ④ <code>interrupt_before</code> 로 승인 멈춤 · 재개 ⑤ <code>create_react_agent</code> 한 줄 버전을 실행합니다. <code>get_graph().draw_mermaid_png()</code> 로 그래프 그림도 확인하세요.</p>' },
          { type: 'callout', kind: 'more', title: '더 알아보기: 서브그래프와 멀티 에이전트', html: '그래프의 노드는 <b>다른 그래프</b>일 수도 있습니다(서브그래프). "조사 에이전트 그래프"와 "작성 에이전트 그래프"를 노드로 가진 상위 그래프가 바로 <b>멀티 에이전트</b>입니다. 09차시 CrewAI 와 10차시 AutoGen 은 이 구조를 각자의 방식(역할 팀 · 대화)으로 제공하고, 12차시 프로젝트에서 직접 설계합니다.' },
          { type: 'callout', kind: 'info', teacher: true, title: '🧑‍🏫 수업 준비 체크리스트', html: '<ul><li>예제 8-7 의 <code>tool_calls</code> 에는 <code>id</code> 가 있지만(매번 바뀜) 출력에서는 이름과 인자만 보여 줌 — 학생이 <code>print(m)</code> 으로 전체를 보게 해도 좋음</li><li>예제 8-13 은 LLM 호출이 7~8번이라 실제 키로는 10~20초 걸림 — 시연은 모의 LLM 으로, 비교는 Colab 에서</li><li>칠판에 그림 8-4 를 크게 그려 두고 수업 내내 가리키며 설명(학생이 그래프를 손으로 그려 보게 하는 활동 권장)</li><li>Colab 08 의 <code>draw_mermaid_png</code> 는 네트워크가 필요(mermaid.ink) — 막혀 있으면 <code>draw_ascii()</code> 로 대체</li></ul>' },
          { type: 'callout', kind: 'warn', teacher: true, title: '🧑‍🏫 자주 나오는 오개념 · 오류', html: '<ul><li><b>"노드가 전체 상태를 돌려줘야 한다"</b> → 바뀐 키만. 전체를 돌려줘도 동작하지만 리스트 키가 두 번 붙는 버그가 생깁니다.</li><li><b>"라우터가 True/False 를 돌려준다"</b> → mapping 의 키(문자열). <code>KeyError: \'True\'</code> 가 나면 이 문제입니다.</li><li><b>"<code>add_edge(\'call_tools\', \'call_llm\')</code> 를 빼먹음"</b> → 도구 결과를 들고 돌아가지 않아 END 로 빠집니다(agentlab 은 엣지가 없으면 END).</li><li><b>"체크포인트가 있으면 messages 를 매번 넘겨야 한다"</b> → 넘기면 덮어씁니다(agentlab). 입력은 <code>input</code> 키로, 기록은 그래프가 관리하게 합니다.</li><li><b>"interrupt 는 오류다"</b> → 의도된 멈춤입니다. <code>invoke(None, config)</code> 로 재개.</li></ul>' },
          { type: 'callout', kind: 'tip', teacher: true, title: '🧑‍🏫 평가 루브릭 (실습 8-4 ~ 8-6)', html: '<table><tr><th>항목</th><th>우수 (3)</th><th>보통 (2)</th><th>미흡 (1)</th></tr><tr><td>그래프 구조</td><td>상태 키 · 노드 · 엣지 · 라우터를 draw() 로 설명</td><td>동작하지만 설명 부족</td><td>엣지 누락 · 미동작</td></tr><tr><td>노드 반환</td><td>바뀐 키만 dict 로 반환</td><td>전체 상태 반환</td><td>dict 아님</td></tr><tr><td>안전장치</td><td>라우터 상한 + max_steps 모두</td><td>하나만</td><td>없음</td></tr><tr><td>Colab 대응</td><td>agentlab ↔ LangGraph 이름을 짝지어 설명</td><td>일부</td><td>못함</td></tr></table>' }
        ],
        practice: [
          { title: '실습 8-4. 에이전트 그래프에 도구 추가하기', level: 1,
            desc: '<p>예제 8-7 의 <code>tools</code> 에 <code>al.now</code> 를 추가하고 "지금 몇 시야?" 를 <code>invoke</code> 해 최종 답과 메시지 수를 출력하세요. 그래프 코드는 한 줄도 바꿀 필요가 없다는 점을 확인합니다.</p>',
            hint: '<code>al.ToolRegistry([al.calculator, al.now])</code>',
            nondeterministic: true,
            starter: `import agentlab as al
from agentlab.llm import tool_result
from agentlab.tools import result_text

llm = al.LLM()
tools = al.ToolRegistry([al.calculator])     # TODO: al.now 추가

def call_llm(state):
    r = llm.chat(state['messages'], tools=list(tools))
    return {'messages': [r.message()]}

def call_tools(state):
    out = []
    for tc in state['messages'][-1].get('tool_calls') or []:
        call = al.ToolCall(tc['name'], tc['args'], tc['id'])
        out.append(tool_result(call.id, call.name, result_text(tools.execute(call))))
    return {'messages': out}

g = al.StateGraph()
g.add_node('call_llm', call_llm).add_node('call_tools', call_tools)
g.add_edge(al.START, 'call_llm')
g.add_conditional_edges('call_llm', lambda s: 'tools' if s['messages'][-1].get('tool_calls') else 'end', {'tools': 'call_tools', 'end': al.END})
g.add_edge('call_tools', 'call_llm')
app = g.compile()
# TODO: '지금 몇 시야?' 로 invoke → 최종 답, 메시지 수 출력
`,
            solution: `import agentlab as al
from agentlab.llm import tool_result
from agentlab.tools import result_text

llm = al.LLM()
tools = al.ToolRegistry([al.calculator, al.now])

def call_llm(state):
    r = llm.chat(state['messages'], tools=list(tools))
    return {'messages': [r.message()]}

def call_tools(state):
    out = []
    for tc in state['messages'][-1].get('tool_calls') or []:
        call = al.ToolCall(tc['name'], tc['args'], tc['id'])
        out.append(tool_result(call.id, call.name, result_text(tools.execute(call))))
    return {'messages': out}

g = al.StateGraph()
g.add_node('call_llm', call_llm).add_node('call_tools', call_tools)
g.add_edge(al.START, 'call_llm')
g.add_conditional_edges('call_llm', lambda s: 'tools' if s['messages'][-1].get('tool_calls') else 'end', {'tools': 'call_tools', 'end': al.END})
g.add_edge('call_tools', 'call_llm')
app = g.compile()
final = app.invoke({'messages': [al.user('지금 몇 시야?')]})
print('답:', final['messages'][-1]['content'])
print('메시지 수:', len(final['messages']))
` },
          { title: '실습 8-5. 두 사용자의 대화를 따로 기억하기', level: 2,
            desc: '<p>예제 8-10 의 그래프로 두 thread(<code>u1</code> · <code>u2</code>)에 각각 "내 이름은 영준이야" / "내 이름은 지민이야" 를 말한 뒤, 두 thread 에 "내 이름이 뭐지?" 를 물어 각자 자기 이름을 답하는지 확인하세요. 마지막에 각 thread 의 메시지 수를 출력합니다.</p>',
            hint: '첫 호출에는 <code>\'messages\': []</code> 를 넣고, 이후 호출에는 <code>input</code> 만 넣습니다.',
            starter: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()

def chat(state):
    msgs = state['messages'] + [al.user(state['input'])]
    r = llm.chat([al.system('당신은 비서입니다.')] + msgs)
    return {'messages': [al.user(state['input']), al.assistant(r.content)]}

g = al.StateGraph()
g.add_node('chat', chat).add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())
# TODO: u1 에 '내 이름은 영준이야', u2 에 '내 이름은 지민이야'
# TODO: 두 thread 에 '내 이름이 뭐지?' 를 물어 답 출력
# TODO: 각 thread 의 메시지 수 출력
`,
            solution: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()

def chat(state):
    msgs = state['messages'] + [al.user(state['input'])]
    r = llm.chat([al.system('당신은 비서입니다.')] + msgs)
    return {'messages': [al.user(state['input']), al.assistant(r.content)]}

g = al.StateGraph()
g.add_node('chat', chat).add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())
app.invoke({'input': '내 이름은 영준이야', 'messages': []}, {'thread_id': 'u1'})
app.invoke({'input': '내 이름은 지민이야', 'messages': []}, {'thread_id': 'u2'})
for t in ['u1', 'u2']:
    final = app.invoke({'input': '내 이름이 뭐지?'}, {'thread_id': t})
    print(t, '→', final['messages'][-1]['content'], '| 메시지', len(final['messages']), '개')
`,
            expect: `u1 → [비서] 당신의 이름은 영준 입니다. | 메시지 4 개
u2 → [비서] 당신의 이름은 지민 입니다. | 메시지 4 개` },
          { title: '실습 8-6. (도전) 승인 거부 시 다시 제안하기', level: 3,
            desc: '<p>예제 8-11 을 고쳐, 승인이 거부되면 <code>cancel</code> 대신 <code>propose</code> 로 돌아가 <b>더 작은 규모</b>의 행동을 다시 제안하게 하세요. <code>propose</code> 는 <code>scale</code>(처음 120)을 절반으로 줄여 제안하고, <code>approve</code> 는 <code>scale &lt;= 30</code> 이면 승인합니다. 지나간 노드 경로와 최종 행동을 출력하세요.</p>',
            hint: '<code>propose</code> 가 <code>{\'scale\': state[\'scale\'] // 2 if state.get(\'action\') else state[\'scale\'], ...}</code> 처럼 두 번째부터 줄이거나, 처음 scale 을 240 으로 두고 매번 절반으로 줄여도 됩니다.',
            starter: `import agentlab as al

def propose(state):
    scale = state['scale']
    # TODO: 이미 제안한 적이 있으면(action 키 존재) scale 을 절반으로
    return {'scale': scale, 'action': f'고객 {scale}명에게 이메일 발송'}

def approve(state):
    print('👤 승인 요청:', state['action'])
    return {'approved': state['scale'] <= 30}

def execute(state):
    print('✅ 실행:', state['action'])
    return {'result': 'sent'}

g = al.StateGraph()
g.add_node('propose', propose).add_node('approve', approve).add_node('execute', execute)
g.add_edge(al.START, 'propose').add_edge('propose', 'approve').add_edge('execute', al.END)
# TODO: approve 뒤 조건부 엣지 {'yes': 'execute', 'no': 'propose'}
path = []
for event in g.compile(max_steps=20).stream({'scale': 120}):
    path.append(list(event)[0])
print('경로:', path)
`,
            solution: `import agentlab as al

def propose(state):
    scale = state['scale'] // 2 if state.get('action') else state['scale']
    return {'scale': scale, 'action': f'고객 {scale}명에게 이메일 발송'}

def approve(state):
    print('👤 승인 요청:', state['action'])
    return {'approved': state['scale'] <= 30}

def execute(state):
    print('✅ 실행:', state['action'])
    return {'result': 'sent'}

g = al.StateGraph()
g.add_node('propose', propose).add_node('approve', approve).add_node('execute', execute)
g.add_edge(al.START, 'propose').add_edge('propose', 'approve').add_edge('execute', al.END)
g.add_conditional_edges('approve', lambda s: 'yes' if s['approved'] else 'no', {'yes': 'execute', 'no': 'propose'})
path = []
for event in g.compile(max_steps=20).stream({'scale': 120}):
    path.append(list(event)[0])
print('경로:', path)
`,
            expect: `👤 승인 요청: 고객 120명에게 이메일 발송
👤 승인 요청: 고객 60명에게 이메일 발송
👤 승인 요청: 고객 30명에게 이메일 발송
✅ 실행: 고객 30명에게 이메일 발송
경로: ['propose', 'approve', 'propose', 'approve', 'propose', 'approve', 'execute']` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: 'LangGraph 로 에이전트 다시 만들기', subtitle: '도구 루프 · 체크포인트 · 승인 · 계획-실행-반성', notes: '<p>💬 "04차시 while 루프의 조건문은 그래프에서 무엇이 될까?" → 라우터. 오늘은 지금까지의 모든 루프를 그래프로 옮깁니다.</p><p>⏱ 도입 5분</p>' },
          { layout: 'diagram', title: '에이전트 그래프', html: FIG_AGENTGRAPH, caption: 'call_llm ⇄ call_tools · 라우터 = tool_calls 있나?',
            notes: '<p>칠판에 이 그림을 그려 두고 수업 내내 사용. messages 가 쌓이는 순서(user → assistant(tool_calls) → tool → assistant)를 손으로 적어 봅니다.</p>' },
          { layout: 'code', title: 'call_llm · call_tools · 라우터', code: `import agentlab as al
from agentlab.llm import tool_result
from agentlab.tools import result_text

llm = al.LLM()
tools = al.ToolRegistry([al.calculator])

def call_llm(state):
    r = llm.chat(state['messages'], tools=list(tools))
    return {'messages': [r.message()]}
def call_tools(state):
    out = []
    for tc in state['messages'][-1].get('tool_calls') or []:
        call = al.ToolCall(tc['name'], tc['args'], tc['id'])
        out.append(tool_result(call.id, call.name, result_text(tools.execute(call))))
    return {'messages': out}
def route(state):
    return 'tools' if state['messages'][-1].get('tool_calls') else 'end'`, points: ['노드 1: LLM + 도구 목록 → assistant 메시지', '노드 2: 요청 실행 → tool 메시지', '라우터: <code>tool_calls</code> 유무'],
            notes: '<p>이 슬라이드는 노드 정의만(실행하면 출력 없음). 다음 슬라이드에서 그래프를 조립합니다.</p>' },
          { layout: 'code', title: '그래프 조립과 stream', code: `import agentlab as al
from agentlab.llm import tool_result

llm = al.LLM()
tools = al.ToolRegistry([al.calculator])
def call_llm(s):
    return {'messages': [llm.chat(s['messages'], tools=list(tools)).message()]}
def call_tools(s):
    tc = s['messages'][-1]['tool_calls'][0]
    call = al.ToolCall(tc['name'], tc['args'], tc['id'])
    return {'messages': [tool_result(call.id, call.name, tools.execute(call))]}
g = al.StateGraph()
g.add_node('call_llm', call_llm).add_node('call_tools', call_tools)
g.add_edge(al.START, 'call_llm').add_edge('call_tools', 'call_llm')
g.add_conditional_edges('call_llm', lambda s: 'tools' if s['messages'][-1].get('tool_calls') else 'end',
                        {'tools': 'call_tools', 'end': al.END})
for ev in g.compile().stream({'messages': [al.user('1500 * 0.15 는?')]}):
    print(list(ev)[0], '→', ev[list(ev)[0]]['messages'][-1]['role'])`, points: ['<code>call_tools → call_llm</code> 엣지 = 루프', '<code>messages</code> 는 이어 붙음', 'LangGraph: <code>ToolNode</code> · <code>tools_condition</code>'],
            notes: '<p>▶ 실행. 출력 순서 call_llm → call_tools → call_llm 을 그림의 화살표와 대응시킵니다.</p>' },
          { layout: 'two', title: '실제 LangGraph 에이전트', left: { title: 'langgraph (Colab)', bullets: ['<code>class State(TypedDict): messages: Annotated[list, add_messages]</code>', '<code>llm.bind_tools([calculator])</code>', '<code>g.add_node(\'tools\', ToolNode([calculator]))</code>', '<code>g.add_conditional_edges(\'call_llm\', tools_condition)</code>', '한 줄: <code>create_react_agent(llm, tools)</code>'] }, right: { title: 'agentlab (브라우저)', bullets: ['<code>messages</code> 리스트 키 자동 이어 붙임', '<code>llm.chat(msgs, tools=…)</code>', '<code>call_tools</code> 함수 직접 작성', '<code>route</code> 함수 직접 작성', '<code>al.Agent(llm, tools)</code>'] },
            notes: '<p>예제 8-9(run:false) 와 함께. 07차시 create_react_agent 의 속이 이 그래프라는 것을 회수.</p>' },
          { layout: 'diagram', title: '체크포인트와 승인 노드', html: FIG_CHECKPOINT, caption: 'thread_id 별 상태 저장 · 되돌리기 어려운 행동 앞의 승인',
            notes: '<p>왼쪽은 05 · 07차시와 같은 생각. 오른쪽은 13차시 안전으로 이어진다고 예고.</p>' },
          { layout: 'code', title: 'MemorySaver + thread_id', code: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()
def chat(s):
    r = llm.chat([al.system('당신은 비서입니다.')] + s['messages'] + [al.user(s['input'])])
    print('🤖', r.content)
    return {'messages': [al.user(s['input']), al.assistant(r.content)]}

g = al.StateGraph()
g.add_node('chat', chat).add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())
u1 = {'thread_id': 'u1'}
app.invoke({'input': '내 이름은 영준이야', 'messages': []}, u1)
app.invoke({'input': '내 이름이 뭐지?'}, u1)               # 이어서
app.invoke({'input': '내 이름이 뭐지?', 'messages': []}, {'thread_id': 'u2'})`, points: ['같은 thread → 저장된 상태 위에서', '입력은 <code>input</code>, 기록은 그래프가', 'LangGraph: <code>configurable.thread_id</code>'],
            notes: '<p>▶ 실행. u2 는 모른다는 것으로 thread 분리를 확인. 실습 8-5 로 연결.</p>' },
          { layout: 'code', title: '승인 노드 (Human-in-the-loop)', code: `import agentlab as al

def propose(s):
    return {'action': f"'{s['request']}' 이메일 발송"}
def approve(s):
    print('👤 승인 요청:', s['action'])
    return {'approved': s.get('auto_approve', False)}
def execute(s):
    print('✅ 실행'); return {'result': 'sent'}
def cancel(s):
    print('⛔ 취소'); return {'result': 'cancelled'}
g = al.StateGraph()
g.add_node('propose', propose).add_node('approve', approve).add_node('execute', execute).add_node('cancel', cancel)
g.add_edge(al.START, 'propose').add_edge('propose', 'approve')
g.add_conditional_edges('approve', lambda s: 'yes' if s['approved'] else 'no', {'yes': 'execute', 'no': 'cancel'})
g.add_edge('execute', al.END).add_edge('cancel', al.END)
for ok in (True, False):
    print(g.compile().invoke({'request': '신제품 홍보', 'auto_approve': ok})['result'])`, points: ['되돌리기 어려운 행동 앞에', '수업에서는 <code>auto_approve</code> 로 흉내', 'LangGraph: <code>interrupt_before</code> → <code>invoke(None, config)</code>'],
            notes: '<p>▶ 실행. 💬 "어떤 도구 앞에 승인이 필요할까?" → 결제, 삭제, 발송, 외부 게시.</p>' },
          { layout: 'diagram', title: '계획-실행-반성 그래프', html: FIG_PER, caption: '06차시의 Planner · Reflector 가 노드가 된다',
            notes: '<p>두 라우터(단계 남음? · 점수 충분?)를 찾게 합니다. rounds 상한이 라우터 안에 있는 이유 = 06차시 안전장치.</p>' },
          { layout: 'code', title: 'plan → execute 루프 → reflect ⇄ revise', code: `import agentlab as al

llm = al.LLM()
planner, ref = al.Planner(llm, max_steps=3), al.Reflector(llm)
def plan(s):     return {'steps': planner.plan(s['goal']), 'idx': 0}
def execute(s):  return {'results': [llm.ask(s['steps'][s['idx']] + '해 줘')], 'idx': s['idx'] + 1}
def reflect(s):
    ev = ref.score(s['results'][-1])
    return {'score': ev['score'], 'suggestion': ev['suggestion'], 'rounds': s['rounds'] + 1}
def revise(s):   return {'results': [ref.revise(s['results'][-1], s['suggestion'])]}
g = al.StateGraph()
for n, f in [('plan', plan), ('execute', execute), ('reflect', reflect), ('revise', revise)]:
    g.add_node(n, f)
g.add_edge(al.START, 'plan').add_edge('plan', 'execute').add_edge('revise', 'reflect')
g.add_conditional_edges('execute', lambda s: 'more' if s['idx'] < len(s['steps']) else 'reflect', {'more': 'execute', 'reflect': 'reflect'})
g.add_conditional_edges('reflect', lambda s: 'done' if s['score'] >= 8 or s['rounds'] >= 2 else 'revise', {'revise': 'revise', 'done': al.END})
path = [list(e)[0] for e in g.compile(max_steps=20).stream({'goal': '전기차 시장 조사 보고서', 'results': [], 'rounds': 0})]
print(' → '.join(path))`, points: ['루프 1: 단계가 남았나?', '루프 2: 점수 충분한가? + <b>rounds 상한</b>', '모의 LLM 은 늘 7점 → 상한으로 종료'],
            notes: '<p>▶ 실행. 경로 출력을 그림 8-6 위에서 따라갑니다. 실제 키로는 10초 이상 걸림.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[3].q, options: QUIZ2[3].options, answer: QUIZ2[3].answer, explain: QUIZ2[3].explain, notes: '<p>정답 ②. max_steps 는 최후의 보루, 라우터 상한이 먼저.</p>' },
          { layout: 'practice', title: '실습 8-5. 두 사용자의 대화', desc: '<p>u1 · u2 두 thread 에 각자 이름을 말한 뒤 "내 이름이 뭐지?" 를 물어 따로 기억하는지 확인하세요.</p>',
            starter: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()
def chat(s):
    r = llm.chat([al.system('당신은 비서입니다.')] + s['messages'] + [al.user(s['input'])])
    return {'messages': [al.user(s['input']), al.assistant(r.content)]}
g = al.StateGraph()
g.add_node('chat', chat).add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())
# TODO: u1 '내 이름은 영준이야' · u2 '내 이름은 지민이야' → 각각 '내 이름이 뭐지?'`, solution: `import agentlab as al
from agentlab.graph import MemorySaver

llm = al.LLM()
def chat(s):
    r = llm.chat([al.system('당신은 비서입니다.')] + s['messages'] + [al.user(s['input'])])
    return {'messages': [al.user(s['input']), al.assistant(r.content)]}
g = al.StateGraph()
g.add_node('chat', chat).add_edge(al.START, 'chat').add_edge('chat', al.END)
app = g.compile(checkpointer=MemorySaver())
app.invoke({'input': '내 이름은 영준이야', 'messages': []}, {'thread_id': 'u1'})
app.invoke({'input': '내 이름은 지민이야', 'messages': []}, {'thread_id': 'u2'})
for t in ['u1', 'u2']:
    print(t, app.invoke({'input': '내 이름이 뭐지?'}, {'thread_id': t})['messages'][-1]['content'])`, notes: '<p>6분. 첫 호출에만 messages: [] 를 넣는 이유(리스트 키 초기화)를 질문으로.</p>' },
          { layout: 'bullets', title: 'Colab 으로 이어서', bullets: ['🟠 Colab 실습 08 — <code>pip install langgraph langchain-google-genai</code>', '① <code>TypedDict</code> 상태 + 카운터 루프', '② <code>add_messages</code> · <code>ToolNode</code> · <code>tools_condition</code> 에이전트', '③ <code>MemorySaver</code> + <code>thread_id</code> ④ <code>interrupt_before</code> 승인', '⑤ <code>create_react_agent</code> · <code>draw_mermaid_png()</code>'],
            notes: '<p>과제: Colab 08 의 ✏️ 문제. 그래프 그림(mermaid)을 캡처해 제출하게 하면 구조 이해를 평가하기 좋습니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['도구 에이전트 = <code>call_llm</code> ⇄ <code>call_tools</code> + <code>tool_calls</code> 라우터, <code>messages</code> 누적', '체크포인트(<code>MemorySaver</code>) + <code>thread_id</code> → 대화 이어가기', '승인 노드 · <code>interrupt_before</code> → 사람이 확인하는 Human-in-the-loop', '계획-실행-반성 = <code>Planner</code> · <code>Reflector</code> 가 노드, 라우터에 횟수 상한', '다음 차시: 역할 팀으로 일하는 CrewAI'], notes: '<p>⏱ 정리 8분(퀴즈 포함). Part 2 의 모든 루프가 그래프로 옮겨졌음을 표 8-2 로 마무리.</p>' }
        ]
      }
    ]
  });
})();
