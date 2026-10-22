const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function helper(fetch) {
  const source = readFileSync(join(__dirname, '../src/lib/wait-for-auth-server.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, fetch, AbortSignal, setTimeout: callback => callback() });
  return module.exports.waitForAuthServer;
}

test('Automatically checks again after startup failures without submitting credentials', async () => {
  let calls = 0;
  await helper(async (url, options) => {
    assert.equal(url, '/api/auth/ready');
    assert.equal(options.body, undefined);
    assert.equal(options.cache, 'no-store');
    calls++;
    if (calls === 1) throw new Error('Connection reset');
    if (calls === 2) return Response.json({ ready: false }, { status: 503 });
    return Response.json({ ready: true });
  })();
  assert.equal(calls, 3);
});

test('Stops checking after eight failures with a recoverable message', async () => {
  let calls = 0;
  await assert.rejects(helper(async () => {
    calls++;
    return Response.json({ ready: false }, { status: 503 });
  }), /still unavailable/);
  assert.equal(calls, 8);
});

test('Configuration errors stop immediately', async () => {
  let calls = 0;
  await assert.rejects(helper(async () => {
    calls++;
    return Response.json({}, { status: 500 });
  }), /not configured/);
  assert.equal(calls, 1);
});
