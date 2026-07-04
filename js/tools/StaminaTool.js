/**
 * ============================================================================
 * StaminaTool.js — 独立体力系统工具函数
 * 封装所有体力消耗、衰减、恢复、惩罚计算
 * ============================================================================
 */

const StaminaTool = {
  calcAttackStaminaCost(player) {
    const fatigue = player.consecutiveRounds * Constants.STAMINA_FATIGUE_PER_ROUND;
    return Constants.STAMINA_ATTACK_COST + fatigue;
  },

  calcDefendStaminaCost(player) {
    const fatigue = player.consecutiveRounds * Constants.STAMINA_FATIGUE_PER_ROUND;
    return Constants.STAMINA_DEFEND_COST + fatigue;
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
    if (player.currentStamina <= 0) return '💀体力耗尽';
    if (player.currentStamina <= 30) return `😰力竭(${Math.round(ratio * 100)}%)`;
    if (player.currentStamina <= 60) return `😓疲劳(${Math.round(ratio * 100)}%)`;
    if (player.currentStamina <= 80) return `👍良好(${Math.round(ratio * 100)}%)`;
    return `💪充沛(${Math.round(ratio * 100)}%)`;
  }
};
