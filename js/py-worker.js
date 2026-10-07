/* 파이썬 실행 워커 (Pyodide)
 * - 메인 화면과 postMessage 로 통신하고, 실행 중 입력(input) · GUI 이벤트는 공유 메모리(SharedArrayBuffer)
 *   또는 실습 서버의 채널(동기 XHR)로 받는다.
 */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
const WORK = '/home/pyodide/work';
const LIB = '/home/pyodide/lib';
const PY_FILES = [
  '_webgui.py', '_runtime.py', '_pil_imagetk.py', 'sitecustomize.py', 'turtle.py',
  'tkinter/__init__.py', 'tkinter/constants.py', 'tkinter/messagebox.py', 'tkinter/simpledialog.py',
  'tkinter/filedialog.py', 'tkinter/colorchooser.py', 'tkinter/font.py', 'tkinter/scrolledtext.py', 'tkinter/ttk.py',
  'pygame/__init__.py', 'pygame/constants.py', 'pygame/locals.py', 'pygame/sprite.py', 'pygame/math.py',
  '_mlrich.py',
  'agentlab/__init__.py', 'agentlab/_http.py', 'agentlab/llm.py', 'agentlab/mock.py', 'agentlab/tools.py', 'agentlab/memory.py',
  'agentlab/agent.py', 'agentlab/chain.py', 'agentlab/graph.py', 'agentlab/crew.py', 'agentlab/autogen.py',
  'builder/__init__.py', 'builder/nodes.py', 'builder/engine.py', 'builder/export.py', 'builder/providers.py', 'builder/mcp.py', 'builder/skills.py'
];
// import 이름 → Pyodide 패키지
const PACKAGES = {
  PIL: 'pillow', numpy: 'numpy', matplotlib: 'matplotlib', pandas: 'pandas',
  sklearn: 'scikit-learn', scipy: 'scipy', joblib: 'joblib'
};
const pkgsFor = (n) => [].concat(PACKAGES[n] || []);
let baseUrl = '';

let py = null;
let mode = 'none';          // 'sab' | 'xhr' | 'none'
let ctrl = null, data = null, intr = null;
let xhrBase = '', sid = '';
const stdinQ = [];
let stdinEof = false;
let evQ = [];
let echoStdin = false;
let preCount = 0;          // 미리 넣은 입력 줄 수 (화면에 보여 줄 줄)
let running = false;
const enc = new TextEncoder();
const dec = new TextDecoder();

// ------------------------------------------------------------------ 출력 모으기 (너무 잦은 메시지 방지)
let outBuf = { o: '', e: '' };
let outLast = 0;
let outTotal = 0;
const OUT_LIMIT = 2000000;
function out(stream, text) {
  if (!text) return;
  if (outTotal > OUT_LIMIT) return;
  outTotal += text.length;
  if (outTotal > OUT_LIMIT) text += '\n⚠ 출력이 너무 많아 이후 출력은 생략합니다.\n';
  const other = stream === 'o' ? 'e' : 'o';
  if (outBuf[other]) flushOut();
  outBuf[stream] += text;
  const now = performance.now();
  if (now - outLast > 40 || outBuf[stream].length > 20000) flushOut();
}
function flushOut() {
  outLast = performance.now();
  for (const s of ['o', 'e']) {
    if (outBuf[s]) { postMessage({ type: 'out', s, t: outBuf[s] }); outBuf[s] = ''; }
  }
}

// ------------------------------------------------------------------ 채널 (입력 · 이벤트 받기)
function route(msgs) {
  for (const m of msgs) {
    if (m.k === 'stdin') stdinQ.push(m.t);
    else if (m.k === 'eof') stdinEof = true;
    else if (m.k === 'interrupt') { if (intr) intr[0] = 2; }
    else evQ.push(m);
  }
}

function pullOnce(timeout) {
  if (mode === 'sab') {
    if (Atomics.load(ctrl, 0) === 0) {
      if (timeout <= 0) return false;
      const r = Atomics.wait(ctrl, 0, 0, timeout);
      if (r === 'timed-out') return false;
    }
    const len = ctrl[1];
    const s = dec.decode(data.slice(0, len));
    Atomics.store(ctrl, 0, 0);
    postMessage({ type: 'pull' });
    try { route(JSON.parse(s)); } catch (e) { /* 무시 */ }
    return true;
  }
  if (mode === 'xhr') {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', `${xhrBase}/api/chan/pull?sid=${sid}&timeout=${Math.max(0, Math.round(timeout))}`, false);
      x.send();
      if (x.status === 200) {
        const arr = JSON.parse(x.responseText);
        if (arr.length) { route(arr); return true; }
      }
    } catch (e) { busyWait(Math.min(timeout, 50)); }
    return false;
  }
  busyWait(Math.min(timeout, 50));
  return false;
}

