# CLAUDE.md — AI Agent Lab 강의 사이트

이 파일은 Claude Code가 이 저장소에서 작업할 때 따라야 할 프로젝트 규칙입니다.

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 교과목명 | AI 에이전트 구축: 파이썬으로 만드는 LLM 에이전트 |
| 사이트 명 | **AI Agent Lab** |
| 배포 URL | `https://samcho93.github.io/studyAgent` |
| 기간 | 14차시 (차시당 2~3교시 × 50분) |
| 언어 | 한국어 (코드 주석·변수명은 영어) |
| 시리즈 | ① studyMLBasic → ② MLStudio → ③ studyLLM → ④ studyRAG → ⑤ **studyAgent (이 과정)** |

학습 흐름: **원리를 브라우저에서 직접 구현(agentlab)** → **실제 프레임워크(LangChain · LangGraph · CrewAI · AutoGen)를 Colab 에서 사용** → **프로젝트 2개**(비서 에이전트 · 마케팅 에이전트 팀).

## 2. 기술 스택과 절대 제약

- 순수 HTML + CSS + Vanilla JS, 빌드 도구 없음, GitHub Pages 정적 호스팅 (studyMLBasic 과 같은 엔진)
- 파이썬은 Pyodide(브라우저 워커)에서 실행. 강좌 모듈 `py/agentlab/` 은 **순수 파이썬**(외부 패키지 금지)으로 브라우저와 로컬 CPython 양쪽에서 동작해야 한다
- LLM API 키는 **sessionStorage 에만** (`js/keys.js`). 저장소 · localStorage · 로그에 절대 넣지 않는다
- 키가 없으면 `agentlab.mock.MockLLM` 이 결정적인 답을 돌려준다. **모든 예제는 키 없이 동작해야 한다**
- `node tools/validate.js agNN` 은 오프라인(`WEBGUI_VALIDATE=1` → 모의 LLM · 예시 데이터)으로 모든 코드를 실행해 `expect` 와 비교한다. 오류 0 이 되어야 커밋한다
- 새 CDN · 라이브러리는 사용자에게 먼저 확인받는다

## 3. 디렉토리

```
index.html · student.html · teacher.html · presenter.html
js/   app.js(화면) · slides.js · runner.js · py-engine.js · py-worker.js(Pyodide) · keys.js(🔑) · course.js(커리큘럼)
css/  style.css · slides.css · gui.css
py/agentlab/  llm.py(공급자 추상화) · mock.py(모의 LLM) · tools.py · memory.py · agent.py · chain.py · graph.py · crew.py · autogen.py
lessons/agNN.js   차시 콘텐츠 — 작성 규칙은 docs/LESSON_GUIDE.md
tools/nb_src/*.py → python tools/build_notebooks.py → notebooks/*.ipynb (Colab)
tools/validate.js 검증
```

## 4. 작업 방식

- 새 차시: `docs/LESSON_GUIDE.md` 와 완성된 `lessons/ag01.js` 를 먼저 읽고 같은 구조로 작성 → `node tools/validate.js agNN --print` 로 출력 확인 후 `expect` 작성 → 오류 0
- agentlab 을 고치면 `WEBGUI_VALIDATE=1 PYTHONPATH=py python` 으로 오프라인 동작을 확인하고, 영향을 받는 차시를 다시 검증한다
- 모의 LLM(mock.py)의 규칙을 바꾸면 모든 차시의 expect 가 바뀔 수 있다 → `node tools/validate.js all`
- 로컬 확인: `python server/serve.py` → http://localhost:8080/
- 커밋 메시지: `feat(ag04): 도구 호출 차시 추가` 형식. 작업 중간에도 자주 커밋 · 푸시한다
