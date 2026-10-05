/* 02차시 LLM API 다루기: 메시지 · 시스템 프롬프트 · 구조화 출력 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  const FIG_ROLES = `<svg viewBox="0 0 720 300" role="img" aria-label="메시지의 네 가지 역할: system, user, assistant, tool 과 각각의 뜻">
  ${ARROW('m02a1')}
  <rect x="20" y="20" width="300" height="56" rx="10" class="p3s"/><text x="36" y="44" class="tx-b">system</text><text x="36" y="66" class="tx-m" font-size="12">규칙 · 역할 · 말투 — 대화 맨 앞에 한 번</text>
  <rect x="20" y="88" width="300" height="56" rx="10" class="p1s"/><text x="36" y="112" class="tx-b">user</text><text x="36" y="134" class="tx-m" font-size="12">사용자의 말 — 질문 · 요청 · 자료</text>
  <rect x="20" y="156" width="300" height="56" rx="10" class="p2s"/><text x="36" y="180" class="tx-b">assistant</text><text x="36" y="202" class="tx-m" font-size="12">모델의 이전 답 — 또는 도구 호출 요청</text>
  <rect x="20" y="224" width="300" height="56" rx="10" class="p5s"/><text x="36" y="248" class="tx-b">tool</text><text x="36" y="270" class="tx-m" font-size="12">도구 실행 결과 — tool_call_id 로 요청과 짝</text>
  <rect x="360" y="20" width="340" height="260" rx="12" class="card-bg"/>
  <text x="530" y="46" text-anchor="middle" class="tx-b" font-size="13">messages = [</text>
  <text x="380" y="74" class="tx" font-family="monospace" font-size="11">{'role': 'system',</text>
  <text x="392" y="90" class="tx" font-family="monospace" font-size="11">'content': '당신은 요리 전문가입니다.'},</text>
  <text x="380" y="116" class="tx" font-family="monospace" font-size="11">{'role': 'user',</text>
  <text x="392" y="132" class="tx" font-family="monospace" font-size="11">'content': '김치찌개 비법이 뭐야?'},</text>
  <text x="380" y="158" class="tx" font-family="monospace" font-size="11">{'role': 'assistant',</text>
  <text x="392" y="174" class="tx" font-family="monospace" font-size="11">'content': '묵은지와 돼지고기를 …'},</text>
  <text x="380" y="200" class="tx" font-family="monospace" font-size="11">{'role': 'user',</text>
  <text x="392" y="216" class="tx" font-family="monospace" font-size="11">'content': '그럼 두부는 언제 넣어?'},</text>
  <text x="530" y="246" text-anchor="middle" class="tx-b" font-size="13">]</text>
  <text x="530" y="268" text-anchor="middle" class="tx-m" font-size="11">al.system(…) · al.user(…) · al.assistant(…) 가 이 dict 를 만든다</text>
</svg>`;

  const FIG_PROVIDERS = `<svg viewBox="0 0 720 300" role="img" aria-label="하나의 messages 목록을 agentlab 이 Gemini, OpenAI 호환, Anthropic 세 가지 요청 형식으로 바꿔 보내는 그림">
  ${ARROW('m02a2')}
  <rect x="10" y="100" width="150" height="100" rx="12" class="p1s"/>
  <text x="85" y="128" text-anchor="middle" class="tx-b">messages</text>
  <text x="85" y="150" text-anchor="middle" class="tx-m" font-size="11">system / user /</text>
  <text x="85" y="166" text-anchor="middle" class="tx-m" font-size="11">assistant / tool</text>
  <text x="85" y="188" text-anchor="middle" class="tx-m" font-size="11">(한 가지 형식)</text>
  <rect x="210" y="110" width="140" height="80" rx="12" class="p1"/>
  <text x="280" y="142" text-anchor="middle" class="tx-w" font-weight="700">al.LLM().chat()</text>
  <text x="280" y="166" text-anchor="middle" class="tx-w" font-size="11">공급자별로 변환</text>
  <line x1="162" y1="150" x2="206" y2="150" class="ln" stroke-width="2" marker-end="url(#m02a2)"/>
  <rect x="420" y="14" width="290" height="80" rx="12" class="p3s"/>
  <text x="432" y="38" class="tx-b" font-size="13">Gemini</text>
  <text x="432" y="58" class="tx-m" font-family="monospace" font-size="11">systemInstruction + contents[]</text>
  <text x="432" y="76" class="tx-m" font-family="monospace" font-size="11">role: user / model · parts[]</text>
  <rect x="420" y="110" width="290" height="80" rx="12" class="p2s"/>
  <text x="432" y="134" class="tx-b" font-size="13">OpenAI 호환 (OpenAI · Groq · OpenRouter · Ollama)</text>
  <text x="432" y="154" class="tx-m" font-family="monospace" font-size="11">messages[] 그대로 (system 포함)</text>
  <text x="432" y="172" class="tx-m" font-family="monospace" font-size="11">tools[] · response_format</text>
  <rect x="420" y="206" width="290" height="80" rx="12" class="p5s"/>
  <text x="432" y="230" class="tx-b" font-size="13">Anthropic</text>
  <text x="432" y="250" class="tx-m" font-family="monospace" font-size="11">system="…" (따로) + messages[]</text>
  <text x="432" y="268" class="tx-m" font-family="monospace" font-size="11">content 블록: text / tool_use / tool_result</text>
  <line x1="352" y1="130" x2="416" y2="60" class="ln" stroke-width="2" marker-end="url(#m02a2)"/>
  <line x1="352" y1="150" x2="416" y2="150" class="ln" stroke-width="2" marker-end="url(#m02a2)"/>
  <line x1="352" y1="170" x2="416" y2="240" class="ln" stroke-width="2" marker-end="url(#m02a2)"/>
  <text x="200" y="250" class="tx-m" font-size="11">Colab 에서 SDK 를 직접 쓰면 이 변환을 우리가 합니다</text>
</svg>`;

  const FIG_TEMP = `<svg viewBox="0 0 720 260" role="img" aria-label="temperature 가 낮으면 가장 확률 높은 단어에 집중하고 높으면 여러 단어가 비슷한 확률로 골라지는 분포 비교">
  <text x="360" y="24" text-anchor="middle" class="tx-b">“오늘 서울 날씨는 ___” 다음 단어의 확률</text>
  <text x="130" y="52" text-anchor="middle" class="tx-b" font-size="13">temperature = 0</text>
  <rect x="50" y="70" width="40" height="130" class="p1"/><text x="70" y="218" text-anchor="middle" class="tx-m" font-size="11">맑음</text>
  <rect x="100" y="196" width="40" height="4" class="p1s"/><text x="120" y="218" text-anchor="middle" class="tx-m" font-size="11">흐림</text>
  <rect x="150" y="198" width="40" height="2" class="p1s"/><text x="170" y="218" text-anchor="middle" class="tx-m" font-size="11">비</text>
  <text x="130" y="244" text-anchor="middle" class="tx-m" font-size="11">항상 같은 답 · 재현성 · 분류 · 추출</text>
  <text x="360" y="52" text-anchor="middle" class="tx-b" font-size="13">temperature = 0.7</text>
  <rect x="280" y="110" width="40" height="90" class="p2"/><text x="300" y="218" text-anchor="middle" class="tx-m" font-size="11">맑음</text>
  <rect x="330" y="150" width="40" height="50" class="p2"/><text x="350" y="218" text-anchor="middle" class="tx-m" font-size="11">흐림</text>
  <rect x="380" y="175" width="40" height="25" class="p2"/><text x="400" y="218" text-anchor="middle" class="tx-m" font-size="11">비</text>
  <text x="360" y="244" text-anchor="middle" class="tx-m" font-size="11">기본값 근처 · 대화 · 글쓰기</text>
  <text x="590" y="52" text-anchor="middle" class="tx-b" font-size="13">temperature = 1.5</text>
  <rect x="510" y="140" width="40" height="60" class="p4"/><text x="530" y="218" text-anchor="middle" class="tx-m" font-size="11">맑음</text>
  <rect x="560" y="150" width="40" height="50" class="p4"/><text x="580" y="218" text-anchor="middle" class="tx-m" font-size="11">흐림</text>
  <rect x="610" y="158" width="40" height="42" class="p4"/><text x="630" y="218" text-anchor="middle" class="tx-m" font-size="11">비</text>
  <text x="590" y="244" text-anchor="middle" class="tx-m" font-size="11">다양 · 창의 · 가끔 엉뚱</text>
  <line x1="40" y1="200" x2="200" y2="200" class="ax"/><line x1="270" y1="200" x2="430" y2="200" class="ax"/><line x1="500" y1="200" x2="660" y2="200" class="ax"/>
</svg>`;

  const FIG_TOKENS = `<svg viewBox="0 0 720 230" role="img" aria-label="문장이 토큰 조각으로 나뉘고, 입력 토큰과 출력 토큰에 단가를 곱해 비용이 계산되는 그림">
  ${ARROW('m02a3')}
  <text x="20" y="30" class="tx-b">토큰(token) = 모델이 글을 읽고 쓰는 단위</text>
  <rect x="20" y="46" width="52" height="30" rx="6" class="p1s"/><text x="46" y="66" text-anchor="middle" class="tx" font-size="12">에이</text>
  <rect x="76" y="46" width="52" height="30" rx="6" class="p2s"/><text x="102" y="66" text-anchor="middle" class="tx" font-size="12">전트</text>
  <rect x="132" y="46" width="36" height="30" rx="6" class="p3s"/><text x="150" y="66" text-anchor="middle" class="tx" font-size="12">는</text>
  <rect x="172" y="46" width="52" height="30" rx="6" class="p1s"/><text x="198" y="66" text-anchor="middle" class="tx" font-size="12">도구</text>
  <rect x="228" y="46" width="36" height="30" rx="6" class="p2s"/><text x="246" y="66" text-anchor="middle" class="tx" font-size="12">를</text>
  <rect x="268" y="46" width="52" height="30" rx="6" class="p3s"/><text x="294" y="66" text-anchor="middle" class="tx" font-size="12">호출</text>
  <rect x="324" y="46" width="52" height="30" rx="6" class="p1s"/><text x="350" y="66" text-anchor="middle" class="tx" font-size="12">한다</text>
  <text x="400" y="66" class="tx-m" font-size="12">→ 7 토큰 (모델마다 다름)</text>
  <text x="20" y="104" class="tx-m" font-size="12">대략: 영어 1 토큰 ≈ 단어 3/4개 · 한글 1 토큰 ≈ 1~2글자 · 1,000 토큰 ≈ A4 반 장</text>
  <rect x="20" y="124" width="200" height="80" rx="12" class="p1s"/><text x="120" y="150" text-anchor="middle" class="tx-b" font-size="13">입력 토큰 (prompt)</text><text x="120" y="172" text-anchor="middle" class="tx-m" font-size="11">system + 대화 기록 + 질문</text><text x="120" y="190" text-anchor="middle" class="tx-m" font-size="11">× 입력 단가</text>
  <rect x="260" y="124" width="200" height="80" rx="12" class="p2s"/><text x="360" y="150" text-anchor="middle" class="tx-b" font-size="13">출력 토큰 (completion)</text><text x="360" y="172" text-anchor="middle" class="tx-m" font-size="11">모델이 쓴 답</text><text x="360" y="190" text-anchor="middle" class="tx-m" font-size="11">× 출력 단가 (보통 더 비쌈)</text>
  <rect x="500" y="124" width="200" height="80" rx="12" class="p5"/><text x="600" y="150" text-anchor="middle" class="tx-w" font-weight="700" font-size="13">비용</text><text x="600" y="172" text-anchor="middle" class="tx-w" font-size="11">= 입력 × 단가₁ + 출력 × 단가₂</text><text x="600" y="190" text-anchor="middle" class="tx-w" font-size="11">r.usage 로 확인</text>
  <line x1="222" y1="164" x2="256" y2="164" class="ln" stroke-width="2" marker-end="url(#m02a3)"/>
  <line x1="462" y1="164" x2="496" y2="164" class="ln" stroke-width="2" marker-end="url(#m02a3)"/>
  <text x="360" y="224" text-anchor="middle" class="tx-m" font-size="11">대화가 길어지면 입력 토큰이 매 호출 누적되어 늘어납니다 → 05차시 기억 관리</text>
</svg>`;

  const FIG_MULTITURN = `<svg viewBox="0 0 720 250" role="img" aria-label="모델은 상태가 없으므로 매 호출마다 대화 기록 전체를 다시 보내야 한다는 그림">
  ${ARROW('m02a4')}
  <text x="20" y="28" class="tx-b">LLM 은 기억이 없다 — 기록은 우리가 들고 다닌다</text>
  <rect x="20" y="50" width="130" height="34" rx="8" class="p1s"/><text x="85" y="72" text-anchor="middle" class="tx" font-size="12">1턴: [system, u1]</text>
  <rect x="20" y="100" width="200" height="34" rx="8" class="p1s"/><text x="120" y="122" text-anchor="middle" class="tx" font-size="12">2턴: [system, u1, a1, u2]</text>
  <rect x="20" y="150" width="270" height="34" rx="8" class="p1s"/><text x="155" y="172" text-anchor="middle" class="tx" font-size="12">3턴: [system, u1, a1, u2, a2, u3]</text>
  <rect x="430" y="90" width="120" height="70" rx="12" class="p1"/><text x="490" y="120" text-anchor="middle" class="tx-w" font-weight="700">LLM</text><text x="490" y="142" text-anchor="middle" class="tx-w" font-size="11">매 호출 독립</text>
  <line x1="152" y1="67" x2="426" y2="110" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <line x1="222" y1="117" x2="426" y2="125" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <line x1="292" y1="167" x2="426" y2="140" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <rect x="590" y="60" width="120" height="34" rx="8" class="p2s"/><text x="650" y="82" text-anchor="middle" class="tx" font-size="12">a1</text>
  <rect x="590" y="108" width="120" height="34" rx="8" class="p2s"/><text x="650" y="130" text-anchor="middle" class="tx" font-size="12">a2</text>
  <rect x="590" y="156" width="120" height="34" rx="8" class="p2s"/><text x="650" y="178" text-anchor="middle" class="tx" font-size="12">a3</text>
  <line x1="552" y1="110" x2="586" y2="80" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <line x1="552" y1="125" x2="586" y2="125" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <line x1="552" y1="140" x2="586" y2="170" class="ln" stroke-width="2" marker-end="url(#m02a4)"/>
  <text x="360" y="222" text-anchor="middle" class="tx-m">답(a)을 받을 때마다 messages 에 append → 다음 질문과 함께 전부 다시 보냄 (입력 토큰이 점점 늘어남)</text>
</svg>`;

  const FIG_JSON = `<svg viewBox="0 0 720 270" role="img" aria-label="자유 텍스트 답은 프로그램이 쓰기 어렵고, JSON 답은 dict 로 바꿔 바로 쓸 수 있다는 비교">
  ${ARROW('m02a5')}
  <rect x="10" y="10" width="340" height="250" rx="14" class="card-bg"/>
  <rect x="370" y="10" width="340" height="250" rx="14" class="card-bg"/>
  <text x="180" y="38" text-anchor="middle" class="tx-b">❌ 자유 텍스트</text>
  <rect x="30" y="54" width="300" height="60" rx="8" class="p4s"/>
  <text x="40" y="76" class="tx" font-size="11">“이 리뷰는 전반적으로 긍정적인 것 같네요!</text>
  <text x="40" y="94" class="tx" font-size="11">배송과 품질을 칭찬하고 있습니다. 😊”</text>
  <text x="180" y="140" text-anchor="middle" class="tx-m" font-size="12">프로그램: 그래서 positive 야 아니야?</text>
  <text x="180" y="162" text-anchor="middle" class="tx-m" font-size="12">문자열 검색? “긍정” 이 있으면? “부정적이지 않다” 는?</text>
  <text x="180" y="200" text-anchor="middle" class="tx-m" font-size="12">→ 매번 형식이 달라 파싱이 깨짐</text>
  <text x="180" y="240" text-anchor="middle" class="tx-m" font-size="11">사람이 읽기엔 좋지만 코드가 쓰기엔 나쁨</text>
  <text x="540" y="38" text-anchor="middle" class="tx-b">✅ 구조화 출력 (JSON)</text>
  <rect x="390" y="54" width="300" height="60" rx="8" class="p2s"/>
  <text x="400" y="76" class="tx" font-family="monospace" font-size="11">{"sentiment": "positive",</text>
  <text x="400" y="94" class="tx" font-family="monospace" font-size="11"> "confidence": 0.9}</text>
  <line x1="540" y1="118" x2="540" y2="140" class="ln" stroke-width="2" marker-end="url(#m02a5)"/>
  <text x="540" y="158" text-anchor="middle" class="tx-m" font-size="12">r.json() → 파이썬 dict</text>
  <rect x="390" y="172" width="300" height="56" rx="8" class="p1s"/>
  <text x="400" y="194" class="tx" font-family="monospace" font-size="11">if d['sentiment'] == 'negative':</text>
  <text x="400" y="212" class="tx" font-family="monospace" font-size="11">    escalate(review)   # 바로 사용</text>
  <text x="540" y="250" text-anchor="middle" class="tx-m" font-size="11">도구 호출 · 계획 · 평가 — 에이전트의 모든 “결정”이 JSON</text>
</svg>`;

  const FIG_RETRY = `<svg viewBox="0 0 720 230" role="img" aria-label="JSON 요청 후 파싱에 실패하면 오류를 알려 주며 다시 요청하고, 최대 횟수를 넘기면 포기하는 재시도 흐름">
  ${ARROW('m02a6')}
  <rect x="20" y="80" width="130" height="60" rx="12" class="p1"/><text x="85" y="106" text-anchor="middle" class="tx-w" font-weight="700">LLM 호출</text><text x="85" y="126" text-anchor="middle" class="tx-w" font-size="11">json_mode=True</text>
  <polygon points="260,70 350,110 260,150 170,110" class="p5s"/><text x="260" y="106" text-anchor="middle" class="tx-b" font-size="12">r.json()</text><text x="260" y="124" text-anchor="middle" class="tx-m" font-size="11">성공?</text>
  <rect x="420" y="30" width="150" height="56" rx="12" class="p2s"/><text x="495" y="54" text-anchor="middle" class="tx-b" font-size="13">✅ dict 사용</text><text x="495" y="74" text-anchor="middle" class="tx-m" font-size="11">return d</text>
  <rect x="420" y="130" width="150" height="70" rx="12" class="p4s"/><text x="495" y="154" text-anchor="middle" class="tx-b" font-size="13">❌ ValueError</text><text x="495" y="172" text-anchor="middle" class="tx-m" font-size="11">오류 내용을 user 메시지로</text><text x="495" y="190" text-anchor="middle" class="tx-m" font-size="11">“JSON 만 다시 출력해라”</text>
  <line x1="152" y1="110" x2="166" y2="110" class="ln" stroke-width="2" marker-end="url(#m02a6)"/>
  <line x1="340" y1="95" x2="416" y2="62" class="ln" stroke-width="2" marker-end="url(#m02a6)"/>
  <text x="372" y="70" class="tx-m" font-size="11">예</text>
  <line x1="340" y1="125" x2="416" y2="158" class="ln" stroke-width="2" marker-end="url(#m02a6)"/>
  <text x="372" y="152" class="tx-m" font-size="11">아니오</text>
  <path d="M495 202 L495 215 L85 215 L85 144" class="ln" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#m02a6)"/>
  <text x="290" y="210" text-anchor="middle" class="tx-m" font-size="11">재시도 (최대 3번) — 넘기면 None 또는 기본값</text>
  <rect x="600" y="80" width="110" height="60" rx="12" class="card-bg"/><text x="655" y="106" text-anchor="middle" class="tx-b" font-size="12">temperature=0</text><text x="655" y="126" text-anchor="middle" class="tx-m" font-size="11">실패율 ↓</text>
</svg>`;

  const FIG_CHAIN = `<svg viewBox="0 0 720 200" role="img" aria-label="PromptTemplate, LLM, JsonOutputParser 를 파이프로 이어 invoke 하는 미니 LangChain 체인">
  ${ARROW('m02a7')}
  <rect x="20" y="60" width="90" height="60" rx="10" class="p3s"/><text x="65" y="86" text-anchor="middle" class="tx-b" font-size="12">입력 dict</text><text x="65" y="106" text-anchor="middle" class="tx-m" font-size="11">{'review': …}</text>
  <rect x="150" y="50" width="160" height="80" rx="12" class="p1s"/><text x="230" y="78" text-anchor="middle" class="tx-b" font-size="13">PromptTemplate</text><text x="230" y="98" text-anchor="middle" class="tx-m" font-size="11">{review} 채워</text><text x="230" y="116" text-anchor="middle" class="tx-m" font-size="11">messages 만들기</text>
  <rect x="350" y="50" width="120" height="80" rx="12" class="p1"/><text x="410" y="84" text-anchor="middle" class="tx-w" font-weight="700">llm</text><text x="410" y="106" text-anchor="middle" class="tx-w" font-size="11">Response</text>
  <rect x="510" y="50" width="160" height="80" rx="12" class="p2s"/><text x="590" y="78" text-anchor="middle" class="tx-b" font-size="13">JsonOutputParser</text><text x="590" y="98" text-anchor="middle" class="tx-m" font-size="11">content → dict</text><text x="590" y="116" text-anchor="middle" class="tx-m" font-size="11">(울타리 제거 포함)</text>
  <line x1="112" y1="90" x2="146" y2="90" class="ln" stroke-width="2" marker-end="url(#m02a7)"/>
  <line x1="312" y1="90" x2="346" y2="90" class="ln" stroke-width="2" marker-end="url(#m02a7)"/>
  <line x1="472" y1="90" x2="506" y2="90" class="ln" stroke-width="2" marker-end="url(#m02a7)"/>
  <text x="330" y="30" text-anchor="middle" class="tx-b">chain = prompt | llm | parser   →   chain.invoke({'review': '…'})</text>
  <text x="360" y="165" text-anchor="middle" class="tx-m">| 로 이은 각 단계의 출력이 다음 단계의 입력 — LangChain(07차시)의 LCEL 과 같은 문법</text>
  <text x="360" y="188" text-anchor="middle" class="tx-m" font-size="11">Colab: from langchain_core.prompts import PromptTemplate 로 바꾸면 그대로 동작</text>
</svg>`;

  const QUIZ1 = [
    { q: '대화 맨 앞에 한 번 넣어 모델의 역할과 규칙을 정하는 메시지의 <code>role</code> 은?', options: ['<code>user</code>', '<code>system</code>', '<code>assistant</code>', '<code>tool</code>'], answer: 1,
      explain: '<b>system</b> 메시지가 역할 · 말투 · 규칙을 정합니다. <code>user</code> 는 사용자의 말, <code>assistant</code> 는 모델의 이전 답, <code>tool</code> 은 도구 실행 결과입니다.' },
    { q: '감성 분류처럼 <b>항상 같은 답</b>이 필요한 작업에 알맞은 <code>temperature</code> 는?', options: ['2.0', '1.0', '0.7', '0'], answer: 3,
      explain: 'temperature 가 낮을수록 가장 확률 높은 단어만 고르므로 재현성이 높습니다. 분류 · 추출 · 도구 호출에는 0 (또는 0 에 가까운 값), 글쓰기 · 아이디어에는 0.7~1.0 을 씁니다.' },
    { q: '세 번째 턴의 질문을 보낼 때 <code>messages</code> 에 들어 있어야 하는 것은?', options: ['세 번째 질문만', 'system 과 세 번째 질문만', 'system + 이전 질문 · 답 전부 + 세 번째 질문', '이전 답들만'], answer: 2,
      explain: 'LLM 은 매 호출이 독립적(상태 없음)이라 <b>대화 기록 전체</b>를 매번 보내야 앞 내용을 “기억”합니다. 그래서 대화가 길어지면 입력 토큰이 늘어납니다.' },
    { q: '어떤 호출의 <code>usage</code> 가 입력 400 토큰, 출력 200 토큰이고 단가가 100만 토큰당 입력 $0.30 · 출력 $2.50 이라면 비용은?', options: ['약 $0.00012', '약 $0.00062', '약 $0.0017', '약 $0.60'], answer: 1,
      explain: '400/1,000,000 × 0.30 + 200/1,000,000 × 2.50 = 0.00012 + 0.0005 = <b>$0.00062</b>. 출력 단가가 보통 입력보다 몇 배 비싸다는 점에 주의하세요.' }
  ];
  const QUIZ2 = [
    { q: '에이전트 프로그램이 LLM 의 답을 <b>JSON</b> 으로 받으려는 가장 큰 이유는?', options: ['사람이 읽기 더 쉬워서', '토큰이 항상 더 적게 들어서', '프로그램이 <code>dict</code> 로 바꿔 바로 분기 · 저장 · 도구 호출에 쓸 수 있어서', '모델이 더 똑똑해져서'], answer: 2,
      explain: '자유 텍스트는 형식이 매번 달라 파싱이 깨집니다. JSON 이면 <code>d[\'sentiment\']</code> 처럼 바로 쓸 수 있고, 도구 호출 · 계획 · 평가 같은 에이전트의 “결정”이 모두 이런 구조화 출력입니다.' },
    { q: '모델이 <code>```json { … } ```</code> 처럼 코드 울타리를 붙여 답했다. <code>r.json()</code> 은?', options: ['항상 ValueError 가 난다', '울타리를 걷어내고 JSON 을 해석한다', '울타리 문자열까지 dict 에 넣는다', '첫 줄만 해석한다'], answer: 1,
      explain: 'agentlab 의 <code>parse_json</code> 은 코드 울타리와 앞뒤 설명 문장을 허용합니다. 그래도 JSON 이 전혀 없으면 <code>ValueError</code> 가 나므로 재시도 패턴이 필요합니다.' },
    { q: 'JSON 파싱에 실패했을 때 가장 알맞은 처리는?', options: ['프로그램을 종료한다', '빈 dict 를 조용히 넘긴다', '<code>try/except</code> 로 잡고 오류 내용을 알려 주며 최대 N 번 다시 요청한 뒤, 끝내 실패하면 기본값/None 을 돌려준다', '울타리를 수동으로 지운다'], answer: 2,
      explain: '재시도는 “오류 메시지를 user 메시지로 덧붙여 다시 요청”하는 것이 핵심입니다. 상한(보통 2~3번)을 두고 넘으면 기본값으로 처리해 루프가 멈추지 않게 합니다.' },
    { q: '<code>al.PromptTemplate(\'리뷰: {review}\') | llm | al.JsonOutputParser()</code> 에서 <code>|</code> 의 뜻은?', options: ['또는(OR) 연산', '앞 단계의 출력을 다음 단계의 입력으로 잇는다', '세 개를 동시에 실행한다', '문자열을 합친다'], answer: 1,
      explain: '파이프(<code>|</code>)는 체인 연결입니다. dict → 템플릿이 messages 로 → LLM 이 Response 로 → 파서가 dict 로. LangChain 의 LCEL 도 같은 문법입니다(07차시).' },
    { q: '모의 LLM 에게 “다음 문장에서 이름 · 이메일 · 전화번호를 추출해 JSON 으로” 요청할 때 전화번호가 없으면 결과는?', options: ['오류가 난다', '<code>"phone": null</code> 처럼 빈 값이 온다', '전화번호를 지어낸다', '이메일을 전화번호 자리에 넣는다'], answer: 1,
      explain: '없는 정보는 <code>null</code>(파이썬 <code>None</code>)로 오도록 프롬프트에 요청하는 것이 좋은 습관입니다. 실제 모델은 지어낼(환각) 수도 있으므로 “없으면 null” 을 명시하세요.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag02',
    no: '02',
    title: 'LLM API 다루기: 메시지 · 시스템 프롬프트 · 구조화 출력',
    subtitle: 'system / user / assistant / tool · temperature · 토큰과 비용 · JSON 모드',
    summary: '에이전트의 모든 부품은 결국 <b>LLM API 호출</b>입니다. 메시지의 네 가지 역할과 시스템 프롬프트, 공급자별 요청 형식의 차이를 <code>agentlab</code> 이 어떻게 흡수하는지, <code>temperature</code> · <code>max_tokens</code> · 토큰과 비용을 다룹니다. 이어서 답을 <b>JSON 으로 받아 프로그램이 바로 쓰는</b> 구조화 출력과 재시도 패턴, 미니 LangChain 체인을 맛봅니다.',
    goals: [
      'system · user · assistant · tool 네 역할의 뜻을 알고 <code>al.system/user/assistant</code> 로 메시지 목록을 만들 수 있다',
      'Gemini · OpenAI 호환 · Anthropic 요청 형식의 차이를 설명하고, 왜 agentlab 이 하나의 형식으로 통일하는지 안다',
      '<code>temperature</code> · <code>max_tokens</code> 의 효과와 토큰 · 비용 계산을 할 수 있다',
      '대화 기록을 누적해 멀티턴 대화를 구현할 수 있다',
      '<code>json_mode=True</code> 와 <code>r.json()</code> 으로 분류 · 추출 · 계획 결과를 dict 로 받고, 실패 시 재시도할 수 있다',
      '<code>PromptTemplate | llm | JsonOutputParser</code> 체인의 구조를 설명할 수 있다'
    ],
    sections: [
      {
        id: 'ag02-1',
        title: '메시지 구조 · 시스템 프롬프트 · 토큰과 비용',
        minutes: 50,
        goals: ['네 가지 역할로 messages 를 만든다', '공급자별 요청 형식 차이를 안다', 'temperature · max_tokens 를 설명한다', '토큰과 비용을 계산하고 멀티턴 대화를 구현한다'],
        flow: [['메시지와 역할', 12], ['공급자별 형식 차이', 8], ['temperature · max_tokens', 8], ['토큰과 비용', 10], ['멀티턴 대화', 8], ['퀴즈 · 정리', 4]],
        content: [
          { type: 'p', html: '01차시에서 에이전트 루프를 짤 때 <code>llm.chat(messages, tools=…)</code> 한 줄이 모든 것의 중심이었습니다. 이번 차시에는 그 한 줄 안에 들어가는 <b>messages</b> 가 무엇이고, 공급자마다 어떻게 다르게 보내지며, 답이 어떻게 돌아오는지를 정확히 봅니다. 에이전트의 역할(03차시) · 도구(04차시) · 기억(05차시)은 전부 이 메시지 목록을 다루는 기술입니다.' },
          { type: 'h', text: '메시지와 네 가지 역할' },
          { type: 'p', html: 'LLM 에 보내는 것은 “질문 문자열 하나”가 아니라 <b>메시지 목록</b>입니다. 각 메시지는 <code>role</code> 과 <code>content</code> 를 가진 dict 이고, 역할은 네 가지뿐입니다.' },
          { type: 'figure', html: FIG_ROLES, caption: '그림 2-1. 네 가지 역할. system 은 맨 앞에 한 번, user 와 assistant 가 번갈아 쌓이고, tool 은 도구 결과를 담습니다.' },
          { type: 'table', head: ['role', '누가 쓰나', '내용', 'agentlab 헬퍼'], rows: [
            ['<code>system</code>', '개발자', '역할 · 규칙 · 말투 · 출력 형식. “당신은 요리 전문가입니다. 세 문장 이내로 답합니다.”', '<code>al.system(text)</code>'],
            ['<code>user</code>', '사용자', '질문 · 요청 · 분석할 자료', '<code>al.user(text)</code>'],
            ['<code>assistant</code>', '모델', '이전 답. 도구 호출 요청이면 <code>tool_calls</code> 포함', '<code>al.assistant(text)</code> · <code>r.message()</code>'],
            ['<code>tool</code>', '프로그램', '도구 실행 결과. <code>tool_call_id</code> 로 요청과 짝', '<code>agentlab.llm.tool_result(id, name, result)</code>']
          ] },
          { type: 'code', title: '예제 2-1. 메시지 목록 만들고 Response 받기', code: `import agentlab as al

messages = [
    al.system('당신은 요리 전문가입니다.'),
    al.user('안녕하세요'),
]
for m in messages:
    print(m)                                   # role / content 를 가진 dict

llm = al.LLM()
r = llm.chat(messages)                         # ask() 와 달리 Response 객체
print('답   :', r.content)
print('토큰 :', r.usage, '→ 합계', r.usage.total_tokens)
print('모델 :', r.model)
print('도구 호출 요청:', r.tool_calls)`,
            expect: '{\'role\': \'system\', \'content\': \'당신은 요리 전문가입니다.\'}\n{\'role\': \'user\', \'content\': \'안녕하세요\'}\n답   : [요리 전문가] 안녕하세요! 무엇을 도와드릴까요?\n토큰 : Usage(prompt=5, completion=9) → 합계 14\n모델 : mock-1\n도구 호출 요청: []',
            desc: '<code>al.system()</code> 같은 헬퍼는 그냥 dict 를 만들어 줄 뿐입니다. 직접 <code>{\'role\': \'user\', \'content\': \'…\'}</code> 로 써도 같습니다. <code>Response</code> 에는 답(<code>content</code>) 외에 토큰 사용량 · 모델 이름 · 도구 호출 요청이 함께 옵니다.' },
          { type: 'h', text: '시스템 프롬프트: 같은 질문, 다른 답' },
          { type: 'p', html: '<b>시스템 프롬프트</b>는 모델이 답하기 전에 읽는 “근무 지침”입니다. 역할 · 말투 · 길이 · 금지 사항 · 출력 형식을 여기에 씁니다. 사용자 메시지보다 우선순위가 높게 다뤄지므로, 에이전트의 성격은 대부분 여기서 결정됩니다. (03차시에서 설계법을 자세히 다룹니다)' },
          { type: 'code', title: '예제 2-2. 시스템 프롬프트 바꿔 보기', code: `import agentlab as al

llm = al.LLM()
q = '김치찌개 맛있게 끓이는 비법이 뭐야?'
systems = [
    '당신은 요리 전문가입니다.',
    '당신은 요리 전문가입니다. 간결하게 한 문장으로 답합니다.',
    '당신은 초등학생에게 쉽게 설명하는 선생님입니다.',
]
for s in systems:
    r = llm.chat([al.system(s), al.user(q)])
    print('system:', s)
    print('  →', r.content[:70])`,
            expect: 'system: 당신은 요리 전문가입니다.\n  → [요리 전문가] "김치찌개 맛있게 끓이는 비법이 뭐야?" 에 대한 답변: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는\nsystem: 당신은 요리 전문가입니다. 간결하게 한 문장으로 답합니다.\n  → [요리 전문가] "김치찌개 맛있게 끓이는 비법이 뭐야?" 에 대한 답변 (간결하게): 핵심은 두 가지입니다. 첫째, 문제를 정\nsystem: 당신은 초등학생에게 쉽게 설명하는 선생님입니다.\n  → [초등학생에게 쉽게 설명하는 선생님] "김치찌개 맛있게 끓이는 비법이 뭐야?" 에 대한 답변 (친절하게 설명): 핵심은 두 가',
            desc: '모의 LLM 은 역할을 <code>[…]</code> 로, 말투 지시를 <code>(간결하게)</code> · <code>(친절하게 설명)</code> 로 표시해 시스템 프롬프트가 읽혔음을 보여 줍니다. 실제 모델은 내용 · 길이 · 말투가 실제로 달라집니다. 키를 넣고 꼭 비교해 보세요.' },
          { type: 'h', text: '공급자별 요청 형식의 차이' },
          { type: 'p', html: '위의 메시지 형식은 OpenAI 가 만든 관례이고, Groq · OpenRouter · Ollama 가 그대로 따릅니다(“OpenAI 호환”). 하지만 <b>Gemini</b> 와 <b>Anthropic</b> 은 형식이 다릅니다. <code>agentlab</code> 은 한 가지 형식만 받아서 공급자에 맞게 바꿔 보내므로, 🔑 에서 공급자를 바꿔도 코드는 그대로입니다.' },
          { type: 'figure', html: FIG_PROVIDERS, caption: '그림 2-2. 하나의 messages → 세 가지 요청 형식. LangChain 같은 프레임워크도 같은 일을 합니다.' },
          { type: 'table', head: ['항목', 'OpenAI 호환 (OpenAI · Groq · OpenRouter · Ollama)', 'Gemini', 'Anthropic'], rows: [
            ['시스템 프롬프트', '<code>messages</code> 안의 <code>role: system</code>', '<code>systemInstruction</code> 필드 (따로)', '<code>system</code> 매개변수 (따로)'],
            ['대화 목록', '<code>messages: [{role, content}]</code>', '<code>contents: [{role: user/model, parts: [{text}]}]</code>', '<code>messages: [{role, content: [블록…]}]</code>'],
            ['모델의 역할 이름', '<code>assistant</code>', '<code>model</code>', '<code>assistant</code>'],
            ['도구 정의', '<code>tools: [{type: function, function: {…}}]</code>', '<code>tools: [{functionDeclarations: […]}]</code>', '<code>tools: [{name, input_schema}]</code>'],
            ['도구 호출 응답', '<code>message.tool_calls[].function.arguments</code> (JSON 문자열)', '<code>parts[].functionCall.args</code> (객체)', '<code>content[].type == tool_use</code> → <code>input</code>'],
            ['도구 결과 전달', '<code>role: tool</code> + <code>tool_call_id</code>', '<code>parts: [{functionResponse}]</code> (role user)', '<code>type: tool_result</code> 블록 (role user)'],
            ['JSON 모드', '<code>response_format: {type: json_object}</code>', '<code>responseMimeType: application/json</code>', '없음 → 프롬프트 지시 또는 도구 사용'],
            ['인증', '<code>Authorization: Bearer 키</code> 헤더', 'URL 의 <code>?key=</code> 또는 헤더', '<code>x-api-key</code> 헤더 + 버전 헤더'],
            ['토큰 사용량', '<code>usage.prompt_tokens / completion_tokens</code>', '<code>usageMetadata.promptTokenCount / candidatesTokenCount</code>', '<code>usage.input_tokens / output_tokens</code>']
          ], caption: '세 가지 API 형식 비교 — agentlab 의 llm.py 가 이 표대로 변환합니다' },
          { type: 'code', title: '예제 2-3. 같은 messages 를 세 형식으로 바꿔 보기 (변환 원리)', code: `import json
import agentlab as al

messages = [al.system('당신은 요리 전문가입니다.'), al.user('김치찌개 비법은?'), al.assistant('묵은지를 쓰세요.'), al.user('두부는 언제 넣어?')]

def to_openai(msgs):                       # 그대로
    return {'model': 'gpt-4o-mini', 'messages': msgs}

def to_gemini(msgs):                       # system 분리, assistant → model, parts
    sys_text = ' '.join(m['content'] for m in msgs if m['role'] == 'system')
    contents = [{'role': 'model' if m['role'] == 'assistant' else 'user', 'parts': [{'text': m['content']}]}
                for m in msgs if m['role'] != 'system']
    return {'systemInstruction': {'parts': [{'text': sys_text}]}, 'contents': contents}

def to_anthropic(msgs):                    # system 분리, 나머지 그대로
    return {'model': 'claude-haiku-4-5', 'system': ' '.join(m['content'] for m in msgs if m['role'] == 'system'),
            'messages': [m for m in msgs if m['role'] != 'system'], 'max_tokens': 256}

for name, fn in [('OpenAI 호환', to_openai), ('Gemini', to_gemini), ('Anthropic', to_anthropic)]:
    print('===', name, '===')
    print(json.dumps(fn(messages), ensure_ascii=False)[:150], '…')`,
            expect: '=== OpenAI 호환 ===\n{"model": "gpt-4o-mini", "messages": [{"role": "system", "content": "당신은 요리 전문가입니다."}, {"role": "user", "content": "김치찌개 비법은?"}, {"role": "assistant", …\n=== Gemini ===\n{"systemInstruction": {"parts": [{"text": "당신은 요리 전문가입니다."}]}, "contents": [{"role": "user", "parts": [{"text": "김치찌개 비법은?"}]}, {"role": "model", "par …\n=== Anthropic ===\n{"model": "claude-haiku-4-5", "system": "당신은 요리 전문가입니다.", "messages": [{"role": "user", "content": "김치찌개 비법은?"}, {"role": "assistant", "content": "묵은지 …',
            desc: '이 세 함수가 <code>agentlab/llm.py</code> 의 <code>_openai</code> · <code>_gemini</code> · <code>_anthropic</code> 이 하는 일의 축소판입니다. 내용은 같고 포장만 다릅니다. Colab 에서 SDK 를 직접 쓰면 이 포장을 우리가 해야 합니다(아래 예제 2-7).' },
          { type: 'h', text: 'temperature 와 max_tokens' },
          { type: 'p', html: 'LLM 은 다음 단어를 <b>확률</b>로 고릅니다. <code>temperature</code> 는 그 확률 분포를 얼마나 평평하게 만들지 정하는 손잡이입니다. 0 이면 항상 가장 확률 높은 단어(재현성), 높을수록 다양하지만 엉뚱해질 수 있습니다. <code>max_tokens</code> 는 답의 최대 길이(출력 토큰 수)로, 비용과 시간의 상한선입니다.' },
          { type: 'figure', html: FIG_TEMP, caption: '그림 2-3. temperature 에 따른 다음 단어 확률. 에이전트의 판단(도구 선택 · 분류 · JSON)은 0, 글쓰기는 0.7 안팎.' },
          { type: 'code', title: '예제 2-4. temperature 가 확률을 바꾸는 원리 (순수 파이썬 시뮬레이션)', code: `import math

candidates = ['맑음', '흐림', '비', '눈']
logits = [3.0, 2.0, 1.0, 0.2]          # 모델이 매긴 점수 (가짜)

def softmax(scores, temperature):
    if temperature == 0:                 # 0 이면 최댓값만 선택
        best = scores.index(max(scores))
        return [1.0 if i == best else 0.0 for i in range(len(scores))]
    exps = [math.exp(s / temperature) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

for t in [0, 0.5, 1.0, 2.0]:
    probs = softmax(logits, t)
    bar = ' '.join(f'{w} {p:.2f}' for w, p in zip(candidates, probs))
    print(f'temperature={t:<4} → {bar}')`,
            expect: 'temperature=0    → 맑음 1.00 흐림 0.00 비 0.00 눈 0.00\ntemperature=0.5  → 맑음 0.86 흐림 0.12 비 0.02 눈 0.00\ntemperature=1.0  → 맑음 0.64 흐림 0.24 비 0.09 눈 0.04\ntemperature=2.0  → 맑음 0.45 흐림 0.27 비 0.17 눈 0.11',
            desc: '같은 점수라도 temperature 가 커질수록 확률이 평평해져 “비” 나 “눈” 이 뽑힐 가능성이 생깁니다. 실제 모델은 이 뽑기를 단어마다 반복하므로 답이 매번 달라집니다. 모의 LLM 은 뽑기를 하지 않아 temperature 를 바꿔도 같은 답입니다.' },
          { type: 'code', title: '예제 2-5. agentlab 에서 temperature · max_tokens 지정', code: `import agentlab as al

llm = al.LLM(temperature=0.0, max_tokens=512)        # 기본값: 에이전트용 (재현성)
q = '에이전트를 한 단어로 표현하면?'
for t in [0.0, 1.0]:
    r = llm.chat([al.user(q)], temperature=t, max_tokens=60)   # 호출마다 바꿀 수도
    print(f't={t}: {r.content}')
print('기본 설정:', llm.temperature, llm.max_tokens)`,
            expect: 't=0.0: AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\nt=1.0: AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.\n기본 설정: 0.0 512',
            desc: '모의 LLM 은 두 줄이 같지만, 실제 키를 넣으면 <code>t=1.0</code> 에서는 실행할 때마다 다른 답이 나오고 <code>max_tokens=60</code> 때문에 긴 답은 잘립니다. <code>al.LLM()</code> 의 기본 temperature 가 0 인 이유: 에이전트의 도구 선택과 JSON 출력은 재현성이 중요하기 때문입니다.' },
          { type: 'h', text: '토큰과 비용' },
          { type: 'p', html: '모델은 글을 <b>토큰</b> 단위로 읽고 씁니다. 공급자는 입력 토큰과 출력 토큰에 각각 단가를 매기며, 보통 <b>출력이 몇 배 비쌉니다</b>. 에이전트는 호출마다 대화 기록 전체를 다시 보내므로 입력 토큰이 빠르게 늘어납니다.' },
          { type: 'figure', html: FIG_TOKENS, caption: '그림 2-4. 토큰과 비용. 정확한 토큰 수는 모델의 토크나이저마다 다르므로 <code>r.usage</code> 로 확인합니다.' },
          { type: 'table', head: ['모델 (예시)', '입력 $/100만 토큰', '출력 $/100만 토큰', '비고'], rows: [
            ['gemini-2.5-flash', '0.30', '2.50', '무료 등급 있음'],
            ['gpt-4o-mini', '0.15', '0.60', '유료'],
            ['claude-haiku-4-5', '1.00', '5.00', '유료'],
            ['llama-3.3-70b (Groq)', '0.59', '0.79', '무료 등급 있음'],
            ['llama3.2 (Ollama)', '0', '0', '내 PC 전기세']
          ], caption: '단가 예시 — 설명용 대략값이며 실제 가격은 각 공급자의 Pricing 페이지에서 확인하세요' },
          { type: 'code', title: '예제 2-6. 호출 한 번의 비용 계산', code: `import agentlab as al

PRICE = {   # 100만 토큰당 달러 (예시값)
    'gemini-2.5-flash': (0.30, 2.50),
    'gpt-4o-mini': (0.15, 0.60),
    'claude-haiku-4-5': (1.00, 5.00),
}
def cost(usage, model):
    pin, pout = PRICE[model]
    return usage.prompt_tokens / 1e6 * pin + usage.completion_tokens / 1e6 * pout

llm = al.LLM()
r = llm.chat([al.system('당신은 친절한 비서입니다.'), al.user('에이전트가 뭐야?')])
print('이번 호출:', r.usage)
for m in PRICE:
    print(f'  {m:<18} {cost(r.usage, m):.6f} 달러')
print('같은 호출을 하루 10,000번 하면 (gemini-2.5-flash):', round(cost(r.usage, 'gemini-2.5-flash') * 10000, 2), '달러')`,
            expect: '이번 호출: Usage(prompt=7, completion=25)\n  gemini-2.5-flash   0.000065 달러\n  gpt-4o-mini        0.000016 달러\n  claude-haiku-4-5   0.000132 달러\n같은 호출을 하루 10,000번 하면 (gemini-2.5-flash): 0.65 달러',
            desc: '한 번은 푼돈이지만 “에이전트 1작업 = 호출 5번 × 사용자 1만 명” 으로 곱해 보면 금방 커집니다. 모의 LLM 의 토큰 수는 글자 수 어림값이라 실제보다 작습니다. 실제 키로 같은 코드를 돌려 비교해 보세요.' },
          { type: 'h', text: '멀티턴 대화: 기록을 누적하기' },
          { type: 'p', html: 'LLM 은 <b>상태가 없습니다</b>. 방금 한 대화를 기억하지 못하므로, 다음 질문을 보낼 때 이전 질문과 답을 <b>messages 에 함께</b> 넣어야 “이어지는 대화”가 됩니다. 챗봇 앱이 하는 일이 바로 이것입니다.' },
          { type: 'figure', html: FIG_MULTITURN, caption: '그림 2-5. 매 턴마다 기록 전체를 보냅니다. 기록이 길어지면 입력 토큰이 늘고, 그래서 05차시에서 기억을 관리하는 법을 배웁니다.' },
          { type: 'code', title: '예제 2-7. 기록이 있을 때와 없을 때', code: `import agentlab as al

llm = al.LLM()
history = [
    al.system('당신은 친절한 비서입니다.'),
    al.user('내 이름은 영준이야.'),
    al.assistant('반가워요, 영준님! 무엇을 도와드릴까요?'),
]
q = '내 이름이 뭐지?'
print('기록 있음:', llm.chat(history + [al.user(q)]).content)
print('기록 없음:', llm.chat([al.system('당신은 친절한 비서입니다.'), al.user(q)]).content)`,
            expect: '기록 있음: [친절한 비서] 당신의 이름은 영준 입니다.\n기록 없음: [친절한 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.',
            desc: '같은 질문인데 기록을 빼면 모델은 이름을 모릅니다. “기억”은 모델 안이 아니라 <b>우리가 보내는 messages</b> 에 있습니다. <code>al.assistant(…)</code> 로 모델의 이전 답을 직접 써 넣을 수도 있습니다(few-shot 예시를 만들 때 자주 씁니다).' },
          { type: 'code', title: '예제 2-8. 대화 루프: 답을 받을 때마다 append', code: `import agentlab as al

llm = al.LLM()
messages = [al.system('당신은 회의 일정을 관리하는 비서입니다.')]
turns = ['오늘 회의는 3시로 잡아줘', '장소는 2층 회의실로 바꿔줘', '참석자는 5명이야']
for t in turns:
    messages.append(al.user(t))              # ① 질문 추가
    r = llm.chat(messages)                   # ② 기록 전체 전송
    messages.append(r.message())             # ③ 답도 기록에 추가
    print('👤', t)
    print('🤖', r.content)
print('메시지 수:', len(messages), '| 누적 입력 토큰:', llm.total_usage.prompt_tokens)`,
            expect: '👤 오늘 회의는 3시로 잡아줘\n🤖 [회의 일정을 관리하는 비서] 알겠습니다. "오늘 회의는 3시로 잡아줘" 을(를) 처리했습니다.\n👤 장소는 2층 회의실로 바꿔줘\n🤖 [회의 일정을 관리하는 비서] 알겠습니다. "장소는 2층 회의실로 바꿔줘" 을(를) 처리했습니다. (대화 2번째)\n👤 참석자는 5명이야\n🤖 [회의 일정을 관리하는 비서] 알겠습니다. "참석자는 5명이야" 을(를) 처리했습니다. (대화 3번째)\n메시지 수: 7 | 누적 입력 토큰: 101',
            desc: '모의 LLM 은 기록 속 user 메시지 수를 세어 “(대화 N번째)” 를 붙입니다 — 기록이 전달되고 있다는 증거입니다. 세 턴에 메시지가 7개(system 1 + user 3 + assistant 3)가 되었고, 입력 토큰은 턴마다 누적되어 늘었습니다. 01차시의 에이전트 루프도 정확히 이 구조에 tool 메시지만 더한 것입니다.' },
          { type: 'code', title: '예제 2-9. Colab 에서 실행 — 세 SDK 로 같은 호출', run: false, code: `from google.colab import userdata

# ① Google Gemini (google-genai)
from google import genai
from google.genai import types
client = genai.Client(api_key=userdata.get('GEMINI_API_KEY'))
r = client.models.generate_content(
    model='gemini-2.5-flash', contents='김치찌개 비법은?',
    config=types.GenerateContentConfig(system_instruction='당신은 요리 전문가입니다.', temperature=0, max_output_tokens=200))
print(r.text, r.usage_metadata.total_token_count)

# ② OpenAI 호환 (openai) — Groq 는 base_url 만 바꾸면 됨
from openai import OpenAI
client = OpenAI(api_key=userdata.get('GROQ_API_KEY'), base_url='https://api.groq.com/openai/v1')
r = client.chat.completions.create(
    model='llama-3.3-70b-versatile', temperature=0, max_tokens=200,
    messages=[{'role': 'system', 'content': '당신은 요리 전문가입니다.'}, {'role': 'user', 'content': '김치찌개 비법은?'}])
print(r.choices[0].message.content, r.usage.total_tokens)

# ③ Anthropic (anthropic)
import anthropic
client = anthropic.Anthropic(api_key=userdata.get('ANTHROPIC_API_KEY'))
r = client.messages.create(
    model='claude-haiku-4-5', max_tokens=200, temperature=0,
    system='당신은 요리 전문가입니다.', messages=[{'role': 'user', 'content': '김치찌개 비법은?'}])
print(r.content[0].text, r.usage.input_tokens, r.usage.output_tokens)`,
            desc: '표 2-2 의 차이가 SDK 코드에 그대로 드러납니다: 시스템 프롬프트의 위치, 역할 이름, 응답에서 텍스트를 꺼내는 경로, 토큰 필드 이름. Colab 노트북 02 에서 가진 키로 실행해 보세요.' },
          { type: 'colab', title: 'Colab 실습 02 — 실제 SDK 로 메시지 · 시스템 프롬프트 · 토큰', html: '<p>노트북에서 <code>google-genai</code> 와 <code>openai</code> SDK 로 ① 시스템 프롬프트 비교 ② temperature 0 vs 1 을 5번씩 호출해 답이 달라지는지 확인 ③ 토큰 수와 비용 계산 ④ 멀티턴 대화 루프를 실행합니다. 2교시의 JSON 모드도 같은 노트북에서 이어집니다.</p>' }
        ],
        practice: [
          { title: '실습 2-1. few-shot 예시를 메시지로 넣기', level: 1,
            desc: '<p>모델에게 “답 형식”을 가르치는 흔한 방법은 <code>user</code> → <code>assistant</code> 예시 쌍을 미리 넣는 것(few-shot)입니다. 시스템 프롬프트 “당신은 번역가입니다.” 뒤에 예시 한 쌍(<code>al.user(\'사과\')</code> → <code>al.assistant(\'apple\')</code>)을 넣고, 마지막에 <code>al.user(\'학교 를 영어로 번역해줘\')</code> 를 보내 답을 출력하세요. 메시지 수도 함께 출력합니다.</p>',
            hint: '<code>messages = [al.system(...), al.user(\'사과\'), al.assistant(\'apple\'), al.user(\'학교 를 영어로 번역해줘\')]</code>',
            starter: `import agentlab as al

llm = al.LLM()
messages = [
    al.system('당신은 번역가입니다.'),
    # TODO: few-shot 예시 한 쌍 (user '사과' → assistant 'apple') 추가
    # TODO: 마지막 질문 추가
]
r = llm.chat(messages)
print(r.content)
print('메시지 수:', len(messages))
`,
            solution: `import agentlab as al

llm = al.LLM()
messages = [
    al.system('당신은 번역가입니다.'),
    al.user('사과'),
    al.assistant('apple'),
    al.user('학교 를 영어로 번역해줘'),
]
r = llm.chat(messages)
print(r.content)
print('메시지 수:', len(messages))
`,
            expect: '[번역가] Translation: 학교\n메시지 수: 4' },
          { title: '실습 2-2. 대화 비용 추적기', level: 2,
            desc: '<p>예제 2-8 의 대화 루프에 <b>턴마다</b> 그 호출의 토큰 수(<code>r.usage.total_tokens</code>)와 누적 비용(gemini-2.5-flash 예시 단가: 입력 0.30 · 출력 2.50 달러/100만 토큰)을 출력하는 코드를 추가하세요. 턴이 진행될수록 입력 토큰이 늘어나는 것을 확인합니다.</p>',
            hint: '턴마다 <code>r.usage.prompt_tokens / 1e6 * 0.30 + r.usage.completion_tokens / 1e6 * 2.50</code> 을 <code>total</code> 에 더합니다.',
            starter: `import agentlab as al

llm = al.LLM()
messages = [al.system('당신은 회의 일정을 관리하는 비서입니다.')]
total = 0.0
for t in ['오늘 회의는 3시로 잡아줘', '장소는 2층 회의실로 바꿔줘', '참석자는 5명이야']:
    messages.append(al.user(t))
    r = llm.chat(messages)
    messages.append(r.message())
    # TODO: 이번 호출 토큰(입력/출력)과 누적 비용 출력
print('총 비용(달러):', round(total, 7))
`,
            solution: `import agentlab as al

llm = al.LLM()
messages = [al.system('당신은 회의 일정을 관리하는 비서입니다.')]
total = 0.0
for t in ['오늘 회의는 3시로 잡아줘', '장소는 2층 회의실로 바꿔줘', '참석자는 5명이야']:
    messages.append(al.user(t))
    r = llm.chat(messages)
    messages.append(r.message())
    total += r.usage.prompt_tokens / 1e6 * 0.30 + r.usage.completion_tokens / 1e6 * 2.50
    print(f'턴 {len(messages) // 2}: 입력 {r.usage.prompt_tokens} 출력 {r.usage.completion_tokens} | 누적 {total:.7f} 달러')
print('총 비용(달러):', round(total, 7))
`,
            expect: '턴 1: 입력 11 출력 17 | 누적 0.0000458 달러\n턴 2: 입력 33 출력 21 | 누적 0.0001082 달러\n턴 3: 입력 57 출력 19 | 누적 0.0001728 달러\n총 비용(달러): 0.0001728' }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'LLM API 다루기', subtitle: '메시지 · 시스템 프롬프트 · temperature · 토큰과 비용', notes: '<p>1교시. 01차시의 <code>llm.chat(messages)</code> 한 줄을 해부한다고 안내합니다. 이 차시의 내용이 03~05차시 전부의 기초입니다.</p><p>⏱ 메시지와 역할 12분</p>' },
          { layout: 'diagram', title: '메시지와 네 가지 역할', html: FIG_ROLES, caption: 'system 한 번 · user/assistant 번갈아 · tool 은 도구 결과',
            notes: '<p><b>발문:</b> “카톡 대화창을 생각하면 system 은 무엇에 해당할까요?” → 대화방 공지/규칙. user 와 assistant 가 말풍선, tool 은 봇이 가져온 자료.</p>' },
          { layout: 'code', title: 'messages 만들고 Response 받기', code: `import agentlab as al

messages = [al.system('당신은 요리 전문가입니다.'), al.user('안녕하세요')]
print(messages[0])

llm = al.LLM()
r = llm.chat(messages)
print(r.content)
print(r.usage, r.usage.total_tokens, r.model)
print(r.tool_calls)`, points: ['헬퍼 = dict 만들기', '<code>chat()</code> → Response', 'content · usage · model · tool_calls'],
            notes: '<p>ask() 와 chat() 의 차이: ask 는 문자열, chat 은 Response. 에이전트는 tool_calls 가 필요하므로 chat 을 씁니다.</p>' },
          { layout: 'code', title: '시스템 프롬프트: 같은 질문, 다른 답', code: `import agentlab as al

llm = al.LLM()
q = '김치찌개 맛있게 끓이는 비법이 뭐야?'
for s in ['당신은 요리 전문가입니다.',
          '당신은 요리 전문가입니다. 간결하게 한 문장으로 답합니다.',
          '당신은 초등학생에게 쉽게 설명하는 선생님입니다.']:
    r = llm.chat([al.system(s), al.user(q)])
    print(s, '→', r.content[:60])`, points: ['system = 근무 지침', '역할 · 말투 · 길이 · 형식', '모의 LLM 은 [역할] (말투) 로 표시'],
            notes: '<p>교사 PC(실제 키)로 실행해 실제 답이 얼마나 달라지는지 보여 주세요. 03차시에서 설계법을 다룬다고 예고.</p>' },
          { layout: 'diagram', title: '공급자별 요청 형식', html: FIG_PROVIDERS, caption: 'agentlab(그리고 LangChain)이 변환을 대신한다',
            notes: '<p>표(본문 2-2)의 핵심 세 가지만: 시스템 프롬프트 위치, 모델 역할 이름(assistant/model), 도구 호출 응답 경로. “그래서 🔑 에서 공급자를 바꿔도 코드가 같다”.</p><p>⏱ 8분</p>' },
          { layout: 'diagram', title: 'temperature', html: FIG_TEMP, caption: '0 = 재현성 (판단 · 분류 · JSON) / 0.7~1 = 다양성 (글쓰기)',
            notes: '<p>시뮬레이션 예제 2-4 를 실행해 숫자로 보여 줍니다. <b>발문:</b> “에이전트의 도구 선택은 temperature 몇이 좋을까요?” → 0.</p><p>⏱ 8분</p>' },
          { layout: 'code', title: 'temperature 시뮬레이션', code: `import math

words = ['맑음', '흐림', '비', '눈']
logits = [3.0, 2.0, 1.0, 0.2]
def softmax(scores, t):
    if t == 0:
        best = scores.index(max(scores))
        return [1.0 if i == best else 0.0 for i in range(len(scores))]
    exps = [math.exp(s / t) for s in scores]
    return [e / sum(exps) for e in exps]
for t in [0, 0.5, 1.0, 2.0]:
    print(t, [round(p, 2) for p in softmax(logits, t)])`, points: ['점수 ÷ temperature → softmax', '높을수록 평평 → 다양', '0 이면 최댓값만'],
            notes: '<p>수식은 깊이 들어가지 않습니다. “나누는 수가 커지면 점수 차이가 줄어든다” 정도로.</p>' },
          { layout: 'diagram', title: '토큰과 비용', html: FIG_TOKENS, caption: '비용 = 입력 토큰 × 단가₁ + 출력 토큰 × 단가₂',
            notes: '<p>출력 단가가 보통 입력의 3~8배. 대화가 길어지면 입력이 누적된다 → 05차시 기억 관리의 동기.</p><p>⏱ 10분</p>' },
          { layout: 'code', title: '비용 계산', code: `import agentlab as al

PRICE = {'gemini-2.5-flash': (0.30, 2.50), 'gpt-4o-mini': (0.15, 0.60)}
def cost(usage, model):
    pin, pout = PRICE[model]
    return usage.prompt_tokens / 1e6 * pin + usage.completion_tokens / 1e6 * pout

llm = al.LLM()
r = llm.chat([al.system('당신은 친절한 비서입니다.'), al.user('에이전트가 뭐야?')])
print(r.usage)
for m in PRICE:
    print(m, round(cost(r.usage, m), 6), '달러')`, points: ['<code>r.usage</code> 로 토큰 확인', '단가는 예시값', '× 호출 수 × 사용자 수'],
            notes: '<p>“하루 1만 명 × 5호출” 로 곱해 보게 합니다. 모의 LLM 토큰은 어림값이라 실제보다 작다는 점 언급.</p>' },
          { layout: 'diagram', title: '멀티턴: LLM 은 기억이 없다', html: FIG_MULTITURN, caption: '기록은 우리가 들고 다니며 매번 전부 보낸다',
            notes: '<p>오개념: “챗GPT 는 기억하잖아요?” → 앱이 기록을 보내 주는 것. 모델 자체는 상태가 없다.</p><p>⏱ 8분</p>' },
          { layout: 'code', title: '기록이 있을 때 vs 없을 때', code: `import agentlab as al

llm = al.LLM()
history = [al.system('당신은 친절한 비서입니다.'),
           al.user('내 이름은 영준이야.'),
           al.assistant('반가워요, 영준님!')]
q = '내 이름이 뭐지?'
print('기록 있음:', llm.chat(history + [al.user(q)]).content)
print('기록 없음:', llm.chat([al.user(q)]).content)`, points: ['기억 = messages 안에', '<code>al.assistant()</code> 로 이전 답 삽입', '루프에서는 <code>r.message()</code> 를 append'],
            notes: '<p>예제 2-8(대화 루프)도 이어서 실행해 “(대화 N번째)” 와 누적 입력 토큰 증가를 보여 줍니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[2].q, options: QUIZ1[2].options, answer: QUIZ1[2].answer, explain: QUIZ1[2].explain, notes: '<p>멀티턴의 핵심. 틀리면 그림 2-5 로 돌아갑니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['messages = [system, user, assistant, tool …] dict 목록', '시스템 프롬프트 = 역할 · 규칙 · 형식', 'Gemini · OpenAI 호환 · Anthropic 형식 차이 → agentlab 이 변환', 'temperature 0 = 재현성 / max_tokens = 길이 상한', '비용 = 입력 × 단가 + 출력 × 단가, <code>r.usage</code>', '멀티턴 = 답을 append 하고 전부 다시 보내기', '다음 교시: 답을 JSON 으로 받기'], notes: '<p>⏱ 정리 4분. 2교시 예고: “프로그램이 쓸 수 있는 답”.</p>' }
        ]
      },
      {
        id: 'ag02-2',
        title: '구조화 출력: JSON 모드와 파서',
        minutes: 50,
        goals: ['자유 텍스트 대신 JSON 을 받아야 하는 이유를 설명한다', 'json_mode=True 와 r.json() 으로 분류 · 추출 · 계획 결과를 dict 로 받는다', '파싱 실패를 try/except 로 잡고 재시도한다', 'PromptTemplate | llm | JsonOutputParser 체인을 실행한다'],
        flow: [['왜 JSON 인가', 8], ['json_mode 와 r.json()', 12], ['분류 · 추출 · 계획', 12], ['재시도 · 체인 맛보기', 12], ['퀴즈 · 정리', 6]],
        content: [
          { type: 'p', html: '1교시의 답은 모두 사람이 읽는 문장이었습니다. 하지만 에이전트는 LLM 의 답을 <b>프로그램이</b> 읽어야 합니다. “이 리뷰가 부정적이면 담당자에게 넘겨라” 를 코드로 쓰려면 답이 <code>\'positive\'</code> 또는 <code>\'negative\'</code> 처럼 <b>정해진 형식</b>이어야 합니다. 이것이 <b>구조화 출력(structured output)</b>이고, 가장 흔한 형식이 JSON 입니다.' },
          { type: 'figure', html: FIG_JSON, caption: '그림 2-6. 자유 텍스트는 파싱이 깨지고, JSON 은 dict 로 바꿔 바로 씁니다. 01차시의 도구 호출 요청도 사실 JSON 이었습니다.' },
          { type: 'h', text: 'json_mode 와 r.json()' },
          { type: 'p', html: '<code>llm.chat(…, json_mode=True)</code> 를 주면 공급자의 JSON 모드(Gemini 의 <code>responseMimeType</code>, OpenAI 의 <code>response_format</code>)를 켜고, Anthropic 처럼 모드가 없는 공급자에는 “JSON 만 출력하라”는 지시를 시스템 프롬프트에 덧붙입니다. 돌아온 <code>r.content</code> 는 여전히 문자열이므로 <code>r.json()</code> 으로 dict 로 바꿉니다. 프롬프트에는 <b>원하는 키와 값의 종류</b>를 예시로 보여 주는 것이 가장 효과적입니다.' },
          { type: 'code', title: '예제 2-10. 감성 분류를 JSON 으로', code: `import agentlab as al

llm = al.LLM()
SYSTEM = ('리뷰의 감성을 분석해 JSON 으로만 답하라. '
          '형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1 사이 숫자}')
reviews = ['배송이 빠르고 품질도 좋아요. 추천합니다!', '배터리가 하루도 못 가요. 실망했습니다.', '그냥 평범한 제품이에요.']
for text in reviews:
    r = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True)
    d = r.json()                                  # 문자열 → dict
    mark = '🚨' if d['sentiment'] == 'negative' else '  '
    print(f"{mark} {d['sentiment']:<9} ({d['confidence']:.1f})  {text}")`,
            expect: '   positive  (0.9)  배송이 빠르고 품질도 좋아요. 추천합니다!\n🚨 negative  (0.9)  배터리가 하루도 못 가요. 실망했습니다.\n   neutral   (0.6)  그냥 평범한 제품이에요.',
            desc: '<code>d[\'sentiment\']</code> 로 바로 분기했습니다. 부정 리뷰에만 🚨 를 붙인 한 줄이 “프로그램이 LLM 의 판단을 쓴다”는 것의 전부입니다. 모의 LLM 은 키워드로 판단하므로 항상 같은 답을 주고, 실제 모델은 문맥을 읽습니다.' },
          { type: 'code', title: '예제 2-11. 정보 추출: 이름 · 이메일 · 전화번호', code: `import agentlab as al

llm = al.LLM()
PROMPT = ('다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {"name": ..., "email": ..., "phone": ...} 으로 답하라. '
          '없는 항목은 null 로 둔다.')
texts = [
    '저는 김영준입니다. 연락은 yj.kim@example.com 또는 010-1234-5678 로 주세요.',
    '담당자는 박지민님이고 이메일은 jimin@school.kr 입니다.',
]
rows = []
for t in texts:
    d = llm.chat([al.user(PROMPT + '\\n문장: ' + t)], json_mode=True).json()
    rows.append(d)
    print(d)
print()
print('이메일 목록:', [row['email'] for row in rows])
print('전화 없는 사람:', [row['name'] for row in rows if row.get('phone') is None])`,
            expect: '{\'name\': \'김영준\', \'email\': \'yj.kim@example.com\', \'phone\': \'010-1234-5678\'}\n{\'name\': \'박지민님\', \'email\': \'jimin@school.kr\', \'phone\': None}\n\n이메일 목록: [\'yj.kim@example.com\', \'jimin@school.kr\']\n전화 없는 사람: [\'박지민님\']',
            desc: '비정형 문장 → 표(레코드)로 바뀌었습니다. 이런 추출은 이메일 자동 분류, 명함 정리, 고객 문의 접수 같은 곳에서 가장 많이 쓰이는 LLM 활용입니다. “없는 항목은 null” 을 명시해야 실제 모델이 지어내는 것을 줄일 수 있습니다. (모의 LLM 은 “님” 까지 이름으로 잡았습니다 — 실제 모델은 더 정확합니다)' },
          { type: 'code', title: '예제 2-12. 계획을 JSON 으로 받아 단계 실행하기', code: `import agentlab as al

llm = al.LLM()
goal = '학교 축제 홍보 영상 만들기'
prompt = (f'목표: {goal}\\n'
          '이 목표를 달성하기 위한 단계를 4개 이내로 나누어라. '
          '반드시 JSON {"goal": "...", "steps": ["1단계", "2단계", ...]} 형식으로만 답해라.')
r = llm.chat([al.system('너는 작업을 작은 단계로 쪼개는 계획 전문가다.'), al.user(prompt)], json_mode=True)
plan = r.json()
print('목표:', plan['goal'])
for i, step in enumerate(plan['steps'], 1):
    print(f'  {i}. {step}')
print('단계 수:', len(plan['steps']), '→ 이 목록을 for 문으로 돌리면 Plan-and-Execute (06차시)')`,
            expect: '목표: 학교 축제 홍보 영상 만들기\n  1. 학교 축제 홍보 영상 만들기 에 필요한 정보 조사\n  2. 핵심 내용 정리\n  3. 결과물 작성\n  4. 검토 후 수정\n단계 수: 4 → 이 목록을 for 문으로 돌리면 Plan-and-Execute (06차시)',
            desc: '<code>plan[\'steps\']</code> 가 파이썬 리스트이므로 <code>for</code> 로 돌리거나 길이를 셀 수 있습니다. <code>al.Planner(llm).plan(goal)</code> 이 정확히 이 코드를 감싼 것입니다. 에이전트의 “계획” 이란 결국 <b>JSON 으로 받은 할 일 목록</b>입니다.' },
          { type: 'h', text: '파서가 하는 일: 코드 울타리와 잡담 걷어내기' },
          { type: 'p', html: '실제 모델은 JSON 모드를 켜도 가끔 <code>```json … ```</code> 울타리를 붙이거나 “결과는 다음과 같습니다:” 같은 문장을 앞에 씁니다. <code>r.json()</code> 안의 <code>parse_json</code> 은 이런 경우를 허용하고, 그래도 JSON 이 없으면 <code>ValueError</code> 를 냅니다.' },
          { type: 'code', title: '예제 2-13. parse_json 의 허용 범위', code: `from agentlab.llm import parse_json

samples = [
    '{"sentiment": "positive", "confidence": 0.9}',
    '물론이죠! 결과는 다음과 같습니다.\\n' + chr(96) * 3 + 'json\\n{"name": "김영준", "age": 17}\\n' + chr(96) * 3 + '\\n도움이 되었길 바랍니다.',
    '결과: [1, 2, 3] 입니다',
    '죄송합니다, JSON 으로 답하기 어렵습니다.',
]
for s in samples:
    try:
        print('✅', parse_json(s))
    except ValueError as e:
        print('❌', e)`,
            expect: '✅ {\'sentiment\': \'positive\', \'confidence\': 0.9}\n✅ {\'name\': \'김영준\', \'age\': 17}\n✅ [1, 2, 3]\n❌ JSON 을 찾지 못했습니다: 죄송합니다, JSON 으로 답하기 어렵습니다.',
            desc: '울타리(백틱 세 개, 코드에서는 <code>chr(96) * 3</code> 으로 썼습니다)와 앞뒤 문장이 있어도 JSON 만 골라냅니다. 리스트도 됩니다. 마지막처럼 JSON 이 아예 없으면 예외이므로 다음 예제의 재시도가 필요합니다.' },
          { type: 'h', text: '재시도 패턴: 실패를 알려 주고 다시 요청' },
          { type: 'figure', html: FIG_RETRY, caption: '그림 2-7. 파싱 실패 시 오류 내용을 user 메시지로 덧붙여 재요청합니다. 상한을 두고 넘으면 기본값으로 처리합니다.' },
          { type: 'code', title: '예제 2-14. ask_json — 재시도가 들어간 JSON 호출 함수', code: `import agentlab as al

def ask_json(llm, messages, retries=3):
    """JSON 답을 dict 로. 파싱 실패하면 오류를 알려 주며 최대 retries 번 재요청"""
    msgs = list(messages)
    for attempt in range(1, retries + 1):
        r = llm.chat(msgs, json_mode=True)
        try:
            return r.json()
        except ValueError as e:
            print(f'  ⚠ {attempt}번째 실패: {str(e)[:50]}')
            msgs.append(r.message())                      # 실패한 답도 기록에
            msgs.append(al.user('JSON 만 출력해라. 설명 문장이나 코드 울타리를 붙이지 마라.'))
    return None                                           # 포기 → 호출한 쪽이 기본값 처리

# 키가 없을 때: 처음 두 번은 엉뚱한 답, 세 번째에 제대로 답하는 "말 안 듣는 LLM" 흉내
llm = al.LLM(mock_responses=['죄송합니다, 형식을 지키지 못했습니다.', '결과는 긍정입니다!',
                             '{"sentiment": "positive", "confidence": 0.95}'])
d = ask_json(llm, [al.user('이 리뷰의 감성을 JSON 으로: 정말 최고의 수업이었어요')])
print('결과:', d, '| 호출 횟수:', llm.calls)
print('실패 시 기본값 사용 예:', (d or {'sentiment': 'unknown'})['sentiment'])`,
            expect: '  ⚠ 1번째 실패: JSON 을 찾지 못했습니다: 죄송합니다, 형식을 지키지 못했습니다.\n  ⚠ 2번째 실패: JSON 을 찾지 못했습니다: 결과는 긍정입니다!\n결과: {\'sentiment\': \'positive\', \'confidence\': 0.95} | 호출 횟수: 3\n실패 시 기본값 사용 예: positive',
            nondeterministic: true,
            desc: '세 번째에 성공했습니다. 실패한 답을 <code>assistant</code> 로, 지적을 <code>user</code> 로 기록에 넣어 “무엇이 틀렸는지” 알려 주는 것이 핵심입니다. 실제 키를 넣으면 모의 대사 대신 실제 모델이 답하므로 보통 한 번에 성공합니다. <code>temperature=0</code> 이 실패율을 더 낮춥니다.' },
          { type: 'h', text: '미니 LangChain 맛보기: 체인으로 잇기' },
          { type: 'p', html: '“프롬프트 채우기 → LLM 호출 → JSON 파싱” 은 매번 반복되는 세 단계입니다. LangChain 은 이것을 <code>|</code> 로 잇는 <b>체인</b>으로 표현하고, <code>agentlab</code> 도 같은 문법을 제공합니다. 07차시에서 본격적으로 다루니 오늘은 모양만 익힙니다.' },
          { type: 'figure', html: FIG_CHAIN, caption: '그림 2-8. 체인. 각 단계의 출력이 다음 단계의 입력이 됩니다.' },
          { type: 'code', title: '예제 2-15. PromptTemplate | llm | JsonOutputParser', code: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate(
    '다음 리뷰의 감성을 분석해 JSON {{"sentiment": "positive|negative|neutral", "confidence": 0~1}} 로만 답하라.\\n리뷰: {review}')
chain = prompt | llm | al.JsonOutputParser()
print(chain)                                           # 체인의 구조

for review in ['화면이 선명하고 배터리도 오래 가요. 최고!', '소리가 자꾸 끊겨서 별로예요.']:
    d = chain.invoke({'review': review})               # dict 로 바로
    print(d['sentiment'], '←', review)

# 같은 틀로 다른 체인: 문자열 출력
translate = al.PromptTemplate('{text} 를 {lang} 로 번역해줘') | llm | al.StrOutputParser()
print(translate.invoke({'text': '에이전트는 재미있다', 'lang': '영어'}))`,
            expect: 'PromptTemplate([\'review\']) | LLM(mock, mock-1) | JsonOutputParser()\npositive ← 화면이 선명하고 배터리도 오래 가요. 최고!\nnegative ← 소리가 자꾸 끊겨서 별로예요.\nTranslation: 에이전트는 재미있다',
            desc: '템플릿의 <code>{review}</code> 는 변수, JSON 예시의 중괄호는 <code>{{ }}</code> 로 두 번 써서 변수가 아님을 표시합니다(파이썬 <code>format</code> 규칙). Colab 에서는 <code>from langchain_core.prompts import PromptTemplate</code>, <code>from langchain_core.output_parsers import JsonOutputParser</code> 로 바꾸면 같은 코드가 됩니다.' },
          { type: 'code', title: '예제 2-16. Colab 에서 실행 — SDK 의 구조화 출력', run: false, code: `from google.colab import userdata
from pydantic import BaseModel

class Review(BaseModel):                      # 원하는 구조를 클래스로 선언
    sentiment: str
    confidence: float

# ① Gemini: 스키마를 주면 그 구조의 JSON 만 돌려준다
from google import genai
from google.genai import types
client = genai.Client(api_key=userdata.get('GEMINI_API_KEY'))
r = client.models.generate_content(
    model='gemini-2.5-flash', contents='리뷰: 배송이 빠르고 품질도 좋아요',
    config=types.GenerateContentConfig(response_mime_type='application/json', response_schema=Review))
print(r.parsed)                               # → Review(sentiment='positive', confidence=…)

# ② OpenAI 호환: response_format 으로 JSON 모드 (스키마 지정도 가능)
from openai import OpenAI
client = OpenAI(api_key=userdata.get('OPENAI_API_KEY'))
r = client.chat.completions.create(
    model='gpt-4o-mini', response_format={'type': 'json_object'},
    messages=[{'role': 'system', 'content': '감성을 JSON {"sentiment": ..., "confidence": ...} 로만 답하라.'},
              {'role': 'user', 'content': '배송이 빠르고 품질도 좋아요'}])
print(r.choices[0].message.content)

# ③ Anthropic: 전용 JSON 모드가 없다 → 프롬프트로 지시하거나 "도구 호출" 로 구조를 강제
import anthropic
client = anthropic.Anthropic(api_key=userdata.get('ANTHROPIC_API_KEY'))
r = client.messages.create(
    model='claude-haiku-4-5', max_tokens=200,
    tools=[{'name': 'record', 'description': '감성 기록', 'input_schema': Review.model_json_schema()}],
    tool_choice={'type': 'tool', 'name': 'record'},
    messages=[{'role': 'user', 'content': '리뷰: 배송이 빠르고 품질도 좋아요'}])
print(r.content[0].input)                     # → {'sentiment': 'positive', 'confidence': …}`,
            desc: '실제 SDK 는 <b>스키마</b>(pydantic 클래스)를 넘겨 형식을 강제할 수 있어 재시도가 거의 필요 없습니다. Anthropic 의 “도구 호출로 구조 강제” 트릭은 04차시 도구 호출과 연결됩니다. Colab 노트북 02 의 후반부에서 실행합니다.' },
          { type: 'colab', title: 'Colab 실습 02 — JSON 모드 · 스키마 · 재시도', html: '<p>노트북 후반부에서 ① <code>response_format</code> / <code>response_schema</code> 로 JSON 받기 ② 리뷰 10개 일괄 분류 → pandas 표 ③ 재시도 함수 ④ (선택) LangChain 의 <code>PromptTemplate | llm | JsonOutputParser</code> 를 실행합니다. ✏️ 문제: 뉴스 제목에서 “회사명 · 사건 종류 · 날짜” 를 추출하는 프롬프트 만들기.</p>' },
          { type: 'callout', kind: 'info', teacher: true, title: '지도 팁 · 오개념 · 루브릭', html: '<ul><li><b>오개념 1: “json_mode 를 켜면 항상 완벽한 JSON 이 온다”</b> → 공급자 · 모델에 따라 울타리나 잡담이 섞일 수 있고 Anthropic 은 모드 자체가 없습니다. 그래서 파서 + 재시도가 필요합니다. 스키마 지정(예제 2-16)이 가장 확실한 방법.</li><li><b>오개념 2: “<code>r.json()</code> 이 dict 를 돌려주니 키가 항상 있다”</b> → 실제 모델은 키 이름을 바꾸거나 빠뜨릴 수 있습니다. <code>d.get(\'phone\')</code> 처럼 안전하게 읽는 습관을 강조하세요.</li><li>예제 2-14 는 모의 LLM 전용 시나리오입니다. 키를 넣은 학생은 한 번에 성공해 ⚠ 가 안 보입니다 — 정상입니다.</li><li>PromptTemplate 의 <code>{{ }}</code> 이스케이프에서 오류(KeyError)가 가장 많이 납니다. 파이썬 <code>format</code> 규칙임을 먼저 설명하세요.</li><li>루브릭(실습 2-5): 재시도 상한(1) · 실패 시 기본값(1) · 오류 메시지를 기록에 추가(1) · 세 샘플 모두 처리(1) · 코드 설명(1).</li><li>시간이 남으면 모의 LLM 의 <code>mock.py</code> <code>_json_answer</code> 를 열어 “키워드로 판단한다”는 것을 보여 주면 실제 모델과의 차이가 분명해집니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 2-3. 리뷰 일괄 분류와 집계', level: 1,
            desc: '<p>리뷰 5개를 예제 2-10 의 방식으로 분류하고, <code>positive</code> · <code>negative</code> · <code>neutral</code> 각각 몇 개인지 집계해 출력하세요. (<code>collections.Counter</code> 또는 dict 로)</p>',
            hint: '<code>counts = {}</code> → <code>counts[label] = counts.get(label, 0) + 1</code>',
            starter: `import agentlab as al

llm = al.LLM()
SYSTEM = '리뷰의 감성을 분석해 JSON 으로만 답하라. 형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}'
reviews = ['가격 대비 만족합니다', '포장이 찢어져서 왔어요. 불만입니다', '그냥 보통이에요',
           '디자인이 훌륭하고 배송도 빨라요', '한 달 만에 고장났어요. 환불 원합니다']
counts = {}
for text in reviews:
    d = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True).json()
    # TODO: counts 에 d['sentiment'] 개수 세기

# TODO: counts 출력 (예: positive 2, negative 2, neutral 1)
`,
            solution: `import agentlab as al

llm = al.LLM()
SYSTEM = '리뷰의 감성을 분석해 JSON 으로만 답하라. 형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}'
reviews = ['가격 대비 만족합니다', '포장이 찢어져서 왔어요. 불만입니다', '그냥 보통이에요',
           '디자인이 훌륭하고 배송도 빨라요', '한 달 만에 고장났어요. 환불 원합니다']
counts = {}
for text in reviews:
    d = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True).json()
    label = d['sentiment']
    counts[label] = counts.get(label, 0) + 1
    print(f'{label:<9}', text)
print()
for label in ['positive', 'negative', 'neutral']:
    print(label, counts.get(label, 0))
`,
            expect: 'positive  가격 대비 만족합니다\nnegative  포장이 찢어져서 왔어요. 불만입니다\nneutral   그냥 보통이에요\npositive  디자인이 훌륭하고 배송도 빨라요\nnegative  한 달 만에 고장났어요. 환불 원합니다\n\npositive 2\nnegative 2\nneutral 1' },
          { title: '실습 2-4. 연락처 추출 → 표 만들기', level: 2,
            desc: '<p>문장 세 개에서 이름 · 이메일 · 전화번호를 추출해(예제 2-11) 한 줄에 한 사람씩 <code>이름 | 이메일 | 전화</code> 형식의 표로 출력하세요. 없는 값은 <code>-</code> 로 표시합니다.</p>',
            hint: '<code>d.get(\'phone\') or \'-\'</code>',
            starter: `import agentlab as al

llm = al.LLM()
PROMPT = '다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {"name": ..., "email": ..., "phone": ...} 으로 답하라. 없는 항목은 null 로 둔다.'
texts = ['저는 이서연입니다. 메일은 seoyeon@example.com, 전화는 010-2222-3333 입니다.',
         '문의는 최민호님께 minho@company.co.kr 로 보내 주세요.',
         '김하늘입니다. 010-9876-5432 로 연락 바랍니다.']
print(f"{'이름':<8}| {'이메일':<24}| 전화")
for t in texts:
    d = llm.chat([al.user(PROMPT + '\\n문장: ' + t)], json_mode=True).json()
    # TODO: 없는 값은 '-' 로 바꿔 한 줄로 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
PROMPT = '다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {"name": ..., "email": ..., "phone": ...} 으로 답하라. 없는 항목은 null 로 둔다.'
texts = ['저는 이서연입니다. 메일은 seoyeon@example.com, 전화는 010-2222-3333 입니다.',
         '문의는 최민호님께 minho@company.co.kr 로 보내 주세요.',
         '김하늘입니다. 010-9876-5432 로 연락 바랍니다.']
print(f"{'이름':<8}| {'이메일':<24}| 전화")
for t in texts:
    d = llm.chat([al.user(PROMPT + '\\n문장: ' + t)], json_mode=True).json()
    name = d.get('name') or '-'
    email = d.get('email') or '-'
    phone = d.get('phone') or '-'
    print(f'{name:<8}| {email:<24}| {phone}')
`,
            expect: '이름      | 이메일                     | 전화\n이서연     | seoyeon@example.com     | 010-2222-3333\n최민호     | minho@company.co.kr     | -\n김하늘     | -                       | 010-9876-5432' },
          { title: '실습 2-5. (도전) 재시도 + 기본값이 있는 분류 함수', level: 3,
            desc: '<p><code>classify(llm, text)</code> 함수를 만드세요. 내부에서 JSON 모드로 감성을 요청하고, 파싱에 실패하면 최대 2번 재시도하며, 끝내 실패하면 <code>{\'sentiment\': \'unknown\', \'confidence\': 0}</code> 을 돌려줍니다. 아래의 “말 안 듣는 LLM”(<code>mock_responses</code>)으로 테스트하면 첫 샘플은 재시도 끝에 성공하고, 둘째 샘플은 모두 실패해 기본값이 나와야 합니다.</p>',
            hint: '예제 2-14 의 <code>ask_json</code> 을 가져와 <code>return … or 기본값</code> 으로 감쌉니다. mock_responses 는 호출 순서대로 소비됩니다.',
            starter: `import agentlab as al

def classify(llm, text, retries=2):
    msgs = [al.system('감성을 JSON {"sentiment": "...", "confidence": 0~1} 로만 답하라.'), al.user(text)]
    # TODO: retries+1 번까지 시도, 실패하면 오류를 알려 주고 재요청, 끝내 실패하면 기본값
    return {'sentiment': 'unknown', 'confidence': 0}

bad = al.LLM(mock_responses=['형식을 못 지켰어요', '{"sentiment": "negative", "confidence": 0.8}',
                             '또 실패', '다시 실패', '세 번째 실패'])
print(classify(bad, '배송이 너무 느려요'))
print(classify(bad, '그냥 그래요'))
print('호출 횟수:', bad.calls)
`,
            solution: `import agentlab as al

def classify(llm, text, retries=2):
    msgs = [al.system('감성을 JSON {"sentiment": "...", "confidence": 0~1} 로만 답하라.'), al.user(text)]
    for attempt in range(retries + 1):
        r = llm.chat(msgs, json_mode=True)
        try:
            return r.json()
        except ValueError:
            msgs.append(r.message())
            msgs.append(al.user('JSON 만 출력해라.'))
    return {'sentiment': 'unknown', 'confidence': 0}

bad = al.LLM(mock_responses=['형식을 못 지켰어요', '{"sentiment": "negative", "confidence": 0.8}',
                             '또 실패', '다시 실패', '세 번째 실패'])
print(classify(bad, '배송이 너무 느려요'))
print(classify(bad, '그냥 그래요'))
print('호출 횟수:', bad.calls)
`,
            nondeterministic: true,
            expect: '{\'sentiment\': \'negative\', \'confidence\': 0.8}\n{\'sentiment\': \'unknown\', \'confidence\': 0}\n호출 횟수: 5' }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '구조화 출력', subtitle: 'JSON 모드 · r.json() · 재시도 · 체인 맛보기', notes: '<p>2교시. “프로그램이 쓸 수 있는 답”이 주제. 01차시 도구 호출 요청도 JSON 이었다는 점을 연결합니다.</p><p>⏱ 왜 JSON 인가 8분</p>' },
          { layout: 'diagram', title: '왜 JSON 인가', html: FIG_JSON, caption: '자유 텍스트는 파싱이 깨진다 · JSON 은 dict 로 바로 분기',
            notes: '<p><b>발문:</b> “리뷰가 부정이면 담당자에게 알리는 코드를 쓰려면 LLM 답이 어떤 모양이어야 할까요?” → 정해진 값(positive/negative). 에이전트의 모든 결정(도구 선택 · 계획 · 평가)이 구조화 출력.</p>' },
          { layout: 'code', title: '감성 분류를 JSON 으로', code: `import agentlab as al

llm = al.LLM()
SYSTEM = ('리뷰의 감성을 분석해 JSON 으로만 답하라. '
          '형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}')
for text in ['배송이 빠르고 품질도 좋아요. 추천합니다!', '배터리가 하루도 못 가요. 실망했습니다.']:
    r = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True)
    print(repr(r.content))             # 아직 문자열
    d = r.json()                       # dict
    print('🚨' if d['sentiment'] == 'negative' else '  ', d['sentiment'], text)`, points: ['프롬프트에 키 · 값 예시', '<code>json_mode=True</code> → 공급자 JSON 모드', '<code>r.json()</code> → dict → 분기'],
            notes: '<p>repr(r.content) 로 “아직 문자열” 임을 보여 준 뒤 r.json() 을 호출. 모의 LLM 은 키워드로 판단한다고 설명.</p><p>⏱ json_mode 12분</p>' },
          { layout: 'code', title: '정보 추출과 계획', code: `import agentlab as al

llm = al.LLM()
P = '다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {"name": ..., "email": ..., "phone": ...} 으로 답하라. 없는 항목은 null 로 둔다.'
d = llm.chat([al.user(P + '\\n문장: 저는 김영준입니다. yj.kim@example.com, 010-1234-5678')], json_mode=True).json()
print(d)

plan = llm.chat([al.system('너는 계획 전문가다.'),
                 al.user('목표: 학교 축제 홍보 영상 만들기\\n단계를 JSON {"goal": "...", "steps": [...]} 로만 답해라.')],
                json_mode=True).json()
for i, s in enumerate(plan['steps'], 1):
    print(i, s)`, points: ['비정형 문장 → 레코드', '“없으면 null” 명시', '계획 = JSON 으로 받은 할 일 목록'],
            notes: '<p>plan[\'steps\'] 를 for 문으로 돌리면 Plan-and-Execute(06차시) 라고 예고. al.Planner 가 이 코드를 감싼 것.</p><p>⏱ 분류 · 추출 · 계획 12분</p>' },
          { layout: 'code', title: '파서의 허용 범위', code: `from agentlab.llm import parse_json

fence = chr(96) * 3                    # 백틱 세 개
samples = ['{"a": 1}',
           '결과입니다.\\n' + fence + 'json\\n{"a": 1}\\n' + fence,
           '결과: [1, 2, 3] 입니다',
           'JSON 으로 답하기 어렵습니다.']
for s in samples:
    try:
        print('✅', parse_json(s))
    except ValueError as e:
        print('❌', str(e)[:40])`, points: ['울타리 · 앞뒤 문장 허용', '리스트도 OK', 'JSON 이 없으면 ValueError → 재시도'],
            notes: '<p>실제 모델이 울타리를 붙이는 일은 흔합니다. 마지막 샘플이 재시도의 동기.</p>' },
          { layout: 'diagram', title: '재시도 패턴', html: FIG_RETRY, caption: '실패 내용을 알려 주며 재요청 · 상한 · 기본값',
            notes: '<p>“왜 그냥 다시 부르지 않고 오류를 알려 주나?” → 같은 입력이면 같은 실패를 반복하기 쉽다. 무엇이 틀렸는지 알려 줘야 고친다.</p><p>⏱ 재시도 · 체인 12분</p>' },
          { layout: 'code', title: 'ask_json — 재시도 함수', code: `import agentlab as al

def ask_json(llm, messages, retries=3):
    msgs = list(messages)
    for attempt in range(1, retries + 1):
        r = llm.chat(msgs, json_mode=True)
        try:
            return r.json()
        except ValueError as e:
            print(f'  ⚠ {attempt}번째 실패: {str(e)[:40]}')
            msgs.append(r.message())
            msgs.append(al.user('JSON 만 출력해라.'))
    return None

llm = al.LLM(mock_responses=['형식을 못 지켰어요', '{"sentiment": "positive", "confidence": 0.95}'])
print(ask_json(llm, [al.user('감성을 JSON 으로: 최고의 수업')]), '| 호출', llm.calls)`, points: ['try/except ValueError', '실패 답 + 지적을 기록에 추가', '상한 넘으면 None → 기본값'],
            notes: '<p>모의 LLM 전용 시나리오. 키 있는 학생은 한 번에 성공. temperature=0 이 실패율을 낮춘다는 점도.</p>' },
          { layout: 'diagram', title: '미니 LangChain: 체인', html: FIG_CHAIN, caption: 'prompt | llm | parser — 출력이 다음 입력으로',
            notes: '<p>07차시 예고. 오늘은 “| 로 잇는다”는 모양만. Colab 에서는 import 만 바꾸면 LangChain 코드.</p>' },
          { layout: 'code', title: 'PromptTemplate | llm | JsonOutputParser', code: `import agentlab as al

llm = al.LLM()
prompt = al.PromptTemplate(
    '다음 리뷰의 감성을 JSON {{"sentiment": "positive|negative|neutral"}} 로만 답하라.\\n리뷰: {review}')
chain = prompt | llm | al.JsonOutputParser()
print(chain)
for review in ['화면이 선명하고 배터리도 오래 가요. 최고!', '소리가 자꾸 끊겨서 별로예요.']:
    print(chain.invoke({'review': review})['sentiment'], '←', review)`, points: ['<code>{review}</code> = 변수', 'JSON 중괄호는 <code>{{ }}</code>', '<code>invoke(dict)</code> → dict'],
            notes: '<p>{{ }} 이스케이프에서 KeyError 가 가장 흔한 실수. 파이썬 format 규칙임을 먼저 설명.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[2].q, options: QUIZ2[2].options, answer: QUIZ2[2].answer, explain: QUIZ2[2].explain, notes: '<p>재시도의 세 요소(오류 알려 주기 · 상한 · 기본값)를 확인.</p>' },
          { layout: 'practice', title: '실습 2-3. 리뷰 일괄 분류와 집계', desc: '<p>리뷰 5개를 분류하고 라벨별 개수를 세세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
SYSTEM = '리뷰의 감성을 분석해 JSON 으로만 답하라. 형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}'
reviews = ['가격 대비 만족합니다', '포장이 찢어져서 왔어요. 불만입니다', '그냥 보통이에요',
           '디자인이 훌륭하고 배송도 빨라요', '한 달 만에 고장났어요. 환불 원합니다']
counts = {}
for text in reviews:
    d = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True).json()
    # TODO: counts 세기
print(counts)`, solution: `import agentlab as al

llm = al.LLM()
SYSTEM = '리뷰의 감성을 분석해 JSON 으로만 답하라. 형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}'
reviews = ['가격 대비 만족합니다', '포장이 찢어져서 왔어요. 불만입니다', '그냥 보통이에요',
           '디자인이 훌륭하고 배송도 빨라요', '한 달 만에 고장났어요. 환불 원합니다']
counts = {}
for text in reviews:
    d = llm.chat([al.system(SYSTEM), al.user(text)], json_mode=True).json()
    counts[d['sentiment']] = counts.get(d['sentiment'], 0) + 1
print(counts)`, notes: '<p>빨리 끝낸 학생은 confidence 평균도 구하게 합니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['구조화 출력 = 프로그램이 쓸 수 있는 답 (JSON)', '<code>json_mode=True</code> + 프롬프트에 키 예시 → <code>r.json()</code> → dict', '분류 · 추출 · 계획 — 에이전트의 모든 결정이 JSON', '파서는 울타리 · 잡담 허용, 없으면 ValueError → 재시도 + 기본값', '<code>prompt | llm | parser</code> 체인 (07차시 LangChain)', '다음 차시: 역할과 페르소나 설정'], notes: '<p>⏱ 정리 6분. 과제: Colab 02 ✏️ 문제(뉴스 제목 추출) 또는 브라우저 실습 2-4 제출.</p>' }
        ]
      }
    ]
  });
})();
