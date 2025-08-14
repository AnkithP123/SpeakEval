"use client";

import { useState, useEffect } from "react";
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
import { useRealTimeCommunication } from "../hooks/useRealTimeCommunication";

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
  const [rejoinData, setRejoinData] = useState(null);
  const [checkingRejoin, setCheckingRejoin] = useState(true);
  const navigate = useNavigate();
  
  // Real-time communication
  const { 
    isConnected, 
    connectionStatus,
    connectForJoin,
    on: onWebSocketEvent, 
    off: offWebSocketEvent,
    getStudentToken,
    getCurrentRoom,
    getCurrentParticipant
  } = useRealTimeCommunication();

  // Check for existing token and validate it for rejoin
  useEffect(() => {
    const checkForRejoin = async () => {
      try {
        const existingToken = tokenManager.getStudentToken();
        
        if (!existingToken) {
          setCheckingRejoin(false);
          return;
        }

        console.log('🔍 Checking for existing token for rejoin...');
        
        // Validate the token with the server
        const response = await fetch(`https://www.server.speakeval.org/validate_token?token=${existingToken}`);
        const data = await response.json();
        
        if (data.valid) {
          console.log('✅ Valid token found for rejoin:', data);
          setRejoinData(data);
        } else {
          console.log('❌ Token validation failed:', data.error);
          // Clear invalid token
          tokenManager.clearStudentToken();
        }
      } catch (error) {
        console.error('Error checking for rejoin:', error);
      } finally {
        setCheckingRejoin(false);
      }
    };

    checkForRejoin();

    // Cleanup function
    return () => {
      // Clean up WebSocket event listeners
      offWebSocketEvent('join_room_success', handleJoinSuccess);
      offWebSocketEvent('join_room_error', handleJoinError);
      offWebSocketEvent('connection_error', handleConnectionError);
      offWebSocketEvent('reconnect_success', handleReconnectSuccess);
      offWebSocketEvent('reconnect_error', handleReconnectError);
      offWebSocketEvent('kicked', handleKicked);
    };
  }, []);

  const handleRejoin = async () => {
    if (!rejoinData) return;
    
    setLoading(true);
    
    try {
      console.log('🔄 Attempting to rejoin room:', rejoinData.roomCode);
      
      // Connect using the existing token
      await connectForJoin(rejoinData.roomCode, rejoinData.participant);
      
      // Navigate directly to the room
      navigate(`/room/${rejoinData.roomCode}`);
      
    } catch (error) {
      console.error('Error rejoining room:', error);
      toast.error('Failed to rejoin room. Please try joining again.');
      setLoading(false);
    }
  };

  // WebSocket event handlers - defined outside to be accessible in cleanup
  const handleJoinSuccess = (payload) => {
    console.log('✅ Join room successful:', payload);
    
    // Store the JWT token and session info
    const token = payload.token;
    const roomCode = Number.parseInt(code.toString() + "001");
    const participantName = useGoogle ? googleName : name;
    
    console.log('🔍 Storing token:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      tokenLength: token ? token.length : 0
    });
    
    tokenManager.setStudentToken(token);
    tokenManager.setRoomSession({
      roomCode: roomCode,
      participantName: participantName,
      timestamp: Date.now()
    });
    
    console.log("Stored token and session info");
    console.log('🔍 TokenManager state after storage:', {
      isAuthenticated: tokenManager.isAuthenticated(),
      studentInfo: tokenManager.getStudentInfo(),
      roomSession: tokenManager.getRoomSession()
    });
    
    // Navigate to room
    navigate(`/room/${roomCode}`);
  };
  
  const handleJoinError = (payload) => {
    console.log('❌ Join room failed:', payload);
    toast.error(payload.message || "Failed to join room");
    setLoading(false);
  };
  
  const handleConnectionError = (payload) => {
    console.log('❌ Connection error:', payload);
    toast.error(payload.message || "Connection failed");
    setLoading(false);
  };

  const handleReconnectSuccess = (payload) => {
    console.log('✅ Reconnect success:', payload);
    // Silently handle reconnection success - no user notification needed
  };

  const handleReconnectError = (payload) => {
    console.error('❌ Reconnect error:', payload);
    const errorMessage = payload.message || "Failed to reconnect to the room";
    toast.error(errorMessage);
    setLoading(false);
  };

  const handleKicked = (payload) => {
    console.log('🚫 Kicked from room:', payload);
    const kickReason = payload.reason || "You have been removed from the room";
    toast.error(kickReason);
    
    // Clear session data
    if (typeof tokenManager !== 'undefined' && tokenManager.clearSession) {
      tokenManager.clearSession();
    }
    
    // Redirect to join page
    setTimeout(() => {
      window.location.href = "/join";
    }, 3000);
  };

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

      try {
        // Check if we have a stored token for reconnection
        const existingToken = tokenManager.getStudentToken();
        
        if (existingToken) {
          console.log('🔄 Reconnecting with existing token...');
          // For reconnection, we'll use the token-based connection
          // But since this is the join page, we should do a fresh join
          console.log('🔄 Fresh join requested on join page');
        }
        
        // Add event listeners
        console.log('🎧 Adding event listeners...');
        onWebSocketEvent('join_room_success', handleJoinSuccess);
        onWebSocketEvent('join_room_error', handleJoinError);
        onWebSocketEvent('connection_error', handleConnectionError);
        onWebSocketEvent('reconnect_success', handleReconnectSuccess);
        onWebSocketEvent('reconnect_error', handleReconnectError);
        onWebSocketEvent('kicked', handleKicked);
        
        // Connect and join room in one step
        console.log('📤 Connecting and joining room...');
        await connectForJoin(roomCode, participantName, useGoogle, email);
        
        console.log('📤 Join request sent');
        
      } catch (error) {
        console.error('❌ Failed to connect and join:', error);
        toast.error("Failed to connect to server");
        setLoading(false);
      }
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
        

        
        {/* Rejoin Section */}
        {checkingRejoin ? (
          <div className="text-center text-white mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p>Checking for previous session...</p>
          </div>
        ) : rejoinData ? (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              🎉 Welcome back, {rejoinData.participant}!
            </h3>
            <p className="text-green-300 text-sm mb-3">
              You can rejoin room {rejoinData.roomCode.slice(0, -3)} where you left off.
            </p>
            <div className="text-xs text-green-300/70 mb-3">
              <p>Room Status: {rejoinData.roomStarted ? 'Started' : 'Waiting'}</p>
              {rejoinData.examStarted && (
                <p>Exam: In Progress (Question {rejoinData.currentQuestion + 1})</p>
              )}
            </div>
            <button
              onClick={handleRejoin}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              {loading ? "Rejoining..." : "Rejoin Room"}
            </button>
            <button
              onClick={() => {
                setRejoinData(null);
                tokenManager.clearStudentToken();
              }}
              className="w-full mt-2 bg-gray-500/50 hover:bg-gray-600/50 text-white text-sm py-1 px-3 rounded transition-all duration-300"
            >
              Start Fresh
            </button>
          </div>
        ) : null}
        
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
