import { offerUpdate } from './data/app-update';

// Register explicitly so worker updates bypass the browser's HTTP cache. New
// documents use NetworkFirst; a waiting worker is activated at the user's click.
export function registerAppWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
  const setup = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      const checkWaiting = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        offerUpdate(async () => {
          if (!registration.waiting) { location.reload(); return; }
          reloading = true;
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      };
      checkWaiting();
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', checkWaiting));
      const check = () => { if (!document.hidden && navigator.onLine) void registration.update().then(checkWaiting).catch(() => {}); };
      window.addEventListener('focus', check);
      window.addEventListener('online', check);
      document.addEventListener('visibilitychange', check);
      window.setInterval(check, 300_000);
      check();
      // Seed the entry page on the very first visit, before the first offline
      // navigation. Never cache a failed or authentication response.
      void navigator.serviceWorker.ready.then(async () => {
        if (!navigator.onLine) return;
        const response = await fetch('/customize', { credentials: 'same-origin', cache: 'no-store' });
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const cache = await caches.open('starbucks-genie-pages-v1');
          await cache.put('/customize', response);
        }
      }).catch(() => {});
    } catch { /* Online drink building still works if service workers are unavailable. */ }
  };
  if (document.readyState === 'complete') void setup();
  else window.addEventListener('load', () => void setup(), { once: true });
}
