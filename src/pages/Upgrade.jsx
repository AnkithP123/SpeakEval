import React from 'react';
import UpgradePanel from '../components/UpgradePanel';

function Upgrade() {
  return (
    <div className="flex justify-center items-center h-screen z-50 fixed inset-0" style={{ transform: 'translateY(-75px)' }}>
      <div className="bg-blue-100 bg-opacity-[80%] p-8 rounded-[25px] shadow-lg flex space-x-6">
        <UpgradePanel />
        <UpgradePanel basicCard={false} />
      </div>
    </div>
  );
}

export default Upgrade;
