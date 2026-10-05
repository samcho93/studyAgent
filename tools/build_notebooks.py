"""
노트북 빌더: tools/nb_src/*.py (jupytext percent 형식) → notebooks/*.ipynb (학생용) + notebooks/solutions/*_solution.ipynb (교사용)

소스 작성 규칙
------------------------------------------------------------------
# %% [markdown]            마크다운 셀 (각 줄 앞의 '# ' 는 제거됨)
# %%                       코드 셀
# %% [markdown] teacher    교사용 노트북에만 들어가는 마크다운 셀
# %% teacher               교사용 노트북에만 들어가는 코드 셀
# %% student               학생용 노트북에만 들어가는 코드 셀

코드 셀 안에서:
    # BEGIN SOLUTION
    ...정답 코드...
    # END SOLUTION
  → 학생용에서는 '# ✏️ 여기에 코드를 작성하세요' 로 바뀝니다. (들여쓰기가 있으면 pass 추가)

    정답코드  #>> 학생용 코드
  → 한 줄 빈칸 채우기. 학생용에는 '#>>' 뒤의 내용이, 교사용에는 앞의 정답 코드가 들어갑니다.

파일 첫 줄에 '# META: gpu' 가 있으면 Colab GPU 런타임 메타데이터를 넣습니다.

사용법:  python tools/build_notebooks.py
"""
import ast
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "nb_src"
OUT = ROOT / "notebooks"
OUT_SOL = OUT / "solutions"

USER, REPO, BRANCH = "samcho93", "studyAgent", "main"
SITE = f"https://{USER}.github.io/{REPO}"

CELL_RE = re.compile(r"^# %%(.*)$")


def colab(path: str) -> str:
    return f"https://colab.research.google.com/github/{USER}/{REPO}/blob/{BRANCH}/{path}"


def parse(text: str):
    """percent 형식 텍스트 → [(kind, flags, lines)]"""
    cells, cur = [], None
    for line in text.splitlines():
        m = CELL_RE.match(line)
        if m:
            if cur:
                cells.append(cur)
            head = m.group(1).strip()
            kind = "markdown" if "[markdown]" in head else "code"
            flags = set(head.replace("[markdown]", "").split())
            cur = [kind, flags, []]
        elif cur is not None:
            cur[2].append(line)
    if cur:
        cells.append(cur)
    return cells


def md_lines(lines):
    out = []
    for l in lines:
        if l.startswith("# "):
            out.append(l[2:])
        elif l.startswith("#"):
            out.append(l[1:])
        else:
            out.append(l)
    return out


def code_lines(lines, student: bool):
    out, in_sol, sol_indent = [], False, ""
    for l in lines:
        s = l.strip()
        if s == "# BEGIN SOLUTION":
            in_sol, sol_indent = True, l[: len(l) - len(l.lstrip())]
            if student:
                out.append(f"{sol_indent}# ✏️ 여기에 코드를 작성하세요")
                if sol_indent:
                    out.append(f"{sol_indent}pass")
            continue
        if s == "# END SOLUTION":
            in_sol = False
            continue
        if in_sol and student:
            continue
        if "#>>" in l:
            code, stu = l.split("#>>", 1)
            indent = l[: len(l) - len(l.lstrip())]
            out.append((indent + stu.strip()) if student else code.rstrip())
            continue
        out.append(l)
    return out


def trim(lines):
    while lines and not lines[0].strip():
        lines = lines[1:]
    while lines and not lines[-1].strip():
        lines = lines[:-1]
    return lines


def to_source(lines):
    return [l + "\n" for l in lines[:-1]] + ([lines[-1]] if lines else [])


def build(src: Path, student: bool):
    text = src.read_text(encoding="utf-8")
    gpu = text.splitlines()[0].strip().startswith("# META:") and "gpu" in text.splitlines()[0]
    name = src.stem
    nb_path = f"notebooks/{name}.ipynb" if student else f"notebooks/solutions/{name}_solution.ipynb"
    lesson_no = name[:2]

    header = [
        f"[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)]({colab(nb_path)})",
        "",
    ]
    if student:
        header += [
            f"> 📘 **학생용 실습 노트북** · 강의 페이지: [{lesson_no}차시 강의 보기]({SITE}/student.html#ag{lesson_no})",
            ">",
            "> 1. 본인 **Google 계정**으로 로그인한 뒤, 메뉴 **파일 → Drive에 사본 저장**을 눌러 내 드라이브에 복사해서 사용하세요.",
            "> 2. 셀을 위에서부터 차례로 실행하세요 (**Shift + Enter**).",
            "> 3. `✏️ 여기에 코드를 작성하세요` 또는 `___` 표시가 있는 곳이 직접 풀어볼 실습 문제입니다.",
        ]
    else:
        header += [
            f"> 🧑‍🏫 **교사용 정답 노트북** · 수업 슬라이드: [{lesson_no}차시 교사용 화면]({SITE}/teacher.html#ag{lesson_no})",
            ">",
            "> 모든 실습 문제의 정답 코드와 지도 팁(🧑‍🏫 표시)이 포함되어 있습니다. 학생에게 배포하지 마세요.",
        ]
    if gpu:
        header += [">", "> ⚡ 이 노트북은 GPU를 사용하면 훨씬 빠릅니다: **런타임 → 런타임 유형 변경 → T4 GPU**"]

    cells = [{"cell_type": "markdown", "metadata": {}, "source": to_source(header)}]
    errors = []
    for kind, flags, lines in parse(text):
        if "teacher" in flags and student:
            continue
        if "student" in flags and not student:
            continue
        if kind == "markdown":
            ls = trim(md_lines(lines))
            if "teacher" in flags and ls:
                ls = ["> 🧑‍🏫 **지도 팁**", ">"] + ["> " + l for l in ls]
            if ls:
                cells.append({"cell_type": "markdown", "metadata": {}, "source": to_source(ls)})
        else:
            ls = trim(code_lines(lines, student))
            if not ls:
                continue
            py = "\n".join(
                ("pass  # magic" if l.lstrip().startswith(("!", "%")) else l) for l in ls
            )
            if not student or "___" not in py:
                try:
                    ast.parse(py)
                except SyntaxError as e:
                    errors.append(f"{src.name} [{'student' if student else 'solution'}] line {e.lineno}: {e.msg}\n    {e.text}")
            cells.append({"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": to_source(ls)})

    meta = {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python"},
        "colab": {"provenance": [], "toc_visible": True},
    }
    if gpu:
        meta["accelerator"] = "GPU"
        meta["colab"]["gpuType"] = "T4"
    nb = {"nbformat": 4, "nbformat_minor": 0, "metadata": meta, "cells": cells}
    return nb, errors


def main():
    OUT.mkdir(exist_ok=True)
    OUT_SOL.mkdir(exist_ok=True)
    all_errors = []
    srcs = sorted(SRC.glob("*.py"))
    for src in srcs:
        for student in (True, False):
            nb, errs = build(src, student)
            all_errors += errs
            dst = OUT / f"{src.stem}.ipynb" if student else OUT_SOL / f"{src.stem}_solution.ipynb"
            dst.write_text(json.dumps(nb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"built {src.stem}")
    if all_errors:
        print("\n구문 오류:")
        print("\n".join(all_errors))
        sys.exit(1)
    print(f"\n완료: {len(srcs)}개 소스 → {len(srcs) * 2}개 노트북")


if __name__ == "__main__":
    main()
