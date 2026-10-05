/* 슬라이드 판서(필기) — 펜 · 형광펜 · 지우개 · 지시봉
 * - 좌표는 슬라이드 기준(1280×720)으로 저장하므로 화면 크기가 바뀌어도 같은 위치에 그려진다.
 * - 캔버스는 슬라이드 좌표의 2배 해상도로 그려 선명하게 보인다.
 * - 판서는 슬라이드마다 따로 보관한다 (새로 고치면 사라짐). 도구 · 색 · 굵기만 브라우저에 기억한다.
 */
(function () {
  const W = 1280, H = 720;          // 슬라이드 기준 좌표
  const SCALE = 2;                  // 캔버스 해상도 배율
  const UNDO_MAX = 50;
  const COLORS = [
    ['#e53935', '빨강'], ['#1e63e9', '파랑'], ['#1b9e4b', '초록'],
    ['#ffc400', '노랑'], ['#111111', '검정'], ['#ffffff', '흰색']
  ];
  const WIDTHS = [[3, '가늘게'], [6, '보통'], [12, '굵게']];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }
  };

  const Ink = {
    tool: store.get('jc.inkTool', 'pen'),
    color: store.get('jc.inkColor', '#e53935'),
    width: +store.get('jc.inkWidth', 6) || 6,
    COLORS, WIDTHS,
    pages: new Map(),      // 슬라이드 키 → { strokes: [], undo: [] }
    key: '',
    drawing: false,
    justDrew: false,       // 그리기로 끝난 클릭은 쪽 넘김에 쓰지 않는다
    onChange: null,
    enabled: document.body.classList.contains('role-teacher')
  };

  let canvas = null, ctx = null, stage = null, cur = null, erased = null;

  function page() {
    if (!Ink.pages.has(Ink.key)) Ink.pages.set(Ink.key, { strokes: [], undo: [] });
    return Ink.pages.get(Ink.key);
  }

  function pushUndo(op) {
    const p = page();
    p.undo.push(op);
    if (p.undo.length > UNDO_MAX) p.undo.shift();
  }

  // ------------------------------------------------------------------ 그리기
  function redraw() {
    if (!ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const s of page().strokes) drawStroke(s);
    if (cur) drawStroke(cur);
  }

  function drawStroke(s) {
    const pts = s.pts;
    if (!pts.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = s.color;
    if (s.tool === 'marker') {
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = s.width * 3;
      ctx.lineCap = 'butt';
    } else {
      ctx.lineWidth = s.width;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  }

  // 점과 선분의 거리 (지우개 판정)
  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    if (!dx && !dy) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
  }

  function eraseAt(x, y) {
    const p = page();
    const hit = [];
    for (let i = p.strokes.length - 1; i >= 0; i--) {
      const s = p.strokes[i];
      const tol = (s.tool === 'marker' ? s.width * 1.5 : s.width / 2) + 9;
      let touched = false;
      const pts = s.pts;
      for (let j = 0; j < pts.length && !touched; j++) {
        const a = pts[j], b = pts[j + 1] || pts[j];
        if (segDist(x, y, a.x, a.y, b.x, b.y) <= tol) touched = true;
      }
      if (touched) hit.push({ index: i, stroke: s });
    }
    if (!hit.length) return false;
    hit.forEach((h) => p.strokes.splice(h.index, 1));
    if (erased) erased.items.push(...hit);
    return true;
  }

  // ------------------------------------------------------------------ 좌표
  function toSlide(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(W, (e.clientX - r.left) / r.width * W)),
      y: Math.max(0, Math.min(H, (e.clientY - r.top) / r.height * H))
    };
  }

  const INTERACTIVE = 'button, a, input, textarea, select, label, .opt, .CodeMirror, .s-editor-bar, .grid-item';

  function onDown(e) {
    if (!Ink.enabled || e.button !== 0) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;    // 버튼 · 링크 · 퀴즈 보기는 그대로 클릭
    if (e.target.closest && e.target.closest('.edge')) return;        // 좌우 가장자리는 쪽 이동
    if (Ink.tool === 'laser') return;
    const p = toSlide(e);
    Ink.drawing = true;
    Ink.justDrew = false;
    stage.classList.add('inking');
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    if (Ink.tool === 'eraser') {
      erased = { type: 'del', items: [] };
      if (eraseAt(p.x, p.y)) redraw();
    } else {
      cur = { tool: Ink.tool, color: Ink.color, width: Ink.width, pts: [p] };
    }
    e.preventDefault();
  }

  function onMove(e) {
    if (!Ink.drawing) return;
    const p = toSlide(e);
    if (Ink.tool === 'eraser') {
      if (eraseAt(p.x, p.y)) redraw();
    } else if (cur) {
      const last = cur.pts[cur.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.2) return;
      cur.pts.push(p);
      redraw();
    }
    e.preventDefault();
  }

  function onUp(e) {
    if (!Ink.drawing) return;
    Ink.drawing = false;
    stage.classList.remove('inking');
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    if (Ink.tool === 'eraser') {
      if (erased && erased.items.length) { pushUndo(erased); Ink.justDrew = true; }
      erased = null;
    } else if (cur) {
      if (cur.pts.length > 1) {          // 단순 클릭(끌지 않음)으로는 점이 찍히지 않는다
        page().strokes.push(cur);
        pushUndo({ type: 'add', stroke: cur });
        Ink.justDrew = true;
      }
      cur = null;
      redraw();
    }
    if (Ink.justDrew) setTimeout(() => { Ink.justDrew = false; }, 0);
    if (Ink.onChange) Ink.onChange();
  }

  // ------------------------------------------------------------------ 공개 기능
  Ink.init = function (stageEl, canvasEl) {
    stage = stageEl;
    canvas = canvasEl;
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx = canvas.getContext('2d');
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    Ink.applyCursor();
    redraw();
  };

  Ink.setSlide = function (key) {
    Ink.key = key;
    cur = null;
    redraw();
    if (Ink.onChange) Ink.onChange();
  };

  Ink.setTool = function (tool) {
    Ink.tool = tool;
    store.set('jc.inkTool', tool);
    Ink.applyCursor();
    if (Ink.onChange) Ink.onChange();
  };

  /** 지우개 · 지시봉 상태에서 색 · 굵기를 고르면 자동으로 펜으로 바뀐다 */
  Ink.setColor = function (c) {
    Ink.color = c;
    store.set('jc.inkColor', c);
    if (Ink.tool === 'eraser' || Ink.tool === 'laser') Ink.setTool('pen');
    else if (Ink.onChange) Ink.onChange();
  };

  Ink.setWidth = function (w) {
    Ink.width = +w;
    store.set('jc.inkWidth', String(w));
    if (Ink.tool === 'eraser' || Ink.tool === 'laser') Ink.setTool('pen');
    else if (Ink.onChange) Ink.onChange();
  };

  Ink.applyCursor = function () {
    if (!stage) return;
    stage.dataset.tool = Ink.tool;
  };

  Ink.undo = function () {
    const p = page();
    const op = p.undo.pop();
    if (!op) return false;
    if (op.type === 'add') {
      const i = p.strokes.lastIndexOf(op.stroke);
      if (i >= 0) p.strokes.splice(i, 1);
    } else {
      op.items.slice().reverse().forEach((h) => p.strokes.splice(Math.min(h.index, p.strokes.length), 0, h.stroke));
    }
    redraw();
    if (Ink.onChange) Ink.onChange();
    return true;
  };

  Ink.clearSlide = function () {
    const p = page();
    if (!p.strokes.length) return false;
    pushUndo({ type: 'del', items: p.strokes.map((s, i) => ({ index: i, stroke: s })) });
    p.strokes = [];
    redraw();
    if (Ink.onChange) Ink.onChange();
    return true;
  };

  Ink.clearAll = function () {
    Ink.pages.clear();
    redraw();
    if (Ink.onChange) Ink.onChange();
  };

  Ink.hasInk = function () { return page().strokes.length > 0; };
  Ink.canUndo = function () { return page().undo.length > 0; };
  Ink.redraw = redraw;

  window.Ink = Ink;
})();
