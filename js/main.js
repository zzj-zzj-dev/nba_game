/**
 * ============================================================================
 * main.js — 游戏入口文件（21分制简化版）
 * 玩家主场进攻选择球员+进攻类型后自动执行，AI回合自动执行
 * 无需手动选择防守球员，无需节次管理
 *============================================================================
 */

// ===================== 全局状态 =====================
let battleManager = null;
let selectedAttacker = null;
let selectedAttackType = null;
let currentStep = 'select_attacker';
let isProcessing = false;

// ===================== DOM 引用 =====================
const $ = (id) => document.getElementById(id);
const homeScoreEl = $('home-score');
const awayScoreEl = $('away-score');
const quarterDisplay = $('quarter-display');
const possessionDisplay = $('possession-display');
const gameStatus = $('game-status');
const homePlayersEl = $('home-players');
const homeBenchEl = $('home-bench');
const awayPlayersEl = $('away-players');
const awayBenchEl = $('away-bench');
const actionTitle = $('action-title');
const playerSelectEl = $('player-select');
const attackTypeSelectEl = $('attack-type-select');
const logMessages = $('log-messages');
const btnTimeout = $('btn-timeout');
const btnSubstitute = $('btn-substitute');
const btnSurrender = $('btn-surrender');
const homeTimeoutDisplay = $('home-timeout-display');
const awayTimeoutDisplay = $('away-timeout-display');
const homeSubstitutionDisplay = $('home-substitution-display');
const awaySubstitutionDisplay = $('away-substitution-display');

// ===================== 初始化 =====================

function initGame() {
  console.log('initGame called');

  const { home, away } = createSamplePlayers();
  console.log('Players created:', home.length, away.length);

  battleManager = new BattleManager();
  battleManager.initializeGame(home, away, true, Difficulty.NORMAL);
  console.log('Game initialized, possession:', battleManager.possession);

  battleManager.setCallbacks({
    onRound: onRoundCallback,
    onGame: onGameCallback,
    onSubstitution: onSubstitutionCallback,
    onTimeout: onTimeoutCallback
  });

  renderAll();
  bindEvents();
  resetActionState();

  // 显示21分制信息
  if (quarterDisplay) quarterDisplay.textContent = '🏆 先到21分获胜';

  updateStatusBar('🏀 比赛开始！');
  addLog('🏀 比赛开始！主场队获得球权');
  updateTimeoutsDisplay();
  updateSubstitutionsDisplay();
  
  // 初始化用户界面
  if (typeof initAuthUI === 'function') {
    initAuthUI();
  }
}

// ===================== 渲染 =====================

function renderAll() {
  renderCourtPlayers(true);
  renderBenchPlayers(true);
  renderCourtPlayers(false);
  renderBenchPlayers(false);
  updateScoreboard();
  updateGameInfo();
}

function renderCourtPlayers(isHome) {
  const container = isHome ? homePlayersEl : awayPlayersEl;
  if (!battleManager) return;
  const players = battleManager.getOnCourtPlayers(isHome);
  container.innerHTML = '';
  players.forEach(p => {
    container.appendChild(createPlayerCard(p, isHome, false));
  });
}

function renderBenchPlayers(isHome) {
  const container = isHome ? homeBenchEl : awayBenchEl;
  if (!battleManager) return;
  const players = battleManager.getBenchPlayers(isHome);
  container.innerHTML = '';
  players.forEach(p => {
    container.appendChild(createPlayerCard(p, isHome, true));
  });
}

