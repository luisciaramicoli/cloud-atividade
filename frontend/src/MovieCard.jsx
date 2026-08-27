import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/comments/${movie.id}`, getAuthHeaders());
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post('/api/comments', {
        tmdb_movie_id: movie.id,
        texto: newComment
      }, getAuthHeaders());
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="movie-card">
      {movie.poster_path ? (
        <img 
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
          alt={movie.title} 
          className="movie-poster"
        />
      ) : (
        <div className="movie-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sem Imagem</div>
      )}
      
      <div className="movie-info">
        <h4>{movie.title}</h4>
        <p title={movie.overview}>{movie.overview || 'Sem sinopse disponível.'}</p>

        <div className="movie-actions">
          <button 
            onClick={onToggleFavorite}
            className={`btn-favorite ${isFavorite ? 'active' : ''}`}
          >
            {isFavorite ? '★ Favorito' : '☆ Adicionar Favorito'}
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="btn-secondary"
          >
            {showComments ? 'Ocultar Comentários' : 'Ver Comentários'}
          </button>
        </div>

        {showComments && (
          <div className="comments-section">
            <form onSubmit={handleAddComment} className="comment-form">
              <input 
                type="text" 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                placeholder="Escreva algo..." 
              />
              <button type="submit">Enviar</button>
            </form>
            
            <ul className="comments-list">
              {comments.length === 0 ? (
                <li style={{ textAlign: 'center', color: '#9ca3af' }}>Nenhum comentário ainda.</li>
              ) : comments.map(c => (
                <li key={c.id}>{c.texto}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
