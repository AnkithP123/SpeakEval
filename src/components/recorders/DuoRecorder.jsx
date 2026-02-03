"use client";

// DuoRecorder - placeholder for 2-person conversation mode
// Unimplemented for now

// Duo mode colors - orange theme
const COLORS = {
  primary: "#F97316", // orange-500
  primaryHover: "#EA580C", // orange-600
  success: "#10B981", // green-500
  successHover: "#059669", // green-600
  recording: "#dc2626", // red-600
  text: "#374151", // gray-700
  textLight: "#6B7280", // gray-500
};

export default function DuoRecorder({ currentStage, stageData }) {
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
        2-Person Conversation
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: COLORS.textLight,
          marginBottom: "24px",
        }}
      >
        This mode is not yet implemented.
      </p>
    </div>
  );
}
