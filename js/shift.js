// The shift on the home page (_shift-ide.html, _shift-ade.html), answering the pointer.
//
// The boxes light under the pointer by themselves (css/theme.scss, The
// shift: `.sk-box:hover`), in place and over a moment, nothing traveling.
// What needs a script is what moves in the ADE: its four panels and the
// fold of a project's chats. When the pointer finds a panel's button, the
// files' or the outline's at the main area's left end, the shell's or the
// agent terminal's at the right, that panel slides in from its side, as
// the app does when the button is pressed, and puts away the other panel
// of its side, which shares it; the agent chat makes room: what hangs
// from its left edge moves with the left panel, what hangs from its right
// edge with the right one, and what spans it shortens. When it finds the
// first project's folder in the sidebar, that project's chats fold up
// into the row and the projects under it close up, as a click on the row
// does in the app. Each pass over a button or the folder turns its thing
// the other way, and off the ADE's window everything returns to rest: the
// panels away, the project open. All of it on the handscroll's spring
// (js/hero-scroll.js), and a frame is asked for only while a spring is
// live, none at rest. On a phone, where there is no pointer, the light
// walks the boxes on its own while the figure is in view, and each panel
// comes out, and the project folds, at its turn. Someone who asked the
// system for less motion gets the picture at rest with a panel out on
// each side, the files and the shell, the project open, nothing moving.

