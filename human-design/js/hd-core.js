/* ============================================================
   人類圖知識分析 — 計算核心 hd-core.js
   依賴：js/hd-data.js（window.HD_DATA）
   範圍：儒略日、太陽視黃經（Meeus 低精度）、Rave 曼陀羅換算、
        地球對宮、月亮平均節點、體圖推導（類型／權威）
   限制：太陽黃經誤差約 0.01°（≈ 15 分鐘時間差）；節點為平均值，
        非真交點。所有函式皆為純函式，不讀寫 DOM。
   ============================================================ */
(function (global) {
  "use strict";
  var D = global.HD_DATA || {};
  var DEG = Math.PI / 180;

  /* ---------- 時間 ---------- */
  // 由本地日期時間 + UTC 偏移（小時）轉為儒略日
  function toJD(y, m, d, hh, mm, tz) {
    var day = d + (hh + mm / 60 - tz) / 24;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  }

  function fromJD(jd) {
    var z = Math.floor(jd + 0.5), f = jd + 0.5 - z;
    var A = z;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      A = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var B = A + 1524, C = Math.floor((B - 122.1) / 365.25), Dd = Math.floor(365.25 * C),
        E = Math.floor((B - Dd) / 30.6001);
    var day = B - Dd - Math.floor(30.6001 * E) + f;
    var month = E < 14 ? E - 1 : E - 13;
    var year = month > 2 ? C - 4716 : C - 4715;
    var di = Math.floor(day), frac = day - di;
    var hours = frac * 24;
    return {
      y: year, m: month, d: di,
      hh: Math.floor(hours),
      mm: Math.floor((hours - Math.floor(hours)) * 60)
    };
  }

  /* ---------- 太陽視黃經（Meeus 低精度） ---------- */
  function sunLongitude(jd) {
    var T = (jd - 2451545.0) / 36525.0;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;          // 幾何平黃經
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;           // 平近點角
    var Mr = M * DEG;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
    var trueLon = L0 + C;
    var omega = 125.04452 - 1934.136261 * T;
    var lambda = trueLon - 0.00569 - 0.00478 * Math.sin(omega * DEG);  // 視黃經
    return norm360(lambda);
  }

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  /* ---------- 月亮平均交點（北交點） ---------- */
  function meanNode(jd) {
    var T = (jd - 2451545.0) / 36525.0;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
                   + T * T * T / 467441 - T * T * T * T / 60616000);
  }

  /* ---------- Rave 曼陀羅 ----------
     起點：Gate 41 的起點＝水瓶座 2°00′00″＝黃經 302.000°
     每閘門 5.625°，每爻線 0.9375°（1/6 閘門）
     換算：pos = norm360(lon - 302) / 5.625  →  wheelIndex = floor(pos)
     gate = wheel[wheelIndex]，line = floor((pos - floor(pos)) * 6) + 1
  ------------------------------------------ */
  var WHEEL_START = 302.0, GATE_DEG = 5.625, LINE_DEG = 0.9375;

  function gateFromLongitude(lon) {
    var rel = norm360(lon - WHEEL_START);
    var pos = rel / GATE_DEG;
    var idx = Math.floor(pos) % 64;
    var within = pos - Math.floor(pos);           // 0~1
    var line = Math.floor(within * 6) + 1;
    var lineWithin = within * 6 - Math.floor(within * 6);   // 顏色
    var color = Math.floor(lineWithin * 6) + 1;
    var tone = Math.floor((lineWithin * 6 - Math.floor(lineWithin * 6)) * 6) + 1;
    return {
      gate: D.wheel ? D.wheel[idx] : 0,
      wheelIndex: idx,
      line: line, color: color, tone: tone,
      lon: norm360(lon), offset: rel
    };
  }

  function gateEndLongitude(gate) {
    if (!D.wheel) return null;
    var idx = D.wheel.indexOf(gate);
    if (idx < 0) return null;
    return norm360(WHEEL_START + idx * GATE_DEG);
  }

  /* ---------- 設計時刻：太陽黃經少 88° ---------- */
  function designJD(jdBirth) {
    var target = norm360(sunLongitude(jdBirth) - 88);
    var jd = jdBirth - 89.3;
    for (var i = 0; i < 12; i++) {
      var lon = sunLongitude(jd);
      var diff = ((lon - target + 540) % 360) - 180;   // -180~180
      jd -= diff / 0.98565;                            // 太陽日運動
      if (Math.abs(diff) < 1e-7) break;
    }
    return jd;
  }

  /* ---------- 完整排圖（6 個啟動） ---------- */
  function chart(y, m, d, hh, mm, tz) {
    var jd = toJD(y, m, d, hh, mm, tz);
    var djd = designJD(jd);
    var sunLon = sunLongitude(jd);
    var sun = gateFromLongitude(sunLon);
    var earth = gateFromLongitude(sunLon + 180);
    var dSun = gateFromLongitude(sunLongitude(djd));
    var dEarth = gateFromLongitude(sunLongitude(djd) + 180);
    var node = gateFromLongitude(meanNode(jd));
    var sNode = gateFromLongitude(meanNode(jd) + 180);
    return {
      jd: jd, designJD: djd,
      sunLon: sunLon,
      personality: { sun: sun, earth: earth, node: node, southNode: sNode },
      design: { sun: dSun, earth: dEarth },
      designDate: fromJD(djd),
      designDaysBefore: jd - djd
    };
  }

  /* ---------- 體圖推導 ---------- */
  function centerOf(gate) {
    var g = D.gates && D.gates[String(gate)];
    return g ? g.center : null;
  }

  function activeChannels(gates) {
    var sel = {};
    gates.forEach(function (g) { sel[g] = true; });
    return (D.channels || []).filter(function (c) { return sel[c.a] && sel[c.b]; });
  }

  function definedCenters(channels) {
    var out = {};
    channels.forEach(function (c) {
      out[centerOf(c.a)] = true;
      out[centerOf(c.b)] = true;
    });
    return out;
  }

  // 以「已定義中心」為節點、已接通通道為邊，找出可從 a 連到的中心集合
  function reachable(from, channels, def) {
    var adj = {}, seen = {}, q = [from];
    channels.forEach(function (c) {
      var x = centerOf(c.a), y = centerOf(c.b);
      (adj[x] = adj[x] || []).push(y);
      (adj[y] = adj[y] || []).push(x);
    });
    seen[from] = true;
    while (q.length) {
      var cur = q.shift();
      (adj[cur] || []).forEach(function (n) {
        if (def[n] && !seen[n]) { seen[n] = true; q.push(n); }
      });
    }
    return seen;
  }

  function derive(gates) {
    var chs = activeChannels(gates);
    var def = definedCenters(chs);
    var motors = ["sacral", "root", "sp", "ego"].filter(function (k) { return def[k]; });
    var motorToThroat = false;
    motors.forEach(function (m) {
      if (reachable(m, chs, def).throat) motorToThroat = true;
    });

    var type = "reflector";
    if (Object.keys(def).length === 0) type = "reflector";
    else if (def.sacral && motorToThroat) type = "mg";
    else if (def.sacral) type = "generator";
    else if (motorToThroat) type = "manifestor";
    else type = "projector";

    // 內在權威：依固定優先序
    var authority = "moon", how = "沒有定義中心，靠環境與時間，28 天為一個完整取樣。";
    if (def.sp) { authority = "emotional"; how = "情緒波未走完前不做決定，等清楚或等時間過去。"; }
    else if (def.sacral) { authority = "sacral"; how = "用是非題問身體，聲音與身體反應優先於理由。"; }
    else if (def.spleen) { authority = "splenic"; how = "第一個瞬間的直覺，只說一次，不重複確認。"; }
    else if (def.ego && (def.g || def.throat)) { authority = "ego"; how = "問自己願不願意、值不值得，答案關乎承諾。"; }
    else if (def.g && def.throat) { authority = "self"; how = "把選項說出來，聽自己的聲音，而不是想清楚。"; }
    else if (def.head || def.ajna) { authority = "mental"; how = "不在頭腦裡決定；換環境、找人對談，讓答案浮現。"; }

    return {
      gates: gates.slice(),
      channels: chs,
      defined: def,
      type: type,
      authority: authority,
      authorityNote: how,
      motorToThroat: motorToThroat
    };
  }

  var TYPE_ZH = { generator: "生產者", mg: "顯示生產者", projector: "投射者", manifestor: "顯示者", reflector: "反映者" };
  var AUTH_ZH = { emotional: "情緒型權威", sacral: "薦骨型權威", splenic: "脾型權威",
                  ego: "自我投射型權威", self: "自我型權威（G）", mental: "心智／環境型權威", moon: "月亮型權威" };

  function typeInfo(key) {
    return (D.types || []).filter(function (t) { return t.key === key; })[0] || null;
  }

  /* ---------- 體圖 SVG ---------- */
  function shapePath(c) {
    var x = c.x, y = c.y;
    switch (c.shape) {
      case "triangle-up":
        return "M" + (x - 62) + "," + (y + 50) + " L" + (x + 62) + "," + (y + 50) + " L" + x + "," + (y - 58) + " Z";
      case "triangle-down":
        return "M" + (x - 62) + "," + (y - 50) + " L" + (x + 62) + "," + (y - 50) + " L" + x + "," + (y + 58) + " Z";
      case "diamond":
        return "M" + x + "," + (y - 52) + " L" + (x + 62) + "," + y + " L" + x + "," + (y + 52) + " L" + (x - 62) + "," + y + " Z";
      case "triangle-left":
        return "M" + (x + 54) + "," + (y - 52) + " L" + (x + 54) + "," + (y + 52) + " L" + (x - 56) + "," + y + " Z";
      case "triangle-right":
        return "M" + (x - 54) + "," + (y - 52) + " L" + (x - 54) + "," + (y + 52) + " L" + (x + 56) + "," + y + " Z";
      default:
        return "M" + (x - 58) + "," + (y - 42) + " h116 v84 h-116 Z";
    }
  }

  function bodygraph(gates, opts) {
    opts = opts || {};
    var size = opts.size || 1000;
    var INSET = { square: 52, "triangle-up": 52, "triangle-down": 52, "triangle-left": 50, "triangle-right": 50, diamond: 48 };
    var sel = {};
    (gates || []).forEach(function (g) { sel[g] = true; });
    var chs = activeChannels(gates || []);
    var def = definedCenters(chs);
    var cs = D.centers || [];

    var byKey = {};
    // 縱向拉開 1.18 倍，讓中心之間留出畫線與閘門號的空間
    cs.forEach(function (c) {
      byKey[c.key] = { key: c.key, short: c.short, name: c.name, shape: c.shape, color: c.color,
                       x: c.x, y: 70 + (c.y - 40) * 1.18 };
    });

    // 同一對中心的通道需要錯開，避免線條重疊
    var pairCount = {};
    (D.channels || []).forEach(function (c) {
      var key = [D.gates[String(c.a)].center, D.gates[String(c.b)].center].sort().join("|");
      pairCount[key] = (pairCount[key] || 0) + 1;
    });

    var lines = [], nodes = [];
    var pairSeen = {}, placed = {};

    (D.channels || []).forEach(function (c) {
      var ka = D.gates[String(c.a)].center, kb = D.gates[String(c.b)].center;
      var A = byKey[ka], B = byKey[kb];
      if (!A || !B) return;
      var pkey = [ka, kb].sort().join("|");
      var total = pairCount[pkey] || 1;
      var idx = pairSeen[pkey] = (pairSeen[pkey] === undefined ? 0 : pairSeen[pkey] + 1);
      var on = sel[c.a] && sel[c.b];
      var t = (idx - (total - 1) / 2) * 16;

      var dx = B.x - A.x, dy = B.y - A.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var x1 = A.x + nx * t, y1 = A.y + ny * t, x2 = B.x + nx * t, y2 = B.y + ny * t;

      // 線條止於中心邊界，讓中心名稱不會被線壓住
      var ux = x2 - x1, uy = y2 - y1, l2 = Math.sqrt(ux * ux + uy * uy) || 1;
      ux /= l2; uy /= l2;
      var insA = INSET[A.shape] || 46, insB = INSET[B.shape] || 46;
      x1 += ux * insA; y1 += uy * insA; x2 -= ux * insB; y2 -= uy * insB;

      lines.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
                 '" y2="' + y2.toFixed(1) + '" stroke="' + (on ? "#f07a2e" : "#c9d6ea") +
                 '" stroke-width="' + (on ? 9 : 3) + '" stroke-linecap="round" opacity="' + (on ? 1 : .75) + '"/>');
      if (on) {
        // 每個閘門只在圖上標一次，避免多條通道共用閘門時疊字
        [[0.26, c.a], [0.74, c.b]].forEach(function (p) {
          if (placed[p[1]]) return;
          placed[p[1]] = true;
          var px = x1 + (x2 - x1) * p[0], py = y1 + (y2 - y1) * p[0];
          nodes.push('<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="12.5" fill="#fff" stroke="#f07a2e" stroke-width="2"/>' +
                     '<text x="' + px.toFixed(1) + '" y="' + (py + 4.2).toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#c9541a">' + p[1] + '</text>');
        });
      }
    });

    var shapes = cs.map(function (c) {
      var isDef = !!def[c.key];
      var S = byKey[c.key];
      return '<path d="' + shapePath(S) + '" fill="' + (isDef ? "#f07a2e" : "#ffffff") +
             '" fill-opacity="' + (isDef ? ".92" : "1") + '" stroke="' + (isDef ? "#d4611d" : "#b9c8e2") +
             '" stroke-width="2.4"/>' +
             '<text x="' + S.x + '" y="' + (S.y + 5) + '" text-anchor="middle" font-size="15" font-weight="700" fill="' +
             (isDef ? "#ffffff" : "#7c8aa6") + '">' + c.short + '</text>';
    });

    var vbH = 960;
    return '<svg viewBox="228 0 540 ' + vbH + '" role="img" aria-label="人類圖體圖（依已選閘門推導）">' +
           '<g>' + lines.join("") + '</g>' +
           '<g>' + shapes.join("") + '</g>' +
           '<g>' + nodes.join("") + '</g>' +
           '</svg>';
  }

  global.HD = {
    toJD: toJD, fromJD: fromJD, sunLongitude: sunLongitude, meanNode: meanNode,
    gateFromLongitude: gateFromLongitude, gateEndLongitude: gateEndLongitude,
    designJD: designJD, chart: chart, derive: derive,
    activeChannels: activeChannels, definedCenters: definedCenters,
    bodygraph: bodygraph, centerOf: centerOf,
    TYPE_ZH: TYPE_ZH, AUTH_ZH: AUTH_ZH, typeInfo: typeInfo,
    norm360: norm360
  };
})(window);
