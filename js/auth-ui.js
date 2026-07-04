/**
 * auth-ui.js — PocketBase 登录 + 存档（直接fetch API）
 */

const API = window.location.origin + '/api';

function getAuth() {
  const saved = localStorage.getItem('pb_auth');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch(e) {
    localStorage.removeItem('pb_auth');
    return null;
  }
}

function getToken() {
  const auth = getAuth();
  return auth?.token || null;
}

function getUserId() {
  const auth = getAuth();
  return auth?.record?.id || null;
}

function getUsername() {
  const auth = getAuth();
  return auth?.record?.username || auth?.record?.email?.split('@')[0] || '用户';
}

let currentUser = getAuth();

function initAuthUI() {
  if (currentUser) {
    showUserInfo();
  } else {
    showLoginPrompt();
  }
}

function showUserInfo() {
  const header = document.querySelector('#game-header');
  if (!header) return;
  
  const oldBar = document.getElementById('user-bar');
  if (oldBar) oldBar.remove();
  
  const bar = document.createElement('div');
  bar.id = 'user-bar';
  bar.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; margin-bottom: 8px;
    background: rgba(255,215,0,0.08); border-radius: 6px;
    font-size: 0.8em;
  `;
  
  bar.innerHTML = `
    <span>👤 ${getUsername()}</span>
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
    const token = getToken();
    const userId = getUserId();
    if (!token || !userId) throw new Error('未登录');
    
    const searchRes = await fetch(API + '/collections/saves/records?filter=user%3D%22' + userId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (searchData.items && searchData.items.length > 0) {
      await fetch(API + '/collections/saves/records/' + searchData.items[0].id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ gameData: gameData })
      });
    } else {
      await fetch(API + '/collections/saves/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ user: userId, gameData: gameData })
      });
    }
    
    updateStatusBar('💾 存档成功！');
    addLog('💾 游戏已保存到云端');
  } catch (e) {
    updateStatusBar('⚠️ 存档失败: ' + e.message);
  }
}

