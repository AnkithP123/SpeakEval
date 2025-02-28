import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ProfileCard from "../components/StatsCard"
import { toast } from "react-toastify"
import jsPDF from "jspdf"
import { FaArrowUp, FaArrowDown,FaEnvelope, FaSpinner } from "react-icons/fa" // Import arrow icons
import { f } from "html2pdf.js"

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
  const [rubric2, setRubric2] = useState("") // New state for rubric2
  const [pointValues, setPointValues] = useState([1, 2, 3, 4, 5]) // New state for point values
  const [fetched, setFetched] = useState(false) // New state for fetched data
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [nextRoomCode, setNextRoomCode] = useState(null)
  const [previousRoomCode, setPreviousRoomCode] = useState(null)
  const [failedEmails, setFailedEmails] = useState(new Set())
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

  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [selectedQuestionsToEmail, setSelectedQuestionsToEmail] = useState(new Set())
  const [includeResponseLink, setIncludeResponseLink] = useState(true)
  const [emailSubject, setEmailSubject] = useState("SpeakEval Exam Results")
  const [isEmailSending, setIsEmailSending] = useState(false)


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
    setIsLoading(true);
    setFetched(false)
    try {
      const response = await fetch(`https://www.server.speakeval.org/downloadall?code=${roomCode}`, {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      })

      const data = await response.json()


      if (data.error) {
        toast.error(data.error)
        return
      }

      let rubric2 = data.rubric;

      if (rubric2 && rubric2.includes('|^^^|')) {
        const pointValues = rubric2.split("|^^^|")[0].split("|,,|").map(Number);
        console.log(pointValues);
        setPointValues(pointValues);
        rubric2 = rubric2.split('|^^^|')[1];
      
      }

      setRubric(data.rubric)

      setRubric2(rubric2)

      // Parse categories and descriptions
      const [newCategories, newDescriptions] = rubric2
        ? [
            rubric2.split("|;;|").map((element) => element.split("|:::|")[0]),
            rubric2.split("|;;|").map((element) => element.split("|:::|")[1].replace("|,,,|", "\n\n")),
          ]
        : [[], []]

      console.log('Rubric2:', rubric2)

      console.log('New Categories:', newCategories)

      setCategories(newCategories)
      setDescriptions(newDescriptions)

      // Remove duplicates and sort by name
      const uniqueParticipants = data.participants
        .filter((participant, index, self) => index === self.findIndex((p) => p.name === participant.name))
        .sort((a, b) => a.name.localeCompare(b.name))

      setParticipants(uniqueParticipants)
      setFetched(true)
      setIsLoading(false)
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error("Request timed out");
      } else {
        console.error("Error fetching participants:", error)
        toast.error("Error fetching participants")
      }
      setFetched(true)
    }


    setIsLoading(false)
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
    setRubricContent(rubric2)
    setShowRubricModal(!showRubricModal)
  }


