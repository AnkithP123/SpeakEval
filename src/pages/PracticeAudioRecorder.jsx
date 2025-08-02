import React, { useState, useRef, useEffect } from "react"
import { Play, Square, RotateCcw, FastForward } from 'lucide-react'
import styled, { css, keyframes } from "styled-components"
import * as Tone from "tone"
import "../styles/globals2.css"
import tokenManager from "../utils/tokenManager"

const PulseButton = styled.button`
  animation: ${props => props.isRecording ? 'pulse 1.5s infinite' : 'none'};
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`

export default function PracticeAudioRecorder({ examData, onComplete }) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [recordings, setRecordings] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [displayTime, setDisplayTime] = useState("xx:xx")
  const [countdownDisplay, setCountdownDisplay] = useState(0)
  const [randomizeQuestions, setRandomizeQuestions] = useState(false)
  const [showTranscriptions, setShowTranscriptions] = useState(true)

  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const timerInterval = useRef(null)
  const questionAudioRef = useRef(null)
  const timer = useRef(0)
  const countdownRef = useRef(0)

  useEffect(() => {
    return () => {
      clearInterval(timerInterval.current)
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop()
      }
      if (questionAudioRef.current) {
        questionAudioRef.current.pause()
      }
    }
  }, [])

  const getExamData = () => {
    if (randomizeQuestions) {
      return { ...examData, questions: shuffle([...examData.questions]) }
    }
    return examData
  }

  const getRecordings = () => {
    if (randomizeQuestions) {
        return shuffle([...recordings])
    }
    return recordings
  }

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0")
    const seconds = (time % 60).toString().padStart(2, "0")
    return `${minutes}:${seconds}`
  }

  const startRecording = async () => {
    setIsRecording(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordings(prev => [...prev, { questionIndex: currentQuestionIndex, audioUrl }])
      }

      mediaRecorder.current.start()
      startTimer()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop()
    }
    setIsRecording(false)
    setDisplayTime("xx:xx")
    stopTimer()
  }

  const startTimer = () => {
    timer.current = 0
    timerInterval.current = setInterval(() => {
      timer.current += 1
      setDisplayTime(formatTime(timer.current))
      if (timer.current >= getExamData().timeLimit) {
        stopRecording()
      }
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(timerInterval.current)
  }

  const playQuestionAudio = async () => {
    if (isPlaying) return

    setIsPlaying(true)
    const audioUrl = getExamData().questions[currentQuestionIndex].audioUrl

    if (questionAudioRef.current) {
      questionAudioRef.current.src = audioUrl
      await questionAudioRef.current.play()
    }
  }

  const handleQuestionEnd = () => {
    setIsPlaying(false)
    countdownRef.current = getExamData().thinkingTime
    setCountdownDisplay(countdownRef.current)

    const countdownInterval = setInterval(() => {
      countdownRef.current -= 1
      setCountdownDisplay(countdownRef.current)
      if (countdownRef.current <= 0) {
        clearInterval(countdownInterval)
        startRecording()
      }
    }, 1000)
  }

  const handleQuestionChange = (direction) => {
    const newIndex = direction === 'next'
      ? Math.min(currentQuestionIndex + 1, getExamData().questions.length - 1)
      : Math.max(currentQuestionIndex - 1, 0)
    
    setCurrentQuestionIndex(newIndex)
    setIsPlaying(false)
    setIsRecording(false)
    setDisplayTime("00:00")
    stopTimer()
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop()
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause()
      questionAudioRef.current.currentTime = 0
    }
  }

  const pulse = keyframes`
      0% {
          transform: scale(1);
      }
      50% {
          transform: scale(1.1);
      }
      100% {
          transform: scale(1);
      }
          `
  

  const animation = (props) => css`
    ${pulse} 1.1s infinite;
`

  const uploadAllRecordings = async () => {
    // Check if student is authenticated
    if (!tokenManager.isAuthenticated()) {
      console.error("Not authenticated for practice exam");
      return;
    }

    const token = tokenManager.getStudentToken();
    const info = tokenManager.getStudentInfo();
    
    if (!info || info.type !== "practice_participant") {
      console.error("Invalid session for practice exam");
      return;
    }

    try {
      console.log("🚀 Starting batch upload of", recordings.length, "recordings...");
      
      // Step 1: Get presigned URLs for all recordings
      const uploadPromises = recordings.map(async (recording, index) => {
        try {
          // Convert audio URL to blob
          const response = await fetch(recording.audioUrl);
          const audioBlob = await response.blob();
          
          // Get presigned URL for this recording
          const urlResponse = await fetch(
            `https://www.server.speakeval.org/get-practice-upload-url?token=${token}&index=${recording.questionIndex}`,
            { method: "GET" }
          );
          
          if (!urlResponse.ok) {
            throw new Error(`Failed to get upload URL for question ${recording.questionIndex}`);
          }
          
          const { uploadUrl } = await urlResponse.json();
          
          // Upload directly to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: audioBlob,
            headers: {
              "Content-Type": "audio/wav",
            },
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload question ${recording.questionIndex}`);
          }
          
          console.log(`✅ Uploaded question ${recording.questionIndex}`);
          return { success: true, questionIndex: recording.questionIndex };
        } catch (error) {
          console.error(`❌ Failed to upload question ${recording.questionIndex}:`, error);
          return { success: false, questionIndex: recording.questionIndex, error: error.message };
        }
      });
      
      // Step 2: Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Step 3: Check results and notify server
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);
      
      if (failedUploads.length > 0) {
        console.error("Some uploads failed:", failedUploads);
        // Could implement retry logic here
      }
      
      if (successfulUploads.length > 0) {
        // Notify server that uploads are complete
        const notifyResponse = await fetch(
          `https://www.server.speakeval.org/notify-practice-uploads?token=${token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uploadedQuestions: successfulUploads.map(r => r.questionIndex),
              totalQuestions: recordings.length,
            }),
          }
        );
        
        if (notifyResponse.ok) {
          console.log("✅ All uploads completed and server notified");
        } else {
          console.error("Failed to notify server of upload completion");
        }
      }
      
      return successfulUploads.length === recordings.length;
    } catch (error) {
      console.error("Error in batch upload:", error);
      return false;
    }
  };

  const recordStyle = {
    background: "radial-gradient(circle at bottom, #ff0000 0%, #b20000 70%)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2)",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    margin: "0 auto",
    position: "relative",
    transition: "background 0.3s ease",
    animation: `${animation}`,
}


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-gray-900">
      <div className="glass-morphism p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">Practice Exam</h1>
        
        <div className="flex justify-between mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={randomizeQuestions}
              onChange={() => setRandomizeQuestions(!randomizeQuestions)}
              className="mr-2"
            />
            <span className="text-foreground">Randomize Questions</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showTranscriptions}
              onChange={() => setShowTranscriptions(!showTranscriptions)}
              className="mr-2"
            />
            <span className="text-foreground">Show Transcriptions</span>
          </label>
        </div>

        <div className="text-5xl font-bold text-center mb-8 text-primary neon-border p-4 rounded-lg">
          {displayTime}
        </div>

        <div className="flex justify-between mb-4">
          <button
            onClick={() => handleQuestionChange('previous')}
            disabled={currentQuestionIndex === 0}
            className="futuristic-button"
          >
            Previous
          </button>
          <span className="text-lg font-semibold text-foreground">
            Question {currentQuestionIndex + 1} of {getExamData().questions.length}
          </span>
          <button
            onClick={() => handleQuestionChange('next')}
            disabled={currentQuestionIndex === getExamData().questions.length - 1}
            className="futuristic-button"
          >
            Next
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-foreground">Question {currentQuestionIndex + 1}</h3>
          {showTranscriptions && (
            <p className="text-foreground mb-4">{getExamData().questions[currentQuestionIndex].transcription}</p>
          )}
        </div>

        {!isRecording && countdownDisplay === 0 && (
          <PulseButton
              onClick={playQuestionAudio}
              style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#28a745",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.3s",
                  margin: "0 auto",
                  animation: "none"
              }}
          >
              <Play size={24} color="white" fill="white" />
          </PulseButton>
        )}

        {isRecording && (
          <PulseButton onClick={stopRecording} style={recordStyle}>
                <Square size={24} color="white" fill="white" />
            </PulseButton>
        )}

        {isRecording && (
          <p className="mt-4 text-lg font-semibold text-accent text-center">Recording...</p>
        )}

        {isPlaying && (
          <p className="mt-4 text-lg font-semibold text-primary text-center">Playing...</p>
        )}

        {countdownDisplay > 0 && (
          <p className="mt-4 text-2xl font-bold text-secondary text-center">
            Recording starts in {countdownDisplay}...
          </p>
        )}

        {currentQuestionIndex === getExamData().questions.length - 1 && (
          <button
            onClick={async () => {
              // Upload all recordings before completing
              const uploadSuccess = await uploadAllRecordings();
              if (uploadSuccess) {
                onComplete(recordings);
              } else {
                // Could show error message to user
                console.error("Some uploads failed");
              }
            }}
            className="mt-8 w-full futuristic-button bg-green-500 hover:bg-green-600"
          >
            Finish Practice Exam
          </button>
        )}

        {recordings.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="text-2xl font-bold text-center mb-4 text-foreground">Your Recordings</h2>
            {getRecordings().map((recording, index) => (
              <div key={index} className="mb-4 p-4 glass-morphism">
                <h3 className="text-lg font-semibold text-foreground">
                  Question {recording.questionIndex + 1} - {getExamData().questions[recording.questionIndex].transcription}
                </h3>
                <audio
                  src={recording.audioUrl}
                  controls
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <audio ref={questionAudioRef} onEnded={handleQuestionEnd} className="hidden" />
    </div>
  )
}
