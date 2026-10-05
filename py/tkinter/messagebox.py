"""tkinter.messagebox 호환 (브라우저 대화상자)"""
import _webgui as _G

ERROR = 'error'
INFO = 'info'
QUESTION = 'question'
WARNING = 'warning'
ABORTRETRYIGNORE = 'abortretryignore'
OK = 'ok'
OKCANCEL = 'okcancel'
RETRYCANCEL = 'retrycancel'
YESNO = 'yesno'
YESNOCANCEL = 'yesnocancel'
ABORT = 'abort'
RETRY = 'retry'
IGNORE = 'ignore'
CANCEL = 'cancel'
YES = 'yes'
NO = 'no'


def _ask(kind, title, message, **options):
    return _G.request(kind, title='' if title is None else str(title), message='' if message is None else str(message),
                      detail=str(options.get('detail', '') or ''), icon=str(options.get('icon', '') or ''))


def showinfo(title=None, message=None, **options):
    _ask('info', title, message, **options)
    return 'ok'


def showwarning(title=None, message=None, **options):
    _ask('warning', title, message, **options)
    return 'ok'


def showerror(title=None, message=None, **options):
    _ask('error', title, message, **options)
    return 'ok'


def askquestion(title=None, message=None, **options):
    r = _ask('question', title, message, **options)
    return 'yes' if r in (True, 'yes') else 'no'


def askokcancel(title=None, message=None, **options):
    return bool(_ask('okcancel', title, message, **options))


def askyesno(title=None, message=None, **options):
    return bool(_ask('yesno', title, message, **options))


def askyesnocancel(title=None, message=None, **options):
    r = _ask('yesnocancel', title, message, **options)
    return None if r is None else bool(r)


def askretrycancel(title=None, message=None, **options):
    return bool(_ask('retrycancel', title, message, **options))


class Message:
    def __init__(self, master=None, **options):
        self.options = options

    def show(self, **options):
        o = dict(self.options, **options)
        return showinfo(o.get('title'), o.get('message'))
