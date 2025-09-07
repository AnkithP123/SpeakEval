import React from 'react';
import ReactDOM from 'react-dom/client';
import ClassroomApp from './ClassroomApp.jsx';

// Initialize the React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(ClassroomApp));

console.log('SpeakEval Classes app initialized');