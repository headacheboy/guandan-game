import React, { useState } from 'react';
import Player from '../Player/Player';
import PlayedCards from '../PlayedCards/PlayedCards';
import Controls from '../Controls/Controls';
import { useOnlineStore } from '../../stores/onlineStore';
import { isPlayerTurn, GAME_PHASES } from '../../game/game.js';
import styles from './OnlineTable.module.css';

export default function OnlineTable() {
  const [selectedCards, setSelectedCards] = useState([]);
  const {
    socket,
    room,
    gameState,
    playCards,
    pass,
    nextRound
  } = useOnlineStore();

  if (!gameState) {
    return <div className={styles.loading}>加载中...</div>;
  }

  const {
    players,
    currentPlayer,
    lastPlay,
    lastPlayer,
    phase,
    message,
    teamLevels
  } = gameState;

  // 找到当前玩家的位置
  const myIndex = players.findIndex(p => p.id === socket?.id);
  const isMyTurn = currentPlayer === myIndex;
  const canPass = isMyTurn && lastPlay && lastPlayer !== myIndex;

  const positions = ['bottom', 'right', 'top', 'left'];
  // 根据我的位置调整显示
  const adjustedPositions = myIndex >= 0
    ? [positions[0], positions[(4 - myIndex + 1) % 4], positions[(4 - myIndex + 2) % 4], positions[(4 - myIndex + 3) % 4]]
    : positions;

  const playerPlays = [null, null, null, null];
  if (lastPlay && lastPlayer >= 0) {
    const displayPlayerIndex = myIndex >= 0 ? (lastPlayer - myIndex + 4) % 4 : lastPlayer;
    playerPlays[displayPlayerIndex] = lastPlay;
  }

  const handleCardClick = (card) => {
    if (!isMyTurn) return;
    const isSelected = selectedCards.find(c => c.id === card.id);
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePlay = () => {
    if (selectedCards.length > 0) {
      playCards(selectedCards);
      setSelectedCards([]);
    }
  };

  const handlePass = () => {
    pass();
    setSelectedCards([]);
  };

  const handleClear = () => {
    setSelectedCards([]);
  };

  const isRoundEnd = phase === GAME_PHASES.ROUND_END || phase === GAME_PHASES.GAME_END;
  const isGameOver = phase === GAME_PHASES.GAME_END;

  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <div className={styles.gameInfo}>
          <span className={styles.teamLevel}>A队: {teamLevels.A}级</span>
          <span className={styles.teamLevel}>B队: {teamLevels.B}级</span>
        </div>
        <div className={styles.gameMessage}>{message}</div>
        <div className={styles.roomInfo}>房间: {room?.id}</div>
      </div>

      <div className={styles.tableCenter}>
        <PlayedCards cards={lastPlay} playerName={lastPlayer >= 0 ? players[lastPlayer].name : null} />
      </div>

      {players.map((player, index) => {
        const displayIndex = myIndex >= 0 ? (index - myIndex + 4) % 4 : index;
        return (
          <Player
            key={player.id}
            player={player}
            position={adjustedPositions[displayIndex]}
            isCurrentPlayer={currentPlayer === index}
            showCards={index === myIndex}
            lastPlay={playerPlays[displayIndex]}
            selectedCards={index === myIndex ? selectedCards : []}
            onCardClick={index === myIndex ? handleCardClick : null}
          />
        );
      })}

      <div className={styles.tableFooter}>
        <Controls
          canPlay={isMyTurn && selectedCards.length > 0}
          canPass={canPass}
          onPlay={handlePlay}
          onPass={handlePass}
          onClear={handleClear}
          onHint={() => {}}
          gamePhase={phase}
          onStartGame={() => {}}
          onNextRound={nextRound}
          onReset={() => {}}
        />
      </div>

      {isRoundEnd && (
        <div className={styles.roundResult}>
          <h2>{isGameOver ? '游戏结束' : '本局结束'}</h2>
          <p>{message}</p>
          {!isGameOver && (
            <button onClick={nextRound}>下一局</button>
          )}
        </div>
      )}
    </div>
  );
}
