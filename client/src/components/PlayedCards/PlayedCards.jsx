import React from 'react';
import Card from '../Card/Card';
import './PlayedCards.css';

export default function PlayedCards({ cards, playerName }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="played-cards">
      {playerName && <div className="played-by">{playerName}</div>}
      <div className="played-cards-list">
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className="played-card"
            style={{ marginLeft: index > 0 ? '-25px' : '0' }}
          >
            <Card card={card} small />
          </div>
        ))}
      </div>
    </div>
  );
}
