"""HTTP 요청 — 브라우저(Pyodide 워커)에서는 동기 XHR, 로컬 CPython 에서는 urllib

    status, text = request('https://…', method='POST', headers={...}, body='...')

- 검증 도구(WEBGUI_VALIDATE=1)나 AGENTLAB_OFFLINE=1 이면 네트워크를 쓰지 않는다 (status 0).
"""
import json
import os

try:
    import _webbridge  # 브라우저(Pyodide 워커)에서만 있음
except ImportError:
    _webbridge = None


def offline():
    """네트워크를 쓸 수 없는(쓰지 않는) 환경인가"""
    return bool(os.environ.get('WEBGUI_VALIDATE') or os.environ.get('AGENTLAB_OFFLINE'))


def in_browser():
    return _webbridge is not None


def request(url, method='GET', headers=None, body=None, timeout=60):
    """→ (status, text). 실패하면 status 0 과 오류 메시지"""
    if offline():
        return 0, 'offline'
    headers = dict(headers or {})
    if body is not None and not isinstance(body, (str, bytes)):
        body = json.dumps(body, ensure_ascii=False)
        headers.setdefault('Content-Type', 'application/json')
    if _webbridge is not None:
        try:
            r = _webbridge.fetch_json(url, method, json.dumps(headers), body if body is not None else '')
            d = json.loads(r if isinstance(r, str) else str(r))
            return int(d.get('status', 0)), d.get('text', '')
        except Exception as e:  # noqa
            return 0, str(e)
    import urllib.request
    import urllib.error
    data = body.encode('utf-8') if isinstance(body, str) else body
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        try:
            return e.code, e.read().decode('utf-8', 'replace')
        except Exception:
            return e.code, str(e)
    except Exception as e:  # noqa
        return 0, str(e)


def get_json(url, headers=None):
    st, text = request(url, headers=headers)
    if st < 200 or st >= 300:
        return None
    try:
        return json.loads(text)
    except Exception:
        return None
