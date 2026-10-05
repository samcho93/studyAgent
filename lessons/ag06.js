/* 06차시 계획과 반성: ReAct · Plan-and-Execute · Self-Correction */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 6-1. 목표 트리 */
  const FIG_GOALTREE = `<svg viewBox="0 0 700 300" role="img" aria-label="큰 목표가 세 개의 하위 목표로, 하위 목표가 다시 작은 작업으로 쪼개지는 목표 트리">
  ${ARROW('m06a1')}
  <rect x="250" y="16" width="200" height="46" rx="12" class="p1"/><text x="350" y="45" text-anchor="middle" class="tx-w">🎯 전기차 시장 보고서 만들기</text>
  <rect x="30" y="110" width="180" height="42" rx="10" class="p2s"/><text x="120" y="136" text-anchor="middle" class="tx">① 정보 조사</text>
  <rect x="260" y="110" width="180" height="42" rx="10" class="p2s"/><text x="350" y="136" text-anchor="middle" class="tx">② 핵심 정리</text>
  <rect x="490" y="110" width="180" height="42" rx="10" class="p2s"/><text x="580" y="136" text-anchor="middle" class="tx">③ 보고서 작성 · 검토</text>
  <line x1="320" y1="64" x2="130" y2="106" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="350" y1="64" x2="350" y2="106" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="380" y1="64" x2="570" y2="106" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <rect x="10" y="200" width="100" height="36" rx="8" class="p3s"/><text x="60" y="223" text-anchor="middle" class="tx-m">🔍 위키 검색</text>
  <rect x="125" y="200" width="100" height="36" rx="8" class="p3s"/><text x="175" y="223" text-anchor="middle" class="tx-m">🧮 시장 규모 계산</text>
  <rect x="270" y="200" width="160" height="36" rx="8" class="p3s"/><text x="350" y="223" text-anchor="middle" class="tx-m">📝 세 문장으로 요약</text>
  <rect x="470" y="200" width="100" height="36" rx="8" class="p3s"/><text x="520" y="223" text-anchor="middle" class="tx-m">✍️ 초안 작성</text>
  <rect x="585" y="200" width="100" height="36" rx="8" class="p3s"/><text x="635" y="223" text-anchor="middle" class="tx-m">🔎 비평 · 수정</text>
  <line x1="100" y1="154" x2="70" y2="196" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="140" y1="154" x2="170" y2="196" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="350" y1="154" x2="350" y2="196" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="560" y1="154" x2="530" y2="196" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <line x1="600" y1="154" x2="630" y2="196" class="ln" stroke-width="2" marker-end="url(#m06a1)"/>
  <text x="350" y="275" text-anchor="middle" class="tx-m">큰 목표 → 하위 목표 → 도구 하나로 해결되는 작은 작업 (잎)</text>
</svg>`;

  /* 그림 6-2. ReAct 루프 */
  const FIG_REACT = `<svg viewBox="0 0 700 300" role="img" aria-label="생각, 행동, 관찰이 순환하다가 최종 답으로 빠져나가는 ReAct 루프">
  ${ARROW('m06a2')}
  <rect x="40" y="110" width="150" height="60" rx="14" class="p1"/><text x="115" y="136" text-anchor="middle" class="tx-w">Thought</text><text x="115" y="156" text-anchor="middle" class="tx-w">생각 (Reason)</text>
  <rect x="275" y="110" width="150" height="60" rx="14" class="p2"/><text x="350" y="136" text-anchor="middle" class="tx-w">Action</text><text x="350" y="156" text-anchor="middle" class="tx-w">행동 = 도구 호출</text>
  <rect x="510" y="110" width="150" height="60" rx="14" class="p3"/><text x="585" y="136" text-anchor="middle" class="tx-w">Observation</text><text x="585" y="156" text-anchor="middle" class="tx-w">관찰 = 도구 결과</text>
  <line x1="192" y1="140" x2="271" y2="140" class="ln" stroke-width="2.5" marker-end="url(#m06a2)"/>
  <line x1="427" y1="140" x2="506" y2="140" class="ln" stroke-width="2.5" marker-end="url(#m06a2)"/>
  <path d="M585 172 C585 240 115 240 115 176" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m06a2)"/>
  <text x="350" y="222" text-anchor="middle" class="tx-m">관찰을 다음 생각의 입력으로 (필요한 만큼 반복)</text>
  <rect x="40" y="18" width="150" height="40" rx="10" class="p5s"/><text x="115" y="43" text-anchor="middle" class="tx">Question (질문)</text>
  <line x1="115" y1="60" x2="115" y2="106" class="ln" stroke-width="2.5" marker-end="url(#m06a2)"/>
  <rect x="275" y="18" width="150" height="40" rx="10" class="p4"/><text x="350" y="43" text-anchor="middle" class="tx-w">Final Answer</text>
  <path d="M192 118 C230 80 240 70 271 45" class="ln" stroke-width="2.5" stroke-dasharray="6 4" fill="none" marker-end="url(#m06a2)"/>
  <text x="300" y="86" class="tx-m">충분히 알면 종료</text>
  <text x="350" y="282" text-anchor="middle" class="tx-m">ReAct = Reason(생각) + Act(행동) 을 텍스트 한 장에 번갈아 쓰는 패턴</text>
</svg>`;

  /* 그림 6-3. Plan-and-Execute */
  const FIG_PLANEXEC = `<svg viewBox="0 0 700 320" role="img" aria-label="계획자가 단계 목록을 만들고 실행자가 차례로 수행하며, 실패하면 다시 계획하는 Plan-and-Execute 구조">
  ${ARROW('m06a3')}
  <rect x="20" y="30" width="130" height="50" rx="12" class="p5s"/><text x="85" y="60" text-anchor="middle" class="tx">🎯 목표</text>
  <rect x="200" y="30" width="150" height="50" rx="12" class="p1"/><text x="275" y="52" text-anchor="middle" class="tx-w">Planner</text><text x="275" y="70" text-anchor="middle" class="tx-w">계획자 LLM</text>
  <line x1="152" y1="55" x2="196" y2="55" class="ln" stroke-width="2.5" marker-end="url(#m06a3)"/>
  <rect x="400" y="14" width="280" height="90" rx="12" class="card-bg"/>
  <text x="415" y="36" class="tx-b">📋 단계 목록</text>
  <text x="415" y="58" class="tx-m">1. 정보 조사 → 2. 핵심 정리</text>
  <text x="415" y="78" class="tx-m">3. 결과물 작성 → 4. 검토 후 수정</text>
  <line x1="352" y1="55" x2="396" y2="55" class="ln" stroke-width="2.5" marker-end="url(#m06a3)"/>
  <rect x="200" y="170" width="150" height="50" rx="12" class="p2"/><text x="275" y="192" text-anchor="middle" class="tx-w">Executor</text><text x="275" y="210" text-anchor="middle" class="tx-w">실행자 (worker)</text>
  <path d="M540 106 L540 195 L352 195" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m06a3)"/>
  <text x="560" y="150" class="tx-m">한 단계씩</text>
  <rect x="20" y="170" width="130" height="50" rx="12" class="p3s"/><text x="85" y="192" text-anchor="middle" class="tx">결과 누적</text><text x="85" y="210" text-anchor="middle" class="tx-m">results[]</text>
  <line x1="196" y1="195" x2="152" y2="195" class="ln" stroke-width="2.5" marker-end="url(#m06a3)"/>
  <path d="M85 168 C85 120 140 100 196 68" class="ln" stroke-width="2" stroke-dasharray="6 4" fill="none" marker-end="url(#m06a3)"/>
  <text x="60" y="120" class="tx-m">❌ 실패 → 재계획</text>
  <rect x="200" y="255" width="150" height="44" rx="12" class="p4"/><text x="275" y="282" text-anchor="middle" class="tx-w">✅ 최종 결과</text>
  <line x1="275" y1="222" x2="275" y2="251" class="ln" stroke-width="2.5" marker-end="url(#m06a3)"/>
  <text x="520" y="250" class="tx-b">계획 ↔ 실행을 분리</text>
  <text x="520" y="272" class="tx-m">계획은 큰 그림, 실행은 도구 하나씩</text>
  <text x="520" y="292" class="tx-m">실행자는 LLM 또는 에이전트</text>
</svg>`;

  /* 그림 6-4. 반성 루프 */
  const FIG_REFLECT = `<svg viewBox="0 0 700 300" role="img" aria-label="초안을 생성하고 비평한 뒤 수정하며, 평가 점수가 기준 이상이면 끝나는 반성 루프">
  ${ARROW('m06a4')}
  <rect x="30" y="110" width="140" height="60" rx="14" class="p1"/><text x="100" y="136" text-anchor="middle" class="tx-w">✍️ 생성</text><text x="100" y="156" text-anchor="middle" class="tx-w">초안 쓰기</text>
  <rect x="240" y="110" width="140" height="60" rx="14" class="p3"/><text x="310" y="136" text-anchor="middle" class="tx-w">🔍 비평</text><text x="310" y="156" text-anchor="middle" class="tx-w">critique</text>
  <rect x="450" y="110" width="140" height="60" rx="14" class="p2"/><text x="520" y="136" text-anchor="middle" class="tx-w">✏️ 수정</text><text x="520" y="156" text-anchor="middle" class="tx-w">revise</text>
  <line x1="172" y1="140" x2="236" y2="140" class="ln" stroke-width="2.5" marker-end="url(#m06a4)"/>
  <line x1="382" y1="140" x2="446" y2="140" class="ln" stroke-width="2.5" marker-end="url(#m06a4)"/>
  <path d="M520 172 C520 235 310 235 310 176" class="ln" stroke-width="2.5" fill="none" marker-end="url(#m06a4)"/>
  <text x="415" y="222" text-anchor="middle" class="tx-m">rounds 번 반복</text>
  <rect x="240" y="20" width="140" height="44" rx="10" class="p5s"/><text x="310" y="40" text-anchor="middle" class="tx-b">📊 평가 score</text><text x="310" y="57" text-anchor="middle" class="tx-m">JSON score · issues</text>
  <path d="M520 108 C520 60 420 42 384 42" class="ln" stroke-width="2" stroke-dasharray="6 4" fill="none" marker-end="url(#m06a4)"/>
  <rect x="610" y="110" width="80" height="60" rx="14" class="p4"/><text x="650" y="145" text-anchor="middle" class="tx-w">✅ 완료</text>
  <line x1="592" y1="140" x2="606" y2="140" class="ln" stroke-width="2.5" marker-end="url(#m06a4)"/>
  <text x="640" y="95" text-anchor="middle" class="tx-m">score ≥ 기준</text>
  <text x="350" y="282" text-anchor="middle" class="tx-m">반성(Reflection) = 자기 결과물을 평가하고 고치는 루프 · 반드시 최대 횟수 안전장치를 둔다</text>
</svg>`;

  /* 그림 6-5. 생성자 · 평가자 분리 */
  const FIG_GENEVAL = `<svg viewBox="0 0 700 260" role="img" aria-label="작가 역할 LLM 이 초안을 쓰고 평가자 역할 LLM 이 점수와 지적을 돌려주는 두 역할 구조">
  ${ARROW('m06a5')}
  <rect x="40" y="60" width="220" height="130" rx="14" class="p1s"/>
  <text x="150" y="88" text-anchor="middle" class="tx-b">🧑‍🎨 생성자 (Generator)</text>
  <text x="150" y="112" text-anchor="middle" class="tx-m">system: "당신은 기술 블로그 작가입니다"</text>
  <text x="150" y="134" text-anchor="middle" class="tx-m">창의적 · 온도 높게</text>
  <text x="150" y="160" text-anchor="middle" class="tx">초안 · 수정본을 쓴다</text>
  <rect x="440" y="60" width="220" height="130" rx="14" class="p3s"/>
  <text x="550" y="88" text-anchor="middle" class="tx-b">🧑‍⚖️ 평가자 (Evaluator)</text>
  <text x="550" y="112" text-anchor="middle" class="tx-m">system: "당신은 엄격한 편집자입니다"</text>
  <text x="550" y="134" text-anchor="middle" class="tx-m">비판적 · 온도 0 · 기준표</text>
  <text x="550" y="160" text-anchor="middle" class="tx">점수 · 문제점 · 제안을 낸다</text>
  <line x1="262" y1="105" x2="436" y2="105" class="ln" stroke-width="2.5" marker-end="url(#m06a5)"/>
  <text x="350" y="98" text-anchor="middle" class="tx-m">초안</text>
  <line x1="436" y1="150" x2="262" y2="150" class="ln" stroke-width="2.5" marker-end="url(#m06a5)"/>
  <text x="350" y="170" text-anchor="middle" class="tx-m">피드백 {score, issues}</text>
  <text x="350" y="230" text-anchor="middle" class="tx-m">같은 모델이라도 역할(프롬프트)을 나누면 "자기 글에 관대한" 편향이 줄어든다</text>
</svg>`;

  /* 그림 6-6. 4대 요소 총정리 */
  const FIG_FOUR = `<svg viewBox="0 0 700 320" role="img" aria-label="에이전트를 가운데 두고 역할, 도구, 기억, 계획과 반성 네 요소가 둘러싼 그림">
  ${ARROW('m06a6')}
  <circle cx="350" cy="160" r="60" class="p1"/><text x="350" y="155" text-anchor="middle" class="tx-w">🤖 에이전트</text><text x="350" y="175" text-anchor="middle" class="tx-w">LLM 루프</text>
  <rect x="30" y="30" width="190" height="70" rx="14" class="p2s"/><text x="125" y="56" text-anchor="middle" class="tx-b">🎭 역할 (03차시)</text><text x="125" y="78" text-anchor="middle" class="tx-m">system prompt · 페르소나</text>
  <rect x="480" y="30" width="190" height="70" rx="14" class="p3s"/><text x="575" y="56" text-anchor="middle" class="tx-b">🔧 도구 (04차시)</text><text x="575" y="78" text-anchor="middle" class="tx-m">@tool · 스키마 · 호출 루프</text>
  <rect x="30" y="220" width="190" height="70" rx="14" class="p4s"/><text x="125" y="246" text-anchor="middle" class="tx-b">🧠 기억 (05차시)</text><text x="125" y="268" text-anchor="middle" class="tx-m">대화 기록 · 벡터 저장소</text>
  <rect x="480" y="220" width="190" height="70" rx="14" class="p5s"/><text x="575" y="246" text-anchor="middle" class="tx-b">🗺️ 계획 · 반성 (06차시)</text><text x="575" y="268" text-anchor="middle" class="tx-m">ReAct · Plan-Execute · 자기 수정</text>
  <line x1="222" y1="90" x2="300" y2="128" class="ln" stroke-width="2" marker-end="url(#m06a6)"/>
  <line x1="478" y1="90" x2="400" y2="128" class="ln" stroke-width="2" marker-end="url(#m06a6)"/>
  <line x1="222" y1="230" x2="300" y2="192" class="ln" stroke-width="2" marker-end="url(#m06a6)"/>
  <line x1="478" y1="230" x2="400" y2="192" class="ln" stroke-width="2" marker-end="url(#m06a6)"/>
  <text x="350" y="40" text-anchor="middle" class="tx-m">누구로서</text>
  <text x="350" y="300" text-anchor="middle" class="tx-m">무엇을 어떤 순서로 · 얼마나 잘</text>
</svg>`;

  const QUIZ1 = [
    { q: 'ReAct 패턴에서 <b>Observation</b> 줄은 누가 채울까요?', options: ['LLM 이 상상해서 채운다', '시스템(프로그램)이 도구를 실제로 실행한 결과로 채운다', '사용자가 직접 입력한다', '항상 비워 둔다'], answer: 1,
      explain: 'LLM 은 Thought 와 Action 까지만 쓰고 멈춥니다. 프로그램이 도구를 실행해 Observation 을 채워 넣고 다시 LLM 에게 보여 줍니다. LLM 이 Observation 까지 지어내면 잘라내야 합니다.' },
    { q: 'Plan-and-Execute 패턴에서 <code>al.Planner(llm).execute(goal, worker)</code> 의 <code>worker</code> 는 무엇을 받나요?', options: ['목표 전체 문자열만', '단계 하나와 이전 단계들의 결과', 'LLM 객체', '도구 목록'], answer: 1,
      explain: '<code>worker(step, previous_results)</code> 형태로 단계 하나씩 호출됩니다. 이전 결과를 참고해 다음 단계를 수행할 수 있습니다.' },
    { q: '다음 중 <b>재계획(re-plan)</b>이 필요한 상황으로 가장 알맞은 것은?', options: ['계획의 첫 단계가 성공했다', '도구가 오류를 돌려주어 다음 단계를 진행할 수 없다', '사용자가 인사를 했다', '계획이 1단계뿐이다'], answer: 1,
      explain: '계획은 실행 전 예상일 뿐입니다. 도구 오류 · 예상과 다른 관찰처럼 전제가 깨지면 실패 정보를 넣어 다시 계획을 세워야 합니다.' },
    { q: 'ReAct 와 Plan-and-Execute 를 비교한 설명으로 <b>틀린</b> 것은?', options: ['ReAct 는 한 단계씩 생각하며 바로 행동한다', 'Plan-and-Execute 는 먼저 전체 단계를 세운 뒤 실행한다', 'ReAct 는 계획을 절대 바꾸지 못한다', 'Plan-and-Execute 는 큰 작업의 진행 상황을 파악하기 쉽다'], answer: 2,
      explain: 'ReAct 는 매 단계 관찰을 보고 다음 생각을 정하므로 오히려 계획이 유연하게 바뀝니다. 대신 큰 그림을 잃기 쉽다는 단점이 있습니다.' }
  ];
  const QUIZ2 = [
    { q: '<code>al.Reflector(llm).improve(text, rounds=2)</code> 는 LLM 을 몇 번 호출할까요?', options: ['1번', '2번', '4번', '8번'], answer: 2,
      explain: '한 라운드 = 비평(critique) 1번 + 수정(revise) 1번이므로 2라운드면 4번입니다. 실제 LLM 에서는 비용과 시간이 그만큼 늘어납니다.' },
    { q: '평가 점수가 기준 이상이 될 때까지 다시 쓰는 <code>while</code> 루프에 <b>반드시</b> 넣어야 하는 것은?', options: ['온도(temperature) 설정', '최대 반복 횟수 안전장치', '도구 목록', '시스템 프롬프트'], answer: 1,
      explain: 'LLM 이 기준을 영영 넘지 못하면 무한 루프가 됩니다. <code>max_rounds</code> 같은 상한을 두고 넘으면 그때까지의 최선을 돌려줍니다.' },
    { q: '생성자와 평가자를 <b>다른 역할의 LLM</b> 으로 나누는 가장 큰 이유는?', options: ['토큰을 아끼려고', '자기 결과물에 관대해지는 편향을 줄이고 평가 기준을 분명히 하려고', '도구를 더 많이 쓰려고', '메모리를 공유하려고'], answer: 1,
      explain: '같은 프롬프트 안에서 쓰고 평가하면 "내 글은 괜찮다"는 쪽으로 기웁니다. 평가자에게 별도 역할과 기준표를 주면 더 엄격하고 일관된 피드백을 얻습니다.' },
    { q: '"단계별로 생각해 보자"처럼 풀이 과정을 먼저 쓰게 하는 프롬프팅 기법의 이름은?', options: ['Self-Consistency', 'Chain-of-Thought', 'Few-shot', 'Plan-and-Execute'], answer: 1,
      explain: 'Chain-of-Thought(생각의 사슬)는 답 전에 추론 과정을 쓰게 해 정확도를 높입니다. Self-Consistency 는 여러 번 풀어 다수결로 답을 고르는 기법입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag06',
    no: '06',
    title: '계획과 반성: ReAct · Plan-and-Execute · Self-Correction',
    subtitle: '큰 목표를 쪼개고, 결과를 스스로 검토해 고치는 에이전트',
    summary: '에이전트의 4대 요소 중 마지막, <b>계획(Planning)</b>과 <b>반성(Reflection)</b>입니다. 큰 목표를 하위 목표로 쪼개는 법, 생각과 행동을 번갈아 쓰는 <b>ReAct</b>, 먼저 계획을 세우고 실행하는 <b>Plan-and-Execute</b>, 그리고 자기 결과물을 비평 · 평가 · 수정하는 <b>Self-Correction</b> 루프를 <code>agentlab</code> 으로 직접 돌려 봅니다.',
    goals: [
      '큰 목표를 하위 목표(단계)로 쪼개는 계획의 필요성과 목표 트리를 설명할 수 있다',
      'ReAct 의 Thought / Action / Observation 형식을 읽고, 프로그램이 어느 부분을 채우는지 설명할 수 있다',
      'Plan-and-Execute 로 계획을 세우고 worker 로 단계를 실행하며, 실패 시 재계획할 수 있다',
      '생성 → 비평 → 수정 루프와 평가자 LLM 의 점수로 결과물을 개선하고, 최대 횟수 안전장치를 둘 수 있다',
      'Chain-of-Thought · Self-Consistency 같은 프롬프팅 기법의 개념을 설명할 수 있다'
    ],
    sections: [
      {
        id: 'ag06-1',
        title: '계획(Planning): 목표 쪼개기 · ReAct · Plan-and-Execute',
        minutes: 50,
        goals: ['큰 목표를 하위 목표로 쪼개는 이유를 설명한다', 'ReAct 전체 기록(transcript)을 읽고 각 줄의 역할을 안다', 'Planner 로 계획을 세우고 worker 로 실행하며, 실패 시 재계획한다'],
        flow: [['도입 · 왜 계획인가', 6], ['목표 트리 · Planner', 10], ['ReAct 패턴 (코드)', 14], ['Plan-and-Execute · 재계획', 14], ['퀴즈 · 정리', 6]],
        content: [
          { type: 'p', html: '04차시의 에이전트는 "서울 날씨 알려줘"처럼 <b>도구 한 번</b>으로 끝나는 일을 잘 했습니다. 그런데 "전기차 시장 보고서를 만들어 줘"처럼 <b>여러 단계</b>가 필요한 목표를 주면 어떻게 될까요? 어떤 도구를 어떤 순서로 써야 하는지 스스로 정해야 합니다. 이것이 <b>계획(Planning)</b>이고, 에이전트의 4대 요소 중 네 번째입니다.' },
          { type: 'h', text: '큰 목표를 하위 목표로 쪼개기' },
          { type: 'p', html: '사람도 큰 일을 할 때는 할 일 목록부터 씁니다. 에이전트도 마찬가지로 <b>목표 → 하위 목표 → 도구 하나로 해결되는 작은 작업</b>으로 쪼갭니다. 이 구조를 <b>목표 트리</b>라고 부릅니다. 잎(leaf)은 반드시 "도구 한 번 호출" 또는 "LLM 한 번 호출"로 끝나야 합니다.' },
          { type: 'figure', html: FIG_GOALTREE, caption: '그림 6-1. 목표 트리. 잎이 작을수록 실행과 검증이 쉬워집니다.' },
          { type: 'code', title: '예제 6-1. Planner 로 목표를 단계로 쪼개기', code: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm, max_steps=5)      # 최대 5단계까지

for goal in ['전기차 시장 조사 보고서 만들기', '학교 축제 홍보 영상 만들기']:
    steps = planner.plan(goal)               # LLM 에게 JSON {"steps": [...]} 을 요청
    print('🎯', goal)
    for i, s in enumerate(steps, 1):
        print(f'  {i}. {s}')
    print('  (단계 수:', len(steps), ')')`,
            expect: `🎯 전기차 시장 조사 보고서 만들기
  1. 전기차 시장 조사 보고서 만들기 에 필요한 정보 조사
  2. 핵심 내용 정리
  3. 결과물 작성
  4. 검토 후 수정
  (단계 수: 4 )
🎯 학교 축제 홍보 영상 만들기
  1. 학교 축제 홍보 영상 만들기 에 필요한 정보 조사
  2. 핵심 내용 정리
  3. 결과물 작성
  4. 검토 후 수정
  (단계 수: 4 )`,
            desc: '<code>Planner.plan()</code> 은 "단계를 JSON 으로만 답하라"는 프롬프트를 보내고 <code>steps</code> 목록을 꺼냅니다. 예시 출력은 모의 LLM 기준이라 두 목표의 단계가 비슷하지만, 실제 LLM(🔑 키)을 쓰면 목표마다 다른 구체적인 단계가 나옵니다.' },
          { type: 'callout', kind: 'tip', title: '왜 JSON 으로 받을까?', html: '단계 목록을 <b>프로그램이 하나씩 꺼내 실행</b>해야 하기 때문입니다. 자유로운 문장으로 받으면 "1단계: …" 를 파싱하다 깨지기 쉽습니다. 02차시의 <b>구조화 출력(json_mode)</b>이 계획에서 바로 쓰입니다.' },
          { type: 'h', text: 'ReAct: 생각(Reason)과 행동(Act)을 번갈아' },
          { type: 'p', html: '<b>ReAct</b>(Yao et al., 2022)는 LLM 이 한 장의 텍스트에 <b>Thought(생각) → Action(도구) → Observation(관찰)</b>을 번갈아 써 내려가는 패턴입니다. 함수 호출 API 가 없던 시절에 나왔지만, 04차시의 도구 호출 루프와 <b>원리가 완전히 같습니다</b>. 차이는 형식뿐입니다: 도구 호출이 JSON 필드가 아니라 <code>Action:</code> 줄의 텍스트로 나옵니다.' },
          { type: 'figure', html: FIG_REACT, caption: '그림 6-2. ReAct 루프. LLM 은 Thought 와 Action 까지 쓰고 멈추며, Observation 은 프로그램이 도구를 실행해 채웁니다.' },
          { type: 'code', title: '예제 6-2. ReAct 에이전트의 전체 기록(transcript) 보기', code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.calculator], verbose=True)   # verbose: 매 줄 출력
answer = agent.run('1500 * 0.15 는 얼마야?')
print('---')
print('최종 답:', answer)
print('기록 줄 수:', len(agent.transcript.strip().split('\\n')))`,
            expect: `Thought: "1500 * 0.15 는 얼마야?" 에 답하려면 calculator 도구가 필요하다.
Action: calculator
Action Input: {"expression": "1500 * 0.15"}
Observation: {"expression": "1500 * 0.15", "result": 225}
Thought: 관찰 결과로 충분히 답할 수 있다.
Final Answer: 계산 결과는 225 입니다.
---
최종 답: 계산 결과는 225 입니다.
기록 줄 수: 7`,
            desc: '<code>Thought → Action → Action Input</code> 까지가 LLM 의 첫 응답, <code>Observation</code> 은 프로그램이 <code>calculator</code> 를 실제로 실행해 붙인 줄, 그 다음 <code>Thought → Final Answer</code> 가 LLM 의 두 번째 응답입니다. <code>agent.transcript</code> 에 Question 부터 전체 기록이 남습니다.' },
          { type: 'code', title: '예제 6-3. 도구가 여러 개일 때 ReAct 가 고르는 과정', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.get_weather, al.calculator, al.wiki_search])
print(agent.run('부산 날씨 알려줘'))
print('=' * 40)
agent2 = al.ReActAgent(llm, tools=[al.get_weather, al.calculator, al.wiki_search])
print(agent2.run('파이썬에 대해 검색해줘'))`,
            desc: '질문에 따라 <code>Action:</code> 줄의 도구 이름이 달라집니다. <code>get_weather</code> · <code>wiki_search</code> 는 브라우저에서 실제 API 를 부르므로 결과가 매번 다를 수 있습니다. LLM 에게는 도구 목록이 <code>- 이름(인자: 타입): 설명</code> 한 줄씩 프롬프트로 들어갑니다(<code>al.ReActAgent</code> 의 <code>REACT_PROMPT</code>).' },
          { type: 'callout', kind: 'warn', title: 'LLM 이 Observation 까지 지어내면?', html: '실제 모델은 가끔 <code>Observation:</code> 줄까지 스스로 써 버립니다(환각). <code>ReActAgent</code> 는 응답에서 <code>\\nObservation:</code> 이후를 <b>잘라내고</b> 도구를 진짜로 실행한 결과로 바꿔 넣습니다. "관찰은 반드시 프로그램이 채운다"는 원칙이 에이전트 신뢰성의 핵심입니다.' },
          { type: 'h', text: 'Plan-and-Execute: 먼저 계획, 그 다음 실행' },
          { type: 'p', html: 'ReAct 는 한 걸음씩 생각하기 때문에 큰 작업에서는 <b>길을 잃거나 같은 도구를 반복</b>하기 쉽습니다. <b>Plan-and-Execute</b> 는 먼저 <b>계획자(Planner)</b>가 전체 단계를 세우고, <b>실행자(Executor)</b>가 한 단계씩 수행합니다. 계획은 큰 그림만 보고, 실행은 작은 작업에 집중합니다.' },
          { type: 'figure', html: FIG_PLANEXEC, caption: '그림 6-3. Plan-and-Execute. 실행자(worker)는 LLM 한 번 호출일 수도, 도구를 가진 에이전트일 수도 있습니다.' },
          { type: 'code', title: '예제 6-4. Planner.execute 로 계획 세우고 차례로 실행하기', code: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm)

def worker(step, previous):
    """단계 하나를 수행한다. previous = 지금까지의 [{'step', 'result'}, ...]"""
    context = ''
    if previous:                       # 직전 결과를 참고 자료로 붙인다
        context = '\\n\\n[참고: 이전 단계 결과]\\n' + previous[-1]['result'][:150]
    return llm.ask(step + '해 줘' + context)

results = planner.execute('전기차 시장 조사 보고서 만들기', worker)   # 계획 → 실행
print('=' * 40)
print('완료한 단계:', len(results))
print('최종 결과물:', results[-1]['result'][:60])`,
            expect: `📌 1/4 전기차 시장 조사 보고서 만들기 에 필요한 정보 조사
   → 조사 결과 — 전기차 시장 보고서 만들기 에 필요한 정보: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록
📌 2/4 핵심 내용 정리
   → 요약: 핵심
📌 3/4 결과물 작성
   → # 결과물

이전 작업 결과를 바탕으로 도입: 왜 지금 결과물인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바
📌 4/4 검토 후 수정
   → 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.
========================================
완료한 단계: 4
최종 결과물: 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두`,
            desc: '<code>execute()</code> 는 <code>plan()</code> 으로 단계를 만든 뒤 <code>worker(step, previous)</code> 를 차례로 부르고 <code>[{"step", "result"}, ...]</code> 를 돌려줍니다. worker 는 지금처럼 <code>llm.ask</code> 한 번일 수도, 도구를 가진 <code>al.Agent</code> 의 <code>run</code> 일 수도 있습니다. (예시 출력은 모의 LLM 기준)' },
          { type: 'table', head: ['', 'ReAct', 'Plan-and-Execute'], rows: [
            ['진행 방식', '한 단계 생각 → 바로 행동 → 관찰 → 다시 생각', '먼저 전체 계획 → 단계별 실행'],
            ['장점', '관찰에 따라 유연하게 방향 전환', '큰 그림 유지 · 진행률 파악 · 병렬 실행 가능'],
            ['단점', '큰 작업에서 길을 잃거나 반복', '계획이 틀리면 전부 틀림 → 재계획 필요'],
            ['LLM 호출', '단계마다 1번 (전체 기록을 매번 전송)', '계획 1번 + 단계마다 1번 (짧은 문맥)'],
            ['어울리는 일', '질문 답변 · 짧은 조사', '보고서 · 코드 작성 · 다단계 자동화'],
            ['agentlab', '<code>al.ReActAgent</code> · <code>al.Agent</code>', '<code>al.Planner.plan / execute</code>']
          ], caption: '표 6-1. 두 패턴 비교. 실무에서는 "계획은 Plan-and-Execute, 각 단계 실행은 ReAct 에이전트"처럼 섞어 씁니다.' },
          { type: 'h', text: '계획이 틀렸을 때: 재계획(re-plan) 루프' },
          { type: 'p', html: '계획은 실행 전의 <b>예상</b>일 뿐입니다. 예약하려던 호텔이 만실이거나 검색 결과가 비어 있으면 나머지 계획은 의미가 없어집니다. 그래서 실행 중 <b>실패를 감지하면 실패 정보를 넣어 다시 계획</b>을 세웁니다. <code>Planner.plan(goal, context=...)</code> 의 <code>context</code> 가 바로 그 자리입니다.' },
          { type: 'code', title: '예제 6-5. 실패를 감지하고 다시 계획하기', code: `import agentlab as al

@al.tool
def book_room(hotel: str) -> dict:
    """호텔 방을 예약한다

    hotel: 호텔 이름
    """
    rooms = {'B 호텔': 2, 'C 호텔': 5}          # A 호텔은 만실
    if hotel not in rooms:
        return {'error': hotel + ' 은(는) 만실입니다'}
    return {'hotel': hotel, 'booked': True}

# 수업용 시나리오: 모의 LLM 이 돌려줄 두 번의 계획 (키가 있으면 실제 LLM 이 계획한다)
llm = al.LLM(mock_responses=[
    '{"goal": "부산 출장 준비", "steps": ["A 호텔 예약", "KTX 표 예매", "일정표 작성"]}',
    '{"goal": "부산 출장 준비", "steps": ["B 호텔 예약", "KTX 표 예매", "일정표 작성"]}',
])
planner = al.Planner(llm)
goal = '부산 출장 준비'
steps = planner.plan(goal)
done = []
for attempt in range(1, 4):                    # 재계획은 최대 3번까지 (안전장치)
    print(f'📋 계획 {attempt}: {steps}')
    failed = None
    for s in steps:
        if s in done:
            continue
        r = book_room(s.replace(' 예약', '')) if '예약' in s else {'ok': s}
        if 'error' in r:
            failed = r['error']
            print('   ❌', s, '→', failed)
            break
        done.append(s)
        print('   ✅', s)
    if failed is None:
        print('🎉 모든 단계 완료:', done)
        break
    steps = planner.plan(goal, context=f'실패: {failed}. 이미 완료: {done}')   # 실패 정보를 넣어 재계획`,
            expect: `📋 계획 1: ['A 호텔 예약', 'KTX 표 예매', '일정표 작성']
   ❌ A 호텔 예약 → A 호텔 은(는) 만실입니다
📋 계획 2: ['B 호텔 예약', 'KTX 표 예매', '일정표 작성']
   ✅ B 호텔 예약
   ✅ KTX 표 예매
   ✅ 일정표 작성
🎉 모든 단계 완료: ['B 호텔 예약', 'KTX 표 예매', '일정표 작성']`,
            desc: '첫 계획의 "A 호텔 예약"이 도구 오류로 실패하자, 오류 메시지와 완료 목록을 <code>context</code> 로 넣어 다시 계획하고 "B 호텔"로 바꿔 성공합니다. <code>mock_responses</code> 는 키가 없을 때 모의 LLM 이 차례로 돌려줄 답으로, 실제 LLM 은 오류를 읽고 스스로 다른 호텔을 고릅니다. 재계획 횟수에 상한(3번)을 둔 점에 주목하세요.' },
          { type: 'callout', kind: 'more', title: '더 알아보기: 계획을 더 잘 세우는 방법들', html: '<b>Tree of Thoughts</b> 는 여러 계획 후보를 트리로 펼쳐 평가하며 고르고, <b>LLM Compiler</b> 는 서로 독립인 단계를 찾아 <b>병렬</b>로 실행합니다. <b>Reflexion</b> 은 실패 경험을 메모리에 남겨 다음 시도에 반영합니다(2교시의 반성과 05차시의 기억이 만나는 지점). 08차시 LangGraph 에서는 이런 루프를 <b>그래프</b>로 그립니다.' }
        ],
        practice: [
          { title: '실습 6-1. 나의 목표를 단계로 쪼개기', level: 1,
            desc: '<p><code>al.Planner</code> 로 자신의 목표(예: "친구 생일 파티 준비")를 단계로 쪼개고, <b>번호를 붙여</b> 출력한 뒤 마지막 줄에 <code>총 N단계</code> 를 출력하세요. <code>max_steps=3</code> 으로 바꾸면 몇 단계가 나오나요?</p>',
            hint: '<code>steps = al.Planner(llm, max_steps=3).plan(goal)</code> → <code>for i, s in enumerate(steps, 1)</code>',
            starter: `import agentlab as al

llm = al.LLM()
goal = '친구 생일 파티 준비'
# TODO: Planner(max_steps=3) 로 계획 세우기
steps = []
# TODO: 번호를 붙여 출력하고 마지막에 '총 N단계' 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
goal = '친구 생일 파티 준비'
steps = al.Planner(llm, max_steps=3).plan(goal)
for i, s in enumerate(steps, 1):
    print(f'{i}. {s}')
print(f'총 {len(steps)}단계')
`,
            expect: `1. 친구 생일 파티 준비 에 필요한 정보 조사
2. 핵심 내용 정리
3. 결과물 작성
총 3단계` },
          { title: '실습 6-2. 결과를 모아 보고서 만들기', level: 2,
            desc: '<p>예제 6-4 의 <code>worker</code> 를 그대로 쓰되, <code>execute()</code> 가 돌려준 결과 목록을 <b>하나의 보고서 문자열</b>로 합쳐 보세요. 각 단계는 <code>## 1. 단계 이름</code> 제목 아래에 결과의 앞 50자를 넣습니다. 마지막에 보고서의 전체 글자 수를 출력하세요.</p>',
            hint: '<code>for i, r in enumerate(results, 1): report += f"## {i}. {r[\'step\']}\\n{r[\'result\'][:50]}\\n"</code>',
            starter: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm)

def worker(step, previous):
    return llm.ask(step + '해 줘')

results = planner.execute('전기차 시장 조사 보고서 만들기', worker, verbose=False)
report = ''
# TODO: results 를 돌며 '## 번호. 단계' 제목과 결과 앞 50자를 report 에 추가
print(report)
# TODO: 전체 글자 수 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm)

def worker(step, previous):
    return llm.ask(step + '해 줘')

results = planner.execute('전기차 시장 조사 보고서 만들기', worker, verbose=False)
report = ''
for i, r in enumerate(results, 1):
    report += f"## {i}. {r['step']}\\n{r['result'][:50]}\\n"
print(report)
print('글자 수:', len(report))
`,
            expect: `## 1. 전기차 시장 조사 보고서 만들기 에 필요한 정보 조사
조사 결과 — 전기차 시장 보고서 만들기 에 필요한 정보: ① 정의와 배경 ② 최근 동향
## 2. 핵심 내용 정리
요약: 핵심
## 3. 결과물 작성
# 결과물

도입: 왜 지금 결과물인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용
## 4. 검토 후 수정
검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고,

글자 수: 238` },
          { title: '실습 6-3. (도전) ReAct 기록에서 도구 호출 횟수 세기', level: 3,
            desc: '<p><code>al.ReActAgent</code> 를 <code>verbose=False</code> 로 만들어 두 질문("3 더하기 4는?", "안녕하세요")을 차례로 실행하고, 각 질문마다 <code>agent.transcript</code> 에서 <code>Action:</code> 으로 시작하는 줄의 수(= 도구 호출 횟수)를 세어 출력하세요. 두 번째 질문은 도구 없이 답하는지 확인합니다.</p>',
            hint: '<code>sum(1 for line in agent.transcript.split("\\n") if line.startswith("Action:"))</code>',
            starter: `import agentlab as al

llm = al.LLM()
for q in ['3 더하기 4는?', '안녕하세요']:
    agent = al.ReActAgent(llm, tools=[al.calculator], verbose=False)
    answer = agent.run(q)
    # TODO: transcript 에서 'Action:' 으로 시작하는 줄 수 세기
    calls = 0
    print(f'{q} → {answer} (도구 호출 {calls}회)')
`,
            solution: `import agentlab as al

llm = al.LLM()
for q in ['3 더하기 4는?', '안녕하세요']:
    agent = al.ReActAgent(llm, tools=[al.calculator], verbose=False)
    answer = agent.run(q)
    calls = sum(1 for line in agent.transcript.split('\\n') if line.startswith('Action:'))
    print(f'{q} → {answer} (도구 호출 {calls}회)')
`,
            expect: `3 더하기 4는? → 계산 결과는 7 입니다. (도구 호출 1회)
안녕하세요 → 안녕하세요! 무엇을 도와드릴까요? (도구 호출 0회)` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: '계획(Planning)', subtitle: '목표 쪼개기 · ReAct · Plan-and-Execute', notes: '<p>4대 요소의 마지막 차시. 03 역할 → 04 도구 → 05 기억을 한 줄씩 복습하고 "여러 단계가 필요한 목표"를 던집니다.</p><p>💬 발문: "전기차 시장 보고서를 만들어 줘"라고 하면 04차시 에이전트는 어떻게 될까? → 도구 하나 부르고 끝나거나 헤맨다.</p><p>⏱ 도입 6분</p>' },
          { layout: 'bullets', title: '왜 계획이 필요한가', lead: '도구 한 번으로 끝나지 않는 일', bullets: ['"서울 날씨" = 도구 1번 → 04차시로 충분', '"시장 보고서" = 조사 → 정리 → 작성 → 검토', '어떤 도구를 <b>어떤 순서</b>로? 스스로 정해야 함', '사람도 큰 일 앞에서는 할 일 목록부터', '계획 = 목표를 <b>실행 가능한 작은 작업</b>으로'],
            notes: '<p>💬 "여러분은 과제 발표를 준비할 때 무엇부터 하나요?" → 자료 조사, 개요, 슬라이드, 연습. 그것이 계획.</p><p>핵심 메시지: 잎은 도구 한 번으로 끝나야 한다.</p>' },
          { layout: 'diagram', title: '목표 트리', html: FIG_GOALTREE, caption: '목표 → 하위 목표 → 도구 하나로 끝나는 작업',
            notes: '<p>잎(leaf) 하나가 04차시 도구 호출 하나와 대응한다는 점을 강조합니다.</p><p>💬 "③ 보고서 작성·검토 를 더 쪼갠다면?" → 초안, 비평, 수정 — 2교시 반성으로 연결.</p>' },
          { layout: 'code', title: 'Planner 로 단계 쪼개기', code: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm, max_steps=5)
steps = planner.plan('전기차 시장 조사 보고서 만들기')
for i, s in enumerate(steps, 1):
    print(i, s)`, points: ['JSON <code>{"steps": [...]}</code> 으로 요청', '프로그램이 꺼내 쓰기 쉬운 형식', '모의 LLM 은 늘 같은 4단계 · 실제 LLM 은 목표별로 다름'],
            notes: '<p>▶ 실행. 🔑 키가 있는 학생은 실제 모델의 단계와 비교하게 합니다.</p><p>02차시 구조화 출력이 왜 필요했는지 되짚습니다.</p>' },
          { layout: 'diagram', title: 'ReAct: 생각 + 행동', html: FIG_REACT, caption: 'Thought → Action → Observation 을 텍스트로',
            notes: '<p>04차시 도구 호출 루프와 같은 그림임을 보여 줍니다. 차이는 "JSON 필드" 대신 "텍스트 줄".</p><p>💬 "Observation 은 누가 쓸까?" → 프로그램. LLM 이 쓰면 환각.</p>' },
          { layout: 'code', title: 'ReAct 전체 기록 보기', code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.calculator], verbose=True)
