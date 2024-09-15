import React, { useState } from 'react';
import { FaFrownOpen, FaFrown, FaMeh, FaSmile, FaGrin } from 'react-icons/fa';
import './FeedbackPage.css'; // Make sure to create and style this CSS file
import { toast } from 'react-toastify';

const FeedbackPage = () => {
    const [selectedFace, setSelectedFace] = useState(null);
    const [feedback, setFeedback] = useState('');

    const faces = [
        { id: 1, icon: <FaFrownOpen />, color: 'darkred' },
        { id: 2, icon: <FaFrown />, color: 'red' },
        { id: 3, icon: <FaMeh />, color: 'gold' }, // Changed to a darker yellow
        { id: 4, icon: <FaSmile />, color: 'chartreuse' },
        { id: 5, icon: <FaGrin />, color: 'green' },
    ];

    const handleFaceClick = (id) => {
        setSelectedFace(id);
    };

    const handleSubmit = async () => {
        // Handle the submit action here
        console.log('Feedback submitted:', { selectedFace, feedback });

        const response = await fetch('https://backend-55dm.onrender.com/submit_feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ selectedFace, feedback }),
        });

        if (response.ok) {
            console.log('Feedback submitted successfully');
            toast.success('Feedback submitted successfully');
        } else {
            console.error('Error submitting feedback');
            toast.error('Error submitting feedback. No big deal!');
        }

    };

    return (
        <div className="feedback-page">
            <h1 className="page-heading" style={{ fontSize: '2.5em', fontWeight: 'bold' }}>Feedback</h1>
            <div className="feedback-card">
                <h1 className="feedback-heading">How was your experience?</h1>
                <br></br>
                <div className="faces">
                    {faces.map(face => (
                        <span
                            key={face.id}
                            className={`face ${selectedFace === face.id ? 'selected' : ''}`}
                            style={{ color: selectedFace === face.id ? face.color : 'gray' }}
                            onClick={() => handleFaceClick(face.id)}
                        >
                            {face.icon}
                        </span>
                    ))}
                </div>
                <textarea
                    className="feedback-box"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter additional feedback here..."
                />
                <button className="submit-button" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default FeedbackPage;