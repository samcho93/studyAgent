"""pygame.math 호환 (Vector2, Vector3 기본 기능)"""
import math as _m


class Vector2:
    __slots__ = ('x', 'y')

    def __init__(self, x=0.0, y=None):
        if y is None:
            if isinstance(x, (tuple, list, Vector2)):
                x, y = x[0], x[1]
            else:
                y = x
        self.x, self.y = float(x), float(y)

    def __getitem__(self, i):
        return (self.x, self.y)[i]

    def __setitem__(self, i, v):
        if i == 0:
            self.x = float(v)
        else:
            self.y = float(v)

    def __iter__(self):
        return iter((self.x, self.y))

    def __len__(self):
        return 2

    def __add__(self, o):
        return Vector2(self.x + o[0], self.y + o[1])

    __radd__ = __add__

    def __sub__(self, o):
        return Vector2(self.x - o[0], self.y - o[1])

    def __rsub__(self, o):
        return Vector2(o[0] - self.x, o[1] - self.y)

    def __mul__(self, k):
        if isinstance(k, (Vector2, tuple, list)):
            return self.x * k[0] + self.y * k[1]
        return Vector2(self.x * k, self.y * k)

    __rmul__ = __mul__

    def __truediv__(self, k):
        return Vector2(self.x / k, self.y / k)

    def __neg__(self):
        return Vector2(-self.x, -self.y)

    def __eq__(self, o):
        try:
            return self.x == o[0] and self.y == o[1]
        except Exception:
            return False

    def __repr__(self):
        return 'Vector2(%g, %g)' % (self.x, self.y)

    def length(self):
        return _m.hypot(self.x, self.y)

    magnitude = length

    def length_squared(self):
        return self.x * self.x + self.y * self.y

    def normalize(self):
        l = self.length()
        return Vector2(self.x / l, self.y / l)

    def normalize_ip(self):
        l = self.length()
        self.x /= l
        self.y /= l

    def scale_to_length(self, n):
        l = self.length()
        self.x, self.y = self.x / l * n, self.y / l * n

    def distance_to(self, o):
        return _m.hypot(self.x - o[0], self.y - o[1])

    def dot(self, o):
        return self.x * o[0] + self.y * o[1]

    def rotate(self, deg):
        a = _m.radians(deg)
        c, s = _m.cos(a), _m.sin(a)
        return Vector2(self.x * c - self.y * s, self.x * s + self.y * c)

    def angle_to(self, o):
        return _m.degrees(_m.atan2(o[1], o[0]) - _m.atan2(self.y, self.x))

    def copy(self):
        return Vector2(self.x, self.y)

    def update(self, x=0, y=None):
        v = Vector2(x, y)
        self.x, self.y = v.x, v.y


class Vector3(Vector2):
    pass
