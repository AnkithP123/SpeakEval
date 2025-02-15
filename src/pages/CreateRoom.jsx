"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import RoomPanel from "../components/RoomPanel"
import { useNavigate } from "react-router-dom"
import "./CreateRoom.css"
import { FaInfoCircle } from "react-icons/fa"

function CreateRoom({ initialUserId = "", set, setUltimate, getPin }) {
  const [userId, setUserId] = useState(getPin())
  const [loggedIn, setLoggedIn] = useState(userId)
  const [roomCode, setRoomCode] = useState("")
  const [shake, setShake] = useState(false)
  const [configId, setConfigId] = useState("")
  const [isConfigEntered, setIsConfigEntered] = useState(false)
  const [configs, setConfigs] = useState([])
  const navigate = useNavigate()
  const [timeLimit, setTimeLimit] = useState(3600)
  const [thinkingTime, setThinkingTime] = useState(5) // Changed default to 5 seconds
  const [canRelisten, setCanRelisten] = useState(true) // Changed default to true
  const [hoveredInfo, setHoveredInfo] = useState(null)
  const [requireGoogleSignIn, setRequireGoogleSignIn] = useState(false)
  const [emailEnding, setEmailEnding] = useState("")

  useEffect(() => {
    const fetchConfigs = async () => {
      console.log("Fetching Configs")
      try {
        const res = await fetch(`https://www.server.speakeval.org/getconfigs?pin=${userId}`)
        const parsedData = await res.json()
        setConfigs(parsedData)
        console.log(configs)
      } catch (err) {
        console.error("Error Loading Configs", err)
        toast.error("Error Loading Configs")
      }
    }

    if (loggedIn) {
      fetchConfigs()
    }
  }, [loggedIn, userId])

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/create-room")
    }
  }, [loggedIn, navigate])

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = switchStyle
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleInputChange = async (e) => {
    const input = e.target.value
    setUserId(input.toUpperCase())
  }

  const handleConfigChange = (e) => {
    setConfigId(e.target.value)
  }

  const checkUserId = async (userId) => {
    let parsedData
    try {
      const res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`)
      parsedData = await res.json()

      if (parsedData.code === 401) {
        console.error(parsedData)
        toast.error("Incorrect Teacher Pin")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return setUserId("")
      }
      if (parsedData.code === 200) {
        setLoggedIn(true)
        setIsConfigEntered(false)
      }
      if (parsedData.subscription) {
        set(parsedData.subscription !== "free")
        setUltimate(parsedData.subscription === "Ultimate")
      }
    } catch (err) {
      console.error("Error Loading Data", err)
      toast.error("Error Loading Data")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return setUserId("")
    }
  }

  const handleGoClick = () => {
    checkUserId(userId)
  }

  const handleConfigSubmit = async () => {
    if (configId === "") {
      return toast.error(
        "Please enter a config name into the box or click one of your saved configs before creating the room!",
      )
    }
    try {
      const res = await fetch(`https://www.server.speakeval.org/verifyconfig?name=${configId}`)
      const parsedData = await res.json()
      if (parsedData.valid) {
        setTimeLimit(configs.find((c) => c.name === configId)?.timeLimit || 3600)
        setIsConfigEntered(true)
      } else {
        toast.error("The config name you entered is invalid. Please enter a valid config name.")
      }
    } catch (err) {
      console.error("Error Verifying Config Existence", err)
      toast.error("Error Verifying Config Existence")
    }
  }

  const handleFinalRoomCreation = async () => {
    let time = Date.now()
    time = Math.floor(Math.random() * 5) + 1 + time.toString().slice(-7) + "001"
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/create_room?code=${time}&pin=${userId}&config=${configId}&timeLimit=${timeLimit}&thinkingTime=${thinkingTime}&canRelisten=${canRelisten}&google=${requireGoogleSignIn}&ending=${emailEnding}`,
      )
      const parsedData = await res.json()
      if (parsedData.code === 400) {
        toast.error(parsedData.message)
        setIsConfigEntered(false)
        return navigate("/create-room")
      }
      setRoomCode(time)
    } catch (err) {
      console.error("Error Creating Room", err)
      toast.error("Error Creating Room")
      setIsConfigEntered(false)
    }
  }

  const containerStyle = {
    position: "relative",
    padding: "10px 20px",
    borderRadius: "10px",
    backgroundColor: "white",
    color: "white",
    fontFamily: "sans-serif",
    fontSize: "18px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
    maxWidth: "400px",
    margin: "20px auto",
    textAlign: "center",
  }

  const inputStyle = {
    width: "calc(100% - 50px)",
    padding: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "black",
    fontFamily: "inherit",
    fontSize: "inherit",
    textAlign: "center",
    outline: "none",
    letterSpacing: "2px",
    marginRight: "10px",
  }

  const timeInputStyle = {
    width: "80px",
    padding: "10px",
    border: "none",
    backgroundColor: "#f2f2f2",
    color: "black",
    fontFamily: "inherit",
    fontSize: "inherit",
    textAlign: "right",
    outline: "none",
    letterSpacing: "2px",
    marginLeft: "auto",
    borderRadius: "5px",
  }

  const buttonStyle = {
    backgroundColor: "black",
    border: "none",
    color: "white",
    padding: "5px 10px",
    textAlign: "center",
    fontFamily: "Montserrat",
    fontSize: "16px",
    margin: "4px 2px",
    cursor: "pointer",
    borderRadius: "5px",
  }

  const chipStyle = {
    display: "inline-block",
    padding: "5px 10px",
    margin: "5px",
    borderRadius: "15px",
    backgroundColor: "#f0f0f0",
    color: "#333",
    fontSize: "14px",
    cursor: "pointer",
  }

  const switchStyle = `
  .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
  }

  .switch input {
      opacity: 0;
      width: 0;
      height: 0;
  }

  .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
  }

  .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
  }

  input:checked + .slider {
      background-color: #2196F3;
  }

  input:focus + .slider {
      box-shadow: 0 0 1px #2196F3;
  }

  input:checked + .slider:before {
      transform: translateX(26px);
  }

  .slider.round {
      border-radius: 34px;
  }

  .slider.round:before {
      border-radius: 50%;
  }
