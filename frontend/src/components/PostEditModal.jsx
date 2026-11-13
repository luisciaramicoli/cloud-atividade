import { useState } from 'react';
import api from '../services/api';

export default function PostEditModal({ post, onClose, onSaved }) {
  const [draft, setDraft] = useState({ titulo: post.titulo || '', legenda: post.legenda || '', hashtags: post.hashtags || '', slides: Array.isArray(post.slides) ? post.slides : [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const field = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/posts/${post.id}`, draft);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível salvar. Tente novamente.');
    } finally { setSaving(false); }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-edit" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <div className="modal-header"><h2 id="edit-title">Editar publicação</h2><button type="button" className="modal-close-btn" aria-label="Fechar" disabled={saving} onClick={onClose}>×</button></div>
        {error && <p className="alert-error" role="alert">{error}</p>}
        <form onSubmit={save}>
          {['titulo', 'legenda', 'hashtags'].map((key, index) => <label key={key}>{['Título', 'Legenda', 'Hashtags'][index]}<textarea required={key === 'titulo'} maxLength={[255, 5000, 500][index]} value={draft[key]} onChange={e => field(key, e.target.value)} /></label>)}
          {draft.slides.map((slide, index) => <fieldset key={index}><legend>Slide {index + 1}</legend>{['titulo', 'subtitulo'].map(key => <label key={key}>{key === 'titulo' ? 'Título' : 'Texto'}<textarea value={slide[key] || ''} onChange={e => field('slides', draft.slides.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} /></label>)}</fieldset>)}
          <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
        </form>
      </div>
    </div>
  );
}
