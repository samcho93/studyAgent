"""도구(Tool) — 파이썬 함수를 LLM 이 호출할 수 있는 도구로 바꾼다

    @tool
    def get_weather(city: str) -> dict:
        \"\"\"도시의 현재 날씨를 알려준다\"\"\"
        ...

    get_weather.schema()      # LLM 에게 보낼 JSON 스키마 (함수 이름 · 설명 · 매개변수)
    get_weather('서울')       # 그냥 파이썬 함수처럼 호출
    get_weather.call({'city': '서울'})   # 에이전트가 쓰는 호출 (오류를 {'error': …} 로 돌려준다)

내장 도구: calculator · get_weather · wiki_search · now · read_file · write_file · remember_note
(네트워크가 없으면 get_weather · wiki_search 는 준비된 예시 데이터를 돌려준다)
"""
import datetime
import inspect
import json
import math
import os
import re

from . import _http

_TYPES = {int: 'integer', float: 'number', str: 'string', bool: 'boolean', list: 'array', dict: 'object'}


class Tool:
    """함수 + 이름 + 설명 + 매개변수 스키마"""

    def __init__(self, fn, name=None, description=None, parameters=None):
        self.fn = fn
        self.name = name or fn.__name__
        self.description = (description or inspect.getdoc(fn) or '').strip().split('\n\n')[0].strip() or self.name
        self.parameters = parameters or self._infer(fn)
        self.__doc__ = fn.__doc__

    @staticmethod
    def _infer(fn):
        sig = inspect.signature(fn)
        props, required = {}, []
        doc = inspect.getdoc(fn) or ''
        for pname, p in sig.parameters.items():
            if pname in ('self', 'cls') or p.kind in (p.VAR_POSITIONAL, p.VAR_KEYWORD):
                continue
            ann = p.annotation if p.annotation is not inspect.Parameter.empty else str
            t = _TYPES.get(ann, 'string')
            desc = ''
            m = re.search(r'^\s*%s\s*(?:\([^)]*\))?\s*:\s*(.+)$' % re.escape(pname), doc, re.M)
            if m:
                desc = m.group(1).strip()
            props[pname] = {'type': t, 'description': desc or pname}
            if p.default is inspect.Parameter.empty:
                required.append(pname)
            else:
                props[pname]['default'] = p.default
        return {'type': 'object', 'properties': props, 'required': required}

    def schema(self):
        """LLM 에 보내는 함수 스키마 (OpenAI function 형식 — 다른 공급자용 변환은 llm.py 가 한다)"""
        return {'name': self.name, 'description': self.description, 'parameters': self.parameters}

    def __call__(self, *a, **kw):
        return self.fn(*a, **kw)

    def call(self, args=None):
        """에이전트용 호출: dict 인자 → 결과. 예외는 {'error': …} 로 돌려주어 루프가 멈추지 않게 한다"""
        args = args or {}
        if not isinstance(args, dict):
            args = {next(iter(self.parameters.get('properties') or ['value'])): args}
        try:
            return self.fn(**args)
        except TypeError as e:
            return {'error': f'인자 오류: {e}'}
        except Exception as e:  # noqa
            return {'error': f'{type(e).__name__}: {e}'}

    def describe(self):
        """ReAct 프롬프트용 한 줄 설명"""
        props = self.parameters.get('properties') or {}
        ps = ', '.join(f'{k}: {v.get("type", "string")}' for k, v in props.items())
        return f'- {self.name}({ps}): {self.description}'

    def __repr__(self):
        return f'Tool({self.name})'


def tool(fn=None, *, name=None, description=None):
    """데코레이터: 함수를 Tool 로 만든다 (@tool 또는 @tool(name=…, description=…))"""
    if fn is None:
        return lambda f: Tool(f, name, description)
    return Tool(fn, name, description)


