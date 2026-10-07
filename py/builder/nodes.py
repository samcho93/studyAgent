"""노드 카탈로그 — 각 노드의 **정의(포트 · 속성) · 실행(run) · 파이썬 코드 내보내기(export)** 를 한곳에 둔다

노드 하나 = NodeType 객체. 브라우저(팔레트 · 속성 패널)는 spec() 으로 만든 JSON 을 쓰고,
실행 엔진(engine.py)은 run(ctx) 를, 코드 내보내기(export.py)는 export(ectx) 를 부른다.

포트 kind: text(문자열 · 어떤 값이든) · llm · tool · memory · agent · task
속성 type: text · textarea · code · number · select · bool · secret(API 키 → key_ref 로만 저장) · routes · docs
"""
import json
import re

import agentlab as al

from . import providers

REGISTRY = {}
CATEGORIES = [
    {'id': 'io', 'label': '입출력', 'color': '#5b8def'},
    {'id': 'model', 'label': 'LLM 모델', 'color': '#a16207'},
    {'id': 'tool', 'label': '도구', 'color': '#0f9d8a'},
    {'id': 'agent', 'label': '에이전트', 'color': '#7c3aed'},
    {'id': 'memory', 'label': '기억', 'color': '#d9488b'},
    {'id': 'flow', 'label': '흐름 제어', 'color': '#e8771e'},
    {'id': 'team', 'label': '에이전트 팀', 'color': '#2563eb'},
    {'id': 'safety', 'label': '평가 · 안전', 'color': '#dc2626'},
]
BUILTIN_TOOLS = ['calculator', 'get_weather', 'wiki_search', 'now', 'read_file', 'write_file', 'remember_note']
TOOL_DESC = {
    'calculator': '수식 계산 (사칙연산 · sqrt · 퍼센트)', 'get_weather': '도시의 현재 날씨 (Open-Meteo, 키 불필요)',
    'wiki_search': '위키백과 검색 요약 (키 불필요)', 'now': '현재 날짜 · 시각', 'read_file': '작업 폴더 파일 읽기',
    'write_file': '작업 폴더 파일 쓰기', 'remember_note': '메모 저장',
}


def P(name, label, kind='text', multi=False, required=False):
    return {'name': name, 'label': label, 'kind': kind, 'multi': multi, 'required': required}


def F(name, label, type='text', default='', **kw):
    d = {'name': name, 'label': label, 'type': type, 'default': default}
    d.update(kw)
    return d


class NodeType:
    def __init__(self, type, label, category, icon, desc, inputs=(), outputs=(), fields=(), doc='', dynamic=None, run=None, export=None, width=None):
        self.type = type
        self.label = label
        self.category = category
        self.icon = icon
        self.desc = desc
        self.inputs = list(inputs)
        self.outputs = list(outputs)
        self.fields = list(fields)
        self.doc = doc
        self.dynamic = dynamic      # 'router' | 'template' | None — 포트가 속성에 따라 바뀌는 노드
        self._run = run
        self._export = export
        self.width = width

    def spec(self):
        return {'type': self.type, 'label': self.label, 'category': self.category, 'icon': self.icon, 'desc': self.desc,
                'inputs': self.inputs, 'outputs': self.outputs, 'fields': self.fields, 'doc': self.doc, 'dynamic': self.dynamic, 'width': self.width}

    def defaults(self):
        return {f['name']: f.get('default', '') for f in self.fields}

    def run(self, ctx):
        return self._run(ctx) if self._run else {}

    def export(self, ectx):
        return self._export(ectx) if self._export else []


def node(**kw):
    """데코레이터: run 함수를 NodeType 으로 등록. export 는 .export 로 뒤에 붙인다"""
    def deco(fn):
        nt = NodeType(run=fn, **kw)
        REGISTRY[nt.type] = nt

        def export_deco(efn):
            nt._export = efn
            return efn
        fn.export = export_deco
        fn.nodetype = nt
        return fn
    return deco


def catalog():
    """브라우저용 카탈로그 JSON"""
    return {'categories': CATEGORIES, 'nodes': [n.spec() for n in REGISTRY.values()],
            'providers': providers.public_table(), 'tools': [{'name': t, 'desc': TOOL_DESC[t]} for t in BUILTIN_TOOLS]}


# ====================================================================== 공통 도우미
def fmt(template, values):
    """{이름} 을 values 로 채운다. 없는 이름은 빈 문자열, 중괄호 오류는 그대로 둔다"""
    def rep(m):
        k = m.group(1)
        v = values.get(k, '')
        return '' if v is None else (v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, default=str))
    return re.sub(r'{(\w+)}', rep, str(template or ''))


def to_text(v):
    if v is None:
        return ''
    if isinstance(v, str):
        return v
    try:
        return json.dumps(v, ensure_ascii=False, indent=2, default=str)
    except Exception:
        return str(v)


def dynamic_inputs(nt, config):
    """속성에 따라 바뀌는 입력 포트 (template 노드 등)"""
    if nt.dynamic == 'template':
        names = []
        for m in re.finditer(r'{(\w+)}', str(config.get('template', ''))):
            if m.group(1) not in names:
                names.append(m.group(1))
        return [P(n, n, 'text') for n in names] or [P('input', 'input', 'text')]
    return nt.inputs


def dynamic_outputs(nt, config):
    if nt.dynamic == 'router':
        routes = config.get('routes') or []
        outs = [P(r['label'], r['label'], 'text') for r in routes if r.get('label')]
        outs.append(P('__default__', config.get('default_label') or '기타', 'text'))
        return outs
    return nt.outputs


def route_keywords(text, routes, default='__default__'):
    t = str(text or '').lower()
    for r in routes:
        for k in [x.strip().lower() for x in str(r.get('keywords', '')).split(',') if x.strip()]:
            if k in t:
                return r['label']
    return default


def route_llm(llm, text, labels, default='__default__'):
    labels_s = ', '.join(labels)
    r = llm.chat([al.system(f'너는 분류기다. 입력을 다음 범주 중 하나로 분류한다: {labels_s}. 반드시 JSON {{"label": "..."}} 로만 답한다.'),
                  al.user(str(text))], json_mode=True)
    try:
        lab = str(r.json().get('label', '')).strip()
    except Exception:
        lab = r.content.strip()
    for l in labels:
        if l == lab or l in lab:
            return l
    return default


def guard_check(text, banned, max_len):
    t = str(text or '')
    hits = [b for b in banned if b and b.lower() in t.lower()]
    if hits:
        return False, f'금지어 포함: {", ".join(hits)}'
    if max_len and len(t) > max_len:
        return False, f'길이 초과: {len(t)} > {max_len}'
    return True, ''


def exec_function(code, name=None, extra=None):
    """사용자 코드에서 함수 하나를 꺼낸다 (name 이 없으면 마지막에 정의된 함수)"""
    ns = {'al': al, 'agentlab': al, 'json': json, 're': re}
    ns.update(extra or {})
    exec(compile(code, '<node>', 'exec'), ns)
    if name and callable(ns.get(name)):
        return ns[name]
    fns = [v for k, v in ns.items() if callable(v) and getattr(v, '__module__', None) is None and k not in ('al', 'agentlab')]
    if not fns:
        raise ValueError('코드에 함수 정의(def …)가 없습니다')
    return fns[-1]


HELPERS = {
    'fmt': '''def fmt(template, values):
    """{이름} 을 values 로 채운다 (없는 이름은 빈 문자열)"""
    def rep(m):
        v = values.get(m.group(1), '')
        return '' if v is None else (v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, default=str))
    return re.sub(r'{(\\w+)}', rep, str(template or ''))''',
    'route_keywords': '''def route_keywords(text, routes, default='__default__'):
    """키워드 규칙으로 분기 라벨을 고른다"""
    t = str(text or '').lower()
    for label, keywords in routes:
        if any(k.strip().lower() in t for k in keywords.split(',') if k.strip()):
            return label
    return default''',
    'route_llm': '''def route_llm(llm, text, labels, default='__default__'):
    """LLM 에게 분류를 맡긴다 → 라벨"""
    r = llm.chat([al.system('너는 분류기다. 입력을 다음 범주 중 하나로 분류한다: ' + ', '.join(labels) + '. 반드시 JSON {"label": "..."} 로만 답한다.'), al.user(str(text))], json_mode=True)
    try:
        lab = str(r.json().get('label', '')).strip()
    except Exception:
        lab = r.content.strip()
    for l in labels:
        if l == lab or l in lab:
            return l
    return default''',
    'guard_check': '''def guard_check(text, banned, max_len):
    """가드레일: 금지어 · 길이 검사 → (통과?, 이유)"""
    t = str(text or '')
    hits = [b for b in banned if b and b.lower() in t.lower()]
    if hits:
        return False, '금지어 포함: ' + ', '.join(hits)
    if max_len and len(t) > max_len:
        return False, f'길이 초과: {len(t)} > {max_len}'
    return True, \'\'''',
    'first': '''def first(*values):
    """비어 있지 않은 첫 값"""
    for v in values:
        if v not in (None, '', [], {}):
            return v
    return None''',
    'to_text': '''def to_text(v):
    if v is None:
        return ''
    return v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, indent=2, default=str)''',
}


def q(s):
    """파이썬 문자열 리터럴 (여러 줄이면 삼중 따옴표)"""
    s = '' if s is None else str(s)
    if '\n' in s and '"""' not in s and not s.endswith('"'):
        return '"""' + s.replace('\\', '\\\\') + '"""'
    return repr(s)


# ====================================================================== 입출력
@node(type='input', label='시작 입력', category='io', icon='▶', desc='사용자의 질문 · 작업 지시. 실행할 때 입력 창에서 바꿀 수 있다.',
      outputs=[P('text', '텍스트')],
      fields=[F('text', '기본 입력', 'textarea', '안녕하세요! 자기소개를 한 문장으로 해줘', rows=4, help='실행 패널에서 다른 값을 입력하면 그 값이 쓰인다'),
              F('name', '변수 이름', 'text', 'question', help='내보낸 코드의 변수 이름 (영문)')],
      doc='그래프의 시작점. 하나의 그래프에 여러 개를 둘 수 있으며, 첫 번째 입력은 내보낸 코드에서 <code>sys.argv[1]</code> 로도 받는다.')
