import { useState, useEffect } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Catalog({ onLogout, currentUser }) {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [logsList, setLogsList] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchMovies();
    fetchFavorites();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await api.get('movies');
      setMovies(res.data.cast || []);
    } catch (err) {
      setError('Erro ao buscar filmes. ' + (err.response?.data?.error || ''));
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get('favorites');
      setFavorites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('users');
      setUsersList(res.data);
      setShowUsersModal(true);
      setShowLogsModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao carregar lista de usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('logs?limit=50');
      setLogsList(res.data?.logs || []);
      setShowLogsModal(true);
      setShowUsersModal(false);
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

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <div>
          <h2>Catálogo de Filmes (Tom Hanks)</h2>
          <div className="user-profile-header">
            <span>Conectado como: <strong>{currentUser?.nome || 'Usuário'}</strong></span>
          </div>
        </div>
        <div className="header-actions">
          {currentUser?.can_manage_users && (
            <div className="admin-actions-group">
              <button
                onClick={showUsersModal ? () => setShowUsersModal(false) : fetchUsers}
                className="btn-admin-panel"
              >
                {loadingUsers ? 'Carregando...' : (showUsersModal ? 'Fechar Usuários' : '🛡️ Usuários')}
              </button>
              <button
                onClick={showLogsModal ? () => setShowLogsModal(false) : fetchLogs}
                className="btn-admin-logs"
              >
                {loadingLogs ? 'Carregando...' : (showLogsModal ? 'Fechar Logs' : '📜 Logs (Redis)')}
              </button>
            </div>
          )}
          <button onClick={onLogout} style={{ width: 'auto' }} className="btn-danger">Sair</button>
        </div>
      </div>

      {showUsersModal && (
        <div className="admin-panel-card">
          <h3>Painel Administrativo: Gestão de Usuários (RBAC)</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Acesso centralizado verificado pelo microsserviço de autenticação.
          </p>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Criado Em</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showLogsModal && (
        <div className="admin-panel-card logs-card">
          <div className="logs-header-actions">
            <div>
              <h3>Trilha de Auditoria & Observabilidade (Redis Streams)</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                Registro imutável em padrão CloudEvents v1.0 / NIST SP 800-92 persistido no Redis.
              </p>
            </div>
            <button onClick={fetchLogs} className="btn-refresh-logs">
              {loadingLogs ? 'Atualizando...' : '🔄 Atualizar'}
            </button>
          </div>

          <div className="table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Horário (UTC)</th>
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                      Nenhum evento de auditoria registrado no momento.
                    </td>
                  </tr>
                ) : (
                  logsList.map((l, idx) => {
                    const isSuccess = l.status === 'success';
                    const isDenied = l.status === 'denied' || l.action === 'tentativa_negada_403';
                    const badgeClass = isSuccess ? 'badge-status-success' : isDenied ? 'badge-status-denied' : 'badge-status-error';

                    return (
                      <tr key={l.stream_id || idx}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {l.time ? new Date(l.time).toLocaleTimeString('pt-BR') : '-'}
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                            {l.time ? new Date(l.time).toLocaleDateString('pt-BR') : ''}
                          </div>
                        </td>
                        <td>
                          <strong>{l.actor?.id ? `ID #${l.actor.id}` : 'Anônimo'}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {l.actor?.role || 'user'} • {l.actor?.ip || '127.0.0.1'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: isDenied ? '#b91c1c' : '#1f2937' }}>
                            {l.action}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${badgeClass}`}>
                            {l.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{l.type}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{l.source}</div>
                        </td>
                        <td>
                          {l.target ? (
                            <span className="log-code-snippet">
                              {l.target.type}{l.target.id ? ` #${l.target.id}` : ''}{l.target.path ? ` (${l.target.method} ${l.target.path})` : ''}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td>
                          {l.metadata && Object.keys(l.metadata).length > 0 ? (
                            <span className="log-code-snippet">
                              {JSON.stringify(l.metadata)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span className="log-code-snippet" style={{ color: '#059669' }}>
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
        </div>
      )}

      {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}

      <div className="movie-grid">
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isFavorite={favorites.some(f => f.tmdb_movie_id === movie.id)}
            onToggleFavorite={() => toggleFavorite(movie)}
          />
        ))}
      </div>
    </div>
  );
}