function createPlayerCard(player, isHome, isBench) {
  const card = document.createElement('div');
  card.className = 'player-card';
  if (isBench) card.classList.add('bench-card');
  if (player.currentStamina <= 0) card.classList.add('exhausted');
  if (selectedAttacker === player) card.classList.add('selected');

  const staminaRatio = player.currentStamina / Constants.STAMINA_MAX;
  let staminaClass = 'stamina-high';
  if (player.currentStamina <= Constants.STAMINA_THRESHOLD_2) staminaClass = 'stamina-low';
  else if (player.currentStamina <= Constants.STAMINA_THRESHOLD_1) staminaClass = 'stamina-mid';

  let badgeHTML = '';
  if (player.badges && player.badges.length > 0) {
    badgeHTML = player.badges.map(b => `<span class="badge-text">🔰 ${b.name}</span>`).join(' ');
  }

  let subBonusHTML = '';
  if (player.isJustSubstituted) {
    subBonusHTML = `<div class="sub-bonus-indicator">⚡ 替补奇兵 +${Constants.SUBSTITUTE_BONUS}</div>`;
  }

  let fatiguedHTML = '';
  if (player.consecutiveRounds > 2) {
    fatiguedHTML = `<div style="font-size:0.65em;color:#ff6b6b;">疲劳: +${player.consecutiveRounds * Constants.STAMINA_FATIGUE_PER_ROUND}消耗</div>`;
  }

  // 属性详情显示
  const attrs = player.attrs || {};
  const attrKeys = ['midRangeShot','drive','post','threePointAttack','playmaking','perimeterDefense','interiorDefense','rebounding'];
  const attrLabels = ['中投','突破','篮下','三分','组织','外防','内防','篮板'];
  let attrHTML = '<div class="player-attrs">';
  attrKeys.forEach((k, i) => {
    attrHTML += `<span class="attr-mini">${attrLabels[i]}${attrs[k]||50}</span>`;
  });
  attrHTML += '</div>';

  card.innerHTML = `
    <div class="player-name">${player.playerName}</div>
    <div class="player-pos">${player.position} | ${player.teamName}</div>
    <div class="player-stamina">
      ${StaminaTool.getStaminaDescription(player)}
      ${player.foulCount > 0 ? ` | 🟡犯规${player.foulCount}` : ''}
    </div>
    <div class="stamina-bar">
      <div class="stamina-bar-fill ${staminaClass}" style="width:${Math.max(0, staminaRatio * 100)}%"></div>
    </div>
    ${attrHTML}
    <div class="player-badges">${badgeHTML}</div>
    ${subBonusHTML}
    ${fatiguedHTML}
  `;

  card.addEventListener('click', () => {
    if (isBench) return;
    handlePlayerClick(player, isHome);
  });

  return card;
}

function updateScoreboard() {
  if (!battleManager) return;
  homeScoreEl.textContent = battleManager.homeScore;
  awayScoreEl.textContent = battleManager.awayScore;
}

function updateGameInfo() {
  if (!battleManager) return;
  const summary = battleManager.getGameSummary();
  possessionDisplay.textContent = `⚽ 球权: ${summary.possession}`;
}

function updateTimeoutsDisplay() {
  if (!battleManager) return;
  homeTimeoutDisplay.textContent = battleManager.homeTimeouts;
  awayTimeoutDisplay.textContent = battleManager.awayTimeouts;
  btnTimeout.textContent = `⏸️ 暂停 (${battleManager.homeTimeouts})`;
  btnTimeout.disabled = battleManager.homeTimeouts <= 0;
}

function updateSubstitutionsDisplay() {
  if (!battleManager) return;
  homeSubstitutionDisplay.textContent = battleManager.homeSubstitutions;
  awaySubstitutionDisplay.textContent = battleManager.awaySubstitutions;
}

