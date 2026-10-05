"""에이전트 루프 — 판단(LLM) → 행동(도구) → 관찰(결과) → … → 최종 답

    agent = Agent(llm, tools=[get_weather, calculator], system='너는 비서다', verbose=True)
    print(agent.run('서울 날씨 알려줘'))

    react = ReActAgent(llm, tools=[...])        # Thought / Action / Observation 텍스트 형식 (원리 학습용)
    plan = Planner(llm).plan('블로그 글 쓰기')  # 목표 → 단계 목록
    Reflector(llm).improve('초안', rounds=2)     # 비평 → 수정 반복
"""
import json
import re

from .llm import system as _system, user as _user, assistant as _assistant, tool_result as _tool_result, parse_json
from .memory import ConversationMemory
from .tools import ToolRegistry, result_text


class Step:
    """에이전트가 밟은 한 단계 기록"""
    def __init__(self, kind, **data):
        self.kind = kind     # 'think' | 'tool' | 'observe' | 'answer'
        self.data = data

    def __repr__(self):
        return f'Step({self.kind}, {json.dumps(self.data, ensure_ascii=False, default=str)[:80]})'


class Agent:
    """함수 호출(Tool Calling) 방식 에이전트"""

    def __init__(self, llm, tools=None, system=None, memory=None, max_steps=6, verbose=False, name='agent'):
        self.llm = llm
        self.tools = tools if isinstance(tools, ToolRegistry) else ToolRegistry(tools or [])
        self.system = system
        self.memory = memory if memory is not None else ConversationMemory()
        self.max_steps = max_steps
        self.verbose = verbose
        self.name = name
        self.steps = []

    def _log(self, icon, text):
        if self.verbose:
            print(f'{icon} {text}')

    def run(self, task):
        """작업 한 번 수행 → 최종 답(문자열). 대화 기록은 memory 에 쌓인다"""
        self.steps = []
        self.memory.add_user(task)
        for i in range(1, self.max_steps + 1):
            msgs = ([_system(self.system)] if self.system else []) + self.memory.messages()
            r = self.llm.chat(msgs, tools=list(self.tools) if len(self.tools) else None)
            if not r.has_tool_calls:
                self.steps.append(Step('answer', content=r.content))
                self._log('✅', f'최종 답: {r.content}')
                self.memory.add_assistant(r.content)
                return r.content
            self.memory.add(r.message())
            for call in r.tool_calls:
                self.steps.append(Step('tool', name=call.name, args=call.args))
                self._log('🔧', f'도구 호출 {i}: {call.name}({json.dumps(call.args, ensure_ascii=False)})')
                result = self.tools.execute(call)
                self.steps.append(Step('observe', name=call.name, result=result))
                self._log('👁', f'관찰: {result_text(result, 200)}')
                self.memory.add(_tool_result(call.id, call.name, result_text(result)))
        self._log('⚠', f'{self.max_steps}단계 안에 끝내지 못했습니다')
        final = self.llm.chat(([_system(self.system)] if self.system else []) + self.memory.messages() + [_user('지금까지의 정보로 최종 답을 한 문단으로 정리해라.')])
        self.memory.add_assistant(final.content)
        return final.content

    def chat(self, text):
        """run 과 같지만 이름이 대화형"""
        return self.run(text)

    def reset(self):
        self.memory.clear()
        self.steps = []

    def trace(self):
        """밟은 단계를 표로 출력"""
        for i, s in enumerate(self.steps, 1):
            if s.kind == 'tool':
                print(f'{i:>2}. 🔧 {s.data["name"]}({json.dumps(s.data["args"], ensure_ascii=False)})')
            elif s.kind == 'observe':
                print(f'{i:>2}. 👁 {result_text(s.data["result"], 90)}')
            else:
                print(f'{i:>2}. ✅ {str(s.data.get("content", ""))[:90]}')


REACT_PROMPT = """너는 도구를 사용해 질문에 답하는 에이전트다. 다음 형식을 **정확히** 지켜라.

사용할 수 있는 도구:
{tools}

형식:
Question: 사용자의 질문
Thought: 무엇을 해야 할지 생각
Action: 도구 이름 (위 목록 중 하나)
Action Input: 도구에 넘길 JSON 인자
Observation: 도구 결과 (시스템이 채운다)
... (Thought/Action/Action Input/Observation 을 필요한 만큼 반복)
Thought: 이제 최종 답을 안다
Final Answer: 사용자에게 줄 최종 답

도구가 필요 없으면 바로 'Thought:' 다음에 'Final Answer:' 를 써라."""


