export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};
export const SUIT_COLORS = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
};

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  'littleJoker': 15, 'bigJoker': 16
};

export const RANK_DISPLAY = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  'littleJoker': '小王', 'bigJoker': '大王'
};

export function createDeck() {
  const deck = [];
  let id = 0;
  
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `card-${id++}`,
          suit,
          rank,
          value: RANK_VALUES[rank],
          display: `${SUIT_SYMBOLS[suit]}${rank}`,
          isJoker: false
        });
      }
    }
    deck.push({
      id: `card-${id++}`,
      suit: 'joker',
      rank: 'littleJoker',
      value: RANK_VALUES.littleJoker,
      display: '小王',
      isJoker: true,
      jokerType: 'little'
    });
    deck.push({
      id: `card-${id++}`,
      suit: 'joker',
      rank: 'bigJoker',
      value: RANK_VALUES.bigJoker,
      display: '大王',
      isJoker: true,
      jokerType: 'big'
    });
  }
  
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck, playerCount = 4) {
  const hands = Array.from({ length: playerCount }, () => []);
  const cardsPerPlayer = Math.floor(deck.length / playerCount);
  
  for (let i = 0; i < deck.length; i++) {
    hands[i % playerCount].push(deck[i]);
  }
  
  return hands.map(hand => sortCards(hand));
}

export function sortCards(cards) {
  return [...cards].sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    const suitOrder = { spades: 0, hearts: 1, clubs: 2, diamonds: 3, joker: 4 };
    return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
  });
}

export function getCardValue(card, currentLevel, trumpSuit) {
  if (card.isJoker) {
    return card.value;
  }
  
  if (card.rank === String(currentLevel)) {
    if (card.suit === 'hearts') {
      return 14.5;
    }
    return 14.2;
  }
  
  return card.value;
}

export function isTrumpCard(card, currentLevel, trumpSuit) {
  if (card.isJoker) return true;
  if (card.rank === String(currentLevel)) return true;
  return false;
}

export function groupCardsByRank(cards) {
  const groups = {};
  for (const card of cards) {
    if (!groups[card.rank]) {
      groups[card.rank] = [];
    }
    groups[card.rank].push(card);
  }
  return groups;
}

export function groupCardsBySuit(cards) {
  const groups = {};
  for (const card of cards) {
    if (!groups[card.suit]) {
      groups[card.suit] = [];
    }
    groups[card.suit].push(card);
  }
  return groups;
}

export function removeCards(hand, cardsToRemove) {
  const removeIds = new Set(cardsToRemove.map(c => c.id));
  return hand.filter(card => !removeIds.has(card.id));
}