function showSubstitutionModal() {
  if (battleManager.isGameOver()) return;
  if (battleManager.homeSubstitutions <= 0) {
    updateStatusBar('⚠️ 换人次数已用完！');
    return;
  }

  const modal = $('modal-overlay');
  const modalTitle = $('modal-title');
  const modalBody = $('modal-body');
  const confirmBtn = $('modal-confirm');
  const cancelBtn = $('modal-cancel');

  modalTitle.textContent = `🔄 换人（剩余 ${battleManager.homeSubstitutions} 次）`;
  modalBody.innerHTML = '';

  const homeCourt = battleManager.getOnCourtPlayers(true);
  const homeBench = battleManager.getBenchPlayers(true);

  // 为每个场上球员生成可选的替补
  homeCourt.forEach(cp => {
    const available = homeBench.filter(bp => bp.position === cp.position);
    if (available.length === 0) return;

    const section = document.createElement('div');
    section.style.marginBottom = '10px';
    section.style.padding = '8px';
    section.style.background = 'rgba(255,255,255,0.05)';
    section.style.borderRadius = '5px';

    const label = document.createElement('div');
    label.style.color = '#ffd700';
    label.style.marginBottom = '4px';
    label.textContent = `${cp.playerName} [${cp.position}] (体力:${Math.round(cp.currentStamina)})`;
    section.appendChild(label);

    available.forEach(bp => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.display = 'block';
      btn.style.width = '100%';
      btn.style.margin = '3px 0';
      btn.style.padding = '8px';
      btn.style.background = '#2a6a4a';
      btn.style.color = '#fff';
      btn.style.border = '1px solid #4aaa7a';
      btn.style.borderRadius = '5px';
      btn.style.cursor = 'pointer';
      btn.textContent = `→ ${bp.playerName} (体力:${Math.round(bp.currentStamina)})`;

      btn.addEventListener('click', () => {
        modal.classList.add('hidden');

        const result = battleManager.substitutePlayer(true, cp, bp);
        if (result.success) {
          addLog(`🔄 ${result.message}`);
          updateStatusBar(result.message);
          updateSubstitutionsDisplay();
          renderAll();
          setTimeout(() => {
            if (!battleManager.isGameOver()) {
              resetActionState();
            }
          }, 200);
        } else {
          updateStatusBar(`⚠️ ${result.message}`);
        }
      });

      section.appendChild(btn);
    });

    modalBody.appendChild(section);
  });

  if (modalBody.children.length === 0) {
    modalBody.innerHTML = '<div style="color:#aaa;text-align:center;padding:20px;">没有可用的替补球员</div>';
  }

  confirmBtn.textContent = '取消';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');

  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

function updateStatusBar(msg) {
  gameStatus.textContent = msg;
}

// ===================== 操作流程 =====================

function resetActionState() {
  currentStep = 'select_attacker';
  selectedAttacker = null;
  selectedAttackType = null;
  isProcessing = false;

  if (battleManager.isGameOver()) {
    actionTitle.textContent = '🏆 比赛已结束';
    playerSelectEl.classList.add('hidden');
    attackTypeSelectEl.classList.add('hidden');
    renderAll();
    return;
  }

  const isHomePossess = battleManager.possession === Constants.Possession.HOME;

  if (isHomePossess) {
    // 玩家的回合 → 选择进攻球员
    actionTitle.textContent = '🎯 选择进攻球员';
    playerSelectEl.classList.remove('hidden');
    attackTypeSelectEl.classList.add('hidden');
    renderAll();
  } else {
    // AI的回合 → 自动执行
    actionTitle.textContent = '⚡ 对方进攻中...';
    playerSelectEl.classList.add('hidden');
    attackTypeSelectEl.classList.add('hidden');
    renderAll();
    setTimeout(() => executeAITurn(), 300);
  }

  if (battleManager.canSurrender()) {
    btnSurrender.classList.remove('hidden');
  } else {
    btnSurrender.classList.add('hidden');
  }
}

function handlePlayerClick(player, isHome) {
  if (isProcessing || battleManager.isGameOver()) return;

  const isHomePossess = battleManager.possession === Constants.Possession.HOME;

  if (currentStep === 'select_attacker') {
    if (isHome !== isHomePossess) {
      updateStatusBar('⚠️ 现在不是你的球权！');
      return;
    }
    if (!StaminaTool.canPlayerAttack(player)) {
      updateStatusBar(`⚠️ ${player.playerName} 体力不足，无法进攻！`);
      return;
    }
    selectedAttacker = player;
    currentStep = 'select_attack_type';
    actionTitle.textContent = `🏀 ${player.playerName} — 选择进攻方式`;
    playerSelectEl.classList.add('hidden');
    attackTypeSelectEl.classList.remove('hidden');
    renderAll();
    updateStatusBar(`选择 ${player.playerName} 的进攻方式`);
  }
}

