# %% [markdown]
# # 02. LLM API 다루기 — 메시지 · 시스템 프롬프트 · 토큰 · 구조화 출력
#
# 브라우저 실습에서 `agentlab` 이 감춰 주던 **공급자별 요청 형식**을 실제 SDK 로 직접 다뤄 봅니다.
#
# **메시지 역할 → 시스템 프롬프트 → temperature → 토큰과 비용 → 멀티턴 → JSON 모드 · 스키마 → 재시도**
#
# 사용 SDK: `google-genai`(Gemini) 와 `openai`(OpenAI 호환: Groq · OpenRouter · OpenAI). 키가 하나뿐이면 그 공급자 셀만 실행해도 됩니다.

# %%
!pip -q install google-genai openai

# %%
import json
from google.colab import userdata
from google import genai
from google.genai import types
from openai import OpenAI

gem = genai.Client(api_key=userdata.get("GEMINI_API_KEY"))
GEM_MODEL = "gemini-2.5-flash"

oai = OpenAI(api_key=userdata.get("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")   # OpenAI 호환 (Groq)
OAI_MODEL = "llama-3.3-70b-versatile"
print("준비 완료")

# %% [markdown]
# ## 1. 메시지 역할과 시스템 프롬프트 — 두 SDK 비교
# 같은 대화를 보내는데, **시스템 프롬프트의 위치**와 **역할 이름**이 다릅니다.
# - OpenAI 호환: `messages` 안에 `role: system` / `assistant`
# - Gemini: `system_instruction` 은 config 에 따로, 모델 역할은 `model`

# %%
SYSTEM = "당신은 요리 전문가입니다. 세 문장 이내로 답합니다."
QUESTION = "김치찌개 맛있게 끓이는 비법이 뭐야?"

# OpenAI 호환
r = oai.chat.completions.create(
    model=OAI_MODEL, temperature=0,
    messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": QUESTION}])
print("[OpenAI 호환]", r.choices[0].message.content)
print()
# Gemini
r = gem.models.generate_content(
    model=GEM_MODEL, contents=QUESTION,
    config=types.GenerateContentConfig(system_instruction=SYSTEM, temperature=0))
print("[Gemini]", r.text)

# %% [markdown]
# ## 2. 시스템 프롬프트 바꿔 보기
# 역할 · 말투 · 길이 지시를 바꾸면 같은 질문의 답이 어떻게 달라지는지 확인합니다.

# %%
for s in ["당신은 요리 전문가입니다.",
          "당신은 요리 전문가입니다. 간결하게 한 문장으로 답합니다.",
          "당신은 초등학생에게 쉽게 설명하는 선생님입니다. 반말로 답합니다."]:
    r = gem.models.generate_content(model=GEM_MODEL, contents=QUESTION,
                                    config=types.GenerateContentConfig(system_instruction=s, temperature=0, max_output_tokens=150))
    print("system:", s)
    print("  →", r.text.strip()[:120].replace("\n", " "))
    print()

# %% [markdown]
# ## 3. temperature — 같은 질문을 5번
# `temperature=0` 은 거의 항상 같은 답, `1.0` 은 매번 다른 답이 나옵니다. 분류 · 도구 선택 · JSON 에는 0 을 씁니다.

# %%
q = "에이전트를 한 단어로 표현하면? 단어만 답해."
for t in [0.0, 1.0]:
    answers = []
    for _ in range(5):
        r = gem.models.generate_content(model=GEM_MODEL, contents=q,
                                        config=types.GenerateContentConfig(temperature=t, max_output_tokens=20))
        answers.append(r.text.strip())
    print(f"temperature={t}: {answers}")

# %% [markdown]
# ## 4. 토큰과 비용
# 응답의 사용량 필드 이름이 공급자마다 다릅니다: Gemini `usage_metadata.prompt_token_count`, OpenAI 호환 `usage.prompt_tokens`.

# %%
PRICE = {"gemini-2.5-flash": (0.30, 2.50), "llama-3.3-70b-versatile": (0.59, 0.79)}   # 100만 토큰당 달러 (예시값)

def cost(model, tokens_in, tokens_out):
    pin, pout = PRICE[model]
    return tokens_in / 1e6 * pin + tokens_out / 1e6 * pout

r = gem.models.generate_content(model=GEM_MODEL, contents="에이전트가 뭐야?")
u = r.usage_metadata
print(f"[Gemini] 입력 {u.prompt_token_count} 출력 {u.candidates_token_count} → {cost(GEM_MODEL, u.prompt_token_count, u.candidates_token_count):.6f} 달러")

r = oai.chat.completions.create(model=OAI_MODEL, messages=[{"role": "user", "content": "에이전트가 뭐야?"}])
u = r.usage
print(f"[Groq]   입력 {u.prompt_tokens} 출력 {u.completion_tokens} → {cost(OAI_MODEL, u.prompt_tokens, u.completion_tokens):.6f} 달러")

# %% [markdown]
# ## 5. 멀티턴 대화 — 기록을 누적하기
# 모델은 상태가 없으므로 이전 질문과 답을 **매번 함께** 보내야 합니다. 턴이 늘수록 입력 토큰이 늘어나는 것도 확인하세요.

# %%
messages = [{"role": "system", "content": "당신은 친절한 비서입니다. 짧게 답합니다."}]
for turn in ["내 이름은 영준이야.", "내가 좋아하는 색은 파랑이야.", "내 이름과 좋아하는 색을 말해 봐."]:
    messages.append({"role": "user", "content": turn})
    r = oai.chat.completions.create(model=OAI_MODEL, messages=messages, temperature=0)
    answer = r.choices[0].message.content
    messages.append({"role": "assistant", "content": answer})        # 답도 기록에 추가
    print("👤", turn)
    print("🤖", answer, f"(입력 토큰 {r.usage.prompt_tokens})")
print("메시지 수:", len(messages))

# %% [markdown] teacher
# 마지막 턴에서 `messages` 를 `[messages[0], messages[-1]]` 로 바꿔 다시 호출하면 모델이 이름을 모릅니다.
# "기억은 모델이 아니라 우리가 보내는 기록에 있다" 를 보여 주는 가장 빠른 방법입니다.

# %% [markdown]
# ## 6. 구조화 출력 ① — JSON 모드
# 답을 **프로그램이 쓸 수 있는 형식**으로 받습니다. OpenAI 호환은 `response_format`, Gemini 는 `response_mime_type`.

# %%
SENT_SYSTEM = '리뷰의 감성을 분석해 JSON 으로만 답하라. 형식: {"sentiment": "positive|negative|neutral", "confidence": 0~1}'
reviews = ["배송이 빠르고 품질도 좋아요. 추천합니다!", "배터리가 하루도 못 가요. 실망했습니다.", "그냥 평범한 제품이에요."]

for text in reviews:
    r = oai.chat.completions.create(
        model=OAI_MODEL, temperature=0, response_format={"type": "json_object"},
        messages=[{"role": "system", "content": SENT_SYSTEM}, {"role": "user", "content": text}])
    d = json.loads(r.choices[0].message.content)           # 문자열 → dict
    mark = "🚨" if d["sentiment"] == "negative" else "  "
    print(f"{mark} {d['sentiment']:<9} ({d.get('confidence', 0):.2f})  {text}")

# %% [markdown]
# ## 7. 구조화 출력 ② — 스키마로 형식 강제 (Gemini)
# pydantic 클래스로 원하는 구조를 선언하면 Gemini 가 **그 구조의 JSON 만** 돌려주고, `r.parsed` 로 객체까지 만들어 줍니다.
# 재시도가 거의 필요 없는 가장 확실한 방법입니다.

# %%
from pydantic import BaseModel
from typing import Optional

class Contact(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]

texts = ["저는 김영준입니다. 연락은 yj.kim@example.com 또는 010-1234-5678 로 주세요.",
         "담당자는 박지민님이고 이메일은 jimin@school.kr 입니다."]
for t in texts:
    r = gem.models.generate_content(
        model=GEM_MODEL, contents=f"다음 문장에서 이름, 이메일, 전화번호를 추출하라. 없는 항목은 null.\n문장: {t}",
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=Contact, temperature=0))
    print(r.parsed)                 # Contact(name=..., email=..., phone=...)

# %% [markdown]
# ## 8. 재시도 패턴
# JSON 모드가 없거나(프롬프트만으로 지시할 때) 모델이 울타리 · 잡담을 섞으면 파싱이 실패할 수 있습니다.
# 실패 내용을 알려 주며 다시 요청하고, 상한을 넘기면 기본값을 씁니다.

# %%
import re

def parse_json(text):
    """```json 울타리와 앞뒤 문장을 허용하는 파서"""
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    s = m.group(1) if m else text
    start = s.find("{")
    end = s.rfind("}")
    if start < 0 or end < 0:
        raise ValueError("JSON 을 찾지 못했습니다: " + text[:60])
    return json.loads(s[start:end + 1])

def ask_json(messages, retries=3):
    msgs = list(messages)
    for attempt in range(1, retries + 1):
        r = oai.chat.completions.create(model=OAI_MODEL, messages=msgs, temperature=0)   # 일부러 JSON 모드 없이
        content = r.choices[0].message.content
        try:
            return parse_json(content)
        except (ValueError, json.JSONDecodeError) as e:
            print(f"  ⚠ {attempt}번째 실패: {str(e)[:60]}")
            msgs.append({"role": "assistant", "content": content})
            msgs.append({"role": "user", "content": "JSON 만 출력해라. 설명이나 코드 울타리를 붙이지 마라."})
    return None

d = ask_json([{"role": "system", "content": SENT_SYSTEM}, {"role": "user", "content": "정말 최고의 수업이었어요"}])
print("결과:", d or {"sentiment": "unknown"})

# %% [markdown]
# ## 9. (선택) LangChain 맛보기 — `prompt | llm | parser`
# 브라우저의 `al.PromptTemplate | llm | al.JsonOutputParser()` 와 같은 문법입니다. 07차시에서 본격적으로 다룹니다.

# %%
!pip -q install langchain-core langchain-google-genai

# %%
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model=GEM_MODEL, google_api_key=userdata.get("GEMINI_API_KEY"), temperature=0)
prompt = PromptTemplate.from_template(
    '다음 리뷰의 감성을 JSON {{"sentiment": "positive|negative|neutral", "confidence": 0~1}} 로만 답하라.\n리뷰: {review}')
