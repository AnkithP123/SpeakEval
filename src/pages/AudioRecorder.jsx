import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Square, Repeat } from 'lucide-react';
import styled, { css, keyframes } from "styled-components";
import { cuteAlert } from 'cute-alert';
import * as Tone from 'tone';
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from 'react-toastify';


//TODO add some UUID checks (marked with comments)
export default function AudioRecorder({ code, participant, uuid }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(true);
  const [microphone, setMicrophone] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioBlobURL, setAudioBlobURL] = useState(null);
  const countdownRef = useRef(0); // Use ref for countdown
  const [countdownDisplay, setCountdownDisplay] = useState(0); // State for displaying countdown
  const timer = useRef(0); // New ref for timer
  const statusInterval = useRef(null);
  const mediaRecorder = useRef(null);
  const screenRecorder = useRef(null);
  const audioRef = useRef(null);
  const [displayTime, setDisplayTime] = useState('xx:xx'); // State for displaying formatted time
  const [obtainedAudio, setObtainedAudio] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [waiting, setWaiting] = useState(false);
  let [premium, setPremium] = useState(false);
  let questionIndex;

  const navigate = useNavigate();

  // set the status interval
  useEffect(() => {
    statusInterval.current = setInterval(sendStatus, 3000);
    return () => clearInterval(statusInterval.current);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--cute-alert-max-width', '40%');
    cuteAlert({
        type: "info",
        title: "Welcome to SpeakEval",
        description: "It's time to record your response. When you're ready, click the play button to download the question and listen to it. After you've listened to the question, it will give you at least 5 seconds to think, during which you can replay the question once, and then begin recording. Speak clearly, confidently, and LOUDLY, so that your microphone picks up your audio well. Speak directly into your microphone, or, if you don't have an external microphone, speak directly into your device's microphone. Good luck!",
        primaryButtonText: "Got it"
    })
  }, []);

  const pulse = keyframes`
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  `;

  const animation = props => css`
    ${pulse} 1.1s infinite;
  `;

  const recordStyle = {
    background: 'radial-gradient(circle at bottom, #ff0000 0%, #b20000 70%)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    margin: '0 auto',
    position: 'relative',
    transition: 'background 0.3s ease',
    animation: `${animation}`,
  };

  const PulseButton = styled.button`
    animation: ${animation};
  `;

  const playBeep = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C5", "8n"); // A short beep sound
  };

  const playRecordingStarted = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C6", "4n"); // A different tone for recording started
  };

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

  async function sendStatus() {
    const response = await fetch(`https://www.server.speakeval.org/check_status?code=${code}&participant=${participant}&uuid=${uuid}`);
    if (!response.ok) {
      setError('Failed to fetch status');
      setIsError(true);
      return;
    }

    const data = await response.json();

    console.log('Response:', data);

    const responseCode = data.code;

    if (responseCode === 7) {
      window.location.href = `record?code=${data.newRoomCode}&participant=${participant}&uuid=${uuid}`;
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'inactive' && !playing && !isRecording) {
      timer.current = 0;
      setDisplayTime('xx:xx');
      return;
    }
    // if (data.time) {
    //     updateTimer(data.time);
    // }
    if (data.started && data.limit) {
      updateTimer(data.limit - (Date.now() - data.started));
    }
    console.log('Response code:', responseCode);
    switch (responseCode) {
      case 1:
        navigate('/join-room');
        break;
      case 2:
        toast.error("You are not in the room");
        navigate('/join-room');
        break;
      case 3:
        break;
      case 4:
        navigate('/join-room');
        break;
      case 5:
        if (error === 'Reaching time limit. Please finish your response in the next 5 seconds. ') {
          setError('You reached the time limit and your audio was stopped and uploaded automatically. ' + premium ? 'Your teacher has a premium subscription, so your audio will be processed faster' : 'It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue. Tell your teacher to upgrade to Premium to bypass the queue.');
          setIsError(false)
        }
        stopRecording();
        break;
      case 6:
        if (!error || (!error.includes('Processing...') && !error.includes('Uploaded to server successfully.'))) {
          setError('Reaching time limit. Please finish your response in the next 5 seconds. ');
          setIsError(true);
        }
        break;
      case 7:
        break;
      case 9:
        toast.error("The IP this user joined from is different than your current IP. If this is a mistake, tell your teacher to remove you and rejoin with the same name.");
        console.log(parsedData);
        navigate('/join-room');
        break;    
      default:
        navigate('/join-room');
        break;
    }
  }

  const makeResponse = async () => {
    setFetching(true);
    console.log('Fetching')
    const response = await fetch(`https://www.server.speakeval.org/receiveaudio?code=${code}&participant=${participant}&number=1`);
    if (!response.ok) {
      setError('Failed to fetch audio');
      setIsError(true);
      return;
    }

    const receivedData = await response.json();

    console.log(receivedData);

    console.log('Received data:', receivedData.audios);

    const audios = receivedData.audios;

    console.log(receivedData);

    if (receivedData.subscribed) {
      premium = true;
    }

    for (const data of audios) {
        console.log('Response:', data);
        
        // Convert the base64 string to a Uint8Array
        const audioData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        // Create a Blob from the Uint8Array
        const audioBlob = new Blob([audioData], { type: 'audio/wav' });
        // Create a URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);
      
        setAudioBlobURL(audioUrl);
        console.log("Audio URL: " + audioUrl);
        questionIndex = receivedData.questionIndex;
    }

    setFetching(false);

  }

  const getAudio = async () => {
    if (!audioBlobURL) {
      try {
        await makeResponse();
      } catch (err) {
        console.error('Error fetching audio:', err);
        setError('An error occurred while fetching the audio. Try reloading the page.');
        setIsError(true);
        }
      setObtainedAudio(true);
    }
    
  }

  const getSupportedMimeType = () => {
    const types = ['audio/webm', 'audio/ogg', 'audio/mp4'];
    for (let type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  };


  const requestMicrophonePermission = async () => {
    try {
      const stream1 = await navigator.mediaDevices.getUserMedia({ audio: true });

      let stream;

      if (!screenRecorder.current && false) {

      


        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: "screen",
            audio: true,
            cursor: ["motion"],
            displaySurface: "monitor",
          },
        });

        if (stream.getVideoTracks()[0].getSettings().displaySurface !== 'monitor') {
          console.error('Error requesting microphone permission:', err);
          setError('Microphone access is required. Click here to try again.');
          setIsError(true);
          return { permissionGranted: false };
    
        }

  
        setError('');

        setIsError(false);
        
        screenRecorder.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

        screenRecorder.current.ondataavailable = (e) => {
          chunks2.push(e.data)
          console.log('Data available:', e.data);
        };

        screenRecorder.current.onstop = () => {
          const blob = new Blob(chunks2, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          console.log('Blob:', blob);
          console.log('Video URL:', videoUrl);
          // download video
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = 'screen.webm';
          a.click();
          toast.info('Save the screen recording that was downloaded if you have had any errors.');
          const formData = new FormData();
          formData.append('video', blob, 'screen.webm');

          uploadScreen(formData);

        };


        console.log('Screen recording started:', screenRecorder.current.state);

        screenRecorder.current.start();

        setInterval(() => {
          console.log('Screen recording state:', screenRecorder.current.state);
        }
        , 100);



  }

      setMicrophone(true);
      setError(null);
      return {permissionGranted: true, audio: stream1, video: stream};
    } catch (err) {
      console.error('Error requesting microphone permission:', err);
      setError('Microphone access is required. Click here to try again.');
      setIsError(true);
      return { permissionGranted: false };
    }
  };

  let chunks = [];
  let chunks2 = [];

  function blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  let interval = null;

  const startRecording = async () => {
    setIsRecording(true);
    setAudioURL(null);
    const {permissionGranted, audio, video} = await requestMicrophonePermission();
    if (!permissionGranted) {
      setError('Microphone access is required. Click here to try again.');
    }


    await fetch(`https://www.server.speakeval.org/started_playing_audio?code=${code}&participant=${participant}`); //TODO add a check here

    interval = setInterval(() => {
    // Only decrement if the current timer is greater than zero
    if (timer.current > 0) {
        timer.current -= 1000;  // Decrease by 1 second
        setDisplayTime(formatTime(timer.current));
    }
    // Display default if timer hits zero
    if (timer.current <= 0) {
        setDisplayTime('xx:xx');
        clearInterval(interval);
    }
    }, 1000);

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError('Your browser does not support any of the available audio recording formats.');
      setIsError(true);
      return;
    }

    try {
      const stream = audio;
      mediaRecorder.current = new MediaRecorder(stream, { mimeType });

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', blob, 'audio.wav');
        upload(formData);
        console.log('Blob:', blob);
        const audioUrl = URL.createObjectURL(blob);
        setAudioURL(audioUrl);
        setIsRecording(false);
      };
        

      await sendStatus();
      
      mediaRecorder.current.start();


    } catch (err) {
      console.error('Error starting recording:', err);
      setError('An error occurred while starting the recording. Please try again. Perhaps reload the page.');
      setIsError(true);
    }
  };

  const upload = async (formData) => {
    console.log(premium);
    setError('Processing... ' + (premium ? 'Your teacher has a premium subscription, so your audio will be processed faster' : 'This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue. Tell your teacher to upgrade to Premium to bypass the queue.'));
    setIsError(false);
    let transcriptionResult = { textContent: "" };

    if (Number.parseInt(code.toString().slice(-3)) === 1) {
      setTimeout(() => {
        document.documentElement.style.setProperty('--cute-alert-max-width', document.documentElement.style.getPropertyValue('--cute-alert-min-width') || '20%');
        cuteAlert({
          type: "question",
          title: "Feedback",
          description: "Could you quickly rate your experience with the oral exam assistant? This would open in a new tab, but wait until the exam is over.",
          primaryButtonText: "Sure!",
          secondaryButtonText: "No",
          showCloseButton: true,
          closeOnOutsideClick: true,
        }).then(async (event) => {
          if (event === "primaryButtonClicked") {
            window.open(`feedback?name=${participant}&code=${code}`, '_blank', 'noopener,noreferrer'); //TODO add a check here
          }
        });
      }, 3000);
    }

    let response = await fetch(`https://www.server.speakeval.org/upload?code=${code}&participant=${participant}&index=${questionIndex}`, { //TODO add a check here
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      transcriptionResult.textContent = 'Failed to upload audio. Retrying until success...';
      const retryInterval = setInterval(async () => {
        let retryResponse = await fetch(`https://www.server.speakeval.org/upload?code=${code}&participant=${participant}&index=${questionIndex}`, { //TODO add a check here
          method: 'POST',
          body: formData
        });
        if (retryResponse.ok) {
          clearInterval(retryInterval);
          const data = await response.json();

          console.log('Response:', data);

          if (data.error) {
            transcriptionResult.textContent = data.error;
            setError(transcriptionResult.textContent);
            setIsError(true);
            return;
          }

          if (transcriptionResult.textContent == 'Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.')
            transcriptionResult.textContent = '';

          transcriptionResult.textContent = transcriptionResult.textContent + 'Uploaded to server successfully. Tentative transcription: ' + data.transcription;

          setDisplayTime('xx:xx');

          return;

        }
      }, 10000);
    }

    const data = await response.json();

    console.log('Response:', data);

    if (data.error) {
      transcriptionResult.textContent = data.error;
      setError(transcriptionResult.textContent);
      setIsError(true);
      return;
    }

    if (transcriptionResult.textContent === 'Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.')
      transcriptionResult.textContent = '';

    if (transcriptionResult.textContent === 'You reached the time limit and your audio was stopped and uploaded automatically. It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue.')
      transcriptionResult.textContent = '';

    transcriptionResult.textContent = transcriptionResult.textContent + 'Uploaded to server successfully. Tentative transcription: ' + data.transcription;
    setIsError(false);

    console.log("Bob: " + transcriptionResult.textContent);
    setError(transcriptionResult.textContent);
  }

  const uploadScreen = async (formData) => {
    try {
      let response = await fetch(`https://www.server.speakeval.org/upload_screen?code=${code}&participant=${participant}&index=${questionIndex}`, { //TODO add a check here
        method: 'POST',
        body: formData
      });
    } catch (err) {
      console.error('Error uploading screen recording:', err);
      // setError('An error occurred while uploading the screen recording. Please try again.');
      // setIsError(true);
    }

  }



  const playRecording = async () => {

    setWaiting(true);

    if (playing || waiting)
      return;

    const {permissionGranted, audio, video} = await requestMicrophonePermission();
    if (!permissionGranted) {
      setError('Microphone access is required. Click here to try again.');
      return;
    }

    setWaiting(false);
    setPlaying(true);

    if (!obtainedAudio) {
      await getAudio();
    }

    setWaiting(false);

    // Use ref for controlling audio tag


    const playAudio = () => {
      console.log('HI: ', audioRef);
      if (audioRef.current) {
        console.log(audioRef.current);
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        console.log('Paused: ', audioRef.current.paused)
      } else {
        setTimeout(playAudio, 100); // Retry after 100ms if audioRef.current is not available
      }
    };
    playAudio();


  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    setStopped(true);
    setIsRecording(false);

    if (screenRecorder.current) {
      screenRecorder.current.stop();
    }

    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }

   

    clearInterval(interval);
  }

  const updateTimer = (time) => {
    timer.current = time;
    setDisplayTime(formatTime(time));
    if (time < 0)
      setDisplayTime('xx:xx');
  };

  const formatTime = (time) => {
    console.log('Time:', time);
    if (time === 0)
      return 'xx:xx';
    const minutes = Math.floor(time / 60000);
    const seconds = Math.round((time % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  let countdownInterval;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#bfdbfe',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      minHeight: '100vh',
    }}>
      {/* Timer display at the top */}
      <div style={{
        position: 'absolute',
        top: '80px',
        fontSize: '48px',
        fontWeight: 'bold',
        color: timer.current < 5000 && timer.current !== 0 ? 'red' : '#374151',
      }}>
        {displayTime}
      </div>
      {/* New outer rounded container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white', // White background for the rounded box
        padding: '40px', // Increase padding for the inner content
        borderRadius: '24px', // Larger rounded corners
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Add a shadow for better visibility
        width: '90%', // Adjust width to fit content nicely
        maxWidth: '600px', // Set a max width for the box
        textAlign: 'center',
        transform: 'translateY(30%)',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#374151',
          marginBottom: '16px',
        }}>
          Oral Exam Assistant
        </h1>
        {stopped || countdownRef.current > 0 ? (null) : (
          <PulseButton
            onClick={() => {
              if (isRecording) {
                stopRecording();
                Tone.start();
              } else {
                playRecording();
                Tone.start();
              }
            }}
            style={isRecording ? recordStyle : {
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s',
              animation: 'none', // Disable animation when not recording
            }}
          >
            {isRecording ? null : <Play size={24} color="white" fill="white" />}
          </PulseButton>
        )}

        {countdownDisplay > 0 && (
            <p style={{
                marginTop: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#374151',
            }}>
                If you couldn't hear or understand the question, you can use this time to replay it using the audio component below.
            </p>
        )}

        {/* Audio Player */}
        {audioBlobURL && !isRecording && (
          <div style={{
            width: '100%',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <audio
              controls={!playing && (!audioRef.current || audioRef.current.paused)}
              ref={(input) => {
                audioRef.current = input;
              }}
              style={{
                width: '100%',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#F8F8F8',
              }}
              src={audioBlobURL}
              onPlay={() => {
                if (!playing) {
                    countdownRef.current = audioRef.current.duration + 1;
                }
              }}
              
              onEnded={() => {
                if (!finished) {
                    setPlaying(false);
                    setFinished(true);
                    // Countdown logic
                    countdownRef.current = 5;
                        
                    setCountdownDisplay(countdownRef.current);
                    if (!audioRef.current || audioRef.current.paused)
                        playBeep();
                    countdownInterval = setInterval(() => {
                    countdownRef.current -= 1;
                    setCountdownDisplay(countdownRef.current);
                    if (countdownRef.current <= 0) {
                        clearInterval(countdownInterval);
                        // setFinished(false);
                        startRecording();
                    }
                    // Play beep sound during countdown
                    if (countdownRef.current <= -2) {
                        // Do nothing
                    } else if (countdownRef.current <= 0) {
                        if (audioRef.current && !audioRef.current.paused)
                            audioRef.current.pause();
                        playRecordingStarted();
                    } else {
                        if (!audioRef.current || audioRef.current.paused)
                            playBeep();
                    }
                    }, 1000);
                } else {
                  countdownRef.current = -1;
                  setCountdownDisplay(-1);
                }
        
              }}
              >
              {/* <source src={audioBlobURL} type="audio/wav" /> */}
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {isRecording && (
          <p style={{
            marginTop: '16px',
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
          }}>
            Recording...
          </p>
        )}

        {(playing || waiting) && (
          <p style={{
            marginTop: '18px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#28a745',
          }}>
            {(fetching ? "Downloading question..." : (waiting ? "Loading..." : "Playing..."))}
          </p>
        )}

        {countdownDisplay > 0 && (
          <p style={{
            marginTop: '16px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'red',
          }}>
            {!playing && audioRef.current.paused ? `Recording starts in ${countdownDisplay}...` : `Recording starts immediately upon question completion`}
          </p>
        )}

        {error && (
          <div
            onClick={microphone ? null : () => {
              setWaiting(true);
              requestMicrophonePermission();
              setWaiting(false);
            }}
            style={isError ? (
              {
                marginTop: '24px', // Increase top margin for spacing
                padding: '16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '12px', // Larger rounded corners for the error box
                border: '1px solid #F87171',
                color: '#B91C1C',
                cursor: 'pointer',
                maxWidth: '80%', // Adjust width to fit inside the parent container
              }
            ) : (
              {
                marginTop: '24px', // Increase top margin for spacing
                padding: '16px',
                backgroundColor: '#D1FAE5',
                borderRadius: '12px', // Larger rounded corners for the error box
                border: '1px solid #34D399',
                color: '#065F46',
                cursor: 'pointer',
                maxWidth: '80%', // Adjust width to fit inside the parent container
              }
            )}
          >
            <p style={{ margin: '5px' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}