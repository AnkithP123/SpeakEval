import { parse } from 'dotenv';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function UserIdDisplay({ initialUserId = '' }) {
    const [userId, setUserId] = useState(initialUserId);
    const navigate = useNavigate();

    const handleInputChange = async(e) => {
        const input = e.target.value;
        setUserId(input.toUpperCase());
    };

    const checkUserId = async(userId) =>{
        let parsedData;
        try {
            let res = await fetch(`https://backend-api-2l08.onrender.com/pvCheck?id=${userId}`);
            let data = await res.json();
            parsedData = JSON.parse(data);
    
            if(parsedData.error){
                console.error(parsedData);
                toast.error(parsedData.error);
                return setUserId('');
            }
        } catch(err) {
            console.error("Error Loading Data", err);
            toast.error("Error Loading Data");
            return setUserId('');
        }
        console.log(parsedData);
    }

    const handleGoClick = () => {
        checkUserId(userId);
    };

    const containerStyle = {
        position: 'relative',
        padding: '10px 20px',
        borderRadius: '10px',
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        color: 'white',
        fontFamily: "'MuseoModerno', sans-serif",
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
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        textAlign: 'center',
        outline: 'none',
        letterSpacing: '2px',
        marginRight: '10px', // Add some space between input and button
    };

    const buttonStyle = {
        backgroundColor: '#4CAF50', // Green background
        border: 'none',
        color: 'white',
        padding: '5px 10px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '16px',
        margin: '4px 2px',
        cursor: 'pointer',
        borderRadius: '5px',
    };

    return (
        <div style={containerStyle}>
            <input
                type="password"
                value={userId}
                onChange={handleInputChange}
                style={inputStyle}
                maxLength={30}
                placeholder="Enter User ID"
            />
            <button onClick={handleGoClick} style={buttonStyle}>Search</button>
        </div>
    );
}


export default UserIdDisplay;