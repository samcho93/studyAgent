"""브라우저용 tkinter 호환 모듈 (웹 실습 강좌).

표준 tkinter 와 같은 이름 · 사용법으로 창(윈도), 위젯, 캔버스, 메뉴, 대화상자를 만든다.
창은 강좌 페이지 위의 떠 있는 창으로 그려지고, 마우스 · 키보드 이벤트를 파이썬으로 돌려받는다.
(검증 도구의 일반 파이썬에서는 화면 없이 동작한다)
"""
import re as _re
import os as _os
import base64 as _b64
import _webgui as _G
from tkinter.constants import *  # noqa

TkVersion = 8.6
TclVersion = 8.6
READABLE = 2
WRITABLE = 4
EXCEPTION = 8
wantobjects = 1


class TclError(Exception):
    pass


_default_root = None
_support_default_root = True
_images = {}        # 이름 -> 이미지
_all_bindings = {}  # bind_all
_class_bindings = {}
_menus = {}
_focus = {'widget': None}


def _reset_module():
    global _default_root
    _default_root = None
    _images.clear()
    _all_bindings.clear()
    _class_bindings.clear()
    _menus.clear()
    _focus['widget'] = None


def NoDefaultRoot():
    global _support_default_root
    _support_default_root = False


def _get_default_root(what=None):
    if _default_root is None:
        Tk()
    return _default_root


def _cnfmerge(cnf, kw):
    d = {}
    if isinstance(cnf, dict):
        d.update(cnf)
    elif isinstance(cnf, (tuple, list)):
        for c in cnf:
            if c:
                d.update(c)
    if kw:
        d.update(kw)
    return d


_ALIAS = {'fg': 'foreground', 'bg': 'background', 'bd': 'borderwidth', 'from_': 'from', 'invcmd': 'invalidcommand', 'vcmd': 'validatecommand'}
_COLOR_KEYS = {'foreground', 'background', 'activebackground', 'activeforeground', 'disabledforeground',
               'highlightbackground', 'highlightcolor', 'selectbackground', 'selectforeground',
               'insertbackground', 'troughcolor', 'selectcolor', 'readonlybackground', 'disabledbackground'}
_SKIP_KEYS = {'command', 'textvariable', 'variable', 'menu', 'xscrollcommand', 'yscrollcommand',
              'validatecommand', 'invalidcommand', 'postcommand', 'listvariable', 'cursor', 'takefocus',
              'class', 'colormap', 'container', 'visual', 'screen', 'use', 'name'}


def _norm_key(k):
    k = _ALIAS.get(k, k)
    return k.lstrip('-')


def _ser(k, v):
    if k in _COLOR_KEYS:
        return _G.color(v)
    if k == 'font':
        return _G.font_css(v)
    if k in ('image', 'selectimage', 'tristateimage'):
        img = _image_of(v)
        return img._id if img is not None else ''
    if isinstance(v, bool) or v is None or isinstance(v, (int, float, str)):
        return v
    if isinstance(v, (tuple, list)):
        return [x if isinstance(x, (int, float, str)) else str(x) for x in v]
    if isinstance(v, Variable):
        return str(v.get())
    return str(v)


def _image_of(v):
    if v is None or v == '':
        return None
    if isinstance(v, Image):
        return v
    return _images.get(str(v))


