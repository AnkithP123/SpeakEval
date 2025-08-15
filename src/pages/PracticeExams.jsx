"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaUsers, FaCheckCircle, FaClock, FaPlay, FaCog } from "react-icons/fa";
import { toast } from "react-toastify";
import Card from "../components/Card";

const PracticeExams = () => {
  const navigate = useNavigate();
  const [practiceExams, setPracticeExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPracticeExams();
  }, []);

  const fetchPracticeExams = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Teacher authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.server.speakeval.org/get_practice_exams?pin=${token}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch practice exams");
        setLoading(false);
        return;
      }

      const data = await response.json();

      setPracticeExams(data.practiceExams || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch practice exams");
      setLoading(false);
    }
  };

  const handleViewSubmissions = (examCode) => {
    navigate(`/practice-exam-submissions/${examCode}`);
  };

  const handleCreateNew = () => {
    navigate("/create-practice");
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading practice exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 font-sans flex items-center justify-center">
        <Card color="red" className="w-full max-w-md mx-4">
          <div className="text-center py-8">
            <p className="text-xl font-semibold text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={fetchPracticeExams}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans">
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Page Header */}
          <Card color="cyan">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white py-4">
                  Practice Exams
                </h1>
                <p className="text-lg text-gray-400 mt-1">
                  Manage and view your practice exam sessions
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Create New Practice Exam
              </button>
            </div>
          </Card>

          {/* Summary Stats */}
          {practiceExams.length > 0 && (
            <Card color="purple">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-white">
                    {practiceExams.length}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total Practice Exams</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-white">
                    {practiceExams.reduce((acc, exam) => acc + exam.participantCount, 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total Participants</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-white">
                    {practiceExams.reduce((acc, exam) => acc + exam.completedCount, 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Completed Responses</div>
                </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-white">
                    {practiceExams.length > 0 
                      ? Math.round(practiceExams.reduce((acc, exam) => acc + (exam.completedCount / Math.max(exam.participantCount, 1)), 0) / practiceExams.length * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Avg. Completion Rate</div>
                </div>
              </div>
            </Card>
          )}

          {/* Practice Exams List */}
          <Card>
            {practiceExams.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-500 mb-4">📝</div>
                <p className="text-xl text-gray-400 mb-2">No practice exams created yet</p>
                <p className="text-gray-500 mb-6">
                  Create your first practice exam to get started
                </p>
                <button
                  onClick={handleCreateNew}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Create Practice Exam
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {practiceExams.map((exam, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center justify-between p-6 bg-black/10 rounded-xl transition-all duration-300 hover:bg-black/30 border border-purple-500/20"
                  >
                    {/* Exam Info */}
                    <div className="flex items-center space-x-4 flex-grow mb-4 sm:mb-0">
                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                        <FaCog className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {exam.configData?.name || exam.config}
                        </h3>
                        <p className="text-gray-400">
                          Code: <span className="font-mono text-purple-300">{exam.code}</span>
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <span>Created: {formatDate(exam.created)}</span>
                          <span>Questions: {exam.configData?.questions?.length || 'N/A'}</span>
                          <span>Language: {exam.configData?.language || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                      <div className="text-center">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <FaUsers />
                          <span className="text-sm">Participants</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {exam.participantCount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <FaCheckCircle />
                          <span className="text-sm">Completed</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {exam.completedCount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <FaClock />
                          <span className="text-sm">Thinking Time</span>
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {exam.thinkingTime}s
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button
                        onClick={() => handleViewSubmissions(exam.code)}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <FaEye />
                        <span className="font-medium">View Submissions</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PracticeExams;


