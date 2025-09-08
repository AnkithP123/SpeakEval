import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../hooks/useClassroom.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { FaArrowLeft } from 'react-icons/fa';
import PracticeAudioRecorder from '../../pages/PracticeAudioRecorder.jsx';

const TakeAssignment = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { getAssignment, submitAssignment } = useClassroom();
  const { showSuccess, showError } = useToast();
  
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const assignmentData = await getAssignment(classId, assignmentId);
        setAssignment(assignmentData);
      } catch (error) {
        showError('Failed to load assignment');
        navigate('/classroom');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [classId, assignmentId]);

  const handleComplete = async (recordings) => {
    setSubmitting(true);
    try {
      const submissionData = {
        assignmentId,
        classId,
        recordings: recordings.map(recording => ({
          questionIndex: recording.questionIndex,
          audioUrl: recording.audioUrl,
          timestamp: recording.timestamp
        })),
        submittedAt: Date.now()
      };

      await submitAssignment(classId, assignmentId, submissionData);
      showSuccess('Assignment submitted successfully!');
      navigate(`/classroom/${classId}`);
    } catch (error) {
      showError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Assignment not found</h1>
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

  // Transform assignment data to match PracticeAudioRecorder's expected format
  const examData = {
    title: assignment.title,
    description: assignment.description,
    questions: assignment.questions || [],
    timeLimit: assignment.timeLimit || 60,
    thinkingTime: assignment.thinkingTime || 10
  };

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
          <div className="text-center mb-8">
            <button
              onClick={() => navigate(`/classroom/${classId}`)}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to Class
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {assignment.title}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* PracticeAudioRecorder Component */}
          <div className="max-w-4xl mx-auto">
            <PracticeAudioRecorder 
              examData={examData} 
              onComplete={handleComplete}
            />
          </div>

          {/* Loading overlay for submission */}
          {submitting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-white text-lg">Submitting assignment...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeAssignment;