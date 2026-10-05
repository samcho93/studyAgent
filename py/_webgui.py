"""웹 강좌용 GUI 브리지 코어.

브라우저(Pyodide 워커)에서는 `_webbridge`(워커가 등록한 JS 모듈)를 통해
그리기 명령(ops)을 화면으로 보내고, 마우스 · 키보드 · 대화상자 응답 같은 이벤트를 받는다.
일반 CPython(검증 도구)에서는 `_webbridge` 가 없으므로 화면 없이(headless) 동작한다.

tkinter / turtle / pygame 호환 모듈이 모두 이 모듈을 사용한다.
"""
import heapq
import itertools
import json
import os
import time as _time
from collections import deque

try:
    import _webbridge as _B  # 브라우저 워커가 등록한 모듈
    HEADLESS = False
except ImportError:  # 일반 파이썬 (검증 도구)
    _B = None
    HEADLESS = True

_real_sleep = _time.sleep
_seq = itertools.count(1)
_ops = []
_evq = deque()
_timers = []          # (due, seq, timer_id, func, args)
_cancelled = set()
_windows = {}         # id -> window object (Tk, Toplevel, pygame 창 ...)
_objects = {}         # id -> 이벤트를 받을 객체
_dirty_images = {}    # id -> image (픽셀 버퍼가 바뀐 이미지)
_state = {'quit': False, 'depth': 0, 'answers': None}


def new_id(prefix='w'):
    return '%s%d' % (prefix, next(_seq))


def _reset():
    """실행할 때마다 상태 초기화 (워커에서 호출)"""
    _ops.clear()
    _evq.clear()
    _timers.clear()
    _cancelled.clear()
    _windows.clear()
    _objects.clear()
    _dirty_images.clear()
    _state.update(quit=False, depth=0, answers=None)
    for mod in ('tkinter', 'turtle', 'pygame'):
        m = __import__('sys').modules.get(mod)
        if m is not None and hasattr(m, '_reset_module'):
            try:
                m._reset_module()
            except Exception:
                pass


# ------------------------------------------------------------------ 보내기
def send(op):
    if HEADLESS:
        return
    _ops.append(op)
    if len(_ops) >= 3000:
        flush()


def flush():
    if HEADLESS:
        return
    if _dirty_images:
        imgs = list(_dirty_images.values())
        _dirty_images.clear()
        for img in imgs:
            try:
                img._upload()
            except Exception:
                pass
    if _ops:
        data = json.dumps(_ops, ensure_ascii=False, separators=(',', ':'))
        _ops.clear()
        _B.post(data)


def send_bin(obj_id, kind, data, meta=None):
    """이미지 등 이진 데이터 전송"""
    if HEADLESS:
        return
    if _ops:
        d = json.dumps(_ops, ensure_ascii=False, separators=(',', ':'))
        _ops.clear()
        _B.post(d)
    _B.post_bin(obj_id, kind, bytes(data), json.dumps(meta or {}))


def mark_dirty(img):
    if not HEADLESS:
        _dirty_images[img._id] = img


# ------------------------------------------------------------------ 창 · 객체 등록
def register_window(win):
    _windows[win._w] = win
    _objects[win._w] = win


def unregister_window(win):
    _windows.pop(win._w, None)


def register(obj_id, obj):
    _objects[obj_id] = obj


def unregister(obj_id):
    _objects.pop(obj_id, None)


def has_windows():
    return bool(_windows)


# ------------------------------------------------------------------ 이벤트 받기
def _pull(timeout_ms):
    """이벤트를 받아 큐에 넣는다. timeout_ms 동안 기다린다."""
    if HEADLESS:
        return
    flush()
    raw = _B.wait(max(0, int(timeout_ms)))
    if raw and raw != '[]':
        for ev in json.loads(raw):
            if ev.get('k') == 'sizes':
                _apply_sizes(ev)
            else:
                _evq.append(ev)


