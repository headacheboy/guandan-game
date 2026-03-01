import { describe, it, expect } from 'vitest';
import { isValidPlay, calculateLevelUp, isGameOver, getWinner } from './rules.js';
import { PATTERN_TYPES } from './patterns.js';

// Helper to create card objects
const createCard = (rank, suit = 'hearts') => ({
  id: `${rank}-${suit}-${Math.random()}`,
  rank,
  suit,
  value: rank === 'littleJoker' ? 15 : rank === 'bigJoker' ? 16 : { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }[rank],
  isJoker: rank === 'littleJoker' || rank === 'bigJoker',
  jokerType: rank === 'littleJoker' ? 'little' : rank === 'bigJoker' ? 'big' : undefined
});

describe('rules.js', () => {
  describe('isValidPlay', () => {
    describe('basic validation', () => {
      it('should reject empty card selection', () => {
        const result = isValidPlay([], null, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('请选择要出的牌');
      });

      it('should reject null card selection', () => {
        const result = isValidPlay(null, null, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('请选择要出的牌');
      });

      it('should reject invalid pattern', () => {
        const cards = [createCard('A'), createCard('K'), createCard('Q')]; // Not a valid pattern
        const result = isValidPlay(cards, null, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('无效的牌型');
      });
    });

    describe('first play (no last play)', () => {
      it('should accept valid pattern when starting', () => {
        const cards = [createCard('A')];
        const result = isValidPlay(cards, null, 2);
        expect(result.valid).toBe(true);
        expect(result.pattern.type).toBe(PATTERN_TYPES.SINGLE);
      });

      it('should accept pair when starting', () => {
        const cards = [createCard('K'), createCard('K', 'spades')];
        const result = isValidPlay(cards, null, 2);
        expect(result.valid).toBe(true);
        expect(result.pattern.type).toBe(PATTERN_TYPES.PAIR);
      });

      it('should accept bomb when starting', () => {
        const cards = [
          createCard('5'), createCard('5', 'spades'),
          createCard('5', 'clubs'), createCard('5', 'diamonds')
        ];
        const result = isValidPlay(cards, null, 2);
        expect(result.valid).toBe(true);
        expect(result.pattern.type).toBe(PATTERN_TYPES.BOMB_FOUR);
      });
    });

    describe('following with same pattern type', () => {
      it('should accept higher single card', () => {
        const lastPlay = [createCard('5')];
        const newPlay = [createCard('K')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(true);
      });

      it('should reject lower single card', () => {
        const lastPlay = [createCard('K')];
        const newPlay = [createCard('5')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('牌不够大');
      });

      it('should accept higher pair', () => {
        const lastPlay = [createCard('5'), createCard('5', 'spades')];
        const newPlay = [createCard('K'), createCard('K', 'spades')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(true);
      });

      it('should reject pair with lower rank', () => {
        const lastPlay = [createCard('K'), createCard('K', 'spades')];
        const newPlay = [createCard('5'), createCard('5', 'spades')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('牌不够大');
      });
    });

    describe('pattern type matching', () => {
      it('should reject different pattern types (pair vs triple)', () => {
        const lastPlay = [createCard('5'), createCard('5', 'spades')];
        const newPlay = [createCard('K'), createCard('K', 'spades'), createCard('K', 'clubs')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('牌型不匹配');
      });

      it('should reject different card counts', () => {
        // Use mixed suits to avoid straight flush detection
        const lastPlay = [
          createCard('3', 'hearts'), createCard('4', 'spades'), createCard('5', 'hearts'),
          createCard('6', 'spades'), createCard('7', 'hearts')
        ];
        const newPlay = [
          createCard('5', 'hearts'), createCard('6', 'spades'), createCard('7', 'hearts'),
          createCard('8', 'spades'), createCard('9', 'hearts'), createCard('10', 'spades')
        ];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('牌数不匹配');
      });
    });

    describe('bombs', () => {
      it('should allow bomb to beat any non-bomb', () => {
        const lastPlay = [createCard('A'), createCard('A', 'spades')];
        const bomb = [
          createCard('3'), createCard('3', 'spades'),
          createCard('3', 'clubs'), createCard('3', 'diamonds')
        ];
        const result = isValidPlay(bomb, lastPlay, 2);
        expect(result.valid).toBe(true);
      });

      it('should allow higher bomb to beat lower bomb', () => {
        const lowBomb = [
          createCard('3'), createCard('3', 'spades'),
          createCard('3', 'clubs'), createCard('3', 'diamonds')
        ];
        const highBomb = [
          createCard('K'), createCard('K', 'spades'),
          createCard('K', 'clubs'), createCard('K', 'diamonds')
        ];
        const result = isValidPlay(highBomb, lowBomb, 2);
        expect(result.valid).toBe(true);
      });

      it('should reject lower bomb vs higher bomb', () => {
        const highBomb = [
          createCard('K'), createCard('K', 'spades'),
          createCard('K', 'clubs'), createCard('K', 'diamonds')
        ];
        const lowBomb = [
          createCard('3'), createCard('3', 'spades'),
          createCard('3', 'clubs'), createCard('3', 'diamonds')
        ];
        const result = isValidPlay(lowBomb, highBomb, 2);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('炸弹不够大');
      });
    });

    describe('level cards', () => {
      it('should allow level card to beat A at level 5', () => {
        const lastPlay = [createCard('A')];
        const newPlay = [createCard('5')];
        const result = isValidPlay(newPlay, lastPlay, 5);
        expect(result.valid).toBe(true);
      });

      it('should not allow regular 5 to beat A at level 2', () => {
        const lastPlay = [createCard('A')];
        const newPlay = [createCard('5')];
        const result = isValidPlay(newPlay, lastPlay, 2);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('calculateLevelUp', () => {
    it('should return 3 levels for double down (1st and 2nd)', () => {
      // Team A: players 0 and 2
      // finishOrder: [0, 2, 1, 3] means team A got 1st and 2nd
      const result = calculateLevelUp([0, 2, 1, 3], { A: 2, B: 2 }, { A: 2, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.levels).toBe(3);
    });

    it('should return 2 levels for 1st and 3rd', () => {
      // finishOrder: [0, 1, 2, 3] means team A got 1st and 3rd
      const result = calculateLevelUp([0, 1, 2, 3], { A: 2, B: 2 }, { A: 2, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.levels).toBe(2);
    });

    it('should return 1 level for 1st and 4th', () => {
      // finishOrder: [0, 1, 3, 2] means team A got 1st and 4th
      const result = calculateLevelUp([0, 1, 3, 2], { A: 2, B: 2 }, { A: 2, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.levels).toBe(1);
    });

    it('should return B as winner when B gets first', () => {
      // finishOrder: [1, 0, 2, 3] means team B (player 1) got 1st
      const result = calculateLevelUp([1, 0, 2, 3], { A: 2, B: 2 }, { A: 2, B: 2 });
      expect(result.winner).toBe('B');
    });

    it('should handle B team double down', () => {
      // finishOrder: [1, 3, 0, 2] means team B got 1st and 2nd
      const result = calculateLevelUp([1, 3, 0, 2], { A: 2, B: 2 }, { A: 2, B: 2 });
      expect(result.winner).toBe('B');
      expect(result.levels).toBe(3);
    });
  });

  describe('isGameOver', () => {
    it('should return true when team A reaches max level', () => {
      expect(isGameOver({ A: 13, B: 5 })).toBe(true);
    });

    it('should return true when team B reaches max level', () => {
      expect(isGameOver({ A: 5, B: 13 })).toBe(true);
    });

    it('should return false when no team reached max level', () => {
      expect(isGameOver({ A: 12, B: 12 })).toBe(false);
    });

    it('should respect custom max level', () => {
      expect(isGameOver({ A: 5, B: 3 }, 5)).toBe(true);
      expect(isGameOver({ A: 4, B: 3 }, 5)).toBe(false);
    });
  });

  describe('getWinner', () => {
    it('should return A when A reaches max level', () => {
      expect(getWinner({ A: 13, B: 5 })).toBe('A');
    });

    it('should return B when B reaches max level', () => {
      expect(getWinner({ A: 5, B: 13 })).toBe('B');
    });

    it('should return null when no winner yet', () => {
      expect(getWinner({ A: 12, B: 12 })).toBeNull();
    });
  });
});
