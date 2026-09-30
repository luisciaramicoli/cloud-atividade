const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { JWT_SECRET } = require('./config/security');
const { internalClient } = require('./config/authClient');
const { extractToken } = require('./middlewares/authMiddleware');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway / Catálogo rodando na porta ${PORT}`);
});

// Suporte a WebSocket para Grafana Live
// O upgrade não passa pelos middlewares do Express, então a checagem de admin precisa ser refeita aqui.
async function isAdminRequest(req) {
    try {
        const token = extractToken(req);
        if (!token) return false;
        const user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        const r = await internalClient.post(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/authorize`, {
            userId: user.id, requiredRole: 'admin', action: 'grafana_ws'
        });
        return !!(r.data && r.data.allowed);
    } catch (_) {
        return false;
    }
}

server.on('upgrade', async (req, socket, head) => {
    if (req.url && req.url.startsWith('/grafana/')) {
        if (!(await isAdminRequest(req))) {
            socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
            return socket.destroy();
        }
        const grafanaHost = process.env.GRAFANA_HOST || 'grafana';
        const grafanaPort = process.env.GRAFANA_PORT || 3000;

        const wsHeaders = { ...req.headers };
        delete wsHeaders.cookie;
        delete wsHeaders.authorization;

        const proxyReq = http.request({
            hostname: grafanaHost,
            port: grafanaPort,
            path: req.url,
            method: req.method,
            headers: wsHeaders
        });

        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                Object.keys(proxyRes.headers).map(k => `${k}: ${proxyRes.headers[k]}`).join('\r\n') +
                '\r\n\r\n');
            if (proxyHead && proxyHead.length) {
                socket.unshift(proxyHead);
            }
            proxySocket.pipe(socket);
            socket.pipe(proxySocket);
        });

        proxyReq.on('error', (err) => {
            console.error('Grafana WS Proxy Error:', err.message);
            socket.destroy();
        });

        proxyReq.end();
    } else {
        socket.destroy();
    }
});

