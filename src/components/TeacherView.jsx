import React from "react";
import { Link } from "react-router-dom";
import {
  FaCog,
  FaPlay,
  FaGraduationCap,
  FaPlus,
  FaList,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

const TeacherView = () => {
  const sections = [
    {
      title: "Content & Materials",
      description: "Create and manage your exam configurations",
      color: "from-cyan-500 to-blue-600",
      glowColor: "cyan",
      icon: FaCog,
      cards: [
        {
          title: "Create Question Set",
          description:
            "Create a new set: configure rubric, settings, and question bank.",
          link: "/configure",
          icon: FaPlus,
          buttonText: "Configure",
        },
        {
          title: "Update Question Sets",
          description:
            "Update an existing set: modify rubric, settings, and question bank.",
          link: "/update", // This will be updated when we implement the management view
          icon: FaList,
          buttonText: "Update",
        },
      ],
    },
    {
      title: "Assessments",
      description: "Manage live and ongoing exam sessions",
      color: "from-blue-500 to-indigo-600",
      glowColor: "blue",
      icon: FaPlay,
      cards: [
        {
          title: "Create Room",
          description: "Start a new live exam session for your students",
          link: "/create-room",
          icon: FaPlay,
          buttonText: "Create",
        },
        {
          title: "Create Practice",
          description:
            "Set up a practice session for students to complete independently",
          link: "/create-practice",
          icon: FaGraduationCap,
          buttonText: "Create",
        },
      ],
    },
    {
      title: "Grading",
      description: "Manage classes, assignments, and student progress",
      color: "from-indigo-500 to-purple-600",
      glowColor: "indigo",
      icon: FaGraduationCap,
      cards: [
        {
          title: "Grade Live Room",
          description:
            "Review and grade completed student responses from live sessions",
          link: "/teacher-portal",
          icon: FaCheckCircle,
          buttonText: "Grade Room",
        },
        {
          title: "View Practice Responses",
          description:
            "Review and grade practice exam submissions from students",
          link: "/practice-exams",
          icon: FaGraduationCap,
          buttonText: "View Practice",
        },
        {
          title: "Classroom Dashboard",
          description:
            "Create classes, manage assignments, and track student progress",
          link: "/classroom",
          icon: FaGraduationCap,
          buttonText: "Manage Classes",
        },
      ],
    },
  ];

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
                Teacher Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to create, manage, and assess oral language
              examinations
            </p>
          </div>

          {/* Sections Grid */}
          <div className="space-y-16">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="relative">
                {/* Section Header */}
                <div
                  className="text-center mb-12 animate-fade-in-up"
                  style={{ animationDelay: `${sectionIndex * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-500/30">
                    <section.icon className="text-2xl text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {section.title}
                  </h2>
                </div>

                {/* Section Cards */}
                <div
                  className={`grid gap-8 ${
                    section.cards.length === 1
                      ? "grid-cols-1 max-w-2xl mx-auto"
                      : "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
                  }`}
                >
                  {section.cards.map((card, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="group relative animate-fade-in-up"
                      style={{
                        animationDelay: `${
                          sectionIndex * 200 + cardIndex * 100
                        }ms`,
                      }}
                    >
                      <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-2">
                        {/* Card Background */}
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl"
                          style={{
                            boxShadow: `0 0 30px rgba(6, 182, 212, 0.1)`,
                          }}
                        />

                        {/* Animated Border */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-blue-600/5 group-hover:from-cyan-500/10 group-hover:to-blue-600/10 transition-all duration-500" />

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                        {/* Random Light Flashes */}
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-300"></div>
                        <div className="absolute bottom-4 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-600"></div>
                        <div className="absolute top-1/2 right-6 w-1 h-1 bg-cyan-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-900"></div>

                        {/* Content */}
                        <div className="relative z-10 p-8">
                          {/* Title with Icon */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                              <card.icon className="text-lg text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                              {card.title}
                            </h3>
                          </div>
                          <p className="text-gray-300 mb-6 leading-relaxed">
                            {card.description}
                          </p>

                          {/* Action Button */}
                          <Link
                            to={card.link}
                            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform group-hover:shadow-lg group-hover:shadow-cyan-500/30 group-hover:scale-105"
                          >
                            <span>{card.buttonText}</span>
                            <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherView;
