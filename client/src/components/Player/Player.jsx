import React, { memo, useMemo } from 'react';
import Hand from '../Hand/Hand';
import './Player.css';

const Player = memo(function Player({
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

  const playerLabel = useMemo(() => {
    const team = player.id % 2 === 0 ? 'A队' : 'B队';
    return `${player.name} (${team})`;
  }, [player.id, player.name]);

  // 预计算卡牌堆叠元素
  const cardStackElements = useMemo(() => {
    const stackCount = Math.min(cardCount, 8);
    return Array.from({ length: stackCount }).map((_, i) => (
      <div
        key={i}
        className="card-stack-item"
        style={{ top: `${i * 3}px`, left: `${i * 1}px` }}
      />
    ));
  }, [cardCount]);

  return (
    <div className={`player ${positionClass} ${isCurrentPlayer ? 'player-active' : ''}`}>
      <div className="player-info">
        <span className="player-name">{playerLabel}</span>
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
            {cardStackElements}
          </div>
          <span className="card-count-badge">{cardCount}</span>
        </div>
      )}
    </div>
  );
});

export default Player;
