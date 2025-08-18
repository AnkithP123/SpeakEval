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
  const connect = useCallback(async (roomCode = null, token = null) => {
    try {
      setConnectionStatus('connecting');
      
      if (token) {
        await websocketService.connectForReconnect(token);
      } else if (roomCode) {
        // This should only be used for initial joins
        console.warn('Legacy connect called with roomCode but no participant name');
        throw new Error('Use connectForJoin for initial connections');
      } else {
        throw new Error('No roomCode or token provided');
      }
      
      setIsConnected(true);
      setConnectionStatus('connected');
            
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [isConnected]);

  // Connect for initial join
  const connectForJoin = useCallback(async (roomCode, participantName, useGoogle = false, email = null) => {
    try {
      setConnectionStatus('connecting');
      setJoinStatus('pending');
      
      await websocketService.connectForJoin(roomCode, participantName, useGoogle, email);
      
      setIsConnected(true);
      setConnectionStatus('connected');
      setCurrentRoom(roomCode);
      setCurrentParticipant(participantName);
            
    } catch (error) {
      console.error('Failed to connect for join:', error);
      setConnectionStatus('error');
      setJoinStatus('error');
    }
  }, [isConnected]);

  // Connect for reconnection
  const connectForReconnect = useCallback(async (token) => {
    try {
      setConnectionStatus('connecting');
      
      await websocketService.connectForReconnect(token);
      
      setIsConnected(true);
      setConnectionStatus('connected');
            
    } catch (error) {
      console.error('Failed to connect for reconnection:', error);
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
    // Don't clear room/participant for reconnection
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

  // Enhanced reconnection
  const reconnect = useCallback(async () => {
    const token = tokenManager.getStudentToken();
    
    if (token) {
      await connectForReconnect(token);
    } else {
      console.error('❌ No token available for reconnection');
    }
  }, [connectForReconnect]);



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
    connectForJoin,
    connectForReconnect,
    disconnect,
    on,
    off,
    send,
    reconnect,
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