import { cuteAlert } from 'cute-alert';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

function TeacherLogin({ subscriptionData, onPinEntered }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect

    const handleLoginSubmit = async () => {
        try {
            let res = await fetch('https://www.server.speakeval.org/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            let parsedData = await res.json();

            if (res.status !== 200 || !username || !password) {
                console.error(parsedData);
                toast.error(username && password ? parsedData.error || "Incorrect Username or Password" : "Please enter both username and password");
                setShake(true); // Trigger the shake effect
                setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
                return;
            }
            else {
                console.log(parsedData);
                onPinEntered(username)
            }
        } catch (err) {
            console.error("Error Loading Data", err);
            toast.error("Error Loading Data");
            setShake(true); // Trigger the shake effect
            setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
        }
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
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
        <div style={containerStyle} className={shake ? 'shake' : ''}>
            <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                style={{ ...inputStyle, backgroundColor: '#f9f9f9' }} // Lighter background color
                placeholder="Enter Username"
            />
            <hr style={{ width: '100%', border: '1px solid lightgray', margin: '10px 0' }} /> {/* Lighter border color */}
            <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                style={{ ...inputStyle, backgroundColor: '#f9f9f9' }} // Lighter background color
                maxLength={30}
                placeholder="Enter Password"
                onKeyUp={(e) => e.key === 'Enter' && handleLoginSubmit()}
            />
            <button onClick={handleLoginSubmit} style={buttonStyle}>Log In</button>
        </div>
    );
}

export default TeacherLogin;
