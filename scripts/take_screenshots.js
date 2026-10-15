const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  console.log('Iniciando Chrome headless com porta 9222...');
  const chromeProc = spawn('flatpak', [
    'run', 'com.google.Chrome',
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,820',
    '--remote-debugging-port=9222'
  ], { stdio: 'ignore' });

  // Aguarda Chrome inicializar
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
    await sleep(500);
  }

  if (!versionData) {
    throw new Error('Falha ao conectar ao Chrome na porta 9222');
  }

  console.log('Chrome pronto. Criando aba...');
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  await new Promise(resolve => ws.addEventListener('open', resolve));
  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'Network.enable');
  await sendCdp(ws, 'Runtime.enable');

  // --- 1. SCREENSHOT DO BENEFÍCIO PREMIUM (Catálogo com ⭐ Premium e Favoritos Ilimitados) ---
  console.log('Realizando login como Luis Premium Teste...');
  const premLoginRes = await fetch('http://localhost:8218/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'luis_premium_test@teste.com', password: 'Password123!' })
  });
  const premCookieHeader = premLoginRes.headers.get('set-cookie');
  const tokenMatch = premCookieHeader?.match(/token=([^;]+)/);
  const premToken = tokenMatch ? tokenMatch[1] : '';

  await sendCdp(ws, 'Network.setCookie', {
    name: 'token',
    value: premToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true
  });

  console.log('Navegando para o Catálogo com usuário Premium...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:8218/' });
  await sleep(2500);

  const screenshot1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '../docs/print-beneficio-premium.png'), Buffer.from(screenshot1.data, 'base64'));
  console.log('Salvo docs/print-beneficio-premium.png');

  // --- 2. SCREENSHOT DO PERFIL PREMIUM (Mostrando Plano Premium Ativo e Favoritos) ---
  console.log('Navegando para o Perfil com usuário Premium...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:8218/profile' });
  await sleep(2000);

  const screenshot2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '../docs/print-perfil-premium.png'), Buffer.from(screenshot2.data, 'base64'));
  console.log('Salvo docs/print-perfil-premium.png');

  // --- 3. SCREENSHOT DA RESTRIÇÃO DE PLANO GRATUITO & MODAL UPGRADE STRIPE ---
  console.log('Realizando login como Carlos Free (plano gratuito)...');
  // Localiza o e-mail do carlos free criado
  const freeLoginRes = await fetch('http://localhost:8218/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'carlos_user@teste.com', password: 'password123' })
  }).catch(() => null);

  let freeToken = '';
  if (freeLoginRes && freeLoginRes.ok) {
    const freeCookieHeader = freeLoginRes.headers.get('set-cookie');
    const freeTokenMatch = freeCookieHeader?.match(/token=([^;]+)/);
    freeToken = freeTokenMatch ? freeTokenMatch[1] : '';
  } else {
    // Cria novo free
    const fEmail = 'carlos_free_ui@teste.com';
    await fetch('http://localhost:8218/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Carlos Free UI', email: fEmail, password: 'Password123!' })
    });
    const fl = await fetch('http://localhost:8218/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fEmail, password: 'Password123!' })
    });
    const c = fl.headers.get('set-cookie');
    freeToken = c.match(/token=([^;]+)/)[1];

    // Adiciona 5 favoritos para atingir o limite
    for (let i = 1; i <= 5; i++) {
      await fetch('http://localhost:8218/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': c },
        body: JSON.stringify({ tmdb_movie_id: 300 + i, titulo: 'Filme ' + i })
      });
    }
  }

  await sendCdp(ws, 'Network.setCookie', {
    name: 'token',
    value: freeToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true
  });

  console.log('Navegando para o catálogo com usuário Free...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:8218/' });
  await sleep(2500);

  // Clica no botão de assinar ou favoritar para exibir o modal de upgrade Stripe
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('.btn-nav-premium') || document.querySelector('.premium-limit-banner button');
      if (btn) btn.click();
    `
  });
  await sleep(1000);

  const screenshot3 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '../docs/print-limite-gratuito-403.png'), Buffer.from(screenshot3.data, 'base64'));
  console.log('Salvo docs/print-limite-gratuito-403.png');

  ws.close();
  chromeProc.kill('SIGKILL');
  console.log('Screenshots capturados com sucesso!');
}

main().catch(err => {
  console.error('Erro ao gerar screenshots:', err);
  process.exit(1);
});
