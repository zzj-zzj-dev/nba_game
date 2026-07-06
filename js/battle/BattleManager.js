/**
 * ============================================================================
 * BattleManager.js — 核心比赛引擎
 * 管理：回合流程、得分、犯规、罚球、篮板、体力、球权转换、绝杀、加时、换人、暂停
 * ============================================================================
 */

class BattleManager {
  constructor() {
    this.homePlayers = [];
    this.awayPlayers = [];
    this.homeScore = 0;
    this.awayScore = 0;
    this.currentRound = 0;
    this.possession = Constants.Possession.HOME;
    this.homeTimeouts = Constants.TIMEOUTS_PER_GAME;
    this.awayTimeouts = Constants.TIMEOUTS_PER_GAME;
    this.homeSubstitutions = Constants.SUBSTITUTIONS_PER_GAME;
    this.awaySubstitutions = Constants.SUBSTITUTIONS_PER_GAME;
    this.gameOver = false;
    this.gameWinner = null;
    this.surrenderEnd = false;
    this.aiOpponent = null;
    this.callbacks = {};
  }

  setCallbacks(cbs) {
    this.callbacks = cbs || {};
  }

  // ===================== 初始化 =====================

  initializeGame(homePlayers, awayPlayers, playerIsHome = true, difficulty = Difficulty.NORMAL) {
    this.homePlayers = homePlayers.map(p => {
      const copy = { ...p, attrs: { ...p.attrs }, badges: [...(p.badges || [])], legendaryPairs: [...(p.legendaryPairs || [])] };
      resetPlayerMatchState(copy);
      return copy;
    });
    this.awayPlayers = awayPlayers.map(p => {
      const copy = { ...p, attrs: { ...p.attrs }, badges: [...(p.badges || [])], legendaryPairs: [...(p.legendaryPairs || [])] };
      resetPlayerMatchState(copy);
      return copy;
    });

    this.homeScore = 0;
    this.awayScore = 0;
    this.currentRound = 0;
    this.possession = Constants.Possession.HOME;
    this.homeTimeouts = Constants.TIMEOUTS_PER_GAME;
    this.awayTimeouts = Constants.TIMEOUTS_PER_GAME;
    this.homeSubstitutions = Constants.SUBSTITUTIONS_PER_GAME;
    this.awaySubstitutions = Constants.SUBSTITUTIONS_PER_GAME;
    this.gameOver = false;
    this.gameWinner = null;
    this.surrenderEnd = false;

    this._setupCourt();
    this._initSynergies();

    const isHumanHome = playerIsHome;
    this.aiOpponent = new AIOpponent(difficulty);
    
    // 阵容评分差值削弱
    this._applyLineupScorePenalty();
  }


  // ===== 阵容评分差值削弱 =====
  _applyLineupScorePenalty() {
    function _calcTeamScore(players) {
      const starters = players.filter(p => p.isStarter);
      if (starters.length === 0) return 0;
      let spaceSum = 0, defSum = 0, paintSum = 0;
      for (const p of starters) {
        const a = p.attrs;
        const spaceVal = (a.threePointAttack || 60) * 0.7 + (a.midRangeShot || 60) * 0.3;
        const paintVal = (a.drive || 60) * 0.5 + (a.playmaking || 60) * 0.5;
        const defVal = (a.perimeterDefense || 60) + (a.interiorDefense || 60);
        spaceSum += spaceVal;
        defSum += defVal;
        paintSum += paintVal;
      }
      const avgSpace = spaceSum / starters.length;
      const avgDef = defSum / starters.length;
      const avgPaint = paintSum / starters.length;
      return Math.round(avgSpace * 0.35 + avgDef * 0.4 + avgPaint * 0.25);
    }
    
    const scoreHome = _calcTeamScore(this.homePlayers);
    const scoreAway = _calcTeamScore(this.awayPlayers);
    
    if (scoreHome < scoreAway) {
      // 主场弱，削弱主场所有球员（首发+替补）
      const penalty = 2;
      for (const p of this.homePlayers) {
        p.attrs.midRangeShot = Math.max(0, (p.attrs.midRangeShot || 60) - penalty);
        p.attrs.drive = Math.max(0, (p.attrs.drive || 60) - penalty);
        p.attrs.post = Math.max(0, (p.attrs.post || 60) - penalty);
        p.attrs.threePointAttack = Math.max(0, (p.attrs.threePointAttack || 60) - penalty);
        p.attrs.playmaking = Math.max(0, (p.attrs.playmaking || 60) - penalty);
        p.attrs.perimeterDefense = Math.max(0, (p.attrs.perimeterDefense || 60) - penalty);
        p.attrs.interiorDefense = Math.max(0, (p.attrs.interiorDefense || 60) - penalty);
        p.attrs.rebounding = Math.max(0, (p.attrs.rebounding || 60) - penalty);
      }
    } else if (scoreAway < scoreHome) {
      // 客场弱，削弱客场所有球员
      const penalty = 2;
      for (const p of this.awayPlayers) {
        p.attrs.midRangeShot = Math.max(0, (p.attrs.midRangeShot || 60) - penalty);
        p.attrs.drive = Math.max(0, (p.attrs.drive || 60) - penalty);
        p.attrs.post = Math.max(0, (p.attrs.post || 60) - penalty);
        p.attrs.threePointAttack = Math.max(0, (p.attrs.threePointAttack || 60) - penalty);
        p.attrs.playmaking = Math.max(0, (p.attrs.playmaking || 60) - penalty);
        p.attrs.perimeterDefense = Math.max(0, (p.attrs.perimeterDefense || 60) - penalty);
        p.attrs.interiorDefense = Math.max(0, (p.attrs.interiorDefense || 60) - penalty);
        p.attrs.rebounding = Math.max(0, (p.attrs.rebounding || 60) - penalty);
      }
    }
  }

