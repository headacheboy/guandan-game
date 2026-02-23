export function calculateScore(finishOrder, teamLevelsBefore, teamLevelsAfter) {
  const teamA = [0, 2];
  const teamB = [1, 3];
  
  const teamAFinishes = finishOrder
    .map((playerIdx, pos) => ({ playerIdx, pos }))
    .filter(p => teamA.includes(p.playerIdx));
  const teamBFinishes = finishOrder
    .map((playerIdx, pos) => ({ playerIdx, pos }))
    .filter(p => teamB.includes(p.playerIdx));
  
  const teamABestPos = teamAFinishes.length > 0 ? Math.min(...teamAFinishes.map(p => p.pos)) : 4;
  const teamBBestPos = teamBFinishes.length > 0 ? Math.min(...teamBFinishes.map(p => p.pos)) : 4;
  
  const winner = teamABestPos < teamBBestPos ? 'A' : 'B';
  
  let score = { A: 0, B: 0 };
  
  if (winner === 'A' && teamAFinishes.length === 2) {
    const secondPos = teamAFinishes[1].pos;
    if (secondPos === 1) score.A = 3;
    else if (secondPos === 2) score.A = 2;
    else score.A = 1;
  } else if (winner === 'B' && teamBFinishes.length === 2) {
    const secondPos = teamBFinishes[1].pos;
    if (secondPos === 1) score.B = 3;
    else if (secondPos === 2) score.B = 2;
    else score.B = 1;
  }
  
  return {
    winner,
    score,
    teamLevelsBefore,
    teamLevelsAfter
  };
}

export function createGameStats() {
  return {
    totalRounds: 0,
    teamAWins: 0,
    teamBWins: 0,
    teamAScore: 0,
    teamBScore: 0,
    currentStreak: { team: null, count: 0 },
    maxStreak: { team: null, count: 0 },
    roundResults: []
  };
}

export function updateGameStats(stats, roundResult) {
  const newStats = { ...stats };
  newStats.totalRounds++;
  
  if (roundResult.winner === 'A') {
    newStats.teamAWins++;
    newStats.teamAScore += roundResult.score.A;
    if (newStats.currentStreak.team === 'A') {
      newStats.currentStreak.count++;
    } else {
      newStats.currentStreak = { team: 'A', count: 1 };
    }
  } else {
    newStats.teamBWins++;
    newStats.teamBScore += roundResult.score.B;
    if (newStats.currentStreak.team === 'B') {
      newStats.currentStreak.count++;
    } else {
      newStats.currentStreak = { team: 'B', count: 1 };
    }
  }
  
  if (newStats.currentStreak.count > newStats.maxStreak.count) {
    newStats.maxStreak = { ...newStats.currentStreak };
  }
  
  newStats.roundResults.push({
    round: newStats.totalRounds,
    ...roundResult
  });
  
  return newStats;
}

export function getScoreMessage(score, winner, levelsUp) {
  const teamName = winner === 'A' ? '玩家队' : 'AI队';
  if (levelsUp === 3) {
    return `${teamName}双下！升3级，获得${score}分`;
  } else if (levelsUp === 2) {
    return `${teamName}获胜！升2级，获得${score}分`;
  } else {
    return `${teamName}获胜！升1级，获得${score}分`;
  }
}
