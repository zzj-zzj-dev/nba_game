// ============================================================================
// main.js — 游戏主逻辑（卡牌系统 + 对战集成）
// 功能：金币管理、抽卡、阵容管理、融合升星、分解、对战
// ============================================================================

// ===================== 全局状态 =====================
let coins = 0;
let backpack = [];        // 背包卡牌 { id, masterId, stars, inLineup }
let lineup = {            // 阵容
  pg: null, sg: null, sf: null, pf: null, c: null,
  bench1: null, bench2: null, bench3: null
};
let currentTab = 'home';
let isInBattle = false;
let battleManager = null;
let currentBattleDifficulty = "normal";

// ===================== 常量 =====================
const SLOTS = ['pg','sg','sf','pf','c','bench1','bench2','bench3'];
const POS_TO_LABEL = { pg:'PG', sg:'SG', sf:'SF', pf:'PF', c:'C', bench1:'替补1', bench2:'替补2', bench3:'替补3' };

// ===================== 初始化 =====================
function initGame() {
  console.log('NBA卡牌对战初始化...');
  loadFromStorage();
  
  // 检查是否首次进入且背包为空（开局福利）
  const freeClaimed = localStorage.getItem(GameConfig.LS_KEYS.FREE_PACKS_CLAIMED);
  if (!freeClaimed && backpack.length === 0) {
    setTimeout(() => showFreePackModal(), 500);
  }
  
  updateUI();
  bindEvents();
  
  // 初始化登录系统（登录后自动加载云端存档）
  if (typeof initAuthUI === 'function') {
    initAuthUI();
    // 登录后延迟自动读取存档（静默）
    setTimeout(() => {
      if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        window._silentLoad = true;
        loadGame().then(() => { window._silentLoad = false; }).catch(() => { window._silentLoad = false; });
      }
    }, 1500);
  }
  
  console.log('初始化完成！金币:', coins, '背包:', backpack.length);
}

function showFreePackModal() {
  const modal = document.getElementById('freePackModal');
  if (modal) modal.classList.remove('hidden');
}

function claimFreePacks() {
  const count = GameConfig.PACK.FREE_PACKS_ON_START;
  const results = [];
  for (let i = 0; i < count; i++) {
    const card = pullCard('basic');
    if (card) {
      card.id = generateCardId();
      backpack.push(card);
      results.push(card);
    }
  }
  localStorage.setItem(GameConfig.LS_KEYS.FREE_PACKS_CLAIMED, 'true');
  saveToStorage();
  
  // 关闭免费弹窗
  const modal = document.getElementById('freePackModal');
  if (modal) modal.classList.add('hidden');
  
  // 显示抽卡结果
  showPackAnimationResults(results, '🎁 开局福利！获得以下卡牌');
  updateUI();
}

// ===================== 金币系统 =====================
function addCoins(amount) {
  coins += amount;
  saveToStorage();
  updateCoinDisplay();
}

function spendCoins(amount) {
  if (coins < amount) {
    showModal('金币不足', `需要 ${amount} 金币，当前只有 ${coins} 金币`);
    return false;
  }
  coins -= amount;
  saveToStorage();
  updateCoinDisplay();
  return true;
}

function updateCoinDisplay() {
  const disp = document.getElementById('coinCount');
  if (disp) disp.textContent = coins;
  const homeDisp = document.getElementById('homeCoins');
  if (homeDisp) homeDisp.textContent = coins;
}

// ===================== 存储系统 =====================
function saveToStorage() {
  localStorage.setItem(GameConfig.LS_KEYS.COINS, coins);
  localStorage.setItem(GameConfig.LS_KEYS.BACKPACK, JSON.stringify(backpack.map(c => ({
    id: c.id,
    masterId: c.masterId,
    stars: c.stars || 0,
    inLineup: c.inLineup || false
  }))));
  // 保存阵容（存卡牌id）
  const lineupData = {};
  for (const slot of SLOTS) {
    const card = lineup[slot];
    lineupData[slot] = card ? card.id : null;
  }
  localStorage.setItem(GameConfig.LS_KEYS.LINEUP, JSON.stringify(lineupData));
  
  // 自动同步到云端（如果已登录）
  autoCloudSave();
}

// 自动云端存档（静默，不弹提示）
let _lastCloudSave = 0;
function autoCloudSave() {
  const now = Date.now();
  if (now - _lastCloudSave < 3000) return; // 3秒内不重复存
  if (typeof auth === 'undefined' || !auth || !auth.currentUser) return;
  _lastCloudSave = now;
  
  const gd = {
    coins: coins,
    backpack: backpack.map(c => ({ id: c.id, masterId: c.masterId, stars: c.stars || 0, inLineup: c.inLineup || false })),
    lineup: Object.fromEntries(SLOTS.map(s => [s, lineup[s] ? lineup[s].id : null]))
  };
  
  fdb.collection('saves').doc(auth.currentUser.uid).set({ gameData: gd, updatedAt: new Date().toISOString() })
    .catch(e => console.warn('[AutoSave] 云端存档失败:', e));
}

function loadFromStorage() {
  coins = parseInt(localStorage.getItem(GameConfig.LS_KEYS.COINS)) || GameConfig.COINS.STARTING_COINS;
  
  const bpData = localStorage.getItem(GameConfig.LS_KEYS.BACKPACK);
  if (bpData) {
    try {
      const raw = JSON.parse(bpData);
      backpack = raw.map(r => ({
        id: r.id,
        masterId: r.masterId,
        stars: r.stars || 0,
        inLineup: r.inLineup || false
      }));
    } catch(e) { backpack = []; }
  } else {
    backpack = [];
  }
  
  const lineupData = localStorage.getItem(GameConfig.LS_KEYS.LINEUP);
  if (lineupData) {
    try {
      const raw = JSON.parse(lineupData);
      for (const slot of SLOTS) {
        const cid = raw[slot];
        if (cid) {
          const card = backpack.find(c => c.id === cid);
          lineup[slot] = card || null;
        } else {
          lineup[slot] = null;
        }
      }
    } catch(e) { resetLineup(); }
  } else {
    resetLineup();
  }
}

function resetLineup() {
  for (const slot of SLOTS) lineup[slot] = null;
}

// 生成唯一卡牌ID
let cardIdCounter = Date.now();
function generateCardId() {
  return 'card_' + (cardIdCounter++);
}

// ===================== 卡牌系统 =====================
function getBackpackCardById(id) {
  return backpack.find(c => c.id === id) || null;
}

function getMasterByCard(card) {
  return getMasterById(card.masterId);
}

function isCardInLineup(card) {
  for (const slot of SLOTS) {
    if (lineup[slot] && lineup[slot].id === card.id) return true;
  }
  return false;
}

