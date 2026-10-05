"""LLM 호출 — 공급자(Gemini · OpenAI 호환 · Anthropic · Ollama)를 하나의 사용법으로

    llm = LLM()                                  # 환경에 설정된 공급자 (없으면 모의 LLM)
    llm = LLM('gemini', model='gemini-2.5-flash', api_key='...')
    llm = LLM('groq') / LLM('openrouter') / LLM('ollama') / LLM('openai') / LLM('anthropic') / LLM('mock')
    llm = LLM(mock_responses=['첫 답', '둘째 답'])   # 키가 없을 때 모의 LLM 이 차례로 돌려줄 답 (수업 시나리오용)

    r = llm.chat([system('너는 친절한 비서'), user('안녕')])      # → Response
    print(r.content, r.usage.total_tokens)
    print(llm.ask('한 줄로 자기소개'))                             # 문자열만

메시지는 OpenAI 스타일 dict 를 쓴다: {'role': 'system'|'user'|'assistant'|'tool', 'content': '...'}
도구 호출 결과는 Response.tool_calls = [ToolCall(id, name, args)] 로 통일한다.
"""
import json
import os
import re
import time

from . import _http

# 공급자별 기본값. OpenAI 호환 API 는 base 주소만 다르다.
PROVIDERS = {
    'gemini':     {'label': 'Google Gemini (무료 등급)', 'model': 'gemini-2.5-flash', 'key_env': 'GEMINI_API_KEY', 'url': 'https://generativelanguage.googleapis.com/v1beta'},
    'groq':       {'label': 'Groq (무료 등급, 오픈소스 모델)', 'model': 'llama-3.3-70b-versatile', 'key_env': 'GROQ_API_KEY', 'url': 'https://api.groq.com/openai/v1'},
    'openrouter': {'label': 'OpenRouter (무료 모델)', 'model': 'meta-llama/llama-3.3-70b-instruct:free', 'key_env': 'OPENROUTER_API_KEY', 'url': 'https://openrouter.ai/api/v1'},
    'openai':     {'label': 'OpenAI', 'model': 'gpt-4o-mini', 'key_env': 'OPENAI_API_KEY', 'url': 'https://api.openai.com/v1'},
    'anthropic':  {'label': 'Anthropic Claude', 'model': 'claude-haiku-4-5-20251001', 'key_env': 'ANTHROPIC_API_KEY', 'url': 'https://api.anthropic.com/v1'},
    'ollama':     {'label': 'Ollama (내 PC 로컬 모델)', 'model': 'llama3.2', 'key_env': '', 'url': 'http://localhost:11434/v1'},
    'mock':       {'label': '모의 LLM (키 없음 · 항상 같은 답)', 'model': 'mock-1', 'key_env': '', 'url': ''},
}
OPENAI_COMPATIBLE = ('groq', 'openrouter', 'openai', 'ollama')


def providers():
    """사용할 수 있는 공급자 목록을 출력한다"""
    cur = current_provider()
    print(f"{'이름':<14}{'기본 모델':<42}{'키':<8}설명")
    print('-' * 100)
    for name, p in PROVIDERS.items():
        has = '있음' if (p['key_env'] and os.environ.get(p['key_env'])) or name in ('ollama', 'mock') else '없음'
        mark = '▶ ' if name == cur else '  '
        print(f"{mark}{name:<12}{p['model']:<42}{has:<8}{p['label']}")


def current_provider():
    """환경에 설정된 공급자 (AGENTLAB_PROVIDER) → 키가 있으면 그 공급자, 아니면 'mock'"""
    if _http.offline():
        return 'mock'
    want = os.environ.get('AGENTLAB_PROVIDER', '').strip().lower()
    if want in PROVIDERS:
        p = PROVIDERS[want]
        if want in ('ollama', 'mock') or os.environ.get(p['key_env']):
            return want
    for name, p in PROVIDERS.items():
        if p['key_env'] and os.environ.get(p['key_env']):
            return name
    return 'mock'


def status():
    """현재 LLM 설정을 출력한다"""
    name = current_provider()
    p = PROVIDERS[name]
    model = os.environ.get('AGENTLAB_MODEL') or p['model']
    if name == 'mock':
        print('🤖 LLM: 모의 LLM (API 키 없음) — 왼쪽 아래 🔑 API 키 에서 무료 키를 넣으면 실제 모델이 답합니다.')
    else:
        print(f'🤖 LLM: {p["label"]} · 모델 {model}')
    return name


# ------------------------------------------------------------------ 메시지 · 응답
def system(content):
    return {'role': 'system', 'content': content}


def user(content):
    return {'role': 'user', 'content': content}


