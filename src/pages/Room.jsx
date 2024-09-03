import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

function Room() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    let { roomCode } = useParams();
    const navigate = useNavigate();

    const checkStatus = async () => {
        let res = await fetch(`https://backend-8zsz.onrender.com/check_status?code=${roomCode}&participant=${name}`);
        let parsedData = await res.json();
        if (parsedData.code === 1) {
            return;
        }
        if (parsedData.code === 2) {
            toast.error("You have been removed from the room");
            return navigate('/join-room');
        }
        if (parsedData.code === 3) {
            toast.success("Exam has started");
            return window.location = (`https://speakeval.vercel.app/audio.html?code=${roomCode}&participant=${name}`);
        }
        if (parsedData.code === 4) {
            toast.error("Room doesn't exist");
            return navigate('/join-room');
        }
    }

    useEffect(() => {
        checkStatus();
        const intervalId = setInterval(checkStatus, 1000);
    
        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [roomCode]);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8" style={{ fontFamily: "Montserrat" }}>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Room {roomCode}</h1>
            <p className="text-2xl text-gray-600 mb-8">Hello, {name}! Please wait until your instructor starts this oral examination. Watch this informational video while you wait.</p>
            <div className="w-full max-w-xl py-[30px]">
                <div className="aspect-w-16 aspect-h-9">
                    <iframe 
                        width="640" 
                        height="360" 
                        className="rounded-[40px]" 
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                        title="Rick Astley - Never Gonna Give You Up (Official Music Video)" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    );
}

export default Room;
