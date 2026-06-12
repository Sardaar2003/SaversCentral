import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FiTrendingUp, FiCheckCircle, FiXCircle, FiDollarSign, FiPackage, FiActivity, FiUser, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalOrders: 0,
    approvedOrders: 0,
    failedOrders: 0,
    totalSales: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get('/orders/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        addToast('error', 'Error', 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [addToast]);

  const statsCards = [
    {
      title: 'Total Sales Revenue',
      value: `$${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FiDollarSign style={{ color: 'var(--color-success)' }} />,
      desc: user.role === 'admin' ? 'Total company sales' : user.role === 'manager' ? 'Total team sales volume' : 'Your total sales volume',
      color: 'var(--color-success)'
    },
    {
      title: 'Processed Orders',
      value: stats.totalOrders,
      icon: <FiPackage style={{ color: 'var(--color-primary)' }} />,
      desc: 'Total submitted transactions',
      color: 'var(--color-primary)'
    },
    {
      title: 'Approved Sales',
      value: stats.approvedOrders,
      icon: <FiCheckCircle style={{ color: 'var(--color-info)' }} />,
      desc: 'Successful payments approved',
      color: 'var(--color-info)'
    },
    {
      title: 'Declined / Failed',
      value: stats.failedOrders,
      icon: <FiXCircle style={{ color: 'var(--color-error)' }} />,
      desc: 'Declined or gateway timeouts',
      color: 'var(--color-error)'
    },
    {
      title: 'Success Rate',
      value: `${stats.approvalRate}%`,
      icon: <FiActivity style={{ color: 'var(--color-accent)' }} />,
      desc: 'Percentage of approved orders',
      color: 'var(--color-accent)'
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time statistics & analytics control panel</p>
        </div>
      </div>

      {/* User Welcome Banner */}
      <div className="glass-panel" style={welcomeBannerStyle}>
        <div style={welcomeLeftStyle}>
          <div style={avatarStyle}>
            <FiUser style={{ fontSize: '2rem', color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Welcome back, {user.name}!</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                <FiShield style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                {user.role}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {user.role === 'admin' 
                  ? 'System Administrator - Full Access' 
                  : user.role === 'manager' 
                    ? 'Squad Team Leader - Monitoring' 
                    : 'Sales Agent - Portal Access'}
              </span>
            </div>
          </div>
        </div>

        <div style={quickActionsStyle}>
          {user.role !== 'manager' && (
            <Link to="/submit" className="btn btn-primary">
              Submit New Sale
            </Link>
          )}
          <Link to="/history" className="btn btn-secondary">
            {user.role === 'user' ? 'View My Sales' : 'View Order History'}
          </Link>
        </div>
      </div>

      {/* Statistics Loading State */}
      {loading ? (
        <div style={{ padding: '5rem 0', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      ) : (
        /* Statistics Cards Grid */
        <div style={statsGridStyle}>
          {statsCards.map((card, idx) => (
            <div key={idx} className="glass-panel stats-card" style={statsCardStyle(card.color)}>
              <div style={cardHeaderStyle}>
                <span style={cardTitleStyle}>{card.title}</span>
                <div style={iconContainerStyle}>{card.icon}</div>
              </div>
              <h2 style={cardValueStyle}>{card.value}</h2>
              <p style={cardDescStyle}>{card.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const welcomeBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2rem',
  marginBottom: '2.5rem',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
  flexWrap: 'wrap',
  gap: '1.5rem',
};

const welcomeLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
};

const avatarStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '16px',
  backgroundColor: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)',
};

const quickActionsStyle = {
  display: 'flex',
  gap: '1rem',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem',
};

const statsCardStyle = (color) => ({
  padding: '1.75rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'var(--transition-smooth)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '160px',
  borderLeft: `4px solid ${color}`,
});

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const cardTitleStyle = {
  fontSize: '0.85rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-secondary)',
};

const iconContainerStyle = {
  padding: '0.5rem',
  borderRadius: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
};

const cardValueStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  marginBottom: '0.5rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  fontFamily: 'var(--font-display)',
};

const cardDescStyle = {
  fontSize: '0.82rem',
  color: 'var(--text-muted)',
};

export default Dashboard;