function busyWait(ms) {
  const end = performance.now() + ms;
  while (performance.now() < end) { /* 기다림 */ }
}

function checkInterrupt() {
  if (intr && intr[0] !== 0) py.checkInterrupt();
}

/** cond() 가 참이 될 때까지(또는 timeout) 기다린다 */
function waitFor(cond, timeoutMs) {
  const end = performance.now() + timeoutMs;
  while (!cond()) {
    checkInterrupt();
    const left = end - performance.now();
    if (left <= 0) return false;
    pullOnce(Math.min(left, 100));
  }
  checkInterrupt();
  return true;
}

// ------------------------------------------------------------------ 표준 입력
function readStdin() {
  flushOut();
  if (!stdinQ.length && !stdinEof) {
    if (mode === 'none') return undefined;
    postMessage({ type: 'waitInput' });
    waitFor(() => stdinQ.length > 0 || stdinEof, 1e12);
    postMessage({ type: 'gotInput' });
  }
  if (stdinQ.length) {
    const line = stdinQ.shift();
    if (echoStdin && preCount > 0) { preCount--; out('o', line); }
    return line;
  }
  return undefined;
}

// ------------------------------------------------------------------ JS 모듈 (_webbridge)
const bridge = {
  mode: () => mode,
  post(json) { flushOut(); postMessage({ type: 'gui', ops: json }); },
  post_bin(id, kind, buf, meta) {
    flushOut();
    const bytes = buf.toJs();
    if (buf.destroy) buf.destroy();
    postMessage({ type: 'bin', id, kind, bytes, meta: JSON.parse(meta) }, [bytes.buffer]);
  },
  wait(ms) {
    flushOut();
    if (!evQ.length) waitFor(() => evQ.length > 0, ms);
    else checkInterrupt();
    const r = JSON.stringify(evQ);
    evQ = [];
    return r;
  },
  /** 풍부한 출력(그래프 PNG · HTML 표)을 결과 창으로 보낸다 */
  rich(kind, payload) { flushOut(); postMessage({ type: 'rich', kind, data: payload }); },
  base() { return baseUrl; },
  /** 동기 XHR 로 파일 내려받기 (워커 안에서만 가능) → Uint8Array 또는 null */
  fetch_bytes(url) {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', url, false);
      x.responseType = 'arraybuffer';
      x.send();
      if (x.status >= 200 && x.status < 300 && x.response) return new Uint8Array(x.response);
    } catch (e) { /* 실패 */ }
    return null;
  },
  /** 동기 XHR 로 HTTP 요청 (LLM API 호출용) → JSON 문자열 {status, text} */
  fetch_json(url, method, headersJson, body) {
    try {
      const x = new XMLHttpRequest();
      x.open(method || 'GET', url, false);
      let headers = {};
      try { headers = JSON.parse(headersJson || '{}'); } catch (e) { headers = {}; }
      for (const k of Object.keys(headers)) { try { x.setRequestHeader(k, headers[k]); } catch (e) { /* 금지된 헤더 */ } }
      x.send(body ? body : null);
      return JSON.stringify({ status: x.status, text: x.responseText || '' });
    } catch (e) {
      return JSON.stringify({ status: 0, text: String(e && e.message || e) });
    }
  },
  poll() {
    flushOut();
    if (mode === 'sab') { while (pullOnce(0)) { /* 쌓인 것 모두 */ } }
    else if (mode === 'xhr') pullOnce(0);
    checkInterrupt();
    const r = JSON.stringify(evQ);
    evQ = [];
    return r;
  }
};

