import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const ClassroomContext = createContext();

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};

export const ClassroomProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle API errors
  const handleApiError = (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    setError(message);
    throw new Error(message);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('classroom_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch all classes for current user
  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const teacherToken = localStorage.getItem('token');
      const teacherUsername = localStorage.getItem('username');
      const classroomUser = JSON.parse(localStorage.getItem('classroom_user') || '{}');
      
      if (teacherToken && teacherUsername) {
        // Teacher authentication - fetch teacher's classes
        const response = await axios.get(`https://www.server.speakeval.org/classroom/teacher/${teacherUsername}/classes`, {
          headers: { Authorization: `Bearer ${teacherToken}` }
        });
        setClasses(response.data || []);
        return response.data || [];
      } else if (classroomUser.userType === 'student') {
        const response = await axios.get(`https://www.server.speakeval.org/classroom/student/${classroomUser.username}/classes`, {
          headers: getAuthHeaders()
        });
        setClasses(response.data || []);
        return response.data;
      } else {
        // No authentication
        setClasses([]);
        return [];
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new class
  const createClass = async (classData) => {
    setLoading(true);
    setError(null);
    
    try {
      const teacherToken = localStorage.getItem('token');
      const teacherUsername = localStorage.getItem('username');
      const classroomUser = JSON.parse(localStorage.getItem('classroom_user') || '{}');
      
      let teacherId;
      let headers = {};
      
      if (teacherToken && teacherUsername) {
        // Teacher authentication
        teacherId = teacherUsername;
        headers = { Authorization: `Bearer ${teacherToken}` };
      } else if (classroomUser.userType === 'student') {
        // Student authentication (shouldn't be able to create classes, but handle gracefully)
        teacherId = classroomUser.username;
        headers = getAuthHeaders();
      } else {
        throw new Error('No authentication found');
      }
      
      const response = await axios.post('https://www.server.speakeval.org/classroom/create', {
        ...classData,
        teacherId: teacherId
      }, {
        headers: headers
      });
      const newClass = response.data.class;
      setClasses(prev => [newClass, ...prev]);
      return newClass;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Join a class with join code
  const joinClass = async (joinCode) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, we need to find the class by join code
      // This would require a new endpoint to search by join code
      // For now, we'll simulate this
      await axios.post(`https://www.server.speakeval.org/classroom/${joinCode}/join`, {}, {
        headers: getAuthHeaders()
      });
      // Refresh classes after joining
      const updated = await fetchClasses();
      const joinedClass = (updated || []).find(c => (c.joinCode || '').toUpperCase() === (joinCode || '').toUpperCase());
      return joinedClass;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Get class details by ID
  const getClass = async (classId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`https://www.server.speakeval.org/classroom/${classId}`, {
        headers: getAuthHeaders()
      });
      const classData = response.data;
      setCurrentClass(classData);
      return classData;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Create an assignment (store only configName; server resolves questions later)
  const createAssignment = async (classId, assignmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `https://www.server.speakeval.org/api/classes/${classId}/assignments`,
        assignmentData,
        { headers: getAuthHeaders() }
      );
      const newAssignment = response.data.assignment;
      
      // Update current class with new assignment
      if (currentClass && currentClass.id === classId) {
        setCurrentClass(prev => ({
          ...prev,
          assignments: [...(prev.assignments || []), newAssignment]
        }));
      }
      
      return newAssignment;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Get assignment details (server expands questions with presigned URLs)
  const getAssignment = async (classId, assignmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}` , {
        headers: getAuthHeaders()
      });
      // response shape: { success, assignment, isTeacher, isStudent }
      const assignment = response.data?.assignment || response.data;
      if (!assignment) {
        throw new Error('Assignment not found');
      }
      return assignment;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Submit an assignment
  const submitAssignment = async (classId, assignmentId, submissionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}/submit`,
        submissionData,
        {
          headers: getAuthHeaders()
        }
      );
      return response.data.submission;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Get presigned upload URLs for assignment recordings
  const getAssignmentUploadUrls = async (classId, assignmentId, items) => {
    try {
      const response = await axios.post(
        `https://www.server.speakeval.org/api/classes/${classId}/assignments/${assignmentId}/upload-urls`,
        { items },
        { headers: getAuthHeaders() }
      );
      return response.data.uploadUrls;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  // Get submissions for an assignment
  const getSubmissions = async (classId, assignmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`https://www.server.speakeval.org/classroom/${classId}/assignments/${assignmentId}/submissions`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Grade an assignment
  const gradeSubmission = async (classId, assignmentId, submissionId, grade) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would require a new endpoint for grading
      // For now, we'll update the submission in the class data
      const classData = await getClass(classId);
      const assignment = classData.assignments?.find(a => a.id === assignmentId);
      if (assignment) {
        const submission = assignment.submissions?.find(s => s.id === submissionId);
        if (submission) {
          submission.grade = grade;
          // Update the class data
          await axios.put(`https://www.server.speakeval.org/classroom/${classId}`, classData, {
            headers: getAuthHeaders()
          });
        }
      }
      return true;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Remove student from class
  const removeStudent = async (classId, studentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const classData = await getClass(classId);
      classData.students = classData.students?.filter(s => s.id !== studentId) || [];
      
      // Update class data
      await axios.put(`https://www.server.speakeval.org/classroom/${classId}`, classData, {
        headers: getAuthHeaders()
      });
      
      setCurrentClass(classData);
      return true;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete class
  const deleteClass = async (classId) => {
    setLoading(true);
    setError(null);
    
    try {
      // This would require a delete endpoint
      // For now, we'll just remove from local state
      setClasses(prev => prev.filter(c => c.id !== classId));
      setCurrentClass(null);
      return true;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete assignment
  const deleteAssignment = async (classId, assignmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const classData = await getClass(classId);
      classData.assignments = classData.assignments?.filter(a => a.id !== assignmentId) || [];
      
      // Update class data
      await axios.put(`https://www.server.speakeval.org/classroom/${classId}`, classData, {
        headers: getAuthHeaders()
      });
      
      setCurrentClass(classData);
      return true;
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Get available question sets (configs)
  const fetchConfigs = async () => {
    try {
      const teacherToken = localStorage.getItem('token');
      if (!teacherToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get('https://www.server.speakeval.org/getconfigs', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      return [];
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    classes,
    currentClass,
    loading,
    error,
    fetchClasses,
    createClass,
    joinClass,
    getClass,
    createAssignment,
    getAssignment,
    submitAssignment,
    getAssignmentUploadUrls,
    getSubmissions,
    gradeSubmission,
    removeStudent,
    deleteClass,
    deleteAssignment,
    fetchConfigs,
    clearError,
    setCurrentClass
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};