"""tkinter.filedialog 호환 — 작업 폴더의 파일을 고르거나 내 PC 의 파일을 올려서 쓴다"""
import os as _os
import _webgui as _G


def _patterns(filetypes):
    pats = []
    for ft in filetypes or ():
        if isinstance(ft, (tuple, list)) and len(ft) >= 2:
            p = ft[1]
            items = p if isinstance(p, (tuple, list)) else str(p).replace(';', ' ').split()
            for x in items:
                x = str(x).strip()
                if x in ('*', '*.*'):
                    return None
                if x.startswith('.'):
                    x = '*' + x
                pats.append(x)
    return pats or None


def _types_label(filetypes):
    out = []
    for ft in filetypes or ():
        if isinstance(ft, (tuple, list)) and len(ft) >= 2:
            p = ft[1]
            out.append('%s (%s)' % (ft[0], ' '.join(p) if isinstance(p, (tuple, list)) else p))
    return out


def _save_upload(r):
    import base64
    name = r.get('name', 'upload.bin')
    with open(name, 'wb') as fp:
        fp.write(base64.b64decode(r.get('b64', '')))
    return name


def askopenfilename(**options):
    pats = _patterns(options.get('filetypes'))
    r = _G.request('openfile', title=str(options.get('title') or '열기'), files=_G.list_files(pats), patterns=pats or [],
                   types=_types_label(options.get('filetypes')), multiple=bool(options.get('multiple')))
    if not r:
        return '' if not options.get('multiple') else ()
    if isinstance(r, dict):  # 내 PC 에서 올린 파일
        r = _save_upload(r)
    if options.get('multiple'):
        items = r if isinstance(r, list) else [r]
        items = [_save_upload(x) if isinstance(x, dict) else x for x in items]
        return tuple(_os.path.abspath(x).replace('\\', '/') for x in items)
    return _os.path.abspath(str(r)).replace('\\', '/')


def askopenfilenames(**options):
    options['multiple'] = True
    return askopenfilename(**options)


def asksaveasfilename(**options):
    init = options.get('initialfile') or ''
    ext = options.get('defaultextension') or ''
    r = _G.request('savefile', title=str(options.get('title') or '다른 이름으로 저장'), initial=init, ext=ext,
                   files=_G.list_files(_patterns(options.get('filetypes'))), types=_types_label(options.get('filetypes')))
    if not r:
        return ''
    r = str(r)
    if ext and not _os.path.splitext(r)[1]:
        r += ext if ext.startswith('.') else '.' + ext
    d = _os.path.dirname(r)
    if d:
        _os.makedirs(d, exist_ok=True)
    return _os.path.abspath(r).replace('\\', '/')


def askopenfile(mode='r', **options):
    f = askopenfilename(**options)
    if f:
        return open(f, mode)
    return None


def askopenfiles(mode='r', **options):
    return [open(f, mode) for f in askopenfilenames(**options)]


def asksaveasfile(mode='w', **options):
    f = asksaveasfilename(**options)
    if f:
        return open(f, mode)
    return None


def askdirectory(**options):
    r = _G.request('dir', title=str(options.get('title') or '폴더 선택'))
    return _os.path.abspath(r or '.').replace('\\', '/') if r is not None else ''


class Open:
    def __init__(self, master=None, **options):
        self.options = options

    def show(self, **options):
        return askopenfilename(**dict(self.options, **options))


class SaveAs(Open):
    def show(self, **options):
        return asksaveasfilename(**dict(self.options, **options))
