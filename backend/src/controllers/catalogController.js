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

exports.getComments = async (req, res) => {
    const { tmdb_movie_id } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM comentarios WHERE usuario_id = ? AND tmdb_movie_id = ? ORDER BY criado_em DESC', [req.userId, tmdb_movie_id]);
        res.json(rows);
    } catch (error) {
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
