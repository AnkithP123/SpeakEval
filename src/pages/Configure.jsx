"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { FaMagic, FaTimes, FaPlus, FaMicrophone, FaStop } from "react-icons/fa"
import Card from "../components/Card"

const Configure = ({ set, setUltimate, getPin, subscribed, setSubscribed }) => {
  const [userId, setUserId] = useState(getPin())
  const [loggedIn, setLoggedIn] = useState(userId)
  const [questions, setQuestions] = useState([])
  const [recording, setRecording] = useState(false)
  const [categories, setCategories] = useState([{ name: "", descriptions: Array(5).fill("") }])
  const [pointValues, setPointValues] = useState([5, 4, 3, 2, 1])
  const [maxTime, setMaxTime] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [otherLanguage, setOtherLanguage] = useState("")
  const [id, setId] = useState("")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showAutofillUpgrade, setShowAutofillUpgrade] = useState(false)
  const [hoverButton, setHoverButton] = useState(false)
  const navigate = useNavigate()
  const mediaRecorderRef = useRef(null)

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/configure")
    }
  }, [loggedIn, navigate])

  const checkUserId = async (userId) => {
    try {
      const res = await fetch(`https://www.server.speakeval.org/teacherpin?pin=${userId}`)
      const parsedData = await res.json()

      if (parsedData.code === 401) {
        toast.error("Incorrect Teacher Pin")
        return setUserId("")
      }
      if (parsedData.code === 200) {
        setLoggedIn(true)
      }
      if (parsedData.subscription) {
        set(parsedData.subscription !== "free")
        setUltimate(parsedData.subscription === "Ultimate")
        if (parsedData.subscription !== "free") {
          setSubscribed(true)
        }
      }
    } catch (err) {
      console.error("Error Loading Data", err)
      toast.error("Error Loading Data")
      return setUserId("")
    }
  }

  const handleToggleRecording = () => {
    if (questions.length >= 60 && !subscribed) {
      setShowUpgrade(true)
      return
    }
    if (navigator.mediaDevices.getUserMedia) {
      if (recording) {
        mediaRecorderRef.current.stop()
        setRecording(false)
      } else {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream)
            mediaRecorderRef.current.start()
            mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable)
            setRecording(true)
          })
          .catch((err) => {
            console.error("Error accessing microphone", err)
            toast.error("Error accessing microphone")
          })
      }
    } else {
      console.error("getUserMedia not supported")
      toast.error("getUserMedia not supported")
    }
  }

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      const recordedQuestion = URL.createObjectURL(event.data)
      setQuestions((prevQuestions) => [...prevQuestions, recordedQuestion])
    }
  }

  const handleDeleteQuestion = (index) => {
    setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index))
    toast.success("Question deleted")
  }

  const handleAddCategory = () => {
    setCategories((prevCategories) => [
      ...prevCategories,
      { name: "", descriptions: Array(pointValues.length).fill("") },
    ])
  }

  const handleDeleteCategory = (index) => {
    setCategories((prevCategories) => prevCategories.filter((_, i) => i !== index))
  }

  const handleCategoryNameChange = (index, e) => {
    const { value } = e.target
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories]
      updatedCategories[index].name = value
      return updatedCategories
    })
  }

  const handleCategoryDescriptionChange = (categoryIndex, pointIndex, e) => {
    const { value } = e.target
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories]
      updatedCategories[categoryIndex].descriptions[pointIndex] = value
      return updatedCategories
    })
  }

  const handleAddPointValue = () => {
    const newPoint =
      pointValues.length > 1
        ? pointValues[0] + (pointValues[0] - pointValues[1])
        : pointValues.length === 1
        ? pointValues[0] + 1
        : 1
    setPointValues((prevPointValues) => [newPoint, ...prevPointValues])
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        descriptions: ["", ...category.descriptions],
      }))
    )
  }

  const handleDeletePointValue = (index) => {
    if (pointValues.length > 1) {
      setPointValues((prevPointValues) => prevPointValues.filter((_, i) => i !== index))
      setCategories((prevCategories) =>
        prevCategories.map((category) => {
          const updatedDescriptions = category.descriptions.filter((_, i) => i !== index)
          return { ...category, descriptions: updatedDescriptions }
        })
      )
    } else {
      toast.error("You must have at least one point value")
    }
  }

  const handlePointValueChange = (index, e) => {
    const { value } = e.target
    setPointValues((prevPointValues) => {
      const updatedValues = [...prevPointValues]
      updatedValues[index] = Number.parseFloat(value) || 0
      return updatedValues
    })
  }

  const handleRegisterConfig = async () => {
    if (!id) {
      toast.error("Please enter a name for the set")
      return
    }
    if (!userId) {
      toast.error("Please log in")
      return
    }
    if (questions.length === 0) {
      toast.error("Please record at least one question")
      return
    }
    try {
      const formData = new FormData()
      for (let i = 0; i < questions.length; i++) {
        const res = await fetch(questions[i])
        const blob = await res.blob()
        formData.append(`question${i}`, blob, `question${i}.webm`)
      }

      const rubricString = `${pointValues.join("|,,|")}|^^^|${categories
        .map((category) => {
          return `${category.name}|:::|${category.descriptions.map((description) => description || "").join("|,,|")}`
        })
        .join("|;;|")}`

      const res = await fetch(
        `https://www.server.speakeval.org/registerconfig?id=${id}&pin=${userId}&length=${
          questions.length
        }&rubric=${rubricString}&limit=${maxTime}&language=${
          selectedLanguage === "Other" ? otherLanguage : selectedLanguage
        }`,
        {
          method: "POST",
          body: formData,
        }
      )

      const response = await res.json()

      if (res.ok && !response.error) {
        toast.success("Configuration registered successfully")
      } else {
        toast.error("Failed to register configuration" + (response.error ? `: ${response.error}` : ""))
      }
    } catch (err) {
      console.error("Error registering configuration", err)
      toast.error("Error registering configuration")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-bold text-white text-center mb-8">Configure Exam</h1>

      {/* Record Questions Section */}
      <Card color="cyan">
        <h2 className="text-2xl font-bold text-white mb-4">Record Questions</h2>
        <div className="space-y-4">
          <button
            onClick={handleToggleRecording}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white transition-all duration-300 ${
              recording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            }`}
          >
            {recording ? <FaStop className="mr-2" /> : <FaMicrophone className="mr-2" />}
            <span>{recording ? "Stop Recording" : "Start Recording"}</span>
          </button>
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-cyan-500/30"
              >
                <audio controls src={question} />
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

      {/* Create Rubric Section */}
      <Card color="purple">
        <h2 className="text-2xl font-bold text-white mb-4">Create Rubric</h2>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={handleAddPointValue}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> Add Point Value
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-white text-left p-2 border-b border-purple-500/30">Category</th>
                  {pointValues.map((value, index) => (
                    <th key={index} className="text-white text-center p-2 border-b border-purple-500/30">
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, categoryIndex) => (
                  <tr key={categoryIndex}>
                    <td className="p-2 border-b border-purple-500/30">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteCategory(categoryIndex)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTimes size={12} />
                        </button>
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => handleCategoryNameChange(categoryIndex, e)}
                          placeholder="Category Name"
                          className="w-full bg-black/30 border border-purple-500/30 rounded p-2 text-white"
                        />
                      </div>
                    </td>
                    {pointValues.map((_, pointIndex) => (
                      <td key={pointIndex} className="p-2 border-b border-purple-500/30">
                        <input
                          type="text"
                          value={category.descriptions[pointIndex]}
                          onChange={(e) => handleCategoryDescriptionChange(categoryIndex, pointIndex, e)}
                          placeholder={`Description ${pointValues.length - pointIndex}`}
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

      {/* Additional Settings Section */}
      <Card color="blue">
        <h2 className="text-2xl font-bold text-white mb-4">Additional Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Answer Time Limit (seconds)</label>
            <input
              type="number"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white"
              placeholder="Enter time limit"
            />
          </div>
          <div>
            <label className="block text-white mb-2">Language</label>
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
              <label className="block text-white mb-2">Specify Language</label>
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

      {/* Register Configuration Section */}
      <Card color="pink">
        <h2 className="text-2xl font-bold text-white mb-4">Register Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Configuration Name</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-black/30 border border-pink-500/30 rounded p-2 text-white"
              maxLength={30}
              placeholder="Enter Name for Set"
            />
          </div>
          <button
            onClick={handleRegisterConfig}
            onMouseEnter={() => setHoverButton(true)}
            onMouseLeave={() => setHoverButton(false)}
            className={`w-full relative overflow-hidden text-white text-base rounded-md px-5 py-3 transition-all duration-300 ${
              hoverButton
                ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30"
                : "bg-gradient-to-r from-pink-600/50 to-purple-700/50"
            }`}
          >
            <span className="relative z-10">Register Configuration</span>
          </button>
        </div>
      </Card>
    </div>
  )
}

export default Configure
