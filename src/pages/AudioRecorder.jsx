import React, { useState, useRef } from 'react';
import { Play, Square, Repeat } from 'lucide-react';

export default function AudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorder = useRef(null);
    const audioRef = useRef(null);

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

    const playRecording = () => {
        if (audioRef.current) {
        audioRef.current.play();
        }
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
            onClick={isRecording ? stopRecording : startRecording}
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
        {audioURL && (
            <div style={{ marginTop: '20px' }}>
            <audio ref={audioRef} src={audioURL} controls />
            <button
                onClick={playRecording}
                style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
                }}
            >
                <Repeat size={20} /> Play Again
            </button>
            </div>
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