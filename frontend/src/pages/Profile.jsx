import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, LogOut, Sparkles, Shield, User, FileText } from 'lucide-react';
import api from '../services/api';

const MAX_BIO = 280;

export default function Profile({ currentUser, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/posts')
      ]);

      setProfile(profileRes.data);
      setBio(profileRes.data.bio || '');
      setUserPosts(postsRes.data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao carregar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      const form = new FormData();
      form.append('bio', bio);
      if (photoFile) form.append('foto', photoFile);

      const res = await api.put(`/users/${currentUser.id}/profile`, form);

      setProfile(prev => ({ ...prev, bio: res.data.profile.bio, avatarUrl: res.data.profile.avatarUrl }));
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso no MinIO!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao salvar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleStartCheckout = async () => {
    setStartingCheckout(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.post('/checkout');
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('URL de checkout não retornada pelo Stripe');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Não foi possível iniciar o checkout no Stripe'
      });
      setStartingCheckout(false);
    }
  };

  const avatarSrc = photoPreview || profile?.avatarUrl || null;
  const initial = (currentUser?.nome || 'U').charAt(0).toUpperCase();
  const isPremium = Boolean(profile?.premium);
  const userRole = currentUser?.role || 'criador';

  if (loading) {
    return (
      <div className="catalog-loading">
        <div className="spinner"></div>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="catalog-header">
        <div className="header-left">
          <Link to="/" className="btn-back">
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </Link>
          <div className="brand">
            <span className="brand-title">PostCraft AI</span>
            <span className="brand-subtitle">Meu Perfil & Identidade</span>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-container">
          <section className="profile-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={currentUser?.nome} />
                ) : (
                  <span className="avatar-placeholder-text">{initial}</span>
                )}
                {isPremium && (
                  <span className="badge-premium-avatar" title="Assinante Creator Pro">
                    <Sparkles size={14} />
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn-change-photo"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} />
                <span>Alterar Foto (MinIO)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className="profile-details">
              <h2 className="profile-name">
                {currentUser?.nome}
                <span className={`badge-role-inline role-${userRole}`}>
                  {userRole === 'admin' ? '🛡️ Admin' : (userRole === 'revisor' ? '👀 Revisor' : '🎨 Criador')}
                </span>
                {isPremium && (
                  <span className="badge-premium-inline">
                    <Sparkles size={12} />
                    <span>Creator Pro</span>
                  </span>
                )}
              </h2>
              <p className="profile-email">{currentUser?.email}</p>

              {feedback.message && (
                <div className={`profile-feedback ${feedback.type}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="profile-form">
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="bio">Bio / Descrição do Negócio</label>
                    <span className="char-count">{bio.length}/{MAX_BIO}</span>
                  </div>
                  <textarea
                    id="bio"
                    rows={3}
                    maxLength={MAX_BIO}
                    placeholder="Conte sobre sua área de atuação ou proposta de valor..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Seção Plano Creator Pro (Stripe) */}
          <section className="profile-plan-section">
            <h3 className="profile-section-title">
              <Sparkles size={16} className="fill-gold" />
              <span>Assinatura & Plano de Negócio</span>
            </h3>

            <div className={`plan-status-card ${isPremium ? 'plan-premium' : 'plan-free'}`}>
              <div className="plan-status-header">
                <div>
                  <span className="plan-badge-label">{isPremium ? 'Plano Creator Pro' : 'Plano Gratuito'}</span>
                  <h4>{isPremium ? '⭐ Assinatura Ativa (Gerações Ilimitadas)' : 'Plano de Entrada (3 posts/mês)'}</h4>
                </div>
                <span className="plan-price-tag">{isPremium ? 'R$ 49,90/mês' : 'R$ 0,00'}</span>
              </div>

              <p className="plan-description">
                {isPremium
                  ? 'Você possui acesso irrestrito: gerações ilimitadas de posts com IA, sem marcas d’água, exportação em alta definição e suporte dedicado.'
                  : 'No plano gratuito você pode gerar até 3 posts com IA por mês com marca d’água discreta. Faça o upgrade para desbloquear todo o potencial do seu negócio.'}
              </p>

              {!isPremium && (
                <div className="plan-upgrade-cta">
                  <button
                    type="button"
                    className="btn-upgrade-stripe"
                    onClick={handleStartCheckout}
                    disabled={startingCheckout}
                  >
                    <Sparkles size={15} />
                    <span>{startingCheckout ? 'Conectando ao Stripe...' : 'Fazer Upgrade para Creator Pro (R$ 49,90/mês)'}</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Seção Meus Posts Criados */}
          <section className="profile-favorites-section">
            <h3 className="profile-section-title">
              <FileText size={16} />
              <span>Meus Posts & Carrosséis Cadastrados</span>
              <span className="tab-counter">{userPosts.length}</span>
            </h3>

            {userPosts.length === 0 ? (
              <div className="empty-catalog-state">
                <FileText size={40} />
                <h3>Nenhum post criado ainda</h3>
                <p>Volte ao painel e crie seu primeiro post com IA para vê-lo aqui.</p>
              </div>
            ) : (
              <div className="profile-posts-grid">
                {userPosts.slice(0, 6).map(post => (
                  <div key={post.id} className="post-mini-card">
                    <span className="post-mini-niche">{post.nicho}</span>
                    <span className="post-mini-title" title={post.titulo}>{post.titulo}</span>
                    <span className="post-mini-status">{post.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
