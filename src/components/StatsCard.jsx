import React from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay } from 'react-icons/fa';

function ProfileCard({ name, code, onParticipantRemoved }) {

  const handlePlay = async () => {
    if(!name.completed)
      return toast.error('Participant has not completed the task');
    try {
      // Fetch the Opus audio data
      const response = await fetch(`https://backend-8zsz.onrender.com/download?code=${code}&participant=${name.name}`);
      const data = await response.json();

      if (Array.isArray(data.audio.data)) {
        // Convert the audio data to a Blob
        const audioData = new Uint8Array(data.audio.data);
        const audioBlob = new Blob([audioData], { type: 'audio/opus' });

        // Create a URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set the audio source to the URL and play the audio
        const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
        audioPlayer.src = audioUrl;
        audioPlayer.play();
      } else {
        console.error('Invalid audio data format');
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  return (
    <div className="relative flex items-center px-5 h-[45px] rounded-lg bg-gray-200 m-2">
      <span className="mr-[8px] text-[23px]">{"" + name.name}</span>
      <div className="flex gap-[8px]">
        <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
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
    </div>
  );
}

export default ProfileCard;
