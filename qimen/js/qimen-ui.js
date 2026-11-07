/* 奇門遁甲排盤頁 UI：表單、九宮盤、用神定位、逐宮表 */
(function () {
  'use strict';
  var Q = window.Qimen;
  var LAST = null, USEKEY = '';

  var LAYOUT = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

  function $(id) { return document.getElementById(id); }
  function val(id) { return $(id).value; }

  function fillSelects() {
    var y = $('qmYear'), m = $('qmMonth'), d = $('qmDay'), h = $('qmHour');
    var now = new Date();
    for (var i = 1900; i <= 2100; i++) y.appendChild(new Option(i + ' 年', i));
    for (var j = 1; j <= 12; j++) m.appendChild(new Option(j + ' 月', j));
    for (var k = 1; k <= 31; k++) d.appendChild(new Option(k + ' 日', k));
    for (var hh = 0; hh < 24; hh++) {
      var zhi = Q.ZHI[Math.floor((hh + 1) / 2) % 12];
      h.appendChild(new Option(('0' + hh).slice(-2) + ':00（' + zhi + '時）', hh));
    }
    y.value = now.getFullYear(); m.value = now.getMonth() + 1; d.value = now.getDate();
    h.value = now.getHours();
  }

  function fixDays() {
    var y = +val('qmYear'), m = +val('qmMonth'), d = +val('qmDay');
    var max = new Date(y, m, 0).getDate();
    var sel = $('qmDay');
    var keep = Math.min(+d || 1, max);
    if (sel.options.length !== max) {
      sel.innerHTML = '';
      for (var i = 1; i <= max; i++) sel.appendChild(new Option(i + ' 日', i));
    }
    sel.value = keep;
  }

  function cellHTML(c, hl) {
    if (c.palace === 5) {
      return '<div class="qm-cell center' + (hl ? ' hl' : '') + '">' +
        '<div class="c-top"><span>' + c.name + '・' + c.dir + '</span><span class="c-god">寄坤</span></div>' +
        '<div class="c-mid"><span class="c-gan ti di">' + c.di + '</span><span class="c-star">天禽</span></div>' +
        '<div class="c-mean">中宮為樞紐，天禽寄坤二宮，實務判斷以坤二宮為主。</div>' +
        '<div class="c-foot"><span>五行 ' + c.wx + '</span><span>' + c.starState + '</span></div></div>';
    }
    var tian = c.tian ? '<span class="c-gan ti">' + c.tian + '</span>' : '';
    return '<div class="qm-cell' + (hl ? ' hl' : '') + (c.empty ? ' empty' : '') + (c.ma ? ' ma' : '') + '">' +
      '<div class="c-top"><span>' + c.name + '・' + c.dir + '</span><span class="c-god">' + (c.god || '') + '</span></div>' +
      '<div class="c-mid"><span class="c-gan">' + c.star + '</span></div>' +
      '<div class="c-mid">' + tian + '<span class="c-gan di">' + c.di + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span class="c-door">' + c.door + '</span><span class="c-star" style="font-size:11px;color:#93a7d1">' + c.starState + '/' + c.doorState + '</span></div>' +
      '<div class="c-mean">' + c.mean + '</div>' +
      '<div class="c-foot"><span>五行 ' + c.wx + '</span><span>' + (c.empty ? '空亡' : (c.ma ? '驛馬' : '')) + '</span></div></div>';
  }

  function highlightCells(r) {
    var set = {};
    if (!USEKEY) return set;
    var y = null;
    for (var i = 0; i < Q.YONGSHEN.length; i++) if (Q.YONGSHEN[i].key === USEKEY) y = Q.YONGSHEN[i];
    if (!y) return set;
    if (y.door) {
      for (var p = 1; p <= 9; p++) if (r.cells[p].door === y.door) set[p] = 1;
    }
    if (y.star) {
      for (var s = 1; s <= 9; s++) if (r.cells[s].star.indexOf(y.star) >= 0) set[s] = 1;
    }
    if (y.gan) {
      for (var g = 1; g <= 9; g++) {
        if (r.cells[g].tian === y.gan) set[g] = 1;
        if (r.cells[g].di === y.gan) set[g] = 1;
      }
    }
    return set;
  }

  function render(r) {
    LAST = r;
    var set = highlightCells(r);
    $('qmResult').classList.add('on');

    $('qmHeadline').innerHTML =
      '<span class="qm-badge orange">' + r.ju.juName + '</span>' +
      '<span class="qm-badge">' + r.ju.yuan + '・' + r.ju.termName + '後 ' + r.ju.days + ' 日</span>' +
      '<span class="qm-badge gray">' + r.four.year + '年 ' + r.four.month + '月 ' + r.four.day + '日 ' + r.four.hour + '時</span>' +
      (r.lateZi ? '<span class="qm-badge gray">晚子時・已換日</span>' : '');

    $('qmPanels').innerHTML =
      '<div class="qm-panel"><span>局數・陰陽遁</span><b>' + r.ju.juName + '<em>（' + r.ju.yuan + '）</em></b></div>' +
      '<div class="qm-panel"><span>旬首・值符</span><b>' + r.xun.name + '（' + r.xun.yi + '）<em>／' + r.fu.star + '</em></b></div>' +
      '<div class="qm-panel"><span>值使門</span><b>' + r.fu.door + '<em>（' + Q.PAL_NAME[r.fu.palace] + '起）</em></b></div>' +
      '<div class="qm-panel"><span>空亡・驛馬</span><b>空 ' + r.kong.join('、') + '<em>／馬 ' + r.ma.zhi + '</em></b></div>';

    var html = '';
    LAYOUT.forEach(function (row) {
      row.forEach(function (p) { html += cellHTML(r.cells[p], !!set[p]); });
    });
    $('qmBoard').innerHTML = '<div class="qm-grid">' + html + '</div>';

    $('qmLunar').textContent = '農曆 ' + r.lunarText + '　' + (r.lateZi ? '（晚子時，日柱已進位）' : '');

    var flags = r.flags.slice(0, 8).map(function (f) {
      return '<div class="qm-flag ' + f.level + '">' + f.text + '</div>';
    }).join('');
    $('qmFlags').innerHTML = flags || '<div class="qm-flag info">此局未觸發本站收錄的簡易格局條件，請回到「格局與克應」章節，用門、星、神的組合自行判斷。</div>';

    // 逐宮表
    var rows = '';
    for (var p = 1; p <= 9; p++) {
      var c = r.cells[p];
      if (p === 5) continue;
      rows += '<tr' + (set[p] ? ' class="hl"' : '') + '><td>' + c.name + '</td><td>' + c.dir + '</td><td>' + (c.god || '') +
        '</td><td>' + c.star + '</td><td>' + c.door + '</td><td>' + (c.tian || '—') + '</td><td>' + c.di +
        '</td><td>' + c.starState + '／' + c.doorState + '</td><td>' + (c.empty ? '空亡' : '—') +
        (c.ma ? '・馬' : '') + '</td></tr>';
    }
    $('qmTable').innerHTML = '<thead><tr><th>宮位</th><th>方位</th><th>八神</th><th>九星</th><th>八門</th><th>天盤干</th><th>地盤干</th><th>星／門狀態</th><th>備註</th></tr></thead><tbody>' + rows + '</tbody>';

    renderUseTip();
  }

  function renderUseTip() {
    var tip = '';
    if (!USEKEY || !LAST) {
      tip = '選一個主題，系統會在盤上標出該主題的用神落宮（橘框），並說明判斷順序。';
    } else {
      for (var i = 0; i < Q.YONGSHEN.length; i++) {
        if (Q.YONGSHEN[i].key === USEKEY) {
          var y = Q.YONGSHEN[i];
          tip = '<b>' + y.label + '</b>：' + y.tip + '　<span style="color:#8a97b1">（盤上橘框為' +
            [y.door, y.star, y.gan].filter(Boolean).join('、') + '所在宮）</span>';
        }
      }
    }
    $('qmUseTip').innerHTML = tip;
  }

  function run() {
    var y = +val('qmYear'), m = +val('qmMonth'), d = +val('qmDay'), h = +val('qmHour');
    if (d > new Date(y, m, 0).getDate()) {
      $('qmResult').classList.remove('on');
      alert('這個月份沒有 ' + d + ' 日，請確認日期。');
      return;
    }
    render(Q.compute({ year: y, month: m, day: d, hour: h }));
    $('qmResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bind() {
    $('qmYear').addEventListener('change', fixDays);
    $('qmMonth').addEventListener('change', fixDays);
    $('qmSubmit').addEventListener('click', run);
    $('qmNow').addEventListener('click', function () {
      var n = new Date();
      $('qmYear').value = n.getFullYear(); $('qmMonth').value = n.getMonth() + 1;
      fixDays(); $('qmDay').value = n.getDate(); $('qmHour').value = n.getHours();
      run();
    });
    var useBtns = $('qmUse').querySelectorAll('button');
    Array.prototype.forEach.call(useBtns, function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-key');
        USEKEY = (USEKEY === k) ? '' : k;
        Array.prototype.forEach.call(useBtns, function (x) { x.classList.toggle('on', x.getAttribute('data-key') === USEKEY); });
        if (LAST) render(LAST);
      });
    });
  }

  function init() {
    if (!window.Qimen) {
      var el = $('qmResult');
      if (el) el.innerHTML = '<div class="notice warn">排盤模組載入失敗，請確認 js/qimen.js 與 js/solarlunar.min.js 存在。</div>';
      return;
    }
    fillSelects(); fixDays();
    $('qmUse').innerHTML = Q.YONGSHEN.map(function (y) {
      return '<button data-key="' + y.key + '">' + y.label + '</button>';
    }).join('');
    bind();
    renderUseTip();
  }

  window.QimenUI = { init: init, run: run, compute: function () { return LAST; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
