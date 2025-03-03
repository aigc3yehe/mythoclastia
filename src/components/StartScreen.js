import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import iconImage from '../imgs/icon.png';
import './StartScreen.css';
import { FaDice } from 'react-icons/fa';

function StartScreen({ onStart }) {
  const [prompt, setPrompt] = useState('');
  const { resetGame, gameData } = useGame();
  const [stars, setStars] = useState([]);

  const worldThemes = [
    "Dark Magic World",
    "Furry Universe",
    "Elemental Life Battle World",
    "Sticky Slime Battle World",
    "Heartwarming Cute Animal World",
    "Wizard World",
    "Cyberpunk Dystopia",
    "Steampunk Adventure",
    "Underwater Kingdom",
    "Galactic Empire",
    "Post-Apocalyptic Survival",
    "Mystical Forest",
    "Haunted Mansion",
    "Time Travel Odyssey",
    "Parallel Universe",
    "Alien Invasion",
    "Robot Rebellion",
    "Pirate Treasure Hunt",
    "Vampire Coven",
    "Werewolf Pack",
    "Dragon's Lair",
    "Fairy Tale Land",
    "Superhero City",
    "Zombie Apocalypse",
    "Medieval Kingdom",
    "Ancient Egypt",
    "Lost Atlantis",
    "Fantasy Island",
    "Desert Oasis",
    "Frozen Tundra",
    "Jungle Expedition",
    "Space Exploration",
    "Virtual Reality",
    "Dreamscape",
    "Monster Hunter",
    "Magic School",
    "Cursed Village",
    "Enchanted Castle",
    "Samurai Era",
    "Wild West",
    "Renaissance Fair",
    "Mystery Mansion",
    "Ghost Town",
    "Carnival of Wonders",
    "Circus of Dreams",
    "Art Deco Metropolis",
    "Victorian London",
    "Gothic Horror",
    "Mythical Creatures",
    "Celestial Realm"
  ];

  // Check if there is cached data
  const hasCachedData = gameData && 
    gameData.worldBackground.mainDescription && 
    gameData.teamMembers.A && 
    gameData.teamMembers.B;

  useEffect(() => {
    // Create new stars
    const createStar = () => {
      const characters = ['★', '☆', '·', '*', '✧'];
      return {
        id: Math.random(),
        char: characters[Math.floor(Math.random() * characters.length)],
        x: Math.random() * 100,
        y: -10,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.1 + Math.random() * 0.3
      };
    };

    // Update star positions
    const updateStars = () => {
      setStars(prevStars => {
        const newStars = prevStars
          .map(star => ({
            ...star,
            y: star.y + star.speed
          }))
          .filter(star => star.y < 100);

        // Randomly add new stars
        if (Math.random() < 0.1 && newStars.length < 15) {
          newStars.push(createStar());
        }

        return newStars;
      });
    };

    const intervalId = setInterval(updateStars, 50);
    return () => clearInterval(intervalId);
  }, []);

  const handleRestart = () => {
    resetGame();
    localStorage.clear(); // Clear all local storage
    window.location.reload(); // Refresh page to ensure complete reset
  };

  const handleRandomWorld = () => {
    const randomIndex = Math.floor(Math.random() * worldThemes.length);
    setPrompt(worldThemes[randomIndex]);
  };

  const asciiTitle = `
███╗   ███╗██╗   ██╗████████╗██╗  ██╗ ██████╗  ██████╗██╗      █████╗ ███████╗████████╗██╗ █████╗ 
████╗ ████║╚██╗ ██╔╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝██║     ██╔══██╗██╔════╝╚══██╔══╝██║██╔══██╗
██╔████╔██║ ╚████╔╝    ██║   ███████║██║   ██║██║     ██║     ███████║███████╗   ██║   ██║███████║
██║╚██╔╝██║  ╚██╔╝     ██║   ██╔══██║██║   ██║██║     ██║     ██╔══██║╚════██║   ██║   ██║██╔══██║
██║ ╚═╝ ██║   ██║      ██║   ██║  ██║╚██████╔╝╚██████╗███████╗██║  ██║███████║   ██║   ██║██║  ██║
╚═╝     ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═╝
`;

  return (
    <div className="start-screen">
      <div className="stars-container">
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: star.opacity
            }}
          >
            {star.char}
          </div>
        ))}
      </div>
      <div className="ascii-title">
        <pre>{asciiTitle}</pre>
      </div>
      <div className="start-container">
        <div className="icon-container">
          <img src={iconImage} alt="Game Icon" className="game-icon" />
        </div>
        <div className="prompt-input-container">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={hasCachedData ? "Continue with cached world..." : "Enter your world theme..."}
            className="prompt-input"
            disabled={hasCachedData}
          />
          <button onClick={handleRandomWorld} className="dice-button">
            <FaDice />
          </button>
        </div>
        <div className="button-group">
          <button
            onClick={() => onStart(prompt)}
            className="start-button"
            disabled={!hasCachedData && !prompt.trim()}
          >
            {hasCachedData ? 'Continue' : 'Game Start'}
          </button>
          {hasCachedData && (
            <button
              onClick={handleRestart}
              className="restart-button"
            >
              Restart
            </button>
          )}
        </div>
        {hasCachedData && (
          <div className="cache-notice">
            'Continue' to use cached data. 'Restart' to create a new world.
          </div>
        )}
      </div>
    </div>
  );
}

export default StartScreen; 