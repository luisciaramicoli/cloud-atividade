const Minio = require('minio');

const BUCKET = process.env.MINIO_BUCKET || 'avatars';

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

// Política de leitura pública (Atividade 6, requisito 3: "bucket com leitura pública"), documentada no README.
// Escrita continua exigindo as credenciais do serviço: só o backend grava objetos.
const publicReadPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${BUCKET}/*`]
    }
  ]
};

async function ensureBucket() {
  try {
    const exists = await client.bucketExists(BUCKET);
    if (!exists) {
      await client.makeBucket(BUCKET);
      console.log(`MinIO: bucket '${BUCKET}' criado.`);
    }
    await client.setBucketPolicy(BUCKET, JSON.stringify(publicReadPolicy));
    console.log(`MinIO: bucket '${BUCKET}' pronto (leitura pública).`);
  } catch (error) {
    console.error('MinIO: erro ao preparar bucket:', error.message);
  }
}

ensureBucket();

module.exports = { client, BUCKET };