def assistant(content, tool_calls=None):
    m = {'role': 'assistant', 'content': content}
    if tool_calls:
        m['tool_calls'] = [tc.to_dict() if isinstance(tc, ToolCall) else tc for tc in tool_calls]
    return m


def tool_result(call_id, name, content):
    return {'role': 'tool', 'tool_call_id': call_id, 'name': name, 'content': content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)}


class ToolCall:
    """LLM 이 요청한 도구 호출"""
    def __init__(self, name, args=None, id=None):
        self.name = name
        self.args = args or {}
        self.id = id or f'call_{name}_{int(time.time() * 1000) % 100000}'

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'args': self.args}

    def __repr__(self):
        return f'ToolCall({self.name}, {json.dumps(self.args, ensure_ascii=False)})'


class Usage:
    def __init__(self, prompt_tokens=0, completion_tokens=0):
        self.prompt_tokens = int(prompt_tokens or 0)
        self.completion_tokens = int(completion_tokens or 0)

    @property
    def total_tokens(self):
        return self.prompt_tokens + self.completion_tokens

    def __repr__(self):
        return f'Usage(prompt={self.prompt_tokens}, completion={self.completion_tokens})'


class Response:
    """LLM 응답: content(텍스트) · tool_calls(도구 호출 요청) · usage(토큰) · raw(원본)"""
    def __init__(self, content='', tool_calls=None, usage=None, raw=None, model=''):
        self.content = content or ''
        self.tool_calls = tool_calls or []
        self.usage = usage or Usage()
        self.raw = raw
        self.model = model

    @property
    def has_tool_calls(self):
        return bool(self.tool_calls)

    def json(self):
        """content 를 JSON 으로 해석 (```json … ``` 울타리도 허용)"""
        return parse_json(self.content)

    def message(self):
        """대화 기록에 넣을 assistant 메시지"""
        return assistant(self.content, self.tool_calls)

    def __str__(self):
        return self.content

    def __repr__(self):
        return f'Response(content={self.content[:40]!r}, tool_calls={self.tool_calls})'


def parse_json(text):
    """응답 텍스트에서 JSON 을 꺼낸다 (코드 울타리 · 앞뒤 설명 허용)"""
    if text is None:
        raise ValueError('빈 응답')
    s = str(text).strip()
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', s)
    if m:
        s = m.group(1).strip()
    try:
        return json.loads(s)
    except Exception:
        pass
    start = min([i for i in (s.find('{'), s.find('[')) if i >= 0] or [-1])
    if start >= 0:
        for end in range(len(s), start, -1):
            try:
                return json.loads(s[start:end])
            except Exception:
                continue
    raise ValueError('JSON 을 찾지 못했습니다: ' + s[:80])


