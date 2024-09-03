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
        const responsev2 = await fetch(`https://backend-8zsz.onrender.com/checkcompleted?code=${roomCode}`);
        const data2 = await responsev2.json();
        let obj = {members:[]};
        if(data2.error){  
            toast.error('Room not found');
            return navigate('/');
        }

        const response = await fetch(`https://backend-8zsz.onrender.com/checkjoined?code=${roomCode}`);

        const data = await response.json();
        
        obj.members = data2.members.map((member) => {
            return {
                name: member,
                completed: true
            };
        });

        const activeParticipants = data.members;

        activeParticipants.forEach((participant) => {
            if (!obj.members.find((member) => member.name === participant)) {
                obj.members.push({
                    name: participant,
                    completed: false
                });
            }
        });

        console.log('members', data2.members);

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
          Grading Room: {roomCode}
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
