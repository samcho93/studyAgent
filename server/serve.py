"""파이썬 웹 실습 강좌 — 로컬 · 교실용 웹 서버 (파이썬 3.8+ 표준 라이브러리만 사용)

    python server/serve.py            # http://localhost:8080
    python server/serve.py --lan      # 같은 네트워크의 학생 PC 에서 접속 (교사 PC 주소 표시)
    python server/serve.py --port 9000

- 강좌 파일(HTML · JS · 파이썬 호환 모듈 · 예제 파일)을 제공한다.
- 교차 출처 격리(COOP/COEP) 헤더를 붙여 localhost 에서 실행 중 input() 입력이 되게 한다.
- HTTP 로 LAN 접속하면 브라우저가 SharedArrayBuffer 를 막으므로, 입력 · GUI 이벤트를 서버의
  채널 API(/api/chan/push · /api/chan/pull)로 전달한다.
- 파이썬 코드는 서버가 아니라 각 학생의 브라우저에서 실행된다 (서버는 파일 제공 + 메시지 전달만).
"""
import argparse
import json
import os
import socket
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_chan = {}
_chan_lock = threading.Condition()


class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        if '/api/chan/' in (self.path or ''):
            return
        sys.stderr.write('%s  %s\n' % (time.strftime('%H:%M:%S'), fmt % args))

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        if not self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.py'):
            return 'text/plain; charset=utf-8'
        if path.endswith('.js'):
            return 'text/javascript; charset=utf-8'
        return super().guess_type(path)

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/api/health':
            return self._json({'ok': True, 'chan': True, 'server': 'studyPython', 'python': sys.version.split()[0]})
        if u.path == '/api/chan/pull':
            q = parse_qs(u.query)
            sid = q.get('sid', [''])[0]
            timeout = min(30000, max(0, int(q.get('timeout', ['0'])[0] or 0))) / 1000.0
            end = time.time() + timeout
            with _chan_lock:
                while not _chan.get(sid) and time.time() < end:
                    _chan_lock.wait(max(0.0, end - time.time()))
                msgs = _chan.pop(sid, [])
            return self._json(msgs)
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        n = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(n) if n else b''
        if u.path == '/api/chan/push':
            sid = parse_qs(u.query).get('sid', [''])[0]
            try:
                msgs = json.loads(raw.decode('utf-8') or '[]')
            except ValueError:
                return self._json({'ok': False}, 400)
            with _chan_lock:
                _chan.setdefault(sid, []).extend(msgs if isinstance(msgs, list) else [msgs])
                _chan_lock.notify_all()
            return self._json({'ok': True})
        self._json({'ok': False, 'error': 'not found'}, 404)


def lan_addresses():
    out = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        out.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith('127.'):
                out.add(ip)
    except OSError:
        pass
    return sorted(out)


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description='파이썬 웹 실습 강좌 서버')
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--lan', action='store_true', help='같은 네트워크에서 접속 허용')
    args = ap.parse_args()
    host = '0.0.0.0' if args.lan else '127.0.0.1'
    try:
        srv = ThreadingHTTPServer((host, args.port), Handler)
    except OSError as e:
        print('포트 %d 를 열 수 없습니다: %s\n다른 포트: python server/serve.py --port 9000' % (args.port, e))
        sys.exit(1)
    srv.daemon_threads = True
    print('=' * 60)
    print(' 🐍 파이썬 웹 실습 강좌 서버')
    print('   학생용: http://localhost:%d/student.html' % args.port)
    print('   교사용: http://localhost:%d/teacher.html' % args.port)
    if args.lan:
        for ip in lan_addresses():
            print('   학생 PC 접속 주소: http://%s:%d/student.html' % (ip, args.port))
    print(' 끝내려면 Ctrl+C')
    print('=' * 60)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n서버를 종료합니다.')


if __name__ == '__main__':
    main()
