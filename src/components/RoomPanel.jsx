import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';

function RoomPanel({ roomCode = '' }) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        console.log("Heres: ");
        const response = await fetch(`https://backend-8zsz.onrender.com/checkjoined?code=${roomCode}`);
        const data = await response.json();
        console.log("Here: ", data);
        setParticipants(data.members);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
    const intervalId = setInterval(fetchParticipants, 5000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-screen py-[20px]">
        <span className="text-6xl font-bold">
          {roomCode}
        </span>
      </div>
      <div className="flex flex-wrap justify-center">
        {participants.map((participant, index) => (
          <ProfileCard key={index} name={""+participant} />
        ))}
      </div>
    </div>
  );
}

export default RoomPanel;
