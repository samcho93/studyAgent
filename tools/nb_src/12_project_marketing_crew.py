# %% [markdown]
# # 12. 프로젝트 ②: 마케팅 자동화 에이전트 팀 — 실제 CrewAI 로 완성하기
#
# 브라우저의 `al.CrewAgent · al.Task · al.Crew` 를 **진짜 CrewAI** 로 옮깁니다. 검색은 유료 SerperDevTool 대신 **DuckDuckGo(키 불필요)** 를 씁니다.
#
# | 단계 | 내용 | 브라우저 예제 |
# |---|---|---|
# | 1 | DuckDuckGo 검색 도구 단독 테스트 | 12-1 |
# | 2 | 조사원 + 작가 2인 팀 kickoff · `tasks_output` | 12-2 ~ 12-4 |
# | 3 | 편집자 추가 3인 팀 (조사 · 집필 · 검토 · 수정) | 12-6 |
# | 4 | Gemini 판정자 점수 루프 · 순수 파이썬 SEO 체크 | 12-7 ~ 12-8 |
# | 5 | `token_usage` 비용 표 · 사람 승인 셀 | 12-9 ~ 12-10 |
# | ✏️ | 실습 문제 4개 | |
#
# **API 키**: 🔑 Secrets 의 `GEMINI_API_KEY`. 무료 등급은 분당 요청 제한이 있으니 셀을 한 번씩 천천히 실행하세요.

# %% [markdown]
# ## 0. 설치와 키 설정

# %%
!pip install -q crewai crewai-tools duckduckgo-search

# %%
import os
from google.colab import userdata

os.environ["GEMINI_API_KEY"] = userdata.get("GEMINI_API_KEY")

from crewai import Agent, Task, Crew, Process, LLM
llm = LLM(model="gemini/gemini-2.5-flash", api_key=os.environ["GEMINI_API_KEY"], temperature=0.3)
print(llm.call("한 문장으로 자기소개 해줘"))

# %% [markdown]
# ---
# ## 1단계. 검색 도구 단독 테스트
# 📘 브라우저의 `al.wiki_search` 역할. `@tool` 데코레이터로 함수를 CrewAI 도구로 만듭니다.

# %%
from crewai.tools import tool
from duckduckgo_search import DDGS

@tool("web_search")
def web_search(query: str) -> str:
    """키워드로 웹을 검색해 상위 결과 3개의 제목 · 요약 · URL 을 돌려준다 (DuckDuckGo, 키 불필요)"""
    with DDGS() as ddgs:
        hits = list(ddgs.text(query, max_results=3, region="kr-kr"))
    return "\n".join(f"- {h['title']}: {h['body'][:200]} ({h['href']})" for h in hits) or "검색 결과 없음"

print(web_search.run("전기차 배터리 가격 동향"))

# %% [markdown]
# ---
# ## 2단계. 2인 팀 — 조사원과 작가
# 📘 `{topic}` 은 `kickoff(inputs=…)` 에서 치환됩니다. `expected_output` 을 구체적으로 적는 것이 품질의 핵심입니다.

# %%
researcher = Agent(
    role="시장 조사원",
    goal="{topic} 에 대한 정확한 최신 정보를 찾아 핵심을 정리한다",
    backstory="10년차 리서치 애널리스트. 출처 없는 주장은 쓰지 않는다.",
    tools=[web_search], llm=llm, verbose=False)

writer = Agent(
    role="블로그 작가",
    goal="조사 내용을 바탕으로 읽기 쉬운 마케팅 글을 쓴다",
    backstory="IT 블로그 에디터. 짧은 문장과 구체적 사례를 좋아한다.",
    llm=llm, verbose=False)

research = Task(
    description="{topic} 을 웹에서 검색해 핵심 포인트 3가지를 출처와 함께 정리해라",
    expected_output="핵심 포인트 3가지 (각 한 문장 + 출처 URL)", agent=researcher)

write = Task(
    description="조사 결과를 바탕으로 {topic} 블로그 글을 작성해라",
    expected_output='# 제목 한 줄, 도입 2문장, 본문 3단락(핵심 3가지 각 1단락), 결론 1단락. 400~600자. 키워드 "{topic}" 2회 이상. 마크다운.',
    agent=writer, context=[research])

crew = Crew(agents=[researcher, writer], tasks=[research, write], process=Process.sequential, verbose=False)
result = crew.kickoff(inputs={"topic": "전기차"})
print(result.raw)

# %%
# 중간 산출물과 토큰 — 브라우저의 task.output / llm.total_usage 에 해당
for i, out in enumerate(result.tasks_output, 1):
    print(f"--- 작업 {i} [{out.agent}] {len(out.raw)}자")
    print(out.raw[:300])
print("토큰:", result.token_usage)

# %%
with open("blog_전기차.md", "w", encoding="utf-8") as f:
    f.write(result.raw)
