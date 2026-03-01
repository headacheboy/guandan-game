import { createDeck, shuffleDeck, dealCards, removeCards, sortCards } from './cards.js';
import { identifyPattern } from './patterns.js';
import { isValidPlay, calculateLevelUp, isGameOver, getWinner } from './rules.js';
import { createGameStats, updateGameStats, calculateScore, getScoreMessage } from './score.js';

export const GAME_PHASES = {
  WAITING: 'waiting',
  DEALING: 'dealing',
  TRIBUTE: 'tribute',
  RETURN_TRIBUTE: 'returnTribute',
  PLAYING: 'playing',
  ROUND_END: 'roundEnd',
  GAME_END: 'gameEnd'
};

export function createInitialGameState() {
  return {
    phase: GAME_PHASES.WAITING,
    players: [
      { id: 0, name: '玩家', hand: [], isAI: false, level: 2, finished: false, finishPosition: -1 },
      { id: 1, name: 'AI-1', hand: [], isAI: true, level: 2, finished: false, finishPosition: -1 },
      { id: 2, name: 'AI-2', hand: [], isAI: true, level: 2, finished: false, finishPosition: -1 },
      { id: 3, name: 'AI-3', hand: [], isAI: true, level: 2, finished: false, finishPosition: -1 }
    ],
    currentLevel: 2,
    trumpSuit: null,
    currentPlayer: 0,
    lastPlay: null,
    lastPlayer: -1,
    passCount: 0,
    finishOrder: [],
    playHistory: [],
    teamLevels: { A: 2, B: 2 },
    roundsPlayed: 0,
    tributes: [],
    gameStats: createGameStats(),
    lastRoundResult: null,
    message: '等待开始游戏'
  };
}

export function startNewRound(state) {
  const deck = shuffleDeck(createDeck());
  const levelToPlay = state.currentLevel || 2;
  const hands = dealCards(deck, 4, levelToPlay);
  
  const newPlayers = state.players.map((p, i) => ({
    ...p,
    hand: hands[i],
    finished: false,
    finishPosition: -1
  }));
  
  const starter = findStartingPlayer(newPlayers);
  
  return {
    ...state,
    phase: GAME_PHASES.PLAYING,
    players: newPlayers,
    currentPlayer: starter,
    lastPlay: null,
    lastPlayer: -1,
    passCount: 0,
    finishOrder: [],
    playHistory: [],
    tributes: [],
    message: `游戏开始，${newPlayers[starter].name}先出牌`
  };
}

function findStartingPlayer(players) {
  for (let i = 0; i < players.length; i++) {
    const hand = players[i].hand;
    for (const card of hand) {
      if (card.suit === 'hearts' && card.rank === '2') {
        return i;
      }
    }
  }
  return 0;
}

export function playCards(state, playerIndex, cards) {
  if (state.currentPlayer !== playerIndex) {
    return { ...state, message: '不是你的回合' };
  }
  
  if (state.players[playerIndex].finished) {
    return { ...state, message: '你已经出完牌了' };
  }
  
  const validation = isValidPlay(cards, state.lastPlay, state.currentLevel, state.trumpSuit);
  if (!validation.valid) {
    return { ...state, message: validation.reason };
  }
  
  const newHand = sortCards(removeCards(state.players[playerIndex].hand, cards), state.currentLevel);
  const finished = newHand.length === 0;
  
  let newPlayers = [...state.players];
  newPlayers[playerIndex] = {
    ...newPlayers[playerIndex],
    hand: newHand,
    finished,
    finishPosition: finished ? state.finishOrder.length : -1
  };
  
  let newFinishOrder = [...state.finishOrder];
  if (finished) {
    newFinishOrder.push(playerIndex);
  }
  
  const newPattern = validation.pattern;
  const historyEntry = {
    type: 'play',
    playerIndex,
    playerName: newPlayers[playerIndex].name,
    cards: [...cards],
    pattern: newPattern,
    timestamp: Date.now()
  };
  
  let newState = {
    ...state,
    players: newPlayers,
    lastPlay: cards,
    lastPlayer: playerIndex,
    passCount: 0,
    finishOrder: newFinishOrder,
    playHistory: [...state.playHistory, historyEntry],
    message: `${newPlayers[playerIndex].name}出了${newPattern.cards.length}张牌`
  };
  
  if (newFinishOrder.length >= 3) {
    if (newFinishOrder.length === 4) {
      return endRound(newState);
    }
    const remaining = newPlayers.filter(p => !p.finished);
    if (remaining.length === 1) {
      newFinishOrder.push(remaining[0].id);
      newState.finishOrder = newFinishOrder;
      return endRound(newState);
    }
  }
  
  newState = advanceToNextPlayer(newState);
  
  return newState;
}

