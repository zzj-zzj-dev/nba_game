// 兜底登录函数（由HTML onclick直接调用）
function handleAuthClick() {
  if (typeof handleAuth === 'function') {
    handleAuth();
    return false;
  }
  // auth-ui.js 未加载时直接跳转
  window.location.href = 'login.html';
  return false;
}

/**
 * auth-ui.js — Firebase 登录 + 存档 + 联机（适配新UI）
 * 新UI顶部有 #user-area (登录状态 + 按钮)
 */

const firebaseConfig = {
  apiKey: "AIzaSyC7YvTSDGpid7nPFaICOjWHGWKFRZTXYew",
  authDomain: "nba-card-game.firebaseapp.com",
  projectId: "nba-card-game",
  storageBucket: "nba-card-game.firebasestorage.app",
  messagingSenderId: "614710872766",
  appId: "1:614710872766:web:a86d11643c5679f8c0ecef"
};

let firebaseInitialized = false;
let auth = null;
let fdb = null;
let currentUser = null;

// 延迟初始化Firebase（在 initAuthUI 中调用）
function ensureFirebase() {
  if (firebaseInitialized) return true;
  if (typeof firebase === 'undefined' || !firebase.apps) return false;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    fdb = firebase.firestore();
    firebaseInitialized = true;
    return true;
  } catch(e) {
    console.warn('Firebase初始化失败:', e);
    return false;
  }
}
let currentRoomId = null;
let roomUnsubscribe = null;
let isHostPlayer = false;

// ===================== 初始化 =====================
function initAuthUI() {
  console.log('[Auth] initAuthUI called');
  const btn = document.getElementById('btnAuth');
  if (btn) btn.onclick = handleAuth;
  
  if (!ensureFirebase()) {
    console.warn('[Auth] Firebase not available');
    document.getElementById('loginStatus').textContent = '离线模式';
    document.getElementById('btnAuth').textContent = '登录';
    document.getElementById('btnAuth').onclick = () => alert('Firebase未初始化，请在online模式下使用');
    return;
  }
  
  console.log('[Auth] Firebase initialized, currentUser:', auth.currentUser ? auth.currentUser.email : 'null');
  
  function checkUser() {
    if (!auth) return false;
    if (auth.currentUser) {
      console.log('[Auth] checkUser found user:', auth.currentUser.email);
      currentUser = auth.currentUser;
      showUserInfo(auth.currentUser);
      return true;
    }
    console.log('[Auth] checkUser: no currentUser');
    return false;
  }
  
  if (!checkUser()) {
    showLoginPrompt();
    setTimeout(checkUser, 500);
    setTimeout(checkUser, 1500);
    setTimeout(checkUser, 3000);
  }
  
  auth.onAuthStateChanged((user) => {
    console.log('[Auth] onAuthStateChanged fired, user:', user ? user.email : 'null');
    currentUser = user;
    if (user) {
      showUserInfo(user);
    } else {
      showLoginPrompt();
    }
  });
}

function showUserInfo(user) {
  const statusEl = document.getElementById('loginStatus');
  const btnEl = document.getElementById('btnAuth');
  if (!statusEl || !btnEl) return;
  
  const name = user.email?.split('@')[0] || '用户';
  statusEl.textContent = `👤 ${name}`;
  btnEl.textContent = '登出';
  btnEl.onclick = () => {
    if (auth) auth.signOut();
  };
  
  // 添加联机按钮
  const userArea = document.getElementById('user-area');
  if (userArea && !document.getElementById('btn-online')) {
    const onlineBtn = document.createElement('button');
    onlineBtn.id = 'btn-online';
    onlineBtn.className = 'btn btn-small';
    onlineBtn.textContent = '🌐 联机';
    onlineBtn.style.marginLeft = '8px';
    onlineBtn.onclick = showOnlineMenu;
    userArea.appendChild(onlineBtn);
  }
}

function showLoginPrompt() {
  const statusEl = document.getElementById('loginStatus');
  const btnEl = document.getElementById('btnAuth');
  if (!statusEl || !btnEl) return;
  statusEl.textContent = '未登录';
  btnEl.textContent = '登录';
  btnEl.onclick = handleAuth;
}

// 登录（重定向到login.html）
function handleAuth() {
  if (auth && auth.currentUser) {
    auth.signOut();
    return;
  }
  window.location.href = 'login.html';
}

