"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cuteAlert } from "cute-alert";
import { FaTimes, FaPlus, FaMicrophone, FaStop } from "react-icons/fa";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Card from "../components/Card";

// Draggable column component
const DraggableColumn = ({
  index,
  value,
  moveColumn,
  handlePointValueChange,
  handleDeletePointValue,
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <th
      ref={ref}
      className={`text-white text-center p-2 border-b border-purple-500/30 ${
        isDragging ? "opacity-50" : ""
      }`}
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
  );
};

const Configure = ({ set, setUltimate, getPin, subscribed, setSubscribed }) => {
  const [userId, setUserId] = useState(getPin());
  const [loggedIn, setLoggedIn] = useState(userId);
  const [questions, setQuestions] = useState([]);
  const [recording, setRecording] = useState(false);
  const [categories, setCategories] = useState([
    { name: "", descriptions: Array(5).fill("") },
  ]);
  const [pointValues, setPointValues] = useState([5, 4, 3, 2, 1]);
  const [maxTime, setMaxTime] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [otherLanguage, setOtherLanguage] = useState("");
  const [id, setId] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAutofillUpgrade, setShowAutofillUpgrade] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const [isConfigRegistered, setIsConfigRegistered] = useState(false);
  const [button2Hover, setButton2Hover] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const [processedStrings, setProcessedStrings] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/configure");
    }
  }, [loggedIn, navigate]);

  const checkUserId = async (userId) => {
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/teacherpin?pin=${userId}`
      );
      const parsedData = await res.json();

      if (parsedData.code === 401) {
        toast.error("Incorrect Teacher Pin");
        return setUserId("");
      }
      if (parsedData.code === 200) {
        setLoggedIn(true);
      }
      if (parsedData.subscription) {
        set(parsedData.subscription !== "free");
        setUltimate(parsedData.subscription === "Ultimate");
        if (parsedData.subscription !== "free") {
          setSubscribed(true);
        }
      }
    } catch (err) {
      console.error("Error Loading Data", err);
      toast.error("Error Loading Data");
      return setUserId("");
    }
  };

  const handleToggleRecording = () => {
    if (questions.length >= 60 && !subscribed) {
      setShowUpgrade(true);
      return;
    }
    if (navigator.mediaDevices.getUserMedia) {
      if (recording) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      } else {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            mediaRecorderRef.current.addEventListener(
              "dataavailable",
              handleDataAvailable
            );
            setRecording(true);
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
    setQuestions((prevQuestions) =>
      prevQuestions.filter((_, i) => i !== index)
    );
    toast.success("Question deleted");
  };

  const handleAddCategory = () => {
    setCategories((prevCategories) => [
      ...prevCategories,
      { name: "", descriptions: Array(5).fill("") },
    ]);
  };

  const handleDeleteCategory = (index) => {
    setCategories((prevCategories) =>
      prevCategories.filter((_, i) => i !== index)
    );
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

  // Add point value to the beginning (highest)
  const handleAddPointValueToStart = () => {
    const newPoint =
      pointValues.length > 1
        ? pointValues[0] + (pointValues[0] - pointValues[1])
        : pointValues.length === 1
        ? pointValues[0] + 1
        : 1;
    setPointValues((prevPointValues) => [newPoint, ...prevPointValues]);
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        descriptions: ["", ...category.descriptions],
      }))
    );
  };

  // Add point value to the end (lowest)
  const handleAddPointValueToEnd = () => {
    const newPoint =
      pointValues.length > 1
        ? pointValues[pointValues.length - 1] -
          (pointValues[pointValues.length - 2] -
            pointValues[pointValues.length - 1])
        : pointValues.length === 1
        ? pointValues[0] - 1
        : 1;
    setPointValues((prevPointValues) => [...prevPointValues, newPoint]);
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        descriptions: [...category.descriptions, ""],
      }))
    );
  };

  const handleDeletePointValue = (index) => {
    if (pointValues.length > 1) {
      setPointValues((prevPointValues) =>
        prevPointValues.filter((_, i) => i !== index)
      );
      setCategories((prevCategories) =>
        prevCategories.map((category) => {
          const updatedDescriptions = category.descriptions.filter(
            (_, i) => i !== index
          );
          return { ...category, descriptions: updatedDescriptions };
        })
      );
    } else {
      toast.error("You must have at least one point value");
    }
  };

  const handlePointValueChange = (index, e) => {
    const { value } = e.target;
    setPointValues((prevPointValues) => {
      const updatedValues = [...prevPointValues];
      updatedValues[index] = Number.parseFloat(value) || 0;
      return updatedValues;
    });
  };

  // Move column function for drag and drop
  const moveColumn = (dragIndex, hoverIndex) => {
    // Update point values order
    setPointValues((prevPointValues) => {
      const newPointValues = [...prevPointValues];
      const draggedValue = newPointValues[dragIndex];
      newPointValues.splice(dragIndex, 1);
      newPointValues.splice(hoverIndex, 0, draggedValue);
      return newPointValues;
    });

    // Update category descriptions to match the new order
    setCategories((prevCategories) => {
      return prevCategories.map((category) => {
        const newDescriptions = [...category.descriptions];
        const draggedDescription = newDescriptions[dragIndex];
        newDescriptions.splice(dragIndex, 1);
        newDescriptions.splice(hoverIndex, 0, draggedDescription);
        return { ...category, descriptions: newDescriptions };
      });
    });
  };

  const handleAutofillClick = () => {
    setShowAutofillUpgrade(true);
  };

  const handleRubricAutofillClick = async () => {
    if (!subscribed) {
      try {
        console.log("Fetching autofill data...");
        setPopupVisible(true); // Show popup
        const configs = await fetch(
          `https://www.server.speakeval.org/getconfigs?pin=${userId}`
        );
        const configsList = await configs.json();
        // Set the fetched config list to state to use in rendering
        setSelectedConfig(configsList);
      } catch (error) {
        console.error("Failed to fetch configs:", error);
        toast.error("Failed to fetch question sets");
      }
    } else {
      handleAutofillClick();
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleFileUpload = async (file) => {
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOCX, and TXT files are allowed");
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;

        try {
          // Send to upload endpoint
          const response = await fetch(
            "https://www.server.speakeval.org/upload_file",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                file: base64,
                type: file.type,
                token: userId,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }

          const result = await response.json();
          console.log(result);

          if (Array.isArray(result)) {
            setProcessedStrings(result);
            toast.success("File processed successfully");
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Upload failed: ${error.message}`);
          setUploadedFile(null);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Error reading file");
        setIsUploading(false);
        setUploadedFile(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File processing error:", error);
      toast.error("Error processing file");
      setIsUploading(false);
      setUploadedFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleStringEdit = (index, value) => {
    setProcessedStrings((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleConfirmStrings = async () => {
    setIsConfirming(true);

    try {
      const response = await fetch(
        "https://www.server.speakeval.org/generate_audio",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionArr: processedStrings,
            token: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("TTS Result:", result);

      // Check if the response has the expected format
      if (result.audio && Array.isArray(result.audio) && result.complete) {
        const audioUrls = result.audio
          .map((audioDataFromServer, index) => {
            // Renamed for clarity
            try {
              // audioDataFromServer is expected to be an object like:
              // { type: "Buffer", data: [byte1, byte2, ...] }
              // as serialized by Node.js server when sending a Buffer in JSON.

              if (
                !audioDataFromServer ||
                !audioDataFromServer.data ||
                !Array.isArray(audioDataFromServer.data)
              ) {
                console.error(
                  `Error processing audio ${index}: Invalid audio data structure received from server.`,
                  audioDataFromServer
                );
                return null;
              }

              // Convert the array of byte values (audioDataFromServer.data) into a Uint8Array.
              const uint8Array = new Uint8Array(audioDataFromServer.data);

              // Create a blob from the audio data.
              // The server's code suggests WAV format (out-${Date.now()}.wav).
              const blob = new Blob([uint8Array], { type: "audio/wav" });

              // Create an object URL for the blob.
              return URL.createObjectURL(blob);
            } catch (error) {
              console.error(`Error processing audio ${index}:`, error);
              return null;
            }
          })
          .filter((url) => url !== null); // Filter out any failed conversions

        setQuestions((prevQuestions) => [...prevQuestions, ...audioUrls]);
        toast.success(`Successfully added ${audioUrls.length} audio questions`);
        closeImportModal();
      } else {
        throw new Error("Invalid response format or incomplete processing");
      }
    } catch (error) {
      console.error("Confirm error:", error);
      toast.error(`Failed to process audio: ${error.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setUploadedFile(null);
    setFileBase64("");
    setDragActive(false);
    setProcessedStrings(null);
    setIsConfirming(false);
  };

  const handleConfigClick = (config) => {
    // convert the rubric, which is currently a string using the separators, back into an array of objects

    let rubric2 = config.rubric;

    if (config.rubric && config.rubric.includes("|^^^|")) {
      setPointValues(rubric2.split("|^^^|")[0].split("|,,|"));
      rubric2 = rubric2.split("|^^^|")[1];
    }

    const categories = rubric2.split("|;;|").map((category) => {
      const [name, descriptionsString] = category.split("|:::|");
      console.log(descriptionsString);
      const descriptions = descriptionsString
        ? descriptionsString.split("|,,|")
        : Array(5).fill("");
      return { name, descriptions };
    });

    setCategories(categories);

    setMaxTime(config.timeLimit);

    if (
      ["English", "Spanish", "French", "Chinese", "Japanese"].includes(
        config.language
      )
    ) {
      setSelectedLanguage(config.language);
    } else {
      setSelectedLanguage("Other");
      setOtherLanguage(config.language);
    }

    setPopupVisible(false); // Hide the popup
  };

  // Create config first, then upload questions one by one
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
      setIsUploading(true);
      setUploadProgress(0);

      // First, create the config
      const rubricString = `${pointValues.join("|,,|")}|^^^|${categories
        .map((category) => {
          return `${category.name}|:::|${category.descriptions
            .map((description) => description || "")
            .join("|,,|")}`;
        })
        .join("|;;|")}`;

      const language =
        selectedLanguage === "Other" ? otherLanguage : selectedLanguage;

      // Create config first
      const configResponse = await fetch(
        `https://www.server.speakeval.org/createconfig?pin=${userId}&id=${id}&rubric=${encodeURIComponent(
          rubricString
        )}&limit=${maxTime}&language=${language}`,
        {
          method: "POST",
        }
      );

      const configResult = await configResponse.json();

      if (!configResponse.ok || configResult.error) {
        throw new Error(configResult.error || "Failed to create config");
      }

      toast.success("Config created successfully, uploading questions...");

      // Then upload each question individually
      for (let i = 0; i < questions.length; i++) {
        const res = await fetch(questions[i]);
        const blob = await res.blob();

        // Convert blob to base64
        const base64Audio = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result;
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            resolve(base64data.split(",")[1]);
          };
        });

        // Upload individual question
        const questionResponse = await fetch(
          `https://www.server.speakeval.org/uploadquestion?pin=${userId}&id=${id}&index=${i}&language=${language}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio: base64Audio }),
          }
        );

        const questionResult = await questionResponse.json();

        if (!questionResponse.ok || questionResult.error) {
          throw new Error(
            questionResult.error || `Failed to upload question ${i + 1}`
          );
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / questions.length) * 100));
      }

      cuteAlert({
        type: "success",
        title: "Success",
        description: "Question set registered successfully",
        primaryButtonText: "OK",
      });

      toast.success("Question set registered successfully");
      setIsConfigRegistered(true);
      setIsUploading(false);
    } catch (err) {
      console.error("Error registering question set", err);
      toast.error(`Error: ${err.message || "Failed to register question set"}`);
      setIsUploading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {!isConfigRegistered && (
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
                <strong>Warning:</strong> Your question set has not been saved
                yet. Click "Register Question Set" at the bottom of the page to
                save your work.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Configure Exam
        </h1>
        <Card color="pink">
          <h2 className="text-2xl font-bold text-white mb-4">
            Question Set Name
          </h2>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-black/30 border border-pink-500/30 rounded p-2 text-white"
                maxLength={30}
                placeholder="Enter Name for Set"
              />
            </div>
          </div>
        </Card>

        <Card color="cyan">
          <h2 className="text-2xl font-bold text-white mb-4">
            Record Questions
          </h2>
          <button
            onClick={handleImportClick}
            className="fixed top-4 right-6  px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Import
          </button>
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
                {recording ? (
                  <FaStop className="mr-2" />
                ) : (
                  <FaMicrophone className="mr-2" />
                )}
                <span>{recording ? "Stop Recording" : "Start Recording"}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-center bg-black/30 p-3 rounded-lg border border-cyan-500/30"
                >
                  <audio
                    controls
                    src={question}
                    className="mr-2"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      filter: "invert(1)" /* Makes buttons white */,
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

        {/* Create Rubric Section */}
        <Card color="purple">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Create Rubric</h2>
            <button
              onClick={handleRubricAutofillClick}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              onMouseEnter={() => {
                setButton2Hover(true);
              }}
              onMouseLeave={() => {
                setButton2Hover(false);
              }}
            >
              Autofill
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleAddPointValueToStart}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Add Point Value
              </button>
              <button
                onClick={handleAddPointValueToEnd}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Add Point Value
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-white text-left p-2 border-b border-purple-500/30">
                      Category
                    </th>
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
                            onChange={(e) =>
                              handleCategoryNameChange(categoryIndex, e)
                            }
                            placeholder="Category Name"
                            className="w-full bg-black/30 border border-purple-500/30 rounded p-2 text-white"
                          />
                        </div>
                      </td>
                      {pointValues.map((_, pointIndex) => (
                        <td
                          key={pointIndex}
                          className="p-2 border-b border-purple-500/30"
                        >
                          <input
                            type="text"
                            value={category.descriptions[pointIndex]}
                            onChange={(e) =>
                              handleCategoryDescriptionChange(
                                categoryIndex,
                                pointIndex,
                                e
                              )
                            }
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

        {/* Additional Settings Section */}
        <Card color="blue">
          <h2 className="text-2xl font-bold text-white mb-4">
            Additional Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">
                Answer Time Limit (seconds)
              </label>
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
                <label className="block text-white mb-2">
                  Specify Language
                </label>
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

        {/* Register question set Section */}
        <Card color="pink">
          <h2 className="text-2xl font-bold text-white mb-4">
            Register Question Set
          </h2>
          <div className="space-y-4">
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-white">Uploading questions...</span>
                  <span className="text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <button
              onClick={handleRegisterConfig}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              disabled={isUploading}
              className={`w-full relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 ${
                isUploading
                  ? "bg-gray-600 cursor-not-allowed"
                  : hoverButton
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30"
                  : "bg-gradient-to-r from-pink-600/50 to-purple-700/50"
              }`}
            >
              <span className="relative z-10">
                {isUploading ? "Uploading..." : "Register Question Set"}
              </span>
            </button>
          </div>
        </Card>

        {/* Conditionally render the popup */}
        {popupVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="relative overflow-hidden bg-black/60 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl w-full max-w-md mx-auto">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                  Select a Question Set
                </h2>

                <ul className="space-y-3">
                  {selectedConfig &&
                    selectedConfig.map((config, index) => (
                      <li
                        key={index}
                        className="p-4 rounded-lg cursor-pointer transition-all duration-300 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 hover:-translate-y-0.5"
                        onClick={() => handleConfigClick(config)}
                      >
                        <span className="text-white">{config.name}</span>
                      </li>
                    ))}
                </ul>

                <button
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 font-medium"
                  onClick={() => setPopupVisible(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Import File Modal */}
        {showImportModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="relative overflow-hidden bg-black/60 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl w-full max-w-lg mx-auto">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    Import File
                  </h2>
                  <button
                    onClick={closeImportModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {!uploadedFile && !isUploading && !processedStrings && (
                  <>
                    {/* Drag and Drop Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                        dragActive
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-gray-500 hover:border-cyan-500"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-4">
                        <div className="text-4xl text-gray-400">📁</div>
                        <div>
                          <p className="text-white text-lg font-medium">
                            Drag and drop your file here
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Supported formats: PDF, DOCX, TXT (Max 10MB)
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={handleFileInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 font-medium">
                            Choose File
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Uploading Animation */}
                {isUploading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
                    <p className="text-white text-lg font-medium">
                      Processing your file...
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Please wait while we extract the content
                    </p>
                  </div>
                )}

                {/* TTS Processing Animation */}
                {isConfirming && processedStrings && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                    <p className="text-white text-lg font-medium">
                      Converting text to speech...
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Generating audio for {processedStrings.length} questions
                    </p>
                  </div>
                )}

                {/* Editable Strings Display */}
                {processedStrings && (
                  <div className="space-y-4">
                    <p className="text-white text-lg font-medium">
                      Edit the extracted content:
                    </p>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {processedStrings.map((str, index) => (
                        <div key={index} className="space-y-2">
                          <label className="text-gray-300 text-sm">
                            Question {index + 1}:
                          </label>
                          <textarea
                            value={str}
                            onChange={(e) =>
                              handleStringEdit(index, e.target.value)
                            }
                            className="w-full h-[50px] bg-black/30 border border-cyan-500/30 rounded p-3 text-white resize-none"
                            rows={3}
                            placeholder={`Content ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button
                        onClick={closeImportModal}
                        className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmStrings}
                        disabled={isConfirming}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                          isConfirming
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                        }`}
                      >
                        {isConfirming ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating Audio...</span>
                          </div>
                        ) : (
                          "Confirm Changes"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default Configure;
