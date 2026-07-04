/**
 * auth-ui.js — 登录状态UI + 联机入口
 * 与 main.js 配合使用，添加用户信息显示和联机功能
 */

// ===================== 用户状态 =====================
let currentUser = null;
let ws = null;
let wsConnected = false;

// ===================== 初始化 =====================
function initAuthUI() {
  // 读取本地token
  const token = localStorage.getItem('nba_token');
  const userData = localStorage.getItem('nba_user');
  
  if (token && userData) {
    currentUser = JSON.parse(userData);
    currentUser.token = token;
    showUserInfo();
  } else {
    showLoginPrompt();
  }
}

function showUserInfo() {
  const header = document.querySelector('#game-header');
  if (!header) return;
  
  // 移除旧的用户条
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
    <span>👤 ${currentUser.username}</span>
    <span>
      <button class="btn" style="background:#2a5a6a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-save-game">💾 存档</button>
      <button class="btn" style="background:#5a3a7a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-load-game">📂 读档</button>
      <button class="btn" style="background:#5a2a3a;color:#fff;padding:4px 10px;font-size:0.85em;" id="btn-logout">🚪 退出</button>
    </span>
  `;
  
  header.insertBefore(bar, header.firstChild);
  
  // 绑定事件
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
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + currentUser.token
      },
      body: JSON.stringify({ gameData })
    });
    const data = await res.json();
    if (data.success) {
      updateStatusBar('💾 存档成功！');
      addLog('💾 游戏已保存');
    } else {
      updateStatusBar('⚠️ 存档失败: ' + data.message);
    }
  } catch (e) {
    updateStatusBar('⚠️ 服务器连接失败');
  }
}

async function loadGame() {
  if (!currentUser || !battleManager) return;
  
  try {
    const res = await fetch('/api/save', {
      headers: { 'Authorization': 'Bearer ' + currentUser.token }
    });
    const data = await res.json();
    
    if (!data.success) {
      updateStatusBar('⚠️ 没有找到存档');
      return;
    }
    
    const gd = data.data;
    
    // 恢复球员状态
    battleManager.homePlayers.forEach((p, i) => {
      if (gd.homePlayers[i]) {
        Object.assign(p, gd.homePlayers[i]);
      }
    });
    battleManager.awayPlayers.forEach((p, i) => {
      if (gd.awayPlayers[i]) {
        Object.assign(p, gd.awayPlayers[i]);
      }
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
    addLog(`📂 已读取存档 (${data.updatedAt})`);
  } catch (e) {
    updateStatusBar('⚠️ 读档失败: ' + e.message);
  }
}

function logout() {
  localStorage.removeItem('nba_token');
  localStorage.removeItem('nba_user');
  window.location.href = 'login.html';
}

// ===================== 联机对战 (WebSocket) =====================
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);
  
  ws.onopen = () => {
    wsConnected = true;
    // 发送认证
    if (currentUser && currentUser.token) {
      ws.send(JSON.stringify({ type: 'auth', token: currentUser.token }));
    }
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWSMessage(data);
  };
  
  ws.onclose = () => {
    wsConnected = false;
  };
}

function handleWSMessage(data) {
  switch (data.type) {
    case 'auth_ok':
      console.log('✅ WebSocket 认证成功');
      break;
    case 'room_created':
      updateStatusBar(`🔗 房间已创建: ${data.roomId}`);
      addLog(`🔗 房间 ${data.roomId} 已创建，等待对手加入...`);
      break;
    case 'game_start':
      updateStatusBar('🎮 对战开始！');
      addLog('🎮 联机对战开始！');
      break;
    case 'opponent_action':
      // 对手的操作，需要同步到游戏
      if (data.action) {
        // 联机对战逻辑（后续实现）
      }
      break;
    case 'opponent_disconnected':
      updateStatusBar('⚠️ 对手已断开连接');
      addLog('⚠️ 对手断开连接，游戏将暂停');
      break;
  }
}

// ===================== 联机入口UI =====================
function showOnlineMenu() {
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  modalTitle.textContent = '🎮 联机对战';
  modalBody.innerHTML = `
    <div style="margin:10px 0;">
      <button id="btn-create-room" class="btn btn-primary" style="width:100%;margin-bottom:8px;">
        🏠 创建房间
      </button>
    </div>
    <div style="margin:10px 0;">
      <input type="text" id="input-room-id" placeholder="输入房间号加入" 
        style="width:100%;padding:8px;background:rgba(255,255,255,0.06);border:1px solid #4a4a7a;border-radius:6px;color:#fff;text-align:center;font-size:1em;">
      <button id="btn-join-room" class="btn btn-secondary" style="width:100%;margin-top:6px;">
        🔗 加入房间
      </button>
    </div>
    <div style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;">
      <div style="font-size:0.8em;color:#888;">⚡ 需要先登录才能联机对战</div>
      <div style="font-size:0.8em;color:#888;" id="ws-status">🔴 未连接</div>
    </div>
  `;
  
  confirmBtn.textContent = '关闭';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');
  
  // 更新WS状态
  const wsStatus = document.getElementById('ws-status');
  if (wsStatus) {
    wsStatus.textContent = wsConnected ? '🟢 已连接服务器' : '🟡 正在连接...';
  }
  
  if (!wsConnected && currentUser) {
    connectWebSocket();
    setTimeout(() => {
      const st = document.getElementById('ws-status');
      if (st) st.textContent = wsConnected ? '🟢 已连接服务器' : '🔴 未连接';
    }, 1000);
  }
  
  // 绑定事件
  setTimeout(() => {
    const createBtn = document.getElementById('btn-create-room');
    const joinBtn = document.getElementById('btn-join-room');
    const roomInput = document.getElementById('input-room-id');
    
    if (createBtn) {
      createBtn.onclick = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'create_room' }));
        }
      };
    }
    
    if (joinBtn && roomInput) {
      joinBtn.onclick = () => {
        const roomId = roomInput.value.trim();
        if (roomId && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'join_room', roomId }));
        }
      };
    }
  }, 100);
  
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

// ===================== 挂载到全局 =====================
window.initAuthUI = initAuthUI;
window.showOnlineMenu = showOnlineMenu;
window.saveGame = saveGame;
window.loadGame = loadGame;

console.log('✅ auth-ui.js loaded');
