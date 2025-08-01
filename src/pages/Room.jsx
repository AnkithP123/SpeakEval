"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "../components/Card";
import { cuteAlert } from "cute-alert";
import tokenManager from "../utils/tokenManager";

function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [testAudioURL, setTestAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [studentInfo, setStudentInfo] = useState(null);

  const checkStatus = async () => {
    // Check if student is authenticated and session is valid
    if (!tokenManager.isAuthenticated()) {
      toast.error("Please join the room first");
      return navigate("/join-room");
    }

    const token = tokenManager.getStudentToken();
    const info = tokenManager.getStudentInfo();
    
    if (!info || info.roomCode !== parseInt(roomCode)) {
      toast.error("Invalid session for this room");
      tokenManager.clearAll();
      return navigate("/join-room");
    }

    console.log(`Token: ${token}, Participant: ${info.participant}, RoomCode: ${roomCode}`);
    
    const res = await fetch(
      `https://www.server.speakeval.org/check_status?token=${token}`
    );
    const parsedData = await res.json();
    
    if (parsedData.code === 1) {
      return;
    }
    if (parsedData.code === 2) {
      toast.error("You are not in the room");
      tokenManager.clearAll();
      return navigate("/join-room");
    }
    if (parsedData.code === 3) {
      toast.success("Exam has started");
      return (window.location.href = `https://speakeval.org/record`);
    }
    if (parsedData.code === 4) {
      toast.error("Room doesn't exist");
      tokenManager.clearAll();
      return navigate("/join-room");
    }
    if (parsedData.code === 7) {
      window.location.href = `record`;
    }
    if (parsedData.code === 9) {
      toast.error(
        "The IP this user joined from is different than your current IP. If this is a mistake, tell your teacher to remove you and rejoin with the same name."
      );
      console.log(parsedData);
      tokenManager.clearAll();
      return navigate("/join-room");
    }
  };

  useEffect(() => {
    checkStatus();
    const intervalId = setInterval(checkStatus, 3000);

    document.documentElement.style.setProperty("--cute-alert-max-width", "40%");

    cuteAlert({
      type: "info",
      title: "Welcome to SpeakEval",
      id: "cute-alert-welcome",
      description:
        "You're currently in a waiting room. Please wait until your instructor starts the oral examination. It is VERY IMPORTANT that you follow the directions on this screen, and that you watch the video, then scroll down and test your audio devices. Make sure your teacher does not start the exam until you have completed this. Good luck!",
      primaryButtonText: "Got it",
    });

    return () => clearInterval(intervalId);
  }, [roomCode]);

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
    const res = await fetch("https://www.server.speakeval.org/get_test_audio");
    const parsedData = await res.json();
    
    if (parsedData.error) {
      console.error("Error fetching test audio:", parsedData.error);
      return;
    }
    
    // Use the presigned URL directly
    setTestAudioURL(parsedData.audioUrl);
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
