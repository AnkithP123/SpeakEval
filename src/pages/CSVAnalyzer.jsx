import { useState, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

import './styles.css'

// Data processing utilities
const findLocalMinima = (points) => {
    const minima = [];
    const windowSize = Math.max(1, Math.floor(points.length / 200));
    
    for (let i = windowSize; i < points.length - windowSize; i++) {
        const current = points[i];
        let isMinimum = true;
        let isFlat = true;
        
        for (let j = i - windowSize; j <= i + windowSize; j++) {
            if (j !== i && points[j].y <= current.y) {
                isMinimum = false;
                break;
            }
            if (j !== i && points[j].y !== current.y) {
                isFlat = false;
            }
        }
        
        if (isMinimum && !isFlat) {
            minima.push(current);
        }
    }
    
    return minima;
}

const parseCSVData = (csvText) => {
  const lines = csvText.trim().split('\n');
  const trials = [];
  
  const headers = lines[0].split(',');
  const numTrials = headers.length / 2;
  
  for (let i = 0; i < numTrials; i++) {
    trials.push({
      id: i + 1,
      points: [],
      localMinima: []
    });
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    
    for (let j = 0; j < numTrials; j++) {
      const timeIndex = j * 2;
      const forceIndex = j * 2 + 1;
      
      const time = parseFloat(values[timeIndex]);
      const force = parseFloat(values[forceIndex]);
      
      if (!isNaN(time) && !isNaN(force)) {
        trials[j].points.push({ x: time, y: force });
      }
    }
  }
  
  trials.forEach(trial => {
    trial.localMinima = findLocalMinima(trial.points);
  });
  
  return trials;
}

function CSV() {
  const [trials, setTrials] = useState([])
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [selectedPoints, setSelectedPoints] = useState([])
  const fileInputRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result
        const parsedTrials = parseCSVData(text)
        setTrials(parsedTrials)
        setCurrentTrialIndex(0)
        setSelectedPoints(Array(parsedTrials.length).fill(null))
      } catch (error) {
        console.error('Error parsing CSV:', error)
      }
    }
    reader.readAsText(file)
  }

  const handlePointSelect = (point) => {
    const newSelectedPoints = [...selectedPoints]
    newSelectedPoints[currentTrialIndex] = point
    setSelectedPoints(newSelectedPoints)
  }

  const handleDownloadResults = () => {
    const results = selectedPoints
      .map((point, index) => 
        point ? `Trial ${index + 1}: ${point.y.toFixed(4)}` : `Trial ${index + 1}: No point selected`)
      .join('\n')
    
    const blob = new Blob([results], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'selected_points.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrevTrial = () => {
    setCurrentTrialIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextTrial = () => {
    setCurrentTrialIndex((prev) => Math.min(trials.length - 1, prev + 1))
  }

  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    const currentTrial = trials[currentTrialIndex]
    const isMinimum = currentTrial?.localMinima.some(
      (p) => p.x === payload.x && p.y === payload.y
    )
    const isSelected = selectedPoints[currentTrialIndex]?.x === payload.x && 
                      selectedPoints[currentTrialIndex]?.y === payload.y

    if (!isMinimum) return null

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={isSelected ? "#2563eb" : "#9ca3af"}
        stroke="#ffffff"
        strokeWidth={2}
        style={{ cursor: "pointer" }}
        onClick={() => handlePointSelect(payload)}
      />
    )
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Force Measurement Analysis</h2>
          <p className="card-description">
            Upload your CSV file, select local minima points for each trial, and download the results
          </p>
        </div>
        <div className="card-content">
          <div className="button-group">
            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </button>
            {trials.length > 0 && (
              <button
                className="download-button"
                onClick={handleDownloadResults}
              >
                Download Results
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {trials.length > 0 && (
            <>
              <div className="navigation">
                <button
                  className="nav-button"
                  onClick={handlePrevTrial}
                  disabled={currentTrialIndex === 0}
                >
                  Previous Trial
                </button>
                <span className="trial-counter">
                  Trial {currentTrialIndex + 1} of {trials.length}
                </span>
                <button
                  className="nav-button"
                  onClick={handleNextTrial}
                  disabled={currentTrialIndex === trials.length - 1}
                >
                  Next Trial
                </button>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trials[currentTrialIndex].points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      label={{ value: 'Time (s)', position: 'bottom' }}
                    />
                    <YAxis 
                      label={{ value: 'Force (N)', angle: -90, position: 'left' }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="#2563eb"
                      dot={<CustomDot />}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {selectedPoints.some(point => point) && (
                <div className="selected-points">
                  <h3>Selected Points:</h3>
                  <div className="points-grid">
                    {selectedPoints.map((point, index) => (
                      <div key={index} className="point-item">
                        Trial {index + 1}: {point ? point.y.toFixed(4) : 'Not selected'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CSV

