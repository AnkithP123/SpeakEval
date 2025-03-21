"use client";

import { useState, useRef } from "react";
import { FaPlay, FaMicrophone, FaStop, FaRedo } from "react-icons/fa";

const SAMPLE_QUESTIONS = [
  "Explain the concept of machine learning.",
  "What is the difference between supervised and unsupervised learning?",
  "How do neural networks work?",
  "Explain the concept of natural language processing.",
  "What are the ethical considerations in AI development?",
];

export default function QuestionCard({ id, data, updateCard }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const handleQuestionChange = (e) => {
    updateCard(id, { question: e.target.value });
  };

  const handleGradeChange = (e) => {
    updateCard(id, { grade: e.target.value });
  };

  const handleJustificationChange = (e) => {
    updateCard(id, { justification: e.target.value });
  };

  const handlePlayClick = () => {
    console.log("Play Clicked");
    if (audioURL) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    }
  };

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
      <div className="flex flex-col md:flex-row gap-4 mb-4">
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
            {SAMPLE_QUESTIONS.map((q, i) => (
              <option key={i} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePlayClick}
            disabled={!audioURL}
            className={`p-2 rounded-full transition-all duration-300 ${
              audioURL
                ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/30"
                : "bg-purple-500/30 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaPlay size={16} />
          </button>

          <button
            onClick={handleRecordClick}
            className={`p-2 rounded-full transition-all duration-300 ${
              isRecording
                ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/30"
                : "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/30"
            }`}
          >
            {isRecording ? <FaStop size={16} /> : <FaMicrophone size={16} />}
          </button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Grade
          </label>
          <input
            type="text"
            className="w-full p-2 rounded-md bg-black/30 border border-yellow-500/30 text-white focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            value={data.grade}
            onChange={handleGradeChange}
            placeholder="Enter grade in %"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">
            Justification
          </label>
          <textarea
            className="w-full p-2 rounded-md bg-black/30 border border-yellow-500/30 text-white min-h-[80px] focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            value={data.justification}
            onChange={handleJustificationChange}
            placeholder="Enter justification for grade"
          />
        </div>
      </div>
    </div>
  );
}
