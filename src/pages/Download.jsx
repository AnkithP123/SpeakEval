import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProfileCard from '../components/StatsCard'
import { toast } from 'react-toastify'
import { FaSpinner } from 'react-icons/fa'

function Download() {
  const [searchParams] = useSearchParams()
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setError('No token provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`https://www.server.speakeval.org/download_bulk?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXJ0aWNpcGFudCI6Ilplbm9zIiwicXVlc2V0aW9uTm8iOlsxLDJdLCJjb2RlIjoiMzY5NTA5NjEiLCJpYXQiOjE3NDAwODQyOTMsImV4cCI6MTc3MTY0MTg5M30.2EKGyEVmqaFZ63o_JzwSS2RPBpQ3SRpow4vrllK0W-I`)
        const data = await response.json()
        console.log("Data: " + data)

        if (data.error) {
          throw new Error(data.error)
        }

        setParticipants(data.participant)
      } catch (err) {
        setError(err.message || 'Failed to fetch participant data')
        toast.error('Error loading responses: ' + (err.message || 'Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                    <p className="text-lg text-gray-600">Loading responses...</p>
                </div>
            </div>
        )
    }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!participants.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">No Responses Found</h2>
          <p className="text-gray-600">No responses are available for this token.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Your Responses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.map((participant, index) => (
          <ProfileCard
            key={`${participant.name}-${participant.code}-${index}`}
            text={participant.transcription || ''}
            rubric={participant.rubric || ''}
            rubric2={participant.rubric2 || ''}
            audio={participant.audio || ''}
            question={participant.questionText || ''}
            questionBase64={participant.question || ''}
            index={participant.index || 0}
            name={participant.name || ''}
            code={participant.code || ''}
            onGradeUpdate={() => {}}
            tokenProvided={true}
            participantPass = {participant}
          />
        ))}
      </div>
    </div>
  )
}

export default Download