"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as jwtDecode from "jwt-decode";
import {
  googleLogout,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import "./auth.css";

function LoginPageContent({ set, setUltimate, setUsername, setPin }) {
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState("");
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(
            "https://www.server.speakeval.org/expired-token?token=" + token
          );
          const tokenExpiredJson = await response.json();

          if (tokenExpiredJson.expired) {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            toast.error("Your session has expired. Please log in again.");
            navigate("/login");
          } else {
            setUsername(tokenExpiredJson.decoded.username);
            navigate(redirect || "/");
          }
        } catch (error) {
          console.error("Token check failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("username");
        }
      } else {
        localStorage.removeItem("username");
      }
    };

    checkToken();
  }, [navigate, redirect, setUsername]);

  const handleGoogleFailure = (response) => {
    toast.error("Google sign-in failed. Please try again.");
  };

  const handleGoogleLogout = () => {
    setGoogleName("");
    setGoogleEmail("");
    setUseGoogle(false);
    googleLogout();
  };

  const handleGoogleLogin = async (googleUser) => {
    setIsLoading(true);
    try {
      const res = await fetch("https://www.server.speakeval.org/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: googleUser,
        }),
      });
      const data = await res.json();

      if (res.status !== 200) {
        throw new Error(data.error || "Google login failed");
      }

      console.log("Google login successful:", data);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setUsername(data.username);
        setPin(data.token);
        if (data.subscription) {
          set(data.subscription !== "free");
          setUltimate(data.subscription === "Ultimate");
        } else {
          set(false);
          setUltimate(false);
        }
        navigate(redirect || "/");
        toast.success("Successfully signed in with Google!");
      } else {
        toast.error("Failed to login with Google. Please try again.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error(
        err.message || "Failed to login with Google. Please try again."
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput || !password) {
      toast.error("Please fill in all fields.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("https://www.server.speakeval.org/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password }),
      });

      const data = await res.json();

      if (data.redirect) {
        navigate("/" + data.redirect);
        return;
      }

      if (res.status !== 200) {
        throw new Error(data.error || "Login failed");
      }
      console.log("Login successful:", data);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setUsername(data.username);
        setPin(data.token);
        if (data.subscription) {
          set(data.subscription !== "free");
          setUltimate(data.subscription === "Ultimate");
        } else {
          set(false);
          setUltimate(false);
        }
        navigate(redirect || "/");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.error(err.message || "Failed to login. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    let res = await fetch(
      "https://www.server.speakeval.org/reset-password-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    let data = await res.json();
    if (res.status !== 200) {
      toast.error(data.error || "Failed to send reset link.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    toast.success("Password reset link sent to your email.");
    setForgotMode(false);
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">
          {forgotMode ? "Reset Password" : "Log In"}
        </h2>

        {forgotMode ? (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <input
              type="email"
              className="auth-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? <span className="spinner"></span> : "Reset Password"}
            </button>
            <button
              type="button"
              className="auth-link mt-2"
              onClick={() => setForgotMode(false)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <>
            {/* Google Sign-in Section */}
            {useGoogle ? (
              <div className="google-user-info">
                <p className="google-user-name">Signed in as {googleName}</p>
                {!isLoading && (
                  <button
                    onClick={handleGoogleLogout}
                    className="google-signout-button"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              <div className="google-signin-container">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={handleGoogleFailure}
                    className="google-signin-button"
                  />
                </div>
                <div className="auth-divider">
                  <span className="auth-divider-text">or</span>
                </div>
              </div>
            )}

            <form className="auth-form" onSubmit={handleLogin}>
              <input
                type="text"
                className="auth-input"
                placeholder="Username or Email"
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
              <button
                type="submit"
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner"></span> : "Log In"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="auth-link"
                onClick={() => setForgotMode(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Forgot username or password?
              </button>
            </div>
            <p className="mt-4 text-center">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Sign Up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function LoginPage({ set, setUltimate, setUsername, setPin }) {
  return (
    <GoogleOAuthProvider clientId="208007004238-f51ulher853hill1r9dit2qs5hufk6oe.apps.googleusercontent.com">
      <LoginPageContent
        set={set}
        setUltimate={setUltimate}
        setUsername={setUsername}
        setPin={setPin}
      />
    </GoogleOAuthProvider>
  );
}

export default LoginPage;
