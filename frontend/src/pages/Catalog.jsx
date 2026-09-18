import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import {
  Film,
  Star,
  Users,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  Activity
} from 'lucide-react';

export default function Catalog({ onLogout, currentUser }) {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'
  const [error, setError] = useState('');
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Modais de Admin
  const [activeModal, setActiveModal] = useState(null); // 'users' | 'logs' | null
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [logsList, setLogsList] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchMovies();
    fetchFavorites();
  }, []);

  const fetchMovies = async () => {
    setLoadingMovies(true);
    try {
      const res = await api.get('movies');
      setMovies(res.data.cast || []);
    } catch (err) {
      setError('Erro ao carregar catálogo. ' + (err.response?.data?.error || ''));
    } finally {
      setLoadingMovies(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get('favorites');
      setFavorites(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openUsersModal = async () => {
    setActiveModal('users');
    setLoadingUsers(true);
    try {
      const res = await api.get('users');
      setUsersList(res.data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao carregar lista de usuários');
      setActiveModal(null);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openLogsModal = async () => {
    setActiveModal('logs');
    fetchLogs();
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('logs?limit=50');
      setLogsList(res.data?.logs || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao carregar logs de auditoria');
    } finally {
      setLoadingLogs(false);
    }
  };

  const toggleFavorite = async (movie) => {
    const isFav = favorites.find(f => f.tmdb_movie_id === movie.id);
    try {
      if (isFav) {
        await api.delete(`favorites/${movie.id}`);
      } else {
        await api.post('favorites', {
          tmdb_movie_id: movie.id,
          titulo: movie.title,
          poster_path: movie.poster_path
        });
      }
      fetchFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtragem e busca reativa
  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (movie.overview && movie.overview.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterMode === 'favorites') {
        const isFav = favorites.some(f => f.tmdb_movie_id === movie.id);
        return matchesSearch && isFav;
      }
      return matchesSearch;
    });
  }, [movies, favorites, searchTerm, filterMode]);

  // Estatísticas rápidas de auditoria
  const auditStats = useMemo(() => {
    const deniedCount = logsList.filter(l => l.status === 'denied' || l.action === 'tentativa_negada_403').length;
    const successCount = logsList.filter(l => l.status === 'success').length;
    return { total: logsList.length, denied: deniedCount, success: successCount };
  }, [logsList]);

  return (
    <div className="modern-app-wrapper">
      {/* Top Navbar */}
      <header className="modern-navbar">
        <div className="navbar-container">
          {/* Top Row: Brand on Left, User & Logout on Right */}
          <div className="brand-user-row">
            <div className="brand-section">
              <div className="brand-logo-icon">
                <Film size={20} />
              </div>
              <div className="brand-text-block">
                <h1 className="brand-title">CineCloud</h1>
                <span className="brand-subtitle">Filmografia Tom Hanks</span>
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

          {/* Action Buttons Group */}
          <div className="nav-buttons-group">
            {currentUser?.can_manage_users && (
              <>
                <button onClick={openUsersModal} className="btn-nav-admin" title="Gestão de Usuários (RBAC)">
                  <Users size={14} />
                  <span>Usuários</span>
                </button>
                <button onClick={openLogsModal} className="btn-nav-logs" title="Trilha de Auditoria (Redis Streams)">
                  <Database size={14} />
                  <span>Auditoria</span>
                </button>
              </>
            )}

            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nav-docs"
              title="Documentação Interativa Swagger / OpenAPI"
            >
              <BookOpen size={14} />
              <span>Swagger</span>
            </a>

            <a
              href={`${window.location.protocol}//${window.location.hostname}:3001`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nav-grafana"
              title="Painel de Métricas e Observabilidade Grafana"
            >
              <Activity size={14} />
              <span>Grafana</span>
            </a>
          </div>
        </div>
      </header>

      {/* Subheader com Filtros e Barra de Pesquisa */}
      <div className="toolbar-section">
        <div className="toolbar-container">
          {/* Campo de Busca */}
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar filme por título ou sinopse..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn-clear-search">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros em Abas */}
          <div className="filter-tabs-group">
            <button
              onClick={() => setFilterMode('all')}
              className={`filter-tab ${filterMode === 'all' ? 'active' : ''}`}
            >
              <Layers size={15} />
              <span>Todos</span>
              <span className="tab-counter">{movies.length}</span>
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`filter-tab ${filterMode === 'favorites' ? 'active' : ''}`}
            >
              <Star size={15} className={filterMode === 'favorites' ? 'fill-gold' : ''} />
              <span>Favoritos</span>
              <span className="tab-counter">{favorites.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro Geral */}
      {error && (
        <div className="error-banner-container">
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Grid de Filmes */}
      <main className="main-content-container">
        {loadingMovies ? (
          <div className="loading-grid-state">
            <RefreshCw size={28} className="spin-icon" />
            <p>Carregando catálogo da TMDB...</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="empty-catalog-state">
            <Film size={48} />
            <h3>Nenhum filme encontrado</h3>
            <p>Tente ajustar os termos de busca ou mudar o filtro selecionado.</p>
          </div>
        ) : (
          <div className="movies-modern-grid">
            {filteredMovies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isFavorite={favorites.some(f => f.tmdb_movie_id === movie.id)}
                onToggleFavorite={() => toggleFavorite(movie)}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL 1: Gestão de Usuários (RBAC) */}
      {activeModal === 'users' && (
        <div className="modal-backdrop-overlay" onClick={() => setActiveModal(null)}>
          <div className="modern-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Users size={22} className="modal-icon-header" />
                <div>
                  <h3>Gestão de Usuários (RBAC)</h3>
                  <p>Autorização centralizada validada via rede interna com o auth-service.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn-close-modal">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-content">
              {loadingUsers ? (
                <div className="modal-loading-box">
                  <RefreshCw size={24} className="spin-icon" />
                  <p>Consultando usuários...</p>
                </div>
              ) : (
                <div className="table-responsive-box">
                  <table className="modern-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Papel (Role)</th>
                        <th>Data de Criação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(u => (
                        <tr key={u.id}>
                          <td><strong>#{u.id}</strong></td>
                          <td>{u.nome}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`table-role-badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}>
                              {u.role === 'admin' ? '🛡️ Admin' : '👤 Usuário'}
                            </span>
                          </td>
                          <td>{u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Trilha de Auditoria & Observabilidade (Redis Streams) */}
      {activeModal === 'logs' && (
        <div className="modal-backdrop-overlay" onClick={() => setActiveModal(null)}>
          <div className="modern-modal-card modal-logs-expanded" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Database size={22} className="modal-icon-header text-emerald" />
                <div>
                  <h3>Trilha de Auditoria & Observabilidade (Redis Streams)</h3>
                  <p>Eventos imutáveis no padrão CloudEvents v1.0 / NIST SP 800-92 persistidos no Redis.</p>
                </div>
              </div>
              <div className="modal-actions-right">
                <button onClick={fetchLogs} disabled={loadingLogs} className="btn-refresh-pill">
                  <RefreshCw size={14} className={loadingLogs ? 'spin-icon' : ''} />
                  <span>{loadingLogs ? 'Atualizando...' : 'Recarregar'}</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="btn-close-modal">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="audit-stats-grid">
              <div className="stat-box">
                <span className="stat-label">Total Ingerido</span>
                <span className="stat-value">{auditStats.total}</span>
              </div>
              <div className="stat-box box-success">
                <span className="stat-label">Ações Bem-sucedidas</span>
                <span className="stat-value">{auditStats.success}</span>
              </div>
              <div className="stat-box box-denied">
                <span className="stat-label">Tentativas Negadas (403)</span>
                <span className="stat-value">{auditStats.denied}</span>
              </div>
            </div>

            <div className="modal-body-content">
              {loadingLogs && logsList.length === 0 ? (
                <div className="modal-loading-box">
                  <RefreshCw size={24} className="spin-icon" />
                  <p>Lendo stream do Redis...</p>
                </div>
              ) : (
                <div className="table-responsive-box">
                  <table className="modern-data-table logs-grid-table">
                    <thead>
                      <tr>
                        <th>Data/Hora (UTC)</th>
                        <th>Ator</th>
                        <th>Ação</th>
                        <th>Status</th>
                        <th>Tipo / Fonte</th>
                        <th>Alvo</th>
                        <th>Detalhes</th>
                        <th>Stream ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsList.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            Nenhum log gravado até o momento.
                          </td>
                        </tr>
                      ) : (
                        logsList.map((l, idx) => {
                          const isSuccess = l.status === 'success';
                          const isDenied = l.status === 'denied' || l.action === 'tentativa_negada_403';

                          return (
                            <tr key={l.stream_id || idx} className={isDenied ? 'row-alert-denied' : ''}>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div className="time-primary">
                                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                                  {l.time ? new Date(l.time).toLocaleTimeString('pt-BR') : '-'}
                                </div>
                                <div className="time-secondary">
                                  {l.time ? new Date(l.time).toLocaleDateString('pt-BR') : ''}
                                </div>
                              </td>
                              <td>
                                <div className="actor-main">{l.actor?.id ? `ID #${l.actor.id}` : 'Anônimo'}</div>
                                <div className="actor-sub">{l.actor?.role || 'user'} • {l.actor?.ip || '127.0.0.1'}</div>
                              </td>
                              <td>
                                <span className={`action-tag ${isDenied ? 'action-tag-denied' : ''}`}>
                                  {l.action}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${isSuccess ? 'badge-success' : 'badge-denied'}`}>
                                  {isSuccess ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
                                  <span>{l.status}</span>
                                </span>
                              </td>
                              <td>
                                <div className="type-main">{l.type}</div>
                                <div className="source-sub">{l.source}</div>
                              </td>
                              <td>
                                {l.target ? (
                                  <span className="mono-pill">
                                    {l.target.type}{l.target.id ? ` #${l.target.id}` : ''}{l.target.path ? ` (${l.target.method} ${l.target.path})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                {l.metadata && Object.keys(l.metadata).length > 0 ? (
                                  <span className="mono-pill" title={JSON.stringify(l.metadata)}>
                                    {JSON.stringify(l.metadata)}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <span className="mono-stream-id">
                                  {l.stream_id}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
