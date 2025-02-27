import React from 'react'
import { toast } from 'react-toastify'
import { FaTimes, FaCheck } from 'react-icons/fa'

function ProfileCard({ name, code, onParticipantRemoved, userId, completed }) {
  const handleRemove = async () => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/kick?code=${code}&participant=${name}&pin=${userId}`)
      toast.success('Participant kicked')
      onParticipantRemoved()
    } catch (error) {
      console.error('Error kicking participant:', error)
      toast.error('Error kicking participant')
    }
  }

  return (
    <div
      className={`relative flex items-center justify-between px-4 py-2 rounded-lg m-2 transition-all duration-300 ${
        completed
          ? 'bg-gradient-to-r from-green-500/20 to-green-700/20 border border-green-500/30'
          : 'bg-gradient-to-r from-gray-700/20 to-gray-900/20 border border-gray-500/30'
      }`}
    >
      <span className="text-lg text-white">{name}</span>
      {!completed ? (
        <button
          className="text-red-500 hover:text-red-400 transition-colors"
          onClick={handleRemove}
          aria-label="Remove participant"
        >
          <FaTimes size={20} />
        </button>
      ) : (
        <span className="text-green-500">
          <FaCheck size={20} />
        </span>
      )}
    </div>
  )
}

export default ProfileCard
