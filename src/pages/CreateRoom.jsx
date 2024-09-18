import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import RoomPanel from '../components/RoomPanel';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined

function CreateRoom({ initialUserId = '' }) {
    const [userId, setUserId] = useState(initialUserId);
    const [loggedIn, setLoggedIn] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [configId, setConfigId] = useState(''); // State to store the config ID
    const [isConfigEntered, setIsConfigEntered] = useState(false); // Track if config ID has been entered
    const [configs, setConfigs] = useState([]); // State to store the configs
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConfigs = async () => {
            console.log("Fetching Configs");
            try {
                const res = await fetch(`https://backend-4abv.onrender.com/getconfigs?pin=${userId}`);
                const parsedData = await res.json();
                setConfigs(parsedData);
                console.log(configs)
            } catch (err) {
                console.error("Error Loading Configs", err);
                toast.error("Error Loading Configs");
            }
        };

        if (loggedIn) {
            fetchConfigs();
        }
    }, [loggedIn, userId]);

    const handleInputChange = async (e) => {
        const input = e.target.value;
        setUserId(input.toUpperCase());
    };

    const handleConfigChange = (e) => {
        setConfigId(e.target.value);
    };

    const checkUserId = async (userId) => {
        let parsedData;
        try {
            let res = await fetch(`https://backend-4abv.onrender.com/teacherpin?pin=${userId}`);
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
                // Move to the config page
                setIsConfigEntered(false);
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

    const handleConfigSubmit = async () => {
        let time = Date.now();
        time = time.toString().slice(-8);
        try {
            const res = await fetch(`https://backend-4abv.onrender.com/create_room?code=${time}&pin=${userId}&config=${configId}`);
            const parsedData = await res.json();
            if (parsedData.code === 400) {
                toast.error(parsedData.message); 
                return navigate('/create-room');
            }
            setRoomCode(time);
            setIsConfigEntered(true);
        } catch (err) {
            console.error("Error Creating Room", err);
            toast.error("Error Creating Room");
        }
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

    const configPageStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    };

    const configInputStyle = {
        width: '300px',
        padding: '10px',
        border: '1px solid black',
        borderRadius: '5px',
        marginBottom: '10px',
        fontSize: '16px',
    };

    const configButtonStyle = {
        backgroundColor: 'black',
        border: 'none',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
    };

    const configList = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '20px',
        color: 'black',
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
        </div> : !isConfigEntered ? 
        <div style={containerStyle}>
            <input
                type="text"
                value={configId}
                onChange={handleConfigChange}
                style={inputStyle}
                placeholder="Enter Config ID"
                onKeyUp={(e) => {if (e.key === 'Enter') handleConfigSubmit()}}
            />
            <button onClick={handleConfigSubmit} style={buttonStyle}>Create Room</button>
            <div style={configList}>
            <div>
                <p>Your configurations:</p>
            </div>
            <div style = {configList}>
                {configs.length === 0 ? <p className='text-2xl font-bold'>No configurations found. Go to the configurations page to make one.</p> : configs.map((config) => (
                    config.name ?
                    (
                        <h2 className="text-2xl font-bold">{config.name}</h2>
                    ) : null
                ))}
            </div>
            </div>
        </div>
        :<RoomPanel roomCode={roomCode} userId={userId} />
    );
}

export default CreateRoom;
