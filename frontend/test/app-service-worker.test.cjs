const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../public/sw.js'), 'utf8');

function worker({ offline = false } = {}) {
  const listeners = {};
  const offlinePage = new Response('Public offline screen');
  const networkPage = new Response('Private account page');
  const cached = [];
  const removed = [];
  vm.runInNewContext(source, {
    URL, Response,
    self: { location: { origin: 'https://school.example' }, addEventListener: (event, handler) => { listeners[event] = handler; },
      skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { open: async () => ({ addAll: async paths => cached.push(...paths) }), match: async () => offlinePage,
      keys: async () => ['unrelated-cache', 'btr-app-shell-old', 'btr-app-shell-v1'], delete: async key => removed.push(key) },
    fetch: async () => { if (offline) throw new Error('Offline'); return networkPage; },
  });
  return { listeners, offlinePage, networkPage, cached, removed };
}

test('Only the public offline screen and icons are precached; unrelated caches survive upgrades', async () => {
  const w = worker();
  let done;
  w.listeners.install({ waitUntil: p => { done = p; } }); await done;
  assert.deepEqual(w.cached.sort(), ['/app-icons/icon-192.png', '/app-icons/icon-512.png', '/offline.html'].sort());
  w.listeners.activate({ waitUntil: p => { done = p; } }); await done;
  assert.deepEqual(w.removed, ['btr-app-shell-old']);
});

test('Account API calls, uploads, mutations, and video ranges bypass service-worker caching', () => {
  const w = worker();
  for (const [path, method] of [['/api/backend/auth/me', 'GET'], ['/api/auth/login', 'POST'], ['/uploads/messages/private.mp4', 'GET'], ['/api/public-media/post/clip', 'GET'], ['/admin/dashboard?_rsc=private', 'GET']]) {
    w.listeners.fetch({ request: { url: `https://school.example${path}`, method, mode: 'cors' },
      respondWith: () => assert.fail(`Must not intercept ${method} ${path}`) });
  }
});

test('Navigation uses the current network response and falls back to a public screen only when offline', async () => {
  for (const offline of [false, true]) {
    const w = worker({ offline });
    let response;
    w.listeners.fetch({ request: { url: 'https://school.example/teacher/dashboard', method: 'GET', mode: 'navigate' },
      respondWith: p => { response = p; } });
    assert.equal(await response, offline ? w.offlinePage : w.networkPage);
    assert.deepEqual(w.cached, []);
  }
});