// ------------------------------------------------------------------ 초기화
async function init(m) {
  mode = m.mode;
  if (m.ctrl) {
    ctrl = new Int32Array(m.ctrl, 0, 2);
    data = new Uint8Array(m.ctrl, 8);
  }
  if (m.intr) intr = new Int32Array(m.intr);
  else intr = new Int32Array(1);
  xhrBase = m.xhrBase || '';
  sid = m.sid || '';
  const base = m.base;
  baseUrl = base;

  postMessage({ type: 'status', message: '파이썬 실행 환경 내려받는 중…' });
  const { loadPyodide } = await import(PYODIDE_URL + 'pyodide.mjs');
  py = await loadPyodide({ indexURL: PYODIDE_URL, env: { HOME: '/home/pyodide' } });
  postMessage({ type: 'status', message: '파이썬 준비 중…' });
  py.setInterruptBuffer(intr);
  py.setStdout({ write: (b) => { out('o', dec.decode(b, { stream: true })); return b.length; }, isatty: true });
  py.setStderr({ write: (b) => { out('e', dec.decode(b, { stream: true })); return b.length; }, isatty: true });
  py.setStdin({ stdin: readStdin, isatty: false });
  py.registerJsModule('_webbridge', bridge);

  // 강좌용 모듈(tkinter · turtle · pygame 호환) 설치
  const FS = py.FS;
  const mkdirs = (p) => { let cur = ''; for (const part of p.split('/').filter(Boolean)) { cur += '/' + part; try { FS.mkdir(cur); } catch (e) { /* 있음 */ } } };
  mkdirs(LIB + '/tkinter'); mkdirs(LIB + '/pygame'); mkdirs(LIB + '/agentlab'); mkdirs(LIB + '/builder'); mkdirs(WORK);
  const ver = m.version || '';
  await Promise.all(PY_FILES.map(async (f) => {
    const r = await fetch(`${base}py/${f}?v=${ver}`, { cache: 'no-cache' });
    if (!r.ok) throw new Error('모듈을 불러오지 못했습니다: ' + f);
    FS.writeFile(`${LIB}/${f}`, new Uint8Array(await r.arrayBuffer()));
  }));
  await loadAssets(base, ver);

  py.runPython(`
import sys, os, time
os.environ['MPLBACKEND'] = 'Agg'
sys.path.insert(0, ${JSON.stringify(LIB)})
os.chdir(${JSON.stringify(WORK)})
import sitecustomize, _webgui, _runtime
time.sleep = _webgui.sleep
sys.setrecursionlimit(2000)
`);
  postMessage({ type: 'ready', version: py.version, python: py.runPython('import sys; sys.version.split()[0]') });
}

// 예제에서 쓰는 그림 · 데이터 파일(assets/) 을 작업 폴더에 복사
async function loadAssets(base, ver) {
  try {
    const r = await fetch(`${base}assets/manifest.json?v=${ver}`, { cache: 'no-cache' });
    if (!r.ok) return;
    const list = await r.json();
    await Promise.all(list.map(async (f) => {
      try {
        const res = await fetch(`${base}assets/${f}`);
        if (!res.ok) return;
        const buf = new Uint8Array(await res.arrayBuffer());
        const dir = (WORK + '/' + f).split('/').slice(0, -1).join('/');
        let cur = '';
        for (const part of dir.split('/').filter(Boolean)) { cur += '/' + part; try { py.FS.mkdir(cur); } catch (e) { /* 있음 */ } }
        py.FS.writeFile(`${WORK}/${f}`, buf);
      } catch (e) { /* 무시 */ }
    }));
    assetList = list;
  } catch (e) { /* 무시 */ }
}
let assetList = [];

