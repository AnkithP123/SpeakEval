import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaChevronDown, FaChevronRight, FaCheckCircle, FaExclamationTriangle, FaStar, FaClock, FaUser, FaCheck } from 'react-icons/fa';

const GradingView = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, getSubmissions } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [combinedSubmissions, setCombinedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [shortCounts, setShortCounts] = useState({});
  const [showIndividual, setShowIndividual] = useState(false);

  useEffect(() => {
  const loadData = async () => {
      try {
        const [assignmentData, submissionsData] = await Promise.all([
          getAssignment(classId, assignmentId),
          getSubmissions(classId, assignmentId)
        ]);
        
        setAssignment(assignmentData);
        setSubmissions(submissionsData);
        
        // Combine submissions from the same student
        const combined = combineSubmissions(submissionsData);
        setCombinedSubmissions(combined);
    } catch (error) {
        showError('Failed to load grading data');
        navigate(`/classroom/${classId}/assignments/${assignmentId}`);
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [classId, assignmentId]);

  const combineSubmissions = (submissions) => {
    const studentMap = new Map();
    
    // Group submissions by student email
    submissions.forEach(submission => {
      const email = submission.studentEmail;
      if (!studentMap.has(email)) {
        studentMap.set(email, []);
      }
      studentMap.get(email).push(submission);
    });
    
    // Combine submissions for each student
    const combined = [];
    studentMap.forEach((studentSubmissions, email) => {
      // Sort by submission date (latest first)
      studentSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
      
      const latestSubmission = studentSubmissions[0];
      const allAudioFiles = [];
      
      // Collect all audio files from all submissions
      studentSubmissions.forEach(sub => {
        if (sub.audioFiles && Array.isArray(sub.audioFiles)) {
          sub.audioFiles.forEach(file => {
            allAudioFiles.push({
              ...file,
              submissionDate: sub.submittedAt,
              originalSubmission: sub
            });
          });
        }
      });
      
      // Group audio files by question index and take the latest for each
      const questionMap = new Map();
      allAudioFiles.forEach(file => {
        const qIndex = file.questionIndex;
        if (!questionMap.has(qIndex) || file.submissionDate > questionMap.get(qIndex).submissionDate) {
          questionMap.set(qIndex, file);
        }
      });
      
      // Create combined submission
      const combinedSubmission = {
        ...latestSubmission,
        audioFiles: Array.from(questionMap.values()).sort((a, b) => a.questionIndex - b.questionIndex),
        allSubmissions: studentSubmissions,
        submissionCount: studentSubmissions.length
      };
      
      combined.push(combinedSubmission);
    });
    
    // Sort combined submissions by latest submission date
    return combined.sort((a, b) => b.submittedAt - a.submittedAt);
  };

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLoadedMetadata = (submissionKey, qIdx, duration) => {
    setShortCounts(prev => {
      const current = prev[submissionKey] || { short: 0, total: 0 };
      const isShort = duration > 0 && duration < 2;
      const updated = {
        short: current.short + (isShort ? 1 : 0),
        total: Math.max(current.total, qIdx + 1)
      };
      return { ...prev, [submissionKey]: updated };
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading submissions...</p>
        </div>
      </div>
    );
  }

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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <button
              onClick={() => navigate(`/classroom/${classId}/assignments/${assignmentId}`)}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Assignment
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                View Submissions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Review student submissions for "{assignment?.title}"
            </p>
          </div>

          {/* Stats and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaUser className="text-3xl text-cyan-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {showIndividual ? submissions.length : combinedSubmissions.length}
                  </div>
                  <div className="text-gray-300">
                    {showIndividual ? 'Total Submissions' : 'Unique Students'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <button
                    onClick={() => setShowIndividual(!showIndividual)}
                    className="w-full p-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all duration-300 inline-flex items-center justify-center"
                  >
                    <FaCheck className="mr-2" />
                    {showIndividual ? 'Show Combined View' : 'Show Individual Submissions'}
                  </button>
                  <div className="text-sm text-gray-400 mt-2">
                    {showIndividual ? 'View all submission attempts' : 'View latest responses per student'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
              <div className="relative z-10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaStar className="mr-3 text-cyan-400" />
                  Student Submissions
                </h2>
                
                {(showIndividual ? submissions : combinedSubmissions).length === 0 ? (
                  <div className="text-center py-12">
                    <FaUser className="text-6xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                    <p className="text-gray-300">Students haven't submitted their assignments yet</p>
                      </div>
                ) : (
                  <div className="space-y-6">
                    {(showIndividual ? submissions : combinedSubmissions).map((submission, index) => (
                      <div 
                        key={`${submission.studentEmail || 'student'}-${submission.submittedAt || index}`} 
                        data-student={submission.studentEmail}
                        className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-1">
                              {(() => {
                                const total = assignment?.numQuestions || 0;
                                const count = submission.audioFiles?.length || 0;
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${pct >= 100 ? 'bg-slate-800 border-2 border-green-500' : 'bg-slate-800 border-2 border-cyan-500'}`}>
                                    <span className={`font-bold text-lg ${pct >= 100 ? 'text-green-400' : 'text-cyan-400'}`}>{pct}%</span>
                        </div>
                                );
                              })()}
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-1">
                                  <h3 className="text-xl font-bold text-white">
                                    {submission.studentName || `Student ${index + 1}`}
                                  </h3>
                                  {(() => {
                                    const key = `${submission.studentEmail || 'student'}-${submission.submittedAt || index}`;
                                    const stats = shortCounts[key];
                                    const pctShort = stats && stats.total > 0 ? (stats.short / stats.total) * 100 : 0;
                                    if (pctShort > 20) {
                                      return (
                                        <div className="relative group">
                                          <FaExclamationTriangle className="text-orange-400 cursor-help" />
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                            Potential issue: {Math.round(pctShort)}% of responses are under 2s
                        </div>
                      </div>
                                      );
                                    }
                                    return null;
                                  })()}
                    </div>
                                <div className="flex items-center text-sm text-gray-400">
                                  <span className="flex items-center">
                                    <FaClock className="mr-1" />
                                    {showIndividual ? 'Submitted' : 'Latest submission'}: {formatDate(submission.submittedAt)}
                                  </span>
                                  {!showIndividual && submission.submissionCount > 1 && (
                                    <span className="ml-4 flex items-center text-cyan-400">
                                      <FaCheckCircle className="mr-1" />
                                      {submission.submissionCount} attempts
                                    </span>
                                  )}
                    </div>
              </div>
            </div>

                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleExpand(`${submission.studentEmail || 'student'}-${submission.submittedAt || index}`)}
                              className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all duration-300 inline-flex items-center"
                            >
                              {expanded[`${submission.studentEmail || 'student'}-${submission.submittedAt || index}`] ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
                              <span className="ml-2">
                                {showIndividual ? 'View Responses' : 'View Latest Responses'}
                              </span>
                            </button>
                            {!showIndividual && submission.submissionCount > 1 && (
                              <button
                                onClick={() => {
                                  setShowIndividual(true);
                                  // Scroll to this student's submissions
                                  setTimeout(() => {
                                    const element = document.querySelector(`[data-student="${submission.studentEmail}"]`);
                                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                }}
                                className="p-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-300 inline-flex items-center"
                              >
                                <FaUser className="w-4 h-4 mr-2" />
                                View All Attempts
                              </button>
                            )}
                          </div>
          </div>

                        {/* Audio responses */}
                        {expanded[`${submission.studentEmail || 'student'}-${submission.submittedAt || index}`] && Array.isArray(submission.audioFiles) && submission.audioFiles.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {!showIndividual && submission.submissionCount > 1 && (
                              <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                                <div className="text-sm text-blue-300">
                                  <FaCheckCircle className="inline mr-2" />
                                  Showing latest response for each question from {submission.submissionCount} submission attempts
                                </div>
                              </div>
                            )}
                            {submission.audioFiles.map((file, qIdx) => (
                              <div key={`${file.s3Key || qIdx}`} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                <div className="flex items-center space-x-3">
                                  <div className="text-sm text-gray-300">Question {file.questionIndex != null ? file.questionIndex + 1 : qIdx + 1}</div>
                                  {!showIndividual && file.originalSubmission && file.originalSubmission.submittedAt !== submission.submittedAt && (
                                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                                      From earlier attempt
                                    </span>
                                  )}
                                </div>
                                {file.audioUrl ? (
                                  <audio controls src={file.audioUrl} className="w-64" onLoadedMetadata={(e) => handleLoadedMetadata(`${submission.studentEmail || 'student'}-${submission.submittedAt || index}`, qIdx, e.currentTarget.duration)} />
                                ) : (
                                  <span className="text-xs text-gray-400">No audio URL</span>
                      )}
                    </div>
                  ))}
                </div>
                        )}
                  </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingView;