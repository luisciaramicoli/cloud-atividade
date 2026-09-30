const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const pool = require('./config/db');
const profileController = require('./controllers/profileController');
const correlationMiddleware = require('./middlewares/correlationMiddleware');
const { metricsCollector, metricsEndpoint } = require('./middlewares/metricsMiddleware');
const { authenticateToken, requireAdminCentralized } = require('./middlewares/authMiddleware');
const { securityHeaders, originCheck, rateLimit, internalOnly } = require('./middlewares/securityMiddleware');

const app = express();

// Atrás de um proxy reverso (Portainer/Traefik/Nginx), defina TRUST_PROXY=1 para que req.ip seja o IP real do cliente.
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}
app.disable('x-powered-by');
app.use(securityHeaders);

// O frontend é servido pela mesma origem, então CORS fica desligado por padrão. Só libera as origens listadas em
// CORS_ORIGINS (separadas por vírgula). Antes era origin:true + credentials, o que deixava qualquer site ler a API logado.
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
if (corsOrigins.length > 0) {
    app.use(cors({ origin: corsOrigins, credentials: true }));
}
app.use(originCheck);

// Proxy reverso para Grafana (permite acesso pela mesma porta 8218 sem expor 3001).
// Só administradores autenticados chegam ao Grafana: ele roda com acesso anônimo interno e não tem login próprio.
app.use('/grafana', authenticateToken, requireAdminCentralized, (req, res) => {
    if (req.originalUrl === '/grafana') {
        return res.redirect(301, '/grafana/');
    }

    const grafanaHost = process.env.GRAFANA_HOST || 'grafana';
    const grafanaPort = process.env.GRAFANA_PORT || 3000;

    // o cookie de sessão do CineCloud (JWT) não deve vazar para o Grafana
    const forwardHeaders = { ...req.headers };
    delete forwardHeaders.cookie;
    delete forwardHeaders.authorization;

    const options = {
        hostname: grafanaHost,
        port: grafanaPort,
        path: req.originalUrl,
        method: req.method,
        headers: {
            ...forwardHeaders,
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

// Atividade 6: serve as fotos de perfil guardadas no MinIO (bucket de leitura pública) pela mesma origem/porta do
// app, sem precisar expor a porta do MinIO no host compartilhado (mesma técnica do proxy reverso do /grafana acima).
app.get('/storage/avatars/:filename', profileController.serveAvatar);

app.use(express.json({ limit: '100kb' }));
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
        console.error('Healthcheck: banco indisponível:', err.message);
        return res.status(503).json({
            status: 'unhealthy',
            service: 'catalog-service',
            checks: {
                database: 'disconnected'
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de Métricas para Prometheus
app.get('/metrics', internalOnly, metricsEndpoint('catalog-service'));

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

// Freio de força bruta / abuso nas rotas públicas de autenticação
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
const recoveryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Muitas solicitações de recuperação. Tente novamente mais tarde.' });
app.use(['/api/login', '/api/register', '/api/reset-password'], authLimiter);
app.use('/api/forgot-password', recoveryLimiter);
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

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

