/* 브라우저 파이썬 실행 엔진 (메인 화면 쪽)
 * - Pyodide 워커(js/py-worker.js)를 만들고 관리한다.
 * - 실행 중 입력(input) · GUI 이벤트 · 대화상자 응답을 워커로 보낸다.
 *   ① 교차 출처 격리(crossOriginIsolated)면 SharedArrayBuffer + Atomics (GitHub Pages 는 coi-sw.js 로 격리)
 *   ② 아니면 실습 서버(server/serve.py)의 채널 API (교실 LAN 접속)
 *   ③ 둘 다 없으면 입력은 미리 받아 두고 실행한다
 */
(function () {
  const VERSION = '20261007';
  const base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  const enc = new TextEncoder();

  const E = {
    state: 'idle', message: '', mode: null, python: '', loadMs: 0, listeners: [],
    onChange(fn) { this.listeners.push(fn); fn(this); },
    set(state, message) { this.state = state; this.message = message || ''; this.listeners.forEach((f) => { try { f(this); } catch (e) { /* 무시 */ } }); },
    supported() { return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined'; },
    base, version: VERSION
  };

  let worker = null;
  let readyP = null;
  let ctrlBuf = null, ctrl = null, data = null, intr = null;
  let queue = [];
  let sid = '';
  let run = null;           // 현재 실행 { resolve, handlers }
  let reqSeq = 0;
  const pending = {};

  // ------------------------------------------------------------------ 채널
  function pump() {
    if (!queue.length) return;
    if (E.mode === 'sab') {
      if (Atomics.load(ctrl, 0) !== 0) return;
      const bytes = enc.encode(JSON.stringify(queue));
      if (bytes.length > data.length) { queue = queue.slice(1); return pump(); }
      queue = [];
      data.set(bytes);
      ctrl[1] = bytes.length;
      Atomics.store(ctrl, 0, 1);
      Atomics.notify(ctrl, 0);
    } else if (E.mode === 'xhr') {
      const msgs = queue;
      queue = [];
      fetch(`/api/chan/push?sid=${sid}`, { method: 'POST', body: JSON.stringify(msgs), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    } else {
      queue = [];
    }
  }
  E.send = function (msg) {
    queue.push(msg);
    pump();
  };

  async function detectMode() {
    if (self.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') return 'sab';
    if (/^https?:$/.test(location.protocol)) {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        const j = await r.json();
        if (j && j.ok && j.chan) return 'xhr';
      } catch (e) { /* 서버 없음 */ }
    }
    return 'none';
  }

  // ------------------------------------------------------------------ 워커
  E.load = function () {
    if (readyP) return readyP;
    const t0 = performance.now();
    E.set('loading', '파이썬 실행 환경 준비 중…');
    readyP = (async () => {
      E.mode = await detectMode();
      sid = 's' + Math.random().toString(36).slice(2, 12);
      worker = new Worker(`js/py-worker.js?v=${VERSION}`, { type: 'module' });
      const init = { type: 'init', mode: E.mode, base, version: VERSION, sid, xhrBase: '' };
      if (E.mode === 'sab') {
        ctrlBuf = new SharedArrayBuffer(8 + 16 * 1024 * 1024);
        ctrl = new Int32Array(ctrlBuf, 0, 2);
        data = new Uint8Array(ctrlBuf, 8);
        intr = new Int32Array(new SharedArrayBuffer(4));
        init.ctrl = ctrlBuf;
        init.intr = intr.buffer;
      } else {
        intr = null;
      }
      await new Promise((resolve, reject) => {
        worker.onmessage = (e) => onMessage(e.data, resolve, reject);
        worker.onerror = (e) => reject(new Error(e.message || '워커 오류'));
        worker.postMessage(init);
      });
      E.loadMs = performance.now() - t0;
      E.set('ready', '');
    })().catch((err) => {
      E.set('error', String(err && err.message || err));
      readyP = null;
      if (worker) { worker.terminate(); worker = null; }
      throw err;
    });
    return readyP;
  };

  function onMessage(m, resolve, reject) {
    switch (m.type) {
      case 'status': E.set('loading', m.message); break;
      case 'ready': E.python = m.python; E.pyodide = m.version; resolve && resolve(); break;
      case 'error': reject && reject(new Error(m.message)); break;
      case 'out': if (run && run.onOutput) run.onOutput(m.s, m.t); break;
      case 'waitInput': if (run && run.onWaitInput) run.onWaitInput(true); break;
      case 'gotInput': if (run && run.onWaitInput) run.onWaitInput(false); break;
      case 'pull': pump(); break;
      case 'gui': if (window.PyGui) PyGui.apply(m.ops); break;
      case 'rich': if (run && run.onRich) run.onRich(m.kind, m.data); break;
      case 'bin': if (window.PyGui) PyGui.binary(m.id, m.kind, m.bytes, m.meta); break;
      case 'done':
        if (run) { const r = run; run = null; r.resolve({ exit: m.exit, ms: m.ms }); }
        break;
      case 'reply': {
        const p = pending[m.rid];
        if (p) { delete pending[m.rid]; p(m); }
        break;
      }
      default:
    }
  }

  function request(msg, transfer) {
    return new Promise((resolve) => {
      const rid = 'r' + (++reqSeq);
      pending[rid] = resolve;
      worker.postMessage(Object.assign({ rid }, msg), transfer || []);
      setTimeout(() => { if (pending[rid]) { delete pending[rid]; resolve({ ok: false, error: '시간 초과 (프로그램 실행 중에는 사용할 수 없습니다)' }); } }, 8000);
    });
  }

  // ------------------------------------------------------------------ 실행
  /**
   * @param {{code:string, stdin?:string, repl?:boolean, onOutput:Function, onWaitInput:Function}} opts
   * @returns {Promise<{exit:number, ms:number}>}
   */
  E.run = async function (opts) {
    await E.load();
    if (run) await E.stop();
    if (window.PyGui) PyGui.reset();
    queue = [];
    if (E.mode === 'sab') Atomics.store(ctrl, 0, 0);
    if (intr) intr[0] = 0;
    return new Promise((resolve) => {
      run = { resolve, onOutput: opts.onOutput, onWaitInput: opts.onWaitInput, onRich: opts.onRich };
      const env = window.AgentKeys ? AgentKeys.env() : {};
      worker.postMessage({ type: 'run', code: opts.code, stdin: opts.stdin || '', repl: !!opts.repl, env });
    });
  };

  E.running = () => !!run;

  E.input = function (text) { E.send({ k: 'stdin', t: text }); };
  E.eof = function () { E.send({ k: 'eof' }); };

  /** 실행 중지: 인터럽트(KeyboardInterrupt) → 응답이 없으면 워커를 다시 만든다 */
  E.stop = function () {
    if (!run) return Promise.resolve();
    const r = run;
    if (intr) { intr[0] = 2; }
    E.send({ k: 'interrupt' });
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        if (run === r) {
          // 멈추지 않는 프로그램: 워커를 새로 만든다
          worker.terminate();
          worker = null;
          readyP = null;
          run = null;
          r.resolve({ exit: 137, ms: 0, killed: true });
          if (window.PyGui) PyGui.reset();
          E.set('idle', '');
          E.load().catch(() => {});
        }
        resolve();
      }, 1500);
      const orig = r.resolve;
      r.resolve = (v) => { clearTimeout(t); orig(v); resolve(); };
    });
  };

  // ------------------------------------------------------------------ 작업 폴더
  E.listFiles = async function () {
    await E.load();
    if (run) return { ok: false, error: '프로그램이 실행 중입니다. 끝난 뒤에 확인하세요.' };
    return request({ type: 'files' });
  };
  E.readFile = async function (name) {
    await E.load();
    return request({ type: 'readFile', name });
  };
  E.writeFile = async function (name, bytes) {
    await E.load();
    if (run) return { ok: false, error: '프로그램이 실행 중입니다.' };
    return request({ type: 'writeFile', name, bytes }, [bytes.buffer]);
  };
  E.clearFiles = async function () {
    await E.load();
    if (run) return { ok: false, error: '프로그램이 실행 중입니다.' };
    return request({ type: 'clearFiles', base, version: VERSION });
  };

  window.PyEngine = E;
})();
