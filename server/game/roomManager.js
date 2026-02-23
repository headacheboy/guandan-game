import { createInitialGameState, startNewRound, playCards, pass, getNextRound } from '../shared/game.js';
import { getAIPlay } from '../shared/ai.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map();
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom(hostId, hostName) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      players: [
        { id: hostId, name: hostName, ready: false, position: 0 }
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
      position: room.players.length
    });
    
    this.playerRooms.set(playerId, roomId);
    
    return { room };
  }

  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { room: null };
    }
    
    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);
    
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room: null };
    }
    
    return { room };
  }

  setPlayerReady(roomId, playerId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { room: null, gameStarted: false };
    }
    
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
    }
    
    const allReady = room.players.length === 4 && room.players.every(p => p.ready);
    
    if (allReady) {
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
        isAI: false
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
    
    const result = this.leaveRoom(roomId, playerId);
    return { roomId, room: result.room };
  }
}
