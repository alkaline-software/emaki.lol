// The sketches on the docs pages (docs/_sk/*.html), answering the pointer.
//
// Each is Emaki's window drawn from the front, as the shift's is, with the
// page's part in it and the rest faint, and the things in it that can be
// done drawn as the app has them: a button, a row, a segment. One script
// serves them all, from what the svg says of itself:
//
//   data-go="name"          on a hit: a pass of the pointer over it turns
//                           the figure's state to this name, and the next
//                           pass back (`data-off` lights it when the state
//                           is any other, for a thing that is out at rest)
//   data-show="a b"         fades in while the state is one of these
//   data-hide="a b"         fades out while the state is one of these
//   data-when="a b"         moves while the state is one of these, from
//   data-rest="x y"         its place at rest (default 0 0) to
//   data-on="x y|x y"       its place in each named state (one for all,
//                           or one per name, divided by |), and
//   data-grow="w|w"         a rect widens by this much there
//   data-home="name"        on the figure: the state at rest
//   data-still="name"       on the figure: the state shown with motion off
//
// The fades are the stylesheet's (css/theme.scss, The sketches); the moves
// run on the handscroll's spring (js/hero-scroll.js), and a frame is asked
// for only while something is moving. Off the figure altogether it returns
// to rest. On a phone, where there is no pointer, the states take their
// turns while the figure is in view. Someone who asked the system for less
// motion gets the figure at `data-still`, nothing moving.

(function () {
  "use strict";

  var figs = document.querySelectorAll(".sketch");
  if (!figs.length) return;

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var STIFF = 90, DAMP = 13;

  function words(s) { return s ? s.trim().split(/\s+/) : []; }
  function pair(s) { var p = words(s); return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0]; }
  function has(attr, s) { return words(attr).indexOf(s) >= 0; }

  [].forEach.call(figs, function (fig) {
    var svg = fig.querySelector("svg");
    if (!svg) return;
    var home = fig.getAttribute("data-home") || "";
    var state = home;

    var movers = [].map.call(svg.querySelectorAll("[data-when]"), function (el) {
      var rest = pair(el.getAttribute("data-rest"));
      return {
        el: el,
        when: words(el.getAttribute("data-when")),
        ons: (el.getAttribute("data-on") || "0 0").split("|").map(pair),
        grows: (el.getAttribute("data-grow") || "0").split("|").map(parseFloat),
        rest: rest,
        w0: parseFloat(el.getAttribute("width")) || 0,
        x: rest[0], y: rest[1], w: 0, vx: 0, vy: 0, vw: 0, tx: rest[0], ty: rest[1], tw: 0
      };
    });
    var shows = svg.querySelectorAll("[data-show]");
    var hides = svg.querySelectorAll("[data-hide]");
    var hits = svg.querySelectorAll("[data-go]");

    // Where everything goes in a state, and what shows there.
    function aim(s) {
      movers.forEach(function (m) {
        var i = m.when.indexOf(s);
        if (i < 0) { m.tx = m.rest[0]; m.ty = m.rest[1]; m.tw = 0; return; }
        var on = m.ons[Math.min(i, m.ons.length - 1)];
        m.tx = on[0]; m.ty = on[1];
        m.tw = m.grows[Math.min(i, m.grows.length - 1)] || 0;
      });
      [].forEach.call(shows, function (e) { e.classList.toggle("is-on", has(e.getAttribute("data-show"), s)); });
      [].forEach.call(hides, function (e) { e.classList.toggle("is-off", has(e.getAttribute("data-hide"), s)); });
      [].forEach.call(hits, function (h) {
        var g = h.getAttribute("data-go");
        h.classList.toggle("on", h.hasAttribute("data-off") ? s !== g : s === g);
      });
      svg.setAttribute("data-state", s);
    }
    function paint(m) {
      m.el.setAttribute("transform", "translate(" + m.x + " " + m.y + ")");
      if (m.w0) m.el.setAttribute("width", m.w0 + m.w);
    }
    function settle() {
      movers.forEach(function (m) { m.x = m.tx; m.y = m.ty; m.w = m.tw; paint(m); });
    }

    if (still) { aim(fig.getAttribute("data-still") || home); settle(); return; }

    // ---- The spring and its loop ----

    var last = null, frame = null;
    function step(now) {
      frame = null;
      var dt = last === null ? 0 : Math.min((now - last) / 1000, 1 / 30);
      last = now;
      var rest = true;
      movers.forEach(function (m) {
        ["x", "y", "w"].forEach(function (k) {
          var v = "v" + k, t = "t" + k;
          for (var i = 0; i < 2; i++) {
            var h = dt / 2;
            m[v] += (STIFF * (m[t] - m[k]) - DAMP * m[v]) * h;
            m[k] += m[v] * h;
          }
          if (Math.abs(m[k] - m[t]) < 0.02 && Math.abs(m[v]) < 0.1) { m[k] = m[t]; m[v] = 0; }
          else rest = false;
        });
        paint(m);
      });
      if (rest) { last = null; return; }
      frame = window.requestAnimationFrame(step);
    }
    function go(s) {
      state = s;
      aim(s);
      if (frame === null) frame = window.requestAnimationFrame(step);
    }
    aim(state);
    settle();

    // ---- A phone ----

    function tour() {
      var states = [];
      [].forEach.call(hits, function (h) {
        var g = h.getAttribute("data-go");
        if (states.indexOf(g) < 0) states.push(g);
      });
      if (!states.length) return;
      var i = 0, timer = null;
      function beat() { go(states[i % states.length]); i++; }
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && timer === null) { beat(); timer = window.setInterval(beat, 2000); }
          if (!e.isIntersecting && timer !== null) { window.clearInterval(timer); timer = null; go(home); }
        });
      }, { threshold: 0.4 }).observe(svg);
    }
    if (coarse) { tour(); return; }

    // ---- The pointer ----

    [].forEach.call(hits, function (h) {
      h.addEventListener("pointerenter", function () {
        var g = h.getAttribute("data-go");
        go(state === g ? home : g);
      });
    });
    fig.addEventListener("pointerleave", function () { go(home); });
  });
})();
