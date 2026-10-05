"""브라우저용 turtle(거북이 그래픽) 호환 모듈 (웹 실습 강좌).

표준 turtle 모듈과 같은 함수 이름 · 사용법을 지원한다.
그림은 강좌 페이지 위의 'Python Turtle Graphics' 창에 그려진다.
"""
import math
import _webgui as _G
import tkinter as TK

__all__ = ['ScrolledCanvas', 'TurtleScreen', 'Screen', 'RawTurtle', 'Turtle', 'RawPen', 'Pen', 'Shape', 'Vec2D',
           'Terminator', 'TurtleGraphicsError']

_CFG = {'width': 640, 'height': 520, 'canvwidth': 400, 'canvheight': 300, 'mode': 'standard',
        'colormode': 1.0, 'delay': 10, 'undobuffersize': 1000, 'shape': 'classic', 'pencolor': 'black',
        'fillcolor': 'black', 'resizemode': 'noresize', 'visible': True, 'title': 'Python Turtle Graphics'}


class Terminator(Exception):
    """창을 닫았을 때 그리기를 멈추기 위한 예외"""
    _quiet_exit = True


class TurtleGraphicsError(Exception):
    pass


class Vec2D(tuple):
    def __new__(cls, x, y):
        return tuple.__new__(cls, (x, y))

    def __add__(self, other):
        return Vec2D(self[0] + other[0], self[1] + other[1])

    def __mul__(self, other):
        if isinstance(other, Vec2D):
            return self[0] * other[0] + self[1] * other[1]
        return Vec2D(self[0] * other, self[1] * other)

    def __rmul__(self, other):
        if isinstance(other, (int, float)):
            return Vec2D(self[0] * other, self[1] * other)
        return NotImplemented

    def __sub__(self, other):
        return Vec2D(self[0] - other[0], self[1] - other[1])

    def __neg__(self):
        return Vec2D(-self[0], -self[1])

    def __abs__(self):
        return math.hypot(*self)

    def rotate(self, angle):
        perp = Vec2D(-self[1], self[0])
        angle = math.radians(angle)
        c, s = math.cos(angle), math.sin(angle)
        return Vec2D(self[0] * c + perp[0] * s, self[1] * c + perp[1] * s)

    def __getnewargs__(self):
        return (self[0], self[1])

    def __repr__(self):
        return '(%.2f,%.2f)' % self


_SHAPES = {
    'arrow': ((-10, 0), (10, 0), (0, 10)),
    'turtle': ((0, 16), (-2, 14), (-1, 10), (-4, 7), (-7, 9), (-9, 8), (-6, 5), (-7, 1), (-5, -3), (-8, -6),
               (-6, -8), (-4, -5), (0, -7), (4, -5), (6, -8), (8, -6), (5, -3), (7, 1), (6, 5), (9, 8), (7, 9),
               (4, 7), (1, 10), (2, 14)),
    'circle': ((10, 0), (9.51, 3.09), (8.09, 5.88), (5.88, 8.09), (3.09, 9.51), (0, 10), (-3.09, 9.51), (-5.88, 8.09),
               (-8.09, 5.88), (-9.51, 3.09), (-10, 0), (-9.51, -3.09), (-8.09, -5.88), (-5.88, -8.09), (-3.09, -9.51),
               (-0.00, -10.00), (3.09, -9.51), (5.88, -8.09), (8.09, -5.88), (9.51, -3.09)),
    'square': ((10, -10), (10, 10), (-10, 10), (-10, -10)),
    'triangle': ((10, -5.77), (0, 11.55), (-10, -5.77)),
    'classic': ((0, 0), (-5, -9), (0, -7), (5, -9)),
    'blank': (),
}


class Shape:
    def __init__(self, type_, data=None):
        self._type = type_
        if type_ == 'polygon' and isinstance(data, (tuple, list)):
            data = tuple(tuple(p) for p in data)
        elif type_ == 'compound':
            data = []
        self._data = data

    def addcomponent(self, poly, fill, outline=None):
        if self._type != 'compound':
            raise TurtleGraphicsError('Cannot add component to %s Shape' % self._type)
        if outline is None:
            outline = fill
        self._data.append([tuple(tuple(p) for p in poly), fill, outline])


_SPEEDS = {'fastest': 0, 'fast': 10, 'normal': 6, 'slow': 3, 'slowest': 1}


