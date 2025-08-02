// Token management utility for student authentication
import { jwtDecode } from "jwt-decode";

const STUDENT_TOKEN_KEY = "speakeval_student_token";
const ROOM_SESSION_KEY = "speakeval_room_session";

export const tokenManager = {
  // Store student token in localStorage
  setStudentToken: (token) => {
    try {
      localStorage.setItem(STUDENT_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error("Error storing token:", error);
      return false;
    }
  },

  // Get student token from localStorage
  getStudentToken: () => {
    try {
      return localStorage.getItem(STUDENT_TOKEN_KEY);
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  },

  // Remove student token from localStorage
  clearStudentToken: () => {
    try {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      localStorage.removeItem(ROOM_SESSION_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing token:", error);
      return false;
    }
  },

  // Decode and validate student token
  decodeStudentToken: (token = null) => {
    try {
      const tokenToDecode = token || tokenManager.getStudentToken();
      if (!tokenToDecode) return null;

      const decoded = jwtDecode(tokenToDecode);
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        tokenManager.clearStudentToken();
        return null;
      }

      return decoded;
    } catch (error) {
      console.error("Error decoding token:", error);
      tokenManager.clearStudentToken();
      return null;
    }
  },

  // Check if student is authenticated
  isAuthenticated: () => {
    const decoded = tokenManager.decodeStudentToken();
    return decoded !== null;
  },

  // Get student info from token
  getStudentInfo: () => {
    const decoded = tokenManager.decodeStudentToken();
    if (!decoded) return null;

    return {
      participant: decoded.participant,
      roomCode: decoded.roomCode,
      type: decoded.type,
      timestamp: decoded.timestamp
    };
  },

  // Store room session info
  setRoomSession: (sessionData) => {
    try {
      localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error("Error storing room session:", error);
      return false;
    }
  },

  // Get room session info
  getRoomSession: () => {
    try {
      const session = localStorage.getItem(ROOM_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error retrieving room session:", error);
      return null;
    }
  },

  // Check if current session is valid for a specific room
  isValidSession: (roomCode) => {
    const session = tokenManager.getRoomSession();
    const tokenInfo = tokenManager.getStudentInfo();
    
    if (!session || !tokenInfo) return false;
    
    // Check if room code matches and session is not expired
    return session.roomCode === roomCode && 
           session.timestamp && 
           (Date.now() - session.timestamp) < (24 * 60 * 60 * 1000); // 24 hours
  },

  // Clear all student data
  clearAll: () => {
    tokenManager.clearStudentToken();
  }
};

export default tokenManager; 