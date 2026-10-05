/* 🔑 LLM API 키 설정 (브라우저 세션에만 저장 — 탭을 닫으면 사라진다)
 * - 키는 sessionStorage 에만 둔다. localStorage · 서버 · 저장소에 절대 저장하지 않는다.
 * - 실행할 때마다 py-engine 이 AgentKeys.env() 를 워커로 보내고, 워커는 os.environ 에 넣는다.
 *   파이썬 쪽 agentlab 은 AGENTLAB_PROVIDER · *_API_KEY 환경 변수를 읽는다.
 */
(function () {
  'use strict';
  const KEY = 'agentlab.keys';
  const PROVIDERS = [
    { id: 'gemini', label: 'Google Gemini', env: 'GEMINI_API_KEY', model: 'gemini-2.5-flash', free: true,
      url: 'https://aistudio.google.com/apikey', note: 'Google AI Studio 에서 무료 키 발급. 분당 요청 한도가 있어 수업용으로 적당하다.' },
    { id: 'groq', label: 'Groq (오픈소스 모델)', env: 'GROQ_API_KEY', model: 'llama-3.3-70b-versatile', free: true,
      url: 'https://console.groq.com/keys', note: 'Llama · Qwen 등 오픈소스 모델을 무료 등급으로 아주 빠르게 실행.' },
    { id: 'openrouter', label: 'OpenRouter (무료 모델)', env: 'OPENROUTER_API_KEY', model: 'meta-llama/llama-3.3-70b-instruct:free', free: true,
      url: 'https://openrouter.ai/keys', note: '":free" 가 붙은 모델은 무료. 여러 공급자의 모델을 한 키로 사용.' },
    { id: 'openai', label: 'OpenAI', env: 'OPENAI_API_KEY', model: 'gpt-4o-mini', free: false,
      url: 'https://platform.openai.com/api-keys', note: '유료 (선불 크레딧 필요).' },
    { id: 'anthropic', label: 'Anthropic Claude', env: 'ANTHROPIC_API_KEY', model: 'claude-haiku-4-5-20251001', free: false,
      url: 'https://console.anthropic.com/settings/keys', note: '유료. 브라우저 직접 호출을 허용하는 헤더를 자동으로 붙인다.' },
    { id: 'ollama', label: 'Ollama (내 PC)', env: '', model: 'llama3.2', free: true,
      url: 'https://ollama.com/download', note: '설치 후 터미널에서 OLLAMA_ORIGINS=* ollama serve 로 실행하면 브라우저에서 접근된다. 키 불필요.' },
    { id: 'mock', label: '모의 LLM (키 없음)', env: '', model: 'mock-1', free: true,
      url: '', note: '규칙 기반으로 항상 같은 답을 돌려준다. 키가 없어도 모든 실습이 동작한다.' }
  ];

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function save(d) {
    try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 사생활 보호 모드 등 */ }
    update();
  }

  const K = {
    PROVIDERS,
    get: load,
    set: save,
    /** 파이썬 워커의 os.environ 에 넣을 값 */
    env() {
      const d = load();
      const env = {};
      const p = PROVIDERS.find((x) => x.id === d.provider);
      if (p) env.AGENTLAB_PROVIDER = p.id;
      if (d.model) env.AGENTLAB_MODEL = d.model;
      for (const q of PROVIDERS) if (q.env && d.keys && d.keys[q.id]) env[q.env] = d.keys[q.id];
      if (d.ollamaUrl) env.OLLAMA_URL = d.ollamaUrl;
      return env;
    },
    /** 현재 상태 한 줄 */
    summary() {
      const d = load();
      const p = PROVIDERS.find((x) => x.id === d.provider);
      const hasKey = p && (!p.env || (d.keys && d.keys[p.id]));
      if (!p || p.id === 'mock' || !hasKey) return { ok: false, text: '🔑 모의 LLM (키 없음)' };
      return { ok: true, text: `🔑 ${p.label} · ${d.model || p.model}` };
    },
    open: openModal
  };
  window.AgentKeys = K;

  // ------------------------------------------------------------------ UI
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function update() {
    const b = $('keysBtn');
    if (!b) return;
    const s = K.summary();
    b.classList.toggle('ok', s.ok);
    $('keysText').textContent = s.text;
  }

  function openModal() {
    const d = load();
    const cur = d.provider || 'mock';
    const keys = d.keys || {};
    const html = `
      <p class="muted" style="margin-top:0">키는 <b>이 브라우저 탭의 세션</b>에만 저장되고 탭을 닫으면 사라집니다. 서버나 저장소로 보내지 않습니다.
        키가 없으면 <b>모의 LLM</b>이 항상 같은 답을 돌려주므로 모든 실습이 그대로 동작합니다.</p>
      <div class="table-wrap"><table><tbody>
        <tr><th style="width:110px">공급자</th><td>
          <select id="kProvider" class="nav-search" style="margin:0;width:100%">${PROVIDERS.map((p) => `<option value="${p.id}"${p.id === cur ? ' selected' : ''}>${esc(p.label)}${p.free ? ' · 무료' : ' · 유료'}</option>`).join('')}</select>
          <div id="kNote" class="muted" style="margin-top:6px;font-size:.9em"></div></td></tr>
        <tr id="kKeyRow"><th>API 키</th><td><input id="kKey" type="password" class="nav-search" style="margin:0;width:100%" placeholder="발급받은 키를 붙여 넣으세요" autocomplete="off" spellcheck="false">
          <div class="muted" style="margin-top:6px;font-size:.9em"><a id="kLink" href="#" target="_blank" rel="noopener">키 발급 페이지 열기 ↗</a></div></td></tr>
        <tr id="kUrlRow"><th>Ollama 주소</th><td><input id="kUrl" type="text" class="nav-search" style="margin:0;width:100%" value="${esc(d.ollamaUrl || 'http://localhost:11434/v1')}"></td></tr>
        <tr><th>모델</th><td><input id="kModel" type="text" class="nav-search" style="margin:0;width:100%" placeholder="(비우면 기본 모델)" value="${esc(d.model || '')}" spellcheck="false"></td></tr>
      </tbody></table></div>
      <div class="meta-row">
        <button class="btn primary" id="kSave">저장</button>
        <button class="btn ghost" id="kTest">연결 테스트</button>
        <button class="btn ghost" id="kClear">모두 지우기</button>
        <span id="kMsg" class="muted"></span>
      </div>
      <details style="margin-top:10px"><summary>무료로 쓰는 방법</summary>
        <ul style="margin:8px 0 0 18px;line-height:1.7">
          <li><b>Gemini</b>: Google 계정 → AI Studio → Get API key. 무료 등급(분당 요청 제한)이면 수업에 충분합니다.</li>
          <li><b>Groq</b>: 가입 후 API Keys 에서 발급. Llama 3.3 70B 같은 오픈소스 모델을 무료로 빠르게 사용.</li>
          <li><b>OpenRouter</b>: 가입 후 Keys 발급. 모델 이름 끝에 <code>:free</code> 가 붙은 모델은 무료.</li>
          <li><b>Ollama</b>: 내 PC 에 설치해 완전 무료·오프라인. 터미널에서 <code>OLLAMA_ORIGINS=* ollama serve</code> 후 <code>ollama pull llama3.2</code>.</li>
        </ul></details>`;
    const modal = $('modal');
    $('modalTitle').textContent = '🔑 LLM API 키 설정';
    $('modalBody').innerHTML = html;
    modal.classList.remove('hidden');

    const sel = $('kProvider');
    const refresh = () => {
      const p = PROVIDERS.find((x) => x.id === sel.value);
      $('kNote').textContent = p.note;
      $('kKeyRow').style.display = p.env ? '' : 'none';
      $('kUrlRow').style.display = p.id === 'ollama' ? '' : 'none';
      $('kKey').value = keys[p.id] || '';
      $('kLink').href = p.url || '#';
      $('kLink').style.display = p.url ? '' : 'none';
      $('kModel').placeholder = `(비우면 ${p.model})`;
    };
    sel.onchange = refresh;
    refresh();
    const collect = () => {
      const p = PROVIDERS.find((x) => x.id === sel.value);
      const nd = { provider: p.id, keys: Object.assign({}, keys), model: $('kModel').value.trim(), ollamaUrl: $('kUrl').value.trim() };
      if (p.env) nd.keys[p.id] = $('kKey').value.trim();
      return nd;
    };
    $('kSave').onclick = () => { save(collect()); $('kMsg').textContent = '저장했습니다 (이 탭에서만 유효)'; };
    $('kClear').onclick = () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ } update(); openModal(); };
    $('kTest').onclick = () => {
      save(collect());
      modal.classList.add('hidden');
      if (window.PyApp && PyApp.runCode) {
        PyApp.runCode("import agentlab as al\nal.status()\nllm = al.LLM()\nprint('응답:', llm.ask('안녕하세요, 한 문장으로 인사해줘'))\nprint('토큰:', llm.total_usage)", { label: 'LLM 연결 테스트' });
      }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const foot = document.querySelector('.nav-foot');
    if (foot && !$('keysBtn')) {
      const b = document.createElement('button');
      b.id = 'keysBtn';
      b.className = 'server-badge keys-badge';
      b.title = 'LLM API 키 설정 (Gemini · Groq · OpenRouter · Ollama 무료)';
      b.innerHTML = '<span class="dot"></span><span id="keysText">🔑 모의 LLM (키 없음)</span>';
      b.onclick = openModal;
      foot.appendChild(b);
    }
    update();
  });
})();