def run_input(ctx):
    text = ctx.override if ctx.override is not None else ctx.get('text')
    return {'text': text}


@run_input.export
def export_input(e):
    if e.index_of_type == 0:
        return [f"{e.var} = sys.argv[1] if len(sys.argv) > 1 else {q(e.get('text'))}"]
    return [f"{e.var} = {q(e.get('text'))}"]


@node(type='output', label='결과', category='io', icon='🏁', desc='최종 결과를 결과 패널에 보여 준다.',
      inputs=[P('value', '값', required=True)], fields=[F('title', '제목', 'text', '결과')],
      doc='여러 개를 두면 각각의 결과가 모두 표시된다. 내보낸 코드에서는 <code>print()</code> 가 된다.')
def run_output(ctx):
    v = ctx.inp('value')
    ctx.result(ctx.get('title') or '결과', v)
    return {}


@run_output.export
def export_output(e):
    e.helper('to_text')
    return [f"print('\\n=== {e.get('title') or '결과'} ===')", f"print(to_text({e.expr('value')}))"]


@node(type='text', label='텍스트', category='io', icon='📝', desc='고정 문장 · 문서 · 예시 데이터.',
      outputs=[P('text', '텍스트')], fields=[F('text', '내용', 'textarea', '', rows=6)],
      doc='시스템 프롬프트, 참고 문서, 초안처럼 고정된 텍스트를 다른 노드에 넣을 때 쓴다.')
def run_text(ctx):
    return {'text': ctx.get('text')}


@run_text.export
def export_text(e):
    return [f"{e.var} = {q(e.get('text'))}"]


@node(type='template', label='프롬프트 템플릿', category='io', icon='🧩', desc='{이름} 자리에 입력값을 채워 하나의 텍스트로 만든다.',
      dynamic='template', outputs=[P('text', '텍스트')],
      fields=[F('template', '템플릿', 'textarea', '다음 글을 요약해줘:\n\n{input}', rows=6, help='{이름} 을 쓰면 그 이름의 입력 포트가 생긴다')],
      doc='LangChain 의 <code>PromptTemplate</code> 에 해당한다. 여러 노드의 출력을 하나의 프롬프트로 합칠 때 쓴다.')
def run_template(ctx):
    return {'text': fmt(ctx.get('template'), ctx.inputs)}


@run_template.export
def export_template(e):
    e.helper('fmt')
    vals = ', '.join(f"{q(k)}: {e.expr(k)}" for k in e.inputs)
    return [f"{e.var} = fmt({q(e.get('template'))}, {{{vals}}})"]


@node(type='note', label='메모', category='io', icon='🗒', desc='설명용 메모 (실행에 영향 없음).',
      fields=[F('text', '메모', 'textarea', '여기에 설명을 적으세요', rows=5)], width=240)
def run_note(ctx):
    return {}


# ====================================================================== LLM
@node(type='llm', label='LLM 모델', category='model', icon='🧠', desc='어떤 모델을 쓸지 정한다. API 키는 여기서 한 번만 등록한다.',
      outputs=[P('llm', 'LLM', 'llm')],
      fields=[F('provider', '공급자', 'select', 'mock', options='providers'),
              F('model', '모델', 'text', '', placeholder='(비우면 기본 모델)', options='models'),
              F('key_ref', 'API 키', 'secret', '', help='키는 서버(또는 브라우저 세션)에만 저장되고 그래프에는 이름만 남는다'),
              F('base_url', 'API 주소', 'text', '', placeholder='(비우면 기본 주소)', help='Ollama · LM Studio · 사용자 정의 서버'),
              F('temperature', 'temperature', 'number', 0, min=0, max=2, step=0.1),
              F('max_tokens', '최대 토큰', 'number', 1024, min=64, max=32000, step=64)],
      doc='모든 LLM 호출 · 에이전트 노드는 이 노드의 <b>LLM</b> 출력을 입력으로 받는다. 하나의 LLM 노드를 여러 노드에 연결해도 된다.'
          '<br>🔑 <b>키 노출 방지</b>: 키를 입력하면 <code>/api/keys</code> 로 한 번 전송되어 암호화 저장되고, 노드에는 <code>key_ref</code>(이름)만 남는다. '
          '실행 시 LLM 요청은 서버 프록시가 키를 끼워 보낸다. 내보낸 코드는 환경 변수에서 키를 읽는다.')
def run_llm(ctx):
    pid = ctx.get('provider') or 'mock'
    p = providers.info(pid)
    key = ctx.key(ctx.get('key_ref'), pid) if p['env'] else ''
    model = (ctx.get('model') or '').strip() or p['model']
    if p['env'] and not key:
        if pid == 'custom':
            key = ''
        else:
            ctx.log(f"⚠ {p['label']} 키가 없어 모의 LLM 으로 실행합니다 (LLM 노드의 🔑 API 키 칸에 키를 저장하세요)")
            return {'llm': al.LLM('mock', temperature=float(ctx.get('temperature') or 0), verbose=True)}
    llm = providers.make_llm(pid, model=model, api_key=key, base_url=(ctx.get('base_url') or '').strip() or None,
                             temperature=float(ctx.get('temperature') or 0), max_tokens=int(ctx.get('max_tokens') or 1024), verbose=True)
    ctx.log(f"🧠 {p['label']} · {model}" if pid != 'mock' else '🧠 모의 LLM (키 없음 · 항상 같은 답)')
    return {'llm': llm}


@run_llm.export
def export_llm(e):
    pid = e.get('provider') or 'mock'
    e.provider(pid)
    args = [q(pid)]
    if (e.get('model') or '').strip():
        args.append(f"model={q(e.get('model').strip())}")
    if (e.get('base_url') or '').strip():
        args.append(f"base_url={q(e.get('base_url').strip())}")
    if float(e.get('temperature') or 0):
        args.append(f"temperature={float(e.get('temperature'))}")
    if int(e.get('max_tokens') or 1024) != 1024:
        args.append(f"max_tokens={int(e.get('max_tokens'))}")
    return [f"{e.var} = make_llm({', '.join(args)})"]


@node(type='chat', label='LLM 호출', category='model', icon='💬', desc='프롬프트 한 번 → 답 한 번. 체인의 기본 단위.',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('input', '입력'), P('context', '참고')],
      outputs=[P('text', '답변'), P('json', 'JSON')],
      fields=[F('system', '시스템 프롬프트(역할)', 'textarea', '당신은 친절하고 정확한 비서입니다.', rows=3),
              F('prompt', '프롬프트', 'textarea', '{input}', rows=5, help='{input} {context} 자리에 입력이 들어간다'),
              F('json_mode', 'JSON 으로 답하게', 'bool', False)],
      doc='LangChain 의 <code>prompt | llm | StrOutputParser()</code> 체인과 같다. JSON 모드를 켜면 <b>JSON</b> 포트로 파싱된 객체가 나온다 (구조화 출력).')
def run_chat(ctx):
    llm = ctx.llm()
    prompt = fmt(ctx.get('prompt') or '{input}', {'input': to_text(ctx.inp('input')), 'context': to_text(ctx.inp('context'))})
    msgs = ([al.system(ctx.get('system'))] if ctx.get('system') else []) + [al.user(prompt)]
    r = llm.chat(msgs, json_mode=bool(ctx.get('json_mode')))
    out = {'text': r.content, 'json': None}
    if ctx.get('json_mode'):
        try:
            out['json'] = r.json()
        except Exception as ex:  # noqa
            ctx.log(f'⚠ JSON 해석 실패: {ex}')
    ctx.usage(llm)
    return out


@run_chat.export
def export_chat(e):
    e.helper('fmt')
    e.helper('to_text')
    sysp = f"[al.system({q(e.get('system'))})] + " if e.get('system') else ''
    lines = [f"{e.var}_prompt = fmt({q(e.get('prompt') or '{input}')}, {{'input': to_text({e.expr('input')}), 'context': to_text({e.expr('context')})}})",
             f"{e.var}_resp = {e.expr('llm')}.chat({sysp}[al.user({e.var}_prompt)]{', json_mode=True' if e.get('json_mode') else ''})",
             f"{e.var} = {e.var}_resp.content"]
    if e.get('json_mode'):
        lines.append(f"{e.var}_json = {e.var}_resp.json()")
    return lines


# ====================================================================== 도구
@node(type='tool', label='내장 도구', category='tool', icon='🔧', desc='계산기 · 날씨 · 위키 검색 · 시각 · 파일 · 메모.',
      outputs=[P('tool', '도구', 'tool')],
      fields=[F('name', '도구', 'select', 'calculator', options=[{'value': t, 'label': f'{t} — {TOOL_DESC[t]}'} for t in BUILTIN_TOOLS])],
      doc='agentlab 에 내장된 도구. 에이전트 노드의 <b>도구</b> 포트에 여러 개를 연결한다. 날씨 · 위키는 키 없이 실제 API 를 호출한다.')
def run_tool(ctx):
    name = ctx.get('name')
    if name not in BUILTIN_TOOLS:
        raise ValueError(f'알 수 없는 내장 도구: {name}')
    return {'tool': getattr(al, name)}


@run_tool.export
def export_tool(e):
    return [f"{e.var} = al.{e.get('name')}"]


PYTOOL_DEFAULT = '''def get_stock_price(symbol: str) -> dict:
    """주식 종목의 현재 가격을 알려준다 (예시 데이터)
    symbol: 종목 코드 (예: AAPL)
    """
    prices = {'AAPL': 189.5, 'MSFT': 415.2, 'TSLA': 248.1}
    return {'symbol': symbol.upper(), 'price': prices.get(symbol.upper(), 100.0), 'currency': 'USD'}
'''


