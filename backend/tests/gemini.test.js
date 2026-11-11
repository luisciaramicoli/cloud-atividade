const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { generatePost } = require('../src/services/geminiService');

test('Gemini gera conteúdo estruturado e imagem, usando a chave apenas no cabeçalho', async (t) => {
  t.mock.method(axios, 'post', async (url, body, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    assert.ok(!url.includes('test-key'));
    if (body.generationConfig.responseMimeType) {
      return { data: { candidates: [{ content: { parts: [{ text: JSON.stringify({ titulo: 'Título', slides: [{ tipo: 'capa', titulo: 'Capa', subtitulo: 'Descrição' }], legenda: 'Legenda', hashtags: '#teste' }) }] } }] } };
    }
    return { data: { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('imagem').toString('base64') } }] } }] } };
  });
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; });
  const result = await generatePost({ tema: 'Teste', nicho: 'Saúde' });
  assert.equal(result.post.slides[0].slide, 1);
  assert.equal(result.post.nicho, 'Saúde');
  assert.equal(result.image.buffer.toString(), 'imagem');
  assert.equal(axios.post.mock.callCount(), 2);
});

test('Gemini informa quando a chave não está configurada', async (t) => {
  const oldKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  t.after(() => { if (oldKey !== undefined) process.env.GEMINI_API_KEY = oldKey; });
  await assert.rejects(generatePost({ tema: 'Teste' }), { publicStatus: 503 });
});

test('identifica limite de cota de imagem sem expor detalhes da resposta', async (t) => {
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; });
  let calls = 0;
  t.mock.method(axios, 'post', async () => {
    if (++calls === 1) return { data: { candidates: [{ content: { parts: [{ text: JSON.stringify({ titulo: 'Título', slides: [{ tipo: 'capa', titulo: 'Capa', subtitulo: 'Descrição' }], legenda: 'Legenda', hashtags: '#teste' }) }] } }] } };
    throw { response: { status: 429, data: { error: { details: [{ violations: [{ quotaValue: '0' }] }] } } } };
  });
  const result = await generatePost({ tema: 'Teste' });
  assert.equal(result.post.titulo, 'Título');
  assert.equal(result.image, null);
  assert.match(result.imageWarning, /limite do Gemini/);
});

test('repete uma falha temporária do Gemini antes de continuar', async (t) => {
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  t.after(() => { if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; });
  let calls = 0;
  t.mock.method(axios, 'post', async () => {
    calls++;
    if (calls === 1) throw { response: { status: 503 } };
    if (calls === 2) return { data: { candidates: [{ content: { parts: [{ text: JSON.stringify({ titulo: 'Título', slides: [{ tipo: 'capa', titulo: 'Capa', subtitulo: 'Descrição' }], legenda: 'Legenda', hashtags: '#teste' }) }] } }] } };
    return { data: { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'aW1hZ2Vt' } }] } }] } };
  });
  const result = await generatePost({ tema: 'Teste' });
  assert.equal(result.post.titulo, 'Título');
  assert.equal(calls, 3);
});
