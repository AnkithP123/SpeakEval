import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined
import Card from '../components/Card';

const Configure = () => {
    const [userId, setUserId] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [questions, setQuestions] = useState([]); // State to store recorded questions
    const [recording, setRecording] = useState(false); // State to track recording status
    const [categories, setCategories] = useState([{ name: '', descriptions: Array(5).fill('') }]); // State to store categories and their descriptions
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);

    const handleInputChange = async (e) => {
        const input = e.target.value;
        if (input.length <= 7) {
            await setUserId(input.toUpperCase());
        }
    };

    const handleGoClick = () => {
        checkUserId(userId);
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

    const handleToggleRecording = () => {
        if (navigator.mediaDevices.getUserMedia) {
            if (recording) {
                // Stop recording
                mediaRecorderRef.current.stop();
                setRecording(false); // Set recording status to false
            } else {
                // Start recording
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then((stream) => {
                        mediaRecorderRef.current = new MediaRecorder(stream);
                        mediaRecorderRef.current.start();
                        mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
                        setRecording(true); // Set recording status to true
                    })
                    .catch((err) => {
                        console.error("Error accessing microphone", err);
                        toast.error("Error accessing microphone");
                    });
            }
        } else {
            console.error("getUserMedia not supported");
            toast.error("getUserMedia not supported");
        }
    };

    const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
            const recordedQuestion = URL.createObjectURL(event.data);
            setQuestions((prevQuestions) => [...prevQuestions, recordedQuestion]);
        }
    };

    const handleDeleteQuestion = (index) => {
        setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index));
        toast.success("Question deleted");
    };

    const handleAddCategory = () => {
        setCategories((prevCategories) => [...prevCategories, { name: '', descriptions: Array(5).fill('') }]);
    };

    const handleCategoryNameChange = (index, e) => {
        const { value } = e.target;
        setCategories((prevCategories) => {
            const updatedCategories = [...prevCategories];
            updatedCategories[index].name = value;
            return updatedCategories;
        });
    };

    const handleCategoryDescriptionChange = (categoryIndex, pointIndex, e) => {
        const { value } = e.target;
        setCategories((prevCategories) => {
            const updatedCategories = [...prevCategories];
            // Update the specific description for the point within the category
            updatedCategories[categoryIndex].descriptions[pointIndex] = value;
            return updatedCategories;
        });
    };
    

    const handleDeleteCategory = (index) => {
        setCategories((prevCategories) => prevCategories.filter((_, i) => i !== index));
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

    const cardStyle = {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        maxWidth: '300px',
        margin: '20px auto',
        textAlign: 'center',
    };

    const chipStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F3FF',
        color: 'black',
        padding: '8px',
        borderRadius: '16px',
        margin: '4px',
    };

    const deleteButtonStyle = {
        marginRight: '8px',
        cursor: 'pointer',
        color: 'red',

    };

    const rubricContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'auto repeat(5, 1fr)',
        gap: '8px',
        marginTop: '16px',
    };

    const rubricHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F3FF',
        color: 'black',
        padding: '8px',
        borderRadius: '16px',
        fontWeight: 'bold',
    };

    const rubricCellStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: 'black',
        padding: '8px',
        borderRadius: '16px',
        border: '1px solid #E6F3FF',
    };

    return (
        <div>
            {loggedIn ? (
                <div className="container-xl lg:container m-auto">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 p-8 rounded-lg justify-center">
                        <Card bg="bg-[#E6F3FF]" className="w-64 h-80 p-8">
                            <h2 className="text-2xl font-bold mb-4 text-center">Record Questions</h2>
                            <div className="flex justify-center">
                                <button onClick={handleToggleRecording} style={buttonStyle}>
                                    {recording ? "Stop" : "Record Question"}
                                </button>
                            </div>
                            {recording && <p className="text-red-500 mt-4 text-center">Recording...</p>}
                            {questions.map((question, index) => (
                                <div key={index} style={chipStyle}>
                                    <audio controls src={question} />
                                    <span
                                        style={deleteButtonStyle}
                                        onClick={() => handleDeleteQuestion(index)}
                                    >
                                        &#x2715;
                                    </span>
                                </div>
                            ))}
                        </Card>
                        <Card bg="bg-[#E6F3FF]" className="w-64 h-80 p-8">
                            <h2 className="text-2xl font-bold mb-4 text-center">Create Rubrics</h2>
                            <div style={rubricContainerStyle}>
            <div style={rubricHeaderStyle}>Category</div>
            {[5, 4, 3, 2, 1].map((point) => (
                <div key={point} style={rubricCellStyle}>{point}</div>
            ))}
            {categories.map((category, index) => (
                <React.Fragment key={index}>
                    <div style={rubricCellStyle}>
                    <span
                            style={deleteButtonStyle}
                            onClick={() => handleDeleteCategory(index)}
                        >
                            &#x2715;
                        </span>
                        <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryNameChange(index, e)}
                            maxLength={50}
                            placeholder="Category Name"
                        />
                        
                    </div>
                    {[5, 4, 3, 2, 1].map((point) => (
                        <input
                            key={point}
                            type="text"
                            value={category.descriptions[point - 1]}
                            onChange={(e) => handleCategoryDescriptionChange(index, point - 1, e)}
                            style={rubricCellStyle}
                            maxLength={50}
                            placeholder={`Description ${point}`}
                        />
                    ))}
                </React.Fragment>
            ))}
        </div>
                            <button onClick={handleAddCategory} style={buttonStyle}>Add Category</button>
                        </Card>
                    </div>
                </div>
            ) : (
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
                </div>
            )}
        </div>
    );
}

export default Configure;
