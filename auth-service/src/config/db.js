const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

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
    console.log('PostCraft Auth-Service: Conectado ao banco de dados MariaDB.');

    // Tabela usuarios com suporte aos papéis do negócio: 'criador', 'revisor' e 'admin'
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'criador',
        bio VARCHAR(280) DEFAULT NULL,
        avatar_key VARCHAR(255) DEFAULT NULL,
        premium BOOLEAN DEFAULT FALSE,
        stripe_customer_id VARCHAR(255) DEFAULT NULL,
        stripe_subscription_id VARCHAR(255) DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Garantir colunas necessárias se a tabela já existir de atividades anteriores
    const columnsToAdd = [
      { name: 'role', def: "VARCHAR(50) DEFAULT 'criador'" },
      { name: 'bio', def: "VARCHAR(280) DEFAULT NULL" },
      { name: 'avatar_key', def: "VARCHAR(255) DEFAULT NULL" },
      { name: 'premium', def: "BOOLEAN DEFAULT FALSE" },
      { name: 'stripe_customer_id', def: "VARCHAR(255) DEFAULT NULL" },
      { name: 'stripe_subscription_id', def: "VARCHAR(255) DEFAULT NULL" }
    ];

    for (const col of columnsToAdd) {
      try {
        await connection.query(`ALTER TABLE usuarios ADD COLUMN ${col.name} ${col.def}`);
      } catch (e) {
        // Ignora se coluna já existir
      }
    }

    // Seed de contas de teste com os 3 papéis do negócio para facilidade de avaliação
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const seedUsers = [
      { nome: 'Administrador PostCraft', email: 'admin@postcraft.ai', role: 'admin', premium: 1 },
      { nome: 'Dra. Camila Rocha (Criadora)', email: 'criador@postcraft.ai', role: 'criador', premium: 1 },
      { nome: 'Lucas Revisor (Cliente)', email: 'revisor@postcraft.ai', role: 'revisor', premium: 0 }
    ];

    for (const u of seedUsers) {
      try {
        const [existing] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [u.email]);
        if (existing.length === 0) {
          await connection.query(
            'INSERT INTO usuarios (nome, email, senha_hash, role, premium) VALUES (?, ?, ?, ?, ?)',
            [u.nome, u.email, passwordHash, u.role, u.premium]
          );
          console.log(`PostCraft Auth-Service: Usuário seed criado: ${u.email} (${u.role})`);
        } else {
          // Atualiza role se já existir
          await connection.query('UPDATE usuarios SET role = ? WHERE email = ?', [u.role, u.email]);
        }
      } catch (err) {
        console.warn(`Aviso ao criar usuário ${u.email}:`, err.message);
      }
    }

    connection.release();
    console.log('PostCraft Auth-Service: Tabelas e papéis sincronizados.');
  } catch (error) {
    console.error('PostCraft Auth-Service: Erro ao conectar ou inicializar tabelas:', error.message);
  }
}

initDb();

module.exports = pool;
