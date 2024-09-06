import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay } from 'react-icons/fa';

function ProfileCard({ name, code }) {
  const [completed, setCompleted] = useState(false);
  const [text, setText] = useState('');
  const [rubric, setRubric] = useState('');
  const [index, setIndex] = useState('');
  const [questionAudioUrl, setQuestionAudioUrl] = useState('');

  useEffect(() => {
    if (name.completed) {
      setCompleted(true);
      fetchAudioData();
    }
  }, [name.completed]);

  const fetchAudioData = async () => {
    try {
      const response = await fetch(
        `https://backend-8zsz.onrender.com/download?code=${code}&participant=${name.name}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Set the URL for the answer audio player
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name.name}`);
      if (answerAudioPlayer) {
        answerAudioPlayer.src = audioUrl;
      }

      setText('Transcription: ' + data.text);
      setIndex(data.index); // Update the index state variable
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const handleDownload = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    try {
      const response = await fetch(
        `https://backend-8zsz.onrender.com/download?code=${code}&participant=${name.name}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const wavBlob = await convertOpusToWav(audioBlob);
      const downloadUrl = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${name.name}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const handlePlay = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    try {
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name.name}`);
      if (answerAudioPlayer) {
        answerAudioPlayer.play();
      }
    } catch (error) {
      console.error('Error playing answer audio:', error);
    }
  }

  const convertOpusToWav = async (opusBlob) => {
    return opusBlob; // This is a placeholder. Implement actual conversion if needed.
  };

  const readRubric = async () => {
    try {
      const response = await fetch(
        `https://backend-8zsz.onrender.com/receiveaudio?code=${code}`
      );
      const data = await response.json();
      setRubric(data.rubric);
    } catch (error) {
      console.error('Error loading rubric:', error);
    }
  }

  const fetchQuestion = async () => {
    try {
      const response = await fetch(
        `https://backend-8zsz.onrender.com/getquestion?code=${code}&index=${index}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      return data.audio; // Ensure the returned data matches the expected format
    } catch (error) {
      console.error('Error loading question audio:', error);
    }
  }

  const handlePlayQuestion = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    try {
      const questionBase64 = await fetchQuestion();
      if (questionBase64) {
        const audioData = Uint8Array.from(atob(questionBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set the URL for the question audio player
        const questionAudioPlayer = document.getElementById(`questionAudioPlayer-${name.name}`);
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

  useEffect(() => {
    readRubric();
  }, []);

  return (
    <div className={`relative flex flex-col items-start px-5 h-auto max-w-[300px] rounded-lg bg-gray-200 m-2 ${completed ? '' : 'text-red-500'}`}>
      <div className="flex items-center w-full">
        <span className="mr-[8px] text-[23px] truncate">{name.name}</span>
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
            <FaPlay />
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
      <div className="mt-2 text-gray-800 break-words">
        {text}
      </div>
      <div className="mt-2 text-gray-800 break-words">
        {rubric.split('|;;|').map((element, index) => (
          <div key={index} className="flex items-center">
            <span className="mr-2">{element.split('|:::|')[0]}</span>
            <input type="text" className="border border-gray-300 px-2 py-1 rounded w-20" placeholder="Points" style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
      <audio id={`answerAudioPlayer-${name.name}`} />
      <audio id={`questionAudioPlayer-${name.name}`} />
    </div>
  );
}

export default ProfileCard;
