# Atividade de Cloud (@siriani)

Este repositório contém a implementação da atividade de Cloud, com Frontend em React (Vite) e Backend em Node.js (Express) com MariaDB, integrados à API da TMDB.

## Funcionalidades
- Cadastro e Login com hash de senhas.
- Isolamento de dados por usuário.
- Listagem de filmes do ator Tom Hanks usando a API oficial da TMDB (pesquisada via Backend).
- Favoritar filmes (armazenados no MariaDB pessoal).
- Comentar filmes (armazenados no MariaDB pessoal).

## Tecnologias
- **Frontend:** React, Vite, Axios.
- **Backend:** Node.js, Express, mysql2, bcrypt, jsonwebtoken.
- **Banco de Dados:** MariaDB.
- **Infraestrutura:** Docker (Multistage build).

## Deploy
Para rodar via Portainer, certifique-se de configurar as seguintes variáveis de ambiente no container:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `TMDB_API_KEY`
- `JWT_SECRET`
- `PORT` (porta que o Express vai ouvir internamente, ex: 3000)

(Veja o `.env.example` para referências).