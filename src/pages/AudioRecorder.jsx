import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Square, Repeat } from 'lucide-react';

export default function AudioRecorder({code, participant}) {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorder = useRef(null);
    const audioRef = useRef(null);
    let questionIndex;

    const makeResponse = async() =>  {
        const response = await fetch(`https://backend-4abv.onrender.com/receiveaudio?code=${code}&participant=${participant}&number=1`);
        console.log('Response:', response);
        if (!response.ok) {
            return setError('Failed to fetch audio');
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
        setError(null);
        return true;
        } catch (err) {
        console.error('Error requesting microphone permission:', err);
        setError('Microphone access is required. Click here to try again.');
        return false;
        }
    };

    const startRecording = async () => {
        setAudioURL(null);
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) return;

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
        setError('Your browser does not support any of the available audio recording formats.');
        return;
        }

        try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream, { mimeType });
        
        let chunks = [];
        mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.current.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', blob, 'audio.wav');
            Upload(formData);
            console.log('Blob:', blob);
            const audioUrl = URL.createObjectURL(blob);
            setAudioURL(audioUrl);
            setIsRecording(false);
        };

        mediaRecorder.current.start();
        setIsRecording(true);
        
        setTimeout(() => {
            stopRecording();
        }, 15000);
        } catch (err) {
        console.error('Error starting recording:', err);
        setError('An error occurred while starting the recording. Please try again.');
        }
    };

    const Upload = async(formData) => {
        let transcriptionResult = {textContent: ""};
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
                        return;
                    }

                    if (transcriptionResult.textContent == 'Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.')
                        transcriptionResult.textContent = '';

                    transcriptionResult.textContent = transcriptionResult.textContent + 'Uploaded to server successfully. Tentative transcription: ' + data.transcription;

                    clearInterval(statusInterval);

                    setTimeout(() => {
                        const popupWindow = window.open(`feedback?name=${participant}&code=${code}`, 'Feedback', 'width=600,height=400');
                        if (popupWindow) {
                            popupWindow.focus();
                        }    
                    }, 3000);

                    return;

                }
            }, 10000);
        }

        const data = await response.json();

        console.log('Response:', data);

        if (data.error) {
            transcriptionResult.textContent = data.error;
            return;
        }

        if (transcriptionResult.textContent === 'Processing... This may take anywhere from 10 seconds to a few minutes depending on how many other students are ahead in the queue.')
            transcriptionResult.textContent = '';

        if (transcriptionResult.textContent === 'You reached the time limit and your audio was stopped and uploaded automatically. It may take anywhere from 10 seconds to a few minutes to process your audio depending on how many other students are ahead in the queue.') 
            transcriptionResult.textContent = '';

        transcriptionResult.textContent = transcriptionResult.textContent + 'Uploaded to server successfully. Tentative transcription: ' + data.transcription;
    }

    const playRecording = async() => {
        const audio = await makeResponse();
        console.log("Audio: " + audio);
        audio.play();
        setTimeout(() => {
            startRecording();
        }, 5000);
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
        }
    }

    return (
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '20px',
        textAlign: 'center'
        }}>
        <button
            onClick={isRecording ? stopRecording : playRecording}
            style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            backgroundColor: isRecording ? '#EF4444' : '#10B981',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s',
            }}
        >
            {isRecording ? <Square size={64} color="white"/> : <Play size={64} color="white" />}
        </button>
        {isRecording && (     
            <p style={{
                marginTop: '16px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
            }}>
                Recording... (15s)
            </p>
        )}
        {error && (
            <div 
            onClick={requestMicrophonePermission}
            style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '4px',
                border: '1px solid #F87171',
                color: '#B91C1C',
                cursor: 'pointer'
            }}
            >
            <p style={{ margin: 0 }}>{error}</p>
            </div>
        )}
        </div>
    );
}