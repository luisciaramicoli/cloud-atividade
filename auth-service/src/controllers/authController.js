const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendResetEmail } = require('../services/emailService');

const { JWT_SECRET } = require('../config/security');
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:5173';

const BCRYPT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // limite do bcrypt: bytes além disso seriam ignorados silenciosamente

// Hash de uma senha qualquer, usado para gastar o mesmo tempo quando o e-mail não existe (evita enumeração por tempo de resposta)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const isStr = (v) => typeof v === 'string';
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function validatePassword(password) {
    if (!isStr(password)) return 'Senha inválida';
    if (password.length < PASSWORD_MIN) return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres`;
    if (Buffer.byteLength(password) > PASSWORD_MAX) return `A senha deve ter no máximo ${PASSWORD_MAX} bytes`;
    return null;
}

exports.register = async (req, res) => {
    const { nome, email, password } = req.body;
    if (!isStr(nome) || !isStr(email) || !isStr(password) || !nome.trim() || !email.trim() || !password) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    if (nome.trim().length > 100) return res.status(400).json({ error: 'Nome deve ter no máximo 100 caracteres' });
    if (email.length > 150 || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'E-mail inválido' });
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ error: pwdError });
    try {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        // A role nunca vem do corpo da requisição: todo cadastro público nasce como 'user'.
        const [result] = await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome.trim(), email.trim().toLowerCase(), hashedPassword]
        );
        res.status(201).json({ message: 'Usuário criado', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email já cadastrado' });
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!isStr(email) || !isStr(password) || !email || !password || password.length > 1024) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        const user = rows[0];

        // Mesma resposta e mesmo custo para "e-mail inexistente" e "senha errada": não revela quais e-mails estão cadastrados.
        const match = await bcrypt.compare(password, user ? user.senha_hash : DUMMY_HASH);
        if (!user || !match) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '2h' });
        res.json({ message: 'Login sucesso', token, id: user.id, nome: user.nome, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!isStr(email) || !email.trim()) return res.status(400).json({ error: 'E-mail é obrigatório' });
    // Resposta idêntica exista o e-mail ou não, para não permitir descobrir quem tem conta.
    const genericResponse = { message: 'Se o e-mail estiver cadastrado, enviaremos um link de recuperação.' };
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        if (rows.length === 0) return res.json(genericResponse);
        const user = rows[0];

        // Token aleatório de 256 bits; no banco fica só o hash (vazamento do banco não entrega links válidos).
        const token = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 30 * 60000);

        // Invalida links anteriores ainda pendentes deste usuário
        await db.execute('UPDATE reset_tokens SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE', [user.id]);
        await db.execute(
            'INSERT INTO reset_tokens (token, usuario_id, expira_em) VALUES (?, ?, ?)',
            [hashToken(token), user.id, expiracao]
        );

        const resetLink = `${PUBLIC_URL}/reset-password?token=${token}`;

        try {
            await sendResetEmail(user.email, resetLink);
        } catch (mailError) {
            // Falha de SMTP não pode virar uma resposta diferente (revelaria que a conta existe)
            console.error('Falha ao enviar e-mail de recuperação:', mailError.message);
        }

        res.json(genericResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar recuperação' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, novaSenha } = req.body;
    if (!isStr(token) || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'Token inválido' });
    const pwdError = validatePassword(novaSenha);
    if (pwdError) return res.status(400).json({ error: pwdError });
    try {
        const [tokens] = await db.execute('SELECT * FROM reset_tokens WHERE token = ?', [hashToken(token)]);
        if (tokens.length === 0) return res.status(400).json({ error: 'Token inválido' });

        const resetData = tokens[0];
        if (resetData.usado) return res.status(400).json({ error: 'Token já foi utilizado' });
        if (new Date() > new Date(resetData.expira_em)) return res.status(400).json({ error: 'Token expirado' });

        const hashedPassword = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);

        await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hashedPassword, resetData.usuario_id]);
        await db.execute('UPDATE reset_tokens SET usado = TRUE WHERE id = ?', [resetData.id]);

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
};

exports.authorize = async (req, res) => {
    const { userId, requiredRole, action } = req.body;
    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) return res.status(400).json({ error: 'userId é obrigatório' });

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
    const id = Number(req.params.id);
    const { bio, avatarKey } = req.body;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    if (bio !== undefined && (!isStr(bio) || bio.length > 280)) return res.status(400).json({ error: 'Bio inválida (máximo 280 caracteres)' });
    if (avatarKey !== undefined && (!isStr(avatarKey) || !/^\d+-\d+-[a-f0-9]{8}\.(jpg|png|webp|gif)$/.test(avatarKey))) {
        return res.status(400).json({ error: 'Chave de avatar inválida' });
    }
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

