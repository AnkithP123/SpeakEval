import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaGraduationCap, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import '../styles/ClassroomLogin.css';

const ClassroomLogin = ({ initialTab = 'login' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'signup'
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'login') {
      // Login validation
      if (!username || !password) {
        showError('Please fill in all fields');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
    } else {
      // Signup validation
      if (!fullName || !username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let response;
      let data;

      if (activeTab === 'login') {
        // Login request
        response = await fetch('https://www.server.speakeval.org/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });
        data = await response.json();
        console.log('Login response:', data); // Debug log

        if (!response.ok) {
          console.error('Login failed with status:', response.status, 'Error:', data);
          throw new Error(data.error || 'Login failed');
        }
        
        // Store user info and token for both teachers and students
        localStorage.setItem('classroom_user', JSON.stringify({
          username: data.username,
          userType: data.userType,
          isAuthenticated: true
        }));
        localStorage.setItem('classroom_token', data.token);
        
        // Also store main site authentication for teachers
        if (data.userType === 'teacher') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
        }
        
        showSuccess(`Welcome ${data.userType === 'student' ? 'Student' : 'Teacher'} ${data.username}!`);
        
        // Dispatch custom event to update navbar
        window.dispatchEvent(new CustomEvent('userUpdated'));
      } else {
        // Signup request
        response = await fetch('https://www.server.speakeval.org/classroom/student/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            username,
            email,
            password
          })
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        
        // Store user info and token
        localStorage.setItem('classroom_user', JSON.stringify({
          username: data.username,
          fullName: data.fullName,
          email: email,
          userType: 'student',
          isAuthenticated: true
        }));
        localStorage.setItem('classroom_token', data.token);
        
        showSuccess(`Welcome ${data.fullName}! Account created successfully.`);
        
        // Dispatch custom event to update navbar
        window.dispatchEvent(new CustomEvent('userUpdated'));
      }
      
      navigate('/classroom');
    } catch (error) {
      console.error('Login/Signup error:', error); // Debug log
      showError(error.message || `${activeTab === 'login' ? 'Login' : 'Registration'} failed. Please try again.`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // Choose endpoint based on active tab
      const endpoint = activeTab === 'login' 
        ? 'https://www.server.speakeval.org/login-google'
        : 'https://www.server.speakeval.org/signup-google';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ googleId: credentialResponse })
      });

      const data = await response.json();
      console.log(`Google ${activeTab} response:`, data); // Debug log

      if (!response.ok) {
        console.error(`Google ${activeTab} failed with status:`, response.status, 'Error:', data);
        throw new Error(data.error || `Google ${activeTab} failed`);
      }
      
      // Store user info and token for both teachers and students
      localStorage.setItem('classroom_user', JSON.stringify({
        username: data.username,
        fullName: data.fullName || data.username,
        email: data.email,
        userType: data.userType,
        isAuthenticated: true,
        googleAuth: true
      }));
      localStorage.setItem('classroom_token', data.token);
      
      // Also store main site authentication for teachers
      if (data.userType === 'teacher') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
      }
      
      const action = activeTab === 'login' ? 'Signed in' : 'Account created and signed in';
      showSuccess(`Welcome ${data.userType === 'student' ? 'Student' : 'Teacher'}! ${action} with Google`);
      
      // Dispatch custom event to update navbar
      window.dispatchEvent(new CustomEvent('userUpdated'));
      
      navigate('/classroom');
    } catch (error) {
      console.error(`Google ${activeTab} error:`, error); // Debug log
      showError(error.message || `Google ${activeTab} failed. Please try again.`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    showError('Google sign-in failed. Please try again.');
  };

  return (
    <div className="classroom-login-container">
      {/* Background Elements */}
      <div className="classroom-login-bg">
        <div className="classroom-login-orb classroom-login-orb-1"></div>
        <div className="classroom-login-orb classroom-login-orb-2"></div>
        <div className="classroom-login-orb classroom-login-orb-3"></div>
      </div>

      {/* Main Content */}
      <div className="classroom-login-content">
        <div className={`classroom-login-card ${shake ? 'shake' : ''}`}>
          <div className="classroom-login-card-header">
            <h1 className="classroom-login-title">
              {activeTab === 'login' ? 'Login' : 'Student Signup'}
            </h1>
            <p className="classroom-login-subtitle">
              {activeTab === 'login' 
                ? 'Sign in to access your classes and assignments' 
                : 'Create a new student account to join classes'
              }
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="classroom-login-type-toggle">
            <button
              type="button"
              className={`classroom-login-type-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              <FaSignInAlt className="mr-2" />
              Login
            </button>
            <button
              type="button"
              className={`classroom-login-type-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              <FaUserPlus className="mr-2" />
              Signup
            </button>
          </div>

          {/* Google Sign-in */}
          <div className="classroom-login-google-section">
            <GoogleOAuthProvider clientId="932508417487-hnjgjd5qsh5ashbhuem1hegtfghnn2i4.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="dark"
                size="large"
                text={activeTab === 'login' ? 'signin_with' : 'signup_with'}
                shape="rectangular"
                width="100%"
              />
            </GoogleOAuthProvider>
            <div className="classroom-login-divider">
              <span className="classroom-login-divider-text">or</span>
            </div>
          </div>

          {/* Login/Signup Form */}
          <form className="classroom-login-form" onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <div className="classroom-login-input-group">
                <label className="classroom-login-label">Full Name</label>
                <input
                  type="text"
                  className="classroom-login-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="classroom-login-input-group">
              <label className="classroom-login-label">
                {activeTab === 'login' ? 'Username or Email' : 'Username'}
              </label>
              <input
                type="text"
                className="classroom-login-input"
                placeholder={activeTab === 'login' ? 'Enter your username or email' : 'Choose a username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {activeTab === 'signup' && (
              <div className="classroom-login-input-group">
                <label className="classroom-login-label">Email</label>
                <input
                  type="email"
                  className="classroom-login-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="classroom-login-input-group">
              <label className="classroom-login-label">Password</label>
              <input
                type="password"
                className="classroom-login-input"
                placeholder={activeTab === 'login' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {activeTab === 'signup' && (
              <div className="classroom-login-input-group">
                <label className="classroom-login-label">Confirm Password</label>
                <input
                  type="password"
                  className="classroom-login-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              className="classroom-login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="classroom-login-spinner"></span>
                  {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                activeTab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="classroom-login-links">
            {activeTab === 'login' && (
              <Link to="/classroom/forgot-password" className="classroom-login-link">
                Forgot password?
              </Link>
            )}
            <Link to="/login" className="classroom-login-link">
              Are you a teacher? Click here
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="classroom-login-footer">
        <div className="classroom-login-footer-content">
          <div className="classroom-login-footer-logo">
            <FaGraduationCap className="classroom-login-footer-icon" />
            <span>SpeakEval</span>
          </div>
          <div className="classroom-login-footer-text">
            <p>Created by Ankith P and Nikunj B</p>
            <p>© 2025 SpeakEval. All rights reserved.</p>
          </div>
          <div className="classroom-login-footer-links">
            <a href="/features" className="classroom-login-footer-link">
              Features
            </a>
            <a href="/about" className="classroom-login-footer-link">
              About
            </a>
            <a href="/support" className="classroom-login-footer-link">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomLogin;