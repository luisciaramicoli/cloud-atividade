const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Configuração Nodemailer (Mailtrap)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Registro
app.post('/register', async (req, res) => {
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
});

// Login
app.post('/login', async (req, res) => {
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
});

// Esqueci a senha
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        const user = rows[0];

        const token = uuidv4();
        // 30 minutos a partir de agora
        const expiracao = new Date(Date.now() + 30 * 60000);

        await db.execute(
            'INSERT INTO reset_tokens (token, usuario_id, expira_em) VALUES (?, ?, ?)',
            [token, user.id, expiracao]
        );

        const resetLink = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        await transporter.sendMail({
            from: '"Cloud Atividade" <noreply@cloud.test>',
            to: user.email,
            subject: 'Recuperação de Senha',
            text: `Acesse o link para redefinir sua senha: ${resetLink}`
        });

        res.json({ message: 'E-mail de recuperação enviado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar recuperação' });
    }
});

// Validar e Resetar Senha
app.post('/reset-password', async (req, res) => {
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
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth Service rodando na porta ${PORT}`);
});

