import React from 'react';
import './Controls.css';

export default function Controls({ 
  canPlay, 
  canPass, 
  onPlay, 
  onPass, 
  onClear,
  onHint,
  gamePhase,
  onStartGame,
  onNextRound,
  onReset
}) {
  if (gamePhase === 'waiting') {
    return (
      <div className="controls">
        <button className="btn btn-primary btn-lg" onClick={onStartGame}>
          开始游戏
        </button>
      </div>
    );
  }

  if (gamePhase === 'roundEnd') {
    return (
      <div className="controls">
        <button className="btn btn-primary" onClick={onNextRound}>
          下一局
        </button>
        <button className="btn btn-secondary" onClick={onReset}>
          重新开始
        </button>
      </div>
    );
  }

  if (gamePhase === 'gameEnd') {
    return (
      <div className="controls">
        <button className="btn btn-primary" onClick={onReset}>
          新游戏
        </button>
      </div>
    );
  }

  return (
    <div className="controls">
      <button 
        className="btn btn-primary" 
        onClick={onPlay}
        disabled={!canPlay}
      >
        出牌
      </button>
      <button 
        className="btn btn-secondary" 
        onClick={onPass}
        disabled={!canPass}
      >
        不出
      </button>
      <button 
        className="btn btn-outline" 
        onClick={onClear}
      >
        清空
      </button>
      <button 
        className="btn btn-hint" 
        onClick={onHint}
      >
        提示
      </button>
    </div>
  );
}
