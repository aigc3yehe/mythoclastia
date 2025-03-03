import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import LoadingScreen from './components/LoadingScreen';
import GameDataDisplay from './components/GameDataDisplay';
import { GameProvider, useGame } from './contexts/GameContext';
import AdminTerminal from './components/AdminTerminal';
import './App.css';

// Create internal game component
function GameContent() {
  const [gameState, setGameState] = useState('start');
  const [loadingStages, setLoadingStages] = useState({
    worldBuilding: false,
    characterGen: false,
    imageGen: false
  });
  const [imageGenerated, setImageGenerated] = useState(false);
  const [imageGenerationStarted, setImageGenerationStarted] = useState(false);
  const { updateGameData, gameData, updateBattleData } = useGame();
  const [isBattleLoading, setIsBattleLoading] = useState(false);

  const handleGameStart = async (prompt) => {
    // Check if there is cached data
    if (gameData && 
        gameData.worldBackground.mainDescription && 
        gameData.teamMembers.A && 
        gameData.teamMembers.B) {
      console.log('[Game] Using cached game data');
      setLoadingStages({
        worldBuilding: true,
        characterGen: true,
        imageGen: !!gameData.imageGeneration.generatedImageUrl
      });
      setImageGenerated(!!gameData.imageGeneration.generatedImageUrl);
      setGameState('display');
      return;
    }

    // Check if OpenAI API key is provided
    let apiKey = gameData?.openaiApiKey;
    if (!apiKey) {
      // Try to get from localStorage directly
      apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        alert('Please set your OpenAI API key in the Admin Terminal Settings tab before starting the game.');
        return;
      } else {
        console.log('[Game] Using API key from localStorage');
      }
    }

    // If no cached data, request new data
    setGameState('loading');
    setImageGenerated(false);
    setImageGenerationStarted(false);
    setLoadingStages({
      worldBuilding: false,
      characterGen: false,
      imageGen: false
    });

    try {
      const response = await fetch(
        "http://47.80.4.197:30410/api/v1/run/worldgen?stream=false",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY",
            "Content-Type": "application/json",
            "x-api-key": "sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY"
          },
          body: JSON.stringify({
            output_type: "text",
            input_type: "chat",
            tweaks: {
              "ChatInput-67xYC": {
                "background_color": "",
                "chat_icon": "",
                "files": "",
                "input_value": prompt,
                "sender": "User",
                "sender_name": "User",
                "session_id": "",
                "should_store_message": true,
                "text_color": ""
              },
              "Agent-v4dKT": {
                "add_current_date_tool": true,
                "agent_description": "A helpful assistant with access to the following tools:",
                "agent_llm": "OpenAI",
                "api_key": apiKey,
                "handle_parsing_errors": true,
                "input_value": "",
                "json_mode": false,
                "max_iterations": 15,
                "max_tokens": null,
                "model_kwargs": {},
                "model_name": "gpt-4o",
                "n_messages": 100,
                "openai_api_base": "",
                "order": "Ascending",
                "seed": 1,
                "sender": "Machine and User",
                "sender_name": "",
                "session_id": "",
                "temperature": 0.1,
                "template": "{sender_name}: {text}",
                "verbose": true
              },
              "Agent-6q0fl": {
                "add_current_date_tool": true,
                "agent_description": "A helpful assistant with access to the following tools:",
                "agent_llm": "OpenAI",
                "api_key": apiKey,
                "handle_parsing_errors": true,
                "input_value": "",
                "json_mode": false,
                "max_iterations": 15,
                "max_tokens": null,
                "model_kwargs": {},
                "model_name": "gpt-4o",
                "n_messages": 100,
                "openai_api_base": "",
                "order": "Ascending",
                "seed": 1,
                "sender": "Machine and User",
                "sender_name": "",
                "session_id": "",
                "skills": "",
                "temperature": 0.1,
                "template": "{sender_name}: {text}",
                "verbose": true
              },
              "coTextOutput-YcvTH": {
                "input_value1": "",
                "input_value2": ""
              },
              "TextInput-OzwFY": {
                "input_value": ""
              }
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Print full response data
      console.log('[API Response] Full response data:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Print formatted data
      console.log('[API Response] Data:', JSON.stringify(data, null, 2));

      // Print data structure
      console.log('[API Response] Data structure:', {
        hasOutputs: !!data?.outputs,
        outputsLength: data?.outputs?.length,
        firstOutput: data?.outputs?.[0],
        nestedOutputs: data?.outputs?.[0]?.outputs,
        results: data?.outputs?.[0]?.outputs?.[0]?.results
      });

      updateGameData(data);
      setLoadingStages(prev => ({
        ...prev,
        worldBuilding: true,
        characterGen: true
      }));
    } catch (error) {
      console.error('[Game] Error generating game:', error);
      alert('Failed to obtain game data, please try again');
      setGameState('start');
    }
  };

  const handleImageGenComplete = () => {
    if (imageGenerated) return;
    
    console.log('[Game] Image generation completed');
    setLoadingStages(prev => ({ ...prev, imageGen: true }));
    setImageGenerated(true);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log('[Game] Transitioning to display state');
        setGameState('display');
      }, 1000);
    });
  };

  const handleBattleGeneration = async () => {
    // Check if OpenAI API key is provided
    let apiKey = gameData?.openaiApiKey;
    if (!apiKey) {
      // Try to get from localStorage directly
      apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        alert('Please set your OpenAI API key in the Admin Terminal Settings tab before generating battles.');
        return;
      } else {
        console.log('[Battle] Using API key from localStorage');
      }
    }

    setIsBattleLoading(true);
    try {
      const response = await fetch(
        "http://47.80.4.197:30410/api/v1/run/rounds?stream=false",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY",
            "Content-Type": "application/json",
            "x-api-key": "sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY"
          },
          body: JSON.stringify({
            output_type: "chat",
            input_type: "chat",
            tweaks: {
              "ChatInput-YHscT": {
                "background_color": "",
                "chat_icon": "",
                "files": "",
                "input_value": gameData?.worldBackground?.mainDescription,
                "sender": "User",
                "sender_name": "User",
                "session_id": "",
                "should_store_message": true,
                "text_color": ""
              },
              "CombineText-558hU": {
                "delimiter": " ",
                "text1": "",
                "text2": ""
              },
              "ChatOutput-aLgMk": {
                "background_color": "",
                "chat_icon": "",
                "data_template": "{text}",
                "input_value": "",
                "sender": "Machine",
                "sender_name": "AI",
                "session_id": "",
                "should_store_message": true,
                "text_color": ""
              },
              "OpenAIModel-xYotQ": {
                "api_key": apiKey,
                "input_value": "",
                "json_mode": false,
                "max_tokens": null,
                "model_kwargs": {},
                "model_name": "gpt-4o",
                "openai_api_base": "",
                "seed": 1,
                "stream": false,
                "system_message": "",
                "temperature": 0.17
              },
              "OpenAIModel-fQIKw": {
                "api_key": apiKey,
                "input_value": "",
                "json_mode": false,
                "max_tokens": null,
                "model_kwargs": {},
                "model_name": "gpt-4o",
                "openai_api_base": "",
                "seed": 1,
                "stream": false,
                "system_message": "",
                "temperature": 0.17
              }
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      updateBattleData(data);
      return data;
    } catch (error) {
      console.error('[Battle] Error generating battle:', error);
      throw error;
    } finally {
      setIsBattleLoading(false);
    }
  };

  // Listen for game state changes
  useEffect(() => {
    console.log('[Game] Game state changed:', gameState);
  }, [gameState]);

  // Listen for loading stages changes
  useEffect(() => {
    console.log('[Game] Loading stages updated:', loadingStages);
  }, [loadingStages]);

  return (
    <div className="App">
      {gameState === 'start' && <StartScreen onStart={handleGameStart} />}
      {gameState === 'loading' && (
        <>
          <LoadingScreen stages={loadingStages} />
          {!imageGenerated && !imageGenerationStarted && (
            <div style={{ display: 'none' }}>
              <GameDataDisplay 
                onImageGenComplete={handleImageGenComplete}
                shouldGenerateImage={true}
                onGenerationStart={() => setImageGenerationStarted(true)}
                onBattleRequest={handleBattleGeneration}
                isBattleLoading={isBattleLoading}
              />
            </div>
          )}
        </>
      )}
      {gameState === 'display' && (
        <GameDataDisplay 
          shouldGenerateImage={false}
          onBattleRequest={handleBattleGeneration}
          isBattleLoading={isBattleLoading}
        />
      )}
      <AdminTerminal />
    </div>
  );
}

// Main App component
function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}

export default App; 