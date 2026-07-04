/**
 * ============================================================================
 * PlayerData.js — 球员卡牌数据结构与工厂函数
 * 8大对战属性：midRangeShot(中投), drive(突破), post(篮下),
 *              threePointAttack(三分), playmaking(组织),
 *              perimeterDefense(外防), interiorDefense(内防), rebounding(篮板)
 * ============================================================================
 */

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
      rebounding: config.attrs?.rebounding || 60
    },

    badges: config.badges || [],
    legendaryPairs: config.legendaryPairs || [],
    freeThrowRating: config.freeThrowRating !== undefined ? config.freeThrowRating : 70,

    isStarter: config.isStarter || false,
    isSubstitute: config.isSubstitute || false,

    // 比赛状态
    currentStamina: Constants.STAMINA_MAX,
    consecutiveRounds: 0,
    foulCount: 0,
    isOnCourt: false,
    isJustSubstituted: false,
    actedThisRound: false,   // 本回合是否操作过
    totalPointsScored: 0,
    totalAssists: 0,
    totalRebounds: 0
  };
}

function createBadge(name, affectedAttr, bonusValue) {
  return { name, affectedAttr, bonusValue };
}

function resetPlayerMatchState(player) {
  player.currentStamina = Constants.STAMINA_MAX;
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

/**
 * 获取所有属性名称（用于长按展示）
 */
function getAllAttrNames() {
  return [
    { key: 'midRangeShot', label: '中投' },
    { key: 'drive', label: '突破' },
    { key: 'post', label: '篮下' },
    { key: 'threePointAttack', label: '三分' },
    { key: 'playmaking', label: '组织' },
    { key: 'perimeterDefense', label: '外防' },
    { key: 'interiorDefense', label: '内防' },
    { key: 'rebounding', label: '篮板' }
  ];
}
