import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '../game/roomManager.js';

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a room with a host player', () => {
      const room = roomManager.createRoom('player1', 'Alice');

      expect(room).toBeDefined();
      expect(room.id).toMatch(/^[A-Z0-9]{6}$/);
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toEqual({
        id: 'player1',
        name: 'Alice',
        ready: false,
        position: 0,
        connected: true
      });
      expect(room.maxPlayers).toBe(4);
      expect(room.status).toBe('waiting');
      expect(room.gameState).toBeNull();
    });

    it('should track player-room mapping', () => {
      roomManager.createRoom('player1', 'Alice');
      expect(roomManager.playerRooms.get('player1')).toBeDefined();
    });
  });

  describe('joinRoom', () => {
    it('should allow player to join an existing room', () => {
      const room = roomManager.createRoom('player1', 'Alice');
      const result = roomManager.joinRoom(room.id, 'player2', 'Bob');

      expect(result.error).toBeUndefined();
      expect(result.room.players).toHaveLength(2);
      expect(result.room.players[1]).toEqual({
        id: 'player2',
        name: 'Bob',
        ready: false,
        position: 1,
        connected: true
      });
    });

    it('should return error for non-existent room', () => {
      const result = roomManager.joinRoom('INVALID', 'player1', 'Alice');
      expect(result.error).toBe('房间不存在');
    });

    it('should return error when room is full', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      roomManager.joinRoom(room.id, 'p3', 'C');
      roomManager.joinRoom(room.id, 'p4', 'D');
      const result = roomManager.joinRoom(room.id, 'p5', 'E');

      expect(result.error).toBe('房间已满');
    });

    it('should return error when game has started', () => {
      const room = roomManager.createRoom('p1', 'A');
      room.status = 'playing';
      const result = roomManager.joinRoom(room.id, 'p2', 'B');

      expect(result.error).toBe('游戏已开始');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      const result = roomManager.leaveRoom(room.id, 'p2');

      expect(result.room.players).toHaveLength(1);
      expect(roomManager.playerRooms.has('p2')).toBe(false);
    });

    it('should delete room when all players leave', () => {
      const room = roomManager.createRoom('p1', 'A');
      const result = roomManager.leaveRoom(room.id, 'p1');

      expect(result.room).toBeNull();
      expect(roomManager.rooms.has(room.id)).toBe(false);
    });

    it('should return null for non-existent room', () => {
      const result = roomManager.leaveRoom('INVALID', 'p1');
      expect(result.room).toBeNull();
    });
  });

  describe('setPlayerReady', () => {
    it('should toggle player ready status', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.setPlayerReady(room.id, 'p1');

      expect(roomManager.rooms.get(room.id).players[0].ready).toBe(true);
    });

    it('should return null for non-existent room', () => {
      const result = roomManager.setPlayerReady('INVALID', 'p1');
      expect(result.room).toBeNull();
    });
  });

  describe('startGame', () => {
    it('should start game when 4 players are ready', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      roomManager.joinRoom(room.id, 'p3', 'C');
      roomManager.joinRoom(room.id, 'p4', 'D');

      // Set all players ready
      roomManager.setPlayerReady(room.id, 'p1');
      roomManager.setPlayerReady(room.id, 'p2');
      roomManager.setPlayerReady(room.id, 'p3');
      const result = roomManager.setPlayerReady(room.id, 'p4');

      expect(result.gameStarted).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(roomManager.rooms.get(room.id).status).toBe('playing');
    });

    it('should not start game with less than 4 players', () => {
      const room = roomManager.createRoom('p1', 'A');
      const result = roomManager.startGame(room.id);

      expect(result.gameStarted).toBe(false);
    });
  });

  describe('getAvailableRooms', () => {
    it('should return only waiting rooms with space', () => {
      const room1 = roomManager.createRoom('p1', 'A');
      const room2 = roomManager.createRoom('p2', 'B');
      roomManager.joinRoom(room2.id, 'p3', 'C');
      roomManager.joinRoom(room2.id, 'p4', 'D');
      roomManager.joinRoom(room2.id, 'p5', 'E');
      roomManager.joinRoom(room2.id, 'p6', 'F');
      // room2 is now full

      // room3 is playing
      const room3 = roomManager.createRoom('p7', 'G');
      roomManager.rooms.get(room3.id).status = 'playing';

      const available = roomManager.getAvailableRooms();

      expect(available).toHaveLength(1);
      expect(available[0].id).toBe(room1.id);
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect during waiting phase', () => {
      const room = roomManager.createRoom('p1', 'A');
      const result = roomManager.handleDisconnect('p1');

      expect(result.roomId).toBe(room.id);
      expect(roomManager.rooms.has(room.id)).toBe(false);
    });

    it('should mark player as disconnected during game', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      roomManager.joinRoom(room.id, 'p3', 'C');
      roomManager.joinRoom(room.id, 'p4', 'D');

      // Set all ready and start game
      roomManager.setPlayerReady(room.id, 'p1');
      roomManager.setPlayerReady(room.id, 'p2');
      roomManager.setPlayerReady(room.id, 'p3');
      roomManager.setPlayerReady(room.id, 'p4');

      // Now disconnect a player
      const result = roomManager.handleDisconnect('p1');

      expect(result.disconnected).toBe(true);
      expect(result.reconnectTimeout).toBe(60000);

      const updatedRoom = roomManager.rooms.get(room.id);
      const player = updatedRoom.players.find(p => p.id === 'p1');
      expect(player.connected).toBe(false);
    });

    it('should return null for unknown player', () => {
      const result = roomManager.handleDisconnect('unknown');
      expect(result.roomId).toBeNull();
    });
  });

  describe('reconnectPlayer', () => {
    it('should allow player to reconnect', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      roomManager.joinRoom(room.id, 'p3', 'C');
      roomManager.joinRoom(room.id, 'p4', 'D');

      // Start game
      roomManager.setPlayerReady(room.id, 'p1');
      roomManager.setPlayerReady(room.id, 'p2');
      roomManager.setPlayerReady(room.id, 'p3');
      roomManager.setPlayerReady(room.id, 'p4');

      // Disconnect
      roomManager.handleDisconnect('p1');

      // Reconnect
      const result = roomManager.joinRoom(room.id, 'p1', 'A');

      expect(result.reconnected).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room.players.find(p => p.id === 'p1').connected).toBe(true);
    });
  });

  describe('canReconnect', () => {
    it('should return true for disconnected player', () => {
      const room = roomManager.createRoom('p1', 'A');
      roomManager.joinRoom(room.id, 'p2', 'B');
      roomManager.joinRoom(room.id, 'p3', 'C');
      roomManager.joinRoom(room.id, 'p4', 'D');

      roomManager.setPlayerReady(room.id, 'p1');
      roomManager.setPlayerReady(room.id, 'p2');
      roomManager.setPlayerReady(room.id, 'p3');
      roomManager.setPlayerReady(room.id, 'p4');

      roomManager.handleDisconnect('p1');

      expect(roomManager.canReconnect('p1')).toBe(true);
    });

    it('should return false for unknown player', () => {
      expect(roomManager.canReconnect('unknown')).toBe(false);
    });
  });
});
