"use client"

import { useState, useRef, useEffect } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { FaPlay, FaStop, FaRedo } from "react-icons/fa"
import * as Tone from "tone"
import styled, { keyframes } from "styled-components"
import { toast } from "react-toastify"

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

const PulseButton = styled.button`
  animation: ${pulse} 1.1s infinite;
`

export default function TeacherRecorder({ code, participant, uuid, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [audioURL, setAudioURL] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [displayTime, setDisplayTime] = useState("00:00")
  const [isProcessing, setIsProcessing] = useState(false)
  const [questionAudio, setQuestionAudio] = useState(null)
  const [hasLoadedQuestion, setHasLoadedQuestion] = useState(false)

  const audioRef = useRef(null)
  const timerRef = useRef(0)
  const timerIntervalRef = useRef(null)
  let questionIndex = 0

  // Media recorder setup
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({
    audio: true,
    video: false,
    onStop: (blobUrl, blob) => handleAudioStop(blobUrl, blob),
  })

  // Load question audio if available
  useEffect(() => {
    if (!hasLoadedQuestion) {
      getQuestionAudio()
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Handle audio playback ended
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }, [audioURL])

  const getQuestionAudio = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/receiveaudio?code=${code}&participant=${participant}&number=1`,
      )

      if (!response.ok) {
        console.error("Failed to fetch question audio")
        return
      }

      const receivedData = await response.json()
      const audioUrls = receivedData.audioUrls

      if (audioUrls && audioUrls.length > 0) {
        // Use the presigned URL directly
        setQuestionAudio(audioUrls[0])
        questionIndex = receivedData.questionIndex
      }

      setHasLoadedQuestion(true)
    } catch (err) {
      console.error("Error fetching question audio:", err)
    }
  }

  const handleAudioStop = async (blobUrl, blob) => {
    setAudioURL(blobUrl)
    setIsRecording(false)

    if (audioRef.current) {
      audioRef.current.src = blobUrl
    }

    // Upload the recording
    await uploadRecording(blob)
  }

  const uploadRecording = async (blob) => {
    setIsProcessing(true)
    setError("Processing recording...")

    try {
      // First, get a presigned URL for upload
      const uploadUrlResponse = await fetch(
        `https://www.server.speakeval.org/get-recording-upload-url?code=${code}&participant=${participant}`,
        {
          method: "GET",
        }
      )
      
      if (!uploadUrlResponse.ok) {
        throw new Error("Failed to get upload URL")
      }
      
      const { uploadUrl } = await uploadUrlResponse.json()
      
      // Upload directly to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "audio/wav",
        },
      })
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3")
      }
      
      // Notify server that upload is complete
      const response = await fetch(
        `https://www.server.speakeval.org/upload?code=${code}&participant=${participant}&index=${questionIndex}&token=${uuid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploaded: true }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to notify server")
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        toast.error(data.error)
      } else {
        setError(null)
        toast.success("Recording uploaded successfully")
        if (data.transcription) {
          toast.info(`Transcription: ${data.transcription}`)
        }
        if (onRecordingComplete) {
          onRecordingComplete()
        }
      }
    } catch (error) {
      console.error("Error uploading recording:", error)
      setError("Failed to upload recording. Please try again.")
      toast.error("Failed to upload recording")
    } finally {
      setIsProcessing(false)
    }
  }

  const startAudioRecording = () => {
    // Reset state
    setAudioURL(null)
    setError(null)
    setIsRecording(true)

    // Start timer
    timerRef.current = 0
    timerIntervalRef.current = setInterval(() => {
      timerRef.current += 1000
      setDisplayTime(formatTime(timerRef.current))
    }, 1000)

    // Play beep sound
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C6", "4n")

    // Start recording
    startRecording()

    // Notify server that recording started
    fetch(
      `https://www.server.speakeval.org/started_playing_audio?code=${code}&participant=${participant}&time=${Date.now()}`,
    ).catch((err) => console.error("Error notifying server of recording start:", err))
  }

  const stopAudioRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    stopRecording()

    // Play beep sound
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C5", "8n")
  }

  const playRecording = () => {
    if (!audioURL || isPlaying) return

    setIsPlaying(true)

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }

  const playQuestionAudio = () => {
    if (!questionAudio || isPlaying) return

    setIsPlaying(true)

    if (audioRef.current) {
      audioRef.current.src = questionAudio
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const recordButtonStyle = {
    background: isRecording
      ? "radial-gradient(circle at bottom, #ff0000 0%, #b20000 70%)"
      : "radial-gradient(circle at bottom, #22c55e 0%, #16a34a 70%)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2)",
    borderRadius: "50%",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isProcessing ? "not-allowed" : "pointer",
    margin: "0 auto",
    position: "relative",
    transition: "background 0.3s ease",
    border: "none",
    opacity: isProcessing ? 0.7 : 1,
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Timer Display */}
      <div className="text-3xl font-bold text-white">{displayTime}</div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-6">
        {questionAudio && (
          <button
            onClick={playQuestionAudio}
            disabled={isRecording || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlay size={20} />
          </button>
        )}

        {isRecording ? (
          <PulseButton onClick={stopAudioRecording} disabled={isProcessing} style={recordButtonStyle}>
            <FaStop size={24} color="white" />
          </PulseButton>
        ) : (
          <button onClick={startAudioRecording} disabled={isProcessing} style={recordButtonStyle}>
            <FaPlay size={24} color="white" />
          </button>
        )}

        {audioURL && (
          <button
            onClick={playRecording}
            disabled={isRecording || isProcessing}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-4 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaRedo size={20} />
          </button>
        )}
      </div>

      {/* Status Message */}
      {isRecording && (
        <div className="text-white text-lg font-semibold bg-black/20 px-4 py-2 rounded-lg">
          Recording in progress...
        </div>
      )}

      {isProcessing && (
        <div className="text-white text-lg font-semibold bg-black/20 px-4 py-2 rounded-lg flex items-center">
          <div className="animate-spin h-5 w-5 mr-3 border-2 border-white rounded-full border-t-transparent"></div>
          Processing recording...
        </div>
      )}

      {error && !isProcessing && (
        <div className="text-white text-lg font-semibold bg-black/20 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} style={{ display: "none" }} onEnded={() => setIsPlaying(false)} />
    </div>
  )
}
