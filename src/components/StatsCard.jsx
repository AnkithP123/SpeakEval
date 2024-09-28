import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaPlay, FaPause, FaRobot } from 'react-icons/fa';

function ProfileCard({ name, code, onGradeUpdate}) {
  const [completed, setCompleted] = useState(false);
  const [text, setText] = useState('');
  const [question, setQuestion] = useState('');
  const [rubric, setRubric] = useState('');
  const [index, setIndex] = useState('');
  const [questionAudioUrl, setQuestionAudioUrl] = useState('');
  const [grades, setGrades] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [aiButtonDisabled, setAiButtonDisabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // New state variable for audio playback

  useEffect(() => {
    if (name.completed) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [name.completed]);

  const fetchAudioData = async () => {
    try {
      const response = await fetch(
        `https://backend-4abv.onrender.com/download?code=${code}&participant=${name.name}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioData], { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name.name}`);
      if (answerAudioPlayer) {
        answerAudioPlayer.src = audioUrl;
      }

      setText('Transcription: ' + data.text);
      setQuestion('Question: ' + data.question);
      setIndex(data.index);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };
  

  const handleDownload = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    await fetchAudioData();
  };

  const handlePlay = async () => {
    if (!name.completed)
      return toast.error('Participant has not completed the task');
    if (text === '') {
      await fetchAudioData();
    }
    try {
      const answerAudioPlayer = document.getElementById(`answerAudioPlayer-${name.name}`);
      if (answerAudioPlayer) {
        if (isPlaying) {
          answerAudioPlayer.pause(); // Pause the audio
          setIsPlaying(false); // Update the playback status
        } else {
          answerAudioPlayer.play(); // Play the audio
          setIsPlaying(true); // Update the playback status
          answerAudioPlayer.addEventListener('ended', () => {
            setIsPlaying(false); // Reset the state when the audio finishes
          });  
        }
      }
    } catch (error) {
      console.error('Error playing answer audio:', error);
    }
  }
  
  const convertOpusToWav = async (opusBlob) => {
    return opusBlob;
  };

  const readRubric = async () => {
    try {
      const response = await fetch(
        `https://backend-4abv.onrender.com/receiveaudio?code=${code}`
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
        `https://backend-4abv.onrender.com/getquestion?code=${code}&index=${index}`
      );
      const data = await response.json();
      if (data.error) return toast.error(data.error);

      return data.audio;
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

  const handleGetGrade = async () => {
    try {
      const response = await fetch(
        `https://backend-4abv.onrender.com/getgrade?transcription=${text}&rubric=${rubric}&code=${code}&index=${index}`
      );
      const data = await response.json();
      
      const grades = data.grades;
      if (!grades || grades === undefined) return toast.error('Error getting grade. This may be due to a high volume of requests. Try again in a few seconds.');
      setGrades(data.grades);

      let total = 0;
      Object.values(grades).forEach((grade) => {
        total += parseFloat(grade);
      });
      setTotalScore(total);

      let categories = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
        return element.split('|:::|')[0];
      });

      onGradeUpdate(name.name, grades, total, categories);

    } catch (error) {
      console.error('Error getting grade:', error);
    }
  }

  useEffect(() => {
    readRubric();
  }, []);

  const handleGradeChange = (index, value) => {
    const updatedGrades = { ...grades, [index]: value };

    let total = 0;
    Object.values(updatedGrades).forEach((grade) => {
      total += parseFloat(grade);
    });
    setTotalScore(total);

    setGrades(updatedGrades);
    
    // Pass the grades and total score to the parent component
    console.log('Updated grades:', updatedGrades);
    let categories = rubric === '' ? [] : rubric.split('|;;|').map((element) => {
      return element.split('|:::|')[0];
    });

    console.log('Updated categories:', categories);
    
    onGradeUpdate(name.name, updatedGrades, total, categories);

  };

  const handleAiButtonClick = () => {

    console.log('CLICKED');

    if (!name.completed)
      return toast.error('Participant has not completed the task');

    if (aiButtonDisabled) return toast.error('Wait 1 second');
    
    // Disable the AI button for 5 seconds
    setAiButtonDisabled(true);
    setTimeout(() => {
      setAiButtonDisabled(false);
    }, 1000);

    handleGetGrade();
  };

  return (
    <div className={`relative flex flex-col items-start px-5 h-auto max-w-[400px] rounded-lg bg-gray-200 m-2 ${completed ? '' : 'text-red-500'}`}>
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
          {isPlaying ? <FaPause /> : <FaPlay />} {/* Render stop button if audio is playing */}
        </button>
        <button
          className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600"
          onClick={handleAiButtonClick}
        >
          <FaRobot />
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
      
      { completed ? 
      <div>
        
      <div className="mt-2 text-gray-800 break-words">
        {question}
      </div>
      {question === '' ? `Press the download button to download this student's audio.` : null}
      <br />
        <div className="mt-2 text-gray-800 break-words">
          {text}
        </div>
        <div className="mt-2 text-gray-800 break-words">
          {rubric !== '' ? rubric.split('|;;|').map((element, index) => {
            const [rubricItem, rubricKey] = element.split('|:::|');
            return (
              <div key={index} className="flex items-center">
                <span className="mr-2">{rubricItem}</span>
                <input
                  type="text"
                  className="border border-gray-300 px-2 py-1 rounded w-20"
                  placeholder="Points"
                  value={grades[index] || ''}
                  onChange={(e) => handleGradeChange(index, e.target.value)}
                />
              </div>
            );
          }) : null}
        </div>
        <div className="mt-2 text-gray-800">
          { rubric !== '' ?
          `Total Score: ${totalScore}` : null
          }
        </div>
      </div>
      : null }
      <audio id={`answerAudioPlayer-${name.name}`} />
      <audio id={`questionAudioPlayer-${name.name}`} />
    </div>
  );
}

export default ProfileCard;
