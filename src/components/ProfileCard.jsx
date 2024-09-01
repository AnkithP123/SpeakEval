import React from 'react';

function ProfileCard({ name }) {
  const handleRemove = () => {
    console.log(name);
  };

  return (
    <div className="relative w-52 h-24 rounded-lg bg-gray-200 flex items-center justify-center m-2">
      <button
        className="absolute top-[-5px] right-2 text-xl font-bold text-red-500"
        onClick={handleRemove}
      >
        ×
      </button>
      {name}
    </div>
  );
}

export default ProfileCard;