(function () {
  "use strict";

  var ideSvg = document.getElementById("shift-ide");
  var adeSvg = document.getElementById("shift-ade");
  if (!ideSvg || !adeSvg) return;

  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)");

  // Stiff enough to keep up with the pointer, loose enough to run a little
  // past where it stops: the handscroll's own numbers.
  var STIFF = 90, DAMP = 13;

  // Each pane rests this far beyond its edge of the main area, and takes
  // this much room from the chat when it is in: its width and a gap. The
  // chats under the first project begin at this height and take this
  // much, which the projects under them close up when they fold
  // (_shift-ade.html).
  var FILES_OUT = 74, TERM_OUT = 86, ROOM = 72, CHATS_TOP = 72, CHATS_H = 48;

  // The four panels, two to a side: the files and the outline share the
  // left, the shell and the agent's terminal the right, one at a time.
  var LEFT = ["files", "outline"], RIGHT = ["shell", "agent"];

  var el = {};
  ["files", "files-btn", "outline", "outline-btn", "shell", "shell-btn", "agent", "agent-btn",
   "chat", "bubble", "bubble-line", "chat-label",
   "composer", "left", "reply", "hint", "pill", "send", "fold-btn", "chats", "below"].forEach(function (id) {
    el[id] = document.getElementById("ade-" + id);
  });

  // Everything so far along, each from 0 to 1: each panel in, and the
  // project folded. The chat gives each side the room of the panel most
  // in on it, so one panel going as the other of its side comes keeps the
  // room steady.
  function draw(p, k) {
    var f = Math.max(p.files, p.outline), t = Math.max(p.shell, p.agent);
    var x = 96 + ROOM * f, w = 216 - ROOM * (f + t), s = f + t;
    var right = x + w - 8, bw = 84 - 28 * s;
    LEFT.forEach(function (n) {
      el[n].setAttribute("transform", "translate(" + (-FILES_OUT * (1 - p[n])) + " 0)");
    });
    RIGHT.forEach(function (n) {
      el[n].setAttribute("transform", "translate(" + TERM_OUT * (1 - p[n]) + " 0)");
    });
    el.chat.setAttribute("x", x);
    el.chat.setAttribute("width", w);
    el.bubble.setAttribute("x", right - bw);
    el.bubble.setAttribute("width", bw);
    el["bubble-line"].setAttribute("d", "M" + (right - bw + 10) + " 52 h" + (bw - 20));
    el["chat-label"].setAttribute("x", x + w / 2);
    el.composer.setAttribute("x", x + 8);
    el.composer.setAttribute("width", w - 16);
    el.left.setAttribute("transform", "translate(" + ROOM * f + " 0)");
    el.reply.setAttribute("d", "M118 76 h14 M104 88 h" + (88 - 32 * s) + " M104 98 h" + (62 - 22 * s));
    el.hint.setAttribute("d", "M116 168.5 h" + (30 - 6 * s));
    el.pill.style.opacity = 1 - f * t;
    el.send.setAttribute("transform", "translate(" + (-ROOM * t) + " 0)");
    LEFT.concat(RIGHT).forEach(function (n) { el[n + "-btn"].classList.toggle("on", p[n] > 0.5); });
    // The chats fold up into their row, and the projects under them close up.
    var open = Math.max(0, 1 - k);
    el.chats.setAttribute("transform", "translate(0 " + CHATS_TOP + ") scale(1 " + open + ") translate(0 " + (-CHATS_TOP) + ")");
    el.chats.style.opacity = open;
    el.below.setAttribute("transform", "translate(0 " + (-CHATS_H * k) + ")");
    el["fold-btn"].classList.toggle("on", k < 0.5);
  }

  if (still.matches) { draw({ files: 1, outline: 0, shell: 1, agent: 0 }, 0); return; }

  // ---- The springs and their loop ----

  var springs = {};
  LEFT.concat(RIGHT, ["fold"]).forEach(function (n) { springs[n] = { x: 0, v: 0, to: 0 }; });
  var last = null, frame = null;
  function at() {
    var p = {};
    LEFT.concat(RIGHT).forEach(function (n) { p[n] = springs[n].x; });
    return p;
  }
  draw(at(), 0);                                    // the rest state, before anything moves

  function step(now) {
    frame = null;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 1 / 30);
    last = now;
    var rest = true;
    for (var name in springs) {
      var sp = springs[name];
      for (var i = 0; i < 2; i++) {
        var h = dt / 2;
        sp.v += (STIFF * (sp.to - sp.x) - DAMP * sp.v) * h;
        sp.x += sp.v * h;
      }
      if (Math.abs(sp.x - sp.to) < 0.002 && Math.abs(sp.v) < 0.01) { sp.x = sp.to; sp.v = 0; }
      else rest = false;
    }
    draw(at(), springs.fold.x);
    if (rest) { last = null; return; }              // no frame asked for at rest
    frame = window.requestAnimationFrame(step);
  }

  // Ask one spring to its other end, or everything to rest. A panel
  // coming in sends the other of its side away.
  function turn(name) {
    springs[name].to = springs[name].to ? 0 : 1;
    if (springs[name].to) [LEFT, RIGHT].forEach(function (side) {
      if (side.indexOf(name) >= 0) side.forEach(function (n) { if (n !== name) springs[n].to = 0; });
    });
    run();
  }
  function settle() {
    for (var name in springs) springs[name].to = 0;
    run();
  }
  function run() {
    if (frame === null) frame = window.requestAnimationFrame(step);
  }

  // ---- A phone ----
  //
  // The light walks each window's boxes in the order they are drawn, a
  // beat each, while the figure is in view; each pane comes out for its
  // own turn, and the project folds for the chats' turn.
  function tour() {
    var ideBoxes = ideSvg.querySelectorAll(".sk-box");
    var adeBoxes = adeSvg.querySelectorAll(".sk-box");
    var i = 0, timer = null, on = [], vis = {};
    function beat() {
      on.forEach(function (g) { g.classList.remove("on"); });
      on = [ideBoxes[i % ideBoxes.length], adeBoxes[i % adeBoxes.length]];
      on.forEach(function (g) { g.classList.add("on"); });
      var pane = on[1].getAttribute("data-pane");
      LEFT.concat(RIGHT).forEach(function (n) { springs[n].to = pane === n ? 1 : 0; });
      springs.fold.to = pane === "chats" ? 1 : 0;
      run();
      i++;
    }
    // Each window reports for itself, and the tour runs while either shows.
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var shown = vis[ideSvg.id] || vis[adeSvg.id];
      if (shown && timer === null) { beat(); timer = window.setInterval(beat, 1800); }
      if (!shown && timer !== null) { window.clearInterval(timer); timer = null; }
    }, { threshold: 0.4 });
    seen.observe(ideSvg);
    seen.observe(adeSvg);
  }

  if (coarse.matches) { tour(); return; }

  // ---- The pointer ----

  // Each pass of the pointer over a button, or over the project's folder,
  // turns its thing the other way, as a press does in the app.
  LEFT.concat(RIGHT).forEach(function (n) {
    el[n + "-btn"].addEventListener("pointerenter", function () { turn(n); });
  });
  el["fold-btn"].addEventListener("pointerenter", function () { turn("fold"); });
  // Off the ADE's window, everything returns to rest, so the window is
  // found so when the pointer comes back to it.
  adeSvg.addEventListener("pointerleave", settle);
})();
