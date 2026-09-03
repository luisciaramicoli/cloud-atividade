# Atividade de Cloud (@siriani)

Este repositório contém a implementação da atividade de Cloud, com Frontend em React (Vite) e Backend em Node.js (Express) com MariaDB, integrados à API da TMDB.

## Funcionalidades
- Cadastro e Login com hash de senhas e geração de JWT.
- **NOVO:** Microsserviço de autenticação isolado na rede interna do Docker (Atividade 3).
- **NOVO:** Recuperação de senha por e-mail com token e expiração (via Mailtrap).
- Isolamento de dados por usuário.
- Listagem de filmes do ator Tom Hanks usando a API oficial da TMDB (pesquisada via Backend).
- Favoritar filmes (armazenados no MariaDB pessoal).
- Comentar filmes (armazenados no MariaDB pessoal).
- **NOVO (Atividade 4):** Controle de Acesso Baseado em Papéis (RBAC) com enforcement no backend e moderação de comentários.

## Atividade 4 · Controle de Acesso por Papel (RBAC de Verdade)

### 1. Permissões Documentadas por Papel

No sistema, o controle de acesso é baseado no papel (`role`) atribuído ao usuário autenticado (`user`/`usuario` ou `admin`). O servidor valida estritamente cada ação.

| Recurso | Ação | Papel `usuario` | Papel `admin` | Endpoint |
|---|---|:---:|:---:|---|
| **Filmes** | Listar catálogo (Tom Hanks) | ✅ Permitido | ✅ Permitido | `GET /api/movies` |
| **Favoritos** | Listar próprios favoritos | ✅ Permitido | ✅ Permitido | `GET /api/favorites` |
| **Favoritos** | Adicionar favorito | ✅ Permitido | ✅ Permitido | `POST /api/favorites` |
| **Favoritos** | Remover próprio favorito | ✅ Permitido | ✅ Permitido | `DELETE /api/favorites/:id` |
| **Comentários** | Visualizar comentários nos filmes | ✅ Permitido | ✅ Permitido | `GET /api/comments/:id` |
| **Comentários** | Criar novo comentário | ✅ Permitido | ✅ Permitido | `POST /api/comments` |
| **Comentários** | Apagar o **próprio** comentário | ✅ Permitido | ✅ Permitido | `DELETE /api/comments/:id` |
| **Comentários** | Apagar comentário de **outros** (Moderação) | ❌ **403 Forbidden** | ✅ **200 OK** | `DELETE /api/comments/:id` |
| **Usuários** | Listar todos os usuários do sistema | ❌ **403 Forbidden** | ✅ **200 OK** | `GET /api/users` |

- **O que `usuario` pode fazer:** Pode navegar pelo catálogo de filmes, gerenciar sua própria lista de favoritos, publicar comentários em filmes e remover os seus próprios comentários.
- **O que `admin` pode fazer além disso:** Possui poder de **moderação total** sobre comentários (pode apagar comentários feitos por qualquer outro usuário) e acesso administrativo para visualizar todos os usuários cadastrados e seus respectivos papéis.

---

### 2. Ação Exclusiva de Admin e Enforcement no Backend

A ação exclusiva implementada é a **Moderação de Comentários** (`DELETE /api/comments/:id`):
- Quando um autor tenta apagar seu próprio comentário (`comment.usuario_id === req.userId`), a ação é autorizada imediatamente (**200 OK**).
- Quando qualquer usuário tenta apagar um comentário que pertence a outro usuário, o backend intercepta a ação e realiza a verificação de permissão no servidor via rede interna com o `auth-service`.
  - Se o usuário solicitante **não for admin**, o servidor recusa a requisição e responde com **403 Forbidden**: `{"error": "Acesso negado: apenas administradores podem apagar comentários de outros usuários."}`.
  - Se o usuário solicitante **for admin**, o servidor executa a exclusão com sucesso e responde com **200 OK**: `{"message": "Comentário excluído com sucesso (Ação de Moderação/Admin)"}`.
