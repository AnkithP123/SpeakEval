"use client";

import { useState } from "react";
import { FaFrownOpen, FaFrown, FaMeh, FaSmile, FaGrin } from "react-icons/fa";
import { toast } from "react-toastify";
import Card from "../components/Card";
import tokenManager from "../utils/tokenManager";

export const FeedbackForm = ({ compact = false, onSubmitted }) => {
  const [selectedFace, setSelectedFace] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const faces = [
    { id: 1, icon: <FaFrownOpen />, color: "#c80707" },
    { id: 2, icon: <FaFrown />, color: "#f24838" },
    { id: 3, icon: <FaMeh />, color: "#ffd700" },
    { id: 4, icon: <FaSmile />, color: "#46f238" },
    { id: 5, icon: <FaGrin />, color: "#05b505" },
  ];

  const handleFaceClick = (id) => {
    setSelectedFace(id);
  };

  const handleSubmit = async () => {
    console.log("handleSubmit");
    // Use the new token system for retrieving name and code
    let name = null;
    let code = null;

    try {
      // Attempt import (dynamically, for SSR/CSR compatibility)
      const info = tokenManager.getStudentInfo();
      console.log("info:", info);
      name = info.participant;
      code = info.roomCode;
    } catch (e) {
      // fallback for environments where require isn't available; use window object if possible
      if (window && window.tokenManager) {
        const info = tokenManager.getStudentInfo();
        console.log("info:", info);
        name = info.participant;
        code = info.roomCode;
      }
    }

    console.log("name:", name);
    console.log("code:", code);

    if (!name || !code) {
      toast.error("Missing name or code token");
      return;
    }

    console.log("feedback:", feedback);

    try {
      setSubmitting(true);
      const response = await fetch(
        `https://www.server.speakeval.org/submit_feedback?name=${name}&code=${code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedback: `${feedback} (Rating: ${selectedFace})`,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.message || data.success)) {
        toast.success("Feedback submitted successfully");
        setSubmitted(true);
        if (onSubmitted) onSubmitted();
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Error submitting feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${compact ? "" : "container h-screen"} flex justify-center items-center`}>
        <Card className={`text-center ${compact ? "w-full max-w-md" : ""}`}>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl">
            Your feedback has been submitted successfully.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${compact ? "" : "container h-screen"} flex justify-center items-center`}>
      <Card className={`w-full ${compact ? "max-w-md" : "max-w-lg"}`}>
        <h1 className="text-3xl font-bold mb-8 text-center">Feedback</h1>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            How was your experience?
          </h2>
          <div className="flex justify-center space-x-4">
            {faces.map((face) => (
              <button
                key={face.id}
                className={`text-4xl transition-transform duration-200 ${
                  selectedFace === face.id ? "transform scale-125" : ""
                }`}
                style={{
                  color: selectedFace === face.id ? face.color : "gray",
                }}
                onClick={() => handleFaceClick(face.id)}
              >
                {face.icon}
              </button>
            ))}
          </div>
          <textarea
            className="w-full h-32 p-2 bg-gray-700 text-white rounded-lg resize-none"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.substring(0, 500))}
            placeholder="Enter additional feedback here..."
          />
          <div className="text-right text-sm text-gray-400">
            {feedback.length}/500
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedFace}
            className={`btn btn-primary w-full ${submitting || !selectedFace ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Submit
          </button>
        </div>
      </Card>
    </div>
  );
};

const FeedbackPage = () => {
  return <FeedbackForm compact={false} />;
};

export default FeedbackPage;
