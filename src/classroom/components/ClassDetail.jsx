import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowLeft, FaPlus, FaUsers, FaClipboardList, FaCalendar, FaCode, FaGraduationCap, FaPlay, FaEye, FaEdit, FaClock } from 'react-icons/fa';

const ClassDetail = () => {
  const { token: authToken } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const { getClass, deleteClass } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const data = await getClass(classId);
        setClassData(data);
        
        // Determine role from JWT/classroom_user
        const decodeJwt = (jwt) => {
          try {
            const payload = jwt.split('.') [1];
            const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            try { return JSON.parse(decodeURIComponent(escape(json))); } catch { return JSON.parse(json); }
          } catch { return null; }
        };

        const token = authToken || localStorage.getItem('classroom_token');
        const decoded = token ? decodeJwt(token) : null;
        const classroomUser = JSON.parse(localStorage.getItem('classroom_user') || '{}');
        const userType = decoded?.userType || decoded?.role || classroomUser?.userType;
        const username = decoded?.username || localStorage.getItem('username') || classroomUser?.username;

        setIsTeacher(userType === 'teacher' && username && data.teacher === username);
      } catch (error) {
        showError('Failed to load class');
        navigate('/classroom');
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  const handleDeleteClass = async () => {
    try {
      // Call backend delete endpoint
      const token = authToken || localStorage.getItem('classroom_token');
      const res = await fetch(`https://www.server.speakeval.org/classroom/${classId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete class');
      }
      showSuccess('Class deleted successfully');
      navigate('/classroom');
    } catch (error) {
      showError('Failed to delete class');
    }
  };

  const formatDate = (timestamp) => {
    // Handle both epoch timestamps and ISO strings
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Class not found</h1>
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
              onClick={() => navigate('/classroom')}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {classData.name}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {classData.description}
            </p>
          </div>

          {/* Class Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {isTeacher && (
              <div className="group relative animate-fade-in-up">
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 p-6 text-center">
                    <FaUsers className="text-3xl text-cyan-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">{classData.students?.length || 0}</div>
                    <div className="text-gray-300">Students</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaClipboardList className="text-3xl text-purple-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{classData.assignments?.length || 0}</div>
                  <div className="text-gray-300">Assignments</div>
                </div>
              </div>
            </div>
            
            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaCalendar className="text-3xl text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{formatDate(classData.createdAt)}</div>
                  <div className="text-gray-300">Created</div>
            </div>
          </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaCode className="text-3xl text-orange-400 mx-auto mb-4" />
                  <div className="text-lg font-bold text-white mb-2 font-mono">{classData.joinCode}</div>
                  <div className="text-gray-300">Join Code</div>
            </div>
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-12">
          {isTeacher && (
              <Link
                to={`/classroom/${classId}/assignments/create`}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                    <FaPlus className="text-xl text-cyan-400" />
                    <span className="text-white font-semibold text-lg">Create Assignment</span>
                  </div>
                </div>
              </Link>
            )}

            {isTeacher && (
              <Link
                to={`/classroom/${classId}/students`}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: '500ms' }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                    <FaUsers className="text-xl text-purple-400" />
                    <span className="text-white font-semibold text-lg">View Students</span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Assignments List */}
          <div className="group relative animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
              <div className="relative z-10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaClipboardList className="mr-3 text-cyan-400" />
                  Assignments
                </h2>
                
                {classData.assignments?.length === 0 ? (
                  <div className="text-center py-12">
                    <FaClipboardList className="text-6xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Assignments Yet</h3>
                    <p className="text-gray-300 mb-6">Create your first assignment to get started</p>
                  {isTeacher && (
                      <Link
                        to={`/classroom/${classId}/assignments/create`}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                      >
                        Create Assignment
                    </Link>
                  )}
                </div>
                ) : (
                  <div className="space-y-4">
                    {classData.assignments.map((assignment, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                            <p className="text-gray-300 mb-2">{assignment.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span className="flex items-center">
                                <FaCalendar className="mr-1" />
                                Due: {assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date'}
                              </span>
                              <span className="flex items-center">
                                <FaClock className="mr-1" />
                                {assignment.timeLimit}s per question
                              </span>
                              <span className="flex items-center">
                                <FaGraduationCap className="mr-1" />
                                {assignment.numQuestions ?? (assignment.questions?.length || 0)} questions
                              </span>
            </div>
                </div>
                          <div className="flex space-x-2">
                            {isTeacher && (
                              <Link
                                to={`/classroom/${classId}/assignments/${assignment.id}`}
                                className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all duration-300"
                              >
                                <FaEye className="w-4 h-4" />
                              </Link>
                            )}
                  {isTeacher && (
                              <Link
                                to={`/classroom/${classId}/assignments/${assignment.id}/grade`}
                                className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-300"
                              >
                                <FaEdit className="w-4 h-4" />
                              </Link>
          )}
        </div>
      </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4">
                            <span className="text-sm text-gray-400">
                              Created: {formatDate(assignment.created)}
                            </span>
                            {isTeacher && (
                              <span className="text-sm text-gray-400">
                                Submissions: {assignment.submissionsCount ?? (assignment.submissions?.length || 0)}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/classroom/${classId}/assignments/${assignment.id}/take`}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center"
                          >
                            <FaPlay className="mr-2" />
                            {isTeacher ? 'Preview' : 'Take Assignment'}
                          </Link>
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
                onClick={handleDeleteClass}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
              >
                Delete Class
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;