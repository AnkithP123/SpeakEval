import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft, FaUser, FaEnvelope, FaCalendar, FaGraduationCap, FaTrophy, FaClipboardList } from 'react-icons/fa';

const StudentList = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { getClass, removeStudent } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const data = await getClass(classId);
        setClassData(data);
        
        // Check if current user is the teacher
        const currentUser = localStorage.getItem('username');
        setIsTeacher(data.teacher === currentUser);
      } catch (error) {
        showError('Failed to load class');
        navigate('/classroom');
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  const handleRemoveStudent = async (studentId) => {
    try {
      await removeStudent(classId, studentId);
      showSuccess('Student removed successfully');
      // Reload class data
      const data = await getClass(classId);
      setClassData(data);
    } catch (error) {
      showError('Failed to remove student');
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
          <p className="text-white text-lg">Loading students...</p>
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
              onClick={() => navigate(`/classroom/${classId}`)}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Class
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {classData.name} - Students
                  </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Manage and view all students enrolled in this class
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
                  <div className="text-3xl font-bold text-white mb-2">{classData.students?.length || 0}</div>
                  <div className="text-gray-300">Total Students</div>
                </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaClipboardList className="text-3xl text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{classData.assignments?.length || 0}</div>
                  <div className="text-gray-300">Assignments</div>
                </div>
              </div>
            </div>


            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <FaCalendar className="text-3xl text-orange-400 mx-auto mb-4" />
                  <div className="text-lg font-bold text-white mb-2">{formatDate(classData.createdAt)}</div>
                  <div className="text-gray-300">Class Created</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
          {/* Students List */}
          <div className="group relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
              <div className="relative z-10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaUser className="mr-3 text-cyan-400" />
                  Enrolled Students
                </h2>
                
                {classData.students?.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUser className="text-6xl text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Students Yet</h3>
                    <p className="text-gray-300 mb-6">Students can join this class using the join code: <span className="font-mono text-cyan-400">{classData.joinCode}</span></p>
                    <Link
                      to={`/classroom/${classId}`}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                    >
                      Back to Class
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classData.students.map((student, index) => (
                      <div key={student.id} className="bg-slate-800/50 rounded-xl p-6 border border-gray-600 hover:border-cyan-400 transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {(student.fullName || student.name)?.charAt(0) || 'S'}
                      </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {student.fullName || student.name || `Student ${index + 1}`}
                              </h3>
                              <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                                <span className="flex items-center">
                                  <FaEnvelope className="mr-1" />
                                  {student.email || 'No email provided'}
                                </span>
                                <span className="flex items-center">
                                  <FaCalendar className="mr-1" />
                                  Joined: {formatDate(student.joinedAt || classData.createdAt)}
                                </span>
                                <span className="flex items-center">
                                  <FaGraduationCap className="mr-1" />
                                  Assignments: {student.completedAssignments || 0}
                      </span>
                              </div>
                              {student.averageGrade !== undefined && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-400">Average Grade:</span>
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    student.averageGrade >= 90 ? 'bg-green-500/20 text-green-400' :
                                    student.averageGrade >= 80 ? 'bg-blue-500/20 text-blue-400' :
                                    student.averageGrade >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {student.averageGrade}%
                    </div>
                  </div>
                    )}
                  </div>
                  </div>
                          {isTeacher && (
                            <div className="flex items-center space-x-2">
                      <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                              >
                                Remove
                      </button>
                    </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                </div>
          </div>

          {/* Join Code Display */}
          <div className="mt-8 text-center">
            <div className="inline-block bg-slate-800/50 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-bold text-white mb-2">Class Join Code</h3>
              <div className="text-2xl font-mono text-cyan-400 bg-slate-900/50 rounded-lg px-4 py-2">
                {classData.joinCode}
              </div>
              <p className="text-sm text-gray-400 mt-2">Share this code with students to let them join the class</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;