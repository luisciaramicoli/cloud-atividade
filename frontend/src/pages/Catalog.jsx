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
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao carregar lista de usuários');
    } finally {
      setLoadingUsers(false);
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
            <button
              onClick={showUsersModal ? () => setShowUsersModal(false) : fetchUsers}
              className="btn-admin-panel"
            >
              {loadingUsers ? 'Carregando...' : (showUsersModal ? 'Fechar Painel Admin' : '🛡️ Listar Usuários')}
            </button>
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

