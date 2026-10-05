"""tkinter.ttk 호환 (기본 위젯과 같은 모양으로 그린다)"""
import tkinter as _tk
import _webgui as _G
from tkinter import (Tk, Toplevel, Frame, Label, Button, Checkbutton, Radiobutton, Entry, Scale, Scrollbar, Menubutton,  # noqa
                     Spinbox, LabelFrame, PanedWindow, OptionMenu as _OM, Widget)

__all__ = ['Button', 'Checkbutton', 'Combobox', 'Entry', 'Frame', 'Label', 'Labelframe', 'LabelFrame', 'Menubutton',
           'Notebook', 'Panedwindow', 'PanedWindow', 'Progressbar', 'Radiobutton', 'Scale', 'Scrollbar', 'Separator',
           'Sizegrip', 'Spinbox', 'Style', 'Treeview', 'OptionMenu']

Labelframe = LabelFrame
Panedwindow = PanedWindow


def _strip(kw):
    for k in ('style', 'bootstyle', 'padding'):
        kw.pop(k, None)
    return kw


class Style:
    def __init__(self, master=None):
        pass

    def configure(self, style, query_opt=None, **kw):
        return {}

    def map(self, style, query_opt=None, **kw):
        return {}

    def theme_use(self, themename=None):
        return 'default'

    def theme_names(self):
        return ('default',)

    def lookup(self, style, option, state=None, default=None):
        return default


class Combobox(_tk.Entry):
    _cls = 'combobox'
    _tclass = 'TCombobox'

    def __init__(self, master=None, **kw):
        self._cvalues = list(kw.pop('values', ()) or ())
        _tk.Entry.__init__(self, master, **_strip(kw))
        self._push()

    def _push(self):
        _G.send({'op': 'cfg', 'id': self._w, 'o': {'items': [str(v) for v in self._cvalues]}})

    def configure(self, cnf=None, **kw):
        if 'values' in kw:
            self._cvalues = list(kw.pop('values') or ())
            self._push()
        return _tk.Entry.configure(self, cnf, **kw)

    config = configure

    def __setitem__(self, k, v):
        self.configure(**{k: v})

    def cget(self, key):
        if key == 'values':
            return tuple(self._cvalues)
        return _tk.Entry.cget(self, key)

    __getitem__ = cget

    def current(self, newindex=None):
        if newindex is None:
            try:
                return self._cvalues.index(self.get())
            except ValueError:
                return -1
        self.delete(0, 'end')
        self.insert(0, self._cvalues[newindex])

    def set(self, value):
        self.delete(0, 'end')
        self.insert(0, value)

    def _handle_special(self, e):
        _tk.Entry._handle_special(self, e)
        if e.get('t') == 'value' and e.get('pick'):
            ev = _tk.Event()
            ev._tname = 'Virtual'
            ev._detail = 'ComboboxSelected'
            self._fire(ev)


class Progressbar(_tk.Widget):
    _cls = 'progress'
    _tclass = 'TProgressbar'
    _defaults = {'maximum': 100, 'value': 0, 'length': 100, 'orient': 'horizontal', 'mode': 'determinate'}

    def __init__(self, master=None, **kw):
        _tk.Widget.__init__(self, master, **_strip(kw))

    def step(self, amount=1.0):
        v = float(self.cget('value') or 0) + amount
        mx = float(self.cget('maximum') or 100)
        self.configure(value=v % mx if v >= mx else v)

    def start(self, interval=None):
        pass

    def stop(self):
        pass


class Separator(_tk.Frame):
    def __init__(self, master=None, orient='horizontal', **kw):
        _tk.Frame.__init__(self, master, height=2 if orient == 'horizontal' else 0,
                           width=2 if orient != 'horizontal' else 0, bg='#a0a0a0')


class Sizegrip(_tk.Frame):
    pass


class Notebook(_tk.Frame):
    def __init__(self, master=None, **kw):
        _tk.Frame.__init__(self, master, **_strip(kw))
        self._tabs = []

    def add(self, child, **kw):
        self._tabs.append((child, kw.get('text', '')))
        if len(self._tabs) == 1:
            child.pack(fill='both', expand=True)

    def select(self, tab_id=None):
        return None

    def tabs(self):
        return tuple(str(t[0]) for t in self._tabs)


class Treeview(_tk.Listbox):
    def __init__(self, master=None, **kw):
        _strip(kw)
        for k in ('columns', 'show', 'displaycolumns', 'selectmode'):
            kw.pop(k, None)
        _tk.Listbox.__init__(self, master, **kw)
        self._rows = {}

    def heading(self, column, **kw):
        pass

    def column(self, column, **kw):
        pass

    def insert(self, parent, index, iid=None, **kw):
        vals = kw.get('values', ()) or ()
        text = kw.get('text', '')
        iid = iid or _G.new_id('I')
        self._rows[iid] = vals
        _tk.Listbox.insert(self, 'end', ' | '.join(([str(text)] if text else []) + [str(v) for v in vals]))
        return iid

    def get_children(self, item=None):
        return tuple(self._rows)

    def delete(self, *items):
        for it in items:
            if it in self._rows:
                i = list(self._rows).index(it)
                del self._rows[it]
                _tk.Listbox.delete(self, i)

    def item(self, item, option=None, **kw):
        d = {'values': self._rows.get(item, ())}
        return d.get(option) if option else d

    def selection(self):
        keys = list(self._rows)
        return tuple(keys[i] for i in self.curselection() if i < len(keys))


class OptionMenu(_OM):
    def __init__(self, master, variable, default=None, *values, **kwargs):
        _OM.__init__(self, master, variable, default if default is not None else (values[0] if values else ''), *values,
                     **_strip(kwargs))
