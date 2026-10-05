/* 콘솔 화면 + 파이썬 실행 (브라우저 안의 Pyodide) */
(function () {
  const { esc } = window.JU;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }
  };
  const E = window.PyEngine;

  // ------------------------------------------------------------------ 오류 도움말
  const HINTS = [
    [/SyntaxError: invalid syntax\. Perhaps you forgot a comma/, '값들 사이에 <b>쉼표(,)</b>가 빠진 것 같습니다.'],
    [/SyntaxError: expected ':'/, '<code>if</code> · <code>for</code> · <code>while</code> · <code>def</code> · <code>class</code> 줄 끝에 <b>콜론(:)</b>이 필요합니다.'],
    [/SyntaxError: unterminated string literal|EOL while scanning/, '문자열의 <b>따옴표</b>가 닫히지 않았습니다. 여는 따옴표와 같은 종류로 닫으세요.'],
    [/SyntaxError: unterminated triple-quoted string/, '<b>따옴표 3개</b>(<code>\'\'\'</code> 또는 <code>"""</code>)로 시작한 문자열이 닫히지 않았습니다.'],
    [/SyntaxError: '\(' was never closed|SyntaxError: unexpected EOF|was never closed/, '<b>괄호</b>가 닫히지 않았습니다. 여는 괄호와 닫는 괄호의 개수를 세어 보세요.'],
    [/SyntaxError: unmatched/, '짝이 맞지 않는 <b>닫는 괄호</b>가 있습니다.'],
    [/SyntaxError: invalid syntax\. Maybe you meant '==' or ':='/, '조건을 비교할 때는 <code>=</code> 가 아니라 <b><code>==</code></b> 를 씁니다.'],
    [/SyntaxError: cannot assign to/, '<code>=</code> 왼쪽에는 <b>변수 이름</b>이 와야 합니다. (예: <code>a = 10</code>, 비교는 <code>==</code>)'],
    [/SyntaxError: invalid character/, '한글 따옴표(‘’ “”)나 전각 문자가 섞였습니다. <b>영문 자판</b>으로 다시 입력하세요.'],
    [/SyntaxError: invalid decimal literal/, '숫자 바로 뒤에 글자가 붙었습니다. 변수 이름은 <b>숫자로 시작할 수 없습니다</b>.'],
    [/SyntaxError: 'return' outside function/, '<code>return</code> 은 <b>함수(def) 안</b>에서만 쓸 수 있습니다.'],
    [/SyntaxError: 'break' outside loop|'continue' not properly in loop/, '<code>break</code> · <code>continue</code> 는 <b>반복문 안</b>에서만 쓸 수 있습니다.'],
    [/SyntaxError: Missing parentheses in call to 'print'/, '파이썬 3 에서는 <code>print("…")</code> 처럼 <b>괄호</b>를 써야 합니다.'],
    [/SyntaxError/, '<b>문법 오류</b>입니다. 표시된 줄과 바로 윗줄의 괄호 · 따옴표 · 콜론(:)을 확인하세요.'],
    [/IndentationError: expected an indented block/, '<code>:</code> 다음 줄은 <b>들여쓰기(공백 4칸)</b>를 해야 합니다.'],
    [/IndentationError: unexpected indent/, '필요 없는 곳에 <b>들여쓰기</b>가 되어 있습니다. 줄 앞의 공백을 지우세요.'],
    [/IndentationError: unindent does not match|TabError/, '들여쓰기 칸 수가 맞지 않습니다. <b>공백 4칸</b>으로 통일하고 탭과 공백을 섞지 마세요.'],
    [/NameError: name '(\w+)' is not defined/, '선언하지 않은 이름입니다. <b>철자 · 대소문자</b>를 확인하고, 변수라면 사용하기 전에 값을 넣었는지, 모듈이라면 <code>import</code> 했는지 확인하세요.'],
    [/TypeError: can only concatenate str \(not "int"\) to str|TypeError: unsupported operand type\(s\) for \+: 'int' and 'str'/, '<b>문자열과 숫자</b>는 <code>+</code> 로 더할 수 없습니다. <code>str(숫자)</code> 로 바꾸거나, <code>input()</code> 결과는 <code>int()</code> 로 바꾸세요.'],
    [/TypeError: '(<|>|<=|>=)' not supported between instances of 'str' and 'int'/, '문자열과 숫자는 크기를 비교할 수 없습니다. <code>input()</code> 으로 받은 값은 <code>int()</code> 로 바꾸세요.'],
    [/TypeError: .* takes (\d+) positional arguments? but (\d+) (were|was) given|missing \d+ required positional argument/, '함수를 호출할 때 <b>인수의 개수</b>가 선언과 다릅니다. 메서드라면 첫 매개변수 <code>self</code> 를 빠뜨리지 않았는지 확인하세요.'],
    [/TypeError: '(\w+)' object is not callable/, '함수가 아닌 값을 <b>( )</b> 로 호출했습니다. 변수 이름이 함수 이름(예: <code>list</code>, <code>str</code>, <code>sum</code>)과 겹치지 않았는지 확인하세요.'],
    [/TypeError: '(\w+)' object is not subscriptable/, '<code>[ ]</code> 로 꺼낼 수 없는 값입니다. 리스트 · 튜플 · 문자열 · 딕셔너리인지 확인하세요.'],
    [/TypeError: 'str' object does not support item assignment/, '문자열은 <b>바꿀 수 없는(immutable)</b> 값입니다. 새 문자열을 만들어 대입하세요.'],
    [/TypeError: 'tuple' object does not support item assignment/, '튜플은 <b>값을 바꿀 수 없습니다</b>. 바꿔야 한다면 리스트를 쓰세요.'],
    [/TypeError: list indices must be integers/, '리스트의 인덱스는 <b>정수</b>여야 합니다. <code>int()</code> 로 바꾸거나 <code>//</code> 나눗셈을 쓰세요.'],
    [/TypeError: 'float' object cannot be interpreted as an integer/, '여기에는 <b>정수</b>가 필요합니다. <code>range()</code> 등에는 <code>int()</code> 로 바꾼 값을 넣으세요.'],
    [/TypeError/, '값의 <b>자료형(type)</b>이 맞지 않습니다. <code>type(값)</code> 으로 자료형을 확인해 보세요.'],
    [/ValueError: invalid literal for int\(\) with base 10/, '숫자로 바꿀 수 없는 문자열입니다. <b>정수</b>를 입력했는지 확인하세요. (소수는 <code>float()</code>)'],
    [/ValueError: could not convert string to float/, '실수로 바꿀 수 없는 문자열입니다. 숫자를 입력했는지 확인하세요.'],
    [/ValueError: .* is not in list|ValueError: list.remove/, '리스트에 <b>없는 값</b>입니다. <code>in</code> 으로 먼저 확인하세요.'],
    [/ValueError: too many values to unpack|not enough values to unpack/, '<code>a, b = …</code> 에서 <b>변수 개수와 값의 개수</b>가 다릅니다.'],
    [/ZeroDivisionError/, '<b>0 으로 나누었습니다.</b> 나누기 전에 값이 0 인지 확인하세요.'],
    [/IndexError: (list|string|tuple) index out of range/, '<b>인덱스 범위</b>를 벗어났습니다. 인덱스는 0 부터 <code>len(…) - 1</code> 까지입니다.'],
    [/IndexError: pop from empty list/, '<b>빈 리스트</b>에서 꺼내려 했습니다.'],
    [/KeyError/, '딕셔너리에 <b>없는 키</b>입니다. <code>in</code> 으로 확인하거나 <code>get(키)</code> 를 쓰세요.'],
    [/AttributeError: '(\w+)' object has no attribute/, '이 값(객체)에는 그런 <b>속성 · 메서드가 없습니다</b>. 철자와 자료형을 확인하세요.'],
    [/AttributeError: module '(\w+)' has no attribute/, '모듈에 그런 이름이 없습니다. 철자를 확인하고, 내가 만든 파일 이름이 모듈 이름(예: <code>turtle.py</code>, <code>random.py</code>)과 겹치지 않는지 확인하세요.'],
    [/ModuleNotFoundError: No module named '(\w+)'/, '모듈을 찾을 수 없습니다. 이름을 확인하세요. 내가 만든 모듈이라면 편집기에서 <code># ===== File: 모듈이름.py =====</code> 로 함께 작성하세요.'],
    [/FileNotFoundError/, '파일을 찾을 수 없습니다. 파일 이름과 경로를 확인하세요. (작업 폴더 기준의 <b>상대 경로</b>를 쓰고, <code>C:/…</code> 같은 경로는 쓰지 않습니다) 콘솔의 <b>📁 작업 폴더</b>에서 파일 목록을 볼 수 있습니다.'],
    [/UnicodeDecodeError/, '파일의 <b>인코딩</b>이 맞지 않습니다. <code>open(파일, "r", encoding="utf-8")</code> 처럼 인코딩을 지정해 보세요.'],
    [/RecursionError/, '함수가 끝없이 자기 자신을 호출했습니다. <b>재귀의 종료 조건</b>을 확인하세요.'],
    [/EOFError/, '입력할 값이 없습니다. 프로그램이 입력을 기다릴 때 콘솔 아래 <b>입력칸</b>에 값을 입력하고 Enter 를 누르세요.'],
    [/KeyboardInterrupt/, '■ 중지 버튼으로 실행을 멈췄습니다.'],
    [/sqlite3\.OperationalError: no such table/, '없는 <b>테이블</b>입니다. <code>CREATE TABLE</code> 을 먼저 실행했는지 확인하세요.'],
    [/sqlite3\.OperationalError: table .* already exists/, '이미 있는 테이블입니다. <code>CREATE TABLE IF NOT EXISTS</code> 를 쓰거나 먼저 <code>DROP TABLE</code> 하세요.'],
    [/sqlite3\.IntegrityError: UNIQUE constraint failed/, '<b>기본 키(PRIMARY KEY)</b>가 같은 행이 이미 있습니다.'],
    [/TclError/, 'tkinter 위젯 사용법이 잘못되었습니다. 옵션 이름과 값을 확인하세요.'],
    [/turtle\.TurtleGraphicsError|TurtleGraphicsError/, '거북이 그래픽 함수의 사용법이 잘못되었습니다. 색 이름 · 모양 이름 · 인수를 확인하세요.']
  ];
  const hintFor = (text) => { for (const [re, h] of HINTS) if (re.test(text)) return h; return null; };

  // 파일 구분 주석 → 편집기 줄 번호
  const FILE_MARK = window.JU.FILE_MARK;
  function fileMap(code) {
    const lines = String(code || '').split('\n');
    const files = [];
    lines.forEach((l, i) => { const m = FILE_MARK.exec(l); if (m) files.push({ name: m[1], start: i + 2 }); });
    let main = 1;
    if (files.length) {
      const head = lines.slice(0, files[0].start - 2).join('\n');
      if (head.trim()) main = 1;
      else { const last = files.pop(); main = last.start; }
    }
    return { files, main };
  }

  const usesInput = (code) => /\binput\s*\(|sys\.stdin/.test(code);

  // ------------------------------------------------------------------ 콘솔
  class Console {
    constructor(el) {
      this.el = el;
      this.out = el.querySelector('#jcConsole');
      this.form = el.querySelector('#stdinForm');
      this.input = el.querySelector('#stdinInput');
      this.eofBtn = el.querySelector('#eofBtn');
      this.stopBtn = el.querySelector('#stopBtn');
      this.state = el.querySelector('#runState');
      this.left = el.querySelector('#statusLeft');
      this.right = el.querySelector('#statusRight');
      this.main = el.querySelector('#consoleMain');
      this.run = null;
      this.onJump = null;
      this.history = [];
      this.hIndex = 0;
      this.fontSize = +store.get('jc.consoleFont', 14);
      this.applyFont();

      this.form.addEventListener('submit', (e) => { e.preventDefault(); this.sendLine(); });
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'd' && e.ctrlKey) { e.preventDefault(); this.sendEof(); }
        if (e.key === 'c' && e.ctrlKey && !this.input.selectionEnd) { e.preventDefault(); this.stop(); }
        if (e.key === 'ArrowUp' && this.history.length) { e.preventDefault(); this.hIndex = Math.max(0, this.hIndex - 1); this.input.value = this.history[this.hIndex] || ''; }
        if (e.key === 'ArrowDown' && this.history.length) { e.preventDefault(); this.hIndex = Math.min(this.history.length, this.hIndex + 1); this.input.value = this.history[this.hIndex] || ''; }
        e.stopPropagation();
      });
      this.eofBtn.addEventListener('click', () => this.sendEof());
      this.stopBtn.addEventListener('click', () => this.stop());
      el.querySelector('#clearBtn').addEventListener('click', () => this.clear());
      el.querySelector('#cFontUp').addEventListener('click', () => { this.fontSize = Math.min(28, this.fontSize + 1); this.applyFont(); });
      el.querySelector('#cFontDown').addEventListener('click', () => { this.fontSize = Math.max(10, this.fontSize - 1); this.applyFont(); });
      this.out.addEventListener('click', (e) => {
        const img = e.target.closest('.rich-plot img');
        if (img && window.PyApp && window.PyApp.lightbox) { window.PyApp.lightbox(img.src, '실행 결과 그래프'); return; }
        const loc = e.target.closest('[data-jump]');
        if (loc && this.onJump) this.onJump(+loc.dataset.jump);
      });
    }

    applyFont() {
      this.el.style.setProperty('--c-font', this.fontSize + 'px');
      store.set('jc.consoleFont', this.fontSize);
    }

    clear() {
      this.out.innerHTML = '';
      this.last = null;
    }

    atBottom() { return this.out.scrollHeight - this.out.scrollTop - this.out.clientHeight < 40; }

    write(cls, text) {
      if (!text) return;
      const stick = this.atBottom();
      const welcome = this.out.querySelector('.console-welcome');
      if (welcome) welcome.remove();
      if (this.last && this.last.className === cls && this.last.parentNode === this.out && this.last.textContent.length < 20000) {
        this.last.textContent += text;
      } else {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        this.out.appendChild(span);
        this.last = span;
      }
      if (this.out.textContent.length > 300000) {
        while (this.out.firstChild && this.out.textContent.length > 200000) this.out.firstChild.remove();
      }
      if (stick) this.out.scrollTop = this.out.scrollHeight;
    }

    html(html) {
      const stick = this.atBottom();
      const welcome = this.out.querySelector('.console-welcome');
      if (welcome) welcome.remove();
      const div = document.createElement('span');
      div.innerHTML = html;
      while (div.firstChild) this.out.appendChild(div.firstChild);
      this.last = null;
      if (stick) this.out.scrollTop = this.out.scrollHeight;
    }

    setState(kind, text) {
      this.state.className = 'run-state ' + kind;
      this.state.textContent = text;
    }

    setRunning(on) {
      this.input.disabled = !on;
      this.eofBtn.disabled = !on;
      this.stopBtn.disabled = !on;
      if (!on) this.form.classList.remove('waiting');
    }

    sendLine() {
      if (!this.run || this.run.done) return;
      const text = this.input.value;
      this.input.value = '';
      if (text) { this.history.push(text); this.hIndex = this.history.length; }
      this.write('i', text + '\n');
      this.form.classList.remove('waiting');
      E.input(text + '\n');
    }

    sendEof() {
      if (!this.run || this.run.done) return;
      this.write('m', '^D\n');
      E.eof();
    }

    stop() {
      const r = this.run;
      if (!r || r.done) return;
      r.stopped = true;
      E.stop();
    }

    /**
     * 코드 실행
     * @param {string} code
     * @param {{label?:string, stdin?:string, repl?:boolean, onDiagnostics?:Function, clear?:boolean, focusInput?:boolean}} opts
     */
    async execute(code, opts = {}) {
      if (this.run && !this.run.done) {
        this.run.superseded = true;
        await E.stop();
      }
      const run = { code, done: false, map: fileMap(code), label: opts.label || '', repl: !!opts.repl };
      this.run = run;
      if (opts.clear !== false && store.get('jc.keepConsole', '0') !== '1') this.clear();
      else if (this.out.textContent.trim()) this.html('<span class="run-sep"></span>');
      this.main.textContent = opts.label ? '· ' + opts.label : '';
      if (opts.onDiagnostics) opts.onDiagnostics([]);

      if (!E.supported()) {
        this.setState('error', '실행 불가');
        this.html('<span class="hint"><b>⚠ 이 브라우저에서는 파이썬을 실행할 수 없습니다.</b><br>최신 Chrome · Edge · Firefox · Safari 를 사용하세요.</span>');
        run.done = true;
        return { ok: false };
      }
      if (E.state !== 'ready') {
        this.setState('compiling', '준비 중…');
        this.html(`<span class="hint"><b>🐍 브라우저에서 파이썬 실행 환경을 준비하고 있습니다…</b><br>
          처음 한 번은 <b>5 ~ 20초</b> 정도 걸리고, 이후에는 바로 실행됩니다.</span>`);
        const off = (b) => { if (!run.done && b.state === 'loading') this.left.textContent = b.message || '준비 중…'; };
        E.onChange(off);
      }
      try {
        await E.load();
      } catch (e) {
        this.setState('error', '준비 실패');
        this.write('e', '파이썬 실행 환경을 준비하지 못했습니다: ' + (e && e.message || e) + '\n인터넷 연결을 확인하고 새로고침해 보세요.\n');
        run.done = true;
        return { ok: false };
      }
      if (run.superseded) return { ok: false };
      if (this.out.querySelector('.hint') && !this.out.textContent.includes('▶')) this.clear();

      let stdin = opts.stdin || '';
      if (E.mode === 'none' && usesInput(code) && !stdin && !opts.repl) {
        stdin = await askPreInput();
        if (stdin == null) { run.done = true; this.setState('idle', '대기'); return { ok: false }; }
      }

      this.setRunning(true);
      this.setState('running', '실행 중');
      this.left.textContent = opts.repl ? '🐍 대화형 모드 (>>>) — 입력칸에 코드를 입력하세요' : '▶ 실행 중';
      this.right.textContent = '';
      if (usesInput(code) && !stdin && !opts.repl && opts.focusInput !== false) setTimeout(() => { if (!run.done) this.input.focus({ preventScroll: true }); }, 50);
      if (opts.repl && opts.focusInput !== false) setTimeout(() => { if (!run.done) this.input.focus({ preventScroll: true }); }, 400);
      const started = performance.now();
      const tick = setInterval(() => { this.right.textContent = ((performance.now() - started) / 1000).toFixed(1) + '초'; }, 100);
      let stderr = '', endsWithNewline = true;
      let r;
      try {
        r = await E.run({
          code, stdin, repl: !!opts.repl,
          onOutput: (s, text) => {
            if (run.superseded) return;
            if (s === 'e') stderr += text;
            this.write(s === 'e' ? 'e' : s === 'm' ? 'm' : 'o', text);
            endsWithNewline = /\n$/.test(text);
          },
          onRich: (kind, data) => {
            if (run.superseded) return;
            if (kind === 'png') this.html(`<span class="rich-plot"><img src="data:image/png;base64,${data}" alt="그래프" title="눌러서 크게 보기"></span>`);
            else if (kind === 'html') this.html(`<span class="rich-html">${data}</span>`);
            endsWithNewline = true;
          },
          onWaitInput: (on) => {
            if (run.superseded) return;
            this.form.classList.toggle('waiting', on);
            if (on && opts.focusInput !== false && !(window.PyGui && PyGui.hasWindows() && document.activeElement && document.activeElement.closest && document.activeElement.closest('.gw'))) this.input.focus({ preventScroll: true });
          }
        });
      } catch (e) {
        r = { exit: 1 };
        this.write('e', '\n실행 중 오류: ' + (e && e.message || e) + '\n');
      } finally {
        clearInterval(tick);
        run.done = true;
        if (this.run === run) this.setRunning(false);
      }
      if (run.superseded) return { ok: false };
      const exit = r.exit;
      if (!endsWithNewline) this.write('o', '\n');
      if (r.killed) this.write('e', '⚠ 프로그램이 멈추지 않아 실행 환경을 다시 시작했습니다. (작업 폴더의 파일은 초기화됩니다)\n');
      const sec = ((performance.now() - started) / 1000).toFixed(2);
      if (!opts.repl || exit !== 0) this.write('m', `\n── 프로그램 종료 (종료 코드 ${exit}, ${sec}초) ──\n`);
      else this.write('m', '\n── 대화형 모드 종료 ──\n');
      const diags = this.linkTraceback(run, stderr);
      if (opts.onDiagnostics && diags.length) opts.onDiagnostics(diags);
      if (exit !== 0 && stderr) {
        const h = hintFor(stderr.trim().split('\n').slice(-3).join('\n')) || hintFor(stderr);
        if (h) this.html(`<span class="hint"><b>💡 도움말</b> ${h}</span>`);
      }
      const stopped = exit === 130 || exit === 137;
      this.setState(exit === 0 ? 'done' : 'error', exit === 0 ? '완료' : stopped ? '중지됨' : `종료 코드 ${exit}`);
      this.left.textContent = exit === 0 ? '✓ 실행 완료' : stopped ? '■ 실행을 중지했습니다' : '✗ 오류로 종료';
      this.right.textContent = sec + '초';
      return { ok: true, exit };
    }

    editorLine(run, file, line) {
      if (file === 'main.py') return run.map.main + line - 1;
      const f = run.map.files.find((x) => x.name === file || x.name.split('/').pop() === file.split('/').pop());
      return f ? f.start + line - 1 : null;
    }

    /** traceback 의 File "main.py", line 5 를 클릭하면 편집기 줄로 이동 → 오류 줄 표시 */
    linkTraceback(run, stderr) {
      const diags = [];
      const spans = this.out.querySelectorAll('span.e');
      let lastLoc = null;
      const re = /File "([^"]+)", line (\d+)/g;
      let m;
      while ((m = re.exec(stderr))) {
        const ln = this.editorLine(run, m[1], +m[2]);
        if (ln) lastLoc = { line: ln, message: '' };
      }
      spans.forEach((sp) => {
        if (sp.dataset.linked || !/File "[^"]+", line \d+/.test(sp.textContent)) return;
        sp.dataset.linked = '1';
        sp.innerHTML = esc(sp.textContent).replace(/File &quot;([^&]+)&quot;, line (\d+)/g, (all, f, l) => {
          const ln = this.editorLine(run, f, +l);
          return ln ? `File "<span class="loc" data-jump="${ln}" title="편집기에서 이 줄로 이동">${f}</span>", line <span class="loc" data-jump="${ln}">${l}</span>` : all;
        });
      });
      if (lastLoc && !/KeyboardInterrupt/.test(stderr)) {
        const lastLine = stderr.trim().split('\n').pop() || '';
        diags.push({ kind: 'error', line: lastLoc.line, editorLine: lastLoc.line, message: lastLine });
      }
      return diags;
    }
  }

  /** 입력 채널이 없는 환경: 실행 전에 입력값을 받아 둔다 */
  function askPreInput() {
    return new Promise((resolve) => {
      const v = window.prompt('이 브라우저 환경에서는 실행 중에 입력을 받을 수 없습니다.\n프로그램에 넣을 입력값을 미리 적어 주세요. (여러 개는 쉼표 , 로 구분)', '');
      if (v == null) return resolve(null);
      resolve(v.split(',').map((s) => s.trim()).join('\n') + '\n');
    });
  }

  window.Runner = { Console, store, engine: E, hintFor };
})();
