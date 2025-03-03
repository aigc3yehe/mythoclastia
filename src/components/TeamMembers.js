import React, { useState, useEffect } from 'react';
import { FaImage, FaInfoCircle, FaMars, FaVenus } from 'react-icons/fa';
import './TeamMembers.css';

// 格式化成员信息
const formatMemberInfo = (info) => {
  if (!info) return null;
  try {
    // 移除可能的前缀
    const cleanInfo = info.replace(/^TeamMember_[AB]:/i, '').trim();
    
    // 解析文本格式的成员信息
    const lines = cleanInfo.split('\n');
    const member = {};
    let isParsingSkills = false;
    let currentSkillData = [];

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('Skills:')) {
        isParsingSkills = true;
        return;
      }

      if (isParsingSkills) {
        if (line.startsWith('-')) {
          // 新技能
          const skillData = line.substring(1).trim();
          const [name, description, level, type, mpCost, damage, effect] = 
            skillData.split('|').map(part => part.trim());
          
          currentSkillData.push({
            name,
            type,
            level: parseInt(level) || 1,
            mpCost: parseInt(mpCost) || 0,
            damage: damage || 'N/A',
            effect,
            description
          });
        }
      } else {
        // 处理基本信息
        const [key, ...valueParts] = line.split(':');
        if (valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          member[key.trim()] = value;
        }
      }
    });

    // 确保始终有3个技能
    member.Skills = currentSkillData.length ? currentSkillData : Array(3).fill({
      name: 'Unknown Skill',
      type: 'Unknown',
      level: 1,
      mpCost: 0,
      damage: 'N/A',
      effect: 'No effect',
      description: 'No description'
    });

    // 如果技能数量超过3个，只保留前3个
    member.Skills = member.Skills.slice(0, 3);

    console.log('[Team] Parsed member info:', member);
    return member;

  } catch (error) {
    console.error('[Team] Failed to parse member info:', error);
    return null;
  }
};

