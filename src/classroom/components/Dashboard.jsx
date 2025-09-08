import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaUsers, FaGraduationCap, FaChalkboardTeacher, FaUserGraduate, FaClipboardList, FaFire, FaArrowRight, FaCalendarAlt, FaBell } from 'react-icons/fa';

const Dashboard = () => {
  const { classes, loading, error, fetchClasses } = useClassroom();
  const { showError } = useToast();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState({ isTeacher: false, isStudent: false });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check for teacher authentication first
        const teacherToken = localStorage.getItem('token');
        const teacherUsername = localStorage.getItem('username');
        
        // Check for classroom authentication first (handles both teachers and students)
        const classroomUserStr = localStorage.getItem('classroom_user');
        if (classroomUserStr) {
          const userData = JSON.parse(classroomUserStr);
          
          // Validate authentication
          if (!userData.isAuthenticated) {
            console.error('Invalid classroom authentication in Dashboard');
            return;
          }
          
          setUser(userData);
          
          // Determine user role
          const isStudent = userData.userType === 'student';
          const isTeacher = userData.userType === 'teacher';
          
          setUserRole({ isTeacher, isStudent });
        } else if (teacherToken && teacherUsername) {
          // Fallback: User is authenticated as teacher through main site
          setUser({
            username: teacherUsername,
            userType: 'teacher',
            isAuthenticated: true
          });
          setUserRole({ isTeacher: true, isStudent: false });
        } else {
          // No authentication at all - this should not happen due to AuthRequired
          console.error('No authentication found in Dashboard');
          return;
        }
        
        await fetchClasses();
      } catch (error) {
        showError('Failed to load classes');
      }
    };
    
    loadData();
  }, [location.pathname]); // Refresh when location changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
        <LoadingSpinner size="large" />
          <p className="text-white text-lg mt-4">Loading your classes...</p>
        </div>
      </div>
    );
  }

  // Don't render if no valid user is authenticated
  if (!user || !user.isAuthenticated) {
    return null;
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUpcomingAssignments = () => {
    const upcoming = [];
    classes.forEach(classData => {
      classData.assignments?.forEach(assignment => {
        if (assignment.dueDate && new Date(assignment.dueDate) > new Date()) {
          upcoming.push({
            ...assignment,
            className: classData.name,
            classId: classData.id
          });
        }
      });
    });
    return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
  };

  const getRecentActivity = () => {
    const activity = [];
    classes.forEach(classData => {
      // Add recent announcements
      classData.announcements?.slice(0, 3).forEach(announcement => {
        activity.push({
          type: 'announcement',
          title: announcement.title,
          content: announcement.content,
          className: classData.name,
          classId: classData.id,
          timestamp: announcement.created
        });
      });
      
      // Add recent assignments
      classData.assignments?.slice(0, 2).forEach(assignment => {
        activity.push({
          type: 'assignment',
          title: assignment.title,
          content: `New assignment created`,
          className: classData.name,
          classId: classData.id,
          assignmentId: assignment.id,
          timestamp: assignment.created
        });
      });
    });
    
    return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  };

  const teachingClasses = classes.filter(c => c.teacher === user?.username);
  const enrolledClasses = classes.filter(c => 
    c.students?.some(student => student.username === user?.username)
  );

  const upcomingAssignments = getUpcomingAssignments();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blue gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/15 to-indigo-600/15 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
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

        {/* Random light flashes */}
        <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-cyan-300 rounded-full opacity-0 animate-ping animation-delay-500"></div>
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-0 animate-ping animation-delay-1000"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-cyan-400 rounded-full opacity-0 animate-ping animation-delay-1500"></div>
        <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 animate-ping animation-delay-2000"></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                Classroom Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Welcome back, {user?.fullName || user?.username || 'Student'}! {userRole.isStudent ? 'View your classes and assignments' : 'Manage your classes and assignments'}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="group relative animate-fade-in-up">
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
                    <FaChalkboardTeacher className="text-xl text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{teachingClasses.length}</div>
                  <div className="text-gray-300">Teaching</div>
                </div>
          </div>
        </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                    <FaUserGraduate className="text-xl text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{enrolledClasses.length}</div>
                  <div className="text-gray-300">Enrolled</div>
                </div>
              </div>
            </div>

            <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                    <FaClipboardList className="text-xl text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{upcomingAssignments.length}</div>
                  <div className="text-gray-300">Upcoming</div>
                </div>
            </div>
          </div>
          
            <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <FaFire className="text-xl text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{recentActivity.length}</div>
                  <div className="text-gray-300">Recent</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-12">
            {userRole.isTeacher && (
              <Link
                to="/classroom/create"
                className="group relative animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                    <FaPlus className="text-xl text-cyan-400" />
                    <span className="text-white font-semibold text-lg">Create Class</span>
                    <FaArrowRight className="text-cyan-400 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
              </Link>
            )}

            {userRole.isStudent && (
              <Link
                to="/classroom/join"
                className="group relative animate-fade-in-up"
                style={{ animationDelay: '500ms' }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 px-8 py-4 flex items-center space-x-3">
                    <FaUsers className="text-xl text-purple-400" />
                    <span className="text-white font-semibold text-lg">Join Class</span>
                    <FaArrowRight className="text-purple-400 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
            </div>
              </Link>
            )}
        </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Teaching Classes */}
            {teachingClasses.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaChalkboardTeacher className="mr-3 text-cyan-400" />
                  Classes You're Teaching
                </h2>
                <div className="space-y-4">
                  {teachingClasses.map(classData => (
                    <ClassCard 
                      key={classData.id} 
                      classData={classData} 
                      role="teacher"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Classes */}
            {enrolledClasses.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FaUserGraduate className="mr-3 text-purple-400" />
                  Classes You're Enrolled In
                </h2>
                <div className="space-y-4">
                  {enrolledClasses.map(classData => (
                    <ClassCard 
                      key={classData.id} 
                      classData={classData} 
                      role="student"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {classes.length === 0 && (
              <div className="col-span-2 text-center py-16">
                <div className="text-6xl mb-6">📚</div>
                <h3 className="text-3xl font-bold text-white mb-4">No Classes Yet</h3>
                <p className="text-gray-300 mb-8 text-lg">
                  {userRole.isStudent 
                    ? 'Join a class using a class code to get started!' 
                    : 'Create your first class or join one using a class code to get started!'
                  }
                </p>
                <div className="flex justify-center gap-4">
                  {userRole.isTeacher && (
                    <Link
                      to="/classroom/create"
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                    Create Your First Class
                  </Link>
                  )}
                  {userRole.isStudent && (
                    <Link
                      to="/classroom/join"
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                    >
                    Join with Code
                  </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Content */}
          {(upcomingAssignments.length > 0 || recentActivity.length > 0) && (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Assignments */}
            {upcomingAssignments.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <FaCalendarAlt className="mr-3 text-green-400" />
                    Upcoming Assignments
                  </h3>
                  <div className="space-y-4">
                  {upcomingAssignments.map(assignment => (
                      <div key={assignment.id} className="group relative">
                        <div className="relative overflow-hidden backdrop-blur-sm rounded-xl transition-all duration-300 transform group-hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl" />
                          <div className="relative z-10 p-4">
                            <h4 className="text-white font-semibold mb-2">{assignment.title}</h4>
                            <p className="text-gray-300 text-sm mb-1">{assignment.className}</p>
                            <p className="text-green-400 text-sm">Due {formatDate(assignment.dueDate)}</p>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <FaBell className="mr-3 text-orange-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                      <div key={index} className="group relative">
                        <div className="relative overflow-hidden backdrop-blur-sm rounded-xl transition-all duration-300 transform group-hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl" />
                          <div className="relative z-10 p-4">
                            <h4 className="text-white font-semibold mb-2">{activity.title}</h4>
                            <p className="text-gray-300 text-sm mb-1">{activity.className}</p>
                            <p className="text-gray-400 text-xs">{formatDate(activity.timestamp)}</p>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClassCard = ({ classData, role }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAssignmentStats = () => {
    const total = classData.assignments?.length || 0;
    const upcoming = classData.assignments?.filter(a => 
      a.dueDate && new Date(a.dueDate) > new Date()
    ).length || 0;
    
    return { total, upcoming };
  };

  const stats = getAssignmentStats();

  return (
    <Link to={`/classroom/${classData.id}`} className="group relative">
      <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          role === 'teacher' 
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20' 
            : 'bg-gradient-to-r from-purple-500/20 to-pink-600/20'
        }`} />
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        
        {/* Random Light Flashes */}
        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-300"></div>
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-600"></div>
        <div className="absolute top-1/2 right-6 w-1 h-1 bg-cyan-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-900"></div>

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                {classData.name}
              </h3>
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {classData.description}
              </p>
          {classData.subject && (
                <span className="inline-block bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-medium">
                  {classData.subject}
                </span>
          )}
        </div>
            <div className="ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                role === 'teacher' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
              }`}>
            {role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {role}
          </span>
        </div>
      </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{classData.students?.length || 0}</div>
              <div className="text-xs text-gray-400">Students</div>
        </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-xs text-gray-400">Assignments</div>
        </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.upcoming}</div>
              <div className="text-xs text-gray-400">Upcoming</div>
        </div>
      </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span className="font-mono bg-gray-800/50 px-2 py-1 rounded">
              {classData.joinCode}
            </span>
            <span>Created {formatDate(classData.created)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;