import { describe, it, expect } from 'vitest';
import { identifyPattern, isBomb, PATTERN_TYPES } from './patterns.js';

// Helper to create card objects
const createCard = (rank, suit = 'hearts') => ({
  id: `${rank}-${suit}`,
  rank,
  suit,
  value: rank === 'littleJoker' ? 15 : rank === 'bigJoker' ? 16 : { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }[rank],
  isJoker: rank === 'littleJoker' || rank === 'bigJoker',
  jokerType: rank === 'littleJoker' ? 'little' : rank === 'bigJoker' ? 'big' : undefined,
  display: rank === 'littleJoker' ? '小王' : rank === 'bigJoker' ? '大王' : rank
});

describe('patterns.js', () => {
  describe('identifyPattern', () => {
    describe('Single (单牌)', () => {
      it('should identify a single card', () => {
        const cards = [createCard('A')];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.SINGLE);
        expect(pattern.mainRank).toBe('A');
      });

      it('should identify a single joker', () => {
        const cards = [createCard('bigJoker')];
        const pattern = identifyPattern(cards);
        expect(pattern.type).toBe(PATTERN_TYPES.SINGLE);
        expect(pattern.mainRank).toBe('bigJoker');
      });
    });

    describe('Pair (对子)', () => {
      it('should identify a pair', () => {
        const cards = [createCard('K', 'hearts'), createCard('K', 'spades')];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.PAIR);
        expect(pattern.mainRank).toBe('K');
      });

      it('should reject two cards of different ranks', () => {
        const cards = [createCard('A'), createCard('K')];
        const pattern = identifyPattern(cards);
        expect(pattern).toBeNull();
      });
    });

    describe('Triple (三张)', () => {
      it('should identify three of a kind', () => {
        const cards = [createCard('Q', 'hearts'), createCard('Q', 'spades'), createCard('Q', 'clubs')];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.TRIPLE);
        expect(pattern.mainRank).toBe('Q');
      });
    });

    describe('Triple with One (三带一)', () => {
      it('should identify triple with one', () => {
        const cards = [
          createCard('J', 'hearts'), createCard('J', 'spades'), createCard('J', 'clubs'),
          createCard('A', 'hearts')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.TRIPLE_WITH_ONE);
        expect(pattern.mainRank).toBe('J');
      });
    });

    describe('Triple with Pair (三带二)', () => {
      it('should identify triple with pair', () => {
        const cards = [
          createCard('10', 'hearts'), createCard('10', 'spades'), createCard('10', 'clubs'),
          createCard('K', 'hearts'), createCard('K', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.TRIPLE_WITH_PAIR);
        expect(pattern.mainRank).toBe('10');
      });
    });

    describe('Straight (顺子)', () => {
      it('should identify a 5-card straight', () => {
        // Use mixed suits to avoid being identified as straight flush
        const cards = [
          createCard('3', 'hearts'), createCard('4', 'spades'), createCard('5', 'hearts'),
          createCard('6', 'spades'), createCard('7', 'hearts')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT);
        expect(pattern.mainRank).toBe('7');
      });

      it('should identify a 10-J-Q-K-A straight', () => {
        // Use mixed suits to avoid being identified as straight flush
        const cards = [
          createCard('10', 'hearts'), createCard('J', 'spades'), createCard('Q', 'hearts'),
          createCard('K', 'spades'), createCard('A', 'hearts')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT);
        expect(pattern.mainRank).toBe('A');
      });

      it('should identify a longer straight (6+ cards)', () => {
        // Use mixed suits to avoid being identified as straight flush
        const cards = [
          createCard('3', 'hearts'), createCard('4', 'spades'), createCard('5', 'hearts'),
          createCard('6', 'spades'), createCard('7', 'hearts'), createCard('8', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT);
        expect(pattern.mainRank).toBe('8');
      });

      it('should reject straight with 2', () => {
        const cards = [
          createCard('2'), createCard('3'), createCard('4'), createCard('5'), createCard('6')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).toBeNull();
      });

      it('should reject non-consecutive cards', () => {
        const cards = [
          createCard('3'), createCard('5'), createCard('6'), createCard('7'), createCard('8')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).toBeNull();
      });
    });

    describe('Straight Pairs (连对)', () => {
      it('should identify three consecutive pairs', () => {
        const cards = [
          createCard('3', 'hearts'), createCard('3', 'spades'),
          createCard('4', 'hearts'), createCard('4', 'spades'),
          createCard('5', 'hearts'), createCard('5', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT_PAIRS);
        expect(pattern.mainRank).toBe('5');
        expect(pattern.length).toBe(3);
      });

      it('should identify four consecutive pairs', () => {
        const cards = [
          createCard('6', 'hearts'), createCard('6', 'spades'),
          createCard('7', 'hearts'), createCard('7', 'spades'),
          createCard('8', 'hearts'), createCard('8', 'spades'),
          createCard('9', 'hearts'), createCard('9', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT_PAIRS);
        expect(pattern.length).toBe(4);
      });
    });

    describe('Plane (飞机)', () => {
      it('should identify two consecutive triples (plane)', () => {
        const cards = [
          createCard('3', 'hearts'), createCard('3', 'spades'), createCard('3', 'clubs'),
          createCard('4', 'hearts'), createCard('4', 'spades'), createCard('4', 'clubs')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.PLANE);
        expect(pattern.mainRank).toBe('4');
        expect(pattern.length).toBe(2);
      });

      it('should identify three consecutive triples', () => {
        const cards = [
          createCard('5', 'hearts'), createCard('5', 'spades'), createCard('5', 'clubs'),
          createCard('6', 'hearts'), createCard('6', 'spades'), createCard('6', 'clubs'),
          createCard('7', 'hearts'), createCard('7', 'spades'), createCard('7', 'clubs')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.PLANE);
        expect(pattern.length).toBe(3);
      });
    });

    describe('Plane with Wings (飞机带翅膀)', () => {
      it('should identify plane with single wings', () => {
        const cards = [
          createCard('3', 'hearts'), createCard('3', 'spades'), createCard('3', 'clubs'),
          createCard('4', 'hearts'), createCard('4', 'spades'), createCard('4', 'clubs'),
          createCard('A', 'hearts'), createCard('K', 'hearts')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.PLANE_WITH_WINGS);
        expect(pattern.length).toBe(2);
      });

      it('should identify plane with pair wings', () => {
        const cards = [
          createCard('3', 'hearts'), createCard('3', 'spades'), createCard('3', 'clubs'),
          createCard('4', 'hearts'), createCard('4', 'spades'), createCard('4', 'clubs'),
          createCard('A', 'hearts'), createCard('A', 'spades'),
          createCard('K', 'hearts'), createCard('K', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.PLANE_WITH_WINGS);
        expect(pattern.length).toBe(2);
      });
    });

    describe('Four-card Bomb (四张炸弹)', () => {
      it('should identify a four-card bomb', () => {
        const cards = [
          createCard('9', 'hearts'), createCard('9', 'spades'),
          createCard('9', 'clubs'), createCard('9', 'diamonds')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.BOMB_FOUR);
        expect(pattern.mainRank).toBe('9');
      });
    });

    describe('Five-card Bomb (五张炸弹)', () => {
      it('should identify a five-card bomb', () => {
        const cards = [
          createCard('9', 'hearts'), createCard('9', 'spades'),
          createCard('9', 'clubs'), createCard('9', 'diamonds'),
          createCard('9', 'hearts') // Note: In real game, this would be from second deck
        ];
        // Adjust ids to make them unique
        cards[4].id = '9-hearts-2';
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.BOMB_FIVE);
        expect(pattern.mainRank).toBe('9');
      });
    });

    describe('Six-card Bomb (六张炸弹)', () => {
      it('should identify a six-card bomb', () => {
        const cards = [
          createCard('8', 'hearts'), createCard('8', 'spades'),
          createCard('8', 'clubs'), createCard('8', 'diamonds'),
          createCard('8', 'hearts'), createCard('8', 'spades')
        ];
        // Make ids unique
        cards[4].id = '8-hearts-2';
        cards[5].id = '8-spades-2';
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.BOMB_SIX);
        expect(pattern.mainRank).toBe('8');
      });
    });

    describe('Straight Flush (同花顺)', () => {
      it('should identify a straight flush', () => {
        const cards = [
          createCard('5', 'spades'), createCard('6', 'spades'),
          createCard('7', 'spades'), createCard('8', 'spades'),
          createCard('9', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT_FLUSH);
        expect(pattern.mainRank).toBe('9');
        expect(pattern.suit).toBe('spades');
      });

      it('should reject straight with mixed suits', () => {
        const cards = [
          createCard('5', 'spades'), createCard('6', 'hearts'),
          createCard('7', 'spades'), createCard('8', 'spades'),
          createCard('9', 'spades')
        ];
        const pattern = identifyPattern(cards);
        expect(pattern.type).toBe(PATTERN_TYPES.STRAIGHT);
        expect(pattern.type).not.toBe(PATTERN_TYPES.STRAIGHT_FLUSH);
      });
    });

    describe('Four Kings (四大天王)', () => {
      it('should identify four jokers', () => {
        const cards = [
          createCard('littleJoker'), createCard('littleJoker'),
          createCard('bigJoker'), createCard('bigJoker')
        ];
        // Make ids unique
        cards[1].id = 'littleJoker-2';
        cards[3].id = 'bigJoker-2';
        const pattern = identifyPattern(cards);
        expect(pattern).not.toBeNull();
        expect(pattern.type).toBe(PATTERN_TYPES.FOUR_KINGS);
      });
    });

    describe('Invalid patterns', () => {
      it('should return null for empty cards', () => {
        const pattern = identifyPattern([]);
        expect(pattern).toBeNull();
      });

      it('should return null for null input', () => {
        const pattern = identifyPattern(null);
        expect(pattern).toBeNull();
      });

      it('should return null for invalid combinations', () => {
        const cards = [createCard('A'), createCard('K'), createCard('Q')];
        const pattern = identifyPattern(cards);
        expect(pattern).toBeNull();
      });
    });
  });

  describe('isBomb', () => {
    it('should return true for four-card bomb', () => {
      const pattern = { type: PATTERN_TYPES.BOMB_FOUR };
      expect(isBomb(pattern)).toBe(true);
    });

    it('should return true for five-card bomb', () => {
      const pattern = { type: PATTERN_TYPES.BOMB_FIVE };
      expect(isBomb(pattern)).toBe(true);
    });

    it('should return true for six-card bomb', () => {
      const pattern = { type: PATTERN_TYPES.BOMB_SIX };
      expect(isBomb(pattern)).toBe(true);
    });

    it('should return true for straight flush', () => {
      const pattern = { type: PATTERN_TYPES.STRAIGHT_FLUSH };
      expect(isBomb(pattern)).toBe(true);
    });

    it('should return true for four kings', () => {
      const pattern = { type: PATTERN_TYPES.FOUR_KINGS };
      expect(isBomb(pattern)).toBe(true);
    });

    it('should return false for non-bomb patterns', () => {
      expect(isBomb({ type: PATTERN_TYPES.SINGLE })).toBe(false);
      expect(isBomb({ type: PATTERN_TYPES.PAIR })).toBe(false);
      expect(isBomb({ type: PATTERN_TYPES.TRIPLE })).toBe(false);
      expect(isBomb({ type: PATTERN_TYPES.STRAIGHT })).toBe(false);
    });

    it('should return false for null pattern', () => {
      expect(isBomb(null)).toBe(false);
    });
  });
});
