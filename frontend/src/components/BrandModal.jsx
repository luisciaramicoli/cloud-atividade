import React, { useState } from 'react';
import api from '../services/api';

export default function BrandModal({ onClose, brands = [], onBrandCreated }) {
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('Nutrição & Saúde');
  const [paletaCores, setPaletaCores] = useState('#6366f1,#8b5cf6,#ec4899');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/brands', {
        nome,
        nicho,
        paleta_cores: paletaCores
      });
      setMessage('Marca criada com sucesso!');
      setNome('');
      onBrandCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar marca');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!selectedBrandId || !file) {
      setError('Selecione uma marca e um arquivo de imagem.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', file); // Usa o campo de upload processado pelo multer

      await api.post(`/brands/${selectedBrandId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Logotipo salvo com sucesso no MinIO!');
      setFile(null);
      onBrandCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro no upload de logo para o MinIO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-brand" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🏢 Gestão de Marcas & MinIO Asset Storage</h2>
            <p className="modal-subtitle">Cadastre sua identidade visual e envie sua logo para o Object Storage.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && <div className="alert-success">{message}</div>}
        {error && <div className="alert-error">{error}</div>}

        <div className="brand-modal-content">
          {/* Seção 1: Criar Nova Marca */}
          <div className="brand-section">
            <h3>1. Cadastrar Perfil de Marca</h3>
            <form onSubmit={handleCreateBrand} className="modal-form">
              <div className="form-group">
                <label>Nome do Consultório / Marca</label>
                <input
                  type="text"
                  placeholder="Ex.: Clínica Rocha Nutrição"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nicho</label>
                  <select value={nicho} onChange={e => setNicho(e.target.value)}>
                    <option value="Nutrição & Saúde">Nutrição & Saúde</option>
                    <option value="Direito & Advocacia">Direito & Advocacia</option>
                    <option value="Fitness & Personal">Fitness & Personal</option>
                    <option value="Psicologia & Terapia">Psicologia & Terapia</option>
                    <option value="Odontologia">Odontologia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Paleta de Cores (Hex separados por vírgula)</label>
                  <input
                    type="text"
                    value={paletaCores}
                    onChange={e => setPaletaCores(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                Cadastrar Marca
              </button>
            </form>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #374151', margin: '20px 0' }} />

          {/* Seção 2: Upload de Logotipo no MinIO */}
          <div className="brand-section">
            <h3>2. Upload de Logotipo no MinIO</h3>
            <form onSubmit={handleUploadLogo} className="modal-form">
              <div className="form-group">
                <label>Selecione a Marca para o Upload</label>
                <select value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)} required>
                  <option value="">Selecione uma marca cadastrada</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} ({b.nicho})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Arquivo de Imagem da Logo (PNG transparente / JPEG)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={e => setFile(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" className="btn-secondary" disabled={loading || !selectedBrandId || !file}>
                Enviar Logo para o MinIO
              </button>
            </form>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

