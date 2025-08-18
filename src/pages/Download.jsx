import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProfileCard from "../components/StatsCard";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";

function Download() {
  const [searchParams] = useSearchParams();
  const [participants, setParticipants] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("No token provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://www.server.speakeval.org/download_bulk?token=${token}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        //iterate throught data.participant
        const participantPromises = data.participant.map(
          async (participant, index) => {
            // Create a new object to avoid mutating the original data
            const newParticipant = { ...participant };

            if (data.audioUrl[index]) {
              try {
                const audioResponse = await fetch(data.audioUrl[index]);
                if (audioResponse.ok) {
                  const audioBlob = await audioResponse.blob();
                  // Add the blob to our new participant object
                  newParticipant.voiceAudio = audioBlob;
                } else {
                  console.warn(
                    `Failed to fetch audio for participant ${index}`
                  );
                  newParticipant.voiceAudio = null;
                }
              } catch (fetchError) {
                console.error(
                  `Error fetching audio for participant ${index}:`,
                  fetchError
                );
                newParticipant.voiceAudio = null;
              }
            } else {
              newParticipant.voiceAudio = null;
            }
            return newParticipant;
          }
        );

        // Wait for all the fetch promises to complete
        const updatedParticipants = await Promise.all(participantPromises);

        // Now, set the state with the fully populated data
        setParticipants(updatedParticipants);
      } catch (err) {
        setError(err.message || "Failed to fetch participant data");
        toast.error(
          "Error loading responses: " + (err.message || "Unknown error")
        );
      } finally {
        //wait 1 second
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-lg text-gray-600">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!participants.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground-700 mb-4">
            No Responses Found
          </h2>
          <p className="text-foreground-600">
            No responses are available for this token.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Your Responses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.map((participant, index) => (
          <ProfileCard
            key={`${participant.name}-${index}-${index}`}
            text={participant.transcription || ""}
            rubric={participant.rubric || ""}
            rubric2={participant.rubric2 || ""}
            audio={participant.audio || ""}
            question={participant.questionText || ""}
            questionBase64={participant.question || ""}
            index={participant.index || 0}
            name={participant.name || ""}
            code={index || ""}
            onGradeUpdate={() => {}}
            tokenProvided={true}
            participantPass={participant}
            voiceComment={participant.voiceAudio}
          />
        ))}
      </div>
    </div>
  );
}

export default Download;
