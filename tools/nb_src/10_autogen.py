# %% [markdown]
# # 10. AutoGen — 다자간 대화형 에이전트
#
# 브라우저에서 `agentlab` 으로 체험한 **코더 ↔ 리뷰어 대화**와 **그룹 채팅**을 실제 AutoGen 으로 다시 만듭니다.
#
# AutoGen 은 두 갈래가 있습니다.
# - **AG2** (`pip install ag2`, 구 `pyautogen`) — `ConversableAgent · initiate_chat · GroupChat · GroupChatManager` API. 이 노트북의 기본.
# - **Microsoft autogen-agentchat 0.4+** — 비동기 중심의 새 API (`RoundRobinGroupChat`, `SelectorGroupChat`). 맨 끝에 같은 예제를 소개합니다.
#
# 이 노트북은 **ag2 0.9.x** 기준으로 작성되었습니다.

# %% [markdown]
# ## 0. 설치와 API 키
# API 키는 Colab 🔑 **Secrets** 의 `GEMINI_API_KEY` 로 읽습니다.

# %%
!pip -q install "ag2[gemini]"

# %%
import autogen, os
from google.colab import userdata

GEMINI_API_KEY = userdata.get("GEMINI_API_KEY")
llm_config = {"config_list": [{"model": "gemini-2.5-flash", "api_type": "google", "api_key": GEMINI_API_KEY}],
              "temperature": 0.3}
print("autogen(ag2)", autogen.__version__)

# %% [markdown]
# ## 1. ConversableAgent — 코더 ↔ 리뷰어 2자 대화
# 브라우저 예제와 거의 같습니다. `llm` 객체 대신 `llm_config` dict 를 주고, `human_input_mode="NEVER"` 로 사람 개입 없이 돌립니다.

# %%
from autogen import ConversableAgent

coder = ConversableAgent(
    "coder",
    system_message="너는 파이썬 개발자다. 요청받은 함수를 타입 힌트와 docstring 을 갖춰 짧게 작성한다. 코드는 ```python 블록으로 준다.",
    llm_config=llm_config, human_input_mode="NEVER",
)
reviewer = ConversableAgent(
    "reviewer",
    system_message="너는 코드 리뷰어다. 코드를 검토해 문제를 지적하고, 문제가 없으면 '승인합니다. TERMINATE' 라고 말해라.",
    llm_config=llm_config, human_input_mode="NEVER",
    is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""),
)

result = reviewer.initiate_chat(coder, message="두 수를 더하는 함수를 작성해라", max_turns=3)

# %%
print(result)
print("메시지 수:", len(result.chat_history))
print("마지막 메시지:", result.summary[:120])
print("비용:", result.cost)

# %% [markdown]
# ## 2. UserProxyAgent + AssistantAgent — 코드를 실제로 실행하는 왕복
# `AssistantAgent` 가 코드를 쓰면 `UserProxyAgent` 가 **실행**하고 결과(또는 오류)를 돌려줍니다. 오류가 나면 어시스턴트가 고쳐서 다시 보냅니다 — 6차시 Self-Correction 이 대화로 구현된 것입니다.
#
# ⚠️ 코드가 실제로 실행됩니다. 수업용 간단한 요청만 쓰고, 13차시(안전)에서 샌드박스를 다룹니다.

# %%
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent("assistant", llm_config=llm_config,
                           system_message="너는 파이썬 개발자다. 코드는 반드시 ```python 블록으로 준다. 실행 결과를 확인한 뒤 끝나면 TERMINATE 라고 말해라.")
user_proxy = UserProxyAgent(
    "user_proxy",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding", "use_docker": False},   # Colab 에는 Docker 가 없음
    is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""),
    max_consecutive_auto_reply=5,
)

chat = user_proxy.initiate_chat(assistant, message="1부터 100까지의 소수의 개수를 구하는 코드를 작성하고 실행해 결과를 알려줘", max_turns=4)
print("최종:", chat.summary[:200])

# %% [markdown] teacher
# 실행 로그에서 "exitcode: 0 (execution succeeded)" 를 찾게 하세요. 일부러 오류를 내는 요청("존재하지 않는 모듈 import")을 넣어
# 어시스턴트가 오류 메시지를 보고 고치는 과정을 보여 주면 Self-Correction 이 한눈에 들어옵니다.

