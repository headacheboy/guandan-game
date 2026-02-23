import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../../game/cards.js';
import './Card.css';

export default function Card({ card, selected, onClick, faceDown, small }) {
  if (faceDown) {
    return (
      <div className={`card card-back ${small ? 'card-small' : ''}`}>
        <div className="card-back-pattern" />
      </div>
    );
  }

  const isRed = card.isJoker ? card.jokerType === 'big' : SUIT_COLORS[card.suit] === 'red';
  const suitSymbol = card.isJoker ? (card.jokerType === 'big' ? '大王' : '小王') : SUIT_SYMBOLS[card.suit];
  const displayRank = card.isJoker ? '' : card.rank;

  return (
    <div 
      className={`card ${selected ? 'card-selected' : ''} ${isRed ? 'card-red' : 'card-black'} ${small ? 'card-small' : ''}`}
      onClick={onClick}
    >
      <div className="card-corner card-corner-top">
        <span className="card-rank">{displayRank}</span>
        <span className="card-suit">{card.isJoker ? '' : suitSymbol}</span>
      </div>
      <div className="card-center">
        {card.isJoker ? (
          <span className="card-joker">{card.jokerType === 'big' ? '大' : '小'}</span>
        ) : (
          <span className="card-suit-large">{suitSymbol}</span>
        )}
      </div>
      <div className="card-corner card-corner-bottom">
        <span className="card-rank">{displayRank}</span>
        <span className="card-suit">{card.isJoker ? '' : suitSymbol}</span>
      </div>
    </div>
  );
}
