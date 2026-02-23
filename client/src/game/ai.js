import { identifyPattern, PATTERN_TYPES, isBomb } from './patterns.js';
import { isValidPlay } from './rules.js';
import { groupCardsByRank, sortCards } from './cards.js';

export function getAIPlay(hand, gameState, playerIndex) {
  const { lastPlay, lastPlayer, currentLevel, players, finishOrder } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  const isTeammateLeading = lastPlayer === teammateIndex;
  
  const handAnalysis = analyzeHand(hand, currentLevel);
  
  if (!lastPlay || lastPlay.length === 0) {
    return findBestLead(hand, currentLevel, handAnalysis, gameState, playerIndex);
  }
  
  if (isTeammateLeading && shouldSupportTeammate(hand, gameState, playerIndex, handAnalysis)) {
    return null;
  }
  
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return null;
  
  const validPlays = findAllValidPlays(hand, lastPlay, currentLevel);
  if (validPlays.length === 0) return null;
  
  const opponentHandCounts = getOpponentHandCounts(players, playerIndex, teammateIndex);
  const isEmergency = isEmergencySituation(opponentHandCounts, hand.length);
  
  return selectBestPlay(validPlays, hand, currentLevel, handAnalysis, {
    isTeammateLeading,
    isEmergency,
    opponentHandCounts,
    lastPattern
  });
}

function analyzeHand(hand, currentLevel) {
  const groups = groupCardsByRank(hand);
  const analysis = {
    singles: [],
    pairs: [],
    triples: [],
    bombs: [],
    straights: [],
    straightPairs: [],
    planes: [],
    jokers: hand.filter(c => c.isJoker),
    totalCards: hand.length,
    levelCards: hand.filter(c => c.rank === String(currentLevel))
  };
  
  for (const [rank, cards] of Object.entries(groups)) {
    if (cards.length === 1) {
      analysis.singles.push({ rank, cards });
    } else if (cards.length === 2) {
      analysis.pairs.push({ rank, cards });
    } else if (cards.length === 3) {
      analysis.triples.push({ rank, cards });
    } else if (cards.length >= 4) {
      analysis.triples.push({ rank, cards: cards.slice(0, 3) });
      analysis.bombs.push({ rank, cards: cards.slice(0, 4), count: cards.length });
    }
  }
  
  analysis.singles.sort((a, b) => getCardValue(a.rank, currentLevel) - getCardValue(b.rank, currentLevel));
  analysis.pairs.sort((a, b) => getCardValue(a.rank, currentLevel) - getCardValue(b.rank, currentLevel));
  analysis.triples.sort((a, b) => getCardValue(a.rank, currentLevel) - getCardValue(b.rank, currentLevel));
  analysis.bombs.sort((a, b) => getCardValue(a.rank, currentLevel) - getCardValue(b.rank, currentLevel));
  
  const straightInfo = findPossibleStraights(groups, currentLevel);
  analysis.straights = straightInfo.straights;
  analysis.straightPairs = straightInfo.straightPairs;
  analysis.planes = findPossiblePlanes(groups, currentLevel);
  
  return analysis;
}

function findPossibleStraights(groups, currentLevel) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const straights = [];
  const straightPairs = [];
  
  for (let len = 5; len <= 12; len++) {
    for (let i = 0; i <= validRanks.length - len; i++) {
      const ranks = validRanks.slice(i, i + len);
      const straight = [];
      const pairs = [];
      let hasAll = true;
      
      for (const rank of ranks) {
        if (groups[rank] && groups[rank].length >= 1) {
          straight.push(groups[rank][0]);
          if (groups[rank].length >= 2) {
            pairs.push(...groups[rank].slice(0, 2));
          } else {
            hasAll = false;
          }
        } else {
          hasAll = false;
          break;
        }
      }
      
      if (straight.length === len) {
        straights.push({ cards: straight, length: len, highRank: ranks[ranks.length - 1] });
      }
      if (hasAll && pairs.length === len * 2) {
        straightPairs.push({ cards: pairs, length: len, highRank: ranks[ranks.length - 1] });
      }
    }
  }
  
  return { straights, straightPairs };
}

