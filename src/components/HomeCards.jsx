import React, { useState, useEffect } from "react";
import Card from "./Card2";
import { Link } from "react-router-dom";

// This component displays a set of cards based on the user's role (teacher or student).
// A user is considered a teacher if a 'token' exists in local storage.
function HomeCards() {
  // State to determine if the user is a teacher, based on the presence of a token.
  const [isTeacher, setIsTeacher] = useState(false);
  // State to manage the view for teachers, allowing them to toggle between teacher and student cards.
  const [isTeacherView, setIsTeacherView] = useState(true);

  // useEffect runs once when the component mounts to check for the teacher token.
  useEffect(() => {
    // Check if a token exists in local storage.
    const token = localStorage.getItem("token");
    // If a token is found, set isTeacher to true.
    if (token) {
      setIsTeacher(true);
    }
  }, []);

  // Handler function to toggle the view for teachers.
  const handleViewToggle = () => {
    setIsTeacherView(!isTeacherView);
  };

  const colorMap = {
    rose: {
      hoverFrom: "hover:from-rose-400/30",
      hoverTo: "hover:to-pink-500/",
      hoverShadow: "hover:shadow-rose-400/30",
    },
    blue: {
      hoverFrom: "hover:from-blue-500/30",
      hoverTo: "hover:to-cyan-600/",
      hoverShadow: "hover:shadow-blue-500/30",
    },
    pink: {
      hoverFrom: "hover:from-pink-400/30",
      hoverTo: "hover:to-rose-500/",
      hoverShadow: "hover:shadow-pink-400/30",
    },
    cyan: {
      hoverFrom: "hover:from-cyan-500/30",
      hoverTo: "hover:to-sky-600/",
      hoverShadow: "hover:shadow-cyan-500/30",
    },
    purple: {
      hoverFrom: "hover:from-purple-800/30",
      hoverTo: "hover:to-pink-700/",
      hoverShadow: "hover:shadow-purple-500/30",
    },
    teal: {
      hoverFrom: "hover:from-teal-400/30",
      hoverTo: "hover:to-cyan-500/",
      hoverShadow: "hover:shadow-teal-400/30",
    },
  };

  // Define the card data for teachers with an added 'category' property.
  // Reordered to reflect the workflow: Content Creation -> Class Management -> Assessment & Grading
  const teacherCards = [
    {
      title: "Question Bank",
      description:
        "For teacher use. Create a new set: configure rubric, settings, and question bank.",
      link: "/configure",
      buttonText: "Create",
      color: "rose",
      category: "Content & Materials",
    },
    {
      title: "Update Question Bank",
      description:
        "For teacher use. Update an existing set: modify rubric, settings, and question bank.",
      link: "/update",
      buttonText: "Update",
      color: "blue",
      category: "Content & Materials",
    },
    {
      title: "Create Room",
      description: "For Teacher Use. Create a room for your students.",
      link: "/create-room",
      buttonText: "Create",
      color: "pink",
      category: "Assessments",
    },
    {
      title: "Create Practice",
      description:
        "For Teacher Use. Create an asynchronous ungraded practice session for your students.",
      link: "/create-practice",
      buttonText: "Create",
      color: "cyan",
      category: "Assessments",
    },
    {
      title: "Grade Rooms",
      description: "For Teacher Use. Grade your students' submissions",
      link: "/teacher-portal",
      buttonText: "Grade",
      color: "purple",
      category: "Grading",
    },
    {
      title: "Grade Practice Sets",
      description:
        "For Teacher Use. Check the completions and grade the practice sets you assigned to your students",
      link: "/practice-exams",
      buttonText: "Grade",
      color: "teal",
      category: "Grading",
    },
  ];

  // Define the card data for students.
  const studentCards = [
    {
      title: "Join Room",
      description: "Join a room created by your teacher.",
      link: "/join-room",
      buttonText: "Join",
      color: "rose",
    },
    {
      title: "Join Practice",
      description: "Join a practice session created by your teacher.",
      link: "/practice",
      buttonText: "Join",
      color: "cyan",
    },
  ];

  // Group the teacher cards by category for a more organized display.
  const groupedTeacherCards = teacherCards.reduce((acc, card) => {
    (acc[card.category] = acc[card.category] || []).push(card);
    return acc;
  }, {});

  // The main render logic. The content shown depends on the user's role and the current view state.
  return (
    <section className="py-0 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {isTeacher ? (
          // If the user is a teacher, show the teacher-specific layout with the toggle button.
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                {isTeacherView ? "Teacher Resources" : "Student Resources"}
              </span>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            </h2>

            {/* Toggle button to switch between teacher and student views */}
            <div className="text-center mb-8">
              <button
                onClick={handleViewToggle}
                className="px-6 py-2 rounded-full font-medium text-white bg-black/50 hover:bg-black/70 transition-all duration-300 border border-gray-700 hover:border-cyan-500"
              >
                {isTeacherView
                  ? "Switch to Student View"
                  : "Switch to Teacher View"}
              </button>
            </div>

            {isTeacherView ? (
              // Display grouped teacher cards
              Object.entries(groupedTeacherCards).map(
                ([category, cards], categoryIndex) => (
                  <div key={categoryIndex} className="mb-12">
                    {/* --- MODIFIED CODE BLOCK START --- */}
                    <h3 className="text-2xl font-bold text-white text-center mb-6 relative pb-2">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                        {category}
                      </span>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"></div>
                    </h3>
                    {/* --- MODIFIED CODE BLOCK END --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {cards.map((card, index) => (
                        <div
                          key={index}
                          className="transform transition-all duration-500"
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: "fadeInUp 0.5s ease-out forwards",
                          }}
                        >
                          <Card
                            color={card.color}
                            className="h-full flex flex-col"
                          >
                            <h2 className="text-2xl font-bold text-white mb-2">
                              {card.title}
                            </h2>
                            <p className="mt-2 mb-6 text-gray-300 flex-grow">
                              {card.description}
                            </p>
                            <Link
                              to={card.link}
                              className={`
    inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white 
    bg-black/50 hover:bg-gradient-to-r transition-all duration-300 hover:shadow-lg group
    ${colorMap[card.color].hoverFrom} 
    ${colorMap[card.color].hoverTo} 
    ${colorMap[card.color].hoverShadow}
  `}
                            >
                              <span>{card.buttonText}</span>
                              <svg
                                className="ml-2 w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
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
                            </Link>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )
            ) : (
              // Display student cards
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {studentCards.map((card, index) => (
                  <div
                    key={index}
                    className="transform transition-all duration-500"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeInUp 0.5s ease-out forwards",
                    }}
                  >
                    <Card color={card.color} className="h-full flex flex-col">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {card.title}
                      </h2>
                      <p className="mt-2 mb-6 text-gray-300 flex-grow">
                        {card.description}
                      </p>
                      <Link
                        to={card.link}
                        className={`
    inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white 
    bg-black/50 hover:bg-gradient-to-r transition-all duration-300 hover:shadow-lg group
    ${colorMap[card.color].hoverFrom} 
    ${colorMap[card.color].hoverTo} 
    ${colorMap[card.color].hoverShadow}
  `}
                      >
                        <span>{card.buttonText}</span>
                        <svg
                          className="ml-2 w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
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
                      </Link>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // If the user is not a teacher, just show the student section.
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white text-center mb-8 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Student Resources
              </span>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {studentCards.map((card, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <Card color={card.color} className="h-full flex flex-col">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {card.title}
                    </h2>
                    <p className="mt-2 mb-6 text-gray-300 flex-grow">
                      {card.description}
                    </p>
                    <Link
                      to={card.link}
                      className={`
    inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white 
    bg-black/50 hover:bg-gradient-to-r transition-all duration-300 hover:shadow-lg group
    ${colorMap[card.color].hoverFrom} 
    ${colorMap[card.color].hoverTo} 
    ${colorMap[card.color].hoverShadow}
  `}
                    >
                      <span>{card.buttonText}</span>
                      <svg
                        className="ml-2 w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
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
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeCards;
