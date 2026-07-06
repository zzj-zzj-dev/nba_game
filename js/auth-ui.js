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

// 安全地初始化Firebase（防止重复）
let firebaseInitialized = false;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  firebaseInitialized = true;
} catch(e) {
  console.warn('Firebase初始化失败:', e);
}

const auth = firebaseInitialized ? firebase.auth() : null;
const fdb = firebaseInitialized ? firebase.firestore() : null;

let currentUser = null;
let currentRoomId = null;
let roomUnsubscribe = null;
let isHostPlayer = false;

// ===================== 初始化 =====================
function initAuthUI() {
  if (!auth) {
    document.getElementById('loginStatus').textContent = '离线模式';
    document.getElementById('btnAuth').textContent = '登录';
    document.getElementById('btnAuth').onclick = () => alert('Firebase未初始化，请在online模式下使用');
    return;
  }
  auth.onAuthStateChanged((user) => {
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
    // 保存自己的阵容到房间
    const myLineupData = {};
    for (const slot of SLOTS) {
      const card = lineup[slot];
      myLineupData[slot] = card ? { id: card.id, masterId: card.masterId, stars: card.stars || 0 } : null;
    }
    
    await fdb.collection('rooms').doc(roomId).set({
      host: username,
      guest: null,
      hostReady: false,
      guestReady: false,
      hostTeam: null,   // 房间创建后host确认阵容时填充
      guestTeam: null,
      status: 'waiting',
      hostLineup: myLineupData,
      createdAt: new Date()
    });
    
    hideModal();
    showModal('房间已创建', `房间号: ${roomId}\n分享给好友加入\n准备开始游戏...`);
    
    // 立即弹出准备确认
    setTimeout(() => {
      showReadyConfirm(roomId, true);
    }, 500);
    
    isHostPlayer = true;
    currentRoomId = roomId;
    listenRoom(roomId);
  } catch(e) {
    showModal('创建失败', e.message);
  }
}

function showReadyConfirm(roomId, isHost) {
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = '⚔️ 准备开战';
  body.innerHTML = '<p>入场费: 100金币</p><p>获胜奖励: 200金币</p><p>确定进入比赛吗？</p>';
  
  confirm.textContent = '💰 准备开战（-100金币）';
  confirm.onclick = async () => {
    modal.classList.add('hidden');
    if (coins < 100) {
      showModal('金币不足', '需要100金币入场费');
      return;
    }
    // 先扣入场费
    coins -= 100;
    saveToStorage();
    updateUI();
    
    // 通知云端已准备
    const roomRef = fdb.collection('rooms').doc(roomId);
    if (isHost) {
      // 构建host阵容
      const homeTeam = createMatchPlayersFromLineup(lineup);
      const teamData = homeTeam.map(p => ({
        playerName: p.playerName, position: p.position, teamName: p.teamName,
        isStarter: p.isStarter, isSubstitute: p.isSubstitute,
        attrs: p.attrs
      }));
      await roomRef.update({ hostReady: true, hostTeam: teamData });
      
      // 等待guest也准备
      showModal('已准备', '等待对手准备...');
      const unsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snap) => {
        if (!snap.exists) return;
        const room = snap.data();
        if (room.guestReady && room.guestTeam) {
          unsubscribe();
          hideModal();
          showModal('对手已就绪', '比赛开始！');
          setTimeout(() => {
            roomRef.update({ status: 'playing' });
          }, 1000);
        }
      });
    } else {
      const guestTeam = createMatchPlayersFromLineup(lineup);
      const teamData = guestTeam.map(p => ({
        playerName: p.playerName, position: p.position, teamName: p.teamName,
        isStarter: p.isStarter, isSubstitute: p.isSubstitute,
        attrs: p.attrs
      }));
      await roomRef.update({ guestReady: true, guestTeam: teamData });
      
      // 如果host也已准备，直接开始
      const snap = await roomRef.get();
      if (snap.exists && snap.data().hostReady && snap.data().hostTeam) {
        roomRef.update({ status: 'playing' });
      }
    }
  };
  
  cancel.textContent = '取消';
  cancel.onclick = () => modal.classList.add('hidden');
  cancel.style.display = 'inline-block';
  modal.classList.remove('hidden');
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
    showModal('加入成功', `已加入 ${room.host} 的房间`);
    
    isHostPlayer = false;
    currentRoomId = roomId;
    listenRoom(roomId);
    
    // 弹出准备确认
    setTimeout(() => {
      showReadyConfirm(roomId, false);
    }, 500);
  } catch(e) {
    showModal('加入失败', e.message);
  }
}

