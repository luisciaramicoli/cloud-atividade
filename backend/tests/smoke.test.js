const test = require('node:test');
const assert = require('node:assert');

test('PostCraft AI Backend · Smoke & Contract Tests', async (t) => {
  await t.test('OpenAPI specification exists and is valid', () => {
    const spec = require('../src/docs/openapi.json');
    assert.ok(spec, 'OpenAPI spec should be loaded');
    assert.match(spec.openapi, /^3\./, 'Spec should be OpenAPI 3.x');
    assert.strictEqual(spec.info.title, 'PostCraft AI - Plataforma de Geração de Posts para Instagram com IA');
    assert.ok(spec.paths['/api/posts'], 'Should define /api/posts route');
    assert.ok(spec.paths['/api/login'], 'Should define /api/login route');
    assert.ok(spec.paths['/api/logs'], 'Should define /api/logs route');
  });

  await t.test('Metrics Middleware generates valid Prometheus format', () => {
    const { metricsEndpoint } = require('../src/middlewares/metricsMiddleware');
    let output = '';
    const fakeRes = {
      setHeader: () => {},
      send: (text) => { output = text; }
    };
    const handler = metricsEndpoint('catalog-service');
    handler({}, fakeRes);

    assert.match(output, /# HELP service_info/, 'Should declare service_info help');
    assert.match(output, /service_info\{service="catalog-service",environment="production"\} 1/, 'Should contain service_info gauge');
    assert.match(output, /# HELP process_uptime_seconds/, 'Should declare process_uptime_seconds help');
    assert.match(output, /# HELP http_requests_total/, 'Should declare http_requests_total counter');
  });

  await t.test('Correlation Middleware assigns a trace ID if absent', () => {
    const correlationMiddleware = require('../src/middlewares/correlationMiddleware');
    const req = { headers: {} };
    const resHeaders = {};
    const res = { setHeader: (k, v) => { resHeaders[k.toLowerCase()] = v; } };
    let called = false;
    correlationMiddleware(req, res, () => { called = true; });

    assert.strictEqual(called, true, 'Next callback must be called');
    assert.ok(req.traceId, 'Request must have traceId assigned');
    assert.ok(resHeaders['x-correlation-id'], 'Header X-Correlation-ID must be set');
  });
});
