// PlayerData.js — 完整球员数据库 + 工厂函数

const MASTER_DB = [
#PLACEHOLDER#
];

// ====== 总评计算 ======
function calcOverall(attrs) {
  const weights = {
    midRangeShot: 0.15,
    drive: 0.15,
    post: 0.15,
    threePointAttack: 0.15,
    playmaking: 0.10,
    perimeterDefense: 0.10,
    interiorDefense: 0.10,
    rebounding: 0.05,
    stamina: 0.05
  };
  let total = 0;
  for (const [k, w] of Object.entries(weights)) {
    total += (attrs[k] || 60) * w;
  }
  return Math.round(total);
}

// ====== 工厂函数（兼容原比赛引擎）======

function createPlayer(config) {
  return {
    id: config.id || '',
    playerName: config.playerName || '',
    position: config.position || 'PG',
    teamName: config.teamName || '',
    attrs: {
      midRangeShot: config.attrs?.midRangeShot || 60,
      drive: config.attrs?.drive || 60,
      post: config.attrs?.post || 60,
      threePointAttack: config.attrs?.threePointAttack || 60,
      playmaking: config.attrs?.playmaking || 60,
      perimeterDefense: config.attrs?.perimeterDefense || 60,
      interiorDefense: config.attrs?.interiorDefense || 60,
      rebounding: config.attrs?.rebounding || 60,
      stamina: config.attrs?.stamina || 60
    },
    badges: config.badges || [],
    legendaryPairs: config.legendaryPairs || [],
    freeThrowRating: config.freeThrowRating !== undefined ? config.freeThrowRating : 70,
    isStarter: config.isStarter || false,
    isSubstitute: config.isSubstitute || false,
    currentStamina: 100,
    consecutiveRounds: 0,
    foulCount: 0,
    isOnCourt: false,
    isJustSubstituted: false,
    actedThisRound: false,
    totalPointsScored: 0,
    totalAssists: 0,
    totalRebounds: 0
  };
}

function createBadge(name, affectedAttr, bonusValue) {
  return { name, affectedAttr, bonusValue };
}

function resetPlayerMatchState(player) {
  player.currentStamina = 100;
  player.consecutiveRounds = 0;
  player.foulCount = 0;
  player.isOnCourt = false;
  player.isJustSubstituted = false;
  player.actedThisRound = false;
  player.totalPointsScored = 0;
  player.totalAssists = 0;
  player.totalRebounds = 0;
}

function getEffectiveAttr(player, attrName, penalty) {
  const base = player.attrs[attrName] || 0;
  return Math.max(0, base - penalty);
}

function getBaseAttr(player, attrName) {
  return player.attrs[attrName] || 0;
}

function getAllAttrNames() {
  return [
    { key: 'midRangeShot', label: '中投' },
    { key: 'drive', label: '突破' },
    { key: 'post', label: '篮下' },
    { key: 'threePointAttack', label: '三分' },
    { key: 'playmaking', label: '组织' },
    { key: 'perimeterDefense', label: '外防' },
    { key: 'interiorDefense', label: '内防' },
    { key: 'rebounding', label: '篮板' },
    { key: 'stamina', label: '体力' }
  ];
}

function createPlayerFromMaster(masterId) {
  const entry = MASTER_DB.find(e => e.id === masterId);
  if (!entry) return null;
  return createPlayer({
    id: entry.id,
    playerName: entry.name,
    position: entry.positions[0],
    teamName: entry.team,
    attrs: { ...entry.attrs }
  });
}

// ====== 数据库查询 ======
function getMasterDB() { return MASTER_DB; }
function getMasterById(id) { return MASTER_DB.find(p => p.id === id) || null; }
function getMastersByTier(tier) { return MASTER_DB.filter(p => p.tier === tier); }
function getMastersByPosition(pos) { return MASTER_DB.filter(p => p.positions.includes(pos)); }
function getTierLabel(tier) { const l={GOAT:'历史巨星',SSR:'传奇',SR:'史诗',R:'稀有',N:'普通'}; return l[tier]||tier; }
function getTierColor(tier) { const c={GOAT:'#7c3aed',SSR:'#d97706',SR:'#2563eb',R:'#16a34a',N:'#6b7280'}; return c[tier]||'#666'; }