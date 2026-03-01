import { groupCardsByRank, groupCardsBySuit, sortCards, RANK_VALUES } from './cards.js';

export const PATTERN_TYPES = {
  SINGLE: 'single',
  PAIR: 'pair',
  TRIPLE: 'triple',
  TRIPLE_WITH_ONE: 'tripleWithOne',
  TRIPLE_WITH_PAIR: 'tripleWithPair',
  STRAIGHT: 'straight',
  STRAIGHT_PAIRS: 'straightPairs',
  PLANE: 'plane',
  PLANE_WITH_WINGS: 'planeWithWings',
  BOMB_FOUR: 'bombFour',
  BOMB_FIVE: 'bombFive',
  STRAIGHT_FLUSH: 'straightFlush',
  BOMB_SIX: 'bombSix',
  FOUR_KINGS: 'fourKings'
};

export const PATTERN_PRIORITY = {
  [PATTERN_TYPES.SINGLE]: 1,
  [PATTERN_TYPES.PAIR]: 2,
  [PATTERN_TYPES.TRIPLE]: 3,
  [PATTERN_TYPES.TRIPLE_WITH_ONE]: 4,
  [PATTERN_TYPES.TRIPLE_WITH_PAIR]: 5,
  [PATTERN_TYPES.STRAIGHT]: 6,
  [PATTERN_TYPES.STRAIGHT_PAIRS]: 7,
  [PATTERN_TYPES.PLANE]: 8,
  [PATTERN_TYPES.PLANE_WITH_WINGS]: 9,
  [PATTERN_TYPES.BOMB_FOUR]: 10,
  [PATTERN_TYPES.BOMB_FIVE]: 11,
  [PATTERN_TYPES.STRAIGHT_FLUSH]: 12,
  [PATTERN_TYPES.BOMB_SIX]: 13,
  [PATTERN_TYPES.FOUR_KINGS]: 14
};

export const PATTERN_NAMES = {
  [PATTERN_TYPES.SINGLE]: '单牌',
  [PATTERN_TYPES.PAIR]: '对子',
  [PATTERN_TYPES.TRIPLE]: '三张',
  [PATTERN_TYPES.TRIPLE_WITH_ONE]: '三带一',
  [PATTERN_TYPES.TRIPLE_WITH_PAIR]: '三带二',
  [PATTERN_TYPES.STRAIGHT]: '顺子',
  [PATTERN_TYPES.STRAIGHT_PAIRS]: '连对',
  [PATTERN_TYPES.PLANE]: '飞机',
  [PATTERN_TYPES.PLANE_WITH_WINGS]: '飞机带翅膀',
  [PATTERN_TYPES.BOMB_FOUR]: '炸弹',
  [PATTERN_TYPES.BOMB_FIVE]: '五张炸弹',
  [PATTERN_TYPES.STRAIGHT_FLUSH]: '同花顺',
  [PATTERN_TYPES.BOMB_SIX]: '六张炸弹',
  [PATTERN_TYPES.FOUR_KINGS]: '四大天王'
};

function isValidStraightRank(rank) {
  return rank !== '2' && rank !== 'littleJoker' && rank !== 'bigJoker';
}

function getConsecutiveRanks(startRank, length) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const startIndex = validRanks.indexOf(startRank);
  if (startIndex === -1) return null;
  if (startIndex + length > validRanks.length) return null;
  
  return validRanks.slice(startIndex, startIndex + length);
}