@node(type='pytool', label='파이썬 도구', category='tool', icon='🐍', desc='파이썬 함수를 직접 써서 도구로 만든다.',
      outputs=[P('tool', '도구', 'tool')],
      fields=[F('code', '함수 코드', 'code', PYTOOL_DEFAULT, rows=12, help='docstring 첫 줄 = 설명, "인자: 설명" 줄 = 매개변수 설명, 타입 힌트 = 스키마')],
      doc='<code>@al.tool</code> 데코레이터와 같다. 함수 이름 · docstring · 타입 힌트가 LLM 에게 보내는 JSON 스키마가 된다. (브라우저 안 파이썬에서 실행된다)', width=300)
def run_pytool(ctx):
    fn = exec_function(ctx.get('code'))
    t = al.tool(fn)
    ctx.log(f'🐍 도구 정의: {t.describe()}')
    return {'tool': t}


@run_pytool.export
def export_pytool(e):
    code = e.get('code').rstrip()
    m = re.search(r'^def\s+(\w+)\s*\(', code, re.M)
    name = m.group(1) if m else e.var
    e.define('@al.tool\n' + code)
    return [f"{e.var} = {name}"]


# ====================================================================== 에이전트
AGENT_FIELDS = [F('system', '시스템 프롬프트(역할)', 'textarea', '당신은 도구를 활용해 정확하게 답하는 비서입니다. 모르는 정보는 도구로 확인하세요.', rows=4),
                F('max_steps', '최대 단계', 'number', 6, min=1, max=20)]


@node(type='agent', label='에이전트', category='agent', icon='🤖', desc='LLM 이 도구를 골라 호출하고 결과를 보고 답하는 루프 (Tool Calling).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('tools', '도구', 'tool', multi=True), P('input', '입력', required=True), P('memory', '기억', 'memory'), P('skills', '스킬', 'skill', multi=True)],
      outputs=[P('text', '답변'), P('trace', '단계 기록')],
      fields=AGENT_FIELDS,
      doc='<b>판단(LLM) → 행동(도구) → 관찰(결과) → … → 답</b> 의 에이전트 루프. 기억 노드를 연결하면 이전 대화를 이어 간다. '
          'agentlab 의 <code>al.Agent(llm, tools, system).run(question)</code>.')
def run_agent(ctx):
    llm = ctx.llm()
    tools = ctx.inp('tools') or []
    mem = ctx.inp('memory')
    system = ctx.get('system') or None
    question = to_text(ctx.inp('input'))
    if ctx.inp('skills'):
        from . import skills as _S
        system, tools, _ = _S.SkillSet(ctx.inp('skills')).apply(question, system or '', tools, llm=llm, mode='auto', log=ctx.log)
    agent = al.Agent(llm, tools=tools, system=system, memory=mem, max_steps=int(ctx.get('max_steps') or 6), verbose=True)
    ans = agent.run(question)
    ctx.usage(llm)
    return {'text': ans, 'trace': [{'kind': s.kind, **{k: v for k, v in s.data.items()}} for s in agent.steps]}


@run_agent.export
def export_agent(e):
    e.helper('to_text')
    mem = f", memory={e.expr('memory')}" if e.connected('memory') else ''
    if e.connected('skills'):
        e.helper('skills')
        return [f"{e.var}_question = to_text({e.expr('input')})",
                f"{e.var}_system, {e.var}_tools, {e.var}_skills = skills_apply({e.list_expr('skills')}, {e.var}_question, {q(e.get('system'))}, {e.list_expr('tools')}, llm={e.expr('llm')})",
                f"{e.var}_agent = al.Agent({e.expr('llm')}, tools={e.var}_tools, system={e.var}_system, max_steps={int(e.get('max_steps') or 6)}{mem}, verbose=True)",
                f"{e.var} = {e.var}_agent.run({e.var}_question)",
                f"{e.var}_trace = {e.var}_agent.steps"]
    return [f"{e.var}_agent = al.Agent({e.expr('llm')}, tools={e.list_expr('tools')}, system={q(e.get('system')) if e.get('system') else None}, max_steps={int(e.get('max_steps') or 6)}{mem}, verbose=True)",
            f"{e.var} = {e.var}_agent.run(to_text({e.expr('input')}))",
            f"{e.var}_trace = {e.var}_agent.steps"]


@node(type='react', label='ReAct 에이전트', category='agent', icon='🧭', desc='Thought → Action → Observation 텍스트 형식의 에이전트 (함수 호출 API 없이도 동작).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('tools', '도구', 'tool', multi=True), P('input', '입력', required=True)],
      outputs=[P('text', '답변'), P('transcript', '전체 기록')],
      fields=[F('system', '추가 지시', 'textarea', '', rows=3), F('max_steps', '최대 단계', 'number', 6, min=1, max=20)],
      doc='ReAct(Reasoning + Acting) 논문의 원리를 그대로 보여 주는 에이전트. 생각 · 행동 · 관찰이 모두 텍스트로 찍힌다.')
def run_react(ctx):
    llm = ctx.llm()
    a = al.ReActAgent(llm, tools=ctx.inp('tools') or [], max_steps=int(ctx.get('max_steps') or 6), verbose=True, system=ctx.get('system') or None)
    ans = a.run(to_text(ctx.inp('input')))
    ctx.usage(llm)
    return {'text': ans, 'transcript': a.transcript}


@run_react.export
def export_react(e):
    e.helper('to_text')
    return [f"{e.var}_agent = al.ReActAgent({e.expr('llm')}, tools={e.list_expr('tools')}, max_steps={int(e.get('max_steps') or 6)}, system={q(e.get('system')) if e.get('system') else None}, verbose=True)",
            f"{e.var} = {e.var}_agent.run(to_text({e.expr('input')}))",
            f"{e.var}_transcript = {e.var}_agent.transcript"]


@node(type='planner', label='계획 세우기', category='agent', icon='🗺️', desc='목표를 단계 목록으로 쪼갠다 (Plan).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('input', '목표', required=True), P('context', '참고')],
      outputs=[P('steps', '단계 목록'), P('text', '텍스트')],
      fields=[F('max_steps', '최대 단계 수', 'number', 5, min=1, max=12)],
      doc='Plan-and-Execute 의 계획 부분. 출력 <b>단계 목록</b>(list)은 파이썬 노드나 템플릿에서 쓸 수 있다.')
def run_planner(ctx):
    llm = ctx.llm()
    steps = al.Planner(llm, max_steps=int(ctx.get('max_steps') or 5)).plan(to_text(ctx.inp('input')), context=to_text(ctx.inp('context')))
    for i, s in enumerate(steps, 1):
        ctx.log(f'📌 {i}. {s}')
    ctx.usage(llm)
    return {'steps': steps, 'text': '\n'.join(f'{i}. {s}' for i, s in enumerate(steps, 1))}


@run_planner.export
def export_planner(e):
    e.helper('to_text')
    return [f"{e.var} = al.Planner({e.expr('llm')}, max_steps={int(e.get('max_steps') or 5)}).plan(to_text({e.expr('input')}), context=to_text({e.expr('context')}))",
            f"{e.var}_text = '\\n'.join(f'{{i}}. {{s}}' for i, s in enumerate({e.var}, 1))"]


@node(type='plan_execute', label='계획 후 실행', category='agent', icon='📋', desc='계획을 세우고 단계마다 도구 에이전트가 실행한다 (Plan-and-Execute).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('tools', '도구', 'tool', multi=True), P('input', '목표', required=True)],
      outputs=[P('text', '최종 결과'), P('results', '단계별 결과')],
      fields=[F('max_steps', '최대 단계 수', 'number', 4, min=1, max=10),
              F('system', '실행자 역할', 'textarea', '당신은 주어진 한 단계를 도구를 써서 정확히 수행하는 실행자입니다. 이전 단계 결과를 참고하세요.', rows=3)],
      doc='<code>al.Planner(llm).execute(goal, worker)</code>. 각 단계는 <code>al.Agent</code> 가 도구를 써서 수행하고, 마지막 단계 결과가 최종 결과가 된다.')
def run_plan_execute(ctx):
    llm = ctx.llm()
    tools = ctx.inp('tools') or []
    goal = to_text(ctx.inp('input'))

    def worker(step, previous):
        prev = '\n'.join(f"- {r['step']}: {to_text(r['result'])[:300]}" for r in previous)
        a = al.Agent(llm, tools=tools, system=ctx.get('system') or None, max_steps=4, verbose=True)
        return a.run(f'목표: {goal}\n현재 단계: {step}' + (f'\n\n[이전 단계 결과]\n{prev}' if prev else ''))
    results = al.Planner(llm, max_steps=int(ctx.get('max_steps') or 4)).execute(goal, worker, verbose=True)
    ctx.usage(llm)
    return {'text': results[-1]['result'] if results else '', 'results': results}


@run_plan_execute.export
def export_plan_execute(e):
    e.helper('to_text')
    return [f"{e.var}_goal = to_text({e.expr('input')})",
            f"def {e.var}_worker(step, previous):",
            f"    prev = '\\n'.join(f\"- {{r['step']}}: {{to_text(r['result'])[:300]}}\" for r in previous)",
            f"    agent = al.Agent({e.expr('llm')}, tools={e.list_expr('tools')}, system={q(e.get('system')) if e.get('system') else None}, max_steps=4, verbose=True)",
            f"    return agent.run(f'목표: {{{e.var}_goal}}\\n현재 단계: {{step}}' + (f'\\n\\n[이전 단계 결과]\\n{{prev}}' if prev else ''))",
            f"{e.var}_results = al.Planner({e.expr('llm')}, max_steps={int(e.get('max_steps') or 4)}).execute({e.var}_goal, {e.var}_worker, verbose=True)",
            f"{e.var} = {e.var}_results[-1]['result'] if {e.var}_results else ''"]


@node(type='reflector', label='비평 · 수정', category='agent', icon='🔍', desc='초안을 비평하고 고치기를 반복한다 (Reflection · Self-Correction).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('input', '초안', required=True), P('criteria', '기준')],
      outputs=[P('text', '수정본'), P('feedback', '마지막 비평')],
      fields=[F('rounds', '반복 횟수', 'number', 1, min=1, max=5), F('criteria', '검토 기준', 'text', '정확성 · 명확성 · 구체성'),
              F('critic_system', '검토자 역할', 'textarea', '너는 꼼꼼한 검토자다. 결과물의 문제점을 구체적으로 지적한다.', rows=2),
              F('writer_system', '작가 역할', 'textarea', '너는 피드백을 반영해 글을 고치는 작가다.', rows=2)],
      doc='<code>al.Reflector(llm).improve(text, rounds)</code>. 검토자와 작가 역할을 LLM 하나가 번갈아 맡는다.')
