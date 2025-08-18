"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { ChevronDown, ChevronUp } from "lucide-react"
import GradingPanel from "../pages/TeacherPortalRoom.jsx"

function JoinRoom({ rooms, pin }) {
  const [roomCode, setRoomCode] = useState("")
  const [grading, setGrading] = useState(false)
  const [hoveredRoom, setHoveredRoom] = useState(null)
  const [showOlderRooms, setShowOlderRooms] = useState(false)

  const handleGrade = async () => {
    if (roomCode) {
      setGrading(true)
    } else {
      toast.error("Please fill out the room code field.")
    }
  }

  const handleRoomCodeChange = (e) => {
    if (/^\d*$/.test(e.target.value)) {
      setRoomCode(e.target.value)
    }
  }

  const goToRoom = (code) => {
    code *= 1000
    code += 1
    setRoomCode(code)
    setGrading(true)
  }

  const formatRelativeTime = (createdTime) => {
    const elapsed = Date.now() - createdTime
    const seconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (seconds < 60) return "just now"
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`
    return `${months} month${months !== 1 ? "s" : ""} ago`
  }

  const formatFullTimestamp = (createdTime) => {
    const date = new Date(createdTime)
    return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
  }

  const isOlderThanWeek = (createdTime) => {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000
    return Date.now() - createdTime > oneWeekInMs
  }

  // Filter rooms into recent and older categories
  const getFilteredRooms = () => {
    if (!rooms) return { recentRooms: [], olderRooms: [] }

    const sortedRooms = [...rooms].reverse()
    const recentRooms = sortedRooms.filter((room) => room.code && !isOlderThanWeek(room.created))
    const olderRooms = sortedRooms.filter((room) => room.code && isOlderThanWeek(room.created))

    return { recentRooms, olderRooms }
  }

  const { recentRooms, olderRooms } = getFilteredRooms()
  const hasOlderRooms = olderRooms.length > 0

  const renderRoomChip = (room) => (
    <div
      key={room.code}
      className="relative flex items-center justify-between px-3 py-1.5 w-[190px] bg-gradient-to-r from-gray-800 to-gray-700 rounded-md shadow cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 border border-cyan-500/30"
      onMouseEnter={() => setHoveredRoom(room.code)}
      onMouseLeave={() => setHoveredRoom(null)}
      onClick={() => goToRoom(room.code)}
    >
      <span className="text-cyan-300 font-semibold text-sm">{room.display || room.code}</span>
      <span className="text-gray-400 text-xs ml-2">{formatRelativeTime(room.created)}</span>

      {/* Tooltip for Full Timestamp */}
      {hoveredRoom === room.code && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-md font-montserrat whitespace-nowrap border border-cyan-500/30 z-10">
          {formatFullTimestamp(room.created)}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-gray-800" />
        </div>
      )}
    </div>
  )

  return !grading ? (
    <div className="flex-grow flex items-center justify-center mb-8">
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg flex flex-col items-center p-8 border border-cyan-500/30">
        <h2 className="text-3xl font-bold mb-8 text-white">Grade Room</h2>

        {/* Scrollable Chips Container */}
        <div className="w-full mb-6">
          <h3 className="text-xl font-semibold text-cyan-300 mb-4 text-center">Rooms (Newest to Oldest)</h3>

          {/* Recent Rooms */}
          <div className="max-h-40 w-full overflow-y-auto custom-scrollbar mb-2">
            <div className="flex flex-wrap gap-2 px-2 justify-center">
              {recentRooms.map(renderRoomChip)}
              {recentRooms.length === 0 && (
                <p className="text-gray-400 text-center w-full py-2">No recent rooms found</p>
              )}
            </div>
          </div>

          {/* Older Rooms Dropdown */}
          {hasOlderRooms && (
            <div className="w-full mt-3">
              <button
                onClick={() => setShowOlderRooms(!showOlderRooms)}
                className="flex items-center justify-center w-full py-2 px-4 bg-gray-800 text-cyan-300 rounded-md border border-cyan-500/30 hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="mr-2">
                  {showOlderRooms ? "Hide" : "Show"} Older Rooms ({olderRooms.length})
                </span>
                {showOlderRooms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showOlderRooms && (
                <div className="mt-3 max-h-40 overflow-y-auto custom-scrollbar border border-cyan-500/20 rounded-md p-2 bg-gray-800/50">
                  <div className="flex flex-wrap gap-2 px-2 justify-center mt-10">{olderRooms.map(renderRoomChip)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden">
          <div className="flex items-center w-full my-6">
            <div className="flex-grow h-px bg-cyan-500/30"></div>
            <span className="mx-4 text-cyan-300 font-semibold">or</span>
            <div className="flex-grow h-px bg-cyan-500/30"></div>
          </div>

          {/* Room Code Input */}
          <div className="w-full mb-8">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4 text-center">Enter Room Code</h3>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={handleRoomCodeChange}
              maxLength="11"
              className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-400 text-center text-lg cursor-not-allowed"
              placeholder="Enter room code"
              onKeyUp={(e) => {
                if (e.key === "Enter") handleGrade()
              }}
            />
          </div>

          {/* Grade Button */}
          <button
            onClick={handleGrade}
            className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 shadow-lg shadow-cyan-500/30 transform hover:scale-105"
          >
            Grade
          </button>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4fd1c5;
          border-radius: 0.25rem;
          border: 3px solid transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4fd1c5 transparent;
        }
      `}</style>
    </div>
  ) : (
    <GradingPanel initialRoomCode={roomCode} pin={pin} />
  )
}

export default JoinRoom

