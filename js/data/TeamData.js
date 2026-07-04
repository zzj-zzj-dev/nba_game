/**
 * ============================================================================
 * TeamData.js — 预设球队数据
 * 属性：midRangeShot(中投) drive(突破) post(篮下) threePointAttack(三分)
 *       playmaking(组织) perimeterDefense(外防) interiorDefense(内防) rebounding(篮板)
 * ============================================================================
 */

function createSamplePlayers() {
  const homeTeam = buildHomeTeam();
  const awayTeam = buildAwayTeam();

  for (let i = 0; i < 5; i++) {
    homeTeam[i].isStarter = true;
    homeTeam[i].isSubstitute = false;
    awayTeam[i].isStarter = true;
    awayTeam[i].isSubstitute = false;
  }
  for (let i = 5; i < 8; i++) {
    homeTeam[i].isStarter = false;
    homeTeam[i].isSubstitute = true;
    awayTeam[i].isStarter = false;
    awayTeam[i].isSubstitute = true;
  }

  return { home: homeTeam, away: awayTeam };
}

function buildHomeTeam() {
  return [
    createPlayer({
      id: 'GSW_01', playerName: '斯蒂芬·库里', position: 'PG', teamName: '勇士',
      attrs: { midRangeShot: 90, drive: 82, post: 50, threePointAttack: 99, playmaking: 92, perimeterDefense: 70, interiorDefense: 55, rebounding: 60 },
      badges: [createBadge('三分大师', 'threePointAttack', 8)],
      legendaryPairs: ['SplashBrothers'], freeThrowRating: 90
    }),
    createPlayer({
      id: 'GSW_02', playerName: '克莱·汤普森', position: 'SG', teamName: '勇士',
      attrs: { midRangeShot: 85, drive: 72, post: 50, threePointAttack: 92, playmaking: 65, perimeterDefense: 85, interiorDefense: 60, rebounding: 55 },
      badges: [createBadge('顶级3D', 'perimeterDefense', 6)],
      legendaryPairs: ['SplashBrothers'], freeThrowRating: 85
    }),
    createPlayer({
      id: 'GSW_03', playerName: '安德鲁·威金斯', position: 'SF', teamName: '勇士',
      attrs: { midRangeShot: 76, drive: 82, post: 68, threePointAttack: 72, playmaking: 60, perimeterDefense: 82, interiorDefense: 70, rebounding: 68 },
      badges: [createBadge('枫叶乔丹', 'drive', 5)],
      legendaryPairs: [], freeThrowRating: 72
    }),
    createPlayer({
      id: 'GSW_04', playerName: '德雷蒙德·格林', position: 'PF', teamName: '勇士',
      attrs: { midRangeShot: 62, drive: 65, post: 72, threePointAttack: 55, playmaking: 78, perimeterDefense: 85, interiorDefense: 82, rebounding: 80 },
      badges: [createBadge('防守领袖', 'interiorDefense', 7)],
      legendaryPairs: [], freeThrowRating: 65
    }),
    createPlayer({
      id: 'GSW_05', playerName: '凯文·卢尼', position: 'C', teamName: '勇士',
      attrs: { midRangeShot: 60, drive: 58, post: 80, threePointAttack: 40, playmaking: 55, perimeterDefense: 65, interiorDefense: 80, rebounding: 88 },
      badges: [createBadge('篮板痴汉', 'rebounding', 8)],
      legendaryPairs: [], freeThrowRating: 60
    }),
    // 替补
    createPlayer({
      id: 'GSW_06', playerName: '乔丹·普尔', position: 'SG', teamName: '勇士',
      attrs: { midRangeShot: 78, drive: 76, post: 50, threePointAttack: 80, playmaking: 68, perimeterDefense: 62, interiorDefense: 50, rebounding: 48 },
      badges: [createBadge('微波炉', 'threePointAttack', 4)],
      legendaryPairs: [], freeThrowRating: 88
    }),
    createPlayer({
      id: 'GSW_07', playerName: '加里·佩顿二世', position: 'PG', teamName: '勇士',
      attrs: { midRangeShot: 62, drive: 72, post: 55, threePointAttack: 62, playmaking: 60, perimeterDefense: 88, interiorDefense: 65, rebounding: 60 },
      badges: [createBadge('外线大锁', 'perimeterDefense', 8)],
      legendaryPairs: [], freeThrowRating: 62
    }),
    createPlayer({
      id: 'GSW_08', playerName: '乔纳森·库明加', position: 'SF', teamName: '勇士',
      attrs: { midRangeShot: 68, drive: 80, post: 72, threePointAttack: 65, playmaking: 55, perimeterDefense: 72, interiorDefense: 68, rebounding: 70 },
      badges: [createBadge('天赋怪', 'drive', 5)],
      legendaryPairs: [], freeThrowRating: 68
    })
  ];
}

