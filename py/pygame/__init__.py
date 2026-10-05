"""브라우저용 pygame 호환 모듈 (웹 실습 강좌 — 기본 기능).

display · Surface · image · transform · draw · font · event · key · mouse · time · Rect · sprite · mixer
를 표준 pygame 과 같은 이름으로 지원한다. 게임 화면은 강좌 페이지 위의 창(캔버스)에 그려진다.
"""
import math as _math
import os as _os
import sys as _sys
import time as _time
import _webgui as _G

from pygame.constants import *  # noqa
from pygame import constants as _C

version = type(_sys)('pygame.version')
version.ver = '2.6.1 (web)'
version.vernum = (2, 6, 1)
__version__ = '2.6.1'
_state = {'init': False, 'win': None, 'start': _time.monotonic(), 'keys': set(), 'mouse': (0, 0), 'buttons': [0, 0, 0],
          'queue': [], 'headless_frames': 0, 'timers': {}, 'caption': 'pygame window', 'grab': False}


class error(RuntimeError):
    pass


def _reset_module():
    _state.update(init=False, win=None, start=_time.monotonic(), keys=set(), mouse=(0, 0), buttons=[0, 0, 0],
                  queue=[], headless_frames=0, timers={}, caption='pygame window')


def init():
    _state['init'] = True
    return (7, 0)


def quit():
    w = _state.get('win')
    if w is not None:
        w._close()
    _state['init'] = False


def get_init():
    return _state['init']


def get_error():
    return ''


def register_quit(f):
    pass


# ====================================================================== 색
_COLORS = {'black': (0, 0, 0), 'white': (255, 255, 255), 'red': (255, 0, 0), 'green': (0, 255, 0), 'blue': (0, 0, 255),
           'yellow': (255, 255, 0), 'cyan': (0, 255, 255), 'magenta': (255, 0, 255), 'gray': (190, 190, 190),
           'grey': (190, 190, 190), 'orange': (255, 165, 0), 'purple': (160, 32, 240), 'pink': (255, 192, 203),
           'brown': (165, 42, 42), 'darkgray': (169, 169, 169), 'lightgray': (211, 211, 211), 'navy': (0, 0, 128),
           'skyblue': (135, 206, 235), 'gold': (255, 215, 0), 'violet': (238, 130, 238)}


class Color:
    def __init__(self, r=0, g=None, b=None, a=255):
        if g is None:
            v = _rgba(r)
            self.r, self.g, self.b, self.a = v
        else:
            self.r, self.g, self.b, self.a = int(r), int(g), int(b), int(a)

    def __iter__(self):
        return iter((self.r, self.g, self.b, self.a))

    def __getitem__(self, i):
        return (self.r, self.g, self.b, self.a)[i]

    def __len__(self):
        return 4

    def __eq__(self, o):
        try:
            return tuple(self) == tuple(_rgba(o))
        except Exception:
            return False

    def __repr__(self):
        return '(%d, %d, %d, %d)' % (self.r, self.g, self.b, self.a)


def _rgba(c):
    if isinstance(c, Color):
        return (c.r, c.g, c.b, c.a)
    if isinstance(c, str):
        s = c.strip().lower().replace(' ', '')
        if s.startswith('#') and len(s) in (7, 9):
            v = [int(s[i:i + 2], 16) for i in range(1, len(s), 2)]
            return tuple(v) + ((255,) if len(v) == 3 else ())
        if s in _COLORS:
            return _COLORS[s] + (255,)
        raise ValueError('invalid color name')
    if isinstance(c, int):
        return ((c >> 16) & 255, (c >> 8) & 255, c & 255, 255)
    c = tuple(c)
    if len(c) == 3:
        return tuple(int(v) for v in c) + (255,)
    if len(c) == 4:
        return tuple(int(v) for v in c)
    raise ValueError('invalid color argument')