with open("research_전기차.md", "w", encoding="utf-8") as f:
    f.write(result.tasks_output[0].raw)
print(open("blog_전기차.md", encoding="utf-8").read()[:200])

# %% [markdown] teacher
# Gemini 무료 등급(분당 요청 제한)에서 429 오류가 나면 1분 기다렸다 다시 실행하게 하세요. `verbose=True` 는 출력이 길어 수업 시간을 잡아먹으므로 시연 때만 켭니다. `result.tasks_output[i].raw` 로 중간 산출물을 보는 습관을 강조하세요(브라우저 예제 12-3).

# %% [markdown]
# ---
# ## 3단계. 편집자 추가 — 3인 팀, 4개 작업
# 📘 수정 작업의 `context` 에 초안(write)과 검토(review)를 **모두** 넣습니다. `output_file` 로 최종 글이 자동 저장됩니다.

# %%
editor = Agent(
    role="편집자",
    goal="글의 문제점을 찾아 구체적인 수정 요청을 한다",
    backstory="출판사 편집장 출신. 근거 없는 문장과 과장 표현을 싫어한다.",
    llm=llm, verbose=False)

review = Task(description="블로그 글을 검토하고 문제점과 수정 요청 3가지를 써라",
              expected_output="문제점과 수정 요청 3가지 (번호 목록, 각 한 문장)", agent=editor, context=[write])
revise = Task(description="편집자의 수정 요청을 모두 반영해 글을 고쳐 써라",
              expected_output="수정된 최종 글 (같은 구조, 400~600자, 마크다운)", agent=writer,
              context=[write, review], output_file="blog_final.md")

crew3 = Crew(agents=[researcher, writer, editor], tasks=[research, write, review, revise], process=Process.sequential)
result3 = crew3.kickoff(inputs={"topic": "전기차"})
print("--- 검토 의견 ---")
print(result3.tasks_output[2].raw)
print("--- 최종 글 ---")
print(result3.raw[:600])
print("토큰:", result3.token_usage)

# %% [markdown]
# ---
# ## 4단계. 자동 검수 — Gemini 판정자 점수 루프 + SEO 체크
# 📘 브라우저의 `al.Reflector.score` 를 직접 구현합니다. **통과 조건(8점)** 과 **최대 횟수(2)** 둘 다 있어야 멈춥니다.

# %%
import json, re

def judge(text, criteria="명확성 · 근거 · 행동 유도"):
    prompt = (f"기준({criteria})에 따라 다음 글을 10점 만점으로 평가해라. "
              'JSON {"score": 숫자, "issues": [...], "suggestion": "..."} 형식으로만 답해라.\n\n' + text)
    raw = llm.call(prompt)
    m = re.search(r"\{[\s\S]*\}", raw)
    return json.loads(m.group(0)) if m else {"score": 0, "issues": [raw[:80]], "suggestion": ""}

def revise_text(text, feedback):
    return llm.call(f"원문:\n{text}\n\n피드백:\n{feedback}\n\n피드백을 모두 반영해 같은 구조로 고쳐 써라. 마크다운으로.")

def seo_check(text, keywords, min_chars=300, max_chars=800):
    body = text.strip()
    kws = [k.strip() for k in keywords.split(",") if k.strip()]
    found = [k for k in kws if k.lower() in body.lower()]
    score = round(60 * len(found) / max(1, len(kws))) + (20 if body.startswith("#") else 0) + (20 if min_chars <= len(body) <= max_chars else 0)
    return {"score": score, "missing": [k for k in kws if k not in found], "chars": len(body)}

text, rounds = result3.raw, 0
while True:
    s, seo = judge(text), seo_check(text, "전기차, 배터리, 충전, 보조금")
    print(f"검수 {rounds}: 품질 {s['score']}/10 · SEO {seo['score']}/100 · 빠진 키워드 {seo['missing']}")
    if (s["score"] >= 8 and seo["score"] >= 80) or rounds >= 2:
        break
    feedback = s["suggestion"] + (" 다음 키워드를 본문에 추가: " + ", ".join(seo["missing"]) if seo["missing"] else "")
    text = revise_text(text, feedback)
    rounds += 1
final_text = text
print("최종 글자 수:", len(final_text))

# %% [markdown]
# ---
# ## 5단계. 비용 표와 사람 승인
# 📘 `result.token_usage` 로 팀 실행 비용을 어림하고, 발행 전에 사람이 `y/n` 으로 승인합니다.

# %%
u = result3.token_usage
PRICE_IN, PRICE_OUT = 0.10, 0.40       # 달러 / 100만 토큰 (공급자 요금표에서 확인)
cost = u.prompt_tokens / 1e6 * PRICE_IN + u.completion_tokens / 1e6 * PRICE_OUT
print(f"3인 팀 1회: 요청 {u.successful_requests}회 · 입력 {u.prompt_tokens} · 출력 {u.completion_tokens} 토큰")
print(f"예상 비용 {cost:.5f} 달러 / 실행 → 1,000회면 {cost * 1000:.2f} 달러")

