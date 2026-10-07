// ============================================================
//  P1 — Relatório bimestral de atividades (entrega INDIVIDUAL)
//  ISW055 · Introdução à Computação em Nuvem · Fatec Pompeia · 2026.2
//
//  Aluno: Luis Gustavo Bonfim Ciaramicoli
//  Entrega: 07/10/2026 · P1_ISW055_Luis_Ciaramicoli.pdf
// ============================================================

// ---------- DADOS DO ALUNO ----------
#let aluno = "Luis Gustavo Bonfim Ciaramicoli"
#let turma = "161_SIST. INTELIGENTES_N"
#let data-relatorio = "07/10/2026"

// ---------- daqui pra baixo, só mexa nas fichas de atividade ----------
#let disciplina = "Introdução à Computação em Nuvem"
#let codigo = "ISW055"
#let professor = "Prof. Allan Lincoln Rodrigues Siriani"
#let accent = rgb("#b96f1f")

#set document(title: "P1 — " + codigo + " — " + aluno, author: aluno)
#set page(paper: "a4", margin: (top: 2.5cm, bottom: 2.5cm, left: 2.5cm, right: 2cm))
#set text(size: 11pt, lang: "pt", region: "BR")
#set par(justify: true, leading: 0.7em)
#set heading(numbering: "1.1")
#show heading.where(level: 1): it => { v(0.6em); text(size: 16pt, it); v(0.2em) }
#show heading.where(level: 2): it => { v(0.5em); text(size: 13pt, it); v(0.1em) }
#show link: set text(fill: accent)
#show figure.caption: set text(size: 9pt, fill: luma(90))
#set table(stroke: 0.5pt + luma(200), inset: 6pt)
#show table: set text(hyphenate: false)
#show table: set par(justify: false)

#let evidencia(legenda, arquivo: none) = figure(
  if arquivo == none {
    rect(width: 100%, height: 5.5cm, radius: 4pt, stroke: (paint: luma(170), dash: "dashed"))[
      #align(center + horizon)[
        #text(fill: luma(130), size: 9.5pt)[
          cole o print aqui \
          troque `arquivo: none` por `arquivo: "prints/nome.png"`
        ]
      ]
    ]
  } else {
    image(arquivo, width: 100%)
  },
  kind: image,
  supplement: [Figura],
  caption: legenda,
)

#let registro = state("registro", ())