def _num(v, default=0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _int(v, default=0):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return default


# ====================================================================== 변수
class Variable:
    _default = ''

    def __init__(self, master=None, value=None, name=None):
        self._name = name or _G.new_id('PY_VAR')
        self._value = self._default if value is None else value
        self._traces = []
        self._widgets = []

    def __str__(self):
        return self._name

    def __repr__(self):
        return '<tkinter.%s object %s>' % (type(self).__name__, self._name)

    def set(self, value):
        self._set(value, None)

    def _set(self, value, source):
        self._value = value
        for w in list(self._widgets):
            if w is not source:
                try:
                    w._var_changed(self)
                except Exception:
                    pass
        for mode, cb in list(self._traces):
            if 'w' in mode or 'write' in mode:
                _G.call_handler(cb, self._name, '', 'write')

    initialize = set

    def get(self):
        return self._value

    def _link(self, w):
        if w not in self._widgets:
            self._widgets.append(w)

    def _unlink(self, w):
        if w in self._widgets:
            self._widgets.remove(w)

    def trace_add(self, mode, callback):
        modes = mode if isinstance(mode, (list, tuple)) else [mode]
        self._traces.append((' '.join(modes), callback))
        return '%s_trace%d' % (self._name, len(self._traces))

    def trace_remove(self, mode, cbname):
        pass

    def trace_info(self):
        return [(m, c) for m, c in self._traces]

    def trace_variable(self, mode, callback):
        self._traces.append((mode, callback))
        return '%s_trace%d' % (self._name, len(self._traces))

    trace = trace_variable

    def trace_vdelete(self, mode, cbname):
        pass

    def trace_vinfo(self):
        return self.trace_info()

    def __eq__(self, other):
        return isinstance(other, Variable) and other._name == self._name

    def __hash__(self):
        return hash(self._name)


class StringVar(Variable):
    _default = ''

    def get(self):
        v = self._value
        return v if isinstance(v, str) else str(v)


class IntVar(Variable):
    _default = 0

    def get(self):
        v = self._value
        if isinstance(v, bool):
            return int(v)
        if isinstance(v, int):
            return v
        try:
            return int(v)
        except (TypeError, ValueError):
            try:
                return int(float(v))
            except (TypeError, ValueError):
                raise TclError('expected integer but got "%s"' % v)


class DoubleVar(Variable):
    _default = 0.0

    def get(self):
        try:
            return float(self._value)
        except (TypeError, ValueError):
            raise TclError('expected floating-point number but got "%s"' % self._value)


class BooleanVar(Variable):
    _default = False

    def get(self):
        v = self._value
        if isinstance(v, str):
            if v.lower() in ('1', 'true', 'yes', 'on'):
                return True
            if v.lower() in ('0', 'false', 'no', 'off', ''):
                return False
            raise TclError('expected boolean value but got "%s"' % v)
        return bool(v)

    def set(self, value):
        self._set(bool(value) if not isinstance(value, str) else value, None)


def getint(s):
    return int(s)


def getdouble(s):
    return float(s)


def getboolean(s):
    return BooleanVar(value=s).get()


# ====================================================================== 이벤트
class EventType(str):
    pass


class Event:
    def __init__(self):
        self.serial = 0
        self.num = '??'
        self.focus = False
        self.height = self.width = '??'
        self.keycode = '??'
        self.state = 0
        self.time = 0
        self.x = self.y = self.x_root = self.y_root = 0
        self.char = ''
        self.send_event = False
        self.keysym = '??'
        self.keysym_num = 0
        self.type = EventType('??')
        self.widget = None
        self.delta = 0

    def __repr__(self):
        attrs = {k: v for k, v in self.__dict__.items() if v != '??' and not k.startswith('_')}
        parts = []
        t = attrs.pop('type', '')
        w = attrs.pop('widget', None)
        for k in ('state', 'num', 'keysym', 'char', 'delta', 'x', 'y', 'width', 'height'):
            if k in attrs and attrs[k] not in ('', None):
                if k == 'state' and not attrs[k]:
                    continue
                if k == 'delta' and not attrs[k]:
                    continue
                parts.append('%s=%r' % (k, attrs[k]))
        return '<%s event %s>' % (t, ' '.join(parts))


_TYPES = {
    'Button': 'ButtonPress', 'ButtonPress': 'ButtonPress', 'ButtonRelease': 'ButtonRelease',
    'Key': 'KeyPress', 'KeyPress': 'KeyPress', 'KeyRelease': 'KeyRelease',
    'Motion': 'Motion', 'Enter': 'Enter', 'Leave': 'Leave', 'MouseWheel': 'MouseWheel',
    'Configure': 'Configure', 'FocusIn': 'FocusIn', 'FocusOut': 'FocusOut', 'Destroy': 'Destroy',
    'Map': 'Map', 'Unmap': 'Unmap', 'Expose': 'Expose', 'Visibility': 'Visibility', 'Activate': 'Activate',
    'Deactivate': 'Deactivate',
}
_MODS = {'Control': 4, 'Shift': 1, 'Lock': 2, 'Alt': 0x20000, 'Option': 0x20000, 'Meta': 0x40000, 'Command': 0x40000,
         'Mod1': 8, 'M1': 8, 'B1': 256, 'Button1': 256, 'B2': 512, 'Button2': 512, 'B3': 1024, 'Button3': 1024,
         'B4': 2048, 'B5': 4096, 'Double': 0, 'Triple': 0, 'Quadruple': 0, 'Any': 0}
_WANT = {'ButtonPress': 'Button', 'ButtonRelease': 'ButtonRelease', 'KeyPress': 'Key', 'KeyRelease': 'KeyRelease',
         'Motion': 'Motion', 'Enter': 'Enter', 'Leave': 'Leave', 'MouseWheel': 'MouseWheel', 'Configure': 'Configure',
         'FocusIn': 'FocusIn', 'FocusOut': 'FocusOut'}


def _parse_seq(seq):
    """'<Button-1>', '<Double-1>', '<B1-Motion>', '<Key>', '<Return>', 'a', '<<ListboxSelect>>' → (type, detail, mods)"""
    seq = str(seq).strip()
    if seq.startswith('<<') and seq.endswith('>>'):
        return ('Virtual', seq[2:-2], frozenset())
    if not seq.startswith('<'):
        ch = seq[:1]
        return ('KeyPress', _CHAR_KEYSYM.get(ch, ch), frozenset())
    parts = seq[1:-1].split('-')
    mods, typ, detail = set(), None, None
    for p in parts:
        if p in _MODS and detail is None and not (p in ('B1', 'B2', 'B3') and typ is None and len(parts) == 1):
            mods.add(p)
        elif p in _TYPES and typ is None and detail is None:
            typ = _TYPES[p]
        else:
            detail = p if detail is None else detail + '-' + p
    if typ is None:
        typ = 'ButtonPress' if (detail and detail.isdigit()) else 'KeyPress'
    if typ in ('ButtonPress', 'ButtonRelease') and detail is not None and not detail.isdigit():
        detail = None
    return (typ, detail, frozenset(mods))


_CHAR_KEYSYM = {' ': 'space', '<': 'less', '>': 'greater', '!': 'exclam', '@': 'at', '#': 'numbersign', '$': 'dollar',
                '%': 'percent', '^': 'asciicircum', '&': 'ampersand', '*': 'asterisk', '(': 'parenleft', ')': 'parenright',
                '-': 'minus', '_': 'underscore', '=': 'equal', '+': 'plus', '[': 'bracketleft', ']': 'bracketright',
                '{': 'braceleft', '}': 'braceright', ';': 'semicolon', ':': 'colon', "'": 'apostrophe', '"': 'quotedbl',
                ',': 'comma', '.': 'period', '/': 'slash', '?': 'question', '\\': 'backslash', '|': 'bar', '`': 'grave', '~': 'asciitilde'}


def _score_match(key, ev):
    typ, detail, mods = key
    if typ != ev._tname:
        return -1
    if detail is not None:
        if typ in ('ButtonPress', 'ButtonRelease'):
            if str(ev.num) != detail:
                return -1
        elif typ in ('KeyPress', 'KeyRelease'):
            if ev.keysym != detail and not (len(detail) == 1 and ev.char == detail):
                return -1
        elif typ == 'Virtual':
            if detail != ev._detail:
                return -1
    st = ev.state if isinstance(ev.state, int) else 0
    for m in mods:
        bit = _MODS.get(m, 0)
        if bit and not (st & bit):
            if m in ('Alt', 'Option') and st & 8:
                continue
            return -1
    cnt = getattr(ev, '_count', 1)
    if 'Double' in mods and cnt < 2:
        return -1
    if 'Triple' in mods and cnt < 3:
        return -1
    return (4 if detail is not None else 0) + 2 * len(mods) + (1 if typ == 'Virtual' else 0)


def _best(bindings, ev):
    best, score = None, -1
    for key, funcs in bindings.items():
        s = _score_match(key, ev)
        if s > score and funcs:
            best, score = funcs, s
    return best


def _call_funcs(funcs, ev):
    res = None
    for f in list(funcs):
        r = _G.call_handler(f, ev)
        if r == 'break':
            res = 'break'
    return res


# ====================================================================== 공통 기반
class Misc:
    _cls = 'frame'
    _defaults = {}
    _tclass = 'Frame'

    def _init_common(self):
        self._cfg = {}
        self.children = {}
        self._bindings = {}
        self._geo = None
        self._geom = None
        self._destroyed = False
        self._command = None
        self._vars = {}

    # ------------------------------------------------------------ 설정
    def configure(self, cnf=None, **kw):
        if cnf is None and not kw:
            out = {}
            for k in set(self._defaults) | set(self._cfg):
                out[k] = (k, k, k.capitalize(), self._defaults.get(k, ''), self.cget(k))
            return out
        if isinstance(cnf, str):
            k = _norm_key(cnf)
            return (k, k, k.capitalize(), self._defaults.get(k, ''), self.cget(k))
        self._configure(_cnfmerge(cnf, kw))

    config = configure

    def _configure(self, kw):
        out = {}
        for k, v in kw.items():
            k = _norm_key(k)
            if k == 'command':
                self._command = v
                out['hascmd'] = bool(v)
            elif k in ('textvariable', 'variable', 'listvariable'):
                old = self._vars.get(k)
                if old is not None:
                    old._unlink(self)
                if isinstance(v, str) and v:
                    v = StringVar(value='')
                self._vars[k] = v
                if v is not None:
                    v._link(self)
                self._cfg[k] = v
                continue
            elif k == 'menu' and isinstance(self, Wm):
                self._cfg[k] = v
                self._send_menubar()
                continue
            self._cfg[k] = v
            if k not in _SKIP_KEYS:
                out[k] = _ser(k, v)
        extra = self._state_cfg(kw)
        if extra:
            out.update(extra)
        if out and not self._destroyed:
            _G.send({'op': 'cfg', 'id': self._w, 'o': out})

    def _state_cfg(self, kw):
        """위젯의 현재 값(변수 연결 등)을 화면에 보낼 설정"""
        if 'textvariable' in {_norm_key(k) for k in kw}:
            var = self._vars.get('textvariable')
            if var is not None:
                return {'text': str(var.get())}
        return None

    def _var_changed(self, var):
        if var is self._vars.get('textvariable'):
            _G.send({'op': 'cfg', 'id': self._w, 'o': {'text': str(var.get())}})

    def cget(self, key):
        key = _norm_key(key)
        if key == 'text' and self._vars.get('textvariable') is not None:
            return str(self._vars['textvariable'].get())
        if key in self._cfg:
            return self._cfg[key]
        return self._defaults.get(key, '')

    __getitem__ = cget

    def __setitem__(self, key, value):
        self.configure({key: value})

    def keys(self):
        return sorted(set(self._defaults) | set(self._cfg))

    def __str__(self):
        return self._w

    # ------------------------------------------------------------ 이벤트 연결
    def bind(self, sequence=None, func=None, add=None):
        return self._bind(self._bindings, sequence, func, add)

    def _bind(self, table, sequence, func, add):
        if sequence is None:
            return [k for k in table]
        key = _parse_seq(sequence)
        if func is None:
            return table.get(key, [])
        if add and add != '' and str(add) not in ('0', 'False'):
            table.setdefault(key, []).append(func)
        else:
            table[key] = [func]
        self._send_wants()
        return 'f%d%s' % (id(func), str(sequence))

    def unbind(self, sequence, funcid=None):
        self._bindings.pop(_parse_seq(sequence), None)
        self._send_wants()

    def bind_all(self, sequence=None, func=None, add=None):
        r = self._bind(_all_bindings, sequence, func, add)
        _send_global_wants()
        return r

    def unbind_all(self, sequence):
        _all_bindings.pop(_parse_seq(sequence), None)
        _send_global_wants()

    def bind_class(self, className, sequence=None, func=None, add=None):
        table = _class_bindings.setdefault(className, {})
        r = self._bind(table, sequence, func, add)
        _send_global_wants()
        return r

    def unbind_class(self, className, sequence):
        _class_bindings.get(className, {}).pop(_parse_seq(sequence), None)

    def _wants(self):
        return sorted({_WANT[k[0]] for k in self._bindings if k[0] in _WANT})

    def _send_wants(self):
        if not self._destroyed:
            _G.send({'op': 'want', 'id': self._w, 't': self._wants()})

    def bindtags(self, tagList=None):
        return (self._w, self._tclass, self.winfo_toplevel()._w, 'all')

    def _fire(self, ev):
        """bindtags 순서(위젯 → 클래스 → 최상위 창 → all)로 처리 함수 호출"""
        ev.widget = self
        top = self.winfo_toplevel()
        tables = [self._bindings, _class_bindings.get(self._tclass, {})]
        if top is not self and top is not None:
            tables.append(top._bindings)
        tables.append(_all_bindings)
        for t in tables:
            funcs = _best(t, ev)
            if funcs and _call_funcs(funcs, ev) == 'break':
                return 'break'
        return None

    def event_generate(self, sequence, **kw):
        typ, detail, mods = _parse_seq(sequence)
        ev = Event()
        ev._tname = typ
        ev._detail = detail
        ev.type = EventType(typ if typ != 'Virtual' else 'VirtualEvent')
        ev.x = kw.get('x', 0)
        ev.y = kw.get('y', 0)
        if typ in ('ButtonPress', 'ButtonRelease'):
            ev.num = int(detail) if detail else 1
        if typ in ('KeyPress', 'KeyRelease'):
            ev.keysym = detail or kw.get('keysym', '??')
            ev.char = detail if detail and len(detail) == 1 else ''
        self._fire(ev)

    def event_add(self, virtual, *sequences):
        pass

    def _make_event(self, e):
        ev = Event()
        t = e.get('t')
        ev._tname = {'Button': 'ButtonPress', 'Key': 'KeyPress'}.get(t, t)
        ev.type = EventType({'ButtonPress': '4', 'ButtonRelease': '5', 'KeyPress': '2', 'KeyRelease': '3', 'Motion': '6',
                             'Enter': '7', 'Leave': '8', 'MouseWheel': '38', 'Configure': '22', 'FocusIn': '9',
                             'FocusOut': '10'}.get(ev._tname, ev._tname))
        ev.type = _EventTypeName(ev._tname, ev.type)
        ev.x = e.get('x', 0)
        ev.y = e.get('y', 0)
        ev.x_root = e.get('X', 0)
        ev.y_root = e.get('Y', 0)
        ev.state = e.get('st', 0)
        ev.time = int(e.get('tm', 0))
        ev._count = e.get('cnt', 1)
        if 'num' in e:
            ev.num = e['num']
        if 'ks' in e:
            ev.keysym = e['ks']
            ev.char = e.get('ch', '')
            ev.keycode = e.get('kc', 0)
            ev.keysym_num = e.get('kn', 0)
        if 'd' in e:
            ev.delta = e['d']
        if 'w' in e:
            ev.width = e['w']
            ev.height = e['h']
        return ev

    def _on_event(self, e):
        t = e.get('t')
        if t in ('Button', 'ButtonRelease', 'Motion', 'Key', 'KeyRelease', 'Enter', 'Leave', 'MouseWheel', 'Configure', 'FocusIn', 'FocusOut'):
            ev = self._make_event(e)
            if t == 'Configure' and 'w' in e:
                self._geom = [e.get('x', 0), e.get('y', 0), e['w'], e['h']]
            self._handle_generic(ev)
        else:
            self._handle_special(e)

    def _handle_generic(self, ev):
        self._fire(ev)

    def _handle_special(self, e):
        pass

    # ------------------------------------------------------------ 타이머 · 루프
    def after(self, ms, func=None, *args):
        if func is None:
            _G.sleep(_num(ms) / 1000.0)
            return None
        return _G.after(_num(ms), func, *args)

    def after_idle(self, func, *args):
        return _G.after(0, func, *args)

    def after_cancel(self, id):
        if id:
            _G.after_cancel(id)

    def update(self):
        _G.process_pending()

    def update_idletasks(self):
        _G.flush()

    def mainloop(self, n=0):
        _G.mainloop()

    def quit(self):
        _G.quit_loop()

    def wait_window(self, window=None):
        window = window or self
        while not window._destroyed and _G.has_windows():
            _G.process_pending()
            _G._pull(50)

    def wait_variable(self, name):
        var = name
        start = var.get() if isinstance(var, Variable) else None
        while _G.has_windows():
            _G.process_pending()
            if isinstance(var, Variable) and var._value != start:
                break
            _G._pull(50)

    waitvar = wait_variable

    def wait_visibility(self, window=None):
        _G.flush()

    def bell(self, displayof=0):
        _G.send({'op': 'bell'})

    # ------------------------------------------------------------ 포커스 · 정보
    def focus_set(self):
        _focus['widget'] = self
        _G.send({'op': 'focus', 'id': self._w})

    focus = focus_set
    focus_force = focus_set

    def focus_get(self):
        return _focus['widget']

    def focus_displayof(self):
        return _focus['widget']

    def grab_set(self):
        pass

    def grab_release(self):
        pass

    def grab_set_global(self):
        pass

    def option_add(self, pattern, value, priority=None):
        pass

    def option_get(self, name, className):
        return ''

    def clipboard_clear(self, **kw):
        _clip[0] = ''

    def clipboard_append(self, string, **kw):
        _clip[0] += str(string)

    def clipboard_get(self, **kw):
        return _clip[0]

    def selection_get(self, **kw):
        return ''

    def register(self, func, subst=None, needcleanup=1):
        name = _G.new_id('cb')
        _registered[name] = func
        return name

    _register = register

    def nametowidget(self, name):
        name = str(name)
        for w in _all_widgets():
            if w._w == name:
                return w
        raise KeyError(name)

    _nametowidget = nametowidget

    def winfo_children(self):
        return [c for c in self.children.values() if not c._destroyed]

    def winfo_toplevel(self):
        w = self
        while w is not None and not isinstance(w, Wm):
            w = w.master
        return w

    def winfo_exists(self):
        return 0 if self._destroyed else 1

    def winfo_ismapped(self):
        return 1 if self._geo or isinstance(self, Wm) else 0

    def winfo_viewable(self):
        return self.winfo_ismapped()

    def _size(self):
        if self._geom:
            return self._geom[2], self._geom[3]
        return self._req_size()

    def _req_size(self):
        w = self._cfg.get('width')
        h = self._cfg.get('height')
        return (_int(w, 1) if w not in (None, '') else 1, _int(h, 1) if h not in (None, '') else 1)

    def winfo_width(self):
        return int(self._size()[0])

    def winfo_height(self):
        return int(self._size()[1])

    def winfo_reqwidth(self):
        return int(self._req_size()[0])

    def winfo_reqheight(self):
        return int(self._req_size()[1])

    def winfo_x(self):
        return int(self._geom[0]) if self._geom else 0

    def winfo_y(self):
        return int(self._geom[1]) if self._geom else 0

    def winfo_rootx(self):
        return self.winfo_x()

    def winfo_rooty(self):
        return self.winfo_y()

    def winfo_screenwidth(self):
        return 1920

    def winfo_screenheight(self):
        return 1080

    def winfo_pointerx(self):
        return 0

    def winfo_pointery(self):
        return 0

    def winfo_pointerxy(self):
        return (0, 0)

    def winfo_class(self):
        return self._tclass

    def winfo_name(self):
        return self._w

    def winfo_id(self):
        return abs(hash(self._w)) % 100000

    def winfo_rgb(self, color):
        c = _G.color(color) or '#000000'
        if c.startswith('#') and len(c) == 7:
            return tuple(int(c[i:i + 2], 16) * 257 for i in (1, 3, 5))
        return (0, 0, 0)

    def winfo_fpixels(self, number):
        return float(number)

    def winfo_pixels(self, number):
        return int(float(number))

    def winfo_manager(self):
        return self._geo[0] if self._geo else ''

    def winfo_parent(self):
        return str(self.master) if self.master else ''

    def winfo_geometry(self):
        w, h = self._size()
        return '%dx%d+%d+%d' % (w, h, self.winfo_x(), self.winfo_y())

    # ------------------------------------------------------------ grid 설정 (부모 쪽)
    def grid_columnconfigure(self, index, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        idx = index if isinstance(index, (list, tuple)) else [index]
        for i in idx:
            _G.send({'op': 'gridcfg', 'id': self._w, 'axis': 'col', 'i': _int(i), 'o': {k: _num(v) for k, v in kw.items() if k in ('weight', 'minsize', 'pad')}})

    columnconfigure = grid_columnconfigure

    def grid_rowconfigure(self, index, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        idx = index if isinstance(index, (list, tuple)) else [index]
        for i in idx:
            _G.send({'op': 'gridcfg', 'id': self._w, 'axis': 'row', 'i': _int(i), 'o': {k: _num(v) for k, v in kw.items() if k in ('weight', 'minsize', 'pad')}})

    rowconfigure = grid_rowconfigure

    def grid_propagate(self, flag=None):
        if flag is None:
            return self._cfg.get('_gprop', True)
        self._cfg['_gprop'] = bool(flag)
        _G.send({'op': 'prop', 'id': self._w, 'v': bool(flag)})

    def pack_propagate(self, flag=None):
        if flag is None:
            return self._cfg.get('_pprop', True)
        self._cfg['_pprop'] = bool(flag)
        _G.send({'op': 'prop', 'id': self._w, 'v': bool(flag)})

    propagate = pack_propagate

    def grid_slaves(self, row=None, column=None):
        out = []
        for c in self.winfo_children():
            if c._geo and c._geo[0] == 'grid':
                o = c._geo[1]
                if (row is None or o.get('row') == row) and (column is None or o.get('column') == column):
                    out.append(c)
        return out[::-1]

    def pack_slaves(self):
        return [c for c in self.winfo_children() if c._geo and c._geo[0] == 'pack']

    slaves = pack_slaves

    def place_slaves(self):
        return [c for c in self.winfo_children() if c._geo and c._geo[0] == 'place']

    def grid_size(self):
        cols = rows = 0
        for c in self.winfo_children():
            if c._geo and c._geo[0] == 'grid':
                o = c._geo[1]
                cols = max(cols, o.get('column', 0) + o.get('columnspan', 1))
                rows = max(rows, o.get('row', 0) + o.get('rowspan', 1))
        return (cols, rows)

    # ------------------------------------------------------------ 파괴
    def destroy(self):
        if self._destroyed:
            return
        for c in list(self.children.values()):
            c.destroy()
        self._destroyed = True
        for v in self._vars.values():
            if v is not None:
                v._unlink(self)
        if self.master is not None and getattr(self.master, 'children', None) is not None:
            for k, c in list(self.master.children.items()):
                if c is self:
                    del self.master.children[k]
        _G.unregister(self._w)
        ev = Event()
        ev._tname = 'Destroy'
        ev.type = EventType('Destroy')
        if any(k[0] == 'Destroy' for k in self._bindings):
            self._fire(ev)
        self._on_destroy()

    def _on_destroy(self):
        _G.send({'op': 'del', 'id': self._w})

    @property
    def tk(self):
        return _TkStub()

    def getvar(self, name='PY_VAR'):
        return ''

    def setvar(self, name='PY_VAR', value='1'):
        pass

    def image_names(self):
        return tuple(_images)

    def lift(self, aboveThis=None):
        _G.send({'op': 'raise', 'id': self._w})

    tkraise = lift

    def lower(self, belowThis=None):
        _G.send({'op': 'lower', 'id': self._w})


_clip = ['']
_registered = {}


class _EventTypeName(str):
    """event.type 이 print 될 때 'ButtonPress' 처럼 보이고 숫자와도 비교 가능"""
    def __new__(cls, name, num):
        o = str.__new__(cls, name)
        o._num = num
        return o

    def __eq__(self, other):
        return str.__eq__(self, other) or other == self._num

    __hash__ = str.__hash__

    @property
    def name(self):
        return str(self)

    @property
    def value(self):
        return self._num


class _TkStub:
    def call(self, *args):
        return ''

    def eval(self, s):
        return ''

    def getboolean(self, s):
        return getboolean(s)

    def splitlist(self, s):
        return tuple(str(s).split())

    def globalsetvar(self, *a):
        pass

    def globalgetvar(self, *a):
        return ''

    def createcommand(self, *a):
        pass


def _all_widgets():
    out = []

    def walk(w):
        out.append(w)
        for c in w.children.values():
            walk(c)
    for win in list(_G._windows.values()):
        if isinstance(win, Misc):
            walk(win)
    return out


def _send_global_wants():
    types = {_WANT[k[0]] for k in _all_bindings if k[0] in _WANT}
    for tb in _class_bindings.values():
        types |= {_WANT[k[0]] for k in tb if k[0] in _WANT}
    _G.send({'op': 'want', 'id': '*', 't': sorted(types)})


# ====================================================================== 창 관리 (Wm)
class Wm:
    def _wm_init(self):
        self._title = 'tk'
        self._protocols = {}

    def title(self, string=None):
        if string is None:
            return self._title
        self._title = str(string)
        _G.send({'op': 'title', 'id': self._w, 'text': self._title})

    wm_title = title

    def geometry(self, newGeometry=None):
        if newGeometry is None:
            w, h = self._size()
            return '%dx%d+%d+%d' % (w, h, 0, 0)
        m = _re.match(r'^\s*(?:(\d+)x(\d+))?\s*(?:([+-]-?\d+)([+-]-?\d+))?\s*$', str(newGeometry))
        if not m:
            raise TclError('bad geometry specifier "%s"' % newGeometry)
        op = {'op': 'geom', 'id': self._w}
        if m.group(1):
            op['w'] = int(m.group(1))
            op['h'] = int(m.group(2))
            self._geom = [0, 0, op['w'], op['h']]
        if m.group(3):
            op['x'] = int(m.group(3))
            op['y'] = int(m.group(4))
        _G.send(op)

    wm_geometry = geometry

    def resizable(self, width=None, height=None):
        if width is None:
            return self._cfg.get('_resizable', (1, 1))
        self._cfg['_resizable'] = (int(bool(width)), int(bool(height if height is not None else width)))
        _G.send({'op': 'resizable', 'id': self._w, 'v': list(self._cfg['_resizable'])})

    wm_resizable = resizable

    def minsize(self, width=None, height=None):
        if width is not None:
            _G.send({'op': 'minsize', 'id': self._w, 'w': _int(width), 'h': _int(height)})

    def maxsize(self, width=None, height=None):
        pass

    def protocol(self, name=None, func=None):
        if func is None:
            return self._protocols.get(name, '')
        self._protocols[name] = func

    wm_protocol = protocol

    def iconbitmap(self, bitmap=None, default=None):
        pass

    wm_iconbitmap = iconbitmap

    def iconphoto(self, default=False, *args):
        pass

    def iconify(self):
        pass

    def deiconify(self):
        _G.send({'op': 'show', 'id': self._w, 'v': True})

    def withdraw(self):
        _G.send({'op': 'show', 'id': self._w, 'v': False})

    def state(self, newstate=None):
        return 'normal'

    def attributes(self, *args, **kw):
        return ''

    wm_attributes = attributes

    def overrideredirect(self, boolean=None):
        pass

    def transient(self, master=None):
        pass

    def aspect(self, *a):
        pass

    def positionfrom(self, who=None):
        pass

    def sizefrom(self, who=None):
        pass

    def _send_menubar(self):
        m = self._cfg.get('menu')
        _G.send({'op': 'menubar', 'id': self._w, 'tree': m._tree() if isinstance(m, Menu) else None})

    def _handle_special(self, e):
        if e.get('t') == 'close':
            f = self._protocols.get('WM_DELETE_WINDOW')
            if f:
                _G.call_handler(f)
            else:
                self.destroy()


# ====================================================================== Tk (루트 창)
class Tk(Misc, Wm):
    _cls = 'root'
    _tclass = 'Tk'
    _defaults = {'background': 'SystemButtonFace', 'width': 0, 'height': 0, 'borderwidth': 0, 'relief': 'flat'}

    def __init__(self, screenName=None, baseName=None, className='Tk', useTk=True, sync=False, use=None):
        global _default_root
        self._init_common()
        self._wm_init()
        self.master = None
        self._w = _G.new_id('tk')
        self._title = className if className != 'Tk' else 'tk'
        _G.send({'op': 'win', 'id': self._w, 'title': self._title})
        _G.register_window(self)
        if _default_root is None or _default_root._destroyed:
            _default_root = self

    def destroy(self):
        global _default_root
        if self._destroyed:
            return
        Misc.destroy(self)
        _G.unregister_window(self)
        if _default_root is self:
            _default_root = None

    def _on_destroy(self):
        _G.send({'op': 'wclose', 'id': self._w})

    def report_callback_exception(self, exc, val, tb):
        import sys
        print('Exception in Tkinter callback', file=sys.stderr)

    def loadtk(self):
        pass

    def readprofile(self, *a):
        pass


def Tcl(screenName=None, baseName=None, className='Tk', useTk=False):
    return Tk(screenName, baseName, className, useTk)


# ====================================================================== 위젯 기반
class BaseWidget(Misc):
    def __init__(self, master=None, cnf={}, **kw):
        if master is None:
            master = _get_default_root()
        self._init_common()
        self.master = master
        kw = _cnfmerge(cnf, kw)
        name = kw.pop('name', None)
        self._w = _G.new_id(self._cls[:3])
        self._name = name or ('!' + self._tclass.lower() + str(len(master.children) + 1 if len(master.children) else ''))
        master.children[self._name] = self
        _G.register(self._w, self)
        _G.send({'op': 'new', 'id': self._w, 'p': master._w, 'c': self._cls, 'o': {}})
        self._init_widget(kw)
        self._configure(kw)

    def _init_widget(self, kw):
        pass


class Widget(BaseWidget):
    # ------------------------------------------------------------ pack
    def pack_configure(self, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        o = {}
        for k, v in kw.items():
            k = k.lstrip('-')
            if k in ('in', 'in_'):
                continue
            if k in ('before', 'after'):
                o[k] = str(v)
            elif k in ('padx', 'pady'):
                o[k] = [_num(x) for x in v] if isinstance(v, (tuple, list)) else _num(v)
            elif k == 'expand':
                o[k] = bool(v) if not isinstance(v, str) else v.lower() in ('1', 'yes', 'true')
            else:
                o[k] = v if isinstance(v, (int, float, str)) else str(v)
        self._geo = ('pack', o)
        _G.send({'op': 'geo', 'id': self._w, 'm': 'pack', 'o': o})

    pack = pack_configure

    def pack_forget(self):
        self._geo = None
        _G.send({'op': 'geo', 'id': self._w, 'm': None})

    forget = pack_forget

    def pack_info(self):
        return dict(self._geo[1]) if self._geo and self._geo[0] == 'pack' else {}

    info = pack_info

    # ------------------------------------------------------------ grid
    def grid_configure(self, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        o = dict(self._geo[1]) if self._geo and self._geo[0] == 'grid' else {}
        for k, v in kw.items():
            k = k.lstrip('-')
            if k in ('in', 'in_'):
                continue
            if k in ('padx', 'pady'):
                o[k] = [_num(x) for x in v] if isinstance(v, (tuple, list)) else _num(v)
            elif k in ('row', 'column', 'rowspan', 'columnspan', 'ipadx', 'ipady'):
                o[k] = _int(v)
            else:
                o[k] = str(v)
        if 'row' not in o:
            o['row'] = self._next_grid_row()
        if 'column' not in o:
            o['column'] = 0
        self._geo = ('grid', o)
        _G.send({'op': 'geo', 'id': self._w, 'm': 'grid', 'o': o})

    grid = grid_configure

    def _next_grid_row(self):
        r = -1
        for c in self.master.winfo_children():
            if c is not self and c._geo and c._geo[0] == 'grid':
                r = max(r, c._geo[1].get('row', 0) + c._geo[1].get('rowspan', 1) - 1)
        return r + 1

    def grid_forget(self):
        self._geo = None
        _G.send({'op': 'geo', 'id': self._w, 'm': None})

    grid_remove = grid_forget

    def grid_info(self):
        return dict(self._geo[1]) if self._geo and self._geo[0] == 'grid' else {}

    # ------------------------------------------------------------ place
    def place_configure(self, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        o = dict(self._geo[1]) if self._geo and self._geo[0] == 'place' else {}
        for k, v in kw.items():
            k = k.lstrip('-')
            if k in ('in', 'in_'):
                continue
            o[k] = _num(v) if k in ('x', 'y', 'relx', 'rely', 'width', 'height', 'relwidth', 'relheight') else str(v)
        self._geo = ('place', o)
        _G.send({'op': 'geo', 'id': self._w, 'm': 'place', 'o': o})

    place = place_configure

    def place_forget(self):
        self._geo = None
        _G.send({'op': 'geo', 'id': self._w, 'm': None})

    def place_info(self):
        return dict(self._geo[1]) if self._geo and self._geo[0] == 'place' else {}


# ====================================================================== 창 (Toplevel) · 틀
class Toplevel(BaseWidget, Wm):
    _cls = 'toplevel'
    _tclass = 'Toplevel'
    _defaults = {'background': 'SystemButtonFace', 'width': 0, 'height': 0}

    def __init__(self, master=None, cnf={}, **kw):
        if master is None:
            master = _get_default_root()
        self._init_common()
        self._wm_init()
        self.master = master
        kw = _cnfmerge(cnf, kw)
        kw.pop('name', None)
        self._w = _G.new_id('top')
        self._name = '!toplevel%d' % (len(master.children) + 1)
        master.children[self._name] = self
        _G.send({'op': 'win', 'id': self._w, 'title': 'tk', 'owner': master.winfo_toplevel()._w if master else None})
        _G.register_window(self)
        self._configure(kw)

    def destroy(self):
        if self._destroyed:
            return
        Misc.destroy(self)
        _G.unregister_window(self)

    def _on_destroy(self):
        _G.send({'op': 'wclose', 'id': self._w})


class Frame(Widget):
    _cls = 'frame'
    _tclass = 'Frame'
    _defaults = {'background': 'SystemButtonFace', 'width': 0, 'height': 0, 'borderwidth': 0, 'relief': 'flat'}


class LabelFrame(Widget):
    _cls = 'labelframe'
    _tclass = 'Labelframe'
    _defaults = {'text': '', 'borderwidth': 2, 'relief': 'groove', 'labelanchor': 'nw'}


class PanedWindow(Widget):
    _cls = 'frame'
    _tclass = 'Panedwindow'

    def add(self, child, **kw):
        side = 'left' if self._cfg.get('orient', 'horizontal') == 'horizontal' else 'top'
        child.pack(side=side, fill='both', expand=True)

    def panes(self):
        return self.pack_slaves()


# ====================================================================== 글자 · 버튼
class Label(Widget):
    _cls = 'label'
    _tclass = 'Label'
    _defaults = {'text': '', 'anchor': 'center', 'justify': 'center', 'borderwidth': 2 if False else 0, 'relief': 'flat',
                 'padx': 1, 'pady': 1, 'width': 0, 'height': 0, 'image': '', 'compound': 'none', 'wraplength': 0,
                 'foreground': 'SystemButtonText', 'background': 'SystemButtonFace', 'font': 'TkDefaultFont', 'state': 'normal'}


class Message(Label):
    _cls = 'message'
    _tclass = 'Message'


class Button(Widget):
    _cls = 'button'
    _tclass = 'Button'
    _defaults = {'text': '', 'anchor': 'center', 'justify': 'center', 'borderwidth': 2, 'relief': 'raised',
                 'padx': 1, 'pady': 1, 'width': 0, 'height': 0, 'image': '', 'compound': 'none', 'state': 'normal',
                 'foreground': 'SystemButtonText', 'background': 'SystemButtonFace', 'font': 'TkDefaultFont'}

    def invoke(self):
        if self._command and self.cget('state') != 'disabled':
            return self._command()

    def flash(self):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'cmd' and self._command and self.cget('state') != 'disabled':
            _G.call_handler(self._command)


class Menubutton(Button):
    _cls = 'button'
    _tclass = 'Menubutton'


class Checkbutton(Widget):
    _cls = 'checkbutton'
    _tclass = 'Checkbutton'
    _defaults = {'text': '', 'onvalue': 1, 'offvalue': 0, 'anchor': 'center', 'state': 'normal', 'indicatoron': 1,
                 'image': '', 'compound': 'none', 'foreground': 'SystemButtonText', 'background': 'SystemButtonFace',
                 'font': 'TkDefaultFont', 'padx': 1, 'pady': 1, 'width': 0, 'height': 0}

    def _init_widget(self, kw):
        if not any(_norm_key(k) == 'variable' for k in kw):
            kw['variable'] = IntVar(value=0)

    def _checked(self):
        var = self._vars.get('variable')
        if var is None:
            return False
        v = var._value
        on = self.cget('onvalue')
        return str(v) == str(on) or (isinstance(on, int) and v is True and on == 1)

    def _state_cfg(self, kw):
        out = Misc._state_cfg(self, kw) or {}
        out['checked'] = self._checked()
        return out

    def _var_changed(self, var):
        Misc._var_changed(self, var)
        if var is self._vars.get('variable'):
            _G.send({'op': 'cfg', 'id': self._w, 'o': {'checked': self._checked()}})

    def select(self):
        self._vars['variable']._set(self.cget('onvalue'), None)

    def deselect(self):
        self._vars['variable']._set(self.cget('offvalue'), None)

    def toggle(self):
        if self._checked():
            self.deselect()
        else:
            self.select()

    def invoke(self):
        self.toggle()
        if self._command:
            return self._command()

    def flash(self):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'toggle' and self.cget('state') != 'disabled':
            var = self._vars.get('variable')
            var._set(self.cget('onvalue') if e.get('v') else self.cget('offvalue'), None)
            if self._command:
                _G.call_handler(self._command)


class Radiobutton(Widget):
    _cls = 'radiobutton'
    _tclass = 'Radiobutton'
    _defaults = {'text': '', 'value': '', 'anchor': 'center', 'state': 'normal', 'indicatoron': 1, 'image': '',
                 'compound': 'none', 'foreground': 'SystemButtonText', 'background': 'SystemButtonFace',
                 'font': 'TkDefaultFont', 'padx': 1, 'pady': 1, 'width': 0, 'height': 0}

    def _init_widget(self, kw):
        if not any(_norm_key(k) == 'variable' for k in kw):
            kw['variable'] = _shared_radio_var()

    def _checked(self):
        var = self._vars.get('variable')
        if var is None:
            return False
        return str(var._value) == str(self.cget('value'))

    def _state_cfg(self, kw):
        out = Misc._state_cfg(self, kw) or {}
        out['checked'] = self._checked()
        var = self._vars.get('variable')
        out['group'] = str(var) if var is not None else ''
        return out

    def _var_changed(self, var):
        Misc._var_changed(self, var)
        if var is self._vars.get('variable'):
            _G.send({'op': 'cfg', 'id': self._w, 'o': {'checked': self._checked()}})

    def select(self):
        self._vars['variable']._set(self.cget('value'), None)

    def deselect(self):
        if self._checked():
            self._vars['variable']._set('', None)

    def invoke(self):
        self.select()
        if self._command:
            return self._command()

    def flash(self):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'toggle' and self.cget('state') != 'disabled':
            self._vars['variable']._set(self.cget('value'), None)
            if self._command:
                _G.call_handler(self._command)


_radio_var = [None]


def _shared_radio_var():
    if _radio_var[0] is None:
        _radio_var[0] = StringVar(value='')
    return _radio_var[0]


# ====================================================================== 입력 위젯
def _entry_index(idx, text):
    if isinstance(idx, int):
        return max(0, min(len(text), idx))
    s = str(idx)
    if s in ('end', 'insert', 'anchor', 'sel.last'):
        return len(text)
    if s == 'sel.first':
        return 0
    if s.lstrip('-').isdigit():
        return max(0, min(len(text), int(s)))
    return len(text)


class Entry(Widget):
    _cls = 'entry'
    _tclass = 'Entry'
    _defaults = {'width': 20, 'show': '', 'state': 'normal', 'justify': 'left', 'foreground': 'SystemWindowText',
                 'background': 'SystemWindow', 'font': 'TkTextFont', 'borderwidth': 1, 'relief': 'sunken'}

    def _init_widget(self, kw):
        self._value = ''

    def _state_cfg(self, kw):
        var = self._vars.get('textvariable')
        if var is not None and 'textvariable' in {_norm_key(k) for k in kw}:
            self._value = str(var.get())
            return {'value': self._value}
        return None

    def _var_changed(self, var):
        if var is self._vars.get('textvariable'):
            self._value = str(var.get())
            _G.send({'op': 'cfg', 'id': self._w, 'o': {'value': self._value}})

    def _set_value(self, v):
        self._value = v
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'value': v}})
        var = self._vars.get('textvariable')
        if var is not None:
            var._set(v, self)

    def get(self):
        return self._value

    def insert(self, index, string):
        t = self._value
        i = _entry_index(index, t)
        self._set_value(t[:i] + str(string) + t[i:])

    def delete(self, first, last=None):
        t = self._value
        a = _entry_index(first, t)
        b = a + 1 if last is None else _entry_index(last, t)
        self._set_value(t[:a] + t[b:])

    def icursor(self, index):
        pass

    def index(self, index):
        return _entry_index(index, self._value)

    def select_range(self, start, end):
        _G.send({'op': 'select', 'id': self._w})

    selection_range = select_range

    def selection_clear(self):
        pass

    select_clear = selection_clear

    def select_present(self):
        return False

    selection_present = select_present

    def xview(self, *a):
        pass

    def xview_moveto(self, f):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'value':
            self._value = e.get('v', '')
            var = self._vars.get('textvariable')
            if var is not None:
                var._set(self._value, self)


class Spinbox(Entry):
    _cls = 'spinbox'
    _tclass = 'Spinbox'
    _defaults = dict(Entry._defaults, **{'from': 0, 'to': 0, 'increment': 1, 'values': ''})

    def _init_widget(self, kw):
        Entry._init_widget(self, kw)
        vals = kw.get('values')
        if vals:
            self._value = str(list(vals)[0] if not isinstance(vals, str) else vals.split()[0])
        else:
            f = kw.get('from_', kw.get('from', 0))
            self._value = _fmt_num(f)
        kw['value'] = self._value

    def _handle_special(self, e):
        Entry._handle_special(self, e)
        if e.get('t') == 'spin' and self._command:
            _G.call_handler(self._command)


def _fmt_num(v):
    v = _num(v)
    return str(int(v)) if float(v).is_integer() else str(v)


def _text_pos(index, text):
    """Text 위젯 인덱스('1.0', 'end', 'end-1c', 'insert') → 문자 위치"""
    s = str(index).strip()
    lines = text.split('\n')
    m = _re.match(r'^([^+\-\s]+)\s*(.*)$', s)
    base, mods = (m.group(1), m.group(2)) if m else (s, '')
    if base in ('end', 'insert', 'current'):
        pos = len(text) + (1 if base == 'end' else 0)
    elif '.' in base:
        ln, col = base.split('.', 1)
        ln = max(1, int(ln))
        if ln > len(lines):
            pos = len(text) + 1
        else:
            start = sum(len(x) + 1 for x in lines[:ln - 1])
            col = len(lines[ln - 1]) if col == 'end' else int(col)
            pos = start + min(col, len(lines[ln - 1]))
    else:
        pos = len(text)
    for mm in _re.finditer(r'([+-])\s*(\d+)\s*(c|chars|l|lines)?|(linestart|lineend|wordstart|wordend)', mods):
        if mm.group(4):
            kind = mm.group(4)
            if kind == 'linestart':
                pos = text.rfind('\n', 0, pos) + 1
            elif kind == 'lineend':
                e = text.find('\n', pos)
                pos = len(text) if e < 0 else e
            continue
        n = int(mm.group(2)) * (1 if mm.group(1) == '+' else -1)
        if mm.group(3) in ('l', 'lines'):
            col = pos - (text.rfind('\n', 0, pos) + 1)
            ln = text.count('\n', 0, pos) + n
            ln = max(0, min(len(lines) - 1, ln))
            start = sum(len(x) + 1 for x in lines[:ln])
            pos = start + min(col, len(lines[ln]))
        else:
            pos += n
    return max(0, min(len(text) + 1, pos))


class Text(Widget):
    _cls = 'text'
    _tclass = 'Text'
    _defaults = {'width': 80, 'height': 24, 'wrap': 'char', 'state': 'normal', 'font': 'TkFixedFont',
                 'foreground': 'SystemWindowText', 'background': 'SystemWindow', 'borderwidth': 1, 'relief': 'sunken'}

    def _init_widget(self, kw):
        self._value = ''

    def _set_value(self, v):
        self._value = v
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'value': v}})

    def get(self, index1, index2=None):
        t = self._value
        a = _text_pos(index1, t)
        b = a + 1 if index2 is None else _text_pos(index2, t)
        full = t + '\n'
        return full[a:b]

    def insert(self, index, chars, *args):
        t = self._value
        i = min(len(t), _text_pos(index, t))
        self._set_value(t[:i] + str(chars) + t[i:])

    def delete(self, index1, index2=None):
        t = self._value
        a = min(len(t), _text_pos(index1, t))
        b = a + 1 if index2 is None else min(len(t), _text_pos(index2, t))
        self._set_value(t[:a] + t[b:])

    def replace(self, index1, index2, chars, *args):
        self.delete(index1, index2)
        self.insert(index1, chars)

    def index(self, index):
        t = self._value
        p = min(_text_pos(index, t), len(t) + (1 if str(index).startswith('end') else 0))
        ln = t.count('\n', 0, min(p, len(t))) + 1
        col = p - (t.rfind('\n', 0, min(p, len(t))) + 1)
        return '%d.%d' % (ln, col)

    def see(self, index):
        _G.send({'op': 'see', 'id': self._w})

    def mark_set(self, name, index):
        pass

    def mark_unset(self, *names):
        pass

    def tag_add(self, tagName, index1, *args):
        pass

    def tag_remove(self, tagName, index1, index2=None):
        pass

    def tag_config(self, tagName, cnf=None, **kw):
        pass

    tag_configure = tag_config

    def tag_bind(self, tagName, sequence, func, add=None):
        pass

    def edit_undo(self):
        pass

    def edit_redo(self):
        pass

    def edit_reset(self):
        pass

    def search(self, pattern, index, stopindex=None, **kw):
        t = self._value
        i = t.find(pattern, _text_pos(index, t))
        return '' if i < 0 else self.index(i)

    def xview(self, *a):
        pass

    def yview(self, *a):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'value':
            self._value = e.get('v', '')


