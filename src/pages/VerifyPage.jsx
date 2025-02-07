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

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams)
    }
  }, [emailFromParams])

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
  }

  const handleResendCode = async () => {
    if (!email) {
      return toast.error("Please enter your email first.")
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/resend-code", {
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
      console.error("Error resending code:", error)
      toast.error("Error resending verification code.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        toast.error(data.error || "Failed to resend code.")
      }
    } catch (error) {
      console.error("Verification error:", error)
      toast.error("Error verifying code.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily: "Montserrat, sans-serif",
    padding: "20px",
  }

  const cardStyle = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  }

  const headingStyle = {
    marginBottom: "1.5rem",
    color: "black",
    fontSize: "1.5rem",
    fontWeight: "bold",
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "1rem",
    fontFamily: "inherit",
  }

  const buttonStyle = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "black",
    color: "white",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    fontFamily: "inherit",
    transition: "background-color 0.2s",
  }

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#718096",
    cursor: "not-allowed",
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Verify Your Account</h2>
        {!emailFromParams && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              style={inputStyle}
            />
            
          </>
        )}
        <input
          type="text"
          placeholder="Enter verification code"
          value={code}
          onChange={handleCodeChange}
          style={inputStyle}
        />
        <button onClick={handleVerify} style={isSubmitting ? disabledButtonStyle : buttonStyle} disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  )
}

export default VerifyPage

