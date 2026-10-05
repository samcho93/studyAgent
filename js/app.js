/* 파이썬 웹 실습 강좌 — 메인 앱 (네비게이션 · 강좌 문서 · 에디터 · 진도 · 역할/보기 전환) */
(function () {
  const { esc, highlightLines, makeEditor } = window.JU;
  const { store } = window.Runner;
  const C = window.PY_COURSE;
  const $ = (id) => document.getElementById(id);
  const stripTags = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

  const app = {
    role: 'student',
    view: 'doc',
    route: { type: 'home' },
    done: new Set(),
    blockCodes: {},
    activeEditor: null
  };
  window.PyApp = app;

  // ================================================================== 초기화
  async function init() {
    applyTheme(store.get('jc.theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    try { JSON.parse(store.get('jc.done', '[]')).forEach((id) => app.done.add(id)); } catch (e) { /* 무시 */ }

    const q = new URLSearchParams(location.search);
    app.role = q.get('role') === 'teacher' ? 'teacher' : q.get('role') === 'student' ? 'student' : store.get('jc.role', 'student');
    app.viewPref = q.get('view');
    setRole(app.role, true);

    app.console = new Runner.Console($('consolePanel'));
    app.console.onJump = (line) => { if (app.activeEditor) app.activeEditor.jump(line); };
    setupEditor();
    app.deck = new Deck(app);
    setupLayout();
    setupServerBadge();
    bindUi();

    await loadLessons();
    buildNav();
    updateProgress();
    window.addEventListener('hashchange', () => routeFromHash());
    routeFromHash();
  }

  function loadLessons() {
    return Promise.all(C.order.map((o) => new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = `lessons/${o.id}.js`;
      s.async = false;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    })));
  }

  const partOf = (ch) => { const o = C.order.find((x) => x.id === ch.id); const p = o && (C.parts || []).find((x) => x.id === o.part); return p ? p.title : ''; };
  const colabUrl = (nb, sol) => `https://colab.research.google.com/github/${C.github.user}/${C.github.repo}/blob/${C.github.branch}/notebooks/${sol ? 'solutions/' + nb + '_solution' : nb}.ipynb`;
  app.colabUrl = colabUrl;
  function colabButtons(ch, small) {
    const o = C.order.find((x) => x.id === ch.id) || {};
    const nb = ch.colab || o.colab;
    if (!nb) return '';
    const cls = small ? 'btn small colab' : 'btn colab';
    return `<a class="${cls}" href="${colabUrl(nb)}" target="_blank" rel="noopener" title="본인 Google 계정으로 Colab 에서 열기 (파일 → Drive에 사본 저장)">🟠 Colab 실습 노트북</a>` +
      (app.role === 'teacher' ? `<a class="${cls} sol" href="${colabUrl(nb, true)}" target="_blank" rel="noopener" title="교사용 정답 노트북">🔑 Colab 정답 노트북</a>` : '');
  }
  app.colabButtons = colabButtons;
  const chapters = () => C.order.map((o) => C.chapters[o.id] ? Object.assign({ icon: o.icon, src: o.src }, C.chapters[o.id]) : null).filter(Boolean);
  const allSections = () => chapters().flatMap((ch) => ch.sections.map((s) => ({ ch, sec: s })));
  function findSection(id) {
    for (const ch of chapters()) {
      const sec = ch.sections.find((s) => s.id === id);
      if (sec) return { ch, sec };
    }
    return null;
  }

  // ================================================================== 테마 · 역할 · 보기
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    store.set('jc.theme', t);
    document.dispatchEvent(new CustomEvent('themechange'));
  }

  /** 교사용 화면은 비밀번호를 한 번 확인한다 (확인하면 이 브라우저에서는 다시 묻지 않음) */
  function teacherAllowed() {
    const pass = String(C.teacherPass || 'samcho93');
    if (store.get('jc.teacherOk', '') === pass) return true;
    const v = window.prompt('교사용 화면 비밀번호를 입력하세요.', '');
    if (v == null) return false;
    if (v.trim() !== pass) {
      app.toast('비밀번호가 맞지 않습니다');
      return false;
    }
    store.set('jc.teacherOk', pass);
    return true;
  }

  function setRole(role, silent) {
    if (role === 'teacher' && !teacherAllowed()) {
      document.querySelectorAll('.role-switch button').forEach((b) => b.classList.toggle('active', b.dataset.role === app.role));
      return;
    }
    app.role = role;
    store.set('jc.role', role);
    document.body.classList.toggle('role-teacher', role === 'teacher');
    if (window.Ink) Ink.enabled = role === 'teacher';   // 판서는 교사용에서만
    document.querySelectorAll('.role-switch button').forEach((b) => b.classList.toggle('active', b.dataset.role === role));
    $('brandSub').textContent = role === 'teacher' ? '🧑‍🏫 교사용 · PPT 수업 모드' : '🎓 학생용 · 문서 + 실습';
    const q = new URLSearchParams(location.search);
    q.set('role', role);
    q.delete('view');
    history.replaceState(null, '', `${location.pathname}?${q}${location.hash}`);
    if (!silent) {
      app.view = role === 'teacher' ? 'slides' : 'doc';
      render();
    }
  }

  function setView(view) {
    app.view = view;
    render();
  }
  app.setView = setView;

  // ================================================================== 에디터
  function setupEditor() {
    app.editor = makeEditor($('editorHost'), '', { onRun: runEditor });
    app.editorState = { key: null, label: '', original: '' };
    app.editor.on('change', () => {
      const st = app.editorState;
      if (st.key) store.set('jc.ed.' + st.key, JSON.stringify({ code: app.editor.getValue(), label: st.label, original: st.original }));
    });
    const font = +store.get('jc.edFont', 14.5);
    setEditorFont(font);
  }

  function setEditorFont(px) {
    app.edFont = Math.max(10, Math.min(28, px));
    document.documentElement.style.setProperty('--ed-font', app.edFont + 'px');
    store.set('jc.edFont', app.edFont);
    app.editor.refresh();
  }

  function loadEditor(code, label, key) {
    app.editorState = { key: key || app.editorState.key, label: label || '', original: code };
    app.editor.setValue(code);
    $('editorLabel').textContent = label ? '· ' + label : '';
    if (app.editorState.key) store.set('jc.ed.' + app.editorState.key, JSON.stringify({ code, label, original: code }));
    $('editorPane').classList.remove('folded');
    $('foldBtn').textContent = '▾ 접기';
    setTimeout(() => app.editor.refresh(), 0);
  }

  function restoreEditor(sectionId, fallbackCode, fallbackLabel) {
    let saved = null;
    try { saved = JSON.parse(store.get('jc.ed.' + sectionId, 'null')); } catch (e) { saved = null; }
    if (saved && saved.code != null) {
      app.editorState = { key: sectionId, label: saved.label || '', original: saved.original || saved.code };
      app.editor.setValue(saved.code);
      $('editorLabel').textContent = saved.label ? '· ' + saved.label : '';
    } else {
      app.editorState = { key: sectionId, label: fallbackLabel || '', original: fallbackCode || '' };
      app.editor.setValue(fallbackCode || '');
      $('editorLabel').textContent = fallbackLabel ? '· ' + fallbackLabel : '';
    }
    setTimeout(() => app.editor.refresh(), 0);
  }

  function runEditor(stdin) {
    app.runCode(app.editor.getValue(), { label: app.editorState.label || '실습 코드', stdin, editor: app.editor });
  }

  app.runCode = function (code, opts = {}) {
    app.activeEditor = opts.editor || null;
    if (app.deck && app.deck.isFull()) app.deck.showConsole(true);   // 발표 중 코드를 실행하면 결과 창을 연다
    let stdin = opts.stdin;
    if (opts.repl && stdin) {
      // 대화형 예제: 들여쓴 블록이 끝나도록 빈 줄을 붙인다
      stdin = String(stdin).replace(/\s+$/, '') + '\n';
      if (/\n\s+\S[^\n]*\n$/.test('\n' + stdin) || /:\s*\n$/.test(stdin) || /(^|\n)\s*(if|for|while|def|class|with|try|elif|else|except|finally)\b[^\n]*:[^\n]*\n$/.test(stdin)) stdin += '\n';
    }
    return app.console.execute(code, {
      label: opts.label,
      stdin,
      repl: !!opts.repl,
      onDiagnostics: (d) => { if (opts.editor) opts.editor.markErrors(d); }
    });
  };

  /** 그림 크게 보기 — 전체 화면 발표 중에도 보이도록 전체 화면 요소 안에 넣는다 */
  app.lightbox = function (src, caption) {
    app.closeLightbox();
    const host = document.fullscreenElement || document.querySelector('.deck-wrap.pfull') || document.body;
    const back = document.createElement('div');
    back.className = 'lb-back';
    back.innerHTML = `<div class="lb-head"><span>${esc(caption || '')}</span><span class="spacer"></span>
        <button class="btn small ghost" data-lb-close>✕ 닫기 (Esc)</button></div>
      <img src="${esc(src)}" alt="${esc(caption || '')}">`;
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-lb-close]')) app.closeLightbox(); });
    host.appendChild(back);
    app._lb = back;
    return back;
  };
  app.closeLightbox = function () {
    if (!app._lb) return false;
    app._lb.remove();
    app._lb = null;
    return true;
  };

  app.toast = function (msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(app._toast);
    app._toast = setTimeout(() => t.classList.add('hidden'), 1800);
  };

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); app.toast('복사했습니다'); } catch (e) { app.toast('복사하지 못했습니다'); }
  }

  // ================================================================== 네비게이션
  function buildNav() {
    const q = $('navSearch').value.trim().toLowerCase();
    const tree = $('navTree');
    const cur = app.route;
    let html = `<a class="nav-home${cur.type === 'home' ? ' active' : ''}" href="#home">🏠 강좌 소개</a>`;
    let lastPart = null;
    C.order.forEach((o) => {
      const ch = C.chapters[o.id];
      if (!q && o.part && o.part !== lastPart) {
        lastPart = o.part;
        const p = (C.parts || []).find((x) => x.id === o.part);
        if (p) html += `<div class="nav-part">${esc(p.title)}</div>`;
      }
      if (!ch) {
        if (!q) html += `<div class="nav-ch"><div class="nav-ch-head" style="cursor:default;opacity:.6"><span class="no">${esc(o.no)}</span><span class="t">${esc(o.title)}</span><span class="pending">준비 중</span></div></div>`;
        return;
      }
      let secs = ch.sections;
      const hits = {};
      if (q) {
        const chHit = (ch.title + ' ' + (ch.subtitle || '')).toLowerCase().includes(q);
        secs = secs.filter((s) => {
          if (chHit || s.title.toLowerCase().includes(q)) return true;
          const text = sectionText(s).toLowerCase();
          const i = text.indexOf(q);
          if (i >= 0) { hits[s.id] = text.slice(Math.max(0, i - 18), i + q.length + 26); return true; }
          return false;
        });
        if (!secs.length) return;
      }
      const active = (cur.ch && cur.ch.id === ch.id);
      const open = q || active || (store.get('jc.open.' + ch.id, '0') === '1');
      const doneN = ch.sections.filter((s) => app.done.has(s.id)).length;
      html += `<div class="nav-ch${open ? ' open' : ''}${active ? ' active' : ''}" data-ch="${ch.id}">
        <div class="nav-ch-head"><span class="no">${esc(ch.no)}</span><span class="t" title="${esc(ch.title)}">${esc(o.icon || '')} ${esc(ch.title)}</span>
          <span class="pending">${doneN}/${ch.sections.length}</span><span class="caret">▶</span></div>
        <div class="nav-secs"><a class="nav-sec nav-overview${cur.type === 'chapter' && active ? ' active' : ''}" href="#${ch.id}"><span class="chk">ⓘ</span><span>차시 개요</span></a>
        ${secs.map((s, i) => `<a class="nav-sec${cur.sec && cur.sec.id === s.id ? ' active' : ''}${app.done.has(s.id) ? ' done' : ''}" href="#${s.id}">
          <span class="chk">${app.done.has(s.id) ? '✔' : ch.sections.indexOf(s) + 1}</span><span>${esc(s.title)}${hits[s.id] ? `<span class="hit">…${esc(hits[s.id])}…</span>` : ''}</span></a>`).join('')}
        </div></div>`;
    });
    tree.innerHTML = html;
    const act = tree.querySelector('.nav-sec.active');
    if (act && !q) act.scrollIntoView({ block: 'nearest' });
  }

  const textCache = new Map();
  function sectionText(s) {
    if (textCache.has(s.id)) return textCache.get(s.id);
    const parts = [s.title, ...(s.goals || [])];
    (s.content || []).forEach((b) => parts.push(b.text || '', stripTags(b.html), b.title || '', (b.items || []).map(stripTags).join(' '), b.code || '', (b.rows || []).flat().map(stripTags).join(' ')));
    (s.practice || []).forEach((p) => parts.push(p.title, stripTags(p.desc)));
    const t = parts.join(' ');
    textCache.set(s.id, t);
    return t;
  }

  function updateProgress() {
    const all = allSections();
    const n = all.filter((x) => app.done.has(x.sec.id)).length;
    $('progressText').textContent = `${n} / ${all.length}`;
    $('progressBar').style.width = all.length ? (n / all.length * 100) + '%' : '0';
  }

  function toggleDone(id) {
    if (app.done.has(id)) app.done.delete(id); else app.done.add(id);
    store.set('jc.done', JSON.stringify([...app.done]));
    updateProgress();
    buildNav();
  }

  // ================================================================== 라우팅
  function routeFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    const [id, slide] = h.split('@');
    if (!id || id === 'home') { app.route = { type: 'home' }; }
    else if (C.chapters[id]) { app.route = { type: 'chapter', ch: chapters().find((c) => c.id === id) }; }
    else {
      const f = findSection(id);
      if (f) {
        app.route = { type: 'section', ch: f.ch, sec: f.sec, slide: slide ? Math.max(0, (+slide || 1) - 1) : (slide === '' ? 0 : null) };
        store.set('jc.last', id);
      } else app.route = { type: 'home' };
    }
    if (app.viewPref) { app.view = app.viewPref === 'slides' ? 'slides' : 'doc'; app.viewPref = null; }
    else if (!app.viewInit) app.view = app.role === 'teacher' ? 'slides' : 'doc';
    app.viewInit = true;
    if (app.route.type !== 'section' && app.view === 'slides') { /* 홈/개요는 문서 보기로 */ }
    render();
  }

  function go(hash) {
    if (location.hash === '#' + hash) routeFromHash();
    else location.hash = hash;
  }

  app.stepSection = function (dir, slide) {
    const all = allSections();
    const r = app.route;
    if (r.type !== 'section') return;
    const i = all.findIndex((x) => x.sec.id === r.sec.id);
    const n = all[i + dir];
    if (!n) { app.toast(dir > 0 ? '마지막 슬라이드입니다' : '첫 슬라이드입니다'); return; }
    app.pendingSlide = slide;
    go(n.sec.id);
  };

  app.onSlideChange = function (sec, index) {
    store.set('jc.slidePos', JSON.stringify({ id: sec.id, i: index }));
    const h = `#${sec.id}@${index + 1}`;
    if (location.hash !== h) history.replaceState(null, '', location.pathname + location.search + h);
  };

  // ================================================================== 렌더링
  function render() {
    const r = app.route;
    buildNav();
    document.querySelectorAll('.view-switch button').forEach((b) => b.classList.toggle('active', b.dataset.view === app.view));
    const isSection = r.type === 'section';
    $('docView').classList.toggle('no-editor', r.type === 'home');   // 대문 화면에는 실습 코드 편집기를 두지 않는다
    const slides = isSection && app.view === 'slides';
    $('docView').classList.toggle('hidden', slides);
    $('slideView').classList.toggle('hidden', !slides);
    document.querySelector('.view-switch').style.visibility = isSection ? 'visible' : 'hidden';
    $('prevBtn').style.visibility = isSection ? 'visible' : 'hidden';
    $('nextBtn').style.visibility = isSection ? 'visible' : 'hidden';

    if (r.type === 'home') {
      $('crumb').innerHTML = '<b>강좌 소개</b>';
      renderHome();
    } else if (r.type === 'chapter') {
      $('crumb').innerHTML = `${esc(r.ch.no)}차시 · <b>${esc(r.ch.title)}</b>`;
      renderChapter(r.ch);
    } else {
      $('crumb').innerHTML = `${esc(r.ch.no)}차시 ${esc(r.ch.title)} › <b>${esc(r.sec.title)}</b>`;
      if (slides) {
        let idx = app.pendingSlide != null ? app.pendingSlide : (r.slide != null ? r.slide : null);
        if (idx == null) {
          // 같은 교시를 새로 고치거나 보기 방식만 바꾼 경우에는 보던 쪽에서 이어 본다
          let pos = null;
          try { pos = JSON.parse(store.get('jc.slidePos', 'null')); } catch (e) { pos = null; }
          idx = pos && pos.id === r.sec.id ? pos.i : 0;
        }
        app.pendingSlide = null;
        app.deck.open(r.ch, r.sec, idx);
      } else {
        renderSection(r.ch, r.sec);
      }
    }
    if (!slides) setTimeout(() => app.editor.refresh(), 0);
  }

  // ------------------------------------------------------------------ 홈
  function renderHome() {
    const chs = chapters();
    const all = allSections();
    let nCode = 0, nSlides = 0, nPractice = 0, nQuiz = 0;
    all.forEach(({ sec }) => {
      nCode += (sec.content || []).filter((b) => b.type === 'code').length;
      nSlides += (sec.slides || []).length;
      nPractice += (sec.practice || []).length;
      nQuiz += (sec.quiz || []).length;
    });
    const last = store.get('jc.last', '');
    const lastF = last && findSection(last);
    const first = all[0];
    const teacher = app.role === 'teacher';
    $('content').innerHTML = `<div class="doc">
      <div class="hero">
        <h1>🕵️ ${esc(C.title)}</h1>
        <p>LLM 이 스스로 <b>계획하고 · 도구를 호출하고 · 기억하고 · 반성하는</b> AI 에이전트를 파이썬으로 직접 만들어 봅니다.
          <b>역할/페르소나 · 도구 호출 · 메모리 · 계획과 반성</b>의 4대 요소를 하나씩 구현한 뒤, <b>LangChain · LangGraph · CrewAI · AutoGen</b> 으로 같은 구조를 다시 만들고,
          날씨 · 검색 비서 에이전트와 마케팅 자동화 에이전트 팀을 완성합니다.</p>
        <p>모든 코드는 <b>브라우저 안에서 바로 실행</b>됩니다. 🔑 무료 API 키(Gemini · Groq · OpenRouter · Ollama)를 넣으면 실제 모델이, 키가 없으면 <b>모의 LLM</b>이 항상 같은 답으로 응답해 수업이 끊기지 않습니다.
          실제 프레임워크(LangChain · CrewAI · AutoGen) 설치가 필요한 실습은 <b>Google Colab 노트북</b>으로 이어집니다.</p>
        <p>차시 ${chs.length}개 · 교시 ${all.length}개 · 예제 ${nCode}개 · 실습 ${nPractice}개 · 퀴즈 ${nQuiz}문항 · 슬라이드 ${nSlides}장</p>
        <div class="hero-actions">
          ${lastF ? `<a class="btn" href="#${lastF.sec.id}">⏯ 이어서 학습: ${esc(lastF.sec.title)}</a>` : ''}
          ${first ? `<a class="btn${lastF ? ' outline' : ''}" href="#${first.sec.id}">▶ 처음부터 시작</a>` : ''}
          <button class="btn outline" id="homeKeysBtn">🔑 API 키 설정</button>
          <button class="btn outline" data-role-go="${teacher ? 'student' : 'teacher'}">${teacher ? '🎓 학생용 화면으로' : '🧑‍🏫 교사용(PPT) 화면으로'}</button>
        </div>
        <div class="cup">🕵️</div>
      </div>

      <h2>학습 경로</h2>
      <p>이 과정은 여섯 과정으로 이어지는 시리즈의 <b>다섯 번째</b>입니다. LLM 과정의 <b>API · 프롬프트 · 도구 호출</b>, RAG 과정의 <b>임베딩 검색</b>이 이 과정의 메모리와 도구로 이어지고, 마지막 과정 <b>온톨로지와 지식 그래프</b>에서는 에이전트가 기댈 지식을 관계 · 규칙으로 명시합니다.</p>
      <div class="pathway path-6">
        <a class="card" href="https://samcho93.github.io/studyMLBasic/" target="_blank" rel="noopener"><span class="cn">① 이전 과정 ↗</span><span class="ci">🤖</span><span class="ct">머신러닝 기초</span><span class="cs">회귀 · 분류 · 평가 · 신경망 · CNN</span></a>
        <a class="card" href="https://samcho93.github.io/MLStudio/" target="_blank" rel="noopener"><span class="cn">② 이전 과정 ↗</span><span class="ci">🧩</span><span class="ct">ML Node Studio</span><span class="cs">노드를 연결해 데이터 → 모델 → 평가</span></a>
        <a class="card" href="https://samcho93.github.io/studyLLM/" target="_blank" rel="noopener"><span class="cn">③ 이전 과정 ↗</span><span class="ci">🧠</span><span class="ct">LLM 원리와 활용</span><span class="cs">토큰 · 어텐션 · 미니 GPT · API</span></a>
        <a class="card" href="https://samcho93.github.io/studyRAG/" target="_blank" rel="noopener"><span class="cn">④ 이전 과정 ↗</span><span class="ci">🔎</span><span class="ct">RAG 시스템 구축</span><span class="cs">청킹 · 임베딩 검색 · 평가 · 인용</span></a>
        <div class="card is-here"><span class="cn">⑤ 지금 이 과정</span><span class="ci">🕵️</span><span class="ct">AI 에이전트 구축</span><span class="cs">도구 호출 · 메모리 · 계획 · LangGraph · CrewAI · AutoGen</span></div>
        <a class="card" href="https://samcho93.github.io/studyOntology/" target="_blank" rel="noopener"><span class="cn">⑥ 다음 과정 ↗</span><span class="ci">🕸️</span><span class="ct">온톨로지와 지식 그래프</span><span class="cs">트리플 · SPARQL · 추론 · 검증 · GraphRAG</span></a>
      </div>

      ${(C.parts || []).map((p) => {
        const list = C.order.filter((o) => o.part === p.id);
        return `<h2>${esc(p.title)} <span class="muted" style="font-size:.62em;font-weight:600">${esc(p.desc || '')}</span></h2>
        <div class="cards">${list.map((o) => {
          const ch = C.chapters[o.id];
          if (!ch) return `<div class="card disabled"><span class="ci">${o.icon}</span><span class="cn">${esc(o.no)}차시</span><span class="ct">${esc(o.title)}</span><span class="cs">준비 중</span></div>`;
          const d = ch.sections.filter((s) => app.done.has(s.id)).length;
          return `<a class="card" href="#${ch.id}"><span class="ci">${o.icon}</span><span class="cn">${esc(ch.no)}차시${o.colab ? ' · 🟠 Colab' : ''}</span><span class="ct">${esc(ch.title)}</span>
            <span class="cs">${ch.sections.length}교시 · ${esc(stripTags(ch.summary).slice(0, 60))}${stripTags(ch.summary).length > 60 ? '…' : ''}</span>
            <span class="cp"><i style="width:${ch.sections.length ? d / ch.sections.length * 100 : 0}%"></i></span></a>`;
        }).join('')}</div>`;
      }).join('')}

      <h2>🧭 화면 구성과 사용 방법</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>구분</th><th>🎓 학생용</th><th>🧑‍🏫 교사용</th></tr></thead>
        <tbody>
          <tr><td>기본 화면</td><td>문서형 강좌 (개념 · 그림 → 예제 → 실습 → 퀴즈)</td><td>PPT 형태 슬라이드 (16:9) + 교사 노트</td></tr>
          <tr><td>코드 실행</td><td>예제의 <b>▶ 실행</b> 또는 아래 편집기에서 <kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>코드 슬라이드에서 직접 수정하고 <b>▶ 실행</b> (전체 화면에서도 결과 패널 표시)</td></tr>
          <tr><td>실행 결과</td><td colspan="2">오른쪽 <b>결과 창</b>에 출력 · 오류 · <b>그래프(matplotlib)</b> · <b>표(pandas)</b> 표시. 그래프를 누르면 크게 보입니다.</td></tr>
          <tr><td>LLM</td><td colspan="2">강좌 모듈 <code>agentlab</code> 이 Gemini · Groq · OpenRouter · OpenAI · Anthropic · Ollama 를 같은 사용법으로 호출합니다. 왼쪽 아래 <b>🔑</b> 에서 키를 넣으세요(세션에만 저장). 키가 없으면 모의 LLM 이 답합니다.</td></tr>
          <tr><td>Colab</td><td>차시별 🟠 Colab 실습 노트북 — 실제 LangChain · LangGraph · CrewAI · AutoGen 설치 실습</td><td>🔑 Colab 정답 노트북</td></tr>
          <tr><td>추가 기능</td><td>진도 저장, 검색, 슬라이드 보기</td><td>수업 흐름 · 퀴즈 정답 · 실습 정답 실행 · 판서 · 타이머 · 발표자 창 · 전체 화면</td></tr>
        </tbody></table></div>
      <ul class="steps">
        <li><b>교시 선택</b> — 왼쪽 목차에서 차시와 교시를 고릅니다. 상단의 📄 문서 / 🖼️ 슬라이드 버튼으로 보기를 바꿉니다.</li>
        <li><b>코드 실행</b> — 예제의 ▶ 실행을 누르면 아래 편집기로 코드가 들어가고 오른쪽 결과 창에 출력과 그래프가 나옵니다. 값을 바꿔 다시 실행해 보세요. (<kbd>Ctrl</kbd>+<kbd>Enter</kbd>)</li>
        <li><b>API 키</b> — 왼쪽 아래 🔑 에서 무료 공급자(Gemini · Groq · OpenRouter · Ollama)의 키를 넣으면 실제 LLM 이 답합니다. 없어도 모든 예제가 모의 LLM 으로 동작합니다.</li>
        <li><b>Colab 실습</b> — 🟠 버튼으로 Colab 노트북을 열고 <b>파일 → Drive에 사본 저장</b> 후 실행합니다. 실제 프레임워크(pip 설치)는 Colab 에서 실습합니다.</li>
        <li><b>교사용 수업</b> — 🧑‍🏫 교사용으로 바꾸면 슬라이드가 열립니다. <kbd>F</kbd> 전체 화면, <kbd>←</kbd> <kbd>→</kbd> 이동, <kbd>R</kbd> 결과 패널, <kbd>G</kbd> 목록, <kbd>N</kbd> 노트, <kbd>B</kbd> 화면 가리기, <kbd>T</kbd> 타이머.</li>
      </ul>
      <div class="callout info"><div class="ct">ℹ️ 실행 환경 <span id="homeEnv" class="muted" style="font-weight:600">준비 전</span></div><div>
        <p>파이썬은 <b>브라우저 안</b>(<a href="https://pyodide.org" target="_blank" rel="noopener">Pyodide</a>, Python 3.14)에서 실행됩니다. 처음 실행할 때 실행 환경을 내려받느라 <b>5~20초</b> 걸리고, 그 뒤로는 바로 실행됩니다.</p>
        <p>강좌 모듈 <code>agentlab</code>(LLM · 도구 · 메모리 · 에이전트 루프 · 미니 LangChain/LangGraph/CrewAI/AutoGen)은 순수 파이썬이라 설치 없이 동작합니다. pip 로 설치하는 실제 프레임워크는 Colab 노트북에서 실습합니다.</p>
      </div></div>
    </div>`;
    updateEnvText();
    const hk = $('homeKeysBtn');
    if (hk) hk.onclick = () => window.AgentKeys && AgentKeys.open();
    $('content').scrollTop = 0;
  }

  // ------------------------------------------------------------------ 챕터 개요
  function renderChapter(ch) {
    const secMeta = (s) => {
      const nc = (s.content || []).filter((b) => b.type === 'code').length;
      return `${s.minutes || 50}분 · 예제 ${nc} · 실습 ${(s.practice || []).length} · 슬라이드 ${(s.slides || []).length}`;
    };
    $('content').innerHTML = `<div class="doc">
      <span class="chapter-badge">${esc(ch.icon || '')} ${esc(ch.no)}차시 · ${esc(partOf(ch))}</span>
      <h1>${esc(ch.title)} ${ch.subtitle ? `<span class="muted" style="font-size:.6em;font-weight:600">${esc(ch.subtitle)}</span>` : ''}</h1>
      <p class="lead">${ch.summary || ''}</p>
      ${(ch.goals || []).length ? `<div class="goals"><b>🎯 차시 학습 목표</b><ul>${ch.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>` : ''}
      <div class="meta-row">
        <a class="btn primary" href="#${ch.sections[0].id}">▶ 첫 교시 시작</a>
        <button class="btn" data-slides="${ch.sections[0].id}">🖼️ 슬라이드로 수업</button>
        ${colabButtons(ch)}
      </div>
      <h2>교시 구성</h2>
      <div class="sec-list">${ch.sections.map((s, i) => `<a class="sec-item" href="#${s.id}"><span class="sn">${i + 1}</span>
        <span class="st">${esc(s.title)}<div class="sm">${secMeta(s)}</div></span><span>${app.done.has(s.id) ? '✅' : ''}</span></a>`).join('')}</div>
      ${(ch.colab || (C.order.find((x) => x.id === ch.id) || {}).colab) ? `<div class="callout colab"><div class="ct">🟠 Google Colab 실습</div><div>
        <p>브라우저 실습으로 개념을 익힌 뒤, <b>Colab 노트북</b>에서 실제 프레임워크(LangChain · LangGraph · CrewAI · AutoGen)를 pip 로 설치해 같은 에이전트를 다시 만들어 봅니다.
        본인 Google 계정으로 로그인하고 <b>파일 → Drive에 사본 저장</b> 후 실행하세요. API 키는 Colab 의 🔑 보안 비밀(Secrets)에 넣습니다.</p>
        <div class="meta-row">${colabButtons(ch)}</div></div></div>` : ''}
    </div>`;
    $('content').scrollTop = 0;
    const pdf = $('content').querySelector('[data-pdf]');
    if (pdf && /^https?:/.test(location.protocol)) fetch(pdf.getAttribute('href'), { method: 'HEAD' }).then((r) => { if (!r.ok) pdf.remove(); }).catch(() => pdf.remove());
    restoreEditor(ch.id, '', '');
  }

  // ------------------------------------------------------------------ 교시(섹션) 문서
  const GUI_RE = /^\s*(import|from)\s+(turtle|tkinter|pygame)\b/m;
  function codeBlockHtml(b, id, opts = {}) {
    const runnable = b.run !== false;
    if (b.repl) {
      return `<div class="code-block repl" id="cb-${id}">
      <div class="code-head"><span class="t"><span class="tag">&gt;&gt;&gt;</span>${esc(b.title || '대화형 모드')}</span>
        <button class="btn small primary" data-code-act="run" data-code="${id}" title="콘솔의 대화형 모드(>>>)에서 한 줄씩 실행">▶ 셸에서 실행</button>
        <button class="btn small ghost" data-code-act="copy" data-code="${id}" title="코드 복사">⧉</button></div>
      <pre>${window.JU.highlightRepl(b.code)}</pre>
      ${b.desc ? `<div class="code-desc">${b.desc}</div>` : ''}${b.expect != null && !opts.noExpect ? `<details class="expect"><summary>실행 결과 예시</summary><pre class="term">${esc(String(b.expect).replace(/\s+$/, ''))}</pre></details>` : ''}</div>`;
    }
    const gui = GUI_RE.test(b.code || '') ? `<div class="stdin-hint">🪟 실행하면 <b>${/turtle/.test(b.code) ? '거북이 그래픽' : /pygame/.test(b.code) ? '게임' : 'tkinter'} 창</b>이 화면 위에 열립니다. 창의 ✕ 또는 ■ 중지로 닫습니다.</div>` : '';
    const stdin = b.stdin ? `<div class="stdin-hint">⌨ 입력이 필요한 예제입니다. 실행 후 콘솔 입력칸에 입력하세요. 예: <code>${esc(b.stdin.replace(/\n$/, '').replace(/\n/g, ' ⏎ '))}</code>
      ${runnable ? `<button class="btn small ghost" data-code-act="run-stdin" data-code="${id}">예시 입력으로 실행</button>` : ''}</div>` : '';
    const expect = b.expect != null && !b.nondeterministic && !opts.noExpect ? `<details class="expect"><summary>실행 결과 예시</summary><pre class="term">${esc(String(b.expect).replace(/\s+$/, ''))}</pre></details>` : '';
    const tag = opts.tag ? `<span class="tag">${esc(opts.tag)}</span>` : '';
    return `<div class="code-block" id="cb-${id}">
      <div class="code-head"><span class="t">${tag}${b.title ? esc(b.title) : esc(window.JU.fileName(b.code))}</span>
        ${runnable ? `<button class="btn small primary" data-code-act="run" data-code="${id}" title="편집기로 불러와 실행">▶ 실행</button>` : '<span class="chip">실행 불가 코드 조각</span>'}
        <button class="btn small ghost" data-code-act="edit" data-code="${id}" title="아래 편집기로 불러오기">✎ 편집기로</button>
        <button class="btn small ghost" data-code-act="copy" data-code="${id}" title="코드 복사">⧉</button></div>
      <pre>${highlightLines(b.code)}</pre>${stdin}${gui}
      ${b.desc ? `<div class="code-desc">${b.desc}</div>` : ''}${expect}</div>`;
  }

  function renderSection(ch, sec) {
    const teacher = app.role === 'teacher';
    app.blockCodes = {};
    let n = 0;
    const reg = (code, title, stdin, repl) => { const id = 'c' + (n++); app.blockCodes[id] = { code, title, stdin, repl: !!repl }; return id; };
    const idx = ch.sections.indexOf(sec);
    const all = allSections();
    const gi = all.findIndex((x) => x.sec.id === sec.id);
    const prev = all[gi - 1], next = all[gi + 1];
    let firstCode = null;

    const demos = [];
    const blockHtml = (b) => {
      switch (b.type) {
        case 'h': return `<h3>${esc(b.text)}</h3>`;
        case 'p': return `<p>${window.JU.scoped(b.html)}</p>`;
        case 'list': {
          const tagName = b.ordered ? 'ol' : 'ul';
          return `<${tagName}>${(b.items || []).map((i) => `<li>${i}</li>`).join('')}</${tagName}>`;
        }
        case 'table':
          return `<div class="table-wrap"><table><thead><tr>${(b.head || []).map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${(b.rows || []).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${b.caption ? `<p class="caption">${b.caption}</p>` : ''}`;
        case 'code': {
          const id = reg(b.code, b.title, b.stdin, b.repl);
          if (!firstCode && b.run !== false && !b.repl) firstCode = b;
          return codeBlockHtml(b, id, { tag: b.title && /^예제/.test(b.title) ? '예제' : b.title && /추가/.test(b.title) ? '추가' : '' });
        }
        case 'callout': {
          const icon = { tip: '💡', warn: '⚠️', info: 'ℹ️', more: '📘' }[b.kind] || 'ℹ️';
          const title = b.title || { tip: '팁', warn: '주의', info: '참고', more: '더 알아보기' }[b.kind];
          return `<div class="callout ${esc(b.kind)}"><div class="ct">${icon} ${b.kind === 'more' && b.title ? '더 알아보기 · ' + b.title : title}</div><div>${window.JU.scoped(b.html)}</div></div>`;
        }
        case 'figure':
          return `<div class="figure">${window.JU.scoped(b.html)}${b.caption ? `<p class="caption">${b.caption}</p>` : ''}</div>`;
        case 'demo': {
          const di = demos.push(b) - 1;
          return `<div class="demo" data-demo="${di}"><div class="demo-title">${esc(b.title || '체험')}</div>${b.desc ? `<p class="demo-desc">${b.desc}</p>` : ''}<div class="demo-host">${b.html || ''}</div></div>`;
        }
        case 'colab':
          return `<div class="callout colab"><div class="ct">🟠 ${esc(b.title || 'Google Colab 실습')}</div><div>${window.JU.scoped(b.html || '')}
            <div class="meta-row">${colabButtons(ch)}</div></div></div>`;
        default:
          return b.html ? `<div>${b.html}</div>` : '';
      }
    };
    // teacher: true 인 블록은 교사용 화면에만 (수업 준비 · 루브릭 · 지도 팁 등)
    const blocks = (sec.content || []).filter((b) => teacher || !b.teacher).map((b) => {
      const inner = blockHtml(b);
      return b.teacher ? `<div class="teacher-block"><div class="tb-label">🧑‍🏫 교사용</div>${inner}</div>` : inner;
    }).join('\n');

    const practice = (sec.practice || []).map((p, i) => {
      const sid = reg(p.starter || '', p.title + ' (시작 코드)', p.stdin);
      const solId = p.solution ? reg(p.solution, p.title + ' (정답)', p.stdin) : null;
      const lv = '★'.repeat(p.level || 1) + '☆'.repeat(3 - (p.level || 1));
      return `<div class="practice"><div class="practice-head"><b>🛠️ ${esc(p.title)}</b><span class="level" title="난이도">${lv}</span></div>
        <div class="practice-body">${p.desc || ''}
          ${p.stdin ? `<p class="muted" style="font-size:13px">⌨ 입력 예: <code>${esc(p.stdin.replace(/\n$/, '').replace(/\n/g, ' ⏎ '))}</code></p>` : ''}
          ${p.expect != null && !p.nondeterministic ? `<details><summary>기대 출력 보기</summary><pre class="term" style="background:var(--term-bg);color:var(--term-fg);padding:10px 14px;border-radius:8px;white-space:pre-wrap">${esc(String(p.expect).replace(/\s+$/, ''))}</pre></details>` : ''}
          ${p.hint ? `<details><summary>💡 힌트</summary><div>${p.hint}</div></details>` : ''}
          <div class="actions"><button class="btn small primary" data-code-act="edit" data-code="${sid}">✎ 시작 코드를 편집기로</button>
            ${teacher && solId ? `<button class="btn small blue" data-code-act="run" data-code="${solId}">▶ 정답 실행</button><button class="btn small ghost" data-toggle-sol="${i}">🔑 정답 코드 보기</button>` : ''}</div>
          ${teacher && solId ? `<div class="solution hidden" data-sol="${i}">${codeBlockHtml({ code: p.solution, title: '정답 코드', stdin: p.stdin, expect: p.expect, nondeterministic: p.nondeterministic }, solId, { tag: '교사용' })}</div>` : ''}
        </div></div>`;
    }).join('');

    const quiz = (sec.quiz || []).map((q, i) => `<div class="quiz" data-quiz="${i}"><div class="q"><span class="qn">Q${i + 1}.</span>${q.q}</div>
      <div class="opts">${(q.options || []).map((o, j) => `<button class="opt" data-q="${i}" data-o="${j}"><span class="n">${j + 1}</span><span>${o}</span></button>`).join('')}</div>
      <div class="explain hidden">${teacher ? `<b>정답 ${q.answer + 1}번.</b> ` : ''}${q.explain || ''}</div></div>`).join('');

    const flow = (sec.flow || []).length ? `<div class="flow teacher-only">${sec.flow.map((f) => `<div style="flex:${f[1]}"><b>${esc(f[0])}</b> ${f[1]}분</div>`).join('')}</div>` : '';
    const done = app.done.has(sec.id);

    $('content').innerHTML = `<div class="doc">
      <span class="chapter-badge">${esc(ch.icon || '')} ${esc(ch.no)}차시 · ${esc(ch.title)} · ${idx + 1}/${ch.sections.length}교시</span>
      <h1>${esc(sec.title)}</h1>
      <div class="meta-row"><span class="chip">⏱ ${sec.minutes || 50}분</span><span class="chip">💻 예제 ${(sec.content || []).filter((b) => b.type === 'code').length}</span>
        <span class="chip">🛠️ 실습 ${(sec.practice || []).length}</span><span class="chip">❓ 퀴즈 ${(sec.quiz || []).length}</span>
        <button class="btn small ghost" data-slides="${sec.id}">🖼️ 슬라이드로 보기</button>
        ${colabButtons(ch, true)}
        ${teacher ? '<button class="btn small ghost" id="showAllAnswers">🔑 퀴즈 정답 모두 보기</button>' : ''}</div>
      ${(sec.goals || []).length ? `<div class="goals"><b>🎯 학습 목표</b><ul>${sec.goals.map((g) => `<li>${g}</li>`).join('')}</ul></div>` : ''}
      ${flow}
      ${blocks}
      ${practice ? `<h2>🛠️ 실습 과제</h2>${practice}` : ''}
      ${quiz ? `<h2>❓ 확인 퀴즈</h2>${quiz}` : ''}
      <div class="section-end">
        <button class="btn done-btn${done ? ' done' : ''}" id="doneBtn">${done ? '✔ 학습 완료' : '☐ 학습 완료로 표시'}</button>
        <span class="spacer"></span>
        ${prev ? `<a class="btn ghost" href="#${prev.sec.id}">◀ ${esc(prev.sec.title)}</a>` : ''}
        ${next ? `<a class="btn primary" href="#${next.sec.id}">${esc(next.sec.title)} ▶</a>` : ''}
      </div>
    </div>`;
    $('content').scrollTop = 0;
    demos.forEach((d, i) => {
      const host = $('content').querySelector(`[data-demo="${i}"] .demo-host`);
      if (host && typeof d.init === 'function') { try { d.init(host, window.MLB); } catch (err) { console.error('demo init', err); } }
    });
    restoreEditor(sec.id, firstCode ? firstCode.code : '', firstCode ? firstCode.title : '');
  }

  // ================================================================== 레이아웃 (크기 조절)
  function setupLayout() {
    const root = document.documentElement;
    const nav = store.get('jc.navW', ''), out = store.get('jc.outW', ''), ed = store.get('jc.edH', '');
    if (nav) root.style.setProperty('--nav-w', nav);
    if (out) root.style.setProperty('--out-w', out);
    if (ed) root.style.setProperty('--editor-h', ed);
    if (store.get('jc.navCollapsed', '0') === '1') $('app').classList.add('nav-collapsed');

    document.querySelectorAll('[data-resize]').forEach((g) => {
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        g.setPointerCapture(e.pointerId);
        g.classList.add('drag');
        const kind = g.dataset.resize;
        const move = (ev) => {
          if (kind === 'nav') {
            const w = Math.max(200, Math.min(480, ev.clientX)) + 'px';
            root.style.setProperty('--nav-w', w); store.set('jc.navW', w);
          } else if (kind === 'out') {
            const w = Math.max(260, Math.min(window.innerWidth * 0.6, window.innerWidth - ev.clientX)) + 'px';
            root.style.setProperty('--out-w', w); store.set('jc.outW', w);
          } else if (kind === 'editor') {
            const rect = $('docView').getBoundingClientRect();
            const h = Math.max(60, Math.min(rect.height - 80, rect.bottom - ev.clientY));
            const v = (h / rect.height * 100).toFixed(1) + '%';
            root.style.setProperty('--editor-h', v); store.set('jc.edH', v);
            app.editor.refresh();
          }
          app.deck && app.deck.fit();
        };
        const up = () => { g.classList.remove('drag'); g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); app.editor.refresh(); };
        g.addEventListener('pointermove', move);
        g.addEventListener('pointerup', up);
      });
    });
  }

  // ================================================================== 실행 환경 상태 · 모달
  const E = window.PyEngine;
  const MODE_TEXT = { sab: '실행 중 입력 · 창 이벤트 사용 가능', xhr: '실습 서버 채널로 입력 사용', none: '입력은 실행 전에 미리 받음' };

  function updateEnvText() {
    const el = $('homeEnv');
    if (!el) return;
    el.textContent = E.state === 'ready' ? `Python ${E.python} 준비 완료` : E.state === 'loading' ? '준비 중…' : E.state === 'error' ? '준비 실패' : '처음 실행할 때 준비합니다';
  }

  function setupServerBadge() {
    const update = () => {
      const b = $('serverBtn');
      const st = E.state;
      b.classList.toggle('ok', st === 'ready');
      b.classList.toggle('bad', st === 'error');
      $('serverText').textContent = st === 'ready' ? `🐍 Python ${E.python} 준비 완료`
        : st === 'loading' ? `🐍 ${E.message || '파이썬 준비 중…'}`
          : st === 'error' ? '🐍 실행 환경 오류 (눌러서 확인)' : '🐍 파이썬 (실행하면 준비)';
      updateEnvText();
    };
    E.onChange(update);
    // 페이지를 연 뒤 잠시 후 미리 준비해 둔다
    setTimeout(() => {
      if (E.supported() && E.state === 'idle' && store.get('jc.preload', '1') === '1') E.load().catch(() => {});
    }, 1500);
  }

  function openModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  function serverModal() {
    const st = { idle: '아직 준비 안 함', loading: E.message || '준비 중…', ready: `준비 완료 (Python ${E.python} · Pyodide ${E.pyodide || ''}${E.loadMs ? ` · ${(E.loadMs / 1000).toFixed(1)}초` : ''})`, error: '오류: ' + E.message }[E.state];
    const preload = store.get('jc.preload', '1') === '1';
    openModal('파이썬 실행 환경', `
      <div class="table-wrap"><table><tbody>
        <tr><th>실행 방식</th><td>브라우저 안에서 실행 (<a href="https://pyodide.org" target="_blank" rel="noopener">Pyodide</a> · WebAssembly) — 서버 · 설치가 필요 없습니다.</td></tr>
        <tr><th>상태</th><td><b style="color:${E.state === 'ready' ? 'var(--ok)' : E.state === 'error' ? 'var(--danger)' : 'inherit'}">${esc(st)}</b></td></tr>
        <tr><th>입력(input)</th><td>${E.mode ? esc(MODE_TEXT[E.mode]) : '준비하면 확인됩니다'}${E.mode === 'none' ? '<br><span class="muted">이 환경(HTTP 주소 등)에서는 실행 중 입력을 받을 수 없어, 실행 전에 입력값을 묻습니다. HTTPS(GitHub Pages) 또는 localhost 로 열면 실시간 입력이 됩니다.</span>' : ''}</td></tr>
        <tr><th>지원 모듈</th><td>표준 라이브러리 전체(json · re · sqlite3 …), 강좌 모듈 <b>agentlab</b>(LLM · 도구 · 메모리 · 에이전트), NumPy · pandas · matplotlib (처음 쓸 때 자동으로 내려받음)</td></tr>
        <tr><th>작업 폴더</th><td>프로그램의 현재 폴더(<code>/home/pyodide/work</code>). 예제용 그림 · 데이터 파일이 들어 있고, 페이지를 새로 고치면 처음 상태로 돌아갑니다.</td></tr>
      </tbody></table></div>
      <div class="meta-row">
        <button class="btn primary" id="envLoad" ${E.state === 'ready' || E.state === 'loading' ? 'disabled' : ''}>지금 준비하기</button>
        <label class="chip" style="cursor:pointer"><input type="checkbox" id="envPreload" ${preload ? 'checked' : ''} style="margin-right:6px">페이지를 열 때 미리 준비</label>
      </div>`);
    $('envLoad').onclick = () => { E.load().then(serverModal, serverModal); $('envLoad').disabled = true; $('envLoad').textContent = '준비 중…'; };
    $('envPreload').onchange = (e) => store.set('jc.preload', e.target.checked ? '1' : '0');
  }

  async function filesModal() {
    openModal('📁 작업 폴더', '<p class="muted">불러오는 중…</p>');
    let r;
    try { r = await E.listFiles(); } catch (e) { r = { ok: false, error: e.message }; }
    if (!r || !r.ok) { $('modalBody').innerHTML = `<p>작업 폴더를 불러오지 못했습니다. ${esc(r && r.error || '')}</p>`; return; }
    const size = (n) => n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB';
    const icon = (n) => /\.(gif|png|jpe?g|bmp|webp)$/i.test(n) ? '🖼️' : /\.(txt|csv|py|json|dat|md|html?)$/i.test(n) ? '📄' : /\.(db|sqlite3?)$/i.test(n) ? '🗄️' : '📦';
    $('modalBody').innerHTML = `<p class="muted">프로그램의 현재 폴더입니다. 파일 입출력 예제가 만든 파일과 예제용 그림 · 데이터 파일(★)이 있습니다. 파일을 누르면 내용을 봅니다.</p>
      <div class="file-list">${r.files.length ? r.files.map((f) => `<div class="file-row" data-file="${esc(f.name)}"><span class="fn">${icon(f.name)} ${esc(f.name)}${f.asset ? ' <span class="muted">★</span>' : ''}</span><span class="fs">${size(f.size)}</span></div>`).join('') : '<p class="muted">파일이 없습니다.</p>'}</div>
      <div id="fileView"></div>
      <div class="meta-row"><button class="btn ghost" id="filesRefresh">↻ 새로고침</button>
        <label class="btn ghost" style="cursor:pointer">📤 내 PC 파일 올리기<input type="file" id="filesUpload" multiple hidden></label>
        <button class="btn danger" id="filesClear">🗑 처음 상태로</button></div>`;
    $('modalBody').querySelectorAll('[data-file]').forEach((row) => row.onclick = async () => {
      const name = row.dataset.file;
      const f = await E.readFile(name);
      if (!f.ok) { $('fileView').innerHTML = '<p>읽을 수 없습니다.</p>'; return; }
      const blob = new Blob([f.bytes]);
      const url = URL.createObjectURL(blob);
      const dl = `<a class="btn small ghost" href="${url}" download="${esc(name.split('/').pop())}">⬇ 내려받기</a>`;
      let body;
      if (/\.(gif|png|jpe?g|bmp|webp)$/i.test(name)) {
        const isrc = URL.createObjectURL(new Blob([f.bytes], { type: 'image/' + name.split('.').pop().toLowerCase().replace('jpg', 'jpeg') }));
        body = `<img src="${isrc}" style="max-width:100%;image-rendering:pixelated;background:#eee" data-zoom="${esc(isrc)}">
          <div class="meta-row"><button class="btn small ghost" data-zoom-btn="${esc(isrc)}">⤢ 크게 보기</button></div>`;
      }
      else {
        let text = new TextDecoder('utf-8', { fatal: false }).decode(f.bytes.slice(0, 200000));
        const binary = /[\u0000-\u0008\u000e-\u001f]/.test(text.slice(0, 2000));
        body = binary ? `<p class="muted">이진(binary) 파일입니다 — ${size(f.bytes.length)}</p>` : `<pre>${esc(text)}</pre>`;
      }
      $('fileView').innerHTML = `<h4 style="margin:10px 0 4px">${esc(name)} ${dl}</h4>${body}`;
      $('fileView').querySelectorAll('[data-zoom], [data-zoom-btn]').forEach((el) => {
        el.style.cursor = 'zoom-in';
        el.onclick = () => app.lightbox(el.dataset.zoom || el.dataset.zoomBtn, name);
      });
    });
    $('filesRefresh').onclick = filesModal;
    $('filesUpload').onchange = async (e) => {
      for (const file of e.target.files) {
        const res = await E.writeFile(file.name, new Uint8Array(await file.arrayBuffer()));
        if (!res.ok) { app.toast(res.error || '올리지 못했습니다'); return; }
      }
      app.toast('작업 폴더에 올렸습니다');
      filesModal();
    };
    $('filesClear').onclick = async () => {
      if (!confirm('작업 폴더를 처음 상태(예제 파일만 있는 상태)로 되돌릴까요?')) return;
      const res = await E.clearFiles();
      if (!res.ok) app.toast(res.error || '실패');
      filesModal();
    };
  }

  // ================================================================== 이벤트
  function bindUi() {
    $('themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    document.querySelectorAll('.role-switch button').forEach((b) => b.onclick = () => setRole(b.dataset.role));
    document.querySelectorAll('.view-switch button').forEach((b) => b.onclick = () => setView(b.dataset.view));
    $('navSearch').addEventListener('input', () => buildNav());
    $('navTree').addEventListener('click', (e) => {
      const head = e.target.closest('.nav-ch-head');
      if (!head) return;
      const box = head.parentElement;
      if (!box.dataset.ch) return;
      box.classList.toggle('open');
      store.set('jc.open.' + box.dataset.ch, box.classList.contains('open') ? '1' : '0');
    });
    $('navCloseBtn').onclick = () => { $('app').classList.add('nav-collapsed'); store.set('jc.navCollapsed', '1'); setTimeout(() => { app.editor.refresh(); app.deck.fit(); }, 50); };
    $('navOpenBtn').onclick = () => { $('app').classList.remove('nav-collapsed'); store.set('jc.navCollapsed', '0'); setTimeout(() => { app.editor.refresh(); app.deck.fit(); }, 50); };
    $('prevBtn').onclick = () => app.stepSection(-1, 0);
    $('nextBtn').onclick = () => app.stepSection(1, 0);

    $('runBtn').onclick = () => runEditor();
    $('resetBtn').onclick = () => { app.editor.setValue(app.editorState.original || ''); app.toast('불러온 원래 코드로 되돌렸습니다'); };
    $('copyBtn').onclick = () => copyText(app.editor.getValue());
    $('fontUpBtn').onclick = () => setEditorFont(app.edFont + 1);
    $('fontDownBtn').onclick = () => setEditorFont(app.edFont - 1);
    $('foldBtn').onclick = () => {
      const f = $('editorPane').classList.toggle('folded');
      $('foldBtn').textContent = f ? '▴ 펼치기' : '▾ 접기';
      if (!f) app.editor.refresh();
    };
    $('serverBtn').onclick = serverModal;
    $('filesBtn').onclick = filesModal;
    $('replBtn').onclick = () => app.runCode('', { label: '대화형 모드 (>>>)', repl: true });
    $('modalClose').onclick = closeModal;
    $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (app.closeLightbox()) { e.preventDefault(); return; }
      if (!$('modal').classList.contains('hidden')) closeModal();
    });

    $('content').addEventListener('click', (e) => {
      const act = e.target.closest('[data-code-act]');
      if (act) {
        const b = app.blockCodes[act.dataset.code];
        if (!b) return;
        const a = act.dataset.codeAct;
        if (a === 'copy') return copyText(b.code);
        if (b.repl && a === 'run') { app.runCode(b.code, { label: b.title || '대화형 모드', repl: true, stdin: b.code }); return; }
        if (a === 'edit' || a === 'run' || a === 'run-stdin') {
          loadEditor(b.code, b.title, app.route.sec ? app.route.sec.id : null);
          if (a === 'run') runEditor();
          if (a === 'run-stdin') runEditor(b.stdin);
          if (a === 'edit') app.toast('편집기로 불러왔습니다');
        }
        return;
      }
      const opt = e.target.closest('.quiz .opt');
      if (opt) {
        const q = app.route.sec.quiz[+opt.dataset.q];
        const box = opt.closest('.quiz');
        const j = +opt.dataset.o;
        opt.classList.add(j === q.answer ? 'right' : 'wrong');
        if (j === q.answer) box.querySelector('.explain').classList.remove('hidden');
        return;
      }
      const sol = e.target.closest('[data-toggle-sol]');
      if (sol) {
        const el = $('content').querySelector(`[data-sol="${sol.dataset.toggleSol}"]`);
        const hidden = el.classList.toggle('hidden');
        sol.textContent = hidden ? '🔑 정답 코드 보기' : '🔑 정답 코드 숨기기';
        return;
      }
      const sl = e.target.closest('[data-slides]');
      if (sl) { app.view = 'slides'; go(sl.dataset.slides); if (location.hash === '#' + sl.dataset.slides) render(); return; }
      const rg = e.target.closest('[data-role-go]');
      if (rg) { setRole(rg.dataset.roleGo); return; }
      if (e.target.id === 'doneBtn') { toggleDone(app.route.sec.id); render(); }
      if (e.target.id === 'showAllAnswers') {
        app.route.sec.quiz.forEach((q, i) => {
          const box = $('content').querySelector(`[data-quiz="${i}"]`);
          box.querySelector(`[data-o="${q.answer}"]`).classList.add('right');
          box.querySelector('.explain').classList.remove('hidden');
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (app.view === 'slides' && app.route.type === 'section') return;
      const t = e.target;
      if (t.closest && (t.closest('.CodeMirror') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); app.stepSection(1, 0); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); app.stepSection(-1, 0); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