class Listbox(Widget):
    _cls = 'listbox'
    _tclass = 'Listbox'
    _defaults = {'height': 10, 'width': 20, 'selectmode': 'browse', 'font': 'TkDefaultFont',
                 'foreground': 'SystemWindowText', 'background': 'SystemWindow', 'borderwidth': 1, 'relief': 'sunken',
                 'activestyle': 'dotbox', 'selectbackground': 'SystemHighlight', 'selectforeground': 'SystemHighlightText'}

    def _init_widget(self, kw):
        self._items = []
        self._sel = []

    def _push(self):
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'items': [str(x) for x in self._items], 'sel': list(self._sel)}})

    def _idx(self, i):
        if isinstance(i, int):
            return i
        s = str(i)
        if s == 'end':
            return len(self._items)
        if s in ('active', 'anchor'):
            return self._sel[0] if self._sel else 0
        if s.startswith('@'):
            return 0
        return int(s)

    def insert(self, index, *elements):
        i = self._idx(index)
        i = max(0, min(len(self._items), i))
        for k, e in enumerate(elements):
            self._items.insert(i + k, e)
        self._sel = [s + len(elements) if s >= i else s for s in self._sel]
        self._push()

    def delete(self, first, last=None):
        a = self._idx(first)
        b = a if last is None else min(len(self._items) - 1, self._idx(last) if str(last) != 'end' else len(self._items) - 1)
        if a < 0 or a >= len(self._items):
            return
        del self._items[a:b + 1]
        n = b - a + 1
        self._sel = [s - n if s > b else s for s in self._sel if not (a <= s <= b)]
        self._push()

    def get(self, first, last=None):
        if last is None:
            i = self._idx(first)
            return self._items[i] if 0 <= i < len(self._items) else ''
        a = self._idx(first)
        b = len(self._items) - 1 if str(last) == 'end' else self._idx(last)
        return tuple(self._items[a:b + 1])

    def size(self):
        return len(self._items)

    def curselection(self):
        return tuple(sorted(self._sel))

    def selection_set(self, first, last=None):
        a = self._idx(first)
        b = a if last is None else (len(self._items) - 1 if str(last) == 'end' else self._idx(last))
        if self.cget('selectmode') in ('browse', 'single'):
            self._sel = [a]
        else:
            self._sel = sorted(set(self._sel) | set(range(a, b + 1)))
        self._push()

    select_set = selection_set

    def selection_clear(self, first, last=None):
        a = self._idx(first)
        b = a if last is None else (len(self._items) - 1 if str(last) == 'end' else self._idx(last))
        self._sel = [s for s in self._sel if not (a <= s <= b)]
        self._push()

    select_clear = selection_clear

    def selection_includes(self, index):
        return self._idx(index) in self._sel

    select_includes = selection_includes

    def activate(self, index):
        pass

    def see(self, index):
        pass

    def index(self, index):
        return self._idx(index)

    def nearest(self, y):
        return 0

    def itemconfig(self, index, cnf=None, **kw):
        pass

    itemconfigure = itemconfig

    def xview(self, *a):
        pass

    def yview(self, *a):
        pass

    def _handle_special(self, e):
        if e.get('t') == 'select':
            self._sel = list(e.get('sel', []))
            ev = Event()
            ev._tname = 'Virtual'
            ev._detail = 'ListboxSelect'
            ev.type = EventType('VirtualEvent')
            self._fire(ev)