  _setupCourt() {
    this.homePlayers.forEach(p => p.isOnCourt = p.isStarter);
    this.awayPlayers.forEach(p => p.isOnCourt = p.isStarter);
  }

  _initSynergies() {
    this._calcSynergies(this.homePlayers, 'home');
    this._calcSynergies(this.awayPlayers, 'away');
  }

  _calcSynergies(players, teamSide) {
    const courtPlayers = players.filter(p => p.isOnCourt);
    const sameTeamCount = courtPlayers.length;
    players.forEach(p => {
      p._synergyBonus = 0;
      if (sameTeamCount >= 3) p._synergyBonus = Constants.SYNERGY_SAME_TEAM_3;
      else if (sameTeamCount >= 2) p._synergyBonus = Constants.SYNERGY_SAME_TEAM_2;
      else p._synergyBonus = 0;

      // 传奇组合加成
      const activePairs = this._getActiveLegendaryPairs(players, teamSide);
      activePairs.forEach(pair => {
        const config = Constants.LEGENDARY_PAIRS[pair];
        if (config && config.players.includes(p.playerName)) {
          p._synergyBonus += Constants.SYNERGY_LEGENDARY_BONUS;
        }
      });
    });
  }

  _getActiveLegendaryPairs(players, teamSide) {
    const courtNames = new Set(players.filter(p => p.isOnCourt).map(p => p.playerName));
    const active = [];
    for (const [key, config] of Object.entries(Constants.LEGENDARY_PAIRS)) {
      const allPresent = config.players.every(name => courtNames.has(name));
      if (allPresent) active.push(key);
    }
    return active;
  }

  // ===================== 核心回合执行 =====================

  /**
   * 玩家主动进攻回合
   */
  executeRound(attacker, attackType, defender) {
    if (this.gameOver) return null;
    this.currentRound++;

    // 自动选择防守球员（不再让玩家选择）
    if (!defender) {
      defender = this._autoSelectDefender(attacker);
    }

    const result = this._processRound(attacker, attackType, defender);

    // 所有未在本回合操作的场上球员恢复体力
    this._recoverIdlePlayers();

    if (this.callbacks.onRound) this.callbacks.onRound(result);
    return result;
  }

  /**
   * AI回合（玩家需要选择防守）
   */
  executeAIRound(defender) {
    if (this.gameOver) return null;
    this.currentRound++;

    const offenseTeam = this.getOffenseTeamData();
    const defenseTeam = this.getDefenseTeamData();
    const context = this._buildGameContext();
    const aiAttacker = this.aiOpponent.chooseAttacker(offenseTeam.court, context);
    const aiAttackType = this.aiOpponent.chooseAttackType(aiAttacker, context);

    // 自动选择防守球员（AI回合不需要玩家选择）
    if (!defender) {
      defender = this._autoSelectDefender(aiAttacker);
    }

    const result = this._processRound(aiAttacker, aiAttackType, defender);

    // 所有未在本回合操作的场上球员恢复体力
    this._recoverIdlePlayers();

    if (this.callbacks.onRound) this.callbacks.onRound(result);
    return result;
  }

