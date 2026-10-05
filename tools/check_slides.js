/* 슬라이드 넘침 검사 (브라우저 콘솔에서 실행)
 *   강좌 페이지(index.html?role=teacher)를 연 뒤 개발자 콘솔에:
 *   await import('./tools/check_slides.js'); const r = await checkSlides(); console.table(r)
 * 각 슬라이드를 실제 크기(폭 1280px)로 그려 보고, 내용이 잘리는 곳을 찾는다.
 */
window.checkSlides = async function (filter) {
  const app = window.PyApp;
  const deck = app.deck;
  const C = window.PY_COURSE;
  const problems = [];
  const stage = document.getElementById('stage');
  const view = document.getElementById('slideView');
  const oldHidden = view.classList.contains('hidden');
  view.classList.remove('hidden');
  document.getElementById('docView').classList.add('hidden');
  const savedFit = deck.fit;
  deck.fit = () => {};
  stage.style.width = '1280px';
  const over = (el, tol = 3) => el && (el.scrollHeight > el.clientHeight + tol || el.scrollWidth > el.clientWidth + tol);
  for (const o of C.order) {
    const ch = C.chapters[o.id];
    if (!ch || (filter && !o.id.startsWith(filter))) continue;
    for (const sec of ch.sections) {
      deck.ch = ch;
      deck.sec = sec;
      deck.slides = deck.build(ch, sec);
      for (let i = 0; i < deck.slides.length; i++) {
        deck.index = i;
        deck.render();
        const s0 = deck;
        if (s0 && s0.editor) s0.editor.refresh();
        const s = deck.slides[i];
        const el = stage.firstElementChild;
        const issues = [];
        const body = el.querySelector('.s-body');
        if (over(body)) issues.push(`본문 넘침 ${body.scrollHeight - body.clientHeight}px`);
        el.querySelectorAll('.s-points, .s-practice .desc, .s-col').forEach((x) => { if (over(x)) issues.push(`${x.className} 넘침 ${x.scrollHeight - x.clientHeight}px`); });
        const cm = el.querySelector('.CodeMirror-scroll');
        if (cm && cm.scrollHeight > cm.clientHeight + 30) issues.push(`코드 스크롤 필요 (${Math.round((cm.scrollHeight - cm.clientHeight) / 22)}줄 정도)`);
        const title = el.querySelector('.s-title');
        if (title && title.getBoundingClientRect().height > 1280 * 0.031 * 1.22 * 2 + 30) issues.push('제목 3줄 이상');
        if (issues.length) problems.push({ slide: `${sec.id}@${i + 1}`, layout: s.layout, title: String(s.title).replace(/<[^>]+>/g, ''), issues: issues.join(' / ') });
      }
    }
  }
  deck.fit = savedFit;
  if (oldHidden) view.classList.add('hidden');
  app.toast && app.toast(`검사 완료: 문제 ${problems.length}개`);
  return problems;
};
