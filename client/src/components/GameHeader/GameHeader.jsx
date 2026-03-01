import React, { memo } from 'react';
import './GameHeader.module.css';

const GameHeader = memo(function GameHeader({
  teamLevels,
  currentLevel,
  roundNumber,
  onShowLeaderboard,
  onShowHistory
}) {
  return (
    <div className="game-header">
      <div className="team-score team-a">
        <span className="team-label">玩家队</span>
        <span className="team-level">{teamLevels.A}</span>
        <span className="level-suffix">级</span>
      </div>

      <div className="game-info">
        <div className="current-level">
          <span className="info-label">当前级别</span>
          <span className="info-value level-badge">{currentLevel}</span>
        </div>
        <div className="round-number">
          <span className="info-label">第</span>
          <span className="info-value">{roundNumber}</span>
          <span className="info-label">局</span>
        </div>
      </div>

      <div className="team-score team-b">
        <span className="team-label">AI队</span>
        <span className="team-level">{teamLevels.B}</span>
        <span className="level-suffix">级</span>
      </div>

      <div className="header-actions">
        {onShowLeaderboard && (
          <button className="action-btn" onClick={onShowLeaderboard} title="排行榜">
            🏆
          </button>
        )}
        {onShowHistory && (
          <button className="action-btn" onClick={onShowHistory} title="历史记录">
            📋
          </button>
        )}
      </div>
    </div>
  );
});

export default GameHeader;
