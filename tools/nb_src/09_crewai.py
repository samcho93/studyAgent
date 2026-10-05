# %% [markdown]
# # 09. CrewAI — 역할 분담 에이전트 팀
#
# 브라우저에서 `agentlab` 으로 체험한 **조사원 · 작가 · 편집자 크루**를 실제 CrewAI 로 다시 만듭니다.
#
# **Agent(role · goal · backstory) → Task(description · expected_output · context) → Crew(process).kickoff(inputs)**
#
# 이 노트북은 **crewai 1.x** 기준으로 작성되었습니다 (내부적으로 LiteLLM 을 써서 `gemini/…`, `openai/…`, `groq/…` 모델을 고릅니다).

# %% [markdown]
# ## 0. 설치와 API 키
# 설치에 1~2분 걸립니다. API 키는 Colab 왼쪽 🔑 **Secrets** 에 `GEMINI_API_KEY` 이름으로 넣고 **노트북 접근 허용**을 켜세요.

# %%
!pip -q install crewai

# %%
import crewai, os
from google.colab import userdata

os.environ["GEMINI_API_KEY"] = userdata.get("GEMINI_API_KEY")   # 키를 노트북에 직접 쓰지 않습니다
print("crewai", crewai.__version__)

# %%
from crewai import Agent, Task, Crew, Process, LLM

llm = LLM(model="gemini/gemini-2.5-flash", temperature=0.3)   # 'openai/gpt-4o-mini', 'groq/llama-3.3-70b-versatile' 도 가능
print(llm.call("한 문장으로 자기소개 해줘"))

# %% [markdown]
# ## 1. Agent · Task · Crew — 조사원 → 작가 2인 크루
# 브라우저의 `al.CrewAgent` 가 여기서는 `Agent` 입니다. `verbose=True` 로 각 에이전트의 생각 과정을 볼 수 있습니다.

# %%
researcher = Agent(
    role="시장 조사원",
    goal="{topic}의 최신 동향을 출처와 함께 조사한다",
    backstory="10년 경력의 IT 산업 분석가. 출처 없는 주장은 쓰지 않는다.",
    llm=llm, verbose=True,
)
writer = Agent(
    role="블로그 작가",
    goal="조사 내용을 읽기 쉬운 글로 쓴다",
    backstory="기술 블로그를 5년간 운영했다. 짧은 문장과 구체적인 예시를 좋아한다.",
    llm=llm, verbose=True,
)

t1 = Task(description="{topic} 동향을 조사해라", expected_output="핵심 동향 3가지 (불릿, 각 1~2문장, 출처 포함)", agent=researcher)
t2 = Task(description="{topic}에 대한 블로그 포스트를 작성해라", expected_output="마크다운. 제목 1개, 3문단, 마지막에 한 줄 요약",
          agent=writer, context=[t1])

crew = Crew(agents=[researcher, writer], tasks=[t1, t2], process=Process.sequential, verbose=True)
result = crew.kickoff(inputs={"topic": "AI 에이전트"})
print(result.raw)

# %%
# 중간 결과물과 사용량
print("--- t1.output ---")
print(t1.output.raw[:500])
print()
print("작업 결과 수:", len(result.tasks_output))
print("토큰 사용량:", result.token_usage)

# %% [markdown]
# ### 🤔 생각해 보기
# `t2` 의 글이 `t1` 의 조사 결과를 실제로 참고했나요? `context=[t1]` 을 지우고 다시 실행하면 어떻게 달라질까요?
# (sequential 에서는 바로 앞 작업 결과가 자동 전달되므로 결과가 비슷할 수 있습니다. 순서를 바꾸거나 작업을 하나 더 끼워 보세요.)

# %% [markdown] teacher
# 실제 모델은 호출당 3~10초. 2인 크루는 20~30초, 아래 4작업 크루는 1분 안팎입니다.
# 학생들이 기다리는 동안 verbose 로그의 "Thought / Final Answer" 가 4차시 에이전트 루프와 같은 구조임을 짚어 주세요.

# %% [markdown]
# ## 2. 도구를 가진 에이전트
# `crewai.tools.tool` 데코레이터로 파이썬 함수를 도구로 만듭니다 (4차시 `@al.tool` 과 같은 꼴). 한국어 위키백과 요약 API 를 쓰는 검색 도구입니다.

# %%
import requests
from crewai.tools import tool


@tool("wikipedia_search")
def wikipedia_search(query: str) -> str:
    """한국어 위키백과에서 query 를 검색해 첫 문서의 요약을 돌려준다"""
    s = requests.get("https://ko.wikipedia.org/w/api.php",
                     params={"action": "query", "list": "search", "srsearch": query, "srlimit": 1, "format": "json"}, timeout=10).json()
    hits = s.get("query", {}).get("search") or []
    if not hits:
        return f"'{query}' 검색 결과가 없습니다"
    title = hits[0]["title"]
    page = requests.get("https://ko.wikipedia.org/api/rest_v1/page/summary/" + title.replace(" ", "_"), timeout=10).json()
    return f"[{title}] " + page.get("extract", "")[:800]