  /**
   * 处理单个回合的核心逻辑
   */
  _processRound(attacker, attackType, defender) {
    // 判断是否是进攻方
    const isHomeOffense = this.possession === Constants.Possession.HOME;
    const offenseTeam = isHomeOffense ? this.homePlayers : this.awayPlayers;
    const defenseTeam = isHomeOffense ? this.awayPlayers : this.homePlayers;
    const offenseSide = isHomeOffense ? 'home' : 'away';

    // 获取数值
    const { atkEffective, defEffective, usedAttr, usedDefAttr } = this._getEffectiveValues(attacker, defender, attackType);

    // 1. 先判定失误
    if (ProbabilityTool.judgeTurnover(atkEffective, defEffective)) {
      StaminaTool.applyAttackStamina(attacker);
      StaminaTool.applyDefendStamina(defender);
      this._swapPossession();
      return {
        type: 'turnover',
        message: `❌ ${attacker.playerName} 失误！球权转换！`,
        attacker: attacker.playerName,
        defender: defender.playerName,
        attackType
      };
    }

    // 2. 判定犯规
    const foul = ProbabilityTool.judgeFoul(atkEffective, defEffective);
    if (foul) {
      StaminaTool.applyAttackStamina(attacker);
      StaminaTool.applyDefendStamina(defender);
      defender.foulCount += 1;

      // 罚球
      const ftMade = this._executeFreeThrow(attacker);
      if (ftMade) {
        this._addScore(offenseSide, 1);
        this._swapPossession(); // 罚球命中后球权转换
        // 检查是否达到21分获胜
        if (this._checkWinCondition()) return null;
      }

      let foulResult;
      if (defender.foulCount >= Constants.FOUL_LIMIT) {
        foulResult = {
          type: 'foul_out',
          message: `🟡 ${defender.playerName} 犯规！${attacker.playerName} 罚球${ftMade ? '命中' : '不中'}！${defender.playerName} 已${Constants.FOUL_LIMIT}犯！`,
          attacker: attacker.playerName,
          defender: defender.playerName,
          foulCount: defender.foulCount,
          points: ftMade ? 1 : 0,
          attackType
        };
      } else {
        foulResult = {
          type: 'foul',
          message: `🟡 ${defender.playerName} 犯规！${attacker.playerName} 罚球${ftMade ? '命中' : '不中'}！`,
          attacker: attacker.playerName,
          defender: defender.playerName,
          points: ftMade ? 1 : 0,
          attackType
        };
      }

      return foulResult;
    }

    // 3. 投篮命中判定
    const success = ProbabilityTool.judgeShootSuccess(atkEffective, defEffective);

    if (success) {
      // 命中
      StaminaTool.applyAttackStamina(attacker);
      StaminaTool.applyDefendStamina(defender);

      let points = 0;
      if (attackType === Constants.AttackType.THREE_POINT) {
        points = 3;
      } else {
        points = 2;
      }

      this._addScore(offenseSide, points);
      attacker.totalPointsScored += points;

      // 助攻统计（传球助攻时，组织者+助攻）
      if (attackType === Constants.AttackType.ASSIST) {
        // 助攻已在外部处理
      }

      // 检查是否达到21分获胜
      if (this._checkWinCondition()) return null;

      // 球权转换
      this._swapPossession();

      return {
        type: 'score',
        message: `🏀 ${attacker.playerName} ${this._getAttackTypeName(attackType)}命中！+${points}分！${defender.playerName}防守失败`,
        attacker: attacker.playerName,
        defender: defender.playerName,
        points,
        attackType,
        usedAttr
      };
    } else {
      // 未命中
      StaminaTool.applyAttackStamina(attacker);
      StaminaTool.applyDefendStamina(defender);

      // 篮板判定
      const offenseReb = this._getTeamReboundValue(offenseTeam, true);
      const defenseReb = this._getTeamReboundValue(defenseTeam, false);
      const rebound = ProbabilityTool.judgeRebound(offenseReb, defenseReb);

      if (rebound === 'offense') {
        // 进攻篮板，球权不变
        const rebounder = this._pickRebounder(offenseTeam);
        if (rebounder) rebounder.totalRebounds += 1;
        return {
          type: 'rebound_offense',
          message: `📊 ${attacker.playerName} 投篮不中！进攻篮板！${rebounder ? rebounder.playerName + '抢到' : ''}球权继续`,
          attacker: attacker.playerName,
          defender: defender.playerName,
          attackType
        };
      } else {
        // 防守篮板，球权转换
        const rebounder = this._pickRebounder(defenseTeam);
        if (rebounder) rebounder.totalRebounds += 1;
        this._swapPossession();
        return {
          type: 'rebound_defense',
          message: `📊 ${attacker.playerName} 投篮不中！${rebounder ? rebounder.playerName : '防守方'}抢到篮板！球权转换`,
          attacker: attacker.playerName,
          defender: defender.playerName,
          attackType
        };
      }
    }
  }

