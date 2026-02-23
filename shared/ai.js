import { identifyPattern, PATTERN_TYPES, isBomb } from './patterns.js';
import { isValidPlay, canPass } from './rules.js';
import { groupCardsByRank, sortCards, RANK_ORDER } from './cards.js';
import { comparePatterns } from './compare.js';

export function getAIPlay(hand, gameState, playerIndex) {
  const { lastPlay, lastPlayer, currentLevel } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  const isTeammateLeading = lastPlayer === teammateIndex;
  
  if (!lastPlay || lastPlay.length === 0) {
    return findBestLead(hand, currentLevel);
  }
  
  if (isTeammateLeading && shouldSupportTeammate(hand, gameState, playerIndex)) {
    return null;
  }
  
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return null;
  
  const validPlays = findAllValidPlays(hand, lastPlay, currentLevel);
  
  if (validPlays.length === 0) return null;
  
  const sortedPlays = validPlays.sort((a, b) => {
    const patternA = identifyPattern(a);
    const patternB = identifyPattern(b);
    
    const bombA = isBomb(patternA);
    const bombB = isBomb(patternB);
    
    if (!bombA && bombB) return -1;
    if (bombA && !bombB) return 1;
    
    return getPlayValue(a) - getPlayValue(b);
  });
  
  if (isTeammateLeading) {
    const smallPlays = sortedPlays.filter(play => {
      const pattern = identifyPattern(play);
      return !isBomb(pattern) && getPlayValue(play) < 50;
    });
    if (smallPlays.length > 0) {
      return smallPlays[0];
    }
    return null;
  }
  
  const nonBombPlays = sortedPlays.filter(play => {
    const pattern = identifyPattern(play);
    return !isBomb(pattern);
  });
  
  if (nonBombPlays.length > 0) {
    return nonBombPlays[0];
  }
  
  const handCount = hand.length;
  if (handCount <= 6) {
    return sortedPlays[0];
  }
  
  return null;
}

function shouldSupportTeammate(hand, gameState, playerIndex) {
  const { finishOrder, players } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  
  if (finishOrder.includes(teammateIndex)) return true;
  
  const myHandCount = hand.length;
  const teammateHandCount = players[teammateIndex].hand.length;
  
  if (teammateHandCount <= 5) return true;
  
  return false;
}

function findBestLead(hand, currentLevel) {
  const groups = groupCardsByRank(hand);
  
  const singles = Object.entries(groups)
    .filter(([_, cards]) => cards.length === 1)
    .sort((a, b) => getCardValueForAI(a[1][0], currentLevel) - getCardValueForAI(b[1][0], currentLevel));
  
  if (singles.length > 0) {
    return [singles[0][1][0]];
  }
  
  const pairs = Object.entries(groups)
    .filter(([_, cards]) => cards.length === 2)
    .sort((a, b) => getCardValueForAI(a[1][0], currentLevel) - getCardValueForAI(b[1][0], currentLevel));
  
  if (pairs.length > 0) {
    return pairs[0][1];
  }
  
  const triples = Object.entries(groups)
    .filter(([_, cards]) => cards.length >= 3);
  
  if (triples.length > 0) {
    const triple = triples.sort((a, b) => 
      getCardValueForAI(a[1][0], currentLevel) - getCardValueForAI(b[1][0], currentLevel)
    )[0];
    return triple[1].slice(0, 3);
  }
  
  return [sortCards(hand)[0]];
}

