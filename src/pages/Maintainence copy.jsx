"use client";
import { FaTools, FaCompass, FaClock } from "react-icons/fa";
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
          <h2 style={styles.message}>We'll be back soon!</h2>
        </div>
        <p style={styles.subtext}>
          We're currently performing scheduled maintenance to improve your experience. Thank you for your patience while we make things better!
        </p>
        <div style={styles.statusContainer}>
          <div style={styles.statusItem}>
            <FaClock style={styles.statusIcon} />
            <span>Estimated downtime: Unknown</span>
          </div>
        </div>
        <div style={styles.optionsContainer}>
          <button style={styles.button} onClick={() => navigate("/")}>
            <FaCompass style={styles.buttonIcon} /> Try Homepage
          </button>
          <button style={styles.buttonAlt} onClick={() => window.location.reload()}>
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
    background: "linear-gradient(120deg, #0ea5e9 0%, #8b5cf6 50%, #38bdf8 100%)",
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
  statusContainer: {
    background: "rgba(59,130,246,0.10)",
    padding: "1rem",
    borderRadius: "0.75rem",
    boxShadow: "0 2px 10px rgba(59,130,246,0.05)",
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "center",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "1rem",
    color: "#a5b4fc",
    fontWeight: 500,
  },
  statusIcon: {
    marginRight: "0.5rem",
    color: "#38bdf8",
    fontSize: "1.2rem",
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

// Add CSS animation for the pulsing icon and gradient background
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
`;
document.head.appendChild(styleSheet);

export default MaintenancePage;
