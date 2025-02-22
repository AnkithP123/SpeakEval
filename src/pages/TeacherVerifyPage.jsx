"use client"

import { useState, useEffect } from "react"
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
        return;
      }

      toast.success('Teacher information submitted successfully!');
      navigate('/login');

    } catch (err) {
      console.error('Registration Error:', err);
      toast.error('Failed to submit teacher information. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
          
        </>
        {renderProofModal()}
        </div>
  )
}

export default TeacherVerifyPage

