// PlayerData.js — 完整球员数据库 + 工厂函数
const MASTER_DB = [];
function _addToDB(e){MASTER_DB.push(e);}

_addToDB({"id": "g00", "name": "迈克尔·乔丹", "year": "1995-96", "team": "芝加哥公牛", "positions": ["SG", "SF"], "tier": "GOAT", "overall": 99, "attrs": {"midRangeShot": 98, "drive": 99, "post": 90, "threePointAttack": 88, "perimeterDefense": 99, "interiorDefense": 80, "rebounding": 90, "playmaking": 80}});
_addToDB({"id": "g01", "name": "斯蒂芬·库里", "year": "2015-16", "team": "金州勇士", "positions": ["PG", "SG"], "tier": "GOAT", "overall": 99, "attrs": {"midRangeShot": 96, "drive": 92, "post": 80, "threePointAttack": 99, "perimeterDefense": 90, "interiorDefense": 70, "rebounding": 50, "playmaking": 98}});
_addToDB({"id": "g02", "name": "勒布朗·詹姆斯", "year": "2011-12", "team": "迈阿密热火", "positions": ["SF", "PF"], "tier": "GOAT", "overall": 99, "attrs": {"midRangeShot": 90, "drive": 99, "post": 95, "threePointAttack": 78, "perimeterDefense": 96, "interiorDefense": 90, "rebounding": 93, "playmaking": 98}});
_addToDB({"id": "g03", "name": "威尔特·张伯伦", "year": "1961-62", "team": "费城勇士", "positions": ["C"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 70, "drive": 80, "post": 99, "threePointAttack": 20, "perimeterDefense": 70, "interiorDefense": 99, "rebounding": 99, "playmaking": 75}});
_addToDB({"id": "g04", "name": "沙奎尔·奥尼尔", "year": "1999-00", "team": "洛杉矶湖人", "positions": ["C"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 70, "drive": 90, "post": 99, "threePointAttack": 25, "perimeterDefense": 60, "interiorDefense": 98, "rebounding": 98, "playmaking": 65}});
_addToDB({"id": "g05", "name": "科比·布莱恩特", "year": "2005-06", "team": "洛杉矶湖人", "positions": ["SG", "SF"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 98, "drive": 99, "post": 85, "threePointAttack": 90, "perimeterDefense": 96, "interiorDefense": 75, "rebounding": 80, "playmaking": 88}});
_addToDB({"id": "g06", "name": "勒布朗·詹姆斯", "year": "2017-18", "team": "克利夫兰骑士", "positions": ["SF", "PF"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 88, "drive": 97, "post": 95, "threePointAttack": 80, "perimeterDefense": 96, "interiorDefense": 92, "rebounding": 90, "playmaking": 99}});
_addToDB({"id": "g07", "name": "埃尔文·约翰逊", "year": "1986-87", "team": "洛杉矶湖人", "positions": ["PG", "SG", "SF"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 85, "drive": 96, "post": 90, "threePointAttack": 78, "perimeterDefense": 85, "interiorDefense": 96, "rebounding": 75, "playmaking": 99}});
_addToDB({"id": "g08", "name": "拉里·伯德", "year": "1984-85", "team": "波士顿凯尔特人", "positions": ["SF", "PF"], "tier": "GOAT", "overall": 98, "attrs": {"midRangeShot": 99, "drive": 80, "post": 88, "threePointAttack": 96, "perimeterDefense": 92, "interiorDefense": 88, "rebounding": 85, "playmaking": 95}});
_addToDB({"id": "g09", "name": "卡里姆·阿布杜尔-贾巴尔", "year": "1971-72", "team": "密尔沃基雄鹿", "positions": ["C"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 99, "drive": 70, "post": 98, "threePointAttack": 30, "perimeterDefense": 75, "interiorDefense": 94, "rebounding": 96, "playmaking": 80}});
_addToDB({"id": "g10", "name": "尼古拉·约基奇", "year": "2021-22", "team": "丹佛掘金", "positions": ["C", "PF"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 94, "drive": 70, "post": 95, "threePointAttack": 85, "perimeterDefense": 75, "interiorDefense": 96, "rebounding": 88, "playmaking": 99}});
_addToDB({"id": "g11", "name": "蒂姆·邓肯", "year": "2002-03", "team": "圣安东尼奥马刺", "positions": ["PF", "C"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 93, "drive": 75, "post": 96, "threePointAttack": 30, "perimeterDefense": 90, "interiorDefense": 98, "rebounding": 99, "playmaking": 80}});
_addToDB({"id": "g12", "name": "詹姆斯·哈登", "year": "2017-18", "team": "休斯顿火箭", "positions": ["PG", "SG"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 88, "drive": 98, "post": 85, "threePointAttack": 96, "perimeterDefense": 80, "interiorDefense": 75, "rebounding": 60, "playmaking": 97}});
_addToDB({"id": "g13", "name": "扬尼斯·阿德托昆博", "year": "2019-20", "team": "密尔沃基雄鹿", "positions": ["PF", "SF"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 78, "drive": 99, "post": 96, "threePointAttack": 68, "perimeterDefense": 94, "interiorDefense": 95, "rebounding": 96, "playmaking": 85}});
_addToDB({"id": "g14", "name": "斯蒂芬·库里", "year": "2021-22", "team": "金州勇士", "positions": ["PG", "SG"], "tier": "GOAT", "overall": 97, "attrs": {"midRangeShot": 96, "drive": 88, "post": 80, "threePointAttack": 99, "perimeterDefense": 88, "interiorDefense": 72, "rebounding": 45, "playmaking": 96}});
_addToDB({"id": "g15", "name": "凯文·杜兰特", "year": "2016-17", "team": "金州勇士", "positions": ["SF", "PF"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 99, "drive": 90, "post": 88, "threePointAttack": 96, "perimeterDefense": 92, "interiorDefense": 85, "rebounding": 86, "playmaking": 82}});
_addToDB({"id": "g16", "name": "德克·诺维茨基", "year": "2010-11", "team": "达拉斯小牛", "positions": ["PF", "C"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 99, "drive": 75, "post": 88, "threePointAttack": 96, "perimeterDefense": 70, "interiorDefense": 88, "rebounding": 78, "playmaking": 80}});
_addToDB({"id": "g17", "name": "科怀·伦纳德", "year": "2018-19", "team": "多伦多猛龙", "positions": ["SF", "SG"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 96, "drive": 88, "post": 85, "threePointAttack": 88, "perimeterDefense": 99, "interiorDefense": 84, "rebounding": 92, "playmaking": 80}});
_addToDB({"id": "g18", "name": "阿伦·艾弗森", "year": "2001-02", "team": "费城76人", "positions": ["PG", "SG"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 92, "drive": 99, "post": 75, "threePointAttack": 84, "perimeterDefense": 90, "interiorDefense": 60, "rebounding": 40, "playmaking": 96}});
_addToDB({"id": "g19", "name": "哈基姆·奥拉朱旺", "year": "1993-94", "team": "休斯顿火箭", "positions": ["C"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 90, "drive": 80, "post": 98, "threePointAttack": 30, "perimeterDefense": 90, "interiorDefense": 96, "rebounding": 99, "playmaking": 75}});
_addToDB({"id": "g20", "name": "谢伊·吉尔杰斯-亚历山大", "year": "2024-25", "team": "俄克拉荷马城雷霆", "positions": ["PG", "SG"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 96, "drive": 98, "post": 88, "threePointAttack": 85, "perimeterDefense": 88, "interiorDefense": 72, "rebounding": 60, "playmaking": 92}});
_addToDB({"id": "g21", "name": "比尔·拉塞尔", "year": "1962-63", "team": "波士顿凯尔特人", "positions": ["C"], "tier": "GOAT", "overall": 96, "attrs": {"midRangeShot": 65, "drive": 60, "post": 90, "threePointAttack": 20, "perimeterDefense": 95, "interiorDefense": 99, "rebounding": 99, "playmaking": 78}});
_addToDB({"id": "s00", "name": "德维恩·韦德", "year": "2008-09", "team": "迈阿密热火", "positions": ["SG", "PG"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 88, "drive": 97, "post": 90, "threePointAttack": 75, "perimeterDefense": 94, "interiorDefense": 68, "rebounding": 80, "playmaking": 90}});
_addToDB({"id": "s01", "name": "克里斯·保罗", "year": "2007-08", "team": "新奥尔良黄蜂", "positions": ["PG"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 92, "drive": 88, "post": 65, "threePointAttack": 84, "perimeterDefense": 95, "interiorDefense": 55, "rebounding": 60, "playmaking": 98}});
_addToDB({"id": "s02", "name": "德里克·罗斯", "year": "2010-11", "team": "芝加哥公牛", "positions": ["PG"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 84, "drive": 97, "post": 75, "threePointAttack": 72, "perimeterDefense": 82, "interiorDefense": 55, "rebounding": 55, "playmaking": 90}});
_addToDB({"id": "s03", "name": "卡尔·马龙", "year": "1996-97", "team": "犹他爵士", "positions": ["PF"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 90, "drive": 78, "post": 95, "threePointAttack": 40, "perimeterDefense": 85, "interiorDefense": 93, "rebounding": 90, "playmaking": 75}});
_addToDB({"id": "s04", "name": "凯文·加内特", "year": "2003-04", "team": "明尼苏达森林狼", "positions": ["PF", "C"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 88, "drive": 80, "post": 88, "threePointAttack": 70, "perimeterDefense": 92, "interiorDefense": 94, "rebounding": 94, "playmaking": 82}});
_addToDB({"id": "s05", "name": "卢卡·东契奇", "year": "2022-23", "team": "达拉斯独行侠", "positions": ["PG", "SG"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 88, "drive": 85, "post": 82, "threePointAttack": 86, "perimeterDefense": 75, "interiorDefense": 82, "rebounding": 65, "playmaking": 96}});
_addToDB({"id": "s06", "name": "乔尔·恩比德", "year": "2022-23", "team": "费城76人", "positions": ["C"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 88, "drive": 78, "post": 94, "threePointAttack": 82, "perimeterDefense": 80, "interiorDefense": 94, "rebounding": 92, "playmaking": 68}});
_addToDB({"id": "s07", "name": "拉塞尔·威斯布鲁克", "year": "2016-17", "team": "俄克拉荷马城雷霆", "positions": ["PG", "SG"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 70, "drive": 96, "post": 82, "threePointAttack": 74, "perimeterDefense": 82, "interiorDefense": 90, "rebounding": 60, "playmaking": 95}});
_addToDB({"id": "s08", "name": "摩西·马龙", "year": "1982-83", "team": "费城76人", "positions": ["C", "PF"], "tier": "SSR", "overall": 95, "attrs": {"midRangeShot": 72, "drive": 65, "post": 96, "threePointAttack": 20, "perimeterDefense": 70, "interiorDefense": 98, "rebounding": 92, "playmaking": 55}});
_addToDB({"id": "s09", "name": "德怀特·霍华德", "year": "2008-09", "team": "奥兰多魔术", "positions": ["C", "PF"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 58, "drive": 70, "post": 95, "threePointAttack": 30, "perimeterDefense": 82, "interiorDefense": 97, "rebounding": 95, "playmaking": 55}});
_addToDB({"id": "s10", "name": "史蒂夫·纳什", "year": "2005-06", "team": "菲尼克斯太阳", "positions": ["PG"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 90, "drive": 82, "post": 60, "threePointAttack": 93, "perimeterDefense": 70, "interiorDefense": 45, "rebounding": 40, "playmaking": 98}});
_addToDB({"id": "s11", "name": "斯科蒂·皮蓬", "year": "1993-94", "team": "芝加哥公牛", "positions": ["SF", "SG"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 85, "drive": 88, "post": 80, "threePointAttack": 75, "perimeterDefense": 96, "interiorDefense": 80, "rebounding": 88, "playmaking": 90}});
_addToDB({"id": "s12", "name": "查尔斯·巴克利", "year": "1992-93", "team": "菲尼克斯太阳", "positions": ["PF", "SF"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 82, "drive": 85, "post": 92, "threePointAttack": 68, "perimeterDefense": 80, "interiorDefense": 94, "rebounding": 82, "playmaking": 78}});
_addToDB({"id": "s13", "name": "大卫·罗宾逊", "year": "1993-94", "team": "圣安东尼奥马刺", "positions": ["C"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 80, "drive": 75, "post": 94, "threePointAttack": 35, "perimeterDefense": 85, "interiorDefense": 96, "rebounding": 95, "playmaking": 68}});
_addToDB({"id": "s14", "name": "特雷西·麦克格雷迪", "year": "2002-03", "team": "奥兰多魔术", "positions": ["SG", "SF"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 92, "drive": 93, "post": 80, "threePointAttack": 82, "perimeterDefense": 85, "interiorDefense": 74, "rebounding": 68, "playmaking": 80}});
_addToDB({"id": "s15", "name": "克莱德·德雷克斯勒", "year": "1991-92", "team": "波特兰开拓者", "positions": ["SG", "SF"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 82, "drive": 95, "post": 85, "threePointAttack": 70, "perimeterDefense": 90, "interiorDefense": 78, "rebounding": 72, "playmaking": 82}});
_addToDB({"id": "s16", "name": "帕特里克·尤因", "year": "1993-94", "team": "纽约尼克斯", "positions": ["C"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 88, "drive": 65, "post": 92, "threePointAttack": 30, "perimeterDefense": 80, "interiorDefense": 94, "rebounding": 93, "playmaking": 60}});
_addToDB({"id": "s17", "name": "朱利叶斯·欧文", "year": "1979-80", "team": "费城76人", "positions": ["SF", "SG"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 88, "drive": 93, "post": 90, "threePointAttack": 40, "perimeterDefense": 88, "interiorDefense": 82, "rebounding": 78, "playmaking": 78}});
_addToDB({"id": "s18", "name": "加里·佩顿", "year": "1995-96", "team": "西雅图超音速", "positions": ["PG"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 82, "drive": 85, "post": 62, "threePointAttack": 78, "perimeterDefense": 98, "interiorDefense": 58, "rebounding": 68, "playmaking": 94}});
_addToDB({"id": "s19", "name": "安东尼·戴维斯", "year": "2017-18", "team": "新奥尔良鹈鹕", "positions": ["PF", "C"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 80, "drive": 82, "post": 92, "threePointAttack": 70, "perimeterDefense": 88, "interiorDefense": 95, "rebounding": 93, "playmaking": 65}});
_addToDB({"id": "s20", "name": "杰森·塔图姆", "year": "2022-23", "team": "波士顿凯尔特人", "positions": ["SF", "PF"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 88, "drive": 86, "post": 82, "threePointAttack": 88, "perimeterDefense": 88, "interiorDefense": 82, "rebounding": 80, "playmaking": 78}});
_addToDB({"id": "s21", "name": "达米安·利拉德", "year": "2019-20", "team": "波特兰开拓者", "positions": ["PG"], "tier": "SSR", "overall": 94, "attrs": {"midRangeShot": 90, "drive": 88, "post": 65, "threePointAttack": 94, "perimeterDefense": 75, "interiorDefense": 55, "rebounding": 45, "playmaking": 92}});
_addToDB({"id": "s22", "name": "杰森·基德", "year": "2001-02", "team": "新泽西篮网", "positions": ["PG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 82, "drive": 80, "post": 62, "threePointAttack": 82, "perimeterDefense": 92, "interiorDefense": 78, "rebounding": 65, "playmaking": 97}});
_addToDB({"id": "s23", "name": "约翰·斯托克顿", "year": "1994-95", "team": "犹他爵士", "positions": ["PG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 88, "drive": 75, "post": 50, "threePointAttack": 85, "perimeterDefense": 92, "interiorDefense": 40, "rebounding": 45, "playmaking": 99}});
_addToDB({"id": "s24", "name": "雷·阿伦", "year": "2000-01", "team": "密尔沃基雄鹿", "positions": ["SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 94, "drive": 85, "post": 60, "threePointAttack": 95, "perimeterDefense": 85, "interiorDefense": 55, "rebounding": 50, "playmaking": 82}});
_addToDB({"id": "s25", "name": "卡梅罗·安东尼", "year": "2012-13", "team": "纽约尼克斯", "positions": ["SF", "PF"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 91, "drive": 86, "post": 85, "threePointAttack": 85, "perimeterDefense": 78, "interiorDefense": 78, "rebounding": 65, "playmaking": 70}});
_addToDB({"id": "s26", "name": "保罗·乔治", "year": "2018-19", "team": "俄克拉荷马城雷霆", "positions": ["SF", "SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 88, "drive": 85, "post": 72, "threePointAttack": 92, "perimeterDefense": 94, "interiorDefense": 78, "rebounding": 75, "playmaking": 78}});
_addToDB({"id": "s27", "name": "多米尼克·威尔金斯", "year": "1987-88", "team": "亚特兰大老鹰", "positions": ["SF"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 85, "drive": 93, "post": 92, "threePointAttack": 55, "perimeterDefense": 75, "interiorDefense": 78, "rebounding": 65, "playmaking": 62}});
_addToDB({"id": "s28", "name": "伊赛亚·托马斯", "year": "1984-85", "team": "底特律活塞", "positions": ["PG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 90, "drive": 94, "post": 60, "threePointAttack": 72, "perimeterDefense": 88, "interiorDefense": 48, "rebounding": 45, "playmaking": 96}});
_addToDB({"id": "s29", "name": "凯里·欧文", "year": "2015-16", "team": "克利夫兰骑士", "positions": ["PG", "SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 92, "drive": 94, "post": 72, "threePointAttack": 90, "perimeterDefense": 78, "interiorDefense": 48, "rebounding": 40, "playmaking": 82}});
_addToDB({"id": "s30", "name": "吉米·巴特勒", "year": "2019-20", "team": "迈阿密热火", "positions": ["SF", "SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 86, "drive": 88, "post": 82, "threePointAttack": 72, "perimeterDefense": 92, "interiorDefense": 75, "rebounding": 78, "playmaking": 85}});
_addToDB({"id": "s31", "name": "多诺万·米切尔", "year": "2022-23", "team": "克利夫兰骑士", "positions": ["SG", "PG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 85, "drive": 94, "post": 75, "threePointAttack": 88, "perimeterDefense": 80, "interiorDefense": 58, "rebounding": 55, "playmaking": 82}});
_addToDB({"id": "s32", "name": "德文·布克", "year": "2021-22", "team": "菲尼克斯太阳", "positions": ["SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 94, "drive": 85, "post": 72, "threePointAttack": 88, "perimeterDefense": 78, "interiorDefense": 58, "rebounding": 55, "playmaking": 82}});
_addToDB({"id": "s33", "name": "雷吉·米勒", "year": "1999-00", "team": "印第安纳步行者", "positions": ["SG"], "tier": "SSR", "overall": 93, "attrs": {"midRangeShot": 94, "drive": 78, "post": 55, "threePointAttack": 95, "perimeterDefense": 80, "interiorDefense": 45, "rebounding": 45, "playmaking": 78}});
_addToDB({"id": "s34", "name": "保罗·皮尔斯", "year": "2001-02", "team": "波士顿凯尔特人", "positions": ["SF", "SG"], "tier": "SSR", "overall": 92, "attrs": {"midRangeShot": 90, "drive": 84, "post": 78, "threePointAttack": 86, "perimeterDefense": 85, "interiorDefense": 72, "rebounding": 72, "playmaking": 80}});
_addToDB({"id": "s35", "name": "文斯·卡特", "year": "2000-01", "team": "多伦多猛龙", "positions": ["SG", "SF"], "tier": "SSR", "overall": 92, "attrs": {"midRangeShot": 85, "drive": 95, "post": 88, "threePointAttack": 82, "perimeterDefense": 82, "interiorDefense": 68, "rebounding": 65, "playmaking": 72}});
_addToDB({"id": "s36", "name": "杰伦·布朗", "year": "2022-23", "team": "波士顿凯尔特人", "positions": ["SG", "SF"], "tier": "SSR", "overall": 92, "attrs": {"midRangeShot": 86, "drive": 88, "post": 80, "threePointAttack": 84, "perimeterDefense": 85, "interiorDefense": 72, "rebounding": 75, "playmaking": 72}});
_addToDB({"id": "s37", "name": "布雷克·格里芬", "year": "2013-14", "team": "洛杉矶快船", "positions": ["PF", "C"], "tier": "SSR", "overall": 92, "attrs": {"midRangeShot": 72, "drive": 85, "post": 93, "threePointAttack": 55, "perimeterDefense": 70, "interiorDefense": 90, "rebounding": 72, "playmaking": 78}});
_addToDB({"id": "s38", "name": "比尔·沃顿", "year": "1976-77", "team": "波特兰开拓者", "positions": ["C"], "tier": "SSR", "overall": 92, "attrs": {"midRangeShot": 70, "drive": 55, "post": 88, "threePointAttack": 20, "perimeterDefense": 75, "interiorDefense": 95, "rebounding": 94, "playmaking": 78}});
_addToDB({"id": "s39", "name": "贾·莫兰特", "year": "2021-22", "team": "孟菲斯灰熊", "positions": ["PG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 78, "drive": 96, "post": 82, "threePointAttack": 72, "perimeterDefense": 72, "interiorDefense": 58, "rebounding": 45, "playmaking": 88}});
_addToDB({"id": "s40", "name": "格兰特·希尔", "year": "1996-97", "team": "底特律活塞", "positions": ["SF", "PF"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 82, "drive": 90, "post": 78, "threePointAttack": 65, "perimeterDefense": 85, "interiorDefense": 80, "rebounding": 75, "playmaking": 88}});
_addToDB({"id": "s41", "name": "克里斯·韦伯", "year": "2000-01", "team": "萨克拉门托国王", "positions": ["PF", "C"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 82, "drive": 78, "post": 88, "threePointAttack": 55, "perimeterDefense": 75, "interiorDefense": 90, "rebounding": 78, "playmaking": 85}});
_addToDB({"id": "s42", "name": "保罗·加索尔", "year": "2008-09", "team": "洛杉矶湖人", "positions": ["PF", "C"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 85, "drive": 62, "post": 90, "threePointAttack": 40, "perimeterDefense": 78, "interiorDefense": 92, "rebounding": 88, "playmaking": 75}});
_addToDB({"id": "s43", "name": "托尼·帕克", "year": "2012-13", "team": "圣安东尼奥马刺", "positions": ["PG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 88, "drive": 92, "post": 72, "threePointAttack": 72, "perimeterDefense": 78, "interiorDefense": 40, "rebounding": 40, "playmaking": 88}});
_addToDB({"id": "s44", "name": "马努·吉诺比利", "year": "2007-08", "team": "圣安东尼奥马刺", "positions": ["SG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 85, "drive": 90, "post": 72, "threePointAttack": 84, "perimeterDefense": 82, "interiorDefense": 60, "rebounding": 55, "playmaking": 82}});
_addToDB({"id": "s45", "name": "德隆·威廉姆斯", "year": "2007-08", "team": "犹他爵士", "positions": ["PG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 85, "drive": 84, "post": 55, "threePointAttack": 80, "perimeterDefense": 82, "interiorDefense": 45, "rebounding": 50, "playmaking": 92}});
_addToDB({"id": "s46", "name": "凯文·约翰逊", "year": "1993-94", "team": "菲尼克斯太阳", "positions": ["PG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 88, "drive": 92, "post": 55, "threePointAttack": 65, "perimeterDefense": 78, "interiorDefense": 40, "rebounding": 40, "playmaking": 94}});
_addToDB({"id": "s47", "name": "拉希德·华莱士", "year": "2001-02", "team": "波特兰开拓者", "positions": ["PF", "C"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 85, "drive": 65, "post": 82, "threePointAttack": 82, "perimeterDefense": 78, "interiorDefense": 80, "rebounding": 85, "playmaking": 68}});
_addToDB({"id": "s48", "name": "马克·普莱斯", "year": "1992-93", "team": "克利夫兰骑士", "positions": ["PG"], "tier": "SSR", "overall": 91, "attrs": {"midRangeShot": 92, "drive": 82, "post": 45, "threePointAttack": 92, "perimeterDefense": 78, "interiorDefense": 35, "rebounding": 35, "playmaking": 90}});
_addToDB({"id": "r00", "name": "德马尔·德罗赞", "year": "2016-17", "team": "多伦多猛龙", "positions": ["SG", "SF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 92, "drive": 88, "post": 78, "threePointAttack": 45, "perimeterDefense": 72, "interiorDefense": 62, "rebounding": 55, "playmaking": 72}});
_addToDB({"id": "r01", "name": "德拉蒙德·格林", "year": "2015-16", "team": "金州勇士", "positions": ["PF", "C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 55, "drive": 65, "post": 65, "threePointAttack": 72, "perimeterDefense": 92, "interiorDefense": 88, "rebounding": 92, "playmaking": 88}});
_addToDB({"id": "r02", "name": "克莱·汤普森", "year": "2015-16", "team": "金州勇士", "positions": ["SG", "SF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 88, "drive": 72, "post": 55, "threePointAttack": 95, "perimeterDefense": 90, "interiorDefense": 50, "rebounding": 62, "playmaking": 55}});
_addToDB({"id": "r03", "name": "鲁迪·戈贝尔", "year": "2020-21", "team": "犹他爵士", "positions": ["C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 45, "drive": 40, "post": 88, "threePointAttack": 20, "perimeterDefense": 80, "interiorDefense": 95, "rebounding": 95, "playmaking": 40}});
_addToDB({"id": "r04", "name": "泰雷斯·哈利伯顿", "year": "2022-23", "team": "印第安纳步行者", "positions": ["PG", "SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 84, "drive": 78, "post": 58, "threePointAttack": 90, "perimeterDefense": 75, "interiorDefense": 42, "rebounding": 40, "playmaking": 96}});
_addToDB({"id": "r05", "name": "昌西·比卢普斯", "year": "2003-04", "team": "底特律活塞", "positions": ["PG", "SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 86, "drive": 82, "post": 55, "threePointAttack": 88, "perimeterDefense": 88, "interiorDefense": 48, "rebounding": 55, "playmaking": 90}});
_addToDB({"id": "r06", "name": "本·华莱士", "year": "2003-04", "team": "底特律活塞", "positions": ["C", "PF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 35, "drive": 40, "post": 72, "threePointAttack": 20, "perimeterDefense": 88, "interiorDefense": 95, "rebounding": 95, "playmaking": 40}});
_addToDB({"id": "r07", "name": "肖恩·坎普", "year": "1995-96", "team": "西雅图超音速", "positions": ["PF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 65, "drive": 88, "post": 94, "threePointAttack": 40, "perimeterDefense": 72, "interiorDefense": 90, "rebounding": 78, "playmaking": 50}});
_addToDB({"id": "r08", "name": "阿朗佐·莫宁", "year": "1998-99", "team": "迈阿密热火", "positions": ["C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 72, "drive": 55, "post": 88, "threePointAttack": 30, "perimeterDefense": 75, "interiorDefense": 90, "rebounding": 94, "playmaking": 45}});
_addToDB({"id": "r09", "name": "阿玛雷·斯塔德迈尔", "year": "2004-05", "team": "菲尼克斯太阳", "positions": ["PF", "C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 75, "drive": 82, "post": 94, "threePointAttack": 30, "perimeterDefense": 62, "interiorDefense": 88, "rebounding": 72, "playmaking": 45}});
_addToDB({"id": "r10", "name": "詹姆斯·沃西", "year": "1985-86", "team": "洛杉矶湖人", "positions": ["SF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 80, "drive": 85, "post": 82, "threePointAttack": 45, "perimeterDefense": 85, "interiorDefense": 68, "rebounding": 70, "playmaking": 72}});
_addToDB({"id": "r11", "name": "乔治·格文", "year": "1979-80", "team": "圣安东尼奥马刺", "positions": ["SG", "SF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 95, "drive": 88, "post": 80, "threePointAttack": 40, "perimeterDefense": 72, "interiorDefense": 60, "rebounding": 55, "playmaking": 62}});
_addToDB({"id": "r12", "name": "沃尔特·弗雷泽", "year": "1972-73", "team": "纽约尼克斯", "positions": ["PG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 82, "drive": 85, "post": 55, "threePointAttack": 55, "perimeterDefense": 94, "interiorDefense": 55, "rebounding": 62, "playmaking": 90}});
_addToDB({"id": "r13", "name": "鲍勃·麦卡杜", "year": "1974-75", "team": "布法罗勇敢者", "positions": ["PF", "C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 82, "drive": 60, "post": 92, "threePointAttack": 25, "perimeterDefense": 60, "interiorDefense": 94, "rebounding": 80, "playmaking": 50}});
_addToDB({"id": "r14", "name": "德怀特·霍华德", "year": "2010-11", "team": "奥兰多魔术", "positions": ["C"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 55, "drive": 68, "post": 92, "threePointAttack": 28, "perimeterDefense": 80, "interiorDefense": 95, "rebounding": 93, "playmaking": 52}});
_addToDB({"id": "r15", "name": "卢卡·东契奇", "year": "2021-22", "team": "达拉斯独行侠", "positions": ["PG", "SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 85, "drive": 82, "post": 80, "threePointAttack": 84, "perimeterDefense": 72, "interiorDefense": 80, "rebounding": 62, "playmaking": 94}});
_addToDB({"id": "r16", "name": "杰森·塔图姆", "year": "2021-22", "team": "波士顿凯尔特人", "positions": ["SF", "PF"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 85, "drive": 84, "post": 80, "threePointAttack": 85, "perimeterDefense": 85, "interiorDefense": 80, "rebounding": 78, "playmaking": 76}});
_addToDB({"id": "r17", "name": "德文·布克", "year": "2022-23", "team": "菲尼克斯太阳", "positions": ["SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 92, "drive": 82, "post": 70, "threePointAttack": 86, "perimeterDefense": 76, "interiorDefense": 56, "rebounding": 52, "playmaking": 80}});
_addToDB({"id": "r18", "name": "多诺万·米切尔", "year": "2021-22", "team": "犹他爵士", "positions": ["SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 82, "drive": 92, "post": 72, "threePointAttack": 85, "perimeterDefense": 78, "interiorDefense": 55, "rebounding": 52, "playmaking": 80}});
_addToDB({"id": "r19", "name": "贾马尔·穆雷", "year": "2022-23", "team": "丹佛掘金", "positions": ["PG", "SG"], "tier": "SR", "overall": 90, "attrs": {"midRangeShot": 88, "drive": 82, "post": 65, "threePointAttack": 86, "perimeterDefense": 78, "interiorDefense": 55, "rebounding": 50, "playmaking": 82}});
_addToDB({"id": "r20", "name": "扎克·拉文", "year": "2021-22", "team": "芝加哥公牛", "positions": ["SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 78, "drive": 88, "post": 70, "threePointAttack": 88, "perimeterDefense": 72, "interiorDefense": 52, "rebounding": 48, "playmaking": 68}});
_addToDB({"id": "r21", "name": "布拉德利·比尔", "year": "2020-21", "team": "华盛顿奇才", "positions": ["SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 85, "drive": 85, "post": 68, "threePointAttack": 86, "perimeterDefense": 72, "interiorDefense": 50, "rebounding": 48, "playmaking": 75}});
_addToDB({"id": "r22", "name": "特雷·杨", "year": "2022-23", "team": "亚特兰大老鹰", "positions": ["PG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 78, "drive": 70, "post": 58, "threePointAttack": 92, "perimeterDefense": 68, "interiorDefense": 45, "rebounding": 38, "playmaking": 90}});
_addToDB({"id": "r23", "name": "泰雷塞·马克西", "year": "2023-24", "team": "费城76人", "positions": ["PG", "SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 82, "drive": 88, "post": 62, "threePointAttack": 85, "perimeterDefense": 72, "interiorDefense": 48, "rebounding": 45, "playmaking": 78}});
_addToDB({"id": "r24", "name": "贾伦·布伦森", "year": "2023-24", "team": "纽约尼克斯", "positions": ["PG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 85, "drive": 80, "post": 60, "threePointAttack": 84, "perimeterDefense": 78, "interiorDefense": 48, "rebounding": 45, "playmaking": 82}});
_addToDB({"id": "r25", "name": "CJ·麦科勒姆", "year": "2020-21", "team": "波特兰开拓者", "positions": ["SG", "PG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 80, "drive": 80, "post": 55, "threePointAttack": 90, "perimeterDefense": 72, "interiorDefense": 50, "rebounding": 48, "playmaking": 76}});
_addToDB({"id": "r26", "name": "凯德·坎宁安", "year": "2024-25", "team": "底特律活塞", "positions": ["PG", "SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 82, "drive": 78, "post": 72, "threePointAttack": 80, "perimeterDefense": 78, "interiorDefense": 65, "rebounding": 60, "playmaking": 80}});
_addToDB({"id": "r27", "name": "拉梅洛·鲍尔", "year": "2023-24", "team": "夏洛特黄蜂", "positions": ["PG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 75, "drive": 72, "post": 62, "threePointAttack": 85, "perimeterDefense": 72, "interiorDefense": 70, "rebounding": 55, "playmaking": 88}});
_addToDB({"id": "r28", "name": "克里斯·米德尔顿", "year": "2019-20", "team": "密尔沃基雄鹿", "positions": ["SF", "SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 85, "drive": 78, "post": 75, "threePointAttack": 82, "perimeterDefense": 82, "interiorDefense": 68, "rebounding": 68, "playmaking": 72}});
_addToDB({"id": "r29", "name": "帕斯卡尔·西亚卡姆", "year": "2022-23", "team": "多伦多猛龙", "positions": ["PF", "SF"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 78, "drive": 82, "post": 82, "threePointAttack": 72, "perimeterDefense": 80, "interiorDefense": 82, "rebounding": 78, "playmaking": 72}});
_addToDB({"id": "r30", "name": "朱·霍勒迪", "year": "2020-21", "team": "密尔沃基雄鹿", "positions": ["PG", "SG"], "tier": "SR", "overall": 89, "attrs": {"midRangeShot": 82, "drive": 78, "post": 60, "threePointAttack": 80, "perimeterDefense": 90, "interiorDefense": 62, "rebounding": 72, "playmaking": 80}});
_addToDB({"id": "r31", "name": "乔丹·克拉克森", "year": "2022-23", "team": "犹他爵士", "positions": ["SG", "PG"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 78, "drive": 82, "post": 62, "threePointAttack": 82, "perimeterDefense": 68, "interiorDefense": 48, "rebounding": 45, "playmaking": 68}});
_addToDB({"id": "r32", "name": "泰勒·希罗", "year": "2023-24", "team": "迈阿密热火", "positions": ["SG", "PG"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 80, "drive": 78, "post": 55, "threePointAttack": 85, "perimeterDefense": 68, "interiorDefense": 50, "rebounding": 42, "playmaking": 68}});
_addToDB({"id": "r33", "name": "安芬尼·西蒙斯", "year": "2022-23", "team": "波特兰开拓者", "positions": ["PG", "SG"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 75, "drive": 80, "post": 55, "threePointAttack": 85, "perimeterDefense": 65, "interiorDefense": 48, "rebounding": 40, "playmaking": 70}});
_addToDB({"id": "r34", "name": "小凯文·波特", "year": "2022-23", "team": "休斯顿火箭", "positions": ["SG", "PG"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 78, "drive": 85, "post": 65, "threePointAttack": 80, "perimeterDefense": 72, "interiorDefense": 58, "rebounding": 50, "playmaking": 78}});
_addToDB({"id": "r35", "name": "杰伦·格林", "year": "2023-24", "team": "休斯顿火箭", "positions": ["SG"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 72, "drive": 85, "post": 60, "threePointAttack": 82, "perimeterDefense": 68, "interiorDefense": 52, "rebounding": 42, "playmaking": 62}});
_addToDB({"id": "r36", "name": "埃文·莫布利", "year": "2023-24", "team": "克利夫兰骑士", "positions": ["C", "PF"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 60, "drive": 65, "post": 82, "threePointAttack": 28, "perimeterDefense": 82, "interiorDefense": 88, "rebounding": 90, "playmaking": 58}});
_addToDB({"id": "r37", "name": "贾勒特·阿伦", "year": "2022-23", "team": "克利夫兰骑士", "positions": ["C"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 50, "drive": 58, "post": 85, "threePointAttack": 25, "perimeterDefense": 78, "interiorDefense": 92, "rebounding": 90, "playmaking": 52}});
_addToDB({"id": "r38", "name": "小贾伦·杰克逊", "year": "2022-23", "team": "孟菲斯灰熊", "positions": ["PF", "C"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 58, "drive": 68, "post": 80, "threePointAttack": 30, "perimeterDefense": 85, "interiorDefense": 82, "rebounding": 90, "playmaking": 50}});
_addToDB({"id": "r39", "name": "尼古拉·武切维奇", "year": "2021-22", "team": "芝加哥公牛", "positions": ["C"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 72, "drive": 58, "post": 88, "threePointAttack": 75, "perimeterDefense": 62, "interiorDefense": 92, "rebounding": 72, "playmaking": 65}});
_addToDB({"id": "r40", "name": "阿尔佩伦·申京", "year": "2023-24", "team": "休斯顿火箭", "positions": ["C", "PF"], "tier": "SR", "overall": 88, "attrs": {"midRangeShot": 75, "drive": 68, "post": 85, "threePointAttack": 60, "perimeterDefense": 68, "interiorDefense": 88, "rebounding": 72, "playmaking": 72}});
_addToDB({"id": "r41", "name": "凯尔·库兹马", "year": "2022-23", "team": "华盛顿奇才", "positions": ["PF", "SF"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 78, "drive": 78, "post": 78, "threePointAttack": 72, "perimeterDefense": 72, "interiorDefense": 72, "rebounding": 62, "playmaking": 62}});
_addToDB({"id": "r42", "name": "安德鲁·维金斯", "year": "2021-22", "team": "金州勇士", "positions": ["SF", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 72, "drive": 82, "post": 75, "threePointAttack": 68, "perimeterDefense": 85, "interiorDefense": 62, "rebounding": 68, "playmaking": 55}});
_addToDB({"id": "r43", "name": "米卡尔·布里奇斯", "year": "2023-24", "team": "布鲁克林篮网", "positions": ["SF", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 72, "drive": 78, "post": 58, "threePointAttack": 78, "perimeterDefense": 85, "interiorDefense": 58, "rebounding": 68, "playmaking": 62}});
_addToDB({"id": "r44", "name": "赫伯特·琼斯", "year": "2023-24", "team": "新奥尔良鹈鹕", "positions": ["SF", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 62, "drive": 72, "post": 55, "threePointAttack": 72, "perimeterDefense": 90, "interiorDefense": 58, "rebounding": 78, "playmaking": 55}});
_addToDB({"id": "r45", "name": "OG·阿奴诺比", "year": "2022-23", "team": "多伦多猛龙", "positions": ["SF", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 68, "drive": 75, "post": 65, "threePointAttack": 78, "perimeterDefense": 90, "interiorDefense": 62, "rebounding": 72, "playmaking": 55}});
_addToDB({"id": "r46", "name": "约什·哈特", "year": "2023-24", "team": "纽约尼克斯", "positions": ["SG", "SF"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 65, "drive": 78, "post": 55, "threePointAttack": 72, "perimeterDefense": 85, "interiorDefense": 78, "rebounding": 62, "playmaking": 65}});
_addToDB({"id": "r47", "name": "丹尼斯·施罗德", "year": "2023-24", "team": "布鲁克林篮网", "positions": ["PG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 72, "drive": 82, "post": 48, "threePointAttack": 78, "perimeterDefense": 72, "interiorDefense": 42, "rebounding": 38, "playmaking": 80}});
_addToDB({"id": "r48", "name": "迈克·康利", "year": "2022-23", "team": "明尼苏达森林狼", "positions": ["PG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 82, "drive": 72, "post": 48, "threePointAttack": 82, "perimeterDefense": 82, "interiorDefense": 45, "rebounding": 42, "playmaking": 82}});
_addToDB({"id": "r49", "name": "凯尔·洛瑞", "year": "2019-20", "team": "多伦多猛龙", "positions": ["PG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 78, "drive": 78, "post": 55, "threePointAttack": 82, "perimeterDefense": 80, "interiorDefense": 55, "rebounding": 45, "playmaking": 85}});
_addToDB({"id": "r50", "name": "弗雷德·范弗利特", "year": "2022-23", "team": "多伦多猛龙", "positions": ["PG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 78, "drive": 72, "post": 48, "threePointAttack": 85, "perimeterDefense": 78, "interiorDefense": 52, "rebounding": 42, "playmaking": 80}});
_addToDB({"id": "r51", "name": "德章泰·默里", "year": "2022-23", "team": "亚特兰大老鹰", "positions": ["PG", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 78, "drive": 80, "post": 55, "threePointAttack": 78, "perimeterDefense": 82, "interiorDefense": 62, "rebounding": 55, "playmaking": 80}});
_addToDB({"id": "r52", "name": "马尔科姆·布罗格登", "year": "2022-23", "team": "波士顿凯尔特人", "positions": ["PG", "SG"], "tier": "SR", "overall": 87, "attrs": {"midRangeShot": 82, "drive": 78, "post": 55, "threePointAttack": 80, "perimeterDefense": 78, "interiorDefense": 58, "rebounding": 55, "playmaking": 78}});
_addToDB({"id": "r53", "name": "博扬·博格达诺维奇", "year": "2022-23", "team": "底特律活塞", "positions": ["SF", "PF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 82, "drive": 65, "post": 68, "threePointAttack": 85, "perimeterDefense": 65, "interiorDefense": 55, "rebounding": 55, "playmaking": 58}});
_addToDB({"id": "r54", "name": "哈里森·巴恩斯", "year": "2022-23", "team": "萨克拉门托国王", "positions": ["SF", "PF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 78, "drive": 72, "post": 72, "threePointAttack": 78, "perimeterDefense": 78, "interiorDefense": 65, "rebounding": 62, "playmaking": 58}});
_addToDB({"id": "r55", "name": "PJ·塔克", "year": "2021-22", "team": "迈阿密热火", "positions": ["SF", "PF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 58, "drive": 65, "post": 65, "threePointAttack": 78, "perimeterDefense": 88, "interiorDefense": 72, "rebounding": 82, "playmaking": 52}});
_addToDB({"id": "r56", "name": "马库斯·斯马特", "year": "2021-22", "team": "波士顿凯尔特人", "positions": ["PG", "SG"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 78, "post": 55, "threePointAttack": 72, "perimeterDefense": 90, "interiorDefense": 55, "rebounding": 62, "playmaking": 78}});
_addToDB({"id": "r57", "name": "亚历克斯·卡鲁索", "year": "2023-24", "team": "芝加哥公牛", "positions": ["SG", "PG"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 58, "drive": 68, "post": 45, "threePointAttack": 72, "perimeterDefense": 92, "interiorDefense": 55, "rebounding": 68, "playmaking": 68}});
_addToDB({"id": "r58", "name": "卡里斯·勒韦尔", "year": "2022-23", "team": "克利夫兰骑士", "positions": ["SG", "SF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 75, "drive": 80, "post": 58, "threePointAttack": 78, "perimeterDefense": 72, "interiorDefense": 55, "rebounding": 50, "playmaking": 68}});
_addToDB({"id": "r59", "name": "乔丹·普尔", "year": "2022-23", "team": "金州勇士", "positions": ["SG", "PG"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 78, "post": 48, "threePointAttack": 82, "perimeterDefense": 65, "interiorDefense": 48, "rebounding": 42, "playmaking": 68}});
_addToDB({"id": "r60", "name": "巴迪·希尔德", "year": "2022-23", "team": "印第安纳步行者", "positions": ["SG"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 68, "post": 48, "threePointAttack": 90, "perimeterDefense": 65, "interiorDefense": 50, "rebounding": 42, "playmaking": 58}});
_addToDB({"id": "r61", "name": "邓肯·罗宾逊", "year": "2022-23", "team": "迈阿密热火", "positions": ["SG", "SF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 58, "post": 42, "threePointAttack": 90, "perimeterDefense": 65, "interiorDefense": 45, "rebounding": 38, "playmaking": 50}});
_addToDB({"id": "r62", "name": "小加里·特伦特", "year": "2022-23", "team": "多伦多猛龙", "positions": ["SG", "SF"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 75, "post": 55, "threePointAttack": 82, "perimeterDefense": 78, "interiorDefense": 48, "rebounding": 48, "playmaking": 55}});
_addToDB({"id": "r63", "name": "凯利·奥利尼克", "year": "2022-23", "team": "犹他爵士", "positions": ["PF", "C"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 72, "drive": 55, "post": 78, "threePointAttack": 80, "perimeterDefense": 65, "interiorDefense": 78, "rebounding": 68, "playmaking": 62}});
_addToDB({"id": "r64", "name": "布鲁克·洛佩斯", "year": "2022-23", "team": "密尔沃基雄鹿", "positions": ["C"], "tier": "SR", "overall": 86, "attrs": {"midRangeShot": 58, "drive": 48, "post": 82, "threePointAttack": 72, "perimeterDefense": 72, "interiorDefense": 72, "rebounding": 82, "playmaking": 52}});

// ====== 工厂函数（兼容原比赛引擎）======

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
    currentStamina: 100,
    consecutiveRounds: 0,
    foulCount: 0,
    isOnCourt: false,
    isJustSubstituted: false,
    actedThisRound: false,
    totalPointsScored: 0,
    totalAssists: 0,
    totalRebounds: 0
  };
}

function createBadge(name, affectedAttr, bonusValue) {
  return { name, affectedAttr, bonusValue };
}

function resetPlayerMatchState(player) {
  player.currentStamina = 100;
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

function createPlayerFromMaster(masterId) {
  const entry = MASTER_DB.find(e => e.id === masterId);
  if (!entry) return null;
  return createPlayer({
    id: entry.id,
    playerName: entry.name,
    position: entry.positions[0],
    teamName: entry.team,
    attrs: { ...entry.attrs }
  });
}

// ====== 数据库查询 ======
function getMasterDB() { return MASTER_DB; }
function getMasterById(id) { return MASTER_DB.find(p => p.id === id) || null; }
function getMastersByTier(tier) { return MASTER_DB.filter(p => p.tier === tier); }
function getMastersByPosition(pos) { return MASTER_DB.filter(p => p.positions.includes(pos)); }
function getTierLabel(tier) { const l={GOAT:'历史巨星',SSR:'传奇',SR:'史诗',R:'稀有',N:'普通'}; return l[tier]||tier; }
function getTierColor(tier) { const c={GOAT:'#7c3aed',SSR:'#d97706',SR:'#2563eb',R:'#16a34a',N:'#6b7280'}; return c[tier]||'#666'; }
