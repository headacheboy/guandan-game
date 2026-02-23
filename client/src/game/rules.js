import { identifyPattern, isBomb, PATTERN_TYPES } from './patterns.js';
import { canBeat } from './compare.js';
import { isTrumpCard, groupCardsByRank } from './cards.js';

export function isValidPlay(cards, lastPlay, currentLevel = 2, trumpSuit = null) {
  if (!cards || cards.length === 0) return { valid: false, reason: '请选择要出的牌' };
  
  const pattern = identifyPattern(cards);
  if (!pattern) return { valid: false, reason: '无效的牌型' };
  
  if (!lastPlay || lastPlay.length === 0) {
    return { valid: true, pattern };
  }
  
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return { valid: false, reason: '上家出牌无效' };
  
  if (isBomb(pattern)) {
    if (isBomb(lastPattern)) {
      if (canBeat(lastPattern, pattern, currentLevel)) {
        return { valid: true, pattern };
      }
      return { valid: false, reason: '炸弹不够大' };
    }
    return { valid: true, pattern };
  }
  
  if (pattern.type !== lastPattern.type) {
    return { valid: false, reason: '牌型不匹配' };
  }
  
  if (pattern.type === PATTERN_TYPES.STRAIGHT ||
      pattern.type === PATTERN_TYPES.STRAIGHT_PAIRS ||
      pattern.type === PATTERN_TYPES.PLANE ||
      pattern.type === PATTERN_TYPES.PLANE_WITH_WINGS) {
    if (pattern.length && lastPattern.length && pattern.length !== lastPattern.length) {
      return { valid: false, reason: '连续张数不匹配' };
    }
  }
  
  if (pattern.cards.length !== lastPattern.cards.length) {
    return { valid: false, reason: '牌数不匹配' };
  }
  
  if (!canBeat(lastPattern, pattern, currentLevel)) {
    return { valid: false, reason: '牌不够大' };
  }
  
  return { valid: true, pattern };
}

export function getMustPlayCards(hand, lastPlay, currentLevel = 2) {
  if (!lastPlay || lastPlay.length === 0) return [];
  
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return [];
  
  const groups = groupCardsByRank(hand);
  
  if (lastPattern.type === PATTERN_TYPES.SINGLE) {
    return hand.filter(c => {
      const result = isValidPlay([c], lastPlay, currentLevel);
      return result.valid;
    });
  }
  
  if (lastPattern.type === PATTERN_TYPES.PAIR) {
    const pairs = Object.values(groups).filter(g => g.length >= 2);
    return pairs.flat();
  }
  
  return hand;
}

export function canPass(hand, lastPlay, currentLevel = 2) {
  if (!lastPlay || lastPlay.length === 0) return false;
  
  return true;
}

export function calculateLevelUp(finishOrder, teamA, teamB) {
  const teamAPlayers = [0, 2];
  const teamBPlayers = [1, 3];
  
  const teamAPositions = finishOrder.map((playerIdx, pos) => ({ playerIdx, pos }));
  const teamAFinishes = teamAPositions.filter(p => teamAPlayers.includes(p.playerIdx));
  const teamBFinishes = teamAPositions.filter(p => teamBPlayers.includes(p.playerIdx));
  
  if (teamAFinishes.length === 2 && teamAFinishes[0].pos === 0) {
    const secondPos = teamAFinishes[1].pos;
    if (secondPos === 1) return { winner: 'A', levels: 3 };
    if (secondPos === 2) return { winner: 'A', levels: 2 };
    if (secondPos === 3) return { winner: 'A', levels: 1 };
  }
  
  if (teamBFinishes.length === 2 && teamBFinishes[0].pos === 0) {
    const secondPos = teamBFinishes[1].pos;
    if (secondPos === 1) return { winner: 'B', levels: 3 };
    if (secondPos === 2) return { winner: 'B', levels: 2 };
    if (secondPos === 3) return { winner: 'B', levels: 1 };
  }
  
  const teamABestPos = Math.min(...teamAFinishes.map(p => p.pos));
  const teamBBestPos = Math.min(...teamBFinishes.map(p => p.pos));
  
  if (teamABestPos < teamBBestPos) {
    return { winner: 'A', levels: 1 };
  } else {
    return { winner: 'B', levels: 1 };
  }
}

export function isGameOver(levels, maxLevel = 13) {
  return levels.A >= maxLevel || levels.B >= maxLevel;
}

export function getWinner(levels, maxLevel = 13) {
  if (levels.A >= maxLevel) return 'A';
  if (levels.B >= maxLevel) return 'B';
  return null;
}
