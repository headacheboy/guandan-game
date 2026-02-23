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
      setTimeout(() => get().processAITurns(), 500);
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
      setTimeout(() => get().processAITurns(), 500);
    }
  },
  
  playerPass: () => {
    const { gameState } = get();
    const playerIndex = 0;
    
    if (!isPlayerTurn(gameState, playerIndex)) return;
    
    const newState = pass(gameState, playerIndex);
    set({ gameState: newState, selectedCards: [] });
    
    if (newState.phase === GAME_PHASES.PLAYING) {
      setTimeout(() => get().processAITurns(), 500);
    }
  },
  
  processAITurns: () => {
    const { gameState } = get();
    let currentState = gameState;
    
    const processNextAI = () => {
      const { gameState: state } = get();
      const currentPlayer = state.currentPlayer;
      const player = state.players[currentPlayer];
      
      if (state.phase !== GAME_PHASES.PLAYING) return;
      
      if (!player.isAI) return;
      
      const aiCards = getAIPlay(player.hand, state, currentPlayer);
      
      let newState;
      if (aiCards) {
        newState = playCards(state, currentPlayer, aiCards);
      } else {
        newState = pass(state, currentPlayer);
      }
      
      set({ gameState: newState });
      
      if (newState.phase === GAME_PHASES.PLAYING && newState.players[newState.currentPlayer].isAI) {
        setTimeout(processNextAI, 600);
      }
    };
    
    if (currentState.players[currentState.currentPlayer].isAI) {
      setTimeout(processNextAI, 600);
    }
  },
  
  nextRound: () => {
    const { gameState } = get();
    const newState = getNextRound(gameState);
    set({ gameState: newState, selectedCards: [] });
    
    setTimeout(() => get().processAITurns(), 500);
  },
  
  resetGame: () => {
    set({ gameState: resetGame(), selectedCards: [] });
  }
}));
