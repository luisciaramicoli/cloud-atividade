# Upload de foto de perfil (MinIO) e deploy no Portainer

Este documento conta como o upload de foto de perfil foi implementado, quais problemas apareceram no deploy e quais configurações o Portainer precisa.

## 1. Visão geral

O usuário edita a **bio** e a **foto** na página `/profile`. A foto é guardada no **MinIO** (object storage compatível com S3). O MariaDB guarda só a **chave do objeto** (`avatar_key`), nunca o arquivo.

```
Navegador ──PUT /api/users/:id/profile──▶ app (backend)
                                            │  1. valida JWT, ID e arquivo (multer)
                                            │  2. grava a foto ──▶ minio (bucket "avatars")
                                            │  3. grava bio + avatar_key ──▶ auth ──▶ MariaDB
Navegador ──GET /storage/avatars/:arquivo──▶ app ──lê do──▶ minio
```

Nenhuma porta do MinIO é exposta no host. O `app` serve as fotos pelo proxy `/storage/avatars/:filename`, na mesma lógica do proxy `/grafana`. Isso evita abrir mais uma porta no host compartilhado do Portainer.

## 2. Como foi implementado

| Camada | Arquivo | O que faz |
|---|---|---|
| Infra | `minio/Dockerfile` | Compila o MinIO a partir do código-fonte (tag fixa). A imagem oficial foi descontinuada em 2025. |
| Infra | `docker-compose.yml` / `docker-compose.prod.yml` | Serviço `minio`, volume `minio_data` e variáveis `MINIO_*` no `app`. |
| Banco | `auth-service/src/config/db.js` | Colunas `bio` e `avatar_key` em `usuarios`, criadas com `ALTER TABLE` silencioso em bancos antigos. |
| Auth | `authController.updateProfile` | Atualização parcial: enviar só a foto não apaga a bio. |
| Backend | `config/minio.js` | Cliente MinIO. Cria o bucket `avatars` e aplica leitura pública. |
| Backend | `middlewares/uploadMiddleware.js` | multer em memória, campo `foto`, limite de 3 MB, só JPEG/PNG/WEBP/GIF. |
| Backend | `services/storageService.js` | Envia, remove e transmite objetos. O nome do arquivo é `id-timestamp-hex.ext`. |
| Backend | `controllers/profileController.js` | `GET /api/profile`, `PUT /api/users/:id/profile` e `GET /storage/avatars/:filename`. |
| Frontend | `pages/Profile.jsx` | Formulário de bio e foto, enviado como `multipart/form-data`. |

### Decisões de segurança
- O `PUT` compara o `:id` da URL com o `req.userId` do JWT. Se forem diferentes, responde **403** e registra o evento de auditoria `audit.security.access_denied`. O backend nunca confia no ID enviado pelo cliente.
- Só o backend escreve no bucket. As credenciais do MinIO ficam no servidor.
- A leitura pública cobre só `s3:GetObject`.
- Ao trocar de foto, a anterior é removida do bucket, para não deixar objetos órfãos.

## 3. Problemas encontrados no deploy

### 3.1 `Failure: [object Object]` ao subir a stack
- **Causa:** o serviço `minio` usava `build: ./minio`, que compila o MinIO em Go. Isso leva vários minutos, e a requisição da UI do Portainer expirou. O `[object Object]` é só o Portainer exibindo um erro que não sabe formatar.
- **Correção:** o GitHub Actions compila o MinIO uma vez e publica `ghcr.io/<owner>/cinecloud-minio`. Os composes passaram a usar essa imagem (em `docker-compose.prod.yml` ela é a única fonte; em `docker-compose.yml` o `build` ficou como alternativa).
- O `docker-compose.prod.yml` também não tinha o serviço `minio`. Foi adicionado junto com o volume e as variáveis do app.

### 3.2 HTTP 500 no `PUT /api/users/:id/profile`
- **Sintoma nos logs do `app`:** `MinIO: erro ao preparar bucket: Valid and authorized credentials required` e `Erro ao atualizar perfil: Access Denied`.
- **Causa:** `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD` não estavam definidos na stack. O app chamava o MinIO sem credenciais, o que o MinIO trata como requisição anônima.
- **Correção:** definir as duas variáveis na stack e recriar os containers (seção 4).

### 3.3 HTTP 401 em `/api/me`
Comportamento esperado quando a página carrega sem sessão. Não é erro.

## 4. Configuração necessária no Portainer

### 4.1 Variáveis da stack
Em **Stacks → sua stack → Environment variables**:

| Variável | Observação |
|---|---|
| `MINIO_ROOT_USER` | Ex.: `minioadmin`. **Obrigatória.** |
| `MINIO_ROOT_PASSWORD` | **Mínimo de 8 caracteres**, senão o MinIO não sobe. **Obrigatória.** |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o MariaDB. |
| `TMDB_API_KEY`, `JWT_SECRET` | Integração TMDB e assinatura do JWT. |
| `SMTP_USER`, `SMTP_PASS` | Envio de e-mail (Mailtrap). |
| `GHCR_OWNER`, `IMAGE_TAG` | Opcionais. Padrões: `luisciaramicoli` e `latest`. |

Depois de alterar variáveis, use **Update the stack** com **Re-pull image and redeploy**. Sem recriar os containers, o `app` continua com os valores antigos.

### 4.2 Compose da stack
Use o `docker-compose.prod.yml`. Ele puxa todas as imagens do GHCR e não compila nada no servidor.

### 4.3 Imagens no GHCR
O pacote `cinecloud-minio` precisa existir e estar **público**, como os outros. Se estiver privado, o Portainer falha ao baixar a imagem.

### 4.4 Webhook de deploy contínuo
1. Na stack, ative **Service Webhook** e copie a URL.
2. No GitHub, cadastre a URL como secret `PORTAINER_WEBHOOK_URL`:
   `gh secret set PORTAINER_WEBHOOK_URL`
3. A cada push na `main`, o pipeline faz:
   CI (testes e validação de build) → publicação das imagens no GHCR → `POST` no webhook → o Portainer refaz o deploy.

Não coloque a URL do webhook no código. Quem tem a URL consegue disparar deploys.

## 5. Verificação

1. No Portainer, o container `minio` deve estar **healthy**.
2. Nos logs do `app`, deve aparecer `MinIO: bucket 'avatars' pronto (leitura pública).`
3. Em `/profile`, envie uma foto de até 3 MB. A resposta do `PUT` deve ser 200.
4. `GET /storage/avatars/<chave>` deve devolver a imagem sem autenticação.
5. Um `PUT` com o ID de outro usuário deve devolver 403.

## 6. Limites conhecidos
- Formatos aceitos: JPEG, PNG, WEBP e GIF. Tamanho máximo: 3 MB. Fora disso a API responde 400.
- A leitura é pública por exigência da atividade. Qualquer pessoa com o nome exato do arquivo consegue abri-lo.
- Os dados do MinIO ficam no volume `minio_data`. Apagar o volume apaga as fotos, e o banco passa a apontar para arquivos que não existem mais.
