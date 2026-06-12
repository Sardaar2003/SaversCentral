import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div className="spinner"></div>
      </div>
    );
  }

  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: 'var(--bg-primary)',
};

export default AdminRoute;