# %% [markdown]
# ## 3. GroupChat — 기획자 · 개발자 · 마케터 · 비평가 회의 (round_robin)
# 브라우저에서는 대사를 미리 정했지만(`mock_responses`), 여기서는 실제 모델이 역할에 맞게 즉석에서 말합니다.

# %%
from autogen import GroupChat, GroupChatManager


def make_agent(name, role, extra=""):
    return ConversableAgent(name, llm_config=llm_config, human_input_mode="NEVER",
                            system_message=f"너는 {role}다. 회의에서 네 전문 분야 관점으로 두세 문장만 말한다. {extra}")


planner = make_agent("planner", "서비스 기획자", "핵심 기능과 우선순위를 제안한다.")
developer = make_agent("developer", "앱 개발자", "기술적 실현 가능성과 일정을 말한다.")
marketer = make_agent("marketer", "마케터", "이름 · 타깃 · 출시 캠페인을 제안한다.")
critic = ConversableAgent("critic", llm_config=llm_config, human_input_mode="NEVER",
                          system_message="너는 비평가다. 빠진 위험 요소를 지적한다. 모두 해결되었다고 판단하면 '승인합니다. TERMINATE' 라고 말해라.",
                          is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""))
host = UserProxyAgent("host", human_input_mode="NEVER", code_execution_config=False,
                      is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""))

gc = GroupChat(agents=[host, planner, developer, marketer, critic], messages=[], max_round=8,
               speaker_selection_method="round_robin")
manager = GroupChatManager(groupchat=gc, llm_config=llm_config)
host.initiate_chat(manager, message="중고 교과서 거래 앱의 이름과 핵심 기능을 정하자. 비평가가 승인하면 회의를 끝낸다.")

# %%
print("=== 회의록 ===")
for m in gc.messages:
    print(f"- {m['name']}: {m['content'][:80].replace(chr(10), ' ')}")
print("발언 수:", len(gc.messages) - 1)

# %% [markdown]
# ## 4. speaker_selection_method="auto" — 매니저 LLM 이 발언자를 고른다
# `allow_repeat_speaker=False` 로 같은 사람이 연달아 말하지 않게 합니다. 발언 순서가 round_robin 과 어떻게 달라지는지 비교하세요.

# %%
gc_auto = GroupChat(agents=[host, planner, developer, marketer, critic], messages=[], max_round=8,
                    speaker_selection_method="auto", allow_repeat_speaker=False)
manager_auto = GroupChatManager(groupchat=gc_auto, llm_config=llm_config)
host.initiate_chat(manager_auto, message="출시 일정을 정하자. 기술 검토가 필요한 부분부터 이야기하고, 비평가가 승인하면 끝낸다.")
print("발언 순서:", " → ".join(m["name"] for m in gc_auto.messages[1:]))

# %% [markdown] teacher
# auto 는 매니저가 라운드마다 "다음 발언자" 를 묻는 LLM 호출을 추가합니다. 두 회의의 발언 순서를 칠판에 나란히 적고
# "왜 매니저가 그 사람을 골랐을까?" 를 직전 발언에서 근거 찾기 활동으로 진행하세요.

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 새 역할 추가하기
# 3절의 회의에 **디자이너**(UI 디자이너, 첫 화면과 핵심 흐름을 제안) 를 추가하고 round_robin 으로 다시 실행해 회의록을 출력하세요.

# %%
# BEGIN SOLUTION
designer = make_agent("designer", "UI 디자이너", "첫 화면 구성과 핵심 사용 흐름을 제안한다.")
gc2 = GroupChat(agents=[host, planner, developer, designer, marketer, critic], messages=[], max_round=10,
                speaker_selection_method="round_robin")
host.initiate_chat(GroupChatManager(groupchat=gc2, llm_config=llm_config),
                   message="중고 교과서 거래 앱의 이름 · 핵심 기능 · 첫 화면을 정하자. 비평가가 승인하면 끝낸다.")
for m in gc2.messages:
    print(f"- {m['name']}: {m['content'][:80]}")
# END SOLUTION

# %% [markdown]
# ### 문제 2. 종료 조건 바꾸기
# 비평가가 TERMINATE 대신 **"최종 결정:"** 으로 시작하는 메시지로 회의를 끝내게 하세요. (system_message 와 `is_termination_msg` 를 모두 바꿔야 합니다. host 의 종료 조건도 같이 바꾸세요.)

