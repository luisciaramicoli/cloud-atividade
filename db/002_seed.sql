-- =============================================================================
-- PostCraft AI · Atividade 10: Script de Seed de Dados
-- =============================================================================

USE cloud_atividade;

-- Inserir Templates Validados de Alta Conversão por Nicho
INSERT INTO templates (titulo, nicho, formato, estrutura_json, prompt_base) VALUES
(
  'Carrossel Mitos vs Verdades (Nutrição & Saúde)',
  'Nutrição & Saúde',
  'carrossel',
  '[
    {"slide": 1, "tipo": "capa", "titulo": "3 Mitos sobre Carboidratos à Noite que te Enganaram a Vida Toda", "subtitulo": "Arraste para o lado e pare de ter medo de comer batata no jantar 👉"},
    {"slide": 2, "tipo": "conteudo", "titulo": "Mito 1: Carboidrato depois das 18h vira gordura", "subtitulo": "Seu metabolismo não desliga ao pôr do sol. O que determina ganho ou perda de peso é o balanço calórico total do dia."},
    {"slide": 3, "tipo": "conteudo", "titulo": "Mito 2: Cortar glúten emagrece mais rápido", "subtitulo": "A menos que você tenha doença celíaca, o emagrecimento ocorre pelo déficit calórico e redução de ultraprocessados, não pelo glúten."},
    {"slide": 4, "tipo": "conteudo", "titulo": "Mito 3: Fruta tem muito açúcar e engorda", "subtitulo": "A frutose da fruta vem acompanhada de fibras, água e micronutrientes que modulam a resposta glicêmica."},
    {"slide": 5, "tipo": "cta", "titulo": "Qual desses mitos você acreditava?", "subtitulo": "Comente aqui embaixo e envie para aquela amiga que ainda tem medo de comer carbo à noite!"}
  ]',
  'Gere um carrossel educativo desmistificando crenças populares sobre alimentação saudável com tom científico porém acessível.'
),
(
  'Guia Passo a Passo: Direitos do Consumidor (Direito)',
  'Direito & Advocacia',
  'carrossel',
  '[
    {"slide": 1, "tipo": "capa", "titulo": "Voo Cancelado ou Atrasado? Conheça os 4 Direitos que as Companhias Escondem", "subtitulo": "Salve este post para não passar sufoco na sua próxima viagem ✈️"},
    {"slide": 2, "tipo": "conteudo", "titulo": "1. Direito à Comunicação (1 hora de atraso)", "subtitulo": "A empresa aérea é obrigada a fornecer acesso gratuito a internet e telefonemas."},
    {"slide": 3, "tipo": "conteudo", "titulo": "2. Alimentação Adequada (2 horas de atraso)", "subtitulo": "Voucher de alimentação ou refeição por conta da companhia aérea."},
    {"slide": 4, "tipo": "conteudo", "titulo": "3. Hospedagem e Transporte (4 horas de atraso)", "subtitulo": "Hotel com traslado de ida e volta se houver necessidade de pernoite."},
    {"slide": 5, "tipo": "cta", "titulo": "Já passou por isso em aeroportos?", "subtitulo": "Salve este carrossel e consulte sempre um advogado especialista em direito do consumidor."}
  ]',
  'Crie um roteiro didático sobre direitos do passageiro com respaldo na resolução da ANAC.'
),
(
  'Checklist de Treino Hipertrofia (Fitness & Personal)',
  'Fitness & Personal',
  'carrossel',
  '[
    {"slide": 1, "tipo": "capa", "titulo": "Por que Seus Braços Não Crescem? 3 Erros Fatais", "subtitulo": "Se você treina há mais de 6 meses e não vê resultado, corrija isso hoje 👇"},
    {"slide": 2, "tipo": "conteudo", "titulo": "Erro 1: Volume excessivo e intensidade baixa", "subtitulo": "Fazer 6 exercícios de bíceps com carga leve só gera fadiga inútil. Foque em 2 a 3 exercícios com progressão real de carga."},
    {"slide": 3, "tipo": "conteudo", "titulo": "Erro 2: Não treinar até próximo da falha", "subtitulo": "O estímulo mecânico real acontece nas últimas 2 a 3 repetições antes da falha concêntrica."},
    {"slide": 4, "tipo": "conteudo", "titulo": "Erro 3: Ignorar o tríceps", "subtitulo": "O tríceps compõe 60% do volume do braço. Dê prioridade a ele na divisão semanal."},
    {"slide": 5, "tipo": "cta", "titulo": "Quer evoluir de verdade?", "subtitulo": "Clique no link da bio para agendar sua consultoria personalizada de treinamento!"}
  ]',
  'Roteiro focado em engajamento fitness com ganchos fortes e quebra de padrões errôneos na academia.'
);

