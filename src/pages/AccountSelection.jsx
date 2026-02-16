"use client";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/Card";
import { toast } from "react-toastify";

const AccountSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username: currentUsername, setToken, setUsername } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginToken, setLoginToken] = useState(null);

  useEffect(() => {
    // Get accounts from location state (passed from login) or use sample data
    const stateAccounts = location.state?.accounts;
    const stateToken = location.state?.token;
    
    if (stateAccounts && stateAccounts.length > 0) {
      setAccounts(stateAccounts.map(acc => ({ username: acc, isOwnAccount: acc === currentUsername })));
      setLoginToken(stateToken);
    } else {
      // Fallback to sample data if no state
      const username = currentUsername || localStorage.getItem("username") || "teacher123";
      setAccounts([
        { username: username, isOwnAccount: true },
        { username: "coteacher1", isOwnAccount: false },
        { username: "coteacher2", isOwnAccount: false },
      ]);
    }
  }, [currentUsername, location.state]);

  const handleLogin = async (username) => {
    if (!loginToken) {
      // If no login token, just navigate (fallback behavior)
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://www.server.speakeval.org/select-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username: username,
          token: loginToken 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to select account");
      }

      // Update auth context
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
      }
      if (data.username) {
        setUsername(data.username);
      }

      toast.success(`Logged in as ${data.username}`);
      navigate("/");
    } catch (error) {
      console.error("Error selecting account:", error);
      toast.error(error.message || "Failed to select account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans pt-24">
      <div className="p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Card color="cyan">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-white mb-6 text-center">
                Select Account
              </h1>
              <p className="text-cyan-200 text-center mb-8">
                Choose which account you would like to access
              </p>
              
              <div className="space-y-4">
                {accounts.map((account, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-black/30 border border-cyan-500/30 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">
                        {account.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLogin(account.username)}
                      disabled={loading}
                      className="ml-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Loading..." : "Login"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;
