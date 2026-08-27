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
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: 'white' }}>
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          style={{ width: '100%', borderRadius: '4px' }}
        />
      ) : (
        <div style={{ width: '100%', height: '300px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sem Imagem</div>
      )}

      <h4 style={{ margin: '10px 0' }}>{movie.title}</h4>
      <p style={{ fontSize: '12px', color: '#555', height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {movie.overview}
      </p>

      <button
        onClick={onToggleFavorite}
        style={{ background: isFavorite ? '#28a745' : '#007bff', marginBottom: '10px' }}
      >
        {isFavorite ? '★ Favorito' : '☆ Adicionar Favorito'}
      </button>

      <button
        onClick={() => setShowComments(!showComments)}
        style={{ background: '#6c757d' }}
      >
        {showComments ? 'Esconder Comentários' : 'Ver Comentários'}
      </button>

      {showComments && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Novo comentário..."
              style={{ margin: 0, padding: '5px' }}
            />
            <button type="submit" style={{ width: 'auto', padding: '5px 10px' }}>+</button>
          </form>

          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', maxHeight: '100px', overflowY: 'auto' }}>
            {comments.length === 0 ? <li>Sem comentários</li> : comments.map(c => (
              <li key={c.id}>{c.texto}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

