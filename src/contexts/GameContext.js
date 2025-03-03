import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

const STORAGE_KEY = 'game_save_data';
const BATTLE_HISTORY_KEY = 'battle_history';
const BATTLE_PROCESS_KEY = 'battle_process_history';
const OPENAI_API_KEY_STORAGE = 'openai_api_key';
const IMAGE_GEN_TOKEN_STORAGE = 'image_gen_token';

export const INITIAL_GAME_STATE = {
  worldBackground: {
    mainDescription: "",
    basicSetting: "",
    geography: "",
    lifeforms: "",
    elements: "",
    laws: [],
    mainConflict: ""
  },
  imageGeneration: {
    prompt: "",
    generatedImageUrl: null
  },
  teamMembers: {
    A: null,
    B: null
  },
  battleHistory: [],
  battleProcessHistory: [],
  battleInstance: {
    levelStory: "",
    totalRounds: 0,
    dangerLevel: 0,
    rounds: [],
    currentRound: 0,
    isActive: false,
    status: null,
    error: null
  },
  openaiApiKey: "",
  imageGenToken: ""
};

export function GameProvider({ children }) {
  const [gameData, setGameData] = useState(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedBattleHistory = localStorage.getItem(BATTLE_HISTORY_KEY);
    const savedBattleProcess = localStorage.getItem(BATTLE_PROCESS_KEY);
    const savedApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE);
    const savedImageToken = localStorage.getItem(IMAGE_GEN_TOKEN_STORAGE);
    
    console.log('[GameProvider] Loading saved API key:', savedApiKey);
    console.log('[GameProvider] Loading saved Image Token:', savedImageToken);
    
    const initialData = savedData ? JSON.parse(savedData) : INITIAL_GAME_STATE;
    
    return {
      ...initialData,
      battleHistory: savedBattleHistory ? JSON.parse(savedBattleHistory) : [],
      battleProcessHistory: savedBattleProcess ? JSON.parse(savedBattleProcess) : [],
      openaiApiKey: savedApiKey || "",
      imageGenToken: savedImageToken || ""
    };
  });

  useEffect(() => {
    if (gameData) {
      // Create a copy of gameData without the sensitive keys for regular storage
      const { openaiApiKey, imageGenToken, ...dataWithoutSensitiveInfo } = gameData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithoutSensitiveInfo));
    }
  }, [gameData]);

  useEffect(() => {
    if (gameData?.battleHistory) {
      localStorage.setItem(BATTLE_HISTORY_KEY, JSON.stringify(gameData.battleHistory));
    }
  }, [gameData?.battleHistory]);

  useEffect(() => {
    if (gameData?.battleProcessHistory) {
      localStorage.setItem(BATTLE_PROCESS_KEY, JSON.stringify(gameData.battleProcessHistory));
    }
  }, [gameData?.battleProcessHistory]);

  // Save OpenAI API key separately when it changes
  useEffect(() => {
    if (gameData?.openaiApiKey !== undefined) {
      console.log('[GameContext] API key changed, saving to localStorage:', gameData.openaiApiKey);
      localStorage.setItem(OPENAI_API_KEY_STORAGE, gameData.openaiApiKey);
    }
  }, [gameData?.openaiApiKey]);

  // Save Image Generation token separately when it changes
  useEffect(() => {
    if (gameData?.imageGenToken !== undefined) {
      console.log('[GameContext] Image token changed, saving to localStorage:', gameData.imageGenToken);
      localStorage.setItem(IMAGE_GEN_TOKEN_STORAGE, gameData.imageGenToken);
    }
  }, [gameData?.imageGenToken]);

  // 解析技能数据
  const parseSkills = (skillsText) => {
    if (!skillsText) return [];
    
    return skillsText.split('\n')
      .filter(line => line.startsWith('-'))
      .map(skill => {
        const [name, description, level, type, mpCost, damage, effect] = 
          skill.substring(1).trim().split('|').map(s => s.trim());
        
        return {
          name,
          description,
          level: parseInt(level) || 1,
          type,
          mpCost: parseInt(mpCost) || 0,
          damage: damage || 'N/A',
          effect
        };
      });
  };

  // 解析背景信息
  const parseBackground = (text) => {
    const match = text.match(/\((.*?)\)/);
    if (!match) return {};

    const [race, goal, personality, beliefs] = match[1].split(',').map(s => s.trim());
    return {
      race: race || '',
      goal: goal?.replace('Goal:', '').trim() || '',
      personality: personality?.replace('Personality:', '').trim() || '',
      beliefs: beliefs?.replace('Beliefs:', '').trim() || ''
    };
  };

  // 解析队员信息
  const parseMemberInfo = (memberText) => {
    if (!memberText) return null;

    const lines = memberText.split('\n');
    const memberData = {
      name: '',
      gender: '',
      powerLevel: 1,
      maxHp: 0,
      maxMp: 0,
      hp: 0,
      mp: 0,
      skills: [],
      background: {},
      portrait: ''
    };

    let isParsingSkills = false;
    let skillsText = [];
    let backgroundText = '';

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('Skills:')) {
        isParsingSkills = true;
        return;
      }

      if (line.startsWith('Background:')) {
        backgroundText = line;
        return;
      }

      if (line.startsWith('Portrait:')) {
        memberData.portrait = line.replace('Portrait:', '').trim();
        return;
      }

      if (isParsingSkills) {
        if (line.startsWith('-')) {
          skillsText.push(line);
        }
      } else {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          switch (key) {
            case 'Name':
              memberData.name = value;
              break;
            case 'Gender':
              memberData.gender = value;
              break;
            case 'Powerlevel':
              memberData.powerLevel = parseInt(value) || 1;
              break;
            case 'HP':
              const hpValue = parseInt(value) || 0;
              memberData.maxHp = hpValue;
              memberData.hp = hpValue;
              break;
            case 'MP':
              const mpValue = parseInt(value) || 0;
              memberData.maxMp = mpValue;
              memberData.mp = mpValue;
              break;
          }
        }
      }
    });

    memberData.skills = parseSkills(skillsText.join('\n'));
    memberData.background = parseBackground(backgroundText);

    return memberData;
  };

  // 解析游戏数据
  const parseGameData = (apiResponse) => {
    // 从新的API响应结构中获取文本
    const text = apiResponse.outputs?.[0]?.outputs?.[0]?.artifacts?.text?.repr;
    
    if (!text) {
      console.error('[Parse Game Data] Invalid response format:', apiResponse);
      throw new Error('Invalid API response format');
    }

    console.log('[Parse Game Data] Raw text:', text);

    // 使用正则表达式提取各个部分，增强对大小写和空格的鲁棒性
    // 定义可能的部分标题
    const sectionTitles = {
      worldBackground: '(?:World\\s*Background|WORLD\\s*BACKGROUND|WorldBackground)',
      mainDescription: '(?:main\\s*Description|MAIN\\s*DESCRIPTION|MainDescription|mainDescription)',
      basicSetting: '(?:Basic\\s*Setting\\s*(?:Axis)?|BASIC\\s*SETTING\\s*(?:AXIS)?|BasicSetting(?:Axis)?|basicSetting)',
      geography: '(?:Geographical\\s*(?:Topology\\s*)?Network|GEOGRAPHICAL\\s*(?:TOPOLOGY\\s*)?NETWORK|Geography|GEOGRAPHY|geography)',
      lifeforms: '(?:Lifeform\\s*(?:Library)?|LIFEFORM\\s*(?:LIBRARY)?|Lifeforms\\s*(?:Library)?|LIFEFORMS\\s*(?:LIBRARY)?|lifeforms)',
      elements: '(?:Mysterious\\s*(?:Elements)\\s*(?:Pool)?|MYSTERIOUS\\s*(?:ELEMENTS)\\s*(?:POOL)?|Elements|ELEMENTS|elements)',
      laws: '(?:World\\s*Laws|WORLD\\s*LAWS|WorldLaws|Laws|LAWS|laws)',
      mainConflict: '(?:Main\\s*Conflict|MAIN\\s*CONFLICT|MainConflict|mainConflict)',
      imgGen: '(?:ImgGen|IMGGEN|Img\\s*Gen|IMG\\s*GEN|imgGen)',
      teamMember: '(?:TeamMember|Team\\s*Member|TEAMMEMBER|TEAM\\s*MEMBER)'
    };

    // 创建一个通用的部分提取函数
    const extractSection = (sectionName, text) => {
      const sectionRegex = new RegExp(`${sectionTitles[sectionName]}:\\s*((?:[\\s\\S](?!\\n\\n(?:${Object.values(sectionTitles).join('|')})\\s*:))*)`,'i');
      const match = text.match(sectionRegex);
      return match?.[1]?.trim() || '';
    };

    // 提取各个部分
    const sections = {
      worldBackground: extractSection('worldBackground', text),
      mainDescription: extractSection('mainDescription', text),
      basicSetting: extractSection('basicSetting', text),
      geography: extractSection('geography', text),
      lifeforms: extractSection('lifeforms', text),
      elements: extractSection('elements', text),
      laws: extractSection('laws', text),
      mainConflict: extractSection('mainConflict', text),
      imgGen: extractSection('imgGen', text)
    };

    // 特殊处理团队成员，因为它们有后缀 _A 和 _B
    const teamMemberARegex = new RegExp(`${sectionTitles.teamMember}_A\\s*:?\\s*([\\s\\S]*?)(?=\\n\\n${sectionTitles.teamMember}_B|$)`, 'i');
    const teamMemberBRegex = new RegExp(`${sectionTitles.teamMember}_B\\s*:?\\s*([\\s\\S]*)$`, 'i');
    
    sections.teamMemberA = text.match(teamMemberARegex)?.[1]?.trim() || '';
    sections.teamMemberB = text.match(teamMemberBRegex)?.[1]?.trim() || '';

    // 如果mainDescription为空但worldBackground不为空，可能是因为格式不同，尝试从worldBackground中提取
    if (!sections.mainDescription && sections.worldBackground) {
      const parts = sections.worldBackground.split(/\n\n(?:main\s*Description|MAIN\s*DESCRIPTION|MainDescription|maindescription):\s*/i);
      if (parts.length > 1) {
        sections.mainDescription = parts[1].trim();
        sections.worldBackground = parts[0].trim();
      }
    }

    // 打印解析后的各个部分
    console.log('[Parse Game Data] Parsed sections:', sections);

    // 解析世界法则为数组
    const laws = sections.laws.split('\n')
      .filter(law => law.trim())
      .map(law => law.trim());

    const parsedData = {
      worldBackground: {
        mainDescription: sections.mainDescription || sections.worldBackground, // 如果mainDescription为空，使用worldBackground
        basicSetting: sections.basicSetting,
        geography: sections.geography,
        lifeforms: sections.lifeforms,
        elements: sections.elements,
        laws,
        mainConflict: sections.mainConflict
      },
      imageGeneration: {
        prompt: sections.imgGen,
        generatedImageUrl: null
      },
      teamMembers: {
        A: parseMemberInfo(sections.teamMemberA),
        B: parseMemberInfo(sections.teamMemberB)
      }
    };

    console.log('[Parse Game Data] Final parsed data:', parsedData);
    return parsedData;
  };

  const parseBattleData = (text) => {
    console.log('[Battle Parser] Starting to parse battle text:', text);
    
    try {
      const battleData = {
        levelStory: "",
        totalRounds: 0,
        dangerLevel: 0,
        portrait: "",
        rounds: [],
        isActive: false,
        currentRound: 0,
        status: 'initializing'
      };

      // 解析关卡故事
      const levelStoryMatch = text.match(/Level Story:([\s\S]*?)(?=\nDanger Level)/);
      if (levelStoryMatch) {
        battleData.levelStory = levelStoryMatch[1].trim();
        console.log('[Battle Parser] Parsed level story');
      }

      // 解析危险等级
      const dangerLevelMatch = text.match(/Danger Level: (\d+)/);
      if (dangerLevelMatch) {
        battleData.dangerLevel = parseInt(dangerLevelMatch[1]);
        console.log('[Battle Parser] Parsed danger level:', battleData.dangerLevel);
      }

      // 解析总回合数
      const totalRoundsMatch = text.match(/Total Rounds: (\d+)/);
      if (totalRoundsMatch) {
        battleData.totalRounds = parseInt(totalRoundsMatch[1]);
        console.log('[Battle Parser] Parsed total rounds:', battleData.totalRounds);
      }

      // 解析肖像描述
      const portraitMatch = text.match(/Portrait:([\s\S]*?)(?=\n\nRound 1:)/);
      if (portraitMatch) {
        battleData.portrait = portraitMatch[1].trim();
        console.log('[Battle Parser] Parsed portrait description');
      }

      // 解析每个回合的敌人数据
      for (let i = 1; i <= battleData.totalRounds; i++) {
        const roundRegex = new RegExp(`Round ${i}:([\\s\\S]*?)(?=Round ${i + 1}:|$)`);
        const roundMatch = text.match(roundRegex);
        
        if (roundMatch) {
          const enemies = parseRoundEnemies(roundMatch[1].trim(), i);
          battleData.rounds.push(enemies);
          console.log(`[Battle Parser] Parsed round ${i} with ${enemies.length} enemies`);
        }
      }

      battleData.status = 'ready';
      battleData.currentRound = 1;
      battleData.isActive = true;

      console.log('[Battle Parser] Successfully parsed battle data:', battleData);
      return battleData;
    } catch (error) {
      console.error('[Battle Parser] Error parsing battle data:', error);
      return {
        levelStory: "Error generating battle scenario",
        totalRounds: 0,
        dangerLevel: 0,
        portrait: "",
        rounds: [],
        isActive: false,
        currentRound: 0,
        status: 'error'
      };
    }
  };

  const parseRoundEnemies = (roundText, roundNumber) => {
    console.log(`[Battle Parser] Parsing enemies for round ${roundNumber}:`, roundText);
    
    try {
      const enemies = [];
      const enemyEntries = roundText.split(/(?=- EnemyName:)/);

      for (const entry of enemyEntries) {
        if (!entry.trim()) continue;

        const nameMatch = entry.match(/EnemyName: ([^\n]+)/);
        const raceMatch = entry.match(/Race: ([^\n]+)/);
        const portraitMatch = entry.match(/Portrait: ([^\n]+)/);
        const hpMatch = entry.match(/HP: (\d+)/);
        const skillMatch = entry.match(/Skill: ([^\n]+)/);

        if (nameMatch && raceMatch && hpMatch && skillMatch) {
          const [skillName, damage, effect] = skillMatch[1].split('|').map(s => s.trim());
          
          const enemy = {
            id: `enemy-${roundNumber}-${enemies.length}`,
            name: nameMatch[1].trim(),
            race: raceMatch[1].trim(),
            portrait: portraitMatch ? portraitMatch[1].trim() : '',
            hp: parseInt(hpMatch[1]),
            maxHp: parseInt(hpMatch[1]),
            skill: {
              name: skillName,
              damage: parseInt(damage) || damage,
              effect: effect
            }
          };

          enemies.push(enemy);
          console.log(`[Battle Parser] Parsed enemy:`, enemy);
        }
      }

      return enemies;
    } catch (error) {
      console.error(`[Battle Parser] Error parsing round ${roundNumber}:`, error);
      throw error;
    }
  };

  const updateGameData = (data) => {
    if (typeof data === 'function') {
      setGameData(data);
      return;
    }

    // 检查新的API响应格式
    if (data.outputs?.[0]?.outputs?.[0]?.artifacts?.text?.repr) {
      try {
        const parsedData = parseGameData(data);
        console.log('[Game Context] Parsed game data:', parsedData);

        setGameData(prev => {
          // 保留之前的图片URL（如果有的话）
          const prevImageGeneration = prev?.imageGeneration || INITIAL_GAME_STATE.imageGeneration;
          
          return {
            ...parsedData,
            imageGeneration: {
              ...parsedData.imageGeneration,
              generatedImageUrl: prevImageGeneration.generatedImageUrl
            }
          };
        });
      } catch (error) {
        console.error('[Game Context] Error parsing game data:', error);
        throw error;
      }
      return;
    }

    // 处理图片生成的更新
    if (data.imageGeneration?.generatedImageUrl) {
      console.log('[Game Context] Updating image URL:', data.imageGeneration.generatedImageUrl);
      setGameData(prev => ({
        ...prev,
        imageGeneration: {
          ...prev.imageGeneration,
          generatedImageUrl: data.imageGeneration.generatedImageUrl
        }
      }));
      return;
    }

    // 其他数据更新
    setGameData(prev => ({
      ...prev,
      ...data
    }));
  };

  const updateBattleState = (memberUpdates) => {
    setGameData(prev => {
      const updatedTeamMembers = { ...prev.teamMembers };
      const updatedRounds = [...prev.battleInstance.rounds];
      
      // 更新队员状态
      Object.entries(memberUpdates).forEach(([id, updates]) => {
        if (id in updatedTeamMembers) {
          const prevHp = updatedTeamMembers[id].hp;
          updatedTeamMembers[id] = {
            ...updatedTeamMembers[id],
            ...updates,
            isHit: updates.hp < prevHp // 添加受击标记
          };
        } else {
          // 更新敌人状态
          const roundIndex = prev.battleInstance.currentRound - 1;
          if (updatedRounds[roundIndex]) {
            updatedRounds[roundIndex] = updatedRounds[roundIndex].map(enemy => {
              if (enemy.id === id) {
                const prevHp = enemy.hp;
                return {
                  ...enemy,
                  ...updates,
                  isHit: updates.hp < prevHp // 添加受击标记
                };
              }
              return enemy;
            });
          }
        }
      });

      // 清除上一轮的受击标记
      setTimeout(() => {
        setGameData(current => {
          const resetTeamMembers = { ...current.teamMembers };
          const resetRounds = [...current.battleInstance.rounds];
          
          Object.keys(resetTeamMembers).forEach(id => {
            if (resetTeamMembers[id]) {
              resetTeamMembers[id] = { ...resetTeamMembers[id], isHit: false };
            }
          });
          
          const roundIndex = current.battleInstance.currentRound - 1;
          if (resetRounds[roundIndex]) {
            resetRounds[roundIndex] = resetRounds[roundIndex].map(enemy => ({
              ...enemy,
              isHit: false
            }));
          }
          
          return {
            ...current,
            teamMembers: resetTeamMembers,
            battleInstance: {
              ...current.battleInstance,
              rounds: resetRounds
            }
          };
        });
      }, 200); // 动画持续时间后清除标记

      return {
        ...prev,
        teamMembers: updatedTeamMembers,
        battleInstance: {
          ...prev.battleInstance,
          rounds: updatedRounds
        }
      };
    });
  };

  const updateBattleData = async (inputValue) => {
    try {
      // Add proper null checks to prevent "Cannot read properties of undefined" error
      if (gameData?.battleInstance?.status === 'ready') {
        console.log('[Battle] Using existing battle data');
        return;
      }

      // Check if OpenAI API key is provided
      let apiKey = gameData?.openaiApiKey;
      if (!apiKey) {
        // Try to get from localStorage directly
        apiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE);
        if (!apiKey) {
          console.warn('[Battle] OpenAI API key is not set');
          setGameData(prev => ({
            ...prev,
            battleInstance: {
              ...INITIAL_GAME_STATE.battleInstance,
              status: 'error',
              error: 'OpenAI API key is not set. Please set it in the Admin Terminal Settings tab.'
            }
          }));
          return;
        } else {
          console.log('[Battle] Using API key from localStorage');
        }
      }

      // Set initial state
      setGameData(prev => ({
        ...prev,
        battleInstance: {
          ...INITIAL_GAME_STATE.battleInstance,
          status: 'initializing'
        }
      }));

      console.log('[Battle] Starting battle generation with input:', inputValue);

      if (!inputValue) {
        console.warn('[Battle] Input value is empty');
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: 'Input value is empty'
          }
        }));
        return;
      }

      const requestBody = {
        output_type: "chat",
        input_type: "chat",
        tweaks: {
          "ChatInput-YHscT": {
            "background_color": "",
            "chat_icon": "",
            "files": "",
            "input_value": inputValue,
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
      };

      console.log('[Battle API] Request:', {
        url: "http://47.80.4.197:30409/api/v1/run/rounds?stream=false",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY",
          "x-api-key": "sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY"
        },
        body: JSON.stringify(requestBody, null, 2)
      });

      let response;
      try {
        response = await fetch(
          "http://47.80.4.197:30409/api/v1/run/rounds?stream=false",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY",
              "Content-Type": "application/json",
              "x-api-key": "sk-rIZ898CT2ycOOWsgLWcEUfxXHxCdaVG761bfDsyZ9cY"
            },
            body: JSON.stringify(requestBody)
          }
        );
      } catch (error) {
        console.error('[Battle API] Network error:', error);
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: `Network error: ${error.message}`
          }
        }));
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Battle API] Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        const errorMessage = `HTTP error! status: ${response.status}`;
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: errorMessage
          }
        }));
        throw new Error(errorMessage);
      }

      let apiResponse;
      try {
        apiResponse = await response.json();
      } catch (error) {
        console.error('[Battle API] JSON parsing error:', error);
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: `JSON parsing error: ${error.message}`
          }
        }));
        throw error;
      }
      
      console.log('[Battle API] Raw Response:', JSON.stringify(apiResponse, null, 2));

      // 打印完整的响应结构
      console.log('[Battle API] Response Structure:', {
        hasOutputs: !!apiResponse?.outputs,
        outputsLength: apiResponse?.outputs?.length,
        firstOutput: apiResponse?.outputs?.[0],
        nestedOutputs: apiResponse?.outputs?.[0]?.outputs,
        results: apiResponse?.outputs?.[0]?.outputs?.[0]?.results,
        message: apiResponse?.outputs?.[0]?.outputs?.[0]?.results?.message,
        dataType: typeof apiResponse?.outputs?.[0]?.outputs?.[0]?.results?.message?.data,
        text: apiResponse?.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text
      });
      
      const battleText = apiResponse?.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text;
      
      if (!battleText) {
        console.error('[Battle API] Invalid response structure:', apiResponse);
        const errorMessage = 'Invalid API response format: Missing battle text';
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: errorMessage
          }
        }));
        throw new Error(errorMessage);
      }
      
      console.log('[Battle API] Extracted Battle Text:', battleText);
      
      let parsedBattleData;
      try {
        parsedBattleData = parseBattleData(battleText);
      } catch (error) {
        console.error('[Battle] Error parsing battle data:', error);
        setGameData(prev => ({
          ...prev,
          battleInstance: {
            ...INITIAL_GAME_STATE.battleInstance,
            status: 'error',
            error: `Error parsing battle data: ${error.message}`
          }
        }));
        throw error;
      }
      
      console.log('[Battle] Parsed Battle Data:', parsedBattleData);
      
      setGameData(prev => {
        const newState = {
          ...prev,
          battleHistory: [...(prev?.battleHistory || []), {
            timestamp: new Date().toISOString(),
            round: prev?.battleInstance?.currentRound || 1,
            process: battleText
          }],
          battleProcessHistory: [
            ...(prev?.battleProcessHistory || []),
            {
              timestamp: new Date().toISOString(),
              gameRound: prev?.battleInstance?.currentRound || 1,
              subRound: prev?.battleInstance?.currentSubRound || 1,
              process: battleText
            }
          ],
          battleInstance: {
            ...parsedBattleData,
            isActive: true,
            currentRound: 1,
            status: 'ready'
          }
        };
        console.log('[Battle] Updated Game State:', newState);
        return newState;
      });
    } catch (error) {
      console.error('[Battle] Error generating battle:', error);
      throw error; // Re-throw to allow the caller to handle it
    }
  };

  const clearBattleHistory = () => {
    setGameData(prev => ({
      ...prev,
      battleHistory: []
    }));
    localStorage.removeItem(BATTLE_HISTORY_KEY);
  };

  const resetGame = () => {
    // Get the current API key before resetting
    const currentApiKey = gameData.openaiApiKey;
    
    setGameData({
      ...INITIAL_GAME_STATE,
      battleProcessHistory: [],
      openaiApiKey: currentApiKey, // Keep the API key
      imageGenToken: gameData.imageGenToken // Keep the image generation token
    });
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BATTLE_HISTORY_KEY);
    localStorage.removeItem(BATTLE_PROCESS_KEY);
    // Don't remove the API key from localStorage
  };

  const resetBattle = () => {
    setGameData(prev => ({
      ...prev,
      battleProcessHistory: [],
      battleInstance: INITIAL_GAME_STATE.battleInstance
    }));
    localStorage.removeItem(BATTLE_PROCESS_KEY);
  };

  const saveBattleProcess = (battleProcess, gameRound, subRound) => {
    setGameData(prev => ({
      ...prev,
      battleProcessHistory: Array.isArray(prev.battleProcessHistory) ?
        [...prev.battleProcessHistory, {
          timestamp: new Date().toISOString(),
          gameRound,
          subRound,
          process: battleProcess
        }] :
        [{
          timestamp: new Date().toISOString(),
          gameRound,
          subRound,
          process: battleProcess
        }]
    }));
  };

  // Add a function to update the OpenAI API key
  const updateOpenAIApiKey = (apiKey) => {
    console.log('[updateOpenAIApiKey] Saving API key to localStorage:', apiKey);
    
    // Save API key separately to ensure it persists even when game data is reset
    localStorage.setItem(OPENAI_API_KEY_STORAGE, apiKey);
    
    setGameData(prev => ({
      ...prev,
      openaiApiKey: apiKey
    }));
  };

  function updateImageGenerationToken(token) {
    setGameData(prevData => ({
      ...prevData,
      imageGenToken: token
    }));
  }

  const value = {
    gameData,
    updateGameData,
    updateBattleData,
    saveBattleProcess,
    resetGame,
    resetBattle,
    clearBattleHistory,
    updateOpenAIApiKey,
    updateImageGenerationToken
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  // 确保返回的 gameData 至少包含初始状态
  return {
    ...context,
    gameData: context.gameData || INITIAL_GAME_STATE
  };
} 