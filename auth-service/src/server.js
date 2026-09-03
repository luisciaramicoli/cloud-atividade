const app = require('./app');
const PORT = process.env.AUTH_PORT || (process.env.AUTH_SERVICE_URL ? new URL(process.env.AUTH_SERVICE_URL).port : null) || process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth Service rodando na porta ${PORT}`);
});

