# %% [markdown]
# # 04. 도구 활용: Tool Calling / Function Calling — 실제 모델의 함수 호출
#
# 브라우저에서는 `agentlab` 이 공급자별 스키마를 숨겨 주었습니다. 이 노트북에서는 **Gemini SDK 의 원본 형식**으로
# 함수 호출을 직접 해 보고, 5단계 루프를 손으로 구현한 뒤, SDK 의 자동 함수 호출과 도구 연쇄를 확인합니다.
#
# **LLM 의 한계 → 스키마 직접 작성 → 호출 요청 꺼내기 → 5단계 루프 → 자동 함수 호출 → 도구 연쇄 → OpenAI 형식 비교**

# %% [markdown]
# ## 0. 설치와 API 키

# %%
!pip -q install google-genai openai requests

# %%
import json
import datetime
import requests
from google import genai
from google.genai import types
from google.colab import userdata

GEMINI_API_KEY = userdata.get('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = 'gemini-2.5-flash'

# %% [markdown]
# ## 1. LLM 혼자서는 못 하는 것
# 시계도 계산기도 없는 모델에게 물어봅니다. 자신만만한 답을 파이썬으로 검산해 보세요.

# %%
for q in ['지금 몇 시야? 모르면 모른다고 해.', '123456 * 654321 은? 숫자만 답해.']:
    r = client.models.generate_content(model=MODEL, contents=q)
    print('👤', q)
    print('🤖', r.text.strip())
print('파이썬 검산:', 123456 * 654321)
print('현재 시각  :', datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))

# %% [markdown]
# ## 2. 도구 함수와 스키마 직접 작성하기
# 브라우저의 `@al.tool` 이 자동으로 만들던 **name · description · parameters** 를 Gemini 형식(`FunctionDeclaration`)으로 직접 적어 봅니다.

# %%
def get_weather(city: str) -> dict:
    """도시의 현재 날씨를 알려준다 (Open-Meteo 무료 API)"""
    g = requests.get('https://geocoding-api.open-meteo.com/v1/search', params={'name': city, 'count': 1, 'language': 'ko'}).json()
    if not g.get('results'):
        return {'error': f"'{city}' 도시를 찾지 못했습니다"}
    lat, lon = g['results'][0]['latitude'], g['results'][0]['longitude']
    d = requests.get('https://api.open-meteo.com/v1/forecast',
                     params={'latitude': lat, 'longitude': lon, 'current': 'temperature_2m,weather_code,wind_speed_10m', 'timezone': 'auto'}).json()
    c = d['current']
    return {'city': city, 'temperature': c['temperature_2m'], 'wind_kmh': c['wind_speed_10m'], 'weather_code': c['weather_code']}

def calculator(expression: str) -> dict:
    """수식을 계산한다. 예: '(3 + 4) * 2', '18.4 * 9 / 5 + 32'"""
    try:
        return {'expression': expression, 'result': eval(expression, {'__builtins__': {}}, {})}
    except Exception as e:
        return {'error': f'계산 실패: {e}'}

weather_decl = types.FunctionDeclaration(
    name='get_weather',
    description='도시의 현재 날씨(기온 · 풍속)를 알려준다. 사용자가 날씨나 기온을 물을 때 사용한다.',
    parameters={'type': 'object', 'properties': {'city': {'type': 'string', 'description': "도시 이름. 예: '서울', 'Tokyo'"}}, 'required': ['city']},
)
calc_decl = types.FunctionDeclaration(
    name='calculator',
    description='수식을 계산한다. 숫자 계산이 필요할 때 사용한다.',
    parameters={'type': 'object', 'properties': {'expression': {'type': 'string', 'description': "파이썬 수식. 예: '1500 * 0.15'"}}, 'required': ['expression']},
)
TOOLS = types.Tool(function_declarations=[weather_decl, calc_decl])
FUNCTIONS = {'get_weather': get_weather, 'calculator': calculator}
print(get_weather('서울'))
print(calculator('1500 * 0.15'))

# %% [markdown]
# ## 3. 호출 요청 꺼내기 — LLM 은 실행하지 않는다
# 자동 실행을 끄고(`automatic_function_calling.disable=True`) 모델이 돌려주는 **호출 요청(JSON)** 만 확인합니다.