function listenRoom(roomId) {
  if (!fdb) return;
  roomUnsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snapshot) => {
    if (!snapshot.exists) return;
    const room = snapshot.data();
    if (room.status === 'playing' && room.hostTeam && room.guestTeam && !isInBattle) {
      // 比赛开始 - 入场费已在准备时扣除
      startOnlineBattle(room, isHostPlayer);
    }
    if (room.status === 'finished' && battleManager && !battleManager.gameOver) {
      // 对方已结束比赛（比如掉线了自己赢了）
      if (isHostPlayer) {
        // host端已处理
      } else {
        // guest端手动触发结算
        if (battleManager && !battleManager.gameOver) {
          battleManager.gameOver = true;
          // guest视角：自己是主场，如果homeScore >= WIN_SCORE则guest赢
          addLogMessage('🏆 比赛结束！', 'game_end');
          handleOnlineResult(room, false);
        }
      }
    }
  });
}

function hideModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
}

// ===================== 联机对战核心 =====================
function startOnlineBattle(room, isHost) {
  hideModal();
  
  // 隐藏难度选择，显示对战
  document.getElementById('difficultySelect').classList.add('hidden');
  document.getElementById('battleArena').classList.remove('hidden');
  document.getElementById('action-buttons').style.display = '';
  
  isInBattle = true;
  
  // 创建阵容（从云端的数据重建球员对象）
  const myTeamRaw = isHost ? (room.hostTeam || []) : (room.guestTeam || []);
  const opponentTeamRaw = isHost ? (room.guestTeam || []) : (room.hostTeam || []);
  
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
  
  const myTeam = buildPlayers(myTeamRaw);
  const opponentTeam = buildPlayers(opponentTeamRaw);
  
  // 初始化比赛（自己是主场）
  battleManager = new BattleManager();
  battleManager.initializeGame(myTeam, opponentTeam, true, Difficulty.NORMAL);
  
  battleManager.setCallbacks({
    onRound: (result) => {
      // 同步回合数据到云端（让对方也能看到）
      syncRoundToCloud(room, result, isHost);
    },
    onGame: (result) => handleOnlineResult(room, isHost),
    onSubstitution: onSubstitutionCallback,
    onTimeout: onTimeoutCallback
  });
  
  renderBattleUI();
  bindBattleEvents();
  resetActionState();
}

function syncRoundToCloud(room, result, isHost) {
  // 轻量同步：将回合结果写入房间，让对方也能看到日志
  if (!currentRoomId || !fdb) return;
  const side = isHost ? 'host' : 'guest';
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

function handleOnlineResult(room, isHost) {
  if (!battleManager) return;
  
  const isHomeWinner = battleManager.homeScore >= Constants.WIN_SCORE;
  const reward = 200;
  
  if (isHomeWinner) {
    // 自己赢了
    coins += reward;
    saveToStorage();
    updateUI();
    addLogMessage(`🏆 你赢了！+200金币！`, 'reward');
    showModal('🎉 胜利！', `比分 ${battleManager.homeScore}:${battleManager.awayScore}\n获得 200 金币！`);
  } else {
    // 自己输了
    addLogMessage(`💔 你输了！`, 'game_end');
    showModal('💔 失败', `比分 ${battleManager.homeScore}:${battleManager.awayScore}\n下次加油！`);
  }
  
  // 通知云端比赛结束
  if (isHost && currentRoomId && fdb) {
    fdb.collection('rooms').doc(currentRoomId).update({
      status: 'finished',
      winner: isHomeWinner ? room.host : room.guest
    }).catch(() => {});
  }
  
  isInBattle = false;
  setTimeout(() => {
    exitBattle();
    // 清理房间监听
    if (roomUnsubscribe) {
      roomUnsubscribe();
      roomUnsubscribe = null;
    }
    currentRoomId = null;
  }, 3000);
}

// ===================== 导出给main.js使用 =====================
// saveGame 和 loadGame 通过全局函数调用
