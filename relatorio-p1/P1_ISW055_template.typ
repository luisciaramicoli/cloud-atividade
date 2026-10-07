// ============================================================
//  P1 — Relatório bimestral de atividades (entrega INDIVIDUAL)
//  ISW055 · Introdução à Computação em Nuvem · Fatec Pompeia · 2026.2
//
//  COMO USAR
//  1. Preencha a seção DADOS DO ALUNO logo abaixo.
//  2. Em cada #atividade(...), preencha "realizada", "situacao" e "url",
//     e escreva o corpo: o que você fez, prints e dificuldades.
//  3. Salve os prints numa pasta "prints/" ao lado deste arquivo e troque
//     `arquivo: none` por `arquivo: "prints/nome-do-print.png"`.
//  4. Compile em https://typst.app (Novo projeto → envie este arquivo e a
//     pasta prints) ou no terminal: typst compile P1_ISW055_template.typ
//  5. Apague os blocos cinza de orientação quando terminar.
//
//  Entrega: 07/10/2026 · PDF nomeado P1_ISW055_Nome_Sobrenome.pdf
// ============================================================

// ---------- DADOS DO ALUNO (edite aqui) ----------
#let aluno = "Nome Completo do Aluno"
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

// ---------- ajudantes ----------
#let orientacao(body) = block(
  width: 100%, fill: luma(245), inset: 9pt, radius: 4pt,
  stroke: (left: 2pt + luma(180)),
  text(size: 9.5pt, fill: luma(90), body),
)

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

// ============================================================
= Introdução
// ============================================================
#orientacao[
  *O que escrever aqui (2–4 parágrafos):* qual é a disciplina e o que ela se propõe; qual foi o projeto/fio condutor do bimestre; o que este relatório contém e como está organizado. Escreva pra alguém que não assistiu às aulas. Apague este bloco ao terminar.
]

Escreva aqui a sua introdução.

// ============================================================
= Metodologia
// ============================================================
#orientacao[
  *O que escrever aqui:* como as atividades foram feitas (ferramentas, ambiente, fontes), como as evidências foram coletadas e de onde saíram as datas e horas de entrega. O parágrafo abaixo é um ponto de partida — ajuste para a sua realidade.
]

Todas as atividades foram desenvolvidas no mesmo repositório público do GitHub, como continuação de um único projeto (catálogo de filmes). A data e a hora de cada entrega foram extraídas do histórico de commits (`git log`) e conferidas na página do commit no GitHub. Os prints mostram o README com a menção ao professor, o histórico de commits e o sistema em execução.

// ============================================================
= Quadro de entregas
// ============================================================
#orientacao[
  Esta tabela é gerada automaticamente a partir das fichas da seção seguinte — não edite aqui; edite os campos `planejada`, `realizada` e `situacao` de cada `#atividade(...)`.
]

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

// ============================================================
= Atividades realizadas
// ============================================================
#orientacao[
  Uma ficha por atividade, na ordem em que foram propostas. Em cada uma: preencha *realizada* (dia e hora — DD/MM/AAAA HH:MM), *situacao* (entregue · entregue com atraso · não entregue), *url* (link direto da evidência) e escreva abaixo da ficha o que foi feito, os prints e as dificuldades. *Atividade não entregue também entra* — com o que faltou e por quê: omitir conta contra, declarar não conta.
]

#atividade(
  "1", "Agenda telefônica em Flask",
  descricao: "Nivelamento em sala: sistema monolítico Flask + Jinja com persistência em JSON.",
  planejada: "07/08/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "Realizada em sala — print do sistema rodando localmente (e do repositório, se foi versionado)",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 1 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 1 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "2", "Catálogo de filmes — Tom Hanks",
  descricao: "Consumo da API TMDB, persistência em MariaDB e segregação por usuário.",
  planejada: "20/08/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "GitHub — commit + README + print do catálogo",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 2 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 2 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "3", "Desacoplando o login — microsserviço de autenticação",
  descricao: "Login, cadastro e esqueci-minha-senha num serviço à parte na rede interna do Docker.",
  planejada: "28/08/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "GitHub — commit + docker-compose.yml + print do login funcionando",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 3 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 3 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "4", "Controle de acesso por papel — RBAC",
  descricao: "O campo role passa a decidir permissões reais no backend (403 para usuário comum).",
  planejada: "04/09/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "GitHub — commit + print do 403 e da ação de admin",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 4 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 4 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "5", "Logs e auditoria",
  descricao: "Novo log-service com Redis registrando login, ações sensíveis e tentativas negadas.",
  planejada: "25/09/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "GitHub — commit + print da consulta de logs pelo admin",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 5 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 5 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "6", "Upload e perfil de usuário",
  descricao: "Página de perfil com avatar no MinIO; só a referência fica no banco relacional.",
  planejada: "02/10/2026",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "GitHub — commit + print do perfil com foto",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade 6 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade 6 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]


// ============================================================
= Atividades extras (opcional)
// ============================================================
#orientacao[
  Só preencha se você fez alguma das atividades extras (sem prazo). Se não fez nenhuma, apague esta seção inteira. Use o mesmo formato de ficha; em *planejada* escreva "sem prazo".
]

#atividade(
  "E1", "Documentação Swagger/OpenAPI",
  descricao: "Swagger UI com pelo menos 2 serviços documentados e “Try it out” executado.",
  planejada: "sem prazo",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "Repositório público no GitHub — commit com data e hora, README mencionando github.com/siriani, print do sistema rodando",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade E1 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade E1 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "E2", "CI/CD com GitHub Actions",
  descricao: "Pipeline que testa e faz deploy a cada push.",
  planejada: "sem prazo",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "Repositório público no GitHub — commit com data e hora, README mencionando github.com/siriani, print do sistema rodando",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade E2 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade E2 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]

#atividade(
  "E3", "Observabilidade — health checks e métricas",
  descricao: "Endpoints de saúde e métricas, com o container reagindo à queda do Redis.",
  planejada: "sem prazo",
  realizada: "DD/MM/AAAA HH:MM",
  situacao: "entregue",
  evidencia: "Repositório público no GitHub — commit com data e hora, README mencionando github.com/siriani, print do sistema rodando",
  url: "https://github.com/SEU-USUARIO/SEU-REPOSITORIO",
)[
  *O que foi feito.* Descreva em um ou dois parágrafos o que você construiu/produziu nesta atividade e as decisões que tomou.

  #evidencia([Atividade E3 — evidência da entrega (link, data e hora visíveis)])
  #evidencia([Atividade E3 — resultado (o sistema/mapa/artigo funcionando)])

  *Dificuldades e como foram resolvidas.* Um parágrafo curto.
]


// ============================================================
= Considerações finais
// ============================================================
#orientacao[
  *O que escrever aqui (1–3 parágrafos):* o que você aprendeu no bimestre, o que foi mais difícil, o que faria diferente e o que pretende levar para o próximo bimestre. Sem repetir a introdução.
]

Escreva aqui as suas considerações finais.

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