  /**
   * 传球助攻回合 - 选择接球者
   */
  executeAssistRound(passer, receiver, defender) {
    if (this.gameOver) return null;
    this.currentRound++;

    if (!defender) {
      defender = this._autoSelectDefender(receiver);
    }

    const isHomeOffense = this.possession === Constants.Possession.HOME;
    const offenseSide = isHomeOffense ? 'home' : 'away';

    // 组织者不消耗体力用于投篮，但消耗组织体力
    const passerPenalty = StaminaTool.getStaminaPenalty(passer);
    const passerPlaymaking = getEffectiveAttr(passer, 'playmaking', passerPenalty) + (passer._synergyBonus || 0);

    // 接球者获得组织加成
    const assistBonus = passerPlaymaking * Constants.ASSIST_BONUS_COEFFICIENT;

    const receiverPenalty = StaminaTool.getStaminaPenalty(receiver);
    const receiverBase = getEffectiveAttr(receiver, 'midRangeShot', receiverPenalty) + (receiver._synergyBonus || 0);
    const atkEffective = receiverBase + assistBonus;

    const defPenalty = StaminaTool.getStaminaPenalty(defender);
    const defBase = getEffectiveAttr(defender, 'perimeterDefense', defPenalty) + (defender._synergyBonus || 0);
    const defEffective = defBase;

    // 判定失误（用组织者的组织vs防守者外防）
    if (ProbabilityTool.judgeTurnover(passerPlaymaking, defEffective)) {
      StaminaTool.applyAttackStamina(passer);
      StaminaTool.applyDefendStamina(defender);
      receiver.actedThisRound = true;
      this._swapPossession();
      return {
        type: 'turnover',
        message: `❌ ${passer.playerName} 传球失误！${defender.playerName}抢断！球权转换！`,
        attacker: passer.playerName,
        defender: defender.playerName,
        attackType: 'assist'
      };
    }

    // 犯规判定
    const foul = ProbabilityTool.judgeFoul(atkEffective, defEffective);
    if (foul) {
      StaminaTool.applyAttackStamina(passer);
      StaminaTool.applyDefendStamina(defender);
      defender.foulCount += 1;

      const ftMade = this._executeFreeThrow(receiver);
      if (ftMade) {
        this._addScore(offenseSide, 1);
        this._swapPossession(); // 罚球命中后球权转换
        if (this._checkWinCondition()) return null;
      }

      if (defender.foulCount >= Constants.FOUL_LIMIT) {
        return {
          type: 'foul_out',
          message: `🟡 ${defender.playerName} 犯规！${receiver.playerName} 罚球${ftMade ? '命中' : '不中'}！${defender.playerName} 已${Constants.FOUL_LIMIT}犯！`,
          attacker: passer.playerName,
          defender: defender.playerName,
          foulCount: defender.foulCount,
          points: ftMade ? 1 : 0,
          attackType: 'assist'
        };
      }

      return {
        type: 'foul',
        message: `🟡 ${defender.playerName} 犯规！${receiver.playerName} 罚球${ftMade ? '命中' : '不中'}！`,
        attacker: passer.playerName,
        defender: defender.playerName,
        points: ftMade ? 1 : 0,
        attackType: 'assist'
      };
    }

    // 投篮命中
    const success = ProbabilityTool.judgeShootSuccess(atkEffective, defEffective);

    StaminaTool.applyAttackStamina(passer);
    StaminaTool.applyDefendStamina(defender);
    receiver.actedThisRound = true;
    receiver.consecutiveRounds += 1;

    if (success) {
      this._addScore(offenseSide, 2);
      receiver.totalPointsScored += 2;
      passer.totalAssists += 1;

      if (this._checkWinCondition()) return null;

      this._swapPossession();

      return {
        type: 'score',
        message: `🎯 ${passer.playerName} 助攻 → ${receiver.playerName} 跳投命中！+2分！`,
        attacker: receiver.playerName,
        defender: defender.playerName,
        points: 2,
        attackType: 'assist',
        passer: passer.playerName
      };
    } else {
      const offenseTeam = isHomeOffense ? this.homePlayers : this.awayPlayers;
      const defenseTeam = isHomeOffense ? this.awayPlayers : this.homePlayers;
      const offenseReb = this._getTeamReboundValue(offenseTeam, true);
      const defenseReb = this._getTeamReboundValue(defenseTeam, false);
      const rebound = ProbabilityTool.judgeRebound(offenseReb, defenseReb);

      if (rebound === 'offense') {
        const rebounder = this._pickRebounder(offenseTeam);
        if (rebounder) rebounder.totalRebounds += 1;
        return {
          type: 'rebound_offense',
          message: `📊 ${passer.playerName} 传给 ${receiver.playerName} 不中！进攻篮板！球权继续`,
          attacker: receiver.playerName,
          defender: defender.playerName,
          attackType: 'assist'
        };
      } else {
        const rebounder = this._pickRebounder(defenseTeam);
        if (rebounder) rebounder.totalRebounds += 1;
        this._swapPossession();
        return {
          type: 'rebound_defense',
          message: `📊 ${passer.playerName} 传给 ${receiver.playerName} 不中！防守篮板！球权转换`,
          attacker: receiver.playerName,
          defender: defender.playerName,
          attackType: 'assist'
        };
      }
    }
  }