function findAllValidPlays(hand, lastPlay, currentLevel) {
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return [];
  
  const validPlays = [];
  
  if (lastPattern.type === PATTERN_TYPES.SINGLE) {
    for (const card of hand) {
      const result = isValidPlay([card], lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push([card]);
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.PAIR) {
    const groups = groupCardsByRank(hand);
    for (const cards of Object.values(groups)) {
      if (cards.length >= 2) {
        const pair = cards.slice(0, 2);
        const result = isValidPlay(pair, lastPlay, currentLevel);
        if (result.valid) {
          validPlays.push(pair);
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.TRIPLE) {
    const groups = groupCardsByRank(hand);
    for (const cards of Object.values(groups)) {
      if (cards.length >= 3) {
        const triple = cards.slice(0, 3);
        const result = isValidPlay(triple, lastPlay, currentLevel);
        if (result.valid) {
          validPlays.push(triple);
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.TRIPLE_WITH_ONE) {
    const groups = groupCardsByRank(hand);
    const triples = Object.entries(groups).filter(([_, cards]) => cards.length >= 3);
    
    for (const [rank, tripleCards] of triples) {
      const single = hand.find(c => c.rank !== rank);
      if (single) {
        const play = [...tripleCards.slice(0, 3), single];
        const result = isValidPlay(play, lastPlay, currentLevel);
        if (result.valid) {
          validPlays.push(play);
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.STRAIGHT) {
    const straightLength = lastPattern.cards.length;
    const straights = findStraights(hand, straightLength);
    
    for (const straight of straights) {
      const result = isValidPlay(straight, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push(straight);
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.STRAIGHT_PAIRS) {
    const pairCount = lastPattern.length;
    const straightPairs = findStraightPairs(hand, pairCount);
    
    for (const sp of straightPairs) {
      const result = isValidPlay(sp, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push(sp);
      }
    }
  }
  
  const bombs = findBombs(hand);
  for (const bomb of bombs) {
    const result = isValidPlay(bomb, lastPlay, currentLevel);
    if (result.valid) {
      validPlays.push(bomb);
    }
  }
  
  return validPlays;
}

function findStraights(hand, length) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const groups = groupCardsByRank(hand);
  const straights = [];
  
  for (let i = 0; i <= validRanks.length - length; i++) {
    const straightRanks = validRanks.slice(i, i + length);
    const straight = [];
    
    for (const rank of straightRanks) {
      if (groups[rank] && groups[rank].length > 0) {
        straight.push(groups[rank][0]);
      } else {
        break;
      }
    }
    
    if (straight.length === length) {
      straights.push(straight);
    }
  }
  
  return straights;
}

function findStraightPairs(hand, pairCount) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const groups = groupCardsByRank(hand);
  const straightPairs = [];
  
  for (let i = 0; i <= validRanks.length - pairCount; i++) {
    const straightRanks = validRanks.slice(i, i + pairCount);
    const pairs = [];
    
    for (const rank of straightRanks) {
      if (groups[rank] && groups[rank].length >= 2) {
        pairs.push(...groups[rank].slice(0, 2));
      } else {
        break;
      }
    }
    
    if (pairs.length === pairCount * 2) {
      straightPairs.push(pairs);
    }
  }
  
  return straightPairs;
}

function findBombs(hand) {
  const groups = groupCardsByRank(hand);
  const bombs = [];
  
  for (const cards of Object.values(groups)) {
    if (cards.length >= 4) {
      bombs.push(cards.slice(0, 4));
      if (cards.length >= 5) {
        bombs.push(cards.slice(0, 5));
      }
      if (cards.length >= 6) {
        bombs.push(cards.slice(0, 6));
      }
    }
  }
  
  const jokers = hand.filter(c => c.isJoker);
  if (jokers.length === 4) {
    bombs.push(jokers);
  }
  
  return bombs;
}

function getPlayValue(cards) {
  if (!cards || cards.length === 0) return 0;
  return cards.reduce((sum, card) => sum + getCardValueForAI(card, 2), 0) / cards.length;
}

function getCardValueForAI(card, currentLevel) {
  if (card.isJoker) {
    return card.jokerType === 'big' ? 100 : 90;
  }
  
  if (card.rank === String(currentLevel)) {
    return 80;
  }
  
  const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const idx = rankOrder.indexOf(card.rank);
  return idx >= 0 ? (idx + 1) * 5 : 0;
}

export function evaluateHand(hand, currentLevel) {
  let score = 0;
  
  const groups = groupCardsByRank(hand);
  
  for (const cards of Object.values(groups)) {
    if (cards.length === 4) score += 50;
    if (cards.length === 5) score += 60;
    if (cards.length === 6) score += 70;
  }
  
  const jokers = hand.filter(c => c.isJoker);
  if (jokers.length === 4) score += 100;
  if (jokers.length === 3) score += 50;
  if (jokers.length === 2) score += 20;
  
  score += getPlayValue(hand);
  
  return score;
}
