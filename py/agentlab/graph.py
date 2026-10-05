"""미니 LangGraph — 상태(dict)를 노드(함수)들이 차례로 고쳐 가는 그래프

    g = StateGraph()
    g.add_node('plan', plan_fn)             # fn(state) -> dict (바뀐 키만 돌려준다)
    g.add_node('act', act_fn)
    g.add_edge(START, 'plan')
    g.add_edge('plan', 'act')
    g.add_conditional_edges('act', should_continue, {'continue': 'act', 'done': END})
    app = g.compile()
    final = app.invoke({'task': '...'})
    for event in app.stream({'task': '...'}): print(event)   # 노드별 중간 상태

실제 LangGraph 와 메서드 이름을 맞춰 두었다 (StateGraph · add_node · add_edge · add_conditional_edges · compile · invoke · stream).
"""
START = '__start__'
END = '__end__'


class StateGraph:
    def __init__(self, schema=None):
        self.schema = schema
        self.nodes = {}
        self.edges = {}
        self.cond = {}
        self.entry = None

    def add_node(self, name, fn):
        if name in (START, END):
            raise ValueError('START/END 는 노드 이름으로 쓸 수 없다')
        self.nodes[name] = fn
        return self

    def add_edge(self, src, dst):
        if src == START:
            self.entry = dst
        else:
            self.edges[src] = dst
        return self

    def set_entry_point(self, name):
        self.entry = name
        return self

    def add_conditional_edges(self, src, router, mapping=None):
        """router(state) 가 돌려준 값을 mapping 으로 다음 노드로 바꾼다 (mapping 이 없으면 값 자체가 노드 이름)"""
        self.cond[src] = (router, mapping)
        return self

    def compile(self, checkpointer=None, max_steps=50):
        missing = [d for d in list(self.edges.values()) + [self.entry] if d not in self.nodes and d != END]
        if missing:
            raise ValueError(f'정의되지 않은 노드: {missing}')
        return CompiledGraph(self, checkpointer, max_steps)

    def draw(self):
        """그래프 구조를 텍스트로"""
        lines = [f'{START} → {self.entry}']
        for s, d in self.edges.items():
            lines.append(f'{s} → {d}')
        for s, (router, mapping) in self.cond.items():
            if mapping:
                lines.append(f'{s} ⇢ ' + ' | '.join(f'{k}:{v}' for k, v in mapping.items()))
            else:
                lines.append(f'{s} ⇢ (router)')
        print('\n'.join(lines))


class MemorySaver:
    """체크포인트: thread_id 별 마지막 상태를 기억한다"""
    def __init__(self):
        self.store = {}

    def get(self, thread_id):
        return self.store.get(thread_id)

    def put(self, thread_id, state):
        self.store[thread_id] = dict(state)


class CompiledGraph:
    def __init__(self, graph, checkpointer=None, max_steps=50):
        self.g = graph
        self.checkpointer = checkpointer
        self.max_steps = max_steps

    def _next(self, node, state):
        if node in self.g.cond:
            router, mapping = self.g.cond[node]
            key = router(state)
            if mapping is not None:
                if key not in mapping:
                    raise KeyError(f"'{node}' 의 분기 '{key}' 가 mapping 에 없다: {list(mapping)}")
                return mapping[key]
            return key
        return self.g.edges.get(node, END)

    def stream(self, state, config=None):
        """노드를 하나씩 실행하며 {노드이름: 바뀐 값} 을 낸다"""
        thread = (config or {}).get('thread_id') or (config or {}).get('configurable', {}).get('thread_id')
        cur = dict(state or {})
        if self.checkpointer and thread and self.checkpointer.get(thread):
            prev = self.checkpointer.get(thread)
            prev.update(cur)
            cur = prev
        node = self.g.entry
        steps = 0
        while node != END:
            if node is None:
                raise ValueError('시작 노드가 없다: add_edge(START, "노드") 를 호출해라')
            fn = self.g.nodes[node]
            update = fn(cur) or {}
            if not isinstance(update, dict):
                raise TypeError(f"노드 '{node}' 는 dict 를 돌려줘야 한다 (받은 값: {type(update).__name__})")
            for k, v in update.items():
                if k in cur and isinstance(cur[k], list) and isinstance(v, list) and k.endswith('s'):
                    cur[k] = cur[k] + v      # messages 처럼 리스트 키는 이어 붙인다
                else:
                    cur[k] = v
            yield {node: update}
            if self.checkpointer and thread:
                self.checkpointer.put(thread, cur)
            node = self._next(node, cur)
            steps += 1
            if steps >= self.max_steps:
                raise RuntimeError(f'{self.max_steps}단계를 넘었다 — 무한 루프를 확인해라')
        self._last = cur

    def invoke(self, state, config=None):
        for _ in self.stream(state, config):
            pass
        return self._last

    def get_state(self, config):
        thread = (config or {}).get('thread_id') or (config or {}).get('configurable', {}).get('thread_id')
        return self.checkpointer.get(thread) if self.checkpointer else None