export function identifyPattern(cards) {
  if (!cards || cards.length === 0) return null;
  
  const sorted = sortCards(cards);
  const n = sorted.length;
  const groups = groupCardsByRank(sorted);
  const groupCounts = Object.entries(groups).map(([rank, cards]) => ({ rank, count: cards.length }));
  
  if (n === 1) {
    return { type: PATTERN_TYPES.SINGLE, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
  }
  
  if (n === 2) {
    if (sorted[0].rank === sorted[1].rank) {
      return { type: PATTERN_TYPES.PAIR, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
    }
    return null;
  }
  
  if (n === 3) {
    if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) {
      return { type: PATTERN_TYPES.TRIPLE, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
    }
    return null;
  }
  
  if (n === 4) {
    // Check four kings first (highest priority for 4 cards)
    const jokers = sorted.filter(c => c.isJoker);
    if (jokers.length === 4) {
      return { type: PATTERN_TYPES.FOUR_KINGS, mainRank: 'kings', cards: sorted };
    }

    if (sorted[0].rank === sorted[1].rank &&
        sorted[1].rank === sorted[2].rank &&
        sorted[2].rank === sorted[3].rank) {
      return { type: PATTERN_TYPES.BOMB_FOUR, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
    }

    const triple = groupCounts.find(g => g.count === 3);
    if (triple) {
      const tripleCard = sorted.find(c => c.rank === triple.rank);
      return { type: PATTERN_TYPES.TRIPLE_WITH_ONE, mainRank: triple.rank, mainCard: tripleCard, cards: sorted };
    }

    return checkStraight(sorted);
  }
  
  if (n === 5) {
    if (sorted.every(c => c.rank === sorted[0].rank)) {
      return { type: PATTERN_TYPES.BOMB_FIVE, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
    }

    const triple = groupCounts.find(g => g.count === 3);
    if (triple) {
      const pair = groupCounts.find(g => g.count === 2);
      if (pair) {
        const tripleCard = sorted.find(c => c.rank === triple.rank);
        return { type: PATTERN_TYPES.TRIPLE_WITH_PAIR, mainRank: triple.rank, mainCard: tripleCard, cards: sorted };
      }
    }

    // Check straight flush before regular straight
    const flushResult = checkStraightFlush(sorted);
    if (flushResult) return flushResult;

    const straightResult = checkStraight(sorted);
    if (straightResult) return straightResult;

    return null;
  }
  
  if (n === 6) {
    if (sorted.every(c => c.rank === sorted[0].rank)) {
      return { type: PATTERN_TYPES.BOMB_SIX, mainRank: sorted[0].rank, mainCard: sorted[0], cards: sorted };
    }

    const planeResult = checkPlane(sorted, groups, groupCounts);
    if (planeResult) return planeResult;

    const straightPairsResult = checkStraightPairs(sorted, groups, groupCounts);
    if (straightPairsResult) return straightPairsResult;

    // Check straight flush before regular straight
    const flushResult = checkStraightFlush(sorted);
    if (flushResult) return flushResult;

    const straightResult = checkStraight(sorted);
    if (straightResult) return straightResult;

    return null;
  }

  if (n >= 5 && n <= 10) {
    // Check straight flush before regular straight
    const flushResult = checkStraightFlush(sorted);
    if (flushResult) return flushResult;

    const straightResult = checkStraight(sorted);
    if (straightResult) return straightResult;
  }
  
  if (n >= 6) {
    const straightPairsResult = checkStraightPairs(sorted, groups, groupCounts);
    if (straightPairsResult) return straightPairsResult;

    const planeResult = checkPlane(sorted, groups, groupCounts);
    if (planeResult) return planeResult;

    const planeWithWings = checkPlaneWithWings(sorted, groups, groupCounts);
    if (planeWithWings) return planeWithWings;
  }

  return null;
}

function checkStraight(cards) {
  const n = cards.length;
  if (n < 5) return null;
  
  const ranks = cards.map(c => c.rank);
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  if (ranks.some(r => !validRanks.includes(r))) return null;
  
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length !== n) return null;
  
  uniqueRanks.sort((a, b) => validRanks.indexOf(a) - validRanks.indexOf(b));
  
  const startIdx = validRanks.indexOf(uniqueRanks[0]);
  const endIdx = validRanks.indexOf(uniqueRanks[uniqueRanks.length - 1]);
  
  if (endIdx - startIdx + 1 !== n) return null;
  
  for (let i = startIdx; i <= endIdx; i++) {
    if (!uniqueRanks.includes(validRanks[i])) return null;
  }
  
  const mainCard = cards.find(c => c.rank === uniqueRanks[uniqueRanks.length - 1]);
  return { type: PATTERN_TYPES.STRAIGHT, mainRank: uniqueRanks[uniqueRanks.length - 1], mainCard, cards };
}

function checkStraightFlush(cards) {
  const straight = checkStraight(cards);
  if (!straight) return null;
  
  const suits = cards.map(c => c.suit);
  if (suits.some(s => s !== suits[0])) return null;
  
  return { 
    type: PATTERN_TYPES.STRAIGHT_FLUSH, 
    mainRank: straight.mainRank, 
    mainCard: straight.mainCard,
    suit: cards[0].suit,
    cards 
  };
}

function checkStraightPairs(cards, groups, groupCounts) {
  const n = cards.length;
  if (n < 6 || n % 2 !== 0) return null;
  
  const pairCount = n / 2;
  const pairs = groupCounts.filter(g => g.count >= 2);
  
  if (pairs.length < pairCount) return null;
  
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const pairRanks = pairs
    .filter(p => validRanks.includes(p.rank))
    .map(p => p.rank)
    .sort((a, b) => validRanks.indexOf(a) - validRanks.indexOf(b));
  
  for (let i = 0; i <= pairRanks.length - pairCount; i++) {
    const subset = pairRanks.slice(i, i + pairCount);
    let isConsecutive = true;
    
    for (let j = 0; j < subset.length - 1; j++) {
      if (validRanks.indexOf(subset[j + 1]) - validRanks.indexOf(subset[j]) !== 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive) {
      const mainCard = cards.find(c => c.rank === subset[subset.length - 1]);
      return { 
        type: PATTERN_TYPES.STRAIGHT_PAIRS, 
        mainRank: subset[subset.length - 1],
        mainCard,
        length: pairCount,
        cards 
      };
    }
  }
  
  return null;
}

function checkPlane(cards, groups, groupCounts) {
  const n = cards.length;
  if (n < 6 || n % 3 !== 0) return null;
  
  const tripleCount = n / 3;
  const triples = groupCounts.filter(g => g.count >= 3);
  
  if (triples.length < tripleCount) return null;
  
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const tripleRanks = triples
    .filter(t => validRanks.includes(t.rank))
    .map(t => t.rank)
    .sort((a, b) => validRanks.indexOf(a) - validRanks.indexOf(b));
  
  for (let i = 0; i <= tripleRanks.length - tripleCount; i++) {
    const subset = tripleRanks.slice(i, i + tripleCount);
    let isConsecutive = true;
    
    for (let j = 0; j < subset.length - 1; j++) {
      if (validRanks.indexOf(subset[j + 1]) - validRanks.indexOf(subset[j]) !== 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive) {
      const mainCard = cards.find(c => c.rank === subset[subset.length - 1]);
      return { 
        type: PATTERN_TYPES.PLANE, 
        mainRank: subset[subset.length - 1],
        mainCard,
        length: tripleCount,
        cards 
      };
    }
  }
  
  return null;
}

function checkPlaneWithWings(cards, groups, groupCounts) {
  const triples = groupCounts.filter(g => g.count >= 3);

  if (triples.length < 2) return null;

  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const tripleRanks = triples
    .filter(t => validRanks.includes(t.rank))
    .map(t => t.rank)
    .sort((a, b) => validRanks.indexOf(a) - validRanks.indexOf(b));

  for (let len = 2; len <= tripleRanks.length; len++) {
    for (let i = 0; i <= tripleRanks.length - len; i++) {
      const subset = tripleRanks.slice(i, i + len);
      let isConsecutive = true;

      for (let j = 0; j < subset.length - 1; j++) {
        if (validRanks.indexOf(subset[j + 1]) - validRanks.indexOf(subset[j]) !== 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        // Support both: wings as singles (len * 4) and wings as pairs (len * 5)
        const expectedWithSingles = len * 4;
        const expectedWithPairs = len * 5;
        if (cards.length === expectedWithSingles || cards.length === expectedWithPairs) {
          const mainCard = cards.find(c => c.rank === subset[subset.length - 1]);
          return {
            type: PATTERN_TYPES.PLANE_WITH_WINGS,
            mainRank: subset[subset.length - 1],
            mainCard,
            length: len,
            cards
          };
        }
      }
    }
  }

  return null;
}

export function isBomb(pattern) {
  if (!pattern) return false;
  return [
    PATTERN_TYPES.BOMB_FOUR,
    PATTERN_TYPES.BOMB_FIVE,
    PATTERN_TYPES.STRAIGHT_FLUSH,
    PATTERN_TYPES.BOMB_SIX,
    PATTERN_TYPES.FOUR_KINGS
  ].includes(pattern.type);
}
