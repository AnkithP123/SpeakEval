import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaChevronDown, FaChevronRight, FaCheckCircle, FaExclamationTriangle, FaStar, FaClock, FaUser, FaCheck } from 'react-icons/fa';

const GradingView = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, getSubmissions, getClass } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [combinedSubmissions, setCombinedSubmissions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [shortCounts, setShortCounts] = useState({});
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState({});

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
        
        // Get all students from the class
        const classData = await getClass(classId);
        if (classData && classData.students) {
          setAllStudents(classData.students);
        }
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

  const toggleAllAttempts = (studentEmail) => {
    setShowAllAttempts(prev => ({ 
      ...prev, 
      [studentEmail]: !prev[studentEmail] 
    }));
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
    // Handle both epoch timestamps and ISO strings
    let date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Handle ISO strings like "2025-09-08T18:19:01.386Z"
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group relative animate-fade-in-up h-full">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2 h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center flex flex-col justify-center h-full">
                  <FaUser className="text-3xl text-cyan-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{allStudents.length}</div>
                  <div className="text-gray-300">Total Students</div>
                </div>
              </div>
            </div>
            
            <div className="group relative animate-fade-in-up h-full">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2 h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                  <div className="text-center mb-4">
                    <FaCheckCircle className="text-3xl text-blue-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">Submission Status</div>
                  </div>
                  
                  {(() => {
                    // Calculate submission status counts
                    const submissionsByStudent = new Map();
                    combinedSubmissions.forEach(sub => {
                      submissionsByStudent.set(sub.studentEmail, sub);
                    });
                    
                    let notSubmitted = 0;
                    let partiallySubmitted = 0;
                    let completed = 0;
                    
                    allStudents.forEach(student => {
                      const submission = submissionsByStudent.get(student.email);
                      if (!submission) {
                        notSubmitted++;
                      } else {
                        const total = assignment?.numQuestions || 0;
                        const count = submission.audioFiles?.length || 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        if (pct >= 100) {
                          completed++;
                        } else if (pct > 0) {
                          partiallySubmitted++;
                        } else {
                          notSubmitted++;
                        }
                      }
                    });
                    
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Not Submitted:</span>
                          <span className="text-gray-300 font-semibold">{notSubmitted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-cyan-400">Partial:</span>
                          <span className="text-cyan-300 font-semibold">{partiallySubmitted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-400">Complete:</span>
                          <span className="text-green-300 font-semibold">{completed}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="group relative animate-fade-in-up h-full">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2 h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center flex flex-col justify-between h-full">
                  <div className="mb-4">
                    <FaCheck className="text-3xl text-green-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">View Options</div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={() => setShowAllStudents(!showAllStudents)}
                      className="w-full p-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-300 inline-flex items-center justify-center text-sm"
                    >
                      <FaCheck className="mr-2" />
                      {showAllStudents ? 'Hide Non-Submitters' : 'Show All Students'}
                    </button>
                    <div className="text-xs text-gray-400 mt-2">
                      {showAllStudents ? 'Including students who haven\'t submitted' : 'Only students with submissions'}
                    </div>
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
                
                {(() => {
                  // Create a map of submissions by student email
                  const submissionsByStudent = new Map();
                  combinedSubmissions.forEach(sub => {
                    submissionsByStudent.set(sub.studentEmail, sub);
                  });
                  
                  // Get the list of students to display
                  const studentsToShow = showAllStudents ? allStudents : combinedSubmissions;
                  
                  if (studentsToShow.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FaUser className="text-6xl text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Students Found</h3>
                        <p className="text-gray-300">
                          {showAllStudents ? 'No students enrolled in this class' : 'No submissions yet'}
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-6">
                      {studentsToShow.map((student, index) => {
                        const studentEmail = student.email || student.studentEmail;
                        const submission = submissionsByStudent.get(studentEmail);
                        const hasSubmitted = !!submission;
                        
                        return (
                          <div 
                            key={`${studentEmail || 'student'}-${index}`} 
                            data-student={studentEmail}
                            className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300"
                          >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-1">
                              {(() => {
                                const total = assignment?.numQuestions || 0;
                                const count = hasSubmitted ? (submission.audioFiles?.length || 0) : 0;
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                
                                let circleClass, textClass;
                                if (!hasSubmitted) {
                                  circleClass = 'bg-slate-800 border-2 border-gray-500';
                                  textClass = 'text-gray-400';
                                } else if (pct >= 100) {
                                  circleClass = 'bg-slate-800 border-2 border-green-500';
                                  textClass = 'text-green-400';
                                } else {
                                  circleClass = 'bg-slate-800 border-2 border-cyan-500';
                                  textClass = 'text-cyan-400';
                                }
                                
                                return (
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${circleClass}`}>
                                    <span className={`font-bold text-lg ${textClass}`}>{pct}%</span>
                                  </div>
                                );
                              })()}
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-1">
                                  <h3 className="text-xl font-bold text-white">
                                    {hasSubmitted ? submission.studentName : (student.fullName || student.username || `Student ${index + 1}`)}
                                  </h3>
                                  {hasSubmitted && (() => {
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
                                  {hasSubmitted ? (
                                    <>
                                      <span className="flex items-center">
                                        <FaClock className="mr-1" />
                                        Latest submission: {formatDate(submission.submittedAt)}
                                      </span>
                                      {submission.submissionCount > 1 && (
                                        <span className="ml-4 flex items-center text-cyan-400">
                                          <FaCheckCircle className="mr-1" />
                                          {submission.submissionCount} attempts
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="flex items-center text-gray-500">
                                      <FaClock className="mr-1" />
                                      No submission yet
                                    </span>
                                  )}
                                </div>
              </div>
            </div>

                          </div>
                          {hasSubmitted && (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleExpand(`${studentEmail || 'student'}-${index}`)}
                                className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all duration-300 inline-flex items-center"
                              >
                                {expanded[`${studentEmail || 'student'}-${index}`] ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
                                <span className="ml-2">View Responses</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Audio responses */}
                        {hasSubmitted && expanded[`${studentEmail || 'student'}-${index}`] && (
                          <div className="mt-4 space-y-4">
                            {/* Toggle button for multiple attempts */}
                            {submission.submissionCount > 1 && (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => toggleAllAttempts(studentEmail)}
                                  className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-300 inline-flex items-center text-sm"
                                >
                                  <FaCheck className="mr-2" />
                                  {showAllAttempts[studentEmail] ? 'Show Latest Responses' : 'Show All Attempts'}
                                </button>
                              </div>
                            )}
                            
                            {!showAllAttempts[studentEmail] ? (
                              /* Latest responses */
                              <div className="space-y-3">
                                {submission.submissionCount > 1 && (
                                  <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                                    <div className="text-sm text-blue-300">
                                      <FaCheckCircle className="inline mr-2" />
                                      Showing latest response for each question from {submission.submissionCount} submission attempts
                                    </div>
                                  </div>
                                )}
                                
                                {Array.isArray(submission.audioFiles) && submission.audioFiles.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-lg font-semibold text-white">Latest Responses</h4>
                                    {submission.audioFiles.map((file, qIdx) => (
                                      <div key={`${file.s3Key || qIdx}`} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                        <div className="flex items-center space-x-3">
                                          <div className="text-sm text-gray-300">Question {file.questionIndex != null ? file.questionIndex + 1 : qIdx + 1}</div>
                                          {file.originalSubmission && file.originalSubmission.submittedAt !== submission.submittedAt && (
                                            <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                                              From earlier attempt
                                            </span>
                                          )}
                                        </div>
                                        {file.audioUrl ? (
                                          <audio controls src={file.audioUrl} className="w-64" onLoadedMetadata={(e) => handleLoadedMetadata(`${studentEmail || 'student'}-${index}`, qIdx, e.currentTarget.duration)} />
                                        ) : (
                                          <span className="text-xs text-gray-400">No audio URL</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* All submission attempts */
                              <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-white">All Submission Attempts</h4>
                                {submission.allSubmissions && submission.allSubmissions.map((individualSubmission, subIndex) => (
                                  <div key={`attempt-${subIndex}`} className="bg-slate-900/30 rounded-lg p-4 border border-slate-600">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-3">
                                        <span className="text-sm font-medium text-cyan-400">Attempt {subIndex + 1}</span>
                                        <span className="text-xs text-gray-400">
                                          {formatDate(individualSubmission.submittedAt)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {individualSubmission.audioFiles?.length || 0} responses
                                      </div>
                                    </div>
                                    
                                    {Array.isArray(individualSubmission.audioFiles) && individualSubmission.audioFiles.length > 0 && (
                                      <div className="space-y-2">
                                        {individualSubmission.audioFiles.map((file, qIdx) => (
                                          <div key={`${file.s3Key || qIdx}`} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 border border-slate-600">
                                            <div className="text-xs text-gray-300">Question {file.questionIndex != null ? file.questionIndex + 1 : qIdx + 1}</div>
                                            {file.audioUrl ? (
                                              <audio controls src={file.audioUrl} className="w-48 h-8" onLoadedMetadata={(e) => handleLoadedMetadata(`${studentEmail || 'student'}-${index}-${subIndex}`, qIdx, e.currentTarget.duration)} />
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
                        )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingView;