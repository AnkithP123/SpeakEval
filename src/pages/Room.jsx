import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { toast } from 'react-toastify';

function Room() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    let { roomCode } = useParams();
    const navigate = useNavigate();

    const checkStatus = async () => {
      let res = await fetch(`https://backend-8zsz.onrender.com/check_status?code=${roomCode}&participant=${name}`);
      let parsedData = await res.json();
      if(parsedData.code === 1){
        return;
      }
      if(parsedData.code === 2){
        toast.error("You have been removed from the room");
        return navigate('/join-room');
      }
      if(parsedData.code === 3){
        toast.success("Exam has started");
        return window.location = (`https://oral-examiner.vercel.app/audio.html?code=${roomCode}&participant=${name}`);
      }
      if(parsedData.code === 4){
        toast.error("Room dosent exist");
        return navigate('/join-room');
      }

    }

    useEffect(() => {
      checkStatus();
      const intervalId = setInterval(checkStatus, 1000);
  
      return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [ roomCode ]);
  
    return (
      <div>
        <h1>Welcome to Room {roomCode}</h1>
        <p>Hello, {name}!</p>
      </div>
    );
  }
export default Room