import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CreateRoom.css'; // Optional for styling like shake animation

function LoginPage({ set, setUltimate, setUsername, setPin }) {
  const [userId, setUserId] = useState('');
  const [shake, setShake] = useState(false); // Shake effect for incorrect input
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const redirect = searchParams.get('redirect');


  const handleInputChange = (e) => {
    setUserId(e.target.value.toUpperCase());
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`);
      const data = await res.json();

      if (data.code === 401) {
        toast.error('Incorrect Teacher Pin');
        setShake(true); // Trigger shake animation
        setTimeout(() => setShake(false), 500);
        setUserId('');
        return;
      }

      if (data.subscription) {
        set(data.subscription !== 'free');
        setUltimate(data.subscription === 'Ultimate');
    }


      if (data.code === 200 && data.name) {
        setUsername(data.name);
        setPin(userId);
        localStorage.setItem('username', data.name);
        localStorage.setItem('pin', userId);
        navigate(redirect || '/');
      } else {
        toast.error('Unexpected error. Please try again.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      toast.error('Failed to connect. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const containerStyle = {
    position: 'relative',
    padding: '10px 20px',
    borderRadius: '10px',
    backgroundColor: 'white',
    color: 'white',
    fontFamily: "sans-serif",
    fontSize: '18px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    maxWidth: '300px',
    margin: '20px auto',
    textAlign: 'center',
  };

  const inputStyle = {
      width: 'calc(100% - 50px)',
      padding: '10px',
      border: 'none',
      backgroundColor: 'transparent',
      color: 'black',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      textAlign: 'center',
      outline: 'none',
      letterSpacing: '2px',
      marginRight: '10px',
  };

  const buttonStyle = {
      backgroundColor: 'black',
      border: 'none',
      color: 'white',
      padding: '5px 10px',
      textAlign: 'center',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      margin: '4px 2px',
      cursor: 'pointer',
      borderRadius: '5px',
  };

  const chipStyle = {
      display: 'inline-block',
      padding: '5px 10px',
      margin: '5px',
      borderRadius: '15px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      fontSize: '14px',
      cursor: 'pointer',
  };


  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: 'black',
  };
  
  return (
    <div>
        <div style={containerStyle} className={shake ? 'shake' : ''}>
            <input
                type="password"
                value={userId}
                onChange={handleInputChange}
                style={inputStyle}
                maxLength={30}
                placeholder="Enter Teacher Pin"
                onKeyUp={handleKeyPress}
            />
            <button onClick={handleLogin} style={buttonStyle}>Log In</button>
        </div>
    </div>
  );
}

export default LoginPage;
