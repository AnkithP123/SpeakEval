import React, { useState } from 'react';
import { toast } from 'react-toastify';

function TeacherPin({ subscriptionData, onPinEntered }) {
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState(''); // State for email
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect

    const handlePinSubmit = async () => {
        let parsedData;
        try {
            let res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${pin}`);
            parsedData = await res.json();

            if (parsedData.code === 401 || !email || email === '' || !isValidEmail(email)) {
                console.error(parsedData);
                toast.error(email && email !== '' && isValidEmail(email) ? "Incorrect Teacher Pin" : ((!email || email === '') ? "Please enter an email" : "Invalid Email"));
                setShake(true); // Trigger the shake effect
                setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
                return setPin('');
            }
            if (parsedData.code === 200) {
                console.log(parsedData);
                onPinEntered(pin, email);  // Call the function to proceed after pin and email are entered
            }
        } catch (err) {
            console.error("Error Loading Data", err);
            toast.error("Error Loading Data");
            setShake(true); // Trigger the shake effect
            setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
            return setPin('');
        }
        console.log(parsedData);

    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handlePinChange = async (e) => {
        const input = e.target.value;
        await setPin(input.toUpperCase());
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
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
        <div style={containerStyle} className={shake ? 'shake' : ''}>
            <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                style={{ ...inputStyle, backgroundColor: '#f9f9f9' }} // Lighter background color
                placeholder="Enter Email"
            />
            <hr style={{ width: '100%', border: '1px solid lightgray', margin: '10px 0' }} /> {/* Lighter border color */}
            <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                style={{ ...inputStyle, backgroundColor: '#f9f9f9' }} // Lighter background color
                maxLength={30}
                placeholder="Enter Teacher Pin"
                onKeyUp={(e) => e.key === 'Enter' && handlePinSubmit()}
            />
            <button onClick={handlePinSubmit} style={buttonStyle}>Log In</button>
        </div>
    );
}

export default TeacherPin;
