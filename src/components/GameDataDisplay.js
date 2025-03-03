import React, { useEffect, useState, useRef, useCallback } from 'react';
import './GameDataDisplay.css';
import { FaInfoCircle, FaImage } from 'react-icons/fa'; // 移除 FaScroll
import { useGame } from '../contexts/GameContext';
import { createImageService } from '../services/imageGenerationService';
import TeamMembers from './TeamMembers';
import BattleScreen from './BattleScreen';
import { INITIAL_GAME_STATE } from '../contexts/GameContext';

// 修改 ImageDisplay 组件
const ImageDisplay = ({ url, isLoading, onImageLoad, noToken }) => {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 2000; // 2秒后重试

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setLoadError(false);
    onImageLoad?.();
  }, [onImageLoad]);

  const handleError = useCallback(() => {
    setLoadError(true);
    setLoaded(false);
    if (retryCount < maxRetries) {
      console.log(`[Image] Scheduling retry ${retryCount + 1} of ${maxRetries}`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, retryDelay);
    }
  }, [retryCount]);

  // 重置状态
  useEffect(() => {
    if (url) {
      setLoaded(false);
      setLoadError(false);
      setRetryCount(0);
    }
  }, [url]);

  // ASCII art placeholder for world image
  const getWorldAsciiArt = () => {
    return (
      <div className="ascii-world-art">
        {`
     /\\
    /  \\
   /    \\
  /      \\
 /        \\
/          \\
------------
|  FANTASY |
|   WORLD  |
|          |
|  No token|
|  provided|
------------
        `}
      </div>
    );
  };

  return (
    <div className="image-container">
      {isLoading && !noToken && (
        <div className="image-loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Generating image...</div>
        </div>
      )}
      
      {!loaded && !loadError && !isLoading && !noToken && (
        <div className="loading-text">Loading image...</div>
      )}
      
      {loadError && !noToken && (
        <div className="image-error-container">
          <div className="error-text">
            {retryCount < maxRetries 
              ? `Loading failed. Retrying... (${retryCount + 1}/${maxRetries})`
              : "Failed to load image after multiple attempts"}
          </div>
        </div>
      )}
      
      {noToken && (
        <div className="no-token-container">
          {getWorldAsciiArt()}
          <div className="no-token-message">
            No image generation token provided. Using ASCII art instead.
          </div>
        </div>
      )}
      
      {url && !noToken && (
        <img 
          src={url}
          alt="Generated World"
          className={`world-image ${loaded ? 'loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: loaded ? 'block' : 'none' }}
        />
      )}
    </div>
  );
};

function GameDataDisplay({ 
  onImageGenComplete, 
  shouldGenerateImage, 
  onGenerationStart
}) {
  const { gameData, updateGameData, updateBattleData } = useGame();
  const [imageUrl, setImageUrl] = useState(null);
  const [avatarUrls, setAvatarUrls] = useState({ A: null, B: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isBattleMode, setIsBattleMode] = useState(false);
  const [isSearchingEnemy, setIsSearchingEnemy] = useState(false);
  const [noToken, setNoToken] = useState(false);
  const imageServiceRef = useRef(null);
  const generationRequestRef = useRef(false);

  // 确保 battleInstance 总是有一个有效值
  const battleInstance = gameData?.battleInstance || {
    status: null,
    error: null,
    currentRound: 0,
    totalRounds: 0,
    rounds: [],
    ...INITIAL_GAME_STATE.battleInstance
  };
  const teamMembers = gameData?.teamMembers || INITIAL_GAME_STATE.teamMembers;

  const generateImage = useCallback(async () => {
    if (!imageServiceRef.current || !gameData?.imageGeneration?.prompt || isGenerating) {
      console.log('[Generate Image] Conditions not met:', {
        hasService: !!imageServiceRef.current,
        hasPrompt: !!gameData?.imageGeneration?.prompt,
        isGenerating
      });
      return;
    }

    setIsGenerating(true);
    setNoToken(false);
    console.log('[Generate Image] Starting with prompt:', gameData.imageGeneration.prompt);

    try {
      // Generate world image
      const worldRequestId = await imageServiceRef.current.generateImage(gameData.imageGeneration.prompt);
      console.log('[Generate Image] World Request ID:', worldRequestId);

      // Check if we got a noToken response
      if (worldRequestId && typeof worldRequestId === 'object' && worldRequestId.noToken) {
        console.log('[Generate Image] No token available, using ASCII placeholder');
        setNoToken(true);
        // Still call onImageGenComplete to continue the game flow
        await generateAvatars();
        onImageGenComplete?.();
        return;
      }

      const newImageUrl = await imageServiceRef.current.startPolling(worldRequestId);
      
      // Check if we got a noToken response during polling
      if (newImageUrl && typeof newImageUrl === 'object' && newImageUrl.noToken) {
        console.log('[Generate Image] No token available during polling, using ASCII placeholder');
        setNoToken(true);
        // Still call onImageGenComplete to continue the game flow
        await generateAvatars();
        onImageGenComplete?.();
        return;
      }
      
      console.log('[Generate Image] World Image URL:', newImageUrl);

      if (newImageUrl) {
        setImageUrl(newImageUrl);
        updateGameData({
          imageGeneration: {
            ...gameData.imageGeneration,
            generatedImageUrl: newImageUrl
          }
        });

        // Generate avatars for team members
        await generateAvatars();
        onImageGenComplete?.();
      } else {
        throw new Error('World image URL not found');
      }
    } catch (error) {
      console.error('[Generate Image] Error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [gameData, isGenerating, updateGameData, onImageGenComplete]);

  const generateAvatars = async () => {
    console.log('[Generate Avatar] Starting avatar generation');
    
    // 分别处理每个队员的头像生成
    for (const member of ['A', 'B']) {
      const portraitData = gameData.teamMembers[member]?.portrait;
      if (!portraitData) {
        console.log(`[Generate Avatar] No portrait data for member ${member}, skipping`);
        continue;
      }

      try {
        console.log(`[Generate Avatar] Generating for member ${member}`);
        const avatarRequestId = await imageServiceRef.current.generateAvatar(portraitData);
        console.log(`[Generate Avatar] Request ID for member ${member}:`, avatarRequestId);

        // Check if we got a noToken response
        if (avatarRequestId && typeof avatarRequestId === 'object' && avatarRequestId.noToken) {
          console.log(`[Generate Avatar] No token available for member ${member}, using ASCII placeholder`);
          continue;
        }

        const avatarUrl = await imageServiceRef.current.startPolling(avatarRequestId);
        console.log(`[Generate Avatar] URL received for member ${member}:`, avatarUrl);

        // Check if we got a noToken response during polling
        if (avatarUrl && typeof avatarUrl === 'object' && avatarUrl.noToken) {
          console.log(`[Generate Avatar] No token available during polling for member ${member}, using ASCII placeholder`);
          continue;
        }

        if (avatarUrl) {
          // 立即更新单个队员的头像
          setAvatarUrls(prev => ({
            ...prev,
            [member]: avatarUrl
          }));

          updateGameData(prev => ({
            ...prev,
            teamMembers: {
              ...prev.teamMembers,
              [member]: {
                ...prev.teamMembers[member],
                avatarUrl
              }
            }
          }));

          console.log(`[Generate Avatar] Successfully updated avatar for member ${member}`);
        }
      } catch (error) {
        console.error(`[Generate Avatar] Error generating avatar for member ${member}:`, error);
        // 继续处理下一个队员的头像
      }
    }
  };

  // 初始化图片服务
  useEffect(() => {
    imageServiceRef.current = createImageService((status) => {
      console.log('[Image Service] Status:', status);
    });

    return () => {
      if (imageServiceRef.current) {
        imageServiceRef.current.cleanup();
      }
      generationRequestRef.current = false;
    };
  }, []);

  // 在 useEffect 中监听 gameData 变化
  useEffect(() => {
    const shouldGenerate = 
      shouldGenerateImage && 
      gameData?.imageGeneration?.prompt && 
      !imageUrl && 
      !isGenerating && 
      !hasStartedGeneration &&
      !generationRequestRef.current;

    if (shouldGenerate) {
      console.log('[Image Generation] Starting generation with prompt:', gameData.imageGeneration.prompt);
      generationRequestRef.current = true;
      setHasStartedGeneration(true);
      onGenerationStart?.();
      generateImage().catch(error => {
        console.error('[Image Generation] Error:', error);
        generationRequestRef.current = false;
        setHasStartedGeneration(false);
        setIsGenerating(false);
      });
    }
  }, [shouldGenerateImage, gameData?.imageGeneration?.prompt, imageUrl, isGenerating, 
      hasStartedGeneration, generateImage, onGenerationStart]);

  // 同步图片URL
  useEffect(() => {
    if (gameData?.imageGeneration?.generatedImageUrl && !imageUrl) {
      console.log('[Image] Syncing URL from game data');
      setImageUrl(gameData.imageGeneration.generatedImageUrl);
    }
  }, [gameData?.imageGeneration?.generatedImageUrl, imageUrl]);

  const handleSearchEnemy = async () => {
    console.log('[Battle] Starting enemy search...');
    
    if (isSearchingEnemy) {
      console.log('[Battle] Already searching for enemies, request ignored');
      return;
    }

    try {
      setIsSearchingEnemy(true);
      
      // 清除战斗缓存数据
      updateGameData(prev => ({
        ...prev,
        battleInstance: {
          ...INITIAL_GAME_STATE.battleInstance,
          status: 'initializing',
          error: null
        }
      }));
      
      // 清除所有敌人头像缓存
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('enemy_avatar_')) {
          console.log('[Battle] Clearing cached avatar:', key);
          localStorage.removeItem(key);
        }
      });
      
      const inputText = `
        World Background: ${gameData?.worldBackground?.mainDescription || ''}
        World Laws: ${gameData?.worldBackground?.laws?.join(', ') || ''}
        Main Conflict: ${gameData?.worldBackground?.mainConflict || ''}
      `;

      console.log('[Battle] Sending battle generation request with world context');
      
      // Ensure gameData is properly initialized before calling updateBattleData
      if (!gameData || !gameData.worldBackground || !gameData.worldBackground.mainDescription) {
        throw new Error('Game data is not properly initialized. Please generate world data first.');
      }
      
      await updateBattleData(inputText);
      
      console.log('[Battle] Battle data generated successfully');
      setIsBattleMode(true);

    } catch (error) {
      console.error('[Battle] Error during battle generation:', error);
      // 设置错误状态
      updateGameData(prev => ({
        ...prev,
        battleInstance: {
          ...(prev?.battleInstance || INITIAL_GAME_STATE.battleInstance),
          status: 'error',
          error: error.message
        }
      }));
    } finally {
      setIsSearchingEnemy(false);
    }
  };

  const handleContinueBattle = () => {
    console.log('[Battle] Continuing existing battle');
    setIsBattleMode(true);
  };

  // 如果处于战斗模式，显示战斗界面
  if (isBattleMode) {
    console.log('[Battle] Rendering battle screen');
    return <BattleScreen onExit={() => {
      console.log('[Battle] Exiting battle mode');
      setIsBattleMode(false);
    }} />;
  }

  // 修改按钮渲染逻辑
  const renderBattleButtons = () => {
    if (battleInstance.status === 'ready') {
      return (
        <div className="battle-buttons-container">
          <button 
            className="search-enemy-button"
            onClick={handleSearchEnemy}
            disabled={isSearchingEnemy || !teamMembers.A || !teamMembers.B}
          >
            {isSearchingEnemy ? '[ SEARCHING... ]' : '[ INITIATE BATTLE ]'}
          </button>
          <button 
            className="continue-battle-button"
            onClick={handleContinueBattle}
          >
            {'[ RESUME BATTLE ]'}
          </button>
        </div>
      );
    }

    return (
      <button 
        className={`search-enemy-button ${isSearchingEnemy ? 'loading' : ''}`}
        onClick={handleSearchEnemy}
        disabled={isSearchingEnemy || !teamMembers.A || !teamMembers.B}
      >
        {isSearchingEnemy ? '[ SEARCHING... ]' : '[ INITIATE BATTLE ]'}
      </button>
    );
  };

  return (
    <div className="game-data-display">
      <section className="this-world-section">
        <h2>+==[ THE WORLD ]==+</h2>
        <div className="world-container">
          <div className="world-image-section">
            <ImageDisplay 
              url={imageUrl}
              isLoading={isGenerating}
              onImageLoad={() => setImageLoaded(true)}
              noToken={noToken}
            />
          </div>
          <div className="world-text-section">
            <div className="world-text-content">
              <div className="world-description">
                <h3>World Background</h3>
                <p>{gameData?.worldBackground?.mainDescription}</p>
              </div>
              <div className="world-setting">
                <h3>Basic Setting</h3>
                <p>{gameData?.worldBackground?.basicSetting}</p>
              </div>
              <div className="world-geography">
                <h3>Geography</h3>
                <p>{gameData?.worldBackground?.geography}</p>
              </div>
              <div className="world-lifeforms">
                <h3>Lifeforms</h3>
                <p>{gameData?.worldBackground?.lifeforms}</p>
              </div>
              <div className="world-elements">
                <h3>Mysterious Elements</h3>
                <p>{gameData?.worldBackground?.elements}</p>
              </div>
              <div className="world-laws">
                <h3>World Laws</h3>
                <ul>
                  {gameData?.worldBackground?.laws?.map((law, index) => (
                    <li key={index}>{law}</li>
                  ))}
                </ul>
              </div>
              <div className="world-conflict">
                <h3>Main Conflict</h3>
                <p>{gameData?.worldBackground?.mainConflict}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="battle-controls">
          {renderBattleButtons()}
        </div>
      </section>
      <TeamMembers 
        memberA={teamMembers.A}
        memberB={teamMembers.B}
      />
    </div>
  );
}

export default GameDataDisplay; 