- Mesmo que o usuário comum tente invocar o endpoint diretamente via Postman, cURL ou manipular a interface, o backend bloqueia a ação, garantindo segurança real no servidor.

---

### 3. Segurança de Credenciais e Roles: Tratamento Exclusivo no Backend

Seguindo as melhores práticas de segurança corporativa e desenvolvimento web:
- **Zero Credenciais no Frontend (Cookies HttpOnly):** O token JWT não é exposto ao JavaScript do cliente e não é gravado em `localStorage`. No login, o backend define um cookie `HttpOnly; SameSite=Lax; Path=/`, garantindo imunidade a ataques de injeção XSS que tentem ler ou roubar a credencial. Todas as requisições subsequentes utilizam o cookie automaticamente com `withCredentials: true`. A validação e encerramento de sessão ocorrem através dos endpoints `/api/me` e `/api/logout`.
- **Zero Lógica de Roles no Frontend:** O cliente não realiza checagens condicionais de papel (`role === 'admin'`). O backend é a autoridade única e decide quais ações o usuário pode realizar, entregando capacidades funcionais já resolvidas (como `can_delete` e `is_moderation` nos comentários, e `can_manage_users` no perfil). Toda requisição para endpoints protegidos continua estritamente validada no servidor.

---

### 4. Resposta Técnica: Padrão A ou Padrão B?

> **Pergunta:** Qual dos dois padrões da seção de arquitetura o seu auth-service usa hoje? E o que mudaria no seu código se fosse pro outro padrão?

#### Qual padrão utilizamos hoje?
Nosso sistema utiliza o **PADRÃO A — Enforcement Centralizado**.

O serviço de catálogo (`backend`) atua desacoplado das regras de autorização dos usuários. Quando uma ação restrita ou sensível é solicitada (como moderação de comentários ou listagem administrativa de usuários), o catálogo realiza uma chamada HTTP interna via rede para o endpoint `POST /authorize` do `auth-service`, enviando o `userId` e a regra exigida (`requiredRole: 'admin'`). O `auth-service` consulta o papel atualizado do usuário diretamente no banco de dados MariaDB e decide centralizadamente se a ação é permitida ou não.

#### O que mudaria no código se fôssemos para o Padrão B (claims no JWT)?
Se migrássemos para o **Padrão B (Claims no JWT)**:
1. **No catálogo (`backend`):** Eliminaríamos a chamada de rede interna (`axios.post('${AUTH_SERVICE_URL}/authorize')`). O middleware de autenticação (`authenticateToken`) decodificaria o token JWT assinado e leria diretamente a propriedade `req.user.role`. A verificação seria puramente local em memória: `if (req.user.role !== 'admin') return res.status(403)`.
2. **No `auth-service`:** O endpoint `/authorize` deixaria de ser necessário para checagens em tempo de execução, já que a claim `role` viajaria encapsulada e assinada no próprio token.
3. **Trade-offs técnicos:**
   - **Vantagem do Padrão B:** Menor latência (elimina o round-trip de rede para cada ação restrita) e menor sobrecarga no `auth-service`.
   - **Desvantagem do Padrão B:** Perda de revogação/atualização imediata. Se um usuário for rebaixado ou promovido no banco, seu papel só terá efeito quando o token JWT atual expirar e um novo for gerado. No Padrão A adotado, qualquer alteração no banco tem efeito instantâneo.

---

## Tecnologias
- **Frontend:** React, Vite, Axios, React Router.
- **Backend (API Gateway / Catálogo):** Node.js, Express, mysql2.
- **Microsserviço (Auth):** Node.js, Express, mysql2, bcrypt, jsonwebtoken, nodemailer.
- **Banco de Dados:** MariaDB.
- **Infraestrutura:** Docker, Docker Compose (Multistage build).

## Deploy
Para rodar via Portainer, configure as variáveis na Stack:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `TMDB_API_KEY`
- `JWT_SECRET`
- `SMTP_USER`, `SMTP_PASS` (Mailtrap)
- `PUBLIC_URL` (URL pública para os links de reset de senha)

(Veja o `.env.example` para referências).