# %% [markdown]
# # 15. Agent Skills — SKILL.md 폴더 만들기 · zip · 실제 LLM 으로 스킬 고르기
#
# 브라우저 실습에서는 `builder.skills` 의 `Skill · SkillSet` 으로 스킬 선택 · 프롬프트 조립을 **모의 LLM** 과 함께 돌려 보았습니다.
# 이 노트북에서는 다음을 합니다.
#
# 1. agentBuilder 저장소를 받아 `builder.skills` 와 내보낸 코드의 `skills_apply()` 를 그대로 사용
# 2. `%%writefile` 로 **진짜 스킬 폴더**(`SKILL.md` + `references/`)를 만들고 **zip** 으로 묶기 (claude.ai 업로드용)
# 3. **실제 Gemini 모델**로 LLM 선택(`mode='llm'`)을 돌리고 키워드 선택과 정확도 비교
# 4. 스킬이 켜진 에이전트를 실제 모델로 실행 — 지시문의 형식이 정말 지켜지는지 확인
# 5. (선택) Claude Skills API 업로드 · `container.skills` 호출 (ANTHROPIC_API_KEY 가 있을 때만)
#
# 준비물: Google AI Studio 무료 키 → Colab 왼쪽 🔑 **Secrets** 에 `GEMINI_API_KEY` 로 저장 (00차시 참고)

# %% [markdown]
# ## 0. 설치: agentBuilder 저장소(순수 파이썬 엔진) 받기
# `builder.skills` 는 외부 패키지가 없는 순수 파이썬이라 pip 설치 없이 저장소만 받으면 됩니다. `agentlab` 도 함께 들어 있습니다.

# %%
import os, sys
if not os.path.exists('agentBuilder'):
    os.system('git clone -q --depth 1 https://github.com/samcho93/agentBuilder')
sys.path.insert(0, 'agentBuilder/py')

import agentlab as al
from builder.skills import Skill, SkillSet, HELPER
print('builder.skills 준비 완료 · agentlab', al.__name__)

# %%
from google.colab import userdata
GEMINI_API_KEY = userdata.get('GEMINI_API_KEY')
llm = al.LLM('gemini', model='gemini-2.5-flash', api_key=GEMINI_API_KEY)
print(llm.ask('한 줄로 자기소개 해줘'))

# %% [markdown]
# ## 1. 스킬 폴더를 진짜 파일로 만들기
# 브라우저에서는 문자열이었던 SKILL.md 를 실제 폴더 구조로 씁니다. 공식 규칙(문서 기준 2026-10): `name` 은 64자 이하 소문자 · 숫자 · 하이픈, `description` 은 1024자 이하 · 비어 있으면 안 됨.
# `keywords` 는 우리 미니 구현만 읽는 확장 항목입니다 (공식 플랫폼은 무시).

# %%
import os

FILES = {
    'skills/report-writer/SKILL.md': '''---
name: report-writer
description: 보고서 · 요약문 · 리포트 작성 요청에 사용한다. "보고서 써줘", "정리해서 문서로 만들어줘" 같은 요청.
keywords: 보고서, 요약, 리포트, 문서, 실적
---

# 보고서 작성

## 절차
1. 제목 · 요약(3줄) · 본문 · 다음 행동 순서로 쓴다.
2. 숫자는 표로 정리하고 출처를 적는다.
3. 전문 용어는 처음 나올 때 풀어 쓴다.

## 형식 · 톤
- 톤과 문단 길이는 [references/tone.md](references/tone.md) 를 따른다.
''',
    'skills/report-writer/references/tone.md': '간결한 경어체. 한 문단은 4문장 이내. 숫자는 천 단위 쉼표, 비율은 소수점 1자리.
',
    'skills/data-cleaner/SKILL.md': '''---
name: data-cleaner
description: 숫자 데이터 정리 · 합계 · 평균 · 증감률 계산 요청에 사용한다
keywords: 데이터, 합계, 평균, 증감, 매출, 숫자
---

# 데이터 정리
1. 숫자를 표로 정리한다 (항목 | 값).
2. 합계 · 평균 · 전월 대비 증감률은 반드시 계산기 도구로 계산한다.
3. 계산 근거(식)를 함께 적는다.
''',
    'skills/meeting-notes/SKILL.md': '''---
name: meeting-notes
description: 회의록 · 회의 내용 정리 요청에 사용. 결정 사항 · 할 일 · 담당자를 표로 정리한다
keywords: 회의, 회의록, 미팅, 액션 아이템
---

# 회의록 정리
1. 먼저 결정 사항을 번호 목록으로 쓴다.
2. 할 일(Action Item)은 표로: | 할 일 | 담당자 | 기한 |
3. 마지막에 다음 회의 안건을 한 줄로 제안한다.
''',
}
for path, text in FILES.items():          # (%%writefile 매직으로 한 셀에 한 파일씩 써도 같다)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(text)
    print('📄', path, len(text), '자')

