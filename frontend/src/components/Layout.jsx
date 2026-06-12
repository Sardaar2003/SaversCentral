import React from 'react';
import Navbar from './Navbar.jsx';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Premium background gradient glows */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      <Navbar />
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