`

  return (
    <div>
      <title hidden>Create Room</title>
      {!roomCode && <div style={containerStyle}>
        {!isConfigEntered ? (
          <>
            <div>
              {configs.length > 0 ? (
                configs.map((config) =>
                  config.name ? (
                    <div key={config.name} style={chipStyle} onClick={() => setConfigId(config.name)}>
                      {config.name}
                    </div>
                  ) : null,
                )
              ) : (
                <>
                  <p className="text-2xl font-bold" style={{ color: "black" }}>
                    No configurations found. Go to the configurations page to make one.
                  </p>
                  <hr style={{ width: "100%", border: "1px solid lightgray", margin: "10px 0" }} />
                </>
              )}
            </div>
            <input
              type="text"
              value={configId}
              onChange={handleConfigChange}
              style={inputStyle}
              placeholder="Enter Name of Set"
              onKeyUp={(e) => {
                if (e.key === "Enter") handleConfigSubmit()
              }}
            />
            <button onClick={handleConfigSubmit} style={buttonStyle}>
              Create Room
            </button>
          </>
        ) : !roomCode ? (
          <>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <span style={{ color: "black", display: "flex", alignItems: "center" }}>
                Response Time Limit (s)
                <div style={{ position: "relative" }}>
                  <FaInfoCircle
                    className="ml-2 text-blue-500 cursor-help"
                    onMouseEnter={() => setHoveredInfo("timeLimit")}
                    onMouseLeave={() => setHoveredInfo(null)}
                  />
                  {hoveredInfo === "timeLimit" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "black",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        zIndex: 1,
                      }}
                    >
                      Time allowed for response after thinking time
                    </div>
                  )}
                </div>
              </span>
              <input
                type="text"
                value={timeLimit}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : Number(e.target.value)
                  setTimeLimit(value)
                }}
                onBlur={() => {
                  if (timeLimit === "") setTimeLimit(0)
                }}
                style={timeInputStyle}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <span style={{ color: "black", display: "flex", alignItems: "center" }}>
                Thinking Time (s)
                <div style={{ position: "relative" }}>
                  <FaInfoCircle
                    className="ml-2 text-blue-500 cursor-help"
                    onMouseEnter={() => setHoveredInfo("thinkingTime")}
                    onMouseLeave={() => setHoveredInfo(null)}
                  />
                  {hoveredInfo === "thinkingTime" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "black",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        zIndex: 1,
                      }}
                    >
                      Time allowed for thinking before answering
                    </div>
                  )}
                </div>
              </span>
              <input
                type="text"
                value={thinkingTime}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : Number(e.target.value)
                  setThinkingTime(value)
                }}
                onBlur={() => {
                  if (thinkingTime === "") setThinkingTime(0)
                }}
                style={timeInputStyle}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <span style={{ color: "black", display: "flex", alignItems: "center" }}>
                Allow question relisten
                <div style={{ position: "relative" }}>
                  <FaInfoCircle
                    className="ml-2 text-blue-500 cursor-help"
                    onMouseEnter={() => setHoveredInfo("relisten")}
                    onMouseLeave={() => setHoveredInfo(null)}
                  />
                  {hoveredInfo === "relisten" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "black",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        zIndex: 1,
                      }}
                    >
                      Allow students to listen to the question again during thinking time
                    </div>
                  )}
                </div>
              </span>
              <label className="switch">
                <input type="checkbox" checked={canRelisten} onChange={(e) => setCanRelisten(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <span style={{ color: "black", display: "flex", alignItems: "center" }}>
                Require Google Sign-In
                <div style={{ position: "relative" }}>
                  <FaInfoCircle
                    className="ml-2 text-blue-500 cursor-help"
                    onMouseEnter={() => setHoveredInfo("googleSignIn")}
                    onMouseLeave={() => setHoveredInfo(null)}
                  />
                  {hoveredInfo === "googleSignIn" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "black",
                        color: "white",
                        padding: "5px",
                        borderRadius: "5px",
                        zIndex: 1,
                      }}
                    >
                      Require students to sign in with their school Google account to join the room
                    </div>
                  )}
                </div>
              </span>
              <label className="switch">
                <input type="checkbox" checked={requireGoogleSignIn} onChange={(e) => setRequireGoogleSignIn(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
            {requireGoogleSignIn && (
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
              >
                <span style={{ color: "black", display: "flex", alignItems: "center" }}>
                  Email Ending
                  <div style={{ position: "relative" }}>
                    <FaInfoCircle
                      className="ml-2 text-blue-500 cursor-help"
                      onMouseEnter={() => setHoveredInfo("emailEnding")}
                      onMouseLeave={() => setHoveredInfo(null)}
                    />
                    {hoveredInfo === "emailEnding" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: "black",
                          color: "white",
                          padding: "5px",
                          borderRadius: "5px",
                          zIndex: 1,
                        }}
                      >
                        Specify the email domain students must use to sign in, e.g. student.fuhsd.org, myschool.edu, something like that
                      </div>
                    )}
                  </div>
                </span>
                <input
                  type="text"
                  value={emailEnding}
                  onChange={(e) => setEmailEnding(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g., fuhsd.org"
                />
              </div>
            )}
            <button onClick={handleFinalRoomCreation} style={buttonStyle}>
              Create Room
            </button>
          </>
        ) : (
            <div></div>
        )}
      </div>}
      {roomCode && isConfigEntered && <RoomPanel roomCode={roomCode} userId={userId} setRoomCodes={setRoomCode} />}
    </div>
  )
}

export default CreateRoom
