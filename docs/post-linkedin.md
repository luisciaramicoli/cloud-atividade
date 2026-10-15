# Sugestão de Postagem para o LinkedIn — Projeto CineCloud

> 💡 **Como usar:** O LinkedIn já foi aberto no seu navegador. Basta copiar o texto abaixo, colar na caixa de criação de publicação ("Começar publicação"), anexar as imagens sugeridas da pasta `docs/` e publicar quando desejar!

---

## 📝 Texto Pronto para Copiar e Colar:

Como construir do zero uma arquitetura de microsserviços em nuvem resiliente, orientada a eventos e com cobrança real (Stripe) — combinando IaaS, PaaS e SaaS na prática? 🚀☁️

Durante este semestre, desenvolvi o **CineCloud**, um projeto de engenharia de software em nuvem na disciplina ministrada pelo professor Allan Siriani (github.com/siriani). O que começou como uma simples integração de catálogo evoluiu para um ecossistema distribuído, conteinerizado e pronto para produção.

Confira os principais destaques técnicos implementados:

🏗️ **Arquitetura de Microsserviços e Rede Privada:**
A aplicação foi dividida em serviços desacoplados operando em rede Docker bridge interna (`auth-service`, `log-service`, `minio`, `redis`, `mariadb`), expondo apenas um API Gateway (Node.js/Express) seguro. Toda a comunicação entre microsserviços é autenticada com tokens internos criptográficos (`x-internal-token`).

⚡ **Auditoria em Tempo Real com Redis Streams (NIST SP 800-92):**
Em vez de gravar logs dispersos em disco, centralizamos toda a ingestão de auditoria em um microsserviço dedicado integrado ao Redis 7 com persistência AOF. Os eventos seguem o padrão CloudEvents v1.0 + Elastic Common Schema (ECS), com sanitização automática de dados sensíveis (LGPD) e consulta paginada via `XREVRANGE`.

💳 **Cobrança Real com Stripe & Conformidade PCI-DSS:**
Implementamos um modelo Freemium funcional cobrado em modo de teste na sandbox oficial do Stripe (R$ 9,90/mês). Usuários gratuitos contam com um limite de 5 favoritos; ao atingir o limite, o backend barra a ação com HTTP 403 e convida para o upgrade. Todo o fluxo é delegado para a Stripe Checkout Session hospedada e as confirmações são consumidas assincronamente via Webhook HTTP com validação estrita de assinatura criptográfica HMAC-SHA256 — garantindo zero dados de cartão em nossa infraestrutura.

📦 **Object Storage S3-Compatible com MinIO:**
Os avatares dos usuários são armazenados em um bucket dedicado no MinIO compilado do código-fonte. O backend valida a assinatura real dos bytes (JPEG/PNG/WEBP/GIF), gera chaves criptográficas opacas e serve as fotos via proxy streaming com cabeçalhos rigorosos `nosniff` e Content Security Policy em modo `sandbox`.

📊 **Observabilidade & Métricas com Prometheus e Grafana:**
Instrumentação nativa expondo métricas de latência e saturação raspadas a cada 5s pelo Prometheus, com visualização em dashboards Grafana integrados ao próprio gateway sob controle de acesso baseado em papel (RBAC para admins).

🔄 **DevOps e CI/CD Automatizado:**
Pipeline completa no GitHub Actions executando suíte de testes de fumaça e segurança, construindo imagens OCI com tags de commit, publicando no GitHub Container Registry (GHCR) e disparando deploy contínuo no Portainer.

📚 **Engenharia Reversa e Governança de Nuvem (SaaS, PaaS e IaaS):**
Na etapa final, consolidamos uma documentação reversa completa (DOCUMENTACAO.md) contendo especificação funcional, modelo de dados relacional e mais de 40 regras de negócio extraídas diretamente do código, além de mapear exatamente onde cada peça vive:
• IaaS: VM Linux (recursos computacionais e particionamento de volumes)
• PaaS: Docker Compose/Portainer, GitHub Actions e GHCR
• SaaS: Stripe (pagamentos), TMDB API (catálogo) e Mailtrap (SMTP)

🔗 O repositório com todo o código-fonte, diagramas e documentação reversa está público e disponível no GitHub:
https://github.com/luisciaramicoli/cloud-atividade

Um agradecimento especial ao professor Allan Siriani pelas provocações técnicas e desafios que elevaram a régua da disciplina!

Qual abordagem você costuma utilizar no seu dia a dia para balancear serviços gerenciados (SaaS/PaaS) versus microsserviços próprios conteinerizados? Deixe suas impressões nos comentários! 👇

#CloudComputing #SoftwareEngineering #DevOps #Microservices #Docker #NodeJS #React #Redis #Stripe #MinIO #Prometheus #Grafana #GitHubActions #CyberSecurity #WebDevelopment

---

## 🖼️ Imagens Recomendadas para Anexar no Post (selecionar até 4 ou 5 fotos):

1. **`docs/diagrama-arquitetura-cinecloud.png`** (Diagrama visual de alta resolução da arquitetura completa)
2. **`docs/print-stripe-checkout.png`** (Tela oficial de Checkout da Stripe configurada)
3. **`docs/print-beneficio-premium.png`** (Interface do CineCloud com selo dourado ⭐ PREMIUM)
4. **`relatorio-p1/prints/e3-grafana.png`** (Dashboard de observabilidade e métricas no Grafana)
5. **`docs/print-swagger-ui.png`** (Especificação interativa das APIs OpenAPI 3.0)