// ===================== 存档系统 =====================
async function saveGame() {
  if (!auth || !auth.currentUser) { showModal('提示', '请先登录'); return; }
  
  const gameData = {
    coins: coins,
    backpack: backpack.map(c => ({ id: c.id, masterId: c.masterId, stars: c.stars || 0, inLineup: c.inLineup || false })),
    lineup: SLOTS.reduce((acc, slot) => { acc[slot] = lineup[slot] ? lineup[slot].id : null; return acc; }, {})
  };
  
  try {
    await fdb.collection('saves').doc(auth.currentUser.uid).set({ gameData, updatedAt: new Date() });
    if (!window._silentSave) showModal('保存成功', '游戏数据已保存到云端');
  } catch(e) {
    if (!window._silentSave) showModal('保存失败', e.message);
  }
}

async function loadGame() {
  if (!auth || !auth.currentUser) { showModal('提示', '请先登录'); return; }
  
  try {
    const docSnap = await fdb.collection('saves').doc(auth.currentUser.uid).get();
    if (!docSnap.exists) { showModal('加载失败', '没有找到存档'); return; }
    
    const gd = docSnap.data().gameData;
    coins = gd.coins || 0;
    backpack = (gd.backpack || []).map(c => ({ id: c.id, masterId: c.masterId, stars: c.stars || 0, inLineup: c.inLineup || false }));
    
    const lineupData = gd.lineup || {};
    for (const slot of SLOTS) {
      const cid = lineupData[slot];
      lineup[slot] = cid ? backpack.find(c => c.id === cid) || null : null;
    }
    
    saveToStorage();
    updateUI();
    if (!window._silentLoad) showModal('加载成功', '存档已加载');
  } catch(e) {
    if (!window._silentLoad) showModal('加载失败', e.message);
  }
}