// ===================== 抽卡系统 =====================
function pullCard(packType) {
  const rates = GameConfig.PACK_RATES[packType.toUpperCase()];
  if (!rates) return null;
  
  const r = Math.random();
  let cum = 0;
  let selectedTier = 'N';
  for (const [tier, rate] of Object.entries(rates)) {
    cum += rate;
    if (r <= cum) { selectedTier = tier; break; }
  }
  
  // 从该档位随机选球员
  const pool = getMastersByTier(selectedTier);
  if (pool.length === 0) return null;
  const master = pool[Math.floor(Math.random() * pool.length)];
  
  return {
    id: generateCardId(),
    masterId: master.id,
    stars: 0,
    inLineup: false
  };
}

function buyPack(packType) {
  if (isInBattle) { showModal('提示', '请在比赛结束后再抽卡'); return; }
  
  const prices = { basic: GameConfig.PACK.BASIC_PRICE, mid: GameConfig.PACK.MID_PRICE, premium: GameConfig.PACK.PREMIUM_PRICE };
  const price = prices[packType];
  if (!price) return;
  
  if (!spendCoins(price)) return;
  
  // 抽卡
  const card = pullCard(packType);
  if (!card) {
    addCoins(price); // 退款
    showModal('错误', '抽卡失败，请重试');
    return;
  }
  
  // 加入背包
  card.id = generateCardId();
  backpack.push(card);
  saveToStorage();
  updateUI();
  
  // 展示抽卡结果
  showPackAnimationResults([card], `📦 ${packType === 'basic' ? '初级基础' : packType === 'mid' ? '中级精英' : '高级巨星'}卡包`);
}

// ===================== 抽卡动画 =====================
function showPackAnimationResults(cards, title) {
  const modal = document.getElementById('packResultModal');
  const resultArea = document.getElementById('packResult');
  const cardDisplay = document.getElementById('packCardDisplay');
  const effect = document.getElementById('packRarityEffect');
  
  if (!modal || !resultArea || !cardDisplay || !effect) return;
  
  // 分析稀有度
  let highestTier = 'N';
  const cardElements = [];
  
  for (const card of cards) {
    const master = getMasterById(card.masterId);
    if (!master) continue;
    const tier = master.tier;
    if (['GOAT','SSR','SR'].includes(tier) && 
        ['GOAT','SSR','SR'].indexOf(tier) < ['GOAT','SSR','SR'].indexOf(highestTier)) {
      highestTier = tier;
    }
    
    const tierColors = { GOAT:'#7c3aed', SSR:'#d97706', SR:'#2563eb', R:'#16a34a', N:'#6b7280' };
    const tierLabels = { GOAT:'历史巨星', SSR:'传奇', SR:'史诗', R:'稀有', N:'普通' };
    const color = tierColors[tier] || '#666';
    
    cardElements.push(`
      <div class="pack-single-card" style="border-color:${color};${tier === 'GOAT' ? 'animation:rainbowGlow 1.5s infinite;' : ''}">
        <div class="pack-card-name" style="color:${color}">${master.name}</div>
        <div class="pack-card-team">${master.team} | ${master.year}</div>
        <div class="pack-card-tier" style="color:${color}">${tierLabels[tier] || tier} | 总评 ${master.overall}</div>
      </div>
    `);
  }
  
  // 清除特效
  effect.innerHTML = '';
  effect.className = 'rarity-effect';
  
  cardDisplay.innerHTML = cardElements.join('');
  
  // 标题
  const titleEl = document.createElement('h3');
  titleEl.textContent = title || '抽卡结果';
  titleEl.style.textAlign = 'center';
  titleEl.style.marginBottom = '15px';
  titleEl.style.color = '#ffd700';
  cardDisplay.insertBefore(titleEl, cardDisplay.firstChild);
  
  resultArea.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function closePackResult() {
  const modal = document.getElementById('packResultModal');
  const resultArea = document.getElementById('packResult');
  const opening = document.getElementById('packOpening');
  if (modal) modal.classList.add('hidden');
  if (resultArea) resultArea.classList.add('hidden');
  if (opening) opening.classList.add('hidden');
  updateUI();
}

// ===================== 阵容管理 =====================
function slotClick(slot) {
  if (isInBattle) { showModal('提示', '比赛进行中，无法调整阵容'); return; }
  
  const currentCard = lineup[slot];
  
  // 如果有球员在槽位，先让他下阵到背包
  if (currentCard) {
    // 下阵
    currentCard.inLineup = false;
    lineup[slot] = null;
    saveToStorage();
    updateUI();
    renderBackpack();
    return;
  }
  
  // 空位 - 选择球员上阵
  showSelectPlayerModal(slot);
}

function showSelectPlayerModal(slot) {
  const modal = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = `📋 选择球员上阵 ${POS_TO_LABEL[slot] || slot}`;
  body.innerHTML = '';
  
  // 获取该位置可用的背包卡（未上阵的）
  const availableCards = backpack.filter(c => !c.inLineup);
  const slotPos = slot.startsWith('bench') ? null : slot.toUpperCase();
  
  if (availableCards.length === 0) {
    body.innerHTML = '<p style="color:#aaa;">背包中没有可用的球员，请先去抽卡！</p>';
    modal.classList.remove('hidden');
    confirm.textContent = '知道了';
    confirm.onclick = () => modal.classList.add('hidden');
    cancel.style.display = 'none';
    return;
  }
  
  // 显示所有可用卡牌
  availableCards.forEach(card => {
    const master = getMasterById(card.masterId);
    if (!master) return;
    
    const tierColors = { GOAT:'#7c3aed', SSR:'#d97706', SR:'#2563eb', R:'#16a34a', N:'#6b7280' };
    const color = tierColors[master.tier] || '#666';
    
    // 位置适配检查
    const canPlaySlot = slot.startsWith('bench') ? true : master.positions.includes(slotPos);
    const penalty = canPlaySlot ? 0 : GameConfig.POSITION_PENALTY;
    const overall = master.overall - (penalty > 0 ? Math.round(master.overall * penalty) : 0);
    
    const cardEl = document.createElement('div');
    cardEl.className = 'select-card-item';
    if (!canPlaySlot) cardEl.classList.add('position-mismatch');
    cardEl.style.borderColor = color;
    cardEl.innerHTML = `
      <div class="sc-name" style="color:${color}">${master.name} ${card.stars > 0 ? '⭐'.repeat(card.stars) : ''}</div>
      <div class="sc-info">${master.team} | ${master.year} | ${master.tier}</div>
      <div class="sc-pos">可打: ${master.positions.join('/')} | 总评: ${overall}${penalty > 0 ? ' 位置不适配-10%' : ''}</div>
    `;
    cardEl.onclick = () => {
      // 上阵
      if (slot.startsWith('bench')) {
        // 替补无位置限制
        card.inLineup = true;
        lineup[slot] = card;
      } else {
        card.inLineup = true;
        lineup[slot] = card;
      }
      saveToStorage();
      updateUI();
      modal.classList.add('hidden');
    };
    body.appendChild(cardEl);
  });
  
  // 添加右键查看详情功能
  body.querySelectorAll('.select-card-item').forEach((el, idx) => {
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const card = availableCards[idx];
      if (card) showPlayerDetail(card);
    });
  });
  
  confirm.textContent = '取消';
  confirm.onclick = () => modal.classList.add('hidden');
  cancel.style.display = 'none';
  modal.classList.remove('hidden');
}

