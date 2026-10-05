/* 10차시 AutoGen: 다자간 대화형 에이전트 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 10-1. 대화 기반 협업: 두 에이전트가 메시지를 주고받다 TERMINATE 로 멈춘다 */
  const FIG_CONV = `<svg viewBox="0 0 720 300" role="img" aria-label="코더와 리뷰어 두 에이전트가 메시지를 번갈아 주고받고, 리뷰어의 TERMINATE 메시지에서 대화가 끝나는 그림">
  ${ARROW('m10a1')}
  <rect x="20" y="40" width="150" height="220" rx="14" class="card-bg"/>
  <rect x="20" y="40" width="150" height="40" rx="14" class="p1"/>
  <text x="95" y="66" text-anchor="middle" class="tx-w">리뷰어</text>
  <text x="95" y="104" text-anchor="middle" class="tx-m">system_message</text>
  <text x="95" y="122" text-anchor="middle" class="tx-m" font-size="11">"코드를 검토하고</text>
  <text x="95" y="138" text-anchor="middle" class="tx-m" font-size="11">문제없으면 TERMINATE"</text>
  <text x="95" y="175" text-anchor="middle" class="tx-m">chat_messages</text>
  <text x="95" y="193" text-anchor="middle" class="tx-m" font-size="11">(상대별 대화 기록)</text>
  <rect x="550" y="40" width="150" height="220" rx="14" class="card-bg"/>
  <rect x="550" y="40" width="150" height="40" rx="14" class="p2"/>
  <text x="625" y="66" text-anchor="middle" class="tx-w">코더</text>
  <text x="625" y="104" text-anchor="middle" class="tx-m">system_message</text>
  <text x="625" y="122" text-anchor="middle" class="tx-m" font-size="11">"너는 파이썬 개발자다"</text>
  <text x="625" y="175" text-anchor="middle" class="tx-m">chat_messages</text>
  <text x="625" y="193" text-anchor="middle" class="tx-m" font-size="11">(상대별 대화 기록)</text>
  <line x1="172" y1="90" x2="546" y2="90" class="ln" stroke-width="2.5" marker-end="url(#m10a1)"/>
  <rect x="250" y="70" width="220" height="24" rx="6" class="p1s"/>
  <text x="360" y="87" text-anchor="middle" class="tx-m" font-size="12">① "두 수를 더하는 함수를 작성해라"</text>
  <line x1="548" y1="150" x2="174" y2="150" class="ln" stroke-width="2.5" marker-end="url(#m10a1)"/>
  <rect x="250" y="130" width="220" height="24" rx="6" class="p2s"/>
  <text x="360" y="147" text-anchor="middle" class="tx-m" font-size="12">② "def add(a, b): return a + b"</text>
  <line x1="172" y1="210" x2="546" y2="210" class="ln" stroke-width="2.5" marker-end="url(#m10a1)"/>
  <rect x="250" y="190" width="220" height="24" rx="6" class="p1s"/>
  <text x="360" y="207" text-anchor="middle" class="tx-m" font-size="12">③ "리뷰 결과: 승인. TERMINATE"</text>
  <rect x="300" y="236" width="120" height="30" rx="15" class="p4"/>
  <text x="360" y="256" text-anchor="middle" class="tx-w" font-size="12">⏹ 종료 조건 충족</text>
  <text x="360" y="290" text-anchor="middle" class="tx-m">작업 목록이 아니라 메시지 교환으로 협업한다 — 종료 조건 또는 max_turns 까지</text>
</svg>`;

  /* 그림 10-2. initiate_chat 의 타임라인 */
  const FIG_INITIATE = `<svg viewBox="0 0 720 260" role="img" aria-label="a.initiate_chat(b, message, max_turns) 의 진행: a 가 메시지를 보내면 b 가 답하고 a 가 답하는 것을 턴마다 반복하며, 종료 메시지나 max_turns 에서 멈춘다">
  ${ARROW('m10a2')}
  <text x="360" y="28" text-anchor="middle" class="tx-b">a.initiate_chat(b, message='…', max_turns=3)</text>
  <line x1="120" y1="60" x2="120" y2="225" class="s1" stroke-width="3"/>
  <line x1="600" y1="60" x2="600" y2="225" class="s2" stroke-width="3"/>
  <text x="120" y="52" text-anchor="middle" class="tx-b">a (시작한 쪽)</text>
  <text x="600" y="52" text-anchor="middle" class="tx-b">b (받는 쪽)</text>
  <line x1="124" y1="80" x2="594" y2="80" class="ln" stroke-width="2" marker-end="url(#m10a2)"/>
  <text x="360" y="74" text-anchor="middle" class="tx-m" font-size="12">message (대화 시작)</text>
  <line x1="596" y1="112" x2="126" y2="112" class="ln" stroke-width="2" marker-end="url(#m10a2)"/>
  <text x="360" y="106" text-anchor="middle" class="tx-m" font-size="12">b.generate_reply() → 답</text>
  <line x1="124" y1="144" x2="594" y2="144" class="ln" stroke-width="2" marker-end="url(#m10a2)"/>
  <text x="360" y="138" text-anchor="middle" class="tx-m" font-size="12">a.generate_reply() → 답</text>
  <line x1="596" y1="176" x2="126" y2="176" class="ln" stroke-width="2" marker-end="url(#m10a2)"/>
  <text x="360" y="170" text-anchor="middle" class="tx-m" font-size="12">b → 답 …</text>
  <rect x="20" y="86" width="70" height="52" rx="8" class="p3s"/>
  <text x="55" y="108" text-anchor="middle" class="tx-m" font-size="11">턴 1</text><text x="55" y="126" text-anchor="middle" class="tx-m" font-size="11">(왕복)</text>
  <rect x="20" y="150" width="70" height="52" rx="8" class="p3s"/>
  <text x="55" y="172" text-anchor="middle" class="tx-m" font-size="11">턴 2</text><text x="55" y="190" text-anchor="middle" class="tx-m" font-size="11">(왕복)</text>
  <rect x="630" y="100" width="80" height="60" rx="8" class="p4s"/>
  <text x="670" y="122" text-anchor="middle" class="tx-m" font-size="11">답마다</text><text x="670" y="138" text-anchor="middle" class="tx-m" font-size="11">is_termination_msg</text><text x="670" y="154" text-anchor="middle" class="tx-m" font-size="11">검사</text>
  <text x="360" y="212" text-anchor="middle" class="tx-m">멈추는 조건: ① 답에 종료 표시(TERMINATE) ② max_turns 소진</text>
  <text x="360" y="244" text-anchor="middle" class="tx-m">반환: ChatResult — chat_history(메시지 목록) · summary(마지막 메시지)</text>
</svg>`;

  /* 그림 10-3. human_input_mode */
  const FIG_HUMAN = `<svg viewBox="0 0 720 230" role="img" aria-label="human_input_mode 세 가지: NEVER 는 사람 개입 없이 자동, ALWAYS 는 매 턴 사람이 입력, TERMINATE 는 종료 직전에만 사람에게 묻는다">
  ${ARROW('m10a3')}
  <rect x="10" y="20" width="220" height="190" rx="14" class="card-bg"/>
  <rect x="250" y="20" width="220" height="190" rx="14" class="card-bg"/>
  <rect x="490" y="20" width="220" height="190" rx="14" class="card-bg"/>
  <text x="120" y="48" text-anchor="middle" class="tx-b">NEVER</text>
  <text x="360" y="48" text-anchor="middle" class="tx-b">ALWAYS</text>
  <text x="600" y="48" text-anchor="middle" class="tx-b">TERMINATE</text>
  <rect x="40" y="70" width="70" height="36" rx="8" class="p1"/><text x="75" y="93" text-anchor="middle" class="tx-w" font-size="12">LLM</text>
  <rect x="130" y="70" width="70" height="36" rx="8" class="p2"/><text x="165" y="93" text-anchor="middle" class="tx-w" font-size="12">LLM</text>
  <line x1="112" y1="88" x2="126" y2="88" class="ln" stroke-width="2" marker-end="url(#m10a3)"/>
  <text x="120" y="140" text-anchor="middle" class="tx-m">사람 개입 없음 · 자동 실행</text>
  <text x="120" y="160" text-anchor="middle" class="tx-m">브라우저 예제 · 배치 작업</text>
  <text x="120" y="190" text-anchor="middle" class="tx-m" font-size="11">무한 대화 방지: max_turns 필수</text>
  <rect x="280" y="70" width="70" height="36" rx="8" class="p5"/><text x="315" y="93" text-anchor="middle" class="tx-w" font-size="12">🧑 사람</text>
  <rect x="370" y="70" width="70" height="36" rx="8" class="p2"/><text x="405" y="93" text-anchor="middle" class="tx-w" font-size="12">LLM</text>
  <line x1="352" y1="88" x2="366" y2="88" class="ln" stroke-width="2" marker-end="url(#m10a3)"/>
  <text x="360" y="140" text-anchor="middle" class="tx-m">매 턴 사람이 직접 입력</text>
  <text x="360" y="160" text-anchor="middle" class="tx-m">= 사람이 에이전트 하나를 맡음</text>
  <text x="360" y="190" text-anchor="middle" class="tx-m" font-size="11">input() 으로 대신 말한다</text>
  <rect x="520" y="70" width="60" height="36" rx="8" class="p1"/><text x="550" y="93" text-anchor="middle" class="tx-w" font-size="12">LLM</text>
  <rect x="595" y="70" width="50" height="36" rx="8" class="p2"/><text x="620" y="93" text-anchor="middle" class="tx-w" font-size="12">LLM</text>
  <rect x="655" y="70" width="45" height="36" rx="8" class="p5"/><text x="677" y="93" text-anchor="middle" class="tx-w" font-size="11">🧑</text>
  <line x1="582" y1="88" x2="591" y2="88" class="ln" stroke-width="2" marker-end="url(#m10a3)"/>
  <line x1="647" y1="88" x2="651" y2="88" class="ln" stroke-width="2" marker-end="url(#m10a3)"/>
  <text x="600" y="140" text-anchor="middle" class="tx-m">종료 직전에만 사람에게 확인</text>
  <text x="600" y="160" text-anchor="middle" class="tx-m">= 결재자 (human-in-the-loop)</text>
  <text x="600" y="190" text-anchor="middle" class="tx-m" font-size="11">실제 AutoGen 의 기본값</text>
</svg>`;

  /* 그림 10-4. 실제 AutoGen 의 UserProxyAgent ↔ AssistantAgent */
  const FIG_PROXY = `<svg viewBox="0 0 720 240" role="img" aria-label="실제 AutoGen 에서 AssistantAgent 가 코드를 쓰고 UserProxyAgent 가 그 코드를 실행해 결과를 돌려주는 왕복 구조">
  ${ARROW('m10a4')}
  <rect x="30" y="50" width="240" height="140" rx="14" class="card-bg"/>
  <rect x="30" y="50" width="240" height="40" rx="14" class="p2"/>
  <text x="150" y="76" text-anchor="middle" class="tx-w">AssistantAgent (LLM)</text>
  <text x="150" y="118" text-anchor="middle" class="tx-m">코드를 쓴다</text>
  <text x="150" y="138" text-anchor="middle" class="tx-m" font-size="11">오류가 오면 고쳐서 다시 쓴다</text>
  <text x="150" y="170" text-anchor="middle" class="tx-m" font-size="11">끝나면 TERMINATE</text>
  <rect x="450" y="50" width="240" height="140" rx="14" class="card-bg"/>
  <rect x="450" y="50" width="240" height="40" rx="14" class="p5"/>
  <text x="570" y="76" text-anchor="middle" class="tx-w">UserProxyAgent (사람 대리)</text>
  <text x="570" y="118" text-anchor="middle" class="tx-m">코드를 실행한다</text>
  <text x="570" y="138" text-anchor="middle" class="tx-m" font-size="11">code_execution_config</text>
  <text x="570" y="170" text-anchor="middle" class="tx-m" font-size="11">human_input_mode 로 사람 개입 결정</text>
  <line x1="272" y1="100" x2="446" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m10a4)"/>
  <text x="360" y="94" text-anchor="middle" class="tx-m" font-size="12">python 코드 블록</text>
  <line x1="448" y1="150" x2="274" y2="150" class="ln" stroke-width="2.5" marker-end="url(#m10a4)"/>
  <text x="360" y="168" text-anchor="middle" class="tx-m" font-size="12">실행 결과 · 오류 메시지</text>
  <text x="360" y="222" text-anchor="middle" class="tx-m">4차시의 “도구” 가 여기서는 “코드를 실행해 주는 대화 상대” 가 된다</text>
</svg>`;

  /* 그림 10-5. 그룹 채팅 구조 */
  const FIG_GROUP = `<svg viewBox="0 0 720 320" role="img" aria-label="가운데 GroupChatManager 가 공유 메시지 목록을 들고 있고, 기획자·개발자·마케터·비평가 네 에이전트가 둘러싸고 있으며 매니저가 다음 발언자를 고르는 그림">
  ${ARROW('m10a5')}
  <rect x="250" y="110" width="220" height="100" rx="16" class="p5"/>
  <text x="360" y="140" text-anchor="middle" class="tx-w">GroupChatManager</text>
  <text x="360" y="162" text-anchor="middle" class="tx-w" font-size="12">① 다음 발언자 선택</text>
  <text x="360" y="180" text-anchor="middle" class="tx-w" font-size="12">② 답을 공유 기록에 추가</text>
  <text x="360" y="198" text-anchor="middle" class="tx-w" font-size="12">③ 종료 조건 · max_round 검사</text>
  <rect x="40" y="30" width="130" height="50" rx="12" class="p1"/><text x="105" y="60" text-anchor="middle" class="tx-w">기획자</text>
  <rect x="550" y="30" width="130" height="50" rx="12" class="p2"/><text x="615" y="60" text-anchor="middle" class="tx-w">개발자</text>
  <rect x="40" y="240" width="130" height="50" rx="12" class="p3"/><text x="105" y="270" text-anchor="middle" class="tx-w">마케터</text>
  <rect x="550" y="240" width="130" height="50" rx="12" class="p4"/><text x="615" y="270" text-anchor="middle" class="tx-w">비평가</text>
  <line x1="172" y1="70" x2="250" y2="118" class="ln" stroke-width="2" marker-end="url(#m10a5)"/>
  <line x1="548" y1="70" x2="470" y2="118" class="ln" stroke-width="2" marker-end="url(#m10a5)"/>
  <line x1="172" y1="250" x2="250" y2="202" class="ln" stroke-width="2" marker-end="url(#m10a5)"/>
  <line x1="548" y1="250" x2="470" y2="202" class="ln" stroke-width="2" marker-end="url(#m10a5)"/>
  <rect x="270" y="236" width="180" height="60" rx="10" class="card-bg"/>
  <text x="360" y="258" text-anchor="middle" class="tx-b" font-size="12">GroupChat.messages</text>
  <text x="360" y="276" text-anchor="middle" class="tx-m" font-size="11">모두가 보는 공유 대화 기록</text>
  <text x="360" y="290" text-anchor="middle" class="tx-m" font-size="11">[(이름, 내용), …]</text>
  <line x1="360" y1="212" x2="360" y2="232" class="ln" stroke-width="2" marker-end="url(#m10a5)"/>
  <text x="360" y="22" text-anchor="middle" class="tx-m">GroupChat(agents, max_round, speaker_selection_method) + GroupChatManager(gc, llm).run(주제)</text>
</svg>`;

  /* 그림 10-6. 발언자 선택: round_robin vs auto */
  const FIG_SPEAKER = `<svg viewBox="0 0 720 260" role="img" aria-label="왼쪽 round_robin 은 기획자→개발자→마케터→비평가 순서를 돌고, 오른쪽 auto 는 매니저 LLM 이 대화 내용을 보고 다음 발언자를 고른다">
  ${ARROW('m10a6')}
  <rect x="10" y="10" width="340" height="240" rx="14" class="card-bg"/>
  <rect x="370" y="10" width="340" height="240" rx="14" class="card-bg"/>
  <text x="180" y="38" text-anchor="middle" class="tx-b">speaker_selection_method='round_robin'</text>
  <text x="540" y="38" text-anchor="middle" class="tx-b">speaker_selection_method='auto'</text>
  <circle cx="180" cy="140" r="70" class="s3" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
  <rect x="145" y="52" width="70" height="30" rx="8" class="p1"/><text x="180" y="72" text-anchor="middle" class="tx-w" font-size="12">기획자</text>
  <rect x="240" y="125" width="70" height="30" rx="8" class="p2"/><text x="275" y="145" text-anchor="middle" class="tx-w" font-size="12">개발자</text>
  <rect x="145" y="198" width="70" height="30" rx="8" class="p3"/><text x="180" y="218" text-anchor="middle" class="tx-w" font-size="12">마케터</text>
  <rect x="50" y="125" width="70" height="30" rx="8" class="p4"/><text x="85" y="145" text-anchor="middle" class="tx-w" font-size="12">비평가</text>
  <path d="M218 76 C250 90 262 100 266 122" class="ln" stroke-width="2" fill="none" marker-end="url(#m10a6)"/>
  <path d="M266 158 C262 180 250 190 218 204" class="ln" stroke-width="2" fill="none" marker-end="url(#m10a6)"/>
  <path d="M142 204 C110 190 98 180 94 158" class="ln" stroke-width="2" fill="none" marker-end="url(#m10a6)"/>
  <path d="M94 122 C98 100 110 90 142 76" class="ln" stroke-width="2" fill="none" marker-end="url(#m10a6)"/>
  <text x="180" y="146" text-anchor="middle" class="tx-m" font-size="12">정해진 순서</text>
  <text x="180" y="242" text-anchor="middle" class="tx-m" font-size="11">예측 가능 · LLM 호출 없음</text>
  <rect x="470" y="56" width="140" height="44" rx="10" class="p5"/>
  <text x="540" y="74" text-anchor="middle" class="tx-w" font-size="12">매니저 LLM</text>
  <text x="540" y="91" text-anchor="middle" class="tx-w" font-size="11">"다음에 누가 말해야 하나?"</text>
  <rect x="395" y="130" width="70" height="30" rx="8" class="p1s"/><text x="430" y="150" text-anchor="middle" class="tx-m" font-size="12">기획자</text>
  <rect x="470" y="130" width="70" height="30" rx="8" class="p2s"/><text x="505" y="150" text-anchor="middle" class="tx-m" font-size="12">개발자</text>
  <rect x="545" y="130" width="70" height="30" rx="8" class="p3s"/><text x="580" y="150" text-anchor="middle" class="tx-m" font-size="12">마케터</text>
  <rect x="620" y="130" width="70" height="30" rx="8" class="p4s"/><text x="655" y="150" text-anchor="middle" class="tx-m" font-size="12">비평가</text>
  <line x1="520" y1="102" x2="440" y2="126" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m10a6)"/>
  <line x1="535" y1="102" x2="510" y2="126" class="ln" stroke-width="2.5" marker-end="url(#m10a6)"/>
  <line x1="548" y1="102" x2="575" y2="126" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m10a6)"/>
  <line x1="562" y1="102" x2="645" y2="126" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m10a6)"/>
  <rect x="400" y="176" width="280" height="44" rx="8" class="card-bg"/>
  <text x="540" y="194" text-anchor="middle" class="tx-m" font-size="11">최근 대화 기록을 보고 적임자를 고른다</text>
  <text x="540" y="210" text-anchor="middle" class="tx-m" font-size="11">("기술 검토가 필요" → 개발자)</text>
  <text x="540" y="242" text-anchor="middle" class="tx-m" font-size="11">유연 · 발언마다 LLM 호출 1회 추가</text>
</svg>`;

  /* 그림 10-7. 이벤트 기반 대화 패턴 */
  const FIG_EVENT = `<svg viewBox="0 0 720 250" role="img" aria-label="메시지가 이벤트가 되어 공유 기록에 쌓이고, 관심 있는 에이전트가 반응해 새 메시지를 만드는 이벤트 기반 패턴. 여러 에이전트가 동시에 반응할 수 있다">
  ${ARROW('m10a7')}
  <rect x="20" y="90" width="150" height="70" rx="12" class="p1"/>
  <text x="95" y="118" text-anchor="middle" class="tx-w">메시지 = 이벤트</text>
  <text x="95" y="140" text-anchor="middle" class="tx-w" font-size="11">"기술 검토가 필요합니다"</text>
  <rect x="250" y="40" width="220" height="170" rx="14" class="card-bg"/>
  <text x="360" y="66" text-anchor="middle" class="tx-b" font-size="13">공유 대화 기록 (메시지 버스)</text>
  <rect x="270" y="80" width="180" height="24" rx="6" class="p1s"/><text x="360" y="97" text-anchor="middle" class="tx-m" font-size="11">매니저: 일정을 정합시다</text>
  <rect x="270" y="110" width="180" height="24" rx="6" class="p2s"/><text x="360" y="127" text-anchor="middle" class="tx-m" font-size="11">개발자: 기술 검토 필요</text>
  <rect x="270" y="140" width="180" height="24" rx="6" class="p4s"/><text x="360" y="157" text-anchor="middle" class="tx-m" font-size="11">비평가: DB 계획이 빠짐</text>
  <rect x="270" y="170" width="180" height="24" rx="6" class="p3s"/><text x="360" y="187" text-anchor="middle" class="tx-m" font-size="11">마케터: 홍보 자료 기한</text>
  <line x1="172" y1="125" x2="246" y2="125" class="ln" stroke-width="2.5" marker-end="url(#m10a7)"/>
  <rect x="550" y="50" width="150" height="40" rx="10" class="p2s"/><text x="625" y="75" text-anchor="middle" class="tx-m" font-size="12">개발자: 반응</text>
  <rect x="550" y="105" width="150" height="40" rx="10" class="p4s"/><text x="625" y="130" text-anchor="middle" class="tx-m" font-size="12">비평가: 반응</text>
  <rect x="550" y="160" width="150" height="40" rx="10" class="p3s"/><text x="625" y="185" text-anchor="middle" class="tx-m" font-size="12">마케터: 반응 (동시 가능)</text>
  <line x1="472" y1="90" x2="546" y2="72" class="ln" stroke-width="2" marker-end="url(#m10a7)"/>
  <line x1="472" y1="125" x2="546" y2="125" class="ln" stroke-width="2" marker-end="url(#m10a7)"/>
  <line x1="472" y1="160" x2="546" y2="178" class="ln" stroke-width="2" marker-end="url(#m10a7)"/>
  <text x="360" y="238" text-anchor="middle" class="tx-m">순서를 미리 짜지 않는다 — 메시지가 오면 관심 있는 에이전트가 반응한다 (AutoGen 의 강점: 다자간 · 비동기)</text>
</svg>`;

  /* 그림 10-8. 세 프레임워크 비교 */
  const FIG_COMPARE = `<svg viewBox="0 0 720 300" role="img" aria-label="LangGraph 는 노드와 조건 분기의 그래프, CrewAI 는 역할이 있는 작업 파이프라인, AutoGen 은 에이전트들의 대화로 협업 모델을 비교하는 그림">
  ${ARROW('m10a8')}
  <rect x="10" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <rect x="250" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <rect x="490" y="10" width="220" height="280" rx="14" class="card-bg"/>
  <text x="120" y="38" text-anchor="middle" class="tx-b">LangGraph (8차시)</text>
  <text x="360" y="38" text-anchor="middle" class="tx-b">CrewAI (9차시)</text>
  <text x="600" y="38" text-anchor="middle" class="tx-b">AutoGen (10차시)</text>
  <text x="120" y="58" text-anchor="middle" class="tx-m">“그래프로 제어”</text>
  <text x="360" y="58" text-anchor="middle" class="tx-m">“역할 팀의 파이프라인”</text>
  <text x="600" y="58" text-anchor="middle" class="tx-m">“대화로 협업”</text>
  <circle cx="70" cy="110" r="16" class="p1"/><text x="70" y="114" text-anchor="middle" class="tx-w" font-size="10">A</text>
  <circle cx="150" cy="90" r="16" class="p2"/><text x="150" y="94" text-anchor="middle" class="tx-w" font-size="10">B</text>
  <circle cx="150" cy="150" r="16" class="p3"/><text x="150" y="154" text-anchor="middle" class="tx-w" font-size="10">C</text>
  <circle cx="110" cy="200" r="16" class="p4"/><text x="110" y="204" text-anchor="middle" class="tx-w" font-size="10">END</text>
  <line x1="86" y1="104" x2="132" y2="93" class="ln" stroke-width="2" marker-end="url(#m10a8)"/>
  <line x1="86" y1="117" x2="132" y2="144" class="ln" stroke-width="2" marker-end="url(#m10a8)"/>
  <line x1="142" y1="165" x2="120" y2="186" class="ln" stroke-width="2" marker-end="url(#m10a8)"/>
  <path d="M150 106 C170 130 170 140 166 150" class="ln" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
  <text x="120" y="240" text-anchor="middle" class="tx-m" font-size="11">상태 · 조건 분기 · 루프</text>
  <text x="120" y="258" text-anchor="middle" class="tx-m" font-size="11">흐름을 정확히 통제할 때</text>
  <text x="120" y="276" text-anchor="middle" class="tx-m" font-size="11">단일 에이전트 · 워크플로</text>
  <rect x="275" y="92" width="50" height="36" rx="8" class="p1"/><text x="300" y="115" text-anchor="middle" class="tx-w" font-size="11">조사</text>
  <rect x="335" y="92" width="50" height="36" rx="8" class="p2"/><text x="360" y="115" text-anchor="middle" class="tx-w" font-size="11">작성</text>
  <rect x="395" y="92" width="50" height="36" rx="8" class="p3"/><text x="420" y="115" text-anchor="middle" class="tx-w" font-size="11">검토</text>
  <line x1="327" y1="110" x2="331" y2="110" class="ln" stroke-width="2" marker-end="url(#m10a8)"/>
  <line x1="387" y1="110" x2="391" y2="110" class="ln" stroke-width="2" marker-end="url(#m10a8)"/>
  <rect x="300" y="150" width="120" height="30" rx="8" class="p5s"/><text x="360" y="170" text-anchor="middle" class="tx-m" font-size="11">role · goal · task</text>
  <text x="360" y="240" text-anchor="middle" class="tx-m" font-size="11">역할 · 작업 · 결과물 계약</text>
  <text x="360" y="258" text-anchor="middle" class="tx-m" font-size="11">단계가 정해진 콘텐츠 생산</text>
  <text x="360" y="276" text-anchor="middle" class="tx-m" font-size="11">빠르게 팀을 짤 때</text>
  <rect x="515" y="80" width="80" height="26" rx="12" class="p1s"/><text x="555" y="97" text-anchor="middle" class="tx-m" font-size="11">기획자: …</text>
  <rect x="605" y="112" width="80" height="26" rx="12" class="p2s"/><text x="645" y="129" text-anchor="middle" class="tx-m" font-size="11">개발자: …</text>
  <rect x="515" y="144" width="80" height="26" rx="12" class="p4s"/><text x="555" y="161" text-anchor="middle" class="tx-m" font-size="11">비평가: …</text>
  <rect x="605" y="176" width="80" height="26" rx="12" class="p3s"/><text x="645" y="193" text-anchor="middle" class="tx-m" font-size="11">마케터: …</text>
  <text x="600" y="240" text-anchor="middle" class="tx-m" font-size="11">메시지 · 종료 조건 · 발언자 선택</text>
  <text x="600" y="258" text-anchor="middle" class="tx-m" font-size="11">토론 · 코드 실행 왕복 · 사람 개입</text>
  <text x="600" y="276" text-anchor="middle" class="tx-m" font-size="11">순서를 미리 정할 수 없을 때</text>
</svg>`;

  const QUIZ1 = [
    { q: 'AutoGen 의 협업 모델을 CrewAI 와 비교해 <b>가장 잘</b> 설명한 것은?', options: ['작업 목록을 순서대로 처리한다', '에이전트들이 메시지를 주고받으며 종료 조건까지 대화한다', '그래프의 노드와 엣지로 흐름을 정의한다', '에이전트 하나가 도구를 반복 호출한다'], answer: 1,
      explain: 'CrewAI 는 Task 목록을 처리하는 “작업 파이프라인”, AutoGen 은 에이전트끼리 메시지를 교환하는 “대화” 모델입니다. 누가 몇 번 말할지 미리 정하지 않고 종료 조건(TERMINATE) 또는 max_turns 로 멈춥니다.' },
    { q: '<code>reviewer.initiate_chat(coder, message=\'…\', max_turns=3)</code> 에서 대화가 <b>멈추는</b> 경우가 <b>아닌</b> 것은?', options: ['어느 쪽 답에 TERMINATE 가 들어 있을 때', '왕복 3턴을 모두 썼을 때', '<code>is_termination_msg</code> 가 True 를 돌려줄 때', '코더가 코드를 처음 보냈을 때'], answer: 3,
      explain: '코드를 보내는 것 자체는 평범한 메시지입니다. 대화는 종료 표시(기본값 TERMINATE 포함 여부, <code>is_termination_msg</code> 로 바꿀 수 있음) 또는 max_turns 소진으로만 멈춥니다.' },
    { q: '<code>human_input_mode=\'NEVER\'</code> 의 뜻은?', options: ['사람이 매 턴 직접 입력한다', '사람 개입 없이 LLM 끼리 자동으로 대화한다', '종료 직전에만 사람에게 묻는다', '사람이 system_message 를 매번 고친다'], answer: 1,
      explain: 'NEVER 는 완전 자동, ALWAYS 는 매 턴 사람이 입력(사람이 에이전트 하나를 맡음), TERMINATE 는 종료 직전에만 사람에게 확인합니다. 브라우저 예제는 NEVER 이므로 max_turns 로 무한 대화를 막아야 합니다.' },
    { q: 'ChatResult 에서 전체 대화 기록을 꺼내려면?', options: ['<code>result.summary</code>', '<code>result.chat_history</code>', '<code>result.messages()</code>', '<code>result.output</code>'], answer: 1,
      explain: '<code>chat_history</code> 는 <code>[{\'name\': …, \'content\': …}, …]</code> 목록이고, <code>summary</code> 는 마지막 메시지입니다. 실제 AutoGen 의 ChatResult 도 같은 이름을 씁니다.' }
  ];
  const QUIZ2 = [
    { q: '<code>GroupChatManager</code> 가 매 라운드마다 하는 일로 <b>알맞지 않은</b> 것은?', options: ['다음 발언자를 고른다', '발언을 공유 대화 기록에 추가한다', '종료 조건과 max_round 를 검사한다', '각 에이전트의 system_message 를 다시 쓴다'], answer: 3,
      explain: '매니저는 발언자 선택 → 공유 기록 추가 → 종료 검사를 반복할 뿐, 에이전트의 역할(system_message)을 바꾸지 않습니다.' },
    { q: '<code>speaker_selection_method=\'auto\'</code> 를 쓰면 <code>\'round_robin\'</code> 과 비교해 무엇이 달라질까?', options: ['발언 순서가 고정되고 LLM 호출이 줄어든다', '매니저 LLM 이 대화 내용을 보고 발언자를 골라 유연해지지만 발언마다 호출이 1회 늘어난다', '에이전트 수가 자동으로 늘어난다', '종료 조건이 없어도 저절로 멈춘다'], answer: 1,
      explain: 'auto 는 매니저 LLM 에게 “다음에 누가 말해야 하나?” 를 물어 적임자를 고릅니다. 유연하지만 라운드마다 LLM 호출이 추가되고, 모의 LLM 은 판단할 수 없어 mock_responses 로 대본을 줍니다.' },
    { q: '비평가가 “회의 종료” 라고 말하면 멈추게 하려면?', options: ['<code>max_round=1</code>', '<code>ConversableAgent(..., is_termination_msg=lambda m: \'회의 종료\' in m)</code>', '<code>system_message</code> 에 “회의 종료” 를 쓴다', '<code>GroupChat(messages=[\'회의 종료\'])</code>'], answer: 1,
      explain: '<code>is_termination_msg</code> 는 “이 메시지로 끝낼까?” 를 판단하는 함수입니다. 기본값은 TERMINATE 포함 여부이며, 발언한 에이전트의 함수가 검사됩니다.' },
    { q: '세 프레임워크와 어울리는 상황을 <b>바르게</b> 짝지은 것은?', options: ['LangGraph = 토론 / CrewAI = 그래프 제어 / AutoGen = 역할 파이프라인', 'LangGraph = 흐름을 정확히 통제 / CrewAI = 단계가 정해진 역할 팀 / AutoGen = 순서를 미리 정할 수 없는 다자간 대화', 'LangGraph = 역할 팀 / CrewAI = 대화 / AutoGen = 그래프', '셋은 완전히 같은 일을 하므로 아무거나 써도 된다'], answer: 1,
      explain: 'LangGraph 는 상태 · 조건 분기 · 루프로 흐름을 통제, CrewAI 는 role · task 로 파이프라인형 팀, AutoGen 은 메시지 교환과 종료 조건으로 토론 · 코드 실행 왕복 · 사람 개입에 강합니다.' },
    { q: '그룹 채팅이 <code>max_round</code> 까지 멈추지 않고 의미 없는 인사만 주고받는다면 가장 먼저 점검할 것은?', options: ['에이전트 수를 늘린다', '종료 조건(TERMINATE 지시 또는 is_termination_msg)과 역할 지시가 분명한지', 'max_round 를 100 으로 올린다', '모델을 더 큰 것으로 바꾼다'], answer: 1,
      explain: '대화형 협업의 흔한 실패는 “끝내는 법을 아무도 모르는” 경우입니다. 누가 어떤 말로 끝내는지(비평가의 승인 → TERMINATE)를 system_message 와 is_termination_msg 에 명시해야 합니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag10',
    no: '10',
    title: 'AutoGen: 다자간 대화형 에이전트',
    subtitle: 'ConversableAgent · initiate_chat · GroupChat · 종료 조건',
    summary: '작업 목록 대신 <b>대화</b>로 협업하는 에이전트를 만듭니다. 코더와 리뷰어가 메시지를 주고받다 TERMINATE 로 끝내는 2자 대화, 기획자 · 개발자 · 마케터 · 비평가가 참여하는 그룹 채팅, 발언자 선택과 종료 조건을 브라우저 <code>agentlab</code> 으로 체험하고, LangGraph · CrewAI · AutoGen 세 프레임워크를 언제 쓸지 비교합니다.',
    goals: [
      '대화 기반 협업 모델(메시지 교환 · 종료 조건 · max_turns)을 CrewAI 의 작업 파이프라인과 비교해 설명할 수 있다',
      'ConversableAgent 와 initiate_chat 으로 코더 ↔ 리뷰어 2자 대화를 만들고 ChatResult 를 읽을 수 있다',
      'GroupChat · GroupChatManager 로 3~4인 그룹 채팅을 만들고 발언자 선택(round_robin / auto)과 종료 조건을 바꿀 수 있다',
      'LangGraph · CrewAI · AutoGen 의 강점을 알고 문제에 맞는 프레임워크를 고를 수 있다'
    ],
    sections: [
      {
        id: 'ag10-1',
        title: '대화로 협업하기 — ConversableAgent 와 2자 대화',
        minutes: 50,
        goals: ['대화 기반 협업 모델과 종료 조건을 설명한다', 'ConversableAgent · initiate_chat 으로 코더 ↔ 리뷰어 대화를 실행한다', 'ChatResult.chat_history 를 읽고 max_turns 의 효과를 확인한다', 'human_input_mode 와 실제 AutoGen 의 UserProxyAgent 를 이해한다'],
        flow: [['도입 · 대화 모델', 8], ['ConversableAgent (코드)', 15], ['종료 조건 · max_turns', 10], ['사람 개입 · 실제 AutoGen', 10], ['퀴즈 · 정리', 7]],
        content: [
          { type: 'p', html: '9차시의 CrewAI 는 “작업 목록을 순서대로 처리하는 팀” 이었습니다. 조사원이 끝나면 작가, 작가가 끝나면 편집자 — 누가 언제 무엇을 할지 코드에 다 적혀 있었습니다. 그런데 실제 팀은 그렇게만 일하지 않습니다. 개발자가 코드를 보내면 리뷰어가 지적하고, 개발자가 고쳐서 다시 보내고, 리뷰어가 “됐다” 고 할 때까지 <b>대화</b>가 오갑니다. 몇 번 오갈지는 미리 알 수 없습니다. <b>AutoGen</b> 은 이런 “대화로 협업하는 에이전트” 를 만드는 프레임워크입니다.' },
          { type: 'h', text: '대화 기반 협업 모델' },
          { type: 'p', html: 'AutoGen 의 기본 단위는 <b>ConversableAgent</b>(대화할 수 있는 에이전트)입니다. 각 에이전트는 이름과 역할(system_message)을 갖고, 상대에게 메시지를 보내고(<code>send</code>), 받은 메시지에 답합니다(<code>generate_reply</code>). 협업은 <b>한 에이전트가 다른 에이전트에게 말을 거는 것</b>(<code>initiate_chat</code>)으로 시작되고, 둘이 번갈아 답하다가 <b>종료 조건</b>이 충족되면 멈춥니다. 기본 종료 조건은 “답에 <code>TERMINATE</code> 라는 단어가 들어 있는가” 입니다.' },
          { type: 'figure', html: FIG_CONV, caption: '그림 10-1. 리뷰어가 코더에게 말을 걸고, 코더가 코드를 보내고, 리뷰어가 검토 후 TERMINATE 로 끝냅니다. 작업 목록이 아니라 메시지 교환이 협업의 단위입니다.' },
          { type: 'table', head: ['', 'CrewAI (9차시)', 'AutoGen (이번 차시)'], rows: [
            ['협업 단위', 'Task (작업)', 'Message (메시지)'],
            ['흐름', 'tasks 목록 순서 (또는 매니저 배정)', '대화 — 상대의 답에 따라 다음 말이 정해짐'],
            ['몇 번 돌까', '작업 수만큼 (고정)', '종료 조건 또는 max_turns 까지 (가변)'],
            ['끝내는 법', '마지막 작업이 끝나면', 'TERMINATE 같은 종료 표시 · is_termination_msg · max_turns'],
            ['결과', '마지막 task.output', 'ChatResult — chat_history 전체 · summary(마지막 메시지)'],
            ['사람 개입', '별도 설계 필요', 'human_input_mode 로 내장 (NEVER · ALWAYS · TERMINATE)']
          ], caption: '작업 파이프라인과 대화 모델의 차이' },
          { type: 'h', text: 'ConversableAgent 와 initiate_chat' },
          { type: 'p', html: '가장 유명한 AutoGen 예제인 <b>코더 ↔ 리뷰어</b> 대화를 브라우저에서 만들어 봅시다. <code>al.ConversableAgent(name, system_message, llm)</code> 로 두 에이전트를 만들고, 리뷰어가 코더에게 <code>initiate_chat</code> 으로 말을 겁니다. 리뷰어의 system_message 에 “문제가 없으면 TERMINATE 라고 말해라” 를 넣어 두는 것이 핵심입니다 — 누군가는 끝내는 법을 알아야 합니다.' },
          { type: 'code', title: '예제 10-1. 코더 ↔ 리뷰어 2자 대화', code: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다. 요청받은 함수를 짧고 명확하게 작성한다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 코드를 검토하고 문제가 없으면 TERMINATE 라고 말해라.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print()
print('대화 메시지 수:', len(result.chat_history))`,
            expect: `
리뷰어 → 코더:
두 수를 더하는 함수를 작성해라

코더 → 리뷰어:
[코더] def add(a, b):
    """두 수를 더한다"""
    return a + b

print(add(2, 3))  # 5

리뷰어 → 코더:
[리뷰어] 리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 출력도 있습니다. 타입 힌트(a: int, b: int)를 추가하면 더 좋겠습니다. 승인합니다. TERMINATE

대화 메시지 수: 3`,
            desc: '리뷰어가 요청을 보내자(①) 코더가 함수를 쓰고(②), 리뷰어가 검토 후 “승인합니다. TERMINATE” 로 끝냈습니다(③). <code>max_turns=3</code> 이면 최대 왕복 3번(메시지 6개)까지 갈 수 있었지만 종료 조건이 먼저 충족되어 메시지 3개로 멈췄습니다. 답 앞의 <code>[코더]</code>, <code>[리뷰어]</code> 는 모의 LLM 이 붙이는 역할 표시이고, 실제 모델은 붙이지 않습니다. (예시 출력은 모의 LLM 기준)' },
          { type: 'figure', html: FIG_INITIATE, caption: '그림 10-2. initiate_chat 의 진행. 시작한 쪽(a)이 message 를 보내면 받는 쪽(b)부터 번갈아 답합니다. 답마다 is_termination_msg 를 검사하고, max_turns(왕복 수)를 넘으면 멈춥니다.' },
          { type: 'callout', kind: 'tip', title: '모의 LLM 이 이 대화를 “연기” 하는 방법', html: '키가 없을 때 모의 LLM 은 규칙으로 답합니다. “함수를 작성해라” → <code>def add</code> 코드, 역할 이름에 “리뷰” 가 있고 받은 메시지에 코드가 있으면 → “리뷰 결과 … TERMINATE”. 그래서 예제의 역할 이름과 요청 문장을 그대로 두어야 대화가 자연스럽게 흐릅니다. 실제 키를 넣으면 실제 모델이 진짜로 코드를 쓰고 리뷰합니다.' },
          { type: 'p', html: '<code>initiate_chat</code> 은 <b>ChatResult</b> 를 돌려줍니다. <code>chat_history</code> 에 메시지 목록이, <code>summary</code> 에 마지막 메시지가 들어 있습니다. 로그를 끄고(<code>silent=True</code>) 기록만 살펴봅시다.' },
          { type: 'code', title: '예제 10-2. ChatResult 읽기 — chat_history 와 summary', code: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 문제가 없으면 TERMINATE 라고 말해라.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3, silent=True)
print(result)
for i, m in enumerate(result.chat_history, 1):
    print(f'{i}. {m["name"]:<4} | {m["content"][:50]!r}')
print()
print('마지막 메시지(summary):', result.summary[:40], '...')
print('TERMINATE 로 끝났나?', 'TERMINATE' in result.summary)`,
            expect: `ChatResult(3 messages)
1. 리뷰어  | '두 수를 더하는 함수를 작성해라'
2. 코더   | '[코더] def add(a, b):\\n    """두 수를 더한다"""\\n    return '
3. 리뷰어  | '[리뷰어] 리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 출력도 있습니다.'

마지막 메시지(summary): [리뷰어] 리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 ...
TERMINATE 로 끝났나? True`,
            desc: '<code>chat_history</code> 의 각 항목은 <code>{\'name\': 보낸 이, \'content\': 내용}</code> 입니다. 실제 AutoGen 의 ChatResult 도 <code>chat_history</code> · <code>summary</code> · <code>cost</code> 를 갖습니다. 대화가 끝난 뒤 “코더가 마지막으로 보낸 코드” 처럼 특정 발언을 꺼내려면 이 목록을 이름으로 걸러 쓰면 됩니다.' },
          { type: 'h', text: '종료 조건이 없으면: max_turns 가 안전장치' },
          { type: 'p', html: '아무도 TERMINATE 를 말하지 않으면 대화는 <code>max_turns</code> 까지 계속됩니다. 기획자와 개발자가 종료 조건 없이 아이디어를 주고받는 예를 봅시다. 모의 LLM 은 상대 말의 키워드로만 답하므로 대화가 점점 엉뚱해지는데, 실제 모델도 종료 조건이 없으면 “감사합니다” “천만에요” 를 주고받으며 토큰을 낭비하는 일이 흔합니다.' },
          { type: 'code', title: '예제 10-3. 종료 조건 없는 대화는 max_turns 에서 멈춘다', code: `import agentlab as al

llm = al.LLM()
planner = al.ConversableAgent('기획자', system_message='너는 서비스 기획자다.', llm=llm)
dev = al.ConversableAgent('개발자', system_message='너는 앱 개발자다.', llm=llm)
result = planner.initiate_chat(dev, message='공부 기록 앱의 이름 아이디어를 제안해줘', max_turns=2)
print()
print('메시지 수:', len(result.chat_history), '(max_turns=2 → 2 × 2 = 최대 4개)')`,
            expect: `
기획자 → 개발자:
공부 기록 앱의 이름 아이디어를 제안해줘

개발자 → 기획자:
[개발자] 제안: ① "에이전트원" ② "오토브레인" ③ "스마트메이트" — 이 중 ②를 추천합니다. 짧고 기억하기 쉽습니다.

기획자 → 개발자:
[기획자] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.

개발자 → 기획자:
[개발자] def add(a, b):
    """두 수를 더한다"""
    return a + b

print(add(2, 3))  # 5

메시지 수: 4 (max_turns=2 → 2 × 2 = 최대 4개)`,
            desc: '세 번째 메시지부터 대화가 엉뚱해집니다(모의 LLM 이 “에이전트원” 의 “에이전트”, “프로그램” 같은 키워드에 반응한 것). 그래도 <code>max_turns=2</code> 덕분에 메시지 4개에서 멈췄습니다. <b>교훈 두 가지</b>: ① 누군가는 끝내는 법(TERMINATE)을 알아야 한다 ② 그래도 max_turns 는 반드시 둔다. 브라우저 예제는 모두 사람 개입이 없는(NEVER) 자동 대화이므로 이 안전장치가 특히 중요합니다.' },
          { type: 'h', text: '도구를 가진 대화 상대' },
          { type: 'p', html: 'ConversableAgent 에도 4차시의 도구를 줄 수 있습니다(<code>tools=[...]</code>). 도구가 있는 에이전트는 답할 때 내부에서 에이전트 루프(판단 → 도구 → 관찰 → 답)를 돌립니다. 실제 AutoGen 에서 가장 흔한 짝은 <b>질문하는 대리인(user_proxy)</b> 과 <b>도구로 답하는 어시스턴트(assistant)</b> 입니다.' },
          { type: 'code', title: '예제 10-4. 계산기 도구를 가진 어시스턴트에게 묻기', code: `import agentlab as al

llm = al.LLM()
assistant = al.ConversableAgent('assistant', system_message='너는 계산을 돕는 어시스턴트다. 계산은 반드시 도구로 한다.',
                                llm=llm, tools=[al.calculator])
user_proxy = al.ConversableAgent('user_proxy', system_message='너는 사용자를 대신해 질문하는 대리인이다.', llm=llm)
result = user_proxy.initiate_chat(assistant, message='1500 * 0.15 는 얼마야?', max_turns=1)
print()
print('마지막 답:', result.summary)`,
            expect: `
user_proxy → assistant:
1500 * 0.15 는 얼마야?

assistant → user_proxy:
[assistant] 계산 결과는 225 입니다.

마지막 답: [assistant] 계산 결과는 225 입니다.`,
            desc: '<code>max_turns=1</code> 이면 “질문 → 답” 한 번으로 끝나는 가장 단순한 대화입니다. 어시스턴트는 보이지 않는 곳에서 <code>calculator(\'1500 * 0.15\')</code> 를 호출해 225 를 얻었습니다. 9차시의 도구 있는 CrewAgent 와 같은 원리입니다.' },
          { type: 'h', text: '사람이 끼어드는 자리: human_input_mode' },
          { type: 'p', html: '대화형 모델의 큰 장점은 <b>사람이 대화 참여자로 자연스럽게 들어갈 수 있다</b>는 점입니다. <code>human_input_mode</code> 가 그 자리를 정합니다. <b>NEVER</b> 는 사람 개입 없이 자동(브라우저 예제 전부), <b>ALWAYS</b> 는 매 턴 사람이 그 에이전트 대신 입력(<code>agentlab</code> 에서는 <code>input()</code>), <b>TERMINATE</b> 는 종료 직전에만 사람에게 “이대로 끝낼까요?” 를 묻습니다. 실제 AutoGen 의 UserProxyAgent 기본값은 ALWAYS 이고, 자동화할 때 NEVER 로 바꿉니다.' },
          { type: 'figure', html: FIG_HUMAN, caption: '그림 10-3. 세 가지 human_input_mode. NEVER 는 자동, ALWAYS 는 사람이 에이전트 하나를 맡음, TERMINATE 는 결재자처럼 마지막에만 개입합니다.' },
          { type: 'h', text: '실제 AutoGen 코드' },
          { type: 'p', html: '실제 AutoGen 에서 가장 전형적인 구성은 <b>AssistantAgent</b>(LLM 이 코드를 씀) + <b>UserProxyAgent</b>(사람 대신 코드를 <b>실행</b>하고 결과를 돌려줌)입니다. 어시스턴트가 보낸 파이썬 코드 블록을 user_proxy 가 실행하고, 오류가 나면 그 오류 메시지를 다시 보내 어시스턴트가 고치게 합니다 — 6차시의 자기 수정(Self-Correction)이 대화로 구현된 것입니다.' },
          { type: 'figure', html: FIG_PROXY, caption: '그림 10-4. 실제 AutoGen 의 코드 실행 왕복. 4차시에서 함수였던 “도구” 가 여기서는 코드를 실행해 주는 대화 상대입니다.' },
          { type: 'code', title: '실제 AutoGen — Colab 에서 실행 (pip install "ag2[gemini]")', run: false, code: `import os
from autogen import AssistantAgent, UserProxyAgent        # AG2 (구 pyautogen) — ConversableAgent 계열 API

llm_config = {'config_list': [{'model': 'gemini-2.5-flash', 'api_type': 'google',
                               'api_key': os.environ['GEMINI_API_KEY']}]}

coder = AssistantAgent('coder', llm_config=llm_config,
                       system_message='너는 파이썬 개발자다. 코드는 반드시 python 코드 블록으로 준다. 끝나면 TERMINATE 라고 말해라.')
user_proxy = UserProxyAgent('user_proxy',
                            human_input_mode='NEVER',                                   # 사람 개입 없음
                            code_execution_config={'work_dir': 'coding', 'use_docker': False},   # 코드를 실행해 준다
                            is_termination_msg=lambda m: 'TERMINATE' in (m.get('content') or ''),
                            max_consecutive_auto_reply=5)

result = user_proxy.initiate_chat(coder, message='두 수를 더하는 함수를 작성하고 테스트해라', max_turns=4)
for m in result.chat_history:
    print(m['name'], ':', m['content'][:80])
print(result.cost)`,
            desc: 'AutoGen 은 두 갈래로 나뉘어 있습니다. <b>AG2</b>(<code>pip install ag2</code>, 구 pyautogen)는 이 차시의 <code>ConversableAgent · initiate_chat · GroupChat</code> API 를 그대로 잇고, Microsoft 의 <b>autogen-agentchat 0.4+</b> 는 비동기(async) 중심의 새 API(<code>RoundRobinGroupChat</code>, <code>SelectorGroupChat</code>)를 씁니다. 브라우저 <code>agentlab</code> 은 AG2 계열과 이름을 맞췄고, 노트북 10 은 AG2 를 설치합니다. <code>use_docker=False</code> 는 Colab 처럼 Docker 가 없는 환경용입니다.' },
          { type: 'table', head: ['agentlab (브라우저)', 'AG2 / pyautogen (Colab)', '비고'], rows: [
            ['<code>al.ConversableAgent(name, system_message, llm, human_input_mode, is_termination_msg, tools)</code>', '<code>ConversableAgent(name, system_message, llm_config, human_input_mode, is_termination_msg)</code>', '<code>llm</code> 객체 vs <code>llm_config</code> dict'],
            ['(없음 — ConversableAgent 로 대신)', '<code>AssistantAgent</code> · <code>UserProxyAgent(code_execution_config)</code>', '실제는 코드 실행 내장'],
            ['<code>a.initiate_chat(b, message, max_turns, silent)</code> → ChatResult', '<code>a.initiate_chat(b, message, max_turns, silent)</code> → ChatResult', '같음'],
            ['<code>result.chat_history</code> · <code>result.summary</code>', '<code>result.chat_history</code> · <code>result.summary</code> · <code>result.cost</code>', '실제는 비용 집계 포함'],
            ['<code>al.GroupChat(agents, max_round, speaker_selection_method)</code>', '<code>GroupChat(agents, messages=[], max_round, speaker_selection_method)</code>', '같음'],
            ['<code>al.GroupChatManager(gc, llm).run(message)</code>', '<code>user_proxy.initiate_chat(GroupChatManager(gc, llm_config), message)</code>', '실제는 매니저도 대화 상대']
          ], caption: 'agentlab 미니 AutoGen 과 AG2 의 대응' },
          { type: 'colab', title: 'Colab 실습 10 — 실제 AutoGen(AG2) 으로 코드 실행 왕복과 그룹 채팅', html: '<p>Colab 노트북에서 <code>pip install "ag2[gemini]"</code> 로 AG2 를 설치하고, AssistantAgent + UserProxyAgent 의 <b>코드 실행 왕복</b>(어시스턴트가 쓴 코드를 user_proxy 가 실제로 실행), 그리고 2교시의 그룹 채팅(round_robin / auto, 종료 조건)을 실제 모델로 돌려 봅니다. API 키는 Colab 🔑 Secrets 의 <code>GEMINI_API_KEY</code> 로 읽습니다. 노트북 끝에 Microsoft autogen-agentchat 0.4 API 의 같은 예제도 소개합니다.</p>' }
        ],
        practice: [
          { title: '실습 10-1. 종료 조건을 “승인” 으로 바꾸기', level: 1,
            desc: '<p>예제 10-1 을 고쳐 보세요. ① 코더의 system_message 에 “타입 힌트를 쓴다” 를 추가 ② 리뷰어의 system_message 를 “문제가 없으면 \'승인합니다\' 라고 말해라” 로 바꾸고 ③ 리뷰어에 <code>is_termination_msg=lambda m: \'승인\' in m</code> 을 주어 “승인” 이라는 말로 대화가 끝나게 합니다. 실행 후 메시지 수를 출력하세요.</p>',
            hint: '<code>al.ConversableAgent(\'리뷰어\', system_message=..., llm=llm, is_termination_msg=lambda m: \'승인\' in m)</code>. 모의 LLM 의 리뷰 답에는 “승인합니다” 와 TERMINATE 가 모두 들어 있어 어느 조건으로도 끝납니다.',
            starter: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
# TODO: 리뷰어의 system_message 를 바꾸고 is_termination_msg 추가
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 문제가 없으면 TERMINATE 라고 말해라.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print()
print('메시지 수:', len(result.chat_history))
`,
            solution: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다. 타입 힌트를 쓴다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 문제가 없으면 "승인합니다" 라고 말해라.', llm=llm,
                               is_termination_msg=lambda m: '승인' in m)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print()
print('메시지 수:', len(result.chat_history))
`,
            expect: `
리뷰어 → 코더:
두 수를 더하는 함수를 작성해라

코더 → 리뷰어:
[코더] def add(a, b):
    """두 수를 더한다"""
    return a + b

print(add(2, 3))  # 5

리뷰어 → 코더:
[리뷰어] 리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 출력도 있습니다. 타입 힌트(a: int, b: int)를 추가하면 더 좋겠습니다. 승인합니다. TERMINATE

메시지 수: 3` },
          { title: '실습 10-2. 날씨 도구를 가진 어시스턴트', level: 2, nondeterministic: true,
            desc: '<p>예제 10-4 의 어시스턴트에게 <code>al.calculator</code> 대신 <code>al.get_weather</code> 를 주고, user_proxy 가 <code>\'부산 날씨 알려줘\'</code> 라고 묻게 하세요(<code>max_turns=1</code>). 마지막 답(<code>result.summary</code>)을 출력합니다. 네트워크가 있으면 실제 날씨가, 없으면 예시 데이터가 나옵니다.</p>',
            hint: '<code>tools=[al.get_weather]</code>, system_message 는 “너는 날씨를 알려주는 어시스턴트다.”',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: tools=[al.get_weather] 인 assistant 만들기
assistant = None
user_proxy = al.ConversableAgent('user_proxy', system_message='너는 사용자 대리인이다.', llm=llm)
# TODO: '부산 날씨 알려줘' 로 initiate_chat(max_turns=1) 하고 result.summary 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
assistant = al.ConversableAgent('assistant', system_message='너는 날씨를 알려주는 어시스턴트다.', llm=llm, tools=[al.get_weather])
user_proxy = al.ConversableAgent('user_proxy', system_message='너는 사용자 대리인이다.', llm=llm)
result = user_proxy.initiate_chat(assistant, message='부산 날씨 알려줘', max_turns=1)
print()
print('답:', result.summary)
` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'AutoGen: 다자간 대화형 에이전트', subtitle: '작업 목록이 아니라 대화로 협업한다', notes: '<p>10차시 1교시. 9차시 CrewAI(작업 파이프라인)와 대비시켜 시작합니다. 💬 발문: “코드 리뷰는 몇 번 오갈지 미리 알 수 있나요?” → 없다 → 그래서 ‘대화’ 모델이 필요.</p><p>⏱ 도입 8분</p>' },
          { layout: 'diagram', title: '대화 기반 협업 모델', html: FIG_CONV, caption: '메시지 교환 · 종료 조건(TERMINATE) · max_turns',
            notes: '<p>세 요소를 칠판에: ① 메시지를 주고받는다 ② 누군가 끝내는 말을 한다(TERMINATE) ③ 안전장치 max_turns.</p><p>“협업 단위가 Task 에서 Message 로 바뀐다” 가 핵심 문장.</p>' },
          { layout: 'table', title: 'CrewAI vs AutoGen', head: ['', 'CrewAI', 'AutoGen'], rows: [
            ['협업 단위', 'Task', 'Message'],
            ['흐름', '작업 순서 고정', '상대 답에 따라 결정'],
            ['몇 번', '작업 수 (고정)', '종료 조건 · max_turns (가변)'],
            ['결과', '마지막 task.output', 'ChatResult (전체 기록)'],
            ['사람 개입', '별도 설계', 'human_input_mode 내장']
          ], notes: '<p>표의 “몇 번” 행이 가장 중요: 고정 vs 가변. 가변이기 때문에 종료 조건 설계가 AutoGen 의 핵심 기술입니다.</p>' },
          { layout: 'code', title: '코더 ↔ 리뷰어', code: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어',
    system_message='너는 코드 리뷰어다. 문제가 없으면 TERMINATE 라고 말해라.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print('메시지 수:', len(result.chat_history))`, points: ['리뷰어가 말을 건다 → 코더 답 → 리뷰어 검토', '“TERMINATE” 가 종료 신호', 'max_turns=3 이지만 3개 메시지로 끝'],
            notes: '<p>▶ 실행. 화살표(리뷰어 → 코더) 방향과 순서를 짚습니다. 💬 “리뷰어 system_message 에서 TERMINATE 문장을 지우면?” → 다음 슬라이드(max_turns) 로 연결.</p>' },
          { layout: 'diagram', title: 'initiate_chat 의 진행', html: FIG_INITIATE, caption: '턴 = 왕복 · 답마다 종료 검사 · ChatResult 반환',
            notes: '<p>턴(왕복) 과 메시지 수를 구분: max_turns=3 → 메시지 최대 6개. ChatResult 의 chat_history · summary 를 미리 소개.</p>' },
          { layout: 'code', title: 'ChatResult 읽기', code: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어',
    system_message='너는 코드 리뷰어다. 문제가 없으면 TERMINATE 라고 말해라.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라',
                                max_turns=3, silent=True)
for i, m in enumerate(result.chat_history, 1):
    print(i, m['name'], '|', m['content'][:40].replace('\\n', ' '))
print('summary:', result.summary[:30], '…')`, points: ['<code>silent=True</code> 로그 끄기', '<code>chat_history</code> = [{name, content}, …]', '<code>summary</code> = 마지막 메시지'],
            notes: '<p>▶ 실행. “코더가 마지막으로 보낸 코드만 꺼내려면?” → name 으로 거르기. 실제 AutoGen 도 같은 이름.</p>' },
          { layout: 'code', title: '종료 조건이 없으면', code: `import agentlab as al

llm = al.LLM()
planner = al.ConversableAgent('기획자', system_message='너는 서비스 기획자다.', llm=llm)
dev = al.ConversableAgent('개발자', system_message='너는 앱 개발자다.', llm=llm)
result = planner.initiate_chat(dev, message='공부 기록 앱의 이름 아이디어를 제안해줘',
                               max_turns=2)
print('메시지 수:', len(result.chat_history))`, points: ['아무도 TERMINATE 를 모름', '대화가 엉뚱하게 흐름', '<code>max_turns</code> 가 멈춰 줌'],
            notes: '<p>▶ 실행. 세 번째 메시지부터 엉뚱해지는 것을 웃으며 보여 주고, 실제 모델도 “감사합니다/천만에요” 루프에 빠진다는 점을 설명. 교훈: 종료 조건 + max_turns 둘 다.</p>' },
          { layout: 'code', title: '도구를 가진 대화 상대', code: `import agentlab as al

llm = al.LLM()
assistant = al.ConversableAgent('assistant',
    system_message='너는 계산을 돕는 어시스턴트다.', llm=llm, tools=[al.calculator])
user_proxy = al.ConversableAgent('user_proxy',
    system_message='너는 사용자 대리인이다.', llm=llm)
result = user_proxy.initiate_chat(assistant, message='1500 * 0.15 는 얼마야?', max_turns=1)
print('답:', result.summary)`, points: ['<code>tools=[...]</code> → 내부에서 에이전트 루프', 'user_proxy = 질문하는 대리인', '<code>max_turns=1</code> = 질문 → 답'],
            notes: '<p>▶ 실행. 실제 AutoGen 의 UserProxyAgent + AssistantAgent 구조의 축소판이라고 설명.</p>' },
          { layout: 'diagram', title: '사람이 끼어드는 자리', html: FIG_HUMAN, caption: 'human_input_mode: NEVER · ALWAYS · TERMINATE',
            notes: '<p>💬 “자동 메일 분류기라면? 계약서 검토라면?” → NEVER / TERMINATE. 브라우저 예제는 전부 NEVER. 13차시 안전(사람 승인)과 연결.</p>' },
          { layout: 'diagram', title: '실제 AutoGen: 코드 실행 왕복', html: FIG_PROXY, caption: 'AssistantAgent 가 쓰고 UserProxyAgent 가 실행한다',
            notes: '<p>6차시 Self-Correction 이 대화로 구현된 것. Colab 노트북 10 에서 실제로 코드가 실행되는 것을 보여 줍니다(use_docker=False).</p><p>AG2 vs autogen-agentchat 0.4 두 갈래가 있다는 점을 한 줄로.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>“코드를 보냈을 때” 를 고르는 학생이 있으면 — 종료는 오직 종료 표시 또는 max_turns.</p>' },
          { layout: 'practice', title: '실습 10-1. 종료 조건 바꾸기', desc: '<p>리뷰어가 “승인” 이라는 말로 대화를 끝내도록 <code>is_termination_msg</code> 를 바꾸세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
# TODO: is_termination_msg=lambda m: '승인' in m
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다.', llm=llm)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print('메시지 수:', len(result.chat_history))`, solution: `import agentlab as al

llm = al.LLM()
coder = al.ConversableAgent('코더', system_message='너는 파이썬 개발자다.', llm=llm)
reviewer = al.ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 문제가 없으면 "승인합니다" 라고 말해라.',
                               llm=llm, is_termination_msg=lambda m: '승인' in m)
result = reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)
print('메시지 수:', len(result.chat_history))`,
            notes: '<p>⏱ 7분. is_termination_msg 는 “발언한 쪽” 의 함수가 검사된다는 점(리뷰어가 말했으니 리뷰어의 조건)을 확인.</p>' },
          { layout: 'summary', title: '정리', bullets: ['AutoGen = <b>메시지 교환</b>으로 협업 (CrewAI 는 작업 파이프라인)', '<code>ConversableAgent(name, system_message, llm)</code> · <code>a.initiate_chat(b, message, max_turns)</code>', '멈추는 법: TERMINATE · <code>is_termination_msg</code> · <code>max_turns</code>(안전장치)', '<code>ChatResult.chat_history</code> · <code>summary</code>', '<code>human_input_mode</code>: NEVER · ALWAYS · TERMINATE', '다음 교시: 3~4명의 그룹 채팅과 발언자 선택'],
            notes: '<p>⏱ 정리 5분. 출구 질문: “종료 조건이 없을 때 대화를 멈추는 것은?” → max_turns.</p>' }
        ]
      },
      {
        id: 'ag10-2',
        title: 'GroupChat: 다자간 회의와 프레임워크 선택',
        minutes: 50,
        goals: ['GroupChat · GroupChatManager 로 3~4인 회의를 만든다', 'round_robin 과 auto 발언자 선택을 비교한다', '종료 조건을 커스터마이징하고 회의록을 출력한다', 'LangGraph · CrewAI · AutoGen 을 비교해 상황에 맞게 고른다'],
        flow: [['그룹 채팅 구조', 8], ['round_robin 회의 (코드)', 12], ['종료 조건 · auto 선택', 12], ['이벤트 패턴 · 프레임워크 비교', 10], ['실습 · 퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '2자 대화를 넘어 셋 이상이 참여하면 새로운 문제가 생깁니다. <b>다음에 누가 말할까?</b> 모두가 같은 기록을 보고 있을까? 언제 회의를 끝낼까? AutoGen 의 <b>GroupChat</b> 과 <b>GroupChatManager</b> 가 이 세 가지를 맡습니다. 이 교시에서는 기획자 · 개발자 · 마케터 · 비평가가 참여하는 제품 기획 회의를 만들어 봅니다.' },
          { type: 'h', text: '그룹 채팅의 구조' },
          { type: 'p', html: '<b>GroupChat</b> 은 참여 에이전트 목록, 모두가 공유하는 메시지 기록(<code>messages</code>), 최대 라운드 수(<code>max_round</code>), 발언자 선택 방식(<code>speaker_selection_method</code>)을 담는 “회의실” 입니다. <b>GroupChatManager</b> 는 “사회자” 로, 라운드마다 ① 다음 발언자를 고르고 ② 그 에이전트에게 지금까지의 기록을 보여 주어 답을 받고 ③ 답을 기록에 추가한 뒤 종료 조건과 max_round 를 검사합니다.' },
          { type: 'figure', html: FIG_GROUP, caption: '그림 10-5. 그룹 채팅. 매니저가 발언자 선택 → 공유 기록 추가 → 종료 검사를 반복합니다. 모든 에이전트가 같은 기록을 보기 때문에 “개발자가 한 말에 마케터가 반응” 할 수 있습니다.' },
          { type: 'callout', kind: 'info', title: '그룹 채팅 예제는 대사를 미리 정해 둡니다', html: '모의 LLM 은 키워드 규칙으로만 답하므로 셋 이상이 회의하는 흐름을 흉내 내지 못합니다. 그래서 이 교시의 예제는 에이전트마다 <code>al.LLM(mock_responses=[...])</code> 로 <b>키가 없을 때 할 말</b>을 정해 둡니다. 🔑 키를 넣으면 <code>mock_responses</code> 는 무시되고 실제 모델이 역할에 맞게 즉석에서 말합니다. 우리가 배우는 것은 대사가 아니라 <b>회의가 돌아가는 구조</b>(발언자 선택 · 공유 기록 · 종료)입니다.' },
          { type: 'code', title: '예제 10-5. 기획자 · 개발자 · 마케터 round_robin 회의 + 회의록', code: `import agentlab as al

planner = al.ConversableAgent('기획자', system_message='너는 서비스 기획자다.',
    llm=al.LLM(mock_responses=['핵심 기능 제안: ① 학교·학년별 교과서 검색 ② 책 상태 사진 등록 ③ 교내 직거래 약속 잡기. 이름 후보는 "책갈피"와 "북스왑"입니다.']))
dev = al.ConversableAgent('개발자', system_message='너는 앱 개발자다.',
    llm=al.LLM(mock_responses=['세 기능 모두 2주 안에 MVP 로 만들 수 있습니다. 검색은 학교 → 학년 → 과목 3단계 필터로 단순하게, 사진은 3장까지로 제한하겠습니다.']))
marketer = al.ConversableAgent('마케터', system_message='너는 마케터다.',
    llm=al.LLM(mock_responses=['이름은 "북스왑"을 추천합니다. "교환" 느낌이 살고 검색도 쉽습니다. 개강 2주 전에 학교 커뮤니티에 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.']))

gc = al.GroupChat(agents=[planner, dev, marketer], max_round=3)          # 기본: round_robin
manager = al.GroupChatManager(gc, llm=al.LLM())
messages = manager.run('중고 교과서 거래 앱의 이름과 핵심 기능을 정하자')
print()
print('=== 회의록 ===')
for who, text in messages:
    print(f'- {who}: {text[:40]}…')`,
            expect: `
매니저: 중고 교과서 거래 앱의 이름과 핵심 기능을 정하자

기획자: 핵심 기능 제안: ① 학교·학년별 교과서 검색 ② 책 상태 사진 등록 ③ 교내 직거래 약속 잡기. 이름 후보는 "책갈피"와 "북스왑"입니다.

개발자: 세 기능 모두 2주 안에 MVP 로 만들 수 있습니다. 검색은 학교 → 학년 → 과목 3단계 필터로 단순하게, 사진은 3장까지로 제한하겠습니다.

마케터: 이름은 "북스왑"을 추천합니다. "교환" 느낌이 살고 검색도 쉽습니다. 개강 2주 전에 학교 커뮤니티에 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.

=== 회의록 ===
- 매니저: 중고 교과서 거래 앱의 이름과 핵심 기능을 정하자…
- 기획자: 핵심 기능 제안: ① 학교·학년별 교과서 검색 ② 책 상태 사진 등록 ③…
- 개발자: 세 기능 모두 2주 안에 MVP 로 만들 수 있습니다. 검색은 학교 → …
- 마케터: 이름은 "북스왑"을 추천합니다. "교환" 느낌이 살고 검색도 쉽습니다. …`,
            desc: '매니저가 주제를 던지고, 기획자 → 개발자 → 마케터 순서(round_robin)로 한 번씩 말한 뒤 <code>max_round=3</code> 에서 끝났습니다. <code>run()</code> 이 돌려주는 <code>messages</code> 는 <code>[(이름, 내용), …]</code> 이므로 그대로 회의록이 됩니다. 각 에이전트는 답할 때 <b>지금까지의 모든 발언</b>을 봅니다 — 그래서 실제 모델은 “개발자가 말한 3단계 필터” 에 마케터가 반응할 수 있습니다.' },
          { type: 'h', text: '회의를 끝내는 사람: 비평가와 종료 조건' },
          { type: 'p', html: '위 회의는 <code>max_round</code> 로 끝났습니다. 더 좋은 설계는 <b>끝낼 권한을 가진 역할</b>을 두는 것입니다. 비평가에게 “문제가 없으면 승인하고 TERMINATE 라고 말해라” 를 맡기면, 비평가가 승인하는 순간 회의가 끝나고 그 전에는 계속됩니다. 2자 대화와 마찬가지로 발언한 에이전트의 <code>is_termination_msg</code> 가 검사됩니다.' },
          { type: 'code', title: '예제 10-6. 비평가가 TERMINATE 로 회의를 끝낸다', code: `import agentlab as al

def agent(name, role, lines):
    """역할과 (키가 없을 때의) 대사 목록으로 ConversableAgent 를 만든다"""
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '서비스 기획자', ['핵심 기능 3가지: 교과서 검색 · 상태 사진 · 교내 직거래. 이름 후보: "북스왑".',
                                      '정리합니다: 이름 북스왑, MVP 기능 3개, 개강 2주 전 출시. 비평가님, 빠진 위험이 있을까요?'])
dev = agent('개발자', '앱 개발자', ['세 기능 모두 2주 안에 MVP 가능합니다. 사진은 3장까지로 제한하겠습니다.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 학교 커뮤니티에 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.'])
critic = agent('비평가', '꼼꼼한 비평가', ['위험 두 가지: ① 교내 직거래 안전 → 학교 이메일 인증 필수 ② "북스왑" 상표 검색 필요. 반영하면 승인합니다. TERMINATE'])

gc = al.GroupChat(agents=[planner, dev, marketer, critic], max_round=8)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('중고 교과서 거래 앱 기획 회의를 시작합니다. 이름과 핵심 기능을 정하세요.')
print()
print(f'발언 {len(messages) - 1}회 만에 종료 (max_round=8)')`,
            expect: `
매니저: 중고 교과서 거래 앱 기획 회의를 시작합니다. 이름과 핵심 기능을 정하세요.

기획자: 핵심 기능 3가지: 교과서 검색 · 상태 사진 · 교내 직거래. 이름 후보: "북스왑".

개발자: 세 기능 모두 2주 안에 MVP 가능합니다. 사진은 3장까지로 제한하겠습니다.

마케터: 개강 2주 전 학교 커뮤니티에 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.

비평가: 위험 두 가지: ① 교내 직거래 안전 → 학교 이메일 인증 필수 ② "북스왑" 상표 검색 필요. 반영하면 승인합니다. TERMINATE

발언 4회 만에 종료 (max_round=8)`,
            desc: '<code>max_round=8</code> 이지만 네 번째 발언(비평가)에 TERMINATE 가 있어 거기서 멈췄습니다. 기획자에게 대사를 두 개 주었지만 두 번째는 쓰이지 않았습니다 — 회의가 더 길어졌다면(비평가가 승인하지 않았다면) 기획자의 두 번째 차례에 나왔을 것입니다. 9차시 편집자처럼 <b>검토자가 끝낼 권한을 갖는 구조</b>가 대화형에서도 그대로 통합니다.' },
          { type: 'p', html: '종료 표시가 꼭 TERMINATE 일 필요는 없습니다. <code>is_termination_msg</code> 에 “이 메시지로 끝낼까?” 를 판단하는 함수를 주면 됩니다. 같은 비평가에게 기본 조건과 맞춤 조건을 각각 적용해 발언 수를 비교해 봅시다.' },
          { type: 'code', title: '예제 10-7. 종료 조건 커스터마이징 — is_termination_msg', code: `import agentlab as al

def agent(name, role, lines, **kw):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines), **kw)

def meeting(critic):
    planner = agent('기획자', '서비스 기획자', ['이름 후보: "북스왑". 핵심 기능 3가지를 제안합니다.', '정리: 이름 북스왑, 기능 3개. 비평가님 의견은?'])
    dev = agent('개발자', '앱 개발자', ['2주 안에 MVP 가능합니다.', '학교 이메일 인증을 추가하겠습니다.'])
    gc = al.GroupChat(agents=[planner, dev, critic], max_round=6)
    return al.GroupChatManager(gc, llm=al.LLM()).run('기획 회의를 시작합니다.', silent=True)

line = '위험 요소: 교내 직거래 안전. 학교 이메일 인증을 넣으면 됩니다. 회의 종료'
default_critic = agent('비평가', '비평가', [line])                                            # 기본: TERMINATE 포함 여부
custom_critic = agent('비평가', '비평가', [line], is_termination_msg=lambda m: '회의 종료' in m)   # 맞춤 조건

print('기본 종료 조건(TERMINATE 포함 여부):', len(meeting(default_critic)) - 1, '회 발언')
print('맞춤 종료 조건("회의 종료" 포함 여부):', len(meeting(custom_critic)) - 1, '회 발언')`,
            expect: `기본 종료 조건(TERMINATE 포함 여부): 6 회 발언
맞춤 종료 조건("회의 종료" 포함 여부): 3 회 발언`,
            desc: '비평가의 말 “… 회의 종료” 에는 TERMINATE 가 없으므로 기본 조건으로는 멈추지 않고 <code>max_round=6</code> 을 다 썼습니다(대사가 반복됨). <code>is_termination_msg=lambda m: \'회의 종료\' in m</code> 을 주자 세 번째 발언에서 끝났습니다. 실무에서는 “최종 결정:” 으로 시작하는 메시지, JSON 에 <code>"done": true</code> 가 있는 메시지 등 상황에 맞는 조건을 씁니다.' },
          { type: 'h', text: '다음에 누가 말할까: round_robin vs auto' },
          { type: 'p', html: '지금까지는 정해진 순서(<code>round_robin</code>)로 돌았습니다. <code>speaker_selection_method=\'auto\'</code> 로 바꾸면 매니저의 LLM 이 <b>최근 대화를 읽고 다음 발언자를 고릅니다</b>. “기술 검토가 필요하다” 는 말이 나오면 개발자를, “위험이 있는지” 를 물으면 비평가를 부르는 식입니다. 유연한 대신 라운드마다 LLM 호출이 하나 더 들어갑니다(9차시 hierarchical 매니저와 같은 트레이드오프).' },
          { type: 'figure', html: FIG_SPEAKER, caption: '그림 10-6. round_robin 은 정해진 순서를 돌고(LLM 호출 없음), auto 는 매니저 LLM 이 대화 내용을 보고 적임자를 고릅니다(라운드마다 호출 1회 추가).' },
          { type: 'code', title: '예제 10-8. auto — 매니저 LLM 이 발언자를 고른다', code: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '서비스 기획자', ['정리하겠습니다: 이름 북스왑, 핵심 기능 3개, 개강 2주 전 출시.'])
dev = agent('개발자', '앱 개발자', ['검색 기능의 기술 검토가 먼저 필요합니다. 학교 코드 DB 가 있어야 합니다.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 출시면 7월 말까지 홍보 자료가 필요합니다.'])
critic = agent('비평가', '비평가', ['학교 코드 DB 확보 계획이 빠졌습니다. 그 부분을 먼저 정하세요.'])

# 키가 없을 때 매니저가 차례로 고를 이름. 키가 있으면 실제 모델이 대화를 읽고 고른다
manager_llm = al.LLM(mock_responses=['개발자', '비평가', '마케터', '기획자'])
gc = al.GroupChat(agents=[planner, dev, marketer, critic], max_round=4, speaker_selection_method='auto')
messages = al.GroupChatManager(gc, llm=manager_llm).run('출시 일정을 정합시다. 기술 검토가 필요한 사람이 먼저 말하세요.')
print()
print('발언 순서:', ' → '.join(who for who, _ in messages[1:]))`,
            expect: `
매니저: 출시 일정을 정합시다. 기술 검토가 필요한 사람이 먼저 말하세요.

개발자: 검색 기능의 기술 검토가 먼저 필요합니다. 학교 코드 DB 가 있어야 합니다.

비평가: 학교 코드 DB 확보 계획이 빠졌습니다. 그 부분을 먼저 정하세요.

마케터: 개강 2주 전 출시면 7월 말까지 홍보 자료가 필요합니다.

기획자: 정리하겠습니다: 이름 북스왑, 핵심 기능 3개, 개강 2주 전 출시.

발언 순서: 개발자 → 비평가 → 마케터 → 기획자`,
            desc: 'round_robin 이었다면 기획자 → 개발자 → 마케터 → 비평가 순서였을 것입니다. auto 에서는 매니저가 “기술 검토가 필요” 라는 주제를 보고 개발자를 먼저 불렀고, 개발자의 “DB 가 있어야” 에 비평가가 이어 말했습니다(모의 LLM 은 대본대로, 실제 모델은 대화를 읽고 판단). 매니저는 “다음에 말할 사람 이름만 답해라” 라는 프롬프트와 최근 대화 4개를 받습니다.' },
          { type: 'table', head: ['방식', '발언 순서', 'LLM 호출', '장점', '단점 · 주의'], rows: [
            ['<code>round_robin</code>', '목록 순서를 반복', '없음', '예측 가능, 모두 한 번씩 말함', '맥락에 맞지 않는 사람이 말할 수 있음'],
            ['<code>auto</code>', '매니저 LLM 이 선택', '라운드마다 +1', '맥락에 맞는 전문가가 말함', '같은 사람만 반복 선택될 수 있음 → 실제 AutoGen 은 allow_repeat_speaker 로 제어'],
            ['<code>random</code> (실제 AutoGen)', '무작위', '없음', '브레인스토밍', '재현 불가'],
            ['<code>manual</code> (실제 AutoGen)', '사람이 고름', '없음', '수업 · 디버깅', '자동화 불가']
          ], caption: '발언자 선택 방식 비교' },
          { type: 'h', text: '이벤트 기반 대화 패턴 — AutoGen 의 강점' },
          { type: 'p', html: '그룹 채팅을 한 걸음 물러서서 보면, <b>메시지가 곧 이벤트</b>입니다. 누군가 “기술 검토가 필요하다” 고 말하면 그 메시지가 공유 기록에 쌓이고, 관심 있는 에이전트(개발자)가 반응해 새 메시지를 만들고, 그것이 또 다른 반응을 부릅니다. 순서를 미리 짜지 않아도 대화가 스스로 흘러갑니다. Microsoft 의 새 AutoGen(0.4+)은 이 생각을 끝까지 밀어, 에이전트들이 <b>비동기</b>로 메시지를 구독 · 발행하는 이벤트 런타임 위에 그룹 채팅을 올렸습니다. 여러 에이전트가 동시에 반응하거나, 다른 프로세스 · 다른 언어로 만든 에이전트가 같은 대화에 참여하는 것도 가능합니다.' },
          { type: 'figure', html: FIG_EVENT, caption: '그림 10-7. 이벤트 기반 패턴. 메시지가 버스에 올라오면 관심 있는 에이전트가 반응합니다. 다자간 · 비동기 협업이 AutoGen 이 가장 잘하는 일입니다.' },
          { type: 'code', title: '실제 AutoGen 그룹 채팅 — Colab 에서 실행 (AG2)', run: false, code: `import os
from autogen import ConversableAgent, UserProxyAgent, GroupChat, GroupChatManager

llm_config = {'config_list': [{'model': 'gemini-2.5-flash', 'api_type': 'google',
                               'api_key': os.environ['GEMINI_API_KEY']}]}

def agent(name, role):
    return ConversableAgent(name, system_message=f'너는 {role}다. 두세 문장으로 짧게 말한다.',
                            llm_config=llm_config, human_input_mode='NEVER')

planner = agent('planner', '서비스 기획자')
dev = agent('developer', '앱 개발자')
marketer = agent('marketer', '마케터')
critic = ConversableAgent('critic', llm_config=llm_config, human_input_mode='NEVER',
                          system_message='너는 비평가다. 위험 요소를 지적하고, 모두 해결되면 승인하며 TERMINATE 라고 말해라.',
                          is_termination_msg=lambda m: 'TERMINATE' in (m.get('content') or ''))
user_proxy = UserProxyAgent('user_proxy', human_input_mode='NEVER', code_execution_config=False,
                            is_termination_msg=lambda m: 'TERMINATE' in (m.get('content') or ''))

gc = GroupChat(agents=[user_proxy, planner, dev, marketer, critic], messages=[],
               max_round=10, speaker_selection_method='auto', allow_repeat_speaker=False)
manager = GroupChatManager(groupchat=gc, llm_config=llm_config)
user_proxy.initiate_chat(manager, message='중고 교과서 거래 앱의 이름과 핵심 기능을 정하자')
for m in gc.messages:
    print(m['name'], ':', m['content'][:60])`,
            desc: '실제 AutoGen 에서는 매니저도 대화 상대이므로 <code>user_proxy.initiate_chat(manager, …)</code> 로 회의를 시작합니다. <code>allow_repeat_speaker=False</code> 는 같은 사람이 연달아 말하지 않게 합니다. 회의가 끝나면 <code>gc.messages</code> 가 회의록입니다.' },
          { type: 'callout', kind: 'more', title: 'Microsoft autogen-agentchat 0.4+ 는 이렇게 씁니다', html: '<p>새 API 는 비동기(async)이고 팀 · 종료 조건이 객체입니다. Colab 셀에서는 <code>await</code> 를 바로 쓸 수 있습니다.</p><pre><code>from autogen_agentchat.agents import AssistantAgent\nfrom autogen_agentchat.teams import RoundRobinGroupChat   # SelectorGroupChat = auto\nfrom autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination\nfrom autogen_ext.models.openai import OpenAIChatCompletionClient\n\nmodel = OpenAIChatCompletionClient(model=\'gpt-4o-mini\')\nplanner = AssistantAgent(\'planner\', model_client=model, system_message=\'너는 기획자다.\')\ncritic = AssistantAgent(\'critic\', model_client=model, system_message=\'너는 비평가다. 승인하면 TERMINATE\')\nteam = RoundRobinGroupChat([planner, critic],\n                           termination_condition=TextMentionTermination(\'TERMINATE\') | MaxMessageTermination(10))\nresult = await team.run(task=\'신제품 이름을 정하자\')\nfor m in result.messages:\n    print(m.source, \':\', m.content)</code></pre><p>종료 조건을 <code>|</code> 로 합치는 것(TERMINATE 또는 메시지 10개)이 이 교시의 <code>is_termination_msg</code> + <code>max_round</code> 와 같은 뜻입니다.</p>' },
          { type: 'h', text: '세 프레임워크, 언제 무엇을 쓰나' },
          { type: 'p', html: 'Part 3 에서 LangGraph(8차시) · CrewAI(9차시) · AutoGen(10차시)을 차례로 배웠습니다. 셋 다 “여러 단계로 일하는 LLM 프로그램” 을 만들지만 <b>생각하는 단위</b>가 다릅니다. LangGraph 는 <b>그래프</b>(상태 · 노드 · 조건 분기), CrewAI 는 <b>역할 팀</b>(role · task · 파이프라인), AutoGen 은 <b>대화</b>(메시지 · 종료 조건 · 발언자)입니다.' },
          { type: 'figure', html: FIG_COMPARE, caption: '그림 10-8. 세 프레임워크의 생각 단위. 흐름 통제가 중요하면 LangGraph, 역할이 뚜렷한 콘텐츠 생산이면 CrewAI, 순서를 미리 정할 수 없는 토론 · 코드 실행 왕복이면 AutoGen.' },
          { type: 'table', head: ['', 'LangGraph', 'CrewAI', 'AutoGen'], rows: [
            ['생각 단위', '상태 그래프 (노드 · 엣지 · 조건)', '역할 팀 (Agent · Task · Crew)', '대화 (메시지 · 종료 조건 · 발언자)'],
            ['흐름 제어', '개발자가 그래프로 완전히 통제', '작업 순서 또는 매니저 배정', '상대의 답에 따라 — 종료 조건으로 제어'],
            ['강점', '분기 · 루프 · 상태 추적 · 사람 승인 지점', '빠른 팀 구성 · 역할 · 결과물 계약', '다자간 토론 · 코드 실행 왕복 · 비동기 · 사람 참여'],
            ['약점', '설계 비용 · 코드량', '복잡한 분기 표현이 어려움', '예측 어려움 · 종료 설계 필수 · 토큰 낭비 위험'],
            ['어울리는 일', '고객 지원 워크플로, 검증 루프가 있는 단일 에이전트', '보고서 · 마케팅 콘텐츠 · 조사 → 작성 → 검토', '코드 생성 · 실행 · 수정, 아이디어 토론, 사람이 끼는 회의'],
            ['이 강좌의 프로젝트', '11차시 비서 에이전트의 흐름 제어', '12차시 마케팅 자동화 팀', '(선택) 12차시 비평가 회의 확장'],
            ['함께 쓰기', 'LangGraph 노드 안에서 CrewAI 크루 호출', 'Crew 를 그래프 노드로', 'AutoGen 에이전트를 그래프 노드 · 크루 멤버로']
          ], caption: '세 프레임워크 비교 — 셋은 경쟁보다 보완 관계이며, 섞어 쓰는 일도 흔합니다' },
          { type: 'callout', kind: 'tip', title: '고르는 순서', html: '① 에이전트 하나로 되는가? → 4차시 <code>Agent</code> 로 끝. ② 흐름이 복잡하고 통제가 중요한가(분기 · 루프 · 승인)? → LangGraph. ③ 단계와 역할이 뚜렷한 생산 작업인가? → CrewAI. ④ 몇 번 오갈지 모르고 토론 · 수정 왕복 · 사람 참여가 핵심인가? → AutoGen. 그리고 어느 쪽이든 <b>종료 조건과 호출 수 상한</b>을 먼저 정합니다.' },
          { type: 'callout', kind: 'tip', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>그룹 채팅 예제가 “대본(mock_responses)” 이라는 점을 수업 초반에 솔직히 말하고, 실제 키로 예제 10-6 을 한 번 돌려 실제 모델이 즉석에서 말하는 것을 보여 주면 설득력이 큽니다(30초~1분).</li><li>예제 10-7 의 “기본 조건에서는 6회 발언” 이 왜 6인지(max_round=6, TERMINATE 없음, 대사 반복) 미리 확인해 두세요.</li><li>프레임워크 비교표는 11~12차시 프로젝트 선택의 근거가 됩니다. 표를 인쇄해 나눠 주거나 노트에 옮기게 합니다.</li><li>Colab 노트북 10: AG2 설치 1~2분. 코드 실행 왕복 셀은 실제로 파일(coding/)을 만들므로 보안 질문이 나올 수 있습니다 — 13차시 안전에서 다룬다고 예고.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '오개념 지도 팁', teacher: true, html: '<ul><li><b>“auto 가 항상 더 좋다”</b> → 호출이 늘고 같은 사람만 뽑히는 문제가 있습니다. round_robin 으로 시작해 필요할 때만 auto.</li><li><b>“max_round 가 종료 조건이다”</b> → 안전장치일 뿐입니다. 설계된 종료는 is_termination_msg(누가 어떤 말로 끝내는가).</li><li><b>“AutoGen 은 CrewAI 의 상위 호환”</b> → 생각 단위가 다를 뿐, 단계가 정해진 일은 CrewAI 가 더 간단하고 쌉니다.</li><li><b>“모의 LLM 대본 = 가짜 수업”</b> → 대본은 구조를 보기 위한 장치. 구조(발언자 선택 · 공유 기록 · 종료)는 실제와 같습니다.</li></ul>' },
          { type: 'callout', kind: 'info', title: '실습 10-3 · 10-4 평가 루브릭', teacher: true, html: '<table><tr><th>항목</th><th>3점</th><th>2점</th><th>1점</th></tr><tr><td>역할 추가</td><td>새 역할의 system_message 와 대사가 역할에 맞고 다른 역할과 겹치지 않음</td><td>추가했으나 대사가 역할과 무관</td><td>추가 실패</td></tr><tr><td>종료 조건</td><td>is_termination_msg 로 맞춤 조건을 만들고 발언 수 차이를 설명</td><td>조건은 바꿨으나 설명 못 함</td><td>max_round 만 조정</td></tr><tr><td>구조 이해</td><td>발언 순서 · 공유 기록 · 종료의 세 역할을 로그로 짚음</td><td>일부만</td><td>실행만</td></tr></table><p>확장 활동: 실제 키로 예제 10-8 을 auto 로 돌려, 매니저가 고른 발언 순서가 대본과 어떻게 다른지 비교 발표. “왜 그 사람을 골랐을까?” 를 대화 기록에서 근거 찾기.</p>' }
        ],
        practice: [
          { title: '실습 10-3. 그룹 채팅에 디자이너 추가하기', level: 2,
            desc: '<p>예제 10-6 의 회의에 <b>디자이너</b> 역할을 추가하세요. 조건: ① <code>agent(\'디자이너\', \'UI 디자이너\', [...])</code> 로 만들고 대사는 “첫 화면은 검색창 하나만 두고, 책 상태는 사진 위에 배지로 표시하겠습니다.” ② 참여 순서는 기획자 → 개발자 → 디자이너 → 마케터 → 비평가 ③ <code>max_round=8</code>, 비평가가 TERMINATE 로 끝냄 ④ 마지막에 발언 순서와 발언 수를 출력.</p>',
            hint: '<code>agents=[planner, dev, designer, marketer, critic]</code>. 발언 순서는 <code>\' → \'.join(who for who, _ in messages[1:])</code>.',
            starter: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '서비스 기획자', ['핵심 기능 3가지: 교과서 검색 · 상태 사진 · 교내 직거래. 이름 후보: "북스왑".'])
dev = agent('개발자', '앱 개발자', ['세 기능 모두 2주 안에 MVP 가능합니다.'])
# TODO: designer 추가
marketer = agent('마케터', '마케터', ['개강 2주 전 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.'])
critic = agent('비평가', '비평가', ['학교 이메일 인증을 넣으면 승인합니다. TERMINATE'])

# TODO: agents 목록에 designer 를 넣고 max_round=8 로 회의 실행
gc = al.GroupChat(agents=[planner, dev, marketer, critic], max_round=8)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('중고 교과서 앱 기획 회의를 시작합니다.')
print()
# TODO: 발언 순서와 발언 수 출력
`,
            solution: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '서비스 기획자', ['핵심 기능 3가지: 교과서 검색 · 상태 사진 · 교내 직거래. 이름 후보: "북스왑".'])
dev = agent('개발자', '앱 개발자', ['세 기능 모두 2주 안에 MVP 가능합니다.'])
designer = agent('디자이너', 'UI 디자이너', ['첫 화면은 검색창 하나만 두고, 책 상태는 사진 위에 배지로 표시하겠습니다.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.'])
critic = agent('비평가', '비평가', ['학교 이메일 인증을 넣으면 승인합니다. TERMINATE'])

gc = al.GroupChat(agents=[planner, dev, designer, marketer, critic], max_round=8)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('중고 교과서 앱 기획 회의를 시작합니다.')
print()
print('발언 순서:', ' → '.join(who for who, _ in messages[1:]))
print('발언 수:', len(messages) - 1)
`,
            expect: `
매니저: 중고 교과서 앱 기획 회의를 시작합니다.

기획자: 핵심 기능 3가지: 교과서 검색 · 상태 사진 · 교내 직거래. 이름 후보: "북스왑".

개발자: 세 기능 모두 2주 안에 MVP 가능합니다.

디자이너: 첫 화면은 검색창 하나만 두고, 책 상태는 사진 위에 배지로 표시하겠습니다.

마케터: 개강 2주 전 "첫 거래 수수료 0원" 캠페인을 걸겠습니다.

비평가: 학교 이메일 인증을 넣으면 승인합니다. TERMINATE

발언 순서: 기획자 → 개발자 → 디자이너 → 마케터 → 비평가
발언 수: 5` },
          { title: '실습 10-4. (도전) 종료 조건을 “최종 결정” 으로 바꾸기', level: 3,
            desc: '<p>기획자 · 개발자 · 비평가 3인 회의를 만들되, 비평가는 TERMINATE 대신 <b>“최종 결정”</b> 이라는 말로 회의를 끝냅니다. 비평가에 <code>is_termination_msg=lambda m: \'최종 결정\' in m</code> 을 주고 <code>max_round=6</code> 으로 실행한 뒤, 발언 수를 <code>발언 수: N (max_round=6)</code> 형식으로 출력하세요. 비평가의 대사: “3주 전 코드 동결, 2주 전 출시로 진행합시다. 최종 결정”.</p>',
            hint: '<code>agent(..., is_termination_msg=...)</code> 가 되도록 <code>agent</code> 함수에 <code>**kw</code> 를 받아 넘기세요.',
            starter: `import agentlab as al

def agent(name, role, lines, **kw):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines), **kw)

planner = agent('기획자', '서비스 기획자', ['개강 2주 전 출시를 제안합니다.'])
dev = agent('개발자', '앱 개발자', ['2주 전이면 테스트 기간이 짧습니다. 3주 전 코드 동결을 조건으로 가능합니다.'])
# TODO: '최종 결정' 으로 끝내는 비평가 (is_termination_msg)
critic = None

# TODO: max_round=6 으로 회의 실행 후 '발언 수: N (max_round=6)' 출력
`,
            solution: `import agentlab as al

def agent(name, role, lines, **kw):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines), **kw)

