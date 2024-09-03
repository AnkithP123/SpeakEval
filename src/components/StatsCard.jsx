import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay } from 'react-icons/fa';

function ProfileCard({ name, code, onParticipantRemoved }) {
  const [completed, setCompleted] = useState(false);
  const [text, setText] = useState('');

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

      if (Array.isArray(data.audio.data)) {
        const audioData = new Uint8Array(data.audio.data);
        const audioBlob = new Blob([audioData], { type: 'audio/opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
        audioPlayer.src = audioUrl;
      } else {
        console.error('Invalid audio data format');
      }

      setText('Transcription: ' + data.text);
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

      if (Array.isArray(data.audio.data)) {
        const audioData = new Uint8Array(data.audio.data);
        const audioBlob = new Blob([audioData], { type: 'audio/opus' });
        const wavBlob = await convertOpusToWav(audioBlob);
        const downloadUrl = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${name.name}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Invalid audio data format');
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const handlePlay = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    try {
      const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
      audioPlayer.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  const convertOpusToWav = async (opusBlob) => {
    return opusBlob;
  };

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
      <div className="mt-2 text-gray-800 break-words">{text}</div>
      <audio id={`audioPlayer-${name.name}`} />
    </div>
  );
}

export default ProfileCard;
