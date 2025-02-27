"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { toast } from "react-toastify"
import "./auth.css"

function VerifyPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [shake, setShake] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const emailFromParams = params.get("email")

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams)
    }
  }, [emailFromParams])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!email || !code) {
      toast.error("Please enter both email and verification code.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (res.status !== 200) {
        throw new Error(data.error || "Failed to verify code.")
      }
      toast.success(data.message || "Verification successful!")
      navigate("/login")
    } catch (error) {
      console.error("Verification error:", error)
      toast.error(error.message || "Error verifying code.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address.")
      return
    }
    setIsResending(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.status !== 200) {
        throw new Error(data.error || "Failed to resend code.")
      }
      toast.success(data.message || "Verification code resent successfully.")
    } catch (error) {
      console.error("Resend error:", error)
      toast.error(error.message || "Error resending verification code.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">Verify Your Account</h2>
        <form className="auth-form" onSubmit={handleVerify}>
          {!emailFromParams && (
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <input
            type="text"
            className="auth-input"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner"></span> : "Verify"}
          </button>
        </form>
        <button onClick={handleResend} className="auth-button mt-4" disabled={isResending}>
          {isResending ? <span className="spinner"></span> : "Resend Code"}
        </button>
        <p className="mt-4 text-center">
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyPage

