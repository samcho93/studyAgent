# %% [markdown]
# # 00. 시작하기 — 실습 환경 준비와 API 키 설정
#
# 이 노트북에서는 Colab 실습 환경을 준비하고, **API 키를 안전하게(Secrets)** 넣은 뒤 실제 LLM 에 첫 요청을 보내 봅니다.
#
# **SDK 설치 → Secrets 에 키 등록 → 첫 호출 → 토큰 사용량 확인 → 두 공급자 비교**
#
# 키가 아직 없어도 괜찮습니다. 마지막의 "모의 호출" 셀로 흐름만 확인할 수 있습니다.

# %% [markdown]
# ## 0. Colab 기초 익히기
# 코드 셀을 선택하고 **Shift + Enter** 를 누르면 실행됩니다. 아래 셀을 실행해 보세요.

# %%
print("안녕하세요, AI 에이전트 수업입니다!")
import sys
print("파이썬 버전:", sys.version.split()[0])

# %% [markdown]
# ## 1. SDK 설치
# 브라우저 실습(agentlab)과 달리 Colab 에서는 공급자의 **공식 SDK** 를 pip 로 설치해 씁니다.
# - `google-genai` : Google Gemini
# - `openai` : OpenAI 와 OpenAI 호환 API(Groq · OpenRouter · Ollama)

# %%
!pip -q install google-genai openai

# %% [markdown]
# ## 2. API 키를 Secrets 에 넣기 (코드에 절대 쓰지 않기!)
#
# 1. 왼쪽 세로 메뉴의 **🔑 보안 비밀(Secrets)** 을 엽니다.
# 2. **+ 새 보안 비밀 추가** → 이름 `GEMINI_API_KEY`, 값에 발급받은 키를 붙여 넣습니다.
# 3. **노트북 액세스** 스위치를 켭니다.
# 4. (선택) `GROQ_API_KEY`, `OPENROUTER_API_KEY` 도 같은 방법으로 추가합니다.
#
# 키 발급: Gemini 는 [Google AI Studio](https://aistudio.google.com/) → Get API key,
# Groq 는 [console.groq.com](https://console.groq.com/) → API Keys, OpenRouter 는 [openrouter.ai](https://openrouter.ai/) → Keys.
#
# > ⚠️ 키 값을 `print()` 하거나 코드 셀에 직접 적지 마세요. 노트북을 공유하면 키도 함께 새어 나갑니다.

# %%
from google.colab import userdata

def has_key(name):
    """키가 설정되어 있는지만 확인한다 (값은 출력하지 않는다)"""
    try:
        v = userdata.get(name)
        return bool(v)
    except Exception:
        return False

for name in ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY"]:
    print(f"{name:<20}", "설정됨 ✅" if has_key(name) else "없음")

# %% [markdown]
# ## 3. 첫 호출 — Gemini
# `userdata.get()` 으로 읽은 키를 SDK 에 넘깁니다. 코드 어디에도 키 값은 보이지 않습니다.

# %%
from google import genai

client = genai.Client(api_key=userdata.get("GEMINI_API_KEY"))
resp = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="AI 에이전트가 무엇인지 한 문장으로 설명해줘",
)
print(resp.text)

# %% [markdown]
# ## 4. 토큰 사용량 확인
# 모든 공급자는 응답에 **입력 토큰 · 출력 토큰** 수를 함께 돌려줍니다. 유료 등급은 이 수로 요금을 매깁니다.

# %%
u = resp.usage_metadata
print("입력 토큰:", u.prompt_token_count)
print("출력 토큰:", u.candidates_token_count)
print("합계     :", u.total_token_count)

# 예시 단가 (100만 토큰당 달러, 설명용 대략값)
PRICE_IN, PRICE_OUT = 0.30, 2.50
cost = u.prompt_token_count / 1e6 * PRICE_IN + u.candidates_token_count / 1e6 * PRICE_OUT
print(f"추정 비용: {cost:.6f} 달러")

# %% [markdown]
# ## 5. 시스템 프롬프트(역할) 주기
# 같은 질문도 역할을 주면 답이 달라집니다. 브라우저 실습(예제 0-4)과 비교해 보세요.

# %%
from google.genai import types

for role in ["친절한 조교", "컴퓨터공학과 교수"]:
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="에이전트가 뭐야?",
        config=types.GenerateContentConfig(system_instruction=f"당신은 {role}입니다. 두 문장 이내로 답합니다."),
    )
    print(f"[{role}] {resp.text}\n")

# %% [markdown]
# ## 6. OpenAI 호환 API — Groq
# Groq · OpenRouter · Ollama · OpenAI 는 모두 **같은 형식**(OpenAI 호환)을 씁니다. `base_url` 과 모델 이름만 다릅니다.
# Groq 키가 없으면 이 셀은 건너뛰어도 됩니다.

# %%
from openai import OpenAI

if has_key("GROQ_API_KEY"):
    groq = OpenAI(api_key=userdata.get("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
    r = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "AI 에이전트가 무엇인지 한 문장으로 설명해줘"}],
    )
    print(r.choices[0].message.content)
    print("토큰:", r.usage.prompt_tokens, r.usage.completion_tokens)
else:
    print("GROQ_API_KEY 가 없어 건너뜁니다. (Secrets 에 추가하면 실행됩니다)")