def poll():
    """기다리지 않고 도착한 이벤트를 모두 가져온다 (큐에 쌓음)"""
    if HEADLESS:
        return
    flush()
    raw = _B.poll()
    if raw and raw != '[]':
        for ev in json.loads(raw):
            if ev.get('k') == 'sizes':
                _apply_sizes(ev)
            else:
                _evq.append(ev)


def take_events(pred=None):
    """큐에서 조건에 맞는 이벤트를 꺼낸다"""
    if pred is None:
        out = list(_evq)
        _evq.clear()
        return out
    out, keep = [], []
    for ev in _evq:
        (out if pred(ev) else keep).append(ev)
    _evq.clear()
    _evq.extend(keep)
    return out


def _apply_sizes(ev):
    for wid, geo in (ev.get('m') or {}).items():
        o = _objects.get(wid)
        if o is not None:
            o._geom = geo


def sleep(seconds):
    """time.sleep 대체: 화면을 갱신하면서 기다린다 (이벤트는 큐에 보관)"""
    try:
        seconds = float(seconds)
    except (TypeError, ValueError):
        raise TypeError("'%s' object cannot be interpreted as a number" % type(seconds).__name__)
    if seconds < 0:
        raise ValueError('sleep length must be non-negative')
    if HEADLESS:
        _real_sleep(min(seconds, 0.05))
        return
    end = _time.monotonic() + seconds
    flush()
    while True:
        left = end - _time.monotonic()
        if left <= 0:
            break
        _pull(left * 1000)


# ------------------------------------------------------------------ 타이머 (after)
def after(ms, func, *args):
    tid = new_id('after#')
    due = _time.monotonic() + max(0, (ms or 0)) / 1000.0
    heapq.heappush(_timers, (due, next(_seq), tid, func, args))
    return tid


def after_cancel(tid):
    _cancelled.add(tid)


def run_due_timers():
    now = _time.monotonic()
    ran = 0
    while _timers and _timers[0][0] <= now and ran < 200:
        _, _, tid, func, args = heapq.heappop(_timers)
        if tid in _cancelled:
            _cancelled.discard(tid)
            continue
        ran += 1
        call_handler(func, *args)
    return ran


def _next_timer_wait():
    while _timers and _timers[0][2] in _cancelled:
        _cancelled.discard(heapq.heappop(_timers)[2])
    if not _timers:
        return None
    return max(0.0, _timers[0][0] - _time.monotonic())


def call_handler(func, *args):
    """이벤트 처리 함수 호출. 오류가 나도 GUI 는 계속 동작 (tkinter 와 같은 방식)"""
    try:
        return func(*args)
    except SystemExit:
        raise
    except KeyboardInterrupt:
        raise
    except Exception:
        import sys
        import traceback
        print('Exception in Tkinter callback', file=sys.stderr)
        try:
            import _runtime
            _runtime.print_exc(sys.exc_info()[1])
        except Exception:
            traceback.print_exc()
        return None


# ------------------------------------------------------------------ 이벤트 처리
def dispatch(ev):
    k = ev.get('k')
    if k in ('reply',):
        return  # 대화상자 응답인데 기다리는 곳이 없음
    target = _objects.get(ev.get('id'))
    if target is not None and hasattr(target, '_on_event'):
        target._on_event(ev)


def process_pending(max_events=500):
    """쌓인 이벤트 · 타이머 처리 (update)"""
    poll()
    n = 0
    while _evq and n < max_events:
        ev = _evq.popleft()
        if ev.get('k') == 'pg':  # pygame 이벤트는 pygame 이 직접 가져간다
            _evq.appendleft(ev)
            break
        dispatch(ev)
        n += 1
    run_due_timers()


def quit_loop():
    _state['quit'] = True


