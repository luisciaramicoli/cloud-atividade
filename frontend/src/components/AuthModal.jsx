import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

  if (!isOpen) return null;

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-auth" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isLogin ? 'Entrar no PostCraft AI' : 'Criar Conta no PostCraft AI'}</h2>
            <p className="modal-subtitle">
              {isLogin
                ? 'Acesse seu painel de criação e automação de posts'
                : 'Escolha seu papel no negócio e comece a criar posts com IA'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && <div className="alert-success">{message}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Nome Completo ou Razão Social *</label>
                <input
                  type="text"
                  placeholder="Ex.: Dra. Camila Rocha"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>

              {/* Seletor de Papéis do Negócio exigido pelo professor */}
              <div className="form-group">
                <label>Papel no Sistema (Perfil de Acesso) *</label>
                <div className="role-selector-cards">
                  <label className={`role-card ${role === 'criador' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="criador"
                      checked={role === 'criador'}
                      onChange={() => setRole('criador')}
                    />
                    <div>
                      <strong>🎨 Criador de Conteúdo</strong>
                      <p>Cria posts, gera carrosséis com IA, edita cópias e faz upload de logos.</p>
                    </div>
                  </label>

                  <label className={`role-card ${role === 'revisor' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="revisor"
                      checked={role === 'revisor'}
                      onChange={() => setRole('revisor')}
                    />
                    <div>
                      <strong>👀 Revisor / Cliente</strong>
                      <p>Visualiza e revisa os posts gerados (somente leitura; bloqueado para criar/editar).</p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>E-mail *</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha {isLogin ? '' : '(mínimo 8 caracteres)'} *</label>
            <input
              type="password"
              placeholder="••••••••"
              minLength={isLogin ? undefined : 8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Concluir Cadastro')}
          </button>
        </form>

        <div className="auth-footer-links">
          {isLogin && (
            <Link to="/forgot-password" onClick={onClose} className="auth-link">
              Esqueci minha senha
            </Link>
          )}

          <p style={{ marginTop: '14px', fontSize: '14px', color: '#9ca3af' }}>
            {isLogin ? 'Ainda não possui uma conta? ' : 'Já possui uma conta? '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
            >
              {isLogin ? 'Cadastre-se grátis' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

