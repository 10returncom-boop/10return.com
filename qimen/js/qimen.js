/* 奇門遁甲排盤引擎（時家奇門・轉盤法・拆補定局）
   依賴 solarlunar.min.js（全域 SolarLunar）
   全球變數：Qimen（compute / 常數）、QimenUI（排盤頁渲染） */
(function (global) {
  'use strict';

  var GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
  var ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');
  var GAN_WX = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  var ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  var WX = ['木', '火', '土', '金', '水'];
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

  // 二十四節氣（索引 1..24，與 SolarLunar.getTerm 對應）
  var TERM = ['小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
              '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];

  // 三元定局表：[上元, 中元, 下元]
  var JU_TABLE = {
    '冬至': [1, 7, 4], '小寒': [2, 8, 5], '大寒': [3, 9, 6],
    '立春': [8, 5, 2], '雨水': [9, 6, 3], '驚蟄': [1, 7, 4],
    '春分': [3, 9, 6], '清明': [4, 1, 7], '穀雨': [5, 2, 8],
    '立夏': [4, 1, 7], '小滿': [5, 2, 8], '芒種': [6, 3, 9],
    '夏至': [9, 3, 6], '小暑': [8, 2, 5], '大暑': [7, 1, 4],
    '立秋': [2, 5, 8], '處暑': [1, 4, 7], '白露': [9, 3, 6],
    '秋分': [7, 1, 4], '寒露': [6, 9, 3], '霜降': [5, 8, 2],
    '立冬': [6, 9, 3], '小雪': [5, 8, 2], '大雪': [4, 7, 1]
  };
  var YANG_TERMS = ['冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種'];

  // 九宮：八宮環（順時針），中五宮不入環
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];
  var PAL_NAME = { 1: '坎一宮', 2: '坤二宮', 3: '震三宮', 4: '巽四宮', 5: '中五宮', 6: '乾六宮', 7: '兌七宮', 8: '艮八宮', 9: '離九宮' };
  var PAL_WX = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };
  var PAL_TRIGRAM = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離' };
  var PAL_DIR = { 1: '北', 2: '西南', 3: '東', 4: '東南', 5: '中', 6: '西北', 7: '西', 8: '東北', 9: '南' };
  var PAL_MEAN = {
    1: '事業、水、耳、腎、中男、盜賊、暗中',
    2: '母親、田土、婚姻、腹、胃、群眾',
    3: '行動、聲音、長男、足、驚擾、執法',
    4: '文書、風、長女、股、談判、遠行',
    5: '核心、樞紐、土地、房產、寄坤',
    6: '上司、父、頭、骨骼、官貴、金玉',
    7: '口舌、少女、金屬、飲食、娛樂、毀折',
    8: '少男、山、手、止、積累、房產',
    9: '名聲、文書、目、心、中女、光明'
  };

  var STAR0 = { 1: '天蓬', 8: '天任', 3: '天沖', 4: '天輔', 9: '天英', 2: '天芮', 7: '天柱', 6: '天心', 5: '天禽' };
  var STAR_WX = { '天蓬': '水', '天任': '土', '天沖': '木', '天輔': '木', '天英': '火', '天芮': '土', '天柱': '金', '天心': '金', '天禽': '土' };
  var STAR_MEAN = {
    '天蓬': '膽識、冒險、水利、盜賊、暗中行動',
    '天任': '穩重、累積、田產、慢工、誠信',
    '天沖': '行動、衝突、快速、體育、突發',
    '天輔': '文化、教育、文書、輔佐、風雅',
    '天英': '名聲、外表、光明、文采、急躁',
    '天芮': '疾病、學生、問題、纏繞、研究',
    '天柱': '口才、金屬、破壞、爭辯、支撐',
    '天心': '謀略、管理、醫藥、首腦、決斷',
    '天禽': '中正、土地、協調、核心、寄坤'
  };
  var DOOR_SEQ = ['休門', '生門', '傷門', '杜門', '景門', '死門', '驚門', '開門'];
  var DOOR0 = { 1: '休門', 8: '生門', 3: '傷門', 4: '杜門', 9: '景門', 2: '死門', 7: '驚門', 6: '開門', 5: '死門' };
  var DOOR_WX = { '休門': '水', '生門': '土', '傷門': '木', '杜門': '木', '景門': '火', '死門': '土', '驚門': '金', '開門': '金' };
  var DOOR_MEAN = {
    '休門': '休息、休養、求人、水事、平和',
    '生門': '生計、財利、生長、房產、經營',
    '傷門': '傷害、競爭、捕獵、爭訟、快速',
    '杜門': '閉塞、隱藏、技術、阻擋、獨處',
    '景門': '文書、名聲、表演、宴會、遠景',
    '死門': '終結、喪葬、舊事、疾病、收束',
    '驚門': '驚恐、口舌、官非、突發、傳播',
    '開門': '開創、官貴、事業、公開、通達'
  };
  var GODS = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];
  var GOD_MEAN = {
    '值符': '主導、貴人、核心、正統',
    '騰蛇': '虛驚、反覆、纏繞、變化',
    '太陰': '隱密、謀劃、暗中助力、女性',
    '六合': '合作、婚姻、中介、聚會',
    '白虎': '壓力、爭鬥、傷損、快速',
    '玄武': '暗昧、盜失、欺瞞、水事',
    '九地': '穩固、隱藏、基礎、慢成',
    '九天': '高遠、公開、擴張、快速'
  };
  var YI_ORDER = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];   // 六儀三奇布局順序
  var XUN_YI = ['戊', '己', '庚', '辛', '壬', '癸'];                    // 甲子戊 … 甲寅癸
  var XUN_NAME = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
  var KONG = [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]];

  function idxOf(arr, v) { return arr.indexOf(v); }
  function wxOfGan(g) { return GAN_WX[idxOf(GAN, g)]; }
  function rel(a, b) {            // a 對 b 的五行關係
    if (a === b) return '同';
    if (SHENG[a] === b) return '生';
    if (SHENG[b] === a) return '被生';
    if (KE[a] === b) return '剋';
    if (KE[b] === a) return '被剋';
    return '';
  }

  function termDate(year, i) {
    var d = global.SolarLunar.getTerm(year, i);
    return { y: year, m: Math.ceil(i / 2), d: d };
  }
  function utc(o) { return Date.UTC(o.y, o.m - 1, o.d); }

  function termList(y) {
    var out = [];
    [y - 1, y, y + 1].forEach(function (yy) {
      for (var i = 1; i <= 24; i++) {
        var t = termDate(yy, i);
        out.push({ name: TERM[i - 1], y: t.y, m: t.m, d: t.d });
      }
    });
    out.sort(function (a, b) { return utc(a) - utc(b); });
    return out;
  }

  function findTerm(y, m, d) {
    var list = termList(y), cur = null;
    for (var i = 0; i < list.length; i++) {
      if (utc(list[i]) <= utc({ y: y, m: m, d: d })) cur = list[i];
    }
    return cur;
  }

  // ---------- 四柱 ----------
  function dayGZ(y, m, d) {
    var o = global.SolarLunar.solar2lunar(y, m, d);
    return o.gzDay;
  }
  function hourZhi(hh) { return Math.floor((hh + 1) / 2) % 12; }

  function fourPillars(y, m, d, hh) {
    var lunar = global.SolarLunar.solar2lunar(y, m, d);
    var lateZi = hh >= 23;
    var dy = Date.UTC(y, m - 1, d), dt = { y: y, m: m, d: d };
    if (lateZi) {
      var nd = new Date(dy + 86400000);
      dt = { y: nd.getUTCFullYear(), m: nd.getUTCMonth() + 1, d: nd.getUTCDate() };
    }
    var gzDay = dayGZ(dt.y, dt.m, dt.d);
    var dGan = gzDay.charAt(0);
    var hz = hourZhi(hh);
    var hGan = GAN[(idxOf(GAN, dGan) * 2 + hz) % 10];
    var gzHour = hGan + ZHI[hz];

    // 年柱：立春換年（solarlunar 的 gzYear 已依立春）
    var gzYear = lunar.gzYear;
    // 月柱：以十二「節」換月（立春、驚蟄…），五虎遁
    var term = findTerm(y, m, d);
    var JIE = ['立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
    var JIE_TERM_IDX = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 1];
    var lastJie = -1, lastJieOrder = 11;
    [y - 1, y, y + 1].forEach(function (yy) {
      JIE_TERM_IDX.forEach(function (ti, order) {
        var jd = termDate(yy, ti);
        if (utc(jd) <= utc({ y: y, m: m, d: d })) {
          if (lastJie === -1 || utc(jd) > lastJie) { lastJie = utc(jd); lastJieOrder = order; }
        }
      });
    });
    var monthOrder = lastJieOrder;
    var mZhi = (2 + monthOrder) % 12;
    var startGan = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0 };
    var yGan = gzYear.charAt(0);
    var mGan = GAN[(startGan[yGan] + monthOrder) % 10];
    var gzMonth = mGan + ZHI[mZhi];

    return {
      year: gzYear, month: gzMonth, day: gzDay, hour: gzHour,
      lunar: lunar, lateZi: lateZi, dt: dt, term: term, monthOrder: monthOrder
    };
  }

  function cycleIndex(gz) {
    var g = gz.charAt(0), z = gz.charAt(1);
    for (var i = 0; i < 60; i++) {
      if (GAN[i % 10] === g && ZHI[i % 12] === z) return i;
    }
    return 0;
  }

  // ---------- 定局 ----------
  function decideJu(y, m, d) {
    var term = findTerm(y, m, d);
    var name = term.name;
    var days = Math.round((utc({ y: y, m: m, d: d }) - utc(term)) / 86400000);
    var yuanIdx = Math.floor(days / 5);
    if (yuanIdx < 0) yuanIdx = 0;
    if (yuanIdx > 2) yuanIdx = 2;
    var yang = YANG_TERMS.indexOf(name) >= 0;
    var ju = JU_TABLE[name][yuanIdx];
    return {
      term: term, termName: name, days: days,
      yuan: ['上元', '中元', '下元'][yuanIdx], yuanIdx: yuanIdx,
      yang: yang, ju: ju, dun: yang ? '陽遁' : '陰遁',
      juName: (yang ? '陽' : '陰') + '遁' + ['一', '二', '三', '四', '五', '六', '七', '八', '九'][ju - 1] + '局'
    };
  }

  // ---------- 佈盤 ----------
  function plateGan(ju, yang) {
    // 回傳 {palace: 干}
    var out = {};
    for (var k = 0; k < 9; k++) {
      var p = yang ? ((ju - 1 + k) % 9) + 1 : ((ju - 1 - k + 90) % 9) + 1;
      out[p] = YI_ORDER[k];
    }
    return out;
  }

  function ringIdx(p) { return RING.indexOf(p); }
  function shiftRing(p, delta) { return RING[(ringIdx(p) + delta + 8) % 8]; }

  function flyDoor(start, steps, yang) {
    var p = start === 5 ? 5 : start;
    for (var s = 0; s < steps; s++) {
      p = yang ? p + 1 : p - 1;
      if (p > 9) p -= 9;
      if (p < 1) p += 9;
    }
    if (p === 5) p = 2;               // 中五寄坤二
    return p;
  }

  function compute(inp) {
    var y = +inp.year, m = +inp.month, d = +inp.day, hh = +inp.hour;
    var fp = fourPillars(y, m, d, hh);
    var juInfo = decideJu(y, m, d);
    var ju = juInfo.ju, yang = juInfo.yang;

    // 地盤三奇六儀
    var di = plateGan(ju, yang);

    // 旬首
    var hi = cycleIndex(fp.hour);
    var xun = Math.floor(hi / 10);           // 0..5
    var xunStart = xun * 10;
    var steps = hi - xunStart;               // 0..9
    var xunYi = XUN_YI[xun];
    var xunPalace = 0;
    for (var p in di) if (di[p] === xunYi) xunPalace = +p;
    if (xunPalace === 5) xunPalace = 5;

    var fuStar = STAR0[xunPalace] || '天禽';
    var fuDoor = DOOR0[xunPalace] || '死門';
    var fuHomeRing = xunPalace === 5 ? 2 : xunPalace;

    // 天盤：值符星加時干宮
    var hourGan = fp.hour.charAt(0);
    var target;
    if (hourGan === '甲') {
      target = fuHomeRing;
    } else {
      var gp = 0;
      for (var q in di) if (di[q] === hourGan) gp = +q;
      target = gp === 5 ? 2 : gp;
    }
    if (target === 5) target = 2;
    var delta = (ringIdx(target) - ringIdx(fuHomeRing) + 8) % 8;

    var tianStar = {}, tianGan = {};
    RING.forEach(function (hp) {
      var np = shiftRing(hp, delta);
      tianStar[np] = STAR0[hp];
      tianGan[np] = di[hp];
    });

    // 八門：值使飛宮後，八門順時針固定排列
    var doorPos = flyDoor(fuHomeRing, steps, yang);
    var doors = {};
    var di0 = DOOR_SEQ.indexOf(fuDoor);
    for (var k = 0; k < 8; k++) {
      var pal = RING[(ringIdx(doorPos) + k) % 8];
      doors[pal] = DOOR_SEQ[(di0 + k) % 8];
    }

    // 八神：值符神加天盤值符宮，陽遁順、陰遁逆
    var gods = {};
    var gdir = yang ? 1 : -1;
    for (var g = 0; g < 8; g++) {
      var gp2 = RING[(ringIdx(target) + g * gdir + 8) % 8];
      gods[gp2] = GODS[g];
    }

    // 空亡、馬星
    var kong = KONG[xun].map(function (i) { return ZHI[i]; });
    var hz = idxOf(ZHI, fp.hour.charAt(1));
    var maMap = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]]; // 申子辰→寅, 寅午戌→申, 巳酉丑→亥, 亥卯未→巳
    var maZhi = '寅';
    if ([8, 0, 4].indexOf(hz) >= 0) maZhi = '寅';
    else if ([2, 6, 10].indexOf(hz) >= 0) maZhi = '申';
    else if ([5, 9, 1].indexOf(hz) >= 0) maZhi = '亥';
    else maZhi = '巳';
    var maPalace = { '寅': 8, '申': 2, '亥': 6, '巳': 4 }[maZhi];

    // 中宮：地盤干、天禽寄坤
    var zhong = { gan: di[5], star: '天禽', note: '寄坤二宮' };

    // 五行旺衰（以月令五行為準：同旺、生相、剋死、被剋囚、生我休）
    var seasonWX = { 0: '水', 1: '土', 2: '木', 3: '木', 4: '土', 5: '火', 6: '火', 7: '土', 8: '金', 9: '金', 10: '土', 11: '水' }[fp.monthOrder];

    function stateOf(wx) {
      if (wx === seasonWX) return '旺';
      if (SHENG[seasonWX] === wx) return '相';
      if (SHENG[wx] === seasonWX) return '休';
      if (KE[wx] === seasonWX) return '囚';
      if (KE[seasonWX] === wx) return '死';
      return '';
    }

    // 逐宮組裝
    var cells = {};
    for (var pi = 1; pi <= 9; pi++) {
      if (pi === 5) {
        cells[pi] = {
          palace: 5, name: PAL_NAME[5], wx: PAL_WX[5], dir: PAL_DIR[5], mean: PAL_MEAN[5],
          star: '天禽', door: '', god: '', tian: '', di: di[5],
          starState: stateOf(STAR_WX['天禽']), doorState: '', empty: false, ma: false
        };
        continue;
      }
      var star = tianStar[pi], door = doors[pi], god = gods[pi];
      cells[pi] = {
        palace: pi, name: PAL_NAME[pi], wx: PAL_WX[pi], dir: PAL_DIR[pi], mean: PAL_MEAN[pi],
        star: (star === '天芮' ? '天芮・天禽' : star),
        door: door, god: god, tian: tianGan[pi] || '', di: di[pi],
        starState: stateOf(STAR_WX[star]), doorState: stateOf(DOOR_WX[door]),
        empty: kong.indexOf(ZHI[(pi - 1) % 12]) >= 0 ? false : false,
        ma: pi === maPalace
      };
    }
    // 空亡以宮位地支（洛書配支：坎子、坤未申、震卯、巽辰巳、乾戌亥、兌酉、艮丑寅、離午）
    var palZhi = { 1: ['子'], 2: ['未', '申'], 3: ['卯'], 4: ['辰', '巳'], 6: ['戌', '亥'], 7: ['酉'], 8: ['丑', '寅'], 9: ['午'] };
    for (var pk = 1; pk <= 9; pk++) {
      if (pk === 5) continue;
      var pz = palZhi[pk] || [];
      cells[pk].empty = pz.some(function (z) { return kong.indexOf(z) >= 0; });
    }

    // 簡易格局判斷
    var flags = [];
    if (delta === 0) flags.push({ level: 'warn', text: '星伏吟：天盤值符未離本宮，主事情遲滯、原地反覆，宜守不宜進。' });
    if (delta === 4) flags.push({ level: 'warn', text: '星反吟：天盤值符沖對本宮，主事情翻轉、反覆變動，宜重新評估。' });
    if (doorPos === fuHomeRing) flags.push({ level: 'info', text: '門伏吟：值使門回到本宮，節奏偏慢，適合整理與內部事務。' });
    if (doorPos === shiftRing(fuHomeRing, 4)) flags.push({ level: 'info', text: '門反吟：值使門落對宮，行動容易反覆，重要決定建議再看一個時辰。' });
    // 三奇得門：天盤乙丙丁與開休生同宮
    ['乙', '丙', '丁'].forEach(function (q2) {
      for (var pp = 1; pp <= 9; pp++) {
        if (pp === 5) continue;
        if (cells[pp].tian === q2 && ['開門', '休門', '生門'].indexOf(cells[pp].door) >= 0) {
          flags.push({ level: 'good', text: '三奇得門：天盤 ' + q2 + ' 奇與 ' + cells[pp].door + ' 同落 ' + PAL_NAME[pp] + '，主貴人、文書、財利之事較順。' });
        }
      }
    });
    // 門迫：門剋宮
    for (var pd = 1; pd <= 9; pd++) {
      if (pd === 5) continue;
      var dw = DOOR_WX[cells[pd].door], pwx = PAL_WX[pd];
      if (KE[dw] === pwx) flags.push({ level: 'warn', text: '門迫：' + cells[pd].door + '（' + dw + '）剋 ' + PAL_NAME[pd] + '（' + pwx + '），此事推進容易受阻或有損耗。' });
      else if (KE[pwx] === dw) flags.push({ level: 'info', text: '門制：' + PAL_NAME[pd] + '剋 ' + cells[pd].door + '，主外壓力大、內在仍有支撐。' });
    }
    if (kong.length) flags.push({ level: 'info', text: '時旬空亡：' + kong.join('、') + '，落此二支的宮位主「虛、待成」，不宜斷定已定局。' });

    return {
      solar: { y: y, m: m, d: d, hour: hh },
      lunarText: fp.lunar.yearCn + fp.lunar.monthCn + fp.lunar.dayCn,
      lunar: fp.lunar,
      lateZi: fp.lateZi,
      four: fp,
      ju: juInfo,
      xun: { index: xun, name: XUN_NAME[xun] + '旬', yi: xunYi, palace: xunPalace },
      fu: { star: fuStar, door: fuDoor, palace: xunPalace, homeRing: fuHomeRing },
      target: target, delta: delta,
      di: di,
      cells: cells,
      zhong: zhong,
      kong: kong, ma: { zhi: maZhi, palace: maPalace },
      seasonWX: seasonWX,
      flags: flags,
      yang: yang
    };
  }

  // ---------- 用神 ----------
  var YONGSHEN = [
    { key: 'career', label: '事業・工作', door: '開門', star: '天心', gan: '', palace: 6, tip: '開門主事業與公開場合，天心主謀略與主管；兩者同宮或開門落宮最有力。' },
    { key: 'money', label: '財運・投資', door: '生門', star: '天任', gan: '戊', palace: 8, tip: '生門為財門，戊為資本；生門落宮與戊所在宮合看，避開空亡與門迫。' },
    { key: 'love', label: '感情・婚姻', door: '休門', star: '天英', gan: '乙', palace: 1, tip: '乙為女方、庚為男方；六合主婚姻媒介。以乙庚落宮生剋與六合宮判斷。' },
    { key: 'health', label: '健康・疾病', door: '死門', star: '天芮', gan: '', palace: 2, tip: '天芮主疾病，死門主終結與舊疾；再看天心（醫藥）與值符（主要病灶）。' },
    { key: 'exam', label: '考試・文書', door: '景門', star: '天輔', gan: '丁', palace: 9, tip: '景門主文書考試，天輔主教育，丁奇主文章；三者同宮最順。' },
    { key: 'travel', label: '出行・搬遷', door: '生門', star: '天沖', gan: '丙', palace: 8, tip: '出行看所往之方，生門、開門為吉；再看馬星是否引動、目的地宮位是否空亡。' },
    { key: 'deal', label: '談判・簽約', door: '杜門', star: '天輔', gan: '丁', palace: 4, tip: '杜門主閉藏與技術，簽約看景門（文書）與六合（合作），避開驚門（口舌）。' },
    { key: 'lawsuit', label: '官司・競爭', door: '驚門', star: '天柱', gan: '辛', palace: 7, tip: '驚門主官非口舌，天柱主爭辯；再看值符（主控）與白虎（壓力）落宮強弱。' }
  ];

  var API = {
    GAN: GAN, ZHI: ZHI, TERM: TERM, PAL_NAME: PAL_NAME, PAL_WX: PAL_WX, PAL_DIR: PAL_DIR,
    PAL_MEAN: PAL_MEAN, STAR0: STAR0, STAR_WX: STAR_WX, STAR_MEAN: STAR_MEAN,
    DOOR_SEQ: DOOR_SEQ, DOOR_WX: DOOR_WX, DOOR_MEAN: DOOR_MEAN, GODS: GODS, GOD_MEAN: GOD_MEAN,
    JU_TABLE: JU_TABLE, YONGSHEN: YONGSHEN, WX: WX,
    compute: compute, fourPillars: fourPillars, decideJu: decideJu,
    r4: function (x) { return Math.round(x * 10) / 10; }
  };

  global.Qimen = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
