/* ============================================================
   奇門遁甲百科 共享腳本
   功能：行動導覽 / MegaMenu / 下拉分類篩選 / 站內關鍵字搜尋
   ============================================================ */
(function(){
  "use strict";

  /* 1. 行動版導覽切換 */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if(toggle && nav){
    toggle.addEventListener("click",function(e){
      e.stopPropagation();
      nav.classList.toggle("open");
      var expanded = nav.classList.contains("open") ? "true" : "false";
      toggle.setAttribute("aria-expanded",expanded);
    });
  }

  /* 2. MegaMenu：行動版點選展開；桌面 hover 由 CSS 處理 */
  var navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(function(item){
    var link = item.querySelector(".nav-link");
    if(link && window.innerWidth <= 820){
      link.addEventListener("click",function(e){
        e.preventDefault();
        item.classList.toggle("open");
      });
    }
  });

  /* 3. 下拉分類篩選
     頁面上需具備：<select id="catFilter"> 與 每個分類區塊 data-cat */
  var catSelect = document.getElementById("catFilter");
  if(catSelect){
    var catBlocks = document.querySelectorAll("[data-cat]");
    var filterInfo = document.getElementById("filterInfo");
    catSelect.addEventListener("change",function(){
      var val = catSelect.value;
      var shown = 0;
      catBlocks.forEach(function(block){
        var match = val === "all" || block.getAttribute("data-cat") === val;
        block.classList.toggle("hidden",!match);
        if(match) shown++;
      });
      if(filterInfo){
        filterInfo.textContent = val === "all"
          ? "顯示全部分類（" + shown + " 個區塊）"
          : "已篩選：共 " + shown + " 個區塊";
      }
    });
  }

  /* 4. 站內關鍵字搜尋（針對 .entry 條目 / .card） */
  var searchInput = document.getElementById("siteSearch");
  if(searchInput){
    searchInput.addEventListener("input",function(){
      var q = searchInput.value.trim().toLowerCase();
      var targets = document.querySelectorAll(".entry,.card");
      var hit = 0;
      targets.forEach(function(el){
        var txt = el.textContent.toLowerCase();
        var show = !q || txt.indexOf(q) > -1;
        el.style.display = show ? "" : "none";
        if(show) hit++;
      });
      var info = document.getElementById("searchInfo");
      if(info){
        info.textContent = q ? "搜尋「" + searchInput.value + "」：命中 " + hit + " 筆" : "";
      }
    });
  }

  /* 5. 目前導覽高亮（依 body[data-nav]） */
  var body = document.body;
  var activeNav = body.getAttribute("data-nav");
  if(activeNav){
    var links = document.querySelectorAll(".nav-link");
    links.forEach(function(l){
      if(l.getAttribute("data-nav") === activeNav){
        l.classList.add("active");
      }
    });
  }
  /* 6. TOC 捲動高亮（支援桌面側欄與行動版兩份目錄） */
  var tocLinks = document.querySelectorAll('.toc-nav a[href^="#"]');
  if(tocLinks.length){
    var heads = [];
    tocLinks.forEach(function(a){
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if(el) heads.push({ el: el, id: id });
    });
    function onScroll(){
      var pos = window.scrollY + 110;
      var curId = null;
      heads.forEach(function(h){
        if(h.el.getBoundingClientRect().top + window.scrollY - 110 <= pos) curId = h.id;
      });
      tocLinks.forEach(function(a){ a.classList.remove('active'); });
      if(curId){
        document.querySelectorAll('.toc-nav a[href="#' + curId + '"]').forEach(function(a){ a.classList.add('active'); });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

/* ===== 奇門遁甲百科：MegaMenu 視窗邊界修正 ===== */
(function(){
  var items = document.querySelectorAll(".nav-item");
  function fit(){
    if(window.innerWidth <= 820) return;
    items.forEach(function(item){
      var mm = item.querySelector(".megamenu");
      if(!mm) return;
      mm.style.setProperty("--mx","0px");
      var r = mm.getBoundingClientRect();
      var pad = 16, shift = 0, vw = window.innerWidth;
      if(r.right > vw - pad) shift = vw - pad - r.right;
      else if(r.left < pad) shift = pad - r.left;
      mm.style.setProperty("--mx", Math.round(shift) + "px");
    });
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
})();
