import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { formatError, parseBattleResponseSafely } from '../utils/errorHandling';

function SubRoundBattle() {
  const { gameData, updateGameData, saveBattleProcess } = useGame();
  const [selectedSkills, setSelectedSkills] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 当前 round（下标从 0 开始）
  const currentRoundIndex = gameData.battleInstance.currentRound - 1;
  const currentEnemies = (gameData.battleInstance.rounds && gameData.battleInstance.rounds[currentRoundIndex]) || [];
  const battleInstance = gameData.battleInstance;

  // 提取存活的我方队员（例如 teamMembers.A、teamMembers.B），过滤掉 hp 小于等于 0 的
  const aliveTeamEntries = Object.entries(gameData.teamMembers || {}).filter(
    ([id, member]) => member && member.hp > 0
  );

  // 将队员和敌人按照索引配对
  const pairCount = Math.min(aliveTeamEntries.length, currentEnemies.length);
  const pairs = aliveTeamEntries.slice(0, pairCount).map(([teamId, member], index) => {
    return { teamId, member, enemy: currentEnemies[index] };
  });

  // 当用户选择某个队员的技能时
  const handleSkillChange = (teamId, skillIndex) => {
    setSelectedSkills(prev => ({
      ...prev,
      [teamId]: skillIndex,
    }));
  };

  // 提交 sub-round 请求
  const handleSubmit = async () => {
    // 校验每个配对中必须选择一个技能
    for (const pair of pairs) {
      if (selectedSkills[pair.teamId] === undefined) {
        alert(`请为 ${pair.member.name} 选择一个技能`);
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);

    // 构造战斗数据
    const survivingEnemies = currentEnemies.filter(e => e.hp > 0).map(e => e.id).join(', ');
    const survivingTeamMembers = aliveTeamEntries.map(([id, _]) => id).join(', ');

    // 构造敌人详细信息
    const enemyDetails = currentEnemies.filter(enemy => enemy.hp > 0).map(enemy => {
      const skill = Array.isArray(enemy.skill) 
        ? enemy.skill[Math.floor(Math.random() * enemy.skill.length)]
        : enemy.skill;
      
      return `${enemy.id}:\nNamed "${enemy.name}", current HP: ${enemy.hp}. Uses the skill "${skill.name}", dealing ${skill.damage} damage, ${skill.effect ? `${skill.effect}` : ''}.`;
    }).join('\n\n');

    // 构造队员详细信息，包括所选技能
    const teamMemberDetails = pairs.map(pair => {
      const { teamId, member } = pair;
      const selectedSkillIndex = selectedSkills[teamId];
      const skills = member.skills || member.Skills || [];
      const skill = skills[selectedSkillIndex];
      
      return `${teamId}:\nNamed "${member.name}", current HP: ${member.hp}, current MP: ${member.mp}. Uses the skill "${skill.name}", MP cost: ${skill.mpCost}, dealing ${skill.damage} damage, ${skill.effect ? `${skill.effect}` : ''}.`;
    }).join('\n\n');

    // 构造完整的战斗数据
    const battleData = `SubRound Battle:

Surviving Members:
Enemies: ${survivingEnemies}
OurTeam: ${survivingTeamMembers}

${enemyDetails}

${teamMemberDetails}

Level Story:
${battleInstance.levelStory || 'No story available.'}`;

    console.log("[SubRound Battle] Battle data:", battleData);

    // 检查 OpenAI API key
    let apiKey = gameData?.openaiApiKey;
    if (!apiKey) {
      // 尝试从 localStorage 直接获取
      apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        setError('请在管理终端的设置中配置您的 OpenAI API key。');
        setIsSubmitting(false);
        return;
      } else {
        console.log('[SubRound Battle] Using API key from localStorage');
      }
    }

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
                "temperature": 0.27
              },
              "OpenAIModel-Pb4NR": {
                "api_key": apiKey,
                "input_value": "",
                "json_mode": false,
                "max_tokens": null,
                "model_kwargs": {},
                "model_name": "gpt-4o-mini",
                "openai_api_base": "",
                "seed": 1,
                "stream": false,
                "system_message": "",
                "temperature": 0.1
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

      // 获取战斗过程文本
      const battleProcessText = parseBattleResponseSafely(data);
      
      // 保存战斗过程
      saveBattleProcess(
        battleProcessText,
        battleInstance.currentRound,
        1 // SubRound 默认为 1
      );
      
      console.log('[SubRound Battle] Battle result received:', battleProcessText);
      
      // 更新 UI 状态
      alert('战斗回合完成！请查看结果。');

    } catch (error) {
      console.error('[SubRound Battle] API Error:', error);
      setError(formatError(error));
    } finally {
      setIsSubmitting(false);
      // 清除选中的技能
      setSelectedSkills({});
    }
  };

  // 如果没有有效配对，则不展示 sub-round 控制面板
  if (pairs.length === 0) {
    return null;
  }

  return (
    <div className="subround-battle-panel">
      <h3>Sub-Round Battle</h3>
      {pairs.map(pair => (
        <div key={pair.teamId} className="subround-battle-pair" style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <div className="team-member-info">
            <strong>{pair.member.name}</strong> (HP: {pair.member.hp}, MP: {pair.member.mp})
            <div>
              <label>Select Skill: </label>
              <select
                value={selectedSkills[pair.teamId] !== undefined ? selectedSkills[pair.teamId] : ""}
                onChange={(e) => handleSkillChange(pair.teamId, parseInt(e.target.value))}
              >
                <option value="" disabled>
                  -- Select Skill --
                </option>
                {pair.member.Skills.map((skill, idx) => (
                  <option 
                    key={idx} 
                    value={idx}
                    disabled={pair.member.mp < skill.mpCost}
                  >
                    {skill.name} (消耗 MP: {skill.mpCost})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="enemy-info" style={{ marginTop: '10px' }}>
            <strong>{pair.enemy.name}</strong> (HP: {pair.enemy.hp})
            <div>
              敌方技能： { Array.isArray(pair.enemy.skill) ? "多种技能" : pair.enemy.skill.name }
            </div>
          </div>
        </div>
      ))}
      {error && <div className="error-message" style={{ color: 'red' }}>错误：{error}</div>}
      <button 
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(selectedSkills).length < pairs.length}
      >
        {isSubmitting ? "请求中..." : "触发 Sub-Round 战斗"}
      </button>
    </div>
  );
}

export default SubRoundBattle; 