print(wikipedia_search.run("LangChain")[:200])

# %%
fact_checker = Agent(
    role="사실 확인 조사원",
    goal="위키백과로 사실을 확인해 {topic}을 정리한다",
    backstory="검색 도구로 확인한 내용만 쓴다. 확인되지 않은 수치는 '확인 필요' 라고 표시한다.",
    tools=[wikipedia_search], llm=llm, verbose=True,
)
t_fact = Task(description="{topic}이 무엇인지 위키백과에서 검색해 정리해라", expected_output="정의 1문단 + 핵심 특징 3가지 + 출처(문서 제목)", agent=fact_checker)
crew2 = Crew(agents=[fact_checker, writer], tasks=[t_fact, t2], process=Process.sequential, verbose=True)
print(crew2.kickoff(inputs={"topic": "LangChain"}).raw)

# %% [markdown]
# ## 3. 3인 크루 — 편집자로 반성 단계 만들기 (조사 → 작성 → 검토 → 수정)

# %%
editor = Agent(
    role="편집자",
    goal="글의 논리와 근거를 검증하고 고칠 점을 구체적으로 짚는다",
    backstory="출판사 교정 10년차. 근거 없는 수치, 긴 문장, 모호한 결론을 반드시 지적한다.",
    llm=llm, verbose=True,
)

r1 = Task(description="{topic} 동향을 조사해라", expected_output="핵심 동향 3가지 (출처 포함)", agent=researcher)
r2 = Task(description="{topic}에 대한 블로그 포스트 초안을 작성해라", expected_output="마크다운, 제목 + 3문단", agent=writer, context=[r1])
r3 = Task(description="초안을 검토하고 문제점과 개선 방향을 지적해라", expected_output="검토 의견 3가지 (각각 문제 → 고칠 방법)", agent=editor, context=[r2])
r4 = Task(description="편집자 의견을 모두 반영해 최종 원고를 완성해라", expected_output="마크다운 최종 원고. 고친 부분은 그대로 반영하고 설명은 붙이지 않는다",
          agent=writer, context=[r2, r3])

crew3 = Crew(agents=[researcher, writer, editor], tasks=[r1, r2, r3, r4], process=Process.sequential, verbose=False)
final = crew3.kickoff(inputs={"topic": "전기차 배터리"})
print("=== 검토 의견 ===")
print(r3.output.raw)
print()
print("=== 최종 원고 ===")
print(final.raw)
print()
print("토큰:", final.token_usage)

# %% [markdown]
# ## 4. hierarchical — 매니저 LLM 이 담당자를 고른다
# 작업에 `agent=` 를 쓰지 않고 `manager_llm` 을 줍니다. 매니저가 작업을 위임하고 결과를 검수하므로 호출이 늘어납니다.

# %%
h1 = Task(description="{topic} 동향을 조사해라", expected_output="핵심 동향 3가지")
h2 = Task(description="{topic}에 대한 블로그 포스트를 작성해라", expected_output="제목 + 3문단", context=[h1])
h3 = Task(description="초안을 검토하고 문제점을 지적해라", expected_output="검토 의견 3가지", context=[h2])

crew_h = Crew(agents=[researcher, writer, editor], tasks=[h1, h2, h3],
              process=Process.hierarchical, manager_llm=llm, verbose=True)
out = crew_h.kickoff(inputs={"topic": "커피"})
print(out.raw)
print("토큰:", out.token_usage)

# %% [markdown] teacher
# hierarchical 의 토큰 사용량이 sequential 의 1.5~3배가 되는 것을 비교시키세요. "그래서 기본은 sequential" 이 결론입니다.
# 매니저가 엉뚱한 담당자를 고르면 각 Agent 의 role · goal 이 서로 뚜렷한지 점검하게 합니다.

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 나만의 3인 크루
# 주제를 하나 정하고(예: "학교 축제 홍보", "제주도 여행"), **서로 다른 전문성**을 가진 에이전트 3명과 작업 3개(조사 → 작성 → 검토)로 크루를 만들어
# `kickoff(inputs=...)` 로 실행하세요. 각 작업에 `expected_output` 을 구체적으로(형식 · 분량 · 구조) 적어야 합니다.