# %%
print(final_text[:400], "…")
ok = input("이 글을 발행할까요? (y/n): ").strip().lower()
if ok == "y":
    with open("published_blog.md", "w", encoding="utf-8") as f:
        f.write(final_text)
    print("✅ 발행 완료: published_blog.md")
else:
    fb = input("수정 요청을 한 줄로: ")
    final_text = revise_text(final_text, fb)
    print("✏️ 수정본 준비 — 다시 승인 요청하세요")

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 주제 바꿔 재사용
# 2인 팀(`crew`)을 주제 `"파이썬"` 으로 다시 kickoff 하고, 조사 결과 첫 150자와 최종 글의 첫 줄을 출력하세요.

# %%
# BEGIN SOLUTION
r = crew.kickoff(inputs={"topic": "파이썬"})
print(r.tasks_output[0].raw[:150])
print(r.raw.split("\n")[0])
# END SOLUTION

# %% [markdown]
# ### 문제 2. SNS 카피라이터 추가
# `카피라이터` 에이전트와 “최종 글을 100자 이내 SNS 문구 3개로 요약해라” 작업(context=[revise])을 3인 팀에 추가해 5개 작업 팀을 만들고 결과를 출력하세요.

# %%
# BEGIN SOLUTION
copywriter = Agent(role="SNS 카피라이터", goal="긴 글을 짧고 눈에 띄는 문구로 바꾼다",
                   backstory="광고 대행사 10년차. 이모지와 해시태그를 적절히 쓴다.", llm=llm)
sns = Task(description="최종 글을 100자 이내 SNS 문구 3개로 요약해라",
           expected_output="번호 목록 3개, 각 100자 이내, 해시태그 2개 포함", agent=copywriter, context=[revise])
crew5 = Crew(agents=[researcher, writer, editor, copywriter], tasks=[research, write, review, revise, sns])
r5 = crew5.kickoff(inputs={"topic": "전기차"})
print(r5.raw)
# END SOLUTION

# %% [markdown]
# ### 문제 3. SEO 금지어 검사
# `seo_check` 에 금지어(`최고, 무조건, 100%`) 검사를 추가해 포함된 금지어당 10점을 감점(0점 미만 금지)하고, 최종 글을 검사하세요.

# %%
def seo_check2(text, keywords, banned="최고, 무조건, 100%"):
    base = seo_check(text, keywords)
    # BEGIN SOLUTION
    bl = [w.strip() for w in banned.split(",") if w.strip()]
    found = [w for w in bl if w in text]
    base["banned_found"] = found
    base["score"] = max(0, base["score"] - 10 * len(found))
    # END SOLUTION
    return base

print(seo_check2(final_text, "전기차, 배터리, 충전, 보조금"))

# %% [markdown]
# ### 문제 4. 작업별 비용 표
# `result3.tasks_output` 의 각 산출물 글자 수와 `token_usage` 를 이용해, 작업 이름 · 담당 · 글자 수를 표로 출력하고 전체 비용을 함께 보여 주세요. (CrewAI 는 작업별 토큰을 따로 주지 않으므로 글자 수 비율로 토큰을 어림합니다.)

# %%
# BEGIN SOLUTION
outs = result3.tasks_output
total_chars = sum(len(o.raw) for o in outs) or 1
print(f"{'작업':<4}{'담당':<10}{'글자 수':>8}{'토큰(어림)':>10}")
for i, o in enumerate(outs, 1):
    est = round(u.total_tokens * len(o.raw) / total_chars)
    print(f"{i:<4}{o.agent:<10}{len(o.raw):>8}{est:>10}")
print(f"합계 토큰 {u.total_tokens} · 예상 비용 {cost:.5f} 달러")
# END SOLUTION

# %% [markdown] teacher
# 문제 2 에서 5개 작업은 Gemini 무료 등급에서 분당 제한에 걸릴 수 있습니다 — 429 가 나면 1분 뒤 재실행. 문제 4 는 “측정하지 않으면 줄일 수 없다” 를 체감시키는 것이 목적이며, 어림값이라는 점을 분명히 말해 주세요.

# %% [markdown]
# ---
# ## 📝 정리
# - 브라우저 `al.CrewAgent/Task/Crew` ↔ CrewAI `Agent/Task/Crew` — 이름이 거의 같다
# - 검색은 DuckDuckGo `@tool` 로 키 없이, `output_file` 로 자동 저장, `token_usage` 로 비용
# - 자동 검수 = 판정자 점수 + SEO 규칙, **통과 조건 + 최대 횟수**
# - 되돌릴 수 없는 발행 앞에는 사람 승인
# - 다음: 13차시 평가 · 안전 · 배포
