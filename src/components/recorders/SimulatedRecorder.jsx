"use client";

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
  onStartClick,
}) {
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
              onClick={onStartClick}
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
                Prompt {currentPromptIndex + 1} of {promptClips.length}
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
              Prompt {currentPromptIndex + 1} of {promptClips.length}
            </p>
            {recordingCountdown !== null && (
              <p
                style={{
                  fontSize: "24px",
                  color: COLORS.recording,
                  fontWeight: "700",
                  margin: "8px 0",
                }}
              >
                {recordingCountdown}s remaining
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
          {stageData.audioPlay.isPlaying &&
            !stageData.recording.isRecording && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: COLORS.textLight,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    transition: "background-color 0.3s",
                  }}
                >
                  <Mic size={32} color="white" />
                </div>
                <p
                  style={{
                    fontSize: "16px",
                    color: COLORS.textLight,
                    margin: "16px 0 8px 0",
                    fontWeight: "500",
                  }}
                >
                  Playing prompt...
                </p>
              </div>
            )}

          {!stageData.recording.isRecording &&
            !stageData.recording.hasRecorded &&
            !stageData.audioPlay.isPlaying && (
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "16px",
                    color: COLORS.textLight,
                    margin: "8px 0",
                  }}
                >
                  Loading next prompt...
                </p>
              </div>
            )}

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
