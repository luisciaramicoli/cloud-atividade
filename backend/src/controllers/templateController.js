const db = require('../config/db');

exports.getTemplates = async (req, res) => {
  try {
    const [templates] = await db.execute('SELECT * FROM templates ORDER BY id ASC');
    const formatted = templates.map(t => {
      let estrutura = [];
      try {
        estrutura = typeof t.estrutura_json === 'string' ? JSON.parse(t.estrutura_json) : t.estrutura_json;
      } catch (e) {
        estrutura = [];
      }
      return { ...t, estrutura };
    });
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
};

