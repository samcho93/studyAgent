# %% [markdown]
# # 05. 기억 장치: 단기 기억과 장기 기억 — 실제 임베딩과 벡터 DB
#
# 브라우저에서는 해시 임베딩과 리스트 기반 `VectorStore` 로 원리를 익혔습니다. 이 노트북에서는
# **실제 Gemini 모델 · 실제 임베딩 모델 · Chroma 벡터 DB** 로 같은 것을 다시 만듭니다.
#
# **상태 없는 호출 → 대화 기록(chat) → 창 제한 → 요약 기억 → 실제 임베딩과 유사도 → Chroma → 미니 RAG → 기억 도구 에이전트**

# %% [markdown]
# ## 0. 설치와 API 키

# %%
!pip -q install google-genai chromadb numpy

# %%
import json
import numpy as np
from google import genai
from google.genai import types
from google.colab import userdata

GEMINI_API_KEY = userdata.get('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = 'gemini-2.5-flash'
EMBED_MODEL = 'gemini-embedding-001'      # 안 되면 'text-embedding-004'

# %% [markdown]
# ## 1. 호출마다 새 출발 — LLM 은 기억이 없다

# %%
r1 = client.models.generate_content(model=MODEL, contents='내 이름은 영준이야. 기억해 줘!')
r2 = client.models.generate_content(model=MODEL, contents='내 이름이 뭐지?')
print('1번째:', r1.text.strip())
print('2번째:', r2.text.strip())        # → 모른다

# %% [markdown]
# ## 2. 대화 기록 = 단기 기억
# SDK 의 `chats` 는 메시지 목록을 대신 쌓아 매번 함께 보내 줍니다. `get_history()` 로 쌓인 기록을 볼 수 있습니다.

# %%
chat = client.chats.create(model=MODEL, config=types.GenerateContentConfig(system_instruction='당신은 친절한 비서입니다. 2문장 이내로 답합니다.'))
for q in ['내 이름은 영준이야.', '나는 커피를 좋아해.', '내 이름이 뭐지? 그리고 내가 뭘 좋아한다고 했지?']:
    print('👤', q)
    print('🤖', chat.send_message(q).text.strip())
print('--- 기록 ---')
for m in chat.get_history():
    print(f'{m.role:<6}| {m.parts[0].text[:40]}')

# %% [markdown]
# ## 3. 창(window) 제한 — 창 밖은 잊는다
# 기록을 직접 리스트로 관리하면서 **최근 N개만** 보내 봅니다. window 를 바꿔 어디서부터 이름을 잊는지 확인하세요.

# %%
def chat_with_window(turns, window=None, system='당신은 비서입니다. 1문장으로 답합니다.'):
    history = []
    for q in turns:
        history.append(types.Content(role='user', parts=[types.Part(text=q)]))
        sent = history[-window:] if window else history                       # 창 적용
        r = client.models.generate_content(model=MODEL, contents=sent, config=types.GenerateContentConfig(system_instruction=system))
        history.append(r.candidates[0].content)
    return r.text.strip(), len(sent), len(history)

turns = ['내 이름은 영준이야.', '나는 커피를 좋아해.', '오늘 날씨가 참 좋다.', '내 이름이 뭐지?']
for window in [None, 2, 8]:
    answer, n_sent, n_total = chat_with_window(turns, window)
    print(f'window={window}: 보낸 {n_sent}/{n_total} → {answer}')

# %% [markdown]
# ## 4. 요약 기억 — 오래된 대화를 압축해 system 에 넣기

# %%
old_turns = [('user', '내 이름은 영준이야.'), ('model', '반가워요, 영준 님!'), ('user', '나는 커피를 좋아해.'), ('model', '알겠습니다.'),
             ('user', '내일 회의는 3시야.'), ('model', '네, 기억해 둘게요.')]
old_text = '\n'.join(f'{r}: {t}' for r, t in old_turns)
summary = client.models.generate_content(model=MODEL, contents=f'다음 대화를 사용자 정보와 요청 중심으로 2문장 이내로 요약해라.\n\n{old_text}').text.strip()
print('요약:', summary)

system = f'당신은 비서입니다.\n\n[지금까지의 대화 요약]\n{summary}'
r = client.models.generate_content(model=MODEL, contents='내 이름이 뭐고 내일 일정이 뭐지?', config=types.GenerateContentConfig(system_instruction=system))
print('🤖', r.text.strip())

# %% [markdown]
# ## 5. 실제 임베딩과 코사인 유사도
# 해시 임베딩은 글자 조각만 봤지만, 실제 임베딩 모델은 **의미**를 봅니다. "커피" 와 "아메리카노" 가 닮았다고 나오는지 확인하세요.

# %%
def embed(texts):
    r = client.models.embed_content(model=EMBED_MODEL, contents=texts)
    return np.array([e.values for e in r.embeddings])

def cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

base = '사용자는 커피를 좋아한다'
others = ['커피 추천해줘', '아메리카노 한 잔 어때?', '뭐 마실까?', '내일 회의는 3시야', '사용자는 커피를 좋아한다']
vecs = embed([base] + others)
print('벡터 차원:', vecs.shape[1])
for text, v in zip(others, vecs[1:]):
    print(f'{cosine(vecs[0], v):.3f} | {base} ↔ {text}')

# %% [markdown]
# ## 6. Chroma 벡터 DB — add · query · where
# 브라우저 `VectorStore` 의 `add · search · where` 가 Chroma 에서는 `add · query · where` 입니다. 임베딩은 위 `embed()` 로 직접 만들어 넣습니다.

# %%
import chromadb

chroma = chromadb.Client()
try:
    chroma.delete_collection('user_memory')
except Exception:
    pass
memory = chroma.create_collection('user_memory')

facts = [('사용자의 이름은 영준이다', 'profile'), ('사용자는 커피를 좋아한다', 'preference'),
         ('사용자는 매운 음식을 못 먹는다', 'preference'), ('다음 회의는 금요일 3시다', 'schedule'),
         ('사용자는 파이썬을 배우고 있다', 'profile')]
memory.add(ids=[f'm{i}' for i in range(len(facts))],
           documents=[t for t, _ in facts],
           metadatas=[{'kind': k} for _, k in facts],
           embeddings=embed([t for t, _ in facts]).tolist())
print('저장된 기억:', memory.count(), '개')

def recall(query, k=2, where=None):
    hits = memory.query(query_embeddings=embed([query]).tolist(), n_results=k, where=where)
    return hits['documents'][0]

print('뭐 마실까?        →', recall('뭐 마실까?'))
print('음식 (preference) →', recall('음식', where={'kind': 'preference'}))
print('회의 언제야?      →', recall('회의 언제야?', k=1))

# %% [markdown]
# ## 7. 미니 RAG — 검색한 기억을 프롬프트에 넣어 답하기
# 브라우저에서는 모의 LLM 이 대본으로 답했지만, 실제 모델은 **[기억] 을 읽고 스스로** 맞춤 답을 합니다.

# %%
def answer_with_memory(question, k=2):
    mem = '\n'.join('- ' + d for d in recall(question, k))
    system = '당신은 비서입니다. 아래 [기억] 을 참고해 사용자에게 맞춤 답을 2문장 이내로 합니다.\n[기억]\n' + mem
    r = client.models.generate_content(model=MODEL, contents=question, config=types.GenerateContentConfig(system_instruction=system))
    return mem, r.text.strip()

for q in ['뭐 마실까?', '저녁에 뭐 먹을까?', '이번 주에 중요한 일정 있어?']:
    mem, ans = answer_with_memory(q)
    print('👤', q)
    print('   [기억]', mem.replace('\n', ' / '))
    print('🤖', ans)
    print()

# %% [markdown]
# ## 8. 기억 도구를 가진 에이전트 — 스스로 저장하고 회상하기
# `save_memory` · `search_memory` 두 도구를 자동 함수 호출로 넘기고, "저장해줘"라는 말이 없어도 중요한 사실을 저장하도록 시스템 프롬프트에 지시합니다.

# %%
def save_memory(fact: str) -> dict:
    """사용자에 대한 새로운 사실(이름 · 선호 · 일정 · 결정)을 장기 기억에 저장한다. fact: 사실 한 문장"""
    memory.add(ids=[f'm{memory.count()}'], documents=[fact], metadatas=[{'kind': 'fact'}], embeddings=embed([fact]).tolist())
    return {'saved': fact, 'count': memory.count()}

def search_memory(query: str) -> dict:
    """장기 기억에서 질문과 관련된 사실을 검색한다. query: 검색할 내용"""
    return {'memories': recall(query, k=2)}

AGENT_SYSTEM = '''당신은 비서입니다.
사용자가 자신에 대한 새로운 사실(이름 · 선호 · 일정)을 말하면 save_memory 로 저장합니다.
사용자에 대해 알아야 답할 수 있는 질문이면 먼저 search_memory 로 검색한 뒤 답합니다. 2문장 이내로 답합니다.'''
agent_config = types.GenerateContentConfig(system_instruction=AGENT_SYSTEM, tools=[save_memory, search_memory])

for q in ['나 요즘 등산에 푹 빠졌어.', '주말에 뭐 하면 좋을까?']:      # 각 호출은 단기 기억 없이 독립 — 장기 기억만으로 연결
    r = client.models.generate_content(model=MODEL, contents=q, config=agent_config)
    calls = [p.function_call.name for c in r.automatic_function_calling_history for p in c.parts if p.function_call]
    print('👤', q)
    print('   🔧', calls)
    print('🤖', r.text.strip())
    print()

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 유사도 순위 맞히기
# 질문 "커피 한 잔 어때?" 에 대해 후보 `['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다', '라떼가 당기는 날이다']`
# 의 코사인 유사도를 실제 임베딩으로 계산해 높은 순으로 출력하세요. 브라우저(해시 임베딩) 결과와 순위가 어떻게 다른가요?

# %%
question = '커피 한 잔 어때?'
candidates = ['사용자는 커피를 좋아한다', '다음 회의는 금요일 3시다', '커피는 아침에 마신다', '라떼가 당기는 날이다']
# BEGIN SOLUTION
vecs = embed([question] + candidates)
scored = sorted(((cosine(vecs[0], v), c) for c, v in zip(candidates, vecs[1:])), reverse=True)
for score, text in scored:
    print(f'{score:.3f} {text}')
# END SOLUTION

# %% [markdown]
# ### 문제 2. 일정 기억 추가하고 필터로 찾기
# `memory` 에 `kind: 'schedule'` 인 일정 두 개("치과 예약은 화요일 10시다", "프로젝트 마감은 이번 달 말이다")를 추가한 뒤,
# "마감 언제야?" 를 필터 없이 / `where={'kind': 'schedule'}` 로 각각 검색해 비교하세요.

# %%
# BEGIN SOLUTION
new_facts = ['치과 예약은 화요일 10시다', '프로젝트 마감은 이번 달 말이다']
memory.add(ids=[f's{i}' for i in range(len(new_facts))], documents=new_facts,
           metadatas=[{'kind': 'schedule'}] * len(new_facts), embeddings=embed(new_facts).tolist())
print('필터 없음:', recall('마감 언제야?', k=2))
print('schedule :', recall('마감 언제야?', k=2, where={'kind': 'schedule'}))
# END SOLUTION

# %% [markdown]
# ### 문제 3. (도전) 기억 목록 도구 추가하기
# 8번의 에이전트에 `list_memories()` 도구(저장된 기억 전체를 돌려줌)를 추가하고 "나에 대해 아는 걸 전부 말해 줘" 에 답하게 하세요.
# 힌트: `memory.get()['documents']`

# %%
# BEGIN SOLUTION
def list_memories() -> dict:
    """저장된 기억 전체 목록을 돌려준다"""
    return {'memories': memory.get()['documents']}

cfg = types.GenerateContentConfig(system_instruction=AGENT_SYSTEM + '\n전체 기억을 물으면 list_memories 를 사용합니다.',
                                  tools=[save_memory, search_memory, list_memories])
r = client.models.generate_content(model=MODEL, contents='나에 대해 아는 걸 전부 말해 줘', config=cfg)
print(r.text)
# END SOLUTION

# %% [markdown] teacher
# 5번 셀에서 "아메리카노 한 잔 어때?" · "뭐 마실까?" 가 커피 문장과 높은 유사도를 보이는 것이 이 노트북의 핵심 장면입니다 —
# 브라우저 해시 임베딩에서는 0 에 가까웠던 쌍입니다. "의미를 본다"는 것이 무엇인지 여기서 체감시키세요.
# 8번의 에이전트는 호출마다 단기 기억이 없는데도 장기 기억(Chroma)으로 연결되는 것을 강조합니다.
# chromadb.Client() 는 메모리 DB 라 런타임을 재시작하면 사라집니다. 영구 저장은 chromadb.PersistentClient(path='...') 를 소개하세요.

# %% [markdown]
# ---
# ## 📝 정리
# - LLM 호출은 **상태가 없다**. 기억 = 우리가 보내는 메시지 목록 (단기), 벡터 저장소에서 검색해 넣는 텍스트 (장기).
# - 창(window)은 토큰을 아끼지만 창 밖은 잊는다 → 요약으로 압축하거나 장기 기억에 저장한다.
# - 실제 임베딩은 **의미**를 본다: "커피" ↔ "아메리카노" 가 가깝다.
# - Chroma: `add · query · where` — 브라우저 `VectorStore` 와 같은 구조.
# - 미니 RAG: 검색 → `[기억]` 조립 → 호출. 문서 조각을 넣으면 RAG (studyRAG 강좌).