# %%
# BEGIN SOLUTION
done = lambda m: (m.get("content") or "").strip().startswith("최종 결정")
critic2 = ConversableAgent("critic", llm_config=llm_config, human_input_mode="NEVER",
                           system_message="너는 비평가다. 위험 요소를 지적한다. 모두 해결되면 '최종 결정:' 으로 시작하는 한 문단으로 결론을 정리해라.",
                           is_termination_msg=done)
host2 = UserProxyAgent("host", human_input_mode="NEVER", code_execution_config=False, is_termination_msg=done)
gc3 = GroupChat(agents=[host2, planner, developer, marketer, critic2], messages=[], max_round=8)
host2.initiate_chat(GroupChatManager(groupchat=gc3, llm_config=llm_config), message="앱 이름과 핵심 기능을 정하자.")
print("마지막 발언:", gc3.messages[-1]["name"], "|", gc3.messages[-1]["content"][:100])
# END SOLUTION

# %% [markdown]
# ### 문제 3. (도전) 사람이 끼어드는 회의
# host 의 `human_input_mode` 를 `"TERMINATE"` 로 바꿔, 회의가 끝나기 직전에 **여러분이 직접** 한마디를 덧붙일 수 있게 해 보세요.
# (프롬프트가 뜨면 의견을 입력하거나, 빈 줄을 입력해 그대로 끝냅니다)

# %%
# BEGIN SOLUTION
host3 = UserProxyAgent("host", human_input_mode="TERMINATE", code_execution_config=False,
                       is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""))
gc4 = GroupChat(agents=[host3, planner, developer, critic], messages=[], max_round=6)
host3.initiate_chat(GroupChatManager(groupchat=gc4, llm_config=llm_config), message="출시 일정을 정하자.")
# END SOLUTION

# %% [markdown] teacher
# 문제 3은 human-in-the-loop 의 가장 쉬운 체험입니다. "자동화와 사람 승인 사이의 균형" 을 13차시(안전 · 배포)와 연결하세요.

# %% [markdown]
# ## 📘 더 알아보기 — Microsoft autogen-agentchat 0.4+ 로 같은 회의 만들기
# 새 API 는 비동기이고 팀 · 종료 조건이 객체입니다. 별도 패키지(`autogen-agentchat`, `autogen-ext`)이며 AG2 와 함께 설치하면 충돌할 수 있으니 **새 런타임**에서 실행하세요.

# %% [markdown]
# ```python
# !pip -q install "autogen-agentchat" "autogen-ext[openai]"
#
# from autogen_agentchat.agents import AssistantAgent
# from autogen_agentchat.teams import RoundRobinGroupChat          # SelectorGroupChat = auto
# from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
# from autogen_ext.models.openai import OpenAIChatCompletionClient
#
# model = OpenAIChatCompletionClient(model="gpt-4o-mini")        # OPENAI_API_KEY 필요
# planner = AssistantAgent("planner", model_client=model, system_message="너는 기획자다.")
# critic = AssistantAgent("critic", model_client=model, system_message="너는 비평가다. 승인하면 TERMINATE 라고 말해라.")
# team = RoundRobinGroupChat([planner, critic],
#                            termination_condition=TextMentionTermination("TERMINATE") | MaxMessageTermination(10))
# result = await team.run(task="신제품 이름을 정하자")               # Colab 셀에서는 await 를 바로 쓸 수 있다
# for m in result.messages:
#     print(m.source, ":", m.content)
# ```
# 종료 조건을 `|` 로 합치는 것이 이 차시의 `is_termination_msg` + `max_round` 와 같은 뜻입니다.

# %% [markdown]
# ---
# ## 📝 정리
# - `ConversableAgent(name, system_message, llm_config, human_input_mode, is_termination_msg)` · `a.initiate_chat(b, message, max_turns)` → `ChatResult`
# - `UserProxyAgent(code_execution_config=...)` 는 어시스턴트가 쓴 코드를 실행해 돌려준다 — 대화로 구현한 Self-Correction
# - `GroupChat(agents, max_round, speaker_selection_method)` + `GroupChatManager` — 발언자 선택 · 공유 기록 · 종료 검사
# - 종료는 설계하는 것: TERMINATE 지시 + `is_termination_msg`, 안전장치 `max_round`
# - LangGraph = 그래프 제어 · CrewAI = 역할 팀 · AutoGen = 대화 — 섞어 쓸 수 있다
