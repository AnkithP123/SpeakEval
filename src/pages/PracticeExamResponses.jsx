"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlay, FaPause, FaTimes, FaArrowLeft, FaVolumeUp, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import Card from "../components/Card";

const PracticeExamResponses = () => {
  const { examCode, studentName } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioRefs, setAudioRefs] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (examCode && studentName) {
      fetchResponses();
    } else {
      setError("Missing exam code or student name");
      setLoading(false);
    }
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

  const downloadAudio = (audioUrl, questionIndex) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${studentName}_question_${questionIndex + 1}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading audio for question ${questionIndex + 1}`);
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    // Scroll to the question
    const questionElement = document.getElementById(`question-${index}`);
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading practice exam responses...</p>
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
              onClick={() => navigate(-1)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Go Back
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
    <div className="min-h-screen text-gray-200 font-sans bg-gray-900">
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card color="purple">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center space-x-2 text-purple-300 hover:text-white transition-colors mb-4"
                >
                  <FaArrowLeft />
                  <span>Back to Submissions</span>
                </button>
                <h1 className="text-3xl font-bold text-white">
                  {studentName}'s Practice Exam Responses
                </h1>
                <p className="text-lg text-gray-300 mt-2">
                  Practice Exam: {responses.configName} ({responses.examCode})
                </p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-400">
                  <span>Total Questions: {responses.responses.length}</span>
                  <span>Status: {responses.completed ? 'Completed' : 'In Progress'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Question Navigation */}
          {responses.responses.length > 1 && (
            <Card color="blue">
              <h3 className="text-lg font-semibold text-white mb-4">Question Navigation</h3>
              <div className="flex flex-wrap gap-2">
                {responses.responses.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentQuestionIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/30 text-gray-300 hover:bg-black/50'
                    }`}
                  >
                    Question {index + 1}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Rubric */}
          {responses.rubric && (
            <Card color="cyan">
              <h3 className="text-lg font-semibold text-white mb-4">Rubric</h3>
              <div className="text-gray-300 whitespace-pre-wrap bg-black/20 p-4 rounded-lg border border-cyan-500/30">
                {responses.rubric}
              </div>
            </Card>
          )}

          {/* Responses */}
          <div className="space-y-6">
            {responses.responses.map((response, index) => (
              <div
                key={index}
                id={`question-${index}`}
                className="p-6 bg-black/10 rounded-lg border border-purple-500/20"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Question {response.questionIndex + 1}
                  </h3>
                  <div className="text-sm text-gray-400">
                    {new Date(response.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Question Audio */}
                {response.questionAudioUrl && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-300 mb-3">Question Audio:</h4>
                    <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                      <audio
                        controls
                        className="w-full"
                        src={response.questionAudioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                {response.questionText && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-300 mb-3">Question:</h4>
                    <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                      <p className="text-white leading-relaxed">
                        {response.questionText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Student Response Audio */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-300 mb-3">Student Response:</h4>
                  <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                    <div className="flex items-center space-x-4 mb-3">
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
                      <button
                        onClick={() => downloadAudio(response.responseAudio, response.questionIndex)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <FaDownload />
                        <span>Download</span>
                      </button>
                      <span className="text-sm text-gray-400">
                        {response.responseTranscription ? "Transcription available" : "No transcription"}
                      </span>
                    </div>
                    <audio
                      ref={(ref) => setAudioRef(response.questionIndex, ref)}
                      onEnded={handleAudioEnded}
                      src={response.responseAudio}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Student Response Transcription */}
                {response.responseTranscription && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-300 mb-3">Transcription:</h4>
                    <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                      <p className="text-white leading-relaxed">
                        {response.responseTranscription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <Card color="gray">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">
                Total Responses: {responses.responses.length}
              </span>
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Submissions
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamResponses;
