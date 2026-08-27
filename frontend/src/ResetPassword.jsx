import { useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Token inválido ou ausente.');
      return;
    }

    try {
      const response = await axios.post('/api/reset-password', { token, novaSenha });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <h2>Definir Nova Senha</h2>

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#10b981', marginBottom: '20px' }}>{message}</p>
            <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Ir para o Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
            <button type="submit">Atualizar Senha</button>
          </form>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}

