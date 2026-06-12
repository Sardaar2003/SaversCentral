import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FiShoppingCart, FiList, FiUsers, FiSettings, FiLogOut, FiUser, FiActivity } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={navStyle} className="glass-panel">
      <div style={containerStyle}>
        {/* Brand */}
        <Link to="/" style={brandStyle}>
          <span style={brandGlowStyle}>SaversCentral</span>
          <span style={brandPortalStyle}>Portal</span>
        </Link>

        {/* Links */}
        <div style={linksStyle}>
          <Link
            to="/"
            style={{
              ...linkStyle,
              ...(isActive('/') ? activeLinkStyle : {}),
            }}
          >
            <FiActivity /> Dashboard
          </Link>
          {user.role !== 'manager' && (
            <Link
              to="/submit"
              style={{
                ...linkStyle,
                ...(isActive('/submit') ? activeLinkStyle : {}),
              }}
            >
              <FiShoppingCart /> Submit Order
            </Link>
          )}
          <Link
            to="/history"
            style={{
              ...linkStyle,
              ...(isActive('/history') ? activeLinkStyle : {}),
            }}
          >
            <FiList /> Order History
          </Link>
          {user.role === 'admin' && (
            <>
              <Link
                to="/users"
                style={{
                  ...linkStyle,
                  ...(isActive('/users') ? activeLinkStyle : {}),
                }}
              >
                <FiUsers /> User Access
              </Link>
              <Link
                to="/admin"
                style={{
                  ...linkStyle,
                  ...(isActive('/admin') ? activeLinkStyle : {}),
                }}
              >
                <FiSettings /> Admin Dashboard
              </Link>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div style={userControlStyle}>
          <div style={userInfoStyle}>
            <FiUser style={{ color: 'var(--color-primary)' }} />
            <div style={userDetailsStyle}>
              <span style={nameStyle}>{user.name}</span>
              <span style={roleBadgeStyle(user.role)}>{user.role}</span>
            </div>
          </div>
          <button onClick={logout} style={logoutButtonStyle} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

// Styles
const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  borderRadius: 0,
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  backgroundColor: 'rgba(8, 12, 20, 0.85)',
  backdropFilter: 'blur(16px)',
  borderBottom: '1px solid var(--border-color)',
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1400px',
  width: '100%',
  margin: '0 auto',
  padding: '0.85rem 1.5rem',
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',
  fontSize: '1.4rem',
  fontWeight: 800,
};

const brandGlowStyle = {
  background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const brandPortalStyle = {
  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const linksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
};

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  textDecoration: 'none',
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
  fontWeight: 500,
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  transition: 'var(--transition-fast)',
};

const activeLinkStyle = {
  color: 'var(--text-primary)',
  backgroundColor: 'rgba(99, 102, 241, 0.12)',
  border: '1px solid rgba(99, 102, 241, 0.25)',
};

const userControlStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  paddingRight: '1rem',
  borderRight: '1px solid var(--border-color)',
};

const userDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const nameStyle = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const roleBadgeStyle = (role) => {
  const isAlt = role === 'admin' || role === 'manager';
  return {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: role === 'admin' ? 'var(--color-accent)' : role === 'manager' ? 'var(--color-info)' : 'var(--text-muted)',
    marginTop: '-0.1rem',
  };
};

const logoutButtonStyle = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  color: 'var(--color-error)',
  cursor: 'pointer',
  padding: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

export default Navbar;
