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
  }

  connect(roomCode = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // Prevent multiple connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Connect without token initially
        const url = roomCode 
          ? `${this.serverUrl}?roomCode=${roomCode}`
          : this.serverUrl;
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
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

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.currentRoom)
          .catch(error => {
            console.error('Reconnection failed:', error);
          });
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
      this.currentRoom = null;
      this.currentParticipant = null;
      this.studentToken = null;
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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

  // 1. Join Room Flow (NEW - replaces HTTP endpoint)
  joinRoom(roomCode, participantName, useGoogle = false, email = null) {
    this.currentRoom = roomCode;
    this.currentParticipant = participantName;
    
    this.send({
      type: 'join_room_request',
      payload: { 
        roomCode, 
        participantName,
        useGoogle,
        email,
        timestamp: Date.now()
      }
    });
  }

  // 2. Reconnect with existing token
  reconnectWithToken(token) {
    this.studentToken = token;
    this.send({
      type: 'reconnect_with_token',
      payload: { 
        token,
        timestamp: Date.now()
      }
    });
  }

  leaveRoom() {
    this.send({
      type: 'leave_room',
      payload: {}
    });
    this.currentRoom = null;
    this.currentParticipant = null;
  }

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

  // 8. Practice Exam Flow
  joinPractice(practiceCode, participant) {
    this.currentRoom = practiceCode;
    this.currentParticipant = participant;
    
    this.send({
      type: 'join_practice',
      payload: { practiceCode, participant }
    });
  }

  leavePractice() {
    this.send({
      type: 'leave_practice',
      payload: {}
    });
    this.currentRoom = null;
    this.currentParticipant = null;
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
    return this.studentToken;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getCurrentParticipant() {
    return this.currentParticipant;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService; 