export function pass(state, playerIndex) {
  if (state.currentPlayer !== playerIndex) {
    return { ...state, message: '不是你的回合' };
  }
  
  if (!state.lastPlay) {
    return { ...state, message: '你必须出牌' };
  }
  
  if (state.lastPlayer === playerIndex) {
    return { ...state, message: '你是上一个出牌的，不能跳过' };
  }
  
  const historyEntry = {
    type: 'pass',
    playerIndex,
    playerName: state.players[playerIndex].name,
    timestamp: Date.now()
  };
  
  let newState = {
    ...state,
    passCount: state.passCount + 1,
    playHistory: [...state.playHistory, historyEntry],
    message: `${state.players[playerIndex].name}不出`
  };
  
  const activePlayers = state.players.filter(p => !p.finished);
  if (newState.passCount >= activePlayers.length - 1) {
    let nextPlayer = state.lastPlayer;
    
    if (state.players[state.lastPlayer].finished) {
      nextPlayer = (state.lastPlayer + 1) % 4;
      let attempts = 0;
      while (state.players[nextPlayer].finished && attempts < 4) {
        nextPlayer = (nextPlayer + 1) % 4;
        attempts++;
      }
    }
    
    newState = {
      ...newState,
      lastPlay: null,
      lastPlayer: -1,
      passCount: 0,
      currentPlayer: nextPlayer,
      message: `${state.players[nextPlayer].name}获得出牌权`
    };
  } else {
    newState = advanceToNextPlayer(newState);
  }
  
  return newState;
}

function advanceToNextPlayer(state) {
  let nextPlayer = (state.currentPlayer + 1) % 4;
  let attempts = 0;
  
  while (state.players[nextPlayer].finished && attempts < 4) {
    nextPlayer = (nextPlayer + 1) % 4;
    attempts++;
  }
  
  return {
    ...state,
    currentPlayer: nextPlayer
  };
}

function endRound(state) {
  const levelUpResult = calculateLevelUp(state.finishOrder, [0, 2], [1, 3]);
  
  const teamLevelsBefore = { ...state.teamLevels };
  const newTeamLevels = { ...state.teamLevels };
  
  if (levelUpResult.winner === 'A') {
    newTeamLevels.A = Math.min(14, newTeamLevels.A + levelUpResult.levels);
  } else {
    newTeamLevels.B = Math.min(14, newTeamLevels.B + levelUpResult.levels);
  }
  
  const roundScore = calculateScore(state.finishOrder, teamLevelsBefore, newTeamLevels);
  
  const newGameStats = updateGameStats(state.gameStats, {
    winner: levelUpResult.winner,
    score: roundScore.score,
    levelsUp: levelUpResult.levels,
    finishOrder: state.finishOrder,
    teamLevelsBefore,
    teamLevelsAfter: newTeamLevels
  });
  
  const gameEnded = isGameOver(newTeamLevels, 13);
  const winner = getWinner(newTeamLevels, 13);
  
  let newPlayers = state.players.map(p => ({
    ...p,
    level: p.id % 2 === 0 ? newTeamLevels.A : newTeamLevels.B
  }));
  
  const winnerScore = levelUpResult.winner === 'A' ? roundScore.score.A : roundScore.score.B;
  const scoreMsg = getScoreMessage(winnerScore, levelUpResult.winner, levelUpResult.levels);
  
  return {
    ...state,
    phase: gameEnded ? GAME_PHASES.GAME_END : GAME_PHASES.ROUND_END,
    teamLevels: newTeamLevels,
    players: newPlayers,
    currentLevel: levelUpResult.winner === 'A' ? newTeamLevels.A : newTeamLevels.B,
    gameStats: newGameStats,
    lastRoundResult: {
      winner: levelUpResult.winner,
      levelsUp: levelUpResult.levels,
      score: roundScore.score,
      finishOrder: state.finishOrder
    },
    message: gameEnded 
      ? `游戏结束！${winner === 'A' ? '玩家队' : 'AI队'}获胜！总比分 ${newGameStats.teamAWins}:${newGameStats.teamBWins}`
      : scoreMsg
  };
}

export function getNextRound(state) {
  return startNewRound({
    ...state,
    phase: GAME_PHASES.PLAYING,
    roundsPlayed: state.roundsPlayed + 1
  });
}

export function resetGame() {
  return createInitialGameState();
}

export function getPlayerTeam(playerIndex) {
  return playerIndex % 2 === 0 ? 'A' : 'B';
}

export function isPlayerTurn(state, playerIndex) {
  return state.currentPlayer === playerIndex && state.phase === GAME_PHASES.PLAYING;
}
