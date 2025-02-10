import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css'; // Import the CSS file

function LoginPage({ set, setUltimate, setUsername, setPin }) {
  // Local state for the input fields
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // On mount, check for an existing token in localStorage.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally, decode the token to get the username.
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
      navigate(redirect || '/');
    }
  }, [navigate, redirect, setUsername]);

  const handleLogin = async () => {
    if (!usernameInput || !password || (isRegister && !email)) {
      toast.error('Please fill in all required fields.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (isRegister && !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (isRegister) {
      if (usernameInput.length < 3 || usernameInput.length > 20) {
      toast.error('Username must be between 3 and 20 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
      }

      if (password.length < 6 || password.length > 50) {
      toast.error('Password must be between 6 and 50 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
      }
    }

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister
        ? { email, username: usernameInput, password }
        : { username: usernameInput, password };

      const res = await fetch(`https://www.server.speakeval.org${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status !== 200) {
        toast.error(data.error || 'Error occurred');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (data.token) {
        // Save token and username in localStorage to persist login
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', usernameInput);

        // Call the passed-in setters:
        console.log('Set Username: ', setUsername);
        setUsername(usernameInput);
        setPin(data.token); // or data.pin if your backend returns one
        // If your backend returns a subscription property, set it here:
        if (data.subscription) {
          // For example, set 'set' to true if the subscription is not free,
          // and setUltimate to true if it equals 'Ultimate'
          set(data.subscription !== 'free');
          setUltimate(data.subscription === 'Ultimate');
        } else {
          // Otherwise, you may default to free
          set(false);
          setUltimate(false);
        }

        navigate(redirect || '/');
      } else if (!isRegister) {
        toast.error('Unexpected error. Please try again.');
      }
      if (data.message) {
        toast.success(data.message);
      }

      if (isRegister) {
        navigate('/verify?email=' + encodeURIComponent(email));
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

  return (
    <div className={`login-container ${shake ? 'shake' : ''}`}>
      <div className="login-title">{isRegister ? 'Register' : 'Log In'}</div>
      {isRegister && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          placeholder="Enter Email"
          onKeyUp={handleKeyPress}
        />
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
        {isRegister ? 'Register' : 'Log In'}
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
    </div>
  );
}

export default LoginPage;
