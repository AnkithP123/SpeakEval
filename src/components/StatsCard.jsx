import React from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay } from 'react-icons/fa';

function ProfileCard({ name, code, onParticipantRemoved }) {

  const handlePlay = async () => {
  if (!name.completed)
    return toast.error('Participant has not completed the task');
  try {
    // Fetch the Opus audio data
    const response = await fetch(
      `https://backend-8zsz.onrender.com/download?code=${code}&participant=${name.name}`
    );
    const data = await response.json();
    if (data.error) return toast.error(data.error);

    if (Array.isArray(data.audio.data)) {
      // Convert the audio data to a Blob
      const audioData = new Uint8Array(data.audio.data);
      const audioBlob = new Blob([audioData], { type: 'audio/opus' });

      // Create a URL for the Blob
      const audioUrl = URL.createObjectURL(audioBlob);

      // Set the audio source to the URL and play the audio
      const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
      audioPlayer.src = audioUrl;
      console.log(audioPlayer.src);
      audioPlayer.play();
    } else {
      console.error('Invalid audio data format');
    }

    // Add the text from the response below the audio player
    const textContainer = document.createElement('div');
    textContainer.innerText = data.text;
    document.getElementById(`audioPlayer-${name.name}`).after(textContainer);
  } catch (error) {
    console.error('Error loading audio:', error);
  }
};

const handleDownload = async () => {
  if (!name.completed)
    return toast.error('Participant has not completed the task');
  try {
    // Fetch the Opus audio data
    const response = await fetch(
      `https://backend-8zsz.onrender.com/download?code=${code}&participant=${name.name}`
    );
    const data = await response.json();
    if (data.error) return toast.error(data.error);

    if (Array.isArray(data.audio.data)) {
      // Convert the audio data to a Blob
      const audioData = new Uint8Array(data.audio.data);
      const audioBlob = new Blob([audioData], { type: 'audio/opus' });

      // Convert Blob to WAV (assuming the backend provides Opus)
      const wavBlob = await convertOpusToWav(audioBlob);

      // Create a URL for the Blob and trigger download
      const downloadUrl = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${name.name}.wav`; // Set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('Invalid audio data format');
    }

    // Add the text from the response below the download link
    const textContainer = document.createElement('div');
    textContainer.innerText = data.text;
    document.querySelector('.p-2.bg-blue-500.text-white.rounded-full.hover:bg-blue-600').after(textContainer);
  } catch (error) {
    console.error('Error downloading audio:', error);
  }
};

const convertOpusToWav = async (opusBlob) => {
  // Implement conversion from Opus to WAV (using a library like ffmpeg.js, opus.js, etc.)
  // For now, we'll return the original Blob for demonstration purposes
  return opusBlob;
};

return (
  <div className="relative flex flex-col items-center px-5 h-[45px] rounded-lg bg-gray-200 m-2">
    <span className="mr-[8px] text-[23px]">{"" + name.name}</span>
    <div className="flex gap-[8px]">
      <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
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
    <audio id={`audioPlayer-${name.name}`} />
    <div className="mt-2">{data.text}</div>
  </div>
);

}

export default ProfileCard;
