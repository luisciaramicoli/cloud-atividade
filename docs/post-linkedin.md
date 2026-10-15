# Postagem para o LinkedIn — Projeto CineCloud

> 💡 **Tamanho ajustado:** 2.490 caracteres (com folga segura de 510 caracteres abaixo do limite de 3.000 do LinkedIn).
> O texto abaixo **já foi copiado para a sua área de transferência**. Basta dar **`Ctrl + V`** na caixa de publicação!

---

## 📝 Texto Otimizado para o LinkedIn:

Como construir do zero uma arquitetura de microsserviços em nuvem resiliente, orientada a eventos e com cobrança real (Stripe) — combinando IaaS, PaaS e SaaS na prática? 🚀☁️

Durante este semestre, desenvolvi o CineCloud, projeto de engenharia de software em nuvem ministrado pelo professor Allan Siriani (github.com/siriani). O que começou como uma simples integração de catálogo evoluiu para um ecossistema distribuído, conteinerizado e pronto para produção.

Destaques da arquitetura implementada:

🏗️ Microsserviços e Rede Privada:
Aplicação dividida em serviços isolados na rede Docker interna (auth-service, log-service, minio, redis, mariadb), expondo externamente apenas um API Gateway (Node.js/Express). Toda a comunicação inter-serviços exige token criptográfico interno (x-internal-token).

⚡ Auditoria em Tempo Real com Redis Streams (NIST SP 800-92):
Ingestão de auditoria em microsserviço dedicado com Redis 7 (AOF persistente), formato CloudEvents v1.0 + ECS, sanitização de dados sensíveis (LGPD) e paginação via XREVRANGE.

💳 Cobrança Real com Stripe & PCI-DSS:
Modelo Freemium com limite de 5 favoritos no plano gratuito (bloqueio 403 e modal de upgrade). Checkout na página hospedada do Stripe (R$ 9,90/mês) e webhooks assinados com HMAC-SHA256 — zero dados de cartão trafegados ou persistidos.

📦 Object Storage S3-Compatible (MinIO):
Upload de avatares com validação de magic bytes reais (JPEG/PNG/WEBP/GIF), chaves seguras e streaming via proxy com cabeçalhos nosniff e CSP sandbox.

📊 Observabilidade & Métricas (Prometheus + Grafana):
Métricas de latência e saturação raspadas pelo Prometheus, com dashboards no Grafana embutidos no gateway sob RBAC para administradores.

🔄 DevOps & CI/CD Automatizado:
Pipeline no GitHub Actions com testes automatizados, build OCI, publicação no GHCR e deploy contínuo integrado ao Portainer.

📚 Governança de Nuvem e Documentação Reversa:
Documentação reversa completa (DOCUMENTACAO.md) com especificação funcional, modelo ERD, mais de 40 regras de negócio e mapeamento:
• IaaS: VM Linux (recursos brutos e SO)
• PaaS: Docker Compose, GitHub Actions e GHCR
• SaaS: Stripe, TMDB API e Mailtrap

🔗 Repositório público com código, diagramas e docs:
https://github.com/luisciaramicoli/cloud-atividade

Agradecimento ao professor Allan Siriani pelos desafios propostos ao longo da disciplina!

#CloudComputing #SoftwareEngineering #DevOps #Microservices #Docker #NodeJS #React #Redis #Stripe #MinIO #Prometheus #Grafana #GitHubActions

---

## 🖼️ Imagens para Anexar (disponíveis na sua pasta `Downloads`):

1. `1_diagrama-arquitetura-cinecloud.png`
2. `2_print-stripe-checkout.png`
3. `3_print-beneficio-premium.png`
4. `4_print-grafana-metricas.png`
5. `5_print-swagger-ui.png`
