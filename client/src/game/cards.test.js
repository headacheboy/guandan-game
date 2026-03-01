import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  sortCards,
  removeCards,
  groupCardsByRank,
  groupCardsBySuit,
  isTrumpCard,
  getCardValue,
  SUITS,
  RANKS,
  RANK_VALUES
} from './cards.js';

describe('cards.js', () => {
  describe('createDeck', () => {
    it('should create a deck with 108 cards (2 copies of 54 cards)', () => {
      const deck = createDeck();
      expect(deck.length).toBe(108);
    });

    it('should contain 4 jokers (2 big, 2 little)', () => {
      const deck = createDeck();
      const bigJokers = deck.filter(c => c.rank === 'bigJoker');
      const littleJokers = deck.filter(c => c.rank === 'littleJoker');
      expect(bigJokers.length).toBe(2);
      expect(littleJokers.length).toBe(2);
    });

    it('should contain 8 cards of each rank (2 copies × 4 suits)', () => {
      const deck = createDeck();
      for (const rank of RANKS) {
        const cardsOfRank = deck.filter(c => c.rank === rank);
        expect(cardsOfRank.length).toBe(8);
      }
    });

    it('should assign unique ids to each card', () => {
      const deck = createDeck();
      const ids = deck.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(108);
    });

    it('should mark joker cards correctly', () => {
      const deck = createDeck();
      const jokers = deck.filter(c => c.isJoker);
      expect(jokers.length).toBe(4);
      jokers.forEach(j => {
        expect(j.suit).toBe('joker');
      });
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with the same length', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled.length).toBe(108);
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const originalFirst = deck[0];
      shuffleDeck(deck);
      expect(deck[0]).toBe(originalFirst);
    });

    it('should contain all the same cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck([...deck]);
      const originalIds = new Set(deck.map(c => c.id));
      const shuffledIds = new Set(shuffled.map(c => c.id));
      expect(originalIds).toEqual(shuffledIds);
    });
  });

  describe('dealCards', () => {
    it('should deal cards to 4 players by default', () => {
      const deck = createDeck();
      const hands = dealCards(deck);
      expect(hands.length).toBe(4);
    });

    it('should deal 27 cards to each player', () => {
      const deck = createDeck();
      const hands = dealCards(deck);
      hands.forEach(hand => {
        expect(hand.length).toBe(27);
      });
    });

    it('should deal all cards from the deck', () => {
      const deck = createDeck();
      const hands = dealCards(deck);
      const totalDealt = hands.reduce((sum, hand) => sum + hand.length, 0);
      expect(totalDealt).toBe(108);
    });

    it('should sort hands by default', () => {
      const deck = createDeck();
      const hands = dealCards(deck);
      hands.forEach(hand => {
        for (let i = 0; i < hand.length - 1; i++) {
          const curr = hand[i];
          const next = hand[i + 1];
          // Cards should be sorted: regular cards first, then level cards, then jokers
          if (!curr.isJoker && !next.isJoker) {
            if (curr.rank !== '2' && next.rank !== '2') {
              // Non-level cards should be in rank order
              const currIdx = RANK_VALUES[curr.rank] || 0;
              const nextIdx = RANK_VALUES[next.rank] || 0;
              expect(currIdx).toBeLessThanOrEqual(nextIdx);
            }
          }
        }
      });
    });
  });

  describe('sortCards', () => {
    it('should sort cards with jokers at the end', () => {
      const cards = [
        { id: '1', suit: 'hearts', rank: 'A', value: 14, isJoker: false },
        { id: '2', suit: 'joker', rank: 'littleJoker', value: 15, isJoker: true, jokerType: 'little' },
        { id: '3', suit: 'hearts', rank: '3', value: 3, isJoker: false }
      ];
      const sorted = sortCards(cards);
      expect(sorted[0].rank).toBe('3');
      expect(sorted[1].rank).toBe('A');
      expect(sorted[2].rank).toBe('littleJoker');
    });

    it('should place level cards after A but before jokers', () => {
      const cards = [
        { id: '1', suit: 'hearts', rank: 'A', value: 14, isJoker: false },
        { id: '2', suit: 'hearts', rank: '3', value: 3, isJoker: false },
        { id: '3', suit: 'spades', rank: '3', value: 3, isJoker: false }
      ];
      const sorted = sortCards(cards, 3); // Level 3
      expect(sorted[0].rank).toBe('A');
      expect(sorted[1].rank).toBe('3');
      expect(sorted[2].rank).toBe('3');
    });

    it('should sort big joker after little joker', () => {
      const cards = [
        { id: '1', suit: 'joker', rank: 'bigJoker', value: 16, isJoker: true, jokerType: 'big' },
        { id: '2', suit: 'joker', rank: 'littleJoker', value: 15, isJoker: true, jokerType: 'little' }
      ];
      const sorted = sortCards(cards);
      expect(sorted[0].rank).toBe('littleJoker');
      expect(sorted[1].rank).toBe('bigJoker');
    });
  });

  describe('removeCards', () => {
    it('should remove specified cards from hand', () => {
      const hand = [
        { id: '1', rank: 'A' },
        { id: '2', rank: 'K' },
        { id: '3', rank: 'Q' }
      ];
      const toRemove = [{ id: '2', rank: 'K' }];
      const result = removeCards(hand, toRemove);
      expect(result.length).toBe(2);
      expect(result.find(c => c.id === '2')).toBeUndefined();
    });

    it('should not modify the original hand', () => {
      const hand = [
        { id: '1', rank: 'A' },
        { id: '2', rank: 'K' }
      ];
      const toRemove = [{ id: '1', rank: 'A' }];
      removeCards(hand, toRemove);
      expect(hand.length).toBe(2);
    });

    it('should handle empty removal list', () => {
      const hand = [
        { id: '1', rank: 'A' },
        { id: '2', rank: 'K' }
      ];
      const result = removeCards(hand, []);
      expect(result.length).toBe(2);
    });
  });

  describe('groupCardsByRank', () => {
    it('should group cards by rank', () => {
      const cards = [
        { id: '1', rank: 'A', suit: 'hearts' },
        { id: '2', rank: 'A', suit: 'spades' },
        { id: '3', rank: 'K', suit: 'hearts' }
      ];
      const groups = groupCardsByRank(cards);
      expect(groups['A'].length).toBe(2);
      expect(groups['K'].length).toBe(1);
    });

    it('should handle empty cards array', () => {
      const groups = groupCardsByRank([]);
      expect(Object.keys(groups).length).toBe(0);
    });
  });

  describe('groupCardsBySuit', () => {
    it('should group cards by suit', () => {
      const cards = [
        { id: '1', rank: 'A', suit: 'hearts' },
        { id: '2', rank: 'K', suit: 'hearts' },
        { id: '3', rank: 'Q', suit: 'spades' }
      ];
      const groups = groupCardsBySuit(cards);
      expect(groups['hearts'].length).toBe(2);
      expect(groups['spades'].length).toBe(1);
    });
  });

  describe('isTrumpCard', () => {
    it('should identify jokers as trump cards', () => {
      const joker = { isJoker: true, rank: 'bigJoker' };
      expect(isTrumpCard(joker, 2, null)).toBe(true);
    });

    it('should identify level cards as trump cards', () => {
      const levelCard = { isJoker: false, rank: '5' };
      expect(isTrumpCard(levelCard, 5, null)).toBe(true);
      expect(isTrumpCard(levelCard, 2, null)).toBe(false);
    });
  });

  describe('getCardValue', () => {
    it('should return joker value for jokers', () => {
      const bigJoker = { isJoker: true, rank: 'bigJoker', value: 16 };
      expect(getCardValue(bigJoker, 2, null)).toBe(16);
    });

    it('should return higher value for heart level cards', () => {
      const heartLevel = { isJoker: false, rank: '5', suit: 'hearts', value: 5 };
      const spadeLevel = { isJoker: false, rank: '5', suit: 'spades', value: 5 };
      expect(getCardValue(heartLevel, 5, null)).toBe(14.5);
      expect(getCardValue(spadeLevel, 5, null)).toBe(14.2);
    });
  });
});
