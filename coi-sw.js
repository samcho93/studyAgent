/* 교차 출처 격리(Cross-Origin Isolation) 서비스 워커
 * GitHub Pages 처럼 응답 헤더를 설정할 수 없는 곳에서 COOP/COEP 헤더를 붙여 SharedArrayBuffer 를 켠다.
 * → 브라우저 안의 파이썬이 실행 중에 input() 으로 키보드 입력을 기다릴 수 있다.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data === 'deregister') {
    self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => clients.forEach((c) => c.navigate(c.url)));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 CDN 은 브라우저가 그대로 처리 (CORP 헤더 있음)
  event.respondWith(
    fetch(req).then((res) => {
      if (res.status === 0) return res;
      const headers = new Headers(res.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Resource-Policy', 'same-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }).catch((e) => { console.error(e); return Response.error(); })
  );
});
