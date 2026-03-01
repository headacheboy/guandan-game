import React, { useState, useEffect } from 'react';
import { useOnlineStore } from '../../stores/onlineStore';
import styles from './GameModeSelect.module.css';

export function GameModeSelect({ onSelectMode }) {
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const {
    connect,
    connected,
    room,
    socket,
    gameState,
    createRoom,
    joinRoom,
    setPlayerName: setOnlinePlayerName,
    setReady,
    error
  } = useOnlineStore();

  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, []);

  // 当游戏状态更新时，切换到在线模式
  useEffect(() => {
    if (gameState && showJoinRoom) {
      onSelectMode('online');
    }
  }, [gameState, showJoinRoom, onSelectMode]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    setOnlinePlayerName(playerName);
    createRoom(playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    if (!roomIdInput.trim()) {
      alert('请输入房间号');
      return;
    }
    setOnlinePlayerName(playerName);
    joinRoom(roomIdInput.toUpperCase(), playerName);
  };

  // 已在房间中
  if (room) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h2 className={styles.title}>房间: {room.id}</h2>
          <div className={styles.playerList}>
            <h3>玩家列表 ({room.players.length}/4)</h3>
            {room.players.map((player, index) => (
              <div key={player.id} className={styles.playerItem}>
                <span className={styles.playerPos}>位置 {index + 1}</span>
                <span className={styles.playerName}>{player.name}</span>
                {player.ready && <span className={styles.readyBadge}>准备</span>}
              </div>
            ))}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            {room.players.find(p => p.id === socket?.id)?.ready ? (
              <span className={styles.waiting}>等待其他玩家...</span>
            ) : (
              <button className={styles.readyBtn} onClick={setReady}>
                准备
              </button>
            )}
          </div>
          <p className={styles.hint}>分享房间号 <strong>{room.id}</strong> 给好友加入</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🃏 掼蛋游戏</h2>

        <div className={styles.modeButtons}>
          <button
            className={styles.modeBtn}
            onClick={() => onSelectMode('ai')}
          >
            <span className={styles.modeIcon}>🤖</span>
            <span className={styles.modeName}>单机对战</span>
            <span className={styles.modeDesc}>与AI对战</span>
          </button>

          <button
            className={styles.modeBtn}
            onClick={() => {
              setShowJoinRoom(true);
              onSelectMode('online'); // 立即设置为在线模式
            }}
            disabled={!connected}
          >
            <span className={styles.modeIcon}>🌐</span>
            <span className={styles.modeName}>在线对战</span>
            <span className={styles.modeDesc}>
              {connected ? '多人联机' : '连接中...'}
            </span>
          </button>
        </div>

        {showJoinRoom && (
          <div className={styles.onlineForm}>
            <input
              type="text"
              placeholder="输入玩家名称"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={10}
            />
            <div className={styles.roomActions}>
              <button className={styles.createBtn} onClick={handleCreateRoom}>
                创建房间
              </button>
              <div className={styles.joinForm}>
                <input
                  type="text"
                  placeholder="房间号"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button className={styles.joinBtn} onClick={handleJoinRoom}>
                  加入
                </button>
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
