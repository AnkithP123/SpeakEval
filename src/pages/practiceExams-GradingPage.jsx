"use client";
import { FaCheck, FaEye } from "react-icons/fa";
import Card from "../components/Card";

// Hardcoded test data
const studentsData = [
  {
    id: 1,
    name: "AmberG",
    isCompleted: true,
    completionPercentage: 100,
  },
  {
    id: 2,
    name: "IanW",
    isCompleted: false,
    completionPercentage: 75,
  },
  {
    id: 3,
    name: "KarounK",
    isCompleted: false,
    completionPercentage: 45,
  },
  {
    id: 4,
    name: "LucianaC",
    isCompleted: true,
    completionPercentage: 100,
  },
  {
    id: 5,
    name: "ManinderS",
    isCompleted: false,
    completionPercentage: 30,
  },
  {
    id: 6,
    name: "RachelW",
    isCompleted: true,
    completionPercentage: 100,
  },
  {
    id: 7,
    name: "ShaunM",
    isCompleted: false,
    completionPercentage: 85,
  },
  {
    id: 8,
    name: "LauraO",
    isCompleted: true,
    completionPercentage: 100,
  },
];

// Progress Circle Component
const ProgressCircle = ({ percentage }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="#818cf8"
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-white">
        {percentage}%
      </span>
    </div>
  );
};

// Completion Status Component
const CompletionStatus = ({ isCompleted, completionPercentage }) => {
  if (isCompleted) {
    return (
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
        <FaCheck className="text-white text-lg" />
      </div>
    );
  }
  return <ProgressCircle percentage={completionPercentage} />;
};

const App = () => {
  const handleViewResponses = (studentName) => {
    console.log("Response button clicked for:", studentName);
  };

  const completedCount = studentsData.filter((s) => s.isCompleted).length;
  const inProgressCount = studentsData.length - completedCount;
  const averageProgress = Math.round(
    studentsData.reduce((acc, s) => acc + s.completionPercentage, 0) /
      studentsData.length
  );

  return (
    <div className="min-h-screen text-gray-200 font-sans">
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* --- Page Header --- */}
          <Card color="cyan">
            <h1 className="text-3xl font-bold text-white py-4">
              Practice Exam Completions
            </h1>
            <p className="text-lg text-gray-400 mt-1">Practice Set: Bob</p>
            <p className="text-l text-gray-400 mt-1">Practice Code: Bob</p>
          </Card>

          {/* --- Summary Stats (Moved to the top) --- */}
          <Card color="purple">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {completedCount}
                </div>
                <div className="text-sm text-gray-400 mt-1">Completed</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {inProgressCount}
                </div>
                <div className="text-sm text-gray-400 mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {averageProgress}%
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Average Progress
                </div>
              </div>
            </div>
          </Card>

          {/* --- Student Progress List (Now scrollable) --- */}
          <Card>
            <div className="max-h-[55vh] overflow-y-auto space-y-2 p-4">
              {studentsData.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between p-4 bg-black/10 rounded-xl transition-all duration-300 hover:bg-black/30"
                >
                  {/* Student Info */}
                  <div className="flex items-center space-x-4 flex-grow mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xl">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-white text-lg">
                      {student.name}
                    </span>
                  </div>

                  {/* Completion Status and Button */}
                  <div className="flex items-center space-x-6 w-full sm:w-auto">
                    <div className="flex-shrink-0">
                      <CompletionStatus
                        isCompleted={student.isCompleted}
                        completionPercentage={student.completionPercentage}
                      />
                    </div>
                    <button
                      onClick={() => handleViewResponses(student.name)}
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full sm:w-auto"
                    >
                      <FaEye />
                      <span className="font-medium">View Responses</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default App;
