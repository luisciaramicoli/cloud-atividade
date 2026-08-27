import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Ocorreu um erro');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <h2>Recuperar Senha</h2>
        <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px', textAlign: 'center' }}>
          Digite seu e-mail para receber um link de redefinição de senha.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Seu E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enviar Link</button>
        </form>

        {message && <p style={{ color: '#10b981', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>{message}</p>}
        {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>{error}</p>}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}

