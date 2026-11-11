import React, { useState } from 'react';
import {
  Sparkles,
  Rocket,
  ArrowRight,
  Check,
  AlertCircle,
  Zap,
  Star,
  Sliders,
  Layers,
  Download,
  Palette,
  FileText,
  Clock,
  Menu,
  X,
  Stethoscope,
  Scale,
  Dumbbell,
  Activity
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function LandingPage({ onLoginSuccess }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openRegister = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const openLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="landing-page">
      {/* Barra de Navegação */}
      <header className="landing-navbar">
        <div className="landing-container nav-content">
          <div className="landing-brand">
            <div className="brand-logo-icon">
              <Sparkles size={20} />
            </div>
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

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            className="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <nav className="mobile-nav-links">
              <a href="#como-funciona" onClick={closeMobileMenu}>Como Funciona</a>
              <a href="#recursos" onClick={closeMobileMenu}>Recursos</a>
              <a href="#planos" onClick={closeMobileMenu}>Planos</a>
            </nav>
            <div className="mobile-nav-actions">
              <button
                type="button"
                className="btn-mobile-login"
                onClick={() => { closeMobileMenu(); openLogin(); }}
              >
                Entrar
              </button>
              <button
                type="button"
                className="btn-mobile-cta"
                onClick={() => { closeMobileMenu(); openRegister(); }}
              >
                Experimente Grátis
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container hero-grid">
          <div className="hero-text">
            <div className="hero-badge">
              <Rocket size={14} className="hero-badge-icon" />
              <span>Geração de Carrosséis Estruturados com IA</span>
            </div>
            <h1 className="hero-headline">
              Posts e carrosséis para Instagram prontos em <span className="gradient-text">menos de 60 segundos</span>.
            </h1>
            <p className="hero-subheadline">
              Feito para nutricionistas, médicos, advogados, psicólogos e autônomos que precisam de constância no Instagram sem gastar R$ 1.500/mês com agências nem 10 horas semanais no Canva.
            </p>

            <div className="hero-cta-group">
              <button className="btn-hero-primary" onClick={openRegister}>
                <span>Criar Meu Primeiro Post Grátis</span>
                <ArrowRight size={18} />
              </button>
              <button className="btn-hero-secondary" onClick={openLogin}>
                Já tenho conta
              </button>
            </div>

            <div className="hero-social-proof">
              <div className="proof-avatars-group">
                <div className="proof-avatar-badge badge-blue" title="Nutrição & Saúde">
                  <Stethoscope size={14} />
                </div>
                <div className="proof-avatar-badge badge-emerald" title="Advocacia & Direito">
                  <Scale size={14} />
                </div>
                <div className="proof-avatar-badge badge-amber" title="Educação Física">
                  <Dumbbell size={14} />
                </div>
                <div className="proof-avatar-badge badge-purple" title="Psicologia & Clínicas">
                  <Activity size={14} />
                </div>
              </div>
              <div className="proof-text-block">
                <div className="proof-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="star-filled" />
                  ))}
                  <span className="proof-rating-num">4.9/5</span>
                </div>
                <p>Mais de <strong>500+ profissionais</strong> atraindo clientes toda semana.</p>
              </div>
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
                <div className="slide-top-row">
                  <span className="slide-tag">Nutrição & Saúde</span>
                  <span className="slide-carousel-indicator">Carrossel IA</span>
                </div>
                <h3>3 Mitos sobre Carboidratos à Noite que te Enganaram</h3>
                <p>Entenda a bioquímica real por trás do metabolismo noturno e por que você não precisa cortar o jantar.</p>
                <div className="slide-footer-mini">
                  <span>Slide 1 de 5</span>
                  <span className="slide-ai-badge">
                    <Sparkles size={12} /> PostCraft AI
                  </span>
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
              <div className="step-icon-wrap icon-blue">
                <Sliders size={22} />
              </div>
              <span className="step-num">Passo 1</span>
              <h3>Informe o tema e o seu nicho</h3>
              <p>Digite uma dúvida frequente do seu consultório ou escolha um dos nossos templates pré-validados de alta conversão.</p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap icon-purple">
                <Sparkles size={22} />
              </div>
              <span className="step-num">Passo 2</span>
              <h3>A IA gera os slides e a legenda</h3>
              <p>Nosso modelo estrutura o gancho da capa, os pontos explicativos, a chamada para ação (CTA) e as hashtags de descoberta.</p>
            </div>

            <div className="step-card">
              <div className="step-icon-wrap icon-emerald">
                <Download size={22} />
              </div>
              <span className="step-num">Passo 3</span>
              <h3>Baixe ou publique na hora</h3>
              <p>Veja o post no mockup interativo do Instagram, copie o texto formatado com um clique ou exporte em alta resolução.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Recursos */}
      <section id="recursos" className="section-resources">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Recursos Poderosos</span>
            <h2>Tudo o que você precisa para dominar o Instagram</h2>
            <p>Desenvolvido para a rotina ágil de profissionais autônomos, consultórios e agências.</p>
          </div>

          <div className="resources-grid">
            <div className="resource-card">
              <div className="resource-icon-wrap icon-indigo">
                <Layers size={22} />
              </div>
              <h3>Carrosséis Estruturados</h3>
              <p>Sequências planejadas com capa magnética, slides explicativos densos e chamada final que gera comentários e directs.</p>
            </div>

            <div className="resource-card">
              <div className="resource-icon-wrap icon-pink">
                <Palette size={22} />
              </div>
              <h3>Identidade da Sua Marca</h3>
              <p>Cadastre sua paleta de cores primária e secundária e logotipo para manter sua identidade consistente em todos os posts.</p>
            </div>

            <div className="resource-card">
              <div className="resource-icon-wrap icon-cyan">
                <FileText size={22} />
              </div>
              <h3>Legendas & Hashtags com IA</h3>
              <p>Gere legendas persuasivas com formatação pronta e grupos inteligentes de hashtags de nicho para ampliar o alcance orgânico.</p>
            </div>

            <div className="resource-card">
              <div className="resource-icon-wrap icon-emerald">
                <Clock size={22} />
              </div>
              <h3>Economia de 10h Semanais</h3>
              <p>Esqueça o bloqueio de tela em branco ou horas ajustando caixas de texto no Canva. Crie semanas de conteúdo em minutos.</p>
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
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Até 3 posts com IA por mês</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Geração de carrosséis e legendas</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>1 marca cadastrada</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Armazenamento no MinIO (até 10 arquivos)</span>
                </li>
                <li>
                  <AlertCircle size={16} className="feature-icon warn" />
                  <span>Marca d'água discreta no rodapé</span>
                </li>
              </ul>

              <button className="btn-plan-free" onClick={openRegister}>
                Começar Grátis
              </button>
            </div>

            {/* Plano Creator Pro (Destaque) */}
            <div className="pricing-card pro-plan featured">
              <span className="plan-badge-pro">
                <Sparkles size={12} className="inline-icon" /> MAIS POPULAR
              </span>
              <h3>Creator Pro</h3>
              <p className="plan-desc">Para profissionais que buscam presença diária e autoridade máxima.</p>
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="amount">49,90</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-features">
                <li>
                  <Zap size={16} className="feature-icon zap" />
                  <span><strong>Geração ILIMITADA</strong> de posts e carrosséis</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span><strong>Sem nenhuma marca d'água</strong></span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Identidade visual própria (cores e logo automática)</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Biblioteca completa de prompts por nicho</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Alta resolução (1080x1350 feed e 1080x1920 Stories)</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Armazenamento ilimitado no MinIO</span>
                </li>
                <li>
                  <Check size={16} className="feature-icon check" />
                  <span>Faturamento automatizado via Stripe</span>
                </li>
              </ul>

              <button className="btn-plan-pro" onClick={openRegister}>
                <span>Assinar Creator Pro (Stripe)</span>
                <ArrowRight size={16} />
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
