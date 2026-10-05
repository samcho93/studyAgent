# %% [markdown]
# # 08. LangGraph — 상태 그래프로 설계하는 에이전트 (실제 LangGraph)
#
# 브라우저에서 `al.StateGraph` 로 만든 그래프를 **실제 `langgraph` 패키지**로 다시 만듭니다. 메서드 이름이 같습니다.
#
# 1. `TypedDict` 상태 + 카운터 루프 2. `add_messages` · `ToolNode` · `tools_condition` 도구 에이전트
# 3. `MemorySaver` + `thread_id` 체크포인트 4. `interrupt_before` 로 승인(Human-in-the-loop) 5. 계획-실행-반성 그래프 6. 그래프 그림

# %% [markdown]
# ## 0. 설치와 API 키

# %%
!pip install -q langgraph langchain-core langchain-google-genai

# %%
import os
from google.colab import userdata

os.environ['GOOGLE_API_KEY'] = userdata.get('GEMINI_API_KEY')
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0)
print(llm.invoke('준비됐으면 OK 라고만 답해').content)

# %% [markdown]
# ## 1. 상태 · 노드 · 엣지 · 조건부 엣지 — 카운터 루프
# `agentlab` 과 다른 점은 `StateGraph(State)` 에 **TypedDict** 를 넘기는 것뿐입니다.

# %%
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class CounterState(TypedDict):
    count: int
    logs: list

def work(state: CounterState):
    n = state['count'] + 1
    return {'count': n, 'logs': state['logs'] + [f'작업 {n}회']}     # 리듀서가 없으면 직접 이어 붙인다

def enough(state: CounterState):
    return 'done' if state['count'] >= 3 else 'again'

g = StateGraph(CounterState)
g.add_node('work', work)
g.add_edge(START, 'work')
g.add_conditional_edges('work', enough, {'again': 'work', 'done': END})
counter = g.compile()
for event in counter.stream({'count': 0, 'logs': []}):
    print(event)
print('최종:', counter.invoke({'count': 0, 'logs': []}))

# %%
# 그래프 그림 (mermaid.ink 네트워크 필요 — 안 되면 print(counter.get_graph().draw_ascii()))
from IPython.display import Image, display
display(Image(counter.get_graph().draw_mermaid_png()))

# %% [markdown]
# ## 2. 도구 에이전트 그래프: call_llm ⇄ tools
# `Annotated[list, add_messages]` 가 "s 로 끝나는 리스트 키는 이어 붙인다"는 `agentlab` 규칙에 해당합니다.
# `ToolNode` 는 브라우저의 `call_tools`, `tools_condition` 은 라우터 `route` 와 같습니다.

# %%
from typing import Annotated
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool

@tool
def calculator(expression: str) -> str:
    """수식을 계산한다. 예: '1500 * 0.15'"""
    return str(eval(expression, {'__builtins__': {}}, {}))

@tool
def get_weather(city: str) -> str:
    """도시의 현재 날씨를 알려준다 (수업용 예시 데이터)"""
    sample = {'서울': '맑음 18°C', '부산': '구름 조금 21°C', '제주': '비 22°C'}
    return sample.get(city, f'{city} 의 날씨 정보가 없습니다')

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

tools = [calculator, get_weather]
llm_with_tools = llm.bind_tools(tools)

def call_llm(state: AgentState):
    return {'messages': [llm_with_tools.invoke(state['messages'])]}

g = StateGraph(AgentState)
g.add_node('call_llm', call_llm)
g.add_node('tools', ToolNode(tools))
g.add_edge(START, 'call_llm')
g.add_conditional_edges('call_llm', tools_condition)      # tool_calls 있으면 'tools', 없으면 END
g.add_edge('tools', 'call_llm')
agent = g.compile()

for event in agent.stream({'messages': [('user', '부산 날씨 알려주고 1500 * 0.15 도 계산해 줘')]}):
    for node, update in event.items():
        m = update['messages'][-1]
        print(f'▶ {node:<9} {type(m).__name__:<12} {m.content or m.tool_calls}')

# %%
display(Image(agent.get_graph().draw_mermaid_png()))

# %% [markdown] teacher
# 그림에서 `tools → call_llm` 화살표(루프)와 `call_llm → END` 점선(분기)을 짚어 주세요. 브라우저 예제 8-7 과 노드 이름이 같습니다.

# %% [markdown]
# ## 3. 체크포인트: MemorySaver + thread_id 로 대화 이어가기

# %%
from langgraph.checkpoint.memory import MemorySaver

