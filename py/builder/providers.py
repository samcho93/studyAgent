"""LLM 공급자 표 — 무료 · 유료 · 로컬 모델을 한 가지 방법(agentlab.LLM)으로 호출한다

agentlab 은 gemini · anthropic 네이티브 API 와 OpenAI 호환 API(openai · groq · openrouter · ollama)를 지원한다.
그 밖의 공급자(Mistral · Cerebras · Together · DeepSeek · xAI · Hugging Face · LM Studio · 사용자 정의)는
모두 **OpenAI 호환 API** 이므로 provider='openai' + base_url 로 호출한다 (키가 없는 로컬 서버는 provider='ollama' 경로).

    llm = make_llm('groq', model='llama-3.3-70b-versatile', api_key='...')
"""
import os

PROVIDERS = [
    # id, 표시 이름, agentlab provider, base_url, 키 환경변수, 기본 모델, 무료?, 키 발급 주소, 설명, 모델 후보
    {'id': 'mock', 'label': '모의 LLM (키 없음)', 'al': 'mock', 'url': '', 'env': '', 'model': 'mock-1', 'free': True, 'signup': '',
     'note': '규칙 기반으로 항상 같은 답. 키가 없어도 모든 예제가 동작한다 — 그래프 구조를 먼저 검증할 때 사용.',
     'models': ['mock-1']},
    {'id': 'gemini', 'label': 'Google Gemini', 'al': 'gemini', 'url': 'https://generativelanguage.googleapis.com/v1beta', 'env': 'GEMINI_API_KEY',
     'model': 'gemini-2.5-flash', 'free': True, 'signup': 'https://aistudio.google.com/apikey',
     'note': 'Google AI Studio 에서 무료 키 발급. 분당 요청 한도가 있지만 학습용으로 충분.',
     'models': ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash']},
    {'id': 'groq', 'label': 'Groq', 'al': 'groq', 'url': 'https://api.groq.com/openai/v1', 'env': 'GROQ_API_KEY',
     'model': 'llama-3.3-70b-versatile', 'free': True, 'signup': 'https://console.groq.com/keys',
     'note': 'Llama · Qwen · Gemma 등 오픈소스 모델을 무료 등급으로 매우 빠르게 실행.',
     'models': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct']},
    {'id': 'openrouter', 'label': 'OpenRouter', 'al': 'openrouter', 'url': 'https://openrouter.ai/api/v1', 'env': 'OPENROUTER_API_KEY',
     'model': 'meta-llama/llama-3.3-70b-instruct:free', 'free': True, 'signup': 'https://openrouter.ai/keys',
     'note': '여러 공급자의 모델을 한 키로. 이름 끝에 ":free" 가 붙은 모델은 무료.',
     'models': ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-3-27b-it:free', 'deepseek/deepseek-chat-v3-0324:free', 'qwen/qwen3-235b-a22b:free', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4']},
    {'id': 'cerebras', 'label': 'Cerebras', 'al': 'openai', 'url': 'https://api.cerebras.ai/v1', 'env': 'CEREBRAS_API_KEY',
     'model': 'llama-3.3-70b', 'free': True, 'signup': 'https://cloud.cerebras.ai/',
     'note': '초고속 추론 칩. 무료 등급(일일 토큰 한도) 제공.',
     'models': ['llama-3.3-70b', 'llama3.1-8b', 'gpt-oss-120b', 'qwen-3-32b']},
    {'id': 'mistral', 'label': 'Mistral AI', 'al': 'openai', 'url': 'https://api.mistral.ai/v1', 'env': 'MISTRAL_API_KEY',
     'model': 'mistral-small-latest', 'free': True, 'signup': 'https://console.mistral.ai/api-keys',
     'note': '무료 실험 등급(Experiment plan) 제공. 유럽 공급자.',
     'models': ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest', 'codestral-latest', 'open-mistral-nemo']},
    {'id': 'huggingface', 'label': 'Hugging Face (Inference)', 'al': 'openai', 'url': 'https://router.huggingface.co/v1', 'env': 'HF_TOKEN',
     'model': 'meta-llama/Llama-3.3-70B-Instruct', 'free': True, 'signup': 'https://huggingface.co/settings/tokens',
     'note': 'HF 토큰으로 Inference Providers 라우터 사용. 무료 월 크레딧 제공.',
     'models': ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'google/gemma-3-27b-it']},
    {'id': 'openai', 'label': 'OpenAI', 'al': 'openai', 'url': 'https://api.openai.com/v1', 'env': 'OPENAI_API_KEY',
     'model': 'gpt-4o-mini', 'free': False, 'signup': 'https://platform.openai.com/api-keys',
     'note': '유료 (선불 크레딧). gpt-4o-mini 가 저렴하고 빠르다.',
     'models': ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini', 'gpt-5']},
    {'id': 'anthropic', 'label': 'Anthropic Claude', 'al': 'anthropic', 'url': 'https://api.anthropic.com/v1', 'env': 'ANTHROPIC_API_KEY',
     'model': 'claude-haiku-4-5-20251001', 'free': False, 'signup': 'https://console.anthropic.com/settings/keys',
     'note': '유료. Haiku 4.5 가 저렴, Sonnet 5.5 · Opus 5.5 가 고성능.',
     'models': ['claude-haiku-4-5-20251001', 'claude-sonnet-5-5', 'claude-opus-5-5']},
    {'id': 'deepseek', 'label': 'DeepSeek', 'al': 'openai', 'url': 'https://api.deepseek.com/v1', 'env': 'DEEPSEEK_API_KEY',
     'model': 'deepseek-chat', 'free': False, 'signup': 'https://platform.deepseek.com/api_keys',
     'note': '유료지만 매우 저렴. deepseek-reasoner 는 추론 모델.',
     'models': ['deepseek-chat', 'deepseek-reasoner']},
    {'id': 'together', 'label': 'Together AI', 'al': 'openai', 'url': 'https://api.together.xyz/v1', 'env': 'TOGETHER_API_KEY',
     'model': 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'free': False, 'signup': 'https://api.together.ai/settings/api-keys',
     'note': '오픈소스 모델 호스팅. 가입 시 무료 크레딧.',
     'models': ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo', 'deepseek-ai/DeepSeek-V3']},
    {'id': 'xai', 'label': 'xAI Grok', 'al': 'openai', 'url': 'https://api.x.ai/v1', 'env': 'XAI_API_KEY',
     'model': 'grok-3-mini', 'free': False, 'signup': 'https://console.x.ai/',
     'note': '유료.', 'models': ['grok-3-mini', 'grok-3', 'grok-4']},
    {'id': 'ollama', 'label': 'Ollama (내 PC)', 'al': 'ollama', 'url': 'http://localhost:11434/v1', 'env': '',
     'model': 'llama3.2', 'free': True, 'signup': 'https://ollama.com/download',
     'note': '완전 무료 · 오프라인. 설치 후 `ollama pull llama3.2` → `ollama serve`. 키 불필요.',
     'models': ['llama3.2', 'llama3.1', 'qwen2.5', 'gemma3', 'mistral', 'phi4', 'deepseek-r1']},
    {'id': 'lmstudio', 'label': 'LM Studio (내 PC)', 'al': 'ollama', 'url': 'http://localhost:1234/v1', 'env': '',
     'model': 'local-model', 'free': True, 'signup': 'https://lmstudio.ai/',
     'note': 'LM Studio 의 로컬 서버(OpenAI 호환, 기본 포트 1234). 키 불필요.',
     'models': ['local-model']},
    {'id': 'custom', 'label': '사용자 정의 (OpenAI 호환)', 'al': 'openai', 'url': 'http://localhost:8000/v1', 'env': 'CUSTOM_LLM_API_KEY',
     'model': 'gpt-4o-mini', 'free': True, 'signup': '',
     'note': 'vLLM · LiteLLM · Azure 호환 게이트웨이 등 OpenAI 호환 주소를 직접 입력.',
     'models': []},
]
BY_ID = {p['id']: p for p in PROVIDERS}


def info(pid):
    return BY_ID.get(pid) or BY_ID['mock']


def make_llm(provider, model=None, api_key=None, base_url=None, temperature=0.0, max_tokens=1024, verbose=False):
    """공급자 id → agentlab.LLM. 키가 필요한데 없으면 ValueError"""
    import agentlab as al
    p = info(provider)
    if p['id'] == 'mock':
        return al.LLM('mock', temperature=temperature, max_tokens=max_tokens, verbose=verbose)
    url = base_url or p['url']
    al_provider = p['al']
    key = api_key or ''
    if p['env'] and not key:
        key = os.environ.get(p['env'], '')
    if p['env'] and not key and p['id'] != 'custom':
        raise ValueError(f"{p['label']} 의 API 키가 없습니다 — LLM 노드의 🔑 API 키 칸에 키를 저장하거나 환경 변수 {p['env']} 를 설정하세요.")
    if al_provider == 'openai' and not key:
        al_provider = 'ollama'   # 키 없는 OpenAI 호환 로컬 서버
    return al.LLM(al_provider, model=model or p['model'], api_key=key or None, base_url=url, temperature=temperature, max_tokens=max_tokens, verbose=verbose)


def public_table():
    """브라우저에 보낼 공급자 표 (키 값 없음)"""
    return [{k: v for k, v in p.items() if k != 'al'} for p in PROVIDERS]
