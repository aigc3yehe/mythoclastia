import React, { useState, useEffect, useRef } from 'react';
import { createImageService } from '../services/imageGenerationService';

const EnemyAvatar = ({ enemy, battleRound, isNewRound }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [noToken, setNoToken] = useState(false);
  const pendingGenerationRef = useRef({});
  const isDead = enemy.hp <= 0;

  const generateAvatar = async (cacheKey) => {
    if (!enemy?.portrait || isGenerating) return;

    const imageService = createImageService();
    setIsGenerating(true);
    setError(null);
    setNoToken(false);

    try {
      console.log('[Enemy Avatar] Starting generation for:', {
        enemyId: enemy.id,
        name: enemy.name,
        round: battleRound
      });

      const requestId = await imageService.generateEnemyAvatar({
        name: enemy.name,
        race: enemy.race,
        portrait: enemy.portrait
      });

      // Check if we got a noToken response
      if (requestId && typeof requestId === 'object' && requestId.noToken) {
        console.log('[Enemy Avatar] No token available, using ASCII placeholder');
        setNoToken(true);
        return;
      }

      const newAvatarUrl = await imageService.startPolling(requestId);
      
      // Check if we got a noToken response during polling
      if (newAvatarUrl && typeof newAvatarUrl === 'object' && newAvatarUrl.noToken) {
        console.log('[Enemy Avatar] No token available, using ASCII placeholder');
        setNoToken(true);
        return;
      }
      
      if (newAvatarUrl) {
        console.log('[Enemy Avatar] Generation successful:', {
          enemyId: enemy.id,
          url: newAvatarUrl
        });
        
        setAvatarUrl(newAvatarUrl);
        
        // 缓存头像，包含回合信息
        localStorage.setItem(cacheKey, newAvatarUrl);
      }
    } catch (error) {
      console.error('[Enemy Avatar] Generation failed:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
      delete pendingGenerationRef.current[cacheKey];
    }
  };

  useEffect(() => {
    if (!enemy?.portrait) {
      console.warn('[Enemy Avatar] Missing portrait data for enemy:', enemy.id);
      return;
    }
    const cacheKey = `enemy_avatar_${enemy.id}_round_${battleRound}`;
    const cachedUrl = localStorage.getItem(cacheKey);
    if (cachedUrl) {
      console.log('[Enemy Avatar] Using cached avatar:', {
        enemyId: enemy.id,
        round: battleRound
      });
      setAvatarUrl(cachedUrl);
      return;
    }
    if (pendingGenerationRef.current[cacheKey]) {
      console.log('[Enemy Avatar] Generation already in progress for', cacheKey);
      return;
    }
    // 标记待请求状态，避免重复生成请求
    pendingGenerationRef.current[cacheKey] = true;
    generateAvatar(cacheKey);
  }, [enemy.id, enemy.portrait, battleRound]);

  // ASCII 艺术占位符
  const getAsciiArt = () => {
    if (isGenerating) return 'Generating...';
    
    if (noToken) {
      // Custom ASCII art for when no token is provided
      if (enemy.race.toLowerCase().includes('dragon')) {
        return `    /\\    
 /\\/ o\\  
/       \\
\\       /
 \\_____/`;
      } else if (enemy.race.toLowerCase().includes('demon')) {
        return `  /\\__/\\  
 /(>.<)\\
/  \\/\\/  \\
\\________/`;
      } else if (enemy.race.toLowerCase().includes('fire')) {
        return `/\\__/\\\n(>°.°<)\n(__)__)`;
      } else if (enemy.race.toLowerCase().includes('water')) {
        return `/\\___/\\\n(≈°w°≈)\n(~~)~~)`;
      } else if (enemy.race.toLowerCase().includes('undead') || enemy.race.toLowerCase().includes('skeleton')) {
        return `  .-.
 (o.o)
  | |
  |-|
  | |
 /   \\`;
      } else if (enemy.race.toLowerCase().includes('ghost')) {
        return `   .-.
  (o o)
  | O |
  |   |
  '~~~'`;
      }
      // Default ASCII art
      return `/\\___/\\\n(=^.^=)\n(__)__)`;
    }
    
    // Original ASCII art for loading state
    if (enemy.race.toLowerCase().includes('fire')) {
      return `/\\__/\\\n(>°.°<)\n(__)__)`;
    } else if (enemy.race.toLowerCase().includes('water')) {
      return `/\\___/\\\n(≈°w°≈)\n(~~)~~)`;
    }
    return `/\\___/\\\n(=^.^=)\n(__)__)`;
  };

  const getDeadPortrait = () => {
    return (
      <div className="dead-portrait ascii-art">
        {`   ,-=-.
   /  +  \\
   | ~~~ |
   |R.I.P|
   |     |
\\\\|     |//
 \\\\|     |//
  \\|     |/
   '-----'`}
      </div>
    );
  };

  const renderPortrait = () => {
    if (isNewRound || !enemy.portrait) {
      return (
        <div className="avatar-placeholder">
          <div className="ascii-portrait">
            Generating...
            {'\n'}Please wait
            {'\n'}⌛
          </div>
        </div>
      );
    }

    if (isDead) {
      return getDeadPortrait();
    } else if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt={`${enemy.name}'s portrait`}
          className="avatar-image"
          onError={() => {
            console.error('[Enemy Avatar] Failed to load image:', avatarUrl);
            setAvatarUrl(null);
            setError('Failed to load image');
          }}
        />
      );
    } else {
      return (
        <div className="avatar-placeholder">
          <div className={`ascii-portrait ${isGenerating ? 'generating' : ''} ${noToken ? 'no-token' : ''}`}>
            {error ? 'Error!' : getAsciiArt()}
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`enemy-avatar ${isDead ? 'dead' : ''} ${enemy.isHit ? 'hit' : ''}`}>
      {renderPortrait()}
    </div>
  );
};

export default React.memo(EnemyAvatar); 