def run_reflector(ctx):
    llm = ctx.llm()
    kw = {k: ctx.get(k) for k in ('critic_system', 'writer_system') if ctx.get(k)}
    rf = al.Reflector(llm, **kw)
    crit = to_text(ctx.inp('criteria')) or ctx.get('criteria') or ''
    cur = to_text(ctx.inp('input'))
    fb = ''
    for i in range(1, int(ctx.get('rounds') or 1) + 1):
        fb = rf.critique(cur, crit)
        ctx.log(f'🔍 검토 {i}: {fb[:200]}')
        cur = rf.revise(cur, fb)
        ctx.log(f'✏️ 수정 {i}: {cur[:200]}')
    ctx.usage(llm)
    return {'text': cur, 'feedback': fb}


@run_reflector.export
def export_reflector(e):
    e.helper('to_text')
    crit = f"to_text({e.expr('criteria')}) or {q(e.get('criteria'))}" if e.connected('criteria') else q(e.get('criteria'))
    return [f"{e.var}_ref = al.Reflector({e.expr('llm')}, critic_system={q(e.get('critic_system'))}, writer_system={q(e.get('writer_system'))})",
            f"{e.var}, {e.var}_feedback = to_text({e.expr('input')}), ''",
            f"for _round in range({int(e.get('rounds') or 1)}):   # 비평 → 수정 반복",
            f"    {e.var}_feedback = {e.var}_ref.critique({e.var}, {crit})",
            f"    print('🔍 검토:', {e.var}_feedback[:120])",
            f"    {e.var} = {e.var}_ref.revise({e.var}, {e.var}_feedback)"]


# ====================================================================== 기억
@node(type='memory', label='대화 기억', category='memory', icon='🧠', desc='이전 대화를 기억한다 (단기 기억 · 요약 기억). 실행을 반복해도 유지된다.',
      inputs=[P('llm', 'LLM(요약용)', 'llm')], outputs=[P('memory', '기억', 'memory')],
      fields=[F('kind', '종류', 'select', 'conversation', options=[{'value': 'conversation', 'label': '대화 창(window) — 최근 N 턴'}, {'value': 'summary', 'label': '요약 기억 — 오래된 대화를 LLM 이 요약'}]),
              F('window', '유지할 메시지 수', 'number', 6, min=2, max=40)],
      doc='에이전트 노드의 <b>기억</b> 포트에 연결한다. ▶ 실행을 여러 번 해도 같은 세션 안에서는 기억이 이어진다 (🧹 기억 지우기로 초기화). '
          '요약 기억은 LLM 입력이 필요하다.')
def run_memory(ctx):
    kind = ctx.get('kind') or 'conversation'
    key = f"{kind}:{ctx.get('window')}"
    if ctx.state.get('key') != key or 'mem' not in ctx.state:
        if kind == 'summary':
            llm = ctx.inp('llm') or al.LLM('mock')
            ctx.state['mem'] = al.SummaryMemory(llm, window=int(ctx.get('window') or 4))
        else:
            ctx.state['mem'] = al.ConversationMemory(window=int(ctx.get('window') or 6))
        ctx.state['key'] = key
    mem = ctx.state['mem']
    ctx.log(f'🧠 기억: {len(mem.history)}개 메시지 보관 중')
    return {'memory': mem}


@run_memory.export
def export_memory(e):
    if (e.get('kind') or 'conversation') == 'summary':
        return [f"{e.var} = al.SummaryMemory({e.expr('llm') if e.connected('llm') else 'al.LLM()'}, window={int(e.get('window') or 4)})"]
    return [f"{e.var} = al.ConversationMemory(window={int(e.get('window') or 6)})"]


@node(type='vectorstore', label='문서 검색 (RAG)', category='memory', icon='📚', desc='문서를 벡터 저장소에 넣고 질문과 비슷한 부분을 찾는다 (장기 기억).',
      inputs=[P('query', '질문', required=True), P('llm', 'LLM(임베딩)', 'llm')],
      outputs=[P('context', '찾은 문맥'), P('hits', '검색 결과')],
      fields=[F('documents', '문서 (빈 줄로 구분)', 'textarea', '우리 회사의 연차는 1년에 15일이다.\n\n점심 시간은 12시부터 1시까지다.\n\n재택근무는 주 2회까지 가능하며 팀장 승인이 필요하다.', rows=8),
              F('k', '찾을 개수', 'number', 2, min=1, max=10)],
      doc='<code>al.VectorStore</code>. 키가 없으면 해시 임베딩(오프라인), Gemini · OpenAI 키가 있으면 실제 임베딩을 쓴다. '
          '찾은 문맥을 <b>LLM 호출</b> 노드의 참고 포트에 넣으면 RAG 가 된다.')
def run_vectorstore(ctx):
    docs = [d.strip() for d in re.split(r'\n\s*\n', str(ctx.get('documents') or '')) if d.strip()]
    sig = json.dumps(docs, ensure_ascii=False)
    if ctx.state.get('sig') != sig:
        llm = ctx.inp('llm')
        vs = al.VectorStore(al.Embedder(llm) if llm is not None else None)
        vs.add_many(docs)
        ctx.state['store'] = vs
        ctx.state['sig'] = sig
        ctx.log(f'📚 문서 {len(docs)}개 저장')
    vs = ctx.state['store']
    hits = vs.search(to_text(ctx.inp('query')), k=int(ctx.get('k') or 2))
    for sc, text, _ in hits:
        ctx.log(f'🔎 {sc:.2f} {text[:80]}')
    return {'context': '\n'.join(t for _, t, _ in hits), 'hits': [{'score': round(s, 3), 'text': t} for s, t, _ in hits]}


@run_vectorstore.export
def export_vectorstore(e):
    e.helper('to_text')
    docs = [d.strip() for d in re.split(r'\n\s*\n', str(e.get('documents') or '')) if d.strip()]
    emb = f"al.Embedder({e.expr('llm')})" if e.connected('llm') else ''
    return [f"{e.var}_store = al.VectorStore({emb})",
            f"{e.var}_store.add_many({json.dumps(docs, ensure_ascii=False)})",
            f"{e.var}_hits = {e.var}_store.search(to_text({e.expr('query')}), k={int(e.get('k') or 2)})",
            f"{e.var} = '\\n'.join(t for _, t, _ in {e.var}_hits)"]


# ====================================================================== 흐름 제어
@node(type='router', label='조건 분기', category='flow', icon='🔀', desc='입력을 보고 여러 출력 중 하나로 보낸다 (키워드 · LLM 분류 · 파이썬).',
      dynamic='router', inputs=[P('input', '입력', required=True), P('llm', 'LLM(분류용)', 'llm')],
      fields=[F('mode', '방식', 'select', 'keyword', options=[{'value': 'keyword', 'label': '키워드 규칙'}, {'value': 'llm', 'label': 'LLM 분류'}, {'value': 'python', 'label': '파이썬 식'}]),
              F('routes', '분기', 'routes', [{'label': '날씨', 'keywords': '날씨, 기온, 비, 우산'}, {'label': '계산', 'keywords': '계산, 더하기, 곱하기, %'}]),
              F('default_label', '기타 라벨', 'text', '기타'),
              F('expr', '파이썬 식', 'code', "'날씨' if '날씨' in text else '기타'", rows=3, help="변수 text 를 보고 분기 라벨 문자열을 돌려주는 식")],
      doc='LangGraph 의 <code>add_conditional_edges</code>. 고른 출력 포트로만 입력값이 흘러가고 나머지 가지는 실행되지 않는다. '
          '출력을 앞쪽 노드로 되돌려 연결하면 <b>반복(루프)</b> 이 된다 (설정의 최대 반복 횟수로 보호).')
def run_router(ctx):
    text = to_text(ctx.inp('input'))
    routes = [r for r in (ctx.get('routes') or []) if r.get('label')]
    labels = [r['label'] for r in routes]
    mode = ctx.get('mode') or 'keyword'
    if mode == 'llm':
        llm = ctx.llm()
        label = route_llm(llm, text, labels)
        ctx.usage(llm)
    elif mode == 'python':
        label = str(eval(ctx.get('expr') or "'__default__'", {'text': text, 'json': json, 're': re}))
        if label not in labels:
            label = '__default__'
    else:
        label = route_keywords(text, routes)
    ctx.log(f"🔀 분기: {label if label != '__default__' else (ctx.get('default_label') or '기타')}")
    return {'__route__': label, label: ctx.inp('input')}


@run_router.export
def export_router(e):
    routes = [r for r in (e.get('routes') or []) if r.get('label')]
    mode = e.get('mode') or 'keyword'
    if mode == 'llm':
        e.helper('route_llm')
        return [f"{e.var} = route_llm({e.expr('llm')}, {e.expr('input')}, {json.dumps([r['label'] for r in routes], ensure_ascii=False)})"]
    if mode == 'python':
        e.helper('to_text')
        return [f"text = to_text({e.expr('input')})", f"{e.var} = {e.get('expr') or repr('__default__')}"]
    e.helper('route_keywords')
    rules = ', '.join(f"({q(r['label'])}, {q(r.get('keywords', ''))})" for r in routes)
    return [f"{e.var} = route_keywords({e.expr('input')}, [{rules}])"]


@node(type='merge', label='병합', category='flow', icon='🔗', desc='여러 가지 중 실행된 값을 하나로 모은다.',
      inputs=[P('values', '값', multi=True, required=True)], outputs=[P('text', '값')],
      fields=[F('mode', '방식', 'select', 'first', options=[{'value': 'first', 'label': '첫 값 (분기 합류)'}, {'value': 'join', 'label': '모두 이어 붙이기'}]),
              F('sep', '구분자', 'text', '\n\n')],
      doc='조건 분기 뒤에서 가지들을 다시 합칠 때(첫 값), 병렬로 만든 여러 결과를 합칠 때(이어 붙이기) 쓴다.')
