"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import './LoginPage.css'

function TeacherVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const emailFromParams = params.get("email")

  const [email, setEmail] = useState(emailFromParams || "")
  const [school, setSchool] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [proofType, setProofType] = useState(''); // 'id' or 'website'
  const [teacherId, setTeacherId] = useState(null);
  const [schoolWebsite, setSchoolWebsite] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams)
    }
  }, [emailFromParams])

  const validateTeacherInfo = () => {
    if (!school || !schoolAddress) {
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
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

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

  const handleTakePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64String = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    setTeacherId(base64String);
    setShowCameraModal(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please try again.');
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
              <h4>Show Teacher ID</h4>
              <p>Show an image of your school-issued teacher ID</p>
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

  const renderCameraModal = () => {
    if (!showCameraModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Take a Photo of Your ID</h3>
          <video ref={videoRef} width="100%" height="100%"></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          <button onClick={handleTakePhoto}>Capture Photo</button>
          <button className="close-modal" onClick={() => setShowCameraModal(false)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderImageModal = () => {
    if (!showImageModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
        <div className="modal-content">
          <img src={`data:image/jpeg;base64,${teacherId}`} alt="Teacher ID" />
          <button className="close-modal" onClick={() => setShowImageModal(false)}>
            Close
          </button>
        </div>
      </div>
    );
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

  const handleTeacherInfoSubmit = async () => {
    if (!validateTeacherInfo()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);

    try {
      const verificationData = {
        email,
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
        setIsLoading(false);
        return;
      }

      toast.success('Teacher information submitted successfully!');
      navigate('/login');

    } catch (err) {
      console.error('Registration Error:', err);
      toast.error('Failed to submit teacher information. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <>
        {!emailFromParams && (
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email Address"
            className="login-input"
          />
        )}
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
          <div className="proof-method">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-input"
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="proof-select-button">
              Upload Teacher ID
            </label>
            <div className="or-divider">OR</div>
            <button 
              className="camera-button"
              onClick={() => {
                setShowCameraModal(true);
                startCamera();
              }}
            >
              Take Photo
            </button>
            {teacherId && (
              <div className="proof-status">
                <img 
                  src={`data:image/jpeg;base64,${teacherId}`} 
                  alt="Teacher ID" 
                  className="proof-image"
                  onClick={() => setShowImageModal(true)}
                />
              </div>
            )}
          </div>
        )}

        {proofType === 'website' && (
          <div className="proof-method">
            <input
              type="url"
              value={schoolWebsite}
              onChange={(e) => setSchoolWebsite(e.target.value)}
              className="login-input"
              placeholder="School Website Staff Directory URL"
              onKeyUp={handleKeyPress}
            />
          </div>
        )}

        <button onClick={handleTeacherInfoSubmit} className="login-button" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
        
      </>
      {renderProofModal()}
      {renderCameraModal()}
      {renderImageModal()}
    </div>
  )
}

export default TeacherVerifyPage
