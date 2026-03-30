import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('IDLE');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('AUTHENTICATING');
    
    setTimeout(async () => {
      try {
        const response = await api.post('/auth/login', { username, password });
        setStatus('SUCCESS');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err) {
        setStatus('IDLE');
        setError(err.response?.data?.message || 'AUTHORIZATION FAILED');
      }
    }, 1500);
  };

  return (
    <div className="app-container items-center justify-center min-h-screen">
      <div className="glass-panel animate-flicker" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="flex flex-col items-center mb-8">
          <Fingerprint size={64} color="var(--primary-color)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--primary-color))' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '4px' }}>CYBER_CORE</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>RESTRICTED TERMINAL ACCESS</p>
        </div>

        {error && (
          <div style={{ border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', background: 'rgba(255, 0, 60, 0.1)' }}>
            <ShieldAlert size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> 
            {error}
          </div>
        )}

        {status === 'AUTHENTICATING' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} className="cursor-blink">DECRYPTING_PAYLOAD</div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--primary-color)', width: '100%', animation: 'slideIn 1.5s ease-out' }}></div>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div style={{ color: 'var(--success-color)' }} className="cursor-blink">ACCESS_GRANTED</div>
          </div>
        )}

        {status === 'IDLE' && (
          <form onSubmit={handleLogin} className="animate-slide-in">
            <div className="form-group">
              <label className="form-label">IDENTIFIER</label>
              <input 
                type="text" 
                className="form-control" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="root"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">PASSPHRASE</label>
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
              [ INITIATE_HANDSHAKE ]
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