def run_merge(ctx):
    vals = [v for v in (ctx.inp('values') or []) if v not in (None, '')]
    if (ctx.get('mode') or 'first') == 'join':
        return {'text': str(ctx.get('sep') if ctx.get('sep') is not None else '\n\n').join(to_text(v) for v in vals)}
    return {'text': vals[0] if vals else ''}


@run_merge.export
def export_merge(e):
    if (e.get('mode') or 'first') == 'join':
        e.helper('to_text')
        return [f"{e.var} = {q(e.get('sep'))}.join(to_text(v) for v in {e.list_expr('values')} if v not in (None, ''))"]
    e.helper('first')
    return [f"{e.var} = first(*{e.list_expr('values')})"]


PY_DEFAULT = '''def run(input, a=None, b=None):
    # input 을 가공해서 돌려준다 (문자열 · 리스트 · dict 모두 가능)
    return str(input).upper()
'''


@node(type='python', label='파이썬 코드', category='flow', icon='🐍', desc='입력을 파이썬 함수로 가공한다.',
      inputs=[P('input', '입력'), P('a', 'a'), P('b', 'b')], outputs=[P('output', '출력')],
      fields=[F('code', '코드', 'code', PY_DEFAULT, rows=10, help='run(input, a, b) 함수의 반환값이 출력이 된다. al(agentlab) · json · re 사용 가능')],
      doc='LangChain 의 <code>RunnableLambda</code>. 후처리 · 형식 변환 · 간단한 규칙 처리에 쓴다.', width=300)
def run_python(ctx):
    fn = exec_function(ctx.get('code'), 'run', {'log': ctx.log})
    return {'output': fn(ctx.inp('input'), ctx.inp('a'), ctx.inp('b'))}


@run_python.export
def export_python(e):
    code = e.get('code').rstrip()
    name = f'{e.var}_fn'
    e.define(re.sub(r'^def\s+run\s*\(', f'def {name}(', code, count=1, flags=re.M))
    return [f"{e.var} = {name}({e.expr('input')}, {e.expr('a')}, {e.expr('b')})"]


# ====================================================================== 에이전트 팀 (CrewAI · AutoGen)
@node(type='crew_agent', label='역할 에이전트 (Crew)', category='team', icon='🧑‍💼', desc='역할 · 목표 · 배경을 가진 팀원.',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('tools', '도구', 'tool', multi=True)], outputs=[P('agent', '에이전트', 'agent')],
      fields=[F('role', '역할', 'text', '시장 조사원'), F('goal', '목표', 'text', '제품의 핵심 장점과 경쟁 제품 정보를 정리한다'),
              F('backstory', '배경', 'textarea', '10년 경력의 IT 제품 분석가', rows=2)],
      doc='CrewAI 의 <code>Agent(role, goal, backstory)</code>. <b>작업(Crew)</b> 노드의 담당 포트에 연결한다.')
def run_crew_agent(ctx):
    llm = ctx.llm()
    return {'agent': al.CrewAgent(ctx.get('role'), ctx.get('goal'), ctx.get('backstory'), llm=llm, tools=ctx.inp('tools') or [], verbose=True)}


@run_crew_agent.export
def export_crew_agent(e):
    return [f"{e.var} = al.CrewAgent({q(e.get('role'))}, {q(e.get('goal'))}, {q(e.get('backstory'))}, llm={e.expr('llm')}, tools={e.list_expr('tools')}, verbose=True)"]


@node(type='crew_task', label='작업 (Crew)', category='team', icon='📌', desc='팀원이 수행할 작업과 기대 결과.',
      inputs=[P('agent', '담당', 'agent', required=True), P('context', '참고 작업', 'task', multi=True)], outputs=[P('task', '작업', 'task')],
      fields=[F('description', '작업 설명', 'textarea', '{input} 에 대해 조사하고 핵심 장점 3가지를 정리하라', rows=4, help='{input} 은 Crew 실행 노드의 입력으로 채워진다'),
              F('expected_output', '기대 결과', 'text', '장점 3가지 목록')],
      doc='CrewAI 의 <code>Task(description, expected_output, agent, context)</code>. 참고 작업을 연결하면 그 결과가 문맥으로 전달된다.')
def run_crew_task(ctx):
    return {'task': al.Task(ctx.get('description'), ctx.get('expected_output'), agent=ctx.inp('agent'), context=ctx.inp('context') or None, name=ctx.node.get('label'))}


@run_crew_task.export
def export_crew_task(e):
    ctxs = f", context={e.list_expr('context')}" if e.connected('context') else ''
    return [f"{e.var} = al.Task({q(e.get('description'))}, {q(e.get('expected_output'))}, agent={e.expr('agent')}{ctxs})"]


@node(type='crew', label='Crew 실행', category='team', icon='👥', desc='작업들을 순서대로 실행하는 에이전트 팀.',
      inputs=[P('tasks', '작업', 'task', multi=True, required=True), P('input', '입력')],
      outputs=[P('text', '최종 결과'), P('outputs', '작업별 결과')],
      doc='CrewAI 의 <code>Crew(agents, tasks).kickoff(inputs)</code>. 작업은 <b>연결한 순서</b>대로 실행되고 앞 작업 결과가 다음 작업의 문맥이 된다.')
def run_crew(ctx):
    tasks = ctx.inp('tasks') or []
    agents = []
    for t in tasks:
        if t.agent is not None and t.agent not in agents:
            agents.append(t.agent)
    crew = al.Crew(agents, tasks, verbose=True)
    inp = ctx.inp('input')
    out = crew.kickoff({'input': to_text(inp)} if inp is not None else None)
    for a in agents:
        if a.llm is not None:
            ctx.usage(a.llm)
    return {'text': out, 'outputs': crew.outputs}


@run_crew.export
def export_crew(e):
    e.helper('to_text')
    inp = f"{{'input': to_text({e.expr('input')})}}" if e.connected('input') else 'None'
    return [f"{e.var}_tasks = {e.list_expr('tasks')}",
            f"{e.var}_crew = al.Crew([t.agent for t in {e.var}_tasks], {e.var}_tasks, verbose=True)",
            f"{e.var} = {e.var}_crew.kickoff({inp})",
            f"{e.var}_outputs = {e.var}_crew.outputs"]


@node(type='ag_agent', label='대화 에이전트 (AutoGen)', category='team', icon='🗣️', desc='이름과 역할을 가진 대화 참가자.',
      inputs=[P('llm', 'LLM', 'llm', required=True)], outputs=[P('agent', '에이전트', 'agent')],
      fields=[F('name', '이름', 'text', '개발자'), F('system_message', '역할 메시지', 'textarea', '당신은 파이썬 개발자다. 요청받은 코드를 작성한다. 리뷰가 끝나면 TERMINATE 라고 말한다.', rows=3)],
      doc='AutoGen 의 <code>ConversableAgent(name, system_message)</code>. 답에 TERMINATE 가 들어가면 대화가 끝난다.')
def run_ag_agent(ctx):
    return {'agent': al.ConversableAgent(ctx.get('name'), ctx.get('system_message'), llm=ctx.llm())}


@run_ag_agent.export
def export_ag_agent(e):
    return [f"{e.var} = al.ConversableAgent({q(e.get('name'))}, {q(e.get('system_message'))}, llm={e.expr('llm')})"]


@node(type='ag_chat', label='2자 대화 (AutoGen)', category='team', icon='💞', desc='두 에이전트가 번갈아 대화한다.',
      inputs=[P('a', '시작하는 쪽', 'agent', required=True), P('b', '상대', 'agent', required=True), P('input', '첫 메시지', required=True)],
      outputs=[P('text', '마지막 답'), P('transcript', '대화 기록')],
      fields=[F('max_turns', '최대 턴', 'number', 3, min=1, max=10)],
      doc='<code>a.initiate_chat(b, message, max_turns)</code>. 코드 작성 ↔ 코드 리뷰 같은 2자 협업에 쓴다.')
def run_ag_chat(ctx):
    a, b = ctx.inp('a'), ctx.inp('b')
    res = a.initiate_chat(b, to_text(ctx.inp('input')), max_turns=int(ctx.get('max_turns') or 3))
    for ag in (a, b):
        if ag.llm is not None:
            ctx.usage(ag.llm)
    return {'text': res.summary, 'transcript': res.chat_history}


@run_ag_chat.export
def export_ag_chat(e):
    e.helper('to_text')
    return [f"{e.var}_res = {e.expr('a')}.initiate_chat({e.expr('b')}, to_text({e.expr('input')}), max_turns={int(e.get('max_turns') or 3)})",
            f"{e.var} = {e.var}_res.summary", f"{e.var}_transcript = {e.var}_res.chat_history"]


@node(type='ag_group', label='그룹 채팅 (AutoGen)', category='team', icon='👨‍👩‍👧', desc='여러 에이전트가 돌아가며 발언하는 회의.',
      inputs=[P('agents', '참가자', 'agent', multi=True, required=True), P('llm', '매니저 LLM', 'llm'), P('input', '주제', required=True)],
      outputs=[P('text', '마지막 발언'), P('transcript', '대화 기록')],
      fields=[F('max_round', '최대 라운드', 'number', 4, min=1, max=12),
              F('method', '발언자 선택', 'select', 'round_robin', options=[{'value': 'round_robin', 'label': '순서대로'}, {'value': 'auto', 'label': '매니저 LLM 이 선택'}])],
      doc='<code>GroupChat(agents) + GroupChatManager(gc, llm).run(topic)</code>. 기획 회의 · 토론 같은 다자간 협업.')
