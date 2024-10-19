import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Square, Repeat } from 'lucide-react';
import styled, { css, keyframes } from "styled-components";

export default function AudioRecorder({code, participant}) {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [isError, setIsError] = useState(true);
    const [microphone, setMicrophone] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [finished, setFinished] = useState(false);
    const [playing, setPlaying] = useState(false);
    const countdownRef = useRef(0); // Use ref for countdown
    const [countdownDisplay, setCountdownDisplay] = useState(0); // State for displaying countdown
    const timer = useRef(0); // New ref for timer
    const statusInterval = useRef(null);
    const mediaRecorder = useRef(null);
    const audioRef = useRef(null);
    const [displayTime, setDisplayTime] = useState('xx:xx'); // State for displaying formatted time
    let questionIndex;

    // set the status interval
    
    useEffect(() => {
        statusInterval.current = setInterval(sendStatus, 1000);
        return () => clearInterval(statusInterval.current);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Only decrement if the current timer is greater than zero
            if (timer.current > 0) {
                timer.current -= 1000;  // Decrease by 1 second
                setDisplayTime(formatTime(timer.current));
            }
            // Display default if timer hits zero
            if (timer.current <= 0) {
                setDisplayTime('xx:xx');
            }
        }, 1000);
    
        return () => clearInterval(interval);
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
        }`;

    const animation = props => css`
    ${pulse} 1.1s infinite;`;

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

async function convertOggToWav(oggUrl) {
    const response = await fetch(oggUrl);
    const arrayBuffer = await response.arrayBuffer();
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
        if (mediaRecorder.current && mediaRecorder.current.state === 'inactive' && !playing && !isRecording) {
            timer.current = 0;
            return;
        }

        const response = await fetch(`https://backend-4abv.onrender.com/check_status?code=${code}&participant=${participant}`);
        if (!response.ok) {
            setError('Failed to fetch status');
            setIsError(true);
            return;
        }

        const data = await response.json();

        console.log('Response:', data);

        const responseCode = data.code;

        if (data.time) {
            updateTimer(data.time);
        }
        console.log('Response code:', responseCode);
        switch (responseCode) {
            case 1:
                window.location.href = 'join-room';
                break;
            case 2:
                window.location.href = 'join-room';
                break;
            case 3:
                break;
            case 4:
                window.location.href = 'join-room';
                break;
            case 5:
                if (error == 'Reaching time limit. Please finish your response in the next 5 seconds. ') {setError('You reached the time limit and your audio was stopped and uploaded automatically. It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue.'); setIsError(false)}
                stopRecording();
                break;
            case 6:
                if ((!(error == 'Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.') && (!error || error === null || !(error.includes('Uploaded to server successfully.'))))) {
                    setError('Reaching time limit. Please finish your response in the next 5 seconds. ');
                    
                    setIsError(true);
                }
                break;
            case 7:
                window.location.href = `https://www.speakeval.org/record?code=${data.newRoomCode}&participant=${participant}`;
                break;
            default:
                window.location.href = 'join-room';
                break;
        }
    }

    const makeResponse = async() =>  {
        const response = await fetch(`https://backend-4abv.onrender.com/receiveaudio?code=${code}&participant=${participant}&number=1`);
        if (!response.ok) {
            setError('Failed to fetch audio');
            setIsError(true);
            return;
        }

        const receivedData = await response.json();

        console.log('Received data:', receivedData.audios);

        const audios = receivedData.audios;

        let audio;

        for (const data of audios) {

            console.log('Response:', data);

            const audioData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            const blob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
            const audioUrl = URL.createObjectURL(blob);

            audio = new Audio(audioUrl);

            console.log("Audio: " + audio);

            questionIndex = receivedData.questionIndex;
        }

        return audio;

    }

    let audio;

    const getAudio = async() => {
        await sendStatus();
        const audio2 = await makeResponse();

        if (audio) {
            console.log('HI');
            audio.src = audio2.src;
        } else
            audio = audio2;
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
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophone(true);
        setError(null);
        return true;
        } catch (err) {
        console.error('Error requesting microphone permission:', err);
        setError('Microphone access is required. Click here to try again.');
        setIsError(true);
        return false;
        }
    };

    let chunks = [];

    function blobToBase64(blob) {
        return new Promise((resolve, _) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

    const startRecording = async () => {
        setIsRecording(true);
        setAudioURL(null);
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) return;

        await fetch(`https://backend-4abv.onrender.com/started_playing_audio?code=${code}&participant=${participant}`);

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
        setError('Your browser does not support any of the available audio recording formats.');
        setIsError(true);
        return;
        }

        try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

        mediaRecorder.current.start();

      
        } catch (err) {
        console.error('Error starting recording:', err);
        setError('An error occurred while starting the recording. Please try again.');
        setIsError(true);
        }
    };

    const upload = async(formData) => {
        setError('Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.');
        setIsError(false);
        let transcriptionResult = {textContent: ""};

        setTimeout(() => {
            const popupWindow = window.open(`feedback?name=${participant}&code=${code}`, 'Feedback', 'width=600,height=400');
            if (popupWindow) {
                popupWindow.focus();
                alert('Your audio upload has started, and you may leave this page without impairing the process. Please provide any feedback about your experience.');
            } else {
                if (confirm('Your audio upload has started, and you may leave this page without impairing the process. Would you like to redirect to another page to provide feedback about your experience?')) {
                    window.location.href = `feedback?name=${participant}&code=${code}`;
                }
                
            }
        }, 3000);

        sendStatus();

        statusInterval.current = setInterval(sendStatus, 1000);

        let response = await fetch(`https://backend-4abv.onrender.com/upload?code=${code}&participant=${participant}&index=${questionIndex}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            transcriptionResult.textContent = 'Failed to upload audio. Retrying until success...';
            const retryInterval = setInterval(async () => {
                let retryResponse = await fetch(`https://backend-4abv.onrender.com/upload?code=${code}&participant=${participant}&index=${questionIndex}`, {
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

    const playRecording = async() => {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) return;
        if (!audio) {
            const audio2 = await makeResponse();
            console.log('HEY');

            const url = audio2.src;

            const wavBlob = await convertOggToWav(url);

            const audioUrl = URL.createObjectURL(wavBlob);

            audio = new Audio(audioUrl);
    
        }
        audio.play().then(() => {
            console.log('Playing...');
        }).catch((err) => {
            console.error('Error playing audio:', err);
            setError('An error occurred while playing the audio. Please try again.');
            setIsError(true);
        });
        setPlaying(true);

        audio.onended = () => {
            setFinished(true);
            setPlaying(false);
            // Countdown logic
            countdownRef.current = 5;
            setCountdownDisplay(countdownRef.current);
            const countdownInterval = setInterval(() => {
                countdownRef.current -= 1;
                setCountdownDisplay(countdownRef.current);
                if (countdownRef.current === 0) {
                    clearInterval(countdownInterval);
                    setFinished(false);
                    startRecording();        
                }
            }, 1000);
        }
    };

    const stopRecording = () => {
        console.log('Stopping recording...');
        setFinished(true);
        setIsRecording(false);
        
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
        }
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
        const seconds = Math.floor((time % 60000) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#bfdbfe',
            alignItems: 'center',
            justifyContent: 'center',
            //transform: 'translateY(-10%)',
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
                { finished ? (null) : (
                <PulseButton
                    onClick={isRecording ? stopRecording : playRecording}
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
                    {isRecording ? null : <Play size={24} color="white" fill="white"/>}
                </PulseButton>
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

                {playing && (
                    <p style={{
                        marginTop: '18px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#28a745',
                    }}>
                        Playing...
                    </p>
                )}

                {countdownDisplay > 0 && (
                    <p style={{
                        marginTop: '16px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'red',
                    }}>
                        Recording starts in {countdownDisplay}...
                    </p>
                )}
                
                {error && (
                    <div 
                        onClick={microphone ? (null) : (requestMicrophonePermission)}
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
