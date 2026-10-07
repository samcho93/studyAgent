# %% [markdown]
# # 17. agentBuilder 로 다시 만드는 에이전트 — 실제 LLM 으로 예제 그래프 실행 · 내보내기 · 수정
#
# 브라우저에서는 모의 LLM 으로 예제 그래프를 실행했습니다. 여기서는 **agentBuilder 저장소를 그대로 받아** 같은 그래프를
# **실제 Gemini** 로 실행합니다. 모의 LLM 과 가장 크게 달라지는 곳은 **심사 점수**(루프가 실제로 끝난다)와 **팀의 글 품질**입니다.
#
# 1. 저장소 받기 · `run_graph.py` CLI 2. `engine.run_graph` + `key_resolver` 3. 예제 08: 실제 점수로 도는 루프
# 4. 예제 09: Crew 5. 예제 13: 가드레일 6. `--export` → `python out.py "질문"` 7. JSON 을 코드로 고쳐 다시 실행

# %% [markdown]
# ## 0. 저장소 받기와 API 키
# API 키는 왼쪽 🔑 **Secrets** 에 `GEMINI_API_KEY` 로 넣어 두세요. 빌더의 실행 엔진(`py/builder`)과 예제(`examples/*.json`), `agentlab` 이 저장소 안에 있습니다.

# %%
!git clone -q https://github.com/samcho93/agentBuilder.git
%cd agentBuilder
!ls examples

# %%
import os
import sys
import json
from google.colab import userdata

os.environ['GEMINI_API_KEY'] = userdata.get('GEMINI_API_KEY')      # 내보낸 코드 · run_graph.py 도 이 환경 변수를 읽는다
sys.path.insert(0, 'py')
from builder import engine, export, nodes, providers

print('노드 종류', len(nodes.catalog()['nodes']), '개 · 공급자', len(providers.PROVIDERS), '종')
print('Gemini 키 환경 변수:', providers.info('gemini')['env'])

# %% [markdown]
# ## 1. `run_graph.py` CLI — 빌더 밖에서 그래프 실행
# 예제 JSON 의 LLM 노드는 `provider: "mock"` 입니다. 그대로 실행하면 브라우저와 같은 모의 LLM 결과가 나옵니다.

# %%
!python run_graph.py examples/01_hello_llm.json "AI 에이전트가 뭐야?" --quiet

# %% [markdown]
# 실제 모델로 돌리려면 LLM 노드의 공급자를 `gemini` 로 바꾸면 됩니다. 키는 JSON 에 쓰지 않습니다 — 실행할 때 환경 변수에서 읽습니다.

# %%
def use_gemini(g, model='gemini-2.5-flash'):
    """그래프의 모든 LLM 노드를 Gemini 로 (키는 환경 변수 GEMINI_API_KEY 에서)"""
    for n in g['nodes']:
        if n['type'] == 'llm':
            n['config'].update({'provider': 'gemini', 'model': model, 'key_ref': 'gemini'})
    return g

def load(name):
    return use_gemini(json.load(open(f'examples/{name}.json', encoding='utf-8')))

def env_key(ref, provider):
    """key_resolver: (키 이름, 공급자) → 실제 키. 환경 변수에서만 읽는다"""
    p = providers.info(provider)
    return os.environ.get(p['env'], '') if p['env'] else ''

