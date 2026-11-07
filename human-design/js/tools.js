/* ============================================================
   人類圖知識分析 — 工具互動 tools.js
   三個工具：#sunTool（太陽閘門速查）、#bodyTool（體圖建構器）、
            #quizTool（類型傾向自測）
   依賴：js/hd-data.js、js/hd-core.js
   ============================================================ */
(function () {
  "use strict";
  var D = window.HD_DATA || {};
  var H = window.HD || {};
  var $ = function (id) { return document.getElementById(id); };
  var TYPE_ZH = { generator: "生產者", mg: "顯示生產者", projector: "投射者", manifestor: "顯示者", reflector: "反映者" };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function gateInfo(n) {
    var g = D.gates && D.gates[String(n)];
    return g || { hex: "", kw: "", desc: "", center: "" };
  }
  function centerName(key) {
    var c = (D.centers || []).filter(function (x) { return x.key === key; })[0];
    return c ? c.name : key;
  }
  function cShort(key) {
    var c = (D.centers || []).filter(function (x) { return x.key === key; })[0];
    return c ? c.short : key;
  }

  /* ================= 1. 太陽閘門速查 ================= */
  function initSun() {
    var out = $("hdResult"), hint = $("hdHint");

    $("hdNow").addEventListener("click", function () {
      var now = new Date();
      var mm = String(now.getMonth() + 1).padStart(2, "0");
      var dd = String(now.getDate()).padStart(2, "0");
      $("hdDate").value = now.getFullYear() + "-" + mm + "-" + dd;
      $("hdTime").value = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      hint.textContent = "已帶入你的裝置時間（" + now.toLocaleString("zh-TW") + "）。";
    });

    $("hdCalc").addEventListener("click", function () {
      var dv = $("hdDate").value, tv = $("hdTime").value;
      if (!dv) { out.innerHTML = '<p class="tool-empty">請先選擇出生日期。</p>'; return; }
      var parts = dv.split("-"), tparts = (tv || "12:00").split(":");
      var y = +parts[0], m = +parts[1], d = +parts[2];
      var hh = +tparts[0], mi = +tparts[1];
      var tz = parseFloat($("hdTz").value);

      var c = H.chart(y, m, d, hh, mi, tz);
      var rows = [
        ["人格太陽", c.personality.sun, "自覺的主題，別人最容易感受到你的地方"],
        ["人格地球", c.personality.earth, "支撐太陽的基礎，你站穩腳步的方式"],
        ["設計太陽", c.design.sun, "身體與無意識的主題，沒在想的時候最明顯"],
        ["設計地球", c.design.earth, "身體的根，生存的底盤"],
        ["北交（平均節點）", c.personality.node, "成長區，參考值"],
        ["南交（平均節點）", c.personality.southNode, "熟悉區，參考值"]
      ];

      var cards = rows.map(function (r) {
        var gi = gateInfo(r[1].gate);
        return '<div class="res-item"><span>' + r[0] + '</span><b>' + r[1].gate + "." + r[1].line + '</b>' +
               '<em>' + esc(gi.hex) + '・' + esc(gi.kw) + '｜' + esc(centerName(gi.center)) + '</em>' +
               '<em style="color:#98a3b8;font-size:11.5px">' + esc(r[2]) + '</em></div>';
      }).join("");

      var dDate = c.designDate;
      var dstr = dDate.y + "-" + String(dDate.m).padStart(2, "0") + "-" + String(dDate.d).padStart(2, "0") +
                 " " + String(dDate.hh).padStart(2, "0") + ":" + String(dDate.mm).padStart(2, "0");

      out.innerHTML =
        '<div class="res-head"><span>太陽視黃經　' + c.sunLon.toFixed(3) + '°</span>' +
        '<b>' + c.personality.sun.gate + "." + c.personality.sun.line + '　／　' + c.design.sun.gate + "." + c.design.sun.line + '</b>' +
        '<p>人格太陽與設計太陽（格式：閘門.爻線）。設計時刻為出生前 ' + (c.designDaysBefore).toFixed(2) + ' 天。</p></div>' +
        '<div class="res-grid">' + cards + '</div>' +
        '<p style="font-size:13px;color:#5b6983;margin-top:14px">設計時刻（太陽黃經少 88°）：' + dstr +
        '（已換算為你選定的時區）。北交／南交採月亮<strong>平均</strong>節點，與真節點可能相差 1° 上下。</p>' +
        '<div class="notice info" style="margin-top:12px">交叉骨架：' + c.personality.sun.gate + '-' + c.personality.earth.gate +
        '-' + c.design.sun.gate + '-' + c.design.earth.gate +
        '。四種交叉型態（右／左／並列／月亮）需完整節點與設計資料才能判定，這裡只給骨架。</div>';

      hint.textContent = "計算完成。誤差約 0.01°（≈15 分鐘）；若太陽落在閘門邊界 15 分鐘內，結果可能不同。";
    });
  }

  /* ================= 2. 體圖建構器 ================= */
  function initBody() {
    var svg = $("bgSvg"), chipsBox = $("gateChips"), result = $("bgResult"), count = $("bgCount");
    var selected = [];

    var groups = (D.centers || []).map(function (c) { return { name: c.name, short: c.short, gates: c.gates }; });
    chipsBox.innerHTML = groups.map(function (g) {
      var chips = g.gates.slice().sort(function (a, b) { return a - b; }).map(function (n) {
        return '<button type="button" class="chip" data-g="' + n + '" title="' + esc(gateInfo(n).kw) + '">' + n + '</button>';
      }).join("");
      return '<div class="chip-center" style="grid-column:1/-1">' + esc(g.name) + '</div>' + chips;
    }).join("");

    function refresh() {
      count.textContent = selected.length;
      var d = H.derive(selected);
      svg.innerHTML = H.bodygraph(selected);
      Array.prototype.forEach.call(chipsBox.querySelectorAll(".chip"), function (el) {
        el.classList.toggle("on", selected.indexOf(+el.dataset.g) >= 0);
      });

      if (!selected.length) {
        result.innerHTML = '<p class="tool-empty">先勾選閘門，或按「載入範例」看一組完整示範。</p>';
        return;
      }

      var tInfo = (D.types || []).filter(function (t) { return t.key === d.type; })[0] || {};
      var defNames = (D.centers || []).filter(function (c) { return d.defined[c.key]; }).map(function (c) { return c.short; });
      var openNames = (D.centers || []).filter(function (c) { return !d.defined[c.key]; }).map(function (c) { return c.short; });

      var chList = d.channels.map(function (c) {
        return c.a + "-" + c.b + " " + esc(c.name);
      }).join("、") || "（尚未接通任何通道）";

      result.innerHTML =
        '<div class="res-head"><span>依四條公開規則推導</span><b>' + TYPE_ZH[d.type] + '</b>' +
        '<p>' + esc(tInfo.strategy || "") + '　成功感：' + esc(tInfo.signature || "") +
        '　走偏時：' + esc(tInfo.notself || "") + '</p></div>' +
        '<div class="bg-result-grid">' +
        '<div class="bg-box"><h4>內在權威</h4><b>' + H.AUTH_ZH[d.authority] + '</b><p>' + esc(d.authorityNote) + '</p></div>' +
        '<div class="bg-box"><h4>接通通道（' + d.channels.length + ' 條）</h4><b style="font-size:14px">' + chList + '</b>' +
        '<p>通道是兩個閘門之間的連線，兩端都被勾選才算接通。</p></div>' +
        '<div class="bg-box"><h4>有定義中心（' + defNames.length + '）</h4><div class="center-list">' +
        defNames.map(function (n) { return '<span class="cd">' + n + '</span>'; }).join("") + '</div></div>' +
        '<div class="bg-box"><h4>未定義中心（' + openNames.length + '）</h4><div class="center-list">' +
        openNames.map(function (n) { return '<span class="co">' + n + '</span>'; }).join("") + '</div>' +
        '<p>空白中心是你接收他人能量、也最容易被制約的地方。</p></div>' +
        '</div>' +
        '<p style="font-size:13px;color:#5b6983;margin-top:12px">' +
        (d.motorToThroat
          ? '判定關鍵：喉嚨已連通動力中心（薦骨／根／情緒／心），' + (d.defined.sacral ? '且薦骨有定義 → 顯示生產者。' : '且薦骨未定義 → 顯示者。')
          : '判定關鍵：喉嚨未連通任何動力中心 → ' + (d.defined.sacral ? '生產者。' : '投射者。')) +
        '</p>';
    }

    chipsBox.addEventListener("click", function (e) {
      var el = e.target.closest(".chip");
      if (!el) return;
      var g = +el.dataset.g;
      var i = selected.indexOf(g);
      if (i >= 0) selected.splice(i, 1); else selected.push(g);
      refresh();
    });

    $("bgClear").addEventListener("click", function () { selected = []; refresh(); });
    $("bgSample").addEventListener("click", function () {
      // 20-34（喉嚨－薦骨）、10-57（G－脾）、34-57（薦骨－脾）、6-37（情緒）
      selected = [6, 10, 20, 34, 37, 57];
      refresh();
    });

    refresh();
  }

  /* ================= 3. 類型傾向自測 ================= */
  var QUESTIONS = [
    { q: "早上醒來，身體通常是：", o: [
      ["立刻有電，會想做點什麼", "generator", "sacral"],
      ["需要先放空一段時間才啟動", "projector", "mental"],
      ["一股衝勁突然來，先做了再想", "manifestor", "sacral"],
      ["每天差異很大，看當天環境", "reflector", "mental"]] },
    { q: "別人臨時請你幫忙時，你通常：", o: [
      ["先感覺「想不想」，身體有反應才答應", "generator", "sacral"],
      ["先想「他是不是真的需要我」，被邀請才投入", "projector", "mental"],
      ["先答應，事後再告知身邊的人", "manifestor", "sacral"],
      ["當下沒感覺，過幾天才知道", "reflector", "moon"]] },
    { q: "長時間做事時，你的狀態是：", o: [
      ["一件一件做，做到沒力就自然停", "generator", "sacral"],
      ["可以同時推很多條線，但容易一次燒完", "mg", "sacral"],
      ["一旦決定就一路衝，不喜歡被打斷", "manifestor", "sacral"],
      ["起伏很大，靠環境與人決定", "reflector", "mental"]] },
    { q: "身邊的人最常說你：", o: [
      ["很穩，會一直做下去", "generator", "sacral"],
      ["點子多、看得懂別人", "projector", "mental"],
      ["有話直說、行動快", "manifestor", "sacral"],
      ["很難被定義", "reflector", "moon"]] },
    { q: "一天結束，你最常覺得：", o: [
      ["累，但是滿足", "generator", "sacral"],
      ["有點苦澀，好像沒被看見", "projector", "mental"],
      ["煩，一直覺得被卡住", "manifestor", "sacral"],
      ["失望，或整天下來像在演別人", "reflector", "moon"]] },
    { q: "做重要決定時，你實際的做法是：", o: [
      ["需要等情緒過去，不在當下拍板", "generator", "emotional"],
      ["問身體「要不要」，當場就有答案", "generator", "sacral"],
      ["第一個念頭最準，通常只出現一次", "projector", "splenic"],
      ["要說出來、或換個地方才慢慢清楚", "projector", "mental"]] },
    { q: "有人問你「你到底想怎樣」：", o: [
      ["我需要時間，當下說不準", "mg", "emotional"],
      ["我可以馬上告訴你要或不要", "generator", "sacral"],
      ["我會突然知道，但只有一瞬間", "projector", "splenic"],
      ["我要講出來，才知道自己在想什麼", "manifestor", "mental"]] },
    { q: "決定之後，你通常：", o: [
      ["過幾天感覺就變了", "generator", "emotional"],
      ["身體舒服就繼續，不舒服就停", "generator", "sacral"],
      ["一決定就不回頭", "manifestor", "splenic"],
      ["還要看環境與別人的反應", "reflector", "mental"]] }
  ];

  var AUTH_LABEL = { emotional: "情緒型", sacral: "薦骨型", splenic: "脾型", mental: "心智／環境型", moon: "月亮型" };

  function initQuiz() {
    var box = $("quiz"), result = $("quizResult");
    var answers = new Array(QUESTIONS.length).fill(null);

    function render() {
      box.innerHTML = QUESTIONS.map(function (item, qi) {
        var opts = item.o.map(function (o, oi) {
          return '<label class="opt' + (answers[qi] === oi ? " sel" : "") + '">' +
                 '<input type="radio" name="q' + qi + '" value="' + oi + '"' + (answers[qi] === oi ? " checked" : "") + '>' +
                 '<span>' + o[0] + '</span></label>';
        }).join("");
        return '<div class="q"><b>' + (qi + 1) + '. ' + item.q + '</b>' + opts + '</div>';
      }).join("");
    }

    box.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name && t.name.indexOf("q") === 0) {
        answers[+t.name.slice(1)] = +t.value;
        Array.prototype.forEach.call(box.querySelectorAll(".opt"), function (el) { el.classList.remove("sel"); });
        Array.prototype.forEach.call(box.querySelectorAll("input:checked"), function (el) {
          el.closest(".opt").classList.add("sel");
        });
      }
    });

    $("quizReset").addEventListener("click", function () {
      answers = new Array(QUESTIONS.length).fill(null);
      render();
      result.innerHTML = '<p class="tool-empty">八題都選好之後，按「看我的傾向」。</p>';
    });

    $("quizGo").addEventListener("click", function () {
      var missing = answers.indexOf(null);
      if (missing >= 0) {
        result.innerHTML = '<p class="tool-empty">第 ' + (missing + 1) + ' 題還沒選。</p>';
        return;
      }
      var score = {}, ascore = {};
      answers.forEach(function (ai, qi) {
        var o = QUESTIONS[qi].o[ai];
        score[o[1]] = (score[o[1]] || 0) + 1;
        ascore[o[2]] = (ascore[o[2]] || 0) + 1;
      });

      var order = Object.keys(TYPE_ZH).map(function (k) { return [k, score[k] || 0]; })
        .sort(function (a, b) { return b[1] - a[1]; });
      var top = order[0], second = order[1];
      var auth = Object.keys(ascore).sort(function (a, b) { return ascore[b] - ascore[a]; })[0];

      var tInfo = (D.types || []).filter(function (t) { return t.key === top[0]; })[0] || {};
      var bars = order.map(function (o) {
        var pct = Math.round(o[1] / QUESTIONS.length * 100);
        return '<div style="display:flex;align-items:center;gap:10px;margin:6px 0">' +
               '<span style="width:78px;font-size:13px;color:#33405c">' + TYPE_ZH[o[0]] + '</span>' +
               '<span style="flex:1;height:9px;background:#e3edff;border-radius:5px;overflow:hidden">' +
               '<span style="display:block;height:100%;width:' + pct + '%;background:linear-gradient(90deg,#25457f,#f07a2e)"></span></span>' +
               '<span style="width:34px;text-align:right;font-size:12.5px;color:#98a3b8">' + o[1] + ' 分</span></div>';
      }).join("");

      result.innerHTML =
        '<div class="res-head"><span>行為傾向推估（非正式判定）</span><b>' + TYPE_ZH[top[0]] + '</b>' +
        '<p>' + esc(tInfo.strategy || "") + '　成功感：' + esc(tInfo.signature || "") +
        '　走偏時：' + esc(tInfo.notself || "") + '</p></div>' +
        bars +
        (top[1] === second[1]
          ? '<div class="notice info" style="margin-top:10px">前兩名同分（' + TYPE_ZH[top[0]] + '／' +
            TYPE_ZH[second[0]] + '）。這通常代表你的行為同時符合兩種類型的特徵，' +
            '而真正的分界在能量場結構，不在行為。</div>' : "") +
        '<div class="bg-result-grid"><div class="bg-box"><h4>權威傾向</h4><b>' + (AUTH_LABEL[auth] || auth) + '</b>' +
        '<p>由第六～八題的作答推估。正式權威需看九個中心哪一個有定義。</p></div>' +
        '<div class="bg-box"><h4>下一步</h4><p style="margin-top:4px">用<a href="體圖建構器.html">體圖建構器</a>' +
        '勾選你已知的閘門，看類型怎麼被推導出來；或直接讀<a href="../類型/五大類型.html">五大類型</a>的判準。</p></div></div>' +
        '<div class="notice warn" style="margin-top:12px">這個測驗的準確率不高，因為類型是能量中心的結構，不是行為問卷能測出來的。' +
        '請把它當成「你可能偏向哪一種」，不是答案。</div>';
    });

    render();
  }

  function boot() {
    if (!window.HD) return;
    if ($("sunTool")) initSun();
    if ($("bodyTool")) initBody();
    if ($("quizTool")) initQuiz();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
