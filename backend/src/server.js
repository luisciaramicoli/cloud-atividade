const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway / Catálogo rodando na porta ${PORT}`);
});