function findPossiblePlanes(groups, currentLevel) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const planes = [];
  
  for (let len = 2; len <= 6; len++) {
    for (let i = 0; i <= validRanks.length - len; i++) {
      const ranks = validRanks.slice(i, i + len);
      const planeCards = [];
      
      for (const rank of ranks) {
        if (groups[rank] && groups[rank].length >= 3) {
          planeCards.push(...groups[rank].slice(0, 3));
        } else {
          break;
        }
      }
      
      if (planeCards.length === len * 3) {
        planes.push({ cards: planeCards, length: len, highRank: ranks[ranks.length - 1] });
      }
    }
  }
  
  return planes;
}

function findBestLead(hand, currentLevel, analysis, gameState, playerIndex) {
  const { players, finishOrder } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  const myHandCount = hand.length;
  const teammateHandCount = players[teammateIndex]?.hand?.length || 27;
  
  const opponentMinCards = Math.min(
    players[(playerIndex + 1) % 4]?.hand?.length || 27,
    players[(playerIndex + 3) % 4]?.hand?.length || 27
  );
  
  if (myHandCount <= 3 && analysis.bombs.length > 0) {
    return analysis.bombs[0].cards;
  }
  
  if (analysis.straights.length > 0 && analysis.straights[0].length >= 5) {
    const lowStraight = analysis.straights.find(s => getCardValue(s.highRank, currentLevel) < 50);
    if (lowStraight) {
      return lowStraight.cards;
    }
  }
  
  if (analysis.planes.length > 0 && analysis.singles.length >= analysis.planes[0].length) {
    const plane = analysis.planes[0];
    const wings = analysis.singles.slice(0, plane.length).flatMap(s => s.cards);
    return [...plane.cards, ...wings];
  }
  
  if (analysis.straightPairs.length > 0) {
    const lowPairs = analysis.straightPairs.find(s => getCardValue(s.highRank, currentLevel) < 50);
    if (lowPairs) {
      return lowPairs.cards;
    }
  }
  
  if (analysis.triples.length > 0) {
    const triple = analysis.triples[0];
    if (analysis.singles.length > 0) {
      const single = analysis.singles[0].cards[0];
      if (single.rank !== triple.rank) {
        return [...triple.cards, single];
      }
    }
    if (analysis.pairs.length > 0) {
      const pair = analysis.pairs.find(p => p.rank !== triple.rank);
      if (pair) {
        return [...triple.cards, ...pair.cards];
      }
    }
    return triple.cards;
  }
  
  if (analysis.pairs.length > 0) {
    return analysis.pairs[0].cards;
  }
  
  if (analysis.singles.length > 0) {
    return analysis.singles[0].cards;
  }
  
  if (analysis.bombs.length > 0) {
    return analysis.bombs[0].cards;
  }
  
  return [sortCards(hand)[0]];
}

function shouldSupportTeammate(hand, gameState, playerIndex, analysis) {
  const { finishOrder, players, lastPlay } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  
  if (finishOrder.includes(teammateIndex)) return true;
  
  const myHandCount = hand.length;
  const teammateHandCount = players[teammateIndex]?.hand?.length || 27;
  
  if (teammateHandCount <= 3) return true;
  
  if (teammateHandCount <= 5 && myHandCount > 8) return true;
  
  if (teammateHandCount <= 8 && myHandCount > 12) return true;
  
  const opponentMinCards = Math.min(
    players[(playerIndex + 1) % 4]?.hand?.length || 27,
    players[(playerIndex + 3) % 4]?.hand?.length || 27
  );
  
  if (teammateHandCount < opponentMinCards) {
    return true;
  }
  
  return false;
}

