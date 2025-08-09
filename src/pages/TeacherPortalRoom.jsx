"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ProfileCard from "../components/StatsCard";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import {
  FaArrowUp,
  FaArrowDown,
  FaEnvelope,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import urlCache from "../utils/urlCache";

function TeacherPortalRoom({ initialRoomCode, pin }) {
  const { roomCode: paramRoomCode } = useParams();
  const [roomCode, setRoomCode] = useState(initialRoomCode || paramRoomCode);
  const [participants, setParticipants] = useState([]);
  const [gradesReport, setGradesReport] = useState("");
  const [reportOption, setReportOption] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showByPerson, setShowByPerson] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [rubricContent, setRubricContent] = useState(null);
  const [rubric, setRubric] = useState("");
  const [rubric2, setRubric2] = useState("");
  const [pointValues, setPointValues] = useState([1, 2, 3, 4, 5]);
  const [fetched, setFetched] = useState(false);
  const [showDisplayNameInput, setShowDisplayNameInput] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nextRoomCode, setNextRoomCode] = useState(null);
  const [previousRoomCode, setPreviousRoomCode] = useState(null);
  const [failedEmails, setFailedEmails] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [descriptions, setDescriptions] = useState(() => {
    const savedDescriptions = localStorage.getItem("descriptions");
    return savedDescriptions ? JSON.parse(savedDescriptions) : [];
  });
  const [info, setInfo] = useState({});
  const [questionData, setQuestionData] = useState({
    currentIndex: 1,
    totalQuestions: 0,
    questions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // SINGLE CENTRALIZED DATA STORE - EVERYTHING GOES HERE
  const [COMPLETE_DATA_STORE, setCOMPLETE_DATA_STORE] = useState({
    questions: [], // Array of question codes
    students: {}, // studentName -> complete student data across all questions
    questionDetails: {}, // questionCode -> question metadata
    cheatingData: {}, // questionCode -> array of cheaters
    rubricData: null,
    isFullyLoaded: false,
  });

  const displayNameInputRef = useRef(null);

  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [selectedQuestionsToEmail, setSelectedQuestionsToEmail] = useState(
    new Set()
  );
  const [includeResponseLink, setIncludeResponseLink] = useState(true);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [emailSubject, setEmailSubject] = useState("SpeakEval Exam Results");
  const [isEmailSending, setIsEmailSending] = useState(false);

  const [showSingleEmailModal, setShowSingleEmailModal] = useState(false);
  const [singleEmailData, setSingleEmailData] = useState({
    studentName: "",
    emailBody: "",
    code: "",
    includeResponseLink: true,
    emailSubject: "SpeakEval Exam Result",
  });
  const [showInfractionsModal, setShowInfractionsModal] = useState(false);
  const [cheatingData, setCheatingData] = useState({});

  useEffect(() => {
    localStorage.setItem("descriptions", JSON.stringify(descriptions));
  }, [descriptions]);

  // Main initialization effect - fetch ALL data upfront (only once per exam)
  useEffect(() => {
    const baseCode = roomCode.toString().slice(0, -3);

    // Only fetch if we haven't loaded this exam yet
    if (!hasInitiallyLoaded) {
      const initializeCompleteDataStore = async () => {
        setIsInitialLoading(true);
        try {
          await fetchCompleteExamData();
          setHasInitiallyLoaded(true);
        } catch (error) {
          console.error("Error during initialization:", error);
          toast.error("Error initializing data");
          setIsInitialLoading(false);
        }
      };

      initializeCompleteDataStore();
    }
  }, [hasInitiallyLoaded]);

  // Update participants when data store changes or view mode changes
  useEffect(() => {
    if (COMPLETE_DATA_STORE.isFullyLoaded) {
      organizeParticipantsFromCompleteStore();
    }
  }, [COMPLETE_DATA_STORE, showByPerson, roomCode]);

  useEffect(() => {
    if (showBulkEmailModal || showSingleEmailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showBulkEmailModal, showSingleEmailModal]);

  // FETCH ALL DATA AND POPULATE COMPLETE STORE
  const fetchCompleteExamData = async () => {
    try {
      console.log("🚀 Starting complete data fetch");

      // Step 1: Get total questions
      const originalRoomCode = initialRoomCode || paramRoomCode;
      const questionsResponse = await fetch(
        `https://www.server.speakeval.org/get_num_questions?code=${originalRoomCode}&token=${localStorage.getItem(
          "token"
        )}`
      );
      const questionsData = await questionsResponse.json();

      if (questionsData.error) {
        toast.error(questionsData.error);
        return;
      }

      const baseCode = originalRoomCode.toString().slice(0, -3);
      const questionCodes = Array.from(
        { length: questionsData.questions },
        (_, i) =>
          Number.parseInt(baseCode + (i + 1).toString().padStart(3, "0"))
      );

      console.log("📋 Found", questionCodes.length, "questions");
      console.log("🔍 Question codes:", questionCodes);

      // Step 2: Fetch ALL question data in parallel
      let completedRequests = 0;
      const totalRequests = questionCodes.length * 2;

      const allResults = [];
      for (let i = 0; i < questionCodes.length; i++) {
        const questionCode = questionCodes[i];
        try {
          const dataResponse = await fetch(
            `https://www.server.speakeval.org/downloadall?code=${questionCode}&token=${localStorage.getItem(
              "token"
            )}`,
            {
              headers: {
                "Cache-Control": "no-store",
                Pragma: "no-cache",
                Expires: "0",
              },
            }
          );
          let dataResponseJson = await dataResponse.json();
          if (dataResponseJson.error) {
            toast.error(dataResponseJson.error);
            continue;
          }
          if (("" + questionCode).slice(-3) === "001") {
            setInfo(dataResponseJson.info || {});
            console.log("Info: ", dataResponseJson.info);
          }
          // if (!config.name) {
          //   console.log("Fetching config for question:", dataResponseJson);
          //   let configResponse = await fetch(
          //     `https://www.server.speakeval.org/getconfig?name=${
          //       dataResponseJson.config
          //     }&pin=${localStorage.getItem("token")}`
          //   );
          //   let configData = await configResponse.json();
          //   if (configData.error) {
          //     toast.error(configData.error);
          //   }
          //   setConfig(configData);
          //   // console.log(
          //   //   "Config loaded: " +
          //   //     JSON.stringify(configData) +
          //   //     " Question Code: " +
          //   //     questionCode
          //   // );
          // }
          const cheatersResponse = await fetch(
            `https://www.server.speakeval.org/get_cheaters?token=${localStorage.getItem(
              "token"
            )}&code=${questionCode}`
          );

          const [data, cheatersData] = await Promise.all([
            dataResponseJson,
            cheatersResponse.json(),
          ]);

          completedRequests += 2;
          console.log(
            `📦 Progress: ${completedRequests}/${totalRequests} requests completed`
          );

          allResults.push({
            questionCode,
            data: data.error ? null : data,
            cheaters: cheatersData.cheaters || [],
          });
        } catch (error) {
          console.error(
            `❌ Error fetching data for question ${questionCode}:`,
            error
          );
          completedRequests += 2;
          allResults.push({
            questionCode,
            data: null,
            cheaters: [],
          });
        }
      }
      console.log("✅ All data fetched, building store...");
      console.log("📊 Total requests completed:", allResults);

      // Step 3: Build the complete data store
      const completeStore = {
        questions: questionCodes,
        students: {},
        questionDetails: {},
        cheatingData: {},
        rubricData: null,
        isFullyLoaded: false,
      };

      // Process each question's data
      allResults.forEach(({ questionCode, data, cheaters }) => {
        completeStore.cheatingData[questionCode] = cheaters;

        if (data && data.participants) {
          completeStore.questionDetails[questionCode] = {
            questionText:
              data.participants[0]?.questionText || "No question available",
            question: data.participants[0]?.question || "",
            rubric: data.rubric,
            rubric2: data.rubric2,
          };

          if (!completeStore.rubricData && data.rubric) {
            let rubric2 = data.rubric;

            if (rubric2 && rubric2.includes("|^^^|")) {
              const pointValues = rubric2
                .split("|^^^|")[0]
                .split("|,,|")
                .map(Number);
              setPointValues(pointValues);
              rubric2 = rubric2.split("|^^^|")[1];
            }

            setRubric(data.rubric);
            setRubric2(rubric2);

            const [newCategories, newDescriptions] = rubric2
              ? [
                  rubric2
                    .split("|;;|")
                    .map((element) => element.split("|:::|")[0]),
                  rubric2
                    .split("|;;|")
                    .map((element) =>
                      element.split("|:::|")[1].replace("|,,,|", "\n\n")
                    ),
                ]
              : [[], []];

            setCategories(newCategories);
            setDescriptions(newDescriptions);

            completeStore.rubricData = {
              rubric: data.rubric,
              rubric2: rubric2,
              categories: newCategories,
              descriptions: newDescriptions,
              pointValues: pointValues,
            };
          }

          data.participants.forEach((participant) => {
            const studentName = participant.name;

            if (!completeStore.students[studentName]) {
              completeStore.students[studentName] = {
                name: studentName,
                responses: {},
              };
            }

            completeStore.students[studentName].responses[questionCode] = {
              ...participant,
              questionCode: questionCode,
              studentName: studentName,
              cheatingData: cheaters.filter((c) => c.name === studentName),
            };
          });
        }
      });

      completeStore.isFullyLoaded = true;

      setQuestionData({
        currentIndex: Number.parseInt(originalRoomCode.toString().slice(-3)),
        totalQuestions: questionsData.questions,
        questions: questionCodes,
      });

      setCOMPLETE_DATA_STORE(completeStore);

      console.log(
        "✅ Complete data store ready with",
        Object.keys(completeStore.students).length,
        "students"
      );

      // Preload all audio URLs for better performance
      console.log("🚀 Preloading audio URLs for all students...");
      const preloadItems = [];

      Object.values(completeStore.students).forEach((student) => {
        Object.entries(student.responses).forEach(
          ([questionCode, response]) => {
            if (response.audio) {
              preloadItems.push({
                type: "student_audio",
                id: response.audio, // token
                index: null,
              });
            }
          }
        );
      });

      if (preloadItems.length > 0) {
        // Preload URLs in background (don't await to avoid blocking UI)
        urlCache
          .preloadUrls(preloadItems, async (item) => {
            const response = await fetch(
              `https://www.server.speakeval.org/fetch_audio?token=${item.id}`
            );
            const data = await response.json();

            if (data.audioUrl) {
              return data.audioUrl;
            } else if (data.audio) {
              // Handle Base64 fallback
              const audioData = Uint8Array.from(atob(data.audio), (c) =>
                c.charCodeAt(0)
              );
              const audioBlob = new Blob([audioData], { type: "audio/ogg" });
              return URL.createObjectURL(audioBlob);
            }
            throw new Error("No audio data received");
          })
          .then(() => {
            console.log(`✅ Preloaded ${preloadItems.length} audio URLs`);
          })
          .catch((error) => {
            console.warn("⚠️ Some URLs failed to preload:", error);
          });
      }

      setIsInitialLoading(false);
      setFetched(true);
    } catch (error) {
      console.error("💥 Error in fetchCompleteExamData:", error);
      toast.error("Error fetching exam data");
      setIsInitialLoading(false);
    }
  };

  // Organize participants from the complete data store
  const organizeParticipantsFromCompleteStore = () => {
    if (!COMPLETE_DATA_STORE.isFullyLoaded) {
      console.log("⏳ Data not fully loaded yet, skipping organization");
      return;
    }

    console.log(
      "🔄 Organizing participants, showByPerson:",
      showByPerson,
      "roomCode:",
      roomCode
    );

    if (showByPerson) {
      const organizedParticipants = Object.values(COMPLETE_DATA_STORE.students)
        .filter((student) => student.name && typeof student.name === "string") // Ensure valid name
        .map((student) => ({
          name: student.name,
          questionData: new Map(
            Object.entries(student.responses).map(
              ([questionCode, responseData]) => [
                Number.parseInt(questionCode),
                responseData,
              ]
            )
          ),
        }));

      console.log(
        "👥 Organized for Show by Person:",
        organizedParticipants.length,
        "students"
      );
      setParticipants(organizedParticipants);
    } else {
      // For non-showByPerson, organize per question
      const allQuestionParticipants = COMPLETE_DATA_STORE.questions.map(
        (questionCode) => ({
          questionCode,
          participants: Object.values(COMPLETE_DATA_STORE.students)
            .map((student) => student.responses[questionCode])
            .filter(
              (response) =>
                response && response.name && typeof response.name === "string"
            ) // Ensure valid response and name
            .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
        })
      );

      console.log(
        "📝 Organized for Show by Question:",
        allQuestionParticipants.length,
        "questions"
      );
      setParticipants(allQuestionParticipants);
    }
  };

  const handleNavigateQuestion = (direction) => {
    if (showByPerson) return;

    const currentIndex = questionData.currentIndex;
    const newIndex =
      direction === "next"
        ? Math.min(currentIndex + 1, questionData.totalQuestions)
        : Math.max(currentIndex - 1, 1);

    if (newIndex !== currentIndex) {
      const baseCode = roomCode.toString().slice(0, -3);
      const newCode = Number.parseInt(
        baseCode + newIndex.toString().padStart(3, "0")
      );
      setRoomCode(newCode);

      setQuestionData((prev) => ({
        ...prev,
        currentIndex: newIndex,
      }));
    } else {
      toast.warn(`No ${direction} question available.`);
    }
  };

  const toggleRubricModal = (rubric) => {
    setRubricContent(rubric2);
    setShowRubricModal(!showRubricModal);
  };

  const handleGradeUpdate = (
    participantName,
    customName,
    grades,
    totalScore,
    comment,
    categories,
    voiceComment
  ) => {
    const baseCode = roomCode.toString().slice(0, -3);
    const questionCode = customName
      ? Number.parseInt(
          baseCode + customName.substring(1).toString().padStart(3, "0")
        )
      : roomCode;

    setCOMPLETE_DATA_STORE((prevStore) => {
      const newStore = JSON.parse(JSON.stringify(prevStore)); // Deep copy to avoid mutation issues
      if (
        newStore.students[participantName] &&
        newStore.students[participantName].responses[questionCode]
      ) {
        newStore.students[participantName].responses[questionCode] = {
          ...newStore.students[participantName].responses[questionCode],
          grades,
          totalScore,
          teacherComment: comment,
          categories,
          voiceComment,
        };
      }
      return newStore;
    });
  };

  const sortParticipants = (participantsToSort) => {
    if (sortOption === "none" || !participantsToSort) {
      return participantsToSort || [];
    }
    return [...participantsToSort].sort((a, b) => {
      // Defensive check for undefined or non-string names
      const aName = a.name && typeof a.name === "string" ? a.name : "";
      const bName = b.name && typeof b.name === "string" ? b.name : "";

      if (sortOption === "name") {
        return sortOrder === "asc"
          ? aName.localeCompare(bName, undefined, { sensitivity: "base" })
          : bName.localeCompare(aName, undefined, { sensitivity: "base" });
      }
      if (sortOption === "lastName") {
        const aLastName =
          (aName.split(" ").length > 1
            ? aName.split(" ").slice(-1)[0] || ""
            : sortOrder === "asc"
            ? "zzzzzz"
            : "aaaaaa") +
          " " +
          aName;
        const bLastName =
          (bName.split(" ").length > 1
            ? bName.split(" ").slice(-1)[0] || ""
            : sortOrder === "asc"
            ? "zzzzzz"
            : "aaaaaa") +
          " " +
          bName;

        if (!aLastName && !bLastName) {
          return aName.localeCompare(bName, undefined, {
            sensitivity: "base",
          });
        }
        if (!aLastName) return 1;
        if (!bLastName) return -1;
        return sortOrder === "asc"
          ? aLastName.localeCompare(bLastName, undefined, {
              sensitivity: "base",
            })
          : bLastName.localeCompare(aLastName, undefined, {
              sensitivity: "base",
            });
      }
      if (sortOption === "totalScore") {
        return sortOrder === "asc"
          ? (a.totalScore || 0) - (b.totalScore || 0)
          : (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (sortOption.startsWith("category")) {
        const categoryIndex = Number.parseInt(sortOption.split("-")[1], 10);
        return sortOrder === "asc"
          ? (a.grades?.[categoryIndex] || 0) - (b.grades?.[categoryIndex] || 0)
          : (b.grades?.[categoryIndex] || 0) - (a.grades?.[categoryIndex] || 0);
      }
      return 0;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const handleDownloadReport = (reportOption) => {
    if (!participants.length) {
      toast.error("No data available for report generation.");
      return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Grading Report", 105, 15, null, null, "center");
    doc.setFontSize(12);

    let yOffset = 25;

    const maxNameLength = Math.max(
      ...(showByPerson
        ? participants.map((p) => (p.name || "").length)
        : participants.flatMap((q) =>
            q.participants.map((p) => (p.name || "").length)
          ))
    );
    const nameColumnWidth = Math.max(25, maxNameLength * 2.5);
    const startX = 15;
    const startY = yOffset;
    const pageWidth = doc.internal.pageSize.getWidth();
    const remainingWidth = pageWidth - startX - nameColumnWidth - 15;
    const cellWidth =
      remainingWidth / (showByPerson ? questionData.questions.length + 1 : 1);
    const cellHeight = 10;

    doc.setFont("helvetica", "bold");
    doc.text("Student", startX, startY + cellHeight / 2, {
      baseline: "middle",
    });
    if (showByPerson) {
      questionData.questions.forEach((_, qIndex) =>
        doc.text(
          `Q${qIndex + 1}`,
          startX + nameColumnWidth + (qIndex + 1) * cellWidth,
          startY + cellHeight / 2,
          {
            baseline: "middle",
            align: "center",
          }
        )
      );
    } else {
      doc.text(
        `Q${questionData.currentIndex}`,
        startX + nameColumnWidth + cellWidth,
        startY + cellHeight / 2,
        {
          baseline: "middle",
          align: "center",
        }
      );
    }
    if (showByPerson)
      doc.text(
        "Total",
        startX +
          nameColumnWidth +
          (showByPerson ? questionData.questions.length + 1 : 1) * cellWidth,
        startY + cellHeight / 2,
        { baseline: "middle", align: "center" }
      );

    doc.setFont("helvetica", "plain");
    if (showByPerson) {
      sortParticipants(participants).forEach((participant, pIndex) => {
        const y = startY + (pIndex + 1) * cellHeight;
        doc.text(participant.name || "Unknown", startX, y + cellHeight / 2, {
          baseline: "middle",
        });

        let totalScore = 0;
        questionData.questions.forEach((questionCode, qIndex) => {
          const questionDataEntry = participant.questionData
            ? participant.questionData.get(questionCode)
            : null;
          const score =
            questionDataEntry &&
            (questionDataEntry.totalScore || questionDataEntry.totalScore == 0)
              ? questionDataEntry.totalScore
              : "N/A";
          if (score > 0) totalScore += score;
          doc.text(
            `${score}`,
            startX + nameColumnWidth + (qIndex + 1) * cellWidth,
            y + cellHeight / 2,
            {
              baseline: "middle",
              align: "center",
            }
          );
        });
        doc.text(
          `${totalScore}`,
          startX +
            nameColumnWidth +
            (showByPerson ? questionData.questions.length + 1 : 1) * cellWidth,
          y + cellHeight / 2,
          { baseline: "middle", align: "center" }
        );
      });
    } else {
      const currentQuestion = participants.find(
        (q) => q.questionCode === roomCode
      );
      if (currentQuestion) {
        sortParticipants(currentQuestion.participants).forEach(
          (participant, pIndex) => {
            const y = startY + (pIndex + 1) * cellHeight;
            doc.text(
              participant.name || "Unknown",
              startX,
              y + cellHeight / 2,
              {
                baseline: "middle",
              }
            );
            const score =
              participant.totalScore || participant.totalScore == 0
                ? participant.totalScore
                : "N/A";
            doc.text(
              `${score}`,
              startX + nameColumnWidth + cellWidth,
              y + cellHeight / 2,
              {
                baseline: "middle",
                align: "center",
              }
            );
          }
        );
      }
    }

    yOffset += (participants.length + 1) * cellHeight + 10;
    doc.addPage();
    yOffset = 25;

    if (showByPerson) {
      sortParticipants(participants).forEach((participant, pIndex) => {
        doc.setFont("helvetica", "bold");
        doc.text(`Student: ${participant.name || "Unknown"}`, 15, yOffset);
        yOffset += 6;

        questionData.questions.forEach((questionCode, qIndex) => {
          const questionDataEntry = participant.questionData
            ? participant.questionData.get(questionCode)
            : null;

          if (questionDataEntry) {
            doc.setFont("helvetica", "normal");
            const questionText = `Q${qIndex + 1}: ${
              questionDataEntry.questionText || "No question available"
            }`;
            const wrappedQuestionText = doc.splitTextToSize(questionText, 180);
            doc.text(wrappedQuestionText, 15, yOffset);
            yOffset += wrappedQuestionText.length * 5;

            const splitText = doc.splitTextToSize(
              `Transcript: ${
                questionDataEntry.transcription || "No response available"
              }`,
              180
            );
            doc.text(splitText, 15, yOffset);
            yOffset += splitText.length * 5;

            doc.text(
              `Score: ${questionDataEntry.totalScore || "N/A"}`,
              15,
              yOffset
            );
            yOffset += 5;

            categories.forEach((category, cIndex) => {
              const score = questionDataEntry.grades?.[cIndex] ?? "N/A";
              doc.text(`${category}: ${score}`, 20, yOffset);
              yOffset += 4;
            });

            doc.text(
              `Teacher Comment: ${
                questionDataEntry.teacherComment || "No comment"
              }`,
              15,
              yOffset
            );
            yOffset += 6;

            if (yOffset > 270) {
              doc.addPage();
              yOffset = 25;
            }
          }
        });

        if (pIndex < participants.length - 1) {
          yOffset += 25;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 25;
          }
        }
      });
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(`Question #${questionData.currentIndex}`, 15, yOffset);
      yOffset += 8;

      const currentQuestion = participants.find(
        (q) => q.questionCode === roomCode
      );
      if (currentQuestion) {
        sortParticipants(currentQuestion.participants).forEach(
          (participant, index) => {
            doc.setFont("helvetica", "bold");
            doc.text(`Student: ${participant.name || "Unknown"}`, 15, yOffset);
            yOffset += 6;

            doc.setFont("helvetica", "normal");
            doc.text(
              `Score: ${
                participant.totalScore || participant.totalScore == 0
                  ? participant.totalScore
                  : "N/A"
              }`,
              15,
              yOffset
            );
            yOffset += 5;

            categories.forEach((category, cIndex) => {
              const score = participant.grades?.[cIndex] ?? "N/A";
              doc.text(`${category}: ${score}`, 20, yOffset);
              yOffset += 4;
            });

            doc.text(
              `Teacher Comment: ${participant.teacherComment || "No comment"}`,
              15,
              yOffset
            );
            yOffset += 6;

            if (
              yOffset > 270 &&
              index < currentQuestion.participants.length - 1
            ) {
              doc.addPage();
              yOffset = 25;
            }
          }
        );
      }
    }

    if (reportOption === "download") {
      doc.save("grading_report.pdf");
    } else if (reportOption === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      toast.error('Invalid choice. Please select "download" or "print".');
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedQuestionsToEmail.size === 0) {
      toast.error("Please select at least one question to send");
      return;
    }

    try {
      setIsEmailSending(true);
      setFailedEmails(new Set());
      const baseExamCode = roomCode.toString().slice(0, -3);

      const emailData = Object.values(COMPLETE_DATA_STORE.students)
        .filter((student) => student.name && typeof student.name === "string")
        .map((student) => ({
          studentName: student.name,
          grades: Array.from(selectedQuestionsToEmail)
            .map((questionCode) => {
              const questionData = student.responses[questionCode];
              if (questionData) {
                return {
                  questionNumber: Number.parseInt(
                    questionCode.toString().slice(-3)
                  ),
                  question:
                    questionData.questionText || "Question not available",
                  transcription:
                    questionData.transcription || "No transcription available",
                  totalScore: questionData.totalScore,
                  grades: questionData.grades,
                  categories: questionData.categories,
                  teacherComment: questionData.teacherComment,
                };
              }
              return null;
            })
            .filter(Boolean),
        }));

      const response = await fetch(
        "https://www.server.speakeval.org/send_bulk_email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examCode: baseExamCode,
            emailData,
            includeResponseLink,
            includeVoice,
            subject: emailSubject,
            pin: localStorage.getItem("token"),
          }),
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.results?.failed?.length > 0) {
        const failedStudents = new Set(
          data.results.failed.map((f) => f.student)
        );

        setFailedEmails((prevFailedEmails) => {
          const newFailedEmails = new Set(failedStudents);
          return newFailedEmails;
        });

        const errorToast = (
          <div>
            <div className="font-bold mb-2">Failed to send some emails:</div>
            <div className="max-h-32 overflow-y-auto">
              {data.results.failed.map((failure, idx) => (
                <div key={idx} className="text-sm">
                  {failure.student}: {failure.error}
                </div>
              ))}
            </div>
          </div>
        );

        toast.error(errorToast, {
          autoClose: 5000,
        });
      }

      if (data.summary.successful > 0) {
        toast.success(`Successfully sent ${data.summary.successful} emails`);
      }

      if (data.summary.successful === 0 && data.summary.failed === 0) {
        toast.warning("No emails were sent - no valid recipients found");
      }

      if (data.summary.failed === 0) {
        setShowBulkEmailModal(false);
        setSelectedQuestionsToEmail(new Set());
      }
      let uploadUrls = data.uploadUrls || [];
      let counter = 0;
      emailData.forEach(async (studentObj) => {
        console.log("Student:", studentObj.studentName);

        studentObj.grades.forEach(async (gradeObj) => {
          console.log("  AudioBlobl:", gradeObj.voiceComment);
          if (includeVoice) {
            let uploadUrl = uploadUrls[counter];
            let audioBlob = gradeObj.voiceComment;
            await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": "audio/wav" },
              body: audioBlob,
            });
          }
          counter++;
        });
      });
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error(`Failed to send emails: ${error.message}`);
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleEmailOptionChange = (option, value) => {
    if (option === "includeVoiceNote" && value) {
      // If "include voice note" is checked, force "include link" to be checked too.
      setSingleEmailData((prev) => ({
        ...prev,
        includeVoiceNote: true,
        includeResponseLink: true,
      }));
    } else if (option === "includeResponseLink" && !value) {
      // If "include link" is unchecked, force "include voice note" to be unchecked too.
      setSingleEmailData((prev) => ({
        ...prev,
        includeResponseLink: false,
        includeVoiceNote: false,
      }));
    } else {
      // Otherwise, just update the one that was changed.
      setSingleEmailData((prev) => ({
        ...prev,
        [option]: value,
      }));
    }
  };

  const handleShowSingleEmailModal = (emailData) => {
    setSingleEmailData(emailData);
    setShowSingleEmailModal(true);
  };

  const handleShowInfractionsModal = (data) => {
    console.log("🚨 Showing infractions modal for data:", data);
    setCheatingData(data);
    setShowInfractionsModal(true);
  };

  const handleSendSingleEmail = async () => {
    try {
      const queryParams = new URLSearchParams({
        message: singleEmailData.emailBody,
        code: singleEmailData.code,
        participant: singleEmailData.studentName,
        subject: singleEmailData.emailSubject,
        pin: localStorage.getItem("token"),
      });
      queryParams.append("link", singleEmailData.includeResponseLink);
      if (!singleEmailData.voiceCommentAudio) {
        singleEmailData.includeVoiceNote = false;
      }
      queryParams.append("voice", singleEmailData.includeVoiceNote);
      console.log("IncludeVoice is: ", singleEmailData.includeVoiceNote);
      const response = await fetch(
        `https://www.server.speakeval.org/send_email?${queryParams.toString()}`
      );
      const resp = await response.json();
      if (resp.resp.success) {
        if (singleEmailData.includeVoiceNote) {
          let uploadUrl = resp.uploadUrl;
          let audioBlob = singleEmailData.voiceCommentAudio;
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "audio/wav" },
            body: audioBlob,
          });
        }
        toast.success("Email sent successfully");
        setShowSingleEmailModal(false);
        setFailedEmails((prev) => {
          const newSet = new Set(prev);
          newSet.delete(singleEmailData.studentName);
          return newSet;
        });
      } else {
        toast.error(resp.resp.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error sending email");
    }
  };

  const handleNextQuestion = () => handleNavigateQuestion("next");
  const handlePreviousQuestion = () => handleNavigateQuestion("previous");

  const toggleViewMode = () => {
    const newShowByPerson = !showByPerson;
    setShowByPerson(newShowByPerson);

    if (newShowByPerson) {
      const baseCode = roomCode.toString().slice(0, -3);
      const firstQuestionCode = Number.parseInt(baseCode + "001");
      setRoomCode(firstQuestionCode);
      setQuestionData((prev) => ({
        ...prev,
        currentIndex: 1,
      }));
    }
  };

  const handleDisplayNameSubmit = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/add_display?code=${roomCode}&pin=${pin}&display=${displayName}`
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

  const getCheatingData = (participantName, questionCode) => {
    return (
      COMPLETE_DATA_STORE.cheatingData[questionCode]?.filter(
        (c) => c.name === participantName
      ) || []
    );
  };

  if (isInitialLoading || !COMPLETE_DATA_STORE.isFullyLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Loading Exam Data
          </h2>
          <p className="text-gray-300 text-lg">
            Preparing all questions and responses...
          </p>
          <div className="mt-6 w-64 mx-auto bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {showDisplayNameInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div
            ref={displayNameInputRef}
            className="relative overflow-hidden bg-black/60 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />
            <h2 className="text-2xl font-bold mb-6 text-center text-white">
              Rename this exam
            </h2>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
              placeholder="Enter display name"
            />
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={async () => {
                  await handleDisplayNameSubmit();
                  setShowDisplayNameInput(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDisplayNameInput(false)}
                className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!showDisplayNameInput && (
        <div
          className="relative flex flex-col items-center min-h-screen"
          style={{ fontFamily: "Montserrat" }}
        >
          <div className="w-full px-6 py-4 bg-black/40 backdrop-blur-md border-b border-cyan-500/30">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
              >
                {showByPerson ? "Show by Question" : "Show by Person"}
              </button>

              <button
                onClick={toggleSortOrder}
                className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
              >
                {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
              </button>
              <select
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="none">None</option>
                <option value="name">Sort by Name</option>
                <option value="lastName">Sort by Last Name</option>
              </select>

              <button
                onClick={() => setShowDisplayNameInput(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
              >
                Set Display Name
              </button>
              <button
                onClick={() => setShowRubricModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
              >
                Show Rubric
              </button>
              <select
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 cursor-pointer"
                value={reportOption}
                onChange={(e) => {
                  handleDownloadReport(e.target.value);
                }}
              >
                <option value="">Grade Report</option>
                <option value="download">Download</option>
                <option value="print">Print</option>
              </select>
              <button
                onClick={async () => {
                  setShowBulkEmailModal(true);
                }}
                className={`${
                  info.email
                    ? "px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 flex items-center"
                    : "px-4 py-2 bg-slate-400 text-slate-600 rounded-lg shadow-inner cursor-not-allowed transition-all duration-300 flex items-center"
                }`}
                disabled={isEmailSending || !info.email}
              >
                <FaEnvelope className="mr-2" />
                {isEmailSending ? "Sending..." : "Send Emails"}
              </button>
            </div>
          </div>

          <div className="w-full text-center py-12">
            <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              Grading: {roomCode.toString().slice(0, -3)} (Question #
              {questionData.currentIndex})
            </h1>
            {!showByPerson && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleNavigateQuestion("previous")}
                  disabled={questionData.currentIndex === 1}
                  className={`px-6 py-2 rounded-lg shadow-lg transition-all duration-300 ${
                    questionData.currentIndex === 1
                      ? "bg-gray-600/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  }`}
                >
                  Previous Question
                </button>
                <button
                  onClick={() => handleNavigateQuestion("next")}
                  disabled={
                    questionData.currentIndex === questionData.totalQuestions
                  }
                  className={`px-6 py-2 rounded-lg shadow-lg transition-all duration-300 ${
                    questionData.currentIndex === questionData.totalQuestions
                      ? "bg-gray-600/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  }`}
                >
                  Next Question
                </button>
              </div>
            )}
          </div>

          <div className="w-full px-6 pb-12">
            {showByPerson ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-xl">
                  <thead>
                    <tr className="border-b border-cyan-500/30">
                      <th className="py-4 px-6 text-left text-sm font-semibold text-white">
                        Student
                      </th>
                      {questionData.questions.map((_, index) => (
                        <th
                          key={index}
                          className="py-4 px-6 text-left text-sm font-semibold text-white"
                        >
                          Question {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortParticipants(participants).map(
                      (participant, index) => (
                        <tr key={index} className="border-b border-cyan-500/10">
                          <td className="py-4 px-6 text-white align-top">
                            {participant.name || "Unknown"}
                          </td>
                          {questionData.questions.map(
                            (questionCode, qIndex) => {
                              const responseData = participant.questionData
                                ? participant.questionData.get(questionCode)
                                : null;
                              const cheatingData = getCheatingData(
                                participant.name,
                                questionCode
                              );

                              return (
                                <td key={qIndex} className="py-4 px-6">
                                  {responseData ? (
                                    <ProfileCard
                                      text={responseData.transcription}
                                      rubric={rubric}
                                      rubric2={rubric2}
                                      audio={responseData.audio}
                                      question={responseData.questionText}
                                      questionBase64={responseData.question}
                                      questionAudioUrl={
                                        responseData.questionAudioUrl
                                      }
                                      index={responseData.index}
                                      name={participant.name}
                                      code={questionCode}
                                      onGradeUpdate={handleGradeUpdate}
                                      customName={`Q${qIndex + 1}`}
                                      isRed={failedEmails.has(participant.name)}
                                      onShowEmailModal={
                                        handleShowSingleEmailModal
                                      }
                                      onShowInfractionsModal={
                                        handleShowInfractionsModal
                                      }
                                      cheatingData={cheatingData}
                                      info={info}
                                      voiceComment={responseData.voiceComment}
                                      className=""
                                    />
                                  ) : (
                                    <div className="text-gray-400">
                                      No submission
                                    </div>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {participants.map((question, qIndex) => (
                  <div
                    key={question.questionCode}
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
                      question.questionCode === roomCode ? "block" : "hidden"
                    }`}
                  >
                    {sortParticipants(question.participants).map(
                      (participant, index) => {
                        const cheatingData = getCheatingData(
                          participant.name,
                          question.questionCode
                        );
                        return (
                          <ProfileCard
                            key={`${question.questionCode}-${
                              participant.name || "unknown"
                            }`}
                            text={participant.transcription}
                            rubric={rubric}
                            rubric2={rubric2}
                            audio={participant.audio}
                            question={participant.questionText}
                            questionBase64={participant.question}
                            questionAudioUrl={participant.questionAudioUrl}
                            index={participant.index}
                            name={participant.name || "Unknown"}
                            code={question.questionCode}
                            onGradeUpdate={handleGradeUpdate}
                            isRed={failedEmails.has(participant.name)}
                            onShowEmailModal={handleShowSingleEmailModal}
                            onShowInfractionsModal={handleShowInfractionsModal}
                            cheatingData={cheatingData}
                            voiceComment={participant.voiceComment}
                            info={info}
                          />
                        );
                      }
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showRubricModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative bg-black/60 rounded-2xl p-8 shadow-xl border border-cyan-500/30 w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none rounded-2xl" />
            <h2 className="text-2xl font-bold mb-6 text-white relative z-10">
              Rubric
            </h2>
            {participants.length > 0 ? (
              <div className="relative z-10 overflow-x-auto">
                <table className="min-w-full border border-cyan-500/30 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-cyan-500/10">
                      <th className="py-3 px-4 border-b border-cyan-500/30 text-white">
                        Category
                      </th>
                      {pointValues.map((value, index) => (
                        <th
                          key={index}
                          className="py-3 px-4 border-b border-cyan-500/30 text-white"
                        >
                          {value}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => {
                      const descriptionParts = descriptions[index]
                        ? descriptions[index].split("|,,|")
                        : [];
                      return (
                        <tr key={index} className="border-b border-cyan-500/30">
                          <td className="py-3 px-4 text-white">{category}</td>
                          {descriptionParts.map((part, partIndex) => (
                            <td
                              key={partIndex}
                              className="py-3 px-4 text-gray-300"
                            >
                              {part || "No description available"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white relative z-10">No rubric available.</p>
            )}
            <button
              onClick={() => setShowRubricModal(false)}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 relative z-10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative bg-black/60 rounded-2xl p-8 shadow-xl border border-cyan-500/30 w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none rounded-2xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 text-white">
                Send Grade Emails
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Select Questions to Include:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-cyan-500/30 rounded-lg p-4 bg-black/30">
                  {showByPerson ? (
                    questionData.questions.map((questionCode, index) => {
                      const isGraded = participants.some((p) => {
                        const qData = p.questionData?.get(questionCode);
                        return qData?.totalScore !== undefined;
                      });

                      return (
                        <div
                          key={questionCode}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="checkbox"
                            id={`question-${questionCode}`}
                            checked={selectedQuestionsToEmail.has(questionCode)}
                            onChange={(e) => {
                              const newSelected = new Set(
                                selectedQuestionsToEmail
                              );
                              if (e.target.checked) {
                                newSelected.add(questionCode);
                              } else {
                                newSelected.delete(questionCode);
                              }
                              setSelectedQuestionsToEmail(newSelected);
                            }}
                            className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                          />
                          <label
                            htmlFor={`question-${questionCode}`}
                            className="text-white"
                          >
                            Question {index + 1}
                            <span
                              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                isGraded
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {isGraded ? "Graded" : "Not Graded"}
                            </span>
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`question-${roomCode}`}
                        checked={selectedQuestionsToEmail.has(roomCode)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedQuestionsToEmail);
                          if (e.target.checked) {
                            newSelected.add(roomCode);
                          } else {
                            newSelected.delete(roomCode);
                          }
                          setSelectedQuestionsToEmail(newSelected);
                        }}
                        className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label
                        htmlFor={`question-${roomCode}`}
                        className="text-white"
                      >
                        Current Question (#{questionData.currentIndex})
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            participants
                              .find((q) => q.questionCode === roomCode)
                              ?.participants.some(
                                (p) => p.totalScore !== undefined
                              )
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          }`}
                        >
                          {participants
                            .find((q) => q.questionCode === roomCode)
                            ?.participants.some(
                              (p) => p.totalScore !== undefined
                            )
                            ? "Graded"
                            : "Not Graded"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeResponseLink}
                    onChange={(e) => setIncludeResponseLink(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-white">
                    Include links for students to review their responses
                  </span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeVoice}
                    onChange={(e) => setIncludeVoice(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-sm text-white">
                    Include the Voice Comments
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowBulkEmailModal(false);
                    setSelectedQuestionsToEmail(new Set());
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
                  disabled={isEmailSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkEmail}
                  className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 flex items-center ${
                    isEmailSending ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Emails"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSingleEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 w-11/12 md:w-1/2 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Edit Email</h2>
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-300">
                Email Subject
              </label>
              <input
                type="text"
                className="w-full p-2 border border-cyan-500/30 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                value={singleEmailData.emailSubject}
                onChange={(e) =>
                  setSingleEmailData({
                    ...singleEmailData,
                    emailSubject: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-4">
              <textarea
                className="w-full h-40 p-2 border border-cyan-500/30 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                value={singleEmailData.emailBody}
                onChange={(e) =>
                  setSingleEmailData({
                    ...singleEmailData,
                    emailBody: e.target.value,
                  })
                }
              />
            </div>

            {/* Checkbox section with new logic */}
            <div className="mb-4 space-y-3">
              <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleEmailData.includeResponseLink || false}
                  onChange={(e) =>
                    handleEmailOptionChange(
                      "includeResponseLink",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span>
                  Include a link for the student to view their response
                </span>
              </label>

              {/* Conditionally render the voice note option only if one exists */}
              {singleEmailData.voiceCommentAudio && (
                <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleEmailData.includeVoiceNote || false}
                    onChange={(e) =>
                      handleEmailOptionChange(
                        "includeVoiceNote",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-cyan-500/50 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span>Include the teacher's voice note comment</span>
                </label>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 mr-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-300"
                onClick={() => setShowSingleEmailModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
                onClick={handleSendSingleEmail}
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
      {showInfractionsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-black/60k/60 rounded-2xl p-8 shadow-xl border border-red-500/70 w-11/12 md:w-1/2 max-w-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10 pointer-events-none rounded-2xl" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-2" />
                Cheating Infractions: {cheatingData.name}
              </h2>
              <button
                onClick={() => setShowInfractionsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-white">
                <thead className="bg-gray-800 text-gray-300 text-sm uppercase">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {cheatingData.cheatingData.map((infraction, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "bg-gray-800/50" : "bg-gray-900/50"
                      }
                    >
                      <td className="py-3 px-4 border-t border-gray-700">
                        {infraction.message}
                      </td>
                      <td className="py-3 px-4 border-t border-gray-700">
                        {new Date(infraction.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfractionsModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherPortalRoom;
