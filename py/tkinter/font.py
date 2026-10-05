"""tkinter.font 호환 (간단)"""
import _webgui as _G

NORMAL = 'normal'
ROMAN = 'roman'
BOLD = 'bold'
ITALIC = 'italic'


class Font:
    def __init__(self, root=None, font=None, name=None, exists=False, **options):
        self.options = {'family': 'TkDefaultFont', 'size': 9, 'weight': 'normal', 'slant': 'roman', 'underline': 0, 'overstrike': 0}
        if font is not None and isinstance(font, (tuple, list)):
            if len(font) > 0:
                self.options['family'] = font[0]
            if len(font) > 1:
                self.options['size'] = font[1]
            for s in font[2:]:
                for w in str(s).split():
                    if w == 'bold':
                        self.options['weight'] = 'bold'
                    if w == 'italic':
                        self.options['slant'] = 'italic'
        self.options.update(options)
        self.name = name or _G.new_id('font')

    def _tuple(self):
        st = []
        if self.options.get('weight') == 'bold':
            st.append('bold')
        if self.options.get('slant') == 'italic':
            st.append('italic')
        if self.options.get('underline'):
            st.append('underline')
        if self.options.get('overstrike'):
            st.append('overstrike')
        return (self.options['family'], self.options['size']) + ((' '.join(st),) if st else ())

    def _css(self):
        return _G.font_css(self._tuple())

    def __str__(self):
        return self.name

    def actual(self, option=None, displayof=None):
        return self.options.get(option) if option else dict(self.options)

    def cget(self, option):
        return self.options.get(option)

    __getitem__ = cget

    def configure(self, **options):
        if not options:
            return dict(self.options)
        self.options.update(options)

    config = configure

    def __setitem__(self, k, v):
        self.options[k] = v

    def copy(self):
        return Font(**self.options)

    def measure(self, text, displayof=None):
        px = _G.font_px(self._tuple())
        return int(sum(px * (1.0 if ord(c) > 0x2E80 else 0.58) for c in str(text)))

    def metrics(self, *options, **kw):
        px = _G.font_px(self._tuple())
        m = {'ascent': int(px * 0.8), 'descent': int(px * 0.2), 'linespace': int(px * 1.2), 'fixed': 0}
        return m.get(options[0]) if options else m


def families(root=None, displayof=None):
    return ('Arial', 'Courier New', 'Times New Roman', '맑은 고딕', '굴림', '궁서', '돋움', '바탕')


def names(root=None):
    return ('TkDefaultFont', 'TkTextFont', 'TkFixedFont', 'TkMenuFont', 'TkHeadingFont')


def nametofont(name, root=None):
    return Font(name=name, font=('TkDefaultFont', 9))
