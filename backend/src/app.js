const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const pool = require('./config/db');
const correlationMiddleware = require('./middlewares/correlationMiddleware');
const { metricsCollector, metricsEndpoint } = require('./middlewares/metricsMiddleware');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

// Proxy reverso para Grafana (permite acesso pela mesma porta 8218 sem expor 3001)
app.use('/grafana', (req, res) => {
    if (req.originalUrl === '/grafana') {
        return res.redirect(301, '/grafana/');
    }

    const grafanaHost = process.env.GRAFANA_HOST || 'grafana';
    const grafanaPort = process.env.GRAFANA_PORT || 3000;

    const options = {
        hostname: grafanaHost,
        port: grafanaPort,
        path: req.originalUrl,
        method: req.method,
        headers: {
            ...req.headers,
            host: req.headers.host,
            'x-forwarded-for': req.ip,
            'x-forwarded-proto': req.protocol,
            'x-forwarded-host': req.get('host'),
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Grafana Proxy Error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Grafana indisponível via proxy reverso' });
        }
    });

    req.pipe(proxyReq, { end: true });
});

app.use(express.json());
app.use(correlationMiddleware);
app.use(metricsCollector);

// Healthcheck com Readiness Real (testa conexão ativa com o MariaDB)
app.get(['/health', '/api/health'], async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return res.status(200).json({
            status: 'healthy',
            service: 'catalog-service',
            checks: {
                database: 'connected'
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        return res.status(503).json({
            status: 'unhealthy',
            service: 'catalog-service',
            checks: {
                database: 'disconnected'
            },
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de Métricas para Prometheus
app.get('/metrics', metricsEndpoint('catalog-service'));

// Swagger / OpenAPI documentation
const openapiSpec = require('./docs/openapi.json');

app.get('/api/openapi.json', (req, res) => {
    res.json(openapiSpec);
});

const swaggerHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>CineCloud API Docs - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .info .title { font-size: 28px; color: #0f172a; }
    .swagger-ui .btn.authorize { color: #2563eb; border-color: #2563eb; }
    .swagger-ui .btn.authorize svg { fill: #2563eb; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;

app.get(['/api-docs', '/apidocs'], (req, res) => {
    res.send(swaggerHtml);
});

// API Routes
app.use('/api', apiRoutes);

// Rota 404 em JSON para requisições sob /api não tratadas
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado' });
});

// Servir frontend compilado
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Fallback do frontend SPA (apenas GET carrega index.html)
app.use((req, res) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    }
});

module.exports = app;

