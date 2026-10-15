const test = require('node:test');
const assert = require('node:assert');
const request = require('http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-123456';

const app = require('../src/app');

function makeRequest(app, options, body = null) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const reqOptions = {
        hostname: '127.0.0.1',
        port,
        path: options.path,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = request.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          server.close(() => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
              json: () => {
                try { return JSON.parse(data); } catch (_) { return null; }
              }
            });
          });
        });
      });

      req.on('error', (err) => {
        server.close(() => reject(err));
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  });
}

test('CineCloud Stripe & Premium Plan Tests', async (t) => {
  await t.test('POST /api/checkout requer autenticação (401)', async () => {
    const res = await makeRequest(app, {
      path: '/api/checkout',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(res.statusCode, 401, 'Deve retornar 401 para requisições não autenticadas');
  });

  await t.test('GET /api/subscription/status requer autenticação (401)', async () => {
    const res = await makeRequest(app, {
      path: '/api/subscription/status',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 401, 'Deve retornar 401 para requisições não autenticadas');
  });

  await t.test('POST /api/webhook rejeita payload inválido ou sem evento (400)', async () => {
    const res = await makeRequest(app, {
      path: '/api/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { invalid: 'payload' });
    assert.strictEqual(res.statusCode, 400, 'Deve rejeitar eventos inválidos com 400');
  });

  await t.test('POST /api/webhook rejeita assinatura ausente quando STRIPE_WEBHOOK_SECRET está configurado', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_123';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    
    const res = await makeRequest(app, {
      path: '/api/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { type: 'checkout.session.completed', data: { object: {} } });
    
    assert.strictEqual(res.statusCode, 400, 'Deve rejeitar com 400 por falta de stripe-signature');
    
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
});
