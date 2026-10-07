"""Agent Skills — SKILL.md 형식의 스킬을 정의 · 파싱 · 선택해 에이전트의 시스템 프롬프트와 도구에 끼운다 (순수 파이썬)

스킬 = 이름 · 설명(언제 쓰는지) · 지시문(어떻게 하는지) · 참고 자료 · 함께 쓰는 도구.
에이전트는 처음에는 스킬의 **이름과 설명만** 보고(1단계), 작업에 맞는 스킬을 고르면 그 **지시문 전체와 도구**를 활성화한다(2단계, 점진적 로딩).

    s = Skill('report-writer', '보고서 · 요약문 작성 요청에 사용', instructions='…', keywords='보고서, 요약')
    ss = SkillSet([s, …])
    chosen = ss.select('매출 보고서 써줘')                       # 키워드 (llm= 을 주면 LLM 이 고른다)
    system = ss.build_system('당신은 비서입니다.', chosen)       # 조립된 시스템 프롬프트
    tools  = ss.tools_for(chosen)

    Skill.from_md(text) / skill.to_md()                           # SKILL.md ↔ 객체
"""
import json
import re

import agentlab as al


class Skill:
    def __init__(self, name, description, instructions='', resources=None, tools=None, keywords=''):
        self.name = re.sub(r'[^a-z0-9\-]+', '-', str(name or 'skill').strip().lower()).strip('-') or 'skill'
        self.description = str(description or '').strip()
        self.instructions = str(instructions or '').strip()
        self.resources = dict(resources or {})       # 파일명 → 내용 (references/…)
        self.tools = [t if isinstance(t, al.Tool) else al.Tool(t) for t in (tools or [])]
        self.keywords = [k.strip().lower() for k in str(keywords or '').split(',') if k.strip()]

    # ---------------- SKILL.md
    @classmethod
    def from_md(cls, text, tools=None):
        """SKILL.md(frontmatter + 본문) → Skill"""
        text = str(text or '').replace('\r\n', '\n')
        m = re.match(r'^\s*---\s*\n(.*?)\n---\s*\n?(.*)$', text, re.S)
        meta, body = {}, text
        if m:
            body = m.group(2)
            for line in m.group(1).split('\n'):
                mm = re.match(r'^\s*([\w\-]+)\s*:\s*(.*?)\s*$', line)
                if mm:
                    v = mm.group(2).strip().strip('"').strip("'")
                    meta[mm.group(1).lower()] = v
        name = meta.get('name') or (re.search(r'^#\s*(.+)$', body, re.M) or [None, 'skill'])[1]
        return cls(name, meta.get('description', ''), body.strip(), tools=tools, keywords=meta.get('keywords', ''))

    def to_md(self):
        lines = ['---', f'name: {self.name}', f'description: {self.description}']
        if self.keywords:
            lines.append('keywords: ' + ', '.join(self.keywords))
        lines += ['---', '', self.instructions or f'# {self.name}', '']
        if self.resources:
            lines.append('## 참고 자료')
            for fn in self.resources:
                lines.append(f'- references/{fn}')
            lines.append('')
        return '\n'.join(lines)

    def describe(self):
        return {'name': self.name, 'description': self.description, 'tools': [t.name for t in self.tools], 'keywords': self.keywords, 'resources': list(self.resources)}

    def __repr__(self):
        return f'Skill({self.name})'


