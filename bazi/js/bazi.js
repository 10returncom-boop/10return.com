/* 八字算命百科 · 四柱排盤引擎（純前端，不依賴 CDN）
 * 依賴 js/solarlunar.min.js（SolarLunar：solar2lunar / getTerm / toGanZhi）
 * 介面：Bazi.compute({year,month,day,hour,gender:'M'|'F',longitude}) → chart
 */
(function (global) {
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN_WX = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  var GAN_YY = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];           // 1 = 陽
  var ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  var ZHI_YY = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  var WX = ['木', '火', '土', '金', '水'];
  var SHENG = {木: '火', 火: '土', 土: '金', 金: '水', 水: '木'};   // 我生
  var KE = {木: '土', 火: '金', 土: '水', 金: '木', 水: '火'};       // 我剋
  var HIDE = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
    申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  var TERM_NAMES = ['小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿',
    '芒種', '夏至', '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
  // 十二「節」：立春起，依序對應寅月到丑月
  var JIE_IDX = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 1];

  function ganIdx(ch) { return GAN.indexOf(ch); }
  function zhiIdx(ch) { return ZHI.indexOf(ch); }

  function shiShen(dayGan, otherGan) {
    var a = GAN_WX[ganIdx(dayGan)], b = GAN_WX[ganIdx(otherGan)];
    var same = GAN_YY[ganIdx(dayGan)] === GAN_YY[ganIdx(otherGan)];
    if (a === b) return same ? '比肩' : '劫財';
    if (SHENG[a] === b) return same ? '食神' : '傷官';
    if (KE[a] === b) return same ? '偏財' : '正財';
    if (KE[b] === a) return same ? '七殺' : '正官';
    if (SHENG[b] === a) return same ? '偏印' : '正印';
    return '';
  }

  function termDay(year, termIdx) {          // termIdx 1..24
    var d = global.SolarLunar ? global.SolarLunar.getTerm(year, termIdx) : -1;
    return d;
  }
  function jieDate(year, i) {               // i=0 立春(寅月) … i=10 大雪(子月)、i=11 小寒(丑月)
    var t = JIE_IDX[i];
    var m = Math.ceil(t / 2);
    var d = termDay(year, t);
    return { y: year, m: m, d: d };
  }
  function toUTC(y, m, d) { return Date.UTC(y, m - 1, d); }
  function daysBetween(a, b) { return Math.round((toUTC(b.y, b.m, b.d) - toUTC(a.y, a.m, a.d)) / 86400000); }

  function dayGanZhi(y, m, d) {
    var o = global.SolarLunar.solar2lunar(y, m, d);
    return o.gzDay;
  }

  // 回傳跨越三個年頭的「節」清單（含各自對應的月序 0=寅 … 11=丑）
  function jieList(y) {
    var list = [];
    [y - 1, y, y + 1].forEach(function (yy) {
      for (var i = 0; i < 11; i++) {           // 立春 … 大雪
        var j = jieDate(yy, i);
        list.push({ order: i, y: j.y, m: j.m, d: j.d });
      }
      var x = jieDate(yy, 11);                 // 小寒 → 丑月（隔年 1 月）
      list.push({ order: 11, y: x.y, m: x.m, d: x.d });
    });
    list.sort(function (a, b) { return toUTC(a.y, a.m, a.d) - toUTC(b.y, b.m, b.d); });
    return list;
  }

  function compute(inp) {
    var y = +inp.year, m = +inp.month, d = +inp.day, hh = +inp.hour;
    var gender = inp.gender === 'F' ? 'F' : 'M';
    var lunar = global.SolarLunar.solar2lunar(y, m, d);
    var lateZi = hh >= 23;

    // 日柱：23 時之後算次日子時（子時換日）
    var dy = new Date(Date.UTC(y, m - 1, d)), dt = { y: y, m: m, d: d };
    if (lateZi) {
      dy = new Date(Date.UTC(y, m - 1, d) + 86400000);
      dt = { y: dy.getUTCFullYear(), m: dy.getUTCMonth() + 1, d: dy.getUTCDate() };
    }
    var gzDay = dayGanZhi(dt.y, dt.m, dt.d);
    var dfGan = gzDay.charAt(0), dfZhi = gzDay.charAt(1);

    // 時柱：五鼠遁
    var hourZhi = Math.floor((hh + 1) / 2) % 12;
    var hourGan = GAN[(ganIdx(dfGan) * 2 + hourZhi) % 10];

    // 節氣換月／換年：以立春為年界、十二節為月界
    var jie = jieList(y);
    var born = { y: y, m: m, d: d };
    var bUTC = toUTC(y, m, d);
    var monthOrder = 11, monthStart = null;                  // 0=寅月
    jie.forEach(function (j) {
      if (toUTC(j.y, j.m, j.d) <= bUTC) { monthOrder = j.order; monthStart = j; }
    });

    // 年柱：立春前算前一年，年干以立春年為準
    var gzYearLib = lunar.gzYear;                            // 圖書館已以立春為界
    var yearGZ = gzYearLib;
    var yGan = yearGZ.charAt(0);
    var yGan = yearGZ.charAt(0);

    // 月柱：五虎遁（年干起寅月）
    var startGan = { 甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0 }[yGan];
    var monthGan = GAN[(startGan + monthOrder) % 10];
    var monthZhi = ZHI[(2 + monthOrder) % 12];
    var monthGZ = monthGan + monthZhi;

    var pillars = [
      { label: '年柱', gan: yGan, zhi: yearGZ.charAt(1) },
      { label: '月柱', gan: monthGan, zhi: monthZhi },
      { label: '日柱', gan: dfGan, zhi: dfZhi },
      { label: '時柱', gan: hourGan, zhi: ZHI[hourZhi] }
    ];

    // 十神與藏干
    pillars.forEach(function (p, idx) {
      p.ganSS = idx === 2 ? '日主' : shiShen(dfGan, p.gan);
      p.hide = HIDE[p.zhi].map(function (g) { return { gan: g, wx: GAN_WX[ganIdx(g)], ss: shiShen(dfGan, g) }; });
      p.zhiSS = p.hide[0].ss;
      p.zhiWX = ZHI_WX[zhiIdx(p.zhi)];
      p.ganWX = GAN_WX[ganIdx(p.gan)];
    });

    // 五行統計（天干 1、地支本氣 1、其餘藏干 0.6；月令同五行加成 1.4）
    var score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p) {
      score[p.ganWX] += 1;
      score[p.zhiWX] += 1;
      p.hide.forEach(function (h, i) { if (i > 0) score[h.wx] += 0.6; });
    });
    score[ZHI_WX[zhiIdx(monthZhi)]] += 1.4;

    var dmWX = GAN_WX[ganIdx(dfGan)];
    var support = score[dmWX] + score[WX[(WX.indexOf(dmWX) + 4) % 5]];   // 同我 + 生我
    var total = score.木 + score.火 + score.土 + score.金 + score.水;
    var ratio = support / total;
    var strength = ratio >= 0.62 ? '身強' : (ratio <= 0.42 ? '身弱' : '中和');

    // 十神統計
    var ssCount = {};
    pillars.forEach(function (p) {
      if (p.ganSS !== '日主') ssCount[p.ganSS] = (ssCount[p.ganSS] || 0) + 1;
      p.hide.forEach(function (h) { ssCount[h.ss] = (ssCount[h.ss] || 0) + (h === p.hide[0] ? 1 : 0.6); });
    });

    // 起運：陽男陰女順行，其餘逆行；到最近「節」的天數，三天折一年
    var yangYear = GAN_YY[ganIdx(yGan)] === 1;
    var forward = (yangYear && gender === 'M') || (!yangYear && gender === 'F');
    var target = null;
    if (forward) {
      for (var f = 0; f < jie.length; f++) {
        var jf = jie[f];
        if (toUTC(jf.y, jf.m, jf.d) > bUTC) { target = jf; break; }
      }
    } else {
      target = monthStart || jie[0];
    }
    var diffDays = Math.abs(daysBetween({ y: y, m: m, d: d }, target));
    var startAge = Math.floor(diffDays / 3);
    var startMonth = Math.round((diffDays % 3) * 4);
    if (startMonth >= 12) { startAge += 1; startMonth -= 12; }

    // 大運：由月柱起，順行則下一柱、逆行則上一柱
    var mIdx = 0;
    for (var q = 0; q < 60; q++) {
      if (GAN[q % 10] === monthGan && ZHI[q % 12] === monthZhi) { mIdx = q; break; }
    }
    var luck = [];
    for (var s = 1; s <= 10; s++) {
      var idx60 = ((mIdx + (forward ? s : -s)) % 60 + 60) % 60;
      var lg = GAN[idx60 % 10], lz = ZHI[idx60 % 12];
      var from = startAge + (s - 1) * 10;
      luck.push({
        gan: lg, zhi: lz, gz: lg + lz, from: from, to: from + 9,
        yearFrom: y + from, yearTo: y + from + 9,
        ganSS: shiShen(dfGan, lg),
        zhiSS: shiShen(dfGan, HIDE[lz][0]),
        wx: ZHI_WX[zhiIdx(lz)]
      });
    }

    // 流年：出生年到 +100，取近 12 年（今年前後）
    var thisYear = new Date().getFullYear();
    var flows = [];
    for (var fy = thisYear - 2; fy <= thisYear + 9; fy++) {
      var fGZ = global.SolarLunar.toGanZhi(fy - 4);      // 西元 4 年為甲子
      flows.push({ year: fy, gz: fGZ, ss: shiShen(dfGan, fGZ.charAt(0)), zhiSS: shiShen(dfGan, HIDE[fGZ.charAt(1)][0]) });
    }

    return {
      solar: { y: y, m: m, d: d, hour: hh },
      lunarText: lunar.yearCn + lunar.monthCn + lunar.dayCn,
      lunar: { year: lunar.lYear, month: lunar.lMonth, day: lunar.lDay, leap: lunar.isLeap },
      lateZi: lateZi,
      pillars: pillars,
      dayMaster: { gan: dfGan, wx: dmWX, yy: GAN_YY[ganIdx(dfGan)] ? '陽' : '陰' },
      score: score,
      total: total,
      ratio: ratio,
      strength: strength,
      ssCount: ssCount,
      monthOrder: monthOrder,
      monthName: ZHI[(2 + monthOrder) % 12] + '月',
      forward: forward,
      startAge: startAge,
      startMonth: startMonth,
      luck: luck,
      flows: flows,
      gender: gender
    };
  }

  global.Bazi = { compute: compute, shiShen: shiShen, GAN: GAN, ZHI: ZHI, GAN_WX: GAN_WX, ZHI_WX: ZHI_WX, HIDE: HIDE, WX: WX };

  /* ---------------- 排盤頁渲染 ---------------- */
  var HOUR_LABELS = ['00 子時', '01 丑時', '02 丑時', '03 寅時', '04 寅時', '05 卯時', '06 卯時',
    '07 辰時', '08 辰時', '09 巳時', '10 巳時', '11 午時', '12 午時', '13 未時', '14 未時',
    '15 申時', '16 申時', '17 酉時', '18 酉時', '19 戌時', '20 戌時', '21 亥時', '22 亥時', '23 子時(隔日)'];
  var WX_CLS = { 木: 'wx-wood', 火: 'wx-fire', 土: 'wx-earth', 金: 'wx-metal', 水: 'wx-water' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function pillarHTML(p) {
    var hide = p.hide.map(function (h, i) {
      return '<span><em>' + h.gan + '</em> ' + h.wx + '・' + h.ss + (i === 0 ? '（本氣）' : '') + '</span>';
    }).join('');
    return '<div class="pcol"><div class="pcol-head">' + p.label + '</div><div class="pcol-body">' +
      '<div class="ss">' + p.ganSS + '</div>' +
      '<div class="gz">' + p.gan + '<span class="zhi">' + p.zhi + '</span></div>' +
      '<div class="wx">' + p.ganWX + '／' + p.zhiWX + '・' + p.zhiSS + '</div>' +
      '<div class="hide-list">' + hide + '</div></div></div>';
  }

  function render(c) {
    var total = c.total || 1;
    var bars = WX.map(function (w) {
      var v = c.score[w], pct = Math.round(v / total * 100);
      return '<div class="wx-row ' + WX_CLS[w] + '"><span>' + w + '</span>' +
        '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<span>' + v.toFixed(1) + '（' + pct + '%）</span></div>';
    }).join('');

    var ssList = Object.keys(c.ssCount).sort(function (a, b) { return c.ssCount[b] - c.ssCount[a]; })
      .map(function (k) { return '<span>' + k + '<b>' + c.ssCount[k].toFixed(1) + '</b></span>'; }).join('');

    var luckRows = c.luck.map(function (l, i) {
      return '<tr><td>' + (i + 1) + '</td><td class="gz">' + l.gz + '</td>' +
        '<td>' + l.from + '–' + l.to + ' 歲</td><td>' + l.yearFrom + '–' + l.yearTo + '</td>' +
        '<td class="ss">' + l.ganSS + '</td><td class="ss">' + l.zhiSS + '</td><td>' + l.wx + '</td></tr>';
    }).join('');

    var flowRows = c.flows.map(function (f) {
      return '<tr><td>' + f.year + '</td><td class="gz">' + f.gz + '</td>' +
        '<td class="ss">' + f.ss + '</td><td class="ss">' + f.zhiSS + '</td></tr>';
    }).join('');

    var dm = c.dayMaster;
    return '' +
      '<div class="bz-panel"><h3>命盤總覽 <span>SUMMARY</span></h3>' +
      '<div class="bz-summary">' +
      '<span class="bz-chip">國曆 <b>' + c.solar.y + '-' + c.solar.m + '-' + c.solar.d + ' ' + c.solar.hour + ' 時</b></span>' +
      '<span class="bz-chip">農曆 <b>' + c.lunarText + '</b>' + (c.lunar.leap ? '（閏月）' : '') + '</span>' +
      '<span class="bz-chip">日主 <b>' + dm.yy + dm.gan + dm.wx + '</b></span>' +
      '<span class="bz-chip">月令 <b>' + c.monthName + '</b></span>' +
      '<span class="bz-chip">旺衰 <b>' + c.strength + '</b></span>' +
      (c.lateZi ? '<span class="bz-chip">已套用 <b>23 時換日</b></span>' : '') +
      '</div>' +
      '<div class="pillars">' + c.pillars.map(pillarHTML).join('') + '</div>' +
      '<div class="bz-legend">四柱由左至右為年、月、日、時。天干下方的字是十神，地支下方列出藏干（第一位為本氣）。</div></div>' +

      '<div class="bz-panel"><h3>五行強弱 <span>FIVE ELEMENTS</span></h3>' +
      '<p class="bz-sub">計分方式：天干與地支本氣各 1 分，其餘藏干各 0.6 分，月令同五行額外加成 1.4 分。</p>' +
      '<div class="wx-bars">' + bars + '</div>' +
      '<div class="strength-box"><div class="big">' + c.strength + '<br><em>' + (Math.round(c.ratio * 100)) + '%</em></div>' +
      '<p>以日主 ' + dm.gan + '（' + dm.wx + '）為中心：同我與生我的力量占 ' + Math.round(c.ratio * 100) +
      '%。超過 62% 判為身強、低於 42% 判為身弱，中間為中和。身強宜洩耗、身弱宜生扶，這是取用神的第一步。</p></div></div>' +

      '<div class="bz-panel"><h3>十神分布 <span>TEN GODS</span></h3>' +
      '<p class="bz-sub">以日干為基準，依五行生剋與陰陽異同推出。數值含藏干加權。</p>' +
      '<div class="ss-chips">' + (ssList || '<span>十神資料不足</span>') + '</div></div>' +

      '<div class="bz-panel"><h3>大運 <span>LUCK PILLARS</span></h3>' +
      '<p class="bz-sub">' + (c.forward ? '順行' : '逆行') + '；出生後 ' + c.startAge + ' 年 ' + c.startMonth + ' 個月起運（三天折一年、一天折四個月）。</p>' +
      '<div class="tbl-wrap"><table class="bz-table"><thead><tr><th>序</th><th>大運</th><th>年齡</th><th>西元</th><th>干十神</th><th>支十神</th><th>地支五行</th></tr></thead><tbody>' + luckRows + '</tbody></table></div></div>' +

      '<div class="bz-panel"><h3>流年 <span>ANNUAL</span></h3>' +
      '<p class="bz-sub">以今年為基準前後列出，方便對照大運與流年的疊盤。</p>' +
      '<div class="tbl-wrap"><table class="bz-table"><thead><tr><th>西元</th><th>干支</th><th>干十神</th><th>支十神</th></tr></thead><tbody>' + flowRows + '</tbody></table></div>' +
      '<div class="bz-legend">本工具為傳統命理文化之教學輔助，結果呈現「傾向」而非「必然」，不構成醫療、法律或財務建議。</div></div>';
  }

  var BaziUI = {
    init: function () {
      var sel = document.getElementById('bzHour');
      if (!sel) return;
      sel.innerHTML = HOUR_LABELS.map(function (t, i) {
        return '<option value="' + i + '"' + (i === 12 ? ' selected' : '') + '>' + t + '</option>';
      }).join('');
      document.getElementById('bzSubmit').addEventListener('click', function () { BaziUI.run(); });
      BaziUI.run();
    },
    run: function () {
      var y = +document.getElementById('bzYear').value,
        m = +document.getElementById('bzMonth').value,
        d = +document.getElementById('bzDay').value,
        h = +document.getElementById('bzHour').value,
        g = document.getElementById('bzGender').value;
      var out = document.getElementById('baziResult');
      if (!(y >= 1900 && y <= 2100) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) {
        out.innerHTML = '<div class="bz-panel">請輸入有效的國曆日期（1900–2100 年）。</div>';
        return;
      }
      var date = new Date(Date.UTC(y, m - 1, d));
      if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        out.innerHTML = '<div class="bz-panel">這個月份沒有 ' + d + ' 日，請確認日期。</div>';
        return;
      }
      try {
        out.innerHTML = render(compute({ year: y, month: m, day: d, hour: h, gender: g }));
      } catch (e) {
        out.innerHTML = '<div class="bz-panel">排盤失敗：' + esc(e.message) + '</div>';
      }
    }
  };
  if (typeof window !== 'undefined') window.BaziUI = BaziUI;
})(typeof window !== 'undefined' ? window : globalThis);
