import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import RoomPanel from '../components/RoomPanel';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined

function CreateRoom({ initialUserId = '', set, setUltimate }) {
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
                const res = await fetch(`https://www.server.speakeval.org/getconfigs?pin=${userId}`);
                const parsedData = await res.json();
                setConfigs(parsedData);
                console.log(configs);
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
            let res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`);
            parsedData = await res.json();

            if (parsedData.code === 401) {
                console.error(parsedData);
                toast.error("Incorrect Teacher Pin");
                setShake(true);
                setTimeout(() => setShake(false), 500);
                return setUserId('');
            }
            if (parsedData.code === 200) {
                setLoggedIn(true);
                setIsConfigEntered(false);
            }
            if (parsedData.subscription) {
                set(parsedData.subscription !== 'free');
                setUltimate(parsedData.subscription === 'Ultimate');
            }
            
        } catch (err) {
            console.error("Error Loading Data", err);
            toast.error("Error Loading Data");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return setUserId('');
        }
    };

    const handleGoClick = () => {
        checkUserId(userId);
    };

    const handleConfigSubmit = async () => {
        if (configId === '') {
            return toast.error("Please enter a config name into the box or click one of your saved configs before creating the room!");
        }
        let time = Date.now();
        time = (Math.floor(Math.random() * 5) + 1) + time.toString().slice(-7) + '001';
        try {
            const get = await fetch(`https://www.server.speakeval.org/verifyconfig?name=${configId}`);
            const parsedData = await get.json();

            if (parsedData.error) {
                return toast.error(parsedData.error);
            }
        } catch (err) {
            console.error("Error Verifying Config Existence", err);
            toast.error("Error Verifying Config Existence");
        }
        try {
            const res = await fetch(`https://www.server.speakeval.org/create_room?code=${time}&pin=${userId}&config=${configId}`);
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
        width: 'calc(100% - 50px)',
        padding: '10px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'black',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        textAlign: 'center',
        outline: 'none',
        letterSpacing: '2px',
        marginRight: '10px',
    };

    const buttonStyle = {
        backgroundColor: 'black',
        border: 'none',
        color: 'white',
        padding: '5px 10px',
        textAlign: 'center',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '5px',
    };

    const chipStyle = {
        display: 'inline-block',
        padding: '5px 10px',
        margin: '5px',
        borderRadius: '15px',
        backgroundColor: '#f0f0f0',
        color: '#333',
        fontSize: '14px',
        cursor: 'pointer',
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

    return (
        !loggedIn ? 
        <div>
            <title hidden>Create Room</title>
            <div style={containerStyle} className={shake ? 'shake' : ''}>
                <title hidden>Join Room</title>
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
            </div>
        </div> : 
        !isConfigEntered ? 
        <div>
            <title hidden>Create Room</title>
            <div style={containerStyle}>
                <div>
                    {configs.length > 0 ? 
                    configs.map((config) => (
                        config.name ? (
                            <div
                                key={config.name}
                                style={chipStyle}
                                onClick={() => setConfigId(config.name)}
                            >
                                {config.name}
                            </div>
                        ) : null
                    )) : 
                    <><p className='text-2xl font-bold' style={{ color: 'black' }}>No configurations found. Go to the configurations page to make one.</p>
                    <hr style={{ width: '100%', border: '1px solid lightgray', margin: '10px 0' }} /></>
                    }
                </div>
                <input
                    type="text"
                    value={configId}
                    onChange={handleConfigChange}
                    style={inputStyle}
                    placeholder="Enter Name of Set"
                    onKeyUp={(e) => {if (e.key === 'Enter') handleConfigSubmit()}}
                />
                <button onClick={handleConfigSubmit} style={buttonStyle}>Create Room</button>
            </div>
        </div>
        : <RoomPanel roomCode={roomCode} userId={userId} setRoomCodes={setRoomCode} />
    );
}

export default CreateRoom;
