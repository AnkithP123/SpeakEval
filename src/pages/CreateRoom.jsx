import React, { useState } from 'react';
import { toast } from 'react-toastify';
import RoomPanel from '../components/RoomPanel';
import { useNavigate } from 'react-router-dom';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined

function CreateRoom({ initialUserId = '' }) {
    const [userId, setUserId] = useState(initialUserId);
    const [loggedIn, setLoggedIn] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const navigate = useNavigate();

    const handleInputChange = async (e) => {
        const input = e.target.value;
        if (input.length <= 7) {
            await setUserId(input.toUpperCase());
        }
    };

    const checkUserId = async (userId) => {
        let parsedData;
        try {
            let res = await fetch(`https://backend-8zsz.onrender.com/teacherpin?pin=${userId}`);
            parsedData = await res.json();

            if (parsedData.code === 401) {
                console.error(parsedData);
                toast.error("Incorrect Teacher Pin");
                setShake(true); // Trigger the shake effect
                setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
                return setUserId('');
            }
            if (parsedData.code === 200) {
                console.log(parsedData);
                setLoggedIn(true);
                let time = Date.now();
                time = time.toString().slice(-6);
                res = await fetch(`https://backend-8zsz.onrender.com/create_room?code=${time}`);
                parsedData = await res.json();
                if(parsedData.code === 400){
                    toast.error("Unable to generate room code"); 
                    return navigate('/create-room');
                }
                setRoomCode(time);
            }
        } catch (err) {
            console.error("Error Loading Data", err);
            toast.error("Error Loading Data");
            setShake(true); // Trigger the shake effect
            setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
            return setUserId('');
        }
        console.log(parsedData);
    };

    const handleGoClick = () => {
        checkUserId(userId);
    };

    const containerStyle = {
        position: 'relative',
        padding: '10px 20px',
        borderRadius: '10px',
        backgroundColor: 'white',
        color: 'white',
        fontFamily: "sans-serif",
        fontSize: '18px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        maxWidth: '300px',
        margin: '20px auto',
        textAlign: 'center',
    };

    const inputStyle = {
        width: 'calc(100% - 50px)', // Reduced width to accommodate the button
        padding: '10px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'black',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        textAlign: 'center',
        outline: 'none',
        letterSpacing: '2px',
        marginRight: '10px', // Add some space between input and button
    };

    const buttonStyle = {
        backgroundColor: 'black', // Green background
        border: 'none',
        color: 'white',
        padding: '5px 10px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '5px',
    };

    return (
        !loggedIn ? 
        <div style={containerStyle} className={shake ? 'shake' : ''}>
            <input
                type="password"
                value={userId}
                onChange={handleInputChange}
                style={inputStyle}
                maxLength={7}
                placeholder="Enter Teacher Pin"
            />
            <button onClick={handleGoClick} style={buttonStyle}>Log In</button>
        </div> : <RoomPanel roomCode={roomCode}  />
    );
}

export default CreateRoom;
