import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ProfileCard from "../components/StatsCard"
import { toast } from "react-toastify"
import jsPDF from "jspdf"
import { FaArrowUp, FaArrowDown } from "react-icons/fa" // Import arrow icons

function TeacherPortalRoom({ initialRoomCode, pin }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || useParams().roomCode) // Track the room code as state
  const [participants, setParticipants] = useState([])
  const [gradesReport, setGradesReport] = useState("") // For storing the report data
  const [reportOption, setReportOption] = useState("") // For managing the dropdown selection
  const [sortOption, setSortOption] = useState("name") // New state for sorting options
  const [sortOrder, setSortOrder] = useState("asc") // New state for sorting order (ascending/descending)
  const [showByPerson, setShowByPerson] = useState(false) // New state for 'Show by person' toggle
  const [allQuestions, setAllQuestions] = useState([]) // State to store all questions
  const [showRubricModal, setShowRubricModal] = useState(false) // New state for rubric modal visibility
  const [rubricContent, setRubricContent] = useState(null) // New state for rubric content
  const [rubric, setRubric] = useState("") // New state for rubric
  const [fetched, setFetched] = useState(false) // New state for fetched data
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [nextRoomCode, setNextRoomCode] = useState(null)
  const [previousRoomCode, setPreviousRoomCode] = useState(null)
  const [categories, setCategories] = useState([]) // New state for categories
  const [descriptions, setDescriptions] = useState(() => {
    const savedDescriptions = localStorage.getItem("descriptions")
    return savedDescriptions ? JSON.parse(savedDescriptions) : []
  }) // New state for descriptions
  const [questionData, setQuestionData] = useState({
    currentIndex: 1,
    totalQuestions: 0,
    questions: [],
  })
  const [isLoading, setIsLoading] = useState(false) // New loading state
  const displayNameInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem("descriptions", JSON.stringify(descriptions))
  }, [descriptions])

  useEffect(() => {
    const initializeRoom = async () => {
      await fetchTotalQuestions()
      await fetchParticipants()
    }
    initializeRoom()
  }, [roomCode])

  const fetchTotalQuestions = async () => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/get_num_questions?code=${roomCode}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      const baseCode = roomCode.toString().slice(0, -3)
      const questions = Array.from({ length: data.questions }, (_, i) =>
        Number.parseInt(baseCode + (i + 1).toString().padStart(3, "0")),
      )

      setQuestionData({
        currentIndex: Number.parseInt(roomCode.toString().slice(-3)),
        totalQuestions: data.questions,
        questions,
      })
    } catch (error) {
      console.error("Error fetching total questions:", error)
      toast.error("Error fetching question information")
    }
  }

  const fetchParticipants = async () => {
    setFetched(false)
    try {
      const response = await fetch(`https://www.server.speakeval.org/downloadall?code=${roomCode}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      let rubric2 = data.rubric;

      if (rubric2 && rubric2.includes('|^^^|')) {
        rubric2 = rubric2.split('|^^^|')[1];
      }

      setRubric(rubric2)

      // Parse categories and descriptions
      const [newCategories, newDescriptions] = rubric2
        ? [
            rubric2.split("|;;|").map((element) => element.split("|:::|")[0]),
            rubric2.split("|;;|").map((element) => element.split("|:::|")[1].replace("|,,,|", "\n\n")),
          ]
        : [[], []]

      setCategories(newCategories)
      setDescriptions(newDescriptions)

      // Remove duplicates and sort by name
      const uniqueParticipants = data.participants
        .filter((participant, index, self) => index === self.findIndex((p) => p.name === participant.name))
        .sort((a, b) => a.name.localeCompare(b.name))

      setParticipants(uniqueParticipants)
      setFetched(true)
    } catch (error) {
      console.error("Error fetching participants:", error)
      toast.error("Error fetching participants")
      setFetched(true)
    }
  }

  const fetchQuestionData = async (questionCode) => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/downloadall?code=${questionCode}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error fetching question data:", error)
      toast.error("Error fetching question data")
      return null
    }
  }

  const handleNavigateQuestion = async (direction) => {
    if (showByPerson) return

    setIsLoading(true)
    const currentIndex = questionData.currentIndex
    const newIndex =
      direction === "next" ? Math.min(currentIndex + 1, questionData.totalQuestions) : Math.max(currentIndex - 1, 1)

    if (newIndex !== currentIndex) {
      const baseCode = roomCode.toString().slice(0, -3)
      const newCode = Number.parseInt(baseCode + newIndex.toString().padStart(3, "0"))
      setRoomCode(newCode)
      await fetchParticipants()
    } else {
      toast.warn(`No ${direction} question available.`)
    }
    setIsLoading(false)
  }

  const toggleRubricModal = (rubric) => {
    setRubricContent(rubric)
    setShowRubricModal(!showRubricModal)
  }

  const handleGradeUpdate = (participantName, grades, totalScore, categories, descriptions) => {
    setParticipants((prevParticipants) => {
      return prevParticipants.map((participant) => {
        if (participant.name === participantName) {
          return {
            ...participant,
            grades,
            totalScore,
          }
        }
        return participant
      })
    })

    setCategories(categories)
    setDescriptions(descriptions)
  }

  // Sorting logic based on selected option and order
  const sortParticipants = () => {
    return [...participants].sort((a, b) => {
      if (sortOption === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortOption === "totalScore") {
        return sortOrder === "asc" ? a.totalScore - b.totalScore : b.totalScore - a.totalScore
      }
      if (sortOption.startsWith("category")) {
        const categoryIndex = Number.parseInt(sortOption.split("-")[1], 10)
        return sortOrder === "asc"
          ? (a.grades[categoryIndex] || 0) - (b.grades[categoryIndex] || 0)
          : (b.grades[categoryIndex] || 0) - (a.grades[categoryIndex] || 0)
      }
      return 0
    })
  }

  // Toggle sort order (flip-flop between ascending and descending)
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
  }

  // Create a report from the grades
  const createGradesReport = () => {
    let report = "Grading Report:\n"
    participants.forEach((participant) => {
      const categories = participant.categories
      report += `${participant.name}:\n`
      for (let i = 0; i < categories.length; i++) {
        report += `\t${categories[i]}: ${participant.grades[i]}\n`
      }
      report += `\tTotal Score: ${participant.totalScore}\n\n`
    })

    setGradesReport(report)
    return report
  }

  // Download or print report based on user choice
  const handleDownloadReport = (reportOption) => {
    const report = createGradesReport()

    if (reportOption === "download") {
      const categories = participants.length > 0 ? participants[0].categories : []
      // make a pdf instead of printing
      const doc = new jsPDF()

      // Set the title and format the document
      doc.setFont("Arial", "normal")
      doc.setFontSize(16)
      doc.text("Grading Report", 10, 10)

      // Table headings

      let yPosition = 20
      doc.setFontSize(12)
      doc.text("Name", 10, yPosition)
      categories.forEach((category, index) => {
        doc.text(category, 50 + index * 30, yPosition) // Adjust X position based on index
      })
      doc.text("Total Score", 150, yPosition)

      // Add table rows for each participant
      participants
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((participant, index) => {
          yPosition += 10 // Move down to the next line

          doc.text(participant.name, 10, yPosition)

          Object.values(participant.grades).forEach((score, scoreIndex) => {
            doc.text(String(score), 50 + scoreIndex * 30, yPosition) // Adjust X position based on score index
          })

          doc.text(String(participant.totalScore), 150, yPosition)
        })

      // Save the PDF
      doc.save("grading_report.pdf")
    } else if (reportOption === "print") {
      const categories = participants.length > 0 ? participants[0].categories : []
      const printWindow = window.open("", "", "height=600,width=800")
      printWindow.document.write(`
        <html>
          <head>
        <title>Grading Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #ddd;
          }
        </style>
          </head>
          <body>
        <h2>Grading Report</h2>
        <table>
          <thead>
            <tr>
          <th>Name</th>
          ${participants.length > 0 ? categories.map((s) => `<th>${s}</th>`).join("") : ""}
          <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            ${participants
              .map(
                (participant) => `
          <tr>
            <td>${participant.name}</td>
            ${Object.values(participant.grades)
              .map((score) => `<td>${score}</td>`)
              .join("")}
            <td>${participant.totalScore}</td>
          </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    } else {
      toast.error('Invalid choice. Please select "download" or "print".')
    }
  }

  const fetchNextPrevious = async (code) => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/get_next_previous?code=${code}`)
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
        return {}
      }
      setNextRoomCode(data.next)
      setPreviousRoomCode(data.previous)
    } catch (error) {
      console.error("Error fetching next/previous question:", error)
      toast.error("Could not fetch next or previous question.")
      return {}
    }
  }

  const handleNextQuestion = () => handleNavigateQuestion("next")
  const handlePreviousQuestion = () => handleNavigateQuestion("previous")

  const toggleViewMode = async () => {
    setIsLoading(true)
    const newShowByPerson = !showByPerson
    setShowByPerson(newShowByPerson)

    if (newShowByPerson) {
      const baseCode = roomCode.toString().slice(0, -3)
      const firstQuestionCode = Number.parseInt(baseCode + "001")
      setRoomCode(firstQuestionCode)

      // Fetch data for all questions
      const allData = await Promise.all(
        questionData.questions.map(async (qCode) => {
          const data = await fetchQuestionData(qCode)
          return {
            code: qCode,
            participants: data ? data.participants : [],
          }
        }),
      )

      // Organize data by participant
      const participantMap = new Map()
      allData.forEach(({ code, participants }) => {
        participants.forEach((participant) => {
          if (!participantMap.has(participant.name)) {
            participantMap.set(participant.name, {
              name: participant.name,
              questionData: new Map(),
            })
          }
          participantMap.get(participant.name).questionData.set(code, participant)
        })
      })

      setParticipants(Array.from(participantMap.values()))
    } else {
      await fetchParticipants()
    }

    setIsLoading(false)
  }

  const handleDisplayNameSubmit = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/add_display?code=${roomCode}&pin=${pin}&display=${displayName}`,
      )
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(data.message ? data.message : "Display name was set")
        setShowDisplayNameInput(false)
      }
    } catch (error) {
      console.error("Error setting display name:", error)
      toast.error("Error setting display name")
    }
  }

  return (
    <div>
      {/* Display name modal */}
      {showDisplayNameInput && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={displayNameInputRef} className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">Rename this exam</h2>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border p-2 rounded w-full mb-4"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={async () => {
                  await handleDisplayNameSubmit()
                  setShowDisplayNameInput(false)
                }}
                className="bg-green-500 text-white rounded-lg p-2 shadow-md hover:bg-green-600"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="bg-gray-500 text-white rounded-lg p-2 shadow-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-col items-center" style={{ fontFamily: "Montserrat" }}>
        {/* Header controls */}
        <div className="w-full px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white text-black rounded-lg p-3 shadow-md">
              {fetched ? `Participants: ${participants.length}` : "Loading..."}
            </div>
            <button
              onClick={toggleViewMode}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600"
            >
              {showByPerson ? "Show by Question" : "Show by Person"}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDisplayNameInput(true)}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600"
            >
              Set Display Name
            </button>
            <button
              onClick={() => setShowRubricModal(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600"
            >
              Show Rubric
            </button>
            <select
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
              value={reportOption}
              onChange={(e) => {
                setReportOption(e.target.value)
                handleDownloadReport(e.target.value)
              }}
            >
              <option value="">Grade Report</option>
              <option value="download">Download</option>
              <option value="print">Print</option>
            </select>
          </div>
        </div>

        {/* Question navigation */}
        <div className="w-full text-center py-8">
          <h1 className="text-4xl font-bold mb-4">
            Grading: {roomCode.toString().slice(0, -3)} (Question #{questionData.currentIndex})
          </h1>
          {!showByPerson && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleNavigateQuestion("previous")}
                disabled={questionData.currentIndex === 1}
                className={`px-4 py-2 rounded-lg shadow-md ${
                  questionData.currentIndex === 1
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                }`}
              >
                Previous Question
              </button>
              <button
                onClick={() => handleNavigateQuestion("next")}
                disabled={questionData.currentIndex === questionData.totalQuestions}
                className={`px-4 py-2 rounded-lg shadow-md ${
                  questionData.currentIndex === questionData.totalQuestions
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                }`}
              >
                Next Question
              </button>
            </div>
          )}
        </div>

        {/* Profile cards grid */}
        <div className="w-full px-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-xl font-semibold">Loading...</div>
            </div>
          ) : showByPerson ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-300">Student</th>
                    {questionData.questions.map((_, index) => (
                      <th key={index} className="py-2 px-4 border-b border-gray-300">
                        Question {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortParticipants().map((participant, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b border-gray-300">{participant.name}</td>
                      {questionData.questions.map((questionCode, qIndex) => {
                        const questionData = participant.questionData ? participant.questionData.get(questionCode) : null
                        return (
                          <td key={qIndex} className={`py-2 px-4 border-b border-gray-300 ${questionData ? "" : "text-center"}`}>
                            {questionData ? (
                              <ProfileCard
                                text={questionData.transcription}
                                rubric={rubric}
                                audio={questionData.audio}
                                question={questionData.questionText}
                                questionBase64={questionData.question}
                                index={questionData.index}
                                name={participant.name}
                                code={questionCode}
                                onGradeUpdate={handleGradeUpdate}
                                customName={`Q${qIndex + 1}`}
                              />
                            ) : (
                              <div className="text-gray-400">No submission</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortParticipants().map((participant, index) => (
                <ProfileCard
                  key={index}
                  text={participant.transcription}
                  rubric={rubric}
                  audio={participant.audio}
                  question={participant.questionText}
                  questionBase64={participant.question}
                  index={participant.index}
                  name={participant.name}
                  code={roomCode}
                  onGradeUpdate={handleGradeUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Rubric modal */}
      {showRubricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-[90%]">
            <h2 className="text-2xl font-bold mb-4">Rubric</h2>
            {participants.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-300">Category</th>
                    <th className="py-2 px-4 border-b border-gray-300">1</th>
                    <th className="py-2 px-4 border-b border-gray-300">2</th>
                    <th className="py-2 px-4 border-b border-gray-300">3</th>
                    <th className="py-2 px-4 border-b border-gray-300">4</th>
                    <th className="py-2 px-4 border-b border-gray-300">5</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => {
                    const descriptionParts = descriptions[index] ? descriptions[index].split("|,,|") : []
                    return (
                      <tr key={index}>
                        <td className="py-2 px-4 border-b border-gray-300">{category}</td>
                        {descriptionParts.map((part, partIndex) => (
                          <td key={partIndex} className="py-2 px-4 border-b border-gray-300">
                            {part || "No description available"}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p>No rubric available.</p>
            )}
            <button
              onClick={() => setShowRubricModal(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default TeacherPortalRoom

