import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FaUsers, 
  FaGraduationCap, 
  FaArrowRight,
  FaArrowLeft
} from 'react-icons/fa'

const StudentView = ({ onSwitchToTeacher }) => {
  const studentFeatures = [
    {
      title: "Classroom Portal",
      description: "Access your classes, assignments, and track your progress",
      icon: FaGraduationCap,
      link: "/classroom",
      buttonText: "Enter Classroom",
      color: "from-pink-500 to-purple-600",
      glowColor: "pink"
    },
    {
      title: "Join Live Exam",
      description: "Participate in your scheduled oral examination with your teacher",
      icon: FaUsers,
      link: "/join-room",
      buttonText: "Join Room",
      color: "from-purple-500 to-purple-600",
      glowColor: "purple"
    },
    {
      title: "Practice Assignment",
      description: "Complete your assigned practice session for skill development",
      icon: FaGraduationCap,
      link: "/practice",
      buttonText: "Start Practice",
      color: "from-indigo-500 to-purple-600",
      glowColor: "indigo"
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic magenta gradient orbs with better movement */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/25 to-purple-600/25 rounded-full filter blur-3xl animate-pulse-slow animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/25 to-pink-600/25 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000 animate-float-slow-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000 animate-float-slow"></div>
        
        {/* Additional floating orbs */}
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-pink-400/15 to-purple-500/15 rounded-full filter blur-2xl animate-pulse-slow animation-delay-3000 animate-float-slow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full filter blur-2xl animate-pulse-slow animation-delay-1500 animate-float-slow-reverse"></div>
        
        {/* Enhanced floating particles with different sizes and colors */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-float ${
              i % 3 === 0 ? 'w-3 h-3 bg-pink-300/50' : 
              i % 3 === 1 ? 'w-2 h-2 bg-purple-300/40' : 
              'w-1 h-1 bg-pink-300/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}

        {/* Enhanced geometric shapes with rotation */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-pink-400/20 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-32 left-32 w-24 h-24 border border-purple-400/20 -rotate-45 animate-spin-slow-reverse"></div>
        <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-r from-pink-400/10 to-purple-500/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full animate-pulse-slow animation-delay-2500"></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Button for Teachers */}
          {onSwitchToTeacher && localStorage.getItem('token') && (
            <div className="text-center mb-8">
              <button
                onClick={onSwitchToTeacher}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <FaArrowLeft className="mr-2 w-4 h-4" />
                <span>Back to Teacher View</span>
              </button>
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-500 to-pink-600">
                Student Portal
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Complete your oral language examination or practice assignment
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studentFeatures.map((feature, index) => (
              <div
                key={index}
                className="group relative animate-fade-in-up"
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                <div className="relative overflow-hidden backdrop-blur-sm rounded-3xl transition-all duration-700 transform group-hover:scale-105 group-hover:-translate-y-3 group-hover:rotate-1">
                  {/* Card Background */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl"
                    style={{
                      boxShadow: `0 0 40px rgba(236, 72, 153, 0.15)`,
                    }}
                  />
                  
                  {/* Enhanced Animated Border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse-slow" />
                  
                  {/* Enhanced Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500/5 to-purple-600/5 group-hover:from-pink-500/15 group-hover:to-purple-600/15 transition-all duration-700" />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-pink-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                  {/* Content */}
                  <div className="relative z-10 p-10">
                    {/* Title with Icon */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/30 group-hover:shadow-2xl group-hover:shadow-pink-500/50 transition-all duration-500 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3">
                        <feature.icon className="text-2xl text-white group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-bold text-white group-hover:text-pink-300 transition-colors duration-500">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Enhanced Action Button */}
                    <Link
                      to={feature.link}
                      className="inline-flex items-center justify-center w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg rounded-2xl transition-all duration-500 transform group-hover:shadow-2xl group-hover:shadow-pink-500/50 group-hover:scale-105 group-hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Button Shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      <span className="relative z-10">{feature.buttonText}</span>
                      <FaArrowRight className="ml-3 w-5 h-5 transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-500" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentView

