import { useState } from 'react';
import api from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Token inválido ou ausente na URL.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/reset-password', { token, novaSenha });
      setMessage(response.data?.message || 'Senha redefinida com sucesso!');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="modal-container modal-auth auth-page-card">
        <div className="auth-glow-accent" />

        <div className="auth-top-bar">
          <div className="auth-brand-badge">
            <div className="auth-brand-icon">
              <Sparkles size={18} />
            </div>
            <div className="auth-brand-info">
              <span className="auth-brand-name">PostCraft<span className="auth-brand-ai">AI</span></span>
            </div>
          </div>
          <Link to="/" className="auth-close-btn" title="Ir para home">
            <ArrowLeft size={16} />
          </Link>
        </div>

        <div className="auth-heading-group">
          <h2 className="auth-title">Nova Senha</h2>
          <p className="auth-subtitle">
            Crie uma nova senha de segurança com pelo menos 8 caracteres para sua conta.
          </p>
        </div>

        {message ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="auth-alert auth-alert-success" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle2 size={18} className="auth-alert-icon" />
              <span>{message}</span>
            </div>
            <Link to="/" className="auth-submit-btn" style={{ textDecoration: 'none' }}>
              <span>Ir para o Login</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <AlertCircle size={18} className="auth-alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-pwd">
                  Nova Senha (mínimo 8 caracteres) *
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-pwd"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input auth-input-pwd"
                    placeholder="••••••••"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
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

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="auth-spinner" />
                    <span>Atualizando senha...</span>
                  </>
                ) : (
                  <>
                    <span>Atualizar Senha</span>
                    <ArrowRight size={18} className="auth-submit-arrow" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer-block">
          <Link to="/" className="auth-switch-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
