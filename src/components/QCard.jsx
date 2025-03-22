"use client";

import { useState, useRef, useEffect } from "react";
import { FaPlay, FaMicrophone, FaStop, FaRedo } from "react-icons/fa";

export default function QuestionCard({
  id,
  data,
  questions,
  storedCategories,
  updateCard,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      if (storedCategories) {
        setCategories(storedCategories);
        console.log("Loaded categories from localStorage:", storedCategories);
      } else {
        // Default categories if none in localStorage
        setCategories([
          {
            name: "Grammar",
            descriptions: [
              "Excellent",
              "Good",
              "Average",
              "Poor",
              "Inadequate",
            ],
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading categories from localStorage:", error);
      // Set default categories on error
      setCategories([
        {
          name: "Pronunciation",
          descriptions: ["Excellent", "Good", "Average", "Poor", "Inadequate"],
        },
      ]);
    }
  }, [data]);

  useEffect(() => {
    if (
      categories.length > 0 &&
      (!data.categoryGrades || Object.keys(data.categoryGrades).length === 0)
    ) {
      const initialCategoryGrades = {};
      const initialCategoryJustifications = {};

      categories.forEach((category) => {
        initialCategoryGrades[category.name] = "";
        initialCategoryJustifications[category.name] = "";
      });

      updateCard(id, {
        categoryGrades: initialCategoryGrades,
        categoryJustifications: initialCategoryJustifications,
      });
    }
  }, [categories, data, id, updateCard]);

  const handleQuestionChange = (e) => {
    updateCard(id, { question: e.target.value });
  };

  const handleCategoryGradeChange = (categoryName, e) => {
    const newGrades = { ...(data.categoryGrades || {}) };
    newGrades[categoryName] = e.target.value;
    updateCard(id, { categoryGrades: newGrades });
  };

  const handleCategoryJustificationChange = (categoryName, e) => {
    const newJustifications = { ...(data.categoryJustifications || {}) };
    newJustifications[categoryName] = e.target.value;
    updateCard(id, { categoryJustifications: newJustifications });
  };

  const handlePlayClick = async () => {
    console.log("Play Clicked");
    for (let question of questions) {
      if (question.question === data.question) {
        console.log("Playing audio...");
        const audioData = Uint8Array.from(atob(question.audioBlob), (c) =>
          c.charCodeAt(0)
        );
        const audioBlob = new Blob([audioData], {
          type: "audio/ogg; codecs=opus",
        });
        const wavBlob = await convertOggToWav(audioBlob);
        const audioUrl = URL.createObjectURL(wavBlob);

        const audio = new Audio(audioUrl);
        audio.play();
      }
    }
  };

  async function convertOggToWav(oggBlob) {
    const arrayBuffer = await oggBlob.arrayBuffer();
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    let offset = 0;

    // RIFF identifier
    writeString(view, offset, "RIFF");
    offset += 4;
    // File length
    view.setUint32(
      offset,
      36 + audioBuffer.length * numberOfChannels * 2,
      true
    );
    offset += 4;
    // RIFF type
    writeString(view, offset, "WAVE");
    offset += 4;
    // Format chunk identifier
    writeString(view, offset, "fmt ");
    offset += 4;
    // Format chunk length
    view.setUint32(offset, 16, true);
    offset += 4;
    // Sample format (raw)
    view.setUint16(offset, 1, true);
    offset += 2;
    // Channel count
    view.setUint16(offset, numberOfChannels, true);
    offset += 2;
    // Sample rate
    view.setUint32(offset, audioBuffer.sampleRate, true);
    offset += 4;
    // Byte rate
    view.setUint32(offset, audioBuffer.sampleRate * numberOfChannels * 2, true);
    offset += 4;
    // Block align
    view.setUint16(offset, numberOfChannels * 2, true);
    offset += 2;
    // Bits per sample
    view.setUint16(offset, 16, true);
    offset += 2;
    // Data chunk identifier
    writeString(view, offset, "data");
    offset += 4;
    // Data chunk length
    view.setUint32(offset, audioBuffer.length * numberOfChannels * 2, true);
    offset += 4;

    // Write interleaved data
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        updateCard(id, { audioBlob });

        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-black/30 rounded-lg p-4 mb-4 border border-cyan-500/30 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-white">
              Select Question
            </label>
            <select
              className="w-full p-2 rounded-md bg-black/30 border border-red-500/30 text-white focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              value={data.question}
              onChange={handleQuestionChange}
            >
              <option value="">Select a question</option>
              {questions &&
                questions.map((q, i) => (
                  <option key={i} value={q.question}>
                    {q.question}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={handlePlayClick}
            disabled={false}
            className={`p-3 rounded-md flex items-center justify-center transition-all duration-300 h-10 self-end ${
              questions && questions.length > 0
                ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/30"
                : "bg-purple-500/30 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaPlay size={16} className="mr-2" /> Play
          </button>
        </div>

        <button
          onClick={handleRecordClick}
          className={`p-3 rounded-md flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/30"
              : "bg-gradient-to-r from-green-500 to-green-700 text-white hover:shadow-lg hover:shadow-green-500/30"
          }`}
        >
          {isRecording ? (
            <>
              <FaStop size={16} className="mr-2" /> Stop Recording
            </>
          ) : (
            <>
              <FaMicrophone size={16} className="mr-2" /> Record Answer
            </>
          )}
        </button>
      </div>

      {audioURL && (
        <div className="mb-4 bg-black/30 p-2 rounded-md border border-cyan-500/20">
          <audio
            ref={audioRef}
            src={audioURL}
            controls
            className="w-full"
            style={{
              backgroundColor: "transparent",
              border: "none",
              filter: "invert(1)" /* Makes buttons white */,
            }}
          />
        </div>
      )}

      {/* Categories with individual grade and justification inputs */}
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium text-white border-b border-cyan-500/30 pb-2">
          Grading Categories
        </h3>

        {categories.map((category, index) => (
          <div
            key={index}
            className="p-3 bg-black/20 rounded-lg border border-purple-500/20"
          >
            <h4 className="text-md font-medium text-white mb-2">
              {category.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Grade
                </label>
                <input
                  type="text"
                  className="w-full p-2 rounded-md bg-black/30 border border-yellow-500/30 text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                  value={data.categoryGrades?.[category.name] || ""}
                  onChange={(e) => handleCategoryGradeChange(category.name, e)}
                  placeholder={`Enter grade for ${category.name}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Justification
                </label>
                <textarea
                  className="w-full p-2 rounded-md bg-black/30 border border-yellow-500/30 text-white min-h-[80px] focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                  value={data.categoryJustifications?.[category.name] || ""}
                  onChange={(e) =>
                    handleCategoryJustificationChange(category.name, e)
                  }
                  placeholder={`Enter justification for ${category.name}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