def run_ag_group(ctx):
    agents = ctx.inp('agents') or []
    gc = al.GroupChat(agents, max_round=int(ctx.get('max_round') or 4), speaker_selection_method=ctx.get('method') or 'round_robin')
    mgr = al.GroupChatManager(gc, llm=ctx.inp('llm'))
    msgs = mgr.run(to_text(ctx.inp('input')))
    for ag in agents:
        if ag.llm is not None:
            ctx.usage(ag.llm)
    return {'text': msgs[-1][1] if msgs else '', 'transcript': [{'name': n, 'content': c} for n, c in msgs]}


@run_ag_group.export
def export_ag_group(e):
    e.helper('to_text')
    llm = e.expr('llm') if e.connected('llm') else 'None'
    return [f"{e.var}_gc = al.GroupChat({e.list_expr('agents')}, max_round={int(e.get('max_round') or 4)}, speaker_selection_method={q(e.get('method') or 'round_robin')})",
            f"{e.var}_msgs = al.GroupChatManager({e.var}_gc, llm={llm}).run(to_text({e.expr('input')}))",
            f"{e.var} = {e.var}_msgs[-1][1] if {e.var}_msgs else ''",
            f"{e.var}_transcript = {e.var}_msgs"]


# ====================================================================== 평가 · 안전
@node(type='guard', label='가드레일', category='safety', icon='🛡️', desc='금지어 · 길이 검사. 통과 / 차단 두 갈래로 보낸다.',
      inputs=[P('input', '입력', required=True)], outputs=[P('pass', '통과'), P('blocked', '차단')],
      fields=[F('banned', '금지어 (쉼표 구분)', 'text', '비밀번호, 주민번호, 해킹'), F('max_len', '최대 길이', 'number', 2000, min=0, max=100000),
              F('message', '차단 메시지', 'text', '죄송합니다. 이 요청은 처리할 수 없습니다.')],
      doc='입력 가드(사용자 질문 검사) 또는 출력 가드(LLM 답 검사)로 쓴다. 차단되면 <b>차단</b> 포트로 차단 메시지가 나간다.')
def run_guard(ctx):
    banned = [b.strip() for b in str(ctx.get('banned') or '').split(',') if b.strip()]
    ok, why = guard_check(to_text(ctx.inp('input')), banned, int(ctx.get('max_len') or 0))
    if ok:
        ctx.log('🛡️ 통과')
        return {'__route__': 'pass', 'pass': ctx.inp('input')}
    ctx.log(f'🛡️ 차단 — {why}')
    return {'__route__': 'blocked', 'blocked': ctx.get('message') or why}


@run_guard.export
def export_guard(e):
    e.helper('guard_check')
    e.helper('to_text')
    banned = [b.strip() for b in str(e.get('banned') or '').split(',') if b.strip()]
    return [f"{e.var}_ok, {e.var}_why = guard_check(to_text({e.expr('input')}), {json.dumps(banned, ensure_ascii=False)}, {int(e.get('max_len') or 0)})",
            f"{e.var} = 'pass' if {e.var}_ok else 'blocked'",
            f"{e.var}_blocked = {q(e.get('message'))}"]


@node(type='judge', label='평가 (LLM 심사)', category='safety', icon='⚖️', desc='LLM 이 결과물을 기준에 따라 10점 만점으로 채점한다.',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('input', '결과물', required=True), P('reference', '정답 · 참고')],
      outputs=[P('score', '점수'), P('report', '평가 JSON'), P('text', '텍스트')],
      fields=[F('criteria', '평가 기준', 'text', '정확성 · 명확성 · 근거')],
      doc='LLM-as-a-Judge. 조건 분기 노드(파이썬 식 <code>"ok" if score >= 7 else "retry"</code>)와 함께 쓰면 <b>자기 수정 루프</b>가 된다.')
def run_judge(ctx):
    llm = ctx.llm()
    rep = al.Reflector(llm).score(to_text(ctx.inp('input')) + (f"\n\n[참고 정답]\n{to_text(ctx.inp('reference'))}" if ctx.inp('reference') else ''), criteria=ctx.get('criteria'))
    ctx.log(f"⚖️ 점수 {rep.get('score')} — {', '.join(map(str, rep.get('issues') or []))[:150]}")
    ctx.usage(llm)
    return {'score': rep.get('score'), 'report': rep, 'text': to_text(rep)}


@run_judge.export
def export_judge(e):
    e.helper('to_text')
    ref = f" + ('\\n\\n[참고 정답]\\n' + to_text({e.expr('reference')}) if {e.expr('reference')} else '')" if e.connected('reference') else ''
    return [f"{e.var}_report = al.Reflector({e.expr('llm')}).score(to_text({e.expr('input')}){ref}, criteria={q(e.get('criteria'))})",
            f"{e.var} = {e.var}_report.get('score')", f"{e.var}_text = to_text({e.var}_report)"]


# ====================================================================== MCP (Model Context Protocol)
from . import mcp as M  # noqa: E402

MCP_CLIENT_HELPER = '''class MCPClient:
    """최소 MCP 클라이언트 (Streamable HTTP · JSON-RPC 2.0). 서버의 도구를 agentlab Tool 로 감싼다"""

    def __init__(self, url, token=None):
        self.url, self.token, self.session, self._id = url, token, None, 0

    def _send(self, method, params=None, notify=False):
        import urllib.request
        req = {'jsonrpc': '2.0', 'method': method}
        if params is not None:
            req['params'] = params
        if not notify:
            self._id += 1
            req['id'] = self._id
        h = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18'}
        if self.token:
            h['Authorization'] = 'Bearer ' + self.token
        if self.session:
            h['Mcp-Session-Id'] = self.session
        r = urllib.request.Request(self.url, data=json.dumps(req).encode(), method='POST', headers=h)
        with urllib.request.urlopen(r, timeout=60) as resp:
            self.session = resp.headers.get('Mcp-Session-Id') or self.session
            text = resp.read().decode('utf-8', 'replace')
        if notify or not text.strip():
            return None
        if not text.lstrip().startswith('{'):
            text = [ln[5:] for ln in text.splitlines() if ln.startswith('data:')][-1]
        d = json.loads(text)
        if 'error' in d:
            raise RuntimeError('MCP 오류: ' + str(d['error']))
        return d.get('result')

    def tools(self):
        if self._id == 0:
            self._send('initialize', {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'agentBuilder', 'version': '1.0'}})
            self._send('notifications/initialized', notify=True)
        out = []
        for d in self._send('tools/list').get('tools', []):
            def fn(_name=d['name'], **kw):
                r = self._send('tools/call', {'name': _name, 'arguments': kw}) or {}
                texts = [c.get('text', '') for c in r.get('content', []) if c.get('type') == 'text']
                return {'error': '\\n'.join(texts)} if r.get('isError') else (r.get('structuredContent') or '\\n'.join(texts))
            fn.__name__ = d['name']
            out.append(al.Tool(fn, name=d['name'], description=d.get('description', ''), parameters=d.get('inputSchema') or {'type': 'object', 'properties': {}}))
        return out'''
HELPERS['mcp_client'] = MCP_CLIENT_HELPER
CATEGORIES.append({'id': 'mcp', 'label': 'MCP 서버 · 클라이언트', 'color': '#0891b2'})


@node(type='agent_tool', label='에이전트 → 도구', category='tool', icon='🎁', desc='에이전트를 하나의 도구로 포장한다 (상위 에이전트 · MCP 서버에서 호출).',
      inputs=[P('llm', 'LLM', 'llm', required=True), P('tools', '도구', 'tool', multi=True), P('memory', '기억', 'memory')],
      outputs=[P('tool', '도구', 'tool')],
      fields=[F('name', '도구 이름 (영문)', 'text', 'research_agent'), F('description', '설명', 'text', '주제를 조사해 핵심을 정리해 주는 조사 에이전트'),
              F('system', '에이전트 역할', 'textarea', '당신은 조사 전문가입니다. 도구로 확인한 정보만으로 핵심을 정리합니다.', rows=3),
              F('max_steps', '최대 단계', 'number', 6, min=1, max=20)],
      doc='도구 이름 · 설명이 LLM 에게 보이는 스키마가 되고, 호출되면 안에서 <code>al.Agent</code> 가 실행된다. 계층형 에이전트(관리자 → 전문가)와 MCP 도구 노출에 쓴다.')
def run_agent_tool(ctx):
    t = M.agent_as_tool(ctx.llm(), ctx.get('name') or 'agent_tool', ctx.get('description') or '', system=ctx.get('system') or None,
                        tools=ctx.inp('tools') or [], memory=ctx.inp('memory'), max_steps=int(ctx.get('max_steps') or 6))
    ctx.log(f'🎁 도구 정의: {t.describe()}')
    return {'tool': t}


@run_agent_tool.export
def export_agent_tool(e):
    name = re.sub(r'\W+', '_', str(e.get('name') or 'agent_tool')) or 'agent_tool'
    mem = f", memory={e.expr('memory')}" if e.connected('memory') else ''
    return [f"def {name}(question: str) -> str:",
            f"    \"\"\"{str(e.get('description') or name).strip()}",
            "    question: 에이전트에게 맡길 질문 · 작업",
            "    \"\"\"",
            f"    agent = al.Agent({e.expr('llm')}, tools={e.list_expr('tools')}, system={q(e.get('system')) if e.get('system') else None}, max_steps={int(e.get('max_steps') or 6)}{mem}, verbose=True)",
            "    return agent.run(question)",
            f"{e.var} = al.tool({name})"]


@node(type='mcp_server', label='MCP 서버', category='mcp', icon='🧰', desc='도구 · 리소스 · 프롬프트를 MCP 서버로 묶는다. 내보내면 FastMCP 서버 코드가 된다.',
      inputs=[P('tools', '도구', 'tool', multi=True), P('resources', '리소스', 'resource', multi=True), P('prompts', '프롬프트', 'prompt', multi=True)],
      outputs=[P('server', '서버', 'mcp'), P('text', '안내(JSON)')],
      fields=[F('name', '서버 이름', 'text', 'my-mcp-server'), F('version', '버전', 'text', '1.0.0'),
              F('instructions', '서버 설명(instructions)', 'textarea', '이 서버는 계산 · 날씨 도구와 사내 규정 리소스를 제공합니다.', rows=2),
              F('transport', '전송 방식', 'select', 'stdio', options=[{'value': 'stdio', 'label': 'stdio — Claude Desktop · Cursor 등이 프로세스로 실행'}, {'value': 'http', 'label': 'Streamable HTTP — 원격 서버 (Cloudflare · 클라우드)'}]),
              F('host', '호스트(HTTP)', 'text', '127.0.0.1'), F('port', '포트(HTTP)', 'number', 8000, min=1, max=65535)],
      doc='빌더 안에서는 순수 파이썬 미니 MCP 서버가 만들어져 <b>MCP 호출</b> · <b>MCP 클라이언트</b> 노드로 바로 시험할 수 있다. '
          '🐍 Python 코드 탭의 결과는 공식 SDK(<code>pip install mcp</code>)의 <code>FastMCP</code> 서버이며 <code>python 파일.py</code> 로 실행한다.')
