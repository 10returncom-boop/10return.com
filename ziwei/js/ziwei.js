/* ============================================================
   紫微斗數排盤引擎 ziwei.js
   依傳統安星規則計算十二宮、十四主星、輔煞星、生年四化、大限與流年
   ============================================================ */
(function (global) {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var PAL = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '事業', '田宅', '福德', '父母'];
  var MAIN_ORDER = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];
  var AUX = [['左輔', 'good'], ['右弼', 'good'], ['文昌', 'good'], ['文曲', 'good'], ['天魁', 'good'], ['天鉞', 'good'],
             ['祿存', 'misc'], ['天馬', 'misc'], ['擎羊', 'bad'], ['陀羅', 'bad'], ['火星', 'bad'], ['鈴星', 'bad'], ['地空', 'bad'], ['地劫', 'bad']];

  /* 六十甲子納音（每兩組同一個五行） */
  var NAYIN = ['金', '火', '木', '土', '金', '火', '水', '土', '金', '木', '水', '土', '火', '木', '水',
               '金', '火', '木', '土', '金', '火', '水', '土', '金', '木', '水', '土', '火', '木', '水'];
  var JU = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };
  var JU_NAME = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

  /* 十干四化：祿、權、科、忌 */
  var HUA = [
    ['廉貞', '破軍', '武曲', '太陽'],   // 甲
    ['天機', '天梁', '紫微', '太陰'],   // 乙
    ['天同', '天機', '文昌', '廉貞'],   // 丙
    ['太陰', '天同', '天機', '巨門'],   // 丁
    ['貪狼', '太陰', '右弼', '天機'],   // 戊
    ['武曲', '貪狼', '天梁', '文曲'],   // 己
    ['太陽', '武曲', '太陰', '天同'],   // 庚
    ['巨門', '太陽', '文曲', '文昌'],   // 辛
    ['天梁', '紫微', '左輔', '武曲'],   // 壬
    ['破軍', '巨門', '太陰', '貪狼']    // 癸
  ];

  /* 命主（依命宮地支）、身主（依生年地支） */
  var MINGZHU = ['貪狼', '巨門', '祿存', '文曲', '廉貞', '武曲', '破軍', '武曲', '廉貞', '文曲', '祿存', '巨門'];
  var SHENZHU = ['火星', '天相', '天梁', '天同', '文昌', '天機', '火星', '天相', '天梁', '天同', '文昌', '天機'];

  /* 天魁、天鉞（依年干）：[魁, 鉞] */
  var KUIYUE = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]];
  var LUCUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  var MA_GROUP = { 2: 8, 6: 8, 10: 8, 8: 2, 0: 2, 4: 2, 5: 11, 9: 11, 1: 11, 11: 5, 3: 5, 7: 5 };
  var FIRE_G = { 2: 1, 6: 1, 10: 1, 8: 2, 0: 2, 4: 2, 5: 3, 9: 3, 1: 3, 11: 9, 3: 9, 7: 9 };
  var BELL_G = { 2: 3, 6: 3, 10: 3, 8: 10, 0: 10, 4: 10, 5: 10, 9: 10, 1: 10, 11: 10, 3: 10, 7: 10 };

  var STAR = {
    紫微: { wx: '土', qi: '尊', tag: '尊貴、重地位，天生有中心感', good: '有格局、能統御、扛得起責任', bad: '愛面子、耳根軟、放不下身段',
      money: '靠整合資源與品牌賺錢，支出偏大，要留意場面開銷', career: '適合管理、決策與對外代表，需要被授權才有表現',
      love: '需要被尊重與被看重，容易期待對方配合自己的節奏', health: '留意脾胃、代謝與血壓，應酬多時負擔明顯', mind: '要的是「被肯定」，失去位置感就容易焦慮' },
    天機: { wx: '木', qi: '智', tag: '靈活、善謀，腦子轉得快', good: '反應快、能規劃、善於應變', bad: '想太多、易變動、落地面不足',
      money: '靠企劃、顧問與技術賺錢，收入變動較大', career: '適合企劃、分析、研究與需要應變的工作',
      love: '重視心靈交流，容易想太多而反覆', health: '留意神經、睡眠與肝膽', mind: '思慮多、放不下，需要把想法落地才安穩' },
    太陽: { wx: '火', qi: '貴', tag: '光明、付出、重名聲', good: '大方、有責任感、能照人', bad: '付出過度、愛面子、易累',
      money: '靠服務、業務與曝光賺錢，容易為人情花錢', career: '適合教育、媒體、業務與需要對外的工作',
      love: '付出型，容易單方面燃燒', health: '留意眼睛、心血管與血壓', mind: '需要被看見、被感謝' },
    武曲: { wx: '金', qi: '財', tag: '務實、剛毅、重效率', good: '執行力強、能守財、講信用', bad: '固執、不善表達、重錢輕情',
      money: '靠專業、技術與金融賺錢，理財務實', career: '適合金融、工程、製造與執行導向職務',
      love: '表達笨拙但可靠，需要對方理解', health: '留意呼吸、皮膚與筋骨', mind: '用「把事情做好」換取安全感' },
    天同: { wx: '水', qi: '福', tag: '溫和、重享受、怕壓力', good: '親和、有福氣、懂生活', bad: '安逸、決斷慢、容易逃避',
      money: '靠服務與生活型工作賺錢，夠用就好', career: '適合服務、設計、內容與步調穩定的工作',
      love: '需要陪伴與舒服的相處', health: '留意泌尿、內分泌與體重', mind: '想過好日子，壓力一來就想繞開' },
    廉貞: { wx: '火', qi: '囚', tag: '原則、敏銳、重規範', good: '有原則、能自省、執行細膩', bad: '界線硬、易糾結、內心壓抑',
      money: '靠專業與規矩賺錢，理財偏保守', career: '適合管理、稽核、法務與需要原則的工作',
      love: '界線清楚、重忠誠，容易反覆拉扯', health: '留意免疫、精神壓力與發炎', mind: '需要「說得通」與公平感' },
    天府: { wx: '土', qi: '庫', tag: '穩重、能守、重安全感', good: '能守成、善管理、有份量', bad: '保守、怕改變、易空庫',
      money: '靠經營、財務與不動產累積，重守成', career: '適合財務、經營、後勤與管理',
      love: '重穩定與體面，需要安全感', health: '留意消化與代謝', mind: '要的是穩定與可控' },
    太陰: { wx: '水', qi: '富', tag: '細膩、重感受、能累積', good: '細心、審美佳、能長期經營', bad: '敏感、情緒化、易多慮',
      money: '靠財務、設計與房產細水長流', career: '適合財務、設計、照護與規劃型工作',
      love: '敏感、需要被照顧與被理解', health: '留意內分泌、情緒與睡眠', mind: '需要安全感，怕被忽略' },
    貪狼: { wx: '木', qi: '欲', tag: '多才、好奇、慾望強', good: '多才多藝、公關強、敢嘗試', bad: '分心、應酬多、慾望難滿足',
      money: '靠業務、行銷與娛樂多元進帳，敢花', career: '適合業務、行銷、娛樂與多線發展',
      love: '重新鮮感與魅力，誘惑較多', health: '留意肝膽、作息與應酬', mind: '想要更多體驗，容易分心' },
    巨門: { wx: '水', qi: '暗', tag: '善辯、重真相、靠口才', good: '口條好、追根究柢、專業深', bad: '口舌是非、疑心重、易傷人',
      money: '靠專業、教學與口才賺錢', career: '適合律師、教師、顧問與研究',
      love: '容易因說話方式起摩擦', health: '留意腸胃、口腔與情緒', mind: '需要把事情講清楚才有安全感' },
    天相: { wx: '水', qi: '印', tag: '重體面、善協調', good: '得體、公正、能輔佐', bad: '猶豫、怕得罪人、缺主見',
      money: '靠穩定職務與信用累積', career: '適合行政、公關、專案與輔佐角色',
      love: '重視公平與形象，需要體面', health: '留意泌尿與循環', mind: '需要被肯定與和諧' },
    天梁: { wx: '土', qi: '蔭', tag: '有原則、愛照顧、帶長輩氣', good: '有原則、能庇蔭、看得遠', bad: '說教、清高、放不下責任',
      money: '靠專業與保障型收入，偏保守', career: '適合醫療、教育、公職與顧問',
      love: '容易像長輩一樣照顧對方', health: '留意脾胃與慢性問題', mind: '需要「做對的事」與被需要' },
    七殺: { wx: '金', qi: '將', tag: '決斷、獨立、能扛壓', good: '敢決斷、能扛、行動力強', bad: '太硬、孤軍、容易樹敵',
      money: '敢賺敢投，起伏大', career: '適合創業、業務、軍警與高壓決策',
      love: '需要空間與尊重，強弱分明', health: '留意筋骨、外傷與血壓', mind: '需要掌控感' },
    破軍: { wx: '水', qi: '耗', tag: '改革、敢破、變化大', good: '敢改革、適應快、能重建', bad: '衝動、耗損大、易重來',
      money: '收入起伏大，容易大進大出', career: '適合創業、專案、影視與變動型工作',
      love: '關係起伏大，容易重新開始', health: '留意腎、生殖與過度耗損', mind: '需要不斷更新，容易厭倦' }
  };

  var HUA_LABEL = ['祿', '權', '科', '忌'];
  var HUA_CLASS = ['hua-lu', 'hua-quan', 'hua-ke', 'hua-ji'];
  var POS = { 0: [4, 3], 1: [4, 2], 2: [4, 1], 3: [3, 1], 4: [2, 1], 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 9: [2, 4], 10: [3, 4], 11: [4, 4] };

  function mod(n, m) { return ((n % m) + m) % m; }
  function gz(gan, zhi) { return GAN[mod(gan, 10)] + ZHI[mod(zhi, 12)]; }
  function jiaziIndex(gan, zhi) {
    for (var i = 0; i < 60; i++) { if (i % 10 === gan && i % 12 === zhi) return i; }
    return 0;
  }

  /* ---------- 主計算 ---------- */
  function computeChart(o) {
    var lib = SOLAR_LIB();
    if (!lib) throw new Error('農曆資料庫未載入');
    var lon = (o.longitude === '' || o.longitude === null || o.longitude === undefined) ? null : Number(o.longitude);
    var notes = [];
    var dt = new Date(o.year, o.month - 1, o.day, o.hour, 0, 0);
    if (lon !== null && isFinite(lon)) {
      var corr = Math.round((lon - 120) * 4);
      dt = new Date(dt.getTime() + corr * 60000);
      notes.push('真太陽時校正 ' + (corr >= 0 ? '+' : '') + corr + ' 分鐘（經度 ' + lon + '°）');
    }
    if (dt.getHours() >= 23) {
      dt = new Date(dt.getTime() + 24 * 60 * 60000);
      notes.push('出生於 23:00 之後，晚子時以次日子時計算');
    }
    var sy = dt.getFullYear(), sm = dt.getMonth() + 1, sd = dt.getDate();
    var hourForBranch = dt.getHours();

    var lunar = lib.solar2lunar(sy, sm, sd);
    if (!lunar || !lunar.lYear) throw new Error('此日期超出可換算範圍（1900–2100）');

    var ly = lunar.lYear, lm = lunar.lMonth, ld = lunar.lDay, isLeap = !!lunar.isLeap;
    var month = lm;
    if (isLeap) {
      if (o.leapRule === 'nextMonth') month = lm + 1;
      else if (o.leapRule === 'after15') month = ld > 15 ? lm + 1 : lm;
    }
    if (month > 12) month = 12;
    if (isLeap) notes.push('出生於閏' + lm + '月，採「' + ({ thisMonth: '閏月視同本月', after15: '十五日前算本月', nextMonth: '閏月算下月' })[o.leapRule] + '」，以 ' + month + ' 月起算命宮');

    var hourBranch = Math.floor((hourForBranch + 1) / 2) % 12;
    var yearGan = mod(ly - 4, 10), yearZhi = mod(ly - 4, 12);
    var yang = yearGan % 2 === 0;
    var male = o.gender === 'M';

    /* 命宮、身宮 */
    var ming = mod(2 + (month - 1) - hourBranch, 12);
    var shen = mod(2 + (month - 1) + hourBranch, 12);

    /* 宮干：五虎遁 */
    var yinGan = [2, 4, 6, 8, 0][yearGan % 5];

    /* 五行局 */
    var mingGan = mod(yinGan + mod(ming - 2, 12), 10);
    var na = NAYIN[Math.floor(jiaziIndex(mingGan, ming) / 2)];
    var ju = JU[na];

    /* 紫微 */
    var q = Math.ceil(ld / ju);
    var x = q * ju - ld;
    var base = mod(2 + (q - 1), 12);
    var zw = (x % 2 === 0) ? mod(base + x, 12) : mod(base - x, 12);
    var tf = mod(4 - zw, 12);

    var pos = {};
    pos['紫微'] = zw;
    pos['天機'] = mod(zw - 1, 12);
    pos['太陽'] = mod(zw - 3, 12);
    pos['武曲'] = mod(zw - 4, 12);
    pos['天同'] = mod(zw - 5, 12);
    pos['廉貞'] = mod(zw - 8, 12);
    pos['天府'] = tf;
    pos['太陰'] = mod(tf + 1, 12);
    pos['貪狼'] = mod(tf + 2, 12);
    pos['巨門'] = mod(tf + 3, 12);
    pos['天相'] = mod(tf + 4, 12);
    pos['天梁'] = mod(tf + 5, 12);
    pos['七殺'] = mod(tf + 6, 12);
    pos['破軍'] = mod(tf + 10, 12);

    /* 輔煞星 */
    pos['左輔'] = mod(4 + (month - 1), 12);
    pos['右弼'] = mod(10 - (month - 1), 12);
    pos['文昌'] = mod(10 - hourBranch, 12);
    pos['文曲'] = mod(4 + hourBranch, 12);
    pos['地空'] = mod(11 - hourBranch, 12);
    pos['地劫'] = mod(11 + hourBranch, 12);
    pos['天魁'] = KUIYUE[yearGan][0];
    pos['天鉞'] = KUIYUE[yearGan][1];
    var lu = LUCUN[yearGan];
    pos['祿存'] = lu;
    pos['擎羊'] = mod(lu + 1, 12);
    pos['陀羅'] = mod(lu - 1, 12);
    pos['火星'] = mod(FIRE_G[yearZhi] + hourBranch, 12);
    pos['鈴星'] = mod(BELL_G[yearZhi] + hourBranch, 12);
    pos['天馬'] = MA_GROUP[yearZhi];

    /* 十二宮 */
    var palaces = [];
    for (var i = 0; i < 12; i++) {
      var z = mod(ming - i, 12);
      palaces.push({
        index: i, name: PAL[i], zhi: z, gan: mod(yinGan + mod(z - 2, 12), 10),
        stars: [], aux: [], dx: null, gz: ''
      });
    }
    palaces.forEach(function (p) { p.gz = gz(p.gan, p.zhi); });

    MAIN_ORDER.forEach(function (s) {
      palaces[mod(ming - pos[s], 12)].stars.push({ n: s, type: 'main' });
    });
    AUX.forEach(function (a) {
      palaces[mod(ming - pos[a[0]], 12)].aux.push({ n: a[0], type: a[1] });
    });

    /* 生年四化 */
    var huaList = [];
    HUA[yearGan].forEach(function (s, k) {
      var z = pos[s];
      if (z === undefined) return;
      var pal = palaces[mod(ming - z, 12)];
      pal.stars.forEach(function (st) { if (st.n === s) st.hua = k; });
      pal.aux.forEach(function (st) { if (st.n === s) st.hua = k; });
      huaList.push({ star: s, type: k, label: HUA_LABEL[k], palace: pal.name, zhi: z });
    });

    /* 大限 */
    var forward = (yang && male) || (!yang && !male);
    var startAge = ju;
    var limits = [];
    for (var k = 0; k < 12; k++) {
      var z2 = forward ? mod(ming + k, 12) : mod(ming - k, 12);
      var p2 = palaces[mod(ming - z2, 12)];
      p2.dx = { from: startAge + 10 * k, to: startAge + 10 * k + 9 };
      limits.push({ order: k + 1, from: startAge + 10 * k, to: startAge + 10 * k + 9, palace: p2.name, zhi: z2, gz: p2.gz, stars: p2.stars.map(function (s) { return s.n; }) });
    }

    return {
      lunar: { y: ly, m: lm, d: ld, isLeap: isLeap },
      lunarText: (isLeap ? '閏' : '') + lm + '月' + ld + '日',
      monthUsed: month, dayUsed: ld,
      solar: { y: sy, m: sm, d: sd, hour: hourForBranch },
      hourBranch: hourBranch,
      notes: notes,
      yearGan: yearGan, yearZhi: yearZhi, yearGZ: gz(yearGan, yearZhi),
      yinYang: yang ? '陽' : '陰', male: male,
      ming: ming, shen: shen,
      ju: ju, juName: JU_NAME[ju], na: na,
      mingGZ: gz(mingGan, ming),
      mingzhu: MINGZHU[ming], shenzhu: SHENZHU[yearZhi],
      palaces: palaces, pos: pos, hua: huaList, limits: limits,
      forward: forward,
      startAge: startAge,
      birthYear: ly
    };
  }

  function SOLAR_LIB() {
    if (typeof module !== 'undefined' && module.exports) {
      try { return require('./solarlunar.min.js'); } catch (e) { return null; }
    }
    return global.solarlunar || null;
  }

  /* ---------- 流年 ---------- */
  function liunianData(chart, year) {
    var gan = mod(year - 4, 10), zhi = mod(year - 4, 12);
    var z = zhi; // 流年命宮＝該年地支所在宮
    var pal = chart.palaces[mod(chart.ming - z, 12)];
    var hua = HUA[gan].map(function (s, k) {
      var pz = chart.pos[s];
      return { star: s, type: k, label: HUA_LABEL[k], palace: chart.palaces[mod(chart.ming - pz, 12)].name, zhi: pz };
    });
    var age = year - chart.birthYear + 1;
    var limit = null;
    chart.limits.forEach(function (l) { if (age >= l.from && age <= l.to) limit = l; });
    return { year: year, gan: gan, zhi: zhi, gz: gz(gan, zhi), palace: pal, hua: hua, age: age, limit: limit };
  }

  /* ---------- 解讀 ---------- */
  function starsOf(p) { return p.stars.map(function (s) { return s.n; }); }
  function opposite(chart, p) { return chart.palaces[mod(p.index + 6, 12)]; }

  function mainText(p, chart) {
    var names = starsOf(p);
    if (!names.length) {
      var o = opposite(chart, p);
      var os = starsOf(o);
      if (!os.length) return { head: '空宮（對宮亦無主星）', body: '此宮借星力量薄弱，需以三方四正與四化補看。' };
      return { head: '空宮，借對宮 ' + o.name + ' 的 ' + os.join('、'), body: os.map(function (n) { return STAR[n].tag + '。'; }).join('') };
    }
    var first = names[0];
    return {
      head: names.join('、') + '坐守',
      body: names.map(function (n) { return STAR[n].tag + '。'; }).join('')
    };
  }

  /* ---------- 渲染（僅瀏覽器） ---------- */
  function el(id) { return document.getElementById(id); }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function buildGrid(chart, lnZhi) {
    var html = [];
    chart.palaces.forEach(function (p) {
      var pos = POS[p.zhi];
      var cls = 'pcell' + (p.index === 0 ? ' is-ming' : '') + (lnZhi === p.zhi ? ' is-liunian' : '');
      var main = p.stars.map(function (s) {
        var h = (s.hua !== undefined) ? '<i class="hua ' + HUA_CLASS[s.hua] + '">' + HUA_LABEL[s.hua] + '</i>' : '';
        return '<b class="pstar">' + s.n + h + '</b>';
      }).join('');
      var aux = p.aux.map(function (s) {
        var h = (s.hua !== undefined) ? '<i class="hua ' + HUA_CLASS[s.hua] + '">' + HUA_LABEL[s.hua] + '</i>' : '';
        return '<i>' + s.n + h + '</i>';
      }).join('');
      html.push('<div class="' + cls + '" style="grid-row:' + pos[0] + ';grid-column:' + pos[1] + '">' +
        '<div class="pcell-h"><span class="pname">' + p.name + '</span><span class="pgan">' + p.gz + '</span></div>' +
        '<div class="pcell-stars">' + (main || '<b class="pstar" style="background:rgba(255,255,255,.1);color:#aebfe6">空宮</b>') + '</div>' +
        '<div class="paux">' + aux + '</div>' +
        '<div class="pcell-f"><span class="pdx">' + (p.dx ? p.dx.from + '–' + p.dx.to : '') + '</span><span class="pzhi">' + ZHI[p.zhi] + '</span></div>' +
        '</div>');
    });
    html.push('<div class="chart-center">' +
      '<div class="cc-title">紫微斗數</div>' +
      '<div class="cc-sub">ZIWEI ASTROLOGY</div>' +
      '<div class="cc-facts">' +
      '<span>農曆 ' + chart.lunar.y + '年' + chart.lunarText + '</span>' +
      '<span>' + chart.yearGZ + '年</span>' +
      '<span>' + chart.juName + '</span>' +
      '<span>命主 ' + chart.mingzhu + '</span>' +
      '<span>身主 ' + chart.shenzhu + '</span>' +
      '</div></div>');
    el('chartGrid').innerHTML = html.join('');
  }

  function metaHTML(chart) {
    var gzHour = ZHI[chart.hourBranch] + '時';
    var items = [
      ['農曆生日', chart.lunar.y + '年' + chart.lunarText + (chart.lunar.isLeap ? '（閏）' : '')],
      ['出生時辰', gzHour + '・' + chart.solar.hour + ':00'],
      ['性別', chart.yinYang + '・' + (chart.male ? '男' : '女')],
      ['年干支', chart.yearGZ + '年'],
      ['五行局', chart.juName + '（' + chart.na + '）'],
      ['命宮', ZHI[chart.ming] + '宮・' + chart.mingGZ],
      ['身宮', ZHI[chart.shen] + '宮'],
      ['命主／身主', chart.mingzhu + '／' + chart.shenzhu]
    ];
    return items.map(function (it) { return '<span>' + it[0] + '<b>' + esc(it[1]) + '</b></span>'; }).join('');
  }

  function readoutHTML(chart) {
    var cards = [];
    var mingP = chart.palaces[0];
    var mt = mainText(mingP, chart);

    cards.push('<div class="readout-card"><h3>命宮 <em>' + ZHI[chart.ming] + '宮 ' + chart.mingGZ + '</em></h3>' +
      '<p><b>' + esc(mt.head) + '</b></p><p>' + esc(mt.body) + '</p>' +
      (starsOf(mingP).length ? '<p>優勢：' + esc(STAR[starsOf(mingP)[0]].good) + '；要留意：' + esc(STAR[starsOf(mingP)[0]].bad) + '。</p>' : '') +
      '<p style="font-size:12.5px;color:var(--ink-300)">身宮在' + ZHI[chart.shen] + '宮（' + chart.palaces[mod(chart.ming - chart.shen, 12)].name + '），後半生重心會往這裡偏。</p></div>');

    /* 三方四正 */
    var tri = [0, 6, 4, 8].map(function (i) {
      var p = chart.palaces[i];
      var s = starsOf(p);
      return '<li><b>' + p.name + '</b>（' + ZHI[p.zhi] + '）：' + (s.length ? s.join('、') : '空宮，借對宮 ' + starsOf(opposite(chart, p)).join('、')) + '</li>';
    }).join('');
    cards.push('<div class="readout-card"><h3>三方四正</h3><ul>' + tri + '</ul></div>');

    /* 生年四化 */
    var huaHTML = chart.hua.map(function (h) {
      return '<li><b>' + h.star + '化' + h.label + '</b> → ' + h.palace + '（' + ZHI[h.zhi] + '）</li>';
    }).join('');
    cards.push('<div class="readout-card"><h3>生年四化 <em>' + chart.yearGZ + '年</em></h3><ul>' + huaHTML + '</ul></div>');

    /* 五大宮位 */
    var keys = [[4, '財帛', 'money'], [8, '事業', 'career'], [2, '夫妻', 'love'], [5, '疾厄', 'health'], [10, '福德', 'mind']];
    var five = keys.map(function (k) {
      var p = chart.palaces[k[0]];
      var s = starsOf(p);
      var star = s.length ? s[0] : starsOf(opposite(chart, p))[0];
      var head = s.length ? s.join('、') : '空宮（借 ' + (star || '—') + '）';
      return '<p><b>' + k[1] + '宮</b>（' + ZHI[p.zhi] + '）：' + head + '。' + (star && STAR[star] ? esc(STAR[star][k[2]]) : '') + '</p>';
    }).join('');
    cards.push('<div class="readout-card"><h3>五大宮位解讀</h3>' + five + '</div>');

    return cards.join('');
  }

  function limitTableHTML(chart, age) {
    var rows = ['<thead><tr><th>大限</th><th>歲數（虛歲）</th><th>宮位</th><th>宮干支</th><th>宮名</th><th>主星</th></tr></thead><tbody>'];
    chart.limits.slice().sort(function (a, b) { return a.from - b.from; }).forEach(function (l, i) {
      var now = (age !== undefined && age >= l.from && age <= l.to) ? ' class="now"' : '';
      rows.push('<tr' + now + '><td>' + (i + 1) + '</td><td class="age">' + l.from + '–' + l.to + '</td><td>' + ZHI[l.zhi] + '宮</td><td>' + l.gz + '</td><td>' + l.palace + '</td><td>' + (l.stars.length ? l.stars.join('、') : '空宮') + '</td></tr>');
    });
    rows.push('</tbody>');
    el('limitTable').innerHTML = rows.join('');
  }

  function liunianHTML(chart, ln) {
    var s = starsOf(ln.palace);
    var head = s.length ? s.join('、') : '空宮，借對宮 ' + (starsOf(chart.palaces[mod(ln.palace.index + 6, 12)])[0] || '—');
    var hua = ln.hua.map(function (h) { return h.star + '化' + h.label + '→' + h.palace; }).join('、');
    var box = [
      ['流年', ln.year + '（' + ln.gz + '年）'],
      ['虛歲', ln.age + ' 歲'],
      ['流年命宮', ZHI[ln.zhi] + '宮・' + ln.palace.name],
      ['該宮主星', head],
      ['流年四化', hua],
      ['所屬大限', ln.limit ? ln.limit.from + '–' + ln.limit.to + ' 歲（' + ln.limit.palace + '）' : '尚未起運']
    ];
    el('liunianBox').innerHTML = box.map(function (b) {
      return '<div class="lb"><span>' + b[0] + '</span><b>' + esc(b[1]) + '</b></div>';
    }).join('') + '<div class="lb" style="grid-column:1/-1"><span>一句話</span><b>' +
      esc((s.length && STAR[s[0]] ? STAR[s[0]].tag + '；' + STAR[s[0]].career : '此年主題不明顯，宜借對宮與大限同看。')) + '</b></div>';
  }

  var current = null;

  function render(chart) {
    current = chart;
    el('chartMeta').innerHTML = metaHTML(chart);
    el('chartReadout').innerHTML = readoutHTML(chart);
    el('chartEmpty').hidden = true;
    el('chartResult').hidden = false;

    var ys = el('yearSelect');
    var years = [];
    var base = new Date().getFullYear();
    for (var y = Math.max(chart.birthYear, base - 6); y <= base + 10; y++) years.push(y);
    ys.innerHTML = years.map(function (v) { return '<option value="' + v + '"' + (v === base ? ' selected' : '') + '>' + v + ' 年</option>'; }).join('');

    var ln = liunianData(chart, base);
    buildGrid(chart, ZHI[ln.zhi]);
    liunianHTML(chart, ln);
    limitTableHTML(chart, ln.age);
  }

  function showError(msg) {
    var box = el('chartError');
    box.textContent = msg;
    box.hidden = false;
    box.style.cssText = 'margin-top:18px;padding:14px 16px;border-radius:10px;background:#fff1f3;border:1px solid #f3c2c9;color:#8f2430;font-size:14px';
  }

  function init() {
    var hourSel = el('birthHour');
    var opts = [];
    for (var h = 0; h < 24; h++) {
      var idx = Math.floor((h + 1) / 2) % 12;
      var label = (h < 10 ? '0' + h : h) + ':00　' + ZHI[idx] + '時' + (h === 23 ? '（晚子時）' : h === 0 ? '（早子時）' : '');
      opts.push('<option value="' + h + '"' + (h === 12 ? ' selected' : '') + '>' + label + '</option>');
    }
    hourSel.innerHTML = opts.join('');

    el('chartForm').addEventListener('submit', function (e) {
      e.preventDefault();
      el('chartError').hidden = true;
      var dv = el('birthDate').value;
      if (!dv) { showError('請先選擇出生日期。'); return; }
      var parts = dv.split('-');
      try {
        var chart = computeChart({
          year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]),
          hour: Number(el('birthHour').value), gender: el('gender').value,
          leapRule: el('leapRule').value, longitude: el('longitude').value.trim()
        });
        render(chart);
        if (chart.notes.length) {
          el('chartMeta').innerHTML += '<span style="background:#fff3e6;border-color:#f7d3ad;color:#8a5a12">' + esc(chart.notes.join('；')) + '</span>';
        }
        el('chartResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        showError(err.message || '排盤失敗，請確認日期是否正確。');
      }
    });

    el('yearSelect').addEventListener('change', function () {
      if (!current) return;
      var ln = liunianData(current, Number(this.value));
      buildGrid(current, ZHI[ln.zhi]);
      liunianHTML(current, ln);
      limitTableHTML(current, ln.age);
    });

    el('printBtn').addEventListener('click', function () {
      if (!current) { showError('請先排盤，再列印。'); return; }
      window.print();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computeChart: computeChart, liunianData: liunianData, GAN: GAN, ZHI: ZHI, HUA: HUA };
  } else {
    global.Ziwei = { computeChart: computeChart, liunianData: liunianData };
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
      else init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
