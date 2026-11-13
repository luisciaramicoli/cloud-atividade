import React from 'react';
import { Sparkles, Eye, Edit3, Trash2, ArrowRight } from 'lucide-react';

export default function PostCard({ post, onSelect, onEdit, onDelete, canEdit }) {
  const slides = Array.isArray(post.slides) ? post.slides : [];
  const coverSlide = slides[0] || {};

  return (
    <div className="post-card">
      <div className="post-card-preview" role="button" tabIndex={0} aria-label={`Visualizar ${post.titulo}`} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(post); } }} onClick={() => onSelect(post)} style={post.imagem_url ? { backgroundImage: `linear-gradient(rgba(14, 10, 30, .65), rgba(14, 10, 30, .75)), url("${post.imagem_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <div className="preview-badge-row">
          <span className="badge-format">{post.formato || 'carrossel'}</span>
          <span className={`badge-status ${post.status === 'gerado' ? 'status-ai' : 'status-draft'}`}>
            {post.status === 'gerado' ? (
              <>
                <Sparkles size={12} />
                <span>Gerado com IA</span>
              </>
            ) : (
              'Rascunho'
            )}
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
          <span className="preview-hint">
            <span>Abrir mockup</span>
            <ArrowRight size={13} />
          </span>
        </div>
      </div>

      <div className="post-card-info">
        <h3 className="post-info-title" title={post.titulo}>{post.titulo}</h3>
        <p className="post-info-date">
          {new Date(post.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>

        <div className="post-card-actions">
          <button type="button" className="btn-view" onClick={() => onSelect(post)}>
            <Eye size={14} />
            <span>Visualizar</span>
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn-edit" onClick={() => onEdit(post)}>
                <Edit3 size={14} />
                <span>Editar</span>
              </button>
              <button type="button" className="btn-delete" onClick={() => onDelete(post.id)}>
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
