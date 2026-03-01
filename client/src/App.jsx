import React, { useState, useEffect } from 'react';
import Table from './components/Table/Table';
import OnlineTable from './components/OnlineTable/OnlineTable';
import { GameModeSelect } from './components/GameModeSelect/GameModeSelect';
import { useOnlineStore } from './stores/onlineStore';

export default function App() {
  const [gameMode, setGameMode] = useState(null);
  const { gameState: onlineGameState } = useOnlineStore();

  // 在线游戏已开始
  if (onlineGameState) {
    return (
      <div className="app">
        <OnlineTable />
      </div>
    );
  }

  // 单机模式
  if (gameMode === 'ai') {
    return (
      <div className="app">
        <Table />
      </div>
    );
  }

  // 选择游戏模式（包括在线房间等待界面）
  return <GameModeSelect onSelectMode={setGameMode} />;
}
