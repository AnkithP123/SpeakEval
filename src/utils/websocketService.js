import tokenManager from './tokenManager';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.serverUrl = 'wss://www.server.speakeval.org/ws';
    this.currentRoom = null;
    this.currentParticipant = null;
    this.connectionPromise = null;
    this.studentToken = null; // Store token received from server
    this.lastActivityTime = Date.now();
    this.visibilityChangeHandler = null;
    this.setupVisibilityDetection();
  }

  setupVisibilityDetection() {
    // Set up Page Visibility API detection
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible - requesting state sync');
        this.requestStateSync();
        this.lastActivityTime = Date.now();
      } else {
        console.log('👁️ Tab became hidden');
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  requestStateSync() {
    if (this.isConnected) {
      console.log('🔄 Requesting state sync from server');
      this.send({
        type: 'request_state_sync',
        payload: {
          timestamp: Date.now()
        }
      });
    }
  }

  // Connect for initial join (room code + participant name)
  connectForJoin(roomCode, participantName, useGoogle = false, email = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // Prevent multiple connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Build URL with join parameters
        const params = new URLSearchParams({
          roomCode: roomCode,
          participantName: participantName,
          useGoogle: useGoogle.toString(),
          ...(email && { email: email })
        });
        
        const url = `${this.serverUrl}?${params.toString()}`;
        console.log('🔗 Connecting for initial join:', { roomCode, participantName });
        console.log('🔗 WebSocket URL:', url);
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for join');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.currentRoom = roomCode;
          this.currentParticipant = participantName;
          this.lastActivityTime = Date.now();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
            this.lastActivityTime = Date.now();
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('❌ WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionPromise = null;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Connect for reconnection (token only)
  connectForReconnect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // Prevent multiple connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Build URL with token parameter
        const url = `${this.serverUrl}?token=${token}`;
        console.log('🔗 Connecting for reconnection with token:', token.substring(0, 20) + '...');
        console.log('🔗 WebSocket URL:', url);
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected for reconnection');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.studentToken = token;
          this.lastActivityTime = Date.now();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
            this.lastActivityTime = Date.now();
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('❌ WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionPromise = null;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Legacy connect method for backward compatibility
  connect(roomCode = null, token = null) {
    if (token) {
      return this.connectForReconnect(token);
    } else if (roomCode) {
      // This should only be used for initial joins, but we need participant name
      console.warn('Legacy connect called with roomCode but no participant name');
      return Promise.reject(new Error('Use connectForJoin for initial connections'));
    } else {
      return Promise.reject(new Error('No roomCode or token provided'));
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        // Always try to reconnect with stored token first
        const token = tokenManager.getStudentToken();
        console.log('🔍 Token check for reconnection:', {
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
          tokenLength: token ? token.length : 0
        });
        
        if (token) {
          console.log('🔄 Reconnecting with stored token...');
          this.connectForReconnect(token)
            .catch(error => {
              console.error('Token reconnection failed:', error);
              // If token reconnection fails, we can't reconnect with room code
              // because we need participant name for initial join
            });
        } else {
          console.error('❌ No token available for reconnection');
          console.log('🔍 TokenManager state:', {
            isAuthenticated: tokenManager.isAuthenticated(),
            studentInfo: tokenManager.getStudentInfo(),
            roomSession: tokenManager.getRoomSession()
          });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      // Don't clear currentRoom and currentParticipant for reconnection
      // Only clear token if explicitly requested
    }
  }

  cleanup() {
    // Remove visibility change listener
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    
    // Disconnect WebSocket
    this.disconnect();
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    console.log(`📨 Received WebSocket message: ${type}`, payload);
    
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    } else {
      console.log(`⚠️ No listeners found for event type: ${type}`);
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  off(type, callback) {
    if (this.listeners.has(type)) {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Student Flow Methods

  // Note: Join and reconnect are now handled during WebSocket connection
  // No separate methods needed

  // 3. Room Status Updates
  updateRoomStatus(status) {
    this.send({
      type: 'room_status_update',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        status,
        timestamp: Date.now()
      }
    });
  }

  // 4. Question Flow
  questionStarted(questionIndex) {
    this.send({
      type: 'question_started',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        questionIndex,
        timestamp: Date.now()
      }
    });
  }

  questionCompleted(questionIndex) {
    this.send({
      type: 'question_completed',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        questionIndex,
        timestamp: Date.now()
      }
    });
  }

  // 5. Recording Flow
  startRecording() {
    this.send({
      type: 'recording_started',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  stopRecording() {
    this.send({
      type: 'recording_stopped',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  // 6. Audio Playback
  audioPlaybackStarted() {
    this.send({
      type: 'audio_playback_started',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  audioPlaybackCompleted() {
    this.send({
      type: 'audio_playback_completed',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  // 7. Upload Status
  uploadStarted() {
    this.send({
      type: 'upload_started',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  uploadCompleted() {
    this.send({
      type: 'upload_completed',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }



  // 9. Error Reporting
  reportError(error) {
    this.send({
      type: 'error_reported',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        error: error.message || error,
        timestamp: Date.now()
      }
    });
  }

  // 10. Heartbeat
  sendHeartbeat() {
    this.send({
      type: 'heartbeat',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        timestamp: Date.now()
      }
    });
  }

  // 11. Student Status
  updateStudentStatus(status) {
    this.send({
      type: 'student_status_update',
      payload: { 
        roomCode: this.currentRoom,
        participant: this.currentParticipant,
        status,
        timestamp: Date.now()
      }
    });
  }

  // Getters
  getStudentToken() {
    return tokenManager.getStudentToken();
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getCurrentParticipant() {
    return this.currentParticipant;
  }

  // Enhanced reconnection method
  reconnect() {
    const token = tokenManager.getStudentToken();
    console.log('🔍 Token check for manual reconnect:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
      tokenLength: token ? token.length : 0
    });
    
    if (token) {
      console.log('🔄 Reconnecting with stored token...');
      return this.connectForReconnect(token);
    } else {
      console.error('❌ No token available for manual reconnection');
      console.log('🔍 TokenManager state:', {
        isAuthenticated: tokenManager.isAuthenticated(),
        studentInfo: tokenManager.getStudentInfo(),
        roomSession: tokenManager.getRoomSession()
      });
      return Promise.reject(new Error('No token available for reconnection'));
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService; 