agent_with_memory = g.compile(checkpointer=MemorySaver())
u1 = {'configurable': {'thread_id': 'u1'}}
print(agent_with_memory.invoke({'messages': [('user', '내 이름은 영준이야')]}, u1)['messages'][-1].content)
print(agent_with_memory.invoke({'messages': [('user', '내 이름이 뭐지?')]}, u1)['messages'][-1].content)     # 기억한다
print(agent_with_memory.invoke({'messages': [('user', '내 이름이 뭐지?')]}, {'configurable': {'thread_id': 'u2'}})['messages'][-1].content)
print('u1 메시지 수:', len(agent_with_memory.get_state(u1).values['messages']))

# %% [markdown]
# ## 4. Human-in-the-loop: interrupt_before 로 멈췄다가 재개

# %%
class ApprovalState(TypedDict):
    request: str
    action: str
    result: str

def propose(state: ApprovalState):
    return {'action': f"'{state['request']}' 를 위해 고객 120명에게 이메일 발송"}

def execute(state: ApprovalState):
    print('✅ 실행:', state['action'])
    return {'result': 'sent'}

g2 = StateGraph(ApprovalState)
g2.add_node('propose', propose).add_node('execute', execute)
g2.add_edge(START, 'propose').add_edge('propose', 'execute').add_edge('execute', END)
approval = g2.compile(checkpointer=MemorySaver(), interrupt_before=['execute'])   # execute 직전에 멈춘다

cfg = {'configurable': {'thread_id': 'order-1'}}
approval.invoke({'request': '신제품 홍보'}, cfg)
snap = approval.get_state(cfg)
print('👤 승인 요청:', snap.values['action'])
print('다음 노드:', snap.next)                 # ('execute',) — 아직 실행 전

# %%
# 사람이 확인한 뒤 … 재개 (입력 None = 멈춘 곳부터)
approval.invoke(None, cfg)
print('결과:', approval.get_state(cfg).values['result'])

# %% [markdown] teacher
# 승인 대신 **거부**하려면 `approval.update_state(cfg, {'action': '고객 30명에게만 발송'})` 으로 상태를 고친 뒤 재개하거나,
# 재개하지 않고 그대로 두면 됩니다. "되돌리기 어려운 행동 앞에는 반드시 사람" — 13차시 안전과 연결.

# %% [markdown]
# ## 5. 계획-실행-반성 그래프 (06차시를 그래프로)

# %%
import json
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate

plan_chain = PromptTemplate.from_template('목표: {goal}\n이 목표를 3단계 이내로 나누어 JSON {{"steps": ["1단계", "2단계"]}} 로만 답해라.') | llm | JsonOutputParser()
do_chain = PromptTemplate.from_template('다음 작업을 수행해 세 문장 이내로 결과를 써라: {step}') | llm | StrOutputParser()
score_chain = PromptTemplate.from_template('근거 · 구체성 기준으로 10점 만점 평가. JSON {{"score": 숫자, "suggestion": "..."}} 로만 답해라.\n\n{text}') | llm | JsonOutputParser()
revise_chain = PromptTemplate.from_template('원문:\n{text}\n\n피드백: {suggestion}\n\n피드백을 반영해 수정본만 써라.') | llm | StrOutputParser()

class PERState(TypedDict):
    goal: str
    steps: list
    idx: int
    results: list
    score: int
    suggestion: str
    rounds: int

def plan(s):     return {'steps': plan_chain.invoke({'goal': s['goal']})['steps'], 'idx': 0, 'results': [], 'rounds': 0}
def execute(s):  return {'results': s['results'] + [do_chain.invoke({'step': s['steps'][s['idx']]})], 'idx': s['idx'] + 1}
def reflect(s):
    ev = score_chain.invoke({'text': s['results'][-1]})
    print(f'  📊 평가 {s["rounds"] + 1}: {ev["score"]}점')
    return {'score': ev['score'], 'suggestion': ev.get('suggestion', ''), 'rounds': s['rounds'] + 1}
def revise(s):   return {'results': s['results'] + [revise_chain.invoke({'text': s['results'][-1], 'suggestion': s['suggestion']})]}

g3 = StateGraph(PERState)
for name, fn in [('plan', plan), ('execute', execute), ('reflect', reflect), ('revise', revise)]:
    g3.add_node(name, fn)