function clearLineup() {
  if (isInBattle) { showModal('提示', '比赛进行中，无法调整阵容'); return; }
  
  for (const slot of SLOTS) {
    const card = lineup[slot];
    if (card) {
      card.inLineup = false;
      lineup[slot] = null;
    }
  }
  saveToStorage();
  updateUI();
}

// ===================== 背包系统 =====================
let backpackFilter = 'all';

function filterBackpack(filter) {
  backpackFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
  renderBackpack();
}

function renderBackpack() {
  const grid = document.getElementById('backpackGrid');
  if (!grid) return;
  
  let filteredCards;
  if (backpackFilter === 'all') {
    filteredCards = backpack;
  } else {
    filteredCards = backpack.filter(c => {
      const master = getMasterById(c.masterId);
      return master && master.tier === backpackFilter;
    });
  }
  
  if (filteredCards.length === 0) {
    grid.innerHTML = '<div class="empty-backpack">🎒 背包为空，去抽卡吧！</div>';
    return;
  }
  
  const tierColors = { GOAT:'#7c3aed', SSR:'#d97706', SR:'#2563eb', R:'#16a34a', N:'#6b7280' };
  const tierLabels = { GOAT:'历史巨星', SSR:'传奇', SR:'史诗', R:'稀有', N:'普通' };
  
  grid.innerHTML = '';
  filteredCards.forEach(card => {
    const master = getMasterById(card.masterId);
    if (!master) return;
    const color = tierColors[master.tier] || '#666';
    
    const inLineup = isCardInLineup(card);
    // 检查位置不适配
    let hasMismatch = false;
    for (const slot of SLOTS) {
      if (lineup[slot] && lineup[slot].id === card.id && !slot.startsWith('bench')) {
        const slotPos = slot.toUpperCase();
        if (!master.positions.includes(slotPos)) {
          hasMismatch = true;
        }
      }
    }
    
    const cardEl = document.createElement('div');
    cardEl.className = 'backpack-card';
    if (inLineup) cardEl.classList.add('in-lineup');
    if (hasMismatch) cardEl.classList.add('position-mismatch');
    cardEl.style.borderColor = color;
    
    cardEl.innerHTML = `
      <div class="bp-card-name" style="color:${color}">${master.name}</div>
      <div class="bp-card-info">${master.team}</div>
      <div class="bp-card-year">${master.year}</div>
      <div class="bp-card-tier" style="background:${color}">${tierLabels[master.tier]}</div>
      <div class="bp-card-ovr">总评 ${master.overall}</div>
      ${card.stars > 0 ? `<div class="bp-card-stars">⭐${card.stars}</div>` : ''}
      ${inLineup ? '<div class="bp-card-badge">✅已上阵</div>' : '<div class="bp-card-actions"><button class="btn btn-sm" onclick="event.stopPropagation();decomposeCard(\''+card.id+'\')">分解</button><button class="btn btn-sm" onclick="event.stopPropagation();showFusionModal(\''+card.id+'\')">融合</button></div>'}
    `;
    
    cardEl.onclick = () => showPlayerDetail(card);
    cardEl.oncontextmenu = (e) => {
      e.preventDefault();
      showPlayerDetail(card);
    };
    
    grid.appendChild(cardEl);
  });
}

// ===================== 球员详情弹窗（右键） =====================
function showPlayerDetail(card) {
  const master = getMasterById(card.masterId);
  if (!master) return;
  
  const modal = document.getElementById('playerDetailModal');
  const content = document.getElementById('detailContent');
  
  const tierColors = { GOAT:'#7c3aed', SSR:'#d97706', SR:'#2563eb', R:'#16a34a', N:'#6b7280' };
  const color = tierColors[master.tier] || '#666';
  const tierLabels = { GOAT:'历史巨星', SSR:'传奇', SR:'史诗', R:'稀有', N:'普通' };
  
  const attrLabels = {
    midRangeShot: '中投', drive: '突破', post: '篮下',
    threePointAttack: '三分', playmaking: '组织',
    perimeterDefense: '外防', interiorDefense: '内防', rebounding: '篮板',
    stamina: '体力'
  };
  
  let attrHTML = '';
  const attrOrder = ['midRangeShot','drive','post','threePointAttack','playmaking','perimeterDefense','interiorDefense','rebounding','stamina'];
  for (const key of attrOrder) {
    const val = master.attrs[key] || 60;
    const starBonus = (card.stars || 0) * GameConfig.FUSION.ATTR_BONUS_PER_STAR;
    const totalVal = val + starBonus;
    const barW = Math.min(100, totalVal);
    attrHTML += `<div class="detail-attr-row">
      <span class="attr-label">${attrLabels[key]}</span>
      <div class="attr-bar"><div class="attr-fill" style="width:${barW}%"></div></div>
      <span class="attr-val">${totalVal}</span>
    </div>`;
  }
  
  const inLineup = isCardInLineup(card);
  
  content.innerHTML = `
    <div class="detail-header" style="border-color:${color}">
      <div class="detail-name" style="color:${color}">${master.name}</div>
      <div class="detail-tier" style="background:${color}">${tierLabels[master.tier]}</div>
    </div>
    <div class="detail-info">
      <div>位置: ${master.positions.join('/')} | 球队: ${master.team}</div>
      <div>赛季: ${master.year}</div>
      <div>星级: ${card.stars || 0} 星 | 总评: ${master.overall + (card.stars || 0) * GameConfig.FUSION.OVERALL_BONUS_PER_STAR}</div>
      ${inLineup ? '<div style="color:#4caf50;">已上阵</div>' : '<div style="color:#aaa;">闲置背包</div>'}
    </div>
    <div class="detail-attrs">${attrHTML}</div>
    ${inLineup ? '' : `<div class="detail-actions">
      <button class="btn btn-danger" onclick="decomposeCard('${card.id}');closePlayerDetail();">分解(${GameConfig.DECOMPOSE[master.tier]}金币)</button>
      <button class="btn btn-warning" onclick="showSwapModal('${card.id}');closePlayerDetail();">置换(${GameConfig.SWAP_COST[master.tier]}金币)</button>
      <button class="btn btn-primary" onclick="showFusionModal('${card.id}');closePlayerDetail();">融合升星</button>
    </div>`}
  `;
  modal.classList.remove('hidden');
}

function closePlayerDetail() {
  document.getElementById('playerDetailModal').classList.add('hidden');
}

// ===================== 分解系统 =====================
function decomposeCard(cardId) {
  const card = getBackpackCardById(cardId);
  if (!card) { showModal('错误', '卡牌不存在'); return; }
  if (isCardInLineup(card)) { showModal('提示', '已上阵球员无法分解！请先下阵'); return; }
  
  const master = getMasterById(card.masterId);
  if (!master) return;
  const reward = GameConfig.DECOMPOSE[master.tier] || 0;
  
  showModal('确认分解', `确定分解 ${master.name} 获得 ${reward} 金币？`, () => {
    // 从背包移除
    const idx = backpack.indexOf(card);
    if (idx >= 0) backpack.splice(idx, 1);
    addCoins(reward);
    saveToStorage();
    updateUI();
    renderBackpack();
    showModal('分解成功', `${master.name} 已分解，获得 ${reward} 金币`);
  });
}

