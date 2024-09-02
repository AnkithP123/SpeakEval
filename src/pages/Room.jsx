import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const Room = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  let { roomCode } = useParams();
  const navigate = useNavigate();

  const checkStatus = async () => {
    try {
      let res = await fetch(`https://backend-8zsz.onrender.com/check_status?code=${roomCode}&participant=${name}`);
      let parsedData = await res.json();
      
      switch (parsedData.code) {
        case 1:
          break; // No action needed
        case 2:
          toast.error("You have been removed from the room");
          navigate('/join-room');
          break;
        case 3:
          toast.success("Exam has started");
          window.location = (`https://oral-examiner.vercel.app/audio.html?code=${roomCode}&participant=${name}`);
          break;
        case 4:
          toast.error("Room doesn’t exist");
          navigate('/join-room');
          break;
        default:
          toast.error("Unknown error occurred");
          navigate('/join-room');
          break;
      }
    } catch (error) {
      toast.error("An error occurred while checking the status");
      navigate('/join-room');
    }
  };

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(checkStatus, 1000);
  
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [roomCode, name]);

  // Inline styling for the component
  const containerStyle = {
    textAlign: 'center',
    background: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    margin: '20px auto',
    width: 'fit-content'
  };

  const headingStyle = {
    color: '#333',
    fontSize: '2em',
    marginBottom: '10px'
  };

  const paragraphStyle = {
    color: '#666',
    fontSize: '1.2em',
    margin: '10px 0'
  };

  const instructionsStyle = {
    color: '#444',
    fontSize: '1em',
    marginTop: '20px',
    lineHeight: '1.6'
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Welcome to Room {roomCode}</h1>
      <p style={paragraphStyle}>Hello, {name}!</p>
      <div style={instructionsStyle}>
        <p>Sit tight until everyone has joined and your teacher starts the room. Once it has been started, click the play button to play your question. Once the question finishes, your recording will begin in 5 seconds. Press the big red button to stop recording once you finish responding.</p>
      </div>
    </div>
  );
};

export default Room;
