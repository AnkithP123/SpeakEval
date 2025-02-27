import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CreateRoom.css'; // Import the CSS file where the shake animation is defined
import Card from '../components/Card2';
import Upgrade from './Upgrade';
import { FaMagic, FaMicrophone, FaTimes, FaStop, FaPlus } from 'react-icons/fa';
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

const DraggableColumn = ({ index, value, moveColumn, handlePointValueChange, handleDeletePointValue }) => {
    const ref = useRef(null)
  
    const [{ isDragging }, drag] = useDrag({
      type: "COLUMN",
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })
  
    const [, drop] = useDrop({
      accept: "COLUMN",
      hover(item, monitor) {
        if (!ref.current) {
          return
        }
        const dragIndex = item.index
        const hoverIndex = index
  
        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return
        }
  
        moveColumn(dragIndex, hoverIndex)
        item.index = hoverIndex
      },
    })
  
    drag(drop(ref))
  
    return (
      <th
        ref={ref}
        className={`text-white text-center p-2 border-b border-purple-500/30 ${isDragging ? "opacity-50" : ""}`}
        style={{ cursor: "move" }}
      >
        <div className="flex items-center justify-center space-x-2">
          <input
            type="number"
            value={value}
            onChange={(e) => handlePointValueChange(index, e)}
            className="w-16 text-center bg-black/30 border border-purple-500/30 rounded p-1 text-white"
            step="0.5"
          />
          <button
            onClick={() => handleDeletePointValue(index)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>
      </th>
    )
}  

