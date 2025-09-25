"use client";

import { useState, useRef, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Play } from "lucide-react";
import * as Tone from "tone";
import styled, { css, keyframes } from "styled-components";
import { cuteAlert, cuteToast } from "cute-alert";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import tokenManager from "../utils/tokenManager";
import { useRealTimeCommunication } from "../hooks/useRealTimeCommunication";
import websocketService from "../utils/websocketService";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(true);
  const [audioURL, setAudioURL] = useState(null);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [audioBlobURL, setAudioBlobURL] = useState(null);
  const countdownRef = useRef(0);
  const [countdownDisplay, setCountdownDisplay] = useState(0);
  const timer = useRef(-1);

  const audioRef = useRef(null);
  const [displayTime, setDisplayTime] = useState("xx:xx");
  const [obtainedAudio, setObtainedAudio] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [premium, setPremium] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(5);
  const [allowRepeat, setAllowRepeat] = useState(true);
  const [timeLimit, setTimeLimit] = useState(-1); // Time limit in seconds (-1 means no limit)
  const [remainingTime, setRemainingTime] = useState(-1); // Current remaining time in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false); // Track when exam has actually started
  const [finishedRecording, setFinishedRecording] = useState(false);
  const [hasScreenPermission, setHasScreenPermission] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isWholeScreen, setIsWholeScreen] = useState(false);
  const [fullscreenViolationReported, setFullscreenViolationReported] =
    useState(false);
  const [tabSwitchReported, setTabSwitchReported] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [questionAudioReady, setQuestionAudioReady] = useState(false);

  // Web Speech API states
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [examLanguage, setExamLanguage] = useState(null); // Will be set from API response
  const finalRecognizedTextRef = useRef(""); // Ref to store final recognized text for immediate access

  let questionIndex;
  let played = false;

  // Stage-based data-driven approach
  const [currentStage, setCurrentStage] = useState("initializing");
  const [thinkingProgress, setThinkingProgress] = useState(1); // Smooth progress (0 to 1)
  const [lastRoomRestart, setLastRoomRestart] = useState(null); // Track last room restart
  const [setupLoading, setSetupLoading] = useState({
    microphone: false,
    fullscreen: false,
  });

  // Helper function to check if a room code is newer than another
  const isNewerRoomCode = (newCode, currentCode) => {
    if (!newCode || !currentCode) return false;

    // Extract base and suffix from room codes
    const newBase = newCode.slice(0, 8);
    const newSuffix = newCode.slice(8);
    const currentBase = currentCode.slice(0, 8);
    const currentSuffix = currentCode.slice(8);

    // If bases are different, they're different rooms entirely
    if (newBase !== currentBase) {
      return false;
    }

    // Compare suffixes numerically
    const newSuffixNum = parseInt(newSuffix || "0", 10);
    const currentSuffixNum = parseInt(currentSuffix || "0", 10);

    return newSuffixNum > currentSuffixNum;
  };
  const [stageData, setStageData] = useState({
    // Stage: 'initializing'
    audioDownloaded: false,
    audioDownloadError: null,

    // Stage: 'setup'
    setup: {
      microphonePermission: false,
      fullscreenEnabled: false,
    },

    // Stage: 'audio_play'
    audioPlay: {
      hasPlayed: false,
      isPlaying: false,
      playError: null,
    },

    // Stage: 'thinking'
    thinking: {
      thinkingTimeRemaining: 0,
      thinkingComplete: false,
    },

    // Stage: 'recording'
    recording: {
      isRecording: false,
      hasRecorded: false,
      recordingBlob: null,
      recordingError: null,
    },

    // Stage: 'uploading'
    uploading: {
      isUploading: false,
      uploadProgress: 0,
      uploadComplete: false,
      uploadError: null,
      transcriptionText: null,
      waitingForTranscription: false,
    },
  });

  const navigate = useNavigate();

  // Stage transition logic
  const advanceStage = (newStage) => {
    setCurrentStage(newStage);

    // Track stage start time for periodic checks
    window.stageStartTime = Date.now();
  };

  // Reset state for new question
  const resetForNewQuestion = () => {
    // Stop speech recognition if active and capture any remaining text
    if (speechRecognition && isListening) {
      // Capture any remaining interim text before stopping
      if (speechRecognition.lastInterimText) {
        setRecognizedText((prev) => {
          const newText = prev + speechRecognition.lastInterimText;
          return newText;
        });
      }

      speechRecognition.stop();
    }

    // Reset speech recognition states
    setRecognizedText("");
    finalRecognizedTextRef.current = ""; // Reset ref as well
    setIsListening(false);
    setSpeechRecognition(null);
    setExamLanguage(null); // Reset language to null

    // Reset all recording-related states
    setIsRecording(false);
    setFinishedRecording(false);
    setAudioURL(null);
    setAudioBlobURL(null);
    setDisplayTime("xx:xx");
    setRemainingTime(-1);
    setError(null);
    setIsError(false);

    // Clear any existing timers
    if (timer.current !== -1) {
      clearInterval(timer.current);
      timer.current = -1;
    }

    // Reset stage data but preserve setup permissions for room restarts
    setStageData({
      audioDownloaded: false,
      audioDownloadError: null,
      setup: {
        microphonePermission: false, // Will be checked after audio download
        fullscreenEnabled: false, // Will be checked after audio download
      },
      audioPlay: {
        hasPlayed: false,
        isPlaying: false,
        playError: null,
      },
      thinking: {
        thinkingTimeRemaining: 0,
        thinkingComplete: false,
      },
      recording: {
        isRecording: false,
        hasRecorded: false,
        recordingBlob: null,
        recordingError: null,
      },
      uploading: {
        isUploading: false,
        uploadProgress: 0,
        uploadComplete: false,
        uploadError: null,
        transcriptionText: null,
        waitingForTranscription: false,
      },
    });

    // Reset setup loading states
    setSetupLoading({
      microphone: false,
      fullscreen: false,
    });

    // Reset thinking progress
    setThinkingProgress(1);

    // Reset anticheat flags for room restart
    setFullscreenViolationReported(false);
    setTabSwitchReported(false);
    setExamStarted(false);
    setIsFullscreen(false);

    // Go to initializing to download new audio, then proceed through normal flow
    advanceStage("initializing");
  };

  const updateStageData = (updates) => {
    setStageData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateSetup = (updates) => {
    setStageData((prev) => ({
      ...prev,
      setup: {
        ...prev.setup,
        ...updates,
      },
    }));
  };

  const updateRecordingData = (updates) => {
    setStageData((prev) => ({
      ...prev,
      recording: {
        ...prev.recording,
        ...updates,
      },
    }));
  };

  const updateUploadingData = (updates) => {
    setStageData((prev) => ({
      ...prev,
      uploading: {
        ...prev.uploading,
        ...updates,
      },
    }));
  };

  const updateAudioPlayData = (updates) => {
    setStageData((prev) => ({
      ...prev,
      audioPlay: {
        ...prev.audioPlay,
        ...updates,
      },
    }));
  };

  const updateThinkingData = (updates) => {
    setStageData((prev) => ({
      ...prev,
      thinking: {
        ...prev.thinking,
        ...updates,
      },
    }));
  };

  // Stage validation functions
  const canAdvanceToSetup = () => {
    return stageData.audioDownloaded && !stageData.audioDownloadError;
  };

  const canAdvanceToAudioPlay = () => {
    const setup = stageData.setup;
    return setup.microphonePermission && setup.fullscreenEnabled;
  };

  const canAdvanceToThinking = () => {
    return stageData.audioPlay.hasPlayed && !stageData.audioPlay.playError;
  };

  const canAdvanceToRecording = () => {
    // If thinking time is 0 or less, skip thinking stage
    if (thinkingTime <= 0) {
      return stageData.audioPlay.hasPlayed && !stageData.audioPlay.playError;
    }
    return stageData.thinking.thinkingComplete;
  };

  const canAdvanceToUploading = () => {
    return (
      stageData.recording.hasRecorded &&
      stageData.recording.recordingBlob &&
      !stageData.recording.recordingError
    );
  };

  // Check current permissions for room restart optimization
  const checkCurrentPermissions = async () => {
    // Check microphone permission
    let microphonePermission = false;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      microphonePermission = true;
      micStream.getTracks().forEach((track) => track.stop()); // Clean up
    } catch (error) {
      // Microphone permission not available
    }

    // Check fullscreen status
    const fullscreenEnabled = !!document.fullscreenElement;

    return { microphonePermission, fullscreenEnabled };
  };

  // Determine if setup can be skipped for room restart
  const canSkipSetupForRestart = async () => {
    if (!lastRoomRestart) return false;

    const permissions = await checkCurrentPermissions();
    const bothPermissionsAvailable =
      permissions.microphonePermission && permissions.fullscreenEnabled;

    return bothPermissionsAvailable;
  };

  // Real-time communication
  const {
    isConnected,

    connectForReconnect,
    disconnect: disconnectWebSocket,
    on: onWebSocketEvent,
    off: offWebSocketEvent,
    updateRoomStatus,
    updateStudentStatus,
    questionStarted,
    questionCompleted,
    startRecording: wsStartRecording,
    stopRecording: wsStopRecording,
    audioPlaybackStarted,
    audioPlaybackCompleted,
    uploadStarted,
    uploadCompleted,
    reportError,
    reconnect,
  } = useRealTimeCommunication();

  // Media recorder setup - we'll handle permissions manually
  const {
    status: audioStatus,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    mediaBlobUrl: audioBlobUrl,
    clearBlobUrl: clearAudioBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: true,
    askPermissionOnMount: false, // We'll handle permissions manually
    onStop: (blobUrl, blob) => handleAudioStop(blobUrl, blob),
  });

  const {
    status: screenStatus,
    startRecording: startScreenRecording,
    stopRecording: stopScreenRecording,
    mediaBlobUrl: screenBlobUrl,
    clearBlobUrl: clearScreenBlobUrl,
  } = useReactMediaRecorder({
    screen: true,
    audio: false,
    askPermissionOnMount: false, // We'll handle screen permissions separately
    onStop: (blobUrl, blob) => handleScreenStop(blobUrl, blob),
  });

  // WebSocket connection and event listeners
  useEffect(() => {
    if (tokenManager.isAuthenticated()) {
      // Try to reconnect with existing token
      const existingToken = tokenManager.getStudentToken();
      if (existingToken) {
        connectForReconnect(existingToken);
      } else {
        console.error("❌ No token available for connection");
      }

      // Set up event listeners
      const handleRoomStarted = (payload) => {
        updateStudentStatus("exam_started");
        // Handle room start - could trigger question audio playback
      };

      const handleQuestionChange = (payload) => {
        questionStarted(payload.questionIndex);
        // Handle question change - reset recording state
        setIsRecording(false);
        setFinishedRecording(false);
        setDisplayTime("xx:xx");
        setRemainingTime(-1);
        if (timer.current !== -1) {
          clearInterval(timer.current);
          timer.current = -1;
        }
      };

      const handleRoomRestart = (payload) => {
        // Extract new token and room information - handle multiple formats
        const { newToken, newRoomCode, participant, latestToken } = payload;

        // Determine which token to use
        const tokenToUse = newToken || latestToken;
        const roomCodeToUse = newRoomCode;

        if (tokenToUse && participant) {
          // Get current room code from token
          const currentInfo = tokenManager.getStudentInfo();
          const currentRoomCode = currentInfo?.roomCode;

          // Decode the token to get the room code if not provided
          const tokenInfo = tokenManager.decodeStudentToken(tokenToUse);
          const actualNewRoomCode = roomCodeToUse || tokenInfo?.roomCode;

          // Only proceed if the new room code is actually newer
          if (isNewerRoomCode(actualNewRoomCode, currentRoomCode)) {
            // Track this room restart
            setLastRoomRestart({
              timestamp: Date.now(),
              newRoomCode: actualNewRoomCode,
              newToken: tokenToUse,
              participant,
            });

            // Always update token in localStorage
            tokenManager.setStudentToken(tokenToUse);

            // New question - reset state and continue
            toast.success("New question received - preparing...");
            resetForNewQuestion();
          }
        } else {
          console.error("Missing token data from server");
          toast.error("Failed to handle room restart");
          // Force reload as fallback
          window.location.reload();
        }
      };

      const handleParticipantUpdate = (payload) => {
        // Handle participant status updates
      };

      const handleExamStarted = (payload) => {
        updateStudentStatus("exam_started");
      };

      const handleReconnectNeeded = (payload) => {
        // Try to reconnect automatically
        reconnect();
      };

      const handleRoomStateSync = (payload) => {
        const {
          roomCode,
          participant,
          roomStarted,
          examStarted,
          currentQuestion,
          timeLimit,
          thinkingTime,
          allowRepeat,
          latestToken,
          roomRestarted,
          newRoomCode,
          newToken,
        } = payload;

        // Update time limit if provided (only if recording hasn't finished)
        if (timeLimit !== undefined) {
          setTimeLimit(timeLimit);
          if (!finishedRecording) {
            if (timeLimit > 0) {
              setDisplayTime(formatTime(timeLimit * 1000));
            } else {
              setDisplayTime("xx:xx");
            }
          }
          // If recording has finished, keep timer at "xx:xx"
        }

        // Update other settings
        if (thinkingTime !== undefined) {
          setThinkingTime(thinkingTime);
        }
        if (allowRepeat !== undefined) {
          setAllowRepeat(allowRepeat);
        }

        // Enhanced room restart detection - check multiple indicators
        const hasRoomRestartInfo =
          roomRestarted || newRoomCode || newToken || latestToken;
        const hasTokenInfo = latestToken || newToken;

        if (hasRoomRestartInfo && hasTokenInfo) {
          // Determine which token to use
          const tokenToUse = newToken || latestToken;

          // Get current room info from token
          const currentTokenInfo = tokenManager.getStudentInfo();
          const currentRoomCode = currentTokenInfo?.roomCode;

          // Decode the new token to get the new room code
          const newTokenInfo = tokenManager.decodeStudentToken(tokenToUse);
          const actualNewRoomCode = newRoomCode || newTokenInfo?.roomCode;

          // Only proceed if the new room code is actually newer
          if (isNewerRoomCode(actualNewRoomCode, currentRoomCode)) {
            // Track this room restart
            setLastRoomRestart({
              timestamp: Date.now(),
              newRoomCode: actualNewRoomCode,
              newToken: tokenToUse,
              participant: participant,
            });

            // Always update token and reset for new question
            tokenManager.setStudentToken(tokenToUse);

            toast.success("New question received - preparing...");
            resetForNewQuestion();
            return;
          } else {
            return;
          }
        }

        // Handle exam started state
        if (examStarted && roomStarted) {
          toast.success("Exam has started");
          navigate("/record");
          return;
        }

        // Handle room started but not exam
        if (roomStarted && !examStarted) {
          // Stay on current page, wait for exam to start
        }

        // Additional check: if we receive a state sync with a different room code than current,
        // it might indicate a room restart that wasn't explicitly flagged
        if (roomCode && participant) {
          const currentInfo = tokenManager.getStudentInfo();
          const currentRoomCode = currentInfo?.roomCode;

          if (currentRoomCode && roomCode !== currentRoomCode) {
            // This might be a room restart - force a reset
            toast.success("New question received - preparing...");
            resetForNewQuestion();
            return;
          }
        }
      };

      // Add event listeners
      onWebSocketEvent("room_started", handleRoomStarted);
      onWebSocketEvent("question_changed", handleQuestionChange);
      onWebSocketEvent("room_restart", handleRoomRestart);
      onWebSocketEvent("participant_update", handleParticipantUpdate);
      onWebSocketEvent("exam_started", handleExamStarted);
      onWebSocketEvent("reconnect_needed", handleReconnectNeeded);
      onWebSocketEvent("room_state_sync", handleRoomStateSync);

      // Handle reconnect success
      const handleReconnectSuccess = (payload) => {
        // Silently handle reconnection success - no user notification needed

        // Check if this reconnect contains room restart information
        if (
          payload.roomRestarted ||
          payload.latestToken ||
          payload.newToken ||
          payload.newRoomCode
        ) {
          handleRoomRestart(payload);
        }
      };

      // Handle reconnect errors
      const handleReconnectError = (payload) => {
        console.error("❌ Reconnect error:", payload);

        // Show error message to user
        const errorMessage =
          payload.message || "Failed to reconnect to the room";
        toast.error(errorMessage);

        // If it's a critical error (like room not found), redirect to join page
        if (
          payload.code === "room_not_found" ||
          payload.code === "invalid_token"
        ) {
          toast.error(
            "Room no longer exists or your session has expired. Please rejoin."
          );
          setTimeout(() => {
            navigate("/join");
          }, 3000);
        }
      };

      // Handle being kicked from the room
      const handleKicked = (payload) => {
        // Show kick message to user
        const kickReason =
          payload.reason || "You have been removed from the room";
        toast.error(kickReason);

        // Clear any stored session data
        if (typeof tokenManager !== "undefined" && tokenManager.clearSession) {
          tokenManager.clearSession();
        }

        // Redirect to join page after a delay
        setTimeout(() => {
          navigate("/join");
        }, 3000);
      };

      // Handle connection errors
      const handleConnectionError = (payload) => {
        console.error("❌ Connection error:", payload);

        const errorMessage = payload.message || "Connection error occurred";
        toast.error(errorMessage);
      };

      const handleStateSync = (payload) => {
        // Check if this state sync contains room restart information
        if (
          payload.roomRestarted ||
          payload.latestToken ||
          payload.newToken ||
          payload.newRoomCode
        ) {
          handleRoomStateSync(payload);
        }
      };

      onWebSocketEvent("reconnect_success", handleReconnectSuccess);
      onWebSocketEvent("reconnect_error", handleReconnectError);
      onWebSocketEvent("kicked", handleKicked);
      onWebSocketEvent("connection_error", handleConnectionError);
      onWebSocketEvent("state_sync", handleStateSync);

      return () => {
        // Cleanup event listeners
        offWebSocketEvent("room_started", handleRoomStarted);
        offWebSocketEvent("question_changed", handleQuestionChange);
        offWebSocketEvent("room_restart", handleRoomRestart);
        offWebSocketEvent("participant_update", handleParticipantUpdate);
        offWebSocketEvent("exam_started", handleExamStarted);
        offWebSocketEvent("reconnect_needed", handleReconnectNeeded);
        offWebSocketEvent("room_state_sync", handleRoomStateSync);

        // Clean up additional event listeners
        offWebSocketEvent("reconnect_success", handleReconnectSuccess);
        offWebSocketEvent("reconnect_error", handleReconnectError);
        offWebSocketEvent("kicked", handleKicked);
        offWebSocketEvent("connection_error", handleConnectionError);
        offWebSocketEvent("state_sync", handleStateSync);

        // Clean up WebSocket service properly
        websocketService.cleanup();
      };
    }
  }, [
    connectForReconnect,
    disconnectWebSocket,
    onWebSocketEvent,
    offWebSocketEvent,
    reconnect,
  ]);

  // Update display time when remaining time changes (only if recording hasn't finished)
  useEffect(() => {
    if (!finishedRecording) {
      if (remainingTime > 0) {
        setDisplayTime(formatTime(remainingTime * 1000)); // Convert to milliseconds
      } else if (remainingTime <= 0) {
        setDisplayTime("xx:xx");
      }
    }
    // If recording has finished, keep timer at "xx:xx"
  }, [remainingTime, finishedRecording]);

  // Automatic stage transitions (only for non-user-initiated stages)
  useEffect(() => {
    const handleStageTransitions = async () => {
      // Auto-advance to thinking when audio play is complete (only if there's thinking time)
      if (
        currentStage === "audio_play" &&
        canAdvanceToThinking() &&
        thinkingTime > 0
      ) {
        advanceStage("thinking");
      }

      // Auto-advance directly to recording when audio play is complete and no thinking time
      if (
        currentStage === "audio_play" &&
        canAdvanceToRecording() &&
        thinkingTime <= 0
      ) {
        try {
          // Start recording BEFORE switching to recording stage for minimal delay
          await startRecording();
          updateRecordingData({
            isRecording: true,
            hasRecorded: false,
            recordingError: null,
          });

          // Now advance to recording stage
          advanceStage("recording");
        } catch (error) {
          console.error("❌ Failed to start recording:", error);
          updateRecordingData({
            isRecording: false,
            hasRecorded: false,
            recordingError: error.message,
          });
        }
      }

      // Auto-advance to recording when thinking is complete
      if (currentStage === "thinking" && canAdvanceToRecording()) {
        try {
          // Start recording BEFORE switching to recording stage for minimal delay
          await startRecording();
          updateRecordingData({
            isRecording: true,
            hasRecorded: false,
            recordingError: null,
          });

          // Now advance to recording stage
          advanceStage("recording");
        } catch (error) {
          console.error("❌ Failed to start recording:", error);
          updateRecordingData({
            isRecording: false,
            hasRecorded: false,
            recordingError: error.message,
          });
        }
      }

      // Auto-advance to uploading when recording is complete
      if (currentStage === "recording" && canAdvanceToUploading()) {
        advanceStage("uploading");
      }
    };

    handleStageTransitions();
  }, [currentStage, stageData]);

  // Start audio download when component mounts
  useEffect(() => {
    if (
      currentStage === "initializing" &&
      !stageData.audioDownloaded &&
      !stageData.audioDownloadError
    ) {
      makeResponse();
    }
  }, [currentStage, stageData.audioDownloaded, stageData.audioDownloadError]);

  // Fallback: If we're in initializing stage but no download has started, trigger it
  useEffect(() => {
    if (
      currentStage === "initializing" &&
      !fetching &&
      !stageData.audioDownloaded &&
      !stageData.audioDownloadError
    ) {
      makeResponse();
    }
  }, [
    currentStage,
    fetching,
    stageData.audioDownloaded,
    stageData.audioDownloadError,
  ]);

  // Periodic check for state sync when stuck
  useEffect(() => {
    const checkForStuckState = () => {
      // If we're in initializing for too long without progress, force a refresh
      if (
        currentStage === "initializing" &&
        !fetching &&
        !stageData.audioDownloaded
      ) {
        makeResponse();
      }

      // Additional check: if we're in any stage for too long without progress, request state sync
      const timeInCurrentStage =
        Date.now() - (window.stageStartTime || Date.now());
      if (timeInCurrentStage > 30000) {
        // 30 seconds
        // Request state sync from server
        if (window.websocketService) {
          window.websocketService.requestStateSync();
        }
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkForStuckState, 10000);

    return () => clearInterval(interval);
  }, [currentStage, fetching, stageData.audioDownloaded]);

  // Start thinking timer when thinking stage begins
  useEffect(() => {
    if (currentStage === "thinking" && thinkingTime > 0) {
      const startTime = Date.now();
      const totalDuration = thinkingTime * 1000; // Convert to milliseconds

      // Initialize thinking time
      updateThinkingData({
        thinkingTimeRemaining: thinkingTime,
        thinkingComplete: false,
      });

      // Smooth animation timer (updates every 16ms for 60fps)
      const smoothInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalDuration - elapsed);
        const remainingSeconds = Math.ceil(remaining / 1000);
        const progress = remaining / totalDuration; // 1 to 0

        setThinkingProgress(progress);

        setStageData((prev) => {
          if (remaining <= 0) {
            // Thinking time complete
            clearInterval(smoothInterval);
            return {
              ...prev,
              thinking: {
                thinkingTimeRemaining: 0,
                thinkingComplete: true,
              },
            };
          }

          return {
            ...prev,
            thinking: {
              thinkingTimeRemaining: remainingSeconds,
              thinkingComplete: false,
            },
          };
        });
      }, 16); // 60fps for smooth animation

      // Cleanup interval on unmount or stage change
      return () => {
        clearInterval(smoothInterval);
      };
    }
  }, [currentStage, thinkingTime]);

  // Fallback: Auto-start recording if somehow we're in recording stage without recording started
  useEffect(() => {
    const handleFallbackRecording = async () => {
      if (
        currentStage === "recording" &&
        !stageData.recording.isRecording &&
        !stageData.recording.hasRecorded
      ) {
        try {
          // Start recording as fallback
          await startRecording();
          updateRecordingData({
            isRecording: true,
            hasRecorded: false,
            recordingError: null,
          });
        } catch (error) {
          console.error("❌ Fallback recording failed:", error);
          updateRecordingData({
            isRecording: false,
            hasRecorded: false,
            recordingError: error.message,
          });
        }
      }
    };

    handleFallbackRecording();
  }, [currentStage]);

  const isStreamValid = (stream) => {
    if (!stream) return false;
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 && tracks[0].readyState === "live";
  };

  // Initialize Web Speech API
  const initializeSpeechRecognition = () => {
    // Check if Web Speech API is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();

    // Configure recognition settings
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.interimResults = false; // Only get final results to avoid duplication
    recognition.lang = examLanguage; // Set language for recognition

    // Handle recognition results
    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      // Update recognized text with final results only
      if (finalTranscript) {
        setRecognizedText((prev) => {
          const newText = prev + finalTranscript;

          // Update the ref immediately for synchronous access
          finalRecognizedTextRef.current = newText;

          return newText;
        });
      }
    };

    // Handle errors
    recognition.onerror = (event) => {
      console.error("🎤 Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        console.error("🎤 Microphone access denied for speech recognition");
      }
    };

    // Handle end of recognition
    recognition.onend = () => {
      setIsListening(false);
    };

    // Handle start of recognition
    recognition.onstart = () => {
      setIsListening(true);
    };

    return recognition;
  };

  // Start speech recognition
  const startSpeechRecognition = () => {
    if (!speechRecognition) {
      const recognition = initializeSpeechRecognition();
      if (recognition) {
        setSpeechRecognition(recognition);
        recognition.start();
      }
    } else {
      try {
        speechRecognition.start();
      } catch (error) {
        console.error("🎤 Error starting speech recognition:", error);
      }
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  // Map exam language to speech recognition language codes
  const mapLanguageToSpeechRecognition = (examLang) => {
    const languageMap = {
      // English variants
      English: "en-US",
      english: "en-US",
      en: "en-US",
      "en-US": "en-US",
      "en-GB": "en-GB",

      // Spanish variants
      Spanish: "es-ES",
      spanish: "es-ES",
      es: "es-ES",
      "es-ES": "es-ES",
      "es-US": "es-US",
      "es-MX": "es-MX",

      // French variants
      French: "fr-FR",
      french: "fr-FR",
      fr: "fr-FR",
      "fr-FR": "fr-FR",
      "fr-CA": "fr-CA",

      // German variants
      German: "de-DE",
      german: "de-DE",
      de: "de-DE",
      "de-DE": "de-DE",

      // Italian variants
      Italian: "it-IT",
      italian: "it-IT",
      it: "it-IT",
      "it-IT": "it-IT",

      // Portuguese variants
      Portuguese: "pt-BR",
      portuguese: "pt-BR",
      pt: "pt-BR",
      "pt-BR": "pt-BR",
      "pt-PT": "pt-PT",

      // Chinese variants
      Chinese: "zh-CN",
      chinese: "zh-CN",
      zh: "zh-CN",
      "zh-CN": "zh-CN",
      "zh-TW": "zh-TW",

      // Japanese
      Japanese: "ja-JP",
      japanese: "ja-JP",
      ja: "ja-JP",
      "ja-JP": "ja-JP",

      // Korean
      Korean: "ko-KR",
      korean: "ko-KR",
      ko: "ko-KR",
      "ko-KR": "ko-KR",

      // Russian
      Russian: "ru-RU",
      russian: "ru-RU",
      ru: "ru-RU",
      "ru-RU": "ru-RU",

      // Arabic
      Arabic: "ar-SA",
      arabic: "ar-SA",
      ar: "ar-SA",
      "ar-SA": "ar-SA",

      // Hindi
      Hindi: "hi-IN",
      hindi: "hi-IN",
      hi: "hi-IN",
      "hi-IN": "hi-IN",
    };

    return languageMap[examLang] || examLang || null;
  };

  const requestPermissions = async () => {
    try {
      // Check if we already have a valid microphone stream
      if (microphoneStream && isStreamValid(microphoneStream)) {
        setHasPermissions(true);
        setError(null);
        setIsError(false);
        return { permissionGranted: true, stream: microphoneStream };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = true;
      }
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = true;
      }

      // Store the microphone stream for later reuse
      setMicrophoneStream(stream);
      setHasPermissions(true);
      setError(null); // Clear error when permissions are granted
      setIsError(false);
      return { permissionGranted: true, stream };
    } catch (err) {
      console.error("Error requesting microphone permission:", err);
      setError(
        "Microphone and camera access is required first. Click here to try again."
      );
      setIsError(true);
      return { permissionGranted: false };
    }
  };

  const handleAudioStop = async (blobUrl, blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "audio.wav");

    // Update recording data with blob
    updateRecordingData({
      recordingBlob: blob,
      hasRecorded: true,
      isRecording: false,
    });

    // Start upload process
    await upload(formData);
    setAudioURL(blobUrl);
    setIsRecording(false);
    if (audioRef.current) {
      audioRef.current.src = blobUrl;
    }
  };

  const handleScreenStop = async (blobUrl, blob) => {
    const formData = new FormData();
    formData.append("screen", blob, "screen.webm");
    uploadScreen(formData);
  };

  // Request screen sharing permission
  const requestScreenPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          cursor: "always",
        },
      });

      // Check if user selected the entire screen
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings();
        // displaySurface will be "monitor" if the entire screen was selected
        if (
          settings.displaySurface != "window" &&
          settings.displaySurface != "application" &&
          settings.displaySurface != "browser" &&
          settings.displaySurface != "tab"
        ) {
          setIsWholeScreen(true);
          setScreenStream(stream);
          setHasScreenPermission(true);
          setError(null); // Clear error when screen permission is granted
          setIsError(false);
          return { permissionGranted: true, stream };
        } else {
          // If not the entire screen, stop the stream and ask again
          tracks.forEach((track) => track.stop());
          setError(
            "Please select your entire screen, not just a window or tab."
          );
          setIsError(true);
          return { permissionGranted: false };
        }
      }
      return { permissionGranted: false };
    } catch (err) {
      console.error("Error requesting screen permission:", err);
      setError("Screen sharing access is required. Click here to try again.");
      setIsError(true);
      return { permissionGranted: false };
    }
  };

  // Cleanup streams on component unmount
  useEffect(() => {
    return () => {
      // Clean up microphone stream
      if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => track.stop());
      }
      // Clean up screen stream
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      // Clean up speech recognition
      if (speechRecognition && isListening) {
        speechRecognition.stop();
      }
    };
  }, [microphoneStream, screenStream, speechRecognition, isListening]);

  // Initialize setup on component mount
  useEffect(() => {
    document.documentElement.style.setProperty("--cute-alert-max-width", "40%");

    // Start fetching the question audio immediately
    getAudio();

    // Show initial instructions
    /*cuteAlert({
      type: "info",
      title: "Get Ready to Record",
      description:
        "It's time to record your response. First, we'll need to set up your screen sharing permissions. After that, you'll enter fullscreen mode and can listen to the question. If your teacher has allowed it, it will then count down for a few seconds before beginning recording, during which you think about your answer, or replay the question once (if allowed), and THEN begin recording. Speak clearly, confidently, and loudly, so that your microphone picks up your audio well. If you are not currently wearing headphones, please do so now if possible.",
      primaryButtonText: "Got it",
    });*/
  }, []);

  // Monitor audio status changes
  useEffect(() => {
    if (audioStatus === "granted") {
      // Microphone and camera permissions have been granted
    }
  }, [audioStatus]);

  // Monitor fullscreen state and prevent suspicious activities
  useEffect(() => {
    const reportCheatingViaWebSocket = (messageText) => {
      if (websocketService && websocketService.isConnected) {
        websocketService.reportCheating(messageText);

        // Set flags to prevent multiple reports
        if (messageText === "Fullscreen exit detected") {
          setFullscreenViolationReported(true);
        } else if (messageText === "Tab switch detected") {
          setTabSwitchReported(true);
        }
      } else {
        console.error("WebSocket not connected, cannot report cheating");
      }
    };

    const onFullscreenChange = () => {
      // If they exit fullscreen during setup, uncheck the fullscreen setup
      if (
        !document.fullscreenElement &&
        currentStage === "setup" &&
        stageData.setup.fullscreenEnabled
      ) {
        updateSetup({ fullscreenEnabled: false });
        return;
      }

      // If they exit fullscreen during exam (after Continue to Question), report cheating
      // But don't flag them immediately if this is a room restart and they haven't clicked continue yet
      if (
        !document.fullscreenElement &&
        examStarted &&
        !finishedRecording &&
        !fullscreenViolationReported &&
        !(lastRoomRestart && currentStage === "initializing") // Don't flag during room restart before continue
      ) {
        setFullscreenViolationReported(true); // Set flag to prevent multiple alerts
        reportCheatingViaWebSocket("Fullscreen exit detected");
        cuteToast({
          type: "error",
          title: "Fullscreen exit detected",
          description:
            "Exiting fullscreen is not allowed. This will be reported to your teacher.",
        });
      }
    };

    const onVisibilityChange = () => {
      if (
        document.hidden &&
        examStarted &&
        !finishedRecording &&
        !tabSwitchReported &&
        !(lastRoomRestart && currentStage === "initializing") // Don't flag during room restart before continue
      ) {
        setTabSwitchReported(true); // Set flag to prevent multiple alerts
        reportCheatingViaWebSocket("Tab switch detected");
        cuteToast({
          type: "error",
          title: "Tab switch detected",
          description:
            "You switched tabs or went out of the window. This will be reported to your teacher.",
        });
      }
    };

    const preventKeyShortcuts = (e) => {
      // Always prevent these shortcuts (block F12, escape, etc.)
      if (
        (e.ctrlKey && e.shiftKey && e.key === "I") || // Prevent DevTools (Ctrl+Shift+I)
        (e.ctrlKey && e.shiftKey && e.key === "J") || // Prevent DevTools (Ctrl+Shift+J)
        (e.metaKey && e.altKey && e.key === "I") || // Prevent DevTools (Cmd+Option+I) - Mac
        (e.metaKey && e.altKey && e.key === "J") || // Prevent DevTools (Cmd+Option+J) - Mac
        (e.ctrlKey && e.key === "U") || // Prevent View Source (Ctrl+U)
        (e.metaKey && e.key === "U") || // Prevent View Source (Cmd+U) - Mac
        e.key === "F12" || // Prevent F12
        e.key === "Escape" || // Prevent Escape
        e.code === "Escape" // Also check the key code
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventContextMenu = (e) => {
      e.preventDefault(); // Disable right-click context menu
    };

    const checkFocusAndFullscreen = () => {
      if (
        examStarted &&
        !finishedRecording &&
        !fullscreenViolationReported &&
        (!document.fullscreenElement ||
          document.hidden ||
          document.hasFocus() === false) &&
        !(lastRoomRestart && currentStage === "initializing") // Don't flag during room restart before continue
      ) {
        setFullscreenViolationReported(true); // Set flag to prevent multiple alerts
        reportCheatingViaWebSocket("Focus or fullscreen lost");
        cuteToast({
          type: "error",
          title: "Focus or fullscreen lost",
          description:
            "You lost focus or exited fullscreen. This will be reported to your teacher.",
        });
      }
    };

    const focusCheckInterval = setInterval(checkFocusAndFullscreen, 1000);

    document.addEventListener("fullscreenchange", onFullscreenChange, true);
    document.addEventListener("visibilitychange", onVisibilityChange, true);
    document.addEventListener("keydown", preventKeyShortcuts, true);
    document.addEventListener("contextmenu", preventContextMenu, true);

    return () => {
      clearInterval(focusCheckInterval);
      document.removeEventListener(
        "fullscreenchange",
        onFullscreenChange,
        true
      );
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
        true
      );
      document.removeEventListener("keydown", preventKeyShortcuts, true);
      document.removeEventListener("contextmenu", preventContextMenu, true);
    };
  }, [
    finishedRecording,
    fullscreenViolationReported,
    tabSwitchReported,
    isFullscreen,
    currentStage, // Monitor during exam stages
    lastRoomRestart, // Monitor room restart state
  ]);

  const pulse = keyframes`
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  `;

  const animation = (props) => css`
    ${pulse} 1.1s infinite;
  `;

  const recordStyle = {
    background: "radial-gradient(circle at bottom, #ff0000 0%, #b20000 70%)",
    boxShadow:
      "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2)",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    margin: "0 auto",
    position: "relative",
    transition: "background 0.3s ease",
    animation: `${animation}`,
  };

  const PulseButton = styled.button`
    animation: ${animation};
  `;

  const playBeep = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C5", "8n");
  };

  const playRecordingStarted = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C6", "4n");
  };

  const makeResponse = async () => {
    setFetching(true);

    // Check if student is authenticated
    if (!tokenManager.isAuthenticated()) {
      toast.error("Please join the room first");
      navigate("/join-room");
      return;
    }

    const token = tokenManager.getStudentToken();

    try {
      const response = await fetch(
        `https://www.server.speakeval.org/receiveaudio?token=${token}&number=1`
      );

      const receivedData = await response.json();

      if (!response.ok) {
        // Check if recording already exists
        if (receivedData.code === "RECORDING_EXISTS") {
          setError(
            "You have already completed this question. Please wait for the next question or for your teacher to restart the room."
          );
          setIsError(false); // This is not an error, just informational
          updateStageData({
            audioDownloadError: "Recording already completed",
          });
          // Mark as finished since recording already exists
          setFinishedRecording(true);
          setCurrentStage("finished");
          return;
        }

        setError("Failed to fetch audio");
        setIsError(true);
        updateStageData({ audioDownloadError: "Failed to fetch audio" });
        return;
      }

      const audioUrls = receivedData.audioUrls;

      if (receivedData.subscribed) {
        setPremium(true);
      }

      if (receivedData.thinkingTime) {
        setThinkingTime(receivedData.thinkingTime);
      }

      if (receivedData.allowRepeat !== undefined) {
        setAllowRepeat(receivedData.allowRepeat);
      }

      if (receivedData.timeLimit) {
        setTimeLimit(receivedData.timeLimit);
        // Only set display time if recording hasn't finished yet
        if (!finishedRecording) {
          // Set initial display time to time limit only if it's not -1 (no limit)
          if (receivedData.timeLimit > 0) {
            setDisplayTime(formatTime(receivedData.timeLimit * 1000)); // Convert to milliseconds
          } else {
            setDisplayTime("xx:xx"); // No time limit
          }
        }
        // If recording has finished, keep timer at "xx:xx"
      }

      // Extract language information if available
      if (receivedData.language) {
        const language = mapLanguageToSpeechRecognition(receivedData.language);
        setExamLanguage(language);
      } else {
        // Don't enable speech recognition if language can't be determined
        setExamLanguage(null);
      }

      if (audioUrls && audioUrls.length > 0) {
        // Use the presigned URL directly
        setAudioBlobURL(audioUrls[0]);
        questionIndex = receivedData.questionIndex;

        // Mark audio as downloaded successfully
        updateStageData({
          audioDownloaded: true,
          audioDownloadError: null,
        });
      } else {
        updateStageData({
          audioDownloaded: false,
          audioDownloadError: "No questions received" + receivedData.error ? ": " + receivedData.error : "",
        });
      }

      setQuestionAudioReady(true);
    } catch (err) {
      console.error("Error fetching audio:", err);
      setError(
        "An error occurred while fetching the audio. Try reloading the page."
      );
      setIsError(true);
      updateStageData({
        audioDownloaded: false,
        audioDownloadError: "An error occurred while fetching the audio",
      });
    } finally {
      setFetching(false);
    }
  };

  const getAudio = async () => {
    if (!audioBlobURL) {
      try {
        await makeResponse();
      } catch (err) {
        console.error("Error fetching audio:", err);
        setError(
          "An error occurred while fetching the audio. Try reloading the page."
        );
        setIsError(true);
      }
      setObtainedAudio(true);
    }
  };

  let interval = null;

  const startRecording = async () => {
    const currentTime = Date.now();
    setIsRecording(true);
    setAudioURL(null);

    // Reset recognized text for new recording
    setRecognizedText("");
    finalRecognizedTextRef.current = ""; // Reset ref as well

    // Ensure fullscreen is active for recording
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    }

    // Enable fullscreen monitoring
    setIsFullscreen(true);

    try {
      // Ensure permissions are granted before starting recording
      const permissionResult = await requestPermissions();
      if (!permissionResult.permissionGranted) {
        console.error("❌ Microphone permission not granted");
        setError(
          "Microphone permission is required to start recording. Please grant permission and try again."
        );
        setIsError(true);
        setIsRecording(false);

        // Show prominent error alert with reload instructions
        cuteAlert({
          type: "error",
          title: "Microphone Permission Required",
          description:
            "We couldn't access your microphone. This is required to complete the exam. Please check your browser settings to allow microphone access for this site, then reload the page to try again.",
          primaryButtonText: "Reload Page",
          secondaryButtonText: "Cancel",
        }).then((event) => {
          if (event === "primaryButtonClicked") {
            window.location.reload();
          }
        });

        return;
      }

      // Start recording - this will use the browser's MediaRecorder API
      // which should work with the permissions we've already granted
      try {
        startAudioRecording();

        // Start speech recognition only if language is available from API
        if (examLanguage) {
          startSpeechRecognition();
        }
      } catch (recordingError) {
        console.error("❌ Failed to start audio recording:", recordingError);
        // If recording fails, try to refresh permissions and try again
        setMicrophoneStream(null); // Clear the cached stream
        const refreshResult = await requestPermissions();
        if (refreshResult.permissionGranted) {
          startAudioRecording();
          if (examLanguage) {
            startSpeechRecognition();
          }
        } else {
          console.error("❌ Failed to refresh microphone permissions");
          setError("Unable to access microphone after multiple attempts.");
          setIsError(true);
          setIsRecording(false);

          // Show prominent error alert with reload instructions
          cuteAlert({
            type: "error",
            title: "Microphone Access Failed",
            description:
              "We tried multiple times but couldn't access your microphone. Please check your browser settings to ensure microphone access is allowed for this site, then reload the page to try again.",
            primaryButtonText: "Reload Page",
            secondaryButtonText: "Cancel",
            primaryButtonAction: () => {
              window.location.reload();
            },
          });

          return;
        }
      }

      // Notify server via WebSocket
      wsStartRecording();
      updateStudentStatus("recording");
      updateRoomStatus({
        status: "recording",
        timestamp: currentTime,
        participant: tokenManager.getStudentInfo()?.participant,
      });

      // Fix timer implementation
      if (timer.current !== -1) {
        clearInterval(timer.current);
      }

      // Only start countdown if there's a time limit
      if (timeLimit > 0) {
        setRemainingTime(timeLimit); // Start with time limit
        // Only set display time if recording hasn't finished
        if (!finishedRecording) {
          setDisplayTime(formatTime(timeLimit * 1000)); // Set initial display time
        }

        timer.current = setInterval(() => {
          setRemainingTime((prevTime) => {
            const newTime = prevTime - 1;

            // Update display time only if recording hasn't finished
            if (!finishedRecording) {
              if (newTime > 0) {
                setDisplayTime(formatTime(newTime * 1000));
              } else {
                setDisplayTime("xx:xx");
              }
            }

            // Local time limit handling
            if (newTime <= 5 && newTime > 0) {
              // Warning: 5 seconds before time limit
              if (
                !error ||
                (!error.includes("Processing...") &&
                  !error.includes("Uploaded to server successfully.") &&
                  !finishedRecording)
              ) {
                setError(
                  "Reaching time limit. Please finish your response in the next 5 seconds. "
                );
                setIsError(true);
              }
            } else if (newTime <= 0) {
              // Time limit reached
              setDisplayTime("xx:xx");
              if (
                error ===
                "Reaching time limit. Please finish your response in the next 5 seconds. "
              ) {
                setError(
                  "You reached the time limit and your audio was stopped and uploaded automatically. It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue."
                );
                setIsError(false);
              }
              stopRecording();
            }

            return newTime;
          });
        }, 1000);
      } else {
        // No time limit - just show xx:xx
        setRemainingTime(-1);
        setDisplayTime("xx:xx");
      }
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        "An error occurred while starting the recording. Please try again. Perhaps reload the page."
      );
      setIsError(true);
    }

    // Notify server about recording start (fallback)
    let success = false;
    while (!success) {
      try {
        const token = tokenManager.getStudentToken();
        const response = await fetch(
          `https://www.server.speakeval.org/started_playing_audio?token=${token}&time=${currentTime}`
        );
        const data = await response.json();
        if (data.message) {
          success = true;
        } else {
          console.error("Failed to notify server. Retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      } catch (error) {
        console.error("Error notifying server. Retrying...", error);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  };

  const upload = async (formData) => {
    // Update uploading stage data
    updateUploadingData({
      isUploading: true,
      uploadProgress: 0,
      uploadComplete: false,
      uploadError: null,
    });

    // Disable anti-cheat system after upload starts (exam is complete)
    setIsFullscreen(false);

    setError(
      "Processing... It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue."
    );
    setIsError(false);
    setFinishedRecording(true);

    // Notify WebSocket about upload start
    uploadStarted();
    updateStudentStatus("uploading");

    // Check if student is authenticated
    if (!tokenManager.isAuthenticated()) {
      toast.error("Please join the room first");
      navigate("/join-room");
      return;
    }

    const token = tokenManager.getStudentToken();
    const info = tokenManager.getStudentInfo();

    try {
      // First, get a presigned URL for upload
      const uploadUrlResponse = await fetch(
        `https://www.server.speakeval.org/get-recording-upload-url?token=${token}`,
        {
          method: "GET",
        }
      );

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();

        // Check if recording already exists
        if (errorData.code === "RECORDING_EXISTS") {
          setError(
            "You have already completed this question. Please wait for the next question or for your teacher to restart the room."
          );
          setIsError(false); // This is not an error, just informational
          setFinishedRecording(true);
          setCurrentStage("finished");
          return;
        }

        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl } = await uploadUrlResponse.json();

      // Upload directly to S3 using presigned URL with exponential backoff retries
      let uploadResponse;
      const maxAttempts = 5; // realistic max attempts
      const baseDelayMs = 1000; // 1s base
      const maxDelayMs = 8000; // cap at 8s

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: formData.get("audio"),
            headers: {
              "Content-Type": "audio/wav",
            },
          });

          if (!uploadResponse.ok) {
            // Check if it's a CORS error - don't retry S3 for this, fall back immediately
            if (
              uploadResponse.status === 0 ||
              uploadResponse.type === "opaque"
            ) {
              console.warn(
                "CORS error detected, falling back to server upload"
              );
              throw new Error("CORS_ERROR");
            }
            throw new Error("S3_UPLOAD_FAILED");
          }

          // Success - exit retry loop
          break;
        } catch (e) {
          // If CORS, bubble up to outer catch for server upload fallback
          if (e && e.message === "CORS_ERROR") {
            throw e;
          }

          // If this was the last attempt, rethrow
          if (attempt === maxAttempts) {
            throw e;
          }

          // Inform user and wait with capped exponential backoff
          const delay = Math.min(
            baseDelayMs * Math.pow(2, attempt - 1),
            maxDelayMs
          );
          setError(
            `Upload failed, retrying in ${Math.round(
              delay / 1000
            )} seconds (attempt ${attempt}/${maxAttempts})...`
          );
          setIsError(false);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Update to show upload complete, waiting for transcription
      updateUploadingData({
        isUploading: false,
        uploadComplete: false,
        uploadError: null,
        waitingForTranscription: true,
      });

      // Notify server that upload is complete with speech recognition results
      const uploadData = {
        uploaded: true,
        speechRecognitionText:
          finalRecognizedTextRef.current || recognizedText || null, // Use ref first, then state as fallback
        recognitionLanguage: examLanguage,
      };

      const response = await fetch(
        `https://www.server.speakeval.org/upload?token=${token}&index=${questionIndex}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadData),
        }
      );

      if (!response.ok) {
        const retryInterval = setInterval(async () => {
          const retryUploadData = {
            uploaded: true,
            speechRecognitionText:
              finalRecognizedTextRef.current || recognizedText || null,
            recognitionLanguage: examLanguage,
          };

          const retryResponse = await fetch(
            `https://www.server.speakeval.org/upload?token=${token}&index=${questionIndex}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(retryUploadData),
            }
          );
          if (retryResponse.ok) {
            setFinishedRecording(true);
            clearInterval(retryInterval);
            const data = await retryResponse.json();
            setDisplayTime("xx:xx");

            // Update uploading stage data with transcription
            updateUploadingData({
              isUploading: false,
              uploadComplete: true,
              uploadError: null,
              transcriptionText: data.transcription,
              waitingForTranscription: false,
            });

            // Notify WebSocket about successful upload
            uploadCompleted();
            updateStudentStatus("upload_completed");
            questionCompleted(questionIndex);
          }
        }, 10000);
      } else {
        setFinishedRecording(true);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setIsError(true);
          updateUploadingData({
            isUploading: false,
            uploadComplete: false,
            uploadError: data.error,
          });
          return;
        }

        // Update uploading stage data with transcription
        updateUploadingData({
          isUploading: false,
          uploadComplete: true,
          uploadError: null,
          transcriptionText: data.transcription,
          waitingForTranscription: false,
        });

        // Notify WebSocket about successful upload
        uploadCompleted();
        updateStudentStatus("upload_completed");
        questionCompleted(questionIndex);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);

      // Handle CORS error with fallback
      if (error.message === "CORS_ERROR") {
        try {
          const fallbackResponse = await fetch(
            `https://www.server.speakeval.org/upload?token=${token}&index=${questionIndex}`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            setFinishedRecording(true);
            setDisplayTime("xx:xx");

            // Update uploading stage data with transcription
            updateUploadingData({
              isUploading: false,
              uploadComplete: true,
              uploadError: null,
              transcriptionText: data.transcription,
              waitingForTranscription: false,
            });

            // Notify WebSocket about successful upload
            uploadCompleted();
            updateStudentStatus("upload_completed");
            questionCompleted(questionIndex);
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback upload also failed:", fallbackErr);
        }
      }

      setError("Failed to upload audio. Please try again.");
      setIsError(true);
      updateUploadingData({
        isUploading: false,
        uploadComplete: false,
        uploadError: "Failed to upload audio. Please try again.",
      });
    }

    if (interval) {
      clearInterval(interval);
      updateTimer(0);
    }
    setFinishedRecording(true);
    setDisplayTime("xx:xx");
  };

  const uploadScreen = async (formData) => {
    try {
      // Get token from localStorage
      const token = tokenManager.getStudentToken();
      if (!token) {
        console.error("No token available for screen upload");
        return;
      }

      await fetch(
        `https://www.server.speakeval.org/upload_screen?token=${token}&index=${questionIndex}`,
        {
          method: "POST",
          body: formData,
        }
      );
    } catch (err) {
      console.error("Error uploading screen recording:", err);
    }
  };

  const playRecording = async () => {
    if (playing || waiting || played) return;

    setPlaying(true);
    setHasPlayed(true);
    played = true;

    // Notify WebSocket about audio playback
    audioPlaybackStarted();

    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();

        // Notify WebSocket when audio playback completes
        audioRef.current.onended = () => {
          audioPlaybackCompleted();
        };
      } else {
        setTimeout(playAudio, 100);
      }
    };
    playAudio();
  };

  const stopRecording = () => {
    setStopped(true);
    setIsRecording(false);

    // Stop speech recognition and log final text after a small delay

    // Capture current recognized text before stopping recognition
    const currentRecognizedText = recognizedText;

    stopSpeechRecognition();

    // Stop the media recorders - this will trigger handleAudioStop
    stopAudioRecording();
    stopScreenRecording();

    // Clear timer properly
    if (timer.current !== -1) {
      clearInterval(timer.current);
      timer.current = -1;
    }

    // Reset display time
    setDisplayTime("xx:xx");
    setRemainingTime(-1);

    // Disable fullscreen monitoring when recording stops
    setIsFullscreen(false);

    // Notify server via WebSocket
    wsStopRecording();
    updateStudentStatus("stopped_recording");
    updateRoomStatus({
      status: "stopped_recording",
      timestamp: Date.now(),
      participant: tokenManager.getStudentInfo()?.participant,
    });
  };

  const updateTimer = (time) => {
    timer.current = time;
    // Only update display time if recording hasn't finished
    if (!finishedRecording) {
      setDisplayTime(formatTime(time));
      if (time < 0) setDisplayTime("xx:xx");
    }
    // If recording has finished, keep timer at "xx:xx"
  };

  const formatTime = (time) => {
    if (time <= 0) return "xx:xx";
    const minutes = Math.floor(time / 60000);
    const seconds = Math.round((time % 60000) / 1000);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    toast.warn(
      "You are now in fullscreen mode. You may not exit or switch to any other tabs, or this will be reported to your teacher and they may choose to administer a zero.",
      {
        autoClose: 5000,
        position: "top-center",
      }
    );
  };

  let countdownInterval;

  return (
    <>
      {/* CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#bfdbfe",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "80px",
            fontSize: "48px",
            fontWeight: "bold",
            color:
              displayTime !== "xx:xx" && remainingTime > 0 && remainingTime <= 5
                ? "red"
                : "#374151",
          }}
        >
          {displayTime}
        </div>

        {/* Stage-based content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            width: "90%",
            maxWidth: "700px",
            textAlign: "center",
            transform: "translateY(10%)",
            minHeight: "400px", // Make it taller to support all stages
          }}
        >
          {/* Stage content */}
          {currentStage === "initializing" && (
            <div style={{ marginTop: "16px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "16px",
                }}
              >
                {stageData.audioDownloaded
                  ? "Downloaded Exam"
                  : "Downloading Exam..."}
              </h1>

              {/* Download Animation with Custom Images */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                {/* Fixed Content Container - This won't move */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: "160px", // Reserve space for content + button
                  }}
                >
                  {/* Image Container */}
                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!stageData.audioDownloaded ? (
                      <img
                        src="/download-load.gif"
                        alt="Downloading exam"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <img
                        src="/download-done.png"
                        alt="Download complete"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </div>

                  {/* Error Message */}
                  {stageData.audioDownloadError && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#EF4444",
                        margin: "8px 0 0 0",
                        textAlign: "center",
                      }}
                    >
                      {stageData.audioDownloadError}
                    </p>
                  )}

                  {/* Continue Button - always takes up space, just invisible when not needed */}
                  <div
                    style={{
                      height: "44px", // Fixed height for button + margin
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        stageData.audioDownloaded &&
                        !stageData.audioDownloadError
                          ? 1
                          : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {stageData.audioDownloaded &&
                      !stageData.audioDownloadError && (
                        <button
                          onClick={async () => {
                            // Check if we can skip setup for room restart
                            const canSkipSetup = await canSkipSetupForRestart();

                            if (canSkipSetup) {
                              // Update setup data with current permissions
                              const permissions =
                                await checkCurrentPermissions();
                              updateSetup({
                                microphonePermission:
                                  permissions.microphonePermission,
                                fullscreenEnabled:
                                  permissions.fullscreenEnabled,
                              });

                              // Enable anticheat and go directly to audio play
                              setIsFullscreen(true);
                              setExamStarted(true);
                              advanceStage("audio_play");
                            } else {
                              advanceStage("setup");
                            }
                          }}
                          style={{
                            padding: "10px 24px",
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "white",
                            backgroundColor: "#10B981",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = "#059669")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "#10B981")
                          }
                        >
                          Continue
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Stage */}
          {currentStage === "setup" && (
            <div style={{ marginTop: "20px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "20px",
                }}
              >
                Exam Setup
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  marginBottom: "24px",
                }}
              >
                Please complete the following setup steps before starting your
                exam:
              </p>

              {/* Setup Checklist with Reserved Button Space */}
              <div
                style={{
                  maxWidth: "500px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "200px", // Reserve space for checklist + button
                }}
              >
                {/* Checklist Items */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  {/* Microphone Permission */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: stageData.setup.microphonePermission
                            ? "#10B981"
                            : setupLoading.microphone
                            ? "#3B82F6"
                            : "#D1D5DB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {stageData.setup.microphonePermission && (
                          <span
                            style={{
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                        {setupLoading.microphone && (
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              border: "2px solid transparent",
                              borderTop: "2px solid white",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Microphone/Camera Permission
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6B7280",
                            margin: "0",
                          }}
                        >
                          Allow microphone access for recording
                        </p>
                      </div>
                    </div>
                    {!stageData.setup.microphonePermission && (
                      <button
                        onClick={async () => {
                          setSetupLoading((prev) => ({
                            ...prev,
                            microphone: true,
                          }));
                          const perms = await requestPermissions();
                          if (perms.permissionGranted) {
                            updateSetup({ microphonePermission: true });
                          }
                          setSetupLoading((prev) => ({
                            ...prev,
                            microphone: false,
                          }));
                        }}
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "white",
                          backgroundColor: "#3B82F6",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#2563EB")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#3B82F6")
                        }
                      >
                        Grant Access
                      </button>
                    )}
                  </div>

                  {/* Fullscreen Mode */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: stageData.setup.fullscreenEnabled
                            ? "#10B981"
                            : setupLoading.fullscreen
                            ? "#3B82F6"
                            : "#D1D5DB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {stageData.setup.fullscreenEnabled && (
                          <span
                            style={{
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                        {setupLoading.fullscreen && (
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              border: "2px solid transparent",
                              borderTop: "2px solid white",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#374151",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Fullscreen Mode
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#6B7280",
                            margin: "0",
                          }}
                        >
                          Enter fullscreen for exam security
                        </p>
                      </div>
                    </div>
                    {!stageData.setup.fullscreenEnabled && (
                      <button
                        onClick={async () => {
                          setSetupLoading((prev) => ({
                            ...prev,
                            fullscreen: true,
                          }));
                          setIsFullscreen(true); // Enable fullscreen monitoring
                          enterFullscreen();
                          updateSetup({ fullscreenEnabled: true });
                          setSetupLoading((prev) => ({
                            ...prev,
                            fullscreen: false,
                          }));
                        }}
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "white",
                          backgroundColor: "#3B82F6",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#2563EB")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "#3B82F6")
                        }
                      >
                        Enter Fullscreen
                      </button>
                    )}
                  </div>
                </div>

                {/* Continue Button - always takes up space, just invisible when not needed */}
                <div
                  style={{
                    height: "80px", // Increased height for button + margin
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: canAdvanceToAudioPlay() ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {canAdvanceToAudioPlay() && (
                    <button
                      onClick={() => {
                        setIsFullscreen(true); // Enable fullscreen monitoring
                        setExamStarted(true); // Mark exam as started
                        advanceStage("audio_play");
                      }}
                      style={{
                        padding: "12px 32px",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: "#10B981",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.backgroundColor = "#059669")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.backgroundColor = "#10B981")
                      }
                    >
                      Continue to Question
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audio Play Stage */}
          {currentStage === "audio_play" && (
            <div style={{ marginTop: "20px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "20px",
                }}
              >
                Listen to Question
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  marginBottom: "24px",
                }}
              >
                Please listen to the question carefully before recording your
                response.
              </p>

              {/* Audio Player */}
              <div
                style={{
                  maxWidth: "500px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {/* Audio Controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <PulseButton
                    onClick={() => {
                      if (audioRef.current && audioRef.current.paused) {
                        audioRef.current.play();
                        updateAudioPlayData({ isPlaying: true });
                      }
                    }}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.3s",
                      animation: "none",
                    }}
                  >
                    <Play size={24} color="white" fill="white" />
                  </PulseButton>

                  {stageData.audioPlay.hasPlayed && (
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          audioRef.current.play();
                          updateAudioPlayData({ isPlaying: true });
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3B82F6",
                        backgroundColor: "transparent",
                        border: "2px solid #3B82F6",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#3B82F6";
                        e.target.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#3B82F6";
                      }}
                    >
                      Replay
                    </button>
                  )}
                </div>

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  style={{ display: "none" }}
                  onPlay={() => {
                    updateAudioPlayData({ isPlaying: true });
                  }}
                  onPause={() => {
                    updateAudioPlayData({ isPlaying: false });
                  }}
                  onEnded={() => {
                    updateAudioPlayData({
                      isPlaying: false,
                      hasPlayed: true,
                    });
                  }}
                  onError={() => {
                    updateAudioPlayData({
                      isPlaying: false,
                      playError: "Failed to load audio",
                    });
                  }}
                  src={audioBlobURL}
                >
                  Your browser does not support the audio element.
                </audio>

                {/* Status Message */}
                <div style={{ textAlign: "center" }}>
                  {stageData.audioPlay.isPlaying && (
                    <p
                      style={{
                        fontSize: "24px",
                        color: "#10B981",
                        fontWeight: "700",
                        margin: "4px 0",
                      }}
                    >
                      Playing...
                    </p>
                  )}

                  {stageData.audioPlay.playError && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#EF4444",
                        margin: "8px 0",
                      }}
                    >
                      {stageData.audioPlay.playError}
                    </p>
                  )}

                  {stageData.audioPlay.hasPlayed &&
                    !stageData.audioPlay.playError &&
                    !stageData.audioPlay.isPlaying && (
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#10B981",
                          fontWeight: "500",
                          margin: "8px 0",
                        }}
                      >
                        ✓ Question played successfully
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Thinking Stage */}
          {currentStage === "thinking" && (
            <div style={{ marginTop: "20px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "20px",
                }}
              >
                Thinking Time
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  marginBottom: "32px",
                }}
              >
                Take a moment to think about your response before recording
                begins.
              </p>

              {/* Countdown Display */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: "#EF4444",
                    marginBottom: "16px",
                  }}
                >
                  {stageData.thinking.thinkingTimeRemaining}
                </div>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  seconds remaining
                </p>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                {/* Background Bar */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#FEE2E2",
                    borderRadius: "4px",
                    position: "relative",
                  }}
                >
                  {/* Progress Bar - shrinks from both sides */}
                  <div
                    style={{
                      position: "absolute",
                      left: `${(1 - thinkingProgress) * 50}%`,
                      right: `${(1 - thinkingProgress) * 50}%`,
                      height: "100%",
                      backgroundColor: "#EF4444",
                      borderRadius: "4px",
                      transition: "none", // Remove transition for smooth animation
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  marginTop: "24px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  Recording will start automatically when the timer reaches zero. Begin speaking when you see a red dot.
                </p>
              </div>
            </div>
          )}

          {/* Recording Stage */}
          {currentStage === "recording" && (
            <div style={{ marginTop: "20px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "20px",
                }}
              >
                Recording Your Response
              </h1>

              {/* Recording Button */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {!stageData.recording.isRecording &&
                  !stageData.recording.hasRecorded && (
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#6B7280",
                          margin: "8px 0",
                        }}
                      >
                        Preparing to record...
                      </p>
                    </div>
                  )}

                {stageData.recording.isRecording && (
                  <PulseButton
                    onClick={() => {
                      stopRecording();
                      updateRecordingData({
                        isRecording: false,
                        hasRecorded: true,
                      });
                    }}
                    style={recordStyle}
                  />
                )}

                {stageData.recording.hasRecorded &&
                  !stageData.recording.isRecording && (
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#10B981",
                          fontWeight: "500",
                          margin: "8px 0",
                        }}
                      >
                        ✓ Recording completed successfully
                      </p>
                      {recognizedText && examLanguage && (
                        <div
                          style={{
                            backgroundColor: "#F0F9FF",
                            border: "1px solid #0EA5E9",
                            borderRadius: "12px",
                            padding: "16px",
                            marginTop: "16px",
                            maxWidth: "500px",
                            margin: "16px auto 0 auto",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#0F172A",
                              margin: "0 0 8px 0",
                            }}
                          >
                            Speech Recognition Results
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#374151",
                              lineHeight: "1.5",
                              margin: "0",
                              fontStyle: "italic",
                            }}
                          >
                            "{recognizedText}"
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6B7280",
                              margin: "8px 0 0 0",
                            }}
                          >
                            Detected in: {examLanguage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Uploading Stage */}
          {currentStage === "uploading" && (
            <div style={{ marginTop: "20px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "20px",
                }}
              >
                {stageData.uploading.waitingForTranscription
                  ? "Waiting for Transcription"
                  : stageData.uploading.uploadComplete
                  ? "Upload Complete"
                  : "Uploading Response"}
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6B7280",
                  marginBottom: "24px",
                }}
              >
                {stageData.uploading.waitingForTranscription
                  ? "Your response has been uploaded successfully. We're now waiting for the transcription to be processed..."
                  : stageData.uploading.uploadComplete
                  ? "Your response has been uploaded and transcribed successfully."
                  : "Please wait while we upload your recording..."}
              </p>

              {/* Transcription Results */}
              {stageData.uploading.uploadComplete &&
                stageData.uploading.transcriptionText && (
                  <div
                    style={{
                      backgroundColor: "#F0F9FF",
                      border: "1px solid #0EA5E9",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "24px",
                      maxWidth: "500px",
                      margin: "0 auto 24px auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#10B981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#0F172A",
                          margin: "0",
                        }}
                      >
                        Tentative Transcription
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#374151",
                        lineHeight: "1.5",
                        margin: "0 0 16px 0",
                        fontStyle: "italic",
                      }}
                    >
                      "{stageData.uploading.transcriptionText}"
                    </p>

                    {/* Relisten Button and Disclaimer */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          fontStyle: "italic",
                        }}
                      >
                        This is an AI-generated transcription and may not be
                        100% accurate
                      </span>
                    </div>
                  </div>
                )}

              {/* Upload Animation with Custom Images */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                {/* Fixed Content Container - This won't move */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: "160px", // Reserve space for content + button
                  }}
                >
                  {/* Image Container */}
                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stageData.uploading.uploadComplete ||
                    stageData.uploading.waitingForTranscription ? (
                      <img
                        src="/upload-done.png"
                        alt="Upload complete"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <img
                        src="/upload-load.gif"
                        alt="Uploading response"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </div>

                  {/* Error Message */}
                  {stageData.uploading.uploadError && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#EF4444",
                        margin: "8px 0 0 0",
                        textAlign: "center",
                      }}
                    >
                      {stageData.uploading.uploadError}
                    </p>
                  )}

                  {/* Success Message */}
                  {stageData.uploading.uploadComplete &&
                    !stageData.uploading.uploadError && (
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#10B981",
                          fontWeight: "500",
                          margin: "8px 0 0 0",
                          textAlign: "center",
                        }}
                      >
                        ✓ Upload and transcription completed
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
