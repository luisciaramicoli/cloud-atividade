import React, { useState } from 'react';

export default function PostPreviewModal({ post, onClose, onEdit, canEdit }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const slides = Array.isArray(post.slides) && post.slides.length > 0
    ? post.slides
    : [{ slide: 1, tipo: 'capa', titulo: post.titulo, subtitulo: 'Sem slides cadastrados' }];

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleCopyCaption = () => {
    const fullText = `${post.legenda}\n\n${post.hashtags || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-preview" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Pré-visualização do Post no Instagram</h2>
            <p className="modal-subtitle">
              Nicho: <strong>{post.nicho}</strong> · Status: <span className="status-pill">{post.status}</span>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar modal">&times;</button>
        </div>

        <div className="modal-preview-body">
          {/* Mockup de Celular / Feed do Instagram */}
          <div className="instagram-phone-frame">
            {/* Barra superior de status do smartphone */}
            <div className="phone-notch-bar">
              <span>9:41</span>
              <div className="phone-notch-pill"></div>
              <span>5G 􀛨</span>
            </div>

            <div className="instagram-post-header">
              <div className="instagram-author-info">
                <div className="instagram-avatar-circle">
                  {post.marca_nome ? post.marca_nome.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <span className="instagram-author-name">{post.marca_nome || 'minha_marca'}</span>
                  <span className="instagram-author-loc">{post.nicho}</span>
                </div>
              </div>
              <span className="instagram-dots">•••</span>
            </div>

            {/* Slide Atual do Carrossel */}
            <div className="instagram-slide-canvas">
              <div className="slide-counter-badge">
                {currentSlideIndex + 1}/{slides.length}
              </div>

              <div className="slide-inner">
                <span className="slide-niche-tag">{post.nicho}</span>
                <h3 className="slide-title">{currentSlide.titulo}</h3>
                {currentSlide.subtitulo && (
                  <p className="slide-desc">{currentSlide.subtitulo}</p>
                )}
                {post.marca_logo && (
                  <img src={post.marca_logo} alt="Logo" className="slide-brand-logo" />
                )}
              </div>

              {/* Controles de Navegação do Carrossel */}
              {slides.length > 1 && (
                <>
                  {currentSlideIndex > 0 && (
                    <button className="carousel-nav-btn prev" onClick={handlePrev} title="Slide anterior">‹</button>
                  )}
                  {currentSlideIndex < slides.length - 1 && (
                    <button className="carousel-nav-btn next" onClick={handleNext} title="Próximo slide">›</button>
                  )}
                </>
              )}
            </div>

            {/* Paginação de Pontinhos */}
            <div className="instagram-dots-row">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIndex(i)}
                  title={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="instagram-actions-bar">
              <div className="instagram-icons-left">
                <span>❤️</span>
                <span>💬</span>
                <span>↗️</span>
              </div>
              <span>🔖</span>
            </div>

            <div className="instagram-caption-box">
              <p>
                <strong>{post.marca_nome || 'minha_marca'}</strong>{' '}
                <span style={{ whiteSpace: 'pre-line' }}>{post.legenda}</span>
              </p>
              {post.hashtags && (
                <p className="instagram-hashtags">{post.hashtags}</p>
              )}
            </div>
          </div>

          {/* Painel Lateral com Informações e Ações */}
          <div className="preview-side-panel">
            <h3>📝 Legenda e Copywriting</h3>
            <div className="caption-text-area">
              <p style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.6', margin: 0, color: '#f1f5f9' }}>
                {post.legenda}
              </p>
              {post.hashtags && (
                <p style={{ marginTop: '14px', color: '#818cf8', fontSize: '13px', lineHeight: '1.5' }}>
                  {post.hashtags}
                </p>
              )}
            </div>

            <div className="side-panel-actions">
              <button className="btn-copy-caption" onClick={handleCopyCaption}>
                {copied ? '✅ Legenda Copiada!' : '📋 Copiar Legenda e Hashtags'}
              </button>
              {canEdit && (
                <button className="btn-edit-post" onClick={() => { onClose(); onEdit(post); }}>
                  ✏️ Editar Post e Slides
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
