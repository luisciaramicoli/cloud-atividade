const mysql = require('mysql2/promise');
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
    console.log('PostCraft Backend: Conectado ao banco de dados MariaDB.');

    // 1. Tabela de Marcas / Perfis de Negócio do Usuário
    await connection.query(`
      CREATE TABLE IF NOT EXISTS marcas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        nicho VARCHAR(50) NOT NULL,
        paleta_cores VARCHAR(100) DEFAULT '#6366f1,#8b5cf6,#ec4899',
        logo_url VARCHAR(255) DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_marcas_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabela de Posts do Instagram (Recurso Principal do Negócio)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        marca_id INT DEFAULT NULL,
        titulo VARCHAR(255) NOT NULL,
        nicho VARCHAR(50) NOT NULL,
        formato VARCHAR(50) DEFAULT 'carrossel',
        slides_json LONGTEXT NOT NULL,
        legenda LONGTEXT NOT NULL,
        hashtags VARCHAR(500) DEFAULT NULL,
        status VARCHAR(30) DEFAULT 'gerado',
        imagem_url VARCHAR(255) DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_posts_usuario (usuario_id),
        INDEX idx_posts_marca (marca_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabela de Templates de Conteúdo Pré-validados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        nicho VARCHAR(50) NOT NULL,
        formato VARCHAR(50) DEFAULT 'carrossel',
        estrutura_json LONGTEXT NOT NULL,
        prompt_base TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Inserir templates padrão caso a tabela esteja vazia
    const [templatesCount] = await connection.query('SELECT COUNT(*) as total FROM templates');
    if (templatesCount[0].total === 0) {
      await connection.query(`
        INSERT INTO templates (titulo, nicho, formato, estrutura_json, prompt_base) VALUES
        (
          'Carrossel Mitos vs Verdades (Nutrição & Saúde)',
          'Nutrição & Saúde',
          'carrossel',
          '[
            {"slide": 1, "tipo": "capa", "titulo": "3 Mitos sobre Alimentação Noturna que te Enganaram a Vida Toda", "subtitulo": "Arraste para o lado e entenda a bioquímica real por trás do jantar 👉"},
            {"slide": 2, "tipo": "conteudo", "titulo": "Mito 1: Carboidrato depois das 18h vira gordura", "subtitulo": "O metabolismo não para ao anoitecer. O que determina ganho ou perda ponderal é o balanço calórico global."},
            {"slide": 3, "tipo": "conteudo", "titulo": "Mito 2: Cortar glúten desinflama qualquer pessoa", "subtitulo": "Salvo casos de doença celíaca ou sensibilidade não-celíaca, o emagrecimento ocorre pela troca de ultraprocessados por comida de verdade."},
            {"slide": 4, "tipo": "conteudo", "titulo": "Mito 3: Fruta após o almoço fermenta e faz mal", "subtitulo": "A absorção gástrica processa macronutrientes concomitantemente de forma eficiente e segura."},
            {"slide": 5, "tipo": "cta", "titulo": "Qual desses mitos você acreditava?", "subtitulo": "Comente abaixo e envie para quem precisa desmistificar a alimentação saudável!"}
          ]',
          'Roteiro educativo de nutrição clínica desmistificando crenças comuns com tom técnico e acessível.'
        ),
        (
          'Guia Passo a Passo: Direitos do Consumidor (Direito)',
          'Direito & Advocacia',
          'carrossel',
          '[
            {"slide": 1, "tipo": "capa", "titulo": "Voo Cancelado ou Atrasado? 4 Direitos que a Companhia não Conta", "subtitulo": "Salve este post para sua próxima viagem aérea ✈️"},
            {"slide": 2, "tipo": "conteudo", "titulo": "1. Comunicação Imediata (1h de atraso)", "subtitulo": "A companhia deve garantir internet e chamadas telefônicas gratuitas."},
            {"slide": 3, "tipo": "conteudo", "titulo": "2. Alimentação Garantida (2h de atraso)", "subtitulo": "Voucher ou refeição adequada sob responsabilidade da empresa aérea."},
            {"slide": 4, "tipo": "conteudo", "titulo": "3. Hospedagem e Transporte (4h de atraso)", "subtitulo": "Hotel com traslado de ida e volta se houver necessidade de pernoite."},
            {"slide": 5, "tipo": "cta", "titulo": "Já enfrentou esse problema?", "subtitulo": "Salve este carrossel e consulte sempre um advogado especialista em direito do consumidor."}
          ]',
          'Roteiro informativo sobre aviação e direitos dos passageiros com base nas normas da ANAC.'
        ),
        (
          'Checklist de Treino Hipertrofia (Fitness & Personal)',
          'Fitness & Personal',
          'carrossel',
          '[
            {"slide": 1, "tipo": "capa", "titulo": "Por que Seus Braços Estagnaram? 3 Erros Fatais", "subtitulo": "Se você treina firme e não vê evolução, corrija isso agora 👇"},
            {"slide": 2, "tipo": "conteudo", "titulo": "Erro 1: Volume excessivo e carga insuficiente", "subtitulo": "Fazer muitas repetições sem chegar perto da falha mecânica gera fadiga sem tensão muscular ótima."},
            {"slide": 3, "tipo": "conteudo", "titulo": "Erro 2: Ignorar o tríceps na rotina", "subtitulo": "O tríceps responde por mais de 60% do diâmetro do braço. Priorize exercícios multiarticulares pesados."},
            {"slide": 4, "tipo": "conteudo", "titulo": "Erro 3: Não progredir carga semanalmente", "subtitulo": "O músculo só cresce se for submetido a sobrecarga progressiva com registro de repetições."},
            {"slide": 5, "tipo": "cta", "titulo": "Quer um plano de treino individualizado?", "subtitulo": "Clique no link da bio para agendar sua consultoria esportiva personalizada!"}
          ]',
          'Carrossel dinâmico para educadores físicos e academias com foco em conversão de consultoria.'
        );
      `);
      console.log('PostCraft Backend: Templates padrão inicializados com sucesso.');
    }

    // Limpeza de tabelas antigas que não servem mais
    try {
      await connection.query('DROP TABLE IF EXISTS favoritos');
      await connection.query('DROP TABLE IF EXISTS comentarios');
    } catch (e) {
      // Ignora se não existirem
    }

    connection.release();
    console.log('PostCraft Backend: Tabelas do domínio sincronizadas.');
  } catch (error) {
    console.error('PostCraft Backend: Erro ao conectar ou sincronizar tabelas no MariaDB:', error.message);
  }
}

initDb();

module.exports = pool;
