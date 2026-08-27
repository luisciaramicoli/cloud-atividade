import { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import api from './services/api';
import Catalog from './pages/Catalog';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function AuthForm({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin ? { email, password } : { nome, email, password };
      const response = await api.post(endpoint, payload);

      setMessage(response.data.message || 'Sucesso!');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ocorreu um erro');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <h2>{isLogin ? 'Login' : 'Registrar'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
        </form>
        {message && <p style={{ color: message.includes('Sucesso') ? '#10b981' : '#ef4444', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>{message}</p>}

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <Link to="/forgot-password" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Esqueci minha senha</Link>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage('');
          }}
        >
          {isLogin ? 'Criar uma conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={token ? <Catalog onLogout={handleLogout} /> : <AuthForm setToken={setToken} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
