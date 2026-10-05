# 차시 콘텐츠 작성 가이드 (AI 에이전트 강좌)

사이트는 **3단 화면** 하나(`index.html`)로 동작합니다.
- 왼쪽: 강의 목차(Part → 차시 → 교시), 학생용/교사용 전환, 🔑 API 키 설정
- 가운데: 🎓 학생용 = 문서(개념 · 그림 · 예제 · 실습 · 퀴즈) + 아래 코드 편집기 / 🧑‍🏫 교사용 = **PPT 슬라이드**(16:9, 화면 전환 · 판서 · 타이머) + 교사 노트
- 오른쪽: **실행 결과 창** — 파이썬(Pyodide, 브라우저 안)의 출력. 에이전트의 생각 → 도구 호출 → 관찰 → 답 과정이 여기에 찍힙니다.

각 차시는 `lessons/agNN.js` 파일 하나이며 `PY_COURSE.addChapter({...})` 를 한 번 호출합니다.
평범한 브라우저 스크립트입니다 (import/export 금지, 전역 변수 금지 → `(function(){ ... })();` 안에서 상수 정의).
`js/course.js` 의 `order` 에 차시 id(`ag00`~`ag13`), 제목, colab 노트북 이름이 이미 있습니다.

## 1. 구조

```js
(function () {
  const FIG_X = `<svg ...>...</svg>`;        // 그림은 상수로 만들어 content 와 slides 에서 함께 사용
  function demoInit(root, MLB) { ... }        // 체험 데모 초기화 함수 (선택)
  const QUIZ = [ {q, options, answer, explain}, ... ];

  PY_COURSE.addChapter({
    id: 'ag04', no: '04', title: '...', subtitle: '...',
    summary: '차시 요약 (html)',
    goals: ['차시 학습 목표', ...],
    sections: [ /* 교시 = 50분 1개. 차시마다 2~3개 */ ]
  });
})();
```

섹션(교시):
```js
{ id: 'ag04-1', title: '교시 제목', minutes: 50,
  goals: ['...'], flow: [['도입', 5], ['개념', 15], ['실습', 20], ['정리', 10]],   // 합계 = minutes
  content: [ /* 본문 블록 */ ], practice: [ /* 실습 */ ], quiz: [ /* 퀴즈 3~5 */ ], slides: [ /* 슬라이드 8~14장 */ ] }
```

## 2. 본문 블록 (`content`)

| type | 필드 | 설명 |
|---|---|---|
| `h` | `text` | 소제목 |
| `p` | `html` | 문단 |
| `list` | `items`, `ordered?` | 목록 |
| `table` | `head`, `rows`, `caption?` | 표 |
| `figure` | `html`(인라인 SVG), `caption` | 그림 |
| `code` | `title`, `code`, `desc?`, `expect?`, `run?`, `nondeterministic?` | **브라우저에서 실행되는 파이썬 예제** |
| `callout` | `kind: tip/warn/info/more`, `title?`, `html` | 강조 상자 (`more` = 📘 더 알아보기) |
| `demo` | `title`, `desc?`, `html`, `init(root, MLB)` | 인터랙티브 캔버스 체험 (선택) |
| `colab` | `title`, `html` | 🟠 Colab 노트북 안내 상자 (버튼은 자동으로 붙음) |

어떤 블록이든 `teacher: true` 를 붙이면 **교사용 화면에만** 보입니다 (수업 준비 체크리스트, 오개념 지도 팁, 평가 루브릭, 확장 활동, 실습 정답 해설 등 — 보통 마지막 교시 끝에 둡니다).

### 원칙: 이론 → 그림 → 코드
쉬운 비유 → 정확한 정의 → 그림(SVG) → 실행 코드 → 해석. 수식은 거의 없으며 필요하면 HTML 로 씁니다.
**브라우저 실습(agentlab 미니 프레임워크)으로 원리를 체험 → Colab 에서 실제 프레임워크(LangChain · CrewAI · AutoGen)로 같은 것을 다시 만든다**는 흐름을 지킵니다.

## 3. 파이썬 코드 (가장 중요)

