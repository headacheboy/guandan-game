import { createDeck, shuffleDeck, dealCards, removeCards, sortCards } from '../shared/cards.js';
import { identifyPattern } from '../shared/patterns.js';
import { isValidPlay, calculateLevelUp, isGameOver, getWinner } from '../shared/rules.js';

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
    roundHistory: [],
    teamLevels: { A: 2, B: 2 },
    roundsPlayed: 0,
    tributes: [],
    message: '等待开始游戏'
  };
}

export function startNewRound(state) {
  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck, 4);
  
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
  
  const newHand = removeCards(state.players[playerIndex].hand, cards);
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
  let newState = {
    ...state,
    players: newPlayers,
    lastPlay: cards,
    lastPlayer: playerIndex,
    passCount: 0,
    finishOrder: newFinishOrder,
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
  
  let newState = {
    ...state,
    passCount: state.passCount + 1,
    message: `${state.players[playerIndex].name}不出`
  };
  
  const activePlayers = state.players.filter(p => !p.finished);
  if (newState.passCount >= activePlayers.length - 1) {
    newState = {
      ...newState,
      lastPlay: null,
      lastPlayer: -1,
      passCount: 0,
      currentPlayer: state.lastPlayer,
      message: `${state.players[state.lastPlayer].name}获得出牌权`
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
  const result = calculateLevelUp(state.finishOrder, [0, 2], [1, 3]);
  
  const newTeamLevels = { ...state.teamLevels };
  if (result.winner === 'A') {
    newTeamLevels.A = Math.min(14, newTeamLevels.A + result.levels);
  } else {
    newTeamLevels.B = Math.min(14, newTeamLevels.B + result.levels);
  }
  
  const gameEnded = isGameOver(newTeamLevels, 13);
  const winner = getWinner(newTeamLevels, 13);
  
  let newPlayers = state.players.map(p => ({
    ...p,
    level: p.id % 2 === 0 ? newTeamLevels.A : newTeamLevels.B
  }));
  
  return {
    ...state,
    phase: gameEnded ? GAME_PHASES.GAME_END : GAME_PHASES.ROUND_END,
    teamLevels: newTeamLevels,
    players: newPlayers,
    currentLevel: result.winner === 'A' ? newTeamLevels.A : newTeamLevels.B,
    message: gameEnded 
      ? `游戏结束！${winner === 'A' ? '玩家队' : 'AI队'}获胜！`
      : `本轮结束，${result.winner === 'A' ? '玩家队' : 'AI队'}升${result.levels}级`
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