# %%
manual_config = types.GenerateContentConfig(
    tools=[TOOLS],
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
)
r = client.models.generate_content(model=MODEL, contents='1500 * 0.15 는 얼마야?', config=manual_config)
part = r.candidates[0].content.parts[0]
print('텍스트:', repr(r.text))
print('호출 요청:', part.function_call.name, dict(part.function_call.args))

# %% [markdown]
# ## 4. 5단계 루프 직접 구현하기
# ① 질문 + 도구 → ② 호출 요청 → ③ 우리 코드가 실행 → ④ `function_response` 로 결과 전달 → ⑤ 최종 답.
# 요청이 또 오면 ②~④ 를 반복합니다 (도구 연쇄).

# %%
def run_agent(question, max_steps=5, verbose=True):
    contents = [types.Content(role='user', parts=[types.Part(text=question)])]          # ① 대화 기록
    for step in range(max_steps):
        r = client.models.generate_content(model=MODEL, contents=contents, config=manual_config)
        content = r.candidates[0].content
        contents.append(content)                                                      # assistant(model) 메시지 기록
        calls = [p.function_call for p in content.parts if p.function_call]
        if not calls:                                                                 # ⑤ 호출 요청이 없으면 최종 답
            return r.text
        response_parts = []
        for call in calls:                                                            # ② 호출 요청
            fn = FUNCTIONS[call.name]
            result = fn(**dict(call.args))                                            # ③ 실행 (우리 코드)
            if verbose:
                print(f'🔧 {call.name}({dict(call.args)}) → 👁 {result}')
            response_parts.append(types.Part.from_function_response(name=call.name, response=result))
        contents.append(types.Content(role='user', parts=response_parts))             # ④ 결과를 돌려줌
    return '(최대 단계 초과)'

print(run_agent('부산 날씨 알려줘'))
print()
print(run_agent('서울 기온을 화씨로 계산해줘'))        # 도구 연쇄: get_weather → calculator

# %% [markdown]
# ## 5. SDK 의 자동 함수 호출
# 파이썬 함수를 그대로 `tools=` 에 넘기면 SDK 가 docstring · 타입 힌트로 스키마를 만들고 (브라우저의 `@al.tool` 과 같은 일) 루프까지 돌려 줍니다.

# %%
auto_config = types.GenerateContentConfig(tools=[get_weather, calculator])
r = client.models.generate_content(model=MODEL, contents='도쿄 날씨 알려주고 기온을 화씨로도 알려줘', config=auto_config)
print(r.text)
print('--- 자동 호출 기록 ---')
for c in r.automatic_function_calling_history:
    for p in c.parts:
        if p.function_call:
            print('🔧', p.function_call.name, dict(p.function_call.args))
        elif p.function_response:
            print('👁', dict(p.function_response.response))

# %% [markdown]
# ## 6. 공급자별 형식 비교 — OpenAI
# 같은 도구를 OpenAI 형식(`{"type": "function", "function": {...}}`)으로 보내 봅니다. `OPENAI_API_KEY` 가 Secrets 에 없으면 건너뜁니다.

# %%
OPENAI_API_KEY = None
try:
    OPENAI_API_KEY = userdata.get('OPENAI_API_KEY')
except Exception:
    pass

if OPENAI_API_KEY:
    from openai import OpenAI
    oa = OpenAI(api_key=OPENAI_API_KEY)
    openai_tools = [{'type': 'function', 'function': {'name': 'calculator', 'description': '수식을 계산한다',
                     'parameters': {'type': 'object', 'properties': {'expression': {'type': 'string'}}, 'required': ['expression']}}}]
    r = oa.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': '1500 * 0.15 는?'}], tools=openai_tools)
    tc = r.choices[0].message.tool_calls[0]
    print('OpenAI 호출 요청:', tc.function.name, tc.function.arguments, '(arguments 는 JSON 문자열)')
