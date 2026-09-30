const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

// Sem fallback em produção: um segredo padrão conhecido permitiria forjar tokens de qualquer usuário (inclusive admin).
function loadJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProduction) {
    throw new Error('JWT_SECRET ausente ou curto demais (mínimo 16 caracteres). Defina-o antes de subir em produção.');
  }
  console.warn('[security] JWT_SECRET não definido: usando segredo de desenvolvimento. NÃO use em produção.');
  return secret || 'dev-only-insecure-secret';
}

const JWT_SECRET = loadJwtSecret();

// Token de serviço-a-serviço derivado do JWT_SECRET (todos os serviços já o compartilham), então não exige nova variável.
const INTERNAL_TOKEN = crypto.createHash('sha256').update(`internal-service-token:${JWT_SECRET}`).digest('hex');

module.exports = { JWT_SECRET, INTERNAL_TOKEN, isProduction };
