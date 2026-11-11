const db = require('../config/db');
const { logFromReq } = require('../services/loggerService');
const { uploadBuffer, uploadAvatar, removeAvatar } = require('../services/storageService');
const { generatePost } = require('../services/geminiService');

// Validador de ID numérico positivo seguro
const toPositiveInt = (v) => {
  const n = typeof v === 'number' ? v : (typeof v === 'string' && /^\d{1,10}$/.test(v) ? Number(v) : NaN);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

// Motor interno heurístico de IA para geração de posts e carrosséis caso chave externa não esteja presente
function generateMockAIContent({ tema, nicho, formato = 'carrossel', tom_voz = 'educativo' }) {
  const cleanTema = typeof tema === 'string' && tema.trim() ? tema.trim() : 'Dicas de alta performance';
  const cleanNicho = typeof nicho === 'string' && nicho.trim() ? nicho.trim() : 'Negócios';

  const slides = [
    {
      slide: 1,
      tipo: 'capa',
      titulo: `${cleanTema}: O Que Ninguém Te Conta`,
      subtitulo: 'Arraste para o lado e descubra o método passo a passo 👉'
    },
    {
      slide: 2,
      tipo: 'problema',
      titulo: '1. O Maior Erro que a Maioria Comete',
      subtitulo: `No nicho de ${cleanNicho}, tentar atalhos sem consistência destrói os resultados a longo prazo.`
    },
    {
      slide: 3,
      tipo: 'solucao',
      titulo: '2. A Estratégia dos Especialistas',
      subtitulo: 'Foque nos fundamentos: clareza de proposta, alinhamento técnico e rotina planejada.'
    },
    {
      slide: 4,
      tipo: 'pratica',
      titulo: '3. Plano de Ação para Aplicar Hoje',
      subtitulo: 'Defina 3 prioridades, meça os avanços semanalmente e elimine distrações que não trazem conversão.'
    },
    {
      slide: 5,
      tipo: 'cta',
      titulo: 'Gostou deste conteúdo?',
      subtitulo: 'Salve para consultar depois e compartilhe com um colega que precisa saber disso!'
    }
  ];

  const legenda = `Você já se sentiu travado ao tentar dominar ${cleanTema}?\n\n` +
    `No universo de ${cleanNicho}, a diferença entre quem tem resultados expressivos e quem desiste não é sorte, mas método.\n\n` +
    `Principais lições deste carrossel:\n` +
    `1️⃣ Consistência supera intensidade momentânea.\n` +
    `2️⃣ Clareza estratégica poupa dezenas de horas.\n` +
    `3️⃣ Aplique um conceito por vez com disciplina.\n\n` +
    `👉 Qual desses pontos você precisa colocar em prática hoje? Deixe nos comentários!`;

  const tagNicho = cleanNicho.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hashtags = `#${tagNicho} #conteudodigital #dicasinstagram #postcraft #marketingestrategico #redessociais`;

  return {
    titulo: `${cleanTema} (${cleanNicho})`,
    nicho: cleanNicho,
    formato,
    slides,
    legenda,
    hashtags
  };
}

// 1. Listar posts (Multi-tenancy: usuário comum só vê os seus; admin pode ver todos)
exports.getPosts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    let query, params;

    if (isAdmin) {
      query = `
        SELECT p.*, u.nome AS usuario_nome, u.email AS usuario_email, m.nome AS marca_nome
        FROM posts p
        JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN marcas m ON m.id = p.marca_id
        ORDER BY p.criado_em DESC
      `;
      params = [];
    } else {
      query = `
        SELECT p.*, m.nome AS marca_nome
        FROM posts p
        LEFT JOIN marcas m ON m.id = p.marca_id
        WHERE p.usuario_id = ?
        ORDER BY p.criado_em DESC
      `;
      params = [req.userId];
    }

    const [posts] = await db.execute(query, params);

    // Formata o JSON dos slides caso venha como string
    const formatted = posts.map(p => {
      let slides = [];
      try {
        slides = typeof p.slides_json === 'string' ? JSON.parse(p.slides_json) : p.slides_json;
      } catch (e) {
        slides = [];
      }
      return { ...p, slides };
    });

    logFromReq(req, {
      type: 'business.post.listed',
      action: 'posts_listados',
      target: { count: formatted.length }
    });

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar posts:', error);
    res.status(500).json({ error: 'Erro ao carregar posts' });
  }
};

