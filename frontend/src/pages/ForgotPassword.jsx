import { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email });
      setMessage(response.data?.message || 'Instruções enviadas para seu e-mail!');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro ao processar sua solicitação.');
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
          <Link to="/" className="auth-close-btn" title="Voltar ao início">
            <ArrowLeft size={16} />
          </Link>
        </div>

        <div className="auth-heading-group">
          <h2 className="auth-title">Recuperar Senha</h2>
          <p className="auth-subtitle">
            Informe o e-mail cadastrado para receber o link seguro de redefinição de acesso.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="recovery-email">
              E-mail de acesso *
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="recovery-email"
                type="email"
                className="auth-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                <span>Enviando link...</span>
              </>
            ) : (
              <>
                <span>Enviar Link de Recuperação</span>
                <ArrowRight size={18} className="auth-submit-arrow" />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-block">
          <Link to="/" className="auth-switch-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
