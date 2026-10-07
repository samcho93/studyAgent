"""미니 MCP (Model Context Protocol) — 순수 파이썬 서버 · 클라이언트 (브라우저 Pyodide · CPython 공용)

MCP 는 LLM 앱(클라이언트)이 외부 서버의 **도구(tools) · 리소스(resources) · 프롬프트(prompts)** 를 JSON-RPC 2.0 으로
쓰는 표준이다. 이 모듈은 그 프로토콜의 핵심 메서드를 그대로 구현해 빌더 안에서 서버를 정의하고 호출해 볼 수 있게 한다.

    server = MiniMCPServer('my-server', tools=[al.calculator], resources=[...], prompts=[...])
    server.handle({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'})      # → JSON-RPC 응답 dict

    client = MCPClient(server=server)                 # 메모리 전송 (빌더 안 테스트)
    client = MCPClient(url='https://.../mcp', headers={'Authorization': 'Bearer …'})   # Streamable HTTP (원격 서버)
    client.list_tools() · client.call_tool('add', {'a': 1, 'b': 2}) · client.tools() → [al.Tool …]

실제 서버 코드는 export.py 가 FastMCP(공식 python SDK: pip install mcp) 형태로 내보낸다.
"""
import json
import re

import agentlab as al
from agentlab import _http
from agentlab.tools import result_text

PROTOCOL_VERSION = '2025-06-18'


def _sse_last_json(text):
    """SSE(text/event-stream) 본문에서 마지막 data: JSON 을 꺼낸다"""
    last = None
    for line in str(text).splitlines():
        if line.startswith('data:'):
            try:
                last = json.loads(line[5:].strip())
            except ValueError:
                continue
    return last


