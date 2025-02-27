"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { toast } from "react-toastify"
import "./auth.css"

function LoginPage({ set, setUltimate, setUsername, setPin }) {
  const [usernameInput, setUsernameInput] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      const storedUsername = localStorage.getItem("username")
      if (storedUsername) {
        setUsername(storedUsername)
      }
      navigate(redirect || "/")
    }
  }, [navigate, redirect, setUsername])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!usernameInput || !password) {
      toast.error("Please fill in all fields.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("https://www.server.speakeval.org/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password }),
      })

      const data = await res.json()

      if (data.redirect) {
        navigate("/" + data.redirect)
        return
      }

      if (res.status !== 200) {
        throw new Error(data.error || "Login failed")
      }

      if (data.token) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("username", usernameInput)
        setUsername(usernameInput)
        setPin(data.token)
        if (data.subscription) {
          set(data.subscription !== "free")
          setUltimate(data.subscription === "Ultimate")
        } else {
          set(false)
          setUltimate(false)
        }
        navigate(redirect || "/")
      }
    } catch (err) {
      console.error("Login Error:", err)
      toast.error(err.message || "Failed to login. Please try again.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">Log In</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="text"
            className="auth-input"
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : "Log In"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