# %% [markdown]
# ## 7. 요청 한도(429) 체험
# 무료 등급은 **분당 요청 수(RPM)** 에 제한이 있습니다. 짧은 간격으로 여러 번 부르면 `429` 오류가 날 수 있습니다.
# 아래 셀은 5번만 호출하므로 보통은 괜찮지만, 오류가 나면 메시지를 읽고 잠시 기다렸다가 다시 실행해 보세요.

# %%
import time

ok, failed = 0, 0
for i in range(5):
    try:
        client.models.generate_content(model="gemini-2.5-flash", contents=f"{i} 더하기 1 은?")
        ok += 1
    except Exception as e:
        failed += 1
        print(f"{i}번째 실패:", str(e)[:120])
        time.sleep(5)
print(f"성공 {ok} / 실패 {failed}")

# %% [markdown] teacher
# 30명이 각자 키를 쓰면 보통 문제없지만, 교실 공용 키 하나를 쓰면 이 셀에서 바로 429 가 납니다.
# "왜 공용 키가 안 되는지" 를 이 셀로 체험시키면 키를 각자 발급받는 이유가 분명해집니다.

# %% [markdown]
# ## 8. 키가 없을 때: 모의 호출
# 브라우저 실습의 모의 LLM 처럼, 키 없이도 코드 흐름을 확인할 수 있는 작은 함수입니다.
# (실제 모델 대신 규칙으로 답합니다)

# %%
def mock_generate(prompt):
    if "에이전트" in prompt:
        return "AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다."
    return f'"{prompt}" 에 대한 모의 답변입니다.'

print(mock_generate("AI 에이전트가 뭐야?"))
print(mock_generate("안녕"))

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 두 공급자 비교
# 같은 질문 `"에이전트와 챗봇의 차이를 두 문장으로 설명해줘"` 를 Gemini 와 Groq(또는 OpenRouter) 에 보내고,
# 답과 **합계 토큰 수**를 나란히 출력하세요. (키가 하나뿐이면 같은 공급자의 모델 두 개를 비교해도 됩니다)

# %%
question = "에이전트와 챗봇의 차이를 두 문장으로 설명해줘"
# BEGIN SOLUTION
r1 = client.models.generate_content(model="gemini-2.5-flash", contents=question)
print("[Gemini]", r1.text)
print("토큰:", r1.usage_metadata.total_token_count)
if has_key("GROQ_API_KEY"):
    r2 = groq.chat.completions.create(model="llama-3.3-70b-versatile", messages=[{"role": "user", "content": question}])
    print("[Groq]", r2.choices[0].message.content)
    print("토큰:", r2.usage.total_tokens)
# END SOLUTION

# %% [markdown]
# ### 문제 2. 키 유출 검사기
# 문자열에 `AIza…`, `sk-…`, `gsk_…` 로 시작하는 키 패턴이 있으면 `True` 를 돌려주는 `has_secret(code)` 함수를 만들고, 아래 샘플로 검사하세요.

# %%
import re

def has_secret(code):
    # BEGIN SOLUTION
    pattern = r"(AIza[0-9A-Za-z_\-]{20,}|sk-[0-9A-Za-z_\-]{20,}|gsk_[0-9A-Za-z]{20,})"
    return re.search(pattern, code) is not None
    # END SOLUTION

samples = [
    "client = genai.Client(api_key=userdata.get('GEMINI_API_KEY'))",
    "client = genai.Client(api_key='AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')",
    "OpenAI(api_key='sk-proj-abcdefghijklmnopqrstuvwxyz0123456789')",
]
for s in samples:
    print("🚨 유출 의심" if has_secret(s) else "✅ 안전     ", "|", s[:55])

# %% [markdown]
# ### 문제 3. 사용량 계산기
# 질문 3개를 차례로 보내고, **누적 입력 · 출력 토큰**과 예시 단가(입력 0.30 · 출력 2.50 달러/100만 토큰)로 추정 비용을 출력하세요.

# %%
questions = ["안녕하세요", "에이전트가 뭐야?", "주말 계획을 세워줘"]
total_in, total_out = 0, 0
# BEGIN SOLUTION
for q in questions:
    r = client.models.generate_content(model="gemini-2.5-flash", contents=q)
    total_in += r.usage_metadata.prompt_token_count
    total_out += r.usage_metadata.candidates_token_count
cost = total_in / 1e6 * 0.30 + total_out / 1e6 * 2.50
print("입력:", total_in, "출력:", total_out, f"추정 비용: {cost:.6f} 달러")
# END SOLUTION

# %% [markdown] teacher
# 문제 3 에서 출력 토큰이 입력보다 훨씬 많이 나옵니다("주말 계획" 은 길게 답합니다).
# "출력 단가가 더 비싼데 출력이 더 많다" → max_tokens 로 길이를 제한하는 이유(02차시)를 미리 짚어 주세요.

# %% [markdown]
# ---
# ## 📝 정리
# - SDK 는 `pip install google-genai openai` 로 설치한다.
# - 키는 **Colab Secrets** 에 넣고 `userdata.get()` 으로 읽는다. 코드 · 출력 · 공유 문서에는 절대 넣지 않는다.
# - 응답에는 토큰 사용량이 함께 오고, 유료 등급은 토큰 수로 과금한다.
# - 무료 등급은 분당 요청 한도가 있어 넘기면 429 가 난다 → 잠시 기다렸다 재시도.
# - OpenAI 호환 API(Groq · OpenRouter · Ollama · OpenAI)는 `base_url` 과 모델 이름만 다르다.
