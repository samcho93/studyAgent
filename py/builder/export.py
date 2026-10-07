"""파이썬 코드 내보내기 — 노드 그래프 → 빌더 없이 실행되는 독립 파이썬 스크립트

    code = export_python(graph)          # 문자열
    python my_agent.py "질문"            # 실행 (agentlab 폴더가 옆에 있거나 PYTHONPATH 에 있어야 한다)

원칙
  - API 키는 코드에 넣지 않는다. 환경 변수(GEMINI_API_KEY …) 또는 .env 파일에서 읽는다.
  - 노드 하나 = 코드 몇 줄. 위상 순서대로 나열해 위에서 아래로 읽히게 한다.
  - 조건 분기는 if 로, 되돌아가는 간선(루프)은 for 로 감싼다. 겹치는 복잡한 루프는 지원하지 않는다(오류).
"""
import json
import re

from . import engine as E
from . import nodes as N
from . import providers


class ExportError(ValueError):
    pass


class ECtx:
    """노드 export() 에 넘기는 문맥"""

    def __init__(self, exporter, node, var, inputs, index_of_type):
        self.exporter = exporter
        self.node = node
        self.var = var
        self.inputs = inputs            # port → 식(str) 또는 [식...]
        self.index_of_type = index_of_type
        self.nt = N.REGISTRY[node['type']]
        self.config = dict(self.nt.defaults())
        self.config.update(node.get('config') or {})

    def get(self, name, default=''):
        v = self.config.get(name)
        return default if v is None else v

    def connected(self, port):
        return port in self.inputs

    def expr(self, port):
        v = self.inputs.get(port)
        if v is None:
            return 'None'
        if isinstance(v, list):
            return v[0] if v else 'None'
        return v

    def list_expr(self, port):
        v = self.inputs.get(port)
        if v is None:
            return '[]'
        return '[' + ', '.join(v if isinstance(v, list) else [v]) + ']'

    def list_items(self, port):
        v = self.inputs.get(port)
        return (v if isinstance(v, list) else [v]) if v is not None else []

    def helper(self, name):
        self.exporter.helpers.add(name)

    def define(self, code):
        self.exporter.defs.append(code)

    def provider(self, pid):
        self.exporter.providers_used.add(pid)


HEADER = '''"""{name} — agentBuilder 에서 내보낸 에이전트
{desc}
실행:  python {file} "질문"
API 키: 환경 변수 또는 같은 폴더의 .env 파일 ({envs})
       키가 없으면 모의 LLM(항상 같은 답)으로 동작한다. 코드에는 키를 넣지 않는다.
필요:  agentlab 폴더 (이 파일 옆 또는 ./py/ 또는 PYTHONPATH)
"""
import json
import os
import re
import sys

_here = os.path.dirname(os.path.abspath(__file__))
for _p in (_here, os.path.join(_here, 'py')):
    if os.path.isdir(os.path.join(_p, 'agentlab')) and _p not in sys.path:
        sys.path.insert(0, _p)
import agentlab as al   # noqa: E402

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass


def load_env(path=os.path.join(_here, '.env')):
    """KEY=value 형식의 .env 를 환경 변수로 (이미 있는 값은 그대로)"""
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except OSError:
        pass


load_env()
'''

MAKE_LLM = '''PROVIDERS = {providers}


def make_llm(provider, model=None, base_url=None, temperature=0.0, max_tokens=1024):
    """공급자 id → agentlab.LLM. 키는 환경 변수에서만 읽는다"""
    p = PROVIDERS[provider]
    if provider == 'mock':
        return al.LLM('mock', temperature=temperature, max_tokens=max_tokens, verbose=True)
    key = os.environ.get(p['env'], '') if p['env'] else ''
    if p['env'] and not key and provider != 'custom':
        print(f"⚠ 환경 변수 {{p['env']}} 가 없어 모의 LLM 으로 실행합니다 ({{p['label']}})")
        return al.LLM('mock', verbose=True)
    al_provider = p['al'] if key or p['al'] != 'openai' else 'ollama'
    return al.LLM(al_provider, model=model or p['model'], api_key=key or None, base_url=base_url or p['url'],
                  temperature=temperature, max_tokens=max_tokens, verbose=True)
'''


