import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import DimensionReduction from './DimensionReduction';
import './AdminTerminal.css';

const GameDataViewer = ({ data }) => (
  <details>
    <summary>Game Save Data</summary>
    <pre className="response-content">
      {JSON.stringify(data, null, 2)}
    </pre>
  </details>
);

const BattleDataViewer = ({ battleInstance }) => {
  if (!battleInstance) return null;
  
  return (
    <details>
      <summary>Battle Instance Data</summary>
      <div className="battle-debug-info">
        <div className="status-info">
          <span className="label">Status:</span>
          <span className={`value status-${battleInstance.status}`}>
            {battleInstance.status || 'unknown'}
          </span>
        </div>
        <pre className="response-content">
          {JSON.stringify(battleInstance, null, 2)}
        </pre>
      </div>
    </details>
  );
};

const APIResponseViewer = ({ responseData }) => {
  if (!responseData) return null;

  return (
    <details>
      <summary>Latest API Response</summary>
      <div className="api-response-info">
        <div className="timestamp">
          Received at: {new Date().toLocaleTimeString()}
        </div>
        <pre className="response-content">
          {JSON.stringify(responseData, null, 2)}
        </pre>
      </div>
    </details>
  );
};

function AdminTerminal() {
  const { gameData, resetGame, clearBattleHistory, updateOpenAIApiKey, updateImageGenerationToken } = useGame();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('gameData');
  const [showDimensionReduction, setShowDimensionReduction] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [imageToken, setImageToken] = useState('');

  // Add debug log
  console.log('[Admin Terminal] World Background:', gameData?.worldBackground);
  console.log('[Admin Terminal] Current API Key:', gameData?.openaiApiKey);
  console.log('[Admin Terminal] Current Image Token:', gameData?.imageGenToken);

  // Update apiKey when component mounts or gameData changes
  useEffect(() => {
    if (gameData?.openaiApiKey) {
      console.log('[Admin Terminal] Setting API key from gameData:', gameData.openaiApiKey);
      setApiKey(gameData.openaiApiKey);
    } else {
      // Try to get from localStorage directly as a fallback
      const savedKey = localStorage.getItem('openai_api_key');
      if (savedKey) {
        console.log('[Admin Terminal] Setting API key from localStorage:', savedKey);
        setApiKey(savedKey);
        // Also update the game context
        updateOpenAIApiKey(savedKey);
      }
    }

    // Update imageToken from gameData or localStorage
    if (gameData?.imageGenToken) {
      console.log('[Admin Terminal] Setting image token from gameData:', gameData.imageGenToken);
      setImageToken(gameData.imageGenToken);
    } else {
      // Try to get from localStorage directly as a fallback
      const savedToken = localStorage.getItem('image_gen_token');
      if (savedToken) {
        console.log('[Admin Terminal] Setting image token from localStorage:', savedToken);
        setImageToken(savedToken);
        // Also update the game context
        updateImageGenerationToken(savedToken);
      }
    }
  }, [gameData, updateOpenAIApiKey, updateImageGenerationToken]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all data.')) {
      resetGame();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear battle history?')) {
      clearBattleHistory();
    }
  };

  const handleSaveApiKey = () => {
    updateOpenAIApiKey(apiKey);
    alert('OpenAI API Key saved successfully!');
  };

  const handleClearApiKey = () => {
    if (window.confirm('Are you sure you want to clear your OpenAI API key?')) {
      setApiKey('');
      updateOpenAIApiKey('');
      alert('OpenAI API key has been cleared.');
    }
  };

  const handleSaveImageToken = () => {
    updateImageGenerationToken(imageToken);
    alert('Image Generation Token saved successfully!');
  };

  const handleClearImageToken = () => {
    if (window.confirm('Are you sure you want to clear your Image Generation Token?')) {
      setImageToken('');
      updateImageGenerationToken('');
      alert('Image Generation Token has been cleared.');
    }
  };

  if (showDimensionReduction) {
    return <DimensionReduction onBack={() => setShowDimensionReduction(false)} />;
  }

  if (!isExpanded) {
    return (
      <div className="admin-terminal-toggle" onClick={() => setIsExpanded(true)}>
        [Admin]
      </div>
    );
  }

  return (
    <div className="admin-terminal">
      <div className="admin-header">
        <h3>Admin Terminal</h3>
        <button onClick={() => setIsExpanded(false)}>Close</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'gameData' ? 'active' : ''} 
          onClick={() => setActiveTab('gameData')}
        >
          Game Data
        </button>
        <button 
          className={activeTab === 'battleHistory' ? 'active' : ''} 
          onClick={() => setActiveTab('battleHistory')}
        >
          Battle History
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'gameData' ? (
          <pre>{JSON.stringify(gameData, null, 2)}</pre>
        ) : activeTab === 'battleHistory' ? (
          <div className="battle-history">
            <div className="battle-history-header">
              <h4>Battle Process History</h4>
              <button onClick={handleClearHistory}>Clear History</button>
            </div>
            {gameData.battleProcessHistory?.map((entry, index) => (
              <div key={index} className="battle-entry">
                <div className="battle-entry-header">
                  <span>Round {entry.gameRound} - Sub Round {entry.subRound}</span>
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <pre className="battle-process">{entry.process}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-panel">
            <div className="setting-item">
              <label htmlFor="openai-api-key">OpenAI API Key:</label>
              <div className="api-key-input">
                <input
                  type="password"
                  id="openai-api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                />
                <button onClick={handleSaveApiKey}>Save Key</button>
                <button onClick={handleClearApiKey}>Clear Key</button>
              </div>
              <p className="api-key-info">
                Your API key is required to generate the game world and battles.
                Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a>.
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="image-gen-token">Image Generation Token:</label>
              <div className="api-key-input">
                <input
                  type="password"
                  id="image-gen-token"
                  value={imageToken}
                  onChange={(e) => setImageToken(e.target.value)}
                  placeholder="Enter your Image Generation Token"
                />
                <button onClick={handleSaveImageToken}>Save Token</button>
                <button onClick={handleClearImageToken}>Clear Token</button>
              </div>
              <p className="api-key-info">
                This token is required for generating game images. If not provided, ASCII art will be used instead.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="admin-footer">
        <button onClick={handleReset} className="reset-button">
          Reset Game
        </button>
        <button 
          onClick={() => setShowDimensionReduction(true)} 
          className="dimension-button"
        >
          Dimension Reduction
        </button>
      </div>
    </div>
  );
}

export default AdminTerminal; 