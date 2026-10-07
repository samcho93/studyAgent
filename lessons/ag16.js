/* 16차시 agentBuilder 시작하기: 노드 · 그래프 · 실행 · 코드 내보내기 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;
  const IMG = (name, alt) => `<img src="img/builder/${name}.png" alt="${alt}" loading="lazy">`;

  /* 코드로 배운 것 ↔ 노드로 조립 */
  const FIG_WHY = `<svg viewBox="0 0 720 300" role="img" aria-label="왼쪽은 02차시에서 쓴 agentlab 코드, 오른쪽은 같은 구조를 노드 네 개로 조립한 agentBuilder 그래프. 가운데 화살표에 같은 구조라고 쓰여 있다">
  ${ARROW('m16a1')}
  <rect x="15" y="15" width="300" height="240" rx="14" class="p1s"/>
  <text x="165" y="45" text-anchor="middle" class="tx-b">💻 코드로 (02 · 03차시)</text>
  <text x="35" y="85" class="tx">import agentlab as al</text>
  <text x="35" y="110" class="tx">llm = <tspan class="tx-b">al.LLM()</tspan></text>
  <text x="35" y="135" class="tx">answer = llm.<tspan class="tx-b">ask</tspan>(<tspan class="tx-b">question</tspan>,</text>
  <text x="95" y="158" class="tx">system_prompt=<tspan class="tx-b">'당신은 AI 선생님'</tspan>)</text>
  <text x="35" y="185" class="tx"><tspan class="tx-b">print</tspan>(answer)</text>
  <text x="165" y="230" text-anchor="middle" class="tx-m">변수 하나 = 값 하나 · 함수 호출 = 처리 단계</text>
  <rect x="330" y="120" width="60" height="40" rx="8" class="p2"/><text x="360" y="145" text-anchor="middle" class="tx-w">같은 구조</text>
  <line x1="317" y1="140" x2="328" y2="140" class="ln" stroke-width="2"/>
  <line x1="392" y1="140" x2="402" y2="140" class="ln" stroke-width="2" marker-end="url(#m16a1)"/>
  <rect x="405" y="15" width="300" height="240" rx="14" class="p2s"/>
  <text x="555" y="45" text-anchor="middle" class="tx-b">🧩 노드로 (agentBuilder)</text>
  <rect x="420" y="75" width="80" height="40" rx="8" class="p1"/><text x="460" y="100" text-anchor="middle" class="tx-w">▶ 질문</text>
  <rect x="420" y="170" width="80" height="40" rx="8" class="p3"/><text x="460" y="195" text-anchor="middle" class="tx-w">🧠 LLM 모델</text>
  <rect x="530" y="110" width="90" height="56" rx="8" class="p1"/><text x="575" y="133" text-anchor="middle" class="tx-w">💬 LLM 호출</text><text x="575" y="153" text-anchor="middle" class="tx-w">역할 · 프롬프트</text>
  <rect x="640" y="118" width="55" height="40" rx="8" class="p5"/><text x="667" y="143" text-anchor="middle" class="tx-w">🏁 결과</text>
  <line x1="502" y1="95" x2="526" y2="125" class="ln" stroke-width="2" marker-end="url(#m16a1)"/>
  <line x1="502" y1="190" x2="526" y2="155" class="ln" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#m16a1)"/>
  <line x1="622" y1="138" x2="636" y2="138" class="ln" stroke-width="2" marker-end="url(#m16a1)"/>
  <text x="555" y="230" text-anchor="middle" class="tx-m">노드 = 코드 몇 줄 · 간선 = 변수 전달</text>
  <text x="360" y="285" text-anchor="middle" class="tx-b">빠르게 실험 · JSON 으로 공유 · 🐍 코드 탭에서 언제든 코드로 되돌아온다</text>
</svg>`;

  /* 화면 구성 ①~⑤ */
  const FIG_SCREEN = `<svg viewBox="0 0 720 330" role="img" aria-label="agentBuilder 화면 구성: 위 상단 바, 왼쪽 팔레트, 가운데 캔버스, 오른쪽 속성·코드·JSON 패널, 아래 실행·결과 패널">
  <rect x="10" y="10" width="700" height="310" rx="12" class="card-bg"/>
  <rect x="18" y="18" width="684" height="36" rx="8" class="p1"/>
  <text x="360" y="42" text-anchor="middle" class="tx-w">① 상단 바 — 📄 새로 · 📂 열기 · 💾 저장 · 📚 예제 · ▶ 실행(F5) · ■ 중지 · 🔑 키 관리 · 📘 튜토리얼</text>
  <rect x="18" y="62" width="130" height="170" rx="8" class="p2s"/>
  <text x="83" y="86" text-anchor="middle" class="tx-b">② 팔레트</text>
  <text x="83" y="108" text-anchor="middle" class="tx-m">🔍 검색</text>
  <text x="83" y="130" text-anchor="middle" class="tx-m">입출력 · LLM</text>
  <text x="83" y="150" text-anchor="middle" class="tx-m">도구 · 에이전트</text>
  <text x="83" y="170" text-anchor="middle" class="tx-m">기억 · 흐름 · 팀</text>
  <text x="83" y="190" text-anchor="middle" class="tx-m">안전 · MCP · Skill</text>
  <text x="83" y="218" text-anchor="middle" class="tx-m">드래그 / 클릭 → 추가</text>
  <rect x="156" y="62" width="370" height="170" rx="8" class="bg"/>
  <text x="341" y="86" text-anchor="middle" class="tx-b">③ 캔버스</text>
  <rect x="175" y="120" width="70" height="34" rx="6" class="p1"/><text x="210" y="142" text-anchor="middle" class="tx-w">▶ 입력</text>
  <rect x="175" y="175" width="70" height="34" rx="6" class="p3"/><text x="210" y="197" text-anchor="middle" class="tx-w">🧠 LLM</text>
  <rect x="300" y="140" width="80" height="40" rx="6" class="p1"/><text x="340" y="165" text-anchor="middle" class="tx-w">💬 호출</text>
  <rect x="430" y="143" width="70" height="34" rx="6" class="p5"/><text x="465" y="165" text-anchor="middle" class="tx-w">🏁 결과</text>
  <line x1="245" y1="137" x2="300" y2="155" class="ln" stroke-width="2"/>
  <line x1="245" y1="192" x2="300" y2="170" class="ln" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="380" y1="160" x2="430" y2="160" class="ln" stroke-width="2"/>
  <text x="341" y="222" text-anchor="middle" class="tx-m">빈 곳 드래그 = 이동 · 휠 = 확대/축소 · 포트(●)를 끌어 연결 · 선 더블클릭 = 삭제</text>
  <rect x="534" y="62" width="168" height="170" rx="8" class="p3s"/>
  <text x="618" y="86" text-anchor="middle" class="tx-b">④ 속성 · 코드 · JSON</text>
  <text x="618" y="112" text-anchor="middle" class="tx-m">🛠 선택한 노드의 설정</text>
  <text x="618" y="134" text-anchor="middle" class="tx-m">(역할 · 프롬프트 · 키 …)</text>
  <text x="618" y="164" text-anchor="middle" class="tx-m">🐍 Python 코드 탭</text>
  <text x="618" y="186" text-anchor="middle" class="tx-m">💾 .py · 📦 ZIP</text>
  <text x="618" y="214" text-anchor="middle" class="tx-m">{ } 그래프 JSON 탭</text>
  <rect x="18" y="240" width="684" height="72" rx="8" class="p5s"/>
  <text x="360" y="264" text-anchor="middle" class="tx-b">⑤ 실행 / 결과</text>
  <text x="360" y="288" text-anchor="middle" class="tx-m">시작 입력 칸 · 노드별 로그(▶ 시작 · ↗ LLM 호출 · 🔧 도구 · ✔ 완료) · 결과 탭(결과 노드마다 카드) · ✅ 토큰 사용량</text>
</svg>`;

  /* 노드 · 포트 · 간선 */
  const FIG_NODE = `<svg viewBox="0 0 720 320" role="img" aria-label="LLM 호출 노드를 중심으로 왼쪽 입력 포트(LLM 필수, 입력, 참고)와 오른쪽 출력 포트(답변, JSON), 시작 입력과 LLM 모델 노드에서 들어오는 간선, 결과 노드로 나가는 간선을 보여 주는 해부도">
  ${ARROW('m16a2')}
  <rect x="20" y="60" width="130" height="50" rx="10" class="p1s"/><text x="85" y="82" text-anchor="middle" class="tx-b">▶ 시작 입력</text><text x="85" y="100" text-anchor="middle" class="tx-m">출력 포트 text</text>
  <circle cx="150" cy="85" r="6" class="p1"/>
  <rect x="20" y="180" width="130" height="50" rx="10" class="p3s"/><text x="85" y="202" text-anchor="middle" class="tx-b">🧠 LLM 모델</text><text x="85" y="220" text-anchor="middle" class="tx-m">출력 포트 llm</text>
  <circle cx="150" cy="205" r="6" class="p3"/>
  <rect x="270" y="40" width="200" height="200" rx="12" class="card-bg"/>
  <text x="370" y="68" text-anchor="middle" class="tx-b">💬 LLM 호출 (type: chat)</text>
  <text x="370" y="88" text-anchor="middle" class="tx-m">config: system · prompt · json_mode</text>
  <circle cx="270" cy="120" r="7" class="p3"/><text x="285" y="124" class="tx">LLM <tspan class="tx-b">*</tspan> (llm)</text>
  <circle cx="270" cy="160" r="7" class="p1"/><text x="285" y="164" class="tx">입력 (text)</text>
  <circle cx="270" cy="200" r="7" class="p1"/><text x="285" y="204" class="tx">참고 (text)</text>
  <circle cx="470" cy="130" r="7" class="p1"/><text x="455" y="134" text-anchor="end" class="tx">답변 (text)</text>
  <circle cx="470" cy="180" r="7" class="p1"/><text x="455" y="184" text-anchor="end" class="tx">JSON (text)</text>
  <rect x="560" y="105" width="130" height="50" rx="10" class="p5s"/><text x="625" y="127" text-anchor="middle" class="tx-b">🏁 결과</text><text x="625" y="145" text-anchor="middle" class="tx-m">입력 포트 값 *</text>
  <circle cx="560" cy="130" r="6" class="p1"/>
  <path d="M156 85 C 210 85, 210 160, 263 160" class="ln" fill="none" stroke-width="2" marker-end="url(#m16a2)"/>
  <path d="M156 205 C 210 205, 210 120, 263 120" class="ln" fill="none" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#m16a2)"/>
  <path d="M477 130 C 515 130, 515 130, 553 130" class="ln" fill="none" stroke-width="2" marker-end="url(#m16a2)"/>
  <text x="205" y="150" text-anchor="middle" class="tx-m">간선(edge)</text>
  <text x="205" y="245" text-anchor="middle" class="tx-m">자원 간선(점선)</text>
  <text x="20" y="280" class="tx-b">포트 색 = 값의 종류:</text>
  <circle cx="190" cy="276" r="6" class="p1"/><text x="202" y="280" class="tx">text (값이 흐른다)</text>
  <circle cx="340" cy="276" r="6" class="p3"/><text x="352" y="280" class="tx">llm</text>
  <circle cx="400" cy="276" r="6" class="p2"/><text x="412" y="280" class="tx">tool</text>
  <circle cx="465" cy="276" r="6" class="p4"/><text x="477" y="280" class="tx">memory · agent · task …</text>
  <text x="20" y="308" class="tx-m">* = 반드시 연결 · ■(네모) = 여러 개 연결 가능(tools*) · 같은 종류의 포트끼리만 이어진다</text>
</svg>`;

  /* 키 보호 */
  const FIG_KEYS = `<svg viewBox="0 0 720 300" role="img" aria-label="브라우저의 그래프에는 key_ref 이름만 있고, 서버 금고 모드에서는 서버 프록시가 키를 끼워 LLM 을 부르며, 세션 모드에서는 탭의 sessionStorage 에만 키가 있다. 그래프 JSON, 코드, 로그에는 키가 없다">
  ${ARROW('m16a3')}
  <rect x="15" y="20" width="200" height="120" rx="12" class="p1s"/>
  <text x="115" y="45" text-anchor="middle" class="tx-b">🌐 브라우저 · 그래프</text>
  <text x="115" y="72" text-anchor="middle" class="tx">"provider": "gemini"</text>
  <text x="115" y="94" text-anchor="middle" class="tx">"key_ref": <tspan class="tx-b">"gemini"</tspan></text>
  <text x="115" y="122" text-anchor="middle" class="tx-m">키 값이 아니라 이름만!</text>
  <rect x="290" y="20" width="200" height="55" rx="12" class="p3"/>
  <text x="390" y="43" text-anchor="middle" class="tx-w">🔒 서버 금고 (기본)</text><text x="390" y="63" text-anchor="middle" class="tx-w">암호화 저장 · 프록시가 키를 끼움</text>
  <rect x="290" y="95" width="200" height="55" rx="12" class="p2"/>
  <text x="390" y="118" text-anchor="middle" class="tx-w">🕒 브라우저 세션 (서버 없을 때)</text><text x="390" y="138" text-anchor="middle" class="tx-w">sessionStorage · 탭 닫으면 삭제</text>
  <rect x="560" y="55" width="140" height="60" rx="12" class="p5"/>
  <text x="630" y="80" text-anchor="middle" class="tx-w">LLM 공급자</text><text x="630" y="100" text-anchor="middle" class="tx-w">Gemini · Groq …</text>
  <line x1="217" y1="55" x2="286" y2="45" class="ln" stroke-width="2" marker-end="url(#m16a3)"/>
  <line x1="217" y1="110" x2="286" y2="122" class="ln" stroke-width="2" marker-end="url(#m16a3)"/>
  <line x1="492" y1="47" x2="556" y2="75" class="ln" stroke-width="2" marker-end="url(#m16a3)"/>
  <line x1="492" y1="122" x2="556" y2="98" class="ln" stroke-width="2" marker-end="url(#m16a3)"/>
  <text x="250" y="38" text-anchor="middle" class="tx-m">키 1회 저장</text>
  <rect x="15" y="175" width="690" height="105" rx="12" class="card-bg"/>
  <text x="360" y="200" text-anchor="middle" class="tx-b">키가 절대 들어가지 않는 곳</text>
  <text x="130" y="230" text-anchor="middle" class="tx">{ } 그래프 JSON</text><text x="130" y="252" text-anchor="middle" class="tx-m">key_ref 이름만 → 파일 공유 OK</text>
  <text x="360" y="230" text-anchor="middle" class="tx">🐍 내보낸 파이썬 코드</text><text x="360" y="252" text-anchor="middle" class="tx-m">os.environ['GEMINI_API_KEY'] · .env</text>
  <text x="590" y="230" text-anchor="middle" class="tx">⑤ 실행 로그</text><text x="590" y="252" text-anchor="middle" class="tx-m">파이썬은 vault:gemini 자리표시자만 봄</text>
  <text x="360" y="274" text-anchor="middle" class="tx-m">00차시의 원칙 그대로: 키는 코드 · 저장소 · 로그에 두지 않는다</text>
</svg>`;

  /* 그래프 JSON → 엔진 → 코드 */
  const FIG_FLOW = `<svg viewBox="0 0 720 280" role="img" aria-label="그래프 JSON 이 가운데 있고, 위로는 engine.run_graph 가 이벤트를 내며 결과를 만들고, 아래로는 export.export_python 이 hello.py 를 만들어 python hello.py 질문 으로 실행하는 두 갈래 흐름">
  ${ARROW('m16a4')}
  <rect x="15" y="95" width="170" height="90" rx="12" class="p1"/>
  <text x="100" y="122" text-anchor="middle" class="tx-w">{ } 그래프 JSON</text>
  <text x="100" y="145" text-anchor="middle" class="tx-w">version · name · nodes</text>
  <text x="100" y="165" text-anchor="middle" class="tx-w">edges · settings</text>
  <rect x="260" y="20" width="200" height="80" rx="12" class="p2s"/>
  <text x="360" y="45" text-anchor="middle" class="tx-b">engine.run_graph(g, emit=…)</text>
  <text x="360" y="67" text-anchor="middle" class="tx-m">위상 순서로 노드 실행</text>
  <text x="360" y="87" text-anchor="middle" class="tx-m">이벤트: node_start · log · result · done</text>
  <rect x="520" y="30" width="185" height="60" rx="12" class="p2"/>
  <text x="612" y="55" text-anchor="middle" class="tx-w">⑤ 실행 로그 · 결과 카드</text>
  <text x="612" y="77" text-anchor="middle" class="tx-w">(브라우저 · run_graph.py)</text>
  <rect x="260" y="180" width="200" height="80" rx="12" class="p3s"/>
  <text x="360" y="205" text-anchor="middle" class="tx-b">export.export_python(g)</text>
  <text x="360" y="227" text-anchor="middle" class="tx-m">노드 하나 → 코드 몇 줄</text>
  <text x="360" y="247" text-anchor="middle" class="tx-m">분기 = if · 반복 = for · 키 = .env</text>
  <rect x="520" y="190" width="185" height="60" rx="12" class="p3"/>
  <text x="612" y="215" text-anchor="middle" class="tx-w">🐍 hello.py (+ agentlab/)</text>
  <text x="612" y="237" text-anchor="middle" class="tx-w">python hello.py "질문"</text>
  <line x1="187" y1="120" x2="256" y2="70" class="ln" stroke-width="2" marker-end="url(#m16a4)"/>
  <line x1="187" y1="160" x2="256" y2="210" class="ln" stroke-width="2" marker-end="url(#m16a4)"/>
  <line x1="462" y1="60" x2="516" y2="60" class="ln" stroke-width="2" marker-end="url(#m16a4)"/>
  <line x1="462" y1="220" x2="516" y2="220" class="ln" stroke-width="2" marker-end="url(#m16a4)"/>
  <text x="100" y="215" text-anchor="middle" class="tx-m">💾 저장 · 📂 열기</text>
  <text x="100" y="237" text-anchor="middle" class="tx-m">run_graph.py 파일.json</text>
  <text x="360" y="140" text-anchor="middle" class="tx-b">같은 JSON · 두 가지 사용법</text>
</svg>`;

  /* 실행 순서: 자료 포트 vs 자원 포트 (예제 02) */
  const FIG_ORDER = `<svg viewBox="0 0 720 300" role="img" aria-label="예제 02 그래프의 노드 일곱 개에 실행 순서 번호가 붙어 있다. 값이 흐르는 자료 간선은 실선, LLM 모델에서 나오는 자원 간선은 점선이다">
  ${ARROW('m16a5')}
  <rect x="15" y="60" width="110" height="46" rx="10" class="p1"/><text x="70" y="79" text-anchor="middle" class="tx-w">① n1 고객 리뷰</text><text x="70" y="97" text-anchor="middle" class="tx-w">input</text>
  <rect x="15" y="200" width="110" height="46" rx="10" class="p3"/><text x="70" y="219" text-anchor="middle" class="tx-w">② n2 LLM</text><text x="70" y="237" text-anchor="middle" class="tx-w">llm</text>
  <rect x="190" y="30" width="120" height="46" rx="10" class="p1"/><text x="250" y="49" text-anchor="middle" class="tx-w">③ n3 요약 프롬프트</text><text x="250" y="67" text-anchor="middle" class="tx-w">template</text>
  <rect x="380" y="30" width="120" height="46" rx="10" class="p1"/><text x="440" y="49" text-anchor="middle" class="tx-w">④ n4 요약</text><text x="440" y="67" text-anchor="middle" class="tx-w">chat (CS 담당자)</text>
  <rect x="380" y="150" width="120" height="46" rx="10" class="p1"/><text x="440" y="169" text-anchor="middle" class="tx-w">⑤ n5 감성 분류</text><text x="440" y="187" text-anchor="middle" class="tx-w">chat (JSON)</text>
  <rect x="570" y="30" width="120" height="46" rx="10" class="p5"/><text x="630" y="49" text-anchor="middle" class="tx-w">⑥ n6 요약</text><text x="630" y="67" text-anchor="middle" class="tx-w">output</text>
  <rect x="570" y="150" width="120" height="46" rx="10" class="p5"/><text x="630" y="169" text-anchor="middle" class="tx-w">⑦ n7 감성</text><text x="630" y="187" text-anchor="middle" class="tx-w">output</text>
  <line x1="127" y1="75" x2="186" y2="58" class="ln" stroke-width="2" marker-end="url(#m16a5)"/>
  <line x1="127" y1="90" x2="376" y2="165" class="ln" stroke-width="2" marker-end="url(#m16a5)"/>
  <line x1="312" y1="53" x2="376" y2="53" class="ln" stroke-width="2" marker-end="url(#m16a5)"/>
  <line x1="502" y1="53" x2="566" y2="53" class="ln" stroke-width="2" marker-end="url(#m16a5)"/>
  <line x1="502" y1="173" x2="566" y2="173" class="ln" stroke-width="2" marker-end="url(#m16a5)"/>
  <line x1="127" y1="215" x2="376" y2="70" class="ln" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#m16a5)"/>
  <line x1="127" y1="225" x2="376" y2="185" class="ln" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#m16a5)"/>
  <text x="360" y="265" text-anchor="middle" class="tx-b">실선 = 자료(text) 간선: 값이 흐른다 · 점선 = 자원(llm · tool …) 간선: 도구 상자를 건네준다</text>
  <text x="360" y="288" text-anchor="middle" class="tx-m">순서 = 들어오는 간선이 없는 노드부터(위상 정렬) · 같은 순위면 노드 목록 순서 · 되돌아가는 간선은 제외(17차시 반복)</text>
</svg>`;

  const QUIZ1 = [
    { q: '빌더에서 포트가 <b>같은 색끼리만</b> 연결되는 이유로 가장 알맞은 것은?', options: ['보기 좋게 하려고', '포트 색이 <b>값의 종류</b>(text · llm · tool …)를 뜻하므로 종류가 다른 값은 건넬 수 없어서', '노드마다 색이 정해져 있어서', '간선 수를 제한하려고'], answer: 1,
      explain: '포트 색 = 종류입니다. LLM 모델 노드의 <code>llm</code> 출력은 LLM 포트에만, 텍스트는 text 포트에만 이어집니다. 파이썬으로 보면 “타입이 맞는 변수만 인자로 넘길 수 있다”는 뜻입니다.' },
    { q: '포트 이름 옆의 <code>*</code> 표시는?', options: ['여러 개 연결 가능', '선택 사항', '<b>반드시 연결</b>해야 하는 필수 포트 — 비우면 <code>engine.validate</code> 가 오류를 돌려준다', '출력 전용'], answer: 2,
      explain: '<code>*</code> 는 필수 포트입니다. LLM 호출의 LLM 포트, 결과의 값 포트가 그렇습니다. 여러 개 연결 가능한 포트는 네모(■)로 표시됩니다 (에이전트의 tools).' },
    { q: 'LLM 모델 노드에 Gemini 키를 넣고 저장했다. 그래프 JSON 에 남는 것은?', options: ['키 전체', '키의 앞 4자', '<code>"key_ref": "gemini"</code> 처럼 <b>이름만</b>', '아무것도 남지 않는다'], answer: 2,
      explain: '키 값은 서버 금고(암호화) 또는 브라우저 세션에만 저장되고, 그래프에는 어떤 키를 쓸지 가리키는 이름(<code>key_ref</code>)만 남습니다. 그래서 JSON 파일을 공유해도 키가 새지 않습니다.' },
    { q: '<code>engine.run_graph(g, overrides={\'n1\': \'부산 날씨는?\'})</code> 에서 <code>overrides</code> 의 역할은?', options: ['노드 n1 을 삭제한다', '시작 입력 노드 <code>n1</code> 의 값을 바꿔 실행한다 (빌더 실행 패널의 “시작 입력” 칸과 같다)', 'LLM 공급자를 바꾼다', '결과 제목을 바꾼다'], answer: 1,
      explain: '<code>overrides</code> 는 {시작 입력 노드 id: 값} 입니다. 그래프 파일은 그대로 두고 질문만 바꿔 실행할 때 씁니다. 속성(역할 · 프롬프트)을 바꾸려면 노드의 <code>config</code> dict 를 고칩니다.' }
  ];
  const QUIZ2 = [
    { q: '내보낸 파이썬 코드가 API 키를 얻는 방법은?', options: ['코드 안에 문자열로 들어 있다', '그래프 JSON 의 key_ref 값을 읽는다', '<b>환경 변수</b>(예: <code>GEMINI_API_KEY</code>) 또는 같은 폴더의 <b>.env</b> 파일에서 읽는다', '빌더 서버에 접속해 받아 온다'], answer: 2,
      explain: '<code>make_llm()</code> 은 <code>os.environ.get(p[\'env\'])</code> 로만 키를 읽습니다. 키가 없으면 모의 LLM 으로 실행된다고 경고합니다. <code>.env.example</code> 을 <code>.env</code> 로 복사해 채우고, <code>.env</code> 는 git 에 올리지 않습니다.' },
    { q: '빌더의 <b>LLM 호출</b> 노드는 내보낸 코드에서 어떤 agentlab 호출이 되는가?', options: ['<code>al.Agent(...).run()</code>', '<code>llm.chat([al.system(역할)] + [al.user(프롬프트)])</code>', '<code>al.PromptTemplate(...)</code>', '<code>al.VectorStore()</code>'], answer: 1,
      explain: 'LLM 호출 = 02 · 03차시의 <code>llm.ask(q, system_prompt=…)</code> 와 같은 한 번의 호출입니다. 프롬프트 템플릿은 <code>fmt()</code>, 에이전트 노드는 <code>al.Agent</code>, 결과 노드는 <code>print()</code> 가 됩니다.' },
    { q: '엔진이 노드의 <b>실행 순서</b>를 정하는 방법은?', options: ['캔버스의 왼쪽 → 오른쪽 좌표 순', '노드 id 의 알파벳 순', '간선을 따라 <b>들어오는 연결이 없는 노드부터</b> 차례로(위상 정렬, 되돌아가는 간선 제외)', 'LLM 이 순서를 정한다'], answer: 2,
      explain: '<code>engine.analyze(g)</code> 가 위상 정렬로 순서를 만듭니다. <code>x, y</code> 좌표는 화면 배치일 뿐 실행과 무관합니다. 같은 순위면 노드 목록 순서를 따르므로 결과는 늘 같습니다.' },
    { q: '내보낸 코드의 첫 줄 <code>question = sys.argv[1] if len(sys.argv) &gt; 1 else \'…\'</code> 의 뜻은?', options: ['항상 고정된 질문을 쓴다', '명령줄 인자(<code>python hello.py "질문"</code>)가 있으면 그것을, 없으면 노드에 적힌 기본 입력을 시작 입력으로 쓴다', 'LLM 이 질문을 만든다', '파일에서 질문을 읽는다'], answer: 1,
      explain: '첫 번째 시작 입력 노드는 명령줄 인자로 바꿀 수 있게 내보내집니다. <code>runpy</code> 로 실행할 때 <code>sys.argv</code> 를 먼저 설정한 이유입니다. <code>run_graph.py 파일.json "질문"</code> 도 같은 일을 합니다.' },
    { q: '📦 ZIP 으로 내려받은 패키지에 <b>들어 있지 않은</b> 것은?', options: ['<code>이름.py</code> 스크립트', '<code>agentlab/</code> 폴더', '<code>.env.example</code> 과 README', '내 API 키가 채워진 <code>.env</code>'], answer: 3,
      explain: 'ZIP 에는 실행에 필요한 코드와 빈 <code>.env.example</code> 이 들어가고, 키는 받는 사람이 직접 <code>.env</code> 에 채웁니다. 키가 든 파일을 묶어 배포하는 일은 절대 없습니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag16',
    no: '16',
    title: 'agentBuilder 시작하기: 노드 · 그래프 · 실행 · 코드 내보내기',
    subtitle: '빌더 화면 · 노드와 포트 · 첫 그래프 · 키 보호 · 실행 로그 · 그래프 JSON ↔ 파이썬 코드',
    summary: '지금까지 LLM 호출 · 도구 · 기억 · 계획 · 그래프 · 팀 · 가드레일을 모두 <b>코드로</b> 만들었습니다. <b>agentBuilder</b> 는 같은 구조를 <b>노드를 연결해 조립</b>하고, 브라우저에서 바로 실행하고, 우리가 쓰던 <code>agentlab</code> 코드로 <b>내보내는</b> 웹 빌더입니다. 이번 차시에서는 빌더의 화면과 노드 · 포트 · 간선을 익히고, 첫 그래프 <b>입력 → LLM 모델 → LLM 호출 → 결과</b>를 만들어 실행하며, 키가 그래프 · 코드 · 로그 어디에도 남지 않는 이유를 봅니다. 그다음 그래프 JSON 을 <b>파이썬으로 읽고 · 검증하고 · 실행하고 · 코드로 내보내</b> 노드 하나가 코드 몇 줄과 1:1 로 대응함을 확인합니다.',
    goals: [
      'agentBuilder 의 다섯 영역(상단 바 · 팔레트 · 캔버스 · 속성/코드/JSON · 실행/결과)과 노드 · 포트(색 = 종류, * = 필수) · 간선의 뜻을 설명할 수 있다',
      '첫 그래프(입력 → LLM 모델 → LLM 호출 → 결과)를 만들고 역할 · 프롬프트 · JSON 모드를 설정해 실행 로그를 읽을 수 있다',
      '서버 금고(<code>key_ref</code>)와 브라우저 세션 모드의 차이, 그리고 그래프 · 코드 · 로그에 키가 없는 이유를 설명할 수 있다',
      '그래프 JSON 을 파이썬으로 읽어 <code>engine.validate · run_graph</code> 로 검증 · 실행하고, 노드 설정과 연결을 코드로 바꿀 수 있다',
      '<code>export.export_python</code> 으로 내보낸 코드를 02 · 03차시의 agentlab 코드와 1:1 로 대응시키고, 파일로 저장해 실행할 수 있다'
    ],
    sections: [
      {
        id: 'ag16-1',
        title: '빌더 화면과 첫 그래프',
        minutes: 50,
        goals: ['코드로 배운 구조가 노드 · 간선으로 어떻게 보이는지 안다', '빌더의 다섯 영역과 노드 · 포트 · 간선 · 필수 포트를 구별한다', '첫 그래프를 만들어 실행하고, 키가 어디에 저장되는지 설명한다', '그래프 JSON 을 파이썬으로 읽고 · 검증하고 · 실행하고 · 고친다'],
        flow: [['도입 · 왜 빌더인가', 6], ['화면 · 노드 · 포트 · 간선', 12], ['첫 그래프 · 속성 · 키 · 실행', 14], ['파이썬으로 그래프 다루기', 12], ['퀴즈 · 정리', 6]],
        content: [
          { type: 'p', html: '13차시까지 우리는 에이전트의 모든 부품을 <b>코드로</b> 만들었고, 14 · 15차시에서 MCP 와 Agent Skills 로 그 부품을 표준에 맞게 바깥 세상과 연결했습니다. 이제 한 걸음 물러서서 전체 구조를 <b>그림으로</b> 다룹니다. <b>agentBuilder</b> 는 이 강좌에서 배운 구조를 노드로 조립하고 실행하고 코드로 내보내는 웹 빌더입니다. 새로운 이론은 없습니다 — 배운 것을 다른 각도에서 다시 보는 차시입니다.' },
          { type: 'h', text: '왜 코드를 배운 다음에 빌더인가' },
          { type: 'figure', html: FIG_WHY, caption: '그림 16-1. 02차시의 다섯 줄 코드와 빌더의 노드 네 개는 같은 구조입니다. 노드 하나 = 코드 몇 줄, 간선 하나 = 변수 전달.' },
          { type: 'list', items: [
            '<b>같은 구조</b>: 시작 입력(변수) → LLM 모델(<code>al.LLM()</code>) → LLM 호출(<code>llm.chat</code>) → 결과(<code>print</code>). 코드를 먼저 배웠기 때문에 노드가 무엇을 하는지 정확히 압니다.',
            '<b>빠른 실험</b>: 역할 문장을 고치고 ▶ 를 누르면 끝. 도구를 하나 더 붙이거나 분기를 넣는 실험이 몇 초입니다.',
            '<b>공유</b>: 그래프는 JSON 파일 하나. 친구에게 보내면 같은 에이전트가 그대로 열립니다 (키는 빠진 채로).',
            '<b>코드로 되돌아온다</b>: 🐍 코드 탭이 언제나 <code>agentlab</code> 스크립트를 만들어 줍니다. 빌더에 갇히지 않습니다.'
          ] },
          { type: 'callout', kind: 'info', title: '빌더 열기', html: '<ul><li>🌐 <a href="https://samcho93.github.io/agentBuilder/" target="_blank" rel="noopener">samcho93.github.io/agentBuilder</a> — 설치 없음, <b>브라우저 세션 모드</b>(키는 탭에만)</li><li>🌐 <a href="https://agentbuilder.pages.dev/" target="_blank" rel="noopener">agentbuilder.pages.dev</a> — <b>서버 금고 모드</b>(키를 암호화 저장)</li><li>💻 내 PC: <code>git clone https://github.com/samcho93/agentBuilder.git</code> → <code>python server/app.py</code> → <code>http://localhost:8090</code></li></ul>처음 열 때 파이썬 실행 환경(Pyodide)을 한 번 내려받습니다. 상단 오른쪽이 “파이썬 준비”로 바뀌면 실행할 수 있습니다. 키가 없어도 모든 예제가 <b>모의 LLM</b> 으로 동작합니다 — 이 강좌의 브라우저 실습과 똑같은 규칙입니다.' },
          { type: 'h', text: '화면 구성: 다섯 영역' },
          { type: 'figure', html: IMG('01_overview', 'agentBuilder 전체 화면 — 왼쪽 팔레트, 가운데 캔버스, 오른쪽 속성 패널, 아래 실행 패널'), caption: '그림 16-2. 빌더 전체 화면 (예제 01 을 연 모습).' },
          { type: 'figure', html: FIG_SCREEN, caption: '그림 16-3. 다섯 영역. ① 상단 바 ② 팔레트 ③ 캔버스 ④ 속성 · 코드 · JSON ⑤ 실행 · 결과.' },
          { type: 'table', head: ['영역', '하는 일', '자주 쓰는 조작'], rows: [
            ['① 상단 바', '프로젝트 이름 · 📄 새로 · 📂 열기 · 💾 저장(JSON) · 📚 예제 · ▶ 실행 · ■ 중지 · 🔑 키 관리 · 📘 튜토리얼', '<kbd>F5</kbd> 실행 · <kbd>Ctrl+S</kbd> 저장'],
            ['② 팔레트', '노드 목록(분류별). 위 검색창으로 이름 검색', '드래그 또는 클릭 → 캔버스에 추가'],
            ['③ 캔버스', '노드 배치 · 포트(●)를 끌어 연결', '빈 곳 드래그 = 이동 · 휠 = 확대/축소 · 선 더블클릭 = 삭제 · 노드 우클릭 = 복제/삭제 · <kbd>Ctrl+Z</kbd> 실행 취소 · ⇶ 자동 정렬'],
            ['④ 속성 · 코드 · JSON', '🛠 선택한 노드의 설정 / 🐍 생성된 파이썬 코드(💾 .py · 📦 ZIP) / { } 그래프 JSON', '노드 클릭 → 속성. 탭 전환'],
            ['⑤ 실행 · 결과', '시작 입력 칸 · 노드별 로그 · 결과 노드의 값 카드(📋 복사) · 토큰 사용량', '시작 입력에 다른 질문 → <kbd>Enter</kbd>']
          ], caption: '다섯 영역과 조작. 📘 튜토리얼 버튼을 누르면 빌더 안에서 캡처가 포함된 같은 안내를 볼 수 있습니다.' },
          { type: 'h', text: '노드 · 포트 · 간선' },
          { type: 'p', html: '캔버스의 상자 하나가 <b>노드(node)</b>, 노드 양옆의 ● 이 <b>포트(port)</b>, 포트와 포트를 잇는 선이 <b>간선(edge)</b> 입니다. 왼쪽 포트는 입력, 오른쪽 포트는 출력입니다. 가장 중요한 규칙 하나: <b>포트의 색은 값의 종류</b>입니다. 파랑(text)은 글이 흐르는 포트, 주황(llm)은 LLM 모델을 건네는 포트, 초록(tool)은 도구를 건네는 포트입니다. <b>같은 종류끼리만 연결</b>되므로 잘못 이을 걱정이 없습니다.' },
          { type: 'figure', html: FIG_NODE, caption: '그림 16-4. LLM 호출 노드의 해부. 왼쪽이 입력 포트(LLM 은 * 필수), 오른쪽이 출력 포트. 시작 입력의 text 는 입력 포트로, LLM 모델의 llm 은 LLM 포트로만 이어집니다.' },
          { type: 'table', head: ['포트 종류(kind)', '무엇이 흐르나', '예'], rows: [
            ['<code>text</code>', '글 · JSON 값 — <b>실행 중 값이 흐르는 자료 포트</b>', '시작 입력 → LLM 호출 입력, 답변 → 결과'],
            ['<code>llm</code>', 'LLM 모델 객체(<code>al.LLM</code>)', 'LLM 모델 → LLM 호출 · 에이전트 · 기억'],
            ['<code>tool</code>', '도구(<code>al.Tool</code>)', '내장 도구 · 파이썬 도구 → 에이전트의 tools■'],
            ['<code>memory</code> · <code>agent</code> · <code>task</code>', '대화 기억 · Crew 역할 · 작업', '05 · 09차시 구조 (17차시)'],
            ['<code>mcp</code> · <code>resource</code> · <code>prompt</code> · <code>skill</code>', 'MCP 서버 · 리소스 · 프롬프트 · 스킬', '14 · 15차시 구조']
          ], caption: '포트 종류. text 만 “값”이고 나머지는 “자원”(도구 상자)을 건네는 포트입니다 — 2교시 실행 순서에서 이 구분이 다시 나옵니다.' },
          { type: 'code', title: '예제 16-1. 노드 카탈로그에서 포트 읽기', code: `from builder import nodes

cat = nodes.catalog()
print('노드 종류:', len(cat['nodes']), '개 · 분류:', [c['label'] for c in cat['categories']])
for t in ['input', 'llm', 'chat', 'template', 'output']:
    nt = next(n for n in cat['nodes'] if n['type'] == t)
    ins = ', '.join(f"{p['name']}:{p['kind']}{'*' if p.get('required') else ''}" for p in nt['inputs'])
    outs = ', '.join(f"{p['name']}:{p['kind']}" for p in nt['outputs'])
    print(f"{nt['icon']} {nt['label']:<10} type={t:<9} in({ins})  out({outs})")`,
            expect: `노드 종류: 36 개 · 분류: ['입출력', 'LLM 모델', '도구', '에이전트', '기억', '흐름 제어', '에이전트 팀', '평가 · 안전', 'MCP 서버 · 클라이언트', 'Skill (에이전트 스킬)']
▶ 시작 입력      type=input     in()  out(text:text)
🧠 LLM 모델     type=llm       in()  out(llm:llm)
💬 LLM 호출     type=chat      in(llm:llm*, input:text, context:text)  out(text:text, json:text)
🧩 프롬프트 템플릿   type=template  in()  out(text:text)
🏁 결과         type=output    in(value:text*)  out()`,
            desc: '빌더의 실행 엔진(<code>builder</code> 패키지)이 이 강좌에도 들어 있어 브라우저에서 바로 import 됩니다. 팔레트의 36종 노드가 모두 이 카탈로그에서 나옵니다. <code>llm*</code> 처럼 <code>*</code> 가 붙은 포트는 반드시 연결해야 하고, 프롬프트 템플릿의 입력 포트는 템플릿에 쓴 <code>{이름}</code> 마다 자동으로 생기므로 카탈로그에는 비어 있습니다.' },
          { type: 'h', text: '첫 그래프 만들기: 입력 → LLM 모델 → LLM 호출 → 결과' },
          { type: 'p', html: '02차시의 첫 LLM 호출을 노드로 만듭니다. 📚 예제 → <b>01 첫 LLM 호출</b>을 열어도 되지만, 한 번은 빈 캔버스에서 직접 만들어 보세요.' },
          { type: 'list', ordered: true, items: [
            '상단 <b>📄 새로</b> → 빈 캔버스. 팔레트에서 <b>시작 입력 · LLM 모델 · LLM 호출 · 결과</b> 네 노드를 드래그(또는 클릭)해 놓습니다. 검색창에 “LLM”을 치면 빨리 찾습니다.',
            '<b>시작 입력</b>의 text 출력 ● 을 끌어 <b>LLM 호출</b>의 <b>입력</b> 포트에 놓습니다. 점선이 따라오다가 같은 종류의 포트 위에서만 붙습니다.',
            '<b>LLM 모델</b> → LLM 호출의 <b>LLM *</b> 포트, <b>LLM 호출</b>의 답변 → <b>결과</b>의 <b>값 *</b> 포트도 연결합니다. 잘못 이었으면 선을 더블클릭해 지우거나 입력 포트를 끌어 다른 곳으로 옮깁니다.',
            '시작 입력을 클릭해 기본 입력에 질문을 쓰고 <b>▶ 실행</b>(<kbd>F5</kbd>). 아래 실행 패널에 로그가 흐르고 결과 탭에 답이 나옵니다.'
          ] },
          { type: 'figure', html: IMG('02_palette', '팔레트 — 분류별 노드 목록과 검색창'), caption: '그림 16-5. 팔레트. 분류별 노드 목록 · 검색창.' },
          { type: 'figure', html: IMG('03_add_nodes', '노드 네 개를 캔버스에 추가한 모습'), caption: '그림 16-6. 노드 네 개를 추가한 모습. 왼쪽 ● 은 입력 포트, 오른쪽 ● 은 출력 포트.' },
          { type: 'figure', html: IMG('04_connect_drag', '포트를 끌어 연결하는 중 — 점선이 따라온다'), caption: '그림 16-7. 포트를 끌면 점선이 따라오고, 같은 종류의 입력 포트 위에서 놓으면 간선이 됩니다.' },
          { type: 'h', text: '속성: 역할(시스템 프롬프트) · 프롬프트 · JSON' },
          { type: 'p', html: '노드를 클릭하면 오른쪽 🛠 속성에 그 노드의 설정이 보입니다. LLM 호출 노드의 세 설정은 03차시에서 배운 것 그대로입니다.' },
          { type: 'figure', html: IMG('05_props_chat_panel', 'LLM 호출 노드의 속성 패널 — 시스템 프롬프트, 프롬프트, JSON 모드'), caption: '그림 16-8. LLM 호출 노드의 속성. 설명 · 시스템 프롬프트(역할) · 프롬프트 · JSON 으로 답하게.' },
          { type: 'table', head: ['속성', '뜻', '강좌의 코드'], rows: [
            ['시스템 프롬프트(역할)', '“당신은 친절한 AI 선생님입니다” — 역할 · 말투 · 규칙. 모의 LLM 은 답 앞에 <code>[역할]</code> 을 붙입니다', '<code>al.system(…)</code> · <code>llm.ask(q, system_prompt=…)</code> (03차시)'],
            ['프롬프트', '<code>{input}</code> 자리에 입력 포트 값, <code>{context}</code> 자리에 참고 포트 값이 들어갑니다. 기본값 <code>{input}</code>', '<code>al.user(prompt)</code> · f-string'],
            ['JSON 으로 답하게', '켜면 <b>JSON</b> 출력 포트로 파싱된 dict 가 나옵니다 (감성 분류 · 정보 추출)', '<code>llm.chat(…, json_mode=True)</code> → <code>r.json()</code> (03차시)'],
            ['노드 이름(맨 위)', '캔버스에 보이는 이름. 내보낸 코드의 주석이 됩니다', '—']
          ], caption: 'LLM 호출 노드의 속성과 강좌 코드의 대응. 여러 노드의 출력을 한 프롬프트로 합치려면 <b>프롬프트 템플릿</b> 노드를 씁니다 (2교시 실습).' },
          { type: 'h', text: 'API 키: 서버 금고 vs 브라우저 세션 — 그래프 · 코드 · 로그에는 키가 없다' },
          { type: 'p', html: '<b>LLM 모델</b> 노드에서 공급자(Gemini · Groq · OpenRouter · Ollama …)를 고르고 키를 붙여 넣어 저장하면, 노드에는 <code>🔑 gemini</code> 라는 <b>이름(<code>key_ref</code>)</b>만 남습니다. 키 값은 두 가지 방식 중 하나로 보관됩니다.' },
          { type: 'figure', html: FIG_KEYS, caption: '그림 16-9. 키의 경로. 그래프에는 key_ref 이름만, 키 값은 서버 금고(암호화) 또는 탭의 sessionStorage 에만. 그래프 JSON · 내보낸 코드 · 실행 로그 어디에도 키가 없습니다.' },
          { type: 'table', head: ['모드', '키 저장 위치', '실행 시 호출 경로', '언제'], rows: [
            ['🔒 서버 금고 (기본)', '서버가 <b>암호화</b>해 보관 (Cloudflare KV 또는 로컬 <code>server/data/</code>)', '브라우저 → 서버 프록시(키를 끼움) → LLM', '로컬 서버 · agentbuilder.pages.dev'],
            ['🕒 브라우저 세션', '이 탭의 sessionStorage (탭을 닫으면 삭제)', '브라우저 → LLM 직접 호출', '서버가 없을 때 (GitHub Pages · file://)']
          ], caption: '두 가지 키 모드. 이 강좌 사이트의 🔑 키 설정(sessionStorage)은 세션 모드와 같은 방식입니다.' },
          { type: 'figure', html: IMG('06_llm_key_panel', 'Gemini 를 고른 LLM 모델 노드의 속성 — 키가 없으면 모의 LLM 으로 실행된다는 안내'), caption: '그림 16-10. LLM 모델 노드의 속성. 공급자 · 모델 · 🔑 API 키(저장 뒤에는 힌트만 보임) · temperature.' },
          { type: 'figure', html: IMG('07_keys_modal', '키 관리 창 — 저장된 키의 힌트, 모드 선택'), caption: '그림 16-11. 상단 🔑 키 관리. 저장된 키(앞 4자 … 뒤 4자 힌트만) · 지우기 · 모드 선택.' },
          { type: 'callout', kind: 'warn', title: '키가 절대 들어가지 않는 세 곳', html: '<ul><li><b>그래프 JSON</b>: <code>"key_ref": "gemini"</code> 이름만 → 파일을 공유해도 안전</li><li><b>내보낸 파이썬 코드</b>: 환경 변수 <code>GEMINI_API_KEY</code> 또는 <code>.env</code> 에서만 읽음 (2교시)</li><li><b>실행 로그</b>: 브라우저 안 파이썬은 <code>vault:gemini</code> 자리표시자만 보고, 실제 키는 프록시(또는 워커)가 바꿔 넣음</li></ul>00차시에서 세운 원칙 — “키는 코드 · 저장소 · 로그에 두지 않는다” — 를 빌더가 구조적으로 지켜 줍니다. 공용 PC 에서는 사용 후 🔑 키 관리에서 키를 지우세요.' },
          { type: 'h', text: '실행하고 로그 읽기' },
          { type: 'p', html: '에이전트는 “답”보다 “무엇을 했는지”가 중요합니다. 실행 패널은 이 강좌의 결과 창과 같은 기호로 과정을 보여 줍니다.' },
          { type: 'figure', html: IMG('08_run_log', '실행 로그 — 노드 시작, LLM 호출, 응답, 완료 표시'), caption: '그림 16-12. 실행 로그. ▶ 노드 시작 · ↗ LLM 호출 · ↙ 응답 · ✔ 완료. 캔버스의 노드에도 ✔ 가 붙고 값이 흐른 간선이 움직입니다.' },
          { type: 'figure', html: IMG('09_results', '결과 탭 — 결과 노드마다 카드 하나'), caption: '그림 16-13. 결과 탭. 결과 노드마다 카드 하나 · 📋 복사.' },
          { type: 'table', head: ['표시', '뜻', '강좌에서 본 곳'], rows: [
            ['▶ 노드 이름', '노드 실행 시작 (반복이면 n회째)', '—'],
            ['↗ LLM 호출 / ↙ 응답', 'agentlab 이 모델을 부른 기록 (<code>verbose=True</code>)', '02차시 <code>llm.verbose</code>'],
            ['🔧 도구 호출 / 👁 관찰 / ✅ 최종 답', '에이전트 루프의 행동 · 관찰 · 답', '04차시 <code>Agent(verbose=True)</code>'],
            ['🔀 분기 “…” / ⏭ 건너뜀', '조건 분기가 고른 가지 · 안 고른 가지의 노드', '08차시 조건 간선 (17차시)'],
            ['🔁 반복 n', '되돌아가는 간선이 활성화되어 앞 노드부터 다시', '08차시 루프 (17차시)'],
            ['✅ 완료 · LLM 호출 n회 · 토큰', '비용 감각: 호출 횟수와 토큰 사용량', '02차시 <code>total_usage</code>']
          ], caption: '실행 로그의 기호. 시작 입력 칸에 다른 질문을 넣고 Enter 를 치면 그 값으로 실행됩니다. ■ 중지는 엔진을 새로 불러오므로 기억(17차시)이 지워집니다.' },
          { type: 'h', text: '파이썬으로 그래프 다루기 — 브라우저 실습' },
          { type: 'p', html: '빌더가 저장하는 그래프는 그냥 JSON 이고, 실행 엔진은 순수 파이썬입니다. 그래서 이 강좌의 코드 창에서도 <b>같은 그래프를 열고 · 검증하고 · 실행하고 · 고칠 수</b> 있습니다. 예제 그래프 15개가 작업 폴더에 <code>builder/01_hello_llm.json</code> 처럼 놓여 있습니다.' },
          { type: 'code', title: '예제 16-2. 그래프 JSON 열어 보기 — 노드 목록과 간선 목록', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
print('이름 :', g['name'])
print('설명 :', g['description'])
print('최상위 키:', list(g.keys()))
print('--- 노드', len(g['nodes']), '개 ---')
for n in g['nodes']:
    print(f"{n['id']:<4}{n['type']:<8}{n['label']:<8} config={list(n['config'].keys())}")
print('--- 간선', len(g['edges']), '개 ---')
for e in g['edges']:
    print(f"{e['id']}: {e['from']}.{e['fromPort']:<5} → {e['to']}.{e['toPort']}")`,
            expect: `이름 : 01 첫 LLM 호출
설명 : 입력 → LLM 호출 → 결과. 가장 단순한 그래프로 빌더 사용법과 API 키 설정을 익힌다. (studyAgent 02차시 LLM API)
최상위 키: ['version', 'name', 'description', 'nodes', 'edges', 'settings']
--- 노드 5 개 ---
n1  input   질문       config=['text', 'name']
n2  llm     LLM      config=['provider', 'model', 'key_ref', 'temperature']
n3  chat    답변 생성    config=['system', 'prompt', 'json_mode']
n4  output  결과       config=['title']
n5  note    메모       config=['text']
--- 간선 3 개 ---
e1: n1.text  → n3.input
e2: n2.llm   → n3.llm
e3: n3.text  → n4.value`,
            desc: '그림 16-4 가 그대로 데이터로 보입니다. 노드는 <code>id · type · label · x · y · config</code>, 간선은 <code>from.fromPort → to.toPort</code>. 메모(note) 노드는 설명용이라 간선이 없고 실행에도 영향이 없습니다. <code>key_ref</code> 가 빈 문자열인 것도 확인하세요 — 예제 그래프는 모두 모의 LLM(<code>provider: mock</code>)입니다.' },
          { type: 'code', title: '예제 16-3. 검증: 필수 포트가 비면 바로 알려 준다', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
print('정상 그래프 :', engine.validate(g))

broken = json.loads(json.dumps(g))                 # 깊은 복사
broken['edges'] = [e for e in broken['edges'] if e['id'] != 'e2']   # LLM 모델 → LLM 호출 연결을 끊는다
print('LLM 연결 끊김:', engine.validate(broken))

broken2 = json.loads(json.dumps(g))
broken2['nodes'][2]['type'] = 'gpt'                # 없는 노드 종류
print('없는 노드 종류:', engine.validate(broken2))

broken3 = json.loads(json.dumps(g))
broken3['edges'] = [e for e in broken3['edges'] if e['id'] != 'e3']
print('결과 입력 없음:', engine.validate(broken3))`,
            expect: `정상 그래프 : []
LLM 연결 끊김: ["'답변 생성' 노드의 'LLM' 포트가 연결되지 않았습니다"]
없는 노드 종류: ['알 수 없는 노드 종류: gpt']
결과 입력 없음: ["'결과' 노드의 '값' 포트가 연결되지 않았습니다"]`,
            desc: '<code>engine.validate(g)</code> 는 오류 메시지 목록을 돌려주고, 비어 있으면 정상입니다. 빌더에서 ▶ 를 눌렀을 때 뜨는 빨간 안내가 바로 이 메시지입니다. <code>*</code> 필수 포트(LLM 호출의 LLM, 결과의 값)가 비면 실행 전에 걸러 줍니다.' },
          { type: 'code', title: '예제 16-4. 실행: emit 콜백으로 이벤트 받기', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))

def show(ev):
    t = ev['type']
    if t == 'start':        print('▶ 실행 순서:', ev['order'])
    elif t == 'node_start': print(f"▶ [{ev['node']}] 시작")
    elif t == 'log':        print('   ', ev['text'])
    elif t == 'node_end':   print(f"   ✔ [{ev['node']}] 끝 → 출력 포트 {list(ev['outputs'].keys())}")
    elif t == 'result':     print(f"=== {ev['title']} ===\\n{ev['value']}")
    elif t == 'done':       print('✅ 완료 · LLM 호출', ev['usage']['calls'], '회 · 토큰', ev['usage']['total_tokens'])

results = engine.run_graph(g, emit=show)
print('반환값:', results)`,
            expect: `▶ 실행 순서: ['n1', 'n2', 'n3', 'n4', 'n5']
▶ [n1] 시작
   ✔ [n1] 끝 → 출력 포트 ['text']
▶ [n2] 시작
    🧠 모의 LLM (키 없음 · 항상 같은 답)
   ✔ [n2] 끝 → 출력 포트 ['llm']
▶ [n3] 시작
      ↗ LLM 호출 #1 (mock/mock-1) — user: 'AI 에이전트가 뭔지 한 문장으로 설명해줘'
      ↙ 응답: '[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 '
   ✔ [n3] 끝 → 출력 포트 ['text', 'json']
▶ [n4] 시작
=== 답변 ===
[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.
   ✔ [n4] 끝 → 출력 포트 []
✅ 완료 · LLM 호출 1 회 · 토큰 43
반환값: [{'node': 'n4', 'title': '답변', 'value': '[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.'}]`,
            desc: '빌더의 실행 패널은 바로 이 이벤트들을 그려 주는 화면입니다. <code>emit</code> 에 넘긴 함수가 <code>start → node_start → log → node_end → … → result → done</code> 순서로 dict 를 받습니다. <code>node_end</code> 와 <code>done</code> 에는 걸린 시간 <code>ms</code> 도 들어 있습니다(출력하지 않았습니다). 반환값은 결과 노드들의 값 목록입니다. 🔑 키가 있는 실제 모델이면 답 내용이 달라집니다 (예시 출력은 모의 LLM 기준).' },
          { type: 'code', title: '예제 16-5. 입력 바꾸기(overrides) · 속성 바꾸기(config)', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
quiet = lambda ev: None                      # 이벤트를 받지 않고 반환값만 쓴다

# ① 시작 입력 값 바꾸기 (빌더의 실행 패널 '시작 입력' 칸과 같다)
r = engine.run_graph(g, overrides={'n1': '자기소개를 한 문장으로 해줘'}, emit=quiet)
print('① 입력 변경 :', r[0]['value'])

# ② 속성 바꾸기 — 노드의 config 는 그냥 dict
chat = next(n for n in g['nodes'] if n['type'] == 'chat')
print('   원래 역할 :', chat['config']['system'])
chat['config']['system'] = '당신은 시인입니다. 짧고 운율 있게 말합니다.'
r = engine.run_graph(g, overrides={'n1': '자기소개를 한 문장으로 해줘'}, emit=quiet)
print('② 역할 변경 :', r[0]['value'])

# ③ 결과 노드의 제목 바꾸기
out = next(n for n in g['nodes'] if n['type'] == 'output')
out['config']['title'] = '시인의 답'
r = engine.run_graph(g, emit=quiet)
print('③ 제목 변경 :', r[0]['title'], '/', r[0]['value'][:30], '…')`,
            expect: `① 입력 변경 : [친절한 AI 선생님] 저는 친절한 AI 선생님 입니다. 무엇이든 물어보세요.
   원래 역할 : 당신은 친절한 AI 선생님입니다. 쉬운 말로 설명합니다.
② 역할 변경 : [시인] 저는 시인 입니다. 무엇이든 물어보세요.
③ 제목 변경 : 시인의 답 / [시인] AI 에이전트는 목표를 받아 스스로 계획하고, …`,
            desc: '<code>overrides</code> 는 {시작 입력 노드 id: 값}. 속성 패널에서 고치는 모든 것은 결국 <code>node[\'config\']</code> dict 의 키 하나이므로 파이썬으로도 똑같이 바꿀 수 있습니다. 모의 LLM 이 답 앞에 <code>[역할]</code> 을 붙이므로 역할이 바뀐 것이 바로 보입니다 (03차시).' },
          { type: 'code', title: '예제 16-6. 그래프를 코드로 처음부터 만들기', code: `from builder import engine

# 그래프 = 노드 목록 + 간선 목록 + 설정. 빌더가 저장하는 JSON 과 같은 모양이다
g = {
    'version': 1, 'name': '내 첫 그래프',
    'nodes': [
        {'id': 'q',   'type': 'input',  'label': '질문', 'x': 0,   'y': 0,   'config': {'text': '안녕! 넌 누구야?', 'name': 'question'}},
        {'id': 'm',   'type': 'llm',    'label': '모델', 'x': 0,   'y': 150, 'config': {'provider': 'mock'}},
        {'id': 'c',   'type': 'chat',   'label': '답변', 'x': 300, 'y': 60,  'config': {'system': '당신은 해적입니다.', 'prompt': '{input}'}},
        {'id': 'out', 'type': 'output', 'label': '결과', 'x': 600, 'y': 60,  'config': {'title': '해적의 답'}},
    ],
    'edges': [
        {'id': 'e1', 'from': 'q', 'fromPort': 'text', 'to': 'c',   'toPort': 'input'},
        {'id': 'e2', 'from': 'm', 'fromPort': 'llm',  'to': 'c',   'toPort': 'llm'},
        {'id': 'e3', 'from': 'c', 'fromPort': 'text', 'to': 'out', 'toPort': 'value'},
    ],
    'settings': {'max_loops': 5},
}
print('검증:', engine.validate(g) or '문제 없음')
for r in engine.run_graph(g, emit=lambda ev: None):
    print(f"=== {r['title']} ===")
    print(r['value'])`,
            expect: `검증: 문제 없음
=== 해적의 답 ===
[해적] 안녕하세요! 무엇을 도와드릴까요?`,
            desc: '노드 id 는 아무 문자열이나 됩니다(빌더는 n1, n2 … 를 씁니다). <code>x, y</code> 는 캔버스 좌표라 실행과 무관하고, 포트 이름은 예제 16-1 의 카탈로그를 따릅니다. 이 dict 를 <code>json.dump</code> 로 저장해 빌더의 📂 열기로 불러오면 캔버스에 그대로 그려집니다 — 코드와 그림은 같은 것입니다.' },
          { type: 'callout', kind: 'tip', title: '빌더 ↔ 파이썬, 어느 쪽에서 고쳐도 같다', html: '빌더에서 노드를 고치고 { } JSON 탭을 보면 <code>config</code> 값이 바뀌어 있고, 파이썬에서 <code>config</code> 를 고쳐 저장한 JSON 을 빌더로 열면 속성 패널에 바뀐 값이 보입니다. 17차시에서는 이 방법으로 분기 조건을 바꾸고 도구를 추가합니다.' },
          { type: 'callout', kind: 'info', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>교사 PC 에서 빌더를 미리 한 번 열어 Pyodide 를 내려받아 두세요(첫 로딩 10~20MB). 수업 중에는 캐시에서 바로 뜹니다.</li><li>세션 모드(GitHub Pages)와 금고 모드(pages.dev) 두 주소를 모두 열어 🔑 키 관리 창의 모드 표시 차이를 보여 주면 그림 16-9 가 바로 이해됩니다.</li><li>학생 실습은 빌더(별도 탭)와 이 강좌 코드 창을 나란히 둡니다. 빌더 { } JSON 탭의 내용을 복사해 코드 창의 <code>json.loads</code> 로 읽게 하면 “같은 것”임을 체감합니다.</li><li>키가 없어도 모든 예제가 모의 LLM 으로 돕니다. 키를 넣은 시연은 교사 PC 에서만.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '자주 나오는 오개념', teacher: true, html: '<ul><li><b>“노드가 LLM 을 실행한다”</b> → LLM 모델 노드는 <code>al.LLM()</code> 객체를 만들어 건넬 뿐, 실제 호출은 LLM 호출 · 에이전트 노드가 합니다. 그래서 LLM 모델 하나를 여러 노드에 연결할 수 있습니다.</li><li><b>“키를 노드에 넣었으니 JSON 에 키가 들어 있다”</b> → 예제 16-2 로 <code>key_ref</code> 가 이름뿐임을 직접 확인시키세요.</li><li><b>“노드 위치(x, y)가 실행 순서를 정한다”</b> → 간선이 정합니다 (2교시 위상 정렬). 노드를 아무렇게나 옮겨도 결과는 같습니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 16-1. 역할과 제목 바꿔 실행하기', level: 1,
            desc: '<p><code>builder/01_hello_llm.json</code> 을 읽어 LLM 호출 노드의 시스템 프롬프트를 “당신은 요리사입니다. 음식에 빗대어 설명합니다.”로, 결과 노드의 제목을 “요리사의 답”으로 바꾼 뒤, 시작 입력을 “자기소개를 한 문장으로 해줘”로 덮어써 실행하세요. 결과 제목과 값을 출력합니다.</p>',
            hint: '<code>next(n for n in g[\'nodes\'] if n[\'type\'] == \'chat\')</code> 로 노드를 찾고 <code>config[\'system\']</code> 을 바꿉니다. 실행은 <code>engine.run_graph(g, overrides={\'n1\': …}, emit=lambda ev: None)</code>.',
            starter: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
# TODO ① chat 노드의 config['system'] 을 요리사 역할로 바꾸기
# TODO ② output 노드의 config['title'] 을 '요리사의 답' 으로 바꾸기
# TODO ③ overrides 로 시작 입력(n1)을 '자기소개를 한 문장으로 해줘' 로 바꿔 실행하고 결과 출력
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
chat = next(n for n in g['nodes'] if n['type'] == 'chat')
chat['config']['system'] = '당신은 요리사입니다. 음식에 빗대어 설명합니다.'
out = next(n for n in g['nodes'] if n['type'] == 'output')
out['config']['title'] = '요리사의 답'
results = engine.run_graph(g, overrides={'n1': '자기소개를 한 문장으로 해줘'}, emit=lambda ev: None)
for r in results:
    print(f"=== {r['title']} ===")
    print(r['value'])
`,
            expect: `=== 요리사의 답 ===
[요리사] 저는 요리사 입니다. 무엇이든 물어보세요.` },
          { title: '실습 16-2. JSON 모드 감성 분류 그래프를 코드로 만들기', level: 2,
            desc: '<p>예제 16-6 처럼 그래프 dict 를 직접 만드세요: 시작 입력(리뷰) → LLM 호출(<code>json_mode: True</code>, 시스템 프롬프트 “당신은 감성 분석기입니다.”, 프롬프트는 03차시의 감성 분류 지시문 + <code>{input}</code>) → 결과. 이때 LLM 호출의 <b>json</b> 출력 포트를 결과에 연결합니다. 검증한 뒤 리뷰 두 개(“배송이 너무 늦고 상자도 찌그러져서 실망했어요”, “친절한 응대에 감동했어요. 최고!”)를 <code>overrides</code> 로 넣어 결과 값의 타입과 <code>sentiment</code> 를 출력하세요.</p>',
            hint: '간선 <code>{\'from\': \'c\', \'fromPort\': \'json\', \'to\': \'o\', \'toPort\': \'value\'}</code>. 결과 값은 dict 이므로 <code>r[\'sentiment\']</code> 로 꺼냅니다.',
            starter: `from builder import engine

PROMPT = '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.\\n\\n{input}'
g = {
    'version': 1, 'name': '감성 분류기',
    'nodes': [
        {'id': 'r', 'type': 'input',  'label': '리뷰', 'x': 0,   'y': 0,   'config': {'text': '배송이 너무 늦고 상자도 찌그러져서 실망했어요', 'name': 'review'}},
        {'id': 'm', 'type': 'llm',    'label': '모델', 'x': 0,   'y': 150, 'config': {'provider': 'mock'}},
        # TODO: chat 노드 'c' (system · prompt=PROMPT · json_mode True)
        # TODO: output 노드 'o' (title '감성')
    ],
    'edges': [
        # TODO: r.text → c.input, m.llm → c.llm, c.json → o.value
    ],
    'settings': {'max_loops': 5},
}
print('검증:', engine.validate(g) or '문제 없음')
# TODO: 리뷰 두 개를 overrides 로 실행하고 type(값).__name__ 과 값['sentiment'] 출력
`,
            solution: `from builder import engine

PROMPT = '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.\\n\\n{input}'
g = {
    'version': 1, 'name': '감성 분류기',
    'nodes': [
        {'id': 'r', 'type': 'input',  'label': '리뷰', 'x': 0,   'y': 0,   'config': {'text': '배송이 너무 늦고 상자도 찌그러져서 실망했어요', 'name': 'review'}},
        {'id': 'm', 'type': 'llm',    'label': '모델', 'x': 0,   'y': 150, 'config': {'provider': 'mock'}},
        {'id': 'c', 'type': 'chat',   'label': '분류', 'x': 300, 'y': 60,  'config': {'system': '당신은 감성 분석기입니다.', 'prompt': PROMPT, 'json_mode': True}},
        {'id': 'o', 'type': 'output', 'label': '결과', 'x': 600, 'y': 60,  'config': {'title': '감성'}},
    ],
    'edges': [
        {'id': 'e1', 'from': 'r', 'fromPort': 'text', 'to': 'c', 'toPort': 'input'},
        {'id': 'e2', 'from': 'm', 'fromPort': 'llm',  'to': 'c', 'toPort': 'llm'},
        {'id': 'e3', 'from': 'c', 'fromPort': 'json', 'to': 'o', 'toPort': 'value'},
    ],
    'settings': {'max_loops': 5},
}
print('검증:', engine.validate(g) or '문제 없음')
for text in ['배송이 너무 늦고 상자도 찌그러져서 실망했어요', '친절한 응대에 감동했어요. 최고!']:
    r = engine.run_graph(g, overrides={'r': text}, emit=lambda ev: None)[0]['value']
    print(type(r).__name__, r['sentiment'], '←', text)
`,
            expect: `검증: 문제 없음
dict negative ← 배송이 너무 늦고 상자도 찌그러져서 실망했어요
dict positive ← 친절한 응대에 감동했어요. 최고!` },
          { title: '실습 16-3. 고장 난 그래프 고치기', level: 3,
            desc: '<p>예제 01 그래프에서 간선을 <code>e1</code> 하나만 남겨 고장 냅니다. <code>engine.validate</code> 의 메시지를 읽고, <b>빠진 간선을 코드로 하나씩 추가</b>하며 오류가 사라지는 것을 확인한 뒤 실행해 답을 출력하세요. (어떤 노드의 어떤 포트를 이어야 하는지는 예제 16-2 의 간선 목록을 참고)</p>',
            hint: '<code>g[\'edges\'].append({\'id\': \'e2\', \'from\': \'n2\', \'fromPort\': \'llm\', \'to\': \'n3\', \'toPort\': \'llm\'})</code> 식으로 추가합니다. 메시지에 나온 노드 이름과 포트 이름이 힌트입니다.',
            starter: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
g['edges'] = [e for e in g['edges'] if e['id'] == 'e1']        # 고장: 간선 하나만 남김
print('고장 난 그래프:', engine.validate(g))
# TODO: 첫 번째 오류 메시지가 가리키는 연결을 추가하고 다시 validate
# TODO: 두 번째 오류도 고치고 '문제 없음' 확인
# TODO: 실행해서 결과 값 출력
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
g['edges'] = [e for e in g['edges'] if e['id'] == 'e1']        # 고장: 간선 하나만 남김
print('고장 난 그래프:', engine.validate(g))

# 빠진 연결을 코드로 다시 잇는다
g['edges'].append({'id': 'e2', 'from': 'n2', 'fromPort': 'llm',  'to': 'n3', 'toPort': 'llm'})
print('LLM 연결 후 :', engine.validate(g))
g['edges'].append({'id': 'e3', 'from': 'n3', 'fromPort': 'text', 'to': 'n4', 'toPort': 'value'})
print('결과 연결 후:', engine.validate(g) or '문제 없음')
print(engine.run_graph(g, emit=lambda ev: None)[0]['value'])
`,
            expect: `고장 난 그래프: ["'답변 생성' 노드의 'LLM' 포트가 연결되지 않았습니다"]
LLM 연결 후 : ["'결과' 노드의 '값' 포트가 연결되지 않았습니다"]
결과 연결 후: 문제 없음
[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'agentBuilder 시작하기', subtitle: '코드로 배운 구조를 노드로 조립한다', notes: '<p><b>발문:</b> “02차시 첫 LLM 호출 코드가 몇 줄이었나요? 그 다섯 줄을 그림으로 그리면?” → 상자 네 개와 선 세 개. 오늘은 그 그림을 실제로 그리고 실행합니다. 새 이론은 없다고 안심시키세요.</p><p>⏱ 도입 6분</p>' },
          { layout: 'diagram', title: '왜 코드 다음에 빌더인가', html: FIG_WHY, caption: '같은 구조 · 빠른 실험 · JSON 공유 · 코드로 되돌아온다',
            notes: '<p>왼쪽 코드의 각 줄을 오른쪽 노드와 손가락으로 짝지어 봅니다. “빌더는 코드를 대신하는 게 아니라 코드를 그리는 도구”라는 메시지. 빌더 주소 세 가지(GitHub Pages 세션 모드 · pages.dev 금고 모드 · 로컬)를 칠판에 적어 둡니다.</p>' },
          { layout: 'diagram', title: '화면 구성: 다섯 영역', html: FIG_SCREEN, caption: '① 상단 바 ② 팔레트 ③ 캔버스 ④ 속성 · 코드 · JSON ⑤ 실행 · 결과',
            notes: '<p>실제 빌더 탭으로 전환해 영역을 하나씩 클릭하며 보여 줍니다. 📘 튜토리얼 버튼을 눌러 “여기에 같은 안내가 있다”고 알려 주면 학생이 스스로 복습할 수 있습니다. <kbd>F5</kbd> 실행 · <kbd>Ctrl+Z</kbd> 실행 취소 · 선 더블클릭 삭제만 외우게.</p>' },
          { layout: 'diagram', title: '노드 · 포트 · 간선', html: FIG_NODE, caption: '포트 색 = 값의 종류 · * = 필수 · ■ = 여러 개',
            notes: '<p><b>발문:</b> “왜 LLM 모델의 ● 을 시작 입력 포트에 못 붙일까?” → 종류가 다르다(글 vs 모델). 파이썬의 타입과 같다고 연결. 점선(자원 간선)과 실선(자료 간선)의 구분은 2교시 실행 순서에서 다시 쓰이므로 가볍게 예고만.</p>' },
          { layout: 'bullets', title: '첫 그래프: 입력 → LLM 모델 → LLM 호출 → 결과', lead: '빈 캔버스에서 직접 만들기 (예제 01 과 같은 그래프)', bullets: [
            '📄 새로 → 팔레트에서 노드 4개 드래그 (검색창 활용)',
            '시작 입력 text ● → LLM 호출 <b>입력</b> 포트',
            'LLM 모델 llm ● → LLM 호출 <b>LLM *</b> 포트',
            'LLM 호출 답변 ● → 결과 <b>값 *</b> 포트',
            '시작 입력에 질문 쓰고 ▶ 실행 (<kbd>F5</kbd>) → 로그 · 결과 확인',
            '잘못 이었으면 선 더블클릭 = 삭제 · <kbd>Ctrl+Z</kbd>'
          ], notes: '<p>교사가 빌더에서 시연하며 학생도 따라 만들게 합니다(5분). 필수 포트를 하나 비운 채 ▶ 를 눌러 빨간 안내(“… 포트가 연결되지 않았습니다”)를 일부러 보여 주세요 — 예제 16-3 의 validate 메시지와 같은 것입니다.</p>' },
          { layout: 'diagram', title: '속성: 역할 · 프롬프트 · JSON', html: IMG('05_props_chat_panel', 'LLM 호출 노드의 속성 패널'), caption: '03차시의 시스템 프롬프트 · {input} · json_mode 가 그대로',
            notes: '<p>시스템 프롬프트를 “당신은 해적입니다”로 바꾸고 다시 실행 → 모의 LLM 의 답 앞 <code>[해적]</code> 이 바뀌는 것을 보여 줍니다. “JSON 으로 답하게”를 켜면 JSON 출력 포트가 활성화됨을 확인. 여러 입력을 합치는 프롬프트 템플릿 노드는 2교시 실습에서.</p>' },
          { layout: 'diagram', title: '키는 어디에? 금고 vs 세션', html: FIG_KEYS, caption: '그래프 JSON · 코드 · 로그에는 키가 없다',
            notes: '<p>00차시 원칙(키는 코드 · 저장소 · 로그에 두지 않는다)을 상기. 교사 PC 에서 LLM 모델 노드에 키를 저장한 뒤 { } JSON 탭을 열어 <code>"key_ref": "gemini"</code> 만 있음을 보여 주는 것이 가장 강력한 시연입니다. 공용 PC 에서는 🔑 키 관리에서 지우기.</p>' },
          { layout: 'diagram', title: '실행 로그 읽기', html: IMG('08_run_log', '실행 로그 화면'), caption: '▶ 시작 · ↗ LLM 호출 · ↙ 응답 · ✔ 완료 · ✅ 토큰',
            notes: '<p>로그 기호가 이 강좌 결과 창의 기호와 같다는 점을 짚습니다(02차시 verbose, 04차시 Agent). 시작 입력 칸에 다른 질문을 넣고 Enter → 다시 실행. 결과 탭의 📋 복사도 소개.</p>' },
          { layout: 'code', title: '그래프 JSON 열어 보기 · 검증', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
print(g['name'], '· 키:', list(g.keys()))
for n in g['nodes']:
    print(f"{n['id']:<4}{n['type']:<8}{n['label']}")
for e in g['edges']:
    print(f"{e['from']}.{e['fromPort']} → {e['to']}.{e['toPort']}")

print('검증:', engine.validate(g))
g['edges'].pop(1)                      # LLM 연결을 끊으면?
print('검증:', engine.validate(g))`, points: ['그래프 = nodes + edges + settings', '간선 = from.port → to.port', '<code>validate</code> 가 필수 포트를 검사'],
            notes: '<p>▶ 실행. 빌더의 { } JSON 탭과 같은 내용임을 나란히 보여 줍니다. 끊긴 연결의 오류 메시지가 빌더의 빨간 안내와 똑같다는 것도.</p>' },
          { layout: 'code', title: '파이썬으로 실행하기', code: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))

def show(ev):
    if ev['type'] == 'log':      print('  ', ev['text'])
    elif ev['type'] == 'result': print('===', ev['title'], '===', ev['value'])
    elif ev['type'] == 'done':   print('완료 · LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
chat = next(n for n in g['nodes'] if n['type'] == 'chat')
chat['config']['system'] = '당신은 시인입니다.'          # 속성 바꾸기
engine.run_graph(g, overrides={'n1': '자기소개 해줘'}, emit=show)`, points: ['<code>emit</code> 콜백 = 실행 패널', '<code>overrides</code> = 시작 입력 칸', '<code>config</code> dict = 속성 패널'],
            notes: '<p>▶ 실행. 두 번째 실행에서 <code>[시인]</code> 으로 바뀐 답을 확인. “속성 패널에서 고치는 것 = config 의 키 하나”를 강조.</p>' },
          { layout: 'code', title: '그래프를 코드로 처음부터', code: `from builder import engine

g = {'version': 1, 'name': '내 첫 그래프',
     'nodes': [
       {'id': 'q', 'type': 'input',  'label': '질문', 'x': 0,   'y': 0,   'config': {'text': '안녕! 넌 누구야?'}},
       {'id': 'm', 'type': 'llm',    'label': '모델', 'x': 0,   'y': 150, 'config': {'provider': 'mock'}},
       {'id': 'c', 'type': 'chat',   'label': '답변', 'x': 300, 'y': 60,  'config': {'system': '당신은 해적입니다.'}},
       {'id': 'o', 'type': 'output', 'label': '결과', 'x': 600, 'y': 60,  'config': {'title': '해적의 답'}}],
     'edges': [
       {'id': 'e1', 'from': 'q', 'fromPort': 'text', 'to': 'c', 'toPort': 'input'},
       {'id': 'e2', 'from': 'm', 'fromPort': 'llm',  'to': 'c', 'toPort': 'llm'},
       {'id': 'e3', 'from': 'c', 'fromPort': 'text', 'to': 'o', 'toPort': 'value'}],
     'settings': {'max_loops': 5}}
print(engine.validate(g) or '문제 없음')
print(engine.run_graph(g, emit=lambda ev: None)[0]['value'])`, points: ['노드 id 는 자유 · x, y 는 화면용', '포트 이름은 카탈로그대로', 'json.dump → 빌더 📂 열기로 그려진다'],
            notes: '<p>▶ 실행. 이 dict 를 <code>json.dump</code> 로 저장해 빌더에서 열면 캔버스에 그려진다고 설명(시간이 되면 시연). “코드와 그림은 같은 것”이 이 교시의 결론.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[2].q, options: QUIZ1[2].options, answer: QUIZ1[2].answer, explain: QUIZ1[2].explain, notes: '<p>키 보호 문제. 틀린 학생이 있으면 { } JSON 탭을 다시 열어 key_ref 를 보여 줍니다.</p>' },
          { layout: 'practice', title: '실습 16-1. 역할과 제목 바꿔 실행하기', desc: '<p>01 그래프의 역할을 요리사로, 결과 제목을 “요리사의 답”으로 바꾸고 “자기소개를 한 문장으로 해줘”로 실행하세요.</p>',
            starter: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
# TODO: chat 노드 config['system'] → 요리사 / output 노드 config['title'] → '요리사의 답'
# TODO: overrides={'n1': '자기소개를 한 문장으로 해줘'} 로 실행하고 출력`, solution: `import json
from builder import engine

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
chat = next(n for n in g['nodes'] if n['type'] == 'chat')
chat['config']['system'] = '당신은 요리사입니다. 음식에 빗대어 설명합니다.'
out = next(n for n in g['nodes'] if n['type'] == 'output')
out['config']['title'] = '요리사의 답'
for r in engine.run_graph(g, overrides={'n1': '자기소개를 한 문장으로 해줘'}, emit=lambda ev: None):
    print(r['title'], '→', r['value'])`, notes: '<p>⏱ 6분. 빨리 끝난 학생은 실습 16-2(JSON 분류 그래프) · 16-3(고장 수리)로. 빌더에서 같은 수정을 속성 패널로 해 보고 { } JSON 과 비교하게 해도 좋습니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['빌더 = 배운 구조를 <b>노드로 조립</b> · 다섯 영역(상단 바 · 팔레트 · 캔버스 · 속성/코드/JSON · 실행/결과)', '노드 · <b>포트(색 = 종류, * = 필수)</b> · 간선. 같은 종류끼리만 연결', '첫 그래프: 입력 → LLM 모델 → LLM 호출 → 결과 · 속성 = 역할 · 프롬프트 · JSON', '키는 금고 또는 세션에만 · 그래프 · 코드 · 로그에는 <code>key_ref</code> 이름뿐', '파이썬: <code>json.load</code> → <code>engine.validate</code> → <code>run_graph(emit, overrides)</code> → <code>config</code> 수정', '다음 교시: 그래프 → 파이썬 코드 내보내기'], notes: '<p>⏱ 6분. 출구 질문: “그래프 JSON 을 친구에게 보내면 내 API 키도 같이 가나요?” → 아니오, key_ref 이름만.</p>' }
        ]
      },
      {
        id: 'ag16-2',
        title: '그래프 → 파이썬 코드',
        minutes: 50,
        goals: ['export_python 으로 내보낸 코드를 02 · 03차시의 agentlab 코드와 1:1 로 대응시킨다', '내보낸 코드를 파일로 저장해 실행하고, 키가 .env 에서만 읽히는 것을 확인한다', '그래프 JSON 의 구조와 엔진의 실행 순서(위상 정렬 · 자료 포트 vs 자원 포트)를 설명한다', '예제 메뉴 · ZIP · run_graph.py · 배포 방식을 안다'],
        flow: [['내보내기와 1:1 대응', 12], ['내보낸 코드 실행 · .env', 12], ['그래프 JSON 과 실행 순서', 10], ['예제 메뉴 · ZIP · CLI · 배포', 8], ['실습 · 정리', 8]],
        content: [
          { type: 'p', html: '1교시에서 그래프를 만들고 실행했습니다. 빌더의 진짜 힘은 <b>🐍 Python 코드</b> 탭에 있습니다. 어떤 그래프든 위에서 아래로 읽히는 <b>독립 파이썬 스크립트</b>로 바뀌고, 그 코드는 우리가 13차시 동안 쓴 <code>agentlab</code> 코드와 같은 모양입니다. 즉 빌더는 “그림 그리는 도구”가 아니라 <b>코드를 그리는 도구</b>입니다.' },
          { type: 'figure', html: FIG_FLOW, caption: '그림 16-14. 같은 그래프 JSON 을 두 가지로 씁니다. 위: 엔진이 바로 실행(브라우저 · run_graph.py). 아래: 파이썬 코드로 내보내 빌더 없이 실행.' },
          { type: 'h', text: '🐍 코드 탭: export_python' },
          { type: 'figure', html: IMG('10_code_panel', 'Python 코드 탭 — 노드 하나가 코드 몇 줄로 바뀐 모습'), caption: '그림 16-15. 🐍 Python 코드 탭. 노드 하나가 주석 한 줄 + 코드 몇 줄로. 💾 .py 저장 · 📦 ZIP.' },
          { type: 'code', title: '예제 16-7. 그래프를 코드로 내보내기', code: `import json
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
code = export.export_python(g)
print('전체', len(code.splitlines()), '줄 · 키 문자열 포함?', 'api_key=' in code and 'AIza' in code)
print('--- 에이전트 흐름 부분 ---')
print(code[code.index('def main():'):].rstrip())`,
            expect: `전체 102 줄 · 키 문자열 포함? False
--- 에이전트 흐름 부분 ---
def main():
    # ── 질문 (시작 입력)
    question = sys.argv[1] if len(sys.argv) > 1 else 'AI 에이전트가 뭔지 한 문장으로 설명해줘'

    # ── LLM (LLM 모델)
    llm1 = make_llm('mock')

    # ── 답변 생성 (LLM 호출)
    answer1_prompt = fmt('{input}', {'input': to_text(question), 'context': to_text(None)})
    answer1_resp = llm1.chat([al.system('당신은 친절한 AI 선생님입니다. 쉬운 말로 설명합니다.')] + [al.user(answer1_prompt)])
    answer1 = answer1_resp.content

    # ── 결과 (결과)
    print('\\n=== 답변 ===')
    print(to_text(answer1))



if __name__ == '__main__':
    main()`,
            desc: '102줄 중 앞 80여 줄은 어느 그래프든 같은 머리말(import · <code>.env</code> 읽기 · <code>make_llm</code> · <code>fmt</code> · <code>to_text</code> 도우미)이고, <b><code>main()</code> 안이 그래프 그 자체</b>입니다. 노드 하나 = <code># ── 노드 이름 (종류)</code> 주석 + 코드 몇 줄, 노드 순서 = 1교시 <code>start</code> 이벤트의 실행 순서. 간선은 변수 이름(<code>question</code> → <code>answer1_prompt</code> → <code>answer1</code>)으로 바뀌었습니다.' },
          { type: 'h', text: '노드 ↔ agentlab 코드 1:1 대응' },
          { type: 'table', head: ['빌더 노드', '내보낸 코드', '강좌에서 우리가 쓴 코드'], rows: [
            ['▶ 시작 입력', '<code>question = sys.argv[1] if len(sys.argv) &gt; 1 else \'…\'</code>', '질문 문자열 변수 (02차시)'],
            ['🧠 LLM 모델', '<code>llm1 = make_llm(\'gemini\')</code> — 키는 환경 변수에서', '<code>llm = al.LLM()</code> (02차시)'],
            ['💬 LLM 호출', '<code>llm1.chat([al.system(역할)] + [al.user(prompt)])</code> → <code>.content</code>', '<code>llm.ask(q, system_prompt=…)</code> · <code>llm.chat(...)</code> (02 · 03차시)'],
            ['💬 LLM 호출 + JSON 모드', '<code>…chat(…, json_mode=True)</code> → <code>answer_json = resp.json()</code>', '<code>r.json()</code> (03차시 구조화 출력)'],
            ['🧩 프롬프트 템플릿', '<code>fmt(\'…{review}…\', {\'review\': review})</code>', '<code>al.PromptTemplate</code> · f-string (03 · 07차시)'],
            ['🔧 내장 도구 / 🐍 파이썬 도구', '<code>tool1 = al.get_weather</code> / <code>@al.tool def …</code>', '04차시 그대로'],
            ['🤖 에이전트', '<code>al.Agent(llm1, tools=[…], system=…).run(question)</code>', '<code>al.Agent(...)</code> (04차시)'],
            ['🔀 조건 분기 / 되돌아가는 간선', '<code>if route == \'…\':</code> / <code>for _loop in range(max_loops):</code>', '<code>StateGraph</code> 조건 간선 · 루프 (08차시, 17차시)'],
            ['🏁 결과', '<code>print(\'=== 제목 ===\'); print(to_text(값))</code>', '<code>print(answer)</code>']
          ], caption: '노드와 코드의 대응. 새 API 는 하나도 없습니다 — 빌더는 우리가 배운 agentlab 호출을 노드 순서대로 늘어놓을 뿐입니다.' },
          { type: 'code', title: '예제 16-8. 02차시 코드 vs 내보낸 코드 — 결과가 같다', code: `import agentlab as al

# (A) 02차시에서 우리가 직접 쓴 코드
llm = al.LLM('mock')
a = llm.ask('AI 에이전트가 뭔지 한 문장으로 설명해줘', system_prompt='당신은 친절한 AI 선생님입니다. 쉬운 말로 설명합니다.')
print('(A) 직접 쓴 코드 :', a)

# (B) 빌더가 내보낸 코드의 핵심 줄 (노드 3개 = 3단계)
question = 'AI 에이전트가 뭔지 한 문장으로 설명해줘'                      # ── 시작 입력
llm1 = al.LLM('mock')                                                      # ── LLM 모델 (make_llm('mock'))
answer1_resp = llm1.chat([al.system('당신은 친절한 AI 선생님입니다. 쉬운 말로 설명합니다.')] + [al.user(question)])   # ── LLM 호출
answer1 = answer1_resp.content
print('(B) 내보낸 코드  :', answer1)                                        # ── 결과
print('같은가?', a == answer1)`,
            expect: `(A) 직접 쓴 코드 : [친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.
(B) 내보낸 코드  : [친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.
같은가? True`,
            desc: '<code>llm.ask(q, system_prompt=…)</code> 는 <code>llm.chat([system, user])</code> 의 줄임이므로 두 코드는 같은 호출입니다. 빌더가 <code>fmt()</code> 로 프롬프트를 한 번 감싸는 것(<code>{input}</code> 치환)만 다릅니다. 🔑 실제 모델이어도 두 코드는 같은 메시지를 보냅니다.' },
          { type: 'h', text: '내보낸 코드를 실행하기' },
          { type: 'p', html: '빌더의 💾 .py 버튼은 이 문자열을 파일로 저장할 뿐입니다. 코드 창에서도 똑같이 파일로 저장하고 실행해 봅니다. 내보낸 코드는 <code>sys.argv[1]</code> 을 첫 시작 입력으로 쓰므로 <code>python hello.py "질문"</code> 처럼 명령줄에서 질문을 넘길 수 있습니다 — 브라우저에는 명령줄이 없으니 <code>sys.argv</code> 를 직접 설정하고 <code>runpy</code> 로 실행합니다.' },
          { type: 'code', title: '예제 16-9. 파일로 저장 → 명령줄 인자 → 스크립트로 실행', code: `import json, sys, runpy
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
code = export.export_python(g)
with open('hello.py', 'w', encoding='utf-8') as f:      # ① 파일로 저장 (빌더의 💾 .py 버튼)
    f.write(code)

sys.argv = ['hello.py', '에이전트와 챗봇의 차이를 한 문장으로']   # ② 명령줄 인자 흉내: python hello.py "질문"
runpy.run_path('hello.py', run_name='__main__')            # ③ 스크립트로 실행`,
            expect: `  ↗ LLM 호출 #1 (mock/mock-1) — user: '에이전트와 챗봇의 차이를 한 문장으로'
  ↙ 응답: '[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 '

=== 답변 ===
[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.`,
            desc: '<code>runpy.run_path(…, run_name=\'__main__\')</code> 은 터미널에서 <code>python hello.py</code> 를 친 것과 같습니다. 내보낸 코드의 <code>make_llm</code> 은 <code>verbose=True</code> 로 LLM 을 만들므로 ↗ ↙ 호출 로그가 함께 찍힙니다. 내 PC 라면 <code>agentlab/</code> 폴더를 옆에 두고(📦 ZIP 이 그렇게 묶어 줍니다) 터미널에서 바로 실행하면 됩니다.' },
          { type: 'h', text: '키는 코드 밖에: 환경 변수와 .env' },
          { type: 'p', html: '빌더에서 공급자를 Gemini 로 바꾸면 내보낸 코드도 바뀝니다. 그런데 <b>키는 코드 어디에도 들어가지 않고</b> <code>make_llm()</code> 이 환경 변수 <code>GEMINI_API_KEY</code> 를 읽습니다. 같은 폴더에 <code>.env</code> 파일이 있으면 머리말의 <code>load_env()</code> 가 먼저 읽어 환경 변수로 넣어 줍니다. <code>export.env_example(g)</code> 은 그 <code>.env</code> 의 견본을 만들어 줍니다.' },
          { type: 'code', title: '예제 16-10. 공급자를 Gemini 로 바꿔 내보내기 — 코드에 키가 없다', code: `import json
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
llm = next(n for n in g['nodes'] if n['type'] == 'llm')
llm['config'].update({'provider': 'gemini', 'model': 'gemini-2.5-flash', 'key_ref': 'gemini'})   # 빌더에서 공급자를 고른 것과 같다

code = export.export_python(g)
print('그래프 JSON 의 LLM 노드:', json.dumps(llm['config'], ensure_ascii=False))
print('코드에 key_ref 가 있나?', 'key_ref' in code, '/ 실제 키 모양(AIza…)이 있나?', 'AIza' in code)
print('--- make_llm 호출 줄 ---')
print([ln.strip() for ln in code.splitlines() if 'make_llm(' in ln and '=' in ln and 'def' not in ln][0])
print('--- 키를 읽는 줄 ---')
print([ln.strip() for ln in code.splitlines() if 'os.environ.get' in ln][0])
print('--- .env.example ---')
print(export.env_example(g))`,
            expect: `그래프 JSON 의 LLM 노드: {"provider": "gemini", "model": "gemini-2.5-flash", "key_ref": "gemini", "temperature": 0}
코드에 key_ref 가 있나? False / 실제 키 모양(AIza…)이 있나? False
--- make_llm 호출 줄 ---
llm1 = make_llm('gemini', model='gemini-2.5-flash')
--- 키를 읽는 줄 ---
key = os.environ.get(p['env'], '') if p['env'] else ''
--- .env.example ---
# 이 파일을 .env 로 복사하고 키를 채우세요. .env 는 절대 git 에 올리지 마세요.
GEMINI_API_KEY=   # Google Gemini — https://aistudio.google.com/apikey
`,
            desc: '그래프에는 <code>key_ref</code> 이름이, 코드에는 그마저도 없습니다. 코드는 “Gemini 를 쓴다”는 사실만 알고 키는 실행 환경이 가지고 있습니다. 공급자가 여럿이면 <code>.env.example</code> 에 줄이 늘어납니다. 00차시 Colab Secrets · 이 사이트의 sessionStorage 와 같은 철학입니다.' },
          { type: 'code', title: '예제 16-11. 키가 없는 환경에서 실행하면?', code: `import json, sys, runpy
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
next(n for n in g['nodes'] if n['type'] == 'llm')['config']['provider'] = 'gemini'
open('hello_gemini.py', 'w', encoding='utf-8').write(export.export_python(g))

sys.argv = ['hello_gemini.py']
runpy.run_path('hello_gemini.py', run_name='__main__')     # GEMINI_API_KEY 가 없으면?`,
            expect: `⚠ 환경 변수 GEMINI_API_KEY 가 없어 모의 LLM 으로 실행합니다 (Google Gemini)
  ↗ LLM 호출 #1 (mock/mock-1) — user: 'AI 에이전트가 뭔지 한 문장으로 설명해줘'
  ↙ 응답: '[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 '

=== 답변 ===
[친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.`,
            desc: '죽지 않고 경고 한 줄 뒤 모의 LLM 으로 넘어갑니다 — 이 강좌의 <code>al.LLM()</code> 과 같은 규칙입니다. 내 PC 에서 <code>.env</code> 에 <code>GEMINI_API_KEY=…</code> 를 적으면 같은 파일이 실제 모델로 돕니다. (브라우저 파이썬에는 환경 변수를 넣을 수 없으니 실제 실행은 Colab · 내 PC 에서)' },
          { type: 'callout', kind: 'warn', title: '.env 는 git 에 올리지 않는다', html: '📦 ZIP 에 들어 있는 것은 빈 <code>.env.example</code> 입니다. 받은 사람이 <code>.env</code> 로 복사해 자기 키를 채웁니다. 프로젝트를 GitHub 에 올릴 때는 <code>.gitignore</code> 에 <code>.env</code> 를 반드시 넣으세요. 13차시 배포에서 본 “비밀은 환경 변수로” 원칙이 그대로 적용됩니다.' },
          { type: 'h', text: '그래프 JSON 의 구조와 실행 순서' },
          { type: 'figure', html: IMG('11_json_panel', 'JSON 탭 — 그래프 원본'), caption: '그림 16-16. { } JSON 탭. 빌더가 저장하는 원본. key_ref 에는 이름만.' },
          { type: 'table', head: ['키', '내용', '비고'], rows: [
            ['<code>version</code>', '형식 버전 (현재 1)', '—'],
            ['<code>name</code> · <code>description</code>', '그래프 이름 · 설명', '내보낸 코드의 머리말 docstring 이 됩니다'],
            ['<code>nodes</code>', '<code>[{id, type, label, x, y, config}]</code>', '<code>type</code> 은 카탈로그의 36종 중 하나 · <code>x, y</code> 는 화면 좌표'],
            ['<code>edges</code>', '<code>[{id, from, fromPort, to, toPort}]</code>', '포트 이름은 카탈로그대로 · 템플릿 노드는 <code>{이름}</code> 이 포트'],
            ['<code>settings</code>', '<code>{max_loops: 5}</code>', '되돌아가는 간선의 최대 반복 횟수 (17차시)']
          ], caption: '그래프 JSON 의 다섯 키. 이것이 전부입니다.' },
          { type: 'p', html: '엔진은 노드를 어떤 순서로 실행할까요? 캔버스의 위치가 아니라 <b>간선</b>이 정합니다. 들어오는 간선이 없는 노드부터 시작해 간선을 따라 차례로 — 08차시 LangGraph 와 같은 <b>위상 정렬(topological sort)</b> 입니다. 되돌아가는 간선(루프)은 순서를 정할 때 빼 두었다가 실행 중에 활성화되면 그 목적지부터 다시 돕니다(17차시).' },
          { type: 'figure', html: FIG_ORDER, caption: '그림 16-17. 예제 02 의 실행 순서. 실선은 값이 흐르는 자료(text) 간선, 점선은 LLM 모델을 건네는 자원 간선. 자원 간선은 “도구 상자를 건네는” 연결이라 값의 흐름(건너뜀 판단)에는 끼지 않습니다.' },
          { type: 'code', title: '예제 16-12. engine.analyze: 실행 순서와 포트 구분 보기', code: `import json
from builder import engine

g = json.load(open('builder/02_persona_chain.json', encoding='utf-8'))
nodes_by_id, in_edges, out_edges, order, back = engine.analyze(g)
print('실행 순서:', ' → '.join(f"{nid}({nodes_by_id[nid]['label']})" for nid in order))
print('되돌아가는 간선:', back or '없음')
print('--- 노드별 입력 포트: 자료(text) 포트 vs 자원 포트 ---')
for nid in order:
    n = nodes_by_id[nid]
    ins, outs = engine.ports_of(n)
    data = [p['name'] for p in ins if p['kind'] in engine.DATA_KINDS]
    res = [p['name'] for p in ins if p['kind'] not in engine.DATA_KINDS]
    print(f"{nid} {n['type']:<9} 자료 입력 {data}  자원 입력 {res}")`,
            expect: `실행 순서: n1(고객 리뷰) → n2(LLM) → n3(요약 프롬프트) → n4(요약 (CS 담당자)) → n5(감성 분류 (JSON)) → n6(요약) → n7(감성)
되돌아가는 간선: 없음
--- 노드별 입력 포트: 자료(text) 포트 vs 자원 포트 ---
n1 input     자료 입력 []  자원 입력 []
n2 llm       자료 입력 []  자원 입력 []
n3 template  자료 입력 ['review']  자원 입력 []
n4 chat      자료 입력 ['input', 'context']  자원 입력 ['llm']
n5 chat      자료 입력 ['input', 'context']  자원 입력 ['llm']
n6 output    자료 입력 ['value']  자원 입력 []
n7 output    자료 입력 ['value']  자원 입력 []`,
            desc: '<code>analyze</code> 는 <code>validate</code> 와 <code>run_graph</code> 가 안에서 쓰는 함수입니다. 들어오는 간선이 없는 n1 · n2 가 먼저, 그다음 간선을 따라 n3 → n4 → n5 → 결과들. 같은 순위면 노드 목록 순서를 따르므로 실행 순서는 항상 같습니다. 템플릿 노드의 입력 포트 <code>review</code> 는 템플릿의 <code>{review}</code> 에서 생긴 것입니다.' },
          { type: 'code', title: '예제 16-13. 예제 02 실행과 내보내기 — 템플릿 · 역할 · JSON 이 코드로', code: `import json
from builder import engine, export

g = json.load(open('builder/02_persona_chain.json', encoding='utf-8'))
for r in engine.run_graph(g, emit=lambda ev: None):
    print(f"=== {r['title']} ===")
    print(r['value'])
print('--- 내보낸 코드의 흐름 ---')
code = export.export_python(g)
print(code[code.index('def main():'):].rstrip())`,
            expect: `=== 요약 ===
[고객센터 담당자] 요약: 다음 고객 리뷰를 한 문장으로: 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.
=== 감성 분류 (JSON) ===
{'sentiment': 'neutral', 'confidence': 0.6, 'reason': '핵심 단어를 근거로 판단'}
--- 내보낸 코드의 흐름 ---
def main():
    # ── 고객 리뷰 (시작 입력)
    review = sys.argv[1] if len(sys.argv) > 1 else '배송은 빨랐는데 포장이 찢어져서 왔어요. 제품 자체는 괜찮습니다.'

    # ── LLM (LLM 모델)
    llm1 = make_llm('mock')

    # ── 요약 프롬프트 (프롬프트 템플릿)
    template1 = fmt("""다음 고객 리뷰를 한 문장으로 요약해줘:

{review}""", {'review': review})

    # ── 요약 (CS 담당자) (LLM 호출)
    answer1_prompt = fmt('{input}', {'input': to_text(template1), 'context': to_text(None)})
    answer1_resp = llm1.chat([al.system('당신은 고객센터 담당자입니다. 정중하고 간결하게 말합니다.')] + [al.user(answer1_prompt)])
    answer1 = answer1_resp.content

    # ── 감성 분류 (JSON) (LLM 호출)
    answer2_prompt = fmt("""다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.

{input}""", {'input': to_text(review), 'context': to_text(None)})
    answer2_resp = llm1.chat([al.system('당신은 감성 분석기입니다.')] + [al.user(answer2_prompt)], json_mode=True)
    answer2 = answer2_resp.content
    answer2_json = answer2_resp.json()

    # ── 요약 (결과)
    print('\\n=== 요약 ===')
    print(to_text(answer1))

    # ── 감성 (결과)
    print('\\n=== 감성 분류 (JSON) ===')
    print(to_text(answer2_json))



if __name__ == '__main__':
    main()`,
            desc: '03차시의 역할 · 템플릿 · 구조화 출력이 노드 셋으로, 다시 코드로 돌아왔습니다. 시작 입력의 변수 이름 <code>review</code> 는 노드의 “변수 이름” 속성(<code>config.name</code>)에서 왔고, LLM 호출은 <code>answer1 · answer2</code> 로 번호가 붙습니다. 모의 LLM 의 요약은 템플릿으로 감싼 글 전체를 요약하므로 조금 어색합니다(실제 모델은 리뷰만 요약) — 예시 출력은 모의 LLM 기준입니다.' },
          { type: 'h', text: '예제 메뉴: 강좌 차시와 짝' },
          { type: 'figure', html: IMG('12_examples_menu', '예제 메뉴 — 차시 번호와 함께 표시된 예제 목록'), caption: '그림 16-18. 📚 예제 메뉴. 강좌 차시와 짝을 이룬 그래프 15개.' },
          { type: 'table', head: ['예제 파일', '내용', '강좌 차시'], rows: [
            ['<code>01_hello_llm</code>', '입력 → LLM 호출 → 결과', '02 (이번 교시)'],
            ['<code>02_persona_chain</code>', '역할 · 프롬프트 템플릿 · JSON 구조화 출력', '03 (이번 교시)'],
            ['<code>04_tool_agent</code>', '날씨 · 계산기 · 위키 도구 에이전트 (trace 출력)', '04 · 11'],
            ['<code>05_memory_chat</code> · <code>05_rag</code>', '대화 기억 · 문서 검색(RAG)', '05'],
            ['<code>06_reflection</code> · <code>06_react</code>', '계획 → 초안 → 비평·수정 · ReAct + 파이썬 도구', '06'],
            ['<code>08_router_loop</code>', '조건 분기 · 점수에 따른 되돌아가기(루프)', '08'],
            ['<code>09_crew</code> · <code>10_autogen</code>', '조사원 → 작가 → 편집자 Crew · 코더 ↔ 리뷰어 대화', '09 · 10 · 12'],
            ['<code>11_assistant_full</code> · <code>13_guardrail</code>', '분기 + 도구 + RAG + 기억 종합 비서 · 입출력 검사 + LLM 심사', '11 · 13'],
            ['<code>14_mcp_server</code> · <code>15_mcp_agent</code>', 'MCP 서버 · JSON-RPC 호출 · MCP 클라이언트로 원격 도구', '14'],
            ['<code>16_skills</code>', 'Skill 정의 · SKILL.md 가져오기 · 스킬 선택/프롬프트 조립', '15']
          ], caption: '예제와 차시의 대응. 모두 작업 폴더의 <code>builder/</code> 에 있으므로 코드 창에서 <code>json.load</code> 로 열 수 있습니다. 04 · 05 · 06 · 08 · 09 · 10 · 11 · 13 은 17차시에서 하나씩 다룹니다.' },
          { type: 'h', text: '📦 ZIP · run_graph.py · 배포' },
          { type: 'p', html: '빌더 밖에서 쓰는 세 가지 길입니다. ① 🐍 코드 탭의 <b>📦 ZIP</b> 은 실행에 필요한 것을 전부 묶은 패키지, ② 상단 <b>💾 저장</b>으로 받은 JSON 은 agentBuilder 저장소의 <code>run_graph.py</code> 로 빌더 없이 실행, ③ 빌더 자체를 내 PC · Cloudflare · GitHub Pages 에 배포.' },
          { type: 'table', head: ['📦 ZIP 안의 파일', '역할'], rows: [
            ['<code>이름.py</code>', '내보낸 스크립트 (예제 16-7)'],
            ['<code>agentlab/</code>', '이 강좌의 미니 프레임워크 — 스크립트가 옆 폴더에서 import'],
            ['<code>.env.example</code>', '키 견본 (예제 16-10). <code>.env</code> 로 복사해 채운다'],
            ['<code>README.md</code> · <code>그래프.json</code>', '실행 방법 · 빌더에서 다시 열 수 있는 원본']
          ], caption: '압축을 풀고 .env 를 채운 뒤 python 이름.py "질문". 키가 든 파일은 들어 있지 않습니다.' },
          { type: 'code', title: '내 PC 에서 — run_graph.py CLI (터미널에서 실행)', run: false, code: `git clone https://github.com/samcho93/agentBuilder.git
cd agentBuilder
python run_graph.py examples/01_hello_llm.json                     # 실행 (키는 .env · 환경 변수, 없으면 모의 LLM)
python run_graph.py examples/01_hello_llm.json "서울 날씨 알려줘"    # 시작 입력을 바꿔서 실행
python run_graph.py examples/01_hello_llm.json --validate           # 검증만 (engine.validate)
python run_graph.py examples/01_hello_llm.json --export hello.py    # 파이썬 코드로 내보내기 (export_python)
python run_graph.py --catalog                                       # 노드 카탈로그 JSON (nodes.catalog)
python hello.py "질문"                                              # 내보낸 코드 실행 (py/agentlab 이 옆에 있다)`,
            desc: '<code>run_graph.py</code> 는 1 · 2교시에서 우리가 쓴 <code>engine.run_graph · validate</code> 와 <code>export.export_python</code> 을 명령줄로 감싼 60줄짜리 스크립트입니다. 이벤트를 받아 ▶ · ✔ · === 결과 === 로 찍는 <code>print_event</code> 함수가 예제 16-4 의 <code>show</code> 와 같은 모양입니다. Colab 노트북에서 실제로 돌려 봅니다.' },
          { type: 'table', head: ['배포 방법', '명령', '키 모드'], rows: [
            ['내 PC', '<code>python server/app.py</code> (또는 <code>start.bat</code>) → <code>http://localhost:8090</code>', '🔒 서버 금고 (<code>server/data/</code> 암호화, 표준 라이브러리만)'],
            ['Cloudflare Pages', '<code>npm install</code> → <code>npx wrangler kv namespace create KEYS</code> → <code>npx wrangler pages secret put VAULT_SECRET</code> → <code>npm run deploy</code>', '🔒 서버 금고 (KV + 암호화)'],
            ['GitHub Pages 등 정적 호스팅', '저장소 그대로 (서버 함수 없음)', '🕒 브라우저 세션']
          ], caption: '배포 세 가지. 정적 호스팅은 서버가 없으므로 키가 탭에만 머무는 세션 모드로 동작합니다. 자세한 절차는 agentBuilder README · 📘 튜토리얼 13장.' },
          { type: 'colab', title: 'Colab 실습 16 — agentBuilder 를 빌더 없이 돌리기', html: '<p>노트북에서는 agentBuilder 저장소를 <code>git clone</code> 해 ① <code>run_graph.py</code> 로 예제 01 · 02 · 04 를 실행하고(시작 입력을 바꿔서) ② <code>--validate</code> · <code>--export</code> 로 검증과 코드 생성을 한 뒤 ③ 내보낸 <code>.py</code> 를 그대로 실행합니다. ④ Colab Secrets 의 <code>GEMINI_API_KEY</code> 를 환경 변수로 넣고 공급자를 Gemini 로 바꾼 그래프를 돌려 <b>같은 코드가 실제 모델로</b> 동작하는 것을 확인하고, ⑤ 그래프를 파이썬으로 수정해 저장한 뒤 다시 실행합니다. ✏️ 실습 문제 3개.</p>' },
          { type: 'callout', kind: 'info', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>예제 16-9 · 16-11 은 작업 폴더에 <code>hello.py</code> 를 씁니다. 브라우저 가상 파일 시스템이라 PC 에는 남지 않습니다.</li><li>교사 PC 에서 빌더의 🐍 코드 탭을 열어 두고, 코드 창의 예제 16-7 출력과 나란히 비교하며 진행하면 “같은 문자열”임이 바로 보입니다.</li><li>Colab 16 은 <code>git clone</code> 과 CLI 가 중심이라 키 없이도 전부 돕니다. 키가 있는 학생만 ④ 를 실행하게 하세요.</li><li>시간이 부족하면 예제 16-12(analyze)는 그림 16-17 설명으로 대신하고 실습 16-4 를 우선합니다.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '자주 나오는 오개념', teacher: true, html: '<ul><li><b>“내보낸 코드에는 빌더가 필요하다”</b> → 아닙니다. <code>agentlab/</code> 폴더만 있으면 독립 실행됩니다(📦 ZIP 이 묶어 줌). 빌더 종속이 없다는 점이 핵심.</li><li><b>“코드에 키가 안 보이니 키 없이 실행된다”</b> → 환경 변수 · .env 에서 읽습니다. 없으면 모의 LLM 으로 떨어지는 것뿐(예제 16-11).</li><li><b>“노드를 왼쪽에 두면 먼저 실행된다”</b> → 간선이 순서를 정합니다(예제 16-12). 좌표를 바꿔도 <code>order</code> 는 같습니다.</li><li><b>“모의 LLM 요약이 이상하니 빌더 버그”</b> → 모의 LLM 이 템플릿으로 감싼 글 전체를 요약해서 그렇습니다. 실제 모델은 리뷰만 요약합니다.</li></ul>' },
          { type: 'table', teacher: true, head: ['평가 항목', '상 (3)', '중 (2)', '하 (1)'], rows: [
            ['그래프 구성', '노드 · 간선 · 포트 이름이 모두 맞고 validate 통과', '한두 간선을 메시지 보고 수정해 통과', 'validate 오류 남음'],
            ['코드 대응', '노드 ↔ 내보낸 코드 줄을 짝지어 설명', '일부만 설명', '설명 못 함'],
            ['키 처리', '.env / 환경 변수 원칙과 key_ref 를 설명', 'key_ref 만 설명', '코드에 키를 넣으려 함'],
            ['실행', '내보낸 코드를 저장 · 실행해 결과 확인', '실행만', '실행 안 됨']
          ], caption: '실습 16-4 · 16-5 · 16-6 평가 루브릭' }
        ],
        practice: [
          { title: '실습 16-4. 프롬프트 템플릿 노드를 코드로 끼워 넣기', level: 2,
            desc: '<p>예제 01 그래프에 <b>프롬프트 템플릿</b> 노드(<code>type: template</code>, 템플릿 “다음 질문에 두 문장으로 답해줘: {q}”)를 추가하고, 연결을 <b>시작 입력 → 템플릿(q) → LLM 호출(input)</b> 으로 바꾸세요. 검증 후 실행해 템플릿 노드의 출력(<code>node_end</code> 이벤트의 <code>outputs[\'text\']</code>)과 결과를 출력하고, 내보낸 코드에서 <code>template1 =</code> 으로 시작하는 줄을 찾아 출력하세요.</p>',
            hint: '템플릿의 <code>{q}</code> 가 입력 포트 <code>q</code> 를 만듭니다. 기존 간선 <code>e1</code> 의 <code>to</code> 를 템플릿 노드로, <code>toPort</code> 를 <code>\'q\'</code> 로 바꾸고, 템플릿 <code>text</code> → LLM 호출 <code>input</code> 간선을 추가합니다.',
            starter: `import json
from builder import engine, export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
# TODO ① 템플릿 노드 n6 추가: {'id': 'n6', 'type': 'template', 'label': '질문 포장', 'x': 230, 'y': 160, 'config': {'template': ...}}
# TODO ② e1 의 to / toPort 를 n6 / 'q' 로 바꾸고, n6.text → n3.input 간선 e4 추가
print('검증:', engine.validate(g) or '문제 없음')

def show(ev):
    if ev['type'] == 'node_end' and ev['node'] == 'n6':
        print('템플릿 출력:', ev['outputs']['text'])
    elif ev['type'] == 'result':
        print('결과:', ev['value'])
engine.run_graph(g, emit=show)
# TODO ③ export.export_python(g) 에서 'template1 =' 으로 시작하는 줄 출력
`,
            solution: `import json
from builder import engine, export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
# ① 프롬프트 템플릿 노드 추가 — {q} 를 쓰면 q 라는 입력 포트가 생긴다
g['nodes'].append({'id': 'n6', 'type': 'template', 'label': '질문 포장', 'x': 230, 'y': 160,
                   'config': {'template': '다음 질문에 두 문장으로 답해줘: {q}'}})
# ② 연결 바꾸기: 입력 → 템플릿(q) → LLM 호출(input)
e1 = next(e for e in g['edges'] if e['id'] == 'e1')
e1['to'], e1['toPort'] = 'n6', 'q'
g['edges'].append({'id': 'e4', 'from': 'n6', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'})
print('검증:', engine.validate(g) or '문제 없음')

def show(ev):
    if ev['type'] == 'node_end' and ev['node'] == 'n6':
        print('템플릿 출력:', ev['outputs']['text'])
    elif ev['type'] == 'result':
        print('결과:', ev['value'])
engine.run_graph(g, emit=show)

code = export.export_python(g)
print('--- 내보낸 코드에서 템플릿 줄 ---')
for ln in code.splitlines():
    if ln.strip().startswith('template1 ='):
        print(ln.strip())
`,
            expect: `검증: 문제 없음
템플릿 출력: 다음 질문에 두 문장으로 답해줘: AI 에이전트가 뭔지 한 문장으로 설명해줘
결과: [친절한 AI 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.
--- 내보낸 코드에서 템플릿 줄 ---
template1 = fmt('다음 질문에 두 문장으로 답해줘: {q}', {'q': question})` },
          { title: '실습 16-5. 예제 02 역할 · 체인을 처음부터 코드로 만들기', level: 3,
            desc: '<p><code>builder/02_persona_chain.json</code> 을 <b>보지 않고</b>(예제 16-12 · 16-13 의 출력만 참고해) 같은 그래프를 dict 로 만드세요: 고객 리뷰(입력) → 요약 프롬프트(템플릿 <code>{review}</code>) → 요약(LLM 호출, 고객센터 담당자) → 요약(결과), 그리고 고객 리뷰 → 감성 분류(LLM 호출, JSON 모드) → 감성(결과). LLM 모델 하나를 두 LLM 호출에 연결합니다. 실행한 뒤 원본 02 의 실행 결과와 값이 같은지 비교하세요.</p>',
            hint: '간선 7개: n1.text→n3.review, n3.text→n4.input, n2.llm→n4.llm, n1.text→n5.input, n2.llm→n5.llm, n4.text→n6.value, n5.json→n7.value. 시스템 프롬프트와 템플릿 문장은 예제 16-13 의 코드에 그대로 있습니다.',
            starter: `import json
from builder import engine

REVIEW = '배송은 빨랐는데 포장이 찢어져서 왔어요. 제품 자체는 괜찮습니다.'
PROMPT = '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.\\n\\n{input}'
g = {
    'version': 1, 'name': '나의 02 역할 · 체인',
    'nodes': [
        {'id': 'n1', 'type': 'input', 'label': '고객 리뷰', 'x': 0, 'y': 100, 'config': {'text': REVIEW, 'name': 'review'}},
        {'id': 'n2', 'type': 'llm',   'label': 'LLM',       'x': 0, 'y': 300, 'config': {'provider': 'mock'}},
        # TODO: n3 template ('다음 고객 리뷰를 한 문장으로 요약해줘:\\n\\n{review}')
        # TODO: n4 chat (system '당신은 고객센터 담당자입니다. 정중하고 간결하게 말합니다.', prompt '{input}')
        # TODO: n5 chat (system '당신은 감성 분석기입니다.', prompt PROMPT, json_mode True)
        # TODO: n6 output (title '요약'), n7 output (title '감성 분류 (JSON)')
    ],
    'edges': [
        # TODO: 간선 7개
    ],
    'settings': {'max_loops': 5},
}
print('검증:', engine.validate(g) or '문제 없음')
mine = engine.run_graph(g, emit=lambda ev: None)
orig = engine.run_graph(json.load(open('builder/02_persona_chain.json', encoding='utf-8')), emit=lambda ev: None)
# TODO: 결과를 짝지어 제목 · 같은가 · 값 출력
`,
            solution: `import json
from builder import engine

REVIEW = '배송은 빨랐는데 포장이 찢어져서 왔어요. 제품 자체는 괜찮습니다.'
PROMPT = '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.\\n\\n{input}'
g = {
    'version': 1, 'name': '나의 02 역할 · 체인',
    'nodes': [
        {'id': 'n1', 'type': 'input',    'label': '고객 리뷰',   'x': 0,   'y': 100, 'config': {'text': REVIEW, 'name': 'review'}},
        {'id': 'n2', 'type': 'llm',      'label': 'LLM',         'x': 0,   'y': 300, 'config': {'provider': 'mock'}},
        {'id': 'n3', 'type': 'template', 'label': '요약 프롬프트', 'x': 300, 'y': 0,   'config': {'template': '다음 고객 리뷰를 한 문장으로 요약해줘:\\n\\n{review}'}},
        {'id': 'n4', 'type': 'chat',     'label': '요약',         'x': 600, 'y': 0,   'config': {'system': '당신은 고객센터 담당자입니다. 정중하고 간결하게 말합니다.', 'prompt': '{input}'}},
        {'id': 'n5', 'type': 'chat',     'label': '감성 분류',    'x': 600, 'y': 200, 'config': {'system': '당신은 감성 분석기입니다.', 'prompt': PROMPT, 'json_mode': True}},
        {'id': 'n6', 'type': 'output',   'label': '요약',         'x': 900, 'y': 0,   'config': {'title': '요약'}},
        {'id': 'n7', 'type': 'output',   'label': '감성',         'x': 900, 'y': 200, 'config': {'title': '감성 분류 (JSON)'}},
    ],
    'edges': [
        {'id': 'e1', 'from': 'n1', 'fromPort': 'text', 'to': 'n3', 'toPort': 'review'},
        {'id': 'e2', 'from': 'n3', 'fromPort': 'text', 'to': 'n4', 'toPort': 'input'},
        {'id': 'e3', 'from': 'n2', 'fromPort': 'llm',  'to': 'n4', 'toPort': 'llm'},
        {'id': 'e4', 'from': 'n1', 'fromPort': 'text', 'to': 'n5', 'toPort': 'input'},
        {'id': 'e5', 'from': 'n2', 'fromPort': 'llm',  'to': 'n5', 'toPort': 'llm'},
        {'id': 'e6', 'from': 'n4', 'fromPort': 'text', 'to': 'n6', 'toPort': 'value'},
        {'id': 'e7', 'from': 'n5', 'fromPort': 'json', 'to': 'n7', 'toPort': 'value'},
    ],
    'settings': {'max_loops': 5},
}
print('검증:', engine.validate(g) or '문제 없음')
mine = engine.run_graph(g, emit=lambda ev: None)
orig = engine.run_graph(json.load(open('builder/02_persona_chain.json', encoding='utf-8')), emit=lambda ev: None)
for a, b in zip(mine, orig):
    print(f"=== {a['title']} === 예제 02 와 같은가? {a['value'] == b['value']}")
    print(a['value'])
`,
            expect: `검증: 문제 없음
=== 요약 === 예제 02 와 같은가? True
[고객센터 담당자] 요약: 다음 고객 리뷰를 한 문장으로: 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.
=== 감성 분류 (JSON) === 예제 02 와 같은가? True
{'sentiment': 'neutral', 'confidence': 0.6, 'reason': '핵심 단어를 근거로 판단'}` },
          { title: '실습 16-6. 예제 02 를 내보내 다른 리뷰로 실행하기', level: 1,
            desc: '<p><code>builder/02_persona_chain.json</code> 을 <code>export.export_python</code> 으로 내보내 <code>persona.py</code> 로 저장하고, <code>sys.argv</code> 로 리뷰 “직원이 친절하고 배송도 빨라서 또 사고 싶어요!”를 넘겨 <code>runpy</code> 로 실행하세요. (예제 16-9 참고)</p>',
            hint: '<code>sys.argv = [\'persona.py\', \'리뷰 문장\']</code> 다음 <code>runpy.run_path(\'persona.py\', run_name=\'__main__\')</code>.',
            starter: `import json, sys, runpy
from builder import export

g = json.load(open('builder/02_persona_chain.json', encoding='utf-8'))
# TODO ① export_python 결과를 persona.py 로 저장
# TODO ② sys.argv 에 리뷰 문장 넣기
# TODO ③ runpy.run_path 로 실행
`,
            solution: `import json, sys, runpy
from builder import export

g = json.load(open('builder/02_persona_chain.json', encoding='utf-8'))
open('persona.py', 'w', encoding='utf-8').write(export.export_python(g))
sys.argv = ['persona.py', '직원이 친절하고 배송도 빨라서 또 사고 싶어요!']
runpy.run_path('persona.py', run_name='__main__')
`,
            expect: `  ↗ LLM 호출 #1 (mock/mock-1) — user: '다음 고객 리뷰를 한 문장으로 요약해줘:\\n\\n직원이 친절하고 배송도 빨라서 또 사고 싶어요!'
  ↙ 응답: '[고객센터 담당자] 요약: 다음 고객 리뷰를 한 문장으로: 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.'
  ↗ LLM 호출 #2 (mock/mock-1) — user: '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutr'
  ↙ 응답: '{"sentiment": "neutral", "confidence": 0.6, "reason": "핵심 단어'

=== 요약 ===
[고객센터 담당자] 요약: 다음 고객 리뷰를 한 문장으로: 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.

=== 감성 분류 (JSON) ===
{
  "sentiment": "neutral",
  "confidence": 0.6,
  "reason": "핵심 단어를 근거로 판단"
}` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '그래프 → 파이썬 코드', subtitle: '빌더는 코드를 그리는 도구다', notes: '<p><b>발문:</b> “노코드 도구의 가장 큰 불안은?” → 도구에 갇힌다, 밖으로 못 가져간다. agentBuilder 는 반대: 언제나 우리가 아는 agentlab 코드로 나온다. 1교시의 그래프를 빌더 🐍 탭에서 열어 보여 주며 시작.</p><p>⏱ 도입 3분</p>' },
          { layout: 'diagram', title: '같은 JSON · 두 가지 사용법', html: FIG_FLOW, caption: '위: 엔진이 실행 · 아래: 코드로 내보내 빌더 없이 실행',
            notes: '<p>1교시는 위 갈래(run_graph), 이번 교시는 아래 갈래(export_python). 오른쪽 아래 “python hello.py 질문”이 오늘의 목표 — 빌더 없이 도는 파일.</p>' },
          { layout: 'code', title: '내보내기: export_python', code: `import json
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
code = export.export_python(g)
print(len(code.splitlines()), '줄')
print(code[code.index('def main():'):])`, points: ['머리말 80줄은 늘 같다 (.env · make_llm · 도우미)', '<code>main()</code> = 그래프 그 자체', '노드 = 주석 + 몇 줄 · 간선 = 변수'],
            notes: '<p>▶ 실행. 출력의 <code># ── 질문 (시작 입력)</code> 주석을 빌더 캔버스의 노드 이름과 짝지어 읽습니다. “간선이 어디로 갔나?” → 변수 이름(question → answer1_prompt → answer1).</p>' },
          { layout: 'two', title: '노드 ↔ agentlab 1:1', left: { title: '빌더 노드', bullets: ['▶ 시작 입력', '🧠 LLM 모델', '💬 LLM 호출 (+JSON)', '🧩 프롬프트 템플릿', '🤖 에이전트 · 🔧 도구', '🏁 결과'] }, right: { title: '우리가 쓴 코드', bullets: ['<code>question = sys.argv[1] …</code>', '<code>al.LLM()</code> → <code>make_llm()</code>', '<code>llm.chat([system, user])</code> · <code>.json()</code>', '<code>fmt()</code> ≈ <code>PromptTemplate</code>', '<code>al.Agent(llm, tools=…)</code> · <code>@al.tool</code>', '<code>print()</code>'] },
            notes: '<p>왼쪽 항목을 하나씩 가리키며 오른쪽을 학생이 답하게 합니다. 새 API 가 하나도 없다는 점이 핵심. 예제 16-8 을 실행해 (A)=(B) 를 확인.</p>' },
          { layout: 'code', title: '파일로 저장 → 스크립트로 실행', code: `import json, sys, runpy
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
with open('hello.py', 'w', encoding='utf-8') as f:
    f.write(export.export_python(g))              # 💾 .py 버튼과 같다

sys.argv = ['hello.py', '에이전트와 챗봇의 차이는?']   # python hello.py "질문"
runpy.run_path('hello.py', run_name='__main__')`, points: ['<code>sys.argv[1]</code> = 첫 시작 입력', '<code>runpy</code> = 터미널의 <code>python hello.py</code>', '내 PC: agentlab/ 폴더만 옆에 (📦 ZIP)'],
            notes: '<p>▶ 실행. 터미널이 있다면 ZIP 을 풀어 실제로 <code>python 01_첫_LLM_호출.py "질문"</code> 을 쳐 보이면 가장 좋습니다. 빌더 종속이 없음을 강조.</p>' },
          { layout: 'code', title: '키는 코드 밖에: .env', code: `import json, sys, runpy
from builder import export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
llm = next(n for n in g['nodes'] if n['type'] == 'llm')
llm['config'].update({'provider': 'gemini', 'key_ref': 'gemini'})
code = export.export_python(g)
print('key_ref 가 코드에?', 'key_ref' in code)
print([ln.strip() for ln in code.splitlines() if 'os.environ.get' in ln][0])
print(export.env_example(g))

open('hello_gemini.py', 'w', encoding='utf-8').write(code)
sys.argv = ['hello_gemini.py']
runpy.run_path('hello_gemini.py', run_name='__main__')   # 키가 없으면?`, points: ['그래프: key_ref 이름 · 코드: 그마저도 없음', '<code>os.environ[\'GEMINI_API_KEY\']</code> · <code>.env</code>', '키 없음 → 경고 후 모의 LLM'],
            notes: '<p>▶ 실행. 첫 줄 ⚠ 경고를 읽어 줍니다. “.env 를 git 에 올리면?” → 13차시 배포의 비밀 관리와 연결. .gitignore 에 .env.</p>' },
          { layout: 'diagram', title: '실행 순서: 간선이 정한다', html: FIG_ORDER, caption: '위상 정렬 · 실선 = 자료(text) · 점선 = 자원(llm · tool)',
            notes: '<p><b>발문:</b> “n2 LLM 노드를 캔버스 맨 오른쪽으로 옮기면 순서가 바뀔까?” → 아니오, 간선이 정한다. 08차시 LangGraph 의 add_edge 와 같은 원리. 점선(자원)은 값의 흐름이 아니라 도구 상자 전달 — 17차시 분기 · 건너뜀에서 중요해짐을 예고.</p>' },
          { layout: 'code', title: 'engine.analyze 로 순서 보기', code: `import json
from builder import engine

g = json.load(open('builder/02_persona_chain.json', encoding='utf-8'))
nodes_by_id, in_edges, out_edges, order, back = engine.analyze(g)
print('순서:', [f"{nid} {nodes_by_id[nid]['label']}" for nid in order])
print('되돌아가는 간선:', back or '없음')
for nid in order:
    ins, _ = engine.ports_of(nodes_by_id[nid])
    kinds = {p['name']: p['kind'] for p in ins}
    print(nid, nodes_by_id[nid]['type'], kinds)`, points: ['들어오는 간선 없는 노드부터', '같은 순위 → 노드 목록 순서 (결정적)', '<code>kind</code>: text 만 값, 나머지는 자원'],
            notes: '<p>▶ 실행. 노드 순서를 바꾼 뒤(g[\'nodes\'].reverse()) 다시 실행하면 같은 순위 노드의 순서가 바뀌는 것을 보여 줄 수 있습니다 — 결과는 같음.</p>' },
          { layout: 'table', title: '예제 메뉴 ↔ 강좌 차시', head: ['예제', '내용', '차시'], rows: [
            ['01 · 02', 'LLM 호출 · 역할/템플릿/JSON', '02 · 03'],
            ['04', '도구 에이전트', '04 · 11'],
            ['05 · 06', '기억 · RAG · 계획/반성 · ReAct', '05 · 06'],
            ['08 · 09 · 10', '분기/반복 · Crew · AutoGen', '08 · 09 · 10'],
            ['11 · 13', '종합 비서 · 가드레일/심사', '11 · 13'],
            ['14 · 15 · 16', 'MCP 서버/클라이언트 · Skills', '14 · 15']
          ], lead: '📚 예제 15개 — 모두 작업 폴더 builder/ 에도 있다', notes: '<p>17차시 예고: 04 부터 13 까지 하나씩 열어 실행 → 내보낸 코드 비교 → 코드로 수정. 오늘은 01 · 02 만.</p>' },
          { layout: 'bullets', title: '📦 ZIP · run_graph.py · 배포', bullets: [
            '📦 ZIP = <code>이름.py</code> + <code>agentlab/</code> + <code>.env.example</code> + README + 그래프 JSON — 키는 없다',
            '<code>python run_graph.py 파일.json "질문"</code> — 빌더 없이 JSON 실행',
            '<code>--validate</code> 검증 · <code>--export out.py</code> 코드 생성 · <code>--catalog</code>',
            '배포: 내 PC <code>python server/app.py</code>(금고) · Cloudflare Pages(금고) · GitHub Pages(세션)',
            'Colab 16: clone → run_graph.py → export → Gemini 키로 실제 실행'
          ], notes: '<p>run_graph.py 는 오늘 쓴 함수 세 개를 명령줄로 감싼 것뿐임을 강조(60줄). 배포는 표만 보여 주고 README 로 안내. 공용 PC 키 삭제 당부.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[0].q, options: QUIZ2[0].options, answer: QUIZ2[0].answer, explain: QUIZ2[0].explain, notes: '<p>키 원칙 확인. 예제 16-11 의 ⚠ 경고 줄을 다시 보여 주며 정리.</p>' },
          { layout: 'practice', title: '실습 16-4. 템플릿 노드 끼워 넣기', desc: '<p>01 그래프에 프롬프트 템플릿 노드(“다음 질문에 두 문장으로 답해줘: {q}”)를 추가해 입력 → 템플릿 → LLM 호출로 연결하고, 실행 · 내보내기에서 <code>template1 =</code> 줄을 찾으세요.</p>',
            starter: `import json
from builder import engine, export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
# TODO: n6 template 노드 추가 ('다음 질문에 두 문장으로 답해줘: {q}')
# TODO: e1 → n6.q 로 바꾸고 n6.text → n3.input 간선 추가
print(engine.validate(g) or '문제 없음')
print(engine.run_graph(g, emit=lambda ev: None)[0]['value'])
# TODO: 내보낸 코드에서 'template1 =' 줄 출력`, solution: `import json
from builder import engine, export

g = json.load(open('builder/01_hello_llm.json', encoding='utf-8'))
g['nodes'].append({'id': 'n6', 'type': 'template', 'label': '질문 포장', 'x': 230, 'y': 160,
                   'config': {'template': '다음 질문에 두 문장으로 답해줘: {q}'}})
e1 = next(e for e in g['edges'] if e['id'] == 'e1')
e1['to'], e1['toPort'] = 'n6', 'q'
g['edges'].append({'id': 'e4', 'from': 'n6', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'})
print(engine.validate(g) or '문제 없음')
print(engine.run_graph(g, emit=lambda ev: None)[0]['value'])
for ln in export.export_python(g).splitlines():
    if ln.strip().startswith('template1 ='):
        print(ln.strip())`, notes: '<p>⏱ 8분. 끝난 학생은 실습 16-5(02 처음부터) · 16-6(내보내 실행). 완성한 dict 를 json.dump 로 저장해 빌더 📂 열기로 불러오면 캔버스에 템플릿 노드가 보입니다 — 시간이 되면 시연.</p>' },
          { layout: 'summary', title: '정리', bullets: ['<code>export.export_python(g)</code>: 노드 = 주석 + 코드 몇 줄 · 간선 = 변수 · <code>main()</code> = 그래프', '노드 ↔ agentlab 1:1 — 새 API 없음 (<code>llm.chat</code> · <code>fmt</code> · <code>al.Agent</code> · <code>print</code>)', '실행: 파일 저장 → <code>sys.argv</code> → <code>runpy</code> (내 PC: <code>python 이름.py "질문"</code>)', '키는 <code>.env</code> / 환경 변수에만 · 그래프 key_ref · 코드에는 없음 · 없으면 모의 LLM', '실행 순서 = 위상 정렬(간선) · 자료 포트 vs 자원 포트 · 예제 15개 ↔ 차시', '다음 차시: 예제 04~13 으로 도구 · 기억 · RAG · 분기 · 반복 · 팀 · 가드레일 다시 만들기'], notes: '<p>⏱ 8분. 과제: Colab 16 에서 run_graph.py 로 예제 04 실행 + --export. 출구 질문: “빌더 없이 내보낸 코드를 돌리려면 무엇이 필요한가?” → agentlab 폴더와 (선택) .env.</p>' }
        ]
      }
    ]
  });
})();
