import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaPlus, FaArrowLeft, FaUsers, FaBook, FaCalendar, FaInfoCircle } from 'react-icons/fa';

const CreateClass = () => {
  const navigate = useNavigate();
  const { createClass } = useClassroom();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdClass, setCreatedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const classData = {
        ...formData,
        created: Date.now(),
        teacher: localStorage.getItem('username'),
        students: [],
        assignments: [],
        announcements: []
      };

      const newClass = await createClass(classData);
      setCreatedClass(newClass);
      showSuccess('Class created successfully!');
    } catch (error) {
      showError('Failed to create class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
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
                {createdClass ? 'Class Created Successfully!' : 'Create New Class'}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {createdClass 
                ? 'Your class has been created and is ready for students to join'
                : 'Set up a new class and start managing assignments for your students'
              }
            </p>
          </div>

          {createdClass ? (
            /* Success Screen */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Success Card */}
              <div className="lg:col-span-2">
                <div className="group relative animate-fade-in-up">
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-emerald-800/80 rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 p-8">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaPlus className="text-white text-2xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{createdClass.name}</h2>
                        <p className="text-gray-300">{createdClass.description}</p>
        </div>

                      {/* Join Code Display */}
                      <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4 text-center">Class Join Code</h3>
                        <div className="text-center">
                          <div className="inline-block bg-slate-900/50 px-6 py-4 rounded-xl border-2 border-cyan-500/30">
                            <span className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">
                              {createdClass.joinCode}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-3">
                            Share this code with your students so they can join your class
                          </p>
                  </div>
                </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => navigate('/classroom')}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
                        >
                          Go to Dashboard
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdClass.joinCode);
                            showSuccess('Join code copied to clipboard!');
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
                        >
                          Copy Code
                        </button>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="relative z-10 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FaUsers className="mr-3 text-green-400" />
                      What's Next?
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Share Join Code</h4>
                          <p className="text-gray-400 text-sm">Give students the join code: <span className="font-mono text-cyan-400">{createdClass.joinCode}</span></p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Create Assignments</h4>
                          <p className="text-gray-400 text-sm">Add assignments and questions for your students</p>
                    </div>
                  </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Monitor Progress</h4>
                          <p className="text-gray-400 text-sm">Track student submissions and grades</p>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Form Screen */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <div className="group relative animate-fade-in-up">
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 p-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Class Name */}
                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaBook className="mr-2 text-cyan-400" />
                            Class Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            placeholder="e.g., Spanish 101, Advanced English"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaInfoCircle className="mr-2 text-cyan-400" />
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
                            placeholder="Describe what this class is about and what students will learn..."
                          />
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaCalendar className="mr-2 text-cyan-400" />
                            Subject
                          </label>
                          <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            placeholder="e.g., Spanish, English, French"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                            className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:transform-none disabled:shadow-none flex items-center justify-center"
                >
                  {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Class...
                              </>
                  ) : (
                    <>
                                <FaPlus className="mr-3" />
                      Create Class
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
                  </div>
                </div>
              </div>


              {/* Next Steps Card */}
              <div className="group relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="relative z-10 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FaUsers className="mr-3 text-purple-400" />
                      Next Steps
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Share Join Code</h4>
                          <p className="text-gray-400 text-sm">A unique join code will be generated automatically</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Create Assignments</h4>
                          <p className="text-gray-400 text-sm">Add assignments and questions for your students</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Monitor Progress</h4>
                          <p className="text-gray-400 text-sm">Track student submissions and grades</p>
                        </div>
                      </div>
              </div>
            </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateClass;