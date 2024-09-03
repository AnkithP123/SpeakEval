import React, { useState, useEffect } from 'react';

const AudioPlayer = () => {
    const [playDisabled, setPlayDisabled] = useState(true);
    const [media, setMedia] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcriptionResult, setTranscriptionResult] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');

    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMedia(stream);
                setPlayDisabled(false);
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
        };

        initializeMedia();

        return () => {
            if (media) {
                media.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleCountdownClick = () => {
        if (playDisabled) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    setPlayDisabled(false);
                })
                .catch((error) => console.error('Error accessing microphone:', error));
        }
    };

    const handlePlayButtonClick = () => {
        if (playDisabled) {
            setTranscriptionResult('Please allow microphone access to proceed.');
            return;
        }

        const audio = new Audio('https://cdn.discordapp.com/attachments/1015856567830192168/1279137744471462009/question2.m4a?ex=66d74ddb&is=66d5fc5b&hm=e36f15d7292f9d71768a4b3ff253ff6c534f2c89346286a5763361867b7b48be&');
        audio.play();
        setTranscriptionResult('Playing...');

        audio.addEventListener('ended', () => {
            startCountdown(5);
        });
    };

    const startCountdown = (seconds) => {
        setPlayDisabled(true);
        let remainingTime = seconds;
        setTranscriptionResult(`Recording in: ${remainingTime}`);

        const countdownInterval = setInterval(() => {
            remainingTime--;
            setTranscriptionResult(`Recording in: ${remainingTime}`);

            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                startRecording();
                setTranscriptionResult('Recording...');
            }
        }, 1000);
    };

    const startRecording = () => {
        media
            .then((stream) => {
                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: 'audio/wav' });
                    setAudioBlob(blob);
                    handleRecordingStop();
                };

                mediaRecorder.start();
            })
            .catch((error) => console.error('Error accessing microphone:', error));
    };

    const handleRecordingIconClick = () => {
        if (media && media.state === 'recording') {
            media.stop();
        }
    };

    const handleRecordingStop = async () => {
        setTranscriptionResult('Processing...');
        await sendAudio();
        // await gradeAnswer(); // Proceed with transcription and grading
    };

    const sendAudio = async () => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');

        const response = await fetch('https://backend-8zsz.onrender.com/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload audio');
        }

        const data = await response.json();

        console.log('Response:', data);

        if (data.error) {
            setTranscriptionResult(data.error);
            return;
        }

        setTranscriptionResult(`Uploaded to server successfully. Tentative transcription: ${data.transcription.text}`);
    };

    const sendStatus = async () => {
        const response = await fetch('https://backend-8zsz.onrender.com/check_status');

        if (!response.ok) {
            throw new Error('Failed to get status');
        }

        const data = await response.json();

        console.log('Response:', data);

        const responseCode = data.code;

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
                break;
            default:
                window.location.href = 'join-room';
                break;
        }
    };

    useEffect(() => {
        sendStatus();
        const statusInterval = setInterval(sendStatus, 1000);

        return () => {
            clearInterval(statusInterval);
        };
    }, []);

    const gradeAnswer = async () => {
        const apiKey = 'YOUR_API_KEY';
        const question = '¿Qué haces los fines de semana?';

        const formData = new FormData();
        formData.append('file', audioBlob, 'answer.wav');
        formData.append('model', 'whisper-1');
        formData.append('task', 'transcribe');

        try {
            const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData,
            });

            if (!transcriptionResponse.ok) {
                throw new Error('Failed to transcribe audio');
            }

            const transcription = await transcriptionResponse.json();

            console.log(transcriptionResponse);

            const transcriptedAnswer = transcription.text || '[No answer provided]';

            console.log('Transcripted answer:', transcriptedAnswer);

            const language = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are an AI designed to classify the language of some text. You will be shown a text, and you will have to determine if it is in English or not. If it is in English, you will respond with "English". If it is not in English, you will respond with "Not English". You may only respond with English or Not English' },
                        { role: 'user', content: `The following is the student's response to the question: ${transcriptedAnswer}. Is this response in English?` },
                    ],
                }),
            });

            if (!language.ok) {
                throw new Error('Failed to classify the language');
            }

            const languageData = await language.json();

            const detectedLanguage = languageData.choices[0].message.content.trim();

            console.log('Language classification:', detectedLanguage);

            setDetectedLanguage(detectedLanguage);

            if (detectedLanguage === 'English') {
                setTranscriptionResult('The student responded in English. No grading will be done.');
                return;
            }

            // Rest of the grading logic...

        } catch (error) {
            console.error('Error:', error);
            setTranscriptionResult('Failed to grade the response.');
        }
    };

    return (
        <div>
            <h2>Oral Exam Assistant</h2>
            <button onClick={handlePlayButtonClick} disabled={playDisabled}>Play</button>
            <div>{transcriptionResult}</div>
            <div>{detectedLanguage}</div>
            <button onClick={handleCountdownClick}>Countdown</button>
            <button onClick={handleRecordingIconClick}>Stop Recording</button>
        </div>
    );
};

export default AudioPlayer;