  /**
   * 根据攻击类型获取攻防数值
   */
  _getEffectiveValues(attacker, defender, attackType) {
    const atkPenalty = StaminaTool.getStaminaPenalty(attacker);
    const defPenalty = StaminaTool.getStaminaPenalty(defender);

    let usedAttr, usedDefAttr;

    switch (attackType) {
      case Constants.AttackType.MID_RANGE:
        usedAttr = 'midRangeShot';
        usedDefAttr = 'perimeterDefense';
        break;
      case Constants.AttackType.DRIVE:
        usedAttr = 'drive';
        usedDefAttr = 'perimeterDefense';
        break;
      case Constants.AttackType.POST:
        usedAttr = 'post';
        usedDefAttr = 'interiorDefense';
        break;
      case Constants.AttackType.THREE_POINT:
        usedAttr = 'threePointAttack';
        usedDefAttr = 'perimeterDefense';
        break;
      case Constants.AttackType.ASSIST:
        // 用中投和外防作为默认（传球助攻另处理）
        usedAttr = 'midRangeShot';
        usedDefAttr = 'perimeterDefense';
        break;
      default:
        usedAttr = 'midRangeShot';
        usedDefAttr = 'perimeterDefense';
    }

    // 加成
    const atkBase = getEffectiveAttr(attacker, usedAttr, atkPenalty) + (attacker._synergyBonus || 0);
    const atkBadge = this._getBadgeBonus(attacker, usedAttr);
    const atkEffective = atkBase + atkBadge;

    const defBase = getEffectiveAttr(defender, usedDefAttr, defPenalty) + (defender._synergyBonus || 0);
    const defBadge = this._getBadgeBonus(defender, usedDefAttr);
    const defEffective = defBase + defBadge;

    return { atkEffective, defEffective, usedAttr, usedDefAttr };
  }

  /**
   * 徽章加成
   */
  _getBadgeBonus(player, attrName) {
    if (!player.badges) return 0;
    let total = 0;
    player.badges.forEach(b => {
      if (b.affectedAttr === attrName) total += b.bonusValue;
    });
    return total;
  }

