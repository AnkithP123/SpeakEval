"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as jwtDecode from "jwt-decode";
import {
  googleLogout,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import Card from "../components/Card";
import "../styles/globals.css";
import tokenManager from "../utils/tokenManager";

function JoinRoomContent() {
  const [name, setName] = useState("");
  const [code, setRoomCode] = useState("");
  const [google, setGoogle] = useState(false);
  const [ending, setEnding] = useState("");
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [email, setEmail] = useState(undefined);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    setLoading(true);
    const roomCode = Number.parseInt(code.toString() + "001");
    const participantName = useGoogle ? googleName : name;

    if (participantName && roomCode) {
      console.log(
        "Joining room with name:",
        participantName,
        "and room code:",
        roomCode
      );
      const res = await fetch(
        `https://www.server.speakeval.org/join_room?code=${roomCode}&participant=${participantName}${
          useGoogle ? `&email=${email}` : ""
        }`
      );
      const parsedData = await res.json();
      setLoading(false);
      if (parsedData.error) {
        toast.error(parsedData.message);
        return navigate("/join-room");
      }
      
      // Store the JWT token and session info
      const token = parsedData.participant.id;
      tokenManager.setStudentToken(token);
      tokenManager.setRoomSession({
        roomCode: roomCode,
        participantName: participantName,
        timestamp: Date.now()
      });
      
      console.log("Stored token and session info");
      console.log(parsedData);
      
      // Navigate to room without URL parameters
      navigate(`/room/${roomCode}`);
    } else {
      setLoading(false);
      console.log("Please fill out both fields.");
      toast.error("Please fill out all required fields.");
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

  const handleGoogleSuccess = (response) => {
    console.log("Google sign-in successful:", response);
    try {
      const decoded = jwtDecode.jwtDecode(response.credential);
      console.log("Google sign-in successful:", decoded);
      if (decoded.email.endsWith(ending)) {
        setGoogleName(decoded.name);
        setEmail(decoded.email);
        setUseGoogle(true);
      } else {
        toast.error(`Email must end with ${ending}`);
      }
    } catch (err) {
      console.error("Error decoding Google token:", err);
      toast.error("Error decoding Google token. Please try again.");
    }
  };

  const handleGoogleFailure = (response) => {
    console.log("Google sign-in failed:", response);
    toast.error("Google sign-in failed. Please try again.");
  };

  const handleGoogleLogout = () => {
    setGoogleName("");
    setUseGoogle(false);
    googleLogout();
  };

  const handleNextStep = async () => {
    setLoading(true);
    // Verify room code here
    const res = await fetch(
      `https://www.server.speakeval.org/verify_room_code?code=${code}`
    );
    const parsedData = await res.json();
    setLoading(false);
    if (parsedData.valid) {
      setStep(2);
      if (parsedData.google) {
        setGoogle(true);
      }
      if (parsedData.ending) {
        setEnding(parsedData.ending);
      }
    } else {
      toast.error("Invalid room code. Please try again.");
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center mt-[4.5%]">
      <title hidden>Join Room</title>
      <Card color="purple" className="w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Join Room
        </h2>
        {step === 1 ? (
          <div className="w-full mb-4 space-y-6">
            <div>
              <label
                className="block text-lg font-semibold mb-2 text-white"
                htmlFor="roomCode"
              >
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={code}
                onChange={handleRoomCodeChange}
                maxLength="11"
                className="w-full p-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter room code"
                disabled={loading}
                onKeyUp={(e) => {
                  if (e.key === "Enter") handleNextStep();
                }}
              />
            </div>
            <button
              onClick={handleNextStep}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              className={`w-full btn btn-primary bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30`}
              disabled={loading}
            >
              <span className="relative z-10">
                {loading ? "Loading..." : "Next"}
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {useGoogle ? (
              <div className="w-full mb-8 text-center">
                <p className="text-lg font-semibold mb-4 text-white">
                  Signed in as {googleName}
                </p>
                {!loading && (
                  <button
                    onClick={handleGoogleLogout}
                    className="w-full p-3 bg-red-500/70 hover:bg-red-600/70 text-white font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full">
                {!google ? (
                  <div>
                    <label
                      className="block text-lg font-semibold mb-2 text-white"
                      htmlFor="name"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      maxLength="20"
                      className="w-full p-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Enter your name"
                      onKeyUp={(e) => {
                        if (e.key === "Enter") handleJoin();
                      }}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center mt-4">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleFailure}
                        className="w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleJoin}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              className={`w-full relative overflow-hidden text-white text-base rounded-lg px-5 py-3 transition-all duration-300 ${
                hoverButton
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30"
                  : "bg-gradient-to-r from-purple-600/50 to-pink-700/50"
              }`}
              disabled={loading}
            >
              <span className="relative z-10">
                {loading ? "Loading..." : "Join"}
              </span>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function JoinRoom() {
  return (
    <GoogleOAuthProvider clientId="932508417487-hnjgjd5qsh5ashbhuem1hegtfghnn2i4.apps.googleusercontent.com">
      <JoinRoomContent />
    </GoogleOAuthProvider>
  );
}

export default JoinRoom;
