const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function route(fetch) {
  const source = readFileSync(join(__dirname, '../src/app/api/auth/login/route.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports,
    require: name => name === '@/lib/session' ? { SESSION_COOKIE: 'session', SESSION_MAX_AGE_SECONDS: 604800 } : require(name),
    fetch, AbortSignal, process: { env: { API_URL: 'https://api.example/api', NODE_ENV: 'production' } },
  });
  return module.exports.POST;
}

const request = () => new NextRequest('https://school.example/api/auth/login', { method: 'POST',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'fixture@example.invalid', password: 'test-only' }) });

test('Successful sign-in sets a secure HttpOnly session and keeps the token out of JSON', async () => {
  const response = await route(async (_url, options) => {
    assert.equal(options.cache, 'no-store'); assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ accessToken: 'test-token', user: { id: 'fixture', role: 'PARENT' } });
  })(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).accessToken, undefined);
  const cookie = response.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=lax', 'Path=/']) assert.ok(cookie.includes(flag));
});

test('Invalid credentials remain a 401 without creating a session', async () => {
  const response = await route(async () => Response.json({ message: 'Invalid credentials' }, { status: 401 }))(request());
  assert.equal(response.status, 401); assert.equal(response.headers.get('set-cookie'), null);
});

test('Network and response-body failures return a recoverable service error', async () => {
  for (const fetch of [async () => { throw new Error('Timed out'); }, async () => ({ text: async () => { throw new Error('Connection interrupted'); } })]) {
    const response = await route(fetch)(request());
    assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
    assert.match((await response.json()).message, /temporarily unavailable/);
  }
});

test('A malformed successful upstream response cannot establish a session', async () => {
  const response = await route(async () => new Response('<html>Starting</html>'))(request());
  assert.equal(response.status, 502); assert.equal(response.headers.get('set-cookie'), null);
});
