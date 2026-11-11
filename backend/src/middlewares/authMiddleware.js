const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/security');
const { internalClient } = require('../config/authClient');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const extractToken = (req) => {
    // 1. Prioriza header Authorization Bearer se fornecido com token (Flashpost / Postman / cURL)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenFromHeader = authHeader.split(' ')[1]?.trim();
        if (tokenFromHeader && tokenFromHeader !== 'undefined' && tokenFromHeader !== 'null') {
            return tokenFromHeader;
        }
    }

    // 2. Fallback para Cookie HttpOnly (utilizado pelo Frontend no navegador)
    if (req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
    }

    return null;
};

const authenticateToken = (req, res, next) => {
    const token = extractToken(req);

    if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });

    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        req.userId = user.id;
        next();
    });
};

const { logFromReq } = require('../services/loggerService');

// Padrão A: Centralized Enforcement - consulta o auth-service via rede interna
const requireAdminCentralized = async (req, res, next) => {
    try {
        const response = await internalClient.post(`${AUTH_SERVICE_URL}/authorize`, {
            userId: req.userId,
            requiredRole: 'admin',
            action: req.originalUrl
        });

        if (response.data && response.data.allowed) {
            return next();
        }

        logFromReq(req, {
            type: 'audit.security.access_denied',
            action: 'tentativa_negada_403',
            status: 'denied',
            target: { type: 'route', method: req.method, path: req.originalUrl },
            metadata: { reason: 'Privilégios de administrador necessários', requiredRole: 'admin' },
            immediate: true
        });

        return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários.' });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            logFromReq(req, {
                type: 'audit.security.access_denied',
                action: 'tentativa_negada_403',
                status: 'denied',
                target: { type: 'route', method: req.method, path: req.originalUrl },
                metadata: { reason: 'Privilégios de administrador necessários', requiredRole: 'admin' },
                immediate: true
            });
            return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários.' });
        }
        console.error('Erro ao consultar auth-service para autorização:', error.message);
        return res.status(500).json({ error: 'Erro ao verificar permissão junto ao serviço de autenticação' });
    }
};

// Centralized Enforcement: Exige papel 'criador' ou 'admin' (bloqueia 'revisor')
const requireCreatorOrAdminCentralized = async (req, res, next) => {
    // Verificação rápida no token se disponível
    if (req.user && req.user.role === 'revisor') {
        logFromReq(req, {
            type: 'audit.security.access_denied',
            action: 'tentativa_negada_403',
            status: 'denied',
            target: { type: 'route', method: req.method, path: req.originalUrl },
            metadata: { reason: "Papel 'revisor' não pode criar ou modificar recursos", userRole: 'revisor', requiredRole: 'criador' },
            immediate: true
        });
        return res.status(403).json({ error: "Acesso negado: o papel 'revisor' tem permissão apenas de leitura e não pode criar ou modificar posts." });
    }

    try {
        const response = await internalClient.post(`${AUTH_SERVICE_URL}/authorize`, {
            userId: req.userId,
            requiredRole: 'criador',
            action: req.originalUrl
        });

        if (response.data && response.data.allowed) {
            return next();
        }

        logFromReq(req, {
            type: 'audit.security.access_denied',
            action: 'tentativa_negada_403',
            status: 'denied',
            target: { type: 'route', method: req.method, path: req.originalUrl },
            metadata: { reason: "Permissão insuficiente para criar ou modificar recursos", requiredRole: 'criador' },
            immediate: true
        });

        return res.status(403).json({ error: "Acesso negado: você não tem permissão para esta ação." });
    } catch (error) {
        if (error.response && error.response.status === 403) {
            logFromReq(req, {
                type: 'audit.security.access_denied',
                action: 'tentativa_negada_403',
                status: 'denied',
                target: { type: 'route', method: req.method, path: req.originalUrl },
                metadata: { reason: "Permissão insuficiente para criar ou modificar recursos", requiredRole: 'criador' },
                immediate: true
            });
            return res.status(403).json({ error: "Acesso negado: o papel 'revisor' tem permissão apenas de leitura e não pode criar ou modificar posts." });
        }
        // Se serviço auth offline, fallback para o role do token
        if (req.user && (req.user.role === 'criador' || req.user.role === 'admin')) {
            return next();
        }
        return res.status(403).json({ error: "Acesso negado: permissão insuficiente." });
    }
};

module.exports = { authenticateToken, requireAdminCentralized, requireCreatorOrAdminCentralized, extractToken };


