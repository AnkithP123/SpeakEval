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

       
      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
      audioPlayer.src = audioUrl;

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

      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const wavBlob = await convertOggToWav(audioBlob);
        const downloadUrl = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${name.name}.wav`;
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
      const audioPlayer = document.getElementById(`audioPlayer-${name.name}`);
      audioPlayer.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  const convertOggToWav = async (oggBlob) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oggArrayBuffer = await oggBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(oggArrayBuffer);
      const wavArrayBuffer = audioBufferToWav(audioBuffer);
      return new Blob([wavArrayBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting audio:', error);
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    // Write audio data
    const channelData = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const sample16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample16, true);
        offset += 2;
      }
    }

    return buffer;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
}

export default ProfileCard;
