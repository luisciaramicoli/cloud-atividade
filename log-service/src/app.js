const express = require('express');
const cors = require('cors');
const logRoutes = require('./routes/logRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/', logRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado no log-service' });
});

module.exports = app;

