import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './services/api';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
      console.error('Erro no logout:', e);
    }
    setCurrentUser(null);
    navigate('/');
  };

  const handleLoginSuccess = (userData) => {
    // Pode vir como userData.user ou direto userData
    const user = userData.user || userData;
    setCurrentUser(user);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
          <p>Carregando PostCraft AI...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Dashboard currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <LandingPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        path="/profile"
        element={
          currentUser ? (
            <Profile currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <LandingPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
