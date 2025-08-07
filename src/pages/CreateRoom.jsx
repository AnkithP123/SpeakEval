"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import RoomPanel from "../components/RoomPanel";
import { useNavigate } from "react-router-dom";
import "./CreateRoom.css";
import { FaInfoCircle } from "react-icons/fa";
import Card from "../components/Card";
import Config from "./Config";

function CreateRoom({ initialUserId = "", set, setUltimate, getPin }) {
  const [userId, setUserId] = useState(getPin());
  const [loggedIn, setLoggedIn] = useState(userId);
  const [roomCode, setRoomCode] = useState("");
  const [shake, setShake] = useState(false);
  const [config, setConfig] = useState({});
  const [isConfigEntered, setIsConfigEntered] = useState(false);
  const [configs, setConfigs] = useState([]);
  const navigate = useNavigate();
  const [timeLimit, setTimeLimit] = useState(30);
  const [thinkingTime, setThinkingTime] = useState(5);
  const [canRelisten, setCanRelisten] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [requireGoogleSignIn, setRequireGoogleSignIn] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [emailEnding, setEmailEnding] = useState("");
  const [hoverButton, setHoverButton] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      console.log("Fetching Configs");
      setIsLoadingConfigs(true);
      try {
        const res = await fetch(
          `https://www.server.speakeval.org/getconfigs?pin=${userId}`
        );
        const parsedData = await res.json();
        setConfigs(parsedData);
        console.log(parsedData);
      } catch (err) {
        console.error("Error Loading Configs", err);
        toast.error("Error Loading Configs");
      } finally {
        setIsLoadingConfigs(false);
      }
    };

    if (loggedIn) {
      fetchConfigs();
    }
  }, [loggedIn, userId]);

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/create-room");
    }
  }, [loggedIn, navigate]);

  const handleInputChange = async (e) => {
    const input = e.target.value;
    setUserId(input.toUpperCase());
  };

  const handleConfigChange = (e) => {
    setConfig(e.target.value);
  };

  const checkUserId = async (userId) => {
    let parsedData;
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/teacherpin?pin=${userId}`
      );
      parsedData = await res.json();

      if (parsedData.code === 401) {
        console.error(parsedData);
        toast.error("Incorrect Teacher Pin");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return setUserId("");
      }
      if (parsedData.code === 200) {
        setLoggedIn(true);
        setIsConfigEntered(false);
      }
      if (parsedData.subscription) {
        set(parsedData.subscription !== "free");
        setUltimate(parsedData.subscription === "Ultimate");
      }
    } catch (err) {
      console.error("Error Loading Data", err);
      toast.error("Error Loading Data");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return setUserId("");
    }
  };

  const handleGoClick = () => {
    checkUserId(userId);
  };

  const handleConfigSubmit = async () => {
    if (config.name === "") {
      return toast.error(
        "Please enter a config name into the box or click one of your saved configs before creating the room!"
      );
    }
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/verifyconfig?name=${config.name}`
      );
      const parsedData = await res.json();
      if (parsedData.valid) {
        setTimeLimit(
          configs.find((c) => c.name === config.name)?.timeLimit || 30
        );
        setIsConfigEntered(true);
      } else {
        toast.error(
          "The config name you entered is invalid. Please enter a valid config name."
        );
      }
    } catch (err) {
      console.error("Error Verifying Config Existence", err);
      toast.error("Error Verifying Config Existence");
    }
  };

  const handleFinalRoomCreation = async () => {
    let time = Date.now();
    time =
      Math.floor(Math.random() * 5) + 1 + time.toString().slice(-7) + "001";
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/create_room?pin=${userId}&config=${config.name}&timeLimit=${timeLimit}&thinkingTime=${thinkingTime}&canRelisten=${canRelisten}&shuffle=${shuffleQuestions}&google=${requireGoogleSignIn}&ending=${emailEnding}`
      );
      const parsedData = await res.json();
      if (parsedData.code === 400) {
        toast.error(parsedData.message);
        setIsConfigEntered(false);
        return navigate("/create-room");
      }
      setRoomCode(parsedData.message); //server returns the room code
    } catch (err) {
      console.error("Error Creating Room", err);
      toast.error("Error Creating Room");
      setIsConfigEntered(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <title hidden>Create Room</title>
      {!roomCode && (
        <div className="max-w-md mx-auto">
          <Card color="cyan" className="w-full">
            {!isConfigEntered ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  Create Room
                </h2>
                {isLoadingConfigs ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-300"></div>
                  </div>
                ) : configs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {configs.map(
                      (configuration) =>
                        configuration.name && (
                          <div
                            key={configuration.name}
                            className={`px-4 py-2 rounded-full cursor-pointer transition-colors duration-300 border ${
                              configuration.name === config.name
                                ? "bg-cyan-900/50 text-cyan-300 border-cyan-500"
                                : "bg-black/30 text-cyan-300 hover:bg-cyan-900/50 border-cyan-500/30"
                            }`}
                            onClick={() => setConfig(configuration)}
                          >
                            {configuration.name}
                          </div>
                        )
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg text-white mb-2">
                      No configurations found. Go to the configurations page to
                      make one.
                    </p>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent my-4"></div>
                  </div>
                )}
                <div className="flex flex-col space-y-4">
                  {/* <input
                    type="text"
                    value={config.name}
                    onChange={handleConfigChange}
                    className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Enter Name of Set"
                    onKeyUp={(e) => {
                      if (e.key === "Enter") handleConfigSubmit();
                    }}
                  /> */}
                  <button
                    onClick={handleConfigSubmit}
                    onMouseEnter={() => setHoverButton(true)}
                    onMouseLeave={() => setHoverButton(false)}
                    className={`relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 ${
                      hoverButton
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                        : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                    }`}
                  >
                    <span className="relative z-10">Create Room</span>
                  </button>
                </div>
              </div>
            ) : !roomCode ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  Room Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      Response Time Limit (s)
                      <div className="relative ml-2">
                        <FaInfoCircle
                          className="text-cyan-400 cursor-help"
                          onMouseEnter={() => setHoveredInfo("timeLimit")}
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                        {hoveredInfo === "timeLimit" && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                            Time allowed for response after thinking time
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={timeLimit}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setTimeLimit(value);
                      }}
                      onBlur={() => {
                        if (timeLimit === "") setTimeLimit(0);
                      }}
                      className="w-24 px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      Thinking Time (s)
                      <div className="relative ml-2">
                        <FaInfoCircle
                          className="text-cyan-400 cursor-help"
                          onMouseEnter={() => setHoveredInfo("thinkingTime")}
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                        {hoveredInfo === "thinkingTime" && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                            Time allowed for thinking before answering
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={thinkingTime}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setThinkingTime(value);
                      }}
                      onBlur={() => {
                        if (thinkingTime === "") setThinkingTime(0);
                      }}
                      className="w-24 px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      Allow question relisten
                      <div className="relative ml-2">
                        <FaInfoCircle
                          className="text-cyan-400 cursor-help"
                          onMouseEnter={() => setHoveredInfo("relisten")}
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                        {hoveredInfo === "relisten" && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                            Allow students to listen to the question again
                            during thinking time
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={canRelisten}
                        onChange={(e) => setCanRelisten(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      Shuffle Question (s)
                      <div className="relative ml-2">
                        <FaInfoCircle
                          className="text-cyan-400 cursor-help"
                          onMouseEnter={() => setHoveredInfo("shuffle")}
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                        {hoveredInfo === "shuffle" && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                            Give each student a different order of questions
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      Require Google Sign-In
                      <div className="relative ml-2">
                        <FaInfoCircle
                          className="text-cyan-400 cursor-help"
                          onMouseEnter={() => setHoveredInfo("googleSignIn")}
                          onMouseLeave={() => setHoveredInfo(null)}
                        />
                        {hoveredInfo === "googleSignIn" && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                            Require students to sign in with their school Google
                            account to join the room
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={requireGoogleSignIn}
                        onChange={(e) =>
                          setRequireGoogleSignIn(e.target.checked)
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  {requireGoogleSignIn && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white">
                        Email Ending
                        <div className="relative ml-2">
                          <FaInfoCircle
                            className="text-cyan-400 cursor-help"
                            onMouseEnter={() => setHoveredInfo("emailEnding")}
                            onMouseLeave={() => setHoveredInfo(null)}
                          />
                          {hoveredInfo === "emailEnding" && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black/80 text-white text-sm rounded-md w-48 z-10 border border-cyan-500/30 backdrop-blur-md">
                              Specify the email domain students must use to sign
                              in (e.g., student.fuhsd.org)
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={emailEnding}
                        onChange={(e) => setEmailEnding(e.target.value)}
                        className="w-40 px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        placeholder="e.g., fuhsd.org"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleFinalRoomCreation}
                    onMouseEnter={() => setHoverButton(true)}
                    onMouseLeave={() => setHoverButton(false)}
                    className={`w-full relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 ${
                      hoverButton
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                        : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                    }`}
                  >
                    <span className="relative z-1">Create Room</span>
                  </button>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </Card>
        </div>
      )}
      {roomCode && isConfigEntered && (
        <RoomPanel
          roomCode={roomCode}
          userId={userId}
          config={config}
          setRoomCodes={setRoomCode}
        />
      )}
    </div>
  );
}

export default CreateRoom;
