import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileCard from '../components/StatsCard';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Import arrow icons

function TeacherPortalRoom({ roomCode }) {
  const [participants, setParticipants] = useState({ members: [] });
  const [gradesReport, setGradesReport] = useState(''); // For storing the report data
  const [reportOption, setReportOption] = useState(''); // For managing the dropdown selection
  const [sortOption, setSortOption] = useState('name'); // New state for sorting options
  const [sortOrder, setSortOrder] = useState('asc'); // New state for sorting order (ascending/descending)
  const navigate = useNavigate();
  roomCode = roomCode || useParams().roomCode;

  const fetchParticipants = async () => {
    try {
      const responsev2 = await fetch(`https://backend-4abv.onrender.com/checkcompleted?code=${roomCode}`);
      const data2 = await responsev2.json();
      let obj = { members: [] };
      if (data2.error) {
        toast.error(data2.error);
        return navigate('/');
      }

      const response = await fetch(`https://backend-4abv.onrender.com/checkjoined?code=${roomCode}`);
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

      console.log(obj);

      participants.members = obj.members;

    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Error fetching participants');
    }
  };

  useEffect(() => {
    fetchParticipants();
    const intervalId = setInterval(fetchParticipants, 1000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [roomCode]);

  const handleGradeUpdate = (participantName, grades, totalScore, categories) => {
    const updatedParticipants = { ...participants };
    const participant = updatedParticipants.members.find((member) => member.name === participantName);
    participant.grades = grades;
    participant.totalScore = totalScore;
    participant.categories = categories;
    setParticipants(updatedParticipants);
    console.log(categories);
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

  return (
    <div className="relative flex flex-col items-center" style={{ fontFamily: "Montserrat" }}>
      <div className="absolute left-4 flex items-center space-x-4">
        <div className="bg-white text-black rounded-lg p-3 shadow-md">
          Participants: {participants.members.length}
        </div>
      </div>

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

      {/* Sorting options with integrated ascending/descending toggle */}
      <div className="absolute right-48 flex items-center space-x-0">
        <button 
          onClick={toggleSortOrder} 
          className="flex items-center bg-green-500 text-white px-4 py-3 rounded-l-lg shadow-md hover:bg-green-600"
        >
          {(sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />)}
        </button>

        {/* Sort dropdown */}
        <select
          className="bg-green-500 text-white px-4 py-2 rounded-r-lg shadow-md hover:bg-green-600"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="totalScore">Sort by Total Score</option>
          {participants.members.length > 0 && participants.members[0].categories.map((category, index) => (
            <option key={index} value={`category-${index}`}>
              Sort by {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-center w-screen py-[50px]">
        <span className="text-6xl font-bold">
          Grading Room: {roomCode}
        </span>
      </div>

      <div className="flex flex-wrap justify-center">
        {sortParticipants().map((participant, index) => (
          <ProfileCard key={index} name={participant} code={roomCode} onGradeUpdate={handleGradeUpdate} />
        ))}
      </div>
    </div>
  );
}

export default TeacherPortalRoom;
