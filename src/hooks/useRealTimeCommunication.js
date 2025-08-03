import { useEffect, useRef, useState, useCallback } from 'react';
import websocketService from '../utils/websocketService';
import tokenManager from '../utils/tokenManager';

export const useRealTimeCommunication = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [joinStatus, setJoinStatus] = useState(null); // 'pending', 'success', 'error'
  const listenersRef = useRef(new Map());
  const heartbeatInterval = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(async (roomCode = null) => {
    try {
      setConnectionStatus('connecting');
      
      await websocketService.connect(roomCode);
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (isConnected) {
          websocketService.sendHeartbeat();
        }
      }, 30000); // Send heartbeat every 30 seconds
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [isConnected]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setCurrentRoom(null);
    setCurrentParticipant(null);
    setRoomStatus(null);
    setJoinStatus(null);
  }, []);

  // Add event listener
  const on = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, []);
    }
    listenersRef.current.get(eventType).push(callback);
    
    websocketService.on(eventType, callback);
  }, []);

  // Remove event listener
  const off = useCallback((eventType, callback) => {
    const listeners = listenersRef.current.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    
    websocketService.off(eventType, callback);
  }, []);

  // Send message
  const send = useCallback((message) => {
    websocketService.send(message);
  }, []);

  // Room management - NEW approach
  const joinRoom = useCallback((roomCode, participantName, useGoogle = false, email = null) => {
    setJoinStatus('pending');
    setCurrentRoom(roomCode);
    setCurrentParticipant(participantName);
    websocketService.joinRoom(roomCode, participantName, useGoogle, email);
  }, []);

  const reconnectWithToken = useCallback((token) => {
    websocketService.reconnectWithToken(token);
  }, []);

  const leaveRoom = useCallback(() => {
    websocketService.leaveRoom();
    setCurrentRoom(null);
    setCurrentParticipant(null);
  }, []);

  // Practice exam management
  const joinPractice = useCallback((practiceCode, participant) => {
    setCurrentRoom(practiceCode);
    setCurrentParticipant(participant);
    websocketService.joinPractice(practiceCode, participant);
  }, []);

  const leavePractice = useCallback(() => {
    websocketService.leavePractice();
    setCurrentRoom(null);
    setCurrentParticipant(null);
  }, []);

  // Status updates
  const updateRoomStatus = useCallback((status) => {
    setRoomStatus(status);
    websocketService.updateRoomStatus(status);
  }, []);

  const updateStudentStatus = useCallback((status) => {
    websocketService.updateStudentStatus(status);
  }, []);

  // Question flow
  const questionStarted = useCallback((questionIndex) => {
    websocketService.questionStarted(questionIndex);
  }, []);

  const questionCompleted = useCallback((questionIndex) => {
    websocketService.questionCompleted(questionIndex);
  }, []);

  // Recording status
  const startRecording = useCallback(() => {
    websocketService.startRecording();
  }, []);

  const stopRecording = useCallback(() => {
    websocketService.stopRecording();
  }, []);

  // Audio playback
  const audioPlaybackStarted = useCallback(() => {
    websocketService.audioPlaybackStarted();
  }, []);

  const audioPlaybackCompleted = useCallback(() => {
    websocketService.audioPlaybackCompleted();
  }, []);

  // Upload status
  const uploadStarted = useCallback(() => {
    websocketService.uploadStarted();
  }, []);

  const uploadCompleted = useCallback(() => {
    websocketService.uploadCompleted();
  }, []);

  // Error reporting
  const reportError = useCallback((error) => {
    websocketService.reportError(error);
  }, []);

  // Getters
  const getStudentToken = useCallback(() => {
    return websocketService.getStudentToken();
  }, []);

  const getCurrentRoom = useCallback(() => {
    return websocketService.getCurrentRoom();
  }, []);

  const getCurrentParticipant = useCallback(() => {
    return websocketService.getCurrentParticipant();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all listeners
      listenersRef.current.forEach((listeners, eventType) => {
        listeners.forEach(callback => {
          websocketService.off(eventType, callback);
        });
      });
      listenersRef.current.clear();
      
      // Clear heartbeat interval
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    currentRoom,
    currentParticipant,
    roomStatus,
    joinStatus,
    connect,
    disconnect,
    on,
    off,
    send,
    joinRoom,
    reconnectWithToken,
    leaveRoom,
    joinPractice,
    leavePractice,
    updateRoomStatus,
    updateStudentStatus,
    questionStarted,
    questionCompleted,
    startRecording,
    stopRecording,
    audioPlaybackStarted,
    audioPlaybackCompleted,
    uploadStarted,
    uploadCompleted,
    reportError,
    getStudentToken,
    getCurrentRoom,
    getCurrentParticipant
  };
}; 