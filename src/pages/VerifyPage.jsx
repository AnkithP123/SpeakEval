"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"

function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const emailFromParams = params.get("email")

  const [email, setEmail] = useState(emailFromParams || "")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams)
    }
  }, [emailFromParams])

  const handleVerify = async () => {
    if (!email || !code) {
      return toast.error("Please enter both email and verification code.")
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (data.message) {
        toast.success(data.message)
        navigate("/")
      } else {
        toast.error(data.error || "Failed to verify code.")
      }
    } catch (error) {
      console.error("Verification error:", error)
      toast.error("Error verifying code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      return toast.error("Please enter your email address.")
    }
    setIsResending(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.message) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Failed to resend code.")
      }
    } catch (error) {
      console.error("Resend error:", error)
      toast.error("Error resending verification code.")
    } finally {
      setIsResending(false)
    }
  }

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Roboto, sans-serif",
      padding: "20px"
    },
    card: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
      width: "100%",
      maxWidth: "500px",
      textAlign: "center",
    },
    header: {
      marginBottom: "1.5rem",
    },
    title: {
      fontSize: "1.75rem",
      fontWeight: "700",
      color: "#111827",
      marginBottom: "0.75rem",
    },
    description: {
      color: "#6b7280",
      fontSize: "0.975rem",
      lineHeight: "1.5",
      marginBottom: "1.5rem",
    },
    inputContainer: {
      marginBottom: "1rem",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      borderRadius: "0.5rem",
      border: "1px solid #e5e7eb",
      outline: "none",
      fontSize: "1rem",
      fontFamily: "inherit",
      transition: "border-color 0.2s",
      "&:focus": {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
      },
    },
    buttonContainer: {
      display: "flex",
      gap: "0.75rem",
      flexDirection: "column",
      "@media (min-width: 640px)": {
        flexDirection: "row",
      },
    },
    button: {
      flex: 1,
      padding: "0.75rem",
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
      fontSize: "0.975rem",
      fontWeight: "500",
      fontFamily: "inherit",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    primaryButton: {
      backgroundColor: "#111827",
      color: "white",
      "&:hover": {
        backgroundColor: "#1f2937",
      },
      "&:disabled": {
        backgroundColor: "#9ca3af",
        cursor: "not-allowed",
      },
    },
    secondaryButton: {
      backgroundColor: "white",
      color: "#111827",
      border: "1px solid #e5e7eb",
      "&:hover": {
        backgroundColor: "#f9fafb",
      },
      "&:disabled": {
        backgroundColor: "#f3f4f6",
        cursor: "not-allowed",
      },
    },
    spinner: {
      display: "inline-block",
      width: "1rem",
      height: "1rem",
      border: "2px solid currentColor",
      borderRightColor: "transparent",
      borderRadius: "50%",
      animation: "spin 0.75s linear infinite",
    },
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Verify Your Account</h2>
          <p style={styles.description}>
            Please enter your email address and the verification code sent to your email. If you can't see the content
            in the email, try opening it on a desktop or another app.
          </p>
        </div>

        {!emailFromParams && (
          <div style={styles.inputContainer}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              aria-label="Email Address"
            />
          </div>
        )}

        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.input}
            aria-label="Verification Code"
          />
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={handleVerify} disabled={isSubmitting} style={{ ...styles.button, ...styles.primaryButton }}>
            {isSubmitting && <span style={styles.spinner} />}
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
          <button onClick={handleResend} disabled={isResending} style={{ ...styles.button, ...styles.secondaryButton }}>
            {isResending && <span style={styles.spinner} />}
            {isResending ? "Resending..." : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyPage

