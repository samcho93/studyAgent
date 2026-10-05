/* 04차시 도구 활용: Tool Calling / Function Calling */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* LLM 혼자서는 못 하는 것 */
  const FIG_LIMIT = `<svg viewBox="0 0 700 290" role="img" aria-label="LLM 혼자서는 계산, 현재 시각, 실시간 정보를 모르고 그럴듯하게 지어내며, 도구를 붙이면 해결된다는 그림">
  ${ARROW('m04a1')}
  <rect x="15" y="15" width="320" height="260" rx="14" class="p4s"/>
  <text x="175" y="45" text-anchor="middle" class="tx-b">🧠 LLM 혼자 (학습 데이터 + 확률)</text>
  <text x="35" y="85" class="tx">“1234 × 5678 은?”</text><text x="35" y="105" class="tx-m">→ “7,006,452 입니다” (그럴듯한 오답)</text>
  <text x="35" y="140" class="tx">“지금 몇 시야?”</text><text x="35" y="160" class="tx-m">→ 알 수 없음 (시계가 없다)</text>
  <text x="35" y="195" class="tx">“서울 날씨 어때?”</text><text x="35" y="215" class="tx-m">→ 학습 시점의 기억으로 지어냄</text>
  <text x="35" y="250" class="tx-m">“내 파일에 저장해” → 손이 없다</text>
  <rect x="365" y="15" width="320" height="260" rx="14" class="p2s"/>
  <text x="525" y="45" text-anchor="middle" class="tx-b">🧠 + 🔧 LLM + 도구</text>
  <rect x="385" y="65" width="130" height="36" rx="8" class="p1"/><text x="450" y="88" text-anchor="middle" class="tx-w">calculator</text>
  <text x="530" y="88" class="tx-m">→ 7,006,652 (정확)</text>
  <rect x="385" y="115" width="130" height="36" rx="8" class="p1"/><text x="450" y="138" text-anchor="middle" class="tx-w">now</text>
  <text x="530" y="138" class="tx-m">→ 2026-10-05 09:30</text>
  <rect x="385" y="165" width="130" height="36" rx="8" class="p1"/><text x="450" y="188" text-anchor="middle" class="tx-w">get_weather</text>
  <text x="530" y="188" class="tx-m">→ 실시간 API 결과</text>
  <rect x="385" y="215" width="130" height="36" rx="8" class="p1"/><text x="450" y="238" text-anchor="middle" class="tx-w">write_file</text>
  <text x="530" y="238" class="tx-m">→ 실제로 저장</text>
  <text x="525" y="268" text-anchor="middle" class="tx-m">LLM 은 “무엇을 할지” 판단, 실행은 도구가</text>
</svg>`;

  /* 함수 호출의 흐름 */
  const FIG_FLOW = `<svg viewBox="0 0 720 330" role="img" aria-label="사용자 질문이 LLM 에 가면 LLM 은 도구 호출 요청 JSON 만 돌려주고, 우리 코드가 함수를 실행해 결과를 다시 LLM 에 주면 최종 답을 만드는 다섯 단계 흐름">
  ${ARROW('m04a2')}
  <rect x="15" y="40" width="130" height="60" rx="12" class="p1s"/><text x="80" y="66" text-anchor="middle" class="tx-b">① 사용자</text><text x="80" y="86" text-anchor="middle" class="tx-m">“1500 × 0.15 는?”</text>
  <rect x="200" y="30" width="150" height="80" rx="12" class="p1"/><text x="275" y="60" text-anchor="middle" class="tx-w">② LLM</text><text x="275" y="82" text-anchor="middle" class="tx-w">“calculator 를</text><text x="275" y="100" text-anchor="middle" class="tx-w">불러 주세요”</text>
  <rect x="400" y="20" width="305" height="100" rx="12" class="card-bg"/>
  <text x="552" y="45" text-anchor="middle" class="tx-b">도구 호출 요청 (JSON) — 실행 안 함!</text>
  <text x="415" y="70" class="tx-m">{"name": "calculator",</text>
  <text x="415" y="90" class="tx-m">  "args": {"expression": "1500 * 0.15"}}</text>
  <text x="415" y="110" class="tx-m">r.tool_calls = [ToolCall(calculator, …)]</text>
  <rect x="400" y="160" width="305" height="70" rx="12" class="p3"/><text x="552" y="188" text-anchor="middle" class="tx-w">③ 우리 코드: 함수 실행</text><text x="552" y="212" text-anchor="middle" class="tx-w">calculator.call(args) → {"result": 225}</text>
  <rect x="200" y="160" width="150" height="70" rx="12" class="p1"/><text x="275" y="188" text-anchor="middle" class="tx-w">④ LLM</text><text x="275" y="212" text-anchor="middle" class="tx-w">결과를 읽고 답 작성</text>
  <rect x="15" y="165" width="130" height="60" rx="12" class="p5s"/><text x="80" y="191" text-anchor="middle" class="tx-b">⑤ 최종 답</text><text x="80" y="211" text-anchor="middle" class="tx-m">“225 입니다”</text>
  <line x1="147" y1="70" x2="196" y2="70" class="ln" stroke-width="2" marker-end="url(#m04a2)"/>
  <line x1="352" y1="70" x2="396" y2="70" class="ln" stroke-width="2" marker-end="url(#m04a2)"/>
  <line x1="552" y1="122" x2="552" y2="156" class="ln" stroke-width="2" marker-end="url(#m04a2)"/>
  <line x1="398" y1="195" x2="354" y2="195" class="ln" stroke-width="2" marker-end="url(#m04a2)"/>
  <line x1="198" y1="195" x2="149" y2="195" class="ln" stroke-width="2" marker-end="url(#m04a2)"/>
  <text x="375" y="215" text-anchor="end" class="tx-m">role: tool</text>
  <text x="80" y="140" text-anchor="middle" class="tx-m">messages 누적</text>
  <text x="360" y="285" text-anchor="middle" class="tx-b">LLM 은 “요청”만 한다 · 실행은 언제나 우리 코드가 한다</text>
  <text x="360" y="310" text-anchor="middle" class="tx-m">②~④ 가 여러 번 반복될 수 있다 (도구 연쇄) — 이 반복이 에이전트 루프</text>
</svg>`;

  /* 함수 → 스키마 */
  const FIG_SCHEMA = `<svg viewBox="0 0 720 300" role="img" aria-label="파이썬 함수의 이름, docstring, 타입 힌트가 @al.tool 을 거쳐 LLM 에 보내는 JSON 스키마의 name, description, parameters 가 되는 그림">
  ${ARROW('m04a3')}
  <rect x="15" y="20" width="300" height="260" rx="14" class="card-bg"/>
  <text x="165" y="48" text-anchor="middle" class="tx-b">파이썬 함수</text>
  <text x="30" y="80" class="tx-m">@al.tool</text>
  <text x="30" y="102" class="tx">def <tspan class="tx-b">add</tspan>(a: <tspan class="tx-b">int</tspan>, b: <tspan class="tx-b">int</tspan>) -&gt; int:</text>
  <text x="50" y="126" class="tx">"""<tspan class="tx-b">두 수를 더한다</tspan></text>
  <text x="50" y="150" class="tx">a: <tspan class="tx-b">첫 수</tspan></text>
  <text x="50" y="172" class="tx">b: <tspan class="tx-b">둘째 수</tspan>"""</text>
  <text x="50" y="196" class="tx">return a + b</text>
  <text x="30" y="240" class="tx-m">이름 · 설명 · 매개변수 설명 · 타입을</text>
  <text x="30" y="260" class="tx-m">코드에서 자동으로 읽어 냅니다</text>
  <rect x="330" y="130" width="60" height="40" rx="8" class="p2"/><text x="360" y="155" text-anchor="middle" class="tx-w">변환</text>
  <line x1="317" y1="150" x2="328" y2="150" class="ln" stroke-width="2"/>
  <line x1="392" y1="150" x2="402" y2="150" class="ln" stroke-width="2" marker-end="url(#m04a3)"/>
  <rect x="405" y="20" width="300" height="260" rx="14" class="p2s"/>
  <text x="555" y="48" text-anchor="middle" class="tx-b">LLM 에 보내는 스키마 (JSON)</text>
  <text x="420" y="80" class="tx">{"name": "<tspan class="tx-b">add</tspan>",</text>
  <text x="420" y="104" class="tx">"description": "<tspan class="tx-b">두 수를 더한다</tspan>",</text>
  <text x="420" y="128" class="tx">"parameters": {"type": "object",</text>
  <text x="440" y="152" class="tx">"properties": {</text>
  <text x="460" y="176" class="tx">"a": {"type": "<tspan class="tx-b">integer</tspan>", "description": "<tspan class="tx-b">첫 수</tspan>"},</text>
  <text x="460" y="200" class="tx">"b": {"type": "<tspan class="tx-b">integer</tspan>", "description": "<tspan class="tx-b">둘째 수</tspan>"}},</text>
  <text x="440" y="224" class="tx">"required": ["a", "b"]}}</text>
  <text x="420" y="262" class="tx-m">LLM 은 이 설명만 보고 “언제 · 어떻게” 부를지 정합니다</text>
</svg>`;

  /* 도구 설계 4원칙 */
  const FIG_DESIGN = `<svg viewBox="0 0 720 250" role="img" aria-label="좋은 설명문, 입력 검증, 오류는 값으로, 하나의 도구는 하나의 일 — 도구 설계 네 가지 원칙 카드">
  <rect x="10" y="15" width="167" height="220" rx="14" class="p1s"/>
  <text x="93" y="45" text-anchor="middle" class="tx-b">📝 설명문</text>
  <text x="93" y="75" text-anchor="middle" class="tx-m">무엇을 · 언제 쓰는지</text>
  <text x="93" y="95" text-anchor="middle" class="tx-m">동사로 시작</text>
  <text x="93" y="115" text-anchor="middle" class="tx-m">매개변수 단위 · 예시</text>
  <text x="93" y="160" text-anchor="middle" class="tx">“섭씨를 화씨로</text>
  <text x="93" y="180" text-anchor="middle" class="tx">변환 계산한다”</text>
  <text x="93" y="215" text-anchor="middle" class="tx-m">→ 호출 정확도 결정</text>
  <rect x="187" y="15" width="167" height="220" rx="14" class="p2s"/>
  <text x="270" y="45" text-anchor="middle" class="tx-b">✅ 입력 검증</text>
  <text x="270" y="75" text-anchor="middle" class="tx-m">LLM 은 "25" 처럼</text>
  <text x="270" y="95" text-anchor="middle" class="tx-m">문자열로 줄 때가 있다</text>
  <text x="270" y="160" text-anchor="middle" class="tx">float(x)</text>
  <text x="270" y="180" text-anchor="middle" class="tx">범위 · 허용값 확인</text>
  <text x="270" y="215" text-anchor="middle" class="tx-m">→ 엉뚱한 실행 방지</text>
  <rect x="364" y="15" width="167" height="220" rx="14" class="p3s"/>
  <text x="447" y="45" text-anchor="middle" class="tx-b">🧯 오류는 값으로</text>
  <text x="447" y="75" text-anchor="middle" class="tx-m">예외를 던지면</text>
  <text x="447" y="95" text-anchor="middle" class="tx-m">루프 전체가 죽는다</text>
  <text x="447" y="160" text-anchor="middle" class="tx">return {'error': …}</text>
  <text x="447" y="180" text-anchor="middle" class="tx">LLM 이 읽고 대처</text>
  <text x="447" y="215" text-anchor="middle" class="tx-m">→ 재시도 · 사과 · 우회</text>
  <rect x="541" y="15" width="167" height="220" rx="14" class="p5s"/>
  <text x="624" y="45" text-anchor="middle" class="tx-b">🎯 하나의 일</text>
  <text x="624" y="75" text-anchor="middle" class="tx-m">도구 하나 = 기능 하나</text>
  <text x="624" y="95" text-anchor="middle" class="tx-m">“만능 도구” 금지</text>
  <text x="624" y="160" text-anchor="middle" class="tx">get_weather(city)</text>
  <text x="624" y="180" text-anchor="middle" class="tx">calculator(expr)</text>
  <text x="624" y="215" text-anchor="middle" class="tx-m">→ 선택이 쉬워진다</text>
</svg>`;

  /* 여러 도구 중 선택 */
  const FIG_SELECT = `<svg viewBox="0 0 720 280" role="img" aria-label="질문의 의도에 따라 LLM 이 날씨, 계산, 위키, 시간 도구 중 하나를 설명문을 보고 고르는 그림">
  ${ARROW('m04a4')}
  <rect x="15" y="30" width="170" height="44" rx="10" class="p1s"/><text x="100" y="57" text-anchor="middle" class="tx">“부산 날씨 알려줘”</text>
  <rect x="15" y="90" width="170" height="44" rx="10" class="p1s"/><text x="100" y="117" text-anchor="middle" class="tx">“250 × 4 계산해줘”</text>
  <rect x="15" y="150" width="170" height="44" rx="10" class="p1s"/><text x="100" y="177" text-anchor="middle" class="tx">“파이썬 검색해줘”</text>
  <rect x="15" y="210" width="170" height="44" rx="10" class="p1s"/><text x="100" y="237" text-anchor="middle" class="tx">“지금 몇 시야?”</text>
  <rect x="270" y="90" width="150" height="100" rx="14" class="p1"/><text x="345" y="125" text-anchor="middle" class="tx-w">LLM</text><text x="345" y="150" text-anchor="middle" class="tx-w">설명문을 읽고</text><text x="345" y="170" text-anchor="middle" class="tx-w">하나를 고른다</text>
  <rect x="520" y="30" width="185" height="44" rx="10" class="p2s"/><text x="612" y="50" text-anchor="middle" class="tx-b">get_weather(city)</text><text x="612" y="67" text-anchor="middle" class="tx-m">도시의 현재 날씨를 알려준다</text>
  <rect x="520" y="90" width="185" height="44" rx="10" class="p3s"/><text x="612" y="110" text-anchor="middle" class="tx-b">calculator(expression)</text><text x="612" y="127" text-anchor="middle" class="tx-m">수식을 계산한다</text>
  <rect x="520" y="150" width="185" height="44" rx="10" class="p4s"/><text x="612" y="170" text-anchor="middle" class="tx-b">wiki_search(query)</text><text x="612" y="187" text-anchor="middle" class="tx-m">위키백과에서 검색한다</text>
  <rect x="520" y="210" width="185" height="44" rx="10" class="p5s"/><text x="612" y="230" text-anchor="middle" class="tx-b">now()</text><text x="612" y="247" text-anchor="middle" class="tx-m">현재 날짜와 시각</text>
  <line x1="187" y1="52" x2="266" y2="110" class="ln" stroke-width="1.5" marker-end="url(#m04a4)"/>
  <line x1="187" y1="112" x2="266" y2="130" class="ln" stroke-width="1.5" marker-end="url(#m04a4)"/>
  <line x1="187" y1="172" x2="266" y2="150" class="ln" stroke-width="1.5" marker-end="url(#m04a4)"/>
  <line x1="187" y1="232" x2="266" y2="170" class="ln" stroke-width="1.5" marker-end="url(#m04a4)"/>
  <line x1="422" y1="110" x2="516" y2="52" class="ln" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#m04a4)"/>
  <line x1="422" y1="130" x2="516" y2="112" class="ln" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#m04a4)"/>
  <line x1="422" y1="150" x2="516" y2="172" class="ln" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#m04a4)"/>
  <line x1="422" y1="170" x2="516" y2="232" class="ln" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#m04a4)"/>
  <text x="360" y="272" text-anchor="middle" class="tx-m">도구가 많아질수록 “설명문의 구별력”이 중요해집니다 (비슷한 설명 = 잘못 고름)</text>
</svg>`;

  /* 위험한 도구와 확인 단계 */
  const FIG_GATE = `<svg viewBox="0 0 720 230" role="img" aria-label="LLM 의 도구 호출 요청이 안전한 도구면 바로 실행되고, 위험한 도구면 사람 승인 단계를 거쳐야 실행되는 그림">
  ${ARROW('m04a5')}
  <rect x="15" y="80" width="130" height="70" rx="12" class="p1"/><text x="80" y="110" text-anchor="middle" class="tx-w">LLM</text><text x="80" y="132" text-anchor="middle" class="tx-w">도구 호출 요청</text>
  <rect x="210" y="80" width="150" height="70" rx="12" class="p3"/><text x="285" y="110" text-anchor="middle" class="tx-w">🚦 실행 게이트</text><text x="285" y="132" text-anchor="middle" class="tx-w">위험 목록 확인</text>
  <rect x="440" y="20" width="260" height="60" rx="12" class="p2s"/><text x="570" y="45" text-anchor="middle" class="tx-b">안전한 도구 → 바로 실행</text><text x="570" y="66" text-anchor="middle" class="tx-m">calculator · get_weather · read_file</text>
  <rect x="440" y="110" width="260" height="100" rx="12" class="p4s"/><text x="570" y="135" text-anchor="middle" class="tx-b">위험한 도구 → 👤 사람 승인 후 실행</text><text x="570" y="158" text-anchor="middle" class="tx-m">delete_file · send_email · pay</text><text x="570" y="178" text-anchor="middle" class="tx-m">승인 없음 → {'error': '승인 필요'}</text><text x="570" y="198" text-anchor="middle" class="tx-m">되돌릴 수 없는 행동은 사람이 결정</text>
  <line x1="147" y1="115" x2="206" y2="115" class="ln" stroke-width="2" marker-end="url(#m04a5)"/>
  <line x1="362" y1="100" x2="436" y2="55" class="ln" stroke-width="2" marker-end="url(#m04a5)"/>
  <line x1="362" y1="130" x2="436" y2="160" class="ln" stroke-width="2" marker-end="url(#m04a5)"/>
</svg>`;

  /* ReAct 텍스트 형식 vs 함수 호출 */
  const FIG_REACT = `<svg viewBox="0 0 720 320" role="img" aria-label="함수 호출 API 는 구조화된 JSON 으로 도구를 요청하고, ReAct 는 Thought, Action, Action Input, Observation 텍스트 형식으로 같은 일을 하는 비교 그림">
  ${ARROW('m04a6')}
  <rect x="15" y="15" width="335" height="290" rx="14" class="p2s"/>
  <text x="182" y="45" text-anchor="middle" class="tx-b">🔧 함수 호출 API (Tool Calling)</text>
  <text x="35" y="80" class="tx-m">응답의 별도 필드로 구조화되어 옴</text>
  <rect x="35" y="95" width="295" height="70" rx="8" class="card-bg"/>
  <text x="50" y="118" class="tx">tool_calls: [{"name": "calculator",</text>
  <text x="50" y="140" class="tx">  "args": {"expression": "12 * 12"}}]</text>
  <text x="35" y="195" class="tx-m">✔ 파싱 불필요 · 인자 타입 보장</text>
  <text x="35" y="217" class="tx-m">✔ 여러 도구 동시 호출 가능</text>
  <text x="35" y="239" class="tx-m">✘ 공급자가 지원해야 함 (형식도 제각각)</text>
  <text x="35" y="275" class="tx-m">GPT · Gemini · Claude · Llama 3 계열 지원</text>
  <rect x="370" y="15" width="335" height="290" rx="14" class="p3s"/>
  <text x="537" y="45" text-anchor="middle" class="tx-b">📝 ReAct 텍스트 형식 (2022)</text>
  <text x="390" y="80" class="tx-m">보통 텍스트 답 안에 약속된 줄을 씀</text>
  <rect x="390" y="95" width="295" height="112" rx="8" class="card-bg"/>
  <text x="405" y="118" class="tx">Thought: 계산이 필요하다</text>
  <text x="405" y="140" class="tx">Action: calculator</text>
  <text x="405" y="162" class="tx">Action Input: {"expression": "12 * 12"}</text>
  <text x="405" y="184" class="tx">Observation: {"result": 144}  ← 코드가 채움</text>
  <text x="390" y="235" class="tx-m">✔ 어떤 모델이든 동작 (로컬 소형 모델도)</text>
  <text x="390" y="257" class="tx-m">✘ 정규식 파싱 · 형식 어기면 실패</text>
  <text x="390" y="279" class="tx-m">원리 학습용 · 프레임워크 내부 구현에 남아 있음</text>
</svg>`;

  const QUIZ1 = [
    { q: '함수 호출(Function Calling)에서 LLM 이 실제로 하는 일은?', options: ['함수를 직접 실행하고 결과를 돌려준다', '어떤 함수를 어떤 인자로 부를지 <b>요청(JSON)</b>만 돌려준다', '함수의 소스 코드를 작성한다', '함수를 서버에 배포한다'], answer: 1,
      explain: 'LLM 은 텍스트(또는 구조화된 JSON)를 생성할 뿐 코드를 실행하지 못합니다. 실행은 언제나 우리 코드(에이전트 루프)가 하고, 결과를 <code>role: tool</code> 메시지로 돌려줍니다.' },
    { q: '<code>@al.tool</code> 이 LLM 에 보내는 스키마의 <code>description</code> 은 어디에서 가져오는가?', options: ['함수 이름', '함수의 docstring 첫 문단', '함수의 return 값', '함수의 타입 힌트'], answer: 1,
      explain: 'docstring 첫 문단이 설명(description), “인자: 설명” 줄이 매개변수 설명, 타입 힌트가 매개변수 타입이 됩니다.' },
    { q: '도구 결과를 LLM 에 돌려줄 때 메시지의 <code>role</code> 은?', options: ['system', 'user', 'assistant', 'tool'], answer: 3,
      explain: '<code>tool_result(call.id, name, content)</code> 가 만드는 메시지는 <code>role: tool</code> 이며, 어느 호출 요청에 대한 결과인지 <code>tool_call_id</code> 로 연결됩니다.' },
    { q: '다음 중 LLM 이 <b>도구 없이</b> 답하면 가장 위험한(틀릴 가능성이 큰) 질문은?', options: ['“파이썬에서 리스트를 뒤집는 방법은?”', '“지금 몇 시야?”', '“AI 에이전트가 뭐야?”', '“안녕!”'], answer: 1,
      explain: 'LLM 에는 시계가 없습니다. 현재 시각 · 실시간 날씨 · 정확한 큰 수 계산 · 내 파일의 내용은 도구 없이는 알 수 없고, 그럴듯하게 지어낼 위험이 있습니다.' }
  ];
  const QUIZ2 = [
    { q: '도구 함수 안에서 0 으로 나누기 같은 문제가 생겼을 때 권장되는 처리는?', options: ['<code>raise</code> 로 예외를 던져 프로그램을 멈춘다', '<code>return {\'error\': \'0으로 나눌 수 없습니다\'}</code> 처럼 값으로 돌려준다', '<code>print()</code> 로 출력만 하고 None 을 돌려준다', '아무것도 하지 않는다'], answer: 1,
      explain: '오류를 값(dict)으로 돌려주면 에이전트 루프가 멈추지 않고 LLM 이 오류를 읽어 사과하거나 다른 방법을 시도할 수 있습니다. <code>Tool.call()</code> 은 잡히지 않은 예외도 자동으로 <code>{\'error\': …}</code> 로 바꿔 줍니다.' },
    { q: '도구가 4개 있을 때 LLM 이 올바른 도구를 고르는 데 가장 큰 영향을 주는 것은?', options: ['함수의 줄 수', '함수 이름과 설명문(docstring)의 구별력', '함수가 정의된 순서', 'return 타입'], answer: 1,
      explain: 'LLM 은 스키마의 이름과 설명만 보고 고릅니다. 비슷한 설명의 도구가 여럿이면 잘못 고르기 쉽습니다.' },
    { q: 'LLM 이 <code>{"km": "42"}</code> 처럼 숫자를 문자열로 넘겼다. 도구 함수가 해야 할 일은?', options: ['LLM 을 다시 학습시킨다', '<code>float(km)</code> 으로 변환하는 등 입력을 검증 · 정규화한다', '오류 없이 문자열을 그대로 곱한다', '도구를 삭제한다'], answer: 1,
      explain: 'LLM 의 인자는 항상 깨끗하지 않습니다. 도구 안에서 타입 변환과 범위 확인을 하는 것이 설계 원칙 ② 입력 검증입니다.' },
    { q: '파일 삭제 · 결제 · 메일 발송처럼 되돌릴 수 없는 도구에 권장되는 안전장치는?', options: ['시스템 프롬프트에 “조심해라”라고 쓴다', '코드 수준의 승인 게이트(사람 확인) 를 둔다', 'LLM 의 temperature 를 0 으로 한다', '도구 이름을 숨긴다'], answer: 1,
      explain: '프롬프트는 “부탁”일 뿐입니다. 되돌릴 수 없는 행동은 코드에서 승인 여부를 확인하는 게이트(human-in-the-loop)로 막아야 합니다.' }
  ];
  const QUIZ3 = [
    { q: 'ReAct 형식에서 <b>우리 코드</b>가 채워 넣는 줄은?', options: ['Thought:', 'Action:', 'Action Input:', 'Observation:'], answer: 3,
      explain: 'Thought · Action · Action Input 은 LLM 이 쓰고, 도구를 실행한 결과인 Observation 은 코드가 붙여 다시 LLM 에 보냅니다.' },
    { q: '함수 호출 API 대신 ReAct 텍스트 형식을 쓰는 가장 큰 이유는?', options: ['항상 더 정확해서', '함수 호출을 지원하지 않는 모델에서도 동작하므로', '토큰을 덜 써서', '파싱이 필요 없어서'], answer: 1,
      explain: 'ReAct 는 보통 텍스트만 생성할 수 있으면 어떤 모델이든 동작합니다. 대신 정규식 파싱이 필요하고 형식을 어기면 실패합니다.' },
    { q: '<code>ReActAgent</code> 가 루프를 끝내는 신호는?', options: ['“Observation:” 줄이 나오면', '“Final Answer:” 줄이 나오면', '도구를 한 번 호출하면', '토큰이 다 떨어지면'], answer: 1,
      explain: 'LLM 이 “Final Answer:” 를 쓰면 그 뒤 내용을 최종 답으로 돌려주고 루프를 끝냅니다. 그 전까지는 Action → Observation 을 반복합니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag04',
    no: '04',
    title: '도구 활용: Tool Calling / Function Calling',
    subtitle: '함수 호출의 흐름 · @al.tool 스키마 · 도구 설계 원칙 · ReAct',
    summary: 'LLM 은 계산기도 시계도 인터넷도 없습니다. <b>도구(tool)</b>는 LLM 에게 손발을 달아 주는 장치입니다. LLM 이 “어떤 함수를 어떤 인자로 불러 달라”고 <b>JSON 으로 요청</b>하면 우리 코드가 실행해 결과를 돌려주는 <b>함수 호출(Function Calling)</b>의 흐름을 손으로 돌려 보고, 파이썬 함수를 <code>@al.tool</code> 로 도구로 만드는 법, 좋은 도구를 설계하는 원칙, 그리고 함수 호출 API 가 없는 모델에서도 쓰는 <b>ReAct</b> 텍스트 방식을 배웁니다.',
    goals: [
      'LLM 이 혼자서는 못 하는 일(계산 · 현재 시각 · 실시간 정보 · 파일)을 예로 들어 도구의 필요성을 설명할 수 있다',
      '함수 호출의 5단계 흐름(질문 → 호출 요청 JSON → 실행 → 결과 전달 → 최종 답)을 코드로 직접 구현할 수 있다',
      '<code>@al.tool</code> 로 파이썬 함수를 도구로 만들고, docstring · 타입 힌트가 스키마가 되는 원리를 설명할 수 있다',
      '설명문 · 입력 검증 · 오류 값 반환 · 승인 게이트 등 도구 설계 원칙을 적용해 나만의 도구를 만들 수 있다',
      'ReAct 텍스트 형식과 함수 호출 API 의 차이를 비교할 수 있다'
    ],
    sections: [
      {
        id: 'ag04-1',
        title: '왜 도구인가 · 함수 호출의 흐름',
        minutes: 50,
        goals: ['LLM 의 한계(환각 · 현재 정보 없음)를 실험으로 확인한다', '함수 호출의 5단계 흐름을 그림과 코드로 설명한다', '@al.tool 로 함수를 도구로 만들고 스키마를 읽는다'],
        flow: [['도입 · LLM 의 한계', 8], ['함수 호출의 흐름', 12], ['@al.tool 과 스키마', 12], ['손으로 돌리는 호출 루프', 12], ['퀴즈 · 정리', 6]],
        content: [
          { type: 'p', html: '03차시에서 페르소나로 LLM 의 “말투와 태도”를 정했습니다. 그런데 아무리 훌륭한 분석가 페르소나를 주어도 LLM 은 <b>오늘 날씨</b>를 모르고, <b>지금 몇 시</b>인지 모르며, 큰 수의 곱셈을 <b>그럴듯하게 틀립니다</b>. 머리는 좋지만 손발이 없기 때문입니다. 이번 차시는 에이전트의 두 번째 핵심 요소, <b>도구(tool)</b> 입니다.' },
          { type: 'h', text: 'LLM 혼자서는 못 하는 것들' },
          { type: 'p', html: 'LLM 은 학습 데이터에서 배운 확률로 “다음 단어”를 만드는 기계입니다. 계산기 · 시계 · 인터넷 · 파일 시스템이 없으므로 다음과 같은 질문에는 <b>모른다고 하거나, 더 나쁘게는 그럴듯하게 지어냅니다(환각, hallucination)</b>.' },
          { type: 'figure', html: FIG_LIMIT, caption: '그림 4-1. LLM 혼자서는 계산 · 현재 시각 · 실시간 정보 · 파일 저장을 할 수 없습니다. 도구를 붙이면 “무엇을 할지”는 LLM 이, “실행”은 도구가 맡습니다.' },
          { type: 'code', title: '예제 4-1. 그럴듯하게 틀리는 LLM', code: `import agentlab as al

# 키가 없을 때 모의 LLM 이 돌려줄 "그럴듯한" 답을 미리 정해 둡니다 (실제 모델이 흔히 하는 실수 재현)
llm = al.LLM(mock_responses=['1234 × 5678 = 7,006,452 입니다.',
                             '지금은 오후 3시 20분입니다.',
                             '서울은 현재 맑고 기온은 22도입니다.'])
for q in ['1234 * 5678 은?', '지금 몇 시야?', '서울 날씨 어때?']:
    print('👤', q)
    print('🤖', llm.ask(q))

print('--- 파이썬으로 확인 ---')
print('1234 * 5678 =', 1234 * 5678, '→ LLM 의 답과 다릅니다!')
print('현재 시각과 날씨는 LLM 에게 시계도 인터넷도 없으니 알 수 없습니다.')`,
            expect: `👤 1234 * 5678 은?
🤖 1234 × 5678 = 7,006,452 입니다.
👤 지금 몇 시야?
🤖 지금은 오후 3시 20분입니다.
👤 서울 날씨 어때?
🤖 서울은 현재 맑고 기온은 22도입니다.
--- 파이썬으로 확인 ---
1234 * 5678 = 7006652 → LLM 의 답과 다릅니다!
현재 시각과 날씨는 LLM 에게 시계도 인터넷도 없으니 알 수 없습니다.`,
            desc: '<code>mock_responses</code> 는 키가 없을 때 모의 LLM 이 차례로 돌려줄 답입니다. 🔑 실제 모델은 요즘 곱셈은 곧잘 맞히지만, 자릿수가 커지면 여전히 틀리고 <b>현재 시각과 날씨는 절대 알 수 없습니다</b>. 답이 자신만만하다고 믿으면 안 되는 이유입니다.' },
          { type: 'p', html: '해결책은 간단합니다. <b>계산은 계산기에게, 시각은 시계에게, 날씨는 API 에게</b> 맡기고 LLM 은 “어떤 도구를 어떤 인자로 쓸지” 판단만 하게 하는 것입니다. 이것이 <b>함수 호출(Function Calling)</b>, 다른 말로 <b>도구 호출(Tool Calling)</b> 입니다.' },
          { type: 'h', text: '함수 호출의 흐름: LLM 은 요청만, 실행은 우리 코드가' },
          { type: 'p', html: '가장 중요한 사실 하나: <b>LLM 은 함수를 실행하지 않습니다.</b> “calculator 를 <code>{"expression": "1500 * 0.15"}</code> 인자로 불러 주세요”라는 <b>요청</b>을 JSON 으로 돌려줄 뿐입니다. 실행은 언제나 우리 파이썬 코드가 하고, 결과를 다시 LLM 에 넘겨 최종 답을 받습니다.' },
          { type: 'figure', html: FIG_FLOW, caption: '그림 4-2. 함수 호출의 5단계. ②~④ 가 여러 번 반복되면 도구 연쇄이고, 이 반복 구조가 곧 에이전트 루프입니다.' },
          { type: 'list', ordered: true, items: [
            '<b>사용자 질문</b>과 함께 <b>도구 목록(스키마)</b>을 LLM 에 보낸다: <code>llm.chat(messages, tools=[...])</code>',
            'LLM 이 답 대신 <b>도구 호출 요청</b>을 돌려준다: <code>r.tool_calls = [ToolCall(name, args)]</code>',
            '<b>우리 코드</b>가 그 이름의 함수를 인자로 실행한다: <code>result = tool.call(args)</code>',
            '결과를 <code>role: tool</code> 메시지로 붙여 다시 LLM 에 보낸다: <code>tool_result(call.id, name, result)</code>',
            'LLM 이 결과를 읽고 <b>최종 답</b>을 쓴다 (또는 다른 도구를 또 요청한다 → 반복)'
          ] },
          { type: 'callout', kind: 'info', title: '왜 LLM 에게 직접 실행시키지 않을까?', html: 'LLM 은 텍스트 생성기라 실행 능력이 없기도 하지만, 설령 가능하더라도 <b>우리 코드가 실행을 쥐고 있어야</b> 위험한 호출을 막고(승인 게이트), 로그를 남기고, 비용과 횟수를 제한할 수 있습니다. “판단은 LLM, 실행은 코드”가 에이전트 설계의 기본 원칙입니다.' },
          { type: 'h', text: '@al.tool: 파이썬 함수를 도구로' },
          { type: 'p', html: 'LLM 에게 도구를 알려 주려면 <b>이름 · 설명 · 매개변수</b>를 적은 JSON <b>스키마(schema)</b>가 필요합니다. 매번 손으로 쓰면 번거로우므로 <code>@al.tool</code> 데코레이터가 함수의 <b>이름, docstring, 타입 힌트</b>를 읽어 자동으로 만들어 줍니다. (LangChain 의 <code>@tool</code>, OpenAI SDK 의 <code>function_tool</code> 과 같은 역할)' },
          { type: 'figure', html: FIG_SCHEMA, caption: '그림 4-3. 함수의 이름 → name, docstring 첫 문단 → description, “a: 설명” 줄 → 매개변수 설명, 타입 힌트 → type. LLM 은 이 스키마만 보고 호출 여부와 인자를 정합니다.' },
          { type: 'code', title: '예제 4-2. 함수 하나를 도구로 만들고 스키마 확인하기', code: `import agentlab as al
import json

@al.tool
def add(a: int, b: int) -> int:
    """두 수를 더한다

    a: 첫 수
    b: 둘째 수
    """
    return a + b

print(type(add).__name__, '|', add)                 # Tool 객체가 됨
print('--- LLM 에 보내는 스키마 ---')
print(json.dumps(add.schema(), ensure_ascii=False, indent=2))
print('--- 세 가지 호출 방법 ---')
print('함수처럼       :', add(1, 2))
print('에이전트 방식  :', add.call({'a': 3, 'b': 4}))     # dict 인자 (LLM 이 주는 형태)
print('인자가 빠지면  :', add.call({'a': 3}))             # 예외 대신 error 값
print('한 줄 설명     :', add.describe())`,
            expect: `Tool | Tool(add)
--- LLM 에 보내는 스키마 ---
{
  "name": "add",
  "description": "두 수를 더한다",
  "parameters": {
    "type": "object",
    "properties": {
      "a": {
        "type": "integer",
        "description": "첫 수"
      },
      "b": {
        "type": "integer",
        "description": "둘째 수"
      }
    },
    "required": [
      "a",
      "b"
    ]
  }
}
--- 세 가지 호출 방법 ---
함수처럼       : 3
에이전트 방식  : 7
인자가 빠지면  : {'error': "인자 오류: add() missing 1 required positional argument: 'b'"}
한 줄 설명     : - add(a: integer, b: integer): 두 수를 더한다`,
            desc: 'docstring 의 첫 문단이 설명, 빈 줄 뒤의 “a: 첫 수” 줄이 매개변수 설명이 됩니다. <code>add.call({...})</code> 은 에이전트가 쓰는 호출 방식으로, 인자가 틀려도 예외 대신 <code>{\'error\': …}</code> 를 돌려주어 루프가 죽지 않습니다 (2교시 설계 원칙).' },
          { type: 'table', head: ['함수의 요소', '스키마의 어디로?', '비고'], rows: [
            ['함수 이름 <code>add</code>', '<code>name</code>', '영문 소문자 · 밑줄 권장 (공급자 제한)'],
            ['docstring 첫 문단', '<code>description</code>', 'LLM 이 “언제 쓸지” 판단하는 근거 — 가장 중요'],
            ['docstring 의 <code>a: 설명</code> 줄', '<code>parameters.properties.a.description</code>', '단위 · 예시 값을 적으면 정확도 상승'],
            ['타입 힌트 <code>int · float · str · bool · list · dict</code>', '<code>type</code>: integer · number · string · boolean · array · object', '힌트가 없으면 string'],
            ['기본값이 있는 매개변수', '<code>required</code> 에서 제외', '선택 인자']
          ], caption: '@al.tool 의 변환 규칙' },
          { type: 'h', text: '손으로 돌려 보는 함수 호출 루프' },
          { type: 'p', html: '이제 그림 4-2 의 다섯 단계를 코드로 한 줄씩 밟아 봅니다. 내장 도구 <code>al.calculator</code> 를 쓰고, 도구 결과 메시지는 <code>tool_result()</code> 로 만듭니다.' },
          { type: 'code', title: '예제 4-3. 함수 호출 5단계를 직접 구현하기', code: `import agentlab as al
from agentlab.llm import tool_result      # role: tool 메시지 만들기

llm = al.LLM()
messages = [al.system('당신은 계산 비서입니다.'), al.user('1500 * 0.15 는 얼마야?')]

# ① 질문 + 도구 목록을 보낸다
r = llm.chat(messages, tools=[al.calculator])
print('① 답 내용      :', repr(r.content))           # 비어 있음 — 답 대신
print('② 도구 호출 요청:', r.tool_calls)              # 호출 요청이 옴
call = r.tool_calls[0]
print('   이름:', call.name, '/ 인자:', call.args)

# ③ 우리 코드가 실행한다
result = al.calculator.call(call.args)
print('③ 실행 결과    :', result)

# ④ 요청과 결과를 대화 기록에 붙여 다시 보낸다
messages.append(r.message())                              # assistant (tool_calls 포함)
messages.append(tool_result(call.id, call.name, result))  # role: tool
print('④ 역할 순서    :', [m['role'] for m in messages])

# ⑤ 최종 답
r2 = llm.chat(messages, tools=[al.calculator])
print('⑤ 최종 답      :', r2.content)`,
            expect: `① 답 내용      : ''
② 도구 호출 요청: [ToolCall(calculator, {"expression": "1500 * 0.15"})]
   이름: calculator / 인자: {'expression': '1500 * 0.15'}
③ 실행 결과    : {'expression': '1500 * 0.15', 'result': 225}
④ 역할 순서    : ['system', 'user', 'assistant', 'tool']
⑤ 최종 답      : [계산 비서] 계산 결과는 225 입니다.`,
            desc: '②에서 <code>r.content</code> 가 비어 있고 <code>r.tool_calls</code> 에 요청이 들어 있는 것이 핵심입니다. 실제 모델도 같은 구조로 답합니다(내용이 조금 섞여 있을 수 있음). ④ 의 역할 순서 <code>assistant → tool</code> 은 모든 공급자가 요구하는 규칙입니다.' },
          { type: 'code', title: '예제 4-4. 같은 일을 Agent 한 줄로', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator], system='당신은 계산 비서입니다.', verbose=True)
answer = agent.run('1500 * 0.15 는 얼마야?')
print('답:', answer)
print('--- 밟은 단계 ---')
agent.trace()`,
            expect: `🔧 도구 호출 1: calculator({"expression": "1500 * 0.15"})
👁 관찰: {"expression": "1500 * 0.15", "result": 225}
✅ 최종 답: [계산 비서] 계산 결과는 225 입니다.
답: [계산 비서] 계산 결과는 225 입니다.
--- 밟은 단계 ---
 1. 🔧 calculator({"expression": "1500 * 0.15"})
 2. 👁 {"expression": "1500 * 0.15", "result": 225}
 3. ✅ [계산 비서] 계산 결과는 225 입니다.`,
            desc: '<code>al.Agent</code> 는 예제 4-3 의 ①~⑤ 를 <code>max_steps</code> 번까지 반복하는 루프를 감싼 것입니다. <code>verbose=True</code> 면 🔧 호출 → 👁 관찰 → ✅ 답 과정이 결과 창에 찍힙니다. 01차시의 에이전트 루프 그림이 바로 이 코드입니다.' },
          { type: 'h', text: '공급자마다 다른 스키마 형식 — agentlab 이 변환' },
          { type: 'p', html: '함수 호출의 개념은 같지만 공급자마다 <b>JSON 모양이 다릅니다</b>. OpenAI 는 <code>function</code>, Gemini 는 <code>functionDeclarations</code>, Anthropic 은 <code>input_schema</code> 라는 이름을 씁니다. <code>agentlab</code> 은 <code>Tool.schema()</code> 를 OpenAI 형식으로 만들고 <code>llm.py</code> 가 공급자에 맞게 바꿔 보내므로 우리는 한 가지만 알면 됩니다.' },
          { type: 'table', head: ['공급자', '요청에 넣는 모양', '응답에서 호출 요청이 오는 곳'], rows: [
            ['OpenAI · Groq · OpenRouter · Ollama', '<code>tools=[{"type":"function","function":{name, description, parameters}}]</code>', '<code>message.tool_calls[].function.arguments</code> (JSON <b>문자열</b>)'],
            ['Google Gemini', '<code>tools=[{"functionDeclarations":[{name, description, parameters}]}]</code>', '<code>parts[].functionCall{name, args}</code>'],
            ['Anthropic Claude', '<code>tools=[{name, description, <b>input_schema</b>}]</code>', '<code>content[].type == "tool_use"</code> → <code>{id, name, input}</code>'],
            ['agentlab (이 강좌)', '<code>Tool.schema()</code> → 위 셋으로 자동 변환', '항상 <code>r.tool_calls = [ToolCall(name, args)]</code>']
          ], caption: '공급자별 함수 호출 형식 비교. 개념은 하나, 포장지만 다릅니다.' },
          { type: 'code', title: '예제 4-5. 하나의 스키마가 세 가지 포장지로', code: `import agentlab as al
import json

@al.tool
def get_price(item: str) -> dict:
    """상품의 가격을 조회한다

    item: 상품 이름. 예: '노트북'
    """
    return {'item': item, 'price': 1200000}

s = get_price.schema()                       # agentlab 공통 형식 (OpenAI function 과 같음)
openai_style = {'type': 'function', 'function': s}
gemini_style = {'functionDeclarations': [s]}
anthropic_style = {'name': s['name'], 'description': s['description'], 'input_schema': s['parameters']}

for label, body in [('OpenAI', openai_style), ('Gemini', gemini_style), ('Anthropic', anthropic_style)]:
    print(f'--- {label} ---')
    print(json.dumps(body, ensure_ascii=False)[:120], '…')`,
            expect: `--- OpenAI ---
{"type": "function", "function": {"name": "get_price", "description": "상품의 가격을 조회한다", "parameters": {"type": "object", " …
--- Gemini ---
{"functionDeclarations": [{"name": "get_price", "description": "상품의 가격을 조회한다", "parameters": {"type": "object", "propert …
--- Anthropic ---
{"name": "get_price", "description": "상품의 가격을 조회한다", "input_schema": {"type": "object", "properties": {"item": {"type":  …`,
            desc: '같은 <code>name · description · parameters</code> 가 공급자별 키 이름으로 감싸질 뿐입니다. Colab 에서 각 SDK 의 원본 형식을 직접 보내 보면 이 표가 바로 이해됩니다.' },
          { type: 'callout', kind: 'more', title: '함수 호출의 짧은 역사', html: '2023년 6월 OpenAI 가 GPT 모델에 “function calling”을 추가하면서, 그전까지 프롬프트 텍스트를 정규식으로 파싱하던(3교시 ReAct) 방식 대신 <b>구조화된 JSON</b> 으로 도구를 요청하게 되었습니다. 이후 Gemini · Claude · 오픈소스 Llama 계열까지 같은 기능을 지원하며, 2024년의 <b>MCP(Model Context Protocol)</b> 는 도구 스키마와 호출 규약을 공급자 밖에서 표준화하려는 시도입니다.' }
        ],
        practice: [
          { title: '실습 4-1. 곱셈 도구 만들기', level: 1,
            desc: '<p><code>@al.tool</code> 로 두 수를 곱하는 <code>multiply(a, b)</code> 도구를 만드세요. docstring 첫 줄에 “두 수를 곱한 값을 계산한다”, 빈 줄 뒤에 매개변수 설명을 쓰고 <code>{\'result\': a * b}</code> 를 돌려줍니다. 스키마를 출력한 뒤 <code>al.Agent</code> 로 “7 곱하기 8 계산해줘”를 실행하세요.</p>',
            hint: '설명에 “계산”이라는 말이 들어가야 모의 LLM 이 계산 질문에 이 도구를 고릅니다. 실제 모델도 설명문으로 고릅니다.',
            starter: `import agentlab as al
import json

# TODO: @al.tool 로 multiply(a: int, b: int) 도구 만들기 — docstring: "두 수를 곱한 값을 계산한다"
def multiply(a: int, b: int) -> dict:
    return {'result': a * b}

llm = al.LLM()
# TODO: 스키마 출력 (json.dumps(multiply.schema(), ensure_ascii=False))
# TODO: Agent 로 '7 곱하기 8 계산해줘' 실행
`,
            solution: `import agentlab as al
import json

@al.tool
def multiply(a: int, b: int) -> dict:
    """두 수를 곱한 값을 계산한다

    a: 첫 수
    b: 둘째 수
    """
    return {'result': a * b}

llm = al.LLM()
print(json.dumps(multiply.schema(), ensure_ascii=False))
agent = al.Agent(llm, tools=[multiply], system='당신은 계산 비서입니다.', verbose=True)
print(agent.run('7 곱하기 8 계산해줘'))
`,
            expect: `{"name": "multiply", "description": "두 수를 곱한 값을 계산한다", "parameters": {"type": "object", "properties": {"a": {"type": "integer", "description": "첫 수"}, "b": {"type": "integer", "description": "둘째 수"}}, "required": ["a", "b"]}}
🔧 도구 호출 1: multiply({"a": 7, "b": 8})
👁 관찰: {"result": 56}
✅ 최종 답: [계산 비서] 계산 결과는 56 입니다.
[계산 비서] 계산 결과는 56 입니다.` },
          { title: '실습 4-2. 시계 도구로 5단계 손으로 돌리기', level: 2, nondeterministic: true,
            desc: '<p>예제 4-3 을 참고해 내장 도구 <code>al.now</code> 로 “지금 몇 시야?”에 답하는 5단계를 <b>Agent 없이</b> 직접 구현하세요. ② 호출 요청, ③ 실행 결과, ⑤ 최종 답을 출력합니다. (<code>now</code> 는 인자가 없으므로 <code>call.args</code> 는 빈 dict 입니다.)</p>',
            hint: '<code>r = llm.chat(messages, tools=[al.now])</code> → <code>al.now.call(call.args)</code> → <code>tool_result(call.id, call.name, result)</code>',
            starter: `import agentlab as al
from agentlab.llm import tool_result

llm = al.LLM()
messages = [al.system('당신은 비서입니다.'), al.user('지금 몇 시야?')]

# TODO ①② 질문 + 도구 목록 보내기 → r.tool_calls 확인
# TODO ③ 도구 실행
# TODO ④ r.message() 와 tool_result(...) 를 messages 에 추가
# TODO ⑤ 다시 chat 해서 최종 답 출력
`,
            solution: `import agentlab as al
from agentlab.llm import tool_result

llm = al.LLM()
messages = [al.system('당신은 비서입니다.'), al.user('지금 몇 시야?')]

r = llm.chat(messages, tools=[al.now])
call = r.tool_calls[0]
print('② 호출 요청:', call.name, call.args)
result = al.now.call(call.args)
print('③ 실행 결과:', result)
messages.append(r.message())
messages.append(tool_result(call.id, call.name, result))
r2 = llm.chat(messages, tools=[al.now])
print('⑤ 최종 답:', r2.content)
` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: '도구 활용: Tool Calling', subtitle: 'LLM 에게 손발 달아 주기', notes: '<p>4대 요소 칠판 그림에서 ②도구에 표시. <b>발문:</b> “ChatGPT 에게 ‘지금 몇 시야?’ 물으면 뭐라고 하나요?” → 모른다고 하거나 지어낸다. 왜? 시계가 없으니까.</p><p>⏱ 도입 8분</p>' },
          { layout: 'diagram', title: 'LLM 혼자서는 못 하는 것', html: FIG_LIMIT, caption: '머리는 좋지만 손발이 없다',
            notes: '<p>왼쪽의 네 가지(계산 · 시각 · 실시간 · 파일)를 하나씩 읽으며 “왜 못 하는가”를 학생에게 묻습니다. 환각(hallucination) 용어 소개: 모르면서 그럴듯하게 말하는 것.</p>' },
          { layout: 'code', title: '실험: 그럴듯하게 틀리는 LLM', code: `import agentlab as al

llm = al.LLM(mock_responses=['1234 × 5678 = 7,006,452 입니다.',
                             '지금은 오후 3시 20분입니다.'])
for q in ['1234 * 5678 은?', '지금 몇 시야?']:
    print('👤', q)
    print('🤖', llm.ask(q))

print('파이썬:', 1234 * 5678)`, points: ['자신만만하지만 틀렸다', '현재 시각은 알 길이 없다', '<code>mock_responses</code> = 키 없을 때 대본'],
            notes: '<p>▶ 실행. 교사 PC 에 키가 있다면 실제 모델에게 더 큰 수(예: 123456 × 654321)를 물어 틀리는 것을 보여 주면 효과적입니다.</p>' },
          { layout: 'diagram', title: '함수 호출의 5단계', html: FIG_FLOW, caption: 'LLM 은 요청만, 실행은 우리 코드가',
            notes: '<p>가장 중요한 슬라이드. 번호를 따라 손가락으로 짚으며 설명. <b>발문:</b> “③ 을 누가 하나요?” → 우리 코드. “LLM 이 함수를 실행하나요?” → 아니오. 이 오개념이 가장 흔합니다.</p>' },
          { layout: 'diagram', title: '함수 → 스키마: @al.tool', html: FIG_SCHEMA, caption: '이름 · docstring · 타입 힌트가 JSON 스키마가 된다',
            notes: '<p>왼쪽 함수의 굵은 글자가 오른쪽 어디로 가는지 선으로 이어 보게 합니다. “LLM 은 코드를 보지 못하고 이 스키마만 본다” → 2교시 설명문의 중요성으로 연결.</p>' },
          { layout: 'code', title: '도구 만들고 스키마 보기', code: `import agentlab as al
import json

@al.tool
def add(a: int, b: int) -> int:
    """두 수를 더한다

    a: 첫 수
    b: 둘째 수
    """
    return a + b

print(json.dumps(add.schema(), ensure_ascii=False, indent=1))
print(add(1, 2), add.call({'a': 3, 'b': 4}))
print(add.call({'a': 3}))          # 인자 빠짐 → error 값`, points: ['<code>@al.tool</code> 한 줄', '<code>.schema()</code> = LLM 에 보내는 것', '<code>.call(dict)</code> = 에이전트 방식'],
            notes: '<p>▶ 실행. docstring 의 빈 줄을 지우면 description 에 매개변수 줄까지 들어가는 것도 보여 주면 좋습니다.</p>' },
          { layout: 'code', title: '5단계를 손으로 돌리기', code: `import agentlab as al
from agentlab.llm import tool_result

llm = al.LLM()
msgs = [al.system('당신은 계산 비서입니다.'), al.user('1500 * 0.15 는 얼마야?')]
r = llm.chat(msgs, tools=[al.calculator])          # ①
print('②', r.tool_calls)
call = r.tool_calls[0]
result = al.calculator.call(call.args)             # ③
print('③', result)
msgs.append(r.message())                           # ④
msgs.append(tool_result(call.id, call.name, result))
print('⑤', llm.chat(msgs, tools=[al.calculator]).content)`, points: ['②: 답 대신 <b>호출 요청</b>', '③: <b>우리 코드</b>가 실행', '④: assistant → tool 순서로 기록'],
            notes: '<p>▶ 실행하며 그림 4-2 의 번호와 대응시킵니다. <code>r.content</code> 가 비어 있음을 꼭 보여 주세요.</p>' },
          { layout: 'code', title: 'Agent 가 대신 돌리는 루프', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator],
                 system='당신은 계산 비서입니다.', verbose=True)
print(agent.run('1500 * 0.15 는 얼마야?'))
agent.trace()`, points: ['Agent = ①~⑤ 를 <code>max_steps</code> 번 반복', '<code>verbose=True</code>: 🔧 → 👁 → ✅', '01차시 에이전트 루프 = 이 코드'],
            notes: '<p>▶ 실행. “손으로 돌린 것과 출력이 같다”를 확인. 앞으로는 Agent 를 쓰되 내부는 안다는 자세.</p>' },
          { layout: 'table', title: '공급자별 포장지', head: ['공급자', '요청 키', '응답 위치'], rows: [
            ['OpenAI 계열', '<code>function</code>', '<code>tool_calls[].function</code>'],
            ['Gemini', '<code>functionDeclarations</code>', '<code>parts[].functionCall</code>'],
            ['Anthropic', '<code>input_schema</code>', '<code>content[] type=tool_use</code>'],
            ['agentlab', '<code>Tool.schema()</code>', '<code>r.tool_calls</code>']
          ], lead: '개념은 하나, 키 이름만 다르다', notes: '<p>외울 필요는 없습니다. “프레임워크(agentlab · LangChain)가 변환해 준다”는 것과 “Colab 에서 원본을 볼 수 있다”는 것만 전달.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[0].q, options: QUIZ1[0].options, answer: QUIZ1[0].answer, explain: QUIZ1[0].explain, notes: '<p>가장 흔한 오개념을 묻는 문제. 전원이 맞힐 때까지 그림 4-2 로 되돌아갑니다.</p>' },
          { layout: 'practice', title: '실습 4-1. 곱셈 도구 만들기', desc: '<p><code>multiply(a, b)</code> 도구를 만들고 Agent 로 “7 곱하기 8 계산해줘”를 실행하세요.</p>',
            starter: `import agentlab as al

# TODO: @al.tool + docstring "두 수를 곱한 값을 계산한다"
def multiply(a: int, b: int) -> dict:
    return {'result': a * b}

llm = al.LLM()
# TODO: Agent 로 실행`, solution: `import agentlab as al

@al.tool
def multiply(a: int, b: int) -> dict:
    """두 수를 곱한 값을 계산한다

    a: 첫 수
    b: 둘째 수
    """
    return {'result': a * b}

llm = al.LLM()
agent = al.Agent(llm, tools=[multiply], verbose=True)
print(agent.run('7 곱하기 8 계산해줘'))`, notes: '<p>⏱ 8분. docstring 에 “계산”이 없으면 모의 LLM 이 도구를 고르지 않는 것을 겪게 해도 좋습니다 — 2교시 도입이 됩니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['LLM 은 계산기 · 시계 · 인터넷 · 손이 없다 → <b>도구</b>', '함수 호출 5단계: 질문 → <b>요청 JSON</b> → 실행(우리 코드) → <code>role: tool</code> → 답', '<code>@al.tool</code>: 이름 · docstring · 타입 힌트 → 스키마', '<code>al.Agent</code> = 이 루프를 감싼 것', '다음 교시: 좋은 도구를 설계하는 원칙'], notes: '<p>⏱ 6분. 출구 질문: “함수를 실행하는 주체는?” 전원 합창 → “우리 코드”.</p>' }
        ]
      },
      {
        id: 'ag04-2',
        title: '도구 설계 원칙과 내장 도구',
        minutes: 50,
        goals: ['설명문이 도구 선택 정확도를 결정함을 실험으로 확인한다', '입력 검증과 오류 값 반환으로 죽지 않는 도구를 만든다', '여러 도구 중 선택 · 도구 연쇄 · 위험한 도구의 승인 게이트를 구현한다'],
        flow: [['설명문이 정확도를 결정', 10], ['입력 검증과 오류 처리', 12], ['여러 도구 선택 · 연쇄', 12], ['내장 도구와 안전', 8], ['실습 · 정리', 8]],
        content: [
          { type: 'p', html: '1교시에서 도구를 만드는 법을 배웠다면, 이번 교시는 <b>좋은 도구</b>를 만드는 법입니다. 좋은 도구는 LLM 이 올바르게 고르고, 엉뚱한 인자가 와도 버티며, 실패해도 루프를 죽이지 않고, 위험한 일은 사람에게 묻습니다.' },
          { type: 'figure', html: FIG_DESIGN, caption: '그림 4-4. 도구 설계 4원칙: 설명문 · 입력 검증 · 오류는 값으로 · 하나의 도구는 하나의 일.' },
          { type: 'h', text: '원칙 ① 설명문(docstring)이 호출 정확도를 결정한다' },
          { type: 'p', html: 'LLM 은 함수 코드를 보지 못합니다. <b>이름과 설명문만</b> 보고 “이 질문에 이 도구를 쓸지” 판단합니다. 설명이 모호하면 꼭 필요한 순간에 도구를 안 쓰거나, 엉뚱한 도구를 씁니다. 모의 LLM 도 설명문의 단어로 도구를 고르므로 이 차이를 바로 실험할 수 있습니다.' },
          { type: 'code', title: '예제 4-6. 설명문만 다른 두 도구 — 선택 결과 비교', code: `import agentlab as al

llm = al.LLM()

@al.tool
def conv(x: float) -> dict:
    """x 를 바꾼다"""                       # 😕 무엇을 어떻게 바꾸는지 알 수 없음
    return {'result': round(float(x) * 9 / 5 + 32, 1)}

@al.tool
def celsius_to_fahrenheit(celsius: float) -> dict:
    """섭씨 온도를 화씨 온도로 변환 계산한다

    celsius: 섭씨 온도. 예: 25
    """
    return {'result': round(float(celsius) * 9 / 5 + 32, 1), 'unit': 'F'}

q = '25도는 화씨로 몇 도인지 계산해줘'
for t in [conv, celsius_to_fahrenheit]:
    r = llm.chat([al.user(q)], tools=[t])
    picked = r.tool_calls[0].name if r.tool_calls else '(도구를 고르지 않음)'
    print(f'{t.name:<22}→ {picked}')`,
            expect: `conv                  → (도구를 고르지 않음)
celsius_to_fahrenheit → celsius_to_fahrenheit`,
            desc: '코드는 똑같은데 설명문이 모호한 <code>conv</code> 는 선택되지 않았습니다. 실제 모델도 마찬가지로, “언제 쓰는 도구인지”가 설명에 드러나야 호출합니다. 이름도 설명의 일부입니다 — <code>conv</code> 보다 <code>celsius_to_fahrenheit</code> 가 훨씬 많은 정보를 줍니다.' },
          { type: 'table', head: ['체크', '나쁜 예', '좋은 예'], rows: [
            ['동사로 시작해 무엇을 하는지', '“온도 관련”', '“섭씨 온도를 화씨로 <b>변환 계산한다</b>”'],
            ['언제 써야 하는지', '“유틸리티 함수”', '“사용자가 <b>현재 날씨</b>를 물을 때 사용한다”'],
            ['매개변수의 단위 · 형식 · 예시', '“city: 도시”', '“city: 도시 이름(한글 또는 영문). 예: \'서울\', \'Tokyo\'”'],
            ['하지 말아야 할 때', '(없음)', '“과거 날씨나 예보에는 쓰지 않는다”']
          ], caption: '좋은 설명문 체크리스트' },
          { type: 'h', text: '원칙 ② 입력 검증 · 원칙 ③ 오류는 값으로' },
          { type: 'p', html: 'LLM 이 주는 인자는 항상 깨끗하지 않습니다. 숫자를 <code>"42"</code> 처럼 문자열로 주기도 하고, 없는 통화 코드를 지어내기도 합니다. 도구 안에서 <b>타입 변환과 범위 확인</b>을 하고, 문제가 있으면 예외를 던지는 대신 <b><code>{\'error\': …}</code> 를 돌려줍니다</b>. 그래야 에이전트 루프가 멈추지 않고 LLM 이 오류를 읽고 사과하거나 다른 방법을 찾습니다.' },
          { type: 'code', title: '예제 4-7. 죽지 않는 나눗셈 도구', code: `import agentlab as al

llm = al.LLM()

@al.tool
def divide(a: float, b: float) -> dict:
    """두 수를 나눈 몫을 계산한다

    a: 나뉘는 수
    b: 나누는 수 (0 이면 안 됨)
    """
    a, b = float(a), float(b)                 # ② 입력 검증: 문자열 "10" 도 숫자로
    if b == 0:
        return {'error': '0으로 나눌 수 없습니다'}   # ③ 오류는 값으로
    return {'result': a / b}

print('직접 호출:', divide.call({'a': '10', 'b': '4'}))   # 문자열 인자도 OK
print('직접 호출:', divide.call({'a': 10, 'b': 0}))
print('예외가 나는 경우:', al.calculator.call({'expression': 'import os'}))   # Tool.call 이 잡아 error 값으로

agent = al.Agent(llm, tools=[divide], system='당신은 계산 비서입니다.', verbose=True)
print(agent.run('10 나누기 0 은?'))        # 오류가 나도 루프는 살아서 답을 만든다
agent.reset()
print(agent.run('10 나누기 4 는?'))`,
            expect: `직접 호출: {'result': 2.5}
직접 호출: {'error': '0으로 나눌 수 없습니다'}
예외가 나는 경우: {'error': '계산 실패: invalid syntax (<string>, line 1)', 'expression': 'import os'}
🔧 도구 호출 1: divide({"a": 10, "b": 0})
👁 관찰: {"error": "0으로 나눌 수 없습니다"}
✅ 최종 답: [계산 비서] divide 도구가 실패했습니다: 0으로 나눌 수 없습니다
[계산 비서] divide 도구가 실패했습니다: 0으로 나눌 수 없습니다
🔧 도구 호출 1: divide({"a": 10, "b": 4})
👁 관찰: {"result": 2.5}
✅ 최종 답: [계산 비서] 계산 결과는 2.5 입니다.
[계산 비서] 계산 결과는 2.5 입니다.`,
            desc: '0 으로 나누는 요청에도 프로그램이 죽지 않고 “실패했습니다”라는 답이 나옵니다. <code>Tool.call()</code> 은 함수 안에서 잡지 못한 예외도 자동으로 <code>{\'error\': …}</code> 로 바꿔 주지만, <b>의미 있는 오류 메시지</b>는 우리가 직접 써 주는 것이 좋습니다 — LLM 이 그 문장을 읽고 사용자에게 설명하기 때문입니다.' },
          { type: 'callout', kind: 'tip', title: '오류 메시지는 LLM 이 읽는 “사용자 안내문”', html: '<code>{\'error\': \'ZeroDivisionError\'}</code> 보다 <code>{\'error\': \'0으로 나눌 수 없습니다. 0 이 아닌 수를 알려 주세요\'}</code> 가 훨씬 좋습니다. 실제 모델은 이 문장을 바탕으로 사용자에게 되묻거나 다른 인자로 재시도합니다. 오류 값에 <code>\'hint\'</code> 키로 해결 방법을 덧붙이는 것도 흔한 패턴입니다.' },
          { type: 'h', text: '여러 도구 중 고르기' },
          { type: 'p', html: '실제 에이전트는 도구를 여러 개 가집니다. LLM 은 질문의 의도와 각 도구의 설명을 맞춰 보고 하나(또는 여럿)를 고릅니다. 도구가 많을수록 <b>설명의 구별력</b>이 중요해집니다.' },
          { type: 'figure', html: FIG_SELECT, caption: '그림 4-5. 네 가지 도구 중 선택. LLM 은 질문과 설명문을 맞춰 보고 고릅니다.' },
          { type: 'code', title: '예제 4-8. 날씨 · 계산 · 위키 · 시간 — 네 도구를 가진 비서', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator, al.wiki_search, al.now],
                 system='당신은 비서입니다.', verbose=False)

for q in ['부산 날씨 알려줘', '250 * 4 계산해줘', '파이썬에 대해 검색해줘', '지금 몇 시야?']:
    agent.reset()
    answer = agent.run(q)
    used = [s.data['name'] for s in agent.steps if s.kind == 'tool']
    print(f'👤 {q}')
    print(f'   🔧 {used} → 🤖 {answer[:70]}')`,
            expect: `👤 부산 날씨 알려줘
   🔧 ['get_weather'] → 🤖 [비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
👤 250 * 4 계산해줘
   🔧 ['calculator'] → 🤖 [비서] 계산 결과는 1000 입니다.
👤 파이썬에 대해 검색해줘
   🔧 ['wiki_search'] → 🤖 [비서] 파이썬: 파이썬은 1991년 귀도 반 로섬이 발표한 고급 프로그래밍 언어로, 읽기 쉬운 문법과 방대한 라
👤 지금 몇 시야?
   🔧 ['now'] → 🤖 [비서] 지금은 2026-10-05 09:30 입니다.`,
            desc: '질문마다 다른 도구가 선택됩니다. <code>get_weather</code> 와 <code>wiki_search</code> 는 브라우저에서 실제 Open-Meteo · 위키백과 API 를 부르므로 결과가 매번 다르고(예시 출력은 오프라인 샘플 데이터), <code>now</code> 는 실제 현재 시각을 돌려줍니다. <code>agent.reset()</code> 으로 질문마다 대화 기록을 비웠습니다.' },
          { type: 'h', text: '도구 연쇄: 앞 도구의 결과가 다음 도구의 입력으로' },
          { type: 'p', html: '“서울 기온을 화씨로 알려줘”는 도구 두 개가 필요합니다: <code>get_weather</code> 로 기온을 얻고 → <code>calculator</code> 로 변환합니다. 실제 모델은 한 번의 <code>run()</code> 안에서 두 도구를 차례로 요청하기도 합니다(그림 4-2 의 ②~④ 반복). 모의 LLM 은 한 번에 도구 하나만 고르므로 두 단계로 나눠 묻되, <b>앞 단계의 관찰 결과를 코드로 꺼내</b> 다음 질문에 넣는 방식을 보여 드립니다.' },
          { type: 'code', title: '예제 4-9. 날씨 → 계산 연쇄', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator], system='당신은 비서입니다.')

print('1단계:', agent.run('서울 날씨 알려줘'))
observed = [s.data['result'] for s in agent.steps if s.kind == 'observe'][0]   # 관찰 결과 꺼내기
temp = observed['temperature']
print('   관찰된 기온:', temp, '°C')

print('2단계:', agent.run(f'{temp} * 9 / 5 + 32 를 계산해줘'))
print('--- 전체 단계 ---')
agent.trace()
print('메모리에 쌓인 메시지 수:', len(agent.memory))`,
            expect: `1단계: [비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.
   관찰된 기온: 18.4 °C
2단계: [비서] 계산 결과는 65.12 입니다.
--- 전체 단계 ---
 1. 🔧 calculator({"expression": "18.4 * 9 / 5 + 32"})
 2. 👁 {"expression": "18.4 * 9 / 5 + 32", "result": 65.12}
 3. ✅ [비서] 계산 결과는 65.12 입니다.
메모리에 쌓인 메시지 수: 8`,
            desc: '<code>agent.steps</code> 에는 마지막 <code>run()</code> 의 단계가, <code>agent.memory</code> 에는 전체 대화(질문 · 호출 요청 · 도구 결과 · 답)가 쌓입니다. 🔑 실제 모델에 “서울 기온을 화씨로 계산해줘”라고 한 번에 물으면 두 도구를 스스로 연쇄 호출하는 것을 볼 수 있습니다.' },
          { type: 'h', text: '내장 도구 소개' },
          { type: 'p', html: '<code>agentlab</code> 에는 수업용 내장 도구가 준비되어 있습니다. 네트워크가 없거나 검증 모드이면 <code>get_weather · wiki_search</code> 는 준비된 샘플 데이터를, <code>now</code> 는 고정 시각을 돌려줍니다.' },
          { type: 'table', head: ['도구', '매개변수', '하는 일', '비고'], rows: [
            ['<code>al.calculator</code>', '<code>expression: str</code>', '수식 계산 (사칙연산 · 괄호 · sqrt · 퍼센트)', '안전한 이름만 허용하는 eval'],
            ['<code>al.get_weather</code>', '<code>city: str</code>', '도시의 현재 날씨', 'Open-Meteo 무료 API, 키 불필요'],
            ['<code>al.wiki_search</code>', '<code>query: str</code>', '한국어 위키백과 요약', '키 불필요'],
            ['<code>al.now</code>', '(없음)', '현재 날짜 · 시각 · 요일', '오프라인이면 고정 시각'],
            ['<code>al.read_file</code> / <code>al.write_file</code>', '<code>path</code> (+ <code>content</code>)', '작업 폴더의 텍스트 파일 읽기 · 쓰기', '브라우저 가상 파일 시스템'],
            ['<code>al.remember_note</code>', '<code>note: str</code>', '메모 저장 (05차시 기억)', '세션 동안 유지']
          ], caption: 'agentlab 내장 도구. 모두 @al.tool 로 만들어져 있어 .schema() · .call() 을 쓸 수 있습니다.' },
          { type: 'code', title: '예제 4-10. 내장 도구 직접 호출해 보기', nondeterministic: true, code: `import agentlab as al

print(al.calculator('(3 + 4) * 2'))
print(al.calculator('sqrt(16) + 15%'))
print(al.now())
print(al.write_file('memo.txt', '오늘 회의: 도구 설계 원칙 4가지'))
print(al.read_file('memo.txt'))
print(al.read_file('없는파일.txt'))                  # error 값
print(al.get_weather('제주'))
print(al.wiki_search('커피')['summary'][:50], '…')`,
            expect: `{'expression': '(3 + 4) * 2', 'result': 14}
{'expression': 'sqrt(16) + 15%', 'result': 4.15}
{'now': '2026-10-05 09:30', 'weekday': '월요일'}
{'path': 'memo.txt', 'bytes': 42, 'ok': True}
{'path': 'memo.txt', 'content': '오늘 회의: 도구 설계 원칙 4가지'}
{'error': '없는파일.txt 파일이 없습니다'}
{'city': '제주', 'temperature': 22.3, 'condition': '구름 많음', 'humidity': 70, 'wind_kmh': 6.2, 'source': 'sample (offline)'}
커피는 커피나무 열매의 씨앗을 볶아 만든 음료로, 카페인을 함유하며 전 세계에서 가장 널리 소비되는 음료 중 하나이 …`,
            desc: '도구는 평범한 파이썬 함수처럼 직접 부를 수 있으므로, 에이전트에 붙이기 전에 <b>먼저 혼자 테스트</b>하는 습관을 들이세요. 모든 내장 도구가 실패 시 <code>error</code> 키를 돌려주는 규칙을 따릅니다. (날씨 · 위키 · 시각은 브라우저에서 실제 값이 나옵니다)' },
          { type: 'h', text: '원칙 ④+α 안전: 위험한 도구는 확인 단계를 거친다' },
          { type: 'p', html: '파일 삭제, 메일 발송, 결제처럼 <b>되돌릴 수 없는 행동</b>을 LLM 의 판단만으로 실행하면 안 됩니다. 03차시에서 배웠듯 프롬프트의 “조심해라”는 부탁일 뿐입니다. <b>코드 수준의 게이트</b>를 두어 위험 도구는 사람의 승인이 있을 때만 실행합니다.' },
          { type: 'figure', html: FIG_GATE, caption: '그림 4-6. 실행 게이트. 안전한 도구는 바로, 위험한 도구는 사람 승인 뒤에 실행합니다 (human-in-the-loop).' },
          { type: 'code', title: '예제 4-11. 승인 게이트가 있는 도구 실행기', code: `import agentlab as al

@al.tool
def delete_file(path: str) -> dict:
    """파일을 삭제한다 (되돌릴 수 없음)

    path: 삭제할 파일 이름
    """
    return {'deleted': path}      # 수업용: 실제로 지우지는 않습니다

registry = al.ToolRegistry([al.read_file, al.write_file, delete_file])
DANGEROUS = {'delete_file', 'send_email', 'pay'}

def safe_execute(call, approved=False):
    """위험한 도구는 승인이 있을 때만 실행하는 게이트"""
    if call.name in DANGEROUS and not approved:
        print(f'🚦 승인 필요: {call.name}({call.args}) — 사용자에게 확인을 요청합니다')
        return {'error': f'{call.name} 은(는) 사용자 승인이 필요합니다', 'need_approval': True}
    return registry.execute(call)

# LLM 이 이런 호출 요청을 돌려줬다고 가정
calls = [al.ToolCall('write_file', {'path': 'memo.txt', 'content': '안녕'}),
         al.ToolCall('delete_file', {'path': 'memo.txt'})]
for c in calls:
    print(c.name, '→', safe_execute(c))
print('--- 사람이 승인한 뒤 ---')
print(safe_execute(calls[1], approved=True))`,
            expect: `write_file → {'path': 'memo.txt', 'bytes': 6, 'ok': True}
🚦 승인 필요: delete_file({'path': 'memo.txt'}) — 사용자에게 확인을 요청합니다
delete_file → {'error': 'delete_file 은(는) 사용자 승인이 필요합니다', 'need_approval': True}
--- 사람이 승인한 뒤 ---
{'deleted': 'memo.txt'}`,
            desc: '게이트는 <b>LLM 바깥</b>의 평범한 파이썬 코드입니다. 승인이 없으면 오류 값을 돌려주므로 LLM 은 “승인이 필요합니다”라고 사용자에게 안내하게 됩니다. 08차시 LangGraph 의 <code>interrupt</code>, 13차시 안전에서 이 패턴을 본격적으로 씁니다.' },
          { type: 'callout', kind: 'warn', title: '권한은 최소로', html: '에이전트에 주는 도구는 <b>꼭 필요한 것만</b>, 각 도구의 권한도 <b>최소로</b> 설계합니다. “파일을 지우는 도구”보다 “휴지통으로 옮기는 도구”, “모든 메일 발송”보다 “초안 저장”이 안전합니다. 프롬프트 주입(03차시)으로 LLM 이 속더라도 피해가 작아지도록 설계하는 것이 핵심입니다.' },
          { type: 'colab', title: 'Colab 실습 04 — 실제 모델의 Function Calling', html: '<p>Colab 노트북에서는 <b>Gemini 와 OpenAI 의 원본 SDK</b> 로 함수 호출을 해 봅니다. ① 함수 스키마를 직접 JSON 으로 적어 보내고 응답에서 <code>functionCall</code> / <code>tool_calls</code> 를 꺼내기, ② 5단계 루프를 직접 구현하기, ③ 도구 두 개를 한 번에 연쇄 호출하는 실제 모델의 동작 확인, ④ 환율 · 단위 변환 도구 실습. 키는 Colab Secrets 의 <code>GEMINI_API_KEY</code> 를 사용합니다.</p>' },
          { type: 'callout', kind: 'info', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>예제 4-8 · 4-9 · 4-10 은 브라우저에서 실제 API(Open-Meteo · 위키백과)를 부릅니다. 교실 네트워크가 막혀 있으면 샘플 데이터로 동작하므로 수업에는 지장이 없습니다.</li><li>예제 4-6(설명문 비교)은 이 교시의 핵심 시연입니다. 학생이 <code>conv</code> 의 docstring 에 “계산”을 넣어 다시 실행하게 해 보세요 — 도구가 선택됩니다.</li><li>실습 4-3~4-5 는 난이도순이 아니라 주제별입니다. 시간이 부족하면 4-4(단위 변환) → 4-3(환율) → 4-5(할 일) 순으로.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '자주 나오는 오개념', teacher: true, html: '<ul><li><b>“도구를 많이 주면 더 똑똑해진다”</b> → 비슷한 도구가 많으면 오히려 잘못 고릅니다. 설명의 구별력이 핵심.</li><li><b>“try/except 로 예외를 잡으면 끝”</b> → 잡은 뒤 <i>의미 있는 error 값</i>을 돌려줘야 LLM 이 대처할 수 있습니다.</li><li><b>“모의 LLM 이 도구를 안 고른다 = 버그”</b> → 대부분 설명문에 키워드(계산 · 날씨 · 검색 · 저장…)가 없어서입니다. 실제 모델도 같은 이유로 실패합니다.</li></ul>' },
          { type: 'table', teacher: true, head: ['평가 항목', '상 (3)', '중 (2)', '하 (1)'], rows: [
            ['설명문', '동사 · 용도 · 매개변수 단위 · 예시가 모두 있음', '용도만 있음', '한 단어'],
            ['입력 검증', 'float() 변환 + 허용값 확인', '변환만', '없음'],
            ['오류 처리', '의미 있는 error 값 + 에이전트에서 확인', 'error 값만', '예외 발생'],
            ['에이전트 연동', 'Agent 로 실행해 도구 선택 확인', '직접 호출만', '실행 안 됨']
          ], caption: '실습 4-3 · 4-4 · 4-5 평가 루브릭' }
        ],
        practice: [
          { title: '실습 4-3. 환율 변환 도구', level: 2,
            desc: '<p>원화 금액을 달러 · 엔 · 유로로 바꾸는 <code>krw_to(amount, currency=\'USD\')</code> 도구를 만드세요. 환율은 dict 로 고정(USD 1350, JPY 9.1, EUR 1480)합니다. ① <code>amount</code> 는 <code>float()</code> 으로 변환, ② 지원하지 않는 통화는 <code>{\'error\': …}</code>, ③ 결과는 <code>{\'result\': 금액, \'unit\': 통화}</code>. 직접 호출로 테스트한 뒤 Agent 로 “100000 원은 몇 달러인지 계산해줘”를 실행하세요.</p>',
            hint: 'docstring 에 “환전 계산한다”처럼 “계산”을 넣으세요. <code>round(amount / rates[currency], 2)</code>',
            starter: `import agentlab as al

RATES = {'USD': 1350.0, 'JPY': 9.1, 'EUR': 1480.0}

@al.tool
def krw_to(amount: float, currency: str = 'USD') -> dict:
    """원화 금액을 다른 통화로 환전 계산한다

    amount: 원화 금액
    currency: 통화 코드 (USD, JPY, EUR)
    """
    # TODO ① amount 를 float 으로 변환
    # TODO ② currency 가 RATES 에 없으면 error 값 반환
    # TODO ③ {'result': ..., 'unit': currency} 반환
    return {}

print(krw_to.call({'amount': '100000', 'currency': 'USD'}))
print(krw_to.call({'amount': 100000, 'currency': 'GBP'}))
llm = al.LLM()
# TODO: Agent 로 '100000 원은 몇 달러인지 계산해줘' 실행
`,
            solution: `import agentlab as al

RATES = {'USD': 1350.0, 'JPY': 9.1, 'EUR': 1480.0}

@al.tool
def krw_to(amount: float, currency: str = 'USD') -> dict:
    """원화 금액을 다른 통화로 환전 계산한다

    amount: 원화 금액
    currency: 통화 코드 (USD, JPY, EUR)
    """
    amount = float(amount)
    if currency not in RATES:
        return {'error': f'지원하지 않는 통화: {currency}. 가능: {list(RATES)}'}
    return {'result': round(amount / RATES[currency], 2), 'unit': currency}

print(krw_to.call({'amount': '100000', 'currency': 'USD'}))
print(krw_to.call({'amount': 100000, 'currency': 'GBP'}))
llm = al.LLM()
agent = al.Agent(llm, tools=[krw_to], system='당신은 환전 비서입니다.', verbose=True)
print(agent.run('100000 원은 몇 달러인지 계산해줘'))
`,
            expect: `{'result': 74.07, 'unit': 'USD'}
{'error': "지원하지 않는 통화: GBP. 가능: ['USD', 'JPY', 'EUR']"}
🔧 도구 호출 1: krw_to({"amount": "100000"})
👁 관찰: {"result": 74.07, "unit": "USD"}
✅ 최종 답: [환전 비서] 계산 결과는 74.07 입니다.
[환전 비서] 계산 결과는 74.07 입니다.` },
          { title: '실습 4-4. 단위 변환 도구', level: 1,
            desc: '<p>킬로미터를 마일로 바꾸는 <code>km_to_mile(km)</code> 도구를 만드세요 (1 km = 0.621371 mile). 문자열 인자가 와도 동작하도록 <code>float()</code> 을 쓰고, <code>{\'result\': 마일, \'unit\': \'mile\'}</code> 을 돌려줍니다. Agent 로 “42 km 는 몇 마일인지 계산해줘”를 실행하세요.</p>',
            hint: '<code>round(float(km) * 0.621371, 2)</code>',
            starter: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    # TODO: float 변환 후 {'result': ..., 'unit': 'mile'} 반환
    return {}

llm = al.LLM()
agent = al.Agent(llm, tools=[km_to_mile], verbose=True)
print(agent.run('42 km 는 몇 마일인지 계산해줘'))
`,
            solution: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
agent = al.Agent(llm, tools=[km_to_mile], verbose=True)
print(agent.run('42 km 는 몇 마일인지 계산해줘'))
`,
            expect: `🔧 도구 호출 1: km_to_mile({"km": "42"})
👁 관찰: {"result": 26.1, "unit": "mile"}
✅ 최종 답: 계산 결과는 26.1 입니다.
계산 결과는 26.1 입니다.` },
          { title: '실습 4-5. 할 일 목록 도구 (추가 · 조회)', level: 3,
            desc: '<p>리스트 <code>TODOS</code> 를 다루는 도구 두 개를 만드세요. <code>add_todo(item)</code> 은 할 일을 저장하고 <code>"\'우유 사기\' 을(를) 추가했습니다. 현재 할 일 N개"</code> 문자열을, <code>list_todos()</code> 는 할 일 목록(list)을 돌려줍니다. 설명문에는 각각 “저장한다”, “읽어 보여준다”를 넣습니다. Agent 로 “우유 사기를 할 일에 저장해줘” → <code>reset()</code> → “할 일 목록 내용을 읽어줘”를 차례로 실행하세요.</p>',
            hint: '도구가 문자열이나 리스트를 돌려줘도 됩니다. 모의 LLM 은 “저장” → add_todo, “읽어 · 내용” → list_todos 를 고릅니다.',
            starter: `import agentlab as al

TODOS = []

@al.tool
def add_todo(item: str) -> str:
    """할 일을 목록에 저장한다

    item: 할 일 내용
    """
    # TODO: TODOS 에 추가하고 안내 문자열 반환
    return ''

@al.tool
def list_todos() -> list:
    """할 일 목록 내용을 읽어 보여준다"""
    # TODO: TODOS 의 복사본 반환
    return []

llm = al.LLM()
agent = al.Agent(llm, tools=[add_todo, list_todos], system='당신은 비서입니다.', verbose=True)
print(agent.run('우유 사기를 할 일에 저장해줘'))
agent.reset()
print(agent.run('할 일 목록 내용을 읽어줘'))
print('TODOS =', TODOS)
`,
            solution: `import agentlab as al

TODOS = []

@al.tool
def add_todo(item: str) -> str:
    """할 일을 목록에 저장한다

    item: 할 일 내용
    """
    TODOS.append(item)
    return f"'{item}' 을(를) 추가했습니다. 현재 할 일 {len(TODOS)}개"

@al.tool
def list_todos() -> list:
    """할 일 목록 내용을 읽어 보여준다"""
    return list(TODOS)

llm = al.LLM()
agent = al.Agent(llm, tools=[add_todo, list_todos], system='당신은 비서입니다.', verbose=True)
print(agent.run('우유 사기를 할 일에 저장해줘'))
agent.reset()
print(agent.run('할 일 목록 내용을 읽어줘'))
print('TODOS =', TODOS)
`,
            expect: `🔧 도구 호출 1: add_todo({"item": "우유 사기를 할 일에 저장해줘"})
👁 관찰: '우유 사기를 할 일에 저장해줘' 을(를) 추가했습니다. 현재 할 일 1개
✅ 최종 답: [비서] '우유 사기를 할 일에 저장해줘' 을(를) 추가했습니다. 현재 할 일 1개
[비서] '우유 사기를 할 일에 저장해줘' 을(를) 추가했습니다. 현재 할 일 1개
🔧 도구 호출 1: list_todos({})
👁 관찰: ["우유 사기를 할 일에 저장해줘"]
✅ 최종 답: [비서] 우유 사기를 할 일에 저장해줘
[비서] 우유 사기를 할 일에 저장해줘
TODOS = ['우유 사기를 할 일에 저장해줘']` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '도구 설계 원칙과 내장 도구', subtitle: '잘 고르고 · 버티고 · 죽지 않고 · 안전하게', notes: '<p>1교시 실습에서 “계산”이 없는 docstring 때문에 도구가 안 골라진 학생이 있었다면 그 경험으로 시작합니다.</p>' },
          { layout: 'diagram', title: '도구 설계 4원칙', html: FIG_DESIGN, caption: '설명문 · 입력 검증 · 오류는 값으로 · 하나의 일',
            notes: '<p>네 카드를 한 줄씩 읽고, 각각 “안 지키면 무슨 일이?”를 학생에게 묻습니다: 안 골라짐 / 엉뚱한 실행 / 루프 사망 / 잘못 고름.</p>' },
          { layout: 'code', title: '설명문만 다른 두 도구', code: `import agentlab as al

llm = al.LLM()

@al.tool
def conv(x: float) -> dict:
    """x 를 바꾼다"""
    return {'result': round(float(x) * 9 / 5 + 32, 1)}

@al.tool
def celsius_to_fahrenheit(celsius: float) -> dict:
    """섭씨 온도를 화씨 온도로 변환 계산한다

    celsius: 섭씨 온도. 예: 25
    """
    return {'result': round(float(celsius) * 9 / 5 + 32, 1)}

for t in [conv, celsius_to_fahrenheit]:
    r = llm.chat([al.user('25도는 화씨로 몇 도인지 계산해줘')], tools=[t])
    print(t.name, '→', r.tool_calls[0].name if r.tool_calls else '선택 안 됨')`, points: ['코드는 같고 설명만 다르다', 'LLM 은 설명만 본다', '이름도 설명의 일부'],
            notes: '<p>▶ 실행. 그다음 <code>conv</code> 의 docstring 을 “온도를 변환 계산한다”로 고쳐 다시 실행 → 선택됨. 설명문의 힘을 체감시키는 핵심 시연.</p>' },
          { layout: 'table', title: '좋은 설명문 체크리스트', head: ['체크', '나쁜 예', '좋은 예'], rows: [
            ['동사로 무엇을', '“온도 관련”', '“섭씨를 화씨로 변환 계산한다”'],
            ['언제 쓰는지', '“유틸리티”', '“현재 날씨를 물을 때”'],
            ['단위 · 예시', '“city: 도시”', '“city: 도시 이름. 예: \'서울\'”'],
            ['쓰지 말 때', '(없음)', '“예보에는 쓰지 않는다”']
          ], notes: '<p>학생이 1교시에 만든 multiply 의 docstring 을 이 표로 자가 점검하게 합니다 (2분).</p>' },
          { layout: 'code', title: '입력 검증 + 오류는 값으로', code: `import agentlab as al

llm = al.LLM()

@al.tool
def divide(a: float, b: float) -> dict:
    """두 수를 나눈 몫을 계산한다

    a: 나뉘는 수
    b: 나누는 수 (0 이면 안 됨)
    """
    a, b = float(a), float(b)                     # 검증: "10" → 10.0
    if b == 0:
        return {'error': '0으로 나눌 수 없습니다'}  # 예외 대신 값
    return {'result': a / b}

agent = al.Agent(llm, tools=[divide], verbose=True)
print(agent.run('10 나누기 0 은?'))`, points: ['LLM 은 "10" 처럼 문자열을 주기도', '예외 → 루프 사망, 값 → LLM 이 대처', '오류 문장 = LLM 이 읽는 안내문'],
            notes: '<p>▶ 실행. <code>return</code> 을 <code>raise ZeroDivisionError</code> 로 바꿔도 <code>Tool.call</code> 이 잡아 주지만 메시지가 기계적이라는 점을 비교.</p>' },
          { layout: 'diagram', title: '여러 도구 중 고르기', html: FIG_SELECT, caption: '질문의 의도 ↔ 도구의 설명문',
            notes: '<p><b>발문:</b> “도구가 30개면 어떻게 될까?” → 비슷한 설명끼리 혼동. 실무에서는 도구를 그룹으로 나누거나(멀티 에이전트, Part 3) 먼저 분류기를 두기도 합니다.</p>' },
          { layout: 'code', title: '네 도구를 가진 비서', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator, al.wiki_search, al.now],
                 system='당신은 비서입니다.')

for q in ['부산 날씨 알려줘', '250 * 4 계산해줘', '파이썬에 대해 검색해줘', '지금 몇 시야?']:
    agent.reset()
    answer = agent.run(q)
    used = [s.data['name'] for s in agent.steps if s.kind == 'tool']
    print(q, '→', used, '|', answer[:40])`, points: ['질문마다 다른 도구', '날씨 · 위키는 실제 API (브라우저)', '<code>agent.steps</code> 로 어떤 도구를 썼는지 확인'],
            notes: '<p>▶ 실행. 네트워크가 되면 실제 날씨가 나옵니다. 학생에게 다섯 번째 질문을 만들어 어떤 도구가 선택될지 예측하게 합니다.</p>' },
          { layout: 'code', title: '도구 연쇄: 날씨 → 계산', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator], system='당신은 비서입니다.')

print(agent.run('서울 날씨 알려줘'))
temp = [s.data['result'] for s in agent.steps if s.kind == 'observe'][0]['temperature']
print('기온:', temp)
print(agent.run(f'{temp} * 9 / 5 + 32 를 계산해줘'))
print(len(agent.memory), '개 메시지가 기억에 쌓임')`, points: ['앞 관찰 결과 → 다음 입력', '실제 모델은 한 번에 연쇄 호출', '②~④ 반복 = 에이전트 루프'],
            notes: '<p>▶ 실행. 🔑 키가 있으면 “서울 기온을 화씨로 계산해줘” 한 문장으로 두 도구가 연쇄되는 것을 시연하세요.</p>' },
          { layout: 'diagram', title: '위험한 도구는 승인 게이트', html: FIG_GATE, caption: '되돌릴 수 없는 행동은 사람이 결정',
            notes: '<p><b>발문:</b> “프롬프트에 ‘파일을 함부로 지우지 마’라고 쓰면 충분한가?” → 아니오(03차시). 코드가 막아야 합니다. 권한 최소화 원칙도 함께.</p>' },
          { layout: 'code', title: '승인 게이트 구현', code: `import agentlab as al

@al.tool
def delete_file(path: str) -> dict:
    """파일을 삭제한다 (되돌릴 수 없음)

    path: 파일 이름
    """
    return {'deleted': path}

registry = al.ToolRegistry([al.read_file, delete_file])
DANGEROUS = {'delete_file'}

def safe_execute(call, approved=False):
    if call.name in DANGEROUS and not approved:
        return {'error': f'{call.name} 은(는) 사용자 승인이 필요합니다'}
    return registry.execute(call)

c = al.ToolCall('delete_file', {'path': 'memo.txt'})
print(safe_execute(c))
print(safe_execute(c, approved=True))`, points: ['게이트는 LLM 바깥의 평범한 코드', '승인 없으면 error 값', 'LangGraph interrupt · 13차시 안전'],
            notes: '<p>▶ 실행. DANGEROUS 집합에 무엇을 넣어야 할지 학생들과 목록을 만들어 봅니다 (결제 · 메일 · 삭제 · 외부 전송…).</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[0].q, options: QUIZ2[0].options, answer: QUIZ2[0].answer, explain: QUIZ2[0].explain, notes: '<p>“예외를 던지면 어떻게 되나?”를 직접 실행해 보여 줄 수도 있습니다 (Tool.call 밖에서 raise).</p>' },
          { layout: 'practice', title: '실습 4-4. 단위 변환 도구', desc: '<p><code>km_to_mile(km)</code> 도구를 만들고 Agent 로 “42 km 는 몇 마일인지 계산해줘”를 실행하세요.</p>',
            starter: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {}   # TODO: float 변환, {'result': ..., 'unit': 'mile'}

llm = al.LLM()
agent = al.Agent(llm, tools=[km_to_mile], verbose=True)
print(agent.run('42 km 는 몇 마일인지 계산해줘'))`, solution: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
agent = al.Agent(llm, tools=[km_to_mile], verbose=True)
print(agent.run('42 km 는 몇 마일인지 계산해줘'))`, notes: '<p>⏱ 8분. 빨리 끝난 학생은 실습 4-3(환율) · 4-5(할 일 목록)로. 인자가 문자열 "42" 로 오는 것을 확인시킵니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['① <b>설명문</b>이 호출 정확도를 결정 — LLM 은 코드를 못 본다', '② <b>입력 검증</b>: 문자열 숫자 · 허용값 확인', '③ <b>오류는 값으로</b> <code>{\'error\': …}</code> — 루프가 죽지 않게', '④ 도구 하나 = 일 하나, 위험한 도구는 <b>승인 게이트</b>', '내장 도구: calculator · get_weather · wiki_search · now · read/write_file'], notes: '<p>⏱ 8분. 다음 교시 예고: “함수 호출 API 가 없는 모델은 어떻게 도구를 쓸까?” → ReAct.</p>' }
        ]
      },
      {
        id: 'ag04-3',
        title: 'ReAct: 텍스트로 도구 부르기',
        minutes: 50,
        goals: ['함수 호출 API 가 없을 때 ReAct 텍스트 형식으로 도구를 부르는 원리를 설명한다', 'al.ReActAgent 를 실행하고 Thought · Action · Observation 흐름을 읽는다', '함수 호출 API 와 ReAct 의 장단점을 비교한다'],
        flow: [['함수 호출 API 가 없다면?', 8], ['ReAct 형식과 프롬프트', 12], ['ReActAgent 실행 · 파싱', 15], ['두 방식 비교', 7], ['퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '1·2교시의 함수 호출은 <b>공급자가 API 로 지원</b>해야 쓸 수 있습니다. 그런데 작은 로컬 모델이나 오래된 API 에는 이 기능이 없습니다. 2023년 이전에는 아무도 없었습니다. 그때 어떻게 했을까요? 답은 <b>약속된 텍스트 형식</b>입니다 — 2022년 논문 <b>ReAct</b>(Reason + Act)가 제안한 방식으로, “Thought / Action / Action Input / Observation” 줄을 텍스트로 쓰게 하고 우리 코드가 정규식으로 읽어 냅니다.' },
          { type: 'figure', html: FIG_REACT, caption: '그림 4-7. 함수 호출 API 는 구조화된 필드로, ReAct 는 보통 텍스트 안의 약속된 줄로 같은 일을 합니다.' },
          { type: 'h', text: 'ReAct 프롬프트 들여다보기' },
          { type: 'p', html: 'ReAct 의 핵심은 시스템 프롬프트입니다. 사용할 수 있는 도구 목록을 글로 적고, “반드시 이 형식으로 써라”고 지시합니다. <code>al.ReActAgent</code> 가 쓰는 프롬프트를 직접 출력해 봅시다.' },
          { type: 'code', title: '예제 4-12. ReActAgent 의 시스템 프롬프트', code: `import agentlab as al
from agentlab.agent import REACT_PROMPT

tools = al.ToolRegistry([al.calculator, al.get_weather])
print(REACT_PROMPT.format(tools=tools.describe()))`,
            expect: `너는 도구를 사용해 질문에 답하는 에이전트다. 다음 형식을 **정확히** 지켜라.

사용할 수 있는 도구:
- calculator(expression: string): 수식을 계산한다 (사칙연산 · 괄호 · sqrt · 퍼센트 등)
- get_weather(city: string): 도시의 현재 날씨(기온 · 날씨 상태 · 습도 · 풍속)를 알려준다. Open-Meteo 무료 API 사용 (키 불필요)

형식:
Question: 사용자의 질문
Thought: 무엇을 해야 할지 생각
Action: 도구 이름 (위 목록 중 하나)
Action Input: 도구에 넘길 JSON 인자
Observation: 도구 결과 (시스템이 채운다)
... (Thought/Action/Action Input/Observation 을 필요한 만큼 반복)
Thought: 이제 최종 답을 안다
Final Answer: 사용자에게 줄 최종 답

도구가 필요 없으면 바로 'Thought:' 다음에 'Final Answer:' 를 써라.`,
            desc: '도구 스키마 대신 <code>tool.describe()</code> 가 만든 <b>한 줄 설명</b>이 글로 들어갑니다. 즉 ReAct 에서도 설명문이 선택을 좌우합니다. “Observation 은 시스템이 채운다”는 문장이 핵심입니다 — LLM 이 관찰 결과를 지어내면 안 되기 때문입니다.' },
          { type: 'h', text: 'ReActAgent 실행하기' },
          { type: 'code', title: '예제 4-13. Thought → Action → Observation → Final Answer', code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.calculator, al.wiki_search])   # verbose=True 가 기본
answer = agent.run('12 * 12 는?')
print('=== 최종 답 ===')
print(answer)
print('=== 기록(transcript) 줄 수 ===')
print(len(agent.transcript.strip().split('\\n')))`,
            expect: `Thought: "12 * 12 는?" 에 답하려면 calculator 도구가 필요하다.
Action: calculator
Action Input: {"expression": "12 * 12"}
Observation: {"expression": "12 * 12", "result": 144}
Thought: 관찰 결과로 충분히 답할 수 있다.
Final Answer: 계산 결과는 144 입니다.
=== 최종 답 ===
계산 결과는 144 입니다.
=== 기록(transcript) 줄 수 ===
7`,
            desc: 'LLM 이 쓴 줄(Thought · Action · Action Input · Final Answer)과 코드가 붙인 줄(Observation)이 번갈아 나옵니다. 전체 대화는 <code>agent.transcript</code> 한 문자열에 쌓이고, 매 호출마다 이 문자열 전체를 다시 보냅니다.' },
          { type: 'code', title: '예제 4-14. 날씨 질문에 ReAct 로 답하기', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.get_weather, al.calculator], verbose=False)
print(agent.run('부산 날씨 알려줘'))
print('--- 전체 기록 ---')
print(agent.transcript)`,
            expect: `부산의 날씨는 구름 조금, 21.0°C 입니다.
--- 전체 기록 ---
Question: 부산 날씨 알려줘
Thought: "부산 날씨 알려줘" 에 답하려면 get_weather 도구가 필요하다.
Action: get_weather
Action Input: {"city": "부산"}
Observation: {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3, "source": "sample (offline)"}
Thought: 관찰 결과로 충분히 답할 수 있다.
Final Answer: 부산의 날씨는 구름 조금, 21.0°C 입니다.`,
            desc: '<code>verbose=False</code> 로 조용히 실행한 뒤 <code>transcript</code> 를 통째로 봅니다. 브라우저에서는 실제 Open-Meteo 날씨가 나옵니다. 2교시의 함수 호출 Agent 와 결과는 같지만, <b>중간 과정이 전부 텍스트</b>라는 점이 다릅니다.' },
          { type: 'h', text: '정규식으로 Action 읽어 내기 — ReAct 의 약점' },
          { type: 'p', html: 'ReActAgent 내부는 LLM 의 텍스트에서 <code>Action:</code> 과 <code>Action Input:</code> 줄을 <b>정규식</b>으로 찾습니다. 모델이 형식을 조금만 어겨도(예: “Action - calculator”) 파싱이 실패합니다. 직접 파서를 만들어 보면 왜 함수 호출 API 가 등장했는지 알 수 있습니다.' },
          { type: 'code', title: '예제 4-15. 미니 ReAct 파서 만들기', code: `import re
import json

def parse_react(text):
    """LLM 의 ReAct 텍스트 → ('final', 답) 또는 ('action', 도구, 인자) 또는 ('error', 이유)"""
    m = re.search(r'Final Answer:\\s*(.*)', text, re.S)
    if m:
        return ('final', m.group(1).strip())
    am = re.search(r'Action:\\s*([\\w\\-]+)', text)
    im = re.search(r'Action Input:\\s*(.*)', text, re.S)
    if not am:
        return ('error', 'Action 줄을 찾지 못함')
    try:
        args = json.loads(im.group(1).strip()) if im else {}
    except json.JSONDecodeError:
        return ('error', 'Action Input 이 JSON 이 아님')
    return ('action', am.group(1), args)

samples = [
    'Thought: 계산이 필요하다\\nAction: calculator\\nAction Input: {"expression": "12 * 12"}',
    'Thought: 이제 안다\\nFinal Answer: 144 입니다.',
    'Thought: 계산이 필요하다\\nAction - calculator\\nAction Input: 12 * 12',     # 형식을 어긴 답
    'Thought: 계산이 필요하다\\nAction: calculator\\nAction Input: 12 * 12',       # JSON 이 아님
]
for s in samples:
    print(parse_react(s))`,
            expect: `('action', 'calculator', {'expression': '12 * 12'})
('final', '144 입니다.')
('error', 'Action 줄을 찾지 못함')
('error', 'Action Input 이 JSON 이 아님')`,
            desc: '세 번째 · 네 번째처럼 모델이 형식을 살짝 어기면 파서가 실패합니다. 실제 프레임워크의 ReAct 파서는 이런 변형을 많이 허용하도록 정규식이 복잡해져 있고, 그래도 실패하면 “형식을 지켜라”는 메시지를 다시 보내 재시도합니다. 함수 호출 API 는 이 문제를 구조화된 필드로 해결했습니다.' },
          { type: 'h', text: '두 방식 비교' },
          { type: 'table', head: ['', '함수 호출 API (Tool Calling)', 'ReAct 텍스트 형식'], rows: [
            ['도구 요청이 오는 곳', '응답의 별도 필드 (<code>tool_calls</code>)', '보통 텍스트 안의 “Action:” 줄'],
            ['인자 형식', '공급자가 JSON 스키마대로 보장', '정규식 파싱, JSON 깨질 수 있음'],
            ['여러 도구 동시 호출', '가능 (병렬 호출)', '한 번에 하나씩'],
            ['모델 요구 사항', '공급자가 지원해야 함', '텍스트만 생성하면 됨 (로컬 소형 모델 OK)'],
            ['토큰', '스키마만 보냄', '도구 설명 + 형식 설명 + 전체 기록을 매번 보냄'],
            ['쓰임', '실무 기본 (GPT · Gemini · Claude · Llama 3)', '원리 학습 · 미지원 모델 · 프레임워크 내부']
          ], caption: '함수 호출 API vs ReAct. 실무에서는 함수 호출이 기본이고, ReAct 는 “생각(Thought)을 글로 쓰게 하는” 계획 기법으로 06차시에 다시 만납니다.' },
          { type: 'callout', kind: 'more', title: '프레임워크에서는?', html: 'LangChain 에는 두 방식이 모두 있습니다: <code>create_tool_calling_agent</code>(함수 호출) 와 <code>create_react_agent</code>(텍스트). 07차시에서 전자를 주로 쓰고, LangGraph(08차시)의 <code>create_react_agent</code> 는 이름은 ReAct 지만 내부는 함수 호출 API 를 씁니다 — “생각하고 행동하는 루프”라는 뜻으로 이름만 남은 셈입니다. Ollama 로 돌리는 소형 로컬 모델에서는 아직 텍스트 ReAct 가 유용합니다.' },
          { type: 'callout', kind: 'info', title: '3교시 운영 메모', teacher: true, html: '<p>시간이 부족하면 3교시는 예제 4-13(실행)과 비교 표만 다루고 파서(4-15)는 과제로 돌려도 됩니다. 핵심 메시지는 하나입니다: <b>“도구 호출의 본질은 ‘무엇을 부를지 텍스트로 말하고, 코드가 실행하는 것’이며, 함수 호출 API 는 그 텍스트를 구조화한 것”</b>.</p>' }
        ],
        practice: [
          { title: '실습 4-6. 나만의 도구를 ReAct 로 부르기', level: 2,
            desc: '<p>실습 4-4 의 <code>km_to_mile</code> 도구를 <code>al.ReActAgent</code> 에 붙여 “42 km 는 몇 마일인지 계산해줘”를 실행하세요. 출력된 Thought · Action · Observation 줄 가운데 <b>코드가 채운 줄</b>이 무엇인지 주석으로 적어 보세요. 마지막에 <code>agent.transcript</code> 의 줄 수를 출력합니다.</p>',
            hint: '<code>al.ReActAgent(llm, tools=[km_to_mile])</code> → <code>.run(...)</code>. Observation 줄이 코드가 채운 줄입니다.',
            starter: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
# TODO: ReActAgent 로 실행하고 최종 답과 transcript 줄 수 출력
`,
            solution: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[km_to_mile])
answer = agent.run('42 km 는 몇 마일인지 계산해줘')   # Observation 줄만 코드가 채운다
print('최종 답:', answer)
print('기록 줄 수:', len(agent.transcript.strip().split('\\n')))
`,
            expect: `Thought: "42 km 는 몇 마일인지 계산해줘" 에 답하려면 km_to_mile 도구가 필요하다.
Action: km_to_mile
Action Input: {"km": "42"}
Observation: {"result": 26.1, "unit": "mile"}
Thought: 관찰 결과로 충분히 답할 수 있다.
Final Answer: 계산 결과는 26.1 입니다.
최종 답: 계산 결과는 26.1 입니다.
기록 줄 수: 7` }
        ],
        quiz: QUIZ3,
        slides: [
          { layout: 'title', title: 'ReAct: 텍스트로 도구 부르기', subtitle: '함수 호출 API 가 없어도 동작하는 방식', notes: '<p><b>발문:</b> “2023년 6월 이전에는 함수 호출 API 가 없었다. 그럼 에이전트를 어떻게 만들었을까?” → 약속된 텍스트 형식.</p>' },
          { layout: 'diagram', title: '함수 호출 API vs ReAct', html: FIG_REACT, caption: '구조화된 필드 vs 약속된 텍스트 줄',
            notes: '<p>왼쪽은 1·2교시에서 본 것. 오른쪽의 네 줄(Thought / Action / Action Input / Observation)을 소리 내어 읽고 “누가 쓰는 줄인가”를 묻습니다 — Observation 만 코드.</p>' },
          { layout: 'code', title: 'ReAct 시스템 프롬프트', code: `import agentlab as al
from agentlab.agent import REACT_PROMPT

tools = al.ToolRegistry([al.calculator, al.get_weather])
print(REACT_PROMPT.format(tools=tools.describe()))`, points: ['도구 목록을 <b>글</b>로 적음', '형식을 “정확히” 지키라고 지시', 'Observation 은 시스템이 채운다'],
            notes: '<p>▶ 실행해 프롬프트 전문을 보여 줍니다. “스키마 대신 describe() 한 줄”이라는 점에서 설명문이 여전히 중요하다는 것을 연결.</p>' },
          { layout: 'code', title: 'ReActAgent 실행', code: `import agentlab as al

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[al.calculator, al.wiki_search])
print(agent.run('12 * 12 는?'))
print('---')
print(agent.transcript)`, points: ['LLM: Thought · Action · Action Input', '코드: Observation', '“Final Answer:” 가 나오면 종료'],
            notes: '<p>▶ 실행. 출력 줄마다 “LLM / 코드” 라벨을 학생이 붙이게 합니다. transcript 전체가 매 호출마다 다시 전송된다는 비용 이야기도.</p>' },
          { layout: 'code', title: '미니 ReAct 파서', code: `import re, json

def parse_react(text):
    m = re.search(r'Final Answer:\\s*(.*)', text, re.S)
    if m:
        return ('final', m.group(1).strip())
    am = re.search(r'Action:\\s*([\\w\\-]+)', text)
    im = re.search(r'Action Input:\\s*(.*)', text, re.S)
    if not am:
        return ('error', 'Action 줄 없음')
    try:
        return ('action', am.group(1), json.loads(im.group(1).strip()))
    except json.JSONDecodeError:
        return ('error', 'JSON 아님')

print(parse_react('Action: calculator\\nAction Input: {"expression": "1+1"}'))
print(parse_react('Action - calculator\\nAction Input: 1+1'))`, points: ['정규식으로 줄 찾기', '형식을 조금만 어겨도 실패', '→ 함수 호출 API 가 등장한 이유'],
            notes: '<p>▶ 실행. 두 번째가 error 인 것을 보여 주고 “실제 모델은 이런 변형을 자주 낸다”고 설명. 재시도 프롬프트 전략도 언급.</p>' },
          { layout: 'table', title: '두 방식 비교', head: ['', '함수 호출 API', 'ReAct 텍스트'], rows: [
            ['요청 위치', '별도 필드 <code>tool_calls</code>', '“Action:” 줄'],
            ['인자', 'JSON 스키마 보장', '정규식 파싱'],
            ['동시 호출', '가능', '하나씩'],
            ['모델 요구', '공급자 지원 필요', '텍스트만 되면 OK'],
            ['쓰임', '실무 기본', '학습 · 소형 로컬 모델']
          ], notes: '<p>결론: 실무는 함수 호출, 원리와 소형 모델은 ReAct. 06차시에서 ReAct 의 “Thought” 가 계획 기법으로 다시 등장함을 예고.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ3[0].q, options: QUIZ3[0].options, answer: QUIZ3[0].answer, explain: QUIZ3[0].explain, notes: '<p>예제 4-13 출력을 다시 띄워 Observation 줄을 가리키며 확인.</p>' },
          { layout: 'practice', title: '실습 4-6. 나만의 도구를 ReAct 로', desc: '<p><code>km_to_mile</code> 을 <code>ReActAgent</code> 에 붙여 실행하고, 코드가 채운 줄을 찾아 보세요.</p>',
            starter: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
# TODO: ReActAgent 로 '42 km 는 몇 마일인지 계산해줘' 실행`, solution: `import agentlab as al

@al.tool
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다

    km: 거리(킬로미터)
    """
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

llm = al.LLM()
agent = al.ReActAgent(llm, tools=[km_to_mile])
print(agent.run('42 km 는 몇 마일인지 계산해줘'))`, notes: '<p>⏱ 8분. 2교시 함수 호출 Agent 와 같은 도구 · 같은 질문으로 출력 형식만 다르다는 것을 나란히 비교.</p>' },
          { layout: 'summary', title: '정리', bullets: ['ReAct = <b>Thought · Action · Action Input · Observation</b> 텍스트 약속', 'Observation 만 코드가 채운다 · “Final Answer:” 로 종료', '정규식 파싱은 깨지기 쉽다 → 함수 호출 API 가 구조화', '실무 기본은 함수 호출, ReAct 는 학습 · 소형 모델 · 계획 기법(06차시)', '다음 차시: 기억 — 에이전트가 대화를 잊지 않게'], notes: '<p>⏱ 8분. 과제: Colab 04 의 원본 SDK 함수 호출 셀 실행. 다음 차시 예고: “LLM 은 방금 한 말도 기억 못 한다”.</p>' }
        ]
      }
    ]
  });
})();