def run_mcp_server(ctx):
    s = M.MiniMCPServer(ctx.get('name') or 'server', ctx.get('version') or '1.0.0', ctx.get('instructions') or '',
                        tools=ctx.inp('tools') or [], resources=ctx.inp('resources') or [], prompts=ctx.inp('prompts') or [])
    man = s.manifest()
    ctx.log(f"🧰 MCP 서버 '{s.name}' — 도구 {len(man['tools'])}개 · 리소스 {len(man['resources'])}개 · 프롬프트 {len(man['prompts'])}개 ({ctx.get('transport')})")
    for t in man['tools']:
        ctx.log(f"   🔧 {t['name']}: {t['description'][:60]}")
    return {'server': s, 'text': to_text(man)}


@run_mcp_server.export
def export_mcp_server(e):
    e.helper('to_text')
    transport = 'streamable-http' if e.get('transport') == 'http' else 'stdio'
    e.exporter.mcp_servers.append((e.var, transport, e.get('host') or '127.0.0.1', int(e.get('port') or 8000)))
    lines = [f"{e.var} = FastMCP({q(e.get('name') or 'server')}, instructions={q(e.get('instructions')) if e.get('instructions') else None})",
             f"{e.var}_tools = {e.list_expr('tools')}",
             f"for _t in {e.var}_tools:",
             f"    {e.var}.add_tool(_t.fn, name=_t.name, description=_t.description)"]
    if e.connected('resources'):
        lines += [f"for _r in {e.list_expr('resources')}:",
                  f"    {e.var}.resource(_r['uri'], name=_r['name'], description=_r['description'], mime_type=_r['mime'])((lambda r: (lambda: str(r['content'])))(_r))"]
    if e.connected('prompts'):
        lines += [f"for _p in {e.list_expr('prompts')}:",
                  f"    {e.var}.prompt(name=_p['name'], description=_p['description'])(_p['fn'])"]
    return lines


@node(type='mcp_resource', label='MCP 리소스', category='mcp', icon='📄', desc='서버가 제공하는 읽기 자료 (문서 · 설정 · 데이터). URI 로 읽는다.',
      inputs=[P('text', '내용(연결 시)')], outputs=[P('resource', '리소스', 'resource')],
      fields=[F('uri', 'URI', 'text', 'docs://company/policy'), F('name', '이름', 'text', 'policy'), F('description', '설명', 'text', '사내 규정 문서'),
              F('mime_type', 'MIME', 'text', 'text/plain'), F('content', '내용', 'textarea', '연차는 1년에 15일이다.\n재택근무는 주 2회까지 가능하다.', rows=5, help='내용 포트가 연결되면 그 값을 쓴다')],
      doc='MCP 의 <b>resources/list · resources/read</b>. 텍스트 노드나 문서 검색 결과를 내용 포트에 연결해 동적으로 만들 수도 있다.')
def run_mcp_resource(ctx):
    content = ctx.inp('text') if ctx.inp('text') is not None else ctx.get('content')
    return {'resource': M.Resource(ctx.get('uri') or 'res://item', to_text(content), ctx.get('name') or None, ctx.get('description') or '', ctx.get('mime_type') or 'text/plain')}


@run_mcp_resource.export
def export_mcp_resource(e):
    e.helper('to_text')
    content = f"to_text({e.expr('text')})" if e.connected('text') else q(e.get('content'))
    return [f"{e.var} = {{'uri': {q(e.get('uri'))}, 'name': {q(e.get('name') or e.get('uri'))}, 'description': {q(e.get('description'))}, 'mime': {q(e.get('mime_type') or 'text/plain')}, 'content': {content}}}"]


@node(type='mcp_prompt', label='MCP 프롬프트', category='mcp', icon='🧾', desc='서버가 제공하는 프롬프트 템플릿. {인자} 가 매개변수가 된다.',
      outputs=[P('prompt', '프롬프트', 'prompt')],
      fields=[F('name', '이름', 'text', 'summarize'), F('description', '설명', 'text', '글을 세 줄로 요약하는 프롬프트'),
              F('template', '템플릿', 'textarea', '다음 글을 {language} 로 세 줄 요약해줘:\n\n{text}', rows=5, help='{이름} 이 prompts/get 의 arguments 가 된다')],
      doc='MCP 의 <b>prompts/list · prompts/get</b>. 클라이언트(Claude Desktop 등)가 사용자에게 보여 주는 재사용 프롬프트.')
def run_mcp_prompt(ctx):
    return {'prompt': M.Prompt(ctx.get('name') or 'prompt', ctx.get('template') or '', ctx.get('description') or '')}


@run_mcp_prompt.export
def export_mcp_prompt(e):
    e.helper('fmt')
    name = re.sub(r'\W+', '_', str(e.get('name') or 'prompt')) or 'prompt'
    args = []
    for m in re.finditer(r'{(\w+)}', str(e.get('template') or '')):
        if m.group(1) not in args:
            args.append(m.group(1))
    sig = ', '.join(f'{a}: str' for a in args)
    vals = ', '.join(f"{q(a)}: {a}" for a in args)
    return [f"def {e.var}_fn({sig}) -> str:",
            f"    \"\"\"{str(e.get('description') or name).strip()}\"\"\"",
            f"    return fmt({q(e.get('template'))}, {{{vals}}})",
            f"{e.var} = {{'name': {q(e.get('name') or name)}, 'description': {q(e.get('description'))}, 'fn': {e.var}_fn}}"]


MCP_METHODS = [{'value': m, 'label': m} for m in ('tools/list', 'tools/call', 'resources/list', 'resources/read', 'prompts/list', 'prompts/get', 'initialize', 'ping')]


@node(type='mcp_call', label='MCP 호출 (테스트)', category='mcp', icon='📡', desc='클라이언트가 되어 서버에 JSON-RPC 요청을 보내고 응답을 본다.',
      inputs=[P('server', '서버', 'mcp', required=True), P('input', '입력')],
      outputs=[P('result', '결과'), P('response', '응답(JSON-RPC)')],
      fields=[F('method', '메서드', 'select', 'tools/list', options=MCP_METHODS),
              F('name', '도구 · 프롬프트 이름 / 리소스 URI', 'text', ''),
              F('arguments', '인자 (JSON)', 'textarea', '{}', rows=3, help='{input} 을 쓰면 입력 포트 값이 들어간다. tools/call 에서 비우면 첫 매개변수에 입력을 넣는다')],
      doc='프로토콜을 눈으로 익히는 노드. 실행 로그에 요청 → 응답 JSON 이 그대로 찍힌다. 내보낸 코드에는 들어가지 않는다.')
def run_mcp_call(ctx):
    server = ctx.inp('server')
    client = M.MCPClient(server=server, verbose=True)
    method = ctx.get('method') or 'tools/list'
    name = (ctx.get('name') or '').strip()
    inp = ctx.inp('input')
    raw = fmt(ctx.get('arguments') or '{}', {'input': to_text(inp)}) if '{input}' in str(ctx.get('arguments') or '') else (ctx.get('arguments') or '{}')
    try:
        args = json.loads(raw) if str(raw).strip() else {}
    except ValueError as ex:
        raise ValueError(f'인자 JSON 오류: {ex}')
    if method == 'tools/call' and not args and inp is not None and name:
        props = ((server.tools.get(name).parameters if server and server.tools.get(name) else {}) or {}).get('properties') or {}
        first = next(iter(props), 'input')
        args = {first: inp}
    params = None
    if method == 'tools/call':
        params = {'name': name, 'arguments': args}
    elif method == 'resources/read':
        params = {'uri': name}
    elif method == 'prompts/get':
        params = {'name': name, 'arguments': {k: to_text(v) for k, v in args.items()}}
    elif method == 'initialize':
        params = {'protocolVersion': M.PROTOCOL_VERSION, 'capabilities': {}, 'clientInfo': {'name': 'agentBuilder', 'version': '1.0'}}
    resp = client.request(method, params)
    req = client.transcript[-1][0]
    ctx.log('→ ' + json.dumps(req, ensure_ascii=False))
    ctx.log('← ' + json.dumps(resp, ensure_ascii=False)[:1500])
    res = resp.get('result') if resp else None
    if resp and 'error' in resp:
        result = {'error': resp['error']}
    elif method == 'tools/call':
        texts = [c.get('text', '') for c in (res or {}).get('content', []) if c.get('type') == 'text']
        result = (res or {}).get('structuredContent') or '\n'.join(texts)
    elif method == 'resources/read':
        result = '\n'.join(c.get('text', '') for c in (res or {}).get('contents', []))
    elif method == 'prompts/get':
        result = '\n'.join(m.get('content', {}).get('text', '') for m in (res or {}).get('messages', []))
    elif method == 'tools/list':
        result = '\n'.join(f"- {t['name']}: {t.get('description', '')}" for t in (res or {}).get('tools', []))
    elif method in ('resources/list', 'prompts/list'):
        key = method.split('/')[0]
        result = '\n'.join(f"- {t.get('uri') or t.get('name')}: {t.get('description', '')}" for t in (res or {}).get(key, []))
    else:
        result = res
    return {'result': result, 'response': resp}


@run_mcp_call.export
def export_mcp_call(e):
    return [f"{e.var} = {e.var}_response = None   # MCP 호출(테스트) 노드는 빌더 안에서만 동작한다"]