class ToolRegistry:
    """이름 → Tool. 에이전트가 LLM 의 도구 호출 요청을 실행할 때 쓴다"""

    def __init__(self, tools=None):
        self.tools = {}
        for t in tools or []:
            self.add(t)

    def add(self, t):
        if not isinstance(t, Tool):
            t = Tool(t)
        self.tools[t.name] = t
        return t

    def get(self, name):
        return self.tools.get(name)

    def schemas(self):
        return [t.schema() for t in self.tools.values()]

    def describe(self):
        return '\n'.join(t.describe() for t in self.tools.values())

    def names(self):
        return list(self.tools)

    def execute(self, call):
        """ToolCall → 결과 (없는 도구면 error)"""
        t = self.get(call.name)
        if t is None:
            return {'error': f"'{call.name}' 도구는 없습니다. 사용 가능: {', '.join(self.tools)}"}
        return t.call(call.args)

    def __iter__(self):
        return iter(self.tools.values())

    def __len__(self):
        return len(self.tools)


def result_text(result, limit=1500):
    """도구 결과를 LLM 에게 넘길 문자열로"""
    if isinstance(result, str):
        s = result
    else:
        try:
            s = json.dumps(result, ensure_ascii=False, default=str)
        except Exception:
            s = str(result)
    return s if len(s) <= limit else s[:limit] + '…(생략)'


# ================================================================== 내장 도구
_SAFE_MATH = {k: getattr(math, k) for k in ('sqrt', 'sin', 'cos', 'tan', 'log', 'log10', 'exp', 'pi', 'e', 'floor', 'ceil', 'pow', 'fabs')}
_SAFE_MATH.update({'abs': abs, 'round': round, 'min': min, 'max': max, 'sum': sum})


@tool
def calculator(expression: str) -> dict:
    """수식을 계산한다 (사칙연산 · 괄호 · sqrt · 퍼센트 등)

    expression: 계산할 수식. 예: '(3 + 4) * 2', 'sqrt(16)', '1500 * 0.15'
    """
    expr = str(expression).replace('×', '*').replace('÷', '/').replace('^', '**').replace(',', '')
    expr = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'(\1/100)', expr)
    if not re.fullmatch(r'[\d\s\.\+\-\*/\(\)%a-z_,]+', expr):
        return {'error': '허용되지 않는 문자가 있습니다', 'expression': expression}
    try:
        val = eval(expr, {'__builtins__': {}}, _SAFE_MATH)  # noqa: S307 — 안전한 이름만 허용
    except ZeroDivisionError:
        return {'error': '0 으로 나눌 수 없습니다', 'expression': expression}
    except Exception as e:  # noqa
        return {'error': f'계산 실패: {e}', 'expression': expression}
    if isinstance(val, float) and val.is_integer():
        val = int(val)
    elif isinstance(val, float):
        val = round(val, 6)
    return {'expression': expression, 'result': val}


# 네트워크가 없을 때 쓰는 예시 날씨 (수업 · 검증용)
_SAMPLE_WEATHER = {
    '서울': (18.4, '맑음', 42, 2.1), '부산': (21.0, '구름 조금', 60, 4.3), '대구': (19.5, '맑음', 38, 1.5), '인천': (17.2, '흐림', 55, 3.0),
    '광주': (20.1, '비', 80, 2.4), '대전': (18.9, '맑음', 45, 1.8), '제주': (22.3, '구름 많음', 70, 6.2), '강릉': (16.8, '맑음', 50, 3.6),
    '도쿄': (20.5, '구름 조금', 58, 2.9), '뉴욕': (14.2, '비', 77, 5.1), '런던': (12.6, '흐림', 83, 4.0), '파리': (15.3, '맑음', 61, 2.2),
}
_WMO = {0: '맑음', 1: '대체로 맑음', 2: '구름 조금', 3: '흐림', 45: '안개', 48: '안개', 51: '이슬비', 53: '이슬비', 55: '이슬비',
        61: '비', 63: '비', 65: '강한 비', 71: '눈', 73: '눈', 75: '강한 눈', 80: '소나기', 81: '소나기', 82: '강한 소나기', 95: '뇌우', 96: '뇌우', 99: '뇌우'}
