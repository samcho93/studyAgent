#!/usr/bin/env node
/* 강좌 콘텐츠 검증 도구
 *   node tools/validate.js ml05 [ml06 ...|all] [--print] [--jobs 4] [--no-run] [--python python] [--timeout 240]
 * - lessons/<id>.js 의 데이터 구조 검사
 * - 모든 파이썬 코드(본문 예제, 실습 정답 · 뼈대, 슬라이드 코드)를 로컬 파이썬(3.14 권장)으로 실행
 *   · 브라우저와 같은 실행기(py/_runtime.py)와 호환 모듈(turtle · tkinter · pygame)을 사용한다 (화면 없이)
 *   · 작업 폴더에는 assets/ 의 예제 파일을 복사해 둔다 (브라우저와 같음)
 * - expect 가 있으면 실제 출력(표준 출력 + 표준 오류, 입력 줄 포함)과 비교
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = { print: false, jobs: Math.max(2, Math.min(8, os.cpus().length)), run: true, timeout: 240, python: process.platform === 'win32' ? 'python' : 'python3' };
const ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--print') opt.print = true;
  else if (a === '--jobs') opt.jobs = +args[++i];
  else if (a === '--no-run') opt.run = false;
  else if (a === '--python') opt.python = args[++i];
  else if (a === '--timeout') opt.timeout = +args[++i];
  else ids.push(a);
}

function loadCourse() {
  const ctx = { window: {}, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/course.js'), 'utf8'), ctx, { filename: 'course.js' });
  return ctx;
}

const LAYOUTS = ['title', 'goals', 'bullets', 'code', 'two', 'table', 'diagram', 'demo', 'quiz', 'practice', 'summary'];
const BLOCKS = ['h', 'p', 'list', 'table', 'code', 'callout', 'figure', 'demo', 'colab'];

const norm = (s) => String(s == null ? '' : s).replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

function check(ch, errors) {
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const codes = [];
  const add = (where, b, extra) => codes.push(Object.assign({
    where, code: b.code, stdin: b.stdin, expect: b.expect, expectError: b.expectError, nondeterministic: b.nondeterministic,
    repl: b.repl, dialogs: b.dialogs
  }, extra || {}));
  ['id', 'no', 'title', 'summary'].forEach((k) => { if (!ch[k]) err(ch.id, `챕터 필드 없음: ${k}`); });
  if (!Array.isArray(ch.goals) || !ch.goals.length) err(ch.id, 'goals 없음');
  if (!Array.isArray(ch.sections) || !ch.sections.length) { err(ch.id, 'sections 없음'); return codes; }
  const seen = new Set();
  ch.sections.forEach((s, si) => {
    const W = `${s.id || ch.id + '#' + si}`;
    if (!s.id || seen.has(s.id)) err(W, 'id 없음/중복');
    seen.add(s.id);
    ['title', 'minutes'].forEach((k) => { if (!s[k]) err(W, `필드 없음: ${k}`); });
    if (!Array.isArray(s.goals) || !s.goals.length) err(W, 'goals 없음');
    if (!Array.isArray(s.flow) || !s.flow.length) err(W, 'flow 없음');
    if (!Array.isArray(s.content) || !s.content.length) err(W, 'content 없음');
    (s.content || []).forEach((b, bi) => {
      const w = `${W} content[${bi}]`;
      if (!BLOCKS.includes(b.type)) err(w, `알 수 없는 type: ${b.type}`);
      if (b.type === 'code') {
        if (!b.code) err(w, 'code 없음');
        if (b.run !== false) add(`${w} ${b.title || ''}`, b, { needExpect: true });
      }
      if (b.type === 'callout' && !['tip', 'warn', 'info', 'more'].includes(b.kind)) err(w, `callout kind 오류: ${b.kind}`);
      if (b.type === 'list' && !Array.isArray(b.items)) err(w, 'items 없음');
      if (b.type === 'table' && (!Array.isArray(b.head) || !Array.isArray(b.rows))) err(w, 'head/rows 없음');
    });
    (s.practice || []).forEach((p, pi) => {
      const w = `${W} practice[${pi}] ${p.title || ''}`;
      ['title', 'desc', 'starter', 'solution'].forEach((k) => { if (!p[k]) err(w, `필드 없음: ${k}`); });
      if (p.solution) add(`${w} (정답)`, Object.assign({}, p, { code: p.solution }), { needExpect: true });
      if (p.starter) add(`${w} (뼈대)`, Object.assign({}, p, { code: p.starter, expect: undefined }), { starter: true });
    });
    if (!Array.isArray(s.quiz) || !s.quiz.length) err(W, 'quiz 없음');
    (s.quiz || []).forEach((q, qi) => {
      const w = `${W} quiz[${qi}]`;
      if (!q.q || !Array.isArray(q.options) || typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) err(w, '문항/보기/정답 오류');
    });
    if (!Array.isArray(s.slides) || s.slides.length < 3) err(W, 'slides 부족');
    (s.slides || []).forEach((sl, i) => {
      const w = `${W} slide[${i}]`;
      if (!LAYOUTS.includes(sl.layout)) err(w, `알 수 없는 layout: ${sl.layout}`);
      if (!sl.title) err(w, 'title 없음');
      if (!sl.notes) err(w, 'notes 없음');
      if (sl.layout === 'code') {
        if (!sl.code) err(w, 'code 없음');
        else if (sl.run !== false) add(`${w} ${sl.title}`, Object.assign({}, sl, { expect: undefined }));
        const lines = (sl.code || '').split('\n').length;
        if (lines > 24) err(w, `코드가 너무 깁니다 (${lines}줄, 24줄 이하)`);
      }
      if (sl.layout === 'quiz' && (typeof sl.answer !== 'number' || !Array.isArray(sl.options))) err(w, 'quiz 정답/보기 오류');
      if (sl.layout === 'practice' && sl.solution) add(`${w} (정답)`, Object.assign({}, sl, { code: sl.solution, expect: undefined }));
      ['left', 'right'].forEach((k) => { if (sl[k] && sl[k].code && sl[k].run !== false) add(`${w}.${k}`, Object.assign({}, sl[k], { expect: undefined })); });
      if (sl.layout === 'bullets' && !Array.isArray(sl.bullets)) err(w, 'bullets 없음');
    });
  });
  return codes;
}

// ------------------------------------------------------------------ 실행
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === 'manifest.json' || e.name.startsWith('_')) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function execCode(c) {
  return new Promise((resolve) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyval-'));
    copyDir(path.join(ROOT, 'assets'), dir);
    fs.writeFileSync(path.join(dir, '__main_src__.py'), c.code, 'utf8');
    const env = Object.assign({}, process.env, {
      PYTHONPATH: path.join(ROOT, 'py'), PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1',
      WEBGUI_ANSWERS: JSON.stringify(c.dialogs || []), WEBGUI_VALIDATE: '1'
    });
    const argv = ['-X', 'utf8', '-c', 'import _runtime; _runtime.cli()', '__main_src__.py'];
    if (c.repl) argv.push('--repl');
    const p = spawn(opt.python, argv, { cwd: dir, env });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString('utf8'); });
    p.stderr.on('data', (d) => { out += d.toString('utf8'); });
    const t = setTimeout(() => { p.kill('SIGKILL'); out += `\n[시간 초과: ${opt.timeout}초]`; }, opt.timeout * 1000);
    p.on('close', (code) => {
      clearTimeout(t);
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* 무시 */ }
      resolve({ exit: code, output: out });
    });
    if (!c.repl) p.stdin.end(c.stdin || '');
    else p.stdin.end();
  });
}

