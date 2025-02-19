import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as jwtDecode from 'jwt-decode';
import { googleLogout, GoogleLogin } from '@react-oauth/google';

function JoinRoom() {
  const [name, setName] = useState('');
  const [code, setRoomCode] = useState('');
  const [google, setGoogle] = useState(false);
  const [ending, setEnding] = useState('');
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [email, setEmail] = useState(undefined);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    setLoading(true);
    const roomCode = parseInt(code.toString() + '001');
    const participantName = useGoogle ? googleName : name;

    if (participantName && roomCode) {
      console.log('Joining room with name:', participantName, 'and room code:', roomCode);
      let res = await fetch(`https://www.server.speakeval.org/join_room?code=${roomCode}&participant=${participantName}${useGoogle ? `&email=${email}` : ''}`);
      let parsedData = await res.json();
      setLoading(false);
      if (parsedData.error) {
        toast.error(parsedData.message);
        return navigate('/join-room');
      }
      console.log(parsedData);
      console.log(`/room/${roomCode}?name=${participantName}&uuid=${parsedData.participant.id}`);
      navigate(`/room/${roomCode}?name=${participantName}&uuid=${parsedData.participant.id}`);
    } else {
      setLoading(false);
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

  const handleGoogleSuccess = (response) => {
    console.log('Google sign-in successful:', response);
    try {
      const decoded = jwtDecode.jwtDecode(response.credential);
      console.log('Google sign-in successful:', decoded);
      if (decoded.email.endsWith(ending)) {
        setGoogleName(decoded.name);
        setEmail(decoded.email);
        setUseGoogle(true);
      } else {
        toast.error(`Email must end with ${ending}`);
      }
    } catch (err) {
      console.error('Error decoding Google token:', err);
      toast.error('Error decoding Google token. Please try again.');
    }
  };

  const handleGoogleFailure = (response) => {
    console.log('Google sign-in failed:', response);
    toast.error('Google sign-in failed. Please try again.');
  };

  const handleGoogleLogout = () => {
    setGoogleName('');
    setUseGoogle(false);
    googleLogout();
  };

  const handleNextStep = async () => {
    setLoading(true);
    // Verify room code here
    let res = await fetch(`https://www.server.speakeval.org/verify_room_code?code=${code}`);
    let parsedData = await res.json();
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
      toast.error('Invalid room code. Please try again.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center mt-[4.5%]">
      <title hidden>Join Room</title>
      <div className="w-[400px] bg-white rounded-lg shadow-lg flex flex-col items-center p-8">
        <h2 className="text-3xl font-bold mb-8">Join Room</h2>
        {step === 1 ? (
          <div className="w-full mb-4">
            <label className="block text-lg font-semibold mb-2" htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={code}
              onChange={handleRoomCodeChange}
              maxLength="11"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter room code"
              disabled={loading}
              onKeyUp={(e) => { if (e.key === 'Enter') handleNextStep(); }}
            />
            <button
              onClick={handleNextStep}
              className={`w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mt-4`}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Next'}
            </button>
          </div>
        ) : (
          <div className="w-full mb-8">
            {useGoogle ? (
              <div className="w-full mb-8 text-center">
                <p className="text-lg font-semibold mb-2">Signed in as {googleName}</p>
                {!loading && (
                  <button
                    onClick={handleGoogleLogout}
                    className="w-full p-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full mb-8">
                {!google ? (
                  <div>
                  <label className="block text-lg font-semibold mb-2" htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    maxLength="20"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter your name"
                    onKeyUp={(e) => { if (e.key === 'Enter') handleJoin(); }}
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
              className={`w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Join'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="932508417487-hnjgjd5qsh5ashbhuem1hegtfghnn2i4.apps.googleusercontent.com">
      <JoinRoom />
    </GoogleOAuthProvider>
  );
}

export default App;