print(agent.run('1500 * 0.15 는 얼마야?'))
print('---')
print(agent.transcript)`, points: ['LLM 응답 1: Thought → Action → Action Input', '프로그램: 도구 실행 → <b>Observation</b>', 'LLM 응답 2: Thought → <b>Final Answer</b>'],
            notes: '<p>▶ 실행 후 줄마다 "누가 썼나"를 학생에게 묻습니다. transcript 전체가 매번 LLM 에 다시 들어간다는 점(토큰 비용)도 언급.</p>' },
          { layout: 'diagram', title: 'Plan-and-Execute', html: FIG_PLANEXEC, caption: '계획자는 큰 그림, 실행자는 한 단계씩',
            notes: '<p>ReAct 의 약점(큰 작업에서 길을 잃음)에서 출발. 계획과 실행을 분리하면 진행률을 알 수 있고 단계를 병렬로도 돌릴 수 있습니다.</p>' },
          { layout: 'code', title: 'Planner.execute + worker', code: `import agentlab as al

llm = al.LLM()
planner = al.Planner(llm)

def worker(step, previous):          # 단계 하나 수행
    return llm.ask(step + '해 줘')

results = planner.execute('전기차 시장 조사 보고서 만들기', worker)
print(len(results), '단계 완료')`, points: ['<code>worker(step, previous)</code>', 'worker = <code>llm.ask</code> 또는 <code>Agent.run</code>', '결과 목록 <code>[{step, result}]</code>'],
            notes: '<p>▶ 실행. 💬 "worker 를 도구 가진 Agent 로 바꾸면?" → 조사 단계에서 wiki_search 를 쓸 수 있다 (실습 6-2 확장).</p>' },
          { layout: 'table', title: 'ReAct vs Plan-and-Execute', head: ['', 'ReAct', 'Plan-and-Execute'], rows: [
            ['방식', '생각 → 행동 → 관찰 반복', '계획 → 단계별 실행'],
            ['장점', '유연한 방향 전환', '큰 그림 · 진행률 · 병렬'],
            ['단점', '큰 작업에서 헤맴', '계획이 틀리면 재계획'],
            ['어울림', '질문 답변 · 짧은 조사', '보고서 · 다단계 자동화']
          ], notes: '<p>실무에서는 섞어 씁니다: 계획은 Plan-and-Execute, 단계 실행은 ReAct 에이전트.</p>' },
          { layout: 'code', title: '실패하면 다시 계획하기', code: `import agentlab as al