function buildAwayTeam() {
  return [
    createPlayer({
      id: 'LAL_01', playerName: '德安吉洛·拉塞尔', position: 'PG', teamName: '湖人',
      attrs: { midRangeShot: 78, drive: 72, post: 50, threePointAttack: 82, playmaking: 80, perimeterDefense: 62, interiorDefense: 50, rebounding: 55 },
      badges: [createBadge('冷血射手', 'threePointAttack', 5)],
      legendaryPairs: [], freeThrowRating: 85
    }),
    createPlayer({
      id: 'LAL_02', playerName: '奥斯汀·里夫斯', position: 'SG', teamName: '湖人',
      attrs: { midRangeShot: 78, drive: 76, post: 55, threePointAttack: 76, playmaking: 74, perimeterDefense: 68, interiorDefense: 55, rebounding: 58 },
      badges: [createBadge('乡村科比', 'playmaking', 5)],
      legendaryPairs: [], freeThrowRating: 88
    }),
    createPlayer({
      id: 'LAL_03', playerName: '勒布朗·詹姆斯', position: 'SF', teamName: '湖人',
      attrs: { midRangeShot: 82, drive: 94, post: 85, threePointAttack: 75, playmaking: 95, perimeterDefense: 78, interiorDefense: 72, rebounding: 78 },
      badges: [createBadge('全力詹', 'drive', 10), createBadge('球场大脑', 'playmaking', 8)],
      legendaryPairs: ['LeBronWade'], freeThrowRating: 75
    }),
    createPlayer({
      id: 'LAL_04', playerName: '安东尼·戴维斯', position: 'PF', teamName: '湖人',
      attrs: { midRangeShot: 78, drive: 76, post: 90, threePointAttack: 68, playmaking: 60, perimeterDefense: 80, interiorDefense: 92, rebounding: 90 },
      badges: [createBadge('防守核心', 'interiorDefense', 8), createBadge('浓眉大眼', 'rebounding', 6)],
      legendaryPairs: [], freeThrowRating: 82
    }),
    createPlayer({
      id: 'LAL_05', playerName: '贾克森·海斯', position: 'C', teamName: '湖人',
      attrs: { midRangeShot: 60, drive: 62, post: 78, threePointAttack: 30, playmaking: 45, perimeterDefense: 60, interiorDefense: 74, rebounding: 80 },
      badges: [createBadge('吃饼中锋', 'post', 5)],
      legendaryPairs: [], freeThrowRating: 55
    }),
    // 替补
    createPlayer({
      id: 'LAL_06', playerName: '八村塁', position: 'SF', teamName: '湖人',
      attrs: { midRangeShot: 74, drive: 72, post: 68, threePointAttack: 72, playmaking: 52, perimeterDefense: 66, interiorDefense: 64, rebounding: 62 },
      badges: [createBadge('日本武士', 'midRangeShot', 4)],
      legendaryPairs: [], freeThrowRating: 78
    }),
    createPlayer({
      id: 'LAL_07', playerName: '马克斯·克里斯蒂', position: 'SG', teamName: '湖人',
      attrs: { midRangeShot: 66, drive: 65, post: 50, threePointAttack: 68, playmaking: 55, perimeterDefense: 70, interiorDefense: 55, rebounding: 52 },
      badges: [createBadge('潜力新星', 'perimeterDefense', 4)],
      legendaryPairs: [], freeThrowRating: 80
    }),
    createPlayer({
      id: 'LAL_08', playerName: '克里斯蒂安·伍德', position: 'C', teamName: '湖人',
      attrs: { midRangeShot: 72, drive: 68, post: 74, threePointAttack: 70, playmaking: 48, perimeterDefense: 58, interiorDefense: 68, rebounding: 76 },
      badges: [createBadge('空间内线', 'threePointAttack', 4)],
      legendaryPairs: [], freeThrowRating: 70
    })
  ];
}
