import React, { useState, useEffect } from 'react';
import API from '../config/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { FiUserCheck, FiUserX, FiShield, FiUsers, FiTrash2 } from 'react-icons/fi';

const UserManagement = () => {
  const { addToast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast('error', 'Error', 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await API.patch(`/users/${userId}/role`, { role: newRole });
      if (response.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: response.data.data.role } : u))
        );
        addToast('success', 'Role Updated', `User role modified to ${newRole.toUpperCase()}.`);
      }
    } catch (err) {
      console.error('Role update error:', err);
      addToast('error', 'Update Failed', 'Failed to modify user role.');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await API.patch(`/users/${userId}/status`, { status: nextStatus });
      if (response.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: response.data.data.status } : u))
        );
        addToast(
          'success',
          'Account Status Updated',
          `User access has been ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`
        );
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      addToast('error', 'Action Failed', 'Failed to adjust account access.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${userName}"? This action is irreversible.`)) {
      try {
        const response = await API.delete(`/users/${userId}`);
        if (response.data.success) {
          setUsers((prev) => prev.filter((u) => u._id !== userId));
          addToast('success', 'User Deleted', `Account for ${userName} has been removed.`);
        }
      } catch (err) {
        console.error('Delete user error:', err);
        addToast('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete user.');
      }
    }
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
          <h1 className="page-title">User Access Control</h1>
          <p className="page-subtitle">Manage authorization levels, squad assignments, and login permissions</p>
        </div>
      </div>

      <div className="glass-panel" style={cardStyle}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent Profile</th>
                <th>Username</th>
                <th>Team Assignment</th>
                <th>Role Rank</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'center' }}>Modify Role</th>
                <th style={{ textAlign: 'center' }}>Access Controls</th>
                <th style={{ textAlign: 'center' }}>Delete Account</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.username}</td>
                  <td>
                    {u.role !== 'user' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N/A (Non-agent)</span>
                    ) : u.team ? (
                      <span className="badge badge-info" style={{ gap: '0.25rem' }}>
                        <FiUsers /> {u.team.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === 'admin' 
                          ? 'badge-error' 
                          : u.role === 'manager' 
                          ? 'badge-warning' 
                          : 'badge-success'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.status === 'active' ? 'badge-success' : 'badge-error'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      className="form-input"
                      style={selectRoleStyle}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    >
                      <option value="user">User / Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleStatusToggle(u._id, u.status)}
                      className={`btn ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                      style={statusBtnStyle}
                      title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                    >
                      {u.status === 'active' ? (
                        <>
                          <FiUserX /> Deactivate
                        </>
                      ) : (
                        <>
                          <FiUserCheck /> Activate
                        </>
                      )}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(u._id, u.name)}
                      className="btn btn-danger"
                      style={deleteBtnStyle}
                      title="Delete User Permanently"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Styles
const cardStyle = {
  padding: '1.75rem',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  marginBottom: '3rem',
};

const selectRoleStyle = {
  width: '150px',
  padding: '0.4rem 0.6rem',
  fontSize: '0.85rem',
  display: 'inline-block',
};

const statusBtnStyle = {
  padding: '0.4rem 0.8rem',
  fontSize: '0.8rem',
  width: '120px',
  gap: '0.35rem',
};

const deleteBtnStyle = {
  padding: '0.4rem 0.8rem',
  fontSize: '0.8rem',
  width: '100px',
  gap: '0.35rem',
};

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '5rem 0',
};

export default UserManagement;