// ===================== 融合升星系统 =====================
let fusionMainCardId = null;

function showFusionModal(mainCardId) {
  const mainCard = getBackpackCardById(mainCardId);
  if (!mainCard) { showModal('错误', '主卡不存在'); return; }
  if (isCardInLineup(mainCard)) { showModal('提示', '已上阵球员无法融合！请先下阵'); return; }
  
  fusionMainCardId = mainCardId;
  const master = getMasterById(mainCard.masterId);
  if (!master) return;
  
  // 获取可用的素材卡（须相同球员：名字+年代一致，闲置且非主卡）
  const materials = backpack.filter(c => {
    if (c.id === mainCardId || isCardInLineup(c)) return false;
    const cm = getMasterById(c.masterId);
    return cm && cm.name === master.name && cm.year === master.year;
  });
  
  const modal = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  const tierColors = { GOAT:'#7c3aed', SSR:'#d97706', SR:'#2563eb', R:'#16a34a', N:'#6b7280' };
  
  title.textContent = `⭐ 融合升星 - ${master.name}`;
  
  let html = `<div style="margin-bottom:10px;color:#ffd700;">主卡：${master.name} (${master.tier}) ⭐${mainCard.stars || 0}星</div>
  <div style="margin-bottom:10px;color:#aaa;">消耗一张闲置素材卡，全属性+${GameConfig.FUSION.ATTR_BONUS_PER_STAR}，总评+${GameConfig.FUSION.OVERALL_BONUS_PER_STAR}</div>`;
  
  if (materials.length === 0) {
    html += '<p style="color:#f44336;">没有可用的素材卡（闲置的背包卡牌）</p>';
    body.innerHTML = html;
    confirm.textContent = '知道了';
    confirm.onclick = () => modal.classList.add('hidden');
    cancel.style.display = 'none';
    modal.classList.remove('hidden');
    return;
  }
  
  html += '<div class="fusion-material-list">';
  materials.forEach(mat => {
    const matMaster = getMasterById(mat.masterId);
    if (!matMaster) return;
    const color = tierColors[matMaster.tier] || '#666';
    html += `<div class="fusion-item" data-id="${mat.id}" style="border-color:${color};cursor:pointer;" onclick="executeFusion('${mat.id}')">
      <span style="color:${color}">${matMaster.name}</span>
      <span style="color:#aaa;font-size:0.85em;">${matMaster.tier} | ⭐${mat.stars||0}</span>
    </div>`;
  });
  html += '</div>';
  
  body.innerHTML = html;
  confirm.textContent = '取消';
  confirm.onclick = () => modal.classList.add('hidden');
  cancel.style.display = 'none';
  modal.classList.remove('hidden');
}

function executeFusion(materialId) {
  if (!fusionMainCardId) return;
  
  const mainCard = getBackpackCardById(fusionMainCardId);
  const materialCard = getBackpackCardById(materialId);
  
  if (!mainCard || !materialCard) { showModal('错误', '卡牌状态异常'); return; }
  if (isCardInLineup(mainCard)) { showModal('提示', '主卡已上阵，无法融合'); return; }
  if (isCardInLineup(materialCard)) { showModal('提示', '素材卡已上阵，无法使用'); return; }
  
  // 执行融合
  mainCard.stars = (mainCard.stars || 0) + 1;
  
  // 移除素材卡
  const idx = backpack.indexOf(materialCard);
  if (idx >= 0) backpack.splice(idx, 1);
  
  saveToStorage();
  updateUI();
  renderBackpack();
  
  document.getElementById('modal-overlay').classList.add('hidden');
  showModal('⭐ 融合成功', `${getMasterById(mainCard.masterId).name} 升星成功！当前⭐${mainCard.stars}星\n全属性+${GameConfig.FUSION.ATTR_BONUS_PER_STAR}`);
}

// ===================== 置换系统 =====================
function showSwapModal(cardId) {
  const card = getBackpackCardById(cardId);
  if (!card) return;
  if (isCardInLineup(card)) { showModal('提示', '已上阵球员无法置换！'); return; }
  
  const master = getMasterById(card.masterId);
  if (!master) return;
  
  const cost = GameConfig.SWAP_COST[master.tier] || 0;
  
  showModal('球员置换', `将 ${master.name} 随机置换为同档次球员\n消耗 ${cost} 金币`, () => {
    if (!spendCoins(cost)) return;
    
    // 随机选同档次其他球员
    const pool = getMastersByTier(master.tier).filter(m => m.id !== master.id);
    if (pool.length === 0) {
      showModal('错误', '没有可置换的同档球员');
      addCoins(cost);
      return;
    }
    const newMaster = pool[Math.floor(Math.random() * pool.length)];
    
    // 更新卡牌
    card.masterId = newMaster.id;
    card.stars = 0;
    
    saveToStorage();
    updateUI();
    showModal('置换成功', `${master.name} → ${newMaster.name}`);
  });
}

// ===================== 阵容完整性检查 =====================
function isLineupComplete() {
  const starters = ['pg','sg','sf','pf','c'];
  for (const s of starters) {
    if (!lineup[s]) return false;
  }
  return true;
}

function getLineupOverall() {
  return calcLineupOverall(lineup);
}