# %%
!find skills -type f | sort

# %% [markdown]
# ### 폴더 → Skill 객체
# `references/` 의 파일은 `resources` 로 넣어 두면 스킬이 켜질 때 지시문 뒤에 붙습니다 (3단계 자료의 미니 버전).

# %%
import glob

def load_skill(folder, tools=None):
    """skills/<이름>/ 폴더 → Skill (SKILL.md + references/*)"""
    s = Skill.from_md(open(f'{folder}/SKILL.md', encoding='utf-8').read(), tools=tools)
    for p in glob.glob(f'{folder}/references/*'):
        s.resources[os.path.basename(p)] = open(p, encoding='utf-8').read()
    return s

report = load_skill('skills/report-writer')
cleaner = load_skill('skills/data-cleaner', tools=[al.calculator])
meeting = load_skill('skills/meeting-notes')
ss = SkillSet([report, cleaner, meeting])
for s in ss:
    print(s.describe())
print()
print(ss.catalog())          # 1단계: 항상 프롬프트에 들어가는 목록

# %% [markdown]
# ## 2. zip 으로 묶기 — claude.ai · Skills API 업로드 형식
# claude.ai 는 설정 › 기능에서 **스킬 폴더 zip** 을 업로드합니다. zip 안에 `<이름>/SKILL.md` 가 있으면 됩니다 (문서 기준 2026-10). 왼쪽 📁 파일 탭에서 내려받을 수 있습니다.

# %%
import shutil
for name in ['report-writer', 'data-cleaner', 'meeting-notes']:
    path = shutil.make_archive(f'{name}_skill', 'zip', root_dir='skills', base_dir=name)
    print(path, os.path.getsize(path), 'bytes')

# %% [markdown]
# ## 3. 키워드 선택 vs 실제 LLM 선택
# 브라우저에서는 모의 LLM 이 의미를 몰라 `mock_responses` 로 라우터 답을 정해 주었습니다. 여기서는 **실제 Gemini** 가 1단계 목록만 보고 스킬을 고릅니다.
# 키워드에 없는 표현("분기 실적 문서")도 의미로 골라내는지 보세요.

# %%
tasks = ['이번 분기 매출 보고서 써줘',
         '분기 실적을 정리한 문서가 필요해',          # 키워드에 '문서 · 실적' 이 있어 둘 다 맞출 것
         '지난주 팀 모임에서 정한 것들 정리해 줄래?',   # '회의' 라는 단어가 없다 → LLM 만 맞출 것
         '세 달 매출을 더하면 얼마야? 120, 135, 150',
         '오늘 날씨 어때?']
for q in tasks:
    kw = [s.name for s in ss.select(q, mode='keyword')]
    lm = [s.name for s in ss.select(q, llm=llm, mode='llm')]
    print(f'{q:<30} 키워드 {kw!s:<35} LLM {lm}')
print('LLM 호출:', llm.calls, '회')

# %% [markdown]
# ### 내보낸 코드의 `skills_apply()` 그대로 써 보기
# agentBuilder 가 내보내는 파이썬 코드는 `SkillSet` 대신 독립 함수 `skills_apply()` 를 씁니다 (한 파일로 돌아가도록 도우미가 코드 안에 복사됨).
# `builder.skills.HELPER` 가 바로 그 소스 문자열이므로 `exec` 로 불러와 같은 결과가 나오는지 확인합니다.

# %%
import re
ns = {'re': re, 'al': al}
exec(HELPER, ns)                      # 내보낸 코드와 동일한 Skill(간단 버전) · skills_apply() 정의
skills_apply = ns['skills_apply']     # (별도 이름 공간에 두어 builder.skills.Skill 을 덮어쓰지 않는다)

system, tools, chosen = skills_apply(list(ss), '지난주 팀 모임에서 정한 것들 정리해 줄래?',
                                     base_system='당신은 비서입니다.', llm=llm, mode='llm')
print('도구:', [t.name for t in tools])
print(system)

# %% [markdown]
# ## 4. 스킬 선택 정확도 평가 — 키워드 vs LLM
# (작업 → 기대 스킬 또는 None) 테스트 세트로 두 방식의 정확도를 잽니다. LLM 은 호출마다 2~5초 걸립니다.

