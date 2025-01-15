import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import RoomCodePanel from '../components/RoomCodePanel';
import { useNavigate } from 'react-router-dom';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined
import Card from '../components/Card';

function TeacherPortalRouter({ initialUserId = '', set, setUltimate, getPin }) {
    const [userId, setUserId] = useState(getPin());
    const [loggedIn, setLoggedIn] = useState(userId);
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [rooms, setRooms] = useState([]); // State to store the rooms
    const navigate = useNavigate();

    const handleInputChange = async (e) => {
        const input = e.target.value;
        await setUserId(input.toUpperCase());
    };

    const checkUserId = async (userId) => {
        let parsedData;
        try {
            let res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`);
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
            }
            if (parsedData.subscription) {
                set(parsedData.subscription !== 'free');
                setUltimate(parsedData.subscription === 'Ultimate');
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

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login?redirect=/teacher-portal'); // Navigate to the login page
        }
    }, [loggedIn, navigate]);
    

    const fetchRooms = async () => {
        try {
            const res = await fetch(`https://www.server.speakeval.org/getrooms?pin=${userId}`);
            let data = await res.json();
            for (let i = 0; i < data.length; i++) {
                if (data[i].code)
                    data[i].code = parseInt(data[i].code.toString().slice(0, -3));
            }

            // remove data duplicates
            data = data.filter((room, index, self) => {
                const firstIndex = self.findIndex((t) => t.code === room.code);
                if (firstIndex === index) {
                    return true;
                }
                if (room.display) {
                    self[firstIndex] = room;
                }
                return false;
            });

            data = data.sort((a, b) => a.created - b.created);

            console.log(data);
            setRooms(data);
        } catch (err) {
            console.error("Error Fetching Rooms", err);
            toast.error("Error Fetching Rooms");
        }
    };

    useEffect(() => {
        if (loggedIn) {
            fetchRooms();
        }
    }, [loggedIn]);

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

    const configList = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    };

    return (
        !loggedIn ? 
        <div style={containerStyle} className={shake ? 'shake' : ''}>
            <input
                type="password"
                value={userId}
                onChange={handleInputChange}
                style={inputStyle}
                maxLength={30}
                placeholder="Enter Teacher Pin"
                onKeyUp={(e) => e.key === 'Enter' && handleGoClick()}
            />
            <button onClick={handleGoClick} style={buttonStyle}>Log In</button>
        </div> : <div>
        

        

            <RoomCodePanel rooms={rooms} pin={userId}/>
        </div>        

    );

}

export default TeacherPortalRouter;
