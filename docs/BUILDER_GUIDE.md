# Part 5 · 6 작성 가이드 — agentBuilder · MCP · Agent Skills 를 강좌 안에서 다루는 방법

agentBuilder(https://github.com/samcho93/agentBuilder) 는 이 강좌에서 배운 구조를 **노드를 연결해 조립 · 실행 · 파이썬 코드로 내보내는** 웹 빌더입니다.
- 🌐 열기: https://samcho93.github.io/agentBuilder/ (브라우저 세션 모드) · https://agentbuilder.pages.dev/ (서버 금고 모드) · 내 PC `python server/app.py` → http://localhost:8090
- 빌더 안 **📘 튜토리얼** 버튼에 캡처 포함 안내가 내장되어 있다 (절: 소개 · 첫 에이전트 · 속성 · 키 · 실행 · 내보내기 · 예제 · 도구 에이전트 · 기억/RAG · 분기/반복/계획/반성 · 팀 · 가드레일/평가 · MCP 서버 · 에이전트↔MCP · 스킬 · 배포)

## 1. 강좌 안에서 실행하기 (브라우저 · 검증 도구 공용)

빌더의 실행 엔진 `py/builder/` 와 예제 그래프 `assets/builder/*.json` 이 이 저장소에 복사되어 있다 (원본은 agentBuilder, `python tools/sync_builder.py` 로 다시 가져온다 — **py/builder 는 여기서 고치지 않는다**).
예제 JSON 은 실행 시 작업 폴더에 `builder/<이름>.json` 으로 놓이므로 파이썬 코드에서 바로 열 수 있다.

```python
import json
from builder import engine, export, nodes

g = json.load(open('builder/04_tool_agent.json', encoding='utf-8'))   # 예제 그래프
print(g['name'], '· 노드', len(g['nodes']), '· 간선', len(g['edges']))
for n in g['nodes']:
    print(f"{n['id']:<4}{n['type']:<10}{n['label']}")

# 실행 — emit 콜백으로 이벤트(node_start · log · node_end · loop · result · done · error)를 받는다
def show(ev):
    if ev['type'] == 'log':      print('  ', ev['text'])
    elif ev['type'] == 'result': print('===', ev['title'], '===\n', ev['value'])
    elif ev['type'] == 'done':   print('완료 · LLM 호출', ev['usage']['calls'], '회')
engine.run_graph(g, overrides={'n1': '부산 날씨는?'}, emit=show)   # overrides: 시작 입력 노드 id → 값

errs = engine.validate(g)          # 연결 오류 목록 ([] 이면 정상)
code = export.export_python(g)     # 독립 파이썬 스크립트 문자열 (키는 .env/환경 변수에서)
print(code[:800])
cat = nodes.catalog()              # 노드 카탈로그 {'categories': [...], 'nodes': [...]}
```

- `engine.run_graph(graph, overrides=None, emit=None, key_resolver=None, session=None)` — `session` dict 를 넘기면 기억 · 문서 저장소가 실행 간에 유지된다 (같은 dict 를 다시 넘긴다).
- 오프라인(검증 도구)에서는 LLM 모델 노드의 공급자가 무엇이든 **모의 LLM** 으로 돈다. 예제 JSON 은 모두 `provider: "mock"` 이다.
- 그래프를 코드에서 직접 만들어도 된다: `{'version': 1, 'name': ..., 'nodes': [{'id','type','label','x','y','config':{...}}], 'edges': [{'id','from','fromPort','to','toPort'}], 'settings': {'max_loops': 5}}`. 포트 이름은 아래 카탈로그 참고. `x, y` 는 화면 좌표(실행에 무관).
- 내보낸 코드를 실제로 실행해 보려면: `exec` 대신 파일로 저장한 뒤 `import runpy; runpy.run_path('out.py', run_name='__main__')` — 내보낸 코드는 `sys.argv[1]` 을 첫 입력으로 쓰므로 `sys.argv = ['out.py', '질문']` 을 먼저 설정한다. (agentlab 은 이미 import 가능)

## 2. 예제 그래프 (assets/builder) — 강좌 차시와 짝

| 파일 | 내용 | 차시 |
|---|---|---|
| 01_hello_llm | 입력 → LLM 호출 → 결과 | ag02 |
| 02_persona_chain | 역할(시스템 프롬프트) · 프롬프트 템플릿 · JSON 구조화 출력 | ag03 |
| 04_tool_agent | 날씨 · 계산기 · 위키 도구 에이전트 (trace 출력 포함) | ag04 · ag11 |
| 05_memory_chat | 대화 기억으로 이름 기억 (여러 번 실행) | ag05 |
| 05_rag | 사내 규정 문서 벡터 저장소 → 근거 있는 답 | ag05 |
| 06_reflection | 계획 → 초안 → 비평·수정 → 평가 점수 | ag06 |
| 06_react | ReAct + 파이썬 도구 직접 작성 | ag06 |
| 08_router_loop | 조건 분기 · 점수에 따른 되돌아가기(루프) | ag08 |
| 09_crew | 조사원 → 작가 → 편집자 Crew | ag09 · ag12 |
| 10_autogen | 코더 ↔ 리뷰어 2자 대화 · 그룹 채팅 | ag10 |
| 11_assistant_full | 분기 + 도구 에이전트 + RAG + 기억 종합 비서 | ag11 |
| 13_guardrail | 입력 검사 → 에이전트 → 출력 검사 → LLM 심사 | ag13 |
| 14_mcp_server | 도구 · 리소스 · 프롬프트 → MCP 서버 → JSON-RPC 호출 테스트 | ag16 |
| 15_mcp_agent | 에이전트 → 도구 포장 · MCP 클라이언트로 원격 도구 사용 | ag16 |
| 16_skills | Skill 정의 · SKILL.md 가져오기 · 스킬 선택/프롬프트 조립 | ag17 |

## 3. 노드 카탈로그 (36종) — `type` · 포트 · 설정

`in(이름:종류)` / `out(이름:종류)`, `*` = 여러 개 연결 가능. 종류: text(값이 흐름) · llm · tool · memory · agent · task · mcp · resource · prompt · skill(자원 포트)

```
input          ▶ 시작 입력         [io]     in()  out(text)                         cfg(text, name)
output         🏁 결과             [io]     in(value:text)  out()                   cfg(title)
text           📝 텍스트           [io]     in()  out(text)                         cfg(text)
template       🧩 프롬프트 템플릿   [io]     in({이름} 마다 포트 생성)  out(text)      cfg(template)
note           🗒 메모             [io]     실행 무관                               cfg(text)
llm            🧠 LLM 모델         [model]  in()  out(llm)                          cfg(provider, model, key_ref, base_url, temperature, max_tokens)
chat           💬 LLM 호출         [model]  in(llm, input:text, context:text)  out(text, json)   cfg(system, prompt, json_mode)
tool           🔧 내장 도구        [tool]   in()  out(tool)                         cfg(name: calculator|get_weather|wiki_search|now|read_file|write_file|remember_note)
pytool         🐍 파이썬 도구      [tool]   in()  out(tool)                         cfg(code: def 함수(...) 와 docstring)
agent          🤖 에이전트         [agent]  in(llm, tools*, input, memory, skills*)  out(text, trace)   cfg(system, max_steps)
react          🧭 ReAct            [agent]  in(llm, tools*, input)  out(text, transcript)             cfg(system, max_steps)
planner        🗺️ 계획 세우기      [agent]  in(llm, input, context)  out(steps, text)                 cfg(max_steps)
plan_execute   📋 계획 후 실행     [agent]  in(llm, tools*, input)  out(text, results)               cfg(max_steps, system)
reflector      🔍 비평 · 수정      [agent]  in(llm, input, criteria)  out(text, feedback)            cfg(rounds, criteria, critic_system, writer_system)
memory         🧠 대화 기억        [memory] in(llm)  out(memory)                                     cfg(kind: window|summary, window)
vectorstore    📚 문서 검색(RAG)   [memory] in(query:text, llm)  out(context, hits)                  cfg(documents, k)
router         🔀 조건 분기        [flow]   in(input, llm)  out(routes 마다 포트)                     cfg(mode: keyword|llm|python, routes, default_label, expr)
merge          🔗 병합             [flow]   in(values*)  out(text)                                   cfg(mode, sep)
python         🐍 파이썬 코드      [flow]   in(input, a, b)  out(output)                              cfg(code)
crew_agent     🧑‍💼 역할 에이전트   [team]   in(llm, tools*)  out(agent)                               cfg(role, goal, backstory)
crew_task      📌 작업             [team]   in(agent, context:task*)  out(task)                       cfg(description, expected_output)
crew           👥 Crew 실행        [team]   in(tasks*, input)  out(text, outputs)                     cfg()
ag_agent       🗣️ 대화 에이전트    [team]   in(llm)  out(agent)                                       cfg(name, system_message)
ag_chat        💞 2자 대화         [team]   in(a:agent, b:agent, input)  out(text, transcript)        cfg(max_turns)
ag_group       👨‍👩‍👧 그룹 채팅      [team]   in(agents*, llm, input)  out(text, transcript)           cfg(max_round, method)
guard          🛡️ 가드레일         [safety] in(input)  out(pass, blocked)                             cfg(banned, max_len, message)
judge          ⚖️ 평가(LLM 심사)   [safety] in(llm, input, reference)  out(score, report, text)       cfg(criteria)
agent_tool     🎁 에이전트 → 도구  [tool]   in(llm, tools*, memory)  out(tool)                        cfg(name, description, system, max_steps)
mcp_server     🧰 MCP 서버         [mcp]    in(tools*, resources*, prompts*)  out(server:mcp, text)   cfg(name, version, instructions, transport, host, port)
mcp_resource   📄 MCP 리소스       [mcp]    in(text)  out(resource)                                   cfg(uri, name, description, mime_type, content)
mcp_prompt     🧾 MCP 프롬프트     [mcp]    in()  out(prompt)                                         cfg(name, description, template)
mcp_call       📡 MCP 호출(테스트) [mcp]    in(server, input)  out(result, response)                  cfg(method: tools/list|tools/call|resources/read|prompts/get, name, arguments)
mcp_client     🔌 MCP 클라이언트   [mcp]    in(server)  out(tools, info)                              cfg(url, key_ref)
skill          📚 Skill 정의       [skill]  in(tools*)  out(skill)                                    cfg(name, description, keywords, instructions, references)
skill_import   📄 SKILL.md 가져오기 [skill] in(tools*)  out(skill)                                    cfg(md)
skill_prompt   🧮 스킬 선택·조립   [skill]  in(skills*, input, llm)  out(system, tools, selected)     cfg(base_system, mode: auto|all)
```

실행 규칙(engine.py): 되돌아가는 간선을 뺀 위상 순서로 실행 → 조건 분기는 고른 포트로만 값을 보내고 활성 입력이 없는 노드는 건너뜀(skip) → 되돌아가는 간선이 활성화되면 그 목적지부터 다시 실행(`settings.max_loops`) → 기억 · 문서 저장소는 session 에 보관.

## 4. MCP · Skills 파이썬 API (빌더 안 순수 파이썬 구현)

```python
import agentlab as al
from builder.mcp import MiniMCPServer, MCPClient, Resource, Prompt, agent_as_tool
server = MiniMCPServer('demo', tools=[al.calculator], resources=[Resource('doc://rules', '규정', '사내 규정', 'text/plain', '…')], prompts=[Prompt('summ', '요약', '다음을 요약: {text}')])
server.handle({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'})          # JSON-RPC 응답 dict
client = MCPClient(server=server)                                             # 메모리 전송 (원격: MCPClient(url='https://…/mcp', headers={...}))
client.list_tools() · client.call_tool('calculator', {'expression': '1+2'}) · client.tools()  # → [al.Tool …] 에이전트에 바로 연결
t = agent_as_tool(llm, 'researcher', '조사 담당 에이전트', system='…', tools=[al.wiki_search])   # 에이전트를 도구로 포장

from builder.skills import Skill, SkillSet, skills_apply
s = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='# 보고서 작성\n1. …', keywords='보고서, 요약', tools=[al.calculator])
s2 = Skill.from_md(open('SKILL.md').read())  · s.to_md()
ss = SkillSet([s, s2]); chosen = ss.select('매출 보고서 써줘')  (llm= 을 주면 LLM 이 고른다)
system = ss.build_system('당신은 비서입니다.', chosen); tools = ss.tools_for(chosen)
system, tools, selected = skills_apply([s, s2], '매출 보고서 써줘', base_system='당신은 비서입니다.', llm=llm)   # 내보낸 코드가 쓰는 한 줄 버전
```

내보내기(export.py): `export_python(graph)` · `skill_files(graph)` → {파일경로: 내용} (SKILL.md 폴더) · `env_example(graph)` → .env.example. mcp_server 노드가 있으면 FastMCP(`pip install mcp`) 서버 스크립트가 된다.

## 5. 차시에서 캡처 화면 쓰기

튜토리얼 캡처가 `img/builder/*.png` 에 있다 (PNG, 1280px 안팎). figure 블록에 `<img>` 로 넣는다:

```js
{ type: 'figure', html: '<img src="img/builder/13_tool_agent_run.png" alt="도구 에이전트 실행 로그" loading="lazy">', caption: '그림 14-3. 04 예제 실행 — 생각 → 도구 호출 → 관찰 로그' }
```
슬라이드(`layout: 'diagram'`)에서도 같은 html 을 쓸 수 있다. 사용 가능한 캡처:
`01_overview`(전체 화면) `02_palette`(팔레트) `03_add_nodes` `04_connect_drag` `05_props_chat_panel`(속성) `06_llm_key_panel`(키) `07_keys_modal`(키 관리) `08_run_log`(실행 로그) `09_results` `10_code_panel`(파이썬 코드 탭) `11_json_panel`(그래프 JSON) `12_examples_menu`(예제 메뉴) `13_tool_agent_run` `14_router_loop_run` `15_memory_run` `16_rag_run` `17_crew_run` `18_autogen_run` `19_guardrail_blocked` `20_assistant_full` `21_reflection_run` `23_mcp_server` `23_mcp_call_panel` `23_mcp_log` `24_mcp_agent_run` `26_skills` `26_skill_panel` `26_skill_prompt`

## 6. 차시 구성 (Part 5 · Part 6)

- **ag14 agentBuilder 시작하기** — 빌더 화면(①상단 바 ②팔레트 ③캔버스 ④속성/코드/JSON ⑤실행/결과), 노드 · 포트(색 = 종류) · 간선, 첫 그래프(01) 만들기, 속성(역할 · 프롬프트 · JSON), 키 관리(서버 금고 `key_ref` vs 브라우저 세션 — 그래프 · 코드 · 로그에 키가 없음), 실행 로그 읽기, 🐍 파이썬 코드 내보내기 ↔ 강좌의 agentlab 코드 1:1 대응, 📦 ZIP · `run_graph.py`. 브라우저 실습: 그래프 JSON 을 파이썬으로 읽고 실행 · 검증 · 내보내기 · 노드를 코드로 추가해 보기.
- **ag15 agentBuilder 로 다시 만드는 에이전트** — 예제 04 · 05 · 06 · 08 · 09 · 10 · 11 · 13 을 강좌 차시와 대응시키며 그래프 읽기 → 실행 → 내보낸 코드 비교: 도구 에이전트, 기억(session 유지), RAG, 계획/반성, 조건 분기 · 병합 · 되돌아가기(루프, max_loops), Crew, AutoGen, 가드레일 · LLM 심사, 종합 비서. 브라우저 실습: 그래프를 코드로 수정(노드 추가 · 분기 조건 바꾸기 · 도구 추가)하고 실행.
- **ag16 MCP(Model Context Protocol)** (Part 6) — 왜 표준이 필요한가(도구를 앱마다 다시 연결하는 문제, M×N → M+N), 구조(호스트 · 클라이언트 · 서버), JSON-RPC 2.0 메서드(initialize · tools/list · tools/call · resources/list · resources/read · prompts/list · prompts/get), 전송(stdio · Streamable HTTP), 미니 MCP 서버를 파이썬으로 만들고 요청/응답을 직접 보기(builder.mcp.MiniMCPServer.handle), MCPClient 로 도구를 받아 에이전트에 연결, 에이전트를 도구로 포장해 MCP 로 노출(agent_as_tool), agentBuilder 의 MCP 노드(예제 14 · 15)와 🧰 MCP 서버 실행 버튼, FastMCP(공식 SDK `pip install mcp`) 서버 코드(run:false)와 Claude Desktop · Cursor `mcpServers` 등록, 보안(토큰 · 허용 목록 · 사용자 승인). Colab: FastMCP 서버 + 클라이언트 실제 실행.
- **ag17 Agent Skills** (Part 6) — 스킬이란(지시문 + 참고 자료 + 스크립트/도구를 폴더로 묶은 재사용 능력), SKILL.md 형식(frontmatter name · description · 본문 지시문 · references/ · scripts/), 점진적 로딩(1단계: 이름 · 설명만 → 2단계: 선택된 스킬의 지시문 · 도구 활성화)의 이유(컨텍스트 절약), builder.skills.Skill / SkillSet / skills_apply 로 직접 구현(키워드 선택 · LLM 선택), 스킬 vs 도구 vs 시스템 프롬프트 비교, agentBuilder 의 Skill 노드(예제 16)와 📁 SKILL.md 폴더 내보내기, 좋은 description 쓰기(언제 쓰는지), Claude Code(`.claude/skills/`) · Managed Agents(`skills` 배열 · Skills API) · Messages API(`container.skills`) · claude.ai 에 붙이는 방법(run:false 요약), 스킬 평가(선택 정확도 테스트). Colab: 스킬 폴더 생성 · zip · 간단한 선택 평가.
