import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import { toast } from 'react-toastify';

function TeacherPortalRoom({ roomCode }) {
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`https://backend-8zsz.onrender.com/checkjoined?code=${roomCode}`);
      const responsev2 = await fetch(`https://backend-8zsz.onrender.com/checkcompleted?code=${roomCode}`);
      const data = await response.json();
      setParticipants(data.members);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Error fetching participants');
    }
  };

  useEffect(() => {
    fetchParticipants();
    const intervalId = setInterval(fetchParticipants, 1000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [roomCode]);

  const handleStart = async() => {
    // Logic for starting the event or room
    const response = await fetch(`https://backend-8zsz.onrender.com/start_room?code=${roomCode}`);
    const data = await response.json();
    console.log(data);
    if(data.code === 404){
      toast.error('Room not found');
      return navigate('/');
    }
    console.log('Start button clicked');
  };

  return (
    <div className="relative flex flex-col items-center" style={{ fontFamily: "Montserrat" }}>
      {/* Participant Count Box and Start Button */}
      <div className="absolute left-4 flex items-center space-x-4">
        <div className="bg-white text-black rounded-lg p-3 shadow-md">
          Participants: {participants.length}
        </div>
      </div>
      <div className="absolute right-4 flex items-center space-x-4">
        <button
          onClick={handleStart}
          className="bg-red-500 text-white rounded-lg p-3 shadow-md hover:bg-red-600"
        >
          Start
        </button>
      </div>

      <div className="flex items-center justify-center w-screen py-[20px]">
        <span className="text-6xl font-bold">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="flex flex-wrap justify-center">
        {participants.map((participant, index) => (
          <ProfileCard key={index} name={""+participant} code={roomCode} onParticipantRemoved={fetchParticipants} />
        ))}
      </div>
    </div>
  );
}

export default TeacherPortalRoom;