# %%
TESTS = [
    ('이번 분기 매출 보고서 써줘', 'report-writer'),
    ('120 + 135 합계 구해줘', 'data-cleaner'),
    ('어제 회의 내용 정리해줘', 'meeting-notes'),
    ('분기 실적을 정리한 문서가 필요해', 'report-writer'),
    ('지난주 팀 모임에서 정한 것들 정리해 줄래?', 'meeting-notes'),
    ('세 달 매출을 더하면 얼마야? 120, 135, 150', 'data-cleaner'),
    ('오늘 날씨 어때?', None),
    ('안녕, 넌 누구니?', None),
]

def evaluate(ss, tests, mode, llm=None):
    ok = 0
    for q, want in tests:
        got = [s.name for s in ss.select(q, llm=llm, mode=mode)]
        hit = (want in got) if want else (not got)
        ok += hit
        print('  ', '✅' if hit else '❌', f'{q:<32} → {got} / 기대 {want}')
    print(f'   [{mode}] 정확도 {ok}/{len(tests)} = {ok / len(tests):.0%}\n')
    return ok

evaluate(ss, TESTS, 'keyword')
evaluate(ss, TESTS, 'llm', llm=llm)

# %% [markdown]
# ## 5. 스킬이 켜진 에이전트를 실제 모델로 실행
# 브라우저의 모의 LLM 은 지시문 형식을 따르지 못했습니다. 실제 모델은 **활성화된 스킬의 지시문대로** 제목 · 요약 · 표 · 다음 행동을 씁니다.

# %%
BASE = '당신은 비서입니다. 활성화된 스킬의 지시를 그대로 따릅니다.'

def assistant(task, mode='auto'):
    system, tools, chosen = ss.apply(task, base_system=BASE, llm=llm, mode=mode, log=print)
    agent = al.Agent(llm, tools=tools, system=system, verbose=True)
    return agent.run(task)

print(assistant('이번 분기 매출(1월 120, 2월 135, 3월 150)을 정리해서 보고서 초안을 써줘'))

# %%
print(assistant('어제 회의 내용 정리해줘: 예산 승인됨. 김대리가 금요일까지 견적서 작성. 다음 주 월요일에 다시 모이기로 함.'))

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 나만의 스킬 폴더 만들기
# `skills/<이름>/SKILL.md` 를 하나 더 만드세요 (예: `translator`, `email-writer`, `code-reviewer`). description 에는 **무엇을 + 언제 + 사용자가 말할 표현**을 넣습니다.
# `load_skill()` 로 읽어 `ss` 에 추가하고, 그 스킬이 골라져야 하는 작업 2개와 골라지면 안 되는 작업 1개로 `select(..., llm=llm, mode='llm')` 을 확인하세요.

# %%
# 힌트: FILES 처럼 open().write() 로 쓰거나, 셀 맨 위에 %%writefile skills/translator/SKILL.md 매직을 써도 됩니다.
# BEGIN SOLUTION
os.makedirs('skills/translator', exist_ok=True)
open('skills/translator/SKILL.md', 'w', encoding='utf-8').write('''---
name: translator
description: 한국어 ↔ 영어 번역 요청에 사용. "영어로 번역해줘", "한국어로 옮겨줘" 같은 요청
keywords: 번역, 영어로, 한국어로, translate
---
# 번역
1. 원문의 뜻을 바꾸지 않고 자연스러운 문장으로 옮긴다.
2. 고유명사는 원어를 괄호에 함께 적는다.
3. 번역문만 출력한다.
''')
translator = load_skill('skills/translator')
ss2 = SkillSet(list(ss) + [translator])
for q in ['다음 문장을 영어로 번역해줘: 스킬은 재사용 가능한 능력이다', 'Put this in Korean: progressive disclosure', '매출 합계 구해줘']:
    print(q, '→', ss2.select(q, llm=llm, mode='llm'))
# END SOLUTION

# %% [markdown]
# ### 문제 2. description 만 바꿔 정확도 올리기
# 4번의 `TESTS` 에 여러분이 생각하는 **까다로운 작업 문장 3개**를 추가하세요 (키워드에 없는 표현으로). `evaluate(..., 'llm')` 을 돌려 틀린 항목을 찾고,
# **지시문은 건드리지 말고 description 만** 고쳐서(파일을 다시 쓰고 `load_skill`) 정확도가 오르는지 확인하세요. 선택은 1단계 정보(description)로만 결정된다는 것을 체감하는 문제입니다.