const Configure = ({set, setUltimate, getPin, subscribed}) => {
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [userId, setUserId] = useState(getPin());
    const [loggedIn, setLoggedIn] = useState(userId);
    const [roomCode, setRoomCode] = useState('');
    const [shake, setShake] = useState(false); // State to trigger shake effect
    const [questions, setQuestions] = useState([]); // State to store recorded questions
    const [recording, setRecording] = useState(false); // State to track recording status
    const [categories, setCategories] = useState([{ name: '', descriptions: Array(5).fill('') }]); // State to store categories and their descriptions
    const [pointValues, setPointValues] = useState([1, 2, 3, 4, 5]); // Default point values
    const [maxTime, setMaxTime] = useState(''); // State to store the max time limit
    const [selectedLanguage, setSelectedLanguage] = useState(''); // State to store the selected language
    const [otherLanguage, setOtherLanguage] = useState(''); // State to store the selected language
    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const [id, setId] = useState('');
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showAutofillUpgrade, setShowAutofillUpgrade] = useState(false); // New state for autofill upgrade panel
    const [sparklePositions, setSparklePositions] = useState([]);
    const [button1Hover, setButton1Hover] = useState(false);
    const [button2Hover, setButton2Hover] = useState(false);
    const [selected, setSelected] = useState(false);
    const [configs, setConfigs] = useState([]); // State to store the configs
    const [hoverButton, setHoverButton] = useState(false);
    const [isConfigRegistered, setIsConfigRegistered] = useState(false);

    
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
            navigate('/login?redirect=/update'); // Navigate to the login page
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
        const newPoint = pointValues.length > 0 ? Math.max(...pointValues) + 1 : 1;
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
    
            const categoriesString = categories.map((category) => {
                return `${category.name}|:::| ${category.descriptions[0]}|,,| ${category.descriptions[1]}|,,| ${category.descriptions[2]}|,,| ${category.descriptions[3]}|,,| ${category.descriptions[4]}`;
            }).join('|;;|');
    
            const res = await fetch(`https://www.server.speakeval.org/updateconfig?id=${id}&pin=${userId}&length=${questions.length}&rubric=${categoriesString}&limit=${maxTime}&language=${selectedLanguage === 'Other' ? otherLanguage : selectedLanguage}`, {
                method: 'POST',
                body: formData,
            });
    
            const response = await res.json();
    
            if (res.ok && !(response.error)) {
                toast.success("Configuration registered successfully");
                setIsConfigRegistered(true);
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
        }

        const categories = rubric2.split('|;;|').map((category) => {
            const [name, descriptionsString] = category.split('|:::|');
            console.log(descriptionsString);
            const descriptions = descriptionsString? descriptionsString.split('|,,|') : Array(5).fill('');
            return { name, descriptions };
        });

        setCategories(categories);

        setMaxTime(config.timeLimit);

        if (['English', 'Spanish', 'French', 'Chinese', 'Japanese'].includes(config.language)) {

            setSelectedLanguage(config.language);
        }
        else {
            setSelectedLanguage('Other');
            setOtherLanguage(config.language);
        }

        setId(config.name);

        config.questions.map(async (question) => {
            // question is a base64 string, so we need to convert it back to a blob
            const blob = await fetch(`data:audio/wav;base64,${question.audio}`).then((res) => res.blob());
            const url = URL.createObjectURL(blob);
            setQuestions((prevQuestions) => [...prevQuestions, url]);

        });

        setPopupVisible(false); // Hide the popup

        setSelected(true);
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

    const otherStyle = {
        marginTop: '10px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: 'black',
        padding: '8px',
        borderRadius: '16px',
        border: '1px solid #E6F3FF',
    }
    
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

    const moveColumn = (dragIndex, hoverIndex) => {
        // Update point values order
        setPointValues((prevPointValues) => {
          const newPointValues = [...prevPointValues]
          const draggedValue = newPointValues[dragIndex]
          newPointValues.splice(dragIndex, 1)
          newPointValues.splice(hoverIndex, 0, draggedValue)
          return newPointValues
        })
    
        // Update category descriptions to match the new order
        setCategories((prevCategories) => {
          return prevCategories.map((category) => {
            const newDescriptions = [...category.descriptions]
            const draggedDescription = newDescriptions[dragIndex]
            newDescriptions.splice(dragIndex, 1)
            newDescriptions.splice(hoverIndex, 0, draggedDescription)
            return { ...category, descriptions: newDescriptions }
          })
        })
      }    
    

    return (
        <DndProvider backend={HTML5Backend}>
        {popupVisible && !isConfigRegistered ? ( // Added warning banner
        <div className="fixed top-20 left-0 right-0 bg-amber-500/90 border-l-4 border-amber-700 text-white p-4 rounded-md mb-6 shadow-md z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-100"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                <strong>Warning:</strong> Your configuration has not been update yet. Click "Update"
                at the bottom of the page to save your work.
              </p>
            </div>
          </div>
        </div>
      ) : null}

        <div>
            <style>{styles}</style>
            {showUpgrade && <Upgrade onClose={() => setShowUpgrade(false)} doc={document} />}
            {showAutofillUpgrade && <Upgrade onClose={() => setShowAutofillUpgrade(false)} />}
            <title hidden>Configure Exams</title>
    
            {selected ? (
                <div className="container-xl lg:container m-auto">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 p-8 rounded-lg justify-center">
                    <Card color="cyan">
          <h2 className="text-2xl font-bold text-white mb-4">Record Questions</h2>
          <div className="space-y-4">
            <div className="flex justify-center">
              <button
                onClick={handleToggleRecording}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white transition-all duration-300 ${
                  recording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                }`}
              >
                {recording ? <FaStop className="mr-2" /> : <FaMicrophone className="mr-2" />}
                <span>{recording ? "Stop Recording" : "Start Recording"}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((question, index) => (
                <div key={index} className="flex items-center bg-black/30 p-3 rounded-lg border border-cyan-500/30">
                  <audio
                    controls
                    src={question}
                    className="mr-2"
                    style={{ 
                        backgroundColor: "transparent", 
                        border: "none", 
                        filter: "invert(1)" /* Makes buttons white */ 
                      }}
                  />
                  <button
                    onClick={() => handleDeleteQuestion(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>


        <Card color="purple">
          <h2 className="text-2xl font-bold text-white mb-4">Create Rubric</h2>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleAddPointValue}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Add Point Value
              </button>
              <button
                onClick={handleAddPointValue2}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Add Point Value
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-white text-left p-2 border-b border-purple-500/30">Category</th>
                    {pointValues.map((value, index) => (
                      <DraggableColumn
                        key={index}
                        index={index}
                        value={value}
                        moveColumn={moveColumn}
                        handlePointValueChange={handlePointValueChange}
                        handleDeletePointValue={handleDeletePointValue}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, categoryIndex) => (
                    <tr key={categoryIndex}>
                      <td className="p-2 border-b border-purple-500/30">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteCategory(categoryIndex)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <FaTimes size={12} />
                          </button>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryNameChange(categoryIndex, e)}
                            placeholder="Category Name"
                            className="w-full bg-black/30 border border-purple-500/30 rounded p-2 text-white"
                          />
                        </div>
                      </td>
                      {pointValues.map((_, pointIndex) => (
                        <td key={pointIndex} className="p-2 border-b border-purple-500/30">
                          <input
                            type="text"
                            value={category.descriptions[pointIndex]}
                            onChange={(e) => handleCategoryDescriptionChange(categoryIndex, pointIndex, e)}
                            placeholder={`Description for ${pointValues[pointIndex]} points`}
                            className="w-full bg-black/30 border border-purple-500/30 rounded p-2 text-white"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleAddCategory}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> Add Category
            </button>
          </div>
        </Card>
        <Card color="blue">
          <h2 className="text-2xl font-bold text-white mb-4">Additional Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Answer Time Limit (seconds)</label>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white"
                placeholder="Enter time limit"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white"
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {selectedLanguage === "Other" && (
              <div>
                <label className="block text-white mb-2">Specify Language</label>
                <input
                  type="text"
                  value={otherLanguage}
                  onChange={(e) => setOtherLanguage(e.target.value)}
                  className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white"
                  placeholder="Enter language"
                />
              </div>
            )}
          </div>
        </Card>
        <Card color="pink">
          <h2 className="text-2xl font-bold text-white mb-4">Register Configuration</h2>
          <div className="space-y-4">
            <button
              onClick={handleRegisterConfig}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              className={`w-full relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 ${
                hoverButton
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30"
                  : "bg-gradient-to-r from-pink-600/50 to-purple-700/50"
              }`}
            >
              <span className="relative z-10">Update</span>
            </button>
          </div>
        </Card>

                    </div>
                </div>
            ) : (
                <div>
                <div style={containerStyle}>
                    <div>
                        {configs.length > 0 ? 
                        configs.map((config) => (
                            config.name ? (
                                <button
                                    key={config.name}
                                    style={chipStyle}
                                    onClick={() => handleConfigClick(config)}
                                >
                                    {config.name}
                                </button>
                            ) : null
                        )) : 
                        <><p className='text-2xl font-bold' style={{ color: 'black' }}>No configurations found. Go to the configurations page to make one.</p>
                        <hr style={{ width: '100%', border: '1px solid lightgray', margin: '10px 0' }} /></>
                        }
                    </div>
                    {/* <button onClick={handleConfigSubmit} style={buttonStyle}>Create Room</button> */}
                </div>
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
        </DndProvider>
    );
};
export default Configure;