// ===================== 对战系统 =====================
function startBattle(difficulty) {
  try {
  if (!isLineupComplete()) {
    showModal('提示', '请先配置完整阵容（5首发）再开始对战！');
    switchTab('roster');
    return;
  }
  
  currentBattleDifficulty = difficulty;
  const config = getDifficultyConfig(difficulty);
  if (!spendCoins(config.entryFee)) return;
  
  // 隐藏难度选择，显示对战
  document.getElementById('difficultySelect').classList.add('hidden');
  document.getElementById('battleArena').classList.remove('hidden');
  document.getElementById('action-buttons').style.display = '';
  
  isInBattle = true;
  
  // 创建比赛阵容
  const homeTeam = createMatchPlayersFromLineup(lineup);
  const awayTeam = generateRandomTeam('AI ' + config.label, difficulty);
  
  console.log('[Battle] homeTeam count:', homeTeam.length, 'awayTeam count:', awayTeam.length);
  console.log('[Battle] lineup:', JSON.stringify(Object.keys(lineup).map(s => ({slot:s, card:lineup[s]?.id, masterId:lineup[s]?.masterId}))));
  
  // 确保有足够球员（填充到8人）
  while (homeTeam.length < 8) {
    const fillIdx = homeTeam.length;
    const fillPos = ['PG','SG','SF','PF','C'][fillIdx % 5];
    const ph = createPlayer({
      id: 'ph_' + fillIdx,
      playerName: '替补球员',
      position: fillPos,
      teamName: '主场',
      isStarter: fillIdx < 5,
      isSubstitute: fillIdx >= 5,
      attrs: { midRangeShot:60, drive:60, post:60, threePointAttack:60, playmaking:60, perimeterDefense:60, interiorDefense:60, rebounding:60, stamina:60 }
    });
    homeTeam.push(ph);
  }
  while (awayTeam.length < 8) {
    const fillIdx = awayTeam.length;
    const fillPos = ['PG','SG','SF','PF','C'][fillIdx % 5];
    const ph = createPlayer({
      id: 'ph_away_' + fillIdx,
      playerName: 'AI替补',
      position: fillPos,
      teamName: config.label,
      isStarter: fillIdx < 5,
      isSubstitute: fillIdx >= 5,
      attrs: { midRangeShot:55, drive:55, post:55, threePointAttack:55, playmaking:55, perimeterDefense:55, interiorDefense:55, rebounding:55, stamina:60 }
    });
    awayTeam.push(ph);
  }
  
  // 初始化比赛（沿用原BattleManager）
  battleManager = new BattleManager();
  battleManager.initializeGame(homeTeam, awayTeam, true, difficulty === 'easy' ? Difficulty.EASY : difficulty === 'hard' ? Difficulty.HARD : Difficulty.NORMAL);
  
  battleManager.setCallbacks({
    onRound: onRoundCallback,
    onGame: onGameCallback,
    onSubstitution: onSubstitutionCallback,
    onTimeout: onTimeoutCallback
  });
  
  renderBattleUI();
  console.log('[Battle] renderBattleUI done. homePlayersEl hasChildren:', 
    document.getElementById('home-players')?.children.length,
    'awayPlayersEl:', document.getElementById('away-players')?.children.length,
    'homeBench:', document.getElementById('home-bench')?.children.length);
  bindBattleEvents();
  resetActionState();
  } catch(e) {
    console.error('[Battle] Error in startBattle:', e);
    alert('对战初始化出错: ' + e.message);
    isInBattle = false;
  }
}

function exitBattle() {
  isInBattle = false;
  document.getElementById('difficultySelect').classList.remove('hidden');
  document.getElementById('battleArena').classList.add('hidden');
  document.getElementById('action-buttons').style.display = 'none';
}

// ===================== 对战渲染（沿用原版函数） =====================
// DOM引用
const $ = (id) => document.getElementById(id);
const homeScoreEl = $('home-score');
const awayScoreEl = $('away-score');
const quarterDisplay = $('quarter-display');
const possessionDisplay = $('possession-display');
const gameStatus = $('game-status');
const homePlayersEl = $('home-players');
const homeBenchEl = $('home-bench');
const awayPlayersEl = $('away-players');
const awayBenchEl = $('away-bench');
const actionTitle = $('action-title');
const playerSelectEl = $('player-select');
const attackTypeSelectEl = $('attack-type-select');
const logMessages = $('log-messages');
const btnTimeout = $('btn-timeout');
const btnSubstitute = $('btn-substitute');
const btnSurrender = $('btn-surrender');
const homeTimeoutDisplay = $('home-timeout-display');
const awayTimeoutDisplay = $('away-timeout-display');
const homeSubstitutionDisplay = $('home-substitution-display');
const awaySubstitutionDisplay = $('away-substitution-display');

let selectedAttacker = null;
let selectedAttackType = null;
let currentStep = 'select_attacker';
let isProcessing = false;

function renderBattleUI() {
  renderAll();
  updateScoreboard();
  updateGameInfo();
  updateTimeoutsDisplay();
  updateSubstitutionsDisplay();
}

function renderAll() {
  renderCourtPlayers(true);
  renderBenchPlayers(true);
  renderCourtPlayers(false);
  renderBenchPlayers(false);
  updateScoreboard();
  updateGameInfo();
}

function renderCourtPlayers(isHome) {
  const container = isHome ? homePlayersEl : awayPlayersEl;
  if (!battleManager) return;
  const players = battleManager.getOnCourtPlayers(isHome);
  if (!container) return;
  container.innerHTML = '';
  players.forEach(p => {
    container.appendChild(createPlayerCard(p, isHome, false));
  });
}

function renderBenchPlayers(isHome) {
  const container = isHome ? homeBenchEl : awayBenchEl;
  if (!battleManager) return;
  const players = battleManager.getBenchPlayers(isHome);
  if (!container) return;
  container.innerHTML = '';
  players.forEach(p => {
    container.appendChild(createPlayerCard(p, isHome, true));
  });
}

function createPlayerCard(player, isHome, isBench) {
  const card = document.createElement('div');
  card.className = 'player-card';
  if (isBench) card.classList.add('bench-card');
  if (player.isJustSubstituted && player.isOnCourt) card.classList.add('sub-bonus');
  if (player.currentStamina <= 0) card.classList.add('exhausted');
  if (selectedAttacker && selectedAttacker.id === player.id) card.classList.add('selected');
  
  const staminaRatio = player.currentStamina / Constants.STAMINA_MAX;
  const staminaPct = Math.max(0, Math.min(100, Math.round(staminaRatio * 100)));
  let staminaClass = 'stamina-high';
  if (staminaPct <= 30) staminaClass = 'stamina-low';
  else if (staminaPct <= 60) staminaClass = 'stamina-mid';
  
  const badges = player.badges && player.badges.length > 0 
    ? `<div class="badge-text">${player.badges.map(b => b.name).join(' ')}</div>` : '';
  
  const subBonus = player.isJustSubstituted && player.isOnCourt 
    ? '<div class="sub-bonus-indicator">⚡替补奇兵</div>' : '';
  
  card.innerHTML = `
    <div class="player-name">${player.playerName}</div>
    <div class="player-pos">${player.position}</div>
    <div class="player-stamina">
      ${StaminaTool.getStaminaDescription(player)}
      <div class="stamina-bar"><div class="stamina-bar-fill ${staminaClass}" style="width:${staminaPct}%"></div></div>
    </div>
    <div class="player-attrs">
      <span class="attr-mini" title="中投">中${player.attrs.midRangeShot || '?'}</span>
      <span class="attr-mini" title="突破">突${player.attrs.drive || '?'}</span>
      <span class="attr-mini" title="篮下">篮${player.attrs.post || '?'}</span>
      <span class="attr-mini" title="三分">三${player.attrs.threePointAttack || '?'}</span>
      <span class="attr-mini" title="组织">组${player.attrs.playmaking || '?'}</span>
      <span class="attr-mini" title="外防">外${player.attrs.perimeterDefense || '?'}</span>
      <span class="attr-mini" title="内防">内${player.attrs.interiorDefense || '?'}</span>
      <span class="attr-mini" title="篮板">板${player.attrs.rebounding || '?'}</span>
      <span class="attr-mini" title="体力">体${player.attrs.stamina || '?'}</span>
    </div>
    ${badges}${subBonus}
  `;
  
  card.onclick = () => handlePlayerClick(player, isHome);
  card.oncontextmenu = (e) => {
    e.preventDefault();
    // 右键显示比赛球员信息
  };
  
  return card;
}

