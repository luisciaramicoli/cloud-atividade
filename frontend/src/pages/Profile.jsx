import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Film,
  Star,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  UserCircle,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';

const BIO_MAX_LEN = 280;

export default function Profile({ currentUser, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, moviesRes, favoritesRes] = await Promise.all([
        api.get('profile'),
        api.get('movies'),
        api.get('favorites')
      ]);
      setProfile(profileRes.data);
      setBio(profileRes.data.bio || '');
      setMovies(moviesRes.data.cast || []);
      setFavorites(favoritesRes.data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao carregar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const favoriteMovies = useMemo(() => {
    const favIds = new Set(favorites.map(f => f.tmdb_movie_id));
    return movies.filter(m => favIds.has(m.id));
  }, [movies, favorites]);

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

      const res = await api.put(`users/${currentUser.id}/profile`, form);

      setProfile(prev => ({ ...prev, bio: res.data.profile.bio, avatarUrl: res.data.profile.avatarUrl }));
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao salvar perfil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-grid-state" style={{ minHeight: '100vh' }}>
        <RefreshCw size={28} className="spin-icon" />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="modern-app-wrapper">
      <header className="modern-navbar">
        <div className="navbar-container">
          <div className="brand-user-row">
            <div className="brand-section">
              <div className="brand-logo-icon">
                <Film size={20} />
              </div>
              <div className="brand-text-block">
                <h1 className="brand-title">CineCloud</h1>
                <span className="brand-subtitle">Meu Perfil</span>
              </div>
            </div>

            <div className="user-identity-bar">
              <div className="user-profile-chip">
                <span className="user-name">{currentUser?.nome || 'Usuário'}</span>
                <span className={`role-pill ${currentUser?.can_manage_users ? 'role-admin' : 'role-user'}`}>
                  {currentUser?.can_manage_users ? (
                    <>
                      <ShieldCheck size={12} />
                      <span>Admin</span>
                    </>
                  ) : (
                    <span>Usuário</span>
                  )}
                </span>
              </div>
              <button onClick={onLogout} className="btn-nav-logout" title="Encerrar Sessão">
                <LogOut size={15} />
                <span className="logout-text">Sair</span>
              </button>
            </div>
          </div>

          <div className="nav-buttons-group">
            <Link to="/" className="btn-nav-admin" title="Voltar ao catálogo">
              <ArrowLeft size={14} />
              <span>Catálogo</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content-container">
        <div className="profile-layout">
          <section className="profile-card">
            <div className="profile-avatar-block">
              <div className="profile-avatar-circle">
                {photoPreview || profile?.avatarUrl ? (
                  <img src={photoPreview || profile.avatarUrl} alt="Foto de perfil" />
                ) : (
                  <UserCircle size={64} />
                )}
              </div>
              <button
                type="button"
                className="btn-avatar-upload"
                onClick={() => fileInputRef.current?.click()}
                title="Escolher nova foto"
              >
                <Camera size={14} />
                <span>Trocar foto</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <span className="profile-avatar-hint">JPEG, PNG, WEBP ou GIF · até 3 MB</span>
            </div>

            <form onSubmit={handleSave} className="profile-form">
              <h2 className="profile-name-heading">{profile?.nome}</h2>
              <p className="profile-email-sub">{profile?.email}</p>

              <label htmlFor="bio" className="profile-field-label">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, BIO_MAX_LEN))}
                placeholder="Conte um pouco sobre você..."
                rows={3}
                className="profile-bio-textarea"
              />
              <span className="profile-bio-counter">{bio.length}/{BIO_MAX_LEN}</span>

              {feedback.message && (
                <div className={`feedback-banner ${feedback.type === 'error' ? 'banner-danger' : 'banner-success'}`}>
                  {feedback.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button type="submit" disabled={saving} className="btn-save-profile">
                {saving ? <RefreshCw size={15} className="spin-icon" /> : <Save size={15} />}
                <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
              </button>
            </form>
          </section>

          <section className="profile-favorites-section">
            <h3 className="profile-section-title">
              <Star size={16} className="fill-gold" />
              <span>Filmes favoritados</span>
              <span className="tab-counter">{favoriteMovies.length}</span>
            </h3>

            {favoriteMovies.length === 0 ? (
              <div className="empty-catalog-state">
                <Star size={40} />
                <h3>Nenhum favorito ainda</h3>
                <p>Volte ao catálogo e favorite alguns filmes para vê-los aqui.</p>
              </div>
            ) : (
              <div className="profile-favorites-grid">
                {favoriteMovies.map(movie => (
                  <div key={movie.id} className="favorite-mini-card">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="poster-placeholder">
                        <span>Sem Imagem</span>
                      </div>
                    )}
                    <span className="favorite-mini-title" title={movie.title}>{movie.title}</span>
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
