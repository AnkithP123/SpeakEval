"use client";
import { useState, useEffect } from "react";
import { FaCheck, FaEye, FaPlay, FaPause, FaVolumeUp, FaTimes, FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

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

// Response Viewer Component
const ResponseViewer = ({ examCode, studentName, onClose }) => {
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioRefs, setAudioRefs] = useState({});

  useEffect(() => {
    fetchResponses();
  }, [examCode, studentName]);

  const fetchResponses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Teacher authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.server.speakeval.org/get_practice_submission_detail?pin=${token}&code=${examCode}&name=${studentName}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch responses");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResponses(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching responses:", err);
      setError("Failed to fetch responses");
      setLoading(false);
    }
  };

  const handleAudioPlay = (questionIndex) => {
    if (playingAudio === questionIndex) {
      // Stop current audio
      if (audioRefs[questionIndex]) {
        audioRefs[questionIndex].pause();
        audioRefs[questionIndex].currentTime = 0;
      }
      setPlayingAudio(null);
    } else {
      // Stop any other playing audio
      Object.keys(audioRefs).forEach(key => {
        if (audioRefs[key] && key !== questionIndex.toString()) {
          audioRefs[key].pause();
          audioRefs[key].currentTime = 0;
        }
      });
      
      // Play new audio
      if (audioRefs[questionIndex]) {
        audioRefs[questionIndex].play();
        setPlayingAudio(questionIndex);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingAudio(null);
  };

  const setAudioRef = (questionIndex, ref) => {
    if (ref) {
      setAudioRefs(prev => ({
        ...prev,
        [questionIndex]: ref
      }));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card color="blue" className="w-full max-w-2xl mx-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading responses...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card color="red" className="w-full max-w-2xl mx-4">
          <div className="text-center py-8">
            <p className="text-white text-lg mb-4">Error: {error}</p>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!responses) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card color="purple" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-purple-500/30">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {studentName}'s Responses
            </h2>
            <p className="text-gray-300">
              Practice Exam: {responses.configName} ({responses.examCode})
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open(`/practice-exam-responses/${responses.examCode}/${encodeURIComponent(studentName)}`, '_blank')}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              title="Open in new tab"
            >
              <FaExternalLinkAlt />
              <span>Open in New Tab</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Rubric */}
        {responses.rubric && (
          <div className="mb-6 p-4 bg-black/20 rounded-lg border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-2">Rubric</h3>
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {responses.rubric}
            </div>
          </div>
        )}

        {/* Responses */}
        <div className="space-y-6">
          {responses.responses.map((response, index) => (
            <div
              key={index}
              className="p-4 bg-black/10 rounded-lg border border-purple-500/20"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Question {response.questionIndex + 1}
                </h4>
                <span className="text-sm text-gray-400">
                  {new Date(response.timestamp).toLocaleString()}
                </span>
              </div>

              {/* Question Audio */}
              {response.questionAudioUrl && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Question Audio:</h5>
                  <audio
                    controls
                    className="w-full"
                    src={response.questionAudioUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Question Text */}
              {response.questionText && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Question:</h5>
                  <p className="text-white bg-black/20 p-3 rounded border border-purple-500/20">
                    {response.questionText}
                  </p>
                </div>
              )}

              {/* Student Response Audio */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Student Response:</h5>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAudioPlay(response.questionIndex)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    {playingAudio === response.questionIndex ? (
                      <>
                        <FaPause />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <FaPlay />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                  <audio
                    ref={(ref) => setAudioRef(response.questionIndex, ref)}
                    onEnded={handleAudioEnded}
                    src={response.responseAudio}
                    style={{ display: 'none' }}
                  />
                  <span className="text-sm text-gray-400">
                    {response.responseTranscription ? "Transcription available" : "No transcription"}
                  </span>
                </div>
              </div>

              {/* Student Response Transcription */}
              {response.responseTranscription && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Transcription:</h5>
                  <p className="text-white bg-black/20 p-3 rounded border border-purple-500/20">
                    {response.responseTranscription}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-purple-500/30">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Total Responses: {responses.responses.length}
            </span>
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PracticeExamGradingPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showResponseViewer, setShowResponseViewer] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Teacher authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.server.speakeval.org/get_practice_submissions?pin=${token}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch submissions");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to fetch submissions");
      setLoading(false);
    }
  };

  const handleViewResponses = (examCode, studentName) => {
    setSelectedExam(examCode);
    setSelectedStudent(studentName);
    setShowResponseViewer(true);
  };

  const handleViewResponsesInNewPage = (examCode, studentName) => {
    navigate(`/practice-exam-responses/${examCode}/${encodeURIComponent(studentName)}`);
  };

  const closeResponseViewer = () => {
    setShowResponseViewer(false);
    setSelectedExam(null);
    setSelectedStudent(null);
  };

  const getExamStats = () => {
    if (submissions.length === 0) return { completed: 0, inProgress: 0, averageProgress: 0 };

    const completed = submissions.filter(s => s.completed).length;
    const inProgress = submissions.length - completed;
    const totalProgress = submissions.reduce((acc, s) => {
      const progress = s.totalQuestions > 0 ? (s.responseCount / s.totalQuestions) * 100 : 0;
      return acc + progress;
    }, 0);
    const averageProgress = Math.round(totalProgress / submissions.length);

    return { completed, inProgress, averageProgress };
  };

  const stats = getExamStats();

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading practice exam submissions...</p>
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
              onClick={fetchSubmissions}
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
            <h1 className="text-3xl font-bold text-white py-4">
              Practice Exam Submissions
            </h1>
            <p className="text-lg text-gray-400 mt-1">
              View and analyze student practice exam responses
            </p>
          </Card>

          {/* Summary Stats */}
          <Card color="purple">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {stats.completed}
                </div>
                <div className="text-sm text-gray-400 mt-1">Completed</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {stats.inProgress}
                </div>
                <div className="text-sm text-gray-400 mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <div className="text-4xl font-bold text-white">
                  {stats.averageProgress}%
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Average Progress
                </div>
              </div>
            </div>
          </Card>

          {/* Submissions List */}
          <Card>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-400">No practice exam submissions found.</p>
                <p className="text-gray-500 mt-2">
                  Students need to complete practice exams for submissions to appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[55vh] overflow-y-auto space-y-2 p-4">
                {submissions.map((submission, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center justify-between p-4 bg-black/10 rounded-xl transition-all duration-300 hover:bg-black/30"
                  >
                    {/* Student Info */}
                    <div className="flex items-center space-x-4 flex-grow mb-4 sm:mb-0">
                      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xl">
                        {submission.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-white text-lg">
                          {submission.studentName}
                        </span>
                        <div className="text-sm text-gray-400">
                          {submission.configName} ({submission.examCode})
                        </div>
                      </div>
                    </div>

                    {/* Progress Info */}
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Responses</div>
                        <div className="text-lg font-semibold text-white">
                          {submission.responseCount}/{submission.totalQuestions}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Progress</div>
                        <div className="text-lg font-semibold text-white">
                          {Math.round((submission.responseCount / submission.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Completion Status and Button */}
                    <div className="flex items-center space-x-6 w-full sm:w-auto">
                      <div className="flex-shrink-0">
                        <CompletionStatus
                          isCompleted={submission.completed}
                          completionPercentage={Math.round((submission.responseCount / submission.totalQuestions) * 100)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewResponses(submission.examCode, submission.studentName)}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                          <FaEye />
                          <span className="font-medium">View</span>
                        </button>
                        <button
                          onClick={() => handleViewResponsesInNewPage(submission.examCode, submission.studentName)}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                          title="Open in new page"
                        >
                          <FaExternalLinkAlt />
                          <span className="font-medium">Open</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Response Viewer Modal */}
      {showResponseViewer && selectedExam && selectedStudent && (
        <ResponseViewer
          examCode={selectedExam}
          studentName={selectedStudent}
          onClose={closeResponseViewer}
        />
      )}
    </div>
  );
};

export default PracticeExamGradingPage;
