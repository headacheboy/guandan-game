import { describe, it, expect } from 'vitest';
import { calculateScore, createGameStats, updateGameStats, getScoreMessage } from './score.js';

describe('score.js', () => {
  describe('calculateScore', () => {
    it('should award 3 points for double down (1st and 2nd)', () => {
      // Team A: players 0 and 2
      // finishOrder: [0, 2, 1, 3] means team A got 1st and 2nd
      const result = calculateScore([0, 2, 1, 3], { A: 2, B: 2 }, { A: 5, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.score.A).toBe(3);
      expect(result.score.B).toBe(0);
    });

    it('should award 2 points for 1st and 3rd', () => {
      // finishOrder: [0, 1, 2, 3] means team A got 1st and 3rd
      const result = calculateScore([0, 1, 2, 3], { A: 2, B: 2 }, { A: 4, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.score.A).toBe(2);
    });

    it('should award 1 point for 1st and 4th', () => {
      // finishOrder: [0, 1, 3, 2] means team A got 1st and 4th
      const result = calculateScore([0, 1, 3, 2], { A: 2, B: 2 }, { A: 3, B: 2 });
      expect(result.winner).toBe('A');
      expect(result.score.A).toBe(1);
    });

    it('should calculate correctly for team B winning', () => {
      // finishOrder: [1, 0, 2, 3] means team B (player 1) got 1st
      const result = calculateScore([1, 0, 2, 3], { A: 2, B: 2 }, { A: 2, B: 3 });
      expect(result.winner).toBe('B');
      expect(result.score.B).toBeGreaterThan(0);
    });

    it('should include level information in result', () => {
      const result = calculateScore([0, 2, 1, 3], { A: 2, B: 2 }, { A: 5, B: 2 });
      expect(result.teamLevelsBefore).toEqual({ A: 2, B: 2 });
      expect(result.teamLevelsAfter).toEqual({ A: 5, B: 2 });
    });

    it('should handle team B double down', () => {
      // finishOrder: [1, 3, 0, 2] means team B got 1st and 2nd
      const result = calculateScore([1, 3, 0, 2], { A: 2, B: 2 }, { A: 2, B: 5 });
      expect(result.winner).toBe('B');
      expect(result.score.B).toBe(3);
    });
  });

  describe('createGameStats', () => {
    it('should create initial stats with zeros', () => {
      const stats = createGameStats();
      expect(stats.totalRounds).toBe(0);
      expect(stats.teamAWins).toBe(0);
      expect(stats.teamBWins).toBe(0);
      expect(stats.teamAScore).toBe(0);
      expect(stats.teamBScore).toBe(0);
    });

    it('should initialize streak tracking', () => {
      const stats = createGameStats();
      expect(stats.currentStreak.team).toBeNull();
      expect(stats.currentStreak.count).toBe(0);
      expect(stats.maxStreak.team).toBeNull();
      expect(stats.maxStreak.count).toBe(0);
    });

    it('should initialize empty round results', () => {
      const stats = createGameStats();
      expect(stats.roundResults).toEqual([]);
    });
  });

  describe('updateGameStats', () => {
    it('should increment total rounds', () => {
      const stats = createGameStats();
      const roundResult = { winner: 'A', score: { A: 2, B: 0 } };
      const newStats = updateGameStats(stats, roundResult);
      expect(newStats.totalRounds).toBe(1);
    });

    it('should track team A wins', () => {
      const stats = createGameStats();
      const roundResult = { winner: 'A', score: { A: 2, B: 0 } };
      const newStats = updateGameStats(stats, roundResult);
      expect(newStats.teamAWins).toBe(1);
      expect(newStats.teamBWins).toBe(0);
    });

    it('should track team B wins', () => {
      const stats = createGameStats();
      const roundResult = { winner: 'B', score: { A: 0, B: 2 } };
      const newStats = updateGameStats(stats, roundResult);
      expect(newStats.teamBWins).toBe(1);
      expect(newStats.teamAWins).toBe(0);
    });

    it('should accumulate scores', () => {
      let stats = createGameStats();
      stats = updateGameStats(stats, { winner: 'A', score: { A: 2, B: 0 } });
      stats = updateGameStats(stats, { winner: 'A', score: { A: 3, B: 0 } });
      expect(stats.teamAScore).toBe(5);
    });

    it('should track current streak', () => {
      let stats = createGameStats();
      stats = updateGameStats(stats, { winner: 'A', score: { A: 2, B: 0 } });
      expect(stats.currentStreak.team).toBe('A');
      expect(stats.currentStreak.count).toBe(1);

      stats = updateGameStats(stats, { winner: 'A', score: { A: 1, B: 0 } });
      expect(stats.currentStreak.team).toBe('A');
      expect(stats.currentStreak.count).toBe(2);
    });

    it('should reset streak when other team wins', () => {
      let stats = createGameStats();
      stats = updateGameStats(stats, { winner: 'A', score: { A: 2, B: 0 } });
      stats = updateGameStats(stats, { winner: 'A', score: { A: 1, B: 0 } });
      stats = updateGameStats(stats, { winner: 'B', score: { A: 0, B: 2 } });

      expect(stats.currentStreak.team).toBe('B');
      expect(stats.currentStreak.count).toBe(1);
    });

    it('should track max streak', () => {
      let stats = createGameStats();
      stats = updateGameStats(stats, { winner: 'A', score: { A: 2, B: 0 } });
      stats = updateGameStats(stats, { winner: 'A', score: { A: 1, B: 0 } });
      stats = updateGameStats(stats, { winner: 'A', score: { A: 1, B: 0 } });
      stats = updateGameStats(stats, { winner: 'B', score: { A: 0, B: 2 } });

      expect(stats.maxStreak.team).toBe('A');
      expect(stats.maxStreak.count).toBe(3);
    });

    it('should record round results', () => {
      let stats = createGameStats();
      stats = updateGameStats(stats, { winner: 'A', score: { A: 2, B: 0 } });
      stats = updateGameStats(stats, { winner: 'B', score: { A: 0, B: 3 } });

      expect(stats.roundResults.length).toBe(2);
      expect(stats.roundResults[0].round).toBe(1);
      expect(stats.roundResults[0].winner).toBe('A');
      expect(stats.roundResults[1].round).toBe(2);
      expect(stats.roundResults[1].winner).toBe('B');
    });

    it('should not modify original stats', () => {
      const stats = createGameStats();
      const roundResult = { winner: 'A', score: { A: 2, B: 0 } };
      updateGameStats(stats, roundResult);
      expect(stats.totalRounds).toBe(0);
    });
  });

  describe('getScoreMessage', () => {
    it('should return correct message for 3 levels (double down)', () => {
      const message = getScoreMessage(3, 'A', 3);
      expect(message).toContain('双下');
      expect(message).toContain('升3级');
      expect(message).toContain('3分');
    });

    it('should return correct message for 2 levels', () => {
      const message = getScoreMessage(2, 'A', 2);
      expect(message).toContain('升2级');
      expect(message).toContain('2分');
    });

    it('should return correct message for 1 level', () => {
      const message = getScoreMessage(1, 'A', 1);
      expect(message).toContain('升1级');
      expect(message).toContain('1分');
    });

    it('should use correct team name for team A', () => {
      const message = getScoreMessage(2, 'A', 2);
      expect(message).toContain('玩家队');
    });

    it('should use correct team name for team B', () => {
      const message = getScoreMessage(2, 'B', 2);
      expect(message).toContain('AI队');
    });
  });
});
