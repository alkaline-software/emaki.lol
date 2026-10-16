// What a page does once it is drawn: marks the visitor's own system among
// the downloads, and lets the landing page's bands rise into view.
// Everything here is an addition over a page that reads whole without it.
(function () {
  "use strict";

  // The downloads: the tile for this computer gets the accent's edge and a
  // word (`.download-here`, css/theme.scss). A browser does not say which
  // chip a Mac has, but its graphics renderer does, near enough: Apple's
  // own GPU is Apple silicon, Intel's or AMD's an Intel Mac. When neither
  // can be read, both Mac tiles are marked.
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

  function markDownloads() {
    var grid = document.querySelector(".downloads");
    if (!grid) return;
    var ua = navigator.userAgent;
    var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    var here = null;
    if (/Mac/i.test(platform) && !/iPhone|iPad/i.test(ua)) here = "mac";
    else if (/Win/i.test(platform)) here = "windows";
    else if (/Linux/i.test(platform) && !/Android/i.test(ua)) here = "linux";
    if (!here) return;
    var tiles = grid.querySelectorAll('.download[data-os="' + here + '"]');
    if (here === "mac" && tiles.length > 1) {
      var chip = macChip();
      if (chip) {
        tiles = grid.querySelectorAll('.download[data-os="mac"][data-chip="' + chip + '"]');
      }
    }
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.add("download-here");
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

  function init() {
    markDownloads();
    rise();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
