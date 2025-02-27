"use client"

import { useState } from "react"
import { FaFrownOpen, FaFrown, FaMeh, FaSmile, FaGrin } from "react-icons/fa"
import { toast } from "react-toastify"
import Card from "../components/Card"

const FeedbackPage = () => {
  const [selectedFace, setSelectedFace] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const faces = [
    { id: 1, icon: <FaFrownOpen />, color: '#c80707' },
    { id: 2, icon: <FaFrown />, color: '#f24838' },
    { id: 3, icon: <FaMeh />, color: '#ffd700' },
    { id: 4, icon: <FaSmile />, color: '#46f238' },
    { id: 5, icon: <FaGrin />, color: '#05b505' },
]

  const handleFaceClick = (id) => {
    setSelectedFace(id)
  }

  const handleSubmit = async () => {
    const params = new URLSearchParams(window.location.search)
    const name = params.get("name")
    const code = params.get("code")

    if (!name || !code) {
      toast.error("Missing name or code in URL")
      return
    }

    try {
      const response = await fetch(`https://www.server.speakeval.org/submit_feedback?name=${name}&code=${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback: `${feedback} (Rating: ${selectedFace})` }),
      })

      if (response.ok) {
        toast.success("Feedback submitted successfully")
        setSubmitted(true)
      } else {
        throw new Error("Failed to submit feedback")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Error submitting feedback")
    }
  }

  if (submitted) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <Card className="text-center">
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl">Your feedback has been submitted successfully.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex justify-center items-center h-screen">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Feedback</h1>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">How was your experience?</h2>
          <div className="flex justify-center space-x-4">
            {faces.map((face) => (
              <button
                key={face.id}
                className={`text-4xl transition-transform duration-200 ${selectedFace === face.id ? "transform scale-125" : ""}`}
                style={{ color: selectedFace === face.id ? face.color : "gray" }}
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
          <div className="text-right text-sm text-gray-400">{feedback.length}/500</div>
          <button onClick={handleSubmit} className="btn btn-primary w-full">
            Submit
          </button>
        </div>
      </Card>
    </div>
  )
}

export default FeedbackPage

