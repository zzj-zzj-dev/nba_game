/**
 * TeamData.js — 从MASTER_DB生成/构建球队
 * 支持随机生成和指定球员
 */

// 生成随机球队（用于人机对战AI）
function generateRandomTeam(name, difficulty = 'normal') {
  const db = getMasterDB();
  if (!db || db.length === 0) return [];

  // 根据难度确定阵容质量
  const tierWeightsMap = {
    'easy':   { GOAT: 0, SSR: 0.1, SR: 0.4, R: 0.3, N: 0.2 },
    'normal': { GOAT: 0.05, SSR: 0.25, SR: 0.4, R: 0.2, N: 0.1 },
    'hard':   { GOAT: 0.2, SSR: 0.4, SR: 0.3, R: 0.07, N: 0.03 },
  };
  const tierWeights = tierWeightsMap[difficulty] || tierWeightsMap.normal;

  // 按位置抽取（5首发 + 3替补）
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  const benchPositions = ['PG', 'SG', 'SF'];

  const usedIds = new Set();
  const starters = [];

  // 每个位置抽首发
  for (const pos of positions) {
    const player = pickPlayerForPosition(pos, tierWeights, usedIds);
    if (player) {
      usedIds.add(player.id);
      starters.push(player);
    }
  }

  // 替补（3人）
  const bench = [];
  for (let i = 0; i < 3; i++) {
    const pos = benchPositions[i];
    const player = pickPlayerForPosition(pos, tierWeights, usedIds);
    if (player) {
      usedIds.add(player.id);
      bench.push(player);
    }
  }

  // 创建球队数组
  const allPlayers = [...starters, ...bench];
  const team = [];
  allPlayers.forEach((p, i) => {
    const cp = createPlayerFromMaster(p.id);
    if (cp) {
      cp.isStarter = i < 5;
      cp.isSubstitute = i >= 5;
      cp.teamName = name;
      team.push(cp);
    }
  });

  return team;
}

// 按位置和档位权重随机选球员
function pickPlayerForPosition(pos, tierWeights, usedIds) {
  const db = getMasterDB();
  let candidates = db.filter(p => p.positions.includes(pos) && !usedIds.has(p.id));
  if (candidates.length === 0) {
    candidates = db.filter(p => !usedIds.has(p.id)).slice(0, 10);
  }
  if (candidates.length === 0) return null;

  // 按权重选档位
  const r = Math.random();
  let cum = 0;
  let selectedTier = 'N';
  for (const [tier, w] of Object.entries(tierWeights)) {
    cum += w;
    if (r <= cum) { selectedTier = tier; break; }
  }

  // 找该档位可用球员
  let pool = candidates.filter(p => p.tier === selectedTier);
  let tries = 0;
  while (pool.length === 0 && tries < 5) {
    const tiers = Object.keys(tierWeights);
    const idx = tiers.indexOf(selectedTier);
    if (idx > 0) selectedTier = tiers[idx - 1];
    else break;
    pool = candidates.filter(p => p.tier === selectedTier);
    tries++;
  }
  if (pool.length === 0) pool = candidates;

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 从阵容（card对象）创建比赛用球员列表
 * lineup格式: { pg: cardObj, sg: cardObj, ..., bench1: cardObj, ... }
 * cardObj格式: { id, masterId, stars, inLineup }
 */
function createMatchPlayersFromLineup(lineup) {
  const team = [];
  const allSlots = ['pg','sg','sf','pf','c','bench1','bench2','bench3'];
  const lsKeys = Object.keys(localStorage);
  
  // 如果是刚加载，lineup存的是card对象
  // 如果是旧格式，lineup[slot] = card对象
  allSlots.forEach((slot, i) => {
    const card = lineup[slot];
    if (!card) return;
    
    // 从master创建球员
    const cp = createPlayerFromMaster(card.masterId);
    if (!cp) return;
    
    cp.isStarter = i < 5;
    cp.isSubstitute = i >= 5;
    cp.id = card.id;
    
    // 应用星级加成
    const starBonus = (card.stars || 0) * (GameConfig ? GameConfig.FUSION.ATTR_BONUS_PER_STAR : 2);
    if (starBonus > 0) {
      for (const key of Object.keys(cp.attrs)) {
        cp.attrs[key] += starBonus;
      }
    }
    
    // 应用位置惩罚（首发）
    if (!slot.startsWith('bench')) {
      const slotPos = slot.toUpperCase();
      const master = getMasterById(card.masterId);
      if (master && !master.positions.includes(slotPos)) {
        const penalty = (GameConfig ? GameConfig.POSITION_PENALTY : 0.10);
        for (const key of Object.keys(cp.attrs)) {
          cp.attrs[key] = Math.round(cp.attrs[key] * (1 - penalty));
        }
      }
    }
    
    team.push(cp);
  });
  
  return team;
}

/**
 * 计算阵容总评（9属性加权平均）
 * 位置不适配时总评扣10%
 */
function calcLineupOverall(lineup) {
  const starters = ['pg','sg','sf','pf','c'];
  let count = 0;
  let spaceSum = 0, defSum = 0, paintSum = 0;
  
  for (const slot of starters) {
    const card = lineup[slot];
    if (!card) continue;
    
    const master = getMasterById(card.masterId);
    if (!master) continue;
    
    const a = master.attrs;
    
    // 中投三分综合值 = 三分*0.7 + 中投*0.3
    const spaceVal = (a.threePointAttack || 60) * 0.7 + (a.midRangeShot || 60) * 0.3;
    // 攻框综合值 = 突破*0.5 + 组织*0.5
    const paintVal = (a.drive || 60) * 0.5 + (a.playmaking || 60) * 0.5;
    // 防守综合值 = 外防 + 内防
    const defVal = (a.perimeterDefense || 60) + (a.interiorDefense || 60);
    
    spaceSum += spaceVal;
    defSum += defVal;
    paintSum += paintVal;
    count++;
  }
  
  if (count === 0) return 0;
  
  const avgSpace = spaceSum / count;
  const avgDef = defSum / count;
  const avgPaint = paintSum / count;
  
  // 总阵容评分 = round(avgSpace * 0.35 + avgDef * 0.4 + avgPaint * 0.25)
  return Math.round(avgSpace * 0.35 + avgDef * 0.4 + avgPaint * 0.25);
}
