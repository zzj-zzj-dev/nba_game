/**
 * ============================================================================
 * AIOpponent.js — AI对手决策系统
 * 负责AI选择进攻球员、进攻类型、防守球员及换人决策
 * ============================================================================
 */

const Difficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

class AIOpponent {
  constructor(difficulty = Difficulty.NORMAL) {
    this.difficulty = difficulty;
    // 根据难度设置倾向参数
    switch (difficulty) {
      case Difficulty.EASY:
        this.aggressiveness = 0.3;
        this.threePointTendency = 0.2;
        this.conservative = 0.7;
        break;
      case Difficulty.NORMAL:
        this.aggressiveness = 0.5;
        this.threePointTendency = 0.35;
        this.conservative = 0.5;
        break;
      case Difficulty.HARD:
        this.aggressiveness = 0.7;
        this.threePointTendency = 0.45;
        this.conservative = 0.3;
        break;
    }
  }

  /**
   * 选择进攻球员
   * @param {Array} courtPlayers - 场上球员
   * @param {Object} gameContext - 游戏上下文
   * @returns {Object} 球员对象
   */
  chooseAttacker(courtPlayers, gameContext) {
    const candidates = courtPlayers.filter(p => StaminaTool.canPlayerAttack(p));
    let pool = candidates.length > 0 ? candidates : courtPlayers;

    // 对候选人评分
    const scored = pool.map(p => ({
      player: p,
      score: this._evaluateAttackValue(p, gameContext)
    }));

    // 简单难度随机扰乱
    if (this.difficulty === Difficulty.EASY && Math.random() < 0.3) {
      scored.sort(() => Math.random() - 0.5);
    } else {
      scored.sort((a, b) => b.score - a.score);
    }
    return scored[0].player;
  }

  /**
   * 评估球员进攻价值
   */
  _evaluateAttackValue(player, context) {
    const mid = getBaseAttr(player, 'midRangeShot');
    const drive = getBaseAttr(player, 'drive');
    const post = getBaseAttr(player, 'post');
    const threePt = getBaseAttr(player, 'threePointAttack');
    const playmaking = getBaseAttr(player, 'playmaking');
    let score = (mid + drive + post + threePt + playmaking) / 5;
    // 体力比例加成
    const staminaRatio = player.currentStamina / Constants.STAMINA_MAX;
    score *= (0.5 + staminaRatio * 0.5);
    // 替补奇兵加成
    if (player.isJustSubstituted) {
      score += Constants.SUBSTITUTE_BONUS;
    }
    // 落后时更激进
    const scoreDiff = context.scoreDiff || 0;
    if (scoreDiff < -10) score *= 1.2;
    return score;
  }

  /**
   * 选择进攻类型
   * @param {Object} attacker
   * @param {Object} gameContext
   * @returns {string} 'mid_range' | 'drive' | 'post' | 'three_point' | 'assist'
   */
  chooseAttackType(attacker, gameContext) {
    const mid = getBaseAttr(attacker, 'midRangeShot');
    const drive = getBaseAttr(attacker, 'drive');
    const post = getBaseAttr(attacker, 'post');
    const threePt = getBaseAttr(attacker, 'threePointAttack');
    const playmaking = getBaseAttr(attacker, 'playmaking');
    const roll = Math.random();
    const scoreDiff = gameContext.scoreDiff || 0;
    // 分差影响三分倾向
    let threeBonus = 0;
    if (scoreDiff < -10) threeBonus = 0.15;
    else if (scoreDiff > 10) threeBonus = -0.1;
    const threeProb = ProbabilityTool.clamp(
      this.threePointTendency + (threePt - 70) / 100 + threeBonus,
      0.1, 0.6
    );
    const assistProb = ProbabilityTool.clamp(
      (playmaking - 60) / 100 * 0.3,
      0.05, 0.3
    );
    if (roll < threeProb) return Constants.AttackType.THREE_POINT;
    if (roll < threeProb + assistProb) return Constants.AttackType.ASSIST;
    // 两分球细分
    const typeRoll = Math.random();
    if (typeRoll < 0.4) return Constants.AttackType.MID_RANGE;
    if (typeRoll < 0.7) return Constants.AttackType.DRIVE;
    return Constants.AttackType.POST;
  }

