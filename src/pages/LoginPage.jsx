
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
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";

function LoginPageContent({ set, setUltimate, setUsername, setPin }) {
  const { setToken: setAuthToken, setUsername: setAuthUsername, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState("");
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  // userRole removed - login is now unified for both teachers and students

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If authenticated, redirect to intended page
    if (isAuthenticated && token) {
      navigate(redirect || "/");
    }
  }, [navigate, redirect, isAuthenticated, authLoading, token]);

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
      let res;
      let data;

      // Unified Google login for both teachers and students
      res = await fetch("https://www.server.speakeval.org/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: googleUser,
        }),
      });
      data = await res.json();

      if (res.status !== 200) {
        if (data?.redirect) {
          navigate("/" + data.redirect);
        }
        throw new Error(data.error || "Google login failed");
      }

      console.log("Google login successful:", data);
      if (data.token) {
        // Store authentication data
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setUsername(data.username);
        setPin(data.token);
        
        // Handle subscription for teachers
        if (data.subscription) {
          set(data.subscription !== "free");
          setUltimate(data.subscription === "Ultimate");
        } else {
          set(false);
          setUltimate(false);
        }
        
        // Route based on user type
        if (data.userType === 'student') {
          // Store student data for classroom system
          localStorage.setItem("classroom_user", JSON.stringify({
            username: data.username,
            userType: 'student',
            isAuthenticated: true,
            googleAuth: true
          }));
          localStorage.setItem("token", data.token);
          navigate("/classroom");
        } else {
          // Teacher - go to main site
          navigate(redirect || "/");
        }
        
        toast.success("Successfully signed in with Google!");
      } else {
        if (data.redirect) {
          navigate("/" + data.redirect);
        }
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
      let res;
      let data;

      // Unified login for both teachers and students
      res = await fetch("https://www.server.speakeval.org/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password }),
      });
      data = await res.json();

      if (data.redirect) {
        navigate("/" + data.redirect);
        return;
      }

      if (res.status !== 200) {
        throw new Error(data.error || "Login failed");
      }
      
      console.log("Login successful:", data);
      if (data.token) {
        // Use AuthContext to set token (handles cookies and localStorage)
        setAuthToken(data.token);
        setAuthUsername(data.username);
        
        // Also set for backward compatibility
        setUsername(data.username);
        setPin(data.token);
        
        // Handle subscription for teachers
        if (data.subscription) {
          set(data.subscription !== "free");
          setUltimate(data.subscription === "Ultimate");
        } else {
          set(false);
          setUltimate(false);
        }
        
        // Route based on user type
        if (data.userType === 'student') {
          // Store student data for classroom system
          localStorage.setItem("classroom_user", JSON.stringify({
            username: data.username,
            userType: 'student',
            isAuthenticated: true
          }));
          navigate("/classroom");
        } else {
          // Teacher - go to main site
          navigate(redirect || "/");
        }
        
        toast.success(`Welcome back, ${data.username}!`);
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

            {/* Role selection removed - login is now unified */}

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
              <Link 
                to={"/register"} 
                className="auth-link"
              >
                Teacher Sign Up
              </Link>
              {" "}or{" "}
              <Link 
                to={"/classroom/signup"} 
                className="auth-link"
              >
                Student Sign Up
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
    <GoogleOAuthProvider clientId="932508417487-hnjgjd5qsh5ashbhuem1hegtfghnn2i4.apps.googleusercontent.com">
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