class ReActAgent:
    """텍스트 형식(Thought/Action/Observation) ReAct 에이전트 — 함수 호출 API 없이도 동작하는 원리 학습용"""

    def __init__(self, llm, tools=None, max_steps=6, verbose=True, system=None):
        self.llm = llm
        self.tools = tools if isinstance(tools, ToolRegistry) else ToolRegistry(tools or [])
        self.max_steps = max_steps
        self.verbose = verbose
        self.extra_system = system
        self.transcript = ''

    def run(self, question):
        sys_t = REACT_PROMPT.format(tools=self.tools.describe())
        if self.extra_system:
            sys_t = self.extra_system + '\n\n' + sys_t
        self.transcript = f'Question: {question}\n'
        for _ in range(self.max_steps):
            r = self.llm.chat([_system(sys_t), _user(self.transcript)], tools=list(self.tools), mode='react')
            text = r.content.strip()
            # 모델이 Observation 까지 지어내면 잘라낸다
            text = text.split('\nObservation:')[0].strip()
            if self.verbose:
                print(text)
            self.transcript += text + '\n'
            m = re.search(r'Final Answer:\s*(.*)', text, re.S)
            if m:
                return m.group(1).strip()
            am = re.search(r'Action:\s*([\w\-]+)', text)
            im = re.search(r'Action Input:\s*(.*)', text, re.S)
            if not am:
                return text
            name = am.group(1).strip()
            raw = (im.group(1) if im else '{}').strip()
            try:
                args = parse_json(raw) if raw else {}
            except Exception:
                args = {'input': raw}
            t = self.tools.get(name)
            result = t.call(args) if t else {'error': f'{name} 도구는 없습니다'}
            obs = f'Observation: {result_text(result, 300)}'
            if self.verbose:
                print(obs)
            self.transcript += obs + '\n'
        return '(최대 단계 초과) ' + self.transcript[-200:]


class Planner:
    """목표 → 하위 목표(단계) 목록. Plan-and-Execute 의 '계획' 부분"""

    def __init__(self, llm, max_steps=5):
        self.llm = llm
        self.max_steps = max_steps

    def plan(self, goal, context=''):
        prompt = (f'목표: {goal}\n' + (f'참고: {context}\n' if context else '') +
                  f'이 목표를 달성하기 위한 단계를 {self.max_steps}개 이내로 나누어라. '
                  '반드시 JSON {"goal": "...", "steps": ["1단계", "2단계", ...]} 형식으로만 답해라.')
        r = self.llm.chat([_system('너는 작업을 작은 단계로 쪼개는 계획 전문가다.'), _user(prompt)], json_mode=True)
        try:
            d = r.json()
            steps = d.get('steps') or []
        except Exception:
            steps = [s.strip('-• ') for s in r.content.split('\n') if s.strip()]
        return [str(s) for s in steps][:self.max_steps]

    def execute(self, goal, worker, verbose=True):
        """계획을 세우고 worker(step, previous_results) 를 차례로 실행한다"""
        steps = self.plan(goal)
        results = []
        for i, s in enumerate(steps, 1):
            if verbose:
                print(f'📌 {i}/{len(steps)} {s}')
            out = worker(s, results)
            results.append({'step': s, 'result': out})
            if verbose:
                print(f'   → {str(out)[:100]}')
        return results


class Reflector:
    """반성(Reflection): 결과물을 비평하고 수정하는 루프 (Self-Correction)"""

    def __init__(self, llm, critic_system='너는 꼼꼼한 검토자다. 결과물의 문제점을 구체적으로 지적한다.', writer_system='너는 피드백을 반영해 글을 고치는 작가다.'):
        self.llm = llm
        self.critic_system = critic_system
        self.writer_system = writer_system

    def critique(self, text, criteria=''):
        prompt = f'다음 결과물을 검토해라. {criteria}\n\n{text}'
        return self.llm.chat([_system(self.critic_system), _user(prompt)]).content

    def revise(self, text, feedback):
        prompt = f'원문:\n{text}\n\n피드백:\n{feedback}\n\n피드백을 반영해 수정본을 써라.'
        return self.llm.chat([_system(self.writer_system), _user(prompt)]).content

    def improve(self, text, rounds=2, criteria='', verbose=True):
        """비평 → 수정 을 rounds 번 반복"""
        cur = text
        for i in range(1, rounds + 1):
            fb = self.critique(cur, criteria)
            if verbose:
                print(f'🔍 검토 {i}: {fb[:120]}')
            cur = self.revise(cur, fb)
            if verbose:
                print(f'✏️ 수정 {i}: {cur[:120]}')
        return cur

    def score(self, text, criteria='정확성 · 명확성 · 근거'):
        """JSON {score, issues, suggestion} 으로 평가"""
        prompt = f'기준({criteria})에 따라 다음 결과물을 10점 만점으로 평가해라. JSON {{"score": 숫자, "issues": [...], "suggestion": "..."}} 형식으로만 답해라.\n\n{text}'
        r = self.llm.chat([_system(self.critic_system), _user(prompt)], json_mode=True)
        try:
            return r.json()
        except Exception:
            return {'score': None, 'issues': [r.content[:100]], 'suggestion': ''}
