"""미니 CrewAI — 역할(role) · 목표(goal) · 배경(backstory)을 가진 에이전트들이 Task 를 차례로 처리한다

    researcher = CrewAgent(role='시장 조사원', goal='최신 정보를 조사한다', backstory='10년차 분석가', llm=llm, tools=[wiki_search])
    writer = CrewAgent(role='블로그 작가', goal='읽기 쉬운 글을 쓴다', llm=llm)
    t1 = Task(description='AI 에이전트 동향을 조사해라', expected_output='핵심 3가지', agent=researcher)
    t2 = Task(description='조사 내용으로 블로그 글을 써라', expected_output='500자 글', agent=writer, context=[t1])
    crew = Crew(agents=[researcher, writer], tasks=[t1, t2], verbose=True)
    print(crew.kickoff())

실제 CrewAI 와 클래스 · 인자 이름을 맞춰 두었다 (Agent → 여기서는 CrewAgent, Task, Crew, kickoff).
"""
from .agent import Agent
from .llm import system as _system, user as _user
from .tools import ToolRegistry


class CrewAgent:
    def __init__(self, role, goal, backstory='', llm=None, tools=None, verbose=False, max_steps=4):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.llm = llm
        self.tools = ToolRegistry(tools or [])
        self.verbose = verbose
        self.max_steps = max_steps

    def system_prompt(self):
        return (f'당신은 {self.role}입니다.\n목표: {self.goal}\n' + (f'배경: {self.backstory}\n' if self.backstory else '') +
                '맡은 작업을 역할에 맞게, 요구된 결과물 형식으로 완성하세요.')

    def execute(self, task, context_text=''):
        from .llm import LLM
        llm = self.llm or LLM()
        prompt = task.description + (f'\n\n[참고할 이전 작업 결과]\n{context_text}' if context_text else '') + \
            (f'\n\n[기대하는 결과물]\n{task.expected_output}' if task.expected_output else '')
        if len(self.tools):
            agent = Agent(llm, tools=self.tools, system=self.system_prompt(), max_steps=self.max_steps, verbose=self.verbose)
            return agent.run(prompt)
        return llm.chat([_system(self.system_prompt()), _user(prompt)]).content

    def __repr__(self):
        return f'CrewAgent({self.role})'


class Task:
    def __init__(self, description, expected_output='', agent=None, context=None, name=None):
        self.description = description
        self.expected_output = expected_output
        self.agent = agent
        self.context = context or []
        self.name = name or description[:30]
        self.output = None

    def __repr__(self):
        return f'Task({self.name!r}, agent={self.agent.role if self.agent else None})'


class Crew:
    def __init__(self, agents, tasks, process='sequential', verbose=False, manager_llm=None):
        self.agents = agents
        self.tasks = tasks
        self.process = process
        self.verbose = verbose
        self.manager_llm = manager_llm
        self.outputs = []

    def _pick_agent(self, task):
        if task.agent is not None:
            return task.agent
        if self.process == 'hierarchical' and self.manager_llm is not None:
            roles = '\n'.join(f'{i}: {a.role} — {a.goal}' for i, a in enumerate(self.agents))
            r = self.manager_llm.chat([_system('너는 팀 매니저다. 작업에 가장 알맞은 담당자의 번호만 답해라.'), _user(f'작업: {task.description}\n\n담당자 후보:\n{roles}')]).content
            for i, a in enumerate(self.agents):
                if str(i) in r or a.role in r:
                    return a
        return self.agents[0]

    def kickoff(self, inputs=None):
        """작업을 차례로 실행하고 마지막 결과를 돌려준다"""
        inputs = inputs or {}
        self.outputs = []
        for i, task in enumerate(self.tasks, 1):
            if inputs:
                task.description = task.description.format(**inputs)
            agent = self._pick_agent(task)
            ctx_tasks = task.context or ([self.tasks[i - 2]] if i > 1 and self.process == 'sequential' else [])
            ctx = '\n\n'.join(f'({t.name}) {t.output}' for t in ctx_tasks if t.output)
            if self.verbose:
                print(f'\n🧑‍💼 [{agent.role}] 작업 {i}/{len(self.tasks)}: {task.description[:60]}')
            task.output = agent.execute(task, ctx)
            self.outputs.append(task.output)
            if self.verbose:
                print(f'   ✔ 결과: {str(task.output)[:120]}')
        return self.outputs[-1] if self.outputs else ''

    def __repr__(self):
        return f'Crew({len(self.agents)} agents, {len(self.tasks)} tasks, {self.process})'
