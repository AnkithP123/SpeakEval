import { useState, useRef, useEffect } from "react"
import { Play, Square } from "lucide-react"
import styled, { css, keyframes } from "styled-components"
import * as Tone from "tone"
import "../styles/globals2.css"

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

const PulseButton = styled.button`
    animation: ${animation};
`

export default function PracticeAudioRecorder({ examData, onComplete }) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [recordings, setRecordings] = useState([])
    const [isPlaying, setIsPlaying] = useState(false)
    const [waiting, setWaiting] = useState(false)
    const [questionAudioBlobURL, setQuestionAudioBlobURL] = useState(null)
    const [studentAudioBlobURLs, setStudentAudioBlobURLs] = useState([])
    const [displayTime, setDisplayTime] = useState("xx:xx")
    const [countdownDisplay, setCountdownDisplay] = useState(0)
    const [randomizeQuestions, setRandomizeQuestions] = useState(false)
    const [randomSeed, setRandomSeed] = useState(0)
    const [showTranscriptions, setShowTranscriptions] = useState(true)

    const mediaRecorder = useRef(null)
    const audioChunks = useRef([])
    const timerInterval = useRef(null)
    const questionAudioRef = useRef(null)
    const studentAudioRef = useRef(null)
    const timer = useRef(0)
    const countdownRef = useRef(0)
    const countdownInterval = useRef(null)

    function shuffle(array, seed) {                // <-- ADDED ARGUMENT
        var m = array.length, t, i;
      
        // While there remain elements to shuffle…
        while (m) {
      
          // Pick a remaining element…
          i = Math.floor(random(seed) * m--);        // <-- MODIFIED LINE
      
          // And swap it with the current element.
          t = array[m];
          array[m] = array[i];
          array[i] = t;
          ++seed                                     // <-- ADDED LINE
        }
      
        return array;
      }
      
      function random(seed) {
        var x = Math.sin(seed++) * 10000; 
        return x - Math.floor(x);
      }
      

    const getExamData = () => {
        if (randomizeQuestions) {
            const shuffledQuestions = shuffle([...examData.questions], randomSeed)
            shuffledQuestions.forEach((question, index) => {
                question.index = index
            })
            return { ...examData, questions: shuffledQuestions }
        }
        return examData
    }

    useEffect(() => {
        return () => {
            clearInterval(timerInterval.current)
            if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
                mediaRecorder.current.stop()
            }
            if (questionAudioRef.current)
                questionAudioRef.current.pause()
        }
    }, [])

    const formatTime = (time) => {
        if (time === 0) return "xx:xx"
        const minutes = Math.floor(time / 60000)
        const seconds = Math.round((time % 60000) / 1000)
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const updateTimer = (time) => {
        timer.current = time
        setDisplayTime(formatTime(time))
        if (time < 0) setDisplayTime("xx:xx")
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
                setStudentAudioBlobURLs((prev) => {
                    const newRecordings = [...prev]
                    newRecordings[currentQuestionIndex] = audioUrl
                    return newRecordings
                })
                setRecordings((prev) => [...prev, { questionIndex: currentQuestionIndex, audioUrl, duration: recordingTime }])
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
        const timeLimit = getExamData().timeLimit
        setRecordingTime(0)
        updateTimer(timeLimit * 1000) // Set initial display time
        timerInterval.current = setInterval(() => {
            setRecordingTime((prevTime) => {
                const newTime = prevTime + 1
                const remainingTime = timeLimit - newTime
                updateTimer(remainingTime * 1000)
                if (newTime >= timeLimit) {
                    stopRecording()
                    return timeLimit
                }
                return newTime
            })
        }, 1000)
    }

    const stopTimer = () => {
        clearInterval(timerInterval.current)
    }

    const playQuestionAudio = async () => {
        if (isPlaying || waiting) return

        setWaiting(true)

        if (!questionAudioBlobURL) {
            const audioData = Uint8Array.from(atob(getExamData().questions[currentQuestionIndex].audio), (c) => c.charCodeAt(0))
            const audioBlob = new Blob([audioData], { type: "audio/webm" })
            const audioUrl = URL.createObjectURL(audioBlob)
            setQuestionAudioBlobURL(audioUrl)
        }

        const playAudio = () => {
            if (questionAudioRef.current) {
                questionAudioRef.current.currentTime = 0
                questionAudioRef.current.play()
                setWaiting(false)
                setIsPlaying(true)   
                if (questionAudioRef.current) {
                    questionAudioRef.current.onloadedmetadata = () => {
                        questionAudioRef.current.play()
                        setWaiting(false)
                        setIsPlaying(true)
                    }
                } else {
                    setTimeout(playAudio, 100)
                }
            } else {
                setTimeout(playAudio, 100)
            }
        }
        playAudio()
    }

    const playBeep = () => {
        const synth = new Tone.Synth().toDestination()
        synth.triggerAttackRelease("C5", "8n")
    }

    const playRecordingStarted = () => {
        const synth = new Tone.Synth().toDestination()
        synth.triggerAttackRelease("C6", "4n")
    }

    const handleQuestionEnd = () => {
        if (!isPlaying) {
            countdownRef.current = -1;
            setCountdownDisplay(-1);
            return;
        }
        countdownInterval.current = setInterval(() => {
            if (!questionAudioRef.current || questionAudioRef.current.paused) {
                countdownRef.current -= 1
            }
            setCountdownDisplay(countdownRef.current)
            if (countdownRef.current <= 0) {
                if (questionAudioRef.current) {
                    questionAudioRef.current.currentTime = 0
                    questionAudioRef.current.pause()
                }
                clearInterval(countdownInterval.current)
                startRecording()
                playRecordingStarted()
            } else {
                // playBeep()
            }
        }, 1000)
        setIsPlaying(false)
        countdownRef.current = getExamData().thinkingTime
        setCountdownDisplay(countdownRef.current)
    }

    const handleQuestionChange = (newIndex) => {
        setCurrentQuestionIndex(newIndex)
        setIsPlaying(false)
        setIsRecording(false)
        setWaiting(false)
        setQuestionAudioBlobURL(null)
        setRecordingTime(0)
        setDisplayTime("xx:xx")
        countdownRef.current = getExamData().thinkingTime
        setCountdownDisplay(0)
        clearInterval(timerInterval.current)
        clearInterval(countdownInterval.current)
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop()
        }
        if (questionAudioRef.current) {
            questionAudioRef.current.pause()
            questionAudioRef.current.currentTime = 0
        }
        audioChunks.current = []
        timer.current = 0
        countdownRef.current = 0
    }

    

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
                            onChange={() => {
                                if (isPlaying || waiting || isRecording || countdownRef.current > 0) return
                                setRandomizeQuestions(!randomizeQuestions)
                                setRandomSeed(Math.random())
                            }}
                            className="mr-2"
                        />
                        Randomize Questions
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={showTranscriptions}
                            onChange={() => {
                                if (isPlaying || waiting || isRecording || countdownRef.current > 0) return
                                setShowTranscriptions(!showTranscriptions)
                            }}
                            className="mr-2"
                        />
                        Show Transcriptions
                    </label>
                </div>

                <div 
                    className="text-5xl font-bold text-center mb-8 text-primary neon-border p-4 rounded-lg"
                    style={{
                        color: timer.current < 5000 && timer.current !== 0 ? "red" : "primary",
                    }}
                >
                    {displayTime}
                </div>


                <div className="flex justify-between mb-4">
                <button
                    onClick={() => handleQuestionChange(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className={currentQuestionIndex === 0 ? "futuristic-button-disabled" : "futuristic-button"}
                >
                    Previous
                </button>
                <span className="text-lg font-semibold text-foreground">
                    Question {currentQuestionIndex + 1} of {getExamData().questions.length}
                </span>
                <button
                    onClick={() => handleQuestionChange(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex >= getExamData().questions.length - 1}
                    className={currentQuestionIndex >= getExamData().questions.length - 1 ? "futuristic-button-disabled" : "futuristic-button"}
                >
                    Next
                </button>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">Question {currentQuestionIndex + 1}</h3>
                    {showTranscriptions && getExamData().questions.length > 0 && (
                        <p className="text-foreground mb-4">{getExamData().questions[currentQuestionIndex].transcription}</p>
                    )}
                </div>

                {questionAudioBlobURL && !isRecording && (
                    <div className="mt-4 w-full">
                        <audio
                            ref={questionAudioRef}
                            src={questionAudioBlobURL}
                            onEnded={handleQuestionEnd}
                            onPlay={() => {
                                if (!isPlaying) {
                                    countdownRef.current = questionAudioRef.current.duration + 1;
                                }
                            }}
                            style={{
                                width: "100%",
                                borderRadius: "8px",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#F8F8F8",
                                marginBottom: "1rem",
                            }}
                            controls={getExamData().allowRepeat && !isPlaying && !waiting && !isRecording && (!questionAudioRef.current || questionAudioRef.current.paused)}
                        >
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}


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
                    <p className="mt-4 text-lg font-semibold text-red-500 text-center">Recording...</p>
                )}

                {(isPlaying || waiting) && (
                    <p className="mt-4 text-lg font-semibold text-green-600 text-center">{waiting ? "Loading..." : "Playing..."}</p>
                )}

                {countdownDisplay > 0 && (
                    <p className="mt-4 text-2xl font-bold text-red-600 text-center">{!isPlaying && questionAudioRef.current.paused ? `Recording starts in ${countdownDisplay}` : `Recording starts immediately upon question completion`}...</p>
                )}

                {currentQuestionIndex === getExamData().questions.length - 1 && (
                    <button
                        onClick={() => {
                            onComplete(studentAudioBlobURLs)
                        }}
                        className="mt-8 w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors"
                    >
                        Finish Practice Exam
                    </button>
                )}

                {studentAudioBlobURLs.length > 0 && (
                    <div className="mt-8 w-full">
                        <h2 className="text-2xl font-bold text-center mb-4">Your Recordings</h2>
                        {studentAudioBlobURLs.map((audioUrl, index) => (
                            <div key={index} className="mb-4">
                                <h3 className="text-lg font-semibold">Question {index + 1} - {getExamData().questions[index].transcription}</h3>
                                <audio
                                    ref={studentAudioRef}
                                    src={audioUrl}
                                    style={{
                                        width: "100%",
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                                        backgroundColor: "#F8F8F8",
                                    }}
                                    controls
                                >
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}