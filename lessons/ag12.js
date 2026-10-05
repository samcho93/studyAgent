/* 12차시 프로젝트 ②: 마케팅 자동화 에이전트 팀 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 그림 12-1. 2인 팀: 조사원 → 작가 */
  const FIG_CREW2 = `<svg viewBox="0 0 720 300" role="img" aria-label="주제가 입력되면 조사원이 위키 검색으로 핵심 3가지를 만들고 작가가 그것을 참고해 블로그 글을 쓰는 2인 팀 흐름">
  ${ARROW('m12a1')}
  <rect x="15" y="110" width="120" height="70" rx="12" class="p5s"/>
  <text x="75" y="140" text-anchor="middle" class="tx-b">inputs</text><text x="75" y="162" text-anchor="middle" class="tx-m">{'topic': '전기차'}</text>
  <rect x="180" y="40" width="220" height="210" rx="16" class="card-bg"/>
  <text x="290" y="66" text-anchor="middle" class="tx-b">🔎 조사원 (CrewAgent)</text>
  <text x="290" y="88" text-anchor="middle" class="tx-m">role · goal · backstory</text>
  <rect x="200" y="100" width="180" height="34" rx="8" class="p2s"/><text x="290" y="122" text-anchor="middle" class="tx" font-size="13">tools=[wiki_search]</text>
  <rect x="200" y="144" width="180" height="60" rx="8" class="p1s"/>
  <text x="290" y="166" text-anchor="middle" class="tx-b" font-size="13">Task 1 · 조사</text><text x="290" y="186" text-anchor="middle" class="tx-m">'{topic} 를 검색해 핵심 3가지'</text>
  <text x="290" y="232" text-anchor="middle" class="tx-m">output → 핵심 포인트 3가지</text>
  <rect x="445" y="40" width="220" height="210" rx="16" class="card-bg"/>
  <text x="555" y="66" text-anchor="middle" class="tx-b">✍️ 작가 (CrewAgent)</text>
  <text x="555" y="88" text-anchor="middle" class="tx-m">도구 없음 · 문장력</text>
  <rect x="465" y="100" width="180" height="34" rx="8" class="p3s"/><text x="555" y="122" text-anchor="middle" class="tx" font-size="13">context=[task1]</text>
  <rect x="465" y="144" width="180" height="60" rx="8" class="p1s"/>
  <text x="555" y="166" text-anchor="middle" class="tx-b" font-size="13">Task 2 · 집필</text><text x="555" y="186" text-anchor="middle" class="tx-m">'{topic} 블로그 글을 작성'</text>
  <text x="555" y="232" text-anchor="middle" class="tx-m">output → 제목 · 도입 · 본문 · 결론</text>
  <line x1="137" y1="145" x2="176" y2="145" class="ln" stroke-width="2" marker-end="url(#m12a1)"/>
  <line x1="402" y1="145" x2="441" y2="145" class="ln" stroke-width="2" marker-end="url(#m12a1)"/>
  <text x="421" y="135" text-anchor="middle" class="tx-m" font-size="12">참고</text>
  <text x="360" y="282" text-anchor="middle" class="tx-m">Crew(agents, tasks, process='sequential').kickoff(inputs) — 작업을 차례로, 앞 결과를 뒤에 넘긴다</text>
</svg>`;

  /* 그림 12-2. Task 해부 */
  const FIG_TASK = `<svg viewBox="0 0 700 250" role="img" aria-label="Task 의 세 요소인 description, expected_output, context 가 하나의 프롬프트로 합쳐져 담당 에이전트에게 전달되는 그림">
  ${ARROW('m12a2')}
  <rect x="15" y="20" width="300" height="60" rx="10" class="p1s"/>
  <text x="30" y="44" class="tx-b" font-size="13">description — 무엇을 할지</text><text x="30" y="66" class="tx-m">'전기차 블로그 글을 작성해라'</text>
  <rect x="15" y="95" width="300" height="60" rx="10" class="p3s"/>
  <text x="30" y="119" class="tx-b" font-size="13">expected_output — 어떤 모양으로</text><text x="30" y="141" class="tx-m">'제목 · 도입 · 본문 · 결론, 500자, 키워드 2회'</text>
  <rect x="15" y="170" width="300" height="60" rx="10" class="p2s"/>
  <text x="30" y="194" class="tx-b" font-size="13">context — 무엇을 참고해서</text><text x="30" y="216" class="tx-m">[task1] → '(조사) 핵심 포인트 3가지 …'</text>
  <line x1="318" y1="50" x2="372" y2="110" class="ln" stroke-width="2" marker-end="url(#m12a2)"/>
  <line x1="318" y1="125" x2="372" y2="125" class="ln" stroke-width="2" marker-end="url(#m12a2)"/>
  <line x1="318" y1="200" x2="372" y2="140" class="ln" stroke-width="2" marker-end="url(#m12a2)"/>
  <rect x="380" y="30" width="305" height="190" rx="12" class="card-bg"/>
  <text x="532" y="56" text-anchor="middle" class="tx-b">에이전트가 받는 프롬프트</text>
  <text x="395" y="84" class="tx" font-size="12">[system] 당신은 블로그 작가입니다. 목표: …</text>
  <text x="395" y="108" class="tx" font-size="12">[user] 전기차 블로그 글을 작성해라</text>
  <text x="395" y="130" class="tx" font-size="12">[참고할 이전 작업 결과]</text>
  <text x="395" y="150" class="tx-m" font-size="12">(조사) 전기 자동차: 배터리로 모터를 …</text>
  <text x="395" y="174" class="tx" font-size="12">[기대하는 결과물]</text>
  <text x="395" y="194" class="tx-m" font-size="12">제목 · 도입 · 본문 · 결론, 500자 …</text>
  <text x="350" y="243" text-anchor="middle" class="tx-m">세 요소 중 결과 품질을 가장 크게 바꾸는 것은 expected_output 이다</text>
</svg>`;

  /* 그림 12-3. expected_output 전후 비교 */
  const FIG_PROMPT = `<svg viewBox="0 0 700 240" role="img" aria-label="모호한 기대 결과물과 구체적인 기대 결과물이 만드는 글의 차이 비교">
  <rect x="15" y="15" width="325" height="210" rx="14" class="p4s"/>
  <text x="177" y="42" text-anchor="middle" class="tx-b">😕 모호한 expected_output</text>
  <text x="30" y="70" class="tx" font-size="13">'블로그 글'</text>
  <line x1="30" y1="82" x2="325" y2="82" class="ln" stroke-dasharray="3 3"/>
  <text x="30" y="106" class="tx-m" font-size="12">→ 길이 제각각 (200자 ~ 2,000자)</text>
  <text x="30" y="128" class="tx-m" font-size="12">→ 제목이 있기도 없기도</text>
  <text x="30" y="150" class="tx-m" font-size="12">→ 조사 결과를 안 쓰기도</text>
  <text x="30" y="172" class="tx-m" font-size="12">→ 실행할 때마다 모양이 달라 후속 작업이 깨짐</text>
  <text x="30" y="205" class="tx-b" font-size="12">검수 · 자동 채점 불가</text>
  <rect x="360" y="15" width="325" height="210" rx="14" class="p5s"/>
  <text x="522" y="42" text-anchor="middle" class="tx-b">✅ 구체적인 expected_output</text>
  <text x="375" y="66" class="tx" font-size="12">'# 제목 한 줄, 도입 2문장, 본문 3단락(조사 결과의</text>
  <text x="375" y="84" class="tx" font-size="12">핵심 3가지 각 1단락), 결론 1단락. 400~600자.</text>
  <text x="375" y="102" class="tx" font-size="12">키워드 "전기차" 2회 이상. 마크다운.'</text>
  <line x1="375" y1="114" x2="670" y2="114" class="ln" stroke-dasharray="3 3"/>
  <text x="375" y="138" class="tx-m" font-size="12">→ 구조 · 길이 · 키워드가 고정</text>
  <text x="375" y="160" class="tx-m" font-size="12">→ 조사 결과가 본문에 반드시 반영</text>
  <text x="375" y="182" class="tx-m" font-size="12">→ 편집자 · SEO 도구가 같은 기준으로 검사</text>
  <text x="375" y="205" class="tx-b" font-size="12">= 측정 가능한 요구사항</text>
</svg>`;

  /* 그림 12-4. 산출물 파이프라인 */
  const FIG_PIPE = `<svg viewBox="0 0 700 150" role="img" aria-label="주제에서 조사 결과, 블로그 글, 마크다운 파일로 이어지는 산출물 흐름">
  ${ARROW('m12a3')}
  <rect x="15" y="45" width="130" height="60" rx="12" class="p5s"/><text x="80" y="70" text-anchor="middle" class="tx-b">주제</text><text x="80" y="92" text-anchor="middle" class="tx-m">'전기차'</text>
  <rect x="190" y="45" width="140" height="60" rx="12" class="p2s"/><text x="260" y="70" text-anchor="middle" class="tx-b">task1.output</text><text x="260" y="92" text-anchor="middle" class="tx-m">핵심 3가지</text>
  <rect x="375" y="45" width="140" height="60" rx="12" class="p1s"/><text x="445" y="70" text-anchor="middle" class="tx-b">task2.output</text><text x="445" y="92" text-anchor="middle" class="tx-m">블로그 글</text>
  <rect x="560" y="45" width="125" height="60" rx="12" class="p3s"/><text x="622" y="70" text-anchor="middle" class="tx-b">blog.md</text><text x="622" y="92" text-anchor="middle" class="tx-m">write_file / open</text>
  <line x1="147" y1="75" x2="186" y2="75" class="ln" stroke-width="2" marker-end="url(#m12a3)"/>
  <line x1="332" y1="75" x2="371" y2="75" class="ln" stroke-width="2" marker-end="url(#m12a3)"/>
  <line x1="517" y1="75" x2="556" y2="75" class="ln" stroke-width="2" marker-end="url(#m12a3)"/>
  <text x="350" y="135" text-anchor="middle" class="tx-m">중간 산출물(task.output)을 따로 저장해 두면 어느 단계에서 품질이 떨어졌는지 바로 찾을 수 있다</text>
</svg>`;

  /* 그림 12-5. 3인 팀 + 편집 루프 */
  const FIG_CREW3 = `<svg viewBox="0 0 720 300" role="img" aria-label="조사원, 작가, 편집자 세 에이전트가 조사, 집필, 검토, 수정 네 작업을 차례로 처리하는 3인 팀 흐름">
  ${ARROW('m12a4')}
  <rect x="15" y="30" width="150" height="80" rx="14" class="card-bg"/><text x="90" y="58" text-anchor="middle" class="tx-b">🔎 조사원</text><text x="90" y="80" text-anchor="middle" class="tx-m">wiki_search</text><text x="90" y="98" text-anchor="middle" class="tx-m">정확한 정보</text>
  <rect x="285" y="30" width="150" height="80" rx="14" class="card-bg"/><text x="360" y="58" text-anchor="middle" class="tx-b">✍️ 작가</text><text x="360" y="80" text-anchor="middle" class="tx-m">읽기 쉬운 글</text><text x="360" y="98" text-anchor="middle" class="tx-m">두 작업 담당</text>
  <rect x="555" y="30" width="150" height="80" rx="14" class="card-bg"/><text x="630" y="58" text-anchor="middle" class="tx-b">🧐 편집자</text><text x="630" y="80" text-anchor="middle" class="tx-m">문제점 · 수정 요청</text><text x="630" y="98" text-anchor="middle" class="tx-m">품질 기준</text>
  <rect x="15" y="160" width="150" height="56" rx="10" class="p2s"/><text x="90" y="184" text-anchor="middle" class="tx-b" font-size="13">① 조사</text><text x="90" y="204" text-anchor="middle" class="tx-m">핵심 3가지</text>
  <rect x="195" y="160" width="150" height="56" rx="10" class="p1s"/><text x="270" y="184" text-anchor="middle" class="tx-b" font-size="13">② 집필</text><text x="270" y="204" text-anchor="middle" class="tx-m">초안</text>
  <rect x="375" y="160" width="150" height="56" rx="10" class="p4s"/><text x="450" y="184" text-anchor="middle" class="tx-b" font-size="13">③ 검토</text><text x="450" y="204" text-anchor="middle" class="tx-m">문제점 · 수정 요청</text>
  <rect x="555" y="160" width="150" height="56" rx="10" class="p3s"/><text x="630" y="184" text-anchor="middle" class="tx-b" font-size="13">④ 수정</text><text x="630" y="204" text-anchor="middle" class="tx-m">최종 글</text>
  <line x1="167" y1="188" x2="191" y2="188" class="ln" stroke-width="2" marker-end="url(#m12a4)"/>
  <line x1="347" y1="188" x2="371" y2="188" class="ln" stroke-width="2" marker-end="url(#m12a4)"/>
  <line x1="527" y1="188" x2="551" y2="188" class="ln" stroke-width="2" marker-end="url(#m12a4)"/>
  <line x1="90" y1="112" x2="90" y2="156" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m12a4)"/>
  <line x1="340" y1="112" x2="285" y2="156" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m12a4)"/>
  <line x1="400" y1="112" x2="600" y2="156" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m12a4)"/>
  <line x1="630" y1="112" x2="470" y2="156" class="ln" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#m12a4)"/>
  <path d="M630 220 C630 262 270 262 270 220" class="ln" stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#m12a4)"/>
  <text x="450" y="258" text-anchor="middle" class="tx-m">점수가 낮으면 ③→④ 를 반복 (Reflector 루프)</text>
  <text x="360" y="288" text-anchor="middle" class="tx-m">context=[task2, task3] — 수정 작업은 초안과 검토 의견을 모두 참고한다</text>
</svg>`;

  /* 그림 12-6. Reflector 점수 루프 */
  const FIG_REFLECT = `<svg viewBox="0 0 700 230" role="img" aria-label="글을 점수로 평가해 기준 미만이면 비평과 수정을 거쳐 다시 평가하는 자동 검수 루프">
  ${ARROW('m12a5')}
  <rect x="20" y="80" width="120" height="56" rx="12" class="p1s"/><text x="80" y="113" text-anchor="middle" class="tx-b">초안</text>
  <rect x="190" y="80" width="150" height="56" rx="12" class="p2s"/><text x="265" y="104" text-anchor="middle" class="tx-b">score(text)</text><text x="265" y="124" text-anchor="middle" class="tx-m">JSON {score, issues}</text>
  <path d="M400 108 L460 70 L520 108 L460 146 Z" class="p3s"/><text x="460" y="104" text-anchor="middle" class="tx" font-size="13">score ≥ 8?</text><text x="460" y="122" text-anchor="middle" class="tx-m" font-size="12">or rounds ≥ 2</text>
  <rect x="570" y="80" width="110" height="56" rx="12" class="p5s"/><text x="625" y="113" text-anchor="middle" class="tx-b">통과 · 발행</text>
  <rect x="340" y="170" width="240" height="44" rx="10" class="p4s"/><text x="460" y="190" text-anchor="middle" class="tx-b" font-size="13">critique → revise</text><text x="460" y="207" text-anchor="middle" class="tx-m" font-size="12">비평을 받아 고쳐 쓰기 (LLM 2회)</text>
  <line x1="142" y1="108" x2="186" y2="108" class="ln" stroke-width="2" marker-end="url(#m12a5)"/>
  <line x1="342" y1="108" x2="396" y2="108" class="ln" stroke-width="2" marker-end="url(#m12a5)"/>
  <line x1="522" y1="108" x2="566" y2="108" class="ln" stroke-width="2" marker-end="url(#m12a5)"/><text x="544" y="98" text-anchor="middle" class="tx-m" font-size="12">예</text>
  <line x1="460" y1="148" x2="460" y2="166" class="ln" stroke-width="2" marker-end="url(#m12a5)"/><text x="480" y="162" class="tx-m" font-size="12">아니오</text>
  <path d="M338 192 C200 192 265 150 265 140" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m12a5)"/>
  <text x="350" y="40" text-anchor="middle" class="tx-m">한 바퀴 = LLM 호출 3회 (평가 1 + 비평 1 + 수정 1) — 최대 횟수를 꼭 둔다</text>
</svg>`;

  /* 그림 12-7. 작업별 비용 */
  const FIG_COST = `<svg viewBox="0 0 700 240" role="img" aria-label="조사, 집필, 검토, 수정 네 작업의 LLM 호출 횟수와 토큰을 막대로 비교한 그림">
  <text x="60" y="26" class="tx-b">작업별 토큰 사용량 (예시 · 실제 모델)</text>
  <line x1="60" y1="40" x2="60" y2="190" class="ax"/><line x1="60" y1="190" x2="440" y2="190" class="ax"/>
  <g text-anchor="end"><text x="54" y="194" class="tx-m" font-size="12">0</text><text x="54" y="118" class="tx-m" font-size="12">2k</text><text x="54" y="44" class="tx-m" font-size="12">4k</text></g>
  <rect x="80" y="130" width="60" height="60" class="p2"/><text x="110" y="122" text-anchor="middle" class="tx-b" font-size="12">1.6k</text><text x="110" y="210" text-anchor="middle" class="tx" font-size="12">① 조사</text>
  <rect x="170" y="100" width="60" height="90" class="p1"/><text x="200" y="92" text-anchor="middle" class="tx-b" font-size="12">2.4k</text><text x="200" y="210" text-anchor="middle" class="tx" font-size="12">② 집필</text>
  <rect x="260" y="85" width="60" height="105" class="p4"/><text x="290" y="77" text-anchor="middle" class="tx-b" font-size="12">2.8k</text><text x="290" y="210" text-anchor="middle" class="tx" font-size="12">③ 검토</text>
  <rect x="350" y="52" width="60" height="138" class="p3"/><text x="380" y="44" text-anchor="middle" class="tx-b" font-size="12">3.7k</text><text x="380" y="210" text-anchor="middle" class="tx" font-size="12">④ 수정</text>
  <rect x="470" y="45" width="215" height="165" rx="12" class="card-bg"/>
  <text x="577" y="72" text-anchor="middle" class="tx-b">왜 뒤로 갈수록 비싼가?</text>
  <text x="485" y="100" class="tx-m" font-size="12">• context 가 쌓여 입력 토큰 증가</text>
  <text x="485" y="122" class="tx-m" font-size="12">• 조사원은 도구 호출로 LLM 2회</text>
  <text x="485" y="144" class="tx-m" font-size="12">• 검수 루프 한 바퀴 = 3회 호출</text>
  <text x="485" y="172" class="tx" font-size="12">llm.calls · llm.total_usage 로</text>
  <text x="485" y="192" class="tx" font-size="12">작업마다 차이를 기록한다</text>
  <text x="350" y="232" text-anchor="middle" class="tx-m">측정하지 않으면 줄일 수 없다 — 호출 횟수 · 토큰 · 예상 비용을 매 실행마다 출력</text>
</svg>`;

  /* 그림 12-8. Human-in-the-loop */
  const FIG_HITL = `<svg viewBox="0 0 700 220" role="img" aria-label="자동 검수를 통과한 글을 사람이 승인하면 발행하고 거부하면 피드백과 함께 수정 단계로 돌려보내는 흐름">
  ${ARROW('m12a6')}
  <rect x="15" y="70" width="140" height="60" rx="12" class="p1s"/><text x="85" y="95" text-anchor="middle" class="tx-b">에이전트 팀</text><text x="85" y="116" text-anchor="middle" class="tx-m">초안 → 자동 검수</text>
  <rect x="205" y="55" width="170" height="90" rx="14" class="p5s"/><text x="290" y="82" text-anchor="middle" class="tx-b">🧑 사람 승인</text><text x="290" y="104" text-anchor="middle" class="tx-m">input('발행할까요? y/n')</text><text x="290" y="124" text-anchor="middle" class="tx-m">+ 한 줄 피드백</text>
  <rect x="430" y="30" width="130" height="50" rx="12" class="p3s"/><text x="495" y="60" text-anchor="middle" class="tx-b">발행 (파일 · API)</text>
  <rect x="430" y="120" width="130" height="50" rx="12" class="p4s"/><text x="495" y="142" text-anchor="middle" class="tx-b" font-size="13">수정 요청</text><text x="495" y="160" text-anchor="middle" class="tx-m" font-size="12">피드백 반영 재작성</text>
  <line x1="157" y1="100" x2="201" y2="100" class="ln" stroke-width="2" marker-end="url(#m12a6)"/>
  <line x1="377" y1="85" x2="426" y2="60" class="ln" stroke-width="2" marker-end="url(#m12a6)"/><text x="400" y="62" class="tx-m" font-size="12">y</text>
  <line x1="377" y1="115" x2="426" y2="140" class="ln" stroke-width="2" marker-end="url(#m12a6)"/><text x="400" y="145" class="tx-m" font-size="12">n</text>
  <path d="M495 172 C495 205 85 205 85 132" class="ln" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#m12a6)"/>
  <rect x="585" y="30" width="100" height="140" rx="12" class="card-bg"/>
  <text x="635" y="56" text-anchor="middle" class="tx-b" font-size="13">언제 넣나</text>
  <text x="635" y="82" text-anchor="middle" class="tx-m" font-size="12">외부 발행</text>
  <text x="635" y="102" text-anchor="middle" class="tx-m" font-size="12">비용 지출</text>
  <text x="635" y="122" text-anchor="middle" class="tx-m" font-size="12">법 · 브랜드</text>
  <text x="635" y="142" text-anchor="middle" class="tx-m" font-size="12">되돌릴 수 없음</text>
  <text x="300" y="205" text-anchor="middle" class="tx-m">자동화의 마지막 1% 는 사람이 — 되돌릴 수 없는 행동 앞에는 반드시 확인 단계</text>
</svg>`;

  /* ------------------------------------------------------------------ 퀴즈 */
  const QUIZ1 = [
    { q: '조사원 에이전트에만 <code>tools=[al.wiki_search]</code> 를 주고 작가에게는 도구를 주지 않았다. 가장 알맞은 이유는?', options: ['작가는 도구를 쓸 수 없는 에이전트이기 때문에', '역할마다 필요한 능력만 주면 잘못된 도구 호출이 줄고 각 에이전트의 프롬프트가 단순해지기 때문에', '도구는 팀에서 한 명만 가질 수 있기 때문에', '작가는 LLM 을 쓰지 않기 때문에'], answer: 1,
      explain: '역할 분담의 핵심은 <b>책임과 능력을 좁히는 것</b>입니다. 작가에게 검색 도구가 있으면 조사 대신 즉흥 검색을 하거나 엉뚱한 호출을 할 수 있습니다. 도구가 없는 에이전트는 LLM 한 번 호출로 끝나므로 비용도 적습니다.' },
    { q: '<code>Task(description=…, expected_output=…, context=[task1])</code> 에서 <code>context</code> 의 역할은?', options: ['작업 순서를 정한다', '이전 작업의 결과(task1.output)를 “참고할 이전 작업 결과” 로 프롬프트에 넣어 준다', '에이전트의 도구 목록을 바꾼다', 'LLM 모델을 바꾼다'], answer: 1,
      explain: '<code>context</code> 에 넣은 작업의 <code>output</code> 이 프롬프트의 <b>[참고할 이전 작업 결과]</b> 섹션으로 들어갑니다. 순서는 <code>Crew(tasks=[...])</code> 의 목록 순서가 정하고, sequential 처리에서는 context 를 생략하면 바로 앞 작업이 자동으로 참고됩니다.' },
    { q: '같은 작업을 여러 번 실행했더니 글 길이가 300자에서 2,000자까지 제각각이고 제목이 있다 없다 한다. 가장 먼저 손볼 곳은?', options: ['LLM 모델을 더 큰 것으로 바꾼다', '<code>expected_output</code> 에 구조 · 길이 · 키워드 등 측정 가능한 기준을 구체적으로 적는다', '에이전트를 한 명 더 추가한다', '<code>verbose=False</code> 로 바꾼다'], answer: 1,
      explain: '결과 모양이 흔들리는 가장 흔한 원인은 기대 결과물이 모호하기 때문입니다. “# 제목 한 줄, 본문 3단락, 400~600자, 키워드 2회” 처럼 <b>검사할 수 있는 기준</b>을 적으면 후속 작업(편집 · SEO 체크)도 같은 기준으로 돌아갑니다.' },
    { q: '<code>crew.kickoff(inputs={\'topic\': \'전기차\'})</code> 를 실행하면 <code>description</code> 의 <code>{topic}</code> 은 어떻게 되나?', options: ['문자열 그대로 남는다', '<code>str.format</code> 으로 치환되어 “전기차 블로그 글을 작성해라” 가 된다', 'LLM 이 추측해서 채운다', '오류가 난다'], answer: 1,
      explain: '<code>kickoff(inputs)</code> 는 각 작업의 <code>description.format(**inputs)</code> 를 실행합니다. 주제만 바꿔 같은 팀을 재사용할 수 있는 이유입니다. 같은 Task 객체로 두 번 kickoff 하면 이미 치환된 문자열이라 두 번째 inputs 는 반영되지 않으니 Task 를 새로 만드세요.' }
  ];
  const QUIZ2 = [
    { q: 'Reflector 검수 루프에서 <code>score &lt; 8 이면 수정</code> 규칙 외에 <code>rounds &gt;= 2 이면 중단</code> 을 반드시 두는 이유는?', options: ['LLM 이 2번 이상 호출되면 오류가 나서', '점수가 기준에 영원히 못 미칠 수 있어 무한 루프와 비용 폭주를 막기 위해', '2번이 지나면 글이 나빠지기 때문에', 'Reflector 가 2번만 지원하기 때문에'], answer: 1,
      explain: '평가자가 계속 7점을 주면(모의 LLM 이 그렇습니다) 루프는 끝나지 않습니다. 한 바퀴에 LLM 3회(평가 + 비평 + 수정)가 들기 때문에 <b>최대 횟수</b>는 비용 상한이기도 합니다. 13차시 “무한 루프 · 비용 상한” 의 핵심 원칙입니다.' },
    { q: 'SEO 키워드 체크를 LLM 에게 묻지 않고 <b>순수 파이썬 도구</b>로 만든 이유로 알맞지 않은 것은?', options: ['항상 같은 결과를 내므로 테스트와 자동 채점이 가능하다', '비용과 지연이 0 에 가깝다', 'LLM 은 글자 수 세기 같은 정확한 계산에 약하다', 'LLM 은 글의 품질을 전혀 판단할 수 없다'], answer: 3,
      explain: 'LLM 은 어조 · 설득력 같은 <b>주관적 품질</b> 판단에 강하고, 파이썬은 글자 수 · 키워드 포함 여부 같은 <b>객관적 규칙</b>에 강합니다. 둘을 역할에 맞게 나누는 것이지 LLM 이 품질 판단을 못 하는 것은 아닙니다.' },
    { q: '4개 작업을 가진 팀에서 뒤쪽 작업일수록 입력 토큰이 커지는 주된 이유는?', options: ['LLM 이 피로해지기 때문에', '<code>context</code> 로 앞 작업 결과가 누적되어 프롬프트가 길어지기 때문에', '작가 에이전트가 더 비싼 모델을 쓰기 때문에', '토큰 계산 방식이 바뀌기 때문에'], answer: 1,
      explain: '수정 작업은 초안 + 검토 의견을 모두 참고하므로 프롬프트가 가장 깁니다. <code>llm.total_usage</code> 를 작업 전후로 빼서 작업별 토큰을 기록하면 어디서 비용이 나가는지 보입니다. 긴 context 는 요약해서 넘기는 것이 대책입니다.' },
    { q: 'Human-in-the-loop(사람 승인 단계)를 꼭 넣어야 하는 경우로 가장 알맞은 것은?', options: ['조사원이 위키백과를 검색할 때', '편집자가 초안을 검토할 때', '최종 글을 회사 블로그에 실제로 발행(외부 공개)할 때', '주제를 inputs 로 넣을 때'], answer: 2,
      explain: '<b>되돌릴 수 없거나 외부에 영향을 주는 행동</b>(발행 · 결제 · 메일 발송) 앞에는 사람의 확인이 필요합니다. 내부 중간 단계는 자동화해도 되지만, 마지막 1% 는 사람이 책임집니다.' },
    { q: '실제 CrewAI 코드에서 브라우저의 <code>al.CrewAgent</code> · <code>al.Crew(...).kickoff()</code> 에 대응하는 것은?', options: ['<code>Agent</code> · <code>Crew(...).kickoff()</code>', '<code>create_react_agent</code> · <code>invoke()</code>', '<code>ConversableAgent</code> · <code>initiate_chat()</code>', '<code>StateGraph</code> · <code>compile()</code>'], answer: 0,
      explain: 'agentlab 은 CrewAI 와 클래스 · 인자 이름을 맞춰 두었습니다(Agent → CrewAgent 만 다름). 두 번째는 LangGraph, 세 번째는 AutoGen, 네 번째는 LangGraph 의 그래프 API 입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag12',
    no: '12',
    title: '프로젝트 ②: 마케팅 자동화 에이전트 팀',
    subtitle: '조사원 · 작가 · 편집자 팀 → 자동 검수 · SEO 체크 · 비용 측정 · 사람 승인',
    summary: '09차시의 CrewAI 방식으로 <b>마케팅 블로그 글을 자동으로 만드는 에이전트 팀</b>을 완성합니다. 조사원(위키 검색)과 작가 2인 팀으로 시작해 중간 산출물을 확인하고 마크다운 파일로 저장한 뒤, 편집자를 더한 3인 팀 · Reflector 자동 검수 루프 · 순수 파이썬 SEO 체크 도구 · 호출 횟수와 토큰 측정 · 사람 승인 단계까지 붙여 “발표할 수 있는” 자동화 파이프라인을 만듭니다. Colab 에서는 실제 CrewAI 와 무료 DuckDuckGo 검색 도구로 같은 팀을 구성합니다.',
    goals: [
      '역할 · 목표 · 배경 · 도구를 나누어 조사원 · 작가 · 편집자 에이전트 팀을 설계할 수 있다',
      'Task 의 description · expected_output · context 가 프롬프트로 합쳐지는 과정을 설명하고 expected_output 으로 품질을 통제할 수 있다',
      'Reflector 점수 루프와 SEO 체크 도구로 자동 검수를 구현하고, 호출 횟수 · 토큰 · 비용을 측정할 수 있다',
      '사람 승인 단계를 넣은 파이프라인을 완성하고 체크리스트 · 루브릭으로 발표를 준비할 수 있다'
    ],
    sections: [
      {
        id: 'ag12-1',
        title: '2인 팀: 조사원과 작가',
        minutes: 50,
        goals: ['마케팅 자동화 요구사항을 역할 분담으로 설계한다', 'CrewAgent · Task · Crew 로 2인 팀을 만들어 kickoff 하고 중간 산출물을 확인한다', '결과를 마크다운 파일로 저장하고 expected_output 으로 품질을 통제한다'],
        flow: [['도입 · 요구사항', 7], ['역할 설계 · CrewAgent', 10], ['Task · kickoff', 13], ['산출물 저장 · 프롬프트 다듬기', 15], ['정리', 5]],
        content: [
          { type: 'p', html: '11차시의 비서는 <b>한 명</b>이 모든 도구를 들고 일했습니다. 이번 프로젝트는 성격이 다릅니다. “전기차 주제로 블로그 글을 써 줘” 라는 요청은 <b>조사 → 집필 → 검토 → 수정</b>이라는 여러 단계의 일이고, 단계마다 필요한 능력(검색 · 문장력 · 비판적 시각)이 다릅니다. 이런 일은 09차시에서 배운 <b>역할 분담 팀(CrewAI 방식)</b>이 어울립니다. 오늘은 2인 팀으로 시작합니다.' },
          { type: 'h', text: '1. 요구사항: 마케팅 글 자동화' },
          { type: 'table', head: ['구분', '요구사항', '확인 방법'], rows: [
            ['기능 F1', '주제(topic) 하나를 입력하면 <b>조사 → 블로그 글</b>이 자동으로 나온다', '<code>kickoff(inputs={\'topic\': …})</code>'],
            ['기능 F2', '조사 결과는 <b>출처가 있는 핵심 3가지</b>, 글은 <b>제목 · 도입 · 본문 · 결론</b> 구조', '중간 산출물 · 최종 글 확인'],
            ['기능 F3', '결과를 <b>마크다운 파일</b>로 저장해 바로 게시할 수 있다', '<code>blog.md</code>'],
            ['기능 F4 (2교시)', '편집자가 검토하고, 점수가 낮으면 자동으로 고쳐 쓴다 · SEO 키워드를 검사한다', '검수 루프 · SEO 점수'],
            ['비기능 N1', '한 번 실행에 LLM 호출 10회 이내, 토큰 · 비용을 출력한다', '<code>llm.calls</code> · <code>total_usage</code>'],
            ['비기능 N2', '외부에 발행하기 전에 <b>사람이 승인</b>한다', '승인 입력 단계'],
            ['비기능 N3', 'API 키 없이도(모의 LLM) 전체 파이프라인이 돈다', '브라우저에서 실행']
          ], caption: '표 12-1. 마케팅 자동화 팀 요구사항.' },
          { type: 'h', text: '2. 역할 설계: 누가 무엇을 맡는가' },
          { type: 'p', html: '팀 설계의 출발점은 <b>역할(role) · 목표(goal) · 배경(backstory) · 도구(tools)</b> 네 칸을 채우는 것입니다. 조사원은 정확한 정보가 목표이므로 검색 도구를 가지고, 작가는 읽기 쉬운 글이 목표이므로 도구 없이 문장력에 집중합니다. 역할마다 필요한 능력만 주면 잘못된 도구 호출이 줄고 프롬프트가 단순해집니다.' },
          { type: 'figure', html: FIG_CREW2, caption: '그림 12-1. 2인 팀. 주제가 들어오면 조사원이 핵심 3가지를, 작가가 그것을 참고해 글을 씁니다.' },
          { type: 'table', head: ['에이전트', 'role', 'goal', 'backstory', 'tools'], rows: [
            ['🔎 조사원', '시장 조사원', '주제에 대한 정확한 정보를 찾아 핵심을 정리한다', '10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다', '<code>al.wiki_search</code>'],
            ['✍️ 작가', '블로그 작가', '조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다', 'IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다', '없음'],
            ['🧐 편집자 (2교시)', '편집자', '글의 문제점을 찾아 구체적인 수정 요청을 한다', '출판사 편집장 출신. 근거 없는 문장을 싫어한다', '없음']
          ], caption: '표 12-2. 역할 설계표. backstory 는 말투와 판단 기준을 만드는 “성격” 입니다.' },
          { type: 'code', title: '예제 12-1. 에이전트 두 명 만들고 시스템 프롬프트 확인하기', code: `import agentlab as al

llm = al.LLM()

researcher = al.CrewAgent(
    role='시장 조사원',
    goal='주제에 대한 정확한 정보를 찾아 핵심을 정리한다',
    backstory='10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다.',
    llm=llm, tools=[al.wiki_search])

writer = al.CrewAgent(
    role='블로그 작가',
    goal='조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다',
    backstory='IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다.',
    llm=llm)

for a in (researcher, writer):
    print(a, '· 도구:', a.tools.names())
    print(a.system_prompt())
    print('-' * 40)`,
            expect: `CrewAgent(시장 조사원) · 도구: ['wiki_search']
당신은 시장 조사원입니다.
목표: 주제에 대한 정확한 정보를 찾아 핵심을 정리한다
배경: 10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다.
맡은 작업을 역할에 맞게, 요구된 결과물 형식으로 완성하세요.
----------------------------------------
CrewAgent(블로그 작가) · 도구: []
당신은 블로그 작가입니다.
목표: 조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다
배경: IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다.
맡은 작업을 역할에 맞게, 요구된 결과물 형식으로 완성하세요.
----------------------------------------`,
            desc: '<code>system_prompt()</code> 가 role · goal · backstory 를 03차시에서 배운 페르소나 프롬프트로 조립합니다. 도구가 있는 조사원은 작업 때 내부적으로 <code>al.Agent</code>(루프)가 되고, 도구가 없는 작가는 LLM 한 번 호출로 끝납니다 — 비용과 속도가 다릅니다.' },
          { type: 'h', text: '3. Task: 설명 · 기대 결과물 · 문맥' },
          { type: 'p', html: '작업(Task)은 세 요소로 이루어집니다. <b>description</b>(무엇을), <b>expected_output</b>(어떤 모양으로), <b>context</b>(무엇을 참고해서). 팀이 실행될 때 이 셋이 하나의 프롬프트로 합쳐져 담당 에이전트에게 전달됩니다. <code>{topic}</code> 같은 자리표시자는 <code>kickoff(inputs=…)</code> 에서 채워지므로 주제만 바꿔 팀을 재사용할 수 있습니다.' },
          { type: 'figure', html: FIG_TASK, caption: '그림 12-2. Task 의 세 요소가 하나의 프롬프트로 합쳐집니다. 결과 품질을 가장 크게 좌우하는 것은 expected_output 입니다.' },
          { type: 'code', title: '예제 12-2. 2인 팀 kickoff — 조사 → 집필', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='주제에 대한 정확한 정보를 찾아 핵심을 정리한다',
                          backstory='10년차 리서치 애널리스트', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다',
                      backstory='IT 블로그 에디터', llm=llm)

research = al.Task(
    description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라',
    expected_output='핵심 포인트 3가지 (각 한 문장, 출처 포함)',
    agent=researcher, name='조사')
write = al.Task(
    description='{topic} 블로그 글을 작성해라',
    expected_output='# 제목 한 줄, 도입 2문장, 본문 3단락(조사 결과의 핵심 3가지 각 1단락), 결론 1단락. 400~600자. 마크다운.',
    agent=writer, context=[research], name='집필')

crew = al.Crew(agents=[researcher, writer], tasks=[research, write], verbose=True)
print(crew)
final = crew.kickoff(inputs={'topic': '전기차'})
print('=== 최종 결과 ===')
print(final)
print('LLM 호출:', llm.calls, '· 토큰:', llm.total_usage.total_tokens)`,
            expect: `Crew(2 agents, 2 tasks, sequential)

🧑‍💼 [시장 조사원] 작업 1/2: 전기차 를 검색해 핵심 포인트 3가지를 정리해라
   ✔ 결과: [시장 조사원] 전기 자동차: 전기 자동차는 배터리에 저장된 전기로 모터를 구동하는 자동차로, 배출가스가 없고 유지비가 낮아 보급이 빠르게 늘고 있다.

🧑‍💼 [블로그 작가] 작업 2/2: 전기차 블로그 글을 작성해라
   ✔ 결과: [블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는
=== 최종 결과 ===
[블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.
LLM 호출: 3 · 토큰: 387`,
            desc: '조사원은 <code>wiki_search</code> 를 호출(LLM 2회)하고 작가는 1회만 호출해 총 3회입니다. 작가의 글에 “이전 작업 결과를 바탕으로” 가 붙은 것은 context 가 전달되었다는 표시입니다. 브라우저에서는 위키백과 실제 검색 결과가 들어가고, 🔑 키가 있으면 실제 모델이 구조대로 글을 씁니다. 예시 출력은 모의 LLM 기준입니다.' },
          { type: 'h', text: '4. 중간 산출물 확인하기' },
          { type: 'p', html: '최종 글만 보면 “어디서 품질이 떨어졌는지” 알 수 없습니다. 각 <code>Task</code> 는 실행 뒤 <code>task.output</code> 에 결과를 보관하고, <code>crew.outputs</code> 에도 순서대로 쌓입니다. 조사 결과가 빈약하면 작가가 아무리 잘 써도 글이 빈약하므로, 단계별 산출물을 꼭 들여다봅니다.' },
          { type: 'figure', html: FIG_PIPE, caption: '그림 12-3. 주제 → 조사 결과 → 글 → 파일. 중간 산출물을 따로 저장하면 문제 단계를 바로 찾습니다.' },
          { type: 'code', title: '예제 12-3. task.output 으로 단계별 결과 보기', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)

research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라',
                   expected_output='핵심 포인트 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라',
                expected_output='# 제목, 도입, 본문 3단락, 결론. 400~600자', agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write])   # verbose=False: 조용히 실행
crew.kickoff(inputs={'topic': 'AI 에이전트'})

for i, task in enumerate(crew.tasks, 1):
    print(f'--- 작업 {i} [{task.name}] 담당: {task.agent.role} · 글자 수: {len(task.output)}')
    print(task.output[:150])
print('crew.outputs 개수:', len(crew.outputs))
print('조사 결과가 글에 쓰였나?', '이전 작업 결과' in write.output)`,
            expect: `--- 작업 1 [조사] 담당: 시장 조사원 · 글자 수: 116
[시장 조사원] 지능형 에이전트: 지능형 에이전트는 환경을 인식하고 목표 달성을 위해 자율적으로 행동하는 시스템이다. 대규모 언어 모델 기반 에이전트는 도구 호출과 계획 기능을 결합해 복잡한 작업을 수행한다.
--- 작업 2 [집필] 담당: 블로그 작가 · 글자 수: 142
[블로그 작가] # AI 에이전트

이전 작업 결과를 바탕으로 도입: 왜 지금 AI 에이전트인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.
crew.outputs 개수: 2
조사 결과가 글에 쓰였나? True`,
            desc: '글자 수 · 담당 · 앞부분 150자만 찍어도 단계별 품질을 한눈에 비교할 수 있습니다. 실제 모델이라면 “조사 결과의 핵심어가 글에 몇 개 들어갔나” 를 세는 것이 좋은 점검입니다(2교시 SEO 도구).' },
          { type: 'h', text: '5. 결과를 마크다운 파일로 저장하기' },
          { type: 'p', html: '블로그 글은 마크다운 파일로 저장하면 바로 게시할 수 있습니다. 11차시처럼 <code>al.write_file</code> 을 쓰거나 파이썬의 <code>open()</code> 을 그대로 써도 됩니다. 최종 글과 함께 <b>조사 결과도 별도 파일</b>로 남겨 두면 나중에 글을 고칠 때 근거를 다시 찾지 않아도 됩니다.' },
          { type: 'code', title: '예제 12-4. 조사 결과와 글을 파일로 저장하고 다시 읽기', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론. 400~600자', agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write])
topic = '커피'
final = crew.kickoff(inputs={'topic': topic})

# 1) agentlab 도구로 저장
print(al.write_file(f'blog_{topic}.md', final))
# 2) 파이썬 open() 으로 저장 — 조사 노트
with open(f'research_{topic}.md', 'w', encoding='utf-8') as f:
    f.write(f'# {topic} 조사 노트\\n\\n' + research.output + '\\n')

# 다시 읽어 확인
with open(f'blog_{topic}.md', encoding='utf-8') as f:
    text = f.read()
print('--- blog 파일 첫 3줄 ---')
print('\\n'.join(text.split('\\n')[:3]))
print('--- research 파일 ---')
print(al.read_file(f'research_{topic}.md')['content'][:120])`,
            expect: `{'path': 'blog_커피.md', 'bytes': 298, 'ok': True}
--- blog 파일 첫 3줄 ---
[블로그 작가] # 커피

이전 작업 결과를 바탕으로 도입: 왜 지금 커피인가?
--- research 파일 ---
# 커피 조사 노트

[시장 조사원] 커피: 커피는 커피나무 열매의 씨앗을 볶아 만든 음료로, 카페인을 함유하며 전 세계에서 가장 널리 소비되는 음료 중 하나이다.`,
            desc: '브라우저의 작업 폴더에 <code>blog_커피.md</code> · <code>research_커피.md</code> 두 파일이 생깁니다. 실제 모델이라면 <code>[블로그 작가]</code> 접두어가 없으므로 바로 게시할 수 있는 마크다운이 됩니다. 주제를 바꿔 여러 번 실행하면 파일이 주제별로 쌓입니다.' },
          { type: 'h', text: '6. 프롬프트 다듬기: expected_output 이 품질을 좌우한다' },
          { type: 'p', html: '팀을 처음 돌려 보면 가장 흔한 불만이 “결과 모양이 매번 다르다” 입니다. 원인은 대개 <code>expected_output</code> 이 모호하기 때문입니다. “블로그 글” 대신 <b>구조 · 길이 · 키워드 · 형식</b>처럼 검사할 수 있는 기준을 적으면 결과가 안정되고, 2교시의 편집자 · SEO 도구가 같은 기준으로 검사할 수 있습니다.' },
          { type: 'figure', html: FIG_PROMPT, caption: '그림 12-4. 모호한 기대 결과물 vs 구체적인 기대 결과물. “측정 가능한 요구사항” 이 핵심입니다.' },
          { type: 'code', title: '예제 12-5. 같은 작업, 다른 expected_output — 에이전트가 받는 프롬프트 비교', code: `import agentlab as al

VAGUE = '블로그 글'
SPECIFIC = ('# 제목 한 줄, 도입 2문장, 본문 3단락(조사 결과의 핵심 3가지 각 1단락), '
            '결론 1단락. 400~600자. 키워드 "전기차" 2회 이상. 마크다운.')
research_note = '(조사) ① 배터리 가격 하락 ② 충전 인프라 확대 ③ 보조금 정책'

def build_prompt(task, context_text):
    """CrewAgent.execute 가 실제로 조립하는 프롬프트 (crew.py 와 같은 규칙)"""
    return (task.description + '\\n\\n[참고할 이전 작업 결과]\\n' + context_text
            + '\\n\\n[기대하는 결과물]\\n' + task.expected_output)

for label, eo in [('모호', VAGUE), ('구체', SPECIFIC)]:
    t = al.Task(description='전기차 블로그 글을 작성해라', expected_output=eo)
    print(f'=== {label} ===')
    print(build_prompt(t, research_note))
    print()

# 실제 모델이 흔히 내는 결과를 대본으로 비교 (🔑 키가 있으면 실제 모델이 답한다)
llm = al.LLM(mock_responses=[
    '전기차는 요즘 인기가 많습니다. 배터리 값이 싸지고 충전소도 늘었습니다. 한번 알아보세요.',
    '# 전기차, 지금 사야 할까?\\n\\n도입 2문장 … 본문: ① 배터리 가격 ② 충전 인프라 ③ 보조금 … 결론: 전기차 시승부터.',
])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
for label, eo in [('모호', VAGUE), ('구체', SPECIFIC)]:
    out = writer.execute(al.Task(description='전기차 블로그 글을 작성해라', expected_output=eo), research_note)
    print(f'[{label}] 글자 수 {len(out)} · 제목 있음 {out.startswith("#")} · 전기차 {out.count("전기차")}회')`,
            expect: `=== 모호 ===
전기차 블로그 글을 작성해라

[참고할 이전 작업 결과]
(조사) ① 배터리 가격 하락 ② 충전 인프라 확대 ③ 보조금 정책

[기대하는 결과물]
블로그 글

=== 구체 ===
전기차 블로그 글을 작성해라

[참고할 이전 작업 결과]
(조사) ① 배터리 가격 하락 ② 충전 인프라 확대 ③ 보조금 정책

[기대하는 결과물]
# 제목 한 줄, 도입 2문장, 본문 3단락(조사 결과의 핵심 3가지 각 1단락), 결론 1단락. 400~600자. 키워드 "전기차" 2회 이상. 마크다운.

[모호] 글자 수 50 · 제목 있음 False · 전기차 1회
[구체] 글자 수 70 · 제목 있음 True · 전기차 2회`,
            desc: '위쪽은 에이전트가 실제로 받는 프롬프트, 아래쪽은 실제 모델이 흔히 내는 두 결과를 대본으로 흉내 낸 것입니다. 구체적인 기준은 “제목 있음 · 키워드 2회” 처럼 <b>파이썬으로 검사할 수 있는 조건</b>이 됩니다 — 2교시 SEO 도구가 바로 이것을 자동화합니다.' },
          { type: 'callout', kind: 'tip', title: 'expected_output 작성 공식', html: '<b>구조</b>(제목 · 단락 수) + <b>길이</b>(글자 수 범위) + <b>필수 요소</b>(키워드 · 출처 · 행동 유도 문장) + <b>형식</b>(마크다운 · JSON) + <b>금지</b>(과장 표현 · 근거 없는 수치). 다섯 가지 중 세 가지 이상을 적으면 결과가 눈에 띄게 안정됩니다.' },
          { type: 'callout', kind: 'warn', title: '모의 LLM 에서의 한계', html: '모의 LLM 은 “검색” 키워드로 조사원 도구를 고르고, “블로그 … 작성” 으로 글의 뼈대만 돌려주므로 expected_output 을 바꿔도 글이 달라지지 않습니다. 그래서 예제 12-5 는 대본(mock_responses)으로 차이를 보여 줍니다. 🔑 키를 넣으면 기대 결과물의 효과를 바로 체감할 수 있습니다.' }
        ],
        practice: [
          { title: '실습 12-1. 주제를 바꿔 팀 재사용하기', level: 1, nondeterministic: true,
            desc: '<p>예제 12-2 의 2인 팀을 함수 <code>make_crew(llm)</code> 로 감싸서 새 Task 를 매번 만들고, 주제 <b>\'파이썬\'</b> 과 <b>\'한국폴리텍대학\'</b> 두 가지로 차례로 kickoff 하세요. 각 주제의 조사 결과(<code>research.output</code>) 첫 60자와 최종 글의 첫 줄을 출력합니다.</p>',
            hint: '같은 Task 객체를 두 번 kickoff 하면 <code>{topic}</code> 이 이미 치환되어 두 번째 주제가 반영되지 않습니다 → 함수 안에서 Task 를 새로 만드세요.',
            starter: `import agentlab as al

def make_crew(llm):
    researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
    writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
    # TODO: research, write Task 를 만들고 Crew 와 함께 (crew, research, write) 를 돌려주기
    return None, None, None

llm = al.LLM()
for topic in ['파이썬', '한국폴리텍대학']:
    crew, research, write = make_crew(llm)
    # TODO: kickoff 후 조사 결과 60자와 글 첫 줄 출력
`,
            solution: `import agentlab as al

def make_crew(llm):
    researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
    writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
    research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라',
                       expected_output='핵심 포인트 3가지', agent=researcher, name='조사')
    write = al.Task(description='{topic} 블로그 글을 작성해라',
                    expected_output='# 제목, 도입, 본문 3단락, 결론. 400~600자', agent=writer, context=[research], name='집필')
    return al.Crew(agents=[researcher, writer], tasks=[research, write]), research, write

llm = al.LLM()
for topic in ['파이썬', '한국폴리텍대학']:
    crew, research, write = make_crew(llm)
    final = crew.kickoff(inputs={'topic': topic})
    print(f'[{topic}] 조사:', research.output[:60], '…')
    print(f'[{topic}] 글 첫 줄:', final.split('\\n')[0])
    print()
print('총 LLM 호출:', llm.calls)
`,
            expect: `[파이썬] 조사: [시장 조사원] 파이썬: 파이썬은 1991년 귀도 반 로섬이 발표한 고급 프로그래밍 언어로, 읽기 쉬운 문법 …
[파이썬] 글 첫 줄: [블로그 작가] # 파이썬

[한국폴리텍대학] 조사: [시장 조사원] 한국폴리텍대학: 한국폴리텍대학은 고용노동부 산하의 국립 기술 교육 대학으로, 전국 캠퍼스에서 …
[한국폴리텍대학] 글 첫 줄: [블로그 작가] # 한국폴리텍대학

총 LLM 호출: 6` },
          { title: '실습 12-2. 단계별 산출물을 각각 파일로 남기기', level: 2, nondeterministic: true,
            desc: '<p>2인 팀을 실행한 뒤 <code>crew.tasks</code> 를 순회하며 각 작업의 결과를 <code>output_1_조사.md</code>, <code>output_2_집필.md</code> 처럼 번호와 이름이 붙은 파일로 저장하세요. 파일 맨 위에는 <code># 작업명 (담당 역할)</code> 제목 줄을 넣고, 저장 후 각 파일의 바이트 수를 출력합니다.</p>',
            hint: '<code>for i, t in enumerate(crew.tasks, 1): al.write_file(f\'output_{i}_{t.name}.md\', f\'# {t.name} ({t.agent.role})\\n\\n{t.output}\')</code>',
            starter: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론', agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write])
crew.kickoff(inputs={'topic': '전기차'})

# TODO: 작업마다 output_{번호}_{이름}.md 로 저장하고 바이트 수 출력
`,
            solution: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론', agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write])
crew.kickoff(inputs={'topic': '전기차'})

for i, t in enumerate(crew.tasks, 1):
    path = f'output_{i}_{t.name}.md'
    r = al.write_file(path, f'# {t.name} ({t.agent.role})\\n\\n{t.output}\\n')
    print(path, '→', r['bytes'], 'bytes')
print(al.read_file('output_1_조사.md')['content'].split('\\n')[0])
`,
            expect: `output_1_조사.md → 234 bytes
output_2_집필.md → 334 bytes
# 조사 (시장 조사원)` }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: '프로젝트 ②: 마케팅 자동화 에이전트 팀', subtitle: '조사원 + 작가 2인 팀으로 블로그 글 자동 생성', notes: '<p>11차시 비서(혼자 일하는 에이전트)와 대비해 “여러 단계 · 여러 능력” 이 필요한 일은 팀으로 나눈다는 동기를 줍니다.</p><p>💬 발문: “블로그 글 하나를 쓰려면 어떤 일을 순서대로 해야 하나요?” → 조사 · 집필 · 검토 · 수정 → 역할로 나눈다.</p><p>⏱ 도입 7분</p>' },
          { layout: 'table', title: '요구사항', head: ['구분', '요구사항'], rows: [
            ['F1', '주제 하나 → 조사 → 블로그 글 자동'], ['F2', '조사 = 출처 있는 핵심 3가지 · 글 = 제목 · 도입 · 본문 · 결론'],
            ['F3', '마크다운 파일로 저장'], ['F4 (2교시)', '편집자 검토 · 점수 낮으면 자동 수정 · SEO 검사'],
            ['N1', 'LLM 호출 10회 이내 · 토큰 · 비용 출력'], ['N2', '발행 전 사람 승인'], ['N3', '키 없이도 전체 실행']
          ], lead: '오늘은 F1~F3, 다음 교시에 F4 · N1~N2', notes: '<p>11차시 요구사항 표와 같은 형식임을 짚어 “프로젝트는 요구사항부터” 습관을 강화합니다.</p>' },
          { layout: 'diagram', title: '2인 팀: 조사원 → 작가', html: FIG_CREW2, caption: '작업을 차례로, 앞 결과를 뒤에 넘긴다',
            notes: '<p>09차시 CrewAI 그림과 같은 구조. 새로운 점: inputs 로 주제를 넣는다, 도구는 조사원에게만, context 로 결과 전달.</p><p>💬 “작가에게도 검색 도구를 주면?” → 조사를 건너뛰거나 엉뚱한 검색 → 역할마다 필요한 능력만.</p>' },
          { layout: 'table', title: '역할 설계표', head: ['에이전트', 'role', 'goal', 'tools'], rows: [
            ['🔎 조사원', '시장 조사원', '정확한 정보 · 핵심 정리', 'wiki_search'],
            ['✍️ 작가', '블로그 작가', '읽기 쉬운 마케팅 글', '없음'],
            ['🧐 편집자 (2교시)', '편집자', '문제점 · 수정 요청', '없음']
          ], lead: 'backstory 는 판단 기준과 말투를 만드는 “성격”', notes: '<p>학생들에게 표의 빈 칸(backstory)을 직접 채우게 합니다. “출처 없는 주장은 쓰지 않는다” 같은 문장이 실제 모델의 행동을 바꾼다는 점을 강조.</p>' },
          { layout: 'code', title: '에이전트 만들기와 시스템 프롬프트', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원',
    goal='주제에 대한 정확한 정보를 찾아 핵심을 정리한다',
    backstory='10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다.',
    llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가',
    goal='조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다',
    backstory='IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다.', llm=llm)

for a in (researcher, writer):
    print(a, a.tools.names())
    print(a.system_prompt())`, points: ['role · goal · backstory → 페르소나 프롬프트', '도구 있는 에이전트 = 내부 Agent 루프', '도구 없는 에이전트 = LLM 1회'],
            notes: '<p>▶ 실행 → system_prompt() 출력을 03차시 페르소나 프롬프트와 비교.</p>' },
          { layout: 'diagram', title: 'Task 의 세 요소', html: FIG_TASK, caption: 'description · expected_output · context → 하나의 프롬프트',
            notes: '<p>💬 “세 요소 중 품질을 가장 크게 바꾸는 것은?” → expected_output. 이유는 이 교시 마지막에 실험으로 확인.</p>' },
          { layout: 'code', title: '2인 팀 kickoff', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)

research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라',
                   expected_output='핵심 포인트 3가지 (각 한 문장, 출처 포함)', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라',
                expected_output='# 제목, 도입 2문장, 본문 3단락, 결론. 400~600자. 마크다운',
                agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write], verbose=True)
print(crew.kickoff(inputs={'topic': '전기차'}))
print('LLM 호출:', llm.calls)`, points: ['<code>{topic}</code> 은 inputs 로 치환', '조사원 2회 + 작가 1회 = 3회 호출', '“이전 작업 결과를 바탕으로” = context 전달 표시'],
            notes: '<p>▶ 실행. 💬 “LLM 호출이 왜 3회?” → 조사원은 도구 요청 + 답 = 2회, 작가 1회. 비용 감각 기르기.</p>' },
          { layout: 'diagram', title: '중간 산출물 파이프라인', html: FIG_PIPE, caption: '어느 단계에서 품질이 떨어졌는지 바로 찾는다',
            notes: '<p>“최종 글만 보지 말고 task.output 을 보라”. 조사가 빈약하면 글도 빈약하다는 GIGO 원칙.</p>' },
          { layout: 'code', title: '단계별 결과 보기와 파일 저장', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론', agent=writer, context=[research], name='집필')
crew = al.Crew(agents=[researcher, writer], tasks=[research, write])
final = crew.kickoff(inputs={'topic': '커피'})

for i, t in enumerate(crew.tasks, 1):
    print(f'--- {i} [{t.name}] {t.agent.role} · {len(t.output)}자')
    print(t.output[:100])
print(al.write_file('blog_커피.md', final))
with open('research_커피.md', 'w', encoding='utf-8') as f:
    f.write('# 조사 노트\\n\\n' + research.output)`, points: ['<code>task.output</code> · <code>crew.outputs</code>', '<code>al.write_file</code> 또는 <code>open()</code>', '조사 노트도 함께 저장'],
            notes: '<p>▶ 실행. 작업 폴더에 두 파일이 생긴다고 안내. 실제 모델에서는 접두어 없이 바로 게시 가능한 마크다운.</p>' },
          { layout: 'diagram', title: 'expected_output 이 품질을 좌우한다', html: FIG_PROMPT, caption: '측정 가능한 요구사항 = 검사할 수 있는 기준',
            notes: '<p>학생들의 “결과가 매번 달라요” 불만에 대한 답. 공식: 구조 + 길이 + 필수 요소 + 형식 + 금지.</p><p>💬 “‘좋은 글’ 은 왜 나쁜 expected_output 인가?” → 검사할 수 없다.</p>' },
          { layout: 'code', title: '에이전트가 받는 프롬프트 비교', code: `import agentlab as al

VAGUE = '블로그 글'
SPECIFIC = '# 제목 한 줄, 도입 2문장, 본문 3단락, 결론 1단락. 400~600자. 키워드 "전기차" 2회 이상.'
note = '(조사) ① 배터리 가격 하락 ② 충전 인프라 확대 ③ 보조금 정책'

def build_prompt(task, ctx):
    return (task.description + '\\n\\n[참고할 이전 작업 결과]\\n' + ctx
            + '\\n\\n[기대하는 결과물]\\n' + task.expected_output)

for label, eo in [('모호', VAGUE), ('구체', SPECIFIC)]:
    t = al.Task(description='전기차 블로그 글을 작성해라', expected_output=eo)
    print(f'=== {label} ===')
    print(build_prompt(t, note))`, points: ['세 요소가 한 프롬프트로', '구체적 기준 = 파이썬으로 검사 가능', '🔑 키로 실제 차이 체험'],
            notes: '<p>▶ 실행. 키가 있는 학생에게 두 버전을 실제 모델로 돌려 글자 수 · 제목 유무를 발표하게 합니다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[2].q, options: QUIZ1[2].options, answer: QUIZ1[2].answer, explain: QUIZ1[2].explain, notes: '<p>정답 공개 후 expected_output 공식을 다시 한 번 칠판에.</p>' },
          { layout: 'practice', title: '실습 12-1. 주제를 바꿔 팀 재사용', desc: '<p><code>make_crew(llm)</code> 함수로 Task 를 매번 새로 만들고 두 주제로 kickoff 하세요.</p>',
            starter: `import agentlab as al

def make_crew(llm):
    researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
    writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
    # TODO: Task 두 개 + Crew 돌려주기
    return None

llm = al.LLM()
for topic in ['파이썬', '커피']:
    crew = make_crew(llm)
    # TODO: kickoff 후 첫 줄 출력`, solution: `import agentlab as al

def make_crew(llm):
    researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
    writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
    r = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
    w = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론', agent=writer, context=[r], name='집필')
    return al.Crew(agents=[researcher, writer], tasks=[r, w])

llm = al.LLM()
for topic in ['파이썬', '커피']:
    crew = make_crew(llm)
    print(topic, '→', crew.kickoff(inputs={'topic': topic}).split('\\n')[0])`, notes: '<p>흔한 오류: Task 를 함수 밖에서 한 번만 만들어 두 번째 주제가 반영되지 않음 → format 이 한 번만 된다는 점 설명.</p>' },
          { layout: 'summary', title: '정리', bullets: ['여러 단계 · 여러 능력이 필요한 일 → <b>역할 분담 팀</b>', 'CrewAgent(role · goal · backstory · tools) + Task(description · expected_output · context)', '<code>kickoff(inputs)</code> 로 주제 치환 · <code>task.output</code> 으로 중간 산출물 점검', '마크다운 파일로 저장 → 바로 게시', '<b>expected_output</b> = 측정 가능한 요구사항이 품질을 좌우', '다음 교시: 편집자 · 자동 검수 · SEO · 비용 · 사람 승인'],
            notes: '<p>⏱ 정리 5분. 과제: 실습 12-2. 다음 교시 시작 때 “결과가 매번 다르면?” 질문으로 복습.</p>' }
        ]
      },
      {
        id: 'ag12-2',
        title: '팀 확장과 품질: 편집자 · 검수 루프 · SEO · 비용 · 사람 승인',
        minutes: 50,
        goals: ['편집자를 더한 3인 팀으로 검토 → 수정 흐름을 만든다', 'Reflector 점수 루프와 SEO 체크 도구로 자동 검수를 구현하고 비용을 측정한다', '사람 승인 단계를 넣어 파이프라인을 완성하고 발표 체크리스트로 점검한다'],
        flow: [['3인 팀 · 검토 루프', 12], ['자동 검수 · SEO 도구', 13], ['비용 측정 · 사람 승인', 13], ['실제 CrewAI · 체크리스트', 8], ['정리', 4]],
        content: [
          { type: 'p', html: '1교시의 2인 팀은 글을 “만들기만” 했습니다. 실제 마케팅 팀에는 <b>편집자</b>가 있고, 발행 전에 <b>검수</b>와 <b>승인</b>이 있습니다. 이번 교시에는 팀을 3인으로 늘리고, 점수 기반 자동 검수 루프와 SEO 검사 도구를 붙이고, 비용을 측정한 뒤, 마지막에 사람이 승인하는 단계를 넣어 파이프라인을 완성합니다.' },
          { type: 'h', text: '1. 편집자 추가: 3인 팀, 4개 작업' },
          { type: 'p', html: '편집자는 글을 <b>검토해 문제점과 수정 요청</b>을 씁니다. 그 의견을 받아 작가가 <b>다시 고쳐 쓰는</b> 네 번째 작업이 추가됩니다. 수정 작업의 <code>context</code> 에 초안(집필)과 검토 의견(검토)을 모두 넣는 것이 핵심입니다 — 둘 중 하나만 주면 작가는 무엇을 어떻게 고칠지 알 수 없습니다.' },
          { type: 'figure', html: FIG_CREW3, caption: '그림 12-5. 3인 팀 · 4개 작업. 작가는 집필과 수정 두 작업을 맡습니다.' },
          { type: 'code', title: '예제 12-6. 3인 팀 — 조사 · 집필 · 검토 · 수정', nondeterministic: true, code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', backstory='10년차 리서치 애널리스트', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 마케팅 글을 쓴다', backstory='IT 블로그 에디터', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 문제점을 찾아 구체적인 수정 요청을 한다', backstory='출판사 편집장 출신', llm=llm)

research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 포인트 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문 3단락, 결론. 400~600자', agent=writer, context=[research], name='집필')
review = al.Task(description='블로그 글을 검토하고 문제점과 수정 요청을 써라', expected_output='문제점과 수정 요청 3가지', agent=editor, context=[write], name='검토')
revise = al.Task(description='원문: {topic} 블로그 글\\n\\n편집자 의견을 반영해 고쳐 써라', expected_output='수정된 최종 글 (같은 구조)', agent=writer, context=[write, review], name='수정')

crew = al.Crew(agents=[researcher, writer, editor], tasks=[research, write, review, revise], verbose=True)
final = crew.kickoff(inputs={'topic': '전기차'})
print('=== 최종 ===')
print(final)
print('작업 수:', len(crew.tasks), '· LLM 호출:', llm.calls, '· 토큰:', llm.total_usage.total_tokens)`,
            expect: `
🧑‍💼 [시장 조사원] 작업 1/4: 전기차 를 검색해 핵심 포인트 3가지를 정리해라
   ✔ 결과: [시장 조사원] 전기 자동차: 전기 자동차는 배터리에 저장된 전기로 모터를 구동하는 자동차로, 배출가스가 없고 유지비가 낮아 보급이 빠르게 늘고 있다.

🧑‍💼 [블로그 작가] 작업 2/4: 전기차 블로그 글을 작성해라
   ✔ 결과: [블로그 작가] # 전기차

이전 작업 결과를 바탕으로 도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는

🧑‍💼 [편집자] 작업 3/4: 블로그 글을 검토하고 문제점과 수정 요청을 써라
   ✔ 결과: [편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.

🧑‍💼 [블로그 작가] 작업 4/4: 원문: 전기차 블로그 글

편집자 의견을 반영해 고쳐 써라
   ✔ 결과: [블로그 작가] 수정본: 전기차 블로그 글 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.
=== 최종 ===
[블로그 작가] 수정본: 전기차 블로그 글 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.
작업 수: 4 · LLM 호출: 5 · 토큰: 641`,
            desc: '편집자가 “근거가 1개뿐 · 출처 추가 · 마지막 문단 줄이기” 를 요구하고, 작가가 출처가 있는 수정본을 냈습니다. 모의 LLM 은 검토 · 수정을 정해진 문장으로 흉내 내지만, 흐름(검토 의견이 수정 작업의 context 로 들어감)은 실제와 같습니다. 호출 5회 = 조사원 2 + 작가 1 + 편집자 1 + 작가 1.' },
          { type: 'h', text: '2. Reflector 자동 검수 루프: 점수가 낮으면 다시' },
          { type: 'p', html: '편집자 한 번으로 충분할까요? 06차시의 <code>al.Reflector</code> 는 <b>점수(JSON)</b>를 매길 수 있으므로, “8점 미만이면 비평 → 수정을 반복, 최대 2회” 같은 <b>자동 검수 루프</b>를 만들 수 있습니다. 한 바퀴에 LLM 3회(평가 + 비평 + 수정)가 들므로 <b>최대 횟수</b>는 품질 조건이자 비용 상한입니다.' },
          { type: 'figure', html: FIG_REFLECT, caption: '그림 12-6. 점수 기반 검수 루프. 통과 조건과 최대 횟수 둘 다 있어야 멈춥니다.' },
          { type: 'code', title: '예제 12-7. score < 8 이면 수정 — 최대 2회', code: `import agentlab as al

draft = """# 전기차

도입: 왜 지금 전기차인가?
본문: 핵심 포인트 세 가지(배터리 가격 · 충전 인프라 · 보조금)를 사례와 함께 설명한다.
결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다."""

llm = al.LLM()
reflector = al.Reflector(llm)
THRESHOLD, MAX_ROUNDS = 8, 2
text, rounds = draft, 0
while True:
    s = reflector.score(text, criteria='명확성 · 근거 · 행동 유도')
    print(f'검수 {rounds}: 점수 {s["score"]}/10 · 문제 {s["issues"]}')
    if s['score'] >= THRESHOLD or rounds >= MAX_ROUNDS:
        break
    feedback = reflector.critique(text)
    text = reflector.revise(text, feedback)
    rounds += 1
    print('  ✏️ 수정본:', text[:60], '…')

reason = '기준 통과' if s['score'] >= THRESHOLD else '최대 횟수 도달'
print(f'종료: {reason} · 수정 {rounds}회 · LLM 호출 {llm.calls}회 · 토큰 {llm.total_usage.total_tokens}')`,
            expect: `검수 0: 점수 7/10 · 문제 ['근거가 부족함', '문장이 길음']
  ✏️ 수정본: [피드백을 반영해 글을 고치는 작가] 수정본: # 전기차 최근 조사에 따르면 사용자의 72%가 이 기능을 매 …
검수 1: 점수 7/10 · 문제 ['근거가 부족함', '문장이 길음']
  ✏️ 수정본: [피드백을 반영해 글을 고치는 작가] 수정본: 수정본: # 전기차 최근 조사에 따르면 사용자의 72%가 이  …
검수 2: 점수 7/10 · 문제 ['근거가 부족함', '문장이 길음']
종료: 최대 횟수 도달 · 수정 2회 · LLM 호출 7회 · 토큰 789`,
            desc: '모의 LLM 은 항상 7점을 주므로 <b>최대 횟수에서 멈추는</b> 경로를 보여 줍니다 — 만약 <code>MAX_ROUNDS</code> 가 없었다면 영원히 돌았을 것입니다. 실제 모델은 보통 1~2회 수정 뒤 8점 이상으로 통과합니다. 7회 호출 = 평가 3 + (비평 + 수정) × 2.' },
          { type: 'h', text: '3. SEO 키워드 체크 도구: LLM 없이 객관적 검사' },
          { type: 'p', html: '“키워드가 2번 이상 들어갔나, 제목이 있나, 글자 수가 범위 안인가” 는 LLM 에게 물을 일이 아닙니다. <b>순수 파이썬</b>으로 검사하면 항상 같은 결과가 나오고 비용도 0 입니다. 이런 객관적 규칙은 파이썬이, 어조 · 설득력 같은 주관적 품질은 LLM(Reflector)이 맡는 것이 역할 분담입니다. <code>@al.tool</code> 로 감싸 두면 편집자 에이전트가 도구로 쓸 수도 있습니다.' },
          { type: 'code', title: '예제 12-8. seo_check 도구 — 키워드 · 제목 · 글자 수 점수', code: `import agentlab as al

@al.tool
def seo_check(text: str, keywords: str, min_chars: int = 300, max_chars: int = 800) -> dict:
    """블로그 글의 SEO 기본 조건(키워드 포함 · 제목 · 글자 수)을 검사해 100점 만점 점수를 준다
    text: 검사할 글
    keywords: 쉼표로 구분한 키워드 목록. 예: '전기차, 배터리, 충전'
    min_chars: 최소 글자 수
    max_chars: 최대 글자 수
    """
    body = str(text).strip()
    kws = [k.strip() for k in str(keywords).split(',') if k.strip()]
    counts = {k: body.lower().count(k.lower()) for k in kws}
    found = [k for k, c in counts.items() if c >= 1]
    has_title = body.startswith('#')
    n = len(body)
    score = round(60 * len(found) / max(1, len(kws))) + (20 if has_title else 0) + (20 if min_chars <= n <= max_chars else 0)
    return {'score': score, 'counts': counts, 'missing': [k for k in kws if k not in found],
            'title': has_title, 'chars': n, 'length_ok': min_chars <= n <= max_chars}

short = '# 전기차\\n\\n전기차는 배터리로 달립니다. 충전소가 늘고 있습니다.'
long = ('# 전기차, 지금 사야 할까?\\n\\n' + '전기차 배터리 가격이 내려가고 충전 인프라가 늘면서 전기차 보급이 빨라지고 있습니다. ' * 6
        + '결론: 전기차 시승부터 해 보세요.')
for name, t in [('짧은 초안', short), ('긴 초안', long)]:
    r = seo_check(t, '전기차, 배터리, 충전, 보조금')
    print(f"{name}: {r['score']}점 · 키워드 {r['counts']} · 빠짐 {r['missing']} · 제목 {r['title']} · {r['chars']}자 길이OK {r['length_ok']}")
print(seo_check.schema()['parameters']['required'])`,
            expect: `짧은 초안: 65점 · 키워드 {'전기차': 2, '배터리': 1, '충전': 1, '보조금': 0} · 빠짐 ['보조금'] · 제목 True · 36자 길이OK False
긴 초안: 85점 · 키워드 {'전기차': 14, '배터리': 6, '충전': 6, '보조금': 0} · 빠짐 ['보조금'] · 제목 True · 325자 길이OK True
['text', 'keywords']`,
            desc: '점수 = 키워드 포함률 60 + 제목 20 + 길이 20. 빠진 키워드 목록(<code>missing</code>)을 수정 작업의 <code>context</code> 나 피드백에 넣으면 “보조금 내용을 추가해라” 같은 구체적 수정 요청이 됩니다. 매개변수에 기본값이 있으면 <code>required</code> 에서 빠지는 것도 확인하세요.' },
          { type: 'h', text: '4. 비용과 호출 횟수 측정' },
          { type: 'p', html: '팀이 커질수록 LLM 호출과 토큰이 빠르게 늘어납니다. <code>llm.calls</code> 와 <code>llm.total_usage</code> 를 작업 전후로 빼면 <b>작업별 비용</b>을 알 수 있습니다. 측정 결과를 표로 남기면 “어느 단계가 비싼가 → 어떻게 줄일까(요약해서 넘기기 · 검수 횟수 제한 · 작은 모델)” 로 이어집니다.' },
          { type: 'figure', html: FIG_COST, caption: '그림 12-7. 작업별 토큰 사용량 예시. context 가 누적되는 뒤쪽 작업이 비쌉니다.' },
          { type: 'code', title: '예제 12-9. 작업별 호출 횟수 · 토큰 · 예상 비용 표', code: `import agentlab as al

llm = al.LLM()
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 품질을 높인다', llm=llm)
write = al.Task(description='전기차 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문, 결론. 500자', agent=writer, name='집필')
review = al.Task(description='블로그 글을 검토하고 문제점과 수정 요청을 써라', expected_output='문제점 3가지', agent=editor, context=[write], name='검토')
revise = al.Task(description='원문: 전기차 블로그 글\\n\\n편집자 의견을 반영해 고쳐 써라', expected_output='최종 글', agent=writer, context=[write, review], name='수정')

rows = []
for task in [write, review, revise]:
    c0, p0, k0 = llm.calls, llm.total_usage.prompt_tokens, llm.total_usage.completion_tokens
    ctx = '\\n\\n'.join(f'({t.name}) {t.output}' for t in task.context if t.output)
    task.output = task.agent.execute(task, ctx)          # Crew.kickoff 가 하는 일을 한 작업씩
    rows.append((task.name, task.agent.role, llm.calls - c0, llm.total_usage.prompt_tokens - p0, llm.total_usage.completion_tokens - k0))

print(f"{'작업':<6}{'담당':<10}{'호출':>4}{'입력':>8}{'출력':>8}")
for name, role, calls, pin, pout in rows:
    print(f'{name:<6}{role:<10}{calls:>4}{pin:>8}{pout:>8}')
u = llm.total_usage
print(f'합계: 호출 {llm.calls}회 · 입력 {u.prompt_tokens} · 출력 {u.completion_tokens} · 총 {u.total_tokens} 토큰')
PRICE_IN, PRICE_OUT = 0.10, 0.40          # 달러 / 100만 토큰 (소형 모델 예시)
cost = u.prompt_tokens / 1e6 * PRICE_IN + u.completion_tokens / 1e6 * PRICE_OUT
print(f'예상 비용: {cost:.6f} 달러 / 실행 → 1,000회면 {cost * 1000:.2f} 달러')`,
            expect: `작업    담당          호출      입력      출력
집필    블로그 작가       1      37      39
검토    편집자          1      82      26
수정    블로그 작가       1     113      38
합계: 호출 3회 · 입력 232 · 출력 103 · 총 335 토큰
예상 비용: 0.000064 달러 / 실행 → 1,000회면 0.06 달러`,
            desc: '입력 토큰이 38 → 82 → 113 으로 커지는 것이 context 누적의 효과입니다(모의 LLM 은 글자 수/3 으로 토큰을 어림합니다). 실제 모델은 응답의 <code>usage</code> 를 그대로 더하므로 같은 코드로 정확한 비용을 구할 수 있습니다. 단가는 공급자 요금표에서 확인하세요.' },
          { type: 'h', text: '5. 사람 승인 단계 (Human-in-the-loop)' },
          { type: 'p', html: '자동 검수를 통과했더라도 <b>외부에 발행</b>하는 것은 되돌릴 수 없는 행동입니다. 회사 블로그에 잘못된 수치가 올라가면 자동화의 이득보다 손해가 큽니다. 그래서 파이프라인의 마지막에 사람이 <b>승인(y) / 거부(n) + 한 줄 피드백</b>을 넣는 단계를 둡니다. 거부되면 피드백을 반영해 다시 쓰고 다시 묻습니다.' },
          { type: 'figure', html: FIG_HITL, caption: '그림 12-8. 사람 승인 단계. 되돌릴 수 없는 행동 앞에는 반드시 확인이 있어야 합니다.' },
          { type: 'code', title: '예제 12-10. 승인되면 발행, 거부되면 피드백 반영 후 재요청 (입력: n, 수치 출처 보강 / y)', stdin: 'n\n수치에 출처를 붙여 주세요\ny\n', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
draft = """# 전기차, 지금 사야 할까?

도입: 전기차 보급이 빨라지고 있습니다.
본문: 배터리 가격 하락 · 충전 인프라 확대 · 보조금 정책.
결론: 이번 주말 시승부터 해 보세요."""

text, attempt = draft, 1
while True:
    print(f'--- 승인 요청 {attempt} ---')
    print(text[:80], '…')
    ok = input('이 글을 발행할까요? (y/n): ').strip().lower()
    if ok == 'y':
        r = al.write_file('published_blog.md', text)
        print('✅ 발행 완료:', r['path'], r['bytes'], 'bytes')
        break
    feedback = input('수정 요청을 한 줄로 적어 주세요: ')
    text = reflector.revise(text, feedback)
    attempt += 1
    if attempt > 3:
        print('⛔ 3회 거부 — 사람이 직접 작성하도록 넘깁니다')
        break
print('LLM 호출:', llm.calls, '· 시도:', attempt)`,
            expect: `--- 승인 요청 1 ---
# 전기차, 지금 사야 할까?

도입: 전기차 보급이 빨라지고 있습니다.
본문: 배터리 가격 하락 · 충전 인프라 확대 · 보조금 정책.
결론: …
이 글을 발행할까요? (y/n): n
수정 요청을 한 줄로 적어 주세요: 수치에 출처를 붙여 주세요
--- 승인 요청 2 ---
[피드백을 반영해 글을 고치는 작가] 수정본: # 전기차, 지금 사야 할까? 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처 …
이 글을 발행할까요? (y/n): y
✅ 발행 완료: published_blog.md 297 bytes
LLM 호출: 1 · 시도: 2`,
            desc: '첫 요청은 거부(n)되어 피드백이 <code>revise</code> 에 들어가고, 두 번째 요청에서 승인(y)되어 파일로 “발행” 되었습니다. 최대 3회라는 상한도 두었습니다. 실제 서비스에서는 <code>input()</code> 대신 웹 UI 의 버튼이나 슬랙 메시지 승인이 되지만 구조는 같습니다. 13차시에서 이 원칙을 “위험한 도구 가드” 로 일반화합니다.' },
          { type: 'h', text: '6. 실제 CrewAI 코드 (Colab)' },
          { type: 'p', html: 'Colab 에서는 진짜 CrewAI 로 같은 팀을 만듭니다. 클래스 이름은 거의 같고(<code>Agent</code> · <code>Task</code> · <code>Crew</code>), 검색 도구는 유료 <code>SerperDevTool</code> 대신 키가 필요 없는 <b>DuckDuckGo</b> 를 <code>@tool</code> 로 감싸 씁니다. LLM 은 Gemini 무료 키를 LiteLLM 형식(<code>gemini/gemini-2.5-flash</code>)으로 지정합니다.' },
          { type: 'code', title: '예제 12-11. (Colab 에서 실행) CrewAI 3인 마케팅 팀', run: false, code: `# pip install -q crewai crewai-tools duckduckgo-search
import os
from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import tool
from duckduckgo_search import DDGS

llm = LLM(model='gemini/gemini-2.5-flash', api_key=os.environ['GEMINI_API_KEY'], temperature=0.3)

@tool('web_search')
def web_search(query: str) -> str:
    """키워드로 웹을 검색해 상위 결과 3개의 제목과 요약을 돌려준다 (DuckDuckGo, 키 불필요)"""
    with DDGS() as ddgs:
        hits = list(ddgs.text(query, max_results=3, region='kr-kr'))
    return '\\n'.join(f"- {h['title']}: {h['body'][:200]} ({h['href']})" for h in hits) or '검색 결과 없음'

researcher = Agent(role='시장 조사원', goal='{topic} 에 대한 정확한 최신 정보를 찾아 핵심을 정리한다',
                   backstory='10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다.', tools=[web_search], llm=llm, verbose=True)
writer = Agent(role='블로그 작가', goal='조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다',
               backstory='IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다.', llm=llm, verbose=True)
editor = Agent(role='편집자', goal='글의 문제점을 찾아 구체적인 수정 요청을 한다',
               backstory='출판사 편집장 출신. 근거 없는 문장을 싫어한다.', llm=llm, verbose=True)

research = Task(description='{topic} 을 웹에서 검색해 핵심 포인트 3가지를 출처와 함께 정리해라',
                expected_output='핵심 포인트 3가지 (각 한 문장 + 출처 URL)', agent=researcher)
write = Task(description='조사 결과를 바탕으로 {topic} 블로그 글을 작성해라',
             expected_output='# 제목 한 줄, 도입 2문장, 본문 3단락(핵심 3가지 각 1단락), 결론 1단락. 400~600자. 키워드 "{topic}" 2회 이상. 마크다운.',
             agent=writer, context=[research])
review = Task(description='블로그 글을 검토하고 문제점과 수정 요청 3가지를 써라',
              expected_output='문제점과 수정 요청 3가지 (번호 목록)', agent=editor, context=[write])
revise = Task(description='편집자의 수정 요청을 모두 반영해 글을 고쳐 써라',
              expected_output='수정된 최종 글 (같은 구조, 마크다운)', agent=writer, context=[write, review],
              output_file='blog_final.md')

crew = Crew(agents=[researcher, writer, editor], tasks=[research, write, review, revise],
            process=Process.sequential, verbose=True)
result = crew.kickoff(inputs={'topic': '전기차'})
print(result.raw[:500])
print('토큰:', result.token_usage)`,
            desc: '브라우저 코드와 거의 같습니다. 다른 점: <code>Agent</code> 이름, <code>LLM(model=\'gemini/…\')</code>, <code>output_file</code> 로 자동 저장, <code>result.token_usage</code> 로 토큰 확인. 노트북에서는 점수 루프(LLM-as-a-judge)와 사람 승인 셀도 같이 만듭니다.' },
          { type: 'colab', title: 'Colab 실습 12 — CrewAI 마케팅 팀 완성하기', html: '<p>노트북에서는 ① DuckDuckGo 검색 도구 단독 테스트 ② 2인 팀 kickoff 와 <code>tasks_output</code> 확인 ③ 편집자 추가 3인 팀 ④ Gemini 로 점수 매기는 검수 루프 ⑤ 순수 파이썬 SEO 체크 ⑥ <code>token_usage</code> 비용 표 ⑦ 사람 승인 셀 순서로 진행합니다. 키는 Colab Secrets 의 <code>GEMINI_API_KEY</code> 하나면 됩니다(무료 등급은 분당 요청 제한이 있으니 verbose 를 끄고 한 번씩 실행). ✏️ 실습 문제 4개.</p>' },
          { type: 'h', text: '7. 발표용 체크리스트' },
          { type: 'table', head: ['#', '체크 항목', '확인 방법'], rows: [
            ['1', '역할 설계표(role · goal · backstory · tools)가 3인 이상 채워져 있다', '표 12-2 형식'],
            ['2', '주제 하나로 조사 → 집필 → 검토 → 수정이 자동으로 돌고 <code>task.output</code> 을 모두 볼 수 있다', '예제 12-6'],
            ['3', 'expected_output 에 구조 · 길이 · 키워드 · 형식이 적혀 있다', '예제 12-5 공식'],
            ['4', '점수 기반 검수 루프에 통과 조건과 최대 횟수가 모두 있다', '예제 12-7'],
            ['5', '순수 파이썬 SEO 도구가 키워드 · 제목 · 길이를 검사한다', '예제 12-8'],
            ['6', '작업별 호출 횟수 · 토큰 · 예상 비용 표를 출력한다', '예제 12-9'],
            ['7', '발행 전 사람 승인 단계가 있고 거부 시 피드백이 반영된다', '예제 12-10'],
            ['8', '최종 글이 마크다운 파일로 저장된다', '예제 12-4'],
            ['9', '한 번 실행에 LLM 호출 10회 이내 (검수 1바퀴 포함)', '<code>llm.calls</code>'],
            ['10', 'Colab 에서 실제 CrewAI 로 같은 팀이 동작한다', '노트북']
          ], caption: '표 12-3. 프로젝트 ② 발표 체크리스트. 8개 이상이면 발표 준비 완료입니다.' },
          { type: 'callout', kind: 'more', title: '한 걸음 더: 계층형(hierarchical) 팀', html: '작업마다 담당을 미리 정하지 않고 <b>매니저 LLM</b>이 “이 작업은 누가 맡을까” 를 고르게 할 수도 있습니다. agentlab 은 <code>al.Crew(..., process=\'hierarchical\', manager_llm=llm)</code>, CrewAI 는 <code>Process.hierarchical</code> + <code>manager_llm</code> 입니다. 역할이 많고 작업이 유동적일 때 유용하지만, 매니저 호출만큼 비용이 늘고 결과를 예측하기 어려워집니다. 수업 프로젝트는 sequential 로 충분합니다.' },
          { type: 'table', teacher: true, head: ['항목', '내용'], rows: [
            ['수업 운영', '1교시: 전원이 2인 팀을 따라 만들고 주제만 바꿔 실행. 2교시: 3~4인 팀으로 체크리스트 10개를 채우는 미니 프로젝트, 마지막 8분에 팀별 “최종 글 + 비용 표” 1분 발표'],
            ['역할 분담 (학생 팀)', '🧭 PM: 요구사항 · 체크리스트 · 발표 / ✍️ 프롬프트 담당: role · backstory · expected_output / 🔧 도구 담당: SEO 도구 · 저장 · 비용 표 / 🧐 품질 담당: 검수 루프 · 승인 단계'],
            ['자주 막히는 곳', '① 같은 Task 객체를 두 번 kickoff(치환 안 됨) ② 수정 작업 context 에 검토 의견만 넣고 초안을 안 넣음 ③ 검수 루프에 최대 횟수가 없어 무한 반복 ④ 모의 LLM 에서 “피드백” 단어가 든 작업 설명이 검토 답으로 바뀜(설명에 “의견 · 고쳐 써라” 사용)'],
            ['시간 조절', '늦는 팀: 예제 12-9(비용 표)는 코드를 복사해 실행만 / 빠른 팀: 계층형 팀 또는 SNS 요약 작업 추가(실습 12-3 · 12-4)'],
            ['연결', '13차시 평가(LLM-as-a-judge)는 예제 12-7 의 score 를 일반화한 것, 안전(위험 도구 가드)은 예제 12-10 의 승인 단계를 일반화한 것']
          ], caption: '🧑‍🏫 수업 운영 메모' },
          { type: 'table', teacher: true, head: ['영역 (배점)', '상', '중', '하'], rows: [
            ['팀 설계 (20)', '<b>17~20</b> 3인 이상 역할 설계표, 도구 배정 이유와 backstory 가 결과에 미친 영향을 설명', '<b>10~16</b> 역할표는 있으나 backstory · 도구 배정 이유가 형식적', '<b>0~9</b> 역할 구분 없이 한 에이전트가 모두 처리'],
            ['작업 설계 (20)', '<b>17~20</b> 모든 Task 에 측정 가능한 expected_output, context 연결이 정확(수정 작업에 초안 + 검토)', '<b>10~16</b> expected_output 이 일부만 구체적', '<b>0~9</b> “글을 써라” 수준'],
            ['품질 관리 (25)', '<b>21~25</b> 점수 루프(통과 조건 + 최대 횟수) + SEO 도구 + 사람 승인이 모두 동작, 거부 시 피드백 반영', '<b>13~20</b> 둘 이상 구현, 상한 또는 피드백 반영 누락', '<b>0~12</b> 검수 없음'],
            ['비용 · 운영 (15)', '<b>13~15</b> 작업별 호출 · 토큰 · 예상 비용 표, 10회 이내 달성 또는 줄인 방법 설명', '<b>8~12</b> 합계만 출력', '<b>0~7</b> 측정 없음'],
            ['산출물 · 발표 (20)', '<b>17~20</b> 마크다운 최종 글 + 조사 노트 파일, 1분 안에 파이프라인 시연, 실패 사례와 대응 설명', '<b>10~16</b> 파일은 있으나 시연이 불완전', '<b>0~9</b> 산출물 없음']
          ], caption: '🧑‍🏫 프로젝트 ② 평가 루브릭 (100점)' },
          { type: 'callout', teacher: true, kind: 'info', title: '🧑‍🏫 실습 정답 해설', html: '<b>12-1</b> Task 를 함수 안에서 새로 만들어야 두 번째 주제가 반영됨. <b>12-2</b> 파일명에 한글이 들어가도 브라우저 작업 폴더에서는 문제없음. <b>12-3</b> 금지어 검사는 <code>found_banned = [w for w in banned if w in body]</code> 후 감점(개당 −10, 0 미만 방지는 <code>max(0, …)</code>). <b>12-4</b> SEO 점수와 Reflector 점수를 모두 조건에 넣으면 <code>and</code> 로 묶어야 하며, 빠진 키워드를 피드백 문자열로 만들어 <code>revise</code> 에 넘기는 것이 핵심. 모의 LLM 은 점수가 오르지 않으므로 최대 횟수에서 멈추는 것이 정상.' }
        ],
        practice: [
          { title: '실습 12-3. SEO 도구에 금지어 검사 추가하기', level: 2,
            desc: '<p>예제 12-8 의 <code>seo_check</code> 에 <b>금지어</b> 검사를 추가하세요. 매개변수 <code>banned: str = \'최고, 무조건, 100%\'</code>(쉼표 구분)를 받아, 글에 들어 있는 금지어를 <code>banned_found</code> 목록으로 돌려주고 개당 10점을 감점합니다(0점 미만으로 내려가지 않게). 두 초안으로 테스트하세요.</p>',
            hint: '<code>bl = [w.strip() for w in banned.split(\',\') if w.strip()]</code> → <code>banned_found = [w for w in bl if w in body]</code> → <code>score = max(0, score - 10 * len(banned_found))</code>',
            starter: `import agentlab as al

@al.tool
def seo_check(text: str, keywords: str, banned: str = '최고, 무조건, 100%') -> dict:
    """SEO 기본 조건(키워드 · 제목 · 길이)과 금지어를 검사해 점수를 준다
    text: 검사할 글
    keywords: 쉼표로 구분한 키워드
    banned: 쉼표로 구분한 금지어
    """
    body = str(text).strip()
    kws = [k.strip() for k in str(keywords).split(',') if k.strip()]
    found = [k for k in kws if k.lower() in body.lower()]
    score = round(60 * len(found) / max(1, len(kws))) + (20 if body.startswith('#') else 0) + (20 if 300 <= len(body) <= 800 else 0)
    # TODO: 금지어 목록 만들기 → 포함된 금지어 찾기 → 개당 10점 감점 (0 미만 금지)
    banned_found = []
    return {'score': score, 'found': found, 'banned_found': banned_found, 'chars': len(body)}

a = '# 전기차\\n\\n전기차는 무조건 최고입니다. 100% 만족을 보장합니다. 배터리와 충전 모두 좋습니다.'
b = '# 전기차\\n\\n' + '전기차 배터리와 충전 인프라를 살펴봅니다. ' * 13
for t in (a, b):
    print(seo_check(t, '전기차, 배터리, 충전'))
`,
            solution: `import agentlab as al

@al.tool
def seo_check(text: str, keywords: str, banned: str = '최고, 무조건, 100%') -> dict:
    """SEO 기본 조건(키워드 · 제목 · 길이)과 금지어를 검사해 점수를 준다
    text: 검사할 글
    keywords: 쉼표로 구분한 키워드
    banned: 쉼표로 구분한 금지어
    """
    body = str(text).strip()
    kws = [k.strip() for k in str(keywords).split(',') if k.strip()]
    found = [k for k in kws if k.lower() in body.lower()]
    score = round(60 * len(found) / max(1, len(kws))) + (20 if body.startswith('#') else 0) + (20 if 300 <= len(body) <= 800 else 0)
    bl = [w.strip() for w in str(banned).split(',') if w.strip()]
    banned_found = [w for w in bl if w in body]
    score = max(0, score - 10 * len(banned_found))
    return {'score': score, 'found': found, 'banned_found': banned_found, 'chars': len(body)}

a = '# 전기차\\n\\n전기차는 무조건 최고입니다. 100% 만족을 보장합니다. 배터리와 충전 모두 좋습니다.'
b = '# 전기차\\n\\n' + '전기차 배터리와 충전 인프라를 살펴봅니다. ' * 13
for t in (a, b):
    print(seo_check(t, '전기차, 배터리, 충전'))
`,
            expect: `{'score': 50, 'found': ['전기차', '배터리', '충전'], 'banned_found': ['최고', '무조건', '100%'], 'chars': 55}
{'score': 100, 'found': ['전기차', '배터리', '충전'], 'banned_found': [], 'chars': 318}` },
          { title: '실습 12-4. (도전) SEO 점수와 Reflector 점수를 함께 보는 검수 루프', level: 3,
            desc: '<p>예제 12-7 의 루프를 고쳐 <b>두 조건</b>(Reflector 점수 ≥ 8 <b>그리고</b> SEO 점수 ≥ 80)을 모두 만족해야 통과하게 하세요. 통과하지 못하면 빠진 키워드 목록을 피드백 문장(“다음 키워드를 본문에 추가: …”)으로 만들어 <code>reflector.revise(text, feedback)</code> 에 넘깁니다. 최대 2회에서 멈추고, 매 바퀴 두 점수를 출력하세요.</p>',
            hint: '<code>seo = seo_check(text, KEYWORDS)</code>, <code>passed = s[\'score\'] >= 8 and seo[\'score\'] >= 80</code>. 피드백: <code>\'다음 키워드를 본문에 추가: \' + \', \'.join(seo[\'missing\'])</code>',
            starter: `import agentlab as al

def seo_check(text, keywords):
    body = str(text).strip()
    kws = [k.strip() for k in keywords.split(',')]
    found = [k for k in kws if k in body]
    score = round(60 * len(found) / len(kws)) + (20 if body.startswith('#') else 0) + (20 if 300 <= len(body) <= 800 else 0)
    return {'score': score, 'missing': [k for k in kws if k not in found]}

KEYWORDS = '전기차, 배터리, 충전, 보조금'
draft = '# 전기차\\n\\n도입: 왜 지금 전기차인가?\\n본문: 배터리 가격과 충전 인프라.\\n결론: 시승부터.'
llm = al.LLM()
reflector = al.Reflector(llm)
text, rounds = draft, 0
while True:
    s = reflector.score(text)
    seo = seo_check(text, KEYWORDS)
    # TODO: 두 점수 출력 → 둘 다 통과하거나 rounds >= 2 이면 break
    # TODO: 빠진 키워드로 피드백 문장을 만들어 revise → rounds += 1
    break
print('LLM 호출:', llm.calls)
`,
            solution: `import agentlab as al

def seo_check(text, keywords):
    body = str(text).strip()
    kws = [k.strip() for k in keywords.split(',')]
    found = [k for k in kws if k in body]
    score = round(60 * len(found) / len(kws)) + (20 if body.startswith('#') else 0) + (20 if 300 <= len(body) <= 800 else 0)
    return {'score': score, 'missing': [k for k in kws if k not in found]}

KEYWORDS = '전기차, 배터리, 충전, 보조금'
draft = '# 전기차\\n\\n도입: 왜 지금 전기차인가?\\n본문: 배터리 가격과 충전 인프라.\\n결론: 시승부터.'
llm = al.LLM()
reflector = al.Reflector(llm)
text, rounds = draft, 0
while True:
    s = reflector.score(text)
    seo = seo_check(text, KEYWORDS)
    passed = s['score'] >= 8 and seo['score'] >= 80
    print(f"검수 {rounds}: 품질 {s['score']}/10 · SEO {seo['score']}/100 · 빠진 키워드 {seo['missing']}")
    if passed or rounds >= 2:
        break
    feedback = '다음 키워드를 본문에 추가: ' + ', '.join(seo['missing']) + '. ' + s['suggestion']
    text = reflector.revise(text, feedback)
    rounds += 1
print('통과' if passed else '최대 횟수 도달', '· LLM 호출:', llm.calls)
`,
            expect: `검수 0: 품질 7/10 · SEO 65/100 · 빠진 키워드 ['보조금']
검수 1: 품질 7/10 · SEO 15/100 · 빠진 키워드 ['배터리', '충전', '보조금']
검수 2: 품질 7/10 · SEO 15/100 · 빠진 키워드 ['배터리', '충전', '보조금']
최대 횟수 도달 · LLM 호출: 5` }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: '팀 확장과 품질', subtitle: '편집자 · 자동 검수 루프 · SEO 도구 · 비용 · 사람 승인', notes: '<p>2교시. “만들기만 하는 팀” 에서 “검수하고 승인하는 팀” 으로. 실제 마케팅 팀의 편집 · 승인 절차에 빗대어 설명합니다.</p><p>⏱ 도입 2분</p>' },
          { layout: 'diagram', title: '3인 팀 · 4개 작업', html: FIG_CREW3, caption: '수정 작업은 초안 + 검토 의견을 모두 참고',
            notes: '<p>💬 “수정 작업 context 에 검토 의견만 넣으면?” → 작가가 무엇을 고칠지 모른다. 둘 다 필요.</p><p>작가가 두 작업을 맡는 것도 짚기(에이전트 ≠ 작업).</p>' },
          { layout: 'code', title: '3인 팀 kickoff', code: `import agentlab as al

llm = al.LLM()
researcher = al.CrewAgent(role='시장 조사원', goal='정확한 정보를 찾는다', llm=llm, tools=[al.wiki_search])
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 마케팅 글을 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='문제점을 찾아 구체적인 수정 요청을 한다', llm=llm)

research = al.Task(description='{topic} 를 검색해 핵심 포인트 3가지를 정리해라', expected_output='핵심 3가지', agent=researcher, name='조사')
write = al.Task(description='{topic} 블로그 글을 작성해라', expected_output='# 제목, 도입, 본문 3단락, 결론', agent=writer, context=[research], name='집필')
review = al.Task(description='블로그 글을 검토하고 문제점과 수정 요청을 써라', expected_output='수정 요청 3가지', agent=editor, context=[write], name='검토')
revise = al.Task(description='원문: {topic} 블로그 글\\n\\n편집자 의견을 반영해 고쳐 써라', expected_output='최종 글', agent=writer, context=[write, review], name='수정')

crew = al.Crew(agents=[researcher, writer, editor], tasks=[research, write, review, revise], verbose=True)
print(crew.kickoff(inputs={'topic': '전기차'}))
print('LLM 호출:', llm.calls)`, points: ['검토 의견 → 수정 작업 context', '호출 5회 = 2 + 1 + 1 + 1', '모의 LLM: 검토 · 수정 문장은 정해져 있음'],
            notes: '<p>▶ 실행 → 편집자 의견과 수정본을 비교. “출처가 추가되었다”는 점을 가리킵니다.</p>' },
          { layout: 'diagram', title: '자동 검수 루프', html: FIG_REFLECT, caption: '통과 조건 + 최대 횟수 — 둘 다 있어야 멈춘다',
            notes: '<p>06차시 Reflector 복습. 💬 “최대 횟수가 없으면?” → 모의 LLM 은 항상 7점 → 무한 루프 · 비용 폭주. 13차시 비용 상한의 복선.</p>' },
          { layout: 'code', title: 'score < 8 이면 수정, 최대 2회', code: `import agentlab as al

draft = '# 전기차\\n\\n도입: 왜 지금 전기차인가?\\n본문: 배터리 · 충전 · 보조금.\\n결론: 시승부터.'
llm = al.LLM()
reflector = al.Reflector(llm)
THRESHOLD, MAX_ROUNDS = 8, 2
text, rounds = draft, 0
while True:
    s = reflector.score(text, criteria='명확성 · 근거 · 행동 유도')
    print(f'검수 {rounds}: {s["score"]}/10 · {s["issues"]}')
    if s['score'] >= THRESHOLD or rounds >= MAX_ROUNDS:
        break
    text = reflector.revise(text, reflector.critique(text))
    rounds += 1
print('통과' if s['score'] >= THRESHOLD else '최대 횟수', '· 호출', llm.calls)`, points: ['한 바퀴 = LLM 3회', '모의 LLM 은 항상 7점 → 최대 횟수에서 정지', '실제 모델은 1~2회 뒤 통과'],
            notes: '<p>▶ 실행. MAX_ROUNDS 를 지우면 어떻게 되는지 “실행하지 말고” 상상하게 합니다(실제로 지우면 무한 루프).</p>' },
          { layout: 'code', title: 'SEO 체크 도구 — LLM 없이', code: `import agentlab as al

@al.tool
def seo_check(text: str, keywords: str, min_chars: int = 300, max_chars: int = 800) -> dict:
    """키워드 포함 · 제목 · 글자 수를 검사해 100점 만점 점수를 준다
    text: 검사할 글
    keywords: 쉼표로 구분한 키워드
    """
    body = str(text).strip()
    kws = [k.strip() for k in keywords.split(',') if k.strip()]
    found = [k for k in kws if k.lower() in body.lower()]
    score = round(60 * len(found) / max(1, len(kws))) + (20 if body.startswith('#') else 0) \\
        + (20 if min_chars <= len(body) <= max_chars else 0)
    return {'score': score, 'missing': [k for k in kws if k not in found], 'chars': len(body)}

print(seo_check('# 전기차\\n\\n전기차는 배터리로 달립니다.', '전기차, 배터리, 충전, 보조금'))
print(seo_check('# 전기차\\n\\n' + '전기차 배터리 충전 보조금 이야기. ' * 20, '전기차, 배터리, 충전, 보조금'))`, points: ['객관적 규칙 = 파이썬 · 주관적 품질 = LLM', '항상 같은 결과 · 비용 0', '<code>missing</code> → 수정 요청으로'],
            notes: '<p>▶ 실행. 💬 “글자 수 세기를 LLM 에게 시키면?” → 틀리기도 하고 비용도 든다. 역할 분담 원칙.</p>' },
          { layout: 'diagram', title: '작업별 비용', html: FIG_COST, caption: '측정하지 않으면 줄일 수 없다',
            notes: '<p>뒤쪽 작업이 비싼 이유(context 누적)를 묻고 대책(요약해서 넘기기 · 검수 횟수 제한 · 작은 모델)을 받아 적습니다.</p>' },
          { layout: 'code', title: '호출 횟수 · 토큰 · 예상 비용 표', code: `import agentlab as al

llm = al.LLM()
writer = al.CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
editor = al.CrewAgent(role='편집자', goal='글의 품질을 높인다', llm=llm)
write = al.Task(description='전기차 블로그 글을 작성해라', expected_output='# 제목, 본문, 결론', agent=writer, name='집필')
review = al.Task(description='블로그 글을 검토하고 문제점과 수정 요청을 써라', expected_output='3가지', agent=editor, context=[write], name='검토')
revise = al.Task(description='원문: 전기차 블로그 글\\n\\n편집자 의견을 반영해 고쳐 써라', expected_output='최종 글', agent=writer, context=[write, review], name='수정')

for task in [write, review, revise]:
    c0, t0 = llm.calls, llm.total_usage.total_tokens
    ctx = '\\n\\n'.join(f'({t.name}) {t.output}' for t in task.context if t.output)
    task.output = task.agent.execute(task, ctx)
    print(f'{task.name}: 호출 {llm.calls - c0} · 토큰 {llm.total_usage.total_tokens - t0}')
u = llm.total_usage
print(f'합계 {llm.calls}회 · {u.total_tokens} 토큰 · 예상 {u.prompt_tokens/1e6*0.10 + u.completion_tokens/1e6*0.40:.6f} 달러')`, points: ['작업 전후 차이 = 작업별 비용', '실제 모델은 usage 그대로', '단가는 요금표에서'],
            notes: '<p>▶ 실행. 수정 작업 토큰이 가장 큰 이유를 다시 확인. 1,000회 실행 비용을 암산하게 합니다.</p>' },
          { layout: 'diagram', title: '사람 승인 단계', html: FIG_HITL, caption: '되돌릴 수 없는 행동 앞에는 반드시 확인',
            notes: '<p>💬 “어느 단계에 사람을 넣어야 하나?” → 발행 · 결제 · 발송. 중간 단계는 자동화해도 됨. 13차시 위험 도구 가드로 일반화.</p>' },
          { layout: 'code', title: '승인되면 발행, 거부되면 피드백 반영', stdin: 'n\n출처를 붙여 주세요\ny\n', code: `import agentlab as al

llm = al.LLM()
reflector = al.Reflector(llm)
text = '# 전기차, 지금 사야 할까?\\n\\n본문: 배터리 · 충전 · 보조금.\\n결론: 시승부터.'
attempt = 1
while True:
    print(f'--- 승인 요청 {attempt} ---')
    print(text[:60], '…')
    ok = input('발행할까요? (y/n): ').strip().lower()
    if ok == 'y':
        print('✅ 발행:', al.write_file('published_blog.md', text)['path'])
        break
    text = reflector.revise(text, input('수정 요청: '))
    attempt += 1
    if attempt > 3:
        print('⛔ 3회 거부 — 사람이 직접 작성')
        break`, points: ['y → 발행(파일 · API)', 'n → 피드백 → revise → 다시 요청', '상한 3회'],
            notes: '<p>슬라이드에서는 입력이 미리 들어 있습니다(n → 피드백 → y). 학생 화면에서는 직접 입력.</p>' },
          { layout: 'table', title: '실제 CrewAI 로 옮기기', head: ['브라우저 agentlab', 'Colab CrewAI'], rows: [
            ['<code>al.CrewAgent(role, goal, backstory, llm, tools)</code>', '<code>Agent(role, goal, backstory, llm, tools)</code>'],
            ['<code>al.Task(description, expected_output, agent, context)</code>', '<code>Task(..., output_file=\'blog.md\')</code>'],
            ['<code>al.Crew(agents, tasks, verbose).kickoff(inputs)</code>', '<code>Crew(..., process=Process.sequential).kickoff(inputs)</code>'],
            ['<code>al.wiki_search</code>', '<code>@tool</code> + DuckDuckGo (키 불필요)'],
            ['<code>llm.total_usage</code>', '<code>result.token_usage</code>']
          ], lead: '이름이 거의 같다 — 검색 도구만 DuckDuckGo 로', notes: '<p>SerperDevTool 은 유료 키가 필요하므로 DuckDuckGo 를 씁니다. Gemini 무료 등급의 분당 제한 때문에 verbose 를 끄고 한 번씩 실행하라고 안내.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[0].q, options: QUIZ2[0].options, answer: QUIZ2[0].answer, explain: QUIZ2[0].explain, notes: '<p>정답 공개 후 “통과 조건 + 최대 횟수” 를 다시 강조. 13차시 비용 상한으로 연결.</p>' },
          { layout: 'practice', title: '실습 12-3. 금지어 검사 추가', desc: '<p><code>seo_check</code> 에 금지어(최고 · 무조건 · 100%) 검사를 넣고 개당 10점 감점하세요.</p>',
            starter: `def seo_check(text, keywords, banned='최고, 무조건, 100%'):
    body = text.strip()
    kws = [k.strip() for k in keywords.split(',')]
    found = [k for k in kws if k in body]
    score = round(60 * len(found) / len(kws)) + (20 if body.startswith('#') else 0)
    # TODO: 금지어 검사 → 개당 -10 (0 미만 금지)
    return {'score': score, 'banned_found': []}

print(seo_check('# 전기차\\n\\n전기차는 무조건 최고! 배터리 100%', '전기차, 배터리'))`, solution: `def seo_check(text, keywords, banned='최고, 무조건, 100%'):
    body = text.strip()
    kws = [k.strip() for k in keywords.split(',')]
    found = [k for k in kws if k in body]
    score = round(60 * len(found) / len(kws)) + (20 if body.startswith('#') else 0)
    bl = [w.strip() for w in banned.split(',')]
    banned_found = [w for w in bl if w in body]
    score = max(0, score - 10 * len(banned_found))
    return {'score': score, 'banned_found': banned_found}

print(seo_check('# 전기차\\n\\n전기차는 무조건 최고! 배터리 100%', '전기차, 배터리'))`, notes: '<p>5분. max(0, …) 를 빼먹어 음수 점수가 나오는 경우를 찾아 보게 합니다.</p>' },
          { layout: 'summary', title: '정리', bullets: ['편집자 추가 → 검토 · 수정 작업, 수정 context 는 <b>초안 + 검토 의견</b>', '자동 검수 = 점수 루프(통과 조건 + <b>최대 횟수</b>)', '객관적 규칙(SEO)은 파이썬, 주관적 품질은 LLM', '작업별 호출 · 토큰 · 비용을 <b>측정</b>해야 줄일 수 있다', '되돌릴 수 없는 행동 앞에는 <b>사람 승인</b>', '다음 차시: 평가 · 안전 · 배포로 강좌 마무리'],
            notes: '<p>⏱ 정리 4분. 과제: 체크리스트 10개 중 미달 항목 채우기, Colab 노트북 ✏️ 문제. 다음 차시는 평가 · 안전 · 배포.</p>' }
        ]
      }
    ]
  });
})();