# %%
# BEGIN SOLUTION
HARD = TESTS + [
    ('숫자들 월별로 표 만들고 변화율도 알려줘', 'data-cleaner'),
    ('오늘 스탠드업에서 나온 할 일 목록 뽑아줘', 'meeting-notes'),
    ('임원진에게 보낼 한 장짜리 요약 자료', 'report-writer'),
]
before = evaluate(ss, HARD, 'llm', llm=llm)

md = open('skills/meeting-notes/SKILL.md', encoding='utf-8').read()
md = md.replace('description: 회의록 · 회의 내용 정리 요청에 사용.',
                'description: 회의록 · 회의 · 미팅 · 스탠드업 내용 정리와 할 일(액션 아이템) 추출 요청에 사용.')
open('skills/meeting-notes/SKILL.md', 'w', encoding='utf-8').write(md)
ss = SkillSet([report, cleaner, load_skill('skills/meeting-notes')])
after = evaluate(ss, HARD, 'llm', llm=llm)
print('보강 전', before, '→ 보강 후', after)
# END SOLUTION

# %% [markdown] teacher
# 문제 2 는 "지시문이 아니라 description 이 선택을 결정한다"는 오개념 교정용입니다. 학생이 지시문을 고치고 정확도가 그대로인 것을 본 뒤 description 을 고치게 유도하세요.
# 실제 모델은 호출마다 2~5초이므로 TESTS 11개 × 2회 = 1분 안팎 걸립니다. LLM 선택은 결정적이지 않아 실행마다 1~2개가 바뀔 수 있다는 점도 말해 주세요 (온도 0 이어도 완전히 같지는 않음).

# %% [markdown]
# ### 문제 3. (선택 · 도전) Claude Skills API 에 올리고 container.skills 로 호출하기
# Anthropic API 키(`ANTHROPIC_API_KEY`)가 Colab Secrets 에 있을 때만 실행하세요. 문서 기준 2026-10 — 모델 이름 · 도구 버전 문자열은 [공식 문서](https://platform.claude.com/docs/en/build-with-claude/skills-guide)에서 확인하세요.
# API 의 스킬은 **코드 실행 도구**가 켜진 샌드박스 컨테이너 안의 파일로 동작합니다. 업로드한 커스텀 스킬은 워크스페이스 전체가 공유하고, 요청당 최대 20개입니다.

# %%
# !pip -q install anthropic
# import anthropic
# from anthropic.lib import files_from_dir
#
# client = anthropic.Anthropic(api_key=userdata.get('ANTHROPIC_API_KEY'))
#
# # 1) 커스텀 스킬 업로드 (폴더 루트에 SKILL.md 가 있어야 함, 30MB 미만)
# skill = client.skills.create(files=files_from_dir('skills/report-writer'))
# print('skill_id:', skill.id, '/ version:', skill.latest_version_id)
#
# # 2) container.skills 에 지정 + 코드 실행 도구 (필수)
# response = client.messages.create(
#     model='claude-opus-5-5',
#     max_tokens=2048,
#     container={'skills': [
#         {'type': 'custom', 'skill_id': skill.id, 'version': 'latest'},
#         {'type': 'anthropic', 'skill_id': 'xlsx', 'version': 'latest'},   # 사전 제공 스킬
#     ]},
#     tools=[{'type': 'code_execution_20250825', 'name': 'code_execution'}],
#     messages=[{'role': 'user', 'content': '3월 매출 150, 2월 135 — 보고서와 엑셀 표를 만들어줘'}],
# )
# for block in response.content:
#     if getattr(block, 'text', None):
#         print(block.text)

# %% [markdown]
# ---
# ## 📝 정리
# - 스킬 = **SKILL.md**(name · description · 지시문) + references/ + scripts/ 를 담은 **폴더**. zip 으로 묶으면 claude.ai · Skills API 에 올리는 형식이 된다.
# - **점진적 로딩**: 1단계 목록(항상) → 2단계 지시문(선택 시) → 3단계 자료 · 스크립트(필요 시). 선택의 근거는 **description** 뿐이다.
# - 키워드 선택은 비용 0 · 결정적이지만 표현을 놓치고, LLM 선택은 의미로 고르지만 비용이 들고 흔들린다 — **테스트 세트**로 재면서 description 을 다듬는다.
# - 실제 모델은 활성화된 스킬의 지시문 형식(제목 · 표 · 할 일 목록)을 그대로 따른다. 모의 LLM 과의 차이를 눈으로 확인했다.
# - Claude Code(`.claude/skills/`) · claude.ai(zip) · Messages API(`container.skills` + 코드 실행) · Managed Agents(`skills` 배열) · agentBuilder(스킬 노드) — 형식은 하나, 자동 동기화는 없다.
