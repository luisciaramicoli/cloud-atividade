const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cloud_atividade',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('Auth-Service: Conectado ao banco de dados MariaDB.');

    // Tabela usuarios alterada para suportar 'role'
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de tokens para reset de senha
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        usuario_id INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expira_em TIMESTAMP NOT NULL,
        usado BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    // Criar coluna 'role' silenciosamente em bancos legados
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN role VARCHAR(50) DEFAULT 'user'`);
    } catch (e) {
      // Ignora erro se a coluna já existir
    }

    connection.release();
    console.log('Auth-Service: Tabelas sincronizadas.');
  } catch (error) {
    console.error('Auth-Service: Erro ao conectar ou criar tabelas:', error.message);
  }
}

initDb();

module.exports = pool;