chain = prompt | llm | JsonOutputParser()
for review in ["화면이 선명하고 배터리도 오래 가요. 최고!", "소리가 자꾸 끊겨서 별로예요."]:
    print(chain.invoke({"review": review}), "←", review)

# %% [markdown]
# ---
# # ✏️ 실습 문제
#
# ### 문제 1. 리뷰 10개 일괄 분류 → 표
# 아래 리뷰 10개를 JSON 모드로 분류하고 pandas DataFrame(열: review, sentiment, confidence)으로 만든 뒤 라벨별 개수를 출력하세요.

# %%
import pandas as pd

reviews10 = ["가격 대비 만족합니다", "포장이 찢어져서 왔어요", "그냥 보통이에요", "디자인이 훌륭하고 배송도 빨라요",
             "한 달 만에 고장났어요", "친구에게 추천했어요", "설명서가 없어서 불편했어요", "색상이 사진과 같아요",
             "환불 절차가 너무 복잡해요", "두 번째 구매입니다"]
rows = []
# BEGIN SOLUTION
for text in reviews10:
    r = oai.chat.completions.create(model=OAI_MODEL, temperature=0, response_format={"type": "json_object"},
                                    messages=[{"role": "system", "content": SENT_SYSTEM}, {"role": "user", "content": text}])
    d = json.loads(r.choices[0].message.content)
    rows.append({"review": text, "sentiment": d["sentiment"], "confidence": d.get("confidence")})
