"""그래프(matplotlib) · 표(pandas)를 결과 창에 보여 주기

- plt.show() → 그림을 PNG 로 만들어 결과 창에 표시 (브라우저)
- 프로그램이 끝났을 때 아직 보여 주지 않은 그림이 있으면 자동으로 표시 (Jupyter/Colab 과 비슷하게)
- display(obj) → pandas DataFrame 등은 HTML 표로 표시, 그 밖의 값은 print
- 검증 도구(CPython, 화면 없음)에서는 그림을 조용히 닫고, display 는 print 와 같다
"""
import base64
import builtins
import io
import sys

try:
    import _webbridge  # 브라우저(Pyodide 워커)에서만 있음
except ImportError:  # 검증 도구
    _webbridge = None

_mpl_ready = False


def _send(kind, data):
    if _webbridge is not None:
        _webbridge.rich(kind, data)


def _emit_figure(fig):
    if _webbridge is None:
        return
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=96, bbox_inches='tight', facecolor='white')
    _send('png', base64.b64encode(buf.getvalue()).decode('ascii'))


def show(*args, **kwargs):
    """matplotlib.pyplot.show 대체: 열린 그림을 모두 결과 창에 그리고 닫는다"""
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is None:
        return
    for num in list(plt.get_fignums()):
        fig = plt.figure(num)
        try:
            _emit_figure(fig)
        finally:
            plt.close(fig)


def _setup_matplotlib():
    global _mpl_ready
    import matplotlib
    matplotlib.use('Agg', force=True)
    import matplotlib.pyplot as plt
    if not _mpl_ready:
        plt.rcParams.update({'figure.figsize': (6.4, 4.2), 'figure.dpi': 96, 'axes.unicode_minus': False})
        _mpl_ready = True
    plt.show = show
    plt.close('all')


def _setup_pandas():
    import pandas as pd
    _classic_strings(pd)
    pd.set_option('display.width', 120)
    pd.set_option('display.max_columns', 20)
    pd.set_option('display.max_rows', 30)


def _classic_strings(pd):
    """pandas 3 의 새 문자열 자료형 대신 예전(object) 문자열을 쓴다 — df['열'].values 를 scikit-learn 에 바로 넣을 수 있도록"""
    try:
        pd.set_option('future.infer_string', False)
    except Exception:
        pass


def display(*objs):
    """Jupyter 의 display() 와 비슷하게: 표는 HTML 로, 그림은 이미지로, 나머지는 print"""
    for obj in objs:
        if type(obj).__name__ == 'Figure' and hasattr(obj, 'savefig'):
            _emit_figure(obj)
            continue
        if _webbridge is not None:
            rep = getattr(obj, '_repr_html_', None)
            if callable(rep):
                try:
                    html = rep()
                except Exception:
                    html = None
                if html:
                    _send('html', html)
                    continue
        print(obj)


builtins.display = display

_PLOT_HINTS = ('matplotlib', 'plt', '.plot(', '.hist(', '.boxplot(', 'mldata', 'seaborn')


def prepare(code):
    """실행 전: 코드가 그래프 · 표를 쓸 것 같으면 준비한다"""
    code = code or ''
    if 'matplotlib' in sys.modules or any(h in code for h in _PLOT_HINTS):
        try:
            _setup_matplotlib()
        except ImportError:
            pass
    if 'pandas' in code or 'mldata' in code or 'pandas' in sys.modules:
        try:
            _setup_pandas()
        except ImportError:
            pass


def flush():
    """실행이 끝난 뒤: 아직 표시하지 않은 그림을 보여 준다"""
    if 'matplotlib.pyplot' in sys.modules:
        try:
            show()
        except Exception:
            pass
