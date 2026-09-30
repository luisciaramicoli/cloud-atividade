const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Envie uma imagem (JPEG, PNG, WEBP ou GIF).'));
    }
    cb(null, true);
  }
});

// Envolve o multer pra responder 400 em JSON (tipo/tamanho inválido) em vez de cair no handler de erro padrão do Express.
function avatarUpload(req, res, next) {
  uploadAvatar.single('foto')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Falha no upload da imagem' });
    next();
  });
}

module.exports = { avatarUpload, MAX_SIZE, ALLOWED_TYPES };