  /**
   * 选择防守球员（同位置对位）
   * @param {Object} attacker
   * @param {Array} courtPlayers
   * @returns {Object} 防守球员
   */
  chooseDefender(attacker, courtPlayers) {
    const pos = attacker.position;
    // 优先同位置可防守球员
    const samePosPlayers = courtPlayers.filter(
      p => p.position === pos && p.currentStamina > 0
    );
    if (samePosPlayers.length > 0) {
      let best = samePosPlayers[0];
      let bestScore = -999;
      for (const p of samePosPlayers) {
        const score = this._evaluateDefendValue(p, attacker);
        if (score > bestScore) { bestScore = score; best = p; }
      }
      return best;
    }
    // 无同位置则选防守最强
    const sorted = [...courtPlayers].sort((a, b) => {
      const aDef = getBaseAttr(a, 'perimeterDefense') + getBaseAttr(a, 'interiorDefense');
      const bDef = getBaseAttr(b, 'perimeterDefense') + getBaseAttr(b, 'interiorDefense');
      return bDef - aDef;
    });
    return sorted[0];
  }

  /**
   * 评估防守球员价值
   */
  _evaluateDefendValue(defender, attacker) {
    const perimD = getBaseAttr(defender, 'perimeterDefense');
    const interD = getBaseAttr(defender, 'interiorDefense');
    let score = (perimD + interD) / 2;
    const staminaRatio = defender.currentStamina / Constants.STAMINA_MAX;
    score *= (0.6 + staminaRatio * 0.4);
    if (defender.isJustSubstituted) score += Constants.SUBSTITUTE_BONUS;
    return score;
  }

  /**
   * 换人决策
   * @param {Array} courtPlayers
   * @param {Array} benchPlayers
   * @param {Object} gameContext
   * @returns {Object|null} { from, to } 或 null
   */
  decideSubstitution(courtPlayers, benchPlayers, gameContext) {
    // 体力归零强制换
    for (const p of courtPlayers) {
      if (StaminaTool.mustSubstitute(p)) {
        const best = this._findBestSubstitute(p, benchPlayers);
        if (best) return { from: p, to: best };
      }
    }
    // 体力≤30 考虑换
    for (const p of courtPlayers) {
      if (p.currentStamina <= Constants.STAMINA_THRESHOLD_2) {
        const best = this._findBestSubstitute(p, benchPlayers);
        if (best && (this.difficulty === Difficulty.HARD || Math.random() < 0.5)) {
          return { from: p, to: best };
        }
      }
    }
    // 节末换体力低的
    if (gameContext.isEndOfQuarter) {
      for (const p of courtPlayers) {
        if (p.currentStamina <= Constants.STAMINA_THRESHOLD_1) {
          const best = this._findBestSubstitute(p, benchPlayers);
          if (best && Math.random() < 0.4) return { from: p, to: best };
        }
      }
    }
    return null;
  }

  _findBestSubstitute(toReplace, bench) {
    const samePos = bench.filter(p => p.position === toReplace.position);
    if (samePos.length === 0) return null;
    let best = samePos[0];
    let bestScore = -999;
    for (const p of samePos) {
      const score = (
        getBaseAttr(p, 'midRangeShot') +
        getBaseAttr(p, 'drive') +
        getBaseAttr(p, 'post') +
        getBaseAttr(p, 'threePointAttack') +
        getBaseAttr(p, 'perimeterDefense') +
        getBaseAttr(p, 'interiorDefense')
      ) / 6;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    return best;
  }

  /**
   * 是否使用暂停
   */
  shouldUseTimeout(gameContext, timeoutsLeft) {
    if (timeoutsLeft <= 0) return false;
    const scoreDiff = gameContext.scoreDiff || 0;
    const quarter = gameContext.quarter || 1;
    const roundNum = gameContext.round || 1;
    if (scoreDiff < -10) {
      if ((quarter === 2 && roundNum >= 4) || (quarter === 4 && roundNum <= 3)) return true;
      if ((gameContext.consecutiveScores || 0) >= 3) return true;
    }
    if (quarter === 4 && roundNum >= 5 && scoreDiff < 0 && scoreDiff >= -5) return true;
    if ((gameContext.lowStaminaCount || 0) >= 3) return true;
    return false;
  }

  resetForNewGame() {
    // 加一点随机变化
    switch (this.difficulty) {
      case Difficulty.EASY:
        this.aggressiveness = 0.3 + Math.random() * 0.1;
        break;
      case Difficulty.NORMAL:
        this.aggressiveness = 0.4 + Math.random() * 0.2;
        break;
      case Difficulty.HARD:
        this.aggressiveness = 0.6 + Math.random() * 0.2;
        break;
    }
  }
}
