import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { FiPlus, FiToggleLeft, FiToggleRight, FiUsers, FiLayers, FiShoppingCart, FiTrash2, FiEdit2, FiX, FiInfo } from 'react-icons/fi';

const AdminDashboard = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('projects');
  
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    key: '',
    projectId: '',
    connectionId: '',
    campaignId: '',
    offerId: '',
    trialPrice: '',
    monthlyPrice: '',
    serviceName: 'sublytics'
  });
  const [showProductForm, setShowProductForm] = useState(false);

  // Team Form State
  const [teamName, setTeamName] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, prodRes, teamRes, userRes] = await Promise.all([
        API.get('/projects'),
        API.get('/products'),
        API.get('/users/teams'),
        API.get('/users')
      ]);

      if (projRes.data.success) setProjects(projRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (teamRes.data.success) setTeams(teamRes.data.data);
      if (userRes.data.success) setUsers(userRes.data.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      addToast('error', 'Error', 'Failed to retrieve administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const managers = users.filter((u) => u.role === 'manager' && u.status === 'active');
  const availableMembers = users.filter((u) => u.role === 'user' && u.status === 'active');

  // ==========================================
  // Project Toggles & Submissions
  // ==========================================
  const handleToggleProject = async (id) => {
    try {
      const response = await API.patch(`/projects/${id}/toggle`);
      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) => (p._id === id ? { ...p, enabled: response.data.data.enabled } : p))
        );
        addToast(
          'success',
          'Project Updated',
          `Project has been ${response.data.data.enabled ? 'enabled' : 'disabled'}.`
        );
      }
    } catch (err) {
      console.error('Error toggling project:', err);
      addToast('error', 'Toggle Failed', 'Failed to update project state.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName) {
      addToast('error', 'Validation Error', 'Project name is required.');
      return;
    }

    try {
      const response = await API.post('/projects', { name: projectName, key: projectKey });
      if (response.data.success) {
        setProjects((prev) => [...prev, response.data.data]);
        setProjectName('');
        setProjectKey('');
        setShowProjectForm(false);
        addToast('success', 'Project Created', 'New parent project container registered.');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      addToast('error', 'Creation Failed', err.response?.data?.message || 'Failed to register project.');
    }
  };

  // ==========================================
  // Product Toggles & Submissions
  // ==========================================
  const handleToggleProduct = async (id) => {
    try {
      const response = await API.patch(`/products/${id}/toggle`);
      if (response.data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, enabled: response.data.data.enabled } : p))
        );
        addToast(
          'success',
          'Product Updated',
          `Product campaign has been ${response.data.data.enabled ? 'enabled' : 'disabled'}.`
        );
      }
    } catch (err) {
      console.error('Error toggling product:', err);
      addToast('error', 'Toggle Failed', 'Failed to update product state.');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const { name, key, projectId, connectionId, campaignId, offerId, trialPrice, monthlyPrice } = newProduct;

    if (!name || !key || !projectId || !connectionId || !campaignId || !offerId || !trialPrice || !monthlyPrice) {
      addToast('error', 'Validation Error', 'Please fill in all product fields.');
      return;
    }

    try {
      const response = await API.post('/products', newProduct);
      if (response.data.success) {
        setProducts((prev) => [...prev, response.data.data]);
        setNewProduct({
          name: '',
          key: '',
          projectId: '',
          connectionId: '',
          campaignId: '',
          offerId: '',
          trialPrice: '',
          monthlyPrice: '',
          serviceName: 'sublytics'
        });
        setShowProductForm(false);
        addToast('success', 'Product Created', 'New campaign product registered.');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      addToast('error', 'Creation Failed', err.response?.data?.message || 'Failed to register product.');
    }
  };

  // ==========================================
  // Team Management & Builders
  // ==========================================
  const handleMemberCheckbox = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateOrUpdateTeam = async (e) => {
    e.preventDefault();

    if (!teamName || !selectedManager) {
      addToast('error', 'Validation Error', 'Please supply a team name and manager.');
      return;
    }

    const payload = {
      name: teamName,
      managerId: selectedManager,
      memberIds: selectedMembers,
    };

    try {
      if (editingTeamId) {
        const response = await API.put(`/users/teams/${editingTeamId}`, payload);
        if (response.data.success) {
          setTeams((prev) =>
            prev.map((t) => (t._id === editingTeamId ? response.data.data : t))
          );
          addToast('success', 'Team Updated', 'Team modifications saved.');
        }
      } else {
        const response = await API.post('/users/teams', payload);
        if (response.data.success) {
          setTeams((prev) => [...prev, response.data.data]);
          addToast('success', 'Team Created', 'New team generated.');
        }
      }
      resetTeamForm();
    } catch (err) {
      console.error('Error processing team:', err);
      addToast('error', 'Failed', err.response?.data?.message || 'Team registration failed.');
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeamId(team._id);
    setTeamName(team.name);
    setSelectedManager(team.manager?._id || '');
    setSelectedMembers(team.members.map((m) => m._id));
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team? Members will be unassigned.')) return;
    
    try {
      const response = await API.delete(`/users/teams/${id}`);
      if (response.data.success) {
        setTeams((prev) => prev.filter((t) => t._id !== id));
        addToast('success', 'Team Deleted', 'Team has been removed.');
      }
    } catch (err) {
      console.error('Error deleting team:', err);
      addToast('error', 'Deletion Failed', 'Failed to delete team.');
    }
  };

  const handlePromoteUser = async () => {
    if (!promoteUserId) return;
    try {
      const userToPromote = users.find(u => u._id === promoteUserId);
      const response = await API.patch(`/users/${promoteUserId}/role`, { role: 'manager' });
      if (response.data.success) {
        addToast('success', 'Role Updated', `${userToPromote?.name || 'User'} has been promoted to Manager.`);
        setPromoteUserId('');
        await fetchData();
      }
    } catch (err) {
      console.error('Promotion error:', err);
      addToast('error', 'Action Failed', 'Failed to promote user to manager.');
    }
  };

  const resetTeamForm = () => {
    setEditingTeamId(null);
    setTeamName('');
    setSelectedManager('');
    setSelectedMembers([]);
    setShowTeamForm(false);
  };

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Configure campaign structures and organize agent squads</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button
          onClick={() => setActiveTab('projects')}
          style={{ ...tabButtonStyle, ...(activeTab === 'projects' ? activeTabStyle : {}) }}
        >
          <FiLayers /> Project Containers
        </button>
        <button
          onClick={() => setActiveTab('products')}
          style={{ ...tabButtonStyle, ...(activeTab === 'products' ? activeTabStyle : {}) }}
        >
          <FiShoppingCart /> Product Campaigns
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          style={{ ...tabButtonStyle, ...(activeTab === 'teams' ? activeTabStyle : {}) }}
        >
          <FiUsers /> Squad Teams
        </button>
      </div>

      {/* Tab Contents: Projects */}
      {activeTab === 'projects' && (
        <div className="glass-panel" style={tabPanelStyle}>
          <div style={panelHeaderStyle}>
            <h3>Project Containers</h3>
            {!showProjectForm && (
              <button onClick={() => setShowProjectForm(true)} className="btn btn-primary">
                <FiPlus /> Add Project
              </button>
            )}
          </div>

          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="glass-panel" style={formStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 700 }}>New Project Container</h4>
                <button type="button" onClick={() => setShowProjectForm(false)} style={closeBtnStyle}><FiX /></button>
              </div>

              <div className="form-grid-three-col">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SC Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project Key (Unique Slug)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. scproject"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value)}
                  />
                </div>
              </div>

              <div style={formActionsStyle}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          )}

          <div className="table-container" style={{ marginTop: '1.5rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Project Key (Slug)</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'center' }}>Portal Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj._id}>
                    <td style={{ fontWeight: 600 }}>{proj.name}</td>
                    <td><code style={codeStyle}>{proj.key}</code></td>
                    <td>{new Date(proj.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleToggleProject(proj._id)} style={toggleButtonStyle}>
                        {proj.enabled ? (
                          <FiToggleRight style={{ color: 'var(--color-success)', fontSize: '2rem' }} />
                        ) : (
                          <FiToggleLeft style={{ color: 'var(--text-muted)', fontSize: '2rem' }} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Products */}
      {activeTab === 'products' && (
        <div className="glass-panel" style={tabPanelStyle}>
          <div style={panelHeaderStyle}>
            <h3>Product Campaigns (Offers)</h3>
            {!showProductForm && (
              <button onClick={() => setShowProductForm(true)} className="btn btn-primary" disabled={projects.length === 0}>
                <FiPlus /> Add Campaign Product
              </button>
            )}
          </div>

          {projects.length === 0 && (
            <div style={infoBannerStyle}>
              <FiInfo /> Create a Project Container first before adding products.
            </div>
          )}

          {showProductForm && (
            <form onSubmit={handleCreateProduct} className="glass-panel" style={formStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 700 }}>New Campaign Product</h4>
                <button type="button" onClick={() => setShowProductForm(false)} style={closeBtnStyle}><FiX /></button>
              </div>

              <div className="form-grid-three-col">
                <div className="form-group">
                  <label className="form-label">Product Name (Domain)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SaversCentralOnline.com"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Key (Slug)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. saverscentral"
                    value={newProduct.key}
                    onChange={(e) => setNewProduct({ ...newProduct, key: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Project Container</label>
                  <select
                    className="form-input"
                    value={newProduct.projectId}
                    onChange={(e) => setNewProduct({ ...newProduct, projectId: e.target.value })}
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Connection ID</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="1"
                    value={newProduct.connectionId}
                    onChange={(e) => setNewProduct({ ...newProduct, connectionId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign ID</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="136"
                    value={newProduct.campaignId}
                    onChange={(e) => setNewProduct({ ...newProduct, campaignId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Offer ID</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="4"
                    value={newProduct.offerId}
                    onChange={(e) => setNewProduct({ ...newProduct, offerId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trial Price Details</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $2.93 14-day Trial"
                    value={newProduct.trialPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, trialPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Price Details</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $29.83 Monthly"
                    value={newProduct.monthlyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, monthlyPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={formActionsStyle}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Product</button>
              </div>
            </form>
          )}

          <div className="table-container" style={{ marginTop: '1.5rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Domain</th>
                  <th>Parent Project</th>
                  <th>API Mappings</th>
                  <th>Trial Price</th>
                  <th>Monthly Price</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod._id}>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td><span className="badge badge-info">{prod.project?.name || 'SC Project'}</span></td>
                    <td>
                      <span style={monoBadgeStyle}>Conn: {prod.connectionId}</span>
                      <span style={monoBadgeStyle}>Camp: {prod.campaignId}</span>
                      <span style={monoBadgeStyle}>Off: {prod.offerId}</span>
                    </td>
                    <td>{prod.trialPrice}</td>
                    <td>{prod.monthlyPrice}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleToggleProduct(prod._id)} style={toggleButtonStyle}>
                        {prod.enabled ? (
                          <FiToggleRight style={{ color: 'var(--color-success)', fontSize: '2rem' }} />
                        ) : (
                          <FiToggleLeft style={{ color: 'var(--text-muted)', fontSize: '2rem' }} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Teams */}
      {activeTab === 'teams' && (
        <div className="glass-panel" style={tabPanelStyle}>
          <div style={panelHeaderStyle}>
            <h3>Squad Teams Builder</h3>
            {!showTeamForm && (
              <button onClick={() => setShowTeamForm(true)} className="btn btn-primary">
                <FiPlus /> Assemble Team
              </button>
            )}
          </div>

          {/* Quick Manager Promotion */}
          {!showTeamForm && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: 'rgba(15, 23, 42, 0.25)', border: '1px dotted var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Create Manager (Promote Agent)</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '240px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Choose User to Promote</label>
                  <select
                    className="form-input"
                    value={promoteUserId}
                    onChange={(e) => setPromoteUserId(e.target.value)}
                  >
                    <option value="">-- Choose User --</option>
                    {users.filter(u => u.role === 'user' && u.status === 'active').map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.username})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePromoteUser}
                  disabled={!promoteUserId}
                  style={{ height: '42px', padding: '0 1.5rem', fontSize: '0.9rem' }}
                >
                  Promote to Manager
                </button>
              </div>
            </div>
          )}

          {showTeamForm && (
            <form onSubmit={handleCreateOrUpdateTeam} className="glass-panel" style={formStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 700 }}>{editingTeamId ? 'Edit Team Squad' : 'Assemble New Squad'}</h4>
                <button type="button" onClick={resetTeamForm} style={closeBtnStyle}><FiX /></button>
              </div>

              <div className="form-grid-three-col">
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Squad Elite"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Manager</label>
                  <select
                    className="form-input"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                  >
                    <option value="">-- Choose Manager --</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.username})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Team Agents</label>
                <div style={checkboxListStyle}>
                  {availableMembers.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active agents available. Assign role 'user' first.</span>
                  ) : (
                    availableMembers.map((member) => (
                      <label key={member._id} style={checkboxItemStyle}>
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member._id)}
                          onChange={() => handleMemberCheckbox(member._id)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>{member.name} ({member.username})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={formActionsStyle}>
                <button type="button" className="btn btn-secondary" onClick={resetTeamForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingTeamId ? 'Save Team' : 'Form Team'}
                </button>
              </div>
            </form>
          )}

          <div style={teamsContainerStyle}>
            {teams.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No squads configured yet. Generate one above!
              </div>
            ) : (
              <div className="teams-grid-two-col">
                {teams.map((team) => (
                  <div key={team._id} style={teamCardStyle} className="glass-panel">
                    <div style={teamCardHeaderStyle}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{team.name}</h4>
                        <span style={managerTextStyle}>Manager: {team.manager?.name || 'Unassigned'}</span>
                      </div>
                      <div style={teamActionsStyle}>
                        <button onClick={() => handleEditTeam(team)} style={actionIconBtnStyle} title="Edit Squad"><FiEdit2 /></button>
                        <button onClick={() => handleDeleteTeam(team._id)} style={{ ...actionIconBtnStyle, color: 'var(--color-error)' }} title="Delete Squad"><FiTrash2 /></button>
                      </div>
                    </div>
                    
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Agents ({team.members.length}):</span>
                      {team.members.length === 0 ? (
                        <span style={emptyMemberStyle}>No agents in squad</span>
                      ) : (
                        <div style={memberBadgesContainerStyle}>
                          {team.members.map((m) => (
                            <span key={m._id} style={memberBadgeStyle}>{m.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const tabsContainerStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
};

const tabButtonStyle = {
  background: 'none',
  border: 'none',
  padding: '0.75rem 1.5rem',
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: '8px 8px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'var(--transition-fast)',
  outline: 'none',
};

const activeTabStyle = {
  color: 'var(--text-primary)',
  backgroundColor: 'rgba(99, 102, 241, 0.08)',
  borderBottom: '2px solid var(--color-primary)',
};

const tabPanelStyle = {
  padding: '2rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  marginBottom: '3rem',
};

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const formStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  padding: '1.75rem',
  border: '1px solid var(--color-primary)',
  borderRadius: '12px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), var(--shadow-glow)',
  marginBottom: '2rem',
  animation: 'slideIn 0.2s ease-out',
};


const formActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.25rem',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
};

const codeStyle = {
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  color: 'var(--color-accent)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  padding: '0.1rem 0.35rem',
  borderRadius: '4px',
};

const toggleButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
};

const monoBadgeStyle = {
  display: 'inline-block',
  fontFamily: 'monospace',
  fontSize: '0.72rem',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '0.1rem 0.35rem',
  borderRadius: '4px',
  marginRight: '0.3rem',
  color: 'var(--text-secondary)',
};

const infoBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(14, 165, 233, 0.1)',
  border: '1px solid rgba(14, 165, 233, 0.2)',
  borderRadius: '8px',
  color: 'var(--color-info)',
  fontSize: '0.88rem',
  marginBottom: '1.5rem',
};

const teamsContainerStyle = {
  marginTop: '1rem',
};


const teamCardStyle = {
  padding: '1.25rem',
  backgroundColor: 'rgba(15, 23, 42, 0.25)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.04)',
};

const teamCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  paddingBottom: '0.5rem',
  marginBottom: '0.75rem',
};

const managerTextStyle = {
  fontSize: '0.8rem',
  color: 'var(--color-info)',
  fontWeight: 600,
};

const teamActionsStyle = {
  display: 'flex',
  gap: '0.4rem',
};

const actionIconBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '0.25rem',
  fontSize: '0.95rem',
  transition: 'color 0.2s',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
};

const emptyMemberStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  fontStyle: 'italic',
};

const memberBadgesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
  marginTop: '0.25rem',
};

const memberBadgeStyle = {
  fontSize: '0.78rem',
  backgroundColor: 'rgba(99, 102, 241, 0.08)',
  color: 'var(--text-primary)',
  border: '1px solid rgba(99, 102, 241, 0.15)',
  padding: '0.15rem 0.5rem',
  borderRadius: '6px',
  fontWeight: 500,
};

const checkboxListStyle = {
  maxHeight: '160px',
  overflowY: 'auto',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.5rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const checkboxItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.88rem',
  cursor: 'pointer',
};

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '5rem 0',
};

export default AdminDashboard;
