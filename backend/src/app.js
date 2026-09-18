const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const correlationMiddleware = require('./middlewares/correlationMiddleware');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(correlationMiddleware);

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

