"""미니 LangChain — 프롬프트 템플릿 · 파서 · | 로 잇는 체인 (LCEL 의 핵심 아이디어를 그대로)

    prompt = PromptTemplate('다음 글을 {lang} 로 번역: {text}')
    chain = prompt | llm | StrOutputParser()
    chain.invoke({'lang': '영어', 'text': '안녕'})

실제 LangChain 과 이름을 맞춰 두었으므로, Colab 에서는 `from langchain_core.prompts import PromptTemplate` 로 바꾸면 된다.
"""
import re

from .llm import LLM, Response, system as _system, user as _user, parse_json


class Runnable:
    """invoke(input) 를 가진 모든 것. | 로 다음 단계와 잇는다"""

    def invoke(self, x):
        raise NotImplementedError

    def __or__(self, other):
        return Sequence([self, _wrap(other)])

    def __ror__(self, other):
        return Sequence([_wrap(other), self])

    def batch(self, items):
        return [self.invoke(x) for x in items]

    def pipe(self, *others):
        return Sequence([self] + [_wrap(o) for o in others])


def _wrap(x):
    if isinstance(x, Runnable):
        return x
    if isinstance(x, LLM):
        return LLMRunnable(x)
    if callable(x):
        return RunnableLambda(x)
    if isinstance(x, dict):
        return RunnableParallel(x)
    raise TypeError(f'체인에 넣을 수 없는 값: {x!r}')


class Sequence(Runnable):
    def __init__(self, steps):
        self.steps = []
        for s in steps:
            if isinstance(s, Sequence):
                self.steps += s.steps
            else:
                self.steps.append(s)

    def invoke(self, x):
        for s in self.steps:
            x = s.invoke(x)
        return x

    def __repr__(self):
        return ' | '.join(repr(s) for s in self.steps)


class RunnableLambda(Runnable):
    def __init__(self, fn, name=None):
        self.fn = fn
        self.name = name or getattr(fn, '__name__', 'lambda')

    def invoke(self, x):
        return self.fn(x)

    def __repr__(self):
        return f'RunnableLambda({self.name})'


class RunnableParallel(Runnable):
    """dict 의 각 항목을 같은 입력으로 실행해 dict 로 모은다"""
    def __init__(self, mapping):
        self.mapping = {k: _wrap(v) for k, v in mapping.items()}

    def invoke(self, x):
        return {k: v.invoke(x) for k, v in self.mapping.items()}

    def __repr__(self):
        return 'RunnableParallel(' + ', '.join(self.mapping) + ')'


class RunnablePassthrough(Runnable):
    def invoke(self, x):
        return x

    def __repr__(self):
        return 'RunnablePassthrough()'


class PromptTemplate(Runnable):
    """'{변수}' 를 채워 메시지 목록을 만든다"""

    def __init__(self, template, system=None):
        self.template = template
        self.system = system
        self.variables = sorted(set(re.findall(r'{(\w+)}', template + (system or ''))))

    @classmethod
    def from_template(cls, template, system=None):
        return cls(template, system)

    def format(self, **kw):
        return self.template.format(**kw)

    def invoke(self, x):
        if isinstance(x, str):
            x = {self.variables[0]: x} if len(self.variables) == 1 else {'input': x}
        msgs = []
        if self.system:
            msgs.append(_system(self.system.format(**x)))
        msgs.append(_user(self.template.format(**x)))
        return msgs

    def __repr__(self):
        return f'PromptTemplate({self.variables})'


class ChatPromptTemplate(PromptTemplate):
    """[('system', '...'), ('user', '...')] 형식"""

    def __init__(self, messages):
        sys_t = '\n'.join(c for r, c in messages if r == 'system') or None
        user_t = '\n'.join(c for r, c in messages if r in ('user', 'human'))
        super().__init__(user_t, sys_t)

    @classmethod
    def from_messages(cls, messages):
        return cls(messages)


class LLMRunnable(Runnable):
    def __init__(self, llm, **kw):
        self.llm = llm
        self.kw = kw

    def invoke(self, x):
        if isinstance(x, str):
            x = [_user(x)]
        return self.llm.chat(x, **self.kw)

    def __repr__(self):
        return repr(self.llm)


class StrOutputParser(Runnable):
    def invoke(self, x):
        return x.content if isinstance(x, Response) else str(x)

    def __repr__(self):
        return 'StrOutputParser()'


class JsonOutputParser(Runnable):
    def invoke(self, x):
        return parse_json(x.content if isinstance(x, Response) else x)

    def __repr__(self):
        return 'JsonOutputParser()'


def chain(*steps):
    """chain(prompt, llm, parser) == prompt | llm | parser"""
    return Sequence([_wrap(s) for s in steps])
