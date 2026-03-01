import React, { memo, useMemo, useCallback } from 'react';
import Card from '../Card/Card';
import './Hand.css';

const Hand = memo(function Hand({ cards, selectedCards = [], onCardClick, showCards = true }) {
  // 使用 Set 来优化选中状态的查找
  const selectedIds = useMemo(() => new Set(selectedCards.map(c => c.id)), [selectedCards]);

  const handleCardClick = useCallback((card) => {
    if (onCardClick) onCardClick(card);
  }, [onCardClick]);

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
            selected={selectedIds.has(card.id)}
            onClick={handleCardClick}
            faceDown={!showCards}
          />
        </div>
      ))}
    </div>
  );
});

export default Hand;