function updateScoreboard() {
  if (!battleManager) return;
  if (homeScoreEl) homeScoreEl.textContent = battleManager.homeScore;
  if (awayScoreEl) awayScoreEl.textContent = battleManager.awayScore;
}

function updateGameInfo() {
  if (!battleManager) return;
  if (possessionDisplay) {
    possessionDisplay.textContent = `⚽ 球权: ${battleManager.possession === Constants.Possession.HOME ? '🏠主场' : '✈️客场'}`;
  }
  if (gameStatus) {
    const diff = Math.abs(battleManager.homeScore - battleManager.awayScore);
    gameStatus.textContent = `⚡ 第 ${battleManager.currentRound} 回合 | 分差 ${diff} 分`;
  }
}

function updateTimeoutsDisplay() {
  if (homeTimeoutDisplay) homeTimeoutDisplay.textContent = battleManager ? battleManager.homeTimeouts : 0;
  if (awayTimeoutDisplay) awayTimeoutDisplay.textContent = battleManager ? battleManager.awayTimeouts : 0;
}

function updateSubstitutionsDisplay() {
  if (homeSubstitutionDisplay) homeSubstitutionDisplay.textContent = battleManager ? battleManager.homeSubstitutions : 0;
  if (awaySubstitutionDisplay) awaySubstitutionDisplay.textContent = battleManager ? battleManager.awaySubstitutions : 0;
}

// ===================== 回合操作 =====================
function handlePlayerClick(player, isHome) {
  if (isProcessing || !battleManager || battleManager.gameOver) return;
  
  const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
  
  if (isHomeOffense) {
    // 主场进攻 - 选择进攻球员
    handleHomeOffense(player);
  } else {
    // 防守 - 自动处理，选择防守球员
    handleHomeDefense(player);
  }
}

function handleHomeOffense(player) {
  if (!player.isOnCourt) return;
  if (player.currentStamina <= 0) {
    showModal('提示', `${player.playerName} 体力耗尽，无法进攻！`);
    return;
  }
  
  selectedAttacker = player;
  currentStep = 'select_attack_type';
  actionTitle.textContent = `🎯 ${player.playerName} - 选择进攻方式`;
  playerSelectEl.classList.add('hidden');
  attackTypeSelectEl.classList.remove('hidden');
  renderBattleUI();
}

function handleHomeDefense(player) {
  if (!player.isOnCourt) return;
  if (player.currentStamina <= 0) {
    showModal('提示', `${player.playerName} 体力耗尽，无法防守！`);
    return;
  }
  
  isProcessing = true;
  // 执行AI回合
  const result = battleManager.executeAIRound(player);
  if (result) addLogMessage(result.message, result.type);
  renderBattleUI();
  updateScoreboard();
  updateGameInfo();
  resetActionState();
  isProcessing = false;
}

function executeAttack(attackType) {
  if (!selectedAttacker || !battleManager) return;
  
  isProcessing = true;
  
  // AI自动选防守
  const defenseTeam = battleManager.getDefenseTeamData();
  let defender = null;
  if (defenseTeam.court.length > 0) {
    // 同位置优先
    const samePos = defenseTeam.court.filter(p => p.position === selectedAttacker.position && p.currentStamina > 0);
    if (samePos.length > 0) {
      defender = samePos[0];
    } else {
      const available = defenseTeam.court.filter(p => p.currentStamina > 0);
      if (available.length > 0) defender = available[0];
      else defender = defenseTeam.court[0];
    }
  }
  
  if (attackType === 'assist') {
    showAssistSelect(selectedAttacker, defender);
    return;
  }
  
  // 联机模式使用联机回合逻辑
  if (typeof executeOnlineRound === 'function' && currentRoomId) {
    const result = executeOnlineRound(selectedAttacker, attackType, defender);
    if (result) addLogMessage(result.message, result.type);
  } else {
    const result = battleManager.executeRound(selectedAttacker, attackType, defender);
    if (result) addLogMessage(result.message, result.type);
  }
  
  renderBattleUI();
  updateScoreboard();
  updateGameInfo();
  resetActionState();
  isProcessing = false;
}

function showAssistSelect(passer, initialDefender) {
  const court = battleManager.getOnCourtPlayers(true).filter(p => p.id !== passer.id);
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  const modal = document.getElementById('modal-overlay');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = `🤝 ${passer.playerName} 传球给谁？`;
  body.innerHTML = '';
  
  court.forEach(p => {
    const card = document.createElement('div');
    card.className = 'select-card-item';
    card.style.cursor = 'pointer';
    card.innerHTML = `<div>${p.playerName} (${p.position})</div>`;
    card.onclick = () => {
      isProcessing = false;
      // 联机模式使用联机助攻逻辑
      if (typeof executeOnlineAssistRound === 'function' && currentRoomId) {
        executeOnlineAssistRound(passer, p, initialDefender);
      } else {
        const result = battleManager.executeAssistRound(passer, p, initialDefender);
        if (result) addLogMessage(result.message, result.type);
      }
      renderBattleUI();
      updateScoreboard();
      updateGameInfo();
      resetActionState();
      modal.classList.add('hidden');
    };
    body.appendChild(card);
  });
  
  confirm.textContent = '取消';
  confirm.onclick = () => { modal.classList.add('hidden'); isProcessing = false; };
  cancel.style.display = 'none';
  modal.classList.remove('hidden');
}

function resetActionState() {
  selectedAttacker = null;
  selectedAttackType = null;
  currentStep = 'select_attacker';
  playerSelectEl.classList.remove('hidden');
  attackTypeSelectEl.classList.add('hidden');
  
  if (!battleManager || battleManager.gameOver) {
    actionTitle.textContent = '🏁 比赛结束';
    return;
  }
  
  const isHomeOffense = battleManager.possession === Constants.Possession.HOME;
  if (isHomeOffense) {
    actionTitle.textContent = '🎯 选择进攻球员';
    // 渲染进攻球员选择
    renderAttackerSelect();
  } else {
    actionTitle.textContent = '🛡️ 选择防守球员';
    renderDefenderSelect();
  }
}

function renderAttackerSelect() {
  if (!battleManager) return;
  const court = battleManager.getOnCourtPlayers(true);
  playerSelectEl.innerHTML = '';
  court.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-attack';
    btn.textContent = `${p.playerName} (${p.position}) ${StaminaTool.getStaminaDescription(p)}`;
    if (p.currentStamina <= 0) btn.disabled = true;
    btn.onclick = () => handlePlayerClick(p, true);
    playerSelectEl.appendChild(btn);
  });
}

function renderDefenderSelect() {
  if (!battleManager) return;
  const court = battleManager.getOnCourtPlayers(true);
  playerSelectEl.innerHTML = '';
  court.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-timeout';
    btn.textContent = `${p.playerName} (${p.position}) ${StaminaTool.getStaminaDescription(p)}`;
    if (p.currentStamina <= 0) btn.disabled = true;
    btn.onclick = () => handleHomeDefense(p);
    playerSelectEl.appendChild(btn);
  });
}