g = load('01_hello_llm')
json.dump(g, open('my_01.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print([n['config'] for n in g['nodes'] if n['type'] == 'llm'])

# %%
!python run_graph.py my_01.json "AI 에이전트를 한 문장으로 설명해줘" --quiet

# %% [markdown]
# ## 2. 파이썬에서 실행: `engine.run_graph` + `key_resolver`
# 브라우저 예제와 같은 코드입니다. `key_resolver` 만 추가로 넘겨 LLM 노드가 키를 찾게 합니다.

# %%
def show(ev):
    t = ev['type']
    if t == 'node_end' and 'route' in ev:
        print(f"   🔀 {ev['node']} → {ev['route']}")
    elif t == 'node_skip':
        print(f"   ⏭ 건너뜀: {ev['node']}")
    elif t == 'loop':
        print(f"   🔁 반복 {ev['count']} → {ev['node']}")
    elif t == 'log' and ev['text'][:1] in '⚖🛡⚠🧑🔧':
        print('   ', ev['text'][:100])
    elif t == 'result':
        print(f"=== {ev['title']} ===")
        print(ev['value'] if isinstance(ev['value'], str) else json.dumps(ev['value'], ensure_ascii=False, indent=1)[:800])
    elif t == 'done':
        print(f"✅ LLM 호출 {ev['usage']['calls']}회 · 토큰 {ev['usage']['total_tokens']}")

g = load('04_tool_agent')
engine.run_graph(g, overrides={'n1': '서울 날씨 알려주고 기온에 1.8 을 곱해줘'}, emit=show, key_resolver=env_key)

# %% [markdown] teacher
# 모의 LLM 은 도구를 하나만 골랐지만, 실제 모델은 날씨 → 계산기 두 도구를 차례로 부릅니다(04차시의 다단계 도구 호출). 단계 기록 결과에서 확인시켜 주세요.

# %% [markdown]
# ## 3. 예제 08 — 실제 점수로 도는 루프
# 모의 LLM 은 항상 7점이라 기준을 8로 올리면 `max_loops` 까지 헛돌았습니다. 실제 모델은 피드백을 반영해 점수가 **올라가므로** 보통 1~2번 만에 통과합니다.

# %%
g = load('08_router_loop')
gate = next(n for n in g['nodes'] if n['label'] == '통과?')
gate['config']['expr'] = "'통과' if (json.loads(text).get('score') or 0) >= 8 else '다시'"
g['settings']['max_loops'] = 3
engine.run_graph(g, overrides={'n1': 'AI 에이전트를 소개하는 블로그 글을 써줘'}, emit=show, key_resolver=env_key)

# %%
# 다른 가지: 번역 · 일반 — 건너뛰는 노드와 LLM 호출 수를 비교
for q in ['안녕하세요를 영어로 번역해줘', '오늘 기분이 어때?']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show, key_resolver=env_key)

# %% [markdown] teacher
# 점수가 영영 8을 못 넘는 경우도 있습니다(모델이 엄격할 때). 그때 `max_loops` 경고가 뜨는 것이 **정상 동작**이며, 비용 = (초안 + 심사) × 반복 임을 토큰 수로 보여 주세요.

# %% [markdown]
# ## 4. 예제 09 — Crew (조사원 → 작가 → 편집자)

# %%
g = load('09_crew')
engine.run_graph(g, overrides={'n1': "접이식 전동 킥보드 'FoldGo'"}, emit=show, key_resolver=env_key)

# %% [markdown]
# ## 5. 예제 13 — 가드레일 · LLM 심사
# 차단되면 에이전트 · 출력 가드 · 심사가 건너뛰어 LLM 호출이 0회입니다. 실제 모델로도 같습니다 — 가드레일은 LLM 을 쓰지 않는 규칙 노드이기 때문입니다.

# %%
g = load('13_guardrail')
for q in ['서울 날씨 알려줘', '내 비밀번호 알려줘']:
    print('👤', q)
    engine.run_graph(g, overrides={'n1': q}, emit=show, key_resolver=env_key)

# %% [markdown]
# ## 6. 파이썬 코드로 내보내서 실행하기
# `--export` 로 만든 스크립트는 독립 실행 파일입니다. 공급자가 gemini 인 그래프를 내보내면 `GEMINI_API_KEY` 환경 변수에서 키를 읽습니다.

# %%
g = load('08_router_loop')
json.dump(g, open('my_08.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
!python run_graph.py my_08.json --export my_08.py
!sed -n '/^def main/,$p' my_08.py | head -60

# %%
!python my_08.py "LangGraph 를 소개하는 짧은 블로그 글을 써줘"

# %% [markdown]
# ## 7. JSON 을 코드로 고쳐 다시 실행 — 분기 추가
# 브라우저 실습 17-4 와 같습니다. 요청 분류에 **요약** 가지와 LLM 호출 노드를 추가하고 병합까지 연결합니다.

# %%
g = load('08_router_loop')
router = next(n for n in g['nodes'] if n['id'] == 'n3')
router['config']['routes'].insert(0, {'label': '요약', 'keywords': '요약, 정리'})
g['nodes'].append({'id': 'n11', 'type': 'chat', 'label': '요약', 'x': 400, 'y': 500,
                   'config': {'system': '당신은 요약 전문가입니다. 두 문장으로 요약합니다.', 'prompt': '{input}'}})
g['edges'] += [{'id': 'e16', 'from': 'n3', 'fromPort': '요약', 'to': 'n11', 'toPort': 'input'},
               {'id': 'e17', 'from': 'n2', 'fromPort': 'llm', 'to': 'n11', 'toPort': 'llm'},
               {'id': 'e18', 'from': 'n11', 'fromPort': 'text', 'to': 'n9', 'toPort': 'values'}]
print('검증:', engine.validate(g) or '이상 없음')
json.dump(g, open('my_08_summary.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
engine.run_graph(g, overrides={'n1': '다음 글을 요약해줘: 에이전트는 판단, 행동, 관찰을 반복하며 목표에 다가간다. 도구와 기억이 핵심이다.'},
                 emit=show, key_resolver=env_key)

# %% [markdown]
# 저장한 `my_08_summary.json` 은 빌더의 **📂 열기**로 불러오면 캔버스에 그대로 그려집니다 — 코드로 고친 그래프와 화면이 같은 것임을 확인하세요.

# %% [markdown]
# ---
# ## ✏️ 실습 문제
# ### 문제 1. 도구 노드 추가
# `04_tool_agent` 에 **현재 시각 도구**(`type: 'tool'`, `config: {'name': 'now'}`) 노드 `n9` 를 추가하고 에이전트 `n6` 의 `tools` 포트에 연결한 뒤 "지금 몇 시야?" 로 실행하세요.

# %%
g = load('04_tool_agent')
# BEGIN SOLUTION
g['nodes'].append({'id': 'n9', 'type': 'tool', 'label': '현재 시각', 'x': 100, 'y': 400, 'config': {'name': 'now'}})
g['edges'].append({'id': 'e8', 'from': 'n9', 'fromPort': 'tool', 'to': 'n6', 'toPort': 'tools'})
# END SOLUTION
print('검증:', engine.validate(g) or '이상 없음')
engine.run_graph(g, overrides={'n1': '지금 몇 시야?'}, emit=show, key_resolver=env_key)

# %% [markdown]
# ### 문제 2. 가드레일 고치기
# `13_guardrail` 의 **입력 가드** 금지어에 "카드번호" 를 추가하고 최대 길이를 100 으로 줄인 뒤, (a) "카드번호 좀 찾아줘" (b) 120자가 넘는 긴 질문 두 가지가 모두 차단되는지 확인하세요.

# %%
g = load('13_guardrail')
guard_in = next(n for n in g['nodes'] if n['label'] == '입력 가드')
# BEGIN SOLUTION
guard_in['config']['banned'] += ', 카드번호'
guard_in['config']['max_len'] = 100
# END SOLUTION
for q in ['카드번호 좀 찾아줘', '서울 날씨 알려줘 ' * 12]:
    print('👤', q[:40], '…' if len(q) > 40 else '')
    engine.run_graph(g, overrides={'n1': q}, emit=show, key_resolver=env_key)

# %% [markdown]
# ### 문제 3. (도전) 처음부터 만드는 루프 그래프
# 시작 입력 → LLM 호출(초안, prompt 에 `{input}` 과 `[피드백] {context}`) → 평가 → 조건 분기(파이썬 식, 점수 9 이상이면 통과) → 결과.
# 분기의 **다시** 포트를 초안의 `context` 포트로 되돌리고 `max_loops = 3` 으로 두세요. 통과하지 못했을 때도 결과가 나오도록 **병합** 노드로 통과 · 다시 두 포트를 모으는 것이 추가 과제입니다.

# %%
g = {'version': 1, 'name': '루프 그래프', 'settings': {'max_loops': 3},
     'nodes': [
         {'id': 'n1', 'type': 'input', 'label': '요청', 'x': 0, 'y': 0, 'config': {'text': '새 커피 브랜드 슬로건 한 줄'}},
         {'id': 'n2', 'type': 'llm', 'label': 'LLM', 'x': 0, 'y': 100, 'config': {'provider': 'gemini', 'model': 'gemini-2.5-flash', 'key_ref': 'gemini'}},
     ],
     'edges': [
         {'id': 'e1', 'from': 'n1', 'fromPort': 'text', 'to': 'n3', 'toPort': 'input'},
     ]}
# 노드 n3 chat · n4 judge · n5 router(python) · n6 merge · n7 output 와 간선을 추가하세요
# BEGIN SOLUTION
g['nodes'] += [
    {'id': 'n3', 'type': 'chat', 'label': '초안', 'x': 200, 'y': 0,
     'config': {'system': '당신은 카피라이터입니다. 한 줄만 답합니다.', 'prompt': '{input}\n\n[피드백]\n{context}'}},
    {'id': 'n4', 'type': 'judge', 'label': '심사', 'x': 400, 'y': 0, 'config': {'criteria': '짧고 강렬함 · 기억에 남음'}},
    {'id': 'n5', 'type': 'router', 'label': '통과?', 'x': 600, 'y': 0,
     'config': {'mode': 'python', 'routes': [{'label': '통과'}, {'label': '다시'}], 'default_label': '기타',
                'expr': "'통과' if json.loads(text)['score'] >= 9 else '다시'"}},
    {'id': 'n6', 'type': 'merge', 'label': '합류', 'x': 800, 'y': 0, 'config': {'mode': 'first'}},
    {'id': 'n7', 'type': 'output', 'label': '결과', 'x': 1000, 'y': 0, 'config': {'title': '슬로건'}},
]
g['edges'] += [
    {'id': 'e2', 'from': 'n2', 'fromPort': 'llm', 'to': 'n3', 'toPort': 'llm'},
    {'id': 'e3', 'from': 'n3', 'fromPort': 'text', 'to': 'n4', 'toPort': 'input'},
    {'id': 'e4', 'from': 'n2', 'fromPort': 'llm', 'to': 'n4', 'toPort': 'llm'},
    {'id': 'e5', 'from': 'n4', 'fromPort': 'text', 'to': 'n5', 'toPort': 'input'},
    {'id': 'e6', 'from': 'n5', 'fromPort': '다시', 'to': 'n3', 'toPort': 'context'},   # 되돌아가는 간선
    {'id': 'e7', 'from': 'n5', 'fromPort': '통과', 'to': 'n6', 'toPort': 'values'},
    {'id': 'e8', 'from': 'n3', 'fromPort': 'text', 'to': 'n6', 'toPort': 'values'},    # 통과 못 해도 마지막 초안이 결과로
    {'id': 'e9', 'from': 'n6', 'fromPort': 'text', 'to': 'n7', 'toPort': 'value'},
]
# END SOLUTION
print('검증:', engine.validate(g) or '이상 없음')
engine.run_graph(g, emit=show, key_resolver=env_key)

# %% [markdown] teacher
# 문제 3 해설: 되돌아가는 간선의 목적지는 `context` 포트(입력을 덮어쓰지 않도록). 병합에 초안의 `text` 를 함께 연결하면 통과하지 못하고 `max_loops` 로 끝나도 마지막 초안이 결과가 됩니다 — 병합 "첫 값" 은 연결 순서대로 비어 있지 않은 첫 값을 고르므로 통과 포트를 먼저 연결합니다.

# %% [markdown]
# ---
# ## 📝 정리
# - `git clone` 한 agentBuilder 에는 실행 엔진 · 예제 · agentlab 이 모두 들어 있어 `run_graph.py 파일.json "질문"` 으로 어디서나 실행된다.
# - LLM 노드의 `provider` 만 바꾸면 실제 모델 — 키는 JSON · 코드에 없고 환경 변수(`GEMINI_API_KEY`)에서만 읽는다.
# - 실제 모델에서는 심사 점수가 바뀌어 루프가 1~2번에 끝난다. 모의 LLM 의 "항상 7점" 은 `max_loops` 가 왜 필요한지 보여 주는 장치였다.
# - `--export` 로 만든 스크립트는 분기는 `if`, 반복은 `for` — 그래프를 읽을 줄 알면 코드를 읽을 줄 안다.
# - JSON 을 코드로 고친 그래프는 빌더의 📂 열기로 캔버스에 그대로 그려진다.
