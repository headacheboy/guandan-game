import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../../game/cards.js';
import { PATTERN_NAMES } from '../../game/patterns.js';
import './AIHint.css';

export default function AIHint({ hint, onApply, onClose }) {
  if (!hint) return null;

  const renderCard = (card, index) => {
    const isRed = card.isJoker 
      ? card.jokerType === 'big' 
      : SUIT_COLORS[card.suit] === 'red';
    const display = card.isJoker 
      ? (card.jokerType === 'big' ? '大王' : '小王')
      : `${SUIT_SYMBOLS[card.suit]}${card.rank}`;
    
    return (
      <span key={index} className={`hint-card ${isRed ? 'card-red' : 'card-black'}`}>
        {display}
      </span>
    );
  };

  const hasSuggestion = hint.cards && hint.cards.length > 0;

  return (
    <div className="hint-overlay" onClick={onClose}>
      <div className="hint-modal" onClick={e => e.stopPropagation()}>
        <div className="hint-header">
          <h3>AI 出牌建议</h3>
          <button className="hint-close" onClick={onClose}>×</button>
        </div>
        
        <div className="hint-body">
          <div className="hint-reason">{hint.reason}</div>
          
          {hasSuggestion && (
            <div className="hint-suggestion">
              <div className="hint-label">
                建议出牌
                {hint.pattern && <span className="hint-pattern">({PATTERN_NAMES[hint.pattern.type]})</span>}
              </div>
              <div className="hint-cards">
                {hint.cards.map(renderCard)}
              </div>
              <button className="btn btn-apply" onClick={() => onApply(hint.cards)}>
                采用建议
              </button>
            </div>
          )}
          
          {hint.alternatives && hint.alternatives.length > 0 && (
            <div className="hint-alternatives">
              <div className="hint-label">其他选择</div>
              <div className="hint-alt-list">
                {hint.alternatives.map((alt, idx) => (
                  <div key={idx} className="hint-alt-item" onClick={() => onApply(alt.cards)}>
                    <span className="hint-alt-label">{alt.label}</span>
                    <span className="hint-alt-cards">
                      {alt.cards.slice(0, 4).map(c => c.rank).join(',')}
                      {alt.cards.length > 4 && '...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