  /**
   * 自动选择最佳防守球员（位置对位优先）
   */
  _autoSelectDefender(attacker) {
    const defenseTeam = this.getDefenseTeamData();
    const allCourt = defenseTeam.court;
    if (allCourt.length === 0) return null;
    
    // 优先同位置且有体力的球员
    const samePos = allCourt.filter(p => p.position === attacker.position && p.currentStamina > 0);
    if (samePos.length > 0) {
      // 选防守综合值最高的
      return samePos.reduce((best, p) => {
        const val = getEffectiveAttr(p, 'perimeterDefense', StaminaTool.getStaminaPenalty(p)) +
                    getEffectiveAttr(p, 'interiorDefense', StaminaTool.getStaminaPenalty(p));
        const bestVal = getEffectiveAttr(best, 'perimeterDefense', StaminaTool.getStaminaPenalty(best)) +
                        getEffectiveAttr(best, 'interiorDefense', StaminaTool.getStaminaPenalty(best));
        return val > bestVal ? p : best;
      });
    }
    
    // 有体力但不同位置的球员
    const anyPos = allCourt.filter(p => p.currentStamina > 0);
    if (anyPos.length > 0) {
      // 选体力最高的
      return anyPos.reduce((a, b) => a.currentStamina > b.currentStamina ? a : b);
    }
    
    // 所有防守球员体力都为0，选体力最高的（哪怕是0）
    return allCourt.reduce((a, b) => a.currentStamina > b.currentStamina ? a : b);
  }

  /**
   * 罚球
   */
  _executeFreeThrow(player) {
    const rate = player.freeThrowRating / 100;
    return ProbabilityTool.random() <= rate;
  }

  /**
   * 得分
   */
  _addScore(side, points) {
    if (side === 'home') {
      this.homeScore += points;
    } else {
      this.awayScore += points;
    }
  }

  /**
   * 球权转换
   */
  _swapPossession() {
    this.possession = this.possession === Constants.Possession.HOME ? Constants.Possession.AWAY : Constants.Possession.HOME;
  }

  /**
   * 未操作球员恢复体力
   */
  _recoverIdlePlayers() {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    allPlayers.forEach(p => {
      if (p.isOnCourt) {
        StaminaTool.recoverIdle(p);
      }
    });
  }

  /**
   * 球队篮板总值
   */
  _getTeamReboundValue(teamPlayers, isOffense) {
    const courtPlayers = teamPlayers.filter(p => p.isOnCourt);
    let total = 0;
    courtPlayers.forEach(p => {
      const pen = StaminaTool.getStaminaPenalty(p);
      const reb = getEffectiveAttr(p, 'rebounding', pen) + (p._synergyBonus || 0);
      const badge = this._getBadgeBonus(p, 'rebounding');
      total += (reb + badge);
    });
    return total;
  }

  _pickRebounder(teamPlayers) {
    const court = teamPlayers.filter(p => p.isOnCourt);
    if (court.length === 0) return null;
    const total = court.reduce((s, p) => {
      const pen = StaminaTool.getStaminaPenalty(p);
      return s + getEffectiveAttr(p, 'rebounding', pen) + this._getBadgeBonus(p, 'rebounding');
    }, 0);
    if (total <= 0) return court[0];
    let r = ProbabilityTool.random() * total;
    for (const p of court) {
      const val = getEffectiveAttr(p, 'rebounding', StaminaTool.getStaminaPenalty(p)) + this._getBadgeBonus(p, 'rebounding');
      r -= Math.max(0, val);
      if (r <= 0) return p;
    }
    return court[court.length - 1];
  }

  // ===================== 工具方法 =====================

  getOnCourtPlayers(isHome) {
    return (isHome ? this.homePlayers : this.awayPlayers).filter(p => p.isOnCourt);
  }

  getBenchPlayers(isHome) {
    return (isHome ? this.homePlayers : this.awayPlayers).filter(p => !p.isOnCourt);
  }

  getOffenseTeamData() {
    const isHome = this.possession === Constants.Possession.HOME;
    return {
      side: isHome ? 'home' : 'away',
      court: this.getOnCourtPlayers(isHome),
      bench: this.getBenchPlayers(isHome)
    };
  }

  getDefenseTeamData() {
    const isHome = this.possession === Constants.Possession.HOME;
    return {
      side: isHome ? 'away' : 'home',
      court: this.getOnCourtPlayers(!isHome),
      bench: this.getBenchPlayers(!isHome)
    };
  }

  isGameOver() {
    return this.gameOver;
  }

