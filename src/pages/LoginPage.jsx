import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css';

function LoginPage({ set, setUltimate, setUsername, setPin }) {
  // Local state for the input fields
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [shake, setShake] = useState(false);
  const [fullName, setFullName] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
      navigate(redirect || '/');
    }
  }, [navigate, redirect, setUsername]);

  const validateInitialInputs = () => {
    if (!usernameInput || !password || (isRegister && !email && !fullName)) {
      toast.error('Please fill in all required fields.');
      return false;
    }

    if (isRegister && !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    if (isRegister) {
      if(fullName.length < 3 || fullName.length > 50) {
        toast.error('Full name must be between 3 and 50 characters.');
        return false;
      }
      if (usernameInput.length < 3 || usernameInput.length > 20) {
        toast.error('Username must be between 3 and 20 characters.');
        return false;
      }

      if (password.length < 6 || password.length > 50) {
        toast.error('Password must be between 6 and 50 characters.');
        return false;
      }
    }
    return true;
  };


  
  const handleLogin = async () => {
    if (!validateInitialInputs()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!isRegister) {
      // Handle normal login
      try {
        const res = await fetch('https://www.server.speakeval.org/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password })
        });

        const data = await res.json();

        if (res.status !== 200) {
          toast.error(data.error || 'Error occurred');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }

        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', usernameInput);
          setUsername(usernameInput);
          setPin(data.token);
          if (data.subscription) {
            set(data.subscription !== 'free');
            setUltimate(data.subscription === 'Ultimate');
          } else {
            set(false);
            setUltimate(false);
          }
          navigate(redirect || '/');
        }
      } catch (err) {
        console.error('Login Error:', err);
        toast.error('Failed to connect. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else {
      const registerRes = await fetch('https://www.server.speakeval.org/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName: fullName, username: usernameInput, password })
      });

      const registerData = await registerRes.json();

      if (registerRes.status !== 200) {
        toast.error(registerData.error || 'Error occurred');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (registerData.message) {
        toast.success(registerData.message);
      }

      navigate('/verify?email=' + encodeURIComponent(email));
    }
  };


  const handleKeyPress = (e) => {
  };


  return (
    <div className={`login-container ${shake ? 'shake' : ''}`}>
      <div className="login-title">{isRegister ? 'Register' : 'Log In'}</div>
        <>
          {isRegister && (
            <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="Enter Email"
              onKeyUp={handleKeyPress}
            />
            <input
              type="full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="login-input"
              placeholder="Enter your full name"
              onKeyUp={handleKeyPress}
            />
            </>
          )}
          <input
            type="text"
            name="username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="login-input"
            placeholder="Enter Username"
            onKeyUp={handleKeyPress}
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="Enter Password"
            onKeyUp={handleKeyPress}
          />
          <button onClick={handleLogin} className="login-button">
            {isRegister ? 'Next' : 'Log In'}
          </button>
          <div>
            <span
              className="login-toggle"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? 'Already have an account? Log In'
                : 'Need to register? Sign Up'}
            </span>
          </div>
        </>

    </div>
  );
}

export default LoginPage;