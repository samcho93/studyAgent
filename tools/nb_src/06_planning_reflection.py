# %% [markdown]
# # 06. 계획과 반성 — ReAct · Plan-and-Execute · Self-Correction (실제 LLM 으로)
#
# 브라우저에서 모의 LLM 으로 체험한 **계획(Planning)** 과 **반성(Reflection)** 을 실제 LLM(Gemini 무료 키)으로 다시 돌려 봅니다.
#
# - 목표마다 **다른 계획**이 나오는지
# - 비평이 **라운드마다 달라지는지**, 평가 점수가 **실제로 올라가는지**
# - ReAct 와 Plan-and-Execute 의 **LLM 호출 횟수 · 토큰**을 비교
#
# 이 노트북은 강좌 모듈 `agentlab` 을 그대로 씁니다 (Colab 에 설치). 07차시부터는 실제 LangChain 으로 옮깁니다.

# %% [markdown]
# ## 0. 준비 — agentlab 설치와 API 키
# 1. 왼쪽 🔑 **Secrets** 에 `GEMINI_API_KEY` 를 추가하고 "노트북 액세스"를 켭니다 (00차시 참고).
# 2. 아래 셀을 실행하면 강좌 저장소에서 `agentlab` 을 내려받습니다.

# %%
!pip install -q requests
!rm -rf studyAgent && git clone -q https://github.com/samcho93/studyAgent.git
import sys
sys.path.insert(0, 'studyAgent/py')

# %%
import os
from google.colab import userdata

os.environ['GEMINI_API_KEY'] = userdata.get('GEMINI_API_KEY')   # Secrets 에서 읽기
import agentlab as al
al.status()                     # 🤖 LLM: Google Gemini … 가 나오면 성공

# %% [markdown]
# ## 1. 계획: 목표를 단계로 쪼개기
# 브라우저의 모의 LLM 은 어떤 목표든 같은 4단계를 냈습니다. 실제 LLM 은 목표마다 **다른 단계**를 냅니다.

# %%
llm = al.LLM()
planner = al.Planner(llm, max_steps=5)
for goal in ['전기차 시장 조사 보고서 만들기', '학교 축제 홍보 영상 만들기', '주말 1박 2일 부산 여행 준비']:
    print('🎯', goal)
    for i, s in enumerate(planner.plan(goal), 1):
        print(f'   {i}. {s}')

# %% [markdown]
# ## 2. ReAct: 생각과 행동을 번갈아
# `verbose=True` 로 Thought / Action / Observation 전체 기록을 봅니다. 실제 모델은 **Thought 의 내용이 질문마다 다릅니다**.

# %%
agent = al.ReActAgent(llm, tools=[al.calculator, al.get_weather, al.wiki_search], verbose=True)
print('최종 답:', agent.run('서울 날씨를 알려주고, 기온을 화씨로 바꿔 줘'))
print('LLM 호출:', llm.calls, '회 · 토큰:', llm.total_usage.total_tokens)

# %% [markdown] teacher
# 실제 모델은 도구를 두 번(get_weather → calculator) 부르는 경우가 많습니다. 모델이 `Observation:` 까지 지어내면
# `ReActAgent` 가 잘라내므로, 학생에게 `agent.transcript` 를 출력해 "관찰은 프로그램이 채운다"를 확인시키세요.

# %% [markdown]
# ## 3. Plan-and-Execute
# 계획자가 단계를 세우고 실행자(worker)가 한 단계씩 수행합니다. 여기서는 **도구를 가진 에이전트**를 실행자로 씁니다.

# %%
llm2 = al.LLM()
planner = al.Planner(llm2, max_steps=4)
worker_agent = al.Agent(llm2, tools=[al.wiki_search, al.calculator], system='당신은 조사 보조원입니다. 한 단계만 수행하고 결과를 세 문장 이내로 보고합니다.')

def worker(step, previous):
    context = ''
    if previous:
        context = '\n\n[참고: 이전 단계 결과]\n' + previous[-1]['result'][:300]
    worker_agent.reset()
    return worker_agent.run(step + context)

results = planner.execute('전기차 시장 조사 보고서 만들기', worker)
print('\n완료 단계:', len(results), '· LLM 호출:', llm2.calls, '회 · 토큰:', llm2.total_usage.total_tokens)

# %% [markdown]
# ### 🤔 비교해 보기
# 2번(ReAct)과 3번(Plan-and-Execute)의 **LLM 호출 횟수와 토큰**을 비교해 보세요. 어느 쪽이 큰 작업에 유리할까요?

# %% [markdown]
# ## 4. 재계획(re-plan): 실패 정보를 넣어 다시 계획하기

# %%
@al.tool
def book_room(hotel: str) -> dict:
    """호텔 방을 예약한다

    hotel: 호텔 이름
    """
    rooms = {'B 호텔': 2, 'C 호텔': 5}
    if hotel not in rooms:
        return {'error': hotel + ' 은(는) 만실입니다'}
    return {'hotel': hotel, 'booked': True}

llm3 = al.LLM()
planner = al.Planner(llm3, max_steps=4)
goal = '부산 출장 준비 (A 호텔 · B 호텔 · C 호텔 중 하나 예약, KTX 예매, 일정표)'
steps = planner.plan(goal)
done = []
for attempt in range(1, 4):
    print(f'📋 계획 {attempt}: {steps}')
    failed = None
    for s in steps:
        if s in done:
            continue
        hotel = next((h for h in ['A 호텔', 'B 호텔', 'C 호텔'] if h in s), None)
        r = book_room(hotel) if hotel else {'ok': s}
        if 'error' in r:
            failed = r['error']; print('   ❌', s, '→', failed); break
        done.append(s); print('   ✅', s)
    if failed is None:
        print('🎉 완료'); break
    steps = planner.plan(goal, context=f'실패: {failed}. 이미 완료: {done}. 다른 호텔을 골라라.')

