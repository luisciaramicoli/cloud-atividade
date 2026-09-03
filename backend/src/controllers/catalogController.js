const axios = require('axios');
const db = require('../config/db');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

exports.getMovies = async (req, res) => {
    try {
        const personResponse = await axios.get(`https://api.themoviedb.org/3/search/person?query=Tom+Hanks&api_key=${TMDB_API_KEY}`);
        if (personResponse.data.results.length === 0) return res.status(404).json({ error: 'Ator não encontrado' });

        const personId = personResponse.data.results[0].id;
        const moviesResponse = await axios.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`);

        res.json(moviesResponse.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados na TMDB' });
    }
};

exports.getFavorites = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT tmdb_movie_id FROM favoritos WHERE usuario_id = ?', [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};

exports.addFavorite = async (req, res) => {
    const { tmdb_movie_id } = req.body;
    try {
        await db.execute('INSERT IGNORE INTO favoritos (usuario_id, tmdb_movie_id) VALUES (?, ?)', [req.userId, tmdb_movie_id]);
        res.json({ message: 'Adicionado aos favoritos' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};

exports.removeFavorite = async (req, res) => {
    const { tmdb_movie_id } = req.params;
    try {
        await db.execute('DELETE FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?', [req.userId, tmdb_movie_id]);
        res.json({ message: 'Removido dos favoritos' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

exports.getComments = async (req, res) => {
    const { tmdb_movie_id } = req.params;
    try {
        // Validação centralizada: verificar se o usuário autenticado possui privilégio de moderação
        let isAdmin = false;
        try {
            const authResponse = await axios.post(`${AUTH_SERVICE_URL}/authorize`, {
                userId: req.userId,
                requiredRole: 'admin',
                action: 'comments_view'
            });
            isAdmin = !!(authResponse.data && authResponse.data.allowed);
        } catch (authErr) {
            isAdmin = false;
        }

        const [rows] = await db.execute(`
            SELECT c.id, c.usuario_id, c.tmdb_movie_id, c.texto, c.criado_em, u.nome AS usuario_nome
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.tmdb_movie_id = ?
            ORDER BY c.criado_em DESC
        `, [tmdb_movie_id]);

        // Todas as regras de negócio de quem pode apagar/moderar são computadas no backend.
        // Nenhuma role ou ID sensível é tratado no front.
        const comments = rows.map(c => ({
            id: c.id,
            texto: c.texto,
            criado_em: c.criado_em,
            usuario_nome: c.usuario_nome,
            can_delete: c.usuario_id === req.userId || isAdmin,
            is_moderation: c.usuario_id !== req.userId && isAdmin
        }));

        res.json(comments);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};

exports.addComment = async (req, res) => {
    const { tmdb_movie_id, texto } = req.body;

    if (!texto) return res.status(400).json({ error: 'Texto é obrigatório' });

    try {
        const [result] = await db.execute(
            'INSERT INTO comentarios (usuario_id, tmdb_movie_id, texto) VALUES (?, ?, ?)',
            [req.userId, tmdb_movie_id, texto]
        );
        res.status(201).json({ message: 'Comentário adicionado', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};

exports.deleteComment = async (req, res) => {
    const { id } = req.params;
    try {
        const [comments] = await db.execute('SELECT * FROM comentarios WHERE id = ?', [id]);
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        const comment = comments[0];

        // Se o comentário pertence ao próprio usuário logado, pode apagar diretamente
        if (comment.usuario_id === req.userId) {
            await db.execute('DELETE FROM comentarios WHERE id = ?', [id]);
            return res.json({ message: 'Comentário excluído com sucesso pelo autor' });
        }

        // Se pertence a outro usuário, trata-se de moderação: EXIGE ADMIN
        // PADRÃO A: Centralized Enforcement - o catálogo consulta o auth-service via chamada de rede interna
        try {
            const authResponse = await axios.post(`${AUTH_SERVICE_URL}/authorize`, {
                userId: req.userId,
                requiredRole: 'admin',
                action: 'delete_other_comment'
            });

            if (authResponse.data && authResponse.data.allowed) {
                await db.execute('DELETE FROM comentarios WHERE id = ?', [id]);
                return res.json({ message: 'Comentário excluído com sucesso (Ação de Moderação/Admin)' });
            }
        } catch (authError) {
            if (authError.response && authError.response.status === 403) {
                return res.status(403).json({
                    error: 'Acesso negado: apenas administradores podem apagar comentários de outros usuários.'
                });
            }
            console.error('Erro na chamada ao auth-service:', authError.message);
            return res.status(500).json({ error: 'Erro ao validar autorização centralizada' });
        }

        return res.status(403).json({
            error: 'Acesso negado: apenas administradores podem apagar comentários de outros usuários.'
        });
    } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};
