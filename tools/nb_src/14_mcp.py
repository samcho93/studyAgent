# %% [markdown]
# # 14. MCP(Model Context Protocol) — FastMCP 서버를 만들고 공식 클라이언트로 부르기
#
# 브라우저에서는 순수 파이썬 미니 구현(`builder.mcp`)으로 JSON-RPC 흐름을 익혔습니다. 이 노트북에서는 **공식 파이썬 SDK**(`pip install mcp`)로
# ① FastMCP 서버 파일을 쓰고 ② 자식 프로세스(stdio)로 띄워 공식 `ClientSession` 으로 부르고 ③ 원시 JSON-RPC 줄을 직접 주고받아 보고
# ④ 서버의 도구를 **실제 Gemini** 의 함수 호출 도구로 연결하고 ⑤ Streamable HTTP 로 띄워 브라우저와 같은 `MCPClient(url=…)` 로 연결합니다.
#
# | 단계 | 내용 | 브라우저 예제 |
# |---|---|---|
# | 1 | `%%writefile server.py` — FastMCP 서버 (도구 2 · 리소스 1 · 프롬프트 1) | 14-1 · 14-8 |
# | 2 | 공식 stdio 클라이언트: initialize · list_tools · call_tool · read_resource · get_prompt | 14-6 · 14-15 |
# | 3 | 원시 JSON-RPC 줄을 stdin/stdout 으로 직접 주고받기 | 14-2 ~ 14-5 |
# | 4 | MCP 도구 → Gemini 함수 호출 (실제 모델이 MCP 도구를 고른다) | 14-11 |
# | 5 | Streamable HTTP 로 띄우고 `builder.mcp.MCPClient(url=…)` 로 연결 | 14-14 |
# | ✏️ | 실습 문제 3개 (리소스 · 프롬프트 추가 / 허용 목록 / 등록 설정) | 14-1 · 14-16 · 14-10 |
#
# **API 키**: 🔑 Secrets 의 `GEMINI_API_KEY` (4단계에서만 필요).

# %% [markdown]
# ## 0. 설치 · agentlab/builder 내려받기 · 키 설정
# `mcp` 는 공식 SDK, `google-genai` 는 Gemini SDK 입니다. 브라우저와 같은 `builder.mcp.MCPClient` 를 5단계에서 쓰려고 강좌 저장소도 받아 둡니다.
#
# > ℹ️ `mcp<2` 로 고정합니다. **mcp 2.x** 에서는 `FastMCP` 가 `MCPServer` 로 이름이 바뀌고(`from mcp.server import MCPServer`) 결과 필드가 `server_info · input_schema · is_error` 처럼
# > snake_case 가 되었습니다. 프로토콜(JSON-RPC 메시지)은 같고 파이썬 쪽 이름만 다릅니다. 이 노트북은 1.x 이름(= 프로토콜 스펙의 필드 이름)으로 씁니다.

# %%
!pip -q install "mcp>=1.10,<2" google-genai nest_asyncio
!git clone -q https://github.com/samcho93/studyAgent.git /content/studyAgent 2>/dev/null || (cd /content/studyAgent && git pull -q)

# %%
import os, sys, json, asyncio, subprocess, time
sys.path.insert(0, "/content/studyAgent/py")
import nest_asyncio
nest_asyncio.apply()                      # 노트북 안에서 asyncio.run() 을 쓸 수 있게

from google.colab import userdata
try:
    os.environ["GEMINI_API_KEY"] = userdata.get("GEMINI_API_KEY")
    print("GEMINI_API_KEY 설정됨 (4단계에서 사용)")
except Exception:
    print("GEMINI_API_KEY 가 없습니다 — 4단계만 건너뜁니다")

import mcp
print("mcp SDK 버전:", getattr(mcp, "__version__", "?"))

# %% [markdown]
# ## 1. FastMCP 서버 파일 쓰기
# 브라우저 예제 14-1 의 `MiniMCPServer(tools=…, resources=…, prompts=…)` 가 공식 SDK 에서는 **데코레이터 3개**가 됩니다.
# - `@mcp.tool()` : 함수 이름 · docstring · 타입 힌트 → `inputSchema` (= `@al.tool`)
# - `@mcp.resource("uri")` : `resources/read` 가 부르는 함수
# - `@mcp.prompt()` : `prompts/get` 이 부르는 함수 — 매개변수가 `arguments`
#
# ⚠️ stdio 전송에서는 **stdout 이 프로토콜 전용**입니다. 디버그 출력은 반드시 `file=sys.stderr` 로 보내세요.
# 실행 인자로 `http` 를 주면 Streamable HTTP(`http://127.0.0.1:8000/mcp`)로 뜹니다 (5단계).

