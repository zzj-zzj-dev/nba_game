/**
 * auth-ui.js — Firebase 登录状态UI + Firestore 存档
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let currentRoomId = null;
let isInOnlineMatch = false;

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
      createBtn.onclick = async () => {
        try {
          const { createRoom, listenRoom } = await import('./online.js');
          const roomId = await createRoom(currentUser.uid, currentUser.email?.split('@')[0] || '玩家');
          hideModal();
          updateStatusBar('🔗 房间已创建: ' + roomId);
          addLog('🔗 房间 ' + roomId + ' 已创建，等待对手加入...');
          
          // 监听是否有人加入
          listenRoom(roomId, {
            onPlayerJoin: (room) => {
              updateStatusBar('🎮 ' + room.guestName + ' 已加入！');
              addLog('🎮 ' + room.guestName + ' 已加入房间！');
              startOnlineGame(roomId, true);
            },
            onError: (msg) => {
              updateStatusBar('⚠️ ' + msg);
            }
          });
        } catch(e) {
          updateStatusBar('⚠️ 创建房间失败: ' + e.message);
        }
      };
    }
    
    if (joinBtn && roomInput) {
      joinBtn.onclick = async () => {
        const roomId = roomInput.value.trim().toUpperCase();
        if (!roomId || roomId.length !== 4) {
          updateStatusBar('⚠️ 请输入4位房间号');
          return;
        }
        try {
          const { joinRoom, listenRoom } = await import('./online.js');
          await joinRoom(roomId, currentUser.uid, currentUser.email?.split('@')[0] || '玩家');
          hideModal();
          updateStatusBar('🎮 已加入房间 ' + roomId + '，对局开始！');
          addLog('🎮 已加入房间 ' + roomId);
          
          startOnlineGame(roomId, false);
        } catch(e) {
          updateStatusBar('⚠️ 加入房间失败: ' + e.message);
        }
      };
      roomInput.onkeydown = (e) => {
        if (e.key === 'Enter') joinBtn.click();
      };
    }
  }, 100);
  
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

function startOnlineGame(roomId, isHostPlayer) {
  isInOnlineMatch = true;
  currentRoomId = roomId;
  
  updateStatusBar('🎮 联机对战已开始！');
  addLog('🎮 双人对战模式启动！' + (isHostPlayer ? '（你是房主）' : '（你是挑战者）'));
  
  // 监听对手操作
  import('./online.js').then(({ listenRoom }) => {
    listenRoom(roomId, {
      onOpponentAction: (room) => {
        if (room.lastAction) {
          try {
            const action = JSON.parse(room.lastAction);
            const isMyAction = (isHostPlayer && action.player === 'host') || (!isHostPlayer && action.player === 'guest');
            if (!isMyAction) {
              addLog('🤝 对手: ' + (action.description || '正在操作...'));
            }
          } catch(e) {}
        }
      },
      onError: (msg) => {
        updateStatusBar('⚠️ ' + msg);
      }
    });
  });
  
  import('./online.js').then(({ syncAction }) => {
    // 拦截游戏操作，同步到房间
    window.__onlineSyncAction = syncAction;
  });
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

window.initAuthUI = initAuthUI;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.showOnlineMenu = showOnlineMenu;

console.log('✅ auth-ui.js (Firebase) loaded');