class Scale(Widget):
    _cls = 'scale'
    _tclass = 'Scale'
    _defaults = {'from': 0, 'to': 100, 'orient': 'vertical', 'resolution': 1, 'length': 100, 'showvalue': 1,
                 'label': '', 'tickinterval': 0, 'width': 15, 'sliderlength': 30, 'state': 'normal',
                 'digits': 0, 'bigincrement': 0, 'font': 'TkDefaultFont'}

    def _init_widget(self, kw):
        self._value = _num(kw.get('from_', kw.get('from', 0)))

    def _state_cfg(self, kw):
        var = self._vars.get('variable')
        if var is not None and 'variable' in {_norm_key(k) for k in kw}:
            try:
                self._value = _num(var.get())
            except Exception:
                pass
        return {'value': self._value}

    def _var_changed(self, var):
        if var is self._vars.get('variable'):
            self._value = _num(var.get())
            _G.send({'op': 'cfg', 'id': self._w, 'o': {'value': self._value}})

    def _res(self, v):
        r = _num(self.cget('resolution'), 1)
        if r > 0:
            v = round(v / r) * r
        return v

    def get(self):
        v = self._res(self._value)
        r = _num(self.cget('resolution'), 1)
        return int(v) if r >= 1 and float(r).is_integer() else float(v)

    def set(self, value):
        self._value = self._res(_num(value))
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'value': self._value}})
        var = self._vars.get('variable')
        if var is not None:
            var._set(self.get(), self)

    def coords(self, value=None):
        return (0, 0)

    def _handle_special(self, e):
        if e.get('t') == 'value':
            self._value = _num(e.get('v'))
            var = self._vars.get('variable')
            if var is not None:
                var._set(self.get(), self)
            if self._command:
                _G.call_handler(self._command, str(self.get()))