# %%
%%writefile server.py
import sys
try:
    from mcp.server.fastmcp import FastMCP          # mcp 1.x
except ImportError:
    from mcp.server import MCPServer as FastMCP     # mcp 2.x: FastMCP → MCPServer 로 이름이 바뀜

mcp = FastMCP('company-helper', instructions='계산 · 환율 도구와 사내 규정 리소스, 요약 프롬프트를 제공합니다.')

@mcp.tool()
def calculator(expression: str) -> dict:
    """수식을 계산한다. 예: '1500 * 0.15', '(3 + 4) * 2'"""
    try:
        return {'expression': expression, 'result': eval(expression, {'__builtins__': {}}, {})}
    except Exception as e:
        return {'error': f'계산 실패: {e}'}

@mcp.tool()
def exchange_rate(currency: str) -> dict:
    """통화의 원화 환율을 알려준다 (예시 데이터). currency: 통화 코드, 예 USD · EUR · JPY"""
    rates = {'USD': 1380.5, 'EUR': 1490.2, 'JPY': 9.1}
    return {'currency': currency.upper(), 'krw': rates.get(currency.upper(), 0)}

@mcp.resource('docs://company/policy')
def policy() -> str:
    """사내 규정 문서"""
    return '연차는 1년에 15일이다.\n재택근무는 주 2회까지 가능하며 팀장 승인이 필요하다.\n점심 시간은 12시부터 1시까지다.'

@mcp.prompt()
def summarize(language: str, text: str) -> str:
    """글을 세 줄로 요약하는 프롬프트"""
    return f'다음 글을 {language} 로 세 줄 요약해줘:\n\n{text}'

if __name__ == '__main__':
    transport = 'streamable-http' if 'http' in sys.argv[1:] else 'stdio'
    print(f'company-helper 서버 시작 ({transport})', file=sys.stderr)     # stdout 금지!
    mcp.run(transport)                                                   # stdio: stdin/stdout · http: 127.0.0.1:8000/mcp

# %% [markdown]
# ## 2. 공식 stdio 클라이언트로 부르기
# `StdioServerParameters(command, args)` 는 Claude Desktop 설정의 `"command"` / `"args"` 와 같은 모양입니다.
# `stdio_client` 가 자식 프로세스를 띄우고, `ClientSession` 이 `initialize` 핸드셰이크와 요청/응답을 담당합니다 (브라우저의 `MCPClient` 역할).

# %%
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER = StdioServerParameters(command=sys.executable, args=['server.py'])

async def demo_stdio():
    async with stdio_client(SERVER) as (read, write):
        async with ClientSession(read, write) as session:
            info = await session.initialize()                                   # initialize + notifications/initialized
            print('서버:', info.serverInfo.name, info.serverInfo.version, '| 프로토콜:', info.protocolVersion)
            print('instructions:', info.instructions)

            tools = await session.list_tools()                                  # tools/list
            for t in tools.tools:
                print('🔧', t.name, '-', t.description[:40], '| 매개변수:', list(t.inputSchema.get('properties', {})))

            r = await session.call_tool('exchange_rate', {'currency': 'usd'})   # tools/call
            print('tools/call →', r.content[0].text, '| isError =', r.isError)
            if r.structuredContent:
                print('structuredContent →', r.structuredContent)

            res = await session.read_resource('docs://company/policy')         # resources/read
            print('resources/read →', res.contents[0].text.splitlines()[0], '…')

            p = await session.get_prompt('summarize', {'language': '한국어', 'text': 'MCP 는 도구 서버의 표준이다.'})   # prompts/get
            print('prompts/get →', p.messages[0].content.text)

asyncio.run(demo_stdio())

# %% [markdown]
# ## 3. 원시 JSON-RPC 를 직접 주고받기
# 클라이언트가 숨겨 준 것을 벗겨 봅니다. 서버 프로세스를 띄우고 **stdin 에 JSON 한 줄**을 쓰면 **stdout 에 JSON 한 줄**이 돌아옵니다.
# 브라우저 예제 14-2 ~ 14-5 에서 `server.handle(dict)` 로 하던 일과 메시지가 완전히 같습니다 — 운반 수단만 다릅니다.

# %%
def start_raw_server():
    """server.py 를 자식 프로세스로 띄운다 (stderr 는 버린다 — 파이프가 차면 멈추므로)"""
    return subprocess.Popen([sys.executable, 'server.py'], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, text=True, encoding='utf-8', bufsize=1)

