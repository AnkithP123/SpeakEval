import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import GradingPanel from '../pages/TeacherPortalRoom.jsx';

function JoinRoom({ rooms }) {
    const [roomCode, setRoomCode] = useState('');
    const [grading, setGrading] = useState(false);

    const handleGrade = async () => {
        if (roomCode) {
            console.log('Grading room with code:', roomCode);
            setGrading(true);
        } else {
            console.log('Please fill out the room code field.');
            toast.error('Please fill out the room code field.');
        }
    };

    const handleRoomCodeChange = (e) => {
        if (/^\d*$/.test(e.target.value)) {
            setRoomCode(e.target.value);
        }
    };

    return (
        (!grading) ? (
            <div className="flex-grow flex items-center justify-center mt-[12%]">
                <div className="w-[400px] bg-white rounded-lg shadow-lg flex flex-col items-center p-8">
                    <h2 className="text-3xl font-bold mb-8">Grade Room</h2>
                    <div className="w-full mb-8">
                        <label className="block text-lg font-semibold mb-2" htmlFor="roomCode">Room Code</label>
                        <input
                            id="roomCode"
                            type="text"
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            maxLength="11"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Enter room code"
                            onKeyUp={(e) => { if (e.key === 'Enter') handleGrade(); }}
                        />
                    </div>
                    <button
                        onClick={handleGrade}
                        className="w-full p-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Grade
                    </button>
                    <h2 className="text-[18px] font-bold mt-8">Rooms, Newest to Oldest (Scrollable)</h2>
                    <div className="max-h-40 w-full overflow-y-auto">
                        {rooms ? rooms.slice().reverse().map((room) => (
                            <h2 key={room.code} className="text-center py-2 border-b">{room.code}</h2>
                        )) : null}
                    </div>
                </div>
            </div>
        ) : <GradingPanel roomCode={roomCode} />
    );
}

export default JoinRoom;
