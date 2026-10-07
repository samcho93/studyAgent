/* 15차시 Agent Skills: SKILL.md 로 에이전트에 전문 능력 더하기 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 거대 시스템 프롬프트 vs 스킬 목록 */
  const FIG_BLOAT = `<svg viewBox="0 0 700 300" role="img" aria-label="모든 규칙을 한 시스템 프롬프트에 넣는 방식과 스킬 목록만 두고 필요한 스킬을 그때 읽는 방식을 비교한 그림">
  ${ARROW('m15a1')}
  <rect x="15" y="15" width="320" height="270" rx="14" class="p4s"/>
  <text x="175" y="45" text-anchor="middle" class="tx-b">😵 방법 A: 전부 시스템 프롬프트에</text>
  <rect x="35" y="60" width="280" height="30" rx="6" class="card-bg"/><text x="45" y="80" class="tx-m">보고서 작성 규칙 12줄 …</text>
  <rect x="35" y="96" width="280" height="30" rx="6" class="card-bg"/><text x="45" y="116" class="tx-m">데이터 정리 규칙 9줄 + 계산 도구 …</text>
  <rect x="35" y="132" width="280" height="30" rx="6" class="card-bg"/><text x="45" y="152" class="tx-m">회의록 형식 8줄 …</text>
  <rect x="35" y="168" width="280" height="30" rx="6" class="card-bg"/><text x="45" y="188" class="tx-m">번역 · 코드 리뷰 · 메일 작성 규칙 …</text>
  <text x="175" y="228" text-anchor="middle" class="tx-m">매 호출마다 수천 토큰 · 규칙끼리 충돌</text>
  <text x="175" y="250" text-anchor="middle" class="tx-m">다른 프로젝트에 가져가기 어려움</text>
  <text x="175" y="272" text-anchor="middle" class="tx-m">“날씨 어때?” 한 줄에도 전부 실림</text>
  <rect x="365" y="15" width="320" height="270" rx="14" class="p2s"/>
  <text x="525" y="45" text-anchor="middle" class="tx-b">😀 방법 B: 스킬 목록 + 필요할 때 읽기</text>
  <rect x="385" y="60" width="280" height="22" rx="6" class="card-bg"/><text x="395" y="76" class="tx-m">- report-writer: 보고서 작성 요청에 사용</text>
  <rect x="385" y="86" width="280" height="22" rx="6" class="card-bg"/><text x="395" y="102" class="tx-m">- data-cleaner: 숫자 정리 · 합계 계산에 사용</text>
  <rect x="385" y="112" width="280" height="22" rx="6" class="card-bg"/><text x="395" y="128" class="tx-m">- meeting-notes: 회의록 정리에 사용</text>
  <rect x="385" y="160" width="280" height="60" rx="8" class="p1s"/>
  <text x="525" y="183" text-anchor="middle" class="tx-b">선택된 스킬의 지시문 · 도구만 활성화</text>
  <text x="525" y="205" text-anchor="middle" class="tx-m">(작업과 관련 없는 규칙은 읽지 않음)</text>
  <line x1="525" y1="138" x2="525" y2="156" class="ln" stroke-width="2" marker-end="url(#m15a1)"/>
  <text x="525" y="250" text-anchor="middle" class="tx-m">목록은 짧고(스킬당 ~100토큰) · 폴더째 공유</text>
  <text x="525" y="272" text-anchor="middle" class="tx-m">Claude Code · API · 빌더 어디서나 같은 형식</text>
</svg>`;

  /* 스킬 폴더 해부도 */
  const FIG_FOLDER = `<svg viewBox="0 0 700 320" role="img" aria-label="스킬 폴더의 구조: SKILL.md 의 frontmatter 와 본문, references 폴더, scripts 폴더">
  ${ARROW('m15a2')}
  <rect x="15" y="15" width="300" height="290" rx="14" class="card-bg"/>
  <text x="30" y="42" class="tx-b">📁 report-writer/</text>
  <text x="50" y="68" class="tx">📄 SKILL.md</text>
  <text x="70" y="90" class="tx-m">(필수 · 이 한 장이 스킬의 얼굴)</text>
  <text x="50" y="122" class="tx">📁 references/</text>
  <text x="70" y="144" class="tx-m">tone.md · template.md …</text>
  <text x="70" y="162" class="tx-m">참고 자료 — 필요할 때만 읽음</text>
  <text x="50" y="194" class="tx">📁 scripts/</text>
  <text x="70" y="216" class="tx-m">make_table.py · validate.py …</text>
  <text x="70" y="234" class="tx-m">실행 스크립트 — 결과만 컨텍스트로</text>
  <text x="50" y="266" class="tx">📄 FORMS.md · 기타 파일</text>
  <text x="70" y="288" class="tx-m">본문에서 링크해 두면 그때 읽음</text>
  <rect x="360" y="15" width="325" height="290" rx="14" class="card-bg"/>
  <text x="522" y="42" text-anchor="middle" class="tx-b">SKILL.md 의 두 부분</text>
  <rect x="380" y="55" width="285" height="98" rx="10" class="p1s"/>
  <text x="392" y="76" class="tx-b">① frontmatter (YAML)</text>
  <text x="392" y="98" class="tx-m">---</text>
  <text x="392" y="116" class="tx-m">name: report-writer</text>
  <text x="392" y="134" class="tx-m">description: 보고서 … 요청에 사용한다</text>
  <text x="392" y="150" class="tx-m">---</text>
  <rect x="380" y="165" width="285" height="128" rx="10" class="p3s"/>
  <text x="392" y="186" class="tx-b">② 본문 (Markdown 지시문)</text>
  <text x="392" y="208" class="tx-m"># 보고서 작성</text>
  <text x="392" y="226" class="tx-m">1. 제목 · 요약 · 본문 · 다음 행동 순서</text>
  <text x="392" y="244" class="tx-m">2. 숫자는 표로, 출처를 적는다</text>
  <text x="392" y="262" class="tx-m">3. 톤은 references/tone.md 참고</text>
  <text x="392" y="284" class="tx-m">(절차 · 형식 · 주의점 · 예시)</text>
  <line x1="150" y1="72" x2="376" y2="72" class="ln" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#m15a2)"/>
</svg>`;

  /* 점진적 로딩 3단계 */
  const FIG_STAGES = `<svg viewBox="0 0 700 330" role="img" aria-label="점진적 로딩: 1단계 이름과 설명 목록, 2단계 선택된 스킬의 지시문과 도구, 3단계 참고 자료와 스크립트">
  ${ARROW('m15a3')}
  <rect x="15" y="20" width="205" height="250" rx="14" class="p1s"/>
  <text x="117" y="48" text-anchor="middle" class="tx-b">1단계 · 목록</text>
  <text x="117" y="68" text-anchor="middle" class="tx-m">항상 로딩 (시작 시)</text>
  <rect x="30" y="82" width="175" height="22" rx="5" class="card-bg"/><text x="38" y="97" class="tx-m">report-writer: 보고서 …</text>
  <rect x="30" y="108" width="175" height="22" rx="5" class="card-bg"/><text x="38" y="123" class="tx-m">data-cleaner: 숫자 정리 …</text>
  <rect x="30" y="134" width="175" height="22" rx="5" class="card-bg"/><text x="38" y="149" class="tx-m">meeting-notes: 회의록 …</text>
  <text x="117" y="190" text-anchor="middle" class="tx-m">name + description 만</text>
  <text x="117" y="210" text-anchor="middle" class="tx-m">스킬당 ~100 토큰</text>
  <text x="117" y="245" text-anchor="middle" class="tx-b">“어떤 스킬이 있나?”</text>
  <rect x="248" y="20" width="205" height="250" rx="14" class="p3s"/>
  <text x="350" y="48" text-anchor="middle" class="tx-b">2단계 · 지시문</text>
  <text x="350" y="68" text-anchor="middle" class="tx-m">작업과 맞을 때 로딩</text>
  <rect x="263" y="82" width="175" height="100" rx="8" class="card-bg"/>
  <text x="271" y="100" class="tx-m">## 스킬 활성화: report-writer</text>
  <text x="271" y="118" class="tx-m"># 보고서 작성</text>
  <text x="271" y="136" class="tx-m">1. 제목 · 요약 · 본문 …</text>
  <text x="271" y="154" class="tx-m">2. 숫자는 표로 …</text>
  <text x="271" y="172" class="tx-m">+ 도구: calculator 활성</text>
  <text x="350" y="210" text-anchor="middle" class="tx-m">SKILL.md 본문 (5천 토큰 이하 권장)</text>
  <text x="350" y="245" text-anchor="middle" class="tx-b">“어떻게 하나?”</text>
  <rect x="481" y="20" width="205" height="250" rx="14" class="p5s"/>
  <text x="583" y="48" text-anchor="middle" class="tx-b">3단계 · 자료 · 스크립트</text>
  <text x="583" y="68" text-anchor="middle" class="tx-m">지시문이 가리킬 때만</text>
  <rect x="496" y="82" width="175" height="40" rx="8" class="card-bg"/>
  <text x="504" y="100" class="tx-m">references/tone.md</text><text x="504" y="116" class="tx-m">→ 읽으면 컨텍스트에</text>
  <rect x="496" y="130" width="175" height="40" rx="8" class="card-bg"/>
  <text x="504" y="148" class="tx-m">scripts/make_table.py</text><text x="504" y="164" class="tx-m">→ 실행 결과만 컨텍스트에</text>
  <text x="583" y="210" text-anchor="middle" class="tx-m">읽기 전까지 0 토큰</text>
  <text x="583" y="245" text-anchor="middle" class="tx-b">“세부 자료 · 도구”</text>
  <line x1="222" y1="145" x2="244" y2="145" class="ln" stroke-width="2" marker-end="url(#m15a3)"/>
  <line x1="455" y1="145" x2="477" y2="145" class="ln" stroke-width="2" marker-end="url(#m15a3)"/>
  <text x="350" y="300" text-anchor="middle" class="tx-m">작업: “매출 보고서 써줘” → 1단계 목록에서 report-writer 선택 → 2단계 지시문 활성화 → 필요하면 3단계</text>
  <text x="350" y="320" text-anchor="middle" class="tx-m">관련 없는 스킬(meeting-notes)의 지시문은 끝까지 읽지 않습니다 = 컨텍스트 절약</text>
</svg>`;

  /* 좋은 description vs 나쁜 description */
  const FIG_DESC = `<svg viewBox="0 0 700 270" role="img" aria-label="무엇을 하는지만 적은 나쁜 설명과 무엇을 언제 하는지 적은 좋은 설명을 비교한 그림">
  <rect x="15" y="15" width="325" height="240" rx="14" class="p4s"/>
  <text x="177" y="45" text-anchor="middle" class="tx-b">😕 나쁜 description</text>
  <text x="35" y="80" class="tx">“보고서 도우미입니다.</text>
  <text x="35" y="102" class="tx">여러 가지 일을 잘 합니다.”</text>
  <text x="35" y="145" class="tx-m">· 언제 써야 하는지 없음</text>
  <text x="35" y="167" class="tx-m">· 사용자가 실제로 말할 단어 없음</text>
  <text x="35" y="189" class="tx-m">· “여러 가지” → 다른 스킬과 충돌</text>
  <text x="35" y="211" class="tx-m">· 1단계 목록만 보고는 고를 수 없음</text>
  <text x="35" y="240" class="tx-m">→ 선택이 안 되거나 엉뚱하게 됨</text>
  <rect x="360" y="15" width="325" height="240" rx="14" class="p2s"/>
  <text x="522" y="45" text-anchor="middle" class="tx-b">😀 좋은 description</text>
  <text x="380" y="80" class="tx">“보고서 · 요약문 · 리포트 작성 요청에</text>
  <text x="380" y="102" class="tx">사용한다. ‘보고서 써줘’, ‘정리해서 문서로’”</text>
  <text x="380" y="145" class="tx-m">· 무엇을(보고서 작성) + 언제(요청 시)</text>
  <text x="380" y="167" class="tx-m">· 사용자가 말할 법한 표현 포함</text>
  <text x="380" y="189" class="tx-m">· 다른 스킬과 경계가 분명</text>
  <text x="380" y="211" class="tx-m">· 1~2문장, 1024자 이하 (문서 기준 2026-10)</text>
  <text x="522" y="240" text-anchor="middle" class="tx-m">→ 키워드로도 LLM 으로도 잘 고름</text>
</svg>`;

  /* 작업 → 스킬 선택 → 조립 → 에이전트 */
  const FIG_AGENT = `<svg viewBox="0 0 700 260" role="img" aria-label="작업이 들어오면 스킬 선택, 시스템 프롬프트 조립과 도구 활성화를 거쳐 에이전트가 실행되는 흐름">
  ${ARROW('m15a7')}
  <rect x="10" y="90" width="120" height="70" rx="12" class="p1s"/><text x="70" y="118" text-anchor="middle" class="tx-b">작업</text><text x="70" y="140" text-anchor="middle" class="tx-m">“매출 합계 …”</text>
  <rect x="170" y="80" width="150" height="90" rx="12" class="p2"/><text x="245" y="108" text-anchor="middle" class="tx-w">📚 SkillSet</text><text x="245" y="130" text-anchor="middle" class="tx-w">select(작업)</text><text x="245" y="152" text-anchor="middle" class="tx-w">키워드 · LLM</text>
  <rect x="360" y="20" width="160" height="60" rx="12" class="p3s"/><text x="440" y="44" text-anchor="middle" class="tx-b">build_system()</text><text x="440" y="66" text-anchor="middle" class="tx-m">기본 + 목록 + 지시문</text>
  <rect x="360" y="170" width="160" height="60" rx="12" class="p5s"/><text x="440" y="194" text-anchor="middle" class="tx-b">tools_for()</text><text x="440" y="216" text-anchor="middle" class="tx-m">calculator …</text>
  <rect x="560" y="80" width="130" height="90" rx="12" class="p1"/><text x="625" y="112" text-anchor="middle" class="tx-w">🤖 al.Agent</text><text x="625" y="134" text-anchor="middle" class="tx-w">system= · tools=</text><text x="625" y="156" text-anchor="middle" class="tx-w">.run(작업)</text>
  <line x1="132" y1="125" x2="166" y2="125" class="ln" stroke-width="2" marker-end="url(#m15a7)"/>
  <line x1="322" y1="105" x2="356" y2="55" class="ln" stroke-width="2" marker-end="url(#m15a7)"/>
  <line x1="322" y1="145" x2="356" y2="195" class="ln" stroke-width="2" marker-end="url(#m15a7)"/>
  <line x1="522" y1="55" x2="556" y2="105" class="ln" stroke-width="2" marker-end="url(#m15a7)"/>
  <line x1="522" y1="195" x2="556" y2="145" class="ln" stroke-width="2" marker-end="url(#m15a7)"/>
  <text x="245" y="200" text-anchor="middle" class="tx-m">chosen = [data-cleaner]</text>
  <text x="350" y="250" text-anchor="middle" class="tx-m">ss.apply(작업) 한 줄 = select + build_system + tools_for · 작업이 바뀌면 프롬프트와 도구도 바뀝니다</text>
</svg>`;

  /* 스킬 vs 도구 vs 시스템 프롬프트 vs RAG vs MCP */
  const FIG_COMPARE = `<svg viewBox="0 0 700 300" role="img" aria-label="시스템 프롬프트, 도구, RAG, MCP, 스킬이 에이전트에 무엇을 더해 주는지 비교한 그림">
  <rect x="250" y="110" width="200" height="80" rx="14" class="p1"/>
  <text x="350" y="143" text-anchor="middle" class="tx-w">🤖 에이전트 (LLM)</text>
  <text x="350" y="167" text-anchor="middle" class="tx-w">무엇을 더해 줄까?</text>
  <rect x="15" y="15" width="200" height="75" rx="12" class="p3s"/>
  <text x="115" y="40" text-anchor="middle" class="tx-b">📝 시스템 프롬프트</text>
  <text x="115" y="60" text-anchor="middle" class="tx-m">정체성 · 말투 · 제약 (항상)</text>
  <text x="115" y="78" text-anchor="middle" class="tx-m">“누구로서 일하나”</text>
  <rect x="485" y="15" width="200" height="75" rx="12" class="p5s"/>
  <text x="585" y="40" text-anchor="middle" class="tx-b">🔧 도구 (Tool)</text>
  <text x="585" y="60" text-anchor="middle" class="tx-m">함수 호출 — 계산 · 검색 · 저장</text>
  <text x="585" y="78" text-anchor="middle" class="tx-m">“무엇을 할 수 있나”</text>
  <rect x="15" y="210" width="200" height="75" rx="12" class="p4s"/>
  <text x="115" y="235" text-anchor="middle" class="tx-b">📚 RAG (문서 검색)</text>
  <text x="115" y="255" text-anchor="middle" class="tx-m">질문과 비슷한 문서 조각 주입</text>
  <text x="115" y="273" text-anchor="middle" class="tx-m">“무엇을 아나” (사실)</text>
  <rect x="485" y="210" width="200" height="75" rx="12" class="p2s"/>
  <text x="585" y="235" text-anchor="middle" class="tx-b">🔌 MCP (14차시)</text>
  <text x="585" y="255" text-anchor="middle" class="tx-m">도구 · 리소스를 표준으로 연결</text>
  <text x="585" y="273" text-anchor="middle" class="tx-m">“어디서 가져오나” (연결)</text>
  <rect x="250" y="215" width="200" height="70" rx="12" class="p1s"/>
  <text x="350" y="240" text-anchor="middle" class="tx-b">🎓 스킬 (Skill)</text>
  <text x="350" y="260" text-anchor="middle" class="tx-m">절차 · 형식 · 자료 · 도구 묶음</text>
  <text x="350" y="278" text-anchor="middle" class="tx-m">“어떻게 일하나” (필요할 때)</text>
  <line x1="215" y1="60" x2="300" y2="110" class="ln" stroke-width="2"/>
  <line x1="485" y1="60" x2="400" y2="110" class="ln" stroke-width="2"/>
  <line x1="215" y1="240" x2="300" y2="190" class="ln" stroke-width="2"/>
  <line x1="485" y1="240" x2="400" y2="190" class="ln" stroke-width="2"/>
  <line x1="350" y1="190" x2="350" y2="215" class="ln" stroke-width="2"/>
  <text x="350" y="60" text-anchor="middle" class="tx-m">스킬은 이 넷을 대체하지 않습니다.</text>
  <text x="350" y="80" text-anchor="middle" class="tx-m">“절차 + 자료 + 도구”를 작업별로 묶어 필요할 때만 켜는 포장입니다.</text>
</svg>`;

  /* 스킬이 꽂히는 곳 */
  const FIG_WHERE = `<svg viewBox="0 0 700 320" role="img" aria-label="같은 SKILL.md 폴더가 Claude Code, claude.ai, Messages API, Managed Agents, agentBuilder 에 각각 어떻게 들어가는지 보여 주는 그림">
  ${ARROW('m15a6')}
  <rect x="270" y="110" width="160" height="90" rx="14" class="p1"/>
  <text x="350" y="140" text-anchor="middle" class="tx-w">📁 my-skill/</text>
  <text x="350" y="162" text-anchor="middle" class="tx-w">SKILL.md</text>
  <text x="350" y="184" text-anchor="middle" class="tx-w">references/ scripts/</text>
  <rect x="15" y="15" width="200" height="70" rx="12" class="p2s"/>
  <text x="115" y="40" text-anchor="middle" class="tx-b">💻 Claude Code</text>
  <text x="115" y="60" text-anchor="middle" class="tx-m">.claude/skills/ 에 폴더 복사</text>
  <text x="115" y="78" text-anchor="middle" class="tx-m">/my-skill 또는 자동 선택</text>
  <rect x="485" y="15" width="200" height="70" rx="12" class="p3s"/>
  <text x="585" y="40" text-anchor="middle" class="tx-b">🌐 claude.ai</text>
  <text x="585" y="60" text-anchor="middle" class="tx-m">zip 으로 업로드</text>
  <text x="585" y="78" text-anchor="middle" class="tx-m">(설정 › 기능 · 코드 실행 켜기)</text>
  <rect x="15" y="235" width="200" height="70" rx="12" class="p5s"/>
  <text x="115" y="260" text-anchor="middle" class="tx-b">🧪 Messages API</text>
  <text x="115" y="280" text-anchor="middle" class="tx-m">POST /v1/skills 업로드 →</text>
  <text x="115" y="298" text-anchor="middle" class="tx-m">container.skills + 코드 실행 도구</text>
  <rect x="485" y="235" width="200" height="70" rx="12" class="p4s"/>
  <text x="585" y="260" text-anchor="middle" class="tx-b">☁️ Managed Agents</text>
  <text x="585" y="280" text-anchor="middle" class="tx-m">agents.create(skills=[…])</text>
  <text x="585" y="298" text-anchor="middle" class="tx-m">또는 저장소 .claude/skills/</text>
  <rect x="250" y="240" width="200" height="60" rx="12" class="card-bg"/>
  <text x="350" y="264" text-anchor="middle" class="tx-b">🧩 agentBuilder (Part 6)</text>
  <text x="350" y="286" text-anchor="middle" class="tx-m">📄 SKILL.md 가져오기 노드 ↔ 📁 내보내기</text>
  <line x1="290" y1="115" x2="200" y2="80" class="ln" stroke-width="2" marker-end="url(#m15a6)"/>
  <line x1="410" y1="115" x2="500" y2="80" class="ln" stroke-width="2" marker-end="url(#m15a6)"/>
  <line x1="290" y1="195" x2="200" y2="240" class="ln" stroke-width="2" marker-end="url(#m15a6)"/>
  <line x1="410" y1="195" x2="500" y2="240" class="ln" stroke-width="2" marker-end="url(#m15a6)"/>
  <line x1="350" y1="202" x2="350" y2="236" class="ln" stroke-width="2" marker-end="url(#m15a6)"/>
  <text x="350" y="100" text-anchor="middle" class="tx-m">형식은 하나, 올리는 곳은 다섯 — 단, 한 곳에 올린 스킬이 다른 곳에 자동으로 동기화되지는 않습니다</text>
</svg>`;

  const QUIZ1 = [
    { q: 'Agent Skill 에서 <b>반드시</b> 있어야 하는 파일과 그 안의 필수 항목은?', options: ['<code>skill.json</code> 의 <code>id</code> · <code>version</code>', '<code>SKILL.md</code> 의 frontmatter <code>name</code> · <code>description</code>', '<code>scripts/main.py</code> 의 <code>run()</code> 함수', '<code>references/README.md</code>'], answer: 1,
      explain: '스킬 폴더에서 필수는 <code>SKILL.md</code> 하나이고, 그 frontmatter 의 <code>name</code> 과 <code>description</code> 이 필수 항목입니다. references/ · scripts/ 는 선택입니다.' },
    { q: '점진적 로딩(progressive disclosure)에서 <b>1단계</b>에 항상 컨텍스트에 들어가는 것은?', options: ['모든 스킬의 지시문 전체', '모든 스킬의 이름과 설명(description)', '선택된 스킬의 참고 자료', '스크립트의 소스 코드'], answer: 1,
      explain: '1단계에는 각 스킬의 <code>name</code> · <code>description</code> 만 들어갑니다(스킬당 약 100토큰). 지시문은 선택된 뒤(2단계), 자료 · 스크립트는 지시문이 가리킬 때(3단계) 읽습니다.' },
    { q: '다음 중 <b>좋은</b> description 은?', options: ['“똑똑한 도우미. 많은 일을 합니다.”', '“보고서 · 요약문 작성 요청에 사용한다. ‘보고서 써줘’, ‘정리해서 문서로’ 같은 요청.”', '“이 스킬은 2024년에 만들어졌고 버전은 1.2 입니다.”', '“지시문은 본문을 참고하세요.”'], answer: 1,
      explain: 'description 은 <b>무엇을 하는지 + 언제 쓰는지</b>를 사용자가 실제로 말할 법한 표현으로 적어야 1단계 목록만 보고도 고를 수 있습니다.' },
    { q: '<code>Skill.from_md(text)</code> 가 하는 일은?', options: ['SKILL.md 문자열을 파싱해 Skill 객체를 만든다', 'Skill 객체를 SKILL.md 문자열로 바꾼다', 'LLM 에게 스킬을 고르게 한다', '스킬 폴더를 zip 으로 묶는다'], answer: 0,
      explain: '<code>from_md</code> 는 frontmatter(name · description · keywords)와 본문(지시문)을 읽어 Skill 객체를 만들고, 반대 방향은 <code>to_md()</code> 입니다.' },
    { q: '<code>SkillSet.select(작업)</code> 의 키워드 모드에서 스킬이 고른 점수의 근거는?', options: ['스킬 이름의 알파벳 순서', '작업 문장에 스킬의 키워드(없으면 설명의 단어)가 몇 개 들어 있는가', '지시문의 길이', '도구의 개수'], answer: 1,
      explain: '키워드(<code>keywords</code>, 비어 있으면 description 의 단어)가 작업 문장에 포함된 개수를 세고, 스킬 이름이 직접 나오면 +2 합니다. 점수 높은 순으로 최대 2개를 고릅니다.' }
  ];
  const QUIZ2 = [
    { q: '스킬이 선택된 뒤 에이전트에 <b>실제로 달라지는 것</b> 두 가지는?', options: ['모델의 가중치와 토크나이저', '시스템 프롬프트(지시문 추가)와 사용 가능한 도구 목록', 'API 키와 공급자', '대화 기억의 길이'], answer: 1,
      explain: '스킬은 모델을 바꾸지 않습니다. <code>build_system()</code> 으로 지시문이 프롬프트에 붙고 <code>tools_for()</code> 로 스킬의 도구가 활성화될 뿐입니다.' },
    { q: 'Messages API 에서 스킬을 쓰려면 <code>container.skills</code> 와 함께 <b>반드시</b> 켜야 하는 것은? (문서 기준 2026-10)', options: ['스트리밍', '코드 실행 도구(code execution)', '프롬프트 캐싱', '확장 사고'], answer: 1,
      explain: 'API 의 스킬은 코드 실행 컨테이너(샌드박스 VM) 안의 파일로 존재하므로 <code>tools=[{"type": "code_execution_20250825", …}]</code> 가 있어야 합니다.' },
    { q: 'Claude Code 에서 프로젝트 전용 스킬 폴더의 위치는?', options: ['<code>~/.claude/skills/</code>', '<code>.claude/skills/&lt;이름&gt;/SKILL.md</code>', '<code>/etc/claude/skills/</code>', '<code>skills.json</code>'], answer: 1,
      explain: '프로젝트 스킬은 저장소의 <code>.claude/skills/&lt;이름&gt;/SKILL.md</code>, 개인 스킬은 <code>~/.claude/skills/</code> 에 둡니다. <code>/이름</code> 으로 직접 부르거나 설명이 맞으면 자동으로 선택됩니다.' },
    { q: '“스킬을 추가하면 모델이 그 분야를 새로 학습한다”는 말이 틀린 이유는?', options: ['스킬은 유료라서', '스킬은 프롬프트에 지시문을 붙이는 것이지 가중치를 바꾸는 파인튜닝이 아니라서', '스킬은 도구만 추가하기 때문에', '스킬은 claude.ai 에서만 동작해서'], answer: 1,
      explain: '스킬은 “일하는 법”을 적은 문서 + 자료 + 도구입니다. 모델의 지식이나 가중치는 그대로이고, 선택될 때 컨텍스트에 지시문이 들어갈 뿐입니다.' },
    { q: '스킬 선택 정확도를 평가하는 테스트 세트의 한 항목으로 알맞은 것은?', options: ['(스킬 이름, 작성자)', '(작업 문장, 기대하는 스킬 이름 또는 None)', '(모델 이름, 온도)', '(지시문, 토큰 수)'], answer: 1,
      explain: '“이 작업에는 이 스킬이 골라져야 한다”(아무 스킬도 안 골라져야 하면 None)를 쌍으로 적고, <code>select()</code> 결과와 비교해 맞춘 비율을 셉니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag15',
    no: '15',
    title: 'Agent Skills: SKILL.md 로 에이전트에 전문 능력 더하기',
    subtitle: 'SKILL.md 형식 · 점진적 로딩 · Skill / SkillSet · Claude Code · API · Managed Agents 연결',
    summary: '03차시에서 시스템 프롬프트로 “역할”을, 04차시에서 도구로 “손발”을 달아 주었습니다. 그런데 보고서 작성법 · 데이터 정리법 · 회의록 형식 같은 <b>전문 작업 절차</b>를 전부 시스템 프롬프트에 넣으면 프롬프트가 비대해지고 재사용도 어렵습니다. <b>Agent Skill</b> 은 이런 절차 · 참고 자료 · 도구를 <code>SKILL.md</code> 한 장을 중심으로 폴더에 묶어 두고, 에이전트가 작업에 맞는 것만 그때 읽어 쓰는 방식입니다. 이번 차시에서는 SKILL.md 형식과 <b>점진적 로딩</b>의 원리를 배우고, 브라우저에서 <code>builder.skills</code> 로 스킬 선택 · 프롬프트 조립 · 도구 활성화를 직접 구현한 뒤, Claude Code · claude.ai · Messages API · Managed Agents · agentBuilder 에 같은 스킬을 붙이는 방법을 살펴봅니다.',
    goals: [
      'Agent Skill 의 구성(SKILL.md frontmatter · 본문 · references/ · scripts/)과 점진적 로딩의 이유를 설명할 수 있다',
      '좋은 description(무엇을 + 언제)을 쓰고, Skill / Skill.from_md / to_md 로 스킬을 만들고 파싱할 수 있다',
      'SkillSet.select · build_system · tools_for 로 작업에 맞는 스킬을 골라 시스템 프롬프트와 도구를 조립하고 에이전트에 연결할 수 있다',
      '스킬 선택 정확도를 테스트 세트로 평가하고, Claude Code · API · Managed Agents · agentBuilder 에 스킬을 붙이는 방법을 설명할 수 있다'
    ],
    sections: [
      {
        id: 'ag15-1',
        title: '스킬이란 · SKILL.md 만들기',
        minutes: 50,
        goals: ['긴 시스템 프롬프트의 문제와 스킬이 해결하는 것을 설명한다', 'SKILL.md 의 형식(frontmatter · 본문 · 폴더)과 점진적 로딩 3단계를 설명한다', 'Skill · SkillSet 으로 스킬을 만들고 작업에 맞는 스킬을 골라 프롬프트를 조립한다'],
        flow: [['도입 · 왜 스킬인가', 7], ['SKILL.md 형식과 점진적 로딩', 13], ['Skill · SkillSet 실습', 20], ['퀴즈 · 정리', 10]],
        content: [
          { type: 'p', html: '지금까지 에이전트에 능력을 더하는 방법을 두 가지 배웠습니다. 03차시의 <b>시스템 프롬프트</b>는 “누구로서, 어떤 말투로” 일할지를 정했고, 04차시의 <b>도구</b>는 계산 · 검색처럼 “할 수 있는 일”을 늘렸습니다. 그런데 실무 에이전트에는 그 사이에 있는 것이 더 많습니다 — “보고서는 제목 · 요약 · 본문 순서로, 숫자는 표로, 톤은 간결한 경어체로”, “회의록은 결정 사항 · 할 일 · 담당자 표로” 같은 <b>일하는 절차와 형식</b>입니다. 사람으로 치면 신입 사원에게 건네는 <b>업무 매뉴얼</b>이지요. 이런 매뉴얼을 에이전트에 어떻게 건넬까요?' },
          { type: 'h', text: '왜 스킬인가: 매뉴얼을 전부 프롬프트에 넣으면' },
          { type: 'p', html: '가장 단순한 방법은 모든 매뉴얼을 시스템 프롬프트에 넣는 것입니다. 하지만 매뉴얼이 다섯 개, 열 개가 되면 문제가 생깁니다. ① 매 호출마다 수천 토큰이 실려 <b>비용과 지연</b>이 늘고, ② “날씨 어때?” 같은 한 줄 질문에도 회의록 규칙까지 따라가며, ③ 규칙끼리 <b>충돌</b>하고(보고서 톤 vs 회의록 톤), ④ 다른 프로젝트나 동료에게 <b>재사용 · 공유</b>하기 어렵습니다. 03차시 📘 더 알아보기에서 “상용 챗봇의 시스템 프롬프트는 수천 토큰”이라고 했던 것을 기억하세요 — 그 길이의 대부분이 이런 매뉴얼입니다.' },
          { type: 'figure', html: FIG_BLOAT, caption: '그림 15-1. 모든 매뉴얼을 시스템 프롬프트에 넣는 방법(A)과 스킬 목록만 두고 필요한 것을 그때 읽는 방법(B). 스킬은 B 를 표준 형식으로 만든 것입니다.' },
          { type: 'p', html: '<b>Agent Skill</b> 은 이 문제를 “매뉴얼을 <b>폴더</b>로 만들고, 에이전트는 <b>목차만 항상 보다가</b> 필요한 매뉴얼을 그때 펼쳐 읽는다”는 방식으로 풉니다. Anthropic 공식 문서(문서 기준 2026-10)는 Skills 를 <i>“reusable, filesystem-based resources that give Claude domain-specific expertise”</i> — 즉 <b>재사용 가능한, 파일 기반의 전문 지식 꾸러미</b>로 정의합니다. 핵심은 세 가지입니다.' },
          { type: 'list', items: [
            '<b>SKILL.md 한 장</b>이 중심 — 머리(frontmatter)에 <code>name</code> 과 <code>description</code>(언제 쓰는지), 몸(본문)에 지시문(어떻게 하는지)',
            '<b>폴더</b>에 참고 자료(<code>references/</code>)와 실행 스크립트(<code>scripts/</code>)를 함께 담음 — 필요할 때만 읽거나 실행',
            '<b>점진적 로딩</b> — 처음엔 이름 · 설명만, 선택되면 지시문, 그다음에야 자료 · 스크립트. 스킬이 많아져도 컨텍스트 부담이 거의 늘지 않음'
          ] },
          { type: 'h', text: 'SKILL.md 와 스킬 폴더의 구조' },
          { type: 'figure', html: FIG_FOLDER, caption: '그림 15-2. 스킬 폴더 해부도. 필수는 SKILL.md 하나이며, frontmatter(YAML)와 본문(Markdown 지시문)으로 나뉩니다. references/ 와 scripts/ 는 선택입니다.' },
          { type: 'code', title: 'SKILL.md 의 모양 — 보고서 작성 스킬 (형식 보기)', run: false, code: `---
name: report-writer
description: 보고서 · 요약문 · 리포트 작성 요청에 사용한다. "보고서 써줘", "정리해서 문서로 만들어줘" 같은 요청.
---

# 보고서 작성

## 절차
1. 제목 · 요약(3줄) · 본문 · 다음 행동 순서로 쓴다.
2. 숫자는 표로 정리하고 출처를 적는다.
3. 전문 용어는 처음 나올 때 풀어 쓴다.

## 형식 · 톤
- 톤과 문단 길이는 [references/tone.md](references/tone.md) 를 따른다.
- 표가 필요하면 scripts/make_table.py 를 실행해 결과를 붙인다.

## 예시
입력: "3월 매출 150, 2월 135 — 보고서 초안"
출력: 제목 → 요약 3줄 → | 월 | 매출 | 표 → 다음 행동`,
            desc: '<code>---</code> 사이가 <b>frontmatter</b>(YAML), 아래가 <b>본문</b>(Markdown)입니다. 본문에서 <code>references/tone.md</code> 를 링크해 두면 에이전트가 필요할 때만 그 파일을 읽습니다. 이 파일 하나를 <code>report-writer/SKILL.md</code> 로 저장하면 스킬이 됩니다.' },
          { type: 'table', head: ['항목', '필수', '규칙 (문서 기준 2026-10)', '역할'], rows: [
            ['<code>name</code>', '○', '64자 이하 · 영문 소문자 · 숫자 · 하이픈만. “anthropic”, “claude” 금지', '스킬의 id. Claude Code 에서는 <code>/name</code> 으로 부름'],
            ['<code>description</code>', '○', '비어 있으면 안 됨 · 1024자 이하 · XML 태그 금지', '<b>무엇을 + 언제</b>. 1단계 목록에 들어가 선택의 근거가 됨'],
            ['본문', '△', 'Markdown. 5천 토큰 이하 권장', '절차 · 형식 · 주의점 · 예시 (2단계에 로딩)'],
            ['<code>references/</code>', '✕', '아무 파일(md · csv · 템플릿)', '참고 자료. 본문에서 링크하면 그때 읽음 (3단계)'],
            ['<code>scripts/</code>', '✕', '실행 가능한 코드(py · sh)', '결정적 작업. 코드는 컨텍스트에 안 들어가고 <b>실행 결과만</b> 들어감'],
            ['그 밖의 frontmatter', '✕', 'Claude Code: <code>disable-model-invocation</code> · <code>user-invocable</code> · <code>allowed-tools</code> 등', '플랫폼별 확장 항목 (2교시)']
          ], caption: 'SKILL.md 와 폴더 구성 요소. 우리 미니 구현(builder.skills)은 frontmatter 에 <code>keywords</code> 를 추가로 읽습니다 — 키워드 선택에 씁니다.' },
          { type: 'h', text: '점진적 로딩: 왜 “이름 · 설명만 먼저”인가' },
          { type: 'p', html: '스킬 설계의 핵심 아이디어는 <b>점진적 로딩(progressive disclosure)</b>입니다. 에이전트는 시작할 때 모든 스킬의 <code>name</code> · <code>description</code> 만 시스템 프롬프트에 넣습니다(1단계, 스킬당 약 100토큰). 작업이 어떤 스킬의 설명과 맞으면 그 스킬의 SKILL.md 본문을 읽어 컨텍스트에 넣습니다(2단계). 본문이 가리키는 자료나 스크립트는 그때 가서야 읽거나 실행합니다(3단계). 그래서 스킬을 열 개, 스무 개 설치해도 <b>선택되기 전까지는 목록 한 줄씩만</b> 컨텍스트를 차지합니다.' },
          { type: 'figure', html: FIG_STAGES, caption: '그림 15-3. 점진적 로딩 3단계. 공식 문서 기준(2026-10) 1단계는 스킬당 약 100토큰, 2단계는 5천 토큰 이하 권장, 3단계는 읽기 전까지 0토큰입니다.' },
          { type: 'table', head: ['단계', '언제 로딩', '토큰 비용', '내용'], rows: [
            ['1단계 · 메타데이터', '항상 (시작 시)', '스킬당 ~100', 'frontmatter 의 <code>name</code> · <code>description</code>'],
            ['2단계 · 지시문', '스킬이 선택될 때', '5천 이하 권장', 'SKILL.md 본문 (절차 · 형식 · 예시) + 함께 쓰는 도구'],
            ['3단계 · 자료 · 코드', '지시문이 가리킬 때', '읽기 전 0', 'references/ 파일은 읽으면 컨텍스트에, scripts/ 는 실행 결과만']
          ], caption: '공식 문서의 3단계 표를 우리말로 옮긴 것. 선택의 근거는 오직 1단계 정보(이름 · 설명)이므로 description 이 스킬의 운명을 결정합니다.' },
          { type: 'h', text: '좋은 description: 무엇을 + 언제' },
          { type: 'p', html: '에이전트는 1단계 목록만 보고 스킬을 고릅니다. 따라서 <code>description</code> 에는 “무엇을 하는지”뿐 아니라 <b>“언제 쓰는지”</b>, 그리고 사용자가 실제로 말할 법한 표현(“보고서 써줘”)이 들어가야 합니다. 공식 문서도 <i>“must say both what the Skill does and when to use it”</i> 이라고 못 박습니다. 03차시의 나쁜 페르소나 vs 좋은 페르소나와 같은 원리입니다.' },
          { type: 'figure', html: FIG_DESC, caption: '그림 15-4. description 은 스킬의 “얼굴”입니다. 무엇을 · 언제 · 어떤 표현에 반응하는지가 없으면 선택되지 않습니다.' },
          { type: 'h', text: '브라우저에서 만들기: Skill 과 SkillSet' },
          { type: 'p', html: '이제 직접 구현해 봅니다. 강좌에 포함된 <code>builder.skills</code> 모듈(순수 파이썬, agentBuilder 의 실행 엔진과 같은 코드)은 스킬을 <code>Skill</code> 객체로, 여러 스킬의 묶음을 <code>SkillSet</code> 으로 다룹니다. 먼저 보고서 작성 스킬과, 계산기 도구가 딸린 데이터 정리 스킬을 코드로 만들어 봅니다.' },
          { type: 'code', title: '예제 15-1. Skill 객체 만들기 — 이름 · 설명 · 지시문 · 키워드 · 자료 · 도구', code: `import agentlab as al
from builder.skills import Skill, SkillSet

report = Skill(
    'report-writer',                                   # name: 소문자-하이픈
    '보고서 · 요약문 · 리포트 작성 요청에 사용한다',      # description: 무엇을 + 언제
    instructions='''# 보고서 작성
1. 제목 · 요약(3줄) · 본문 · 다음 행동 순서로 쓴다.
2. 숫자는 표로 정리하고 출처를 적는다.''',
    keywords='보고서, 요약, 리포트',                     # (우리 구현) 키워드 선택용
    resources={'tone.md': '간결한 경어체. 한 문단은 4문장 이내.'},   # references/
)
cleaner = Skill(
    'data-cleaner',
    '숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다',
    instructions='''# 데이터 정리
1. 숫자를 표로 정리한다 (항목 | 값).
2. 합계 · 평균 · 증감률은 반드시 계산기 도구로 계산한다.''',
    keywords='데이터, 합계, 평균, 증감, 매출, 숫자',
    tools=[al.calculator],                             # 스킬이 켜질 때만 보이는 도구
)
for s in [report, cleaner]:
    print(s, '→', s.describe())

print('이름 정리 규칙:', Skill('My Report Writer!', '…').name)   # 소문자-하이픈으로 바뀜

ss = SkillSet([report, cleaner])
print('스킬 수:', len(ss))
print('--- 1단계: 목록(catalog) — 항상 프롬프트에 들어가는 부분')
print(ss.catalog())`,
            expect: `Skill(report-writer) → {'name': 'report-writer', 'description': '보고서 · 요약문 · 리포트 작성 요청에 사용한다', 'tools': [], 'keywords': ['보고서', '요약', '리포트'], 'resources': ['tone.md']}
Skill(data-cleaner) → {'name': 'data-cleaner', 'description': '숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다', 'tools': ['calculator'], 'keywords': ['데이터', '합계', '평균', '증감', '매출', '숫자'], 'resources': []}
이름 정리 규칙: my-report-writer
스킬 수: 2
--- 1단계: 목록(catalog) — 항상 프롬프트에 들어가는 부분
사용할 수 있는 스킬 (작업에 맞으면 해당 스킬의 지시를 따른다):
- report-writer: 보고서 · 요약문 · 리포트 작성 요청에 사용한다
- data-cleaner: 숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다`,
            desc: '<code>describe()</code> 는 1단계에 해당하는 정보(이름 · 설명 · 도구 · 키워드 · 자료 이름)만 보여 줍니다. 지시문 본문은 없지요. <code>catalog()</code> 가 만드는 두 줄짜리 목록이 바로 “항상 프롬프트에 들어가는” 1단계 텍스트입니다. 이름에 공백이나 대문자를 쓰면 공식 규칙(소문자 · 숫자 · 하이픈)에 맞게 자동으로 고쳐집니다.' },
          { type: 'code', title: '예제 15-2. SKILL.md 파일 ↔ Skill 객체 — from_md 와 to_md', code: `# ===== File: skills/meeting-notes/SKILL.md =====
---
name: meeting-notes
description: 회의록 · 회의 내용 정리 요청에 사용. 결정 사항 · 할 일 · 담당자를 표로 정리한다
keywords: 회의, 회의록, 미팅
---
# 회의록 정리

1. 먼저 결정 사항을 번호 목록으로 쓴다.
2. 할 일(Action Item)은 표로: | 할 일 | 담당자 | 기한 |
3. 마지막에 다음 회의 안건을 한 줄로 제안한다.
# ===== File: main.py =====
from builder.skills import Skill

text = open('skills/meeting-notes/SKILL.md', encoding='utf-8').read()
s = Skill.from_md(text)                    # SKILL.md 문자열 → Skill
print('이름:', s.name)
print('설명:', s.description)
print('키워드:', s.keywords)
print('지시문 첫 줄:', s.instructions.split('\\n')[0])
print('지시문 길이:', len(s.instructions), '자')

print('--- to_md(): 객체 → SKILL.md 문자열')
md = s.to_md()
print(md)
print('--- 왕복(round trip) 후 같은가?', Skill.from_md(md).describe() == s.describe())`,
            expect: `이름: meeting-notes
설명: 회의록 · 회의 내용 정리 요청에 사용. 결정 사항 · 할 일 · 담당자를 표로 정리한다
키워드: ['회의', '회의록', '미팅']
지시문 첫 줄: # 회의록 정리
지시문 길이: 107 자
--- to_md(): 객체 → SKILL.md 문자열
---
name: meeting-notes
description: 회의록 · 회의 내용 정리 요청에 사용. 결정 사항 · 할 일 · 담당자를 표로 정리한다
keywords: 회의, 회의록, 미팅
---

# 회의록 정리

1. 먼저 결정 사항을 번호 목록으로 쓴다.
2. 할 일(Action Item)은 표로: | 할 일 | 담당자 | 기한 |
3. 마지막에 다음 회의 안건을 한 줄로 제안한다.

--- 왕복(round trip) 후 같은가? True`,
            desc: '편집기의 <code># ===== File: … =====</code> 구분으로 SKILL.md 를 진짜 파일로 만들어 두고 읽었습니다. <code>from_md</code> 는 frontmatter 의 <code>name · description · keywords</code> 와 본문을 분리하고, <code>to_md</code> 는 다시 SKILL.md 형식으로 돌려줍니다. Claude Code 용으로 받은 SKILL.md 를 그대로 붙여 넣어도 됩니다.' },
          { type: 'callout', kind: 'info', title: '우리 구현과 공식 스킬의 차이', html: '<code>builder.skills</code> 는 공식 Skills 의 <b>원리를 보여 주는 미니 구현</b>입니다. ① 공식 스킬은 코드 실행 VM 의 파일 시스템에 있고 모델이 <code>cat SKILL.md</code> 로 읽지만, 우리는 파이썬 객체로 들고 시스템 프롬프트에 붙입니다. ② <code>scripts/</code> 대신 04차시의 <b>도구(Tool)</b> 를 스킬에 묶습니다. ③ 선택은 공식 스킬에서는 모델이 하지만, 우리는 <b>키워드</b>(빠르고 결정적) 또는 <b>LLM</b>(2교시)으로 합니다. ④ <code>keywords</code> frontmatter 는 우리 구현의 확장 항목입니다 — 공식 플랫폼은 무시합니다.' },
          { type: 'h', text: '스킬 고르기: SkillSet.select' },
          { type: 'p', html: '<code>select(작업)</code> 은 작업 문장에 각 스킬의 키워드가 몇 개 들어 있는지 세어 점수를 매기고(스킬 이름이 직접 나오면 +2), 점수가 높은 순으로 <b>최대 2개</b>를 고릅니다. 키워드가 없으면 description 의 단어를 키워드로 씁니다. 점수가 0 이면 빈 목록 — “기본 동작”입니다.' },
          { type: 'code', title: '예제 15-3. 작업에 맞는 스킬 고르기 (키워드 모드)', code: `import agentlab as al
from builder.skills import Skill, SkillSet

report = Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용한다',
               instructions='# 보고서 작성', keywords='보고서, 요약, 리포트')
cleaner = Skill('data-cleaner', '숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다',
                instructions='# 데이터 정리', keywords='데이터, 합계, 평균, 증감, 매출, 숫자', tools=[al.calculator])
meeting = Skill('meeting-notes', '회의록 · 회의 내용 정리 요청에 사용',
                instructions='# 회의록 정리')        # 키워드 없음 → 설명의 단어로 고름
ss = SkillSet([report, cleaner, meeting])

tasks = ['이번 분기 매출 보고서 써줘',
         '1월 120, 2월 135 의 합계와 평균을 구해줘',
         '어제 회의 내용 정리해줘',
         '오늘 날씨 어때?',
         'data-cleaner 로 이 숫자들 정리해줘']
for q in tasks:
    chosen = ss.select(q)
    names = [s.name for s in chosen] or '(없음 — 기본 동작)'
    print(f'{q:<28} → {names}')

print('--- 점수의 근거: 작업 문장에 들어 있는 키워드')
q = '이번 분기 매출 보고서 써줘'
for s in ss:
    keys = s.keywords or s.description.split()
    print(f'  {s.name:<14}', [k for k in keys if k in q])`,
            expect: `이번 분기 매출 보고서 써줘              → ['report-writer', 'data-cleaner']
1월 120, 2월 135 의 합계와 평균을 구해줘 → ['data-cleaner']
어제 회의 내용 정리해줘                → ['meeting-notes']
오늘 날씨 어때?                    → (없음 — 기본 동작)
data-cleaner 로 이 숫자들 정리해줘    → ['data-cleaner', 'meeting-notes']
--- 점수의 근거: 작업 문장에 들어 있는 키워드
  report-writer  ['보고서']
  data-cleaner   ['매출']
  meeting-notes  []`,
            desc: '“매출 보고서” 는 report-writer(보고서)와 data-cleaner(매출) 두 스킬이 모두 점수를 얻어 둘 다 선택됩니다 — 실제로 보고서에 숫자 정리가 필요하니 자연스럽습니다. “날씨” 는 어떤 키워드에도 안 걸려 빈 목록이고, 스킬 이름을 직접 말하면 +2 점으로 확실히 선택됩니다. 마지막 작업에서 meeting-notes 까지 딸려 온 이유는 <b>키워드를 비워 두어</b> description 의 단어(“정리”)로 고르기 때문입니다 — 키워드를 명시해 두는 편이 안전하다는 교훈입니다. 키워드 설계가 곧 선택 품질입니다.' },
          { type: 'h', text: '프롬프트 조립: build_system 과 tools_for' },
          { type: 'p', html: '고른 스킬을 실제 시스템 프롬프트로 바꾸는 것이 <code>build_system(기본 프롬프트, chosen)</code> 입니다. 결과는 <b>기본 프롬프트 + 1단계 목록(전체) + 2단계 지시문(선택된 것만) + 참고 자료</b> 순서입니다. <code>tools_for(chosen)</code> 은 선택된 스킬들의 도구를 중복 없이 모읍니다.' },
          { type: 'code', title: '예제 15-4. 조립된 시스템 프롬프트 보기 — 1단계 목록 vs 2단계 지시문', code: `import agentlab as al
from builder.skills import Skill, SkillSet

report = Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용한다',
               instructions='# 보고서 작성\\n1. 제목 · 요약(3줄) · 본문 순서로 쓴다.\\n2. 숫자는 표로 정리한다.',
               keywords='보고서, 요약, 리포트', resources={'tone.md': '간결한 경어체. 한 문단은 4문장 이내.'})
cleaner = Skill('data-cleaner', '숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다',
                instructions='# 데이터 정리\\n1. 숫자를 표로 정리한다.\\n2. 합계 · 평균은 반드시 계산기 도구로 계산한다.',
                keywords='데이터, 합계, 평균, 증감, 숫자', tools=[al.calculator])
meeting = Skill('meeting-notes', '회의록 · 회의 내용 정리 요청에 사용',
                instructions='# 회의록 정리\\n1. 결정 사항 → 할 일 표 → 다음 안건.', keywords='회의, 회의록')
ss = SkillSet([report, cleaner, meeting])
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.'

chosen = ss.select('합계를 계산해줘: 120 + 135')
print('선택:', [s.name for s in chosen], '/ 활성 도구:', [t.name for t in ss.tools_for(chosen)])
print('=' * 50)
print(ss.build_system(BASE, chosen))
print('=' * 50)
print('프롬프트 길이 — 선택 1개:', len(ss.build_system(BASE, chosen)), '자',
      '/ 전부 활성화:', len(ss.build_system(BASE, list(ss))), '자',
      '/ 선택 없음:', len(ss.build_system(BASE, [])), '자')`,
            expect: `선택: ['data-cleaner'] / 활성 도구: ['calculator']
==================================================
당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.

사용할 수 있는 스킬 (작업에 맞으면 해당 스킬의 지시를 따른다):
- report-writer: 보고서 · 요약문 · 리포트 작성 요청에 사용한다
- data-cleaner: 숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다
- meeting-notes: 회의록 · 회의 내용 정리 요청에 사용

## 스킬 활성화: data-cleaner
# 데이터 정리
1. 숫자를 표로 정리한다.
2. 합계 · 평균은 반드시 계산기 도구로 계산한다.
==================================================
프롬프트 길이 — 선택 1개: 290 자 / 전부 활성화: 473 자 / 선택 없음: 210 자`,
            desc: '“사용할 수 있는 스킬” 목록(1단계)은 세 스킬이 모두 보이지만, “## 스킬 활성화” 블록(2단계)은 선택된 data-cleaner 하나뿐이고 계산기 도구도 그때만 켜집니다. 마지막 줄의 길이 비교가 점진적 로딩의 효과입니다 — 스킬이 많아질수록 차이가 커집니다. 예제는 길이를 글자 수로 쟀지만 실제로는 토큰 수가 비용입니다.' },
          { type: 'code', title: '예제 15-5. 한 줄로: ss.apply() — 선택 + 조립 + 도구', code: `import agentlab as al
from builder.skills import Skill, SkillSet

ss = SkillSet([
    Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서 작성\\n1. 제목 · 요약 · 본문', keywords='보고서, 요약'),
    Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산에 사용', instructions='# 데이터 정리\\n1. 계산기로 계산', keywords='합계, 평균, 숫자', tools=[al.calculator]),
    Skill('meeting-notes', '회의록 정리에 사용', instructions='# 회의록\\n1. 결정 사항 → 할 일 표', keywords='회의, 회의록'),
])

for task in ['어제 회의 내용 정리해줘', '120 + 135 합계 구해줘', '오늘 날씨 어때?']:
    print('👤', task)
    system, tools, chosen = ss.apply(task, base_system='당신은 비서입니다.', log=print)
    print('   도구:', [t.name for t in tools], '/ 프롬프트', len(system), '자')
    tail = system.split('## 스킬 활성화: ')[-1].split('\\n')[0] if chosen else '(지시문 없음)'
    print('   활성 블록:', tail)`,
            expect: `👤 어제 회의 내용 정리해줘
📚 스킬 선택: meeting-notes
   도구: [] / 프롬프트 202 자
   활성 블록: meeting-notes
👤 120 + 135 합계 구해줘
📚 스킬 선택: data-cleaner
   도구: ['calculator'] / 프롬프트 198 자
   활성 블록: data-cleaner
👤 오늘 날씨 어때?
📚 스킬 선택: (없음 — 기본 동작)
   도구: [] / 프롬프트 153 자
   활성 블록: (지시문 없음)`,
            desc: '<code>apply()</code> 는 <code>select → build_system → tools_for</code> 를 한 번에 하고 <code>(system, tools, chosen)</code> 을 돌려줍니다. <code>log=print</code> 를 주면 “📚 스킬 선택: …” 한 줄이 찍힙니다 — agentBuilder 의 실행 로그와 같은 메시지입니다. 2교시에서 이 결과를 그대로 <code>al.Agent</code> 에 넣습니다.' },
          { type: 'callout', kind: 'tip', title: '내보낸 코드의 skills_apply()', html: 'agentBuilder 가 내보내는 파이썬 코드와 이 강좌의 Colab 노트북에서는 같은 일을 하는 독립 함수 <code>skills_apply(skills, query, base_system, base_tools, llm=…)</code> 를 씁니다 (외부 모듈 없이 한 파일로 돌아가도록 도우미가 코드 안에 복사되어 있습니다). 인자와 반환값은 <code>SkillSet.apply()</code> 와 같습니다 — 예제 15-7 에서 내보낸 코드를 직접 확인합니다.' },
          { type: 'h', text: 'agentBuilder 예제 16: 스킬 그래프 실행하기' },
          { type: 'p', html: 'Part 6 에서 배울 <b>agentBuilder</b> 는 노드를 연결해 에이전트를 조립하는 웹 빌더인데, 그 실행 엔진이 이 강좌에 들어 있어 브라우저에서 바로 돌릴 수 있습니다. 예제 그래프 <code>builder/16_skills.json</code> 에는 📚 Skill 정의 2개 + 📄 SKILL.md 가져오기 1개가 🤖 에이전트의 <b>스킬 포트</b>에 연결되어 있습니다. 실행 로그에서 “📚 스킬 선택” 이 찍히고, 🧮 스킬 선택 · 프롬프트 조립 노드가 조립된 프롬프트를 결과로 보여 줍니다.' },
          { type: 'figure', html: '<img src="img/builder/26_skills.png" alt="agentBuilder 예제 16: 스킬 정의 2개와 SKILL.md 가져오기가 비서 에이전트의 스킬 포트에 연결된 화면" loading="lazy">', caption: '그림 15-5. agentBuilder 예제 16 — 스킬 노드 3개가 에이전트의 스킬 포트에 꽂혀 있습니다. 빌더 자체는 Part 6(16~17차시)에서 자세히 다룹니다.' },
          { type: 'code', title: '예제 15-6. 예제 16 그래프를 코드로 실행 — 입력을 바꾸면 다른 스킬이 선택된다', code: `import json
from builder import engine

g = json.load(open('builder/16_skills.json', encoding='utf-8'))
print(g['name'], '· 노드', len(g['nodes']), '· 간선', len(g['edges']))
for n in g['nodes']:
    if n['type'] in ('skill', 'skill_import', 'skill_prompt', 'agent'):
        print(f"  {n['id']:<4}{n['type']:<13}{n['label']}")

def show(ev):                                   # 실행 이벤트 → 화면
    if ev['type'] == 'log' and ('스킬' in ev['text'] or '최종' in ev['text']):
        print('  ', ev['text'])
    elif ev['type'] == 'result' and ev['title'] == '선택된 스킬':
        print('=== 선택된 스킬:', ev['value'])

print('--- 실행 1: 기본 입력(매출 데이터 → 보고서 초안)')
engine.run_graph(g, emit=show)
print('--- 실행 2: 입력을 회의록으로 바꿈')
engine.run_graph(g, overrides={'n1': '어제 회의 내용 정리해줘: 예산 승인, 김대리가 금요일까지 견적'}, emit=show)`,
            expect: `16 스킬을 가진 비서 · 노드 12 · 간선 14
  n4  skill        보고서 작성 스킬
  n5  skill        데이터 정리 스킬
  n6  skill_import SKILL.md 가져오기
  n7  agent        스킬 비서
  n9  skill_prompt 스킬 선택 · 프롬프트 조립
--- 실행 1: 기본 입력(매출 데이터 → 보고서 초안)
   📚 스킬 정의: report-writer — 보고서 · 요약문 · 리포트 작성 요청에 사용한다
   📚 스킬 정의: data-cleaner — 숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다 · 도구 ['calculator']
   📚 스킬 선택: data-cleaner, report-writer
   ✅ 최종 답: [비서] 요약: 이번 분기 매출 데이터(1월 120, 2월 135, 3월 150)해서 보고서 초안을 써줘
   📚 스킬 선택: data-cleaner, report-writer
=== 선택된 스킬: ['data-cleaner', 'report-writer']
--- 실행 2: 입력을 회의록으로 바꿈
   📚 스킬 정의: report-writer — 보고서 · 요약문 · 리포트 작성 요청에 사용한다
   📚 스킬 정의: data-cleaner — 숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다 · 도구 ['calculator']
   📚 스킬 선택: meeting-notes
   ✅ 최종 답: [비서] 요약: 어제 회의: 예산 승인, 김대리가 금요일까지 견적
   📚 스킬 선택: meeting-notes
=== 선택된 스킬: ['meeting-notes']`,
            desc: '같은 그래프에 입력만 바꿨더니 선택된 스킬이 <code>data-cleaner, report-writer</code> 에서 <code>meeting-notes</code> 로 바뀌었습니다. 에이전트 노드는 선택된 스킬의 지시문 · 도구로 실행되고, 🧮 노드는 그 과정을 밖으로 꺼내 보여 줍니다. (모의 LLM 의 최종 답은 형식을 따르지 않지만, 🔑 키를 넣으면 지시문대로 제목 · 요약 · 표가 나옵니다.)' },
          { type: 'figure', html: '<img src="img/builder/26_skill_prompt.png" alt="조립된 시스템 프롬프트 결과: 스킬 목록(1단계)과 활성화된 스킬의 지시문(2단계)" loading="lazy">', caption: '그림 15-6. 빌더의 🧮 스킬 선택 · 프롬프트 조립 노드 결과 — 1단계 목록 아래에 활성화된 스킬의 지시문만 붙어 있습니다 (예제 15-4 의 출력과 같은 구조).' },
          { type: 'code', title: '예제 15-7. 스킬을 SKILL.md 폴더로 내보내기 — export.skill_files', code: `import json
from builder import export

g = json.load(open('builder/16_skills.json', encoding='utf-8'))
files = export.skill_files(g)                 # {'폴더/파일': 내용}
print('내보낼 파일:', list(files))
print()
for fn, content in files.items():
    if fn.startswith('report-writer/'):
        print('📄', fn)
        print(content)

code = export.export_python(g)                # 독립 파이썬 스크립트
line = [l for l in code.split('\\n') if 'skills_apply(' in l and 'agent1' in l][0]
print('내보낸 코드에서 스킬을 쓰는 줄:')
print('   ', line.strip())`,
            expect: `내보낼 파일: ['report-writer/SKILL.md', 'report-writer/references/notes.md', 'data-cleaner/SKILL.md', 'meeting-notes/SKILL.md']

📄 report-writer/SKILL.md
---
name: report-writer
description: 보고서 · 요약문 · 리포트 작성 요청에 사용한다
keywords: 보고서, 요약, 리포트
---

# 보고서 작성
1. 제목 · 요약(3줄) · 본문 · 다음 행동 순서로 쓴다.
2. 숫자는 표로 정리하고 출처를 적는다.
3. 전문 용어는 처음 나올 때 풀어 쓴다.

## 참고 자료
- references/notes.md

📄 report-writer/references/notes.md
보고서 톤: 간결한 경어체. 한 문단은 4문장 이내.
내보낸 코드에서 스킬을 쓰는 줄:
    agent1_system, agent1_tools, agent1_skills = skills_apply([skill1, skill2, skill_import1], agent1_question, '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.', [], llm=llm1)`,
            desc: '<code>skill_files</code> 가 돌려준 dict 를 그대로 파일로 쓰면 <code>report-writer/SKILL.md</code> + <code>references/notes.md</code> 폴더가 됩니다 — Claude Code 의 <code>.claude/skills/</code> 에 복사하거나 zip 으로 묶어 claude.ai 에 올릴 수 있는 형식 그대로입니다(빌더의 📁 SKILL.md 버튼이 하는 일). 내보낸 파이썬 코드는 <code>skills_apply()</code> 한 줄로 선택 · 조립을 합니다.' },
          { type: 'callout', kind: 'warn', title: '스킬은 “소프트웨어 설치”처럼 다루세요', html: '스킬은 지시문과 코드로 에이전트의 행동을 바꿉니다. 공식 문서는 <b>신뢰할 수 있는 출처</b>(직접 만든 것, Anthropic 제공)의 스킬만 쓰고, 외부에서 받은 스킬은 SKILL.md · 스크립트 · 자료를 모두 검토하라고 권합니다. 특히 외부 URL 에서 내용을 가져오는 스킬은 그 내용에 악성 지시(프롬프트 주입, 03 · 13차시)가 섞일 수 있습니다. 2교시에서 다시 짚습니다.' }
        ],
        practice: [
          { title: '실습 15-1. 나만의 SKILL.md 쓰고 파싱하기', level: 1,
            desc: '<p><b>번역 스킬</b>(<code>translator</code>)의 SKILL.md 를 문자열로 작성하세요. description 에는 “무엇을 + 언제”(예: “한국어 ↔ 영어 번역 요청에 사용. ‘영어로 번역해줘’ 같은 요청”)를, keywords 에는 <code>번역, 영어로, translate</code> 를, 본문에는 절차 2~3줄을 씁니다. <code>Skill.from_md</code> 로 파싱해 이름 · 설명 · 키워드를 출력하고, 기존 두 스킬과 함께 <code>SkillSet</code> 에 넣어 세 가지 작업으로 <code>select</code> 결과를 확인하세요.</p>',
            hint: 'frontmatter 는 <code>---</code> 로 열고 닫습니다. <code>select(\'다음 문장을 영어로 번역해줘\')</code> 가 <code>[Skill(translator)]</code> 를 돌려주면 성공입니다.',
            starter: `from builder.skills import Skill, SkillSet

SKILL_MD = '''---
name: translator
description: TODO: 무엇을 + 언제
keywords: TODO
---
# 번역
1. TODO
'''
translator = Skill.from_md(SKILL_MD)
print(translator.name, '/', translator.description, '/', translator.keywords)

report = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서', keywords='보고서, 요약')
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산에 사용', instructions='# 데이터', keywords='합계, 평균, 숫자')
ss = SkillSet([report, cleaner, translator])
for q in ['다음 문장을 영어로 번역해줘: 안녕하세요', '매출 합계 구해줘', '오늘 뭐 먹지?']:
    print(q, '→', ss.select(q))
`,
            solution: `from builder.skills import Skill, SkillSet

SKILL_MD = '''---
name: translator
description: 한국어 ↔ 영어 번역 요청에 사용. "영어로 번역해줘", "한국어로 옮겨줘" 같은 요청
keywords: 번역, 영어로, 한국어로, translate
---
# 번역
1. 원문의 뜻을 바꾸지 않고 자연스러운 문장으로 옮긴다.
2. 고유명사는 원어를 괄호에 함께 적는다.
3. 번역문만 출력한다.
'''
translator = Skill.from_md(SKILL_MD)
print(translator.name, '/', translator.description, '/', translator.keywords)

report = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서', keywords='보고서, 요약')
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산에 사용', instructions='# 데이터', keywords='합계, 평균, 숫자')
ss = SkillSet([report, cleaner, translator])
for q in ['다음 문장을 영어로 번역해줘: 안녕하세요', '매출 합계 구해줘', '오늘 뭐 먹지?']:
    print(q, '→', ss.select(q))
`,
            expect: `translator / 한국어 ↔ 영어 번역 요청에 사용. "영어로 번역해줘", "한국어로 옮겨줘" 같은 요청 / ['번역', '영어로', '한국어로', 'translate']
다음 문장을 영어로 번역해줘: 안녕하세요 → [Skill(translator)]
매출 합계 구해줘 → [Skill(data-cleaner)]
오늘 뭐 먹지? → []`,
          },
          { title: '실습 15-2. 잘못 선택되는 작업 고치기 — 키워드와 description 다듬기', level: 2,
            desc: '<p>아래 코드를 그대로 실행하면 <code>\'분기 실적을 정리한 문서가 필요해\'</code> 는 보고서 요청인데 어떤 스킬도 선택되지 않아 ❌ 가 납니다. 또 <code>\'회의 자료의 숫자를 요약해줘\'</code> 는 report-writer(요약)와 data-cleaner(숫자)가 <b>동점</b>이라 둘 다 선택됩니다. (1) report-writer 의 description 과 keywords 에 <code>문서, 실적</code> 을 추가하고, (2) <code>select</code> 결과 중 <b>첫 번째(점수 최고, 동점이면 먼저 등록된 스킬)</b>만 쓰도록 바꿔 다섯 테스트가 모두 ✅ 가 되게 하세요.</p>',
            hint: '<code>keywords</code> 는 쉼표로 구분한 문자열입니다. 점수가 같으면 먼저 등록된 스킬이 앞에 오므로 <code>SkillSet</code> 의 순서도 영향을 줍니다. 첫 번째만 쓰려면 <code>ss.select(q)[:1]</code>.',
            starter: `from builder.skills import Skill, SkillSet

report = Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용',
               instructions='# 보고서', keywords='보고서, 요약, 리포트')      # TODO: 키워드 보강
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산에 사용',
                instructions='# 데이터', keywords='합계, 평균, 숫자')
meeting = Skill('meeting-notes', '회의록 정리에 사용', instructions='# 회의록', keywords='회의록, 회의 내용')
ss = SkillSet([report, cleaner, meeting])

TESTS = [('분기 실적을 정리한 문서가 필요해', 'report-writer'),
         ('회의 자료의 숫자를 요약해줘', 'report-writer'),
         ('매출 합계 구해줘', 'data-cleaner'),
         ('어제 회의 내용 정리해줘', 'meeting-notes'),
         ('오늘 날씨 어때?', None)]
for q, want in TESTS:
    got = [s.name for s in ss.select(q)]          # TODO: 첫 번째만 쓰기
    first = got[0] if got else None
    print('✅' if first == want else '❌', q, '→', first, '/ 기대:', want)
`,
            solution: `from builder.skills import Skill, SkillSet

report = Skill('report-writer', '보고서 · 요약문 · 리포트 · 문서 작성 요청에 사용',
               instructions='# 보고서', keywords='보고서, 요약, 리포트, 문서, 실적')
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산에 사용',
                instructions='# 데이터', keywords='합계, 평균, 숫자')
meeting = Skill('meeting-notes', '회의록 정리에 사용', instructions='# 회의록', keywords='회의록, 회의 내용')
ss = SkillSet([report, cleaner, meeting])

TESTS = [('분기 실적을 정리한 문서가 필요해', 'report-writer'),
         ('회의 자료의 숫자를 요약해줘', 'report-writer'),
         ('매출 합계 구해줘', 'data-cleaner'),
         ('어제 회의 내용 정리해줘', 'meeting-notes'),
         ('오늘 날씨 어때?', None)]
for q, want in TESTS:
    got = [s.name for s in ss.select(q)[:1]]      # 점수 최고 1개만
    first = got[0] if got else None
    print('✅' if first == want else '❌', q, '→', first, '/ 기대:', want)
`,
            expect: `✅ 분기 실적을 정리한 문서가 필요해 → report-writer / 기대: report-writer
✅ 회의 자료의 숫자를 요약해줘 → report-writer / 기대: report-writer
✅ 매출 합계 구해줘 → data-cleaner / 기대: data-cleaner
✅ 어제 회의 내용 정리해줘 → meeting-notes / 기대: meeting-notes
✅ 오늘 날씨 어때? → None / 기대: None`,
          }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'Agent Skills', subtitle: 'SKILL.md 로 에이전트에 전문 능력 더하기', notes: '<p>Part 5 둘째 차시. 14차시 MCP 가 “도구를 어디서 가져오나”였다면 오늘은 “일하는 법을 어떻게 가르치나”입니다.</p><p><b>발문:</b> “신입 사원에게 업무 매뉴얼을 전부 외우게 하나, 아니면 필요할 때 찾아보게 하나?” → 후자. 에이전트도 같습니다.</p><p>⏱ 도입 7분</p>' },
          { layout: 'bullets', title: '왜 스킬인가', lead: '매뉴얼을 전부 시스템 프롬프트에 넣으면', bullets: ['매 호출마다 수천 토큰 — 비용 · 지연', '“날씨 어때?” 한 줄에도 회의록 규칙이 실림', '규칙끼리 충돌 (보고서 톤 vs 회의록 톤)', '다른 프로젝트 · 동료에게 재사용 · 공유 어려움', '→ 스킬: 매뉴얼을 <b>폴더</b>로, 목차만 보다가 <b>필요할 때 펼침</b>'],
            notes: '<p>03차시 “상용 챗봇 프롬프트는 수천 토큰” 을 상기시킵니다. 네 가지 문제를 학생에게 먼저 추측하게 한 뒤 공개하면 좋습니다.</p>' },
          { layout: 'diagram', title: '방법 A vs 방법 B', html: FIG_BLOAT, caption: '스킬 = 방법 B 의 표준 형식',
            notes: '<p>왼쪽은 규칙이 쌓일수록 상자가 커지고, 오른쪽은 목록만 길어진다는 점을 손으로 가리키며 설명합니다. “스킬당 ~100토큰”은 공식 문서 수치(2026-10).</p>' },
          { layout: 'diagram', title: '스킬 폴더 해부도', html: FIG_FOLDER, caption: '필수는 SKILL.md 하나: frontmatter + 본문',
            notes: '<p>frontmatter 와 본문을 구분해서 읽어 줍니다. <b>발문:</b> “references/ 와 scripts/ 의 차이는?” → 자료는 읽으면 컨텍스트에 들어가고, 스크립트는 실행 결과만 들어간다.</p>' },
          { layout: 'table', title: 'SKILL.md 필수 항목 (문서 기준 2026-10)', head: ['항목', '규칙', '역할'], rows: [
            ['name', '64자 이하 · 소문자 · 숫자 · 하이픈', '스킬 id, /name 으로 호출'],
            ['description', '1024자 이하 · 비어 있으면 안 됨', '무엇을 + 언제 → 선택의 근거'],
            ['본문', 'Markdown · 5천 토큰 이하 권장', '절차 · 형식 · 예시'],
            ['references/ · scripts/', '선택', '자료 · 실행 코드 (3단계)']
          ], notes: '<p>“anthropic”, “claude” 는 name 에 쓸 수 없다는 점도 언급. 우리 구현은 keywords 를 추가로 읽는다는 것을 미리 말해 둡니다.</p>' },
          { layout: 'diagram', title: '점진적 로딩 3단계', html: FIG_STAGES, caption: '선택의 근거는 1단계 정보뿐 → description 이 운명을 결정',
            notes: '<p>오늘의 핵심 그림. 세 칸을 순서대로 짚으며 “언제 로딩 · 얼마나”를 말합니다. <b>발문:</b> “스킬이 20개면 1단계 비용은?” → 약 2천 토큰. “지시문은?” → 선택된 것만.</p>' },
          { layout: 'diagram', title: '좋은 description', html: FIG_DESC, caption: '무엇을 + 언제 + 사용자가 말할 표현',
            notes: '<p>03차시 나쁜/좋은 페르소나와 같은 구조. 학생에게 자기 스킬의 description 한 문장을 노트에 쓰게 합니다 (실습 15-1 재료).</p>' },
          { layout: 'code', title: 'Skill 객체와 1단계 목록', code: `import agentlab as al
from builder.skills import Skill, SkillSet

report = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용한다',
               instructions='# 보고서 작성\\n1. 제목 · 요약 · 본문 순서',
               keywords='보고서, 요약')
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산 요청에 사용한다',
                instructions='# 데이터 정리\\n1. 계산기로 계산',
                keywords='합계, 평균, 숫자', tools=[al.calculator])
ss = SkillSet([report, cleaner])
print(report.describe())
print(ss.catalog())`, points: ['<code>Skill(name, description, instructions, keywords, tools)</code>', '<code>describe()</code> = 1단계 정보만', '<code>catalog()</code> = 항상 프롬프트에 들어가는 목록'],
            notes: '<p>▶ 실행. describe() 에 지시문이 없다는 점을 강조 — 1단계에는 지시문이 없습니다.</p>' },
          { layout: 'code', title: 'SKILL.md ↔ Skill: from_md · to_md', code: `from builder.skills import Skill

md = '''---
name: meeting-notes
description: 회의록 · 회의 내용 정리 요청에 사용
keywords: 회의, 회의록
---
# 회의록 정리
1. 결정 사항 → 2. 할 일 표 → 3. 다음 안건
'''
s = Skill.from_md(md)
print(s.name, s.keywords)
print(s.instructions)
print('---')
print(s.to_md())`, points: ['frontmatter → name · description · keywords', '본문 → instructions', '<code>to_md()</code> 로 되돌리기 (왕복)'],
            notes: '<p>▶ 실행. Claude Code 용 SKILL.md 를 그대로 붙여 넣을 수 있다는 점을 말합니다. 본문 예제 15-2 는 실제 파일로 저장해 읽는 버전입니다.</p>' },
          { layout: 'code', title: '선택과 조립: select · build_system · tools_for', code: `import agentlab as al
from builder.skills import Skill, SkillSet

ss = SkillSet([
    Skill('report-writer', '보고서 작성에 사용', instructions='# 보고서\\n1. 제목 · 요약 · 본문', keywords='보고서, 요약'),
    Skill('data-cleaner', '숫자 정리 · 합계 계산에 사용', instructions='# 데이터\\n1. 계산기로', keywords='합계, 평균', tools=[al.calculator]),
    Skill('meeting-notes', '회의록 정리에 사용', instructions='# 회의록\\n1. 결정 사항 → 할 일', keywords='회의, 회의록'),
])
for q in ['120 + 135 합계 구해줘', '회의 내용 정리해줘', '날씨 어때?']:
    chosen = ss.select(q)
    print(q, '→', chosen, [t.name for t in ss.tools_for(chosen)])
print('=' * 40)
print(ss.build_system('당신은 비서입니다.', ss.select('120 + 135 합계 구해줘')))`, points: ['키워드 점수 → 최대 2개', '목록(전체) + 지시문(선택만)', '도구는 선택된 스킬 것만'],
            notes: '<p>▶ 실행. 출력에서 “사용할 수 있는 스킬” 세 줄(1단계)과 “## 스킬 활성화” 한 블록(2단계)을 구분해 가리킵니다. 작업을 “회의 내용 정리해줘”로 바꿔 다시 실행.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>손들기로 확인. 틀린 학생에게 그림 15-3 의 1단계 칸을 다시 보여 줍니다.</p>' },
          { layout: 'practice', title: '실습 15-1. 나만의 SKILL.md', desc: '<p>번역 스킬의 SKILL.md 를 쓰고 <code>from_md</code> 로 파싱한 뒤 <code>select</code> 로 확인하세요.</p>',
            starter: `from builder.skills import Skill, SkillSet

SKILL_MD = '''---
name: translator
description: TODO
keywords: TODO
---
# 번역
1. TODO
'''
t = Skill.from_md(SKILL_MD)
ss = SkillSet([Skill('report-writer', '보고서 작성에 사용', keywords='보고서'), t])
print(ss.select('영어로 번역해줘: 안녕'))`, solution: `from builder.skills import Skill, SkillSet

SKILL_MD = '''---
name: translator
description: 한국어 ↔ 영어 번역 요청에 사용. "영어로 번역해줘" 같은 요청
keywords: 번역, 영어로, translate
---
# 번역
1. 뜻을 바꾸지 않고 자연스럽게 옮긴다.
'''
t = Skill.from_md(SKILL_MD)
ss = SkillSet([Skill('report-writer', '보고서 작성에 사용', keywords='보고서'), t])
print(ss.select('영어로 번역해줘: 안녕'))`, notes: '<p>⏱ 8분. 순회하며 description 에 “언제”가 있는지 확인합니다. 빨리 끝난 학생은 실습 15-2(키워드 다듬기)로.</p>' },
          { layout: 'summary', title: '정리', bullets: ['스킬 = <b>SKILL.md</b>(name · description · 지시문) + references/ + scripts/', '<b>점진적 로딩</b>: 목록(항상) → 지시문(선택 시) → 자료 · 스크립트(필요 시)', 'description = <b>무엇을 + 언제</b> — 선택의 유일한 근거', '<code>Skill · from_md · to_md · SkillSet.select · build_system · tools_for · apply</code>', '다음 교시: 에이전트에 붙이고, 평가하고, 플랫폼에 올리기'], notes: '<p>⏱ 정리 5분. 출구 질문: “여러분 스킬의 description 을 한 문장으로.”</p>' }
        ]
      },
      {
        id: 'ag15-2',
        title: '스킬을 에이전트와 플랫폼에 붙이기',
        minutes: 50,
        goals: ['조립된 시스템 프롬프트와 도구로 al.Agent 를 실행하고, 작업에 따라 다른 스킬이 켜지는 것을 확인한다', 'LLM 기반 선택과 키워드 선택의 차이를 알고, 테스트 세트로 선택 정확도를 평가한다', '스킬 · 도구 · 시스템 프롬프트 · RAG · MCP 의 역할을 구분하고, Claude Code · claude.ai · API · Managed Agents · agentBuilder 에 스킬을 붙이는 방법을 설명한다'],
        flow: [['스킬 → 에이전트 실행', 12], ['LLM 선택과 평가', 10], ['스킬 vs 도구 vs 프롬프트 vs RAG', 6], ['플랫폼에 붙이기', 12], ['실습 · 정리', 10]],
        content: [
          { type: 'p', html: '1교시에서 만든 <code>(system, tools, chosen)</code> 은 그 자체로는 문자열과 목록일 뿐입니다. 이번 교시에는 이것을 04차시의 <code>al.Agent</code> 에 넣어 <b>실제로 일하는 스킬 비서</b>를 만들고, 선택 방식을 LLM 으로 바꿔 보고, 선택이 얼마나 정확한지 <b>테스트 세트</b>로 재 봅니다. 마지막으로 같은 SKILL.md 폴더가 Claude Code · claude.ai · Messages API · Managed Agents · agentBuilder 에 각각 어떻게 들어가는지 정리합니다.' },
          { type: 'h', text: '스킬 → 에이전트: system 과 tools 를 그대로 넘기기' },
          { type: 'figure', html: FIG_AGENT, caption: '그림 15-7. 작업 → 스킬 선택 → 프롬프트 조립 · 도구 활성화 → al.Agent 실행. 에이전트 자체는 04차시와 같고, 들어가는 system 과 tools 만 작업마다 바뀝니다.' },
          { type: 'code', title: '예제 15-8. 스킬 비서 — 작업마다 다른 지시문 · 도구로 실행', code: `import agentlab as al
from builder.skills import Skill, SkillSet

llm = al.LLM()
ss = SkillSet([
    Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용한다',
          instructions='# 보고서 작성\\n1. 제목 · 요약(3줄) · 본문 순서로 쓴다.\\n2. 숫자는 표로 정리한다.',
          keywords='보고서, 요약, 리포트'),
    Skill('data-cleaner', '숫자 데이터 정리 · 합계 · 평균 계산 요청에 사용한다',
          instructions='# 데이터 정리\\n1. 합계 · 평균은 반드시 계산기 도구로 계산한다.\\n2. 계산식을 함께 적는다.',
          keywords='데이터, 합계, 평균, 매출, 숫자', tools=[al.calculator]),
    Skill('meeting-notes', '회의록 · 회의 내용 정리 요청에 사용',
          instructions='# 회의록 정리\\n1. 결정 사항 번호 목록 → 2. 할 일 표(할 일 | 담당자 | 기한) → 3. 다음 안건',
          keywords='회의, 회의록, 미팅'),
])
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.'

def assistant(task):
    system, tools, chosen = ss.apply(task, base_system=BASE, llm=llm, log=print)
    agent = al.Agent(llm, tools=tools, system=system, verbose=True)   # 04차시의 에이전트 그대로
    return agent.run(task)

print('👤 작업 1')
print('🤖', assistant('매출 합계를 계산해줘: 120 + 135 + 150'))
print()
print('👤 작업 2')
print('🤖', assistant('어제 회의 내용 정리해줘: 예산 승인됨. 김대리가 금요일까지 견적서 작성.'))
print()
print('LLM 호출 횟수:', llm.calls)`,
            expect: `👤 작업 1
📚 스킬 선택: data-cleaner
🔧 도구 호출 1: calculator({"expression": "120 + 135 + 150"})
👁 관찰: {"expression": "120 + 135 + 150", "result": 405}
✅ 최종 답: [비서] 계산 결과는 405 입니다.
🤖 [비서] 계산 결과는 405 입니다.

👤 작업 2
📚 스킬 선택: meeting-notes
✅ 최종 답: [비서] 요약: 어제 회의: 예산 승인됨 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.
🤖 [비서] 요약: 어제 회의: 예산 승인됨 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.

LLM 호출 횟수: 3`,
            desc: '작업 1 에서는 data-cleaner 가 켜져 <b>계산기 도구가 보이고</b> 에이전트가 도구를 호출합니다. 작업 2 에서는 meeting-notes 가 켜지고 도구는 없습니다 — 같은 <code>assistant()</code> 함수인데 작업마다 프롬프트와 도구가 다릅니다. 예시 출력은 모의 LLM 기준이라 답이 짧지만, 🔑 키를 넣으면 작업 2 의 답이 지시문대로 “결정 사항 → 할 일 표 → 다음 안건” 형식으로 나옵니다.' },
          { type: 'callout', kind: 'tip', title: '스킬 선택은 LLM 호출이 아니다 (키워드 모드)', html: '위 예제에서 LLM 호출 횟수는 에이전트가 쓴 것뿐입니다. 키워드 선택은 파이썬 문자열 비교이므로 <b>비용 0, 지연 0, 결과 결정적</b>입니다. 대신 “분기 실적 문서” 처럼 키워드에 없는 표현은 놓칩니다. 그래서 <code>mode=\'auto\'</code> 는 “키워드로 먼저, 하나도 안 걸리면 LLM 에게”라는 절충안입니다.' },
          { type: 'h', text: 'LLM 에게 고르게 하기: select(..., llm=llm)' },
          { type: 'p', html: '공식 Skills 에서는 선택을 <b>모델이</b> 합니다 — 1단계 목록을 읽고 작업과 맞는 스킬의 SKILL.md 를 스스로 읽습니다. 우리 구현에서도 <code>select(작업, llm=llm, mode=\'llm\')</code> 을 주면 LLM 에게 목록과 작업을 보여 주고 <code>{"skills": ["이름", …]}</code> JSON 으로 답하게 합니다(03차시 json_mode). 키워드가 없어도 의미로 고를 수 있는 대신 호출 비용이 들고 결과가 바뀔 수 있습니다.' },
          { type: 'code', title: '예제 15-9. 키워드 vs LLM 선택 — 키워드에 없는 표현', code: `import agentlab as al
from builder.skills import Skill, SkillSet

ss = SkillSet([
    Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용한다', instructions='# 보고서', keywords='보고서, 요약, 리포트'),
    Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산 요청에 사용한다', instructions='# 데이터', keywords='합계, 평균, 숫자'),
    Skill('meeting-notes', '회의록 · 회의 내용 정리 요청에 사용', instructions='# 회의록', keywords='회의, 회의록'),
])
q = '분기 실적을 정리한 문서가 필요해'          # 키워드(보고서 · 요약 · 리포트)가 하나도 없다

print('키워드 모드:', ss.select(q, mode='keyword'))

# 모의 LLM 은 의미를 모르므로 라우터 답을 미리 정해 준다 (🔑 키가 있으면 실제 모델이 고른다)
llm = al.LLM(mock_responses=['{"skills": ["report-writer"]}'])
print('LLM 모드   :', ss.select(q, llm=llm, mode='llm'), '· LLM 호출', llm.calls, '회')

# auto: 키워드가 걸리면 LLM 을 부르지 않는다
print('auto 모드  :', ss.select('매출 합계 구해줘', llm=llm, mode='auto'), '· LLM 호출', llm.calls, '회')
print('auto 모드  :', ss.select('오늘 날씨 어때?', llm=al.LLM(mock_responses=['{"skills": []}']), mode='auto'))`,
            expect: `키워드 모드: []
LLM 모드   : [Skill(report-writer)] · LLM 호출 1 회
auto 모드  : [Skill(data-cleaner)] · LLM 호출 1 회
auto 모드  : []`,
            desc: '키워드 모드는 빈 목록이지만 LLM 모드는 “실적 문서 = 보고서”라고 이해해 report-writer 를 고릅니다(여기서는 <code>mock_responses</code> 로 라우터의 답을 정해 두었습니다 — 모의 LLM 은 의미를 모르기 때문입니다). auto 모드에서 “매출 합계” 는 키워드가 걸려 LLM 호출 수가 늘지 않았고, “날씨” 는 LLM 까지 갔지만 빈 목록을 돌려받았습니다. 🔑 키가 있으면 <code>mock_responses</code> 없이 실제 모델이 고릅니다.' },
          { type: 'h', text: '선택이 얼마나 정확한가: 테스트 세트로 평가' },
          { type: 'p', html: '13차시에서 에이전트를 평가할 때 <b>테스트 세트</b>(입력 → 기대 출력)를 만들었듯, 스킬 선택도 “<b>이 작업 → 이 스킬</b>”(아무것도 안 골라야 하면 <code>None</code>) 쌍을 모아 정확도를 잽니다. description 과 keywords 를 고칠 때마다 다시 돌려 보면 좋아졌는지 나빠졌는지 바로 알 수 있습니다.' },
          { type: 'code', title: '예제 15-10. 스킬 선택 정확도 평가 — description · keywords 를 고치고 다시 재기', code: `from builder.skills import Skill, SkillSet

TESTS = [                                             # (작업, 기대 스킬 또는 None)
    ('이번 분기 매출 보고서 써줘', 'report-writer'),
    ('120 + 135 합계 구해줘', 'data-cleaner'),
    ('어제 회의 내용 정리해줘', 'meeting-notes'),
    ('분기 실적을 정리한 문서가 필요해', 'report-writer'),
    ('지난 미팅 액션 아이템 뽑아줘', 'meeting-notes'),
    ('오늘 날씨 어때?', None),
    ('안녕, 넌 누구니?', None),
]

def evaluate(ss, tests, label):
    ok = 0
    print(f'=== {label}')
    for q, want in tests:
        got = [s.name for s in ss.select(q, mode='keyword')]
        hit = (want in got) if want else (not got)
        ok += hit
        print('  ', '✅' if hit else '❌', f'{q:<22} → {got} / 기대 {want}')
    print(f'   정확도 {ok}/{len(tests)} = {ok / len(tests):.0%}')
    return ok

report = Skill('report-writer', '보고서 · 요약문 · 리포트 작성 요청에 사용', keywords='보고서, 요약, 리포트')
cleaner = Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산 요청에 사용', keywords='합계, 평균, 숫자')
meeting = Skill('meeting-notes', '회의록 · 회의 내용 정리 요청에 사용', keywords='회의, 회의록')
ss = SkillSet([report, cleaner, meeting])
evaluate(ss, TESTS, '1차: 처음 쓴 키워드')

report.keywords += ['문서', '실적']                  # 놓친 표현 보강
meeting.keywords += ['미팅', '액션 아이템']
evaluate(ss, TESTS, '2차: 키워드 보강 후')`,
            expect: `=== 1차: 처음 쓴 키워드
   ✅ 이번 분기 매출 보고서 써줘        → ['report-writer'] / 기대 report-writer
   ✅ 120 + 135 합계 구해줘       → ['data-cleaner'] / 기대 data-cleaner
   ✅ 어제 회의 내용 정리해줘          → ['meeting-notes'] / 기대 meeting-notes
   ❌ 분기 실적을 정리한 문서가 필요해     → [] / 기대 report-writer
   ❌ 지난 미팅 액션 아이템 뽑아줘       → [] / 기대 meeting-notes
   ✅ 오늘 날씨 어때?              → [] / 기대 None
   ✅ 안녕, 넌 누구니?             → [] / 기대 None
   정확도 5/7 = 71%
=== 2차: 키워드 보강 후
   ✅ 이번 분기 매출 보고서 써줘        → ['report-writer'] / 기대 report-writer
   ✅ 120 + 135 합계 구해줘       → ['data-cleaner'] / 기대 data-cleaner
   ✅ 어제 회의 내용 정리해줘          → ['meeting-notes'] / 기대 meeting-notes
   ✅ 분기 실적을 정리한 문서가 필요해     → ['report-writer'] / 기대 report-writer
   ✅ 지난 미팅 액션 아이템 뽑아줘       → ['meeting-notes'] / 기대 meeting-notes
   ✅ 오늘 날씨 어때?              → [] / 기대 None
   ✅ 안녕, 넌 누구니?             → [] / 기대 None
   정확도 7/7 = 100%`,
            desc: '1차에서 틀린 두 항목은 모두 “사용자의 표현이 키워드에 없어서” 였습니다. 테스트 세트가 있으면 무엇을 보강할지가 바로 보이고, 보강이 다른 항목을 망치지 않았는지도 확인됩니다. 실제 서비스라면 사용자 로그에서 작업 문장을 모아 테스트 세트를 키워 갑니다. (LLM 모드를 평가하려면 <code>mode=\'llm\'</code> 과 실제 키가 필요합니다.)' },
          { type: 'h', text: '스킬 vs 도구 vs 시스템 프롬프트 vs RAG vs MCP' },
          { type: 'p', html: '이쯤에서 헷갈리기 쉬운 다섯 가지를 정리합니다. 모두 “에이전트에 무언가를 더해 주는” 장치지만 <b>더해 주는 것</b>이 다릅니다. 스킬은 나머지 넷을 대체하지 않습니다 — 오히려 스킬 안에 도구를 묶고, 자료를 넣고, 지시문을 담는 <b>포장</b>입니다.' },
          { type: 'figure', html: FIG_COMPARE, caption: '그림 15-8. 다섯 장치가 에이전트에 더해 주는 것. 시스템 프롬프트 = 누구로서, 도구 = 무엇을 할 수 있나, RAG = 무엇을 아나, MCP = 어디서 가져오나, 스킬 = 어떻게 일하나.' },
          { type: 'table', head: ['', '시스템 프롬프트 (03)', '도구 (04)', 'RAG (05)', 'MCP (14)', '스킬 (15)'], rows: [
            ['더해 주는 것', '정체성 · 말투 · 제약', '함수 호출 능력', '관련 문서 조각(사실)', '도구 · 리소스 연결 표준', '절차 · 형식 · 자료 · 도구 묶음'],
            ['형태', '문자열', '함수 + 스키마', '벡터 저장소 + 검색', '서버 (JSON-RPC)', '폴더 (SKILL.md + 파일)'],
            ['언제 들어가나', '항상', '정의는 항상, 실행은 호출 시', '질문마다 검색', '연결 시 목록, 호출 시 실행', '목록 항상, 지시문은 선택 시'],
            ['선택 주체', '개발자', 'LLM (호출 여부)', '유사도 검색', 'LLM (도구 호출)', 'LLM 또는 라우터 (description)'],
            ['고치려면', '프롬프트 수정', '코드 수정', '문서 추가', '서버 수정', 'SKILL.md 수정 (코드 변경 없음)'],
            ['비유', '명함 · 성격', '손발', '참고 서적', '전원 · 콘센트 규격', '업무 매뉴얼']
          ], caption: '다섯 장치의 비교. 괄호 안은 배운 차시. 실무 에이전트는 다섯을 함께 씁니다 — 예: 비서 역할(프롬프트) + MCP 로 받은 도구 + 사내 규정 RAG + 보고서 스킬.' },
          { type: 'callout', kind: 'more', title: '스킬 ≠ 파인튜닝', html: '스킬을 추가해도 모델의 <b>가중치는 그대로</b>입니다. 스킬은 “선택되면 컨텍스트에 들어가는 문서”일 뿐이므로, 모델이 원래 못 하는 일(예: 모르는 언어)을 스킬로 할 수 있게 되지는 않습니다. 대신 파인튜닝과 달리 <b>즉시 수정 · 공유 · 삭제</b>가 되고, 어떤 모델에도 같은 폴더를 쓸 수 있습니다. “절차와 형식을 가르친다”는 목적에는 파인튜닝보다 스킬이 훨씬 싸고 빠릅니다.' },
          { type: 'h', text: '스킬이 꽂히는 곳: Claude Code · claude.ai · API · Managed Agents · agentBuilder' },
          { type: 'p', html: 'SKILL.md 폴더 형식은 하나지만 올리는 곳은 여럿입니다. 공식 문서(문서 기준 2026-10)를 기준으로 정리하면 다음과 같습니다. 중요한 제약 하나 — <b>한 곳에 올린 스킬이 다른 곳으로 자동 동기화되지 않습니다</b>. claude.ai 에 올린 스킬은 API 에 따로 올려야 하고, Claude Code 스킬은 파일 기반이라 둘과 별개입니다.' },
          { type: 'figure', html: FIG_WHERE, caption: '그림 15-9. 같은 스킬 폴더가 들어가는 다섯 곳. 아래 표와 코드 조각은 모두 문서 기준 2026-10 이며, 세부 이름(헤더 · 버전)은 바뀔 수 있습니다.' },
          { type: 'table', head: ['어디', '어떻게 넣나', '어떻게 쓰이나', '공유 범위 · 비고'], rows: [
            ['💻 Claude Code', '폴더를 <code>~/.claude/skills/&lt;이름&gt;/</code>(개인) 또는 <code>.claude/skills/&lt;이름&gt;/</code>(프로젝트)에 복사', '<code>/이름 인자</code> 로 직접 호출하거나, description 이 맞으면 자동 선택. 플러그인으로 배포 가능', '개인 · 프로젝트. 네트워크 등 PC 와 같은 권한'],
            ['🌐 claude.ai', '폴더를 zip 으로 묶어 설정 › 기능(Features)에서 업로드', '대화 중 자동 선택. 사전 제공 스킬(pptx · xlsx · docx · pdf)은 설정 없이 동작', 'Pro · Max · Team · Enterprise, 코드 실행 켜야 함. 사용자 개인 단위'],
            ['🧪 Messages API', '<code>POST /v1/skills</code> 에 파일 업로드 → <code>skill_id</code> 받음', '요청의 <code>container.skills</code> 에 id 지정 + <b>코드 실행 도구</b> 필수', '워크스페이스 전체. 요청당 최대 20개 · 업로드 30MB 미만 · 샌드박스(네트워크 없음)'],
            ['☁️ Managed Agents', '같은 Skills API 로 업로드, 또는 저장소의 <code>.claude/skills/</code> 를 세션에 마운트', '<code>agents.create(skills=[{type, skill_id, version}])</code>', '세션당 최대 500개. 스킬이 많을수록 샌드박스 시작이 느려짐'],
            ['🧩 agentBuilder (Part 6)', '📚 Skill 정의 노드에 입력하거나 📄 SKILL.md 가져오기 노드에 붙여 넣기', '🤖 에이전트의 스킬 포트에 연결 → 실행 로그에 📚 스킬 선택', '📁 SKILL.md 버튼으로 위 네 곳에 올릴 폴더 zip 내보내기']
          ], caption: '스킬을 붙이는 다섯 곳 (문서 기준 2026-10). 아래 코드 조각은 Colab · 로컬 참고용(run: false)입니다.' },
          { type: 'code', title: 'Claude Code — 프로젝트 스킬 폴더와 호출 (참고 · 로컬 터미널)', run: false, code: `# 1) 폴더 구조 (저장소 안)
#   .claude/skills/report-writer/SKILL.md
#   .claude/skills/report-writer/references/tone.md
#   ~/.claude/skills/...        ← 개인 스킬은 홈 폴더에

# 2) SKILL.md — Claude Code 전용 frontmatter 를 더 쓸 수 있다
# ---
# name: report-writer
# description: 보고서 · 요약문 작성 요청에 사용. "보고서 써줘" 같은 요청.
# disable-model-invocation: false     # true 면 /report-writer 로만 호출(자동 선택 금지)
# user-invocable: true                 # false 면 / 메뉴에서 숨김(모델만 사용)
# allowed-tools: Bash(git *) ReadFile  # 이 스킬이 켜진 턴에 미리 허용할 도구
# ---
# $ARGUMENTS 에 대한 보고서를 쓴다. 톤은 references/tone.md 를 따른다.

# 3) 사용 — 직접 호출 또는 자동 선택
#   > /report-writer 3월 매출 150, 2월 135
#   > 3월 매출 정리해서 보고서로 써줘      ← description 이 맞으면 자동으로 스킬 로딩`,
            desc: 'Claude Code 의 스킬은 파일만 두면 끝입니다. <code>$ARGUMENTS</code> 는 <code>/이름</code> 뒤에 쓴 인자로 치환됩니다. description 과 when_to_use 를 합쳐 1,536자에서 잘리므로 짧고 구체적으로 씁니다 (문서 기준 2026-10).' },
          { type: 'code', title: 'Messages API — 스킬 업로드와 container.skills (Colab 에서 실행 · ANTHROPIC_API_KEY 필요)', run: false, code: `# pip install anthropic   /  문서 기준 2026-10 — 모델 이름 · 도구 버전은 최신 문서 확인
import anthropic
from anthropic.lib import files_from_dir

client = anthropic.Anthropic()                     # ANTHROPIC_API_KEY 환경 변수

# 1) 커스텀 스킬 업로드: 폴더 루트에 SKILL.md 가 있어야 한다 (30MB 미만)
skill = client.skills.create(files=files_from_dir('skills/report-writer'))
print('skill_id:', skill.id, '/ version:', skill.latest_version_id)

# 2) 요청에 스킬 지정 — 코드 실행 도구가 반드시 함께 있어야 한다
response = client.messages.create(
    model='claude-opus-5-5',
    max_tokens=2048,
    container={'skills': [
        {'type': 'custom', 'skill_id': skill.id, 'version': 'latest'},
        {'type': 'anthropic', 'skill_id': 'xlsx', 'version': 'latest'},   # 사전 제공 스킬
    ]},
    tools=[{'type': 'code_execution_20250825', 'name': 'code_execution'}],
    messages=[{'role': 'user', 'content': '3월 매출 150, 2월 135 — 보고서와 엑셀 표를 만들어줘'}],
)
print(response.content)`,
            desc: '스킬은 코드 실행 컨테이너(샌드박스 VM) 안의 파일로 존재하므로 <code>tools</code> 에 코드 실행 도구가 없으면 동작하지 않습니다. 요청당 스킬은 최대 20개, 커스텀 스킬은 워크스페이스 전체가 공유합니다. 사전 제공 스킬 id 는 <code>pptx · xlsx · docx · pdf</code> 입니다 (문서 기준 2026-10).' },
          { type: 'code', title: 'Managed Agents — skills 배열 (참고 · 베타, 문서 기준 2026-10)', run: false, code: `# 베타 헤더: anthropic-beta: managed-agents-2026-04-01
agent = client.beta.agents.create(
    name='Report Assistant',
    model='claude-opus-5-5',
    system='당신은 보고서 비서입니다. 활성화된 스킬의 지시를 따릅니다.',
    skills=[
        {'type': 'anthropic', 'skill_id': 'xlsx'},                       # version 생략 = latest
        {'type': 'custom', 'skill_id': skill.id, 'version': 'latest'},   # 위에서 업로드한 스킬
    ],
)
# 또는: 세션에 GitHub 저장소를 마운트하면 저장소 루트의 .claude/skills/<이름>/SKILL.md 가
#       업로드 없이 자동으로 발견된다 (한 단계 깊이만 · 세션 시작 시 1회 스캔)`,
            desc: 'Managed Agents 는 서버가 에이전트 루프를 돌려 주는 방식입니다(13차시 배포 참고). 스킬은 에이전트 생성 시 <code>skills</code> 배열로 붙이거나, 저장소의 <code>.claude/skills/</code> 를 그대로 씁니다 — Claude Code 와 같은 폴더 규칙이라 한 번 만든 스킬을 양쪽에 쓸 수 있습니다.' },
          { type: 'callout', kind: 'info', title: 'claude.ai 에 올리기', html: '① 스킬 폴더(<code>report-writer/SKILL.md</code> + references/)를 <b>zip</b> 으로 묶습니다 (Colab 노트북 15 에서 만듭니다). ② claude.ai 설정 › 기능(Features)에서 코드 실행을 켜고 zip 을 업로드합니다. ③ 대화에서 “보고서 써줘”라고 하면 description 이 맞을 때 자동으로 쓰입니다. 사용자 개인 단위로만 올라가며 조직 전체 배포 · 관리자 중앙 관리는 지원하지 않습니다 (문서 기준 2026-10).' },
          { type: 'h', text: 'agentBuilder 의 스킬 노드 (Part 6 예고)' },
          { type: 'p', html: 'Part 6(16~17차시)에서 쓰게 될 agentBuilder 에는 이번 차시 내용이 노드 세 개로 들어 있습니다: 📚 <b>Skill 정의</b>(이름 · 설명 · 키워드 · 지시문 · 참고 자료 입력, 도구 포트), 📄 <b>SKILL.md 가져오기</b>(Claude Code 용 SKILL.md 텍스트 붙여 넣기), 🧮 <b>스킬 선택 · 프롬프트 조립</b>(선택 과정을 결과로 확인). 🤖 에이전트의 <b>스킬 포트</b>에 연결하면 실행 로그에 “📚 스킬 선택: …”이 찍히고, 🐍 코드 탭의 📁 SKILL.md 버튼이 폴더 zip 을 내려 줍니다 — 예제 15-7 의 <code>skill_files</code> 가 하는 일입니다.' },
          { type: 'figure', html: '<img src="img/builder/26_skill_panel.png" alt="agentBuilder Skill 정의 노드의 속성 패널: 설명 · 키워드 · 지시문 · 참고 자료" loading="lazy">', caption: '그림 15-10. 빌더의 📚 Skill 정의 속성 — 예제 15-1 의 <code>Skill(...)</code> 인자와 1:1 로 대응합니다 (설명 · 키워드 · 지시문 · 참고 자료).' },
          { type: 'h', text: '이 강좌를 위한 스킬 하나 만들어 보기' },
          { type: 'p', html: '마지막으로 “우리 일”에 쓸 스킬을 만들어 봅니다. 이 강좌의 차시를 쓸 때마다 반복하는 규칙(교시 구조 · 그림 · 예제 · 실습 · 퀴즈)을 <code>lesson-writer</code> 스킬로 적고, 퀴즈 출제 규칙을 <code>quiz-maker</code> 스킬로 분리합니다. 두 스킬을 가진 비서에게 서로 다른 두 작업을 시켜 어떤 스킬이 켜지는지, 조립된 프롬프트에 무엇이 들어가는지 확인합니다.' },
          { type: 'code', title: '예제 15-11. 강좌 차시 작성 스킬 + 퀴즈 출제 스킬 — SKILL.md 두 장으로 비서 만들기', code: `# ===== File: skills/lesson-writer/SKILL.md =====
---
name: lesson-writer
description: 강좌 차시(수업) 개요 · 교시 계획 작성 요청에 사용. "차시 개요 써줘", "수업 계획 짜줘" 같은 요청
keywords: 차시, 교시, 수업, 강의, 개요
---
# 차시 작성
1. 학습 목표 3개 → 교시별 흐름(도입 · 개념 · 실습 · 정리, 합계 50분) → 핵심 그림 1개 제안.
2. 예제는 "원리 → 그림 → 코드" 순서로, 실습은 난이도 1~3 으로 나눈다.
3. 마지막 줄에 다음 차시와의 연결을 한 문장으로 쓴다.
# ===== File: skills/quiz-maker/SKILL.md =====
---
name: quiz-maker
description: 객관식 퀴즈 · 확인 문제 출제 요청에 사용. "퀴즈 만들어줘", "확인 문제 내줘" 같은 요청
keywords: 퀴즈, 문제, 출제, 객관식
---
# 퀴즈 출제
1. 문항은 4지선다, 정답은 1개, 오답은 흔한 오개념으로 만든다.
2. 각 문항에 해설 1~2문장을 붙인다.
3. 정답 번호가 한쪽에 몰리지 않게 섞는다.
# ===== File: main.py =====
import agentlab as al
from builder.skills import Skill, SkillSet

llm = al.LLM()
ss = SkillSet([Skill.from_md(open(p, encoding='utf-8').read())
               for p in ['skills/lesson-writer/SKILL.md', 'skills/quiz-maker/SKILL.md']])
print(ss.catalog())
print()
for task in ['16차시 agentBuilder 수업 개요 써줘', '점진적 로딩에 대한 확인 문제 3개 내줘']:
    system, tools, chosen = ss.apply(task, base_system='당신은 강의 설계 비서입니다.', llm=llm, log=print)
    block = system.split('## 스킬 활성화: ')[1].split('\\n')[:2]      # 활성화된 지시문 첫 두 줄
    print('   활성 지시문:', ' / '.join(block))
    agent = al.Agent(llm, tools=tools, system=system)
    print('   🤖', agent.run(task).split('\\n')[0])
    print()`,
            expect: `사용할 수 있는 스킬 (작업에 맞으면 해당 스킬의 지시를 따른다):
- lesson-writer: 강좌 차시(수업) 개요 · 교시 계획 작성 요청에 사용. "차시 개요 써줘", "수업 계획 짜줘" 같은 요청
- quiz-maker: 객관식 퀴즈 · 확인 문제 출제 요청에 사용. "퀴즈 만들어줘", "확인 문제 내줘" 같은 요청

📚 스킬 선택: lesson-writer
   활성 지시문: lesson-writer / # 차시 작성
   🤖 [강의 설계 비서] AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.

📚 스킬 선택: quiz-maker
   활성 지시문: quiz-maker / # 퀴즈 출제
   🤖 [강의 설계 비서] 알겠습니다. "점진적 로딩에 대한 확인 문제 3개 내줘" 을(를) 처리했습니다.`,
            desc: '스킬 두 장을 파일로 두고 <code>from_md</code> 로 읽어 <code>SkillSet</code> 을 만들었습니다. 작업에 따라 lesson-writer 또는 quiz-maker 가 켜지고 그 지시문만 프롬프트에 들어갑니다. 이 두 폴더를 그대로 <code>.claude/skills/</code> 에 복사하면 Claude Code 에서 <code>/lesson-writer 16차시</code> 로 부를 수 있습니다 — 사실 이 강좌의 차시 작성 가이드(docs/LESSON_GUIDE.md)가 바로 그런 스킬의 긴 버전입니다.' },
          { type: 'colab', title: 'Colab 실습 15 — 스킬 폴더 만들기 · zip · 실제 LLM 으로 선택', html: '<p>Colab 노트북에서는 ① agentBuilder 저장소를 받아 <code>builder.skills</code> 와 <code>skills_apply()</code> 를 쓰고, ② <code>%%writefile</code> 로 <code>SKILL.md</code> + <code>references/</code> 폴더를 실제로 만들어 <b>zip</b> 으로 묶고(claude.ai 업로드용), ③ <b>실제 Gemini 모델</b>로 LLM 선택(<code>mode=\'llm\'</code>)을 돌려 키워드 선택과 정확도를 비교합니다. ④ 선택 과제로 Claude Skills API 업로드 · <code>container.skills</code> 호출 셀이 있습니다 (ANTHROPIC_API_KEY 가 있을 때만). API 키는 Colab 🔑 Secrets 에 넣습니다.</p>' },
          { type: 'callout', kind: 'info', title: '수업 준비 체크리스트', teacher: true, html: '<ul><li>예제 15-6 · 15-7 은 <code>builder/16_skills.json</code> 을 읽습니다 — 브라우저 작업 폴더에 자동으로 놓이므로 별도 준비는 없지만, 수업 전 한 번 실행해 로딩(Pyodide 첫 실행 10~20초)을 끝내 두세요.</li><li>교사 PC 에 🔑 키가 있으면 예제 15-8 작업 2 에서 “결정 사항 → 할 일 표” 형식이 실제로 나오는 것을 보여 줄 수 있습니다 — 스킬의 효과가 가장 잘 보이는 순간입니다. 키가 없으면 모의 LLM 답이 짧다는 점을 미리 말해 두세요.</li><li>예제 15-9 의 <code>mock_responses</code> 는 “모의 LLM 이 의미를 모르기 때문”임을 설명하지 않으면 학생이 “LLM 선택이 가짜 아니냐”고 느낄 수 있습니다. 키가 있으면 그 줄을 지우고 실행해 보여 주세요.</li><li>플랫폼 표와 run:false 코드는 문서 기준 2026-10 입니다. 수업 전 공식 문서에서 헤더 · 모델 이름 · 한도가 바뀌지 않았는지 확인하세요.</li><li>agentBuilder 는 Part 6 에서 다룹니다. 이번 차시에서는 캡처 3장과 예제 16 실행만으로 “스킬 노드가 있다”는 정도로 소개하고 깊이 들어가지 않습니다.</li></ul>' },
          { type: 'callout', kind: 'warn', title: '자주 나오는 오개념', teacher: true, html: '<ul><li><b>“스킬을 넣으면 모델이 그 분야를 학습한다”</b> → 아닙니다. 파인튜닝이 아니라 선택될 때 컨텍스트에 들어가는 문서입니다. 가중치는 그대로, 즉시 수정 · 삭제 가능.</li><li><b>“지시문을 잘 쓰면 선택도 잘 된다”</b> → 선택은 오직 1단계 정보(name · description)로 합니다. 지시문이 아무리 좋아도 description 에 “언제”가 없으면 선택되지 않습니다. 실습 15-2 · 예제 15-10 으로 체감시키세요.</li><li><b>“스킬 = 도구”</b> → 도구는 함수 하나, 스킬은 절차 · 형식 · 자료 · (도구들)의 묶음입니다. 우리 구현에서 도구는 스킬 안에 들어가고 스킬이 켜질 때만 보입니다.</li><li><b>“스킬이 많을수록 좋다”</b> → 1단계 목록도 토큰이고(스킬당 ~100), description 이 겹치면 오선택이 늘어납니다. 필요한 스킬만, 경계가 분명하게.</li><li><b>“한 곳에 올리면 어디서나 쓴다”</b> → claude.ai · API · Claude Code 는 서로 동기화되지 않습니다. 각각 올려야 합니다.</li></ul>' },
          { type: 'table', teacher: true, head: ['평가 항목', '상 (3)', '중 (2)', '하 (1)'], rows: [
            ['SKILL.md 작성', 'name 규칙 준수 + description 에 무엇을 · 언제 · 사용자 표현이 모두 있음 + 지시문이 절차 · 형식 · 예시로 구성', 'description 에 무엇을 만 있음, 지시문은 절차만', 'frontmatter 가 없거나 파싱 실패'],
            ['선택 · 조립', 'select → build_system → tools_for(또는 apply)로 조립해 Agent 에 연결하고, 두 작업에서 다른 스킬이 켜짐을 보임', '조립은 했으나 Agent 연결 없음 / 작업 하나만', '스킬 전부를 항상 프롬프트에 넣음'],
            ['평가', '테스트 세트 5개 이상 + None 항목 포함 + 보강 전후 정확도 비교', '테스트 세트는 있으나 보강 비교 없음', '수동 확인만'],
            ['도구 결합', '스킬에 도구를 묶어 선택될 때만 활성화됨을 로그로 확인', '도구를 Agent 에 직접 넣음', '도구 없음']
          ], caption: '실습 15-3 · 15-4 평가 루브릭' },
          { type: 'callout', kind: 'more', title: '확장 활동', teacher: true, html: '<ul><li><b>스킬 교환:</b> 짝과 SKILL.md 를 바꿔 상대 스킬을 내 SkillSet 에 넣고 테스트 세트를 돌려 봅니다 — “남이 쓴 description 으로도 잘 선택되나?”</li><li><b>Claude Code 가 있는 학생:</b> 예제 15-11 의 두 폴더를 <code>.claude/skills/</code> 에 복사하고 <code>/lesson-writer</code> 로 호출해 봅니다.</li><li><b>14차시와 연결:</b> MCP 서버에서 받은 도구(<code>MCPClient.tools()</code>)를 스킬의 <code>tools=</code> 에 넣어 “MCP 도구가 딸린 스킬”을 만들어 봅니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 15-3. 스킬에 도구 묶기 — 날씨 안내 스킬', level: 2,
            desc: '<p>04차시의 <code>al.get_weather</code> 도구를 가진 <b>날씨 안내 스킬</b>(<code>weather-guide</code>)을 만드세요. description 은 “날씨 · 기온 · 우산 여부 질문에 사용”, keywords 는 <code>날씨, 기온, 우산, 비</code>, 지시문에는 “반드시 get_weather 도구로 조회 후 답한다 · 우산 필요 여부를 한 줄로” 를 적습니다. 보고서 스킬과 함께 SkillSet 에 넣고, <code>\'부산 날씨 어때?\'</code> 와 <code>\'매출 보고서 써줘\'</code> 두 작업에 대해 <code>apply()</code> 한 뒤 <b>활성 도구 목록</b>을 출력하세요 — 날씨 작업에서만 <code>get_weather</code> 가 보여야 합니다. (도구를 실제로 호출하지는 않습니다.)</p>',
            hint: '<code>Skill(..., tools=[al.get_weather])</code>. <code>apply()</code> 의 두 번째 반환값이 도구 목록입니다: <code>[t.name for t in tools]</code>.',
            starter: `import agentlab as al
from builder.skills import Skill, SkillSet

weather = Skill('weather-guide', 'TODO: 날씨 · 기온 · 우산 여부 질문에 사용',
                instructions='# 날씨 안내\\n1. TODO',
                keywords='TODO')                       # TODO: tools=[al.get_weather] 추가
report = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서', keywords='보고서, 요약')
ss = SkillSet([weather, report])

for task in ['부산 날씨 어때?', '매출 보고서 써줘']:
    system, tools, chosen = ss.apply(task, base_system='당신은 비서입니다.', log=print)
    print('   활성 도구:', [t.name for t in tools])
`,
            solution: `import agentlab as al
from builder.skills import Skill, SkillSet

weather = Skill('weather-guide', '날씨 · 기온 · 우산 여부 질문에 사용. "OO 날씨 어때?" 같은 요청',
                instructions='# 날씨 안내\\n1. 반드시 get_weather 도구로 조회한 뒤 답한다.\\n2. 우산 필요 여부를 한 줄로 덧붙인다.',
                keywords='날씨, 기온, 우산, 비', tools=[al.get_weather])
report = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서', keywords='보고서, 요약')
ss = SkillSet([weather, report])

for task in ['부산 날씨 어때?', '매출 보고서 써줘']:
    system, tools, chosen = ss.apply(task, base_system='당신은 비서입니다.', log=print)
    print('   활성 도구:', [t.name for t in tools])
`,
            expect: `📚 스킬 선택: weather-guide
   활성 도구: ['get_weather']
📚 스킬 선택: report-writer
   활성 도구: []`,
          },
          { title: '실습 15-4. 스킬 3개짜리 비서를 두 작업으로 돌리기', level: 3,
            desc: '<p>예제 15-8 을 바탕으로 <b>스킬 3개</b>(계산기 도구가 딸린 <code>data-cleaner</code>, <code>report-writer</code>, 실습 15-1 의 <code>translator</code>)를 가진 비서 <code>assistant(task)</code> 를 만드세요. 두 작업 — <code>\'매출 평균 구해줘: (120 + 135 + 150) / 3\'</code> 과 <code>\'다음 문장을 영어로 번역해줘: 스킬은 재사용 가능한 능력이다\'</code> — 을 실행해 각각 어떤 스킬이 선택되고, 도구가 호출되는지(verbose 로그), 마지막에 LLM 호출 횟수가 몇 번인지 출력하세요.</p>',
            hint: '<code>ss.apply(task, base_system=BASE, llm=llm, log=print)</code> → <code>al.Agent(llm, tools=tools, system=system, verbose=True).run(task)</code>. 번역 작업에서는 도구가 없어야 합니다.',
            starter: `import agentlab as al
from builder.skills import Skill, SkillSet

llm = al.LLM()
ss = SkillSet([
    Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산 요청에 사용', instructions='# 데이터 정리\\n1. 계산기 도구로 계산한다.', keywords='합계, 평균, 숫자, 매출', tools=[al.calculator]),
    Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서 작성\\n1. 제목 · 요약 · 본문', keywords='보고서, 요약'),
    # TODO: translator 스킬 추가 (keywords='번역, 영어로, translate')
])
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.'

def assistant(task):
    # TODO: ss.apply 로 system · tools 를 얻어 al.Agent(verbose=True) 로 실행
    return ''

for task in ['매출 평균 구해줘: (120 + 135 + 150) / 3', '다음 문장을 영어로 번역해줘: 스킬은 재사용 가능한 능력이다']:
    print('👤', task)
    print('🤖', assistant(task))
print('LLM 호출 횟수:', llm.calls)
`,
            solution: `import agentlab as al
from builder.skills import Skill, SkillSet

llm = al.LLM()
ss = SkillSet([
    Skill('data-cleaner', '숫자 정리 · 합계 · 평균 계산 요청에 사용', instructions='# 데이터 정리\\n1. 계산기 도구로 계산한다.', keywords='합계, 평균, 숫자, 매출', tools=[al.calculator]),
    Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서 작성\\n1. 제목 · 요약 · 본문', keywords='보고서, 요약'),
    Skill('translator', '한국어 ↔ 영어 번역 요청에 사용', instructions='# 번역\\n1. 뜻을 바꾸지 않고 자연스럽게 옮긴다.\\n2. 번역문만 출력한다.', keywords='번역, 영어로, translate'),
])
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.'

def assistant(task):
    system, tools, chosen = ss.apply(task, base_system=BASE, llm=llm, log=print)
    agent = al.Agent(llm, tools=tools, system=system, verbose=True)
    return agent.run(task)

for task in ['매출 평균 구해줘: (120 + 135 + 150) / 3', '다음 문장을 영어로 번역해줘: 스킬은 재사용 가능한 능력이다']:
    print('👤', task)
    print('🤖', assistant(task))
print('LLM 호출 횟수:', llm.calls)
`,
            expect: `👤 매출 평균 구해줘: (120 + 135 + 150) / 3
📚 스킬 선택: data-cleaner
🔧 도구 호출 1: calculator({"expression": "(120 + 135 + 150) / 3"})
👁 관찰: {"expression": "(120 + 135 + 150) / 3", "result": 135}
✅ 최종 답: [비서] 계산 결과는 135 입니다.
🤖 [비서] 계산 결과는 135 입니다.
👤 다음 문장을 영어로 번역해줘: 스킬은 재사용 가능한 능력이다
📚 스킬 선택: translator
✅ 최종 답: [비서] Translation: : 스킬은 재사용 가능한 능력이다
🤖 [비서] Translation: : 스킬은 재사용 가능한 능력이다
LLM 호출 횟수: 3`,
          }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '스킬을 에이전트와 플랫폼에 붙이기', subtitle: 'al.Agent 연결 · LLM 선택 · 평가 · Claude Code / API / Managed Agents', notes: '<p>1교시의 (system, tools, chosen) 을 실제 에이전트에 넣는 것으로 시작합니다. <b>발문:</b> “스킬이 선택되면 에이전트에서 실제로 바뀌는 두 가지는?” → 시스템 프롬프트, 도구 목록.</p><p>⏱ 12분</p>' },
          { layout: 'diagram', title: '작업 → 선택 → 조립 → 에이전트', html: FIG_AGENT, caption: '에이전트는 04차시 그대로, system 과 tools 만 바뀐다',
            notes: '<p>화살표를 따라가며 “어디서 프롬프트가 바뀌고 어디서 도구가 바뀌는지”를 짚습니다. apply() 가 가운데 세 상자를 한 번에 한다는 점.</p>' },
          { layout: 'code', title: '스킬 비서 실행', code: `import agentlab as al
from builder.skills import Skill, SkillSet

llm = al.LLM()
ss = SkillSet([
    Skill('data-cleaner', '숫자 정리 · 합계 계산에 사용', instructions='# 데이터\\n1. 계산기로 계산', keywords='합계, 평균, 매출', tools=[al.calculator]),
    Skill('meeting-notes', '회의록 정리에 사용', instructions='# 회의록\\n1. 결정 사항 → 할 일 표', keywords='회의, 회의록'),
])
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 따릅니다.'

def assistant(task):
    system, tools, chosen = ss.apply(task, base_system=BASE, llm=llm, log=print)
    return al.Agent(llm, tools=tools, system=system, verbose=True).run(task)

print(assistant('매출 합계를 계산해줘: 120 + 135 + 150'))
print(assistant('어제 회의 내용 정리해줘: 예산 승인, 김대리 견적서'))`, points: ['작업 1: data-cleaner → 계산기 호출', '작업 2: meeting-notes → 도구 없음', '같은 함수, 다른 프롬프트 · 도구'],
            notes: '<p>▶ 실행. 로그의 “📚 스킬 선택” 과 “🔧 도구 호출” 을 가리킵니다. 키가 있으면 작업 2 의 답이 표 형식으로 나오는 것을 꼭 보여 주세요.</p>' },
          { layout: 'code', title: '키워드 선택 vs LLM 선택', code: `import agentlab as al
from builder.skills import Skill, SkillSet

ss = SkillSet([
    Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', keywords='보고서, 요약'),
    Skill('data-cleaner', '숫자 정리 · 합계 계산에 사용', keywords='합계, 평균'),
])
q = '분기 실적을 정리한 문서가 필요해'       # 키워드가 하나도 없다
print('키워드:', ss.select(q, mode='keyword'))

llm = al.LLM(mock_responses=['{"skills": ["report-writer"]}'])   # 키 없을 때 라우터 답
print('LLM   :', ss.select(q, llm=llm, mode='llm'), '· 호출', llm.calls)
print('auto  :', ss.select('매출 합계 구해줘', llm=llm), '· 호출', llm.calls)`, points: ['키워드: 비용 0 · 결정적 · 표현을 놓침', 'LLM: 의미로 고름 · 호출 비용', 'auto = 키워드 먼저, 없으면 LLM'],
            notes: '<p>▶ 실행. mock_responses 가 왜 필요한지(모의 LLM 은 의미를 모른다) 꼭 설명. 키가 있으면 그 인자를 지우고 실행해 실제 모델이 고르는 것을 보여 줍니다.</p>' },
          { layout: 'code', title: '선택 정확도 평가', code: `from builder.skills import Skill, SkillSet

TESTS = [('매출 보고서 써줘', 'report-writer'), ('120 + 135 합계', 'data-cleaner'),
         ('분기 실적 문서 필요해', 'report-writer'), ('오늘 날씨 어때?', None)]
report = Skill('report-writer', '보고서 작성에 사용', keywords='보고서, 요약')
ss = SkillSet([report, Skill('data-cleaner', '숫자 정리 · 합계에 사용', keywords='합계, 평균')])

def evaluate(ss):
    ok = 0
    for q, want in TESTS:
        got = [s.name for s in ss.select(q, mode='keyword')]
        ok += (want in got) if want else (not got)
    print(f'정확도 {ok}/{len(TESTS)}')

evaluate(ss)
report.keywords += ['문서', '실적']      # 놓친 표현 보강
evaluate(ss)`, points: ['(작업, 기대 스킬 또는 None)', '고칠 때마다 다시 재기', '13차시 평가와 같은 사고방식'],
            notes: '<p>▶ 실행. 3/4 → 4/4. “None 항목은 왜 필요한가?” → 아무 스킬도 안 켜져야 하는 작업(과잉 선택 방지)을 재기 위해.</p>' },
          { layout: 'diagram', title: '스킬 vs 도구 vs 프롬프트 vs RAG vs MCP', html: FIG_COMPARE, caption: '스킬은 넷을 대체하지 않는 “포장”',
            notes: '<p>다섯 상자에 배운 차시 번호를 붙여 말합니다. <b>오개념:</b> “스킬 = 파인튜닝” → 가중치는 그대로. “스킬 = 도구” → 도구는 함수 하나, 스킬은 묶음.</p>' },
          { layout: 'table', title: '스킬이 꽂히는 곳 (문서 기준 2026-10)', head: ['어디', '넣는 법', '쓰이는 법'], rows: [
            ['Claude Code', '.claude/skills/<이름>/SKILL.md', '/이름 또는 자동 선택'],
            ['claude.ai', 'zip 업로드 (설정 › 기능)', '대화 중 자동 선택'],
            ['Messages API', 'POST /v1/skills → skill_id', 'container.skills + 코드 실행 도구'],
            ['Managed Agents', 'Skills API 또는 저장소 .claude/skills/', 'agents.create(skills=[…])'],
            ['agentBuilder', 'Skill 정의 · SKILL.md 가져오기 노드', '에이전트 스킬 포트 · 📁 내보내기']
          ], lead: '형식은 하나, 올리는 곳은 다섯 — 자동 동기화는 없다', notes: '<p>“한 곳에 올리면 어디서나 쓴다”는 오개념을 바로잡습니다. 세부 이름은 바뀔 수 있으니 문서 날짜를 함께 말해 줍니다.</p>' },
          { layout: 'diagram', title: '같은 폴더, 다섯 곳', html: FIG_WHERE, caption: '가운데 폴더를 복사 · zip · 업로드',
            notes: '<p>그림의 가운데(폴더)에서 바깥으로 화살표를 따라가며 “복사 / zip / API 업로드 / 배열 지정 / 노드” 다섯 동사를 말하게 합니다.</p>' },
          { layout: 'two', title: 'Claude Code vs Messages API', left: { title: '💻 Claude Code', bullets: ['파일만 두면 끝: <code>.claude/skills/</code>', '<code>/report-writer 인자</code> → <code>$ARGUMENTS</code>', '<code>disable-model-invocation</code> · <code>allowed-tools</code>', 'PC 와 같은 권한(네트워크 O)'] }, right: { title: '🧪 Messages API', bullets: ['<code>POST /v1/skills</code> 업로드 → <code>skill_id</code>', '<code>container.skills=[{type, skill_id, version}]</code>', '<b>코드 실행 도구 필수</b> · 요청당 20개', '샌드박스(네트워크 X) · 워크스페이스 공유'] },
            notes: '<p>둘 다 SKILL.md 는 같다는 점을 먼저, 차이는 “어디서 실행되나(내 PC vs 샌드박스)”에서 나온다는 점을 뒤에.</p>' },
          { layout: 'code', title: 'Messages API 호출 모양 (Colab · 참고)', run: false, code: `import anthropic
from anthropic.lib import files_from_dir
client = anthropic.Anthropic()

skill = client.skills.create(files=files_from_dir('skills/report-writer'))   # 업로드

response = client.messages.create(
    model='claude-opus-5-5', max_tokens=2048,
    container={'skills': [{'type': 'custom', 'skill_id': skill.id, 'version': 'latest'}]},
    tools=[{'type': 'code_execution_20250825', 'name': 'code_execution'}],   # 필수
    messages=[{'role': 'user', 'content': '3월 매출 150, 2월 135 — 보고서 써줘'}],
)`, points: ['업로드 1회 → skill_id 재사용', 'container.skills 에 지정', '코드 실행 도구가 없으면 동작 안 함'],
            notes: '<p>실행하지 않는 참고 슬라이드. 문서 기준 2026-10 — 모델 이름 · 도구 버전 문자열은 수업 전 확인. Colab 노트북 15 의 선택 셀과 같은 코드.</p>' },
          { layout: 'diagram', title: 'agentBuilder 의 스킬 노드 (Part 6 예고)', html: '<img src="img/builder/26_skill_panel.png" alt="agentBuilder Skill 정의 노드 속성 패널" loading="lazy">', caption: 'Skill(...) 인자와 1:1 — 설명 · 키워드 · 지시문 · 참고 자료',
            notes: '<p>깊이 들어가지 않습니다. “16차시에 이 화면을 직접 만진다”고만 예고. 📁 SKILL.md 버튼 = 예제 15-7 의 skill_files.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[3].q, options: QUIZ2[3].options, answer: QUIZ2[3].answer, explain: QUIZ2[3].explain, notes: '<p>오늘 가장 중요한 오개념(스킬 ≠ 파인튜닝)을 마지막으로 확인합니다.</p>' },
          { layout: 'practice', title: '실습 15-3. 스킬에 도구 묶기', desc: '<p><code>al.get_weather</code> 가 딸린 날씨 스킬을 만들고, 날씨 작업에서만 도구가 활성화되는지 확인하세요.</p>',
            starter: `import agentlab as al
from builder.skills import Skill, SkillSet

weather = Skill('weather-guide', 'TODO', instructions='# 날씨', keywords='TODO')   # TODO: tools=
report = Skill('report-writer', '보고서 작성에 사용', keywords='보고서')
ss = SkillSet([weather, report])
for task in ['부산 날씨 어때?', '매출 보고서 써줘']:
    system, tools, chosen = ss.apply(task, log=print)
    print('   활성 도구:', [t.name for t in tools])`, solution: `import agentlab as al
from builder.skills import Skill, SkillSet

weather = Skill('weather-guide', '날씨 · 기온 · 우산 여부 질문에 사용', instructions='# 날씨\\n1. get_weather 로 조회 후 답한다.',
                keywords='날씨, 기온, 우산, 비', tools=[al.get_weather])
report = Skill('report-writer', '보고서 작성에 사용', keywords='보고서')
ss = SkillSet([weather, report])
for task in ['부산 날씨 어때?', '매출 보고서 써줘']:
    system, tools, chosen = ss.apply(task, log=print)
    print('   활성 도구:', [t.name for t in tools])`, notes: '<p>⏱ 8분. “도구를 Agent 에 직접 넣는 것과 무엇이 다른가?” → 스킬이 켜질 때만 보인다(도구 목록도 컨텍스트). 빨리 끝나면 실습 15-4(3스킬 비서)로.</p>' },
          { layout: 'summary', title: '정리', bullets: ['<code>ss.apply(task)</code> → <code>al.Agent(llm, tools=tools, system=system)</code> — 작업마다 다른 지시문 · 도구', '선택: 키워드(비용 0 · 결정적) vs LLM(의미 · 비용) · auto 는 절충', '<b>테스트 세트</b>로 선택 정확도를 재고 description · keywords 를 보강', '스킬 = 어떻게 일하나 · 도구 = 무엇을 · 프롬프트 = 누구로서 · RAG = 무엇을 아나 · MCP = 어디서', 'Claude Code · claude.ai · API · Managed Agents · agentBuilder — 형식 하나, 동기화는 없음', '다음: Part 6 agentBuilder — 오늘 배운 것을 노드로 조립'], notes: '<p>⏱ 5분. 과제: Colab 노트북 15 (스킬 폴더 zip · 실제 LLM 선택). 다음 차시 예고 — “지금까지 코드로 만든 모든 것을 그림으로 조립한다”.</p>' }
        ]
      }
    ]
  });
})();
