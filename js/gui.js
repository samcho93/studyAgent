/* 파이썬 GUI 화면 (tkinter · turtle · pygame 호환 모듈이 보낸 그리기 명령을 페이지 위의 창으로 그린다)
 * - 창: 제목 막대(끌어서 이동, ✕ 닫기), 메뉴 막대, 위젯(pack · grid · place 배치), 캔버스
 * - 대화상자: messagebox · simpledialog · filedialog · colorchooser
 * - 이벤트: 마우스 · 키보드 · 위젯 값 변경을 파이썬으로 돌려보낸다 (PyEngine.send)
 */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DEF_FONT = '12px "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const DPR = () => Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const send = (m) => window.PyEngine && PyEngine.send(m);

  const G = {
    wins: new Map(),      // 창 id → win
    w: new Map(),         // 위젯 id → rec
    images: new Map(),    // 이미지 id → { bmp, w, h, src?, users:Set }
    sounds: new Map(),
    globalWants: new Set(),
    z: 10, cascade: 0, layer: null, dirty: new Set(), raf: 0
  };

  // ================================================================== 공용
  function layer() {
    if (!G.layer) {
      G.layer = document.createElement('div');
      G.layer.id = 'guiLayer';
      G.layer.className = 'gui-layer';
      document.body.appendChild(G.layer);
      document.addEventListener('fullscreenchange', placeLayer);
    }
    return G.layer;
  }
  function placeLayer() {
    const host = document.fullscreenElement || document.body;
    if (G.layer && G.layer.parentNode !== host) host.appendChild(G.layer);
  }

  const colorCanvas = document.createElement('canvas').getContext('2d');
  const colorCache = new Map();
  function css(c, fallback) {
    if (c == null || c === '') return fallback;
    c = String(c);
    if (colorCache.has(c)) return colorCache.get(c);
    let out = c;
    const sys = { systembuttonface: '#f0f0f0', systemwindow: '#ffffff', systembuttontext: '#000000', systemwindowtext: '#000000', systemhighlight: '#0078d7', systemhighlighttext: '#ffffff' };
    if (sys[c.toLowerCase()]) out = sys[c.toLowerCase()];
    else if (c.startsWith('x11:')) {
      const [, base, n] = c.split(':');
      colorCanvas.fillStyle = '#000';
      colorCanvas.fillStyle = base;
      const hex = colorCanvas.fillStyle;
      const f = [1, 1, 0.932, 0.804, 0.545][+n] || 1;
      if (/^#[0-9a-f]{6}$/i.test(hex)) {
        const v = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f));
        out = '#' + v.map((x) => x.toString(16).padStart(2, '0')).join('');
      } else out = base;
    } else {
      colorCanvas.fillStyle = '#010203';
      colorCanvas.fillStyle = c;
      if (colorCanvas.fillStyle === '#010203' && c.toLowerCase() !== '#010203') {
        colorCanvas.fillStyle = '#010203';
        colorCanvas.fillStyle = c.replace(/\s+/g, '');
        out = colorCanvas.fillStyle === '#010203' ? (fallback || '#000') : colorCanvas.fillStyle;
      }
    }
    colorCache.set(c, out);
    return out;
  }

  // 기준점(anchor): 'n','ne','e','se','s','sw','w','nw','center' → 0 ~ 1 비율
  const AX = (a) => (!a || a === 'center') ? 0.5 : /w/.test(a) ? 0 : /e/.test(a) ? 1 : 0.5;
  const AY = (a) => (!a || a === 'center') ? 0.5 : /^n/.test(a) ? 0 : /^s/.test(a) ? 1 : 0.5;

  function fontOf(f) {
    if (!f) return { font: DEF_FONT, deco: '' };
    const [font, deco] = String(f).split('|');
    return { font, deco: deco || '' };
  }
  function fontPx(font) {
    const m = /(\d+(?:\.\d+)?)px/.exec(font || '');
    return m ? +m[1] : 12;
  }
  const measureCtx = document.createElement('canvas').getContext('2d');
  function charW(font) {
    measureCtx.font = font || DEF_FONT;
    return measureCtx.measureText('0').width;
  }

  // ================================================================== 초기화 · 명령 처리
  G.reset = function () {
    for (const win of G.wins.values()) win.el.remove();
    G.wins.clear();
    G.w.clear();
    for (const img of G.images.values()) { if (img.bmp && img.bmp.close) try { img.bmp.close(); } catch (e) { /* 무시 */ } }
    G.images.clear();
    for (const s of G.sounds.values()) { try { s.audio.pause(); } catch (e) { /* 무시 */ } }
    G.sounds.clear();
    G.globalWants.clear();
    G.cascade = 0;
    closeMenus();
    if (G.layer) G.layer.querySelectorAll('.gd-back').forEach((d) => d.remove());
  };

  G.hasWindows = () => G.wins.size > 0;

  G.apply = function (json) {
    let ops;
    try { ops = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return; }
    for (const op of ops) {
      const h = OPS[op.op];
      if (h) {
        try { h(op); } catch (e) { console.warn('GUI op 오류', op, e); }
      }
    }
    schedule();
  };

  function schedule() {
    if (G.raf) return;
    G.raf = requestAnimationFrame(() => {
      G.raf = 0;
      for (const win of G.wins.values()) {
        if (win.needLayout) { win.needLayout = false; layoutWindow(win); }
        if (win.canvasDirty.size) {
          for (const id of win.canvasDirty) { const rec = G.w.get(id); if (rec) drawCanvas(rec); }
          win.canvasDirty.clear();
        }
      }
    });
  }

  function winOf(rec) {
    while (rec && !rec.isWin) rec = G.w.get(rec.parent);
    return rec ? G.wins.get(rec.id) : null;
  }
  function markLayout(rec) {
    const win = winOf(rec);
    if (win) win.needLayout = true;
  }

  // ================================================================== 창
  function makeWindow(id, title, kind) {
    const L = layer();
    const el = document.createElement('div');
    el.className = 'gw' + (kind === 'pg' ? ' gw-pg' : '');
    el.tabIndex = -1;
    el.innerHTML = `<div class="gw-title"><span class="gw-icon">${kind === 'pg' ? '🎮' : '🪶'}</span><span class="gw-t"></span>
      <span class="gw-sp"></span><button class="gw-btn gw-min" title="창 접기">—</button><button class="gw-btn gw-close" title="닫기">✕</button></div>
      <div class="gw-menubar hidden"></div><div class="gw-clip"><div class="gw-body"></div></div>`;
    L.appendChild(el);
    const win = {
      id, el, kind, title: el.querySelector('.gw-t'), body: el.querySelector('.gw-body'), clip: el.querySelector('.gw-clip'),
      menubar: el.querySelector('.gw-menubar'), scale: 1, geomW: null, geomH: null, needLayout: true, canvasDirty: new Set(),
      wants: new Set(), focusWidget: null, lastSizes: '', placed: false, minimized: false
    };
    win.title.textContent = title || 'tk';
    G.wins.set(id, win);
    el.style.zIndex = ++G.z;
    // 끌어서 이동
    const bar = el.querySelector('.gw-title');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.gw-btn')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const lr = G.layer.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        el.style.left = Math.max(-r.width + 80, Math.min(lr.width - 60, ev.clientX - lr.left - dx)) + 'px';
        el.style.top = Math.max(0, Math.min(lr.height - 30, ev.clientY - lr.top - dy)) + 'px';
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });
    el.addEventListener('pointerdown', () => { el.style.zIndex = ++G.z; G.active = win; }, true);
    el.querySelector('.gw-close').onclick = () => {
      if (kind === 'pg') send({ k: 'pg', id, t: 'close' });
      else send({ k: 'ev', id, t: 'close' });
    };
    el.querySelector('.gw-min').onclick = () => {
      win.minimized = !win.minimized;
      el.classList.toggle('minimized', win.minimized);
    };
    // 키보드
    el.addEventListener('keydown', (e) => onKey(win, e, true));
    el.addEventListener('keyup', (e) => onKey(win, e, false));
    G.active = win;
    return win;
  }

  function placeWindow(win, w, h) {
    if (win.placed) return;
    win.placed = true;
    const L = layer().getBoundingClientRect();
    const out = document.getElementById('output');
    const ow = out && out.offsetParent ? out.getBoundingClientRect().width : 0;
    let x = Math.max(8, L.width - ow - w - 40 - G.cascade * 26);
    let y = Math.max(8, Math.min(80 + G.cascade * 26, L.height - h - 60));
    if (x + w > L.width) x = Math.max(8, L.width - w - 8);
    win.el.style.left = x + 'px';
    win.el.style.top = y + 'px';
    G.cascade = (G.cascade + 1) % 6;
    setTimeout(() => { try { win.el.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 30);
  }

  function fitScale(win, w, h) {
    const L = layer().getBoundingClientRect();
    const s = Math.min(1, (L.width - 24) / Math.max(1, w), (L.height - 70) / Math.max(1, h));
    win.scale = Math.max(0.3, s);
    win.body.style.transform = win.scale < 1 ? `scale(${win.scale})` : '';
    win.clip.style.width = Math.ceil(w * win.scale) + 'px';
    win.clip.style.height = Math.ceil(h * win.scale) + 'px';
    win.body.style.width = w + 'px';
    win.body.style.height = h + 'px';
  }

  function closeWindow(id) {
    const win = G.wins.get(id);
    if (!win) return;
    win.el.remove();
    G.wins.delete(id);
    for (const [wid, rec] of G.w) if (rec.winId === id) G.w.delete(wid);
    if (!G.wins.size) G.cascade = 0;
    if (G.onWindowsChange) G.onWindowsChange();
  }

  // ================================================================== 위젯 만들기
  function newRec(id, cls, parent, el) {
    const p = G.w.get(parent);
    const rec = {
      id, cls, parent, el, cfg: {}, geo: null, children: [], packList: [], gridCfg: { col: {}, row: {} },
      prop: true, req: { w: 1, h: 1 }, wants: new Set(), winId: p ? p.winId : parent, isWin: false, box: [0, 0, 0, 0]
    };
    el.dataset.wid = id;
    el.classList.add('tkw');
    G.w.set(id, rec);
    if (p) { p.children.push(id); (p.inner || p.el).appendChild(el); }
    bindMouse(rec);
    return rec;
  }

  function createWidget(op) {
    const cls = op.c;
    let el;
    switch (cls) {
      case 'button': el = document.createElement('div'); el.className = 'tk-button'; el.innerHTML = '<span class="tk-c"></span>'; break;
      case 'label': case 'message': el = document.createElement('div'); el.className = 'tk-label'; el.innerHTML = '<span class="tk-c"></span>'; break;
      case 'checkbutton': case 'radiobutton':
        el = document.createElement('label');
        el.className = 'tk-check';
        el.innerHTML = `<input type="${cls === 'checkbutton' ? 'checkbox' : 'radio'}"><span class="tk-c"></span>`;
        break;
      case 'entry': case 'spinbox': case 'combobox':
        el = document.createElement('div'); el.className = 'tk-entry';
        el.innerHTML = `<input type="text" spellcheck="false">${cls === 'spinbox' ? '<span class="tk-spin"><b data-d="1">▲</b><b data-d="-1">▼</b></span>' : ''}${cls === 'combobox' ? '<select class="tk-combo"></select>' : ''}`;
        break;
      case 'text': el = document.createElement('div'); el.className = 'tk-text'; el.innerHTML = '<textarea spellcheck="false"></textarea>'; break;
      case 'listbox': el = document.createElement('div'); el.className = 'tk-listbox'; el.tabIndex = 0; break;
      case 'scale': el = document.createElement('div'); el.className = 'tk-scale'; el.innerHTML = '<div class="tk-scale-label"></div><div class="tk-scale-val"></div><input type="range">'; break;
      case 'canvas': el = document.createElement('div'); el.className = 'tk-canvas'; el.innerHTML = '<canvas></canvas><div class="tk-hl"></div>'; break;
      case 'scrollbar': el = document.createElement('div'); el.className = 'tk-scrollbar'; break;
      case 'optionmenu': el = document.createElement('div'); el.className = 'tk-option'; el.innerHTML = '<select></select>'; break;
      case 'progress': el = document.createElement('div'); el.className = 'tk-progress'; el.innerHTML = '<i></i>'; break;
      case 'labelframe': el = document.createElement('div'); el.className = 'tk-labelframe'; el.innerHTML = '<span class="tk-lf-label"></span>'; break;
      case 'menu': el = document.createElement('div'); el.className = 'tk-menu-hidden'; break;
      default: el = document.createElement('div'); el.className = 'tk-frame';
    }
    const rec = newRec(op.id, cls, op.p, el);
    if (cls === 'canvas') { rec.items = new Map(); rec.order = []; rec.canvas = el.querySelector('canvas'); }
    if (cls === 'listbox') { rec.items = []; rec.sel = []; }
    wireWidget(rec);
    return rec;
  }

  function wireWidget(rec) {
    const el = rec.el;
    switch (rec.cls) {
      case 'button':
        el.addEventListener('pointerdown', (e) => { if (e.button === 0 && rec.cfg.state !== 'disabled') el.classList.add('down'); });
        el.addEventListener('pointerleave', () => el.classList.remove('down'));
        el.addEventListener('pointerup', (e) => {
          if (e.button !== 0) return;
          const was = el.classList.contains('down');
          el.classList.remove('down');
          if (was && rec.cfg.state !== 'disabled') send({ k: 'ev', id: rec.id, t: 'cmd' });
        });
        break;
      case 'checkbutton': case 'radiobutton': {
        const inp = el.querySelector('input');
        inp.addEventListener('click', (e) => {
          if (rec.cfg.state === 'disabled') { e.preventDefault(); return; }
          if (rec.cls === 'radiobutton') {
            // 같은 변수를 쓰는 라디오버튼들의 표시 갱신은 파이썬이 알려 준다
            send({ k: 'ev', id: rec.id, t: 'toggle', v: true });
          } else send({ k: 'ev', id: rec.id, t: 'toggle', v: inp.checked });
        });
        break;
      }
      case 'entry': case 'spinbox': case 'combobox': {
        const inp = el.querySelector('input');
        inp.addEventListener('input', () => send({ k: 'ev', id: rec.id, t: 'value', v: inp.value }));
        inp.addEventListener('focus', () => { const w = winOf(rec); if (w) w.focusWidget = rec.id; });
        if (rec.cls === 'spinbox') {
          el.querySelector('.tk-spin').addEventListener('click', (e) => {
            const d = +(e.target.dataset.d || 0);
            if (!d) return;
            const vals = rec.cfg.values;
            let v;
            if (vals && vals.length) {
              const list = Array.isArray(vals) ? vals.map(String) : String(vals).split(/\s+/);
              const i = Math.max(0, list.indexOf(inp.value));
              v = list[Math.max(0, Math.min(list.length - 1, i + d))];
            } else {
              const step = +(rec.cfg.increment || 1);
              const lo = +(rec.cfg.from || 0), hi = +(rec.cfg.to || 0);
              let n = (parseFloat(inp.value) || 0) + d * step;
              if (hi > lo) n = Math.max(lo, Math.min(hi, n));
              v = Number.isInteger(step) && Number.isInteger(lo) ? String(Math.round(n)) : String(+n.toFixed(6));
            }
            inp.value = v;
            send({ k: 'ev', id: rec.id, t: 'value', v });
            send({ k: 'ev', id: rec.id, t: 'spin' });
          });
        }
        if (rec.cls === 'combobox') {
          const sel = el.querySelector('select');
          sel.addEventListener('change', () => { inp.value = sel.value; send({ k: 'ev', id: rec.id, t: 'value', v: sel.value, pick: true }); sel.selectedIndex = -1; });
        }
        break;
      }
      case 'text': {
        const ta = el.querySelector('textarea');
        ta.addEventListener('input', () => send({ k: 'ev', id: rec.id, t: 'value', v: ta.value }));
        ta.addEventListener('focus', () => { const w = winOf(rec); if (w) w.focusWidget = rec.id; });
        break;
      }
      case 'listbox':
        el.addEventListener('pointerdown', (e) => {
          const row = e.target.closest('.tk-li');
          if (!row) return;
          const i = +row.dataset.i;
          const mode = rec.cfg.selectmode || 'browse';
          if (mode === 'multiple') rec.sel = rec.sel.includes(i) ? rec.sel.filter((x) => x !== i) : rec.sel.concat(i);
          else if (mode === 'extended' && (e.ctrlKey || e.metaKey)) rec.sel = rec.sel.includes(i) ? rec.sel.filter((x) => x !== i) : rec.sel.concat(i);
          else rec.sel = [i];
          renderListbox(rec);
          send({ k: 'ev', id: rec.id, t: 'select', sel: rec.sel.slice().sort((a, b) => a - b) });
        });
        el.addEventListener('focus', () => { const w = winOf(rec); if (w) w.focusWidget = rec.id; });
        break;
      case 'scale': {
        const r = el.querySelector('input');
        r.addEventListener('input', () => {
          el.querySelector('.tk-scale-val').textContent = fmtScale(rec, +r.value);
          send({ k: 'ev', id: rec.id, t: 'value', v: +r.value });
        });
        break;
      }
      case 'optionmenu': {
        const s = el.querySelector('select');
        s.addEventListener('change', () => send({ k: 'ev', id: rec.id, t: 'value', i: s.selectedIndex, v: s.value }));
        break;
      }
      default:
    }
  }

  function fmtScale(rec, v) {
    const res = +(rec.cfg.resolution || 1);
    return res >= 1 && Number.isInteger(res) ? String(Math.round(v)) : String(+v.toFixed(Math.max(0, -Math.floor(Math.log10(res)))));
  }

  // ================================================================== 위젯 설정 반영
  function reliefCss(relief, bd, dflt) {
    bd = bd == null ? dflt : +bd;
    if (!bd || relief === 'flat') return { border: bd ? `${bd}px solid transparent` : 'none', bd: bd || 0 };
    const style = { raised: 'outset', sunken: 'inset', groove: 'groove', ridge: 'ridge', solid: 'solid' }[relief] || 'solid';
    const col = relief === 'solid' ? '#000' : '#c8c8c8';
    return { border: `${bd}px ${style} ${col}`, bd };
  }

  function applyCfg(rec, o) {
    Object.assign(rec.cfg, o);
    const c = rec.cfg;
    const el = rec.el;
    const f = fontOf(c.font);
    el.style.font = f.font;
    el.style.textDecoration = f.deco;
    if ('background' in o || 'foreground' in o) {
      el.style.background = css(c.background, '');
      el.style.color = css(c.foreground, '');
    }
    const cls = rec.cls;
    if (rec.isWin) {
      rec.el.style.background = css(c.background, '#f0f0f0');
      markLayout(rec);
      return;
    }
    if (['frame', 'labelframe'].includes(cls)) {
      const def = cls === 'labelframe' ? 2 : 0;
      const r = reliefCss(c.relief || (cls === 'labelframe' ? 'groove' : 'flat'), c.borderwidth, def);
      el.style.border = r.border;
      if (cls === 'labelframe') el.querySelector('.tk-lf-label').textContent = c.text || '';
    }
    if (['label', 'message', 'button', 'checkbutton', 'radiobutton'].includes(cls)) {
      const content = el.querySelector('.tk-c');
      const img = c.image ? G.images.get(c.image) : null;
      const txt = c.text == null ? '' : String(c.text);
      const compound = c.compound || 'none';
      let html = '';
      const imgHtml = c.image ? `<canvas class="tk-img" data-img="${esc(c.image)}"></canvas>` : '';
      const textHtml = `<span class="tk-t">${esc(txt)}</span>`;
      if (c.image && (compound === 'none' || !txt)) html = imgHtml;
      else if (c.image) {
        html = compound === 'left' || compound === 'top' ? imgHtml + textHtml : compound === 'center' ? `<span class="tk-stack">${imgHtml}${textHtml}</span>` : textHtml + imgHtml;
      } else html = textHtml;
      content.innerHTML = html;
      content.className = 'tk-c' + (compound === 'top' || compound === 'bottom' ? ' col' : '');
      content.querySelectorAll('canvas.tk-img').forEach((cv) => drawImageInto(cv, c.image));
      if (img) img.users.add(rec.id);
      const anchor = c.anchor || 'center';
      el.style.justifyContent = ['flex-start', 'center', 'flex-end'][AX(anchor) * 2];
      el.style.alignItems = ['flex-start', 'center', 'flex-end'][AY(anchor) * 2];
      el.style.textAlign = c.justify || 'center';
      const wl = +(c.wraplength || 0);
      el.querySelectorAll('.tk-t').forEach((t) => { t.style.whiteSpace = wl > 0 ? 'pre-wrap' : 'pre'; t.style.maxWidth = wl > 0 ? wl + 'px' : ''; });
      const padx = c.padx != null ? +c.padx : 1, pady = c.pady != null ? +c.pady : 1;
      el.style.padding = `${pady}px ${padx}px`;
      if (cls === 'button') {
        const custom = c.relief || c.borderwidth != null || c.background;
        el.classList.toggle('custom', !!custom);
        const r = reliefCss(c.relief || 'raised', c.borderwidth, 2);
        el.style.border = custom ? r.border : '';
        el.classList.toggle('disabled', c.state === 'disabled');
      } else {
        const r = reliefCss(c.relief || 'flat', c.borderwidth, 0);
        el.style.border = r.border;
      }
      if (cls === 'checkbutton' || cls === 'radiobutton') {
        const inp = el.querySelector('input');
        if ('checked' in o) inp.checked = !!o.checked;
        if (cls === 'radiobutton' && c.group) inp.name = rec.winId + ':' + c.group;
        inp.disabled = c.state === 'disabled';
        inp.style.display = c.indicatoron === 0 || c.indicatoron === false ? 'none' : '';
      }
      el.classList.toggle('disabled', c.state === 'disabled');
    }
    if (['entry', 'spinbox', 'combobox'].includes(cls)) {
      const inp = el.querySelector('input');
      if ('value' in o && inp.value !== String(o.value)) inp.value = o.value;
      if ('text' in o && o.text != null && inp.value !== String(o.text)) inp.value = o.text;
      inp.type = c.show ? 'password' : 'text';
      inp.disabled = c.state === 'disabled';
      inp.readOnly = c.state === 'readonly';
      inp.style.textAlign = c.justify || 'left';
      inp.style.background = css(c.background, '#fff');
      inp.style.color = css(c.foreground, '#000');
      inp.style.font = f.font;
      if (cls === 'combobox' && o.items) {
        el.querySelector('select').innerHTML = o.items.map((v) => `<option>${esc(v)}</option>`).join('');
        el.querySelector('select').selectedIndex = -1;
      }
    }
    if (cls === 'text') {
      const ta = el.querySelector('textarea');
      if ('value' in o && ta.value !== o.value) ta.value = o.value;
      ta.disabled = c.state === 'disabled';
      ta.style.font = f.font !== DEF_FONT ? f.font : '13px Consolas, "D2Coding", monospace';
      ta.style.background = css(c.background, '#fff');
      ta.style.color = css(c.foreground, '#000');
      ta.style.whiteSpace = c.wrap === 'none' ? 'pre' : 'pre-wrap';
    }
    if (cls === 'listbox') {
      if (o.items) rec.items = o.items;
      if (o.sel) rec.sel = o.sel;
      el.style.background = css(c.background, '#fff');
      el.style.color = css(c.foreground, '#000');
      renderListbox(rec);
    }
    if (cls === 'scale') {
      const r = el.querySelector('input');
      const from = +(c.from != null ? c.from : 0), to = +(c.to != null ? c.to : 100);
      r.min = Math.min(from, to); r.max = Math.max(from, to);
      r.step = c.resolution || 1;
      if ('value' in o) r.value = o.value;
      const vert = (c.orient || 'vertical') === 'vertical';
      el.classList.toggle('vert', vert);
      r.style.direction = from > to ? 'rtl' : '';
      el.querySelector('.tk-scale-label').textContent = c.label || '';
      el.querySelector('.tk-scale-val').textContent = c.showvalue === 0 ? '' : fmtScale(rec, +r.value);
      const len = +(c.length || 100);
      r.style[vert ? 'height' : 'width'] = len + 'px';
      r.style[vert ? 'width' : 'height'] = (+(c.width || 15) + 4) + 'px';
      r.disabled = c.state === 'disabled';
    }
    if (cls === 'optionmenu') {
      const s = el.querySelector('select');
      if (o.items) s.innerHTML = o.items.map((v) => `<option>${esc(v)}</option>`).join('');
      if ('value' in o) s.value = o.value;
      s.style.font = f.font;
    }
    if (cls === 'progress') {
      const mx = +(c.maximum || 100);
      el.querySelector('i').style.width = Math.max(0, Math.min(100, (+(c.value || 0)) / mx * 100)) + '%';
    }
    if (cls === 'canvas') {
      rec.el.style.background = css(c.background, '#f0f0f0');
      const hl = c.highlightthickness != null ? +c.highlightthickness : 2;
      const hlEl = el.querySelector('.tk-hl');
      hlEl.style.borderWidth = hl + 'px';
      hlEl.style.borderColor = css(c.highlightbackground, '#f0f0f0');
      const r = reliefCss(c.relief || 'flat', c.borderwidth, 0);
      el.style.border = 'none';
      hlEl.style.boxShadow = r.bd ? `inset 0 0 0 ${r.bd}px #a0a0a0` : '';
      canvasDirty(rec);
    }
    markLayout(rec);
  }

  function renderListbox(rec) {
    rec.el.innerHTML = rec.items.map((t, i) => `<div class="tk-li${rec.sel.includes(i) ? ' sel' : ''}" data-i="${i}">${esc(t) || '&nbsp;'}</div>`).join('');
    const sb = css(rec.cfg.selectbackground, '#0078d7');
    rec.el.querySelectorAll('.tk-li.sel').forEach((d) => { d.style.background = sb; d.style.color = css(rec.cfg.selectforeground, '#fff'); });
  }

  // ================================================================== 이미지
  function drawImageInto(cv, id) {
    const img = G.images.get(id);
    if (!img) { cv.width = 1; cv.height = 1; return; }
    const w = Math.max(1, Math.round(img.w)), h = Math.max(1, Math.round(img.h));
    cv.width = w; cv.height = h;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const src = imageSource(img);
    if (src) ctx.drawImage(src, 0, 0, w, h);
  }

  function imageSource(img) {
    if (!img) return null;
    if (img.bmp) return img.bmp;
    if (img.src) return imageSource(G.images.get(img.src));
    return null;
  }

  function imageChanged(id) {
    const img = G.images.get(id);
    if (!img) return;
    const refresh = (iid) => {
      document.querySelectorAll(`canvas.tk-img[data-img="${CSS.escape(iid)}"]`).forEach((cv) => drawImageInto(cv, iid));
    };
    refresh(id);
    for (const [did, d] of G.images) if (d.src === id) refresh(did);
    for (const win of G.wins.values()) {
      win.needLayout = true;
      for (const [wid, rec] of G.w) if (rec.cls === 'canvas' && rec.winId === win.id) win.canvasDirty.add(wid);
    }
    for (const win of G.wins.values()) if (win.kind === 'pg') { /* 다음 프레임에 그려짐 */ }
    schedule();
  }

  G.binary = function (id, kind, bytes, meta) {
    if (kind === 'sound') {
      const url = URL.createObjectURL(new Blob([bytes]));
      G.sounds.set(id, { url, audio: null });
      return;
    }
    const entry = G.images.get(id) || { users: new Set() };
    entry.w = meta.w || entry.w || 1;
    entry.h = meta.h || entry.h || 1;
    entry.src = null;
    G.images.set(id, entry);
    const done = (bmp) => {
      if (entry.bmp && entry.bmp.close && entry.bmp !== bmp) try { entry.bmp.close(); } catch (e) { /* 무시 */ }
      entry.bmp = bmp;
      if (bmp && (!meta.w || !meta.h)) { entry.w = bmp.width; entry.h = bmp.height; }
      imageChanged(id);
    };
    if (kind === 'rgba') {
      const w = meta.w, h = meta.h;
      if (!w || !h) return;
      const idata = new ImageData(new Uint8ClampedArray(bytes.buffer, bytes.byteOffset, w * h * 4), w, h);
      createImageBitmap(idata).then(done, () => {});
    } else {
      const blob = new Blob([bytes], { type: meta.mime || 'application/octet-stream' });
      createImageBitmap(blob).then(done, () => {
        const im = new Image();
        im.onload = () => done(im);
        im.src = URL.createObjectURL(blob);
      });
    }
  };

  // ================================================================== 배치 (pack · grid · place)
  const isContainer = (rec) => rec.isWin || rec.cls === 'frame' || rec.cls === 'labelframe' || rec.cls === 'toplevel';
  const pad2 = (v) => Array.isArray(v) ? [+v[0] || 0, +(v[1] != null ? v[1] : v[0]) || 0] : [+v || 0, +v || 0];

  function managed(rec, m) {
    return rec.children.map((id) => G.w.get(id)).filter((c) => c && c.geo && c.geo.m === m && !c.isWin);
  }

  function borderOf(rec) {
    const c = rec.cfg;
    if (rec.isWin) return 0;
    if (rec.cls === 'labelframe') return c.borderwidth != null ? +c.borderwidth : 2;
    if (rec.cls === 'frame') return c.relief && c.relief !== 'flat' || c.borderwidth ? +(c.borderwidth || 0) : 0;
    return 0;
  }

  function insets(rec) {
    const bd = borderOf(rec);
    let top = bd;
    if (rec.cls === 'labelframe') {
      top = Math.max(bd, fontPx(fontOf(rec.cfg.font).font) * 1.3);
    }
    const padx = rec.isWin ? 0 : (+(rec.cfg.padx || 0));
    const pady = rec.isWin ? 0 : (+(rec.cfg.pady || 0));
    return { l: bd + padx, r: bd + padx, t: top + pady, b: bd + pady };
  }

  function reqSize(rec) {
    if (isContainer(rec)) {
      const packed = rec.packList.map((id) => G.w.get(id)).filter((c) => c && c.geo && c.geo.m === 'pack');
      const gridded = managed(rec, 'grid');
      const placed = managed(rec, 'place');
      placed.forEach(reqSize);
      const ins = insets(rec);
      let w = 0, h = 0, any = false;
      if (packed.length) {
        any = true;
        let width = 0, height = 0, maxW = 0, maxH = 0;
        for (const c of packed) {
          const r = reqSize(c), o = c.geo.o;
          const px = pad2(o.padx), py = pad2(o.pady);
          const cw = r.w + 2 * (+o.ipadx || 0) + px[0] + px[1];
          const ch = r.h + 2 * (+o.ipady || 0) + py[0] + py[1];
          const side = o.side || 'top';
          if (side === 'top' || side === 'bottom') { maxW = Math.max(maxW, cw + width); height += ch; }
          else { maxH = Math.max(maxH, ch + height); width += cw; }
        }
        w = Math.max(maxW, width); h = Math.max(maxH, height);
      }
      if (gridded.length) {
        any = true;
        const g = gridSizes(rec, gridded);
        w = Math.max(w, g.cols.reduce((a, b) => a + b, 0));
        h = Math.max(h, g.rows.reduce((a, b) => a + b, 0));
      }
      const cw = rec.cfg.width != null && rec.cfg.width !== '' ? +rec.cfg.width : null;
      const ch = rec.cfg.height != null && rec.cfg.height !== '' ? +rec.cfg.height : null;
      if (!any || !rec.prop) {
        if (rec.isWin && !any) { w = 200; h = 200; }
        if (cw) w = cw - (rec.isWin ? 0 : ins.l + ins.r) * 0;
        if (ch) h = ch;
        if (!rec.isWin && !any) { w = Math.max(cw || 0, 0); h = Math.max(ch || 0, 0); }
        if (!any && !rec.isWin) { rec.req = { w: Math.max(1, w), h: Math.max(1, h) }; return rec.req; }
        if (!rec.prop) { rec.req = { w: Math.max(1, cw || w), h: Math.max(1, ch || h) }; return rec.req; }
      }
      if (rec.cls === 'labelframe') {
        measureCtx.font = fontOf(rec.cfg.font).font;
        w = Math.max(w, measureCtx.measureText(rec.cfg.text || '').width + 16);
      }
      rec.req = { w: Math.max(1, w + ins.l + ins.r), h: Math.max(1, h + ins.t + ins.b) };
      return rec.req;
    }
    rec.req = leafSize(rec);
    return rec.req;
  }

  function leafSize(rec) {
    const c = rec.cfg, el = rec.el, cls = rec.cls;
    const font = fontOf(c.font).font;
    if (cls === 'canvas') {
      const hl = c.highlightthickness != null ? +c.highlightthickness : 2;
      const bd = +(c.borderwidth || 0);
      return { w: (+(c.width != null ? c.width : 378)) + 2 * (hl + bd), h: (+(c.height != null ? c.height : 265)) + 2 * (hl + bd) };
    }
    if (cls === 'menu') return { w: 0, h: 0 };
    if (cls === 'scrollbar') return (c.orient || 'vertical') === 'vertical' ? { w: 17, h: 40 } : { w: 40, h: 17 };
    if (cls === 'progress') return { w: +(c.length || 100), h: 20 };
    // 자연 크기 측정
    el.style.display = '';
    el.style.width = ''; el.style.height = '';
    el.style.left = '0px'; el.style.top = '0px';
    let w = el.offsetWidth, h = el.offsetHeight;
    const cw = charW(font);
    const lh = Math.ceil(fontPx(font) * 1.35);
    const hasImg = !!c.image;
    if (['label', 'message', 'button', 'checkbutton', 'radiobutton'].includes(cls)) {
      const padx = c.padx != null ? +c.padx : 1, pady = c.pady != null ? +c.pady : 1;
      const bd = cls === 'button' ? 2 : +(c.borderwidth || 0);
      const extra = cls === 'checkbutton' || cls === 'radiobutton' ? 22 : 0;
      const wc = +(c.width || 0), hc = +(c.height || 0);
      if (wc > 0) w = hasImg ? wc + 2 * bd : Math.ceil(wc * cw) + 2 * padx + 2 * bd + extra + (cls === 'button' ? 6 : 0);
      else if (cls === 'button' && !hasImg) w = Math.max(w + 8, 0);
      if (hc > 0) h = hasImg ? hc + 2 * bd : hc * lh + 2 * pady + 2 * bd + (cls === 'button' ? 4 : 0);
      else if (cls === 'button' && !hasImg) h = Math.max(h + 2, lh + 8);
    } else if (['entry', 'spinbox', 'combobox'].includes(cls)) {
      const wc = c.width != null ? +c.width : 20;
      w = Math.ceil(wc * cw) + 8 + (cls !== 'entry' ? 18 : 0);
      h = lh + 6;
    } else if (cls === 'text') {
      w = Math.ceil((c.width != null ? +c.width : 80) * charW('13px Consolas, monospace')) + 12;
      h = (c.height != null ? +c.height : 24) * 18 + 8;
    } else if (cls === 'listbox') {
      w = Math.ceil((c.width != null ? +c.width : 20) * cw) + 8;
      h = (c.height != null ? +c.height : 10) * (lh + 1) + 4;
    }
    return { w: Math.max(1, Math.ceil(w)), h: Math.max(1, Math.ceil(h)) };
  }

  function gridSizes(rec, kids) {
    const cols = [], rows = [];
    const need = (arr, i) => { while (arr.length <= i) arr.push(0); };
    const spans = [];
    for (const c of kids) {
      const r = c.req.w != null && c._reqDone ? c.req : reqSize(c);
      const o = c.geo.o;
      const col = +o.column || 0, row = +o.row || 0;
      const cs = Math.max(1, +o.columnspan || 1), rs = Math.max(1, +o.rowspan || 1);
      const px = pad2(o.padx), py = pad2(o.pady);
      const w = r.w + 2 * (+o.ipadx || 0) + px[0] + px[1];
      const h = r.h + 2 * (+o.ipady || 0) + py[0] + py[1];
      need(cols, col + cs - 1); need(rows, row + rs - 1);
      if (cs === 1) cols[col] = Math.max(cols[col], w); else spans.push(['c', col, cs, w]);
      if (rs === 1) rows[row] = Math.max(rows[row], h); else spans.push(['r', row, rs, h]);
    }
    for (const [k, i, n, size] of spans) {
      const arr = k === 'c' ? cols : rows;
      const cur = arr.slice(i, i + n).reduce((a, b) => a + b, 0);
      if (size > cur) { const add = (size - cur) / n; for (let j = i; j < i + n; j++) arr[j] += add; }
    }
    for (const [i, cfg] of Object.entries(rec.gridCfg.col)) { need(cols, +i); cols[+i] = Math.max(cols[+i], +(cfg.minsize || 0)) + (+(cfg.pad || 0)); }
    for (const [i, cfg] of Object.entries(rec.gridCfg.row)) { need(rows, +i); rows[+i] = Math.max(rows[+i], +(cfg.minsize || 0)) + (+(cfg.pad || 0)); }
    return { cols, rows };
  }

  function setBox(rec, x, y, w, h) {
    const el = rec.el;
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    el.style.width = Math.max(0, Math.round(w)) + 'px';
    el.style.height = Math.max(0, Math.round(h)) + 'px';
    el.style.display = '';
    const old = rec.box;
    rec.box = [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
    if (rec.cls === 'canvas' && (old[2] !== rec.box[2] || old[3] !== rec.box[3])) canvasDirty(rec);
    if ((old[2] !== rec.box[2] || old[3] !== rec.box[3]) && wanted(rec, 'Configure')) {
      send({ k: 'ev', id: rec.id, t: 'Configure', x: rec.box[0], y: rec.box[1], w: rec.box[2], h: rec.box[3] });
    }
  }

  function arrange(rec, x, y, w, h) {
    if (!rec.isWin) setBox(rec, x, y, w, h);
    if (!isContainer(rec)) return;
    const ins = insets(rec);
    const ix = ins.l, iy = ins.t, iw = Math.max(0, w - ins.l - ins.r), ih = Math.max(0, h - ins.t - ins.b);
    // 배치되지 않은 자식 숨기기
    for (const id of rec.children) {
      const c = G.w.get(id);
      if (c && !c.isWin && (!c.geo || !c.geo.m) && !c.inCanvas) c.el.style.display = 'none';
    }
    // pack
    const packed = rec.packList.map((id) => G.w.get(id)).filter((c) => c && c.geo && c.geo.m === 'pack');
    let cx = ix, cy = iy, cw = iw, chh = ih;
    packed.forEach((c, i) => {
      const o = c.geo.o, r = c.req;
      const side = o.side || 'top';
      const px = pad2(o.padx), py = pad2(o.pady);
      const ipx = +o.ipadx || 0, ipy = +o.ipady || 0;
      let fx, fy, fw, fh;
      if (side === 'top' || side === 'bottom') {
        fh = r.h + 2 * ipy + py[0] + py[1];
        if (o.expand) fh += expansion(packed, i, chh, 'y');
        fw = cw; fx = cx;
        if (fh > chh) fh = chh;
        fy = side === 'top' ? cy : cy + chh - fh;
        chh -= fh; if (side === 'top') cy += fh;
      } else {
        fw = r.w + 2 * ipx + px[0] + px[1];
        if (o.expand) fw += expansion(packed, i, cw, 'x');
        fh = chh; fy = cy;
        if (fw > cw) fw = cw;
        fx = side === 'left' ? cx : cx + cw - fw;
        cw -= fw; if (side === 'left') cx += fw;
      }
      const bw = Math.max(0, fw - px[0] - px[1]), bh = Math.max(0, fh - py[0] - py[1]);
      let ww = r.w + 2 * ipx, hh = r.h + 2 * ipy;
      const fill = o.fill || 'none';
      if (fill === 'x' || fill === 'both' || ww > bw) ww = bw;
      if (fill === 'y' || fill === 'both' || hh > bh) hh = bh;
      const ax = AX(o.anchor), ay = AY(o.anchor);
      arrange(c, fx + px[0] + (bw - ww) * ax, fy + py[0] + (bh - hh) * ay, ww, hh);
    });
    // grid
    const gridded = managed(rec, 'grid');
    if (gridded.length) {
      const g = gridSizes(rec, gridded);
      const distribute = (arr, cfgs, avail) => {
        const total = arr.reduce((a, b) => a + b, 0);
        const extra = avail - total;
        let wsum = 0;
        arr.forEach((_, i) => { wsum += +((cfgs[i] || {}).weight || 0); });
        if (extra > 0 && wsum > 0) arr.forEach((v, i) => { arr[i] = v + extra * (+((cfgs[i] || {}).weight || 0)) / wsum; });
        return extra > 0 && wsum === 0 ? extra / 2 : 0;
      };
      const offX = distribute(g.cols, rec.gridCfg.col, iw);
      const offY = distribute(g.rows, rec.gridCfg.row, ih);
      const colX = [], rowY = [];
      g.cols.reduce((a, v, i) => { colX[i] = a; return a + v; }, ix + offX);
      g.rows.reduce((a, v, i) => { rowY[i] = a; return a + v; }, iy + offY);
      for (const c of gridded) {
        const o = c.geo.o, r = c.req;
        const col = +o.column || 0, row = +o.row || 0;
        const cs = Math.max(1, +o.columnspan || 1), rs = Math.max(1, +o.rowspan || 1);
        const cellW = g.cols.slice(col, col + cs).reduce((a, b) => a + b, 0);
        const cellH = g.rows.slice(row, row + rs).reduce((a, b) => a + b, 0);
        const px = pad2(o.padx), py = pad2(o.pady);
        const bw = Math.max(0, cellW - px[0] - px[1]), bh = Math.max(0, cellH - py[0] - py[1]);
        const st = String(o.sticky || '').toLowerCase();
        let ww = Math.min(bw, r.w + 2 * (+o.ipadx || 0)), hh = Math.min(bh, r.h + 2 * (+o.ipady || 0));
        if (st.includes('e') && st.includes('w')) ww = bw;
        if (st.includes('n') && st.includes('s')) hh = bh;
        const ax = st.includes('w') && !st.includes('e') ? 0 : st.includes('e') && !st.includes('w') ? 1 : 0.5;
        const ay = st.includes('n') && !st.includes('s') ? 0 : st.includes('s') && !st.includes('n') ? 1 : 0.5;
        arrange(c, colX[col] + px[0] + (bw - ww) * ax, rowY[row] + py[0] + (bh - hh) * ay, ww, hh);
      }
    }
    // place
    for (const c of managed(rec, 'place')) {
      const o = c.geo.o;
      const r = c.req;
      const W = w, H = h;
      let ww = o.width != null ? +o.width : (o.relwidth != null ? +o.relwidth * W : r.w);
      let hh = o.height != null ? +o.height : (o.relheight != null ? +o.relheight * H : r.h);
      if (o.relwidth != null && o.width != null) ww = +o.relwidth * W + +o.width;
      if (o.relheight != null && o.height != null) hh = +o.relheight * H + +o.height;
      let px = (+o.relx || 0) * W + (+o.x || 0);
      let py = (+o.rely || 0) * H + (+o.y || 0);
      const a = o.anchor || 'nw';
      px -= ww * AX(a);
      py -= hh * AY(a);
      arrange(c, px, py, ww, hh);
    }
  }

  function expansion(list, i, cavity, axis) {
    let minExpand = cavity, num = 0;
    for (let j = i; j < list.length; j++) {
      const c = list[j], o = c.geo.o, r = c.req;
      const side = o.side || 'top';
      const vertical = side === 'top' || side === 'bottom';
      const px = pad2(o.padx), py = pad2(o.pady);
      const size = axis === 'y' ? r.h + 2 * (+o.ipady || 0) + py[0] + py[1] : r.w + 2 * (+o.ipadx || 0) + px[0] + px[1];
      if ((axis === 'y') === vertical) {
        if (o.expand) num++;
        cavity -= size;
      } else {
        const cur = cavity - size;
        if (o.expand && cur < minExpand) minExpand = cur;
      }
    }
    if (num === 0) return 0;
    const cur = cavity / num;
    if (cur < minExpand) minExpand = cur;
    return Math.max(0, minExpand);
  }

  function layoutWindow(win) {
    const root = G.w.get(win.id);
    if (!root) return;
    const walkReset = (rec) => { rec.children.forEach((id) => { const c = G.w.get(id); if (c && !c.isWin) walkReset(c); }); };
    walkReset(root);
    const req = reqSize(root);
    let W = win.geomW != null ? win.geomW : req.w;
    let H = win.geomH != null ? win.geomH : req.h;
    if (win.kind === 'pg') { W = win.pgW; H = win.pgH; }
    W = Math.max(1, W); H = Math.max(1, H);
    arrange(root, 0, 0, W, H);
    root.box = [0, 0, W, H];
    fitScale(win, W, H);
    win.el.style.visibility = '';
    placeWindow(win, W * win.scale, H * win.scale + 30);
    // 크기 알려 주기 (winfo_width 등)
    const m = {};
    for (const [id, rec] of G.w) if (rec.winId === win.id) m[id] = rec.box;
    m[win.id] = [0, 0, W, H];
    const s = JSON.stringify(m);
    if (s !== win.lastSizes) { win.lastSizes = s; send({ k: 'sizes', m }); }
  }

  // ================================================================== 캔버스 그리기
  function canvasDirty(rec) {
    const win = winOf(rec);
    if (win) { win.canvasDirty.add(rec.id); schedule(); }
  }

  function drawCanvas(rec) {
    const cv = rec.canvas;
    const w = Math.max(1, rec.box[2] || 1), h = Math.max(1, rec.box[3] || 1);
    const dpr = DPR();
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const tops = [];
    for (const n of rec.order) {
      const it = rec.items.get(n);
      if (!it) continue;
      if (it.o._top) { tops.push(it); continue; }
      drawItem(ctx, it, rec);
    }
    for (const it of tops) drawItem(ctx, it, rec);
  }

  function dashOf(d) {
    if (!d) return [];
    if (Array.isArray(d)) return d.map(Number);
    if (typeof d === 'number') return [d, d];
    const s = String(d).trim();
    if (/^[\d\s]+$/.test(s)) return s.split(/\s+/).map(Number);
    const out = [];
    for (const ch of s) {
      if (ch === '.') out.push(2, 4); else if (ch === '-') out.push(6, 4); else if (ch === ',') out.push(4, 4); else if (ch === '_') out.push(8, 4); else if (ch === ' ' && out.length) out[out.length - 1] += 4;
    }
    return out;
  }

  function smoothPath(ctx, pts, closed) {
    if (pts.length < 6) { linePath(ctx, pts, closed); return; }
    const P = [];
    for (let i = 0; i < pts.length; i += 2) P.push([pts[i], pts[i + 1]]);
    if (closed) P.push(P[0], P[1]);
    ctx.moveTo(closed ? (P[0][0] + P[1][0]) / 2 : P[0][0], closed ? (P[0][1] + P[1][1]) / 2 : P[0][1]);
    for (let i = 1; i < P.length - 1; i++) {
      const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
      if (!closed && i === P.length - 2) ctx.quadraticCurveTo(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]);
      else ctx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
    }
  }

  function linePath(ctx, c, closed) {
    ctx.moveTo(c[0], c[1]);
    for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]);
    if (closed) ctx.closePath();
  }

  function arrowHead(ctx, x1, y1, x2, y2, shape, color) {
    const [d1, d2, d3] = shape;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const c = Math.cos(ang), s = Math.sin(ang);
    const bx = x2 - d2 * c, by = y2 - d2 * s;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx - d3 * s, by + d3 * c);
    ctx.lineTo(x2 - d1 * c, y2 - d1 * s);
    ctx.lineTo(bx + d3 * s, by - d3 * c);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function anchorBox(x, y, w, h, a) {
    return [x - w * AX(a), y - h * AY(a)];
  }

  function wrapLines(ctx, text, width) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!width || width <= 0) { out.push(para); continue; }
      let line = '';
      for (const ch of para.split(/(\s+)/)) {
        const test = line + ch;
        if (ctx.measureText(test).width > width && line.trim()) { out.push(line.trimEnd()); line = ch.trimStart(); }
        else line = test;
      }
      out.push(line);
    }
    return out;
  }

  function drawItem(ctx, it, rec) {
    const o = it.o, c = it.c;
    if (o.state === 'hidden') return;
    ctx.save();
    ctx.setLineDash(dashOf(o.dash));
    const width = o.width != null ? +o.width : 1;
    switch (it.t) {
      case 'line': {
        if (c.length < 4) break;
        const col = css(o.fill, '#000');
        if (o.fill === '') break;
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(0.5, width);
        ctx.lineCap = { round: 'round', projecting: 'square' }[o.capstyle] || 'butt';
        ctx.lineJoin = { bevel: 'bevel', miter: 'miter' }[o.joinstyle] || 'round';
        ctx.beginPath();
        if (o.smooth && o.smooth !== '0' && o.smooth !== 'false') smoothPath(ctx, c, false); else linePath(ctx, c, false);
        ctx.stroke();
        const shape = Array.isArray(o.arrowshape) ? o.arrowshape.map(Number) : [8, 10, 3];
        const sc = Math.max(1, width / 2);
        const sh = shape.map((v) => v * (width > 2 ? sc : 1));
        if (o.arrow === 'last' || o.arrow === 'both') arrowHead(ctx, c[c.length - 4], c[c.length - 3], c[c.length - 2], c[c.length - 1], sh, col);
        if (o.arrow === 'first' || o.arrow === 'both') arrowHead(ctx, c[2], c[3], c[0], c[1], sh, col);
        break;
      }
      case 'rectangle': case 'oval': case 'arc': {
        if (c.length < 4) break;
        const x1 = Math.min(c[0], c[2]), y1 = Math.min(c[1], c[3]), x2 = Math.max(c[0], c[2]), y2 = Math.max(c[1], c[3]);
        const fill = o.fill ? css(o.fill, '') : '';
        const outline = o.outline === '' ? '' : css(o.outline, '#000');
        ctx.beginPath();
        if (it.t === 'rectangle') ctx.rect(x1, y1, x2 - x1, y2 - y1);
        else if (it.t === 'oval') ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.max(0, (x2 - x1) / 2), Math.max(0, (y2 - y1) / 2), 0, 0, Math.PI * 2);
        else {
          const start = -(+(o.start || 0)) * Math.PI / 180;
          const ext = -(+(o.extent != null ? o.extent : 90)) * Math.PI / 180;
          const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.max(0, (x2 - x1) / 2), ry = Math.max(0, (y2 - y1) / 2);
          const style = o.style || 'pieslice';
          if (style === 'pieslice') ctx.moveTo(cx, cy);
          ctx.ellipse(cx, cy, rx, ry, 0, start, start + ext, ext < 0);
          if (style !== 'arc') ctx.closePath();
          if (style === 'arc') { ctx.strokeStyle = outline || '#000'; ctx.lineWidth = width; ctx.stroke(); break; }
        }
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (outline && width > 0) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
        break;
      }
      case 'polygon': {
        if (c.length < 4) break;
        const fill = o.fill === '' ? '' : css(o.fill, '#000');
        const outline = o.outline ? css(o.outline, '') : '';
        ctx.beginPath();
        if (o.smooth && o.smooth !== '0' && o.smooth !== 'false') smoothPath(ctx, c, true); else linePath(ctx, c, true);
        if (fill) { ctx.fillStyle = fill; ctx.fill('nonzero'); }
        if (outline && width > 0) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
        break;
      }
      case 'text': {
        if (c.length < 2) break;
        const f = fontOf(o.font);
        ctx.font = f.font;
        ctx.fillStyle = o.fill === '' ? 'transparent' : css(o.fill, '#000');
        ctx.textBaseline = 'top';
        const px = fontPx(f.font);
        const lh = px * 1.25;
        const lines = wrapLines(ctx, o.text == null ? '' : o.text, +(o.width || 0));
        const bw = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
        const bh = lines.length * lh;
        let [x0, y0] = anchorBox(c[0], c[1], bw, bh, o.anchor);
        if (o.angle) {
          ctx.translate(c[0], c[1]);
          ctx.rotate(-(+o.angle) * Math.PI / 180);
          ctx.translate(-c[0], -c[1]);
        }
        lines.forEach((l, i) => {
          const lw = ctx.measureText(l).width;
          const jx = o.justify === 'center' ? (bw - lw) / 2 : o.justify === 'right' ? bw - lw : 0;
          ctx.fillText(l, x0 + jx, y0 + i * lh + (lh - px) / 2);
          if (/underline/.test(f.deco)) ctx.fillRect(x0 + jx, y0 + i * lh + (lh + px) / 2, lw, Math.max(1, px / 14));
        });
        break;
      }
      case 'image': {
        const img = G.images.get(o.image);
        const src = imageSource(img);
        if (!img || !src || c.length < 2) break;
        const [x0, y0] = anchorBox(c[0], c[1], img.w, img.h, o.anchor);
        ctx.imageSmoothingEnabled = img.src != null ? false : true;
        ctx.drawImage(src, x0, y0, img.w, img.h);
        break;
      }
      case 'window': {
        const child = G.w.get(o.window);
        if (child && c.length >= 2) {
          child.inCanvas = true;
          reqSize(child);
          const w = o.width != null ? +o.width : child.req.w, h = o.height != null ? +o.height : child.req.h;
          const [x0, y0] = anchorBox(c[0], c[1], w, h, o.anchor);
          if (child.el.parentNode !== rec.el) rec.el.appendChild(child.el);
          arrange(child, x0, y0, w, h);
        }
        break;
      }
      default:
    }
    ctx.restore();
  }

  // ================================================================== 이벤트 보내기
  function wanted(rec, type) {
    if (!rec) return false;
    if (rec.wants.has(type) || G.globalWants.has(type)) return true;
    const win = G.w.get(rec.winId);
    return !!(win && win.wants.has(type));
  }

  function stateBits(e) {
    let s = 0;
    if (e.shiftKey) s |= 1;
    if (e.getModifierState && e.getModifierState('CapsLock')) s |= 2;
    if (e.ctrlKey) s |= 4;
    if (e.altKey) s |= 0x20008;
    const b = e.buttons || 0;
    if (b & 1) s |= 256;
    if (b & 4) s |= 512;
    if (b & 2) s |= 1024;
    return s;
  }

  function localXY(rec, e) {
    const win = G.wins.get(rec.winId);
    const s = win ? win.scale : 1;
    const r = rec.el.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) / s), y: Math.round((e.clientY - r.top) / s) };
  }

  function targetRec(e) {
    const el = e.target.closest && e.target.closest('[data-wid]');
    return el ? G.w.get(el.dataset.wid) : null;
  }

  function bindMouse(rec) {
    // 위젯마다 따로 등록하지 않고, 창 본문에서 한 번에 처리한다 (아래 bindWinMouse)
    void rec;
  }

  let lastMove = 0;
  function bindWinMouse(win) {
    const body = win.body;
    const mouseEv = (t, e, extra) => {
      const rec = targetRec(e);
      if (!rec || rec.winId !== win.id) return;
      if (!wanted(rec, t)) return;
      const p = localXY(rec, e);
      send(Object.assign({ k: 'ev', id: rec.id, t, x: p.x, y: p.y, X: Math.round(e.clientX), Y: Math.round(e.clientY), st: stateBits(e), tm: Math.round(e.timeStamp) }, extra || {}));
    };
    body.addEventListener('pointerdown', (e) => {
      const rec = targetRec(e);
      if (rec && rec.cls === 'canvas') { e.preventDefault(); win.el.focus({ preventScroll: true }); }
      mouseEv('Button', e, { num: [1, 2, 3][e.button] || 1, cnt: Math.max(1, e.detail || 1) });
    });
    body.addEventListener('pointerup', (e) => mouseEv('ButtonRelease', e, { num: [1, 2, 3][e.button] || 1 }));
    body.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastMove < 14) return;
      lastMove = now;
      mouseEv('Motion', e);
    });
    body.addEventListener('wheel', (e) => {
      const rec = targetRec(e);
      if (rec && wanted(rec, 'MouseWheel')) { e.preventDefault(); mouseEv('MouseWheel', e, { d: e.deltaY < 0 ? 120 : -120 }); }
    }, { passive: false });
    body.addEventListener('contextmenu', (e) => { const rec = targetRec(e); if (rec && wanted(rec, 'Button')) e.preventDefault(); });
    body.addEventListener('pointerover', (e) => {
      const rec = targetRec(e);
      if (rec && e.target === rec.el && wanted(rec, 'Enter')) mouseEv('Enter', e);
    });
    body.addEventListener('pointerout', (e) => {
      const rec = targetRec(e);
      if (rec && e.target === rec.el && !rec.el.contains(e.relatedTarget) && wanted(rec, 'Leave')) mouseEv('Leave', e);
    });
  }

  const KEYSYM = {
    Enter: 'Return', ' ': 'space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    Backspace: 'BackSpace', Escape: 'Escape', Tab: 'Tab', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'Prior', PageDown: 'Next',
    Shift: 'Shift_L', Control: 'Control_L', Alt: 'Alt_L', CapsLock: 'Caps_Lock', Insert: 'Insert', Meta: 'Win_L',
    '<': 'less', '>': 'greater', '!': 'exclam', '@': 'at', '#': 'numbersign', '$': 'dollar', '%': 'percent', '^': 'asciicircum',
    '&': 'ampersand', '*': 'asterisk', '(': 'parenleft', ')': 'parenright', '-': 'minus', _: 'underscore', '=': 'equal', '+': 'plus',
    '[': 'bracketleft', ']': 'bracketright', '{': 'braceleft', '}': 'braceright', ';': 'semicolon', ':': 'colon', "'": 'apostrophe',
    '"': 'quotedbl', ',': 'comma', '.': 'period', '/': 'slash', '?': 'question', '\\': 'backslash', '|': 'bar', '`': 'grave', '~': 'asciitilde'
  };

  function onKey(win, e, down) {
    if (e.target.closest && e.target.closest('.gw-title')) return;
    if (win.kind === 'pg') {
      if (e.repeat) { e.preventDefault(); return; }
      e.preventDefault();
      send({ k: 'pg', id: win.id, t: down ? 'keydown' : 'keyup', code: e.code, key: e.key, sh: e.shiftKey, ct: e.ctrlKey, al: e.altKey });
      return;
    }
    const inInput = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    let rec = targetRec(e);
    if (!rec || !inInput) rec = G.w.get(win.focusWidget) || G.w.get(win.id);
    if (!rec) return;
    const t = down ? 'Key' : 'KeyRelease';
    if (!wanted(rec, t)) return;
    const ks = KEYSYM[e.key] || (e.key.length === 1 ? e.key : e.key);
    if (!inInput && (/^Arrow|^ $|^Tab$|^Backspace$/.test(e.key) || e.key === ' ')) e.preventDefault();
    send({ k: 'ev', id: rec.id, t, ks, ch: e.key.length === 1 ? e.key : (e.key === 'Enter' ? '\r' : e.key === 'Tab' ? '\t' : e.key === 'Backspace' ? '\b' : e.key === 'Escape' ? '' : ''), kc: e.keyCode, kn: e.key.length === 1 ? e.key.charCodeAt(0) : 0, st: stateBits(e), tm: Math.round(e.timeStamp) });
  }

  // ================================================================== 메뉴
  function closeMenus() {
    document.querySelectorAll('.gm-drop').forEach((d) => d.remove());
    document.querySelectorAll('.gw-menubar .open').forEach((d) => d.classList.remove('open'));
  }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.gm-drop') && !e.target.closest('.gw-menubar')) closeMenus(); }, true);

  function dropMenu(items, x, y, parentDrop) {
    const L = layer();
    const d = document.createElement('div');
    d.className = 'gm-drop';
    d.style.zIndex = ++G.z + 1000;
    d.innerHTML = items.map((it, i) => {
      if (it.k === 'separator') return '<div class="gm-sep"></div>';
      const mark = it.k === 'checkbutton' ? (it.on ? '✓' : '') : it.k === 'radiobutton' ? (it.on ? '●' : '') : '';
      return `<div class="gm-item${it.dis ? ' dis' : ''}" data-i="${i}"><span class="gm-mark">${mark}</span><span class="gm-l">${esc(it.l)}</span>
        <span class="gm-acc">${esc(it.acc || '')}${it.k === 'cascade' ? ' ▸' : ''}</span></div>`;
    }).join('');
    L.appendChild(d);
    const lr = L.getBoundingClientRect();
    d.style.left = Math.min(x - lr.left, lr.width - d.offsetWidth - 4) + 'px';
    d.style.top = Math.min(y - lr.top, lr.height - d.offsetHeight - 4) + 'px';
    d.addEventListener('pointerover', (e) => {
      const row = e.target.closest('.gm-item');
      if (!row) return;
      const it = items[+row.dataset.i];
      d.querySelectorAll(':scope > .gm-item.hover').forEach((r) => r.classList.remove('hover'));
      row.classList.add('hover');
      if (d.sub) { d.sub.remove(); d.sub = null; }
      if (it.k === 'cascade' && it.sub) {
        const r = row.getBoundingClientRect();
        d.sub = dropMenu(it.sub, r.right - 2, r.top, d);
      }
    });
    d.addEventListener('click', (e) => {
      const row = e.target.closest('.gm-item');
      if (!row) return;
      const it = items[+row.dataset.i];
      if (it.dis || it.k === 'cascade') return;
      closeMenus();
      send({ k: 'ev', id: it.m, t: 'menu', i: it.i });
    });
    void parentDrop;
    return d;
  }

  function renderMenubar(win, tree) {
    const mb = win.menubar;
    if (!tree || !tree.length) { mb.classList.add('hidden'); mb.innerHTML = ''; return; }
    mb.classList.remove('hidden');
    mb.innerHTML = tree.map((it, i) => `<span class="gm-top${it.dis ? ' dis' : ''}" data-i="${i}">${esc(it.l)}</span>`).join('');
    mb.onclick = (e) => {
      const top = e.target.closest('.gm-top');
      if (!top) return;
      const it = tree[+top.dataset.i];
      const wasOpen = top.classList.contains('open');
      closeMenus();
      if (wasOpen) return;
      if (it.k === 'cascade' && it.sub) {
        top.classList.add('open');
        const r = top.getBoundingClientRect();
        dropMenu(it.sub, r.left, r.bottom);
      } else if (it.k === 'command') send({ k: 'ev', id: it.m, t: 'menu', i: it.i });
    };
    mb.onpointerover = (e) => {
      const top = e.target.closest('.gm-top');
      if (!top || !mb.querySelector('.open') || top.classList.contains('open')) return;
      closeMenus();
      const it = tree[+top.dataset.i];
      if (it.k === 'cascade' && it.sub) { top.classList.add('open'); const r = top.getBoundingClientRect(); dropMenu(it.sub, r.left, r.bottom); }
    };
    win.needLayout = true;
  }

  // ================================================================== 대화상자
  const ICON = { info: 'ℹ️', warning: '⚠️', error: '⛔', question: '❓', yesno: '❓', okcancel: '❓', yesnocancel: '❓', retrycancel: '⚠️', askstring: '✏️', askinteger: '🔢', askfloat: '🔢', openfile: '📂', savefile: '💾', color: '🎨', dir: '📁' };

  function dialog(op) {
    const L = layer();
    const back = document.createElement('div');
    back.className = 'gd-back';
    back.style.zIndex = ++G.z + 2000;
    const k = op.kind;
    const reply = (value) => { back.remove(); send({ k: 'reply', rid: op.rid, value }); };
    let body = `<div class="gd-msg">${esc(op.message || '').replace(/\n/g, '<br>')}${op.detail ? `<div class="gd-detail">${esc(op.detail)}</div>` : ''}</div>`;
    let buttons = '';
    const btn = (label, val, primary) => `<button class="gd-b${primary ? ' primary' : ''}" data-v='${JSON.stringify(val)}'>${label}</button>`;
    if (['info', 'warning', 'error'].includes(k)) buttons = btn('확인', 'ok', true);
    else if (k === 'yesno') buttons = btn('예(Y)', true, true) + btn('아니요(N)', false);
    else if (k === 'question') buttons = btn('예(Y)', 'yes', true) + btn('아니요(N)', 'no');
    else if (k === 'okcancel') buttons = btn('확인', true, true) + btn('취소', false);
    else if (k === 'yesnocancel') buttons = btn('예(Y)', true, true) + btn('아니요(N)', false) + btn('취소', null);
    else if (k === 'retrycancel') buttons = btn('다시 시도(R)', true, true) + btn('취소', false);
    else if (['askstring', 'askinteger', 'askfloat'].includes(k)) {
      body += `<input class="gd-in" type="${op.show ? 'password' : 'text'}" value="${esc(op.initial || '')}" spellcheck="false"><div class="gd-err"></div>`;
      buttons = `<button class="gd-b primary" data-ok>확인</button>` + btn('취소', null);
    } else if (k === 'color') {
      body += `<input class="gd-color" type="color" value="${esc(op.initial || '#000000')}">`;
      buttons = `<button class="gd-b primary" data-ok>확인</button>` + btn('취소', null);
    } else if (k === 'openfile' || k === 'savefile') {
      const files = op.files || [];
      body = `${op.types && op.types.length ? `<div class="gd-types">파일 형식: ${esc(op.types.join(', '))}</div>` : ''}
        <div class="gd-files">${files.length ? files.map((f) => `<div class="gd-file" data-f="${esc(f)}">${/\.(gif|png|jpe?g|bmp)$/i.test(f) ? '🖼️' : /\.(txt|csv|py|dat|json)$/i.test(f) ? '📄' : '📦'} ${esc(f)}</div>`).join('') : '<div class="gd-empty">작업 폴더에 해당하는 파일이 없습니다.</div>'}</div>
        ${k === 'savefile' ? `<label class="gd-lbl">파일 이름 <input class="gd-in" type="text" value="${esc(op.initial || '')}" spellcheck="false"></label>` : `<div class="gd-up"><label class="gd-b">📤 내 PC 에서 파일 올리기<input type="file" hidden ${op.multiple ? 'multiple' : ''}></label><span class="muted">작업 폴더에 복사한 뒤 엽니다.</span></div>`}`;
      buttons = `<button class="gd-b primary" data-ok>${k === 'savefile' ? '저장' : '열기'}</button>` + btn('취소', '');
    } else if (k === 'dir') {
      body = '<div class="gd-msg">작업 폴더(현재 폴더)를 사용합니다.</div>';
      buttons = btn('확인', '.', true) + btn('취소', '');
    } else buttons = btn('확인', null, true);
    back.innerHTML = `<div class="gd"><div class="gd-title">${esc(op.title || '')}<span class="gw-sp"></span><button class="gw-btn gd-x">✕</button></div>
      <div class="gd-body"><span class="gd-icon">${ICON[k] || ''}</span><div class="gd-main">${body}</div></div><div class="gd-btns">${buttons}</div></div>`;
    L.appendChild(back);
    const input = back.querySelector('.gd-in');
    let chosen = null;
    const cancelVal = ['askstring', 'askinteger', 'askfloat', 'color', 'yesnocancel'].includes(k) ? null : k === 'yesno' || k === 'okcancel' || k === 'retrycancel' ? false : k === 'question' ? 'no' : ['openfile', 'savefile', 'dir'].includes(k) ? '' : 'ok';
    back.querySelector('.gd-x').onclick = () => reply(cancelVal);
    const ok = () => {
      if (['askstring', 'askinteger', 'askfloat'].includes(k)) {
        const v = input.value;
        const err = back.querySelector('.gd-err');
        if (k !== 'askstring') {
          const n = k === 'askinteger' ? (/^\s*[-+]?\d+\s*$/.test(v) ? parseInt(v, 10) : NaN) : (/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v) ? parseFloat(v) : NaN);
          if (Number.isNaN(n)) { err.textContent = k === 'askinteger' ? '정수를 입력하세요.' : '숫자를 입력하세요.'; input.focus(); return; }
          if (op.min != null && n < op.min) { err.textContent = `${op.min} 이상의 값을 입력하세요.`; input.focus(); return; }
          if (op.max != null && n > op.max) { err.textContent = `${op.max} 이하의 값을 입력하세요.`; input.focus(); return; }
          return reply(n);
        }
        return reply(v);
      }
      if (k === 'color') return reply(back.querySelector('.gd-color').value);
      if (k === 'openfile') {
        if (op.multiple) {
          const sel = [...back.querySelectorAll('.gd-file.sel')].map((d) => d.dataset.f);
          return reply(sel.length ? sel : '');
        }
        return reply(chosen || '');
      }
      if (k === 'savefile') return reply(input.value.trim());
      return reply(null);
    };
    back.querySelectorAll('[data-ok]').forEach((b) => { b.onclick = ok; });
    back.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => reply(JSON.parse(b.dataset.v)); });
    back.querySelectorAll('.gd-file').forEach((f) => {
      f.onclick = () => {
        if (op.multiple) f.classList.toggle('sel');
        else { back.querySelectorAll('.gd-file').forEach((x) => x.classList.remove('sel')); f.classList.add('sel'); }
        chosen = f.dataset.f;
        if (input && k === 'savefile') input.value = chosen;
      };
      f.ondblclick = () => { chosen = f.dataset.f; if (k === 'savefile') input.value = chosen; ok(); };
    });
    const up = back.querySelector('input[type=file]');
    if (up) {
      up.onchange = async () => {
        const files = [...up.files];
        if (!files.length) return;
        const toB64 = (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
        const items = await Promise.all(files.map(async (f) => ({ name: f.name.replace(/[\\/:*?"<>|]/g, '_'), b64: toB64(await f.arrayBuffer()) })));
        reply(op.multiple ? items : items[0]);
      };
    }
    back.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.target.closest('.gd-files')) { e.preventDefault(); const p = back.querySelector('.gd-b.primary'); if (p) p.click(); }
      if (e.key === 'Escape') { e.preventDefault(); reply(cancelVal); }
      e.stopPropagation();
    });
    setTimeout(() => { (input || back.querySelector('.gd-b.primary') || back).focus(); if (input && input.select) input.select(); }, 20);
  }

  // ================================================================== pygame 화면
  const colorKeyCache = new Map();
  function pgDraw(ctx, ops, W, H) {
    for (const op of ops) {
      switch (op[0]) {
        case 'fill': ctx.fillStyle = op[1]; ctx.fillRect(0, 0, W, H); break;
        case 'rect': {
          const [, col, x, y, w, h, width, rad] = op;
          ctx.beginPath();
          if (rad > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h);
          if (width > 0) { ctx.strokeStyle = col; ctx.lineWidth = width; ctx.beginPath(); if (rad > 0 && ctx.roundRect) ctx.roundRect(x + width / 2, y + width / 2, w - width, h - width, rad); else ctx.rect(x + width / 2, y + width / 2, w - width, h - width); ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
          break;
        }
        case 'circle': {
          const [, col, cx, cy, r, width] = op;
          ctx.beginPath();
          if (width > 0) { ctx.arc(cx, cy, Math.max(0, r - width / 2), 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.stroke(); }
          else { ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
          break;
        }
        case 'ellipse': {
          const [, col, x, y, w, h, width] = op;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, Math.max(0, w / 2 - (width > 0 ? width / 2 : 0)), Math.max(0, h / 2 - (width > 0 ? width / 2 : 0)), 0, 0, Math.PI * 2);
          if (width > 0) { ctx.strokeStyle = col; ctx.lineWidth = width; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
          break;
        }
        case 'arc': {
          const [, col, x, y, w, h, a0, a1, width] = op;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, Math.max(0, w / 2), Math.max(0, h / 2), 0, -a1, -a0);
          ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, width); ctx.stroke();
          break;
        }
        case 'line': {
          const [, col, x1, y1, x2, y2, width] = op;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, width); ctx.stroke();
          break;
        }
        case 'lines': case 'poly': {
          const col = op[1];
          const pts = op[0] === 'lines' ? op[3] : op[2];
          const closed = op[0] === 'lines' ? op[2] : 1;
          const width = op[0] === 'lines' ? op[4] : op[3];
          if (!pts.length) break;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          if (closed) ctx.closePath();
          if (op[0] === 'poly' && !width) { ctx.fillStyle = col; ctx.fill(); } else { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, width); ctx.stroke(); }
          break;
        }
        case 'img': {
          const img = G.images.get(op[1]);
          const src = imageSource(img);
          if (src) ctx.drawImage(src, op[2], op[3], op[4], op[5]);
          break;
        }
        case 'text': {
          const [, text, font, col, x, y, h] = op;
          ctx.font = font; ctx.fillStyle = col; ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y + h / 2);
          break;
        }
        case 's': {
          const [, d, x, y, w, h, angle, fx, fy, area] = op;
          ctx.save();
          if (d.a != null) ctx.globalAlpha *= d.a / 255;
          ctx.translate(x + w / 2, y + h / 2);
          if (angle) ctx.rotate(-angle * Math.PI / 180);
          ctx.scale((fx ? -1 : 1) * (w / Math.max(1, d.w)), (fy ? -1 : 1) * (h / Math.max(1, d.h)));
          ctx.translate(-d.w / 2, -d.h / 2);
          if (area) { ctx.beginPath(); ctx.rect(0, 0, area[2], area[3]); ctx.clip(); ctx.translate(-area[0], -area[1]); }
          else { ctx.beginPath(); ctx.rect(0, 0, d.w, d.h); ctx.clip(); }
          if (d.ck) {
            const off = colorKeyed(d);
            if (off) ctx.drawImage(off, 0, 0);
          } else pgDraw(ctx, d.o, d.w, d.h);
          ctx.restore();
          break;
        }
        default:
      }
    }
  }

  function colorKeyed(d) {
    const key = d.ck + '|' + JSON.stringify(d.o).slice(0, 200) + d.w + 'x' + d.h;
    if (colorKeyCache.has(key)) return colorKeyCache.get(key);
    const off = document.createElement('canvas');
    off.width = Math.max(1, d.w); off.height = Math.max(1, d.h);
    const c = off.getContext('2d');
    pgDraw(c, d.o, d.w, d.h);
    const hex = css(d.ck, '#000');
    const kr = parseInt(hex.slice(1, 3), 16), kg = parseInt(hex.slice(3, 5), 16), kb = parseInt(hex.slice(5, 7), 16);
    try {
      const im = c.getImageData(0, 0, off.width, off.height);
      const p = im.data;
      for (let i = 0; i < p.length; i += 4) if (p[i] === kr && p[i + 1] === kg && p[i + 2] === kb) p[i + 3] = 0;
      c.putImageData(im, 0, 0);
    } catch (e) { /* 무시 */ }
    const ready = d.o.every((op) => op[0] !== 'img' || imageSource(G.images.get(op[1])));
    if (ready) colorKeyCache.set(key, off);
    return off;
  }

  function pgWindow(op) {
    let win = G.wins.get(op.id);
    if (!win) {
      win = makeWindow(op.id, op.title, 'pg');
      const rec = newRec(op.id, 'pgroot', null, win.body);
      rec.isWin = true;
      rec.winId = op.id;
      win.body.innerHTML = '<canvas class="pg-canvas"></canvas>';
      win.canvas = win.body.querySelector('canvas');
      const cv = win.canvas;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) / win.scale), y: Math.round((e.clientY - r.top) / win.scale) }; };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); win.el.focus({ preventScroll: true }); const p = pos(e); send({ k: 'pg', id: op.id, t: 'mousedown', x: p.x, y: p.y, b: e.button }); });
      cv.addEventListener('pointerup', (e) => { const p = pos(e); send({ k: 'pg', id: op.id, t: 'mouseup', x: p.x, y: p.y, b: e.button }); });
      cv.addEventListener('pointermove', (e) => { const now = performance.now(); if (now - lastMove < 14) return; lastMove = now; const p = pos(e); send({ k: 'pg', id: op.id, t: 'mousemove', x: p.x, y: p.y, bs: e.buttons }); });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); send({ k: 'pg', id: op.id, t: 'wheel', dy: e.deltaY }); }, { passive: false });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    win.pgW = op.w; win.pgH = op.h;
    const cv = win.canvas;
    cv.width = op.w; cv.height = op.h;
    cv.style.width = op.w + 'px'; cv.style.height = op.h + 'px';
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, op.w, op.h);
    if (op.title) win.title.textContent = op.title;
    win.needLayout = true;
  }

  // ================================================================== 명령 표
  const OPS = {
    win(op) {
      const win = makeWindow(op.id, op.title, 'tk');
      const rec = newRec(op.id, 'root', null, win.body);
      rec.isWin = true;
      rec.winId = op.id;
      rec.el.classList.add('tk-root');
      win.el.style.visibility = 'hidden';
      bindWinMouse(win);
      if (G.onWindowsChange) G.onWindowsChange();
    },
    pgwin: pgWindow,
    pgframe(op) {
      const win = G.wins.get(op.id);
      if (!win || !win.canvas) return;
      pgDraw(win.canvas.getContext('2d'), op.o, win.pgW, win.pgH);
    },
    pgcursor(op) { const win = G.wins.get(op.id); if (win && win.canvas) win.canvas.style.cursor = op.v ? '' : 'none'; },
    title(op) { const win = G.wins.get(op.id); if (win) win.title.textContent = op.text; },
    geom(op) {
      const win = G.wins.get(op.id);
      if (!win) return;
      if (op.w != null) { win.geomW = op.w; win.geomH = op.h; }
      win.needLayout = true;
    },
    resizable() {}, minsize() {},
    show(op) { const win = G.wins.get(op.id); if (win) win.el.style.display = op.v ? '' : 'none'; },
    wclose(op) { closeWindow(op.id); },
    new(op) { const rec = createWidget(op); applyCfg(rec, op.o || {}); },
    cfg(op) { const rec = G.w.get(op.id); if (rec) applyCfg(rec, op.o || {}); },
    geo(op) {
      const rec = G.w.get(op.id);
      if (!rec) return;
      const p = G.w.get(rec.parent);
      rec.geo = op.m ? { m: op.m, o: op.o || {} } : null;
      if (p) {
        const i = p.packList.indexOf(rec.id);
        if (op.m === 'pack') {
          const o = op.o || {};
          if (o.before || o.after) {
            if (i >= 0) p.packList.splice(i, 1);
            const ref = p.packList.indexOf(o.before || o.after);
            if (ref >= 0) p.packList.splice(o.before ? ref : ref + 1, 0, rec.id); else p.packList.push(rec.id);
          } else if (i < 0) p.packList.push(rec.id);
        } else if (i >= 0) p.packList.splice(i, 1);
        markLayout(p);
      }
    },
    gridcfg(op) {
      const rec = G.w.get(op.id);
      if (!rec) return;
      const t = rec.gridCfg[op.axis];
      t[op.i] = Object.assign(t[op.i] || {}, op.o);
      markLayout(rec);
    },
    prop(op) { const rec = G.w.get(op.id); if (rec) { rec.prop = op.v; markLayout(rec); } },
    del(op) {
      const rec = G.w.get(op.id);
      if (!rec) return;
      const p = G.w.get(rec.parent);
      if (p) {
        p.children = p.children.filter((x) => x !== rec.id);
        p.packList = p.packList.filter((x) => x !== rec.id);
        markLayout(p);
      }
      rec.el.remove();
      const rm = (r) => { G.w.delete(r.id); r.children.forEach((c) => { const cr = G.w.get(c); if (cr) rm(cr); }); };
      rm(rec);
    },
    want(op) {
      if (op.id === '*') { G.globalWants = new Set(op.t); return; }
      const rec = G.w.get(op.id);
      if (rec) rec.wants = new Set(op.t);
      const win = G.wins.get(op.id);
      if (win) win.wants = new Set(op.t);
    },
    focus(op) {
      const rec = G.w.get(op.id);
      if (!rec) return;
      const win = G.wins.get(rec.winId);
      if (win) win.focusWidget = rec.id;
      const inp = rec.el.querySelector('input,textarea');
      setTimeout(() => { try { (inp || (win && win.el)).focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);
    },
    raise(op) {
      const win = G.wins.get(op.id);
      if (win) win.el.style.zIndex = ++G.z;
      const rec = G.w.get(op.id);
      if (rec && !rec.isWin) rec.el.style.zIndex = ++G.z;
    },
    lower(op) { const rec = G.w.get(op.id); if (rec && !rec.isWin) rec.el.style.zIndex = 0; },
    select(op) { const rec = G.w.get(op.id); const inp = rec && rec.el.querySelector('input'); if (inp) inp.select(); },
    see() {},
    bell() {},
    menubar(op) { const win = G.wins.get(op.id); if (win) renderMenubar(win, op.tree); },
    popup(op) { closeMenus(); if (op.tree && op.tree.length) dropMenu(op.tree, op.x, op.y); },
    dlg: dialog,
    // 캔버스
    ci(op) { const rec = G.w.get(op.id); if (!rec || !rec.items) return; if (!rec.items.has(op.n)) rec.order.push(op.n); rec.items.set(op.n, { t: op.t, c: op.c, o: op.o || {} }); canvasDirty(rec); },
    cc(op) { const rec = G.w.get(op.id); const it = rec && rec.items && rec.items.get(op.n); if (it) { it.c = op.c; canvasDirty(rec); } },
    co(op) { const rec = G.w.get(op.id); const it = rec && rec.items && rec.items.get(op.n); if (it) { Object.assign(it.o, op.o); canvasDirty(rec); } },
    cd(op) {
      const rec = G.w.get(op.id);
      if (!rec || !rec.items) return;
      const gone = new Set(op.n);
      for (const n of op.n) {
        const it = rec.items.get(n);
        if (it && it.t === 'window') { const child = G.w.get(it.o.window); if (child) child.el.style.display = 'none'; }
        rec.items.delete(n);
      }
      rec.order = rec.order.filter((n) => !gone.has(n));
      canvasDirty(rec);
    },
    cz(op) { const rec = G.w.get(op.id); if (rec && rec.items) { rec.order = op.order.slice(); canvasDirty(rec); } },
    // 이미지
    imgd(op) {
      G.images.set(op.id, { src: op.src, w: op.w, h: op.h, users: new Set() });
      imageChanged(op.id);
    },
    imgref(op) { imageChanged(op.id); },
    sound(op) {
      const s = G.sounds.get(op.id);
      if (!s) return;
      if (op.act === 'play') {
        try {
          const a = new Audio(s.url);
          a.volume = op.vol != null ? op.vol : 1;
          a.loop = op.loops === -1;
          a.play().catch(() => {});
          s.audio = a;
        } catch (e) { /* 무시 */ }
      } else if (op.act === 'stop' && s.audio) s.audio.pause();
    }
  };

  window.addEventListener('resize', () => { for (const win of G.wins.values()) win.needLayout = true; schedule(); });

  window.PyGui = G;
})();