g3.add_edge(START, 'plan').add_edge('plan', 'execute').add_edge('revise', 'reflect')
g3.add_conditional_edges('execute', lambda s: 'more' if s['idx'] < len(s['steps']) else 'reflect', {'more': 'execute', 'reflect': 'reflect'})
g3.add_conditional_edges('reflect', lambda s: 'done' if s['score'] >= 8 or s['rounds'] >= 2 else 'revise', {'revise': 'revise', 'done': END})
per = g3.compile()
path = [list(e)[0] for e in per.stream({'goal': '전기차 시장 조사 보고서 만들기'}, {'recursion_limit': 30})]
print('경로:', ' → '.join(path))

# %% [markdown]
# ## 6. 한 줄 버전: create_react_agent (2번 그래프와 같다)

# %%
from langgraph.prebuilt import create_react_agent
quick = create_react_agent(llm, tools, checkpointer=MemorySaver())
print(quick.invoke({'messages': [('user', '제주 날씨 알려줘')]}, {'configurable': {'thread_id': 'q1'}})['messages'][-1].content)

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 100 이 넘을 때까지 두 배로
# `value` 를 두 배로 만드는 노드와 `value >= 100` 이면 `'done'` 인 라우터로 루프 그래프를 만들어 `{'value': 3}` 으로 실행하세요.

# %%
class DoubleState(TypedDict):
    value: int
# BEGIN SOLUTION
g4 = StateGraph(DoubleState)
g4.add_node('double', lambda s: {'value': s['value'] * 2})
g4.add_edge(START, 'double')
g4.add_conditional_edges('double', lambda s: 'done' if s['value'] >= 100 else 'again', {'again': 'double', 'done': END})
print(g4.compile().invoke({'value': 3}))
# END SOLUTION

# %% [markdown]
# ### 문제 2. 도구 에이전트에 도구 추가
# 현재 시각을 돌려주는 `now()` 도구를 추가해 2번 그래프를 다시 만들고 "지금 몇 시야?" 를 물어보세요. 그래프 코드는 `tools` 목록 외에 바꿀 것이 없습니다.

# %%
import datetime

@tool
def now() -> str:
    """현재 날짜와 시각을 알려준다"""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
# BEGIN SOLUTION
tools2 = [calculator, get_weather, now]
llm2 = llm.bind_tools(tools2)
g5 = StateGraph(AgentState)
g5.add_node('call_llm', lambda s: {'messages': [llm2.invoke(s['messages'])]})
g5.add_node('tools', ToolNode(tools2))
g5.add_edge(START, 'call_llm')
g5.add_conditional_edges('call_llm', tools_condition)
g5.add_edge('tools', 'call_llm')
print(g5.compile().invoke({'messages': [('user', '지금 몇 시야?')]})['messages'][-1].content)
# END SOLUTION

# %% [markdown]
# ### 문제 3. (도전) 승인 거부 시 다시 제안
# 4번 그래프에 `approve` 노드를 넣어, 규모(`scale`, 처음 120)가 30 이하가 될 때까지 절반으로 줄여 다시 제안하는 루프를 만드세요
# (`interrupt` 없이 상태의 조건으로 승인 여부를 정합니다). 지나간 노드 경로를 출력하세요.

# %%
class ScaleState(TypedDict):
    scale: int
    action: str
    approved: bool
# BEGIN SOLUTION
def propose2(s):
    scale = s['scale'] // 2 if s.get('action') else s['scale']
    return {'scale': scale, 'action': f'고객 {scale}명에게 이메일 발송'}
def approve2(s):
    print('👤 승인 요청:', s['action'])
    return {'approved': s['scale'] <= 30}
g6 = StateGraph(ScaleState)
g6.add_node('propose', propose2).add_node('approve', approve2).add_node('execute', lambda s: print('✅ 실행:', s['action']) or {})
g6.add_edge(START, 'propose').add_edge('propose', 'approve').add_edge('execute', END)
g6.add_conditional_edges('approve', lambda s: 'yes' if s['approved'] else 'no', {'yes': 'execute', 'no': 'propose'})
print('경로:', [list(e)[0] for e in g6.compile().stream({'scale': 120})])
# END SOLUTION

# %% [markdown]
# ---
# ## 📝 정리
# - `StateGraph(TypedDict)` · `add_node` · `add_edge` · `add_conditional_edges` · `compile` · `invoke` / `stream` — 브라우저와 같은 이름.
# - `Annotated[list, add_messages]` 리듀서, `ToolNode`, `tools_condition` 으로 도구 에이전트 그래프.
# - `MemorySaver` + `thread_id` 로 대화를 이어가고, `interrupt_before` 로 사람의 승인을 받는다.
# - 다음 차시: 역할 팀으로 일하는 CrewAI.
