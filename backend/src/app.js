const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

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

