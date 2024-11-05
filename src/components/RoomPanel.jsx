import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import { toast } from 'react-toastify';
import { cuteAlert } from 'cute-alert';

function RoomPanel({ roomCode, userId, setRoomCodes }) {
  const [participants, setParticipants] = useState([]);
  const [roomStarted, setRoomStarted] = useState(false);
  const [completedParticipants, setCompletedParticipants] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false);
  const navigate = useNavigate();
  const displayNameInputRef = useRef(null);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`https://server.speakeval.org/checkjoined?code=${roomCode}&pin=${userId}`);
      const data = await response.json();
      if(data.error) {
        return;
      }
      console.log(data);
      setParticipants(data.members);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Error fetching participants');
    }
    try {
      const response = await fetch(`https://server.speakeval.org/checkcompleted?code=${roomCode}&pin=${userId}`);
      const data = await response.json();
      if(data.error) {
        return;
      }
      console.log(data);
      setCompletedParticipants(data.members);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (displayNameInputRef.current && !displayNameInputRef.current.contains(event.target)) {
        setShowDisplayNameInput(false);
      }
    };

    if (showDisplayNameInput) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisplayNameInput]);

  const handleStart = async() => {
    // Logic for starting the event or room
    const response = await fetch(`https://server.speakeval.org/start_room?code=${roomCode}&pin=${userId}`);
    const data = await response.json();
    console.log(data);
    if(data.code === 404){
      toast.error('Room not found');
      return navigate('/');
    }
    console.log('Start button clicked');
    toast.success('Room started');
    
    document.querySelector('.text-6xl').innerHTML = `<a href="/teacher-portal" class="text-6xl font-bold">Click to go to grading page</a>`;
    setRoomStarted(true);

  };

  const handleRestart = async () => {
    console.log("Old: " + roomCode);
    let everyoneCompleted = true;
    participants.forEach((participant) => {
      if(!completedParticipants.includes(participant)){
        everyoneCompleted = false;
      }
    });

    document.documentElement.style.setProperty('--cute-alert-max-width', document.documentElement.style.getPropertyValue('--cute-alert-min-width') || '20%');
    
    cuteAlert({
      type: everyoneCompleted ? "question" : "error",
      title: "Are you sure?",
      description: "Are you sure you want to administer another question?" + (everyoneCompleted ? "" : "\nNot everyone has finished with the current question."),
      primaryButtonText: "Confirm",
      secondaryButtonText: "Cancel",
      showCloseButton: true,
      closeOnOutsideClick: true,
    }).then(async (event) => {
      if (event === "primaryButtonClicked") {
        const response = await fetch(`https://server.speakeval.org/restart_room?code=${roomCode}&pin=${userId}`);
        const data = await response.json();
        if(data.error){
          toast.error(data.error);
          return navigate('/');
        }
        setCompletedParticipants([]);
        // in 1 second, do the same
        setTimeout(() => {
          setCompletedParticipants([]);
        }, 1000);
    
        toast.success('Room restarted');
        setRoomCodes(data.newRoomCode);
        roomCode = data.newRoomCode;
        console.log("New: " + roomCode);
        setRoomStarted(true);    
      }
    });
  }

  const handleDisplayNameSubmit = async () => {
    try {
      const response = await fetch(`https://server.speakeval.org/add_display?code=${roomCode}&pin=${userId}&display=${displayName}`);
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message ? data.message : 'Display name was set');
        setShowDisplayNameInput(false);
      }
    } catch (error) {
      console.error('Error setting display name:', error);
      toast.error('Error setting display name');
    }
  };

  return (
    <div>
      {showDisplayNameInput && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={displayNameInputRef} className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">Rename this exam, for easy grading</h2>
            <h3 className="text-lg font-normal mb-4 text-center">Choose a descriptive and unique name</h3>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border p-2 rounded w-full mb-4"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDisplayNameSubmit}
                className="bg-green-500 text-white rounded-lg p-2 shadow-md hover:bg-green-600"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="bg-gray-500 text-white rounded-lg p-2 shadow-md hover:bg-gray-600"
              >
                Cancel
              </button>
              
            </div>
          </div>
        </div>
      )}
      <div className="relative flex flex-col items-center" style={{ fontFamily: "Montserrat" }}>
      {/* Participant Count Box and Start Button */}
      {showDisplayNameInput ? null : <div className="absolute left-4 flex items-center space-x-4">
        <div className="bg-white text-black rounded-lg p-3 shadow-md">
          Participants: {participants.length}
        </div>
      </div>}
      {showDisplayNameInput ? null : <div className="absolute right-4 flex items-center space-x-4">
        <button
          onClick={roomStarted ? handleRestart : handleStart}
          className="bg-red-500 text-white rounded-lg p-3 shadow-md hover:bg-red-600"
        >
          {(roomStarted ? 'New Question' : 'Start Room')}
        </button>
      </div>}

      <div className="flex items-center justify-center w-screen py-[20px]">
        <span className="text-6xl font-bold">
          Room Code: {roomCode.toString().slice(0, -3)}<br />
        </span>
      </div>

      <div className="flex flex-wrap justify-center">
        {showDisplayNameInput ? null : (
          <>
            {completedParticipants.map((participant, index) => (
              <ProfileCard key={index} name={""+participant} code={roomCode} onParticipantRemoved={fetchParticipants} userId={userId} completed={true}/>
            ))}
            {participants.map((participant, index) => (
              completedParticipants.includes(participant) ? null :
              <ProfileCard key={index} name={""+participant} code={roomCode} onParticipantRemoved={fetchParticipants} userId={userId} completed={false}/>
            ))}
          </>
        )}
      </div>

      
      
    </div>
    {showDisplayNameInput ? null : <div className="absolute bottom-28 right-4">
      <button
        onClick={() => setShowDisplayNameInput(true)}
        className="bg-blue-500 text-white rounded-lg p-3 shadow-md hover:bg-blue-600"
      >
        Set Display Name
      </button>
    </div>}
  </div>
  );
}

export default RoomPanel;
