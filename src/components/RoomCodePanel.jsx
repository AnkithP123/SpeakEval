import React, { useState } from 'react';
import { toast } from 'react-toastify';
import GradingPanel from '../pages/TeacherPortalRoom.jsx';

function JoinRoom({ rooms }) {
    const [roomCode, setRoomCode] = useState('');
    const [grading, setGrading] = useState(false);
    const [hoveredRoom, setHoveredRoom] = useState(null);

    const handleGrade = async () => {
        if (roomCode) {
            console.log('Grading room with code:', roomCode);
            setGrading(true);
        } else {
            toast.error('Please fill out the room code field.');
        }
    };

    const handleRoomCodeChange = (e) => {
        if (/^\d*$/.test(e.target.value)) {
            setRoomCode(e.target.value);
        }
    };

    const goToRoom = (code) => {
        code *= 1000;
        code += 1;
        console.log('Going to room with code:', code);
        setRoomCode(code);
        setGrading(true);
    };

    const formatRelativeTime = (createdTime) => {
        const elapsed = Date.now() - createdTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    };

    const formatFullTimestamp = (createdTime) => {
        const date = new Date(createdTime);
        return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        (!grading) ? (
            <div className="flex-grow flex items-center justify-center mb-[30px]">
                <div className="w-[500px] bg-white rounded-lg shadow-lg flex flex-col items-center p-8">
                    <h2 className="text-3xl font-bold mb-6">Grade Room</h2>
                    
                    {/* Scrollable Chips Container */}
                    <div className="max-h-40 w-full overflow-y-auto mb-6">
                        <div className="flex flex-wrap gap-2 px-2 justify-center">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">Rooms (Newest to Oldest)</h2>
                            {rooms ? rooms.slice().reverse().map((room) => (
                                room.code ? (
                                    <div 
                                        key={room.code} 
                                        className="relative flex items-center justify-between px-3 py-1.5 w-[190px] bg-gradient-to-r from-gray-50 to-gray-200 rounded-md shadow cursor-pointer transition-all duration-300 hover:shadow-lg"
                                        onMouseEnter={() => setHoveredRoom(room.code)}
                                        onMouseLeave={() => setHoveredRoom(null)}
                                        onClick={() => goToRoom(room.code)}
                                    >
                                        <span className="text-gray-800 font-semibold text-sm">{room.code}</span>
                                        <span className="text-gray-500 text-xs ml-2">{formatRelativeTime(room.created)}</span>
                                        
                                        {/* Tooltip for Full Timestamp */}
                                        {hoveredRoom === room.code && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-md font-montserrat whitespace-nowrap">
                                                {formatFullTimestamp(room.created)}
                                                <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-gray-800" />
                                            </div>
                                        )}
                                    </div>
                                ) : null
                            )) : null}
                        </div>
                    </div>
                                        
                    {/* Divider */}
                    <div className="flex items-center my-4">
                        <span className="mx-4 text-gray-500">or</span>
                    </div>
                    
                    {/* Room Code Input */}
                    <div className="w-full mb-6">
                        <div className="flex items-center justify-center mb-2">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">Enter Room Code</h2>
                        </div>
                        <input
                            id="roomCode"
                            type="text"
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            maxLength="11"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter room code"
                            onKeyUp={(e) => { 
                                if (e.key === 'Enter') handleGrade(); 
                            }}
                        />
                    </div>
                    
                    {/* Grade Button */}
                    <button
                        onClick={handleGrade}
                        className="w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150"
                    >
                        Grade
                    </button>
                </div>
            </div>
        ) : <GradingPanel initialRoomCode={roomCode} />
    );
}

export default JoinRoom;
