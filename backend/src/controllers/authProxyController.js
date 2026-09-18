const axios = require('axios');
const jwt = require('jsonwebtoken');
const { extractToken } = require('../middlewares/authMiddleware');
const { logAuditEvent, extractIp } = require('../services/loggerService');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:3000';

exports.register = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.login = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/login`, req.body);
        const { token, nome, role } = response.data;

        // Armazenamento de credencial exclusivamente no backend via cookie HttpOnly
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 2 * 60 * 60 * 1000 // 2 horas
        });

        // O backend decide as permissões internamente; nenhuma role ou token é exposta ao front
        const canManageUsers = role === 'admin';

        // Registro de Auditoria do Login
        const decoded = jwt.decode(token);
        logAuditEvent({
            source: 'service.auth',
            type: 'audit.auth.login',
            trace_id: req.traceId,
            actor: {
                id: decoded?.id ? String(decoded.id) : null,
                role: role || decoded?.role || 'user',
                ip: extractIp(req),
                user_agent: req.headers ? req.headers['user-agent'] : null
            },
            action: 'login',
            status: 'success',
            target: { type: 'session' },
            metadata: { nome }
        });

        res.status(response.status).json({
            message: response.data.message || 'Login sucesso',
            user: {
                nome: nome || 'Usuário',
                can_manage_users: canManageUsers
            }
        });
    } catch (error) {
        // Registro de tentativa de login falha
        logAuditEvent({
            source: 'service.auth',
            type: 'audit.auth.login_failed',
            trace_id: req.traceId,
            actor: {
                id: null,
                role: 'anonymous',
                ip: extractIp(req),
                user_agent: req.headers ? req.headers['user-agent'] : null
            },
            action: 'login_falhou',
            status: 'denied',
            target: { type: 'session' },
            metadata: { email: req.body?.email },
            immediate: true
        });

        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.logout = (req, res) => {
    const token = extractToken(req);
    let actor = { id: null, role: 'anonymous', ip: extractIp(req), user_agent: req.headers ? req.headers['user-agent'] : null };
    if (token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded) {
                actor.id = decoded.id ? String(decoded.id) : null;
                actor.role = decoded.role || 'user';
            }
        } catch (_) {}
    }

    logAuditEvent({
        source: 'service.auth',
        type: 'audit.auth.logout',
        trace_id: req.traceId,
        actor,
        action: 'logout',
        status: 'success',
        target: { type: 'session' }
    });

    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
    });
    res.json({ message: 'Logout realizado com sucesso' });
};

exports.me = async (req, res) => {
    try {
        // Validação centralizada de autorização junto ao auth-service
        let canManageUsers = false;
        let userName = req.user?.nome || 'Usuário';

        try {
            const authResponse = await axios.post(`${AUTH_SERVICE_URL}/authorize`, {
                userId: req.userId,
                requiredRole: 'admin',
                action: 'get_me'
            });
            canManageUsers = !!(authResponse.data && authResponse.data.allowed);
            if (authResponse.data?.user?.nome) {
                userName = authResponse.data.user.nome;
            }
        } catch (e) {
            canManageUsers = false;
            if (e.response?.data?.user?.nome) {
                userName = e.response.data.user.nome;
            }
        }

        // Nenhuma role bruta ou token é exposto ao front
        res.json({
            user: {
                nome: userName,
                can_manage_users: canManageUsers
            }
        });
    } catch (error) {
        console.error('Erro no endpoint /me:', error);
        res.status(500).json({ error: 'Erro ao obter perfil do usuário' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/forgot-password`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/reset-password`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/users`);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.listLogs = async (req, res) => {
    try {
        const response = await axios.get(`${LOG_SERVICE_URL}/logs`, {
            params: req.query,
            timeout: 5000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Erro ao consultar log-service:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro ao consultar serviço de logs' });
    }
};


