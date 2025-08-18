"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import RoomCodePanel from "../components/RoomCodePanel";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";

function TeacherPortalRouter({ initialUserId = "", set, setUltimate, getPin }) {
  const [userId, setUserId] = useState(getPin());
  const [loggedIn, setLoggedIn] = useState(userId);
  const [shake, setShake] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login?redirect=/teacher-portal");
    } else {
      fetchRooms();
    }
  }, [loggedIn, navigate]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `https://www.server.speakeval.org/getrooms?pin=${userId}`
      );
      let data = await res.json();
      data = data.map((room) => ({
        ...room,
        code: Number.parseInt(room.code.toString().slice(0, -3)),
      }));

      data = data.filter(
        (room, index, self) =>
          index === self.findIndex((t) => t.code === room.code)
      );

      setRooms(data.sort((a, b) => a.created - b.created));
      setIsLoading(false);
    } catch (err) {
      console.error("Error Fetching Rooms", err);
      toast.error("Error Fetching Rooms");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(
        `https://www.server.speakeval.org/teacherpin?pin=${userId}`
      );
      const data = await res.json();

      if (data.code === 401) {
        toast.error("Incorrect Teacher Pin");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setUserId("");
      } else if (data.code === 200) {
        setLoggedIn(true);
        if (data.subscription) {
          set(data.subscription !== "free");
          setUltimate(data.subscription === "Ultimate");
        }
      }
    } catch (err) {
      console.error("Error Loading Data", err);
      toast.error("Error Loading Data");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setUserId("");
    }
  };

  if (!loggedIn) {
    return (
      <div className="container">
        <Card className={`max-w-md mx-auto ${shake ? "animate-shake" : ""}`}>
          <h2 className="text-2xl font-bold mb-6 text-center">Teacher Login</h2>
          <input
            type="password"
            value={userId}
            onChange={(e) => setUserId(e.target.value.toUpperCase())}
            className="input mb-4"
            maxLength={30}
            placeholder="Enter Teacher Pin"
            onKeyUp={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin} className="btn btn-primary w-full">
            Log In
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center mb-8">
          <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg flex flex-col items-center p-8 border border-cyan-500/30">
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-300"></div>
            </div>
          </div>
        </div>
      ) : (
        <RoomCodePanel rooms={rooms} pin={userId} />
      )}
    </div>
  );
}

export default TeacherPortalRouter;
