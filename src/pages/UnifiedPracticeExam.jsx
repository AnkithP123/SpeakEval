import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import PracticeAudioRecorder from './PracticeAudioRecorder.jsx';
import tokenManager from '../utils/tokenManager';
import { toast } from 'react-toastify';
import party from 'party-js';

const UnifiedPracticeExam = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const isClassroom = Boolean(classId && assignmentId);
  
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isClassroom) {
          const effectiveToken = localStorage.getItem('token') || localStorage.getItem('classroom_token');
          const response = await axios.get(`https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${effectiveToken}` }
          });
          const assignment = response.data?.assignment || response.data;
          setExamData({
            title: assignment.title,
            description: assignment.description,
            questions: assignment.questions || [],
            timeLimit: assignment.timeLimit || 60,
            thinkingTime: assignment.thinkingTime || 10,
            questionOrder: assignment.questionOrder || "up_to_students"
          });
        } else {
          if (!tokenManager.isAuthenticated()) {
            setError("Please join the practice exam first");
            setLoading(false);
            return;
          }
          const token = tokenManager.getStudentToken();
          const info = tokenManager.getStudentInfo();
          if (!info || info.type !== "practice_participant") {
            setError("Invalid session for practice exam");
            setLoading(false);
            return;
          }
          const response = await fetch(`https://www.server.speakeval.org/get_practice?token=${token}`);
          if (!response.ok) throw new Error("Failed to fetch exam data");
          const data = await response.json();
          if (data.error) setError(data.error);
          else setExamData(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load exam data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, assignmentId, isClassroom]);

  const handleComplete = async (recordings) => {
    if (isClassroom) {
      setSubmitting(true);
      try {
        const effectiveToken = localStorage.getItem('token') || localStorage.getItem('classroom_token');
        const headers = { Authorization: `Bearer ${effectiveToken}` };
        
        const items = recordings.map(r => ({ 
          questionIndex: r.questionIndex, 
          questionId: r.questionId,
          contentType: r.audioBlob?.type || 'audio/wav' 
        }));
        
        const urlsResponse = await axios.post(`https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}/upload-urls`, { items }, { headers });
        const uploadUrls = urlsResponse.data.uploadUrls;

        const urlByIndex = new Map(uploadUrls.map(u => [Number(u.questionIndex), u]));

        for (const rec of recordings) {
          const info = urlByIndex.get(Number(rec.questionIndex));
          if (!info || !rec.audioBlob) continue;
          await fetch(info.url, {
            method: 'PUT',
            headers: { 'Content-Type': info.contentType || 'audio/wav' },
            body: rec.audioBlob,
          });
        }

        const manifest = recordings.map(rec => {
          const info = urlByIndex.get(Number(rec.questionIndex));
          return {
            questionIndex: rec.questionIndex,
            s3Key: info ? info.key : undefined,
            timestamp: rec.timestamp
          };
        });

        const submissionData = { assignmentId, classId, recordings: manifest, submittedAt: Date.now() };

        await axios.post(`https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}/submit`, submissionData, { headers });
        toast.success('Assignment submitted successfully!');
        navigate(`/classroom/${classId}`);
      } catch (error) {
        toast.error('Failed to submit assignment. Please try again.');
        setSubmitting(false);
      }
    } else {
      setExamCompleted(true);
      party.confetti(document.body, {
        count: party.variation.range(100, 200),
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        speed: party.variation.range(200, 300),
      });

      // Create audio elements and animate them
      setTimeout(() => {
        recordings &&
          recordings.forEach((recording, index) => {
            const audio = document.createElement("audio")
            audio.src = recording.audioUrl || recording
            audio.controls = true
            audio.style.position = "absolute"
            const cardElement = document.querySelector(".card") || document.querySelector(".max-w-4xl");
            const cardRect = cardElement ? cardElement.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };

            let top, left
            do {
              top = Math.random() * 80 + 10
              left = Math.random() * 80 + 10
            } while (
              top >= (cardRect.top / window.innerHeight * 100) - 10 &&
              top <= (cardRect.bottom / window.innerHeight * 100) + 10 &&
              left >= (cardRect.left / window.innerWidth * 100) - 10 &&
              left <= (cardRect.right / window.innerWidth * 100) + 10
            )
            audio.style.top = `${top}%`
            audio.style.left = `${left}%`
            audio.style.transform = "scale(0)"
            audio.style.transition = "transform 0.5s ease-in-out"
            document.body.appendChild(audio)

            setTimeout(() => {
              audio.style.transform = "scale(1)"
            }, 100 * index)

            setTimeout(
              () => {
                audio.style.transform = "scale(0)"
                setTimeout(() => {
                  if (document.body.contains(audio)) {
                    document.body.removeChild(audio)
                  }
                }, 500)
              },
              3000 + 100 * index,
            )
          })
      }, 50);
    }
  };

  const handleRetry = () => {
    setExamCompleted(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading {isClassroom ? 'assignment' : 'practice exam'}...</p>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">{error || 'Exam not found'}</h1>
          <button 
            onClick={() => navigate(isClassroom ? `/classroom/${classId}` : '/practice')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
          >
            Back to {isClassroom ? 'Dashboard' : 'Practice Home'}
          </button>
        </div>
      </div>
    );
  }

  if (examCompleted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>
        <div className="relative z-10 glass-morphism p-10 max-w-lg w-full mx-4 text-center rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-md">
          <h2 className="text-3xl font-bold mb-4 text-white">Practice Exam Completed</h2>
          <p className="text-gray-300 mb-8">You have successfully completed this practice sequence.</p>
          <div className="space-x-4">
            <button onClick={handleRetry} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition duration-300">
              Try Again
            </button>
            <button onClick={() => navigate('/practice')} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition duration-300">
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900">
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
              onClick={() => navigate(isClassroom ? `/classroom/${classId}` : '/practice')}
              className="inline-flex items-center text-cyan-400 hover:text-white mb-6 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              Back to {isClassroom ? 'Class' : 'Home'}
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                {examData.title || `${examData.config || 'Practice'} Exam`}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {examData.description || `Language: ${examData.language} | Time Limit: ${examData.timeLimit}s | Total Questions: ${examData.questions?.length}`}
            </p>
          </div>

          {/* PracticeAudioRecorder Component */}
          <div className="max-w-4xl mx-auto">
            <PracticeAudioRecorder 
              examData={examData} 
              onComplete={handleComplete}
              isAssignment={isClassroom}
            />
          </div>

          {/* Loading overlay for submission */}
          {submitting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-white text-lg">Submitting {isClassroom ? 'assignment' : 'exam'}...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedPracticeExam;
