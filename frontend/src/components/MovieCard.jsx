import { useState, useEffect } from 'react';
import api from '../services/api';
import { Star, MessageSquare, Send, Trash2, ShieldAlert, Calendar, Sparkles, ChevronDown, ChevronUp, User } from 'lucide-react';

export default function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`comments/${movie.id}`);
      setComments(res.data || []);
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
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });
    try {
      await api.post('comments', {
        tmdb_movie_id: movie.id,
        texto: newComment.trim()
      });
      setNewComment('');
      fetchComments();
      setFeedback({ type: 'success', message: 'Comentário publicado!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Erro ao adicionar comentário' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.delete(`comments/${commentId}`);
      setFeedback({ type: 'success', message: res.data.message || 'Comentário excluído com sucesso' });
      fetchComments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      if (err.response?.status === 403) {
        setFeedback({
          type: 'error',
          message: '❌ 403 Forbidden: Apenas administradores podem moderar este comentário!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.error || 'Erro ao excluir comentário'
        });
      }
    }
  };

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : null;

  return (
    <div className="movie-card-modern">
      {/* Poster Container com botões flutuantes */}
      <div className="poster-wrapper">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="poster-img"
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder">
            <span>Sem Imagem</span>
          </div>
        )}

        {/* Botão de Favoritar Flutuante */}
        <button
          onClick={onToggleFavorite}
          className={`btn-fav-float ${isFavorite ? 'is-fav' : ''}`}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={isFavorite ? 'Favorito' : 'Favoritar'}
        >
          <Star size={18} className={isFavorite ? 'fill-gold' : ''} />
        </button>

        {/* Badges Flutuantes Inferiores */}
        <div className="poster-badges">
          {releaseYear && (
            <span className="badge-meta">
              <Calendar size={12} /> {releaseYear}
            </span>
          )}
          {movie.vote_average > 0 && (
            <span className="badge-meta badge-rating">
              <Sparkles size={12} /> {movie.vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="card-details">
        <h4 className="movie-title" title={movie.title}>
          {movie.title}
        </h4>

        <p className="movie-overview" title={movie.overview}>
          {movie.overview || 'Sinopse não disponível para este título.'}
        </p>

        {/* Rodapé de Ações */}
        <div className="card-footer-actions">
          <button
            onClick={() => setShowComments(!showComments)}
            className={`btn-toggle-comments ${showComments ? 'active' : ''}`}
          >
            <MessageSquare size={15} />
            <span>{showComments ? 'Ocultar' : 'Comentários'}</span>
            {comments.length > 0 && <span className="comments-counter-badge">{comments.length}</span>}
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Seção Expansível de Comentários */}
        {showComments && (
          <div className="comments-drawer">
            <form onSubmit={handleAddComment} className="modern-comment-form">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                disabled={isSubmitting}
              />
              <button type="submit" disabled={isSubmitting || !newComment.trim()} className="btn-send-comment">
                <Send size={15} />
              </button>
            </form>

            {feedback.message && (
              <div className={`feedback-banner ${feedback.type === 'error' ? 'banner-danger' : 'banner-success'}`}>
                {feedback.message}
              </div>
            )}

            <div className="comments-stream">
              {comments.length === 0 ? (
                <div className="empty-comments-state">
                  <p>Seja o primeiro a comentar!</p>
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment-bubble">
                    <div className="comment-bubble-header">
                      <div className="author-info">
                        <div className="author-avatar">
                          <User size={12} />
                        </div>
                        <span className="author-name">{c.usuario_nome || 'Usuário'}</span>
                        {c.is_moderation && (
                          <span className="badge-author-target">Outro Autor</span>
                        )}
                      </div>
                      <span className="comment-time">
                        {c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>

                    <div className="comment-bubble-body">
                      <p>{c.texto}</p>
                      {c.can_delete && (
                        <div className="comment-actions">
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className={c.is_moderation ? 'btn-action-moderate' : 'btn-action-delete'}
                            title={c.is_moderation ? 'Ação de Moderação (Admin)' : 'Excluir meu comentário'}
                          >
                            {c.is_moderation ? (
                              <>
                                <ShieldAlert size={13} />
                                <span>Moderar</span>
                              </>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