# %% [markdown]
# ## 5. 반성: 비평 → 수정 루프
# 모의 LLM 과 달리 실제 LLM 은 **라운드마다 다른 지적**을 합니다. 두 번째 비평이 첫 번째와 어떻게 다른지 보세요.

# %%
llm4 = al.LLM()
reflector = al.Reflector(llm4)
draft = 'AI 에이전트는 유용하다. 많은 회사가 쓴다. 그래서 배워야 한다.'
final = reflector.improve(draft, rounds=2, criteria='근거 · 구체성 · 문장 길이를 중심으로 검토해라.')
print('\n=== 최종본 ===')
print(final)
print('LLM 호출:', llm4.calls, '회')

# %% [markdown]
# ## 6. 평가자 점수로 멈추기 (while 루프 + 안전장치)
# 점수가 실제로 올라가는지 확인합니다. 기준(8점)을 못 넘어도 `MAX_ROUNDS` 로 반드시 끝납니다.

# %%
llm5 = al.LLM()
reflector = al.Reflector(llm5, critic_system='당신은 엄격한 편집자입니다. 근거 · 구체성 · 출처를 기준으로 10점 만점으로 평가합니다.')
text = 'AI 에이전트는 회사에 도움이 된다.'
THRESHOLD, MAX_ROUNDS = 8, 3
rounds = 0
while True:
    ev = reflector.score(text, criteria='근거 · 구체성 · 출처')
    print(f'[{rounds}] 점수 {ev["score"]}  문제: {ev["issues"]}')
    if ev['score'] is not None and ev['score'] >= THRESHOLD:
        print('✅ 기준 통과'); break
    if rounds >= MAX_ROUNDS:
        print('⚠ 최대 횟수 도달'); break
    text = reflector.revise(text, ev['suggestion'])
    rounds += 1
print('\n최종:', text)

# %% [markdown]
# ## 7. 도구 오류를 보고 스스로 고치기

# %%
llm6 = al.LLM()
question = '사과 10개를 5명이 똑같이 나누고, 남은 사과 없이 한 명당 몇 개인지 계산해라.'
expr = llm6.ask(f'{question}\n파이썬 수식 하나만 써라. 설명 없이 수식만.')
for attempt in range(1, 4):
    result = al.calculator(expr)
    print(f'시도 {attempt}: {expr} → {result}')
    if 'error' not in result:
        break
    expr = llm6.ask(f'수식 {expr} 를 계산하니 오류: {result["error"]}\n문제: {question}\n오류를 고친 수식 하나만 써라.')

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 나의 목표 계획하기
# 자신의 목표(예: "동아리 발표 준비")를 `max_steps=3` 으로 계획하고 번호를 붙여 출력하세요.

# %%
goal = '동아리 발표 준비'
# BEGIN SOLUTION
for i, s in enumerate(al.Planner(al.LLM(), max_steps=3).plan(goal), 1):
    print(f'{i}. {s}')
# END SOLUTION

# %% [markdown]
# ### 문제 2. 생성자와 평가자 분리
# `writer`(system: "당신은 기술 블로그 작가입니다") 와 `critic`(system: "당신은 엄격한 편집자입니다") 두 LLM 을 만들어
# 초안 → 검토 → 수정본을 출력하세요.

# %%
writer, critic = al.LLM(), al.LLM()
# BEGIN SOLUTION
draft = writer.ask('AI 에이전트 소개 블로그 글을 5문장으로 써 줘', system_prompt='당신은 기술 블로그 작가입니다.')
review = critic.ask('다음 글을 검토해 줘:\n' + draft, system_prompt='당신은 엄격한 편집자입니다.')
final = writer.ask(f'원문:\n{draft}\n\n피드백:\n{review}\n\n피드백을 반영해 수정해 줘', system_prompt='당신은 기술 블로그 작가입니다.')
print('초안:', draft, '\n\n검토:', review, '\n\n수정본:', final)
# END SOLUTION

# %% [markdown]
# ### 문제 3. Self-Consistency
# 같은 문제를 `temperature=0.9` 로 5번 풀어 "답:" 뒤의 숫자를 모아 다수결로 최종 답을 고르세요.
# 문제: "한 반에 학생이 28명이고 4명씩 모둠을 만들면 모둠은 몇 개인가?"

# %%
from collections import Counter
q = '한 반에 학생이 28명이고 4명씩 모둠을 만들면 모둠은 몇 개인가? 단계별로 생각한 뒤 마지막 줄에 "답: 숫자" 로만 끝내라.'
# BEGIN SOLUTION
answers = [al.LLM().ask(q, temperature=0.9).split('답:')[-1].strip().split()[0] for _ in range(5)]
votes = Counter(answers)
print(dict(votes), '→ 최종 답:', votes.most_common(1)[0][0])
# END SOLUTION

# %% [markdown] teacher
# 실제 모델은 이 정도 문제를 거의 항상 맞히므로 5표가 모두 같게 나옵니다. "그럼 Self-Consistency 는 언제 쓸모 있나?" →
# 어려운 추론 문제 · 애매한 분류에서. 비용이 N배라는 점을 강조하세요.

# %% [markdown]
# ---
# ## 📝 정리
# - 실제 LLM 은 목표마다 다른 계획을 세우고, 라운드마다 다른 비평을 한다.
# - Plan-and-Execute 는 단계마다 짧은 문맥으로 호출하므로 큰 작업에서 토큰이 절약된다.
# - 반성 루프에는 **평가 점수 + 최대 횟수** 두 종료 조건이 필요하다.
# - 다음 차시: 같은 것을 LangChain 의 부품으로.
