/* 17차시 agentBuilder 로 다시 만드는 에이전트: 분기 · 반복 · 기억 · 팀 · 가드레일 */
(function () {
  const ARROW = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fill-arrow"/></marker></defs>`;

  /* 기대 출력 (검증 도구 출력에서 자동 생성) */
  /* EXP-BEGIN */
  const EXP = {
    '17-1': `04 도구 호출 에이전트 · 노드 8 · 간선 7 · max_loops 5

id  type    label · config
n1  input   질문 · {"text": "서울 날씨 알려주고 기온에 1.8을 곱해줘", "name": "question"}
n2  llm     LLM · {"provider": "mock"}
n3  tool    날씨 · {"name": "get_weather"}
n4  tool    계산기 · {"name": "calculator"}
n5  tool    위키 검색 · {"name": "wiki_search"}
n6  agent   비서 에이전트 · {"system": "당신은 날씨 · 검색 비서입니다. 도구를 써서 확인한 정보로만 답하고, 짧고 정확하
n7  output  결과 · {"title": "비서의 답"}
n8  output  단계 기록 · {"title": "에이전트 단계 (생각 → 도구 → 관찰)"}

간선 (from.port → to.port)
  [값 ] n1.text   → n6.input
  [자원] n2.llm    → n6.llm
  [자원] n3.tool   → n6.tools
  [자원] n4.tool   → n6.tools
  [자원] n5.tool   → n6.tools
  [값 ] n6.text   → n7.value
  [값 ] n6.trace  → n8.value

검증: 이상 없음`,
    '17-2': `▶ n1 (실행 1 번째)
▶ n2 (실행 1 번째)
     🧠 모의 LLM (키 없음 · 항상 같은 답)
▶ n3 (실행 1 번째)
▶ n4 (실행 1 번째)
▶ n5 (실행 1 번째)
▶ n6 (실행 1 번째)
       ↗ LLM 호출 #1 (mock/mock-1) — user: '부산 날씨 알려줘'
       ↙ 응답: '' 도구호출 [ToolCall(get_weather, {"city": "부산"})]
     🔧 도구 호출 1: get_weather({"city": "부산"})
     👁 관찰: {"city": "부산", "temperature": 21.0, "condition": "구름 조금", "humidity": 60, "wind_kmh": 4.3, "source": "sample (offline)"}
       ↗ LLM 호출 #2 (mock/mock-1) — tool: '{"city": "부산", "temperature": 21.0, "condition": "구름 조금", "h'
       ↙ 응답: '[날씨 · 검색 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.'
     ✅ 최종 답: [날씨 · 검색 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
▶ n7 (실행 1 번째)
=== 비서의 답 ===
[날씨 · 검색 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
▶ n8 (실행 1 번째)
=== 에이전트 단계 (생각 → 도구 → 관찰) ===
    {'kind': 'tool', 'name': 'get_weather', 'args': {'city': '부산'}}
    {'kind': 'observe', 'name': 'get_weather', 'result': {'city': '부산', 'temperature': 21.0, 'condition': '구름 조금', 'humidity': 60, 'wind_kmh': 4.3, 'source': 'sample (offline)'}}
    {'kind': 'answer', 'content': '[날씨 · 검색 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.'}
✅ 완료 · LLM 호출 2 회`,
    '17-3': `전체 108 줄 — 그중 에이전트 흐름(main) 부분만:

def main():
    # ── 질문 (시작 입력)
    question = sys.argv[1] if len(sys.argv) > 1 else '서울 날씨 알려주고 기온에 1.8을 곱해줘'

    # ── LLM (LLM 모델)
    llm1 = make_llm('mock')

    # ── 날씨 (내장 도구)
    tool1 = al.get_weather

    # ── 계산기 (내장 도구)
    tool2 = al.calculator

    # ── 위키 검색 (내장 도구)
    tool3 = al.wiki_search

    # ── 비서 에이전트 (에이전트)
    agent1_agent = al.Agent(llm1, tools=[tool1, tool2, tool3], system='당신은 날씨 · 검색 비서입니다. 도구를 써서 확인한 정보로만 답하고, 짧고 정확하게 말합니다.', max_steps=6, verbose=True)
    agent1 = agent1_agent.run(to_text(question))
    agent1_trace = agent1_agent.steps

    # ── 결과 (결과)
    print('\\n=== 비서의 답 ===')
    print(to_text(agent1))

    # ── 단계 기록 (결과)
    print('\\n=== 에이전트 단계 (생각 → 도구 → 관찰) ===')
    print(to_text(agent1_trace))



if __name__ == '__main__':
    main()`,
    '17-4': `👤 내 이름은 영준이야
    🧠 기억: 0개 메시지 보관 중
   🤖 [친근한 챗봇] 죄송합니다, 이름을 아직 듣지 못했습니다.
👤 내 이름이 뭐지?
    🧠 기억: 2개 메시지 보관 중
   🤖 [친근한 챗봇] 당신의 이름은 영준 입니다.

session 의 키(노드 id): ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
보관된 객체: ConversationMemory · 메시지 4 개

--- 새 session (기억 없음)
👤 내 이름이 뭐지?
    🧠 기억: 0개 메시지 보관 중
   🤖 [친근한 챗봇] 죄송합니다, 이름을 아직 듣지 못했습니다.`,
    '17-5': `문서 4 개 · k = 2
  - 우리 회사의 연차는 1년에 15일이며 입사 1년 미만은 월 1일씩 생긴다.
  - 점심 시간은 12시부터 1시까지이며 식대는 월 15만원까지 지원한다.
  - 재택근무는 주 2회까지 가능하며 전날 팀장 승인이 필요하다.
  - 출장비는 영수증을 첨부해 다음 달 10일까지 정산 시스템에 올린다.

👤 재택근무는 일주일에 며칠까지 할 수 있어?
    📚 문서 4개 저장
    🔎 0.23 재택근무는 주 2회까지 가능하며 전날 팀장 승인이 필요하다.
    🔎 0.14 출장비는 영수증을 첨부해 다음 달 10일까지 정산 시스템에 올린다.
🤖 [사내 규정 안내 봇] 알겠습니다. "재택근무는 주 2회까지 가능하며 전날 팀장 승인이 필요하다.
출장비는  …

👤 회의실 예약은 어떻게 해?
    📚 문서 5개 저장
    🔎 0.44 회의실 예약은 사내 포털에서 하루 전까지 신청한다.
🤖 [사내 규정 안내 봇] 알겠습니다. "회의실 예약은 사내 포털에서 하루 전까지 신청한다." 을(를) 처리했습 …`,
    '17-6': `계획(planner) → 초안 프롬프트(template) → 초안 작성(chat) → 비평 · 수정(reflector) → 최종 평가(judge)

    📌 1. 신입 개발자를 위한 '좋은 커밋 메시지 쓰는 법' 블로그 글 작성 에 필요한 정보 조사
    📌 2. 핵심 내용 정리
    📌 3. 결과물 작성
    📌 4. 검토 후 수정
    🔍 검토 1: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장
    ✏️ 수정 1: [피드백을 반영해 글을 고치는 작가] 수정본: 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
=== 수정된 최종 글 ===
[피드백을 반영해 글을 고치는 작가] 수정본: 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고,  최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026
=== 평가 (LLM 심사) ===
{'score': 7, 'issues': ['근거가 부족함', '문장이 길음'], 'suggestion': '근거 문장을 추가하고 문장을 짧게 나눈다'}
=== 세운 계획 ===
1. 신입 개발자를 위한 '좋은 커밋 메시지 쓰는 법' 블로그 글 작성 에 필요한 정보 조사
2. 핵심 내용 정리
3. 결과물 작성
4. 검토 후 수정
✅ LLM 호출 5 회 (계획 1 + 초안 1 + 비평 1 + 수정 1 + 심사 1)

--- 내보낸 코드의 비평 · 수정 부분 (06차시 Reflector 와 같다)
    # ── 비평 · 수정 (비평 · 수정)
    reflector1_ref = al.Reflector(llm1, critic_system='너는 꼼꼼한 검토자다. 결과물의 문제점을 구체적으로 지적한다.', writer_system='너는 피드백을 반영해 글을 고치는 작가다.')
    reflector1, reflector1_feedback = to_text(answer1), ''
    for _round in range(1):   # 비평 → 수정 반복
        reflector1_feedback = reflector1_ref.critique(reflector1, '구체적인 예시 · 명확한 구조 · 신입에게 친절한 설명')
        print('🔍 검토:', reflector1_feedback[:120])
        reflector1 = reflector1_ref.revise(reflector1, reflector1_feedback)`,
    '17-7': `def get_stock_price(symbol: str) -> dict:
    """주식 종목의 현재 가격을 알려준다 (예시 데이터)
    symbol: 종목 코드 (예: AAPL)
    """
    prices = {'AAPL': 189.5, 'MSFT': 415.2, 'TSLA': 248.1}
    return {'symbol': symbol.upper(), 'price': prices.get(symbol.upper(), 100.0), 'currency': 'USD'}

- get_stock_price(symbol: string): 주식 종목의 현재 가격을 알려준다 (예시 데이터)
symbol: 종목 코드 (예: AAPL)
직접 호출: {'symbol': 'MSFT', 'price': 415.2, 'currency': 'USD'}

    Thought: "AAPL 주가 알려주고 거기에 10을 곱해줘" 에 답하려면 calculator 도구가 필요하다.
    Action: calculator
    Action Input: {"expression": "10"}
    Observation: {"expression": "10", "result": 10}
    Thought: 관찰 결과로 충분히 답할 수 있다.
    Final Answer: 계산 결과는 10 입니다.
🤖 계산 결과는 10 입니다.`,
    '17-8': `🔀 요청 분류 · 방식=keyword · 출력 포트=['글쓰기', '번역', '일반(__default__)']
     글쓰기 ← 키워드: 글, 블로그, 작성, 써
     번역 ← 키워드: 번역, translate
🔀 통과? · 방식=python · 출력 포트=['통과', '다시', '기타(__default__)']
     식: '통과' if (json.loads(text).get('score') or 0) >= 7 else '다시'

실행 순서: 요청 → LLM → 요청 분류 → 초안 작성 → 품질 평가 → 통과? → 번역 → 일반 답변 → 합류 → 결과
🔁 되돌아가는 간선: 통과?.다시 → 초안 작성.context  (max_loops=3)`,
    '17-9': `👤 AI 에이전트를 소개하는 블로그 글을 써줘
   🔀 요청 분류 → 글쓰기
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
   🔀 통과? → 통과
   ⏭ 건너뜀: 번역
   ⏭ 건너뜀: 일반 답변
   🏁 [블로그 작가] # AI 에이전트를 소개하는 글  도입: 왜 지금 AI 에이전트를 소개하는 글인가? 본문:  …
   ✅ LLM 호출 2 회
👤 안녕하세요를 영어로 번역해줘
   🔀 요청 분류 → 번역
   ⏭ 건너뜀: 초안 작성
   ⏭ 건너뜀: 품질 평가
   ⏭ 건너뜀: 통과?
   ⏭ 건너뜀: 일반 답변
   🏁 [번역가] Translation: 안녕하세요 …
   ✅ LLM 호출 1 회
👤 오늘 기분이 어때?
   🔀 요청 분류 → __default__
   ⏭ 건너뜀: 초안 작성
   ⏭ 건너뜀: 품질 평가
   ⏭ 건너뜀: 통과?
   ⏭ 건너뜀: 번역
   🏁 [비서] "오늘 기분이 어때?" 에 대한 답변: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것.  …
   ✅ LLM 호출 1 회`,
    '17-10': `    🔀 분기: 글쓰기
   ✍️ 초안 작성 (실행 1번째)
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
   🔁 반복 1 → n4 부터 다시
   ✍️ 초안 작성 (실행 2번째)
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
   🔁 반복 2 → n4 부터 다시
   ✍️ 초안 작성 (실행 3번째)
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
    ⚠ 최대 반복 횟수(2)에 도달해 반복을 멈춥니다
   🏁 결과 도착 — [블로그 작가] # AI 에이전트를 소개하는 글

도입 …
   ✅ LLM 호출 6 회`,
    '17-11': `    # ── 요청 분류 (조건 분기)
    router1 = route_keywords(request, [('글쓰기', '글, 블로그, 작성, 써'), ('번역', '번역, translate')])

    for _loop3 in range(3):   # 반복: '초안 작성' 로 되돌아가는 연결
        if router1 == '글쓰기':
            # ── 초안 작성 (LLM 호출)
            answer1_prompt = fmt("""{input}

[이전 피드백]
{context}""", {'input': to_text(request), 'context': to_text((judge1_text if judge1_text is not None else None))})
            answer1_resp = llm1.chat([al.system('당신은 블로그 작가입니다.')] + [al.user(answer1_prompt)])
            answer1 = answer1_resp.content

        if router1 == '글쓰기':
            # ── 품질 평가 (평가 (LLM 심사))
            judge1_report = al.Reflector(llm1).score(to_text(answer1), criteria='명확성 · 구체성 · 흥미')
            judge1 = judge1_report.get('score')
            judge1_text = to_text(judge1_report)

        if router1 == '글쓰기':
            # ── 통과? (조건 분기)
            text = to_text(judge1_text)
            router2 = '통과' if (json.loads(text).get('score') or 0) >= 7 else '다시'

        if not ((router1 == '글쓰기') and router2 == '다시'):
            break

    if router1 == '번역':
        # ── 번역 (LLM 호출)
        answer2_prompt = fmt('{input}', {'input': to_text(request), 'context': to_text(None)})
        answer2_resp = llm1.chat([al.system('당신은 번역가입니다. 영어로 번역합니다.')] + [al.user(answer2_prompt)])
        answer2 = answer2_resp.content

    if router1 == '__default__':
        # ── 일반 답변 (LLM 호출)
        answer3_prompt = fmt('{input}', {'input': to_text(request), 'context': to_text(None)})
        answer3_resp = llm1.chat([al.system('당신은 비서입니다.')] + [al.user(answer3_prompt)])
        answer3 = answer3_resp.content`,
    '17-12': `📌 작업 1: 조사 · 담당=조사원 · 참고=없음
📌 작업 2: 글쓰기 · 담당=작가 · 참고=['작업 1: 조사']
📌 작업 3: 편집 · 담당=편집자 · 참고=['작업 2: 글쓰기']

    🧑‍💼 [시장 조사원] 작업 1/3: 접이식 전동 킥보드 'FoldGo' 에 대해 조사하고 핵심 장점 3가지와 타깃 고객을 정
    🧑‍💼 [마케팅 작가] 작업 2/3: 조사 결과를 바탕으로 접이식 전동 킥보드 'FoldGo' 홍보 블로그 글(300자 안팎)
    🧑‍💼 [편집자] 작업 3/3: 작성된 글을 검토하고 과장된 표현을 고쳐 최종본을 만들어라
--- 작업 1 결과: [시장 조사원] 조사 결과 — 접이식 전동 킥보드 'FoldGo' 하고 핵심 장점 3: ① 정의와 배경 ② 최근 동향 3가지(
--- 작업 2 결과: [마케팅 작가] # 조사 결과를 바탕으로 접이식 전동 킥보드 'FoldGo

이전 작업 결과를 바탕으로 도입: 왜 지금 조사 
--- 작업 3 결과: [편집자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로
✅ LLM 호출 3 회 (작업 수만큼)`,
    '17-13': `개발자 ↔ 리뷰어 (ag_chat) · 설정 {'max_turns': 3}
기획 회의 (ag_group) · 설정 {'max_round': 3, 'method': 'round_robin'}

=== 코드 리뷰 대화 ===
  개발자: 두 수를 더하는 파이썬 함수를 작성해줘
  리뷰어: [리뷰어] def add(a, b):     """두 수를 더한다"""     return a
  개발자: [개발자] 알겠습니다. "def add(a, b):     """두 수를 더한다"""     
  리뷰어: [리뷰어] 리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 출력도 있습니다. 타 🛑
=== 그룹 채팅 회의록 ===
  매니저: 할 일 관리 앱의 핵심 기능 3가지를 정하자
  기획자: [기획자] 알겠습니다. "할 일 관리 앱의 핵심 기능 3가지를 정하자" 을(를) 처리했습니다.
  엔지니어: [엔지니어] 알겠습니다. "알겠습니다. "할 일 관리 앱의 핵심 기능 3가지를 정하자" 을(를
  디자이너: [디자이너] 알겠습니다. "알겠습니다. "알겠습니다. "할 일 관리 앱의 핵심 기능 3가지를 
✅ LLM 호출 6 회`,
    '17-14': `입력 가드 금지어: 비밀번호, 주민번호, 해킹, 카드번호 · 최대 길이 500
👤 서울 날씨 알려줘
   🛡️ 입력 가드 → pass
   🛡️ 출력 가드 → pass
   🏁 최종 답: [비서] 서울의 현재 날씨는 맑음, 기온 18.4°C 입니다.
   🏁 LLM 심사 점수: {'score': 7, 'issues': ['근거가 부족함', '문장이 길음'], 'suggestion': '근거 문장을 추가하고 문장을 짧게 나눈다'}
   ✅ LLM 호출 3 회
👤 내 비밀번호 알려줘
   🛡️ 입력 가드 → blocked
   ⏭ 건너뜀: 비서
   ⏭ 건너뜀: 출력 가드
   🏁 최종 답: 죄송합니다. 개인정보나 보안 관련 요청은 처리할 수 없습니다.
   ⏭ 건너뜀: 품질 심사
   ⏭ 건너뜀: 점수
   ✅ LLM 호출 0 회
👤 카드번호 좀 찾아줘
   🛡️ 입력 가드 → blocked
   ⏭ 건너뜀: 비서
   ⏭ 건너뜀: 출력 가드
   🏁 최종 답: 죄송합니다. 개인정보나 보안 관련 요청은 처리할 수 없습니다.
   ⏭ 건너뜀: 품질 심사
   ⏭ 건너뜀: 점수
   ✅ LLM 호출 0 회`,
    '17-15': `👤 내일 부산 날씨 어때? 우산 챙겨야 해?
   🔀 → 날씨·검색
   ▶ 정보 비서 가 답한다
    🔧 도구 호출 1: get_weather({"city": "부산"})
    🧠 기억: 0개 메시지 보관 중
   🤖 [날씨 · 검색 비서] 부산의 현재 날씨는 구름 조금, 기온 21.0°C 입니다.
👤 연차가 며칠이야?
   🔀 → 사내규정
    🔎 0.05 재택근무는 주 2회까지 가능하며 팀장 승인이 필요하다.
    🔎 0.04 연차는 1년에 15일이다.
   ▶ 규정 안내 가 답한다
    🧠 기억: 0개 메시지 보관 중
   🤖 [사내 규정 안내 봇] 알겠습니다. "재택근무는 주 2회까지 가능하며 팀장 승인이 필요하다.
연차는 1년에 1" 을(를) 처리했습니다.
👤 안녕, 내 이름은 영준이야
   🔀 → __default__
    🧠 기억: 0개 메시지 보관 중
   ▶ 일상 챗봇 가 답한다
   🤖 [친근한 비서] 죄송합니다, 이름을 아직 듣지 못했습니다.
👤 내 이름이 뭐지?
   🔀 → __default__
    🧠 기억: 2개 메시지 보관 중
   ▶ 일상 챗봇 가 답한다
   🤖 [친근한 비서] 당신의 이름은 영준 입니다.`,
    'p17-1': `도구 노드: ['get_weather', 'calculator', 'wiki_search', 'now']
검증: 이상 없음
    🔧 도구 호출 1: now({})
    👁 관찰: {"now": "2026-10-05 09:30", "weekday": "월요일"}
🤖 [날씨 · 검색 비서] 지금은 2026-10-05 09:30 입니다.`,
    'p17-2': `    🔍 검토 1: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처
    🔍 검토 2: [꼼꼼한 검토자] 검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처
⚖️ 점수: 7
✅ LLM 호출 7 회
검토 횟수: 2`,
    'p17-3': `👤 내 이름은 영준이야
   🤖 [친근한 챗봇] 죄송합니다, 이름을 아직 듣지 못했습니다.
👤 나는 파이썬을 좋아해
   🤖 [친근한 챗봇] 알겠습니다. "나는 파이썬을 좋아해" 을(를) 처리했습니다. (대화 2번째)
👤 내 이름이 뭐지?
   🤖 [친근한 챗봇] 당신의 이름은 영준 입니다.
SummaryMemory · 보관 메시지 6 개`,
    'p17-4': `분기 포트: ['요약', '글쓰기', '번역']
검증: 이상 없음
   🔀 → 요약
   🏁 [요약 전문가] 요약: : 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다 등 총 2개 문장의 핵심을 한 줄로 정리했습니다.`,
    'p17-5': `검증: 이상 없음
    🧑‍💼 [시장 조사원] 작업 1/4: 소음 제거 무선 이어폰 'QuietPods' 에 대해 조사하고 핵심 장
    🧑‍💼 [마케팅 작가] 작업 2/4: 조사 결과를 바탕으로 소음 제거 무선 이어폰 'QuietPods' 홍보
    🧑‍💼 [편집자] 작업 3/4: 작성된 글을 검토하고 과장된 표현을 고쳐 최종본을 만들어라
    🧑‍💼 [마케팅 작가] 작업 4/4: 최종 글을 SNS 용 두 문장으로 요약하라
작업 수: 4
작업 4 결과: [마케팅 작가] 요약: 최종 글을 SNS 용 두 문장으로하라`,
    'p17-6': `검증: []
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
🔁 반복 1 → n3
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
🔁 반복 2 → n3
    ⚖️ 점수 7 — 근거가 부족함, 문장이 길음
    🔀 분기: 다시
    ⚠ 최대 반복 횟수(2)에 도달해 반복을 멈춥니다
node_skip n6 
✅ LLM 호출 6 회`,
  };
  /* EXP-END */

  /* 그림 17-1. 예제 그래프를 공부하는 세 단계: 읽기 → 실행 → 코드 비교 */
  const FIG_PIPE = `<svg viewBox="0 0 720 210" role="img" aria-label="그래프 JSON 읽기, 실행 엔진으로 실행, 내보낸 코드와 강좌 코드 비교의 세 단계가 화살표로 이어진 그림">
  ${ARROW('m17a1')}
  <rect x="20" y="30" width="200" height="90" rx="12" class="p1s"/>
  <text x="120" y="58" text-anchor="middle" class="tx-b">① 그래프 읽기</text>
  <text x="120" y="80" text-anchor="middle" class="tx">json.load → nodes · edges</text>
  <text x="120" y="100" text-anchor="middle" class="tx-m">type · config · 포트 연결</text>
  <rect x="260" y="30" width="200" height="90" rx="12" class="p2s"/>
  <text x="360" y="58" text-anchor="middle" class="tx-b">② 실행</text>
  <text x="360" y="80" text-anchor="middle" class="tx">engine.run_graph(g, emit=…)</text>
  <text x="360" y="100" text-anchor="middle" class="tx-m">log · route · skip · loop · result</text>
  <rect x="500" y="30" width="200" height="90" rx="12" class="p3s"/>
  <text x="600" y="58" text-anchor="middle" class="tx-b">③ 코드 비교</text>
  <text x="600" y="80" text-anchor="middle" class="tx">export.export_python(g)</text>
  <text x="600" y="100" text-anchor="middle" class="tx-m">노드 ↔ agentlab ↔ 배운 차시</text>
  <line x1="222" y1="75" x2="256" y2="75" class="ln" stroke-width="2.5" marker-end="url(#m17a1)"/>
  <line x1="462" y1="75" x2="496" y2="75" class="ln" stroke-width="2.5" marker-end="url(#m17a1)"/>
  <line x1="20" y1="140" x2="700" y2="140" class="ln" stroke-dasharray="4 4"/>
  <text x="20" y="168" class="tx-b">1교시</text>
  <text x="80" y="168" class="tx">04 도구 에이전트 · 05 기억 · 05 RAG · 06 계획과 반성 · 06 ReAct</text>
  <text x="20" y="194" class="tx-b">2교시</text>
  <text x="80" y="194" class="tx">08 분기와 반복 · 09 Crew · 10 AutoGen · 13 가드레일 · 11 종합 비서</text>
</svg>`;

  /* 그림 17-2. session dict 가 기억 노드의 상태를 실행 사이에 보관한다 */
  const FIG_SESSION = `<svg viewBox="0 0 720 300" role="img" aria-label="실행 1과 실행 2의 그래프가 아래쪽 session 딕셔너리에 있는 같은 대화 기억 객체를 가리키고, 오른쪽의 새 session 은 비어 있는 그림">
  ${ARROW('m17a2')}
  <text x="20" y="28" class="tx-b">실행 1 · "내 이름은 영준이야"</text>
  <rect x="20" y="42" width="90" height="36" rx="8" class="p5s"/><text x="65" y="65" text-anchor="middle" class="tx">▶ 입력</text>
  <rect x="150" y="42" width="110" height="36" rx="8" class="p1"/><text x="205" y="65" text-anchor="middle" class="tx-w">🤖 챗봇</text>
  <rect x="150" y="96" width="110" height="36" rx="8" class="p4"/><text x="205" y="119" text-anchor="middle" class="tx-w">🧠 대화 기억</text>
  <line x1="112" y1="60" x2="146" y2="60" class="ln" stroke-width="2" marker-end="url(#m17a2)"/>
  <line x1="205" y1="96" x2="205" y2="82" class="ln" stroke-width="2" marker-end="url(#m17a2)"/>
  <text x="300" y="28" class="tx-b">실행 2 · "내 이름이 뭐지?"</text>
  <rect x="300" y="42" width="90" height="36" rx="8" class="p5s"/><text x="345" y="65" text-anchor="middle" class="tx">▶ 입력</text>
  <rect x="430" y="42" width="110" height="36" rx="8" class="p1"/><text x="485" y="65" text-anchor="middle" class="tx-w">🤖 챗봇</text>
  <rect x="430" y="96" width="110" height="36" rx="8" class="p4"/><text x="485" y="119" text-anchor="middle" class="tx-w">🧠 대화 기억</text>
  <line x1="392" y1="60" x2="426" y2="60" class="ln" stroke-width="2" marker-end="url(#m17a2)"/>
  <line x1="485" y1="96" x2="485" y2="82" class="ln" stroke-width="2" marker-end="url(#m17a2)"/>
  <rect x="150" y="190" width="390" height="70" rx="12" class="p4s"/>
  <text x="345" y="215" text-anchor="middle" class="tx-b">session = {'n3': {'mem': ConversationMemory}, …}</text>
  <text x="345" y="240" text-anchor="middle" class="tx">같은 dict 를 다시 넘기면 history 가 이어진다 (2개 → 4개 …)</text>
  <path d="M205,134 L205,186" class="ln" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#m17a2)"/>
  <path d="M485,134 L485,186" class="ln" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#m17a2)"/>
  <text x="345" y="160" text-anchor="middle" class="tx-m">노드 id 'n3' 가 열쇠 — 그래프를 고쳐도 id 가 같으면 기억이 유지된다</text>
  <rect x="580" y="190" width="120" height="70" rx="12" class="card-bg" stroke-dasharray="4 3"/>
  <text x="640" y="218" text-anchor="middle" class="tx-b">session = {}</text>
  <text x="640" y="242" text-anchor="middle" class="tx-m">새 dict → 기억 없음</text>
  <text x="640" y="160" text-anchor="middle" class="tx-m">빌더의 🧹 기억 지우기</text>
  <text x="640" y="178" text-anchor="middle" class="tx-m">= session 비우기</text>
  <text x="20" y="288" class="tx-m">실행 1 의 어색한 답은 모의 LLM 의 한계 — 실제 모델은 "반가워요 영준님" 처럼 답합니다. 기억 확인은 실행 2 에서.</text>
</svg>`;

  /* 그림 17-3. 조건 분기 · 병합 · 되돌아가는 간선(루프) */
  const FIG_ROUTER_LOOP = `<svg viewBox="0 0 720 330" role="img" aria-label="시작 입력이 조건 분기로 들어가 글쓰기, 번역, 기타 세 가지 중 하나로 흐르고, 글쓰기 가지는 초안 작성, 품질 평가, 통과 판정을 거쳐 병합으로 가며 통과 판정의 다시 포트가 초안 작성으로 되돌아가는 점선 간선이 있는 그림">
  ${ARROW('m17a3')}
  <rect x="10" y="130" width="76" height="40" rx="8" class="p5s"/><text x="48" y="155" text-anchor="middle" class="tx">▶ 요청</text>
  <rect x="116" y="124" width="100" height="52" rx="8" class="p3"/><text x="166" y="146" text-anchor="middle" class="tx-w">🔀 요청 분류</text><text x="166" y="164" text-anchor="middle" class="tx-w">keyword</text>
  <line x1="88" y1="150" x2="112" y2="150" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <text x="224" y="52" class="tx-m">글쓰기</text>
  <rect x="270" y="30" width="96" height="40" rx="8" class="p1"/><text x="318" y="55" text-anchor="middle" class="tx-w">✍️ 초안 작성</text>
  <rect x="400" y="30" width="96" height="40" rx="8" class="p2"/><text x="448" y="55" text-anchor="middle" class="tx-w">⚖️ 품질 평가</text>
  <rect x="530" y="30" width="80" height="40" rx="8" class="p3"/><text x="570" y="55" text-anchor="middle" class="tx-w">🔀 통과?</text>
  <path d="M216,138 C240,138 240,50 266,50" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a3)"/>
  <line x1="368" y1="50" x2="396" y2="50" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <line x1="498" y1="50" x2="526" y2="50" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <text x="224" y="146" class="tx-m">번역</text>
  <rect x="270" y="130" width="96" height="40" rx="8" class="p1"/><text x="318" y="155" text-anchor="middle" class="tx-w">🌐 번역</text>
  <line x1="218" y1="150" x2="266" y2="150" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <text x="224" y="240" class="tx-m">기타</text>
  <rect x="270" y="220" width="96" height="40" rx="8" class="p1"/><text x="318" y="245" text-anchor="middle" class="tx-w">💬 일반 답변</text>
  <path d="M216,162 C240,162 240,240 266,240" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a3)"/>
  <rect x="560" y="130" width="80" height="40" rx="8" class="p4"/><text x="600" y="155" text-anchor="middle" class="tx-w">🔗 병합</text>
  <rect x="660" y="130" width="52" height="40" rx="8" class="p5s"/><text x="686" y="155" text-anchor="middle" class="tx">🏁</text>
  <line x1="642" y1="150" x2="656" y2="150" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <path d="M612,50 C640,50 600,126 600,126" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a3)"/>
  <text x="618" y="92" class="tx-m">통과</text>
  <line x1="368" y1="150" x2="556" y2="150" class="ln" stroke-width="2" marker-end="url(#m17a3)"/>
  <path d="M368,240 C460,240 560,164 560,164" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a3)"/>
  <path d="M570,72 L570,100 L318,100 L318,74" class="s3" stroke-width="2.5" fill="none" stroke-dasharray="6 4" marker-end="url(#m17a3)"/>
  <text x="444" y="94" text-anchor="middle" class="tx-b">다시 → context (되돌아가는 간선 · 점선)</text>
  <text x="318" y="20" text-anchor="middle" class="tx-m">초안은 {input} + [이전 피드백] {context}</text>
  <rect x="10" y="276" width="700" height="44" rx="10" class="card-bg"/>
  <text x="360" y="294" text-anchor="middle" class="tx">고른 포트로만 값이 흐른다 → 다른 가지는 ⏭ 건너뜀 → 병합(첫 값)이 도착한 하나를 결과로</text>
  <text x="360" y="312" text-anchor="middle" class="tx-m">되돌아가는 간선이 활성화되면 목적지(초안 작성)부터 다시 실행 · settings.max_loops(3) 번까지만</text>
</svg>`;

  /* 그림 17-4. 팀 노드의 연결: Crew 와 AutoGen */
  const FIG_TEAM = `<svg viewBox="0 0 720 300" role="img" aria-label="위쪽은 역할 에이전트 세 개가 각각 작업 세 개의 담당 포트에 연결되고 작업들이 참고 작업 포트로 사슬처럼 이어져 Crew 실행으로 모이는 그림, 아래쪽은 대화 에이전트 두 개가 2자 대화에, 세 개가 그룹 채팅에 연결된 그림">
  ${ARROW('m17a4')}
  <text x="20" y="24" class="tx-b">Crew (09차시): 역할 → 작업 → 실행 · 앞 작업 결과가 다음 작업의 참고(context)</text>
  <rect x="20" y="40" width="96" height="34" rx="8" class="p1"/><text x="68" y="62" text-anchor="middle" class="tx-w">🧑‍💼 조사원</text>
  <rect x="20" y="86" width="96" height="34" rx="8" class="p1"/><text x="68" y="108" text-anchor="middle" class="tx-w">🧑‍💼 작가</text>
  <rect x="20" y="132" width="96" height="34" rx="8" class="p1"/><text x="68" y="154" text-anchor="middle" class="tx-w">🧑‍💼 편집자</text>
  <rect x="190" y="40" width="130" height="34" rx="8" class="p2"/><text x="255" y="62" text-anchor="middle" class="tx-w">📌 작업 1: 조사</text>
  <rect x="190" y="86" width="130" height="34" rx="8" class="p2"/><text x="255" y="108" text-anchor="middle" class="tx-w">📌 작업 2: 글쓰기</text>
  <rect x="190" y="132" width="130" height="34" rx="8" class="p2"/><text x="255" y="154" text-anchor="middle" class="tx-w">📌 작업 3: 편집</text>
  <line x1="118" y1="57" x2="186" y2="57" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <line x1="118" y1="103" x2="186" y2="103" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <line x1="118" y1="149" x2="186" y2="149" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <text x="152" y="50" text-anchor="middle" class="tx-m">담당</text>
  <path d="M300,76 C300,82 300,82 300,82" class="s2" stroke-width="2" fill="none"/>
  <path d="M310,76 L310,82" class="s2" stroke-width="2.5" marker-end="url(#m17a4)"/>
  <path d="M310,122 L310,128" class="s2" stroke-width="2.5" marker-end="url(#m17a4)"/>
  <text x="340" y="82" class="tx-m">참고 작업</text><text x="340" y="128" class="tx-m">참고 작업</text>
  <rect x="440" y="80" width="120" height="46" rx="8" class="p3"/><text x="500" y="99" text-anchor="middle" class="tx-w">👥 Crew 실행</text><text x="500" y="117" text-anchor="middle" class="tx-w">tasks* · input</text>
  <path d="M322,57 C400,57 400,92 436,92" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
  <line x1="322" y1="103" x2="436" y2="103" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <path d="M322,149 C400,149 400,114 436,114" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
  <rect x="600" y="80" width="100" height="46" rx="8" class="p5s"/><text x="650" y="99" text-anchor="middle" class="tx">🏁 최종 글</text><text x="650" y="117" text-anchor="middle" class="tx-m">작업별 결과</text>
  <line x1="562" y1="103" x2="596" y2="103" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <line x1="20" y1="186" x2="700" y2="186" class="ln" stroke-dasharray="4 4"/>
  <text x="20" y="210" class="tx-b">AutoGen (10차시): 대화 에이전트 → 2자 대화 / 그룹 채팅 · TERMINATE 로 종료</text>
  <rect x="20" y="226" width="90" height="30" rx="8" class="p1"/><text x="65" y="246" text-anchor="middle" class="tx-w">🗣️ 개발자</text>
  <rect x="20" y="262" width="90" height="30" rx="8" class="p1"/><text x="65" y="282" text-anchor="middle" class="tx-w">🗣️ 리뷰어</text>
  <rect x="170" y="240" width="140" height="36" rx="8" class="p4"/><text x="240" y="263" text-anchor="middle" class="tx-w">💞 2자 대화 (a · b)</text>
  <path d="M112,241 C140,241 140,252 166,252" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
  <path d="M112,277 C140,277 140,266 166,266" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
  <rect x="380" y="222" width="80" height="24" rx="6" class="p1"/><text x="420" y="239" text-anchor="middle" class="tx-w">기획자</text>
  <rect x="380" y="250" width="80" height="24" rx="6" class="p1"/><text x="420" y="267" text-anchor="middle" class="tx-w">엔지니어</text>
  <rect x="380" y="278" width="80" height="20" rx="6" class="p1"/><text x="420" y="293" text-anchor="middle" class="tx-w">디자이너</text>
  <rect x="520" y="240" width="180" height="36" rx="8" class="p4"/><text x="610" y="263" text-anchor="middle" class="tx-w">👨‍👩‍👧 그룹 채팅 (agents*)</text>
  <path d="M462,234 C490,234 490,252 516,252" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
  <line x1="462" y1="262" x2="516" y2="262" class="ln" stroke-width="2" marker-end="url(#m17a4)"/>
  <path d="M462,288 C490,288 490,270 516,270" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a4)"/>
</svg>`;

  /* 그림 17-5. 가드레일: 통과 / 차단 두 갈래와 LLM 심사 */
  const FIG_GUARD = `<svg viewBox="0 0 720 230" role="img" aria-label="사용자 입력이 입력 가드를 지나 통과하면 에이전트와 출력 가드, 심사를 거치고, 차단되면 차단 메시지가 바로 병합으로 가는 그림">
  ${ARROW('m17a5')}
  <rect x="10" y="80" width="80" height="40" rx="8" class="p5s"/><text x="50" y="105" text-anchor="middle" class="tx">▶ 입력</text>
  <rect x="120" y="74" width="100" height="52" rx="8" class="p3"/><text x="170" y="96" text-anchor="middle" class="tx-w">🛡️ 입력 가드</text><text x="170" y="114" text-anchor="middle" class="tx-w">금지어 · 길이</text>
  <line x1="92" y1="100" x2="116" y2="100" class="ln" stroke-width="2" marker-end="url(#m17a5)"/>
  <text x="228" y="44" class="tx-m">pass</text>
  <rect x="270" y="30" width="100" height="40" rx="8" class="p1"/><text x="320" y="55" text-anchor="middle" class="tx-w">🤖 비서</text>
  <path d="M220,88 C245,88 245,50 266,50" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a5)"/>
  <rect x="400" y="24" width="100" height="52" rx="8" class="p3"/><text x="450" y="46" text-anchor="middle" class="tx-w">🛡️ 출력 가드</text><text x="450" y="64" text-anchor="middle" class="tx-w">pass / blocked</text>
  <line x1="372" y1="50" x2="396" y2="50" class="ln" stroke-width="2" marker-end="url(#m17a5)"/>
  <rect x="560" y="80" width="80" height="40" rx="8" class="p4"/><text x="600" y="105" text-anchor="middle" class="tx-w">🔗 병합</text>
  <rect x="660" y="80" width="52" height="40" rx="8" class="p5s"/><text x="686" y="105" text-anchor="middle" class="tx">🏁</text>
  <line x1="642" y1="100" x2="656" y2="100" class="ln" stroke-width="2" marker-end="url(#m17a5)"/>
  <path d="M502,40 C540,40 580,76 585,76" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a5)"/>
  <path d="M502,62 C540,62 600,76 600,76" class="ln" stroke-width="2" fill="none" marker-end="url(#m17a5)"/>
  <text x="228" y="166" class="tx-m">blocked → 차단 메시지</text>
  <path d="M220,112 C300,112 480,150 556,112" class="s3" stroke-width="2" fill="none" marker-end="url(#m17a5)"/>
  <rect x="540" y="150" width="120" height="40" rx="8" class="p2"/><text x="600" y="175" text-anchor="middle" class="tx-w">⚖️ 심사 → 점수</text>
  <path d="M502,36 C530,36 600,100 600,146" class="ln" stroke-width="2" fill="none" stroke-dasharray="3 3" marker-end="url(#m17a5)"/>
  <text x="360" y="212" text-anchor="middle" class="tx-m">차단되면 비서 · 출력 가드 · 심사는 모두 ⏭ 건너뜀 → LLM 호출 0회 · 비용 0</text>
</svg>`;

  const QUIZ1 = [
    { q: '에이전트 노드의 <b>llm · tools · memory</b> 포트와 <b>input</b> 포트의 차이로 알맞은 것은?', options: ['차이가 없다', 'llm · tools · memory 는 자원(객체)을 연결하는 포트이고, input 은 값(텍스트)이 흐르는 포트다', 'input 포트는 여러 개 연결할 수 있다', 'llm 포트는 선택 사항이다'], answer: 1,
      explain: '자원 포트에는 LLM · 도구 · 기억 <b>객체</b>가 연결되고, 값 포트(text)에는 <b>텍스트</b>가 흐릅니다. 실행 엔진은 값 포트만 보고 "활성 입력이 있는가"를 판단합니다. llm 과 input 은 필수(required) 포트입니다.' },
    { q: '<code>engine.run_graph(g, session=s)</code> 에서 <code>session</code> dict 의 역할은?', options: ['API 키를 저장한다', '그래프 JSON 을 저장한다', '대화 기억 · 문서 저장소처럼 실행 사이에 유지되어야 하는 노드 상태를 노드 id 별로 보관한다', '실행 로그를 모은다'], answer: 2,
      explain: '같은 dict 를 다시 넘기면 <code>session[\'n3\'][\'mem\']</code> 의 <code>ConversationMemory</code> 가 그대로 쓰여 대화가 이어집니다. 새 dict(<code>{}</code>)를 넘기면 기억이 없습니다. 빌더의 🧹 기억 지우기가 바로 이것입니다.' },
    { q: 'RAG 그래프에서 <b>문서 검색</b> 노드의 <code>context</code> 출력은 어디에 연결해야 하는가?', options: ['시작 입력의 text 포트', 'LLM 호출 노드의 <b>context(참고)</b> 포트 — 프롬프트의 <code>{context}</code> 자리에 들어간다', 'LLM 모델 노드의 llm 포트', '결과 노드에만 연결한다'], answer: 1,
      explain: '찾은 문맥이 <code>{context}</code> 로 프롬프트에 끼워지고, 시스템 프롬프트가 "참고 문서로만 답하라"고 지시해야 RAG 가 됩니다. 05차시의 <code>vs.context(q)</code> 를 프롬프트에 넣던 것과 같습니다.' },
    { q: '<b>파이썬 도구</b> 노드에 쓴 함수의 docstring 첫 줄과 <code>인자: 설명</code> 줄, 타입 힌트는 무엇이 되는가?', options: ['주석일 뿐 실행과 무관하다', 'LLM 에게 보여 주는 도구 스키마(설명 · 매개변수) — <code>@al.tool</code> 과 같은 규칙', '노드의 라벨', '결과 노드의 제목'], answer: 1,
      explain: '노드는 코드에서 함수를 꺼내 <code>al.tool(fn)</code> 로 감쌉니다. 04차시에서 배운 대로 docstring 과 타입 힌트가 그대로 스키마가 되므로, 설명을 잘 써야 LLM 이 도구를 올바르게 고릅니다.' }
  ];
  const QUIZ2 = [
    { q: '조건 분기가 <b>글쓰기</b> 포트를 골랐을 때, 번역 · 일반 답변 노드에는 무슨 일이 일어나는가?', options: ['빈 문자열로 실행된다', '오류가 난다', '활성 입력이 없으므로 <b>건너뜀(skip)</b> 되고 LLM 도 호출되지 않는다', '다음 반복에서 실행된다'], answer: 2,
      explain: '분기 노드는 고른 포트로만 값을 보냅니다. 값 포트에 연결은 있지만 활성 값이 없는 노드는 <code>node_skip</code> 이벤트와 함께 건너뛰며, 그 아래 노드들도 연쇄적으로 건너뜁니다.' },
    { q: '"통과?" 분기의 <b>다시</b> 포트를 "초안 작성"의 context 포트에 연결했다. 이 간선이 활성화되면?', options: ['그래프 전체가 처음부터 다시 실행된다', '목적지(초안 작성)부터 그 아래 노드들만 다시 실행되고, settings.max_loops 번까지만 반복한다', '초안 작성 노드만 한 번 더 실행된다', '즉시 결과로 간다'], answer: 1,
      explain: '되돌아가는 간선(back edge)이 활성화되면 엔진은 목적지에서 도달 가능한 노드들을 위상 순서로 다시 큐에 넣습니다. <code>max_loops</code> 에 도달하면 "⚠ 최대 반복 횟수" 로그와 함께 반복을 멈추고 아래로 진행합니다. 08차시의 <code>max_steps</code> 와 같은 안전장치입니다.' },
    { q: '<b>병합</b> 노드의 "첫 값(first)" 모드는 언제 쓰는가?', options: ['여러 가지 중 실행된 한 가지의 값만 도착할 때, 그 값을 하나의 출력으로 모을 때', '여러 결과를 모두 이어 붙일 때', 'LLM 을 두 개 합칠 때', '도구를 합칠 때'], answer: 0,
      explain: '분기 뒤 합류점에 둡니다. 건너뛴 가지의 값은 도착하지 않으므로 도착한 첫 값이 곧 "실행된 가지의 결과"입니다. 병렬로 만든 여러 결과를 합칠 때는 "모두 이어 붙이기(join)" 모드를 씁니다.' },
    { q: 'Crew 의 <b>작업</b> 노드에서 <code>context(참고 작업)</code> 포트에 앞 작업을 연결하면?', options: ['앞 작업이 취소된다', '앞 작업의 결과가 이 작업의 프롬프트에 문맥으로 들어간다 (CrewAI 의 Task(context=[…]))', '같은 에이전트가 담당하게 된다', '두 작업이 병렬로 실행된다'], answer: 1,
      explain: '09차시의 <code>al.Task(…, context=[task1])</code> 와 같습니다. 조사 → 글쓰기 → 편집으로 결과가 이어지는 것은 이 연결 덕분이며, Crew 실행 노드의 tasks 포트에 연결한 <b>순서</b>가 실행 순서입니다.' },
    { q: '입력 가드가 "내 비밀번호 알려줘"를 <b>차단</b>했을 때 그래프에서 일어나는 일로 틀린 것은?', options: ['blocked 포트로 차단 메시지가 나간다', '에이전트 · 출력 가드 · 심사 노드는 건너뛴다', 'LLM 호출이 0회다', '에이전트가 실행된 뒤 결과만 가려진다'], answer: 3,
      explain: '가드는 분기 노드처럼 동작합니다. pass 포트에 값이 없으므로 에이전트부터 아래가 모두 건너뛰고, 차단 메시지만 병합으로 가서 결과가 됩니다. 13차시에서 배운 "입력 단계에서 막으면 비용도 위험도 0" 의 구현입니다.' }
  ];

  PY_COURSE.addChapter({
    id: 'ag17',
    no: '17',
    title: 'agentBuilder 로 다시 만드는 에이전트: 분기 · 반복 · 기억 · 팀 · 가드레일',
    subtitle: '예제 그래프 04 · 05 · 06 · 08 · 09 · 10 · 11 · 13 을 읽고 실행하고 코드로 비교하다',
    summary: '16차시에서 빌더의 화면과 첫 그래프를 익혔습니다. 이번 차시에서는 Part 2~4 에서 직접 만든 구조 — <b>도구 에이전트 · 기억 · RAG · 계획과 반성 · 조건 분기와 반복 · Crew · AutoGen · 가드레일</b> — 가 빌더의 예제 그래프에서 어떤 <b>노드와 연결</b>이 되었는지 확인합니다. 그래프 JSON 을 파이썬으로 <b>읽고</b>(노드 표 · 포트), 실행 엔진으로 <b>실행하며</b>(log · route · skip · loop 이벤트) <b>내보낸 코드</b>를 배운 차시의 agentlab 코드와 1:1 로 짝짓습니다. 실습에서는 그래프를 <b>코드로 고쳐</b>(분기 추가 · 금지어 변경 · 작업 추가 · max_loops) 실행하고, 루프가 있는 작은 그래프를 처음부터 만듭니다.',
    goals: [
      '예제 그래프의 노드 · 포트 · 간선을 파이썬으로 읽고, 어느 차시의 어떤 agentlab 코드에 해당하는지 짝지을 수 있다',
      'engine.run_graph 의 이벤트(log · node_skip · loop · result)로 도구 호출 · 건너뜀 · 반복을 추적할 수 있다',
      'session dict 로 기억을 유지하고, 문서 검색 노드의 context 를 LLM 호출에 연결하는 RAG 구조를 설명할 수 있다',
      '조건 분기 · 병합 · 되돌아가는 간선(max_loops)의 실행 규칙을 설명하고 그래프를 코드로 고쳐 실행할 수 있다',
      'Crew · AutoGen · 가드레일 · 심사 노드의 연결을 읽고, 루프가 있는 작은 그래프를 처음부터 만들 수 있다'
    ],
    sections: [
      {
        id: 'ag17-1',
        title: '도구 · 기억 · 계획과 반성을 노드로',
        minutes: 50,
        goals: ['예제 04 를 읽기 → 실행 → 코드 비교 세 단계로 분석한다', 'session 으로 기억을 유지하고 RAG 연결을 고쳐 실행한다', '계획 · 비평 · 심사 노드와 파이썬 도구 노드를 06차시 코드와 짝짓는다'],
        flow: [['도입 · 예제와 차시 짝짓기', 5], ['도구 에이전트 — 읽기 · 실행 · 코드 (04)', 12], ['기억 session · RAG (05)', 14], ['계획과 반성 · ReAct + 파이썬 도구 (06)', 12], ['퀴즈 · 정리', 7]],
        content: [
          { type: 'p', html: '16차시에서 빌더의 화면 · 노드 · 포트 · 실행 · 내보내기를 익혔습니다. 이번 차시는 <b>"내가 이미 만든 것이 그래프에서는 어떤 모양인가"</b>를 확인하는 시간입니다. 빌더의 예제 그래프는 이 강좌의 차시와 짝이 맞게 만들어져 있고, 저장소에는 <code>assets/builder/*.json</code> 으로 들어 있어 브라우저 파이썬에서 <code>builder/04_tool_agent.json</code> 처럼 바로 열 수 있습니다. 예제마다 같은 세 단계를 반복합니다.' },
          { type: 'figure', html: FIG_PIPE, caption: '그림 17-1. 예제 그래프를 공부하는 세 단계. ① JSON 을 읽어 노드 표를 만들고 ② 실행 엔진의 이벤트로 과정을 보고 ③ 내보낸 코드를 배운 차시의 코드와 비교합니다.' },
          { type: 'table', head: ['예제 그래프', '핵심 노드', '배운 차시 · agentlab'], rows: [
            ['<code>04_tool_agent</code>', '🔧 내장 도구 ×3 → 🤖 에이전트(tools*)', '04 · 11 — <code>al.Agent(llm, tools)</code>'],
            ['<code>05_memory_chat</code>', '🧠 대화 기억 → 🤖 에이전트(memory)', '05 — <code>al.ConversationMemory</code>'],
            ['<code>05_rag</code>', '📚 문서 검색(context) → 💬 LLM 호출(context)', '05 — <code>al.VectorStore</code>'],
            ['<code>06_reflection</code>', '🗺️ 계획 → 🧩 템플릿 → 💬 초안 → 🔍 비평·수정 → ⚖️ 심사', '06 — <code>al.Planner</code> · <code>al.Reflector</code>'],
            ['<code>06_react</code>', '🐍 파이썬 도구 → 🧭 ReAct', '04 · 06 — <code>@al.tool</code> · <code>al.ReActAgent</code>'],
            ['<code>08_router_loop</code>', '🔀 조건 분기 · 🔗 병합 · 되돌아가는 간선', '08 — <code>add_conditional_edges</code> (2교시)'],
            ['<code>09_crew</code> · <code>10_autogen</code>', '🧑‍💼 📌 👥 · 🗣️ 💞 👨‍👩‍👧', '09 · 10 · 12 (2교시)'],
            ['<code>13_guardrail</code> · <code>11_assistant_full</code>', '🛡️ 가드레일 · ⚖️ 심사 · 종합', '13 · 11 (2교시)']
          ], caption: '표 17-1. 예제 그래프와 차시의 짝. 1교시는 위 다섯 개, 2교시는 아래 넷을 다룹니다.' },

          { type: 'h', text: '예제 04 — 도구 에이전트: 읽기 → 실행 → 코드' },
          { type: 'p', html: '04차시에서 <code>al.Agent(llm, tools=[get_weather, calculator, wiki_search])</code> 를 만들었습니다. 빌더에서는 <b>내장 도구 노드 3개</b>의 <code>tool</code> 출력이 에이전트의 <code>tools</code> 포트(여러 개 연결 가능 = <code>*</code>)에 꽂힙니다. 간선에는 두 종류가 있습니다. <b>값 포트</b>(text)에는 텍스트가 흐르고, <b>자원 포트</b>(llm · tool · memory · agent · task)에는 객체가 연결됩니다. 실행 엔진은 값 포트만 보고 "이 노드에 활성 입력이 있는가"를 판단합니다.' },
          { type: 'figure', html: '<img src="img/builder/13_tool_agent_run.png" alt="도구 에이전트 실행 로그 — 도구 3개가 에이전트의 도구 포트에 연결되고 로그에 도구 호출과 관찰이 찍힌 모습" loading="lazy">', caption: '그림 17-2. 빌더에서 예제 04 를 실행한 화면. 도구 호출 🔧 → 관찰 👁 → 최종 답 ✅ 이 로그에 찍히고, 단계 기록이 결과 패널에 표로 나옵니다.' },
          { type: 'code', title: '예제 17-1. 그래프 읽기: 노드 표와 포트별 연결', desc: '<code>json.load</code> 로 연 그래프는 평범한 dict 입니다. 노드 표를 찍어 보면 어떤 노드가 있는지, 간선을 찍어 보면 값이 흐르는 연결(값)과 자원 연결(자원)이 구분됩니다. <code>engine.validate</code> 는 필수 포트가 모두 연결되었는지 검사합니다.', expect: EXP['17-1'], code: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
print(g['name'], '· 노드', len(g['nodes']), '· 간선', len(g['edges']), '· max_loops', g['settings']['max_loops'])
print()
print(f"{'id':<4}{'type':<8}label · config")
for n in g['nodes']:
    cfg = {k: v for k, v in n['config'].items() if v}          # 비어 있지 않은 설정만
    print(f"{n['id']:<4}{n['type']:<8}{n['label']} · {json.dumps(cfg, ensure_ascii=False)[:58]}")

RESOURCE = ('llm', 'tool', 'memory', 'agent', 'task')          # 자원 포트 = 객체 연결
print()
print('간선 (from.port → to.port)')
for e in g['edges']:
    kind = '자원' if e['fromPort'] in RESOURCE else '값 '
    print(f"  [{kind}] {e['from']}.{e['fromPort']:<6} → {e['to']}.{e['toPort']}")
print()
print('검증:', engine.validate(g) or '이상 없음')
` },
          { type: 'code', title: '예제 17-2. 실행: 이벤트 콜백으로 생각 → 도구 → 관찰 보기', nondeterministic: true, desc: '<code>emit</code> 콜백은 노드가 시작할 때(<code>node_start</code>), 노드 안에서 print 가 일어날 때(<code>log</code>), 결과 노드에 값이 닿을 때(<code>result</code>), 모두 끝났을 때(<code>done</code>) 불립니다. 04차시의 <code>verbose=True</code> 출력이 그대로 log 이벤트가 됩니다. 날씨 도구는 브라우저에서 실제 API 를 부르므로 값이 달라질 수 있습니다(검증 도구는 예시 데이터).', expect: EXP['17-2'], code: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))

def show(ev):
    t = ev['type']
    if t == 'node_start':
        print('▶', ev['node'], '(실행', ev['run'], '번째)')
    elif t == 'log':
        print('    ', ev['text'])
    elif t == 'result':
        print('===', ev['title'], '===')
        v = ev['value']
        if isinstance(v, list):                      # 단계 기록(trace)은 리스트
            for step in v:
                print('   ', step)
        else:
            print(v)
    elif t == 'done':
        print('✅ 완료 · LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, overrides={'n1': '부산 날씨 알려줘'}, emit=show)   # overrides: 시작 입력 노드 id → 값
` },
          { type: 'code', title: '예제 17-3. 내보낸 코드 ↔ 04차시의 al.Agent', desc: '<code>export.export_python</code> 은 그래프를 위에서 아래로 읽히는 독립 스크립트로 만듭니다. 앞부분(LLM 공급자 · .env · 도우미)을 빼고 <code>main()</code> 만 보면 04차시 코드 그대로입니다: 도구 변수 3개 → <code>al.Agent(llm, tools=[…], system=…)</code> → <code>run()</code> → <code>steps</code>.', expect: EXP['17-3'], code: `import json
from builder import export

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
code = export.export_python(g)
print('전체', len(code.splitlines()), '줄 — 그중 에이전트 흐름(main) 부분만:')
print()
print(code[code.index('def main():'):].rstrip())
` },
          { type: 'callout', kind: 'tip', title: '노드 하나 = agentlab 한 줄', html: '내보낸 코드에서 <code># ── 라벨 (노드 종류)</code> 주석 하나가 노드 하나입니다. 변수 이름은 노드 종류 + 번호(<code>tool1</code> · <code>agent1</code>)이고, 포트 연결은 <b>함수 인자</b>(<code>tools=[tool1, tool2, tool3]</code>)가 됩니다. 그래프를 읽을 줄 알면 코드를 읽을 줄 알고, 그 반대도 마찬가지입니다.' },

          { type: 'h', text: '예제 05 — 기억: session 이 실행 사이를 잇는다' },
          { type: 'p', html: '05차시에서 <code>ConversationMemory</code> 를 에이전트에 붙여 "내 이름은 영준이야" 다음에 "내 이름이 뭐지?" 를 물었습니다. 그래프에서는 <b>대화 기억 노드</b>의 <code>memory</code> 출력을 에이전트의 <code>memory</code> 포트에 연결합니다. 그런데 그래프는 <b>한 번 실행하면 끝</b>인데 어떻게 다음 실행이 이전 대화를 기억할까요? 답은 <code>session</code> dict 입니다. 실행 엔진은 노드 id 별로 상태를 <code>session[노드id]</code> 에 보관하고, 기억 노드는 거기에 <code>ConversationMemory</code> 객체를 넣어 둡니다. <b>같은 dict 를 다시 넘기면</b> 같은 객체가 쓰입니다.' },
          { type: 'figure', html: FIG_SESSION, caption: '그림 17-3. session dict 가 기억 노드(n3)의 ConversationMemory 를 실행 사이에 보관합니다. 빌더의 🧹 기억 지우기는 session 을 비우는 것과 같습니다.' },
          { type: 'figure', html: '<img src="img/builder/15_memory_run.png" alt="기억하는 챗봇 실행 — 두 번째 실행에서 이름을 기억해 답한 모습" loading="lazy">', caption: '그림 17-4. 빌더에서 예제 05 를 두 번 실행한 화면. 두 번째 실행의 로그에 "기억: 2개 메시지 보관 중" 이 보입니다.' },
          { type: 'code', title: '예제 17-4. 같은 session 으로 두 번 실행 → 이름을 기억한다 · 새 session 은 잊는다', desc: '첫 실행의 답이 어색한 것은 모의 LLM 의 한계입니다(실제 모델은 "반가워요 영준님" 처럼 답합니다). 중요한 것은 <b>두 번째 실행</b>: 기억 노드가 "2개 메시지 보관 중" 이라고 알리고 이름을 답합니다. <code>session[\'n3\'][\'mem\']</code> 에 들어 있는 객체가 05차시의 <code>ConversationMemory</code> 그 자체임을 확인하세요.', expect: EXP['17-4'], code: `import json
from builder import engine

g = json.load(open('builder/05_memory_chat.json', encoding='utf-8'))

def answer(ev):
    if ev['type'] == 'result':
        print('   🤖', ev['value'])
    elif ev['type'] == 'log' and ev['text'].startswith('🧠 기억'):
        print('   ', ev['text'])

session = {}                                        # 기억 · 문서 저장소가 보관되는 곳
for msg in ['내 이름은 영준이야', '내 이름이 뭐지?']:
    print('👤', msg)
    engine.run_graph(g, overrides={'n1': msg}, emit=answer, session=session)

print()
print('session 의 키(노드 id):', list(session))
mem = session['n3']['mem']                           # n3 = 대화 기억 노드
print('보관된 객체:', type(mem).__name__, '· 메시지', len(mem.history), '개')

print()
print('--- 새 session (기억 없음)')
print('👤 내 이름이 뭐지?')
engine.run_graph(g, overrides={'n1': '내 이름이 뭐지?'}, emit=answer, session={})
` },

          { type: 'h', text: '예제 05 — RAG: 문서 검색 노드의 context 를 LLM 호출의 참고 포트에' },
          { type: 'p', html: '05차시 후반의 <code>al.VectorStore</code> 는 <b>문서 검색 노드</b>가 되었습니다. 문서 칸에 문단을 빈 줄로 구분해 넣으면 노드가 색인하고(<code>add_many</code>), <code>query</code> 포트로 들어온 질문과 비슷한 문단 <code>k</code> 개를 찾아 <code>context</code> 출력으로 내보냅니다. 이것을 <b>LLM 호출 노드의 context(참고) 포트</b>에 연결하고 프롬프트에 <code>{context}</code> 를 쓰면 RAG 가 됩니다. 문서 저장소도 session 에 보관되므로 문서가 바뀌지 않으면 다시 색인하지 않습니다.' },
          { type: 'figure', html: '<img src="img/builder/16_rag_run.png" alt="문서 검색 노드가 질문과 비슷한 문단을 찾아 LLM 호출의 참고 포트로 넘기는 실행 화면" loading="lazy">', caption: '그림 17-5. 빌더에서 예제 05_rag 를 실행한 화면. 로그에 🔎 점수와 함께 찾은 문단이 보이고, 답은 참고 문서에 근거합니다.' },
          { type: 'code', title: '예제 17-5. RAG 실행 → 문서를 추가하고 k 를 바꿔 다시 실행', desc: '설정(<code>config</code>)만 바꾸면 노드가 알아서 다시 색인합니다. 모의 LLM 은 참고 문서를 그대로 되풀이하는 답을 내지만, 검색 노드가 <b>올바른 문단을 찾았는지</b>(🔎 로그)가 이 예제의 핵심입니다. 임베딩은 키가 없으면 해시 기반(오프라인), 키가 있으면 실제 임베딩을 씁니다.', expect: EXP['17-5'], code: `import json
from builder import engine

g = json.load(open('builder/05_rag.json', encoding='utf-8'))
vs = next(n for n in g['nodes'] if n['type'] == 'vectorstore')
docs = [d for d in vs['config']['documents'].split('\\n\\n') if d.strip()]
print('문서', len(docs), '개 · k =', vs['config']['k'])
for d in docs:
    print('  -', d)

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith(('📚', '🔎')):
        print('   ', ev['text'])
    elif ev['type'] == 'result' and ev['title'] == '답변':
        print('🤖', ev['value'][:60], '…')

print()
print('👤 재택근무는 일주일에 며칠까지 할 수 있어?')
engine.run_graph(g, emit=show)

# 문서를 추가하고 k 를 1 로 — 설정이 바뀌면 노드가 다시 색인한다
vs['config']['documents'] += '\\n\\n회의실 예약은 사내 포털에서 하루 전까지 신청한다.'
vs['config']['k'] = 1
print()
print('👤 회의실 예약은 어떻게 해?')
engine.run_graph(g, overrides={'n1': '회의실 예약은 어떻게 해?'}, emit=show)
` },

          { type: 'h', text: '예제 06 — 계획 · 초안 · 비평과 수정 · 심사' },
          { type: 'p', html: '06차시의 <code>al.Planner</code> 와 <code>al.Reflector</code> 는 각각 <b>계획 세우기</b> 노드와 <b>비평 · 수정</b> 노드가 되었고, <code>Reflector.score</code> 는 <b>평가(LLM 심사)</b> 노드가 되었습니다. 예제 06_reflection 은 이 셋을 <b>프롬프트 템플릿</b>으로 이어 붙입니다: 계획의 <code>text</code> 출력과 시작 입력이 템플릿의 <code>{plan}</code> · <code>{goal}</code> 자리에 들어가 초안 프롬프트가 되고, 초안 → 비평·수정 → 심사로 값이 흐릅니다. 템플릿 노드는 <code>{이름}</code> 마다 입력 포트가 생기는 <b>동적 포트</b> 노드입니다.' },
          { type: 'figure', html: '<img src="img/builder/21_reflection_run.png" alt="계획 세우기, 템플릿, 초안, 비평 수정, LLM 심사 점수로 이어진 그래프의 실행 화면" loading="lazy">', caption: '그림 17-6. 빌더에서 예제 06_reflection 을 실행한 화면. 📌 계획 단계 → 🔍 검토 → ✏️ 수정 → ⚖️ 점수가 로그에 차례로 찍힙니다.' },
          { type: 'code', title: '예제 17-6. 계획 → 초안 → 비평·수정 → 심사 실행과 내보낸 코드의 반복문', desc: 'LLM 호출은 정확히 5번입니다(계획 1 · 초안 1 · 비평 1 · 수정 1 · 심사 1). 내보낸 코드에서 비평·수정 노드는 06차시 예제와 같은 <code>for</code> 반복문(<code>critique</code> → <code>revise</code>)이 됩니다. <code>rounds</code> 설정을 2 로 바꾸면 반복이 2번이 됩니다(실습 17-2).', expect: EXP['17-6'], code: `import json
from builder import engine, export

g = json.load(open('builder/06_reflection.json', encoding='utf-8'))
print(' → '.join(f"{n['label']}({n['type']})" for n in g['nodes'] if n['type'] not in ('input', 'llm', 'output')))

def show(ev):
    if ev['type'] == 'log' and ev['text'][:1] in '📌🔍✏⚖':
        print('   ', ev['text'][:80])
    elif ev['type'] == 'result':
        print('===', ev['title'], '===')
        print(str(ev['value'])[:120])
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회 (계획 1 + 초안 1 + 비평 1 + 수정 1 + 심사 1)')

print()
engine.run_graph(g, emit=show)

code = export.export_python(g)
print()
print('--- 내보낸 코드의 비평 · 수정 부분 (06차시 Reflector 와 같다)')
print(code[code.index('    # ── 비평 · 수정'):code.index('    # ── 최종 평가')].rstrip())
` },
          { type: 'p', html: '<b>ReAct 에이전트</b> 노드(06_react)는 같은 도구 루프를 Thought / Action / Observation <b>텍스트 형식</b>으로 수행합니다(함수 호출 API 가 없는 모델에서도 동작). 이 예제의 또 다른 주인공은 <b>파이썬 도구</b> 노드입니다. 코드 칸에 함수를 쓰면 노드가 함수를 꺼내 <code>al.tool(fn)</code> 로 감쌉니다 — docstring 첫 줄이 설명, <code>인자: 설명</code> 줄이 매개변수 설명, 타입 힌트가 스키마라는 04차시 규칙 그대로입니다.' },
          { type: 'code', title: '예제 17-7. 파이썬 도구 노드 = @al.tool · ReAct 기록 보기', desc: '노드가 하는 일을 두 줄로 흉내 냅니다: <code>nodes.exec_function</code> 으로 코드에서 함수를 꺼내고 <code>al.tool</code> 로 감싸면 <code>describe()</code> 에 스키마가 보입니다. 그래프 실행에서 모의 LLM 은 "곱해줘" 라는 말에 계산기를 고르지만, 실제 모델은 주가 도구를 먼저 부릅니다(예시 출력은 모의 LLM 기준).', expect: EXP['17-7'], code: `import json
import agentlab as al
from builder import engine, nodes

g = json.load(open('builder/06_react.json', encoding='utf-8'))
py = next(n for n in g['nodes'] if n['type'] == 'pytool')
print(py['config']['code'])

fn = nodes.exec_function(py['config']['code'])    # 노드가 하는 일 ①: 코드에서 함수를 꺼내
tool = al.tool(fn)                                #                ②: @al.tool 로 감싼다 (04차시)
print(tool.describe())
print('직접 호출:', tool.call({'symbol': 'msft'}))

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith(('Thought', 'Action', 'Observation', 'Final')):
        print('   ', ev['text'][:90])
    elif ev['type'] == 'result' and ev['title'] == '최종 답':
        print('🤖', ev['value'])

print()
engine.run_graph(g, emit=show)
` },
          { type: 'table', head: ['노드', 'agentlab (브라우저)', '배운 곳', '내보낸 코드의 모습'], rows: [
            ['🤖 에이전트', '<code>al.Agent(llm, tools, system, memory)</code>', '04 · 05', '<code>agent1 = al.Agent(…).run(question)</code>'],
            ['🔧 내장 도구 · 🐍 파이썬 도구', '<code>al.get_weather</code> · <code>@al.tool</code>', '04', '<code>tool1 = al.get_weather</code> · <code>def get_stock_price(…)</code>'],
            ['🧠 대화 기억', '<code>al.ConversationMemory(window)</code> · <code>SummaryMemory</code>', '05', '<code>memory1 = al.ConversationMemory(window=8)</code>'],
            ['📚 문서 검색', '<code>al.VectorStore().add_many / search</code>', '05', '<code>store.search(query, k=2)</code> → <code>context</code>'],
            ['🗺️ 계획 · 🔍 비평·수정 · ⚖️ 심사', '<code>al.Planner.plan</code> · <code>al.Reflector.critique/revise/score</code>', '06', '<code>for _round in range(rounds):</code>'],
            ['🧭 ReAct', '<code>al.ReActAgent(llm, tools)</code>', '06', '<code>react1_agent.run(…)</code> · <code>transcript</code>']
          ], caption: '표 17-2. 1교시 노드와 agentlab 코드의 대응. 내보낸 코드의 변수 이름은 노드 종류 + 번호입니다.' },
          { type: 'callout', kind: 'more', title: '더 알아보기: 빌더 화면에서 같은 일 하기', html: '빌더(🌐 samcho93.github.io/agentBuilder)의 <b>📘 튜토리얼</b> 8 · 9 · 10절이 오늘 1교시와 같은 예제를 화면에서 따라 하는 안내입니다. 도구 노드의 <code>tool</code> 출력을 에이전트의 네모 ● 포트(여러 개 연결)에 끌어다 놓기, 실행 패널에서 입력을 바꿔 가며 여러 번 ▶ 실행하기(기억), <b>🧹 기억 지우기</b>, 문서 검색 노드의 문서 칸 편집, 🐍 파이썬 도구의 코드 칸 — 모두 오늘 코드로 한 일과 1:1 입니다.' },
          { type: 'callout', kind: 'info', teacher: true, title: '🧑‍🏫 실습 해설 (17-1 ~ 17-3)', html: '<ul><li><b>17-1</b> 노드 추가는 dict 하나 append + 간선 하나 append 입니다. <code>fromPort</code> 가 <code>tool</code>, <code>toPort</code> 가 <code>tools</code>(복수!)인 것을 틀리기 쉽습니다 — 틀리면 <code>validate</code> 는 통과하지만 도구가 연결되지 않아 모의 LLM 이 "지금 몇 시" 에 답하지 못합니다.</li><li><b>17-2</b> <code>rounds</code> 는 문자열이 아니라 숫자. 비평 로그(🔍)가 2번 찍히고 LLM 호출이 7회가 되는지 세게 합니다.</li><li><b>17-3</b> 요약 기억은 LLM 이 필요하므로 n2 → n3 llm 간선을 추가하는 것이 포인트. 연결하지 않아도 노드가 모의 LLM 으로 대신하지만, 실제 키를 쓸 때는 반드시 연결해야 합니다.</li></ul>' }
        ],
        practice: [
          { title: '실습 17-1. 04 그래프에 도구 노드 추가하기', level: 1,
            desc: '<p><code>04_tool_agent</code> 그래프에 <b>현재 시각 도구</b>(type <code>tool</code>, config <code>{\'name\': \'now\'}</code>) 노드 <code>n9</code> 를 추가하고, 그 <code>tool</code> 출력을 에이전트(<code>n6</code>)의 <code>tools</code> 포트에 연결하세요. <code>engine.validate</code> 로 확인한 뒤 "지금 몇 시야?" 로 실행해 비서의 답을 출력하세요.</p>',
            hint: '노드 dict 에는 id · type · label · x · y · config 가 필요합니다. 간선은 <code>{\'id\': \'e8\', \'from\': \'n9\', \'fromPort\': \'tool\', \'to\': \'n6\', \'toPort\': \'tools\'}</code>.',
            nondeterministic: true,
            starter: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
# TODO: 노드 n9 (type 'tool', config {'name': 'now'}) 를 g['nodes'] 에 추가
# TODO: 간선 e8 (n9.tool → n6.tools) 를 g['edges'] 에 추가

print('도구 노드:', [n['config']['name'] for n in g['nodes'] if n['type'] == 'tool'])
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith(('🔧', '👁')):
        print('   ', ev['text'][:80])
    elif ev['type'] == 'result' and ev['title'] == '비서의 답':
        print('🤖', ev['value'])

engine.run_graph(g, overrides={'n1': '지금 몇 시야?'}, emit=show)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
g['nodes'].append({'id': 'n9', 'type': 'tool', 'label': '현재 시각', 'x': 100, 'y': 400, 'config': {'name': 'now'}})
g['edges'].append({'id': 'e8', 'from': 'n9', 'fromPort': 'tool', 'to': 'n6', 'toPort': 'tools'})

print('도구 노드:', [n['config']['name'] for n in g['nodes'] if n['type'] == 'tool'])
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith(('🔧', '👁')):
        print('   ', ev['text'][:80])
    elif ev['type'] == 'result' and ev['title'] == '비서의 답':
        print('🤖', ev['value'])

engine.run_graph(g, overrides={'n1': '지금 몇 시야?'}, emit=show)
` },
          { title: '실습 17-2. 비평 · 수정을 두 번 반복하고 기준 바꾸기', level: 2,
            desc: '<p><code>06_reflection</code> 그래프에서 <b>비평 · 수정</b> 노드의 <code>rounds</code> 를 2 로, <code>criteria</code> 를 "짧은 문장 · 예시 코드 포함" 으로 바꾸고, <b>최종 평가</b> 노드의 <code>criteria</code> 를 "간결성" 으로 바꾸세요. 실행해 🔍 검토 로그가 몇 번 찍히는지 세고(<code>reviews</code>), 전체 LLM 호출 횟수와 점수를 출력하세요.</p>',
            hint: '노드를 <code>next(n for n in g[\'nodes\'] if n[\'type\'] == \'reflector\')</code> 로 찾아 <code>config</code> 를 고칩니다. 검토 로그는 <code>ev[\'text\'].startswith(\'🔍\')</code>.',
            starter: `import json
from builder import engine

g = json.load(open('builder/06_reflection.json', encoding='utf-8'))
# TODO: reflector 노드의 config['rounds'] = 2, config['criteria'] 변경
# TODO: judge 노드의 config['criteria'] = '간결성'

reviews = 0
def show(ev):
    global reviews
    if ev['type'] == 'log' and ev['text'].startswith('🔍'):
        reviews += 1
        print('   ', ev['text'][:60])
    elif ev['type'] == 'result' and ev['title'].startswith('평가'):
        print('⚖️ 점수:', ev['value']['score'])
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
print('검토 횟수:', reviews)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/06_reflection.json', encoding='utf-8'))
ref = next(n for n in g['nodes'] if n['type'] == 'reflector')
ref['config']['rounds'] = 2
ref['config']['criteria'] = '짧은 문장 · 예시 코드 포함'
judge = next(n for n in g['nodes'] if n['type'] == 'judge')
judge['config']['criteria'] = '간결성'

reviews = 0
def show(ev):
    global reviews
    if ev['type'] == 'log' and ev['text'].startswith('🔍'):
        reviews += 1
        print('   ', ev['text'][:60])
    elif ev['type'] == 'result' and ev['title'].startswith('평가'):
        print('⚖️ 점수:', ev['value']['score'])
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
print('검토 횟수:', reviews)
`, expect: EXP['p17-2'] },
          { title: '실습 17-3. 요약 기억으로 바꾸고 세 번 대화하기', level: 3,
            desc: '<p><code>05_memory_chat</code> 그래프의 <b>대화 기억</b> 노드(<code>n3</code>)를 요약 기억(<code>kind: \'summary\'</code>, <code>window: 4</code>)으로 바꾸세요. 요약 기억은 LLM 이 필요하므로 LLM 노드 <code>n2</code> 의 <code>llm</code> 출력을 <code>n3</code> 의 <code>llm</code> 포트에 연결하는 간선을 추가하세요. 같은 session 으로 "내 이름은 영준이야" → "나는 파이썬을 좋아해" → "내 이름이 뭐지?" 세 번 실행하고, 마지막에 <code>session[\'n3\'][\'mem\']</code> 의 클래스 이름과 보관 메시지 수를 출력하세요.</p>',
            hint: '<code>type(session[\'n3\'][\'mem\']).__name__</code> 이 <code>SummaryMemory</code> 가 되어야 합니다. 요약 기억은 window 를 넘는 오래된 대화를 LLM 요약으로 압축합니다(05차시).',
            starter: `import json
from builder import engine

g = json.load(open('builder/05_memory_chat.json', encoding='utf-8'))
# TODO: n3 의 config 를 {'kind': 'summary', 'window': 4} 로
# TODO: 간선 추가: n2.llm → n3.llm

def answer(ev):
    if ev['type'] == 'result':
        print('   🤖', ev['value'])

session = {}
for msg in ['내 이름은 영준이야', '나는 파이썬을 좋아해', '내 이름이 뭐지?']:
    print('👤', msg)
    engine.run_graph(g, overrides={'n1': msg}, emit=answer, session=session)

mem = session['n3']['mem']
print(type(mem).__name__, '· 보관 메시지', len(mem.history), '개')
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/05_memory_chat.json', encoding='utf-8'))
mem_node = next(n for n in g['nodes'] if n['id'] == 'n3')
mem_node['config'] = {'kind': 'summary', 'window': 4}
g['edges'].append({'id': 'e9', 'from': 'n2', 'fromPort': 'llm', 'to': 'n3', 'toPort': 'llm'})

def answer(ev):
    if ev['type'] == 'result':
        print('   🤖', ev['value'])

session = {}
for msg in ['내 이름은 영준이야', '나는 파이썬을 좋아해', '내 이름이 뭐지?']:
    print('👤', msg)
    engine.run_graph(g, overrides={'n1': msg}, emit=answer, session=session)

mem = session['n3']['mem']
print(type(mem).__name__, '· 보관 메시지', len(mem.history), '개')
`, expect: EXP['p17-3'] }
        ],
        quiz: QUIZ1,
        slides: [
          { layout: 'title', title: 'agentBuilder 로 다시 만드는 에이전트 ①', subtitle: '도구 · 기억 · RAG · 계획과 반성을 노드로 — 읽기 → 실행 → 코드', notes: '<p>💬 "04차시에서 만든 al.Agent(llm, tools) 가 빌더에서는 어떤 모양일까?" → 도구 노드 3개가 에이전트의 tools 포트에 꽂힌다. 오늘은 내가 만든 것을 그래프에서 다시 보는 시간.</p><p>⏱ 도입 5분. 표 17-1 로 예제 ↔ 차시 짝을 먼저 보여 준다.</p>' },
          { layout: 'diagram', title: '세 단계: 읽기 → 실행 → 코드 비교', html: FIG_PIPE, caption: '예제마다 같은 세 단계를 반복한다',
            notes: '<p>세 단계가 오늘의 리듬임을 강조. ① json.load ② engine.run_graph(emit) ③ export.export_python. 1교시 다섯 예제, 2교시 네 예제.</p>' },
          { layout: 'table', title: '예제 그래프 ↔ 배운 차시', head: ['예제', '핵심 노드', '차시'], rows: [
            ['04_tool_agent', '🔧 ×3 → 🤖 에이전트(tools*)', '04 · 11'],
            ['05_memory_chat', '🧠 대화 기억 → 🤖(memory)', '05'],
            ['05_rag', '📚 문서 검색(context) → 💬 LLM 호출', '05'],
            ['06_reflection', '🗺️ → 🧩 → 💬 → 🔍 → ⚖️', '06'],
            ['06_react', '🐍 파이썬 도구 → 🧭 ReAct', '04 · 06']
          ], lead: '1교시에 다루는 다섯 예제', notes: '<p>저장소의 assets/builder/*.json 이 브라우저 파이썬에서 builder/…json 으로 열린다는 것을 알려 준다.</p>' },
          { layout: 'code', title: '예제 04 읽기: 노드 표 · 값 포트와 자원 포트', code: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
print(g['name'], '· 노드', len(g['nodes']), '· 간선', len(g['edges']))
for n in g['nodes']:
    print(f"{n['id']:<4}{n['type']:<8}{n['label']}")

RESOURCE = ('llm', 'tool', 'memory', 'agent', 'task')
for e in g['edges']:
    kind = '자원' if e['fromPort'] in RESOURCE else '값 '
    print(f"  [{kind}] {e['from']}.{e['fromPort']} → {e['to']}.{e['toPort']}")
print('검증:', engine.validate(g) or '이상 없음')
`, points: ['그래프 = 평범한 dict: nodes · edges · settings', '<b>값 포트</b>(text)에는 텍스트가 흐르고 <b>자원 포트</b>에는 객체가 연결', 'tools 포트는 여러 개 연결(*) — 도구 3개', 'validate: 필수 포트가 비면 오류 목록'],
            notes: '<p>💬 "e2(llm) 와 e1(text) 의 차이는?" → 자원 vs 값. 엔진이 "활성 입력" 을 판단할 때 값 포트만 본다는 것이 2교시 건너뜀 규칙의 근거.</p><p>⏱ 12분 블록 시작.</p>' },
          { layout: 'code', title: '예제 04 실행: 이벤트 콜백', code: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))

def show(ev):
    t = ev['type']
    if t == 'log':
        print('    ', ev['text'])
    elif t == 'result':
        print('===', ev['title'], '===')
        print(ev['value'])
    elif t == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, overrides={'n1': '부산 날씨 알려줘'}, emit=show)
`, points: ['emit 콜백 이벤트: node_start · log · node_skip · loop · result · done', 'log = 노드 안의 print (04차시 verbose 출력 그대로)', 'overrides: 시작 입력 노드 id → 값 (빌더의 실행 패널 입력)'],
            notes: '<p>🔧 도구 호출 → 👁 관찰 → ✅ 최종 답 흐름이 04차시 출력과 똑같음을 확인. 날씨 도구는 브라우저에서 실제 API 를 부르므로 값이 다를 수 있다.</p>' },
          { layout: 'code', title: '내보낸 코드 ↔ al.Agent', code: `import json
from builder import export

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
code = export.export_python(g)
body = code[code.index('def main():'):]
print(body[:900])
`, points: ['노드 하나 = <code># ── 라벨 (종류)</code> 주석 한 블록', '포트 연결 = 함수 인자 <code>tools=[tool1, tool2, tool3]</code>', '04차시 코드와 1:1 — 그래프를 읽으면 코드를 읽는다'],
            notes: '<p>변수 이름 규칙(노드 종류 + 번호)을 짚어 준다. 앞부분(공급자 · .env)은 16차시에서 봤으므로 main 만.</p>' },
          { layout: 'diagram', title: '기억: session 이 실행 사이를 잇는다', html: FIG_SESSION, caption: 'session[노드id] 에 ConversationMemory 가 보관된다 · 새 dict = 기억 없음',
            notes: '<p>💬 "그래프는 한 번 실행하면 끝인데 어떻게 기억하지?" → session dict. 노드 id 가 열쇠라는 점(그래프를 고쳐도 id 가 같으면 유지)도 언급. 🧹 기억 지우기 = session 비우기.</p><p>⏱ 14분 블록 시작.</p>' },
          { layout: 'code', title: '같은 session 으로 두 번 · 새 session 으로 한 번', code: `import json
from builder import engine

g = json.load(open('builder/05_memory_chat.json', encoding='utf-8'))
def answer(ev):
    if ev['type'] == 'result':
        print('   🤖', ev['value'])

session = {}
for msg in ['내 이름은 영준이야', '내 이름이 뭐지?']:
    print('👤', msg)
    engine.run_graph(g, overrides={'n1': msg}, emit=answer, session=session)
mem = session['n3']['mem']
print(type(mem).__name__, '· 메시지', len(mem.history), '개')
print('--- 새 session')
engine.run_graph(g, overrides={'n1': '내 이름이 뭐지?'}, emit=answer, session={})
`, points: ['두 번째 실행이 이름을 기억한다', '<code>session[\'n3\'][\'mem\']</code> = 05차시의 ConversationMemory 객체', '첫 답이 어색한 것은 모의 LLM 의 한계(실제 모델은 자연스럽게 답함)'],
            notes: '<p>첫 턴의 "아직 듣지 못했습니다" 는 모의 LLM 이 "내 이름" 이라는 말만 보고 질문으로 처리하기 때문. 미리 말해 주면 학생이 버그로 오해하지 않는다.</p>' },
          { layout: 'code', title: 'RAG: 문서 검색 → context → LLM 호출', code: `import json
from builder import engine

g = json.load(open('builder/05_rag.json', encoding='utf-8'))
vs = next(n for n in g['nodes'] if n['type'] == 'vectorstore')

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith(('📚', '🔎')):
        print('   ', ev['text'])
    elif ev['type'] == 'result' and ev['title'] == '답변':
        print('🤖', ev['value'][:60], '…')

engine.run_graph(g, emit=show)
vs['config']['documents'] += '\\n\\n회의실 예약은 사내 포털에서 하루 전까지 신청한다.'
vs['config']['k'] = 1
engine.run_graph(g, overrides={'n1': '회의실 예약은 어떻게 해?'}, emit=show)
`, points: ['문서 칸(빈 줄 구분) → add_many · query → search(k) → context', 'context 출력 → LLM 호출의 <b>참고</b> 포트 → 프롬프트의 <code>{context}</code>', '설정이 바뀌면 다시 색인(📚 로그) · 아니면 session 의 저장소 재사용'],
            notes: '<p>🔎 로그에서 올바른 문단을 찾았는지가 핵심. 모의 LLM 의 답은 문서를 되풀이할 뿐이므로 답 품질은 Colab(실제 모델)에서 확인.</p>' },
          { layout: 'code', title: '계획 → 초안 → 비평·수정 → 심사 (06)', code: `import json
from builder import engine

g = json.load(open('builder/06_reflection.json', encoding='utf-8'))

def show(ev):
    if ev['type'] == 'log' and ev['text'][:1] in '📌🔍✏⚖':
        print('   ', ev['text'][:80])
    elif ev['type'] == 'result' and ev['title'].startswith('평가'):
        print('⚖️', ev['value'])
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
`, points: ['🗺️ 계획 = al.Planner.plan · 🔍 비평·수정 = Reflector.critique/revise · ⚖️ 심사 = Reflector.score', '🧩 템플릿이 {goal} · {plan} 포트로 셋을 이어 붙인다 (동적 포트)', 'LLM 호출 5회 = 계획 1 + 초안 1 + 비평 1 + 수정 1 + 심사 1'],
            notes: '<p>06차시 그림(계획-실행-반성)을 떠올리게 하고, 템플릿 노드가 {이름} 마다 포트를 만든다는 점을 보여 준다. 실습 17-2 예고(rounds=2).</p><p>⏱ 12분 블록 시작.</p>' },
          { layout: 'code', title: '파이썬 도구 노드 = @al.tool', code: `import json
import agentlab as al
from builder import nodes

g = json.load(open('builder/06_react.json', encoding='utf-8'))
py = next(n for n in g['nodes'] if n['type'] == 'pytool')
print(py['config']['code'])

fn = nodes.exec_function(py['config']['code'])   # ① 코드에서 함수를 꺼내
tool = al.tool(fn)                               # ② 도구로 감싼다
print(tool.describe())
print(tool.call({'symbol': 'msft'}))
`, points: ['docstring 첫 줄 = 설명 · <code>인자: 설명</code> = 매개변수 · 타입 힌트 = 스키마', '04차시 @al.tool 규칙 그대로', 'ReAct 노드는 같은 루프를 Thought/Action/Observation 텍스트로'],
            notes: '<p>💬 "설명을 대충 쓰면?" → LLM 이 도구를 잘못 고른다(04차시). 모의 LLM 은 질문 키워드로 도구를 고르므로 그래프 실행에서 계산기를 먼저 부른다는 점을 미리 말해 준다.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ1[1].q, options: QUIZ1[1].options, answer: QUIZ1[1].answer, explain: QUIZ1[1].explain, notes: '<p>정답 ③. 그림 17-3 을 다시 가리키며 "노드 id 가 열쇠" 를 확인.</p>' },
          { layout: 'practice', title: '실습 17-1. 도구 노드 추가', desc: '<p>04 그래프에 현재 시각 도구(now) 노드를 추가하고 에이전트의 tools 포트에 연결한 뒤 "지금 몇 시야?" 로 실행하세요.</p>',
            starter: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
# TODO: 노드 n9 (type 'tool', config {'name': 'now'}) 추가
# TODO: 간선 e8 (n9.tool → n6.tools) 추가
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'result' and ev['title'] == '비서의 답':
        print('🤖', ev['value'])
engine.run_graph(g, overrides={'n1': '지금 몇 시야?'}, emit=show)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))
g['nodes'].append({'id': 'n9', 'type': 'tool', 'label': '현재 시각', 'x': 100, 'y': 400, 'config': {'name': 'now'}})
g['edges'].append({'id': 'e8', 'from': 'n9', 'fromPort': 'tool', 'to': 'n6', 'toPort': 'tools'})
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'result' and ev['title'] == '비서의 답':
        print('🤖', ev['value'])
engine.run_graph(g, overrides={'n1': '지금 몇 시야?'}, emit=show)
`, notes: '<p>⏱ 7분. toPort 가 tools(복수)임을 강조. 빨리 끝낸 학생은 실습 17-2(rounds=2) 로.</p>' },
          { layout: 'summary', title: '정리', bullets: ['예제 그래프 = <b>읽기</b>(json · 노드 표) → <b>실행</b>(emit 이벤트) → <b>코드 비교</b>(export)', '값 포트(text)에는 텍스트, 자원 포트(llm · tool · memory …)에는 객체', '<b>session</b> dict 가 기억 · 문서 저장소를 실행 사이에 보관 (노드 id 가 열쇠)', '문서 검색의 context → LLM 호출의 참고 포트 → <code>{context}</code> = RAG', '🗺️ 🔍 ⚖️ = Planner · Reflector · score, 🐍 파이썬 도구 = @al.tool', '다음 교시: 조건 분기 · 반복 · 팀 · 가드레일'], notes: '<p>⏱ 정리 7분(퀴즈 포함). 표 17-2 로 노드 ↔ agentlab 대응을 마무리.</p>' }
        ]
      },
      {
        id: 'ag17-2',
        title: '분기 · 반복 · 팀 · 가드레일',
        minutes: 50,
        goals: ['실행 엔진의 네 규칙(위상 순서 · 고른 포트 · 건너뜀 · 되돌아가기)으로 예제 08 의 실행을 예측한다', 'Crew · AutoGen · 가드레일 · 심사 노드의 연결을 읽고 코드로 고쳐 실행한다', '루프가 있는 작은 그래프를 처음부터 만든다'],
        flow: [['도입 · 실행 엔진의 네 규칙', 6], ['조건 분기 · 병합 · 되돌아가기 (08)', 14], ['팀: Crew · AutoGen (09 · 10)', 10], ['가드레일 · 심사 · 종합 비서 (13 · 11)', 12], ['퀴즈 · 정리', 8]],
        content: [
          { type: 'p', html: '1교시의 그래프는 모두 <b>직선</b>이었습니다. 이번 교시는 08차시에서 배운 <b>분기와 반복</b>, 09 · 10차시의 <b>팀</b>, 13차시의 <b>가드레일</b>이 그래프에서 어떻게 표현되는지 봅니다. 먼저 실행 엔진(<code>builder/engine.py</code>)의 규칙 네 가지를 정확히 알아야 합니다. 이 네 줄이 오늘 보게 될 모든 로그를 설명합니다.' },
          { type: 'list', ordered: true, items: [
            '<b>위상 순서로 한 번 훑는다</b> — 되돌아가는 간선(back edge)을 뺀 그래프에서, 들어오는 간선이 없는 노드부터 차례로 실행합니다(같은 순위면 노드 목록 순서).',
            '<b>분기 노드는 고른 포트로만 값을 보낸다</b> — 조건 분기 · 가드레일은 출력 dict 에 <code>__route__</code> 를 담고, 엔진은 그 포트에서 나가는 간선만 활성화합니다.',
            '<b>활성 입력이 없는 노드는 건너뛴다(skip)</b> — 값 포트에 연결은 있지만 활성 값이 하나도 없으면 <code>node_skip</code> 이벤트와 함께 건너뛰고, 그 아래도 연쇄적으로 건너뜁니다.',
            '<b>되돌아가는 간선이 활성화되면 목적지부터 다시 실행한다</b> — <code>settings.max_loops</code> 번까지만. 넘으면 "⚠ 최대 반복 횟수" 로그를 내고 반복을 멈춥니다.'
          ] },
          { type: 'figure', html: FIG_ROUTER_LOOP, caption: '그림 17-7. 예제 08 의 구조. 요청 분류가 세 가지 중 하나를 고르고, 글쓰기 가지는 초안 → 평가 → 통과? 를 거칩니다. "다시" 포트가 초안 작성의 context 로 되돌아가는 점선이 루프입니다.' },
          { type: 'figure', html: '<img src="img/builder/14_router_loop_run.png" alt="요청 분류, 초안 작성, 품질 평가, 통과 판정, 합류로 이어진 그래프의 실행 화면 — 실행되지 않은 가지는 흐리게 표시" loading="lazy">', caption: '그림 17-8. 빌더에서 예제 08 을 실행한 화면. 실행되지 않은 번역 · 일반 답변 가지는 ⏭ 흐리게 표시되고, 되돌아가는 연결은 점선입니다.' },

          { type: 'h', text: '예제 08 — 조건 분기 · 병합 · 되돌아가기' },
          { type: 'p', html: '<b>조건 분기</b> 노드에는 세 가지 방식이 있습니다. <b>키워드 규칙</b>(입력에 키워드가 있으면 그 라벨, 없으면 기타), <b>LLM 분류</b>(llm 포트에 모델을 연결하면 LLM 이 JSON 으로 라벨을 고름), <b>파이썬 식</b>(<code>text</code> 변수를 보고 라벨 문자열을 돌려주는 식). 분기 라벨마다 출력 포트가 생기는 동적 포트 노드이며, 기타 라벨의 포트 이름은 <code>__default__</code> 입니다. 예제 08 에는 분기가 둘 있습니다 — 요청을 분류하는 키워드 분기와, 심사 점수를 보고 통과 여부를 정하는 파이썬 식 분기입니다.' },
          { type: 'code', title: '예제 17-8. 그래프 분석: 분기 포트 · 실행 순서 · 되돌아가는 간선', desc: '<code>engine.analyze</code> 는 엔진이 실행 전에 하는 일을 그대로 돌려줍니다: 필수 포트 검사, DFS 로 되돌아가는 간선 찾기, 위상 정렬. "통과?" 의 <b>다시</b> 포트에서 "초안 작성" 의 context 로 가는 간선 하나가 back edge 로 분류되고, 나머지로 실행 순서가 정해집니다.', expect: EXP['17-8'], code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
for n in g['nodes']:
    if n['type'] == 'router':
        c = n['config']
        ports = [r['label'] for r in c['routes']] + [c['default_label'] + '(__default__)']
        print(f"🔀 {n['label']} · 방식={c['mode']} · 출력 포트={ports}")
        if c['mode'] == 'keyword':
            for r in c['routes']:
                print(f"     {r['label']} ← 키워드: {r['keywords']}")
        if c['mode'] == 'python':
            print('     식:', c['expr'])

nodes, in_edges, out_edges, order, back = engine.analyze(g)
print()
print('실행 순서:', ' → '.join(labels[i] for i in order))
for e in g['edges']:
    if e['id'] in back:
        print(f"🔁 되돌아가는 간선: {labels[e['from']]}.{e['fromPort']} → {labels[e['to']]}.{e['toPort']}  (max_loops={g['settings']['max_loops']})")
` },
          { type: 'code', title: '예제 17-9. 실행: 고른 가지만 돌고 나머지는 건너뛴다', desc: '세 가지 요청으로 실행하면 매번 다른 가지가 돌고 나머지 가지의 노드들은 <code>node_skip</code> 됩니다. 건너뛴 가지의 LLM 은 호출되지 않으므로 호출 횟수도 다릅니다(글쓰기 2회 · 번역 1회 · 일반 1회). <b>병합</b> 노드(첫 값 모드)에는 실행된 가지의 값 하나만 도착합니다.', expect: EXP['17-9'], code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}

def show(ev):
    t = ev['type']
    if t == 'node_end' and 'route' in ev:
        print(f"   🔀 {labels[ev['node']]} → {ev['route']}")
    elif t == 'node_skip':
        print(f"   ⏭ 건너뜀: {labels[ev['node']]}")
    elif t == 'log' and ev['text'].startswith('⚖'):
        print('   ', ev['text'])
    elif t == 'result':
        print('   🏁', str(ev['value']).replace('\\n', ' ')[:60], '…')
    elif t == 'done':
        print('   ✅ LLM 호출', ev['usage']['calls'], '회')

for q in ['AI 에이전트를 소개하는 블로그 글을 써줘', '안녕하세요를 영어로 번역해줘', '오늘 기분이 어때?']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show)
` },
          { type: 'p', html: '모의 LLM 의 심사는 항상 7점이고 통과 기준도 7점이라 기본 실행에서는 루프가 돌지 않습니다. <b>기준을 8점으로 올리면</b> "다시" 포트가 활성화되어 되돌아가는 간선이 살아나고, 엔진은 초안 작성부터 다시 실행합니다. 이때 초안 프롬프트의 <code>{context}</code> 자리에 직전 심사 결과(JSON)가 들어가므로 "이전 피드백을 반영한 초안"이 됩니다. 영원히 7점이면 어떻게 될까요? <code>max_loops</code> 가 멈춥니다.' },
          { type: 'code', title: '예제 17-10. 되돌아가기(루프): 기준을 높이면 다시 쓴다 · max_loops 가 멈춘다', desc: '<code>loop</code> 이벤트가 반복 횟수와 목적지를 알려 줍니다. 초안 작성 노드의 <code>run</code> 이 1 → 2 → 3 으로 늘고, <code>max_loops=2</code> 에 도달하면 경고 로그를 내고 아래(병합 → 결과)로 진행합니다. 08차시 <code>compile(max_steps=…)</code> 과 같은 안전장치입니다. 실제 모델은 피드백을 반영해 점수가 올라가므로 보통 1~2번 만에 통과합니다.', expect: EXP['17-10'], code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
gate = next(n for n in g['nodes'] if n['label'] == '통과?')
gate['config']['expr'] = "'통과' if (json.loads(text).get('score') or 0) >= 8 else '다시'"   # 7 → 8
g['settings']['max_loops'] = 2                                                         # 3 → 2

def show(ev):
    t = ev['type']
    if t == 'node_start' and ev['node'] == 'n4':
        print(f"   ✍️ 초안 작성 (실행 {ev['run']}번째)")
    elif t == 'log' and ev['text'][:1] in '⚖🔀⚠':
        print('   ', ev['text'])
    elif t == 'loop':
        print(f"   🔁 반복 {ev['count']} → {ev['node']} 부터 다시")
    elif t == 'result':
        print('   🏁 결과 도착 —', str(ev['value'])[:30], '…')
    elif t == 'done':
        print('   ✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
` },
          { type: 'code', title: '예제 17-11. 내보낸 코드: 분기는 if, 반복은 for', desc: '내보낸 코드는 그래프의 구조를 그대로 파이썬 제어문으로 옮깁니다. 요청 분류는 <code>route_keywords</code> 한 줄, 가지는 <code>if router1 == \'글쓰기\':</code>, 되돌아가는 간선은 <code>for _loop in range(max_loops):</code> 와 <code>break</code> 조건이 됩니다. 08차시에서 손으로 쓴 라우터 · 조건부 엣지와 비교해 보세요.', expect: EXP['17-11'], code: `import json
from builder import export

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
code = export.export_python(g)
print(code[code.index('    # ── 요청 분류'):code.index('    # ── 합류')].rstrip())
` },
          { type: 'callout', kind: 'warn', title: '루프를 만들 때 세 가지', html: '① 되돌아가는 간선의 목적지는 보통 <b>context(참고)</b> 포트 — 입력(input)으로 되돌리면 원래 요청이 덮어써집니다. ② 분기 식은 <b>실제로 바뀔 수 있는 값</b>(점수)을 봐야 합니다 — 항상 같은 값이면 max_loops 까지 헛돕니다. ③ <code>max_loops</code> 는 최후의 보루이고, 비용(LLM 호출 수 = 가지 노드 수 × 반복)을 먼저 계산하세요.' },

          { type: 'h', text: '예제 09 · 10 — 팀: Crew 와 AutoGen' },
          { type: 'p', html: '09차시의 <code>CrewAgent · Task · Crew</code> 는 세 노드가 되었습니다. <b>역할 에이전트</b>(role · goal · backstory, LLM 과 도구 연결) → <b>작업</b>(description 에 <code>{input}</code> 사용 가능, 담당 포트에 에이전트, 참고 작업 포트에 앞 작업) → <b>Crew 실행</b>(tasks 포트에 작업을 <b>순서대로</b>, input 포트에 시작 입력). 10차시의 AutoGen 은 <b>대화 에이전트</b>(name · system_message) 를 <b>2자 대화</b>(a · b · 첫 메시지) 또는 <b>그룹 채팅</b>(agents* · 매니저 LLM · 주제)에 연결합니다. 둘 다 <b>자원 포트</b>(agent · task)로 연결되므로 값은 Crew 실행 · 2자 대화 노드에서만 흐릅니다.' },
          { type: 'figure', html: FIG_TEAM, caption: '그림 17-9. 팀 노드의 연결. Crew 는 작업들이 참고 작업 포트로 사슬처럼 이어지고, AutoGen 은 대화 에이전트들이 대화 노드에 모입니다.' },
          { type: 'figure', html: '<img src="img/builder/17_crew_run.png" alt="역할 에이전트 3개, 작업 3개, Crew 실행 노드로 이루어진 마케팅 팀 그래프의 실행 화면" loading="lazy">', caption: '그림 17-10. 빌더에서 예제 09 를 실행한 화면. 로그에 🧑‍💼 [역할] 작업 n/3 이 차례로 찍히고 작업별 결과가 결과 패널에 나옵니다.' },
          { type: 'code', title: '예제 17-12. Crew: 작업의 담당 · 참고 연결 읽기 → 다른 제품으로 실행', desc: '작업 노드의 간선을 읽으면 "누가(담당) 무엇을 참고해서(참고 작업)" 하는지 보입니다. Crew 실행 노드의 <code>input</code> 포트로 들어온 값이 작업 설명의 <code>{input}</code> 에 채워지므로 제품 이름만 바꾸면 같은 팀이 다른 제품을 다룹니다. 09차시의 <code>crew.kickoff({\'input\': …})</code> 와 같습니다.', expect: EXP['17-12'], code: `import json
from builder import engine

g = json.load(open('builder/09_crew.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
for n in g['nodes']:
    if n['type'] == 'crew_task':
        who = [labels[e['from']] for e in g['edges'] if e['to'] == n['id'] and e['toPort'] == 'agent']
        ctx = [labels[e['from']] for e in g['edges'] if e['to'] == n['id'] and e['toPort'] == 'context']
        print(f"📌 {n['label']} · 담당={who[0]} · 참고={ctx or '없음'}")

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith('🧑'):
        print('   ', ev['text'][:70])
    elif ev['type'] == 'result' and ev['title'].startswith('작업별'):
        for i, out in enumerate(ev['value'], 1):
            print(f"--- 작업 {i} 결과: {str(out)[:70]}")
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회 (작업 수만큼)')

print()
engine.run_graph(g, overrides={'n1': "접이식 전동 킥보드 'FoldGo'"}, emit=show)
` },
          { type: 'figure', html: '<img src="img/builder/18_autogen_run.png" alt="개발자와 리뷰어의 2자 대화, 기획자 엔지니어 디자이너의 그룹 채팅 그래프 실행 화면" loading="lazy">', caption: '그림 17-11. 빌더에서 예제 10 을 실행한 화면. 한 캔버스에 2자 대화(위)와 그룹 채팅(아래) 두 그래프가 함께 있습니다 — 연결되지 않은 그래프 여러 개도 한 번에 실행됩니다.' },
          { type: 'code', title: '예제 17-13. AutoGen: 2자 대화(TERMINATE 로 종료)와 그룹 채팅(라운드 로빈)', desc: '2자 대화는 리뷰어의 답에 <code>TERMINATE</code> 가 나오면 <code>max_turns</code> 전에 끝납니다. 그룹 채팅은 <code>max_round</code> 만큼 참가자가 순서대로 발언합니다. 대화 기록은 <code>transcript</code> 출력으로 결과 노드에 전달됩니다. 10차시 <code>initiate_chat</code> · <code>GroupChatManager.run</code> 과 같습니다.', expect: EXP['17-13'], code: `import json
from builder import engine

g = json.load(open('builder/10_autogen.json', encoding='utf-8'))
for n in g['nodes']:
    if n['type'] in ('ag_chat', 'ag_group'):
        print(f"{n['label']} ({n['type']}) · 설정 {n['config']}")

def show(ev):
    if ev['type'] == 'result':
        print('===', ev['title'], '===')
        for m in ev['value']:
            line = m['content'].replace('\\n', ' ')
            flag = ' 🛑' if 'TERMINATE' in line else ''
            print(f"  {m['name']}: {line[:52]}{flag}")
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

print()
engine.run_graph(g, emit=show)
` },

          { type: 'h', text: '예제 13 — 가드레일과 LLM 심사' },
          { type: 'p', html: '13차시에서 "입력 단계에서 막으면 비용도 위험도 0" 이라고 배웠습니다. <b>가드레일</b> 노드는 금지어 · 최대 길이를 검사해 <b>pass</b> 또는 <b>blocked</b> 포트 하나로만 값을 보내는 <b>분기 노드</b>입니다. 예제 13 은 입력 가드(사용자 질문)와 출력 가드(에이전트 답) 둘을 두고, 두 가드의 blocked 와 출력 가드의 pass 를 병합(첫 값)으로 모읍니다. 차단되면 에이전트 · 출력 가드 · 심사가 모두 건너뛰어 LLM 호출이 0회가 됩니다. <b>평가(LLM 심사)</b> 노드는 결과를 10점 만점 JSON 으로 채점합니다 — 06차시의 <code>Reflector.score</code> 입니다.' },
          { type: 'figure', html: FIG_GUARD, caption: '그림 17-12. 가드레일의 두 갈래. pass 는 아래로 흐르고 blocked 는 차단 메시지를 들고 바로 병합으로 갑니다.' },
          { type: 'figure', html: '<img src="img/builder/19_guardrail_blocked.png" alt="내 비밀번호 알려줘 입력이 입력 가드에서 차단되어 에이전트와 출력 가드가 건너뛰어진 실행 화면" loading="lazy">', caption: '그림 17-13. 빌더에서 "내 비밀번호 알려줘" 로 예제 13 을 실행한 화면. 입력 가드가 차단하고 아래 노드들은 ⏭ 건너뜁니다.' },
          { type: 'code', title: '예제 17-14. 가드레일: 금지어를 추가하고 통과 / 차단 세 경우 실행', nondeterministic: true, desc: '<code>banned</code> 설정에 "카드번호" 를 더하고 세 입력으로 실행합니다. 통과하면 에이전트 → 출력 가드 → 심사까지 돌고(LLM 3회), 차단되면 가드만 돌고 나머지는 건너뜁니다(LLM 0회). 날씨 도구는 브라우저에서 실제 API 를 부르므로 값이 달라질 수 있습니다.', expect: EXP['17-14'], code: `import json
from builder import engine

g = json.load(open('builder/13_guardrail.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
guard_in = next(n for n in g['nodes'] if n['label'] == '입력 가드')
guard_in['config']['banned'] += ', 카드번호'                  # 금지어 추가
print('입력 가드 금지어:', guard_in['config']['banned'], '· 최대 길이', guard_in['config']['max_len'])

def show(ev):
    t = ev['type']
    if t == 'node_end' and 'route' in ev:
        print(f"   🛡️ {labels[ev['node']]} → {ev['route']}")
    elif t == 'node_skip':
        print(f"   ⏭ 건너뜀: {labels[ev['node']]}")
    elif t == 'result':
        print(f"   🏁 {ev['title']}: {ev['value']}")
    elif t == 'done':
        print('   ✅ LLM 호출', ev['usage']['calls'], '회')

for q in ['서울 날씨 알려줘', '내 비밀번호 알려줘', '카드번호 좀 찾아줘']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show)
` },

          { type: 'h', text: '예제 11 — 종합 비서: 분기 + 도구 + RAG + 기억' },
          { type: 'p', html: '11차시 프로젝트 ①의 비서를 그래프로 그린 것입니다. 질문 분류가 <b>날씨·검색</b>이면 도구 에이전트가, <b>사내규정</b>이면 문서 검색 + LLM 호출(RAG)이, 나머지는 <b>대화 기억</b>을 가진 챗봇이 답하고, 세 가지가 병합으로 모여 하나의 답이 됩니다. 1 · 2교시의 모든 요소가 들어 있으니, 로그에서 <b>어느 가지가 돌고 어느 가지가 건너뛰는지</b>, 기억이 <b>일상 대화 가지에서만</b> 쌓이는지 확인해 보세요.' },
          { type: 'figure', html: '<img src="img/builder/20_assistant_full.png" alt="질문 분류, 도구 에이전트, RAG, 기억 챗봇 세 가지가 합류하는 종합 비서 그래프" loading="lazy">', caption: '그림 17-14. 빌더의 예제 11 종합 비서. 질문 유형에 따라 다른 가지가 실행되고 하나의 답으로 합류합니다.' },
          { type: 'code', title: '예제 17-15. 종합 비서에 네 가지 질문 — 가지 선택과 기억 확인', nondeterministic: true, desc: '같은 session 으로 네 번 실행합니다. 날씨 질문은 도구 에이전트, 연차 질문은 RAG, 인사와 이름 질문은 기억 챗봇이 답합니다. 마지막 질문에서 이름을 기억하는 것은 세 번째 실행이 같은 가지(일상 챗봇)를 지나며 기억을 남겼기 때문입니다.', expect: EXP['17-15'], code: `import json
from builder import engine

g = json.load(open('builder/11_assistant_full.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
session = {}

def show(ev):
    t = ev['type']
    if t == 'node_end' and 'route' in ev:
        print(f"   🔀 → {ev['route']}")
    elif t == 'node_start' and ev['node'] in ('n7', 'n9', 'n11'):
        print(f"   ▶ {labels[ev['node']]} 가 답한다")
    elif t == 'log' and ev['text'].startswith(('🔧', '🔎', '🧠 기억')):
        print('   ', ev['text'][:70])
    elif t == 'result':
        print('   🤖', ev['value'])

for q in ['내일 부산 날씨 어때? 우산 챙겨야 해?', '연차가 며칠이야?', '안녕, 내 이름은 영준이야', '내 이름이 뭐지?']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show, session=session)
` },
          { type: 'table', head: ['노드', 'agentlab / 프레임워크', '배운 곳', '실행 규칙에서의 역할'], rows: [
            ['🔀 조건 분기', '<code>add_conditional_edges</code> 의 라우터 함수', '08', '<code>__route__</code> 로 고른 포트만 활성화'],
            ['🔗 병합', '합류점 (첫 값 / 이어 붙이기)', '08', '도착한 값만 모은다'],
            ['되돌아가는 간선', '조건부 엣지로 만든 루프 · <code>max_steps</code>', '08', 'back edge → 목적지부터 재실행 · <code>max_loops</code>'],
            ['🧑‍💼 📌 👥', '<code>CrewAgent · Task(context=) · Crew.kickoff</code>', '09 · 12', 'agent · task 자원 포트, tasks 연결 순서 = 실행 순서'],
            ['🗣️ 💞 👨‍👩‍👧', '<code>ConversableAgent · initiate_chat · GroupChat</code>', '10', 'TERMINATE 로 조기 종료 · max_round'],
            ['🛡️ 가드레일 · ⚖️ 심사', '금지어 검사 · <code>Reflector.score</code> (LLM-as-a-Judge)', '13 · 06', 'pass / blocked 분기 → 건너뜀으로 비용 0']
          ], caption: '표 17-3. 2교시 노드와 배운 내용의 대응.' },
          { type: 'colab', title: 'Colab 실습 17 — agentBuilder 저장소를 받아 실제 LLM 으로 예제 실행 · 내보내기 · JSON 수정', html: '<p>노트북에서는 <code>git clone</code> 으로 agentBuilder 저장소를 받고 Colab Secrets 의 <code>GEMINI_API_KEY</code> 로 ① 예제 08(분기 · 반복 — 실제 점수로 루프가 도는지) ② 09(Crew) ③ 13(가드레일)을 <code>run_graph.py</code> 와 <code>engine.run_graph</code> 로 실행합니다. ④ <code>--export</code> 로 파이썬 파일을 만들어 <code>python out.py "질문"</code> 으로 실행하고 ⑤ JSON 을 코드로 고쳐(분기 추가 · 금지어 · 작업 추가) 다시 실행합니다. ✏️ 실습 문제 3개(도구 추가 · 가드 수정 · 루프 그래프)가 있습니다.</p>' },
          { type: 'callout', kind: 'more', title: '더 알아보기: 빌더 화면에서 분기 · 루프 · 팀 만들기', html: '📘 튜토리얼 10 · 11 · 12절. 조건 분기 노드의 속성 패널에서 <b>방식</b>과 <b>분기 라벨</b>을 추가하면 라벨마다 출력 포트가 생깁니다. 되돌아가는 연결은 캔버스에서 뒤쪽 노드의 출력을 앞쪽 노드의 포트로 끌어다 놓으면 <b>점선</b>으로 표시되고, 상단 ⚙ 설정의 <b>최대 반복 횟수</b>가 <code>max_loops</code> 입니다. 작업 노드의 참고 작업 포트, Crew 실행의 tasks 포트 연결 순서, 가드레일의 두 출력 포트도 같은 방식으로 끌어 연결합니다.' },
          { type: 'callout', kind: 'info', teacher: true, title: '🧑‍🏫 수업 준비 체크리스트', html: '<ul><li>예제 17-10(루프)은 LLM 호출 6회, 17-13(AutoGen)은 6회 — 실제 키로는 10~20초 걸리므로 시연은 모의 LLM 으로, 품질 비교는 Colab 에서</li><li>예제 17-14 · 17-15 는 날씨 도구가 실제 API 를 부르므로(브라우저) 출력이 예시와 다를 수 있음을 미리 말한다</li><li>칠판에 그림 17-7 을 크게 그려 두고 네 규칙(위상 순서 · 고른 포트 · 건너뜀 · 되돌아가기)을 수업 내내 가리킨다 — 로그의 ⏭ · 🔁 가 어느 규칙인지 학생이 말하게 한다</li><li>빌더를 열어 둔 두 번째 창에서 같은 예제를 ▶ 실행해 "코드로 본 이벤트 = 화면의 로그" 를 보여 주면 효과적</li><li>Colab 17 은 git clone 이 필요 — 네트워크가 막혀 있으면 ZIP 을 미리 받아 업로드</li></ul>' },
          { type: 'callout', kind: 'warn', teacher: true, title: '🧑‍🏫 자주 나오는 오류 · 오개념', html: '<ul><li><b>"필수 포트가 연결되지 않았습니다"</b> → <code>engine.validate(g)</code> 가 노드 라벨과 포트 이름을 알려 줍니다. 노드를 코드로 추가할 때 <code>toPort</code> 이름(<code>tools</code> · <code>values</code> · <code>context</code>)을 카탈로그와 맞추게 합니다.</li><li><b>"루프가 끝나지 않는다 / 매번 max_loops 까지 돈다"</b> → 분기 식이 보는 값이 실제로 바뀌는지 확인. 모의 LLM 은 항상 7점이므로 기준 8 이상이면 반드시 max_loops 까지 돕니다 — 이것은 버그가 아니라 안전장치가 동작하는 것.</li><li><b>"노드가 건너뛰어졌어요(⏭)"</b> → 값 포트에 활성 입력이 없음. 분기가 다른 포트를 골랐거나, 위쪽 노드가 건너뛰어 연쇄된 것. 자원 포트(llm · tool)만 연결된 노드는 건너뛰지 않습니다.</li><li><b>"병합 없이 결과 노드에 가지 하나만 연결"</b> → 다른 가지가 돌면 결과 노드가 건너뛰어 아무것도 안 나옵니다. 합류점에는 병합(첫 값)을 둡니다.</li><li><b>"되돌아가는 간선을 input 포트로 연결"</b> → 원래 요청이 심사 JSON 으로 덮어써집니다. context 포트로.</li><li><b>"id 중복"</b> → 노드를 추가할 때 <code>n11</code> 처럼 기존 id 와 겹치면 <code>GraphError</code>. <code>max(int(n[\'id\'][1:]) …) + 1</code> 로 새 id 를 만들게 합니다.</li></ul>' },
          { type: 'callout', kind: 'tip', teacher: true, title: '🧑‍🏫 평가 루브릭 (실습 17-4 ~ 17-6)', html: '<table><tr><th>항목</th><th>우수 (3)</th><th>보통 (2)</th><th>미흡 (1)</th></tr><tr><td>그래프 읽기</td><td>노드 · 포트 · 간선을 보고 실행 순서와 건너뛸 노드를 예측해 설명</td><td>실행 후 로그로 설명</td><td>설명 못함</td></tr><tr><td>그래프 수정</td><td>validate 통과 · 포트 이름 정확 · id 중복 없음</td><td>시행착오 후 동작</td><td>미동작</td></tr><tr><td>루프 설계 (17-6)</td><td>context 로 되돌림 · 바뀌는 값으로 판정 · max_loops 와 비용 설명</td><td>동작하지만 설명 부족</td><td>무한 루프 또는 미동작</td></tr><tr><td>코드 대응</td><td>노드 ↔ agentlab ↔ 차시를 표로 짝지음</td><td>일부</td><td>못함</td></tr></table>' }
        ],
        practice: [
          { title: '실습 17-4. 조건 분기에 "요약" 가지 추가하기', level: 2,
            desc: '<p><code>08_router_loop</code> 그래프의 <b>요청 분류</b> 노드(<code>n3</code>)에 라벨 <b>요약</b>(키워드 <code>요약, 정리</code>) 분기를 추가하고, 새 LLM 호출 노드 <code>n11</code>(system "당신은 요약 전문가입니다.", prompt <code>{input}</code>)을 만들어 <code>n3.요약 → n11.input</code>, <code>n2.llm → n11.llm</code>, <code>n11.text → n9.values</code> 세 간선으로 연결하세요. "다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다." 로 실행해 분기 라벨과 결과를 출력하세요.</p>',
            hint: '분기 설정은 <code>n3[\'config\'][\'routes\'].append({\'label\': \'요약\', \'keywords\': \'요약, 정리\'})</code>. 요약 라벨이 글쓰기 키워드("글" 등)와 겹치지 않도록 <b>앞쪽에 insert</b> 하는 것이 안전합니다 — 키워드 규칙은 위에서부터 첫 일치를 고릅니다.',
            starter: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
router = next(n for n in g['nodes'] if n['id'] == 'n3')
# TODO: router['config']['routes'] 맨 앞에 {'label': '요약', 'keywords': '요약, 정리'} 추가
# TODO: 노드 n11 (type 'chat', config {'system': '당신은 요약 전문가입니다.', 'prompt': '{input}'}) 추가
# TODO: 간선 3개 추가 (n3.요약 → n11.input, n2.llm → n11.llm, n11.text → n9.values)

print('분기 포트:', [r['label'] for r in router['config']['routes']])
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'node_end' and 'route' in ev:
        print('   🔀 →', ev['route'])
    elif ev['type'] == 'result':
        print('   🏁', ev['value'])

engine.run_graph(g, overrides={'n1': '다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다.'}, emit=show)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
router = next(n for n in g['nodes'] if n['id'] == 'n3')
router['config']['routes'].insert(0, {'label': '요약', 'keywords': '요약, 정리'})
g['nodes'].append({'id': 'n11', 'type': 'chat', 'label': '요약', 'x': 400, 'y': 500,
                   'config': {'system': '당신은 요약 전문가입니다.', 'prompt': '{input}'}})
g['edges'] += [{'id': 'e16', 'from': 'n3', 'fromPort': '요약', 'to': 'n11', 'toPort': 'input'},
               {'id': 'e17', 'from': 'n2', 'fromPort': 'llm', 'to': 'n11', 'toPort': 'llm'},
               {'id': 'e18', 'from': 'n11', 'fromPort': 'text', 'to': 'n9', 'toPort': 'values'}]

print('분기 포트:', [r['label'] for r in router['config']['routes']])
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'node_end' and 'route' in ev:
        print('   🔀 →', ev['route'])
    elif ev['type'] == 'result':
        print('   🏁', ev['value'])

engine.run_graph(g, overrides={'n1': '다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다.'}, emit=show)
`, expect: EXP['p17-4'] },
          { title: '실습 17-5. Crew 에 네 번째 작업 추가하기', level: 2,
            desc: '<p><code>09_crew</code> 그래프에 <b>작업 4: SNS 요약</b>(type <code>crew_task</code>, description "최종 글을 SNS 용 두 문장으로 요약하라", expected_output "두 문장") 노드 <code>n13</code> 을 추가하세요. 담당은 작가(<code>n5.agent → n13.agent</code>), 참고 작업은 편집(<code>n9.task → n13.context</code>), 그리고 Crew 실행의 tasks 포트에 <b>마지막으로</b> 연결(<code>n13.task → n10.tasks</code>)합니다. 실행해 작업 수와 작업 4 의 결과를 출력하세요.</p>',
            hint: 'tasks 포트 연결 순서가 실행 순서입니다 — 간선을 <code>g[\'edges\']</code> 끝에 append 하면 네 번째가 됩니다. 결과 노드 "작업별 결과" 의 값은 리스트입니다.',
            starter: `import json
from builder import engine

g = json.load(open('builder/09_crew.json', encoding='utf-8'))
# TODO: 노드 n13 (crew_task) 추가
# TODO: 간선 3개 추가 (n5.agent → n13.agent, n9.task → n13.context, n13.task → n10.tasks)
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith('🧑'):
        print('   ', ev['text'][:60])
    elif ev['type'] == 'result' and ev['title'].startswith('작업별'):
        print('작업 수:', len(ev['value']))
        print('작업 4 결과:', ev['value'][-1][:80])

engine.run_graph(g, emit=show)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/09_crew.json', encoding='utf-8'))
g['nodes'].append({'id': 'n13', 'type': 'crew_task', 'label': '작업 4: SNS 요약', 'x': 700, 'y': 400,
                   'config': {'description': '최종 글을 SNS 용 두 문장으로 요약하라', 'expected_output': '두 문장'}})
g['edges'] += [{'id': 'e16', 'from': 'n5', 'fromPort': 'agent', 'to': 'n13', 'toPort': 'agent'},
               {'id': 'e17', 'from': 'n9', 'fromPort': 'task', 'to': 'n13', 'toPort': 'context'},
               {'id': 'e18', 'from': 'n13', 'fromPort': 'task', 'to': 'n10', 'toPort': 'tasks'}]
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'log' and ev['text'].startswith('🧑'):
        print('   ', ev['text'][:60])
    elif ev['type'] == 'result' and ev['title'].startswith('작업별'):
        print('작업 수:', len(ev['value']))
        print('작업 4 결과:', ev['value'][-1][:80])

engine.run_graph(g, emit=show)
`, expect: EXP['p17-5'] },
          { title: '실습 17-6. 처음부터 만드는 루프 그래프: 초안 → 심사 → 통과? → 되돌아가기', level: 3,
            desc: '<p>예제 JSON 없이 그래프 dict 를 직접 만드세요. 노드: 시작 입력 <code>n1</code>, LLM 모델 <code>n2</code>(provider mock), LLM 호출 <code>n3</code>(system "당신은 카피라이터입니다.", prompt <code>{input}\\n\\n[피드백]\\n{context}</code>), 평가 <code>n4</code>(criteria "짧고 강렬함"), 조건 분기 <code>n5</code>(mode python, routes 통과 · 다시, expr <code>\'통과\' if json.loads(text)[\'score\'] &gt;= 9 else \'다시\'</code>), 결과 <code>n6</code>. 간선: n1→n3.input, n2→n3.llm, n3.text→n4.input, n2→n4.llm, n4.text→n5.input, <b>n5.다시→n3.context</b>(되돌아가기), n5.통과→n6.value. <code>settings.max_loops = 2</code>. 실행해 loop 이벤트와 결과를 출력하세요.</p>',
            hint: '<code>engine.validate(g)</code> 가 <code>[]</code> 가 될 때까지 포트 이름을 고치세요. 모의 LLM 은 항상 7점이므로 2번 되돌아간 뒤 max_loops 경고와 함께 멈추고, 통과 포트에 값이 없어 결과 노드는 건너뜁니다 — 그래서 "다시" 포트도 결과로 보내려면 병합이 필요하다는 것을 깨닫는 것이 이 실습의 마지막 질문입니다.',
            starter: `import json
from builder import engine

g = {'version': 1, 'name': '루프 그래프', 'settings': {'max_loops': 2},
     'nodes': [
         {'id': 'n1', 'type': 'input', 'label': '요청', 'x': 0, 'y': 0, 'config': {'text': '새 커피 브랜드 슬로건 한 줄'}},
         {'id': 'n2', 'type': 'llm', 'label': 'LLM', 'x': 0, 'y': 100, 'config': {'provider': 'mock'}},
         # TODO: n3 chat · n4 judge · n5 router(python) · n6 output
     ],
     'edges': [
         {'id': 'e1', 'from': 'n1', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'},
         # TODO: 나머지 간선 (n5.다시 → n3.context 가 되돌아가는 간선)
     ]}
print('검증:', engine.validate(g))

def show(ev):
    if ev['type'] == 'loop':
        print(f"🔁 반복 {ev['count']} → {ev['node']}")
    elif ev['type'] == 'log' and ev['text'][:1] in '⚖🔀⚠':
        print('   ', ev['text'])
    elif ev['type'] in ('result', 'node_skip'):
        print(ev['type'], ev.get('title', ev.get('node')), ev.get('value', ''))
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

# engine.run_graph(g, emit=show)
`,
            solution: `import json
from builder import engine

g = {'version': 1, 'name': '루프 그래프', 'settings': {'max_loops': 2},
     'nodes': [
         {'id': 'n1', 'type': 'input', 'label': '요청', 'x': 0, 'y': 0, 'config': {'text': '새 커피 브랜드 슬로건 한 줄'}},
         {'id': 'n2', 'type': 'llm', 'label': 'LLM', 'x': 0, 'y': 100, 'config': {'provider': 'mock'}},
         {'id': 'n3', 'type': 'chat', 'label': '초안', 'x': 200, 'y': 0,
          'config': {'system': '당신은 카피라이터입니다.', 'prompt': '{input}\\n\\n[피드백]\\n{context}'}},
         {'id': 'n4', 'type': 'judge', 'label': '심사', 'x': 400, 'y': 0, 'config': {'criteria': '짧고 강렬함'}},
         {'id': 'n5', 'type': 'router', 'label': '통과?', 'x': 600, 'y': 0,
          'config': {'mode': 'python', 'routes': [{'label': '통과'}, {'label': '다시'}], 'default_label': '기타',
                     'expr': "'통과' if json.loads(text)['score'] >= 9 else '다시'"}},
         {'id': 'n6', 'type': 'output', 'label': '결과', 'x': 800, 'y': 0, 'config': {'title': '슬로건'}},
     ],
     'edges': [
         {'id': 'e1', 'from': 'n1', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'},
         {'id': 'e2', 'from': 'n2', 'fromPort': 'llm', 'to': 'n3', 'toPort': 'llm'},
         {'id': 'e3', 'from': 'n3', 'fromPort': 'text', 'to': 'n4', 'toPort': 'input'},
         {'id': 'e4', 'from': 'n2', 'fromPort': 'llm', 'to': 'n4', 'toPort': 'llm'},
         {'id': 'e5', 'from': 'n4', 'fromPort': 'text', 'to': 'n5', 'toPort': 'input'},
         {'id': 'e6', 'from': 'n5', 'fromPort': '다시', 'to': 'n3', 'toPort': 'context'},     # 되돌아가는 간선
         {'id': 'e7', 'from': 'n5', 'fromPort': '통과', 'to': 'n6', 'toPort': 'value'},
     ]}
print('검증:', engine.validate(g))

def show(ev):
    if ev['type'] == 'loop':
        print(f"🔁 반복 {ev['count']} → {ev['node']}")
    elif ev['type'] == 'log' and ev['text'][:1] in '⚖🔀⚠':
        print('   ', ev['text'])
    elif ev['type'] in ('result', 'node_skip'):
        print(ev['type'], ev.get('title', ev.get('node')), ev.get('value', ''))
    elif ev['type'] == 'done':
        print('✅ LLM 호출', ev['usage']['calls'], '회')

engine.run_graph(g, emit=show)
`, expect: EXP['p17-6'] }
        ],
        quiz: QUIZ2,
        slides: [
          { layout: 'title', title: 'agentBuilder 로 다시 만드는 에이전트 ②', subtitle: '조건 분기 · 병합 · 되돌아가기 · Crew · AutoGen · 가드레일 · 종합 비서', notes: '<p>💬 "08차시 라우터 함수가 빌더에서는 뭐가 될까?" → 조건 분기 노드. "되돌아가는 화살표는?" → 뒤쪽 노드의 출력을 앞쪽 포트에 연결(점선). 오늘은 네 규칙으로 로그를 읽는다.</p><p>⏱ 도입 6분</p>' },
          { layout: 'bullets', title: '실행 엔진의 네 규칙', bullets: ['① <b>위상 순서</b>로 한 번 훑는다 (되돌아가는 간선 제외)', '② 분기 노드는 <b>고른 포트로만</b> 값을 보낸다 (<code>__route__</code>)', '③ 활성 입력이 없는 노드는 <b>건너뛴다</b> (⏭ node_skip · 연쇄)', '④ 되돌아가는 간선이 살아나면 <b>목적지부터 다시</b> (🔁 loop · <code>max_loops</code>)', '값 포트만 본다 — llm · tool 같은 자원 포트는 건너뜀 판정에 무관'], lead: '이 네 줄이 오늘 모든 로그를 설명한다',
            notes: '<p>칠판에 네 규칙을 번호로 적어 두고 수업 내내 "이건 몇 번 규칙?" 하고 묻는다. ③의 "값 포트만" 이 1교시 자원/값 구분과 이어진다.</p>' },
          { layout: 'diagram', title: '분기 · 병합 · 되돌아가기 (예제 08)', html: FIG_ROUTER_LOOP, caption: '고른 가지만 돈다 · 병합(첫 값) · 다시 → context 점선이 루프',
            notes: '<p>💬 "번역 요청이 들어오면 어느 노드가 건너뛸까?" → 초안 · 평가 · 통과? · 일반 답변. 되돌아가는 간선의 목적지가 context 포트인 이유(입력을 덮어쓰지 않으려고)를 설명.</p><p>⏱ 14분 블록 시작.</p>' },
          { layout: 'code', title: '그래프 분석: analyze 로 순서와 back edge', code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
for n in g['nodes']:
    if n['type'] == 'router':
        c = n['config']
        print('🔀', n['label'], c['mode'], [r['label'] for r in c['routes']], '+', c['default_label'])

nodes, in_edges, out_edges, order, back = engine.analyze(g)
print('순서:', ' → '.join(labels[i] for i in order))
for e in g['edges']:
    if e['id'] in back:
        print('🔁', labels[e['from']], e['fromPort'], '→', labels[e['to']], e['toPort'])
`, points: ['분기 방식 세 가지: 키워드 · LLM 분류 · 파이썬 식', '라벨마다 출력 포트, 기타는 <code>__default__</code>', 'analyze = 필수 포트 검사 + DFS back edge + 위상 정렬'],
            notes: '<p>"통과?" 분기의 파이썬 식이 심사 JSON 의 score 를 보는 것을 짚는다. 실행 순서에 되돌아가는 간선이 빠져 있음을 확인.</p>' },
          { layout: 'code', title: '실행: 고른 가지만 · 나머지는 ⏭', code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}

def show(ev):
    if ev['type'] == 'node_end' and 'route' in ev:
        print('   🔀', labels[ev['node']], '→', ev['route'])
    elif ev['type'] == 'node_skip':
        print('   ⏭', labels[ev['node']])
    elif ev['type'] == 'done':
        print('   ✅ LLM 호출', ev['usage']['calls'], '회')

for q in ['블로그 글을 써줘', '영어로 번역해줘', '오늘 기분이 어때?']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show)
`, points: ['요청마다 다른 가지 · 건너뛴 노드의 LLM 은 호출되지 않는다 (2 · 1 · 1회)', '병합(첫 값)에는 실행된 가지의 값 하나만 도착', '규칙 ② + ③'],
            notes: '<p>💬 "건너뛴 노드 수가 요청마다 다른 이유는?" → 글쓰기 가지는 노드가 3개. 호출 횟수 = 비용이라는 점 강조.</p>' },
          { layout: 'code', title: '루프: 기준을 올리면 다시 쓴다 · max_loops', code: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
gate = next(n for n in g['nodes'] if n['label'] == '통과?')
gate['config']['expr'] = "'통과' if json.loads(text)['score'] >= 8 else '다시'"
g['settings']['max_loops'] = 2

def show(ev):
    if ev['type'] == 'node_start' and ev['node'] == 'n4':
        print('   ✍️ 초안 작성', ev['run'], '번째')
    elif ev['type'] == 'loop':
        print('   🔁 반복', ev['count'], '→', ev['node'])
    elif ev['type'] == 'log' and ev['text'][:1] in '⚖⚠':
        print('   ', ev['text'])

engine.run_graph(g, emit=show)
`, points: ['모의 LLM 은 항상 7점 → 기준 8이면 "다시" → 되돌아가는 간선 활성화', '목적지(초안 작성)부터 재실행 · context 에 직전 심사 JSON', '<code>max_loops</code> 도달 → ⚠ 경고 후 아래로 진행 (규칙 ④)'],
            notes: '<p>실제 모델은 피드백을 반영해 점수가 올라 1~2번에 통과. 비용 = 가지 노드 수 × 반복 수를 계산하게 한다. 내보낸 코드의 for/break 도 잠깐 보여 준다(예제 17-11).</p>' },
          { layout: 'diagram', title: '팀 노드의 연결: Crew · AutoGen', html: FIG_TEAM, caption: '작업 → 참고 작업 사슬 · tasks 연결 순서 = 실행 순서 · TERMINATE',
            notes: '<p>09 · 10차시 코드(Task(context=[…]) · initiate_chat)와 이름이 같음을 확인. agent · task 는 자원 포트라 값은 Crew 실행 · 2자 대화 노드에서만 흐른다.</p><p>⏱ 10분 블록 시작.</p>' },
          { layout: 'code', title: 'Crew: 담당 · 참고 읽기 → 다른 제품으로', code: `import json
from builder import engine

g = json.load(open('builder/09_crew.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
for n in g['nodes']:
    if n['type'] == 'crew_task':
        who = [labels[e['from']] for e in g['edges'] if e['to'] == n['id'] and e['toPort'] == 'agent']
        ctx = [labels[e['from']] for e in g['edges'] if e['to'] == n['id'] and e['toPort'] == 'context']
        print('📌', n['label'], '담당', who, '참고', ctx)

def show(ev):
    if ev['type'] == 'result' and ev['title'].startswith('작업별'):
        for i, out in enumerate(ev['value'], 1):
            print(f'--- 작업 {i}: {str(out)[:60]}')

engine.run_graph(g, overrides={'n1': "접이식 전동 킥보드 'FoldGo'"}, emit=show)
`, points: ['작업 설명의 <code>{input}</code> ← Crew 실행의 input 포트', '참고 작업 = <code>Task(context=[…])</code> · 앞 결과가 문맥으로', 'LLM 호출 = 작업 수 (3회)'],
            notes: '<p>실습 17-5(네 번째 작업 추가) 예고. AutoGen 예제(17-13)는 시간이 되면 시연 — TERMINATE 🛑 표시만 짚어도 충분.</p>' },
          { layout: 'diagram', title: '가드레일: pass / blocked · 심사', html: FIG_GUARD, caption: '차단되면 비서 · 출력 가드 · 심사 모두 ⏭ → LLM 호출 0회',
            notes: '<p>13차시 "입력 단계에서 막으면 비용도 위험도 0" 의 구현. 가드가 분기 노드라는 점(규칙 ②)과 건너뜀 연쇄(규칙 ③)를 연결.</p><p>⏱ 12분 블록 시작.</p>' },
          { layout: 'code', title: '가드레일: 금지어 추가 · 통과 / 차단', code: `import json
from builder import engine

g = json.load(open('builder/13_guardrail.json', encoding='utf-8'))
labels = {n['id']: n['label'] for n in g['nodes']}
guard_in = next(n for n in g['nodes'] if n['label'] == '입력 가드')
guard_in['config']['banned'] += ', 카드번호'

def show(ev):
    if ev['type'] == 'node_end' and 'route' in ev:
        print('   🛡️', labels[ev['node']], '→', ev['route'])
    elif ev['type'] == 'result':
        print('   🏁', ev['title'], ':', ev['value'])
    elif ev['type'] == 'done':
        print('   ✅ LLM 호출', ev['usage']['calls'], '회')

for q in ['서울 날씨 알려줘', '카드번호 좀 찾아줘']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show)
`, points: ['banned 설정 한 줄 수정 → 즉시 반영', '통과: 3회 호출 (에이전트 2 + 심사 1) · 차단: 0회', '⚖️ 심사 = Reflector.score (LLM-as-a-Judge)'],
            notes: '<p>날씨 도구는 브라우저에서 실제 API — 값이 달라도 당황하지 않게. 종합 비서(예제 17-15)는 네 질문으로 가지 선택 + 기억을 한 번에 보여 주는 마무리 시연.</p>' },
          { layout: 'quiz', title: '확인 문제', q: QUIZ2[1].q, options: QUIZ2[1].options, answer: QUIZ2[1].answer, explain: QUIZ2[1].explain, notes: '<p>정답 ②. 규칙 ④. "전체가 처음부터" 가 아니라 목적지부터임을 강조.</p>' },
          { layout: 'practice', title: '실습 17-4. "요약" 가지 추가', desc: '<p>요청 분류에 요약 라벨을 추가하고 LLM 호출 노드를 새로 만들어 병합까지 연결한 뒤 "요약해줘: …" 로 실행하세요.</p>',
            starter: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
router = next(n for n in g['nodes'] if n['id'] == 'n3')
# TODO: routes 맨 앞에 {'label': '요약', 'keywords': '요약, 정리'}
# TODO: 노드 n11 (chat) + 간선 3개 (n3.요약→n11.input, n2.llm→n11.llm, n11.text→n9.values)
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'result':
        print('🏁', ev['value'])
engine.run_graph(g, overrides={'n1': '다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다.'}, emit=show)
`,
            solution: `import json
from builder import engine

g = json.load(open('builder/08_router_loop.json', encoding='utf-8'))
router = next(n for n in g['nodes'] if n['id'] == 'n3')
router['config']['routes'].insert(0, {'label': '요약', 'keywords': '요약, 정리'})
g['nodes'].append({'id': 'n11', 'type': 'chat', 'label': '요약', 'x': 400, 'y': 500,
                   'config': {'system': '당신은 요약 전문가입니다.', 'prompt': '{input}'}})
g['edges'] += [{'id': 'e16', 'from': 'n3', 'fromPort': '요약', 'to': 'n11', 'toPort': 'input'},
               {'id': 'e17', 'from': 'n2', 'fromPort': 'llm', 'to': 'n11', 'toPort': 'llm'},
               {'id': 'e18', 'from': 'n11', 'fromPort': 'text', 'to': 'n9', 'toPort': 'values'}]
print('검증:', engine.validate(g) or '이상 없음')

def show(ev):
    if ev['type'] == 'result':
        print('🏁', ev['value'])
engine.run_graph(g, overrides={'n1': '다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다.'}, emit=show)
`, notes: '<p>⏱ 8분. 키워드 규칙은 위에서부터 첫 일치 — "요약" 을 글쓰기 뒤에 두면 "써" 같은 키워드에 먼저 걸릴 수 있어 insert(0). 빨리 끝낸 학생은 17-6(루프 그래프) 로.</p>' },
          { layout: 'bullets', title: 'Colab 으로 이어서', bullets: ['🟠 Colab 실습 17 — <code>git clone</code> agentBuilder + <code>GEMINI_API_KEY</code>', '① 예제 08 실제 점수로 루프 확인 ② 09 Crew ③ 13 가드레일', '④ <code>run_graph.py … --export out.py</code> → <code>python out.py "질문"</code>', '⑤ JSON 을 코드로 고쳐(분기 · 금지어 · 작업) 다시 실행', '✏️ 문제 3개: 도구 추가 · 가드 수정 · 루프 그래프'],
            notes: '<p>실제 모델에서는 심사 점수가 바뀌므로 루프가 1~2번에 끝나는 것을 꼭 보게 한다. 모의 LLM 과의 차이가 곧 "안전장치가 왜 필요한가" 의 답.</p>' },
          { layout: 'summary', title: '정리', bullets: ['네 규칙: <b>위상 순서 · 고른 포트 · 건너뜀 · 되돌아가기(max_loops)</b>', '🔀 조건 분기(키워드 · LLM · 파이썬 식) + 🔗 병합(첫 값) = 08차시 라우터와 합류', '되돌아가는 간선 → context 포트 · 바뀌는 값으로 판정 · 비용 = 가지 × 반복', 'Crew: 작업 → 참고 작업 사슬 · tasks 순서 / AutoGen: TERMINATE · max_round', '🛡️ 가드레일은 분기 노드 — 차단되면 아래가 모두 ⏭, LLM 호출 0회', '내보낸 코드: 분기는 <code>if</code>, 반복은 <code>for</code> — 그래프를 읽으면 코드를 읽는다'], notes: '<p>⏱ 정리 8분(퀴즈 포함). 표 17-3 으로 2교시 노드 ↔ 차시 대응을 마무리하고, 강좌 전체(Part 2~6)가 하나의 캔버스에 모였음을 짚는다.</p>' }
        ]
      }
    ]
  });
})();
