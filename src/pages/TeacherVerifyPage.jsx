"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./auth.css";

function TeacherVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const emailFromParams = params.get("email");

  const [email, setEmail] = useState(emailFromParams || "");
  const [school, setSchool] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [proofType, setProofType] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [schoolWebsite, setSchoolWebsite] = useState("");
  const [showProofModal, setShowProofModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Replace with this CSS class for the help link
  const helpLinkStyle = {
    color: "#4a90e2",
    textDecoration: "none",
    marginBottom: "15px",
    display: "block",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "14px",
    transition: "color 0.3s",
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams);
    }
  }, [emailFromParams]);

  const validateTeacherInfo = () => {
    if (!school || !schoolAddress) {
      toast.error("Please fill in all teacher information fields.");
      return false;
    }

    if (!proofType) {
      toast.error("Please select a verification method.");
      return false;
    }

    if (proofType === "id" && !teacherId) {
      toast.error("Please upload your teacher ID.");
      return false;
    }

    if (proofType === "website" && !schoolWebsite) {
      toast.error("Please provide the school website link.");
      return false;
    }

    return true;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File size must be less than 15MB");
        return;
      }
      try {
        const base64String = await fileToBase64(file);
        setTeacherId(base64String);
      } catch (error) {
        console.error("File conversion error:", error);
        toast.error("Error processing the image. Please try again.");
      }
    }
  };

  const handleTakePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const base64String = canvasRef.current
      .toDataURL("image/jpeg")
      .split(",")[1];
    setTeacherId(base64String);
    setShowCameraModal(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Unable to access camera. Please try again.");
    }
  };

  const handleTeacherInfoSubmit = async (e) => {
    e.preventDefault();
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
        ...(proofType === "id" ? { teacherId } : { schoolWebsite }),
      };

      const res = await fetch("https://www.server.speakeval.org/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verificationData),
      });

      const data = await res.json();

      if (res.status !== 200 || !data.success) {
        throw new Error(data.error || "Verification failed. Please try again.");
      }

      toast.success("Teacher information submitted successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Verification Error:", err);
      toast.error(
        err.message || "Failed to submit teacher information. Please try again."
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">Teacher Verification</h2>
        <form className="auth-form" onSubmit={handleTeacherInfoSubmit}>
          {!emailFromParams && (
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <input
            type="text"
            className="auth-input"
            placeholder="School Name"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
          />
          <input
            type="text"
            className="auth-input"
            placeholder="School Address"
            value={schoolAddress}
            onChange={(e) => setSchoolAddress(e.target.value)}
          />
          <button
            type="button"
            className="auth-button"
            onClick={() => setShowProofModal(true)}
          >
            {proofType
              ? "Change Verification Method"
              : "Select Verification Method"}
          </button>
          {proofType === "id" && (
            <div className="proof-method">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-input-label">
                Upload Teacher ID
              </label>
              <div className="mt-2">OR</div>
              <button
                type="button"
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
          {proofType === "website" && (
            <input
              type="url"
              className="auth-input"
              placeholder="School Website Staff Directory URL"
              value={schoolWebsite}
              onChange={(e) => setSchoolWebsite(e.target.value)}
            />
          )}
          <a
            href="mailto:info@speakeval.org?subject=Teacher Verification Help"
            style={helpLinkStyle}
            onMouseOver={(e) => (e.currentTarget.style.color = "#357abf")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#4a90e2")}
          >
            Need help? Contact us
          </a>
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : "Submit"}
          </button>
        </form>
      </div>

      {showProofModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="auth-title">Select Verification Method</h3>
            <div className="proof-options">
              <div
                className="proof-option"
                onClick={() => {
                  setProofType("id");
                  setShowProofModal(false);
                }}
              >
                <h4>Show Teacher ID</h4>
                <p>Show an image of your school-issued teacher ID</p>
              </div>
              <div
                className="proof-option"
                onClick={() => {
                  setProofType("website");
                  setShowProofModal(false);
                }}
              >
                <h4>Provide School Website</h4>
                <p>
                  Provide a link to your school's staff directory. The page must
                  have your name or email clearly visible on it
                </p>
              </div>
            </div>
            <button
              className="close-modal"
              onClick={() => setShowProofModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="auth-title">Take a Photo of Your ID</h3>
            <video ref={videoRef} width="100%" height="auto"></video>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            <button className="auth-button mt-4" onClick={handleTakePhoto}>
              Capture Photo
            </button>
            <button
              className="close-modal mt-2"
              onClick={() => setShowCameraModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content">
            <img
              src={`data:image/jpeg;base64,${teacherId}`}
              alt="Teacher ID"
              className="proof-image"
            />
            <button
              className="close-modal mt-4"
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherVerifyPage;
