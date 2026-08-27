const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const db = require('./db');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.userId = user.id;
        next();
    });
};

// Registro de Usuário
app.post('/api/register', async (req, res) => {
    const { nome, email, password } = req.body;
    if (!nome || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome, email, hashedPassword]
        );
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
});

// Login de Usuário
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.senha_hash);
        if (!match) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: 'Login realizado com sucesso!', token, nome: user.nome });
    } catch (error) {
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
});

// TMDB: Buscar filmes do Tom Hanks
app.get('/api/movies', authenticateToken, async (req, res) => {
    try {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'dummy') {
            // Caso não tenha a chave, retornamos um mock para não quebrar a aplicação durante o desenvolvimento
            return res.json({
                cast: [
                    { id: 13, title: 'Forrest Gump', overview: 'A man with a low IQ has accomplished great things...', poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg' },
                    { id: 862, title: 'Toy Story', overview: 'Led by Woody, Andy\'s toys live happily in his room...', poster_path: '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg' }
                ]
            });
        }
        
        // 1. Busca person_id
        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/person?query=Tom+Hanks&api_key=${TMDB_API_KEY}`);
        const personId = searchRes.data.results[0]?.id;
        
        if (!personId) return res.status(404).json({ error: 'Ator não encontrado na TMDB' });

        // 2. Busca filmes
        const creditsRes = await axios.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}`);
        res.json(creditsRes.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao comunicar com TMDB' });
    }
});

// Favoritos
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM favoritos WHERE usuario_id = ?', [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar favoritos' });
    }
});

app.post('/api/favorites', authenticateToken, async (req, res) => {
    const { tmdb_movie_id, titulo, poster_path } = req.body;
    try {
        await db.execute(
            'INSERT INTO favoritos (usuario_id, tmdb_movie_id, titulo, poster_path) VALUES (?, ?, ?, ?)',
            [req.userId, tmdb_movie_id, titulo, poster_path]
        );
        res.status(201).json({ message: 'Favorito adicionado' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Filme já favoritado' });
        res.status(500).json({ error: 'Erro ao adicionar favorito' });
    }
});

app.delete('/api/favorites/:tmdb_movie_id', authenticateToken, async (req, res) => {
    const { tmdb_movie_id } = req.params;
    try {
        await db.execute('DELETE FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?', [req.userId, tmdb_movie_id]);
        res.json({ message: 'Favorito removido' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover favorito' });
    }
});

// Comentários
app.get('/api/comments/:tmdb_movie_id', authenticateToken, async (req, res) => {
    const { tmdb_movie_id } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM comentarios WHERE usuario_id = ? AND tmdb_movie_id = ? ORDER BY criado_em DESC', [req.userId, tmdb_movie_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

app.post('/api/comments', authenticateToken, async (req, res) => {
    const { tmdb_movie_id, texto } = req.body;
    try {
        await db.execute(
            'INSERT INTO comentarios (usuario_id, tmdb_movie_id, texto) VALUES (?, ?, ?)',
            [req.userId, tmdb_movie_id, texto]
        );
        res.status(201).json({ message: 'Comentário adicionado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar comentário' });
    }
});

// Servir frontend compilado
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