function findAllValidPlays(hand, lastPlay, currentLevel) {
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return [];
  
  const validPlays = [];
  const groups = groupCardsByRank(hand);
  
  if (lastPattern.type === PATTERN_TYPES.SINGLE) {
    for (const card of hand) {
      const result = isValidPlay([card], lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push({ cards: [card], isBomb: false });
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.PAIR) {
    for (const cards of Object.values(groups)) {
      if (cards.length >= 2) {
        const pair = cards.slice(0, 2);
        const result = isValidPlay(pair, lastPlay, currentLevel);
        if (result.valid) {
          validPlays.push({ cards: pair, isBomb: false });
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.TRIPLE) {
    for (const cards of Object.values(groups)) {
      if (cards.length >= 3) {
        const triple = cards.slice(0, 3);
        const result = isValidPlay(triple, lastPlay, currentLevel);
        if (result.valid) {
          validPlays.push({ cards: triple, isBomb: false });
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.TRIPLE_WITH_ONE) {
    const triples = Object.entries(groups).filter(([_, cards]) => cards.length >= 3);
    const sortedSingles = getSortedSingles(hand, groups, currentLevel);
    for (const [rank, tripleCards] of triples) {
      for (const single of sortedSingles) {
        if (single.rank !== rank) {
          const play = [...tripleCards.slice(0, 3), single];
          const result = isValidPlay(play, lastPlay, currentLevel);
          if (result.valid) {
            validPlays.push({ cards: play, isBomb: false });
          }
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.TRIPLE_WITH_PAIR) {
    const triples = Object.entries(groups).filter(([_, cards]) => cards.length >= 3);
    const sortedPairs = getSortedPairs(groups, currentLevel);
    for (const [trank, tripleCards] of triples) {
      for (const { rank: prank, cards: pairCards } of sortedPairs) {
        if (trank !== prank) {
          const play = [...tripleCards.slice(0, 3), ...pairCards.slice(0, 2)];
          const result = isValidPlay(play, lastPlay, currentLevel);
          if (result.valid) {
            validPlays.push({ cards: play, isBomb: false });
          }
        }
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.STRAIGHT) {
    const straightLength = lastPattern.cards.length;
    const straights = findStraights(hand, straightLength);
    for (const straight of straights) {
      const result = isValidPlay(straight, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push({ cards: straight, isBomb: false });
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.STRAIGHT_PAIRS) {
    const pairCount = lastPattern.length;
    const straightPairs = findStraightPairs(hand, pairCount);
    for (const sp of straightPairs) {
      const result = isValidPlay(sp, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push({ cards: sp, isBomb: false });
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.PLANE) {
    const planeCount = lastPattern.length;
    const planes = findPlanes(hand, planeCount);
    for (const plane of planes) {
      const result = isValidPlay(plane, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push({ cards: plane, isBomb: false });
      }
    }
  } else if (lastPattern.type === PATTERN_TYPES.PLANE_WITH_WINGS) {
    const planeCount = lastPattern.length;
    const planes = findPlanesWithWings(hand, planeCount, groups);
    for (const plane of planes) {
      const result = isValidPlay(plane, lastPlay, currentLevel);
      if (result.valid) {
        validPlays.push({ cards: plane, isBomb: false });
      }
    }
  }
  
  const bombs = findBombs(hand);
  for (const bomb of bombs) {
    const result = isValidPlay(bomb, lastPlay, currentLevel);
    if (result.valid) {
      validPlays.push({ cards: bomb, isBomb: true });
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

function findPlanes(hand, planeCount) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const groups = groupCardsByRank(hand);
  const planes = [];
  
  for (let i = 0; i <= validRanks.length - planeCount; i++) {
    const planeRanks = validRanks.slice(i, i + planeCount);
    const planeCards = [];
    
    for (const rank of planeRanks) {
      if (groups[rank] && groups[rank].length >= 3) {
        planeCards.push(...groups[rank].slice(0, 3));
      } else {
        break;
      }
    }
    
    if (planeCards.length === planeCount * 3) {
      planes.push(planeCards);
    }
  }
  
  return planes;
}

function findPlanesWithWings(hand, planeCount, groups) {
  const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const planes = [];
  
  for (let i = 0; i <= validRanks.length - planeCount; i++) {
    const planeRanks = validRanks.slice(i, i + planeCount);
    const planeCards = [];
    const usedRanks = new Set(planeRanks);
    
    for (const rank of planeRanks) {
      if (groups[rank] && groups[rank].length >= 3) {
        planeCards.push(...groups[rank].slice(0, 3));
      } else {
        break;
      }
    }
    
    if (planeCards.length === planeCount * 3) {
      const wings = [];
      for (const [rank, cards] of Object.entries(groups)) {
        if (!usedRanks.has(rank) && cards.length >= 1) {
          wings.push(cards[0]);
          if (wings.length === planeCount) break;
        }
      }
      
      if (wings.length === planeCount) {
        planes.push([...planeCards, ...wings]);
      }
    }
  }
  
  return planes;
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

function selectBestPlay(validPlays, hand, currentLevel, analysis, context) {
  const { isTeammateLeading, isEmergency, opponentHandCounts, lastPattern } = context;
  
  const scoredPlays = validPlays.map(play => ({
    ...play,
    score: evaluatePlay(play, hand, currentLevel, analysis, context)
  }));
  
  if (isTeammateLeading && !isEmergency) {
    const nonBombPlays = scoredPlays.filter(p => !p.isBomb);
    if (nonBombPlays.length > 0) {
      nonBombPlays.sort((a, b) => b.score - a.score);
      const bestPlay = nonBombPlays[0];
      
      if (bestPlay.score >= 60) {
        return bestPlay.cards;
      }
    }
    return null;
  }
  
  if (isEmergency) {
    const bombPlays = scoredPlays.filter(p => p.isBomb);
    if (bombPlays.length > 0) {
      return bombPlays.sort((a, b) => b.score - a.score)[0].cards;
    }
  }
  
  const nonBombPlays = scoredPlays.filter(p => !p.isBomb);
  if (nonBombPlays.length > 0) {
    return nonBombPlays.sort((a, b) => b.score - a.score)[0].cards;
  }
  
  if (hand.length <= 6 || isEmergency) {
    return scoredPlays.sort((a, b) => b.score - a.score)[0].cards;
  }
  
  return null;
}

function evaluatePlay(play, hand, currentLevel, analysis, context) {
  let score = 100;
  
  const pattern = identifyPattern(play.cards);
  if (!pattern) return 0;
  
  const patternValue = getPatternValue(pattern, currentLevel);
  score -= patternValue * 0.5;
  
  if (play.isBomb) {
    score -= 30;
    if (analysis.bombs.length <= 1) {
      score -= 20;
    }
  }
  
  const usedRanks = new Set(play.cards.map(c => c.rank));
  let remainingAnalysis = true;
  for (const rank of usedRanks) {
    const groupCount = analysis.singles.filter(s => s.rank === rank).length +
                       analysis.pairs.filter(p => p.rank === rank).length +
                       analysis.triples.filter(t => t.rank === rank).length;
    if (groupCount > 0) {
      remainingAnalysis = false;
    }
  }
  if (remainingAnalysis) {
    score += 10;
  }
  
  const remainingCount = hand.length - play.cards.length;
  if (remainingCount <= 3) {
    score += 50;
  } else if (remainingCount <= 5) {
    score += 30;
  }
  
  if (context.isEmergency && !play.isBomb) {
    score -= 20;
  }
  
  return score;
}

function getPatternValue(pattern, currentLevel) {
  if (!pattern) return 0;
  
  const mainRank = pattern.mainRank;
  return getCardValue(mainRank, currentLevel);
}

function getCardValue(rank, currentLevel) {
  if (rank === 'bigJoker') return 100;
  if (rank === 'littleJoker') return 90;
  if (rank === String(currentLevel)) return 80;
  if (rank === 'kings') return 95;
  
  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const idx = rankOrder.indexOf(rank);
  return idx >= 0 ? (idx + 1) * 5 : 0;
}

function getSortedSingles(hand, groups, currentLevel) {
  const singles = [];
  const usedRanks = new Set();
  
  for (const [rank, cards] of Object.entries(groups)) {
    if (cards.length >= 3 && cards.length <= 4) {
      // 3张或4张：全部用于三张/炸弹，不作为单牌
      continue;
    }
    if (cards.length >= 5) {
      // 5张以上：前4张用于炸弹，剩余的可以作为单牌
      for (let i = 4; i < cards.length; i++) {
        singles.push(cards[i]);
      }
      continue;
    }
    if (cards.length === 1) {
      singles.push(cards[0]);
    }
  }
  
  singles.sort((a, b) => getCardValue(a.rank, currentLevel) - getCardValue(b.rank, currentLevel));
  
  return singles;
}

function getSortedPairs(groups, currentLevel) {
  const pairs = Object.entries(groups)
    .filter(([rank, cards]) => cards.length === 2)
    .map(([rank, cards]) => ({ rank, cards, value: getCardValue(rank, currentLevel) }));
  
  pairs.sort((a, b) => a.value - b.value);
  
  return pairs;
}

function getOpponentHandCounts(players, playerIndex, teammateIndex) {
  const opponents = [];
  for (let i = 0; i < 4; i++) {
    if (i !== playerIndex && i !== teammateIndex) {
      opponents.push(players[i]?.hand?.length || 27);
    }
  }
  return {
    min: Math.min(...opponents),
    max: Math.max(...opponents)
  };
}

function isEmergencySituation(opponentHandCounts, myHandCount) {
  return opponentHandCounts.min <= 3 && myHandCount > opponentHandCounts.min;
}

export function evaluateHand(hand, currentLevel) {
  const analysis = analyzeHand(hand, currentLevel);
  let score = 0;
  
  score += analysis.bombs.length * 50;
  score += analysis.jokers.length * 20;
  score += analysis.straights.length * 10;
  score += analysis.straightPairs.length * 15;
  score += analysis.planes.length * 20;
  
  return score;
}

export function getAIHint(hand, gameState, playerIndex) {
  const { lastPlay, lastPlayer, currentLevel, players, finishOrder } = gameState;
  const teammateIndex = (playerIndex + 2) % 4;
  const isTeammateLeading = lastPlayer === teammateIndex;
  
  const handAnalysis = analyzeHand(hand, currentLevel);
  
  if (!lastPlay || lastPlay.length === 0) {
    const suggestedPlay = findBestLead(hand, currentLevel, handAnalysis, gameState, playerIndex);
    if (suggestedPlay) {
      const pattern = identifyPattern(suggestedPlay);
      return {
        cards: suggestedPlay,
        pattern,
        reason: getLeadReason(handAnalysis, pattern, currentLevel),
        alternatives: getAlternativeLeads(hand, currentLevel, handAnalysis, suggestedPlay)
      };
    }
    return null;
  }
  
  if (isTeammateLeading && shouldSupportTeammate(hand, gameState, playerIndex, handAnalysis)) {
    return {
      cards: null,
      pattern: null,
      reason: '队友领先时建议不出，让队友继续出牌',
      alternatives: []
    };
  }
  
  const lastPattern = identifyPattern(lastPlay);
  if (!lastPattern) return null;
  
  const validPlays = findAllValidPlays(hand, lastPlay, currentLevel);
  if (validPlays.length === 0) {
    return {
      cards: null,
      pattern: null,
      reason: '没有能压过上家的牌，建议不出',
      alternatives: []
    };
  }
  
  const opponentHandCounts = getOpponentHandCounts(players, playerIndex, teammateIndex);
  const isEmergency = isEmergencySituation(opponentHandCounts, hand.length);
  
  const bestPlay = selectBestPlay(validPlays, hand, currentLevel, handAnalysis, {
    isTeammateLeading,
    isEmergency,
    opponentHandCounts,
    lastPattern
  });
  
  if (!bestPlay) {
    return {
      cards: null,
      pattern: null,
      reason: '建议不出，保留大牌',
      alternatives: []
    };
  }
  
  const bestPattern = identifyPattern(bestPlay);
  const alternatives = getAlternativePlays(validPlays, bestPlay, hand, currentLevel);
  
  return {
    cards: bestPlay,
    pattern: bestPattern,
    reason: getPlayReason(bestPlay, bestPattern, lastPattern, handAnalysis, currentLevel, isEmergency),
    alternatives
  };
}

function getLeadReason(analysis, pattern, currentLevel) {
  if (!pattern) return '建议出牌';
  
  const typeNames = {
    'single': '单牌',
    'pair': '对子',
    'triple': '三张',
    'tripleWithOne': '三带一',
    'tripleWithPair': '三带二',
    'straight': '顺子',
    'straightPairs': '连对',
    'plane': '飞机',
    'planeWithWings': '飞机带翅膀',
    'bombFour': '四张炸弹',
    'bombFive': '五张炸弹',
    'bombSix': '六张炸弹',
    'straightFlush': '同花顺',
    'fourKings': '四大天王'
  };
  
  if (pattern.type === 'straight' || pattern.type === 'straightPairs') {
    return `建议出${typeNames[pattern.type]}，消耗手牌`;
  }
  
  if (pattern.type === 'tripleWithOne' || pattern.type === 'tripleWithPair') {
    return `建议出${typeNames[pattern.type]}，清理散牌`;
  }
  
  if (pattern.type === 'plane' || pattern.type === 'planeWithWings') {
    return `建议出${typeNames[pattern.type]}，大牌型难接`;
  }
  
  if (analysis.singles.length > 0) {
    return '建议先出单牌，保留组合牌型';
  }
  
  return `建议出${typeNames[pattern.type] || '牌'}`;
}

function getPlayReason(cards, pattern, lastPattern, analysis, currentLevel, isEmergency) {
  if (!pattern) return '建议出牌';
  
  const typeNames = {
    'single': '单牌',
    'pair': '对子',
    'triple': '三张',
    'tripleWithOne': '三带一',
    'tripleWithPair': '三带二',
    'straight': '顺子',
    'straightPairs': '连对',
    'plane': '飞机',
    'planeWithWings': '飞机带翅膀',
    'bombFour': '四张炸弹',
    'bombFive': '五张炸弹',
    'bombSix': '六张炸弹',
    'straightFlush': '同花顺',
    'fourKings': '四大天王'
  };
  
  if (isEmergency) {
    return '对手快出完了，建议出牌压制';
  }
  
  if (isBomb(pattern)) {
    return '对手牌大，需要用炸弹压制';
  }
  
  const cardValue = getCardValue(pattern.mainRank, currentLevel);
  if (cardValue < 30) {
    return `建议用小${typeNames[pattern.type] || '牌'}压过`;
  }
  
  return `建议出${typeNames[pattern.type] || '牌'}压过`;
}

function getAlternativeLeads(hand, currentLevel, analysis, exclude) {
  const alternatives = [];
  const excludeIds = new Set(exclude?.map(c => c.id) || []);
  
  if (analysis.pairs.length > 0) {
    const pair = analysis.pairs[0].cards;
    if (!pair.every(c => excludeIds.has(c.id))) {
      alternatives.push({
        cards: pair,
        pattern: identifyPattern(pair),
        label: '出对子'
      });
    }
  }
  
  if (analysis.triples.length > 0 && analysis.singles.length > 0) {
    const triple = analysis.triples[0].cards;
    const single = analysis.singles[0].cards[0];
    if (!triple.every(c => excludeIds.has(c.id))) {
      const play = [...triple, single];
      alternatives.push({
        cards: play,
        pattern: identifyPattern(play),
        label: '出三带一'
      });
    }
  }
  
  if (analysis.straights.length > 0) {
    const straight = analysis.straights[0].cards;
    if (!straight.every(c => excludeIds.has(c.id))) {
      alternatives.push({
        cards: straight,
        pattern: identifyPattern(straight),
        label: '出顺子'
      });
    }
  }
  
  return alternatives.slice(0, 3);
}

function getAlternativePlays(validPlays, bestPlay, hand, currentLevel) {
  const alternatives = [];
  const bestIds = new Set(bestPlay?.map(c => c.id) || []);
  
  const nonBombPlays = validPlays.filter(p => {
    const pattern = identifyPattern(p.cards);
    return !isBomb(pattern) && !p.cards.every(c => bestIds.has(c.id));
  });
  
  const seen = new Set();
  for (const play of nonBombPlays) {
    const pattern = identifyPattern(play.cards);
    const key = pattern?.type + '-' + pattern?.mainRank;
    if (seen.has(key)) continue;
    seen.add(key);
    
    if (alternatives.length < 2) {
      alternatives.push({
        cards: play.cards,
        pattern,
        label: `出${getPatternLabel(pattern)}`
      });
    }
  }
  
  return alternatives;
}

function getPatternLabel(pattern) {
  if (!pattern) return '牌';
  
  const labels = {
    'single': '单牌',
    'pair': '对子',
    'triple': '三张',
    'tripleWithOne': '三带一',
    'tripleWithPair': '三带二',
    'straight': '顺子',
    'straightPairs': '连对',
    'plane': '飞机',
    'planeWithWings': '飞机带翅膀',
    'bombFour': '炸弹',
    'bombFive': '五炸',
    'bombSix': '六炸',
    'straightFlush': '同花顺',
    'fourKings': '四大天王'
  };
  
  return labels[pattern.type] || '牌';
}