def _request(url, method, headers, body):
    """→ (status, text, response_headers). 브라우저에서는 _webbridge, CPython 에서는 urllib"""
    if _http.offline():
        return 0, 'offline', {}
    try:
        import _webbridge  # 브라우저(Pyodide 워커)
        r = json.loads(_webbridge.fetch_json(url, method, json.dumps(headers), body or ''))
        return int(r.get('status', 0)), r.get('text', ''), {k.lower(): v for k, v in (r.get('headers') or {}).items()}
    except ImportError:
        pass
    import urllib.request
    import urllib.error
    req = urllib.request.Request(url, data=(body.encode('utf-8') if body else None), method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode('utf-8', 'replace'), {k.lower(): v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace'), {k.lower(): v for k, v in e.headers.items()}
    except Exception as e:  # noqa
        return 0, str(e), {}


# ====================================================================== 서버
class Resource:
    def __init__(self, uri, content='', name=None, description='', mime_type='text/plain', fn=None):
        self.uri = uri
        self.content = content
        self.fn = fn
        self.name = name or uri.split('/')[-1] or uri
        self.description = description
        self.mime_type = mime_type

    def read(self):
        return self.fn() if self.fn else self.content

    def describe(self):
        return {'uri': self.uri, 'name': self.name, 'description': self.description, 'mimeType': self.mime_type}


class Prompt:
    def __init__(self, name, template, description=''):
        self.name = name
        self.template = template
        self.description = description
        self.arguments = []
        for m in re.finditer(r'{(\w+)}', template):
            if m.group(1) not in self.arguments:
                self.arguments.append(m.group(1))

    def render(self, args=None):
        args = args or {}
        return re.sub(r'{(\w+)}', lambda m: str(args.get(m.group(1), '')), self.template)

    def describe(self):
        return {'name': self.name, 'description': self.description, 'arguments': [{'name': a, 'required': True} for a in self.arguments]}


class MiniMCPServer:
    """MCP 서버의 핵심 메서드를 처리한다 (JSON-RPC 2.0 요청 dict → 응답 dict)"""

    def __init__(self, name='agentBuilder-server', version='1.0.0', instructions='', tools=None, resources=None, prompts=None):
        self.name = name
        self.version = version
        self.instructions = instructions
        self.tools = {}
        for t in tools or []:
            t = t if isinstance(t, al.Tool) else al.Tool(t)
            self.tools[t.name] = t
        self.resources = {r.uri: r for r in (resources or [])}
        self.prompts = {p.name: p for p in (prompts or [])}
        self.log = []          # [(request, response)]
        self.initialized = False

    # ---------------- 안내
    def manifest(self):
        return {'name': self.name, 'version': self.version,
                'tools': [self._tool_desc(t) for t in self.tools.values()],
                'resources': [r.describe() for r in self.resources.values()],
                'prompts': [p.describe() for p in self.prompts.values()]}

    @staticmethod
    def _tool_desc(t):
        return {'name': t.name, 'description': t.description, 'inputSchema': t.parameters}

    # ---------------- JSON-RPC
    def handle(self, request):
        """요청 하나 처리. 알림(id 없음)이면 None"""
        rid = request.get('id')
        method = request.get('method', '')
        params = request.get('params') or {}
        try:
            if method == 'initialize':
                self.initialized = True
                result = {'protocolVersion': params.get('protocolVersion') or PROTOCOL_VERSION,
                          'capabilities': {'tools': {'listChanged': False}, 'resources': {'subscribe': False, 'listChanged': False}, 'prompts': {'listChanged': False}},
                          'serverInfo': {'name': self.name, 'version': self.version}}
                if self.instructions:
                    result['instructions'] = self.instructions
            elif method.startswith('notifications/'):
                return None
            elif method == 'ping':
                result = {}
            elif method == 'tools/list':
                result = {'tools': [self._tool_desc(t) for t in self.tools.values()]}
            elif method == 'tools/call':
                name = params.get('name')
                t = self.tools.get(name)
                if t is None:
                    raise KeyError(f'알 수 없는 도구: {name}')
                out = t.call(params.get('arguments') or {})
                is_err = isinstance(out, dict) and 'error' in out and len(out) == 1
                result = {'content': [{'type': 'text', 'text': result_text(out, 100000)}], 'isError': bool(is_err)}
                if isinstance(out, dict) and not is_err:
                    result['structuredContent'] = out
            elif method == 'resources/list':
                result = {'resources': [r.describe() for r in self.resources.values()]}
            elif method == 'resources/read':
                uri = params.get('uri')
                r = self.resources.get(uri)
                if r is None:
                    raise KeyError(f'알 수 없는 리소스: {uri}')
                result = {'contents': [{'uri': r.uri, 'mimeType': r.mime_type, 'text': str(r.read())}]}
            elif method == 'prompts/list':
                result = {'prompts': [p.describe() for p in self.prompts.values()]}
            elif method == 'prompts/get':
                p = self.prompts.get(params.get('name'))
                if p is None:
                    raise KeyError(f"알 수 없는 프롬프트: {params.get('name')}")
                result = {'description': p.description, 'messages': [{'role': 'user', 'content': {'type': 'text', 'text': p.render(params.get('arguments'))}}]}
            else:
                resp = {'jsonrpc': '2.0', 'id': rid, 'error': {'code': -32601, 'message': f'Method not found: {method}'}}
                self.log.append((request, resp))
                return resp
            resp = {'jsonrpc': '2.0', 'id': rid, 'result': result}
        except KeyError as e:
            resp = {'jsonrpc': '2.0', 'id': rid, 'error': {'code': -32602, 'message': str(e).strip("'")}}
        except Exception as e:  # noqa
            resp = {'jsonrpc': '2.0', 'id': rid, 'error': {'code': -32603, 'message': f'{type(e).__name__}: {e}'}}
        self.log.append((request, resp))
        return resp

    def __repr__(self):
        return f'MiniMCPServer({self.name}: tools={list(self.tools)}, resources={list(self.resources)}, prompts={list(self.prompts)})'


# ====================================================================== 클라이언트
class MCPError(RuntimeError):
    pass


class MCPClient:
    """메모리 전송(server=) 또는 Streamable HTTP(url=) MCP 클라이언트"""

    def __init__(self, server=None, url=None, headers=None, name='agentBuilder', verbose=False):
        self.server = server
        self.url = url
        self.headers = dict(headers or {})
        self.session_id = None
        self.name = name
        self.verbose = verbose
        self._id = 0
        self.server_info = None
        self.transcript = []    # [(request, response)]

    # ---------------- 전송
    def _send(self, method, params=None, notify=False):
        req = {'jsonrpc': '2.0', 'method': method}
        if params is not None:
            req['params'] = params
        if not notify:
            self._id += 1
            req['id'] = self._id
        if self.verbose:
            print(f'→ {json.dumps(req, ensure_ascii=False)[:200]}')
        if self.server is not None:
            resp = self.server.handle(req)
        else:
            resp = self._send_http(req, notify)
        if self.verbose and resp is not None:
            print(f'← {json.dumps(resp, ensure_ascii=False)[:200]}')
        self.transcript.append((req, resp))
        if notify:
            return None
        if resp is None:
            raise MCPError('응답이 없습니다')
        if 'error' in resp:
            raise MCPError(f"MCP 오류 {resp['error'].get('code')}: {resp['error'].get('message')}")
        return resp.get('result')

    def _send_http(self, req, notify):
        if not self.url:
            raise MCPError('서버 주소가 없습니다')
        h = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': PROTOCOL_VERSION}
        h.update(self.headers)
        if self.session_id:
            h['Mcp-Session-Id'] = self.session_id
        st, text, rh = _request(self.url, 'POST', h, json.dumps(req, ensure_ascii=False))
        if st == 0:
            raise MCPError(f'MCP 서버에 연결하지 못했습니다: {text[:200]}')
        if rh.get('mcp-session-id'):
            self.session_id = rh['mcp-session-id']
        if notify or st == 202 or not text.strip():
            return None
        if st < 200 or st >= 300:
            raise MCPError(f'HTTP {st}: {text[:300]}')
        if text.lstrip().startswith('{'):
            return json.loads(text)
        data = _sse_last_json(text)
        if data is None:
            raise MCPError('응답을 해석하지 못했습니다: ' + text[:200])
        return data

    # ---------------- 공개 API
    def initialize(self):
        r = self._send('initialize', {'protocolVersion': PROTOCOL_VERSION, 'capabilities': {}, 'clientInfo': {'name': self.name, 'version': '1.0'}})
        self._send('notifications/initialized', notify=True)
        self.server_info = r.get('serverInfo') if isinstance(r, dict) else None
        return r

    def _ensure(self):
        if self.server_info is None:
            self.initialize()

    def list_tools(self):
        self._ensure()
        return (self._send('tools/list') or {}).get('tools', [])

    def call_tool(self, name, arguments=None):
        self._ensure()
        r = self._send('tools/call', {'name': name, 'arguments': arguments or {}}) or {}
        texts = [c.get('text', '') for c in r.get('content', []) if c.get('type') == 'text']
        if r.get('isError'):
            return {'error': '\n'.join(texts)}
        if 'structuredContent' in r:
            return r['structuredContent']
        text = '\n'.join(texts)
        try:
            return json.loads(text)
        except ValueError:
            return text

    def list_resources(self):
        self._ensure()
        return (self._send('resources/list') or {}).get('resources', [])

    def read_resource(self, uri):
        self._ensure()
        r = self._send('resources/read', {'uri': uri}) or {}
        return '\n'.join(c.get('text', '') for c in r.get('contents', []))

    def list_prompts(self):
        self._ensure()
        return (self._send('prompts/list') or {}).get('prompts', [])

    def get_prompt(self, name, arguments=None):
        self._ensure()
        r = self._send('prompts/get', {'name': name, 'arguments': arguments or {}}) or {}
        return '\n'.join(m.get('content', {}).get('text', '') for m in r.get('messages', []))

    def tools(self):
        """서버의 도구들을 agentlab Tool 로 감싼다 → 에이전트에 그대로 넣을 수 있다"""
        out = []
        for d in self.list_tools():
            out.append(_remote_tool(self, d))
        return out

    def request(self, method, params=None):
        """원시 JSON-RPC 요청 (테스트용) → 응답 dict"""
        if method != 'initialize' and not method.startswith('notifications/'):
            self._ensure()
        req = {'jsonrpc': '2.0', 'id': self._id + 1, 'method': method}
        if params:
            req['params'] = params
        self._id += 1
        resp = self.server.handle(req) if self.server is not None else self._send_http(req, False)
        self.transcript.append((req, resp))
        return resp


def _remote_tool(client, desc):
    name = desc.get('name', 'tool')
    schema = desc.get('inputSchema') or {'type': 'object', 'properties': {}}

    def fn(**kw):
        return client.call_tool(name, kw)
    fn.__name__ = name
    return al.Tool(fn, name=name, description=desc.get('description', '') or name, parameters=schema)


def agent_as_tool(llm, name, description, system=None, tools=None, memory=None, max_steps=6, param='question', param_desc='에이전트에게 맡길 질문 · 작업'):
    """에이전트를 하나의 도구로 포장한다 (상위 에이전트 · MCP 서버에서 호출)"""
    def fn(**kw):
        q = kw.get(param) or next(iter(kw.values()), '')
        agent = al.Agent(llm, tools=tools or [], system=system, memory=memory, max_steps=max_steps, verbose=True)
        return agent.run(str(q))
    fn.__name__ = name
    return al.Tool(fn, name=name, description=description, parameters={'type': 'object', 'properties': {param: {'type': 'string', 'description': param_desc}}, 'required': [param]})
