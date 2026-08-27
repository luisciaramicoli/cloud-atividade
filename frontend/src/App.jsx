import { useState, useEffect } from 'react';
import axios from 'axios';
import Catalog from './Catalog';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const payload = isLogin ? { email, password } : { nome, email, password };
      const response = await axios.post(endpoint, payload);
      
      setMessage(response.data.message || 'Sucesso!');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ocorreu um erro');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (token) {
    return <Catalog onLogout={handleLogout} />;
  }

  return (
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
      <p style={{ color: 'red', fontSize: '14px' }}>{message}</p>
      <button 
        type="button" 
        style={{ background: 'transparent', color: '#007bff', marginTop: '10px' }} 
        onClick={() => {
          setIsLogin(!isLogin);
          setMessage('');
        }}
      >
        {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça Login'}
      </button>
    </div>
  );
}

export default App;
