import React from 'react';

export default function PostCard({ post, onSelect, onEdit, onDelete, canEdit }) {
  const slides = Array.isArray(post.slides) ? post.slides : [];
  const coverSlide = slides[0] || {};

  return (
    <div className="post-card">
      <div className="post-card-preview" onClick={() => onSelect(post)}>
        <div className="preview-badge-row">
          <span className="badge-format">{post.formato || 'carrossel'}</span>
          <span className={`badge-status ${post.status === 'gerado' ? 'status-ai' : 'status-draft'}`}>
            {post.status === 'gerado' ? '✨ Gerado com IA' : 'Rascunho'}
          </span>
        </div>

        <div className="preview-slide-content">
          <p className="preview-niche">{post.nicho}</p>
          <h4 className="preview-title">{coverSlide.titulo || post.titulo}</h4>
          {coverSlide.subtitulo && (
            <p className="preview-subtitle">{coverSlide.subtitulo}</p>
          )}
        </div>

        <div className="preview-footer">
          <span>{slides.length} slides</span>
          <span className="preview-hint">Clique para abrir mockup 👉</span>
        </div>
      </div>

      <div className="post-card-info">
        <h3 className="post-info-title" title={post.titulo}>{post.titulo}</h3>
        <p className="post-info-date">
          {new Date(post.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>

        <div className="post-card-actions">
          <button className="btn-view" onClick={() => onSelect(post)}>
            Visualizar
          </button>
          {canEdit && (
            <>
              <button className="btn-edit" onClick={() => onEdit(post)}>
                Editar
              </button>
              <button className="btn-delete" onClick={() => onDelete(post.id)}>
                Excluir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

