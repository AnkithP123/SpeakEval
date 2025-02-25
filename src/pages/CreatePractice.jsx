import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Card from "../components/Card"

function CreatePractice({ getPin }) {
  const [userId, setUserId] = useState(getPin())
  const [loggedIn, setLoggedIn] = useState(userId)
  const [configs, setConfigs] = useState([])
  const [selectedConfig, setSelectedConfig] = useState("")
  const [practiceCode, setPracticeCode] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/create-practice")
    } else {
      fetchConfigs()
    }
  }, [loggedIn, navigate])

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
      const res = await fetch(`https://www.server.speakeval.org/create_practice?pin=${userId}&config=${selectedConfig}`)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card bg="bg-[#E6F3FF]" className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Create Practice Exam</h1>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Select Configuration</label>
          <select
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
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

