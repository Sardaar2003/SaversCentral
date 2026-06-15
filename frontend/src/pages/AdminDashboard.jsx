import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { FiPlus, FiToggleLeft, FiToggleRight, FiUsers, FiLayers, FiShoppingCart, FiTrash2, FiEdit2, FiX, FiInfo, FiActivity, FiTrendingUp, FiCheckCircle, FiXCircle, FiAlertTriangle, FiSearch, FiRefreshCw } from 'react-icons/fi';

const AdminDashboard = () => {
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('projects');
  
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracking stats state
  const [trackingStats, setTrackingStats] = useState({ agentStats: [], groupStats: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingTracking, setLoadingTracking] = useState(false);

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

  const fetchTrackingStats = async () => {
    setLoadingTracking(true);
    try {
      let query = '';
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      
      const response = await API.get(`/orders/tracking-stats?${query.slice(1)}`);
      if (response.data.success) {
        setTrackingStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching tracking stats:', err);
      addToast('error', 'Error', 'Failed to retrieve tracking metrics.');
    } finally {
      setLoadingTracking(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchTrackingStats();
    }
  }, [activeTab]);

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
        <button
          onClick={() => setActiveTab('tracking')}
          style={{ ...tabButtonStyle, ...(activeTab === 'tracking' ? activeTabStyle : {}) }}
        >
          <FiActivity /> Tracking & Performance
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

      {/* Tab Contents: Tracking & Performance */}
      {activeTab === 'tracking' && (
        <div className="glass-panel" style={tabPanelStyle}>
          <div style={panelHeaderStyle}>
            <h3>SRE Compliance & Performance Tracking</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time audit logs of squad activities and violations</span>
          </div>

          {/* Date Filter Bar */}
          <div className="glass-panel" style={filterBarContainerStyle}>
            <div style={filterFormStyle}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={filterInputStyle}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={filterInputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={fetchTrackingStats} style={filterBtnStyle}>
                  <FiSearch /> Filter
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    // Trigger refetch with empty dates:
                    setTimeout(() => {
                      API.get('/orders/tracking-stats').then(res => {
                        if (res.data.success) setTrackingStats(res.data.data);
                      });
                    }, 0);
                  }}
                  style={filterBtnStyle}
                >
                  <FiRefreshCw /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Summary Metric Cards */}
          {loadingTracking ? (
            <div style={{ padding: '3rem 0', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            </div>
          ) : (
            <>
              {/* Calculating totals for metrics */}
              {(() => {
                const totalReq = trackingStats.agentStats.reduce((acc, a) => acc + a.totalRequests, 0);
                const totalSucc = trackingStats.agentStats.reduce((acc, a) => acc + a.successful, 0);
                const totalFail = trackingStats.agentStats.reduce((acc, a) => acc + a.failed, 0);
                const totalViol = trackingStats.agentStats.reduce((acc, a) => acc + a.violations, 0);

                return (
                  <div style={statsGridStyle}>
                    <div className="glass-panel" style={statsCardStyle('var(--color-primary)')}>
                      <div style={cardHeaderStyle}>
                        <span style={cardTitleStyle}>Total Requests</span>
                        <div style={iconContainerStyle}><FiActivity style={{ color: 'var(--color-primary)' }} /></div>
                      </div>
                      <h2 style={cardValueStyle}>{totalReq}</h2>
                      <p style={cardDescStyle}>Submitted transaction attempts</p>
                    </div>
                    <div className="glass-panel" style={statsCardStyle('var(--color-success)')}>
                      <div style={cardHeaderStyle}>
                        <span style={cardTitleStyle}>Successful Sales</span>
                        <div style={iconContainerStyle}><FiCheckCircle style={{ color: 'var(--color-success)' }} /></div>
                      </div>
                      <h2 style={cardValueStyle}>{totalSucc}</h2>
                      <p style={cardDescStyle}>Approved card transactions</p>
                    </div>
                    <div className="glass-panel" style={statsCardStyle('var(--color-error)')}>
                      <div style={cardHeaderStyle}>
                        <span style={cardTitleStyle}>Declined / Failed</span>
                        <div style={iconContainerStyle}><FiXCircle style={{ color: 'var(--color-error)' }} /></div>
                      </div>
                      <h2 style={cardValueStyle}>{totalFail}</h2>
                      <p style={cardDescStyle}>Gateway errors & declines</p>
                    </div>
                    <div className="glass-panel" style={statsCardStyle('var(--color-accent)')}>
                      <div style={cardHeaderStyle}>
                        <span style={cardTitleStyle}>Policy Violations</span>
                        <div style={iconContainerStyle}><FiAlertTriangle style={{ color: 'var(--color-accent)' }} /></div>
                      </div>
                      <h2 style={cardValueStyle}>{totalViol}</h2>
                      <p style={cardDescStyle}>Blocked rule violations</p>
                    </div>
                  </div>
                );
              })()}

              {/* Squad Performance Grid */}
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={subSectionHeaderStyle}><FiUsers /> Squad (Group) Performance</h4>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Squad Name</th>
                        <th>Lead Manager</th>
                        <th style={{ textAlign: 'center' }}>Requests Sent</th>
                        <th style={{ textAlign: 'center' }}>Approved</th>
                        <th style={{ textAlign: 'center' }}>Failed</th>
                        <th style={{ textAlign: 'center' }}>Violations</th>
                        <th style={{ textAlign: 'center' }}>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingStats.groupStats.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No squad data recorded.</td>
                        </tr>
                      ) : (
                        trackingStats.groupStats.map(group => {
                          const rate = group.totalRequests > 0 ? ((group.successful / group.totalRequests) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={group._id}>
                              <td style={{ fontWeight: 600 }}>{group.name}</td>
                              <td style={{ color: 'var(--color-info)', fontWeight: 500 }}>{group.managerName}</td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{group.totalRequests}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-success)' }}>{group.successful}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-error)' }}>{group.failed}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-accent)' }}>
                                {group.violations > 0 ? (
                                  <span className="badge badge-error" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-error)' }}>
                                    {group.violations}
                                  </span>
                                ) : '0'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{rate}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent Performance Grid */}
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={subSectionHeaderStyle}><FiActivity /> Agent (User) Performance</h4>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Agent Name</th>
                        <th>Username</th>
                        <th>Assigned Squad</th>
                        <th style={{ textAlign: 'center' }}>Requests Sent</th>
                        <th style={{ textAlign: 'center' }}>Approved</th>
                        <th style={{ textAlign: 'center' }}>Failed</th>
                        <th style={{ textAlign: 'center' }}>Violations</th>
                        <th style={{ textAlign: 'center' }}>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingStats.agentStats.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No agent data recorded.</td>
                        </tr>
                      ) : (
                        trackingStats.agentStats.map(agent => {
                          const rate = agent.totalRequests > 0 ? ((agent.successful / agent.totalRequests) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={agent._id}>
                              <td style={{ fontWeight: 600 }}>{agent.name}</td>
                              <td><code style={codeStyle}>{agent.username}</code></td>
                              <td><span className="badge badge-info">{agent.teamName}</span></td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{agent.totalRequests}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-success)' }}>{agent.successful}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-error)' }}>{agent.failed}</td>
                              <td style={{ textAlign: 'center', color: 'var(--color-accent)' }}>
                                {agent.violations > 0 ? (
                                  <span className="badge badge-error" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-error)' }}>
                                    {agent.violations}
                                  </span>
                                ) : '0'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{rate}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
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

// Tracking and Performance custom styles
const filterBarContainerStyle = {
  padding: '1.25rem',
  backgroundColor: 'rgba(15, 23, 42, 0.25)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.04)',
  marginBottom: '2rem',
};

const filterFormStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const filterInputStyle = {
  width: '180px',
  height: '38px',
  padding: '0 0.75rem',
  fontSize: '0.88rem',
};

const filterBtnStyle = {
  height: '38px',
  padding: '0 1.25rem',
  fontSize: '0.88rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
};

const subSectionHeaderStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.25rem',
  marginBottom: '2rem',
};

const statsCardStyle = (color) => ({
  padding: '1.5rem',
  backgroundColor: 'rgba(15, 23, 42, 0.25)',
  borderLeft: `4px solid ${color}`,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '130px',
});

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const cardTitleStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  letterSpacing: '0.05em',
};

const iconContainerStyle = {
  padding: '0.4rem',
  borderRadius: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
};

const cardValueStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  margin: '0.5rem 0',
  color: 'var(--text-primary)',
};

const cardDescStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

export default AdminDashboard;
