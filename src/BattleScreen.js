import React, { useState, useEffect } from 'react';
import './BattleScreen.css';
import { useGame } from '../contexts/GameContext';
import { FaInfoCircle } from 'react-icons/fa';
import TeamMembers from './TeamMembers';
import { createImageService } from '../services/imageGenerationService';
import EnemyAvatar from './EnemyAvatar';
import SubRoundBattle from './SubRoundBattle';

function BattleScreen({ onExit }) {
  const { gameData } = useGame();
  const { battleInstance } = gameData || {};
  const [showStory, setShowStory] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  
  useEffect(() => {
    console.log('[Battle Screen] Current battle instance:', battleInstance);
    if (!battleInstance) {
      console.error('[Battle Screen] No battle instance found in gameData');
    }
  }, [battleInstance]);

  const currentRoundEnemies = battleInstance.rounds?.[battleInstance.currentRound - 1] || [];
  
  console.log('[Battle Screen] Rendering battle with enemies:', currentRoundEnemies);

  return (
    <div className="battle-screen">
      <div className="battle-header">
        <h2>+==[ Battle Instance ]==+</h2>
        <div className="battle-info">
          <span>Round [{battleInstance.currentRound || 0}/{battleInstance.totalRounds || 0}]</span>
          <div className="story-icon">
            <FaInfoCircle 
              onMouseEnter={() => setShowStory(true)}
              onMouseLeave={() => setShowStory(false)}
            />
            {showStory && (
              <div className="story-popup">
                <h4>Level Story</h4>
                <p>{battleInstance.levelStory || 'No story available.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="battle-content">
        <div className="battle-participants">
          <div className="enemies-section">
            <div className="enemies-header">
              {/* ... 敌人部分已有代码 ... */}
            </div>
            <div className="enemies-container">
              {currentRoundEnemies.map((enemy, index) => (
                <EnemyCard key={`enemy-${index}`} enemy={enemy} />
              ))}
            </div>
          </div>

          <div className="allies-section">
            <h3>Your Forces</h3>
            <TeamMembers 
              memberA={gameData.teamMembers?.A}
              memberB={gameData.teamMembers?.B}
            />
          </div>
        </div>
      </div>

      <div className="battle-actions">
        {!battleStarted ? (
          <button onClick={() => setBattleStarted(true)}>开始战斗</button>
        ) : (
          <SubRoundBattle />
        )}
      </div>
    </div>
  );
}

export default BattleScreen; 