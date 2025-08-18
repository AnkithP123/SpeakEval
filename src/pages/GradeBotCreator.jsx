"use client";

import { useState } from "react";
import QuestionCardContainer from "../components/QCardContainer";
import Card from "../components/Card";
import PromptModal from "../components/PromptModal";

export default function Home({ getPin }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [categories, setCategories] = useState([]);

  const [promptMessage, setPromptMessage] = useState(
    "You are an AI assistant that helps grade speaking assessments. Evaluate the student's response based on the provided rubric and give constructive feedback."
  );
  const [questionSet, setQuestionSet] = useState([]);

  const handleSavePrompt = (newPrompt) => {
    setPromptMessage(newPrompt);
  };

  const handleImportQuestions = async () => {
    try {
      setPopupVisible(true);
      const configs = await fetch(
        `https://www.server.speakeval.org/getconfigs?pin=${getPin()}`
      );
      const configsList = await configs.json();
      setSelectedConfig(configsList);
    } catch (error) {
      setPopupVisible(false);
      console.error("Failed to fetch configs:", error);
      toast.error("Failed to fetch configurations");
    }
  };

  const handlePromptChange = (e) => {
    setPromptMessage(e.target.value);
  };

  const handleConfigClick = (config) => {
    let samplearr = [];
    for (let question of config.questions) {
      samplearr.push({
        question: question.transcription,
        audioBlob: question.audio,
      });
    }
    let newQuestionSet = [...questionSet, ...samplearr];
    setQuestionSet(newQuestionSet);

    let rubric2 = config.rubric;
    const categories = rubric2.split("|;;|").map((category) => {
      const [name, descriptionsString] = category.split("|:::|");
      const descriptions = descriptionsString
        ? descriptionsString.split("|,,|")
        : Array(5).fill("");
      return { name, descriptions };
    });

    setCategories(categories);

    setPopupVisible(false);
  };

  return (
    <main className="min-h-screen p-8 bg-[#0f1e3d]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Create Grading Bot
        </h1>

        {/* Warning banner */}
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
                <strong>Warning:</strong> Your GradeBot has not been registered
                yet. Click "Register Configuration" at the bottom of the page to
                save your work.
              </p>
            </div>
          </div>
        </div>

        <Card color="cyan" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            AI SETTINGS
          </h2>

          <textarea
            value={promptMessage}
            onChange={handlePromptChange}
            className="w-full h-32 p-4 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            placeholder="Enter prompt message for the AI"
          />
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Fine-Tuning</h2>
          <button
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-4 rounded-md font-bold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
            onClick={() => handleImportQuestions()}
          >
            IMPORT QUESTION-SET
          </button>
        </div>

        <QuestionCardContainer
          questionSet={questionSet}
          storedCategories={categories}
        />

        <Card color="pink" className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Save GradeBot Configuration
          </h2>
          <div className="mb-4">
            <label className="text-white block mb-2">GradeBot Name</label>
            <input
              type="text"
              placeholder="Enter Name for Bot"
              className="w-full p-2 rounded bg-black/30 text-white border border-pink-500/30 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
          <button className="w-full relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 bg-gradient-to-r from-pink-600/50 to-purple-700/50 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:shadow-lg hover:shadow-pink-500/30">
            Register Configuration
          </button>
        </Card>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prompt={promptMessage}
        setPrompt={setPromptMessage}
        onSave={handleSavePrompt}
      />

      {/* Conditionally render the popup */}
      {popupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="relative overflow-hidden bg-black/60 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl w-full max-w-md mx-auto">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Select a Configuration
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
    </main>
  );
}
