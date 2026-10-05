"""tkinter.scrolledtext 호환"""
from tkinter import Text


class ScrolledText(Text):
    def __init__(self, master=None, **kw):
        Text.__init__(self, master, **kw)
        self.frame = self
        self.vbar = None
