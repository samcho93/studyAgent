"""agentBuilder 저장소의 엔진(py/builder) · 예제(examples/*.json) · 튜토리얼 캡처를 이 강좌로 복사한다

    python tools/sync_builder.py [agentBuilder 경로]     # 기본: ../agentBuilder

py/builder 는 agentBuilder 가 원본이다. 여기서 고치지 말고 원본을 고친 뒤 이 스크립트로 가져온다.
"""
import glob
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'agentBuilder')

for f in glob.glob(os.path.join(SRC, 'py/builder/*.py')):
    shutil.copy(f, os.path.join(ROOT, 'py/builder'))
ex = sorted(os.path.basename(f) for f in glob.glob(os.path.join(SRC, 'examples/*.json')))
for f in ex:
    shutil.copy(os.path.join(SRC, 'examples', f), os.path.join(ROOT, 'assets/builder'))
with open(os.path.join(ROOT, 'assets/manifest.json'), 'w', encoding='utf-8') as fp:
    json.dump(['builder/' + f for f in ex], fp, ensure_ascii=False, indent=0)
for f in glob.glob(os.path.join(ROOT, 'img/builder/*.png')):
    src = os.path.join(SRC, 'docs/tutorial/img', os.path.basename(f))
    if os.path.exists(src):
        shutil.copy(src, f)
print(f'builder 모듈 {len(glob.glob(os.path.join(ROOT, "py/builder/*.py")))}개 · 예제 {len(ex)}개 동기화')
