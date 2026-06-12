import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Layout from './components/Layout.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitOrder from './pages/SubmitOrder.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import UserManagement from './pages/UserManagement.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route
                path="/"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="/submit"
                element={
                  <Layout>
                    <SubmitOrder />
                  </Layout>
                }
              />
              <Route
                path="/history"
                element={
                  <Layout>
                    <OrderHistory />
                  </Layout>
                }
              />
              
              {/* Admin-only Routes */}
              <Route element={<AdminRoute />}>
                <Route
                  path="/users"
                  element={
                    <Layout>
                      <UserManagement />
                    </Layout>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  }
                />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
