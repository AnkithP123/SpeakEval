import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaPlus, FaUsers, FaGraduationCap, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';
import { cookieUtils } from '../../utils/cookieUtils';

const ClassroomNavbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const updateUserFromStorage = () => {
    // Get user from localStorage - check both main site and classroom authentication
    const mainSiteUsername = localStorage.getItem('username');
    const classroomUserStr = localStorage.getItem('classroom_user');
    
    if (classroomUserStr) {
      try {
        const classroomUser = JSON.parse(classroomUserStr);
        if (classroomUser.isAuthenticated && classroomUser.username) {
          setUser({ 
            username: classroomUser.username,
            userType: classroomUser.userType,
            isTeacher: classroomUser.userType === 'teacher',
            isStudent: classroomUser.userType === 'student'
          });
          return;
        }
      } catch (error) {
        console.error('Error parsing classroom user:', error);
      }
    }
    
    // Fallback to main site authentication
    if (mainSiteUsername) {
      setUser({ username: mainSiteUsername, userType: 'teacher', isTeacher: true });
    }
  };

  useEffect(() => {
    // Initial load
    updateUserFromStorage();
    
    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e) => {
      if (e.key === 'classroom_user' || e.key === 'username') {
        updateUserFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleUserUpdate = () => {
      updateUserFromStorage();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    // Clear all authentication data
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('pin');
    localStorage.removeItem('gold');
    localStorage.removeItem('ultimate');
    localStorage.removeItem('classroom_user');
    localStorage.removeItem('classroom_token');
    localStorage.removeItem('speakeval_student_token');
    localStorage.removeItem('speakeval_room_session');
    
    // Clear all cookies using centralized utility
    cookieUtils.deleteCookie('auth_token', { path: '/' });
    cookieUtils.deleteCookie('token', { path: '/' });
    cookieUtils.deleteCookie('classroom_token', { path: '/' });
    
    // Try to clear httpOnly cookies via server endpoint
    try {
      await fetch('https://www.server.speakeval.org/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.log('Server logout endpoint not available, continuing with client-side cleanup');
    }
    
    // Dispatch custom event to update navbar
    window.dispatchEvent(new CustomEvent('userUpdated'));
    
    // Navigate to home page
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-cyan-500/30"
          : "bg-gradient-to-r from-blue-900/90 to-purple-900/90 backdrop-blur-sm"
      }`}
      style={{ fontFamily: "Montserrat" }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex flex-1 items-center justify-center md:justify-start">
            <Link
              className="flex flex-shrink-0 items-center mr-4 group transform transition-transform duration-300 hover:scale-105"
              to="/"
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 animate-spin-slow opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  className="h-[70px] w-[70px] relative p-[3px] transform transition-transform duration-300"
                  src="/logo.png"
                  alt="SpeakEval"
                  onError={(e) => {
                    e.target.src = "/logo.png";
                  }}
                />
              </div>
              <span
                className="hidden md:block text-[50px] font-bold ml-[-10px] transition-all duration-300 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500"
                style={{
                  fontFamily: "Montserrat",
                  textShadow: "0 0 15px rgba(80, 200, 255, 0.5)",
                }}
              >
                SpeakEval
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/classroom"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/classroom')
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-cyan-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaHome className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/classroom/create"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/classroom/create')
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-cyan-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaPlus className="w-4 h-4" />
              <span>Create Class</span>
            </Link>
            
            <Link
              to="/classroom/join"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/classroom/join')
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-cyan-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaUsers className="w-4 h-4" />
              <span>Join Class</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="relative dropdown" ref={dropdownRef}>
                  <button
                    ref={buttonRef}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onMouseEnter={() => setHoverButton(true)}
                    onMouseLeave={() => setHoverButton(false)}
                    className={`relative overflow-hidden text-white text-base rounded-md px-5 py-2.5 flex items-center transition-all duration-300 ${
                      hoverButton || dropdownOpen
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                        : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <FaUser className="w-4 h-4 mr-2" />
                      {user.username}
                      <svg
                        className={`ml-2 h-5 w-5 transition-transform duration-300 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-md shadow-lg py-1 z-10 animate-fade-in">
                      <button
                        onClick={() => navigate('/')}
                        className="block px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 w-full text-left transition-colors duration-200 flex items-center"
                      >
                        <FaHome className="w-4 h-4 mr-2" />
                        Main Site
                      </button>
                      <button
                        onClick={() => navigate('/configure')}
                        className="block px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 w-full text-left transition-colors duration-200 flex items-center"
                      >
                        <FaCog className="w-4 h-4 mr-2" />
                        Manage Sets
                      </button>
                      <button
                        onClick={() => navigate('/practice-exams')}
                        className="block px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 w-full text-left transition-colors duration-200 flex items-center"
                      >
                        <FaGraduationCap className="w-4 h-4 mr-2" />
                        Practice Exams
                      </button>
                      <div className="border-t border-cyan-500/30 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 w-full text-left transition-colors duration-200 flex items-center"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                onMouseEnter={() => setHoverButton(true)}
                onMouseLeave={() => setHoverButton(false)}
                className={`relative overflow-hidden text-white text-base rounded-md px-5 py-2.5 transition-all duration-300 ${
                  hoverButton
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30"
                    : "bg-gradient-to-r from-cyan-600/50 to-purple-700/50"
                }`}
              >
                <span className="relative z-10">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ClassroomNavbar;
