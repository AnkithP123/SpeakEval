import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import { cuteAlert } from 'cute-alert';

function Room() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    const uuid = searchParams.get('uuid');
    let { roomCode } = useParams();
    const navigate = useNavigate();
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [testAudioURL, setTestAudioURL] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const checkStatus = async () => {
        console.log(`uuid: ${uuid}, name: ${name}, roomCode: ${roomCode}`);
        let res = await fetch(`https://www.server.speakeval.org/check_status?code=${roomCode}&participant=${name}&uuid=${uuid}`);
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
            return window.location.href = (`https://speakeval.org/record?code=${roomCode}&participant=${name}`);
        }
        if (parsedData.code === 4) {
            toast.error("Room doesn't exist");
            return navigate('/join-room');
        }
        if (parsedData.code === 69) {
            toast.error("UUID and name don't match");
            console.log(parsedData);
            return navigate('/join-room');
        }
    };

    useEffect(() => {
        checkStatus();
        const intervalId = setInterval(checkStatus, 3000);

        document.documentElement.style.setProperty('--cute-alert-max-width', '40%');

        cuteAlert({
            type: "info",
            title: "Welcome to SpeakEval",
            description: "You're currently in a waiting room. Please wait until your instructor starts the oral examination. It is VERY IMPORTANT that you follow the directions on this screen, and that you watch the video, then scroll down and test your audio devices. Make sure your teacher does not start the exam until you have completed this. Good luck!",
            primaryButtonText: "Got it"
        })
    
        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [roomCode]);

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = event => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setAudioURL(audioUrl);
                    audioChunksRef.current = [];
                };
                mediaRecorderRef.current.start();
                setRecording(true);
            });
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setRecording(false);
    };

    const fetchTestAudio = async () => {
        let res = await fetch('https://www.server.speakeval.org/get_test_audio');
        let parsedData = await res.json();
        const audioBase64 = parsedData.audio;
        const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setTestAudioURL(audioUrl);
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8" style={{ fontFamily: "Montserrat" }}>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Room {roomCode.toString().slice(0, -3)}</h1>
            <p className="text-2xl text-gray-600 mb-8">Hello, {name}! Please wait until your instructor starts this oral examination. Watch this informational video while you wait. Please note that the layout has been slightly changed from the time of recording, and a countdown timer has been added at the top. Remember to use the audio testing console at the bottom to make sure you can record and fetch audio from the server.</p>
            <div className="w-full max-w-xl py-[30px]">
                <div className="aspect-w-16 aspect-h-9">
                    <video 
                        className="rounded-[40px]" 
                        width="640" 
                        height="360" 
                        controls
                    >
                        <source src="/video.mov" type="video/mp4" />
                    </video>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Device Test Console</h2>
            <div className="w-full max-w-4xl py-[30px] flex justify-center gap-8">
                <Card bg="bg-[#E6F3FF]" className="w-1/2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Microphone Check</h2>
                    <div className="flex flex-col items-center">
                        <div className="mb-4">
                            <p className="text-lg text-gray-600 mb-2">Click the button below to start or stop recording your audio:</p>
                            <button 
                                onClick={recording ? stopRecording : startRecording} 
                                className={`px-4 py-2 rounded transition-colors duration-500 ${recording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
                            >
                                {recording ? 'Stop Recording' : 'Start Recording'}
                            </button>
                        </div>
                        {audioURL && (
                            <div className="mb-4">
                                <p className="text-lg text-gray-600 mb-2">Play back your recorded audio below, to make sure your mic works:</p>
                                <br />
                                <p className="text-lg text-gray-600 mb-2">If you are unable to play or hear it, ask for help, and you may need to change some settings or switch devices.</p>
                                <div className="flex justify-center">
                                    <audio className="w-100%" controls src={audioURL}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
                <Card bg="bg-[#E6F3FF]" className="w-1/2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Fetch Test Audio</h2>
                    <div className="flex flex-col items-center">
                        <div className="mb-4">
                            <p className="text-lg text-gray-600 mb-2">Click the button below to fetch a test audio from the server:</p>
                            <button 
                                onClick={fetchTestAudio} 
                                className="px-4 py-2 bg-green-500 text-white rounded transition-colors duration-500"
                            >
                                Fetch Test Audio
                            </button>
                        </div>
                        {testAudioURL && (
                            <div>
                                <p className="text-lg text-gray-600 mb-2">Play the test audio below, and make sure you can play it and hear it:</p>
                                <br />
                                <p className="text-lg text-gray-600 mb-2">If you are unable to play or hear it, ask for help, and you may need to change some settings or switch devices.</p>
                                <div className="flex justify-center">
                                    <audio className="w-100%" controls src={testAudioURL}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
                
            </div>
            <div>
                <p>
                    <strong>Important:</strong> Please make sure you can record and play back audio on your device. If you can't, please check your device settings and permissions, and try again. If you still can't, please contact your instructor. Do not let your instructor start the exam until you can record and play back audio successfully. You may need to switch devices.
                </p>
            </div>
        </div>
    );
}

export default Room;