MCP_IMPORT = '''try:
    from mcp.server import MCPServer as FastMCP          # mcp 2.x
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP           # mcp 1.x
    except ImportError:
        sys.exit('MCP 공식 SDK 가 필요합니다:  pip install mcp')

# stdio 전송에서는 stdout 이 프로토콜 전용이므로 모든 print() 를 stderr 로 보낸다
import builtins as _builtins
_print = _builtins.print
_builtins.print = lambda *a, **k: _print(*a, **{**k, 'file': k.get('file') or sys.stderr})


def run_mcp(server, transport='stdio', host='127.0.0.1', port=8000):
    """stdio 또는 Streamable HTTP 로 서버 실행 (mcp 1.x · 2.x 공용).
    환경 변수 MCP_TRANSPORT(stdio | streamable-http) · MCP_HOST · MCP_PORT 가 있으면 그 값을 쓴다 (빌더의 ▶ 실행이 사용)"""
    transport = os.environ.get('MCP_TRANSPORT') or transport
    host = os.environ.get('MCP_HOST') or host
    port = int(os.environ.get('MCP_PORT') or port)
    if transport == 'stdio':
        return server.run('stdio')
    try:
        server.run(transport, host=host, port=port)       # mcp 2.x: run(transport, host=, port=)
    except TypeError:
        server.settings.host, server.settings.port = host, port   # mcp 1.x: settings
        server.run(transport)
'''


def var_name(node, counts):
    t = node['type']
    base = {'input': 'question', 'output': 'result', 'chat': 'answer', 'llm': 'llm', 'tool': 'tool', 'pytool': 'tool', 'agent_tool': 'tool'}.get(t, t)
    name = node.get('config', {}).get('name') if t == 'input' else None
    if name and re.match(r'^[A-Za-z_]\w*$', str(name)):
        base = str(name)
    counts[base] = counts.get(base, 0) + 1
    return f'{base}{counts[base]}' if not (t == 'input' and name and counts[base] == 1) else base


