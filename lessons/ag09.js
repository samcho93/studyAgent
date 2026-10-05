/* 09차시 CrewAI: 역할 분담 에이전트 팀 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 9-1. 한 프롬프트에 모든 역할 vs 역할을 나눈 팀 */
  const FIG_ONE_VS_TEAM = `<svg viewBox="0 0 720 320" role="img" aria-label="왼쪽은 LLM 하나에 조사·작성·검토를 한꺼번에 시켜 얕은 결과가 나오고, 오른쪽은 조사원·작가·편집자 세 에이전트가 차례로 일해 깊은 결과가 나오는 비교 그림">
  ${ARROW('m09a1')}
  <rect x="10" y="10" width="330" height="300" rx="14" class="card-bg"/>
  <rect x="380" y="10" width="330" height="300" rx="14" class="card-bg"/>
  <text x="175" y="38" text-anchor="middle" class="tx-b">❌ 한 프롬프트에 모든 역할</text>
  <text x="545" y="38" text-anchor="middle" class="tx-b">✅ 역할을 나눈 에이전트 팀</text>
  <rect x="40" y="60" width="270" height="78" rx="10" class="p4s"/>
  <text x="175" y="82" text-anchor="middle" class="tx">"조사하고, 글을 쓰고,</text>
  <text x="175" y="100" text-anchor="middle" class="tx">검토까지 전부 해 줘"</text>
  <text x="175" y="124" text-anchor="middle" class="tx-m">긴 복합 지시 · 역할이 뒤섞임</text>
  <line x1="175" y1="140" x2="175" y2="168" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <rect x="115" y="172" width="120" height="48" rx="12" class="p1"/>
  <text x="175" y="201" text-anchor="middle" class="tx-w">LLM 1회</text>
  <line x1="175" y1="222" x2="175" y2="250" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <rect x="40" y="254" width="270" height="44" rx="10" class="p4s"/>
  <text x="175" y="273" text-anchor="middle" class="tx">일부 지시만 수행 · 얕은 결과</text>
  <text x="175" y="290" text-anchor="middle" class="tx-m">검증 없음 · 무엇이 빠졌는지 모름</text>
  <rect x="400" y="60" width="90" height="56" rx="10" class="p1"/>
  <text x="445" y="84" text-anchor="middle" class="tx-w">조사원</text>
  <text x="445" y="104" text-anchor="middle" class="tx-w" font-size="11">조사해라</text>
  <rect x="500" y="60" width="90" height="56" rx="10" class="p2"/>
  <text x="545" y="84" text-anchor="middle" class="tx-w">작가</text>
  <text x="545" y="104" text-anchor="middle" class="tx-w" font-size="11">글을 써라</text>
  <rect x="600" y="60" width="90" height="56" rx="10" class="p3"/>
  <text x="645" y="84" text-anchor="middle" class="tx-w">편집자</text>
  <text x="645" y="104" text-anchor="middle" class="tx-w" font-size="11">검토해라</text>
  <line x1="490" y1="88" x2="498" y2="88" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <line x1="590" y1="88" x2="598" y2="88" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <rect x="400" y="136" width="90" height="40" rx="8" class="p1s"/><text x="445" y="160" text-anchor="middle" class="tx-m">조사 결과</text>
  <rect x="500" y="136" width="90" height="40" rx="8" class="p2s"/><text x="545" y="160" text-anchor="middle" class="tx-m">초안</text>
  <rect x="600" y="136" width="90" height="40" rx="8" class="p3s"/><text x="645" y="160" text-anchor="middle" class="tx-m">검토 의견</text>
  <line x1="445" y1="118" x2="445" y2="132" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <line x1="545" y1="118" x2="545" y2="132" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <line x1="645" y1="118" x2="645" y2="132" class="ln" stroke-width="2" marker-end="url(#m09a1)"/>
  <path d="M490 156 L498 156" class="ln" stroke-width="2" stroke-dasharray="3 3"/>
  <path d="M590 156 L598 156" class="ln" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="545" y="200" text-anchor="middle" class="tx-m">이전 결과(context)가 다음 작업의 입력이 된다</text>
  <rect x="400" y="220" width="290" height="78" rx="10" class="p5s"/>
  <text x="545" y="243" text-anchor="middle" class="tx">분업 · 전문화 · 검증</text>
  <text x="545" y="263" text-anchor="middle" class="tx-m">각 단계가 짧고 명확한 프롬프트 → 깊은 결과</text>
  <text x="545" y="283" text-anchor="middle" class="tx-m">단, LLM 호출 3회 (비용 · 시간 ↑)</text>
</svg>`;

  /* 그림 9-2. CrewAI 의 3요소 */
  const FIG_CREW3 = `<svg viewBox="0 0 720 300" role="img" aria-label="CrewAI 의 세 요소: Agent(역할·목표·배경·도구), Task(설명·기대 결과물·담당 에이전트·참고 작업), Crew(에이전트 목록·작업 목록·프로세스)를 카드로 보여 주는 그림">
  ${ARROW('m09a2')}
  <rect x="10" y="40" width="220" height="230" rx="14" class="card-bg"/>
  <rect x="250" y="40" width="220" height="230" rx="14" class="card-bg"/>
  <rect x="490" y="40" width="220" height="230" rx="14" class="card-bg"/>
  <rect x="10" y="40" width="220" height="44" rx="14" class="p1"/>
  <rect x="250" y="40" width="220" height="44" rx="14" class="p2"/>
  <rect x="490" y="40" width="220" height="44" rx="14" class="p3"/>
  <text x="120" y="68" text-anchor="middle" class="tx-w">👤 Agent (누가)</text>
  <text x="360" y="68" text-anchor="middle" class="tx-w">📋 Task (무엇을)</text>
  <text x="600" y="68" text-anchor="middle" class="tx-w">👥 Crew (어떻게)</text>
  <text x="28" y="112" class="tx-b">role</text><text x="110" y="112" class="tx-m">역할 이름 "시장 조사원"</text>
  <text x="28" y="140" class="tx-b">goal</text><text x="110" y="140" class="tx-m">무엇을 이루려는가</text>
  <text x="28" y="168" class="tx-b">backstory</text><text x="110" y="168" class="tx-m">경력 · 성향 · 원칙</text>
  <text x="28" y="196" class="tx-b">tools</text><text x="110" y="196" class="tx-m">쓸 수 있는 도구 목록</text>
  <text x="28" y="224" class="tx-b">llm</text><text x="110" y="224" class="tx-m">사용할 모델</text>
  <text x="120" y="256" text-anchor="middle" class="tx-m">→ 시스템 프롬프트가 된다</text>
  <text x="268" y="112" class="tx-b">description</text><text x="372" y="112" class="tx-m">작업 지시문</text>
  <text x="268" y="140" class="tx-b">expected_output</text><text x="398" y="140" class="tx-m">결과물 형식</text>
  <text x="268" y="168" class="tx-b">agent</text><text x="372" y="168" class="tx-m">담당 에이전트</text>
  <text x="268" y="196" class="tx-b">context</text><text x="372" y="196" class="tx-m">참고할 이전 작업들</text>
  <text x="268" y="224" class="tx-b">output</text><text x="372" y="224" class="tx-m">실행 후 채워지는 결과</text>
  <text x="360" y="256" text-anchor="middle" class="tx-m">→ 사용자 프롬프트가 된다</text>
  <text x="508" y="112" class="tx-b">agents</text><text x="600" y="112" class="tx-m">[조사원, 작가, …]</text>
  <text x="508" y="140" class="tx-b">tasks</text><text x="600" y="140" class="tx-m">[t1, t2, …] 실행 순서</text>
  <text x="508" y="168" class="tx-b">process</text><text x="600" y="168" class="tx-m">sequential / hierarchical</text>
  <text x="508" y="196" class="tx-b">verbose</text><text x="600" y="196" class="tx-m">진행 과정 출력</text>
  <text x="508" y="224" class="tx-b">kickoff()</text><text x="600" y="224" class="tx-m">팀 가동 → 최종 결과</text>
  <text x="600" y="256" text-anchor="middle" class="tx-m">→ 작업을 배정하고 결과를 넘긴다</text>
  <line x1="232" y1="150" x2="246" y2="150" class="ln" stroke-width="2" marker-end="url(#m09a2)"/>
  <line x1="472" y1="150" x2="486" y2="150" class="ln" stroke-width="2" marker-end="url(#m09a2)"/>
  <text x="360" y="24" text-anchor="middle" class="tx-m">에이전트를 만들고 → 작업을 정의하고 → 크루로 묶어 kickoff</text>
</svg>`;

  /* 그림 9-3. 순차 파이프라인과 context 전달 */
  const FIG_PIPELINE = `<svg viewBox="0 0 720 260" role="img" aria-label="Crew.kickoff 가 작업 1을 조사원에게, 작업 2를 작가에게 차례로 맡기고, 작업 1의 output 이 작업 2의 context 로 들어가는 흐름">
  ${ARROW('m09a3')}
  <rect x="10" y="20" width="700" height="52" rx="12" class="p3s"/>
  <text x="360" y="42" text-anchor="middle" class="tx-b">Crew(agents, tasks, process='sequential').kickoff()</text>
  <text x="360" y="62" text-anchor="middle" class="tx-m">tasks 목록을 순서대로 돈다 — 작업마다 담당 에이전트에게 프롬프트를 만들어 보낸다</text>
  <rect x="30" y="110" width="200" height="110" rx="12" class="card-bg"/>
  <rect x="30" y="110" width="200" height="30" rx="12" class="p1"/>
  <text x="130" y="130" text-anchor="middle" class="tx-w">작업 1 · 시장 조사원</text>
  <text x="44" y="162" class="tx-m">description: 동향을 조사해라</text>
  <text x="44" y="182" class="tx-m">expected_output: 핵심 3가지</text>
  <text x="44" y="206" class="tx-b">t1.output = "조사 결과 — …"</text>
  <rect x="300" y="110" width="200" height="110" rx="12" class="card-bg"/>
  <rect x="300" y="110" width="200" height="30" rx="12" class="p2"/>
  <text x="400" y="130" text-anchor="middle" class="tx-w">작업 2 · 블로그 작가</text>
  <text x="314" y="162" class="tx-m">description: 포스트를 작성해라</text>
  <text x="314" y="182" class="tx-m">context: [t1] ← 조사 결과 첨부</text>
  <text x="314" y="206" class="tx-b">t2.output = "# 제목 …"</text>
  <rect x="570" y="130" width="120" height="70" rx="12" class="p5s"/>
  <text x="630" y="158" text-anchor="middle" class="tx-b">최종 결과</text>
  <text x="630" y="180" text-anchor="middle" class="tx-m">= 마지막 output</text>
  <line x1="232" y1="165" x2="296" y2="165" class="ln" stroke-width="2.5" marker-end="url(#m09a3)"/>
  <text x="264" y="152" text-anchor="middle" class="tx-m" font-size="11">context</text>
  <line x1="502" y1="165" x2="566" y2="165" class="ln" stroke-width="2.5" marker-end="url(#m09a3)"/>
  <line x1="130" y1="74" x2="130" y2="106" class="ln" stroke-width="2" marker-end="url(#m09a3)"/>
  <line x1="400" y1="74" x2="400" y2="106" class="ln" stroke-width="2" marker-end="url(#m09a3)"/>
  <text x="360" y="246" text-anchor="middle" class="tx-m">프롬프트 = description + [참고할 이전 작업 결과] + [기대하는 결과물]</text>
</svg>`;

  /* 그림 9-4. 도구를 가진 에이전트의 내부 */
  const FIG_TOOLAGENT = `<svg viewBox="0 0 720 250" role="img" aria-label="도구를 가진 CrewAgent 는 내부에서 4차시의 Agent 루프(LLM 판단 → 도구 호출 → 관찰 → 답)를 돌린 뒤 결과를 task.output 으로 넘긴다는 그림">
  ${ARROW('m09a4')}
  <rect x="10" y="30" width="470" height="190" rx="14" class="card-bg"/>
  <text x="245" y="56" text-anchor="middle" class="tx-b">CrewAgent(role='시장 조사원', tools=[wiki_search])</text>
  <rect x="40" y="90" width="110" height="50" rx="10" class="p1"/>
  <text x="95" y="120" text-anchor="middle" class="tx-w">LLM 판단</text>
  <rect x="200" y="90" width="110" height="50" rx="10" class="p2"/>
  <text x="255" y="112" text-anchor="middle" class="tx-w">도구 호출</text>
  <text x="255" y="130" text-anchor="middle" class="tx-w" font-size="11">wiki_search(…)</text>
  <rect x="350" y="90" width="110" height="50" rx="10" class="p4"/>
  <text x="405" y="120" text-anchor="middle" class="tx-w">관찰</text>
  <line x1="152" y1="115" x2="196" y2="115" class="ln" stroke-width="2" marker-end="url(#m09a4)"/>
  <line x1="312" y1="115" x2="346" y2="115" class="ln" stroke-width="2" marker-end="url(#m09a4)"/>
  <path d="M405 142 C405 185 95 185 95 144" class="ln" stroke-width="2" fill="none" marker-end="url(#m09a4)"/>
  <text x="250" y="200" text-anchor="middle" class="tx-m">4차시의 에이전트 루프가 역할 안에서 그대로 돈다 (max_steps 까지)</text>
  <line x1="482" y1="125" x2="536" y2="125" class="ln" stroke-width="2.5" marker-end="url(#m09a4)"/>
  <rect x="540" y="95" width="160" height="60" rx="12" class="p1s"/>
  <text x="620" y="120" text-anchor="middle" class="tx-b">task.output</text>
  <text x="620" y="140" text-anchor="middle" class="tx-m">출처가 있는 조사 결과</text>
  <text x="620" y="190" text-anchor="middle" class="tx-m">→ 다음 작업의 context</text>
</svg>`;

  /* 그림 9-5. sequential vs hierarchical */
  const FIG_SEQ_HIER = `<svg viewBox="0 0 720 300" role="img" aria-label="왼쪽 sequential 은 작업이 정해진 순서대로 담당 에이전트에게 가고, 오른쪽 hierarchical 은 매니저 LLM 이 작업마다 담당자를 고르는 구조 비교">
  ${ARROW('m09a5')}
  <rect x="10" y="10" width="340" height="280" rx="14" class="card-bg"/>
  <rect x="370" y="10" width="340" height="280" rx="14" class="card-bg"/>
  <text x="180" y="38" text-anchor="middle" class="tx-b">process='sequential'</text>
  <text x="540" y="38" text-anchor="middle" class="tx-b">process='hierarchical'</text>
  <text x="180" y="58" text-anchor="middle" class="tx-m">작업 순서 = 코드에 쓴 순서, 담당자 고정</text>
  <text x="540" y="58" text-anchor="middle" class="tx-m">매니저 LLM 이 작업마다 담당자를 고른다</text>
  <rect x="40" y="90" width="80" height="44" rx="10" class="p1"/><text x="80" y="117" text-anchor="middle" class="tx-w">작업 1</text>
  <rect x="140" y="90" width="80" height="44" rx="10" class="p2"/><text x="180" y="117" text-anchor="middle" class="tx-w">작업 2</text>
  <rect x="240" y="90" width="80" height="44" rx="10" class="p3"/><text x="280" y="117" text-anchor="middle" class="tx-w">작업 3</text>
  <line x1="122" y1="112" x2="136" y2="112" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <line x1="222" y1="112" x2="236" y2="112" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <rect x="40" y="170" width="80" height="40" rx="8" class="p1s"/><text x="80" y="195" text-anchor="middle" class="tx-m">조사원</text>
  <rect x="140" y="170" width="80" height="40" rx="8" class="p2s"/><text x="180" y="195" text-anchor="middle" class="tx-m">작가</text>
  <rect x="240" y="170" width="80" height="40" rx="8" class="p3s"/><text x="280" y="195" text-anchor="middle" class="tx-m">편집자</text>
  <line x1="80" y1="136" x2="80" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <line x1="180" y1="136" x2="180" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <line x1="280" y1="136" x2="280" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <text x="180" y="240" text-anchor="middle" class="tx">예측 가능 · 저렴 · 디버깅 쉬움</text>
  <text x="180" y="262" text-anchor="middle" class="tx-m">파이프라인형 업무에 적합</text>
  <rect x="470" y="80" width="140" height="48" rx="12" class="p5"/>
  <text x="540" y="100" text-anchor="middle" class="tx-w">매니저 (manager_llm)</text>
  <text x="540" y="118" text-anchor="middle" class="tx-w" font-size="11">"이 작업은 누가 적임자?"</text>
  <rect x="400" y="170" width="80" height="40" rx="8" class="p1s"/><text x="440" y="195" text-anchor="middle" class="tx-m">조사원</text>
  <rect x="500" y="170" width="80" height="40" rx="8" class="p2s"/><text x="540" y="195" text-anchor="middle" class="tx-m">작가</text>
  <rect x="600" y="170" width="80" height="40" rx="8" class="p3s"/><text x="640" y="195" text-anchor="middle" class="tx-m">편집자</text>
  <line x1="510" y1="130" x2="446" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <line x1="540" y1="130" x2="540" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <line x1="570" y1="130" x2="634" y2="166" class="ln" stroke-width="2" marker-end="url(#m09a5)"/>
  <text x="540" y="240" text-anchor="middle" class="tx">유연 · 작업마다 LLM 호출 1회 추가</text>
  <text x="540" y="262" text-anchor="middle" class="tx-m">담당자가 미리 정해지지 않은 업무에 적합</text>
</svg>`;

  /* 그림 9-6. 반성 단계를 넣은 3인 크루 */
  const FIG_REFLECT = `<svg viewBox="0 0 720 230" role="img" aria-label="조사원의 조사, 작가의 초안, 편집자의 검토, 작가의 수정 네 작업이 이어지고 검토 의견이 수정 작업의 context 로 들어가는 그림">
  ${ARROW('m09a6')}
  <rect x="20" y="70" width="140" height="60" rx="12" class="p1"/>
  <text x="90" y="95" text-anchor="middle" class="tx-w">① 조사</text><text x="90" y="115" text-anchor="middle" class="tx-w" font-size="11">조사원</text>
  <rect x="200" y="70" width="140" height="60" rx="12" class="p2"/>
  <text x="270" y="95" text-anchor="middle" class="tx-w">② 초안 작성</text><text x="270" y="115" text-anchor="middle" class="tx-w" font-size="11">작가</text>
  <rect x="380" y="70" width="140" height="60" rx="12" class="p3"/>
  <text x="450" y="95" text-anchor="middle" class="tx-w">③ 검토</text><text x="450" y="115" text-anchor="middle" class="tx-w" font-size="11">편집자</text>
  <rect x="560" y="70" width="140" height="60" rx="12" class="p2"/>
  <text x="630" y="95" text-anchor="middle" class="tx-w">④ 수정</text><text x="630" y="115" text-anchor="middle" class="tx-w" font-size="11">작가</text>
  <line x1="162" y1="100" x2="196" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m09a6)"/>
  <line x1="342" y1="100" x2="376" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m09a6)"/>
  <line x1="522" y1="100" x2="556" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m09a6)"/>
  <path d="M270 132 C270 190 630 190 630 134" class="s2" stroke-width="2" stroke-dasharray="6 4" fill="none" marker-end="url(#m09a6)"/>
  <text x="450" y="175" text-anchor="middle" class="tx-m">context=[t2, t3] — 초안과 검토 의견을 함께 참고</text>
  <text x="360" y="40" text-anchor="middle" class="tx-b">6차시의 반성(Reflection)을 팀 구조로 — 쓰는 사람과 검토하는 사람을 분리</text>
  <text x="360" y="215" text-anchor="middle" class="tx-m">에이전트 3명 · 작업 4개 · LLM 호출 4회</text>
</svg>`;

  /* 그림 9-7. inputs 로 매개변수화 */
  const FIG_INPUTS = `<svg viewBox="0 0 720 220" role="img" aria-label="Task 의 description 에 {topic} 자리를 비워 두고 kickoff(inputs={'topic': '전기차'}) 로 채워 같은 크루를 여러 주제에 재사용하는 그림">
  ${ARROW('m09a7')}
  <rect x="20" y="30" width="300" height="150" rx="14" class="card-bg"/>
  <text x="170" y="56" text-anchor="middle" class="tx-b">크루 템플릿 (한 번만 작성)</text>
  <rect x="40" y="72" width="260" height="40" rx="8" class="p1s"/>
  <text x="170" y="97" text-anchor="middle" class="tx">'{topic} 동향을 조사해라'</text>
  <rect x="40" y="122" width="260" height="40" rx="8" class="p2s"/>
  <text x="170" y="147" text-anchor="middle" class="tx">'{topic}에 대한 포스트를 작성해라'</text>
  <rect x="380" y="20" width="320" height="52" rx="12" class="p5s"/>
  <text x="540" y="42" text-anchor="middle" class="tx-b">kickoff(inputs={'topic': '전기차'})</text>
  <text x="540" y="62" text-anchor="middle" class="tx-m">description.format(**inputs)</text>
  <rect x="380" y="90" width="320" height="40" rx="8" class="p1s"/>
  <text x="540" y="115" text-anchor="middle" class="tx">'전기차 동향을 조사해라'</text>
  <rect x="380" y="140" width="320" height="40" rx="8" class="p2s"/>
  <text x="540" y="165" text-anchor="middle" class="tx">'전기차에 대한 포스트를 작성해라'</text>
  <line x1="322" y1="105" x2="376" y2="105" class="ln" stroke-width="2.5" marker-end="url(#m09a7)"/>
  <text x="360" y="208" text-anchor="middle" class="tx-m">주제만 바꿔 같은 팀을 다시 쓴다 — 12차시 마케팅 자동화 프로젝트의 기본 구조</text>
</svg>`;

  const QUIZ1 = [
    { q: '한 프롬프트에 "조사하고, 글을 쓰고, 검토까지 해 줘"라고 모든 역할을 넣었을 때 생기기 쉬운 문제로 <b>거리가 먼</b> 것은?', options: ['지시 일부가 빠지거나 얕게 처리된다', '결과를 누가 검증했는지 알 수 없다', 'LLM 호출 횟수가 너무 많아진다', '역할이 뒤섞여 품질이 고르지 않다'], answer: 2,
      explain: '한 프롬프트 방식은 호출이 1회라 오히려 싸고 빠릅니다. 문제는 품질(누락 · 얕음 · 검증 없음)이지 호출 횟수가 아닙니다. 팀으로 나누면 품질은 오르지만 호출 수와 비용은 늘어납니다.' },
    { q: 'CrewAI 의 세 요소와 역할이 <b>바르게</b> 짝지어진 것은?', options: ['Agent = 무엇을 / Task = 누가 / Crew = 어떻게', 'Agent = 누가 / Task = 무엇을 / Crew = 어떻게', 'Agent = 어떻게 / Task = 누가 / Crew = 무엇을', 'Agent = 누가 / Task = 어떻게 / Crew = 무엇을'], answer: 1,
      explain: 'Agent 는 역할(role) · 목표(goal) · 배경(backstory)을 가진 “사람”, Task 는 description 과 expected_output 으로 정의한 “일”, Crew 는 process(sequential / hierarchical)로 팀을 돌리는 “운영 방식”입니다.' },
    { q: '작업 2가 작업 1의 결과를 참고하도록 하려면 <code>al.Task(...)</code> 에 무엇을 지정해야 할까?', options: ['<code>agent=[t1]</code>', '<code>expected_output=t1.output</code>', '<code>context=[t1]</code>', '<code>backstory=t1</code>'], answer: 2,
      explain: '<code>context=[t1]</code> 을 주면 크루가 t1.output 을 “[참고할 이전 작업 결과]” 로 프롬프트에 붙여 줍니다. sequential 프로세스에서는 context 를 생략해도 바로 앞 작업 결과가 자동으로 전달됩니다.' },
    { q: '<code>role · goal · backstory</code> 는 실제 LLM 호출에서 어디로 들어갈까?', options: ['도구 스키마', '시스템 프롬프트', '사용자 메시지의 맨 끝', '어디에도 들어가지 않고 로그에만 찍힌다'], answer: 1,
      explain: '<code>CrewAgent.system_prompt()</code> 가 “당신은 {role}입니다. 목표: … 배경: …” 형태의 시스템 프롬프트를 만듭니다. 3차시의 페르소나 설정이 팀 단위로 확장된 것입니다.' }
  ];
  const QUIZ2 = [
    { q: '<code>process=\'hierarchical\'</code> 크루에서 <code>manager_llm</code> 의 역할은?', options: ['모든 작업을 직접 수행한다', '작업마다 가장 알맞은 담당 에이전트를 고른다', '최종 결과를 번역한다', '도구 호출 결과를 검증한다'], answer: 1,
      explain: '매니저 LLM 은 작업 설명과 에이전트들의 role · goal 을 보고 담당자를 고릅니다. 작업마다 LLM 호출이 1회씩 더 들어가므로 sequential 보다 비용이 큽니다.' },
    { q: '<code>Task(description=\'{topic} 동향을 조사해라\')</code> 의 <code>{topic}</code> 을 채우는 방법은?', options: ['<code>crew.kickoff(topic=\'전기차\')</code>', '<code>crew.kickoff(inputs={\'topic\': \'전기차\'})</code>', '<code>Task.format(topic=\'전기차\')</code>', '<code>Crew(inputs=\'전기차\')</code>'], answer: 1,
      explain: '<code>kickoff(inputs={...})</code> 가 각 작업의 description 에 <code>format(**inputs)</code> 를 적용합니다. 같은 크루를 여러 주제에 재사용하는 핵심 장치입니다.' },
    { q: '다음 중 <code>expected_output</code> 으로 <b>가장 좋은</b> 것은?', options: ['"좋은 글"', '"잘 정리된 결과"', '"마크다운. 제목 1개, 소제목 3개, 각 2문장, 마지막 줄에 한 줄 요약"', '"알아서"'], answer: 2,
      explain: '형식 · 분량 · 구조를 구체적으로 적어야 LLM 이 그 틀에 맞춰 쓰고, 다음 에이전트도 결과를 안정적으로 받아 쓸 수 있습니다.' },
    { q: '조사원 → 작가 → 편집자(검토) → 작가(수정) 4개 작업을 sequential 로 돌리면 LLM 호출은 최소 몇 번일까? (도구 없음, 매니저 없음)', options: ['1회', '3회', '4회', '8회'], answer: 2,
      explain: '작업마다 담당 에이전트가 LLM 을 1회 호출하므로 작업 수 = 호출 수 = 4회입니다. 도구를 쓰면 작업당 호출이 늘고, hierarchical 이면 매니저 호출이 작업마다 1회씩 더해집니다.' },
    { q: '크루 설계에서 “역할 겹침”이 문제가 되는 이유로 알맞은 것은?', options: ['LLM 이 두 역할을 동시에 호출하지 못해 오류가 난다', '누가 무엇을 책임지는지 흐려져 같은 일을 반복하거나 서로 미룬다', '토큰이 절반으로 줄어 답이 짧아진다', 'hierarchical 프로세스를 쓸 수 없게 된다'], answer: 1,
      explain: '“조사도 하고 글도 쓰는 작가” 처럼 역할이 겹치면 분업의 이점(짧고 명확한 프롬프트, 검증 가능성)이 사라집니다. 역할은 서로 다른 전문성 · 책임으로 나눕니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag09',
    no: '09',
    title: 'CrewAI: 역할 분담 에이전트 팀',
    subtitle: 'Agent · Task · Crew · sequential vs hierarchical',
    summary: 'LLM 하나에 모든 일을 시키는 대신 <b>조사원 · 작가 · 편집자</b>처럼 역할을 나눈 에이전트 팀을 만듭니다. CrewAI 의 세 요소(Agent · Task · Crew)를 브라우저의 <code>agentlab</code> 으로 체험하고, 순차 · 계층 프로세스, 주제 매개변수화, 비용까지 설계 관점에서 다룹니다.',
    goals: [
      '여러 에이전트로 역할을 나누면 왜 품질이 좋아지는지(분업 · 전문화 · 검증) 설명할 수 있다',
      'Agent(role · goal · backstory) · Task(description · expected_output · context) · Crew(process) 로 2~3인 크루를 만들어 실행할 수 있다',
      'sequential 과 hierarchical 프로세스의 차이와 비용을 비교해 알맞은 것을 고를 수 있다',
      'inputs 로 주제를 매개변수화하고, expected_output 으로 결과물 형식을 강제하며, 흔한 설계 실패를 피할 수 있다'
    ],
    sections: [
      {
        id: 'ag09-1',
        title: '왜 여러 에이전트인가 — Agent · Task · Crew',
        minutes: 50,
        goals: ['한 프롬프트 방식의 한계를 실험으로 확인한다', 'CrewAI 의 3요소를 설명하고 2인 크루를 실행한다', 'task.output 과 context 로 결과가 전달되는 것을 확인한다', '도구를 가진 에이전트를 크루에 넣는다'],
        flow: [['도입 · 한 프롬프트의 한계', 8], ['Agent · Task · Crew', 12], ['첫 크루 실행 (코드)', 15], ['도구를 가진 에이전트', 8], ['퀴즈 · 정리', 7]],
        content: [
          { type: 'p', html: '지난 차시(LangGraph)에서는 <b>에이전트 하나</b>의 흐름을 그래프로 제어했습니다. 이번 차시에서는 방향을 바꿔 <b>여러 에이전트가 팀을 이루어</b> 일하게 합니다. 신문사 편집부를 떠올려 보세요. 기자가 취재하고, 데스크가 기사를 다듬고, 교열 기자가 오탈자와 사실 관계를 확인합니다. 한 사람이 다 할 수도 있지만, 역할을 나누면 각자 자기 일에 집중하고 서로의 결과를 검증할 수 있습니다. <b>CrewAI</b> 는 이런 “역할 분담 팀”을 LLM 에이전트로 만드는 프레임워크입니다.' },
          { type: 'h', text: '한 프롬프트에 모든 역할을 넣으면 생기는 일' },
          { type: 'p', html: '먼저 가장 단순한 방법을 시험해 봅시다. LLM 하나에게 “조사하고, 글을 쓰고, 검토까지 해 줘”라고 한 번에 시키면 어떻게 될까요? 아래 예제를 실행해 보세요.' },
          { type: 'code', title: '예제 9-1. 한 프롬프트에 조사 · 작성 · 검토를 한꺼번에 시키기', code: `import agentlab as al

llm = al.LLM()
al.status()
prompt = ('AI 에이전트 동향을 조사하고, 그 내용으로 블로그 글을 쓰고, '
          '마지막으로 글을 검토해서 문제점까지 지적해라.')
answer = llm.ask(prompt, system_prompt='당신은 조사원이자 작가이자 편집자입니다.')
print(answer)
print()
print('LLM 호출 횟수:', llm.calls)`,
            expect: `🤖 LLM: 모의 LLM (API 키 없음) — 왼쪽 아래 🔑 API 키 에서 무료 키를 넣으면 실제 모델이 답합니다.
[조사원이자 작가이자 편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

LLM 호출 횟수: 1`,
            desc: '세 가지를 시켰지만 모의 LLM 은 마지막 지시(검토)만 수행했습니다. 조사 결과도, 블로그 글도 없습니다. 실제 LLM 은 이보다 훨씬 잘 하지만, 긴 복합 지시에서 <b>일부를 빠뜨리거나 얕게 처리하고</b>, 스스로 쓴 글을 스스로 검토하느라 <b>비판이 무뎌지는</b> 현상은 실제로도 흔합니다. (예시 출력은 모의 LLM 기준이며, 실제 키를 넣으면 달라집니다.)' },
          { type: 'figure', html: FIG_ONE_VS_TEAM, caption: '그림 9-1. 한 프롬프트에 모든 역할을 넣으면 얕고 검증 없는 결과가 나오기 쉽습니다. 역할을 나누면 단계마다 짧고 명확한 프롬프트가 되고, 앞 단계의 결과가 다음 단계의 입력(context)이 됩니다.' },
          { type: 'p', html: '역할을 나누는 이유를 세 가지로 정리할 수 있습니다.' },
          { type: 'list', items: [
            '<b>분업</b> — 각 에이전트의 프롬프트가 짧고 명확해집니다. “동향을 조사해라”는 “조사하고 쓰고 검토해라”보다 훨씬 정확하게 수행됩니다.',
            '<b>전문화</b> — 역할마다 다른 시스템 프롬프트(페르소나 · 원칙 · 도구)를 줄 수 있습니다. 조사원에게는 검색 도구를, 편집자에게는 엄격한 검토 기준을 줍니다.',
            '<b>검증</b> — 쓰는 사람과 검토하는 사람을 분리하면 6차시의 반성(Reflection)이 구조적으로 보장됩니다. 자기 글을 자기가 검토하는 것보다 남이 검토하는 쪽이 더 많은 문제를 찾습니다.'
          ] },
          { type: 'callout', kind: 'warn', title: '멀티 에이전트가 항상 답은 아닙니다', html: '에이전트가 셋이면 LLM 호출도 최소 세 번, 시간과 비용도 세 배입니다. 질문 하나에 답하는 단순한 일이라면 에이전트 하나(4차시)로 충분합니다. 팀은 <b>단계가 뚜렷하고 결과물이 길며 검증이 필요한 일</b>(보고서 · 마케팅 콘텐츠 · 코드 리뷰)에 어울립니다. 이 판단 기준은 2교시 끝과 10차시의 프레임워크 비교에서 다시 정리합니다.' },
          { type: 'h', text: 'CrewAI 의 3요소: Agent · Task · Crew' },
          { type: 'p', html: 'CrewAI 는 팀을 세 가지 객체로 표현합니다. <b>Agent</b>(누가)는 역할 · 목표 · 배경을 가진 “팀원”, <b>Task</b>(무엇을)는 지시문과 기대 결과물로 정의한 “일”, <b>Crew</b>(어떻게)는 팀원과 일을 묶어 돌리는 “운영 방식”입니다. 브라우저의 <code>agentlab</code> 은 이름과 인자를 실제 CrewAI 와 맞춰 두었습니다. (실제 CrewAI 의 <code>Agent</code> 는 4차시의 <code>al.Agent</code> 와 이름이 겹쳐서 <code>al.CrewAgent</code> 로 부릅니다.)' },
          { type: 'figure', html: FIG_CREW3, caption: '그림 9-2. CrewAI 의 세 요소. Agent 의 role · goal · backstory 는 시스템 프롬프트가 되고, Task 의 description · context · expected_output 은 사용자 프롬프트가 됩니다. Crew 는 이를 조립해 순서대로(또는 매니저가 골라) 실행합니다.' },
          { type: 'table', head: ['요소', '핵심 인자', '뜻', '실제 LLM 호출에서'], rows: [
            ['<b>Agent</b>', '<code>role</code>', '역할 이름. “시장 조사원”', '시스템 프롬프트 “당신은 시장 조사원입니다”'],
            ['', '<code>goal</code>', '이 역할이 이루려는 것', '시스템 프롬프트 “목표: …”'],
            ['', '<code>backstory</code>', '경력 · 성향 · 지켜야 할 원칙', '시스템 프롬프트 “배경: …”'],
            ['', '<code>tools</code>, <code>llm</code>', '쓸 수 있는 도구, 사용할 모델', '도구 스키마 · 호출 대상'],
            ['<b>Task</b>', '<code>description</code>', '작업 지시문', '사용자 메시지 본문'],
            ['', '<code>expected_output</code>', '결과물의 형식 · 분량', '“[기대하는 결과물] …” 로 덧붙음'],
            ['', '<code>agent</code>', '담당 에이전트 (hierarchical 이면 생략 가능)', '누구의 시스템 프롬프트를 쓸지'],
            ['', '<code>context</code>', '참고할 이전 작업 목록', '“[참고할 이전 작업 결과] …” 로 덧붙음'],
            ['<b>Crew</b>', '<code>agents</code>, <code>tasks</code>', '팀원 목록, 작업 목록(= 실행 순서)', '—'],
            ['', '<code>process</code>', '<code>sequential</code>(순서대로) / <code>hierarchical</code>(매니저가 배정)', '매니저 LLM 호출 유무'],
            ['', '<code>kickoff(inputs=…)</code>', '팀 가동. 마지막 작업 결과를 돌려줌', '작업 수만큼 LLM 호출']
          ], caption: 'CrewAI 3요소의 인자와 프롬프트 대응' },
          { type: 'code', title: '예제 9-2. 에이전트 · 작업 · 크루 만들기 (아직 실행은 안 함)', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(
    role='시장 조사원',
    goal='주제에 대한 최신 동향을 빠짐없이 조사한다',
    backstory='10년 경력의 IT 산업 분석가. 출처를 꼼꼼히 확인한다.',
    llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 바꾼다',
                      backstory='기술 블로그를 5년간 운영했다', llm=llm)
print(researcher, writer)
print('--- 조사원에게 들어가는 시스템 프롬프트 ---')
print(researcher.system_prompt())

t1 = al.Task(description='AI 에이전트 동향을 조사해라', expected_output='핵심 동향 3가지', agent=researcher)
t2 = al.Task(description='AI 에이전트에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
print(t1)
print(t2)
print('t2 가 참고하는 작업:', t2.context)
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2])
print(crew)`,
            expect: `CrewAgent(시장 조사원) CrewAgent(블로그 작가)
--- 조사원에게 들어가는 시스템 프롬프트 ---
당신은 시장 조사원입니다.
목표: 주제에 대한 최신 동향을 빠짐없이 조사한다
배경: 10년 경력의 IT 산업 분석가. 출처를 꼼꼼히 확인한다.
맡은 작업을 역할에 맞게, 요구된 결과물 형식으로 완성하세요.
Task('AI 에이전트 동향을 조사해라', agent=시장 조사원)
Task('AI 에이전트에 대한 블로그 포스트를 작성해라', agent=블로그 작가)
t2 가 참고하는 작업: [Task('AI 에이전트 동향을 조사해라', agent=시장 조사원)]
Crew(2 agents, 2 tasks, sequential)`,
            desc: '<code>system_prompt()</code> 출력을 보면 role · goal · backstory 가 3차시에서 배운 페르소나 시스템 프롬프트로 조립되는 것을 알 수 있습니다. 아직 LLM 은 한 번도 호출되지 않았습니다 — 객체를 만든 것뿐입니다. <code>t2</code> 의 <code>context=[t1]</code> 이 “작업 1의 결과를 참고하라”는 연결입니다.' },
          { type: 'callout', kind: 'tip', title: 'backstory 는 장식이 아닙니다', html: '“출처를 꼼꼼히 확인한다”, “근거 없는 문장을 그냥 넘기지 않는다” 같은 <b>행동 원칙</b>을 backstory 에 넣으면 실제 LLM 의 답이 눈에 띄게 달라집니다. 3차시에서 본 “역할 + 규칙 + 말투” 공식이 그대로 적용됩니다. 반대로 “친절하고 똑똑하다” 같은 추상적 수식은 효과가 거의 없습니다.' },
          { type: 'h', text: '첫 크루 실행: 조사원 → 작가' },
          { type: 'p', html: '<code>crew.kickoff()</code> 를 부르면 크루가 작업 목록을 순서대로 돕니다. 작업마다 담당 에이전트의 시스템 프롬프트와 작업 프롬프트를 조립해 LLM 을 호출하고, 결과를 <code>task.output</code> 에 저장한 뒤 다음 작업의 context 로 넘깁니다. 마지막 작업의 결과가 <code>kickoff()</code> 의 반환값입니다.' },
          { type: 'figure', html: FIG_PIPELINE, caption: '그림 9-3. 순차(sequential) 크루의 실행. 작업 1의 output 이 작업 2의 프롬프트에 “[참고할 이전 작업 결과]” 로 붙습니다. 최종 결과는 마지막 작업의 output 입니다.' },
          { type: 'code', title: '예제 9-3. 2단계 크루 실행하기 (verbose=True 로 과정 보기)', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 조사한다', backstory='IT 산업 분석가', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', backstory='기술 블로거', llm=llm)
t1 = al.Task(description='AI 에이전트 동향을 조사해라', expected_output='핵심 동향 3가지', agent=researcher)
t2 = al.Task(description='AI 에이전트에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2], verbose=True)
result = crew.kickoff()
print()
print('=== 최종 결과 ===')
print(result)`,
            expect: `
🧑‍💼 [시장 조사원] 작업 1/2: AI 에이전트 동향을 조사해라
   ✔ 결과: [시장 조사원] 조사 결과 — AI 에이전트: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

🧑‍💼 [블로그 작가] 작업 2/2: AI 에이전트에 대한 블로그 포스트를 작성해라
   ✔ 결과: [블로그 작가] # AI 에이전트

이전 작업 결과를 바탕으로 도입: 왜 지금 AI 에이전트인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시

=== 최종 결과 ===
[블로그 작가] # AI 에이전트

이전 작업 결과를 바탕으로 도입: 왜 지금 AI 에이전트인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.`,
            desc: '<code>verbose=True</code> 면 “🧑‍💼 [역할] 작업 n/N” 과 “✔ 결과” 가 차례로 찍힙니다. 예제 9-1 과 비교해 보세요 — 같은 모의 LLM 인데 <b>조사 결과와 블로그 글이 둘 다</b> 나왔고, 글 앞머리에 “이전 작업 결과를 바탕으로” 가 붙어 작가가 조사 결과를 받았음을 보여 줍니다. 답 앞의 <code>[시장 조사원]</code>, <code>[블로그 작가]</code> 는 모의 LLM 이 역할을 표시하는 방식입니다.' },
          { type: 'code', title: '예제 9-4. 중간 결과물 꺼내 보기 — task.output 과 crew.outputs', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 조사한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
t1 = al.Task(description='AI 에이전트 동향을 조사해라', expected_output='핵심 동향 3가지', agent=researcher)
t2 = al.Task(description='AI 에이전트에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2])
crew.kickoff()
print('[작업 1 결과물] t1.output')
print(t1.output)
print()
print('[작업 2 결과물] t2.output')
print(t2.output)
print()
print('crew.outputs 개수:', len(crew.outputs), '/ LLM 호출 횟수:', llm.calls)`,
            expect: `[작업 1 결과물] t1.output
[시장 조사원] 조사 결과 — AI 에이전트: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

[작업 2 결과물] t2.output
[블로그 작가] # AI 에이전트

이전 작업 결과를 바탕으로 도입: 왜 지금 AI 에이전트인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.

crew.outputs 개수: 2 / LLM 호출 횟수: 2`,
            desc: '<code>kickoff()</code> 는 마지막 결과만 돌려주지만, 각 <code>Task</code> 객체의 <code>output</code> 에 중간 결과가 남아 있습니다. 조사 결과를 따로 저장하거나, 어느 단계에서 품질이 무너졌는지 디버깅할 때 꼭 필요합니다. 작업 2개 = LLM 호출 2회입니다.' },
          { type: 'callout', kind: 'info', title: 'context 를 생략하면?', html: '<code>agentlab</code> 과 실제 CrewAI 모두 <b>sequential</b> 프로세스에서는 context 를 생략해도 <b>바로 앞 작업의 결과</b>가 자동으로 전달됩니다. 하지만 “초안(t2)과 검토 의견(t3)을 함께 참고해 고쳐라” 처럼 <b>여러 작업</b>을 참고해야 하거나, 순서가 멀리 떨어진 작업을 참고해야 하면 <code>context=[t2, t3]</code> 로 명시해야 합니다. 명시하는 습관을 들이는 편이 안전합니다.' },
          { type: 'h', text: '도구를 가진 에이전트' },
          { type: 'p', html: '조사원에게 4차시의 도구를 쥐여 주면 “아는 척”이 아니라 <b>실제로 찾아본 결과</b>로 조사합니다. <code>CrewAgent(tools=[...])</code> 로 도구를 주면 그 에이전트는 작업을 수행할 때 내부적으로 4차시의 <code>al.Agent</code> 루프(판단 → 도구 호출 → 관찰 → 답)를 돌립니다. 도구가 없는 에이전트는 LLM 을 한 번만 호출합니다.' },
          { type: 'figure', html: FIG_TOOLAGENT, caption: '그림 9-4. 도구를 가진 CrewAgent 의 내부. 역할(시스템 프롬프트) 안에서 에이전트 루프가 돌고, 최종 답이 task.output 이 되어 다음 작업으로 넘어갑니다.' },
          { type: 'code', title: '예제 9-5. 위키백과 검색 도구를 가진 조사원 + 작가', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='위키백과에서 사실을 확인해 조사한다',
                          backstory='출처 없는 주장은 쓰지 않는 분석가', llm=llm,
                          tools=[al.wiki_search], verbose=True)   # verbose: 도구 호출 과정 출력
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
t1 = al.Task(description='LangChain에 대해 검색해줘', agent=researcher)
t2 = al.Task(description='LangChain에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2], verbose=True)
print(crew.kickoff())`,
            desc: '조사원의 작업에서 “🔧 도구 호출 → 👁 관찰 → ✅ 최종 답” 이 찍힙니다(<code>CrewAgent(verbose=True)</code>). 브라우저에서는 키가 없어도 위키백과 API 를 실제로 호출하므로 출력이 매번 조금씩 다를 수 있고, 네트워크가 없으면 준비된 예시 요약을 씁니다. 작가는 도구가 없으니 LLM 1회로 글을 씁니다. 모의 LLM 은 질문의 “검색” 키워드로 도구를 고르므로 description 을 “…에 대해 검색해줘” 꼴로 썼습니다.' },
          { type: 'h', text: '실제 CrewAI 코드는 어떻게 생겼나' },
          { type: 'p', html: '브라우저에서 돌린 <code>agentlab</code> 코드와 실제 CrewAI 코드를 나란히 놓으면 거의 같습니다. 다른 점은 <code>al.CrewAgent</code> → <code>Agent</code>, 모델을 <code>LLM(model=\'gemini/…\')</code> 로 지정하는 것, 결과가 <code>result.raw</code> 에 들어 있다는 것 정도입니다. 아래 코드는 Colab 노트북에서 실행합니다.' },
          { type: 'code', title: '실제 CrewAI — Colab 에서 실행 (pip install crewai)', run: false, code: `import os
from crewai import Agent, Task, Crew, Process, LLM          # 실제 CrewAI

llm = LLM(model='gemini/gemini-2.5-flash', api_key=os.environ['GEMINI_API_KEY'])

researcher = Agent(role='시장 조사원', goal='{topic}의 최신 동향을 조사한다',
                   backstory='10년 경력의 IT 산업 분석가. 출처를 꼼꼼히 확인한다.',
                   llm=llm, verbose=True)
writer = Agent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다',
               backstory='기술 블로그를 5년간 운영했다', llm=llm, verbose=True)

t1 = Task(description='{topic} 동향을 조사해라', expected_output='핵심 동향 3가지 (불릿)', agent=researcher)
t2 = Task(description='{topic}에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단 마크다운',
          agent=writer, context=[t1])

crew = Crew(agents=[researcher, writer], tasks=[t1, t2], process=Process.sequential, verbose=True)
result = crew.kickoff(inputs={'topic': 'AI 에이전트'})
print(result.raw)             # 최종 결과물 (문자열)
print(t1.output.raw)          # 중간 결과물
print(result.token_usage)     # 토큰 사용량`,
            desc: '실제 CrewAI 는 내부적으로 LiteLLM 을 써서 <code>\'gemini/모델명\'</code>, <code>\'openai/모델명\'</code>, <code>\'groq/모델명\'</code> 처럼 공급자를 접두어로 고릅니다. 도구는 <code>from crewai.tools import tool</code> 데코레이터로 만들며(4차시 <code>@al.tool</code> 과 같은 꼴), 노트북에 위키백과 검색 도구 예제가 있습니다.' },
          { type: 'table', head: ['agentlab (브라우저)', '실제 CrewAI (Colab)', '비고'], rows: [
            ['<code>al.CrewAgent(role, goal, backstory, llm, tools)</code>', '<code>Agent(role, goal, backstory, llm, tools, verbose)</code>', '이름만 다름 (4차시 <code>al.Agent</code> 와 구별)'],
            ['<code>al.Task(description, expected_output, agent, context)</code>', '<code>Task(description, expected_output, agent, context)</code>', '같음. 실제는 expected_output 이 필수'],
            ['<code>al.Crew(agents, tasks, process=\'sequential\')</code>', '<code>Crew(agents, tasks, process=Process.sequential)</code>', '문자열 vs <code>Process</code> 열거형'],
            ['<code>crew.kickoff(inputs={...})</code> → 문자열', '<code>crew.kickoff(inputs={...})</code> → <code>CrewOutput</code>', '실제는 <code>.raw</code>, <code>.tasks_output</code>, <code>.token_usage</code>'],
            ['<code>task.output</code> → 문자열', '<code>task.output.raw</code>', '실제는 <code>TaskOutput</code> 객체'],
            ['<code>@al.tool</code>', '<code>from crewai.tools import tool</code>', '둘 다 docstring 이 설명이 됨']
          ], caption: 'agentlab 미니 CrewAI 와 실제 CrewAI 의 대응' },
          { type: 'colab', title: 'Colab 실습 09 — 실제 CrewAI 로 조사원 · 작가 · 편집자 크루 만들기', html: '<p>Colab 노트북에서 <code>pip install crewai</code> 로 실제 CrewAI 를 설치하고, 이 교시의 2인 크루와 다음 교시의 3인 크루(편집자 · hierarchical · inputs)를 실제 모델로 돌려 봅니다. API 키는 Colab 의 🔑 <b>Secrets</b> 에 <code>GEMINI_API_KEY</code> 로 넣고 <code>userdata.get()</code> 으로 읽습니다 — 노트북에 키를 직접 쓰지 마세요. 실제 모델은 호출당 수 초가 걸리므로 작업 4개 크루는 30초~1분 정도 기다려야 합니다.</p>' }
        ],
        practice: [
          { title: '실습 9-1. 역할과 주제 바꾸기 — 여행 크루', level: 1,
            desc: '<p>예제 9-3 의 크루를 <b>여행 전문가 → 여행 작가</b> 2인 크루로 바꾸고 주제를 제주도 여행으로 바꿔 보세요. 조건: ① 첫 작업 description 은 <code>\'제주도 여행 정보를 조사해라\'</code>, 둘째 작업은 <code>\'제주도 여행에 대한 블로그 포스트를 작성해라\'</code> ② 둘째 작업에 <code>context=[t1]</code> ③ <code>verbose=True</code> 로 실행하고 최종 결과를 출력.</p><p>출력에서 <code>[여행 전문가]</code>, <code>[여행 작가]</code> 처럼 역할이 바뀐 것을 확인하세요.</p>',
            hint: 'role 과 goal 만 바꾸면 됩니다. 모의 LLM 은 “조사해라” 와 “포스트를 작성해라” 키워드로 조사 · 작성을 구분합니다.',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: role='여행 전문가', role='여행 작가' 인 CrewAgent 두 개 만들기
guide = None
writer = None

# TODO: 조사 작업(t1)과 작성 작업(t2, context=[t1]) 만들기
t1 = None
t2 = None

# TODO: Crew 를 만들고 verbose=True 로 kickoff 한 결과를 출력하기
`,
            solution: `import agentlab as al

llm = al.LLM()
guide = al.CrewAgent(role='여행 전문가', goal='여행지의 최신 정보를 조사한다', backstory='제주 토박이 가이드', llm=llm)
writer = al.CrewAgent(role='여행 작가', goal='조사 내용을 여행기 형식의 글로 쓴다', llm=llm)
t1 = al.Task(description='제주도 여행 정보를 조사해라', expected_output='추천 장소 3곳', agent=guide)
t2 = al.Task(description='제주도 여행에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[guide, writer], tasks=[t1, t2], verbose=True)
print(crew.kickoff())
`,
            expect: `
🧑‍💼 [여행 전문가] 작업 1/2: 제주도 여행 정보를 조사해라
   ✔ 결과: [여행 전문가] 조사 결과 — 제주도 여행 정보: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

🧑‍💼 [여행 작가] 작업 2/2: 제주도 여행에 대한 블로그 포스트를 작성해라
   ✔ 결과: [여행 작가] # 제주도 여행

이전 작업 결과를 바탕으로 도입: 왜 지금 제주도 여행인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할
[여행 작가] # 제주도 여행

이전 작업 결과를 바탕으로 도입: 왜 지금 제주도 여행인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.` },
          { title: '실습 9-2. 조사원에게 도구 주기', level: 2, nondeterministic: true,
            desc: '<p>실습 9-1 의 여행 전문가에게 <code>al.wiki_search</code> 도구를 주고(<code>tools=[...]</code>, <code>verbose=True</code>), 첫 작업을 <code>\'서울에 대해 검색해줘\'</code> 로 바꿔 보세요. 조사원의 작업에서 🔧 도구 호출과 👁 관찰이 찍히는지, 작가의 글이 그 결과를 바탕으로 쓰였는지 확인합니다.</p>',
            hint: '<code>al.CrewAgent(..., tools=[al.wiki_search], verbose=True)</code>. 둘째 작업 description 은 <code>\'서울 여행에 대한 블로그 포스트를 작성해라\'</code> 로.',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: tools=[al.wiki_search], verbose=True 인 여행 전문가 만들기
guide = al.CrewAgent(role='여행 전문가', goal='위키백과에서 여행지 정보를 확인한다', llm=llm)
writer = al.CrewAgent(role='여행 작가', goal='조사 내용을 여행기 형식의 글로 쓴다', llm=llm)
t1 = al.Task(description='서울에 대해 검색해줘', agent=guide)
t2 = al.Task(description='서울 여행에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[guide, writer], tasks=[t1, t2], verbose=True)
print(crew.kickoff())
`,
            solution: `import agentlab as al

llm = al.LLM()
guide = al.CrewAgent(role='여행 전문가', goal='위키백과에서 여행지 정보를 확인한다', llm=llm,
                     tools=[al.wiki_search], verbose=True)
writer = al.CrewAgent(role='여행 작가', goal='조사 내용을 여행기 형식의 글로 쓴다', llm=llm)
t1 = al.Task(description='서울에 대해 검색해줘', agent=guide)
t2 = al.Task(description='서울 여행에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[guide, writer], tasks=[t1, t2], verbose=True)
print(crew.kickoff())
` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'CrewAI: 역할 분담 에이전트 팀', subtitle: '한 명의 만능 비서 대신, 역할이 다른 팀', notes: '<p>9차시 1교시. 지난 차시(LangGraph)는 에이전트 하나의 흐름 제어, 오늘은 여러 에이전트의 협업입니다. 신문사 편집부(기자 · 데스크 · 교열) 비유로 시작합니다.</p><p>💬 발문: “보고서 하나를 혼자 다 쓰는 것과 셋이 나눠 쓰는 것, 어느 쪽이 더 잘 나올까요? 언제 그럴까요?” → “단계가 뚜렷하고 검증이 필요할 때”.</p><p>⏱ 도입 8분</p>' },
          { layout: 'code', title: '한 프롬프트에 모든 역할을 넣으면', code: `import agentlab as al

llm = al.LLM()
prompt = ('AI 에이전트 동향을 조사하고, 그 내용으로 블로그 글을 쓰고, '
          '마지막으로 글을 검토해서 문제점까지 지적해라.')
print(llm.ask(prompt, system_prompt='당신은 조사원이자 작가이자 편집자입니다.'))
print('호출 횟수:', llm.calls)`, points: ['세 가지를 시켰는데 하나만 수행', '무엇이 빠졌는지 알 길이 없음', '자기 글을 자기가 검토 → 비판이 무뎌짐'],
            notes: '<p>▶ 실행. 모의 LLM 은 “검토” 만 수행합니다. 실제 모델은 더 잘하지만 긴 복합 지시에서 누락 · 얕은 처리가 흔하다는 점을 강조.</p><p>💬 “여러분이 LLM 이라면 이 지시를 받고 어디서부터 헷갈릴까요?”</p>' },
          { layout: 'diagram', title: '분업 · 전문화 · 검증', html: FIG_ONE_VS_TEAM, caption: '역할을 나누면 프롬프트가 짧아지고, 앞 결과가 다음 입력이 되며, 검토자가 분리된다',
            notes: '<p>세 가지 이유를 칠판에: <b>분업</b>(짧고 명확한 프롬프트) · <b>전문화</b>(역할별 도구 · 원칙) · <b>검증</b>(쓰는 사람 ≠ 검토하는 사람).</p><p>오른쪽 아래 “LLM 호출 3회” — 비용이 느는 것도 반드시 짚습니다. 멀티 에이전트가 만능이 아님.</p>' },
          { layout: 'diagram', title: 'CrewAI 의 3요소', html: FIG_CREW3, caption: 'Agent(누가) · Task(무엇을) · Crew(어떻게)',
            notes: '<p>“누가 · 무엇을 · 어떻게” 세 단어로 외우게 합니다. role · goal · backstory 는 3차시 페르소나 시스템 프롬프트가 된다는 연결을 강조.</p><p>agentlab 에서 <code>al.CrewAgent</code> 인 이유: 4차시 <code>al.Agent</code> 와 이름 충돌.</p>' },
          { layout: 'table', title: '인자 → 프롬프트 대응', head: ['요소', '인자', '프롬프트에서'], rows: [
            ['Agent', 'role · goal · backstory', '시스템 프롬프트'],
            ['Agent', 'tools · llm', '도구 스키마 · 호출 대상'],
            ['Task', 'description', '사용자 메시지 본문'],
            ['Task', 'expected_output', '[기대하는 결과물]'],
            ['Task', 'context', '[참고할 이전 작업 결과]'],
            ['Crew', 'process · kickoff', '순서 · 매니저 · 실행']
          ], notes: '<p>이 표가 이 차시의 핵심. 프레임워크가 “마법”이 아니라 2~3차시에서 배운 프롬프트 조립이라는 점을 분명히 합니다.</p>' },
          { layout: 'code', title: '에이전트 · 작업 만들기', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='최신 동향을 조사한다',
                          backstory='출처를 꼼꼼히 확인하는 분석가', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
print(researcher.system_prompt())

t1 = al.Task(description='AI 에이전트 동향을 조사해라',
             expected_output='핵심 동향 3가지', agent=researcher)
t2 = al.Task(description='AI 에이전트에 대한 블로그 포스트를 작성해라',
             expected_output='제목과 3문단', agent=writer, context=[t1])
print(t1, t2, sep='\\n')`, points: ['<code>system_prompt()</code> = 역할 + 목표 + 배경', '<code>context=[t1]</code> → 작업 1 결과 참고', '아직 LLM 호출 0회'],
            notes: '<p>▶ 실행 후 시스템 프롬프트 출력을 가리키며 “당신은 시장 조사원입니다 / 목표 / 배경” 구조 확인.</p><p>💬 “backstory 에 ‘친절하다’ 대신 무엇을 적어야 답이 달라질까?” → 행동 원칙(출처 확인, 근거 없는 문장 금지).</p>' },
          { layout: 'diagram', title: '크루 실행: 결과가 context 로 흐른다', html: FIG_PIPELINE, caption: 'kickoff() → 작업 1 → output → context → 작업 2 → 최종 결과',
            notes: '<p>프롬프트 조립 공식(맨 아래)을 읽어 줍니다: description + 참고 + 기대 결과물.</p><p>sequential 에서는 context 를 생략해도 바로 앞 결과가 자동 전달되지만, 명시하는 습관을 권장.</p>' },
          { layout: 'code', title: '첫 크루 kickoff', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='최신 동향을 조사한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
t1 = al.Task(description='AI 에이전트 동향을 조사해라', expected_output='핵심 3가지', agent=researcher)
t2 = al.Task(description='AI 에이전트에 대한 블로그 포스트를 작성해라',
             expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2], verbose=True)
result = crew.kickoff()
print('=== 최종 ===')
print(result)
print('t1.output:', t1.output[:40], '…')
print('LLM 호출:', llm.calls)`, points: ['🧑‍💼 작업 n/N · ✔ 결과 가 차례로', '“이전 작업 결과를 바탕으로” = context 도착', '작업 2개 = 호출 2회'],
            notes: '<p>▶ 실행. 예제 9-1 과 비교: 같은 모의 LLM 인데 조사 결과 + 글이 모두 나옴.</p><p>t1.output 으로 중간 결과를 꺼낼 수 있다는 점(디버깅 · 저장)을 보여 줍니다.</p>' },
          { layout: 'diagram', title: '도구를 가진 에이전트', html: FIG_TOOLAGENT, caption: '역할 안에서 4차시의 에이전트 루프가 돈다',
            notes: '<p>도구가 있는 CrewAgent 는 내부에서 <code>al.Agent</code> 를 만들어 돌립니다. 그래서 호출 수가 작업당 2회 이상이 됩니다.</p><p>💬 “편집자에게도 검색 도구를 줘야 할까?” → 사실 확인용이라면 유용, 그러나 비용 증가.</p>' },
          { layout: 'code', title: '위키 검색 조사원 + 작가', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='위키백과로 사실을 확인한다',
                          llm=llm, tools=[al.wiki_search], verbose=True)
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
t1 = al.Task(description='LangChain에 대해 검색해줘', agent=researcher)
t2 = al.Task(description='LangChain에 대한 블로그 포스트를 작성해라',
             expected_output='제목과 3문단', agent=writer, context=[t1])
crew = al.Crew(agents=[researcher, writer], tasks=[t1, t2], verbose=True)
print(crew.kickoff())`, points: ['🔧 도구 호출 → 👁 관찰 → ✅ 답', '네트워크가 있으면 실제 위키백과', '출력은 매번 조금 다를 수 있음'],
            notes: '<p>▶ 실행. 도구 호출 로그가 역할 로그 안에 들어 있는 것을 보여 줍니다.</p><p>학생 PC 에 네트워크가 없으면 예시 요약이 나옵니다 — 오류가 아님.</p>' },
          { layout: 'two', title: 'agentlab ↔ 실제 CrewAI', left: { title: '브라우저 (agentlab)', code: `researcher = al.CrewAgent(
    role='시장 조사원',
    goal='…', backstory='…',
    llm=al.LLM(), tools=[al.wiki_search])
t1 = al.Task(description='…',
             expected_output='…',
             agent=researcher)
crew = al.Crew(agents=[…], tasks=[…],
               process='sequential')
print(crew.kickoff(inputs={...}))`, run: false },
            right: { title: 'Colab (crewai)', code: `researcher = Agent(
    role='시장 조사원',
    goal='…', backstory='…',
    llm=LLM(model='gemini/gemini-2.5-flash'),
    tools=[wikipedia_search])
t1 = Task(description='…',
          expected_output='…',
          agent=researcher)
crew = Crew(agents=[…], tasks=[…],
            process=Process.sequential)
print(crew.kickoff(inputs={...}).raw)`, run: false },
            notes: '<p>이름 · 인자가 거의 같다는 점을 한눈에. 다른 점 세 가지: CrewAgent→Agent, 문자열→Process 열거형, 결과 .raw.</p><p>Colab 노트북 09 에서 실제로 돌려 보는 것은 과제 또는 2교시 뒤.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[2].q, options: QUIZ1[2].options, answer: QUIZ1[2].answer, explain: QUIZ1[2].explain, notes: '<p>손들기로 확인. context 와 expected_output 을 헷갈리는 학생이 많습니다 — context 는 “입력”, expected_output 은 “출력 형식”.</p>' },
          { layout: 'practice', title: '실습 9-1. 여행 크루로 바꾸기', desc: '<p>여행 전문가 → 여행 작가 2인 크루, 주제는 제주도 여행. verbose=True 로 실행.</p>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: role='여행 전문가', role='여행 작가'
guide = None
writer = None
# TODO: t1 '제주도 여행 정보를 조사해라', t2 '제주도 여행에 대한 블로그 포스트를 작성해라'
`, solution: `import agentlab as al

llm = al.LLM()
guide = al.CrewAgent(role='여행 전문가', goal='여행지의 최신 정보를 조사한다', llm=llm)
writer = al.CrewAgent(role='여행 작가', goal='조사 내용을 여행기 형식의 글로 쓴다', llm=llm)
t1 = al.Task(description='제주도 여행 정보를 조사해라', expected_output='추천 장소 3곳', agent=guide)
t2 = al.Task(description='제주도 여행에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
print(al.Crew(agents=[guide, writer], tasks=[t1, t2], verbose=True).kickoff())`,
            notes: '<p>⏱ 8분. 역할 접두어 [여행 전문가] · [여행 작가] 가 바뀌는 것을 확인시키고, 빨리 끝낸 학생은 실습 9-2(도구) 로.</p>' },
          { layout: 'summary', title: '정리', bullets: ['한 프롬프트에 모든 역할 → 누락 · 얕음 · 검증 없음', '팀으로 나누면 <b>분업 · 전문화 · 검증</b> (대신 호출 ↑)', 'Agent(누가) · Task(무엇을) · Crew(어떻게)', 'role · goal · backstory → 시스템 프롬프트, description · context · expected_output → 사용자 프롬프트', '다음 교시: sequential vs hierarchical · 편집자 추가 · inputs · 비용'],
            notes: '<p>⏱ 정리 7분. 출구 질문: “Task 의 context 는 무엇을 전달하나?” → 이전 작업의 output.</p>' }
        ]
      },
      {
        id: 'ag09-2',
        title: '크루 설계: 프로세스 · 반성 · 매개변수화 · 비용',
        minutes: 50,
        goals: ['sequential 과 hierarchical 프로세스를 비교하고 골라 쓴다', '편집자를 넣어 검토 → 수정 반성 단계를 팀 구조로 만든다', 'inputs 로 주제를 매개변수화하고 expected_output 으로 형식을 강제한다', 'LLM 호출 횟수로 비용을 추정하고 흔한 설계 실패를 피한다'],
        flow: [['프로세스 비교', 10], ['3인 크루 · 반성 (코드)', 12], ['inputs · expected_output', 10], ['비용 · 흔한 실패', 8], ['실습 · 퀴즈 · 정리', 10]],
        content: [
          { type: 'p', html: '1교시에서 2인 크루를 돌려 봤습니다. 이번 교시는 <b>설계</b>입니다. 작업을 어떤 순서로, 누가 맡게 할지(프로세스), 검증 단계를 어떻게 넣을지(반성), 같은 팀을 다른 주제에 어떻게 재사용할지(매개변수화), 그리고 그 모든 것이 비용에 어떤 영향을 주는지를 다룹니다. 12차시 마케팅 자동화 프로젝트가 이 교시의 설계 원칙 위에 세워집니다.' },
          { type: 'h', text: 'sequential vs hierarchical' },
          { type: 'p', html: 'Crew 의 <code>process</code> 는 작업을 <b>누가, 어떤 순서로</b> 맡을지 정합니다. <b>sequential</b>(순차)은 코드에 쓴 작업 순서대로, 각 작업에 지정한 <code>agent</code> 가 수행합니다. <b>hierarchical</b>(계층)은 작업에 담당자를 비워 두고, <b>매니저 LLM</b>(<code>manager_llm</code>)이 작업 설명과 에이전트들의 역할 · 목표를 보고 적임자를 고릅니다. 실제 CrewAI 의 매니저는 작업을 쪼개 위임하고 결과를 검수하는 일까지 하며, 그만큼 LLM 호출이 늘어납니다.' },
          { type: 'figure', html: FIG_SEQ_HIER, caption: '그림 9-5. sequential(왼쪽)은 순서와 담당이 고정되어 예측 가능하고 쌉니다. hierarchical(오른쪽)은 매니저 LLM 이 작업마다 담당자를 골라 유연하지만 호출이 늘어납니다.' },
          { type: 'table', head: ['', 'sequential (순차)', 'hierarchical (계층)'], rows: [
            ['담당자 결정', '코드에서 <code>Task(agent=...)</code> 로 고정', '매니저 LLM 이 작업마다 선택 (<code>agent</code> 생략 가능)'],
            ['작업 순서', '<code>tasks</code> 목록 순서', '<code>tasks</code> 목록 순서 (실제 CrewAI 는 매니저가 위임 · 재작업도 지시)'],
            ['LLM 호출', '작업 수만큼', '작업 수 + 매니저 호출(작업마다 1회 이상)'],
            ['예측 가능성 · 디버깅', '높음 · 쉬움', '낮음 · 매니저의 판단을 로그로 추적해야 함'],
            ['어울리는 일', '조사 → 작성 → 검토처럼 단계가 정해진 파이프라인', '요청마다 필요한 전문가가 다른 “접수 창구” 형 업무'],
            ['권장', '<b>기본값.</b> 먼저 sequential 로 만들고 필요할 때만 바꾼다', '담당자를 미리 정할 수 없을 때']
          ], caption: '두 프로세스 비교' },
          { type: 'h', text: '3인 크루: 편집자를 넣어 반성 단계 만들기' },
          { type: 'p', html: '6차시에서 배운 반성(Reflection)은 “비평 → 수정” 루프였습니다. 팀에서는 이것을 <b>편집자(검토자) 역할</b>로 분리합니다. 작가가 초안을 쓰고, 편집자가 검토 의견을 내고, 작가가 의견을 반영해 고칩니다. 작업은 4개(조사 · 작성 · 검토 · 수정)지만 에이전트는 3명입니다 — 작가가 작업 2와 4를 모두 맡습니다. 수정 작업은 초안(t2)과 검토 의견(t3)을 <b>둘 다</b> 참고해야 하므로 <code>context=[t2, t3]</code> 로 명시합니다.' },
          { type: 'figure', html: FIG_REFLECT, caption: '그림 9-6. 조사 → 초안 → 검토 → 수정. 편집자는 쓰지 않고 검토만 하므로 작가보다 엄격한 기준(backstory)을 줄 수 있습니다.' },
          { type: 'code', title: '예제 9-6. 조사원 · 작가 · 편집자 3인 크루 (작업 4개, sequential)', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 조사한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 논리와 근거를 검증하고 고칠 점을 짚는다',
                      backstory='출판사 교정 10년차. 근거 없는 문장을 그냥 넘기지 않는다', llm=llm)
t1 = al.Task(description='전기차 동향을 조사해라', expected_output='핵심 동향 3가지', agent=researcher)
t2 = al.Task(description='전기차에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점과 개선 방향을 지적해라', expected_output='검토 의견 3가지', agent=editor, context=[t2])
t4 = al.Task(description='편집자 의견을 반영해 최종 원고를 고쳐 써라', expected_output='최종 원고', agent=writer, context=[t2, t3])
crew = al.Crew(agents=[researcher, writer, editor], tasks=[t1, t2, t3, t4], verbose=True)
final = crew.kickoff()
print()
print('=== 최종 원고 ===')
print(final)
print('LLM 호출 횟수:', llm.calls)`,
            expect: `
🧑‍💼 [시장 조사원] 작업 1/4: 전기차 동향을 조사해라
   ✔ 결과: [시장 조사원] 조사 결과 — 전기차: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

🧑‍💼 [블로그 작가] 작업 2/4: 전기차에 대한 블로그 포스트를 작성해라
   ✔ 결과: [블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는

🧑‍💼 [편집자] 작업 3/4: 초안을 검토하고 문제점과 개선 방향을 지적해라
   ✔ 결과: [편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

🧑‍💼 [블로그 작가] 작업 4/4: 편집자 의견을 반영해 최종 원고를 고쳐 써라
   ✔ 결과: [블로그 작가] 수정본: 편집자 의견을 반영해 최종 원고를 고쳐 써라 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선

=== 최종 원고 ===
[블로그 작가] 수정본: 편집자 의견을 반영해 최종 원고를 고쳐 써라 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.
LLM 호출 횟수: 4`,
            desc: '같은 <code>writer</code> 가 작업 2(초안)와 작업 4(수정)를 맡았고, 편집자는 검토만 했습니다. 모의 LLM 의 “수정본”은 요청문을 되풀이한 뒤 근거 문장(수치 · 출처)을 덧붙이는 단순한 규칙이라 어색하지만, 편집자가 지적한 “근거 추가”가 반영된 흐름은 그대로입니다. 실제 모델은 초안 전체를 고쳐 씁니다. 작업 4개 = 호출 4회.' },
          { type: 'p', html: '이제 같은 세 에이전트를 <b>hierarchical</b> 로 돌려 봅시다. 작업에서 <code>agent=</code> 를 빼고, 크루에 <code>manager_llm</code> 을 줍니다. 모의 LLM 은 사람처럼 적임자를 고를 수 없으므로, 키가 없을 때는 <code>al.LLM(mock_responses=[...])</code> 로 매니저가 답할 번호를 미리 정해 둡니다. 실제 키를 넣으면 <code>mock_responses</code> 는 무시되고 실제 모델이 고릅니다.' },
          { type: 'code', title: '예제 9-7. hierarchical — 매니저 LLM 이 담당자를 고른다', code: `import agentlab as al

llm = al.LLM()
# 키가 없을 때 매니저가 차례로 답할 내용(담당자 번호). 키가 있으면 실제 모델이 판단한다
manager_llm = al.LLM(mock_responses=['0', '1', '2'])
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 동향을 조사한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글을 검토하고 문제점을 지적한다', llm=llm)
t1 = al.Task(description='전기차 동향을 조사해라', expected_output='핵심 3가지')            # agent 없음!
t2 = al.Task(description='전기차에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', expected_output='검토 의견', context=[t2])
crew = al.Crew(agents=[researcher, writer, editor], tasks=[t1, t2, t3],
               process='hierarchical', manager_llm=manager_llm, verbose=True)
crew.kickoff()
print()
print('매니저 LLM 호출:', manager_llm.calls, '회 / 담당자 LLM 호출:', llm.calls, '회')
print('t1.agent =', t1.agent)`,
            expect: `
🧑‍💼 [시장 조사원] 작업 1/3: 전기차 동향을 조사해라
   ✔ 결과: [시장 조사원] 조사 결과 — 전기차: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

🧑‍💼 [블로그 작가] 작업 2/3: 전기차에 대한 블로그 포스트를 작성해라
   ✔ 결과: [블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는

🧑‍💼 [편집자] 작업 3/3: 초안을 검토하고 문제점을 지적해라
   ✔ 결과: [편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

매니저 LLM 호출: 3 회 / 담당자 LLM 호출: 3 회
t1.agent = None`,
            desc: '작업에 <code>agent</code> 가 없는데도 조사원 · 작가 · 편집자가 차례로 배정되었습니다. 매니저는 “작업: … / 담당자 후보: 0: 시장 조사원 — … 1: …” 프롬프트를 받고 번호로 답합니다. 호출 수를 보세요 — 작업 3개에 <b>매니저 3회 + 담당자 3회 = 6회</b>. sequential 이었다면 3회입니다. <code>t1.agent</code> 가 여전히 <code>None</code> 인 것은 배정이 실행 시점에만 이루어진다는 뜻입니다. hierarchical 에서는 바로 앞 작업 결과가 자동 전달되지 않으므로 <code>context</code> 를 꼭 명시했습니다.' },
          { type: 'callout', kind: 'warn', title: '매니저도 LLM 입니다 — 틀릴 수 있고 돈이 듭니다', html: '매니저가 “편집자”에게 조사를 맡기는 실수는 실제로도 일어납니다. 에이전트의 <code>role</code> 과 <code>goal</code> 이 서로 뚜렷이 다를수록 매니저의 선택이 정확해집니다. 그리고 매니저 호출은 작업마다 추가되므로(실제 CrewAI 는 위임 · 검수까지 해서 더 많이), 작업 순서와 담당자가 뻔한 일에는 sequential 을 쓰는 것이 원칙입니다.' },
          { type: 'h', text: 'inputs 로 주제 매개변수화하기' },
          { type: 'p', html: '지금까지는 “전기차”, “AI 에이전트” 같은 주제를 description 에 직접 적었습니다. 주제가 바뀔 때마다 크루를 다시 쓰고 싶지는 않습니다. <code>description</code> 에 <code>{topic}</code> 처럼 빈칸을 두고 <code>kickoff(inputs={\'topic\': \'전기차\'})</code> 로 채우면 됩니다. <code>agentlab</code> 의 <code>Crew.kickoff</code> 는 작업마다 <code>description.format(**inputs)</code> 를 적용하며, 실제 CrewAI 도 같은 문법을 씁니다.' },
          { type: 'figure', html: FIG_INPUTS, caption: '그림 9-7. 크루 템플릿과 inputs. 주제만 바꿔 같은 팀을 다시 돌립니다 — 매일 다른 키워드로 콘텐츠를 만드는 12차시 프로젝트의 뼈대입니다.' },
          { type: 'code', title: '예제 9-8. 같은 크루를 두 주제에 재사용하기', code: `import agentlab as al

def build_crew(llm):
    researcher = al.CrewAgent(role='시장 조사원', goal='주제의 동향을 조사한다', llm=llm)
    writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 글로 쓴다', llm=llm)
    t1 = al.Task(description='{topic} 동향을 조사해라', expected_output='핵심 3가지', agent=researcher)
    t2 = al.Task(description='{topic}에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
    return al.Crew(agents=[researcher, writer], tasks=[t1, t2])

llm = al.LLM()
for topic in ['전기차', '커피']:
    crew = build_crew(llm)                       # 주제마다 새 크루 (템플릿을 다시 채우기 위해)
    print('=== 주제:', topic, '===')
    print(crew.kickoff(inputs={'topic': topic}))
    print()`,
            expect: `=== 주제: 전기차 ===
[블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.

=== 주제: 커피 ===
[블로그 작가] # 커피

이전 작업 결과를 바탕으로 도입: 왜 지금 커피인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.`,
            desc: '크루를 만드는 코드를 함수로 감싸 두면 주제 · 모델 · 도구를 바꿔 가며 재사용하기 쉽습니다. 파이썬의 <code>str.format</code> 을 쓰므로 description 안에 중괄호를 글자로 쓰려면 <code>{{</code> <code>}}</code> 로 써야 합니다.' },
          { type: 'callout', kind: 'info', title: '왜 주제마다 크루를 새로 만들었나', html: '<code>agentlab</code> 의 <code>kickoff(inputs)</code> 는 작업의 <code>description</code> 자체를 채워 넣습니다(<code>format</code> 결과로 덮어씀). 그래서 한 번 채운 크루에 다른 inputs 로 <code>kickoff</code> 를 다시 부르면 빈칸이 이미 없어 <b>첫 주제가 그대로</b> 남습니다. 실제 CrewAI 는 원본 템플릿을 따로 보관해 매번 새로 채우므로 같은 크루 객체를 반복해 써도 됩니다. 어느 쪽이든 “크루 = 함수” 로 만들어 두는 습관이 안전합니다.' },
          { type: 'h', text: 'expected_output 으로 결과물 형식 강제하기' },
          { type: 'p', html: '팀에서는 한 에이전트의 출력이 다음 에이전트의 입력입니다. 작가가 어떤 날은 제목 없이, 어떤 날은 10문단을 쓰면 편집자가 일관되게 검토할 수 없습니다. <code>expected_output</code> 은 바로 이 <b>인터페이스 계약</b>입니다. “좋은 글” 같은 평가어가 아니라 <b>형식 · 분량 · 구조</b>를 적습니다. 크루가 실제로 조립하는 프롬프트를 직접 재현해 보면 expected_output 이 어디에 들어가는지 보입니다.' },
          { type: 'code', title: '예제 9-9. 크루가 조립하는 프롬프트 들여다보기', code: `import agentlab as al

llm = al.LLM()
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', backstory='기술 블로거', llm=llm)
research = '조사 결과 — 커피: ① 정의와 배경 ② 최근 동향 3가지'
task = al.Task(description='커피에 대한 블로그 포스트를 작성해라',
               expected_output='마크다운. 제목(#) 1개, 소제목(##) 3개, 소제목마다 2문장, 마지막 줄에 한 줄 요약',
               agent=writer)

def show_prompt(agent, task, context_text=''):
    """Crew 가 에이전트에게 보내는 프롬프트를 똑같이 재현한다 (crew.py 의 규칙)"""
    print('--- system (역할 · 목표 · 배경) ---')
    print(agent.system_prompt())
    print('--- user (작업 + 참고 + 기대 결과물) ---')
    prompt = task.description
    if context_text:
        prompt += '\\n\\n[참고할 이전 작업 결과]\\n' + context_text
    if task.expected_output:
        prompt += '\\n\\n[기대하는 결과물]\\n' + task.expected_output
    print(prompt)

show_prompt(writer, task, research)`,
            expect: `--- system (역할 · 목표 · 배경) ---
당신은 블로그 작가입니다.
목표: 조사 내용을 읽기 쉬운 글로 쓴다
배경: 기술 블로거
맡은 작업을 역할에 맞게, 요구된 결과물 형식으로 완성하세요.
--- user (작업 + 참고 + 기대 결과물) ---
커피에 대한 블로그 포스트를 작성해라

[참고할 이전 작업 결과]
조사 결과 — 커피: ① 정의와 배경 ② 최근 동향 3가지

[기대하는 결과물]
마크다운. 제목(#) 1개, 소제목(##) 3개, 소제목마다 2문장, 마지막 줄에 한 줄 요약`,
            desc: '프레임워크가 하는 일은 결국 이 두 메시지(system · user)를 조립해 <code>llm.chat()</code> 을 부르는 것입니다. 모의 LLM 은 expected_output 을 읽지 않지만 실제 모델은 “[기대하는 결과물]” 을 충실히 따릅니다. 다음 에이전트가 파싱해야 한다면 JSON 형식을 요구하고 2차시의 <code>r.json()</code> 으로 읽는 것도 좋은 방법입니다.' },
          { type: 'list', items: [
            '<b>형식</b>을 적는다: “마크다운”, “JSON {title, bullets}”, “표 형식(열: 항목 · 수치 · 출처)”',
            '<b>분량</b>을 적는다: “3문단”, “불릿 5개 이내”, “각 2문장”',
            '<b>구조</b>를 적는다: “제목 → 요약 → 본문 → 출처 목록”',
            '<b>금지</b>를 적는다: “출처 없는 수치 금지”, “영어 전문 용어는 괄호로 원어 병기”',
            '평가어(“좋은”, “훌륭한”, “잘 정리된”)는 쓰지 않는다 — 모델마다 해석이 다르다'
          ] },
          { type: 'h', text: '비용과 호출 횟수' },
          { type: 'p', html: '팀을 키울수록 결과는 좋아지지만 <b>LLM 호출 횟수</b>가 늘고, 뒤쪽 작업일수록 context 가 쌓여 프롬프트도 길어집니다. 설계 단계에서 호출 횟수를 세어 보는 습관이 필요합니다. 기본 공식은 <b>호출 수 ≈ 작업 수 × (1 + 도구 호출 수) + 매니저 호출 수</b> 입니다.' },
          { type: 'code', title: '예제 9-10. 2인 크루와 3인 크루의 호출 횟수 비교', code: `import agentlab as al

llm = al.LLM()

def run(label, agents, tasks):
    llm.calls = 0                                   # 호출 카운터 초기화
    al.Crew(agents=agents, tasks=tasks).kickoff()
    print(f'{label:<28} 작업 {len(tasks)}개 → LLM 호출 {llm.calls}회')

researcher = al.CrewAgent(role='시장 조사원', goal='주제의 동향을 조사한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글을 검토하고 고칠 점을 짚는다', llm=llm)

t1 = al.Task(description='커피 동향을 조사해라', agent=researcher)
t2 = al.Task(description='커피에 대한 블로그 포스트를 작성해라', agent=writer, context=[t1])
run('2인 크루 (조사 → 작성)', [researcher, writer], [t1, t2])

t1 = al.Task(description='커피 동향을 조사해라', agent=researcher)
t2 = al.Task(description='커피에 대한 블로그 포스트를 작성해라', agent=writer, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', agent=editor, context=[t2])
t4 = al.Task(description='편집자 의견을 반영해 최종 원고를 고쳐 써라', agent=writer, context=[t2, t3])
run('3인 크루 (조사 → 작성 → 검토 → 수정)', [researcher, writer, editor], [t1, t2, t3, t4])
print('총 토큰:', llm.total_usage.total_tokens)`,
            expect: `2인 크루 (조사 → 작성)              작업 2개 → LLM 호출 2회
3인 크루 (조사 → 작성 → 검토 → 수정)    작업 4개 → LLM 호출 4회
총 토큰: 603`,
            desc: '<code>llm.calls</code> 와 <code>llm.total_usage</code> 는 2차시에서 본 호출 추적 기능입니다. 모의 LLM 의 토큰 수는 글자 수로 어림한 값이지만, 실제 모델에서는 실제 과금 단위입니다. 수정 작업(t4)은 초안과 검토 의견을 모두 context 로 받으므로 프롬프트가 가장 깁니다.' },
          { type: 'table', head: ['크루 구성', '작업', '호출 수 (도구 없음)', '실제 모델 체감 시간', '언제'], rows: [
            ['에이전트 1 (4차시)', '1', '1 (+ 도구 호출)', '2~5초', '질문 하나에 답하기'],
            ['2인 sequential', '2', '2', '5~10초', '조사 → 작성'],
            ['3인 sequential + 검토 · 수정', '4', '4', '15~30초', '품질이 중요한 콘텐츠'],
            ['3인 hierarchical', '3', '6 이상 (매니저 포함)', '20~40초', '담당자를 미리 정할 수 없을 때'],
            ['도구 있는 조사원 포함', '+0', '작업당 +1~3', '+5~15초', '사실 확인이 필요할 때']
          ], caption: '구성별 호출 수와 시간 어림 (실제 모델 · 무료 등급 기준)' },
          { type: 'h', text: '흔한 설계 실패' },
          { type: 'p', html: '크루가 이상한 결과를 낼 때 원인은 대개 모델이 아니라 <b>설계</b>에 있습니다. 가장 흔한 두 가지는 <b>역할 겹침</b>(“조사도 하고 글도 쓰는 작가”)과 <b>모호한 작업</b>(“알아서 잘 해 줘”)입니다. 모의 LLM 으로도 그 차이가 보입니다.' },
          { type: 'code', title: '예제 9-11. 모호한 역할 · 작업 vs 구체적인 역할 · 작업', code: `import agentlab as al

llm = al.LLM()
print('--- 나쁜 예: 역할도 작업도 모호하다 ---')
helper = al.CrewAgent(role='담당자', goal='일을 잘 한다', llm=llm)
vague = al.Task(description='알아서 잘 해줘', agent=helper)
print(al.Crew(agents=[helper], tasks=[vague]).kickoff())
print()
print('--- 좋은 예: 역할 · 작업 · 결과물이 구체적이다 ---')
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 출처와 함께 정리한다', llm=llm)
clear = al.Task(description='전기차 배터리 동향을 조사해라', expected_output='핵심 동향 3가지와 출처', agent=researcher)
print(al.Crew(agents=[researcher], tasks=[clear]).kickoff())`,
            expect: `--- 나쁜 예: 역할도 작업도 모호하다 ---
[담당자] 알겠습니다. "알아서 잘 해줘" 을(를) 처리했습니다.

--- 좋은 예: 역할 · 작업 · 결과물이 구체적이다 ---
[시장 조사원] 조사 결과 — 전기차 배터리: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록`,
            desc: '모호한 작업에는 모호한 답(“처리했습니다”)이 돌아옵니다. 실제 모델은 그럴듯한 글을 써 주겠지만, 무엇을 기준으로 잘했는지 아무도 판단할 수 없다는 점은 같습니다. 역할(누가) · 작업(무엇을) · 결과물(어떤 형식으로)을 모두 구체적으로 적는 것이 크루 설계의 전부라고 해도 지나치지 않습니다.' },
          { type: 'table', head: ['실패 유형', '증상', '처방'], rows: [
            ['역할 겹침', '같은 내용을 두 에이전트가 반복 · 서로 미룸 · 매니저가 엉뚱한 담당자 선택', 'role · goal 을 서로 다른 전문성으로. “작가는 쓰기만, 편집자는 검토만”'],
            ['모호한 task', '“처리했습니다” 식의 빈 답, 매번 다른 형식', 'description 에 대상 · 범위 · 동사를 분명히, expected_output 에 형식 · 분량'],
            ['context 누락', '작가가 조사 결과를 모른 채 씀(“이전 작업 결과를 바탕으로” 가 없음)', '<code>context=[...]</code> 명시. hierarchical 이면 필수'],
            ['역할 과다', '에이전트 6~7명, 호출 폭증, 느리고 비쌈', '3~4명으로 시작. 역할을 늘리기 전에 작업을 합칠 수 없는지 검토'],
            ['검토자 없음', '그럴듯하지만 틀린 수치 · 출처', '편집자 · 검수관 역할을 넣고 backstory 에 검토 기준'],
            ['무한 재작업', '검토 → 수정 → 검토 … 끝나지 않음', '반복 횟수 상한(작업 수로 고정) 또는 “승인” 조건 명시']
          ], caption: '흔한 설계 실패와 처방' },
          { type: 'callout', kind: 'more', title: '실제 CrewAI 에는 더 있습니다', html: '<b>memory=True</b> 로 크루 전체가 공유하는 단기 · 장기 기억(5차시), <b>allow_delegation=True</b> 로 에이전트가 다른 에이전트에게 작업을 위임하는 기능, 작업 결과를 파일로 저장하는 <b>output_file</b>, 여러 크루를 조건 · 분기로 엮는 <b>Flows</b>(8차시 LangGraph 와 비슷한 역할)가 있습니다. 노트북 09 끝의 “더 알아보기” 셀에서 소개합니다.' },
          { type: 'callout', kind: 'tip', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>브라우저 예제 9-6 · 9-7 은 모의 LLM 이면 즉시, 실제 키면 15~40초 걸립니다. 시연은 모의 LLM 으로, “키를 넣으면 이렇게 달라진다” 는 1~2개만 실제로.</li><li>예제 9-7 의 <code>mock_responses=[\'0\', \'1\', \'2\']</code> 의 뜻(키 없을 때만 쓰는 대본)을 먼저 설명하지 않으면 “매니저가 그냥 순서대로 고른 것 아니냐” 는 질문이 나옵니다 — 맞습니다. 그래서 실제 키로 한 번 돌려 매니저가 실제로 고르는 로그를 보여 주면 좋습니다.</li><li>Colab 노트북 09 는 crewai 설치에 1~2분 걸립니다. 수업 시작 때 설치 셀부터 실행시켜 두세요.</li><li>12차시 프로젝트(마케팅 크루)가 이 교시의 build_crew + inputs 구조를 그대로 쓴다는 점을 예고합니다.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '오개념 지도 팁', teacher: true, html: '<ul><li><b>“에이전트가 많을수록 똑똑하다”</b> → 예제 9-10 의 호출 수 비교와 “흔한 실패” 표의 역할 과다를 함께 보여 줍니다. 3~4명이 기본.</li><li><b>“hierarchical 이 더 고급이다”</b> → 더 유연할 뿐이고, 더 비싸고 덜 예측 가능합니다. 기본은 sequential.</li><li><b>“expected_output 은 검증 기능이다”</b> → 프롬프트에 붙는 요구 사항일 뿐, 프레임워크가 형식을 검사하지는 않습니다(실제 CrewAI 의 output_pydantic 은 예외). 검증은 편집자 역할 또는 13차시 평가로.</li><li><b>“context 는 자동이니까 안 써도 된다”</b> → 여러 작업을 참고하거나 hierarchical 이면 반드시 명시.</li></ul>' },
          { type: 'callout', kind: 'info', title: '실습 9-3 · 9-4 평가 루브리크', teacher: true, html: '<table><tr><th>항목</th><th>3점</th><th>2점</th><th>1점</th></tr><tr><td>역할 설계</td><td>세 역할이 서로 다른 전문성 · 책임을 가짐</td><td>역할이 있으나 일부 겹침</td><td>역할 이름만 다르고 goal 이 같음</td></tr><tr><td>작업 · 형식</td><td>description 이 구체적이고 expected_output 에 형식 · 분량</td><td>둘 중 하나가 모호</td><td>“알아서” 수준</td></tr><tr><td>context · 매개변수화</td><td>context 명시, {topic} 과 inputs 로 재사용 가능</td><td>context 만 또는 inputs 만</td><td>둘 다 없음</td></tr><tr><td>실행 · 해석</td><td>verbose 로그를 읽고 호출 수 · 흐름을 설명</td><td>실행만 성공</td><td>실행 오류</td></tr></table><p>확장 활동: 편집자의 backstory 에 “수치가 없으면 반려한다” 를 넣고 실제 키로 돌려, 검토 의견이 어떻게 달라지는지 비교 발표.</p>' }
        ],
        practice: [
          { title: '실습 9-3. 나만의 3인 크루 만들기', level: 2,
            desc: '<p>다음 조건으로 3인 크루를 만들어 실행하세요.</p><ol><li>에이전트 3명: <b>시장 조사원</b>, <b>블로그 작가</b>, <b>편집자</b> (각자 다른 goal, 편집자에게는 검토 기준을 담은 backstory)</li><li>작업 3개: <code>\'{topic} 동향을 조사해라\'</code> → <code>\'{topic}에 대한 블로그 포스트를 작성해라\'</code>(context=[t1]) → <code>\'초안을 검토하고 문제점을 지적해라\'</code>(context=[t2]). 각 작업에 expected_output 을 적을 것</li><li><code>kickoff(inputs={\'topic\': \'커피\'})</code> 로 실행하고, 세 작업의 <code>output</code> 을 차례로 출력한 뒤 마지막 줄에 <code>llm.calls</code> 를 출력</li></ol>',
            hint: '예제 9-6 과 9-8 을 합치면 됩니다. 출력 형식: 작업마다 <code>print(t.output)</code>, 마지막에 <code>print(\'LLM 호출:\', llm.calls)</code>.',
            starter: `import agentlab as al

llm = al.LLM()
# TODO 1: 조사원 · 작가 · 편집자 CrewAgent 세 개 (편집자에게 backstory 로 검토 기준)
researcher = None
writer = None
editor = None

# TODO 2: 작업 3개 ('{topic} …' 템플릿, context, expected_output)
t1 = None
t2 = None
t3 = None

# TODO 3: Crew 를 만들어 inputs={'topic': '커피'} 로 kickoff 하고, t1~t3 의 output 과 llm.calls 를 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 출처와 함께 정리한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 논리와 근거를 검증한다',
                      backstory='근거 없는 수치와 긴 문장을 반드시 지적하는 교정 전문가', llm=llm)
t1 = al.Task(description='{topic} 동향을 조사해라', expected_output='핵심 동향 3가지와 출처', agent=researcher)
t2 = al.Task(description='{topic}에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=writer, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', expected_output='검토 의견 3가지', agent=editor, context=[t2])
crew = al.Crew(agents=[researcher, writer, editor], tasks=[t1, t2, t3])
crew.kickoff(inputs={'topic': '커피'})
for t in [t1, t2, t3]:
    print(t.output)
    print()
print('LLM 호출:', llm.calls)
`,
            expect: `[시장 조사원] 조사 결과 — 커피: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

[블로그 작가] # 커피

이전 작업 결과를 바탕으로 도입: 왜 지금 커피인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.

[편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

LLM 호출: 3` },
          { title: '실습 9-4. (도전) hierarchical 로 바꾸고 호출 수 비교하기', level: 3,
            desc: '<p>실습 9-3 의 크루를 <b>hierarchical</b> 로 바꾸세요. 작업에서 <code>agent=</code> 를 빼고, <code>manager_llm = al.LLM(mock_responses=[\'0\', \'1\', \'2\'])</code> 를 크루에 줍니다. 실행 후 <code>manager_llm.calls</code> 와 <code>llm.calls</code> 를 출력해 sequential(3회)과 비교하세요. hierarchical 에서는 <code>context</code> 를 반드시 명시해야 합니다.</p>',
            hint: '<code>al.Crew(agents=..., tasks=..., process=\'hierarchical\', manager_llm=manager_llm)</code>',
            starter: `import agentlab as al

llm = al.LLM()
manager_llm = al.LLM(mock_responses=['0', '1', '2'])
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 출처와 함께 정리한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 논리와 근거를 검증한다', llm=llm)
# TODO: agent 없이 작업 3개 (context 명시)
t1 = None
t2 = None
t3 = None
# TODO: process='hierarchical', manager_llm=manager_llm 으로 Crew 를 만들어 kickoff
# TODO: 매니저 호출 수와 담당자 호출 수 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
manager_llm = al.LLM(mock_responses=['0', '1', '2'])
researcher = al.CrewAgent(role='시장 조사원', goal='주제의 최신 동향을 출처와 함께 정리한다', llm=llm)
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 읽기 쉬운 글로 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 논리와 근거를 검증한다', llm=llm)
t1 = al.Task(description='{topic} 동향을 조사해라', expected_output='핵심 동향 3가지와 출처')
t2 = al.Task(description='{topic}에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', expected_output='검토 의견 3가지', context=[t2])
crew = al.Crew(agents=[researcher, writer, editor], tasks=[t1, t2, t3],
               process='hierarchical', manager_llm=manager_llm, verbose=True)
crew.kickoff(inputs={'topic': '커피'})
print()
print('매니저 호출:', manager_llm.calls, '/ 담당자 호출:', llm.calls, '/ 합계:', manager_llm.calls + llm.calls)
`,
            expect: `
🧑‍💼 [시장 조사원] 작업 1/3: 커피 동향을 조사해라
   ✔ 결과: [시장 조사원] 조사 결과 — 커피: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록

🧑‍💼 [블로그 작가] 작업 2/3: 커피에 대한 블로그 포스트를 작성해라
   ✔ 결과: [블로그 작가] # 커피

이전 작업 결과를 바탕으로 도입: 왜 지금 커피인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한

🧑‍💼 [편집자] 작업 3/3: 초안을 검토하고 문제점을 지적해라
   ✔ 결과: [편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

매니저 호출: 3 / 담당자 호출: 3 / 합계: 6` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '크루 설계: 프로세스 · 반성 · 매개변수화 · 비용', subtitle: '잘 돌아가는 팀은 설계에서 결정된다', notes: '<p>2교시. 1교시의 2인 크루를 “설계” 관점에서 확장합니다. 12차시 마케팅 프로젝트의 기초라는 점을 처음에 말해 두면 동기가 됩니다.</p><p>⏱ 도입 2분</p>' },
          { layout: 'diagram', title: 'sequential vs hierarchical', html: FIG_SEQ_HIER, caption: '순서 · 담당 고정 vs 매니저 LLM 이 배정',
            notes: '<p>💬 “학교 축제 준비를 둘 중 어느 방식으로 할까?” → 역할이 뻔하면 sequential, 매번 다른 요청이 들어오면 hierarchical.</p><p>기본값은 sequential. hierarchical 은 호출 수 · 예측 불가능성이 비용.</p>' },
          { layout: 'table', title: '두 프로세스 비교', head: ['', 'sequential', 'hierarchical'], rows: [
            ['담당자', '코드에서 고정', '매니저 LLM 이 선택'],
            ['LLM 호출', '작업 수', '작업 수 + 매니저 호출'],
            ['예측 · 디버깅', '쉬움', '로그 추적 필요'],
            ['어울리는 일', '정해진 파이프라인', '접수 창구형 업무'],
            ['권장', '기본값', '필요할 때만']
          ], notes: '<p>표를 읽은 뒤 “그래서 오늘 예제는 대부분 sequential” 이라고 정리.</p>' },
          { layout: 'diagram', title: '편집자를 넣어 반성 단계 만들기', html: FIG_REFLECT, caption: '쓰는 사람 ≠ 검토하는 사람 · 작업 4개 · 에이전트 3명',
            notes: '<p>6차시 Reflector(비평 → 수정)를 팀 구조로 옮긴 것. 작가가 작업 2와 4를 모두 맡는 점, 수정 작업의 context=[t2, t3] 를 강조.</p>' },
          { layout: 'code', title: '3인 크루 실행', code: `import agentlab as al

llm = al.LLM()
r = al.CrewAgent(role='시장 조사원', goal='동향을 조사한다', llm=llm)
w = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
e = al.CrewAgent(role='편집자', goal='근거와 논리를 검증한다',
                 backstory='근거 없는 문장을 그냥 넘기지 않는다', llm=llm)
t1 = al.Task(description='전기차 동향을 조사해라', agent=r)
t2 = al.Task(description='전기차에 대한 블로그 포스트를 작성해라', agent=w, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', agent=e, context=[t2])
t4 = al.Task(description='편집자 의견을 반영해 최종 원고를 고쳐 써라', agent=w, context=[t2, t3])
crew = al.Crew(agents=[r, w, e], tasks=[t1, t2, t3, t4], verbose=True)
print(crew.kickoff())
print('LLM 호출:', llm.calls)`, points: ['작업 4개 = 호출 4회', '편집자는 검토만 · 작가가 수정', '모의 LLM 의 수정본은 단순 규칙'],
            notes: '<p>▶ 실행. 모의 LLM 의 “수정본: (요청문) 최근 조사에 따르면…” 이 어색한 이유(규칙 기반)를 미리 말해 둡니다. 실제 키가 있으면 여기서 한 번 실제로 돌려 비교.</p>' },
          { layout: 'code', title: 'hierarchical — 매니저가 담당자를 고른다', code: `import agentlab as al

llm = al.LLM()
manager_llm = al.LLM(mock_responses=['0', '1', '2'])   # 키 없을 때의 대본
r = al.CrewAgent(role='시장 조사원', goal='동향을 조사한다', llm=llm)
w = al.CrewAgent(role='블로그 작가', goal='글을 쓴다', llm=llm)
e = al.CrewAgent(role='편집자', goal='글을 검토한다', llm=llm)
t1 = al.Task(description='전기차 동향을 조사해라')                 # agent 없음
t2 = al.Task(description='전기차에 대한 블로그 포스트를 작성해라', context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', context=[t2])
crew = al.Crew(agents=[r, w, e], tasks=[t1, t2, t3],
               process='hierarchical', manager_llm=manager_llm, verbose=True)
crew.kickoff()
print('매니저', manager_llm.calls, '회 + 담당자', llm.calls, '회')`, points: ['작업에 agent 없음 → 매니저가 번호로 선택', '호출 3 + 3 = 6회 (sequential 은 3회)', 'hierarchical 은 context 명시 필수'],
            notes: '<p>▶ 실행. mock_responses 는 “키 없을 때만 쓰는 대본” 임을 반드시 설명. 💬 “매니저가 편집자에게 조사를 시키면?” → role · goal 을 뚜렷하게.</p>' },
          { layout: 'diagram', title: 'inputs 로 주제 매개변수화', html: FIG_INPUTS, caption: "description 의 {topic} 을 kickoff(inputs={'topic': ...}) 로 채운다",
            notes: '<p>12차시에서 “오늘의 키워드” 를 inputs 로 넣는 구조를 예고. agentlab 은 description 을 덮어쓰므로 크루를 함수로 만들어 매번 새로 생성.</p>' },
          { layout: 'code', title: '같은 크루, 다른 주제', code: `import agentlab as al

def build_crew(llm):
    r = al.CrewAgent(role='시장 조사원', goal='동향을 조사한다', llm=llm)
    w = al.CrewAgent(role='블로그 작가', goal='글을 쓴다', llm=llm)
    t1 = al.Task(description='{topic} 동향을 조사해라', agent=r)
    t2 = al.Task(description='{topic}에 대한 블로그 포스트를 작성해라',
                 expected_output='제목과 3문단', agent=w, context=[t1])
    return al.Crew(agents=[r, w], tasks=[t1, t2])

llm = al.LLM()
for topic in ['전기차', '커피']:
    print('===', topic, '===')
    print(build_crew(llm).kickoff(inputs={'topic': topic}))`, points: ['크루 = 함수 → 재사용', '<code>format(**inputs)</code> 로 치환', '중괄호 글자는 <code>{{ }}</code>'],
            notes: '<p>▶ 실행. 두 주제의 제목이 바뀌는 것 확인. 💬 “topic 말고 또 무엇을 매개변수로 빼면 좋을까?” → 대상 독자, 분량, 말투.</p>' },
          { layout: 'code', title: 'expected_output — 프롬프트 들여다보기', code: `import agentlab as al

w = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=al.LLM())
task = al.Task(description='커피에 대한 블로그 포스트를 작성해라',
               expected_output='마크다운. 제목 1개, 소제목 3개, 각 2문장, 끝에 한 줄 요약',
               agent=w)
research = '조사 결과 — 커피: ① 정의 ② 동향 3가지'

print('--- system ---'); print(w.system_prompt())
print('--- user ---')
print(task.description + '\\n\\n[참고할 이전 작업 결과]\\n' + research
      + '\\n\\n[기대하는 결과물]\\n' + task.expected_output)`, points: ['프레임워크 = 두 메시지 조립', 'expected_output 은 다음 에이전트와의 계약', '형식 · 분량 · 구조 · 금지, 평가어 ✗'],
            notes: '<p>▶ 실행. “마법이 아니다” 를 다시 강조. 좋은 expected_output 체크리스트(형식 · 분량 · 구조 · 금지)를 칠판에.</p>' },
          { layout: 'code', title: '호출 횟수 세기', code: `import agentlab as al

llm = al.LLM()
r = al.CrewAgent(role='시장 조사원', goal='조사', llm=llm)
w = al.CrewAgent(role='블로그 작가', goal='작성', llm=llm)
e = al.CrewAgent(role='편집자', goal='검토', llm=llm)
t1 = al.Task(description='커피 동향을 조사해라', agent=r)
t2 = al.Task(description='커피에 대한 블로그 포스트를 작성해라', agent=w, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', agent=e, context=[t2])
t4 = al.Task(description='편집자 의견을 반영해 최종 원고를 고쳐 써라', agent=w, context=[t2, t3])
al.Crew(agents=[r, w, e], tasks=[t1, t2, t3, t4]).kickoff()
print('호출:', llm.calls, '회 / 토큰:', llm.total_usage.total_tokens)`, points: ['호출 ≈ 작업 × (1 + 도구) + 매니저', '뒤 작업일수록 context 가 길다', '실제 모델: 호출당 2~5초'],
            notes: '<p>▶ 실행. 표(구성별 호출 수 · 시간)로 이어서 설명. 💬 “에이전트를 7명으로 늘리면?” → 호출 · 시간 · 비용 폭증, 품질은 보장 안 됨.</p>' },
          { layout: 'table', title: '흔한 설계 실패', head: ['유형', '증상', '처방'], rows: [
            ['역할 겹침', '반복 · 미룸 · 엉뚱한 배정', 'role · goal 을 다른 전문성으로'],
            ['모호한 task', '“처리했습니다” 식 빈 답', 'description 구체화 + expected_output'],
            ['context 누락', '앞 결과를 모른 채 작업', 'context=[...] 명시'],
            ['역할 과다', '느리고 비쌈', '3~4명으로 시작'],
            ['검토자 없음', '그럴듯한 오류', '편집자 역할 + 검토 기준']
          ], notes: '<p>예제 9-11(“알아서 잘 해줘”)을 실행해 보여 주면서 표를 읽습니다. 학생들이 실습 9-3 에서 저지를 실수를 미리 보여 주는 셈.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[3].q, options: QUIZ2[3].options, answer: QUIZ2[3].answer, explain: QUIZ2[3].explain, notes: '<p>작업 수 = 호출 수(도구 · 매니저 없을 때). 도구가 있으면? 매니저가 있으면? 을 이어서 질문.</p>' },
          { layout: 'practice', title: '실습 9-3. 나만의 3인 크루', desc: '<p>조사원 · 작가 · 편집자, 작업 3개({topic} 템플릿 · context · expected_output), inputs 로 “커피” 실행, 세 output 과 llm.calls 출력.</p>',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: 조사원 · 작가 · 편집자 / 작업 3개 ('{topic} …', context, expected_output)
# TODO: Crew(...).kickoff(inputs={'topic': '커피'}) 후 t1~t3.output, llm.calls 출력
`, solution: `import agentlab as al

llm = al.LLM()
r = al.CrewAgent(role='시장 조사원', goal='동향을 출처와 함께 정리한다', llm=llm)
w = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
e = al.CrewAgent(role='편집자', goal='근거와 논리를 검증한다', backstory='근거 없는 수치를 반드시 지적한다', llm=llm)
t1 = al.Task(description='{topic} 동향을 조사해라', expected_output='핵심 3가지와 출처', agent=r)
t2 = al.Task(description='{topic}에 대한 블로그 포스트를 작성해라', expected_output='제목과 3문단', agent=w, context=[t1])
t3 = al.Task(description='초안을 검토하고 문제점을 지적해라', expected_output='검토 의견 3가지', agent=e, context=[t2])
al.Crew(agents=[r, w, e], tasks=[t1, t2, t3]).kickoff(inputs={'topic': '커피'})
for t in [t1, t2, t3]:
    print(t.output)
print('LLM 호출:', llm.calls)`,
            notes: '<p>⏱ 10분. 순회하며 역할 겹침 · 모호한 task 를 찾아 지적. 빨리 끝낸 학생은 실습 9-4(hierarchical) 로. 루브릭은 교사용 본문 참고.</p>' },
          { layout: 'summary', title: '정리', bullets: ['<b>sequential</b> 이 기본, <b>hierarchical</b> 은 매니저 LLM 이 배정(호출 ↑)', '편집자 역할 = 팀 구조로 만든 반성(검토 → 수정), context=[t2, t3]', '<code>{topic}</code> + <code>kickoff(inputs=…)</code> 로 같은 팀 재사용', '<code>expected_output</code> = 다음 에이전트와의 형식 계약', '호출 ≈ 작업 × (1 + 도구) + 매니저 — 3~4명으로 시작', '다음 차시: AutoGen — 에이전트들이 <b>대화</b>로 협업한다'],
            notes: '<p>⏱ 정리 5분. 다음 차시 예고: CrewAI 가 “작업 파이프라인” 이라면 AutoGen 은 “회의”. 같은 조사원 · 작가 · 편집자가 대화로 일하면 무엇이 달라질지 생각해 오게 합니다. Colab 노트북 09 는 과제.</p>' }
        ]
      }
    ]
  });
})();
