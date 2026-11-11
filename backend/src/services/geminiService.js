const axios = require('axios');

const schema = {
  type: 'OBJECT', properties: {
    titulo: { type: 'STRING' },
    slides: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      tipo: { type: 'STRING' }, titulo: { type: 'STRING' }, subtitulo: { type: 'STRING' }
    }, required: ['tipo', 'titulo', 'subtitulo'] } },
    legenda: { type: 'STRING' }, hashtags: { type: 'STRING' }
  }, required: ['titulo', 'slides', 'legenda', 'hashtags']
};

function failure(message, status = 502) {
  const error = new Error(message);
  error.publicMessage = message;
  error.publicStatus = status;
  return error;
}

async function requestModel(model, body, key, stage) {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw failure('Modelo Gemini configurado é inválido.', 503);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, body, {
        headers: { 'x-goog-api-key': key }, timeout: 120000, maxContentLength: 20 * 1024 * 1024
      });
      return response.data.candidates?.[0]?.content?.parts || [];
    } catch (error) {
    const status = error.response?.status;
    if ([500, 502, 503, 504].includes(status) && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** attempt)));
      continue;
    }
    console.error('Gemini: falha na geração', { etapa: stage, modelo: model, status: status || null, codigo: error.code || null });
    if (status === 400 || status === 401 || status === 403) throw failure('O Gemini recusou a solicitação. Confira a chave e o acesso aos modelos.');
    if (status === 429) {
      const details = error.response?.data?.error?.details;
      const violations = Array.isArray(details) ? details.flatMap(detail => Array.isArray(detail.violations) ? detail.violations : []) : [];
      const zeroQuota = violations.some(violation => String(violation.quotaValue) === '0');
      const retry = Array.isArray(details) ? details.find(detail => typeof detail.retryDelay === 'string')?.retryDelay : null;
      const seconds = retry && /^\d+(?:\.\d+)?s$/.test(retry) ? Math.ceil(Number.parseFloat(retry)) : null;
      const hint = zeroQuota
        ? 'A cota disponível para este modelo é zero. Confira o plano e o faturamento do projeto no Google AI Studio.'
        : `Confira os limites do projeto no Google AI Studio.${seconds && seconds <= 3600 ? ` Tente novamente em ${seconds} segundos.` : ' Tente novamente mais tarde.'}`;
      throw failure(`Limite do Gemini atingido na geração de ${stage} (${model}). ${hint}`, 429);
    }
    if (status === 404) throw failure(`O modelo Gemini de ${stage} (${model}) não foi encontrado. Confira a configuração no .env.`);
    if (status >= 500) throw failure(`O Gemini está temporariamente indisponível para gerar ${stage} (${model}). Tente novamente mais tarde.`);
    if (status) throw failure(`O Gemini retornou erro HTTP ${status} ao gerar ${stage} (${model}).`);
    throw failure(`Não foi possível conectar ao Gemini para gerar ${stage}. Verifique a conexão e tente novamente.`);
    }
  }
}

async function generatePost({ tema, nicho, formato, tom_voz }) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw failure('Configure GEMINI_API_KEY no arquivo .env para gerar publicações.', 503);
  const cleanTema = tema.trim().slice(0, 500);
  const cleanNicho = typeof nicho === 'string' && nicho.trim() ? nicho.trim().slice(0, 50) : 'Negócios';
  const cleanFormato = typeof formato === 'string' && formato.trim() ? formato.trim().slice(0, 50) : 'carrossel';
  const cleanTom = typeof tom_voz === 'string' ? tom_voz.slice(0, 100) : 'educativo';
  const textParts = await requestModel(process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash', {
    contents: [{ parts: [{ text: `Crie uma publicação para Instagram em português brasileiro. Tema: ${cleanTema}. Nicho: ${cleanNicho}. Formato: ${cleanFormato}. Tom: ${cleanTom}. Crie slides concisos e úteis, legenda e hashtags relevantes. Para carrossel, use 5 slides; para post único, use 1. Não invente dados ou promessas.` }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema }
  }, key, 'texto');
  let content;
  try { content = JSON.parse(textParts.map(part => part.text || '').join('')); } catch { throw failure('O Gemini retornou conteúdo inválido. Tente novamente.'); }
  if (typeof content.titulo !== 'string' || !content.titulo.trim() || !Array.isArray(content.slides) || !content.slides.length || content.slides.length > 10 || typeof content.legenda !== 'string' || typeof content.hashtags !== 'string' || content.slides.some(slide => !slide || typeof slide.titulo !== 'string' || typeof slide.subtitulo !== 'string' || typeof slide.tipo !== 'string')) {
    throw failure('O Gemini retornou conteúdo incompleto. Tente novamente.');
  }
  let imageParts;
  let imageWarning;
  try {
    imageParts = await requestModel(process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image', {
    contents: [{ parts: [{ text: `Crie uma imagem quadrada de fundo para um post de Instagram sobre ${cleanTema}, no nicho ${cleanNicho}. Visual profissional, composição discreta e coerente com o tema, cores equilibradas e espaço livre no centro para texto branco que será adicionado depois. Sem texto, letras, números, logotipos ou marcas d'água.` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } }
    }, key, 'imagem');
  } catch (error) {
    if (error.publicStatus !== 429) throw error;
    imageWarning = 'O texto foi gerado, mas o limite do Gemini impediu a criação da imagem. A prévia usa um fundo padrão. Confira a cota de imagens no Google AI Studio.';
  }
  let generatedImage = null;
  if (imageParts) {
    const image = imageParts.find(part => part.inlineData?.data && ['image/png', 'image/jpeg', 'image/webp'].includes(part.inlineData.mimeType))?.inlineData;
    if (!image) throw failure('O Gemini não retornou uma imagem de fundo. Tente novamente.');
    const buffer = Buffer.from(image.data, 'base64');
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) throw failure('O Gemini retornou uma imagem inválida. Tente novamente.');
    generatedImage = { buffer, mimeType: image.mimeType };
  }
  return { post: {
    titulo: content.titulo.trim().slice(0, 255), nicho: cleanNicho, formato: cleanFormato,
    slides: content.slides.map((slide, i) => ({ slide: i + 1, tipo: slide.tipo.slice(0, 50), titulo: slide.titulo.slice(0, 300), subtitulo: slide.subtitulo.slice(0, 600) })),
    legenda: content.legenda.slice(0, 5000), hashtags: content.hashtags.slice(0, 500)
  }, image: generatedImage, imageWarning };
}

module.exports = { generatePost };
