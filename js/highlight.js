/* 공용 유틸: HTML 이스케이프, 파이썬 코드 정적 강조(CodeMirror runMode 사용), 코드 편집기 */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 한 편집기에 여러 파일: # ===== File: 모듈.py =====
  const FILE_MARK = /^\s*#\s*=+\s*(?:file|파일)\s*:\s*([\w./\-가-힣]+?\.\w+)\s*=*\s*$/i;
  const MODE = 'text/x-python';

  /** 파이썬 코드를 줄 단위 <span class="ln"> 로 강조한 HTML 로 만든다 */
  function highlightLines(code) {
    code = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
    const lines = [];
    let cur = '';
    const push = () => { lines.push(cur); cur = ''; };
    if (window.CodeMirror && CodeMirror.runMode) {
      CodeMirror.runMode(code, MODE, (text, style) => {
        if (text === '\n') { push(); return; }
        cur += style ? `<span class="${style.split(' ').map((s) => 'cm-' + s).join(' ')}">${esc(text)}</span>` : esc(text);
      });
      push();
    } else {
      code.split('\n').forEach((l) => lines.push(esc(l)));
    }
    const raw = code.split('\n');
    return lines.map((html, i) => {
      const mark = FILE_MARK.test(raw[i] || '');
      return `<span class="ln${mark ? ' file-mark' : ''}" data-n="${i + 1}">${mark ? `<span class="cm-file-mark">${esc(raw[i])}</span>` : html || ' '}</span>`;
    }).join('');
  }

  /** 줄 번호 없이 강조만 */
  function highlightInline(code) {
    code = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
    if (!(window.CodeMirror && CodeMirror.runMode)) return esc(code);
    let out = '';
    CodeMirror.runMode(code, MODE, (text, style) => {
      out += style ? `<span class="${style.split(' ').map((s) => 'cm-' + s).join(' ')}">${esc(text)}</span>` : esc(text);
    });
    return out;
  }

  /** 편집기 코드의 파일 이름 */
  function fileName(code) {
    const f = FILE_MARK.exec((code || '').split('\n')[0] || '');
    if (f) return f[1] + ' …';
    return 'main.py';
  }

  /** 대화형 모드(>>>) 예제: 입력한 줄 앞에 >>> / ... 표시 */
  function highlightRepl(code) {
    code = String(code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
    let block = false;
    return code.split('\n').map((line) => {
      const cont = block && (/^\s/.test(line) || line === '');
      if (!cont) block = /:\s*(#.*)?$/.test(line);
      else if (line === '') block = false;
      return `<span class="ln repl" data-p="${cont ? '...' : '>>>'}">${line ? highlightInline(line) : ' '}</span>`;
    }).join('');
  }

  /**
   * 코드 편집기 생성 (CodeMirror 5, 없으면 textarea 로 대체)
   * @returns {{getValue, setValue, refresh, focus, markErrors, clearErrors, jump, on}}
   */
  function makeEditor(host, value, opts = {}) {
    if (window.CodeMirror) {
      const cm = CodeMirror(host, {
        value: value || '',
        mode: MODE,
        lineNumbers: true,
        indentUnit: 4,
        smartIndent: true,
        tabSize: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        styleActiveLine: true,
        lineWrapping: !!opts.wrap,
        gutters: ['CodeMirror-linenumbers', 'err-gutter-col'],
        extraKeys: {
          'Ctrl-Enter': () => opts.onRun && opts.onRun(),
          'Cmd-Enter': () => opts.onRun && opts.onRun(),
          'Ctrl-/': 'toggleComment',
          'Cmd-/': 'toggleComment',
          Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ', 'end')),
          'Shift-Tab': (c) => c.indentSelection('subtract')
        }
      });
      let marks = [];
      const api = {
        cm,
        getValue: () => cm.getValue(),
        setValue: (v) => { cm.setValue(v || ''); cm.clearHistory(); },
        refresh: () => cm.refresh(),
        focus: () => cm.focus(),
        on: (ev, fn) => cm.on(ev, fn),
        clearErrors() {
          marks.forEach((l) => { cm.removeLineClass(l, 'background', 'err-line'); });
          cm.clearGutter('err-gutter-col');
          marks = [];
        },
        markErrors(diags) {
          api.clearErrors();
          (diags || []).filter((d) => d.kind === 'error').forEach((d) => {
            const ln = (d.editorLine || d.line) - 1;
            if (ln < 0 || ln >= cm.lineCount()) return;
            const h = cm.addLineClass(ln, 'background', 'err-line');
            marks.push(h);
            const g = document.createElement('span');
            g.className = 'err-gutter';
            g.textContent = '●';
            g.title = d.message;
            cm.setGutterMarker(ln, 'err-gutter-col', g);
          });
        },
        jump(line) {
          const ln = Math.max(0, Math.min(cm.lineCount() - 1, line - 1));
          cm.focus();
          cm.setCursor({ line: ln, ch: 0 });
          cm.scrollIntoView({ line: ln, ch: 0 }, 80);
          const h = cm.addLineClass(ln, 'background', 'err-line');
          setTimeout(() => { if (!marks.includes(h)) cm.removeLineClass(h, 'background', 'err-line'); }, 1200);
        }
      };
      cm.on('change', () => { if (marks.length) api.clearErrors(); });
      return api;
    }
    const ta = document.createElement('textarea');
    ta.className = 'fallback';
    ta.spellcheck = false;
    ta.value = value || '';
    host.appendChild(ta);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); opts.onRun && opts.onRun(); } });
    return {
      cm: null,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v || ''; },
      refresh() {}, focus: () => ta.focus(), on: (ev, fn) => ta.addEventListener(ev === 'change' ? 'input' : ev, fn),
      clearErrors() {}, markErrors() {}, jump() { ta.focus(); }
    };
  }

  /**
   * 그림(SVG) 안의 <style> 규칙이 페이지 전체에 퍼지지 않도록 범위를 한정한다.
   * @returns {string} 고유 클래스로 감싼 HTML
   */
  let scopeSeq = 0;
  function scoped(html) {
    html = String(html || '');
    if (!/<style/i.test(html)) return html;
    const cls = 'scope-' + (++scopeSeq);
    const out = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (m, attrs, css) => {
      const rules = css.replace(/([^{}]+)\{([^{}]*)\}/g, (mm, sel, body) => {
        if (/^\s*@/.test(sel)) return mm;
        const s = sel.split(',').map((x) => x.trim()).filter(Boolean).map((x) => `.${cls} ${x}`).join(', ');
        return `${s}{${body}}`;
      });
      return `<style${attrs}>${rules}</style>`;
    });
    return `<div class="${cls}" style="display:contents">${out}</div>`;
  }

  window.JU = { esc, highlightLines, highlightInline, highlightRepl, fileName, FILE_MARK, makeEditor, scoped };
})();
