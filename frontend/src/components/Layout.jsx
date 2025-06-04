import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <Navigation />
      {children}
    </div>
  );
};

export default Layout; 