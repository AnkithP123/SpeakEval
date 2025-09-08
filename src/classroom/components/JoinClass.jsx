import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaUsers, FaArrowLeft, FaCode, FaSearch, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const JoinClass = () => {
  const navigate = useNavigate();
  const { joinClass } = useClassroom();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [searching, setSearching] = useState(false);

  const handleJoinCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setJoinCode(value);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showError('Please enter a join code');
      return;
    }

    setLoading(true);
    setSearching(true);

    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await joinClass(joinCode);
      showSuccess('Successfully joined the class!');
      navigate('/classroom');
    } catch (error) {
      showError('Invalid join code or class not found. Please check and try again.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const exampleCodes = ['ABC123', 'XYZ789', 'DEF456'];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/15 to-pink-600/15 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/40 rounded-full animate-float"
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
              className="inline-flex items-center text-purple-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
                Join a Class
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Enter the join code provided by your teacher to access your class
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="group relative animate-fade-in-up">
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 p-8">
                    <form onSubmit={handleJoin} className="space-y-6">
                      {/* Join Code Input */}
                      <div>
                        <label className="block text-white font-semibold mb-3 flex items-center">
                          <FaCode className="mr-2 text-purple-400" />
                      Class Join Code
                    </label>
                        <div className="relative">
                      <input
                        type="text"
                        value={joinCode}
                            onChange={handleJoinCodeChange}
                            required
                            maxLength={6}
                            className="w-full px-4 py-4 bg-slate-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 font-mono text-center text-2xl tracking-widest"
                        placeholder="ABC123"
                          />
                          {searching && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                      </div>
                          )}
                    </div>
                        <p className="text-gray-400 text-sm mt-2 text-center">
                          Enter the 6-character code your teacher provided
                        </p>
                  </div>

                      {/* Submit Button */}
                      <div className="pt-6">
                    <button
                      type="submit"
                          disabled={loading || !joinCode.trim()}
                          className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:transform-none disabled:shadow-none flex items-center justify-center"
                    >
                      {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              {searching ? 'Searching...' : 'Joining Class...'}
                            </>
                      ) : (
                        <>
                              <FaUsers className="mr-3" />
                          Join Class
                        </>
                      )}
                    </button>
                </div>
              </form>
            </div>
                  </div>
                </div>
                
            {/* Sidebar */}
            <div className="space-y-6">
              {/* How to Join Card */}
              <div className="group relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="relative z-10 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FaInfoCircle className="mr-3 text-purple-400" />
                      How to Join
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Get the Code</h4>
                          <p className="text-gray-300 text-sm">Ask your teacher for the 6-character join code</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Enter Code</h4>
                          <p className="text-gray-300 text-sm">Type the code in the input field above</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Access Class</h4>
                          <p className="text-gray-300 text-sm">Start viewing assignments and announcements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
              </div>

</div>
              {/* Troubleshooting Card */}
              <div className="group relative animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl" />
                  <div className="relative z-10 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FaExclamationTriangle className="mr-3 text-orange-400" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <h4 className="text-white font-semibold text-sm mb-1">Code not working?</h4>
                        <p className="text-sm">Double-check the code with your teacher</p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm mb-1">Already joined?</h4>
                        <p className="text-sm">You might already be enrolled in this class</p>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm mb-1">Still having issues?</h4>
                        <p className="text-sm">Contact your teacher for assistance</p>
                      </div>
              </div>
            </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;