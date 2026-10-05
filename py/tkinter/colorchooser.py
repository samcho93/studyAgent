"""tkinter.colorchooser 호환"""
import _webgui as _G


def askcolor(color=None, **options):
    r = _G.request('color', title=str(options.get('title') or '색 선택'), initial=_G.color(color) or '#000000')
    if not r:
        return (None, None)
    r = str(r)
    return ((int(r[1:3], 16), int(r[3:5], 16), int(r[5:7], 16)), r)


class Chooser:
    def __init__(self, master=None, **options):
        self.options = options

    def show(self, color=None, **options):
        return askcolor(color, **dict(self.options, **options))
