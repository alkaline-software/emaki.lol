// What a page does once it is drawn: names this computer's installer on
// the landing page's download and marks it among the Get Started page's
// tiles, makes the figure of a part's card a way to the part's page,
// lets the landing page's bands rise into view, and carries the
// docs pages' way to the page before and after across the menu's groups.
// Everything here is an addition over a page that reads whole without it.
(function () {
  "use strict";

  // Which system this is, as the browser tells it. A browser does not say
  // which chip a Mac has, but its graphics renderer does, near enough:
  // Apple's own GPU is Apple silicon, Intel's or AMD's an Intel Mac. When
  // neither can be read the chip is null.
  function macChip() {
    try {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return null;
      var info = gl.getExtension("WEBGL_debug_renderer_info");
      var renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      if (!renderer) return null;
      if (/Apple/i.test(renderer)) return "arm64";
      if (/Intel|AMD|Radeon|NVIDIA/i.test(renderer)) return "x64";
    } catch (e) {}
    return null;
  }

  function here() {
    var ua = navigator.userAgent;
    var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    if (/Mac/i.test(platform) && !/iPhone|iPad/i.test(ua)) return { os: "mac", chip: macChip() };
    if (/Win/i.test(platform)) return { os: "windows", chip: null };
    if (/Linux/i.test(platform) && !/Android/i.test(ua)) return { os: "linux", chip: null };
    return null;
  }

  // The links for a system among a list: both Mac links when the chip is
  // not known, the one otherwise.
  function links(list, h) {
    var sel = '[data-os="' + h.os + '"]' + (h.chip ? '[data-chip="' + h.chip + '"]' : "");
    return list.querySelectorAll(sel);
  }

  // The Get Started page's tiles: the one for this computer takes the accent's
  // edge and a word (`.download-here`, css/theme.scss).
  function markDownloads() {
    var grid = document.querySelector(".downloads");
    var h = here();
    if (!grid || !h) return;
    var tiles = links(grid, h);
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.add("download-here");
  }

  // The landing page's downloads, the hero's and Get started's alike: the
  // pill takes this computer's installer and says which (the short one
  // only Download), the menu marks it, and the segment at the pill's
  // right opens and closes the menu. A Mac whose chip cannot be read gets
  // the Apple silicon build, which most Macs now are, and the menu offers
  // the other.
  function download() {
    var boxes = document.querySelectorAll(".dl");
    for (var i = 0; i < boxes.length; i++) control(boxes[i]);
  }
  function control(box) {
    var main = box.querySelector(".dl-main");
    var more = box.querySelector(".dl-more");
    var menu = box.querySelector(".dl-menu");
    var h = here();
    if (h) {
      var found = links(menu, h);
      var pick = found[0];
      if (pick) {
        main.href = pick.href;
        if (!box.hasAttribute("data-short")) main.textContent = "Download for " + pick.getAttribute("data-name");
        pick.classList.add("dl-here");
      }
    }
    function setOpen(open) {
      box.classList.toggle("dl-open", open);
      more.setAttribute("aria-expanded", String(open));
    }
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!box.classList.contains("dl-open"));
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // A part's card on the landing page: its figure is a way to the part's
  // page too, as its name is. The name stays the link a keyboard and a
  // reader find; the figure answers a click, and still answers the
  // pointer as it moves.
  function cardLinks() {
    var cards = document.querySelectorAll(".cards-2 .card");
    for (var i = 0; i < cards.length; i++) {
      var a = cards[i].querySelector("h3 a"), fig = cards[i].querySelector(".fig");
      if (!a || !fig) continue;
      fig.classList.add("fig-link");
      fig.addEventListener("click", (function (href) {
        return function () { window.location.href = href; };
      })(a.href));
    }
  }

  // The rise: a `.rise` element comes in as it comes into view, once. The
  // root is marked only when the page can watch for that, so a browser
  // without the observer, or a person who asked for less motion, sees the
  // page at rest from the first frame.
  function rise() {
    var els = document.querySelectorAll(".rise");
    if (!els.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-rise");
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        seen.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    for (var i = 0; i < els.length; i++) seen.observe(els[i]);
  }

  // The foot of a docs page: the page before and the page after, in the
  // menu's order. Quarto writes them itself but stops at a line between
  // groups, so the way from Get Started to Projects, or from Chats
  // to Files, is filled in here from the menu, in Quarto's own markup.
  function walk() {
    var side = document.getElementById("quarto-sidebar");
    var main = document.getElementById("quarto-document-content");
    if (!side || !main) return;
    var links = side.querySelectorAll("a.sidebar-link[href]");
    var at = -1;
    for (var i = 0; i < links.length; i++) if (links[i].classList.contains("active")) at = i;
    if (at < 0) return;
    var nav = document.querySelector(".page-navigation");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "page-navigation";
      nav.innerHTML = '<div class="nav-page nav-page-previous"></div><div class="nav-page nav-page-next"></div>';
      main.insertAdjacentElement("afterend", nav);
    }
    function fill(slot, link, side) {
      var box = nav.querySelector(slot);
      if (!box || !link || box.querySelector("a")) return;
      var text = link.textContent.trim();
      var a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.className = "pagination-link";
      a.setAttribute("aria-label", text);
      a.innerHTML = side === "previous"
        ? '<i class="bi bi-arrow-left-short"></i> <span class="nav-page-text"></span>'
        : '<span class="nav-page-text"></span> <i class="bi bi-arrow-right-short"></i>';
      a.querySelector(".nav-page-text").textContent = text;
      box.appendChild(a);
    }
    fill(".nav-page-previous", links[at - 1], "previous");
    fill(".nav-page-next", links[at + 1], "next");
  }

  function init() {
    markDownloads();
    download();
    cardLinks();
    rise();
    walk();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
