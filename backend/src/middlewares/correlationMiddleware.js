const crypto = require('crypto');

/**
 * Middleware para rastreabilidade (Correlation ID / Trace ID).
 * Captura o cabeçalho x-correlation-id / x-request-id ou gera um novo UUIDv4 nativo.
 */
module.exports = (req, res, next) => {
  const incomingTraceId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const traceId = incomingTraceId || crypto.randomUUID();

  req.traceId = traceId;
  res.setHeader('x-correlation-id', traceId);

  next();
};

