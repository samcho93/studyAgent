# 🕵️ AI 에이전트 구축: 파이썬으로 만드는 LLM 에이전트 (studyAgent)

LLM 이 스스로 **계획하고 · 도구를 호출하고 · 기억하고 · 반성하는** AI 에이전트를 파이썬으로 직접 만들어 보는 웹 강좌입니다.
같은 콘텐츠를 **학생용(문서 + 실습)** 과 **교사용(PPT 슬라이드 + 교사 노트)** 두 화면으로 제공합니다.

- 🌐 사이트: https://samcho93.github.io/studyAgent/
- 🎓 학생용: https://samcho93.github.io/studyAgent/student.html
- 🧑‍🏫 교사용: https://samcho93.github.io/studyAgent/teacher.html (기본 비밀번호 `samcho93` — `js/course.js` 의 `teacherPass` 에서 변경)

## 특징

- **브라우저에서 바로 실행** — 파이썬(Pyodide)이 브라우저 안에서 돌고, 에이전트의 *생각 → 도구 호출 → 관찰 → 답* 과정이 오른쪽 결과 창에 찍힙니다. 설치가 필요 없습니다.
- **무료 LLM** — 🔑 메뉴에서 Google Gemini · Groq · OpenRouter(무료 등급) · Ollama(로컬) 키를 넣으면 실제 모델이 답합니다. 키는 브라우저 세션에만 저장됩니다.
- **키가 없어도 동작** — 규칙 기반 **모의 LLM** 이 항상 같은 답을 돌려주므로 모든 예제 · 실습 · 슬라이드가 그대로 돌아갑니다.
- **미니 프레임워크 `agentlab`** — LLM 추상화 · `@tool` · 에이전트 루프 · 메모리(벡터 저장소) · 미니 LangChain / LangGraph / CrewAI / AutoGen 을 순수 파이썬으로 구현. 실제 프레임워크와 이름을 맞춰 두어 Colab 에서 바로 옮겨 갈 수 있습니다.
- **Colab 노트북** — 차시별로 실제 LangChain · LangGraph · CrewAI · AutoGen 을 pip 로 설치해 같은 에이전트를 다시 만듭니다.

## 커리큘럼 (14차시)

| Part | 차시 | 주제 |
|---|---|---|
| 1. 에이전트 시작하기 | 00 | 강좌 안내 · 실습 환경 · API 키 (무료 발급) |
| | 01 | AI 에이전트란 무엇인가? (LLM → 워크플로우 → 에이전트, 에이전트 루프) |
| | 02 | LLM API 다루기: 메시지 · 시스템 프롬프트 · 구조화 출력 · 토큰과 비용 |
| 2. 4대 핵심 요소 | 03 | 역할과 페르소나 설정 |
| | 04 | 도구 활용: Tool Calling / Function Calling |
| | 05 | 기억 장치: 단기 기억 · 요약 · 장기 기억(벡터 저장소) |
| | 06 | 계획과 반성: ReAct · Plan-and-Execute · Self-Correction |
| 3. 핵심 프레임워크 | 07 | LangChain 기초: 프롬프트 · 체인 · 도구 |
| | 08 | LangGraph: 상태 그래프로 설계하는 에이전트 |
| | 09 | CrewAI: 역할 분담 에이전트 팀 |
| | 10 | AutoGen: 다자간 대화형 에이전트 |
| 4. 프로젝트와 운영 | 11 | 프로젝트 ①: 날씨 · 검색 비서 에이전트 |
| | 12 | 프로젝트 ②: 마케팅 자동화 에이전트 팀 (조사원 + 작가) |
| | 13 | 에이전트 평가 · 안전(가드레일) · 배포 |

## 폴더 구조

```
index.html · student.html · teacher.html · presenter.html   3단 화면 (학생용/교사용/발표자 창)
js/ css/                 앱 · 슬라이드 · 결과 창 · 파이썬 실행 엔진(Pyodide 워커) · keys.js(🔑 API 키)
js/course.js             커리큘럼 (차시 순서 · Colab 노트북 이름 · 교사용 비밀번호)
lessons/ag00~ag13.js     차시 콘텐츠 (문서 블록 · 예제 코드 · 실습 · 퀴즈 · 슬라이드 · 교사 노트)
py/agentlab/             강좌용 미니 에이전트 프레임워크 (브라우저 · 로컬 CPython 공용)
py/                      브라우저 파이썬 실행기 (_runtime · _mlrich 등)
notebooks/               Colab 학생용 노트북 · notebooks/solutions/ 정답 노트북
tools/nb_src/            노트북 소스 (python tools/build_notebooks.py 로 학생용/정답 생성)
tools/validate.js        차시 검증 (모든 예제 코드를 오프라인 모의 LLM 으로 실행 + 출력 비교)
docs/LESSON_GUIDE.md     차시 작성 가이드 · agentlab API 요약
```

## agentlab 한눈에

```python
import agentlab as al

llm = al.LLM()                         # 키가 있으면 실제 모델, 없으면 모의 LLM

@al.tool
def get_weather(city: str) -> dict:
    """도시의 현재 날씨를 알려준다"""
    ...

agent = al.Agent(llm, tools=[get_weather, al.calculator], system='당신은 비서입니다.', verbose=True)
print(agent.run('서울 날씨 알려주고 기온에 1.8을 곱해줘'))
```

## 사용 방법

- **GitHub Pages:** Settings → Pages → Branch `main` / root. 처음 접속하면 서비스 워커(`coi-sw.js`)가 설치되며 페이지가 한 번 새로 고쳐집니다.
- **내 PC:** `start.bat` (또는 `python server/serve.py`) → http://localhost:8080/student.html
- **교실 LAN:** `start-lan.bat`
- **Ollama 로컬 모델:** `OLLAMA_ORIGINS=* ollama serve` 로 실행해야 브라우저에서 접근됩니다.

교사용 슬라이드 단축키: `←` `→` 이동 · `F` 전체 화면 · `R` 결과 창 · `G` 목록 · `N` 교사 노트 · `B` 화면 가리기 · `T` 타이머 · 편집기 `Ctrl+Enter` 실행

## 개발

```bash
node tools/validate.js ag04 --jobs 8      # 차시 검증 (오프라인 모의 LLM)
python tools/build_notebooks.py           # Colab 노트북 생성
```
