const crypto = require('crypto');
const { INTERNAL_TOKEN } = require('../config/security');

// Só o gateway (que conhece o segredo compartilhado) pode chamar as rotas internas deste serviço.
module.exports = function requireInternalToken(req, res, next) {
  const provided = Buffer.from(String(req.headers['x-internal-token'] || ''));
  const expected = Buffer.from(INTERNAL_TOKEN);
  if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) return next();
  return res.status(401).json({ error: 'Chamada interna não autorizada' });
};
