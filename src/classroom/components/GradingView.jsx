import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaPlay, FaCheck, FaTimes, FaStar, FaClock, FaUser } from 'react-icons/fa';

const GradingView = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, getSubmissions, gradeSubmission } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});

  useEffect(() => {
  const loadData = async () => {
      try {
        const [assignmentData, submissionsData] = await Promise.all([
          getAssignment(classId, assignmentId),
          getSubmissions(classId, assignmentId)
        ]);
        
        setAssignment(assignmentData);
        setSubmissions(submissionsData);
    } catch (error) {
        showError('Failed to load grading data');
        navigate(`/classroom/${classId}/assignments/${assignmentId}`);
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [classId, assignmentId]);

  const handleGradeSubmission = async (submissionId, grade) => {
    try {
      await gradeSubmission(classId, assignmentId, submissionId, grade);
      setGrading(prev => ({ ...prev, [submissionId]: grade }));
      showSuccess('Grade saved successfully');
    } catch (error) {
      showError('Failed to save grade');
    }
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
                Grade Submissions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Review and grade student submissions for "{assignment?.title}"
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaUser className="text-3xl text-cyan-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{submissions.length}</div>
                  <div className="text-gray-300">Total Submissions</div>
            </div>
          </div>
        </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaCheck className="text-3xl text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {submissions.filter(s => s.grade !== undefined).length}
                      </div>
                  <div className="text-gray-300">Graded</div>
                    </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaTimes className="text-3xl text-orange-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {submissions.filter(s => s.grade === undefined).length}
                        </div>
                  <div className="text-gray-300">Pending</div>
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
                
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUser className="text-6xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                    <p className="text-gray-300">Students haven't submitted their assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submissions.map((submission, index) => (
                      <div key={submission.id} className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">
                              {submission.studentName || `Student ${index + 1}`}
                            </h3>
                            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                              <span className="flex items-center">
                                <FaClock className="mr-1" />
                                Submitted: {formatDate(submission.submittedAt)}
                              </span>
                              <span className="flex items-center">
                                <FaClock className="mr-1" />
                                Duration: {formatDuration(submission.duration || 0)}
                              </span>
                              <span className="flex items-center">
                                <FaStar className="mr-1" />
                                Status: {submission.grade !== undefined ? 'Graded' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {submission.grade !== undefined && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-cyan-400">
                                  {submission.grade}%
                                </div>
                                <div className="text-sm text-gray-400">Grade</div>
                </div>
                            )}
                            <Link
                              to={`/classroom/${classId}/assignments/${assignmentId}/submissions/${submission.id}`}
                              className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all duration-300"
                            >
                              <FaPlay className="w-4 h-4" />
                            </Link>
                      </div>
                        </div>
                        
                        {/* Quick Grade Actions */}
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-400">Quick Grade:</span>
                          {[100, 90, 80, 70, 60, 50].map(grade => (
                            <button
                              key={grade}
                              onClick={() => handleGradeSubmission(submission.id, grade)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                                grading[submission.id] === grade || submission.grade === grade
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                              }`}
                            >
                              {grade}%
                            </button>
                          ))}
                    <input
                      type="number"
                      min="0"
                            max="100"
                            placeholder="Custom grade"
                            className="px-3 py-1 bg-slate-700 text-white rounded-lg text-sm w-24"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const grade = parseInt(e.target.value);
                                if (grade >= 0 && grade <= 100) {
                                  handleGradeSubmission(submission.id, grade);
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                    </div>
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