const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const pool = require('./config/db');
const { metricsCollector, metricsEndpoint } = require('./middlewares/metricsMiddleware');

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsCollector);

// Healthcheck com Readiness Real (testa conexão ativa com o MariaDB)
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return res.status(200).json({
      status: 'healthy',
      service: 'auth-service',
      checks: {
        database: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      checks: {
        database: 'disconnected'
      },
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de Métricas para Prometheus
app.get('/metrics', metricsEndpoint('auth-service'));

app.use('/', authRoutes);

module.exports = app;