class Scrollbar(Widget):
    _cls = 'scrollbar'
    _tclass = 'Scrollbar'
    _defaults = {'orient': 'vertical', 'width': 16}

    def set(self, first, last):
        pass

    def get(self):
        return (0.0, 1.0)


class OptionMenu(Widget):
    _cls = 'optionmenu'
    _tclass = 'Menubutton'

    def __init__(self, master, variable, value, *values, **kwargs):
        self._opt_values = [value] + list(values)
        self._opt_cmd = kwargs.pop('command', None)
        Widget.__init__(self, master, variable=variable, **kwargs)
        if variable is not None and variable.get() in ('', None):
            variable._set(value, None)
        self._push()

    def _push(self):
        var = self._vars.get('variable')
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'items': [str(v) for v in self._opt_values], 'value': str(var.get()) if var else ''}})

    def _var_changed(self, var):
        self._push()

    def _handle_special(self, e):
        if e.get('t') == 'value':
            i = e.get('i', 0)
            v = self._opt_values[i] if 0 <= i < len(self._opt_values) else e.get('v')
            var = self._vars.get('variable')
            if var is not None:
                var._set(v, self)
            if self._opt_cmd:
                _G.call_handler(self._opt_cmd, v)

    def __getitem__(self, name):
        if name == 'menu':
            return _OptionMenuMenu(self)
        return Widget.__getitem__(self, name)


