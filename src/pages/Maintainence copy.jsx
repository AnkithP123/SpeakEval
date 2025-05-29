"use client";
import { FaTools, FaCompass, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const MaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FaTools size={100} color="#F39C12" style={styles.icon} />

        <h1 style={styles.title}>Under Maintenance</h1>
        <h2 style={styles.message}>We'll be back soon!</h2>
      </div>

      <p style={styles.subtext}>
        We're currently performing scheduled maintenance to improve your
        experience. Thank you for your patience while we make things better!
      </p>

      <div style={styles.statusContainer}>
        <div style={styles.statusItem}>
          <FaClock style={styles.statusIcon} />
          <span>Estimated downtime: 2-4 hours</span>
        </div>
      </div>

      <div style={styles.optionsContainer}>
        <button style={styles.button} onClick={() => navigate("/")}>
          <FaCompass style={styles.buttonIcon} /> Try Homepage
        </button>

        <button style={styles.button} onClick={() => window.location.reload()}>
          <FaTools style={styles.buttonIcon} /> Refresh Page
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f8f9fa",
    textAlign: "center",
    padding: "20px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
  },
  icon: {
    marginBottom: "20px",
    animation: "pulse 2s infinite",
  },
  title: {
    fontSize: "2.5rem",
    color: "#333",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  message: {
    fontSize: "1.5rem",
    color: "#555",
    marginBottom: "20px",
  },
  subtext: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "30px",
    maxWidth: "600px",
    lineHeight: "1.6",
  },
  statusContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "30px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    color: "#555",
  },
  statusIcon: {
    marginRight: "10px",
    color: "#F39C12",
  },
  optionsContainer: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    fontSize: "1rem",
    color: "#FFF",
    backgroundColor: "#F39C12",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
  },
  buttonIcon: {
    marginRight: "8px",
  },
};

// Add CSS animation for the pulsing icon
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);

export default MaintenancePage;
