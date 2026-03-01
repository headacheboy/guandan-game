import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

// 保存之前的 socket id 用于断线重连
const getPreviousSocketId = () => {
  try {
    return sessionStorage.getItem('lastSocketId');
  } catch {
    return null;
  }
};

const setPreviousSocketId = (id) => {
  try {
    sessionStorage.setItem('lastSocketId', id);
  } catch {
    // ignore
  }
};

const clearPreviousSocketId = () => {
  try {
    sessionStorage.removeItem('lastSocketId');
  } catch {
    // ignore
  }
};

export const useOnlineStore = create((set, get) => ({
  socket: null,
  connected: false,
  playerName: '',
  roomId: null,
  room: null,
  gameState: null,
  error: null,
  isReconnecting: false,
  reconnectInfo: null,

  // 连接到服务器
  connect: () => {
    // 如果已经连接，不重复创建
    const { socket: existingSocket, connected } = get();
    if (existingSocket && connected) {
      console.log('已经连接，跳过');
      return existingSocket;
    }

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const previousId = getPreviousSocketId();

    socket.on('connect', () => {
      console.log('已连接到服务器');
      setPreviousSocketId(socket.id);
      set({ connected: true, socket, error: null });

      // 检查是否可以断线重连
      if (previousId && previousId !== socket.id) {
        socket.emit('checkReconnect', { previousId });
      }
    });

    socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      set({ connected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      set({ error: '无法连接到服务器' });
    });

    // 断线重连检查结果
    socket.on('canReconnect', (data) => {
      if (data.canReconnect) {
        set({
          reconnectInfo: {
            roomId: data.roomId,
            playerName: data.playerName,
            previousId,
            timeRemaining: data.timeRemaining
          }
        });
      }
    });

    // 断线重连成功
    socket.on('reconnected', (data) => {
      console.log('断线重连成功');
      set({
        room: data.room,
        gameState: data.gameState,
        isReconnecting: false,
        reconnectInfo: null,
        error: null
      });
      setPreviousSocketId(socket.id);
    });

    // 有玩家断线
    socket.on('playerDisconnected', (data) => {
      console.log('玩家断线:', data.playerId);
      set({
        room: data.room,
        gameState: data.gameState,
        error: `玩家断线，等待重连... (${data.reconnectTimeout / 1000}秒)`
      });
    });

    // 有玩家重连
    socket.on('playerReconnected', (data) => {
      console.log('玩家重连:', data.playerId);
      set({
        room: data.room,
        error: null
      });
    });

    // 房间创建成功
    socket.on('roomCreated', (room) => {
      set({ room, roomId: room.id, error: null });
    });

    // 房间更新
    socket.on('roomUpdated', (room) => {
      set({ room, roomId: room?.id || null, error: null });
    });

    // 游戏开始
    socket.on('gameStarted', (gameState) => {
      set({ gameState, error: null });
    });

    // 游戏状态更新
    socket.on('gameState', (gameState) => {
      set({ gameState, error: null });
    });

    // 错误处理
    socket.on('error', (data) => {
      set({ error: data.message });
    });

    // 房间列表
    socket.on('roomsList', (rooms) => {
      set({ availableRooms: rooms });
    });

    return socket;
  },

  // 断开连接
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      clearPreviousSocketId();
      set({
        socket: null,
        connected: false,
        room: null,
        roomId: null,
        gameState: null
      });
    }
  },

  // 设置玩家名称
  setPlayerName: (name) => {
    set({ playerName: name });
    try {
      sessionStorage.setItem('playerName', name);
    } catch {
      // ignore
    }
  },

  // 创建房间
  createRoom: (playerName) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('createRoom', { playerName });
    }
  },

  // 加入房间
  joinRoom: (roomId, playerName) => {
    const { socket } = get();
    console.log('joinRoom called:', { roomId, playerName, socketId: socket?.id });
    if (socket && socket.connected) {
      set({ roomId }); // 设置 roomId
      socket.emit('joinRoom', { roomId, playerName });
    } else {
      console.error('Cannot join room: socket not connected');
    }
  },

  // 尝试断线重连
  attemptReconnect: () => {
    const { socket, reconnectInfo } = get();
    if (socket && reconnectInfo) {
      set({ isReconnecting: true });
      socket.emit('joinRoom', {
        roomId: reconnectInfo.roomId,
        playerName: reconnectInfo.playerName
      });
    }
  },

  // 取消断线重连
  cancelReconnect: () => {
    set({ reconnectInfo: null });
    clearPreviousSocketId();
  },

  // 离开房间
  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
      set({ room: null, roomId: null, gameState: null });
    }
  },

  // 设置准备状态
  setReady: () => {
    const { socket, roomId } = get();
    console.log('setReady called, roomId:', roomId, 'socket:', socket?.id);
    if (socket && roomId) {
      socket.emit('setReady', { roomId });
    } else {
      console.error('Cannot set ready: socket or roomId missing');
    }
  },

  // 出牌
  playCards: (cards) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('playCards', { roomId, cards });
    }
  },

  // 过
  pass: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('pass', { roomId });
    }
  },

  // 下一局
  nextRound: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('nextRound', { roomId });
    }
  },

  // 获取房间列表
  getRooms: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('getRooms');
    }
  },

  // 清除错误
  clearError: () => set({ error: null })
}));

// 初始化时恢复玩家名称
try {
  const savedName = sessionStorage.getItem('playerName');
  if (savedName) {
    useOnlineStore.setState({ playerName: savedName });
  }
} catch {
  // ignore
}
