import React from 'react';
import Card from '../Card/Card';
import './Hand.css';

export default function Hand({ cards, selectedCards = [], onCardClick, showCards = true }) {
  const isSelected = (card) => selectedCards.some(c => c.id === card.id);
  
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={card.id} 
          className="hand-card"
          style={{ marginLeft: index > 0 ? '-30px' : '0' }}
        >
          <Card 
            card={card} 
            selected={isSelected(card)}
            onClick={() => onCardClick && onCardClick(card)}
            faceDown={!showCards}
          />
        </div>
      ))}
    </div>
  );
}
