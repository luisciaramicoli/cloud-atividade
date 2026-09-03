const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const extractToken = (req) => {
    // 1. Prioriza o cookie HttpOnly (tratamento seguro exclusivamente no backend)
    if (req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
    }
    // 2. Fallback para header Authorization (compatibilidade com ferramentas e APIs externas)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

const authenticateToken = (req, res, next) => {
    const token = extractToken(req);

    if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        req.userId = user.id;
        next();
    });
};

// Padrão A: Centralized Enforcement - consulta o auth-service via rede interna
const requireAdminCentralized = async (req, res, next) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/authorize`, {
            userId: req.userId,
            requiredRole: 'admin',
            action: req.originalUrl
        });

        if (response.data && response.data.allowed) {
            return next();
        }

        return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários.' });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários.' });
        }
        console.error('Erro ao consultar auth-service para autorização:', error.message);
        return res.status(500).json({ error: 'Erro ao verificar permissão junto ao serviço de autenticação' });
    }
};

module.exports = { authenticateToken, requireAdminCentralized };

