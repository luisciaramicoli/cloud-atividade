const PRIVATE_IP = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|fc|fd|::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.))/i;

// CSP por rota: o frontend só precisa de si mesmo, fontes do Google e pôsteres do TMDB.
// O Swagger (/api-docs) carrega scripts do unpkg e usa script inline, então ganha uma política própria e mais larga.
function securityHeaders(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.COOKIE_SECURE === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  // O Grafana define os próprios cabeçalhos.
  if (req.path.startsWith('/grafana')) return next();

  res.setHeader('X-Frame-Options', 'DENY');
  const isDocs = req.path === '/api-docs' || req.path === '/apidocs';
  const csp = isDocs
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://image.tmdb.org; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  res.setHeader('Content-Security-Policy', csp);
  next();
}

// Defesa extra contra CSRF (além do SameSite=Lax do cookie): requisições que alteram estado e trazem Origin
// precisam vir da própria origem (ou de uma origem listada em CORS_ORIGINS).
function originCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // clientes não-navegador (cURL, Postman) não enviam Origin
  const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  let originHost;
  try { originHost = new URL(origin).host; } catch (_) { return res.status(403).json({ error: 'Origem inválida' }); }
  if (originHost === req.headers.host || allowed.includes(origin)) return next();
  return res.status(403).json({ error: 'Origem não permitida' });
}

// Limitador de taxa em memória (janela fixa) por IP. Suficiente para uma instância; o IP vem de req.ip (ver TRUST_PROXY).
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message || 'Muitas requisições. Tente novamente em instantes.' });
    }
    next();
  };
}

// Restringe rotas operacionais (ex.: /metrics) à rede interna: bloqueia quem veio por proxy (X-Forwarded-For)
// ou de IP público. O Prometheus acessa pela rede do Docker, sem proxy.
function internalOnly(req, res, next) {
  const addr = req.socket?.remoteAddress || '';
  if (!req.headers['x-forwarded-for'] && PRIVATE_IP.test(addr)) return next();
  return res.status(404).json({ error: 'Endpoint não encontrado' });
}

module.exports = { securityHeaders, originCheck, rateLimit, internalOnly };
