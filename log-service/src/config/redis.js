const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});

redis.on('connect', () => {
  console.log(`[log-service] Conectado ao Redis em ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.error('[log-service] Erro na conexão com o Redis:', err.message);
});

module.exports = redis;

