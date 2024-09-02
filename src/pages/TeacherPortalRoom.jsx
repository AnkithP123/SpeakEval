import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileCard from '../components/StatsCard';
import { toast } from 'react-toastify';

function TeacherPortalRoom() {
  const [participants, setParticipants] = useState({members:[]});
  const navigate = useNavigate();
    const { roomCode } = useParams();

  const fetchParticipants = async () => {
    try {
        const response = await fetch(`https://backend-8zsz.onrender.com/checkjoined?code=${roomCode}`);
        const responsev2 = await fetch(`https://backend-8zsz.onrender.com/checkcompleted?code=${roomCode}`);
        const data = await response.json();
        const data2 = await responsev2.json();
        let obj = {members:[]};
        if(data2.error || data.error){  
            return;
        }
        for(let name of data.members){
            obj.members.push({name});
        }
        //check if people complted and add a complrted tag
        for(let i = 0; i < data2.completedPartipants.length; i++){
            const name = obj.members.findIndex(name => name.name === data2.completedPartipants[i]);
            console.log(name + " " + data2.completedPartipants[i]);    
            if(name === -1) continue;
            obj.members[name].completed = true
        }
        console.log(obj);
        setParticipants(obj);
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
          Participants: {participants.members.length}
        </div>
      </div>

      <div className="flex items-center justify-center w-screen py-[20px]">
        <span className="text-6xl font-bold">
          Room Code: {roomCode}
        </span>
      </div>

      <div className="flex flex-wrap justify-center">
        {participants.members.map((participant, index) => (
          <ProfileCard key={index} name={participant} code={roomCode} />
        ))}
      </div>
    </div>
  );
}

export default TeacherPortalRoom;
