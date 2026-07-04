/**
 * ============================================================================
 * Constants.js — NBA卡牌对战系统全局常量配置
 * ============================================================================
 */

const Constants = {
  // ===== 比赛结构（21分制） =====
  WIN_SCORE: 21,
  SURRENDER_REQUIRED_DIFF: 15,

  // ===== 球员配置 =====
  STARTERS_PER_TEAM: 5,
  BENCH_PER_TEAM: 3,
  TOTAL_PLAYERS: 8,
  POSITIONS: ['PG', 'SG', 'SF', 'PF', 'C'],

  // ===== 体力系统 =====
  STAMINA_MAX: 100,
  STAMINA_ATTACK_COST: 12,
  STAMINA_DEFEND_COST: 6,
  STAMINA_FATIGUE_PER_ROUND: 3,
  STAMINA_RECOVER_BENCH: 25,
  STAMINA_RECOVER_TIMEOUT: 10,
  STAMINA_RECOVER_IDLE: 5,        // 未操作球员每回合恢复
  STAMINA_THRESHOLD_1: 60,
  STAMINA_THRESHOLD_2: 30,
  STAMINA_PENALTY_1: 5,
  STAMINA_PENALTY_2: 12,
  STAMINA_ZERO: 0,

  // ===== 替补奇兵 =====
  SUBSTITUTE_BONUS: 7,

  // ===== 羁绊系统 =====
  SYNERGY_SAME_TEAM_2: 3,
  SYNERGY_SAME_TEAM_3: 8,
  SYNERGY_LEGENDARY_BONUS: 10,

  // ===== 传奇组合配置 =====
  LEGENDARY_PAIRS: {
    'SplashBrothers': { name: '水花兄弟', players: ['斯蒂芬·库里', '克莱·汤普森'], attrBonus: 'threePointAttack' },
    'LeBronWade': { name: '詹韦连线', players: ['勒布朗·詹姆斯', '德维恩·韦德'], attrBonus: 'midRangeShot' },
  },

  // ===== 暂停 =====
  TIMEOUTS_PER_GAME: 2,
  SUBSTITUTIONS_PER_GAME: 3,

  // ===== 犯规罚球 =====
  FOUL_LIMIT: 3,
  FREE_THROW_POINTS: 1,

  // ===== 绝杀Buff（启用） =====
  CLUTCH_BONUS: 5,

  // ===== 概率公式基础常量 =====
  SHOOT_BASE_RATE: 0.45,
  SHOOT_DIFF_COEFFICIENT: 0.003,
  SHOOT_MIN: 0.10,
  SHOOT_MAX: 0.92,

  TURNOVER_BASE_RATE: 0.15,
  TURNOVER_DIFF_COEFFICIENT: -0.002,
  TURNOVER_MIN: 0.03,
  TURNOVER_MAX: 0.30,

  FOUL_BASE_RATE: 0.15,
  FOUL_DIFF_COEFFICIENT: 0.002,
  FOUL_MIN: 0.03,
  FOUL_MAX: 0.30,

  REBOUND_DEFENSE_WEIGHT: 1.15,
  REBOUND_MIN: 0.20,
  REBOUND_MAX: 0.95,

  // ===== 传球助攻加成系数 =====
  ASSIST_BONUS_COEFFICIENT: 0.08,  // 组织者每1点playmaking给接球者加成0.08

  // ===== 枚举 =====
  AttackType: {
    MID_RANGE: 'mid_range',       // 两分中投 → midRangeShot
    DRIVE: 'drive',               // 突破攻框 → drive
    POST: 'post',                 // 篮下终结 → post
    THREE_POINT: 'three_point',   // 三分投射 → threePointAttack
    ASSIST: 'assist'              // 传球助攻
  },



  RoundResultType: {
    ATTACK_SUCCESS: 'attack_success',
    ATTACK_FAILED: 'attack_failed',
    TURNOVER: 'turnover',
    FOUL_FREE_THROW: 'foul_free_throw'
  },

  Possession: {
    HOME: 'home',
    AWAY: 'away'
  }
};