  getGameSummary() {
    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      possession: this.possession === Constants.Possession.HOME ? '🏠主场' : '✈️客场',
      winScore: Constants.WIN_SCORE
    };
  }

  /**
   * 检查是否达到21分获胜条件
   */
  _checkWinCondition() {
    if (this.gameOver) return true;
    if (this.homeScore >= Constants.WIN_SCORE || this.awayScore >= Constants.WIN_SCORE) {
      this._endGame();
      return true;
    }
    return false;
  }

  _buildGameContext() {
    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      possession: this.possession
    };
  }

  _getAttackTypeName(type) {
    const names = {
      'mid_range': '中投',
      'drive': '突破攻框',
      'post': '篮下终结',
      'three_point': '三分投射',
      'assist': '传球助攻'
    };
    return names[type] || type;
  }

  canSurrender() {
    if (this.gameOver) return false;
    const diff = this.awayScore - this.homeScore;
    return diff >= Constants.SURRENDER_REQUIRED_DIFF;
  }

  surrender(isHome) {
    if (!this.canSurrender()) return { success: false, message: '无法投降' };
    this.gameOver = true;
    this.surrenderEnd = true;
    this.gameWinner = isHome ? this.awayPlayers[0].teamName : this.homePlayers[0].teamName;
    const result = {
      winner: this.gameWinner,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      bySurrender: true,
      message: `${this.gameWinner} 获胜！（对手投降）`
    };
    if (this.callbacks.onGame) this.callbacks.onGame(result);
    return { success: true, result };
  }

  // ===================== 21分制（无节次/加时） =====================
  // 无需节次管理，直接打满21分获胜

  // ===================== 暂停 =====================

  useTimeout(isHome) {
    const remaining = isHome ? this.homeTimeouts : this.awayTimeouts;
    if (remaining <= 0) return { success: false, message: '已无暂停机会' };
    if (isHome) this.homeTimeouts--;
    else this.awayTimeouts--;

    const teamPlayers = isHome ? this.homePlayers : this.awayPlayers;
    teamPlayers.forEach(p => {
      if (p.isOnCourt) StaminaTool.recoverOnTimeout(p);
    });

    if (this.callbacks.onTimeout) {
      this.callbacks.onTimeout(isHome ? 'home' : 'away', isHome ? this.homeTimeouts : this.awayTimeouts);
    }

    return { success: true, message: `${isHome ? '主场' : '客场'}使用暂停，场上球员恢复体力` };
  }

  // ===================== 换人 =====================

  substitutePlayer(isHome, fromPlayer, toPlayer) {
    const remaining = isHome ? this.homeSubstitutions : this.awaySubstitutions;
    if (remaining <= 0) return { success: false, message: '换人次数已用完' };
    if (!fromPlayer.isOnCourt) return { success: false, message: `${fromPlayer.playerName} 不在场上` };
    if (toPlayer.isOnCourt) return { success: false, message: `${toPlayer.playerName} 已在场上` };
    if (fromPlayer.position !== toPlayer.position) return { success: false, message: '只能换同位置的球员' };

    if (isHome) this.homeSubstitutions--;
    else this.awaySubstitutions--;

    fromPlayer.isOnCourt = false;
    toPlayer.isOnCourt = true;
    StaminaTool.initSubstitute(toPlayer);
    fromPlayer.consecutiveRounds = 0;
    fromPlayer.actedThisRound = false;

    this._calcSynergies(this.homePlayers, 'home');
    this._calcSynergies(this.awayPlayers, 'away');

    if (this.callbacks.onSubstitution) {
      this.callbacks.onSubstitution(isHome ? 'home' : 'away', fromPlayer, toPlayer);
    }

    return { success: true, message: `${isHome ? '主场' : '客场'}换人：${fromPlayer.playerName} ↓ ${toPlayer.playerName} ↑，剩余${isHome ? this.homeSubstitutions : this.awaySubstitutions}次` };
  }

  _endGame(config = {}) {
    this.gameOver = true;
    this.gameWinner = this.homeScore > this.awayScore ? this.homePlayers[0].teamName : this.awayPlayers[0].teamName;
    const result = {
      winner: this.gameWinner,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      bySurrender: config.surrender || false,
      message: `${this.gameWinner} 获胜！比分 ${this.homeScore} : ${this.awayScore}（目标21分）`
    };
    if (this.callbacks.onGame) this.callbacks.onGame(result);
  }
}