class Exporter:
    def __init__(self, graph):
        self.graph = graph
        self.nodes, self.in_edges, self.out_edges, self.order, self.back = E.analyze(graph)
        self.helpers = set()
        self.defs = []
        self.providers_used = set()
        self.vars = {}
        self.mcp_servers = []           # [(var, transport)] — 있으면 FastMCP 서버 스크립트로 내보낸다
        self.max_loops = int((graph.get('settings') or {}).get('max_loops') or 5)

    # ---------------- 식
    def port_expr(self, nid, port):
        """(노드, 출력 포트) → 파이썬 식"""
        node = self.nodes[nid]
        var = self.vars[nid]
        _, outs = E.ports_of(node)
        names = [o['name'] for o in outs]
        if node['type'] in ('router', 'guard'):
            # 분기 노드의 출력값 = 입력값 (guard 의 blocked 는 메시지)
            if node['type'] == 'guard' and port == 'blocked':
                return f'{var}_blocked'
            return self.input_expr_single(nid, 'input')
        if names and port == names[0]:
            return var
        return f'{var}_{port}'

    def port_is_list(self, nid, port):
        _, outs = E.ports_of(self.nodes[nid])
        return any(o['name'] == port and o.get('list') for o in outs)

    def input_expr_single(self, nid, port):
        for e in self.in_edges[nid]:
            if e['toPort'] == port and e['id'] not in self.back:
                return self.port_expr(e['from'], e['fromPort'])
        return 'None'

    def inputs_for(self, nid):
        node = self.nodes[nid]
        ins, _ = E.ports_of(node)
        multi = {p['name'] for p in ins if p.get('multi')}
        vals = {}
        for e in self.in_edges[nid]:
            ex = self.port_expr(e['from'], e['fromPort'])
            if self.port_is_list(e['from'], e['fromPort']) and e['toPort'] in multi:
                ex = '*' + ex
            if e['id'] in self.back:
                fwd = vals.get(e['toPort'])
                # 되돌아온 값이 있으면 그것을, 없으면(첫 반복) 앞쪽 값을 쓴다
                ex = f"({ex} if {ex} is not None else {fwd if isinstance(fwd, str) else 'None'})"
                vals[e['toPort']] = ex
                continue
            if e['toPort'] in multi:
                vals.setdefault(e['toPort'], []).append(ex)
            else:
                if e['toPort'] in vals and not isinstance(vals[e['toPort']], list):
                    continue
                vals[e['toPort']] = ex
        return vals

    # ---------------- 조건
    def edge_atom(self, e):
        src = self.nodes[e['from']]
        if src['type'] in ('router', 'guard'):
            return f"{self.vars[e['from']]} == {N.q(e['fromPort'])}"
        return None

    def conditions(self):
        """노드별 실행 조건 (DNF: [[atom, ...], ...]; 빈 절 = 항상)"""
        cond = {}
        for nid in self.order:
            ins, _ = E.ports_of(self.nodes[nid])
            data_ports = {p['name'] for p in ins if p.get('kind', 'text') in E.DATA_KINDS}
            fwd = [e for e in self.in_edges[nid] if e['id'] not in self.back and e['toPort'] in data_ports]
            if not fwd:
                cond[nid] = [[]]
                continue
            clauses = []
            for e in fwd:
                atom = self.edge_atom(e)
                for c in cond.get(e['from'], [[]]):
                    cl = list(c) + ([atom] if atom else [])
                    if cl not in clauses:
                        clauses.append(cl)
            if any(not c for c in clauses):
                clauses = [[]]
            # 한 분기 노드의 모든 출력이 다 모이면(합류) 조건이 없는 것과 같다
            if all(len(c) == 1 for c in clauses) and len(clauses) > 1:
                atoms = [c[0] for c in clauses]
                var = atoms[0].split(' == ')[0]
                if all(a.startswith(var + ' == ') for a in atoms):
                    rid = next((k for k, v in self.vars.items() if v == var), None)
                    if rid is not None:
                        _, outs = E.ports_of(self.nodes[rid])
                        if {N.q(o['name']) for o in outs} <= {a.split(' == ', 1)[1] for a in atoms}:
                            clauses = [[]]
            cond[nid] = clauses
        return cond

    @staticmethod
    def cond_expr(clauses):
        if any(not c for c in clauses):
            return ''
        parts = [' and '.join(c) if len(c) == 1 else '(' + ' and '.join(c) + ')' for c in clauses]
        return ' or '.join(parts)

    # ---------------- 생성
    def export(self):
        counts = {}
        for nid in self.order:
            self.vars[nid] = var_name(self.nodes[nid], counts)
        cond = self.conditions()
        # 루프 영역: back edge (src → tgt) → order[idx(tgt) .. idx(src)]
        idx = {nid: i for i, nid in enumerate(self.order)}
        grouped = {}
        for e in sorted((e for es in self.out_edges.values() for e in es if e['id'] in self.back), key=lambda e: idx[e['to']]):
            grouped.setdefault((idx[e['to']], idx[e['from']]), []).append(e)
        regions = [(s, t, es) for (s, t), es in grouped.items()]
        for i, (s1, t1, _) in enumerate(regions):
            for s2, t2, _ in regions[i + 1:]:
                if (s2 <= t1 and s1 <= t2) and not (s1 <= s2 and t2 <= t1) and not (s2 <= s1 and t1 <= t2):
                    raise ExportError('서로 겹치는 반복 구조는 파이썬 코드로 내보낼 수 없습니다 — JSON 저장 후 run_graph.py 로 실행하세요')
        # 노드별 코드
        body = {}
        type_index = {}
        for nid in self.order:
            node = self.nodes[nid]
            if node['type'] == 'note':
                body[nid] = []
                continue
            ti = type_index.get(node['type'], 0)
            type_index[node['type']] = ti + 1
            ectx = ECtx(self, node, self.vars[nid], self.inputs_for(nid), ti)
            lines = N.REGISTRY[node['type']].export(ectx)
            label = node.get('label') or N.REGISTRY[node['type']].label
            body[nid] = [f"# ── {label} ({N.REGISTRY[node['type']].label})"] + list(lines)
        # 조건부 · 루프 안에서 정의되는 변수는 미리 None 으로
        pre = []
        for nid in self.order:
            in_region = any(s <= idx[nid] <= t for s, t, _ in regions)
            if (cond[nid] != [[]] or in_region) and self.nodes[nid]['type'] != 'note':
                pre.append(self.vars[nid])
                _, outs = E.ports_of(self.nodes[nid])
                for o in outs[1:]:
                    pre.append(f"{self.vars[nid]}_{o['name']}")
                if self.nodes[nid]['type'] == 'guard':
                    pre.append(f'{self.vars[nid]}_blocked')
        out = []
        if pre:
            out.append('# 조건 · 반복 안에서 정해지는 값 (처음에는 None)')
            out.append(' = '.join(dict.fromkeys(pre)) + ' = None')
            out.append('')
        # 영역 트리로 들여쓰기
        def emit_range(a, b, depth, skip=None):
            i = a
            while i <= b:
                nid = self.order[i]
                region = next(((s, t, es) for s, t, es in regions if s == i and t <= b and (s, t) != skip), None)
                if region is not None:
                    s, t, es = region
                    label = self.nodes[es[0]['to']].get('label') or N.REGISTRY[self.nodes[es[0]['to']]['type']].label
                    out.append('    ' * depth + f"for _loop{s} in range({self.max_loops}):   # 반복: '{label}' 로 되돌아가는 연결")
                    emit_range(s, t, depth + 1, skip=(s, t))
                    conds = []
                    for e in es:
                        atom = self.edge_atom(e)
                        c = self.cond_expr(cond[e['from']])
                        conds.append(' and '.join(x for x in [c and f'({c})', atom] if x) or 'True')
                    back_cond = ' or '.join(f'({c})' for c in conds) if len(conds) > 1 else conds[0]
                    out.append('    ' * (depth + 1) + f'if not ({back_cond}):')
                    out.append('    ' * (depth + 2) + 'break')
                    out.append('')
                    i = t + 1
                    continue
                lines = body[nid]
                if lines:
                    c = self.cond_expr(cond[nid])
                    if c:
                        out.append('    ' * depth + f'if {c}:')
                        out.extend('    ' * (depth + 1) + ln for ln in lines)
                    else:
                        out.extend('    ' * depth + ln for ln in lines)
                    out.append('')
                i += 1
        emit_range(0, len(self.order) - 1, 0)
        return self._assemble(out)

    def _assemble(self, flow):
        g = self.graph
        name = g.get('name') or 'agent'
        envs = sorted({providers.info(p)['env'] for p in self.providers_used if providers.info(p)['env']}) or ['키 불필요']
        parts = [HEADER.format(name=name, desc=(g.get('description') or '').strip(), file=safe_filename(name) + '.py', envs=', '.join(envs))]
        if self.mcp_servers:
            parts[0] = parts[0].replace(f'실행:  python {safe_filename(name)}.py "질문"', f'실행:  pip install mcp  →  python {safe_filename(name)}.py   (MCP 서버: Claude Desktop · Cursor 의 mcpServers 에 등록)')
        if self.providers_used:
            table = {p: {k: providers.info(p)[k] for k in ('label', 'al', 'url', 'env', 'model')} for p in sorted(self.providers_used)}
            parts.append('\n# ---------------------------------------------------------------- LLM 공급자')
            parts.append(MAKE_LLM.format(providers=json.dumps(table, ensure_ascii=False, indent=4).replace('true', 'True').replace('false', 'False')))
        if self.helpers:
            parts.append('\n# ---------------------------------------------------------------- 도우미')
            for h in ['fmt', 'to_text', 'first', 'route_keywords', 'route_llm', 'guard_check', 'mcp_client', 'skills']:
                if h in self.helpers:
                    parts.append(N.HELPERS[h] + '\n')
        if self.defs:
            parts.append('\n# ---------------------------------------------------------------- 도구 · 함수 정의')
            for d in self.defs:
                parts.append(d + '\n')
        if self.mcp_servers:
            parts.append('\n# ---------------------------------------------------------------- MCP 서버 (공식 SDK: pip install mcp)')
            parts.append(MCP_IMPORT)
            parts.append('\n# ---------------------------------------------------------------- 도구 · 리소스 · 프롬프트 정의 (노드 순서대로)')
            parts.extend(flow)
            var, transport, host, port = self.mcp_servers[0]
            where = f' http://{host}:{port}/mcp' if transport != 'stdio' else ''
            parts.append('\n\ndef main():')
            parts.append(f"    print('🧰 MCP 서버 {var} 실행 ({transport}{where})', file=sys.stderr)")
            parts.append(f"    run_mcp({var}, {json.dumps(transport)}, host={json.dumps(host)}, port={port})")
            if len(self.mcp_servers) > 1:
                parts.append('    # 서버 노드가 여러 개입니다 — 첫 서버만 실행합니다')
            parts.append('\n\nif __name__ == \'__main__\':\n    main()\n')
            return '\n'.join(parts)
        parts.append('\n# ---------------------------------------------------------------- 에이전트 흐름 (노드 순서대로)')
        parts.append('def main():')
        parts.extend('    ' + ln if ln else '' for ln in flow)
        parts.append('\n\nif __name__ == \'__main__\':\n    main()\n')
        return '\n'.join(parts)