function handleAttackTypeSelect(attackType) {
  if (isProcessing) return;

  selectedAttackType = attackType;

  if (attackType === 'assist') {
    // 传球助攻：弹出接球者选择
    showAssistReceiverModal();
    return;
  }

  // 直接执行（防守球员由引擎自动选择）
  executePlayerTurn();
}

// ===================== 传球助攻弹窗 =====================

function showAssistReceiverModal() {
  const offenseTeam = battleManager.getOffenseTeamData();
  const receivers = offenseTeam.court.filter(p => p !== selectedAttacker && p.currentStamina > 0);

  if (receivers.length === 0) {
    updateStatusBar('⚠️ 没有可传球的队友！');
    return;
  }

  const modal = $('modal-overlay');
  const modalTitle = $('modal-title');
  const modalBody = $('modal-body');
  const confirmBtn = $('modal-confirm');
  const cancelBtn = $('modal-cancel');

  modalTitle.textContent = `🤝 ${selectedAttacker.playerName} 传球给谁？`;
  modalBody.innerHTML = '';

  receivers.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.margin = '5px 0';
    btn.style.padding = '10px';
    btn.style.background = '#2a4a6a';
    btn.style.color = '#fff';
    btn.style.border = '1px solid #4a7aaa';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';

    const pen = StaminaTool.getStaminaPenalty(r);
    const mid = getEffectiveAttr(r, 'midRangeShot', pen);
    btn.textContent = `${r.playerName} [${r.position}] 中投${mid} 体力${Math.round(r.currentStamina)}`;

    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      isProcessing = true;
      updateStatusBar(`🤝 ${selectedAttacker.playerName} 传给 ${r.playerName}...`);

      // 防守球员由引擎自动选择
      battleManager.executeAssistRound(selectedAttacker, r, null);

      setTimeout(() => {
        afterRound();
      }, 300);
    });

    modalBody.appendChild(btn);
  });

  confirmBtn.textContent = '取消';
  confirmBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');

  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

// ===================== 执行回合 =====================

function executePlayerTurn() {
  isProcessing = true;
  updateStatusBar(`⚡ ${selectedAttacker.playerName} 进攻中...`);


  // 防守球员由引擎自动选择（传入null）
  const result = battleManager.executeRound(
    selectedAttacker, selectedAttackType, null
  );


  setTimeout(() => {
    afterRound();
  }, 300);
}

function executeAITurn() {
  
  if (battleManager.isGameOver()) return;

  isProcessing = true;
  updateStatusBar('⚡ 对方进攻中...');


  try {
    // AI回合也自动选防守球员（传入null）
    const result = battleManager.executeAIRound(null);
  } catch (e) {
    console.error('AI turn error:', e);
    updateStatusBar('❌ AI回合出错: ' + e.message);
    isProcessing = false;
    return;
  }

  setTimeout(() => {
    afterRound();
  }, 300);
}

function afterRound() {

  if (battleManager.isGameOver()) {
    renderAll();
    updateScoreboard();
    updateGameInfo();
    return;
  }

  resetActionState();
  updateStatusBar('✅ 回合结束');
  renderAll();
  updateScoreboard();
  updateGameInfo();
  updateTimeoutsDisplay();
  updateSubstitutionsDisplay();
}

// ===================== 回调 =====================

function onRoundCallback(result) {
  addLog(result.message || '回合结束');
}

