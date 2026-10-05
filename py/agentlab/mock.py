"""모의 LLM — API 키가 없어도 수업이 돌아가도록, 규칙 기반으로 **항상 같은** 응답을 만든다

- 도구 목록이 있으면 질문의 키워드로 알맞은 도구 호출을 만든다 (날씨 · 계산 · 검색 · 시간 …)
- 도구 결과(role='tool')가 오면 그 결과로 답을 만든다
- json_mode 면 JSON 문자열을 돌려준다
- mode='react' 면 Thought / Action / Action Input / Final Answer 형식으로 답한다
- MockLLM(responses=[...]) 로 미리 정한 응답을 차례로 돌려줄 수도 있다 (수업 시나리오용)

실제 LLM 보다 훨씬 단순하지만 **에이전트 루프의 구조**(판단 → 도구 → 관찰 → 답)를 똑같이 체험할 수 있다.
"""
import json
import re

from .llm import Response, ToolCall, Usage

CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '수원', '성남', '제주', '강릉', '춘천', '전주', '청주', '포항', '창원',
          '도쿄', '오사카', '베이징', '상하이', '뉴욕', '런던', '파리', '베를린', '시드니', '싱가포르', '방콕', '하노이', '타이베이', '홍콩']
GREETINGS = ('안녕', 'hello', 'hi', '반가', '인사')


def _text(m):
    if not m:
        return ''
    return str(m.get('content') or '')


def _last(messages, role):
    for m in reversed(messages):
        if m.get('role') == role:
            return m
    return None


def _role_from_system(messages):
    s = _last(messages, 'system')
    if not s:
        return ''
    t = _text(s)
    m = re.search(r'당신의 이름은\s*([^.。\n,]{1,20}?)(?:입니다|이다|야|이야|다)', t)
    if m:
        return m.group(1).strip()
    m = re.search(r'(?:당신은|너는|넌|You are)\s*(?:an?\s+)?([^.。\n,]{2,30}?)(?:입니다|이다|야|이야|다|\.|,|\n|$)', t)
    if m:
        return m.group(1).strip().strip('"\'')
    first = t.split('\n')[0].strip()
    first = re.sub(r'^(너는|당신은|넌)\s*', '', first)
    return first[:16]


def _core_request(q):
    """'이름: 내용' 머리와 [참고…] 같은 부가 섹션을 떼고 핵심 요청만"""
    q = str(q)
    q = q.split('\n\n[')[0]
    q = re.sub(r'^\s*(?!원문|피드백|목표|참고|작업|기준|질문|Question)[\w가-힣]{1,12}:\s*', '', q.strip())
    q = re.sub(r'\[[^\]]*\]\s*', '', q)
    return q.strip()


def _topic(q, *drop):
    t = _core_request(q)
    t = re.sub(r'(에 대해|에 관해|에 대한|해\s*줘|해주세요|하세요|주세요|해라|하라|써라|써\s*줘|해봐|줘)\b', ' ', t)
    for d in drop:
        t = re.sub(d, ' ', t)
    t = re.sub(r'\s+(를|을|로|으로|의|은|는|이|가)\s+', ' ', ' ' + t + ' ')
    t = re.sub(r'(를|을)$', '', ' '.join(t.split()))
    return t.strip(' .,:') or '주제'