@node(type='mcp_client', label='MCP 클라이언트', category='mcp', icon='🔌', desc='MCP 서버(빌더 안 서버 또는 원격 주소)에 연결해 도구 목록을 가져온다. 에이전트의 도구 포트에 연결.',
      inputs=[P('server', '서버(빌더 안)', 'mcp')],
      outputs=[{'name': 'tools', 'label': '도구들', 'kind': 'tool', 'multi': False, 'required': False, 'list': True}, P('info', '서버 정보')],
      fields=[F('url', '서버 주소 (Streamable HTTP)', 'text', '', placeholder='https://example.com/mcp  (서버 포트가 연결되면 무시)'),
              F('key_ref', '인증 토큰', 'secret', '', help='Authorization: Bearer 로 보낸다. 토큰은 금고 · 세션에만 저장되고 그래프에는 이름만 남는다')],
      doc='서버의 <b>tools/list</b> 결과를 agentlab 도구로 감싸 돌려준다 → 에이전트가 원격 도구를 호출(<b>tools/call</b>)한다. '
          '빌더 안 <b>MCP 서버</b> 노드를 서버 포트에 연결하면 네트워크 없이 시험할 수 있다. 원격 주소는 브라우저에서 직접(CORS 허용 시) 또는 토큰과 함께 저장한 주소를 프록시가 대신 호출한다.')
def run_mcp_client(ctx):
    server = ctx.inp('server')
    if server is not None:
        client = M.MCPClient(server=server)
    else:
        url = (ctx.get('url') or '').strip()
        if not url:
            raise ValueError('MCP 클라이언트: 서버 포트를 연결하거나 서버 주소를 입력하세요')
        headers = {}
        ref = ctx.get('key_ref')
        if ref:
            headers['Authorization'] = 'Bearer ' + ctx.key(ref, 'mcp')
        client = M.MCPClient(url=url, headers=headers)
    tools = client.tools()
    info = client.server_info or {}
    ctx.log(f"🔌 MCP 서버 '{info.get('name', '?')}' 연결 — 도구 {len(tools)}개: {', '.join(t.name for t in tools)}")
    return {'tools': tools, 'info': f"{info.get('name', '?')} v{info.get('version', '?')} · 도구 {len(tools)}개"}


@run_mcp_client.export
def export_mcp_client(e):
    if e.connected('server'):
        return [f"{e.var} = {e.expr('server')}_tools   # 같은 코드 안의 MCP 서버 도구를 그대로 쓴다", f"{e.var}_info = 'local'"]
    e.helper('mcp_client')
    token = ", token=os.environ.get('MCP_TOKEN')" if e.get('key_ref') else ''
    return [f"{e.var}_client = MCPClient({q(e.get('url'))}{token})", f"{e.var} = {e.var}_client.tools()", f"{e.var}_info = {q(e.get('url'))}"]


# ====================================================================== Agent Skills
from . import skills as S  # noqa: E402

HELPERS['skills'] = S.HELPER
CATEGORIES.append({'id': 'skill', 'label': 'Skill (에이전트 스킬)', 'color': '#4338ca'})

SKILL_MD_DEFAULT = """---
name: meeting-notes
description: 회의록 · 회의 내용 정리 요청에 사용. 결정 사항 · 할 일 · 담당자를 표로 정리한다
keywords: 회의, 회의록, 미팅
---
# 회의록 정리

1. 먼저 결정 사항을 번호 목록으로 쓴다.
2. 할 일(Action Item)은 표로: | 할 일 | 담당자 | 기한 |
3. 마지막에 다음 회의 안건을 한 줄로 제안한다.
"""


def _skill_from_cfg(cfg, tools):
    res = {}
    if str(cfg.get('references') or '').strip():
        res['notes.md'] = str(cfg.get('references')).strip()
    return S.Skill(cfg.get('name') or 'skill', cfg.get('description') or '', cfg.get('instructions') or '', resources=res, tools=tools, keywords=cfg.get('keywords') or '')


@node(type='skill', label='Skill 정의', category='skill', icon='📚', desc='이름 · 설명(언제 쓰는지) · 지시문(어떻게 하는지) · 참고 자료 · 도구를 묶은 에이전트 스킬.',
      inputs=[P('tools', '함께 쓰는 도구', 'tool', multi=True)], outputs=[P('skill', '스킬', 'skill')],
      fields=[F('name', '이름 (영문 소문자-하이픈)', 'text', 'report-writer'),
              F('description', '설명 — 언제 쓰는지', 'text', '보고서 · 요약문 · 리포트 작성 요청에 사용한다'),
              F('keywords', '선택 키워드 (쉼표)', 'text', '보고서, 요약, 리포트', help='비우면 설명의 단어로 고른다'),
              F('instructions', '지시문 — 어떻게 하는지', 'textarea', '# 보고서 작성\n1. 제목 · 요약(3줄) · 본문 · 다음 행동 순서로 쓴다.\n2. 숫자는 표로 정리하고 출처를 적는다.\n3. 전문 용어는 처음 나올 때 풀어 쓴다.', rows=7),
              F('references', '참고 자료 (references/notes.md)', 'textarea', '', rows=4, help='스킬이 활성화될 때 지시문 뒤에 붙는다')],
      doc='Anthropic 의 <b>Agent Skills</b>(SKILL.md) 와 같은 구조. 에이전트는 처음엔 이름·설명만 보고(1단계), 작업에 맞는 스킬을 고르면 지시문·참고 자료·도구가 활성화된다(2단계 점진적 로딩). '
          '에이전트 노드의 <b>스킬</b> 포트에 연결한다. 🐍 코드 탭의 <b>📁 SKILL.md</b> 로 폴더 형식으로 내보낼 수 있다.', width=260)
def run_skill(ctx):
    s = _skill_from_cfg(ctx.config, ctx.inp('tools') or [])
    ctx.log(f'📚 스킬 정의: {s.name} — {s.description[:60]}' + (f' · 도구 {[t.name for t in s.tools]}' if s.tools else ''))
    return {'skill': s}


@run_skill.export
def export_skill(e):
    e.helper('skills')
    res = f"{{'notes.md': {q(str(e.get('references')).strip())}}}" if str(e.get('references') or '').strip() else '{}'
    return [f"{e.var} = Skill({q(e.get('name'))}, {q(e.get('description'))}, instructions={q(e.get('instructions'))}, resources={res}, tools={e.list_expr('tools')}, keywords={q(e.get('keywords'))})"]


@node(type='skill_import', label='SKILL.md 가져오기', category='skill', icon='📄', desc='SKILL.md 텍스트(frontmatter + 지시문)를 붙여 넣어 스킬로 만든다.',
      inputs=[P('tools', '함께 쓰는 도구', 'tool', multi=True)], outputs=[P('skill', '스킬', 'skill')],
      fields=[F('md', 'SKILL.md', 'code', SKILL_MD_DEFAULT, rows=12, help='--- name · description · keywords --- 뒤에 지시문')],
      doc='Claude Code · Claude.ai 에서 쓰는 SKILL.md 를 그대로 가져온다. frontmatter 의 name · description 이 1단계 목록에, 본문이 2단계 지시문이 된다.', width=300)
def run_skill_import(ctx):
    s = S.Skill.from_md(ctx.get('md'), tools=ctx.inp('tools') or [])
    ctx.log(f'📄 SKILL.md 가져오기: {s.name} — {s.description[:60]}')
    return {'skill': s}


@run_skill_import.export
def export_skill_import(e):
    e.helper('skills')
    s = S.Skill.from_md(e.get('md'))
    return [f"{e.var} = Skill({q(s.name)}, {q(s.description)}, instructions={q(s.instructions)}, tools={e.list_expr('tools')}, keywords={q(', '.join(s.keywords))})"]


SKILL_MODES = [{'value': 'auto', 'label': '자동 — 키워드, 없으면 LLM'}, {'value': 'keyword', 'label': '키워드만'}, {'value': 'llm', 'label': 'LLM 이 선택'}, {'value': 'all', 'label': '모두 활성화'}]


@node(type='skill_prompt', label='스킬 선택 · 프롬프트 조립', category='skill', icon='🧮', desc='작업에 맞는 스킬을 고르고 시스템 프롬프트와 도구 목록을 조립한다 (선택 과정을 눈으로 확인).',
      inputs=[P('skills', '스킬', 'skill', multi=True, required=True), P('input', '작업', required=True), P('llm', 'LLM(선택용)', 'llm')],
      outputs=[P('system', '조립된 시스템 프롬프트'), {'name': 'tools', 'label': '활성 도구들', 'kind': 'tool', 'multi': False, 'required': False, 'list': True}, P('selected', '선택된 스킬')],
      fields=[F('base_system', '기본 역할', 'textarea', '당신은 비서입니다.', rows=2), F('mode', '선택 방식', 'select', 'auto', options=SKILL_MODES)],
      doc='에이전트 노드 안에서 자동으로 일어나는 일을 밖으로 꺼낸 노드. 조립된 프롬프트를 <b>LLM 호출</b> 노드의 시스템 프롬프트 대신 입력으로 쓰거나 결과로 확인한다.')
def run_skill_prompt(ctx):
    ss = S.SkillSet(ctx.inp('skills') or [])
    system, tools, chosen = ss.apply(to_text(ctx.inp('input')), ctx.get('base_system') or '', [], llm=ctx.inp('llm'), mode=ctx.get('mode') or 'auto', log=ctx.log)
    return {'system': system, 'tools': tools, 'selected': [s.name for s in chosen]}


@run_skill_prompt.export
def export_skill_prompt(e):
    e.helper('skills')
    e.helper('to_text')
    llm = e.expr('llm') if e.connected('llm') else 'None'
    return [f"{e.var}, {e.var}_tools, {e.var}_chosen = skills_apply({e.list_expr('skills')}, to_text({e.expr('input')}), {q(e.get('base_system'))}, [], llm={llm}, mode={q(e.get('mode') or 'auto')})",
            f"{e.var}_selected = [s.name for s in {e.var}_chosen]"]
