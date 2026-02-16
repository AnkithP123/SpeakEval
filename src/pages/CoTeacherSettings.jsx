"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import { cuteAlert } from "cute-alert";
import { toast } from "react-toastify";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";

const CoTeacherSettings = () => {
  const { token, isCoTeacher } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [coTeachers, setCoTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCoTeachers, setLoadingCoTeachers] = useState(true);

  useEffect(() => {
    // Load co-teachers from backend
    const fetchCoTeachers = async () => {
      if (!token) {
        setLoadingCoTeachers(false);
        return;
      }

      try {
        const response = await fetch("https://www.server.speakeval.org/get-co-teachers", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Map backend data to frontend format
          const mappedCoTeachers = data.coTeachers.map((ct, index) => ({
            id: index,
            email: ct.email,
            username: ct.username,
            accepted: ct.accepted || false
          }));
          setCoTeachers(mappedCoTeachers);
        } else {
          console.error("Failed to fetch co-teachers:", data.error);
        }
      } catch (error) {
        console.error("Error fetching co-teachers:", error);
      } finally {
        setLoadingCoTeachers(false);
      }
    };

    fetchCoTeachers();
  }, [token]);

  const handleAddCoTeacher = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      cuteAlert({
        type: "warning",
        title: "Email Required",
        description: "Please enter a co-teacher's email address.",
        primaryButtonText: "OK",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      cuteAlert({
        type: "warning",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        primaryButtonText: "OK",
      });
      return;
    }

    // Check if email already exists
    if (coTeachers.some(ct => ct.email.toLowerCase() === email.toLowerCase())) {
      cuteAlert({
        type: "warning",
        title: "Duplicate Email",
        description: "This co-teacher is already added.",
        primaryButtonText: "OK",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://www.server.speakeval.org/add-co-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add co-teacher");
      }

      if (data.success) {
        // Only add to local state after successful backend response
        const newCoTeacher = {
          id: Date.now(),
          email: email.trim().toLowerCase(),
          username: data.username, // Use actual username from backend
          accepted: false
        };
        setCoTeachers([...coTeachers, newCoTeacher]);
        setEmail("");
        toast.success(data.message || "Invitation sent successfully!");
      } else {
        throw new Error(data.error || "Failed to add co-teacher");
      }
    } catch (error) {
      console.error("Error adding co-teacher:", error);
      cuteAlert({
        type: "error",
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        primaryButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoTeacher = async (id, email) => {
    cuteAlert({
      type: "question",
      title: "Remove Co-Teacher?",
      description: `Are you sure you want to remove ${email} as a co-teacher? They will lose access to your account.`,
      primaryButtonText: "Yes, Remove",
      secondaryButtonText: "Cancel",
    }).then(async (result) => {
      if (result === "primaryButtonClicked") {
        try {
          const response = await fetch("https://www.server.speakeval.org/remove-co-teacher", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ email: email }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Remove from local state only after successful backend response
            setCoTeachers(coTeachers.filter(ct => ct.id !== id));
            toast.success(data.message || "Co-teacher removed successfully.");
          } else {
            throw new Error(data.error || "Failed to remove co-teacher");
          }
        } catch (error) {
          console.error("Error removing co-teacher:", error);
          cuteAlert({
            type: "error",
            title: "Error",
            description: error.message || "Failed to remove co-teacher. Please try again.",
            primaryButtonText: "OK",
          });
        }
      }
    });
  };

  if (isCoTeacher) {
    return (
      <div className="min-h-screen text-gray-200 font-sans pt-24">
        <div className="p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <Card color="cyan">
              <div className="py-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Access restricted</h1>
                <p className="text-cyan-200 mb-4">Co-teachers cannot manage co-teacher settings.</p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2 bg-cyan-500/80 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                >
                  Go to home
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans pt-24">
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <Card color="cyan">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-white mb-4">
                Co-Teacher Settings
              </h1>
              <p className="text-cyan-200 text-lg">
                You can add a co-teacher to operate with the same access by linking their account to your username temporarily. 
                This allows them to manage your classes, assignments, and exams with full access to your account.
              </p>
            </div>
          </Card>

          {/* Instructions */}
          <Card color="purple">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Instructions for Adding a Co-Teacher
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-cyan-200 text-base">
                <li>Have your co-teacher create an account on the platform if they don't already have one.</li>
                <li>Enter their email address in the field below.</li>
                <li>Once added, they will be able to link their account to your username and gain temporary access to your account.</li>
                <li>You can remove co-teachers at any time by clicking the X button next to their name.</li>
              </ol>
            </div>
          </Card>

          {/* Add Co-Teacher Form */}
          <Card color="cyan">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FaUserPlus className="mr-2" />
                Add Co-Teacher
              </h2>
              <form onSubmit={handleAddCoTeacher} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter co-teacher's email address"
                  className="flex-1 px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Add"}
                </button>
              </form>
            </div>
          </Card>

          {/* Co-Teachers List */}
          <Card color="purple">
            <div className="py-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Current Co-Teachers ({coTeachers.length})
              </h2>
              {loadingCoTeachers ? (
                <p className="text-cyan-200 text-center py-8">
                  Loading co-teachers...
                </p>
              ) : coTeachers.length === 0 ? (
                <p className="text-cyan-200 text-center py-8">
                  No co-teachers added yet. Add one using the form above.
                </p>
              ) : (
                <div className="space-y-3">
                  {coTeachers.map((coTeacher) => (
                    <div
                      key={coTeacher.id}
                      className="flex items-center justify-between p-4 bg-black/30 border border-cyan-500/30 rounded-lg hover:bg-black/40 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">
                          {coTeacher.username}
                        </p>
                        <p className="text-cyan-300 text-sm mt-1">
                          {coTeacher.email}
                          {coTeacher.accepted ? (
                            <span className="ml-2 text-green-400">• Accepted</span>
                          ) : (
                            <span className="ml-2 text-yellow-400">• Pending</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveCoTeacher(coTeacher.id, coTeacher.email)}
                        className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        title="Remove co-teacher"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoTeacherSettings;
