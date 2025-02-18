import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay, FaPause, FaRobot, FaInfoCircle, FaClipboard, FaSpinner, FaComment } from 'react-icons/fa';

function ProfileCard({ text, rubric, rubric2, audio, question, index, questionBase64, name, code, onGradeUpdate, customName }) {
  const [completed, setCompleted] = useState(false);
  const [grades, setGrades] = useState({});
  const [justifications, setJustifications] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [aiButtonDisabled, setAiButtonDisabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState('');


  useEffect(() => {
    if (name) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [name]);

  let fetchAudio;

  useEffect(() => {
    fetchAudio = async () => {
      try {
        const audioData = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
        let audioBlob = new Blob([audioData], { type: 'audio/ogg' });

        try {
          const wavBlob = await convertOggToWav(audioBlob);
          const audioUrl = URL.createObjectURL(wavBlob);
          const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
          if (answerAudioPlayer) {
            answerAudioPlayer.src = audioUrl;
          }
        } catch (err) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
          if (answerAudioPlayer) {
            answerAudioPlayer.src = audioUrl;
          }
        }
      } catch (error) {
        console.log('Error loading audio:', error);
        console.log(name);
      }
    };

    fetchAudio();
  }, [audio]);

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
    // file length minus RIFF identifier length and file description length
    view.setUint32(offset, 36 + audioBuffer.length * numberOfChannels * 2, true); offset += 4;
    // RIFF type
    writeString(view, offset, 'WAVE'); offset += 4;
    // format chunk identifier
    writeString(view, offset, 'fmt '); offset += 4;
    // format chunk length
    view.setUint32(offset, 16, true); offset += 4;
    // sample format (raw)
    view.setUint16(offset, 1, true); offset += 2;
    // channel count
    view.setUint16(offset, numberOfChannels, true); offset += 2;
    // sample rate
    view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4;
    // byte rate (sample rate * block align)
    view.setUint32(offset, audioBuffer.sampleRate * numberOfChannels * 2, true); offset += 4;
    // block align (channel count * bytes per sample)
    view.setUint16(offset, numberOfChannels * 2, true); offset += 2;
    // bits per sample
    view.setUint16(offset, 16, true); offset += 2;
    // data chunk identifier
    writeString(view, offset, 'data'); offset += 4;
    // data chunk length
    view.setUint32(offset, audioBuffer.length * numberOfChannels * 2, true); offset += 4;

    // write interleaved data
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
    if (!name)
      return toast.error('Participant has not completed the task');
    if (text === '') {
      // await fetchAudioData();
    }
    try {
      setIsLoading(true);
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
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
    if (!name)
      return toast.error('Participant has not completed the task');
    const audioData = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
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

    a.download = `${name}-${code}.wav`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePlayQuestion = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    try {
      if (questionBase64) {
        const audioData = Uint8Array.from(atob(questionBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
        const wavBlob = await convertOggToWav(audioBlob);
        const audioUrl = URL.createObjectURL(wavBlob);

        const questionAudioPlayer = document.getElementById(`questionAudioPlayer-${name}-${code}`);
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

  const handleGetGrade = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    if (text === '') {
      return toast.error('Press the download button to fetch this student\'s data.');
    }
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/getgrade?transcription=${text}&rubric=${rubric}&code=${code}&index=${index}`
      );
      const data = await response.json();
      
      const grades = data.grades;
      if (!grades || grades === undefined) 
        return toast.error('Error getting grade. This may be due to a high volume of requests. Try again in a few seconds.');
      setGrades(data.grades);

      const justifications = data.justifications;
      if (!justifications || justifications === undefined) 
        return toast.error('Error getting justifications. This may be due to a high volume of requests. Try again in a few seconds.');
      setJustifications(data.justifications);

      let total = 0;
      Object.values(grades).forEach((grade) => {
        total += parseFloat(grade);
      });
      setTotalScore(total);

      let categories = rubric2 === '' ? [] : rubric2.split('|;;|').map((element) => {
        return element.split('|:::|')[0];
      });

      let descriptions = rubric2 === '' ? [] : rubric2.split('|;;|').map((element) => {
        return element.split('|:::|')[1].replace('|,,,|', '\n\n');
      });

      onGradeUpdate(name, customName, grades, total, categories, descriptions);

    } catch (error) {
      console.error('Error getting grade:', error);
    }
  };

  const handleGradeChange = (index, value) => {
    const updatedGrades = { ...grades, [index]: value };

    let total = 0;
    Object.values(updatedGrades).forEach((grade) => {
      total += parseFloat(grade);
    });
    setTotalScore(total);

    setGrades(updatedGrades);
    
    let categories = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[1].replace('|,,,|', '\n\n');
    });

    let descriptions = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[1].split('|,,,|').join('\n\n');
    });
    
    onGradeUpdate(name, customName, updatedGrades, total, categories, descriptions);
  };

  const handleAiButtonClick = () => {
    if (!name)
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
    if (!name)
      return toast.error('Participant has not completed the task');
    if (rubric === '' || text === '') {
      return toast.error('Press the download button to fetch this student\'s data.');
    }

    let comments = 'AI Grade based on the rubric set by the teacher:\n\n';
    rubric2.split('|;;|').forEach((element, index) => {
      const [rubricItem] = element.split('|:::|');
      comments += `${rubricItem}: ${justifications[index] || 'AI was not used in the grading process, and there is no description to give'}\n\n`;
    });

    comments += `\n\nThis is NOT your final grade, as there WILL be manual review by the teacher, and AI may make mistakes initially.\n\n`;

    navigator.clipboard.writeText(comments).then(() => {
      toast.success('Comments copied to clipboard');
    }).catch((error) => {
      console.error('Error copying comments:', error);
      toast.error('Failed to copy comments');
    });
  };

  const handleCommentButtonClick = () => {
    console.log('Comment button (does not work) clicked');
    toast.info('Comment button (does not work) clicked');
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
    onGradeUpdate(name, customName, grades, totalScore, newComment);
  };

  return (
    <div className={`relative flex flex-col items-start px-5 h-auto max-w-[400px] rounded-lg bg-gray-200 m-2 ${completed ? '' : 'text-red-500'}`}>
      <div className="flex items-center w-full">
        <span className="mr-[8px] text-[23px] truncate">{customName || name}</span>
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
          <button
            className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
            onClick={handleAiButtonClick}
          >
            <FaRobot />
          </button>
          <button
            className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
            onClick={handleCommentButtonClick}
            title="Comment button (does not work)"
          >
            <FaComment />
          </button>
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

      {completed && (
        <div className="w-full">
          <div className="mt-2 text-gray-800 break-words">
            {question}
          </div>
          <br />
          <div className="mt-2 text-gray-800 break-words">
            {text}
          </div>
          <div className="mt-2 text-gray-800 break-words">
            {rubric2 !== '' && text !== '' && rubric2.split('|;;|').map((element, index) => {
              const [rubricItem, rubricKey] = element.split('|:::|');
              return (
                <div key={index} className="flex items-center relative z-10">
                  <span className="mr-2">{rubricItem}</span>
                  <input
                    type="text"
                    className="border border-gray-300 px-2 py-1 rounded w-20"
                    placeholder="Points"
                    value={grades[index] || ''}
                    onChange={(e) => handleGradeChange(index, e.target.value)}
                  />
                  <div className="relative group flex items-center">
                    <FaInfoCircle className="ml-2 text-blue-500" />
                    <div className="absolute left-full ml-0 w-64 p-2 bg-gray-700 text-white text-sm rounded hidden group-hover:block z-20">
                      {justifications[index] ? justifications[index] : 'Press the AI button to receive an automated grade and view the reason here.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-gray-800">
            {rubric !== '' && text !== '' && `Total Score: ${totalScore}`}
          </div>
          {rubric !== '' && text !== '' && (
            <div className="flex justify-center mt-2 mb-2">
              <button
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                onClick={handleCopyComments}
              >
                <FaClipboard className="mr-2" /> Copy AI Comments
              </button>
            </div>
          )}

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
        </div>
      )}

      <audio id={`answerAudioPlayer-${name}-${code}`} />
      <audio id={`questionAudioPlayer-${name}-${code}`} />
    </div>
  );
}

export default ProfileCard;