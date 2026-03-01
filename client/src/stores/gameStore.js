import { create } from 'zustand';
import {
  createInitialGameState,
  startNewRound,
  playCards,
  pass,
  getNextRound,
  resetGame,
  isPlayerTurn,
  GAME_PHASES
} from '../game/game.js';
import { getAIPlay, getAIHint } from '../game/ai.js';

// AI 处理延迟（毫秒）
const AI_DELAY = 500;

export const useGameStore = create((set, get) => ({
  gameState: createInitialGameState(),
  selectedCards: [],
  gameMode: 'ai',
  showHistory: false,
  aiHint: null,

  setGameMode: (mode) => set({ gameMode: mode }),

  toggleHistory: () => set(state => ({ showHistory: !state.showHistory })),

  closeHistory: () => set({ showHistory: false }),

  requestAIHint: () => {
    const { gameState } = get();
    const playerIndex = 0;

    if (!isPlayerTurn(gameState, playerIndex)) return;

    const hand = gameState.players[playerIndex].hand;
    const hint = getAIHint(hand, gameState, playerIndex);
    set({ aiHint: hint });
  },

  clearAIHint: () => set({ aiHint: null }),

  applyHint: (cards) => {
    set({ selectedCards: cards || [], aiHint: null });
  },

  startGame: () => {
    const state = get();
    const newState = startNewRound(state.gameState);
    set({ gameState: newState, selectedCards: [] });

    if (newState.players[newState.currentPlayer].isAI) {
      setTimeout(() => get().processAITurns(), AI_DELAY);
    }
  },

  selectCard: (card) => {
    const { selectedCards } = get();
    const isSelected = selectedCards.find(c => c.id === card.id);

    if (isSelected) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
    } else {
      set({ selectedCards: [...selectedCards, card] });
    }
  },

  clearSelection: () => set({ selectedCards: [] }),

  playSelectedCards: () => {
    const { gameState, selectedCards } = get();
    if (selectedCards.length === 0) return;

    const playerIndex = 0;
    if (!isPlayerTurn(gameState, playerIndex)) return;

    const newState = playCards(gameState, playerIndex, selectedCards);
    set({ gameState: newState, selectedCards: [] });

    if (newState.phase === GAME_PHASES.PLAYING) {
      setTimeout(() => get().processAITurns(), AI_DELAY);
    }
  },

  playerPass: () => {
    const { gameState } = get();
    const playerIndex = 0;

    if (!isPlayerTurn(gameState, playerIndex)) return;

    const newState = pass(gameState, playerIndex);
    set({ gameState: newState, selectedCards: [] });

    if (newState.phase === GAME_PHASES.PLAYING) {
      setTimeout(() => get().processAITurns(), AI_DELAY);
    }
  },

  processAITurns: () => {
    const state = get();
    const { gameState } = state;

    // 检查游戏是否还在进行
    if (gameState.phase !== GAME_PHASES.PLAYING) return;

    const currentPlayer = gameState.currentPlayer;
    const player = gameState.players[currentPlayer];

    // 如果不是 AI 回合，停止处理
    if (!player.isAI) return;

    // 获取 AI 出牌
    const aiCards = getAIPlay(player.hand, gameState, currentPlayer);

    let newState;
    if (aiCards) {
      newState = playCards(gameState, currentPlayer, aiCards);
    } else {
      newState = pass(gameState, currentPlayer);
    }

    set({ gameState: newState });

    // 如果下一个玩家也是 AI，继续处理
    if (newState.phase === GAME_PHASES.PLAYING && newState.players[newState.currentPlayer].isAI) {
      setTimeout(() => get().processAITurns(), AI_DELAY + 100);
    }
  },

  nextRound: () => {
    const { gameState } = get();
    const newState = getNextRound(gameState);
    set({ gameState: newState, selectedCards: [] });

    setTimeout(() => get().processAITurns(), AI_DELAY);
  },

  resetGame: () => {
    set({ gameState: resetGame(), selectedCards: [] });
  }
}));
