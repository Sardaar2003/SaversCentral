import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FiUser, FiMail, FiLock, FiRefreshCw } from 'react-icons/fi';

const ForgotPassword = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !username || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await forgotPassword(
      username.trim().toLowerCase(),
      name.trim(),
      newPassword
    );

    if (result.success) {
      addToast('success', 'Password Reset Successful', 'You can now log in with your new password.');
      navigate('/login');
    } else {
      setError(result.message);
      addToast('error', 'Reset Failed', result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="glass-panel" style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Reset Password</h1>
          <p style={subtitleStyle}>Verify your details to update your password</p>
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
                placeholder="registered username"
                style={inputPaddingStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={inputWrapperStyle}>
              <FiUser style={iconStyle} />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="registered full name"
                style={inputPaddingStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <div style={inputWrapperStyle}>
              <FiLock style={iconStyle} />
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                style={inputPaddingStyle}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div style={inputWrapperStyle}>
              <FiLock style={iconStyle} />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                style={inputPaddingStyle}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            ) : (
              <>
                <FiRefreshCw /> Reset Password
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          Remembered your password?{' '}
          <Link to="/login" style={linkStyle}>
            Sign In
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
  fontSize: '2.2rem',
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

export default ForgotPassword;
