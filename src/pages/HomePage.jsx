import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import TeacherView from "../components/TeacherView";
import StudentView from "../components/StudentView";
import { cuteAlert } from "cute-alert";

function HomePage({ maintenance }) {
  const [currentView, setCurrentView] = useState("teacher"); // 'teacher' or 'student'

  // Check if user is authenticated and determine their role
  useEffect(() => {
    const teacherToken = localStorage.getItem("token");
    const classroomUser = JSON.parse(localStorage.getItem("classroom_user") || '{}');
    
    if (teacherToken) {
      // If teacher token exists, show teacher view
      setCurrentView("teacher");
    } else if (classroomUser.isAuthenticated && classroomUser.userType === 'student') {
      // If student is authenticated, show student view
      setCurrentView("student");
    } else {
      // If no authentication, show student view by default
      setCurrentView("student");
    }
  }, []);

  return (
    <div style={{ fontFamily: "Montserrat" }}>
      {/* Hero Section */}
      {maintenance ? (
        <Hero
          title={"SpeakEval is undergoing maintenance."}
          subtitle={
            "Some features may not work as expected. Please check back later"
          }
          static={true}
        />
      ) : (
        <Hero
          title={[
            "Welcome To SpeakEval",
            "Bienvenidos a SpeakEval",
            "Bienvenue sur SpeakEval",
            "歡迎來到 SpeakEval",
            "SpeakEval へようこそ",
          ]}
          subtitle="Committed to making oral exams hands-free, quick, and easy!"
        />
      )}

      {/* Dynamic Content */}
      {currentView === "teacher" ? (
        <TeacherView />
      ) : (
        <StudentView onSwitchToTeacher={() => setCurrentView("teacher")} />
      )}

      {/* Quick Access for Teachers */}
      {currentView === "teacher" && (
        <div className="text-center mt-12 mb-8">
          <p className="text-gray-400 mb-4">
            Want to test the student experience?
          </p>
          <button
            onClick={() => setCurrentView("student")}
            className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40"
          >
            <span>Switch to Student View</span>
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;
