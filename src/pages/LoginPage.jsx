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
  const [currentStep, setCurrentStep] = useState(1); // Track registration steps
  
  // New state for teacher verification
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [proofType, setProofType] = useState(''); // 'id' or 'website'
  const [teacherId, setTeacherId] = useState(null);
  const [schoolWebsite, setSchoolWebsite] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);

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
    if (!usernameInput || !password || (isRegister && !email)) {
      toast.error('Please fill in all required fields.');
      return false;
    }

    if (isRegister && !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    if (isRegister) {
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

  const validateTeacherInfo = () => {
    if (!fullName || !school || !schoolAddress) {
      toast.error('Please fill in all teacher information fields.');
      return false;
    }

    if (!proofType) {
      toast.error('Please select a verification method.');
      return false;
    }

    if (proofType === 'id' && !teacherId) {
      toast.error('Please upload your teacher ID.');
      return false;
    }

    if (proofType === 'website' && !schoolWebsite) {
      toast.error('Please provide the school website link.');
      return false;
    }

    return true;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Update handleFileUpload to convert file to base64
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be less than 15MB');
        return;
      }
      try {
        const base64String = await fileToBase64(file);
        setTeacherId(base64String);
      } catch (error) {
        console.error('File conversion error:', error);
        toast.error('Error processing the image. Please try again.');
      }
    }
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
      setCurrentStep(2);
    }
  };

  const handleTeacherInfoSubmit = async () => {
    if (!validateTeacherInfo()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      const verificationData = {
        email,
        username: usernameInput,
        password,
        fullName,
        school,
        schoolAddress,
        proofType,
      };

      if (proofType === 'id' && teacherId) {
        verificationData.teacherId = teacherId;
      } else if (proofType === 'website') {
        verificationData.schoolWebsite = schoolWebsite;
      }
      console.log(verificationData);
      const res = await fetch('https://www.server.speakeval.org/verification', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });
      console.log(res);
      const data = await res.json();
      console.log(data);

      if (res.status !== 200 || !data.success) {
        toast.error(data.error || 'Verification failed. Please try again.');
        return;
      }

      const registerRes = await fetch('https://www.server.speakeval.org/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: usernameInput, password })
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
    } catch (err) {
      console.error('Registration Error:', err);
      toast.error('Failed to submit teacher information. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (currentStep === 1) {
        handleLogin();
      } else if (currentStep === 2) {
        handleTeacherInfoSubmit();
      }
    }
  };

  const renderProofModal = () => {
    if (!showProofModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Select Verification Method</h3>
          <div className="proof-options">
            <div className="proof-option" onClick={() => {
              setProofType('id');
              setShowProofModal(false);
            }}>
              <h4>Upload Teacher ID</h4>
              <p>Upload an image of your school-issued teacher ID</p>
            </div>
            <div className="proof-option" onClick={() => {
              setProofType('website');
              setShowProofModal(false);
            }}>
              <h4>Provide School Website</h4>
              <p>Provide a link to your school's staff directory</p>
            </div>
          </div>
          <button className="close-modal" onClick={() => setShowProofModal(false)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`login-container ${shake ? 'shake' : ''}`}>
      <div className="login-title">{isRegister ? 'Register' : 'Log In'}</div>
      
      {currentStep === 1 && (
        <>
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
      )}

      {currentStep === 2 && (
        <>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="login-input"
            placeholder="Full Name"
            onKeyUp={handleKeyPress}
          />
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="login-input"
            placeholder="School Name"
            onKeyUp={handleKeyPress}
          />
          <input
            type="text"
            value={schoolAddress}
            onChange={(e) => setSchoolAddress(e.target.value)}
            className="login-input"
            placeholder="School Address"
            onKeyUp={handleKeyPress}
          />
          <button 
            className="proof-select-button"
            onClick={() => setShowProofModal(true)}
          >
            {proofType ? 'Change Verification Method' : 'Select Verification Method'}
          </button>

          {proofType === 'id' && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-input"
            />
          )}

          {proofType === 'website' && (
            <input
              type="url"
              value={schoolWebsite}
              onChange={(e) => setSchoolWebsite(e.target.value)}
              className="login-input"
              placeholder="School Website Staff Directory URL"
              onKeyUp={handleKeyPress}
            />
          )}

          <button onClick={handleTeacherInfoSubmit} className="login-button">
            Submit
          </button>
          <button 
            onClick={() => setCurrentStep(1)} 
            className="back-button"
          >
            Back
          </button>
        </>
      )}

      {renderProofModal()}
    </div>
  );
}

export default LoginPage;