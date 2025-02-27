import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Card from "../components/Card"
import { FaInfoCircle } from "react-icons/fa"

function CreatePractice({ getPin }) {
  const [userId, setUserId] = useState(getPin())
  const [loggedIn, setLoggedIn] = useState(userId)
  const [configs, setConfigs] = useState([])
  const [selectedConfig, setSelectedConfig] = useState("")
  const [practiceCode, setPracticeCode] = useState("")
  const [thinkingTime, setThinkingTime] = useState(5) // Default to 5 seconds
  const [canRelisten, setCanRelisten] = useState(true) // Default to true
  const [responseTime, setResponseTime] = useState(0) // Default to 0
  const [hoveredInfo, setHoveredInfo] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/create-practice")
    } else {
      fetchConfigs()
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

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`https://www.server.speakeval.org/getconfigs?pin=${userId}`)
      const parsedData = await res.json()
      setConfigs(parsedData)
    } catch (err) {
      console.error("Error Loading Configs", err)
      toast.error("Error Loading Configs")
    }
  }

  const handleCreatePractice = async () => {
    if (!selectedConfig) {
      toast.error("Please select a configuration")
      return
    }

    try {
      const res = await fetch(`https://www.server.speakeval.org/create_practice?pin=${userId}&config=${selectedConfig}&thinkingTime=${thinkingTime}&canRelisten=${canRelisten}`)
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setPracticeCode(data.code)
      toast.success("Practice exam created successfully")
    } catch (err) {
      console.error("Error creating practice exam", err)
      toast.error("Error creating practice exam")
    }
  }

  const handleConfigChange = (e) => {
    const selectedConfigName = e.target.value
    setSelectedConfig(selectedConfigName)
    const config = configs.find((config) => config.name === selectedConfigName)
    if (config) {
      setResponseTime(config.timeLimit)
    }
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
    <div className="container mx-auto px-4 py-8">
      <Card bg="bg-[#E6F3FF]" className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Create Practice Exam</h1>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Select Configuration</label>
          <select
            value={selectedConfig}
            onChange={handleConfigChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
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
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">
                Response Time Limit (seconds)
                <FaInfoCircle
                  className="ml-2 text-blue-500 cursor-help"
                  onMouseEnter={() => setHoveredInfo("responseTime")}
                  onMouseLeave={() => setHoveredInfo(null)}
                />
                {hoveredInfo === "responseTime" && (
                  <div className="absolute bg-black text-white p-2 rounded-lg">
                    Time allowed for response after thinking time
                  </div>
                )}
              </label>
              <input
                type="number"
                value={responseTime}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">
                Thinking Time (seconds)
                <FaInfoCircle
                  className="ml-2 text-blue-500 cursor-help"
                  onMouseEnter={() => setHoveredInfo("thinkingTime")}
                  onMouseLeave={() => setHoveredInfo(null)}
                />
                {hoveredInfo === "thinkingTime" && (
                  <div className="absolute bg-black text-white p-2 rounded-lg">
                    Time allowed for thinking before answering
                  </div>
                )}
              </label>
              <input
                type="number"
                value={thinkingTime}
                onChange={(e) => setThinkingTime(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="text-lg font-semibold">
                Allow Repetition
                <FaInfoCircle
                  className="ml-2 text-blue-500 cursor-help"
                  onMouseEnter={() => setHoveredInfo("canRelisten")}
                  onMouseLeave={() => setHoveredInfo(null)}
                />
                {hoveredInfo === "canRelisten" && (
                  <div className="absolute bg-black text-white p-2 rounded-lg">
                    Allow students to listen to the question again during thinking time
                  </div>
                )}
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
          </>
        )}

        <button
          onClick={handleCreatePractice}
          className="w-full bg-black text-white rounded-lg px-4 py-2 hover:bg-[#3666a3] transition-colors"
        >
          Create Practice Exam
        </button>

        {practiceCode && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Practice Exam Created!</h2>
            <p className="text-lg mb-2">Share this code with your students:</p>
            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
              <span className="text-2xl font-mono">{practiceCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(practiceCode)
                  toast.success("Code copied to clipboard")
                }}
                className="bg-black text-white rounded-lg px-4 py-2 hover:bg-[#3666a3] transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CreatePractice