브라우저 파이썬(Pyodide 3.14)에서 실행됩니다. **사용 가능:** 표준 라이브러리(json · re · math · datetime · sqlite3 · dataclasses · typing …)와 강좌 모듈 `agentlab`. (numpy · pandas · matplotlib 도 쓸 수 있지만 처음 로딩이 느리므로 꼭 필요할 때만)
**사용 불가:** langchain, langgraph, crewai, autogen, openai, google-generativeai, anthropic, requests 등 pip 패키지 전부.
→ 실제 프레임워크 코드는 `run: false` 코드 블록(title 에 “Colab 에서 실행” 표기)으로 **보여 주고**, 실행은 `colab` 블록으로 안내합니다.
   브라우저에서는 같은 개념을 `agentlab` 으로 직접 실행합니다 (아래 API 참고 — 실제 프레임워크와 이름을 맞춰 두었으므로 코드가 거의 같습니다).

- 각 코드는 **그대로 실행되는 완전한 프로그램** (앞 예제 변수에 기대지 말 것 — 매번 `import agentlab as al` 부터).
- **LLM 은 `al.LLM()`** 으로 만듭니다. 사용자가 🔑 키를 넣었으면 실제 모델, 없으면 **모의 LLM**(규칙 기반, 항상 같은 답)이 답합니다. 예제는 **키가 없어도 의미 있게 동작**해야 합니다.
  - 모의 LLM 이 잘 처리하는 요청: 인사 · 자기소개 · 에이전트 설명 · 요약(“요약해줘: …”) · 번역 · 검토/비평 · 수정/반영 · 조사 · 블로그 글 작성 · 계획(JSON) · 감성 분류(JSON) · 정보 추출(JSON, 이름/이메일/전화) · 이름 기억(“내 이름은 영준이야” → “내 이름이 뭐지?”) · 코드 작성(“두 수를 더하는 함수”) · 코드 리뷰(리뷰어 역할 + 코드 → TERMINATE) · 아이디어 제안
  - 도구가 주어지면 질문 키워드로 도구를 고릅니다: 날씨(`get_weather` 류) · 계산(“1500 * 0.15”, “3 더하기 4”) · 검색/위키(“…에 대해 검색해줘/알아봐”) · 시간(“지금 몇 시”) · 파일 저장/읽기 · 메모. 도구 결과를 받으면 그 결과로 답합니다.
  - 역할(system prompt 의 “당신은 OO입니다”)이 있으면 답 앞에 `[OO]` 가 붙습니다 → 페르소나 수업에서 역할이 바뀌는 것을 눈으로 확인할 수 있습니다.
  - 정해진 대사가 꼭 필요하면 `al.LLM(mock_responses=['첫 답', '둘째 답'])` — 키가 없을 때만 이 답을 차례로 돌려줍니다.
