import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, orderId = null, duration = 6000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message, orderId }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastIcons = {
    success: <FiCheckCircle style={{ color: 'var(--color-success)', fontSize: '1.5rem', flexShrink: 0 }} />,
    error: <FiXCircle style={{ color: 'var(--color-error)', fontSize: '1.5rem', flexShrink: 0 }} />,
    info: <FiInfo style={{ color: 'var(--color-info)', fontSize: '1.5rem', flexShrink: 0 }} />,
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div style={containerStyle}>
        {toasts.map((t) => (
          <div key={t.id} className="glass-panel" style={{ ...toastCardStyle, borderLeft: `4px solid var(--color-${t.type})` }}>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              {toastIcons[t.type]}
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{t.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.message}</p>
                {t.orderId && (
                  <div style={orderIdContainerStyle}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Order ID:</span>
                    <code style={orderIdCodeStyle}>{t.orderId}</code>
                  </div>
                )}
              </div>
              <button onClick={() => removeToast(t.id)} style={dismissButtonStyle}>
                <FiX />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Inline premium styles to avoid external CSS requirements
const containerStyle = {
  position: 'fixed',
  top: '1.5rem',
  right: '1.5rem',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  maxWidth: '420px',
  width: 'calc(100% - 3rem)',
  pointerEvents: 'none',
};

const toastCardStyle = {
  padding: '1.25rem',
  display: 'flex',
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), var(--shadow-glow)',
  pointerEvents: 'auto',
  animation: 'toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const orderIdContainerStyle = {
  marginTop: '0.5rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.08)',
};

const orderIdCodeStyle = {
  fontFamily: 'monospace',
  fontSize: '0.8rem',
  color: 'var(--color-accent)',
  fontWeight: 700,
};

const dismissButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '2px',
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  transition: 'color 0.2s',
  outline: 'none',
};

// Add raw keyframes animation in head dynamically
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes toastSlideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleEl);
}
