import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../../game/cards.js';
import { PATTERN_NAMES } from '../../game/patterns.js';
import './History.css';

export default function History({ playHistory, players, onClose }) {
  const getPosition = (playerIndex) => {
    const positions = ['下家', '右家', '上家', '左家'];
    return positions[playerIndex];
  };

  const getTeam = (playerIndex) => {
    return playerIndex % 2 === 0 ? 'A队' : 'B队';
  };

  const renderCard = (card, index) => {
    const isRed = card.isJoker ? card.jokerType === 'big' : SUIT_COLORS[card.suit] === 'red';
    const display = card.isJoker 
      ? (card.jokerType === 'big' ? '大王' : '小王')
      : `${SUIT_SYMBOLS[card.suit]}${card.rank}`;
    
    return (
      <span key={index} className={`history-card ${isRed ? 'card-red' : 'card-black'}`}>
        {display}
      </span>
    );
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-modal" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h3>出牌历史记录</h3>
          <button className="history-close" onClick={onClose}>×</button>
        </div>
        <div className="history-content">
          {playHistory.length === 0 ? (
            <div className="history-empty">暂无出牌记录</div>
          ) : (
            <div className="history-list">
              {playHistory.map((entry, index) => (
                <div key={index} className={`history-entry history-entry-${entry.playerIndex}`}>
                  <div className="history-entry-header">
                    <span className="history-player">
                      {entry.playerName}
                      <span className="history-team">({getTeam(entry.playerIndex)})</span>
                    </span>
                    <span className="history-index">#{index + 1}</span>
                  </div>
                  <div className="history-entry-body">
                    {entry.type === 'pass' ? (
                      <span className="history-pass">不出</span>
                    ) : (
                      <>
                        <div className="history-cards">
                          {entry.cards.map(renderCard)}
                        </div>
                        <div className="history-pattern">
                          {PATTERN_NAMES[entry.pattern.type]}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
