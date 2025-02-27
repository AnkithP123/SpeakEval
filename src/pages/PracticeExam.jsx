"use client"

import { useState, useEffect } from "react"
import PracticeAudioRecorder from "./P2"
import party from "party-js"
import Card from "../components/Card"

export default function PracticeExam() {
  const [examData, setExamData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [examCompleted, setExamCompleted] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get("code")
    const name = searchParams.get("name")
    const uuid = searchParams.get("uuid")

    if (code && name && uuid) {
      fetchExamData(code, name, uuid)
    } else {
      setError("Missing exam code or configuration name")
      setIsLoading(false)
    }
  }, [])

  const fetchExamData = async (code, name, uuid) => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/get_practice?code=${code}&name=${name}&uuid=${uuid}`,
      )
      if (!response.ok) {
        throw new Error("Failed to fetch exam data")
      }
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        setExamData(data)
      }
    } catch (err) {
      setError(err.message || "Failed to fetch exam data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = (recordings) => {
    console.log("Practice exam completed", recordings)
    setExamCompleted(true)
    party.confetti(document.body, {
      count: party.variation.range(100, 200),
      spread: 60,
      origin: { x: 0.5, y: 0.5 },
      speed: party.variation.range(200, 300),
    })

    // Create audio elements and animate them
    setTimeout(() => {
      recordings &&
        recordings.forEach((recording, index) => {
          const audio = document.createElement("audio")
          audio.src = recording
          audio.controls = true
          audio.style.position = "absolute"
          const cardRect = document.querySelector(".card").getBoundingClientRect()

          let top, left
          do {
            top = Math.random() * 80 + 10
            left = Math.random() * 80 + 10
          } while (
            top >= cardRect.top - 50 &&
            top <= cardRect.bottom + 50 &&
            left >= cardRect.left - 50 &&
            left <= cardRect.right + 50
          )
          audio.style.top = `${top}%`
          audio.style.left = `${left}%`
          audio.style.transform = "scale(0)"
          audio.style.transition = "transform 0.5s ease-in-out"
          document.body.appendChild(audio)

          setTimeout(() => {
            audio.style.transform = "scale(1)"
          }, 100 * index)

          setTimeout(
            () => {
              audio.style.transform = "scale(0)"
              setTimeout(() => {
                document.body.removeChild(audio)
              }, 500)
            },
            3000 + 100 * index,
          )
        })
    }, 50)
  }

  const handleRetry = () => {
    setExamCompleted(false)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <div className="text-2xl font-semibold text-white">Loading practice exam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-white">
          No exam data available. Please check the exam code and configuration.
        </div>
      </div>
    )
  }

  if (examCompleted) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <Card className="text-center">
          <h2 className="text-2xl font-bold mb-4">Practice Exam Completed</h2>
          <p className="text-gray-300 mb-6">You have completed the practice exam. You can now try again.</p>
          <button onClick={handleRetry} className="btn btn-primary">
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container">
      <Card hover={false}>
        <h1 className="text-3xl font-bold mb-4">{examData.config} Practice Exam</h1>
        <div className="mb-6">
          <p className="text-lg">
            <span className="font-semibold">Language:</span> {examData.language}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Time Limit:</span> {examData.timeLimit} seconds per question
          </p>
          <p className="text-lg">
            <span className="font-semibold">Total Questions:</span> {examData.questions.length}
          </p>
        </div>
        <PracticeAudioRecorder examData={examData} onComplete={handleComplete} />
      </Card>
    </div>
  )
}

