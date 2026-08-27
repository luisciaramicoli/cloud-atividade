const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendResetEmail = async (to, resetLink) => {
    return await transporter.sendMail({
        from: '"Cloud Atividade" <noreply@cloud.test>',
        to,
        subject: 'Recuperação de Senha',
        text: `Acesse o link para redefinir sua senha: ${resetLink}`
    });
};

module.exports = { sendResetEmail };

