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
// ===================== 联机对战核心（互相对战） =====================

// 联机比赛状态
let onlineGame = {
  roomId: null,
  isHost: false,
  hostName: '',
  guestName: '',
  myTurn: false,       // 是否轮到己方操作
  waitingForOpponent: false, // 是否等待对手操作
  roundInProgress: false,    // 当前回合正在处理中
  battleOver: false,
  unsubscribe: null
};

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
  
  // 构建双方阵容
  const homeTeamRaw = room.hostTeam || [];
  const awayTeamRaw = room.guestTeam || [];
  
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
  
  const homeTeam = buildPlayers(homeTeamRaw);
  const awayTeam = buildPlayers(awayTeamRaw);
  
  // 初始化比赛（双方都认为自己是主场，但实际由云端球权决定谁进攻）
  // 使用相同的 BattleManager，但控制权根据球权决定
  battleManager = new BattleManager();
  battleManager.initializeGame(homeTeam, awayTeam, true, Difficulty.NORMAL);
  
  // 清除旧的AI对手——联机模式不需要AI
  battleManager.aiOpponent = null;
  
  // 检查谁是当前球权方
  // 如果是主场的回合且自己是host，或者客场回合且是guest，则自己操作
  updateTurnOwnership();
  
  battleManager.setCallbacks({
    onRound: (result) => {
      // 回合结束后更新云端
      syncRoundToCloud(result);
      addLogMessage(result.message, 'round');
      updateTurnOwnership();
    },
    onGame: (result) => handleOnlineResult(result),
    onSubstitution: (side, from, to) => {
      addLogMessage(side + '换人: ' + from.playerName + '↓ ' + to.playerName + '↑', 'sub');
      syncGameState();
    },
    onTimeout: (side, remaining) => {
      addLogMessage(side + '使用暂停，剩余' + remaining + '次', 'timeout');
      syncGameState();
    }
  });
  
  renderBattleUI();
  bindBattleEvents();
  resetActionState();
  
  // 显示联机提示
  const turnInfo = document.createElement('div');
  turnInfo.id = 'online-turn-info';
  turnInfo.style.cssText = 'text-align:center;padding:8px;background:rgba(255,215,0,0.1);border:1px solid #ffd700;border-radius:8px;margin-bottom:10px;font-size:0.9em;';
  document.getElementById('action-buttons').insertAdjacentElement('afterbegin', turnInfo);
  updateTurnDisplay();
  
  // 监听云端状态变化（对手的操作）
  listenOnlineGameState();
}

function updateTurnOwnership() {
  if (!battleManager || battleManager.gameOver) return;
  
  const isHomePossession = battleManager.possession === Constants.Possession.HOME;
  
  // 主场球权 → host操作；客场球权 → guest操作
  onlineGame.myTurn = (isHomePossession && onlineGame.isHost) || (!isHomePossession && !onlineGame.isHost);
  onlineGame.waitingForOpponent = !onlineGame.myTurn;
  
  updateTurnDisplay();
  updateActionButtonsVisibility();
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
  } else if (onlineGame.waitingForOpponent) {
    const oppName = onlineGame.isHost ? onlineGame.guestName : onlineGame.hostName;
    turnInfo.innerHTML = `⏳ 等待 ${oppName} 操作...`;
    turnInfo.style.background = 'rgba(255,152,0,0.1)';
    turnInfo.style.borderColor = '#ff9800';
  }
}

function updateActionButtonsVisibility() {
  // 控制操作按钮的可见性（轮到你了才显示）
  const btns = document.querySelectorAll('#action-buttons .btn, #action-buttons button');
  // 不直接隐藏按钮，而是通过提示引导
}

function listenOnlineGameState() {
  if (!fdb || !currentRoomId) return;
  
  // 先取消之前的监听
  if (onlineGame.unsubscribe) {
    onlineGame.unsubscribe();
  }
  
  onlineGame.unsubscribe = fdb.collection('rooms').doc(currentRoomId).onSnapshot((snap) => {
    if (!snap.exists) return;
    const room = snap.data();
    
    // 比赛结束
    if (room.status === 'finished') {
      if (battleManager && !battleManager.gameOver) {
        battleManager.gameOver = true;
        // 从云端的 winner 信息判断
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
        setTimeout(() => {
          exitBattle();
          if (onlineGame.unsubscribe) { onlineGame.unsubscribe(); onlineGame.unsubscribe = null; }
          currentRoomId = null;
        }, 3000);
      }
      return;
    }
    
    // 检查对手是否提交了进攻操作
    if (room.pendingAttack && room.pendingAttack.side) {
      const pendingSide = room.pendingAttack.side; // 'host' or 'guest'
      const isMyPendingAttack = (pendingSide === 'host' && onlineGame.isHost) || 
                                (pendingSide === 'guest' && !onlineGame.isHost);
      
      // 如果是对手提交的，我们来执行
      if (!isMyPendingAttack && !onlineGame.roundInProgress && !battleManager.gameOver) {
        onlineGame.roundInProgress = true;
        executeOpponentAttack(room.pendingAttack);
      }
    }
    
    // 更新比分显示（如果有同步的比分）
    if (room.syncScore) {
      // 可选：同步对方比分确认
    }
  });
}