const handleGradeUpdate = (participantName, customName, grades, totalScore, comment, categories) => {
  const baseCode = roomCode.toString().slice(0, -3);
  const questionCode = customName ? Number.parseInt(baseCode + customName.substring(1).toString().padStart(3, "0")) : roomCode;

  if (customName) {
    setParticipants((prevParticipants) => {
      return prevParticipants.map((participant) => {
        if (participant.name === participantName) {
          const updatedQuestionData = new Map(participant.questionData);
          if (updatedQuestionData.has(questionCode)) {
            updatedQuestionData.set(questionCode, {
              ...updatedQuestionData.get(questionCode),
              grades,
              totalScore,
              teacherComment: comment, 
              categories
            });
          }
          return {
            ...participant,
            questionData: updatedQuestionData,
          };
        }
        return participant;
      });
    });
  } else {
    setParticipants((prevParticipants) => {
      return prevParticipants.map((participant) => {
        if (participant.name === participantName) {
          return {
            ...participant,
            grades,
            totalScore,
            teacherComment: comment,
            categories
          };
        }
        return participant;
      });
    });
  }
};

  // Sorting logic based on selected option and order
  const sortParticipants = () => {
    if (sortOption === "none") {
      return participants;
    }
    return [...participants].sort((a, b) => {
      if (sortOption === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) 
        : b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      }
      if (sortOption === "lastName") {
        const aLastName = (a.name.split(" ").length > 1 ? (a.name.split(" ").slice(-1)[0] || "") : sortOrder === "asc" ? "zzzzzz" : "aaaaaa") + " " + a.name;
        const bLastName = (b.name.split(" ").length > 1 ? (b.name.split(" ").slice(-1)[0] || "") : sortOrder === "asc" ? "zzzzzz" : "aaaaaa") + " " + b.name;
        console.log('A:', aLastName)
        console.log('B:', bLastName)

        if (!aLastName && !bLastName) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }
        if (!aLastName) return 1;
        if (!bLastName) return -1;
        return sortOrder === "asc" 
      ? aLastName.localeCompare(bLastName, undefined, { sensitivity: 'base' }) 
      : bLastName.localeCompare(aLastName, undefined, { sensitivity: 'base' });
      }
      if (sortOption === "totalScore") {
      console.log('Sorting by total score:', a, b);
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

  // Download or print report based on user choice
  const handleDownloadReport = (reportOption) => {
    if (!participants.length) {
        toast.error("No data available for report generation.");
        return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Grading Report", 105, 15, null, null, "center");
    doc.setFontSize(12);

    let yOffset = 25;

    // Calculate column widths
    const maxNameLength = Math.max(...participants.map(p => p.name.length));
    const nameColumnWidth = Math.max(25, maxNameLength * 2.5);
    const startX = 15;
    const startY = yOffset;
    const pageWidth = doc.internal.pageSize.getWidth();
    const remainingWidth = pageWidth - startX - nameColumnWidth - 15; // 15 for right margin
    const cellWidth = remainingWidth / (showByPerson ? questionData.questions.length + 1 : 1);
    const cellHeight = 10;

    // Draw header row with questions
    doc.setFont("helvetica", "bold");
    doc.text("Student", startX, startY + cellHeight / 2, { baseline: "middle" });
    if (showByPerson) {
      questionData.questions.forEach((_, qIndex) => {
          doc.text(`Q${qIndex + 1}`, startX + nameColumnWidth + (qIndex + 1) * cellWidth, startY + cellHeight / 2, { baseline: "middle", align: "center" });
      });
    } else {
      doc.text(`Q${questionData.currentIndex}`, startX + nameColumnWidth + cellWidth, startY + cellHeight / 2, { baseline: "middle", align: "center" });
    }
    if (showByPerson)
      doc.text("Total", startX + nameColumnWidth + (showByPerson ? questionData.questions.length + 1 : 1) * cellWidth, startY + cellHeight / 2, { baseline: "middle", align: "center" });

    doc.setFont("helvetica", "plain");
    // Draw participant rows with grades
    sortParticipants().forEach((participant, pIndex) => {
        const y = startY + (pIndex + 1) * cellHeight;
        doc.text(participant.name, startX, y + cellHeight / 2, { baseline: "middle" });

        if (showByPerson) {
          let totalScore = 0;
          questionData.questions.forEach((questionCode, qIndex) => {
              const questionDataEntry = participant.questionData ? participant.questionData.get(questionCode) : null;
              const score = questionDataEntry && (questionDataEntry.totalScore || questionDataEntry.totalScore == 0)? questionDataEntry.totalScore : "N/A";
              if (score > 0)
                totalScore += score;
              doc.text(`${score}`, startX + nameColumnWidth + (qIndex + 1) * cellWidth, y + cellHeight / 2, { baseline: "middle", align: "center" });
          });
          doc.text(`${totalScore}`, startX + nameColumnWidth + (showByPerson ? questionData.questions.length + 1: 1) * cellWidth, y + cellHeight / 2, { baseline: "middle", align: "center" });
        } else {
          const score = participant.totalScore || participant.totalScore == 0 ? participant.totalScore : "N/A";
          doc.text(`${score}`, startX + nameColumnWidth + cellWidth, y + cellHeight / 2, { baseline: "middle", align: "center" });
        }
    });

    yOffset += (participants.length + 1) * cellHeight + 10;

    // Add a page break after the roster
    doc.addPage();
    yOffset = 25;

    if (showByPerson) {
      sortParticipants().forEach((participant, pIndex) => {
        doc.setFont("helvetica", "bold");
        doc.text(`Student: ${participant.name}`, 15, yOffset);
        yOffset += 6;

        questionData.questions.forEach((questionCode, qIndex) => {
          const questionDataEntry = participant.questionData
            ? participant.questionData.get(questionCode)
            : null;

          if (questionDataEntry) {
            doc.setFont("helvetica", "normal");
            const questionText = `Q${qIndex + 1}: ${questionDataEntry.questionText || "No question available"}`;
            const wrappedQuestionText = doc.splitTextToSize(questionText, 180);
            doc.text(wrappedQuestionText, 15, yOffset);
            yOffset += wrappedQuestionText.length * 5;

            const splitText = doc.splitTextToSize(`Transcript: ${questionDataEntry.transcription || "No response available"}`, 180);
            doc.text(splitText, 15, yOffset);
            yOffset += splitText.length * 5;

            doc.text(`Score: ${questionDataEntry.totalScore || "N/A"}`, 15, yOffset);
            yOffset += 5;

            categories.forEach((category, cIndex) => {
              const score = questionDataEntry.grades?.[cIndex] ?? "N/A";
              doc.text(`${category}: ${score}`, 20, yOffset);
              yOffset += 4;
            });

            doc.text(`Teacher Comment: ${questionDataEntry.teacherComment || "No comment"}`, 15, yOffset);
            yOffset += 6;

            if (yOffset > 270) {
              doc.addPage();
              yOffset = 25;
            }
          }
        });

        if (pIndex < participants.length - 1) {
          yOffset += 25;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 25;
          }
        }
      });
    } else {
        doc.setFont("helvetica", "bold");
        doc.text(`Question #${questionData.currentIndex}`, 15, yOffset);
        yOffset += 8;

        sortParticipants().forEach((participant, index) => {
            doc.setFont("helvetica", "bold");
            doc.text(`Student: ${participant.name}`, 15, yOffset);
            yOffset += 6;

            doc.setFont("helvetica", "normal");
            doc.text(`Score: ${participant.totalScore || participant.totalScore == 0 ? participant.totalScore : "N/A"}`, 15, yOffset);
            yOffset += 5;

            categories.forEach((category, cIndex) => {
                const score = participant.grades?.[cIndex] ?? "N/A";
                doc.text(`${category}: ${score}`, 20, yOffset);
                yOffset += 4;
            });

            doc.text(`Teacher Comment: ${participant.teacherComment || "No comment"}`, 15, yOffset);
            yOffset += 6;

            if (yOffset > 270 && index < participants.length - 1) {
                doc.addPage();
                yOffset = 25;
            }
        });
    }

    if (reportOption === "download") {
        doc.save("grading_report.pdf");
    } else if (reportOption === "print") {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
    } else {
        toast.error('Invalid choice. Please select "download" or "print".');
    }
};

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

  const handleSendBulkEmail = async () => {
    if (selectedQuestionsToEmail.size === 0) {
      toast.error("Please select at least one question to send")
      return
    }
  
    try {
      setIsEmailSending(true)
      setFailedEmails(new Set()) 
      const baseExamCode = roomCode.toString().slice(0, -3)
      
      const emailData = participants.map(participant => ({
        studentName: participant.name,
        grades: Array.from(selectedQuestionsToEmail).map(questionCode => {
          let gradeData
          if (showByPerson) {
            const questionData = participant.questionData?.get(parseInt(questionCode))
            if (questionData) {
              gradeData = {
                questionNumber: parseInt(questionCode.toString().slice(-3)),
                question: questionData.questionText || "Question not available",
                transcription: questionData.transcription || "No transcription available",
                totalScore: questionData.totalScore,
                grades: questionData.grades,
                categories: questionData.categories,
                teacherComment: questionData.teacherComment,
              }
            }
          } else {
            gradeData = {
              questionNumber: questionData.currentIndex,
              question: participant.questionText || "Question not available",
              transcription: participant.transcription || "No transcription available",
              totalScore: participant.totalScore,
              grades: participant.grades,
              categories: participant.categories,
              teacherComment: participant.teacherComment,
            }
          }
          return gradeData
        })
      }))
  
      const response = await fetch('https://www.server.speakeval.org/send_bulk_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examCode: baseExamCode,
          emailData,
          includeResponseLink,
          subject: emailSubject,
          pin: localStorage.getItem('token')
        })
      })
  
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
  
      // Handle failed emails
      if (data.results?.failed?.length > 0) {
        const failedStudents = new Set(data.results.failed.map(f => f.student))
        
        setFailedEmails(prevFailedEmails => {
          const newFailedEmails = new Set(failedStudents)
          console.log("Updating failed emails set:", newFailedEmails)
          return newFailedEmails
        })
  
        const errorToast = (
          <div>
            <div className="font-bold mb-2">Failed to send some emails:</div>
            <div className="max-h-32 overflow-y-auto">
              {data.results.failed.map((failure, idx) => (
                <div key={idx} className="text-sm">
                  {failure.student}: {failure.error}
                </div>
              ))}
            </div>
          </div>
        )
        
        toast.error(errorToast, { 
          autoClose: 5000,
          onOpen: () => {
            console.log("Current failed emails after update:", failedStudents)
          }
        })
      }
  

      if (data.summary.successful > 0) {
        toast.success(`Successfully sent ${data.summary.successful} emails`)
      }
  
      // Show warning if no emails were sent
      if (data.summary.successful === 0 && data.summary.failed === 0) {
        toast.warning("No emails were sent - no valid recipients found")
      }
  

      if (data.summary.failed === 0) {
        setShowBulkEmailModal(false)
        setSelectedQuestionsToEmail(new Set())
      }
    } catch (error) {
      console.error("Error sending emails:", error)
      toast.error(`Failed to send emails: ${error.message}`)
    } finally {
      setIsEmailSending(false)
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

    console.log("participants: ", participants)

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Display name modal */}
      {showDisplayNameInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div
            ref={displayNameInputRef}
            className="relative overflow-hidden bg-black/60 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Rename this exam</h2>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={async () => {
                  await handleDisplayNameSubmit()
                  setShowDisplayNameInput(false)
                }}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!showDisplayNameInput && (
        <div className="relative flex flex-col items-center min-h-screen" style={{ fontFamily: "Montserrat" }}>
          {/* Header controls */}
          <div className="w-full px-6 py-4 bg-black/40 backdrop-blur-md border-b border-cyan-500/30">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-4">
                <button
                  onClick={toggleViewMode}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
                >
                  {showByPerson ? "Show by Question" : "Show by Person"}
                </button>

                <button
                  onClick={toggleSortOrder}
                  className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                >
                  {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
                </button>
                <select
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 cursor-pointer"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="name">Sort by Name</option>
                  <option value="lastName">Sort by Last Name</option>
                </select>

                <button
                  onClick={() => setShowDisplayNameInput(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                >
                  Set Display Name
                </button>
                <button
                  onClick={() => setShowRubricModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Show Rubric
                </button>
                <select
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 cursor-pointer"
                  value={reportOption}
                  onChange={(e) => {
                    handleDownloadReport(e.target.value)
                  }}
                >
                  <option value="">Grade Report</option>
                  <option value="download">Download</option>
                  <option value="print">Print</option>
                </select>
                <button
                  onClick={() => setShowBulkEmailModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 flex items-center"
                  disabled={isEmailSending}
                >
                  <FaEnvelope className="mr-2" />
                  {isEmailSending ? "Sending..." : "Send Emails"}
                </button>
            </div>
          </div>

          {/* Question navigation */}
          <div className="w-full text-center py-12">
            <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              Grading: {roomCode.toString().slice(0, -3)} (Question #{questionData.currentIndex})
            </h1>
            {!showByPerson && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleNavigateQuestion("previous")}
                  disabled={questionData.currentIndex === 1}
                  className={`px-6 py-2 rounded-lg shadow-lg transition-all duration-300 ${
                    questionData.currentIndex === 1
                      ? "bg-gray-600/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  }`}
                >
                  Previous Question
                </button>
                <button
                  onClick={() => handleNavigateQuestion("next")}
                  disabled={questionData.currentIndex === questionData.totalQuestions}
                  className={`px-6 py-2 rounded-lg shadow-lg transition-all duration-300 ${
                    questionData.currentIndex === questionData.totalQuestions
                      ? "bg-gray-600/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  }`}
                >
                  Next Question
                </button>
              </div>
            )}
          </div>

          {/* Profile cards grid */}
          <div className="w-full px-6 pb-12">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-xl font-semibold text-white">Loading...</div>
              </div>
            ) : showByPerson ? (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-xl">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-cyan-500/30">
                        <th className="py-4 px-6 text-left text-sm font-semibold text-white">Student</th>
                        {questionData.questions.map((_, index) => (
                          <th key={index} className="py-4 px-6 text-left text-sm font-semibold text-white">
                            Question {index + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortParticipants().map((participant, index) => (
                        <tr key={index} className="border-b border-cyan-500/10">
                          <td className="py-4 px-6 text-white">{participant.name}</td>
                          {questionData.questions.map((questionCode, qIndex) => {
                            const questionData = participant.questionData
                              ? participant.questionData.get(questionCode)
                              : null
                            return (
                              <td key={qIndex} className="py-4 px-6">
                                {questionData ? (
                                  <ProfileCard
                                    text={questionData.transcription}
                                    rubric={rubric}
                                    rubric2={rubric2}
                                    audio={questionData.audio}
                                    question={questionData.questionText}
                                    questionBase64={questionData.question}
                                    index={questionData.index}
                                    name={participant.name}
                                    code={questionCode}
                                    onGradeUpdate={handleGradeUpdate}
                                    customName={`Q${qIndex + 1}`}
                                    isRed={failedEmails.has(participant.name)}
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortParticipants().map((participant, index) => (
                  <ProfileCard
                    key={index}
                    text={participant.transcription}
                    rubric={rubric}
                    rubric2={rubric2}
                    audio={participant.audio}
                    question={participant.questionText}
                    questionBase64={participant.question}
                    index={participant.index}
                    name={participant.name}
                    code={roomCode}
                    onGradeUpdate={handleGradeUpdate}
                    isRed={failedEmails.has(participant.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rubric modal */}
      {showRubricModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative bg-black/60 rounded-2xl p-8 shadow-xl border border-cyan-500/30 w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none rounded-2xl" />
            <h2 className="text-2xl font-bold mb-6 text-white relative z-10">Rubric</h2>
            {participants.length > 0 ? (
              <div className="relative z-10 overflow-x-auto">
                <table className="min-w-full border border-cyan-500/30 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-cyan-500/10">
                      <th className="py-3 px-4 border-b border-cyan-500/30 text-white">Category</th>
                      {pointValues.map((value, index) => (
                        <th key={index} className="py-3 px-4 border-b border-cyan-500/30 text-white">
                          {value}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => {
                      const descriptionParts = descriptions[index] ? descriptions[index].split("|,,|") : []
                      return (
                        <tr key={index} className="border-b border-cyan-500/30">
                          <td className="py-3 px-4 text-white">{category}</td>
                          {descriptionParts.map((part, partIndex) => (
                            <td key={partIndex} className="py-3 px-4 text-gray-300">
                              {part || "No description available"}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white relative z-10">No rubric available.</p>
            )}
            <button
              onClick={() => setShowRubricModal(false)}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 relative z-10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative bg-black/60 rounded-2xl p-8 shadow-xl border border-cyan-500/30 w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none rounded-2xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-white">Send Grade Emails</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Select Questions to Include:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-cyan-500/30 rounded-lg p-4 bg-black/30">
                  {showByPerson ? (
                    questionData.questions.map((questionCode, index) => {
                      const isGraded = participants.some((p) => {
                        const qData = p.questionData?.get(questionCode)
                        return qData?.totalScore !== undefined
                      })

                      return (
                        <div key={questionCode} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`question-${questionCode}`}
                            checked={selectedQuestionsToEmail.has(questionCode)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedQuestionsToEmail)
                              if (e.target.checked) {
                                newSelected.add(questionCode)
                              } else {
                                newSelected.delete(questionCode)
                              }
                              setSelectedQuestionsToEmail(newSelected)
                            }}
                            className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                          />
                          <label htmlFor={`question-${questionCode}`} className="text-white">
                            Question {index + 1}
                            <span
                              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                isGraded
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {isGraded ? "Graded" : "Not Graded"}
                            </span>
                          </label>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`question-${roomCode}`}
                        checked={selectedQuestionsToEmail.has(roomCode)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedQuestionsToEmail)
                          if (e.target.checked) {
                            newSelected.add(roomCode)
                          } else {
                            newSelected.delete(roomCode)
                          }
                          setSelectedQuestionsToEmail(newSelected)
                        }}
                        className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor={`question-${roomCode}`} className="text-white">
                        Current Question (#{questionData.currentIndex})
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            participants.some((p) => p.totalScore !== undefined)
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          }`}
                        >
                          {participants.some((p) => p.totalScore !== undefined) ? "Graded" : "Not Graded"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeResponseLink}
                    onChange={(e) => setIncludeResponseLink(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-white">Include links for students to review their responses</span>
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowBulkEmailModal(false)
                    setSelectedQuestionsToEmail(new Set())
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
                  disabled={isEmailSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkEmail}
                  className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 flex items-center ${
                    isEmailSending ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Emails"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherPortalRoom

