import React from 'react';
import { toast } from 'react-toastify';

function ProfileCard({ name, code, onParticipantRemoved, userId, completed }) {
  const handleRemove = async() => {
    try {
        const response = await fetch(`https://backend-55dm.onrender.com/kick?code=${code}&participant=${name}&pin=${userId}`);
        toast.success('Participant kicked');
        onParticipantRemoved();
      } catch (error) {
        console.error('Error kicking participant:', error);
        toast.error('Error kicking participant');
      }
  };

  return (
    <div className="relative flex items-center px-5 h-[45px] rounded-lg bg-gray-200 m-2">
      <span className=" mr-[8px] text-[23px]">{name}</span>
      {!completed ? 
      (<button
        className="text-[30px] font-bold text-red-500 right-[5px] absolute "
        onClick={handleRemove}
      >
        ×
      </button>) : 
      (<span className="text-[20px] font-bold text-green-500 right-[5px] absolute">✓</span>)}
    </div>
  );
}

export default ProfileCard;
