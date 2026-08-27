import { useState, useEffect } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';

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
      const res = await axios.get('/api/movies', getAuthHeaders());
      setMovies(res.data.cast || []);
    } catch (err) {
      setError('Erro ao buscar filmes. ' + (err.response?.data?.error || ''));
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get('/api/favorites', getAuthHeaders());
      setFavorites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (movie) => {
    const isFav = favorites.find(f => f.tmdb_movie_id === movie.id);
    try {
      if (isFav) {
        await axios.delete(`/api/favorites/${movie.id}`, getAuthHeaders());
      } else {
        await axios.post('/api/favorites', {
          tmdb_movie_id: movie.id,
          titulo: movie.title,
          poster_path: movie.poster_path
        }, getAuthHeaders());
      }
      fetchFavorites(); // Atualiza a lista
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Catálogo de Filmes (Tom Hanks)</h2>
        <button onClick={onLogout} style={{ width: 'auto', background: '#dc3545' }}>Sair</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
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

