import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaPlus, FaArrowLeft, FaBook, FaCalendar, FaClock, FaUsers, FaInfoCircle, FaCog } from 'react-icons/fa';

const CreateAssignment = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { createAssignment, getClass, fetchConfigs } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    timeLimit: 60,
    thinkingTime: 10
  });

  useEffect(() => {
  const loadData = async () => {
    try {
        const classInfo = await getClass(classId);
        setClassData(classInfo);
        
        // Load question sets from API
        const configs = await fetchConfigs();
        // Map configs to question sets format
        const sets = configs.map(config => ({
          id: config.name,
          name: config.name,
          description: config.description || `Question set: ${config.name}`,
          language: config.language || 'English',
          questions: config.questions || []
        }));
        setQuestionSets(sets);
    } catch (error) {
      showError('Failed to load class data');
        navigate('/classroom');
      }
    };

    loadData();
  }, [classId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSetSelect = (set) => {
    setSelectedSet(set);
  };

  const handleQuestionToggle = (questionIndex) => {
    setFormData(prev => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.map((q, index) => 
        index === questionIndex 
          ? { ...q, selected: !q.selected }
          : q
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSet) {
      showError('Please select a question set');
      return;
    }

    setLoading(true);
    
    try {
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        // store only configName; all questions will be used
        configName: selectedSet.name,
        timeLimit: Number(formData.timeLimit) || 60,
        thinkingTime: Number(formData.thinkingTime) || 10,
        created: Date.now()
      };

      await createAssignment(classId, assignmentData);
      showSuccess('Assignment created successfully!');
      navigate(`/classroom/${classId}`);
    } catch (error) {
      showError('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading class data...</p>
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
                Create Assignment
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Create a new oral exam assignment for {classData.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-3 space-y-8">
              {/* Assignment Details */}
              <div className="group relative animate-fade-in-up">
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <FaBook className="mr-3 text-cyan-400" />
                      Assignment Details
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Title */}
                      <div>
                        <label className="block text-white font-semibold mb-3">Assignment Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                          onChange={handleInputChange}
                    required
                          className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                          placeholder="e.g., Spanish Oral Exam - Unit 3"
                  />
                </div>

                      {/* Description */}
                      <div>
                        <label className="block text-white font-semibold mb-3">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
                          placeholder="Describe what students will be tested on..."
                />
              </div>

                      {/* Due Date and Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaCalendar className="mr-2 text-cyan-400" />
                            Due Date
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaClock className="mr-2 text-cyan-400" />
                            Time Limit (seconds)
                          </label>
                          <input
                            type="number"
                            name="timeLimit"
                            value={formData.timeLimit}
                            onChange={handleInputChange}
                            min="10"
                            max="300"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                        <div>
                          <label className="block text-white font-semibold mb-3 flex items-center">
                            <FaCog className="mr-2 text-cyan-400" />
                            Thinking Time (seconds)
                  </label>
                          <input
                            type="number"
                            name="thinkingTime"
                            value={formData.thinkingTime}
                            onChange={handleInputChange}
                            min="0"
                            max="60"
                            className="w-full px-4 py-3 bg-slate-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                      </div>
                    </form>
                </div>
              </div>
            </div>

              {/* Question Set Selection */}
              <div className="group relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="relative z-10 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <FaCog className="mr-3 text-purple-400" />
                      Select Question Set
                    </h2>
                    
                    {questionSets.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-300 mb-4">No question sets available</p>
                        <button
                          onClick={() => navigate('/configure')}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                        >
                          Create Question Set
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questionSets.map((set, index) => (
                          <div
                            key={index}
                            onClick={() => handleSetSelect(set)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              selectedSet?.id === set.id
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-gray-600 bg-slate-800/50 hover:border-cyan-400'
                            }`}
                          >
                            <h3 className="text-lg font-semibold text-white mb-2">{set.name}</h3>
                            <p className="text-gray-300 text-sm mb-2">{set.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-400">
                              <span>{set.questions?.length || 0} questions</span>
                              <span>{set.language || 'English'}</span>
                        </div>
                          </div>
                        ))}
                            </div>
                          )}
                        </div>
              </div>
            </div>

              {/* Question Selection disabled - all questions in set will be used */}

              {/* Submit Button */}
              <div className="text-center">
              <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedSet}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:transform-none disabled:shadow-none flex items-center mx-auto"
              >
                {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Assignment...
                    </>
                ) : (
                  <>
                      <FaPlus className="mr-3" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
            </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;