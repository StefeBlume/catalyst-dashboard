// Netz zuerst, sonst der letzte gespeicherte Stand (die Seite ist verschlüsselt, der Speicher also auch).
// Mitteilungen (Gesamtdatei 48.12): Inhalt kommt verschlüsselt vom Mac, Antippen öffnet die Meldung bei der SEC.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Catalyst-Alarm',
    { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png',
      data: { url: d.url || './', title: d.title || '', body: d.body || '' } }));
});
// Antippen öffnet immer die App. Eine SEC-Adresse kommt als Karte in die App (Fund 23.10.2026: direkt geöffnet, führte
// „Zurück“ auf dem iPhone zu einer weißen Seite); die Karte öffnet die Meldung dann in Safari.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, scope = self.registration.scope, url = d.url || './';
  const intern = url.startsWith('./') || url.startsWith(scope);
  const ziel = new URL(intern ? url : './?alarm=' + encodeURIComponent(JSON.stringify({ t: d.title, b: d.body, u: url })),
                       scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(x => 'navigate' in x);
    return w ? w.navigate(ziel).then(x => (x || w).focus()).catch(() => clients.openWindow(ziel)) : clients.openWindow(ziel);
  }));
});
const C = 'catalyst-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(
  ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(C).then(c => c.put(e.request, k)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./'))));
});