class _OptionMenuMenu:
    def __init__(self, om):
        self.om = om

    def delete(self, a, b=None):
        self.om._opt_values = []
        self.om._push()

    def add_command(self, label=None, command=None, **kw):
        self.om._opt_values.append(label)
        self.om._push()


# ====================================================================== 메뉴
class Menu(Widget):
    _cls = 'menu'
    _tclass = 'Menu'
    _defaults = {'tearoff': 1}

    def _init_widget(self, kw):
        self._entries = []
        _menus[self._w] = self

    def _tree(self, depth=0):
        out = []
        for i, e in enumerate(self._entries):
            k = e['kind']
            d = {'k': k, 'l': str(e.get('label', '')), 'i': i, 'm': self._w}
            if e.get('accelerator'):
                d['acc'] = e['accelerator']
            if e.get('state') == 'disabled':
                d['dis'] = True
            if k == 'cascade' and isinstance(e.get('menu'), Menu) and depth < 8:
                d['sub'] = e['menu']._tree(depth + 1)
            if k == 'checkbutton':
                var = e.get('variable')
                d['on'] = var is not None and str(var._value) == str(e.get('onvalue', 1))
            if k == 'radiobutton':
                var = e.get('variable')
                d['on'] = var is not None and str(var._value) == str(e.get('value', e.get('label')))
            out.append(d)
        return out

    def _changed(self):
        for win in list(_G._windows.values()):
            if isinstance(win, Wm) and isinstance(win._cfg.get('menu'), Menu):
                win._send_menubar()

    def add(self, itemType, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        kw['kind'] = itemType
        if itemType in ('checkbutton',) and 'variable' not in kw:
            kw['variable'] = IntVar(value=0)
        for k in ('variable',):
            if isinstance(kw.get(k), Variable):
                kw[k]._link(self)
        self._entries.append(kw)
        self._changed()

    def add_cascade(self, cnf={}, **kw):
        self.add('cascade', cnf, **kw)

    def add_command(self, cnf={}, **kw):
        self.add('command', cnf, **kw)

    def add_checkbutton(self, cnf={}, **kw):
        self.add('checkbutton', cnf, **kw)

    def add_radiobutton(self, cnf={}, **kw):
        self.add('radiobutton', cnf, **kw)

    def add_separator(self, cnf={}, **kw):
        self.add('separator', cnf, **kw)

    def insert(self, index, itemType, cnf={}, **kw):
        kw = _cnfmerge(cnf, kw)
        kw['kind'] = itemType
        self._entries.insert(self._index(index), kw)
        self._changed()

    def insert_command(self, index, cnf={}, **kw):
        self.insert(index, 'command', cnf, **kw)

    def insert_separator(self, index, cnf={}, **kw):
        self.insert(index, 'separator', cnf, **kw)

    def insert_cascade(self, index, cnf={}, **kw):
        self.insert(index, 'cascade', cnf, **kw)

    def _index(self, index):
        if isinstance(index, int):
            return index
        s = str(index)
        if s in ('end', 'last'):
            return len(self._entries) - 1
        if s.isdigit():
            return int(s)
        for i, e in enumerate(self._entries):
            if str(e.get('label')) == s:
                return i
        return len(self._entries) - 1

    def index(self, index):
        return self._index(index)

    def delete(self, index1, index2=None):
        a = self._index(index1)
        b = a if index2 is None else self._index(index2)
        del self._entries[a:b + 1]
        self._changed()

    def entryconfigure(self, index, cnf=None, **kw):
        self._entries[self._index(index)].update(_cnfmerge(cnf, kw))
        self._changed()

    entryconfig = entryconfigure

    def entrycget(self, index, option):
        return self._entries[self._index(index)].get(option, '')

    def type(self, index):
        return self._entries[self._index(index)]['kind']

    def invoke(self, index):
        e = self._entries[self._index(index)]
        k = e['kind']
        var = e.get('variable')
        if k == 'checkbutton' and var is not None:
            on, off = e.get('onvalue', 1), e.get('offvalue', 0)
            var._set(off if str(var._value) == str(on) else on, None)
        if k == 'radiobutton' and var is not None:
            var._set(e.get('value', e.get('label')), None)
        cmd = e.get('command')
        if cmd:
            return _G.call_handler(cmd)

    def post(self, x, y):
        _G.send({'op': 'popup', 'id': self.winfo_toplevel()._w, 'tree': self._tree(), 'x': x, 'y': y})

    def tk_popup(self, x, y, entry=''):
        self.post(x, y)

    def unpost(self):
        pass

    def _var_changed(self, var):
        self._changed()

    def _handle_special(self, e):
        if e.get('t') == 'menu':
            i = e.get('i', 0)
            if 0 <= i < len(self._entries):
                self.invoke(i)
                self._changed()

    def _on_destroy(self):
        _menus.pop(self._w, None)


# ====================================================================== 이미지
class Image:
    def __init__(self, imgtype='photo', name=None, cnf={}, master=None, **kw):
        self._id = name or _G.new_id('pyimage')
        self.name = self._id
        _images[self._id] = self
        self._w_ = 0
        self._h_ = 0

    def __str__(self):
        return self._id

    def __del__(self):
        pass

    def width(self):
        return int(self._w_)

    def height(self):
        return int(self._h_)

    def type(self):
        return 'photo'

    def configure(self, **kw):
        pass

    config = configure

    def cget(self, key):
        return getattr(self, '_' + key, '')

    __getitem__ = cget


def _parse_color_rgb(c):
    c = _G.color(c) or '#000000'
    if c.startswith('#'):
        h = c[1:]
        if len(h) == 3:
            return tuple(int(x * 2, 16) for x in h)
        if len(h) >= 6:
            return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return _NAMED.get(c, (0, 0, 0))


_NAMED = {'black': (0, 0, 0), 'white': (255, 255, 255), 'red': (255, 0, 0), 'green': (0, 128, 0), 'lime': (0, 255, 0),
          'blue': (0, 0, 255), 'yellow': (255, 255, 0), 'cyan': (0, 255, 255), 'magenta': (255, 0, 255),
          'gray': (128, 128, 128), 'grey': (128, 128, 128), 'orange': (255, 165, 0), 'purple': (128, 0, 128),
          'pink': (255, 192, 203), 'brown': (165, 42, 42)}


class PhotoImage(Image):
    def __init__(self, name=None, cnf={}, master=None, **kw):
        Image.__init__(self, 'photo', name)
        kw = _cnfmerge(cnf, kw)
        self._pix = None
        self._kind = None
        self._file = kw.get('file')
        self._load(kw)

    def _load(self, kw):
        f = kw.get('file')
        data = kw.get('data')
        if f:
            p = str(f)
            if not _os.path.exists(p):
                raise TclError('couldn\'t open "%s": no such file or directory' % p)
            with open(p, 'rb') as fp:
                raw = fp.read()
            self._set_bytes(raw)
        elif data:
            raw = data
            if isinstance(data, str):
                try:
                    raw = _b64.b64decode(data)
                except Exception:
                    raise TclError("couldn't recognize image data")
            self._set_bytes(bytes(raw))
        else:
            self._w_ = _int(kw.get('width', 0))
            self._h_ = _int(kw.get('height', 0))
            self._kind = 'pix'
            self._pix = bytearray(self._w_ * self._h_ * 4)
            _G.mark_dirty(self)

    def _set_bytes(self, raw):
        w, h, mime = _G.image_size(raw)
        if mime in ('image/x-portable-pixmap',):
            self._from_ppm(raw)
            return
        if w == 0 and h == 0 and mime == 'application/octet-stream':
            raise TclError("couldn't recognize data in image file")
        self._w_, self._h_ = w, h
        self._kind = 'file'
        self._raw = raw
        _G.send_bin(self._id, 'file', raw, {'mime': mime, 'w': w, 'h': h})

    def _from_ppm(self, raw):
        toks = raw.split(None, 4)
        w, h, mx = int(toks[1]), int(toks[2]), int(toks[3])
        body = toks[4]
        self._w_, self._h_ = w, h
        self._kind = 'pix'
        self._pix = bytearray(w * h * 4)
        gray = toks[0] == b'P5'
        for i in range(w * h):
            if gray:
                v = body[i] * 255 // max(1, mx)
                r = g = b = v
            else:
                r, g, b = body[i * 3], body[i * 3 + 1], body[i * 3 + 2]
            self._pix[i * 4:i * 4 + 4] = bytes((r, g, b, 255))
        _G.mark_dirty(self)

    def _ensure_pix(self):
        if self._pix is not None:
            return
        # 파일 이미지의 픽셀이 필요하면 Pillow 로 디코드 (없으면 투명)
        w, h = self._w_, self._h_
        self._pix = bytearray(w * h * 4)
        try:
            from PIL import Image as _PI
            import io
            im = _PI.open(io.BytesIO(self._raw)).convert('RGBA')
            self._pix = bytearray(im.tobytes())
        except Exception:
            pass
        self._kind = 'pix'

    def _upload(self):
        if self._pix is not None and self._kind == 'pix':
            _G.send_bin(self._id, 'rgba', self._pix, {'w': self._w_, 'h': self._h_})

    def blank(self):
        self._pix = bytearray(self._w_ * self._h_ * 4)
        self._kind = 'pix'
        _G.mark_dirty(self)

    def put(self, data, to=None):
        self._ensure_pix()
        w, h = self._w_, self._h_
        if isinstance(data, str) and not data.strip().startswith('{') and len(data.split()) == 1:
            rows = [[data.strip()]]
        elif isinstance(data, str):
            rows = [r.split() for r in _re.findall(r'\{([^}]*)\}', data)] or [data.split()]
        else:
            rows = [list(r) if isinstance(r, (tuple, list)) else [r] for r in data]
        x0, y0 = 0, 0
        x1 = y1 = None
        if to is not None:
            t = list(to)
            x0, y0 = int(t[0]), int(t[1])
            if len(t) >= 4:
                x1, y1 = int(t[2]), int(t[3])
        pix = self._pix
        rh = len(rows)
        rw = max(len(r) for r in rows) if rows else 0
        if x1 is None:
            x1, y1 = x0 + rw, y0 + rh
        cache = {}
        # 크기가 없으면 자동으로 늘린다 (tk 와 같음)
        if (x1 > w or y1 > h) and (w == 0 or h == 0 or x1 > w or y1 > h):
            nw, nh = max(w, x1), max(h, y1)
            np_ = bytearray(nw * nh * 4)
            for yy in range(h):
                np_[yy * nw * 4:yy * nw * 4 + w * 4] = pix[yy * w * 4:(yy + 1) * w * 4]
            self._pix = pix = np_
            self._w_, self._h_ = w, h = nw, nh
        for yy in range(y0, y1):
            row = rows[(yy - y0) % rh]
            for xx in range(x0, x1):
                c = row[(xx - x0) % len(row)]
                rgb = cache.get(c)
                if rgb is None:
                    rgb = cache[c] = bytes(_parse_color_rgb(c)) + b'\xff'
                if 0 <= xx < w and 0 <= yy < h:
                    i = (yy * w + xx) * 4
                    pix[i:i + 4] = rgb
        _G.mark_dirty(self)

    def get(self, x, y):
        self._ensure_pix()
        i = (int(y) * self._w_ + int(x)) * 4
        return tuple(self._pix[i:i + 3])

    def transparency_get(self, x, y):
        self._ensure_pix()
        return self._pix[(int(y) * self._w_ + int(x)) * 4 + 3] == 0

    def transparency_set(self, x, y, boolean):
        self._ensure_pix()
        self._pix[(int(y) * self._w_ + int(x)) * 4 + 3] = 0 if boolean else 255
        _G.mark_dirty(self)

    def _derived(self, fx, fy, sx, sy):
        img = PhotoImage.__new__(PhotoImage)
        Image.__init__(img, 'photo', None)
        img._kind = 'derived'
        img._pix = None
        img._file = None
        img._raw = getattr(self, '_raw', b'')
        img._w_ = int(self._w_ * fx // sx)
        img._h_ = int(self._h_ * fy // sy)
        if self._pix is not None and self._kind == 'pix':
            src, w, h = self._pix, self._w_, self._h_
            nw, nh = img._w_, img._h_
            out = bytearray(nw * nh * 4)
            for yy in range(nh):
                sy_ = min(h - 1, yy * sy // fy)
                for xx in range(nw):
                    sx_ = min(w - 1, xx * sx // fx)
                    i = (sy_ * w + sx_) * 4
                    j = (yy * nw + xx) * 4
                    out[j:j + 4] = src[i:i + 4]
            img._pix = out
            img._kind = 'pix'
            _G.mark_dirty(img)
        else:
            _G.send({'op': 'imgd', 'id': img._id, 'src': self._id, 'w': img._w_, 'h': img._h_})
        return img

    def copy(self):
        return self._derived(1, 1, 1, 1)

    def zoom(self, x, y=''):
        y = x if y in ('', None) else y
        return self._derived(int(x), int(y), 1, 1)

    def subsample(self, x, y=''):
        y = x if y in ('', None) else y
        return self._derived(1, 1, int(x), int(y))

    def write(self, filename, format=None, from_coords=None):
        self._ensure_pix()
        with open(filename, 'wb') as fp:
            fp.write(_png_bytes(self._pix, self._w_, self._h_))

    def configure(self, **kw):
        if 'file' in kw or 'data' in kw:
            self._load(kw)
            _G.send({'op': 'imgref', 'id': self._id})
        if 'width' in kw or 'height' in kw:
            self._w_ = _int(kw.get('width', self._w_))
            self._h_ = _int(kw.get('height', self._h_))

    config = configure

    def cget(self, key):
        if key == 'width':
            return self._w_
        if key == 'height':
            return self._h_
        if key == 'file':
            return self._file or ''
        return ''

    __getitem__ = cget


def _png_bytes(rgba, w, h):
    import zlib
    import struct
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw.extend(rgba[y * w * 4:(y + 1) * w * 4])

    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(bytes(raw), 6)) + chunk(b'IEND', b''))


class BitmapImage(Image):
    def __init__(self, name=None, cnf={}, master=None, **kw):
        Image.__init__(self, 'bitmap', name)
        self._w_ = self._h_ = 16


def image_names():
    return tuple(_images)


def image_types():
    return ('photo', 'bitmap')


# ====================================================================== 캔버스
_ITEM_COLOR_KEYS = {'fill', 'outline', 'activefill', 'activeoutline', 'disabledfill', 'disabledoutline'}


def _flat_coords(args):
    out = []

    def add(a):
        if isinstance(a, (tuple, list)):
            for x in a:
                add(x)
        else:
            out.append(float(a))
    add(args)
    return out


def _text_extent(text, font):
    px = _G.font_px(font)
    lines = str(text).split('\n')
    w = 0
    for ln in lines:
        lw = 0
        for ch in ln:
            lw += px * (1.0 if ord(ch) > 0x2E80 else 0.58)
        w = max(w, lw)
    return w, len(lines) * px * 1.25


class _Item:
    __slots__ = ('n', 't', 'c', 'o', 'tags')

    def __init__(self, n, t, c, o, tags):
        self.n, self.t, self.c, self.o, self.tags = n, t, c, o, tags


class Canvas(Widget):
    _cls = 'canvas'
    _tclass = 'Canvas'
    _defaults = {'width': 378, 'height': 265, 'background': 'SystemButtonFace', 'borderwidth': 0,
                 'highlightthickness': 2, 'relief': 'flat', 'scrollregion': '', 'confine': 1}

    def _init_widget(self, kw):
        self._items = {}
        self._order = []
        self._next = 1
        self._tagbind = {}
        self._current = None
        self._pressed = None

    def _req_size(self):
        return (_int(self.cget('width'), 378), _int(self.cget('height'), 265))

    # ------------------------------------------------------------ 항목 만들기
    def _create(self, t, args, kw):
        coords = _flat_coords(args)
        n = self._next
        self._next += 1
        tags = kw.pop('tags', kw.pop('tag', ()))
        if isinstance(tags, str):
            tags = tags.split()
        tags = [str(x) for x in (tags or ())]
        o = {}
        for k, v in kw.items():
            o[k.lstrip('-')] = v
        item = _Item(n, t, coords, o, tags)
        self._items[n] = item
        self._order.append(n)
        _G.send({'op': 'ci', 'id': self._w, 'n': n, 't': t, 'c': coords, 'o': self._ser_opts(o)})
        return n

    def _ser_opts(self, o):
        out = {}
        for k, v in o.items():
            if k in _ITEM_COLOR_KEYS:
                out[k] = _G.color(v)
            elif k == 'font':
                out[k] = _G.font_css(v)
            elif k == 'image':
                img = _image_of(v)
                out[k] = img._id if img else ''
            elif k == 'window':
                out[k] = v._w if isinstance(v, Misc) else str(v)
            elif isinstance(v, (int, float, str, bool)) or v is None:
                out[k] = v
            elif isinstance(v, (tuple, list)):
                out[k] = [x if isinstance(x, (int, float, str)) else str(x) for x in v]
            else:
                out[k] = str(v)
        return out

    def create_line(self, *args, **kw):
        return self._create('line', args, kw)

    def create_rectangle(self, *args, **kw):
        return self._create('rectangle', args, kw)

    def create_oval(self, *args, **kw):
        return self._create('oval', args, kw)

    def create_arc(self, *args, **kw):
        return self._create('arc', args, kw)

    def create_polygon(self, *args, **kw):
        return self._create('polygon', args, kw)

    def create_text(self, *args, **kw):
        return self._create('text', args, kw)

    def create_image(self, *args, **kw):
        return self._create('image', args, kw)

    def create_bitmap(self, *args, **kw):
        return self._create('rectangle', args[:2] * 2, {})

    def create_window(self, *args, **kw):
        n = self._create('window', args, dict(kw))
        return n

    # ------------------------------------------------------------ 항목 찾기
    def _find(self, tagOrId):
        if tagOrId is None:
            return []
        if isinstance(tagOrId, int) or (isinstance(tagOrId, str) and tagOrId.isdigit()):
            n = int(tagOrId)
            return [n] if n in self._items else []
        s = str(tagOrId)
        if s == 'all':
            return list(self._order)
        if s == 'current':
            return [self._current] if self._current in self._items else []
        return [n for n in self._order if s in self._items[n].tags]

    def find_all(self):
        return tuple(self._order)

    def find_withtag(self, tagOrId):
        return tuple(self._find(tagOrId))

    def _bbox_item(self, it):
        c = it.c
        o = it.o
        if it.t in ('text',):
            if not c:
                return None
            w, h = _text_extent(o.get('text', ''), o.get('font'))
            return self._anchor_box(c[0], c[1], w, h, o.get('anchor', 'center'))
        if it.t in ('image', 'window'):
            img = _image_of(o.get('image'))
            w, h = (img.width(), img.height()) if img else (_num(o.get('width', 0)), _num(o.get('height', 0)))
            return self._anchor_box(c[0], c[1], w, h, o.get('anchor', 'center'))
        if len(c) < 2:
            return None
        xs, ys = c[0::2], c[1::2]
        pad = _num(o.get('width', 1), 1) / 2.0
        return (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)

    @staticmethod
    def _anchor_box(x, y, w, h, anchor):
        a = str(anchor)
        if a == 'center':
            a = ''
        if 'w' in a:
            x0 = x
        elif 'e' in a:
            x0 = x - w
        else:
            x0 = x - w / 2
        if a.startswith('n'):
            y0 = y
        elif a.startswith('s'):
            y0 = y - h
        else:
            y0 = y - h / 2
        return (x0, y0, x0 + w, y0 + h)

    def bbox(self, *args):
        boxes = [self._bbox_item(self._items[n]) for a in args for n in self._find(a)]
        boxes = [b for b in boxes if b]
        if not boxes:
            return None
        return (int(min(b[0] for b in boxes)) - 1, int(min(b[1] for b in boxes)) - 1,
                int(max(b[2] for b in boxes)) + 1, int(max(b[3] for b in boxes)) + 1)

    def find_overlapping(self, x1, y1, x2, y2):
        out = []
        for n in self._order:
            it = self._items[n]
            if it.o.get('state') == 'hidden':
                continue
            b = self._bbox_item(it)
            if b and b[0] <= x2 and b[2] >= x1 and b[1] <= y2 and b[3] >= y1:
                out.append(n)
        return tuple(out)

    def find_enclosed(self, x1, y1, x2, y2):
        out = []
        for n in self._order:
            b = self._bbox_item(self._items[n])
            if b and b[0] >= x1 and b[2] <= x2 and b[1] >= y1 and b[3] <= y2:
                out.append(n)
        return tuple(out)

    def find_closest(self, x, y, halo=None, start=None):
        best, bd = None, None
        for n in self._order:
            b = self._bbox_item(self._items[n])
            if not b:
                continue
            dx = max(b[0] - x, 0, x - b[2])
            dy = max(b[1] - y, 0, y - b[3])
            d = dx * dx + dy * dy
            if bd is None or d <= bd:
                best, bd = n, d
        return (best,) if best is not None else ()

    def find_above(self, tagOrId):
        ids = self._find(tagOrId)
        if not ids:
            return ()
        i = self._order.index(ids[-1])
        return (self._order[i + 1],) if i + 1 < len(self._order) else ()

    def find_below(self, tagOrId):
        ids = self._find(tagOrId)
        if not ids:
            return ()
        i = self._order.index(ids[0])
        return (self._order[i - 1],) if i > 0 else ()

    def _hit(self, x, y):
        for n in reversed(self._order):
            it = self._items[n]
            if it.o.get('state') == 'hidden':
                continue
            if it.t == 'line':
                c = it.c
                tol = max(_num(it.o.get('width', 1), 1) / 2.0, 1) + 2
                for i in range(0, len(c) - 3, 2):
                    if _seg_dist(x, y, c[i], c[i + 1], c[i + 2], c[i + 3]) <= tol:
                        return n
                continue
            b = self._bbox_item(it)
            if b and b[0] <= x <= b[2] and b[1] <= y <= b[3]:
                if it.t == 'oval':
                    cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
                    rx, ry = max(1, (b[2] - b[0]) / 2), max(1, (b[3] - b[1]) / 2)
                    if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1.05:
                        continue
                if it.t == 'polygon' and len(it.c) >= 6 and not _in_poly(x, y, it.c):
                    continue
                return n
        return None

    # ------------------------------------------------------------ 항목 바꾸기
    def coords(self, tagOrId, *args):
        ids = self._find(tagOrId)
        if not args:
            return [float(v) for v in self._items[ids[0]].c] if ids else []
        c = _flat_coords(args)
        for n in ids[:1]:
            self._items[n].c = c
            _G.send({'op': 'cc', 'id': self._w, 'n': n, 'c': c})

    def move(self, tagOrId, xAmount, yAmount):
        dx, dy = float(xAmount), float(yAmount)
        for n in self._find(tagOrId):
            it = self._items[n]
            it.c = [v + (dx if i % 2 == 0 else dy) for i, v in enumerate(it.c)]
            _G.send({'op': 'cc', 'id': self._w, 'n': n, 'c': it.c})

    def moveto(self, tagOrId, x='', y=''):
        ids = self._find(tagOrId)
        b = self.bbox(*ids) if ids else None
        if not b:
            return
        dx = 0 if x == '' else float(x) - b[0] - 1
        dy = 0 if y == '' else float(y) - b[1] - 1
        self.move(tagOrId, dx, dy)

    def scale(self, tagOrId, xOrigin, yOrigin, xScale, yScale):
        for n in self._find(tagOrId):
            it = self._items[n]
            it.c = [(float(xOrigin) + (v - float(xOrigin)) * float(xScale)) if i % 2 == 0 else
                    (float(yOrigin) + (v - float(yOrigin)) * float(yScale)) for i, v in enumerate(it.c)]
            _G.send({'op': 'cc', 'id': self._w, 'n': n, 'c': it.c})

    def delete(self, *args):
        gone = []
        for a in args:
            for n in self._find(a):
                if n in self._items:
                    del self._items[n]
                    self._order.remove(n)
                    gone.append(n)
        if gone:
            _G.send({'op': 'cd', 'id': self._w, 'n': gone})

    def itemconfigure(self, tagOrId, cnf=None, **kw):
        kw = _cnfmerge(cnf, kw)
        ids = self._find(tagOrId)
        if not kw:
            return {k: (k, '', '', '', v) for k, v in (self._items[ids[0]].o.items() if ids else [])}
        tags = kw.pop('tags', kw.pop('tag', None))
        o = {k.lstrip('-'): v for k, v in kw.items()}
        for n in ids:
            it = self._items[n]
            it.o.update(o)
            if tags is not None:
                it.tags = tags.split() if isinstance(tags, str) else [str(t) for t in tags]
            if o:
                _G.send({'op': 'co', 'id': self._w, 'n': n, 'o': self._ser_opts(o)})

    itemconfig = itemconfigure

    def itemcget(self, tagOrId, option):
        ids = self._find(tagOrId)
        if not ids:
            return ''
        it = self._items[ids[0]]
        if option == 'tags':
            return ' '.join(it.tags)
        return it.o.get(option, '')

    def type(self, tagOrId):
        ids = self._find(tagOrId)
        return self._items[ids[0]].t if ids else None

    def gettags(self, tagOrId):
        ids = self._find(tagOrId)
        return tuple(self._items[ids[0]].tags + (['current'] if ids[0] == self._current else [])) if ids else ()

    def addtag_withtag(self, newtag, tagOrId):
        for n in self._find(tagOrId):
            if newtag not in self._items[n].tags:
                self._items[n].tags.append(newtag)

    def addtag_all(self, newtag):
        self.addtag_withtag(newtag, 'all')

    def addtag_closest(self, newtag, x, y, halo=None, start=None):
        for n in self.find_closest(x, y):
            self.addtag_withtag(newtag, n)

    def addtag_overlapping(self, newtag, x1, y1, x2, y2):
        for n in self.find_overlapping(x1, y1, x2, y2):
            self.addtag_withtag(newtag, n)

    def dtag(self, tagOrId, tagToDelete=None):
        t = tagToDelete if tagToDelete is not None else tagOrId
        for n in self._find(tagOrId):
            if t in self._items[n].tags:
                self._items[n].tags.remove(t)

    def _send_order(self):
        _G.send({'op': 'cz', 'id': self._w, 'order': self._order})

    def tag_raise(self, tagOrId, aboveThis=None):
        ids = self._find(tagOrId)
        rest = [n for n in self._order if n not in ids]
        if aboveThis is not None:
            ref = self._find(aboveThis)
            pos = max(rest.index(r) for r in ref if r in rest) + 1 if ref else len(rest)
        else:
            pos = len(rest)
        self._order = rest[:pos] + ids + rest[pos:]
        self._send_order()

    def tag_lower(self, tagOrId, belowThis=None):
        ids = self._find(tagOrId)
        rest = [n for n in self._order if n not in ids]
        if belowThis is not None:
            ref = self._find(belowThis)
            pos = min(rest.index(r) for r in ref if r in rest) if ref else 0
        else:
            pos = 0
        self._order = rest[:pos] + ids + rest[pos:]
        self._send_order()

    def lift(self, tagOrId=None, aboveThis=None):
        if tagOrId is None:
            return Misc.lift(self)
        self.tag_raise(tagOrId, aboveThis)

    tkraise = lift

    def lower(self, tagOrId=None, belowThis=None):
        if tagOrId is None:
            return Misc.lower(self)
        self.tag_lower(tagOrId, belowThis)

    def tag_bind(self, tagOrId, sequence=None, func=None, add=None):
        table = self._tagbind.setdefault(str(tagOrId), {})
        r = self._bind(table, sequence, func, add)
        return r

    def tag_unbind(self, tagOrId, sequence, funcid=None):
        self._tagbind.get(str(tagOrId), {}).pop(_parse_seq(sequence), None)
        self._send_wants()

    def _wants(self):
        s = set(Misc._wants(self))
        for table in self._tagbind.values():
            for k in table:
                if k[0] in _WANT:
                    s.add(_WANT[k[0]])
                if k[0] in ('Enter', 'Leave'):
                    s.add('Motion')
                if k[0] == 'Motion':
                    s.update(('Button', 'ButtonRelease'))
        if self._tagbind:
            s.update(('Button', 'ButtonRelease', 'Motion'))
        return sorted(s)

    def canvasx(self, screenx, gridspacing=None):
        return float(screenx)

    def canvasy(self, screeny, gridspacing=None):
        return float(screeny)

    def xview(self, *a):
        pass

    def yview(self, *a):
        pass

    def xview_moveto(self, f):
        pass

    def yview_moveto(self, f):
        pass

    def postscript(self, cnf={}, **kw):
        return ''

    def focus(self, *args):
        if args:
            return None
        return Misc.focus_set(self)

    def select_clear(self):
        pass

    def _fire_items(self, n, ev):
        if n is None or n not in self._items:
            return None
        it = self._items[n]
        for tag in list(it.tags) + ['all', str(n)]:
            table = self._tagbind.get(tag)
            if table:
                funcs = _best(table, ev)
                if funcs and _call_funcs(funcs, ev) == 'break':
                    return 'break'
        return None

    def _handle_generic(self, ev):
        if self._tagbind:
            t = ev._tname
            held = isinstance(ev.state, int) and ev.state & (256 | 512 | 1024)
            if t in ('Motion', 'ButtonPress', 'ButtonRelease') or t == 'Enter':
                if t == 'ButtonPress':
                    self._pressed = self._hit(ev.x, ev.y)
                    self._set_current(self._pressed, ev)
                elif t == 'Motion' and held and self._pressed is not None:
                    pass
                else:
                    self._set_current(self._hit(ev.x, ev.y), ev)
            if t in ('ButtonPress', 'ButtonRelease', 'Motion', 'KeyPress', 'KeyRelease', 'MouseWheel'):
                target = self._pressed if (t in ('Motion', 'ButtonRelease') and self._pressed is not None) else self._current
                ev.widget = self
                if self._fire_items(target, ev) == 'break':
                    if t == 'ButtonRelease':
                        self._pressed = None
                    return
            if t == 'ButtonRelease':
                self._pressed = None
                self._set_current(self._hit(ev.x, ev.y), ev)
            if t == 'Leave':
                self._set_current(None, ev)
        self._fire(ev)

    def _set_current(self, n, ev):
        if n == self._current:
            return
        old = self._current
        self._current = n
        if old is not None:
            e2 = Event()
            e2.__dict__.update(ev.__dict__)
            e2._tname = 'Leave'
            e2.type = EventType('Leave')
            self._fire_items(old, e2)
        if n is not None:
            e2 = Event()
            e2.__dict__.update(ev.__dict__)
            e2._tname = 'Enter'
            e2.type = EventType('Enter')
            self._fire_items(n, e2)


def _seg_dist(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return ((px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2) ** 0.5


def _in_poly(x, y, c):
    pts = list(zip(c[0::2], c[1::2]))
    inside = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
            inside = not inside
        j = i
    return inside


# ====================================================================== 기타
def mainloop(n=0):
    _G.mainloop()


def getint_(s):
    return int(s)


import types as _types
__all__ = [_n for _n, _o in list(globals().items()) if not _n.startswith('_') and not isinstance(_o, _types.ModuleType) and _n not in ('wantobjects', 'getint_')]
