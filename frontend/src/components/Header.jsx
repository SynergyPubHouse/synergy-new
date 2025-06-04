import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center gap-8 bg-yellow-300 px-8 pt-8 pb-4 border-b border-gray-200 flex-col sm:flex-row">
      <img
        src="/images/SynergyLogo.png"
        alt="Synergy World Press Logo"
        className="w-24 h-32 object-contain bg-white border-2 border-gray-300 shadow-md mb-4 sm:mb-0 rounded"
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 m-0">Synergy World Press</h1>
      </div>
    </header>
  );
};

export default Header; 