async function loadGame() {
  if (!currentUser || !battleManager) return;
  
  try {
    const token = getToken();
    const userId = getUserId();
    if (!token || !userId) throw new Error('未登录');
    
    const searchRes = await fetch(API + '/collections/saves/records?filter=user%3D%22' + userId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      updateStatusBar('⚠️ 没有找到存档');
      return;
    }
    
    const gd = searchData.items[0].gameData;
    
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
  localStorage.removeItem('pb_auth');
  currentUser = null;
  window.location.href = 'login.html';
}

window.initAuthUI = initAuthUI;
window.saveGame = saveGame;
window.loadGame = loadGame;

console.log('✅ auth-ui.js (direct fetch) loaded');

// ===================== 联机对战（PocketBase Realtime） =====================

let ws = null;
let wsConnected = false;
let currentRoomId = null;
let isOnlineMatch = false;

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
      <button id="btn-create-room" class="btn btn-primary" style="width:100%;margin-bottom:8px;padding:12px;font-size:1.1em;">
        🏠 创建房间
      </button>
    </div>
    <div style="margin:10px 0;">
      <input type="text" id="input-room-id" placeholder="输入房间号加入" 
        style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid #4a4a7a;border-radius:6px;color:#fff;text-align:center;font-size:1em;">
      <button id="btn-join-room" class="btn btn-secondary" style="width:100%;margin-top:8px;padding:10px;">
        🔗 加入房间
      </button>
    </div>
    <div id="online-status" style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:0.85em;color:#888;">
      🟢 已就绪，可以联机
    </div>
  `;
  
  confirmBtn.textContent = '关闭';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');
  
  // 绑定事件
  setTimeout(() => {
    const createBtn = document.getElementById('btn-create-room');
    const joinBtn = document.getElementById('btn-join-room');
    const roomInput = document.getElementById('input-room-id');
    
    if (createBtn) {
      createBtn.onclick = () => createOnlineRoom();
    }
    
    if (joinBtn && roomInput) {
      joinBtn.onclick = () => {
        const roomId = roomInput.value.trim();
        if (roomId) joinOnlineRoom(roomId);
      };
      roomInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const roomId = roomInput.value.trim();
          if (roomId) joinOnlineRoom(roomId);
        }
      };
    }
  }, 100);
  
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

async function createOnlineRoom() {
  if (!currentUser) return;
  
  const token = getToken();
  const userId = getUserId();
  const username = getUsername();
  
  // 生成随机房间号
  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  currentRoomId = roomId;
  
  try {
    // 在 PocketBase 创建一个房间记录
    await fetch(API + '/collections/rooms/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        roomId: roomId,
        host: userId,
        guest: '',
        status: 'waiting',
        gameData: null
      })
    });
    
    hideModal();
    updateStatusBar(`🔗 房间已创建: ${roomId}`);
    addLog(`🔗 房间 ${roomId} 已创建，等待对手加入...`);
    
    // 开始监听房间状态
    startRoomPolling(roomId, userId, username);
    
  } catch (e) {
    updateStatusBar('⚠️ 创建房间失败: ' + e.message);
  }
}

async function joinOnlineRoom(roomId) {
  if (!currentUser) return;
  
  const token = getToken();
  const userId = getUserId();
  const username = getUsername();
  
  try {
    // 查找房间
    const searchRes = await fetch(API + '/collections/rooms/records?filter=roomId%3D%22' + roomId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      updateStatusBar('⚠️ 房间不存在');
      return;
    }
    
    const room = searchData.items[0];
    
    if (room.status !== 'waiting') {
      updateStatusBar('⚠️ 房间已开始或已结束');
      return;
    }
    
    // 加入房间
    await fetch(API + '/collections/rooms/records/' + room.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        guest: userId,
        status: 'playing'
      })
    });
    
    currentRoomId = roomId;
    hideModal();
    
    updateStatusBar(`🎮 已加入房间 ${roomId}，对局开始！`);
    addLog(`🎮 已加入房间 ${roomId}，对局开始！`);
    
    // 初始化联机对战
    startOnlineGame(roomId, userId, username, false);
    
  } catch (e) {
    updateStatusBar('⚠️ 加入房间失败: ' + e.message);
  }
}

function startRoomPolling(roomId, userId, username) {
  // 每2秒检查一次房间状态，看有没有人加入
  const interval = setInterval(async () => {
    if (!currentUser || !currentRoomId) {
      clearInterval(interval);
      return;
    }
    
    const token = getToken();
    const searchRes = await fetch(API + '/collections/rooms/records?filter=roomId%3D%22' + roomId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (searchData.items && searchData.items.length > 0) {
      const room = searchData.items[0];
      if (room.guest && room.status === 'playing') {
        clearInterval(interval);
        updateStatusBar('🎮 对手已加入，对局开始！');
        addLog('🎮 对手已加入，对局开始！');
        startOnlineGame(roomId, userId, username, true);
      }
    }
  }, 2000);
  
  // 存一下 interval 以便清理
  window._roomPollInterval = interval;
}

function startOnlineGame(roomId, userId, username, isHost) {
  isOnlineMatch = true;
  
  // 简单实现：双方各选自己的阵容，轮流操作
  // 这里暂时用通知的方式告知用户
  updateStatusBar('🎮 联机模式 - 双方准备就绪');
  addLog('🎮 双人对战模式已启动，请选择进攻球员');
  
  // 每5秒同步一次游戏状态
  const gameInterval = setInterval(async () => {
    if (!currentUser || !currentRoomId || !isOnlineMatch) {
      clearInterval(gameInterval);
      return;
    }
    
    const token = getToken();
    const searchRes = await fetch(API + '/collections/rooms/records?filter=roomId%3D%22' + roomId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (searchData.items && searchData.items.length > 0) {
      const room = searchData.items[0];
      if (room.gameData) {
        // 检查是否有对手的最新操作
        const lastAction = room.gameData.lastAction;
        const actionPlayer = room.gameData.lastActionPlayer;
        
        if (lastAction && actionPlayer !== userId) {
          // 对手做了操作，需要处理
          // 这里简化处理：显示对手的操作
          addLog(`🤝 对手: ${lastAction}`);
        }
      }
    }
  }, 3000);
  
  window._gameSyncInterval = gameInterval;
}

// 同步游戏操作到房间
async function syncGameAction(actionMessage) {
  if (!currentUser || !currentRoomId || !isOnlineMatch) return;
  
  const token = getToken();
  const userId = getUserId();
  
  try {
    const searchRes = await fetch(API + '/collections/rooms/records?filter=roomId%3D%22' + currentRoomId + '%22', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    
    if (searchData.items && searchData.items.length > 0) {
      const room = searchData.items[0];
      const currentGameData = room.gameData || {};
      
      currentGameData.lastAction = actionMessage;
      currentGameData.lastActionPlayer = userId;
      
      await fetch(API + '/collections/rooms/records/' + room.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ gameData: currentGameData })
      });
    }
  } catch (e) {
    console.error('Sync error:', e);
  }
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ===================== 挂载联机函数 =====================
window.showOnlineMenu = showOnlineMenu;
window.syncGameAction = syncGameAction;

console.log('✅ 联机模块已加载');
