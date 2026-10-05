"""웹 강좌 파이썬 실행기.

- 편집기 코드를 main.py 로 실행하고, 오류는 파이썬과 같은 모양으로 보여 준다.
- `# ===== File: 이름.py =====` 주석으로 여러 파일(모듈 · 데이터 파일)을 한 편집기에 쓸 수 있다.
  마지막 파일 구역이 실행할 프로그램(main)이다.
- 브라우저(Pyodide 워커)와 검증 도구(CPython)에서 똑같이 동작한다.
"""
import linecache
import os
import re
import sys
import traceback

FILE_MARK = re.compile(r'^\s*#\s*=+\s*(?:file|파일)\s*:\s*([\w./\-가-힣]+?\.\w+)\s*=*\s*$', re.I)
MAIN = 'main.py'
_RUNTIME_DIR = os.path.dirname(os.path.abspath(__file__))


def split_files(code):
    """파일 구분 주석으로 나눈다 → ([(이름, 내용, 편집기 시작 줄)], main 코드, main 시작 줄)"""
    lines = code.split('\n')
    marks = [(i, m.group(1)) for i, l in enumerate(lines) for m in [FILE_MARK.match(l)] if m]
    if not marks:
        return [], code, 1
    files = []
    head = '\n'.join(lines[:marks[0][0]])
    for n, (i, name) in enumerate(marks):
        end = marks[n + 1][0] if n + 1 < len(marks) else len(lines)
        files.append((name, '\n'.join(lines[i + 1:end]), i + 2))
    if head.strip():
        return files, head, 1
    name, body, start = files.pop()
    return files, body, start


def _rel(path):
    try:
        p = os.path.relpath(path)
        if not p.startswith('..'):
            return p.replace('\\', '/')
    except ValueError:
        pass
    return path


def _user_frame(fname):
    if not fname or fname.startswith('<'):
        return fname in ('<string>', '<console>', '<stdin>')
    ab = os.path.abspath(fname)
    return not ab.startswith(_RUNTIME_DIR) and 'site-packages' not in ab and not ab.startswith(os.path.dirname(os.__file__))


def print_exc(e, file=None):
    """사용자 코드 프레임만 남긴 traceback 출력"""
    file = file or sys.stderr
    try:
        sys.stdout.flush()
    except Exception:
        pass
    tb = e.__traceback__
    # 앞쪽의 실행기 프레임 건너뛰기
    while tb is not None and not _user_frame(tb.tb_frame.f_code.co_filename):
        tb = tb.tb_next
    te = traceback.TracebackException(type(e), e, tb, compact=True)
    for fs in te.stack:
        fs.filename = _rel(fs.filename)
    if isinstance(e, SyntaxError) and te.filename:
        te.filename = _rel(te.filename)
    out = ''.join(te.format())
    file.write(out)
    file.flush()


def run_main(code, echo=False):
    """코드 실행 → 종료 코드"""
    import _webgui
    _webgui._reset()
    code = code.replace('\r\n', '\n')
    files, main_code, main_start = split_files(code)
    cwd = os.getcwd()
    if cwd not in sys.path and '' not in sys.path:
        sys.path.insert(0, cwd)
    # 편집기에서 만든 모듈을 다시 불러올 수 있도록 이전 실행의 사용자 모듈 제거
    for name, mod in list(sys.modules.items()):
        f = getattr(mod, '__file__', None) or ''
        if f and os.path.abspath(f).startswith(cwd):
            del sys.modules[name]
    for name, body, _start in files:
        d = os.path.dirname(name)
        if d:
            os.makedirs(d, exist_ok=True)
        with open(name, 'w', encoding='utf-8') as fp:
            fp.write(body.rstrip('\n') + '\n')
    import importlib
    importlib.invalidate_caches()
    src_lines = main_code.splitlines(True)
    linecache.cache[MAIN] = (len(main_code), None, src_lines, MAIN)
    g = {'__name__': '__main__', '__builtins__': __builtins__, '__file__': MAIN, '__doc__': None, '__package__': None}
    sys.argv = [MAIN]
    main_mod = type(sys)('__main__')
    main_mod.__dict__.update(g)
    old_main = sys.modules.get('__main__')
    sys.modules['__main__'] = main_mod
    try:
        try:
            compiled = compile(main_code, MAIN, 'exec')
        except SyntaxError as e:
            print_exc(e)
            return 1
        exec(compiled, main_mod.__dict__)
        _webgui.end_of_program()
        return 0
    except SystemExit as e:
        c = e.code
        if c is None:
            return 0
        if isinstance(c, int):
            return c
        print(c, file=sys.stderr)
        return 1
    except KeyboardInterrupt as e:
        print_exc(e)
        return 130
    except BaseException as e:  # noqa
        if getattr(e, '_quiet_exit', False):  # turtle 창을 닫아 그리기를 멈춘 경우
            return 0
        print_exc(e)
        return 1
    finally:
        try:
            sys.stdout.flush()
            sys.stderr.flush()
        except Exception:
            pass
        _webgui.flush()
        if old_main is not None:
            sys.modules['__main__'] = old_main