// 2. Detalhar post (Isolamento por Usuário: 403 se o post for de outro usuário)
exports.getPostById = async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de post inválido' });

  try {
    const [rows] = await db.execute(
      `SELECT p.*, m.nome AS marca_nome, m.logo_url AS marca_logo, m.paleta_cores
       FROM posts p
       LEFT JOIN marcas m ON m.id = p.marca_id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    const post = rows[0];
    const isAdmin = req.user?.role === 'admin';

    // ISOLAMENTO MULTI-TENANT: se não for o dono e não for admin -> 403 Forbidden
    if (post.usuario_id !== req.userId && !isAdmin) {
      logFromReq(req, {
        type: 'audit.security.cross_tenant_denied',
        action: 'tentativa_negada_403',
        status: 'denied',
        target: { type: 'post', id, dono_id: post.usuario_id },
        metadata: { reason: 'Tentativa de acessar post de outro usuário' },
        immediate: true
      });
      return res.status(403).json({ error: 'Acesso negado: você não tem permissão para acessar posts de outro usuário.' });
    }

    let slides = [];
    try {
      slides = typeof post.slides_json === 'string' ? JSON.parse(post.slides_json) : post.slides_json;
    } catch (e) {
      slides = [];
    }

    res.json({ ...post, slides });
  } catch (error) {
    console.error('Erro ao buscar post por ID:', error);
    res.status(500).json({ error: 'Erro interno ao consultar post' });
  }
};

// 3. Criar post manualmente (Requer papel criador ou admin)
exports.createPost = async (req, res) => {
  const { titulo, nicho, formato, slides, legenda, hashtags, marca_id } = req.body;

  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({ error: 'Título do post é obrigatório' });
  }
  if (!nicho || typeof nicho !== 'string' || !nicho.trim()) {
    return res.status(400).json({ error: 'Nicho é obrigatório' });
  }

  try {
    const slidesJson = JSON.stringify(Array.isArray(slides) ? slides : []);
    const cleanMarcaId = toPositiveInt(marca_id) || null;

    const [result] = await db.execute(
      `INSERT INTO posts (usuario_id, marca_id, titulo, nicho, formato, slides_json, legenda, hashtags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        cleanMarcaId,
        titulo.trim().slice(0, 255),
        nicho.trim().slice(0, 50),
        (formato || 'carrossel').slice(0, 50),
        slidesJson,
        (legenda || '').slice(0, 5000),
        (hashtags || '').slice(0, 500),
        'rascunho'
      ]
    );

    const newPostId = result.insertId;

    logFromReq(req, {
      type: 'business.post.created',
      action: 'post_criado',
      target: { type: 'post', id: newPostId, titulo: titulo.trim() }
    });

    res.status(201).json({
      message: 'Post criado com sucesso',
      postId: newPostId
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ error: 'Erro ao salvar novo post' });
  }
};

// 4. Gerar post completo com IA (Requer papel criador ou admin)
exports.generatePostAI = async (req, res) => {
  const { tema, nicho, formato, tom_voz, marca_id } = req.body;

  if (!tema || typeof tema !== 'string' || !tema.trim()) {
    return res.status(400).json({ error: 'Tema do post é obrigatório para a IA' });
  }

  let backgroundKey;
  try {
    const { post: generated, image, imageWarning } = await generatePost({ tema, nicho, formato, tom_voz });
    if (image) backgroundKey = await uploadAvatar(req.userId, image.buffer, image.mimeType);
    const imagemUrl = backgroundKey ? `/storage/avatars/${backgroundKey}` : null;
    const cleanMarcaId = toPositiveInt(marca_id) || null;

    const [result] = await db.execute(
      `INSERT INTO posts (usuario_id, marca_id, titulo, nicho, formato, slides_json, legenda, hashtags, status, imagem_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        cleanMarcaId,
        generated.titulo.slice(0, 255),
        generated.nicho.slice(0, 50),
        generated.formato.slice(0, 50),
        JSON.stringify(generated.slides),
        generated.legenda,
        generated.hashtags,
        'gerado',
        imagemUrl
      ]
    );

    const newPostId = result.insertId;
    backgroundKey = null;

    logFromReq(req, {
      type: 'business.ai.post_generated',
      action: 'post_ia_gerado',
      target: { type: 'post', id: newPostId, tema, nicho: generated.nicho }
    });

    res.status(201).json({
      message: 'Post gerado com IA com sucesso',
      warning: imageWarning,
      post: {
        id: newPostId,
        ...generated,
        imagem_url: imagemUrl
      }
    });
  } catch (error) {
    if (backgroundKey) await removeAvatar(backgroundKey);
    console.error('Erro ao gerar post com IA:', error.message);
    res.status(error.publicStatus || 500).json({ error: error.publicMessage || 'Falha ao processar geração com IA' });
  }
};

// 5. Atualizar post (Requer papel criador ou admin + posse do registro)
exports.updatePost = async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [rows] = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });

    const post = rows[0];
    const isAdmin = req.user?.role === 'admin';

    // ISOLAMENTO: usuário só altera seu próprio post
    if (post.usuario_id !== req.userId && !isAdmin) {
      logFromReq(req, {
        type: 'audit.security.cross_tenant_denied',
        action: 'tentativa_negada_403',
        status: 'denied',
        target: { type: 'post', id, dono_id: post.usuario_id },
        metadata: { reason: 'Tentativa de editar post de outro usuário' },
        immediate: true
      });
      return res.status(403).json({ error: 'Acesso negado: você não pode alterar posts de outro usuário.' });
    }

    const { titulo, legenda, hashtags, status, slides } = req.body;
    const slidesJson = slides ? JSON.stringify(slides) : post.slides_json;

    await db.execute(
      `UPDATE posts 
       SET titulo = COALESCE(?, titulo),
           legenda = COALESCE(?, legenda),
           hashtags = COALESCE(?, hashtags),
           status = COALESCE(?, status),
           slides_json = ?
       WHERE id = ?`,
      [
        titulo ? titulo.trim().slice(0, 255) : null,
        legenda ? legenda.slice(0, 5000) : null,
        hashtags ? hashtags.slice(0, 500) : null,
        status ? status.slice(0, 30) : null,
        slidesJson,
        id
      ]
    );

    logFromReq(req, {
      type: 'business.post.updated',
      action: 'post_atualizado',
      target: { type: 'post', id }
    });

    res.json({ message: 'Post atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.status(500).json({ error: 'Erro ao atualizar post' });
  }
};

// 6. Excluir post (Requer papel criador ou admin + posse do registro)
exports.deletePost = async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [rows] = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });

    const post = rows[0];
    const isAdmin = req.user?.role === 'admin';

    // ISOLAMENTO: usuário só apaga seu próprio post
    if (post.usuario_id !== req.userId && !isAdmin) {
      logFromReq(req, {
        type: 'audit.security.cross_tenant_denied',
        action: 'tentativa_negada_403',
        status: 'denied',
        target: { type: 'post', id, dono_id: post.usuario_id },
        metadata: { reason: 'Tentativa de excluir post de outro usuário' },
        immediate: true
      });
      return res.status(403).json({ error: 'Acesso negado: você não pode apagar posts de outro usuário.' });
    }

    await db.execute('DELETE FROM posts WHERE id = ?', [id]);

    logFromReq(req, {
      type: 'business.post.deleted',
      action: 'post_excluido',
      target: { type: 'post', id, titulo: post.titulo }
    });

    res.json({ message: 'Post excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    res.status(500).json({ error: 'Erro ao excluir post' });
  }
};

// 7. Upload de Imagem de Capa do Post para o MinIO
exports.uploadPostImage = async (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  try {
    const [rows] = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post não encontrado' });

    const post = rows[0];
    const isAdmin = req.user?.role === 'admin';

    if (post.usuario_id !== req.userId && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Salva no MinIO via storageService
    const objectKey = `posts/${req.userId}/${Date.now()}-${req.file.originalname}`;
    await uploadBuffer(objectKey, req.file.buffer, req.file.mimetype);

    const imagemUrl = `/storage/${objectKey}`;
    await db.execute('UPDATE posts SET imagem_url = ? WHERE id = ?', [imagemUrl, id]);

    logFromReq(req, {
      type: 'business.post.image_uploaded',
      action: 'post_imagem_upload',
      target: { type: 'post', id, imagemUrl }
    });

    res.json({ message: 'Imagem do post enviada com sucesso', imagemUrl });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem do post:', error);
    res.status(500).json({ error: 'Erro ao salvar imagem no MinIO' });
  }
};

