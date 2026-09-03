import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchComments = async () => {
    try {
      const res = await api.get(`comments/${movie.id}`);
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
    setFeedback({ type: '', message: '' });
    try {
      await api.post('comments', {
        tmdb_movie_id: movie.id,
        texto: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao adicionar comentário' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.delete(`comments/${commentId}`);
      setFeedback({ type: 'success', message: res.data.message || 'Comentário excluído com sucesso' });
      fetchComments();
    } catch (err) {
      if (err.response?.status === 403) {
        setFeedback({
          type: 'error',
          message: '❌ 403 Forbidden: Acesso negado pelo servidor!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.error || 'Erro ao excluir comentário'
        });
      }
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

            {feedback.message && (
              <p className={`comment-alert ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
                {feedback.message}
              </p>
            )}

            <ul className="comments-list">
              {comments.length === 0 ? (
                <li style={{ textAlign: 'center', color: '#9ca3af' }}>Nenhum comentário ainda.</li>
              ) : comments.map(c => (
                <li key={c.id} className="comment-item">
                  <div className="comment-header-meta">
                    <span className="comment-author-name">
                      {c.usuario_nome || 'Usuário'}
                    </span>
                    <span className="comment-date">
                      {c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>

                  <div className="comment-content-row">
                    <span className="comment-text-body">{c.texto}</span>
                    <div className="comment-actions-cell">
                      {c.can_delete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className={c.is_moderation ? "btn-moderate" : "btn-delete-mine"}
                          title={c.is_moderation ? "Ação exclusiva de Moderação" : "Apagar meu comentário"}
                        >
                          {c.is_moderation ? "🛡️ Moderação" : "🗑️"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
