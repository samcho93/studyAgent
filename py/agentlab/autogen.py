"""미니 AutoGen — 서로 메시지를 주고받는 대화형 에이전트와 그룹 채팅

    coder = ConversableAgent('코더', system_message='너는 파이썬 개발자다', llm=llm)
    reviewer = ConversableAgent('리뷰어', system_message='너는 코드 리뷰어다. 문제가 없으면 TERMINATE 라고 말해라', llm=llm)
    reviewer.initiate_chat(coder, message='두 수를 더하는 함수를 작성해라', max_turns=3)

    gc = GroupChat(agents=[a, b, c], max_round=6)
    GroupChatManager(gc, llm=llm).run('신제품 이름을 정하자')

실제 AutoGen(ConversableAgent · initiate_chat · GroupChat · GroupChatManager)과 이름을 맞춰 두었다.
"""
from .llm import system as _system, user as _user, assistant as _assistant


class ConversableAgent:
    def __init__(self, name, system_message='', llm=None, human_input_mode='NEVER', is_termination_msg=None, tools=None, max_consecutive_auto_reply=10):
        self.name = name
        self.system_message = system_message
        self.llm = llm
        self.human_input_mode = human_input_mode
        self.is_termination_msg = is_termination_msg or (lambda m: 'TERMINATE' in str(m).upper())
        self.tools = tools or []
        self.chat_messages = {}     # 상대 이름 → [(보낸이, 내용)]
        self.max_consecutive_auto_reply = max_consecutive_auto_reply

    def _history(self, other):
        return self.chat_messages.setdefault(other.name, [])

    def generate_reply(self, messages, sender=None):
        """messages: [(보낸이 이름, 내용)] → 답 문자열"""
        if self.human_input_mode == 'ALWAYS':
            return input(f'[{self.name} 대신 입력] ')
        from .llm import LLM
        llm = self.llm or LLM()
        msgs = [_system(f'당신의 이름은 {self.name}입니다. {self.system_message}')]
        for who, text in messages:
            msgs.append(_assistant(text) if who == self.name else _user(f'{who}: {text}'))
        if self.tools:
            from .agent import Agent
            from .memory import ConversationMemory
            mem = ConversationMemory()
            for m in msgs[1:-1]:
                mem.add(m)
            a = Agent(llm, tools=self.tools, system=msgs[0]['content'], memory=mem, max_steps=4)
            return a.run(msgs[-1]['content'])
        return llm.chat(msgs).content

    def send(self, message, recipient, silent=False):
        self._history(recipient).append((self.name, message))
        recipient._history(self).append((self.name, message))
        if not silent:
            print(f'\n{self.name} → {recipient.name}:\n{message}')

    def initiate_chat(self, recipient, message, max_turns=4, silent=False):
        """내가 message 로 대화를 시작하고 번갈아 답한다. TERMINATE 가 나오면 멈춘다"""
        self.chat_messages[recipient.name] = []
        recipient.chat_messages[self.name] = []
        self.send(message, recipient, silent)
        speaker, listener = recipient, self
        for _ in range(max_turns * 2 - 1):
            reply = speaker.generate_reply(speaker._history(listener), sender=listener)
            speaker.send(reply, listener, silent)
            if listener.is_termination_msg(reply) or speaker.is_termination_msg(reply):
                break
            speaker, listener = listener, speaker
        return ChatResult(self._history(recipient))

    def __repr__(self):
        return f'ConversableAgent({self.name})'


class ChatResult:
    def __init__(self, history):
        self.chat_history = [{'name': who, 'content': text} for who, text in history]

    @property
    def summary(self):
        return self.chat_history[-1]['content'] if self.chat_history else ''

    def __repr__(self):
        return f'ChatResult({len(self.chat_history)} messages)'


class GroupChat:
    def __init__(self, agents, messages=None, max_round=6, speaker_selection_method='round_robin'):
        self.agents = agents
        self.messages = messages or []      # [(이름, 내용)]
        self.max_round = max_round
        self.speaker_selection_method = speaker_selection_method

    def agent_by_name(self, name):
        return next((a for a in self.agents if a.name == name), None)


class GroupChatManager:
    def __init__(self, groupchat, llm=None, name='매니저'):
        self.gc = groupchat
        self.llm = llm
        self.name = name

    def select_speaker(self, last_speaker):
        agents = self.gc.agents
        if self.gc.speaker_selection_method == 'round_robin' or self.llm is None:
            if last_speaker is None:
                return agents[0]
            return agents[(agents.index(last_speaker) + 1) % len(agents)]
        names = ', '.join(a.name for a in agents)
        hist = '\n'.join(f'{w}: {t[:80]}' for w, t in self.gc.messages[-4:])
        r = self.llm.chat([_system(f'너는 회의 진행자다. 다음에 말할 사람 이름만 답해라. 후보: {names}'), _user(hist)]).content
        for a in agents:
            if a.name in r and a is not last_speaker:
                return a
        return agents[(agents.index(last_speaker) + 1) % len(agents)] if last_speaker else agents[0]

    def run(self, message, silent=False):
        """매니저가 주제를 던지고 max_round 만큼 발언을 돌린다"""
        self.gc.messages.append((self.name, message))
        if not silent:
            print(f'\n{self.name}: {message}')
        last = None
        for _ in range(self.gc.max_round):
            speaker = self.select_speaker(last)
            reply = speaker.generate_reply(self.gc.messages)
            self.gc.messages.append((speaker.name, reply))
            if not silent:
                print(f'\n{speaker.name}: {reply}')
            if speaker.is_termination_msg(reply):
                break
            last = speaker
        return self.gc.messages
