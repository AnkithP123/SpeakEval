"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./auth.css";

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [token, setToken] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extract token from URL
    const urlToken = searchParams.get("token");
    if (!urlToken) {
      setIsTokenValid(false);
      toast.error("Invalid password reset link");
    } else {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 50) {
      toast.error("Password must be between 6 and 50 characters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        "https://www.server.speakeval.org/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await res.json();

      if (res.status !== 200) {
        throw new Error(data.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successfully");

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      toast.error(err.message || "Failed to reset password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (err.message === "Invalid or expired token") {
        setIsTokenValid(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Invalid Link</h2>
          <p className="text-center">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="auth-button"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Password Reset Successful</h2>
          <p className="text-center">
            Your password has been reset successfully. You will be redirected to
            the login page shortly.
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="auth-button"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? "shake" : ""}`}>
        <h2 className="auth-title">Reset Password</h2>
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="auth-form-group">
            <label htmlFor="new-password" className="auth-label">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              className="auth-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              maxLength={50}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirm-password" className="auth-label">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="auth-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <span className="spinner"></span> : "Reset Password"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
