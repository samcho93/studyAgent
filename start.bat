@echo off
chcp 65001 > nul
cd /d "%~dp0"
where python > nul 2>&1
if errorlevel 1 (
  echo 파이썬이 필요합니다. https://www.python.org 에서 설치하세요.
  echo 서버 없이 GitHub Pages 주소로도 강좌를 사용할 수 있습니다.
  pause
  exit /b 1
)
start "" http://localhost:8080/student.html
python server\serve.py %*
pause
