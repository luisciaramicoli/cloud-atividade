import React, { useState } from 'react';
import api from '../services/api';

export default function PostCreateModal({ onClose, onSuccess, brands = [] }) {
  const [tema, setTema] = useState('');
  const [nicho, setNicho] = useState('Nutrição & Saúde');
  const [formato, setFormato] = useState('carrossel');
  const [tomVoz, setTomVoz] = useState('educativo');
  const [marcaId, setMarcaId] = useState(brands[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      onSuccess(response.data.post);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar post com IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-create" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>✨ Criar Novo Post com Inteligência Artificial</h2>
            <p className="modal-subtitle">Gere roteiro, carrossel de slides, legenda persuasiva e hashtags em segundos.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tema ou Dúvida que deseja abordar *</label>
            <input
              type="text"
              placeholder="Ex.: 3 mitos sobre carboidratos à noite que te enganaram"
              value={tema}
              onChange={e => setTema(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nicho de Atuação</label>
              <select value={nicho} onChange={e => setNicho(e.target.value)}>
                <option value="Nutrição & Saúde">🥗 Nutrição & Saúde</option>
                <option value="Direito & Advocacia">⚖️ Direito & Advocacia</option>
                <option value="Fitness & Personal">🏋️ Fitness & Personal</option>
                <option value="Psicologia & Terapia">🧠 Psicologia & Terapia</option>
                <option value="Odontologia">🦷 Odontologia</option>
                <option value="Pequenos Negócios & Varejo">🛍️ Negócios Locais</option>
              </select>
            </div>

            <div className="form-group">
              <label>Formato do Post</label>
              <select value={formato} onChange={e => setFormato(e.target.value)}>
                <option value="carrossel">Carrossel (Mais engajamento)</option>
                <option value="feed_retrato">Feed Retrato (4:5 - Mais alcance)</option>
                <option value="feed_quadrado">Feed Quadrado (1:1)</option>
                <option value="stories">Stories (9:16)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tom de Voz</label>
              <select value={tomVoz} onChange={e => setTomVoz(e.target.value)}>
                <option value="educativo">Educativo e Didático</option>
                <option value="persuasivo">Persuasivo e Vendas</option>
                <option value="inspirador">Inspirador e Histórico</option>
                <option value="descontraido">Descontraído e Direto</option>
              </select>
            </div>

            <div className="form-group">
              <label>Marca / Perfil Associado</label>
              <select value={marcaId} onChange={e => setMarcaId(e.target.value)}>
                <option value="">Sem marca específica</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.nome} ({b.nicho})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Processando com IA...' : '✨ Gerar Carrossel com IA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

