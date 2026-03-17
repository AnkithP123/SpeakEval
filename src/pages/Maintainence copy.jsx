"use client";
import { FaTools, FaCompass, FaClock, FaHeartbeat } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const MaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.gradientBg} />
      <div style={styles.content}>
        <div style={styles.header}>
          <FaTools size={100} color="#8b5cf6" style={styles.icon} />
          <h1 style={styles.title}>Under Maintenance</h1>
          <h2 style={styles.message}>We're working to restore service!</h2>
        </div>
        <p style={styles.subtext}>
          Service Paused due to Github being down, should be back shortly. Thank you for your patience.
        </p>
        <div style={styles.statusSection}>
          <div style={styles.statusLabel}>Current Status</div>
          <div style={styles.statusHighlight}>
            <FaHeartbeat style={styles.statusHighlightIcon} />
            <span>
              Waiting...
              <span style={styles.ellipsis}>...</span>
            </span>
          </div>
          <div style={styles.statusProgressBar}>
            <div style={styles.statusProgressFill} />
          </div>
        </div>
        <div style={styles.downtimeSection}>
          <FaClock style={styles.downtimeIcon} />
          <span style={styles.downtimeText}>
            Estimated downtime:{" "}
            <span style={styles.downtimeUnknown}>1h</span>
          </span>
        </div>
        <div style={styles.optionsContainer}>
          <button style={styles.button} onClick={() => navigate("/")}>
            <FaCompass style={styles.buttonIcon} /> Try Homepage
          </button>
          <button
            style={styles.buttonAlt}
            onClick={() => window.location.reload()}
          >
            <FaTools style={styles.buttonIcon} /> Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    minHeight: "100vh",
    width: "100vw",
    overflow: "hidden",
    fontFamily: "'Montserrat', 'Roboto', sans-serif",
    background: "hsl(222, 47%, 11%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBg: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "linear-gradient(120deg, #0ea5e9 0%, #8b5cf6 50%, #38bdf8 100%)",
    opacity: 0.18,
    animation: "gradient-x 15s ease infinite",
    backgroundSize: "200% 200%",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.04)",
    borderRadius: "1.5rem",
    boxShadow: "0 4px 32px 0 rgba(30,58,138,0.10)",
    padding: "2.5rem 2rem",
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(59,130,246,0.10)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  icon: {
    marginBottom: "1.5rem",
    animation: "pulse 2s infinite",
    filter: "drop-shadow(0 2px 12px #8b5cf6aa)",
  },
  title: {
    fontSize: "2.3rem",
    color: "#fff",
    marginBottom: "0.5rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  message: {
    fontSize: "1.3rem",
    color: "#c7d2fe",
    marginBottom: "1.5rem",
    fontWeight: 500,
  },
  subtext: {
    fontSize: "1.08rem",
    color: "#a5b4fc",
    marginBottom: "2rem",
    maxWidth: "600px",
    lineHeight: "1.6",
  },
  statusSection: {
    background: "rgba(59,130,246,0.13)",
    padding: "1.2rem 1rem 1.5rem 1rem",
    borderRadius: "1rem",
    boxShadow: "0 2px 12px rgba(59,130,246,0.07)",
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  statusLabel: {
    color: "#38bdf8",
    fontWeight: 700,
    fontSize: "1.05rem",
    letterSpacing: "0.04em",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },
  statusHighlight: {
    display: "flex",
    alignItems: "center",
    fontSize: "1.18rem",
    color: "#fff",
    fontWeight: 600,
    marginBottom: "0.7rem",
    letterSpacing: "0.01em",
  },
  statusHighlightIcon: {
    marginRight: "0.6rem",
    color: "#38bdf8",
    fontSize: "1.5rem",
    animation: "pulse 1.5s infinite",
  },
  ellipsis: {
    color: "#8b5cf6",
    fontWeight: 700,
    marginLeft: "0.2em",
    fontSize: "1.2em",
    letterSpacing: "0.1em",
    animation: "blink 1.2s infinite steps(1, end)",
  },
  statusProgressBar: {
    width: "80%",
    height: "8px",
    background: "rgba(59,130,246,0.18)",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "0.2rem",
  },
  statusProgressFill: {
    width: "65%",
    height: "100%",
    background: "linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)",
    borderRadius: "4px",
    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
    boxShadow: "0 1px 6px 0 #8b5cf655",
  },
  downtimeSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(139,92,246,0.10)",
    padding: "0.8rem 1rem",
    borderRadius: "0.75rem",
    marginBottom: "2rem",
    gap: "0.7rem",
    boxShadow: "0 2px 8px rgba(139,92,246,0.06)",
  },
  downtimeIcon: {
    color: "#8b5cf6",
    fontSize: "1.3rem",
  },
  downtimeText: {
    color: "#c7d2fe",
    fontWeight: 500,
    fontSize: "1.05rem",
  },
  downtimeUnknown: {
    color: "#fff",
    fontWeight: 700,
    fontStyle: "italic",
    marginLeft: "0.2em",
  },
  optionsContainer: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    color: "#fff",
    background: "linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "0.75rem",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 2px 8px 0 rgba(14,165,233,0.10)",
    transition: "background 0.2s, box-shadow 0.2s",
  },
  buttonAlt: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    color: "#fff",
    background: "linear-gradient(90deg, #8b5cf6 0%, #0ea5e9 100%)",
    border: "none",
    borderRadius: "0.75rem",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 2px 8px 0 rgba(139,92,246,0.10)",
    transition: "background 0.2s, box-shadow 0.2s",
  },
  buttonIcon: {
    marginRight: "0.5rem",
    fontSize: "1.1em",
  },
};

// Add CSS animation for the pulsing icon, gradient background, and ellipsis blink
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;
document.head.appendChild(styleSheet);

export default MaintenancePage;
