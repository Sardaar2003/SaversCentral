import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(username.trim().toLowerCase(), password);

    if (result.success) {
      addToast('success', 'Welcome Back', 'Logged in successfully.');
      navigate('/');
    } else {
      setError(result.message);
      addToast('error', 'Login Failed', result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      <div className="glass-panel" style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>SaversCentral</h1>
          <p style={subtitleStyle}>Sign in to your sales portal account</p>
        </div>

        {error && (
          <div style={errorContainerStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={inputWrapperStyle}>
              <FiMail style={iconStyle} />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="enter username"
                style={inputPaddingStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={inputWrapperStyle}>
              <FiLock style={iconStyle} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                style={inputPaddingStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div style={forgotStyle}>
            <Link to="/forgot-password" style={linkStyle}>Forgot Password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <>
                <FiLogIn /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          Don't have an account?{' '}
          <Link to="/register" style={linkStyle}>
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

// Styles
const wrapperStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100vw',
  position: 'fixed',
  top: 0,
  left: 0,
  backgroundColor: 'var(--bg-primary)',
  zIndex: 1000,
  padding: '1.5rem',
};

const cardStyle = {
  maxWidth: '440px',
  width: '100%',
  padding: '2.5rem',
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), var(--shadow-glow)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const titleStyle = {
  fontSize: '2.4rem',
  fontWeight: 800,
  fontFamily: 'var(--font-display)',
  background: 'linear-gradient(135deg, #fff 0%, var(--color-primary) 50%, var(--color-accent) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '0.25rem',
};

const subtitleStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
};

const errorContainerStyle = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: 'var(--color-error)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontSize: '0.88rem',
  marginBottom: '1.25rem',
  textAlign: 'center',
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle = {
  position: 'absolute',
  left: '0.9rem',
  color: 'var(--text-muted)',
  fontSize: '1rem',
  pointerEvents: 'none',
};

const inputPaddingStyle = {
  paddingLeft: '2.4rem',
};

const forgotStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '1.25rem',
};

const footerStyle = {
  marginTop: '2rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
};

const linkStyle = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s',
  outline: 'none',
};

export default Login;
