/**
 * online.js — Firebase 双人联机对战
 * 使用 Firestore 实时监听实现房间匹配 + 回合同步
 */

import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

let currentRoomId = null;
let unsubscribe = null;
let isHost = false;

// ===================== 创建房间 =====================
async function createRoom(userId, username) {
  // 生成4位房间号
  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  currentRoomId = roomId;
  isHost = true;
  
  const roomData = {
    hostId: userId,
    hostName: username,
    guestId: '',
    guestName: '',
    status: 'waiting',
    hostReady: false,
    guestReady: false,
    round: 0,
    hostScore: 0,
    guestScore: 0,
    currentTurn: userId,
    lastAction: '',
    createdAt: new Date().toISOString()
  };
  
  await setDoc(doc(db, "rooms", roomId), roomData);
  
  return roomId;
}

// ===================== 加入房间 =====================
async function joinRoom(roomId, userId, username) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) {
    throw new Error('房间不存在');
  }
  
  const room = roomSnap.data();
  
  if (room.status !== 'waiting') {
    throw new Error('房间已开始或已结束');
  }
  
  if (room.hostId === userId) {
    throw new Error('不能加入自己的房间');
  }
  
  currentRoomId = roomId;
  isHost = false;
  
  await updateDoc(roomRef, {
    guestId: userId,
    guestName: username,
    status: 'playing'
  });
  
  return roomId;
}

// ===================== 监听房间变化 =====================
function listenRoom(roomId, callbacks) {
  // callbacks: { onPlayerJoin, onGameStart, onOpponentAction, onError }
  
  if (unsubscribe) unsubscribe();
  
  const roomRef = doc(db, "rooms", roomId);
  
  unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (callbacks.onError) callbacks.onError('房间已关闭');
      return;
    }
    
    const room = snapshot.data();
    
    if (room.status === 'playing' && room.guestId && callbacks.onPlayerJoin) {
      callbacks.onPlayerJoin(room);
    }
    
    if (room.lastAction && callbacks.onOpponentAction) {
      callbacks.onOpponentAction(room);
    }
  }, (error) => {
    if (callbacks.onError) callbacks.onError(error.message);
  });
}

// ===================== 同步操作 =====================
async function syncAction(userId, actionData) {
  if (!currentRoomId) return;
  
  const roomRef = doc(db, "rooms", currentRoomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;
  
  const room = roomSnap.data();
  const isHostPlayer = room.hostId === userId;
  
  await updateDoc(roomRef, {
    lastAction: JSON.stringify({
      player: isHostPlayer ? 'host' : 'guest',
      ...actionData
    }),
    lastActionAt: new Date().toISOString()
  });
}

// ===================== 关闭房间 =====================
async function closeRoom() {
  if (currentRoomId) {
    try {
      await deleteDoc(doc(db, "rooms", currentRoomId));
    } catch(e) {}
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  currentRoomId = null;
}

// ===================== 清理 =====================
function cleanup() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export { createRoom, joinRoom, listenRoom, syncAction, closeRoom, cleanup };
