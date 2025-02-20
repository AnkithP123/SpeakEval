import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay, FaPause, FaRobot, FaInfoCircle, FaClipboard, FaSpinner, FaEnvelope } from 'react-icons/fa';

function ProfileCard({ text, rubric, rubric2, audio, question, index, questionBase64, name, code, onGradeUpdate, customName, tokenProvided = false, participantPass = null }) {
  // States used in both modes
  const [completed, setCompleted] = useState(false);
  const [aiButtonDisabled, setAiButtonDisabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [grades, setGrades] = useState({});
  const [justifications, setJustifications] = useState({});
  const [categories, setCategories] = useState([]);

  // New state for download mode
  const [downloadMode, setDownloadMode] = useState(false);
  const [downloadedData, setDownloadedData] = useState(null);

  // Email modal states (unused in download mode)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [baseEmailBody, setBaseEmailBody] = useState('');
  const [includeResponseLink, setIncludeResponseLink] = useState(false);



  // Check if URL has a "token" param, then fetch from /download
  useEffect(() => {
    if(tokenProvided) {
      setDownloadMode(true);
      const participant = participantPass;
      participant.questionBase64 = participant.question;
      participant.question = participant.questionText;
      participant.text = participant.transcription;
      setDownloadedData(participant);
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setDownloadMode(true);
      fetch(`https://www.server.speakeval.org/download?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          // Assuming data contains: { name, text, audio, question, code }
          const participant = data.participant;
          participant.questionBase64 = participant.question;
          participant.question = participant.questionText;
          participant.text = participant.transcription;
          setDownloadedData(participant);
        })
        .catch((error) => {
          console.error('Error fetching download data:', error);
          toast.error('Failed to download data');
        });
    }
  }, []);

  // Derive effective values using downloadedData if in downloadMode
  const effectiveName = downloadMode && downloadedData ? downloadedData.name : name;
  const effectiveText = downloadMode && downloadedData ? downloadedData.text : text;
  const effectiveAudio = downloadMode && downloadedData ? downloadedData.audio : audio;
  const effectiveQuestion = downloadMode && downloadedData ? downloadedData.question : question;
  const effectiveCode = downloadMode && downloadedData ? downloadedData.code : code;
  const effectiveCustomName = downloadMode && downloadedData ? downloadedData.customName : customName;
  const effectiveQuestionBase64 = downloadMode && downloadedData ? downloadedData.questionBase64 : questionBase64;

  useEffect(() => {
    if (effectiveName) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [effectiveName]);

  let fetchAudio;

  useEffect(() => {
    fetchAudio = async () => {
      try {
        const audioData = Uint8Array.from(atob(effectiveAudio), c => c.charCodeAt(0));
        let audioBlob = new Blob([audioData], { type: 'audio/ogg' });

        try {
          const wavBlob = await convertOggToWav(audioBlob);
          const audioUrl = URL.createObjectURL(wavBlob);
          const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${effectiveName}-${effectiveCode}`);
          if (answerAudioPlayer) {
            answerAudioPlayer.src = audioUrl;
          }
        } catch (err) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${effectiveName}-${effectiveCode}`);
          if (answerAudioPlayer) {
            answerAudioPlayer.src = audioUrl;
          }
        }
      } catch (error) {
        console.log('Error loading audio:', error);
        console.log(effectiveName);
      }
    };

    fetchAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAudio]);

  async function convertOggToWav(oggBlob) {
    const arrayBuffer = await oggBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    writeString(view, offset, 'RIFF'); offset += 4;
    // File length
    view.setUint32(offset, 36 + audioBuffer.length * numberOfChannels * 2, true); offset += 4;
    // RIFF type
    writeString(view, offset, 'WAVE'); offset += 4;
    // Format chunk identifier
    writeString(view, offset, 'fmt '); offset += 4;
    // Format chunk length
    view.setUint32(offset, 16, true); offset += 4;
    // Sample format (raw)
    view.setUint16(offset, 1, true); offset += 2;
    // Channel count
    view.setUint16(offset, numberOfChannels, true); offset += 2;
    // Sample rate
    view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4;
    // Byte rate
    view.setUint32(offset, audioBuffer.sampleRate * numberOfChannels * 2, true); offset += 4;
    // Block align
    view.setUint16(offset, numberOfChannels * 2, true); offset += 2;
    // Bits per sample
    view.setUint16(offset, 16, true); offset += 2;
    // Data chunk identifier
    writeString(view, offset, 'data'); offset += 4;
    // Data chunk length
    view.setUint32(offset, audioBuffer.length * numberOfChannels * 2, true); offset += 4;

    // Write interleaved data
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  const handlePlay = async () => {
    if (!effectiveName)
      return toast.error('Participant has not completed the task');
    if (effectiveText === '' && !downloadMode) {
      // await fetchAudioData();
    }
    try {
      setIsLoading(true);
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${effectiveName}-${effectiveCode}`);
      if (answerAudioPlayer && answerAudioPlayer.src) {
        if (isPlaying) {
          await answerAudioPlayer.pause();
          setIsPlaying(false);
        } else {
          await answerAudioPlayer.play();
          setIsLoading(false);
          setIsPlaying(true);
          answerAudioPlayer.addEventListener('ended', () => {
            setIsPlaying(false);
          });
        }
      } else {
        await fetchAudio();
      }
    } catch (error) {
      console.error('Error playing answer audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!effectiveName)
      return toast.error('Participant has not completed the task');
    const audioData = Uint8Array.from(atob(effectiveAudio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioData], { type: 'audio/ogg' });

    const a = document.createElement('a');

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
      return toast.error('Participant has not completed the task');
    try {
      if (effectiveQuestionBase64) {
        const audioData = Uint8Array.from(atob(effectiveQuestionBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
        const wavBlob = await convertOggToWav(audioBlob);
        const audioUrl = URL.createObjectURL(wavBlob);

        const questionAudioPlayer = document.getElementById(`questionAudioPlayer-${effectiveName}-${effectiveCode}`);
        if (questionAudioPlayer) {
          questionAudioPlayer.src = audioUrl;
          questionAudioPlayer.play();
        }
      } else {
        console.error('No audio data returned from fetchQuestion.');
      }
    } catch (error) {
      console.error('Error fetching or playing question audio:', error);
    }
  };

  // The following grading functions are skipped/unused in download mode.
  const handleGetGrade = async () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error('Participant has not completed the task');
    if (effectiveText === '') {
      return toast.error('Press the download button to fetch this student\'s data.');
    }
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/getgrade?transcription=${effectiveText}&rubric=${rubric}&code=${effectiveCode}&index=${index}`
      );
      const data = await response.json();
      
      if (!data.grades) 
        return toast.error('Error getting grade. This may be due to a high volume of requests. Try again in a few seconds.');
      setGrades(data.grades);

      if (!data.justifications)
        return toast.error('Error getting justifications. This may be due to a high volume of requests. Try again in a few seconds.');
      setJustifications(data.justifications);

      let total = 0;
      Object.values(data.grades).forEach((grade) => {
        total += parseFloat(grade);
      });
      setTotalScore(total);

      // Parse categories and descriptions only in non-download mode
      let category = rubric2 === '' ? [] : rubric2.split('|;;|').map((element) => {
        return element.split('|:::|')[0];
      });
      setCategories(category)

      let descriptions = rubric2 === '' ? [] : rubric2.split('|;;|').map((element) => {
        return element.split('|:::|')[1].replace('|,,,|', '\n\n');
      });

      onGradeUpdate(effectiveName, effectiveCustomName, data.grades, total, comment, categories);

    } catch (error) {
      console.error('Error getting grade:', error);
    }
  };

  const handleGradeChange = (gradeIndex, value) => {
    if (downloadMode) return;
    const updatedGrades = { ...grades, [gradeIndex]: value };

    let total = 0;
    Object.values(updatedGrades).forEach((grade) => {
      total += parseFloat(grade);
    });
    setTotalScore(total);

    setGrades(updatedGrades);
    
    let category = rubric2 === '' ? [] : rubric2.split('|;;|').map((element) => {
      return element.split('|:::|')[0];
    });
    setCategories(category)

    let descriptions = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[1].split('|,,,|').join('\n\n');
    });
    
    onGradeUpdate(effectiveName, effectiveCustomName, updatedGrades, total, comment, categories);
  };

  const handleAiButtonClick = () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error('Participant has not completed the task');

    if (aiButtonDisabled) 
      return toast.error('Wait 1 second');
    
    setAiButtonDisabled(true);
    setTimeout(() => {
      setAiButtonDisabled(false);
    }, 1000);

    handleGetGrade();
  };

  const handleCopyComments = () => {
    if (!effectiveName)
      return toast.error('Participant has not completed the task');
    if (rubric === '' || effectiveText === '') {
      return toast.error('Press the download button to fetch this student\'s data.');
    }

    let commentsText = 'AI Grade based on the rubric set by the teacher:\n\n';
    rubric2.split('|;;|').forEach((element, index) => {
      const [rubricItem] = element.split('|:::|');
      commentsText += `${rubricItem}: ${justifications[index] || 'AI was not used in the grading process, and there is no description to give'}\n\n`;
    });

    commentsText += `\n\nThis is NOT your final grade, as there WILL be manual review by the teacher, and AI may make mistakes initially.\n\n`;

    navigator.clipboard.writeText(commentsText).then(() => {
      toast.success('Comments copied to clipboard');
    }).catch((error) => {
      console.error('Error copying comments:', error);
      toast.error('Failed to copy comments');
    });
  };

  const handleEmailButtonClick = () => {
    if (downloadMode) return;
    if (!effectiveName)
      return toast.error('Participant has not completed the task');

    const studentName = effectiveName;
    let breakdown = '';
    if (rubric2 !== '' && effectiveText !== '') {
      rubric2.split('|;;|').forEach((element, index) => {
        const [rubricItem] = element.split('|:::|');
        const grade = grades[index] !== undefined ? grades[index] : 'N/A';
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
Total Score: ${totalScore}${comment && comment !== '' ? `
  
Teacher's Comment: ${comment}` : ''}`;

    // Save the base email body and set the initial email body
    setBaseEmailBody(autoEmail);
    setEmailBody(autoEmail);
    setIncludeResponseLink(true);
    setShowEmailModal(true);
  };

  const updateEmailBodyWithLink = (includeLink) => {
    let updatedBody = baseEmailBody;
    setEmailBody(updatedBody);
  };

  const handleSendEmail = async () => {
    try {
      const queryParams = new URLSearchParams({
        message: emailBody,
        code: effectiveCode,
        participant: effectiveName,
        subject: "SpeakEval Exam Result",
        pin: localStorage.getItem('token'),
      });
      queryParams.append('link', includeResponseLink);
      const response = await fetch(`https://www.server.speakeval.org/send_email?${queryParams.toString()}`);
      const resp = await response.json();
      if (resp.success) {
        toast.success('Email sent successfully');
        setShowEmailModal(false);
      } else {
        toast.error(resp.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email');
    }
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
    onGradeUpdate(effectiveName, effectiveCustomName, grades, totalScore, newComment, categories);
  };

  // If in download mode and data is still loading, show a temporary loading message.
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

  return (
    <div className={`relative flex flex-col items-start px-5 h-auto max-w-[400px] rounded-lg bg-gray-200 m-2 ${completed ? '' : 'text-red-500'}`}>
      <div className="flex items-center w-full">
        <span className="mr-[8px] text-[23px] truncate">{effectiveCustomName || effectiveName}</span>
        <div className="flex gap-[8px] ml-auto">
          <button
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            onClick={handleDownload}
          >
            <FaDownload />
          </button>
          <button
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
            onClick={handlePlay}
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : (isPlaying ? <FaPause /> : <FaPlay />)}
          </button>
          {/* Only show AI and Email buttons if not in download mode */}
          {!downloadMode && (
            <>
              <button
                className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
                onClick={handleAiButtonClick}
              >
                <FaRobot />
              </button>
              <button
                className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600"
                onClick={handleEmailButtonClick}
                title="Send Email"
              >
                <FaEnvelope />
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <button
          className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
          onClick={handlePlayQuestion}
        >
          Play Question
        </button>
      </div>

      <div className="w-full">
        <div className="mt-2 text-gray-800 break-words">
          {effectiveQuestion}
        </div>
        <br />
        <div className="mt-2 text-gray-800 break-words">
          {effectiveText}
        </div>
      </div>

      {/* Render grade inputs, total, and comments only if not in download mode */}
      {!downloadMode && (
        <>
          <div className="mt-2 text-gray-800 break-words">
            {rubric2 !== '' && effectiveText !== '' && rubric2.split('|;;|').map((element, idx) => {
              const [rubricItem] = element.split('|:::|');
              return (
                <div key={idx} className="flex items-center relative z-10">
                  <span className="mr-2">{rubricItem}</span>
                  <input
                    type="text"
                    className="border border-gray-300 px-2 py-1 rounded w-20"
                    placeholder="Points"
                    value={grades[idx] || ''}
                    onChange={(e) => handleGradeChange(idx, e.target.value)}
                  />
                  <div className="relative group flex items-center">
                    <FaInfoCircle className="ml-2 text-blue-500" />
                    <div className="absolute left-full ml-0 w-64 p-2 bg-gray-700 text-white text-sm rounded hidden group-hover:block z-20">
                      {justifications[idx] ? justifications[idx] : 'Press the AI button to receive an automated grade and view the reason here.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-gray-800">
            {rubric !== '' && effectiveText !== '' && `Total Score: ${totalScore}`}
          </div>
          <div className="flex justify-center mt-2 mb-2">
            <button
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
              onClick={handleCopyComments}
            >
              <FaClipboard className="mr-2" /> Copy AI Comments
            </button>
          </div>

          {/* Comment Section */}
          <div className="mt-4 w-full">
            <textarea
              className="w-full p-2 border border-gray-300 rounded resize-none"
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

      {showEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2">
            <h2 className="text-xl font-bold mb-4">Edit Email</h2>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeResponseLink}
                  onChange={(e) => {
                    setIncludeResponseLink(e.target.checked);
                  }}
                />
                <span>Include a link for the student to view their response</span>
              </label>
            </div>
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 mr-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleSendEmail}
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;