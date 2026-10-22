// Netz zuerst, sonst der letzte gespeicherte Stand (die Seite ist verschlüsselt, der Speicher also auch).
// Mitteilungen (Gesamtdatei 48.12): Inhalt kommt verschlüsselt vom Mac, Antippen öffnet die Meldung bei der SEC.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Project-Y',
    { body: d.body || '', icon: 'project-y-192.png', badge: 'project-y-192.png',
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
// Speicher (Prüfung 28.10.2026, PRUEFUNGEN.md 74): Bisher landete jede Abfrage unter ihrer vollen Adresse im Speicher,
// auch jede Stand-Prüfung des Aktualisieren-Knopfs (./index.html?t=…) und jede Antwort von GitHub, ohne Grenze. Jetzt
// nur Dateien der App, ein Eintrag je Datei ohne ?…, nur gelungene Antworten; Abfragen mit cache: 'no-store' gehen
// direkt ins Netz. Beim Aktivieren werden alte eigene Speicher gelöscht, nie fremde: Andere Apps unter derselben
// Adresse stefeblume.github.io teilen sich den Speicher (output-gym-…, triple-translate …).
const C = 'project-y-v2', EIGEN = /^(catalyst|project-y)-/;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(
  ['./', 'manifest.webmanifest', 'project-y-180.png', 'project-y-192.png', 'project-y-512.png']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k !== C && EIGEN.test(k)).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || r.cache === 'no-store' || !u.href.startsWith(self.registration.scope)) return;
  u.search = '';
  e.respondWith(fetch(r).then(x => { if (x.ok) { const k = x.clone(); caches.open(C).then(c => c.put(u.href, k)); }
    return x; }).catch(() => caches.match(u.href).then(x => x || caches.match('./'))));
});