def _css(c):
    r, g, b, a = _rgba(c)
    if a >= 255:
        return '#%02x%02x%02x' % (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
    return 'rgba(%d,%d,%d,%.3f)' % (r, g, b, a / 255.0)


# ====================================================================== Rect
class Rect:
    __slots__ = ('x', 'y', 'w', 'h')

    def __init__(self, *args):
        if len(args) == 1:
            a = args[0]
            if isinstance(a, Rect):
                args = (a.x, a.y, a.w, a.h)
            elif hasattr(a, 'rect'):
                r = a.rect() if callable(a.rect) else a.rect
                args = (r.x, r.y, r.w, r.h)
            else:
                a = tuple(a)
                args = (a[0][0], a[0][1], a[1][0], a[1][1]) if len(a) == 2 else a
        elif len(args) == 2:
            args = (args[0][0], args[0][1], args[1][0], args[1][1])
        if len(args) != 4:
            raise TypeError('Argument must be rect style object')
        self.x, self.y, self.w, self.h = (int(v) for v in args)

    # 위치 속성
    left = property(lambda s: s.x, lambda s, v: setattr(s, 'x', int(v)))
    top = property(lambda s: s.y, lambda s, v: setattr(s, 'y', int(v)))
    width = property(lambda s: s.w, lambda s, v: setattr(s, 'w', int(v)))
    height = property(lambda s: s.h, lambda s, v: setattr(s, 'h', int(v)))
    right = property(lambda s: s.x + s.w, lambda s, v: setattr(s, 'x', int(v) - s.w))
    bottom = property(lambda s: s.y + s.h, lambda s, v: setattr(s, 'y', int(v) - s.h))
    centerx = property(lambda s: s.x + s.w // 2, lambda s, v: setattr(s, 'x', int(v) - s.w // 2))
    centery = property(lambda s: s.y + s.h // 2, lambda s, v: setattr(s, 'y', int(v) - s.h // 2))

    def _pair(getx, gety, setx, sety):
        return property(lambda s: (getx(s), gety(s)), lambda s, v: (setx(s, v[0]), sety(s, v[1])))

    topleft = _pair(lambda s: s.x, lambda s: s.y, lambda s, v: setattr(s, 'x', int(v)), lambda s, v: setattr(s, 'y', int(v)))
    size = property(lambda s: (s.w, s.h), lambda s, v: (setattr(s, 'w', int(v[0])), setattr(s, 'h', int(v[1]))))
    center = property(lambda s: (s.centerx, s.centery), lambda s, v: (setattr(s, 'centerx', v[0]), setattr(s, 'centery', v[1])))
    topright = property(lambda s: (s.right, s.y), lambda s, v: (setattr(s, 'right', v[0]), setattr(s, 'top', v[1])))
    bottomleft = property(lambda s: (s.x, s.bottom), lambda s, v: (setattr(s, 'left', v[0]), setattr(s, 'bottom', v[1])))
    bottomright = property(lambda s: (s.right, s.bottom), lambda s, v: (setattr(s, 'right', v[0]), setattr(s, 'bottom', v[1])))
    midtop = property(lambda s: (s.centerx, s.y), lambda s, v: (setattr(s, 'centerx', v[0]), setattr(s, 'top', v[1])))
    midbottom = property(lambda s: (s.centerx, s.bottom), lambda s, v: (setattr(s, 'centerx', v[0]), setattr(s, 'bottom', v[1])))
    midleft = property(lambda s: (s.x, s.centery), lambda s, v: (setattr(s, 'left', v[0]), setattr(s, 'centery', v[1])))
    midright = property(lambda s: (s.right, s.centery), lambda s, v: (setattr(s, 'right', v[0]), setattr(s, 'centery', v[1])))
    del _pair

    def __iter__(self):
        return iter((self.x, self.y, self.w, self.h))

    def __len__(self):
        return 4

    def __getitem__(self, i):
        return (self.x, self.y, self.w, self.h)[i]

    def __setitem__(self, i, v):
        vals = [self.x, self.y, self.w, self.h]
        vals[i] = int(v)
        self.x, self.y, self.w, self.h = vals

    def __eq__(self, o):
        try:
            return tuple(self) == tuple(Rect(o))
        except Exception:
            return False

    def __bool__(self):
        return self.w != 0 and self.h != 0

    def __repr__(self):
        return '<rect(%d, %d, %d, %d)>' % (self.x, self.y, self.w, self.h)

    def copy(self):
        return Rect(self.x, self.y, self.w, self.h)

    def move(self, *d):
        dx, dy = d[0] if len(d) == 1 else d
        return Rect(self.x + dx, self.y + dy, self.w, self.h)

    def move_ip(self, *d):
        dx, dy = d[0] if len(d) == 1 else d
        self.x += int(dx)
        self.y += int(dy)

    def inflate(self, *d):
        dx, dy = d[0] if len(d) == 1 else d
        return Rect(self.x - int(dx) // 2, self.y - int(dy) // 2, self.w + int(dx), self.h + int(dy))

    def inflate_ip(self, *d):
        r = self.inflate(*d)
        self.x, self.y, self.w, self.h = r.x, r.y, r.w, r.h

    def scale_by(self, x, y=None):
        y = x if y is None else y
        r = Rect(0, 0, int(self.w * x), int(self.h * y))
        r.center = self.center
        return r

    def update(self, *args):
        r = Rect(*args)
        self.x, self.y, self.w, self.h = r.x, r.y, r.w, r.h

    def clamp(self, r):
        r = Rect(r)
        n = self.copy()
        n.clamp_ip(r)
        return n

    def clamp_ip(self, r):
        r = Rect(r)
        if self.w >= r.w:
            self.x = r.x + r.w // 2 - self.w // 2
        elif self.x < r.x:
            self.x = r.x
        elif self.right > r.right:
            self.right = r.right
        if self.h >= r.h:
            self.y = r.y + r.h // 2 - self.h // 2
        elif self.y < r.y:
            self.y = r.y
        elif self.bottom > r.bottom:
            self.bottom = r.bottom

    def clip(self, r):
        r = Rect(r)
        x1, y1 = max(self.x, r.x), max(self.y, r.y)
        x2, y2 = min(self.right, r.right), min(self.bottom, r.bottom)
        if x2 <= x1 or y2 <= y1:
            return Rect(self.x, self.y, 0, 0)
        return Rect(x1, y1, x2 - x1, y2 - y1)

    def union(self, r):
        r = Rect(r)
        x1, y1 = min(self.x, r.x), min(self.y, r.y)
        return Rect(x1, y1, max(self.right, r.right) - x1, max(self.bottom, r.bottom) - y1)

    def union_ip(self, r):
        u = self.union(r)
        self.x, self.y, self.w, self.h = u.x, u.y, u.w, u.h

    def unionall(self, rects):
        u = self.copy()
        for r in rects:
            u = u.union(r)
        return u

    def fit(self, r):
        r = Rect(r)
        ratio = max(self.w / float(r.w or 1), self.h / float(r.h or 1)) or 1
        w, h = int(self.w / ratio), int(self.h / ratio)
        return Rect(r.x + (r.w - w) // 2, r.y + (r.h - h) // 2, w, h)

    def normalize(self):
        if self.w < 0:
            self.x += self.w
            self.w = -self.w
        if self.h < 0:
            self.y += self.h
            self.h = -self.h

    def contains(self, r):
        r = Rect(r)
        return self.x <= r.x and self.y <= r.y and r.right <= self.right and r.bottom <= self.bottom

    def collidepoint(self, *p):
        x, y = p[0] if len(p) == 1 else p
        return self.x <= x < self.right and self.y <= y < self.bottom

    def colliderect(self, *r):
        r = Rect(*r)
        return self.x < r.right and r.x < self.right and self.y < r.bottom and r.y < self.bottom and self.w > 0 and self.h > 0 and r.w > 0 and r.h > 0

    def collidelist(self, rects):
        for i, r in enumerate(rects):
            if self.colliderect(r):
                return i
        return -1

    def collidelistall(self, rects):
        return [i for i, r in enumerate(rects) if self.colliderect(r)]

    def collidedict(self, d, values=False):
        for k, v in d.items():
            if self.colliderect(v if values else k):
                return (k, v)
        return None


FRect = Rect


# ====================================================================== Surface
def _rect_arg(r):
    if isinstance(r, Rect):
        return r
    return Rect(r)


class Surface:
    def __init__(self, size, flags=0, depth=0, masks=None):
        w, h = size
        self._w, self._h = int(w), int(h)
        self._ops = []
        self._colorkey = None
        self._alpha = None
        self._is_screen = False
        self._win = None
        self._srcalpha = bool(flags & SRCALPHA) if isinstance(flags, int) else False

    # 정보
    def get_size(self):
        return (self._w, self._h)

    def get_width(self):
        return self._w

    def get_height(self):
        return self._h

    def get_rect(self, **kw):
        r = Rect(0, 0, self._w, self._h)
        for k, v in kw.items():
            setattr(r, k, v)
        return r

    def get_bounding_rect(self, min_alpha=1):
        return self.get_rect()

    def get_flags(self):
        return SRCALPHA if self._srcalpha else 0

    def get_bitsize(self):
        return 32

    def convert(self, *a):
        return self

    def convert_alpha(self, *a):
        return self

    def copy(self):
        s = Surface((self._w, self._h))
        s._ops = list(self._ops)
        s._colorkey, s._alpha = self._colorkey, self._alpha
        return s

    def set_colorkey(self, color=None, flags=0):
        self._colorkey = None if color is None else _css(color)

    def get_colorkey(self):
        return self._colorkey

    def set_alpha(self, value=None, flags=0):
        self._alpha = None if value is None else max(0, min(255, int(value)))

    def get_alpha(self):
        return self._alpha

    def lock(self):
        pass

    def unlock(self):
        pass

    def get_locked(self):
        return False

    def _drawable(self):
        d = {'w': self._w, 'h': self._h, 'o': list(self._ops)}
        if self._colorkey:
            d['ck'] = self._colorkey
        if self._alpha is not None:
            d['a'] = self._alpha
        return d

    # 그리기
    def _add(self, op):
        self._ops.append(op)
        if self._is_screen and len(self._ops) > 4000:
            _flush_screen(self)

    def fill(self, color, rect=None, special_flags=0):
        if rect is None:
            self._ops = [['fill', _css(color)]]
            return self.get_rect()
        r = _rect_arg(rect)
        self._add(['rect', _css(color), r.x, r.y, r.w, r.h, 0, 0])
        return r

    def blit(self, source, dest=(0, 0), area=None, special_flags=0):
        if isinstance(dest, Rect):
            x, y = dest.x, dest.y
        else:
            x, y = dest[0], dest[1]
        op = ['s', source._drawable(), x, y, source._w, source._h, 0, 0, 0]
        if area is not None:
            a = _rect_arg(area)
            op.append([a.x, a.y, a.w, a.h])
            w, h = a.w, a.h
        else:
            w, h = source._w, source._h
        self._add(op)
        return Rect(x, y, w, h)

    def blits(self, blit_sequence, doreturn=1):
        out = []
        for item in blit_sequence:
            out.append(self.blit(*item))
        return out if doreturn else None

    def set_at(self, pos, color):
        self._add(['rect', _css(color), int(pos[0]), int(pos[1]), 1, 1, 0, 0])

    def get_at(self, pos):
        return Color(0, 0, 0, 255)

    def subsurface(self, rect):
        r = _rect_arg(rect)
        s = Surface((r.w, r.h))
        s._ops = [['s', self._drawable(), -r.x, -r.y, self._w, self._h, 0, 0, 0]]
        return s

    def scroll(self, dx=0, dy=0):
        pass

    def get_parent(self):
        return None

    def get_abs_offset(self):
        return (0, 0)


SurfaceType = Surface


def _flush_screen(s):
    if s._win is not None and not s._win._closed:
        _G.send({'op': 'pgframe', 'id': s._win._w, 'o': s._ops})
    s._ops = []


# ====================================================================== 창 (display)
class _Window:
    def __init__(self, w, h):
        self._w = _G.new_id('pg')
        self._closed = False
        self.surface = Surface((w, h))
        self.surface._is_screen = True
        self.surface._win = self
        _G.send({'op': 'pgwin', 'id': self._w, 'w': w, 'h': h, 'title': _state['caption']})
        _G.register_window(self)

    def _close(self):
        if not self._closed:
            self._closed = True
            _G.send({'op': 'wclose', 'id': self._w})
            _G.unregister_window(self)
            _G.flush()
        if _state.get('win') is self:
            _state['win'] = None

    def _on_event(self, ev):
        # 프로그램이 끝난 뒤(이벤트 루프)에 창 닫기 버튼을 누른 경우
        if ev.get('t') == 'close':
            self._close()


class _Display:
    def init(self):
        pass

    def quit(self):
        w = _state.get('win')
        if w is not None:
            w._close()

    def get_init(self):
        return True

    def set_mode(self, size=(0, 0), flags=0, depth=0, display=0, vsync=0):
        w, h = int(size[0]) or 640, int(size[1]) or 480
        old = _state.get('win')
        if old is not None and not old._closed:
            old.surface._w, old.surface._h = w, h
            old.surface._ops = []
            _G.send({'op': 'pgwin', 'id': old._w, 'w': w, 'h': h, 'title': _state['caption']})
            return old.surface
        win = _Window(w, h)
        _state['win'] = win
        return win.surface

    def get_surface(self):
        w = _state.get('win')
        return w.surface if w else None

    def set_caption(self, title, icontitle=None):
        _state['caption'] = str(title)
        w = _state.get('win')
        if w is not None:
            _G.send({'op': 'title', 'id': w._w, 'text': str(title)})

    def get_caption(self):
        return (_state['caption'], _state['caption'])

    def set_icon(self, surface):
        pass

    def flip(self):
        w = _state.get('win')
        if w is None or w._closed:
            if w is not None and w._closed:
                raise error('video system not initialized')
            return
        _flush_screen(w.surface)
        _G.flush()
        if _G.HEADLESS:
            _state['headless_frames'] += 1

    def update(self, rectangle=None, *a):
        self.flip()

    def Info(self):
        class _Info:
            current_w = 1920
            current_h = 1080
            bitsize = 32
        return _Info()

    def get_window_size(self):
        w = _state.get('win')
        return w.surface.get_size() if w else (0, 0)

    def list_modes(self, *a):
        return [(1920, 1080), (1280, 720), (800, 600)]

    def get_active(self):
        return _state.get('win') is not None

    def iconify(self):
        return False

    def toggle_fullscreen(self):
        return 0

    def get_desktop_sizes(self):
        return [(1920, 1080)]


display = _Display()


# ====================================================================== 이미지 · 변형
class _Image:
    def load(self, filename, namehint=''):
        if hasattr(filename, 'read'):
            raw = filename.read()
        else:
            p = str(filename)
            if not _os.path.exists(p):
                raise FileNotFoundError("No file '%s' found in working directory '%s'." % (p, _os.getcwd()))
            with open(p, 'rb') as fp:
                raw = fp.read()
        w, h, mime = _G.image_size(raw)
        iid = _G.new_id('pgimg')
        _G.send_bin(iid, 'file', raw, {'mime': mime, 'w': w, 'h': h})
        s = Surface((w, h))
        s._ops = [['img', iid, 0, 0, w, h]]
        s._srcalpha = True
        return s

    def save(self, surface, filename, namehint=''):
        with open(filename, 'wb'):
            pass

    def get_extended(self):
        return True


image = _Image()


class _Transform:
    def scale(self, surface, size, dest_surface=None):
        w, h = int(size[0]), int(size[1])
        s = Surface((w, h))
        s._ops = [['s', surface._drawable(), 0, 0, w, h, 0, 0, 0]]
        return s

    smoothscale = scale

    def scale_by(self, surface, factor):
        fx, fy = (factor, factor) if isinstance(factor, (int, float)) else factor
        return self.scale(surface, (surface._w * fx, surface._h * fy))

    def scale2x(self, surface, dest_surface=None):
        return self.scale(surface, (surface._w * 2, surface._h * 2))

    def rotate(self, surface, angle):
        a = _math.radians(angle)
        w, h = surface._w, surface._h
        nw = int(abs(w * _math.cos(a)) + abs(h * _math.sin(a)) + 0.5)
        nh = int(abs(w * _math.sin(a)) + abs(h * _math.cos(a)) + 0.5)
        s = Surface((nw, nh))
        s._ops = [['s', surface._drawable(), (nw - w) / 2.0, (nh - h) / 2.0, w, h, angle, 0, 0]]
        return s

    def rotozoom(self, surface, angle, scale):
        return self.rotate(self.scale(surface, (surface._w * scale, surface._h * scale)), angle)

    def flip(self, surface, flip_x, flip_y):
        s = Surface((surface._w, surface._h))
        s._ops = [['s', surface._drawable(), 0, 0, surface._w, surface._h, 0, 1 if flip_x else 0, 1 if flip_y else 0]]
        return s


transform = _Transform()


# ====================================================================== 도형 (draw)
class _Draw:
    def rect(self, surface, color, rect, width=0, border_radius=0, *a, **kw):
        r = _rect_arg(rect)
        surface._add(['rect', _css(color), r.x, r.y, r.w, r.h, int(width), int(border_radius)])
        return r

    def circle(self, surface, color, center, radius, width=0, *a, **kw):
        surface._add(['circle', _css(color), float(center[0]), float(center[1]), float(radius), int(width)])
        return Rect(center[0] - radius, center[1] - radius, radius * 2, radius * 2)

    def ellipse(self, surface, color, rect, width=0):
        r = _rect_arg(rect)
        surface._add(['ellipse', _css(color), r.x, r.y, r.w, r.h, int(width)])
        return r

    def arc(self, surface, color, rect, start_angle, stop_angle, width=1):
        r = _rect_arg(rect)
        surface._add(['arc', _css(color), r.x, r.y, r.w, r.h, float(start_angle), float(stop_angle), int(width)])
        return r

    def line(self, surface, color, start_pos, end_pos, width=1):
        surface._add(['line', _css(color), float(start_pos[0]), float(start_pos[1]), float(end_pos[0]), float(end_pos[1]), int(width)])
        return Rect(min(start_pos[0], end_pos[0]), min(start_pos[1], end_pos[1]),
                    abs(end_pos[0] - start_pos[0]) + 1, abs(end_pos[1] - start_pos[1]) + 1)

    def aaline(self, surface, color, start_pos, end_pos, blend=1):
        return self.line(surface, color, start_pos, end_pos, 1)

    def lines(self, surface, color, closed, points, width=1):
        pts = [[float(p[0]), float(p[1])] for p in points]
        surface._add(['lines', _css(color), 1 if closed else 0, pts, int(width)])
        xs = [p[0] for p in pts] or [0]
        ys = [p[1] for p in pts] or [0]
        return Rect(min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1)

    def aalines(self, surface, color, closed, points, blend=1):
        return self.lines(surface, color, closed, points, 1)

    def polygon(self, surface, color, points, width=0):
        pts = [[float(p[0]), float(p[1])] for p in points]
        surface._add(['poly', _css(color), pts, int(width)])
        xs = [p[0] for p in pts] or [0]
        ys = [p[1] for p in pts] or [0]
        return Rect(min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1)


draw = _Draw()


# ====================================================================== 글꼴
class _FontModule:
    def init(self):
        pass

    def quit(self):
        pass

    def get_init(self):
        return True

    def get_default_font(self):
        return 'freesansbold.ttf'

    def get_fonts(self):
        return ['arial', 'malgungothic', 'gulim', 'batang', 'couriernew']

    def match_font(self, name, bold=False, italic=False):
        return None

    def SysFont(self, name, size, bold=False, italic=False):
        fam = name
        if isinstance(name, (list, tuple)):
            fam = name[0] if name else None
        if isinstance(fam, str) and ',' in fam:
            fam = fam.split(',')[0]
        return Font(None, size, _family=fam, _bold=bold, _italic=italic, _sys=True)

    def Font(self, file=None, size=12, **kw):
        return Font(file, size, **kw)


class Font:
    def __init__(self, file=None, size=12, _family=None, _bold=False, _italic=False, _sys=False):
        self._size = int(size)
        self._px = self._size if _sys else max(1, int(round(self._size * 0.72)))
        self._family = _family or (None if file is None else _os.path.splitext(_os.path.basename(str(file)))[0])
        self._bold = bool(_bold)
        self._italic = bool(_italic)
        self._underline = False

    def _css(self):
        fams = []
        if self._family:
            fams.append('"%s"' % self._family)
        fams.append('"Malgun Gothic", "Apple SD Gothic Neo", sans-serif')
        return '%s %s %dpx %s' % ('italic' if self._italic else 'normal', 'bold' if self._bold else 'normal', self._px, ', '.join(fams))

    def size(self, text):
        px = self._px
        w = 0
        for ch in str(text):
            w += px * (1.0 if ord(ch) > 0x2E80 else 0.56)
        return (int(round(w)), int(round(px * 1.2)))

    def render(self, text, antialias=True, color=(0, 0, 0), background=None):
        w, h = self.size(text)
        s = Surface((max(1, w), h))
        if background is not None:
            s._ops.append(['fill', _css(background)])
        s._ops.append(['text', str(text), self._css(), _css(color), 0, 0, h])
        return s

    def get_height(self):
        return int(round(self._px * 1.2))

    def get_linesize(self):
        return self.get_height()

    def get_ascent(self):
        return int(self._px * 0.9)

    def get_descent(self):
        return -int(self._px * 0.25)

    def set_bold(self, v):
        self._bold = bool(v)

    def get_bold(self):
        return self._bold

    def set_italic(self, v):
        self._italic = bool(v)

    def get_italic(self):
        return self._italic

    def set_underline(self, v):
        self._underline = bool(v)

    def get_underline(self):
        return self._underline

    bold = property(get_bold, set_bold)
    italic = property(get_italic, set_italic)


font = _FontModule()
font.Font = Font
freetype = font


# ====================================================================== 이벤트
class Event:
    def __init__(self, type, dict=None, **kw):
        self.type = type
        if dict:
            self.__dict__.update(dict)
        self.__dict__.update(kw)

    @property
    def dict(self):
        return {k: v for k, v in self.__dict__.items() if k != 'type'}

    def __repr__(self):
        return '<Event(%d-%s %s)>' % (self.type, event_name(self.type), self.dict)

    def __eq__(self, o):
        return isinstance(o, Event) and o.type == self.type and o.dict == self.dict


EventType = Event

_KEYMAP = {'ArrowLeft': K_LEFT, 'ArrowRight': K_RIGHT, 'ArrowUp': K_UP, 'ArrowDown': K_DOWN, 'Space': K_SPACE,
           'Enter': K_RETURN, 'NumpadEnter': K_KP_ENTER, 'Escape': K_ESCAPE, 'Backspace': K_BACKSPACE, 'Tab': K_TAB,
           'Delete': K_DELETE, 'Insert': K_INSERT, 'Home': K_HOME, 'End': K_END, 'PageUp': K_PAGEUP, 'PageDown': K_PAGEDOWN,
           'ShiftLeft': K_LSHIFT, 'ShiftRight': K_RSHIFT, 'ControlLeft': K_LCTRL, 'ControlRight': K_RCTRL,
           'AltLeft': K_LALT, 'AltRight': K_RALT, 'CapsLock': K_CAPSLOCK, 'Minus': K_MINUS, 'Equal': K_EQUALS,
           'Comma': K_COMMA, 'Period': K_PERIOD, 'Slash': K_SLASH, 'Semicolon': K_SEMICOLON, 'Quote': K_QUOTE,
           'BracketLeft': K_LEFTBRACKET, 'BracketRight': K_RIGHTBRACKET, 'Backslash': K_BACKSLASH, 'Backquote': K_BACKQUOTE}
for _i in range(1, 13):
    _KEYMAP['F%d' % _i] = getattr(_C, 'K_F%d' % _i)
for _i in range(10):
    _KEYMAP['Numpad%d' % _i] = getattr(_C, 'K_KP%d' % _i)
del _i


def _keycode(code, key):
    if code in _KEYMAP:
        return _KEYMAP[code]
    if code.startswith('Key') and len(code) == 4:
        return ord(code[3].lower())
    if code.startswith('Digit') and len(code) == 6:
        return ord(code[5])
    if key and len(key) == 1:
        return ord(key.lower())
    return 0


def _mods(e):
    m = 0
    if e.get('sh'):
        m |= KMOD_LSHIFT
    if e.get('ct'):
        m |= KMOD_LCTRL
    if e.get('al'):
        m |= KMOD_LALT
    return m


def _convert(e):
    t = e.get('t')
    if t == 'close':
        return Event(QUIT)
    if t in ('keydown', 'keyup'):
        k = _keycode(e.get('code', ''), e.get('key', ''))
        if t == 'keydown':
            _state['keys'].add(k)
        else:
            _state['keys'].discard(k)
        key = e.get('key', '')
        uni = key if len(key) == 1 else ('\r' if key == 'Enter' else '')
        d = {'key': k, 'mod': _mods(e), 'scancode': k & 0xffff, 'unicode': uni if t == 'keydown' else ''}
        if t == 'keyup':
            d.pop('unicode')
        return Event(KEYDOWN if t == 'keydown' else KEYUP, d)
    if t in ('mousedown', 'mouseup', 'mousemove'):
        pos = (int(e.get('x', 0)), int(e.get('y', 0)))
        old = _state['mouse']
        _state['mouse'] = pos
        b = int(e.get('b', 0)) + 1
        if t == 'mousemove':
            bs = e.get('bs', 0)
            buttons = (1 if bs & 1 else 0, 1 if bs & 4 else 0, 1 if bs & 2 else 0)
            return Event(MOUSEMOTION, pos=pos, rel=(pos[0] - old[0], pos[1] - old[1]), buttons=buttons, touch=False)
        if 1 <= b <= 3:
            _state['buttons'][b - 1] = 1 if t == 'mousedown' else 0
        return Event(MOUSEBUTTONDOWN if t == 'mousedown' else MOUSEBUTTONUP, pos=pos, button=b, touch=False)
    if t == 'wheel':
        dy = -1 if e.get('dy', 0) > 0 else 1
        return Event(MOUSEWHEEL, x=0, y=dy, flipped=False, precise_x=0.0, precise_y=float(dy), touch=False)
    if t == 'focus':
        return Event(ACTIVEEVENT, gain=1 if e.get('v') else 0, state=1)
    return None


def _collect():
    _G.poll()
    w = _state.get('win')
    wid = w._w if w else None
    evs = _G.take_events(lambda e: e.get('id') == wid and e.get('k') in ('pg', 'ev'))
    out = []
    for e in evs:
        ev = _convert(e)
        if ev is not None:
            out.append(ev)
    # 타이머 이벤트
    now = _time.monotonic()
    for etype, t in list(_state['timers'].items()):
        interval, nxt, loops = t
        if now >= nxt:
            out.append(Event(etype) if not isinstance(etype, Event) else etype)
            if loops == 1:
                del _state['timers'][etype]
            else:
                _state['timers'][etype] = (interval, now + interval, loops - 1 if loops else 0)
    q = _state['queue']
    if q:
        out = q + out
        _state['queue'] = []
    if _G.HEADLESS:
        # 검증 도구: 화면이 없으므로 몇 번 돈 뒤 QUIT 을 보낸다
        _state['headless_frames'] += 1
        if _state['headless_frames'] > 60:
            out.append(Event(QUIT))
    return out


class _EventModule:
    Event = Event
    EventType = Event

    def get(self, eventtype=None, pump=True, exclude=None):
        evs = _collect()
        if eventtype is None and exclude is None:
            return evs
        types = eventtype if isinstance(eventtype, (list, tuple)) else ([eventtype] if eventtype is not None else None)
        excl = exclude if isinstance(exclude, (list, tuple)) else ([exclude] if exclude is not None else [])
        keep, out = [], []
        for e in evs:
            if (types is None or e.type in types) and e.type not in excl:
                out.append(e)
            else:
                keep.append(e)
        _state['queue'] = keep + _state['queue']
        return out

    def poll(self):
        evs = _collect()
        if not evs:
            return Event(NOEVENT)
        _state['queue'] = evs[1:] + _state['queue']
        return evs[0]

    def wait(self, timeout=0):
        end = _time.monotonic() + (timeout / 1000.0 if timeout else 1e9)
        while True:
            evs = _collect()
            if evs:
                _state['queue'] = evs[1:] + _state['queue']
                return evs[0]
            if _time.monotonic() >= end:
                return Event(NOEVENT)
            _G.sleep(0.01)

    def pump(self):
        _G.poll()

    def post(self, ev):
        _state['queue'].append(ev)
        return True

    def clear(self, eventtype=None, pump=True):
        self.get(eventtype)

    def peek(self, eventtype=None, pump=True):
        evs = _collect()
        _state['queue'] = evs + _state['queue']
        if eventtype is None:
            return bool(evs)
        types = eventtype if isinstance(eventtype, (list, tuple)) else [eventtype]
        return any(e.type in types for e in evs)

    def set_blocked(self, *a):
        pass

    def set_allowed(self, *a):
        pass

    def get_blocked(self, t):
        return False

    def set_grab(self, v):
        _state['grab'] = bool(v)

    def get_grab(self):
        return _state['grab']

    def custom_type(self):
        _state['custom'] = _state.get('custom', USEREVENT) + 1
        return _state['custom']

    def event_name(self, t):
        return event_name(t)


event = _EventModule()


def event_name(t):
    for k in ('QUIT', 'KEYDOWN', 'KEYUP', 'MOUSEMOTION', 'MOUSEBUTTONDOWN', 'MOUSEBUTTONUP', 'MOUSEWHEEL', 'ACTIVEEVENT', 'USEREVENT', 'NOEVENT'):
        if getattr(_C, k) == t:
            return k.title().replace('button', 'Button').replace('motion', 'Motion')
    return 'UserEvent' if t >= USEREVENT else 'Unknown'


# ====================================================================== 키보드 · 마우스
class _Pressed:
    def __init__(self, keys):
        self._keys = keys

    def __getitem__(self, k):
        return k in self._keys

    def __len__(self):
        return 512

    def __iter__(self):
        return iter(False for _ in range(0))


class _Key:
    def get_pressed(self):
        _collect_keep()
        return _Pressed(set(_state['keys']))

    def get_mods(self):
        return 0

    def set_repeat(self, delay=0, interval=0):
        pass

    def get_repeat(self):
        return (0, 0)

    def name(self, key, use_compat=True):
        for k, v in vars(_C).items():
            if k.startswith('K_') and v == key:
                return k[2:].lower()
        return 'unknown key'

    def key_code(self, name):
        return getattr(_C, 'K_' + name, getattr(_C, 'K_' + name.upper(), 0))

    def get_focused(self):
        return True

    def start_text_input(self):
        pass

    def stop_text_input(self):
        pass


def _collect_keep():
    evs = _collect()
    _state['queue'] = _state['queue'] + evs


key = _Key()


class _Mouse:
    def get_pos(self):
        _collect_keep()
        return _state['mouse']

    def get_pressed(self, num_buttons=3):
        _collect_keep()
        b = tuple(bool(x) for x in _state['buttons'])
        return b if num_buttons == 3 else b + (False, False)

    def get_rel(self):
        return (0, 0)

    def set_visible(self, v):
        _G.send({'op': 'pgcursor', 'id': _state['win']._w if _state.get('win') else '', 'v': bool(v)})
        return True

    def get_visible(self):
        return True

    def set_pos(self, *p):
        pass

    def get_focused(self):
        return True

    def set_cursor(self, *a):
        pass


mouse = _Mouse()


# ====================================================================== 시간
class Clock:
    def __init__(self):
        self._last = _time.monotonic()
        self._fps = 0.0
        self._times = []
        self._raw = 0

    def tick(self, framerate=0):
        now = _time.monotonic()
        if framerate and framerate > 0:
            target = self._last + 1.0 / framerate
            if target > now:
                _G.sleep(target - now) if not _G.HEADLESS else None
                now = _time.monotonic()
        else:
            _G.poll()
        dt = now - self._last
        self._raw = dt
        self._last = now
        self._times.append(dt)
        if len(self._times) > 10:
            self._times.pop(0)
        avg = sum(self._times) / len(self._times)
        self._fps = 1.0 / avg if avg > 0 else 0.0
        return int(dt * 1000)

    tick_busy_loop = tick

    def get_fps(self):
        return self._fps

    def get_time(self):
        return int(self._raw * 1000)

    def get_rawtime(self):
        return int(self._raw * 1000)


class _TimeModule:
    Clock = Clock

    def get_ticks(self):
        return int((_time.monotonic() - _state['start']) * 1000)

    def delay(self, ms):
        _G.sleep(ms / 1000.0) if not _G.HEADLESS else None
        return int(ms)

    wait = delay

    def set_timer(self, ev, millis, loops=0):
        if not millis:
            _state['timers'].pop(ev, None)
            return
        _state['timers'][ev] = (millis / 1000.0, _time.monotonic() + millis / 1000.0, loops)


time = _TimeModule()


# ====================================================================== 소리 (소리 파일을 브라우저에서 재생)
class _Sound:
    def __init__(self, file=None, buffer=None):
        p = str(file)
        if not _os.path.exists(p):
            raise FileNotFoundError("No file '%s' found in working directory '%s'." % (p, _os.getcwd()))
        with open(p, 'rb') as fp:
            raw = fp.read()
        self._id = _G.new_id('snd')
        self._vol = 1.0
        _G.send_bin(self._id, 'sound', raw, {'name': p})

    def play(self, loops=0, maxtime=0, fade_ms=0):
        _G.send({'op': 'sound', 'id': self._id, 'act': 'play', 'loops': loops, 'vol': self._vol})

    def stop(self):
        _G.send({'op': 'sound', 'id': self._id, 'act': 'stop'})

    def set_volume(self, v):
        self._vol = max(0.0, min(1.0, float(v)))

    def get_volume(self):
        return self._vol

    def get_length(self):
        return 0.0

    def fadeout(self, ms):
        self.stop()


class _Music:
    def __init__(self):
        self._snd = None
        self._vol = 1.0

    def load(self, filename, namehint=''):
        self._snd = _Sound(filename)

    def play(self, loops=0, start=0.0, fade_ms=0):
        if self._snd:
            self._snd._vol = self._vol
            self._snd.play(loops)

    def stop(self):
        if self._snd:
            self._snd.stop()

    def pause(self):
        self.stop()

    def unpause(self):
        self.play()

    def set_volume(self, v):
        self._vol = float(v)

    def get_volume(self):
        return self._vol

    def get_busy(self):
        return False

    def fadeout(self, ms):
        self.stop()

    def rewind(self):
        pass

    def unload(self):
        self._snd = None


class _Mixer:
    Sound = _Sound

    def __init__(self):
        self.music = _Music()

    def init(self, *a, **k):
        pass

    def pre_init(self, *a, **k):
        pass

    def quit(self):
        pass

    def get_init(self):
        return (44100, -16, 2)

    def stop(self):
        pass

    def set_num_channels(self, n):
        pass

    def Channel(self, i):
        return self

    def pause(self):
        pass

    def unpause(self):
        pass


mixer = _Mixer()


# ====================================================================== 기타
class _Math:
    pass


from pygame import sprite  # noqa: E402
from pygame.math import Vector2, Vector3  # noqa: E402,F401
import pygame.math as math  # noqa: E402,F401


def _sys_exit_hook():
    pass
