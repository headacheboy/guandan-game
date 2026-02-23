import React from 'react';
import Player from '../Player/Player';
import PlayedCards from '../PlayedCards/PlayedCards';
import Controls from '../Controls/Controls';
import History from '../History/History';
import RoundResult from '../RoundResult/RoundResult';
import AIHint from '../AIHint/AIHint';
import { useGameStore } from '../../stores/gameStore';
import { isPlayerTurn, GAME_PHASES } from '../../game/game.js';
import './Table.css';

export default function Table() {
  const { 
    gameState, 
    selectedCards, 
    selectCard, 
    playSelectedCards, 
    playerPass, 
    clearSelection,
    startGame,
    nextRound,
    resetGame,
    showHistory,
    toggleHistory,
    closeHistory,
    aiHint,
    requestAIHint,
    clearAIHint,
    applyHint
  } = useGameStore();

  const { 
    players, 
    currentPlayer, 
    lastPlay, 
    lastPlayer, 
    phase, 
    message, 
    teamLevels, 
    playHistory,
    gameStats,
    lastRoundResult
  } = gameState;

  const positions = ['bottom', 'right', 'top', 'left'];
  const playerPlays = [null, null, null, null];
  if (lastPlay && lastPlayer >= 0) {
    playerPlays[lastPlayer] = lastPlay;
  }

  const isMyTurn = isPlayerTurn(gameState, 0);
  const canPass = isMyTurn && lastPlay && lastPlayer !== 0;
  
  const isRoundEnd = phase === GAME_PHASES.ROUND_END || phase === GAME_PHASES.GAME_END;
  const isGameOver = phase === GAME_PHASES.GAME_END;

  const handleCardClick = (card) => {
    if (isMyTurn) {
      selectCard(card);
    }
  };

  const handleApplyHint = (cards) => {
    applyHint(cards);
  };

  return (
    <div className="table">
      <div className="table-header">
        <div className="game-info">
          <span className="team-level">A队: {teamLevels.A}级</span>
          <span className="team-level">B队: {teamLevels.B}级</span>
          <span className="game-stats-info">
            {gameStats.totalRounds}局 | {gameStats.teamAWins}:{gameStats.teamBWins}
          </span>
        </div>
        <div className="game-message">{message}</div>
        <button className="history-btn" onClick={toggleHistory} title="查看历史记录">
          📋
        </button>
      </div>

      <div className="table-center">
        <PlayedCards cards={lastPlay} playerName={lastPlayer >= 0 ? players[lastPlayer].name : null} />
      </div>

      {players.map((player, index) => (
        <Player
          key={player.id}
          player={player}
          position={positions[index]}
          isCurrentPlayer={currentPlayer === index}
          showCards={index === 0}
          lastPlay={playerPlays[index]}
          selectedCards={selectedCards}
          onCardClick={index === 0 ? handleCardClick : null}
        />
      ))}

      <div className="table-footer">
        <Controls
          canPlay={isMyTurn && selectedCards.length > 0}
          canPass={canPass}
          onPlay={playSelectedCards}
          onPass={playerPass}
          onClear={clearSelection}
          onHint={requestAIHint}
          gamePhase={phase}
          onStartGame={startGame}
          onNextRound={nextRound}
          onReset={resetGame}
        />
      </div>

      {showHistory && (
        <History 
          playHistory={playHistory} 
          players={players}
          onClose={closeHistory} 
        />
      )}

      {isRoundEnd && lastRoundResult && (
        <RoundResult
          lastRoundResult={lastRoundResult}
          gameStats={gameStats}
          teamLevels={teamLevels}
          onNextRound={nextRound}
          onReset={resetGame}
          isGameOver={isGameOver}
        />
      )}

      {aiHint && (
        <AIHint
          hint={aiHint}
          onApply={handleApplyHint}
          onClose={clearAIHint}
        />
      )}
    </div>
  );
}
