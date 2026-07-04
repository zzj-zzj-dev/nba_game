/**
 * game.js — 联机对战管理
 * WebSocket 房间匹配 + 实时回合同步
 */
const { v4: uuidv4 } = require('uuid');

// 活跃房间
const rooms = new Map();

function createRoom(ws, user) {
  const roomId = uuidv4().slice(0, 8);
  const room = {
    id: roomId,
    players: [{ ws, user, ready: false }],
    state: 'waiting', // waiting | playing | finished
    game: null
  };
  rooms.set(roomId, room);
  ws.send(JSON.stringify({ type: 'room_created', roomId }));
  return room;
}

function joinRoom(ws, user, roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
    return null;
  }
  if (room.players.length >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: '房间已满' }));
    return null;
  }
  
  room.players.push({ ws, user, ready: false });
  room.state = 'playing';
  
  // 通知两个玩家
  room.players.forEach(p => {
    p.ws.send(JSON.stringify({
      type: 'game_start',
      roomId,
      players: room.players.map(pp => ({ username: pp.user.username, id: pp.user.id })),
      playerIndex: room.players.indexOf(p)
    }));
  });
  
  return room;
}

function handlePlayerAction(ws, data) {
  // data: { roomId, action: {...} }
  const room = rooms.get(data.roomId);
  if (!room) return;
  
  // 把玩家的操作广播给对手
  const opponent = room.players.find(p => p.ws !== ws);
  if (opponent) {
    opponent.ws.send(JSON.stringify({
      type: 'opponent_action',
      action: data.action
    }));
  }
}

function handleDisconnect(ws) {
  for (const [roomId, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.ws === ws);
    if (idx === -1) continue;
    
    // 通知对手
    const opponent = room.players.find(p => p.ws !== ws);
    if (opponent) {
      opponent.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
    }
    
    rooms.delete(roomId);
    break;
  }
}

module.exports = { createRoom, joinRoom, handlePlayerAction, handleDisconnect };
