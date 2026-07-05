/**
 * TeamData.js — 从MASTER_DB生成/构建球队
 * 支持随机生成和指定球员
 */

// 生成随机球队（用于人机对战AI）
function generateRandomTeam(name, difficulty = 'normal') {
  const db = getMasterDB();
  if (!db || db.length === 0) return { home: [], away: [] };

  // 根据难度确定阵容质量
  let tierWeights;
  switch(difficulty) {
    case 'easy':  tierWeights = { GOAT: 0, SSR: 0.1, SR: 0.4, R: 0.3, N: 0.2 }; break;
    case 'normal': tierWeights = { GOAT: 0.05, SSR: 0.25, SR: 0.4, R: 0.2, N: 0.1 }; break;
    case 'hard':  tierWeights = { GOAT: 0.2, SSR: 0.4, SR: 0.3, R: 0.07, N: 0.03 }; break;
    default:      tierWeights = { GOAT: 0.05, SSR: 0.25, SR: 0.4, R: 0.2, N: 0.1 };
  }

  // 按位置抽取
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  const benchPositions = ['PG', 'SG', 'SF', 'PF', 'C'];

  const starters = [];
  const bench = [];

  // 抽取首发
  const usedIds = new Set();
  for (const pos of positions) {
    const player = pickPlayerForPosition(pos, tierWeights, usedIds);
    if (player) {
      usedIds.add(player.id);
      starters.push(player);
    }
  }

  // 抽取替补（3人，从剩下位置选）
  const benchPicks = ['PG', 'SG', 'SF']; // 替补优先选外线
  for (let i = 0; i < 3; i++) {
    const pos = benchPositions[i % benchPositions.length];
    const player = pickPlayerForPosition(pos, tierWeights, usedIds);
    if (player) {
      usedIds.add(player.id);
      bench.push(player);
    }
  }

  // 如果没有足够球员，补位
  const allPlayers = [...starters, ...bench];
  const totalPlayers = GameConfig.TEAM.TOTAL;

  // 创建球队
  const team = [];
  allPlayers.forEach((p, i) => {
    const cp = createPlayerFromMaster(p.id);
    if (cp) {
      cp.isStarter = i < GameConfig.TEAM.STARTERS;
      cp.isSubstitute = i >= GameConfig.TEAM.STARTERS;
      cp.teamName = name;
      team.push(cp);
    }
  });

  return team;
}

// 按位置和档位权重随机选球员
function pickPlayerForPosition(pos, tierWeights, usedIds) {
  const db = getMasterDB();
  // 可选球员（可打该位置的，未使用的）
  let candidates = db.filter(p => p.positions.includes(pos) && !usedIds.has(p.id));
  if (candidates.length === 0) {
    candidates = db.filter(p => !usedIds.has(p.id)).slice(0, 5);
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

  // 从该档位选（若无则降低档位）
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

  // 随机选一个
  return pool[Math.floor(Math.random() * pool.length)];
}

// 从背包阵容创建比赛用球员
function createMatchPlayersFromLineup(lineup) {
  const team = [];
  const allSlots = ['pg','sg','sf','pf','c','bench1','bench2','bench3'];
  allSlots.forEach((slot, i) => {
    const cardId = lineup[slot];
    if (cardId) {
      const card = getBackpackCardById(cardId);
      if (card) {
        const cp = createPlayerFromMaster(card.masterId);
        if (cp) {
          cp.isStarter = i < GameConfig.TEAM.STARTERS;
          cp.isSubstitute = i >= GameConfig.TEAM.STARTERS;
          cp.id = card.id;
          // 应用星级加成
          if (card.stars && card.stars > 0) {
            const bonus = card.stars * GameConfig.FUSION.ATTR_BONUS_PER_STAR;
            for (const key of Object.keys(cp.attrs)) {
              cp.attrs[key] += bonus;
            }
          }
          team.push(cp);
        }
      }
    }
  });
  return team;
}

// 计算阵容总评
function calcLineupOverall(lineup) {
  let total = 0;
  let count = 0;
  const allSlots = ['pg','sg','sf','pf','c','bench1','bench2','bench3'];
  allSlots.forEach(slot => {
    const cardId = lineup[slot];
    if (cardId) {
      const card = getBackpackCardById(cardId);
      if (card) {
        const base = card.overall || 80;
        const starBonus = (card.stars || 0) * GameConfig.FUSION.OVERALL_BONUS_PER_STAR;
        total += base + starBonus;
        count++;
      }
    }
  });
  return count > 0 ? Math.round(total / count) : 0;
}
