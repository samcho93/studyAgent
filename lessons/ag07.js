/* 07차시 LangChain 기초: 프롬프트 · 체인 · 도구 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 7-1. LangChain 이 해결하는 문제 */
  const FIG_PROBLEM = `<svg viewBox="0 0 700 300" role="img" aria-label="앱이 LangChain 추상화 층을 거쳐 여러 LLM 공급자와 부품을 같은 사용법으로 쓰는 그림">
  ${ARROW('m07a1')}
  <rect x="20" y="110" width="140" height="70" rx="14" class="p5s"/><text x="90" y="140" text-anchor="middle" class="tx-b">내 에이전트 앱</text><text x="90" y="162" text-anchor="middle" class="tx-m">한 가지 사용법</text>
  <rect x="230" y="40" width="220" height="210" rx="16" class="p1s"/>
  <text x="340" y="68" text-anchor="middle" class="tx-b">⛓️ LangChain</text>
  <rect x="250" y="84" width="180" height="34" rx="8" class="p1"/><text x="340" y="106" text-anchor="middle" class="tx-w">① 공급자 추상화</text>
  <rect x="250" y="130" width="180" height="34" rx="8" class="p2"/><text x="340" y="152" text-anchor="middle" class="tx-w">② 재사용 부품 (Runnable)</text>
  <rect x="250" y="176" width="180" height="34" rx="8" class="p3"/><text x="340" y="198" text-anchor="middle" class="tx-w">③ 조합 ( | 연산자 )</text>
  <text x="340" y="236" text-anchor="middle" class="tx-m">프롬프트 · 모델 · 파서 · 도구 · 메모리</text>
  <line x1="162" y1="145" x2="226" y2="145" class="ln" stroke-width="2.5" marker-end="url(#m07a1)"/>
  <rect x="520" y="40" width="160" height="36" rx="8" class="card-bg"/><text x="600" y="63" text-anchor="middle" class="tx">Google Gemini</text>
  <rect x="520" y="92" width="160" height="36" rx="8" class="card-bg"/><text x="600" y="115" text-anchor="middle" class="tx">OpenAI · Anthropic</text>
  <rect x="520" y="144" width="160" height="36" rx="8" class="card-bg"/><text x="600" y="167" text-anchor="middle" class="tx">Groq · OpenRouter</text>
  <rect x="520" y="196" width="160" height="36" rx="8" class="card-bg"/><text x="600" y="219" text-anchor="middle" class="tx">Ollama (내 PC)</text>
  <line x1="452" y1="101" x2="516" y2="62" class="ln" stroke-width="2" marker-end="url(#m07a1)"/>
  <line x1="452" y1="101" x2="516" y2="108" class="ln" stroke-width="2" marker-end="url(#m07a1)"/>
  <line x1="452" y1="101" x2="516" y2="158" class="ln" stroke-width="2" marker-end="url(#m07a1)"/>
  <line x1="452" y1="101" x2="516" y2="210" class="ln" stroke-width="2" marker-end="url(#m07a1)"/>
  <text x="350" y="282" text-anchor="middle" class="tx-m">모델을 바꿔도 앱 코드는 그대로 · 부품을 레고처럼 끼워 맞춘다</text>
</svg>`;

  /* 그림 7-2. LCEL 파이프 */
  const FIG_LCEL = `<svg viewBox="0 0 720 260" role="img" aria-label="입력 dict 가 프롬프트, LLM, 파서를 파이프로 차례로 지나며 메시지, 응답, 문자열로 바뀌는 그림">
  ${ARROW('m07a2')}
  <rect x="10" y="90" width="110" height="60" rx="12" class="p5s"/><text x="65" y="116" text-anchor="middle" class="tx-b">입력</text><text x="65" y="136" text-anchor="middle" class="tx-m">{'text': …}</text>
  <rect x="170" y="80" width="140" height="80" rx="14" class="p1"/><text x="240" y="112" text-anchor="middle" class="tx-w">PromptTemplate</text><text x="240" y="134" text-anchor="middle" class="tx-w">변수 채우기</text>
  <rect x="360" y="80" width="140" height="80" rx="14" class="p2"/><text x="430" y="112" text-anchor="middle" class="tx-w">LLM</text><text x="430" y="134" text-anchor="middle" class="tx-w">모델 호출</text>
  <rect x="550" y="80" width="140" height="80" rx="14" class="p3"/><text x="620" y="112" text-anchor="middle" class="tx-w">StrOutputParser</text><text x="620" y="134" text-anchor="middle" class="tx-w">문자열 꺼내기</text>
  <line x1="122" y1="120" x2="166" y2="120" class="ln" stroke-width="2.5" marker-end="url(#m07a2)"/>
  <line x1="312" y1="120" x2="356" y2="120" class="ln" stroke-width="2.5" marker-end="url(#m07a2)"/>
  <line x1="502" y1="120" x2="546" y2="120" class="ln" stroke-width="2.5" marker-end="url(#m07a2)"/>
  <text x="334" y="110" text-anchor="middle" class="tx-b">|</text>
  <text x="524" y="110" text-anchor="middle" class="tx-b">|</text>
  <text x="240" y="190" text-anchor="middle" class="tx-m">→ 메시지 목록</text>
  <text x="430" y="190" text-anchor="middle" class="tx-m">→ Response</text>
  <text x="620" y="190" text-anchor="middle" class="tx-m">→ str</text>
  <text x="360" y="40" text-anchor="middle" class="tx-b">chain = prompt | llm | parser   →   chain.invoke({'text': …})</text>
  <text x="360" y="238" text-anchor="middle" class="tx-m">LCEL(LangChain Expression Language): 앞 단계의 출력이 다음 단계의 입력 · 유닉스 파이프와 같은 생각</text>
</svg>`;

  /* 그림 7-3. Runnable 부품 상자 */
  const FIG_RUNNABLE = `<svg viewBox="0 0 720 300" role="img" aria-label="invoke 를 가진 Runnable 부품 다섯 종류: 프롬프트, LLM, 파서, 람다, 병렬">
  <rect x="10" y="10" width="700" height="50" rx="12" class="p1s"/>
  <text x="360" y="32" text-anchor="middle" class="tx-b">Runnable = invoke(입력) → 출력 을 가진 모든 것 · | 로 이을 수 있고 · batch() 로 여러 입력을 한 번에</text>
  <text x="360" y="50" text-anchor="middle" class="tx-m">agentlab 과 LangChain 이 같은 이름을 쓴다</text>
  <rect x="10" y="80" width="130" height="110" rx="12" class="card-bg"/><text x="75" y="106" text-anchor="middle" class="tx-b">PromptTemplate</text><text x="75" y="128" text-anchor="middle" class="tx-m">dict → 메시지</text><text x="75" y="148" text-anchor="middle" class="tx-m">{변수} 채우기</text><text x="75" y="172" text-anchor="middle" class="tx-m">ChatPromptTemplate</text>
  <rect x="152" y="80" width="130" height="110" rx="12" class="card-bg"/><text x="217" y="106" text-anchor="middle" class="tx-b">LLM</text><text x="217" y="128" text-anchor="middle" class="tx-m">메시지 → Response</text><text x="217" y="148" text-anchor="middle" class="tx-m">al.LLM()</text><text x="217" y="172" text-anchor="middle" class="tx-m">ChatGoogleGenerativeAI</text>
  <rect x="294" y="80" width="130" height="110" rx="12" class="card-bg"/><text x="359" y="106" text-anchor="middle" class="tx-b">OutputParser</text><text x="359" y="128" text-anchor="middle" class="tx-m">Response → str</text><text x="359" y="148" text-anchor="middle" class="tx-m">Response → dict</text><text x="359" y="172" text-anchor="middle" class="tx-m">Str · Json</text>
  <rect x="436" y="80" width="130" height="110" rx="12" class="card-bg"/><text x="501" y="106" text-anchor="middle" class="tx-b">RunnableLambda</text><text x="501" y="128" text-anchor="middle" class="tx-m">내 파이썬 함수</text><text x="501" y="148" text-anchor="middle" class="tx-m">전처리 · 후처리</text><text x="501" y="172" text-anchor="middle" class="tx-m">분기(라우터)</text>
  <rect x="578" y="80" width="130" height="110" rx="12" class="card-bg"/><text x="643" y="106" text-anchor="middle" class="tx-b">RunnableParallel</text><text x="643" y="128" text-anchor="middle" class="tx-m">dict 의 각 항목을</text><text x="643" y="148" text-anchor="middle" class="tx-m">같은 입력으로 실행</text><text x="643" y="172" text-anchor="middle" class="tx-m">→ dict 로 모음</text>
  <rect x="10" y="210" width="700" height="70" rx="12" class="p3s"/>
  <text x="30" y="236" class="tx-b">체인 = 부품의 나열</text>
  <text x="30" y="260" class="tx-m">prompt | llm | parser   ·   RunnableLambda(clean) | prompt | llm | JsonOutputParser()   ·   RunnableParallel({'a': chain1, 'b': chain2}) | RunnableLambda(merge)</text>
</svg>`;

  /* 그림 7-4. 도구와 에이전트 (이름 대응) */
  const FIG_TOOLAGENT = `<svg viewBox="0 0 720 300" role="img" aria-label="함수에 tool 데코레이터를 붙여 스키마를 만들고, 모델에 묶고, 에이전트 루프로 돌리는 과정을 agentlab 과 LangChain 이름으로 나란히 보인 그림">
  ${ARROW('m07a3')}
  <text x="120" y="30" text-anchor="middle" class="tx-b">① 함수 → 도구</text>
  <text x="360" y="30" text-anchor="middle" class="tx-b">② 모델에 도구 알리기</text>
  <text x="600" y="30" text-anchor="middle" class="tx-b">③ 루프 돌리기</text>
  <rect x="30" y="50" width="180" height="100" rx="14" class="p1s"/>
  <text x="120" y="78" text-anchor="middle" class="tx">@al.tool</text>
  <text x="120" y="100" text-anchor="middle" class="tx-m">docstring → 설명</text>
  <text x="120" y="120" text-anchor="middle" class="tx-m">타입 힌트 → 스키마</text>
  <rect x="270" y="50" width="180" height="100" rx="14" class="p2s"/>
  <text x="360" y="78" text-anchor="middle" class="tx">llm.chat(msgs, tools=[…])</text>
  <text x="360" y="100" text-anchor="middle" class="tx-m">스키마를 요청에 첨부</text>
  <text x="360" y="120" text-anchor="middle" class="tx-m">→ r.tool_calls</text>
  <rect x="510" y="50" width="180" height="100" rx="14" class="p3s"/>
  <text x="600" y="78" text-anchor="middle" class="tx">al.Agent(llm, tools).run()</text>
  <text x="600" y="100" text-anchor="middle" class="tx-m">호출 → 실행 → 결과 전달</text>
  <text x="600" y="120" text-anchor="middle" class="tx-m">→ 최종 답</text>
  <line x1="212" y1="100" x2="266" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m07a3)"/>
  <line x1="452" y1="100" x2="506" y2="100" class="ln" stroke-width="2.5" marker-end="url(#m07a3)"/>
  <rect x="30" y="180" width="180" height="90" rx="14" class="card-bg"/>
  <text x="120" y="205" text-anchor="middle" class="tx-b">LangChain</text>
  <text x="120" y="228" text-anchor="middle" class="tx-m">from langchain_core.tools</text>
  <text x="120" y="248" text-anchor="middle" class="tx-m">import tool → @tool</text>
  <rect x="270" y="180" width="180" height="90" rx="14" class="card-bg"/>
  <text x="360" y="205" text-anchor="middle" class="tx-b">LangChain</text>
  <text x="360" y="228" text-anchor="middle" class="tx-m">llm.bind_tools([…])</text>
  <text x="360" y="248" text-anchor="middle" class="tx-m">.invoke(…).tool_calls</text>
  <rect x="510" y="180" width="180" height="90" rx="14" class="card-bg"/>
  <text x="600" y="205" text-anchor="middle" class="tx-b">LangGraph</text>
  <text x="600" y="228" text-anchor="middle" class="tx-m">create_react_agent(llm, tools)</text>
  <text x="600" y="248" text-anchor="middle" class="tx-m">.invoke({'messages': […]})</text>
  <text x="360" y="292" text-anchor="middle" class="tx-m">위: 브라우저(agentlab) · 아래: Colab(실제 LangChain) — 같은 세 단계, 거의 같은 이름</text>
</svg>`;

  /* 그림 7-5. 메시지 기록이 있는 체인 */
  const FIG_MEMORY = `<svg viewBox="0 0 700 280" role="img" aria-label="세션별 대화 기록 저장소에서 기록을 꺼내 프롬프트에 끼워 넣고, 답을 다시 저장하는 흐름">
  ${ARROW('m07a4')}
  <rect x="20" y="100" width="130" height="60" rx="12" class="p5s"/><text x="85" y="126" text-anchor="middle" class="tx-b">입력</text><text x="85" y="146" text-anchor="middle" class="tx-m">'내 이름이 뭐지?'</text>
  <rect x="220" y="80" width="180" height="100" rx="14" class="p1"/><text x="310" y="108" text-anchor="middle" class="tx-w">프롬프트</text><text x="310" y="130" text-anchor="middle" class="tx-w">system</text><text x="310" y="148" text-anchor="middle" class="tx-w">+ [기록 history]</text><text x="310" y="166" text-anchor="middle" class="tx-w">+ user 입력</text>
  <rect x="470" y="100" width="100" height="60" rx="12" class="p2"/><text x="520" y="135" text-anchor="middle" class="tx-w">LLM</text>
  <rect x="610" y="100" width="80" height="60" rx="12" class="p3s"/><text x="650" y="135" text-anchor="middle" class="tx">답</text>
  <line x1="152" y1="130" x2="216" y2="130" class="ln" stroke-width="2.5" marker-end="url(#m07a4)"/>
  <line x1="402" y1="130" x2="466" y2="130" class="ln" stroke-width="2.5" marker-end="url(#m07a4)"/>
  <line x1="572" y1="130" x2="606" y2="130" class="ln" stroke-width="2.5" marker-end="url(#m07a4)"/>
  <rect x="220" y="210" width="180" height="56" rx="12" class="p4s"/><text x="310" y="234" text-anchor="middle" class="tx-b">🗂 기록 저장소</text><text x="310" y="254" text-anchor="middle" class="tx-m">session_id → [메시지…]</text>
  <line x1="310" y1="208" x2="310" y2="184" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m07a4)"/>
  <path d="M650 162 C650 240 420 238 404 238" class="ln" stroke-width="2" stroke-dasharray="6 4" fill="none" marker-end="url(#m07a4)"/>
  <text x="520" y="215" text-anchor="middle" class="tx-m">질문과 답을 저장</text>
  <text x="350" y="40" text-anchor="middle" class="tx-b">RunnableWithMessageHistory 의 생각: "체인은 그대로, 기록만 끼워 넣는다"</text>
</svg>`;

  /* 그림 7-6. 병렬과 분기 */
  const FIG_COMPOSE = `<svg viewBox="0 0 720 300" role="img" aria-label="왼쪽은 입력을 여러 체인에 동시에 보내 dict 로 모으는 병렬, 오른쪽은 라우터 함수가 입력에 따라 체인을 고르는 분기">
  ${ARROW('m07a5')}
  <text x="180" y="28" text-anchor="middle" class="tx-b">병렬 RunnableParallel</text>
  <rect x="20" y="110" width="90" height="50" rx="10" class="p5s"/><text x="65" y="140" text-anchor="middle" class="tx">입력</text>
  <rect x="170" y="50" width="120" height="40" rx="10" class="p1"/><text x="230" y="75" text-anchor="middle" class="tx-w">요약 체인</text>
  <rect x="170" y="115" width="120" height="40" rx="10" class="p2"/><text x="230" y="140" text-anchor="middle" class="tx-w">번역 체인</text>
  <rect x="170" y="180" width="120" height="40" rx="10" class="p3"/><text x="230" y="205" text-anchor="middle" class="tx-w">감성 체인</text>
  <line x1="112" y1="128" x2="166" y2="72" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <line x1="112" y1="135" x2="166" y2="135" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <line x1="112" y1="142" x2="166" y2="198" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <rect x="300" y="110" width="50" height="50" rx="10" class="card-bg"/><text x="325" y="140" text-anchor="middle" class="tx">dict</text>
  <line x1="292" y1="72" x2="298" y2="125" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <line x1="292" y1="135" x2="298" y2="135" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <line x1="292" y1="198" x2="298" y2="145" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <text x="180" y="250" text-anchor="middle" class="tx-m">{'summary': …, 'translation': …, 'sentiment': …}</text>
  <line x1="380" y1="20" x2="380" y2="280" class="ln" stroke-dasharray="4 4"/>
  <text x="550" y="28" text-anchor="middle" class="tx-b">분기 RunnableLambda(router)</text>
  <rect x="400" y="110" width="90" height="50" rx="10" class="p5s"/><text x="445" y="140" text-anchor="middle" class="tx">입력</text>
  <rect x="520" y="105" width="80" height="60" rx="30" class="p4"/><text x="560" y="130" text-anchor="middle" class="tx-w">router</text><text x="560" y="148" text-anchor="middle" class="tx-w">if …</text>
  <line x1="492" y1="135" x2="516" y2="135" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <rect x="630" y="60" width="80" height="40" rx="10" class="p1"/><text x="670" y="85" text-anchor="middle" class="tx-w">짧은 글</text>
  <rect x="630" y="170" width="80" height="40" rx="10" class="p2"/><text x="670" y="195" text-anchor="middle" class="tx-w">긴 글</text>
  <line x1="602" y1="120" x2="626" y2="88" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <line x1="602" y1="150" x2="626" y2="182" class="ln" stroke-width="2" marker-end="url(#m07a5)"/>
  <text x="550" y="250" text-anchor="middle" class="tx-m">함수가 조건을 보고 체인을 골라 invoke</text>
</svg>`;

  const QUIZ1 = [
    { q: 'LCEL 에서 <code>chain = prompt | llm | parser</code> 의 뜻으로 알맞은 것은?', options: ['세 부품을 동시에 실행한다', '앞 부품의 출력이 다음 부품의 입력이 되는 순차 체인을 만든다', 'llm 이 prompt 와 parser 를 도구로 호출한다', '세 부품 중 하나만 골라 실행한다'], answer: 1,
      explain: '<code>|</code> 는 유닉스 파이프처럼 "앞의 출력 → 뒤의 입력"으로 잇습니다. 실행은 <code>chain.invoke(입력)</code> 을 부를 때 차례로 일어납니다.' },
    { q: '<code>PromptTemplate(\'{text} 를 {lang} 로 번역해 줘\')</code> 의 <code>invoke</code> 가 돌려주는 것은?', options: ['번역된 문자열', 'LLM 응답 객체', '변수가 채워진 메시지 목록', 'JSON dict'], answer: 2,
      explain: '프롬프트 템플릿은 LLM 을 부르지 않습니다. 변수를 채운 <code>[{"role": "user", "content": "…"}]</code> 메시지 목록을 만들어 다음 단계(LLM)에 넘길 뿐입니다.' },
    { q: 'LLM 응답에서 JSON 을 꺼내 dict 로 바꾸는 부품은?', options: ['<code>StrOutputParser</code>', '<code>JsonOutputParser</code>', '<code>RunnableLambda</code>', '<code>ChatPromptTemplate</code>'], answer: 1,
      explain: '<code>JsonOutputParser</code> 는 응답 텍스트(코드 울타리 포함)에서 JSON 을 찾아 파이썬 dict 로 돌려줍니다. <code>StrOutputParser</code> 는 문자열만 꺼냅니다.' },
    { q: '<code>chain.batch([a, b, c])</code> 의 설명으로 옳은 것은?', options: ['세 입력을 하나로 합쳐 한 번 실행한다', '첫 입력만 실행한다', '입력마다 <code>invoke</code> 한 결과를 목록으로 돌려준다', '세 체인을 만든다'], answer: 2,
      explain: '<code>batch</code> 는 여러 입력을 각각 실행해 결과 목록을 돌려줍니다. 실제 LangChain 은 가능한 경우 병렬로 호출해 시간을 줄입니다.' }
  ];
  const QUIZ2 = [
    { q: 'LangChain 의 <code>@tool</code> 데코레이터가 함수에서 자동으로 읽어 가는 정보 두 가지는?', options: ['변수 이름과 반환값', 'docstring(설명)과 타입 힌트(매개변수 스키마)', '파일 이름과 줄 번호', '실행 시간과 메모리'], answer: 1,
      explain: 'docstring 이 도구 설명, 타입 힌트가 JSON 스키마가 되어 LLM 에 전달됩니다. <code>agentlab</code> 의 <code>@al.tool</code> 도 같은 규칙입니다. 설명이 좋을수록 LLM 이 도구를 잘 고릅니다.' },
    { q: '<code>llm.bind_tools([add])</code> 뒤에 <code>.invoke("3 더하기 4는?")</code> 를 하면?', options: ['add 가 실행되어 7 이 돌아온다', '모델이 "add 를 (3, 4) 로 불러 달라"는 tool_calls 를 돌려준다', '오류가 난다', '모델이 직접 7 이라고 답한다'], answer: 1,
      explain: '<code>bind_tools</code> 는 모델에게 도구 스키마를 알려줄 뿐 실행하지 않습니다. 실행과 결과 전달 루프는 <code>create_react_agent</code>(LangGraph) 또는 직접 작성한 루프가 맡습니다.' },
    { q: '<code>RunnableWithMessageHistory</code> 의 핵심 아이디어는?', options: ['LLM 을 더 큰 모델로 바꾼다', '체인은 그대로 두고 세션별 대화 기록을 프롬프트에 끼워 넣는다', '도구 호출 결과를 저장한다', '프롬프트를 자동으로 번역한다'], answer: 1,
      explain: '05차시의 <code>ConversationMemory</code> 와 같은 생각입니다. 세션 id 로 기록을 찾아 프롬프트의 <code>history</code> 자리에 넣고, 답을 다시 기록에 저장합니다.' },
    { q: '입력의 길이에 따라 <b>다른 체인</b>을 실행하려면 어떤 부품을 쓰는 것이 가장 자연스러울까요?', options: ['<code>RunnableParallel</code>', '조건문이 든 함수를 감싼 <code>RunnableLambda</code>', '<code>StrOutputParser</code>', '<code>PromptTemplate</code>'], answer: 1,
      explain: '분기(라우팅)는 "입력을 보고 체인을 고르는 함수"로 만듭니다. <code>RunnableParallel</code> 은 모든 체인을 다 실행해 모으는 병렬용입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag07',
    no: '07',
    title: 'LangChain 기초: 프롬프트 · 체인 · 도구',
    subtitle: 'LCEL 파이프로 부품을 잇고, 도구와 메모리를 더해 에이전트로',
    summary: 'Part 3 의 첫 프레임워크 <b>LangChain</b>입니다. 공급자를 가리고(추상화) 프롬프트 · 모델 · 파서를 <b>재사용 부품(Runnable)</b>으로 만들어 <code>|</code> 로 조합하는 <b>LCEL</b> 을 익힙니다. 브라우저에서는 이름을 똑같이 맞춘 <code>agentlab</code> 의 미니 LangChain 으로 체인 · 도구 · 메모리 · 병렬 · 분기를 직접 돌리고, Colab 에서는 실제 <code>langchain</code> 패키지로 같은 코드를 실행합니다.',
    goals: [
      'LangChain 이 해결하는 세 가지 문제(공급자 추상화 · 재사용 부품 · 조합)를 설명할 수 있다',
      'PromptTemplate | LLM | OutputParser 체인을 만들고 invoke · batch 로 실행할 수 있다',
      'RunnableLambda · RunnableParallel 로 전처리 · 병렬 · 분기를 조합할 수 있다',
      '@tool 로 만든 도구를 에이전트에 연결하고 메모리를 끼워 넣을 수 있다',
      'agentlab 코드와 실제 LangChain 코드의 이름 대응을 알고 Colab 에서 실행할 수 있다'
    ],
    sections: [
      {
        id: 'ag07-1',
        title: 'LCEL: 프롬프트 | 모델 | 파서',
        minutes: 50,
        goals: ['LangChain 이 왜 필요한지 세 가지로 말한다', 'PromptTemplate · LLM · OutputParser 를 | 로 이어 invoke 한다', 'RunnableLambda · RunnableParallel · batch 를 사용한다'],
        flow: [['도입 · 왜 프레임워크인가', 6], ['LCEL 파이프 개념 · 첫 체인', 12], ['프롬프트 · 파서 (코드)', 12], ['람다 · 병렬 · batch (코드)', 12], ['퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: 'Part 2 까지 우리는 에이전트의 4대 요소를 <code>agentlab</code> 으로 직접 만들었습니다. 그런데 매번 <code>llm.chat</code> 에 메시지를 조립하고, 응답에서 JSON 을 꺼내고, 도구 루프를 쓰는 일은 반복됩니다. <b>LangChain</b> 은 이런 반복을 <b>재사용 가능한 부품</b>으로 만들어 둔 가장 널리 쓰이는 프레임워크입니다.' },
          { type: 'h', text: 'LangChain 이 해결하는 세 가지 문제' },
          { type: 'figure', html: FIG_PROBLEM, caption: '그림 7-1. ① 공급자 추상화 ② 재사용 부품 ③ 조합. 모델을 Gemini 에서 Groq 로 바꿔도 앱 코드는 그대로입니다.' },
          { type: 'table', head: ['문제', 'LangChain 의 답', 'agentlab 에서 이미 본 것'], rows: [
            ['공급자마다 API 가 다르다', '<code>ChatGoogleGenerativeAI</code> · <code>ChatOpenAI</code> · <code>ChatGroq</code> 가 같은 <code>invoke</code> 를 가짐', '<code>al.LLM(\'gemini\')</code> / <code>al.LLM(\'groq\')</code> 가 같은 <code>chat</code>'],
            ['프롬프트 · 파싱 코드가 반복된다', '<code>PromptTemplate</code> · <code>OutputParser</code> 부품', '02차시의 f-string 과 <code>parse_json</code>'],
            ['부품을 잇는 코드가 지저분하다', '<b>LCEL</b>: <code>prompt | llm | parser</code>', '이번 차시에서 배움']
          ], caption: '표 7-1. "직접 만들어 본 것"이 있으니 LangChain 의 부품이 무엇을 숨기는지 보입니다.' },
          { type: 'h', text: 'LCEL: 파이프(|)로 부품 잇기' },
          { type: 'p', html: '<b>LCEL</b>(LangChain Expression Language)의 핵심은 단 하나, <b>앞 부품의 출력이 다음 부품의 입력</b>이라는 것입니다. 유닉스 셸의 <code>cat file | grep 단어 | sort</code> 와 같은 생각입니다. <code>invoke(입력)</code> 을 가진 모든 것을 <b>Runnable</b> 이라고 부르고, Runnable 끼리는 <code>|</code> 로 이을 수 있습니다.' },
          { type: 'figure', html: FIG_LCEL, caption: '그림 7-2. 세 부품을 지나며 데이터 형태가 dict → 메시지 목록 → Response → 문자열로 바뀝니다.' },
          { type: 'code', title: '예제 7-1. 체인 없이 vs 체인으로 (같은 번역 작업)', code: `import agentlab as al

llm = al.LLM()

# (1) 체인 없이: 매번 문자열을 조립하고 content 를 꺼낸다
text, lang = '안녕하세요', '영어'
r = llm.chat([al.user(f'{text} 를 {lang} 로 번역해 줘')])
print('직접 호출:', r.content)

# (2) 체인으로: 부품을 한 번 만들어 두고 입력만 바꾼다
prompt = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘')
chain = prompt | llm | al.StrOutputParser()
print('체인      :', chain.invoke({'text': '안녕하세요', 'lang': '영어'}))
print('체인 재사용:', chain.invoke({'text': '감사합니다', 'lang': '일본어'}))
print('체인 구조 :', chain)`,
            expect: `직접 호출: Translation: 안녕하세요
체인      : Translation: 안녕하세요
체인 재사용: Translation: 감사합니다
체인 구조 : PromptTemplate(['lang', 'text']) | LLM(mock, mock-1) | StrOutputParser()`,
            desc: '결과는 같지만 (2)는 <b>부품을 한 번 정의하고 입력만 바꿔</b> 재사용합니다. <code>print(chain)</code> 으로 세 부품이 파이프로 이어진 구조를 볼 수 있습니다. 모의 LLM 은 번역 대신 <code>Translation: 원문</code> 을 돌려주며, 🔑 키를 넣으면 실제 번역이 나옵니다.' },
          { type: 'code', title: '예제 7-2. 프롬프트 템플릿은 "메시지를 만드는 부품"', code: `import agentlab as al

prompt = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘', system='당신은 전문 번역가입니다.')
print('변수:', prompt.variables)
print('format():', prompt.format(text='사과', lang='영어'))

msgs = prompt.invoke({'text': '사과', 'lang': '영어'})      # LLM 을 부르지 않는다!
for m in msgs:
    print(m['role'], '|', m['content'])

# 변수가 하나뿐이면 문자열을 바로 넣어도 된다
one = al.PromptTemplate('다음 글을 한 줄로 요약: {text}')
print(one.invoke('에이전트는 도구를 쓴다.'))`,
            expect: `변수: ['lang', 'text']
format(): 사과 를 영어 로 번역해 줘
system | 당신은 전문 번역가입니다.
user | 사과 를 영어 로 번역해 줘
[{'role': 'user', 'content': '다음 글을 한 줄로 요약: 에이전트는 도구를 쓴다.'}]`,
            desc: '<code>PromptTemplate.invoke</code> 는 변수를 채운 <b>메시지 목록</b>을 돌려줄 뿐 LLM 을 부르지 않습니다. 그래서 체인에서 다음 부품(LLM)의 입력이 됩니다. <code>system=</code> 으로 03차시의 역할도 함께 넣습니다.' },
          { type: 'code', title: '예제 7-3. ChatPromptTemplate: 역할별 메시지 목록으로 쓰기', code: `import agentlab as al
from agentlab.chain import ChatPromptTemplate     # agentlab 에서는 chain 모듈에 있다

llm = al.LLM()
prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 친절한 과학 선생님입니다.'),
    ('user', '{question}'),
])
chain = prompt | llm | al.StrOutputParser()
print(chain.invoke({'question': '에이전트가 뭐야?'}))
print(chain.invoke({'question': '안녕하세요'}))`,
            expect: `[친절한 과학 선생님] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.
[친절한 과학 선생님] 안녕하세요! 무엇을 도와드릴까요?`,
            desc: '실제 LangChain 에서 가장 많이 쓰는 형태가 <code>ChatPromptTemplate.from_messages([(역할, 내용), ...])</code> 입니다. 답 앞의 <code>[친절한 과학 선생님]</code> 은 모의 LLM 이 system 역할을 표시하는 방식입니다.' },
          { type: 'code', title: '예제 7-4. 실제 LangChain 코드 — 이름이 같다! (Colab 에서 실행)', run: false, code: `# pip install langchain langchain-google-genai
from langchain_core.prompts import ChatPromptTemplate      # agentlab.chain.ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser  # al.StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI  # al.LLM('gemini')

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash')     # GOOGLE_API_KEY 환경 변수 사용
prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 친절한 과학 선생님입니다.'),
    ('user', '{question}'),
])
chain = prompt | llm | StrOutputParser()
print(chain.invoke({'question': '에이전트가 뭐야?'}))

# 공급자만 바꾸기: 나머지 코드는 그대로
# from langchain_groq import ChatGroq
# llm = ChatGroq(model='llama-3.3-70b-versatile')`,
            desc: '예제 7-3 과 비교해 보세요. <code>import</code> 줄만 다르고 <code>from_messages</code> · <code>|</code> · <code>StrOutputParser</code> · <code>invoke</code> 가 모두 같습니다. <code>agentlab</code> 의 이름을 실제 LangChain 과 맞춰 두었기 때문입니다. Colab 노트북에서 이 코드를 실행합니다.' },
          { type: 'h', text: '출력 파서: 문자열 또는 JSON 으로' },
          { type: 'code', title: '예제 7-5. JsonOutputParser 로 구조화 출력 받기 + batch', code: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate(
    '다음 리뷰의 감성을 분석해 JSON {{"sentiment": "positive|negative|neutral", "confidence": 0~1}} 로만 답해 줘.\\n리뷰: {review}')
chain = prompt | llm | al.JsonOutputParser()        # 응답 텍스트 → dict

result = chain.invoke({'review': '배송이 빠르고 품질이 좋아요'})
print(type(result).__name__, result)
print('감성만:', result['sentiment'])

reviews = ['화면이 선명하고 최고예요', '소리가 끊겨서 실망했어요', '그냥 평범한 제품입니다']
for review, r in zip(reviews, chain.batch([{'review': x} for x in reviews])):
    print(f"{r['sentiment']:<9} {r['confidence']:.1f}  {review}")`,
            expect: `dict {'sentiment': 'positive', 'confidence': 0.9, 'reason': '핵심 단어를 근거로 판단'}
감성만: positive
positive  0.9  화면이 선명하고 최고예요
negative  0.9  소리가 끊겨서 실망했어요
neutral   0.6  그냥 평범한 제품입니다`,
            desc: '템플릿 안의 <code>{{ }}</code> 는 "변수가 아닌 진짜 중괄호"라는 뜻입니다(파이썬 <code>format</code> 규칙). <code>batch</code> 는 입력 목록을 각각 <code>invoke</code> 해 결과 목록을 돌려줍니다. 실제 LangChain 은 가능하면 병렬로 호출합니다.' },
          { type: 'h', text: 'RunnableLambda 와 RunnableParallel' },
          { type: 'figure', html: FIG_RUNNABLE, caption: '그림 7-3. Runnable 부품 다섯 가지. 내 함수도 <code>RunnableLambda</code> 로 감싸면 체인의 한 칸이 됩니다.' },
          { type: 'code', title: '예제 7-6. 내 함수를 체인에 끼우기 (전처리 · 후처리)', code: `import agentlab as al

llm = al.LLM()

def clean(x):                      # 전처리: 공백 정리 + 기본 언어
    return {'text': x['text'].strip(), 'lang': x.get('lang', '영어')}

def shout(s):                      # 후처리: 느낌표 붙이기
    return s.upper() + '!'

translate = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘') | llm | al.StrOutputParser()
chain = al.RunnableLambda(clean) | translate | al.RunnableLambda(shout)
print(chain)
print(chain.invoke({'text': '   좋은 아침   '}))
print(chain.invoke({'text': '감사합니다', 'lang': '일본어'}))`,
            expect: `RunnableLambda(clean) | PromptTemplate(['lang', 'text']) | LLM(mock, mock-1) | StrOutputParser() | RunnableLambda(shout)
TRANSLATION: 좋은 아침!
TRANSLATION: 감사합니다!`,
            desc: '<code>translate</code> 라는 체인을 다른 체인의 한 칸으로 썼습니다. 체인도 Runnable 이므로 <b>체인 안에 체인</b>을 넣을 수 있습니다. 함수는 그냥 <code>|</code> 에 넣어도 자동으로 <code>RunnableLambda</code> 가 됩니다.' },
          { type: 'code', title: '예제 7-7. RunnableParallel: 같은 입력을 여러 체인에 동시에', code: `import agentlab as al
from agentlab.chain import RunnableParallel

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()
count = al.RunnableLambda(lambda x: len(x['text']))      # LLM 없이 글자 수

parallel = RunnableParallel({'summary': summarize, 'translation': translate, 'chars': count})
print(parallel)
out = parallel.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다. 다음 행동을 정한다.'})
for k, v in out.items():
    print(f'{k:<12}: {v}')
print('LLM 호출 횟수:', llm.calls)`,
            expect: `RunnableParallel(summary, translation, chars)
summary     : 요약: 에이전트는 도구를 호출한다 등 총 3개 문장의 핵심을 한 줄로 정리했습니다.
translation : Translation: 에이전트는 도구를 호출한다. 결과를 관찰한다. 다음 행동을 정한다.
chars       : 37
LLM 호출 횟수: 2`,
            desc: 'dict 의 각 항목이 <b>같은 입력</b>을 받아 실행되고 결과가 dict 로 모입니다. 실제 LangChain 은 이 항목들을 진짜 병렬(스레드)로 돌려 시간을 줄입니다. <code>|</code> 안에 dict 를 바로 넣어도 <code>RunnableParallel</code> 로 자동 변환됩니다.' },
          { type: 'callout', kind: 'tip', title: 'agentlab 과 LangChain 이름 대응표', html: '<table><tr><th>agentlab (브라우저)</th><th>LangChain (Colab)</th></tr><tr><td><code>al.LLM()</code></td><td><code>ChatGoogleGenerativeAI(model=…)</code> · <code>ChatGroq</code> · <code>ChatOpenAI</code></td></tr><tr><td><code>al.PromptTemplate</code> · <code>agentlab.chain.ChatPromptTemplate</code></td><td><code>langchain_core.prompts.PromptTemplate</code> · <code>ChatPromptTemplate</code></td></tr><tr><td><code>al.StrOutputParser</code> · <code>al.JsonOutputParser</code></td><td><code>langchain_core.output_parsers.StrOutputParser</code> · <code>JsonOutputParser</code></td></tr><tr><td><code>al.RunnableLambda</code> · <code>agentlab.chain.RunnableParallel</code> · <code>RunnablePassthrough</code></td><td><code>langchain_core.runnables.RunnableLambda</code> · <code>RunnableParallel</code> · <code>RunnablePassthrough</code></td></tr><tr><td><code>chain.invoke / batch</code></td><td><code>chain.invoke / batch / stream / ainvoke</code></td></tr></table>' },
          { type: 'callout', kind: 'more', title: '더 알아보기: stream 과 비동기', html: '실제 LangChain 체인은 <code>chain.stream(입력)</code> 으로 토큰을 <b>생성되는 대로</b> 받을 수 있고(채팅 UI 의 타자 효과), <code>await chain.ainvoke(입력)</code> 으로 여러 요청을 동시에 처리할 수 있습니다. 부품을 Runnable 로 통일했기 때문에 <b>모든 체인이 공짜로</b> 이 기능을 얻습니다.' }
        ],
        practice: [
          { title: '실습 7-1. 번역 체인 여러 언어로 돌리기', level: 1,
            desc: '<p>예제 7-1 의 번역 체인을 만들고 <code>batch</code> 로 "좋은 아침"을 <b>영어 · 일본어 · 중국어</b>로 한 번에 번역해 <code>언어: 결과</code> 형태로 출력하세요.</p>',
            hint: '<code>chain.batch([{\'text\': \'좋은 아침\', \'lang\': l} for l in langs])</code>',
            starter: `import agentlab as al

llm = al.LLM()
chain = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘') | llm | al.StrOutputParser()
langs = ['영어', '일본어', '중국어']
# TODO: batch 로 한 번에 번역하고 '언어: 결과' 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
chain = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘') | llm | al.StrOutputParser()
langs = ['영어', '일본어', '중국어']
results = chain.batch([{'text': '좋은 아침', 'lang': l} for l in langs])
for lang, r in zip(langs, results):
    print(f'{lang}: {r}')
`,
            expect: `영어: Translation: 좋은 아침
일본어: Translation: 좋은 아침
중국어: Translation: 좋은 아침` },
          { title: '실습 7-2. 정보 추출 체인 만들기', level: 2,
            desc: '<p>문장에서 <b>이름 · 이메일 · 전화번호</b>를 JSON 으로 뽑는 체인을 <code>JsonOutputParser</code> 로 만들고, 두 문장을 <code>batch</code> 로 처리해 이름만 출력하세요. (02차시의 정보 추출 프롬프트를 템플릿으로 바꾸는 연습입니다)</p>',
            hint: '템플릿 안의 JSON 예시는 <code>{{"name": ..., "email": ..., "phone": ...}}</code> 처럼 중괄호를 두 번 씁니다.',
            starter: `import agentlab as al

llm = al.LLM()
# TODO: 추출 템플릿 (JSON 예시의 중괄호는 {{ }} 로)
prompt = al.PromptTemplate('TODO: {text}')
chain = prompt | llm | al.JsonOutputParser()
texts = ['저는 김영준입니다. 연락은 yj.kim@example.com 또는 010-1234-5678 로 주세요.',
         '담당자는 박지민 씨이고 이메일은 jimin@school.kr 입니다.']
# TODO: batch 로 처리하고 이름만 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate('다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {{"name": ..., "email": ..., "phone": ...}} 으로 답하라.\\n문장: {text}')
chain = prompt | llm | al.JsonOutputParser()
texts = ['저는 김영준입니다. 연락은 yj.kim@example.com 또는 010-1234-5678 로 주세요.',
         '담당자는 박지민 씨이고 이메일은 jimin@school.kr 입니다.']
for r in chain.batch([{'text': t} for t in texts]):
    print(r['name'], '|', r['email'], '|', r['phone'])
`,
            expect: `김영준 | yj.kim@example.com | 010-1234-5678
박지민 | jimin@school.kr | None` },
          { title: '실습 7-3. (도전) 병렬 분석 결과를 보고서로 합치기', level: 3,
            desc: '<p>예제 7-7 의 <code>RunnableParallel</code> 뒤에 <code>RunnableLambda</code> 를 이어, dict 결과를 <code>- summary: …</code> 형식의 여러 줄 문자열(보고서)로 합치는 체인을 완성하세요. 체인 하나를 <code>invoke</code> 하면 보고서 문자열이 나와야 합니다.</p>',
            hint: '<code>def merge(d): return "\\n".join(f"- {k}: {v}" for k, v in d.items())</code> → <code>parallel | merge</code>',
            starter: `import agentlab as al
from agentlab.chain import RunnableParallel

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()
parallel = RunnableParallel({'summary': summarize, 'translation': translate})

def merge(d):
    # TODO: dict → '- 키: 값' 줄들을 합친 문자열
    return ''

report_chain = parallel      # TODO: merge 를 이어 붙이기
print(report_chain.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다.'}))
`,
            solution: `import agentlab as al
from agentlab.chain import RunnableParallel

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()
parallel = RunnableParallel({'summary': summarize, 'translation': translate})

def merge(d):
    return '\\n'.join(f'- {k}: {v}' for k, v in d.items())

report_chain = parallel | al.RunnableLambda(merge)
print(report_chain.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다.'}))
`,
            expect: `- summary: 요약: 에이전트는 도구를 호출한다 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.
- translation: Translation: 에이전트는 도구를 호출한다. 결과를 관찰한다.` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'LangChain 기초', subtitle: 'LCEL: 프롬프트 | 모델 | 파서', notes: '<p>Part 3 시작. "지금까지 직접 만든 것을 프레임워크는 어떻게 부품으로 만들었나"가 관점입니다.</p><p>💬 발문: "02~06차시에서 매번 반복해서 쓴 코드가 뭐였나요?" → llm.chat, 메시지 조립, JSON 파싱, 도구 루프.</p><p>⏱ 도입 6분</p>' },
          { layout: 'diagram', title: 'LangChain 이 해결하는 세 가지', html: FIG_PROBLEM, caption: '공급자 추상화 · 재사용 부품 · 조합',
            notes: '<p>표 7-1 과 함께: 각 문제를 agentlab 에서 이미 어떻게 겪었는지 연결합니다. al.LLM(\'gemini\') ↔ al.LLM(\'groq\') 가 공급자 추상화의 예.</p>' },
          { layout: 'diagram', title: 'LCEL: 파이프로 잇기', html: FIG_LCEL, caption: '앞의 출력 = 뒤의 입력',
            notes: '<p>유닉스 파이프 비유. 💬 "각 화살표 위를 지나는 데이터의 형태는?" → dict → 메시지 → Response → str. 이 형태 변화를 아는 것이 디버깅의 핵심.</p>' },
          { layout: 'code', title: '첫 체인', code: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘')
chain = prompt | llm | al.StrOutputParser()

print(chain.invoke({'text': '안녕하세요', 'lang': '영어'}))
print(chain.invoke({'text': '감사합니다', 'lang': '일본어'}))
print(chain)`, points: ['부품은 한 번, 입력만 바꿔 재사용', '<code>print(chain)</code> 으로 구조 확인', '모의 LLM 은 <code>Translation: 원문</code>'],
            notes: '<p>▶ 실행. 🔑 키가 있는 학생은 실제 번역이 나옵니다. 체인 객체를 print 해 구조를 눈으로 확인시킵니다.</p>' },
          { layout: 'code', title: '프롬프트 템플릿은 메시지를 만든다', code: `import agentlab as al

prompt = al.PromptTemplate('{text} 를 {lang} 로 번역해 줘',
                           system='당신은 전문 번역가입니다.')
print(prompt.variables)
msgs = prompt.invoke({'text': '사과', 'lang': '영어'})   # LLM 호출 없음
for m in msgs:
    print(m['role'], '|', m['content'])`, points: ['<code>invoke</code> → 메시지 목록', 'LLM 을 부르지 않는다', '<code>system=</code> 으로 역할 포함'],
            notes: '<p>💬 "이 코드는 API 키가 필요할까?" → 아니요. 템플릿은 문자열 작업일 뿐. 퀴즈 2번과 연결.</p>' },
          { layout: 'two', title: 'agentlab vs 실제 LangChain', left: { title: '브라우저 (agentlab)', code: `import agentlab as al
from agentlab.chain import ChatPromptTemplate

llm = al.LLM()
prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 친절한 과학 선생님입니다.'),
    ('user', '{question}')])
chain = prompt | llm | al.StrOutputParser()
print(chain.invoke({'question': '에이전트가 뭐야?'}))` }, right: { title: 'Colab (langchain)', bullets: ['<code>from langchain_core.prompts import ChatPromptTemplate</code>', '<code>from langchain_core.output_parsers import StrOutputParser</code>', '<code>from langchain_google_genai import ChatGoogleGenerativeAI</code>', '<code>llm = ChatGoogleGenerativeAI(model=\'gemini-2.5-flash\')</code>', '나머지 줄은 <b>완전히 같다</b>'] },
            notes: '<p>▶ 왼쪽 실행. 오른쪽은 import 세 줄만 다르다는 것을 강조. Colab 노트북 07 에서 실제로 돌립니다.</p>' },
          { layout: 'code', title: 'JsonOutputParser + batch', code: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate(
    '리뷰의 감성을 JSON {{"sentiment": "...", "confidence": 0~1}} 로만 답해 줘.\\n리뷰: {review}')
chain = prompt | llm | al.JsonOutputParser()
reviews = ['화면이 선명하고 최고예요', '소리가 끊겨서 실망했어요']
for r in chain.batch([{'review': x} for x in reviews]):
    print(r['sentiment'], r['confidence'])`, points: ['<code>{{ }}</code> = 진짜 중괄호', '응답 → dict', '<code>batch</code> = 입력 목록 → 결과 목록'],
            notes: '<p>중괄호 두 번 쓰는 규칙에서 학생들이 자주 막힙니다. 실습 7-2 힌트로 다시 안내.</p>' },
          { layout: 'diagram', title: 'Runnable 부품 다섯 가지', html: FIG_RUNNABLE, caption: 'invoke 가 있으면 무엇이든 체인의 한 칸',
            notes: '<p>부품을 외우기보다 "입력 형태 → 출력 형태"로 기억하게 합니다.</p>' },
          { layout: 'code', title: 'RunnableLambda · RunnableParallel', code: `import agentlab as al
from agentlab.chain import RunnableParallel

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()
count = al.RunnableLambda(lambda x: len(x['text']))

parallel = RunnableParallel({'summary': summarize, 'translation': translate, 'chars': count})
out = parallel.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다.'})
for k, v in out.items():
    print(k, ':', v)`, points: ['람다 = 내 함수 한 칸', '병렬 = 같은 입력 → dict', '체인 안에 체인 OK'],
            notes: '<p>▶ 실행. 실제 LangChain 은 병렬 항목을 스레드로 동시에 호출해 시간을 줄인다고 설명.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>정답 ③. 템플릿은 메시지를 만들 뿐.</p>' },
          { layout: 'practice', title: '실습 7-2. 정보 추출 체인', desc: '<p>이름 · 이메일 · 전화번호를 JSON 으로 뽑는 체인을 만들고 두 문장을 batch 로 처리하세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate('TODO: {text}')   # JSON 예시는 {{ }} 로
chain = prompt | llm | al.JsonOutputParser()
texts = ['저는 김영준입니다. 연락은 yj.kim@example.com 으로.',
         '담당자는 박지민 씨이고 이메일은 jimin@school.kr 입니다.']
# TODO: batch → 이름 출력`, solution: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate('다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {{"name": ..., "email": ..., "phone": ...}} 으로 답하라.\\n문장: {text}')
chain = prompt | llm | al.JsonOutputParser()
texts = ['저는 김영준입니다. 연락은 yj.kim@example.com 으로.',
         '담당자는 박지민 씨이고 이메일은 jimin@school.kr 입니다.']
for r in chain.batch([{'text': t} for t in texts]):
    print(r['name'], r['email'])`, notes: '<p>8분. 02차시 정보 추출 프롬프트를 템플릿으로 옮기는 것이 목표.</p>' },
          { layout: 'summary', title: '정리', bullets: ['LangChain = 공급자 추상화 · 재사용 부품 · 조합', '<b>LCEL</b>: <code>prompt | llm | parser</code>, 앞의 출력 = 뒤의 입력', '<code>PromptTemplate</code> → 메시지, <code>StrOutputParser</code> → str, <code>JsonOutputParser</code> → dict', '<code>RunnableLambda</code>(내 함수) · <code>RunnableParallel</code>(병렬) · <code>batch</code>', '다음 교시: 도구 · 에이전트 · 메모리 · 분기'], notes: '<p>⏱ 정리 8분(퀴즈 포함).</p>' }
        ]
      },
      {
        id: 'ag07-2',
        title: 'LangChain 의 도구와 에이전트 · 메모리 · 조합',
        minutes: 50,
        goals: ['@tool 로 도구를 만들고 에이전트에 연결한다', '대화 기록을 체인에 끼워 넣는 메모리 구조를 만든다', '출력 파서 · 병렬 · 분기로 체인을 조합한다', 'Colab 에서 실제 LangChain 도구 에이전트를 실행한다'],
        flow: [['도입 · 도구를 체인에', 5], ['@tool · bind_tools · 에이전트 (코드)', 14], ['메모리 체인 (코드)', 10], ['구조화 · 병렬 · 분기 (코드)', 13], ['Colab 안내 · 퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '1교시의 체인은 <b>직선</b>이었습니다. 입력이 들어가면 정해진 부품을 지나 출력이 나옵니다. 그런데 에이전트는 <b>도구를 고르고, 결과를 보고, 다시 생각</b>해야 합니다. LangChain 에서는 도구를 <code>@tool</code> 로 만들고, <code>bind_tools</code> 로 모델에 알리고, <b>LangGraph 의 <code>create_react_agent</code></b> 로 루프를 돌립니다. 04차시에서 직접 만든 세 단계와 정확히 같습니다.' },
          { type: 'figure', html: FIG_TOOLAGENT, caption: '그림 7-4. 함수 → 도구 → 모델에 알리기 → 루프. 위는 agentlab, 아래는 LangChain · LangGraph 의 이름입니다.' },
          { type: 'code', title: '예제 7-8. @tool 로 도구 만들고 스키마 확인하기', code: `import agentlab as al
import json

@al.tool
def add(a: int, b: int) -> dict:
    """두 수를 더한다

    a: 첫 번째 수
    b: 두 번째 수
    """
    return {'a': a, 'b': b, 'result': a + b}

print('그냥 함수처럼:', add(3, 4))
print('이름:', add.name, '| 설명:', add.description)
print(json.dumps(add.schema(), ensure_ascii=False, indent=1))`,
            expect: `그냥 함수처럼: {'a': 3, 'b': 4, 'result': 7}
이름: add | 설명: 두 수를 더한다
{
 "name": "add",
 "description": "두 수를 더한다",
 "parameters": {
  "type": "object",
  "properties": {
   "a": {
    "type": "integer",
    "description": "첫 번째 수"
   },
   "b": {
    "type": "integer",
    "description": "두 번째 수"
   }
  },
  "required": [
   "a",
   "b"
  ]
 }
}`,
            desc: 'docstring 첫 줄이 <b>설명</b>, 타입 힌트가 <b>스키마</b>, <code>a: 첫 번째 수</code> 줄이 매개변수 설명이 됩니다. LangChain 의 <code>langchain_core.tools.tool</code> 도 같은 규칙으로 <code>add.name</code> · <code>add.description</code> · <code>add.args</code> 를 만듭니다.' },
          { type: 'code', title: '예제 7-9. 도구를 모델에 알리고 → 에이전트로 루프 돌리기', code: `import agentlab as al

@al.tool
def add(a: int, b: int) -> dict:
    """두 수를 더한다"""
    return {'a': a, 'b': b, 'result': a + b}

llm = al.LLM()
# ② 모델에 도구 알리기 (LangChain 의 bind_tools): 실행은 하지 않고 "호출 요청"만 돌아온다
r = llm.chat([al.user('3 더하기 4는?')], tools=[add])
print('tool_calls:', r.tool_calls)
print('content   :', repr(r.content))

# ③ 루프 돌리기 (LangGraph 의 create_react_agent): 호출 → 실행 → 결과 전달 → 최종 답
agent = al.Agent(llm, tools=[add], verbose=True)
print('최종 답:', agent.run('3 더하기 4는?'))`,
            expect: `tool_calls: [ToolCall(add, {"a": 3, "b": 4})]
content   : ''
🔧 도구 호출 1: add({"a": 3, "b": 4})
👁 관찰: {"a": 3, "b": 4, "result": 7}
✅ 최종 답: 계산 결과는 7 입니다.
최종 답: 계산 결과는 7 입니다.`,
            desc: '<code>tools=[add]</code> 를 넘긴 첫 호출은 <b>실행이 아니라 요청</b>(<code>tool_calls</code>)만 돌려줍니다. 에이전트가 그 요청을 실행하고 결과를 다시 넣어 최종 답을 받습니다. 이 두 단계 구분이 LangChain 의 <code>bind_tools</code> 와 <code>create_react_agent</code> 의 구분과 같습니다.' },
          { type: 'code', title: '예제 7-10. 실제 LangChain · LangGraph 도구 에이전트 (Colab 에서 실행)', run: false, code: `# pip install langchain langchain-google-genai langgraph
from langchain_core.tools import tool                       # al.tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent           # al.Agent

@tool
def add(a: int, b: int) -> int:
    """두 수를 더한다"""
    return a + b

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
print(add.name, add.description, add.args)                  # 스키마 확인

# ② bind_tools: 모델에 도구 알리기 → tool_calls 만 돌아온다
msg = llm.bind_tools([add]).invoke('3 더하기 4는?')
print(msg.tool_calls)        # [{'name': 'add', 'args': {'a': 3, 'b': 4}, 'id': '...'}]

# ③ create_react_agent: 루프 (호출 → 실행 → 결과 전달 → 답)
agent = create_react_agent(llm, [add])
result = agent.invoke({'messages': [('user', '3 더하기 4는?')]})
for m in result['messages']:
    print(type(m).__name__, '|', m.content or getattr(m, 'tool_calls', ''))`,
            desc: '예제 7-8 · 7-9 와 줄 단위로 대응합니다. <code>create_react_agent</code> 는 이름에 ReAct 가 들어 있지만 06차시의 텍스트 형식이 아니라 <b>함수 호출 루프</b>를 LangGraph 그래프로 만든 것입니다(08차시에서 직접 만듭니다). 결과의 <code>messages</code> 에 HumanMessage → AIMessage(tool_calls) → ToolMessage → AIMessage 가 차례로 쌓입니다.' },
          { type: 'code', title: '예제 7-11. 도구가 여럿일 때 에이전트가 고르기', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.get_weather, al.calculator, al.now], system='당신은 여행 비서입니다.', verbose=True)
print(agent.run('부산 날씨 알려줘'))
print('-' * 30)
agent.reset()
print(agent.run('1500 * 0.15 는 얼마야?'))
print('-' * 30)
agent.trace()`,
            desc: '질문에 따라 다른 도구가 호출됩니다. <code>get_weather</code> 는 브라우저에서 실제 Open-Meteo API 를 부르므로 결과가 매번 다릅니다. <code>trace()</code> 로 마지막 실행의 단계를 표로 볼 수 있습니다.' },
          { type: 'h', text: '메모리: 대화 기록을 체인에 끼워 넣기' },
          { type: 'p', html: '체인은 기본적으로 <b>기억이 없습니다</b>. 매번 새 입력만 봅니다. LangChain 의 <code>RunnableWithMessageHistory</code> 는 체인을 감싸서 <b>세션별 대화 기록</b>을 프롬프트의 <code>history</code> 자리에 끼워 넣고, 답을 다시 기록에 저장합니다. 05차시 <code>ConversationMemory</code> 와 같은 생각입니다.' },
          { type: 'figure', html: FIG_MEMORY, caption: '그림 7-5. 기록 저장소에서 꺼내 → 프롬프트에 끼워 → 답을 다시 저장. 체인 자체는 바뀌지 않습니다.' },
          { type: 'code', title: '예제 7-12. ConversationMemory 를 체인에 끼우기', code: `import agentlab as al

llm = al.LLM()
store = {}                                       # session_id → ConversationMemory

def get_history(session_id):
    if session_id not in store:
        store[session_id] = al.ConversationMemory(window=6, system_prompt='당신은 비서입니다.')
    return store[session_id]

def with_history(x):                             # 입력 → 기록이 포함된 메시지 목록
    mem = get_history(x['session_id'])
    mem.add_user(x['input'])
    return mem.messages()

chain = al.RunnableLambda(with_history) | llm | al.StrOutputParser()

def ask(session_id, text):
    out = chain.invoke({'session_id': session_id, 'input': text})
    get_history(session_id).add_assistant(out)   # 답도 기록에 저장
    print(f'[{session_id}] {text} → {out}')

ask('u1', '내 이름은 영준이야')
ask('u1', '내 이름이 뭐지?')          # 같은 세션: 기억한다
ask('u2', '내 이름이 뭐지?')          # 다른 세션: 모른다
print('u1 기록:', len(store['u1'].messages()), '개 메시지')`,
            expect: `[u1] 내 이름은 영준이야 → [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
[u1] 내 이름이 뭐지? → [비서] 당신의 이름은 영준 입니다.
[u2] 내 이름이 뭐지? → [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
u1 기록: 5 개 메시지`,
            desc: '<code>get_history(session_id)</code> 가 세션별 기록을 찾고, <code>with_history</code> 가 기록을 포함한 메시지 목록을 만들어 LLM 에 넘깁니다. 실제 LangChain 에서는 이 두 함수의 역할을 <code>RunnableWithMessageHistory(chain, get_history, ...)</code> 가 대신합니다(아래 예제). 첫 답에서 "이름을 못 들었다"고 하는 것은 모의 LLM 의 규칙(질문이 아니면 이름을 확인하지 않음)입니다.' },
          { type: 'code', title: '예제 7-13. 실제 LangChain 의 RunnableWithMessageHistory (Colab 에서 실행)', run: false, code: `from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 비서입니다.'),
    MessagesPlaceholder('history'),          # ← 기록이 끼워지는 자리
    ('user', '{input}'),
])
store = {}
def get_history(session_id):                  # 세션별 기록
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

chain = RunnableWithMessageHistory(prompt | llm, get_history,
                                   input_messages_key='input', history_messages_key='history')
cfg = {'configurable': {'session_id': 'u1'}}
print(chain.invoke({'input': '내 이름은 영준이야'}, config=cfg).content)
print(chain.invoke({'input': '내 이름이 뭐지?'}, config=cfg).content)     # 기억한다`,
            desc: '<code>MessagesPlaceholder(\'history\')</code> 가 기록이 들어갈 자리이고, <code>session_id</code> 는 <code>config</code> 로 넘깁니다. 08차시 LangGraph 에서는 같은 일을 <code>MemorySaver</code> 체크포인트와 <code>thread_id</code> 로 합니다.' },
          { type: 'h', text: '조합: 구조화 출력 · 분기 · 병렬' },
          { type: 'figure', html: FIG_COMPOSE, caption: '그림 7-6. 병렬(모두 실행해 모음)과 분기(하나를 골라 실행). 둘 다 Runnable 로 조립합니다.' },
          { type: 'code', title: '예제 7-14. 분기(라우팅): 입력을 보고 체인을 고르기', code: `import agentlab as al

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()

def route(x):                                   # 라우터: 짧으면 번역, 길면 요약
    if len(x['text']) < 20:
        return '[번역] ' + translate.invoke(x)
    return '[요약] ' + summarize.invoke(x)

chain = al.RunnableLambda(route)
print(chain.invoke({'text': '좋은 아침입니다'}))
print(chain.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다. 다음 행동을 정한다. 이를 반복한다.'}))`,
            expect: `[번역] Translation: 좋은 아침입니다
[요약] 요약: 에이전트는 도구를 호출한다 등 총 4개 문장의 핵심을 한 줄로 정리했습니다.`,
            desc: '분기는 특별한 부품이 아니라 <b>조건문이 든 함수</b>입니다. 실제 LangChain 에도 <code>RunnableBranch</code> 가 있지만 공식 문서는 이렇게 <code>RunnableLambda</code> 로 쓰는 방식을 권합니다. 08차시의 <b>조건부 엣지</b>가 바로 이 라우터를 그래프로 옮긴 것입니다.' },
          { type: 'code', title: '예제 7-15. 병렬 분석 → 구조화 → 보고서: 부품 모두 조합하기', code: `import agentlab as al
from agentlab.chain import RunnableParallel

llm = al.LLM()
sentiment = (al.PromptTemplate('리뷰의 감성을 JSON {{"sentiment": "positive|negative|neutral", "confidence": 0~1}} 로만 답해 줘.\\n리뷰: {text}')
             | llm | al.JsonOutputParser())
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
chars = al.RunnableLambda(lambda x: len(x['text']))

def report(d):                                  # 후처리: dict → 보고서 한 줄
    s = d['sentiment']
    return f"{s['sentiment']:<9} ({s['confidence']:.1f}) · {d['chars']}자 · {d['summary'][:28]}"

pipeline = RunnableParallel({'sentiment': sentiment, 'summary': summarize, 'chars': chars}) | report
reviews = ['배송이 빠르고 포장도 꼼꼼해요. 다음에도 여기서 살게요. 추천합니다.',
           '배터리가 하루도 못 가요. 고객센터도 연결이 안 됩니다. 실망했어요.']
for line in pipeline.batch([{'text': r} for r in reviews]):
    print(line)
print('LLM 호출:', llm.calls, '회')`,
            expect: `positive  (0.9) · 38자 · 요약: 배송이 빠르고 포장도 꼼꼼해요 등 총 3개
negative  (0.9) · 38자 · 요약: 배터리가 하루도 못 가요 등 총 3개 문장의
LLM 호출: 4 회`,
            desc: '병렬(<code>RunnableParallel</code>) → 후처리(<code>report</code> 함수) → <code>batch</code> 까지 이 차시의 부품이 모두 들어갔습니다. 리뷰 2건 × LLM 체인 2개 = 4번 호출입니다. 12차시 마케팅 프로젝트에서 이런 파이프라인이 그대로 쓰입니다.' },
          { type: 'colab', title: 'Colab 실습 07 — 실제 LangChain 으로 체인과 도구 에이전트 만들기', html: '<p><code>pip install langchain langchain-google-genai langchain-groq langgraph</code> 로 설치하고 Colab Secrets 의 <code>GEMINI_API_KEY</code> 를 읽어 <code>ChatGoogleGenerativeAI</code> 를 만듭니다. ① 번역 · 감성 체인(LCEL) ② <code>@tool</code> + <code>bind_tools</code> ③ <code>create_react_agent</code> 도구 에이전트 ④ <code>RunnableWithMessageHistory</code> 메모리 ⑤ <code>RunnableParallel</code> 병렬 분석을 차례로 실행하고, 공급자를 <code>ChatGroq</code> 로 바꿔도 체인 코드가 그대로인지 확인합니다.</p>' },
          { type: 'callout', kind: 'warn', title: 'LangChain 버전 주의', html: 'LangChain 은 빠르게 바뀝니다. 이 강좌는 <b>langchain-core 0.3+ · LCEL</b> 기준이며, 옛 자료의 <code>LLMChain</code> · <code>AgentExecutor</code> · <code>initialize_agent</code> 는 더 이상 권장되지 않습니다. 도구 에이전트는 <b>LangGraph 의 <code>create_react_agent</code></b> 를 쓰세요. 오류가 나면 <code>pip show langchain</code> 으로 버전을 먼저 확인합니다.' },
          { type: 'callout', kind: 'info', teacher: true, title: '🧑‍🏫 수업 준비 체크리스트', html: '<ul><li>Colab 노트북 07 을 미리 한 번 끝까지 실행해 패키지 설치(약 1분)와 Gemini 무료 키 한도를 확인</li><li>학생 PC 에 Colab 이 막혀 있으면 브라우저 예제만으로 진행 가능 — run:false 블록은 "읽기"로 대체</li><li>예제 7-11(날씨)은 네트워크 상태에 따라 결과가 달라지므로 미리 실행해 둠</li><li>대응표(1교시 tip 상자)를 인쇄해 두면 Colab 전환 시 학생 질문이 크게 줄어듦</li></ul>' },
          { type: 'callout', kind: 'warn', teacher: true, title: '🧑‍🏫 자주 나오는 오개념 · 오류', html: '<ul><li><b>"<code>|</code> 가 동시에 실행한다"</b> → 순차입니다. 병렬은 <code>RunnableParallel</code>.</li><li><b>"템플릿을 만들면 LLM 이 호출된다"</b> → 템플릿은 메시지만 만듭니다(예제 7-2 로 확인).</li><li><b>JSON 예시의 중괄호 오류</b> <code>KeyError: \'"sentiment"\'</code> → 템플릿 안 JSON 은 <code>{{ }}</code>.</li><li><b>"bind_tools 가 도구를 실행한다"</b> → 요청만 돌려줍니다. 실행은 에이전트 루프.</li><li><b>"<code>create_react_agent</code> = 06차시 ReAct 텍스트 형식"</b> → 이름만 같고 함수 호출 루프입니다.</li></ul>' },
          { type: 'callout', kind: 'tip', teacher: true, title: '🧑‍🏫 평가 루브릭 (실습 7-4 ~ 7-6)', html: '<table><tr><th>항목</th><th>우수 (3)</th><th>보통 (2)</th><th>미흡 (1)</th></tr><tr><td>도구 정의</td><td>docstring · 타입 힌트 · 매개변수 설명 모두 작성</td><td>docstring 만</td><td>설명 없음</td></tr><tr><td>체인 조합</td><td>람다 · 병렬 · 파서를 목적에 맞게 조합</td><td>한 종류만 사용</td><td>직접 호출로 대체</td></tr><tr><td>메모리</td><td>세션별 기록 분리 · 답 저장까지 구현</td><td>기록은 하나로 공유</td><td>기록 없음</td></tr><tr><td>Colab 대응</td><td>agentlab ↔ LangChain 이름을 짝지어 설명</td><td>일부 설명</td><td>설명 못함</td></tr></table>' }
        ],
        practice: [
          { title: '실습 7-4. 도구 두 개를 가진 비서', level: 1,
            desc: '<p><code>al.Agent</code> 에 <code>al.calculator</code> 와 <code>al.now</code> 두 도구를 주고 "지금 몇 시야?" 와 "250 * 4 는?" 을 차례로 물어보세요(두 번째 질문 전에 <code>agent.reset()</code>). 각각 어떤 도구가 호출되는지 <code>verbose=True</code> 로 확인합니다.</p>',
            hint: '<code>al.Agent(llm, tools=[al.calculator, al.now], verbose=True)</code>',
            nondeterministic: true,
            starter: `import agentlab as al

llm = al.LLM()
# TODO: calculator 와 now 도구를 가진 에이전트 만들기 (verbose=True)
agent = None
for q in ['지금 몇 시야?', '250 * 4 는?']:
    # TODO: agent.run(q) 출력 후 reset()
    pass
`,
            solution: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, tools=[al.calculator, al.now], verbose=True)
for q in ['지금 몇 시야?', '250 * 4 는?']:
    print('Q:', q)
    print('A:', agent.run(q))
    agent.reset()
` },
          { title: '실습 7-5. 창(window)이 있는 메모리 체인', level: 2,
            desc: '<p>예제 7-12 의 메모리 체인에서 <code>ConversationMemory(window=2)</code> 로 바꾸고, "내 이름은 영준이야" → "오늘 날씨 좋네" → "점심 뭐 먹지?" → "내 이름이 뭐지?" 를 차례로 물어보세요. 창이 작아 이름을 잊는지 확인하고, <code>window=10</code> 일 때와 비교해 출력하세요.</p>',
            hint: '<code>window</code> 는 최근 메시지 N개만 LLM 에 보냅니다. 함수로 만들어 두 번 호출하면 비교가 쉽습니다.',
            starter: `import agentlab as al

llm = al.LLM()

def run_chat(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    def with_history(x):
        mem.add_user(x['input'])
        return mem.messages()
    chain = al.RunnableLambda(with_history) | llm | al.StrOutputParser()
    for q in ['내 이름은 영준이야', '오늘 날씨 좋네', '점심 뭐 먹지?', '내 이름이 뭐지?']:
        out = chain.invoke({'input': q})
        mem.add_assistant(out)
    # TODO: 마지막 답(out) 출력
    print(f'window={window}:', '')

# TODO: window=2 와 window=10 으로 각각 실행
`,
            solution: `import agentlab as al

llm = al.LLM()

def run_chat(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    def with_history(x):
        mem.add_user(x['input'])
        return mem.messages()
    chain = al.RunnableLambda(with_history) | llm | al.StrOutputParser()
    for q in ['내 이름은 영준이야', '오늘 날씨 좋네', '점심 뭐 먹지?', '내 이름이 뭐지?']:
        out = chain.invoke({'input': q})
        mem.add_assistant(out)
    print(f'window={window}:', out)

run_chat(2)
run_chat(10)
`,
            expect: `window=2: [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
window=10: [비서] 당신의 이름은 영준 입니다.` },
          { title: '실습 7-6. (도전) 언어를 감지해 분기하는 체인', level: 3,
            desc: '<p>입력 문장에 <b>영문자가 있으면 "한국어로 번역"</b>, 아니면 <b>"영어로 번역"</b> 체인을 고르는 라우터를 <code>RunnableLambda</code> 로 만드세요. 그 앞에 공백을 정리하는 전처리 람다를 붙이고, 세 문장(<code>"  hello  "</code>, <code>"안녕하세요"</code>, <code>"good morning"</code>)을 <code>batch</code> 로 처리해 <code>원문 → 결과</code> 를 출력하세요.</p>',
            hint: '<code>any(c.isalpha() and c.isascii() for c in text)</code> 로 영문자 여부를 판단합니다.',
            starter: `import agentlab as al

llm = al.LLM()
to_ko = al.PromptTemplate('{text} 를 한국어로 번역해 줘') | llm | al.StrOutputParser()
to_en = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()

def clean(x):
    return {'text': x['text'].strip()}

def route(x):
    # TODO: 영문자가 있으면 to_ko, 아니면 to_en 을 invoke
    return ''

chain = al.RunnableLambda(clean) | al.RunnableLambda(route)
texts = ['  hello  ', '안녕하세요', 'good morning']
# TODO: batch 로 처리해 '원문 → 결과' 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
to_ko = al.PromptTemplate('{text} 를 한국어로 번역해 줘') | llm | al.StrOutputParser()
to_en = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()

def clean(x):
    return {'text': x['text'].strip()}

def route(x):
    has_en = any(c.isalpha() and c.isascii() for c in x['text'])
    return (to_ko if has_en else to_en).invoke(x)

chain = al.RunnableLambda(clean) | al.RunnableLambda(route)
texts = ['  hello  ', '안녕하세요', 'good morning']
for t, r in zip(texts, chain.batch([{'text': t} for t in texts])):
    print(repr(t), '→', r)
`,
            expect: `'  hello  ' → Translation: hello
'안녕하세요' → Translation: 안녕하세요
'good morning' → Translation: good morning` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: 'LangChain 의 도구와 에이전트', subtitle: '@tool · bind_tools · create_react_agent · 메모리 · 조합', notes: '<p>💬 "1교시 체인은 직선이었다. 에이전트가 되려면 무엇이 더 필요할까?" → 도구 선택, 결과 관찰, 반복.</p><p>⏱ 도입 5분</p>' },
          { layout: 'diagram', title: '함수 → 도구 → 모델 → 루프', html: FIG_TOOLAGENT, caption: '위: agentlab · 아래: LangChain / LangGraph',
            notes: '<p>04차시 세 단계와 같은 그림. 이름 대응만 새로 외우면 된다고 안심시킵니다.</p>' },
          { layout: 'code', title: '@tool 과 스키마', code: `import agentlab as al
import json

@al.tool
def add(a: int, b: int) -> dict:
    """두 수를 더한다

    a: 첫 번째 수
    b: 두 번째 수
    """
    return {'a': a, 'b': b, 'result': a + b}

print(add.name, '|', add.description)
print(json.dumps(add.schema()['parameters'], ensure_ascii=False))`, points: ['docstring → 설명', '타입 힌트 → 스키마', 'LangChain <code>@tool</code> 도 같은 규칙'],
            notes: '<p>▶ 실행. 💬 "설명을 \'계산\'이라고만 쓰면?" → LLM 이 언제 쓸지 모른다. 설명의 질 = 도구 선택의 질.</p>' },
          { layout: 'code', title: 'bind_tools 와 에이전트 루프', code: `import agentlab as al

@al.tool
def add(a: int, b: int) -> dict:
    """두 수를 더한다"""
    return {'a': a, 'b': b, 'result': a + b}

llm = al.LLM()
r = llm.chat([al.user('3 더하기 4는?')], tools=[add])   # ② 알리기
print('요청만:', r.tool_calls)

agent = al.Agent(llm, tools=[add], verbose=True)         # ③ 루프
print(agent.run('3 더하기 4는?'))`, points: ['<code>tools=</code> → 호출 <b>요청</b>만', '에이전트가 실행 · 결과 전달', 'LangChain: <code>bind_tools</code> / <code>create_react_agent</code>'],
            notes: '<p>▶ 실행. 퀴즈 2번(bind_tools 는 실행하지 않는다)의 근거가 되는 출력입니다.</p>' },
          { layout: 'two', title: '실제 LangChain 도구 에이전트', left: { title: 'Colab (langchain + langgraph)', bullets: ['<code>from langchain_core.tools import tool</code>', '<code>@tool</code> 로 add 정의', '<code>llm.bind_tools([add]).invoke(q).tool_calls</code>', '<code>from langgraph.prebuilt import create_react_agent</code>', '<code>agent.invoke({\'messages\': [(\'user\', q)]})</code>'] }, right: { title: '브라우저 (agentlab)', bullets: ['<code>@al.tool</code>', '<code>llm.chat(msgs, tools=[add]).tool_calls</code>', '<code>al.Agent(llm, tools=[add]).run(q)</code>', '결과 <code>messages</code> 에 user → assistant(tool_calls) → tool → assistant', '08차시에서 이 루프를 그래프로 직접 만든다'] },
            notes: '<p>예제 7-10(run:false) 을 함께 읽습니다. create_react_agent 의 "ReAct" 는 이름일 뿐 함수 호출 루프임을 강조.</p>' },
          { layout: 'diagram', title: '메모리: 기록을 끼워 넣기', html: FIG_MEMORY, caption: 'RunnableWithMessageHistory 의 생각',
            notes: '<p>05차시 ConversationMemory 와 같은 구조. 세션 id 로 사용자별 기록을 나눈다는 점이 추가.</p>' },
          { layout: 'code', title: '메모리 체인 (agentlab)', code: `import agentlab as al

llm = al.LLM()
mem = al.ConversationMemory(window=6, system_prompt='당신은 비서입니다.')

def with_history(x):            # 입력 → 기록 포함 메시지 목록
    mem.add_user(x['input'])
    return mem.messages()

chain = al.RunnableLambda(with_history) | llm | al.StrOutputParser()
for q in ['내 이름은 영준이야', '내 이름이 뭐지?']:
    out = chain.invoke({'input': q})
    mem.add_assistant(out)      # 답도 저장
    print(q, '→', out)`, points: ['체인은 그대로, 앞에 람다 하나', '답을 다시 기록에 저장', 'LangChain: <code>MessagesPlaceholder(\'history\')</code>'],
            notes: '<p>▶ 실행. 두 번째 답에서 이름을 기억하는 것을 확인. 실습 7-5 는 window 를 줄여 잊게 만드는 활동.</p>' },
          { layout: 'diagram', title: '병렬과 분기', html: FIG_COMPOSE, caption: '모두 실행해 모으기 vs 하나를 골라 실행하기',
            notes: '<p>💬 "리뷰 100건의 감성과 요약을 동시에 얻으려면?" → 병렬 + batch. "길이에 따라 다른 처리?" → 분기.</p>' },
          { layout: 'code', title: '분기: 라우터 함수', code: `import agentlab as al

llm = al.LLM()
summarize = al.PromptTemplate('다음 글을 한 줄로 요약: {text}') | llm | al.StrOutputParser()
translate = al.PromptTemplate('{text} 를 영어로 번역해 줘') | llm | al.StrOutputParser()

def route(x):
    if len(x['text']) < 20:
        return '[번역] ' + translate.invoke(x)
    return '[요약] ' + summarize.invoke(x)

chain = al.RunnableLambda(route)
print(chain.invoke({'text': '좋은 아침입니다'}))
print(chain.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다. 다음 행동을 정한다.'}))`, points: ['분기 = 조건문이 든 함수', '08차시 조건부 엣지의 원형', '<code>RunnableBranch</code> 보다 권장'],
            notes: '<p>▶ 실행. 다음 차시 LangGraph 의 add_conditional_edges 가 이 route 함수를 그래프로 옮긴 것이라고 예고.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>정답 ②. 슬라이드 4 의 출력(요청만 돌아옴)을 다시 보여 줍니다.</p>' },
          { layout: 'practice', title: '실습 7-5. 창이 있는 메모리', desc: '<p><code>window=2</code> 와 <code>window=10</code> 으로 네 번 대화한 뒤 마지막 답을 비교하세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()

def run_chat(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    chain = al.RunnableLambda(lambda x: (mem.add_user(x['input']), mem.messages())[1]) | llm | al.StrOutputParser()
    for q in ['내 이름은 영준이야', '오늘 날씨 좋네', '점심 뭐 먹지?', '내 이름이 뭐지?']:
        out = chain.invoke({'input': q})
        mem.add_assistant(out)
    print(window, out)

# TODO: run_chat(2), run_chat(10)`, solution: `import agentlab as al

llm = al.LLM()

def run_chat(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    chain = al.RunnableLambda(lambda x: (mem.add_user(x['input']), mem.messages())[1]) | llm | al.StrOutputParser()
    for q in ['내 이름은 영준이야', '오늘 날씨 좋네', '점심 뭐 먹지?', '내 이름이 뭐지?']:
        out = chain.invoke({'input': q})
        mem.add_assistant(out)
    print(window, out)

run_chat(2)
run_chat(10)`, notes: '<p>window=2 면 이름을 잊습니다. 05차시 요약 메모리(SummaryMemory)로 해결할 수 있다고 연결.</p>' },
          { layout: 'bullets', title: 'Colab 으로 이어서', bullets: ['🟠 Colab 실습 07 — <code>pip install langchain langchain-google-genai langchain-groq langgraph</code>', 'Secrets 의 <code>GEMINI_API_KEY</code> → <code>ChatGoogleGenerativeAI</code>', '① LCEL 체인 ② <code>@tool</code> + <code>bind_tools</code> ③ <code>create_react_agent</code>', '④ <code>RunnableWithMessageHistory</code> ⑤ <code>RunnableParallel</code>', '공급자를 <code>ChatGroq</code> 로 바꿔도 체인 코드는 그대로'],
            notes: '<p>과제: Colab 07 노트북의 ✏️ 문제. 키 한도(분당 요청)에 걸리면 잠시 기다리라고 안내.</p>' },
          { layout: 'summary', title: '정리', bullets: ['<code>@tool</code> → 스키마 · <code>bind_tools</code> → 요청만 · <code>create_react_agent</code> → 루프', '메모리 = 체인 앞에 <b>기록을 끼워 넣는 칸</b> (<code>RunnableWithMessageHistory</code>)', '<code>JsonOutputParser</code> 로 구조화, <code>RunnableParallel</code> 로 병렬, 라우터 함수로 분기', 'agentlab 과 LangChain 은 <b>이름이 같다</b> — Colab 에서 바로 옮겨 쓰기', '다음 차시: 루프와 분기를 <b>그래프</b>로 그리는 LangGraph'], notes: '<p>⏱ 정리 8분(퀴즈 포함). 출구 질문: "bind_tools 와 create_react_agent 의 차이를 한 문장으로."</p>' }
        ]
      }
    ]
  });
})();