planner = agent('기획자', '서비스 기획자', ['개강 2주 전 출시를 제안합니다.'])
dev = agent('개발자', '앱 개발자', ['2주 전이면 테스트 기간이 짧습니다. 3주 전 코드 동결을 조건으로 가능합니다.'])
critic = agent('비평가', '비평가', ['3주 전 코드 동결, 2주 전 출시로 진행합시다. 최종 결정'],
               is_termination_msg=lambda m: '최종 결정' in m)

gc = al.GroupChat(agents=[planner, dev, critic], max_round=6)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('출시 일정을 정합시다.')
print()
print(f'발언 수: {len(messages) - 1} (max_round=6)')
`,
            expect: `
매니저: 출시 일정을 정합시다.

기획자: 개강 2주 전 출시를 제안합니다.

개발자: 2주 전이면 테스트 기간이 짧습니다. 3주 전 코드 동결을 조건으로 가능합니다.

비평가: 3주 전 코드 동결, 2주 전 출시로 진행합시다. 최종 결정

발언 수: 3 (max_round=6)` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: 'GroupChat: 다자간 회의와 프레임워크 선택', subtitle: '다음에 누가 말할까 · 언제 끝낼까', notes: '<p>2교시. 셋 이상이 대화할 때 생기는 세 문제(발언자 · 공유 기록 · 종료)로 시작. 마지막에 Part 3 세 프레임워크를 비교하고 Part 4 프로젝트로 연결합니다.</p><p>⏱ 도입 3분</p>' },
          { layout: 'diagram', title: '그룹 채팅의 구조', html: FIG_GROUP, caption: '매니저: 발언자 선택 → 공유 기록 추가 → 종료 검사',
            notes: '<p>GroupChat = 회의실(참가자 · 기록 · 규칙), GroupChatManager = 사회자. “모두가 같은 기록을 본다” 가 2자 대화와의 차이.</p><p>이 교시 예제는 mock_responses 대본이라는 점을 여기서 말합니다.</p>' },
          { layout: 'code', title: 'round_robin 회의 + 회의록', code: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.',
                               llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '서비스 기획자', ['핵심 기능: 검색 · 상태 사진 · 교내 직거래. 이름 후보 "북스왑".'])
dev = agent('개발자', '앱 개발자', ['2주 안에 MVP 가능합니다. 사진은 3장까지.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 "수수료 0원" 캠페인을 걸겠습니다.'])

gc = al.GroupChat(agents=[planner, dev, marketer], max_round=3)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('앱 이름과 핵심 기능을 정하자')
print('--- 회의록 ---')
for who, text in messages:
    print(f'- {who}: {text[:30]}…')`, points: ['기획자 → 개발자 → 마케터 순서', '<code>max_round=3</code> 에서 종료', '<code>messages</code> = [(이름, 내용)] = 회의록'],
            notes: '<p>▶ 실행. mock_responses 는 “키 없을 때의 대사”. 키가 있으면 실제 모델이 즉석에서 말한다는 것을 강조(가능하면 실제로 시연).</p>' },
          { layout: 'code', title: '비평가가 회의를 끝낸다', code: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.',
                               llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '기획자', ['핵심 기능 3가지와 이름 후보 "북스왑"을 제안합니다.'])
