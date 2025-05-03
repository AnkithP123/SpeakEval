"use client"

import { useState, useRef, useEffect } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { Play } from "lucide-react"
import * as Tone from "tone"
import styled, { css, keyframes } from "styled-components"
import { cuteAlert, cuteToast } from "cute-alert"

export default function AudioRecorder({ code, participant, uuid }) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [isError, setIsError] = useState(true)
  const [audioURL, setAudioURL] = useState(null)
  const [finished, setFinished] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [audioBlobURL, setAudioBlobURL] = useState(null)
  const countdownRef = useRef(0)
  const [countdownDisplay, setCountdownDisplay] = useState(0)
  const timer = useRef(-1)
  const statusInterval = useRef(null)
  const audioRef = useRef(null)
  const [displayTime, setDisplayTime] = useState("xx:xx")
  const [obtainedAudio, setObtainedAudio] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [premium, setPremium] = useState(false)
  const [thinkingTime, setThinkingTime] = useState(5)
  const [allowRepeat, setAllowRepeat] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [finishedRecording, setFinishedRecording] = useState(false)
  const [hasScreenPermission, setHasScreenPermission] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const [isWholeScreen, setIsWholeScreen] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const [questionAudioReady, setQuestionAudioReady] = useState(false)
  let questionIndex
  let played = false

  // Media recorder setup - using askPermissionOnMount to request mic/camera on load
  const {
    status: audioStatus,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    mediaBlobUrl: audioBlobUrl,
    clearBlobUrl: clearAudioBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: true,
    askPermissionOnMount: true, // Request permissions on component mount
    onStop: (blobUrl, blob) => handleAudioStop(blobUrl, blob),
  })

  const {
    status: screenStatus,
    startRecording: startScreenRecording,
    stopRecording: stopScreenRecording,
    mediaBlobUrl: screenBlobUrl,
    clearBlobUrl: clearScreenBlobUrl,
  } = useReactMediaRecorder({
    screen: true,
    audio: false,
    askPermissionOnMount: false, // We'll handle screen permissions separately
    onStop: (blobUrl, blob) => handleScreenStop(blobUrl, blob),
  })

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = true
      }
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = true
      }
      setHasPermissions(true)
      setError(null) // Clear error when permissions are granted
      setIsError(false)
      return { permissionGranted: true, stream }
    } catch (err) {
      console.error("Error requesting microphone permission:", err)
      setError("Microphone and camera access is required first. Click here to try again.")
      setIsError(true)
      return { permissionGranted: false }
    }
  }

  const handleAudioStop = async (blobUrl, blob) => {
    const formData = new FormData()
    formData.append("audio", blob, "audio.wav")
    upload(formData)
    setAudioURL(blobUrl)
    setIsRecording(false)
    if (audioRef.current) {
      audioRef.current.src = blobUrl
    }
  }

  const handleScreenStop = async (blobUrl, blob) => {
    const formData = new FormData()
    formData.append("screen", blob, "screen.webm")
    uploadScreen(formData)
  }

  // Request screen sharing permission
  const requestScreenPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          cursor: "always",
        },
      })

      // Check if user selected the entire screen
      const tracks = stream.getVideoTracks()
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings()
        // displaySurface will be "monitor" if the entire screen was selected
        if (settings.displaySurface === "monitor") {
          setIsWholeScreen(true)
          setScreenStream(stream)
          setHasScreenPermission(true)
          setError(null) // Clear error when screen permission is granted
          setIsError(false)
          return { permissionGranted: true, stream }
        } else {
          // If not the entire screen, stop the stream and ask again
          tracks.forEach((track) => track.stop())
          setError("Please select your entire screen, not just a window or tab.")
          setIsError(true)
          return { permissionGranted: false }
        }
      }
      return { permissionGranted: false }
    } catch (err) {
      console.error("Error requesting screen permission:", err)
      setError("Screen sharing access is required. Click here to try again.")
      setIsError(true)
      return { permissionGranted: false }
    }
  }

  // Initialize setup on component mount
  useEffect(() => {
    document.documentElement.style.setProperty("--cute-alert-max-width", "40%")

    // Start fetching the question audio immediately
    getAudio()

    // Show initial instructions
    cuteAlert({
      type: "info",
      title: "Get Ready to Record",
      description:
        "It's time to record your response. First, we'll need to set up your screen sharing permissions. After that, you'll enter fullscreen mode and can listen to the question. If your teacher has allowed it, it will then count down for a few seconds before beginning recording, during which you think about your answer, or replay the question once (if allowed), and THEN begin recording. Speak clearly, confidently, and loudly, so that your microphone picks up your audio well. If you are not currently wearing headphones, please do so now if possible.",
      primaryButtonText: "Got it",
    })
  }, [])

  // Monitor audio status changes
  useEffect(() => {
    if (audioStatus === "granted") {
      // Microphone and camera permissions have been granted
      console.log("Microphone and camera permissions granted")
    }
  }, [audioStatus])

  // Set up status interval
  useEffect(() => {
    statusInterval.current = setInterval(sendStatus, 3000)
    return () => clearInterval(statusInterval.current)
  }, [])

  // Monitor fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !finishedRecording && isFullscreen) {
        fetch(
          `https://www.server.speakeval.org/cheating_detected?code=${code}&participant=${participant}&uuid=${uuid}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: "Fullscreen exit detected" }),
          },
        ).catch((error) => {
          console.error("Error notifying server about fullscreen exit:", error)
        })
        alert("Exiting fullscreen is not allowed. This will be reported to your teacher.")
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden && !finishedRecording && isFullscreen) {
        fetch(
          `https://www.server.speakeval.org/cheating_detected?code=${code}&participant=${participant}&uuid=${uuid}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: "Tab switch detected" }),
          },
        ).catch((error) => {
          console.error("Error notifying server about tab switch:", error)
        })
        alert("You switched tabs or went out of the window. This will be reported to your teacher.")
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [finishedRecording, isFullscreen, code, participant, uuid])

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

  const PulseButton = styled.button`
    animation: ${animation};
  `

  const playBeep = () => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C5", "8n")
  }

  const playRecordingStarted = () => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C6", "4n")
  }

  async function sendStatus() {
    console.log(audioStatus)
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/check_status?code=${code}&participant=${participant}&uuid=${uuid}`,
      )
      if (!response.ok) {
        setError("Failed to fetch status")
        setIsError(true)
        return
      }

      const data = await response.json()
      const responseCode = data.code

      if (responseCode === 7) {
        window.location.href = `record?code=${data.newRoomCode}&participant=${participant}&uuid=${uuid}`
      }

      if (!playing && !isRecording) {
        timer.current = 0
        setDisplayTime("xx:xx")
        return
      }

      if (data.started && data.limit) {
        updateTimer(data.limit - (Date.now() - data.started))
      }

      switch (responseCode) {
        case 5:
          if (error === "Reaching time limit. Please finish your response in the next 5 seconds. ") {
            setError(
              "You reached the time limit and your audio was stopped and uploaded automatically. " +
                (premium
                  ? "Your audio will be processed faster, but may still take a little bit of time"
                  : "It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue."),
            )
            setIsError(false)
          }
          stopRecording()
          break
        case 6:
          if (!error || (!error.includes("Processing...") && !error.includes("Uploaded to server successfully."))) {
            setError("Reaching time limit. Please finish your response in the next 5 seconds. ")
            setIsError(true)
          }
          break
      }
    } catch (error) {
      console.error("Error in sendStatus:", error)
    }
  }

  const makeResponse = async () => {
    setFetching(true)
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/receiveaudio?code=${code}&participant=${participant}&number=1`,
      )
      if (!response.ok) {
        setError("Failed to fetch audio")
        setIsError(true)
        return
      }

      const receivedData = await response.json()
      const audios = receivedData.audios

      if (receivedData.subscribed) {
        setPremium(true)
      }

      if (receivedData.thinkingTime) {
        setThinkingTime(receivedData.thinkingTime)
      }

      if (receivedData.allowRepeat !== undefined) {
        setAllowRepeat(receivedData.allowRepeat)
      }

      for (const data of audios) {
        const audioData = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
        const audioBlob = new Blob([audioData], { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioBlobURL(audioUrl)
        questionIndex = receivedData.questionIndex
      }

      setQuestionAudioReady(true)
    } catch (err) {
      console.error("Error fetching audio:", err)
      setError("An error occurred while fetching the audio. Try reloading the page.")
      setIsError(true)
    } finally {
      setFetching(false)
    }
  }

  const getAudio = async () => {
    if (!audioBlobURL) {
      try {
        await makeResponse()
      } catch (err) {
        console.error("Error fetching audio:", err)
        setError("An error occurred while fetching the audio. Try reloading the page.")
        setIsError(true)
      }
      setObtainedAudio(true)
    }
  }

  let interval = null

  const startRecording = async () => {
    setIsRecording(true)
    setAudioURL(null)

    try {
      // Start both recordings
      startAudioRecording()

      await sendStatus()

      interval = setInterval(() => {
        if (timer.current > 0) {
          timer.current -= 1000
          setDisplayTime(formatTime(timer.current))
        }
        if (timer.current <= 0) {
          setDisplayTime("xx:xx")
          clearInterval(interval)
        }
      }, 1000)

      await fetch(`https://www.server.speakeval.org/started_playing_audio?code=${code}&participant=${participant}`)
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("An error occurred while starting the recording. Please try again. Perhaps reload the page.")
      setIsError(true)
    }
  }

  const upload = async (formData) => {
    setError(
      "Processing... " +
        (premium
          ? "Your audio will be processed faster, but may still take a little bit of time"
          : "It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue."),
    )
    setIsError(false)

    try {
      const response = await fetch(
        `https://www.server.speakeval.org/upload?code=${code}&participant=${participant}&index=${questionIndex}`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) {
        const retryInterval = setInterval(async () => {
          const retryResponse = await fetch(
            `https://www.server.speakeval.org/upload?code=${code}&participant=${participant}&index=${questionIndex}`,
            {
              method: "POST",
              body: formData,
            },
          )
          if (retryResponse.ok) {
            setFinishedRecording(true)
            clearInterval(retryInterval)
            const data = await retryResponse.json()
            setError("Uploaded to server successfully. We think you might have said: " + data.transcription)
            setDisplayTime("xx:xx")
          }
        }, 10000)
      } else {
        setFinishedRecording(true)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setIsError(true)
          return
        }

        setError("Uploaded to server successfully. We think you might have said: " + data.transcription)
        setIsError(false)
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      setError("Failed to upload audio. Please try again.")
      setIsError(true)
    }
  }

  const uploadScreen = async (formData) => {
    try {
      await fetch(
        `https://www.server.speakeval.org/upload_screen?code=${code}&participant=${participant}&index=${questionIndex}`,
        {
          method: "POST",
          body: formData,
        },
      )
    } catch (err) {
      console.error("Error uploading screen recording:", err)
    }
  }

  const playRecording = async () => {
    if (playing || waiting || played) return

    setPlaying(true)
    setHasPlayed(true)
    played = true;

    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      } else {
        setTimeout(playAudio, 100)
      }
    }
    playAudio()
  }

  const stopRecording = () => {
    setStopped(true)
    setIsRecording(false)

    stopAudioRecording()
    stopScreenRecording()

    clearInterval(interval)
  }

  const updateTimer = (time) => {
    timer.current = time
    setDisplayTime(formatTime(time))
    if (time < 0) setDisplayTime("xx:xx")
  }

  const formatTime = (time) => {
    if (time === 0) return "xx:xx"
    const minutes = Math.floor(time / 60000)
    const seconds = Math.round((time % 60000) / 1000)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const enterFullscreen = () => {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    cuteAlert({
      type: "info",
      title: "Fullscreen",
      description:
        "You are now in fullscreen mode. You may not exit or switch to any other tabs, or this will be reported to your teacher and they may choose to administer a zero.",
      primaryButtonText: "Understood",
    })
  }

  let countdownInterval

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#bfdbfe",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "80px",
          fontSize: "48px",
          fontWeight: "bold",
          color: timer.current < 5000 && timer.current !== 0 ? "red" : "#374151",
        }}
      >
        {displayTime}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          width: "90%",
          maxWidth: "600px",
          textAlign: "center",
          transform: "translateY(30%)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#374151",
            marginBottom: "16px",
          }}
        >
          Oral Exam Assistant
        </h1>

        {!hasScreenPermission && (
          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Please share your entire screen (not just a window or tab) to continue.
            </p>
            <button
              onClick={async () => {
                const perms = await requestPermissions()
                console.log(perms)
                if (!perms.permissionGranted) {
                  setError("Microphone and camera access is required first. Click here to try again.")
                  setIsError(true)
                  return
                }
                requestScreenPermission();
              }}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "white",
                backgroundColor: "#2563EB",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1D4ED8")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2563EB")}
            >
              Share Screen
            </button>
          </div>
        )}

        {hasScreenPermission && !isFullscreen && (
          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              {!questionAudioReady
                ? "Downloading question audio..."
                : "All set! Please enter fullscreen mode to continue."}
            </p>
            {questionAudioReady && (
              <button
                onClick={async () => {
                  enterFullscreen()
                  setIsFullscreen(true)
                  // Initialize Tone.js here to ensure it's ready when needed
                  Tone.start()
                }}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "white",
                  backgroundColor: "#2563EB",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#1D4ED8")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#2563EB")}
              >
                Enter Fullscreen
              </button>
            )}
          </div>
        )}

        {isFullscreen && !isRecording && !stopped && countdownDisplay <= 0 && (
          <PulseButton
            onClick={playRecording}
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
              animation: "none",
            }}
          >
            <Play size={24} color="white" fill="white" />
          </PulseButton>
        )}

        {isFullscreen && isRecording && (
          <PulseButton
            onClick={() => {
              stopRecording()
            }}
            style={recordStyle}
          />
        )}

        {countdownDisplay > 0 && isFullscreen && allowRepeat && (
          <p
            style={{
              marginTop: "16px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#374151",
            }}
          >
            If you couldn't hear or understand the question, you can use this time to replay it using the audio
            component below.
          </p>
        )}

        {isFullscreen && audioBlobURL && !isRecording && (
          <div
            style={{
              width: "100%",
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <audio
              controls={hasPlayed && allowRepeat && !playing && (!audioRef.current || audioRef.current.paused)}
              ref={(input) => {
                audioRef.current = input
              }}
              style={{
                width: "100%",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#F8F8F8",
              }}
              src={audioBlobURL}
              onPlay={() => {
                if (!playing) {
                  countdownRef.current = audioRef.current.duration + 1
                }
              }}
              onEnded={() => {
                if (!finished) {
                  if (thinkingTime >= 1) {
                    cuteToast({
                      type: "info",
                      title: "Recording will start after countdown ends",
                      description: `Recording will start in ${thinkingTime} seconds. Please think about your answer. Recording has NOT YET STARTED`,
                      timer: 5000,
                    })
                  }
                  setPlaying(false)
                  setFinished(true)

                  countdownRef.current = thinkingTime
                  setCountdownDisplay(countdownRef.current)

                  countdownInterval = setInterval(() => {
                    countdownRef.current -= 1
                    setCountdownDisplay(countdownRef.current)
                    if (countdownRef.current <= 0) {
                      clearInterval(countdownInterval)
                      startRecording()
                    }

                    if (countdownRef.current <= -2) {
                      // Do nothing
                    } else if (countdownRef.current <= 0) {
                      if (audioRef.current && !audioRef.current.paused) audioRef.current.pause()
                      playRecordingStarted()
                    }
                  }, 1000)
                } else {
                  countdownRef.current = -1
                  setCountdownDisplay(-1)
                }
              }}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {isRecording && (
          <p
            style={{
              marginTop: "16px",
              fontSize: "18px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Recording...
          </p>
        )}

        {(playing || waiting) && (
          <p
            style={{
              marginTop: "18px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#28a745",
            }}
          >
            {fetching ? "Downloading question..." : waiting ? "Loading..." : "Playing..."}
          </p>
        )}

        {waiting && (
          <p
            style={{
              marginTop: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#FF0000",
            }}
          >
            If this is taking too long, please ensure you have allowed microphone and screen sharing permissions. If it
            still doesn't work, try switching to another browser.
          </p>
        )}

        {countdownDisplay > 0 && (
          <p
            style={{
              marginTop: "16px",
              fontSize: "24px",
              fontWeight: "bold",
              color: "red",
            }}
          >
            {!playing && audioRef.current && audioRef.current.paused
              ? `Recording will start in ${countdownDisplay}...`
              : `Recording will begin immediately upon question completion`}
          </p>
        )}

        {error && (
          <div
            onClick={!hasPermissions ? requestPermissions : hasScreenPermission ? null : requestScreenPermission}
            style={
              isError
                ? {
                    marginTop: "24px",
                    padding: "16px",
                    backgroundColor: "#FEE2E2",
                    borderRadius: "12px",
                    border: "1px solid #F87171",
                    color: "#B91C1C",
                    cursor: "pointer",
                    maxWidth: "80%",
                  }
                : {
                    marginTop: "24px",
                    padding: "16px",
                    backgroundColor: "#D1FAE5",
                    borderRadius: "12px",
                    border: "1px solid #34D399",
                    color: "#065F46",
                    cursor: "pointer",
                    maxWidth: "80%",
                  }
            }
          >
            <p style={{ margin: "5px" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
