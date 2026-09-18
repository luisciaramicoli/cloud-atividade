const redis = require('../config/redis');

const STREAM_KEY = process.env.REDIS_STREAM_KEY || 'audit_events';
const STREAM_MAXLEN = process.env.REDIS_STREAM_MAXLEN || '50000';

/**
 * Normaliza um evento para o padrão CloudEvents v1.0 + ECS
 */
function normalizeEvent(payload) {
  const now = new Date().toISOString();
  return {
    specversion: payload.specversion || '1.0',
    id: payload.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    source: payload.source || 'app.service',
    type: payload.type || 'audit.generic',
    time: payload.time || now,
    trace_id: payload.trace_id || null,
    actor: {
      id: payload.actor?.id || payload.usuario_id || null,
      role: payload.actor?.role || 'anonymous',
      ip: payload.actor?.ip || payload.ip || 'unknown',
      user_agent: payload.actor?.user_agent || null
    },
    action: payload.action || payload.acao || 'unknown_action',
    status: payload.status || 'success', // 'success', 'denied', 'error'
    target: payload.target || null, // { type: 'comment', id: '10' }
    metadata: payload.metadata || (payload.detalhes ? { details: payload.detalhes } : {})
  };
}

/**
 * POST /logs
 * Ingestão de evento individual ou em lote
 */
exports.createLog = async (req, res) => {
  try {
    const body = req.body;
    let events = [];

    if (Array.isArray(body)) {
      events = body;
    } else if (Array.isArray(body.events)) {
      events = body.events;
    } else if (body && typeof body === 'object') {
      events = [body];
    }

    if (events.length === 0) {
      return res.status(400).json({ error: 'Nenhum evento fornecido no corpo da requisição' });
    }

    const streamIds = [];
    for (const rawEvent of events) {
      const event = normalizeEvent(rawEvent);
      // Ingestão com MAXLEN aproximado (~) para truncamento amortizado de alto desempenho
      const streamId = await redis.xadd(
        STREAM_KEY,
        'MAXLEN',
        '~',
        STREAM_MAXLEN,
        '*',
        'event',
        JSON.stringify(event)
      );
      streamIds.push(streamId);
    }

    return res.status(201).json({
      success: true,
      count: streamIds.length,
      stream_ids: streamIds
    });
  } catch (error) {
    console.error('[log-service] Erro ao gravar evento na Stream:', error);
    return res.status(500).json({ error: 'Erro interno ao persistir log de auditoria no Redis Streams' });
  }
};

/**
 * GET /logs
 * Consulta paginada decrescente (mais recentes primeiro) via XREVRANGE com cursor
 */
exports.getLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : null;

    // Se houver cursor, usa '(' para excluir o ID já lido e continuar do anterior
    const startRange = cursor ? `(${cursor}` : '+';
    const endRange = '-';

    // XREVRANGE audit_events [start] [end] COUNT [limit]
    const streamResults = await redis.xrevrange(
      STREAM_KEY,
      startRange,
      endRange,
      'COUNT',
      limit
    );

    const logs = [];
    for (const [streamId, fields] of streamResults) {
      // fields é um array alternado: ['event', '{"specversion":"1.0",...}']
      const eventIndex = fields.indexOf('event');
      if (eventIndex !== -1 && fields[eventIndex + 1]) {
        try {
          const parsed = JSON.parse(fields[eventIndex + 1]);
          logs.push({
            stream_id: streamId,
            ...parsed
          });
        } catch (e) {
          logs.push({
            stream_id: streamId,
            raw: fields[eventIndex + 1]
          });
        }
      }
    }

    let nextCursor = null;
    let hasMore = false;
    if (streamResults.length === limit) {
      nextCursor = streamResults[streamResults.length - 1][0];
      hasMore = true;
    }

    return res.json({
      total: logs.length,
      limit,
      cursor: cursor || null,
      next_cursor: nextCursor,
      has_more: hasMore,
      logs
    });
  } catch (error) {
    console.error('[log-service] Erro ao consultar eventos da Stream:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar logs de auditoria no Redis Streams' });
  }
};

/**
 * GET /health
 */
exports.healthCheck = async (req, res) => {
  try {
    if (redis.status !== 'ready') {
      throw new Error(`Redis is not ready (current status: ${redis.status})`);
    }
    const pongPromise = redis.ping();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 1500));
    const pong = await Promise.race([pongPromise, timeoutPromise]);
    let info = 0;
    try {
      info = await redis.xlen(STREAM_KEY);
    } catch (_) {}

    return res.status(200).json({
      status: 'healthy',
      service: 'log-service',
      checks: {
        redis: pong === 'PONG' ? 'connected' : pong
      },
      stream: STREAM_KEY,
      total_events_in_stream: info,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'log-service',
      checks: {
        redis: 'disconnected'
      },
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.normalizeEvent = normalizeEvent;

