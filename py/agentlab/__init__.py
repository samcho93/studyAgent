"""agentlab — AI 에이전트 강좌용 미니 프레임워크

브라우저(Pyodide)와 로컬 CPython 에서 똑같이 동작한다.
API 키가 없으면 **모의 LLM(MockLLM)** 이 결정적인(항상 같은) 응답을 돌려주므로 수업 실습이 언제나 동작한다.

    import agentlab as al
    llm = al.LLM()                           # 키가 있으면 실제 모델, 없으면 모의 LLM
    print(llm.ask('에이전트가 뭐야?'))

    @al.tool
    def add(a: int, b: int) -> int:
        \"\"\"두 수를 더한다\"\"\"
        return a + b

    agent = al.Agent(llm, tools=[add], verbose=True)
    print(agent.run('3 더하기 4는?'))
"""
from .llm import LLM, Response, ToolCall, Usage, status, providers, user, system, assistant, tool_result, parse_json   # noqa: F401
from .mock import MockLLM                                                                   # noqa: F401
from .tools import tool, Tool, ToolRegistry, calculator, get_weather, wiki_search, now, read_file, write_file, remember_note  # noqa: F401
from .memory import ConversationMemory, SummaryMemory, VectorStore, Embedder, embed, cosine   # noqa: F401
from .agent import Agent, ReActAgent, Planner, Reflector                                     # noqa: F401
from .chain import PromptTemplate, ChatPromptTemplate, StrOutputParser, JsonOutputParser, RunnableLambda, RunnableParallel, RunnablePassthrough, chain  # noqa: F401
from .graph import StateGraph, MemorySaver, START, END                                      # noqa: F401
from .crew import CrewAgent, Task, Crew                                                     # noqa: F401
from .autogen import ConversableAgent, GroupChat, GroupChatManager                          # noqa: F401

__version__ = '0.1.0'
