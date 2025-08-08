"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FaDownload,
  FaPlay,
  FaPause,
  FaRobot,
  FaInfoCircle,
  FaClipboard,
  FaSpinner,
  FaEnvelope,
  FaExclamationTriangle,
} from "react-icons/fa";
import urlCache from "../utils/urlCache";

function ProfileCard({
  text,
  rubric,
  rubric2,
  audio,
  question,
  index,
  questionBase64,
  questionAudioUrl,
  name,
  code,
  onGradeUpdate,
  customName,
  tokenProvided = false,
  participantPass = null,
  isRed = false,
  onShowEmailModal = () => {},
  onShowInfractionsModal = () => {},
  cheatingData = [],
  info = {},
}) {
  // States used in both modes
  const [fetchedAudio, setFetchedAudio] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [aiButtonDisabled, setAiButtonDisabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [grades, setGrades] = useState({});
  const [justifications, setJustifications] = useState({});
  const [categories, setCategories] = useState([]);

  // New state for download mode
  const [downloadMode, setDownloadMode] = useState(false);
  const [downloadedData, setDownloadedData] = useState(null);

  // Email modal states (unused in download mode)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [baseEmailBody, setBaseEmailBody] = useState("");
  const [includeResponseLink, setIncludeResponseLink] = useState(false);
  const [emailSubject, setEmailSubject] = useState("SpeakEval Exam Result");
  const [showInfractionsModal, setShowInfractionsModal] = useState(false);

  const [error, setError] = useState(false);

  // Reset error after animation
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // setError(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check if URL has a "token" param, then fetch from /download
  useEffect(() => {
    if (tokenProvided) {
      setDownloadMode(true);
      const participant = participantPass;
      participant.questionBase64 = participant.question;
      participant.question = participant.questionText;
      participant.text = participant.transcription;
      setDownloadedData(participant);
    }
  }, [tokenProvided, participantPass]);

  // Derive effective values using downloadedData if in downloadMode
  const effectiveName =
    downloadMode && downloadedData ? downloadedData.name : name;
  const effectiveText =
    downloadMode && downloadedData ? downloadedData.text : text;
  let effectiveAudio =
    downloadMode && downloadedData ? downloadedData.audio : audio;
  const effectiveQuestion =
    downloadMode && downloadedData ? downloadedData.question : question;
  const effectiveCode = code;
  const effectiveCustomName =
    downloadMode && downloadedData ? downloadedData.customName : customName;
  const effectiveQuestionBase64 =
    downloadMode && downloadedData
      ? downloadedData.questionBase64
      : questionBase64;
  const effectiveQuestionAudioUrl =
    downloadMode && downloadedData
      ? downloadedData.questionAudioUrl
      : questionAudioUrl;

  useEffect(() => {
    if (effectiveName) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [effectiveName]);

  const fetchAudio = useCallback(async () => {
    console.log("fetching audio");
    let audioUrl;

    try {
      // Check if we already have a presigned URL
      if (effectiveAudio && effectiveAudio.startsWith("http")) {
        audioUrl = effectiveAudio;
      } else {
        // Use URL cache for fetching
        audioUrl = await urlCache.getUrl(
          "student_audio",
          audio, // token as id
          null,
          async () => {
            console.log("Audio not fetched, fetching now..." + audio);
            const audios = await fetch(
              `https://www.server.speakeval.org/fetch_audio?token=${audio}`
            );
            const audiosJson = await audios.json();
            console.log("Audio fetched:", audiosJson);
            if (!audios.ok) {
              throw new Error("Failed to fetch audio: " + audiosJson.error);
            }

            // Check if we got a presigned URL or fallback to Base64
            if (audiosJson.audioUrl) {
              return audiosJson.audioUrl;
            } else if (audiosJson.audio) {
              // Fallback to Base64 processing
              const audioData = Uint8Array.from(atob(audiosJson.audio), (c) =>
                c.charCodeAt(0)
              );
              const audioBlob = new Blob([audioData], { type: "audio/ogg" });

              try {
                const wavBlob = await convertOggToWav(audioBlob);
                return URL.createObjectURL(wavBlob);
              } catch (err) {
                return URL.createObjectURL(audioBlob);
              }
            }
            throw new Error("No audio data received");
          }
        );
      }

      // Set the audio source
      const answerAudioPlayer = document.getElementById(
        `answerAudioPlayer-${effectiveName}-${effectiveCode}`
      );
      if (answerAudioPlayer && audioUrl) {
        answerAudioPlayer.src = audioUrl;
      }
    } catch (error) {
      console.log("Error loading audio:", error);
      console.log(effectiveName);
    }
  }, [effectiveCode, effectiveName, effectiveAudio, audio]);

  async function convertOggToWav(oggBlob) {
    const arrayBuffer = await oggBlob.arrayBuffer();
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    let offset = 0;

    // RIFF identifier
    writeString(view, offset, "RIFF");
    offset += 4;
    // File length
    view.setUint32(
      offset,
      36 + audioBuffer.length * numberOfChannels * 2,
      true
    );
    offset += 4;
    // RIFF type
    writeString(view, offset, "WAVE");
    offset += 4;
    // Format chunk identifier
    writeString(view, offset, "fmt ");
    offset += 4;
    // Format chunk length
    view.setUint32(offset, 16, true);
    offset += 4;
    // Sample format (raw)
    view.setUint16(offset, 1, true);
    offset += 2;
    // Channel count
    view.setUint16(offset, numberOfChannels, true);
    offset += 2;
    // Sample rate
    view.setUint32(offset, audioBuffer.sampleRate, true);
    offset += 4;
    // Byte rate
    view.setUint32(offset, audioBuffer.sampleRate * numberOfChannels * 2, true);
    offset += 4;
    // Block align
    view.setUint16(offset, numberOfChannels * 2, true);
    offset += 2;
    // Bits per sample
    view.setUint16(offset, 16, true);
    offset += 2;
    // Data chunk identifier
    writeString(view, offset, "data");
    offset += 4;
    // Data chunk length
    view.setUint32(offset, audioBuffer.length * numberOfChannels * 2, true);
    offset += 4;

    // Write interleaved data
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  const handlePlay = async () => {
    console.log("Fetch Audio: ", fetchAudio);
    if (!effectiveName)
      return toast.error("Participant has not completed the task");
    if (effectiveText === "" && !downloadMode) {
      // await fetchAudioData();
    }
    try {
      setIsLoading(true);
      const answerAudioPlayer = document.getElementById(
        `answerAudioPlayer-${effectiveName}-${effectiveCode}`
      );
      if (answerAudioPlayer && answerAudioPlayer.src) {
        if (isPlaying) {
          await answerAudioPlayer.pause();
          setIsPlaying(false);
        } else {
          await answerAudioPlayer.play();
          setIsLoading(false);
          setIsPlaying(true);
          answerAudioPlayer.addEventListener("ended", () => {
            setIsPlaying(false);
          });
        }
      } else {
        await fetchAudio();
        handlePlay();
      }
      setError(false);
    } catch (error) {
      console.error("Error playing answer audio:", error);
      // Trigger error animation
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!effectiveName)
      return toast.error("Participant has not completed the task");
    try {
      const decoded = atob(effectiveAudio);
      console.log("Decoded:", decoded);
    } catch (e) {
      console.log("Not base64:", e.message);
      console.log("Audio not fetched, fetching now..." + audio);
      const audios = await fetch(
        `https://www.server.speakeval.org/fetch_audio?token=${audio}`
      );
      const audiosJson = await audios.json();
      console.log("Audio fetched:", audiosJson);
      if (!audios.ok) {
        return toast.error("Failed to fetch audio: " + audiosJson.error);
      }
      effectiveAudio = audiosJson.audio;
    }
    const audioData = Uint8Array.from(atob(effectiveAudio), (c) =>
      c.charCodeAt(0)
    );
    const audioBlob = new Blob([audioData], { type: "audio/ogg" });

    const a = document.createElement("a");

    try {
      const wavBlob = await convertOggToWav(audioBlob);
      const url = URL.createObjectURL(wavBlob);
      a.href = url;
    } catch (err) {
      const url = URL.createObjectURL(audioBlob);
      a.href = url;
    }

    a.download = `${effectiveName}-${effectiveCode}.wav`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePlayQuestion = async () => {
    if (!effectiveName)
      return toast.error("Participant has not completed the task");
    try {
      // Check if we have questionAudioUrl from the new system
      if (effectiveQuestionAudioUrl) {
        const questionAudioPlayer = document.getElementById(
          `questionAudioPlayer-${effectiveName}-${effectiveCode}`
        );
        if (questionAudioPlayer) {
          questionAudioPlayer.src = effectiveQuestionAudioUrl;
          questionAudioPlayer.play();
        }
      } else if (effectiveQuestionBase64) {
        // Fallback to old Base64 system
        const audioData = Uint8Array.from(atob(effectiveQuestionBase64), (c) =>
          c.charCodeAt(0)
        );
        const audioBlob = new Blob([audioData], {
          type: "audio/ogg; codecs=opus",
        });
        const wavBlob = await convertOggToWav(audioBlob);
        const audioUrl = URL.createObjectURL(wavBlob);

        const questionAudioPlayer = document.getElementById(
          `questionAudioPlayer-${effectiveName}-${effectiveCode}`
        );
        if (questionAudioPlayer) {
          questionAudioPlayer.src = audioUrl;
          questionAudioPlayer.play();
        }
      } else {
        console.error("No audio data returned from fetchQuestion.");
        toast.error("No question audio available");
      }
    } catch (error) {
      console.error("Error fetching or playing question audio:", error);
      toast.error("Error playing question audio");
    }
  };

  // The following grading functions are skipped/unused in download mode.
  const handleGetGrade = async () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error("Participant has not completed the task");
    if (effectiveText === "") {
      return toast.error(
        "Press the download button to fetch this student's data."
      );
    }
    try {
      const query = new URLSearchParams({
        transcription: effectiveText,
        rubric: rubric,
        code: effectiveCode,
        index: index,
      }).toString();

      const response = await fetch(
        `https://www.server.speakeval.org/getgrade?${query}`
      );
      const data = await response.json();

      if (!data.grades)
        return toast.error(
          "Error getting grade. This may be due to a high volume of requests. Try again in a few seconds."
        );
      setGrades(data.grades);

      if (!data.justifications)
        return toast.error(
          "Error getting justifications. This may be due to a high volume of requests. Try again in a few seconds."
        );
      setJustifications(data.justifications);

      let total = 0;
      Object.values(data.grades).forEach((grade) => {
        total += Number.parseFloat(grade) || 0;
      });
      setTotalScore(total);

      const category =
        rubric2 === ""
          ? []
          : rubric2.split("|;;|").map((element) => {
              return element.split("|:::|")[0];
            });
      setCategories(category);

      onGradeUpdate(
        effectiveName,
        effectiveCustomName,
        data.grades,
        total,
        comment,
        categories
      );
    } catch (error) {
      console.error("Error getting grade:", error);
    }
  };

  const handleGradeChange = (gradeIndex, value) => {
    if (downloadMode) return;
    const updatedGrades = { ...grades, [gradeIndex]: value };

    let total = 0;
    Object.values(updatedGrades).forEach((grade) => {
      total += Number.parseFloat(grade) || 0;
    });
    setTotalScore(total);

    setGrades(updatedGrades);

    const category =
      rubric2 === ""
        ? []
        : rubric2.split("|;;|").map((element) => {
            return element.split("|:::|")[0];
          });
    setCategories(category);

    onGradeUpdate(
      effectiveName,
      effectiveCustomName,
      updatedGrades,
      total,
      comment,
      categories
    );
  };

  const handleAiButtonClick = () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error("Participant has not completed the task");

    if (aiButtonDisabled) return toast.error("Wait 1 second");

    setAiButtonDisabled(true);
    setTimeout(() => {
      setAiButtonDisabled(false);
    }, 1000);

    handleGetGrade();
  };

  const handleCopyComments = () => {
    if (!effectiveName)
      return toast.error("Participant has not completed the task");
    if (rubric === "" || effectiveText === "") {
      return toast.error(
        "Press the download button to fetch this student's data."
      );
    }

    let commentsText = "AI Grade based on the rubric set by the teacher:\n\n";
    rubric2.split("|;;|").forEach((element, index) => {
      const [rubricItem] = element.split("|:::|");
      commentsText += `${rubricItem}: ${
        justifications[index] ||
        "AI was not used in the grading process, and there is no description to give"
      }\n\n`;
    });

    commentsText += `\n\nThis is NOT your final grade, as there WILL be manual review by the teacher, and AI may make mistakes initially.\n\n`;

    navigator.clipboard
      .writeText(commentsText)
      .then(() => {
        toast.success("Comments copied to clipboard");
      })
      .catch((error) => {
        console.error("Error copying comments:", error);
        toast.error("Failed to copy comments");
      });
  };

  const handleEmailButtonClick = () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error("Participant has not completed the task");

    const studentName = effectiveName;
    let breakdown = "";
    if (rubric2 !== "" && effectiveText !== "") {
      rubric2.split("|;;|").forEach((element, index) => {
        const [rubricItem] = element.split("|:::|");
        const grade = grades[index] !== undefined ? grades[index] : "N/A";
        breakdown += `${rubricItem}: ${grade}\n`;
      });
    }
    const autoEmail = `Hello ${studentName},

Your exam response has been assigned a grade by your teacher.

Your question was: ${effectiveQuestion}

Your answer was transcribed as: ${effectiveText}

The above transcription may be innaccurate, but the grade is most likely based on the audio of your response.

Here's a breakdown of your grade:
${breakdown}
Total Score: ${totalScore}${
      comment && comment !== ""
        ? `
  
Teacher's Comment: ${comment}`
        : ""
    }`;

    onShowEmailModal({
      studentName: effectiveName,
      emailBody: autoEmail,
      code: effectiveCode,
      includeResponseLink: true,
      emailSubject: "SpeakEval Exam Result",
    });
  };

  const updateEmailBodyWithLink = (includeLink) => {
    const updatedBody = baseEmailBody;
    setEmailBody(updatedBody);
  };

  const handleSendEmail = async () => {
    try {
      const queryParams = new URLSearchParams({
        message: emailBody,
        code: effectiveCode,
        participant: effectiveName,
        subject: emailSubject,
        pin: localStorage.getItem("token"),
      });
      queryParams.append("link", includeResponseLink);
      const response = await fetch(
        `https://www.server.speakeval.org/send_email?${queryParams.toString()}`
      );
      const resp = await response.json();
      if (resp.success) {
        toast.success("Email sent successfully");
        setShowEmailModal(false);
        isRed = false;
      } else {
        toast.error(resp.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error sending email");
    }
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
    onGradeUpdate(
      effectiveName,
      effectiveCustomName,
      grades,
      totalScore,
      newComment,
      categories
    );
  };

  if (downloadMode && !downloadedData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const hasCheated = cheatingData && cheatingData.length > 0;

  // Group cheating incidents by type for the tooltip
  const cheatingIncidents = hasCheated
    ? cheatingData.reduce((acc, incident) => {
        if (!acc[incident.message]) {
          acc[incident.message] = 0;
        }
        acc[incident.message]++;
        return acc;
      }, {})
    : {};

  return (
    <div className="relative">
      <style jsx>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
            background-color: #38a169;
          }
          5% {
            transform: translateX(-4px);
            background-color: #598658;
          }
          10% {
            transform: translateX(4px);
            background-color: #7a6b46;
          }
          15% {
            transform: translateX(-4px);
            background-color: #9c5135;
          }
          20% {
            transform: translateX(4px);
            background-color: #bd3623;
          }
          25% {
            transform: translateX(-4px);
            background-color: #de1b12;
          }
          30% {
            transform: translateX(4px);
            background-color: #ff0000;
          }
          35% {
            transform: translateX(-2px);
            background-color: #ff0000;
          }
          40% {
            transform: translateX(2px);
            background-color: #ff0000;
          }
          45% {
            transform: translateX(-1px);
            background-color: #ff0000;
          }
          50% {
            transform: translateX(1px);
            background-color: #ff0000;
          }
          55% {
            transform: translateX(0);
            background-color: #ff0000;
          }
          100% {
            transform: translateX(0);
            background-color: #ff0000;
          }
        }
        .shake {
          animation: shake 1s;
        }
        .profile-card {
          transition: transform 0.3s ease-in-out;
        }
        .profile-card:hover {
          transform: translateY(-5px);
          z-index: 10;
        }
      `}</style>
      <div className="profile-card relative">
        <div
          className={`relative flex flex-col items-start p-6 h-auto max-w-[400px] rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 m-2 ${
            completed ? "" : "text-red-400"
          } ${
            isRed ? "border-2 border-red-500" : ""
          } shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30`}
        >
          {/* Cheating indicator and button - Now inside the card that gets the hover effect */}
          {hasCheated && (
            <>
              {/* Cheating indicator */}
              <div className="absolute top-[5px] right-2 z-11">
                <div className="group">
                  <FaExclamationTriangle className="text-red-500 text-xl animate-pulse" />
                  <div className="absolute hidden group-hover:block right-0 w-64 p-2 mt-2 bg-black/90 text-white text-sm rounded-md border border-red-500 z-20">
                    <p className="font-bold text-red-400 mb-1">
                      Cheating Detected:
                    </p>
                    <ul className="list-disc pl-4">
                      {Object.entries(cheatingIncidents).map(
                        ([type, count], index) => (
                          <li key={index}>
                            {type} ({count}x)
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* View Infractions button */}
              <div className="absolute top-20 right-6 z-10">
                <button
                  onClick={() => onShowInfractionsModal({ cheatingData, name })}
                  className="ml-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs rounded-md shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 flex items-center"
                >
                  <FaInfoCircle className="mr-1.5" /> View Infractions
                </button>
              </div>
            </>
          )}
          <div className="flex items-center w-full mb-4">
            <span
              className={`mr-2 text-2xl font-bold truncate bg-clip-text text-transparent bg-gradient-to-r ${
                hasCheated
                  ? "from-red-400 to-red-600"
                  : "from-cyan-400 to-blue-500"
              } ${isRed ? "text-red-500" : ""}`}
            >
              {effectiveCustomName || effectiveName}
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-md shadow-blue-500/50"
                onClick={handleDownload}
              >
                <FaDownload />
              </button>
              <button
                className={`p-2 ${
                  error
                    ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shake"
                    : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                } text-white rounded-full transition-all duration-300 shadow-md shadow-green-500/50`}
                onClick={handlePlay}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : isPlaying ? (
                  <FaPause />
                ) : (
                  <FaPlay />
                )}
              </button>
              {!downloadMode && (
                <>
                  <button
                    className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md shadow-purple-500/50"
                    onClick={handleAiButtonClick}
                  >
                    <FaRobot />
                  </button>
                  <button
                    className={
                      info.email
                        ? "p-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-md shadow-cyan-500/50 relative"
                        : "p-2 bg-slate-400 text-slate-600 rounded-full transition-all duration-300 shadow-inner relative cursor-not-allowed"
                    }
                    onClick={handleEmailButtonClick}
                    disabled={!info.email}
                    title={info.email ? "Send Email" : "Email not available"}
                  >
                    <FaEnvelope />
                    {isRed && info.email && (
                      <span className="absolute top-1 right-1 translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        !
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <button
              className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors duration-300"
              onClick={handlePlayQuestion}
            >
              Play Question
            </button>
          </div>

          <div className="mt-4"></div>

          <div className="w-full space-y-4">
            <div className="p-3 bg-gray-800 rounded-lg shadow-inner">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">
                Question:
              </h3>
              <p className="text-gray-300 break-words">{effectiveQuestion}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg shadow-inner">
              <h3 className="text-lg font-semibold text-cyan-300 mb-2">
                Answer:
              </h3>
              <p className="text-gray-300 break-words">{effectiveText}</p>
            </div>
          </div>

          {!downloadMode && (
            <>
              <div className="mt-2 text-gray-300 break-words">
                {rubric2 !== "" &&
                  effectiveText !== "" &&
                  rubric2.split("|;;|").map((element, idx) => {
                    const [rubricItem] = element.split("|:::|");
                    return (
                      <div key={idx} className="flex items-center relative">
                        <span className="mr-2">{rubricItem}</span>
                        <input
                          type="text"
                          className="bg-gray-800 border border-cyan-500/30 px-2 py-1 rounded w-20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                          placeholder="Points"
                          value={grades[idx] || ""}
                          onChange={(e) =>
                            handleGradeChange(idx, e.target.value)
                          }
                        />
                        <div className="relative group flex items-center">
                          <FaInfoCircle className="ml-2 text-blue-500" />
                          <div className="absolute left-full ml-0 w-64 p-2 bg-gray-700 text-white text-sm rounded hidden group-hover:block z-[100000000000]">
                            {justifications[idx]
                              ? justifications[idx]
                              : "Press the AI button to receive an automated grade and view the reason here."}
                          </div>
                        </div>
                        <div className="h-10"></div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-2 text-gray-300">
                {rubric !== "" &&
                  effectiveText !== "" &&
                  `Total Score: ${totalScore}`}
              </div>
              <div className="flex justify-center mt-2 mb-2">
                <button
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                  onClick={handleCopyComments}
                >
                  <FaClipboard className="mr-2" /> Copy AI Comments
                </button>
              </div>

              <div className="mt-4 w-full">
                <textarea
                  className="w-full p-2 bg-gray-800 border border-cyan-500/30 rounded resize-none text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                  rows="4"
                  placeholder="Add your comment here..."
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>
            </>
          )}

          <audio id={`answerAudioPlayer-${effectiveName}-${effectiveCode}`} />
          <audio id={`questionAudioPlayer-${effectiveName}-${effectiveCode}`} />
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
