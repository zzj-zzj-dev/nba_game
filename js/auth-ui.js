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

function showOnlineMenu() {
  updateStatusBar('⚠️ 联机功能开发中，敬请期待');
}

window.initAuthUI = initAuthUI;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.showOnlineMenu = showOnlineMenu;

console.log('✅ auth-ui.js (Firebase) loaded');
