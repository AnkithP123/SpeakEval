import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function JoinRoom() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = async() => {
    // Function to handle the Join action
    if (name && roomCode) {
      console.log('Joining room with name:', name, 'and room code:', roomCode);
      let res = await fetch(`https://backend-8zsz.onrender.com/join_room?code=${roomCode}&participant=${name}`);
      let parsedData = await res.json();
      if (parsedData.error) {
        toast.error(parsedData.message);
        return navigate('/join-room');
      }
      navigate(`/room/${roomCode}?name=${name}`);
      // Add your join logic here
    } else {
      console.log('Please fill out both fields.');
      toast.error('Please fill out both fields.');
    }
  };

  const handleNameChange = (e) => {
    if (e.target.value.length <= 20) {
      setName(e.target.value);
    }
  };

  const handleRoomCodeChange = (e) => {
    if (/^\d*$/.test(e.target.value)) {
      setRoomCode(e.target.value);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center mt-[12%]">
      <div className="w-[400px] h-[400px] bg-white rounded-lg shadow-lg flex flex-col items-center p-8">
        <h2 className="text-3xl font-bold mb-8">Join Room</h2>
        <div className="w-full mb-4">
          <label className="block text-lg font-semibold mb-2" htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            maxLength="20"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter your name"
          />
        </div>
        <div className="w-full mb-8">
          <label className="block text-lg font-semibold mb-2" htmlFor="roomCode">Room Code</label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={handleRoomCodeChange}
            maxLength="6"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter room code"
          />
        </div>
        <button
          onClick={handleJoin}
          className="w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Join
        </button>
      </div>
    </div>
  );
}

export default JoinRoom;
