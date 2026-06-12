import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../config/axios.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user credentials exist in localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { username, password });
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login request error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during login' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, username, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', { name, username, password });
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Register request error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during registration' 
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (username, name, newPassword) => {
    try {
      const response = await API.post('/auth/forgot-password', { username, name, newPassword });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Forgot password request error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during password reset' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
