/**
 * ============================================================================
 * StaminaTool.js — 独立体力系统工具函数
 * 体力消耗按球员自身 stamina 属性百分比计算，属性高的消耗比例低
 * ============================================================================
 */

var StaminaTool = {
  /**
   * 计算进攻体力消耗：基于球员 stamina 属性
   * stamina 属性高 → 消耗比例低（更持久）
   * 公式：消耗 = baseCost * (1 - stamina/100 * 0.5) + fatigue
   * 即：stamina=99时消耗减半，stamina=60时消耗减30%
   */
  calcAttackStaminaCost(player) {
    const baseCost = Constants.STAMINA_ATTACK_COST;  // 12
    const stamAttr = player.attrs.stamina || 60;
    // stamina属性越高，消耗越少：stamina=99→消耗50%，stamina=60→消耗70%
    const eff = baseCost * (1 - (stamAttr / 100) * 0.5);
    const fatigue = player.consecutiveRounds * Constants.STAMINA_FATIGUE_PER_ROUND;
    return Math.round(eff + fatigue);
  },

  /**
   * 计算防守体力消耗
   */
  calcDefendStaminaCost(player) {
    const baseCost = Constants.STAMINA_DEFEND_COST;  // 6
    const stamAttr = player.attrs.stamina || 60;
    const eff = baseCost * (1 - (stamAttr / 100) * 0.5);
    const fatigue = player.consecutiveRounds * Constants.STAMINA_FATIGUE_PER_ROUND;
    return Math.round(eff + fatigue);
  },

  applyAttackStamina(player) {
    const cost = this.calcAttackStaminaCost(player);
    player.currentStamina = Math.max(0, player.currentStamina - cost);
    player.consecutiveRounds += 1;
    player.actedThisRound = true;
  },

  applyDefendStamina(player) {
    const cost = this.calcDefendStaminaCost(player);
    player.currentStamina = Math.max(0, player.currentStamina - cost);
    player.consecutiveRounds += 1;
    player.actedThisRound = true;
  },

  getStaminaPenalty(player) {
    if (player.currentStamina <= Constants.STAMINA_ZERO) return 999;
    if (player.currentStamina <= Constants.STAMINA_THRESHOLD_2) return Constants.STAMINA_PENALTY_2;
    if (player.currentStamina <= Constants.STAMINA_THRESHOLD_1) return Constants.STAMINA_PENALTY_1;
    return 0;
  },

  canPlayerAttack(player) {
    return player.currentStamina > Constants.STAMINA_THRESHOLD_2;
  },

  mustSubstitute(player) {
    return player.currentStamina <= Constants.STAMINA_ZERO;
  },

  recoverOnBench(player) {
    player.currentStamina = Math.min(Constants.STAMINA_MAX, player.currentStamina + Constants.STAMINA_RECOVER_BENCH);
    player.consecutiveRounds = 0;
  },

  recoverOnTimeout(player) {
    player.currentStamina = Math.min(Constants.STAMINA_MAX, player.currentStamina + Constants.STAMINA_RECOVER_TIMEOUT);
  },

  /**
   * 本回合未操作的球员恢复体力
   */
  recoverIdle(player) {
    if (!player.actedThisRound && player.isOnCourt) {
      player.currentStamina = Math.min(Constants.STAMINA_MAX, player.currentStamina + Constants.STAMINA_RECOVER_IDLE);
    }
    player.actedThisRound = false;
  },

  initSubstitute(player) {
    player.currentStamina = Constants.STAMINA_MAX;
    player.consecutiveRounds = 0;
    player.isJustSubstituted = true;
  },

  getStaminaDescription(player) {
    const ratio = player.currentStamina / Constants.STAMINA_MAX;
    if (player.currentStamina <= 0) return '\u{1F480}体力耗尽';
    if (player.currentStamina <= 30) return \`\u{1F630}力竭(\${Math.round(ratio * 100)}%)\`;
    if (player.currentStamina <= 60) return \`\u{1F613}疲劳(\${Math.round(ratio * 100)}%)\`;
    if (player.currentStamina <= 80) return \`\u{1F44D}良好(\${Math.round(ratio * 100)}%)\`;
    return \`\u{1F4AA}充沛(\${Math.round(ratio * 100)}%)\`;
  }
};