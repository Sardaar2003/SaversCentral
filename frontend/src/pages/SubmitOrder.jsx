import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { formSections, getInitialFormState } from '../config/projectForms.js';
import { useToast } from '../context/ToastContext.jsx';
import { FiLayers, FiShoppingCart, FiRefreshCw, FiCheck, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

const SubmitOrder = () => {
  const { user } = useAuth();

  if (user?.role === 'manager') {
    return <Navigate to="/" replace />;
  }

  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    ...getInitialFormState(),
    productId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  // Load available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await API.get('/projects');
        if (response.data.success) {
          setProjects(response.data.data);
        }
      } catch (error) {
        console.error('Fetch projects error:', error);
        addToast('error', 'Error', 'Failed to load projects.');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [addToast]);

  // Load products when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setProducts([]);
      setSelectedProduct(null);
      setFormData(prev => ({ ...prev, productId: '' }));
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await API.get(`/products?projectId=${selectedProjectId}`);
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error('Fetch products error:', error);
        addToast('error', 'Error', 'Failed to load campaign products.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedProjectId, addToast]);

  const handleSelectProject = (projId) => {
    if (submitting) return;
    setSelectedProjectId(projId);
    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, productId: '' }));
    setErrors(prev => ({ ...prev, projectId: null, productId: null }));
  };

  const handleBack = () => {
    setSelectedProjectId('');
    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, productId: '' }));
    setErrors({});
  };

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setFormData((prev) => ({ ...prev, productId: prodId }));
    
    if (prodId) {
      const prod = products.find((p) => p._id === prodId);
      setSelectedProduct(prod);
    } else {
      setSelectedProduct(null);
    }
    setErrors(prev => ({ ...prev, productId: null }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: val }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleClear = () => {
    setFormData({
      ...getInitialFormState(),
      productId: formData.productId
    });
    setErrors({});
    addToast('info', 'Form Cleared', 'All fields have been reset.');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedProjectId) {
      newErrors.projectId = 'Please select a project';
    }
    if (!formData.productId) {
      newErrors.productId = 'Please select a product campaign';
    }

    formSections.forEach((section) => {
      section.fields.forEach((field) => {
        const val = formData[field.name];

        if (field.required && (val === undefined || val === null || val === '')) {
          newErrors[field.name] = `${field.label} is required`;
        } else if (field.validate && val) {
          const validationError = field.validate(val, formData);
          if (validationError) {
            newErrors[field.name] = validationError;
          }
        }
      });
    });

    if (!formData.shipping_same) {
      const shippingFields = [
        { name: 'ship_fname', label: 'Shipping First Name' },
        { name: 'ship_lname', label: 'Shipping Last Name' },
        { name: 'ship_address1', label: 'Shipping Address 1' },
        { name: 'ship_city', label: 'Shipping City' },
        { name: 'ship_state', label: 'Shipping State' },
        { name: 'ship_zipcode', label: 'Shipping Zip Code' },
      ];

      shippingFields.forEach((field) => {
        if (!formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('error', 'Validation Error', 'Please check highlighted fields in the form.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.post('/orders', formData);
      if (response.data.success) {
        addToast(
          'success',
          'Order Placed Successfully!',
          `Your sale for ${selectedProduct?.name} has been processed.`,
          response.data.data.orderId
        );
      }
    } catch (error) {
      console.error('Submit order error:', error);
      const errMsg = error.response?.data?.message || 'Gateway connection timed out.';
      const ordId = error.response?.data?.data?.orderId;
      addToast('error', 'Order Declined', errMsg, ordId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Order</h1>
          <p className="page-subtitle">Process new client campaigns and payments</p>
        </div>
      </div>

      <div style={containerStyle}>
        {!selectedProjectId ? (
          /* Step 1: Select Project Grid */
          <div className="glass-panel" style={cardStyle}>
            <h3 style={sectionHeaderStyle}><FiLayers /> Select Campaign Project</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Choose a project container to proceed to campaign products and sales processing.
            </p>
            {loadingProjects ? (
              <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              </div>
            ) : (
              <div style={projectGridStyle}>
                {projects.map((proj) => (
                  <div
                    key={proj._id}
                    className="glass-panel project-card-hover"
                    style={projectCardStyle(false)}
                    onClick={() => handleSelectProject(proj._id)}
                  >
                    <div style={projectCardHeaderStyle}>
                      <span style={projectCardTitleStyle}>{proj.name}</span>
                    </div>
                    <div style={projectCardKeyStyle}>Key: {proj.key}</div>
                  </div>
                ))}
              </div>
            )}
            {errors.projectId && <span className="form-error-msg" style={{ marginTop: '0.5rem' }}>{errors.projectId}</span>}
          </div>
        ) : (
          /* Step 2: Campaign Selector and Forms */
          <>
            <div className="glass-panel" style={cardStyle}>
              <div style={step2HeaderStyle}>
                <button type="button" className="btn btn-secondary" onClick={handleBack} style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                  &larr; Back to Projects
                </button>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Project:</span>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                    {projects.find(p => p._id === selectedProjectId)?.name || 'SC Project'}
                  </h4>
                </div>
              </div>

              {/* Product Select Dropdown */}
              <div className="form-group" style={{ marginBottom: 0, marginTop: '1.5rem' }}>
                <label className="form-label">Campaign Product</label>
                {loadingProducts ? (
                  <div style={{ padding: '0.5rem 0' }}><div className="spinner" style={{ width: '20px', height: '20px' }}></div></div>
                ) : (
                  <select
                    className={`form-input ${errors.productId ? 'form-input-error' : ''}`}
                    value={formData.productId}
                    onChange={handleProductChange}
                    disabled={submitting}
                  >
                    <option value="">-- Choose Product Campaign --</option>
                    {products.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.productId && <span className="form-error-msg">{errors.productId}</span>}
              </div>

              {selectedProduct && (
                <div style={projectDetailsStyle}>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Pricing (Trial):</span>
                    <span className="badge badge-success">{selectedProduct.trialPrice}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Recurring Charge:</span>
                    <span className="badge badge-info">{selectedProduct.monthlyPrice}</span>
                  </div>
                  <div style={{ ...detailRowStyle, borderBottom: 'none', paddingBottom: 0 }}>
                    <span style={detailLabelStyle}>API Identifiers:</span>
                    <code style={codeStyle}>
                      Camp ID: {selectedProduct.campaignId} | Off ID: {selectedProduct.offerId} | Conn: {selectedProduct.connectionId}
                    </code>
                  </div>
                </div>
              )}
            </div>

        {/* Dynamic Form Sections */}
        {selectedProduct && (
          <form onSubmit={handleSubmit} style={formStyle}>
            {formSections.map((section) => (
              <div key={section.id} className="glass-panel" style={cardStyle}>
                <h3 style={sectionHeaderStyle}>{section.title}</h3>
                
                <div style={fieldsGridStyle}>
                  {section.fields.map((field) => (
                    <div
                      key={field.name}
                      className="form-group"
                      style={{ gridColumn: `span ${field.gridSpan}` }}
                    >
                      <label className="form-label" htmlFor={field.name}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          className="form-input"
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          disabled={submitting}
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          className={`form-input ${errors[field.name] ? 'form-input-error' : ''}`}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          disabled={submitting}
                        />
                      )}
                      {errors[field.name] && (
                        <span className="form-error-msg">{errors[field.name]}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shipping same check */}
                {section.id === 'billing_address' && (
                  <div style={shippingToggleContainerStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        name="shipping_same"
                        checked={formData.shipping_same}
                        onChange={handleInputChange}
                        disabled={submitting}
                        style={checkboxInputStyle}
                      />
                      Shipping address is same as billing address
                    </label>
                  </div>
                )}
              </div>
            ))}

            {/* Conditional Shipping details */}
            {!formData.shipping_same && (
              <div className="glass-panel" style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Shipping Address</h3>
                <div style={fieldsGridStyle}>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_fname">First Name</label>
                    <input
                      id="ship_fname"
                      name="ship_fname"
                      type="text"
                      placeholder="Jane"
                      className={`form-input ${errors.ship_fname ? 'form-input-error' : ''}`}
                      value={formData.ship_fname}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_fname && <span className="form-error-msg">{errors.ship_fname}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_lname">Last Name</label>
                    <input
                      id="ship_lname"
                      name="ship_lname"
                      type="text"
                      placeholder="Smith"
                      className={`form-input ${errors.ship_lname ? 'form-input-error' : ''}`}
                      value={formData.ship_lname}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_lname && <span className="form-error-msg">{errors.ship_lname}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" htmlFor="ship_address1">Address Line 1</label>
                    <input
                      id="ship_address1"
                      name="ship_address1"
                      type="text"
                      placeholder="456 Oak St"
                      className={`form-input ${errors.ship_address1 ? 'form-input-error' : ''}`}
                      value={formData.ship_address1}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_address1 && <span className="form-error-msg">{errors.ship_address1}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_city">City</label>
                    <input
                      id="ship_city"
                      name="ship_city"
                      type="text"
                      placeholder="Denver"
                      className={`form-input ${errors.ship_city ? 'form-input-error' : ''}`}
                      value={formData.ship_city}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_city && <span className="form-error-msg">{errors.ship_city}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_state">State</label>
                    <input
                      id="ship_state"
                      name="ship_state"
                      type="text"
                      placeholder="CO"
                      className={`form-input ${errors.ship_state ? 'form-input-error' : ''}`}
                      value={formData.ship_state}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_state && <span className="form-error-msg">{errors.ship_state}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_zipcode">Zip Code</label>
                    <input
                      id="ship_zipcode"
                      name="ship_zipcode"
                      type="text"
                      placeholder="80201"
                      className={`form-input ${errors.ship_zipcode ? 'form-input-error' : ''}`}
                      value={formData.ship_zipcode}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    {errors.ship_zipcode && <span className="form-error-msg">{errors.ship_zipcode}</span>}
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 1' }}>
                    <label className="form-label" htmlFor="ship_country">Country</label>
                    <select
                      id="ship_country"
                      name="ship_country"
                      className="form-input"
                      value={formData.ship_country}
                      onChange={handleInputChange}
                      disabled={submitting}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Panel */}
            <div style={actionsContainerStyle}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={submitting}
                style={{ width: '160px' }}
              >
                <FiRefreshCw /> Clear Form
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '220px' }}
              >
                {submitting ? (
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                ) : (
                  <>
                    <FiCheck /> Submit Sale
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </>
    )}
  </div>
    </div>
  );
};

// Styles
const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  maxWidth: '860px',
  margin: '0 auto',
};

const cardStyle = {
  padding: '2rem',
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
};

const selectorsRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginTop: '0.5rem',
};

const sectionHeaderStyle = {
  fontSize: '1.25rem',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.75rem',
  marginBottom: '1.5rem',
  color: 'var(--text-primary)',
};

const projectDetailsStyle = {
  marginTop: '1.5rem',
  paddingTop: '1rem',
  borderTop: '1px dotted var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

const detailLabelStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const codeStyle = {
  fontSize: '0.8rem',
  color: 'var(--color-accent)',
  fontFamily: 'monospace',
  backgroundColor: 'rgba(255,255,255,0.03)',
  padding: '0.15rem 0.4rem',
  borderRadius: '4px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const fieldsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1.25rem',
};

const shippingToggleContainerStyle = {
  marginTop: '1.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid var(--border-color)',
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.92rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontWeight: 500,
};

const checkboxInputStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: 'var(--color-primary)',
};

const actionsContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  paddingTop: '0.5rem',
  marginBottom: '3rem',
};

const projectGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1.25rem',
  marginTop: '0.75rem',
  marginBottom: '1.5rem',
};

const projectCardStyle = (isActive) => ({
  padding: '1.5rem',
  borderRadius: '12px',
  cursor: 'pointer',
  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.4)',
  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isActive ? 'translateY(-2px)' : 'none',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '100px',
});

const projectCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const projectCardTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const projectCardKeyStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  marginTop: '0.25rem',
  fontFamily: 'monospace',
};

const projectActiveCheckStyle = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
};

const step2HeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1rem',
  marginBottom: '1rem',
};

export default SubmitOrder;
