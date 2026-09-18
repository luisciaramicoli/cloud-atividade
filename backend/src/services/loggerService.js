const axios = require('axios');
const crypto = require('crypto');

const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:3000';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 500;
const MAX_RETRIES = 3;

let queue = [];
let isFlushing = false;
let flushTimer = null;

/**
 * Sanitiza campos sensíveis (PII / Senhas / Tokens) para conformidade com LGPD/GDPR
 */
function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['senha', 'password', 'token', 'secret', 'jwt', 'authorization', 'hash'];
  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Extrai o IP real da requisição (mesmo atrás de proxy/Docker)
 */
function extractIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Envia o lote de eventos para o log-service com retentativas exponenciais
 */
async function dispatchBatch(batch, retryCount = 0) {
  try {
    await axios.post(`${LOG_SERVICE_URL}/logs/batch`, { events: batch }, { timeout: 3000 });
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const backoffDelay = Math.min(Math.pow(2, retryCount) * 200, 2000);
      setTimeout(() => {
        dispatchBatch(batch, retryCount + 1);
      }, backoffDelay);
    } else {
      console.warn(`[loggerService] Falha definitiva ao enviar lote de auditoria (${batch.length} eventos):`, error.message);
    }
  }
}

/**
 * Esvazia a fila em lotes de forma não bloqueante
 */
async function flushQueue() {
  if (isFlushing || queue.length === 0) return;
  isFlushing = true;

  try {
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      await dispatchBatch(batch);
    }
  } finally {
    isFlushing = false;
  }
}

// Inicia o temporizador de envio em lote contínuo
function startFlushTimer() {
  if (!flushTimer) {
    flushTimer = setInterval(flushQueue, FLUSH_INTERVAL_MS);
    if (flushTimer.unref) flushTimer.unref(); // Não impede o encerramento do processo
  }
}

startFlushTimer();

/**
 * Enfileira evento na fila em memória
 */
function enqueueEvent(event, immediate = false) {
  queue.push(event);
  if (immediate || queue.length >= BATCH_SIZE) {
    setImmediate(flushQueue);
  }
}

/**
 * Registra evento de auditoria padronizado (CloudEvents v1.0 + ECS + NIST SP 800-92)
 */
function logAuditEvent({
  source = 'service.catalog',
  type,
  trace_id,
  actor,
  action,
  status = 'success',
  target = null,
  metadata = {},
  immediate = false
}) {
  const event = {
    specversion: '1.0',
    id: `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
    source,
    type,
    time: new Date().toISOString(),
    trace_id: trace_id || crypto.randomUUID(),
    actor: {
      id: actor?.id ? String(actor.id) : null,
      role: actor?.role || 'anonymous',
      ip: actor?.ip || '127.0.0.1',
      user_agent: actor?.user_agent || 'Unknown'
    },
    action,
    status, // 'success' | 'denied' | 'error'
    target: target ? sanitize(target) : null,
    metadata: sanitize(metadata)
  };

  // Eventos de segurança negados (403) ou com status 'denied' são prioritários (immediate flush)
  const isUrgent = immediate || status === 'denied' || action === 'tentativa_negada_403';
  enqueueEvent(event, isUrgent);
}

/**
 * Helper prático para gerar log diretamente de um objeto req do Express
 */
function logFromReq(req, { type, action, status = 'success', target = null, metadata = {}, immediate = false }) {
  const actor = {
    id: req.userId || req.user?.id || null,
    role: req.user?.role || (req.userId ? 'user' : 'anonymous'),
    ip: extractIp(req),
    user_agent: req.headers ? req.headers['user-agent'] : null
  };

  logAuditEvent({
    source: 'service.catalog',
    type,
    trace_id: req.traceId,
    actor,
    action,
    status,
    target,
    metadata,
    immediate
  });
}

// Flush final em caso de encerramento do processo
process.on('SIGTERM', async () => {
  clearInterval(flushTimer);
  await flushQueue();
});

process.on('SIGINT', async () => {
  clearInterval(flushTimer);
  await flushQueue();
});

module.exports = {
  logAuditEvent,
  logFromReq,
  flushQueue,
  extractIp
};

