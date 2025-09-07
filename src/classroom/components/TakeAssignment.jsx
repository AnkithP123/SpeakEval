import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaPlay, FaSquare, FaFastForward, FaArrowLeft, FaCheckCircle, FaClock, FaMicrophone } from 'react-icons/fa';
import { FiRotateCcw } from 'react-icons/fi';
import * as Tone from "tone";

const TakeAssignment = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, submitAssignment } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayTime, setDisplayTime] = useState("00:00");
  const [countdownDisplay, setCountdownDisplay] = useState(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showTranscriptions, setShowTranscriptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);
  const questionAudioRef = useRef(null);
  const timer = useRef(0);
  const countdownRef = useRef(0);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const assignmentData = await getAssignment(classId, assignmentId);
        setAssignment(assignmentData);
      } catch (error) {
        showError('Failed to load assignment');
        navigate('/classroom');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [classId, assignmentId]);

  useEffect(() => {
    return () => {
      clearInterval(timerInterval.current);
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop();
      }
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
      }
    };
  }, []);

  const getExamData = () => {
    if (!assignment) return null;
    if (randomizeQuestions) {
      return { ...assignment, questions: shuffle([...assignment.questions]) };
    }
    return assignment;
  };

  const getRecordings = () => {
    if (randomizeQuestions) {
      return shuffle([...recordings]);
    }
    return recordings;
  };

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const startRecording = async () => {
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordings(prev => [...prev, { questionIndex: currentQuestionIndex, audioUrl }]);
      };

      mediaRecorder.current.start();
      startTimer();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      showError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    setDisplayTime("00:00");
    stopTimer();
  };

  const startTimer = () => {
    const timeLimit = getExamData().timeLimit;
    timer.current = timeLimit;
    setDisplayTime(formatTime(timeLimit));
    timerInterval.current = setInterval(() => {
      timer.current -= 1;
      setDisplayTime(formatTime(timer.current));
      if (timer.current <= 0) {
        stopRecording();
      }
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerInterval.current);
  };

  const playQuestionAudio = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    const audioUrl = getExamData().questions[currentQuestionIndex].audioUrl;

    if (questionAudioRef.current) {
      questionAudioRef.current.src = audioUrl;
      await questionAudioRef.current.play();
    }
  };

  const handleQuestionEnd = () => {
    setIsPlaying(false);
    countdownRef.current = getExamData().thinkingTime;
    setCountdownDisplay(countdownRef.current);

    const countdownInterval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdownDisplay(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearInterval(countdownInterval);
        startRecording();
      }
    }, 1000);
  };

  const handleQuestionChange = (direction) => {
    const newIndex = direction === 'next'
      ? Math.min(currentQuestionIndex + 1, getExamData().questions.length - 1)
      : Math.max(currentQuestionIndex - 1, 0);
    
    setCurrentQuestionIndex(newIndex);
    setIsPlaying(false);
    setIsRecording(false);
    setDisplayTime("00:00");
    stopTimer();
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
    }
  };

  const handleSubmit = async () => {
    if (recordings.length === 0) {
      showError('Please record at least one response before submitting');
        return;
    }

    setSubmitting(true);
    try {
      await submitAssignment(classId, assignmentId, recordings);
      showSuccess('Assignment submitted successfully!');
      navigate(`/classroom/${classId}`);
    } catch (error) {
      showError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Assignment not found</h1>
              <button 
            onClick={() => navigate('/classroom')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
              >
            Back to Dashboard
              </button>
        </div>
      </div>
    );
  }

  const examData = getExamData();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>

        {/* Floating particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button 
              onClick={() => navigate(`/classroom/${classId}`)}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Class
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {assignment.title}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {assignment.description}
            </p>
        </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl" />
                <div className="relative z-10 p-4 text-center">
                  <FaClock className="text-2xl text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{examData.questions.length}</div>
                  <div className="text-gray-300 text-sm">Questions</div>
                </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl" />
                <div className="relative z-10 p-4 text-center">
                  <FaMicrophone className="text-2xl text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{examData.timeLimit}s</div>
                  <div className="text-gray-300 text-sm">Per Question</div>
                </div>
                </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl" />
                <div className="relative z-10 p-4 text-center">
                  <FaCheckCircle className="text-2xl text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{recordings.length}</div>
                  <div className="text-gray-300 text-sm">Completed</div>
            </div>
              </div>
            </div>
          </div>

          {/* Main Recording Interface */}
          <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 p-8">
                {/* Timer Display */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-cyan-400 neon-border p-6 rounded-2xl inline-block">
                    {displayTime}
          </div>
        </div>

                {/* Question Navigation */}
                <div className="flex justify-between items-center mb-8">
            <button 
                    onClick={() => handleQuestionChange('previous')}
              disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 disabled:from-gray-800 disabled:to-gray-900 text-white rounded-xl hover:from-gray-500 hover:to-gray-600 disabled:hover:from-gray-800 disabled:hover:to-gray-900 transition-all duration-300 flex items-center"
            >
                    <FiRotateCcw className="mr-2" />
              Previous
            </button>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      Question {currentQuestionIndex + 1} of {examData.questions.length}
                    </div>
                    <div className="flex justify-center space-x-2">
                      {examData.questions.map((_, index) => (
                        <div
                  key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentQuestionIndex
                              ? 'bg-cyan-400'
                              : recordings.some(r => r.questionIndex === index)
                              ? 'bg-green-400'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
            </div>

            <button 
                    onClick={() => handleQuestionChange('next')}
                    disabled={currentQuestionIndex === examData.questions.length - 1}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 disabled:from-gray-800 disabled:to-gray-900 text-white rounded-xl hover:from-gray-500 hover:to-gray-600 disabled:hover:from-gray-800 disabled:hover:to-gray-900 transition-all duration-300 flex items-center"
            >
              Next
                    <FaFastForward className="ml-2" />
            </button>
          </div>

                {/* Question Display */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  {showTranscriptions && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-600">
                      <p className="text-white text-lg leading-relaxed">
                        {examData.questions[currentQuestionIndex].transcription}
                      </p>
                    </div>
                  )}
        </div>

                {/* Recording Controls */}
                <div className="text-center mb-8">
                  {!isRecording && countdownDisplay === 0 && (
                    <button
                      onClick={playQuestionAudio}
                      className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center mx-auto transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                    >
                      <FaPlay className="text-2xl ml-1" />
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center mx-auto transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 animate-pulse"
                    >
                      <FaSquare className="text-2xl" />
                    </button>
                  )}

                  {isRecording && (
                    <p className="mt-4 text-xl font-semibold text-red-400 animate-pulse">
                      Recording...
                    </p>
                  )}

                  {isPlaying && (
                    <p className="mt-4 text-xl font-semibold text-cyan-400">
                      Playing Question...
                    </p>
                  )}

                  {countdownDisplay > 0 && (
                    <p className="mt-4 text-2xl font-bold text-yellow-400">
                      Recording starts in {countdownDisplay}...
              </p>
            )}
          </div>

                {/* Options */}
                <div className="flex justify-center space-x-6 mb-8">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      className="mr-2 w-4 h-4 text-cyan-500 bg-slate-800 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    Randomize Questions
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={showTranscriptions}
                      onChange={(e) => setShowTranscriptions(e.target.checked)}
                      className="mr-2 w-4 h-4 text-cyan-500 bg-slate-800 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    Show Transcriptions
                  </label>
                </div>

                {/* Submit Button */}
                {recordings.length > 0 && (
                  <div className="text-center">
            <button 
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:transform-none disabled:shadow-none flex items-center mx-auto"
            >
              {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting...
                        </>
              ) : (
                <>
                          <FaCheckCircle className="mr-3" />
                  Submit Assignment
                </>
              )}
            </button>
          </div>
                )}
              </div>
            </div>
          </div>

          {/* Recordings List */}
          {recordings.length > 0 && (
            <div className="mt-8 group relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="relative z-10 p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">Your Recordings</h3>
                  <div className="space-y-4">
                    {getRecordings().map((recording, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-gray-600">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Question {recording.questionIndex + 1} - {examData.questions[recording.questionIndex].transcription}
                        </h4>
                        <audio
                          src={recording.audioUrl}
                          controls
                          className="w-full mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio ref={questionAudioRef} onEnded={handleQuestionEnd} className="hidden" />
    </div>
  );
};

export default TakeAssignment;