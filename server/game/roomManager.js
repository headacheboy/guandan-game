import { createInitialGameState, startNewRound, playCards, pass, getNextRound } from '../../shared/game.js';
import { getAIPlay } from '../../shared/ai.js';

// 断线重连超时时间（毫秒）
const RECONNECT_TIMEOUT = 60000; // 60秒

export class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.disconnectedPlayers = new Map(); // 存储断线玩家信息
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom(hostId, hostName) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      players: [
        { id: hostId, name: hostName, ready: false, position: 0, connected: true }
      ],
      maxPlayers: 4,
      gameState: null,
      status: 'waiting'
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);

    return room;
  }

  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { error: '房间不存在' };
    }

    // 检查是否是断线重连
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (disconnectedInfo && disconnectedInfo.roomId === roomId) {
      return this.reconnectPlayer(roomId, playerId);
    }

    if (room.players.length >= room.maxPlayers) {
      return { error: '房间已满' };
    }

    if (room.status !== 'waiting') {
      return { error: '游戏已开始' };
    }

    room.players.push({
      id: playerId,
      name: playerName,
      ready: false,
      position: room.players.length,
      connected: true
    });

    this.playerRooms.set(playerId, roomId);

    return { room };
  }

  // 断线重连
  reconnectPlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);

    if (!room || !disconnectedInfo) {
      return { error: '重连失败' };
    }

    // 清除断线计时器
    if (disconnectedInfo.timeout) {
      clearTimeout(disconnectedInfo.timeout);
    }
    this.disconnectedPlayers.delete(playerId);

    // 更新玩家状态
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = true;
    }

    // 更新游戏状态中的玩家
    if (room.gameState) {
      const gamePlayer = room.gameState.players.find(p => p.id === playerId);
      if (gamePlayer) {
        gamePlayer.disconnected = false;
      }
    }

    this.playerRooms.set(playerId, roomId);

    return {
      room,
      gameState: room.gameState,
      reconnected: true,
      message: '重连成功'
    };
  }

  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { room: null };
    }

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);
    this.disconnectedPlayers.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room: null };
    }

    return { room };
  }

  setPlayerReady(roomId, playerId) {
    const room = this.rooms.get(roomId);

    if (!room) {
      console.log('setPlayerReady: room not found', roomId);
      return { room: null, gameStarted: false };
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
    }

    console.log('setPlayerReady: players status', room.players.map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      connected: p.connected
    })));

    const allReady = room.players.length === 4 && room.players.every(p => p.ready && p.connected);
    console.log('allReady check:', allReady, 'playerCount:', room.players.length);

    if (allReady) {
      console.log('All players ready, starting game...');
      return this.startGame(roomId);
    }

    return { room, gameStarted: false };
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);

    if (!room || room.players.length !== 4) {
      return { room, gameStarted: false };
    }

    const gameState = createInitialGameState();

    room.players.forEach((p, i) => {
      gameState.players[i] = {
        ...gameState.players[i],
        id: p.id,
        name: p.name,
        isAI: false,
        disconnected: !p.connected
      };
    });

    const newGameState = startNewRound(gameState);
    room.gameState = newGameState;
    room.status = 'playing';

    return { room, gameStarted: true, gameState: newGameState };
  }

  playCards(roomId, playerId, cards) {
    const room = this.rooms.get(roomId);

    if (!room || !room.gameState) {
      return { error: '游戏未开始' };
    }

    const playerIndex = room.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { error: '玩家不存在' };
    }

    const result = playCards(room.gameState, playerIndex, cards);
    room.gameState = result;

    return { gameState: result };
  }

  pass(roomId, playerId) {
    const room = this.rooms.get(roomId);

    if (!room || !room.gameState) {
      return { error: '游戏未开始' };
    }

    const playerIndex = room.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { error: '玩家不存在' };
    }

    const result = pass(room.gameState, playerIndex);
    room.gameState = result;

    return { gameState: result };
  }

  nextRound(roomId) {
    const room = this.rooms.get(roomId);

    if (!room || !room.gameState) {
      return { gameState: null };
    }

    const result = getNextRound(room.gameState);
    room.gameState = result;

    return { gameState: result };
  }

  getAvailableRooms() {
    const available = [];

    for (const [id, room] of this.rooms) {
      if (room.status === 'waiting' && room.players.length < room.maxPlayers) {
        available.push({
          id: room.id,
          players: room.players.length,
          maxPlayers: room.maxPlayers
        });
      }
    }

    return available;
  }

  handleDisconnect(playerId) {
    const roomId = this.playerRooms.get(playerId);

    if (!roomId) {
      return { roomId: null, room: null };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { roomId: null, room: null };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { roomId: null, room: null };
    }

    // 标记玩家为断线状态
    player.connected = false;

    // 如果游戏正在进行，保存玩家状态等待重连
    if (room.status === 'playing') {
      // 更新游戏状态中的玩家断线状态
      if (room.gameState) {
        const gamePlayer = room.gameState.players.find(p => p.id === playerId);
        if (gamePlayer) {
          gamePlayer.disconnected = true;
        }
      }

      // 设置重连超时
      const timeout = setTimeout(() => {
        this.removeDisconnectedPlayer(playerId);
      }, RECONNECT_TIMEOUT);

      this.disconnectedPlayers.set(playerId, {
        roomId,
        playerName: player.name,
        position: player.position,
        timeout
      });

      this.playerRooms.delete(playerId);

      return {
        roomId,
        room,
        gameState: room.gameState,
        disconnected: true,
        reconnectTimeout: RECONNECT_TIMEOUT
      };
    }

    // 游戏未开始时，直接移除玩家
    const result = this.leaveRoom(roomId, playerId);
    return { roomId, room: result.room };
  }

  // 移除断线超时的玩家
  removeDisconnectedPlayer(playerId) {
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (!disconnectedInfo) return;

    const room = this.rooms.get(disconnectedInfo.roomId);
    if (room) {
      // 从房间移除玩家
      room.players = room.players.filter(p => p.id !== playerId);

      // 如果游戏正在进行，可能需要结束游戏或让AI接管
      if (room.status === 'playing' && room.gameState) {
        // 通知其他玩家
        const gamePlayer = room.gameState.players.find(p => p.id === playerId);
        if (gamePlayer) {
          gamePlayer.left = true;
          gamePlayer.disconnected = true;
        }
      }

      // 如果房间空了，删除房间
      if (room.players.filter(p => p.connected).length === 0) {
        this.rooms.delete(disconnectedInfo.roomId);
      }
    }

    this.disconnectedPlayers.delete(playerId);
  }

  // 检查玩家是否可以重连
  canReconnect(playerId) {
    return this.disconnectedPlayers.has(playerId);
  }

  // 获取玩家断线信息
  getDisconnectedInfo(playerId) {
    return this.disconnectedPlayers.get(playerId);
  }
}
