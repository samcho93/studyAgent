"""pygame.sprite 호환 (기본 기능)"""


class Sprite:
    def __init__(self, *groups):
        self.__g = {}
        if groups:
            self.add(*groups)

    def add(self, *groups):
        for g in groups:
            if isinstance(g, AbstractGroup):
                if g not in self.__g:
                    g.add_internal(self)
                    self.add_internal(g)
            else:
                self.add(*g)

    def remove(self, *groups):
        for g in groups:
            if isinstance(g, AbstractGroup):
                if g in self.__g:
                    g.remove_internal(self)
                    self.remove_internal(g)
            else:
                self.remove(*g)

    def add_internal(self, group):
        self.__g[group] = 0

    def remove_internal(self, group):
        self.__g.pop(group, None)

    def update(self, *args, **kwargs):
        pass

    def kill(self):
        for g in list(self.__g):
            g.remove_internal(self)
        self.__g.clear()

    def groups(self):
        return list(self.__g)

    def alive(self):
        return bool(self.__g)

    def __repr__(self):
        return '<%s Sprite(in %d groups)>' % (self.__class__.__name__, len(self.__g))


DirtySprite = Sprite


class AbstractGroup:
    _spritegroup = True

    def __init__(self):
        self.spritedict = {}
        self.lostsprites = []

    def sprites(self):
        return list(self.spritedict)

    def add_internal(self, sprite, layer=None):
        self.spritedict[sprite] = None

    def remove_internal(self, sprite):
        self.spritedict.pop(sprite, None)

    def has_internal(self, sprite):
        return sprite in self.spritedict

    def copy(self):
        return self.__class__(self.sprites())

    def __iter__(self):
        return iter(self.sprites())

    def __contains__(self, sprite):
        return self.has(sprite)

    def add(self, *sprites):
        for s in sprites:
            if isinstance(s, Sprite):
                if not self.has_internal(s):
                    self.add_internal(s)
                    s.add_internal(self)
            else:
                self.add(*s)

    def remove(self, *sprites):
        for s in sprites:
            if isinstance(s, Sprite):
                if self.has_internal(s):
                    self.remove_internal(s)
                    s.remove_internal(self)
            else:
                self.remove(*s)

    def has(self, *sprites):
        if not sprites:
            return False
        for s in sprites:
            if isinstance(s, Sprite):
                if not self.has_internal(s):
                    return False
            elif not self.has(*s):
                return False
        return True

    def update(self, *args, **kwargs):
        for s in self.sprites():
            s.update(*args, **kwargs)

    def draw(self, surface, bgsurf=None, special_flags=0):
        out = []
        for s in self.sprites():
            out.append(surface.blit(s.image, s.rect))
        return out

    def clear(self, surface, bgd):
        pass

    def empty(self):
        for s in self.sprites():
            self.remove_internal(s)
            s.remove_internal(self)

    def __bool__(self):
        return bool(self.sprites())

    def __len__(self):
        return len(self.sprites())

    def __repr__(self):
        return '<%s(%d sprites)>' % (self.__class__.__name__, len(self))


class Group(AbstractGroup):
    def __init__(self, *sprites):
        AbstractGroup.__init__(self)
        self.add(*sprites)


RenderPlain = RenderClear = RenderUpdates = OrderedUpdates = LayeredUpdates = LayeredDirty = Group


class GroupSingle(AbstractGroup):
    def __init__(self, sprite=None):
        AbstractGroup.__init__(self)
        self.__sprite = None
        if sprite is not None:
            self.add(sprite)

    def sprites(self):
        return [self.__sprite] if self.__sprite is not None else []

    def add_internal(self, sprite, layer=None):
        if self.__sprite is not None:
            self.__sprite.remove_internal(self)
        self.__sprite = sprite

    def remove_internal(self, sprite):
        if sprite is self.__sprite:
            self.__sprite = None

    def has_internal(self, sprite):
        return self.__sprite is sprite

    @property
    def sprite(self):
        return self.__sprite

    @sprite.setter
    def sprite(self, s):
        self.add(s)


def collide_rect(left, right):
    return left.rect.colliderect(right.rect)


class collide_rect_ratio:
    def __init__(self, ratio):
        self.ratio = ratio

    def __call__(self, left, right):
        r = self.ratio
        a = left.rect.inflate(left.rect.w * r - left.rect.w, left.rect.h * r - left.rect.h)
        b = right.rect.inflate(right.rect.w * r - right.rect.w, right.rect.h * r - right.rect.h)
        return a.colliderect(b)


def collide_circle(left, right):
    def radius(s):
        if hasattr(s, 'radius'):
            return s.radius
        return 0.5 * ((s.rect.w ** 2 + s.rect.h ** 2) ** 0.5)
    dx = left.rect.centerx - right.rect.centerx
    dy = left.rect.centery - right.rect.centery
    return dx * dx + dy * dy <= (radius(left) + radius(right)) ** 2


def collide_mask(left, right):
    return collide_rect(left, right)


def spritecollide(sprite, group, dokill, collided=None):
    collided = collided or collide_rect
    hits = [s for s in group.sprites() if collided(sprite, s)]
    if dokill:
        for s in hits:
            s.kill()
    return hits


def spritecollideany(sprite, group, collided=None):
    collided = collided or collide_rect
    for s in group.sprites():
        if collided(sprite, s):
            return s
    return None


def groupcollide(groupa, groupb, dokilla, dokillb, collided=None):
    out = {}
    for s in groupa.sprites():
        hits = spritecollide(s, groupb, dokillb, collided)
        if hits:
            out[s] = hits
            if dokilla:
                s.kill()
    return out
