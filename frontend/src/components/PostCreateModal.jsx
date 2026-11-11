import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Sliders,
  Volume2,
  Layers,
  Tag,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function PostCreateModal({ onClose, onSuccess, brands = [] }) {
  const [tema, setTema] = useState('');
  const [nicho, setNicho] = useState('Nutrição & Saúde');
  const [formato, setFormato] = useState('carrossel');
  const [tomVoz, setTomVoz] = useState('educativo');
  const [marcaId, setMarcaId] = useState(brands[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickSuggestions = [
    '3 Mitos que te enganaram',
    'Guia Passo a Passo',
    'Erros comuns que custam caro',
    'Checklist indispensável'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tema.trim()) {
      setError('Por favor, informe o tema da publicação.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/posts/generate', {
        tema,
        nicho,
        formato,
        tom_voz: tomVoz,
        marca_id: marcaId ? Number(marcaId) : null
      });

      onSuccess({ ...response.data.post, aviso_geracao: response.data.warning });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar post com IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop create-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-post-title">
      <div className="modal-container modal-create-post" onClick={e => e.stopPropagation()}>
        {/* Glow de fundo */}
        <div className="create-glow-accent" />

        <div className="modal-header-refined">
          <div className="create-header-left">
            <div className="create-badge-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="create-title" id="create-post-title">Criar publicação com IA</h2>
              <p className="create-subtitle">
                Gere slides, legenda, hashtags e um fundo para sua publicação com o Gemini.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="create-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} className="auth-alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="create-field">
            <label className="create-label" htmlFor="post-tema">
              Tema ou Ideia Central da Publicação *
            </label>
            <div className="create-input-wrapper">
              <Sparkles size={16} className="create-field-icon" />
              <input
                id="post-tema"
                type="text"
                className="create-input"
                placeholder="Ex.: 3 mitos sobre carboidratos à noite que te enganaram"
                value={tema}
                onChange={e => setTema(e.target.value)}
                required
              />
            </div>

            {/* Sugestões Rápidas de Gancho */}
            <div className="create-quick-tags">
              <span className="quick-label">Sugestões de gancho:</span>
              <div className="quick-pills">
                {quickSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-pill"
                    onClick={() => setTema(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="create-form-grid">
            <div className="create-field">
              <label className="create-label" htmlFor="post-nicho">
                <Tag size={14} className="label-icon" />
                <span>Nicho de Atuação</span>
              </label>
              <div className="create-select-wrapper">
                <select
                  id="post-nicho"
                  className="create-select"
                  value={nicho}
                  onChange={e => setNicho(e.target.value)}
                >
                  <option value="Nutrição & Saúde">Nutrição & Saúde</option>
                  <option value="Direito & Advocacia">Direito & Advocacia</option>
                  <option value="Fitness & Personal">Fitness & Personal</option>
                  <option value="Psicologia & Terapia">Psicologia & Terapia</option>
                  <option value="Odontologia">Odontologia & Clínicas</option>
                  <option value="Pequenos Negócios & Varejo">Pequenos Negócios & Varejo</option>
                </select>
              </div>
            </div>

            <div className="create-field">
              <label className="create-label" htmlFor="post-formato">
                <Layers size={14} className="label-icon" />
                <span>Formato da Publicação</span>
              </label>
              <div className="create-select-wrapper">
                <select
                  id="post-formato"
                  className="create-select"
                  value={formato}
                  onChange={e => setFormato(e.target.value)}
                >
                  <option value="carrossel">Carrossel (Maior Engajamento)</option>
                  <option value="feed_retrato">Feed Retrato 4:5 (Maior Alcance)</option>
                  <option value="feed_quadrado">Feed Quadrado 1:1</option>
                  <option value="stories">Stories 9:16</option>
                </select>
              </div>
            </div>

            <div className="create-field">
              <label className="create-label" htmlFor="post-tom">
                <Volume2 size={14} className="label-icon" />
                <span>Tom de Voz</span>
              </label>
              <div className="create-select-wrapper">
                <select
                  id="post-tom"
                  className="create-select"
                  value={tomVoz}
                  onChange={e => setTomVoz(e.target.value)}
                >
                  <option value="educativo">Educativo e Didático</option>
                  <option value="persuasivo">Persuasivo e Vendas</option>
                  <option value="inspirador">Inspirador e Histórico</option>
                  <option value="descontraido">Descontraído e Direto</option>
                </select>
              </div>
            </div>

            <div className="create-field">
              <label className="create-label" htmlFor="post-marca">
                <Sliders size={14} className="label-icon" />
                <span>Marca / Perfil Vinculado</span>
              </label>
              <div className="create-select-wrapper">
                <select
                  id="post-marca"
                  className="create-select"
                  value={marcaId}
                  onChange={e => setMarcaId(e.target.value)}
                >
                  <option value="">Sem marca específica (Padrão)</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} ({b.nicho})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="create-modal-footer">
            <button
              type="button"
              className="btn-create-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-create-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Criando conteúdo e fundo com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Gerar publicação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
