import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileCard from '../components/StatsCard';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Import arrow icons

function TeacherPortalRoom({ initialRoomCode }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || useParams().roomCode); // Track the room code as state
  const [participants, setParticipants] = useState({ members: [] });
  const [gradesReport, setGradesReport] = useState(''); // For storing the report data
  const [reportOption, setReportOption] = useState(''); // For managing the dropdown selection
  const [sortOption, setSortOption] = useState('name'); // New state for sorting options
  const [sortOrder, setSortOrder] = useState('asc'); // New state for sorting order (ascending/descending)
  const [showByPerson, setShowByPerson] = useState(false); // New state for 'Show by person' toggle
  const [allQuestions, setAllQuestions] = useState([]); // State to store all questions
  const [showRubricModal, setShowRubricModal] = useState(false); // New state for rubric modal visibility
  const [rubricContent, setRubricContent] = useState(null); // New state for rubric content
  const [categories, setCategories] = useState([]); // New state for categories
  const [descriptions, setDescriptions] = useState(() => {
    const savedDescriptions = localStorage.getItem('descriptions');
    return savedDescriptions ? JSON.parse(savedDescriptions) : [];
  }); // New state for descriptions

  useEffect(() => {
    localStorage.setItem('descriptions', JSON.stringify(descriptions));
  }, [descriptions]);
  const navigate = useNavigate();

  const fetchParticipants = async () => {
    try {
      const responsev2 = await fetch(`https://www.server.speakeval.org/checkcompleted?code=${roomCode}`);
      const data2 = await responsev2.json();
      let obj = { members: [] };
      if (data2.error) {
        toast.error(data2.error);
        return navigate('/');
      }

      const response = await fetch(`https://www.server.speakeval.org/checkjoined?code=${roomCode}`);
      const data = await response.json();

      obj.members = data2.members.map((member) => {
        if (participants.members.find((participant) => participant.name === member) && (participants.members.find((participant) => participant.name === member).completed)) {
          return null;
        }
        return {
          name: member,
          completed: true,
          grades: {},
          totalScore: 0,
          categories: []
        };
      }).filter(member => member !== null);

      const activeParticipants = data.members;

      activeParticipants.forEach((participant) => {
        if (!obj.members.find((member) => member.name === participant) && !participants.members.find((member) => member.name === participant)) {
          obj.members.push({
            name: participant,
            completed: false
          });
        }
      });

      participants.members.forEach((participant) => {
        if (!obj.members.find((member) => member.name === participant.name)) {
          obj.members.push(participant);
        }
      });

      setParticipants(obj);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Error fetching participants');
    }
  };

  const fetchAllQuestions = async () => {
    let questions = [];
    let currentRoomCode = roomCode;
    while (currentRoomCode) {
      questions.push(currentRoomCode);
      const { next } = await fetchNextPrevious(currentRoomCode);
      currentRoomCode = next;
    }
    setAllQuestions(questions);
  };

  useEffect(() => {
    fetchParticipants();
    fetchAllQuestions();
    const intervalId = setInterval(fetchParticipants, 1000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [roomCode]); // Fetch participants when roomCode changes

  const handleNavigateQuestion = (direction) => {
    const newRoomCode = direction === 'next' ? nextRoomCode : previousRoomCode;
    if (newRoomCode) {
      navigate(`/teacher/portal/${newRoomCode}`);
    }
  };

  const toggleRubricModal = (rubric) => {
    setRubricContent(rubric);
    setShowRubricModal(!showRubricModal);
  };

  const handleGradeUpdate = (participantName, grades, totalScore, categories, descriptions) => {
    const updatedParticipants = { ...participants };
    const participant = updatedParticipants.members.find((member) => member.name === participantName);
    participant.grades = grades;
    participant.totalScore = totalScore;
    participant.categories = categories;
    participant.descriptions = descriptions;

    setCategories(categories);

    if (descriptions.length == 0)
      setDescriptions(descriptions);

    console.log(categories);
    console.log(descriptions);

    setParticipants(updatedParticipants);
  };

  // Sorting logic based on selected option and order
  const sortParticipants = () => {
    const sortedParticipants = [...participants.members];

    if (sortOption === 'name') {
      sortedParticipants.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'totalScore') {
      sortedParticipants.sort((a, b) => b.totalScore - a.totalScore);
    } else if (sortOption.startsWith('category')) {
      const categoryIndex = parseInt(sortOption.split('-')[1], 10);
      sortedParticipants.sort((a, b) => (b.grades[categoryIndex] || 0) - (a.grades[categoryIndex] || 0));
    }

    // Apply sort order (ascending/descending)
    if (sortOrder === 'desc') {
      sortedParticipants.reverse();
    }

    return sortedParticipants;
  };

  // Toggle sort order (flip-flop between ascending and descending)
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  // Create a report from the grades
  const createGradesReport = () => {
    console.log(participants.members);
    let report = 'Grading Report:\n';
    participants.members.forEach((participant) => {
      let categories = participant.categories;
      report += `${participant.name}:\n`;
      for (let i = 0; i < categories.length; i++) {
        report += `\t${categories[i]}: ${participant.grades[i]}\n`;
      }
      report += `\tTotal Score: ${participant.totalScore}\n\n`;
    });

    setGradesReport(report);
    return report;
  };

  // Download or print report based on user choice
  const handleDownloadReport = (reportOption) => {
    const report = createGradesReport();
    
    if (reportOption === 'download') {
      let categories = participants.members.length > 0 ? participants.members[0].categories : [];
      console.log('0', participants.members[0]);
      // make a pdf instead of printing
      const doc = new jsPDF();

      // Set the title and format the document
      doc.setFont('Arial', 'normal');
      doc.setFontSize(16);
      doc.text('Grading Report', 10, 10);

      // Table headings      

      let yPosition = 20;
      doc.setFontSize(12);
      doc.text('Name', 10, yPosition);
      console.log('MyCategories:', categories);
      categories.forEach((category, index) => {
        doc.text(category, 50 + (index * 30), yPosition); // Adjust X position based on index
      });
      doc.text('Total Score', 150, yPosition);

      // Add table rows for each participant
      participants.members.sort(
        (a, b) => a.name.localeCompare(b.name)
      ).forEach((participant, index) => {
        yPosition += 10; // Move down to the next line

        doc.text(participant.name, 10, yPosition);

        Object.values(participant.grades).forEach((score, scoreIndex) => {
          doc.text(String(score), 50 + (scoreIndex * 30), yPosition); // Adjust X position based on score index
        });

        doc.text(String(participant.totalScore), 150, yPosition);
      });

      // Save the PDF
      doc.save('grading_report.pdf');

    } else if (reportOption === 'print') {
      let categories = participants.members.length > 0 ? participants.members[0].categories : [];
      const printWindow = window.open('', '', 'height=600,width=800');
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
          ${
            participants.members.length > 0 ? categories.map(s => `<th>${s}</th>`).join('') : ''
          }
          <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            ${participants.members.map(participant => `
          <tr>
            <td>${participant.name}</td>
            ${Object.values(participant.grades).map(score => `<td>${score}</td>`).join('')}
            <td>${participant.totalScore}</td>
          </tr>
            `).join('')}
          </tbody>
        </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Invalid choice. Please select "download" or "print".');
    }
  };

  // Check if there is a previous question
  const hasPreviousQuestion = () => {
    return previousRoomCode !== null;
  };

  // Check if there is a next question
  const hasNextQuestion = () => {
    return nextRoomCode !== null;
  };

  const fetchNextPrevious = async (code) => {
    try {
      const response = await fetch(`https://www.server.speakeval.org/get_next_previous?code=${code}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching next/previous question:", error);
      toast.error("Could not fetch next or previous question.");
      return {};
    }
  };

  // Move to the next question by updating the room code
  const handleNextQuestion = async () => {
    if (showByPerson) return;
    const { next } = await fetchNextPrevious(roomCode);
    if (showByPerson) {
      setRoomCode(parseInt(roomCode.toString().slice(0, -3) + '001'));
    }
    if (next != null) {
      setRoomCode(next);
      setParticipants({ members: [] }); // Reset participants when changing room code
    } else {
      toast.warn("No next question available.");
    }
    if (showByPerson) {
      setRoomCode(parseInt(roomCode.toString().slice(0, -3) + '001'));
      console.log('HI');
    }
  };

  // Move to the previous question by updating the room code
  const handlePreviousQuestion = async () => {
    if (showByPerson) return;
    const { previous } = await fetchNextPrevious(roomCode);
    if (previous != null) {
      setRoomCode(previous);
      setParticipants({ members: [] }); // Reset participants when changing room code
    } else {
      toast.warn("No previous question available.");
    }
    if (showByPerson) {
      setRoomCode(parseInt(roomCode.toString().slice(0, -3) + '001'));
    }
  };

  return (
    <div className="relative flex flex-col items-center" style={{ fontFamily: "Montserrat" }}>
      {/* Participant count display */}
      <div className="absolute left-4 flex items-center space-x-4">
        <div className="bg-white text-black rounded-lg p-3 shadow-md">
          Participants: {participants.members.length}
        </div>
        <button
          onClick={() => {
            setShowByPerson(!showByPerson);
            if (!showByPerson) setRoomCode(parseInt(roomCode.toString().slice(0, -3) + '001'));
  
            setTimeout(() => {
              if (roomCode.toString().slice(-3) !== '001') {
                setRoomCode(parseInt(roomCode.toString().slice(0, -3) + '001'));
              }
            }, 5000);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600"
        >
          {showByPerson ? 'Show by Question' : 'Show by Person'}
        </button>
      </div>
  
      {/* Grade report dropdown */}
      <div className="absolute right-4 flex items-center space-x-4">
        <select
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
          style={{ height: '150%' }}
          value={reportOption}
          onChange={(e) => handleDownloadReport(e.target.value)}
        >
          <option value="">Grade Report</option>
          <option value="download">Download</option>
          <option value="print">Print</option>
        </select>
      </div>
  
      {/* Rubric popup button */}
      <div className="absolute right-20 flex items-center space-x-4 mr-[8%]">
        <button
          onClick={() => setShowRubricModal(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600"
        >
          Show Rubric
        </button>
      </div>

      {/* Rubric modal */}
      {showRubricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-[90%] max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">Rubric</h2>
            {participants.members.length > 0 && participants.members[0].categories?.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-300">Category</th>
                    <th className="py-2 px-4 border-b border-gray-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b border-gray-300">{category}</td>
                      <td className="py-2 px-4 border-b border-gray-300">
                        {descriptions[index] || 'No description available'}
                      </td>
                    </tr>
                  ))}
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
  
      {/* Room code display */}
      <div className="flex items-center justify-center w-screen py-[50px]">
        <span className="text-6xl font-bold">
          Grading: {roomCode.toString().slice(0, -3)} (Question #{roomCode.toString().slice(-3)})
        </span>
      </div>
  
      {/* Navigation buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handlePreviousQuestion}
          className={`px-4 py-2 rounded-lg shadow-md ${
            showByPerson ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
          disabled={showByPerson}
        >
          Previous Question
        </button>
        <button
          onClick={handleNextQuestion}
          className={`px-4 py-2 rounded-lg shadow-md ${
            showByPerson ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
          disabled={showByPerson}
        >
          Next Question
        </button>
      </div>
  
      {/* Profile cards for participants */}
      <div className="flex flex-wrap justify-center mt-8 mb-8">
        {showByPerson ? (
          <div>
            <table className="min-w-full bg-white border border-gray-300">
              <tbody>
                {participants.members.map((participant, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b border-gray-300">{participant.name}</td>
                    {allQuestions.map((question, qIndex) => (
                      <td key={qIndex} className="py-2 px-4 border-b border-gray-300">
                        <ProfileCard
                          name={participant}
                          code={question}
                          onGradeUpdate={handleGradeUpdate}
                          customName={'Question ' + (qIndex + 1)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          sortParticipants().map((participant, index) => (
            <ProfileCard
              key={index}
              name={participant}
              code={roomCode}
              onGradeUpdate={handleGradeUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}  
export default TeacherPortalRoom;