# ====================================================================== 화면
class TurtleScreen:
    def __init__(self, cv, mode=None, colormode=None, delay=None):
        self.cv = cv
        self._shapes = {k: Shape('polygon', v) for k, v in _SHAPES.items()}
        self._shapes['blank'] = Shape('polygon', ())
        self._turtles = []
        self._closed = False
        self._bgcolor = 'white'
        self._bgpic = 'nopic'
        self._bgpic_item = None
        self._colormode = colormode if colormode is not None else _CFG['colormode']
        self._mode = mode or _CFG['mode']
        self._delayvalue = _CFG['delay'] if delay is None else delay
        self._tracing = 1
        self._updatecounter = 0
        self._keys = []
        self._world = None
        self._canvw = _CFG['canvwidth']
        self._canvh = _CFG['canvheight']
        self._W = TK._int(cv.cget('width'), 400)
        self._H = TK._int(cv.cget('height'), 300)
        self._set_transform()

    # ------------------------------------------------------------ 좌표 변환
    def _set_transform(self):
        W, H = self._W, self._H
        if self._world:
            llx, lly, urx, ury = self._world
            self._ax = W / float(urx - llx or 1)
            self._ay = H / float(ury - lly or 1)
            self._bx = -llx * self._ax
            self._by = H + lly * self._ay
        else:
            self._ax = self._ay = 1.0
            self._bx = W / 2.0
            self._by = H / 2.0

    def _to_cv(self, x, y):
        return (self._bx + x * self._ax, self._by - y * self._ay)

    def _from_cv(self, px, py):
        return ((px - self._bx) / self._ax, (self._by - py) / self._ay)

    def _check(self):
        if self._closed:
            raise Terminator()

    # ------------------------------------------------------------ 화면 설정
    def bgcolor(self, *args):
        if not args:
            return self._bgcolor
        self._bgcolor = self._colorstr(args)
        self.cv.configure(bg=self._color_css(self._bgcolor))

    def bgpic(self, picname=None):
        if picname is None:
            return self._bgpic
        if self._bgpic_item is not None:
            self.cv.delete(self._bgpic_item)
            self._bgpic_item = None
        self._bgpic = picname
        if picname != 'nopic':
            img = TK.PhotoImage(file=picname)
            self._bgpic_img = img
            self._bgpic_item = self.cv.create_image(self._W / 2, self._H / 2, image=img)
            self.cv.tag_lower(self._bgpic_item)

    def mode(self, mode=None):
        if mode is None:
            return self._mode
        mode = mode.lower()
        if mode not in ('standard', 'logo', 'world'):
            raise TurtleGraphicsError('No turtle-graphics-mode %s' % mode)
        self._mode = mode
        if mode in ('standard', 'logo'):
            self._world = None
            self._set_transform()
        self.reset()

    def setworldcoordinates(self, llx, lly, urx, ury):
        if self._mode != 'world':
            self._mode = 'world'
        self._world = (llx, lly, urx, ury)
        self._set_transform()
        for t in self._turtles:
            t._update_sprite()

    def colormode(self, cmode=None):
        if cmode is None:
            return self._colormode
        if cmode == 1.0:
            self._colormode = float(cmode)
        elif cmode == 255:
            self._colormode = int(cmode)

    def delay(self, delay=None):
        if delay is None:
            return self._delayvalue
        self._delayvalue = int(delay)

    def tracer(self, n=None, delay=None):
        if n is None:
            return self._tracing
        self._tracing = int(n)
        self._updatecounter = 0
        if delay is not None:
            self._delayvalue = int(delay)
        if self._tracing:
            self.update()

    def update(self):
        for t in self._turtles:
            t._update_sprite()
        _G.flush()

    def _animate(self):
        return (not _G.HEADLESS) and self._tracing > 0

    def _sleep_frame(self):
        if self._delayvalue > 0:
            _G.sleep(self._delayvalue / 1000.0)
        else:
            _G.flush()
            _G.poll()

    def window_width(self):
        return self._W

    def window_height(self):
        return self._H

    def screensize(self, canvwidth=None, canvheight=None, bg=None):
        if canvwidth is None and canvheight is None and bg is None:
            return (self._canvw, self._canvh)
        if canvwidth:
            self._canvw = canvwidth
        if canvheight:
            self._canvh = canvheight
        if bg is not None:
            self.bgcolor(bg)

    def getcanvas(self):
        return self.cv

    def getshapes(self):
        return sorted(self._shapes.keys())

    def register_shape(self, name, shape=None):
        if shape is None:
            if str(name).lower().endswith('.gif') or str(name).lower().endswith('.png'):
                shape = Shape('image', TK.PhotoImage(file=name))
            else:
                raise TurtleGraphicsError('Bad arguments for register_shape.')
        elif isinstance(shape, tuple):
            shape = Shape('polygon', shape)
        self._shapes[name] = shape

    addshape = register_shape

    def turtles(self):
        return list(self._turtles)

    def clear(self):
        self._closed and self._check()
        for t in list(self._turtles):
            t._clear_all()
        self._turtles = []
        self.cv.delete('all')
        self._bgpic_item = None
        self._bgpic = 'nopic'
        self._bgcolor = 'white'
        self.cv.configure(bg='white')
        self._keys = []

    clearscreen = clear

    def reset(self):
        for t in self._turtles:
            t._setmode(self._mode)
            t.reset()

    resetscreen = reset

    def _colorstr(self, args):
        if len(args) == 1:
            args = args[0]
        if isinstance(args, str):
            return args
        try:
            r, g, b = args
        except (TypeError, ValueError):
            raise TurtleGraphicsError('bad color arguments: %s' % str(args))
        if self._colormode == 1.0:
            if not all(0 <= v <= 1 for v in (r, g, b)):
                raise TurtleGraphicsError('bad color sequence: %s' % str(args))
            r, g, b = [round(255.0 * v) for v in (r, g, b)]
        else:
            if not all(0 <= v <= 255 for v in (r, g, b)):
                raise TurtleGraphicsError('bad color sequence: %s' % str(args))
        return '#%02x%02x%02x' % (int(r), int(g), int(b))

    @staticmethod
    def _color_css(c):
        return _G.color(c)

    def _color_out(self, cstr):
        """pencolor() 가 돌려줄 값: 이름이면 이름, '#rrggbb' 면 현재 colormode 의 튜플"""
        if not cstr.startswith('#'):
            return cstr
        if len(cstr) == 7:
            cl = [int(cstr[i:i + 2], 16) for i in (1, 3, 5)]
        elif len(cstr) == 4:
            cl = [16 * int(cstr[h], 16) for h in cstr[1:]]
        else:
            return cstr
        if self._colormode == 1.0:
            return tuple(c / 255.0 for c in cl)
        return tuple(cl)

    # ------------------------------------------------------------ 이벤트
    def onclick(self, fun, btn=1, add=None):
        if fun is None:
            self.cv.unbind('<Button-%s>' % btn)
            return

        def handler(event):
            x, y = self._from_cv(event.x, event.y)
            fun(x, y)
        self.cv.bind('<Button-%s>' % btn, handler, add)

    onscreenclick = onclick

    def onkeyrelease(self, fun, key):
        seq = '<KeyRelease-%s>' % key if key else '<KeyRelease>'
        if fun is None:
            self.cv.unbind(seq)
            return
        self.cv.bind(seq, lambda e: fun())
        self.cv.winfo_toplevel().bind(seq, lambda e: fun(), '+')

    onkey = onkeyrelease

    def onkeypress(self, fun, key=None):
        seq = '<KeyPress-%s>' % key if key else '<KeyPress>'
        if fun is None:
            self.cv.unbind(seq)
            return
        self.cv.bind(seq, lambda e: fun())

    def listen(self, xdummy=None, ydummy=None):
        self.cv.focus_force()

    def ontimer(self, fun, t=0):
        self.cv.after(t, fun)

    def textinput(self, title, prompt):
        from tkinter import simpledialog
        return simpledialog.askstring(title, prompt, parent=self.cv)

    def numinput(self, title, prompt, default=None, minval=None, maxval=None):
        from tkinter import simpledialog
        return simpledialog.askfloat(title, prompt, initialvalue=default, minvalue=minval, maxvalue=maxval, parent=self.cv)

    def mainloop(self):
        TK.mainloop()

    done = mainloop

    # _Screen 에서 재정의
    def title(self, titlestring):
        pass

    def setup(self, width=None, height=None, startx=None, starty=None):
        pass

    def bye(self):
        pass

    def exitonclick(self):
        self.mainloop()


class _Screen(TurtleScreen):
    _root = None

    def __init__(self):
        root = TK.Tk()
        root.title(_CFG['title'])
        self._root_win = root
        cv = TK.Canvas(root, width=_CFG['width'], height=_CFG['height'], bg='white', highlightthickness=0, borderwidth=0)
        cv.pack(fill=TK.BOTH, expand=True)
        root.protocol('WM_DELETE_WINDOW', self._destroy)
        TurtleScreen.__init__(self, cv)

    def _destroy(self):
        self._closed = True
        _G.quit_loop()
        try:
            self._root_win.destroy()
        except Exception:
            pass
        global _screen
        if _screen is self:
            _screen = None

    def title(self, titlestring):
        self._check()
        self._root_win.title(titlestring)

    def setup(self, width=None, height=None, startx=None, starty=None):
        self._check()
        w = self._W if width is None else width
        h = self._H if height is None else height
        if isinstance(w, float) and 0 <= w <= 1:
            w = int(1920 * w)
        if isinstance(h, float) and 0 <= h <= 1:
            h = int(1080 * h)
        w, h = int(w), int(h)
        self._W, self._H = w, h
        self.cv.configure(width=w, height=h)
        self._root_win.geometry('%dx%d' % (w, h))
        self._set_transform()
        for t in self._turtles:
            t._update_sprite()

    def bye(self):
        self._destroy()

    def exitonclick(self):
        def exitGracefully(x, y):
            self.bye()
        self.onclick(exitGracefully)
        self.mainloop()


_screen = None


def Screen():
    global _screen
    if _screen is None or _screen._closed:
        _screen = _Screen()
    return _screen


class ScrolledCanvas(TK.Canvas):
    def __init__(self, master, width=500, height=350, canvwidth=600, canvheight=500):
        TK.Canvas.__init__(self, master, width=width, height=height, bg='white')


# ====================================================================== 거북이
class RawTurtle:
    screens = []

    def __init__(self, canvas=None, shape=None, undobuffersize=None, visible=None):
        if isinstance(canvas, _Screen) or isinstance(canvas, TurtleScreen):
            self.screen = canvas
        elif isinstance(canvas, TK.Canvas):
            scr = None
            for s in RawTurtle.screens:
                if s.cv is canvas:
                    scr = s
            if scr is None:
                scr = TurtleScreen(canvas)
                RawTurtle.screens.append(scr)
            self.screen = scr
        else:
            self.screen = Screen()
        self.screen._check()
        self.screen._turtles.append(self)
        self._shape = shape or _CFG['shape']
        self._visible = _CFG['visible'] if visible is None else visible
        self._sprite = None
        self._items = []
        self._stamps = []
        self._line = None
        self._linepts = []
        self._poly = None
        self._init_state()
        self._update_sprite()

    def _init_state(self):
        self._x = 0.0
        self._y = 0.0
        self._angle = 0.0   # 표준 모드 기준 각도(동쪽 0, 반시계)
        self._fullcircle = 360.0
        self._degreesPerAU = 1.0
        self._pendown = True
        self._pensize = 1
        self._pencolor = _CFG['pencolor']
        self._fillcolor = _CFG['fillcolor']
        self._speed = 3
        self._stretch = (1.0, 1.0)
        self._outline = 1
        self._tilt = 0.0
        self._filling = False
        self._fillpath = None
        self._fillitem = None
        self._resizemode = _CFG['resizemode']
        self._setmode(self.screen._mode)

    def _setmode(self, mode):
        self._mode = mode
        if mode == 'logo':
            self._angle = 90.0 if not hasattr(self, '_angle') or self._angle == 0 else self._angle

    # ------------------------------------------------------------ 화면 반영
    def _css(self, c):
        return _G.color(c)

    def _sprite_coords(self):
        sh = self.screen._shapes.get(self._shape)
        if sh is None or sh._type != 'polygon':
            return []
        poly = sh._data
        if not poly:
            return []
        sw, sl = self._stretch
        th = math.radians(self._angle + self._tilt)
        e0, e1 = math.cos(th), math.sin(th)
        px, py = self.screen._to_cv(self._x, self._y)
        out = []
        for (x, y) in poly:
            x, y = x * sw, y * sl
            # (x, y) 를 방향에 맞게 회전: shape 의 +y 가 진행 방향
            wx = e0 * y + e1 * x
            wy = e1 * y - e0 * x
            out.extend((px + wx, py - wy))
        return out

    def _update_sprite(self):
        scr = self.screen
        if scr._closed:
            return
        sh = scr._shapes.get(self._shape)
        cv = scr.cv
        if not self._visible or sh is None:
            if self._sprite is not None:
                cv.itemconfigure(self._sprite, state='hidden')
            return
        if sh._type == 'image':
            px, py = scr._to_cv(self._x, self._y)
            if self._sprite is None or cv.type(self._sprite) != 'image':
                if self._sprite is not None:
                    cv.delete(self._sprite)
                self._sprite = cv.create_image(px, py, image=sh._data, _top=True)
            else:
                cv.coords(self._sprite, px, py)
                cv.itemconfigure(self._sprite, image=sh._data, state='normal')
            return
        coords = self._sprite_coords()
        if not coords:
            if self._sprite is not None:
                cv.itemconfigure(self._sprite, state='hidden')
            return
        if self._sprite is None or cv.type(self._sprite) != 'polygon':
            if self._sprite is not None:
                cv.delete(self._sprite)
            self._sprite = cv.create_polygon(coords, fill=self._css(self._fillcolor), outline=self._css(self._pencolor),
                                             width=self._outline, _top=True)
        else:
            cv.coords(self._sprite, coords)
            cv.itemconfigure(self._sprite, fill=self._css(self._fillcolor), outline=self._css(self._pencolor),
                             width=self._outline, state='normal')

    def _new_line(self):
        self._line = None
        self._linepts = []

    def _line_to(self, x0, y0, x1, y1, final=True):
        """현재 선 항목에 점을 이어 붙인다 (움직이는 중에는 마지막 점만 바꾼다)"""
        scr = self.screen
        cv = scr.cv
        p0 = scr._to_cv(x0, y0)
        p1 = scr._to_cv(x1, y1)
        if self._line is None or len(self._linepts) > 80:
            self._line = cv.create_line(p0[0], p0[1], p1[0], p1[1], fill=self._css(self._pencolor), width=self._pensize,
                                        capstyle='round', joinstyle='round')
            self._items.append(self._line)
            self._linepts = [p0, p1]
            self._line_open = not final
            return
        if getattr(self, '_line_open', False):
            self._linepts[-1] = p1
        else:
            self._linepts.append(p1)
        self._line_open = not final
        cv.coords(self._line, [c for p in self._linepts for c in p])

    # ------------------------------------------------------------ 이동
    def _goto(self, x, y):
        scr = self.screen
        scr._check()
        x0, y0 = self._x, self._y
        dist = math.hypot(x - x0, y - y0)
        if self._fillpath is not None:
            self._fillpath.append((x, y))
        if self._poly is not None:
            self._poly.append((x, y))
        if self._speed > 0 and scr._animate() and dist > 0:
            speed = self._speed
            nhops = 1 + int(dist / (3 * (1.1 ** speed) * speed))
            for i in range(1, nhops + 1):
                t = i / nhops
                cx, cy = x0 + (x - x0) * t, y0 + (y - y0) * t
                self._x, self._y = cx, cy
                if self._pendown:
                    self._line_to(x0, y0, cx, cy, final=(i == nhops))
                self._update_sprite()
                self._update_fill()
                scr._sleep_frame()
                scr._check()
        else:
            self._x, self._y = x, y
            if self._pendown and dist > 0:
                self._line_to(x0, y0, x, y)
            self._update_sprite()
            self._update_fill()
            if scr._tracing and not _G.HEADLESS:
                scr._updatecounter += 1
        self._x, self._y = float(x), float(y)

    def _update_fill(self):
        if self._fillitem is not None and self._fillpath is not None and len(self._fillpath) > 2:
            pts = self._fillpath + [(self._x, self._y)]
            self.screen.cv.coords(self._fillitem, [c for p in pts for c in self.screen._to_cv(*p)])

    def _rotate(self, angle):
        scr = self.screen
        scr._check()
        angle_deg = angle * self._degreesPerAU
        if self._mode == 'logo':
            angle_deg = -angle_deg
        if self._speed > 0 and scr._animate() and self._visible:
            anglevel = 3.0 * self._speed
            steps = 1 + int(abs(angle_deg) / anglevel)
            delta = angle_deg / steps
            for _ in range(steps):
                self._angle += delta
                self._update_sprite()
                scr._sleep_frame()
                scr._check()
        else:
            self._angle += angle_deg
            self._update_sprite()
        self._angle %= 360.0

    def forward(self, distance):
        th = math.radians(self._angle)
        self._goto(self._x + distance * math.cos(th), self._y + distance * math.sin(th))

    fd = forward

    def back(self, distance):
        self.forward(-distance)

    bk = backward = back

    def right(self, angle):
        self._rotate(-angle)

    rt = right

    def left(self, angle):
        self._rotate(angle)

    lt = left

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._goto(float(x), float(y))

    setpos = setposition = goto

    def teleport(self, x=None, y=None, *, fill_gap=False):
        pd = self._pendown
        self._pendown = False
        self._new_line()
        self._goto(self._x if x is None else x, self._y if y is None else y)
        self._pendown = pd
        self._new_line()

    def setx(self, x):
        self._goto(float(x), self._y)

    def sety(self, y):
        self._goto(self._x, float(y))

    def home(self):
        self.goto(0, 0)
        self.setheading(0)

    def setheading(self, to_angle):
        cur = self.heading()
        full = self._fullcircle
        angle = (to_angle - cur) % full
        if angle > full / 2.0:
            angle -= full
        if self._mode == 'logo':
            angle = -angle
        self._rotate(angle)

    seth = setheading

    def circle(self, radius, extent=None, steps=None):
        speed = self._speed
        if extent is None:
            extent = self._fullcircle
        if steps is None:
            frac = abs(extent) / self._fullcircle
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = 1.0 * extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * math.sin(math.radians(w2) * self._degreesPerAU)
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        self._speed = 0
        self._rotate(w2)
        for _ in range(steps):
            self._speed = speed
            self.forward(l)
            self._speed = 0
            self._rotate(w)
        self._rotate(-w2)
        self._speed = speed
        self._update_sprite()

    def speed(self, speed=None):
        if speed is None:
            return self._speed
        if speed in _SPEEDS:
            speed = _SPEEDS[speed]
        elif isinstance(speed, str):
            raise TurtleGraphicsError('bad speed: %s' % speed)
        speed = float(speed)
        if 0.5 < speed < 10.5:
            speed = int(round(speed))
        else:
            speed = 0
        self._speed = speed

    # ------------------------------------------------------------ 상태
    def position(self):
        return Vec2D(self._x, self._y)

    pos = position

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def heading(self):
        a = self._angle % 360.0
        if self._mode == 'logo':
            a = (90.0 - a) % 360.0
        v = a / self._degreesPerAU
        return round(v, 10) % self._fullcircle

    def towards(self, x, y=None):
        if y is None:
            x, y = x
        dx, dy = x - self._x, y - self._y
        result = round(math.degrees(math.atan2(dy, dx)), 10) % 360.0
        if self._mode == 'logo':
            result = (90.0 - result) % 360.0
        return (result / self._degreesPerAU) % self._fullcircle

    def distance(self, x, y=None):
        if y is None:
            if isinstance(x, RawTurtle):
                x, y = x._x, x._y
            else:
                x, y = x
        return math.hypot(x - self._x, y - self._y)

    def degrees(self, fullcircle=360.0):
        self._fullcircle = fullcircle
        self._degreesPerAU = 360.0 / fullcircle

    def radians(self):
        self.degrees(2 * math.pi)

    def pendown(self):
        if not self._pendown:
            self._pendown = True
            self._new_line()

    pd = down = pendown

    def penup(self):
        self._pendown = False
        self._new_line()

    pu = up = penup

    def isdown(self):
        return self._pendown

    def pensize(self, width=None):
        if width is None:
            return self._pensize
        self._pensize = width
        self._new_line()

    width = pensize

    def pencolor(self, *args):
        if not args:
            return self.screen._color_out(self._pencolor)
        self._pencolor = self.screen._colorstr(args)
        self._new_line()
        self._update_sprite()

    def fillcolor(self, *args):
        if not args:
            return self.screen._color_out(self._fillcolor)
        self._fillcolor = self.screen._colorstr(args)
        self._update_sprite()

    def color(self, *args):
        if not args:
            return self.pencolor(), self.fillcolor()
        if len(args) == 1:
            pc = fc = self.screen._colorstr(args)
        elif len(args) == 2:
            pc, fc = self.screen._colorstr((args[0],)), self.screen._colorstr((args[1],))
        elif len(args) == 3:
            pc = fc = self.screen._colorstr(args)
        else:
            raise TurtleGraphicsError('bad color arguments')
        self._pencolor, self._fillcolor = pc, fc
        self._new_line()
        self._update_sprite()

    def pen(self, pen=None, **pendict):
        cur = {'shown': self._visible, 'pendown': self._pendown, 'pencolor': self.pencolor(),
               'fillcolor': self.fillcolor(), 'pensize': self._pensize, 'speed': self._speed,
               'resizemode': self._resizemode, 'stretchfactor': self._stretch, 'outline': self._outline, 'tilt': self._tilt}
        if pen is None and not pendict:
            return cur
        p = dict(pen or {})
        p.update(pendict)
        if 'shown' in p:
            self._visible = bool(p['shown'])
        if 'pendown' in p:
            (self.pendown if p['pendown'] else self.penup)()
        if 'pencolor' in p:
            self.pencolor(p['pencolor'])
        if 'fillcolor' in p:
            self.fillcolor(p['fillcolor'])
        if 'pensize' in p:
            self.pensize(p['pensize'])
        if 'speed' in p:
            self.speed(p['speed'])
        if 'stretchfactor' in p:
            self._stretch = tuple(p['stretchfactor'])
        if 'outline' in p:
            self._outline = p['outline']
        self._update_sprite()

    def showturtle(self):
        self._visible = True
        self._update_sprite()

    st = showturtle

    def hideturtle(self):
        self._visible = False
        self._update_sprite()

    ht = hideturtle

    def isvisible(self):
        return self._visible

    def shape(self, name=None):
        if name is None:
            return self._shape
        if name not in self.screen._shapes:
            raise TurtleGraphicsError('There is no shape named %s' % name)
        self._shape = name
        self._update_sprite()

    def shapesize(self, stretch_wid=None, stretch_len=None, outline=None):
        if stretch_wid is None and stretch_len is None and outline is None:
            return (self._stretch[0], self._stretch[1], self._outline)
        if stretch_wid == 0 or stretch_len == 0:
            raise TurtleGraphicsError('stretch_wid/stretch_len must not be zero')
        if stretch_wid is not None:
            if stretch_len is None:
                self._stretch = (stretch_wid, stretch_wid)
            else:
                self._stretch = (stretch_wid, stretch_len)
        elif stretch_len is not None:
            self._stretch = (self._stretch[0], stretch_len)
        if outline is not None:
            self._outline = outline
        self._resizemode = 'user'
        self._update_sprite()

    turtlesize = shapesize

    def resizemode(self, rmode=None):
        if rmode is None:
            return self._resizemode
        self._resizemode = rmode

    def shearfactor(self, shear=None):
        return 0.0 if shear is None else None

    def settiltangle(self, angle):
        self._tilt = -angle * self._degreesPerAU
        self._update_sprite()

    def tiltangle(self, angle=None):
        if angle is None:
            return (-self._tilt / self._degreesPerAU) % self._fullcircle
        self.settiltangle(angle)

    def tilt(self, angle):
        self.settiltangle(angle + self.tiltangle())

    def shapetransform(self, t11=None, t12=None, t21=None, t22=None):
        return (1.0, 0.0, 0.0, 1.0)

    def get_shapepoly(self):
        sh = self.screen._shapes.get(self._shape)
        return tuple(sh._data) if sh and sh._type == 'polygon' else None

    # ------------------------------------------------------------ 그리기
    def dot(self, size=None, *color):
        if not color:
            if isinstance(size, (str, tuple)):
                color = self.screen._colorstr((size,))
                size = self._pensize + max(self._pensize, 4)
            else:
                color = self._pencolor
                if not size:
                    size = self._pensize + max(self._pensize, 4)
        else:
            if size is None:
                size = self._pensize + max(self._pensize, 4)
            color = self.screen._colorstr(color)
        scr = self.screen
        px, py = scr._to_cv(self._x, self._y)
        r = size / 2.0
        item = scr.cv.create_oval(px - r, py - r, px + r, py + r, fill=self._css(color), outline='')
        self._items.append(item)
        self._new_line()
        if scr._animate():
            _G.flush()

    def stamp(self):
        scr = self.screen
        sh = scr._shapes.get(self._shape)
        if sh is not None and sh._type == 'image':
            px, py = scr._to_cv(self._x, self._y)
            item = scr.cv.create_image(px, py, image=sh._data)
        else:
            coords = self._sprite_coords()
            if not coords:
                return None
            item = scr.cv.create_polygon(coords, fill=self._css(self._fillcolor), outline=self._css(self._pencolor),
                                         width=self._outline)
        self._stamps.append(item)
        self._items.append(item)
        self._new_line()
        return item

    def clearstamp(self, stampid):
        if stampid in self._stamps:
            self.screen.cv.delete(stampid)
            self._stamps.remove(stampid)

    def clearstamps(self, n=None):
        if n is None:
            todo = list(self._stamps)
        elif n >= 0:
            todo = self._stamps[:n]
        else:
            todo = self._stamps[n:]
        for s in todo:
            self.clearstamp(s)

    def write(self, arg, move=False, align='left', font=('Arial', 8, 'normal')):
        scr = self.screen
        scr._check()
        px, py = scr._to_cv(self._x, self._y)
        anchor = {'left': 'sw', 'center': 's', 'right': 'se'}.get(align, 'sw')
        item = scr.cv.create_text(px, py - 1, text=str(arg), anchor=anchor, fill=self._css(self._pencolor), font=font)
        self._items.append(item)
        self._new_line()
        if move:
            w, _h = TK._text_extent(str(arg), font)
            self._goto(self._x + w / scr._ax, self._y)
        if scr._animate():
            _G.flush()

    def begin_fill(self):
        if self._filling:
            return
        self._filling = True
        self._fillpath = [(self._x, self._y)]
        self._fillitem = self.screen.cv.create_polygon(0, 0, 0, 0, 0, 0, fill='', outline='')
        self._items.append(self._fillitem)
        self._new_line()

    def end_fill(self):
        if not self._filling:
            return
        pts = self._fillpath
        if pts and len(pts) > 2 and self._fillitem is not None:
            coords = [c for p in pts for c in self.screen._to_cv(*p)]
            self.screen.cv.coords(self._fillitem, coords)
            self.screen.cv.itemconfigure(self._fillitem, fill=self._css(self._fillcolor), outline='')
        self._filling = False
        self._fillpath = None
        self._fillitem = None
        self._new_line()

    def filling(self):
        return self._filling

    def fill(self, flag=None):
        if flag is None:
            return self._filling
        (self.begin_fill if flag else self.end_fill)()

    def begin_poly(self):
        self._poly = [(self._x, self._y)]

    def end_poly(self):
        self._polydone = self._poly
        self._poly = None

    def get_poly(self):
        p = getattr(self, '_polydone', None)
        return tuple(Vec2D(*q) for q in p) if p else None

    def _clear_all(self):
        cv = self.screen.cv
        if self._items:
            cv.delete(*self._items)
        self._items = []
        self._stamps = []
        self._new_line()

    def clear(self):
        self._clear_all()
        self._fillpath = [(self._x, self._y)] if self._filling else None

    def reset(self):
        self._clear_all()
        if self._sprite is not None:
            self.screen.cv.delete(self._sprite)
            self._sprite = None
        self._shape = _CFG['shape'] if self._shape not in self.screen._shapes else self._shape
        self._init_state()
        self._update_sprite()

    def undo(self):
        pass

    def setundobuffer(self, size):
        pass

    def undobufferentries(self):
        return 0

    def clone(self):
        t = type(self)(self.screen) if isinstance(self, Turtle) else RawTurtle(self.screen)
        for k in ('_x', '_y', '_angle', '_pendown', '_pensize', '_pencolor', '_fillcolor', '_speed', '_stretch',
                  '_outline', '_tilt', '_shape', '_visible', '_mode', '_fullcircle', '_degreesPerAU'):
            setattr(t, k, getattr(self, k))
        t._update_sprite()
        return t

    def getscreen(self):
        return self.screen

    def getturtle(self):
        return self

    getpen = getturtle

    # ------------------------------------------------------------ 이벤트
    def _bind_item(self, seq, fun, add):
        scr = self.screen
        if self._sprite is None:
            self._update_sprite()
        if self._sprite is None:
            return
        if fun is None:
            scr.cv.tag_unbind(self._sprite, seq)
            return

        def handler(event):
            x, y = scr._from_cv(event.x, event.y)
            fun(x, y)
        scr.cv.tag_bind(self._sprite, seq, handler, add)

    def onclick(self, fun, btn=1, add=None):
        self._bind_item('<Button-%s>' % btn, fun, add)

    def onrelease(self, fun, btn=1, add=None):
        self._bind_item('<ButtonRelease-%s>' % btn, fun, add)

    def ondrag(self, fun, btn=1, add=None):
        self._bind_item('<Button%s-Motion>' % btn, fun, add)

    def _update(self):
        self._update_sprite()