dev = agent('개발자', '개발자', ['2주 안에 MVP 가능합니다.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 캠페인을 걸겠습니다.'])
critic = agent('비평가', '비평가', ['학교 이메일 인증을 넣으면 승인합니다. TERMINATE'])

gc = al.GroupChat(agents=[planner, dev, marketer, critic], max_round=8)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('기획 회의를 시작합니다.')
print('발언', len(messages) - 1, '회 만에 종료 (max_round=8)')`, points: ['끝낼 권한 = 비평가', 'TERMINATE 가 나오면 즉시 종료', 'max_round 는 안전장치'],
            notes: '<p>▶ 실행. 9차시 편집자와 같은 “검토자가 끝낸다” 구조. 💬 “비평가가 승인하지 않으면?” → 다시 기획자 차례, max_round 까지.</p>' },
          { layout: 'code', title: '종료 조건 커스터마이징', code: `import agentlab as al

def agent(name, role, lines, **kw):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.',
                               llm=al.LLM(mock_responses=lines), **kw)

def meeting(critic):
    planner = agent('기획자', '기획자', ['이름 후보 "북스왑".', '정리: 북스왑, 기능 3개.'])
    dev = agent('개발자', '개발자', ['MVP 가능.', '이메일 인증 추가.'])
    gc = al.GroupChat(agents=[planner, dev, critic], max_round=6)
    return al.GroupChatManager(gc, llm=al.LLM()).run('회의 시작', silent=True)