#let atividade(
  numero, titulo,
  descricao: "",
  planejada: "",
  realizada: "—",
  situacao: "entregue",   // entregue · entregue com atraso · não entregue
  evidencia: "",
  url: "",
  corpo,
) = {
  registro.update(l => l + ((
    numero: numero, titulo: titulo, descricao: descricao,
    planejada: planejada, realizada: realizada, situacao: situacao,
  ),))
  heading(level: 2, [Atividade #numero — #titulo])
  table(
    columns: (3.4cm, 1fr),
    fill: (x, y) => if x == 0 { luma(245) } else { none },
    [*Descrição*], [#descricao],
    [*Data planejada*], [#planejada],
    [*Data realizada*], [#realizada],
    [*Situação*], [#situacao],
    [*Evidência*], [#evidencia],
    [*Link*], [#if url == "" [—] else [#link(url)]],
  )
  corpo
}

// ============================================================
//  CAPA
// ============================================================
#align(center)[
  #v(2.5cm)
  #text(size: 12pt, tracking: 0.12em)[FATEC POMPEIA]
  #v(0.4em)
  #text(size: 10.5pt, fill: luma(110))[#disciplina · #codigo · #turma]
  #v(4.5cm)
  #text(size: 26pt, weight: "bold")[P1]
  #v(0.3em)
  #text(size: 18pt, weight: "bold")[Relatório bimestral de atividades]
  #v(0.8em)
  #text(size: 11pt, fill: luma(110))[Avaliação individual · 2026.2]
  #v(5cm)
  #text(size: 14pt)[#aluno]
  #v(1fr)
  #text(size: 10.5pt)[#professor \ Pompeia, #data-relatorio]
]

#set page(
  numbering: "1",
  number-align: right,
  header: context {
    set text(size: 8pt, fill: luma(120))
    [#codigo · P1 — Relatório bimestral #h(1fr) #aluno]
    line(length: 100%, stroke: 0.4pt + luma(200))
  },
)
#counter(page).update(1)

#outline(title: "Sumário", indent: 1.2em, depth: 2)
#pagebreak()

#let repo = "https://github.com/luisciaramicoli/cloud-atividade"
#let repo1 = "https://github.com/luisciaramicoli/cloude"
#let commit(h) = repo + "/commit/" + h

// ============================================================
= Introdução
// ============================================================

A disciplina Introdução à Computação em Nuvem (ISW055) aborda a transição de softwares monolíticos para arquiteturas modulares, distribuídas e conteinerizadas, executadas sobre infraestruturas escaláveis e compartilhadas. Durante o primeiro bimestre do semestre letivo de 2026.2, o conteúdo programático abrangeu conceitos fundamentais de computação em nuvem, destacando a conteinerização com Docker, a orquestração local de múltiplos serviços com Docker Compose, o padrão arquitetural de microsserviços, o controle de acesso baseado em papéis (RBAC), a mensageria e auditoria assíncrona com Redis Streams, o armazenamento de objetos com MinIO compatível com S3 e a observabilidade com Prometheus e Grafana.

Como eixo prático das aulas e entregas avaliativas, foi desenvolvido progressivamente um catálogo de filmes dedicado à filmografia do ator Tom Hanks, consumindo a API pública do The Movie Database (TMDB). A aplicação evoluiu incrementalmente de um monólito inicial para uma arquitetura distribuída composta por gateway reverso, microsserviço isolado de autenticação (`auth-service`), microsserviço de auditoria (`log-service`), banco relacional MariaDB, mensageria com Redis e armazenamento de arquivos no MinIO. Ao término do ciclo bimestral, toda a infraestrutura foi implantada e validada na instância institucional do Portainer da Fatec Pompeia na porta `8218`.

#pagebreak()

// ============================================================
= Metodologia
// ============================================================

O desenvolvimento prático das atividades distribuiu-se em dois repositórios públicos no GitHub: as entregas iniciais de nivelamento e a versão preliminar do catálogo foram implementadas no repositório #link(repo1), enquanto o desacoplamento em microsserviços, o provisionamento de bancos de dados, os fluxos assíncronos e os recursos extras foram consolidados no repositório #link(repo). O ambiente de desenvolvimento utilizou o sistema operacional Linux (Fedora Workstation) e o editor Visual Studio Code. A pilha técnica reuniu Python com Flask no módulo inicial de nivelamento, evoluindo para Node.js 20 LTS com Express 5 nos serviços principais, MariaDB para persistência relacional, Redis 7 para mensageria de eventos, MinIO RELEASE.2025 para armazenamento de objetos e Docker Compose v2 para padronização do ambiente local.

A homologação e entrega do ambiente ocorreram no cluster do Portainer da Fatec Pompeia sob a porta `8218`. Em decorrência de restrições de privilégios para montagem de volumes locais (bind-mounts) e dos recursos limitados para compilação remota no servidor compartilhado, o processo de entrega contínua foi estruturado por meio de uma pipeline no GitHub Actions. O fluxo automatizado executa verificações de integridade, compila as imagens dos microsserviços, publica os pacotes no GitHub Container Registry (GHCR) e aciona o webhook do Portainer para atualização automática da stack em produção. A validação funcional das rotas e das políticas de segurança foi conduzida via navegador web e requisições HTTP instrumentadas com `curl` e clientes REST.

As datas e horários reportados nas fichas de entrega foram extraídos diretamente do histórico de commits do Git nos repositórios remotos, obtidos por meio de consultas `git log` no terminal e validados na interface do GitHub, com conversão sistemática para o fuso horário oficial de Brasília (UTC-3). Como apoio consultivo ao longo do desenvolvimento, foram empregados modelos de inteligência artificial generativa (Claude e Gemini) para assistência em rotinas repetitivas de código e diagnóstico de falhas, mantendo-se toda a formulação lógica, integração arquitetural, testes e configuração de infraestrutura sob a autoria, revisão e validação direta do aluno.

#pagebreak()

// ============================================================
= Quadro de entregas
// ============================================================

#context {
  let l = registro.final()
  table(
    columns: (auto, 1.4fr, 2fr, 2.6cm, 2.9cm, 2.3cm),
    align: (center, left, left, center, center, center),
    fill: (x, y) => if y == 0 { luma(235) } else { none },
    table.header([*Nº*], [*Atividade*], [*Descrição*], [*Data \ planejada*], [*Data \ realizada*], [*Situação*]),
    ..l.map(a => (
      [#a.numero], [#a.titulo], [#text(size: 9pt)[#a.descricao]],
      [#a.planejada], [#a.realizada], [#a.situacao],
    )).flatten()
  )
}

#pagebreak()

// ============================================================
= Atividades realizadas
// ============================================================

#atividade(
  "1", "Agenda telefônica em Flask",
  descricao: "Nivelamento em sala: sistema monolítico Flask + Jinja com persistência em JSON.",
  planejada: "07/08/2026",
  realizada: "14/08/2026 19:59",
  situacao: "entregue com atraso",
  evidencia: "GitHub — commits a6e2cce (versão com JSON) e 1eb4711 (CRUD + Docker) no repositório cloude",
  url: repo1 + "/commit/a6e2ccea64df6605f8d117c102985b2756e8f68d",
)[
  *Sobre a data e justificativa do status.* A atividade prática de nivelamento foi desenvolvida em sala de aula na data prevista (07/08/2026). No entanto, o envio inicial para o repositório público no GitHub ocorreu somente em 14/08/2026 às 19:59. Como a comprovação formal exige um registro público verificável, classifiquei a entrega no quadro como entregue com atraso.

  *O que foi feito.* Desenvolvi uma aplicação monolítica em Python com Flask (`app.py`), usando Jinja inline (`render_template_string`) para a página web de cadastro e listagem de contatos (nome, telefone e valor), além de rotas de API em formato JSON (`POST /api/registro` e `GET /api/registros`). Na primeira versão, os dados eram salvos no arquivo local `dados.json` (#link(repo1 + "/commit/a6e2ccea64df6605f8d117c102985b2756e8f68d")[a6e2cce]). Na sequência, atualizei o código para um CRUD completo com Flask-SQLAlchemy, aceitando conexão dinâmica com MySQL ou MariaDB via variáveis de ambiente com fallback para SQLite local em `banco_local.db`, e criei um Dockerfile baseado em `python:3.12-slim` (#link(repo1 + "/commit/1eb47115e939ef8ee7e52fae77bc9e3277c5a964")[1eb4711], 14/08/2026 20:36). Mais tarde, esses arquivos foram substituídos pelo catálogo no mesmo repositório, mas permanecem disponíveis no histórico do Git (#link(repo1 + "/tree/1eb47115e939ef8ee7e52fae77bc9e3277c5a964")[árvore do commit histórico 1eb4711]).

  #evidencia([Atividade 1 — commit a6e2cce no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a1-commit.png")
  #evidencia([Atividade 1 — agenda telefônica em execução no navegador], arquivo: "prints/a1-resultado.png")

  *Dificuldades e como foram resolvidas.* A maior dificuldade foi deixar a conexão do banco flexível para rodar tanto localmente quanto em container. Resolvi isso lendo as variáveis de ambiente no arquivo `.env`, conectando no MySQL quando as configurações existiam ou mantendo o SQLite por padrão caso contrário. Também precisei mapear a porta de exposição no contêiner Docker e assegurar que as dependências do `requirements.txt` fossem instaladas sem gerar imagens excessivamente volumosas.
]

#pagebreak()

#atividade(
  "2", "Catálogo de filmes — Tom Hanks",
  descricao: "Consumo da API TMDB, persistência em MariaDB e segregação por usuário.",
  planejada: "20/08/2026",
  realizada: "20/08/2026 15:18",
  situacao: "entregue",
  evidencia: "GitHub — commit 1bb5c37 + README + print do catálogo (repositório cloude)",
  url: repo1 + "/commit/1bb5c37ea7621057ce8613327b613f2a65d3741f",
)[
  *O que foi feito.* Criei uma aplicação em Node.js com Express (pasta `catalogo-filmes-tmdb`) que consome a API do TMDB para listar e pesquisar filmes do ator Tom Hanks. O banco de dados MariaDB foi estruturado para separar os dados por usuário, permitindo que cada conta favoritasse filmes e salvasse seus próprios comentários. As senhas dos usuários foram protegidas com hash usando `bcrypt` e a sessão foi gerenciada por tokens JWT. A aplicação foi empacotada com Dockerfile e `docker-compose.yml` para rodar no Portainer, e o arquivo `README.md` inclui as instruções e a menção ao professor Allan Siriani (\@siriani).

  #evidencia([Atividade 2 — commit 1bb5c37 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a2-commit.png")
  #evidencia([Atividade 2 — catálogo de filmes em execução consumindo API TMDB], arquivo: "prints/a2-resultado.png")

  *Dificuldades e como foram resolvidas.* Após o commit inicial, precisei parametrizar a porta externa no `docker-compose.yml` (#link(repo1 + "/commit/577b26d9b63cc99e949f887184080415e30776b1")[577b26d]) para evitar conflito com outros serviços no Portainer. No frontend, ajustei as regras de CSS para garantir que a página ficasse responsiva no celular (#link(repo1 + "/commit/6e7d715d700db0d44e97d4a814954dd0c23ca22b")[6e7d715]) e limpei o cache do navegador para atualizar os estilos. Também corrigi o README, que mencionava React por engano, deixando registrado que a interface foi feita em HTML, CSS e JavaScript puro (#link(repo1 + "/commit/1ee1de3b06bd8bb6c2277e279ce93baf7b345b22")[1ee1de3]).
]

#pagebreak()

#atividade(
  "3", "Desacoplando o login — microsserviço de autenticação",
  descricao: "Login, cadastro e esqueci-minha-senha num serviço à parte na rede interna do Docker.",
  planejada: "28/08/2026",
  realizada: "27/08/2026 00:27",
  situacao: "entregue",
  evidencia: "GitHub — commit a54e0c6 + docker-compose.yml + print do login",
  url: commit("a54e0c6a9057c14fa5f66a50d41d1589536d79ed"),
)[
  *O que foi feito.* Separei a parte de segurança do restante da aplicação, movendo as rotas de login, cadastro e recuperação de senha para um microsserviço independente chamado `auth-service`. Esse serviço roda em uma rede interna e isolada no Docker (`backend-network`), sem expor portas para o host externo. O backend do catálogo passou a atuar como gateway e proxy reverso, recebendo as requisições do frontend e repassando as chamadas de autenticação internamente. Depois dessa separação, reorganizei o projeto no padrão MVC (#link(commit("80abdbe"))[80abdbe]), dividindo rotas, controladores, serviços e configurações.

  #evidencia([Atividade 3 — commit a54e0c6 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a3-commit.png")
  #evidencia([Atividade 3 — tela de autenticação e recuperação de senha pelo microsserviço], arquivo: "prints/a3-resultado.png")

  *Dificuldades e como foram resolvidas.* Ao rodar dois serviços Node.js conectados pela rede interna do Docker, tive problemas com a resolução de nomes dos containers e o tempo que o banco demorava para iniciar. Resolvi configurando a variável `AUTH_SERVICE_URL=http://auth-service:5001` no gateway e adicionando uma rotina com repetições automáticas para esperar o MariaDB aceitar conexões antes de subir a aplicação.
]

#pagebreak()

#atividade(
  "4", "Controle de acesso por papel — RBAC",
  descricao: "O campo role passa a decidir permissões reais no backend (403 para usuário comum).",
  planejada: "04/09/2026",
  realizada: "03/09/2026 15:58",
  situacao: "entregue",
  evidencia: "GitHub — commit 652be0c + prints 403 e 200 de admin",
  url: commit("652be0cb29ffaa61daec21dbec81643c72d6dcfa"),
)[
  *O que foi feito.* Implementei controle de acesso baseado em papéis (RBAC) com verificação rigorosa no backend. Adicionei a coluna `role` (`usuario` ou `admin`) na tabela de usuários e criei a regra de moderação: um usuário comum só pode apagar os seus próprios comentários (`comment.usuario_id === req.userId`), enquanto o administrador tem permissão para apagar comentários de qualquer pessoa. Para evitar adulteração, o backend consulta o papel diretamente no banco de dados a cada requisição sensível, em vez de confiar apenas nas informações presentes no token JWT.

  #evidencia([Atividade 4 — commit 652be0c no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a4-commit.png")
  #evidencia([Atividade 4 — tentativa de exclusão por usuário comum negada com 403 Forbidden], arquivo: "prints/print1-403-forbidden.png")
  #evidencia([Atividade 4 — moderação executada com sucesso por usuário administrador (200 OK)], arquivo: "prints/print2-200-ok-admin.png")

  *Dificuldades e como foram resolvidas.* Como as tabelas já tinham registros criados nas semanas anteriores, precisei criar uma migration segura com `ALTER TABLE usuarios ADD COLUMN role ...` que definisse o papel `usuario` por padrão para não quebrar os logins existentes, além de um script para promover manualmente a primeira conta a `admin`. Também corrigi o retorno dos erros, padronizando a resposta `403 Forbidden` no Express em vez de `401 Unauthorized` quando a credencial era válida, mas a conta não tinha privilégio suficiente.
]

#pagebreak()

#atividade(
  "5", "Logs e auditoria",
  descricao: "Novo log-service com Redis registrando login, ações sensíveis e tentativas negadas.",
  planejada: "25/09/2026",
  realizada: "25/09/2026 14:14",
  situacao: "entregue",
  evidencia: "GitHub — commit 6ff06b9 + prints dos logs e painel de auditoria",
  url: commit("6ff06b9ba1d8e1c6b12a2333b23e1ca313364f34"),
)[
  *O que foi feito.* Criei um novo microsserviço (`log-service`) dedicado ao registro e consulta de eventos de auditoria, integrado ao Redis Streams. Os eventos seguem o padrão estruturado CloudEvents v1.0 e as diretrizes do NIST SP 800-92, registrando timestamp UTC, identificador do usuário, endereço IP de origem, ação realizada e resultado da operação. O catálogo e o `auth-service` despacham os logs de forma assíncrona para que a gravação não deixe as respostas aos usuários mais lentas. Também construí uma tela restrita a administradores para filtrar os logs por tipo de ação, período e nível de severidade.

  #evidencia([Atividade 5 — commit 6ff06b9 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a5-commit.png")
  #evidencia([Atividade 5 — consulta de logs de auditoria pelo administrador com paginação e filtros], arquivo: "prints/a5-resultado.png")

  *Dificuldades e como foram resolvidas.* A principal dificuldade foi garantir a continuidade da aplicação caso o Redis ficasse temporariamente fora do ar. Implementei um padrão resiliente com timeout curto e tratamento de erro silencioso no envio do log: caso o Redis falhe, o erro é registrado no console do container, mas a operação do usuário (como login ou comentário) é concluída normalmente sem travar o sistema.
]

#pagebreak()

#atividade(
  "6", "Upload e perfil de usuário",
  descricao: "Página de perfil com avatar no MinIO; só a referência fica no banco relacional.",
  planejada: "02/10/2026",
  realizada: "30/09/2026 14:16",
  situacao: "entregue",
  evidencia: "GitHub — commit ffa84d9 + prints de upload e avatar no MinIO",
  url: commit("ffa84d9dbd00465c026caee4a3ec687799ea7da8"),
)[
  *O que foi feito.* Implementei a funcionalidade de perfil com envio de foto de avatar, integrando o serviço de armazenamento de objetos MinIO (compatível com a API AWS S3). Apenas a URL do objeto é salva no banco de dados MariaDB; o binário da imagem é armazenado diretamente no bucket do MinIO. O upload utiliza `multer` no backend com validação de tipo de arquivo (permitindo apenas JPG, PNG e WebP) e limite de tamanho de 2 MB. O controle de acesso impede que um usuário envie imagens para o perfil de outra pessoa.

  #evidencia([Atividade 6 — commit ffa84d9 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/a6-commit.png")
  #evidencia([Atividade 6 — upload de avatar realizado com sucesso e refletido no perfil do usuário], arquivo: "prints/a6-resultado.png")

  *Dificuldades e como foram resolvidas.* Como o servidor do Portainer na Fatec utiliza uma porta única externa (`8218`), o navegador não conseguia acessar a porta padrão do MinIO (`9000`) para carregar a foto do avatar. Resolvi criando uma rota interna no backend (`GET /api/avatar/:userId`) que atua como proxy reverso: ela lê o stream do arquivo no MinIO pela rede interna do Docker e o transmite ao navegador com os cabeçalhos de imagem e cache apropriados.
]

#pagebreak()

// ============================================================
= Atividades extras (opcional)
// ============================================================

#atividade(
  "E1", "Documentação Swagger/OpenAPI",
  descricao: "Swagger UI com pelo menos 2 serviços documentados e “Try it out” executado.",
  planejada: "sem prazo",
  realizada: "18/09/2026 14:34",
  situacao: "entregue",
  evidencia: "GitHub — commit 1618dd2 + print do Swagger UI no navegador",
  url: commit("1618dd21d8b74a382d5fa4ae1a5477026e695503"),
)[
  *O que foi feito.* Documentei todos os endpoints da aplicação na especificação OpenAPI 3.0, cobrindo o backend do catálogo, o `auth-service` e o `log-service`. Integrei o `swagger-ui-express` para servir a interface gráfica interativa do Swagger na rota `/api-docs`. A documentação descreve todos os parâmetros, formatos das requisições, respostas de sucesso, mensagens de erro e o esquema de autenticação por cabeçalho Bearer Token.

  #evidencia([Extra E1 — commit 1618dd2 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/e1-commit.png")
  #evidencia([Extra E1 — interface interativa do Swagger UI permitindo testes dos endpoints via Try it out], arquivo: "prints/print-swagger-ui.png")

  *Dificuldades e como foram resolvidas.* Como a aplicação estava dividida em múltiplos serviços, manter arquivos de especificação separados complicaria o uso pelos desenvolvedores. Resolvi unificando as definições em um único catálogo no gateway, facilitando a navegação de todas as rotas em um só lugar.
]

#pagebreak()

#atividade(
  "E2", "CI/CD com GitHub Actions",
  descricao: "Pipeline que testa e faz deploy a cada push.",
  planejada: "sem prazo",
  realizada: "18/09/2026 17:31",
  situacao: "entregue",
  evidencia: "GitHub — commit 3a6b515 + print do GitHub Actions executado",
  url: commit("3a6b5153713f102d7f846f4fcc360816150eb205"),
)[
  *O que foi feito.* Configurei uma esteira de Integração e Entrega Contínuas (CI/CD) com o GitHub Actions (`.github/workflows/ci-cd.yml`). A cada push no branch principal (`main`), o workflow executa a verificação de código, compila as imagens Docker dos microsserviços, publica os pacotes no GitHub Container Registry (GHCR) e dispara um webhook para o Portainer da faculdade, atualizando a stack de forma automática.

  #evidencia([Extra E2 — commit 3a6b515 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/e2-commit.png")
  #evidencia([Extra E2 — pipeline do GitHub Actions executada com sucesso e publicação das imagens], arquivo: "prints/e2-actions.png")

  *Dificuldades e como foram resolvidas.* O Portainer da Fatec não permite montagem direta de pastas do host (bind-mounts) para usuários sem privilégios de administrador. Para contornar essa restrição, alterei os Dockerfiles para copiar os arquivos de configuração estáticos diretamente para dentro das camadas das imagens (#link(commit("0d2c8da"))[0d2c8da]).
]

#pagebreak()

#atividade(
  "E3", "Observabilidade — health checks e métricas",
  descricao: "Endpoints de saúde e métricas, com o container reagindo à queda do Redis.",
  planejada: "sem prazo",
  realizada: "18/09/2026 17:31",
  situacao: "entregue",
  evidencia: "GitHub — commit 3a6b515 + print do Grafana e endpoint de healthcheck",
  url: commit("3a6b5153713f102d7f846f4fcc360816150eb205"),
)[
  *O que foi feito.* Implementei a observabilidade do sistema com endpoints de saúde (`/health`, incluindo liveness e readiness) e exportação de métricas (`/metrics`) no formato Prometheus nos microsserviços. O `docker-compose.yml` foi configurado com verificações nativas de healthcheck. Uma instância do Prometheus faz a coleta periódica dos dados e um dashboard no Grafana exibe tempo de atividade (uptime), requisições por minuto e latência p95. Para testar a tolerância a falhas, parei o container do Redis e confirmei que o `log-service` passou ao estado unhealthy, recuperando-se sozinho assim que o Redis voltou a operar.

  #evidencia([Extra E3 — commit 3a6b515 no GitHub — página do commit e data/hora exata pela API do GitHub], arquivo: "prints/e2-commit.png")
  #evidencia([Extra E3 — endpoint de verificação de integridade (/health) reportando status healthy e conexão do banco], arquivo: "prints/e3-health.png")
  #evidencia([Extra E3 — dashboard executivo no Grafana monitorando uptime, tráfego e latência dos serviços], arquivo: "prints/e3-grafana.png")

  *Dificuldades e como foram resolvidas.* Como apenas a porta `8218` estava liberada para o meu usuário no servidor compartilhado da faculdade, não era possível expor a porta 3000 do Grafana diretamente. Resolvi configurando o Grafana com sub-caminho (`serve_sub_path`) e criando um proxy reverso no backend do catálogo para direcionar as requisições em `/grafana` diretamente ao container interno (#link(commit("066320b"))[066320b]).
]

#pagebreak()

// ============================================================
= Considerações finais
// ============================================================

O desenvolvimento deste projeto no primeiro bimestre permitiu entender na prática como funciona a transição de um sistema monolítico para uma arquitetura orientada a microsserviços. Ver na prática o desacoplamento, isolando a autenticação no `auth-service`, salvando arquivos no MinIO e despachando logs de auditoria no Redis Streams, mostrou as vantagens de manutenção e organização de um sistema em nuvem, mas também evidenciou os cuidados necessários com redes internas, comunicação entre serviços e tratamento de erros.

O maior desafio esteve nas limitações do ambiente compartilhado no Portainer da faculdade. Questões como a restrição de volumes por bind-mount, a liberação de uma única porta de acesso e o timeout na compilação do MinIO exigiram soluções práticas, como a criação de proxies reversos para centralizar rotas e a automação do build de imagens com GitHub Actions e GHCR.

Como melhoria para os próximos trabalhos e para o segundo bimestre, pretendo implementar testes de integração automatizados antes de cada commit e adotar o padrão de Conventional Commits desde o primeiro dia de versionamento. A base construída até aqui ficou modular, documentada e estável, pronta para receber os temas seguintes da disciplina, como o Plano Premium e os modelos de serviço IaaS, PaaS e SaaS.

#v(1.5cm)

// ============================================================
= Declaração de autoria
// ============================================================
Declaro que este relatório foi elaborado por mim, individualmente, e que as evidências apresentadas correspondem a entregas de minha autoria, verificáveis nos links informados. Nas atividades realizadas em grupo, o conteúdo aqui descrito refere-se à minha participação.

#v(1.5cm)
#grid(
  columns: (1fr, 1fr), gutter: 2cm,
  align(center)[#line(length: 100%, stroke: 0.5pt) \ #aluno],
  align(center)[#line(length: 100%, stroke: 0.5pt) \ Pompeia, #data-relatorio],
)
