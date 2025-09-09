"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cuteAlert } from "cute-alert";
import {
  FaTimes,
  FaPlus,
  FaMicrophone,
  FaStop,
  FaInfoCircle,
} from "react-icons/fa";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Card from "../components/Card";
import Upgrade from "./Upgrade";

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

const Config = ({
  isUpdate = false,
  set,
  setUltimate,
  getPin,
  subscribed,
  setSubscribed,
}) => {
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
  const [isConfigSelection, setIsConfigSelection] = useState(isUpdate);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [selected, setSelected] = useState(!isUpdate);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [processedStrings, setProcessedStrings] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [showSelectiveAutofillModal, setShowSelectiveAutofillModal] =
    useState(false);
  const [showPresetRubricsModal, setShowPresetRubricsModal] = useState(false);
  const [autofillOptions, setAutofillOptions] = useState({
    questions: true,
    rubric: true,
    timeLimit: true,
    language: true,
  });

  // New state for config type
  const [configType, setConfigType] = useState("Classic");
  const [isInfoTooltipVisible, setIsInfoTooltipVisible] = useState(false);

  // State for instructions
  const [instructions, setInstructions] = useState([
    { text: "", show: "Once at the Start of Room" },
  ]);
  const [instructionsEnabled, setInstructionsEnabled] = useState(false);

  const presetRubrics = {
    "AP Language Arts": {
      pointValues: [4, 3, 2, 1],
      categories: [
        {
          name: "Thesis & Argument",
          descriptions: [
            "Clear, defensible thesis with sophisticated argument",
            "Clear thesis with adequate argument development",
            "Weak or unclear thesis with limited argument",
            "No clear thesis or argument",
          ],
        },
        {
          name: "Evidence & Commentary",
          descriptions: [
            "Strong evidence with insightful commentary",
            "Adequate evidence with some commentary",
            "Limited evidence with weak commentary",
            "Little to no evidence or commentary",
          ],
        },
        {
          name: "Organization",
          descriptions: [
            "Clear progression with effective transitions",
            "Generally organized with some transitions",
            "Weak organization with few transitions",
            "Little to no organization",
          ],
        },
      ],
    },
    "IB Language & Literature": {
      pointValues: [7, 6, 5, 4, 3, 2, 1],
      categories: [
        {
          name: "Knowledge & Understanding",
          descriptions: [
            "Excellent knowledge and understanding",
            "Good knowledge and understanding",
            "Satisfactory knowledge and understanding",
            "Some knowledge and understanding",
            "Limited knowledge and understanding",
            "Very limited knowledge and understanding",
            "No relevant knowledge or understanding",
          ],
        },
        {
          name: "Analysis & Evaluation",
          descriptions: [
            "Excellent analysis and evaluation",
            "Good analysis and evaluation",
            "Satisfactory analysis and evaluation",
            "Some analysis and evaluation",
            "Limited analysis and evaluation",
            "Very limited analysis and evaluation",
            "No relevant analysis or evaluation",
          ],
        },
      ],
    },
    "Basic Speaking Rubric": {
      pointValues: [4, 3, 2, 1],
      categories: [
        {
          name: "Fluency",
          descriptions: [
            "Speaks smoothly with natural rhythm",
            "Generally fluent with minor hesitations",
            "Some hesitations that interfere with flow",
            "Frequent hesitations that impede communication",
          ],
        },
        {
          name: "Pronunciation",
          descriptions: [
            "Clear pronunciation, easily understood",
            "Generally clear with minor errors",
            "Some pronunciation errors that may cause confusion",
            "Frequent errors that significantly impede understanding",
          ],
        },
        {
          name: "Vocabulary",
          descriptions: [
            "Rich, varied vocabulary used appropriately",
            "Good vocabulary with occasional imprecision",
            "Limited vocabulary that sometimes impedes expression",
            "Very limited vocabulary that frequently impedes communication",
          ],
        },
      ],
    },
  };

  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);

  // Fetch configs for update mode
  useEffect(() => {
    const fetchConfigs = async () => {
      if (!isUpdate) return;

      try {
        setIsLoadingConfigs(true);
        const res = await fetch(
          `https://www.server.speakeval.org/getconfigs?pin=${userId}`
        );
        const parsedData = await res.json();
        setConfigs(parsedData);
      } catch (err) {
        console.error("Error Loading Configs", err);
        toast.error("Error Loading Configs");
      } finally {
        setIsLoadingConfigs(false);
      }
    };

    if (loggedIn && isUpdate) {
      fetchConfigs();
    }
  }, [loggedIn, userId, isUpdate]);

  useEffect(() => {
    if (!loggedIn) {
      const redirectPath = isUpdate ? "/update" : "/configure";
      navigate(`/login?redirect=${redirectPath}`);
    }
  }, [loggedIn, navigate, isUpdate]);

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

  const handleInstructionTextChange = (index, event) => {
    const textarea = event.target;
    const { value } = textarea;

    // Auto-resize logic
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;

    const newInstructions = [...instructions];
    newInstructions[index].text = value;
    setInstructions(newInstructions);
  };

  const handleInstructionShowChange = (index, event) => {
    const { value } = event.target;
    const newInstructions = [...instructions];
    newInstructions[index].show = value;
    setInstructions(newInstructions);
  };

  const handleAddInstruction = () => {
    setInstructions([
      ...instructions,
      { text: "", show: "Once at the Start of Room" },
    ]);
  };

  const handleDeleteInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    } else {
      setInstructions([{ text: "", show: "Once at the Start of Room" }]);
    }
  };

  const handleAddCategory = () => {
    setCategories((prevCategories) => [
      ...prevCategories,
      { name: "", descriptions: Array(pointValues.length).fill("") },
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

  const moveColumn = (dragIndex, hoverIndex) => {
    setPointValues((prevPointValues) => {
      const newPointValues = [...prevPointValues];
      const draggedValue = newPointValues[dragIndex];
      newPointValues.splice(dragIndex, 1);
      newPointValues.splice(hoverIndex, 0, draggedValue);
      return newPointValues;
    });

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

  const handleSelectiveAutofillClick = async () => {
    try {
      setShowSelectiveAutofillModal(true);
      setIsLoadingConfigs(true);
      const configss = await fetch(
        `https://www.server.speakeval.org/getconfigs?pin=${userId}`
      );
      const configsList = await configss.json();
      setSelectedConfig(configsList);
      setIsLoadingConfigs(false);
    } catch (error) {
      console.error("Failed to fetch configs:", error);
      toast.error("Failed to fetch question sets");
    }
  };

  const handlePresetRubricsClick = () => {
    setShowPresetRubricsModal(true);
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleFileUpload = async (file) => {
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;

        try {
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
          const result = await response.json();

          if (result.error) {
            return toast.error(`Error: ${result.error}`);
          } else if (!response.ok) {
            throw new Error(`Server error: ${result.error}`);
          }

          if (Array.isArray(result)) {
            setProcessedStrings(result);
            toast.success("File processed successfully");
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Upload failed: ${response.error}`);
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
      if (response.error) {
        console.error("Server Error:", response.error);
        throw new Error(response.error);
      } else if (!response.ok) {
        const errorText = await response.error;
        console.error("Server Error Response:", errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.audio && Array.isArray(result.audio) && result.complete) {
        const audioUrls = result.audio
          .map((audioDataFromServer, index) => {
            try {
              if (
                !audioDataFromServer ||
                !audioDataFromServer.data ||
                !Array.isArray(audioDataFromServer.data) ||
                !result.mimeType
              ) {
                console.error(
                  `Error processing audio ${index}: Invalid audio data structure`
                );
                return null;
              }

              const uint8Array = new Uint8Array(audioDataFromServer.data);

              if (uint8Array.length === 0) {
                console.warn(`Audio data for item ${index} is empty.`);
                return null;
              }

              let blob;

              if (
                result.mimeType.includes("audio/L16") ||
                result.mimeType.includes("pcm")
              ) {
                const wavHeader = createWavHeader(
                  uint8Array.length,
                  24000,
                  16,
                  1
                );
                const wavData = new Uint8Array(
                  wavHeader.length + uint8Array.length
                );
                wavData.set(wavHeader, 0);
                wavData.set(uint8Array, wavHeader.length);

                blob = new Blob([wavData], { type: "audio/wav" });
              } else {
                blob = new Blob([uint8Array], { type: result.mimeType });
              }

              return URL.createObjectURL(blob);
            } catch (error) {
              console.error(`Error processing audio ${index}:`, error);
              return null;
            }
          })
          .filter((url) => url !== null);

        if (audioUrls.length > 0) {
          setQuestions((prevQuestions) => [...prevQuestions, ...audioUrls]);
          toast.success(
            `Successfully added ${audioUrls.length} audio questions`
          );
          closeImportModal();
        } else {
          toast.warn("No valid audio data was generated or processed.");
        }
      } else {
        throw new Error("Invalid response format or incomplete processing");
      }
    } catch (error) {
      console.error("Confirm error:", error);
      const errorMessage = error.message.includes("Server error")
        ? error.message
        : `Failed to process audio: ${error.message}`;
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const createWavHeader = (dataLength, sampleRate, bitsPerSample, channels) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, channels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, (sampleRate * channels * bitsPerSample) / 8, true); // ByteRate
    view.setUint16(32, (channels * bitsPerSample) / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample

    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true); // Subchunk2Size

    return new Uint8Array(header);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setUploadedFile(null);
    setDragActive(false);
    setProcessedStrings(null);
    setIsConfirming(false);
  };

  const handleConfigClick = (config, autoFillSelected = true) => {
    let rubric2 = config.rubric;

    if (autofillOptions.rubric) {
      if (config.rubric && config.rubric.includes("|^^^|")) {
        setPointValues(rubric2.split("|^^^|")[0].split("|,,|"));
        rubric2 = rubric2.split("|^^^|")[1];
      }

      const categories = rubric2.split("|;;|").map((category) => {
        const [name, descriptionsString] = category.split("|:::|");
        const descriptions = descriptionsString
          ? descriptionsString.split("|,,|")
          : Array(5).fill("");
        return { name, descriptions };
      });

      setCategories(categories);
    }

    // Instructions parsing logic
    let hasEnabledInstructions = false;
    if (config.instructions && typeof config.instructions === "string") {
      const parts = config.instructions.split("|i_i|");
      if (parts.length >= 3) {
        hasEnabledInstructions = parts[0] === "true";
        setInstructionsEnabled(hasEnabledInstructions);
        setAlwaysShowInstruction(parts[1] === "true");
        const loadedInstructions = parts.slice(2);
        setInstructions(
          loadedInstructions.length > 0 ? loadedInstructions : [""]
        );
      }
    } else {
      // Reset instructions if the loaded config doesn't have any
      setInstructionsEnabled(false);
      setInstructions([""]);
      setAlwaysShowInstruction(false);
    }

    // Set config type based on whether instructions are present and enabled
    if (hasEnabledInstructions) {
      setConfigType("Questions and Instructions");
    } else {
      setConfigType("Classic");
    }

    if (autofillOptions.timeLimit) {
      setMaxTime(config.timeLimit);
    }

    if (autofillOptions.language) {
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
    }

    if (autofillOptions.questions && config.questions) {
      config.questions.map(async (question) => {
        let url;
        if (question.audioUrl) {
          url = question.audioUrl;
        } else if (question.audio) {
          const blob = await fetch(
            `data:audio/wav;base64,${question.audio}`
          ).then((res) => res.blob());
          url = URL.createObjectURL(blob);
        }
        if (url) {
          setQuestions((prevQuestions) => [...prevQuestions, url]);
        }
      });
    }

    setShowSelectiveAutofillModal(false);
    setSelected(true);
    if (!autoFillSelected) {
      setId(config.name);
    }
    setIsConfigSelection(false);
  };

  const handlePresetRubricClick = (presetName) => {
    const preset = presetRubrics[presetName];
    setPointValues(preset.pointValues);
    setCategories(
      preset.categories.map((cat) => ({
        ...cat,
        descriptions: [
          ...cat.descriptions,
          ...Array(
            Math.max(0, preset.pointValues.length - cat.descriptions.length)
          ).fill(""),
        ],
      }))
    );
    setShowPresetRubricsModal(false);
    toast.success(`Applied ${presetName} rubric`);
  };

  const validateAudioBlob = (blob, questionIndex, maxSizeBytes) => {
    const MAX_SIZE_MB = maxSizeBytes / (1024 * 1024);
    const allowedTypes = [
      "audio/webm",
      "audio/wav",
      "audio/mp4",
      "audio/x-m4a",
    ];

    if (!allowedTypes.includes(blob.type)) {
      toast.error(
        `Question ${
          questionIndex + 1
        }: Invalid file type. Only audio files are allowed.`
      );
      return false;
    }

    if (blob.size > maxSizeBytes) {
      toast.error(
        `Question ${
          questionIndex + 1
        }: File is too large. Maximum size is ${MAX_SIZE_MB}MB.`
      );
      return false;
    }

    return true;
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
      setIsUploading(true);
      setUploadProgress(0);

      const rubricString = `${pointValues.join("|,,|")}|^^^|${categories
        .map((category) => {
          return `${category.name}|:::|${category.descriptions
            .map((description) => description || "")
            .join("|,,|")}`;
        })
        .join("|;;|")}`;

      const instructionsString = `${instructionsEnabled}|i_i|${instructions.join(
        "|i_i|"
      )}`;

      const language =
        selectedLanguage === "Other" ? otherLanguage : selectedLanguage;

      const maxFileSizeBytes = 15 * 1024 * 1024;
      const allFilesAreValid = await Promise.all(
        questions.map(async (questionUrl, i) => {
          const blob = await fetch(questionUrl).then((res) => res.blob());
          return validateAudioBlob(blob, i, maxFileSizeBytes);
        })
      );

      if (allFilesAreValid.includes(false)) {
        setIsUploading(false);
        return;
      }

      if (isUpdate) {
        toast.success("Updating configuration...");

        const updateResponse = await fetch(
          `https://www.server.speakeval.org/updateconfig?id=${id}&pin=${userId}&rubric=${encodeURIComponent(
            rubricString
          )}&limit=${maxTime}&language=${language}&configType=${configType}&instructions=${encodeURIComponent(
            instructionsString
          )}`,
          {
            method: "POST",
          }
        );

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok || updateResult.error) {
          throw new Error(updateResult.error || "Failed to update config");
        }

        toast.success("Config updated successfully, uploading questions...");

        for (let i = 0; i < questions.length; i++) {
          const res = await fetch(questions[i]);
          const blob = await res.blob();

          const uploadUrlResponse = await fetch(
            `https://www.server.speakeval.org/get-upload-url?pin=${userId}&config=${id}&index=${i}`,
            {
              method: "GET",
            }
          );

          if (!uploadUrlResponse.ok) {
            throw new Error("Failed to get upload URL");
          }

          const { url, fields } = await uploadUrlResponse.json();
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("file", blob);
          formData.append("content-type", "audio/wav");

          const uploadResponse = await fetch(url, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload to S3");
          }

          const questionResponse = await fetch(
            `https://www.server.speakeval.org/uploadquestion?pin=${userId}&id=${id}&index=${i}&language=${language}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ uploaded: true }),
            }
          );

          const questionResult = await questionResponse.json();

          if (!questionResponse.ok || questionResult.error) {
            throw new Error(
              questionResult.error || `Failed to upload question ${i + 1}`
            );
          }

          setUploadProgress(Math.round(((i + 1) / questions.length) * 100));
        }

        toast.success("Configuration updated successfully");
        setIsConfigRegistered(true);
      } else {
        const configResponse = await fetch(
          `https://www.server.speakeval.org/createconfig?pin=${userId}&id=${id}&rubric=${encodeURIComponent(
            rubricString
          )}&limit=${maxTime}&language=${language}&configType=${configType}&instructions=${encodeURIComponent(
            instructionsString
          )}`,
          {
            method: "POST",
          }
        );

        const configResult = await configResponse.json();

        if (!configResponse.ok || configResult.error) {
          throw new Error(configResult.error || "Failed to create config");
        }

        toast.success("Config created successfully, uploading questions...");

        for (let i = 0; i < questions.length; i++) {
          const res = await fetch(questions[i]);
          const blob = await res.blob();

          const base64Audio = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64data = reader.result;
              resolve(base64data.split(",")[1]);
            };
          });

          const uploadUrlResponse = await fetch(
            `https://www.server.speakeval.org/get-upload-url?pin=${userId}&config=${id}&index=${i}`,
            {
              method: "GET",
            }
          );

          if (!uploadUrlResponse.ok) {
            throw new Error("Failed to get upload URL");
          }

          const { url, fields } = await uploadUrlResponse.json();
          const formDatass = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formDatass.append(key, value);
          });
          formDatass.append("file", blob);
          formDatass.append("content-type", "audio/wav");

          const uploadResponse = await fetch(url, {
            method: "POST",
            body: formDatass,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload to S3");
          }

          const questionResponse = await fetch(
            `https://www.server.speakeval.org/uploadquestion?pin=${userId}&id=${id}&index=${i}&language=${language}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ uploaded: true }),
            }
          );

          const questionResult = await questionResponse.json();

          if (!questionResponse.ok || questionResult.error) {
            throw new Error(
              questionResult.error || `Failed to upload question ${i + 1}`
            );
          }

          setUploadProgress(Math.round(((i + 1) / questions.length) * 100));
        }

        cuteAlert({
          type: "success",
          title: "Success",
          description: "Question set registered successfully",
          primaryButtonText: "OK",
        });
      }

      setIsConfigRegistered(true);
      setIsUploading(false);
    } catch (err) {
      console.error("Error with configuration", err);
      toast.error(`Error: ${err.message || "Failed to process configuration"}`);
      setIsUploading(false);
    }
  };

  const configTypes = [
    { key: "Classic", label: "Classic" },
    { key: "Conversation", label: "2-Person Conversation" },
    { key: "Simulated_Conversation", label: "AP Simulated Conversation" },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      {isConfigSelection ? (
        <>
          <div className="w-full max-w-md mx-auto margin mt-20">
            <div className="relative overflow-hidden bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                  Select a Configuration
                </h2>
                <div className="space-y-4">
                  {isLoadingConfigs ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-300"></div>
                    </div>
                  ) : configs.length > 0 ? (
                    <div className="flex flex-wrap gap-3 justify-center">
                      {configs.map((config, index) =>
                        config.name ? (
                          <button
                            key={config.name}
                            onClick={() => handleConfigClick(config, false)}
                            onMouseEnter={() => setHoverIndex(index)}
                            onMouseLeave={() => setHoverIndex(null)}
                            className={`relative overflow-hidden px-4 py-2 rounded-full transition-all duration-300 ${
                              hoverIndex === index
                                ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 shadow-lg shadow-cyan-500/30"
                                : "bg-black/30"
                            } border border-cyan-500/30 text-white hover:border-cyan-400/50`}
                          >
                            {hoverIndex === index && (
                              <div className="absolute inset-0 overflow-hidden">
                                <div className="gleam"></div>
                              </div>
                            )}
                            <span className="relative z-10">{config.name}</span>
                          </button>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-lg text-white">
                        No configurations found. Go to the configurations page
                        to make one.
                      </p>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {showUpgrade && <Upgrade onClose={() => setShowUpgrade(false)} />}
          {showAutofillUpgrade && (
            <Upgrade onClose={() => setShowAutofillUpgrade(false)} />
          )}

          {!isConfigRegistered && selected && (
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
                    <strong>Warning:</strong> Your{" "}
                    {isUpdate
                      ? "configuration has not been updated"
                      : "question set has not been saved"}{" "}
                    yet. Click "{isUpdate ? "Update" : "Register Question Set"}"
                    at the bottom of the page to save your work.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 py-8 space-y-8">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              {isUpdate ? "Update Configuration" : "Configure Exam"}
            </h1>

            {selected && (
              <>
                {isUpdate ? (
                  <></>
                ) : (
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={handleSelectiveAutofillClick}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 font-medium flex items-center space-x-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Autofill from Existing</span>
                    </button>
                  </div>
                )}
                {isUpdate ? (
                  <></>
                ) : (
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
                          disabled={isUpdate}
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Sleek Config Type Selector Card */}
                <Card color="gray">
                  <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    Select Config Type
                  </h2>
                  <div className="flex w-full max-w-2xl mx-auto bg-black/30 rounded-lg p-1 border border-gray-500/30">
                    {configTypes.map((type, index) => {
                      const isEnabled = index === 0; // Only the first button is enabled

                      return (
                        <button
                          key={type.key}
                          onClick={() => {
                            if (isEnabled) {
                              setConfigType(type.key);
                            } else {
                              toast.info(
                                "These features are still in beta and in development."
                              );
                            }
                          }}
                          // Conditionally apply classes for enabled/disabled states
                          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                            configType === type.key
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20 text-white"
                              : isEnabled
                              ? "text-gray-400 hover:bg-white/10"
                              : "text-gray-500 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Instructions Card (Conditional) */}
                {
                  <Card
                    color="green"
                    className={
                      isInfoTooltipVisible
                        ? "relative z-50 overflow-visible"
                        : "relative"
                    }
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-bold text-white">
                          Instructions
                        </h2>
                        <div
                          className="relative group"
                          onMouseEnter={() => setIsInfoTooltipVisible(true)}
                          onMouseLeave={() => setIsInfoTooltipVisible(false)}
                        >
                          <FaInfoCircle className="text-green-300 cursor-help" />
                          <div
                            className="absolute bottom-full mb-2 w-72 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-lg 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible
                               transform -translate-x-1/2 left-1/2 pointer-events-none z-500"
                          >
                            <p className="text-slate-200 text-sm mb-3 z-100">
                              Enable this to provide students with instructions
                              before they start the test. The instructions will
                              appear on the screen before the first question.
                            </p>
                            <img
                              src="https://placehold.co/600x400/1e293b/94a3b8?text=Image+Placeholder"
                              alt="Instructions Example"
                              className="rounded-md w-full"
                            />
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                   border-x-8 border-x-transparent
                                   border-t-8 border-t-slate-800"
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="enable-instructions"
                          className="text-white"
                        >
                          Enable
                        </label>
                        <input
                          type="checkbox"
                          id="enable-instructions"
                          checked={instructionsEnabled}
                          onChange={(e) =>
                            setInstructionsEnabled(e.target.checked)
                          }
                          className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                        />
                      </div>
                    </div>
                    {instructionsEnabled && (
                      <div className="space-y-4">
                        {instructions.map((instruction, index) => (
                          <div
                            key={index}
                            className="bg-black/20 border border-green-500/30 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start space-x-3">
                              <label className="text-white w-28 pt-2 flex-shrink-0">
                                Instruction {index + 1}
                              </label>
                              <textarea
                                value={instruction.text}
                                onChange={(e) =>
                                  handleInstructionTextChange(index, e)
                                }
                                placeholder={`Enter instructions for the user...`}
                                className="w-full bg-black/30 border border-green-500/30 rounded p-2 text-white overflow-hidden resize-none"
                                style={{ minHeight: "50px" }}
                              />
                              <button
                                onClick={() => handleDeleteInstruction(index)}
                                className="text-red-400 hover:text-red-300 transition-colors p-2 flex-shrink-0"
                                title="Delete Instruction"
                              >
                                <FaTimes />
                              </button>
                            </div>
                            <div className="flex items-center justify-end space-x-2 border-t border-green-500/20 pt-3">
                              <label
                                htmlFor={`show-options-${index}`}
                                className="text-sm text-gray-300"
                              >
                                Show:
                              </label>
                              <select
                                id={`show-options-${index}`}
                                value={instruction.show}
                                onChange={(e) =>
                                  handleInstructionShowChange(index, e)
                                }
                                className="bg-gray-800/50 border border-green-500/30 rounded py-1 px-2 text-white text-sm focus:ring-green-500 focus:border-green-500"
                              >
                                <option value="Once at the Start of Room">
                                  Once at the Start of Room
                                </option>
                                <option value="Always">Always</option>
                                <option value="Question Prompt">
                                  Question Prompt
                                </option>
                              </select>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2">
                          <button
                            onClick={handleAddInstruction}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                          >
                            <FaPlus className="mr-2" /> Add Instruction
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                }

                {/* Record Questions Card (Conditional) */}
                {
                  <Card color="cyan">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {configType === "Classic"
                        ? "Record Questions"
                        : "Record Prompts"}
                    </h2>
                    <button
                      onClick={handleImportClick}
                      className="fixed top-4 right-6 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
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
                          <span>
                            {recording ? "Stop Recording" : "Start Recording"}
                          </span>
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
                                filter: "invert(1)",
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
                }

                {/* Create Rubric Card (Conditional) */}
                {
                  <Card color="purple">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        Create Rubric
                      </h2>
                      <button
                        onClick={handlePresetRubricsClick}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <span>Preset Rubrics</span>
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
                                  handlePointValueChange={
                                    handlePointValueChange
                                  }
                                  handleDeletePointValue={
                                    handleDeletePointValue
                                  }
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
                                      onClick={() =>
                                        handleDeleteCategory(categoryIndex)
                                      }
                                      className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <FaTimes size={12} />
                                    </button>
                                    <input
                                      type="text"
                                      value={category.name}
                                      onChange={(e) =>
                                        handleCategoryNameChange(
                                          categoryIndex,
                                          e
                                        )
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
                }

                {/* Additional Settings Card (Conditional) */}
                {
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
                          placeholder={`Enter time limit, recommended: ${
                            configType === "Classic" ? 30 : 180
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Language
                        </label>
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
                }

                <Card color="pink">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {isUpdate
                      ? "Update Configuration"
                      : "Register Question Set"}
                  </h2>
                  <div className="space-y-4">
                    {isUploading && (
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-white">
                            {isUpdate
                              ? "Updating configuration..."
                              : "Uploading questions..."}
                          </span>
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
                        {isUploading
                          ? isUpdate
                            ? "Updating..."
                            : "Uploading..."
                          : isUpdate
                          ? "Update"
                          : "Register Question Set"}
                      </span>
                    </button>
                  </div>
                </Card>
              </>
            )}

            {/* All modals remain the same */}
          </div>
        </>
      )}
    </DndProvider>
  );
};

export default Config;
