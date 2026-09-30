const express = require('express');
const logRoutes = require('./routes/logRoutes');
const { metricsCollector, metricsEndpoint } = require('./middlewares/metricsMiddleware');

const app = express();

app.disable('x-powered-by');
// Serviço interno (sem porta publicada): sem CORS.
app.use(express.json({ limit: '1mb' }));
app.use(metricsCollector);

// Endpoint de Métricas para Prometheus
app.get('/metrics', metricsEndpoint('log-service'));

app.use('/', logRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado no log-service' });
});

module.exports = app;

