import React, { useState, useEffect } from 'react';
import {
  getLeaderboard,
  getPlayerStats,
  getPlayerRank,
  ACHIEVEMENTS
} from '../../game/leaderboard.js';
import styles from './Leaderboard.module.css';

export function Leaderboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [playerRank, setPlayerRank] = useState(null);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
    const stats = getPlayerStats();
    setPlayerStats(stats);
    if (stats.playerName) {
      setPlayerRank(getPlayerRank(stats.playerName));
    }
  }, []);

  const renderLeaderboard = () => (
    <div className={styles.leaderboardContent}>
      <div className={styles.tableHeader}>
        <span className={styles.rankCol}>排名</span>
        <span className={styles.nameCol}>玩家</span>
        <span className={styles.statCol}>胜率</span>
        <span className={styles.statCol}>胜/负</span>
        <span className={styles.statCol}>积分</span>
      </div>
      <div className={styles.tableBody}>
        {leaderboard.length === 0 ? (
          <div className={styles.emptyState}>
            暂无排行数据，开始游戏来上榜吧！
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.playerName}
              className={`${styles.tableRow} ${
                playerStats?.playerName === entry.playerName ? styles.highlightRow : ''
              }`}
            >
              <span className={styles.rankCol}>
                {index === 0 && <span className={styles.medal}>🥇</span>}
                {index === 1 && <span className={styles.medal}>🥈</span>}
                {index === 2 && <span className={styles.medal}>🥉</span>}
                {index > 2 && <span className={styles.rankNumber}>{index + 1}</span>}
              </span>
              <span className={styles.nameCol}>{entry.playerName}</span>
              <span className={styles.statCol}>
                <span className={styles.winRate}>{entry.winRate}%</span>
              </span>
              <span className={styles.statCol}>
                <span className={styles.wins}>{entry.wins}</span>
                <span className={styles.divider}>/</span>
                <span className={styles.losses}>{entry.losses}</span>
              </span>
              <span className={styles.statCol}>{entry.totalScore}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className={styles.statsContent}>
      {playerStats ? (
        <>
          <div className={styles.statsOverview}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{playerStats.totalGames}</div>
              <div className={styles.statLabel}>总场次</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{playerStats.wins}</div>
              <div className={styles.statLabel}>胜利</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {playerStats.totalGames > 0
                  ? Math.round((playerStats.wins / playerStats.totalGames) * 100)
                  : 0}%
              </div>
              <div className={styles.statLabel}>胜率</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{playerStats.totalScore}</div>
              <div className={styles.statLabel}>总积分</div>
            </div>
          </div>

          <div className={styles.statsDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>最高连胜</span>
              <span className={styles.detailValue}>{playerStats.maxStreak} 场</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>当前连胜</span>
              <span className={styles.detailValue}>{playerStats.currentStreak} 场</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>双下次数</span>
              <span className={styles.detailValue}>{playerStats.doubleDowns} 次</span>
            </div>
            {playerRank && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>当前排名</span>
                <span className={styles.detailValue}>第 {playerRank} 名</span>
              </div>
            )}
          </div>

          <div className={styles.achievementsSection}>
            <h3 className={styles.sectionTitle}>已获得成就</h3>
            <div className={styles.achievementsGrid}>
              {playerStats.achievements.length === 0 ? (
                <div className={styles.emptyState}>暂无成就，继续努力！</div>
              ) : (
                playerStats.achievements.map(achievementId => {
                  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
                  return achievement ? (
                    <div key={achievementId} className={styles.achievement}>
                      <span className={styles.achievementIcon}>{achievement.icon}</span>
                      <span className={styles.achievementName}>{achievement.name}</span>
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>暂无统计数据</div>
      )}
    </div>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {activeTab === 'leaderboard' ? '🏆 排行榜' : '📊 我的战绩'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            排行榜
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            我的战绩
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'leaderboard' ? renderLeaderboard() : renderStats()}
        </div>
      </div>
    </div>
  );
}