class SkillSet:
    def __init__(self, skills=None):
        self.skills = []
        for s in skills or []:
            if isinstance(s, Skill) and s.name not in [x.name for x in self.skills]:
                self.skills.append(s)

    def __iter__(self):
        return iter(self.skills)

    def __len__(self):
        return len(self.skills)

    def catalog(self):
        """1단계: 이름 · 설명 목록 (항상 프롬프트에 들어간다)"""
        if not self.skills:
            return ''
        return '사용할 수 있는 스킬 (작업에 맞으면 해당 스킬의 지시를 따른다):\n' + '\n'.join(f'- {s.name}: {s.description}' for s in self.skills)

    def select(self, query, llm=None, mode='auto', max_skills=2):
        """작업에 맞는 스킬 고르기 → [Skill]. mode: keyword | llm | auto(키워드 → 없으면 LLM) | all"""
        q = str(query or '').lower()
        if mode == 'all':
            return list(self.skills)
        hits = []
        if mode in ('keyword', 'auto'):
            for s in self.skills:
                keys = s.keywords or [w for w in re.split(r'[\s·,./()]+', s.description.lower()) if len(w) >= 2]
                score = sum(1 for k in keys if k and k in q)
                if s.name.lower() in q:
                    score += 2
                if score:
                    hits.append((score, s))
            hits.sort(key=lambda x: -x[0])
        if hits or mode == 'keyword' or llm is None:
            return [s for _, s in hits[:max_skills]]
        names = [s.name for s in self.skills]
        r = llm.chat([al.system('너는 작업에 맞는 스킬을 고르는 라우터다. 반드시 JSON {"skills": ["이름", ...]} 로만 답한다. 맞는 것이 없으면 빈 목록.'),
                      al.user(self.catalog() + f'\n\n작업: {query}')], json_mode=True)
        try:
            chosen = [str(x) for x in (r.json().get('skills') or [])]
        except Exception:
            chosen = [n for n in names if n in r.content]
        return [s for s in self.skills if s.name in chosen][:max_skills]

    def build_system(self, base_system, chosen):
        """2단계: 고른 스킬의 지시문 · 참고 자료를 시스템 프롬프트에 붙인다"""
        parts = [p for p in [str(base_system or '').strip(), self.catalog()] if p]
        for s in chosen:
            block = f'## 스킬 활성화: {s.name}\n{s.instructions}'
            for fn, content in s.resources.items():
                block += f'\n\n### 참고 자료: {fn}\n{content}'
            parts.append(block)
        return '\n\n'.join(parts)

    def tools_for(self, chosen):
        out = []
        for s in chosen:
            for t in s.tools:
                if t.name not in [x.name for x in out]:
                    out.append(t)
        return out

    def apply(self, query, base_system='', base_tools=None, llm=None, mode='auto', log=None):
        """선택 + 조립을 한 번에 → (system, tools, chosen)"""
        chosen = self.select(query, llm=llm, mode=mode)
        if log:
            log('📚 스킬 선택: ' + (', '.join(s.name for s in chosen) if chosen else '(없음 — 기본 동작)'))
        tools = list(base_tools or [])
        for t in self.tools_for(chosen):
            if t.name not in [x.name for x in tools]:
                tools.append(t)
        return self.build_system(base_system, chosen), tools, chosen


HELPER = '''class Skill:
    """Agent Skill: 이름 · 설명 · 지시문 · 참고 자료 · 도구"""

    def __init__(self, name, description, instructions='', resources=None, tools=None, keywords=''):
        self.name, self.description, self.instructions = name, description, instructions
        self.resources, self.tools = dict(resources or {}), list(tools or [])
        self.keywords = [k.strip().lower() for k in str(keywords or '').split(',') if k.strip()]


def skills_apply(skills, query, base_system='', base_tools=None, llm=None, mode='auto', max_skills=2):
    """작업에 맞는 스킬을 골라(1단계: 이름·설명 → 2단계: 지시문·도구) 시스템 프롬프트와 도구 목록을 만든다"""
    q = str(query or '').lower()
    catalog = '사용할 수 있는 스킬 (작업에 맞으면 해당 스킬의 지시를 따른다):\\n' + '\\n'.join(f'- {s.name}: {s.description}' for s in skills)
    chosen = list(skills) if mode == 'all' else []
    if mode in ('keyword', 'auto'):
        hits = []
        for s in skills:
            keys = s.keywords or [w for w in re.split(r'[\\s·,./()]+', s.description.lower()) if len(w) >= 2]
            score = sum(1 for k in keys if k and k in q) + (2 if s.name.lower() in q else 0)
            if score:
                hits.append((score, s))
        chosen = [s for _, s in sorted(hits, key=lambda x: -x[0])[:max_skills]]
    if not chosen and mode in ('llm', 'auto') and llm is not None:
        r = llm.chat([al.system('너는 작업에 맞는 스킬을 고르는 라우터다. 반드시 JSON {"skills": ["이름", ...]} 로만 답한다.'), al.user(catalog + '\\n\\n작업: ' + str(query))], json_mode=True)
        try:
            names = [str(x) for x in (r.json().get('skills') or [])]
        except Exception:
            names = [s.name for s in skills if s.name in r.content]
        chosen = [s for s in skills if s.name in names][:max_skills]
    print('📚 스킬 선택: ' + (', '.join(s.name for s in chosen) if chosen else '(없음 — 기본 동작)'))
    parts = [p for p in [str(base_system or '').strip(), catalog if skills else ''] if p]
    tools = list(base_tools or [])
    for s in chosen:
        block = f'## 스킬 활성화: {s.name}\\n{s.instructions}'
        for fn, content in s.resources.items():
            block += f'\\n\\n### 참고 자료: {fn}\\n{content}'
        parts.append(block)
        for t in s.tools:
            if t.name not in [x.name for x in tools]:
                tools.append(t)
    return '\\n\\n'.join(parts), tools, chosen'''
