const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Load env variables from project root if needed

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
    console.log('Conectado ao banco de dados MariaDB/MySQL.');

    // A tabela usuarios é gerenciada pelo auth-service

    await connection.query(`
      CREATE TABLE IF NOT EXISTS favoritos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tmdb_movie_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        poster_path VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        UNIQUE (usuario_id, tmdb_movie_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tmdb_movie_id INT NOT NULL,
        texto TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);

    connection.release();
    console.log('Tabelas sincronizadas.');
  } catch (error) {
    console.error('Erro ao conectar ou criar tabelas no MariaDB:', error.message);
  }
}

initDb();

module.exports = pool;