def mainloop():
    """GUI 이벤트 루프. 모든 창이 닫히거나 quit() 이 호출되면 끝난다."""
    if HEADLESS:
        # 검증 도구: 화면이 없으므로 이미 예약된 짧은 타이머만 조금 실행해 본다
        return
    _state['quit'] = False
    _state['depth'] += 1
    try:
        while not _state['quit'] and _windows:
            run_due_timers()
            if _state['quit'] or not _windows:
                break
            if _evq:
                dispatch(_evq.popleft())
                continue
            w = _next_timer_wait()
            _pull(200 if w is None else min(200, w * 1000))
    finally:
        _state['depth'] -= 1
        if _state['depth'] == 0:
            _state['quit'] = False
        flush()


def end_of_program():
    """프로그램이 끝났는데 창이 열려 있으면 IDLE 처럼 창을 계속 보여 준다 (이벤트 처리 계속)"""
    if HEADLESS:
        return
    flush()
    if _windows:
        mainloop()


# ------------------------------------------------------------------ 대화상자
def _headless_answer(kind, kw):
    if _state['answers'] is None:
        try:
            _state['answers'] = deque(json.loads(os.environ.get('WEBGUI_ANSWERS', '[]')))
        except ValueError:
            _state['answers'] = deque()
    q = _state['answers']
    if q:
        return q.popleft()
    if kind in ('info', 'warning', 'error'):
        return 'ok'
    if kind in ('yesno', 'okcancel', 'retrycancel'):
        return True
    if kind == 'question':
        return 'yes'
    if kind in ('openfile', 'savefile', 'dir'):
        return ''
    return None


def request(kind, **kw):
    """대화상자를 띄우고 응답을 기다린다"""
    if HEADLESS:
        return _headless_answer(kind, kw)
    rid = new_id('dlg')
    op = {'op': 'dlg', 'rid': rid, 'kind': kind}
    op.update(kw)
    send(op)
    flush()
    while True:
        got = take_events(lambda e: e.get('k') == 'reply' and e.get('rid') == rid)
        if got:
            return got[0].get('value')
        _pull(200)


# ------------------------------------------------------------------ 색 · 글꼴 · 이미지 유틸
_TK_COLORS = {
    'systembuttonface': '#f0f0f0', 'systemwindow': '#ffffff', 'systembuttontext': '#000000',
    'systemwindowtext': '#000000', 'systemhighlight': '#0078d7', 'systemhighlighttext': '#ffffff',
    # CSS 에 없는 X11(tk) 색 이름
    'navyblue': '#000080', 'violetred': '#d02090', 'lightgoldenrod': '#eedd82', 'lightslateblue': '#8470ff',
    'darkgrey': '#a9a9a9', 'lightgrey': '#d3d3d3', 'debianred': '#d70751', 'webgray': '#808080',
    'systembuttonshadow': '#a0a0a0', 'systemdisabledtext': '#6d6d6d',
}


def color(c, default=None):
    """tkinter 색 이름을 CSS 색으로"""
    if c is None:
        return default
    if isinstance(c, (tuple, list)) and len(c) == 3:
        return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)
    c = str(c).strip()
    if not c:
        return ''
    if c.startswith('#'):
        h = c[1:]
        if len(h) == 3 or len(h) == 6:
            return c
        if len(h) == 12:  # #rrrrggggbbbb
            return '#' + h[0:2] + h[4:6] + h[8:10]
        if len(h) == 9:
            return '#' + h[0:2] + h[3:5] + h[6:8]
        return c
    low = c.lower().replace(' ', '')
    if low in _TK_COLORS:
        return _TK_COLORS[low]
    for g in ('gray', 'grey'):
        if low.startswith(g) and low[len(g):].isdigit():
            v = int(round(int(low[len(g):]) * 255 / 100))
            return '#%02x%02x%02x' % (v, v, v)
    if low[-1:].isdigit() and low[-1] in '1234':  # 'red3' 같은 X11 변형 색
        base, n = low[:-1], int(low[-1])
        return 'x11:%s:%d' % (base, n)
    return low


