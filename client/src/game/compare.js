import { RANK_VALUES } from './cards.js';
import { PATTERN_TYPES, isBomb } from './patterns.js';

const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getRankOrder(rank) {
  const idx = RANK_ORDER.indexOf(rank);
  return idx === -1 ? -1 : idx;
}

export function comparePatterns(pattern1, pattern2, currentLevel = 2) {
  if (!pattern1 || !pattern2) return null;
  
  const bomb1 = isBomb(pattern1);
  const bomb2 = isBomb(pattern2);
  
  if (bomb1 && !bomb2) return 1;
  if (!bomb1 && bomb2) return -1;
  
  if (bomb1 && bomb2) {
    return compareBombs(pattern1, pattern2, currentLevel);
  }
  
  if (pattern1.type !== pattern2.type) return null;
  
  if (pattern1.type === PATTERN_TYPES.STRAIGHT_PAIRS || 
      pattern1.type === PATTERN_TYPES.PLANE ||
      pattern1.type === PATTERN_TYPES.PLANE_WITH_WINGS) {
    if (pattern1.length !== pattern2.length) return null;
  }
  
  if (pattern1.cards.length !== pattern2.cards.length) return null;
  
  if (pattern1.mainCard && pattern2.mainCard) {
    return compareCards(pattern1.mainCard, pattern2.mainCard, currentLevel);
  }
  
  return compareByRank(pattern1.mainRank, pattern2.mainRank, currentLevel);
}

function compareBombs(pattern1, pattern2, currentLevel = 2) {
  const priority1 = getBombPriority(pattern1.type);
  const priority2 = getBombPriority(pattern2.type);
  
  if (priority1 !== priority2) {
    return priority1 - priority2;
  }
  
  const levelStr = String(currentLevel);
  const r1 = pattern1.mainRank;
  const r2 = pattern2.mainRank;
  
  if (r1 === 'kings' || r2 === 'kings') {
    if (r1 === r2) return 0;
    return r1 === 'kings' ? 1 : -1;
  }
  
  if (r1 === 'bigJoker' || r1 === 'littleJoker' || r2 === 'bigJoker' || r2 === 'littleJoker') {
    if (r1 === r2) return 0;
    if (r1 === 'bigJoker') return 1;
    if (r2 === 'bigJoker') return -1;
    if (r1 === 'littleJoker') return 1;
    if (r2 === 'littleJoker') return -1;
  }
  
  const isR1Level = r1 === levelStr;
  const isR2Level = r2 === levelStr;
  
  if (isR1Level && isR2Level) return 0;
  if (isR1Level) return 1;
  if (isR2Level) return -1;
  
  return compareByRank(r1, r2, currentLevel);
}

function getBombPriority(type) {
  switch (type) {
    case PATTERN_TYPES.FOUR_KINGS: return 5;
    case PATTERN_TYPES.BOMB_SIX: return 4;
    case PATTERN_TYPES.STRAIGHT_FLUSH: return 3;
    case PATTERN_TYPES.BOMB_FIVE: return 2;
    case PATTERN_TYPES.BOMB_FOUR: return 1;
    default: return 0;
  }
}

function compareByRank(rank1, rank2, currentLevel) {
  if (rank1 === rank2) return 0;
  
  if (rank1 === 'bigJoker') return 1;
  if (rank2 === 'bigJoker') return -1;
  if (rank1 === 'littleJoker') return 1;
  if (rank2 === 'littleJoker') return -1;
  
  const levelStr = String(currentLevel);
  const isRank1Level = rank1 === levelStr;
  const isRank2Level = rank2 === levelStr;
  
  if (isRank1Level && !isRank2Level) return 1;
  if (isRank2Level && !isRank1Level) return -1;
  
  const order1 = getRankOrder(rank1);
  const order2 = getRankOrder(rank2);
  
  if (order1 > order2) return 1;
  if (order1 < order2) return -1;
  return 0;
}

export function compareCards(card1, card2, currentLevel) {
  const levelStr = String(currentLevel);
  
  if (card1.isJoker && card2.isJoker) {
    if (card1.jokerType === 'big' && card2.jokerType !== 'big') return 1;
    if (card2.jokerType === 'big' && card1.jokerType !== 'big') return -1;
    return 0;
  }
  if (card1.isJoker) return 1;
  if (card2.isJoker) return -1;
  
  const isCard1Level = card1.rank === levelStr;
  const isCard2Level = card2.rank === levelStr;
  
  if (isCard1Level && isCard2Level) return 0;
  if (isCard1Level) return 1;
  if (isCard2Level) return -1;
  
  const order1 = getRankOrder(card1.rank);
  const order2 = getRankOrder(card2.rank);
  
  if (order1 > order2) return 1;
  if (order1 < order2) return -1;
  return 0;
}

export function canBeat(existingPattern, newPattern, currentLevel = 2) {
  if (!existingPattern) return true;
  if (!newPattern) return false;
  
  const result = comparePatterns(existingPattern, newPattern, currentLevel);
  return result !== null && result < 0;
}

export function getWinningPattern(patterns, currentLevel = 2) {
  if (!patterns || patterns.length === 0) return null;
  
  let winner = patterns[0];
  for (let i = 1; i < patterns.length; i++) {
    const result = comparePatterns(winner, patterns[i], currentLevel);
    if (result !== null && result < 0) {
      winner = patterns[i];
    }
  }
  return winner;
}
