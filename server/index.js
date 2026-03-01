import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/roomManager.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 检查是否是断线重连
  socket.on('checkReconnect', (data) => {
    const { previousId } = data;
    if (roomManager.canReconnect(previousId)) {
      const info = roomManager.getDisconnectedInfo(previousId);
      socket.emit('canReconnect', {
        canReconnect: true,
        roomId: info.roomId,
        playerName: info.playerName,
        timeRemaining: 60000 // 简化处理
      });
    } else {
      socket.emit('canReconnect', { canReconnect: false });
    }
  });

  socket.on('createRoom', (data) => {
    const room = roomManager.createRoom(socket.id, data.playerName);
    socket.join(room.id);
    socket.emit('roomCreated', room);
    console.log(`房间创建: ${room.id}`);
  });

  socket.on('joinRoom', (data) => {
    const result = roomManager.joinRoom(data.roomId, socket.id, data.playerName);
    if (result.error) {
      socket.emit('error', { message: result.error });
    } else {
      socket.join(data.roomId);

      if (result.reconnected) {
        // 断线重连成功
        socket.emit('reconnected', {
          room: result.room,
          gameState: result.gameState,
          message: result.message
        });
        io.to(data.roomId).emit('playerReconnected', {
          playerId: socket.id,
          room: result.room
        });
      } else {
        // 正常加入
        io.to(data.roomId).emit('roomUpdated', result.room);
        console.log(`用户加入房间: ${data.roomId}`);
      }
    }
  });

  socket.on('leaveRoom', (data) => {
    const result = roomManager.leaveRoom(data.roomId, socket.id);
    if (result.room) {
      io.to(data.roomId).emit('roomUpdated', result.room);
    }
    socket.leave(data.roomId);
  });

  socket.on('setReady', (data) => {
    console.log(`setReady from ${socket.id}, roomId: ${data.roomId}`);
    const result = roomManager.setPlayerReady(data.roomId, socket.id);
    console.log('setReady result:', {
      hasRoom: !!result.room,
      gameStarted: result.gameStarted,
      players: result.room?.players?.map(p => ({ id: p.id, name: p.name, ready: p.ready }))
    });
    if (result.room) {
      io.to(data.roomId).emit('roomUpdated', result.room);
    }
    if (result.gameStarted) {
      io.to(data.roomId).emit('gameStarted', result.gameState);
    }
  });

  socket.on('playCards', (data) => {
    const result = roomManager.playCards(data.roomId, socket.id, data.cards);
    if (result.error) {
      socket.emit('error', { message: result.error });
    } else {
      io.to(data.roomId).emit('gameState', result.gameState);
    }
  });

  socket.on('pass', (data) => {
    const result = roomManager.pass(data.roomId, socket.id);
    if (result.error) {
      socket.emit('error', { message: result.error });
    } else {
      io.to(data.roomId).emit('gameState', result.gameState);
    }
  });

  socket.on('nextRound', (data) => {
    const result = roomManager.nextRound(data.roomId);
    io.to(data.roomId).emit('gameState', result.gameState);
  });

  socket.on('getRooms', () => {
    const rooms = roomManager.getAvailableRooms();
    socket.emit('roomsList', rooms);
  });

  socket.on('disconnect', () => {
    console.log(`用户断开: ${socket.id}`);
    const result = roomManager.handleDisconnect(socket.id);
    if (result.roomId) {
      if (result.disconnected) {
        // 玩家在游戏中断线，通知其他玩家
        io.to(result.roomId).emit('playerDisconnected', {
          playerId: socket.id,
          room: result.room,
          gameState: result.gameState,
          reconnectTimeout: result.reconnectTimeout
        });
      } else {
        io.to(result.roomId).emit('roomUpdated', result.room);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: '掼蛋游戏服务器运行中' });
});

app.get('/rooms', (req, res) => {
  res.json(roomManager.getAvailableRooms());
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
