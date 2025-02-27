"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "react-toastify"
import "./auth.css"

function RegisterPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email || !fullName || !username || !password) {
      toast.error("Please fill in all fields.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, username, password }),
      })

      const data = await res.json()

      if (res.status !== 200) {
        throw new Error(data.error || "Registration failed")
      }

      toast.success(data.message || "Registration successful!")
      navigate("/verify?email=" + encodeURIComponent(email))
    } catch (err) {
      console.error("Registration Error:", err)
      toast.error(err.message || "Failed to register. Please try again.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">Sign Up</h2>
        <form className="auth-form" onSubmit={handleRegister}>
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            className="auth-input"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="text"
            className="auth-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage

