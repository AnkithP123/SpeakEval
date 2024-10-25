import React, { useState } from 'react';
import { toast } from 'react-toastify';

function TeacherPin({ subscriptionData, onPinEntered }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect

    const handlePinSubmit = async () => {
        let parsedData;
        try {
            let res = await fetch(`https://backend-4abv.onrender.com/teacherpin?pin=${pin}`);
            parsedData = await res.json();

            if (parsedData.code === 401) {
                console.error(parsedData);
                toast.error("Incorrect Teacher Pin");
                setShake(true); // Trigger the shake effect
                setTimeout(() => setShake(false), 500); // Remove shake effect after 500ms
                return setPin('');
            }
            if (parsedData.code === 200) {
                console.log(parsedData);
                onPinEntered(pin);  // Call the function to proceed after pin is entered
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

    const handleInputChange = async (e) => {
        const input = e.target.value;
        await setPin(input.toUpperCase());
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
            type="password"
            value={pin}
            onChange={handleInputChange}
            style={inputStyle}
            maxLength={30}
            placeholder="Enter Teacher Pin"
            onKeyUp={(e) => e.key === 'Enter' && handlePinSubmit()}
        />
        <button onClick={handlePinSubmit} style={buttonStyle}>Log In</button>
    </div>
    );
}

export default TeacherPin;
