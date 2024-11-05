import React, { useState } from 'react';
import { FaFrownOpen, FaFrown, FaMeh, FaSmile, FaGrin } from 'react-icons/fa';
import './FeedbackPage.css';
import { toast } from 'react-toastify';

const FeedbackPage = () => {
    let [selectedFace, setSelectedFace] = useState(null);
    let [feedback, setFeedback] = useState('');

    const faces = [
        { id: 1, icon: <FaFrownOpen />, color: '#c80707' },
        { id: 2, icon: <FaFrown />, color: '#f24838' },
        { id: 3, icon: <FaMeh />, color: '#ffd700' },
        { id: 4, icon: <FaSmile />, color: '#46f238' },
        { id: 5, icon: <FaGrin />, color: '#05b505' },
    ];
        
    
    const handleFaceClick = (id) => {
        setSelectedFace(id);
    };

    const handleSubmit = async () => {
        console.log('Feedback submitted:', { selectedFace, feedback });

        const params = new URLSearchParams(window.location.search);

        const name = params.get('name');

        if (!name) {
            console.error('Name not found in URL');
            toast.error('Name not found in URL');
            return;
        }

        const code = params.get('code');

        if (!code) {
            console.error('Code not found in URL');
            toast.error('Code not found in URL');
            return;
        }

        const response = await fetch(`https://server.speakeval.org/submit_feedback?name=${name}&code=${code}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: `{"feedback": "${feedback} (Rating: ${selectedFace})"}`,
        });

        if (response.ok) {
            console.log('Feedback submitted successfully');
            toast.success('Feedback submitted successfully');
            // Close the window after 1 second

            setTimeout(() => {
                // if in a popup window, close the window. Otherwise, if in a normal window in a normal tab, do nothing
                if (window.opener) {
                    window.close();
                }
            }, 1000);
        } else {
            console.error('Error submitting feedback');
            toast.error('Error submitting feedback');
        }

        

    };

    const countChars = (text) => text.length;

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
                <div className="textarea-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                    <textarea
                        className="feedback-box"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value.substring(0, 500))}
                        placeholder="Enter additional feedback here..."
                        style={{
                            width: '100%',
                            height: '100px',
                            padding: '10px',
                            paddingBottom: '30px', // Add space at the bottom for the word count
                            fontSize: '1rem',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            resize: 'vertical', // Allow resizing both horizontally and vertically
                            boxSizing: 'border-box',
                            overflowY: 'scroll', // Ensure the scrollbar is always visible
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '8.5px',
                            right: '20px',
                            color: 'gray',
                            fontSize: '12px',
                            pointerEvents: 'none', // Make sure it doesn't block typing
                            zIndex: 1, // Ensure it stays above the textarea background
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', // Add opaque background
                            padding: '2px 5px', // Add some padding
                            borderRadius: '3px', // Add some border radius
                        }}
                    >
                        {countChars(feedback)}/500
                    </div>
                </div>
                <button className="submit-button" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default FeedbackPage;
