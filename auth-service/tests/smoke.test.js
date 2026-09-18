const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

test('CineCloud Auth-Service · Smoke & Security Tests', async (t) => {
  await t.test('Bcrypt hashes and verifies passwords correctly', async () => {
    const password = 'MinhaSenhaSegura123!';
    const hash = await bcrypt.hash(password, 10);
    assert.notStrictEqual(password, hash);
    assert.strictEqual(await bcrypt.compare(password, hash), true);
    assert.strictEqual(await bcrypt.compare('senha_errada', hash), false);
  });

  await t.test('JWT token lifecycle (sign, decode, and verify)', () => {
    const secret = 'super_jwt_secret_test_key_12345';
    const payload = { id: 42, email: 'usuario@teste.com', role: 'admin' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    assert.ok(token, 'Token should be generated');
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, 42);
    assert.strictEqual(decoded.email, 'usuario@teste.com');
    assert.strictEqual(decoded.role, 'admin');

    assert.throws(() => {
      jwt.verify(token, 'chave_invalida');
    }, /invalid signature/);
  });

  await t.test('Auth-Service Metrics Middleware generates Prometheus format', () => {
    const { metricsEndpoint } = require('../src/middlewares/metricsMiddleware');
    let output = '';
    const fakeRes = {
      setHeader: () => {},
      send: (text) => { output = text; }
    };
    const handler = metricsEndpoint('auth-service');
    handler({}, fakeRes);

    assert.match(output, /service_info\{service="auth-service",environment="production"\} 1/);
    assert.match(output, /process_uptime_seconds\{service="auth-service"\}/);
  });
});