function onGameCallback(result) {
  addLog(`🏆 ${result.message}`);
  updateScoreboard();
  updateGameInfo();
  updateSubstitutionsDisplay();

  const modal = $('modal-overlay');
  const modalTitle = $('modal-title');
  const modalBody = $('modal-body');
  const confirmBtn = $('modal-confirm');
  const cancelBtn = $('modal-cancel');

  modalTitle.textContent = '🏆 比赛结束';
  modalBody.innerHTML = `
    <div style="font-size:1.5em;margin:15px 0;">
      <span style="color:#ffd700;">${result.winner}</span>
    </div>
    <div style="font-size:2em;margin:10px 0;">
      ${result.homeScore} : ${result.awayScore}
    </div>
    <div style="color:#aaa;font-size:0.85em;">
      🎯 目标21分
      ${result.bySurrender ? ' | 🏳️ 投降' : ''}
    </div>
  `;
  confirmBtn.textContent = '🔄 重新开始';
  cancelBtn.style.display = 'none';
  modal.classList.remove('hidden');

  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
    confirmBtn.textContent = '确认';
    cancelBtn.style.display = 'inline-block';
    logMessages.innerHTML = '';
    initGame();
  };

  updateStatusBar(`🏆 ${result.message}`);
}

function onSubstitutionCallback(team, fromPlayer, toPlayer) {
  addLog(`🔄 ${team === 'home' ? '主场' : '客场'} 换人：${fromPlayer.playerName} ↓ ${toPlayer.playerName} ↑`);
  renderAll();
}

function onTimeoutCallback(team, remaining) {
  addLog(`⏸️ ${team === 'home' ? '主场' : '客场'} 暂停！剩余 ${remaining} 次`);
  updateTimeoutsDisplay();
}

// ===================== 日志 =====================

function addLog(msg) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = msg;
  logMessages.appendChild(entry);
  logMessages.scrollTop = logMessages.scrollHeight;
}

// ===================== 事件绑定 =====================

function bindEvents() {
  attackTypeSelectEl.querySelectorAll('.btn-attack').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAttackTypeSelect(btn.dataset.type);
    });
  });

  btnTimeout.addEventListener('click', () => {
    if (battleManager.isGameOver()) return;
    const result = battleManager.useTimeout(true);
    if (result.success) {
      addLog(`⏸️ ${result.message}`);
      updateStatusBar(result.message);
      updateTimeoutsDisplay();
      renderAll();
      setTimeout(() => {
        if (!battleManager.isGameOver()) {
          resetActionState();
        }
      }, 200);
    } else {
      updateStatusBar(`⚠️ ${result.message}`);
    }
  });

  btnSubstitute.addEventListener('click', () => {
    showSubstitutionModal();
  });
  
  const btnOnline = $('btn-online');
  if (btnOnline) {
    btnOnline.addEventListener('click', () => {
      if (typeof showOnlineMenu === 'function') {
        showOnlineMenu();
      }
    });
  }

  btnSurrender.addEventListener('click', () => {
    if (battleManager.canSurrender()) {
      const modal = $('modal-overlay');
      const modalTitle = $('modal-title');
      const modalBody = $('modal-body');
      const confirmBtn = $('modal-confirm');
      const cancelBtn = $('modal-cancel');

      modalTitle.textContent = '🏳️ 确认投降？';
      modalBody.textContent = `当前比分 ${battleManager.homeScore} : ${battleManager.awayScore}，确定要投降吗？`;
      confirmBtn.textContent = '确认投降';
      cancelBtn.textContent = '取消';
      cancelBtn.style.display = 'inline-block';
      modal.classList.remove('hidden');

      confirmBtn.onclick = () => {
        modal.classList.add('hidden');
        battleManager.surrender(true);
      };
      cancelBtn.onclick = () => {
        modal.classList.add('hidden');
      };
    }
  });
}

// ===================== 启动 =====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, starting game...');
  try {
    initGame();
    console.log('Game started successfully');
  } catch (e) {
    console.error('Error starting game:', e);
    gameStatus.textContent = '❌ 启动失败: ' + e.message;
  }
});