line = '이메일 인증을 넣으면 됩니다. 회의 종료'
print('기본:', len(meeting(agent('비평가', '비평가', [line]))) - 1, '회')
print('맞춤:', len(meeting(agent('비평가', '비평가', [line],
      is_termination_msg=lambda m: '회의 종료' in m))) - 1, '회')`, points: ['기본 = TERMINATE 포함 여부', '<code>is_termination_msg</code> 로 바꿈', '“회의 종료” → 3회에서 멈춤'],
            notes: '<p>▶ 실행. 기본 조건은 6회(max_round 소진), 맞춤은 3회. 실무 예: “최종 결정:” 접두어, JSON done 플래그.</p>' },
          { layout: 'diagram', title: 'round_robin vs auto', html: FIG_SPEAKER, caption: '정해진 순서 vs 매니저 LLM 이 맥락으로 선택',
            notes: '<p>9차시 hierarchical 매니저와 같은 트레이드오프: 유연 ↔ 호출 증가 · 예측 어려움. round_robin 으로 시작하는 것이 원칙.</p>' },
          { layout: 'code', title: 'auto — 매니저가 발언자를 고른다', code: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.',
                               llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '기획자', ['정리: 북스왑, 기능 3개, 개강 2주 전 출시.'])
dev = agent('개발자', '개발자', ['검색 기능의 기술 검토가 먼저 필요합니다.'])
marketer = agent('마케터', '마케터', ['7월 말까지 홍보 자료가 필요합니다.'])
critic = agent('비평가', '비평가', ['DB 확보 계획이 빠졌습니다.'])
manager_llm = al.LLM(mock_responses=['개발자', '비평가', '마케터', '기획자'])  # 키 없을 때의 선택
gc = al.GroupChat(agents=[planner, dev, marketer, critic], max_round=4,
                  speaker_selection_method='auto')
messages = al.GroupChatManager(gc, llm=manager_llm).run('기술 검토가 필요한 사람이 먼저 말하세요.')
print('순서:', ' → '.join(w for w, _ in messages[1:]))`, points: ['매니저 프롬프트: “다음에 말할 사람 이름만”', '라운드마다 매니저 호출 +1', '실제 모델은 대화를 읽고 고름'],
            notes: '<p>▶ 실행. round_robin 이면 기획자부터였을 순서가 개발자부터로 바뀜. 실제 키가 있으면 여기서 꼭 한 번 돌려 보세요.</p>' },
          { layout: 'diagram', title: '이벤트 기반 대화 패턴', html: FIG_EVENT, caption: '메시지 = 이벤트 · 관심 있는 에이전트가 반응 · 다자간 · 비동기',
            notes: '<p>AutoGen 0.4 의 핵심 아이디어. “순서를 미리 짜지 않는다” 가 LangGraph(그래프로 다 짠다)와의 대비. 다른 프로세스 · 언어의 에이전트도 참여 가능.</p>' },
          { layout: 'diagram', title: '세 프레임워크 비교', html: FIG_COMPARE, caption: '그래프로 제어 · 역할 팀의 파이프라인 · 대화로 협업',
            notes: '<p>Part 3 총정리. 💬 “고객 문의 자동 분류 → 답변 → 사람 승인” 은? → LangGraph. “매일 블로그 글 3편” → CrewAI. “코드 생성 → 실행 → 수정 반복” → AutoGen.</p>' },
          { layout: 'table', title: '언제 무엇을 쓰나', head: ['', 'LangGraph', 'CrewAI', 'AutoGen'], rows: [
            ['생각 단위', '상태 그래프', '역할 팀', '대화'],
            ['흐름 제어', '개발자가 완전 통제', '작업 순서 · 매니저', '종료 조건'],
            ['강점', '분기 · 루프 · 승인', '빠른 팀 · 결과물 계약', '토론 · 코드 왕복 · 비동기'],
            ['약점', '설계 비용', '복잡한 분기', '예측 어려움'],
            ['프로젝트', '11차시 비서', '12차시 마케팅 팀', '(선택) 비평가 회의']
          ], notes: '<p>고르는 순서(에이전트 하나 → LangGraph → CrewAI → AutoGen)와 “어느 쪽이든 종료 조건 · 호출 상한 먼저” 를 강조. 셋은 섞어 쓸 수 있음.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>auto 의 비용(호출 +1)과 모의 LLM 에서 대본이 필요한 이유를 함께 확인.</p>' },
          { layout: 'practice', title: '실습 10-3. 디자이너 추가', desc: '<p>예제 10-6 회의에 디자이너를 추가하고(기획자 → 개발자 → 디자이너 → 마케터 → 비평가), 발언 순서와 발언 수를 출력하세요.</p>',
            starter: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '기획자', ['핵심 기능 3가지. 이름 후보 "북스왑".'])
