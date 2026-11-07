/* 易經大白話 · 全站互動 */
(function () {
  "use strict";

  /* ---------------- MegaMenu ---------------- */
  var header = document.querySelector(".site-header");
  var panel = document.getElementById("megaPanel");
  var triggers = Array.prototype.slice.call(document.querySelectorAll(".mega-nav a[data-menu]"));
  var sections = panel ? Array.prototype.slice.call(panel.querySelectorAll(".mega-section")) : [];
  var closeTimer = null;

  function showMenu(slug) {
    if (!header || !panel) return;
    clearTimeout(closeTimer);
    header.classList.add("menu-open");
    triggers.forEach(function (t) { t.classList.toggle("is-hot", t.dataset.menu === slug); });
    sections.forEach(function (s) { s.classList.toggle("is-active", s.dataset.panel === slug); });
  }

  function hideMenu(delay) {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      if (header) header.classList.remove("menu-open");
      triggers.forEach(function (t) { t.classList.remove("is-hot"); });
    }, delay || 0);
  }

  triggers.forEach(function (t) {
    t.addEventListener("mouseenter", function () { showMenu(t.dataset.menu); });
    t.addEventListener("focus", function () { showMenu(t.dataset.menu); });
    t.addEventListener("click", function (e) {
      // 觸控裝置：第一次點開選單，第二次才進連結
      if (window.matchMedia("(hover: none)").matches && !t.classList.contains("is-hot")) {
        e.preventDefault();
        showMenu(t.dataset.menu);
      }
    });
  });

  if (header && panel) {
    header.addEventListener("mouseleave", function () { hideMenu(120); });
    panel.addEventListener("mouseenter", function () { clearTimeout(closeTimer); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hideMenu(0);
    });
    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) hideMenu(0);
    });
  }

  /* ---------------- 手機選單 ---------------- */
  var toggle = document.getElementById("navToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------------- TOC 捲動高亮 ---------------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc-link"));
  var tocWrap = document.getElementById("tocList");
  var targets = tocLinks.map(function (a) {
    return document.getElementById(a.dataset.target || a.getAttribute("href").slice(1));
  });
  var currentId = null;

  function setActive(id) {
    if (id === currentId) return;
    currentId = id;
    tocLinks.forEach(function (a) {
      var on = a.dataset.target === id;
      a.classList.toggle("is-active", on);
      if (on && tocWrap) {
        var top = a.offsetTop - tocWrap.clientHeight / 2;
        tocWrap.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    });
  }

  function spy() {
    if (!targets.length) return;
    var mark = 140;
    var found = targets[0];
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (!t) continue;
      if (t.getBoundingClientRect().top <= mark) found = t;
      else break;
    }
    if (found && found.id) setActive(found.id);
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { spy(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();

  tocLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      setActive(a.dataset.target);
    });
  });

  /* ---------------- 首頁搜尋 ---------------- */
  var search = document.getElementById("siteSearch");
  var list = document.getElementById("indexList");
  var hint = document.getElementById("emptyHint");
  if (search && list) {
    var items = Array.prototype.slice.call(list.querySelectorAll(".idx-item"));
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (it) {
        var hit = !q || (it.dataset.k || "").toLowerCase().indexOf(q) > -1;
        it.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      if (hint) hint.hidden = shown > 0;
    });
  }

  /* ---------------- 回到頂端 ---------------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- 目前分類自動展開 ---------------- */
  var activeSub = document.querySelector(".sub-link.is-active");
  if (activeSub) {
    var acc = activeSub.closest("details");
    if (acc) acc.open = true;
    var block = activeSub.closest(".sidebar-block");
    if (block) {
      setTimeout(function () {
        block.scrollTop = Math.max(0, activeSub.offsetTop - block.clientHeight / 2);
      }, 60);
    }
  }
})();
