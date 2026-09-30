const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1, fields: 5, fieldSize: 10 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Envie uma imagem (JPEG, PNG, WEBP ou GIF).'));
    }
    cb(null, true);
  }
});

// O mimetype vem do cliente e pode ser forjado (ex.: um .html enviado como image/png). Conferimos os primeiros bytes
// (assinatura real do arquivo) e devolvemos o tipo verdadeiro detectado.
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  const head = buf.subarray(0, 6).toString('ascii');
  if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif';
  return null;
}

// Envolve o multer pra responder 400 em JSON (tipo/tamanho inválido) em vez de cair no handler de erro padrão do Express.
function avatarUpload(req, res, next) {
  uploadAvatar.single('foto')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Falha no upload da imagem' });
    if (req.file) {
      const realType = detectImageType(req.file.buffer);
      if (!realType || !ALLOWED_TYPES.includes(realType)) {
        return res.status(400).json({ error: 'O conteúdo do arquivo não é uma imagem válida (JPEG, PNG, WEBP ou GIF).' });
      }
      req.file.mimetype = realType;
    }
    next();
  });
}

module.exports = { avatarUpload, detectImageType, MAX_SIZE, ALLOWED_TYPES };
