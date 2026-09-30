const crypto = require('crypto');
const { client, BUCKET } = require('../config/minio');

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// Faz upload da foto de perfil pro MinIO e devolve só a chave do objeto (o que vai pro MariaDB).
async function uploadAvatar(userId, buffer, mimetype) {
  const ext = EXT_BY_MIME[mimetype] || 'bin';
  const key = `${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  await client.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': mimetype });
  return key;
}

// Best-effort: remove o avatar anterior ao trocar de foto (evita objetos órfãos no bucket).
async function removeAvatar(key) {
  if (!key) return;
  try {
    await client.removeObject(BUCKET, key);
  } catch (error) {
    console.warn('MinIO: falha ao remover avatar antigo (ignorado):', error.message);
  }
}

// Serve o objeto através do backend (mesma origem, sem expor a porta do MinIO no host compartilhado).
async function streamAvatar(key, res) {
  const stat = await client.statObject(BUCKET, key);
  res.setHeader('Content-Type', stat.metaData?.['content-type'] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const stream = await client.getObject(BUCKET, key);
  stream.pipe(res);
}

module.exports = { uploadAvatar, removeAvatar, streamAvatar, EXT_BY_MIME };
