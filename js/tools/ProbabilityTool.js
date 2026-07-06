/**
 * ============================================================================
 * ProbabilityTool.js — 全套概率随机判定机制
 * 投篮成功率、失误/犯规概率、篮板概率
 * ============================================================================
 */

var ProbabilityTool = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  random() {
    return Math.random();
  },

  /**
   * 投篮成功概率（通用）
   */
  calcShootSuccessRate(atk, def) {
    const diff = atk - def;
    const baseRate = Constants.SHOOT_BASE_RATE;
    const correction = diff * Constants.SHOOT_DIFF_COEFFICIENT;
    return this.clamp(baseRate + correction, Constants.SHOOT_MIN, Constants.SHOOT_MAX);
  },

  calcTurnoverRate(atk, def) {
    const diff = atk - def;
    const correction = diff * Constants.TURNOVER_DIFF_COEFFICIENT;
    return this.clamp(Constants.TURNOVER_BASE_RATE + correction, Constants.TURNOVER_MIN, Constants.TURNOVER_MAX);
  },

  calcFoulRate(atk, def) {
    const diff = atk - def;
    const correction = diff * Constants.FOUL_DIFF_COEFFICIENT;
    return this.clamp(Constants.FOUL_BASE_RATE + correction, Constants.FOUL_MIN, Constants.FOUL_MAX);
  },

  calcReboundProb(rebAtk, rebDef) {
    const defWeight = rebDef * Constants.REBOUND_DEFENSE_WEIGHT;
    const offWeight = rebAtk;
    const totalWeight = defWeight + offWeight;
    const defProb = this.clamp(defWeight / totalWeight, Constants.REBOUND_MIN, Constants.REBOUND_MAX);
    return { defReboundProb: defProb, offReboundProb: 1 - defProb };
  },

  judgeShootSuccess(atk, def) {
    return this.random() <= this.calcShootSuccessRate(atk, def);
  },

  judgeTurnover(atk, def) {
    return this.random() <= this.calcTurnoverRate(atk, def);
  },

  judgeFoul(atk, def) {
    return this.random() <= this.calcFoulRate(atk, def);
  },

  judgeRebound(rebAtk, rebDef) {
    const { defReboundProb } = this.calcReboundProb(rebAtk, rebDef);
    return this.random() <= defReboundProb ? 'defense' : 'offense';
  }
};