RawPen = RawTurtle


class Turtle(RawTurtle):
    _pen = None
    _screen = None

    def __init__(self, shape=_CFG['shape'], undobuffersize=_CFG['undobuffersize'], visible=_CFG['visible']):
        RawTurtle.__init__(self, Screen(), shape=shape, undobuffersize=undobuffersize, visible=visible)


Pen = Turtle


def _getpen():
    if Turtle._pen is None or Turtle._pen.screen._closed:
        Turtle._pen = Turtle()
    return Turtle._pen


def _getscreen():
    return Screen()


def _reset_module():
    global _screen
    _screen = None
    Turtle._pen = None
    RawTurtle.screens = []


def write_docstringdict(filename='turtle_docstringdict'):
    pass


_tg_screen_functions = ['addshape', 'bgcolor', 'bgpic', 'bye', 'clearscreen', 'colormode', 'delay', 'exitonclick',
                        'getcanvas', 'getshapes', 'listen', 'mainloop', 'mode', 'numinput', 'onkey', 'onkeypress',
                        'onkeyrelease', 'onscreenclick', 'ontimer', 'register_shape', 'resetscreen', 'screensize',
                        'setup', 'setworldcoordinates', 'textinput', 'title', 'tracer', 'turtles', 'update',
                        'window_height', 'window_width', 'done']
