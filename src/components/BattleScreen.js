import React, { useState, useEffect, useRef } from 'react';
import './BattleScreen.css';
import { useGame } from '../contexts/GameContext';
import { FaInfoCircle, FaShieldAlt, FaSkull } from 'react-icons/fa';
import TeamMembers from './TeamMembers';
import EnemyAvatar from './EnemyAvatar';
import { useBattleData } from '../hooks/useBattleData';
import { formatError, parseBattleResponseSafely } from '../utils/errorHandling';

// Battle control component
const BattleControls = ({ onBattleStart, battleStarted, aliveTeamMembers, selectedSkills, onSkillChange, onSubmit, isSubmitting }) => {
  if (!aliveTeamMembers || aliveTeamMembers.length === 0) {
    return null;
  }

  if (!battleStarted) {
    return (
      <div className="battle-controls">
        <button className="start-battle-btn" onClick={onBattleStart}>
          ▼ Start Battle ▼
        </button>
      </div>
    );
  }

  // Modified check logic, only check if team members with usable skills have selected a skill
  const hasUnselectedSkills = aliveTeamMembers.some(([teamId, member]) => {
    const skills = member.skills || member.Skills || [];
    // Check if this team member has any usable skills (enough MP)
    const hasUsableSkills = skills.some(skill => member.mp >= (skill.mpCost || 0));
    // Only check if a skill is selected when the member has usable skills
    return hasUsableSkills && (
      selectedSkills[teamId] === undefined || 
      selectedSkills[teamId] === "" || 
      isNaN(selectedSkills[teamId])
    );
  });

  return (
    <div className="battle-controls">
      <div className="skill-selection-area">
        <h4>+==[ Battle Control ]==+</h4>
        {aliveTeamMembers.map(([teamId, member]) => {
          const skills = member.skills || member.Skills || [];
          const hasUsableSkills = skills.some(skill => member.mp >= (skill.mpCost || 0));

          return (
            <div key={teamId} className="skill-selection-pair">
              <div className="member-info">
                <span className="team-member">{member.name}</span>
                <span className="member-stats">HP: {member.hp} / MP: {member.mp}</span>
              </div>
              {hasUsableSkills ? (
                <select
                  value={selectedSkills[teamId] !== undefined && !isNaN(selectedSkills[teamId]) ? selectedSkills[teamId] : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSkillChange(teamId, value === "" ? "" : parseInt(value));
                  }}
                  className="skill-select"
                >
                  <option value="">Select Skill</option>
                  {skills.map((skill, idx) => (
                    <option 
                      key={idx} 
                      value={idx}
                      disabled={member.mp < (skill.mpCost || 0)}
                    >
                      {skill.name} (MP: {skill.mpCost || 0})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="no-mp-message">Insufficient MP for skills</div>
              )}
            </div>
          );
        })}
        <button 
          className="trigger-battle-btn"
          onClick={onSubmit}
          disabled={isSubmitting || hasUnselectedSkills}
        >
          {isSubmitting ? "Battle in Progress..." : "▶ Execute Battle ◀"}
        </button>
      </div>
    </div>
  );
};

// Buff display component
const BuffDisplay = ({ buffs, debuffs }) => {
  return (
    <div className="status-effects">
      {buffs.length > 0 && (
        <div className="buffs">
          {buffs.map((buff, index) => (
            <div key={`buff-${index}`} className="buff-icon" title={buff}>
              <FaShieldAlt color="#33ff33" />
            </div>
          ))}
        </div>
      )}
      {debuffs.length > 0 && (
        <div className="debuffs">
          {debuffs.map((debuff, index) => (
            <div key={`debuff-${index}`} className="debuff-icon" title={debuff}>
              <FaSkull color="#ff3333" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Enemy card component
const EnemyCard = ({ enemy }) => {
  const { gameData } = useGame();
  const { battleInstance } = gameData || {};
  
  // Ensure HP is never negative for display
  const displayHp = Math.max(0, enemy.hp);
  const hpPercentage = (displayHp / enemy.maxHp) * 100;

  return (
    <div className="enemy-card">
      <div className="member-header">
        <h3>{enemy.name}</h3>
        <div className="power-level">
          <span className="race-text">({enemy.race})</span>
        </div>
      </div>
      
      <div className="member-content">
        <div className="enemy-info-container">
          <EnemyAvatar 
            enemy={enemy} 
            battleRound={battleInstance.currentRound}
            isNewRound={enemy.portrait === null}
          />

          <div className="enemy-stats">
            <div className="stat-bar">
              <div className="bar-container">
                <div 
                  className="bar hp-bar" 
                  style={{ width: `${hpPercentage}%` }}
                >
                </div>
                <span className="bar-label">HP [{displayHp}/{enemy.maxHp}]</span>
              </div>
            </div>

            <BuffDisplay 
              buffs={enemy.buffs || []}
              debuffs={enemy.debuffs || []}
            />

            <div className="skill-item">
              <div className="skill-name">
                {enemy.skill.name}
                <span className="skill-damage">DMG: {enemy.skill.damage}</span>
              </div>
              <div className="skill-effect">
                <span className="effect-text">{enemy.skill.effect}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Battle decoration component
const BattleDecoration = () => {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const frames = [
    `
    \\||//
    -<*>-
    //||\\
    `,
    `
    //||\\
    -<+>-
    \\||//
    `,
    `
    \\||//
    -<*>-
    //||\\
    `,
    `
    //||\\
    -<+>-
    \\||//
    `
  ];

  return (
    <div className="battle-decoration">
      <pre>{frames[frame]}</pre>
    </div>
  );
};

// Add danger level decoration component
const DangerLevelDecoration = ({ level }) => {
  // Different danger level indicators
  const colors = {
    1: '#33ff33',  // Green
    2: '#ffff33',  // Yellow
    3: '#ff9933',  // Orange
    4: '#ff3333',  // Red
    5: '#ff0000'   // Deep Red
  };

  const dangerSymbols = {
    1: `
      /|\\
      \\|/
    `,
    2: `
      ☠️
      /|\\
    `,
    3: `
     ,╱╱╱╲╲╲,
     ╲╲▂▂▂╱╱
      ╲┈┈┈╱
    `,
    4: `
     ▄▀▀▀▀▄
     █═▀═█
     █▄▄▄█
    `,
    5: `
      ▄████▄
      █▀▀▀▀█
      ███▄██
    `
  };

  return (
    <div className="danger-decoration" style={{ color: colors[level] || colors[1] }}>
      <pre>{dangerSymbols[level] || dangerSymbols[1]}</pre>
    </div>
  );
};

// Add helper function to extract battle process
const extractBattleProcess = (processText) => {
  if (!processText) return '';
  
  // Check if the text already starts with "Battle Process:"
  if (processText.trim().startsWith('Battle Process:')) {
    // Find where "Battle Process:" starts
    const battleProcessStart = processText.indexOf('Battle Process:');
    
    // Find where "Surviving Members:" starts (if it exists)
    const survivingMembersStart = processText.indexOf('Surviving Members:');
    
    if (survivingMembersStart === -1) {
      // If "Surviving Members:" is not found, return everything after "Battle Process:"
      return processText.slice(battleProcessStart + 15).trim();
    } else {
      // Return only the battle process part
      return processText.slice(battleProcessStart + 15, survivingMembersStart).trim();
    }
  } else {
    // If the text doesn't start with "Battle Process:", check if it contains "Surviving Members:"
    const survivingMembersStart = processText.indexOf('Surviving Members:');
    
    if (survivingMembersStart === -1) {
      // If "Surviving Members:" is not found, return the entire text
      return processText.trim();
    } else {
      // Return everything before "Surviving Members:"
      return processText.slice(0, survivingMembersStart).trim();
    }
  }
};

// Battle Log component
const BattleLog = ({ battleHistory }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [battleHistory]);

  if (isMinimized) {
    return (
      <div 
        className="battle-log-container" 
        style={{ 
          height: 'auto', 
          maxHeight: 'none',
          cursor: 'pointer' 
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="battle-log-header">
          <h4>Battle Log [+]</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-log-container">
      <div className="battle-log-header">
        <h4>Battle Log</h4>
        <button 
          className="minimize-button"
          onClick={() => setIsMinimized(true)}
        >
          [-]
        </button>
      </div>
      <div className="battle-log-content" ref={contentRef}>
        {battleHistory.map((entry, index) => {
          const battleProcess = typeof entry === 'string' 
            ? extractBattleProcess(entry)
            : extractBattleProcess(entry.process);
            
          if (!battleProcess) return null;

          return (
            <div key={index} className="battle-log-entry">
              <div className="battle-log-timestamp">
                Round {typeof entry === 'string' ? '?' : entry.gameRound} - Sub Round {typeof entry === 'string' ? '?' : entry.subRound}
              </div>
              <div className="battle-log-text">
                {battleProcess}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Battle Result component
const BattleResult = ({ result, onRestart, onNextRound, currentRound, totalRounds, checkMPStatus, onRecover, onExportWorldInfo }) => {
  const isLastRound = currentRound >= totalRounds;
  
  const getResultMessage = () => {
    if (result === 'victory') {
      return isLastRound ? '🎉 Congratulations! Challenge Complete!' : 'Wave Cleared!';
    } else {
      return checkMPStatus ? 
        'All members out of MP, unable to continue' : 
        'You have been defeated';
    }
  };
  
  return (
    <div className="battle-result-overlay">
      <div className="battle-result-window">
        <h3>{getResultMessage()}</h3>
        {result === 'victory' && !isLastRound && (
          <button className="next-round-button" onClick={onNextRound}>
            Next Round ▶
          </button>
        )}
        {result === 'defeat' && (
          <div className="battle-result-buttons">
            <button 
              className="recover-button"
              onClick={onRecover}
            >
              Recover & Continue
            </button>
            <button 
              className="restart-button" 
              onClick={onRestart}
            >
              Restart
            </button>
          </div>
        )}
        {result === 'victory' && isLastRound && (
          <div className="battle-result-buttons">
            <button 
              className="restart-button" 
              onClick={onRestart}
            >
              Complete Challenge
            </button>
            <button 
              className="export-button" 
              onClick={onExportWorldInfo}
            >
              Export World Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function BattleScreen({ onExit }) {
  const { gameData, updateGameData, saveBattleProcess } = useGame();
  const { battleInstance } = gameData || {};
  const [showStory, setShowStory] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subRound, setSubRound] = useState(1);
  const { battleHistory, parseBattleResponse } = useBattleData();
  const [battleResult, setBattleResult] = useState(null); // Add battle result state
  
  const currentRoundIndex = battleInstance?.currentRound - 1;
  const currentEnemies = battleInstance?.rounds?.[currentRoundIndex] || [];
  
  // Extract alive team members
  const aliveTeamMembers = Object.entries(gameData?.teamMembers || {}).filter(
    ([_, member]) => member && member.hp > 0 && (member.skills || member.Skills)
  );

  // Extract alive enemies
  const aliveEnemies = currentEnemies.filter(enemy => enemy && enemy.hp > 0);

  const handleSkillChange = (teamId, skillIndex) => {
    setSelectedSkills(prev => ({
      ...prev,
      [teamId]: skillIndex,
    }));
  };

  useEffect(() => {
    if (battleStarted) {
      setSubRound(1);
    }
  }, [battleInstance?.currentRound, battleStarted]);

  // Modify restart handler function
  const handleRestart = () => {
    updateGameData(prev => {
      // Reset all team members to initial values
      const resetTeamMembers = Object.entries(prev.teamMembers).reduce((acc, [id, member]) => {
        acc[id] = {
          ...member,
          hp: member.maxHp || 2000, // 使用maxHp或默认值
          mp: member.maxMp || 1000,  // 使用maxMp或默认值
          buffs: [],
          debuffs: []
        };
        return acc;
      }, {});

      return {
        ...prev,
        teamMembers: resetTeamMembers,
        battleInstance: null
      };
    });
    onExit();
  };

  // Modify handleNextRound function
  const handleNextRound = () => {
    setBattleResult(null);
    setBattleStarted(false);
    setSelectedSkills({});
    setSubRound(1);
    
    updateGameData(prev => {
      // Get next round enemies
      const nextRoundIndex = prev.battleInstance.currentRound;
      const nextRoundEnemies = prev.battleInstance.rounds[nextRoundIndex] || [];
      
      // Create new rounds array with reset portraits
      const updatedRounds = [...prev.battleInstance.rounds];
      updatedRounds[nextRoundIndex] = nextRoundEnemies.map(enemy => ({
        ...enemy,
        portrait: null // Reset portrait data
      }));

      // Update game state
      return {
        ...prev,
        battleInstance: {
          ...prev.battleInstance,
          currentRound: prev.battleInstance.currentRound + 1,
          rounds: updatedRounds
        }
      };
    });

    // Update the generatePortraits function
    const generatePortraits = async () => {
      console.log('[Portrait Generation] Starting portrait generation for enemies');
      
      // Get OpenAI API key from gameData or localStorage
      let apiKey = gameData.openaiApiKey;
      if (!apiKey) {
        apiKey = localStorage.getItem('openai_api_key');
        if (apiKey) {
          console.log('[Portrait Generation] Using API key from localStorage');
        } else {
          console.error('[Portrait Generation] No OpenAI API key found');
          return;
        }
      }

      // Check if we have an image generation token
      const imageToken = localStorage.getItem('image_gen_token');
      if (!imageToken) {
        console.log('[Portrait Generation] No image generation token found, skipping portrait generation');
        // We'll use ASCII art instead, so we don't need to generate portraits
        return;
      }
      
      try {
        // Get current round enemies
        const currentRoundIndex = gameData.battleInstance.currentRound - 1;
        if (currentRoundIndex < 0 || !gameData.battleInstance.rounds[currentRoundIndex]) {
          console.error('[Portrait Generation] Invalid round index:', currentRoundIndex);
          return;
        }
        
        const enemies = gameData.battleInstance.rounds[currentRoundIndex];
        if (!enemies || !enemies.length) {
          console.error('[Portrait Generation] No enemies found for round:', currentRoundIndex + 1);
          return;
        }
        
        // Generate portrait for each enemy without a portrait
        for (const enemy of enemies) {
          if (!enemy.portrait) {
            console.log('[Portrait Generation] Enemy has no portrait description, skipping:', enemy.id);
            continue;
          }
          
          // Check if we already have a cached portrait
          const cacheKey = `enemy_portrait_${enemy.id}`;
          const cachedPortrait = localStorage.getItem(cacheKey);
          if (cachedPortrait) {
            console.log('[Portrait Generation] Using cached portrait for enemy:', enemy.id);
            
            // Update enemy portrait in game data
            updateGameData(current => {
              const updatedRounds = [...current.battleInstance.rounds];
              const enemyIndex = updatedRounds[currentRoundIndex].findIndex(e => e.id === enemy.id);
              if (enemyIndex !== -1) {
                updatedRounds[currentRoundIndex][enemyIndex] = {
                  ...updatedRounds[currentRoundIndex][enemyIndex],
                  portrait: cachedPortrait
                };
              }
              return {
                ...current,
                battleInstance: {
                  ...current.battleInstance,
                  rounds: updatedRounds
                }
              };
            });
            
            continue;
          }
          
          console.log('[Portrait Generation] Generating portrait for enemy:', enemy.id);
          
          // Generate portrait using OpenAI API
          const prompt = `Generate a detailed portrait description for a ${enemy.race} named ${enemy.name}. ${enemy.portrait || ''}`;
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a creative assistant that generates detailed portrait descriptions for fantasy characters. Focus on visual appearance, facial features, expressions, and distinctive traits. Keep descriptions concise (2-3 sentences) but vivid.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 150,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Portrait Generation] API Response:', data);
            
            // Extract portrait from response
            const portrait = data?.choices?.[0]?.message?.content || null;
            console.log('[Portrait Generation] Extracted portrait:', portrait);

            if (portrait) {
              // Cache the portrait
              localStorage.setItem(cacheKey, portrait);
              
              // Update enemy portrait
              updateGameData(current => {
                const updatedRounds = [...current.battleInstance.rounds];
                const enemyIndex = updatedRounds[currentRoundIndex].findIndex(e => e.id === enemy.id);
                if (enemyIndex !== -1) {
                  updatedRounds[currentRoundIndex][enemyIndex] = {
                    ...updatedRounds[currentRoundIndex][enemyIndex],
                    portrait
                  };
                }
                return {
                  ...current,
                  battleInstance: {
                    ...current.battleInstance,
                    rounds: updatedRounds
                  }
                };
              });
            }
          }
        }
      } catch (error) {
        console.error('[Portrait Generation] Error:', error);
      }
    };

    // Call generatePortraits after a short delay to ensure state is updated
    setTimeout(() => {
      generatePortraits();
    }, 100);
  };

  // Add check to see if all members are unusable
  const checkAllMembersUnusable = () => {
    return aliveTeamMembers.every(([_, member]) => {
      const skills = member.skills || member.Skills || [];
      return !skills.some(skill => member.mp >= (skill.mpCost || 0));
    });
  };

  // Check MP status in useEffect
  useEffect(() => {
    if (battleStarted && checkAllMembersUnusable()) {
      setBattleResult('defeat');
    }
  }, [battleStarted, aliveTeamMembers]);

  // Add recovery handler function
  const handleRecover = () => {
    updateGameData(prev => {
      // Reset all team members to initial values
      const resetTeamMembers = Object.entries(prev.teamMembers).reduce((acc, [id, member]) => {
        acc[id] = {
          ...member,
          hp: member.maxHp || 2000,
          mp: member.maxMp || 1000,
          buffs: [],
          debuffs: []
        };
        return acc;
      }, {});

      return {
        ...prev,
        teamMembers: resetTeamMembers
      };
    });
    setBattleResult(null);
    setBattleStarted(false);
    setSelectedSkills({});
  };

  // Modify handleBattleSubmit function, add MP check
  const handleBattleSubmit = async () => {
    if (isSubmitting) {
      console.log('[Battle] Already submitting, request ignored');
      return;
    }

    // Check if OpenAI API key is provided
    let apiKey = gameData?.openaiApiKey;
    if (!apiKey) {
      // Try to get from localStorage directly
      apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        alert('Please set your OpenAI API key in the Admin Terminal Settings tab before submitting battles.');
        return;
      } else {
        console.log('[Battle] Using API key from localStorage');
      }
    }

    setIsSubmitting(true);

    // Build surviving members list string
    const survivingEnemies = aliveEnemies.map(e => e.id).join(', ');
    const survivingTeamMembers = aliveTeamMembers
      .filter(([_, member]) => {
        const skills = member.skills || member.Skills || [];
        return skills.some(skill => member.mp >= (skill.mpCost || 0));
      })
      .map(([id, _]) => id)
      .join(', ');

    // Build detailed member status and skill usage description
    const enemyDetails = aliveEnemies.map(enemy => {
      const skill = Array.isArray(enemy.skill) 
        ? enemy.skill[Math.floor(Math.random() * enemy.skill.length)]
        : enemy.skill;
      
      return `${enemy.id}:\nNamed "${enemy.name}", current HP: ${enemy.hp}. Uses the skill "${skill.name}", dealing ${skill.damage} damage, ${skill.effect ? `${skill.effect}` : ''}.`;
    }).join('\n\n');

    const teamMemberDetails = aliveTeamMembers
      .filter(([_, member]) => {
        const skills = member.skills || member.Skills || [];
        return skills.some(skill => member.mp >= (skill.mpCost || 0));
      })
      .map(([teamId, member]) => {
        const selectedSkillIndex = selectedSkills[teamId];
        const skills = member.skills || member.Skills || [];
        const skill = skills[selectedSkillIndex];
        
        return `${teamId}:\nNamed "${member.name}", current HP: ${member.hp}, current MP: ${member.mp}. Uses the skill "${skill.name}", MP cost: ${skill.mpCost}, dealing ${skill.damage} damage, ${skill.effect ? `${skill.effect}` : ''}.`;
      }).join('\n\n');

    // 整合所有战斗数据
    const battleData = `Currectbattle(round): ${subRound}

Surviving Members:
Enemies: ${survivingEnemies}
OurTeam: ${survivingTeamMembers}

${enemyDetails}

${teamMemberDetails}

Level Story:
${battleInstance.levelStory || 'No story available.'}`;

    try {
      const response = await fetch(
        "http://47.80.4.197:30409/api/v1/run/battle?stream=false",
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
              "ChatInput-Cvvlg": {
                "background_color": "",
                "chat_icon": "",
                "files": "",
                "input_value": battleData,
                "sender": "User",
                "sender_name": "User",
                "session_id": "",
                "should_store_message": true,
                "text_color": ""
              },
              "Prompt-X6zTJ": {},
              "ChatOutput-oeXZd": {
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
              "OpenAIModel-KptyX": {
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
              "OpenAIModel-Pb4NR": {
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
              "Prompt-XMtNm": {},
              "CombineText-DQEY5": {}
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Battle API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data?.outputs?.[0]?.outputs?.[0]?.artifacts?.message) {
        throw new Error('Invalid battle response format');
      }

      // 解析战斗数据并更新状态
      const memberUpdates = parseBattleResponse(data);
      
      // 获取战斗过程文本
      const battleProcessText = parseBattleResponseSafely(data);
      
      // 保存战斗过程
      saveBattleProcess(
        battleProcessText,
        battleInstance.currentRound,
        subRound
      );
      
      // 打印解析后的状态更新数据
      console.log('[Battle] Parsed Member Updates:', memberUpdates);
      
      // 更新游戏状态
      updateGameData(prev => {
        const updatedTeamMembers = { ...prev.teamMembers };
        const updatedRounds = [...prev.battleInstance.rounds];
        
        // 更新队员状态
        Object.entries(memberUpdates).forEach(([id, updates]) => {
          if (id in updatedTeamMembers) {
            updatedTeamMembers[id] = {
              ...updatedTeamMembers[id],
              ...updates
            };
          } else {
            // 更新敌人状态
            const roundIndex = prev.battleInstance.currentRound - 1;
            if (updatedRounds[roundIndex]) {
              updatedRounds[roundIndex] = updatedRounds[roundIndex].map(enemy => {
                if (enemy.id === id) {
                  // Ensure HP is never negative in the actual state
                  const updatedHP = updates.hp !== undefined ? Math.max(0, updates.hp) : enemy.hp;
                  return { 
                    ...enemy, 
                    ...updates,
                    hp: updatedHP
                  };
                }
                return enemy;
              });
            }
          }
        });

        const newState = {
          ...prev,
          teamMembers: updatedTeamMembers,
          battleInstance: {
            ...prev.battleInstance,
            rounds: updatedRounds
          }
        };

        // 检查战斗结果
        const allTeamMembersDead = Object.values(updatedTeamMembers)
          .every(member => member.hp <= 0);
        
        const allEnemiesDead = updatedRounds[prev.battleInstance.currentRound - 1]
          .every(enemy => enemy.hp <= 0);

        console.log('[Battle] Victory check:', { 
          allTeamMembersDead, 
          allEnemiesDead,
          enemiesHP: updatedRounds[prev.battleInstance.currentRound - 1].map(e => ({ id: e.id, hp: e.hp }))
        });

        if (allTeamMembersDead) {
          setBattleResult('defeat');
        } else if (allEnemiesDead) {
          setBattleResult('victory');
        }

        return newState;
      });

      // 数据更新成功后再增加 subRound
      console.log('[Battle] Successfully updated game state, incrementing sub-round');
      setSubRound(prev => prev + 1);
      setSelectedSkills({});

    } catch (error) {
      console.error('[Battle] API Error:', error);
      const errorMessage = formatError(error);
      updateGameData(prev => ({
        ...prev,
        battleInstance: {
          ...prev.battleInstance,
          status: 'error',
          error: errorMessage
        }
      }));
      setBattleResult('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export world information
  const handleExportWorldInfo = () => {
    try {
      // Prepare export text
      let exportText = '';
      
      // Add world background information
      if (gameData.worldBackground) {
        exportText += '# World Background\n\n';
        
        if (gameData.worldBackground.mainDescription) {
          exportText += gameData.worldBackground.mainDescription + '\n\n';
        }
        
        if (gameData.worldBackground.basicSetting) {
          exportText += gameData.worldBackground.basicSetting + '\n\n';
        }
        
        if (gameData.worldBackground.geography) {
          exportText += gameData.worldBackground.geography + '\n\n';
        }
        
        if (gameData.worldBackground.lifeforms) {
          exportText += gameData.worldBackground.lifeforms + '\n\n';
        }
        
        if (gameData.worldBackground.elements) {
          exportText += gameData.worldBackground.elements + '\n\n';
        }
        
        if (gameData.worldBackground.mainConflict) {
          exportText += gameData.worldBackground.mainConflict + '\n\n';
        }
      }
      
      // Add team member information
      if (gameData.teamMembers) {
        exportText += '# Team Members\n\n';
        
        Object.entries(gameData.teamMembers).forEach(([id, member]) => {
          if (!member) return;
          
          // Create a natural language description
          let memberDescription = `${member.name} is a ${member.race || ''}`;
          
          if (member.background) {
            memberDescription += `, ${member.background}`;
          }
          
          memberDescription += `.`;
          
          // Add life and MP values
          if (member.hp && member.mp) {
            memberDescription += ` with ${member.hp} HP and ${member.mp} MP.`;
          }
          
          exportText += memberDescription + '\n\n';
          
          // Add skill information
          const skills = member.skills || member.Skills || [];
          if (skills.length > 0) {
            exportText += `${member.name}'s Skills:\n`;
            skills.forEach(skill => {
              let skillDesc = `- ${skill.name}`;
              
              const details = [];
              if (skill.damage) details.push(`${skill.damage} DMG`);
              if (skill.mpCost) details.push(`${skill.mpCost} MP cost`);
              if (skill.effect) details.push(skill.effect);
              
              if (details.length > 0) {
                skillDesc += `: ${details.join(', ')}`;
              }
              
              exportText += skillDesc + '\n';
            });
            exportText += '\n';
          }
        });
      }
      
      // Add battle history
      if (gameData.battleProcessHistory && gameData.battleProcessHistory.length > 0) {
        exportText += '# Battle History\n\n';
        
        gameData.battleProcessHistory.forEach((entry) => {
          // Only keep battle process text, remove timestamp and round information
          const battleProcess = entry.process || '';
          if (battleProcess) {
            // Remove "Battle Process:" prefix
            const cleanedProcess = battleProcess.replace(/^Battle Process:\s*/i, '');
            exportText += cleanedProcess + '\n\n';
          }
        });
      }
      
      // Create Blob object
      const blob = new Blob([exportText], { type: 'text/plain' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate file name (use current date time)
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
      link.download = `world-info-${formattedDate}-${formattedTime}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[Export] World info exported successfully');
    } catch (error) {
      console.error('[Export] Error exporting world info:', error);
      alert('Export failed: ' + error.message);
    }
  };

  useEffect(() => {
    console.log('[Battle Screen] Current battle instance:', battleInstance);
    if (!battleInstance) {
      console.error('[Battle Screen] No battle instance found in gameData');
    }
  }, [battleInstance]);

  useEffect(() => {
    if (battleInstance?.rounds?.[0]) {
      console.log('[Battle] First round enemies:', battleInstance.rounds[0]);
      // Check first round enemy portrait data
      battleInstance.rounds[0].forEach(enemy => {
        console.log('[Battle] Enemy portrait data:', {
          enemyId: enemy.id,
          enemyName: enemy.name,
          portraitData: enemy.portrait
        });
      });
    }
  }, [battleInstance]);

  // Ensure battleInstance exists
  if (!battleInstance || battleInstance.status === 'error') {
    return (
      <div className="battle-screen">
        <div className="battle-header">
          <h2>+==[ Battle Error ]==+</h2>
        </div>
        <div className="battle-content">
          <div className="error-message">
            {battleInstance?.error || 'Battle data not found. Please try again.'}
            <button onClick={onExit}>Return</button>
          </div>
        </div>
      </div>
    );
  }

  // Load state handling
  if (battleInstance.status === 'initializing') {
    return (
      <div className="battle-screen">
        <div className="battle-header">
          <h2>+==[ Initializing Battle ]==+</h2>
        </div>
        <div className="battle-content">
          <div className="loading-message">
            Preparing battle scenario...
          </div>
        </div>
      </div>
    );
  }

  console.log('[Battle Screen] Rendering battle with enemies:', currentEnemies);

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
        <div className="enemies-section">
          <div className="enemies-header">
            <DangerLevelDecoration level={battleInstance.dangerLevel} />
            <h3>Enemy Forces</h3>
            <DangerLevelDecoration level={battleInstance.dangerLevel} />
          </div>
          <div className="enemies-container">
            {currentEnemies.map((enemy, index) => (
              <EnemyCard key={`enemy-${index}`} enemy={enemy} />
            ))}
          </div>
        </div>

        <BattleControls 
          onBattleStart={() => setBattleStarted(true)}
          battleStarted={battleStarted}
          aliveTeamMembers={aliveTeamMembers}
          selectedSkills={selectedSkills}
          onSkillChange={handleSkillChange}
          onSubmit={handleBattleSubmit}
          isSubmitting={isSubmitting}
        />

        <div className="allies-section">
          <h3>Your Forces</h3>
          <TeamMembers 
            memberA={gameData.teamMembers?.A}
            memberB={gameData.teamMembers?.B}
          />
        </div>
      </div>

      {/* Add BattleLog component */}
      <BattleLog battleHistory={gameData.battleProcessHistory || []} />

      {battleResult && (
        <BattleResult 
          result={battleResult}
          onRestart={handleRestart}
          onNextRound={handleNextRound}
          currentRound={battleInstance?.currentRound}
          totalRounds={battleInstance?.totalRounds}
          checkMPStatus={checkAllMembersUnusable()}
          onRecover={handleRecover}
          onExportWorldInfo={handleExportWorldInfo}
        />
      )}
    </div>
  );
}

export default BattleScreen; 