def send(proc, msg):
    proc.stdin.write(json.dumps(msg, ensure_ascii=False) + '\n'); proc.stdin.flush()
    print('→', json.dumps(msg, ensure_ascii=False)[:120])
    if 'id' in msg:                                     # 알림(id 없음)에는 응답이 없다
        resp = json.loads(proc.stdout.readline())
        print('←', json.dumps(resp, ensure_ascii=False)[:160])
        return resp

proc = start_raw_server()
try:
    send(proc, {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
                'params': {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'raw-client', 'version': '0.1'}}})
    send(proc, {'jsonrpc': '2.0', 'method': 'notifications/initialized'})
    r = send(proc, {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list'})
    print('도구:', [t['name'] for t in r['result']['tools']])
    r = send(proc, {'jsonrpc': '2.0', 'id': 3, 'method': 'tools/call', 'params': {'name': 'calculator', 'arguments': {'expression': '1500 * 0.15'}}})
    print('결과:', r['result']['content'][0]['text'])
    r = send(proc, {'jsonrpc': '2.0', 'id': 4, 'method': 'tools/call', 'params': {'name': 'teleport', 'arguments': {}}})
    print('없는 도구 → isError =', r['result']['isError'], '|', r['result']['content'][0]['text'])      # FastMCP 는 isError 로 알린다
    r = send(proc, {'jsonrpc': '2.0', 'id': 5, 'method': 'resources/read', 'params': {'uri': 'docs://nope'}})
    print('없는 리소스 → error:', r.get('error'))                                                  # 이것은 error 객체
finally:
    proc.kill()

# %% [markdown]
# > 미니 서버(`MiniMCPServer`)는 없는 도구를 `-32602` error 객체로 돌려줬지만 FastMCP 는 `isError: true` 결과로 돌려줍니다 — 스펙이 둘 다 허용하는 범위 안에서 **구현마다 선택이 다릅니다**.
# > 클라이언트 코드는 두 경우를 모두 처리해야 합니다 (브라우저의 `MCPClient.call_tool` 은 `isError` 를 `{'error': …}` 로, error 객체는 예외로 바꿉니다).

# %% [markdown]
# ## 4. MCP 도구 → Gemini 함수 호출
# 브라우저 예제 14-11 의 `al.Agent(tools=client.tools())` 를 실제 모델로 다시 만듭니다.
# `tools/list` 의 `inputSchema` 를 Gemini 의 `FunctionDeclaration.parameters` 로 넣으면 끝 — **MCP 는 함수 호출을 대체하는 것이 아니라 도구 목록을 공급**한다는 것이 코드로 보입니다.
# 모델이 `function_call` 을 돌려주면 우리가 `session.call_tool` 로 실행하고 `function_response` 로 돌려줍니다 (04차시 5단계 루프).

# %%
from google import genai
from google.genai import types

def mcp_tools_to_gemini(tools):
    """MCP tools/list 결과 → Gemini Tool (스키마의 포장지만 바꾼다)"""
    decls = []
    for t in tools:
        schema = {k: v for k, v in t.inputSchema.items() if k in ('type', 'properties', 'required')}
        decls.append(types.FunctionDeclaration(name=t.name, description=t.description or t.name, parameters=schema))
    return types.Tool(function_declarations=decls)

async def ask_with_mcp(question, allow=None, max_steps=5):
    client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
    async with stdio_client(SERVER) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = (await session.list_tools()).tools
            if allow is not None:
                tools = [t for t in tools if t.name in allow]                 # 허용 목록 (실습 2)
            config = types.GenerateContentConfig(tools=[mcp_tools_to_gemini(tools)],
                                                 automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True))
            contents = [types.Content(role='user', parts=[types.Part(text=question)])]
            for _ in range(max_steps):
                r = client.models.generate_content(model='gemini-2.5-flash', contents=contents, config=config)
                content = r.candidates[0].content
                contents.append(content)
                calls = [p.function_call for p in content.parts if p.function_call]
                if not calls:
                    return r.text
                parts = []
                for call in calls:
                    result = await session.call_tool(call.name, dict(call.args))        # MCP 서버가 실행
                    text = result.content[0].text
                    print(f'🔧 tools/call {call.name}({dict(call.args)}) → 👁 {text}')
                    parts.append(types.Part.from_function_response(name=call.name, response={'result': text}))
                contents.append(types.Content(role='user', parts=parts))
            return '(최대 단계 초과)'

if os.environ.get('GEMINI_API_KEY'):
    print(asyncio.run(ask_with_mcp('100달러는 원화로 얼마야? 환율 도구로 확인하고 계산해줘')))
else:
    print('GEMINI_API_KEY 가 없어 건너뜁니다')

# %% [markdown]
# ## 5. Streamable HTTP 로 띄우고 원격처럼 연결하기
# 같은 서버를 `python server.py http` 로 띄우면 `http://127.0.0.1:8000/mcp` 하나의 엔드포인트가 열립니다.
# 브라우저에서 메모리 전송으로 쓰던 `builder.mcp.MCPClient` 에 `url=` 만 주면 그대로 HTTP 클라이언트가 됩니다 (예제 14-14).
# 공식 SDK 의 HTTP 클라이언트는 `mcp.client.streamable_http.streamablehttp_client` 입니다.

# %%
http_proc = subprocess.Popen([sys.executable, 'server.py', 'http'], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
time.sleep(3)                                                     # 서버가 뜰 때까지

from builder.mcp import MCPClient                                 # 브라우저와 같은 클라이언트
client = MCPClient(url='http://127.0.0.1:8000/mcp', verbose=True)
print('서버:', client.initialize()['serverInfo'])
print('세션 id:', client.session_id)
print('도구:', [t['name'] for t in client.list_tools()])
print('call_tool →', client.call_tool('exchange_rate', {'currency': 'EUR'}))
print('read_resource →', client.read_resource('docs://company/policy').splitlines()[0])

# %%
# 공식 SDK 의 Streamable HTTP 클라이언트로도 같은 서버에 연결
from mcp.client.streamable_http import streamablehttp_client

async def demo_http():
    async with streamablehttp_client('http://127.0.0.1:8000/mcp') as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            r = await session.call_tool('calculator', {'expression': '12 * 12'})
            print('공식 HTTP 클라이언트 →', r.content[0].text)

asyncio.run(demo_http())
http_proc.terminate()

# %% [markdown]
# ## 6. Claude Desktop · Cursor 에 등록하기
# 내 PC 에서는 `server.py` 를 아래처럼 `mcpServers` 에 적으면 앱이 stdio 로 서버를 직접 띄웁니다.
# (Colab 의 파일은 PC 로 내려받아 경로를 바꾸세요.)

# %%
config = {
    'mcpServers': {
        'company-helper': {
            'command': 'python',
            'args': [os.path.abspath('server.py')],
        }
    }
}
print(json.dumps(config, ensure_ascii=False, indent=2))
print('\nClaude Desktop: claude_desktop_config.json  ·  Cursor: .cursor/mcp.json')

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 리소스와 프롬프트 추가하기
# `server2.py` 에 **FAQ 리소스**(`docs://company/faq`, 두 줄)와 **번역 프롬프트**(`translate(language, text)`)를 추가하고,
# 공식 클라이언트로 `list_resources` · `list_prompts` · `read_resource` · `get_prompt` 를 호출해 확인하세요.

# %%
%%writefile server2.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP('company-helper-2')

@mcp.tool()
def calculator(expression: str) -> dict:
    """수식을 계산한다"""
    return {'result': eval(expression, {'__builtins__': {}}, {})}

# BEGIN SOLUTION
@mcp.resource('docs://company/faq')
def faq() -> str:
    """자주 묻는 질문"""
    return 'Q: 출근 시간은? A: 9시입니다.\nQ: 주차는? A: 지하 2층입니다.'

@mcp.prompt()
def translate(language: str, text: str) -> str:
    """번역 프롬프트"""
    return f'다음 문장을 {language} 로 번역해줘: {text}'
# END SOLUTION

if __name__ == '__main__':
    mcp.run(transport='stdio')

# %%
async def check_server2():
    async with stdio_client(StdioServerParameters(command=sys.executable, args=['server2.py'])) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print('리소스  :', [r.uri for r in (await session.list_resources()).resources])
            print('프롬프트:', [(p.name, [a.name for a in (p.arguments or [])]) for p in (await session.list_prompts()).prompts])
            # BEGIN SOLUTION
            print((await session.read_resource('docs://company/faq')).contents[0].text)
            print((await session.get_prompt('translate', {'language': '영어', 'text': '안녕하세요'})).messages[0].content.text)
            # END SOLUTION

asyncio.run(check_server2())

# %% [markdown]
# ### 문제 2. 허용 목록으로 도구 제한하기
# 4단계의 `ask_with_mcp` 는 `allow=` 인자를 받습니다. `calculator` 만 허용한 채 환율 질문을 던져 모델이 **환율 도구를 쓰지 못하고** 어떻게 답하는지 보고,
# 두 도구를 모두 허용했을 때와 비교하세요. 왜 서버가 주는 도구를 전부 연결하면 안 되는지 한 줄로 적어 보세요.

# %%
if os.environ.get('GEMINI_API_KEY'):
    # BEGIN SOLUTION
    print('--- calculator 만 허용 ---')
    print(asyncio.run(ask_with_mcp('100달러는 원화로 얼마야?', allow={'calculator'})))
    print('--- 두 도구 모두 허용 ---')
    print(asyncio.run(ask_with_mcp('100달러는 원화로 얼마야?', allow={'calculator', 'exchange_rate'})))
    # 이유: 서버가 위험한 도구(삭제 · 결제)를 섞어 줄 수 있으므로 필요한 것만 넘기고, 위험한 것은 승인 게이트 뒤에 둔다.
    # END SOLUTION
else:
    print('GEMINI_API_KEY 가 없어 건너뜁니다')

# %% [markdown]
# ### 문제 3. (도전) 원시 JSON-RPC 로 prompts/get 보내기
# 3단계의 `start_raw_server()` · `send()` 로 `server.py` 를 다시 띄우고 **initialize → initialized → prompts/list → prompts/get(summarize)** 를 직접 보내
# 완성된 프롬프트 텍스트를 꺼내 출력하세요. 응답의 어느 키를 따라가야 하는지(`result.messages[0].content.text`) 확인하는 것이 목표입니다.

# %%
proc = start_raw_server()
try:
    # BEGIN SOLUTION
    send(proc, {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
                'params': {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'raw', 'version': '0.1'}}})
    send(proc, {'jsonrpc': '2.0', 'method': 'notifications/initialized'})
    r = send(proc, {'jsonrpc': '2.0', 'id': 2, 'method': 'prompts/list'})
    print('프롬프트:', [p['name'] for p in r['result']['prompts']])
    r = send(proc, {'jsonrpc': '2.0', 'id': 3, 'method': 'prompts/get',
                    'params': {'name': 'summarize', 'arguments': {'language': '영어', 'text': 'MCP 는 도구 서버의 표준이다.'}}})
    print('완성된 프롬프트:', r['result']['messages'][0]['content']['text'])
    # END SOLUTION
finally:
    proc.kill()

# %% [markdown] teacher
# 문제 2 가 이 노트북의 핵심 토론 거리입니다. calculator 만 허용하면 모델이 환율을 "대략 1,300원쯤"으로 **지어내거나** 모른다고 답합니다 —
# 허용 목록이 능력을 줄이는 대신 통제를 준다는 trade-off 를 학생이 말로 설명하게 하세요.
# 3단계에서 **없는 메서드**(예: `tools/delete`)를 보내면 mcp 1.x 서버는 요청 검증에 실패해 연결을 닫아 버리므로(readline 이 빈 줄) 예제에서 뺐습니다 —
# 궁금해하는 학생에게는 "프로토콜 오류는 구현에 따라 연결 종료로 이어질 수도 있다"고 설명하세요.
# `stdout` 에 `print()` 를 넣은 서버가 어떻게 깨지는지(JSON 파싱 오류) 시연하면 stdio 전송의 규칙이 오래 기억됩니다:
# `server.py` 의 `print(..., file=sys.stderr)` 에서 `file=` 을 지우고 2단계를 다시 실행해 보세요.
# 문제 3 은 응답 구조를 손으로 따라가는 연습이며, 브라우저 예제 14-4 의 출력과 글자 단위로 같다는 것을 확인시킵니다.

# %% [markdown]
# ---
# ## 📝 정리
# - FastMCP 데코레이터 3개(`tool · resource · prompt`) = 브라우저 `MiniMCPServer` 의 세 목록. 구조가 1:1 로 같다.
# - stdio 클라이언트 = Claude Desktop 이 하는 일: `command/args` 로 프로세스를 띄우고 `initialize → tools/list → tools/call`. **stdout 은 프로토콜 전용**.
# - 원시 JSON-RPC 줄을 직접 써 보면 클라이언트가 숨긴 것이 보인다 — `id` 짝 맞추기, 알림은 응답 없음, `error` vs `isError`.
# - MCP 는 함수 호출을 대체하지 않는다: `inputSchema` 를 Gemini 의 `parameters` 에 그대로 넣고, 실행만 `session.call_tool` 로 서버에 맡긴다.
# - Streamable HTTP 는 `url=` 한 줄 차이. 토큰은 환경 변수에서, 도구는 허용 목록으로, 위험한 도구는 승인 게이트 뒤에.
