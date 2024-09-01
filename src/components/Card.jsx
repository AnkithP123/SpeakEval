import React from 'react';

function Card({ children, bg = 'bg-gray-100' }) {
  return (
    <div className={`${bg} p-6 rounded-[30px] shadow-2xl`}>
      {children}
    </div>
  );
}

export default Card;