_tg_turtle_functions = ['back', 'backward', 'begin_fill', 'begin_poly', 'bk', 'circle', 'clear', 'clearstamp',
                        'clearstamps', 'clone', 'color', 'degrees', 'distance', 'dot', 'down', 'end_fill', 'end_poly',
                        'fd', 'fillcolor', 'filling', 'forward', 'get_poly', 'getpen', 'getscreen', 'get_shapepoly',
                        'getturtle', 'goto', 'heading', 'hideturtle', 'home', 'ht', 'isdown', 'isvisible', 'left',
                        'lt', 'onclick', 'ondrag', 'onrelease', 'pd', 'pen', 'pencolor', 'pendown', 'pensize',
                        'penup', 'pos', 'position', 'pu', 'radians', 'right', 'reset', 'resizemode', 'rt', 'seth',
                        'setheading', 'setpos', 'setposition', 'settiltangle', 'setundobuffer', 'setx', 'sety',
                        'shape', 'shapesize', 'shapetransform', 'shearfactor', 'showturtle', 'speed', 'st', 'stamp',
                        'teleport', 'tilt', 'tiltangle', 'towards', 'turtlesize', 'undo', 'undobufferentries', 'up',
                        'width', 'write', 'xcor', 'ycor', 'fill']


def _make_screen_func(name):
    def f(*args, **kw):
        return getattr(Screen(), name)(*args, **kw)
    f.__name__ = name
    return f


def _make_turtle_func(name):
    def f(*args, **kw):
        return getattr(_getpen(), name)(*args, **kw)
    f.__name__ = name
    return f


for _n in _tg_screen_functions:
    globals()[_n] = _make_screen_func(_n)
for _n in _tg_turtle_functions:
    globals()[_n] = _make_turtle_func(_n)
__all__ += _tg_screen_functions + _tg_turtle_functions + ['write_docstringdict']
del _n


if __name__ == '__main__':
    t = Turtle()
    t.circle(50)
    done()
