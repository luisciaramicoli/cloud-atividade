# Validação de interface — 12/11/2026

Executada com Chromium real, via Playwright, frontend local e API Docker real.
Conta exclusiva de teste criada; preservados marca e post de teste. Nenhum pagamento concluído.

## Resultados
- Landing, recuperação e redefinição: capturas e medição em 320, 390, 768 e 1440 px, sem excesso de largura do documento.
- Dashboard e perfil: mesmos quatro tamanhos. Cabeçalho do perfil corrigido e repetido em 320 px (largura e conteúdo: 288 px).
- Cadastro: HTTP 201; login: HTTP 200; dashboard exibido.
- Perfil com bio e imagem: HTTP 200.
- Marca: HTTP 201; logo após correções: HTTP 200; leitura da imagem: HTTP 200.
- IA: HTTP 201, texto e cinco slides gerados; aviso explícito de cota de imagem atingida.
- Edição: título alterado e encontrado após recarregar a página.
- Prévia: aberta e fechada com Escape.
- Rota desconhecida: redirecionada para /.
- Logout: HTTP 200 e landing exibida.
- Recuperação com e-mail inexistente: HTTP 200 com resposta genérica.
- Redefinição sem token: erro exibido.
- Build de produção e git diff --check aprovados.

## Correções encontradas pelos testes
Campo multipart de logo alinhado ao middleware (foto); backend passou a utilizar uploadAvatar e rota de imagens existente. Proxy /storage adicionado ao Vite.
Perfil usa ID carregado da API de perfil para salvar. Fundo da seção de posts e cabeçalho móvel corrigidos.

## Limitações
Stripe retornou HTTP 500 com credencial OAuth expirada; checkout hospedado e pagamento não validados.
Gemini gerou texto, mas não imagem por limite de cota.
SMTP_USER e SMTP_PASS ausentes no Compose: entrega de e-mail e redefinição com token válido não validadas.
Teste realizado em Chromium, não em Safari/Firefox. Auditoria administrativa e outros papéis não exercitados.
