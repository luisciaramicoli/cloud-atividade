const http = require('http');
const app = require('./app');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway / Catálogo rodando na porta ${PORT}`);
});

// Suporte a WebSocket para Grafana Live
server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/grafana/')) {
        const grafanaHost = process.env.GRAFANA_HOST || 'grafana';
        const grafanaPort = process.env.GRAFANA_PORT || 3000;

        const proxyReq = http.request({
            hostname: grafanaHost,
            port: grafanaPort,
            path: req.url,
            method: req.method,
            headers: req.headers
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
    }
});

