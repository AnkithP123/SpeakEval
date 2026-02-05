"use client";

import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import styled, { css, keyframes } from "styled-components";

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const animation = (props) => css`
  ${pulse} 1.1s infinite;
`;

const PulseButton = styled.button`
  animation: ${animation};
`;

// Simulated Conversation colors - purple theme
const COLORS = {
  primary: "#8B5CF6", // purple-500
  primaryHover: "#7C3AED", // purple-600
  success: "#10B981", // green-500
  successHover: "#059669", // green-600
  recording: "#dc2626", // red-600
  text: "#374151", // gray-700
  textLight: "#6B7280", // gray-500
};

export default function SimulatedRecorder({
  currentStage,
  stageData,
  audioPlayer,
  promptClips,
  currentPromptIndex,
  recordingCountdown,
  mediaRecorder,
  microphoneStream,
  onStartClick,
  // Callbacks from AudioRecorder
  advanceStage,
  updateRecordingData,
  updateAudioPlayData,
  updateUploadingData,
  setCurrentPromptIndex,
  setRecordingCountdown,
  setAudioBlobURL,
  playRecordingStarted,
  audioPlaybackStarted,
  audioPlaybackCompleted,
  uploadStarted,
  uploadCompleted,
  updateStudentStatus,
  questionCompleted,
  questionIndex,
  recognizedText,
  examLanguage,
  setUploadProgress,
}) {
  // Internal state for this recorder
  const [localPromptIndex, setLocalPromptIndex] = useState(0);
  const [localCountdown, setLocalCountdown] = useState(20);
  const [collectedRecordings, setCollectedRecordings] = useState([]);
  const currentPromptChunksRef = useRef([]);
  const promptTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // Initialize from props
  useEffect(() => {
    if (currentPromptIndex !== undefined) {
      setLocalPromptIndex(currentPromptIndex);
    }
  }, [currentPromptIndex]);

  useEffect(() => {
    if (recordingCountdown !== undefined && recordingCountdown !== null) {
      setLocalCountdown(recordingCountdown);
    }
  }, [recordingCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Start recording by resuming MediaRecorder or enabling chunk saving
  const startRecording = async () => {
    if (!mediaRecorder) {
      console.error("❌ No MediaRecorder available");
      return;
    }

    console.log(`🎙️ Starting recording. MediaRecorder state: ${mediaRecorder.state}`);

    // Clear chunks for this prompt
    currentPromptChunksRef.current = [];

    // Set up data handler if not already set
    if (!mediaRecorder._simulatedHandlerSet) {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentPromptChunksRef.current.push(event.data);
          console.log(`📦 Chunk collected: size=${event.data.size}, total chunks: ${currentPromptChunksRef.current.length}`);
        }
      };
      mediaRecorder._simulatedHandlerSet = true;
    }

    // Check if pause/resume is supported
    const pauseSupported = mediaRecorder._pauseSupported !== false && typeof mediaRecorder.pause === 'function' && typeof mediaRecorder.resume === 'function';

    if (pauseSupported) {
      // Use pause/resume approach
      try {
        if (mediaRecorder.state === "paused") {
          mediaRecorder.resume();
          console.log("✅ MediaRecorder resumed");
        } else if (mediaRecorder.state === "inactive") {
          mediaRecorder.start(250);
          console.log("✅ MediaRecorder started");
        } else if (mediaRecorder.state === "recording") {
          console.log("✅ MediaRecorder already recording");
        }
      } catch (error) {
        console.error("❌ Failed to resume/start MediaRecorder:", error);
        throw error;
      }
    } else {
      // Use flag-based approach (pause not supported)
      console.log("⚠️ Pause not supported, using flag-based approach");
      mediaRecorder._isSavingChunks = true;
      // Ensure MediaRecorder is running
      if (mediaRecorder.state === "inactive") {
        try {
          mediaRecorder.start(250);
          console.log("✅ MediaRecorder started");
        } catch (error) {
          console.error("❌ Failed to start MediaRecorder:", error);
          throw error;
        }
      }
    }

    // Set recording start time
    recordingStartTimeRef.current = Date.now();
    setLocalCountdown(20);

    // Update countdown
    const updateCountdown = () => {
      if (recordingStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        const remaining = Math.max(0, 20 - elapsed);
        setLocalCountdown(remaining);
        if (setRecordingCountdown) setRecordingCountdown(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 100);

    // Set 20-second timer
    promptTimerRef.current = setTimeout(async () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      await stopRecordingForNextPrompt(localPromptIndex);
    }, 20000);
  };

  // Stop recording by pausing MediaRecorder or disabling chunk saving
  const stopRecordingForNextPrompt = async (currentIndex) => {
    console.log(`🛑 stopRecordingForNextPrompt called for prompt ${currentIndex + 1}`);

    // Stop audio player
    if (audioPlayer) {
      try {
        audioPlayer.stop();
      } catch (e) {
        console.warn("Error stopping audio player:", e);
      }
    }

    // Check if pause/resume is supported
    const pauseSupported = mediaRecorder?._pauseSupported !== false && typeof mediaRecorder?.pause === 'function';

    if (pauseSupported && mediaRecorder && mediaRecorder.state === "recording") {
      // Use pause/resume approach
      try {
        mediaRecorder.pause();
        console.log("⏸️ MediaRecorder paused");
        
        // Request final data
        try {
          mediaRecorder.requestData();
          console.log("📥 Requested final data from MediaRecorder");
        } catch (e) {
          console.warn("Could not request final data:", e);
        }
      } catch (e) {
        console.warn("Could not pause MediaRecorder:", e);
      }
    } else if (mediaRecorder) {
      // Use flag-based approach
      console.log("⚠️ Pause not supported, disabling chunk saving");
      mediaRecorder._isSavingChunks = false;
      
      // Request final data
      if (mediaRecorder.state === "recording") {
        try {
          mediaRecorder.requestData();
          console.log("📥 Requested final data from MediaRecorder");
        } catch (e) {
          console.warn("Could not request final data:", e);
        }
      }
    }

    // Wait for chunks to be collected
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch prompt audio
    let promptBlob = null;
    try {
      const promptUrl = promptClips[currentIndex];
      const promptResponse = await fetch(promptUrl);
      promptBlob = await promptResponse.blob();
      console.log(`📥 Fetched prompt ${currentIndex + 1} audio, size: ${promptBlob.size} bytes`);
    } catch (error) {
      console.error(`❌ Failed to fetch prompt ${currentIndex + 1} audio:`, error);
    }

    // Create response blob from chunks
    let responseBlob = null;
    if (currentPromptChunksRef.current.length > 0) {
      const mimeType = mediaRecorder?.mimeType || "video/mp4";
      responseBlob = new Blob(currentPromptChunksRef.current, { type: mimeType });
      console.log(`💾 Saved response ${currentIndex + 1}, chunks: ${currentPromptChunksRef.current.length}, size: ${responseBlob.size} bytes`);
    } else {
      console.warn(`⚠️ No chunks collected for prompt ${currentIndex + 1}`);
    }

    // Store recording
    setCollectedRecordings((prev) => {
      const newRecordings = [
        ...prev,
        {
          promptBlob: promptBlob,
          responseBlob: responseBlob,
          promptIndex: currentIndex,
        },
      ];
      console.log(`📦 Total collected recordings: ${newRecordings.length}`);
      return newRecordings;
    });

    // Clear chunks for next recording
    currentPromptChunksRef.current = [];

    // Update state
    updateRecordingData({
      isRecording: false,
      hasRecorded: false,
      recordingError: null,
    });

    // Clear timers
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Move to next prompt
    await playNextPrompt(currentIndex + 1);
  };

  // Play next prompt
  const playNextPrompt = async (index) => {
    console.log(`🎵 playNextPrompt called with index: ${index}, total prompts: ${promptClips.length}`);

    if (index >= promptClips.length) {
      // All prompts complete, upload
      console.log(`✅ All prompts complete. Collected ${collectedRecordings.length} recordings. Starting upload...`);
      await uploadAllRecordings();
      return;
    }

    // Clear timers
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Stop audio
    if (audioPlayer) {
      try {
        audioPlayer.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn("Error stopping audio player:", e);
      }
    }

    // Load and play prompt
    const promptUrl = promptClips[index];
    console.log(`📻 Loading prompt ${index + 1}: ${promptUrl}`);

    setLocalPromptIndex(index);
    setLocalCountdown(20);
    recordingStartTimeRef.current = null;

    if (setCurrentPromptIndex) setCurrentPromptIndex(index);
    if (setRecordingCountdown) setRecordingCountdown(20);
    if (setAudioBlobURL) setAudioBlobURL(promptUrl);

    advanceStage("audio_play");
    updateAudioPlayData({
      isPlaying: false,
      hasPlayed: false,
      playError: null,
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      if (!audioPlayer) {
        console.error("❌ Audio player not available");
        updateAudioPlayData({
          isPlaying: false,
          playError: "Audio player not available",
        });
        return;
      }

      console.log(`🎵 Loading audio for prompt ${index + 1}...`);
      audioPlayer.load(promptUrl, {
        autoplay: true,
        initialVolume: 1.0,
        onplay: () => {
          console.log(`▶️ Prompt ${index + 1} started playing`);
          if (audioPlaybackStarted) audioPlaybackStarted();
          updateAudioPlayData({ isPlaying: true });
        },
        onend: async () => {
          console.log(`✅ Prompt ${index + 1} finished playing`);
          if (audioPlaybackCompleted) audioPlaybackCompleted();
          updateAudioPlayData({
            isPlaying: false,
            hasPlayed: true,
          });

          // Start recording
          console.log(`🎬 [Prompt ${index + 1}] Prompt finished, starting recording...`);
          if (playRecordingStarted) playRecordingStarted();

          try {
            recordingStartTimeRef.current = Date.now();
            setLocalCountdown(20);
            if (setRecordingCountdown) setRecordingCountdown(20);

            advanceStage("recording");
            await startRecording();

            updateRecordingData({
              isRecording: true,
              hasRecorded: false,
              recordingError: null,
            });
          } catch (error) {
            console.error(`❌ [Prompt ${index + 1}] Recording setup failed:`, error);
            // Continue anyway
            updateRecordingData({
              isRecording: true,
              hasRecorded: false,
              recordingError: null,
            });
          }
        },
        onerror: (error) => {
          console.error(`❌ Audio play error for prompt ${index + 1}:`, error);
          updateAudioPlayData({
            isPlaying: false,
            playError: "Failed to load audio",
          });
        },
      });
    } catch (loadError) {
      console.error(`❌ Failed to load prompt ${index + 1}:`, loadError);
      updateAudioPlayData({
        isPlaying: false,
        playError: "Failed to load audio",
      });
    }
  };

  // Upload all recordings
  const uploadAllRecordings = async () => {
    console.log(`📤 uploadAllRecordings called with ${collectedRecordings.length} recordings`);

    if (collectedRecordings.length === 0) {
      console.error("❌ No recordings collected!");
      advanceStage("uploading");
      updateUploadingData({
        isUploading: false,
        uploadComplete: false,
        uploadError: "No recordings were collected. Please try again.",
      });
      return;
    }

    advanceStage("uploading");
    updateUploadingData({
      isUploading: true,
      uploadProgress: 0,
      uploadComplete: false,
      uploadError: null,
    });

    if (uploadStarted) uploadStarted();
    if (updateStudentStatus) updateStudentStatus("uploading");

    // Get token from localStorage
    const token = localStorage.getItem("studentToken");
    if (!token) {
      console.error("No token available");
      return;
    }

    try {
      // Combine all segments
      console.log("🔗 Stitching all segments together...");
      if (setUploadProgress) {
        setUploadProgress(10);
      }

      const allBlobs = [];
      for (const segment of collectedRecordings) {
        if (segment.promptBlob) allBlobs.push(segment.promptBlob);
        if (segment.responseBlob) allBlobs.push(segment.responseBlob);
      }

      if (allBlobs.length === 0) {
        throw new Error("No segments to combine");
      }

      const combinedBlob = new Blob(allBlobs, { type: "video/mp4" });
      console.log(`✅ Combined ${allBlobs.length} segments, size: ${combinedBlob.size} bytes`);

      if (setUploadProgress) {
        setUploadProgress(30);
      }

      // Get upload URL
      const uploadUrlResponse = await fetch(
        `https://www.server.speakeval.org/get-recording-upload-url?token=${token}&index=0`,
        { method: "GET" }
      );

      if (!uploadUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl } = await uploadUrlResponse.json();

      if (setUploadProgress) {
        setUploadProgress(50);
      }

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: combinedBlob,
        headers: { "Content-Type": "video/mp4" },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3");
      }

      if (setUploadProgress) {
        setUploadProgress(80);
      }

      // Notify server
      const uploadData = {
        uploaded: true,
        speechRecognitionText: recognizedText || null,
        recognitionLanguage: examLanguage,
      };

      const serverResponse = await fetch(
        `https://www.server.speakeval.org/upload?token=${token}&index=0`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadData),
        }
      );

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        throw new Error(`Server upload notification failed: ${errorText}`);
      }

      const data = await serverResponse.json();

      if (setUploadProgress) {
        setUploadProgress(100);
      }

      updateUploadingData({
        isUploading: false,
        uploadComplete: true,
        uploadError: null,
        transcriptionText: data.transcription,
        waitingForTranscription: false,
      });

      if (uploadCompleted) uploadCompleted();
      if (updateStudentStatus) updateStudentStatus("upload_completed");
      if (questionCompleted) questionCompleted(questionIndex);
    } catch (error) {
      console.error("Error uploading recordings:", error);
      updateUploadingData({
        isUploading: false,
        uploadComplete: false,
        uploadError: "Failed to upload recordings. Please try again.",
      });
    }
  };

  // Handle start click
  const handleStartClick = () => {
    // Always start playing prompts - SimulatedRecorder handles everything
    console.log("🎬 handleStartClick called - starting prompt playback");
    playNextPrompt(0);
  };

  // Use local state for display
  const displayPromptIndex = localPromptIndex;
  const displayCountdown = localCountdown;

  if (currentStage === "audio_play") {
    return (
      <div style={{ marginTop: "20px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: COLORS.text,
            marginBottom: "20px",
          }}
        >
          Conversation Prompts
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: COLORS.textLight,
            marginBottom: "24px",
          }}
        >
          Click the microphone to start. Prompts will play sequentially, then recording will begin automatically.
        </p>

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <PulseButton
              onClick={handleStartClick}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor:
                  stageData.recording.isRecording || currentStage === "recording"
                    ? COLORS.recording
                    : stageData.audioPlay.isPlaying
                    ? COLORS.textLight
                    : COLORS.textLight,
                border: "none",
                cursor:
                  stageData.recording.isRecording || currentStage === "recording"
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.3s",
                animation:
                  stageData.recording.isRecording || currentStage === "recording"
                    ? `${animation}`
                    : "none",
              }}
            >
              <Mic size={32} color="white" />
            </PulseButton>
          </div>

          <div style={{ textAlign: "center" }}>
            {promptClips.length > 0 && (
              <p
                style={{
                  fontSize: "16px",
                  color: COLORS.textLight,
                  margin: "8px 0",
                }}
              >
                Prompt {displayPromptIndex + 1} of {promptClips.length}
              </p>
            )}

            {(audioPlayer?.isPlaying || stageData.audioPlay.isPlaying) && (
              <p
                style={{
                  fontSize: "24px",
                  color: COLORS.success,
                  fontWeight: "700",
                  margin: "4px 0",
                }}
              >
                Playing prompt...
              </p>
            )}

            {stageData.recording.isRecording && (
              <p
                style={{
                  fontSize: "20px",
                  color: COLORS.recording,
                  fontWeight: "700",
                  margin: "8px 0",
                }}
              >
                Recording...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentStage === "recording") {
    return (
      <div style={{ marginTop: "20px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: COLORS.text,
            marginBottom: "20px",
          }}
        >
          Recording Your Response
        </h1>

        {promptClips.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "18px",
                color: COLORS.textLight,
                fontWeight: "500",
                margin: "8px 0",
              }}
            >
              Prompt {displayPromptIndex + 1} of {promptClips.length}
            </p>
            {displayCountdown !== null && (
              <p
                style={{
                  fontSize: "24px",
                  color: COLORS.recording,
                  fontWeight: "700",
                  margin: "8px 0",
                }}
              >
                {displayCountdown}s remaining
              </p>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {stageData.recording.isRecording && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: COLORS.recording,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  animation: `${animation}`,
                  transition: "background-color 0.3s",
                }}
              >
                <Mic size={32} color="white" />
              </div>
              <p
                style={{
                  fontSize: "20px",
                  color: COLORS.recording,
                  fontWeight: "700",
                  margin: "16px 0 8px 0",
                }}
              >
                Recording...
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: COLORS.textLight,
                  margin: "8px 0",
                }}
              >
                Recording will stop automatically after 20 seconds
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentStage === "uploading") {
    return (
      <div style={{ marginTop: "20px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: COLORS.text,
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
            color: COLORS.textLight,
            marginBottom: "24px",
          }}
        >
          {stageData.uploading.waitingForTranscription
            ? "Your response has been uploaded successfully. We're now waiting for the transcription to be processed..."
            : stageData.uploading.uploadComplete
            ? "Your response has been uploaded and transcribed successfully."
            : "Please wait while we upload your recording..."}
        </p>

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
                    backgroundColor: COLORS.success,
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
              <span
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  fontStyle: "italic",
                }}
              >
                This is an AI-generated transcription and may not be 100% accurate
              </span>
            </div>
          )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
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

          {stageData.uploading.uploadComplete &&
            !stageData.uploading.uploadError && (
              <p
                style={{
                  fontSize: "16px",
                  color: COLORS.success,
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
    );
  }

  return null;
}
