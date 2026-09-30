const axios = require('axios');
const db = require('../config/db');
const { uploadAvatar, removeAvatar, streamAvatar } = require('../services/storageService');
const { logFromReq } = require('../services/loggerService');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const BIO_MAX_LEN = 280;

function avatarUrl(avatarKey) {
  return avatarKey ? `/storage/avatars/${avatarKey}` : null;
}

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, email, role, bio, avatar_key, criado_em FROM usuarios WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const u = rows[0];
    res.json({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      bio: u.bio || '',
      avatarUrl: avatarUrl(u.avatar_key),
      criadoEm: u.criado_em
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro no banco de dados' });
  }
};

// PUT /api/users/:id/profile — o backend confere a identidade de quem está logado (req.userId, vindo do JWT
// verificado em authenticateToken), nunca confia no :id da URL nem em nada enviado no corpo da requisição.
exports.updateProfile = async (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId !== req.userId) {
    logFromReq(req, {
      type: 'audit.security.access_denied',
      action: 'tentativa_negada_403',
      status: 'denied',
      target: { type: 'user_profile', id: targetId },
      metadata: { motivo: 'Tentativa de editar perfil de outro usuário' },
      immediate: true
    });
    return res.status(403).json({ error: 'Acesso negado: você só pode editar o seu próprio perfil.' });
  }

  const bio = typeof req.body.bio === 'string' ? req.body.bio.slice(0, BIO_MAX_LEN) : undefined;

  try {
    let avatarKey;
    let oldAvatarKey = null;

    if (req.file) {
      const [rows] = await db.execute('SELECT avatar_key FROM usuarios WHERE id = ?', [req.userId]);
      oldAvatarKey = rows[0]?.avatar_key || null;
      avatarKey = await uploadAvatar(req.userId, req.file.buffer, req.file.mimetype);
    }

    const response = await axios.put(`${AUTH_SERVICE_URL}/users/${req.userId}/profile`, {
      bio,
      ...(avatarKey !== undefined ? { avatarKey } : {})
    });

    if (avatarKey && oldAvatarKey) await removeAvatar(oldAvatarKey);

    logFromReq(req, {
      type: 'audit.profile.update',
      action: 'atualizar_perfil',
      status: 'success',
      target: { type: 'user_profile', id: req.userId },
      metadata: { fotoAlterada: !!avatarKey }
    });

    const u = response.data.user;
    res.json({
      message: 'Perfil atualizado com sucesso',
      profile: {
        id: u.id,
        nome: u.nome,
        bio: u.bio || '',
        avatarUrl: avatarUrl(u.avatar_key)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro ao atualizar perfil' });
  }
};

// GET /storage/avatars/:filename — serve o objeto do MinIO através do backend, sem expor a porta do MinIO no host.
exports.serveAvatar = async (req, res) => {
  try {
    await streamAvatar(req.params.filename, res);
  } catch (error) {
    res.status(404).json({ error: 'Imagem não encontrada' });
  }
};
