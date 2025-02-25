import { useState, useEffect } from "react"
import PracticeAudioRecorder from "./PracticeAudioRecorder"

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
  }

  const handleRetry = () => {
    setExamCompleted(false)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700">Loading practice exam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          No exam data available. Please check the exam code and configuration.
        </div>
      </div>
    )
  }

  if (examCompleted) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Practice Exam Completed</h2>
          <p className="text-gray-700 mb-6">
            You have completed the practice exam. You can now try again.
          </p>
          <button
            onClick={handleRetry}
            className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
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
      </div>
    </div>
  )
}

