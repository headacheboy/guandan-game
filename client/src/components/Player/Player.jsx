import React from 'react';
import Hand from '../Hand/Hand';
import './Player.css';

export default function Player({ 
  player, 
  position, 
  isCurrentPlayer, 
  showCards,
  lastPlay,
  selectedCards,
  onCardClick 
}) {
  const positionClass = `player-${position}`;
  const cardCount = player.hand.length;
  
  const getPlayerLabel = () => {
    const team = player.id % 2 === 0 ? 'A队' : 'B队';
    return `${player.name} (${team})`;
  };

  return (
    <div className={`player ${positionClass} ${isCurrentPlayer ? 'player-active' : ''}`}>
      <div className="player-info">
        <span className="player-name">{getPlayerLabel()}</span>
        <span className="player-level">级别: {player.level}</span>
        <span className="player-cards">剩余: {cardCount}张</span>
        {player.finished && <span className="player-finished">已完成</span>}
        {isCurrentPlayer && !player.finished && <span className="player-turn">出牌中</span>}
      </div>
      
      {lastPlay && lastPlay.length > 0 && (
        <div className="player-last-play">
          <Hand cards={lastPlay} showCards={true} />
        </div>
      )}
      
      {position === 'bottom' && (
        <div className="player-hand">
          <Hand 
            cards={player.hand} 
            selectedCards={selectedCards}
            onCardClick={onCardClick}
            showCards={showCards}
          />
        </div>
      )}
      
      {position !== 'bottom' && (
        <div className="player-hand-opponent">
          <div className="card-stack">
            {Array.from({ length: Math.min(cardCount, 8) }).map((_, i) => (
              <div 
                key={i} 
                className="card-stack-item"
                style={{ top: `${i * 3}px`, left: `${i * 1}px` }}
              />
            ))}
          </div>
          <span className="card-count-badge">{cardCount}</span>
        </div>
      )}
    </div>
  );
}
