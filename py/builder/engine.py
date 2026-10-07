"""실행 엔진 — 노드 그래프(JSON)를 위상 순서로 실행한다 (브라우저 Pyodide · 로컬 CPython 공용)

    engine = Engine(graph, emit=print, key_resolver=lambda ref, provider: '...')
    results = engine.run(overrides={'n1': '서울 날씨 알려줘'})

그래프 JSON
    {'nodes': [{'id', 'type', 'label', 'x', 'y', 'config': {...}}],
     'edges': [{'id', 'from', 'fromPort', 'to', 'toPort'}],
     'settings': {'max_loops': 5}}

실행 규칙
  - 되돌아가는 간선(back edge)을 뺀 위상 순서로 한 번 훑는다.
  - 조건 분기(router · guard)는 고른 출력 포트로만 값을 흘려보낸다. 활성 입력이 하나도 없는 노드는 건너뛴다(skip).
  - 되돌아가는 간선이 활성화되면 그 목적지부터 다시 실행한다 (settings.max_loops 까지).
  - 기억(memory) · 문서 저장소 같은 노드는 session 에 상태를 보관해 실행을 반복해도 이어진다.
"""
import contextlib
import io
import json
import sys
import time
import traceback

from . import nodes as N

SKIP = object()
DATA_KINDS = ('text',)      # 값이 흐르는 포트. llm · tool · memory · agent · task 는 자원(resource) 포트


class GraphError(ValueError):
    pass


class _Emit(io.TextIOBase):
    """노드 실행 중 print() 출력을 이벤트로 돌린다"""

    def __init__(self, engine, node_id):
        self.engine = engine
        self.node_id = node_id
        self.buf = ''

    def write(self, s):
        self.buf += s
        while '\n' in self.buf:
            line, self.buf = self.buf.split('\n', 1)
            if line.strip():
                self.engine.emit({'type': 'log', 'node': self.node_id, 'text': line})
        return len(s)

    def flush(self):
        if self.buf.strip():
            self.engine.emit({'type': 'log', 'node': self.node_id, 'text': self.buf})
        self.buf = ''


class Ctx:
    """노드 run() 에 넘기는 실행 문맥"""

    def __init__(self, engine, node, inputs, state, override=None):
        self.engine = engine
        self.node = node
        self.nt = N.REGISTRY[node['type']]
        self.config = dict(self.nt.defaults())
        self.config.update(node.get('config') or {})
        self.inputs = inputs
        self.state = state
        self.override = override

    def get(self, name, default=None):
        v = self.config.get(name)
        return default if v is None else v

    def inp(self, name, default=None):
        v = self.inputs.get(name)
        return default if v is None else v

    def llm(self, port='llm'):
        v = self.inputs.get(port)
        if v is None:
            raise GraphError(f"'{self.node.get('label') or self.nt.label}' 노드의 LLM 포트에 LLM 모델 노드를 연결하세요")
        return v

    def log(self, text):
        self.engine.emit({'type': 'log', 'node': self.node['id'], 'text': str(text)})

    def result(self, title, value):
        self.engine.results.append({'node': self.node['id'], 'title': title, 'value': preview(value, 100000)})
        self.engine.emit({'type': 'result', 'node': self.node['id'], 'title': title, 'value': preview(value, 100000)})

    def key(self, ref, provider):
        return self.engine.key_resolver(ref, provider) if self.engine.key_resolver else ''

    def usage(self, llm):
        u = getattr(llm, 'total_usage', None)
        if u is not None:
            self.engine.usage_seen[id(llm)] = (u.prompt_tokens, u.completion_tokens, getattr(llm, 'calls', 0))


