"use client";

import { useState } from "react";
import QuestionCardContainer from "../components/QCardContainer";
import Card from "../components/Card";
import PromptModal from "../components/PromptModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptMessage, setPromptMessage] = useState(
    "You are an AI assistant that helps grade speaking assessments. Evaluate the student's response based on the provided rubric and give constructive feedback."
  );

  const handleSavePrompt = (newPrompt) => {
    setPromptMessage(newPrompt);
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

          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-4 rounded-md font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
            >
              PROMPT MESSAGE
            </button>

            <select className="bg-gradient-to-r from-red-600 to-red-800 text-white py-2 px-4 rounded-md font-bold text-lg border-none focus:ring-2 focus:ring-red-500/50">
              <option>MODEL</option>
              <option>GPT-4</option>
              <option>Claude 3</option>
              <option>Llama 3</option>
            </select>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Fine-Tuning</h2>
          <button className="bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-4 rounded-md font-bold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30">
            IMPORT QUESTION-SET
          </button>
        </div>

        <QuestionCardContainer />

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
    </main>
  );
}