llm = al.LLM(mock_responses=[
    '{"steps": ["A 호텔 예약", "KTX 표 예매"]}',
    '{"steps": ["B 호텔 예약", "KTX 표 예매"]}'])
planner = al.Planner(llm)
steps = planner.plan('부산 출장 준비')
print('계획 1:', steps)
error = 'A 호텔 은(는) 만실입니다'          # 도구 오류라고 가정
steps = planner.plan('부산 출장 준비', context='실패: ' + error)
print('계획 2:', steps)`, points: ['계획 = 실행 전 <b>예상</b>', '오류 메시지를 <code>context</code> 로 넣어 재계획', '재계획 횟수에 상한 필수'],
            notes: '<p>예제 6-5 의 축약판. mock_responses 는 수업 시나리오용이고 실제 LLM 은 오류를 읽고 스스로 바꾼다고 설명합니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[0].q, options: QUIZ1[0].options, answer: QUIZ1[0].answer, explain: QUIZ1[0].explain, notes: '<p>정답 ②. 환각 방지의 핵심 원칙이므로 꼭 짚습니다.</p>' },
          { layout: 'practice', title: '실습 6-1. 나의 목표 쪼개기', desc: '<p>자신의 목표를 <code>max_steps=3</code> 으로 쪼개고 번호를 붙여 출력하세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
goal = '친구 생일 파티 준비'
# TODO: Planner(max_steps=3).plan(goal) → 번호 붙여 출력
`, solution: `import agentlab as al

llm = al.LLM()
goal = '친구 생일 파티 준비'
steps = al.Planner(llm, max_steps=3).plan(goal)
for i, s in enumerate(steps, 1):
    print(f'{i}. {s}')
print(f'총 {len(steps)}단계')`, notes: '<p>5분. 빨리 끝난 학생은 실습 6-2(결과 합치기)로.</p>' },
          { layout: 'summary', title: '정리', bullets: ['계획 = 큰 목표를 <b>도구 하나로 끝나는 작업</b>까지 쪼개기 (목표 트리)', '<b>ReAct</b>: Thought → Action → Observation, 관찰은 프로그램이 채운다', '<b>Plan-and-Execute</b>: 계획자와 실행자 분리, <code>Planner.plan / execute</code>', '실패하면 실패 정보를 넣어 <b>재계획</b>, 횟수 상한 필수', '다음 교시: 결과물을 스스로 검토하고 고치는 반성'], notes: '<p>⏱ 정리 6분. 출구 질문: "ReAct 와 Plan-and-Execute 중 날씨 질문에 어울리는 것은?"</p>' }
        ]
      },
      {
        id: 'ag06-2',
        title: '반성(Reflection)과 자기 수정(Self-Correction)',
        minutes: 50,
        goals: ['생성 → 비평 → 수정 루프를 Reflector 로 실행한다', '평가자 LLM 의 점수로 반복 여부를 정하고 안전장치를 둔다', '도구 오류를 보고 스스로 고치는 루프를 만든다', 'CoT · Self-Consistency 의 개념을 설명한다'],
        flow: [['도입 · 왜 반성인가', 5], ['비평 → 수정 루프 (코드)', 12], ['평가자 점수 · 역할 분리', 12], ['오류 자기 수정 · 프롬프팅 기법', 12], ['4대 요소 총정리 · 퀴즈', 9]],
        content: [
          { type: 'p', html: '사람은 글을 쓰고 나서 <b>다시 읽어 보고 고칩니다</b>. LLM 도 한 번에 완벽한 답을 내기보다, 자기 결과물을 <b>비평(critique)</b>하고 <b>수정(revise)</b>하게 하면 품질이 눈에 띄게 올라갑니다. 이것이 <b>반성(Reflection)</b>, 넓게는 <b>자기 수정(Self-Correction)</b>입니다.' },
          { type: 'h', text: '생성 → 비평 → 수정 루프' },
          { type: 'figure', html: FIG_REFLECT, caption: '그림 6-4. 반성 루프. 비평과 수정을 정해진 횟수만큼 반복하거나, 평가 점수가 기준을 넘으면 멈춥니다.' },
          { type: 'code', title: '예제 6-6. 비평 한 번, 수정 한 번', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)      # critic_system · writer_system 기본값 사용

draft = 'AI 에이전트는 유용하다. 많은 회사가 쓴다. 그래서 배워야 한다.'
feedback = reflector.critique(draft, criteria='근거와 구체성을 중심으로 검토해라.')
print('🔍 비평:', feedback)
print()
revised = reflector.revise(draft, feedback)
print('✏️ 수정본:', revised)
print()
print('글자 수: 초안', len(draft), '→ 수정본', len(revised))`,
            expect: `🔍 비평: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

✏️ 수정본: [피드백을 반영해 글을 고치는 작가] 수정본: AI 에이전트는 유용하다. 많은 회사가 쓴다. 그래서 배워야 한다. 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.

글자 수: 초안 37 → 수정본 154`,
            desc: '<code>critique()</code> 은 검토자 역할로, <code>revise()</code> 는 작가 역할로 LLM 을 부릅니다. 답 앞의 <code>[꼼꼼한 검토자]</code> 는 모의 LLM 이 역할을 표시하는 방식입니다(03차시). 실제 LLM 은 초안의 내용에 맞는 구체적인 지적과 수정본을 냅니다.' },
          { type: 'code', title: '예제 6-7. improve(rounds=2): 비평 → 수정을 두 바퀴', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
draft = '우리 동아리에 가입하세요. 재미있습니다.'

final = reflector.improve(draft, rounds=2)     # 비평 → 수정 → 비평 → 수정
print('=' * 40)
print('최종본 앞 60자:', final[:60])
print('LLM 호출 횟수:', llm.calls)`,
            expect: `🔍 검토 1: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.
✏️ 수정 1: [피드백을 반영해 글을 고치는 작가] 수정본: 우리 동아리에 가입하세요. 재미있습니다. 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며,
🔍 검토 2: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.
✏️ 수정 2: [피드백을 반영해 글을 고치는 작가] 수정본: 수정본: 우리 동아리에 가입하세요. 재미있습니다. 최근 조사에 따르면 사용자의 72%가 이 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026
========================================
최종본 앞 60자: [피드백을 반영해 글을 고치는 작가] 수정본: 수정본: 우리 동아리에 가입하세요. 재미있습니다. 최근 조사에
LLM 호출 횟수: 4`,
            desc: '라운드마다 LLM 을 2번(비평 + 수정) 부르므로 2라운드 = 4번입니다. 모의 LLM 은 매번 같은 지적을 하지만, 실제 LLM 은 두 번째 비평에서 "이제 근거는 충분하니 문장을 다듬자"처럼 <b>남은 문제</b>를 짚습니다. 라운드를 늘릴수록 비용이 늘고 효과는 줄어드는 점(보통 1~3회)을 기억하세요.' },
          { type: 'h', text: '평가자 LLM: 점수로 "충분한가?"를 정하기' },
          { type: 'p', html: '"두 바퀴 돌리기"보다 좋은 기준은 <b>품질 점수</b>입니다. 평가자에게 기준표를 주고 <code>{"score": 7, "issues": [...], "suggestion": "..."}</code> 같은 JSON 으로 받으면, <b>점수가 기준 미만일 때만</b> 다시 쓰게 할 수 있습니다. 단, LLM 이 영영 기준을 못 넘을 수 있으므로 <b>최대 횟수</b>를 꼭 둡니다.' },
          { type: 'code', title: '예제 6-8. 점수가 8점 이상이 될 때까지 다시 쓰기 (while 루프)', code: `import agentlab as al

# 수업용 시나리오: 평가 → 수정 → 평가 … 순서로 모의 LLM 이 돌려줄 답 (키가 있으면 실제 LLM 이 평가한다)
llm = al.LLM(mock_responses=[
    '{"score": 5, "issues": ["근거 없음", "문장이 막연함"], "suggestion": "구체적인 수치를 넣어라"}',
    '수정본 1: AI 에이전트를 도입한 회사의 72%가 업무 시간을 줄였다.',
    '{"score": 6, "issues": ["출처 없음"], "suggestion": "출처를 밝혀라"}',
    '수정본 2: AI 에이전트를 도입한 회사의 72%가 업무 시간을 줄였다(출처: 2026 산업 설문).',
    '{"score": 9, "issues": [], "suggestion": "없음"}',
])
reflector = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
THRESHOLD, MAX_ROUNDS = 8, 4

rounds = 0
while True:
    ev = reflector.score(text, criteria='근거 · 구체성 · 출처')
    print(f'[{rounds}] 점수 {ev["score"]}  문제: {ev["issues"]}')
    if ev['score'] >= THRESHOLD:
        print('✅ 기준 통과')
        break
    if rounds >= MAX_ROUNDS:                     # 안전장치
        print('⚠ 최대 횟수 도달 — 지금까지의 최선을 사용')
        break
    text = reflector.revise(text, ev['suggestion'])
    rounds += 1
print('최종:', text)`,
            expect: `[0] 점수 5  문제: ['근거 없음', '문장이 막연함']
[1] 점수 6  문제: ['출처 없음']
[2] 점수 9  문제: []
✅ 기준 통과
최종: 수정본 2: AI 에이전트를 도입한 회사의 72%가 업무 시간을 줄였다(출처: 2026 산업 설문).`,
            desc: '<code>score()</code> 는 <code>json_mode</code> 로 평가를 받아 dict 로 돌려줍니다. 루프의 종료 조건이 <b>두 개</b>(기준 통과 또는 최대 횟수)인 점이 핵심입니다. 모의 LLM 기본 규칙은 항상 7점을 주므로 수업 시나리오(<code>mock_responses</code>)로 점수가 올라가는 과정을 보였습니다. 실습 6-5 에서 "항상 7점"일 때 안전장치가 작동하는지 확인합니다.' },
          { type: 'h', text: '생성자와 평가자를 분리하기' },
          { type: 'p', html: '같은 LLM 이라도 <b>역할(system prompt)을 나누면</b> 결과가 달라집니다. 생성자는 창의적으로 쓰고, 평가자는 기준표를 들고 엄격하게 봅니다. 한 프롬프트 안에서 "쓰고 나서 스스로 평가하라"고 하면 LLM 은 자기 글에 관대해지는 경향이 있습니다.' },
          { type: 'figure', html: FIG_GENEVAL, caption: '그림 6-5. 생성자-평가자 분리. 실무에서는 생성자와 평가자에 서로 다른 모델을 쓰기도 합니다.' },
          { type: 'code', title: '예제 6-9. 작가 LLM 과 편집자 LLM', code: `import agentlab as al

writer = al.LLM()       # 생성자 (실무에서는 온도를 높이거나 다른 모델을 쓰기도 한다)
critic = al.LLM()       # 평가자
WRITER = '당신은 기술 블로그 작가입니다.'
CRITIC = '당신은 엄격한 편집자입니다. 근거 · 구조 · 문장 길이를 기준으로 검토합니다.'

draft = writer.ask('AI 에이전트 소개 블로그 글 작성해 줘', system_prompt=WRITER)
print('📝 초안:', draft[:70].replace('\\n', ' '), '...')
review = critic.ask('다음 글을 검토해 줘:\\n' + draft, system_prompt=CRITIC)
print('🧑‍⚖️ 검토:', review[:90], '...')
final = writer.ask(f'원문:\\n{draft}\\n\\n피드백:\\n{review}\\n\\n피드백을 반영해 수정해 줘', system_prompt=WRITER)
print('✏️ 수정본:', final[:70], '...')
print('작가 호출', writer.calls, '회 · 편집자 호출', critic.calls, '회')`,
            expect: `📝 초안: [기술 블로그 작가] # AI 에이전트 소개 글  도입: 왜 지금 AI 에이전트 소개 글인가? 본문: 핵심 포인트 세 가지(자 ...
🧑‍⚖️ 검토: [엄격한 편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다. ...
✏️ 수정본: [기술 블로그 작가] 수정본: # AI 에이전트 소개 글 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: ...
작가 호출 2 회 · 편집자 호출 1 회`,
            desc: '<code>al.Reflector</code> 의 <code>critic_system</code> · <code>writer_system</code> 인자가 바로 이 두 역할입니다. 09차시 CrewAI 에서는 이 구조가 "작가 에이전트"와 "편집자 에이전트"라는 <b>팀</b>으로 확장됩니다.' },
          { type: 'h', text: '도구 오류를 보고 스스로 고치기' },
          { type: 'p', html: '반성은 글쓰기에만 쓰이지 않습니다. 에이전트가 만든 <b>계산식이나 코드가 오류</b>를 내면, 오류 메시지를 보여 주고 다시 만들게 하는 것도 자기 수정입니다. 04차시에서 도구가 예외 대신 <code>{"error": ...}</code> 를 돌려주도록 한 이유가 여기 있습니다: <b>오류도 관찰</b>이어야 루프가 이어집니다.' },
          { type: 'code', title: '예제 6-10. 계산식 오류 → 오류 메시지를 보고 재시도', code: `import agentlab as al

# 수업용 시나리오: 첫 수식은 0 으로 나누는 실수, 두 번째는 고친 수식 (키가 있으면 실제 LLM 이 수식을 쓴다)
llm = al.LLM(mock_responses=['10 / (5 - 5)', '10 / 5'])
question = '사과 10개를 5명이 똑같이 나누면 한 명당 몇 개?'

expr = llm.ask(f'{question}\\n파이썬 수식 하나만 써라. 설명 없이 수식만.')
for attempt in range(1, 4):                     # 최대 3번 시도
    result = al.calculator(expr)
    print(f'시도 {attempt}: {expr} → {result}')
    if 'error' not in result:
        print('✅ 답:', result['result'], '개')
        break
    expr = llm.ask(f'수식 {expr} 를 계산하니 오류가 났다: {result["error"]}\\n'
                   f'문제: {question}\\n오류를 고친 수식 하나만 써라.')     # 오류를 관찰로 돌려준다
else:
    print('⚠ 3번 안에 고치지 못했습니다')`,
            expect: `시도 1: 10 / (5 - 5) → {'error': '0 으로 나눌 수 없습니다', 'expression': '10 / (5 - 5)'}
시도 2: 10 / 5 → {'expression': '10 / 5', 'result': 2}
✅ 답: 2 개`,
            desc: '<code>calculator</code> 는 실패해도 예외를 던지지 않고 <code>error</code> 키를 돌려줍니다. 그 메시지를 다음 프롬프트에 넣으면 LLM 이 수식을 고칩니다. <code>for … else</code> 는 <code>break</code> 없이 끝났을 때(모두 실패) 실행됩니다. 코드 생성 에이전트가 "실행 → 오류 → 수정"을 반복하는 것도 똑같은 구조입니다.' },
          { type: 'h', text: '프롬프팅 기법: 생각하게 만들기' },
          { type: 'table', head: ['기법', '한 줄 요약', '프롬프트 예', '효과'], rows: [
            ['<b>Chain-of-Thought</b> (CoT)', '답 전에 풀이 과정을 쓰게 한다', '"단계별로 생각한 뒤 마지막 줄에 답을 써라"', '수학 · 논리 문제 정확도 ↑, 토큰 ↑'],
            ['<b>Self-Consistency</b>', '여러 번 풀어 <b>다수결</b>로 답을 고른다', '같은 질문을 온도 &gt; 0 으로 5번', '한 번의 실수에 덜 흔들림, 비용 ×N'],
            ['<b>Reflection</b>', '자기 답을 비평하고 고친다', '"위 답의 문제점을 찾고 수정본을 써라"', '글 · 코드 품질 ↑ (이 교시)'],
            ['<b>ReAct</b>', '생각과 도구 호출을 번갈아', 'Thought / Action / Observation', '외부 정보가 필요한 질문 (1교시)']
          ], caption: '표 6-2. 에이전트에서 자주 쓰는 프롬프팅 기법. 모두 "한 번에 답하지 말고 더 생각하라"는 공통점이 있습니다.' },
          { type: 'code', title: '예제 6-11. Self-Consistency: 다섯 번 풀어 다수결', code: `import agentlab as al
from collections import Counter

# 수업용 시나리오: 같은 문제를 5번 풀었을 때의 답 (실제 LLM 은 temperature 를 높여 여러 번 부른다)
llm = al.LLM(mock_responses=['풀이: 3 + 4 = 7. 답: 7', '풀이: 3 × 4 = 12. 답: 12',
                             '풀이: 3 + 4 = 7. 답: 7', '풀이: 사과 3, 배 4 → 7. 답: 7', '풀이: 3 + 4 = 7. 답: 7'])
question = '사과 3개와 배 4개가 있다. 과일은 모두 몇 개인가? 단계별로 생각한 뒤 "답: 숫자" 로 끝내라.'

answers = []
for i in range(5):
    out = llm.ask(question, temperature=0.9)           # CoT 프롬프트 + 온도 ↑
    ans = out.split('답:')[-1].strip()                 # 마지막 '답:' 뒤만 꺼낸다
    answers.append(ans)
    print(f'{i + 1}번째: {out}')
votes = Counter(answers)
print('투표:', dict(votes))
print('최종 답 (다수결):', votes.most_common(1)[0][0])`,
            expect: `1번째: 풀이: 3 + 4 = 7. 답: 7
2번째: 풀이: 3 × 4 = 12. 답: 12
3번째: 풀이: 3 + 4 = 7. 답: 7
4번째: 풀이: 사과 3, 배 4 → 7. 답: 7
5번째: 풀이: 3 + 4 = 7. 답: 7
투표: {'7': 4, '12': 1}
최종 답 (다수결): 7`,
            desc: '두 번째 풀이가 틀렸지만 다수결이 바로잡습니다. "단계별로 생각한 뒤 답을 써라"가 CoT, 여러 번 풀어 투표하는 것이 Self-Consistency 입니다. 실제 LLM 에서는 <code>temperature</code> 를 0 보다 크게 해야 풀이가 다양해집니다(모의 LLM 은 시나리오 답을 돌려줍니다).' },
          { type: 'h', text: '에이전트의 4대 요소 총정리 (03 ~ 06차시)' },
          { type: 'figure', html: FIG_FOUR, caption: '그림 6-6. 역할 · 도구 · 기억 · 계획과 반성. 네 요소가 에이전트 루프를 둘러쌉니다.' },
          { type: 'table', head: ['요소', '질문', 'agentlab', '실제 프레임워크 (Part 3)'], rows: [
            ['🎭 역할 (03)', '누구로서 답하는가?', '<code>system=</code> · <code>al.system()</code>', 'LangChain system message · CrewAI <code>role/backstory</code>'],
            ['🔧 도구 (04)', '무엇을 할 수 있는가?', '<code>@al.tool</code> · <code>al.Agent(tools=)</code>', 'LangChain <code>@tool</code> · <code>bind_tools</code>'],
            ['🧠 기억 (05)', '무엇을 기억하는가?', '<code>ConversationMemory</code> · <code>VectorStore</code>', 'LangGraph <code>MemorySaver</code> · 벡터 DB'],
            ['🗺️ 계획 · 반성 (06)', '어떤 순서로, 얼마나 잘?', '<code>ReActAgent</code> · <code>Planner</code> · <code>Reflector</code>', 'LangGraph 그래프 루프 · <code>create_react_agent</code>']
          ], caption: '표 6-3. Part 2 총정리. 다음 Part 3 에서는 같은 네 요소를 LangChain · LangGraph · CrewAI · AutoGen 으로 다시 만듭니다.' },
          { type: 'colab', title: 'Colab 실습 06 — 실제 LLM 으로 계획과 반성 돌려 보기', html: '<p>Colab 에서는 <b>Gemini 무료 키</b>(Colab Secrets 의 <code>GEMINI_API_KEY</code>)로 같은 코드를 실행합니다. 모의 LLM 과 달리 목표마다 다른 계획이 나오고, 비평이 라운드마다 달라지며, 평가 점수가 실제로 올라가는지 확인합니다. 마지막에는 ReAct 와 Plan-and-Execute 의 LLM 호출 횟수와 토큰을 비교합니다.</p>' },
          { type: 'callout', kind: 'info', teacher: true, title: '🧑‍🏫 수업 준비 체크리스트', html: '<ul><li>브라우저에서 예제 6-2 · 6-6 · 6-8 을 미리 실행해 출력을 확인 (모의 LLM 은 즉시, 실제 키는 호출당 1~5초)</li><li>🔑 키가 있는 학생과 없는 학생의 출력 차이를 비교하는 활동을 준비: 같은 초안을 <code>improve(rounds=2)</code> 로 돌리고 결과를 서로 비교</li><li>Colab 노트북 06 의 Secrets 설정(<code>GEMINI_API_KEY</code>)을 수업 전에 안내</li><li>1교시 재계획 예제(6-5)는 <code>mock_responses</code> 시나리오임을 먼저 밝혀 혼란을 막기</li></ul>' },
          { type: 'callout', kind: 'warn', teacher: true, title: '🧑‍🏫 자주 나오는 오개념', html: '<ul><li><b>"ReAct 는 함수 호출과 다른 기술이다"</b> → 형식(텍스트 vs JSON)만 다르고 루프는 같습니다. 그림 6-2 와 04차시 그림을 나란히 보여 주세요.</li><li><b>"Observation 도 LLM 이 쓴다"</b> → 프로그램이 도구를 실행해 채웁니다. LLM 이 쓰면 환각입니다.</li><li><b>"반성을 많이 돌릴수록 좋다"</b> → 1~3회를 넘으면 효과는 줄고 비용만 늡니다. 점수 + 최대 횟수로 멈춥니다.</li><li><b>"모의 LLM 이 매번 같은 비평을 하니 반성이 쓸모없다"</b> → 모의 LLM 의 한계일 뿐입니다. 실제 키로 바꿔 보여 주세요.</li></ul>' },
          { type: 'callout', kind: 'tip', teacher: true, title: '🧑‍🏫 평가 루브릭 (실습 6-4 ~ 6-6)', html: '<table><tr><th>항목</th><th>우수 (3)</th><th>보통 (2)</th><th>미흡 (1)</th></tr><tr><td>루프 구조</td><td>종료 조건 2개(기준 · 최대 횟수)를 모두 구현</td><td>하나만 구현</td><td>무한 루프 가능</td></tr><tr><td>역할 분리</td><td>critic/writer system 을 목적에 맞게 작성</td><td>기본값 사용</td><td>역할 없음</td></tr><tr><td>오류 처리</td><td>error 키를 검사해 재시도 프롬프트에 포함</td><td>재시도는 하나 오류 내용 미포함</td><td>오류 시 중단</td></tr><tr><td>설명</td><td>출력을 보고 각 단계의 의미를 설명</td><td>일부 설명</td><td>실행만</td></tr></table>' }
        ],
        practice: [
          { title: '실습 6-4. 나만의 검토자 만들기', level: 1,
            desc: '<p><code>al.Reflector</code> 의 <code>critic_system</code> 을 "당신은 초등학생 눈높이를 검토하는 선생님입니다." 로, <code>writer_system</code> 을 "당신은 쉬운 말로 고쳐 쓰는 작가입니다." 로 바꿔 아래 초안을 한 번 비평 · 수정하세요. 답 앞의 역할 표시가 어떻게 바뀌는지 확인합니다.</p>',
            hint: '<code>al.Reflector(llm, critic_system=\'당신은 …입니다.\', writer_system=\'당신은 …입니다.\')</code>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: critic_system, writer_system 을 바꿔 Reflector 만들기
reflector = al.Reflector(llm)
draft = '광합성은 식물이 빛 에너지를 화학 에너지로 전환하는 과정이다.'
feedback = reflector.critique(draft)
print('🔍', feedback)
# TODO: 수정본 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm,
                         critic_system='당신은 초등학생 눈높이를 검토하는 선생님입니다.',
                         writer_system='당신은 쉬운 말로 고쳐 쓰는 작가입니다.')
draft = '광합성은 식물이 빛 에너지를 화학 에너지로 전환하는 과정이다.'
feedback = reflector.critique(draft)
print('🔍', feedback)
revised = reflector.revise(draft, feedback)
print('✏️', revised)
`,
            expect: `🔍 [초등학생 눈높이를 검토하는 선생님] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.
✏️ [쉬운 말로 고쳐 쓰는 작가] 수정본: 광합성은 식물이 빛 에너지를 화학 에너지로 전환하는 과정이다. 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.` },
          { title: '실습 6-5. 안전장치가 작동하는지 확인하기', level: 2,
            desc: '<p>예제 6-8 의 while 루프를 <code>mock_responses</code> 없이 <code>al.LLM()</code> 으로 돌려 보세요. 모의 LLM 은 항상 7점을 주므로 기준(8점)을 넘지 못합니다. <code>MAX_ROUNDS = 2</code> 로 두고 "최대 횟수 도달" 메시지가 나오는지, LLM 호출이 모두 몇 번인지 출력하세요.</p>',
            hint: '라운드마다 score 1번 + revise 1번. 마지막 평가까지 세면 2 × 2 + 1 = 5번.',
            starter: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
THRESHOLD, MAX_ROUNDS = 8, 2
rounds = 0
while True:
    ev = reflector.score(text)
    print(f'[{rounds}] 점수 {ev["score"]}')
    # TODO: 기준 통과 → break / 최대 횟수 → 메시지 출력 후 break / 아니면 revise 후 rounds += 1
    break
# TODO: LLM 호출 횟수 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
THRESHOLD, MAX_ROUNDS = 8, 2
rounds = 0
while True:
    ev = reflector.score(text)
    print(f'[{rounds}] 점수 {ev["score"]}')
    if ev['score'] >= THRESHOLD:
        print('✅ 기준 통과')
        break
    if rounds >= MAX_ROUNDS:
        print('⚠ 최대 횟수 도달 — 지금까지의 최선을 사용')
        break
    text = reflector.revise(text, ev['suggestion'])
    rounds += 1
print('LLM 호출 횟수:', llm.calls)
`,
            expect: `[0] 점수 7
[1] 점수 7
[2] 점수 7
⚠ 최대 횟수 도달 — 지금까지의 최선을 사용
LLM 호출 횟수: 5` },
          { title: '실습 6-6. (도전) 여러 수식을 고쳐 가며 계산하기', level: 3,
            desc: '<p>예제 6-10 을 확장해 <b>세 문제</b>를 차례로 풉니다. 각 문제마다 LLM 에게 수식을 받아 <code>al.calculator</code> 로 계산하고, 오류면 오류 메시지를 넣어 한 번 더 받습니다. 수업 시나리오로 <code>mock_responses=[\'8 / 0\', \'8 / 2\', \'3 * 4\', \'sqrt(-1) + x\', \'sqrt(16)\']</code> 을 쓰세요. 문제별 최종 답과 총 시도 횟수를 출력합니다.</p>',
            hint: '함수 <code>solve(question)</code> 안에 예제 6-10 의 for 루프를 넣고 세 번 호출합니다.',
            starter: `import agentlab as al

llm = al.LLM(mock_responses=['8 / 0', '8 / 2', '3 * 4', 'sqrt(-1) + x', 'sqrt(16)'])
questions = ['사탕 8개를 2명이 나누면?', '3명이 4개씩 가지면 모두?', '넓이 16 인 정사각형의 한 변은?']
tries = 0

def solve(question):
    global tries
    expr = llm.ask(question + ' 수식 하나만 써라.')
    # TODO: 최대 3번 시도 — calculator 결과에 error 가 있으면 오류를 넣어 다시 요청
    return None

for q in questions:
    print(q, '→', solve(q))
print('총 시도:', tries)
`,
            solution: `import agentlab as al

llm = al.LLM(mock_responses=['8 / 0', '8 / 2', '3 * 4', 'sqrt(-1) + x', 'sqrt(16)'])
questions = ['사탕 8개를 2명이 나누면?', '3명이 4개씩 가지면 모두?', '넓이 16 인 정사각형의 한 변은?']
tries = 0

def solve(question):
    global tries
    expr = llm.ask(question + ' 수식 하나만 써라.')
    for attempt in range(3):
        tries += 1
        r = al.calculator(expr)
        if 'error' not in r:
            return r['result']
        expr = llm.ask(f'수식 {expr} 오류: {r["error"]}. 고친 수식 하나만 써라.')
    return None

for q in questions:
    print(q, '→', solve(q))
print('총 시도:', tries)
`,
            expect: `사탕 8개를 2명이 나누면? → 4
3명이 4개씩 가지면 모두? → 12
넓이 16 인 정사각형의 한 변은? → 4
총 시도: 5` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '반성(Reflection)과 자기 수정', subtitle: '생성 → 비평 → 수정 · 평가자 LLM · 오류 재시도', notes: '<p>💬 "글을 쓰고 한 번도 안 읽어 보고 제출한 적 있나요?" → 다시 읽으면 고칠 게 보인다. LLM 도 같다.</p><p>⏱ 도입 5분</p>' },
          { layout: 'diagram', title: '생성 → 비평 → 수정 루프', html: FIG_REFLECT, caption: '정해진 횟수 또는 평가 점수로 멈춘다',
            notes: '<p>그림의 두 종료 조건(rounds, score ≥ 기준)을 먼저 보여 주고, 뒤의 while 예제에서 다시 확인합니다.</p>' },
          { layout: 'code', title: 'Reflector: 비평 한 번, 수정 한 번', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
draft = 'AI 에이전트는 유용하다. 많은 회사가 쓴다.'
fb = reflector.critique(draft, criteria='근거를 중심으로')
print('🔍', fb)
print('✏️', reflector.revise(draft, fb))`, points: ['<code>critique</code> = 검토자 역할', '<code>revise</code> = 작가 역할', '답 앞 <code>[역할]</code> 은 모의 LLM 표시'],
            notes: '<p>▶ 실행. 🔑 키가 있는 학생의 결과를 화면에 띄워 모의 LLM 과 비교하면 효과가 큽니다.</p>' },
          { layout: 'code', title: 'improve(rounds=2)', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
final = reflector.improve('우리 동아리에 가입하세요.', rounds=2)
print('호출 횟수:', llm.calls)`, points: ['라운드 = 비평 + 수정 = LLM 2번', '2라운드 → 4번 호출', '보통 1~3회가 적당'],
            notes: '<p>💬 "rounds=10 이면 좋아질까?" → 비용은 10배, 효과는 금방 포화. 다음 슬라이드의 점수 기준으로 연결.</p>' },
          { layout: 'code', title: '평가자 점수로 "충분한가?" 정하기', code: `import agentlab as al

llm = al.LLM(mock_responses=[
    '{"score": 5, "issues": ["근거 없음"], "suggestion": "수치를 넣어라"}',
    '수정본: 도입 회사의 72%가 업무 시간을 줄였다.',
    '{"score": 9, "issues": [], "suggestion": "없음"}'])
ref = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
for rounds in range(3):                      # 최대 3번 (안전장치)
    ev = ref.score(text)
    print(rounds, '점수', ev['score'], ev['issues'])
    if ev['score'] >= 8:
        break
    text = ref.revise(text, ev['suggestion'])
print('최종:', text)`, points: ['<code>score()</code> → JSON {score, issues, suggestion}', '기준 미만이면 다시 쓰기', '<b>최대 횟수</b> 없으면 무한 루프'],
            notes: '<p>▶ 실행. 종료 조건이 두 개임을 강조. 실습 6-5 에서 "항상 7점"인 모의 LLM 으로 안전장치를 확인하게 합니다.</p>' },
          { layout: 'diagram', title: '생성자와 평가자 분리', html: FIG_GENEVAL, caption: '같은 모델도 역할을 나누면 더 엄격해진다',
            notes: '<p>💬 "자기 글을 자기가 채점하면?" → 관대해진다. 역할 분리 → 09차시 CrewAI 의 팀 구조로 이어진다고 예고.</p>' },
          { layout: 'code', title: '도구 오류를 보고 스스로 고치기', code: `import agentlab as al

llm = al.LLM(mock_responses=['10 / (5 - 5)', '10 / 5'])
expr = llm.ask('사과 10개를 5명이 나누면? 수식만 써라.')
for attempt in range(3):
    r = al.calculator(expr)
    print(attempt + 1, expr, '→', r)
    if 'error' not in r:
        break
    expr = llm.ask(f'수식 {expr} 오류: {r["error"]}. 고친 수식만 써라.')`, points: ['오류도 <b>관찰</b>이다 → 루프가 이어짐', '오류 메시지를 다음 프롬프트에', '코드 생성 에이전트도 같은 구조'],
            notes: '<p>04차시에서 도구가 예외 대신 error 키를 돌려주게 한 이유를 여기서 회수합니다.</p>' },
          { layout: 'table', title: '프롬프팅 기법 한눈에', head: ['기법', '요약', '효과'], rows: [
            ['Chain-of-Thought', '답 전에 풀이 과정', '논리 · 수학 정확도 ↑'],
            ['Self-Consistency', '여러 번 풀어 다수결', '한 번의 실수에 강함'],
            ['Reflection', '비평하고 고치기', '글 · 코드 품질 ↑'],
            ['ReAct', '생각 + 도구 호출', '외부 정보 질문']
          ], lead: '공통점: "한 번에 답하지 말고 더 생각하라"', notes: '<p>CoT 는 이미 Thought 줄로 체험했음을 짚습니다. Self-Consistency 는 다음 코드로.</p>' },
          { layout: 'code', title: 'Self-Consistency: 다수결', code: `import agentlab as al
from collections import Counter

llm = al.LLM(mock_responses=['답: 7', '답: 12', '답: 7', '답: 7', '답: 7'])
q = '사과 3개와 배 4개, 모두 몇 개? 단계별로 생각하고 "답: 숫자"로 끝내라.'
answers = [llm.ask(q, temperature=0.9).split('답:')[-1].strip() for _ in range(5)]
votes = Counter(answers)
print(dict(votes), '→', votes.most_common(1)[0][0])`, points: ['CoT 프롬프트 + 온도 ↑ 로 N번', '다수결로 최종 답', '비용 ×N — 중요한 판단에만'],
            notes: '<p>실제 LLM 은 temperature 를 올려야 답이 다양해집니다. 모의 LLM 은 시나리오 답.</p>' },
          { layout: 'diagram', title: '4대 요소 총정리', html: FIG_FOUR, caption: '역할 · 도구 · 기억 · 계획과 반성',
            notes: '<p>Part 2 마무리. 네 요소를 학생이 한 문장씩 설명하게 합니다. 💬 "Part 3 에서는 이 네 가지를 LangChain · LangGraph 로 다시 만든다."</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>정답 ②. 무한 루프 = 실제 서비스에서는 비용 폭탄.</p>' },
          { layout: 'practice', title: '실습 6-5. 안전장치 확인', desc: '<p>항상 7점을 주는 모의 LLM 으로 while 루프를 돌려 "최대 횟수 도달"이 나오게 하세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
ref = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
rounds = 0
while True:
    ev = ref.score(text)
    print(rounds, ev['score'])
    # TODO: 기준 8 통과 / 최대 2회 / 아니면 revise
    break
print('호출:', llm.calls)`, solution: `import agentlab as al

llm = al.LLM()
ref = al.Reflector(llm)
text = 'AI 에이전트는 회사에 도움이 된다.'
rounds = 0
while True:
    ev = ref.score(text)
    print(rounds, ev['score'])
    if ev['score'] >= 8:
        break
    if rounds >= 2:
        print('⚠ 최대 횟수 도달')
        break
    text = ref.revise(text, ev['suggestion'])
    rounds += 1
print('호출:', llm.calls)`, notes: '<p>호출 횟수 5 = 평가 3 + 수정 2. 학생이 직접 세어 보게 합니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['반성 = <b>생성 → 비평 → 수정</b> 루프 (<code>Reflector.critique / revise / improve</code>)', '평가자 점수(<code>score</code>)로 멈추되 <b>최대 횟수</b> 안전장치 필수', '생성자 · 평가자 역할 분리 → 더 엄격한 피드백', '도구 오류도 관찰 → 오류 메시지로 재시도', '4대 요소 완성: 역할 · 도구 · 기억 · 계획과 반성 → Part 3 프레임워크로'], notes: '<p>⏱ 정리 9분 (퀴즈 포함). 과제: Colab 06 노트북 — 실제 LLM 으로 점수가 올라가는지 확인.</p>' }
        ]
      }
    ]
  });
})();
