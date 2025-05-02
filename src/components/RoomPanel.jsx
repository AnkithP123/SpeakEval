"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import { toast } from "react-toastify";
import { FaUsers, FaPlay, FaRedo, FaUserPlus } from "react-icons/fa";
import Card from "./Card";
import { cuteAlert } from "cute-alert";

function RoomPanel({ roomCode, userId, setRoomCodes }) {
  const [participants, setParticipants] = useState([]);
  const [roomStarted, setRoomStarted] = useState(false);
  const [completedParticipants, setCompletedParticipants] = useState([]);
  const [cheaters, setCheaters] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false);
  const navigate = useNavigate();
  const displayNameInputRef = useRef(null);

  let fetchParticipants2 = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/checkjoined?code=${roomCode}&pin=${userId}`
      );
      const data = await response.json();
      if (data.error) {
        return;
      }
      setParticipants(data.members);

    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Error fetching participants");
    }
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/checkcompleted?code=${roomCode}&pin=${userId}`
      );
      const data = await response.json();
      if (data.error) {
        return;
      }
      setCompletedParticipants(data.members);
    } catch (error) {
      console.error("Error fetching completed participants:", error);
      toast.error("Error fetching completed participants");
    }
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(
          `https://www.server.speakeval.org/checkjoined?code=${roomCode}&pin=${userId}`
        );
        const data = await response.json();
        if (data.error) {
          return;
        }
        setParticipants(data.members);
        console.log('Data: ', data.cheaters ? data.cheaters.length : "None");
        console.log('Cheaters: ', cheaters ? cheaters.length : "None");
        const newCheaters = data.cheaters ? data.cheaters.filter((cheater) => !cheaters.includes(cheater)) : [];
        if (newCheaters.length > 0) {
          toast.error("Some participants broke test integrity: " + newCheaters.join(", "));
        }
        if (data.cheaters && data.cheaters.length > 0 && newCheaters.length > 0) {
          setCheaters((prevCheaters) => [
            ...new Set([...prevCheaters, ...data.cheaters]),
          ]);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
        toast.error("Error fetching participants");
      }
      try {
        const response = await fetch(
          `https://www.server.speakeval.org/checkcompleted?code=${roomCode}&pin=${userId}`
        );
        const data = await response.json();
        if (data.error) {
          return;
        }
        setCompletedParticipants(data.members);
      } catch (error) {
        console.error("Error fetching completed participants:", error);
        toast.error("Error fetching completed participants");
      }
    };  
    fetchParticipants();
    const intervalId = setInterval(fetchParticipants, 3000);
    return () => clearInterval(intervalId);
  }, [roomCode, userId, cheaters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        displayNameInputRef.current &&
        !displayNameInputRef.current.contains(event.target)
      ) {
        setShowDisplayNameInput(false);
      }
    };

    if (showDisplayNameInput) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDisplayNameInput]);

  const handleStart = async () => {
    const response = await fetch(
      `https://www.server.speakeval.org/start_room?code=${roomCode}&pin=${userId}`
    );
    const data = await response.json();
    if (data.code === 404) {
      toast.error("Room not found");
      return navigate("/");
    }
    toast.success("Room started");
    setRoomStarted(true);
  };

  const handleRestart = async () => {
    const everyoneCompleted = participants.every((participant) =>
      completedParticipants.includes(participant)
    );

    document.documentElement.style.setProperty(
      "--cute-alert-max-width",
      document.documentElement.style.getPropertyValue(
        "--cute-alert-min-width"
      ) || "20%"
    );

    cuteAlert({
      type: everyoneCompleted ? "question" : "error",
      title: "Are you sure?",
      description:
        "Are you sure you want to administer another question?" +
        (everyoneCompleted
          ? ""
          : "\nNot everyone has finished with the current question."),
      primaryButtonText: "Confirm",
      secondaryButtonText: "Cancel",
      showCloseButton: true,
      closeOnOutsideClick: true,
    }).then(async (event) => {
      if (event === "primaryButtonClicked") {
        const response = await fetch(
          `https://www.server.speakeval.org/restart_room?code=${roomCode}&pin=${userId}`
        );
        const data = await response.json();
        if (data.error) {
          toast.error(data.error);
          return navigate("/");
        }
        setCompletedParticipants([]);
        // in 1 second, do the same
        setTimeout(() => {
          setCompletedParticipants([]);
        }, 1000);

        toast.success("Room restarted");
        setRoomCodes(data.newRoomCode);
        roomCode = data.newRoomCode;
        console.log("New: " + roomCode);
        setRoomStarted(true);
      }
    });
  };

  const handleDisplayNameSubmit = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/add_display?code=${roomCode}&pin=${userId}&display=${displayName}`
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message ? data.message : "Display name was set");
        setShowDisplayNameInput(false);
      }
    } catch (error) {
      console.error("Error setting display name:", error);
      toast.error("Error setting display name");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card color="cyan" className="relative min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-black/30 text-white rounded-lg p-3 flex items-center mb-3">
            <FaUsers className="text-cyan-400 mr-2" /> Participants:{" "}
            {participants.length}
          </div>
          <button
            onClick={roomStarted ? handleRestart : handleStart}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-red-600 hover:to-pink-600 transition-all duration-300"
          >
            {roomStarted ? (
              <FaRedo className="mr-2" />
            ) : (
              <FaPlay className="mr-2" />
            )}
            <span>{roomStarted ? "New Question" : "Start Room"}</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Room Code</h2>
          <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
            {roomCode.toString().slice(0, -3)}
          </span>
        </div>

        <div className="min-h-60">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cheaters.map((cheater, index) => (
              <ProfileCard
                key={`cheater-${index}`}
                name={cheater}
                code={roomCode}
                onParticipantRemoved={fetchParticipants2}
                userId={userId}
                completed={completedParticipants.includes(cheater)}
                cheater={true} // Pass a prop to indicate cheating
              />
            ))}
            {completedParticipants.filter(
              (participant) =>
                !cheaters.includes(participant)
            ).map((participant, index) => (
              <ProfileCard
                key={`completed-${index}`}
                name={participant}
                code={roomCode}
                onParticipantRemoved={fetchParticipants2}
                userId={userId}
                completed={true}
              />
            ))}
            {participants
              .filter(
                (participant) =>
                  !completedParticipants.includes(participant) &&
                  !cheaters.includes(participant)
              )
              .map((participant, index) => (
                <ProfileCard
                  key={`participant-${index}`}
                  name={participant}
                  code={roomCode}
                  onParticipantRemoved={fetchParticipants2}
                  userId={userId}
                  completed={false}
                />
              ))}
          </div>
        </div>
        <button
          onClick={() => setShowDisplayNameInput(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg px-4 py-2 flex items-center space-x-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg z-50"
        >
          <FaUserPlus className="mr-2" />
          <span>Set Display Name</span>
        </button>
      </Card>

      {showDisplayNameInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card color="blue" className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Rename this exam
            </h2>
            <p className="text-gray-300 mb-4 text-center">
              Choose a descriptive and unique name for easy grading
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/30 border border-blue-500/30 rounded p-2 text-white mb-4"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDisplayNameSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg px-4 py-2 hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg px-4 py-2 hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RoomPanel;
