# %% [markdown]
# # 07. LangChain 기초 — 프롬프트 · 체인 · 도구 (실제 LangChain)
#
# 브라우저에서 `agentlab` 의 미니 LangChain 으로 체험한 것을 **실제 `langchain` 패키지**로 다시 만듭니다.
# 이름이 같으므로 `import` 줄만 바꾸면 거의 그대로 동작합니다.
#
# 1. LCEL 체인 (`prompt | llm | parser`) 2. `@tool` + `bind_tools` 3. `create_react_agent` 도구 에이전트
# 4. `RunnableWithMessageHistory` 메모리 5. `RunnableParallel` 병렬 분석 6. 공급자 바꾸기 (Gemini → Groq)

# %% [markdown]
# ## 0. 설치와 API 키
# Secrets 에 `GEMINI_API_KEY` (필수), `GROQ_API_KEY` (선택) 를 넣어 두세요.

# %%
!pip install -q langchain langchain-core langchain-google-genai langchain-groq langgraph

# %%
import os
from google.colab import userdata

os.environ['GOOGLE_API_KEY'] = userdata.get('GEMINI_API_KEY')      # langchain-google-genai 는 GOOGLE_API_KEY 를 읽는다
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0)
print(llm.invoke('한 줄로 자기소개').content)

# %% [markdown]
# ## 1. LCEL 체인: prompt | llm | parser
# `agentlab` 과 비교: `al.PromptTemplate` → `PromptTemplate`, `al.StrOutputParser` → `StrOutputParser`.

# %%
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

prompt = PromptTemplate.from_template('{text} 를 {lang} 로 번역해 줘. 번역문만 출력.')
chain = prompt | llm | StrOutputParser()
print(chain.invoke({'text': '안녕하세요', 'lang': '영어'}))
print(chain.batch([{'text': '좋은 아침', 'lang': '일본어'}, {'text': '감사합니다', 'lang': '중국어'}]))

# %%
# 프롬프트 템플릿은 메시지를 만들 뿐, LLM 을 부르지 않는다
chat_prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 친절한 과학 선생님입니다.'),
    ('user', '{question}'),
])
print(chat_prompt.invoke({'question': '에이전트가 뭐야?'}).to_messages())

# %%
teacher_chain = chat_prompt | llm | StrOutputParser()
print(teacher_chain.invoke({'question': '에이전트가 뭐야? 두 문장으로.'}))

# %% [markdown]
# ## 2. JsonOutputParser 로 구조화 출력

# %%
sentiment_prompt = PromptTemplate.from_template(
    '다음 리뷰의 감성을 분석해 JSON {{"sentiment": "positive|negative|neutral", "confidence": 0~1}} 로만 답해 줘.\n리뷰: {review}')
sentiment_chain = sentiment_prompt | llm | JsonOutputParser()
for r in sentiment_chain.batch([{'review': '배송이 빠르고 품질이 좋아요'}, {'review': '소리가 끊겨서 실망했어요'}]):
    print(r)

# %% [markdown]
# ## 3. RunnableLambda · RunnableParallel

# %%
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough

summarize = PromptTemplate.from_template('다음 글을 한 줄로 요약: {text}') | llm | StrOutputParser()
translate = PromptTemplate.from_template('{text} 를 영어로 번역해 줘. 번역문만.') | llm | StrOutputParser()
count = RunnableLambda(lambda x: len(x['text']))

parallel = RunnableParallel(summary=summarize, translation=translate, chars=count)
out = parallel.invoke({'text': '에이전트는 도구를 호출한다. 결과를 관찰한다. 다음 행동을 정한다.'})
for k, v in out.items():
    print(f'{k:<12}: {v}')

# %% [markdown] teacher
# `RunnableParallel` 은 항목을 실제로 **스레드 병렬**로 호출합니다. `%%time` 으로 순차 호출과 비교해 보여 주면 효과적입니다.

# %% [markdown]
# ## 4. @tool + bind_tools: 도구를 모델에 알리기 (실행은 하지 않는다)

# %%
from langchain_core.tools import tool

@tool
def add(a: int, b: int) -> int:
    """두 수를 더한다"""
    return a + b

@tool
def get_weather(city: str) -> str:
    """도시의 현재 날씨를 알려준다 (수업용 예시 데이터)"""
    sample = {'서울': '맑음 18°C', '부산': '구름 조금 21°C', '제주': '비 22°C'}
    return sample.get(city, f'{city} 의 날씨 정보가 없습니다')

print(add.name, '|', add.description, '|', add.args)
llm_with_tools = llm.bind_tools([add, get_weather])
msg = llm_with_tools.invoke('3 더하기 4는?')
print('content   :', repr(msg.content))
print('tool_calls:', msg.tool_calls)          # 실행이 아니라 "호출 요청"

# %% [markdown]
# ## 5. create_react_agent: 루프 돌리기 (호출 → 실행 → 결과 전달 → 답)

