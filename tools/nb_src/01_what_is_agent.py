# %% [markdown]
# # 01. AI 에이전트란 무엇인가? — 실제 API 로 LLM 단독 vs 에이전트
#
# 브라우저 실습에서는 `agentlab` 의 `al.Agent` 로 에이전트 루프를 체험했습니다.
# 이 노트북에서는 **OpenAI 호환 API 의 function calling** 으로 같은 것을 실제 모델에게 시켜 봅니다.
#
# **도구 없이 질문 → 도구 정의 → 도구 호출 요청 읽기 → 손 루프 → max_steps 실험**
#
# 사용 API: Groq(무료) — `GROQ_API_KEY` 가 없으면 OpenRouter · OpenAI 키로 `BASE_URL` 과 `MODEL` 만 바꾸면 됩니다.

# %%
!pip -q install openai

# %%
import json
from openai import OpenAI
from google.colab import userdata

# Groq (무료). OpenAI 를 쓰려면 base_url 을 빼고 MODEL='gpt-4o-mini'
BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "llama-3.3-70b-versatile"
client = OpenAI(api_key=userdata.get("GROQ_API_KEY"), base_url=BASE_URL)
print("준비 완료:", MODEL)

# %% [markdown]
# ## 1. 도구 없이 질문하기 — LLM 의 한계
# 실제 모델은 "서울 날씨 어때?" 에 뭐라고 답할까요? 실시간 정보가 없다고 하거나, 그럴듯하게 지어낼 수도 있습니다.

# %%
def ask(prompt, system=None):
    msgs = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
    r = client.chat.completions.create(model=MODEL, messages=msgs, temperature=0)
    return r.choices[0].message.content

print(ask("서울 날씨 어때?"))
print("---")
print(ask("1234 * 5678 은?"))

# %% [markdown] teacher
# 두 번째 답(곱셈)이 맞는지 계산기로 확인시키세요. 큰 수 곱셈은 모델이 자주 틀립니다 → 계산기 도구의 필요성.

# %% [markdown]
# ## 2. 도구 정의하기
# 도구는 ① 실제로 실행할 **파이썬 함수**와 ② 모델에게 보여 줄 **스키마(JSON)** 로 이루어집니다.
# 브라우저의 `@al.tool` 은 ②를 자동으로 만들어 주지만, 여기서는 직접 써 봅니다.

# %%
import urllib.request

def calculator(expression: str) -> dict:
    """수식을 계산한다"""
    try:
        return {"expression": expression, "result": eval(expression, {"__builtins__": {}}, {})}
    except Exception as e:
        return {"error": str(e)}                 # 예외를 던지지 않고 오류를 돌려준다

GEO = {"서울": (37.57, 126.98), "부산": (35.18, 129.08), "도쿄": (35.68, 139.69), "뉴욕": (40.71, -74.01)}

def get_weather(city: str) -> dict:
    """도시의 현재 날씨 (Open-Meteo, 키 불필요)"""
    if city not in GEO:
        return {"error": f"{city} 는 모르는 도시입니다. 가능: {list(GEO)}"}
    lat, lon = GEO[city]
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code"
    with urllib.request.urlopen(url, timeout=10) as resp:
        cur = json.load(resp)["current"]
    return {"city": city, "temperature": cur["temperature_2m"], "weather_code": cur["weather_code"]}

print(calculator("1234 * 5678"))
print(get_weather("서울"))

# %%
# 모델에게 보여 줄 스키마 (OpenAI function calling 형식)
TOOLS = [
    {"type": "function", "function": {
        "name": "calculator", "description": "수식을 계산한다",
        "parameters": {"type": "object", "properties": {"expression": {"type": "string", "description": "예: '(3 + 4) * 2'"}}, "required": ["expression"]}}},
    {"type": "function", "function": {
        "name": "get_weather", "description": "도시의 현재 날씨를 알려준다",
        "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "도시 이름(한글). 예: '서울'"}}, "required": ["city"]}}},
]
REGISTRY = {"calculator": calculator, "get_weather": get_weather}

# %% [markdown]
# ## 3. 도구 호출 요청 읽기 — 모델은 실행하지 않는다
# 도구를 주면 모델은 답 대신 **"이 도구를 이 인자로 불러 달라"** 는 요청을 보냅니다. `content` 는 비어 있고 `tool_calls` 가 채워집니다.

# %%
messages = [{"role": "system", "content": "너는 도구를 활용하는 비서다."},
            {"role": "user", "content": "서울 날씨 어때?"}]
r = client.chat.completions.create(model=MODEL, messages=messages, tools=TOOLS, temperature=0)
msg = r.choices[0].message
print("content   :", repr(msg.content))
print("tool_calls:", msg.tool_calls)
tc = msg.tool_calls[0]
print("도구 이름 :", tc.function.name)
print("인자(문자열):", tc.function.arguments)      # JSON 문자열이다!

# %% [markdown]
# ## 4. 실행하고 결과를 돌려주기
# ① 우리가 도구를 실행하고 ② 모델의 요청(assistant)과 ③ 결과(tool)를 **짝으로** 기록에 넣은 뒤 ④ 다시 호출합니다.

# %%
args = json.loads(tc.function.arguments)          # 문자열 → dict
result = REGISTRY[tc.function.name](**args)        # ① 실행
print("도구 결과:", result)

messages.append(msg)                               # ② 요청 기록
messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, ensure_ascii=False)})  # ③ 결과

r2 = client.chat.completions.create(model=MODEL, messages=messages, tools=TOOLS, temperature=0)   # ④ 재호출
print("tool_calls:", r2.choices[0].message.tool_calls)
print("최종 답   :", r2.choices[0].message.content)

