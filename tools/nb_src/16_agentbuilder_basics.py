# %% [markdown]
# # 16. agentBuilder 시작하기 — 빌더 없이 그래프를 실행하고 코드로 내보내기
#
# 브라우저에서는 그래프 JSON 을 `builder.engine` 으로 읽고 · 검증하고 · 실행하고 · `export_python` 으로 내보냈습니다.
# 이 노트북에서는 **agentBuilder 저장소를 그대로 내려받아** 명령줄 실행기 `run_graph.py` 로 같은 일을 하고,
# 내보낸 `.py` 파일을 **실제 Gemini** 로 돌려 봅니다. 빌더 자체는 필요 없습니다.
#
# | 단계 | 내용 | 브라우저 예제 |
# |---|---|---|
# | 1 | `git clone` → `run_graph.py` 로 예제 01 실행 · 시작 입력 바꾸기 | 16-4 · 16-5 |
# | 2 | `--validate` · `--export` · `--catalog` | 16-3 · 16-7 · 16-1 |
# | 3 | 내보낸 코드 실행 (`python hello.py "질문"`) | 16-9 |
# | 4 | Gemini 키를 환경 변수로 → 공급자를 바꾼 그래프가 **실제 모델**로 | 16-10 · 16-11 |
# | 5 | 그래프를 파이썬으로 고쳐 저장하고 다시 실행 | 16-5 · 실습 16-4 |
# | ✏️ | 실습 문제 3개 | |
#
# **API 키**: 🔑 Secrets 의 `GEMINI_API_KEY` (없어도 1~3 · 5 단계는 모의 LLM 으로 동작합니다).

# %% [markdown]
# ## 0. agentBuilder 내려받기
# 저장소에는 빌더 화면(HTML/JS)과 함께 실행 엔진 `py/builder/`, 미니 프레임워크 `py/agentlab/`, 예제 `examples/*.json`, 실행기 `run_graph.py` 가 들어 있습니다.

# %%
!git clone -q https://github.com/samcho93/agentBuilder.git /content/agentBuilder 2>/dev/null || (cd /content/agentBuilder && git pull -q)
%cd /content/agentBuilder
!ls examples

# %% [markdown]
# ## 1. run_graph.py 로 예제 실행하기
# `python run_graph.py 그래프.json ["시작 입력"]` — 키가 없으면 모의 LLM 으로 실행됩니다. 로그 기호(▶ · ↗ · ↙ · ✔ · === 결과 ===)는 빌더 실행 패널과 같습니다.

# %%
!python run_graph.py examples/01_hello_llm.json

# %%
!python run_graph.py examples/01_hello_llm.json "자기소개를 한 문장으로 해줘"

# %% [markdown]
# `run_graph.py` 는 브라우저에서 쓴 `engine.run_graph` 를 명령줄로 감싼 60줄짜리 스크립트입니다. 이벤트를 받아 찍는 `print_event` 함수를 직접 읽어 보세요 — 예제 16-4 의 `show` 와 같은 모양입니다.

# %%
!sed -n '/^def print_event/,/^def main/p' run_graph.py

# %% [markdown]
# ## 2. 검증 · 내보내기 · 카탈로그
# 빌더의 ▶ 실행 전 검사(`--validate`), 🐍 Python 코드 탭(`--export`), 팔레트(`--catalog`)가 각각 명령 하나입니다.

# %%
!python run_graph.py examples/02_persona_chain.json --validate
!python run_graph.py examples/02_persona_chain.json --export persona.py
!python run_graph.py --catalog | python -c "import json,sys; c=json.load(sys.stdin); print(len(c['nodes']), '종:', ' · '.join(n['label'] for n in c['nodes'][:12]), '…')"

# %% [markdown]
# 내보낸 코드의 `main()` 부분만 읽어 봅니다. 노드 하나 = 주석 한 줄 + 코드 몇 줄, 간선 = 변수 전달입니다.

# %%
code = open('persona.py', encoding='utf-8').read()
print(len(code.splitlines()), '줄')
print(code[code.index('def main():'):])

# %% [markdown]
# ## 3. 내보낸 코드 실행하기
# 내보낸 스크립트는 `agentlab/` 폴더만 있으면 어디서든 돕니다 (`./py/agentlab` 을 자동으로 찾습니다). 첫 시작 입력은 `sys.argv[1]` 로 받습니다.

# %%
!python persona.py "직원이 친절하고 배송도 빨라서 또 사고 싶어요!"