// ===================== 回调函数 =====================
function onRoundCallback(result) {
  // 已在executeRound中处理
}

function onGameCallback(result) {
  addLogMessage(`🏆 ${result.message}`, 'game_end');
  gameStatus.textContent = `🏆 ${result.message}`;
  actionTitle.textContent = '🏁 比赛结束';
  playerSelectEl.innerHTML = '';
  attackTypeSelectEl.classList.add('hidden');
  
  // 计算奖励
  const isHomeWinner = result.winner === battleManager.homePlayers[0].teamName;
  if (isHomeWinner) {
    const rewards = { easy: GameConfig.COINS.WIN_REWARD_EASY, normal: GameConfig.COINS.WIN_REWARD_NORMAL, hard: GameConfig.COINS.WIN_REWARD_HARD };
    const reward = rewards[currentBattleDifficulty] || GameConfig.COINS.WIN_REWARD_NORMAL;
    addCoins(reward);
    addLogMessage(`💰 获胜奖励 ${reward} 金币！`, 'reward');
  }
  
  showModal('比赛结束', `${result.message}${isHomeWinner ? '\n💰 获得'+reward+'金币！' : ''}`);
  
  isInBattle = false;
  setTimeout(() => {
    exitBattle();
  }, 3000);
}

function onSubstitutionCallback(side, from, to) {
  updateSubstitutionsDisplay();
}

function onTimeoutCallback(side, remaining) {
  updateTimeoutsDisplay();
}

// ===================== 对战操作按钮 =====================
function bindBattleEvents() {
  // 进攻类型按钮
  document.querySelectorAll('.btn-attack[data-type]').forEach(btn => {
    btn.onclick = () => executeAttack(btn.dataset.type);
  });
  
  if (btnTimeout) btnTimeout.onclick = () => {
    if (!battleManager) return;
    const result = battleManager.useTimeout(true);
    if (!result.success) showModal('提示', result.message);
    else {
      addLogMessage(result.message, 'timeout');
      updateTimeoutsDisplay();
      renderBattleUI();
    }
  };
  
  if (btnSubstitute) btnSubstitute.onclick = () => {
    if (!battleManager) return;
    showSubstituteUI();
  };
  
  if (btnSurrender) btnSurrender.onclick = () => {
    if (!battleManager) return;
    if (!battleManager.canSurrender()) {
      showModal('提示', '分差不够，无法投降（需落后15分以上）');
      return;
    }
    showModal('确认投降', '确定要投降吗？', () => {
      battleManager.surrender(true);
    });
  };
}

function showSubstituteUI() {
  if (!battleManager) return;
  const court = battleManager.getOnCourtPlayers(true);
  const bench = battleManager.getBenchPlayers(true);
  
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  const modal = document.getElementById('modal-overlay');
  const confirm = document.getElementById('modal-confirm');
  const cancel = document.getElementById('modal-cancel');
  
  title.textContent = '🔄 换人（只能换同位置）';
  body.innerHTML = '';
  
  court.forEach(cp => {
    const samePosBench = bench.filter(bp => bp.position === cp.position);
    if (samePosBench.length === 0) {
      const row = document.createElement('div');
      row.className = 'sub-row';
      row.innerHTML = `<span>${cp.playerName} (${cp.position})</span><span style="color:#888;">无可换替补</span>`;
      body.appendChild(row);
    } else {
      samePosBench.forEach(bp => {
        const row = document.createElement('div');
        row.className = 'sub-row';
        row.innerHTML = `<span>${cp.playerName} (${cp.position}) ⬇️</span><span>${bp.playerName} (${bp.position}) ⬆️</span>`;
        row.style.cursor = 'pointer';
        row.onclick = () => {
          const result = battleManager.substitutePlayer(true, cp, bp);
          if (!result.success) showModal('提示', result.message);
          else {
            addLogMessage(result.message, 'sub');
            renderBattleUI();
            updateSubstitutionsDisplay();
          }
          modal.classList.add('hidden');
        };
        body.appendChild(row);
      });
    }
  });
  
  confirm.textContent = '关闭';
  confirm.onclick = () => modal.classList.add('hidden');
  cancel.style.display = 'none';
  modal.classList.remove('hidden');
}

// ===================== 日志系统 =====================
function addLogMessage(message, type) {
  if (!logMessages) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const timestamp = battleManager ? `[${battleManager.currentRound}] ` : '[0] ';
  entry.textContent = timestamp + message;
  logMessages.appendChild(entry);
  logMessages.scrollTop = logMessages.scrollHeight;
}

// ===================== 弹窗系统 =====================
function showModal(title, message, onConfirm) {
  const modal = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  titleEl.textContent = title;
  bodyEl.innerHTML = message.replace(/\n/g, '<br>');
  
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
    if (onConfirm) onConfirm();
  };
  cancelBtn.style.display = 'inline-block';
  cancelBtn.onclick = () => modal.classList.add('hidden');
  modal.classList.remove('hidden');
}

// ===================== 标签页切换 =====================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const page = document.getElementById('tab-' + tab);
  const btn = document.querySelector(`.tab-btn[onclick*="${tab}"]`);
  if (page) page.classList.add('active');
  if (btn) btn.classList.add('active');
  
  if (tab === 'roster') {
    renderBackpack();
    document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
  }
  if (tab === 'home') updateHomeStats();
}

// ===================== 首页统计 =====================
function updateHomeStats() {
  const homeOverall = document.getElementById('homeOverall');
  const homeCardCount = document.getElementById('homeCardCount');
  if (homeOverall) homeOverall.textContent = getLineupOverall();
  if (homeCardCount) homeCardCount.textContent = backpack.length;
}

