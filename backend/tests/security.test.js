const test = require('node:test');
const assert = require('node:assert');
const { detectImageType } = require('../src/middlewares/uploadMiddleware');
const { rateLimit, originCheck, internalOnly, securityHeaders } = require('../src/middlewares/securityMiddleware');

function fakeRes() {
  const res = { headers: {}, statusCode: 200, body: null };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.removeHeader = () => {};
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

test('CineCloud Backend · Security Tests', async (t) => {
  await t.test('Upload: detecta o tipo real pela assinatura e rejeita conteúdo disfarçado', () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(8)]);
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(12)]);
    const gif = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(8)]);
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(4)]);
    assert.strictEqual(detectImageType(png), 'image/png');
    assert.strictEqual(detectImageType(jpg), 'image/jpeg');
    assert.strictEqual(detectImageType(gif), 'image/gif');
    assert.strictEqual(detectImageType(webp), 'image/webp');
    assert.strictEqual(detectImageType(Buffer.from('<html><script>alert(1)</script></html>')), null);
    assert.strictEqual(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  });

  await t.test('Rate limit: bloqueia com 429 após exceder o limite', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 3 });
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = fakeRes();
      let passed = false;
      limiter({ ip: '1.2.3.4' }, res, () => { passed = true; });
      results.push(passed ? 200 : res.statusCode);
    }
    assert.deepStrictEqual(results, [200, 200, 200, 429, 429]);
    // outro IP não é afetado
    let other = false;
    limiter({ ip: '5.6.7.8' }, fakeRes(), () => { other = true; });
    assert.ok(other);
  });

  await t.test('CSRF: bloqueia Origin de outro site em requisições que alteram estado', () => {
    const run = (method, origin) => {
      const res = fakeRes();
      let passed = false;
      originCheck({ method, headers: { origin, host: 'app.exemplo.com' } }, res, () => { passed = true; });
      return passed ? 200 : res.statusCode;
    };
    assert.strictEqual(run('POST', 'https://evil.com'), 403);
    assert.strictEqual(run('POST', 'https://app.exemplo.com'), 200);
    assert.strictEqual(run('POST', undefined), 200);
    assert.strictEqual(run('GET', 'https://evil.com'), 200);
  });

  await t.test('internalOnly: /metrics só para rede interna e sem proxy', () => {
    const run = (addr, headers = {}) => {
      const res = fakeRes();
      let passed = false;
      internalOnly({ socket: { remoteAddress: addr }, headers }, res, () => { passed = true; });
      return passed;
    };
    assert.strictEqual(run('172.18.0.5'), true);
    assert.strictEqual(run('::ffff:10.0.0.3'), true);
    assert.strictEqual(run('203.0.113.9'), false);
    assert.strictEqual(run('172.18.0.5', { 'x-forwarded-for': '203.0.113.9' }), false);
  });

  await t.test('Cabeçalhos de segurança são aplicados', () => {
    const res = fakeRes();
    securityHeaders({ path: '/' }, res, () => {});
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    assert.match(res.headers['content-security-policy'], /default-src 'self'/);
    assert.doesNotMatch(res.headers['content-security-policy'], /unpkg/);
  });

  await t.test('Gateway: /grafana e /api/logs exigem autenticação; /metrics público é negado', async () => {
    const app = require('../src/app');
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      assert.strictEqual((await fetch(`${base}/grafana/`)).status, 401);
      assert.strictEqual((await fetch(`${base}/api/logs`)).status, 401);
      assert.strictEqual((await fetch(`${base}/api/users`)).status, 401);
      const h = await fetch(`${base}/api/me`);
      assert.strictEqual(h.status, 401);
      assert.strictEqual(h.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(h.headers.get('x-powered-by'), null);
      const cross = await fetch(`${base}/api/login`, { method: 'POST', headers: { origin: 'https://evil.com', 'content-type': 'application/json' }, body: '{}' });
      assert.strictEqual(cross.status, 403);
      assert.strictEqual((await fetch(`${base}/storage/avatars/..%2f..%2fetc`)).status, 404);
      const pre = await fetch(`${base}/api/me`, { method: 'OPTIONS', headers: { origin: 'https://evil.com', 'access-control-request-method': 'GET' } });
      assert.strictEqual(pre.headers.get('access-control-allow-origin'), null);
    } finally {
      server.close();
    }
  });
});
