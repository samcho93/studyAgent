/* AI 에이전트 강좌 커리큘럼
 * 각 차시의 상세 내용은 lessons/<id>.js 에서 PY_COURSE.addChapter({...}) 로 등록한다.
 * colab: notebooks/<colab>.ipynb (학생용) · notebooks/solutions/<colab>_solution.ipynb (정답)
 */
window.PY_COURSE = {
  title: 'AI 에이전트 구축: 파이썬으로 만드는 LLM 에이전트',
  teacherPass: 'samcho93',   // 교사용 화면 비밀번호 (바꿔서 쓰세요)
  subtitle: 'Python · Tool Calling · Memory · LangGraph · CrewAI · AutoGen · agentBuilder · MCP · Skills',
  github: { user: 'samcho93', repo: 'studyAgent', branch: 'main' },
  parts: [
    { id: 1, title: 'Part 1. 에이전트 시작하기', desc: 'LLM API · 에이전트 루프 · 실습 환경' },
    { id: 2, title: 'Part 2. 에이전트의 4대 핵심 요소', desc: '역할 · 도구 호출 · 기억 · 계획과 반성' },
    { id: 3, title: 'Part 3. 핵심 프레임워크', desc: 'LangChain · LangGraph · CrewAI · AutoGen' },
    { id: 4, title: 'Part 4. 프로젝트와 운영', desc: '비서 에이전트 · 마케팅 에이전트 팀 · 평가 · 안전 · 배포' },
    { id: 5, title: 'Part 5. MCP 와 Agent Skills', desc: '도구 서버 표준(MCP) · 스킬(SKILL.md)로 에이전트 확장' },
    { id: 6, title: 'Part 6. agentBuilder: 노드로 조립하는 에이전트', desc: '노드 그래프 · 실행 엔진 · 파이썬 내보내기' }
  ],
  order: [
    { id: 'ag00', no: '00', part: 1, title: '시작하기: 강좌 안내 · 실습 환경 · API 키', icon: '🧭', colab: '00_setup_api_keys' },
    { id: 'ag01', no: '01', part: 1, title: 'AI 에이전트란 무엇인가?', icon: '🤖', colab: '01_what_is_agent' },
    { id: 'ag02', no: '02', part: 1, title: 'LLM API 다루기: 메시지 · 시스템 프롬프트 · 구조화 출력', icon: '💬', colab: '02_llm_api' },
    { id: 'ag03', no: '03', part: 2, title: '역할과 페르소나 설정', icon: '🎭', colab: '03_role_persona' },
    { id: 'ag04', no: '04', part: 2, title: '도구 활용: Tool Calling / Function Calling', icon: '🔧', colab: '04_tool_calling' },
    { id: 'ag05', no: '05', part: 2, title: '기억 장치: 단기 기억과 장기 기억(벡터 저장소)', icon: '🧠', colab: '05_memory' },
    { id: 'ag06', no: '06', part: 2, title: '계획과 반성: ReAct · Plan-and-Execute · Self-Correction', icon: '🗺️', colab: '06_planning_reflection' },
    { id: 'ag07', no: '07', part: 3, title: 'LangChain 기초: 프롬프트 · 체인 · 도구', icon: '⛓️', colab: '07_langchain' },
    { id: 'ag08', no: '08', part: 3, title: 'LangGraph: 상태 그래프로 설계하는 에이전트', icon: '🕸️', colab: '08_langgraph' },
    { id: 'ag09', no: '09', part: 3, title: 'CrewAI: 역할 분담 에이전트 팀', icon: '👥', colab: '09_crewai' },
    { id: 'ag10', no: '10', part: 3, title: 'AutoGen: 다자간 대화형 에이전트', icon: '🗣️', colab: '10_autogen' },
    { id: 'ag11', no: '11', part: 4, title: '프로젝트 ①: 날씨 · 검색 비서 에이전트', icon: '🌤️', colab: '11_project_assistant' },
    { id: 'ag12', no: '12', part: 4, title: '프로젝트 ②: 마케팅 자동화 에이전트 팀', icon: '📝', colab: '12_project_marketing_crew' },
    { id: 'ag13', no: '13', part: 4, title: '에이전트 평가 · 안전 · 배포', icon: '🛡️', colab: '13_eval_safety_deploy' },
    { id: 'ag14', no: '14', part: 5, title: 'MCP(Model Context Protocol): 도구 · 리소스 · 프롬프트 서버 만들고 쓰기', icon: '🔌', colab: '14_mcp' },
    { id: 'ag15', no: '15', part: 5, title: 'Agent Skills: SKILL.md 로 에이전트에 전문 능력 더하기', icon: '📚', colab: '15_agent_skills' },
    { id: 'ag16', no: '16', part: 6, title: 'agentBuilder 시작하기: 노드 · 그래프 · 실행 · 코드 내보내기', icon: '🧩', colab: '16_agentbuilder_basics' },
    { id: 'ag17', no: '17', part: 6, title: 'agentBuilder 로 다시 만드는 에이전트: 분기 · 반복 · 기억 · 팀 · 가드레일', icon: '🕹️', colab: '17_agentbuilder_patterns' }
  ],
  chapters: {},
  addChapter: function (ch) { this.chapters[ch.id] = ch; }
};
