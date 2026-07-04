/**
 * auth-ui.js — Firebase 登录状态UI + Firestore 存档 + 双人联机
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7YvTSDGpid7nPFaICOjWHGWKFRZTXYew",
  authDomain: "nba-card-game.firebaseapp.com",
  projectId: "nba-card-game",
  storageBucket: "nba-card-game.firebasestorage.app",
  messagingSenderId: "614710872766",
  appId: "1:614710872766:web:a86d11643c5679f8c0ecef",
  measurementId: "G-32PFCZSVVP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentRoomId = null;
let roomUnsubscribe = null;
let isHostPlayer = false;

// ===================== 初始化 =====================
function initAuthUI() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      showUserInfo(user);
    } else {
      showLoginPrompt();
    }
  });
}

function showUserInfo(user) {
  const header = document.querySelector('#game-header');
  if (!header) return;
  
  const oldBar = document.getElementById('user-bar');
  if (oldBar) oldBar.remove();
  
  const name = user.email?.split('@')[0] || '用户';
  
  const bar = document.createElement('div');
  bar.id = 'user-bar';
  bar.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; margin-bottom: 8px;
    background: rgba(255,215,0,0.08); border-radius: 6px;
    font-size: 0.8em;
  `;
  
  bar.innerHTML = `
    <span>👤 ${name}</span>
    <span>
      <button class="btn" style="background:#2a5a6a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-save-game">💾 存档</button>
      <button class="btn" style="background:#5a3a7a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-load-game">📂 读档</button>
      <button class="btn" style="background:#5a2a3a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-logout">🚪 退出</button>
    </span>
  `;
  
  header.insertBefore(bar, header.firstChild);
  
  document.getElementById('btn-save-game').addEventListener('click', saveGame);
  document.getElementById('btn-load-game').addEventListener('click', loadGame);
  document.getElementById('btn-logout').addEventListener('click', logout);
}

function showLoginPrompt() {
  const header = document.querySelector('#game-header');
  if (!header) return;
  
  const oldBar = document.getElementById('user-bar');
  if (oldBar) oldBar.remove();
  
  const bar = document.createElement('div');
  bar.id = 'user-bar';
  bar.style.cssText = `
    display: flex; justify-content: center; align-items: center;
    padding: 6px 10px; margin-bottom: 8px;
    background: rgba(255,255,255,0.04); border-radius: 6px;
    font-size: 0.8em;
  `;
  
  bar.innerHTML = `
    <span style="color:#888;">未登录</span>
    <a href="login.html" style="color:#ffd700;margin-left:10px;text-decoration:none;">🔑 登录</a>
  `;
  
  header.insertBefore(bar, header.firstChild);
}

// ===================== 存档/读档 =====================
async function saveGame() {
  if (!currentUser || !battleManager) return;
  
  const gameData = {
    homePlayers: battleManager.homePlayers.map(p => ({
      playerName: p.playerName, position: p.position, teamName: p.teamName,
      attrs: p.attrs, badges: p.badges,
      currentStamina: p.currentStamina, foulCount: p.foulCount,
      isOnCourt: p.isOnCourt, isStarter: p.isStarter,
      consecutiveRounds: p.consecutiveRounds, totalPointsScored: p.totalPointsScored,
      totalAssists: p.totalAssists, totalRebounds: p.totalRebounds
    })),
    awayPlayers: battleManager.awayPlayers.map(p => ({
      playerName: p.playerName, position: p.position, teamName: p.teamName,
      attrs: p.attrs, badges: p.badges,
      currentStamina: p.currentStamina, foulCount: p.foulCount,
      isOnCourt: p.isOnCourt, isStarter: p.isStarter,
      consecutiveRounds: p.consecutiveRounds, totalPointsScored: p.totalPointsScored,
      totalAssists: p.totalAssists, totalRebounds: p.totalRebounds
    })),
    homeScore: battleManager.homeScore,
    awayScore: battleManager.awayScore,
    currentRound: battleManager.currentRound,
    possession: battleManager.possession,
    homeTimeouts: battleManager.homeTimeouts,
    awayTimeouts: battleManager.awayTimeouts,
    homeSubstitutions: battleManager.homeSubstitutions,
    awaySubstitutions: battleManager.awaySubstitutions,
    gameOver: battleManager.gameOver,
    gameWinner: battleManager.gameWinner
  };
  
  try {
    await setDoc(doc(db, "saves", currentUser.uid), {
      gameData,
      updatedAt: new Date().toISOString()
    });
    updateStatusBar('💾 存档成功！');
    addLog('💾 游戏已保存到云端');
  } catch (e) {
    updateStatusBar('⚠️ 存档失败: ' + e.message);
  }
}

async function loadGame() {
  if (!currentUser || !battleManager) return;
  
  try {
    const docSnap = await getDoc(doc(db, "saves", currentUser.uid));
    
    if (!docSnap.exists()) {
      updateStatusBar('⚠️ 没有找到存档');
      return;
    }
    
    const gd = docSnap.data().gameData;
    
    battleManager.homePlayers.forEach((p, i) => {
      if (gd.homePlayers[i]) Object.assign(p, gd.homePlayers[i]);
    });
    battleManager.awayPlayers.forEach((p, i) => {
      if (gd.awayPlayers[i]) Object.assign(p, gd.awayPlayers[i]);
    });
    
    battleManager.homeScore = gd.homeScore || 0;
    battleManager.awayScore = gd.awayScore || 0;
    battleManager.currentRound = gd.currentRound || 0;
    battleManager.possession = gd.possession || Constants.Possession.HOME;
    battleManager.homeTimeouts = gd.homeTimeouts ?? 2;
    battleManager.awayTimeouts = gd.awayTimeouts ?? 2;
    battleManager.homeSubstitutions = gd.homeSubstitutions ?? 3;
    battleManager.awaySubstitutions = gd.awaySubstitutions ?? 3;
    battleManager.gameOver = gd.gameOver || false;
    battleManager.gameWinner = gd.gameWinner || null;
    
    battleManager._calcSynergies(battleManager.homePlayers, 'home');
    battleManager._calcSynergies(battleManager.awayPlayers, 'away');
    
    renderAll();
    updateScoreboard();
    updateGameInfo();
    updateTimeoutsDisplay();
    updateSubstitutionsDisplay();
    resetActionState();
    
    updateStatusBar('📂 读档成功！');
    addLog('📂 已读取云端存档');
  } catch (e) {
    updateStatusBar('⚠️ 读档失败: ' + e.message);
  }
}

function logout() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
}

// ===================== 联机对战 =====================

function showOnlineMenu() {
  if (!currentUser) {
    updateStatusBar('⚠️ 请先登录才能联机');
    return;
  }
  
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  modalTitle.textContent = '🎮 联机对战';
  modalBody.innerHTML = `
    <div style="margin:10px 0;">
      <button id="btn-online-create" class="btn btn-primary" style="width:100%;margin-bottom:8px;padding:12px;font-size:1.1em;">
        🏠 创建房间
      </button>
    </div>
    <div style="margin:15px 0;text-align:center;color:#888;">— 或 —</div>
    <div style="margin:10px 0;">
      <input type="text" id="input-room-id" placeholder="输入4位房间号加入" 
        style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid #4a4a7a;border-radius:6px;color:#fff;text-align:center;font-size:1em;letter-spacing:4px;">
      <button id="btn-online-join" class="btn btn-secondary" style="width:100%;margin-top:8px;padding:10px;">
        🔗 加入房间
      </button>
    </div>
    <div id="online-status" style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:0.85em;color:#888;">
      🟢 已登录，可以联机
    </div>
  `;
  
  confirmBtn.textContent = '关闭';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');
  
  setTimeout(() => {
    const createBtn = document.getElementById('btn-online-create');
    const joinBtn = document.getElementById('btn-online-join');
    const roomInput = document.getElementById('input-room-id');
    
    if (createBtn) {
      createBtn.onclick = () => handleCreateRoom();
    }
    
    if (joinBtn && roomInput) {
      joinBtn.onclick = () => {
        const roomId = roomInput.value.trim().toUpperCase();
        if (roomId) handleJoinRoom(roomId);
      };
      roomInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const roomId = roomInput.value.trim().toUpperCase();
          if (roomId) handleJoinRoom(roomId);
        }
      };
    }
  }, 100);
  
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

async function handleCreateRoom() {
  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const username = currentUser.email?.split('@')[0] || '玩家';
  
  try {
    await setDoc(doc(db, "rooms", roomId), {
      hostId: currentUser.uid,
      hostName: username,
      guestId: '',
      guestName: '',
      status: 'waiting',
      lastAction: '',
      lastActionBy: '',
      hostReady: false,
      guestReady: false,
      createdAt: new Date().toISOString()
    });
    
    currentRoomId = roomId;
    isHostPlayer = true;
    hideModal();
    updateStatusBar('🔗 房间已创建: ' + roomId);
    addLog('🔗 房间 ' + roomId + ' 已创建，等待对手加入...');
    
    listenRoom(roomId);
  } catch(e) {
    updateStatusBar('⚠️ 创建房间失败: ' + e.message);
  }
}

async function handleJoinRoom(roomId) {
  const username = currentUser.email?.split('@')[0] || '玩家';
  
  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      updateStatusBar('⚠️ 房间不存在');
      return;
    }
    
    const room = roomSnap.data();
    if (room.status !== 'waiting') {
      updateStatusBar('⚠️ 房间已开始或已结束');
      return;
    }
    
    if (room.hostId === currentUser.uid) {
      updateStatusBar('⚠️ 不能加入自己的房间');
      return;
    }
    
    await updateDoc(roomRef, {
      guestId: currentUser.uid,
      guestName: username,
      status: 'playing'
    });
    
    currentRoomId = roomId;
    isHostPlayer = false;
    hideModal();
    updateStatusBar('🎮 已加入房间 ' + roomId + '，对局开始！');
    addLog('🎮 已加入房间 ' + roomId);
    
    listenRoom(roomId);
  } catch(e) {
    updateStatusBar('⚠️ 加入房间失败: ' + e.message);
  }
}

function listenRoom(roomId) {
  if (roomUnsubscribe) roomUnsubscribe();
  
  const roomRef = doc(db, "rooms", roomId);
  
  roomUnsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      updateStatusBar('⚠️ 房间已关闭');
      return;
    }
    
    const room = snapshot.data();
    
    // 房主检测到有人加入
    if (isHostPlayer && room.guestId && room.guestName && room.status === 'playing') {
      updateStatusBar('🎮 ' + room.guestName + ' 已加入！');
      addLog('🎮 ' + room.guestName + ' 已加入房间！');
    }
    
    // 检测对手的操作
    if (room.lastAction && room.lastActionBy !== currentUser.uid) {
      try {
        const action = JSON.parse(room.lastAction);
        addLog('🤝 对手: ' + (action.desc || '操作完成'));
      } catch(e) {}
    }
  }, (error) => {
    updateStatusBar('⚠️ 连接错误: ' + error.message);
  });
}

async function syncGameAction(desc) {
  if (!currentRoomId || !currentUser) return;
  
  try {
    const roomRef = doc(db, "rooms", currentRoomId);
    await updateDoc(roomRef, {
      lastAction: JSON.stringify({ desc: desc, time: Date.now() }),
      lastActionBy: currentUser.uid
    });
  } catch(e) {
    console.error('Sync error:', e);
  }
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ===================== 挂载到全局 =====================
window.initAuthUI = initAuthUI;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.showOnlineMenu = showOnlineMenu;
window.syncGameAction = syncGameAction;

console.log('✅ auth-ui.js (Firebase + 联机) loaded');