- **expect**: 검증 도구는 모의 LLM(오프라인) 기준으로 실행하므로 출력이 고정됩니다. `node tools/validate.js ag04 --print` 로 실제 출력을 보고 `expect` 에 넣으세요. 실제 키로 실행하면 출력이 달라진다는 점을 예제 `desc` 에 한 번씩 언급합니다(“예시 출력은 모의 LLM 기준”). 네트워크를 쓰는 도구(`get_weather` · `wiki_search`)는 키가 없어도 브라우저에서는 실제 API 를 부르므로 `nondeterministic: true` 를 붙입니다.
- **실행 시간:** 예제 하나가 5초 이내. 모의 LLM 은 즉시 답하지만 실제 LLM 은 호출당 1~5초이므로 LLM 호출 횟수는 예제당 6회 이내로.
- JS 템플릿 문자열 안의 파이썬 코드: `${` 금지(파이썬 f-string 은 `{}` 이므로 괜찮음), 백틱 금지, **`\n` 은 `\\n` 으로** (그냥 print() 를 여러 번 쓰는 것이 안전).
- **실습(practice)** 의 `starter` 는 문법 오류 없이 실행되는 뼈대(# TODO 주석), `solution` 은 완전한 정답 (교사용에서만 보임). 섹션마다 1~3개, `level` 1~3, `hint` 권장.

### agentlab API 요약 (`py/agentlab/`)

```python
import agentlab as al
al.status()                       # 현재 LLM 설정 출력 (모의 / 실제)
al.providers()                    # 공급자 표
llm = al.LLM()                    # 자동 선택. al.LLM('gemini', model=..., api_key=...) / al.LLM('mock')
llm.ask('질문', system_prompt='당신은 …')         # → str
r = llm.chat([al.system('…'), al.user('…')], tools=[...], json_mode=False)   # → Response
r.content · r.tool_calls · r.usage.total_tokens · r.json() · r.message()
llm.total_usage · llm.calls · llm.verbose = True   # 호출 추적

@al.tool                          # 함수 → Tool (docstring 첫 줄 = 설명, "인자: 설명" 줄 = 매개변수 설명, 타입 힌트 = 스키마)
def add(a: int, b: int) -> int:
    """두 수를 더한다
    a: 첫 수
    b: 둘째 수
    """
    return a + b
add.schema() · add.call({'a': 1, 'b': 2}) · add(1, 2) · add.describe()
al.ToolRegistry([...]).execute(tool_call)
내장 도구: al.calculator · al.get_weather(Open-Meteo) · al.wiki_search(위키백과) · al.now · al.read_file · al.write_file · al.remember_note

agent = al.Agent(llm, tools=[...], system='…', memory=None, max_steps=6, verbose=True)
agent.run('…') · agent.trace() · agent.steps · agent.memory · agent.reset()
al.ReActAgent(llm, tools=[...]).run('…')          # Thought/Action/Observation 텍스트 형식
al.Planner(llm).plan('목표') → [단계…] · .execute(goal, worker)
al.Reflector(llm).critique(text) · .revise(text, feedback) · .improve(text, rounds=2) · .score(text)

al.ConversationMemory(window=6, system_prompt=…) : add_user · add_assistant · messages() · show()
al.SummaryMemory(llm, window=4)                   : 오래된 대화를 요약으로 압축
al.VectorStore() : add(text, meta) · search(query, k) → [(score, text, meta)] · context(query)
al.embed(texts) · al.cosine(a, b) · al.Embedder(llm)

# 미니 LangChain
al.PromptTemplate('…{x}…', system='…') | llm | al.StrOutputParser() / al.JsonOutputParser()  → .invoke({...})
al.RunnableLambda(fn) · al.RunnableParallel({...}) · al.RunnablePassthrough() · al.ChatPromptTemplate.from_messages([...]) · al.chain(a, b, c)
# 미니 LangGraph
g = al.StateGraph(); g.add_node('n', fn); g.add_edge(al.START, 'n'); g.add_conditional_edges('n', router, {'a': 'n2', 'done': al.END})
app = g.compile(checkpointer=al.MemorySaver()); app.invoke(state, {'thread_id': 'a'}) · for ev in app.stream(state) · g.draw()
# 미니 CrewAI
al.CrewAgent(role, goal, backstory, llm, tools) · al.Task(description, expected_output, agent, context=[...]) · al.Crew(agents, tasks, verbose=True).kickoff()
# 미니 AutoGen
al.ConversableAgent(name, system_message, llm) · a.initiate_chat(b, message, max_turns) · al.GroupChat(agents, max_round) · al.GroupChatManager(gc, llm).run(message)
```

## 4. 그림 (SVG)

- 인라인 SVG 는 다음 CSS 클래스를 사용합니다:
  `.p1~.p5`(채움) `.p1s~.p5s`(연한 채움) `.s1~.s5`(선) `.ln` `.ax` `.tx` `.tx-m` `.tx-b` `.tx-w` `.card-bg` `.fill-arrow` `.bg`
- `<marker id>` 등 SVG 안의 id 는 **차시 접두어로 고유하게** (예: `m04a1`). 같은 그림을 content 와 slides 에서 함께 쓰는 것은 괜찮음 — 단, 하나의 교시 문서 안에 같은 id 가 두 번 나오면 안 됨.
- 하드코딩 색 금지 (CSS 클래스 / `var(--f-p1)` 등 사용). viewBox 는 가로 640~720, 세로 200~360.
- 자주 쓰는 그림: 에이전트 루프(생각 → 행동 → 관찰), LLM ↔ 도구 흐름, 메모리 계층(단기/장기), 그래프(노드 · 엣지 · 조건 분기), 에이전트 팀 구조.

## 5. 체험 데모 (`demo`) — 선택

```js
const DEMO_HTML = `<canvas></canvas><div class="controls"><label>단계 <input type="range" min="1" max="6" value="1" data-k></label><span class="readout" data-out></span></div>`;
function demoInit(root, MLB) {
  const cv = root.querySelector('canvas');
  const { ctx, w, h } = MLB.setupCanvas(cv, 640, 340);
  const P = () => MLB.palette();           // {bg,line,text,muted,p1..p5,p1s..p5s}
  MLB.onTheme(draw, cv);
}
```
- `document.getElementById` · id 속성 금지 → `root.querySelector('[data-…]')`. 전역 변수 · 외부 라이브러리 금지.
- 같은 데모를 content(`type:'demo'`)와 slides(`layout:'demo'`) 양쪽에 넣을 수 있음.

## 6. 퀴즈

`{ q: 'html', options: ['..','..','..','..'], answer: 0부터, explain: 'html' }` — 섹션마다 3~5문항. q 안 코드는 `<pre><code>…</code></pre>` (`<` → `&lt;`).

## 7. 교사용 슬라이드 (`slides`) — PPT 화면

한 장 = 객체 하나, **모든 슬라이드에 `notes`**(교사 노트: 말할 내용, 💬 발문과 예상 답, 주의점, 시간). 섹션당 8~14장.
첫 장 뒤에 “학습 목표 + 수업 흐름” 슬라이드가 자동으로 들어갑니다.

| layout | 필드 |
|---|---|
| `title` | `title`, `subtitle?` — 섹션 첫 장 |
| `bullets` | `title`, `bullets: [html \| [html, [하위…]]]`, `lead?` — 불릿 3~6개, 한 줄 40자 안팎 |
| `code` | `title`, `code`(18줄 이내, 실행 가능), `points?: [html 2~4개]` — 교사가 슬라이드에서 수정 · ▶ 실행 |
| `two` | `title`, `left: {title, bullets?/html?/code?}`, `right: {...}` |
| `table` | `title`, `head`, `rows`, `lead?` |
| `diagram` | `title`, `html`(SVG), `caption?` |
| `demo` | `title`, `html`, `init`, `caption?` |
| `quiz` | `title`, `q`, `options`, `answer`, `explain` |
| `practice` | `title`, `desc`, `starter`, `solution` |
| `summary` | `title`, `bullets` — 섹션 마지막 장 |

권장 흐름: `title` → 개념(bullets/diagram) → 예제(code) → … → quiz → practice → summary.
수업 흐름 · 발문 · 오개념 · 정답 · 루브릭은 **notes 와 teacher 블록**으로 작성합니다. 슬라이드 코드도 검증 도구가 실행하므로 `run: false` 가 아니면 실행 가능해야 합니다.

## 8. Colab 연결

차시 개요와 교시 상단에 🟠 Colab 버튼이 자동으로 붙습니다 (`course.js` 의 colab). 본문에는 `colab` 블록을 한 번 넣어
Colab 노트북에서 무엇을 하는지(pip 설치, 실제 LangChain/CrewAI/AutoGen, API 키는 Colab Secrets) 안내하세요.
노트북 소스는 `tools/nb_src/<colab이름>.py` (jupytext percent 형식, `python tools/build_notebooks.py` 로 변환) — 차시와 함께 작성합니다.

## 9. 검증 (필수)

```bash
node tools/validate.js ag04 --jobs 8        # 스키마 + 모든 코드 실행(로컬 CPython, 오프라인 모의 LLM) + expect 비교
node tools/validate.js ag04 --print         # 실제 출력 보기 (expect 작성용)
```
오류 0 이 될 때까지 고치세요 (경고 “expect 없음”은 괜찮음).
