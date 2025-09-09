import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaPlay, FaEdit, FaUsers, FaClock, FaCalendar, FaGraduationCap, FaClipboardList } from 'react-icons/fa';

const AssignmentDetail = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, deleteAssignment, getClass } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const data = await getAssignment(classId, assignmentId);
        setAssignment(data);
        
        // Load class data to check if user is teacher
        const classInfo = await getClass(classId);
        setClassData(classInfo);
        
        // Check if current user is the teacher
        const currentUser = localStorage.getItem('username');
        setIsTeacher(classInfo.teacher === currentUser);
      } catch (error) {
        showError('Failed to load assignment');
        console.error(error);
        navigate(`/classroom/${classId}`);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [classId, assignmentId]);

  const handleDeleteAssignment = async () => {
    try {
      await deleteAssignment(classId, assignmentId);
      showSuccess('Assignment deleted successfully');
      navigate(`/classroom/${classId}`);
    } catch (error) {
      showError('Failed to delete assignment');
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
            onClick={() => navigate(`/classroom/${classId}`)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
          >
            Back to Class
          </button>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <button
              onClick={() => navigate(`/classroom/${classId}`)}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Class
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {assignment.title}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Assignment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaClipboardList className="text-3xl text-cyan-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{assignment.questions?.length || 0}</div>
                  <div className="text-gray-300">Questions</div>
                </div>
                </div>
              </div>
              
            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaUsers className="text-3xl text-purple-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{assignment.submissions?.length || 0}</div>
                  <div className="text-gray-300">Submissions</div>
                  </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaClock className="text-3xl text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{assignment.timeLimit || '∞'}</div>
                  <div className="text-gray-300">Time Limit (s)</div>
                </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaCalendar className="text-3xl text-orange-400 mx-auto mb-4" />
                  <div className="text-lg font-bold text-white mb-2">
                    {assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date'}
        </div>
                  <div className="text-gray-300">Due Date</div>
              </div>
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-12">
            <Link
              to={`/classroom/${classId}/assignments/${assignmentId}/take`}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                  <FaPlay className="text-xl text-green-400" />
                  <span className="text-white font-semibold text-lg">
                    {isTeacher ? 'Preview Assignment' : 'Take Assignment'}
                  </span>
                </div>
              </div>
            </Link>

            {isTeacher && (
              <Link
                to={`/classroom/${classId}/assignments/${assignmentId}/grade`}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: '500ms' }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                    <FaEdit className="text-xl text-purple-400" />
                    <span className="text-white font-semibold text-lg">View Submissions</span>
                  </div>
                </div>
                </Link>
            )}
          </div>

          {/* Questions List */}
          <div className="group relative animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
              <div className="relative z-10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaGraduationCap className="mr-3 text-cyan-400" />
                  Questions
                </h2>
                
                {assignment.questions?.length === 0 ? (
                  <div className="text-center py-12">
                    <FaGraduationCap className="text-6xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Questions</h3>
                    <p className="text-gray-300">This assignment doesn't have any questions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignment.questions.map((question, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                    </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">{question.question}</h3>
                            {question.options && (
                              <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="text-gray-300 text-sm">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                                ))}
                  </div>
                            )}
                            <div className="mt-3 text-sm text-gray-400">
                              Type: {question.type || 'Text'} | 
                              Points: {question.points || 1} | 
                              Time: {question.timeLimit || assignment.timeLimit || '∞'}s
                  </div>
                    </div>
                  </div>
                </div>
                    ))}
        </div>
      )}
          </div>
        </div>
          </div>
          
          {/* Teacher Actions */}
          {isTeacher && (
            <div className="mt-8 text-center">
              <button
                onClick={handleDeleteAssignment}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
              >
                Delete Assignment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;