#!/bin/sh
# 파이썬 웹 실습 강좌 서버 (./start.sh 또는 ./start.sh --lan)
cd "$(dirname "$0")"
PY=python3
command -v python3 >/dev/null 2>&1 || PY=python
( sleep 1; (xdg-open http://localhost:8080/student.html || open http://localhost:8080/student.html) >/dev/null 2>&1 ) &
exec "$PY" server/serve.py "$@"
