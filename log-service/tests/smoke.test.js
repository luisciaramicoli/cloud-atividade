const test = require('node:test');
const assert = require('node:assert');
const redis = require('../src/config/redis');

test('CineCloud Log-Service · Smoke & Event Schema Tests', async (t) => {
  test.after(() => {
    try {
      redis.disconnect();
    } catch (_) {}
  });

  await t.test('Normalizes event to CloudEvents v1.0 and ECS standard', () => {
    const { normalizeEvent } = require('../src/controllers/logController');
    const inputPayload = {
      source: 'catalog.service',
      type: 'comment.created',
      usuario_id: 10,
      ip: '192.168.1.50',
      action: 'create_comment',
      target: { type: 'movie', id: '550' },
      detalhes: 'Comentário publicado com sucesso'
    };

    const event = normalizeEvent(inputPayload);
    assert.strictEqual(event.specversion, '1.0', 'Must follow CloudEvents v1.0');
    assert.ok(event.id, 'Must generate event ID');
    assert.ok(event.time, 'Must generate ISO timestamp');
    assert.strictEqual(event.source, 'catalog.service');
    assert.strictEqual(event.type, 'comment.created');
    assert.strictEqual(event.actor.id, 10);
    assert.strictEqual(event.actor.ip, '192.168.1.50');
    assert.strictEqual(event.action, 'create_comment');
    assert.strictEqual(event.status, 'success');
    assert.strictEqual(event.metadata.details, 'Comentário publicado com sucesso');
  });

  await t.test('Log-Service Metrics Middleware generates Prometheus format', () => {
    const { metricsEndpoint } = require('../src/middlewares/metricsMiddleware');
    let output = '';
    const fakeRes = {
      setHeader: () => {},
      send: (text) => { output = text; }
    };
    const handler = metricsEndpoint('log-service');
    handler({}, fakeRes);

    assert.match(output, /service_info\{service="log-service",environment="production"\} 1/);
    assert.match(output, /process_uptime_seconds\{service="log-service"\}/);
  });
});