# %%
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(llm, [add, get_weather])
result = agent.invoke({'messages': [('user', '부산 날씨 알려주고, 3 더하기 4도 계산해 줘')]})
for m in result['messages']:
    print(f'{type(m).__name__:<13} | {m.content or getattr(m, "tool_calls", "")}')

# %% [markdown]
# ## 6. 메모리: RunnableWithMessageHistory

# %%
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

memory_prompt = ChatPromptTemplate.from_messages([
    ('system', '당신은 비서입니다.'),
    MessagesPlaceholder('history'),
    ('user', '{input}'),
])
store = {}
def get_history(session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

chat_with_history = RunnableWithMessageHistory(memory_prompt | llm | StrOutputParser(), get_history,
                                               input_messages_key='input', history_messages_key='history')
u1 = {'configurable': {'session_id': 'u1'}}
print(chat_with_history.invoke({'input': '내 이름은 영준이야'}, config=u1))
print(chat_with_history.invoke({'input': '내 이름이 뭐지?'}, config=u1))
print(chat_with_history.invoke({'input': '내 이름이 뭐지?'}, config={'configurable': {'session_id': 'u2'}}))

# %% [markdown]
# ## 7. 공급자 바꾸기: Gemini → Groq (체인 코드는 그대로)
# `GROQ_API_KEY` 가 없으면 이 셀은 건너뛰세요.

# %%
try:
    os.environ['GROQ_API_KEY'] = userdata.get('GROQ_API_KEY')
    from langchain_groq import ChatGroq
    groq = ChatGroq(model='llama-3.3-70b-versatile', temperature=0)
    chain2 = prompt | groq | StrOutputParser()          # llm 자리만 바꿨다
    print(chain2.invoke({'text': '안녕하세요', 'lang': '영어'}))
except Exception as e:
    print('Groq 키가 없거나 오류:', str(e)[:80])

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 정보 추출 체인
# 문장에서 이름 · 이메일 · 전화번호를 JSON 으로 뽑는 체인을 만들고 두 문장을 `batch` 로 처리하세요.

# %%
texts = ['저는 김영준입니다. 연락은 yj.kim@example.com 또는 010-1234-5678 로 주세요.',
         '담당자는 박지민 씨이고 이메일은 jimin@school.kr 입니다.']
# BEGIN SOLUTION
extract = (PromptTemplate.from_template('다음 문장에서 이름, 이메일, 전화번호를 추출해 JSON {{"name": ..., "email": ..., "phone": ...}} 으로만 답하라. 없으면 null.\n문장: {text}')
           | llm | JsonOutputParser())
for r in extract.batch([{'text': t} for t in texts]):
    print(r)
# END SOLUTION

# %% [markdown]
# ### 문제 2. 분기(라우팅) 체인
# 입력에 영문자가 있으면 한국어로, 없으면 영어로 번역하는 라우터를 `RunnableLambda` 로 만들어 세 문장을 처리하세요.

# %%
to_ko = PromptTemplate.from_template('{text} 를 한국어로 번역해 줘. 번역문만.') | llm | StrOutputParser()
to_en = PromptTemplate.from_template('{text} 를 영어로 번역해 줘. 번역문만.') | llm | StrOutputParser()
# BEGIN SOLUTION
def route(x):
    has_en = any(c.isalpha() and c.isascii() for c in x['text'])
    return (to_ko if has_en else to_en).invoke(x)

router_chain = RunnableLambda(lambda x: {'text': x['text'].strip()}) | RunnableLambda(route)
for t, r in zip(['  hello  ', '안녕하세요', 'good morning'], router_chain.batch([{'text': t} for t in ['  hello  ', '안녕하세요', 'good morning']])):
    print(repr(t), '→', r)
# END SOLUTION

# %% [markdown]
# ### 문제 3. 도구 에이전트에 도구 추가
# 현재 시각을 돌려주는 `now()` 도구를 `@tool` 로 만들어 `create_react_agent` 에 추가하고 "지금 몇 시야?" 를 물어보세요.

# %%
import datetime
# BEGIN SOLUTION
@tool
def now() -> str:
    """현재 날짜와 시각을 알려준다"""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

agent2 = create_react_agent(llm, [add, get_weather, now])
print(agent2.invoke({'messages': [('user', '지금 몇 시야?')]})['messages'][-1].content)
# END SOLUTION

# %% [markdown] teacher
# `create_react_agent` 의 결과 `messages` 를 모두 출력하게 해서 HumanMessage → AIMessage(tool_calls) → ToolMessage → AIMessage 순서를
# 04차시 루프와 대응시키는 활동이 효과적입니다. 08차시에서 이 루프를 그래프로 직접 만듭니다.

# %% [markdown]
# ---
# ## 📝 정리
# - LCEL: `prompt | llm | parser`, `invoke` / `batch`. `agentlab` 과 이름이 같다.
# - `@tool` → 스키마, `bind_tools` → 호출 요청만, `create_react_agent` → 루프.
# - `RunnableWithMessageHistory` 로 세션별 기록을 끼워 넣는다.
# - 공급자(Gemini · Groq)를 바꿔도 체인 코드는 그대로.
