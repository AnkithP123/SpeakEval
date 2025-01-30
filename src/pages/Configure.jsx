import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined
import Card from '../components/Card';
import Upgrade from './Upgrade';
import { FaMagic } from 'react-icons/fa';
import { cuteAlert } from 'cute-alert';
import LoginPage from './LoginPage';

const Configure = ({set, setUltimate, getPin, subscribed}) => {
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [userId, setUserId] = useState(getPin());
    const [loggedIn, setLoggedIn] = useState(userId);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [questions, setQuestions] = useState([]); // State to store recorded questions
    const [recording, setRecording] = useState(false); // State to track recording status
    const [categories, setCategories] = useState([{ name: '', descriptions: Array(5).fill('') }]);
    const [pointValues, setPointValues] = useState([5, 4, 3, 2, 1]); // Default point values
    const [maxTime, setMaxTime] = useState(''); // State to store the max time limit
    const [selectedLanguage, setSelectedLanguage] = useState(''); // State to store the selected language
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const [id, setId] = useState('');
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showAutofillUpgrade, setShowAutofillUpgrade] = useState(false); // New state for autofill upgrade panel
    const [sparklePositions, setSparklePositions] = useState([]);
    const [button1Hover, setButton1Hover] = useState(false);
    const [button2Hover, setButton2Hover] = useState(false);
    
    useEffect(() => {
        setSparklePositions(generateSparklePositions(3));
      }, []); // Add dependencies if you want it to update on specific state or prop changes    

    useEffect(() => {
    // Define interval to update sparkle positions every second
    const intervalId = setInterval(() => {
        setSparklePositions(generateSparklePositions(3));
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

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login?redirect=/configure'); // Navigate to the login page
        }
    }, [loggedIn, navigate]);

    const checkUserId = async (userId) => {
        let parsedData;
        try {
            let res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`);
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

            if (parsedData.subscription) {
                set(parsedData.subscription !== 'free');
                setUltimate(parsedData.subscription === 'Ultimate');

                if (parsedData.subscription !== 'free') {
                    setSubscribed(true);
                }
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
        if (questions.length >= 60 && !subscribed) {
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
        setCategories((prevCategories) => [...prevCategories, { name: '', descriptions: Array(pointValues.length).fill('') }]);
    };

    const handleDeleteCategory = (index) => {
        setCategories((prevCategories) => prevCategories.filter((_, i) => i !== index));
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
            updatedCategories[categoryIndex].descriptions[pointIndex] = value;
            return updatedCategories;
        });
    };

    const handleAddPointValue = () => {
        const newPoint = pointValues.length > 1 
            ? pointValues[0] + (pointValues[0] - pointValues[1]) 
            : (pointValues.length === 1 ? pointValues[0] + 1 : 1);
        setPointValues((prevPointValues) => [newPoint, ...prevPointValues]);
        setCategories((prevCategories) =>
            prevCategories.map((category) => ({
                ...category,
                descriptions: ['', ...category.descriptions],
            }))
        );
    };

    const handleAddPointValue2 = () => {
        const newPoint = pointValues.length > 1 
            ? pointValues[pointValues.length - 1] - (pointValues[pointValues.length - 2] - pointValues[pointValues.length - 1]) 
            : (pointValues.length === 1 ? pointValues[0] - 1 : 1);
        setPointValues((prevPointValues) => [...prevPointValues, newPoint]);
        setCategories((prevCategories) =>
            prevCategories.map((category) => ({
                ...category,
                descriptions: [...category.descriptions, ''],
            }))
        );
    };

    const handleDeletePointValue = (index) => {
        setPointValues((prevPointValues) => prevPointValues.filter((_, i) => i !== index));
        setCategories((prevCategories) =>
            prevCategories.map((category) => {
                const updatedDescriptions = category.descriptions.filter((_, i) => i !== index);
                return { ...category, descriptions: updatedDescriptions };
            })
        );
    };

    const handlePointValueChange = (index, e) => {
        const { value } = e.target;
        setPointValues((prevPointValues) => {
            const updatedValues = [...prevPointValues];
            updatedValues[index] = parseFloat(value) || 0;
            return updatedValues;
        });
    };

    const handleMaxTimeChange = (e) => {
        setMaxTime(e.target.value);
    };

    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleRegisterConfig = async () => {
        if (!id) {
            toast.error("Please enter a name for the set");
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

            const rubricString = `${pointValues.join('|,,|')}|^^^|${categories
                .map((category) => {
                    return `${category.name}|:::|${category.descriptions
                        .map((description) => description || '') // Handle missing descriptions gracefully
                        .join('|,,|')}`;
                })
                .join('|;;|')}`;

            console.log(rubricString);
            
            console.log(`https://www.server.speakeval.org/registerconfig?id=${id}&pin=${userId}&length=${questions.length}&rubric=${rubricString}&limit=${maxTime}&language=${selectedLanguage}`);

            const res = await fetch(`https://www.server.speakeval.org/registerconfig?id=${id}&pin=${userId}&length=${questions.length}&rubric=${rubricString}&limit=${maxTime}&language=${selectedLanguage}`, {
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

    const handleRubricAutofillClick = async () => {
        if (subscribed) {
            try {
                setPopupVisible(true); // Show popup
                const configs = await fetch(`https://www.server.speakeval.org/getconfigs?pin=${userId}`);
                const configsList = await configs.json();
                // Set the fetched config list to state to use in rendering
                setSelectedConfig(configsList);
            } catch (error) {
                console.error("Failed to fetch configs:", error);
                toast.error("Failed to fetch configurations");
            }
        } else {
            handleAutofillClick();
        }
    };   
    
    const handleConfigClick = (config) => {
        // convert the rubric, which is currently a string using the separators, back into an array of objects

        let rubric2 = config.rubric

        if (config.rubric && config.rubric.includes("|^^^|")) {
            setPointValues(rubric2.split("|^^^|")[0].split('|,,|'))
            rubric2 = rubric2.split("|^^^|")[1]
        } else if (rubric2) {
            setPointValues([1, 2, 3, 4, 5])
        }

        const categories = rubric2.split('|;;|').map((category) => {
            const [name, descriptionsString] = category.split('|:::|');
            const descriptions = descriptionsString.split('|,,|');
            return { name, descriptions };
        });

        setCategories(categories);

        setMaxTime(config.timeLimit);

        setSelectedLanguage(config.language);

        setPopupVisible(false); // Hide the popup
    }

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
        transition: 'background-color 0.2s, filter 0.2s',
        filter: 'brightness(1)',
        ':hover': {
            filter: 'brightness(0.9)',
        },
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
        transition: 'transform 0.3s, box-shadow 0.3s',
        ':hover': {
            transform: 'scale(2)',
            boxShadow: '0 0 20px rgba(235, 192, 80, 0.8)',
        },
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
        gridTemplateColumns: `auto repeat(${pointValues.length}, 1fr)`,
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
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: 'black',
        padding: '8px',
        borderRadius: '16px',
        border: '1px solid #E6F3FF',
    };

    const rubricCellStyle2 = {
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
        background: 'linear-gradient(75deg, #EBC050, #F5ED88, #EBC764)',
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.3s',
        fontSize: '1rem',
        fontWeight: 'bold',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        backgroundSize: '200% 100%',
        animation: 'gradientShift 5s ease infinite',
        ':hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px rgba(235, 192, 80, 0.8)',
        },
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
      0% { transform: translateX(-100%); }
      80% { transform: translateX(2860%); }
      100% { transform: translateX(2860%); }
    }
    
    @keyframes gradientShift {
        0% { background-position: 200% 50%; }
        80% { background-position: 0% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    .sparkle {
      position: absolute;
      width: 16px;
      height: 16px;
      background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 40%, rgba(255, 255, 255, 0) 70%);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2);
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
      animation: gleam 5s ease infinite;
      pointer-events: none;
      filter: blur(1px);
    }

    .popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      color: black;
      padding: 20px;
      border-radius: 10px;
      z-index: 1000;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      animation: fadeIn 0.3s ease-in-out;
    }

    .popup h2 {
      margin-top: 0;
      font-size: 1.5rem;
      text-align: center;
      color: #333;
    }

    .popup ul {
      list-style-type: none;
      padding: 0;
      margin: 20px 0;
    }

    .popup li {
      cursor: pointer;
      padding: 10px;
      border-radius: 5px;
      background-color: #E6F3FF;
      margin-bottom: 10px;
      transition: background-color 0.2s, transform 0.2s;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .popup li:hover {
      background-color: #F0C63C;
      transform: scale(1.02);
    }

    .popup button {
      background-color: #333;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.2s;
      display: block;
      margin: 0 auto;
    }

    .popup button:hover {
      background-color: #555;
      transform: scale(1.05);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    `;
    
    const generateSparklePositions = (length) => {
        const positions = [];
        for (let i = 0; i < length; i++) {
            positions.push({
                top: `${Math.random() * 70 + 10}%`, // Randomized top position
                left: `${Math.random() * 70 + 10}%`, // Randomized left position
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
                                    style={{
                                        ...premiumButtonStyle,
                                        background: button1Hover ? '#F0C63C' : premiumButtonStyle.background,
                                        boxShadow: button1Hover
                                            ? '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.8), 0 0 90px rgba(255, 215, 0, 0.6)'
                                            : premiumButtonStyle.boxShadow,
                                        transform: button1Hover ? 'scale(1.1)' : premiumButtonStyle.transform,
                                        transition: 'transform 0.3s, box-shadow 0.3s'
                                    }}
                                    className="absolute right-0"
                                    onMouseEnter={() => { setButton1Hover(true) }}
                                    onMouseLeave={() => { setButton1Hover(false) }}
                                >
                                    <FaMagic style={fancyButtonIconStyle} />
                                    Autofill
                                    <div className={"gleam"}></div>
                                    {(button1Hover ? generateSparklePositions(15) : sparklePositions).map((style, index) => (
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
                                    onClick={handleRubricAutofillClick}
                                    style={{
                                        ...premiumButtonStyle,
                                        background: button2Hover ? '#F0C63C' : premiumButtonStyle.background,
                                        boxShadow: button2Hover
                                            ? '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 215, 0, 0.8), 0 0 90px rgba(255, 215, 0, 0.6)'
                                            : premiumButtonStyle.boxShadow,
                                        transform: button2Hover ? 'scale(1.1)' : premiumButtonStyle.transform,
                                        transition: 'transform 0.3s, box-shadow 0.3s'
                                    }}
                                    className="absolute right-0"
                                    onMouseEnter={() => { setButton2Hover(true) }}
                                    onMouseLeave={() => { setButton2Hover(false) }}
                                >
                                    <FaMagic style={fancyButtonIconStyle} />
                                    Autofill
                                    <div className={"gleam"}></div>
                                    {(button2Hover ? generateSparklePositions(15) : sparklePositions).map((style, index) => (
                                        <div key={index} className="sparkle" style={style}></div>
                                    ))}
                                </button>
                            </div>                            
                            <div style={rubricContainerStyle}>
                                <div style={{ gridColumn: `span 1` }}></div> {/* Blank line */}

                                <button
                                    onClick={handleAddPointValue}
                                    style={rubricCellStyle2}
                                >
                                    Add Point Value
                                </button>
                                {new Array(Math.max(0, pointValues.length - 2)).fill(null).map((_, index) => (
                                    <div key={index} style={{ gridColumn: `span 1` }}></div>
                                ))}
                                <button
                                    onClick={handleAddPointValue2}
                                    style={rubricCellStyle2}
                                >
                                    Add Point Value
                                </button>
                                <div style={{ gridColumn: `span ${Math.max(6, pointValues.length + 1)}` }}></div> {/* Blank line */}

                                <div style={rubricHeaderStyle}>Category</div>
                                {pointValues.map((value, index) => (
                                    <div key={index} style={rubricCellStyle}>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => handlePointValueChange(index, e)}
                                            style={{ width: '100%', textAlign: 'center' }}
                                            step="0.5"
                                        />
                                        <button
                                            onClick={() => handleDeletePointValue(index)}
                                            style={{ marginLeft: '8px', cursor: 'pointer', color: 'red' }}
                                        >
                                            &#x2715;
                                        </button>
                                    </div>
                                ))}

                                <div style={{ gridColumn: `span ${Math.max(6, pointValues.length + 1)}` }}></div> {/* Blank line */}
                                
                                {categories.map((category, index) => (
                                    <React.Fragment key={index}>
                                        <div style={rubricCellStyle}>
                                            <span
                                                style={{ marginRight: '8px', cursor: 'pointer', color: 'red' }}
                                                onClick={() => handleDeleteCategory(index)}
                                            >
                                                &#x2715;
                                            </span>
                                            <input
                                                type="text"
                                                value={category.name}
                                                onChange={(e) => handleCategoryNameChange(index, e)}
                                                placeholder="Category Name"
                                                style={{ width: 'auto' }}
                                            />
                                        </div>
                                        {pointValues.map((_, pointIndex) => (
                                            <input
                                                key={pointIndex}
                                                type="text"
                                                value={category.descriptions[pointIndex]}
                                                onChange={(e) => handleCategoryDescriptionChange(index, pointIndex, e)}
                                                style={rubricCellStyle}
                                                placeholder={`Description ${pointValues.length - pointIndex}`}
                                            />
                                        ))}
                                        <div style={{ gridColumn: `span ${Math.max(6, pointValues.length + 1)}` }}></div> {/* Blank line */}

                                    </React.Fragment>
                                ))}
                            </div>
                            <button onClick={handleAddCategory} style={{ marginTop: '16px', ...rubricCellStyle }}>
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
                                    style={rubricCellStyle2}
                                    maxLength={15}
                                    placeholder="Enter Name for Set"
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
    
            {/* Conditionally render the popup */}
            {popupVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-center">Select a Configuration</h2>
                        <ul className="space-y-2">
                            {selectedConfig && selectedConfig.map((config, index) => (
                                <li
                                    key={index}
                                    className="p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                                    onClick={() => handleConfigClick(config)}
                                >
                                    {config.name}
                                </li>
                            ))}
                        </ul>
                        <button
                            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition"
                            onClick={() => setPopupVisible(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Configure;
