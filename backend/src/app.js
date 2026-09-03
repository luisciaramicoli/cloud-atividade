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

// Servir frontend compilado
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;

