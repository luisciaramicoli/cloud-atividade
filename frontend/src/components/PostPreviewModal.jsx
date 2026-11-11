import React, { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Check,
  Edit3,
  X,
  Sparkles,
  Layers,
  Tag,
  Wifi,
  Battery
} from 'lucide-react';

export default function PostPreviewModal({ post, onClose, onEdit, canEdit }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const handleCopyCaption = async () => {
    const fullText = `${post.legenda || ''}\n\n${post.hashtags || ''}`.trim();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <div className="modal-backdrop preview-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="post-preview-title">
      <div className="modal-container modal-preview" onClick={e => e.stopPropagation()}>
        <div className="preview-glow-accent" />

        {/* Modal Header */}
        <div className="modal-header-refined preview-modal-header">
          <div className="preview-header-left">
            <div className="preview-badge-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="preview-title" id="post-preview-title">Prévia da publicação</h2>
              <div className="preview-meta-row">
                <span className="preview-meta-item">
                  <Tag size={13} />
                  <span>{post.nicho}</span>
                </span>
                <span className="preview-meta-dot">•</span>
                <span className="preview-status-pill">{post.status}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="preview-close-btn"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-preview-body">
          {/* Mockup do Instagram */}
          <div className="instagram-phone-frame">
            {/* Barra de Status do Telefone */}
            <div className="phone-notch-bar">
              <span className="phone-time">09:41</span>
              <div className="phone-dynamic-island" />
              <div className="phone-status-icons">
                <Wifi size={12} strokeWidth={2.5} />
                <span className="phone-signal">5G</span>
                <Battery size={13} strokeWidth={2.5} />
              </div>
            </div>

            {/* Cabeçalho do Post no Instagram */}
            <div className="instagram-post-header">
              <div className="instagram-author-info">
                <div className="instagram-avatar-ring">
                  <div className="instagram-avatar-circle">
                    {post.marca_nome ? post.marca_nome.charAt(0).toUpperCase() : 'P'}
                  </div>
                </div>
                <div className="instagram-author-text">
                  <span className="instagram-author-name">{post.marca_nome || 'minha_marca'}</span>
                  <span className="instagram-author-loc">{post.nicho}</span>
                </div>
              </div>
              <span className="instagram-more-btn" aria-hidden="true">
                <MoreHorizontal size={18} />
              </span>
            </div>

            {/* Slide Atual do Carrossel */}
            <div className="instagram-slide-canvas" style={post.imagem_url ? { backgroundImage: `linear-gradient(rgba(14, 10, 30, .62), rgba(14, 10, 30, .72)), url("${post.imagem_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
              <div className="slide-counter-badge">
                <Layers size={12} />
                <span>{currentSlideIndex + 1}/{slides.length}</span>
              </div>

              <div className="slide-inner">
                <span className="slide-niche-tag">{post.nicho}</span>
                <h3 className="slide-title">{currentSlide.titulo}</h3>
                {currentSlide.subtitulo && (
                  <p className="slide-desc">{currentSlide.subtitulo}</p>
                )}
                {post.marca_logo && (
                  <img src={post.marca_logo} alt="Logo da Marca" className="slide-brand-logo" />
                )}
              </div>

              {/* Controles de Navegação */}
              {slides.length > 1 && (
                <>
                  {currentSlideIndex > 0 && (
                    <button
                      type="button"
                      className="carousel-nav-btn prev"
                      onClick={handlePrev}
                      aria-label="Slide anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {currentSlideIndex < slides.length - 1 && (
                    <button
                      type="button"
                      className="carousel-nav-btn next"
                      onClick={handleNext}
                      aria-label="Próximo slide"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Indicadores de Paginação */}
            <div className="instagram-dots-row">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  className={`dot ${i === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlideIndex(i)}
                  aria-label={`Ir para slide ${i + 1}`}
                  aria-current={i === currentSlideIndex ? 'true' : undefined}
                />
              ))}
            </div>

            {/* Barra de Ações (Like, Comentário, Enviar, Salvar) */}
            <div className="instagram-actions-bar">
              <div className="instagram-icons-left">
                <button
                  type="button"
                  className={`insta-action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label="Curtir"
                  aria-pressed={isLiked}
                >
                  <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'currentColor'} />
                </button>
                <span className="insta-action-btn" aria-hidden="true">
                  <MessageCircle size={20} />
                </span>
                <span className="insta-action-btn" aria-hidden="true">
                  <Send size={19} />
                </span>
              </div>
              <button
                type="button"
                className={`insta-action-btn ${isSaved ? 'saved' : ''}`}
                onClick={() => setIsSaved(!isSaved)}
                aria-label="Salvar publicação"
                aria-pressed={isSaved}
              >
                <Bookmark size={20} fill={isSaved ? '#818cf8' : 'none'} color={isSaved ? '#818cf8' : 'currentColor'} />
              </button>
            </div>

            {/* Simulação de curtidas e legenda no feed */}
            <div className="instagram-likes-row">
              <span>Curtido por <strong>você</strong> e <strong>outras pessoas</strong></span>
            </div>

            <div className="instagram-caption-box">
              <p className="instagram-caption-text">
                <strong className="instagram-caption-author">{post.marca_nome || 'minha_marca'}</strong>{' '}
                <span>{post.legenda ? post.legenda.slice(0, 110) + (post.legenda.length > 110 ? '...' : '') : ''}</span>
              </p>
              {post.hashtags && (
                <p className="instagram-hashtags">{post.hashtags}</p>
              )}
            </div>
          </div>

          {/* Painel Lateral com Informações e Ações */}
          <div className="preview-side-panel">
            {post.aviso_geracao && <div className="preview-generation-warning" role="status">{post.aviso_geracao}</div>}
            <div className="side-panel-header">
              <div className="side-panel-title-wrap">
                <span className="side-panel-icon">
                  <Sparkles size={16} />
                </span>
                <h3>Legenda e hashtags</h3>
              </div>
              <p>Confira o texto antes de compartilhar sua publicação.</p>
            </div>

            <div className="caption-text-area">
              <div className="caption-body">
                {post.legenda || 'Nenhuma legenda gerada para este post.'}
              </div>
              {post.hashtags && (
                <div className="caption-hashtags-box">
                  <span className="hashtags-label">Hashtags recomendadas:</span>
                  <p className="hashtags-content">{post.hashtags}</p>
                </div>
              )}
            </div>

            <div className="side-panel-actions">
              <button
                type="button"
                className="btn-copy-caption"
                onClick={handleCopyCaption}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    <span>Legenda e Hashtags Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copiar Legenda e Hashtags</span>
                  </>
                )}
              </button>
              {copyError && <p className="preview-copy-error" role="alert">Não foi possível copiar. Selecione o texto e copie manualmente.</p>}

              {canEdit && (
                <button
                  type="button"
                  className="btn-edit-post"
                  onClick={() => {
                    onClose();
                    onEdit(post);
                  }}
                >
                  <Edit3 size={18} />
                  <span>Editar Post e Slides</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