// ------------------------------------------------------------------ 실행
async function run(m) {
  running = true;
  stdinQ.length = 0;
  preCount = 0;
  stdinEof = false;
  evQ = [];
  outTotal = 0;
  echoStdin = !!m.stdin;   // 미리 넣은 입력은 터미널처럼 화면에 보여 준다
  intr[0] = 0;
  if (m.stdin) {
    const lines = String(m.stdin).split(/(?<=\n)/);
    for (const l of lines) if (l) stdinQ.push(l.endsWith('\n') ? l : l + '\n');
    preCount = stdinQ.length;
    if (m.repl) { /* 예제 줄을 보낸 뒤에도 계속 입력 가능 */ } else if (mode === 'none') stdinEof = true;
  }
  const t0 = performance.now();
  let exit = 0;
  try {
    // 필요한 패키지 (Pillow 등)
    let names = [];
    try { names = py.pyodide_py.code.find_imports(m.code).toJs(); } catch (e) { names = []; }
    const want = names.flatMap(pkgsFor);
    if (/\.(plot|hist|boxplot)\s*\(|\bplt\b/.test(m.code)) want.push('matplotlib');
    // LLM API 키 등 환경 변수 (sessionStorage → 메인 화면 → 워커). 매 실행마다 새로 넣는다
    try {
      py.runPython(`
import os
for _k in list(os.environ):
    if _k.startswith('AGENTLAB_') or _k.endswith('_API_KEY') or _k == 'OLLAMA_URL':
        del os.environ[_k]
os.environ.update(${JSON.stringify(m.env || {})})
`);
    } catch (e) { /* 무시 */ }
    const need = [...new Set(want)].filter((p) => !loaded.has(p));
    if (need.length) {
      flushOut();
      postMessage({ type: 'out', s: 'm', t: `[패키지 불러오는 중: ${need.join(', ')} …]\n` });
      for (const p of need) {
        try { await py.loadPackage(p, { messageCallback: () => {}, errorCallback: () => {} }); loaded.add(p); } catch (e) { /* 없는 패키지 */ }
      }
      if (need.includes('pillow')) {
        // PIL.ImageTk 를 브라우저용 모듈로 (sitecustomize 가 처리)
        try { py.runPython('import importlib; importlib.invalidate_caches()'); } catch (e) { /* 무시 */ }
      }
    }
    const fn = py.globals.get('_run_entry') || py.runPython(`
def _run_entry(code, repl, echo):
    import _runtime, sys, _mlrich
    _mlrich.prepare(code)
    if repl:
        return _runtime.repl(echo=False, banner=not echo)
    try:
        return _runtime.run_main(code)
    finally:
        _mlrich.flush()
_run_entry`);
    exit = fn(m.code, !!m.repl, !!m.stdin);
  } catch (e) {
    const msg = String(e && e.message || e);
    if (/KeyboardInterrupt/.test(msg)) { out('e', 'KeyboardInterrupt\n'); exit = 130; }
    else { out('e', msg + '\n'); exit = 1; }
  }
  try { py.runPython('import sys\nsys.stdout.flush(); sys.stderr.flush()'); } catch (e) { /* 무시 */ }
  flushOut();
  running = false;
  postMessage({ type: 'done', exit, ms: Math.round(performance.now() - t0) });
}
const loaded = new Set();

// ------------------------------------------------------------------ 작업 폴더
function listFiles() {
  const outList = [];
  const walk = (dir, rel) => {
    for (const name of py.FS.readdir(dir)) {
      if (name === '.' || name === '..' || name === '__pycache__') continue;
      const p = dir + '/' + name;
      const st = py.FS.stat(p);
      const r = rel ? rel + '/' + name : name;
      if (py.FS.isDir(st.mode)) walk(p, r);
      else outList.push({ name: r, size: st.size, asset: assetList.includes(r) });
    }
  };
  walk(WORK, '');
  return outList.sort((a, b) => a.name.localeCompare(b.name));
}

self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'init') await init(m);
    else if (m.type === 'run') await run(m);
    else if (m.type === 'files') postMessage({ type: 'reply', rid: m.rid, ok: true, files: listFiles() });
    else if (m.type === 'readFile') {
      const bytes = py.FS.readFile(`${WORK}/${m.name}`);
      postMessage({ type: 'reply', rid: m.rid, ok: true, name: m.name, bytes }, [bytes.buffer]);
    } else if (m.type === 'writeFile') {
      const p = `${WORK}/${m.name}`;
      const dir = p.split('/').slice(0, -1).join('/');
      let cur = '';
      for (const part of dir.split('/').filter(Boolean)) { cur += '/' + part; try { py.FS.mkdir(cur); } catch (err) { /* 있음 */ } }
      py.FS.writeFile(p, new Uint8Array(m.bytes));
      postMessage({ type: 'reply', rid: m.rid, ok: true });
    } else if (m.type === 'clearFiles') {
      const rm = (dir) => {
        for (const name of py.FS.readdir(dir)) {
          if (name === '.' || name === '..') continue;
          const p = dir + '/' + name;
          if (py.FS.isDir(py.FS.stat(p).mode)) { rm(p); py.FS.rmdir(p); } else py.FS.unlink(p);
        }
      };
      rm(WORK);
      await loadAssets(m.base, m.version);
      postMessage({ type: 'reply', rid: m.rid, ok: true });
    }
  } catch (err) {
    if (m.type === 'init') postMessage({ type: 'error', message: String(err && err.message || err) });
    else if (m.rid) postMessage({ type: 'reply', rid: m.rid, ok: false, error: String(err && err.message || err) });
    else postMessage({ type: 'out', s: 'e', t: String(err) + '\n' });
  }
};
