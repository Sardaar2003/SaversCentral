import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FiSearch, FiDownload, FiChevronLeft, FiChevronRight, FiCalendar, FiSmartphone, FiLayers, FiFileText, FiShoppingCart } from 'react-icons/fi';

const OrderHistory = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [phone, setPhone] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Expanded card logs
  const [expandedLog, setExpandedLog] = useState(null);

  // Fetch unique projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await API.get('/projects');
        if (response.data.success) {
          setProjects(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching filter projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch products when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setProducts([]);
      setSelectedProductId('');
      return;
    }
    const fetchProducts = async () => {
      try {
        const response = await API.get(`/products?projectId=${selectedProjectId}`);
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching products for project:', err);
      }
    };
    fetchProducts();
  }, [selectedProjectId]);

  // Fetch orders with pagination & filters
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        projectId: selectedProjectId,
        productId: selectedProductId,
        startDate,
        endDate,
        phone,
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await API.get('/orders', { params });
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotalPages(response.data.data.pagination.pages);
        setTotalOrders(response.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      addToast('error', 'Error', 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedProjectId, selectedProductId, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        projectId: selectedProjectId,
        productId: selectedProductId,
        startDate,
        endDate,
        phone,
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await API.get('/orders/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      addToast('success', 'Export Successful', 'CSV file has been generated and downloaded.');
    } catch (err) {
      console.error('CSV export failed:', err);
      addToast('error', 'Export Failed', 'Unable to compile CSV report.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">
            {user.role === 'admin' 
              ? 'Global audit history for all agents and orders' 
              : user.role === 'manager' 
              ? 'Order records for your assigned team members' 
              : 'Your submitted sales submissions logs'}
          </p>
        </div>
        
        {(user.role === 'admin' || user.role === 'manager') && (
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            disabled={orders.length === 0}
          >
            <FiDownload /> Export CSV
          </button>
        )}
      </div>

      {/* Filter panel */}
      <form onSubmit={handleSearchSubmit} className="glass-panel" style={filterPanelStyle}>
        <div className="history-filter-grid">
          {/* Project filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={filterLabelStyle}><FiLayers /> Project</label>
            <select
              className="form-input"
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setPage(1); }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Product filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={filterLabelStyle}><FiShoppingCart /> Product</label>
            <select
              className="form-input"
              value={selectedProductId}
              onChange={(e) => { setSelectedProductId(e.target.value); setPage(1); }}
              disabled={!selectedProjectId}
            >
              <option value="">{selectedProjectId ? 'All Products' : 'Select Project First'}</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date range start */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={filterLabelStyle}><FiCalendar /> Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
          </div>

          {/* Date range end */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={filterLabelStyle}><FiCalendar /> End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>

          {/* Customer Phone Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={filterLabelStyle}><FiSmartphone /> Customer Phone</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="10 digit number"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <FiSearch />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Orders list */}
      {loading ? (
        <div style={spinnerContainerStyle}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={emptyStateStyle}>
          <p>No orders found matching the filter parameters.</p>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {orders.map((order) => (
              <div key={order._id} className="glass-panel" style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <h4 style={cardProjectTitleStyle}>{order.productName}</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {order.projectName}
                    </span>
                  </div>
                  <span className={`badge ${order.status === 'Approved' ? 'badge-success' : 'badge-error'}`}>
                    {order.status}
                  </span>
                </div>

                <div style={cardInfoRowStyle}>
                  <span style={cardLabelStyle}>Order ID:</span>
                  <code style={cardCodeStyle}>{order.orderId}</code>
                </div>

                <div style={cardInfoRowStyle}>
                  <span style={cardLabelStyle}>Customer:</span>
                  <span style={cardValueStyle}>{order.customerName}</span>
                </div>

                <div style={cardInfoRowStyle}>
                  <span style={cardLabelStyle}>Email:</span>
                  <span style={{ ...cardValueStyle, fontSize: '0.85rem' }}>{order.customerEmail}</span>
                </div>

                <div style={cardInfoRowStyle}>
                  <span style={cardLabelStyle}>Phone:</span>
                  <span style={cardValueStyle}>{order.customerPhone}</span>
                </div>

                <div style={cardInfoRowStyle}>
                  <span style={cardLabelStyle}>Amount:</span>
                  <span style={{ ...cardValueStyle, fontWeight: 700, color: 'var(--color-success)' }}>
                    ${Number(order.amount || 0).toFixed(2)}
                  </span>
                </div>

                <div style={cardFooterStyle}>
                  <div style={submitterStyle}>
                    <span style={submittedByTextStyle}>Submitted by:</span>
                    <span style={submittedByNameStyle}>{order.submittedBy?.name || 'Deleted Agent'}</span>
                    <span style={submittedTimeStyle}>{new Date(order.dateCreated).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => setExpandedLog(order)}
                    style={logButtonStyle}
                  >
                    <FiFileText /> View API Logs
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div style={paginationContainerStyle}>
            <span style={paginationSummaryStyle}>
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalOrders)} of {totalOrders} submissions
            </span>
            <div style={paginationControlsStyle}>
              <button
                className="btn btn-secondary"
                style={paginationBtnStyle}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <FiChevronLeft /> Prev
              </button>
              
              {Array.from({ length: (typeof totalPages === 'number' && !isNaN(totalPages)) ? totalPages : 1 }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                  style={paginationNumBtnStyle}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="btn btn-secondary"
                style={paginationBtnStyle}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal API logs viewer */}
      {expandedLog && (
        <div style={modalOverlayStyle}>
          <div className="glass-panel" style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.25rem' }}>API Audit Logs - Order {expandedLog.orderId}</h3>
              <button onClick={() => setExpandedLog(null)} style={modalCloseBtnStyle}>&times;</button>
            </div>

            <div style={modalBodyStyle}>
              <div style={logGroupStyle}>
                <h4 style={logSectionTitleStyle}>Sublytics Submission Payload</h4>
                <pre style={jsonCodeStyle}>
                  {JSON.stringify(expandedLog.apiPayload, null, 2)}
                </pre>
              </div>

              <div style={logGroupStyle}>
                <h4 style={logSectionTitleStyle}>Sublytics Response Payload</h4>
                <pre style={jsonCodeStyle}>
                  {JSON.stringify(expandedLog.apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const filterPanelStyle = {
  padding: '1.5rem',
  marginBottom: '2rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
};

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1rem',
};

const filterLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.8rem',
};

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '5rem 0',
};

const emptyStateStyle = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  backgroundColor: 'rgba(15, 23, 42, 0.2)',
};

const cardStyle = {
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.75rem',
};

const cardProjectTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const cardInfoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.88rem',
  marginBottom: '0.5rem',
};

const cardLabelStyle = {
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const cardValueStyle = {
  color: 'var(--text-primary)',
  fontWeight: 600,
};

const cardCodeStyle = {
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  color: 'var(--color-accent)',
  fontWeight: 600,
};

const cardFooterStyle = {
  marginTop: '1.25rem',
  paddingTop: '1rem',
  borderTop: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  flexGrow: 1,
  justifyContent: 'flex-end',
};

const submitterStyle = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.3,
};

const submittedByTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const submittedByNameStyle = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const submittedTimeStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '0.1rem',
};

const logButtonStyle = {
  background: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: '8px',
  color: 'var(--color-primary)',
  padding: '0.5rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '2rem',
  marginBottom: '3rem',
};

const paginationSummaryStyle = {
  fontSize: '0.88rem',
  color: 'var(--text-secondary)',
};

const paginationControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const paginationBtnStyle = {
  padding: '0.5rem 1rem',
  fontSize: '0.88rem',
};

const paginationNumBtnStyle = {
  minWidth: '36px',
  padding: '0.5rem 0',
  textAlign: 'center',
  fontSize: '0.88rem',
};

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
};

const modalContentStyle = {
  maxWidth: '900px',
  width: '100%',
  maxHeight: '90vh',
  backgroundColor: 'var(--bg-secondary)',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), var(--shadow-glow)',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  overflow: 'hidden',
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color)',
};

const modalCloseBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: '1.8rem',
  cursor: 'pointer',
  lineHeight: 0,
  outline: 'none',
};

const modalBodyStyle = {
  padding: '1.5rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const logGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const logSectionTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  letterSpacing: '0.05em',
};

const jsonCodeStyle = {
  margin: 0,
  padding: '1rem',
  backgroundColor: 'rgba(0,0,0,0.4)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  overflowX: 'auto',
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  color: '#a5b4fc',
  lineHeight: 1.4,
  maxHeight: '280px',
};

export default OrderHistory;
