"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import ProfileCard from "./ProfileCard"
import { toast } from "react-toastify"
import { FaUsers, FaPlay, FaRedo, FaUserPlus, FaMicrophone, FaArrowRight, FaForward } from "react-icons/fa"
import Card from "./Card"
import { cuteAlert } from "cute-alert"
import * as Tone from "tone"

function RoomPanel({ roomCode, userId, setRoomCodes }) {
  const [participants, setParticipants] = useState([])
  const [roomStarted, setRoomStarted] = useState(false)
  const [completedParticipants, setCompletedParticipants] = useState([])
  const [cheaters, setCheaters] = useState([])
  const [displayName, setDisplayName] = useState("")
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false)
  const [showRecordingPanel, setShowRecordingPanel] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [newStudentName, setNewStudentName] = useState("")
  const [recordingStep, setRecordingStep] = useState(1) // 1 = select student, 2 = recording interface
  const [isJoining, setIsJoining] = useState(false)
  const [studentUuid, setStudentUuid] = useState("")
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1)
  const [isLoadingNewQuestion, setIsLoadingNewQuestion] = useState(false)
  const navigate = useNavigate()
  const displayNameInputRef = useRef(null)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [isError, setIsError] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [finished, setFinished] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [audioBlobURL, setAudioBlobURL] = useState(null)
  const countdownRef = useRef(0)
  const [countdownDisplay, setCountdownDisplay] = useState(0)
  const timer = useRef(-1)
  const audioRef = useRef(null)
  const [fetching, setFetching] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [thinkingTime, setThinkingTime] = useState(5)
  const [allowRepeat, setAllowRepeat] = useState(true)
  const countdownInterval = useRef(null)
  const [questionAudioReady, setQuestionAudioReady] = useState(false)
  let questionIndex = 0

  const mediaRecorderRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const [displayTime, setDisplayTime] = useState("xx:xx")

  // Add a statusInterval ref
  const statusInterval = useRef(null)

  // Separate room code for recording panel
  const [recordingRoomCode, setRecordingRoomCode] = useState("")

  const fetchParticipants2 = async () => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/checkjoined?code=${roomCode}&pin=${userId}`)
      const data = await response.json()
      if (data.error) {
        return
      }
      setParticipants(data.members)
    } catch (error) {
      console.error("Error fetching participants:", error)
      toast.error("Error fetching participants")
    }
    try {
      const response = await fetch(`https://www.server.speakeval.org/checkcompleted?code=${roomCode}&pin=${userId}`)
      const data = await response.json()
      if (data.error) {
        return
      }
      setCompletedParticipants(data.members)
    } catch (error) {
      console.error("Error fetching completed participants:", error)
      toast.error("Error fetching completed participants")
    }
  }

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`https://www.server.speakeval.org/checkjoined?code=${roomCode}&pin=${userId}`)
        const data = await response.json()
        if (data.error) {
          return
        }
        setParticipants(data.members)
        console.log("Data: ", data.cheaters ? data.cheaters.length : "None")
        console.log("Cheaters: ", cheaters ? cheaters.length : "None")
        const newCheaters = data.cheaters ? data.cheaters.filter((cheater) => !cheaters.includes(cheater)) : []
        if (newCheaters.length > 0) {
          toast.error("Some participants broke test integrity: " + newCheaters.join(", "))
        }
        if (data.cheaters && data.cheaters.length > 0 && newCheaters.length > 0) {
          setCheaters((prevCheaters) => [...new Set([...prevCheaters, ...data.cheaters])])
        }
      } catch (error) {
        console.error("Error fetching participants:", error)
        toast.error("Error fetching participants")
      }
      try {
        const response = await fetch(`https://www.server.speakeval.org/checkcompleted?code=${roomCode}&pin=${userId}`)
        const data = await response.json()
        if (data.error) {
          return
        }
        setCompletedParticipants(data.members)
      } catch (error) {
        console.error("Error fetching completed participants:", error)
        toast.error("Error fetching completed participants")
      }
    }
    fetchParticipants()
    const intervalId = setInterval(fetchParticipants, 3000)
    return () => clearInterval(intervalId)
  }, [roomCode, userId, cheaters])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (displayNameInputRef.current && !displayNameInputRef.current.contains(event.target)) {
        setShowDisplayNameInput(false)
      }
    }

    if (showDisplayNameInput) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDisplayNameInput])

  // Initialize recordingRoomCode when the recording panel is first shown
  useEffect(() => {
    if (showRecordingPanel && !recordingRoomCode) {
      setRecordingRoomCode(roomCode)
    }
  }, [showRecordingPanel, roomCode, recordingRoomCode])

  // Reset recording panel state when it's closed
  useEffect(() => {
    if (!showRecordingPanel) {
      setRecordingStep(1)
      setSelectedStudent("")
      setNewStudentName("")
      setStudentUuid("")
      setCurrentQuestionNumber(1)
      setRecordingRoomCode("")

      // Reset audio recorder state
      setIsRecording(false)
      setError(null)
      setIsError(false)
      setAudioURL(null)
      setFinished(false)
      setPlaying(false)
      setHasPlayed(false)
      setAudioBlobURL(null)
      countdownRef.current = 0
      setCountdownDisplay(0)
      timer.current = -1
      setFetching(false)
      setWaiting(false)
      setQuestionAudioReady(false)
      setDisplayTime("xx:xx")

      // Clear any intervals
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (statusInterval.current) {
        clearInterval(statusInterval.current)
      }

      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [showRecordingPanel])

  // Set up the status interval when in recording step 2
  useEffect(() => {
    if (showRecordingPanel && recordingStep === 2 && recordingRoomCode) {
      // Start the status interval
      statusInterval.current = setInterval(sendStatus, 3000)

      // Get the audio for the question
      getAudio()

      return () => {
        if (statusInterval.current) {
          clearInterval(statusInterval.current)
        }
      }
    }
  }, [showRecordingPanel, recordingStep, recordingRoomCode])

  // Add the sendStatus function to check status and get time limit
  const sendStatus = async () => {
    if (!recordingRoomCode) return

    try {
      const response = await fetch(
        `https://www.server.speakeval.org/check_status?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}&uuid=${studentUuid}`,
      )

      if (!response.ok) {
        console.error("Failed to fetch status")
        return
      }

      const data = await response.json()
      const responseCode = data.code

      // Update timer if we have a time limit
      if (data.started && data.limit) {
        updateTimer(data.limit - (Date.now() - data.started))
      }

      // Handle different response codes
      switch (responseCode) {
        case 5:
          // Time limit reached, stop recording
          if (isRecording) {
            stopRecording()
            setError("Time limit reached. Your recording has been automatically stopped and uploaded.")
            setIsError(false)
          }
          break
        case 6:
          // Approaching time limit
          if (isRecording) {
            setError("Reaching time limit. Please finish your response in the next 5 seconds.")
            setIsError(true)
          }
          break
      }
    } catch (error) {
      console.error("Error in sendStatus:", error)
    }
  }

  // Update the updateTimer function
  const updateTimer = (time) => {
    timer.current = time
    setDisplayTime(formatTime(time))
    if (time < 0) setDisplayTime("xx:xx")
  }

  const handleStart = async () => {
    const response = await fetch(`https://www.server.speakeval.org/start_room?code=${roomCode}&pin=${userId}`)
    const data = await response.json()
    if (data.code === 404) {
      toast.error("Room not found")
      return navigate("/")
    }
    toast.success("Room started")
    setRoomStarted(true)
  }

  const handleRestart = async () => {
    const everyoneCompleted = participants.every((participant) => completedParticipants.includes(participant))

    document.documentElement.style.setProperty(
      "--cute-alert-max-width",
      document.documentElement.style.getPropertyValue("--cute-alert-min-width") || "20%",
    )

    cuteAlert({
      type: everyoneCompleted ? "question" : "error",
      title: "Are you sure?",
      description:
        "Are you sure you want to administer another question?" +
        (everyoneCompleted ? "" : "\nNot everyone has finished with the current question."),
      primaryButtonText: "Confirm",
      secondaryButtonText: "Cancel",
      showCloseButton: true,
      closeOnOutsideClick: true,
    }).then(async (event) => {
      if (event === "primaryButtonClicked") {
        const response = await fetch(`https://www.server.speakeval.org/restart_room?code=${roomCode}&pin=${userId}`)
        const data = await response.json()
        if (data.error) {
          toast.error(data.error)
          return navigate("/")
        }
        setCompletedParticipants([])
        // in 1 second, do the same
        setTimeout(() => {
          setCompletedParticipants([])
        }, 1000)

        toast.success("Room restarted")
        setRoomCodes(data.newRoomCode)
        roomCode = data.newRoomCode
        console.log("New: " + roomCode)
        setRoomStarted(true)
      }
    })
  }

  // Update handleNewQuestion to use the complete new room code from the response
  const handleNewQuestion = async () => {
    setIsLoadingNewQuestion(true)
    try {
      const response = await fetch(`https://www.server.speakeval.org/new_question?code=${recordingRoomCode}&pin=${userId}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error || "Failed to get new question")
        setIsLoadingNewQuestion(false)
        return
      }

      // Use the complete new room code from the response
      if (data.newRoomCode) {
        setRecordingRoomCode(data.newRoomCode)
        console.log("New recording room code:", data.newRoomCode)
      }

      // Increment the question number
      setCurrentQuestionNumber((prev) => prev + 1)

      // Reset recording state
      setIsRecording(false)
      setError(null)
      setIsError(false)
      setAudioURL(null)
      setFinished(false)
      setPlaying(false)
      setHasPlayed(false)
      setAudioBlobURL(null)
      countdownRef.current = 0
      setCountdownDisplay(0)
      timer.current = -1
      setQuestionAudioReady(false)

      toast.success("New question loaded")
      setIsLoadingNewQuestion(false)

      // Get the audio for the new question
      getAudio()
    } catch (error) {
      console.error("Error getting new question:", error)
      toast.error("Error getting new question")
      setIsLoadingNewQuestion(false)
    }
  }

  const handleDisplayNameSubmit = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/add_display?code=${roomCode}&pin=${userId}&display=${displayName}`,
      )
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(data.message ? data.message : "Display name was set")
        setShowDisplayNameInput(false)
      }
    } catch (error) {
      console.error("Error setting display name:", error)
      toast.error("Error setting display name")
    }
  }

  const joinRoomAsNewStudent = async (studentName) => {
    setIsJoining(true)
    try {
      // This is the same API call used in JoinRoom.jsx
      const res = await fetch(`https://www.server.speakeval.org/join_room?code=${roomCode}&participant=${studentName}`)
      const parsedData = await res.json()

      if (parsedData.error) {
        toast.error(parsedData.message || "Failed to join room")
        setIsJoining(false)
        return false
      }

      // Store the UUID for the student
      setStudentUuid(parsedData.participant.id)
      toast.success(`Successfully joined as ${studentName}`)

      // Refresh the participants list
      fetchParticipants2()

      setIsJoining(false)
      return true
    } catch (error) {
      console.error("Error joining room:", error)
      toast.error("Error joining room")
      setIsJoining(false)
      return false
    }
  }

  const handleNextStep = async () => {
    // Validate that either a student is selected or a new name is entered
    if (!selectedStudent && !newStudentName) {
      toast.error("Please select an existing student or enter a new student name")
      return
    }

    // If both are filled, prioritize the selected student
    if (selectedStudent && newStudentName) {
      toast.warning("Both student selection and new name are provided. Using selected student.")
      setNewStudentName("")
    }

    // If a new student name is entered, join the room as that student
    if (newStudentName && !selectedStudent) {
      const joined = await joinRoomAsNewStudent(newStudentName)
      if (joined) {
        // Initialize recordingRoomCode when moving to step 2
        if (!recordingRoomCode) {
          setRecordingRoomCode(roomCode)
        }
        setRecordingStep(2)
      }
      return
    }

    // If an existing student is selected, proceed to recording interface
    // Initialize recordingRoomCode when moving to step 2
    if (!recordingRoomCode) {
      setRecordingRoomCode(roomCode)
    }
    setRecordingStep(2)
  }

  // Update the handleBackToSelection function to reset state
  const handleBackToSelection = () => {
    setRecordingStep(1)

    // Reset recording state
    setIsRecording(false)
    setError(null)
    setIsError(false)
    setAudioURL(null)
    setFinished(false)
    setPlaying(false)
    setHasPlayed(false)
    setAudioBlobURL(null)
    countdownRef.current = 0
    setCountdownDisplay(0)
    timer.current = -1
    setQuestionAudioReady(false)

    // Clear intervals
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current)
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    if (statusInterval.current) {
      clearInterval(statusInterval.current)
    }

    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const playBeep = () => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C5", "8n")
  }

  const playRecordingStarted = () => {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C6", "4n")
  }

  const formatTime = (time) => {
    if (time === 0) return "xx:xx"
    const minutes = Math.floor(time / 60000)
    const seconds = Math.round((time % 60000) / 1000)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Update the playRecording function to reset state when playing again
  const playRecording = async () => {
    if (playing || waiting) return

    // Reset hasPlayed to allow replaying after going back to selection
    setPlaying(true)
    setHasPlayed(true)

    // Get the audio if we don't have it yet
    if (!audioBlobURL) {
      await getAudio()
    }

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

  // Update the getAudio function to use the recording room code
  const getAudio = async () => {
    if (!audioBlobURL && recordingRoomCode) {
      setFetching(true)
      try {
        const response = await fetch(
          `https://www.server.speakeval.org/receiveaudio?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}&number=1`,
        )
        if (!response.ok) {
          setError("Failed to fetch audio")
          setIsError(true)
          return
        }

        const receivedData = await response.json()
        const audioUrls = receivedData.audioUrls

        if (receivedData.thinkingTime) {
          setThinkingTime(receivedData.thinkingTime)
        }

        if (receivedData.allowRepeat !== undefined) {
          setAllowRepeat(receivedData.allowRepeat)
        }

        if (audioUrls && audioUrls.length > 0) {
          // Use the presigned URL directly
          setAudioBlobURL(audioUrls[0])
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
  }

  // Update the startRecording function to use the recording room code
  const startRecording = async () => {
    const currentTime = Date.now()
    setIsRecording(true)
    setAudioURL(null)

    try {
      // Initialize media recorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)

        // Upload the recording
        const formData = new FormData()
        formData.append("audio", blob, "audio.wav")
        upload(formData)
      }

      // Start recording
      mediaRecorder.start()

      // Store the mediaRecorder in a ref so we can stop it later
      mediaRecorderRef.current = mediaRecorder

      // Notify server that recording started using the recording room code
      try {
        await fetch(
          `https://www.server.speakeval.org/started_playing_audio?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}&time=${currentTime}`,
        )
      } catch (error) {
        console.error("Error notifying server:", error)
      }

      // Start timer
      const interval = setInterval(() => {
        if (timer.current > 0) {
          timer.current -= 1000
          setDisplayTime(formatTime(timer.current))
        }
        if (timer.current <= 0) {
          setDisplayTime("xx:xx")
          clearInterval(interval)
        }
      }, 1000)

      timerIntervalRef.current = interval
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("An error occurred while starting the recording. Please try again.")
      setIsError(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
    setFinished(true)

    // Clear timer interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
  }

  // Update the upload function to use the recording room code
  const upload = async (formData) => {
    setError("Processing... It may take a few moments to process your audio.")
    setIsError(false)

    try {
      // First, get a presigned URL for upload
      const uploadUrlResponse = await fetch(
        `https://www.server.speakeval.org/get-recording-upload-url?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}`,
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
        body: formData.get("audio"),
        headers: {
          "Content-Type": "audio/wav",
        },
      })
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3")
      }
      
      // Notify server that upload is complete
      const response = await fetch(
        `https://www.server.speakeval.org/upload?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}&index=${questionIndex}&token=${studentUuid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploaded: true }),
        }
      )

      if (!response.ok) {
        setError("Failed to upload audio. Retrying...")
        setIsError(true)

        // Retry upload
        const retryInterval = setInterval(async () => {
          const retryResponse = await fetch(
            `https://www.server.speakeval.org/upload?code=${recordingRoomCode}&participant=${selectedStudent || newStudentName}&index=${questionIndex}&token=${studentUuid}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ uploaded: true }),
            }
          )

          if (retryResponse.ok) {
            clearInterval(retryInterval)
            const data = await retryResponse.json()
            setError("Uploaded to server successfully. We think you might have said: " + data.transcription)
            setIsError(false)
            setDisplayTime("xx:xx")

            // Refresh the participants list
            fetchParticipants2()
          }
        }, 10000)
      } else {
        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setIsError(true)
          return
        }

        setError("Uploaded to server successfully. We think you might have said: " + data.transcription)
        setIsError(false)

        // Refresh the participants list
        fetchParticipants2()
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      setError("Failed to upload audio. Please try again.")
      setIsError(true)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card color="cyan" className="relative min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-black/30 text-white rounded-lg p-3 flex items-center mb-3">
            <FaUsers className="text-cyan-400 mr-2" /> Participants: {participants.length}
          </div>
          <button
            onClick={roomStarted ? handleRestart : handleStart}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-red-600 hover:to-pink-600 transition-all duration-300"
          >
            {roomStarted ? <FaRedo className="mr-2" /> : <FaPlay className="mr-2" />}
            <span>{roomStarted ? "New Question" : "Start Room"}</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Room Code</h2>
          <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
            {roomCode.toString().slice(0, -3)}
          </span>
        </div>

        <div className="min-h-60">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cheaters.map((cheater, index) => (
              <ProfileCard
                key={`cheater-${index}`}
                name={cheater}
                code={roomCode}
                onParticipantRemoved={fetchParticipants2}
                userId={userId}
                completed={completedParticipants.includes(cheater)}
                cheater={true} // Pass a prop to indicate cheating
              />
            ))}
            {completedParticipants
              .filter((participant) => !cheaters.includes(participant))
              .map((participant, index) => (
                <ProfileCard
                  key={`completed-${index}`}
                  name={participant}
                  code={roomCode}
                  onParticipantRemoved={fetchParticipants2}
                  userId={userId}
                  completed={true}
                />
              ))}
            {participants
              .filter((participant) => !completedParticipants.includes(participant) && !cheaters.includes(participant))
              .map((participant, index) => (
                <ProfileCard
                  key={`participant-${index}`}
                  name={participant}
                  code={roomCode}
                  onParticipantRemoved={fetchParticipants2}
                  userId={userId}
                  completed={false}
                />
              ))}
          </div>
        </div>
        <button
          onClick={() => setShowDisplayNameInput(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg z-50"
        >
          <FaUserPlus className="mr-2" />
          <span>Set Display Name</span>
        </button>

        {/* Only show the Record For Student button if the room is started */}
        {roomStarted && (
          <button
            onClick={() => setShowRecordingPanel(!showRecordingPanel)}
            className="fixed bottom-6 left-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg z-50"
          >
            <FaMicrophone className="mr-2" />
            <span>{showRecordingPanel ? "Hide Recording Panel" : "Record For Student"}</span>
          </button>
        )}
      </Card>

      {showRecordingPanel && (
        <Card color="green" className="mt-6">
          {recordingStep === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Teacher Recording Panel</h2>
              <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-lg border border-green-500/30">
                  <p className="text-white text-center">
                    First, select an existing student or enter a new student name, then click Next.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Select Existing Student</h3>
                    <select
                      className="w-full bg-black/30 border border-green-500/30 rounded p-3 text-white"
                      value={selectedStudent}
                      onChange={(e) => {
                        setSelectedStudent(e.target.value)
                        if (e.target.value) setNewStudentName("")
                      }}
                      disabled={isJoining}
                    >
                      <option value="">-- Select a student --</option>
                      {participants
                        .filter((participant) => !completedParticipants.includes(participant))
                        .map((participant, index) => (
                          <option key={index} value={participant}>
                            {participant}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Or Enter New Student Name</h3>
                    <input
                      type="text"
                      className="w-full bg-black/30 border border-green-500/30 rounded p-3 text-white"
                      placeholder="Enter student name"
                      value={newStudentName}
                      onChange={(e) => {
                        setNewStudentName(e.target.value)
                        if (e.target.value) setSelectedStudent("")
                      }}
                      disabled={isJoining}
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg px-6 py-3 flex items-center justify-center hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <span className="mr-2">Joining...</span>
                        <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                      </>
                    ) : (
                      <>
                        <span className="mr-2">Next</span>
                        <FaArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Question #{currentQuestionNumber} - Recording Panel
                </h2>
                <button
                  onClick={handleNewQuestion}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-purple-600 hover:to-indigo-600 transition-all duration-300"
                  disabled={isLoadingNewQuestion}
                >
                  {isLoadingNewQuestion ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <FaForward className="mr-2" />
                      <span>Next Question</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-black/20 p-4 rounded-lg border border-green-500/30">
                  <p className="text-white text-center">
                    {selectedStudent
                      ? `Recording for existing student: ${selectedStudent}`
                      : `Recording for new student: ${newStudentName}`}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-lg border border-green-500/30">
                  {!isRecording && !audioURL && countdownDisplay <= 0 && (
                    <button
                      onClick={playRecording}
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
                      disabled={playing || waiting || hasPlayed}
                    >
                      <FaPlay className="text-white" />
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg animate-pulse"
                    />
                  )}

                  {countdownDisplay > 0 && (
                    <p className="text-white text-xl font-bold mt-4">
                      {!playing && audioRef.current && audioRef.current.paused
                        ? `Recording will start in ${countdownDisplay}...`
                        : `Recording will begin immediately after question completion`}
                    </p>
                  )}

                  {audioBlobURL && !isRecording && (
                    <div className="w-full mt-4">
                      <audio
                        controls={
                          hasPlayed && allowRepeat && !playing && (!audioRef.current || audioRef.current.paused)
                        }
                        ref={audioRef}
                        className="w-full rounded-lg"
                        src={audioBlobURL}
                        onPlay={() => {
                          if (!playing) {
                            countdownRef.current = audioRef.current.duration + 1
                          }
                        }}
                        onEnded={() => {
                          if (!finished) {
                            if (thinkingTime >= 1) {
                              toast.info(
                                `Recording will start in ${thinkingTime} seconds. Please think about your answer.`,
                              )
                            }
                            setPlaying(false)
                            setFinished(true)

                            countdownRef.current = thinkingTime
                            setCountdownDisplay(countdownRef.current)

                            countdownInterval.current = setInterval(() => {
                              countdownRef.current -= 1
                              setCountdownDisplay(countdownRef.current)
                              if (countdownRef.current <= 0) {
                                clearInterval(countdownInterval.current)
                                startRecording()
                              }

                              if (countdownRef.current <= 0) {
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

                  {isRecording && <p className="text-white text-lg font-semibold mt-4">Recording...</p>}

                  {(playing || waiting) && (
                    <p className="text-green-400 text-lg font-semibold mt-4">
                      {fetching ? "Downloading question..." : waiting ? "Loading..." : "Playing..."}
                    </p>
                  )}

                  {error && (
                    <div
                      className={`mt-6 p-4 rounded-lg border ${isError ? "bg-red-100/30 border-red-500/30 text-red-100" : "bg-green-100/30 border-green-500/30 text-green-100"}`}
                    >
                      <p>{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleBackToSelection}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg px-6 py-3 flex items-center justify-center hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg"
                  >
                    Back to Student Selection
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {showDisplayNameInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card color="blue" className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Rename this exam</h2>
            <p className="text-gray-300 mb-4 text-center">Choose a descriptive and unique name for easy grading</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white mb-4"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDisplayNameSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg px-4 py-2 hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg px-4 py-2 hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RoomPanel
