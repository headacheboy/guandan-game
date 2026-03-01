const LEADERBOARD_KEY = 'guandan_leaderboard';
const STATS_KEY = 'guandan_player_stats';

// 获取排行榜数据
export function getLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 保存排行榜数据
export function saveLeaderboard(leaderboard) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch {
    // ignore
  }
}

// 获取玩家统计
export function getPlayerStats() {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : createDefaultStats();
  } catch {
    return createDefaultStats();
  }
}

// 保存玩家统计
export function savePlayerStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

// 创建默认统计
function createDefaultStats() {
  return {
    playerName: '',
    totalGames: 0,
    wins: 0,
    losses: 0,
    totalScore: 0,
    highestLevel: 2,
    currentStreak: 0,
    maxStreak: 0,
    doubleDowns: 0, // 双下次数
    bombsPlayed: 0, // 打出的炸弹数
    achievements: []
  };
}

// 更新玩家统计
export function updatePlayerStats(gameResult) {
  const stats = getPlayerStats();

  stats.totalGames++;

  if (gameResult.winner === 'A') { // 玩家队伍（A队）获胜
    stats.wins++;
    stats.currentStreak++;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
  } else {
    stats.losses++;
    stats.currentStreak = 0;
  }

  stats.totalScore += gameResult.score.A || 0;

  if (gameResult.levelsUp === 3) {
    stats.doubleDowns++;
  }

  // 更新排行榜
  updateLeaderboard(stats);

  savePlayerStats(stats);
  return stats;
}

// 更新排行榜
function updateLeaderboard(stats) {
  if (!stats.playerName) return;

  let leaderboard = getLeaderboard();

  // 查找现有记录
  const existingIndex = leaderboard.findIndex(
    entry => entry.playerName === stats.playerName
  );

  const entry = {
    playerName: stats.playerName,
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0,
    totalScore: stats.totalScore,
    maxStreak: stats.maxStreak,
    lastUpdated: Date.now()
  };

  if (existingIndex >= 0) {
    leaderboard[existingIndex] = entry;
  } else {
    leaderboard.push(entry);
  }

  // 按胜率排序，胜率相同按总局数排序
  leaderboard.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames;
    return b.totalScore - a.totalScore;
  });

  // 只保留前100名
  leaderboard = leaderboard.slice(0, 100);

  saveLeaderboard(leaderboard);
}

// 设置玩家名称
export function setPlayerName(name) {
  const stats = getPlayerStats();
  stats.playerName = name;
  savePlayerStats(stats);
}

// 获取玩家排名
export function getPlayerRank(playerName) {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(entry => entry.playerName === playerName);
  return index >= 0 ? index + 1 : null;
}

// 重置统计
export function resetStats() {
  savePlayerStats(createDefaultStats());
}

// 成就系统
export const ACHIEVEMENTS = [
  { id: 'first_win', name: '初出茅庐', desc: '赢得第一场游戏', icon: '🎉' },
  { id: 'win_10', name: '小试牛刀', desc: '累计获胜10场', icon: '⚔️' },
  { id: 'win_50', name: '身经百战', desc: '累计获胜50场', icon: '🏅' },
  { id: 'win_100', name: '掼蛋大师', desc: '累计获胜100场', icon: '👑' },
  { id: 'streak_3', name: '连胜达人', desc: '达成3连胜', icon: '🔥' },
  { id: 'streak_5', name: '势不可挡', desc: '达成5连胜', icon: '💪' },
  { id: 'streak_10', name: '天下无敌', desc: '达成10连胜', icon: '🌟' },
  { id: 'double_down', name: '双杀', desc: '完成一次双下', icon: '💥' },
  { id: 'double_down_10', name: '双杀专家', desc: '累计完成10次双下', icon: '🎊' },
  { id: 'games_100', name: '老玩家', desc: '累计游戏100场', icon: '🎮' }
];

// 检查成就
export function checkAchievements(stats) {
  const newAchievements = [];

  if (stats.wins >= 1 && !stats.achievements.includes('first_win')) {
    newAchievements.push('first_win');
  }
  if (stats.wins >= 10 && !stats.achievements.includes('win_10')) {
    newAchievements.push('win_10');
  }
  if (stats.wins >= 50 && !stats.achievements.includes('win_50')) {
    newAchievements.push('win_50');
  }
  if (stats.wins >= 100 && !stats.achievements.includes('win_100')) {
    newAchievements.push('win_100');
  }
  if (stats.maxStreak >= 3 && !stats.achievements.includes('streak_3')) {
    newAchievements.push('streak_3');
  }
  if (stats.maxStreak >= 5 && !stats.achievements.includes('streak_5')) {
    newAchievements.push('streak_5');
  }
  if (stats.maxStreak >= 10 && !stats.achievements.includes('streak_10')) {
    newAchievements.push('streak_10');
  }
  if (stats.doubleDowns >= 1 && !stats.achievements.includes('double_down')) {
    newAchievements.push('double_down');
  }
  if (stats.doubleDowns >= 10 && !stats.achievements.includes('double_down_10')) {
    newAchievements.push('double_down_10');
  }
  if (stats.totalGames >= 100 && !stats.achievements.includes('games_100')) {
    newAchievements.push('games_100');
  }

  return newAchievements;
}

// 添加成就
export function addAchievement(achievementId) {
  const stats = getPlayerStats();
  if (!stats.achievements.includes(achievementId)) {
    stats.achievements.push(achievementId);
    savePlayerStats(stats);
  }
  return stats;
}
