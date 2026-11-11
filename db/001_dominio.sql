-- =============================================================================
-- PostCraft AI · Atividade 10: Modelagem do Domínio de Negócio no MariaDB
-- Autor: Luis Gustavo Bonfim Ciaramicoli (@luisciaramicoli)
-- Professor: Allan Siriani (@siriani)
-- =============================================================================

USE cloud_atividade;

-- 1. Ajuste da tabela usuarios para suportar os 3 papéis do negócio: 'criador', 'revisor' e 'admin'
ALTER TABLE usuarios 
  MODIFY COLUMN role VARCHAR(50) DEFAULT 'criador';

-- 2. Tabela de Marcas / Perfis de Negócio (Multi-tenant por usuário)
CREATE TABLE IF NOT EXISTS marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  nicho VARCHAR(50) NOT NULL,
  paleta_cores VARCHAR(100) DEFAULT '#6366f1,#8b5cf6,#ec4899',
  logo_url VARCHAR(255) DEFAULT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Posts do Instagram (Recurso Principal do Negócio)
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  marca_id INT DEFAULT NULL,
  titulo VARCHAR(255) NOT NULL,
  nicho VARCHAR(50) NOT NULL,
  formato VARCHAR(50) DEFAULT 'carrossel', -- 'carrossel', 'feed_quadrado', 'feed_retrato', 'stories'
  slides_json LONGTEXT NOT NULL,          -- Array JSON com a estrutura de cada slide do carrossel
  legenda LONGTEXT NOT NULL,              -- Texto persuasivo com ganchos, corpo e CTA
  hashtags VARCHAR(500) DEFAULT NULL,     -- Tags otimizadas para descoberta
  status VARCHAR(30) DEFAULT 'gerado',    -- 'rascunho', 'gerado', 'publicado'
  imagem_url VARCHAR(255) DEFAULT NULL,   -- Referência da arte gerada salva no MinIO
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Templates de Conteúdo Pré-validados por Nicho
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  nicho VARCHAR(50) NOT NULL,
  formato VARCHAR(50) DEFAULT 'carrossel',
  estrutura_json LONGTEXT NOT NULL,
  prompt_base TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Limpeza de tabelas legadas que não pertencem ao novo domínio
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS comentarios;

