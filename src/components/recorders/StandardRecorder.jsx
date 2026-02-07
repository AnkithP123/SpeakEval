"use client";

import { Play, Mic } from "lucide-react";
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

// Standard mode colors - blue theme
const COLORS = {
  primary: "#3B82F6", // blue-500
  primaryHover: "#2563EB", // blue-600
  success: "#10B981", // green-500
  successHover: "#059669", // green-600
  recording: "#dc2626", // red-600
  text: "#374151", // gray-700
  textLight: "#6B7280", // gray-500
};

export default function StandardRecorder({
  currentStage,
  stageData,
  audioPlayer,
  audioBlobURL,
  thinkingTime,
  allowRepeat,
  recognizedText,
  examLanguage,
  audioURL,
  onPlayClick,
  onReplayClick,
  onStopRecording,
  formatTime,
  thinkingProgress,
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
          Listen to Question
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: COLORS.textLight,
            marginBottom: "24px",
          }}
        >
          Please listen to the question carefully before recording your response.
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
              onClick={onPlayClick}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: COLORS.success,
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

            {stageData.audioPlay.hasPlayed && allowRepeat && (
              <button
                onClick={onReplayClick}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: COLORS.primary,
                  backgroundColor: "transparent",
                  border: `2px solid ${COLORS.primary}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = COLORS.primary;
                  e.target.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = COLORS.primary;
                }}
              >
                Replay
              </button>
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            {(audioPlayer?.isPlaying || stageData.audioPlay.isPlaying) && (
              <p
                style={{
                  fontSize: "24px",
                  color: COLORS.success,
                  fontWeight: "700",
                  margin: "4px 0",
                }}
              >
                Playing...
              </p>
            )}

            {audioPlayer?.isLoading && (
              <p
                style={{
                  fontSize: "16px",
                  color: COLORS.textLight,
                  margin: "8px 0",
                }}
              >
                Loading audio...
              </p>
            )}

            {(audioPlayer?.error || stageData.audioPlay.playError) && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#EF4444",
                  margin: "8px 0",
                }}
              >
                {audioPlayer?.error || stageData.audioPlay.playError}
              </p>
            )}

            {stageData.audioPlay.hasPlayed &&
              !stageData.audioPlay.playError &&
              !audioPlayer?.error &&
              !(audioPlayer?.isPlaying || stageData.audioPlay.isPlaying) && (
                <p
                  style={{
                    fontSize: "16px",
                    color: COLORS.success,
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
    );
  }

  if (currentStage === "thinking") {
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
          Thinking Time
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: COLORS.textLight,
            marginBottom: "32px",
          }}
        >
          Take a moment to think about your response before recording begins.
        </p>

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
              color: COLORS.textLight,
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
                left: `${(1 - (stageData.thinking.thinkingTimeRemaining / thinkingTime)) * 50}%`,
                right: `${(1 - (stageData.thinking.thinkingTimeRemaining / thinkingTime)) * 50}%`,
                height: "100%",
                backgroundColor: "#EF4444",
                borderRadius: "4px",
                transition: "none",
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
              color: COLORS.textLight,
              margin: "0",
            }}
          >
            Recording will start automatically when the timer reaches zero. Begin speaking when you see a red dot.
          </p>
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {stageData.recording.isRecording && (
            <button
              onClick={onStopRecording}
              style={{
                width: "120px",
                height: "48px",
                backgroundColor: COLORS.recording,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                transition: "background 0.2s",
              }}
            >
              Stop
            </button>
          )}

          {stageData.recording.hasRecorded &&
            !stageData.recording.isRecording && (
              <div style={{ textAlign: "center", width: "100%" }}>
                <p
                  style={{
                    fontSize: "16px",
                    color: COLORS.success,
                    fontWeight: "500",
                    margin: "8px 0 16px 0",
                  }}
                >
                  ✓ Recording completed successfully
                </p>

                {audioURL && (
                  <div
                    style={{
                      maxWidth: "640px",
                      margin: "0 auto 20px auto",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <video
                      src={audioURL}
                      controls
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

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
