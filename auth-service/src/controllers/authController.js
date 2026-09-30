const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { sendResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';

exports.register = async (req, res) => {
    const { nome, email, password } = req.body;
    if (!nome || !email || !password) return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome, email, hashedPassword]
        );
        res.status(201).json({ message: 'Usuário criado', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email já cadastrado' });
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.senha_hash);
        if (!match) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: 'Login sucesso', token, id: user.id, nome: user.nome, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        const user = rows[0];

        const token = uuidv4();
        const expiracao = new Date(Date.now() + 30 * 60000);

        await db.execute(
            'INSERT INTO reset_tokens (token, usuario_id, expira_em) VALUES (?, ?, ?)',
            [token, user.id, expiracao]
        );

        const resetLink = `${PUBLIC_URL}/reset-password?token=${token}`;

        await sendResetEmail(user.email, resetLink);

        res.json({ message: 'E-mail de recuperação enviado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar recuperação' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, novaSenha } = req.body;
    try {
        const [tokens] = await db.execute('SELECT * FROM reset_tokens WHERE token = ?', [token]);
        if (tokens.length === 0) return res.status(400).json({ error: 'Token inválido' });

        const resetData = tokens[0];
        if (resetData.usado) return res.status(400).json({ error: 'Token já foi utilizado' });
        if (new Date() > new Date(resetData.expira_em)) return res.status(400).json({ error: 'Token expirado' });

        const hashedPassword = await bcrypt.hash(novaSenha, 10);

        await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hashedPassword, resetData.usuario_id]);
        await db.execute('UPDATE reset_tokens SET usado = TRUE WHERE id = ?', [resetData.id]);

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
};

exports.authorize = async (req, res) => {
    const { userId, requiredRole, action } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

    try {
        const [rows] = await db.execute('SELECT id, nome, email, role FROM usuarios WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = rows[0];
        const userRole = user.role || 'user';
        const isAdmin = userRole === 'admin';

        if (requiredRole === 'admin' && !isAdmin) {
            return res.status(403).json({
                allowed: false,
                error: 'Permissão negada: ação restrita a administradores.',
                user: { id: user.id, nome: user.nome, role: userRole }
            });
        }

        return res.json({
            allowed: true,
            user: { id: user.id, nome: user.nome, role: userRole }
        });
    } catch (error) {
        console.error('Erro na autorização do auth-service:', error);
        return res.status(500).json({ error: 'Erro interno no auth-service' });
    }
};

// Atividade 6: grava bio + referência da foto (chave do objeto no MinIO) do usuário.
// Chamado apenas pelo backend (rede interna), que já validou que o solicitante é o dono do próprio perfil.
exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const { bio, avatarKey } = req.body;
    try {
        const [rows] = await db.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Atualização parcial: só troca os campos que vieram na requisição (ex.: enviar só a foto não apaga a bio).
        const sets = [], params = [];
        if (bio !== undefined) { sets.push('bio = ?'); params.push(bio); }
        if (avatarKey !== undefined) { sets.push('avatar_key = ?'); params.push(avatarKey); }
        if (sets.length > 0) {
            params.push(id);
            await db.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
        }

        const [updated] = await db.execute('SELECT id, nome, email, role, bio, avatar_key, criado_em FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Perfil atualizado', user: updated[0] });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, nome, email, role, criado_em FROM usuarios ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
};