def font_css(f, default=None):
    """tkinter 글꼴 표기를 CSS font 로: ('궁서체', 30, 'bold') / 'Arial 20 bold' / '{맑은 고딕} 12'"""
    if f is None or f == '':
        return default
    if hasattr(f, '_css'):
        return f._css()
    fam, size, styles = None, None, []
    if isinstance(f, (tuple, list)):
        parts = list(f)
        if parts:
            fam = str(parts[0])
        if len(parts) > 1:
            size = parts[1]
        for p in parts[2:]:
            styles.extend(str(p).split())
    else:
        s = str(f)
        if s.startswith('{'):
            end = s.find('}')
            fam = s[1:end]
            rest = s[end + 1:].split()
        else:
            toks = s.split()
            fam = toks[0] if toks else None
            rest = toks[1:]
        for t in rest:
            if size is None and t.lstrip('-').isdigit():
                size = int(t)
            else:
                styles.append(t)
    if fam in ('TkDefaultFont', 'TkTextFont', 'TkMenuFont', 'TkHeadingFont', 'TkCaptionFont', 'TkSmallCaptionFont', 'TkIconFont', 'TkTooltipFont'):
        fam = None
    if fam == 'TkFixedFont':
        fam = 'Consolas'
    try:
        size = int(size) if size is not None else 9
    except (TypeError, ValueError):
        size = 9
    px = -size if size < 0 else round(size * 4 / 3, 1)
    weight = 'bold' if 'bold' in styles else 'normal'
    style = 'italic' if 'italic' in styles else 'normal'
    deco = []
    if 'underline' in styles:
        deco.append('underline')
    if 'overstrike' in styles:
        deco.append('line-through')
    fams = []
    if fam:
        fams.append('"%s"' % fam.replace('"', ''))
    fams.append('"Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif')
    css = '%s %s %spx %s' % (style, weight, px, ', '.join(fams))
    if deco:
        css += '|' + ' '.join(deco)
    return css


def font_px(f):
    css = font_css(f, None)
    if not css:
        return 12
    try:
        return float(css.split()[2].replace('px', ''))
    except (IndexError, ValueError):
        return 12


def image_size(data):
    """GIF · PNG · JPEG · BMP 헤더에서 크기 읽기"""
    b = bytes(data[:64 * 1024])
    if b[:6] in (b'GIF87a', b'GIF89a'):
        return b[6] | (b[7] << 8), b[8] | (b[9] << 8), 'image/gif'
    if b[:8] == b'\x89PNG\r\n\x1a\n':
        return int.from_bytes(b[16:20], 'big'), int.from_bytes(b[20:24], 'big'), 'image/png'
    if b[:2] == b'BM':
        return int.from_bytes(b[18:22], 'little', signed=True), abs(int.from_bytes(b[22:26], 'little', signed=True)), 'image/bmp'
    if b[:2] == b'\xff\xd8':
        i = 2
        while i < len(b) - 9:
            if b[i] != 0xFF:
                i += 1
                continue
            m = b[i + 1]
            if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                return int.from_bytes(b[i + 7:i + 9], 'big'), int.from_bytes(b[i + 5:i + 7], 'big'), 'image/jpeg'
            i += 2 + int.from_bytes(b[i + 2:i + 4], 'big')
        return 0, 0, 'image/jpeg'
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
        return 0, 0, 'image/webp'
    if b[:2] in (b'P5', b'P6', b'P3', b'P2'):
        toks = b.split(None, 4)
        try:
            return int(toks[1]), int(toks[2]), 'image/x-portable-pixmap'
        except (IndexError, ValueError):
            pass
    return 0, 0, 'application/octet-stream'


def list_files(patterns=None, limit=400):
    """작업 폴더의 파일 목록 (파일 대화상자용)"""
    import fnmatch
    out = []
    base = os.getcwd()
    for root, dirs, files in os.walk(base):
        dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d != '__pycache__')
        for f in sorted(files):
            rel = os.path.relpath(os.path.join(root, f), base).replace('\\', '/')
            if patterns and not any(fnmatch.fnmatch(f.lower(), p.lower()) for p in patterns):
                continue
            out.append(rel)
            if len(out) >= limit:
                return out
    return out
