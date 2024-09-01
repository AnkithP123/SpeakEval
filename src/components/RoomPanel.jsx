import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import { toast } from 'react-toastify';

function RoomPanel({ roomCode}) {
  const [participants, setParticipants] = useState([]);
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`https://backend-8zsz.onrender.com/checkjoined?code=${roomCode}`);
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
  }, [ roomCode ]);

  return (
    <div className="flex flex-col items-center" style={{fontFamily: "Montserrat"}}>
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

export default RoomPanel;
