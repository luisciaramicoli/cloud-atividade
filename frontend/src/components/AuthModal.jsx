import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Palette,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('criador');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setMessage('');
    setError('');
    setShowPassword(false);
  }, [initialMode, isOpen]);

  // Fechar no teclado ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabChange = (loginMode) => {
    setIsLogin(loginMode);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin
        ? { email, password }
        : { nome, email, password, role };

      const response = await api.post(endpoint, payload);

      if (isLogin) {
        setMessage('Login realizado com sucesso!');
        if (response.data) {
          onLoginSuccess(response.data);
          onClose();
        }
      } else {
        setMessage('Conta criada com sucesso! Você já pode entrar.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro no processamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container modal-auth" onClick={e => e.stopPropagation()}>
        {/* Glow de fundo sutil */}
        <div className="auth-glow-accent" />

        {/* Topo com Logo, Badge e Botão Fechar */}
        <div className="auth-top-bar">
          <div className="auth-brand-badge">
            <div className="auth-brand-icon">
              <Sparkles size={18} />
            </div>
            <div className="auth-brand-info">
              <span className="auth-brand-name">PostCraft<span className="auth-brand-ai">AI</span></span>
              <span className="auth-badge-tag">Acesso</span>
            </div>
          </div>
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Título e Subtítulo */}
        <div className="auth-heading-group">
          <h2 className="auth-title">
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Acesse seu painel para gerar posts e carrosséis com IA'
              : 'Defina seu perfil e comece a automatizar suas publicações'}
          </p>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="auth-segmented-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            Criar conta
          </button>
        </div>

        {/* Notificações / Alertas */}
        {message && (
          <div className="auth-alert auth-alert-success" role="alert">
            <CheckCircle2 size={18} className="auth-alert-icon" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <AlertCircle size={18} className="auth-alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="register-nome">
                  Nome Completo ou Razão Social *
                </label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="register-nome"
                    type="text"
                    className="auth-input"
                    placeholder="Ex.: Dra. Camila Rocha"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Seletor de Papéis do Negócio exigido pelo professor */}
              <div className="auth-field">
                <label className="auth-label">
                  Papel no Sistema (Perfil de Acesso) *
                </label>
                <div className="auth-role-cards">
                  <label className={`auth-role-card ${role === 'criador' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="criador"
                      checked={role === 'criador'}
                      onChange={() => setRole('criador')}
                      className="auth-role-radio-hidden"
                    />
                    <div className="auth-role-indicator">
                      <div className="auth-role-dot" />
                    </div>
                    <div className="auth-role-content">
                      <div className="auth-role-title-row">
                        <Palette size={15} className="auth-role-icon text-indigo" />
                        <strong>Criador</strong>
                      </div>
                      <p>Cria posts, gera carrosséis com IA e edita logos.</p>
                    </div>
                  </label>

                  <label className={`auth-role-card ${role === 'revisor' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="revisor"
                      checked={role === 'revisor'}
                      onChange={() => setRole('revisor')}
                      className="auth-role-radio-hidden"
                    />
                    <div className="auth-role-indicator">
                      <div className="auth-role-dot" />
                    </div>
                    <div className="auth-role-content">
                      <div className="auth-role-title-row">
                        <ShieldCheck size={15} className="auth-role-icon text-emerald" />
                        <strong>Revisor</strong>
                      </div>
                      <p>Visualiza posts (somente leitura; sem edição).</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              E-mail *
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="auth-password">
                Senha {isLogin ? '' : '(mínimo 8 caracteres)'} *
              </label>
              {isLogin && (
                <Link to="/forgot-password" onClick={onClose} className="auth-forgot-link">
                  Esqueci minha senha
                </Link>
              )}
            </div>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input-pwd"
                placeholder="••••••••"
                minLength={isLogin ? undefined : 8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                <span>{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Entrar' : 'Concluir Cadastro'}</span>
                <ArrowRight size={18} className="auth-submit-arrow" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé Alternador */}
        <div className="auth-footer-block">
          <span className="auth-footer-prompt">
            {isLogin ? 'Ainda não possui uma conta?' : 'Já possui uma conta?'}
          </span>
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => handleTabChange(!isLogin)}
          >
            {isLogin ? 'Cadastre-se grátis' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