_GEO = {'서울': (37.57, 126.98), '부산': (35.18, 129.08), '대구': (35.87, 128.60), '인천': (37.46, 126.71), '광주': (35.16, 126.85), '대전': (36.35, 127.38),
        '울산': (35.54, 129.31), '세종': (36.48, 127.29), '수원': (37.26, 127.03), '제주': (33.50, 126.53), '강릉': (37.75, 128.88), '춘천': (37.88, 127.73),
        '전주': (35.82, 127.15), '청주': (36.64, 127.49), '포항': (36.02, 129.37), '창원': (35.23, 128.68), '도쿄': (35.68, 139.69), '오사카': (34.69, 135.50),
        '베이징': (39.90, 116.40), '상하이': (31.23, 121.47), '뉴욕': (40.71, -74.01), '런던': (51.51, -0.13), '파리': (48.86, 2.35), '베를린': (52.52, 13.41),
        '시드니': (-33.87, 151.21), '싱가포르': (1.35, 103.82), '방콕': (13.76, 100.50), '하노이': (21.03, 105.85), '타이베이': (25.03, 121.57), '홍콩': (22.32, 114.17)}


@tool
def get_weather(city: str) -> dict:
    """도시의 현재 날씨(기온 · 날씨 상태 · 습도 · 풍속)를 알려준다. Open-Meteo 무료 API 사용 (키 불필요)

    city: 도시 이름 (한글 또는 영문). 예: '서울', 'Tokyo'
    """
    city = str(city).strip()
    key = next((c for c in _GEO if c in city), None)
    lat = lon = None
    if key:
        lat, lon = _GEO[key]
        city = key
    elif not _http.offline():
        g = _http.get_json('https://geocoding-api.open-meteo.com/v1/search?name=%s&count=1&language=ko' % _q(city))
        if g and g.get('results'):
            r0 = g['results'][0]
            lat, lon, city = r0['latitude'], r0['longitude'], r0.get('name', city)
    if lat is not None and not _http.offline():
        d = _http.get_json(f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto')
        if d and d.get('current'):
            c = d['current']
            return {'city': city, 'temperature': c.get('temperature_2m'), 'condition': _WMO.get(c.get('weather_code'), '알 수 없음'),
                    'humidity': c.get('relative_humidity_2m'), 'wind_kmh': c.get('wind_speed_10m'), 'source': 'open-meteo.com', 'time': c.get('time')}
    s = _SAMPLE_WEATHER.get(city)
    if s is None:
        if key is None and not _http.offline():
            return {'error': f"'{city}' 도시를 찾지 못했습니다"}
        s = (18.0, '맑음', 50, 2.0)
    return {'city': city, 'temperature': s[0], 'condition': s[1], 'humidity': s[2], 'wind_kmh': s[3], 'source': 'sample (offline)'}


def _q(s):
    from urllib.parse import quote
    return quote(str(s))


_SAMPLE_WIKI = {
    'ai 에이전트': ('지능형 에이전트', '지능형 에이전트는 환경을 인식하고 목표 달성을 위해 자율적으로 행동하는 시스템이다. 대규모 언어 모델 기반 에이전트는 도구 호출과 계획 기능을 결합해 복잡한 작업을 수행한다.'),
    '에이전트': ('지능형 에이전트', '지능형 에이전트는 환경을 인식하고 목표 달성을 위해 자율적으로 행동하는 시스템이다. 대규모 언어 모델 기반 에이전트는 도구 호출과 계획 기능을 결합해 복잡한 작업을 수행한다.'),
    '파이썬': ('파이썬', '파이썬은 1991년 귀도 반 로섬이 발표한 고급 프로그래밍 언어로, 읽기 쉬운 문법과 방대한 라이브러리로 데이터 과학과 인공지능 분야에서 널리 쓰인다.'),
    '대규모 언어 모델': ('대형 언어 모델', '대형 언어 모델(LLM)은 방대한 텍스트로 학습한 신경망으로, 다음 토큰을 예측하는 방식으로 문장을 생성하며 번역·요약·질의응답 등에 쓰인다.'),
    'llm': ('대형 언어 모델', '대형 언어 모델(LLM)은 방대한 텍스트로 학습한 신경망으로, 다음 토큰을 예측하는 방식으로 문장을 생성하며 번역·요약·질의응답 등에 쓰인다.'),
    '랭체인': ('LangChain', 'LangChain은 대형 언어 모델로 애플리케이션을 만들기 위한 오픈소스 프레임워크로, 프롬프트·체인·도구·메모리 구성 요소를 제공한다.'),
    'langchain': ('LangChain', 'LangChain은 대형 언어 모델로 애플리케이션을 만들기 위한 오픈소스 프레임워크로, 프롬프트·체인·도구·메모리 구성 요소를 제공한다.'),
    '한국폴리텍대학': ('한국폴리텍대학', '한국폴리텍대학은 고용노동부 산하의 국립 기술 교육 대학으로, 전국 캠퍼스에서 산업 현장 중심의 직업 교육을 제공한다.'),
    '서울': ('서울특별시', '서울특별시는 대한민국의 수도이자 최대 도시로, 한강을 중심으로 25개 자치구로 이루어져 있으며 정치·경제·문화의 중심지이다.'),
    '커피': ('커피', '커피는 커피나무 열매의 씨앗을 볶아 만든 음료로, 카페인을 함유하며 전 세계에서 가장 널리 소비되는 음료 중 하나이다.'),
    '전기차': ('전기 자동차', '전기 자동차는 배터리에 저장된 전기로 모터를 구동하는 자동차로, 배출가스가 없고 유지비가 낮아 보급이 빠르게 늘고 있다.'),
}


@tool
def wiki_search(query: str) -> dict:
    """위키백과(한국어)에서 주제를 검색해 요약을 돌려준다 (키 불필요)

    query: 검색어. 예: '대규모 언어 모델'
    """
    q = str(query).strip()
    if not _http.offline():
        d = _http.get_json('https://ko.wikipedia.org/w/api.php?action=query&list=search&srsearch=%s&srlimit=1&format=json&origin=*' % _q(q))
        hits = (d or {}).get('query', {}).get('search') or []
        if hits:
            title = hits[0]['title']
            s = _http.get_json('https://ko.wikipedia.org/api/rest_v1/page/summary/%s' % _q(title.replace(' ', '_')))
            if s and s.get('extract'):
                return {'title': title, 'summary': s['extract'][:600], 'url': f'https://ko.wikipedia.org/wiki/{_q(title.replace(" ", "_"))}', 'source': 'wikipedia'}
            return {'title': title, 'summary': re.sub(r'<[^>]+>', '', hits[0].get('snippet', '')), 'source': 'wikipedia'}
        if d is not None:
            return {'error': f"'{q}' 검색 결과가 없습니다"}
    ql = q.lower()
    for k, (title, summ) in _SAMPLE_WIKI.items():
        if k in ql or ql in k:
            return {'title': title, 'summary': summ, 'source': 'sample (offline)'}
    return {'title': q, 'summary': f'{q} 에 대한 예시 요약입니다. (오프라인 — 네트워크가 있으면 위키백과에서 실제 내용을 가져옵니다)', 'source': 'sample (offline)'}


@tool
def now() -> dict:
    """현재 날짜와 시각을 알려준다"""
    if _http.offline():
        t = datetime.datetime(2026, 10, 5, 9, 30)   # 검증 · 수업용 고정 시각
    else:
        t = datetime.datetime.now()
    days = ['월', '화', '수', '목', '금', '토', '일']
    return {'now': t.strftime('%Y-%m-%d %H:%M'), 'weekday': days[t.weekday()] + '요일'}


@tool
def read_file(path: str) -> dict:
    """작업 폴더의 텍스트 파일을 읽는다

    path: 파일 이름. 예: 'memo.txt'
    """
    if not os.path.exists(path):
        return {'error': f'{path} 파일이 없습니다'}
    with open(path, encoding='utf-8') as f:
        return {'path': path, 'content': f.read()[:2000]}


@tool
def write_file(path: str, content: str) -> dict:
    """작업 폴더에 텍스트 파일을 쓴다 (덮어쓰기)

    path: 파일 이름. 예: 'memo.txt'
    content: 저장할 내용
    """
    with open(path, 'w', encoding='utf-8') as f:
        f.write(str(content))
    return {'path': path, 'bytes': len(str(content).encode('utf-8')), 'ok': True}


_NOTES = []


@tool
def remember_note(note: str) -> dict:
    """나중에 참고할 메모를 저장한다

    note: 저장할 메모 한 줄
    """
    _NOTES.append(str(note))
    return {'saved': True, 'count': len(_NOTES), 'notes': list(_NOTES)}
