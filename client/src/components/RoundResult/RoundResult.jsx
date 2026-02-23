import React from 'react';
import './RoundResult.css';

export default function RoundResult({ 
  lastRoundResult, 
  gameStats, 
  teamLevels,
  onNextRound,
  onReset,
  isGameOver 
}) {
  if (!lastRoundResult) return null;
  
  const { winner, levelsUp, score, finishOrder } = lastRoundResult;
  const winnerName = winner === 'A' ? '玩家队' : 'AI队';
  const winnerScore = winner === 'A' ? score.A : score.B;
  
  const getResultType = () => {
    if (levelsUp === 3) return 'double-down';
    if (levelsUp === 2) return 'good-win';
    return 'normal-win';
  };
  
  const getResultTitle = () => {
    if (levelsUp === 3) return '双下！';
    if (levelsUp === 2) return '大胜！';
    return '获胜！';
  };

  return (
    <div className="round-result-overlay">
      <div className={`round-result-modal ${getResultType()}`}>
        <div className="result-header">
          <h2>{getResultTitle()}</h2>
          <div className="result-winner">{winnerName}</div>
        </div>
        
        <div className="result-body">
          <div className="result-main">
            <div className="result-item">
              <span className="label">升级</span>
              <span className="value">+{levelsUp}级</span>
            </div>
            <div className="result-item">
              <span className="label">得分</span>
              <span className="value">+{winnerScore}分</span>
            </div>
          </div>
          
          <div className="result-levels">
            <div className="team-level">
              <span className="team-name">玩家队</span>
              <span className="level-value">{teamLevels.A}级</span>
            </div>
            <div className="vs">VS</div>
            <div className="team-level">
              <span className="team-name">AI队</span>
              <span className="level-value">{teamLevels.B}级</span>
            </div>
          </div>
          
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">总局数</span>
              <span className="stat-value">{gameStats.totalRounds}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">比分</span>
              <span className="stat-value">{gameStats.teamAWins} : {gameStats.teamBWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">连胜</span>
              <span className="stat-value">{gameStats.currentStreak.count}局</span>
            </div>
          </div>
        </div>
        
        <div className="result-footer">
          {isGameOver ? (
            <>
              <div className="game-over-text">
                🎉 恭喜{winnerName}获得最终胜利！🎉
              </div>
              <button className="btn btn-primary" onClick={onReset}>
                再来一局
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onNextRound}>
              下一局
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
