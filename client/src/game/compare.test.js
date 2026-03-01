import { describe, it, expect } from 'vitest';
import { comparePatterns, compareCards, canBeat, getWinningPattern } from './compare.js';
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

// Helper to create pattern objects
const createPattern = (type, mainRank, cards, mainCard = null, length = null) => ({
  type,
  mainRank,
  cards,
  mainCard: mainCard || cards[0],
  ...(length !== null && { length })
});

describe('compare.js', () => {
  describe('compareCards', () => {
    it('should compare two regular cards correctly', () => {
      const card3 = createCard('3');
      const cardA = createCard('A');
      expect(compareCards(card3, cardA, 2)).toBe(-1);
      expect(compareCards(cardA, card3, 2)).toBe(1);
      expect(compareCards(card3, createCard('3', 'spades'), 2)).toBe(0);
    });

    it('should consider jokers as highest', () => {
      const littleJoker = createCard('littleJoker');
      const bigJoker = createCard('bigJoker');
      const cardA = createCard('A');

      expect(compareCards(bigJoker, littleJoker, 2)).toBe(1);
      expect(compareCards(littleJoker, cardA, 2)).toBe(1);
      expect(compareCards(bigJoker, cardA, 2)).toBe(1);
    });

    it('should consider level cards higher than A', () => {
      const levelCard = createCard('5');
      const cardA = createCard('A');
      const cardK = createCard('K');

      // At level 5, the 5 should be higher than A
      expect(compareCards(levelCard, cardA, 5)).toBe(1);
      expect(compareCards(cardA, levelCard, 5)).toBe(-1);
      // At level 2, 5 is just a regular card
      expect(compareCards(levelCard, cardA, 2)).toBe(-1);
    });

    it('should compare big joker higher than little joker', () => {
      const littleJoker = createCard('littleJoker');
      const bigJoker = createCard('bigJoker');
      expect(compareCards(bigJoker, littleJoker, 2)).toBe(1);
      expect(compareCards(littleJoker, bigJoker, 2)).toBe(-1);
    });
  });

  describe('comparePatterns', () => {
    describe('comparing single cards', () => {
      it('should compare single cards by rank', () => {
        const pattern3 = createPattern(PATTERN_TYPES.SINGLE, '3', [createCard('3')]);
        const patternA = createPattern(PATTERN_TYPES.SINGLE, 'A', [createCard('A')]);

        expect(comparePatterns(pattern3, patternA, 2)).toBe(-1);
        expect(comparePatterns(patternA, pattern3, 2)).toBe(1);
      });

      it('should consider level card higher than A for single', () => {
        const patternLevel = createPattern(PATTERN_TYPES.SINGLE, '5', [createCard('5')]);
        const patternA = createPattern(PATTERN_TYPES.SINGLE, 'A', [createCard('A')]);

        expect(comparePatterns(patternLevel, patternA, 5)).toBe(1);
        expect(comparePatterns(patternA, patternLevel, 5)).toBe(-1);
      });
    });

    describe('comparing pairs', () => {
      it('should compare pairs by rank', () => {
        const pair3 = createPattern(PATTERN_TYPES.PAIR, '3', [createCard('3'), createCard('3', 'spades')]);
        const pairK = createPattern(PATTERN_TYPES.PAIR, 'K', [createCard('K'), createCard('K', 'spades')]);

        expect(comparePatterns(pair3, pairK, 2)).toBe(-1);
        expect(comparePatterns(pairK, pair3, 2)).toBe(1);
      });

      it('should return null for different pattern types', () => {
        const pair = createPattern(PATTERN_TYPES.PAIR, 'K', [createCard('K'), createCard('K', 'spades')]);
        const triple = createPattern(PATTERN_TYPES.TRIPLE, '3', [createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs')]);

        expect(comparePatterns(pair, triple, 2)).toBeNull();
      });
    });

    describe('comparing straights', () => {
      it('should compare straights by highest card', () => {
        const straightLow = createPattern(PATTERN_TYPES.STRAIGHT, '7', [
          createCard('3'), createCard('4'), createCard('5'), createCard('6'), createCard('7')
        ]);
        const straightHigh = createPattern(PATTERN_TYPES.STRAIGHT, '9', [
          createCard('5'), createCard('6'), createCard('7'), createCard('8'), createCard('9')
        ]);

        expect(comparePatterns(straightLow, straightHigh, 2)).toBe(-1);
        expect(comparePatterns(straightHigh, straightLow, 2)).toBe(1);
      });

      it('should return null for straights of different lengths', () => {
        const straight5 = createPattern(PATTERN_TYPES.STRAIGHT, '7', [
          createCard('3'), createCard('4'), createCard('5'), createCard('6'), createCard('7')
        ]);
        const straight6 = createPattern(PATTERN_TYPES.STRAIGHT, '8', [
          createCard('3'), createCard('4'), createCard('5'), createCard('6'), createCard('7'), createCard('8')
        ]);

        // Different card counts should return null
        expect(comparePatterns(straight5, straight6, 2)).toBeNull();
      });
    });

    describe('comparing bombs', () => {
      it('should return 1 when bomb beats non-bomb', () => {
        const bomb = createPattern(PATTERN_TYPES.BOMB_FOUR, '3', [
          createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs'), createCard('3', 'diamonds')
        ]);
        const pairA = createPattern(PATTERN_TYPES.PAIR, 'A', [createCard('A'), createCard('A', 'spades')]);

        expect(comparePatterns(bomb, pairA, 2)).toBe(1);
        expect(comparePatterns(pairA, bomb, 2)).toBe(-1);
      });

      it('should compare bombs by type priority', () => {
        const bomb4 = createPattern(PATTERN_TYPES.BOMB_FOUR, 'A', [
          createCard('A'), createCard('A', 'spades'), createCard('A', 'clubs'), createCard('A', 'diamonds')
        ]);
        const bomb5 = createPattern(PATTERN_TYPES.BOMB_FIVE, '3', [
          createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs'), createCard('3', 'diamonds'), createCard('3', 'hearts')
        ]);
        const straightFlush = createPattern(PATTERN_TYPES.STRAIGHT_FLUSH, '7', [
          createCard('3', 'spades'), createCard('4', 'spades'), createCard('5', 'spades'), createCard('6', 'spades'), createCard('7', 'spades')
        ]);

        // Five bomb beats four bomb
        expect(comparePatterns(bomb5, bomb4, 2)).toBe(1);
        // Straight flush beats five bomb
        expect(comparePatterns(straightFlush, bomb5, 2)).toBe(1);
      });

      it('should consider four kings as highest bomb', () => {
        const fourKings = createPattern(PATTERN_TYPES.FOUR_KINGS, 'kings', [
          createCard('littleJoker'), createCard('littleJoker'), createCard('bigJoker'), createCard('bigJoker')
        ]);
        const bomb6 = createPattern(PATTERN_TYPES.BOMB_SIX, 'A', [
          createCard('A'), createCard('A'), createCard('A'), createCard('A'), createCard('A'), createCard('A')
        ]);

        expect(comparePatterns(fourKings, bomb6, 2)).toBe(1);
      });

      it('should compare same-type bombs by rank', () => {
        const bomb3 = createPattern(PATTERN_TYPES.BOMB_FOUR, '3', [
          createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs'), createCard('3', 'diamonds')
        ]);
        const bombK = createPattern(PATTERN_TYPES.BOMB_FOUR, 'K', [
          createCard('K'), createCard('K', 'spades'), createCard('K', 'clubs'), createCard('K', 'diamonds')
        ]);

        expect(comparePatterns(bomb3, bombK, 2)).toBe(-1);
        expect(comparePatterns(bombK, bomb3, 2)).toBe(1);
      });

      it('should consider level bomb higher than regular bomb', () => {
        const levelBomb = createPattern(PATTERN_TYPES.BOMB_FOUR, '5', [
          createCard('5'), createCard('5', 'spades'), createCard('5', 'clubs'), createCard('5', 'diamonds')
        ]);
        const bombA = createPattern(PATTERN_TYPES.BOMB_FOUR, 'A', [
          createCard('A'), createCard('A', 'spades'), createCard('A', 'clubs'), createCard('A', 'diamonds')
        ]);

        // At level 5, the 5 bomb should beat A bomb
        expect(comparePatterns(levelBomb, bombA, 5)).toBe(1);
        expect(comparePatterns(bombA, levelBomb, 5)).toBe(-1);
      });
    });
  });

  describe('canBeat', () => {
    it('should return true when no existing pattern', () => {
      const pattern = createPattern(PATTERN_TYPES.SINGLE, '3', [createCard('3')]);
      expect(canBeat(null, pattern, 2)).toBe(true);
      expect(canBeat(undefined, pattern, 2)).toBe(true);
    });

    it('should return true when new pattern is higher', () => {
      const existing = createPattern(PATTERN_TYPES.PAIR, '5', [createCard('5'), createCard('5', 'spades')]);
      const newPattern = createPattern(PATTERN_TYPES.PAIR, 'K', [createCard('K'), createCard('K', 'spades')]);

      expect(canBeat(existing, newPattern, 2)).toBe(true);
    });

    it('should return false when new pattern is lower', () => {
      const existing = createPattern(PATTERN_TYPES.PAIR, 'K', [createCard('K'), createCard('K', 'spades')]);
      const newPattern = createPattern(PATTERN_TYPES.PAIR, '5', [createCard('5'), createCard('5', 'spades')]);

      expect(canBeat(existing, newPattern, 2)).toBe(false);
    });

    it('should return true when bomb beats non-bomb', () => {
      const existing = createPattern(PATTERN_TYPES.PAIR, 'A', [createCard('A'), createCard('A', 'spades')]);
      const bomb = createPattern(PATTERN_TYPES.BOMB_FOUR, '3', [
        createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs'), createCard('3', 'diamonds')
      ]);

      expect(canBeat(existing, bomb, 2)).toBe(true);
    });

    it('should return false for incomparable patterns', () => {
      const pair = createPattern(PATTERN_TYPES.PAIR, 'A', [createCard('A'), createCard('A', 'spades')]);
      const triple = createPattern(PATTERN_TYPES.TRIPLE, '3', [createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs')]);

      expect(canBeat(pair, triple, 2)).toBe(false);
    });
  });

  describe('getWinningPattern', () => {
    it('should return the highest pattern', () => {
      const patterns = [
        createPattern(PATTERN_TYPES.SINGLE, '5', [createCard('5')]),
        createPattern(PATTERN_TYPES.SINGLE, 'K', [createCard('K')]),
        createPattern(PATTERN_TYPES.SINGLE, '3', [createCard('3')])
      ];

      const winner = getWinningPattern(patterns, 2);
      expect(winner.mainRank).toBe('K');
    });

    it('should return null for empty array', () => {
      expect(getWinningPattern([], 2)).toBeNull();
      expect(getWinningPattern(null, 2)).toBeNull();
    });

    it('should handle bombs correctly', () => {
      const patterns = [
        createPattern(PATTERN_TYPES.PAIR, 'A', [createCard('A'), createCard('A', 'spades')]),
        createPattern(PATTERN_TYPES.BOMB_FOUR, '3', [
          createCard('3'), createCard('3', 'spades'), createCard('3', 'clubs'), createCard('3', 'diamonds')
        ])
      ];

      const winner = getWinningPattern(patterns, 2);
      expect(winner.type).toBe(PATTERN_TYPES.BOMB_FOUR);
    });
  });
});