// 添加 SkillDisplay 组件来处理技能显示
const SkillDisplay = ({ skill, index }) => {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div className="skill-item">
      <div className="skill-header">
        <h5>{`${index + 1}. ${skill.name}`}</h5>
        <div className="skill-info">
          <span className="skill-type">[{skill.type}]</span>
          <div 
            className="skill-description-icon"
            onMouseEnter={() => setShowDescription(true)}
            onMouseLeave={() => setShowDescription(false)}
          >
            <FaInfoCircle className="info-icon" />
            {showDescription && (
              <div className="skill-description-popup">
                {skill.description}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="skill-details">
        <span className="skill-level">Level: {skill.level}</span>
        <span className="skill-mp">MP Cost: {skill.mpCost}</span>
        {skill.damage !== 'N/A' && (
          <span className="skill-damage">Damage: {skill.damage}</span>
        )}
      </div>
      <div className="skill-effect">
        <span className="effect-label">{'>'} Effect:</span>
        <span className="effect-text">{skill.effect}</span>
      </div>
    </div>
  );
};

// Function to determine avatar frame style based on level
const getAvatarFrameStyle = (level) => {
  switch (level) {
    case 5:
      return 'avatar-frame-legendary';
    case 4:
      return 'avatar-frame-epic';
    case 3:
      return 'avatar-frame-rare';
    default:
      return 'avatar-frame-common';
  }
};

// Single member card component
const MemberCard = ({ member, label }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // 移动 useEffect 到最前面
  useEffect(() => {
    if (!member) return;

    const cachedUrl = localStorage.getItem(`avatar_${label}`);
    if (cachedUrl) {
      setAvatarUrl(cachedUrl);
    } else if (member.avatarUrl) {
      setAvatarUrl(member.avatarUrl);
      localStorage.setItem(`avatar_${label}`, member.avatarUrl);
    }
  }, [member, label]);

  // 空值检查移到 render 部分
  if (!member) return null;
  
  const isDead = (member?.hp ?? 0) <= 0;

  const PowerLevel = ({ level }) => {
    const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
    return (
      <span className="power-level" title={`Power Level ${level}`}>
        {stars}
      </span>
    );
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

  const getAsciiPortrait = () => {
    // Generate ASCII art based on member characteristics
    let asciiArt = '';
    
    if (member?.background?.race?.toLowerCase().includes('elf')) {
      asciiArt = `  /|\\
 /o o\\
/  ^  \\
\\_---_/
  | |
  | |`;
    } else if (member?.background?.race?.toLowerCase().includes('dwarf')) {
      asciiArt = `  ,---.
 /     \\
| o _ o |
|  \\_/  |
 \\_____/
   |||`;
    } else if (member?.background?.race?.toLowerCase().includes('orc')) {
      asciiArt = `  ,---,
 / o o \\
|   ^   |
|  \\_/  |
 \\_____/
   |||`;
    } else {
      // Default human-like ASCII art
      asciiArt = `  ,---.
 /     \\
| o   o |
|   ^   |
|  \\_/  |
 \\_____/`;
    }
    
    return (
      <div className="ascii-portrait">
        {asciiArt}
      </div>
    );
  };

  // Check if we have a token by checking if localStorage has the image_gen_token
  const hasToken = !!localStorage.getItem('image_gen_token');

  return (
    <div className="member-card">
      <div className="member-header">
        <h3>+==[ Member {label} ]==+</h3>
        <PowerLevel level={member?.powerLevel || 1} />
      </div>
      
      <div className="member-content">
        <div className="member-basic-info">
          <div className="member-profile">
            <div className={`member-avatar ${getAvatarFrameStyle(member?.powerLevel)} ${isDead ? 'dead' : ''} ${member?.isHit ? 'hit' : ''}`}>
              {isDead ? (
                getDeadPortrait()
              ) : avatarUrl && hasToken ? (
                <img src={avatarUrl} alt={`${member.name}'s Avatar`} className="avatar-image" />
              ) : !hasToken ? (
                <div className="avatar-placeholder no-token">
                  {getAsciiPortrait()}
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <FaImage />
                </div>
              )}
            </div>
            <div className="member-info">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{member?.name || 'Unknown'}</span>
              </div>
              <div className="info-icons">
                {member?.gender === 'Male' ? <FaMars className="gender-icon" /> : <FaVenus className="gender-icon" />}
                <span className="info-value">{member?.background?.race || 'Unknown'}</span>
                <div className="info-icon">
                  <FaInfoCircle />
                  <div className="info-popup">
                    <div><strong>Goal:</strong> {member?.background?.goal || 'Unknown'}</div>
                    <div><strong>Beliefs:</strong> {member?.background?.beliefs || 'Unknown'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="member-stats">
          <div className="stat-bar">
            <div className="bar-container">
              <div className="bar-background">
                <div 
                  className="bar hp-bar" 
                  style={{ 
                    width: `${((member?.hp || 0) / (member?.maxHp || 1)) * 100}%` 
                  }}
                />
              </div>
              <span className="bar-label">
                HP [{member?.hp || 0}/{member?.maxHp || 0}]
              </span>
            </div>
          </div>
          <div className="stat-bar">
            <div className="bar-container">
              <div className="bar-background">
                <div 
                  className="bar mp-bar" 
                  style={{ 
                    width: `${((member?.mp || 0) / (member?.maxMp || 1)) * 100}%` 
                  }}
                />
              </div>
              <span className="bar-label">
                MP [{member?.mp || 0}/{member?.maxMp || 0}]
              </span>
            </div>
          </div>
        </div>

        <div className="member-skills">
          <h4>+--[ SKILLS ]--+</h4>
          {member?.skills?.map((skill, index) => (
            <SkillDisplay 
              key={`${label}-skill-${index}`}
              skill={skill}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main component
function TeamMembers({ memberA, memberB }) {
  return (
    <section className="team-section">
      <div className="team-members">
        <MemberCard member={memberA} label="A" />
        <MemberCard member={memberB} label="B" />
      </div>
    </section>
  );
}

export default TeamMembers; 