# %% [markdown]
# ## 4. 실제 모델로: 키는 환경 변수에만
# Colab Secrets 의 `GEMINI_API_KEY` 를 **환경 변수**로 넣습니다. 코드와 그래프에는 키가 들어가지 않습니다 — 그래프의 LLM 노드에는 `"provider": "gemini"` 만 적습니다.

# %%
import os, json
from google.colab import userdata
try:
    os.environ['GEMINI_API_KEY'] = userdata.get('GEMINI_API_KEY')
    print('GEMINI_API_KEY 설정 완료 (값은 출력하지 않습니다)')
except Exception as e:
    print('GEMINI_API_KEY 가 Secrets 에 없습니다 → 아래는 모의 LLM 으로 실행됩니다.', e)

# %%
import sys
sys.path.insert(0, '/content/agentBuilder/py')
from builder import engine, export

g = json.load(open('examples/01_hello_llm.json', encoding='utf-8'))
llm = next(n for n in g['nodes'] if n['type'] == 'llm')
llm['config'].update({'provider': 'gemini', 'model': 'gemini-2.5-flash', 'key_ref': 'gemini'})   # 빌더에서 공급자를 고른 것과 같다
json.dump(g, open('hello_gemini.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('그래프에 들어간 것:', json.dumps(llm['config'], ensure_ascii=False))
print('.env.example →')
print(export.env_example(g))

# %%
!python run_graph.py hello_gemini.json "AI 에이전트와 챗봇의 차이를 두 문장으로 설명해줘"

# %% [markdown]
# 내보낸 코드도 같은 환경 변수를 읽습니다. 코드 안에 키가 없는지 확인한 뒤 실행해 보세요.

# %%
!python run_graph.py hello_gemini.json --export hello_gemini.py
!grep -c "GEMINI_API_KEY" hello_gemini.py && grep -n "os.environ.get" hello_gemini.py
!python hello_gemini.py "오늘 공부할 내용을 한 줄로 응원해줘"

# %% [markdown]
# ## 5. 그래프를 파이썬으로 고쳐 저장하고 다시 실행
# 빌더의 속성 패널에서 고치는 것은 결국 `config` dict 의 키 하나입니다. 역할을 바꾸고 프롬프트 템플릿 노드를 끼워 넣은 뒤 저장하면 `run_graph.py` 와 빌더(📂 열기) 어느 쪽에서든 그대로 열립니다.

# %%
g = json.load(open('hello_gemini.json', encoding='utf-8'))
chat = next(n for n in g['nodes'] if n['type'] == 'chat')
chat['config']['system'] = '당신은 시인입니다. 짧고 운율 있게 두 줄로 답합니다.'
g['nodes'].append({'id': 'n6', 'type': 'template', 'label': '질문 포장', 'x': 230, 'y': 160,
                   'config': {'template': '다음 질문에 비유를 하나 넣어 답해줘: {q}'}})
e1 = next(e for e in g['edges'] if e['id'] == 'e1')
e1['to'], e1['toPort'] = 'n6', 'q'
g['edges'].append({'id': 'e4', 'from': 'n6', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'})
print('검증:', engine.validate(g) or '문제 없음')
json.dump(g, open('poet.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# %%
!python run_graph.py poet.json "에이전트의 기억은 왜 필요할까?"

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 예제 04 도구 에이전트 실행하고 내보내기
# `examples/04_tool_agent.json` 을 `run_graph.py` 로 실행해 🔧 도구 호출 → 👁 관찰 로그를 확인하고, `--export` 로 `tool_agent.py` 를 만든 뒤
# 내보낸 코드에서 `al.Agent(` 가 들어 있는 줄을 출력하세요 (04차시의 코드와 비교).

# %%
# BEGIN SOLUTION
!python run_graph.py examples/04_tool_agent.json "부산 날씨 알려줘"
!python run_graph.py examples/04_tool_agent.json --export tool_agent.py
!grep -n "al.Agent(" tool_agent.py
# END SOLUTION

# %% [markdown]
# ### 문제 2. JSON 모드 감성 분류 그래프를 코드로 만들어 저장 · 실행
# 시작 입력(리뷰) → LLM 호출(`json_mode: True`, 감성 분류 프롬프트) → 결과(json 포트 연결) 그래프 dict 를 만들어 `sentiment.json` 으로 저장하고,
# `run_graph.py` 로 리뷰 두 개(부정 · 긍정)를 넣어 실행하세요. `engine.validate` 로 먼저 검증합니다.

# %%
PROMPT = '다음 리뷰의 감성을 분류해줘. JSON {"sentiment": "positive|negative|neutral", "reason": "..."} 로만 답해.\n\n{input}'
g = {
    'version': 1, 'name': '감성 분류기',
    'nodes': [
        {'id': 'r', 'type': 'input',  'label': '리뷰', 'x': 0, 'y': 0,   'config': {'text': '배송이 너무 늦고 상자도 찌그러져서 실망했어요', 'name': 'review'}},
        {'id': 'm', 'type': 'llm',    'label': '모델', 'x': 0, 'y': 150, 'config': {'provider': 'gemini'}},
    ],
    'edges': [],
    'settings': {'max_loops': 5},
}
# 여기에 chat 노드 'c'(json_mode True) · output 노드 'o' 를 추가하고 간선 3개를 연결하세요
# BEGIN SOLUTION
g['nodes'].append({'id': 'c', 'type': 'chat',   'label': '분류', 'x': 300, 'y': 60, 'config': {'system': '당신은 감성 분석기입니다.', 'prompt': PROMPT, 'json_mode': True}})
g['nodes'].append({'id': 'o', 'type': 'output', 'label': '결과', 'x': 600, 'y': 60, 'config': {'title': '감성'}})
g['edges'] = [
    {'id': 'e1', 'from': 'r', 'fromPort': 'text', 'to': 'c', 'toPort': 'input'},
    {'id': 'e2', 'from': 'm', 'fromPort': 'llm',  'to': 'c', 'toPort': 'llm'},
    {'id': 'e3', 'from': 'c', 'fromPort': 'json', 'to': 'o', 'toPort': 'value'},
]
# END SOLUTION
print('검증:', engine.validate(g) or '문제 없음')
json.dump(g, open('sentiment.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# %%
!python run_graph.py sentiment.json "배송이 너무 늦고 상자도 찌그러져서 실망했어요"
!python run_graph.py sentiment.json "친절한 응대에 감동했어요. 최고!"

# %% [markdown]
# ### 문제 3. (도전) 내보낸 코드를 브라우저 없이 수정하기
# `--export` 로 만든 `hello_gemini.py` 를 열어 `main()` 안의 시스템 프롬프트 문자열을 바꾸고(예: “당신은 역사 선생님입니다.”) 저장한 뒤 실행하세요.
# 빌더 없이 코드만으로 에이전트를 계속 발전시킬 수 있음을 확인합니다. (파일 수정은 파이썬의 `str.replace` 로)

# %%
# BEGIN SOLUTION
src = open('hello_gemini.py', encoding='utf-8').read()
src = src.replace('당신은 친절한 AI 선생님입니다. 쉬운 말로 설명합니다.', '당신은 역사 선생님입니다. 역사 속 사례에 빗대어 설명합니다.')
open('hello_history.py', 'w', encoding='utf-8').write(src)
!python hello_history.py "AI 에이전트가 뭔지 한 문장으로 설명해줘"
# END SOLUTION

# %% [markdown] teacher
# 문제 1 의 핵심은 내보낸 코드의 `al.Agent(llm1, tools=[tool1, tool2, tool3], system=..., max_steps=6)` 줄이 04차시 예제 4-4 와 같은 모양이라는 것입니다.
# 문제 2 에서 `json` 포트 대신 `text` 포트를 결과에 연결하면 문자열이 나옵니다 — 두 포트의 차이를 짚어 주세요.
# 문제 3 은 “빌더는 시작점일 뿐, 코드로 이어 간다”는 메시지입니다. 실제 모델이면 역할에 따라 답이 달라지는 것을 바로 볼 수 있습니다.

# %% [markdown]
# ---
# ## 📝 정리
# - 그래프 JSON 은 빌더 없이 `python run_graph.py 파일.json "질문"` 으로 실행된다 (`--validate` · `--export` · `--catalog`).
# - 내보낸 코드는 `agentlab/` 폴더만 있으면 독립 실행되고, 노드 하나 = 코드 몇 줄로 우리가 쓴 agentlab 코드와 같다.
# - 키는 **환경 변수 · .env 에만**. 그래프에는 `provider` 와 `key_ref` 이름, 코드에는 `os.environ.get(...)` 뿐이다.
# - 그래프를 파이썬으로 고쳐 저장하면 빌더에서도 그대로 열린다 — 코드와 그림은 같은 것.