// ===================== 联机系统（简化） =====================
function showOnlineMenu() {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = '🌐 联机对战';
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button class="btn btn-primary" id="btn-online-create" style="padding:12px;">创建房间</button>
      <div style="display:flex;gap:5px;">
        <input id="input-room-id" placeholder="输入房间号" style="flex:1;padding:8px;background:rgba(255,255,255,0.1);border:1px solid #4a4a7a;border-radius:6px;color:#fff;">
        <button class="btn btn-primary" id="btn-online-join" style="padding:8px 15px;">加入</button>
      </div>
    </div>
  `;
  
  confirm.textContent = '关闭';
  confirm.onclick = () => modal.classList.add('hidden');
  cancel.style.display = 'none';
  modal.classList.remove('hidden');
  
  // 绑定事件
  setTimeout(() => {
    document.getElementById('btn-online-create')?.addEventListener('click', handleCreateRoom);
    document.getElementById('btn-online-join')?.addEventListener('click', () => {
      const input = document.getElementById('input-room-id');
      if (input && input.value.trim()) handleJoinRoom(input.value.trim().toUpperCase());
    });
  }, 100);
}

async function handleCreateRoom() {
  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const username = currentUser?.email?.split('@')[0] || '玩家';
  
  try {
    await fdb.collection('rooms').doc(roomId).set({
      host: username,
      guest: null,
      hostReady: false,
      guestReady: false,
      hostTeam: null,
      guestTeam: null,
      status: 'waiting',
      createdAt: new Date()
    });
    
    hideModal();
    
    isHostPlayer = true;
    currentRoomId = roomId;
    listenRoom(roomId);
    
    // 立即显示等待界面（不先弹准备确认）
    showHostLobby(roomId, username);
  } catch(e) {
    showModal('创建失败', e.message);
  }
}

function showHostLobby(roomId, hostName) {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = '🎮 联机房间';
  body.innerHTML = `
    <div style="text-align:center;">
      <p style="font-size:1.8em;color:#ffd700;margin:10px 0;">${roomId}</p>
      <p style="color:#888;">分享房间号给好友</p>
      <hr style="border-color:#333;margin:12px 0;">
      <div id="lobby-guest-status" style="color:#aaa;margin:8px 0;">等待玩家加入...</div>
      <div id="lobby-host-ready" style="margin:8px 0;">
        <button class="btn btn-primary" id="btn-lobby-host-ready" style="padding:10px 25px;">✅ 我准备</button>
        <span id="lobby-host-status" style="margin-left:10px;color:#888;">未准备</span>
      </div>
      <div id="lobby-guest-ready" style="margin:8px 0;color:#888;">对手: 未加入</div>
      <hr style="border-color:#333;margin:12px 0;">
      <div id="lobby-start-area" style="display:none;">
        <button class="btn btn-success" id="btn-lobby-start" style="padding:12px 30px;font-size:1.1em;">⚔️ 开始游戏</button>
        <p style="color:#aaa;font-size:0.85em;margin-top:5px;">双方都已准备，可以开始了</p>
      </div>
    </div>
  `;
  
  confirm.style.display = 'none';
  cancel.textContent = '离开房间';
  cancel.onclick = () => {
    fdb.collection('rooms').doc(roomId).delete().catch(() => {});
    if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
    currentRoomId = null;
    modal.classList.add('hidden');
  };
  modal.classList.remove('hidden');
  
  // 绑定准备按钮
  setTimeout(() => {
    const readyBtn = document.getElementById('btn-lobby-host-ready');
    if (readyBtn) {
      readyBtn.onclick = async () => {
        const myTeam = createMatchPlayersFromLineup(lineup);
        const teamData = myTeam.map(p => ({
          playerName: p.playerName, position: p.position, teamName: p.teamName,
          isStarter: p.isStarter, isSubstitute: p.isSubstitute,
          attrs: p.attrs
        }));
        await fdb.collection('rooms').doc(roomId).update({ hostReady: true, hostTeam: teamData });
        readyBtn.disabled = true;
        readyBtn.textContent = '✅ 已准备';
        document.getElementById('lobby-host-status').textContent = '已准备 ✅';
        document.getElementById('lobby-host-status').style.color = '#4caf50';
      };
    }
    
    // 监听房间状态
    const unsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snap) => {
      if (!snap.exists) return;
      const room = snap.data();
      
      // 游戏开始，关闭大厅
      if (room.status === 'playing') {
        hideModal();
        return;
      }
      
      const guestStatusEl = document.getElementById('lobby-guest-status');
      const guestReadyEl = document.getElementById('lobby-guest-ready');
      const startArea = document.getElementById('lobby-start-area');
      
      if (room.guest) {
        if (guestStatusEl) guestStatusEl.innerHTML = `对手: ${room.guest} 已加入 ✅`;
        if (guestReadyEl) {
          if (room.guestReady) {
            guestReadyEl.innerHTML = '对手: 已准备 ✅';
            guestReadyEl.style.color = '#4caf50';
          } else {
            guestReadyEl.innerHTML = '对手: 未准备 ❌';
            guestReadyEl.style.color = '#888';
          }
        }
        // 检查双方是否都已准备
        if (room.hostReady && room.guestReady && startArea) {
          startArea.style.display = 'block';
        }
      } else {
        if (guestStatusEl) guestStatusEl.innerHTML = '等待玩家加入...';
        if (guestReadyEl) guestReadyEl.innerHTML = '对手: 未加入';
        if (startArea) startArea.style.display = 'none';
      }
    });
  }, 100);
  
  // 绑定开始按钮
  setTimeout(() => {
    const startBtn = document.getElementById('btn-lobby-start');
    if (startBtn) {
      startBtn.onclick = async () => {
        startBtn.disabled = true;
        startBtn.textContent = '⏳ 开始中...';
        const myTeam = createMatchPlayersFromLineup(lineup);
        const teamData = myTeam.map(p => ({
          playerName: p.playerName, position: p.position, teamName: p.teamName,
          isStarter: p.isStarter, isSubstitute: p.isSubstitute,
          attrs: p.attrs
        }));
        await fdb.collection('rooms').doc(roomId).update({ hostTeam: teamData, status: 'playing' });
        // host 端通过 listenRoom 的 'playing' 回调跳转
      };
    }
  }, 100);
}




async function handleJoinRoom(roomId) {
  const username = currentUser?.email?.split('@')[0] || '玩家';
  
  try {
    const roomRef = fdb.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) { showModal('错误', '房间不存在'); return; }
    
    const room = roomSnap.data();
    if (room.status !== 'waiting') { showModal('错误', '房间已满或已关闭'); return; }
    if (room.host === username) { showModal('错误', '不能加入自己的房间'); return; }
    
    await roomRef.update({ guest: username });
    hideModal();
    
    isHostPlayer = false;
    currentRoomId = roomId;
    listenRoom(roomId);
    
    // 显示 guest 等待界面
    showGuestLobby(roomId, username, room.host);
  } catch(e) {
    showModal('加入失败', e.message);
  }
}

function showGuestLobby(roomId, guestName, hostName) {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = '🎮 等待房主开战';
  body.innerHTML = `
    <div style="text-align:center;">
      <p style="color:#aaa;">房主: ${hostName}</p>
      <p style="color:#888;">房间号: ${roomId}</p>
      <hr style="border-color:#333;margin:12px 0;">
      <div id="guest-lobby-status" style="margin:8px 0;">
        <button class="btn btn-primary" id="btn-guest-ready" style="padding:10px 25px;">✅ 我准备</button>
        <span id="guest-ready-status" style="margin-left:10px;color:#888;">未准备</span>
      </div>
      <div id="guest-host-status" style="margin:8px 0;color:#888;">房主: 未准备 ❌</div>
      <div id="guest-waiting-msg" style="color:#ff9800;margin-top:10px;display:none;">等待房主开始游戏...</div>
    </div>
  `;
  
  confirm.style.display = 'none';
  cancel.textContent = '离开房间';
  cancel.onclick = () => {
    fdb.collection('rooms').doc(roomId).update({ guest: null, guestReady: false }).catch(() => {});
    if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
    currentRoomId = null;
    modal.classList.add('hidden');
  };
  modal.classList.remove('hidden');
  
  // 绑定准备按钮
  setTimeout(() => {
    const readyBtn = document.getElementById('btn-guest-ready');
    if (readyBtn) {
      readyBtn.onclick = async () => {
        // 准备时上传自己的阵容
        const myTeam = createMatchPlayersFromLineup(lineup);
        const teamData = myTeam.map(p => ({
          playerName: p.playerName, position: p.position, teamName: p.teamName,
          isStarter: p.isStarter, isSubstitute: p.isSubstitute,
          attrs: p.attrs
        }));
        await fdb.collection('rooms').doc(roomId).update({ guestReady: true, guestTeam: teamData });
        readyBtn.disabled = true;
        readyBtn.textContent = '✅ 已准备';
        document.getElementById('guest-ready-status').textContent = '已准备 ✅';
        document.getElementById('guest-ready-status').style.color = '#4caf50';
        document.getElementById('guest-waiting-msg').style.display = 'block';
      };
    }
    
    // 监听房主状态
    const unsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snap) => {
      if (!snap.exists) return;
      const room = snap.data();
      
      // 如果开始了，关闭等待界面
      if (room.status === 'playing') {
        hideModal();
        return;
      }
      
      const hostStatusEl = document.getElementById('guest-host-status');
      if (hostStatusEl) {
        if (room.hostReady) {
          hostStatusEl.innerHTML = '房主: 已准备 ✅';
          hostStatusEl.style.color = '#4caf50';
        } else {
          hostStatusEl.innerHTML = '房主: 未准备 ❌';
          hostStatusEl.style.color = '#888';
        }
      }
    });
  }, 100);
}



function listenRoom(roomId) {
  if (!fdb) return;
  roomUnsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snapshot) => {
    if (!snapshot.exists) return;
    const room = snapshot.data();
    if (room.status === 'playing' && room.hostTeam && room.guestTeam && !isInBattle) {
      startOnlineBattle(room, isHostPlayer);
    }
  });
}

function hideModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
}

// ===================== 联机对战核心 =====================

// ===================== 联机对战核心（重写：真人对战） =====================

// 联机比赛状态对象
let onlineGame = {
  roomId: null,
  isHost: false,
  hostName: '',
  guestName: '',
  myTurn: false,
  waitingForOpponent: false,
  battleOver: false,
  unsubscribe: null,
  // 用于防守选人
  pendingDefensePick: null,
  // 同步随机种子
  seed: null,
  seedUsed: 0
};

// 同步随机数生成器
function syncRandom() {
  if (onlineGame.seed !== null) {
    // 简单的伪随机，基于种子
    onlineGame.seed = (onlineGame.seed * 9301 + 49297) % 233280;
    onlineGame.seedUsed++;
    return onlineGame.seed / 233280;
  }
  return Math.random();
}

// ===================== 主入口 =====================
function startOnlineBattle(room, isHost) {
  hideModal();

  document.getElementById('difficultySelect').classList.add('hidden');
  document.getElementById('battleArena').classList.remove('hidden');
  document.getElementById('action-buttons').style.display = '';

  isInBattle = true;

  // 保存联机状态
  onlineGame.roomId = currentRoomId;
  onlineGame.isHost = isHost;
  onlineGame.hostName = room.host || '';
  onlineGame.guestName = room.guest || '';
  onlineGame.myTurn = false;
  onlineGame.waitingForOpponent = false;
  onlineGame.battleOver = false;
  onlineGame.pendingDefensePick = null;

  // 构建双方阵容
  function buildPlayers(rawArr) {
    return rawArr.map((p, i) => createPlayer({
      id: 'p_' + i + '_' + Math.random().toString(36).substr(2,4),
      playerName: p.playerName,
      position: p.position,
      teamName: p.teamName,
      isStarter: p.isStarter,
      isSubstitute: p.isSubstitute,
      attrs: p.attrs
    }));
  }

  const homeTeam = buildPlayers(room.hostTeam || []);
  const awayTeam = buildPlayers(room.guestTeam || []);

  // 初始化比赛（双方用同样的阵容初始化）
  battleManager = new BattleManager();
  battleManager.initializeGame(homeTeam, awayTeam, true, Difficulty.NORMAL);
  battleManager.aiOpponent = null; // 联机模式不需要AI

  // 同步随机种子
  if (isHost) {
    // host生成种子，写入云端
    onlineGame.seed = Math.floor(Math.random() * 233280);
    if (fdb && currentRoomId) {
      fdb.collection('rooms').doc(currentRoomId).update({
        gameSeed: onlineGame.seed
      }).catch(() => {});
    }
  } else {
    // guest从云端读种子，如果没有则用随机
    onlineGame.seed = room.gameSeed || Math.floor(Math.random() * 233280);
  }

  // 设置回调
  battleManager.setCallbacks({
    onRound: (result) => {
      syncRoundToCloud(result);
    },
    onGame: (result) => handleOnlineResult(result),
    onSubstitution: (side, from, to) => {
      addLogMessage((side === 'home' ? '我方' : '对方') + '换人: ' + from.playerName + '↓ ' + to.playerName + '↑', 'sub');
      syncGameState();
    },
    onTimeout: (side, remaining) => {
      addLogMessage((side === 'home' ? '我方' : '对方') + '使用暂停，剩余' + remaining + '次', 'timeout');
      syncGameState();
    }
  });

  // 显示联机日志框
  const onlineLogContainer = document.getElementById('online-log-container');
  if (onlineLogContainer) onlineLogContainer.style.display = 'block';
  const onlineLogEl = document.getElementById('online-log-messages');
  if (onlineLogEl) onlineLogEl.innerHTML = '';
  
  // 创建联机提示区域
  if (!document.getElementById('online-turn-info')) {
    const turnInfo = document.createElement('div');
    turnInfo.id = 'online-turn-info';
    turnInfo.style.cssText = 'text-align:center;padding:8px;background:rgba(255,215,0,0.1);border:1px solid #ffd700;border-radius:8px;margin-bottom:10px;font-size:0.9em;';
    document.getElementById('action-buttons').insertAdjacentElement('afterbegin', turnInfo);
  }

  renderBattleUI();
  bindBattleEvents();
  resetActionState();
  updateTurnOwnership();

  // 监听云端状态
  listenOnlineGameState();
}

// ===================== 回合控制 =====================
function updateTurnOwnership() {
  if (!battleManager || battleManager.gameOver) return;

  const isHomePossession = battleManager.possession === Constants.Possession.HOME;
  onlineGame.myTurn = (isHomePossession && onlineGame.isHost) || (!isHomePossession && !onlineGame.isHost);
  onlineGame.waitingForOpponent = !onlineGame.myTurn;

  updateTurnDisplay();
  updateActionButtonsVisibility();

  // 如果自己的回合，resetActionState 会自动显示进攻选项
  if (typeof resetActionState === 'function') resetActionState();
}

function updateTurnDisplay() {
  const turnInfo = document.getElementById('online-turn-info');
  if (!turnInfo) return;

  if (battleManager && battleManager.gameOver) {
    turnInfo.innerHTML = '🏁 比赛结束';
    return;
  }

  if (onlineGame.myTurn) {
    turnInfo.innerHTML = '🎯 你的回合！选择进攻球员和方式';
    turnInfo.style.background = 'rgba(76,175,80,0.15)';
    turnInfo.style.borderColor = '#4caf50';
    turnInfo.style.color = '#4caf50';
  } else {
    const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
    turnInfo.innerHTML = '⏳ 不是你的回合，等待 ' + oppName + ' 出牌...';
    turnInfo.style.background = 'rgba(255,152,0,0.1)';
    turnInfo.style.borderColor = '#ff9800';
    turnInfo.style.color = '#ff9800';
  }
}

function updateActionButtonsVisibility() {
  const actionArea = document.getElementById('action-buttons');
  if (!actionArea) return;

  let turnHint = document.getElementById('turn-hint-area');
  if (!turnHint) {
    turnHint = document.createElement('div');
    turnHint.id = 'turn-hint-area';
    turnHint.style.cssText = 'text-align:center;padding:12px;border-radius:8px;margin-bottom:8px;font-size:1em;font-weight:bold;';
    actionArea.insertBefore(turnHint, actionArea.firstChild);
  }

  const actionBtns = actionArea.querySelectorAll('button:not(#turn-hint-area button):not(#online-turn-info)');

  if (onlineGame.myTurn) {
    turnHint.textContent = '🎯 你的回合！请选择进攻球员和方式';
    turnHint.style.background = 'rgba(76,175,80,0.15)';
    turnHint.style.border = '1px solid #4caf50';
    turnHint.style.color = '#4caf50';
    actionBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
  } else {
    const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
    turnHint.textContent = '⏳ 不是你的回合，等待 ' + oppName + ' 出牌...';
    turnHint.style.background = 'rgba(255,152,0,0.1)';
    turnHint.style.border = '1px solid #ff9800';
    turnHint.style.color = '#ff9800';
    actionBtns.forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
  }
}

// ===================== 监听云端状态 =====================

// ===================== 联机操作记录 =====================
function addOnlineLog(message, type) {
  const el = document.getElementById('online-log-messages');
  if (!el) return;
  const entry = document.createElement('div');
  entry.style.cssText = 'padding:2px 4px;font-size:0.83em;border-bottom:1px solid rgba(255,255,255,0.05);color:' + 
    (type === 'attack' ? '#4caf50' : type === 'defense' ? '#ff9800' : '#aaa') + ';';
  entry.textContent = message;
  el.appendChild(entry);
  el.scrollTop = el.scrollHeight;
}

function listenOnlineGameState() {
  if (!fdb || !currentRoomId) return;

  if (onlineGame.unsubscribe) {
    onlineGame.unsubscribe();
  }

  onlineGame.unsubscribe = fdb.collection('rooms').doc(currentRoomId).onSnapshot((snap) => {
    if (!snap.exists) return;
    const room = snap.data();

    // 读取同步种子
    if (room.gameSeed && onlineGame.seed === null) {
      onlineGame.seed = room.gameSeed;
    }

    // 处理对手的进攻请求（我方选防守）
    if (room.requestDefense && room.requestDefense.side && !battleManager.gameOver) {
      const reqSide = room.requestDefense.side; // 'host' means host is attacking
      // 是我方防守吗？
      const iAmDefense = (reqSide === 'host' && !onlineGame.isHost) || (reqSide === 'guest' && onlineGame.isHost);
      if (iAmDefense && !room.defensePick) {
        // 弹出防守选人窗口
        showDefensePick(room.requestDefense.attackerName, room.requestDefense.attackType);
        // 清除请求（防止重复弹窗）
        fdb.collection('rooms').doc(currentRoomId).update({
          requestDefense: null
        }).catch(() => {});
      }
    }

    // 比赛结束
    if (room.status === 'finished') {
      if (battleManager && !battleManager.gameOver) {
        battleManager.gameOver = true;
        const winnerName = room.winner || '';
        const myName = onlineGame.isHost ? onlineGame.hostName : onlineGame.guestName;
        if (winnerName === myName) {
          coins += 100;
          saveToStorage();
          updateUI();
          showModal('🎉 胜利！', '你赢了！+100金币！');
          addLogMessage('🏆 你赢了！+100金币！', 'reward');
        } else {
          showModal('💔 失败', '你输了，下次加油！');
          addLogMessage('💔 你输了！', 'game_end');
        }
        isInBattle = false;
        onlineGame.battleOver = true;
        setTimeout(() => {
          exitBattle();
          if (onlineGame.unsubscribe) { onlineGame.unsubscribe(); onlineGame.unsubscribe = null; }
          if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
          currentRoomId = null;
        }, 3000);
      }
      return;
    }

    // 处理防守方选的球员（对手选好了防守人）
    if (room.defensePick && room.defensePick.side) {
      const defSide = room.defensePick.side; // 'host' or 'guest'
      // 是我方在等防守选人
      if (onlineGame.pendingDefensePick && 
          ((defSide === 'host' && onlineGame.isHost) || (defSide === 'guest' && !onlineGame.isHost))) {
        // 对手选好了防守人，我执行进攻
        const defenderName = room.defensePick.defenderName;
        const offenseTeam = battleManager.possession === Constants.Possession.HOME ? 
          battleManager.homePlayers : battleManager.awayPlayers;
        const attacker = offenseTeam.find(p => p.playerName === onlineGame.pendingDefensePick.attackerName);
        const defTeam = battleManager.possession === Constants.Possession.HOME ? 
          battleManager.awayPlayers : battleManager.homePlayers;
        const defender = defTeam.find(p => p.playerName === defenderName);

        if (attacker && defender) {
          // 执行进攻
          const result = battleManager.executeRound(attacker, onlineGame.pendingDefensePick.attackType, defender);
          if (result) {
            addLogMessage(result.message, 'round');
            // 同步进攻结果到云端
            syncAttackResult(result, attacker.playerName, defenderName, onlineGame.pendingDefensePick.attackType);
          }
          const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
          addOnlineLog(oppName + ' 选 ' + defenderName + ' 防守你的 ' + onlineGame.pendingDefensePick.attackerName + ' (' + onlineGame.pendingDefensePick.attackType + ')', 'defense');
          renderBattleUI();
          updateScoreboard();
          updateGameInfo();
        }

        onlineGame.pendingDefensePick = null;
        // 清除云端防守选人
        fdb.collection('rooms').doc(currentRoomId).update({
          defensePick: null
        }).catch(() => {});
        updateTurnOwnership();
        syncGameState();
      }
    }

    // 处理对手提交的进攻结果（我作为防守方）
    if (room.attackResult && room.attackResult.side) {
      const atkSide = room.attackResult.side;
      const isMyDefense = ((atkSide === 'host' && !onlineGame.isHost) || (atkSide === 'guest' && onlineGame.isHost));
      
      if (isMyDefense && !battleManager.gameOver) {
        // 执行对手的进攻结果在我的battleManager上
        const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
        const offenseTeam = isHomeOffense ? battleManager.homePlayers : battleManager.awayPlayers;
        const defenseTeam = isHomeOffense ? battleManager.awayPlayers : battleManager.homePlayers;
        const attacker = offenseTeam.find(p => p.playerName === room.attackResult.attackerName);
        const defender = defenseTeam.find(p => p.playerName === room.attackResult.defenderName);

        if (attacker && defender) {
          const result = battleManager.executeRound(attacker, room.attackResult.attackType, defender);
          if (result) {
            addLogMessage('[对方] ' + result.message, 'round');
          }
          // 记录对手操作
          const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
          addOnlineLog(oppName + ' → ' + attacker.playerName + ' (' + room.attackResult.attackType + ') 你选 ' + defender.playerName, 'attack');
          renderBattleUI();
          updateScoreboard();
          updateGameInfo();
        }

        // 清除云端进攻结果
        fdb.collection('rooms').doc(currentRoomId).update({
          attackResult: null
        }).catch(() => {});
        updateTurnOwnership();
        syncGameState();
      }
    }

    // 同步比分（兜底）
    if (room.syncScore && battleManager) {
      // 只做显示同步，不做数值覆写（防止篡改）
    }
  });
}

// ===================== 防守选人阶段 =====================
// 当对手发起进攻后，我方需要选一个防守球员
function showDefensePick(attackerName, attackType) {
  onlineGame.pendingDefensePick = {
    attackerName: attackerName,
    attackType: attackType
  };

  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');

  title.textContent = '🛡️ 选择防守球员';
  
  const defTeam = battleManager.possession === Constants.Possession.HOME ? 
    battleManager.awayPlayers : battleManager.homePlayers;
  const courtPlayers = defTeam.filter(p => p.isOnCourt);

  body.innerHTML = '<p style="color:#aaa;margin-bottom:10px;">对手: ' + attackerName + ' (' + attackType + ')</p>';
  courtPlayers.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.cssText = 'display:block;width:100%;margin:4px 0;padding:8px;';
    btn.textContent = p.playerName + ' (' + p.position + ') ' + 
      (p.currentStamina <= 0 ? ' [体力耗尽]' : '');
    if (p.currentStamina <= 0) {
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
    btn.onclick = async () => {
      // 上传防守选择到云端
      const side = onlineGame.isHost ? 'host' : 'guest';
      await fdb.collection('rooms').doc(currentRoomId).update({
        defensePick: {
          side: side,
          defenderName: p.playerName
        }
      }).catch(() => {});
      modal.classList.add('hidden');
      addOnlineLog('🛡️ 你选择 ' + p.playerName + ' 防守 ' + attackerName + ' (' + attackType + ')', 'defense');
  addLogMessage('🛡️ 你选择 ' + p.playerName + ' 防守 ' + attackerName, 'system');
      
      // 等待 host 执行完进攻后的结果
      // listenOnlineGameState 会处理 attackResult
    };
    body.appendChild(btn);
  });

  confirm.style.display = 'none';
  cancel.textContent = '自动选择';
  cancel.style.display = 'inline-block';
  cancel.onclick = () => {
    // 自动选防守
    const defender = battleManager._autoSelectDefender(
      (battleManager.possession === Constants.Possession.HOME ? battleManager.homePlayers : battleManager.awayPlayers)
        .find(p => p.playerName === attackerName)
    );
    if (defender) {
      const side = onlineGame.isHost ? 'host' : 'guest';
      fdb.collection('rooms').doc(currentRoomId).update({
        defensePick: {
          side: side,
          defenderName: defender.playerName
        }
      }).catch(() => {});
      addOnlineLog('🛡️ 自动选择 ' + defender.playerName + ' 防守 ' + attackerName + ' (' + attackType + ')', 'defense');
      addLogMessage('🛡️ 自动选择 ' + defender.playerName + ' 防守', 'system');
    }
    modal.classList.add('hidden');
  };
  modal.classList.remove('hidden');
}

// ===================== 执行进攻（联机版） =====================
function executeOnlineRound(attacker, attackType) {
  if (!battleManager || battleManager.gameOver) return null;
  if (!onlineGame.myTurn) return null;

  // 通知对手选防守
  if (fdb && currentRoomId) {
    fdb.collection('rooms').doc(currentRoomId).update({
      requestDefense: {
        attackerName: attacker.playerName,
        attackType: attackType,
        side: onlineGame.isHost ? 'host' : 'guest'
      }
    }).catch(() => {});
  }

  const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
  addOnlineLog('你 → ' + attacker.playerName + ' (' + attackType + ') 等待 ' + oppName + ' 选防守', 'attack');
  addLogMessage('等待对手选择防守球员...', 'system');
  return { waiting: true };
}

// 同步进攻结果
function syncAttackResult(result, attackerName, defenderName, attackType) {
  if (!fdb || !currentRoomId) return;

  const side = onlineGame.isHost ? 'host' : 'guest';
  fdb.collection('rooms').doc(currentRoomId).update({
    attackResult: {
      side: side,
      attackerName: attackerName,
      defenderName: defenderName,
      attackType: attackType,
      resultType: result ? result.type : null,
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      timestamp: Date.now()
    }
  }).catch(() => {});
}

// ===================== 云同步 =====================
function syncGameState() {
  if (!currentRoomId || !fdb || !battleManager) return;
  fdb.collection('rooms').doc(currentRoomId).update({
    syncScore: {
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      possession: battleManager.possession,
      round: battleManager.currentRound
    }
  }).catch(() => {});
}

function syncRoundToCloud(result) {
  if (!currentRoomId || !fdb || !battleManager) return;
  fdb.collection('rooms').doc(currentRoomId).update({
    lastRound: {
      side: onlineGame.isHost ? 'host' : 'guest',
      result: result,
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      round: battleManager.currentRound
    }
  }).catch(() => {});
}

// ===================== 比赛结算 =====================
function handleOnlineResult(result) {
  if (!battleManager || onlineGame.battleOver) return;
  onlineGame.battleOver = true;

  const isHomeWinner = battleManager.homeScore >= Constants.WIN_SCORE;
  const reward = 100;

  // 通知云端比赛结束
  if (currentRoomId && fdb) {
    const winnerName = isHomeWinner ? onlineGame.hostName : onlineGame.guestName;
    fdb.collection('rooms').doc(currentRoomId).update({
      status: 'finished',
      winner: winnerName,
      finalScore: {
        homeScore: battleManager.homeScore,
        awayScore: battleManager.awayScore
      }
    }).catch(() => {});
  }

  const iAmWinner = (isHomeWinner && onlineGame.isHost) || (!isHomeWinner && !onlineGame.isHost);
  if (iAmWinner) {
    coins += reward;
    saveToStorage();
    updateUI();
    addLogMessage('🏆 你赢了！+100金币！', 'reward');
    showModal('🎉 胜利！', '比分 ' + battleManager.homeScore + ':' + battleManager.awayScore + '\n获得 100 金币！');
  } else {
    addLogMessage('💔 你输了！', 'game_end');
    showModal('💔 失败', '比分 ' + battleManager.homeScore + ':' + battleManager.awayScore + '\n下次加油！');
  }

  isInBattle = false;
  setTimeout(() => {
    exitBattle();
    if (onlineGame.unsubscribe) { onlineGame.unsubscribe(); onlineGame.unsubscribe = null; }
    if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
    currentRoomId = null;
  }, 3000);
}
