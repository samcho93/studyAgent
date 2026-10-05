"""웹 강좌 실행 환경 설정: PIL.ImageTk 를 브라우저용 모듈로 바꿔 끼운다"""
import sys
import importlib.abc
import importlib.util


class _ImageTkFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname == 'PIL.ImageTk':
            spec = importlib.util.find_spec('_pil_imagetk')
            if spec is not None and spec.origin:
                return importlib.util.spec_from_file_location(fullname, spec.origin)
        return None


if not any(isinstance(f, _ImageTkFinder) for f in sys.meta_path):
    sys.meta_path.insert(0, _ImageTkFinder())
