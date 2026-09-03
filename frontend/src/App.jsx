import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import api from './services/api';
import Catalog from './pages/Catalog';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function AuthForm({ onLoginSuccess }) {
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

      // Se for login, o backend já definiu o cookie HttpOnly e retornou o perfil
      if (isLogin && response.data.user) {
        onLoginSuccess(response.data.user);
      } else if (!isLogin) {
        setIsLogin(true);
        setPassword('');
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
        {message && <p style={{ color: message.includes('Sucesso') || message.includes('criado') ? '#10b981' : '#ef4444', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>{message}</p>}

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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Validar sessão no backend ao carregar a aplicação (via cookie HttpOnly)
  useEffect(() => {
    api.get('/me')
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    navigate('/');
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
        Carregando...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Catalog onLogout={handleLogout} currentUser={currentUser} />
          ) : (
            <AuthForm onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