// ===================== UI刷新 =====================
function updateUI() {
  updateCoinDisplay();
  updateHomeStats();
  updateLineupDisplay();
  renderBackpack();
  
  // 更新阵容槽
  for (const slot of SLOTS) {
    const el = document.getElementById('slot-' + slot);
    const ovrEl = document.getElementById('slot-ovr-' + slot);
    if (el) {
      const card = lineup[slot];
      if (card) {
        const master = getMasterById(card.masterId);
        if (master) {
          const slotPos = slot.toUpperCase();
          const isMismatch = !slot.startsWith('bench') && !master.positions.includes(slotPos);
          el.textContent = master.name + (card.stars > 0 ? ' ⭐'.repeat(card.stars) : '');
          if (ovrEl) ovrEl.textContent = master.overall + (card.stars||0) * GameConfig.FUSION.OVERALL_BONUS_PER_STAR;
          el.style.color = isMismatch ? '#f44336' : '';
          el.style.fontWeight = isMismatch ? 'bold' : '';
        } else {
          el.textContent = '未知球员';
        }
      } else {
        el.textContent = '空位';
        el.style.color = '';
        el.style.fontWeight = '';
        if (ovrEl) ovrEl.textContent = '';
      }
    }
  }
  
  // 更新阵容总评标记
  const overall = document.getElementById('homeOverall');
  if (overall) {
    const ov = getLineupOverall();
    overall.textContent = ov;
  }
  
  // 阵容总评详情 - 影响因素
  const detailEl = document.getElementById('lineupDetail');
  if (detailEl) {
    detailEl.innerHTML = getLineupAnalysis();
  }
  const rosterDetailEl = document.getElementById('rosterLineupDetail');
  if (rosterDetailEl) {
    rosterDetailEl.innerHTML = '<div style="color:#ffd700;font-weight:bold;margin-bottom:4px;">阵容分析</div>' + getLineupAnalysis();
  }
  
  // 更新对战页面状态
  const battleStatus = document.getElementById('battleStatus');
  if (battleStatus) {
    if (isLineupComplete()) {
      battleStatus.textContent = '✅ 阵容已配置完毕，选择难度开始对战！';
      battleStatus.style.color = '#4caf50';
      document.querySelectorAll('.difficulty-card').forEach(c => c.style.pointerEvents = 'auto');
    } else {
      battleStatus.textContent = '⚠️ 请先配置完整阵容（5首发）';
      battleStatus.style.color = '#f44336';
      document.querySelectorAll('.difficulty-card').forEach(c => c.style.pointerEvents = 'none');
    }
  }
}

function updateLineupDisplay() {
  // 阵容槽在updateUI中已处理
}

// ===================== 键盘快捷键 =====================

// ===================== 阵容评分系统（新公式） =====================
function getLineupAnalysis() {
  const starters = ['pg','sg','sf','pf','c'];
  let count = 0;
  let spaceSum = 0, defSum = 0, paintSum = 0;
  let midSum = 0, driveSum = 0, postSum = 0, threeSum = 0;
  let playSum = 0, perimSum = 0, interSum = 0, rebSum = 0;
  
  for (const slot of starters) {
    const card = lineup[slot];
    if (!card) continue;
    const master = getMasterById(card.masterId);
    if (!master) continue;
    
    const a = master.attrs;
    
    // 1. 中投三分综合值 = 三分 * 0.7 + 中投 * 0.3
    const spaceVal = (a.threePointAttack || 60) * 0.7 + (a.midRangeShot || 60) * 0.3;
    // 2. 攻框综合值 = 突破 * 0.5 + 组织 * 0.5（drive + playmaking）
    const paintVal = (a.drive || 60) * 0.5 + (a.playmaking || 60) * 0.5;
    // 3. 防守综合值 = 外防 + 内防
    const defVal = (a.perimeterDefense || 60) + (a.interiorDefense || 60);
    
    spaceSum += spaceVal;
    defSum += defVal;
    paintSum += paintVal;
    
    midSum += a.midRangeShot || 60;
    driveSum += a.drive || 60;
    postSum += a.post || 60;
    threeSum += a.threePointAttack || 60;
    playSum += a.playmaking || 60;
    perimSum += a.perimeterDefense || 60;
    interSum += a.interiorDefense || 60;
    rebSum += a.rebounding || 60;
    
    count++;
  }
  
  if (count === 0) return '尚未配置阵容';
  
  const avgSpace = spaceSum / count;
  const avgDef = defSum / count;
  const avgPaint = paintSum / count;
  
  const avgMid = Math.round(midSum / count);
  const avgDrive = Math.round(driveSum / count);
  const avgPost = Math.round(postSum / count);
  const avgThree = Math.round(threeSum / count);
  const avgPlay = Math.round(playSum / count);
  const avgPerim = Math.round(perimSum / count);
  const avgInter = Math.round(interSum / count);
  const avgReb = Math.round(rebSum / count);
  
  // 总阵容评分 = round(avgSpace * 0.35 + avgDef * 0.4 + avgPaint * 0.25)
  const totalScore = Math.round(avgSpace * 0.35 + avgDef * 0.4 + avgPaint * 0.25);
  
  // 评分分析
  let factors = [];
  
  if (avgSpace >= 80) factors.push(['空间投射出色', true]);
  else if (avgSpace >= 65) factors.push(['空间投射一般', false]);
  else factors.push(['空间投射不佳', null]);
  
  if (avgDef >= 160) factors.push(['防守坚固', true]);
  else if (avgDef >= 130) factors.push(['防守一般', false]);
  else factors.push(['防守薄弱', null]);
  
  if (avgPaint >= 80) factors.push(['攻框能力强', true]);
  else if (avgPaint >= 65) factors.push(['攻框能力一般', false]);
  else factors.push(['攻框能力弱', null]);
  
  let html = '<div style="font-size:0.85em;color:#aaa;line-height:1.6;">';
  
  // 阵容总评（使用calcLineupOverall保持一致）
  const lineTotalScore = (typeof calcLineupOverall === 'function') ? calcLineupOverall(lineup) : totalScore;
  html += '<div style="color:#ffd700;font-weight:bold;margin-bottom:4px;">评分: ' + lineTotalScore + '</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:4px;">';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">三分:' + avgThree + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">中投:' + avgMid + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">突破:' + avgDrive + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">篮下:' + avgPost + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">篮板:' + avgReb + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">内防:' + avgInter + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">外防:' + avgPerim + '</span>';
  html += '<span style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;">组织:' + avgPlay + '</span>';
  html += '</div>';
  
  // 评分因素
  html += '<div style="display:flex;flex-wrap:wrap;gap:3px;">';
  for (const [text, good] of factors) {
    if (good === true) html += '<span style="background:rgba(76,175,80,0.15);padding:1px 6px;border-radius:4px;color:#4caf50;">' + text + ' +加分</span>';
    else if (good === null) html += '<span style="background:rgba(244,67,54,0.15);padding:1px 6px;border-radius:4px;color:#f44336;">' + text + ' -扣分</span>';
    else html += '<span style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;color:#888;">' + text + '</span>';
  }
  html += '</div></div>';
  
  return html;
}

function bindEvents() {
  // 添加存档按钮事件
  const btnSave = document.getElementById('btn-save');
  const btnLoad = document.getElementById('btn-load');
  if (btnSave) btnSave.onclick = () => { if (typeof saveGame === 'function') saveGame(); else showModal('提示', '请先登录'); };
  if (btnLoad) btnLoad.onclick = () => { if (typeof loadGame === 'function') loadGame(); else showModal('提示', '请先登录'); };
}

// 自动加载存档（登录后调用）
function autoLoadGame() {
  if (typeof loadGame === 'function') {
    // 静默加载（不弹成功提示）
    const originalModal = window.showModal;
    window.showModal = function(t, m, cb) { if (t === '加载成功') { if (cb) cb(); } else { originalModal(t, m, cb); } };
    loadGame().finally(() => { window.showModal = originalModal; });
  }
}

// ===================== 启动 =====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('NBA卡牌对战系统加载中...');
  // 确保Constants已加载
  if (typeof Constants === 'undefined') {
    console.error('Constants未加载！');
    return;
  }
  initGame();
});
