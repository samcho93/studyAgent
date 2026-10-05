/* 체험 데모(캔버스)용 도우미 — lessons/*.js 의 demo 블록 init(el, MLB) 에서 사용 */
(function () {
  'use strict';
  const MLB = {
    css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
    /** 현재 테마의 그림 색 */
    palette() {
      const c = (n) => this.css(n);
      return { bg: c('--f-bg'), line: c('--f-line'), text: c('--f-text'), muted: c('--muted'),
        p1: c('--f-p1'), p2: c('--f-p2'), p3: c('--f-p3'), p4: c('--f-p4'), p5: c('--f-p5'),
        p1s: c('--f-p1-soft'), p2s: c('--f-p2-soft'), p3s: c('--f-p3-soft'), p4s: c('--f-p4-soft'), p5s: c('--f-p5-soft') };
    },
    /** 캔버스를 고해상도(DPR)로 준비 → {ctx, w, h} (w, h 는 논리 좌표) */
    setupCanvas(canvas, w, h) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.aspectRatio = `${w} / ${h}`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    },
    /** 마우스/터치 좌표 → 캔버스 논리 좌표 */
    pointer(canvas, e, w, h) {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: (p.clientX - r.left) * w / r.width, y: (p.clientY - r.top) * h / r.height };
    },
    /** 재현 가능한 난수 (0~1) */
    rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
    gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    /** 테마가 바뀌면 다시 그리기 (요소가 화면에서 사라지면 자동 해제) */
    onTheme(fn, el) {
      const h = () => { if (el && !el.isConnected) { document.removeEventListener('themechange', h); return; } fn(); };
      document.addEventListener('themechange', h);
    },
    /** 요소가 화면에서 사라지면 멈추는 애니메이션 루프: step() 이 false 를 돌려주면 정지 */
    loop(el, step) {
      let on = true;
      const f = () => { if (!on || (el && !el.isConnected)) return; if (step() !== false) requestAnimationFrame(f); };
      requestAnimationFrame(f);
      return () => { on = false; };
    }
  };
  window.MLB = MLB;
})();
