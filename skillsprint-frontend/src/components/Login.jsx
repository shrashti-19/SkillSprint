import React, { useState } from 'react';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';
import api from '../config/api';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      // Backend expects: register = {name, email, password}, login = {email, password}
      const payload = isRegister 
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      console.log('Sending to:', endpoint);
      console.log('Payload:', payload);
      
      const response = await api.post(endpoint, payload);
      console.log('Success response:', response.data);

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Call parent handler
      onLogin(response.data);
      
    } catch (err) {
      console.error('Auth error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            SkillSprint
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            {isRegister ? 'Create your account' : 'Welcome back!'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#dc2626'
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name field (only for registration) */}
          {isRegister && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                position: 'relative',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <User size={20} style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '1rem',
                    flex: 1,
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
          )}

          {/* Email field (always shown) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              position: 'relative',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Mail size={20} style={{ color: '#9ca3af' }} />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  flex: 1,
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              position: 'relative',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Lock size={20} style={{ color: '#9ca3af' }} />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  flex: 1,
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontWeight: '600',
              marginLeft: '8px',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;