function executeOpponentAttack(attackData) {
  if (!battleManager) return;
  
  const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
  const defenseTeam = isHomeOffense ? 'away' : 'home';
  
  // 从进攻数据中重建操作
  const attackerName = attackData.attackerName;
  const attackType = attackData.attackType;
  const defenderName = attackData.defenderName;
  const passerName = attackData.passerName;
  const receiverName = attackData.receiverName;
  
  // 在防守方（我们）的球队中找到对应的防守球员
  const defTeamPlayers = defenseTeam === 'home' ? battleManager.homePlayers : battleManager.awayPlayers;
  const defender = defTeamPlayers.find(p => p.playerName === defenderName);
  
  let result;
  if (attackType === 'assist' && passerName && receiverName) {
    // 助攻回合
    const allPlayers = [...battleManager.homePlayers, ...battleManager.awayPlayers];
    const passer = allPlayers.find(p => p.playerName === passerName);
    const receiver = allPlayers.find(p => p.playerName === receiverName);
    if (passer && receiver) {
      result = battleManager.executeAssistRound(passer, receiver, defender);
    } else {
      // fallback: 用 AI 选择
      const offenseTeam = isHomeOffense ? battleManager.homePlayers : battleManager.awayPlayers;
      const attacker = offenseTeam.find(p => p.playerName === attackerName);
      if (attacker) {
        result = battleManager.executeRound(attacker, attackType, defender);
      }
    }
  } else {
    // 普通进攻回合
    const offenseTeam = isHomeOffense ? battleManager.homePlayers : battleManager.awayPlayers;
    const attacker = offenseTeam.find(p => p.playerName === attackerName);
    if (attacker) {
      result = battleManager.executeRound(attacker, attackType, defender);
    }
  }
  
  if (result) {
    addLogMessage('[对方] ' + result.message, 'round');
  }
  
  // 清除对方的待处理攻击
  if (currentRoomId && fdb) {
    fdb.collection('rooms').doc(currentRoomId).update({
      pendingAttack: null
    }).catch(() => {});
  }
  
  onlineGame.roundInProgress = false;
  updateTurnOwnership();
  
  // 同步我们这端的比分到云端
  syncGameState();
}

// 重写回合执行——如果是自己的回合，正常执行；否则提示等待
function executeOnlineRound(attacker, attackType, defender) {
  if (!battleManager || battleManager.gameOver) return null;
  if (!onlineGame.myTurn) {
    addLogMessage('⏳ 不是你的回合，请等待对手操作', 'system');
    return null;
  }
  if (onlineGame.roundInProgress) return null;
  
  onlineGame.roundInProgress = true;
  
  const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
  
  let result;
  if (attackType === 'assist') {
    // 助攻由外部处理
    return null;
  } else {
    result = battleManager.executeRound(attacker, attackType, defender);
  }
  
  if (result) {
    addLogMessage(result.message, 'round');
    
    // 将我们的操作上传到云端，让对方执行
    const attackData = {
      side: isHomeOffense ? 'host' : 'guest',
      attackerName: attacker.playerName,
      attackType: attackType,
      defenderName: defender ? defender.playerName : null,
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      timestamp: Date.now()
    };
    
    if (currentRoomId && fdb) {
      fdb.collection('rooms').doc(currentRoomId).update({
        pendingAttack: attackData
      }).catch(() => {});
    }
  }
  
  onlineGame.roundInProgress = false;
  updateTurnOwnership();
  syncGameState();
  
  return result;
}

// 重写助攻回合
function executeOnlineAssistRound(passer, receiver, defender) {
  if (!battleManager || battleManager.gameOver) return null;
  if (!onlineGame.myTurn) {
    addLogMessage('⏳ 不是你的回合，请等待对手操作', 'system');
    return null;
  }
  if (onlineGame.roundInProgress) return null;
  
  onlineGame.roundInProgress = true;
  
  const result = battleManager.executeAssistRound(passer, receiver, defender);
  
  if (result) {
    addLogMessage(result.message, 'round');
    
    const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
    const attackData = {
      side: isHomeOffense ? 'host' : 'guest',
      attackerName: receiver.playerName,
      attackType: 'assist',
      defenderName: defender ? defender.playerName : null,
      passerName: passer.playerName,
      receiverName: receiver.playerName,
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      timestamp: Date.now()
    };
    
    if (currentRoomId && fdb) {
      fdb.collection('rooms').doc(currentRoomId).update({
        pendingAttack: attackData
      }).catch(() => {});
    }
  }
  
  onlineGame.roundInProgress = false;
  updateTurnOwnership();
  syncGameState();
  
  return result;
}

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
  
  const side = onlineGame.isHost ? 'host' : 'guest';
  fdb.collection('rooms').doc(currentRoomId).update({
    lastRound: {
      side: side,
      result: result,
      homeScore: battleManager.homeScore,
      awayScore: battleManager.awayScore,
      round: battleManager.currentRound
    }
  }).catch(() => {});
}

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
  
  // 判断自己是否赢家
  const iAmWinner = (isHomeWinner && onlineGame.isHost) || (!isHomeWinner && !onlineGame.isHost);
  
  if (iAmWinner) {
    coins += reward;
    saveToStorage();
    updateUI();
    addLogMessage('🏆 你赢了！+100金币！', 'reward');
    showModal('🎉 胜利！', `比分 ${battleManager.homeScore}:${battleManager.awayScore}\n获得 100 金币！`);
  } else {
    addLogMessage('💔 你输了！', 'game_end');
    showModal('💔 失败', `比分 ${battleManager.homeScore}:${battleManager.awayScore}\n下次加油！`);
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

// 覆盖原来的回合执行函数（在 main.js 中定义的 will be replaced by these）
function onOnlineSubstitutionCallback(side, from, to) {
  addLogMessage(side + '换人: ' + from.playerName + '↓ ' + to.playerName + '↑', 'sub');
  syncGameState();
}

function onOnlineTimeoutCallback(side, remaining) {
  addLogMessage(side + '使用暂停，剩余' + remaining + '次', 'timeout');
  syncGameState();
}

// ===================== 导出给main.js使用 =====================
// saveGame 和 loadGame 通过全局函数调用