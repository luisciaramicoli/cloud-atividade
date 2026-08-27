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
        res.json({ message: 'Login sucesso', token, nome: user.nome, role: user.role });
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
