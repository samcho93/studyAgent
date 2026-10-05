"""기억(Memory) — 단기 대화 기억과 장기 벡터 기억

    mem = ConversationMemory(window=6)        # 최근 메시지 N개만 유지
    mem = SummaryMemory(llm, window=4)        # 오래된 대화는 요약으로 압축
    mem.add_user('안녕'); mem.add_assistant('반가워요')
    mem.messages()                            # LLM 에 보낼 메시지 목록

    store = VectorStore()                     # 임베딩 + 코사인 유사도 검색 (순수 파이썬)
    store.add('사용자는 매운 음식을 좋아한다', meta={'kind': 'preference'})
    store.search('뭘 먹을까?', k=2)           # → [(점수, 텍스트, meta), …]

임베딩은 기본적으로 **해시 n-gram 임베딩**(오프라인 · 결정적)을 쓰고, API 키가 있으면 Embedder(llm) 가 실제 임베딩 API 를 쓴다.
"""
import hashlib
import json
import math
import re

from . import _http
from .llm import system as _system, user as _user, assistant as _assistant

DIM = 256


def _ngrams(text, n=(2, 3)):
    t = re.sub(r'\s+', ' ', str(text).lower()).strip()
    grams = []
    for k in n:
        grams += [t[i:i + k] for i in range(max(0, len(t) - k + 1))]
    grams += t.split(' ')
    return grams


def hash_embed(text, dim=DIM):
    """문자 n-gram 을 해시해 고정 길이 벡터로 (언어 무관 · 오프라인 · 항상 같은 값)"""
    v = [0.0] * dim
    for g in _ngrams(text):
        h = hashlib.md5(g.encode('utf-8')).digest()
        idx = int.from_bytes(h[:4], 'little') % dim
        sign = 1.0 if h[4] % 2 == 0 else -1.0
        v[idx] += sign
    return _normalize(v)


def _normalize(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def cosine(a, b):
    """코사인 유사도 (벡터는 정규화되어 있다고 가정하지 않는다)"""
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (na * nb)


def embed(texts, llm=None):
    """텍스트(또는 목록) → 벡터(또는 목록). llm 이 있고 키가 있으면 실제 임베딩 API"""
    return Embedder(llm).embed(texts)


class Embedder:
    """임베딩 공급자: 'hash'(기본) · gemini(text-embedding-004) · openai(text-embedding-3-small)"""

    def __init__(self, llm=None):
        self.llm = llm
        self.kind = 'hash'
        if llm is not None and getattr(llm, 'provider', 'mock') in ('gemini', 'openai') and not _http.offline():
            self.kind = llm.provider

    def embed(self, texts):
        single = isinstance(texts, str)
        items = [texts] if single else list(texts)
        if self.kind == 'hash':
            vecs = [hash_embed(t) for t in items]
        else:
            vecs = self._api(items)
        return vecs[0] if single else vecs

    def _api(self, items):
        llm = self.llm
        try:
            if self.kind == 'gemini':
                body = {'requests': [{'model': 'models/text-embedding-004', 'content': {'parts': [{'text': t}]}} for t in items]}
                st, text = _http.request(f'{llm.base_url}/models/text-embedding-004:batchEmbedContents?key={llm.api_key}', 'POST', None, body)
                d = json.loads(text)
                return [e['values'] for e in d['embeddings']]
            body = {'model': 'text-embedding-3-small', 'input': items}
            st, text = _http.request(llm.base_url.rstrip('/') + '/embeddings', 'POST', {'Authorization': 'Bearer ' + llm.api_key}, body)
            d = json.loads(text)
            return [e['embedding'] for e in d['data']]
        except Exception as e:  # noqa
            print(f'  ⚠ 임베딩 API 실패({e}) — 해시 임베딩으로 대체합니다')
            self.kind = 'hash'
            return [hash_embed(t) for t in items]


class VectorStore:
    """인메모리 벡터 저장소 (장기 기억 · 간단한 RAG 용)"""

    def __init__(self, embedder=None):
        self.embedder = embedder or Embedder()
        self.items = []   # {'text', 'meta', 'vec'}

    def add(self, text, meta=None):
        vec = self.embedder.embed(text)
        self.items.append({'text': text, 'meta': meta or {}, 'vec': vec})
        return len(self.items) - 1

    def add_many(self, texts, metas=None):
        for i, t in enumerate(texts):
            self.add(t, (metas or [None] * len(texts))[i])
        return len(self.items)

    def search(self, query, k=3, min_score=None, where=None):
        """→ [(score, text, meta)] 유사도 높은 순"""
        q = self.embedder.embed(query)
        scored = []
        for it in self.items:
            if where and not all(it['meta'].get(kk) == vv for kk, vv in where.items()):
                continue
            s = cosine(q, it['vec'])
            if min_score is None or s >= min_score:
                scored.append((round(s, 4), it['text'], it['meta']))
        scored.sort(key=lambda x: -x[0])
        return scored[:k]

    def context(self, query, k=3):
        """검색 결과를 프롬프트에 넣기 좋은 문자열로"""
        return '\n'.join(f'- {t}' for _, t, _ in self.search(query, k))

    def __len__(self):
        return len(self.items)

    def __repr__(self):
        return f'VectorStore({len(self.items)} items, {self.embedder.kind})'


class ConversationMemory:
    """단기 기억: 대화 메시지를 저장하고, window 개까지만 LLM 에 보낸다"""

    def __init__(self, window=None, system_prompt=None):
        self.window = window
        self.system_prompt = system_prompt
        self.history = []

    def add(self, message):
        self.history.append(message)

    def add_user(self, text):
        self.add(_user(text))

    def add_assistant(self, text):
        self.add(_assistant(text))

    def messages(self):
        hist = self.history
        if self.window:
            hist = hist[-self.window:]
        return ([_system(self.system_prompt)] if self.system_prompt else []) + list(hist)

    def clear(self):
        self.history = []

    def __len__(self):
        return len(self.history)

    def show(self):
        for m in self.messages():
            print(f"  {m['role']:<9}| {str(m.get('content'))[:70]}")


class SummaryMemory(ConversationMemory):
    """오래된 대화를 LLM 으로 요약해 압축하는 기억"""

    def __init__(self, llm, window=4, system_prompt=None):
        super().__init__(window=None, system_prompt=system_prompt)
        self.llm = llm
        self.keep = window
        self.summary = ''

    def add(self, message):
        self.history.append(message)
        if len(self.history) > self.keep * 2:
            old, self.history = self.history[:-self.keep], self.history[-self.keep:]
            text = '\n'.join(f"{m['role']}: {m.get('content')}" for m in old)
            prompt = f'다음 대화를 사용자 정보와 요청 중심으로 3문장 이내로 요약해라.\n이전 요약: {self.summary or "(없음)"}\n\n{text}'
            self.summary = self.llm.ask(prompt)

    def messages(self):
        sys_t = (self.system_prompt or '').strip()
        if self.summary:
            sys_t = (sys_t + '\n\n' if sys_t else '') + f'[지금까지의 대화 요약]\n{self.summary}'
        return ([_system(sys_t)] if sys_t else []) + list(self.history)