# ------------------------------------------------------------------ LLM
class LLM:
    """공급자를 추상화한 LLM 클라이언트"""

    def __init__(self, provider=None, model=None, api_key=None, base_url=None, temperature=0.0, max_tokens=1024, verbose=False, mock_responses=None, **kw):
        if provider is None:
            provider = current_provider()
        provider = provider.lower()
        if provider not in PROVIDERS:
            raise ValueError(f"알 수 없는 공급자 '{provider}'. 사용 가능: {', '.join(PROVIDERS)}")
        p = PROVIDERS[provider]
        self.provider = provider
        env_model = os.environ.get('AGENTLAB_MODEL') if provider == current_provider() else None
        self.model = model or env_model or p['model']
        self.api_key = api_key or (os.environ.get(p['key_env']) if p['key_env'] else '')
        self.base_url = (base_url or os.environ.get('OLLAMA_URL') if provider == 'ollama' else base_url) or p['url']
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.verbose = verbose
        self.calls = 0
        self.total_usage = Usage()
        self._mock = None
        if provider != 'mock' and provider != 'ollama' and not self.api_key:
            raise ValueError(f"{p['label']} 의 API 키가 없습니다. LLM(api_key='...') 또는 🔑 API 키 메뉴에서 설정하세요.")
        if provider == 'mock':
            from .mock import MockLLM
            self._mock = MockLLM(responses=mock_responses, **kw)

    def __repr__(self):
        return f'LLM({self.provider}, {self.model})'

    # ---------------- 공개 API
    def ask(self, prompt, system_prompt=None, **kw):
        """한 번 묻고 텍스트만 받기"""
        msgs = ([system(system_prompt)] if system_prompt else []) + [user(prompt)]
        return self.chat(msgs, **kw).content

    def chat(self, messages, tools=None, json_mode=False, temperature=None, max_tokens=None, mode=None):
        """messages(list[dict]) → Response. tools 는 Tool 객체 또는 스키마 dict 목록"""
        if isinstance(messages, str):
            messages = [user(messages)]
        schemas = [t.schema() if hasattr(t, 'schema') else t for t in (tools or [])]
        temperature = self.temperature if temperature is None else temperature
        max_tokens = max_tokens or self.max_tokens
        self.calls += 1
        if self.verbose:
            last = messages[-1]
            print(f'  ↗ LLM 호출 #{self.calls} ({self.provider}/{self.model}) — {last["role"]}: {str(last.get("content", ""))[:60]!r}')
        if self._mock is not None:
            r = self._mock.chat(messages, schemas, json_mode=json_mode, mode=mode)
        elif self.provider == 'gemini':
            r = self._gemini(messages, schemas, json_mode, temperature, max_tokens)
        elif self.provider == 'anthropic':
            r = self._anthropic(messages, schemas, json_mode, temperature, max_tokens)
        else:
            r = self._openai(messages, schemas, json_mode, temperature, max_tokens)
        r.model = r.model or self.model
        self.total_usage.prompt_tokens += r.usage.prompt_tokens
        self.total_usage.completion_tokens += r.usage.completion_tokens
        if self.verbose:
            print(f'  ↙ 응답: {r.content[:60]!r}' + (f' 도구호출 {r.tool_calls}' if r.tool_calls else ''))
        return r

    def embed(self, texts):
        """텍스트 목록 → 임베딩 벡터 목록 (모의/오프라인이면 해시 임베딩)"""
        from .memory import Embedder
        return Embedder(self).embed(texts)

    # ---------------- OpenAI 호환 (openai · groq · openrouter · ollama)
    def _openai(self, messages, schemas, json_mode, temperature, max_tokens):
        msgs = []
        for m in messages:
            if m['role'] == 'assistant' and m.get('tool_calls'):
                msgs.append({'role': 'assistant', 'content': m.get('content') or None,
                             'tool_calls': [{'id': tc['id'], 'type': 'function', 'function': {'name': tc['name'], 'arguments': json.dumps(tc['args'], ensure_ascii=False)}} for tc in m['tool_calls']]})
            elif m['role'] == 'tool':
                msgs.append({'role': 'tool', 'tool_call_id': m['tool_call_id'], 'content': m['content']})
            else:
                msgs.append({'role': m['role'], 'content': m['content']})
        body = {'model': self.model, 'messages': msgs, 'temperature': temperature, 'max_tokens': max_tokens}
        if schemas:
            body['tools'] = [{'type': 'function', 'function': s} for s in schemas]
        if json_mode:
            body['response_format'] = {'type': 'json_object'}
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = 'Bearer ' + self.api_key
        if self.provider == 'openrouter':
            headers['HTTP-Referer'] = 'https://samcho93.github.io/studyAgent/'
            headers['X-Title'] = 'AI Agent Lab'
        st, text = _http.request(self.base_url.rstrip('/') + '/chat/completions', 'POST', headers, body)
        data = self._check(st, text)
        choice = data['choices'][0]['message']
        calls = []
        for tc in choice.get('tool_calls') or []:
            fn = tc.get('function', {})
            try:
                args = json.loads(fn.get('arguments') or '{}')
            except Exception:
                args = {'_raw': fn.get('arguments')}
            calls.append(ToolCall(fn.get('name', ''), args, tc.get('id')))
        u = data.get('usage') or {}
        return Response(choice.get('content') or '', calls, Usage(u.get('prompt_tokens'), u.get('completion_tokens')), data, data.get('model', ''))

    # ---------------- Gemini
    def _gemini(self, messages, schemas, json_mode, temperature, max_tokens):
        sys_parts, contents = [], []
        for m in messages:
            if m['role'] == 'system':
                sys_parts.append({'text': m['content']})
            elif m['role'] == 'user':
                contents.append({'role': 'user', 'parts': [{'text': m['content']}]})
            elif m['role'] == 'assistant':
                parts = []
                if m.get('content'):
                    parts.append({'text': m['content']})
                for tc in m.get('tool_calls') or []:
                    parts.append({'functionCall': {'name': tc['name'], 'args': tc['args']}})
                contents.append({'role': 'model', 'parts': parts or [{'text': ''}]})
            elif m['role'] == 'tool':
                try:
                    resp = json.loads(m['content'])
                    if not isinstance(resp, dict):
                        resp = {'result': resp}
                except Exception:
                    resp = {'result': m['content']}
                contents.append({'role': 'user', 'parts': [{'functionResponse': {'name': m.get('name', 'tool'), 'response': resp}}]})
        body = {'contents': contents, 'generationConfig': {'temperature': temperature, 'maxOutputTokens': max_tokens}}
        if sys_parts:
            body['systemInstruction'] = {'parts': sys_parts}
        if schemas:
            body['tools'] = [{'functionDeclarations': [self._gemini_schema(s) for s in schemas]}]
        if json_mode:
            body['generationConfig']['responseMimeType'] = 'application/json'
        url = f'{self.base_url}/models/{self.model}:generateContent?key={self.api_key}'
        st, text = _http.request(url, 'POST', {'Content-Type': 'application/json'}, body)
        data = self._check(st, text)
        cand = (data.get('candidates') or [{}])[0]
        parts = (cand.get('content') or {}).get('parts') or []
        content, calls = '', []
        for p in parts:
            if 'text' in p:
                content += p['text']
            if 'functionCall' in p:
                fc = p['functionCall']
                calls.append(ToolCall(fc.get('name', ''), fc.get('args') or {}))
        u = data.get('usageMetadata') or {}
        return Response(content, calls, Usage(u.get('promptTokenCount'), u.get('candidatesTokenCount')), data, data.get('modelVersion', ''))

    @staticmethod
    def _gemini_schema(s):
        params = dict(s.get('parameters') or {'type': 'object', 'properties': {}})
        params.pop('additionalProperties', None)
        return {'name': s['name'], 'description': s.get('description', ''), 'parameters': params}

    # ---------------- Anthropic
    def _anthropic(self, messages, schemas, json_mode, temperature, max_tokens):
        sys_text, msgs = [], []
        for m in messages:
            if m['role'] == 'system':
                sys_text.append(m['content'])
            elif m['role'] == 'user':
                msgs.append({'role': 'user', 'content': m['content']})
            elif m['role'] == 'assistant':
                blocks = []
                if m.get('content'):
                    blocks.append({'type': 'text', 'text': m['content']})
                for tc in m.get('tool_calls') or []:
                    blocks.append({'type': 'tool_use', 'id': tc['id'], 'name': tc['name'], 'input': tc['args']})
                msgs.append({'role': 'assistant', 'content': blocks or [{'type': 'text', 'text': '.'}]})
            elif m['role'] == 'tool':
                block = {'type': 'tool_result', 'tool_use_id': m['tool_call_id'], 'content': m['content']}
                if msgs and msgs[-1]['role'] == 'user' and isinstance(msgs[-1]['content'], list):
                    msgs[-1]['content'].append(block)
                else:
                    msgs.append({'role': 'user', 'content': [block]})
        if json_mode:
            sys_text.append('반드시 JSON 만 출력한다. 설명 문장이나 코드 울타리를 붙이지 않는다.')
        body = {'model': self.model, 'messages': msgs, 'max_tokens': max_tokens, 'temperature': temperature}
        if sys_text:
            body['system'] = '\n\n'.join(sys_text)
        if schemas:
            body['tools'] = [{'name': s['name'], 'description': s.get('description', ''), 'input_schema': s.get('parameters') or {'type': 'object', 'properties': {}}} for s in schemas]
        headers = {'Content-Type': 'application/json', 'x-api-key': self.api_key, 'anthropic-version': '2023-06-01',
                   'anthropic-dangerous-direct-browser-access': 'true'}
        st, text = _http.request(self.base_url.rstrip('/') + '/messages', 'POST', headers, body)
        data = self._check(st, text)
        content, calls = '', []
        for b in data.get('content') or []:
            if b.get('type') == 'text':
                content += b.get('text', '')
            elif b.get('type') == 'tool_use':
                calls.append(ToolCall(b.get('name', ''), b.get('input') or {}, b.get('id')))
        u = data.get('usage') or {}
        return Response(content, calls, Usage(u.get('input_tokens'), u.get('output_tokens')), data, data.get('model', ''))

    # ---------------- 공통
    def _check(self, st, text):
        if st == 0:
            raise ConnectionError(f'{PROVIDERS[self.provider]["label"]} 에 연결하지 못했습니다: {text[:200]}\n'
                                  '  · 인터넷 연결과 API 키를 확인하세요. Ollama 는 OLLAMA_ORIGINS=* 로 실행해야 브라우저에서 접근됩니다.')
        try:
            data = json.loads(text)
        except Exception:
            raise RuntimeError(f'응답을 해석하지 못했습니다 (HTTP {st}): {text[:200]}')
        if st < 200 or st >= 300:
            err = data.get('error') if isinstance(data, dict) else None
            msg = (err.get('message') if isinstance(err, dict) else err) or text[:200]
            hint = ''
            if st in (401, 403):
                hint = ' — API 키가 잘못되었거나 만료되었습니다.'
            elif st == 429:
                hint = ' — 요청 한도(무료 등급) 초과. 잠시 뒤 다시 시도하세요.'
            elif st == 404:
                hint = ' — 모델 이름을 확인하세요.'
            raise RuntimeError(f'LLM 오류 (HTTP {st}){hint}: {msg}')
        return data
