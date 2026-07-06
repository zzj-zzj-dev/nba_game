/**
 * GameConfig.js — 全局游戏配置常量
 * 所有数值集中管理，方便后期修改
 */
var GameConfig = {
  // ===== 金币系统 =====
  COINS: {
    STARTING_COINS: 500,        // 开局初始金币
    WIN_REWARD_EASY: 100,       // 简单难度获胜
    WIN_REWARD_NORMAL: 300,     // 中等难度获胜
    WIN_REWARD_HARD: 600,       // 困难难度获胜
    ENTRY_FEE_EASY: 50,         // 简单入场费
    ENTRY_FEE_NORMAL: 150,      // 中等入场费
    ENTRY_FEE_HARD: 300,        // 困难入场费
  },

  // ===== 卡包价格 =====
  PACK: {
    BASIC_PRICE: 150,           // 初级基础卡包价格
    MID_PRICE: 600,             // 中级精英卡包价格
    PREMIUM_PRICE: 2000,        // 高级巨星卡包价格
    FREE_PACKS_ON_START: 10,    // 开局免费初级卡包数
  },

  // ===== 抽卡概率 (N/R/SR/SSR/GOAT) =====
  PACK_RATES: {
    BASIC:  { N: 0.63, R: 0.28, SR: 0.06, SSR: 0.02, GOAT: 0.01 },
    MID:    { N: 0.15, R: 0.35, SR: 0.32, SSR: 0.15, GOAT: 0.03 },
    PREMIUM:{ N: 0.05, R: 0.15, SR: 0.33, SSR: 0.40, GOAT: 0.07 },
  },

  // ===== 分解金币 =====
  DECOMPOSE: {
    N: 50,
    R: 150,
    SR: 400,
    SSR: 1500,
    GOAT: 6000,
  },

  // ===== 置换价格 =====
  SWAP_COST: {
    N: 50,
    R: 50,
    SR: 100,
    SSR: 200,
    GOAT: 300,
  },

  // ===== 融合升星 =====
  FUSION: {
    ATTR_BONUS_PER_STAR: 2,     // 每次融合全属性+2
    OVERALL_BONUS_PER_STAR: 1,  // 每升1星总评+1
  },

  // ===== 位置惩罚 =====
  POSITION_PENALTY: 0.10,       // 位置不适配扣除10%属性+总评

  // ===== 阵容配置 =====
  TEAM: {
    STARTERS: 5,
    BENCH: 3,
    TOTAL: 8,
  },

  // ===== LocalStorage键 =====
  LS_KEYS: {
    COINS: 'nba_card_coins',
    BACKPACK: 'nba_card_backpack',
    LINEUP: 'nba_card_lineup',
    FREE_PACKS_CLAIMED: 'nba_card_free_packs_claimed',
  }
};

// 联赛难度定义
var DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

// 获取难度配置
function getDifficultyConfig(diff) {
  const config = {
    [DIFFICULTY.EASY]: {
      label: '简单',
      entryFee: GameConfig.COINS.ENTRY_FEE_EASY,
      reward: GameConfig.COINS.WIN_REWARD_EASY,
      aiDifficulty: 'easy',
    },
    [DIFFICULTY.NORMAL]: {
      label: '中等',
      entryFee: GameConfig.COINS.ENTRY_FEE_NORMAL,
      reward: GameConfig.COINS.WIN_REWARD_NORMAL,
      aiDifficulty: 'normal',
    },
    [DIFFICULTY.HARD]: {
      label: '困难',
      entryFee: GameConfig.COINS.ENTRY_FEE_HARD,
      reward: GameConfig.COINS.WIN_REWARD_HARD,
      aiDifficulty: 'hard',
    },
  };
  return config[diff] || config[Difficulty.NORMAL];
}