# ------------------------------------------------------------------ 대화형 모드 (IDLE 셸 흉내)
def repl(echo=False, banner=True):
    """대화형 모드: >>> 프롬프트에서 한 줄씩 실행. echo=True 면 입력한 줄을 출력에 함께 보여 준다(검증 도구의 예제 재생용)"""
    import code as _code
    import _webgui
    _webgui._reset()

    class Console(_code.InteractiveConsole):
        def raw_input(self, prompt=''):
            sys.stdout.write(prompt)
            sys.stdout.flush()
            line = sys.stdin.readline()
            if not line:
                sys.stdout.write('\n')
                raise EOFError
            if echo:
                sys.stdout.write(line if line.endswith('\n') else line + '\n')
            return line.rstrip('\n')

        def showtraceback(self):
            e = sys.exc_info()[1]
            print_exc(e, sys.stdout if echo else sys.stderr)

        def showsyntaxerror(self, filename=None, **kw):
            e = sys.exc_info()[1]
            print_exc(e, sys.stdout if echo else sys.stderr)

    g = {'__name__': '__main__', '__builtins__': __builtins__}
    sys.ps1, sys.ps2 = '>>> ', '... '
    c = Console(g, filename='<stdin>')
    try:
        c.interact(banner='' if not banner else 'Python %s 대화형 모드입니다. 종료하려면 exit() 또는 EOF.' % sys.version.split()[0], exitmsg='')
    except SystemExit:
        pass
    _webgui.end_of_program()
    return 0


class _EchoStdin:
    def __init__(self, f):
        self.f = f

    def readline(self, *a):
        line = self.f.readline(*a)
        if line:
            sys.stdout.write(line if line.endswith('\n') else line + '\n')
        return line

    def read(self, *a):
        s = self.f.read(*a)
        sys.stdout.write(s)
        return s

    def __iter__(self):
        return iter(self.readline, '')

    def isatty(self):
        return False

    def __getattr__(self, k):
        return getattr(self.f, k)


def cli():
    """검증 도구용: python -c "import _runtime; _runtime.cli()" main.py [--repl]"""
    args = sys.argv[1:]
    path = args[0]
    with open(path, encoding='utf-8') as fp:
        code = fp.read()
    try:
        os.remove(path)
    except OSError:
        pass
    if os.environ.get('WEBGUI_VALIDATE'):
        # 출력 순서를 브라우저 콘솔과 같게: 오류 출력도 표준 출력 흐름으로 합친다
        sys.stderr = sys.stdout
        # 검증은 빠르게: time.sleep 은 아주 짧게만 기다린다 (출력은 같음)
        import time
        _sleep = time.sleep
        time.sleep = lambda s: _sleep(min(float(s), 0.002))
    os.environ.setdefault('MPLBACKEND', 'Agg')
    try:
        import _mlrich
        _mlrich.prepare(code)
    except Exception:
        _mlrich = None
    if '--repl' in args:
        sys.stdin.reconfigure(encoding='utf-8')
        # 예제 재생: 한 줄씩 입력 → 에코
        code_lines = code.split('\n')
        while code_lines and not code_lines[-1].strip():
            code_lines.pop()
        if code_lines and (code_lines[-1][:1] in (' ', '\t') or re.match(
                r'\s*(if|for|while|def|class|with|try|elif|else|except|finally)\b.*:', code_lines[-1])):
            code_lines.append('')  # 들여쓴 블록을 닫는 빈 줄 (브라우저와 같음)
        import io
        sys.stdin = io.StringIO('\n'.join(code_lines) + '\n')
        rc = repl(echo=True, banner=False)
    else:
        # 미리 준비한 입력을 읽을 때 터미널처럼 화면에 보여 준다 (브라우저와 같은 출력)
        sys.stdin.reconfigure(encoding='utf-8')
        sys.stdin = _EchoStdin(sys.stdin)
        rc = run_main(code)
    if _mlrich is not None:
        _mlrich.flush()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(rc)