# %%
# BEGIN SOLUTION
guide = Agent(role="여행 전문가", goal="{topic} 여행지의 핵심 정보를 조사한다", backstory="제주 토박이 가이드. 계절별 추천 장소를 잘 안다.", llm=llm)
travel_writer = Agent(role="여행 작가", goal="조사 내용을 여행기 형식의 글로 쓴다", backstory="여행 잡지 기자 출신.", llm=llm)
proof = Agent(role="교정자", goal="사실 오류와 과장 표현을 잡아낸다", backstory="여행 가이드북 교정 전문가.", llm=llm)
p1 = Task(description="{topic} 여행 정보를 조사해라", expected_output="추천 장소 3곳 (이름 · 특징 · 추천 계절)", agent=guide)
p2 = Task(description="{topic} 여행에 대한 블로그 포스트를 작성해라", expected_output="제목 + 3문단 + 준비물 체크리스트 5개", agent=travel_writer, context=[p1])
p3 = Task(description="초안의 사실 오류와 과장 표현을 검토해라", expected_output="문제점 3가지와 수정 제안", agent=proof, context=[p2])
my_crew = Crew(agents=[guide, travel_writer, proof], tasks=[p1, p2, p3], process=Process.sequential)
print(my_crew.kickoff(inputs={"topic": "제주도"}).raw)
# END SOLUTION

# %% [markdown]
# ### 문제 2. expected_output 바꿔 보기
# 문제 1의 작성 작업(`p2`)의 `expected_output` 을 **JSON** 형식(`{"title": ..., "paragraphs": [...], "checklist": [...]}`)으로 바꾸고,
# 결과를 `json.loads` 로 읽어 `title` 만 출력하세요. (코드 울타리가 섞여 오면 2차시처럼 울타리를 벗겨야 합니다)

# %%
import json, re

# BEGIN SOLUTION
p2_json = Task(description="{topic} 여행에 대한 블로그 포스트를 작성해라",
               expected_output='JSON 만 출력. {"title": "제목", "paragraphs": ["문단1", "문단2", "문단3"], "checklist": ["준비물1", ...]}',
               agent=travel_writer, context=[p1])
crew_json = Crew(agents=[guide, travel_writer], tasks=[p1, p2_json], process=Process.sequential)
raw = crew_json.kickoff(inputs={"topic": "제주도"}).raw
m = re.search(r"\{[\s\S]*\}", raw)
data = json.loads(m.group(0) if m else raw)
print("제목:", data["title"])
print("체크리스트:", data["checklist"])
# END SOLUTION

# %% [markdown]
# ### 문제 3. (도전) 번역가 추가하기
# 문제 1의 크루에 **번역가** 에이전트와 "최종 원고를 영어로 번역해라" 작업을 추가하세요. 번역 작업은 검토 의견이 아니라 **초안(p2)** 을 참고해야 합니다 — `context` 를 어떻게 줘야 할까요?

# %%
# BEGIN SOLUTION
translator = Agent(role="번역가", goal="한국어 글을 자연스러운 영어로 옮긴다", backstory="여행 콘텐츠 전문 번역가.", llm=llm)
p4 = Task(description="블로그 포스트를 영어로 번역해라", expected_output="영어 마크다운 (제목 + 3문단)", agent=translator, context=[p2])
crew4 = Crew(agents=[guide, travel_writer, proof, translator], tasks=[p1, p2, p3, p4], process=Process.sequential)
print(crew4.kickoff(inputs={"topic": "제주도"}).raw)
# END SOLUTION

# %% [markdown] teacher
# 문제 3의 핵심은 `context=[p2]` (초안) 입니다. `context=[p3]` (검토 의견)을 주면 번역가가 검토 의견을 번역합니다.
# "context 는 입력, expected_output 은 출력 형식" 을 다시 확인시키세요.

# %% [markdown]
# ## 📘 더 알아보기
# - `Crew(memory=True)`: 크루 전체가 공유하는 단기 · 장기 기억 (5차시)
# - `Agent(allow_delegation=True)`: 에이전트가 다른 에이전트에게 작업을 위임
# - `Task(output_file="post.md")`, `Task(output_pydantic=Model)`: 결과를 파일 · 구조화 객체로
# - **Flows**: 여러 크루를 조건 · 분기로 엮는 상위 워크플로 (8차시 LangGraph 와 비슷한 역할)
# - 문서: https://docs.crewai.com

# %% [markdown]
# ---
# ## 📝 정리
# - `Agent(role, goal, backstory, tools, llm)` 은 시스템 프롬프트, `Task(description, expected_output, context)` 는 사용자 프롬프트가 된다.
# - `Crew(process=Process.sequential)` 이 기본. `hierarchical` 은 `manager_llm` 이 배정하며 호출이 늘어난다.
# - `kickoff(inputs={...})` 로 `{topic}` 을 채워 같은 크루를 재사용한다.
# - 편집자(검토자)를 넣으면 반성 단계가 팀 구조로 보장된다. 호출 수 ≈ 작업 수 × (1 + 도구) + 매니저.
