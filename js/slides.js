/* 교사용 PPT 슬라이드 엔진: 16:9 슬라이드, 코드 편집·실행, 전체 화면, 교사 노트, 발표자 창, 타이머 */
(function () {
  const { esc, highlightInline, fileName, makeEditor } = window.JU;
  const $ = (id) => document.getElementById(id);
  const LAYOUT_NAME = { title: '제목', goals: '학습 목표', bullets: '개념', code: '코드', two: '비교', table: '표', diagram: '그림', quiz: '퀴즈', practice: '실습', summary: '정리' };
  const LAYOUT_ICON = { title: '🎬', goals: '🎯', bullets: '📌', code: '💻', two: '⚖️', table: '📊', diagram: '🧭', quiz: '❓', practice: '🛠️', summary: '✅' };

  function bulletsHtml(items, dense) {
    if (!Array.isArray(items)) return '';
    return `<ul class="s-bullets${dense ? ' dense' : ''}">${items.map((b) => {
      if (Array.isArray(b)) return `<li>${b[0]}${Array.isArray(b[1]) ? `<ul>${b[1].map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}</li>`;
      return `<li>${b}</li>`;
    }).join('')}</ul>`;
  }

  /** 슬라이드 안의 코드가 잘리지 않도록 글자 크기(cqw)를 계산한다 */
  function autoCodeFont(code, hasPoints, isPractice) {
    const lines = String(code || '').split('\n');
    const n = Math.max(1, lines.length);
    const cols = Math.max(24, ...lines.map((l) => l.replace(/\t/g, '    ').length));
    const boxH = 32;                                   // 코드 상자 높이 (cqw 기준 대략값)
    const boxW = hasPoints ? 55 : isPractice ? 48 : 86; // 코드 상자 폭
    const byLines = boxH / (n * 1.55);
    const byCols = boxW / (cols * 0.62);
    return Math.max(0.78, Math.min(1.55, byLines, byCols));
  }

  class Deck {
    constructor(app) {
      this.app = app;
      this.console = app.console;
      this.slides = [];
      this.index = 0;
      this.edits = {};
      this.solutionOn = {};
      this.editor = null;
      this.notesOpen = Runner.store.get('jc.notesOpen', '1') === '1';
      this.stage = $('stage');
      this.layer = $('slideLayer');
      this.wrap = $('deckWrap');
      this.host = $('stageHost');
      this.bar = $('deckBar');
      this.timer = { start: 0, acc: 0 };
      this.channel = 'BroadcastChannel' in window ? new BroadcastChannel('python-presenter') : null;
      this.bind();
    }

    get active() { return !$('slideView').classList.contains('hidden'); }

    // ---------------------------------------------------------------- 데이터
    open(ch, sec, index) {
      this.ch = ch;
      this.sec = sec;
      this.slides = this.build(ch, sec);
      const n = this.slides.length;
      this.index = index === 'last' ? n - 1 : Math.max(0, Math.min(n - 1, (index | 0)));
      $('notesPane').classList.toggle('collapsed', !this.notesOpen);
      $('notesToggle').textContent = this.notesOpen ? '▾ 접기' : '▸ 펴기';
      this.render();
    }

    build(ch, sec) {
      const list = (sec.slides || []).map((s) => Object.assign({}, s));
      const hasGoals = list.some((s) => s.layout === 'goals' || /학습\s*목표/.test(s.title || ''));
      let at = 0;
      if (!list.length || list[0].layout !== 'title') {
        list.unshift({ layout: 'title', title: sec.title, subtitle: ch.title, notes: '<p>섹션을 소개합니다.</p>', auto: true });
      }
      at = 1;
      if (!hasGoals && sec.goals && sec.goals.length) {
        list.splice(at, 0, {
          layout: 'goals', title: '학습 목표', goals: sec.goals, flow: sec.flow, auto: true,
          notes: `<p>이번 시간에 배울 내용을 소개합니다. 목표를 소리 내어 함께 읽고, 수업이 끝날 때 다시 확인합니다.</p>${(sec.flow || []).length ? `<p class="muted">수업 흐름: ${sec.flow.map((f) => `${esc(f[0])} ${f[1]}분`).join(' → ')}</p>` : ''}`
        });
      }
      return list;
    }

    // ---------------------------------------------------------------- 렌더링
    render() {
      const s = this.slides[this.index];
      if (!s) { this.layer.innerHTML = ''; return; }
      const teacher = this.app.role === 'teacher';
      this.editor = null;
      const key = `${this.sec.id}@${this.index}`;
      const top = `<div class="s-top"><span class="s-ch">${esc(this.ch.no)}차시</span><span>${esc(this.ch.title)}</span><span class="spacer"></span><span>${esc(this.sec.title)}</span></div>`;
      const foot = `<div class="s-foot"><span>🕵️ AI 에이전트 구축</span><span class="spacer"></span><span class="pg">${this.index + 1} / ${this.slides.length}</span></div>`;
      const title = `<h2 class="s-title">${s.title || ''}</h2>`;
      const lead = s.lead ? `<p class="s-lead">${s.lead}</p>` : '';
      let html = '';
      let cls = 'slide';

      switch (s.layout) {
        case 'title':
          cls += ' title-slide';
          html = `<div class="badge">${esc(s.badge || `${this.ch.no}차시 · ${this.ch.title}`)}</div>
            <h1>${s.title}</h1>
            ${s.subtitle ? `<div class="sub">${s.subtitle}</div>` : ''}
            <div class="meta"><span>⏱ ${this.sec.minutes || 50}분</span><span>🖼️ 슬라이드 ${this.slides.length}장</span></div>
            <div class="deco">${esc(this.ch.icon || '🤖')}</div>`;
          break;
        case 'goals':
          html = top + title + `<div class="s-body"><div class="s-goals${s.goals.length > 3 ? ' dense' : ''}">${s.goals.map((g) => `<div>${g}</div>`).join('')}</div>
            ${(s.flow || []).length ? `<div class="s-flow">${s.flow.map((f) => `<div style="flex:${f[1]}"><b>${esc(f[0])}</b> ${f[1]}분</div>`).join('')}</div>` : ''}</div>` + foot;
          break;
        case 'bullets':
          html = top + title + lead + `<div class="s-body">${bulletsHtml(s.bullets, (s.bullets || []).length > 5)}</div>` + foot;
          break;
        case 'summary':
          cls += ' summary-slide';
          html = top + title + lead + `<div class="s-body">${bulletsHtml(s.bullets, (s.bullets || []).length > 5)}</div>` + foot;
          break;
        case 'code':
          html = top + title + lead + `<div class="s-body"><div class="s-code${s.points && s.points.length ? ' has-points' : ''}">
              <div class="s-editor">
                <div class="s-editor-bar"><span class="fname">${s.repl ? '&gt;&gt;&gt; 대화형 모드 (한 줄씩 실행)' : '📄 ' + esc(fileName(s.code))}</span>
                  <button class="btn ghost small" data-act="font-" title="글자 작게">A−</button>
                  <button class="btn ghost small" data-act="font+" title="글자 크게">A+</button>
                  <button class="btn ghost small" data-act="reset" title="원래 코드로">↺</button>
                  <button class="btn primary small" data-act="run" title="실행 (Ctrl+Enter)">▶ 실행</button></div>
                <div class="s-editor-host"></div>
                ${s.stdin ? `<div class="s-stdin">⌨ 입력 예: <code>${esc(s.stdin.replace(/\n$/, '').replace(/\n/g, ' ⏎ '))}</code> <button class="btn ghost small" data-act="run-stdin">예시 입력으로 실행</button></div>` : ''}
              </div>
              ${s.points && s.points.length ? `<ul class="s-points">${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
            </div></div>` + foot;
          break;
        case 'two': {
          const col = (c, i) => {
            if (!c) return '<div class="s-col"></div>';
            let inner = '';
            if (c.bullets) inner += bulletsHtml(c.bullets, true);
            if (c.html) inner += `<div>${JU.scoped(c.html)}</div>`;
            if (c.code) inner += `<pre class="s-static">${highlightInline(c.code)}</pre>`;
            const runBtn = c.code && c.run !== false ?`<button class="btn ghost small" data-act="run-col" data-col="${i}" style="float:right;font-size:1.1cqw">▶ 실행</button>` : '';
            return `<div class="s-col"><h3>${runBtn}${c.title || ''}</h3>${inner}</div>`;
          };
          html = top + title + lead + `<div class="s-body"><div class="s-two">${col(s.left, 'left')}${col(s.right, 'right')}</div></div>` + foot;
          break;
        }
        case 'table': {
          const rows = s.rows || [];
          const dense = rows.length > 6 || (s.head || []).length > 3;
          html = top + title + lead + `<div class="s-body"><table class="s-table${dense ? ' dense' : ''}"><thead><tr>${(s.head || []).map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` + foot;
          break;
        }
        case 'demo':
        case 'diagram':
          html = top + title + lead + `<div class="s-body"><div class="s-diagram"><div class="d-host">${s.layout === 'demo' ? `<div class="demo-wrap">${s.html}</div>` : JU.scoped(s.html)}</div>${s.caption ? `<div class="cap">${s.caption}</div>` : ''}</div></div>` + foot;
          break;
        case 'quiz':
          html = top + title + `<div class="s-body s-quiz"><div class="q">${s.q || ''}</div>
            <div class="opts">${(s.options || []).map((o, i) => `<button class="opt" data-opt="${i}"><span class="n">${i + 1}</span><span>${o}</span></button>`).join('')}</div>
            <div class="explain hidden">${s.explain || ''}</div>
            ${teacher ? '<div class="reveal"><button class="btn ghost small" data-act="reveal">정답 공개</button></div>' : ''}</div>` + foot;
          break;
        case 'practice': {
          const sol = !!this.solutionOn[key];
          html = top + title + `<div class="s-body"><div class="s-practice"><div class="desc">${s.desc || ''}</div>
              <div class="s-editor">
                <div class="s-editor-bar"><span class="fname">📝 ${sol ? '정답 코드' : '실습 코드'}</span>
                  ${teacher && s.solution ? `<button class="btn ghost small${sol ? ' sol-on' : ''}" data-act="solution" title="정답 코드 보기/숨기기">${sol ? '✓ 정답' : '🔑 정답'}</button>` : ''}
                  <button class="btn ghost small" data-act="reset" title="원래 코드로">↺</button>
                  <button class="btn primary small" data-act="run" title="실행 (Ctrl+Enter)">▶ 실행</button></div>
                <div class="s-editor-host"></div>
                ${s.stdin ? `<div class="s-stdin">⌨ 입력 예: <code>${esc(s.stdin.replace(/\n$/, '').replace(/\n/g, ' ⏎ '))}</code> <button class="btn ghost small" data-act="run-stdin">예시 입력으로 실행</button></div>` : ''}
              </div></div></div>` + foot;
          break;
        }
        default:
          html = top + title + `<div class="s-body">${s.html ? JU.scoped(s.html) : bulletsHtml(s.bullets)}</div>` + foot;
      }

      this.layer.innerHTML = `<div class="${cls}">${html}</div>`;
      const slideEl = this.layer.firstElementChild;

      // 코드 편집기
      const edHost = slideEl.querySelector('.s-editor-host');
      if (edHost) {
        const isPractice = s.layout === 'practice';
        const sol = isPractice && this.solutionOn[key];
        const editKey = key + (sol ? ':sol' : '');
        const original = isPractice ? (sol ? s.solution : (s.starter || '')) : s.code;
        const ed = makeEditor(edHost, this.edits[editKey] != null ? this.edits[editKey] : original, { onRun: () => this.runCode() });
        ed.on('change', () => { this.edits[editKey] = ed.getValue(); });
        const manual = +(Runner.store.get('jc.slideCodeFont', '0')) || 0;
        const fs = manual || autoCodeFont(ed.getValue(), !!(s.points && s.points.length), s.layout === 'practice');
        slideEl.querySelector('.s-editor').style.setProperty('--s-code-font', fs.toFixed(2) + 'cqw');
        this.editor = ed;
        this.editorOriginal = original;
        this.editorKey = editKey;
        requestAnimationFrame(() => ed.refresh());
      }

      if (typeof s.init === 'function') {
        try { s.init(slideEl.querySelector('.d-host') || slideEl, window.MLB); } catch (err) { console.error('slide init', err); }
      }
      slideEl.addEventListener('click', (e) => this.onSlideClick(e, s));
      if (window.Ink) Ink.setSlide(`${this.sec.id}@${this.index}`);
      if (this.isFull()) this.showConsole(false);   // 발표 중에는 쪽을 넘기면 결과 창을 닫는다
      this.updateChrome();
      this.renderNotes();
      this.broadcast();
      this.app.onSlideChange(this.sec, this.index);
      this.fit();
    }

    onSlideClick(e, s) {
      const act = e.target.closest('[data-act]');
      const opt = e.target.closest('[data-opt]');
      if (opt && s.layout === 'quiz') {
        const i = +opt.dataset.opt;
        opt.classList.add(i === s.answer ? 'right' : 'wrong');
        if (i === s.answer) this.layer.querySelector('.explain').classList.remove('hidden');
        return;
      }
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'run') this.runCode();
      else if (a === 'run-stdin') this.runCode(s.stdin);
      else if (a === 'reset' && this.editor) { this.editor.setValue(this.editorOriginal); delete this.edits[this.editorKey]; }
      else if (a === 'font+' || a === 'font-') {
        const cur = +(Runner.store.get('jc.slideCodeFont', '0')) || 1.45;
        const next = Math.max(0.9, Math.min(2.6, cur + (a === 'font+' ? 0.15 : -0.15)));
        Runner.store.set('jc.slideCodeFont', next.toFixed(2));
        this.layer.querySelector('.s-editor').style.setProperty('--s-code-font', next.toFixed(2) + 'cqw');
        this.editor && this.editor.refresh();
      } else if (a === 'solution') {
        const key = `${this.sec.id}@${this.index}`;
        this.solutionOn[key] = !this.solutionOn[key];
        this.render();
      } else if (a === 'reveal') {
        this.layer.querySelectorAll('.opt').forEach((o) => { if (+o.dataset.opt === s.answer) o.classList.add('right'); });
        this.layer.querySelector('.explain').classList.remove('hidden');
      } else if (a === 'run-col') {
        const c = s[act.dataset.col];
        this.showConsole(true);
        this.app.runCode(c.code, { label: `${s.title} · ${c.title || ''}`, repl: !!c.repl, stdin: c.repl ? c.code : undefined });
      }
    }

    runCode(stdin) {
      if (!this.editor) return;
      const s = this.slides[this.index];
      this.showConsole(true);
      const code = this.editor.getValue();
      if (s.repl) this.app.runCode(code, { label: s.title, repl: true, stdin: code });
      else this.app.runCode(code, { label: s.title, stdin, editor: this.editor });
    }

    renderNotes() {
      const pane = $('notesBody');
      if (this.app.role !== 'teacher') { pane.innerHTML = ''; return; }
      const s = this.slides[this.index];
      let answer = '';
      if (s.layout === 'quiz' && typeof s.answer === 'number') {
        answer = `<div class="answer"><b>정답: ${s.answer + 1}번</b> — ${(s.options || [])[s.answer] || ''}${s.explain ? `<div>${s.explain}</div>` : ''}</div>`;
      }
      if (s.layout === 'practice' && s.solution) {
        answer = `<div class="answer"><b>🔑 정답 코드</b> <button class="btn small ghost" id="noteRunSol">▶ 정답 실행</button> <button class="btn small ghost" id="noteShowSol">슬라이드에 표시</button>
          <pre style="margin:6px 0 0;font-size:12.5px;overflow:auto;max-height:260px">${highlightInline(s.solution)}</pre></div>`;
      }
      const flow = (this.sec.flow || []).map((f) => `<div class="row"><span>${esc(f[0])}</span><b>${f[1]}분</b></div>`).join('');
      const nextS = this.slides[this.index + 1];
      $('notesNext').textContent = nextS ? `다음: ${String(nextS.title || '').replace(/<[^>]+>/g, '')}` : '마지막 슬라이드';
      pane.innerHTML = `<div class="n-grid"><div class="n-notes">
          <h5>🗒 교사 노트 <span class="muted" style="font-weight:500">${LAYOUT_ICON[s.layout] || ''} ${LAYOUT_NAME[s.layout] || ''} · ${this.index + 1}/${this.slides.length}</span></h5>
          ${s.notes || '<p class="muted">노트 없음</p>'}${answer}</div>
        <div class="n-side"><h5>⏱ 수업 흐름 (${this.sec.minutes || 50}분)</h5>${flow || '<span class="muted">-</span>'}
          <h5 style="margin-top:12px">다음 슬라이드</h5><div>${nextS ? `${LAYOUT_ICON[nextS.layout] || ''} ${nextS.title}` : '<span class="muted">섹션의 마지막 슬라이드</span>'}</div></div></div>`;
      const run = $('noteRunSol');
      if (run) run.onclick = () => { this.showConsole(true); this.app.runCode(s.solution, { label: s.title + ' (정답)', stdin: s.stdin }); };
      const show = $('noteShowSol');
      if (show) show.onclick = () => { this.solutionOn[`${this.sec.id}@${this.index}`] = true; this.render(); };
    }

    updateChrome() {
      const n = this.slides.length;
      const s = this.slides[this.index] || {};
      $('sCount').textContent = `${this.index + 1} / ${n}`;
      const sl = $('sSlider');
      sl.max = String(Math.max(1, n));
      sl.value = String(this.index + 1);
      $('sTitle').textContent = String(s.title || '').replace(/<[^>]+>/g, '');
      $('deckProgress').style.width = (n > 1 ? (this.index / (n - 1)) * 100 : 100) + '%';
      this.updateInkBar();
      if (!$('gridOverlay').classList.contains('hidden')) this.renderGrid();
    }

    // ---------------------------------------------------------------- 판서 도구 막대
    buildInkBar() {
      if (!window.Ink) return;
      $('inkColors').innerHTML = Ink.COLORS.map(([c, name]) =>
        `<button class="ink-color" data-color="${c}" title="${name}" style="--c:${c}"></button>`).join('');
      $('inkWidths').innerHTML = Ink.WIDTHS.map(([w, name]) =>
        `<button class="ink-width" data-width="${w}" title="${name} (${w})"><i style="width:${Math.min(14, w)}px;height:${Math.min(14, w)}px"></i></button>`).join('');
      $('inkBar').addEventListener('click', (e) => {
        const t = e.target.closest('[data-tool]');
        if (t) return Ink.setTool(t.dataset.tool);
        const c = e.target.closest('[data-color]');
        if (c) return Ink.setColor(c.dataset.color);
        const w = e.target.closest('[data-width]');
        if (w) return Ink.setWidth(+w.dataset.width);
      });
      $('inkUndo').onclick = () => Ink.undo();
      $('inkClear').onclick = () => Ink.clearSlide();
      $('inkClearAll').onclick = () => { if (confirm('이 강의의 판서를 모두 지울까요?')) Ink.clearAll(); };
      Ink.onChange = () => this.updateInkBar();
      Ink.init(this.stage, $('inkCanvas'));
    }

    updateInkBar() {
      if (!window.Ink) return;
      document.querySelectorAll('#inkTools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === Ink.tool));
      document.querySelectorAll('#inkColors [data-color]').forEach((b) => b.classList.toggle('on', b.dataset.color === Ink.color));
      document.querySelectorAll('#inkWidths [data-width]').forEach((b) => b.classList.toggle('on', +b.dataset.width === Ink.width));
      $('inkUndo').disabled = !Ink.canUndo();
      $('inkClear').disabled = !Ink.hasInk();
    }

    // ---------------------------------------------------------------- 이동
    go(i) {
      if (i < 0) return this.app.stepSection(-1, 'last');
      if (i >= this.slides.length) return this.app.stepSection(1, 0);
      this.index = i;
      this.render();
    }
    next() { this.go(this.index + 1); }
    prev() { this.go(this.index - 1); }

    renderGrid() {
      const g = $('gridOverlay');
      g.innerHTML = `<h4>▦ ${esc(this.sec.title)} <span class="muted" style="font-weight:500">슬라이드 ${this.slides.length}장</span><span class="spacer"></span><button class="btn small ghost" data-close>닫기 (Esc)</button></h4>
        <div class="grid-list">${this.slides.map((s, i) => `<button class="grid-item${i === this.index ? ' cur' : ''}" data-i="${i}">
          <span class="gi-n">${i + 1}</span><span class="gi-l">${LAYOUT_ICON[s.layout] || ''} ${LAYOUT_NAME[s.layout] || s.layout}</span>
          <span class="gi-t">${String(s.title || '').replace(/<[^>]+>/g, '')}</span></button>`).join('')}</div>`;
    }
    toggleGrid(force) {
      const g = $('gridOverlay');
      const show = force != null ? force : g.classList.contains('hidden');
      g.classList.toggle('hidden', !show);
      if (show) this.renderGrid();
    }

    toggleNotes() {
      this.notesOpen = !this.notesOpen;
      Runner.store.set('jc.notesOpen', this.notesOpen ? '1' : '0');
      $('notesPane').classList.toggle('collapsed', !this.notesOpen);
      $('notesToggle').textContent = this.notesOpen ? '▾ 접기' : '▸ 펴기';
      this.fit();
    }

    // ---------------------------------------------------------------- 전체 화면 · 결과 패널
    isFull() { return this.wrap.classList.contains('is-full'); }

    async toggleFull() {
      if (this.isFull()) {
        if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (e) { /* 무시 */ } }
        this.wrap.classList.remove('pfull');
        this.onFullChange();
        return;
      }
      try {
        if (!this.wrap.requestFullscreen) throw new Error('unsupported');
        await this.wrap.requestFullscreen();
      } catch (e) {
        // 전체 화면 API 를 쓸 수 없는 환경(iframe 등): 창 전체를 채우는 발표 모드
        this.wrap.classList.add('pfull');
        this.onFullChange();
      }
    }

    onFullChange() {
      const panel = $('consolePanel');
      const slot = $('fsConsoleSlot');
      const full = document.fullscreenElement === this.wrap || this.wrap.classList.contains('pfull');
      this.wrap.classList.toggle('is-full', full);
      this.wrap.classList.remove('bar-on');
      this.barHover = false;
      if (full) {
        slot.appendChild(panel);
        this.fsConsole = false;
        slot.classList.add('off');
        this.wrap.insertBefore(this.bar, this.wrap.firstChild);   // 상단 메뉴: 마우스를 위로 올리면 나타남
        this.wrap.appendChild($('modal'));
        this.wrap.appendChild($('toast'));
      } else {
        $('output').appendChild(panel);
        $('slideView').insertBefore(this.bar, this.wrap);
        document.body.appendChild($('modal'));
        document.body.appendChild($('toast'));
      }
      document.body.classList.toggle('presenting', full);
      this.fit();
      setTimeout(() => this.fit(), 120);
    }

    showConsole(on) {
      this.fsConsole = on;
      $('fsConsoleSlot').classList.toggle('off', !on);
      this.fit();
    }

    fit() {
      const host = this.host;
      const cs = getComputedStyle(host);
      const w = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (w <= 0 || h <= 0) return;
      const width = Math.floor(Math.min(w, h * 16 / 9));
      if (this.stage.style.width !== width + 'px') {
        this.stage.style.width = width + 'px';
        this.stage.style.setProperty('--edge-w', Math.max(28, Math.round(width * 0.06)) + 'px');
        if (this.editor) requestAnimationFrame(() => this.editor && this.editor.refresh());
      }
    }

    blackout(force) {
      const b = $('blackout');
      b.classList.toggle('hidden', force != null ? !force : !b.classList.contains('hidden'));
    }

    // ---------------------------------------------------------------- 타이머
    timerToggle() {
      if (this.timer.start) { this.timer.acc += Date.now() - this.timer.start; this.timer.start = 0; }
      else this.timer.start = Date.now();
      this.timerDraw();
    }
    timerReset() { this.timer.acc = 0; if (this.timer.start) this.timer.start = Date.now(); this.timerDraw(); }
    timerDraw() {
      const ms = this.timer.acc + (this.timer.start ? Date.now() - this.timer.start : 0);
      const m = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60;
      $('timerText').textContent = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      $('timerBox').classList.toggle('running', !!this.timer.start);
      $('timerBox').classList.toggle('over', this.sec && m >= (this.sec.minutes || 50));
      $('timerBox').title = this.timer.start ? '수업 타이머 진행 중 — 눌러서 일시정지 (T)' : '수업 타이머 — 눌러서 시작 (T)';
    }

    // ---------------------------------------------------------------- 발표자 창
    broadcast() {
      if (!this.channel || !this.sec) return;
      const s = this.slides[this.index];
      const n = this.slides[this.index + 1];
      let notes = s.notes || '';
      if (s.layout === 'quiz' && typeof s.answer === 'number') notes += `<p><b>정답: ${s.answer + 1}번</b> ${(s.options || [])[s.answer] || ''}</p>`;
      this.channel.postMessage({
        type: 'state', lesson: `${this.ch.no}차시 ${this.ch.title} · ${this.sec.title}`, index: this.index, total: this.slides.length,
        title: s.title, notes, next: n ? n.title : '', schedule: this.sec.flow || [], minutes: this.sec.minutes || 50
      });
    }

    // ---------------------------------------------------------------- 이벤트
    bind() {
      $('sFirst').onclick = () => this.go(0);
      $('sPrev').onclick = () => this.prev();
      $('sNext').onclick = () => this.next();
      $('sGrid').onclick = () => this.toggleGrid();
      $('sDoc').onclick = () => this.app.setView('doc');
      $('sFull').onclick = () => this.toggleFull();
      $('sPresenter').onclick = () => { window.open('presenter.html', 'python-presenter', 'width=1100,height=720'); setTimeout(() => this.broadcast(), 800); };
      $('timerBtn').onclick = () => this.timerToggle();
      $('timerReset').onclick = () => this.timerReset();
      $('consoleHideBtn').onclick = () => this.showConsole(false);
      $('notesHead').onclick = (e) => { if (!e.target.closest('a')) this.toggleNotes(); };
      $('sSlider').addEventListener('input', (e) => { const i = +e.target.value - 1; if (i !== this.index) { this.index = Math.max(0, Math.min(this.slides.length - 1, i)); this.render(); } });
      this.buildInkBar();
      setInterval(() => this.timerDraw(), 500);

      // 슬라이드 좌우 가장자리 클릭 = 이전/다음
      this.stage.addEventListener('click', (e) => {
        const edge = e.target.closest('.edge');
        if (!edge) return;
        if (window.Ink && (Ink.drawing || Ink.justDrew)) return;
        if (edge.dataset.edge === 'prev') this.prev(); else this.next();
      });

      $('gridOverlay').addEventListener('click', (e) => {
        const it = e.target.closest('[data-i]');
        if (it) { this.toggleGrid(false); this.go(+it.dataset.i); }
        if (e.target.closest('[data-close]')) this.toggleGrid(false);
      });
      document.addEventListener('fullscreenchange', () => this.onFullChange());
      new ResizeObserver(() => this.fit()).observe(this.host);

      let idleT = 0;
      this.wrap.addEventListener('mousemove', (e) => {
        this.wrap.classList.remove('idle');
        clearTimeout(idleT);
        idleT = setTimeout(() => { if (this.isFull() && !this.barHover) this.wrap.classList.add('idle'); }, 2500);
        if (this.isFull()) {
          const r = this.wrap.getBoundingClientRect();
          const near = e.clientY - r.top < Math.max(70, this.bar.offsetHeight + 10);
          this.wrap.classList.toggle('bar-on', near);
        }
      });
      this.bar.addEventListener('pointerenter', () => { this.barHover = true; this.wrap.classList.add('bar-on'); });
      this.bar.addEventListener('pointerleave', () => { this.barHover = false; });

      document.addEventListener('keydown', (e) => {
        if (!this.active || !this.sec) return;
        if (!$('modal').classList.contains('hidden')) return;
        const t = e.target;
        if (t.closest && (t.closest('.gw') || t.closest('.gd-back'))) return; // 파이썬 GUI 창(거북이 · tkinter)의 키 입력
        if (t.closest && (t.closest('.CodeMirror') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) {
          if (e.key === 'Escape' && t.closest('.CodeMirror')) t.blur ? document.activeElement.blur() : 0;
          return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
          if (this.app.role === 'teacher' && window.Ink) { e.preventDefault(); Ink.undo(); }
          return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;
        if (['ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); this.next(); }
        else if (['ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); this.prev(); }
        else if (k === 'Home') { e.preventDefault(); this.go(0); }
        else if (k === 'End') { e.preventDefault(); this.go(this.slides.length - 1); }
        else if (k === 'f' || k === 'F') { e.preventDefault(); this.toggleFull(); }
        else if (k === 'g' || k === 'G') { e.preventDefault(); this.toggleGrid(); }
        else if (k === 'r' || k === 'R') { e.preventDefault(); if (this.isFull()) this.showConsole(!this.fsConsole); }
        else if ((k === 'n' || k === 'N') && this.app.role === 'teacher') { e.preventDefault(); this.toggleNotes(); }
        else if (k === 'b' || k === 'B' || k === '.') { e.preventDefault(); this.blackout(); }
        else if ((k === 't' || k === 'T') && this.app.role === 'teacher') { e.preventDefault(); this.timerToggle(); }
        else if (k === 'Escape') {
          if (this.app.closeLightbox && this.app.closeLightbox()) { e.preventDefault(); return; }   // 크게 보기만 닫는다
          const gridOpen = !$('gridOverlay').classList.contains('hidden');
          const black = !$('blackout').classList.contains('hidden');
          if (gridOpen) { this.toggleGrid(false); return; }
          if (black) { this.blackout(false); return; }
          if (this.wrap.classList.contains('pfull')) this.toggleFull();
        }
      });

      if (this.channel) {
        this.channel.onmessage = (ev) => {
          const m = ev.data || {};
          if (m.type === 'hello') this.broadcast();
          if (m.type === 'nav' && this.active) { if (m.dir > 0) this.next(); else this.prev(); }
        };
      }
    }
  }

  window.Deck = Deck;
})();
