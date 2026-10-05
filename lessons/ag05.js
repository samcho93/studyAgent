/* 05차시 기억 장치: 단기 기억과 장기 기억(벡터 저장소) */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* LLM 은 기억이 없다 — 호출마다 새 출발 */
  const FIG_NOMEM = `<svg viewBox="0 0 700 280" role="img" aria-label="LLM 호출은 서로 독립적이어서 앞 호출의 내용을 다음 호출이 모르고, 대화 기록을 함께 보내야 기억처럼 동작한다는 그림">
  ${ARROW('m05a1')}
  <text x="175" y="30" text-anchor="middle" class="tx-b">❌ 호출마다 새 출발 (상태 없음)</text>
  <rect x="15" y="50" width="150" height="56" rx="10" class="p1s"/><text x="90" y="74" text-anchor="middle" class="tx">1번째 호출</text><text x="90" y="94" text-anchor="middle" class="tx-m">“내 이름은 영준이야”</text>
  <rect x="200" y="50" width="130" height="56" rx="10" class="p1"/><text x="265" y="83" text-anchor="middle" class="tx-w">LLM</text>
  <line x1="167" y1="78" x2="196" y2="78" class="ln" stroke-width="2" marker-end="url(#m05a1)"/>
  <rect x="15" y="130" width="150" height="56" rx="10" class="p1s"/><text x="90" y="154" text-anchor="middle" class="tx">2번째 호출</text><text x="90" y="174" text-anchor="middle" class="tx-m">“내 이름이 뭐지?”</text>
  <rect x="200" y="130" width="130" height="56" rx="10" class="p1"/><text x="265" y="163" text-anchor="middle" class="tx-w">LLM</text>
  <line x1="167" y1="158" x2="196" y2="158" class="ln" stroke-width="2" marker-end="url(#m05a1)"/>
  <text x="175" y="222" text-anchor="middle" class="tx-m">→ “이름을 아직 듣지 못했습니다”</text>
  <text x="175" y="244" text-anchor="middle" class="tx-m">두 호출은 서로를 전혀 모릅니다</text>
  <line x1="350" y1="20" x2="350" y2="260" class="ln" stroke-dasharray="4 4"/>
  <text x="525" y="30" text-anchor="middle" class="tx-b">✅ 대화 기록을 매번 함께 보냄</text>
  <rect x="370" y="50" width="200" height="136" rx="10" class="card-bg"/>
  <text x="385" y="74" class="tx-m">system: 당신은 비서입니다</text>
  <text x="385" y="96" class="tx-m">user: 내 이름은 영준이야</text>
  <text x="385" y="118" class="tx-m">assistant: 반가워요, 영준 님!</text>
  <text x="385" y="140" class="tx-m">user: 나는 커피를 좋아해</text>
  <text x="385" y="162" class="tx-m">assistant: 알겠습니다</text>
  <text x="385" y="180" class="tx-b">user: 내 이름이 뭐지?</text>
  <rect x="595" y="90" width="90" height="56" rx="10" class="p1"/><text x="640" y="123" text-anchor="middle" class="tx-w">LLM</text>
  <line x1="572" y1="118" x2="591" y2="118" class="ln" stroke-width="2" marker-end="url(#m05a1)"/>
  <text x="525" y="222" text-anchor="middle" class="tx-m">→ “당신의 이름은 영준입니다”</text>
  <text x="525" y="244" text-anchor="middle" class="tx-m">기억 = 우리가 보내는 메시지 목록</text>
</svg>`;

  /* 대화 창(window)과 토큰 예산 */
  const FIG_WINDOW = `<svg viewBox="0 0 720 260" role="img" aria-label="대화 기록이 테이프처럼 쌓이고, 창 크기만큼의 최근 메시지만 LLM 에 보내며, 창 밖의 오래된 메시지는 잊히는 그림">
  ${ARROW('m05a2')}
  <text x="20" y="30" class="tx-b">전체 대화 기록 (history)</text>
  <rect x="20" y="45" width="70" height="40" rx="6" class="p4s"/><text x="55" y="70" text-anchor="middle" class="tx-m">u: 이름</text>
  <rect x="100" y="45" width="70" height="40" rx="6" class="p4s"/><text x="135" y="70" text-anchor="middle" class="tx-m">a: 반가워</text>
  <rect x="180" y="45" width="70" height="40" rx="6" class="p4s"/><text x="215" y="70" text-anchor="middle" class="tx-m">u: 커피</text>
  <rect x="260" y="45" width="70" height="40" rx="6" class="p4s"/><text x="295" y="70" text-anchor="middle" class="tx-m">a: 알겠음</text>
  <rect x="340" y="45" width="70" height="40" rx="6" class="p2s"/><text x="375" y="70" text-anchor="middle" class="tx-m">u: 날씨</text>
  <rect x="420" y="45" width="70" height="40" rx="6" class="p2s"/><text x="455" y="70" text-anchor="middle" class="tx-m">a: 알겠음</text>
  <rect x="500" y="45" width="70" height="40" rx="6" class="p2s"/><text x="535" y="70" text-anchor="middle" class="tx-m">u: 할 일</text>
  <rect x="580" y="45" width="70" height="40" rx="6" class="p2s"/><text x="615" y="70" text-anchor="middle" class="tx-m">a: 정리</text>
  <rect x="660" y="45" width="50" height="40" rx="6" class="p1s"/><text x="685" y="70" text-anchor="middle" class="tx-m">u: ?</text>
  <rect x="335" y="38" width="380" height="54" rx="8" fill="none" class="s2" stroke-width="2.5" stroke-dasharray="7 4"/>
  <text x="525" y="112" text-anchor="middle" class="tx-b">window = 5 → 최근 5개만 LLM 에 보냄</text>
  <text x="175" y="112" text-anchor="middle" class="tx-m">창 밖 = 잊힘 (“내 이름은…” 포함!)</text>
  <text x="20" y="160" class="tx-b">왜 자르나? 토큰 예산</text>
  <rect x="20" y="175" width="690" height="22" rx="6" class="card-bg"/>
  <rect x="20" y="175" width="120" height="22" rx="6" class="p3"/><text x="80" y="191" text-anchor="middle" class="tx-w">system</text>
  <rect x="140" y="175" width="300" height="22" class="p4"/><text x="290" y="191" text-anchor="middle" class="tx-w">대화 기록 (호출마다 길어짐 → 비용 ↑)</text>
  <rect x="440" y="175" width="90" height="22" class="p1"/><text x="485" y="191" text-anchor="middle" class="tx-w">새 질문</text>
  <rect x="530" y="175" width="180" height="22" rx="6" class="p5s"/><text x="620" y="191" text-anchor="middle" class="tx-m">답을 쓸 여유 공간</text>
  <text x="365" y="225" text-anchor="middle" class="tx-m">컨텍스트 창(context window) 한도 안에서 system + 기록 + 질문 + 답이 모두 들어가야 합니다</text>
  <text x="365" y="247" text-anchor="middle" class="tx-m">기록은 매 호출마다 전부 다시 보내므로, 대화가 길어질수록 호출당 비용이 커집니다</text>
</svg>`;

  /* 요약 기억 */
  const FIG_SUMMARY = `<svg viewBox="0 0 700 250" role="img" aria-label="오래된 대화를 LLM 이 요약해 시스템 프롬프트에 넣고 최근 대화만 그대로 유지하는 요약 기억 그림">
  ${ARROW('m05a3')}
  <text x="20" y="30" class="tx-b">오래된 대화 (창 밖으로 밀려남)</text>
  <rect x="20" y="45" width="280" height="90" rx="10" class="p4s"/>
  <text x="35" y="70" class="tx-m">u: 내 이름은 영준이야 / a: 반가워요</text>
  <text x="35" y="92" class="tx-m">u: 나는 커피를 좋아해 / a: 알겠습니다</text>
  <text x="35" y="114" class="tx-m">u: 내일 회의는 3시야 / a: 알겠습니다</text>
  <rect x="340" y="60" width="100" height="60" rx="12" class="p1"/><text x="390" y="86" text-anchor="middle" class="tx-w">LLM</text><text x="390" y="106" text-anchor="middle" class="tx-w">요약해라</text>
  <line x1="302" y1="90" x2="336" y2="90" class="ln" stroke-width="2" marker-end="url(#m05a3)"/>
  <rect x="480" y="45" width="205" height="90" rx="10" class="p2s"/>
  <text x="582" y="70" text-anchor="middle" class="tx-b">요약 (system 에 삽입)</text>
  <text x="582" y="95" text-anchor="middle" class="tx-m">“사용자 이름은 영준, 커피 선호,</text>
  <text x="582" y="115" text-anchor="middle" class="tx-m">내일 3시 회의”</text>
  <line x1="442" y1="90" x2="476" y2="90" class="ln" stroke-width="2" marker-end="url(#m05a3)"/>
  <text x="20" y="175" class="tx-b">LLM 에 보내는 것 =</text>
  <rect x="170" y="158" width="150" height="26" rx="6" class="p3"/><text x="245" y="176" text-anchor="middle" class="tx-w">system + 요약</text>
  <text x="335" y="176" class="tx-b">+</text>
  <rect x="355" y="158" width="200" height="26" rx="6" class="p2s"/><text x="455" y="176" text-anchor="middle" class="tx">최근 대화 N개 (원문 그대로)</text>
  <text x="350" y="215" text-anchor="middle" class="tx-m">토큰은 줄지만 요약은 손실 압축 — 세부 내용이 사라질 수 있습니다 (→ 장기 기억으로 보완)</text>
</svg>`;

  /* 메모리 계층 */
  const FIG_LAYERS = `<svg viewBox="0 0 720 320" role="img" aria-label="컨텍스트 창, 단기 기억, 장기 기억, 외부 데이터베이스의 네 층으로 이루어진 에이전트 메모리 계층 그림">
  <rect x="60" y="20" width="600" height="60" rx="12" class="p1"/><text x="360" y="45" text-anchor="middle" class="tx-w">① 컨텍스트 창 (LLM 의 작업 기억)</text><text x="360" y="66" text-anchor="middle" class="tx-w">이번 호출에 보낸 메시지 전부 — 호출이 끝나면 사라짐</text>
  <rect x="40" y="95" width="640" height="60" rx="12" class="p2s"/><text x="360" y="120" text-anchor="middle" class="tx-b">② 단기 기억 (대화 기록)</text><text x="360" y="141" text-anchor="middle" class="tx-m">ConversationMemory(window) · SummaryMemory — 이번 세션의 대화, 매번 다시 보냄</text>
  <rect x="20" y="170" width="680" height="60" rx="12" class="p3s"/><text x="360" y="195" text-anchor="middle" class="tx-b">③ 장기 기억 (벡터 저장소)</text><text x="360" y="216" text-anchor="middle" class="tx-m">VectorStore — 사실 · 선호 · 과거 대화를 임베딩으로 저장, 필요한 것만 검색해 꺼냄 (세션 넘어 유지)</text>
  <rect x="0" y="245" width="720" height="60" rx="12" class="p5s"/><text x="360" y="270" text-anchor="middle" class="tx-b">④ 외부 저장소</text><text x="360" y="291" text-anchor="middle" class="tx-m">SQL · 파일 · 벡터 DB(Chroma · FAISS · pgvector) — 도구로 읽고 쓰는 영구 데이터</text>
  <text x="700" y="50" text-anchor="end" class="tx-m">빠름 · 작음</text>
  <text x="700" y="300" text-anchor="end" class="tx-m">느림 · 큼</text>
</svg>`;

  /* 임베딩과 코사인 유사도 */
  const FIG_EMBED = `<svg viewBox="0 0 720 300" role="img" aria-label="문장을 임베딩 벡터로 바꾸고, 벡터 사이의 각도로 유사도를 재는 코사인 유사도 그림">
  ${ARROW('m05a4')}
  <rect x="15" y="20" width="230" height="40" rx="8" class="p1s"/><text x="130" y="45" text-anchor="middle" class="tx">“사용자는 커피를 좋아한다”</text>
  <rect x="15" y="75" width="230" height="40" rx="8" class="p2s"/><text x="130" y="100" text-anchor="middle" class="tx">“커피 추천해줘”</text>
  <rect x="15" y="130" width="230" height="40" rx="8" class="p4s"/><text x="130" y="155" text-anchor="middle" class="tx">“내일 회의는 3시야”</text>
  <rect x="280" y="70" width="90" height="56" rx="12" class="p3"/><text x="325" y="94" text-anchor="middle" class="tx-w">임베딩</text><text x="325" y="114" text-anchor="middle" class="tx-w">embed()</text>
  <line x1="247" y1="40" x2="276" y2="85" class="ln" stroke-width="1.5" marker-end="url(#m05a4)"/>
  <line x1="247" y1="95" x2="276" y2="98" class="ln" stroke-width="1.5" marker-end="url(#m05a4)"/>
  <line x1="247" y1="150" x2="276" y2="112" class="ln" stroke-width="1.5" marker-end="url(#m05a4)"/>
  <text x="325" y="150" text-anchor="middle" class="tx-m">문장 → 숫자 256개</text>
  <text x="325" y="168" text-anchor="middle" class="tx-m">[0.1, -0.3, 0.0, …]</text>
  <line x1="430" y1="230" x2="430" y2="30" class="ax"/>
  <line x1="430" y1="230" x2="700" y2="230" class="ax"/>
  <line x1="430" y1="230" x2="660" y2="90" class="s1" stroke-width="3" marker-end="url(#m05a4)"/>
  <line x1="430" y1="230" x2="680" y2="130" class="s2" stroke-width="3" marker-end="url(#m05a4)"/>
  <line x1="430" y1="230" x2="470" y2="50" class="s4" stroke-width="3" marker-end="url(#m05a4)"/>
  <text x="665" y="80" class="tx-m">커피를 좋아한다</text>
  <text x="640" y="150" class="tx-m">커피 추천해줘</text>
  <text x="440" y="42" class="tx-m">회의 3시</text>
  <path d="M 500 190 A 75 75 0 0 1 505 185" class="s2" stroke-width="2" fill="none"/>
  <text x="520" y="205" class="tx-m">각도 작음 = 비슷함</text>
  <text x="565" y="265" text-anchor="middle" class="tx-b">코사인 유사도 = 두 벡터 사이 각도의 cos (1 = 같음, 0 = 무관)</text>
  <text x="565" y="287" text-anchor="middle" class="tx-m">“커피”가 겹치는 두 문장은 각도가 작고, 회의 문장은 멀리 떨어져 있습니다</text>
</svg>`;

  /* 미니 RAG */
  const FIG_RAG = `<svg viewBox="0 0 720 300" role="img" aria-label="질문을 임베딩해 벡터 저장소에서 관련 기억을 검색하고, 그 기억을 시스템 프롬프트에 넣어 LLM 이 답하는 미니 RAG 흐름과, 새 사실을 저장하는 흐름">
  ${ARROW('m05a5')}
  <rect x="15" y="100" width="120" height="56" rx="10" class="p1s"/><text x="75" y="124" text-anchor="middle" class="tx-b">👤 질문</text><text x="75" y="144" text-anchor="middle" class="tx-m">“뭐 마실까?”</text>
  <rect x="175" y="100" width="110" height="56" rx="10" class="p3"/><text x="230" y="124" text-anchor="middle" class="tx-w">① 임베딩</text><text x="230" y="144" text-anchor="middle" class="tx-w">질문 → 벡터</text>
  <rect x="325" y="30" width="170" height="196" rx="12" class="p2s"/>
  <text x="410" y="55" text-anchor="middle" class="tx-b">🗄 VectorStore</text>
  <text x="340" y="82" class="tx-m">· 이름은 영준</text>
  <rect x="335" y="92" width="150" height="22" rx="5" class="p2"/><text x="410" y="107" text-anchor="middle" class="tx-w">· 커피를 좋아함 ★</text>
  <text x="340" y="134" class="tx-m">· 매운 음식 못 먹음</text>
  <text x="340" y="156" class="tx-m">· 금요일 3시 회의</text>
  <text x="340" y="178" class="tx-m">· 파이썬 배우는 중</text>
  <text x="410" y="210" text-anchor="middle" class="tx-m">② 유사도 상위 k개</text>
  <rect x="535" y="30" width="170" height="100" rx="10" class="card-bg"/>
  <text x="620" y="52" text-anchor="middle" class="tx-b">③ 프롬프트 조립</text>
  <text x="548" y="76" class="tx-m">system: 당신은 비서.</text>
  <text x="548" y="96" class="tx-m">[기억] 커피를 좋아함</text>
  <text x="548" y="116" class="tx-m">user: 뭐 마실까?</text>
  <rect x="535" y="160" width="170" height="60" rx="10" class="p1"/><text x="620" y="185" text-anchor="middle" class="tx-w">④ LLM</text><text x="620" y="206" text-anchor="middle" class="tx-w">“라떼 어떠세요?”</text>
  <line x1="137" y1="128" x2="171" y2="128" class="ln" stroke-width="2" marker-end="url(#m05a5)"/>
  <line x1="287" y1="128" x2="321" y2="128" class="ln" stroke-width="2" marker-end="url(#m05a5)"/>
  <line x1="497" y1="100" x2="531" y2="80" class="ln" stroke-width="2" marker-end="url(#m05a5)"/>
  <line x1="620" y1="132" x2="620" y2="156" class="ln" stroke-width="2" marker-end="url(#m05a5)"/>
  <rect x="15" y="235" width="120" height="50" rx="10" class="p5s"/><text x="75" y="256" text-anchor="middle" class="tx-b">👤 새 사실</text><text x="75" y="275" text-anchor="middle" class="tx-m">“나 커피 좋아해”</text>
  <line x1="137" y1="260" x2="320" y2="215" class="ln" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#m05a5)"/>
  <text x="230" y="268" text-anchor="middle" class="tx-m">⑤ 저장 (remember 도구)</text>
  <text x="620" y="262" text-anchor="middle" class="tx-m">문서 조각을 넣으면 = RAG</text>
  <text x="620" y="282" text-anchor="middle" class="tx-m">(studyRAG 강좌)</text>
</svg>`;

  const QUIZ1 = [
    { q: 'LLM API 를 두 번 따로 호출했을 때(<code>llm.ask()</code> 두 번) 두 번째 호출이 첫 번째 대화 내용을 모르는 이유는?', options: ['모델이 작아서', 'LLM 호출은 상태가 없어(stateless) 매번 보낸 메시지만 보기 때문', 'API 키가 달라서', '한국어라서'], answer: 1,
      explain: 'LLM 은 호출 사이에 아무것도 저장하지 않습니다. “기억”은 우리가 대화 기록을 메시지 목록에 쌓아 매번 함께 보내는 것으로 만들어집니다.' },
    { q: '<code>al.ConversationMemory(window=2)</code> 로 6개의 메시지를 쌓은 뒤 <code>messages()</code> 를 부르면 LLM 에 보내지는 대화 메시지는 몇 개인가? (시스템 프롬프트 제외)', options: ['2개', '4개', '6개', '0개'], answer: 0,
      explain: '<code>window</code> 는 최근 N개의 메시지만 보내는 창입니다. 나머지는 <code>history</code> 에 남아 있지만 LLM 은 보지 못합니다.' },
    { q: '대화 기록을 창(window)으로 자르는 가장 큰 이유는?', options: ['답이 더 정확해져서', '컨텍스트 창 한도와 토큰 비용 때문', '모델이 한국어를 못 읽어서', '메시지 순서를 섞기 위해'], answer: 1,
      explain: '기록은 매 호출마다 전부 다시 보내므로 대화가 길어질수록 호출당 토큰(비용)이 늘고, 컨텍스트 창 한도를 넘으면 오류가 납니다.' },
    { q: '<code>SummaryMemory</code> 가 오래된 대화를 처리하는 방법은?', options: ['그냥 버린다', 'LLM 으로 요약해 시스템 프롬프트에 넣고 최근 대화만 원문으로 남긴다', '파일로 저장한다', '사용자에게 다시 묻는다'], answer: 1,
      explain: '요약은 토큰을 아끼지만 손실 압축입니다. 꼭 남겨야 할 사실은 2교시의 장기 기억(벡터 저장소)에 따로 저장합니다.' }
  ];
  const QUIZ2 = [
    { q: '임베딩(embedding)이란?', options: ['문장을 영어로 번역한 것', '문장의 의미를 숫자 벡터로 바꾼 것', '문장을 압축한 zip 파일', '문장의 글자 수'], answer: 1,
      explain: '임베딩은 텍스트를 고정 길이의 숫자 벡터로 바꿉니다. 비슷한 의미의 문장은 비슷한 벡터가 되어 숫자로 “비슷함”을 잴 수 있습니다.' },
    { q: '코사인 유사도가 <b>1.0</b> 에 가깝다는 뜻은?', options: ['두 벡터가 거의 같은 방향 (매우 비슷함)', '두 벡터가 수직 (무관함)', '두 벡터가 반대 방향', '계산 오류'], answer: 0,
      explain: '코사인 유사도는 두 벡터 사이 각도의 cos 값입니다. 1 이면 같은 방향, 0 이면 수직(무관), 음수면 반대 방향입니다.' },
    { q: '<code>store.search(\'음식\', k=2, where={\'kind\': \'preference\'})</code> 의 동작은?', options: ['모든 항목 중 상위 2개', '<code>kind</code> 가 preference 인 항목 중에서만 유사도 상위 2개', 'preference 를 제외한 상위 2개', '2개를 무작위로'], answer: 1,
      explain: '<code>where</code> 는 메타데이터 필터입니다. 조건에 맞는 항목만 후보로 두고 그중 유사도 순으로 k개를 돌려줍니다.' },
    { q: '미니 RAG 에서 “검색된 기억”은 LLM 에 어떻게 전달되는가?', options: ['모델을 다시 학습시킨다', '프롬프트(시스템 또는 사용자 메시지)에 텍스트로 넣어 보낸다', 'API 키에 붙인다', '전달할 수 없다'], answer: 1,
      explain: 'LLM 은 프롬프트에 있는 것만 봅니다. 검색된 기억을 “[기억] …” 형태로 프롬프트에 넣어 주면 그 내용을 참고해 답합니다. 문서 조각을 넣으면 그것이 RAG 입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag05',
    no: '05',
    title: '기억 장치: 단기 기억과 장기 기억(벡터 저장소)',
    subtitle: '대화 기록 · 창과 토큰 예산 · 요약 · 임베딩 · 벡터 저장소 · 미니 RAG',
    summary: 'LLM 은 방금 한 말도 기억하지 못합니다. 호출마다 새 출발이기 때문입니다. 에이전트의 세 번째 핵심 요소 <b>기억(memory)</b>은 우리가 직접 만들어 줘야 합니다. <b>대화 기록을 쌓아 보내는 단기 기억</b>(창 제한 · 요약 압축)과, <b>임베딩 벡터로 사실을 저장하고 의미로 검색하는 장기 기억</b>(벡터 저장소 · 미니 RAG · 자동 저장 도구)을 직접 구현하며 메모리 계층을 이해합니다.',
    goals: [
      'LLM 호출이 상태가 없음을 실험으로 확인하고, 대화 기록(messages)이 곧 단기 기억임을 설명할 수 있다',
      '<code>ConversationMemory(window)</code> 로 창을 제한했을 때 기억이 잘리는 현상과 토큰 예산의 관계를 설명할 수 있다',
      '<code>SummaryMemory</code> 의 요약 압축 원리와 한계를 알고 메모리 계층(컨텍스트 창 · 단기 · 장기 · 외부)을 그릴 수 있다',
      '임베딩과 코사인 유사도로 문장의 비슷함을 재고, <code>VectorStore</code> 에 사실을 저장 · 검색 · 필터할 수 있다',
      '검색된 기억을 프롬프트에 넣어 답하는 미니 RAG 와, 에이전트가 도구로 기억을 저장 · 회상하는 흐름을 구현할 수 있다'
    ],
    sections: [
      {
        id: 'ag05-1',
        title: '단기 기억: 대화 기록과 창',
        minutes: 50,
        goals: ['LLM 호출이 상태가 없음을 확인한다', '대화 기록 누적과 창(window) 제한의 효과를 실험한다', '요약 기억과 메모리 계층을 설명한다'],
        flow: [['도입 · LLM 은 기억이 없다', 8], ['대화 기록 = 단기 기억', 12], ['창 제한과 토큰 예산', 12], ['요약 기억 · 메모리 계층', 10], ['퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '챗봇과 대화하다 보면 “아까 말했잖아!” 싶은 순간이 있습니다. 사실 LLM 은 아까 한 말을 <b>전혀 기억하지 못합니다</b>. 채팅 앱이 이전 대화를 매번 통째로 다시 보내 주고 있을 뿐입니다. 이번 차시는 에이전트의 세 번째 핵심 요소, <b>기억</b>을 우리 손으로 만듭니다.' },
          { type: 'h', text: 'LLM 은 기억이 없다: 호출마다 새 출발' },
          { type: 'p', html: 'LLM API 는 <b>상태가 없습니다(stateless)</b>. 한 번의 호출은 “보낸 메시지 → 답” 으로 끝나고, 서버는 아무것도 저장하지 않습니다. 그래서 따로따로 두 번 부르면 두 번째 호출은 첫 번째 대화를 모릅니다.' },
          { type: 'figure', html: FIG_NOMEM, caption: '그림 5-1. 왼쪽: 따로 부른 두 호출은 서로를 모릅니다. 오른쪽: 대화 기록을 메시지 목록에 쌓아 매번 함께 보내면 “기억”처럼 동작합니다.' },
          { type: 'code', title: '예제 5-1. 따로 부르면 잊는다', code: `import agentlab as al

llm = al.LLM()
first = llm.ask('내 이름은 영준이야. 기억해 줘!')     # 1번째 호출
second = llm.ask('내 이름이 뭐지?')                   # 2번째 호출 — 완전히 새 출발
print('2번째 호출의 답:', second)
print('LLM 호출 횟수:', llm.calls, '— 두 호출은 서로를 전혀 모릅니다')`,
            expect: `2번째 호출의 답: 죄송합니다, 이름을 아직 듣지 못했습니다.
LLM 호출 횟수: 2 — 두 호출은 서로를 전혀 모릅니다`,
            desc: '<code>ask()</code> 는 매번 새 메시지 목록을 만들어 보냅니다. 두 번째 호출에는 “내 이름은 영준이야”가 들어 있지 않으니 모델은 이름을 알 수 없습니다. 실제 모델도 똑같이 “알려 주신 적이 없다”고 답합니다.' },
          { type: 'h', text: '대화 기록 = 단기 기억' },
          { type: 'p', html: '해결책은 단순합니다. <b>지금까지의 대화를 메시지 목록에 쌓아 두고, 매번 전부 함께 보내는 것</b>입니다. 02차시에서 본 <code>system · user · assistant</code> 메시지 목록이 바로 단기 기억입니다. 답을 받으면 <code>r.message()</code> 로 assistant 메시지도 목록에 넣어야 다음 호출이 “무슨 답을 했는지”까지 압니다.' },
          { type: 'code', title: '예제 5-2. 메시지 목록을 쌓아 가며 대화하기', code: `import agentlab as al

llm = al.LLM()
# 어제 나눈 대화를 기록에서 불러왔다고 가정 (대화 기록은 평범한 리스트입니다)
messages = [al.system('당신은 친절한 비서입니다.'),
            al.user('내 이름은 영준이야.'),
            al.assistant('반가워요, 영준 님! 기억할게요.')]

for q in ['나는 커피를 좋아해.', '내 이름이 뭐지?']:
    messages.append(al.user(q))            # ① 질문을 기록에 추가
    r = llm.chat(messages)                 # ② 기록 전체를 보냄
    messages.append(r.message())           # ③ 답도 기록에 추가
    print('👤', q)
    print('🤖', r.content, '| 입력 토큰:', r.usage.prompt_tokens)

print('기록된 메시지:', [m['role'] for m in messages], '→ 총', len(messages), '개')`,
            expect: `👤 나는 커피를 좋아해.
🤖 [친절한 비서] 알겠습니다. "나는 커피를 좋아해." 을(를) 처리했습니다. (대화 2번째) | 입력 토큰: 16
👤 내 이름이 뭐지?
🤖 [친절한 비서] 당신의 이름은 영준 입니다. | 입력 토큰: 36
기록된 메시지: ['system', 'user', 'assistant', 'user', 'assistant', 'user', 'assistant'] → 총 7 개`,
            desc: '이번에는 이름을 기억합니다 — 모델이 똑똑해진 것이 아니라 <b>“내 이름은 영준이야”가 보낸 메시지 안에 있기 때문</b>입니다. 입력 토큰이 16 → 36 으로 늘어난 것도 주목하세요. 기록이 길어질수록 매 호출의 입력이 커집니다. (예시 출력은 모의 LLM 기준)' },
          { type: 'callout', kind: 'info', title: '모의 LLM 의 기억 규칙', html: '모의 LLM 은 <b>이전 user 메시지</b>에서 “내 이름은 OO이야”, “내가 좋아하는 OO는 △△야” 패턴을 찾아 “내 이름이 뭐지?”, “내가 뭘 좋아한다고 했지?” 에 답합니다. 그 문장이 보낸 메시지 안에 없으면 모른다고 답하므로, 기억이 잘리는 실험을 눈으로 확인할 수 있습니다.' },
          { type: 'h', text: '창(window) 제한과 토큰 예산' },
          { type: 'p', html: '기록을 무한정 쌓을 수는 없습니다. 모델이 한 번에 읽을 수 있는 양(<b>컨텍스트 창</b>, context window)에 한도가 있고, 기록은 매 호출마다 전부 다시 보내므로 <b>비용이 호출마다 커집니다</b>. 가장 단순한 대책은 <b>최근 N개 메시지만</b> 보내는 창(window)입니다. <code>al.ConversationMemory(window=N)</code> 이 이 일을 합니다.' },
          { type: 'figure', html: FIG_WINDOW, caption: '그림 5-2. 창 밖으로 밀려난 메시지는 기록에는 남지만 LLM 은 보지 못합니다. 창을 두는 이유는 컨텍스트 창 한도와 토큰 비용입니다.' },
          { type: 'code', title: '예제 5-3. 창을 2 로 줄이면 이름을 잊는다', code: `import agentlab as al

llm = al.LLM()

def chat_with(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 친절한 비서입니다.')
    mem.add_user('내 이름은 영준이야.')                  # 어제의 대화 불러오기
    mem.add_assistant('반가워요, 영준 님! 기억할게요.')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content     # messages() 가 창을 적용한다
        mem.add_assistant(answer)
    print(f'[window={window}] 마지막 답: {answer}')
    print(f'   전체 기록 {len(mem)}개 중 LLM 에 보낸 대화 메시지 {len(mem.messages()) - 1}개')
    mem.show()

chat_with(None)      # 창 없음: 전부 보냄
print()
chat_with(2)         # 최근 2개만`,
            expect: `[window=None] 마지막 답: [친절한 비서] 당신의 이름은 영준 입니다.
   전체 기록 8개 중 LLM 에 보낸 대화 메시지 8개
  system   | 당신은 친절한 비서입니다.
  user     | 내 이름은 영준이야.
  assistant| 반가워요, 영준 님! 기억할게요.
  user     | 나는 커피를 좋아해.
  assistant| [친절한 비서] 알겠습니다. "나는 커피를 좋아해." 을(를) 처리했습니다. (대화 2번째)
  user     | 오늘 날씨가 참 좋다.
  assistant| [친절한 비서] 알겠습니다. "오늘 날씨가 참 좋다." 을(를) 처리했습니다. (대화 3번째)
  user     | 내 이름이 뭐지?
  assistant| [친절한 비서] 당신의 이름은 영준 입니다.

[window=2] 마지막 답: [친절한 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
   전체 기록 8개 중 LLM 에 보낸 대화 메시지 2개
  system   | 당신은 친절한 비서입니다.
  user     | 내 이름이 뭐지?
  assistant| [친절한 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.`,
            desc: '같은 대화인데 <code>window=2</code> 에서는 이름을 잊습니다. “내 이름은 영준이야”가 창 밖으로 밀려났기 때문입니다. <code>mem.history</code> 에는 전부 남아 있지만 <code>mem.messages()</code> 가 최근 2개만 돌려줍니다. window 를 4, 6, 8 로 바꿔 어디서부터 기억하는지 찾아보세요 (실습 5-1).' },
          { type: 'code', title: '예제 5-4. 호출마다 입력 토큰이 얼마나 늘어날까?', code: `import agentlab as al

llm = al.LLM()
for window in [None, 4]:
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    tokens = []
    for i in range(1, 7):
        mem.add_user(f'{i}번째 질문: 오늘 할 일 알려줘')
        r = llm.chat(mem.messages())
        mem.add_assistant(r.content)
        tokens.append(r.usage.prompt_tokens)
    print(f'window={window}: 호출별 입력 토큰 {tokens} → 합계 {sum(tokens)}')`,
            expect: `window=None: 호출별 입력 토큰 [9, 47, 85, 123, 161, 199] → 합계 624
window=4: 호출별 입력 토큰 [9, 47, 79, 79, 79, 79] → 합계 372`,
            desc: '창이 없으면 입력 토큰이 호출마다 선형으로 늘어 6번의 대화에 624 토큰, 창이 있으면 일정 수준에서 멈춥니다. (모의 LLM 의 토큰 수는 글자 수 기준 근사치. 실제 모델은 한국어 1토큰 ≈ 1~2글자) 100번 대화하면 차이가 수십 배가 됩니다.' },
          { type: 'callout', kind: 'info', title: '컨텍스트 창은 얼마나 클까?', html: '2026년 현재 주요 모델의 컨텍스트 창은 12만 8천 ~ 100만 토큰 수준입니다. “그럼 창을 자를 필요가 없지 않나?” 싶지만, ① 긴 입력은 그만큼 <b>비용과 지연</b>이 늘고, ② 매우 긴 기록 속에서 모델이 중요한 문장을 놓치는 일도 있습니다(“lost in the middle”). 꼭 필요한 것만 보내는 설계는 여전히 중요합니다.' },
          { type: 'h', text: '요약 기억: 오래된 대화는 압축해서' },
          { type: 'p', html: '창에서 밀려난 대화를 그냥 버리면 이름처럼 중요한 정보도 잃습니다. 절충안은 <b>오래된 대화를 LLM 으로 요약</b>해 시스템 프롬프트에 넣고, 최근 대화만 원문으로 남기는 것입니다. <code>al.SummaryMemory(llm, window=N)</code> 은 기록이 <code>2N</code> 개를 넘으면 오래된 부분을 요약으로 압축합니다.' },
          { type: 'figure', html: FIG_SUMMARY, caption: '그림 5-3. 요약 기억. 토큰은 줄지만 요약은 손실 압축이므로 세부 사항이 사라질 수 있습니다.' },
          { type: 'code', title: '예제 5-5. SummaryMemory 로 오래된 대화 압축하기', code: `import agentlab as al

llm = al.LLM()
# 요약을 맡을 LLM. 키가 없을 때는 모의 LLM 이 이 요약문을 돌려줍니다 (키가 있으면 실제 모델이 요약)
summarizer = al.LLM(mock_responses=['사용자 이름은 영준이고 커피를 좋아한다. 내일 3시에 회의가 있다.'])

mem = al.SummaryMemory(summarizer, window=2, system_prompt='당신은 비서입니다.')
mem.add_user('내 이름은 영준이야.')
mem.add_assistant('반가워요, 영준 님! 기억할게요.')
for q in ['나는 커피를 좋아해.', '내일 회의는 3시야.', '오늘 저녁 뭐 먹지?']:
    mem.add_user(q)
    answer = llm.chat(mem.messages()).content
    mem.add_assistant(answer)
    print(f'👤 {q:<14} | 원문 기록 {len(mem)}개 | 요약 있음: {bool(mem.summary)}')

print('--- 요약문 ---')
print(mem.summary)
print('--- LLM 에 보내는 메시지 ---')
mem.show()`,
            expect: `👤 나는 커피를 좋아해.    | 원문 기록 4개 | 요약 있음: False
👤 내일 회의는 3시야.    | 원문 기록 3개 | 요약 있음: True
👤 오늘 저녁 뭐 먹지?    | 원문 기록 2개 | 요약 있음: True
--- 요약문 ---
사용자 이름은 영준이고 커피를 좋아한다. 내일 3시에 회의가 있다.
--- LLM 에 보내는 메시지 ---
  system   | 당신은 비서입니다.

[지금까지의 대화 요약]
사용자 이름은 영준이고 커피를 좋아한다. 내일 3시에 회의가 있다.
  user     | 오늘 저녁 뭐 먹지?
  assistant| [비서] "오늘 저녁 뭐 먹지?" 에 대한 답변: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계`,
            desc: '기록이 4개를 넘는 순간 오래된 2개가 요약으로 압축되어 시스템 프롬프트 끝에 <code>[지금까지의 대화 요약]</code> 으로 붙습니다. 원문 기록은 2개로 유지됩니다. 🔑 실제 키가 있으면 <code>summarizer</code> 가 진짜 요약을 만들고, 모델은 요약 속 “영준 · 커피 · 3시 회의”를 참고해 답합니다. (모의 LLM 은 시스템 프롬프트 속 요약을 읽지 않으므로 답에 반영되지 않습니다)' },
          { type: 'callout', kind: 'warn', title: '요약은 손실 압축', html: '요약하면서 “회의는 3시 <b>강남 지점</b>” 같은 세부가 떨어져 나갈 수 있고, 요약을 다시 요약하면 점점 더 흐려집니다. 그래서 실제 에이전트는 <b>꼭 남겨야 할 사실(이름 · 선호 · 일정)은 별도의 장기 기억에 저장</b>합니다. 2교시에서 그 장기 기억을 만듭니다.' },
          { type: 'h', text: 'Agent 에 메모리 붙이기' },
          { type: 'p', html: '04차시의 <code>al.Agent</code> 는 내부에 <code>ConversationMemory</code> 를 가지고 있어 <code>run()</code> 을 여러 번 불러도 대화가 이어집니다. 원하는 메모리를 <code>memory=</code> 로 넣을 수 있고, <code>reset()</code> 하면 비워집니다.' },
          { type: 'code', title: '예제 5-6. Agent 의 메모리 교체와 초기화', code: `import agentlab as al

llm = al.LLM()
agent = al.Agent(llm, system='당신은 비서입니다.', memory=al.ConversationMemory(window=10))
agent.memory.add_user('내 이름은 영준이야.')              # 이전 세션 기록 불러오기
agent.memory.add_assistant('반가워요, 영준 님!')

print('1:', agent.run('내 이름이 뭐지?'))
print('   기록 메시지 수:', len(agent.memory))
agent.reset()                                             # 기억 비우기
print('2:', agent.run('내 이름이 뭐지?'))
print('   기록 메시지 수:', len(agent.memory))`,
            expect: `1: [비서] 당신의 이름은 영준 입니다.
   기록 메시지 수: 4
2: [비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
   기록 메시지 수: 2`,
            desc: '<code>agent.memory</code> 는 평범한 <code>ConversationMemory</code> 입니다. 04차시 도구 호출의 요청 · 결과 메시지도 모두 이 기억에 쌓입니다(예제 4-9 에서 8개였던 이유). 메모리를 <code>SummaryMemory</code> 로 바꿔 넣으면 긴 대화도 압축하며 이어 갑니다.' },
          { type: 'h', text: '메모리 계층 한눈에 보기' },
          { type: 'p', html: '지금까지 만든 것을 정리하면 다음 계층이 됩니다. 위로 갈수록 빠르고 작으며 호출이 끝나면 사라지고, 아래로 갈수록 느리지만 크고 오래갑니다. 2교시는 ③ 장기 기억을 만듭니다.' },
          { type: 'figure', html: FIG_LAYERS, caption: '그림 5-4. 에이전트 메모리 계층. 사람의 작업 기억 · 단기 기억 · 장기 기억 · 외부 메모(노트)에 비유할 수 있습니다.' },
          { type: 'table', head: ['계층', '무엇', '수명', 'agentlab'], rows: [
            ['① 컨텍스트 창', '이번 호출에 보낸 메시지 전부', '호출 1번', '<code>llm.chat(messages)</code> 의 messages'],
            ['② 단기 기억', '이번 세션의 대화 기록 (창 · 요약)', '세션', '<code>ConversationMemory</code> · <code>SummaryMemory</code>'],
            ['③ 장기 기억', '사실 · 선호 · 과거 대화의 임베딩', '세션을 넘어', '<code>VectorStore</code> (2교시)'],
            ['④ 외부 저장소', 'SQL · 파일 · 벡터 DB', '영구', '<code>read_file</code> · <code>write_file</code> 도구, Chroma (Colab)']
          ], caption: '메모리 계층과 agentlab 대응' }
        ],
        practice: [
          { title: '실습 5-1. 창 크기 실험', level: 1,
            desc: '<p>예제 5-3 의 <code>chat_with()</code> 를 <code>window</code> 를 <b>2, 4, 6, 8</b> 로 바꿔 가며 실행해, 몇 개부터 이름을 기억하는지 표로 출력하세요. 마지막 답에 “영준”이 들어 있으면 기억한 것입니다.</p>',
            hint: '<code>\'영준\' in answer</code> 로 판정. 대화 기록은 세 번 주고받은 뒤 7개(질문 포함)이므로 window ≥ 7 이어야 “내 이름은…”이 창 안에 듭니다.',
            starter: `import agentlab as al

llm = al.LLM()

def last_answer(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    mem.add_user('내 이름은 영준이야.')
    mem.add_assistant('반가워요, 영준 님!')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content
        mem.add_assistant(answer)
    return answer

# TODO: window 2, 4, 6, 8 에 대해 기억 여부('영준' in answer) 출력
`,
            solution: `import agentlab as al

llm = al.LLM()

def last_answer(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    mem.add_user('내 이름은 영준이야.')
    mem.add_assistant('반가워요, 영준 님!')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content
        mem.add_assistant(answer)
    return answer

for window in [2, 4, 6, 8]:
    remembered = '영준' in last_answer(window)
    print(f'window={window}: {"기억함 ✅" if remembered else "잊음 ❌"}')
`,
            expect: `window=2: 잊음 ❌
window=4: 잊음 ❌
window=6: 잊음 ❌
window=8: 기억함 ✅` },
          { title: '실습 5-2. 대화 기록을 파일에 저장하고 불러오기', level: 2,
            desc: '<p>단기 기억을 세션이 끝나도 남기려면 파일에 저장하면 됩니다. ① 메모리에 대화 2개(user · assistant)를 넣고 <code>json.dumps(mem.history, ensure_ascii=False)</code> 로 <code>chat_log.json</code> 에 저장, ② 새 <code>ConversationMemory</code> 를 만들어 파일에서 읽은 메시지를 <code>mem2.add()</code> 로 복원, ③ “내 이름이 뭐지?” 를 물어 기억하는지 확인하세요.</p>',
            hint: '<code>open(\'chat_log.json\', \'w\', encoding=\'utf-8\')</code> 로 쓰고 <code>json.load()</code> 로 읽습니다. 메시지는 dict 이므로 <code>mem2.add(m)</code> 으로 바로 넣을 수 있습니다.',
            starter: `import agentlab as al
import json

llm = al.LLM()
mem = al.ConversationMemory(system_prompt='당신은 비서입니다.')
mem.add_user('내 이름은 영준이야.')
mem.add_assistant('반가워요, 영준 님!')

# TODO ① mem.history 를 chat_log.json 에 저장

# TODO ② 새 메모리 mem2 를 만들고 파일에서 읽어 복원
mem2 = al.ConversationMemory(system_prompt='당신은 비서입니다.')

# TODO ③ '내 이름이 뭐지?' 를 mem2 로 물어보기
`,
            solution: `import agentlab as al
import json

llm = al.LLM()
mem = al.ConversationMemory(system_prompt='당신은 비서입니다.')
mem.add_user('내 이름은 영준이야.')
mem.add_assistant('반가워요, 영준 님!')

with open('chat_log.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(mem.history, ensure_ascii=False))
print('저장:', len(mem.history), '개 메시지')

mem2 = al.ConversationMemory(system_prompt='당신은 비서입니다.')
with open('chat_log.json', encoding='utf-8') as f:
    for m in json.load(f):
        mem2.add(m)
print('복원:', len(mem2), '개 메시지')

mem2.add_user('내 이름이 뭐지?')
print(llm.chat(mem2.messages()).content)
`,
            expect: `저장: 2 개 메시지
복원: 2 개 메시지
[비서] 당신의 이름은 영준 입니다.` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: '기억 장치 ① 단기 기억', subtitle: 'LLM 은 방금 한 말도 기억하지 못한다', notes: '<p>4대 요소 그림에서 ③기억 표시. <b>발문:</b> “챗봇이 내 이름을 기억하는 것처럼 보이는 이유는?” → 앱이 대화를 매번 다시 보내 주기 때문. 오늘 그 장치를 직접 만듭니다.</p><p>⏱ 도입 8분</p>' },
          { layout: 'diagram', title: '호출마다 새 출발', html: FIG_NOMEM, caption: '기억 = 우리가 보내는 메시지 목록',
            notes: '<p>왼쪽 → 오른쪽 순서로. “서버는 아무것도 저장하지 않는다(stateless)”를 강조. 오른쪽 목록의 굵은 마지막 줄이 이번 질문이고 그 위가 전부 “기억”.</p>' },
          { layout: 'code', title: '실험: 따로 부르면 잊는다', code: `import agentlab as al

llm = al.LLM()
llm.ask('내 이름은 영준이야. 기억해 줘!')     # 1번째 호출
print(llm.ask('내 이름이 뭐지?'))             # 2번째 호출 → ?
print('호출 횟수:', llm.calls)`, points: ['<code>ask()</code> 는 매번 새 메시지 목록', '두 호출은 서로를 모른다', '실제 모델도 똑같이 모른다'],
            notes: '<p>▶ 실행. “모델이 바보라서가 아니라 보낸 메시지에 이름이 없어서”라는 점을 반복해서 말합니다.</p>' },
          { layout: 'code', title: '메시지 목록을 쌓아 가며', code: `import agentlab as al

llm = al.LLM()
messages = [al.system('당신은 친절한 비서입니다.'),
            al.user('내 이름은 영준이야.'),
            al.assistant('반가워요, 영준 님! 기억할게요.')]   # 어제의 대화

for q in ['나는 커피를 좋아해.', '내 이름이 뭐지?']:
    messages.append(al.user(q))        # ① 질문 추가
    r = llm.chat(messages)             # ② 전체를 보냄
    messages.append(r.message())       # ③ 답도 추가
    print('🤖', r.content, '| 입력 토큰:', r.usage.prompt_tokens)
print(len(messages), '개 메시지')`, points: ['①②③ 이 단기 기억의 전부', '답(assistant)도 기록해야 함', '입력 토큰이 호출마다 늘어남'],
            notes: '<p>▶ 실행. ③ 을 주석 처리하고 다시 실행해 “답을 기록하지 않으면 어떻게 되나”를 보여 줘도 좋습니다(모의 LLM 은 user 메시지만 보므로 결과는 같지만 실제 모델은 혼란스러워함).</p>' },
          { layout: 'diagram', title: '창(window)과 토큰 예산', html: FIG_WINDOW, caption: '최근 N개만 보낸다 — 창 밖은 잊힌다',
            notes: '<p><b>발문:</b> “왜 다 보내지 않나?” → 컨텍스트 창 한도 + 매 호출마다 전부 다시 보내므로 비용. 아래 막대로 system + 기록 + 질문 + 답의 합이 한도 안이어야 함을 설명.</p>' },
          { layout: 'code', title: '창을 2 로 줄이면 이름을 잊는다', code: `import agentlab as al

llm = al.LLM()
for window in [None, 2]:
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    mem.add_user('내 이름은 영준이야.')
    mem.add_assistant('반가워요, 영준 님!')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content
        mem.add_assistant(answer)
    print(f'window={window}: {answer}')
    print('   보낸 메시지:', len(mem.messages()) - 1, '/ 기록:', len(mem))`, points: ['<code>messages()</code> 가 창을 적용', '기록(history)은 전부 남아 있음', 'window 를 바꿔 실험 (실습 5-1)'],
            notes: '<p>▶ 실행. window=2 에서 “죄송합니다” 가 나오는 순간이 이 교시의 핵심 장면입니다. 학생에게 window 를 8 로 바꿔 보게 합니다.</p>' },
          { layout: 'code', title: '입력 토큰은 얼마나 늘어날까?', code: `import agentlab as al

llm = al.LLM()
for window in [None, 4]:
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    tokens = []
    for i in range(1, 7):
        mem.add_user(f'{i}번째 질문: 오늘 할 일 알려줘')
        r = llm.chat(mem.messages())
        mem.add_assistant(r.content)
        tokens.append(r.usage.prompt_tokens)
    print(f'window={window}: {tokens} 합계 {sum(tokens)}')`, points: ['창 없음: 선형 증가', '창 있음: 일정 수준에서 멈춤', '100번 대화하면 수십 배 차이'],
            notes: '<p>▶ 실행. 칠판에 두 수열을 그래프로 그려 “선형 vs 상수”를 보여 줍니다. 비용 = 입력 토큰 × 단가.</p>' },
          { layout: 'diagram', title: '요약 기억', html: FIG_SUMMARY, caption: '오래된 대화는 요약해서 system 에, 최근 대화는 원문으로',
            notes: '<p>“창 밖으로 밀려난 것을 버리지 말고 요약하자”. 손실 압축이라는 한계를 반드시 언급 → 2교시 장기 기억의 동기.</p>' },
          { layout: 'code', title: 'SummaryMemory', code: `import agentlab as al

llm = al.LLM()
summarizer = al.LLM(mock_responses=['사용자 이름은 영준이고 커피를 좋아한다.'])
mem = al.SummaryMemory(summarizer, window=2, system_prompt='당신은 비서입니다.')
mem.add_user('내 이름은 영준이야.')
mem.add_assistant('반가워요, 영준 님!')
for q in ['나는 커피를 좋아해.', '내일 회의는 3시야.', '오늘 저녁 뭐 먹지?']:
    mem.add_user(q)
    mem.add_assistant(llm.chat(mem.messages()).content)
    print(q, '| 원문 기록', len(mem), '개')
print('요약:', mem.summary)
mem.show()`, points: ['기록이 2N 개를 넘으면 요약', '요약은 system 끝에 붙음', '키가 있으면 실제 모델이 요약'],
            notes: '<p>▶ 실행. <code>summarizer</code> 를 따로 둔 이유(키 없을 때 대본)를 설명. 실제 키로 돌리면 요약문이 달라짐을 예고.</p>' },
          { layout: 'diagram', title: '메모리 계층', html: FIG_LAYERS, caption: '컨텍스트 창 · 단기 · 장기 · 외부',
            notes: '<p>사람에 비유: 지금 머릿속(작업 기억) / 오늘 들은 것(단기) / 오래 아는 사실(장기) / 노트와 메모(외부). 2교시는 ③ 장기 기억.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>history 와 messages() 의 차이를 다시 짚습니다.</p>' },
          { layout: 'practice', title: '실습 5-1. 창 크기 실험', desc: '<p>window 를 2, 4, 6, 8 로 바꿔 몇 개부터 이름을 기억하는지 출력하세요.</p>',
            starter: `import agentlab as al

llm = al.LLM()
def last_answer(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    mem.add_user('내 이름은 영준이야.'); mem.add_assistant('반가워요, 영준 님!')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content
        mem.add_assistant(answer)
    return answer
# TODO: window 2, 4, 6, 8 → '영준' in last_answer(window) 출력`, solution: `import agentlab as al

llm = al.LLM()
def last_answer(window):
    mem = al.ConversationMemory(window=window, system_prompt='당신은 비서입니다.')
    mem.add_user('내 이름은 영준이야.'); mem.add_assistant('반가워요, 영준 님!')
    for q in ['나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']:
        mem.add_user(q)
        answer = llm.chat(mem.messages()).content
        mem.add_assistant(answer)
    return answer
for window in [2, 4, 6, 8]:
    print(window, '영준' in last_answer(window))`, notes: '<p>⏱ 8분. 정답: 8부터 기억. “왜 7개가 필요한가?”를 메시지 개수를 세어 설명하게 합니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['LLM 호출은 <b>상태가 없다</b> — 기억은 우리가 보내는 메시지 목록', '단기 기억 = 대화 기록 누적 (<code>r.message()</code> 도 기록!)', '<code>window</code> 로 창 제한 → 토큰 절약, 대신 창 밖은 잊음', '<code>SummaryMemory</code> = 오래된 대화 요약 (손실 압축)', '다음 교시: 장기 기억 — 임베딩으로 저장하고 의미로 검색'], notes: '<p>⏱ 8분. 출구 질문: “창을 2 로 했을 때 이름을 잊은 이유를 한 문장으로.”</p>' }
        ]
      },
      {
        id: 'ag05-2',
        title: '장기 기억: 임베딩과 벡터 저장소',
        minutes: 50,
        goals: ['임베딩과 코사인 유사도로 문장의 비슷함을 잰다', 'VectorStore 에 사실을 저장 · 검색 · 필터한다', '검색된 기억을 프롬프트에 넣는 미니 RAG 와 자동 저장 도구를 구현한다'],
        flow: [['임베딩과 코사인 유사도', 12], ['VectorStore 검색', 10], ['미니 RAG', 12], ['메타데이터 · 자동 저장 도구', 10], ['실습 · 정리', 6]],
        content: [
          { type: 'p', html: '단기 기억은 “최근 대화”를 통째로 보냅니다. 하지만 한 달 전에 말한 “나는 커피를 좋아해”를 오늘 꺼내 쓰려면 다른 장치가 필요합니다. 사실을 <b>저장해 두고, 지금 질문과 관련된 것만 골라 꺼내는</b> 장기 기억입니다. 문제는 “관련된 것”을 어떻게 찾느냐입니다 — 글자가 아니라 <b>의미</b>로 찾아야 합니다. 그 열쇠가 <b>임베딩</b>입니다.' },
          { type: 'h', text: '임베딩: 문장을 숫자 벡터로' },
          { type: 'p', html: '<b>임베딩(embedding)</b>은 텍스트를 고정 길이의 숫자 목록(벡터)으로 바꾸는 것입니다. 비슷한 의미의 문장은 비슷한 벡터가 되도록 만들어져 있어, 두 벡터 사이의 각도로 “비슷함”을 잴 수 있습니다. 이 각도의 cos 값이 <b>코사인 유사도</b>입니다: 1 이면 같은 방향, 0 이면 무관.' },
          { type: 'figure', html: FIG_EMBED, caption: '그림 5-5. 문장 → 벡터 → 각도. “커피”가 겹치는 두 문장은 가깝고, 회의 문장은 멀리 있습니다.' },
          { type: 'code', title: '예제 5-7. al.embed 와 al.cosine 으로 유사도 재기', code: `import agentlab as al

v = al.embed('사용자는 커피를 좋아한다')
print('벡터 길이:', len(v), '| 길이(norm):', round(sum(x * x for x in v) ** 0.5, 3), '| 0 이 아닌 칸:', sum(1 for x in v if x != 0))

base = '사용자는 커피를 좋아한다'
for other in ['커피 추천해줘', '커피를 좋아하는 사용자', '내일 회의는 3시야', '사용자는 커피를 좋아한다']:
    score = al.cosine(al.embed(base), al.embed(other))
    print(f'{score:.3f} | {base} ↔ {other}')`,
            expect: `벡터 길이: 256 | 길이(norm): 1.0 | 0 이 아닌 칸: 25
0.098 | 사용자는 커피를 좋아한다 ↔ 커피 추천해줘
0.593 | 사용자는 커피를 좋아한다 ↔ 커피를 좋아하는 사용자
0.037 | 사용자는 커피를 좋아한다 ↔ 내일 회의는 3시야
1.000 | 사용자는 커피를 좋아한다 ↔ 사용자는 커피를 좋아한다`,
            desc: '“커피”가 들어간 문장은 점수가 높고, 회의 문장은 거의 0, 같은 문장은 1 입니다. 브라우저의 <code>al.embed</code> 는 오프라인에서도 동작하는 <b>해시 n-gram 임베딩</b>(256차원)이라 “글자 조각이 겹치는 정도”를 잽니다. 점수 자체는 작아도 <b>순서</b>는 의미 있게 나옵니다.' },
          { type: 'callout', kind: 'info', title: '해시 임베딩 vs 실제 임베딩 모델', html: '수업용 해시 임베딩은 글자 조각(2~3글자 n-gram)을 해시해 만든 벡터라 “커피”와 “아메리카노”처럼 <b>글자가 전혀 다른 동의어는 닮았다고 보지 못합니다</b>. 실제 임베딩 모델(Gemini <code>text-embedding-004</code>, OpenAI <code>text-embedding-3-small</code>, 768~1536차원)은 방대한 텍스트로 학습해 <b>의미</b>가 비슷하면 벡터도 비슷합니다. 🔑 키가 있으면 <code>al.Embedder(llm)</code> 이 실제 API 를 쓰고, Colab 노트북 05 에서 직접 비교합니다.' },
          { type: 'h', text: 'VectorStore: 저장 · 검색 · 프롬프트용 문자열' },
          { type: 'p', html: '<code>al.VectorStore</code> 는 텍스트를 임베딩과 함께 저장해 두고, 질문의 임베딩과 가장 가까운 것부터 돌려주는 <b>인메모리 벡터 저장소</b>입니다. <code>add(text, meta)</code> 로 넣고 <code>search(query, k)</code> 로 찾고 <code>context(query)</code> 로 프롬프트에 넣기 좋은 문자열을 얻습니다.' },
          { type: 'code', title: '예제 5-8. 사용자에 대한 사실을 저장하고 의미로 검색하기', code: `import agentlab as al

store = al.VectorStore()
facts = [('사용자의 이름은 영준이다', 'profile'),
         ('사용자는 커피를 좋아한다', 'preference'),
         ('사용자는 매운 음식을 못 먹는다', 'preference'),
         ('다음 회의는 금요일 3시다', 'schedule'),
         ('사용자는 파이썬을 배우고 있다', 'profile')]
for text, kind in facts:
    store.add(text, meta={'kind': kind})
print(store)

print('--- "커피 추천해줘" 와 가까운 기억 ---')
for score, text, meta in store.search('커피 추천해줘', k=3):
    print(f'{score:.4f} | {text} | {meta}')

print('--- context(): 프롬프트에 넣을 문자열 ---')
print(store.context('회의 언제야?', k=2))`,
            expect: `VectorStore(5 items, hash)
--- "커피 추천해줘" 와 가까운 기억 ---
0.0976 | 사용자는 커피를 좋아한다 | {'kind': 'preference'}
0.0000 | 사용자의 이름은 영준이다 | {'kind': 'profile'}
0.0000 | 사용자는 매운 음식을 못 먹는다 | {'kind': 'preference'}
--- context(): 프롬프트에 넣을 문자열 ---
- 다음 회의는 금요일 3시다
- 사용자는 매운 음식을 못 먹는다`,
            desc: '“커피 추천해줘”에는 “커피를 좋아한다”가, “회의 언제야?”에는 “금요일 3시 회의”가 1순위로 나옵니다. 글자 검색(<code>in</code>)이 아니라 <b>벡터 거리</b>로 찾는다는 점이 핵심입니다. 실제 임베딩이면 “뭐 마실까?”처럼 단어가 겹치지 않는 질문에도 커피 기억을 찾아냅니다.' },
          { type: 'h', text: '미니 RAG: 검색한 기억을 프롬프트에 넣어 답하기' },
          { type: 'p', html: '장기 기억을 쓰는 방법은 단순합니다. ① 질문으로 저장소를 검색해 ② 상위 k개를 ③ 시스템 프롬프트에 <code>[기억]</code> 으로 붙이고 ④ LLM 에 보냅니다. 저장소에 사용자 기억 대신 <b>문서 조각</b>을 넣으면 그것이 바로 <b>RAG(검색 증강 생성)</b> 입니다.' },
          { type: 'figure', html: FIG_RAG, caption: '그림 5-6. 미니 RAG. ①~④ 가 회상, ⑤ 가 저장. studyRAG 강좌는 이 저장소에 문서를 넣는 쪽을 깊게 다룹니다.' },
          { type: 'code', title: '예제 5-9. 기억을 참고해 답하는 비서', code: `import agentlab as al

store = al.VectorStore()
for text in ['사용자의 이름은 영준이다', '사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다']:
    store.add(text)

# 키가 없을 때 모의 LLM 이 돌려줄 답 (실제 키가 있으면 모델이 [기억] 을 읽고 스스로 답합니다)
llm = al.LLM(mock_responses=['영준 님, 커피를 좋아하신다고 하셨으니 따뜻한 라떼는 어떠세요?'])

def answer_with_memory(question, k=2):
    memory = store.context(question, k=k)                     # ①② 검색
    system = '당신은 비서입니다. 아래 [기억] 을 참고해 사용자에게 맞춤 답을 합니다.\\n[기억]\\n' + memory   # ③ 조립
    print('--- LLM 에 보낸 system ---')
    print(system)
    return llm.ask(question, system_prompt=system)            # ④ 답

print('🤖', answer_with_memory('뭐 마실까?'))`,
            expect: `--- LLM 에 보낸 system ---
당신은 비서입니다. 아래 [기억] 을 참고해 사용자에게 맞춤 답을 합니다.
[기억]
- 사용자는 커피를 좋아한다
- 다음 회의는 금요일 3시다
🤖 영준 님, 커피를 좋아하신다고 하셨으니 따뜻한 라떼는 어떠세요?`,
            desc: '검색 → 프롬프트 조립 → 호출, 세 줄이 미니 RAG 의 전부입니다. 모의 LLM 은 시스템 프롬프트의 [기억] 을 읽지 못하므로 <code>mock_responses</code> 로 답을 정해 두었습니다. 🔑 키를 넣고 실행하면 실제 모델이 [기억] 을 보고 “영준 님 … 커피 …”라고 스스로 답하는 것을 볼 수 있습니다.' },
          { type: 'callout', kind: 'more', title: 'studyRAG 강좌로 이어지는 다리', html: '저장소에 “사용자는 커피를 좋아한다” 대신 <b>사내 규정 PDF 를 500자씩 자른 조각</b>을 넣고 같은 코드를 돌리면 “연차는 며칠이야?”에 규정을 인용해 답하는 RAG 챗봇이 됩니다. 문서 자르기(chunking) · 실제 임베딩 모델 · 벡터 DB · 검색 품질 평가는 <b>studyRAG</b> 강좌에서 깊게 다룹니다. 이 차시의 <code>VectorStore</code> 가 그 강좌의 출발점입니다.' },
          { type: 'h', text: '메타데이터 필터: where 로 범위 좁히기' },
          { type: 'p', html: '기억이 수천 개가 되면 유사도만으로는 부족합니다. 저장할 때 붙인 <code>meta</code>(종류 · 날짜 · 사용자 ID) 로 <b>후보를 먼저 거른 뒤</b> 유사도 순으로 고르는 것이 <code>where</code> 필터입니다. <code>min_score</code> 로 너무 먼 결과를 버릴 수도 있습니다.' },
          { type: 'code', title: '예제 5-10. where 필터와 min_score', code: `import agentlab as al

store = al.VectorStore()
store.add('사용자의 이름은 영준이다', meta={'kind': 'profile'})
store.add('사용자는 커피를 좋아한다', meta={'kind': 'preference'})
store.add('사용자는 매운 음식을 못 먹는다', meta={'kind': 'preference'})
store.add('다음 회의는 금요일 3시다', meta={'kind': 'schedule'})

print('필터 없음      :', [t for _, t, _ in store.search('음식', k=2)])
print('preference 만  :', [t for _, t, _ in store.search('음식', k=2, where={'kind': 'preference'})])
print('profile 만     :', [t for _, t, _ in store.search('이름', k=1, where={'kind': 'profile'})])
print('min_score=0.1  :', [(s, t) for s, t, _ in store.search('회의', k=4, min_score=0.1)])`,
            expect: `필터 없음      : ['사용자는 매운 음식을 못 먹는다', '사용자의 이름은 영준이다']
preference 만  : ['사용자는 매운 음식을 못 먹는다', '사용자는 커피를 좋아한다']
profile 만     : ['사용자의 이름은 영준이다']
min_score=0.1  : [(0.1525, '다음 회의는 금요일 3시다')]`,
            desc: '필터 없이 “음식”을 찾으면 유사도 0 인 엉뚱한 항목(이름)이 2순위로 끼지만, <code>where</code> 로 preference 만 보면 두 선호가 모두 나옵니다. <code>min_score</code> 는 “관련 없는 기억을 억지로 끼워 넣지 않기” 위한 안전장치입니다. 실제 벡터 DB 의 metadata filter 가 같은 개념입니다.' },
          { type: 'h', text: '사용자 프로필 자동 저장: 에이전트가 스스로 기억한다' },
          { type: 'p', html: '지금까지는 우리가 <code>store.add()</code> 를 직접 불렀습니다. 진짜 에이전트는 대화 중에 <b>스스로</b> “이건 기억해 둘 사실이다”라고 판단해 저장하고, 필요할 때 검색합니다. 04차시의 도구가 바로 그 수단입니다 — <code>save_memory</code> · <code>search_memory</code> 두 도구를 주면 됩니다.' },
          { type: 'code', title: '예제 5-11. 기억 도구를 가진 비서 — 저장하고, 나중에 회상하기', code: `import agentlab as al

llm = al.LLM()
store = al.VectorStore()

@al.tool
def save_memory(fact: str) -> str:
    """사용자에 대한 사실을 장기 기억에 저장한다

    fact: 저장할 사실 한 문장
    """
    fact = fact.replace('라고 저장해줘', '').replace('저장해줘', '').strip()   # 입력 정리 (04차시 원칙 ②)
    store.add(fact, meta={'kind': 'fact'})
    return f'기억했습니다: {fact} (총 {len(store)}개)'

@al.tool
def search_memory(query: str) -> list:
    """장기 기억에서 질문과 관련된 사실을 검색한다

    query: 검색할 내용
    """
    return [text for _, text, _ in store.search(query, k=1)]

agent = al.Agent(llm, tools=[save_memory, search_memory], system='당신은 비서입니다.', verbose=True)
for q in ['내 이름은 영준이라고 저장해줘', '내가 좋아하는 음료는 커피라고 저장해줘',
          '내 이름이 뭐야?', '내가 좋아하는 음료가 뭐야?']:
    agent.reset()                       # 단기 기억은 비우고 → 장기 기억만으로 답하게
    print('👤', q)
    print('🤖', agent.run(q))
print('장기 기억:', [it['text'] for it in store.items])`,
            expect: `👤 내 이름은 영준이라고 저장해줘
🔧 도구 호출 1: save_memory({"fact": "내 이름은 영준이라고 저장해줘"})
👁 관찰: 기억했습니다: 내 이름은 영준이 (총 1개)
✅ 최종 답: [비서] 기억했습니다: 내 이름은 영준이 (총 1개)
🤖 [비서] 기억했습니다: 내 이름은 영준이 (총 1개)
👤 내가 좋아하는 음료는 커피라고 저장해줘
🔧 도구 호출 1: save_memory({"fact": "내가 좋아하는 음료는 커피라고 저장해줘"})
👁 관찰: 기억했습니다: 내가 좋아하는 음료는 커피 (총 2개)
✅ 최종 답: [비서] 기억했습니다: 내가 좋아하는 음료는 커피 (총 2개)
🤖 [비서] 기억했습니다: 내가 좋아하는 음료는 커피 (총 2개)
👤 내 이름이 뭐야?
🔧 도구 호출 1: search_memory({"query": "내 이름"})
👁 관찰: ["내 이름은 영준이"]
✅ 최종 답: [비서] 내 이름은 영준이
🤖 [비서] 내 이름은 영준이
👤 내가 좋아하는 음료가 뭐야?
🔧 도구 호출 1: search_memory({"query": "내 좋아하 음료"})
👁 관찰: ["내가 좋아하는 음료는 커피"]
✅ 최종 답: [비서] 내가 좋아하는 음료는 커피
🤖 [비서] 내가 좋아하는 음료는 커피
장기 기억: ['내 이름은 영준이', '내가 좋아하는 음료는 커피']`,
            desc: '매 질문 전에 <code>reset()</code> 으로 단기 기억을 비웠는데도 이름과 음료를 답합니다 — <b>장기 기억(벡터 저장소)에서 도구로 꺼내 왔기</b> 때문입니다. 실제 모델은 “저장해줘”라는 말이 없어도 중요한 사실을 알아서 <code>save_memory</code> 로 저장하도록 시스템 프롬프트에 지시할 수 있습니다. 내장 도구 <code>al.remember_note</code> 는 이 패턴의 단순 버전입니다.' },
          { type: 'callout', kind: 'tip', title: '무엇을 저장할까?', html: '모든 대화를 저장하면 검색이 흐려집니다. 실무에서는 <b>사실(이름 · 소속), 선호(커피 · 매운 것 X), 일정, 결정 사항</b>처럼 “다음 대화에서 다시 쓸 정보”만 한 문장으로 정리해 저장합니다. 저장 시각 · 출처를 <code>meta</code> 에 함께 넣어 두면 “최근 것 우선” 같은 정책을 나중에 적용할 수 있습니다.' },
          { type: 'h', text: '실제 벡터 DB 로 — Chroma · FAISS' },
          { type: 'p', html: '<code>al.VectorStore</code> 는 파이썬 리스트와 for 문으로 유사도를 계산하는 수업용입니다. 기억이 수십만 개가 되면 <b>벡터 DB</b>(Chroma · FAISS · pgvector · Pinecone)가 필요합니다. 사용법은 놀랍도록 같습니다 — add / query / where.' },
          { type: 'code', title: 'Colab 에서 실행 — Chroma 벡터 DB 로 같은 장기 기억 만들기', run: false, code: `# pip install chromadb  (Colab 노트북 05 참고)
import chromadb

client = chromadb.Client()                                   # 메모리 DB (persist 옵션으로 디스크 저장 가능)
memory = client.create_collection('user_memory')             # 기본 임베딩 모델 내장 (all-MiniLM-L6-v2)

memory.add(ids=['m1', 'm2', 'm3'],
           documents=['사용자의 이름은 영준이다', '사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다'],
           metadatas=[{'kind': 'profile'}, {'kind': 'preference'}, {'kind': 'schedule'}])

hits = memory.query(query_texts=['뭐 마실까?'], n_results=2, where={'kind': 'preference'})
print(hits['documents'][0])          # → ['사용자는 커피를 좋아한다']`,
            desc: '<code>add → query → where</code> 가 우리 <code>VectorStore</code> 의 <code>add → search → where</code> 와 일대일로 대응합니다. Chroma 는 실제 임베딩 모델을 내장하므로 “뭐 마실까?”처럼 단어가 겹치지 않아도 커피 기억을 찾습니다.' },
          { type: 'colab', title: 'Colab 실습 05 — 실제 임베딩과 벡터 DB', html: '<p>Colab 노트북에서는 ① Gemini <code>text-embedding-004</code> 로 실제 임베딩을 만들어 해시 임베딩과 유사도를 비교하고, ② <code>chromadb</code> 에 사용자 기억을 저장 · 검색 · 필터하고, ③ 실제 모델이 [기억] 을 읽고 맞춤 답을 하는 미니 RAG, ④ 기억 도구를 가진 에이전트를 실행합니다. 키는 Colab Secrets 의 <code>GEMINI_API_KEY</code> 를 씁니다.</p>' },
          { type: 'callout', kind: 'info', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>해시 임베딩의 점수가 작은(0.1 전후) 것을 보고 학생들이 “고장났다”고 생각할 수 있습니다. “순서가 맞으면 된다”와 “실제 임베딩은 Colab 에서”를 미리 말해 두세요.</li><li>예제 5-9(미니 RAG)는 키가 없으면 대본 답이 나옵니다. 교사 PC 에 키가 있으면 꼭 실제 모델로 시연하세요 — 이 교시에서 가장 인상적인 장면입니다.</li><li>예제 5-11 은 <code>reset()</code> 을 지우고 실행하면 단기 기억만으로도 답하므로, 왜 reset 을 넣었는지 질문하기 좋습니다.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '자주 나오는 오개념', teacher: true, html: '<ul><li><b>“벡터 저장소에 넣으면 모델이 학습한다”</b> → 아닙니다. 모델은 그대로이고, 검색된 텍스트를 프롬프트에 넣어 줄 뿐입니다(RAG ≠ fine-tuning).</li><li><b>“유사도가 높으면 정답이다”</b> → 비슷한 글자/의미일 뿐 사실 여부와 무관합니다. <code>min_score</code> 와 <code>where</code> 로 범위를 좁히고, 최종 판단은 LLM 이 합니다.</li><li><b>“단기 기억이 있으니 장기 기억은 필요 없다”</b> → 단기 기억은 세션이 끝나면 사라지고 토큰을 매번 먹습니다. 장기 기억은 세션을 넘어 남고 필요한 것만 꺼냅니다.</li></ul>' },
          { type: 'table', teacher: true, head: ['평가 항목', '상 (3)', '중 (2)', '하 (1)'], rows: [
            ['유사도 이해', '순위를 예측하고 이유(겹치는 조각)를 설명', '순위만 출력', '실행만'],
            ['VectorStore 활용', 'add · search · where · context 모두 사용', 'add · search', 'add 만'],
            ['기억 도구 에이전트', '저장 · 검색 도구가 모두 동작하고 reset 후에도 회상', '저장만', '도구 미호출']
          ], caption: '실습 5-3 · 5-4 · 5-5 평가 루브릭' }
        ],
        practice: [
          { title: '실습 5-3. 유사도 순위 맞히기', level: 1,
            desc: '<p>질문 “커피 한 잔 어때?” 에 대해 후보 세 문장 <code>\'사용자는 커피를 좋아한다\'</code>, <code>\'다음 회의는 금요일 3시다\'</code>, <code>\'커피는 아침에 마신다\'</code> 의 코사인 유사도를 계산해 <b>높은 순으로 정렬</b>해 출력하세요. 실행 전에 순위를 먼저 예측해 보세요.</p>',
            hint: '<code>sorted(..., key=lambda x: -x[0])</code>. 점수는 <code>round(score, 3)</code> 으로.',
            starter: `import agentlab as al

question = '커피 한 잔 어때?'
candidates = ['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다']
# TODO: (유사도, 문장) 목록을 만들어 높은 순으로 정렬해 출력
`,
            solution: `import agentlab as al

question = '커피 한 잔 어때?'
candidates = ['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다']
q = al.embed(question)
scored = [(round(al.cosine(q, al.embed(c)), 3), c) for c in candidates]
for score, text in sorted(scored, key=lambda x: -x[0]):
    print(score, text)
`,
            expect: `0.113 사용자는 커피를 좋아한다
0.038 커피는 아침에 마신다
-0.061 다음 회의는 금요일 3시다` },
          { title: '실습 5-4. 일정 기억 추가하고 필터로 찾기', level: 2,
            desc: '<p>예제 5-10 의 저장소에 <code>kind: \'schedule\'</code> 인 일정 두 개(“치과 예약은 화요일 10시다”, “프로젝트 마감은 이번 달 말이다”)를 추가하세요. 그런 다음 “마감 언제야?” 로 ① 필터 없이 k=2, ② <code>where={\'kind\': \'schedule\'}</code> 로 k=2 검색해 텍스트만 출력하고, 마지막에 <code>store.context(\'예약\', k=1)</code> 을 출력하세요.</p>',
            hint: '<code>store.add(text, meta={\'kind\': \'schedule\'})</code>. 결과에서 텍스트만: <code>[t for _, t, _ in ...]</code>',
            starter: `import agentlab as al

store = al.VectorStore()
store.add('사용자의 이름은 영준이다', meta={'kind': 'profile'})
store.add('사용자는 커피를 좋아한다', meta={'kind': 'preference'})
store.add('다음 회의는 금요일 3시다', meta={'kind': 'schedule'})
# TODO: 일정 2개 추가

# TODO: '마감 언제야?' 필터 없이 / schedule 만 검색해 텍스트 출력
# TODO: store.context('예약', k=1) 출력
`,
            solution: `import agentlab as al

store = al.VectorStore()
store.add('사용자의 이름은 영준이다', meta={'kind': 'profile'})
store.add('사용자는 커피를 좋아한다', meta={'kind': 'preference'})
store.add('다음 회의는 금요일 3시다', meta={'kind': 'schedule'})
store.add('치과 예약은 화요일 10시다', meta={'kind': 'schedule'})
store.add('프로젝트 마감은 이번 달 말이다', meta={'kind': 'schedule'})

print('필터 없음:', [t for _, t, _ in store.search('마감 언제야?', k=2)])
print('schedule :', [t for _, t, _ in store.search('마감 언제야?', k=2, where={'kind': 'schedule'})])
print(store.context('예약', k=1))
`,
            expect: `필터 없음: ['프로젝트 마감은 이번 달 말이다', '다음 회의는 금요일 3시다']
schedule : ['프로젝트 마감은 이번 달 말이다', '다음 회의는 금요일 3시다']
- 치과 예약은 화요일 10시다` },
          { title: '실습 5-5. 기억 목록 도구 추가하기', level: 3,
            desc: '<p>예제 5-11 의 비서에 세 번째 도구 <code>list_memories()</code>(저장된 기억 전체를 리스트로 돌려줌, 설명문: “저장된 기억 목록 내용을 읽어 보여준다”)를 추가하세요. “내 이름은 영준이라고 저장해줘” → “내 취미는 등산이라고 저장해줘” → “기억 목록 내용을 읽어줘” 를 <code>reset()</code> 을 끼워 차례로 실행하고, 마지막에 <code>len(store)</code> 를 출력하세요.</p>',
            hint: '모의 LLM 은 “읽어 · 내용” 키워드로 설명에 “읽어”가 있는 도구를 고릅니다. 리스트를 돌려주면 “; ” 로 이어 답합니다.',
            starter: `import agentlab as al

llm = al.LLM()
store = al.VectorStore()

@al.tool
def save_memory(fact: str) -> str:
    """사용자에 대한 사실을 장기 기억에 저장한다

    fact: 저장할 사실 한 문장
    """
    fact = fact.replace('라고 저장해줘', '').replace('저장해줘', '').strip()
    store.add(fact, meta={'kind': 'fact'})
    return f'기억했습니다: {fact} (총 {len(store)}개)'

# TODO: list_memories() 도구 — 설명문 "저장된 기억 목록 내용을 읽어 보여준다", [it['text'] for it in store.items] 반환

agent = al.Agent(llm, tools=[save_memory], system='당신은 비서입니다.')   # TODO: list_memories 추가
for q in ['내 이름은 영준이라고 저장해줘', '내 취미는 등산이라고 저장해줘', '기억 목록 내용을 읽어줘']:
    agent.reset()
    print('👤', q)
    print('🤖', agent.run(q))
print('저장된 기억 수:', len(store))
`,
            solution: `import agentlab as al

llm = al.LLM()
store = al.VectorStore()

@al.tool
def save_memory(fact: str) -> str:
    """사용자에 대한 사실을 장기 기억에 저장한다

    fact: 저장할 사실 한 문장
    """
    fact = fact.replace('라고 저장해줘', '').replace('저장해줘', '').strip()
    store.add(fact, meta={'kind': 'fact'})
    return f'기억했습니다: {fact} (총 {len(store)}개)'

@al.tool
def list_memories() -> list:
    """저장된 기억 목록 내용을 읽어 보여준다"""
    return [it['text'] for it in store.items]

agent = al.Agent(llm, tools=[save_memory, list_memories], system='당신은 비서입니다.')
for q in ['내 이름은 영준이라고 저장해줘', '내 취미는 등산이라고 저장해줘', '기억 목록 내용을 읽어줘']:
    agent.reset()
    print('👤', q)
    print('🤖', agent.run(q))
print('저장된 기억 수:', len(store))
`,
            expect: `👤 내 이름은 영준이라고 저장해줘
🤖 [비서] 기억했습니다: 내 이름은 영준이 (총 1개)
👤 내 취미는 등산이라고 저장해줘
🤖 [비서] 기억했습니다: 내 취미는 등산이 (총 2개)
👤 기억 목록 내용을 읽어줘
🤖 [비서] 내 이름은 영준이; 내 취미는 등산이
저장된 기억 수: 2` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '기억 장치 ② 장기 기억', subtitle: '임베딩으로 저장하고 의미로 검색한다', notes: '<p><b>발문:</b> “한 달 전에 말한 ‘커피 좋아해’를 오늘 꺼내 쓰려면?” → 대화 전체를 보낼 수는 없다 → 저장해 두고 관련된 것만 찾아야 한다 → 어떻게 ‘관련’을 찾나? → 임베딩.</p>' },
          { layout: 'diagram', title: '임베딩과 코사인 유사도', html: FIG_EMBED, caption: '문장 → 벡터 → 각도',
            notes: '<p>수식 없이: “비슷한 문장은 비슷한 방향의 화살표”. cos 값: 같은 방향 1, 수직 0. 수업용 해시 임베딩은 글자 조각 기준이라는 점을 미리 말해 둡니다.</p>' },
          { layout: 'code', title: 'embed 와 cosine', code: `import agentlab as al

base = '사용자는 커피를 좋아한다'
print('벡터 길이:', len(al.embed(base)))
for other in ['커피 추천해줘', '커피를 좋아하는 사용자',
              '내일 회의는 3시야', '사용자는 커피를 좋아한다']:
    score = al.cosine(al.embed(base), al.embed(other))
    print(f'{score:.3f} | {other}')`, points: ['문장 → 숫자 256개', '커피 문장끼리 높고, 회의 문장은 ~0', '점수보다 <b>순서</b>가 중요 (해시 임베딩)'],
            notes: '<p>▶ 실행. 학생에게 문장 하나를 더 추가해 점수를 예측하게 합니다. “아메리카노 좋아”는 왜 낮게 나올까? → 글자가 안 겹쳐서 → 실제 임베딩의 필요성.</p>' },
          { layout: 'code', title: 'VectorStore: add · search · context', code: `import agentlab as al

store = al.VectorStore()
for text, kind in [('사용자의 이름은 영준이다', 'profile'),
                   ('사용자는 커피를 좋아한다', 'preference'),
                   ('사용자는 매운 음식을 못 먹는다', 'preference'),
                   ('다음 회의는 금요일 3시다', 'schedule')]:
    store.add(text, meta={'kind': kind})
print(store)
for score, text, meta in store.search('커피 추천해줘', k=2):
    print(f'{score:.3f} | {text} | {meta}')
print(store.context('회의 언제야?', k=1))`, points: ['<code>add(text, meta)</code>', '<code>search(query, k)</code> → (점수, 텍스트, meta)', '<code>context()</code> → 프롬프트용 문자열'],
            notes: '<p>▶ 실행. 글자 검색(<code>\'커피\' in text</code>)과 무엇이 다른지 묻습니다 → 글자가 아니라 벡터 거리.</p>' },
          { layout: 'diagram', title: '미니 RAG', html: FIG_RAG, caption: '검색 → 프롬프트 조립 → 답 / 새 사실은 저장',
            notes: '<p>①~④ 를 따라가며 “LLM 은 프롬프트에 있는 것만 본다”를 상기. 문서 조각을 넣으면 RAG — studyRAG 강좌 예고.</p>' },
          { layout: 'code', title: '기억을 참고해 답하는 비서', code: `import agentlab as al

store = al.VectorStore()
for t in ['사용자의 이름은 영준이다', '사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다']:
    store.add(t)
llm = al.LLM(mock_responses=['영준 님, 커피를 좋아하시니 따뜻한 라떼는 어떠세요?'])

def answer_with_memory(question):
    memory = store.context(question, k=2)                      # 검색
    system = '당신은 비서입니다. [기억] 을 참고해 답합니다.\\n[기억]\\n' + memory   # 조립
    print(system)
    return llm.ask(question, system_prompt=system)             # 호출

print('🤖', answer_with_memory('뭐 마실까?'))`, points: ['검색 → 조립 → 호출 세 줄', '모의 LLM 은 대본 답, 🔑 실제 모델은 [기억] 을 읽고 답', '문서를 넣으면 = RAG'],
            notes: '<p>▶ 실행. 키가 있으면 <code>mock_responses</code> 가 무시되고 실제 답이 나옵니다 — 이 교시 최고의 시연 장면. [기억] 에 다른 사실을 넣어 답이 바뀌는지 확인.</p>' },
          { layout: 'code', title: 'where 필터', code: `import agentlab as al

store = al.VectorStore()
store.add('사용자의 이름은 영준이다', meta={'kind': 'profile'})
store.add('사용자는 커피를 좋아한다', meta={'kind': 'preference'})
store.add('사용자는 매운 음식을 못 먹는다', meta={'kind': 'preference'})
store.add('다음 회의는 금요일 3시다', meta={'kind': 'schedule'})

print([t for _, t, _ in store.search('음식', k=2)])
print([t for _, t, _ in store.search('음식', k=2, where={'kind': 'preference'})])
print(store.search('회의', k=4, min_score=0.1))`, points: ['meta 로 후보를 먼저 거른다', '<code>min_score</code> 로 먼 결과 제거', '실제 벡터 DB 의 metadata filter'],
            notes: '<p>▶ 실행. 필터 없는 결과에 유사도 0 인 항목이 끼는 것을 지적 — “k개를 채우려고 억지로 넣는다”.</p>' },
          { layout: 'code', title: '기억 도구를 가진 비서', code: `import agentlab as al

llm = al.LLM()
store = al.VectorStore()

@al.tool
def save_memory(fact: str) -> str:
    """사용자에 대한 사실을 장기 기억에 저장한다"""
    fact = fact.replace('라고 저장해줘', '').strip()
    store.add(fact)
    return f'기억했습니다: {fact}'

@al.tool
def search_memory(query: str) -> list:
    """장기 기억에서 질문과 관련된 사실을 검색한다"""
    return [t for _, t, _ in store.search(query, k=1)]

agent = al.Agent(llm, tools=[save_memory, search_memory], system='당신은 비서입니다.')
for q in ['내 이름은 영준이라고 저장해줘', '내 이름이 뭐야?']:
    agent.reset()
    print('👤', q, '→ 🤖', agent.run(q))`, points: ['저장도 검색도 <b>도구</b>', '<code>reset()</code> 후에도 회상 = 장기 기억', '실제 모델은 알아서 저장하도록 지시 가능'],
            notes: '<p>▶ 실행. <code>reset()</code> 을 지우면 단기 기억만으로도 답하므로, “그럼 장기 기억은 왜?” → 세션을 넘어 남고 토큰을 아낀다.</p>' },
          { layout: 'two', title: 'VectorStore vs Chroma', left: { title: 'agentlab (브라우저)', bullets: ['<code>store.add(text, meta)</code>', '<code>store.search(q, k, where)</code>', '해시 임베딩 · 리스트 순회', '수업 · 원리 학습용'] }, right: { title: 'Chroma (Colab)', bullets: ['<code>col.add(ids, documents, metadatas)</code>', '<code>col.query(query_texts, n_results, where)</code>', '실제 임베딩 모델 · 인덱스', '수십만 건 · 디스크 저장'] },
            notes: '<p>이름만 다르고 개념이 같다는 것을 대응. Colab 노트북 05 에서 Chroma 를 실행합니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[3].q, options: QUIZ2[3].options, answer: QUIZ2[3].answer, explain: QUIZ2[3].explain, notes: '<p>“RAG 는 학습이 아니다” 오개념을 여기서 바로잡습니다.</p>' },
          { layout: 'practice', title: '실습 5-3. 유사도 순위 맞히기', desc: '<p>“커피 한 잔 어때?” 와 세 후보 문장의 유사도를 계산해 높은 순으로 출력하세요. 먼저 순위를 예측!</p>',
            starter: `import agentlab as al

question = '커피 한 잔 어때?'
candidates = ['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다']
# TODO: 유사도 계산 → 높은 순 정렬 → 출력`, solution: `import agentlab as al

question = '커피 한 잔 어때?'
candidates = ['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다']
q = al.embed(question)
scored = [(round(al.cosine(q, al.embed(c)), 3), c) for c in candidates]
for score, text in sorted(scored, key=lambda x: -x[0]):
    print(score, text)`, notes: '<p>⏱ 6분. 정답 순서: 커피를 좋아한다(0.113) → 커피는 아침에 마신다(0.038) → 회의(-0.061, 음수도 가능). 1위인 이유(“커피” + “한다/어때” 조각 겹침)를 설명하게 합니다. 빨리 끝나면 실습 5-4 · 5-5.</p>' },
          { layout: 'summary', title: '정리', bullets: ['임베딩 = 문장 → 벡터, 코사인 유사도 = 각도로 잰 비슷함', '<code>VectorStore</code>: add · search(k, where, min_score) · context', '미니 RAG: 검색 → <code>[기억]</code> 조립 → 호출 (문서를 넣으면 RAG)', '기억 도구(save · search)로 에이전트가 스스로 저장 · 회상', '다음 차시: 계획과 반성 — ReAct · Plan-and-Execute · Self-Correction'], notes: '<p>⏱ 6분. 과제: Colab 05 (실제 임베딩 + Chroma). 다음 차시 예고: “도구와 기억이 있어도 순서를 못 정하면 헤맨다 → 계획”.</p>' }
        ]
      }
    ]
  });
})();
