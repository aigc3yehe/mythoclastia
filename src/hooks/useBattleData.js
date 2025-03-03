import { useState } from 'react';

export function useBattleData() {
  const [battleHistory, setBattleHistory] = useState([]);

  const parseBattleResponse = (responseData) => {
    try {
      if (!responseData?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        throw new Error('Invalid response format: missing required data');
      }

      const text = responseData.outputs[0].outputs[0].results.message.text;
      console.log('[Battle Data] Raw response text:', text);
      
      // 分离战斗过程和状态更新
      const parts = text.split('\n\nSurviving Members:');
      if (parts.length !== 2) {
        throw new Error('Invalid battle data format: missing status update section');
      }
      
      const [battleProcess, statusUpdate] = parts;
      console.log('[Battle Data] Status update section:', statusUpdate);
      
      // 保存战斗记录
      setBattleHistory(prev => [...prev, {
        process: `Battle Process:\n${battleProcess}`,
        gameRound: 1, // You may need to adjust this based on your game state
        subRound: 1, // You may need to adjust this based on your game state
        timestamp: new Date().toISOString()
      }]);

      // 解析存活成员状态
      const sections = statusUpdate.split('\n\n');
      console.log('[Battle Data] Split sections:', sections);
      const memberUpdates = {};
      
      sections.forEach(section => {
        if (!section.trim()) return;
        
        const lines = section.split('\n');
        console.log('[Battle Data] Processing section lines:', lines);
        if (lines.length < 2) return;

        const [idLine, statusLine] = lines;
        const id = idLine.split(':')[0].trim();
        
        // 解析状态行
        const statusMatch = statusLine.match(/Named "([^"]+)", current HP: (-?\d+)(?:, current MP: (\d+))?\. Buffs: ([^.]+)\. Debuffs: ([^.]+)/);
        if (!statusMatch) {
          console.warn('[Battle Data] Failed to match status line:', statusLine);
          return;
        }

        const [_, name, hp, mp, buffs, debuffs] = statusMatch;
        console.log('[Battle Data] Matched status data:', { name, hp, mp, buffs, debuffs });
        
        memberUpdates[id] = {
          hp: Math.max(0, parseInt(hp)), // Ensure HP is never negative
          mp: mp ? parseInt(mp) : undefined,
          buffs: buffs === 'None' ? [] : buffs.split(', '),
          debuffs: debuffs === 'None' ? [] : debuffs.split(', ')
        };
      });

      console.log('[Battle Data] Final member updates:', memberUpdates);
      return memberUpdates;
    } catch (error) {
      console.error('[Battle Data] Error parsing battle response:', error);
      throw new Error(`Failed to parse battle data: ${error.message}`);
    }
  };

  return {
    battleHistory,
    parseBattleResponse
  };
} 