def safe_filename(name):
    s = re.sub(r'[^\w가-힣\-]+', '_', str(name or 'agent')).strip('_')
    return s or 'agent'


def export_python(graph):
    return Exporter(graph).export()


def skill_files(graph):
    """그래프의 스킬 노드 → {'<name>/SKILL.md': 내용, '<name>/references/notes.md': …} (Claude Code · Claude.ai 에 그대로 올리는 형식)"""
    from . import skills as S
    out = {}
    for n in graph.get('nodes') or []:
        cfg = n.get('config') or {}
        if n['type'] == 'skill':
            res = {'notes.md': str(cfg.get('references')).strip()} if str(cfg.get('references') or '').strip() else {}
            s = S.Skill(cfg.get('name') or 'skill', cfg.get('description') or '', cfg.get('instructions') or '', resources=res, keywords=cfg.get('keywords') or '')
        elif n['type'] == 'skill_import':
            s = S.Skill.from_md(cfg.get('md'))
        else:
            continue
        out[f'{s.name}/SKILL.md'] = s.to_md()
        for fn, content in s.resources.items():
            out[f'{s.name}/references/{fn}'] = content
    return out


def env_example(graph):
    """내보낸 코드와 함께 쓰는 .env.example"""
    used = set()
    for n in graph.get('nodes') or []:
        if n['type'] == 'llm':
            used.add((n.get('config') or {}).get('provider') or 'mock')
    lines = ['# 이 파일을 .env 로 복사하고 키를 채우세요. .env 는 절대 git 에 올리지 마세요.']
    for p in providers.PROVIDERS:
        if p['env'] and (p['id'] in used or not used):
            lines.append(f"{'' if p['id'] in used else '# '}{p['env']}=   # {p['label']} — {p['signup']}")
    return '\n'.join(lines) + '\n'
