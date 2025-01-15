import React from 'react';
import { FaMicrophoneSlash, FaCompass, FaDoorOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>  
        <FaMicrophoneSlash size={100} color="#E74C3C" style={styles.icon} />

        <h1 style={styles.title}>Lost in Translation?</h1>
        <h2 style={styles.message}>404: Page Not Found</h2>
      </div>

      <p style={styles.subtext}>The page you’re looking for doesn’t seem to exist. Maybe it took a break after too much talking?</p>

      <div style={styles.optionsContainer}>
        <button 
          style={styles.button} 
          onClick={() => navigate('/')}
        >
          <FaCompass style={styles.buttonIcon} /> Go to Homepage
        </button>

        <button 
          style={styles.button} 
          onClick={() => navigate(-1)}
        >
          <FaDoorOpen style={styles.buttonIcon} /> Back to Previous Page
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'blue-200',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  icon: {
    marginBottom: '10px',
  },
  title: {
    fontSize: '2.5rem',
    color: '#333',
    marginBottom: '10px',
  },
  message: {
    fontSize: '1.5rem',
    color: '#555',
    marginBottom: '20px',
  },
  subtext: {
    fontSize: '1rem',
    color: '#777',
    marginBottom: '30px',
  },
  optionsContainer: {
    display: 'flex',
    gap: '15px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 20px',
    fontSize: '1rem',
    color: '#FFF',
    backgroundColor: '#3498DB',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonIcon: {
    marginRight: '8px',
  },
  buttonHover: {
    backgroundColor: '#2980B9',
  },
};

export default NotFoundPage;
