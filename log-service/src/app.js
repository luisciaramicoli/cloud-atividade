const express = require('express');
const cors = require('cors');
const logRoutes = require('./routes/logRoutes');
const { metricsCollector, metricsEndpoint } = require('./middlewares/metricsMiddleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(metricsCollector);

// Endpoint de Métricas para Prometheus
app.get('/metrics', metricsEndpoint('log-service'));

app.use('/', logRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado no log-service' });
});

module.exports = app;

