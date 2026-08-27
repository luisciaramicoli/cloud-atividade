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