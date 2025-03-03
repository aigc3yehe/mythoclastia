import React from 'react';
import './LoadingScreen.css';

function LoadingScreen({ stages }) {
  const getStageIcon = (completed) => completed ? '★' : '·';

  const getProgressBar = (completed) => {
    return completed ? '[■■■■■]' : '[□□□□□]';
  };

  const getStageEmoji = () => {
    if (stages.imageGen) return '(｀・ω・´)⭐';
    if (stages.characterGen) return '(◕‿◕✿)';
    return '(｡♥‿♥｡)';
  };

  const getStageMessage = () => {
    if (stages.imageGen) return 'Battle Reasoning Complete!';
    if (stages.characterGen) return 'Character Generation Complete!';
    if (stages.worldBuilding) return 'World Building Complete!';
    return 'Building World...';
  };

  return (
    <div className="loading-screen">
      <pre className="ascii-loading">
        {`
     ╔════════════════════════╗
     ║    SYSTEM LOADING      ║
     ╚════════════════════════╝

     ${getStageEmoji()}

     [${getStageMessage()}]
     
     ╔═══════════════════════════════════╗
     ║ World Building    ${getProgressBar(stages.worldBuilding)} ${getStageIcon(stages.worldBuilding)} ║
     ║ Character Gen     ${getProgressBar(stages.characterGen)} ${getStageIcon(stages.characterGen)} ║
     ║ Battle Reasoning  ${getProgressBar(stages.imageGen)} ${getStageIcon(stages.imageGen)} ║
     ╚═══════════════════════════════════╝
     
     ┌────────────────────────┐
     │ Initializing Systems...│
     └────────────────────────┘
        `}
      </pre>
    </div>
  );
}

export default LoadingScreen; 