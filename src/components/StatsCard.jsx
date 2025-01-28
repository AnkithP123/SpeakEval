import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay, FaPause, FaRobot, FaInfoCircle, FaClipboard, FaVideo } from 'react-icons/fa';

function ProfileCard({ text, rubric, audio, question, index, questionBase64, name, code, onGradeUpdate, customName }) {
  const [completed, setCompleted] = useState(false);
  const [grades, setGrades] = useState({});
  const [justifications, setJustifications] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [aiButtonDisabled, setAiButtonDisabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // New state variable for audio playback

  useEffect(() => {
    if (name) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [name]);

  useEffect(() => {
    const fetchAudio = async () => {
      const audioData = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
      let audioBlob = new Blob([audioData], { type: 'audio/ogg' });

      const wavBlob = await convertOggToWav(audioBlob);

      try {
        const audioUrl = URL.createObjectURL(wavBlob);

        const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
        if (answerAudioPlayer) {
          answerAudioPlayer.src = audioUrl;
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

  const fetchAudioData = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/download?code=${code}&participant=${name}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const wavBlob = await convertOggToWav(audioBlob);
      const audioUrl = URL.createObjectURL(wavBlob);

      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
      if (answerAudioPlayer) {
        answerAudioPlayer.src = audioUrl;
      }

      readRubric();

      setText('Transcription: ' + data.text);
      setQuestion('Question: ' + data.question);
      setIndex(data.index);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const handleDownload = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    // Download the wav file from audio in memory using the function
    const audioData = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioData], { type: 'audio/ogg' });

    const wavBlob = await convertOggToWav(audioBlob);

    const url = URL.createObjectURL(wavBlob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `${name}-${code}.wav`;

    a.click();

    URL.revokeObjectURL(url);
    
  };

  const handlePlay = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    if (text === '') {
      // await fetchAudioData();
    }
    try {
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name}-${code}`);
      if (answerAudioPlayer) {
        if (isPlaying) {
          answerAudioPlayer.pause(); // Pause the audio
          setIsPlaying(false); // Update the playback status
        } else {
          answerAudioPlayer.play(); // Play the audio
          setIsPlaying(true); // Update the playback status
          answerAudioPlayer.addEventListener('ended', () => {
            setIsPlaying(false); // Reset the state when the audio finishes
          });  
        }
      }
    } catch (error) {
      console.error('Error playing answer audio:', error);
    }
  }

  const convertOpusToWav = async (opusBlob) => {
    return opusBlob;
  };

  const readRubric = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/receiveaudio?code=${code}&participant=${name}`
      );
      const data = await response.json();
      setRubric(data.rubric);
      setQuestionBase64(data.audios[0]);
    } catch (error) {
      console.error('Error loading rubric:', error);
    }
  }

  const fetchQuestion = async () => {
    try {
      const response = await fetch(
        `https://www.server.speakeval.org/getquestion?code=${code}&index=${index}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      return data.audio;
    } catch (error) {
      console.error('Error loading question audio:', error);
    }
  }

  const handlePlayQuestion = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    try {
      if (questionBase64) {
        const audioData = Uint8Array.from(atob(questionBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
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
  }

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
      if (!grades || grades === undefined) return toast.error('Error getting grade. This may be due to a high volume of requests. Try again in a few seconds.');
      setGrades(data.grades);

      const justifications = data.justifications;
      if (!justifications || justifications === undefined) return toast.error('Error getting justifications. This may be due to a high volume of requests. Try again in a few seconds.');
      setJustifications(data.justifications);

      let total = 0;
      Object.values(grades).forEach((grade) => {
        total += parseFloat(grade);
      });
      setTotalScore(total);

      let categories = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
        return element.split('|:::|')[0];
      });

      let descriptions = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
        return element.split('|:::|')[1].replace('|,,,|', '\n\n');
      });


      onGradeUpdate(name, grades, total, categories, descriptions);

    } catch (error) {
      console.error('Error getting grade:', error);
    }
  }

  const handleGradeChange = (index, value) => {
    const updatedGrades = { ...grades, [index]: value };

    let total = 0;
    Object.values(updatedGrades).forEach((grade) => {
      total += parseFloat(grade);
    });
    setTotalScore(total);

    setGrades(updatedGrades);
    
    // Pass the grades and total score to the parent component
    console.log('Updated grades:', updatedGrades);
    let categories = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[1].replace('|,,,|', '\n\n');
    });

    let descriptions = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[1].split('|,,,|').join('\n\n');
    });

    console.log('Updated categories:', categories);
    
    onGradeUpdate(name, updatedGrades, total, categories, descriptions);

  };

  const handleAiButtonClick = () => {

    console.log('CLICKED');

    if (!name)
      return toast.error('Participant has not completed the task');

    if (aiButtonDisabled) return toast.error('Wait 1 second');
    
    // Disable the AI button for 5 seconds
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
    rubric.split('|;;|').forEach((element, index) => {
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

  const handleDownloadScreenRecording = async () => {
    if (!name)
      return toast.error('Participant has not completed the task');
    try {
      const url = `https://www.server.speakeval.org/download_screen?code=${code}&participant=${name}`;
      const newTab = window.open(url, '_blank');
      if (newTab) {
        newTab.focus();
        toast.success('Screen recording link opened in a new tab');
      } else {
        throw new Error('Failed to open new tab');
      }
    } catch (error) {
      console.error('Error opening screen recording link:', error);
      toast.error('Failed to open screen recording link');
    }
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
            {isPlaying ? <FaPause /> : <FaPlay />} {/* Render stop button if audio is playing */}
          </button>
          <button
            className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
            onClick={handleAiButtonClick}
          >
            <FaRobot />
          </button>
          {/* <button
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            onClick={handleDownloadScreenRecording}
          >
            <FaVideo />
          </button> */}
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
      
      { completed ? 
      <div>
        
      <div className="mt-2 text-gray-800 break-words">
        {question}
      </div>
      <br />
        <div className="mt-2 text-gray-800 break-words">
          {text}
        </div>
        <div className="mt-2 text-gray-800 break-words">
          {rubric !== '' && text !== '' ? rubric.split('|;;|').map((element, index) => {
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
          }) : null}
        </div>
        <div className="mt-2 text-gray-800">
          { rubric !== '' && text !== '' ?
          `Total Score: ${totalScore}` : null
          }
        </div>
        {rubric !== '' && text !== '' ? <div className="flex justify-center mt-2 mb-2">
          <button
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
            onClick={handleCopyComments}
          >
            <FaClipboard className="mr-2" /> Copy AI Comments
          </button>
        </div> : null}
      </div>
      : null }
      <audio id={`answerAudioPlayer-${name}-${code}`} />
      <audio id={`questionAudioPlayer-${name}-${code}`} />
    </div>
  );
}

export default ProfileCard;
