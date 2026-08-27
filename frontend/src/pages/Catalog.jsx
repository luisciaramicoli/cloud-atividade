import { useState, useEffect } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';

export default function Catalog({ onLogout }) {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovies();
    fetchFavorites();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

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
      fetchFavorites(); // Atualiza a lista
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h2>Catálogo de Filmes (Tom Hanks)</h2>
        <button onClick={onLogout} style={{ width: 'auto' }} className="btn-danger">Sair</button>
      </div>
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

