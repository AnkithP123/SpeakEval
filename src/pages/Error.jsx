"use client";

import { Component } from "react";
import {
  FaExclamationTriangle,
  FaHome,
  FaRedo,
  FaEnvelope,
} from "react-icons/fa";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleContact = () => {
    window.location.href = `mailto:info@speakeval.org?subject=Error Report&body=I encountered an error on SpeakEval. Please help! Error details: ${
      this.state.error?.toString() || "No error details available."
    }`;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI that matches the theme
      return (
        <div style={styles.container}>
          <div style={styles.header}>
            <FaExclamationTriangle
              size={100}
              color="#E74C3C"
              style={styles.icon}
            />

            <h1 style={styles.title}>Oops! Something Went Wrong</h1>
            <h2 style={styles.message}>Unexpected Error</h2>
          </div>

          <p style={styles.subtext}>
            We're really sorry about this! Something unexpected happened and
            we're not quite sure what. Our team has been notified and we're
            working on it.
          </p>

          <div style={styles.optionsContainer}>
            <button
              style={styles.button}
              onClick={this.handleRefresh}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor =
                  styles.buttonHover.backgroundColor)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = styles.button.backgroundColor)
              }
            >
              <FaRedo style={styles.buttonIcon} /> Try Again
            </button>

            <button
              style={styles.button}
              onClick={this.handleGoHome}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor =
                  styles.buttonHover.backgroundColor)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = styles.button.backgroundColor)
              }
            >
              <FaHome style={styles.buttonIcon} /> Go Home
            </button>

            <button
              style={styles.button}
              onClick={this.handleContact}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor =
                  styles.buttonHover.backgroundColor)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = styles.button.backgroundColor)
              }
            >
              <FaEnvelope style={styles.buttonIcon} /> Contact Support
            </button>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              If this keeps happening, please reach out to us at{" "}
              <a href="mailto:info@speakeval.org" style={styles.link}>
                info@speakeval.org
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#EBF3FD",
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
    marginBottom: "10px",
  },
  title: {
    fontSize: "2.5rem",
    color: "#333",
    marginBottom: "10px",
  },
  message: {
    fontSize: "1.5rem",
    color: "#555",
    marginBottom: "20px",
  },
  subtext: {
    fontSize: "1rem",
    color: "#777",
    marginBottom: "30px",
    maxWidth: "600px",
    lineHeight: "1.5",
  },
  optionsContainer: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "30px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 20px",
    fontSize: "1rem",
    color: "#FFF",
    backgroundColor: "#3498DB",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    minWidth: "140px",
  },
  buttonIcon: {
    marginRight: "8px",
  },
  buttonHover: {
    backgroundColor: "#2980B9",
  },
  footer: {
    marginTop: "20px",
  },
  footerText: {
    fontSize: "0.9rem",
    color: "#666",
  },
  link: {
    color: "#3498DB",
    textDecoration: "none",
  },
};

export default ErrorBoundary;
