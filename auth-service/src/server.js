const app = require('./app');
const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth Service rodando na porta ${PORT}`);
});
