import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Palette,
  Eye,
  Star,
  Layers,
  User,
  LogOut,
  FileText,
  Info,
  Lock,
  FileQuestion,
  Plus
} from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import PostPreviewModal from '../components/PostPreviewModal';
import PostCreateModal from '../components/PostCreateModal';
import PostEditModal from '../components/PostEditModal';
import BrandModal from '../components/BrandModal';

export default function Dashboard({ currentUser, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedNiche, setSelectedNiche] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modais
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const navigate = useNavigate();

  const userRole = currentUser?.role || 'criador';
  const isAdmin = userRole === 'admin';
  const isCreator = userRole === 'criador';
  const isReviewer = userRole === 'revisor';
  const canEdit = isCreator || isAdmin;

  // Carrega os posts do usuário (Multi-tenant no backend)
  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts');
      setPosts(res.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  // Carrega as marcas do usuário
  const loadBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data || []);
    } catch (err) {
      console.warn('Erro ao carregar marcas:', err);
    }
  };

  useEffect(() => {
    loadPosts();
    loadBrands();
  }, []);

  const handleDeletePost = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir post');
    }
  };

  const handleOpenLogs = async () => {
    try {
      const res = await api.get('/logs');
      setAuditLogs(res.data?.events || res.data || []);
      setLogsModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Acesso negado aos logs');
    }
  };

  // Filtragem de posts
  const filteredPosts = posts.filter(p => {
    const matchesNiche = selectedNiche === 'todos' || p.nicho === selectedNiche;
    const matchesSearch = p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.legenda?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesNiche && matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      {/* Barra de Topo do Painel */}
      <header className="dashboard-header">
        <div className="dashboard-container header-row">
          <div className="brand-group">
            <div className="brand-logo-icon">
              <Sparkles size={18} />
            </div>
            <span className="brand-name">PostCraft<span className="brand-ai">AI</span></span>
          </div>

          <div className="header-user-info">
            <div className="user-pill">
              <span className="user-name">{currentUser?.nome}</span>
              <span className={`role-badge role-${userRole}`}>
                {userRole === 'admin' ? (
                  <><ShieldCheck size={12} /> Admin</>
                ) : userRole === 'revisor' ? (
                  <><Eye size={12} /> Revisor</>
                ) : (
                  <><Palette size={12} /> Criador</>
                )}
              </span>
              {currentUser?.premium && (
                <span className="pro-badge">
                  <Star size={11} className="fill-amber-300" /> Pro
                </span>
              )}
            </div>

            {isAdmin && (
              <button type="button" className="btn-header-secondary" onClick={handleOpenLogs}>
                <FileText size={14} />
                <span>Auditoria</span>
              </button>
            )}

            <button type="button" className="btn-header-secondary" onClick={() => setBrandModalOpen(true)}>
              <Layers size={14} />
              <span>Minhas Marcas</span>
            </button>

            <Link to="/profile" className="btn-header-secondary">
              <User size={14} />
              <span>Meu Perfil</span>
            </Link>

            <button type="button" className="btn-header-logout" onClick={onLogout} title="Encerrar sessão">
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Aviso de Papel (quando Revisor) */}
      {isReviewer && (
        <div className="reviewer-banner">
          <div className="dashboard-container reviewer-banner-content">
            <Info size={16} className="reviewer-banner-icon" />
            <span><strong>Modo Revisor Ativo:</strong> Seu papel permite visualizar e auditar todos os posts e carrosséis. A criação, edição e exclusão de posts estão restritas aos usuários com papel <strong>Criador</strong> (tentativas via API retornarão 403 Forbidden).</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="dashboard-container main-content">
        {/* Barra de Ações e Filtros */}
        <div className="action-toolbar">
          <div className="toolbar-left">
            <h2>Meus Posts & Carrosséis</h2>
            <p>Gerencie sua grade de publicações para o Instagram</p>
          </div>

          <div className="toolbar-right">
            {canEdit ? (
              <button type="button" className="btn-primary-glow" onClick={() => setCreateModalOpen(true)}>
                <Sparkles size={16} />
                <span>Novo Post com IA</span>
              </button>
            ) : (
              <button type="button" className="btn-primary-disabled" disabled title="Papel revisor possui permissão apenas de leitura">
                <Lock size={15} />
                <span>Criação restrita a Criadores (403)</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha de Busca e Filtro por Nicho */}
        <div className="filter-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              aria-label="Buscar posts"
              placeholder="Buscar por tema ou conteúdo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="niche-pills">
            {['todos', 'Nutrição & Saúde', 'Direito & Advocacia', 'Fitness & Personal', 'Psicologia & Terapia'].map(nicho => (
              <button
                key={nicho}
                type="button"
                aria-pressed={selectedNiche === nicho}
                className={`niche-pill ${selectedNiche === nicho ? 'active' : ''}`}
                onClick={() => setSelectedNiche(nicho)}
              >
                {nicho === 'todos' ? 'Todos os Nichos' : nicho}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert-error" role="alert">{error} <button onClick={loadPosts}>Tentar novamente</button></div>}

        {/* Grid de Posts */}
        {loading ? (
          <div className="loading-state">
            <p>Carregando seus posts...</p>
          </div>
        ) : error ? null : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <FileQuestion size={40} />
            </div>
            <h3>Nenhum post encontrado</h3>
            <p>
              {isCreator
                ? 'Clique no botão abaixo para gerar seu primeiro carrossel com Inteligência Artificial!'
                : 'Não há posts disponíveis para revisão neste momento.'}
            </p>
            {canEdit && (
              <button
                type="button"
                className="btn-primary-glow"
                style={{ marginTop: '16px' }}
                onClick={() => setCreateModalOpen(true)}
              >
                <Sparkles size={16} />
                <span>Criar Meu Primeiro Post</span>
              </button>
            )}
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                canEdit={canEdit}
                onSelect={(p) => setSelectedPost(p)}
                onEdit={setEditingPost}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Pré-visualização do Mockup Instagram */}
      {selectedPost && (
        <PostPreviewModal
          post={selectedPost}
          canEdit={canEdit}
          onClose={() => setSelectedPost(null)}
          onEdit={setEditingPost}
        />
      )}

      {editingPost && <PostEditModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={() => { setEditingPost(null); loadPosts(); }} />}

      {/* Modal de Criação de Post */}
      {createModalOpen && (
        <PostCreateModal
          brands={brands}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(newPost) => {
            setCreateModalOpen(false);
            loadPosts();
            setSelectedPost(newPost);
          }}
        />
      )}

      {/* Modal de Gestão de Marcas */}
      {brandModalOpen && (
        <BrandModal
          brands={brands}
          onClose={() => setBrandModalOpen(false)}
          onBrandCreated={() => {
            loadBrands();
            loadPosts();
          }}
        />
      )}

      {/* Modal de Visualização de Logs de Auditoria do Redis (Exclusivo Admin) */}
      {logsModalOpen && (
        <div className="modal-backdrop" onClick={() => setLogsModalOpen(false)}>
          <div className="modal-container modal-logs" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Trilha de Auditoria em Tempo Real (Redis Streams)</h2>
                <p className="modal-subtitle">Eventos de negócio capturados com conformidade NIST SP 800-92 e CloudEvents v1.0</p>
              </div>
              <button className="modal-close-btn" onClick={() => setLogsModalOpen(false)}>&times;</button>
            </div>

            <div className="logs-table-wrap">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Ação</th>
                    <th>Tipo</th>
                    <th>Ator (ID/Papel)</th>
                    <th>Status</th>
                    <th>Alvo / Metadados</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum evento recente registrado.</td></tr>
                  ) : (
                    auditLogs.map((ev, i) => (
                      <tr key={ev.id || i} className={ev.status === 'denied' ? 'log-row-denied' : ''}>
                        <td>{new Date(ev.time || Date.now()).toLocaleTimeString()}</td>
                        <td><code>{ev.action}</code></td>
                        <td>{ev.type}</td>
                        <td>{ev.actor?.role} (#{ev.actor?.id || 'anon'})</td>
                        <td>
                          <span className={`status-pill ${ev.status === 'denied' ? 'pill-denied' : 'pill-success'}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td><small>{JSON.stringify(ev.target || ev.metadata || {})}</small></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setLogsModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