dev = agent('개발자', '개발자', ['2주 안에 MVP 가능합니다.'])
# TODO: designer = agent('디자이너', 'UI 디자이너', ['첫 화면은 검색창 하나만.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 캠페인.'])
critic = agent('비평가', '비평가', ['이메일 인증을 넣으면 승인합니다. TERMINATE'])
# TODO: agents 에 designer 추가, max_round=8, 발언 순서 · 발언 수 출력`, solution: `import agentlab as al

def agent(name, role, lines):
    return al.ConversableAgent(name, system_message=f'너는 {role}다.', llm=al.LLM(mock_responses=lines))

planner = agent('기획자', '기획자', ['핵심 기능 3가지. 이름 후보 "북스왑".'])
dev = agent('개발자', '개발자', ['2주 안에 MVP 가능합니다.'])
designer = agent('디자이너', 'UI 디자이너', ['첫 화면은 검색창 하나만.'])
marketer = agent('마케터', '마케터', ['개강 2주 전 캠페인.'])
critic = agent('비평가', '비평가', ['이메일 인증을 넣으면 승인합니다. TERMINATE'])
gc = al.GroupChat(agents=[planner, dev, designer, marketer, critic], max_round=8)
messages = al.GroupChatManager(gc, llm=al.LLM()).run('기획 회의를 시작합니다.', silent=True)
print('순서:', ' → '.join(w for w, _ in messages[1:]))
print('발언 수:', len(messages) - 1)`,
            notes: '<p>⏱ 8분. 빨리 끝낸 학생은 실습 10-4(종료 조건 “최종 결정”)로. 루브릭은 교사용 본문.</p>' },
          { layout: 'summary', title: '정리', bullets: ['<code>GroupChat(agents, max_round, speaker_selection_method)</code> + <code>GroupChatManager(gc, llm).run()</code>', '매니저: 발언자 선택 → 공유 기록 → 종료 검사', '<code>round_robin</code>(기본 · 호출 없음) vs <code>auto</code>(맥락 선택 · 호출 +1)', '종료: 검토자의 TERMINATE · <code>is_termination_msg</code> · <code>max_round</code>(안전장치)', 'LangGraph = 그래프 제어 · CrewAI = 역할 팀 · AutoGen = 대화', '다음 차시: Part 4 프로젝트 ① 날씨 · 검색 비서 에이전트'],
            notes: '<p>⏱ 정리 5분. Part 3 끝. 다음 차시부터 프로젝트: 11차시는 4~8차시의 도구 · 메모리 · LangGraph 를 모아 비서 에이전트, 12차시는 9차시 CrewAI 로 마케팅 팀. Colab 노트북 10 은 과제.</p>' }
        ]
      }
    ]
  });
})();
