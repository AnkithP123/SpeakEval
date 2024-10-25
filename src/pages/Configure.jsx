import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined
import Card from '../components/Card';
import Upgrade from './Upgrade';
import { FaMagic } from 'react-icons/fa';

const Configure = () => {
    const [userId, setUserId] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [questions, setQuestions] = useState([]); // State to store recorded questions
    const [recording, setRecording] = useState(false); // State to track recording status
    const [categories, setCategories] = useState([{ name: '', descriptions: Array(5).fill('') }]); // State to store categories and their descriptions
    const [maxTime, setMaxTime] = useState(''); // State to store the max time limit
    const [selectedLanguage, setSelectedLanguage] = useState(''); // State to store the selected language
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const [id, setId] = useState('');
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showAutofillUpgrade, setShowAutofillUpgrade] = useState(false); // New state for autofill upgrade panel
    const [sparklePositions, setSparklePositions] = useState([]);

    useEffect(() => {
        setSparklePositions(generateSparklePositions());
      }, []); // Add dependencies if you want it to update on specific state or prop changes    

      useEffect(() => {
        // Define interval to update sparkle positions every second
        const intervalId = setInterval(() => {
          setSparklePositions(generateSparklePositions());
        }, 1720);
    
        // Cleanup the interval on component unmount
        return () => clearInterval(intervalId);
      }, []);

    const handleInputChange = async (e) => {
        const input = e.target.value;
        await setUserId(input.toUpperCase());
    };

    const handleGoClick = () => {
        checkUserId(userId);
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
        if (questions.length >= 30) {
            setShowUpgrade(true);
            setTimeout(() => {
            const message = document.createElement('div');
            message.textContent = "You have reached the maximum number of questions. Please upgrade to record more.";
            message.style.position = 'fixed';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.backgroundColor = 'black';
            message.style.color = 'white';
            message.style.padding = '20px';
            message.style.borderRadius = '10px';
            message.style.zIndex = '1000';
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.05s ease-in, opacity 0.2s ease-out';
            document.body.appendChild(message);

            setTimeout(() => {
                message.style.opacity = '1';
                setTimeout(() => {
                    message.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(message);
                    }, 1000);
                }, 1000);
            }, 10);
        }, 200);
            return;
        }
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

    const handleMaxTimeChange = (e) => {
        setMaxTime(e.target.value);
    };

    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleDeleteCategory = (index) => {
        setCategories((prevCategories) => prevCategories.filter((_, i) => i !== index));
    };

    const handleRegisterConfig = async () => {
        if (!id) {
            toast.error("Please enter an ID");
            return;
        }
        if (!userId) {
            toast.error("Please log in");
            return;
        }
        if (questions.length === 0) {
            toast.error("Please record at least one question");
            return;
        }
        try {
            const formData = new FormData();
            for (let i = 0; i < questions.length; i++) {
                // get audio blob
                const res = await fetch(questions[i]);
                const blob = await res.blob();
                formData.append(`question${i}`, blob, `question${i}.webm`);
            }

            console.log(JSON.stringify(questions));

            console.log(questions.length);

            const categoriesString = categories.map((category) => {
                return `${category.name}|:::| ${category.descriptions[0]}|,,| ${category.descriptions[1]}|,,| ${category.descriptions[2]}|,,| ${category.descriptions[3]}|,,| ${category.descriptions[4]}`;
            }).join('|;;|');

            const res = await fetch(`https://backend-4abv.onrender.com/registerconfig?id=${id}&pin=${userId}&length=${questions.length}&rubric=${categoriesString}&limit=${maxTime}&language=${selectedLanguage}`, {
                method: 'POST',
                body: formData,
            });

            const response = await res.json();

            if (res.ok && !(response.error)) {
                toast.success("Configuration registered successfully");
            } else {
                toast.error("Failed to register configuration" + response.error ? `: ${response.error}` : '');
            }
        } catch (err) {
            console.error("Error registering configuration", err);
            toast.error("Error registering configuration");
        }
    };

    const handleAutofillClick = () => {
        setShowAutofillUpgrade(true);
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

    const dropdownStyle = {
        width: '100%',
        padding: '10px',
        border: 'none',
        color: 'black',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        textAlign: 'center',
        outline: 'none',
        letterSpacing: '2px',
        marginTop: '10px',
    };

    const premiumButtonStyle = {
        background: 'linear-gradient(75deg, #CFA944, #F5ED88, #EBC764)', 
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, background-color 0.2s',
        fontSize: '1rem',
        fontWeight: 'bold',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden', 
    };
      
      const fancyButtonIconStyle = {
        marginRight: '8px',
      };
      
      // CSS keyframes and styles
const styles = `
@keyframes sparkle {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.7; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes gleam {
  0% { transform: translateX(-200%); }
  100% { transform: translateX(3072%); }
}

.sparkle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #FFFFFF 50%, transparent 50%);
  clip-path: polygon(
    50% 0%, 
    61% 35%, 
    98% 35%, 
    68% 57%, 
    79% 91%, 
    50% 70%, 
    21% 91%, 
    32% 57%, 
    2% 35%, 
    39% 35%
  );
  animation: sparkle 1.5s infinite;
  pointer-events: none;
}

.gleam {
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  animation: gleam 4s infinite;
  pointer-events: none;
  filter: blur(1px);
}
`;

const generateSparklePositions = () => {
    const positions = [];
    for (let i = 0; i < 3; i++) {
    positions.push({
      top: `${Math.random() * 100}%`, // Randomized top position
      left: `${Math.random() * 100}%`, // Randomized left position
      animationDelay: `${Math.random() * 1.5}s`, // Random delay
    });
    }
    return positions;
  };

return (
    <div>
        <style>{styles}</style>
        {showUpgrade && <Upgrade onClose={() => setShowUpgrade(false)} doc={document} />}
        {showAutofillUpgrade && <Upgrade onClose={() => setShowAutofillUpgrade(false)} />}
        <title hidden>Configure Exams</title>
        {loggedIn ? (
            <div className="container-xl lg:container m-auto">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8 p-8 rounded-lg justify-center">
                    <Card bg="bg-[#E6F3FF]" className="w-64 h-80 p-8">
                    <div className="flex justify-center items-center mb-4 relative">
                            <div className="w-[10%]"></div> {/* Spacer to balance the button on the right */}
                            <h2 className="text-2xl font-bold text-center flex-grow">
                                    Record Questions
                            </h2>
                            <button
                                    onClick={handleAutofillClick}
                                    style={premiumButtonStyle}
                                    className="absolute right-0"
                            >
                                    <FaMagic style={fancyButtonIconStyle} />
                                    Autofill
                                    <div className="gleam"></div>
                                    {sparklePositions.map((style, index) => (
                                    <div key={index} className="sparkle" style={style}></div>
                                    ))}
                            </button>
                            </div>

                        <div className="flex justify-center">
                            <button onClick={handleToggleRecording} style={buttonStyle}>
                                {recording ? 'Stop' : 'Record Question'}
                            </button>
                        </div>
                        {recording && (
                            <p className="text-red-500 mt-4 text-center">Recording...</p>
                        )}
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
                    <div className="flex justify-center items-center mb-4 relative">
                            <div className="w-[10%]"></div> {/* Spacer to balance the button */}
                            <h2 className="text-2xl font-bold text-center flex-grow">
                                    Create Rubric
                            </h2>
                            <button
                                    onClick={handleAutofillClick}
                                    style={premiumButtonStyle}
                                    className="absolute right-0"
                            >
                                    <FaMagic style={fancyButtonIconStyle} />
                                    Autofill
                                    <div className="gleam"></div>
                                    {sparklePositions.map((style, index) => (
                                    <div key={index} className="sparkle" style={style}></div>
                                    ))}
                            </button>
                    </div>

                        <div style={rubricContainerStyle}>
                            <div style={rubricHeaderStyle}>Category</div>
                            {[5, 4, 3, 2, 1].map((point) => (
                                <div key={point} style={rubricCellStyle}>
                                    {point}
                                </div>
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
                                            onChange={(e) =>
                                                handleCategoryDescriptionChange(index, point - 1, e)
                                            }
                                            style={rubricCellStyle}
                                            maxLength={500}
                                            placeholder={`Description ${point}`}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                        <button onClick={handleAddCategory} style={buttonStyle}>
                            Add Category
                        </button>
                    </Card>
                    <Card bg="bg-[#E6F3FF]" className="w-64 h-80 p-8">
                        <h2 className="text-2xl font-bold mb-4 text-center">
                            Additional Settings
                        </h2>
                        <div className="flex justify-center">
                            <input
                                type="text"
                                value={maxTime}
                                onChange={handleMaxTimeChange}
                                style={{ ...rubricCellStyle, width: '20%' }}
                                maxLength={20}
                                placeholder="Answer Time Limit, in seconds"
                            />
                        </div>
                        <div className="flex justify-center">
                            <select
                                value={selectedLanguage}
                                onChange={handleLanguageChange}
                                style={{ ...dropdownStyle, width: '20%' }}
                            >
                                <option value="">Select Language</option>
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Japanese">Japanese</option>
                            </select>
                        </div>
                    </Card>
                    <Card bg="bg-[#E6F3FF]" className="w-64 h-80 p-8">
                        <h2 className="text-2xl font-bold mb-4 text-center">
                            Register Configuration
                        </h2>
                        <div className="flex justify-center">
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                style={rubricCellStyle}
                                maxLength={15}
                                placeholder="Enter Config Name"
                            />
                            <button onClick={handleRegisterConfig} style={buttonStyle}>
                                Register
                            </button>
                        </div>
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
                    maxLength={30}
                    placeholder="Enter Teacher Pin"
                    onKeyUp={(e) => e.key === 'Enter' && handleGoClick()}
                />
                <button onClick={handleGoClick} style={buttonStyle}>
                    Log In
                </button>
            </div>
        )}
    </div>
);
};
export default Configure;