async function runAll(codes, errors, warns) {
  let i = 0;
  const worker = async () => {
    while (i < codes.length) {
      const c = codes[i++];
      const r = await execCode(c);
      if (c.starter) {
        // 뼈대 코드는 문법만 맞으면 된다 (실행 오류 · 입력 부족 허용)
        if (/SyntaxError|IndentationError/.test(r.output)) errors.push(`${c.where}: 문법 오류\n${indent(r.output)}`);
        continue;
      }
      if (r.exit !== 0 && !c.expectError) errors.push(`${c.where}: 종료 코드 ${r.exit}\n${indent(r.output)}`);
      if (c.expectError && r.exit === 0) warns.push(`${c.where}: expectError 인데 정상 종료`);
      if (c.expect != null && !c.nondeterministic) {
        if (norm(c.expect) !== norm(r.output)) errors.push(`${c.where}: 출력 불일치\n  --- expect\n${indent(norm(c.expect))}\n  --- actual\n${indent(norm(r.output))}`);
      } else if (c.needExpect && !c.nondeterministic && c.expect == null && norm(r.output)) {
        warns.push(`${c.where}: expect 없음`);
      }
      if (opt.print) console.log(`\n### ${c.where}\n${r.output}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, opt.jobs) }, worker));
}

const indent = (s) => String(s).split('\n').map((l) => '    ' + l).join('\n');

(async () => {
  const ctx = loadCourse();
  const course = ctx.PY_COURSE;
  const list = ids.length && ids[0] !== 'all' ? ids : course.order.map((o) => o.id);
  let total = 0, failed = 0;
  for (const id of list) {
    const file = path.join(ROOT, 'lessons', id + '.js');
    if (!fs.existsSync(file)) { console.log(`- ${id}: 파일 없음 (건너뜀)`); continue; }
    const errors = [], warns = [];
    try {
      vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: id + '.js' });
    } catch (e) {
      console.log(`✗ ${id}: 스크립트 오류 ${e.stack}`); failed++; continue;
    }
    const ch = course.chapters[id];
    if (!ch) { console.log(`✗ ${id}: addChapter 로 등록되지 않음 (id 확인)`); failed++; continue; }
    const codes = check(ch, errors);
    if (opt.run) await runAll(codes, errors, warns);
    total += codes.length;
    const nSlides = ch.sections.reduce((a, s) => a + (s.slides || []).length, 0);
    console.log(`${errors.length ? '✗' : '✓'} ${id}: 섹션 ${ch.sections.length}, 슬라이드 ${nSlides}, 코드 ${codes.length}, 오류 ${errors.length}, 경고 ${warns.length}`);
    errors.forEach((e) => console.log('  ✗ ' + e));
    warns.forEach((e) => console.log('  ⚠ ' + e));
    if (errors.length) failed++;
  }
  console.log(`\n코드 ${total}개 검사, 실패 챕터 ${failed}`);
  process.exit(failed ? 1 : 0);
})();
