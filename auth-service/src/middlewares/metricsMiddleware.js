/**
 * Coletor de Métricas compatível com o formato Prometheus (OpenMetrics / text 0.0.4)
 * Fornece contagem de requisições por rota/método/status e histograma de latência.
 */

const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

const requestCounters = new Map(); // key: "method,route,status" -> count
const durationBuckets = new Map(); // key: "method,route" -> Map(le -> count)
const durationSums = new Map();    // key: "method,route" -> sum
const durationCounts = new Map();  // key: "method,route" -> count

function sanitizeRoute(path) {
  if (!path) return 'unknown';
  const str = typeof path === 'string' ? path : (Array.isArray(path) ? path[0] : String(path));
  return str
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[0-9a-fA-F-]{36}/g, '/:uuid');
}

function metricsCollector(req, res, next) {
  // Ignora métricas do próprio endpoint de scrape para não enviesar os dados
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      const method = req.method;
      const status = res.statusCode;
      
      let rawRoute = req.path || req.originalUrl || 'unknown';
      if (req.route && req.route.path) {
        const routePath = Array.isArray(req.route.path) ? (req.path || req.route.path[0]) : req.route.path;
        rawRoute = req.baseUrl ? `${req.baseUrl}${routePath}` : routePath;
      }
      const route = sanitizeRoute(rawRoute);

      // 1. Contador de Requisições
      const counterKey = `${method},${route},${status}`;
      requestCounters.set(counterKey, (requestCounters.get(counterKey) || 0) + 1);

      // 2. Histograma de Latência
      const durationKey = `${method},${route}`;
      if (!durationBuckets.has(durationKey)) {
        const bMap = new Map();
        BUCKETS.forEach(b => bMap.set(b, 0));
        bMap.set('+Inf', 0);
        durationBuckets.set(durationKey, bMap);
        durationSums.set(durationKey, 0);
        durationCounts.set(durationKey, 0);
      }

      const bMap = durationBuckets.get(durationKey);
      for (const b of BUCKETS) {
        if (durationSeconds <= b) {
          bMap.set(b, bMap.get(b) + 1);
        }
      }
      bMap.set('+Inf', bMap.get('+Inf') + 1);
      durationSums.set(durationKey, durationSums.get(durationKey) + durationSeconds);
      durationCounts.set(durationKey, durationCounts.get(durationKey) + 1);
    } catch (err) {
      console.error('[metrics] Erro ao registrar métrica:', err);
    }
  });

  next();
}

function metricsEndpoint(serviceName = 'catalog-service') {
  return (req, res) => {
    let output = '';

    // Metadados do Serviço
    output += `# HELP service_info Metadados do serviço monitorado\n`;
    output += `# TYPE service_info gauge\n`;
    output += `service_info{service="${serviceName}",environment="production"} 1\n\n`;

    // Process Uptime & Memory
    output += `# HELP process_uptime_seconds Tempo de atividade do processo em segundos\n`;
    output += `# TYPE process_uptime_seconds gauge\n`;
    output += `process_uptime_seconds{service="${serviceName}"} ${process.uptime().toFixed(2)}\n\n`;

    const mem = process.memoryUsage();
    output += `# HELP nodejs_memory_heap_used_bytes Memoria heap utilizada pelo Node.js\n`;
    output += `# TYPE nodejs_memory_heap_used_bytes gauge\n`;
    output += `nodejs_memory_heap_used_bytes{service="${serviceName}"} ${mem.heapUsed}\n\n`;

    output += `# HELP nodejs_memory_heap_total_bytes Memoria heap total alocada\n`;
    output += `# TYPE nodejs_memory_heap_total_bytes gauge\n`;
    output += `nodejs_memory_heap_total_bytes{service="${serviceName}"} ${mem.heapTotal}\n\n`;

    // Contador de Requisições HTTP
    output += `# HELP http_requests_total Total acumulado de requisicoes HTTP processadas\n`;
    output += `# TYPE http_requests_total counter\n`;
    for (const [key, count] of requestCounters.entries()) {
      const [method, route, status] = key.split(',');
      output += `http_requests_total{service="${serviceName}",method="${method}",route="${route}",status="${status}"} ${count}\n`;
    }
    output += '\n';

    // Histograma de Duração das Requisições
    output += `# HELP http_request_duration_seconds Latencia das requisicoes HTTP em segundos\n`;
    output += `# TYPE http_request_duration_seconds histogram\n`;
    for (const [key, bMap] of durationBuckets.entries()) {
      const [method, route] = key.split(',');
      for (const [le, count] of bMap.entries()) {
        output += `http_request_duration_seconds_bucket{service="${serviceName}",method="${method}",route="${route}",le="${le}"} ${count}\n`;
      }
      output += `http_request_duration_seconds_sum{service="${serviceName}",method="${method}",route="${route}"} ${durationSums.get(key).toFixed(6)}\n`;
      output += `http_request_duration_seconds_count{service="${serviceName}",method="${method}",route="${route}"} ${durationCounts.get(key)}\n`;
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(output);
  };
}

module.exports = {
  metricsCollector,
  metricsEndpoint
};