def _approx_tokens(s):
    return max(1, len(str(s)) // 3)


class MockLLM:
    """결정적인 모의 LLM"""

    def __init__(self, responses=None, name='mock', **kw):
        self.responses = list(responses or [])
        self._i = 0
        self.name = name

    # ---------------- 공개
    def chat(self, messages, schemas=None, json_mode=False, mode=None):
        prompt_tokens = sum(_approx_tokens(_text(m)) for m in messages)
        if self.responses:
            r = self.responses[self._i % len(self.responses)]
            self._i += 1
            resp = r if isinstance(r, Response) else Response(str(r))
        elif mode == 'react':
            resp = self._react(messages, schemas or [])
        else:
            resp = self._auto(messages, schemas or [], json_mode)
        resp.usage = Usage(prompt_tokens, _approx_tokens(resp.content) + sum(_approx_tokens(json.dumps(c.args)) for c in resp.tool_calls))
        resp.model = 'mock-1'
        return resp

    # ---------------- 판단 규칙
    def _auto(self, messages, schemas, json_mode):
        last = messages[-1]
        if last.get('role') == 'tool':
            return Response(self._answer_from_tools(messages))
        q = _text(_last(messages, 'user') or {})
        if schemas:
            call = self._pick_tool(q, schemas, messages)
            if call is not None:
                return Response('', [call])
        if json_mode or self._wants_json(messages):
            return Response(self._json_answer(messages, q))
        return Response(self._plain_answer(messages, q))

    def _pick_tool(self, q, schemas, messages):
        q = _core_request(q)
        ql = q.lower()
        names = {s['name']: s for s in schemas}
        # 이번 턴(마지막 user 메시지 이후)에 이미 호출한 도구는 다시 고르지 않는다
        last_user = max([i for i, m in enumerate(messages) if m.get('role') == 'user'] or [-1])
        used = {tc['name'] for m in messages[last_user + 1:] if m.get('role') == 'assistant' for tc in (m.get('tool_calls') or [])}

        def find(*keys):
            for n, s in names.items():
                blob = (n + ' ' + s.get('description', '')).lower()
                if any(k in blob for k in keys) and n not in used:
                    return n
            return None

        def first_param(n):
            props = (names[n].get('parameters') or {}).get('properties') or {}
            return next(iter(props), None)

        # 날씨
        if any(k in ql for k in ('날씨', 'weather', '기온', '비 와', '우산')):
            n = find('weather', '날씨', '기온')
            if n:
                city = next((c for c in CITIES if c in q), None) or (re.search(r'([A-Za-z가-힣]+)\s*(?:의\s*)?(?:날씨|기온)', q) or [None, '서울'])[1]
                p = first_param(n)
                return ToolCall(n, {p: city} if p else {})
        # 계산
        if re.search(r'\d+\s*[\+\-\*/×÷x]\s*\d+', ql) or any(k in ql for k in ('계산', '곱', '더하', '나누', '빼', '제곱', 'calculate', '퍼센트', '%')):
            n = find('calc', '계산', 'math', '수식', 'add', '더하')
            if n:
                p = first_param(n)
                props = (names[n].get('parameters') or {}).get('properties') or {}
                expr = self._extract_expr(q)
                if p and len(props) == 1:
                    return ToolCall(n, {p: expr})
                nums = [int(x) if x.isdigit() else float(x) for x in re.findall(r'\d+(?:\.\d+)?', q)]
                if len(props) >= 2 and len(nums) >= 2:
                    keys = list(props)[:2]
                    return ToolCall(n, {keys[0]: nums[0], keys[1]: nums[1]})
                if p:
                    return ToolCall(n, {p: expr})
        # 시간 · 날짜
        if any(k in ql for k in ('몇 시', '지금 시간', '오늘 날짜', '현재 시각', 'what time', 'date')):
            n = find('time', '시간', 'now', 'date', '날짜')
            if n:
                return ToolCall(n, {})
        # 검색 · 위키
        if any(k in ql for k in ('검색', '찾아', '알아봐', '누구', '무엇', '뭐야', '설명', 'search', 'who', 'what')):
            n = find('search', '검색', 'wiki', '위키', '조사')
            if n:
                p = first_param(n)
                topic = re.sub(r'(에 대해|에 관해|를|을|검색해|찾아봐|알아봐|설명해|줘|해줘|주세요|\?|!|\.)', ' ', q)
                topic = re.sub(r'(누구야|뭐야|무엇|야|는|이|가|이란|란)\b', ' ', topic)
                topic = ' '.join(topic.split())[:40] or q[:40]
                return ToolCall(n, {p: topic} if p else {})
        # 파일 · 메모
        if any(k in ql for k in ('저장', '기록', '메모', '적어', 'save', 'write')):
            n = find('write', '저장', 'note', '메모', 'remember')
            if n:
                props = (names[n].get('parameters') or {}).get('properties') or {}
                keys = list(props)
                if len(keys) >= 2:
                    return ToolCall(n, {keys[0]: 'memo.txt', keys[1]: q})
                if keys:
                    return ToolCall(n, {keys[0]: q})
        if any(k in ql for k in ('읽어', '내용', 'read', '열어')):
            n = find('read', '읽')
            if n:
                p = first_param(n)
                fn = (re.search(r'([\w\-]+\.\w{1,5})', q) or [None, 'memo.txt'])[1]
                return ToolCall(n, {p: fn} if p else {})
        # 질문에 도구 이름이 직접 나오면 그 도구
        for n in names:
            if n.lower() in ql and n not in used:
                p = first_param(n)
                return ToolCall(n, {p: q} if p else {})
        return None

    @staticmethod
    def _extract_expr(q):
        s = q.replace('×', '*').replace('÷', '/').replace('x', '*')
        s = re.sub(r'(\d+)\s*더하기\s*(\d+)', r'\1 + \2', s)
        s = re.sub(r'(\d+)\s*빼기\s*(\d+)', r'\1 - \2', s)
        s = re.sub(r'(\d+)\s*곱하기\s*(\d+)', r'\1 * \2', s)
        s = re.sub(r'(\d+)\s*나누기\s*(\d+)', r'\1 / \2', s)
        s = re.sub(r'(\d+)\s*의\s*(\d+)\s*(?:퍼센트|%)', r'\1 * \2 / 100', s)
        s = re.sub(r'(\d+)\s*의\s*제곱', r'\1 ** 2', s)
        m = re.search(r'[\d\.\s\+\-\*/\(\)%]*\d[\d\.\s\+\-\*/\(\)%]*', s)
        expr = (m.group(0) if m else s).strip(' =?')
        return ' '.join(expr.split()) or q

    def _answer_from_tools(self, messages):
        results = []
        for m in reversed(messages):
            if m.get('role') == 'tool':
                results.append(m)
            elif m.get('role') == 'assistant':
                break
        results.reverse()
        q = _text(_last(messages, 'user') or {})
        parts = []
        for r in results:
            val = _text(r)
            try:
                d = json.loads(val)
            except Exception:
                d = val
            if isinstance(d, dict):
                if 'error' in d:
                    parts.append(f"{r.get('name', '도구')} 도구가 실패했습니다: {d['error']}")
                elif 'temperature' in d:
                    parts.append(f"{d.get('city', '')}의 현재 날씨는 {d.get('condition', '')}, 기온 {d.get('temperature')}°C 입니다." +
                                 (' 우산을 챙기세요.' if '비' in str(d.get('condition', '')) else ''))
                elif 'result' in d and len(d) <= 3:
                    parts.append(f"계산 결과는 {d['result']} 입니다.")
                elif 'summary' in d:
                    parts.append(f"{d.get('title', '')}: {str(d['summary'])[:160]}")
                elif 'now' in d or 'time' in d or 'date' in d:
                    parts.append(f"지금은 {d.get('now') or d.get('time') or d.get('date')} 입니다.")
                else:
                    parts.append(json.dumps(d, ensure_ascii=False)[:200])
            elif isinstance(d, list):
                parts.append('; '.join(str(x)[:60] for x in d[:3]))
            else:
                parts.append(str(d)[:200])
        role = _role_from_system(messages)
        head = f'[{role}] ' if role else ''
        return head + ' '.join(parts) if parts else head + f'"{q}" 에 대한 답을 찾지 못했습니다.'

    @staticmethod
    def _wants_json(messages):
        s = _last(messages, 'system')
        u = _last(messages, 'user')
        blob = (_text(s) + ' ' + _text(u)).lower()
        return 'json' in blob

    def _json_answer(self, messages, q):
        blob = (_text(_last(messages, 'system') or {}) + ' ' + q)
        ql = q.lower()
        keys = re.findall(r'"(\w+)"\s*:', blob)
        if any(k in blob for k in ('감성', '긍정', '부정', 'sentiment')):
            pos = any(k in ql for k in ('좋', '최고', '감사', '만족', '행복', '추천', '훌륭'))
            neg = any(k in ql for k in ('나쁘', '최악', '실망', '불만', '별로', '화나', '느리', '고장', '환불'))
            label = 'negative' if neg and not pos else 'positive' if pos else 'neutral'
            return json.dumps({'sentiment': label, 'confidence': 0.9 if (pos or neg) else 0.6, 'reason': '핵심 단어를 근거로 판단'}, ensure_ascii=False)
        if any(k in blob for k in ('분류', 'category', 'classify', '카테고리')):
            cat = '기술' if any(k in ql for k in ('코드', '파이썬', 'ai', '컴퓨터', '앱')) else '생활' if any(k in ql for k in ('음식', '여행', '날씨', '건강')) else '기타'
            return json.dumps({'category': cat, 'confidence': 0.8}, ensure_ascii=False)
        if any(k in blob for k in ('추출', 'extract', '이름', 'name', '이메일', 'email', '전화')):
            email = (re.search(r'[\w.\-]+@[\w.\-]+', q) or [None])[0]
            phone = (re.search(r'0\d{1,2}-\d{3,4}-\d{4}', q) or [None])[0]
            name = (re.search(r'([가-힣]{2,4})\s*(?:입니다|이고|이며|님|씨)', q) or [None, None])[1]
            return json.dumps({'name': name, 'email': email, 'phone': phone}, ensure_ascii=False)
        if any(k in blob for k in ('계획', 'plan', 'steps', '단계', '쪼개')):
            gm = re.search(r'목표\s*[:：]\s*(.+)', q)
            goal = (gm.group(1) if gm else _core_request(q)).strip()[:40]
            return json.dumps({'goal': goal, 'steps': [f'{goal} 에 필요한 정보 조사', '핵심 내용 정리', '결과물 작성', '검토 후 수정']}, ensure_ascii=False)
        if any(k in blob for k in ('평가', 'score', '점수', 'critique', '검토')):
            return json.dumps({'score': 7, 'issues': ['근거가 부족함', '문장이 길음'], 'suggestion': '근거 문장을 추가하고 문장을 짧게 나눈다'}, ensure_ascii=False)
        if keys:
            return json.dumps({k: f'{k} 값(모의)' for k in dict.fromkeys(keys)}, ensure_ascii=False)
        return json.dumps({'answer': self._plain_answer(messages, q, bare=True), 'confidence': 0.7}, ensure_ascii=False)

    def _plain_answer(self, messages, q, bare=False):
        q = _core_request(q)
        role = _role_from_system(messages)
        sys_t = _text(_last(messages, 'system') or {})
        ql = q.lower()
        head = '' if bare or not role else f'[{role}] '
        n_turn = sum(1 for m in messages if m.get('role') == 'user')
        # 이전 대화에서 사용자가 말한 사실 기억하기 (메모리 수업용)
        remembered = []
        for m in messages[:-1]:
            if m.get('role') == 'user':
                mm = re.search(r'(?:내|제)\s*이름은\s*([가-힣A-Za-z]+?)(?:이야|이에요|입니다|야|예요|이고|이다|\.|,|\s|$)', _text(m))
                if mm:
                    remembered.append(('이름', mm.group(1)))
                mm = re.search(r'(?:내가|제가|나는|저는|난|전)?\s*(?:좋아하는\s*(?:건|것은|거는|\S+은|\S+는)?)\s*([가-힣A-Za-z]+?)(?:이야|이에요|입니다|야|예요|이고|\.|,|\s|$)', _text(m))
                if mm:
                    remembered.append(('좋아하는 것', mm.group(1)))
        if any(k in ql for k in ('내 이름', '제 이름', '이름이 뭐', '누구라고')):
            name = next((v for k, v in remembered if k == '이름'), None)
            return head + (f'당신의 이름은 {name} 입니다.' if name else '죄송합니다, 이름을 아직 듣지 못했습니다.')
        if any(k in ql for k in ('좋아하는', '뭘 좋아')) and '?' in q or '뭐라고 했' in ql:
            v = next((v for k, v in remembered if k == '좋아하는 것'), None)
            if v:
                return head + f'{v} 을(를) 좋아한다고 하셨습니다.'
        if any(k in ql for k in ('요약', 'summarize', '정리해')):
            body = re.sub(r'(다음|아래|이)?\s*(글|문장|내용|텍스트|대화)?\s*(을|를)?\s*(한\s*줄로|세\s*문장|3문장|두\s*문장|간단히|짧게)?\s*(요약|정리)\s*(해\s*줘|해주세요|하세요|해라|:)?', '', q).strip()
            sents = [x.strip() for x in re.split(r'[.!?\n]', body) if x.strip()]
            core = sents[0][:60] if sents else body[:60]
            return head + f'요약: {core}' + (' 등 총 %d개 문장의 핵심을 한 줄로 정리했습니다.' % len(sents) if len(sents) > 1 else '')
        if any(k in ql for k in ('번역', 'translate')):
            src = re.sub(r'(다음|아래)?\s*(글|문장)?\s*(을|를)?\s*(영어|한국어|일본어|중국어)?\s*(로|으로)?\s*(번역|translate)\s*(해\s*줘|해주세요|하세요|해라|:)?', '', q).strip()
            return head + 'Translation: ' + (src[:60] or '(empty)')
        if any(k in ql for k in ('검토', '비평', '평가', '문제점', '피드백')) and '피드백:' not in q:
            return head + '검토 의견: 핵심 주장은 분명하지만 근거가 1개뿐이다. 구체적인 수치나 출처를 추가하고, 마지막 문단을 두 문장으로 줄이면 좋겠다.'
        if any(k in ql for k in ('수정', '다시 써', '반영해', '고쳐', '개선')) or '피드백:' in q:
            orig = (re.search(r'원문:\s*(.*?)(?:\n\s*\n|$)', q, re.S) or [None, q])[1].strip()[:50]
            return head + f'수정본: {orig} 최근 조사에 따르면 사용자의 72%가 이 기능을 매주 사용한다(출처: 2026 사용자 설문). 따라서 이 기능은 핵심 가치이며, 다음 분기에 우선 개선해야 한다.'
        if ('리뷰' in role or '검토' in role or 'review' in role.lower()) and ('def ' in q or 'print(' in q or 'class ' in q):
            return head + '리뷰 결과: 함수 이름과 docstring 이 명확하고 테스트 출력도 있습니다. 타입 힌트(a: int, b: int)를 추가하면 더 좋겠습니다. 승인합니다. TERMINATE'
        if any(k in ql for k in ('함수', '코드', '프로그램', '구현')):
            return head + 'def add(a, b):\n    """두 수를 더한다"""\n    return a + b\n\nprint(add(2, 3))  # 5'
        if any(k in ql for k in ('블로그', '글을 써', '글을 작성', '작성해', '초안', 'write', '기사')):
            topic = _topic(q, r'(블로그|글을 써|글을 작성|작성|초안|기사|write|포스트|게시글)')[:30]
            ctx = '이전 작업 결과를 바탕으로 ' if '[참고' in str(messages[-1].get('content', '')) else ''
            return head + f'# {topic}\n\n{ctx}도입: 왜 지금 {topic}인가?\n본문: 핵심 포인트 세 가지(자동화 확산 · 비용 절감 · 품질 관리)를 사례와 함께 설명한다.\n결론: 오늘 바로 시작할 수 있는 한 가지 행동을 제안한다.'
        if any(k in ql for k in ('조사', 'research', '동향', '자료')):
            topic = _topic(q, r'(동향|최신|조사|자료|리서치|research)')[:30]
            return head + f'조사 결과 — {topic}: ① 정의와 배경 ② 최근 동향 3가지(자동화 확산, 비용 절감, 품질 관리) ③ 대표 사례 2건 ④ 참고 출처 목록'
        if any(k in ql for k in ('이름을 정하', '아이디어', '제안해', '브레인스토밍')):
            return head + '제안: ① "에이전트원" ② "오토브레인" ③ "스마트메이트" — 이 중 ②를 추천합니다. 짧고 기억하기 쉽습니다.'
        if any(k in ql for k in ('계획', '단계', 'plan')):
            return head + '계획: 1) 목표를 작은 작업으로 나눈다 2) 필요한 도구를 고른다 3) 순서대로 실행한다 4) 결과를 검토하고 보완한다'
        if any(k in ql for k in GREETINGS):
            return head + '안녕하세요! 무엇을 도와드릴까요?'
        if any(k in ql for k in ('에이전트', 'agent')):
            return head + 'AI 에이전트는 목표를 받아 스스로 계획하고, 도구를 호출하며, 결과를 관찰해 다음 행동을 정하는 LLM 프로그램입니다.'
        if any(k in ql for k in ('자기소개', '누구', '소개')):
            return head + (f'저는 {role} 입니다. 무엇이든 물어보세요.' if role else '저는 수업용 모의 LLM 입니다. API 키를 넣으면 실제 모델이 답합니다.')
        if '?' in q or any(k in ql for k in ('뭐', '무엇', '어떻게', '왜', '알려')):
            tone = ' (친절하게 설명)' if any(k in sys_t for k in ('친절', '쉽게', '초등')) else ' (간결하게)' if any(k in sys_t for k in ('간결', '짧게', '한 문장')) else ''
            return head + f'"{q.strip()[:40]}" 에 대한 답변{tone}: 핵심은 두 가지입니다. 첫째, 문제를 정확히 정의하는 것. 둘째, 작은 단계로 나누어 검증하며 진행하는 것입니다.'
        return head + f'알겠습니다. "{q.strip()[:40]}" 을(를) 처리했습니다.' + (f' (대화 {n_turn}번째)' if n_turn > 1 else '')

    # ---------------- ReAct 텍스트 형식
    def _react(self, messages, schemas):
        last_user = _text(_last(messages, 'user') or {})
        # 관찰(Observation)이 이미 있으면 최종 답
        tail = last_user
        if 'Observation:' in tail:
            obs = tail.split('Observation:')[-1].strip().split('\n')[0]
            try:
                d = json.loads(obs)
            except Exception:
                d = obs
            if isinstance(d, dict) and 'temperature' in d:
                ans = f"{d.get('city', '')}의 날씨는 {d.get('condition', '')}, {d.get('temperature')}°C 입니다."
            elif isinstance(d, dict) and 'result' in d:
                ans = f"계산 결과는 {d['result']} 입니다."
            elif isinstance(d, dict) and 'summary' in d:
                ans = str(d.get('summary'))[:120]
            else:
                ans = str(obs)[:120]
            return Response(f'Thought: 관찰 결과로 충분히 답할 수 있다.\nFinal Answer: {ans}')
        q = tail.split('Question:')[-1].strip().split('\n')[0] if 'Question:' in tail else tail
        call = self._pick_tool(q, schemas, messages) if schemas else None
        if call is None:
            return Response(f'Thought: 도구 없이 답할 수 있다.\nFinal Answer: {self._plain_answer(messages, q, bare=True)}')
        return Response(f'Thought: "{q[:40]}" 에 답하려면 {call.name} 도구가 필요하다.\nAction: {call.name}\nAction Input: {json.dumps(call.args, ensure_ascii=False)}')
