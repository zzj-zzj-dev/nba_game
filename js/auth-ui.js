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
    showModal('保存成功', '游戏数据已保存到云端');
  } catch(e) {
    showModal('保存失败', e.message);
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
    showModal('加载成功', '存档已加载');
  } catch(e) {
    showModal('加载失败', e.message);
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
      status: 'waiting',
      createdAt: new Date()
    });
    
    hideModal();
    showModal('房间已创建', `房间号: ${roomId}\n分享给好友加入\n等待对手...`);
    
    isHostPlayer = true;
    currentRoomId = roomId;
    listenRoom(roomId);
  } catch(e) {
    showModal('创建失败', e.message);
  }
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
    
    await roomRef.update({ guest: username, status: 'ready' });
    hideModal();
    showModal('加入成功', `已加入 ${room.host} 的房间`);
    
    isHostPlayer = false;
    currentRoomId = roomId;
    listenRoom(roomId);
  } catch(e) {
    showModal('加入失败', e.message);
  }
}

function listenRoom(roomId) {
  if (!fdb) return;
  roomUnsubscribe = fdb.collection('rooms').doc(roomId).onSnapshot((snapshot) => {
    if (!snapshot.exists) return;
    const room = snapshot.data();
    if (room.status === 'playing') {
      // 同步比赛
    }
  });
}

function hideModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
}

// ===================== 导出给main.js使用 =====================
// saveGame 和 loadGame 通过全局函数调用
