"""PIL.ImageTk 대체 모듈 — Pillow 이미지를 브라우저용 tkinter 에서 보여 준다"""
import io
import tkinter


class PhotoImage(tkinter.PhotoImage):
    def __init__(self, image=None, size=None, **kw):
        self._pil = None
        if image is not None and hasattr(image, 'save'):
            self._pil = image
            buf = io.BytesIO()
            im = image
            if im.mode not in ('RGB', 'RGBA', 'L', 'LA', 'P'):
                im = im.convert('RGBA')
            im.save(buf, format='PNG')
            tkinter.PhotoImage.__init__(self, data=buf.getvalue(), **kw)
        else:
            if isinstance(image, str) and 'file' not in kw:
                pass
            tkinter.PhotoImage.__init__(self, **kw)

    def paste(self, im, box=None):
        buf = io.BytesIO()
        im.save(buf, format='PNG')
        self._set_bytes(buf.getvalue())
        import _webgui
        _webgui.send({'op': 'imgref', 'id': self._id})


class BitmapImage(PhotoImage):
    pass


def getimage(photo):
    from PIL import Image
    photo._ensure_pix()
    return Image.frombytes('RGBA', (photo.width(), photo.height()), bytes(photo._pix))
