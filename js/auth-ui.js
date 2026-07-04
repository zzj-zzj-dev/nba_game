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
