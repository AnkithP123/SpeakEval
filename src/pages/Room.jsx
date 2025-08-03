"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "../components/Card";
import { cuteAlert } from "cute-alert";
import tokenManager from "../utils/tokenManager";
import urlCache from "../utils/urlCache";
import { useRealTimeCommunication } from "../hooks/useRealTimeCommunication";
import websocketService from '../utils/websocketService';

function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [testAudioURL, setTestAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [studentInfo, setStudentInfo] = useState(null);
  
  // Real-time communication
  const { 
    isConnected, 
    on: onWebSocketEvent, 
    off: offWebSocketEvent,
    updateStudentStatus,
    connectForReconnect,
    reconnect
  } = useRealTimeCommunication();

  useEffect(() => {
    // Check if student is authenticated and session is valid
    if (!tokenManager.isAuthenticated()) {
      toast.error("Please join the room first");
      return navigate("/join-room");
    }

    const token = tokenManager.getStudentToken();
    const info = tokenManager.getStudentInfo();
    
    if (!info || info.roomCode != roomCode) {
      toast.error("Invalid session for this room");
      tokenManager.clearAll();
      return navigate("/join-room");
    }

    console.log(`Token: ${token}, Participant: ${info.participant}, RoomCode: ${roomCode}`);
    
    // Try to connect with stored token if available
    const tokenForConnection = tokenManager.getStudentToken();
    console.log('🔍 Room component token check:', {
      hasToken: !!tokenForConnection,
      tokenPreview: tokenForConnection ? tokenForConnection.substring(0, 20) + '...' : 'none',
      tokenLength: tokenForConnection ? tokenForConnection.length : 0,
      isAuthenticated: tokenManager.isAuthenticated(),
      studentInfo: tokenManager.getStudentInfo()
    });
    
    if (tokenForConnection && !isConnected) {
      console.log('🔄 Connecting with stored token...');
      connectForReconnect(tokenForConnection);
    } else if (!tokenForConnection) {
      console.error('❌ No token available for connection in Room component');
    }
    
    // Set up WebSocket event listeners
    const handleExamStarted = (payload) => {
      console.log('🎯 Exam started:', payload);
      toast.success("Exam has started");
      navigate("/record");
    };
    
    const handleRoomRestart = (payload) => {
      console.log('🔄 Room restarted:', payload);
      
      // Extract new token and room information
      const { newToken, newRoomCode, participant } = payload;
      
      if (newToken && newRoomCode && participant) {
        // Update token in localStorage
        tokenManager.setStudentToken(newToken);
        
        toast.success("Room restarted with new question - reloading page!");
        // Simple page reload for fresh start
        console.log("Reloading page...");
        window.location.reload();
      } else {
        console.error("Missing token data from server");
        toast.error("Failed to handle room restart");
        window.location.reload();
      }
    };
    
    const handleParticipantUpdate = (payload) => {
      console.log('👥 Participant update:', payload);
      // Handle participant status updates
    };
    
    const handleReconnectNeeded = (payload) => {
      console.log('🔄 Reconnection needed:', payload);
      // Try to reconnect automatically
      reconnect();
    };
    
    const handleRoomStatusUpdate = (payload) => {
      console.log('📊 Room status update:', payload);
      // Handle room status updates
    };
    
    const handleStudentStatusUpdate = (payload) => {
      console.log('👤 Student status update:', payload);
      // Handle student status updates
    };
    
    const handleRoomStateSync = (payload) => {
      console.log('📊 Room state sync received:', payload);
      
      const { 
        roomCode, 
        participant, 
        roomStarted, 
        examStarted, 
        currentQuestion,
        latestToken,
        roomRestarted
      } = payload;
      
      // Handle room restart with latest token
      if (roomRestarted && latestToken) {
        console.log('🔄 Room was restarted, updating with latest token');
        tokenManager.setStudentToken(latestToken);
        
        toast.success("Room restarted with new question - reloading page!");
        window.location.reload();
        return;
      }
      
      // Handle exam started state
      if (examStarted && roomStarted) {
        console.log('🎯 Exam has started, navigating to record page');
        toast.success("Exam has started");
        navigate("/record");
        return;
      }
      
      // Handle room started but not exam
      if (roomStarted && !examStarted) {
        console.log('📊 Room has started but exam not yet begun');
        // Stay on current page, wait for exam to start
      }
    };
    
    // Add event listeners
    onWebSocketEvent('exam_started', handleExamStarted);
    onWebSocketEvent('room_restart', handleRoomRestart);
    onWebSocketEvent('participant_update', handleParticipantUpdate);
    onWebSocketEvent('reconnect_needed', handleReconnectNeeded);
    onWebSocketEvent('room_status_update', handleRoomStatusUpdate);
    onWebSocketEvent('student_status_update', handleStudentStatusUpdate);
    onWebSocketEvent('room_state_sync', handleRoomStateSync);
    
    // Update student status
    updateStudentStatus('waiting_in_room');

    document.documentElement.style.setProperty("--cute-alert-max-width", "40%");

    cuteAlert({
      id: "cute-alert-welcome",
      description:
        "You're currently in a waiting room. Please wait until your instructor starts the oral examination. It is VERY IMPORTANT that you follow the directions on this screen, and that you watch the video, then scroll down and test your audio devices. Make sure your teacher does not start the exam until you have completed this. Good luck!",
      primaryButtonText: "Got it",
    });

    return () => {
      // Cleanup event listeners
      offWebSocketEvent('exam_started', handleExamStarted);
      offWebSocketEvent('room_restart', handleRoomRestart);
      offWebSocketEvent('participant_update', handleParticipantUpdate);
      offWebSocketEvent('reconnect_needed', handleReconnectNeeded);
      offWebSocketEvent('room_status_update', handleRoomStatusUpdate);
      offWebSocketEvent('student_status_update', handleStudentStatusUpdate);
      offWebSocketEvent('room_state_sync', handleRoomStateSync);
      // Clean up WebSocket service properly
      websocketService.cleanup();
    };
  }, [roomCode, isConnected]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
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
    try {
      const audioUrl = await urlCache.getUrl(
        'test_audio',
        'test',
        null,
        async () => {
    const res = await fetch("https://www.server.speakeval.org/get_test_audio");
    const parsedData = await res.json();
          
          if (parsedData.error) {
            throw new Error(parsedData.error);
          }
          
          return parsedData.audioUrl;
        }
      );
      
    setTestAudioURL(audioUrl);
    } catch (error) {
      console.error("Error fetching test audio:", error);
      toast.error("Failed to fetch test audio");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-gray-900 to-blue-900 min-h-screen text-white"
      id="room"
      style={{ fontFamily: "Montserrat" }}
    >
      <h1 className="text-4xl font-bold mb-4">
        Welcome to Room {roomCode.toString().slice(0, -3)}
      </h1>
      <p className="text-2xl mb-8">
        Hello, {name}! Please wait until your instructor starts this oral
        examination. Watch this informational video while you wait. Please note
        that the layout has been slightly changed from the time of recording,
        and a countdown timer has been added at the top. Remember to use the
        audio testing console at the bottom to make sure you can record and
        fetch audio from the server.
      </p>
      <div className="w-full max-w-xl py-8">
        <div className="aspect-w-16 aspect-h-9">
          <video
            className="rounded-3xl shadow-lg"
            width="640"
            height="360"
            controls
          >
            <source src="/video.mov" type="video/mp4" />
          </video>
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-8 mt-12">Device Test Console</h2>
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-center gap-8">
        <Card color="blue" className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Microphone Check</h2>
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <p className="text-lg mb-2">
                Click the button below to start or stop recording your audio:
              </p>
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-full transition-colors duration-500 ${
                  recording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white font-bold`}
              >
                {recording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>
            {audioURL && (
              <div className="mb-4">
                <p className="text-lg mb-2">
                  Play back your recorded audio below, to make sure your mic
                  works:
                </p>
                <p className="text-lg mb-4">
                  If you are unable to play or hear it, ask for help, and you
                  may need to change some settings or switch devices.
                </p>
                <div className="flex justify-center">
                  <audio className="w-full" controls src={audioURL}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card color="purple" className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Fetch Test Audio</h2>
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <p className="text-lg mb-2">
                Click the button below to fetch a test audio from the server:
              </p>
              <button
                onClick={fetchTestAudio}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full transition-colors duration-500"
              >
                Fetch Test Audio
              </button>
            </div>
            {testAudioURL && (
              <div>
                <p className="text-lg mb-2">
                  Play the test audio below, and make sure you can play it and
                  hear it:
                </p>
                <p className="text-lg mb-4">
                  If you are unable to play or hear it, ask for help, and you
                  may need to change some settings or switch devices.
                </p>
                <div className="flex justify-center">
                  <audio className="w-full" controls src={testAudioURL}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      <div className="mt-12 max-w-4xl text-center">
        <p className="text-xl font-bold text-red-400">
          Important: Please make sure you can record and play back audio on your
          device. If you can't, please check your device settings and
          permissions, and try again. If you still can't, please contact your
          instructor. Do not let your instructor start the exam until you can
          record and play back audio successfully. You may need to switch
          devices.
        </p>
      </div>
    </div>
  );
}

export default Room;