else:
    print('OPENAI_API_KEY 가 없어 건너뜁니다. (Gemini: functionDeclarations / OpenAI: function / Anthropic: input_schema)')

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 환율 변환 도구
# `krw_to(amount, currency='USD')` 함수를 만들어 자동 함수 호출로 "10만 원은 몇 달러야?" 에 답하게 하세요.
# ① docstring 에 용도와 매개변수 설명, ② `float()` 변환, ③ 지원하지 않는 통화는 `{'error': ...}`.

# %%
RATES = {'USD': 1350.0, 'JPY': 9.1, 'EUR': 1480.0}

def krw_to(amount: float, currency: str = 'USD') -> dict:
    """원화 금액을 다른 통화로 환전 계산한다. amount: 원화 금액, currency: 통화 코드 (USD, JPY, EUR)"""
    # BEGIN SOLUTION
    amount = float(amount)
    if currency not in RATES:
        return {'error': f'지원하지 않는 통화: {currency}. 가능: {list(RATES)}'}
    return {'result': round(amount / RATES[currency], 2), 'unit': currency}
    # END SOLUTION

r = client.models.generate_content(model=MODEL, contents='10만 원은 몇 달러야? 그리고 엔으로는?',
                                   config=types.GenerateContentConfig(tools=[krw_to]))
print(r.text)

# %% [markdown]
# ### 문제 2. 단위 변환 도구
# `km_to_mile(km)` 도구(1 km = 0.621371 mile)를 만들어 "마라톤 42.195 km 는 몇 마일이야?" 에 답하게 하세요.

# %%
# BEGIN SOLUTION
def km_to_mile(km: float) -> dict:
    """킬로미터를 마일로 변환 계산한다. km: 거리(킬로미터)"""
    return {'result': round(float(km) * 0.621371, 2), 'unit': 'mile'}

r = client.models.generate_content(model=MODEL, contents='마라톤 42.195 km 는 몇 마일이야?',
                                   config=types.GenerateContentConfig(tools=[km_to_mile]))
print(r.text)
# END SOLUTION

# %% [markdown]
# ### 문제 3. (도전) 할 일 목록 도구 두 개
# `add_todo(item)` 과 `list_todos()` 를 만들고, 한 번의 요청 "우유 사기랑 보고서 쓰기를 할 일에 추가하고 전체 목록 보여줘" 로
# 모델이 도구를 **여러 번 연쇄 호출**하는지 `automatic_function_calling_history` 로 확인하세요.

# %%
TODOS = []
# BEGIN SOLUTION
def add_todo(item: str) -> dict:
    """할 일을 목록에 추가한다. item: 할 일 내용 한 가지"""
    TODOS.append(item)
    return {'added': item, 'count': len(TODOS)}

def list_todos() -> dict:
    """현재 할 일 목록 전체를 돌려준다"""
    return {'todos': list(TODOS)}

r = client.models.generate_content(model=MODEL, contents='우유 사기랑 보고서 쓰기를 할 일에 추가하고 전체 목록 보여줘',
                                   config=types.GenerateContentConfig(tools=[add_todo, list_todos]))
print(r.text)
calls = [p.function_call.name for c in r.automatic_function_calling_history for p in c.parts if p.function_call]
print('호출 순서:', calls)
# END SOLUTION

# %% [markdown] teacher
# 문제 3 에서 모델이 add_todo 를 두 번 부른 뒤 list_todos 를 부르는 순서(또는 병렬 호출)를 보여 주는 것이 핵심입니다.
# 모의 LLM 은 한 번에 도구 하나만 고르므로 브라우저에서는 볼 수 없었던 장면입니다.
# 위험한 도구(삭제 · 결제)는 자동 함수 호출에 넘기지 말고, 3~4번처럼 수동 루프에서 승인 게이트를 두라는 점을 강조하세요.

# %% [markdown]
# ---
# ## 📝 정리
# - LLM 은 함수를 **실행하지 않고 호출 요청(JSON)** 만 돌려준다 — 실행은 우리 코드.
# - 스키마 = name · description · parameters. 공급자마다 포장지(functionDeclarations / function / input_schema)만 다르다.
# - 5단계 루프: 질문 → 요청 → 실행 → `function_response` → 답 (요청이 또 오면 반복 = 도구 연쇄).
# - SDK 자동 함수 호출은 편하지만, 위험한 도구는 **수동 루프 + 승인 게이트**로.
