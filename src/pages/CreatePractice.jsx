"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "../components/Card";
import { FaInfoCircle } from "react-icons/fa";
import "../styles/globals.css";

function CreatePractice({ getPin }) {
  const [userId, setUserId] = useState(getPin());
  const [loggedIn, setLoggedIn] = useState(userId);
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState("");
  const [practiceCode, setPracticeCode] = useState("");
  const [thinkingTime, setThinkingTime] = useState(5);
  const [canRelisten, setCanRelisten] = useState(true);
  const [responseTime, setResponseTime] = useState(0);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/create-practice");
    } else {
      fetchConfigs();
    }
  }, [loggedIn, navigate]);

  const fetchConfigs = async () => {
    console.log("Fetching Configs");
    setIsLoadingConfigs(true);
    try {
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

  const handleCreatePractice = async () => {
    if (!selectedConfig) {
      toast.error("Please select a configuration");
      return;
    }

    try {
      const res = await fetch(
        `https://www.server.speakeval.org/create_practice?pin=${userId}&config=${selectedConfig}&thinkingTime=${thinkingTime}&canRelisten=${canRelisten}`
      );
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setPracticeCode(data.code);
      toast.success("Practice exam created successfully");
    } catch (err) {
      console.error("Error creating practice exam", err);
      toast.error("Error creating practice exam");
    }
  };

  const handleConfigChange = (e) => {
    const selectedConfigName = e.target.value;
    setSelectedConfig(selectedConfigName);
    const config = configs.find((config) => config.name === selectedConfigName);
    if (config) {
      setResponseTime(config.timeLimit);
    }
  };

  return (
    <div className="container">
      <Card className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Create Practice Exam
        </h1>
        {isLoadingConfigs ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-300"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">
                Select Configuration
              </label>
              <select
                value={selectedConfig}
                onChange={handleConfigChange}
                className="input"
              >
                <option value="">Select a configuration</option>
                {configs.map((config) => (
                  <option key={config.name} value={config.name}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedConfig && (
              <>
                <div>
                  <label className="block text-lg font-semibold mb-2 flex items-center">
                    Response Time Limit (seconds)
                    <FaInfoCircle
                      className="ml-2 text-blue-500 cursor-help"
                      onMouseEnter={() => setHoveredInfo("responseTime")}
                      onMouseLeave={() => setHoveredInfo(null)}
                    />
                  </label>
                  <input
                    type="number"
                    value={responseTime}
                    readOnly
                    className="input bg-gray-700"
                  />
                  {hoveredInfo === "responseTime" && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-lg text-sm">
                      Time allowed for response after thinking time
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2 flex items-center">
                    Thinking Time (seconds)
                    <FaInfoCircle
                      className="ml-2 text-blue-500 cursor-help"
                      onMouseEnter={() => setHoveredInfo("thinkingTime")}
                      onMouseLeave={() => setHoveredInfo(null)}
                    />
                  </label>
                  <input
                    type="number"
                    value={thinkingTime}
                    onChange={(e) => setThinkingTime(Number(e.target.value))}
                    className="input"
                  />
                  {hoveredInfo === "thinkingTime" && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-lg text-sm">
                      Time allowed for thinking before answering
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold flex items-center">
                    Allow Repetition
                    <FaInfoCircle
                      className="ml-2 text-blue-500 cursor-help"
                      onMouseEnter={() => setHoveredInfo("canRelisten")}
                      onMouseLeave={() => setHoveredInfo(null)}
                    />
                  </label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={canRelisten}
                      onChange={(e) => setCanRelisten(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                {hoveredInfo === "canRelisten" && (
                  <div className="mt-2 p-2 bg-gray-800 rounded-lg text-sm">
                    Allow students to listen to the question again during
                    thinking time
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleCreatePractice}
              className="btn btn-primary w-full"
            >
              Create Practice Exam
            </button>

            {practiceCode && (
              <div className="mt-8 p-6 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">
                  Practice Exam Created!
                </h2>
                <p className="text-lg mb-2">
                  Share this code with your students:
                </p>
                <div className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <span className="text-2xl font-mono">{practiceCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(practiceCode);
                      toast.success("Code copied to clipboard");
                    }}
                    className="btn btn-primary"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default CreatePractice;