df = pd.DataFrame(rows)
print(df["sentiment"].value_counts())
df
# END SOLUTION

# %% [markdown]
# ### 문제 2. 뉴스 제목에서 정보 추출
# `Contact` 처럼 `News(company, event, date)` 스키마를 만들고, 제목 3개에서 **회사명 · 사건 종류 · 날짜**를 추출하세요. 없는 값은 null.

# %%
titles = ["삼성전자, 10월 7일 신형 폴더블폰 공개", "카카오 3분기 실적 발표… 영업이익 20% 증가", "현대차, 미국 공장 증설 계획 철회"]
# BEGIN SOLUTION
class News(BaseModel):
    company: Optional[str]
    event: Optional[str]
    date: Optional[str]

for t in titles:
    r = gem.models.generate_content(
        model=GEM_MODEL, contents=f"다음 뉴스 제목에서 회사명, 사건 종류, 날짜를 추출하라. 없는 값은 null.\n제목: {t}",
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=News, temperature=0))
    print(r.parsed)
# END SOLUTION

# %% [markdown]
# ### 문제 3. 비용 추적 멀티턴
# 5절의 멀티턴 루프에 턴마다 **그 호출의 비용**과 **누적 비용**을 출력하는 코드를 추가하세요. (단가는 `PRICE` 사용)

# %%
messages = [{"role": "system", "content": "당신은 친절한 비서입니다. 짧게 답합니다."}]
total = 0.0
for turn in ["내 이름은 영준이야.", "내가 좋아하는 색은 파랑이야.", "내 이름과 좋아하는 색을 말해 봐."]:
    messages.append({"role": "user", "content": turn})
    r = oai.chat.completions.create(model=OAI_MODEL, messages=messages, temperature=0)
    messages.append({"role": "assistant", "content": r.choices[0].message.content})
    # BEGIN SOLUTION
    c = cost(OAI_MODEL, r.usage.prompt_tokens, r.usage.completion_tokens)
    total += c
    print(f"입력 {r.usage.prompt_tokens:>4} 출력 {r.usage.completion_tokens:>4} | 이번 {c:.7f} 누적 {total:.7f} 달러")
    # END SOLUTION

# %% [markdown] teacher
# 문제 1 에서 모델이 `confidence` 키를 빠뜨리거나 문자열로 주는 경우가 있습니다. `d.get()` 으로 안전하게 읽는 습관을 강조하세요.
# 문제 2 는 "사건 종류" 가 모호하므로 모델마다 답이 다릅니다 → 프롬프트에 후보(제품 공개 · 실적 발표 · 투자 · 철회 …)를 주면 일관성이 올라간다는 것을 보여 주기 좋습니다.

# %% [markdown]
# ---
# ## 📝 정리
# - 메시지 = `role` + `content` 의 목록. system / user / assistant / tool.
# - 시스템 프롬프트 위치, 역할 이름, 사용량 필드 이름이 공급자마다 다르다 → agentlab · LangChain 이 변환을 대신한다.
# - `temperature=0` 은 재현성, 높으면 다양성. 분류 · 추출 · 도구 선택은 0.
# - 비용 = 입력 토큰 × 단가 + 출력 토큰 × 단가. 멀티턴은 기록을 전부 다시 보내므로 입력이 누적된다.
# - 구조화 출력: JSON 모드(`response_format` / `response_mime_type`) → 스키마(pydantic)가 가장 확실 → 그래도 파서 + 재시도.
