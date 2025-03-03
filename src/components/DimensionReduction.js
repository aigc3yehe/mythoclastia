import React, { useState } from 'react';
import './DimensionReduction.css';

function DimensionReduction({ onBack }) {
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleKeyChange = (e) => {
    setKey(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!key) {
      setError('Please enter a key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Read file content
      const fileContent = await readFileAsText(file);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('key', key);
      formData.append('data', fileContent);

      // Send request
      const response = await fetch('http://43.153.40.155:5001/certificate/generate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzQwODQ4OTA3fQ.Z_NdGyl9P1D3cFDV4auNz3q8klRgarUtc6kHHSk5egc'
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Request failed');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setError('Error submitting data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function: read file content as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
    <div className="dimension-reduction">
      <div className="dimension-header">
        <h2>Dimension Reduction</h2>
        <button className="back-button" onClick={onBack}>Back</button>
      </div>

      <form onSubmit={handleSubmit} className="dimension-form">
        <div className="form-group">
          <label>Select Text File:</label>
          <input 
            type="file" 
            accept=".txt" 
            onChange={handleFileChange} 
            className="file-input"
          />
          {file && <div className="file-info">Selected: {file.name}</div>}
        </div>

        <div className="form-group">
          <label>Enter Key:</label>
          <input 
            type="text" 
            value={key} 
            onChange={handleKeyChange} 
            className="key-input"
            placeholder="Please enter key"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {result && (
        <div className="result-container">
          <h3>Processing Result</h3>
          <div className="result-message">
            {result.message}
          </div>
          {result.data && result.data.certificate && (
            <div className="certificate">
              <h4>Certificate:</h4>
              <pre>{result.data.certificate}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DimensionReduction; 