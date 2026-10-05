"""tkinter.simpledialog 호환 (브라우저 입력 대화상자)"""
import _webgui as _G
from tkinter import *  # noqa


def _ask(kind, title, prompt, **kw):
    init = kw.get('initialvalue')
    return _G.request(kind, title='' if title is None else str(title), message='' if prompt is None else str(prompt),
                      initial='' if init is None else str(init),
                      min=kw.get('minvalue'), max=kw.get('maxvalue'), show=kw.get('show'))


def askinteger(title, prompt, **kw):
    r = _ask('askinteger', title, prompt, **kw)
    if r is None or r == '':
        return None
    return int(r)


def askfloat(title, prompt, **kw):
    r = _ask('askfloat', title, prompt, **kw)
    if r is None or r == '':
        return None
    return float(r)


def askstring(title, prompt, **kw):
    r = _ask('askstring', title, prompt, **kw)
    if r is None:
        return None
    return str(r)


class Dialog(Toplevel):
    """사용자 정의 대화상자 기반 클래스 (간단 호환)"""
    def __init__(self, parent, title=None):
        Toplevel.__init__(self, parent)
        if title:
            self.title(title)
        self.parent = parent
        self.result = None
        body = Frame(self)
        self.initial_focus = self.body(body)
        body.pack(padx=5, pady=5)
        self.buttonbox()
        self.wait_window(self)

    def body(self, master):
        pass

    def buttonbox(self):
        box = Frame(self)
        Button(box, text='OK', width=10, command=self.ok).pack(side=LEFT, padx=5, pady=5)
        Button(box, text='Cancel', width=10, command=self.cancel).pack(side=LEFT, padx=5, pady=5)
        box.pack()

    def ok(self, event=None):
        if not self.validate():
            return
        self.apply()
        self.destroy()

    def cancel(self, event=None):
        self.destroy()

    def validate(self):
        return 1

    def apply(self):
        pass


class SimpleDialog:
    def __init__(self, master, text='', buttons=[], default=None, cancel=None, title=None, class_=None):
        self.text, self.buttons, self.title = text, buttons, title

    def go(self):
        r = _G.request('question', title=self.title or '', message=self.text)
        return 0 if r in (True, 'yes') else 1