def preview(v, limit=4000):
    """이벤트로 보낼 수 있는 값으로 (문자열은 자르고, 객체는 설명으로)"""
    if v is None or isinstance(v, (bool, int, float)):
        return v
    if isinstance(v, str):
        return v if len(v) <= limit else v[:limit] + f'… (총 {len(v)}자)'
    if isinstance(v, (list, tuple)):
        return [preview(x, limit // 4 if limit > 400 else limit) for x in list(v)[:50]]
    if isinstance(v, dict):
        return {str(k): preview(x, limit // 4 if limit > 400 else limit) for k, x in list(v.items())[:50]}
    if hasattr(v, 'kind') and hasattr(v, 'data'):      # agent Step
        return {'kind': v.kind, **{k: preview(x, 300) for k, x in v.data.items()}}
    return f'<{type(v).__name__}> ' + str(v)[:limit]


def ports_of(node):
    nt = N.REGISTRY.get(node['type'])
    if nt is None:
        raise GraphError(f"알 수 없는 노드 종류: {node['type']}")
    cfg = dict(nt.defaults())
    cfg.update(node.get('config') or {})
    return N.dynamic_inputs(nt, cfg), N.dynamic_outputs(nt, cfg)


def analyze(graph):
    """노드 · 간선 검증 → (nodes dict, in_edges, out_edges, order, back_edges)"""
    nodes = {}
    for n in graph.get('nodes') or []:
        if n['id'] in nodes:
            raise GraphError(f"노드 id 중복: {n['id']}")
        if n['type'] not in N.REGISTRY:
            raise GraphError(f"알 수 없는 노드 종류: {n['type']}")
        nodes[n['id']] = n
    edges = []
    for e in graph.get('edges') or []:
        if e['from'] not in nodes or e['to'] not in nodes:
            continue
        edges.append(e)
    in_edges = {nid: [] for nid in nodes}
    out_edges = {nid: [] for nid in nodes}
    for e in edges:
        in_edges[e['to']].append(e)
        out_edges[e['from']].append(e)
    # 필수 입력 검사
    for nid, n in nodes.items():
        ins, _ = ports_of(n)
        connected = {e['toPort'] for e in in_edges[nid]}
        for p in ins:
            if p.get('required') and p['name'] not in connected:
                raise GraphError(f"'{n.get('label') or N.REGISTRY[n['type']].label}' 노드의 '{p['label']}' 포트가 연결되지 않았습니다")
    # DFS 로 되돌아가는 간선 찾기 (노드 목록 순서 = 결정적)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {nid: WHITE for nid in nodes}
    back = set()

    def dfs(u):
        color[u] = GRAY
        for e in out_edges[u]:
            v = e['to']
            if color[v] == GRAY:
                back.add(e['id'])
            elif color[v] == WHITE:
                dfs(v)
        color[u] = BLACK
    for nid in nodes:
        if color[nid] == WHITE:
            dfs(nid)
    # Kahn 위상 정렬 (back edge 제외) — 들어오는 간선이 없는 노드부터, 같은 순위면 원래 순서
    indeg = {nid: sum(1 for e in in_edges[nid] if e['id'] not in back) for nid in nodes}
    order_ids = list(nodes)
    ready = [nid for nid in order_ids if indeg[nid] == 0]
    order = []
    while ready:
        u = ready.pop(0)
        order.append(u)
        for e in out_edges[u]:
            if e['id'] in back:
                continue
            indeg[e['to']] -= 1
            if indeg[e['to']] == 0:
                ready.append(e['to'])
                ready.sort(key=order_ids.index)
    if len(order) != len(nodes):
        raise GraphError('그래프에 처리할 수 없는 순환이 있습니다')
    return nodes, in_edges, out_edges, order, back


class Engine:
    def __init__(self, graph, emit=None, key_resolver=None, session=None, stop_check=None):
        self.graph = graph
        self._emit = emit or (lambda ev: None)
        self.key_resolver = key_resolver
        self.session = session if session is not None else {}
        self.stop_check = stop_check
        self.results = []
        self.usage_seen = {}
        self.nodes, self.in_edges, self.out_edges, self.order, self.back = analyze(graph)
        self.max_loops = int((graph.get('settings') or {}).get('max_loops') or 5)

    def emit(self, ev):
        """이벤트 콜백은 원래 stdout 으로 (노드 실행 중 stdout 은 로그로 돌려져 있으므로)"""
        real = getattr(self, '_real_stdout', None) or sys.__stdout__
        with contextlib.redirect_stdout(real):
            self._emit(ev)

    # ---------------- 값 전달
    def _inputs_for(self, nid, outputs, active):
        """노드의 입력 포트 값 모으기. (값 dict, 활성 입력이 하나라도 있는가, 연결된 입력이 하나라도 있는가)"""
        node = self.nodes[nid]
        ins, _ = ports_of(node)
        multi = {p['name'] for p in ins if p.get('multi')}
        data_ports = {p['name'] for p in ins if p.get('kind', 'text') in DATA_KINDS}
        vals = {}
        any_active = False
        any_conn = False
        for e in self.in_edges[nid]:
            is_data = e['toPort'] in data_ports
            any_conn = any_conn or is_data
            src = e['from']
            if src not in outputs or outputs[src] is SKIP:
                continue
            if e['id'] not in active:
                continue
            v = outputs[src].get(e['fromPort'])
            any_active = any_active or is_data
            if e['toPort'] in multi:
                if isinstance(v, (list, tuple)):
                    vals.setdefault(e['toPort'], []).extend(v)
                else:
                    vals.setdefault(e['toPort'], []).append(v)
            else:
                vals[e['toPort']] = v
        return vals, any_active, any_conn

    def _activate(self, nid, out, active):
        """노드 출력 → 나가는 간선 활성화 (분기 노드는 고른 포트만)"""
        route = out.get('__route__') if isinstance(out, dict) else None
        for e in self.out_edges[nid]:
            if route is not None and e['fromPort'] != route:
                active.discard(e['id'])
            else:
                active.add(e['id'])

    # ---------------- 실행
    def run(self, overrides=None):
        overrides = overrides or {}
        t0 = time.time()
        self._real_stdout = sys.stdout
        self.results = []
        self.emit({'type': 'start', 'order': self.order, 'loops': len(self.back)})
        outputs = {}
        active = set()
        runs = {nid: 0 for nid in self.nodes}
        queue = list(self.order)
        loops = 0
        try:
            while queue:
                nid = queue.pop(0)
                if self.stop_check and self.stop_check():
                    raise GraphError('사용자가 실행을 중지했습니다')
                node = self.nodes[nid]
                vals, any_active, any_conn = self._inputs_for(nid, outputs, active)
                if any_conn and not any_active and node['type'] != 'note':
                    outputs[nid] = SKIP
                    self.emit({'type': 'node_skip', 'node': nid})
                    continue
                if node['type'] == 'note':
                    outputs[nid] = {}
                    continue
                runs[nid] += 1
                self.emit({'type': 'node_start', 'node': nid, 'run': runs[nid]})
                st = time.time()
                ctx = Ctx(self, node, vals, self.session.setdefault(nid, {}), override=overrides.get(nid))
                sink = _Emit(self, nid)
                try:
                    with contextlib.redirect_stdout(sink):
                        out = N.REGISTRY[node['type']].run(ctx) or {}
                    sink.flush()
                except GraphError:
                    sink.flush()
                    raise
                except Exception as ex:  # noqa
                    sink.flush()
                    tb = traceback.format_exc().strip().split('\n')
                    self.emit({'type': 'node_error', 'node': nid, 'error': f'{type(ex).__name__}: {ex}', 'trace': '\n'.join(tb[-6:])})
                    raise GraphError(f"'{node.get('label') or ctx.nt.label}' 노드 오류 — {type(ex).__name__}: {ex}")
                outputs[nid] = out
                self._activate(nid, out, active)
                ev = {'type': 'node_end', 'node': nid, 'ms': int((time.time() - st) * 1000),
                      'outputs': {k: preview(v) for k, v in out.items() if not k.startswith('__')}}
                if '__route__' in out:
                    ev['route'] = out['__route__']
                self.emit(ev)
                # 되돌아가는 간선이 활성화되면 목적지부터 다시
                for e in self.out_edges[nid]:
                    if e['id'] in self.back and e['id'] in active:
                        if loops >= self.max_loops:
                            self.emit({'type': 'log', 'node': nid, 'text': f'⚠ 최대 반복 횟수({self.max_loops})에 도달해 반복을 멈춥니다'})
                            active.discard(e['id'])
                            continue
                        loops += 1
                        self.emit({'type': 'loop', 'node': e['to'], 'count': loops})
                        tgt = e['to']
                        # 목적지에서 도달 가능한 노드들을 위상 순서대로 다시 실행
                        reach = self._reachable(tgt)
                        queue = [x for x in self.order if x in reach and x not in queue] + queue
                        # 앞쪽(forward) 간선의 활성 상태는 유지하고, 재실행 노드의 이전 출력은 그대로 둔다 (back edge 입력은 최신 값)
                        break
            usage = self._usage()
            self.emit({'type': 'done', 'ms': int((time.time() - t0) * 1000), 'results': self.results, 'usage': usage})
            return self.results
        except GraphError as ex:
            self.emit({'type': 'error', 'error': str(ex), 'ms': int((time.time() - t0) * 1000)})
            raise

    def _reachable(self, start):
        seen = set()
        stack = [start]
        while stack:
            u = stack.pop()
            if u in seen:
                continue
            seen.add(u)
            for e in self.out_edges[u]:
                if e['id'] not in self.back:
                    stack.append(e['to'])
        return seen

    def _usage(self):
        p = sum(v[0] for v in self.usage_seen.values())
        c = sum(v[1] for v in self.usage_seen.values())
        calls = sum(v[2] for v in self.usage_seen.values())
        return {'prompt_tokens': p, 'completion_tokens': c, 'total_tokens': p + c, 'calls': calls}


def run_graph(graph, overrides=None, emit=None, key_resolver=None, session=None):
    return Engine(graph, emit=emit, key_resolver=key_resolver, session=session).run(overrides)


def validate(graph):
    """검증만 (오류 메시지 목록)"""
    try:
        analyze(graph)
        return []
    except GraphError as ex:
        return [str(ex)]


def events_to_json(ev):
    return json.dumps(ev, ensure_ascii=False, default=str)
