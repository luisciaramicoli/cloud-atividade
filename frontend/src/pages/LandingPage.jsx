import React, { useState } from 'react';
import AuthModal from '../components/AuthModal';

export default function LandingPage({ onLoginSuccess }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');

  const openRegister = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  return (
    <div className="landing-page">
      {/* Barra de Navegação */}
      <header className="landing-navbar">
        <div className="landing-container nav-content">
          <div className="landing-brand">
            <span className="brand-logo-icon">✨</span>
            <span className="brand-name">PostCraft<span className="brand-ai">AI</span></span>
          </div>

          <nav className="nav-links">
            <a href="#como-funciona">Como Funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
          </nav>

          <div className="nav-actions">
            <button className="btn-nav-login" onClick={openLogin}>
              Entrar
            </button>
            <button className="btn-nav-cta" onClick={openRegister}>
              Experimente Grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container hero-grid">
          <div className="hero-text">
            <div className="hero-badge">
              <span>🚀 Novo: Geração de Carrosséis Estruturados com IA</span>
            </div>
            <h1 className="hero-headline">
              Posts e carrosséis para Instagram prontos em <span className="gradient-text">menos de 60 segundos</span>.
            </h1>
            <p className="hero-subheadline">
              Feito para nutricionistas, médicos, advogados, psicólogos e autônomos que precisam de constância no Instagram sem gastar R$ 1.500/mês com agências nem 10 horas semanais no Canva.
            </p>

            <div className="hero-cta-group">
              <button className="btn-hero-primary" onClick={openRegister}>
                Criar Meu Primeiro Post Grátis 👉
              </button>
              <button className="btn-hero-secondary" onClick={openLogin}>
                Já tenho conta
              </button>
            </div>

            <div className="hero-social-proof">
              <div className="proof-avatars">
                <span>👩‍⚕️</span>
                <span>👨‍⚖️</span>
                <span>🏋️</span>
                <span>🦷</span>
              </div>
              <p>Mais de <strong>500+ profissionais</strong> atraindo clientes toda semana.</p>
            </div>
          </div>

          {/* Mockup Interativo Visual */}
          <div className="hero-preview">
            <div className="hero-phone-card">
              <div className="phone-header">
                <span className="phone-dot"></span>
                <span className="phone-title">instagram · @nutri_camilaocha</span>
              </div>
              <div className="phone-slide">
                <span className="slide-tag">Nutrição & Saúde</span>
                <h3>3 Mitos sobre Carboidratos à Noite que te Enganaram</h3>
                <p>Arraste para o lado e entenda a bioquímica real por trás do jantar 👉</p>
                <div className="slide-footer-mini">
                  <span>Slide 1 de 5</span>
                  <span>✨ Gerado com PostCraft AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section id="como-funciona" className="section-features">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Simplicidade Extrema</span>
            <h2>Como funciona em 3 passos</h2>
            <p>De uma ideia solta a uma grade de publicações completa.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-num">1</span>
              <h3>Informe o tema e o seu nicho</h3>
              <p>Digite uma dúvida frequente do seu consultório ou escolha um dos nossos templates pré-validados de alta conversão.</p>
            </div>

            <div className="step-card">
              <span className="step-num">2</span>
              <h3>A IA gera os slides e a legenda</h3>
              <p>Nosso modelo estrutura o gancho da capa, os pontos explicativos, a chamada para ação (CTA) e as hashtags de descoberta.</p>
            </div>

            <div className="step-card">
              <span className="step-num">3</span>
              <h3>Baixe ou publique na hora</h3>
              <p>Veja o post no mockup interativo do Instagram, copie o texto formatado com um clique ou exporte em alta resolução.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Tabela de Preços (Stripe) */}
      <section id="planos" className="section-pricing">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Preço Justo & Transparente</span>
            <h2>Planos que cabem no bolso do autônomo</h2>
            <p>Economize centenas de reais e dezenas de horas por mês.</p>
          </div>

          <div className="pricing-grid">
            {/* Plano Free */}
            <div className="pricing-card free-plan">
              <span className="plan-badge">Entrada</span>
              <h3>Plano Gratuito</h3>
              <p className="plan-desc">Ideal para testar e comprovar o valor na prática.</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="amount">0</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-features">
                <li>✅ Até 3 posts com IA por mês</li>
                <li>✅ Geração de carrosséis e legendas</li>
                <li>✅ 1 marca cadastrada</li>
                <li>✅ Armazenamento no MinIO (até 10 arquivos)</li>
                <li>⚠️ Marca d'água discreta no rodapé</li>
              </ul>

              <button className="btn-plan-free" onClick={openRegister}>
                Começar Grátis
              </button>
            </div>

            {/* Plano Creator Pro (Destaque) */}
            <div className="pricing-card pro-plan featured">
              <span className="plan-badge-pro">⭐ MAIS POPULAR</span>
              <h3>Creator Pro</h3>
              <p className="plan-desc">Para profissionais que querem presença diária e autoridade máxima.</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="amount">49,90</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-features">
                <li>🔥 <strong>Geração ILIMITADA</strong> de posts e carrosséis</li>
                <li>🔥 <strong>Sem nenhuma marca d'água</strong></li>
                <li>✅ Identidade visual própria (cores e logo automática)</li>
                <li>✅ Biblioteca completa de prompts por nicho</li>
                <li>✅ Alta resolução (1080x1350 feed e 1080x1920 Stories)</li>
                <li>✅ Armazenamento ilimitado no MinIO</li>
                <li>✅ Faturamento automatizado via Stripe</li>
              </ul>

              <button className="btn-plan-pro" onClick={openRegister}>
                Assinar Creator Pro (Stripe)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <p>© 2026 PostCraft AI · Desenvolvido por <strong>Luis Gustavo Bonfim Ciaramicoli</strong></p>
          <p>Disciplina: Introdução à Computação em Nuvem (ISW055) · Professor: <a href="https://github.com/siriani" target="_blank" rel="noopener noreferrer">github.com/siriani</a></p>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={onLoginSuccess}
      />
    </div>
  );
}

