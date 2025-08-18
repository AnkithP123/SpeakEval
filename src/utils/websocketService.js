import tokenManager from "./tokenManager";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.serverUrl = "wss://www.server.speakeval.org/ws";
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
      if (document.visibilityState === "visible") {
        this.requestStateSync();
        this.lastActivityTime = Date.now();
      }
    };

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  requestStateSync() {
    if (this.isConnected) {
      this.send({
        type: "request_state_sync",
        payload: {
          timestamp: Date.now(),
        },
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
          ...(email && { email: email }),
        });

        const url = `${this.serverUrl}?${params.toString()}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
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
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.connectionPromise = null;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.connectionPromise = null;
          reject(error);
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
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

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
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
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.connectionPromise = null;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.connectionPromise = null;
          reject(error);
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
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
      console.warn(
        "Legacy connect called with roomCode but no participant name"
      );
      return Promise.reject(
        new Error("Use connectForJoin for initial connections")
      );
    } else {
      return Promise.reject(new Error("No roomCode or token provided"));
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      setTimeout(() => {
        // Always try to reconnect with stored token first
        const token = tokenManager.getStudentToken();

        if (token) {
          this.connectForReconnect(token).catch((error) => {
            console.error("Token reconnection failed:", error);
            // If token reconnection fails, we can't reconnect with room code
            // because we need participant name for initial join
          });
        } else {
          console.error("❌ No token available for reconnection");
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
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
    this.stopClientPing();
  }

  cleanup() {
    // Remove visibility change listener
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler
      );
      this.visibilityChangeHandler = null;
    }

    // Stop client ping
    this.stopClientPing();

    // Disconnect WebSocket
    this.disconnect();
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }

  handleMessage(data) {
    const { type, payload, messageId } = data;

    // Handle message acknowledgments
    if (messageId) {
      this.send({
        type: "message_ack",
        payload: {
          messageId: messageId,
        },
      });
    }

    // Handle ping from server
    if (type === "ping") {
      this.send({
        type: "pong",
        payload: {
          timestamp: payload.timestamp,
          clientTime: Date.now(),
          roomCode: tokenManager.getStudentInfo()?.roomCode,
          participant: tokenManager.getStudentInfo()?.participant,
        },
      });
      return; // Don't trigger listeners for ping
    }

    // Handle pong acknowledgment from server
    if (type === "pong_ack") {
      return; // Don't trigger listeners for pong_ack
    }

    // Handle kick message from server
    if (type === "kicked") {
      this.handleKick(payload);
      return; // Don't trigger listeners for kicked
    }

    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach((callback) => {
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

  // Note: Join and reconnect are now handled during WebSocket connection
  // No separate methods needed

  // 3. Room Status Updates
  updateRoomStatus(status) {
    this.send({
      type: "room_status_update",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        status,
        timestamp: Date.now(),
      },
    });
  }

  // 4. Question Flow
  questionStarted(questionIndex) {
    this.send({
      type: "question_started",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        questionIndex,
        timestamp: Date.now(),
      },
    });
  }

  questionCompleted(questionIndex) {
    this.send({
      type: "question_completed",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        questionIndex,
        timestamp: Date.now(),
      },
    });
  }

  // 5. Recording Flow
  startRecording() {
    this.send({
      type: "recording_started",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  stopRecording() {
    this.send({
      type: "recording_stopped",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  // 6. Audio Playback
  audioPlaybackStarted() {
    this.send({
      type: "audio_playback_started",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  audioPlaybackCompleted() {
    this.send({
      type: "audio_playback_completed",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  // 7. Upload Status
  uploadStarted() {
    this.send({
      type: "upload_started",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  uploadCompleted() {
    this.send({
      type: "upload_completed",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  // 9. Error Reporting
  reportError(error) {
    this.send({
      type: "error_reported",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        error: error.message || error,
        timestamp: Date.now(),
      },
    });
  }

  reportCheating(message) {
    this.send({
      type: "cheating_detected",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        message,
        timestamp: Date.now(),
      },
    });
  }

  // 10. Ping (client-initiated)
  sendPing() {
    this.send({
      type: "ping",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        timestamp: Date.now(),
      },
    });
  }

  // Start client-side ping interval (optional, for additional monitoring)
  startClientPing(intervalMs = 10000) {
    if (this.clientPingInterval) {
      clearInterval(this.clientPingInterval);
    }

    this.clientPingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, intervalMs);
  }

  // Stop client-side ping interval
  stopClientPing() {
    if (this.clientPingInterval) {
      clearInterval(this.clientPingInterval);
      this.clientPingInterval = null;
    }
  }

  // Handle kick from server
  handleKick(payload) {
    // Disconnect from WebSocket
    this.disconnect();

    // Clear any stored tokens/session data
    if (typeof tokenManager !== "undefined" && tokenManager.clearSession) {
      tokenManager.clearSession();
    }

    // Emit kick event for components to handle
    if (this.listeners.has("kicked")) {
      this.listeners.get("kicked").forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error("Error in kicked listener:", error);
        }
      });
    }

    // Show user-friendly message
    if (typeof window !== "undefined" && window.alert) {
      window.alert(
        `You have been disconnected from the room: ${payload.reason}`
      );
    }
  }

  // Helper method to check if client is about to be kicked
  getMissedPingCount() {
    // This would need to be implemented on the server side
    // For now, return null to indicate it's not available
    return null;
  }

  // 11. Student Status
  updateStudentStatus(status) {
    this.send({
      type: "student_status_update",
      payload: {
        roomCode: tokenManager.getStudentInfo()?.roomCode,
        participant: tokenManager.getStudentInfo()?.participant,
        status,
        timestamp: Date.now(),
      },
    });
  }

  // Getters
  getStudentToken() {
    return tokenManager.getStudentToken();
  }

  getCurrentRoom() {
    return tokenManager.getStudentInfo()?.roomCode;
  }

  getCurrentParticipant() {
    return tokenManager.getStudentInfo()?.participant;
  }

  // Enhanced reconnection method
  reconnect() {
    const token = tokenManager.getStudentToken();

    if (token) {
      return this.connectForReconnect(token);
    } else {
      console.error("❌ No token available for manual reconnection");
      return Promise.reject(new Error("No token available for reconnection"));
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;
