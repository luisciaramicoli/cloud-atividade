const db = require('../config/db');
const { logFromReq } = require('../services/loggerService');
const { uploadBuffer } = require('../services/storageService');

const toPositiveInt = (v) => {
  const n = typeof v === 'number' ? v : (typeof v === 'string' && /^\d{1,10}$/.test(v) ? Number(v) : NaN);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

// 1. Listar marcas do usuário
exports.getBrands = async (req, res) => {
  try {
    const [brands] = await db.execute(
      'SELECT * FROM marcas WHERE usuario_id = ? ORDER BY criado_em DESC',
      [req.userId]
    );
    res.json(brands);
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    res.status(500).json({ error: 'Erro ao listar marcas' });
  }
};

// 2. Criar marca (Requer papel criador ou admin)
exports.createBrand = async (req, res) => {
  const { nome, nicho, paleta_cores } = req.body;
  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ error: 'Nome da marca é obrigatório' });
  }
  if (!nicho || typeof nicho !== 'string' || !nicho.trim()) {
    return res.status(400).json({ error: 'Nicho da marca é obrigatório' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO marcas (usuario_id, nome, nicho, paleta_cores) VALUES (?, ?, ?, ?)',
      [
        req.userId,
        nome.trim().slice(0, 100),
        nicho.trim().slice(0, 50),
        (paleta_cores || '#6366f1,#8b5cf6,#ec4899').slice(0, 100)
      ]
    );

    logFromReq(req, {
      type: 'business.brand.created',
      action: 'marca_criada',
      target: { type: 'brand', id: result.insertId, nome }
    });

    res.status(201).json({
      message: 'Marca criada com sucesso',
      brandId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    res.status(500).json({ error: 'Erro ao cadastrar marca' });
  }
};

// 3. Upload de logotipo da marca para o MinIO
exports.uploadLogo = async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de marca inválido' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  try {
    const [rows] = await db.execute('SELECT * FROM marcas WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Marca não encontrada' });

    const brand = rows[0];
    const isAdmin = req.user?.role === 'admin';

    // ISOLAMENTO: Apenas o dono da marca pode enviar a logo
    if (brand.usuario_id !== req.userId && !isAdmin) {
      logFromReq(req, {
        type: 'audit.security.cross_tenant_denied',
        action: 'tentativa_negada_403',
        status: 'denied',
        target: { type: 'brand', id, dono_id: brand.usuario_id },
        metadata: { reason: 'Tentativa de enviar logo para marca de outro usuário' },
        immediate: true
      });
      return res.status(403).json({ error: 'Acesso negado: você não pode alterar a marca de outro usuário.' });
    }

    const objectKey = `logos/${req.userId}/${Date.now()}-${req.file.originalname}`;
    await uploadBuffer(objectKey, req.file.buffer, req.file.mimetype);

    const logoUrl = `/storage/${objectKey}`;
    await db.execute('UPDATE marcas SET logo_url = ? WHERE id = ?', [logoUrl, id]);

    logFromReq(req, {
      type: 'business.brand.logo_uploaded',
      action: 'logo_marca_upload',
      target: { type: 'brand', id, logoUrl }
    });

    res.json({ message: 'Logotipo atualizado no MinIO com sucesso', logoUrl });
  } catch (error) {
    console.error('Erro no upload de logo:', error);
    res.status(500).json({ error: 'Erro ao salvar logotipo no MinIO' });
  }
};