# %% [markdown]
# ## 5. 손 루프 — 20줄 에이전트
# 브라우저 예제 1-8 과 구조가 똑같습니다. 다른 점은 `arguments` 가 JSON **문자열**이라 `json.loads` 가 필요하다는 것뿐입니다.

# %%
def run_agent(task, tools=TOOLS, max_steps=5, verbose=True):
    messages = [{"role": "system", "content": "너는 도구를 활용하는 비서다. 도구 결과로만 답한다."},
                {"role": "user", "content": task}]
    calls = 0
    for step in range(1, max_steps + 1):
        r = client.chat.completions.create(model=MODEL, messages=messages, tools=tools, temperature=0)
        calls += 1
        msg = r.choices[0].message
        if not msg.tool_calls:                                  # 도구 요청 없음 → 답
            if verbose:
                print(f"✅ 최종 답 (LLM 호출 {calls}번):", msg.content)
            return msg.content
        messages.append(msg)
        for tc in msg.tool_calls:
            fn = REGISTRY.get(tc.function.name)
            args = json.loads(tc.function.arguments or "{}")
            result = fn(**args) if fn else {"error": f"{tc.function.name} 도구 없음"}
            if verbose:
                print(f"🔧 {step}단계: {tc.function.name}({args}) → 👁 {result}")
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, ensure_ascii=False)})
    return "(단계 초과) 답을 찾지 못했습니다."

run_agent("서울 날씨 어때?")
print("=" * 40)
run_agent("1234 * 5678 은?")
print("=" * 40)
run_agent("에이전트가 뭐야?")       # 도구가 필요 없는 질문

# %% [markdown]
# ## 6. 도구 오류도 관찰이다
# 도구가 `{'error': …}` 를 돌려주면 모델은 그것을 보고 설명하거나 다른 방법을 시도합니다. 루프는 죽지 않습니다.

# %%
run_agent("10 나누기 0 은?")
print("=" * 40)
run_agent("파리 날씨 어때?")        # GEO 에 없는 도시 → error → 모델이 어떻게 대처할까?

# %% [markdown] teacher
# "파리" 는 도구가 모른다고 답하므로 모델이 "서울·부산·도쿄·뉴욕만 가능하다" 고 안내하는 것이 정상입니다.
# 가끔 모델이 다른 도시로 멋대로 바꿔 호출하기도 합니다 → 환각의 한 종류라고 짚어 주세요.

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 도구 추가하기
# 글자 수를 세는 `count_chars(text)` 도구를 만들어 `TOOLS` 와 `REGISTRY` 에 추가하고,
# `"'인공지능 에이전트' 는 몇 글자야?"` 를 `run_agent` 로 실행해 모델이 새 도구를 고르는지 확인하세요.

# %%
def count_chars(text: str) -> dict:
    """문자열의 글자 수를 센다"""
    return {"text": text, "chars": len(text)}

# BEGIN SOLUTION
TOOLS2 = TOOLS + [{"type": "function", "function": {
    "name": "count_chars", "description": "문자열의 글자 수를 센다",
    "parameters": {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}}}]
REGISTRY["count_chars"] = count_chars
run_agent("'인공지능 에이전트' 는 몇 글자야?", tools=TOOLS2)
# END SOLUTION

# %% [markdown]
# ### 문제 2. 두 도구를 함께 쓰는 질문
# `"서울과 도쿄의 기온 차이는 몇 도야?"` 를 실행하고, 모델이 도구를 **몇 번** 호출하는지, LLM 호출은 **몇 번**인지 세어 보세요.

# %%
# BEGIN SOLUTION
run_agent("서울과 도쿄의 기온 차이는 몇 도야?")
# 보통: get_weather 2번(한 번에 두 개를 요청하기도 함) + calculator 1번 → LLM 호출 3~4번
# END SOLUTION

# %% [markdown]
# ### 문제 3. max_steps 실험
# `max_steps=1` 로 `"서울과 도쿄의 기온 차이는 몇 도야?"` 를 실행하면 어떻게 될까요? 결과를 보고 안전장치의 의미를 한 줄로 적어 보세요.

# %%
# BEGIN SOLUTION
print(run_agent("서울과 도쿄의 기온 차이는 몇 도야?", max_steps=1))
# 한 단계 안에 끝내지 못해 "(단계 초과)" 가 나온다. 상한이 없으면 모델이 끝낼 때까지(또는 영원히) 호출이 이어진다.
# END SOLUTION

# %% [markdown] teacher
# 문제 2 는 모델에 따라 get_weather 두 개를 한 번에 요청(병렬 tool_calls)하기도 하고 하나씩 요청하기도 합니다.
# 결과 창의 🔧 줄 수와 "LLM 호출 N번" 을 비교하게 하면 "도구 호출 수 ≠ LLM 호출 수" 가 분명해집니다.

# %% [markdown]
# ---
# ## 📝 정리
# - 도구 = 파이썬 함수 + 모델에게 보여 줄 스키마(JSON).
# - 모델은 도구를 **실행하지 않는다**. `tool_calls` 로 요청만 하고, 실행은 우리 코드가 한다.
# - 요청(assistant)과 결과(tool)를 `tool_call_id` 로 짝지어 기록에 넣고 다시 호출한다.
# - `tool_calls` 가 비면 최종 답 → 루프 종료. `max_steps` 로 무한 루프를 막는다.
# - 도구 오류는 예외 대신 `{'error': …}` 로 돌려주어 모델이 대처하게 한다.
