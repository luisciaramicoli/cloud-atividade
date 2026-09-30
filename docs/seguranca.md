# Revisão de segurança do CineCloud

Levantamento das falhas encontradas no código e na infraestrutura e o que foi feito em cada uma.

## 1. Falhas encontradas e correções

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | Crítica | O Grafana era acessível por qualquer pessoa em `/grafana` com papel **Admin** anônimo e sem login. | `/grafana` (HTTP e WebSocket) passa a exigir sessão de **administrador**. O papel anônimo caiu para `Viewer`. O cookie JWT não é repassado ao Grafana. |
| 2 | Crítica | `JWT_SECRET` tinha fallback público (`secret123`). Quem conhecesse o código forjaria token de admin. | Sem fallback em produção: o serviço não sobe sem `JWT_SECRET` (mínimo 16 caracteres). O compose também recusa subir sem ele. |
| 3 | Crítica | O auth-service e o log-service não tinham autenticação: `/users` (lista de e-mails), `/authorize`, `PUT /users/:id/profile` e a gravação/leitura de `/logs`. | Essas rotas exigem o header `x-internal-token`, derivado do `JWT_SECRET`. Só o gateway o envia, por um cliente HTTP separado que nunca é usado com APIs externas. |
| 4 | Alta | CORS com `origin: true` e `credentials: true`: qualquer site podia chamar a API com a sessão do usuário. | CORS desligado por padrão (o frontend é da mesma origem). Só libera o que estiver em `CORS_ORIGINS`. |
| 5 | Alta | Sem proteção contra força bruta em login, cadastro e reset. | Limite por IP: 20 tentativas/15 min em login, cadastro e reset; 5/hora em recuperação; 300/min na API. Responde 429. |
| 6 | Alta | O Prometheus (9090) e o Grafana (3001) estavam publicados no host sem autenticação. | As portas agora escutam só em `127.0.0.1`. O `/metrics` do app só responde à rede interna e sem proxy. |
| 7 | Alta | O IP do log de auditoria vinha de `X-Forwarded-For` enviado pelo cliente, então podia ser forjado. | O IP vem de `req.ip`; o proxy só é confiável com `TRUST_PROXY` configurado. |
| 8 | Média | Enumeração de contas: login devolvia 404 ou 401 conforme o caso, e "esqueci a senha" dizia se o e-mail existia. | Login devolve sempre 401 "E-mail ou senha incorretos", com o mesmo custo de bcrypt. A recuperação devolve sempre a mesma mensagem, mesmo se o e-mail falhar. |
| 9 | Média | Tokens de reset eram UUID v4 guardados em texto puro. | Token de 256 bits (`crypto.randomBytes`), guardado como SHA-256. Links pendentes anteriores são invalidados ao pedir um novo. |
| 10 | Média | Sem validação de entrada: senha de qualquer tamanho, e-mail livre, corpos com objetos no lugar de texto. | Senha de 8 a 72 bytes, e-mail validado, nome com até 100 caracteres, tipos conferidos, IDs só inteiros positivos, comentário com até 1000 caracteres. bcrypt subiu de 10 para 12 rounds. |
| 11 | Média | O upload confiava no `Content-Type` enviado pelo cliente. | Confere a assinatura real do arquivo (JPEG/PNG/WEBP/GIF) e usa o tipo detectado. O download usa `nosniff` e CSP `sandbox`. |
| 12 | Média | `/storage/avatars/:filename` aceitava qualquer chave. | Só aceita o formato que o sistema gera (`id-timestamp-hex.ext`). |
| 13 | Média | Sem cabeçalhos de segurança. | CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP e HSTS (com `COOKIE_SECURE=true`). `X-Powered-By` removido. |
| 14 | Média | Sem defesa extra contra CSRF. | Além do `SameSite=Lax`, requisições que alteram estado com `Origin` de outro site recebem 403. |
| 15 | Média | O JWT aceitava qualquer algoritmo na verificação. | Fixado em HS256 na assinatura e na verificação. |
| 16 | Baixa | Mensagens internas vazavam ao cliente (erros do MinIO, do auth-service, `err.message` do healthcheck). | Erros genéricos no cliente; o detalhe fica só no log do servidor. |
| 17 | Baixa | A chave do TMDB ia na URL (aparece em logs de erro). | Enviada via `params` do axios, com timeout. |
| 18 | Baixa | Containers rodavam como root. | `USER node` nas imagens app, auth e log. |
| 19 | Baixa | Senha padrão `admin` no Grafana. | `GRAFANA_ADMIN_PASSWORD` obrigatória. |
| 20 | Baixa | Workflow com `packages: write` global, e o passo do webhook nunca executava (o `env` do passo não vale no próprio `if`). | `packages: write` só no job de publicação; o secret passou para o `env` do job; o `curl` agora falha se o webhook falhar. |

## 2. Variáveis novas na stack do Portainer

| Variável | Obrigatória | Observação |
|---|---|---|
| `JWT_SECRET` | Sim | **Mínimo 16 caracteres.** Se o valor atual for menor, troque (`openssl rand -hex 32`). Trocar o segredo desloga todo mundo. |
| `GRAFANA_ADMIN_PASSWORD` | Sim | Senha do admin interno do Grafana. |
| `COOKIE_SECURE` | Não | Use `true` se o site estiver em HTTPS. Com `true` em HTTP puro o login deixa de funcionar. |
| `TRUST_PROXY` | Não | Ex.: `1` se houver um proxy reverso na frente. Sem isso, o limitador de taxa enxerga o IP do proxy e trata todos os usuários como um só. |
| `CORS_ORIGINS` | Não | Só preencha se outro site precisar chamar a API. |

## 3. Testes

`backend/tests/security.test.js` cobre assinatura de imagem, limitador de taxa, verificação de origem, `/metrics` interno, cabeçalhos e o gateway (`/grafana`, `/api/logs`, `/api/users` sem sessão devolvem 401; `Origin` externo devolve 403; preflight de outro site não recebe CORS).

## 4. Riscos que continuam

- **Sessão sem revogação:** o JWT é stateless e vale por 2 h. O logout só apaga o cookie. Revogar exigiria uma lista de tokens no Redis.
- **Limitador em memória:** vale por instância. Com várias réplicas, cada uma conta separada.
- **Redis sem senha:** só é alcançável pela rede interna do Docker.
- **Watchtower com `docker.sock`:** dá controle total do Docker a esse container. Só use se aceitar o risco; o webhook do Portainer cumpre o mesmo papel.
- **Swagger via unpkg sem SRI:** `/api-docs` carrega scripts de um CDN. A CSP limita a origem, mas o ideal é hospedar os arquivos localmente.
- **Leitura pública das fotos:** é requisito da atividade.
- **Imagens `:latest`** (Grafana, Prometheus, Watchtower): convém fixar versões.
- **`npm audit`:** não foi rodado neste ambiente. Rode no CI ou localmente.
