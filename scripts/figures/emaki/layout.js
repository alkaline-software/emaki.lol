import { Cam, clamp, fit, lerp, open, poly, proj, rad, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { REGIONS, circle, draw, element, pen } from "./window.js";

/**
 * Emaki's layout (Get Started, Layout): the window seen from the front as
 * the app opens it, the sidebar and the chat, with the six parts named
 * around it, each with a leader to its place. The four panels are named
 * over the window, their leaders down to their buttons in the chrome, as
 * the app toggles them there; the main system's two under it, their
 * leaders up to the projects in the sidebar and to the chat. Each part is
 * in its own color (css/theme.scss, The layout): its region's frame and
 * faint wash, its leader, its button and its name.
 *
 * The panels are hidden, as they are in the app until asked for. The
 * pointer on a panel's button, or on its name, brings it in from its side
 * while the chat makes room, files and the outline on the left, the two
 * terminals on the right, one to a side; on the panel it stays. A part
 * that is lit stands forward of the window as the six figures' part does
 * (window.js), its shadow under it and dashed guides back to its place,
 * and its name nears its color. The projects are the box in the sidebar,
 * under New Session, All Sessions and Agents, not the sidebar whole. The
 * window itself stays still: there are many places to point at, and a
 * window that turned under the pointer moved them all.
 *
 * A few of the app's own words, small and in the muted ink, say it is
 * Emaki's window: the name and icon in the chrome, the sidebar's three
 * rows with their icons, and the projects' heading and the open
 * project's name. The chat and the panels stay lines.
 *
 * The names are the page's own links (`.layout > .layout-part`,
 * `data-part` its name); this engine puts each at its leader's end where
 * the box is WIDE, and marks the one that is lit. Narrower, the names are
 * a grid of tiles under the window and the leaders go.
 *
 * With `focus`, the same window heads a part's own docs page, about that
 * part alone: no names, the window's box only, and only that part in its
 * color, the rest in the window's gray (`emk-mute`). A panel's page shows
 * its panel from the start, its button filled and the chat making room;
 * the pointer on the button puts the panel away, as the button does in
 * the app, and on the part brings it forward.
 *
 * With `focus: "settings"`, the settings sheet stands forward over the
 * main area, the window gray behind it: the rail of its eight sections at
 * the left (`SETTINGS_SECTIONS` in the app), the section's name and its
 * groups at the right. Appearance shows at rest; the pointer on Fonts,
 * New sessions or Updates in the rail shows that section.
 */

const W = 240, H = 128, SLAB = 4, TOP = H - 15, PART = 3, S = 1.25;
/** The sidebar's edge, and where the main area runs. */
const EDGE = 54, M0 = 57, M1 = W - 4;
/** A panel's width, and the gap it leaves the chat. */
const PW = 48, GAP = 4;
/** The projects' box in the sidebar, under its three rows. */
const PROJECTS = [5, 15, EDGE - 5, TOP - 30];
/** Each panel: its side, and its button's left edge in the chrome. */
const PANELS = {
  files: { side: -1, btn: M0 + 1 },
  outline: { side: -1, btn: M0 + 9 },
  shell: { side: 1, btn: W - 22 },
  agent: { side: 1, btn: W - 13 },
};
/** How each part is drawn (window.js, REGIONS; the projects here). */
const DRAWN = { chats: "conv", files: "tree", outline: "outline", shell: "shell", agent: "agent" };
/**
 * Each part's name: where its leader ends in the wide box (x, y), and
 * whether it stands over the window. A panel's leader runs to its button,
 * and to its head while it shows: the outer corner of it for the two
 * outer panels (`at`, -1 its left, 1 its right), whose names stand
 * beyond their buttons, so the leader crosses neither the button nor the
 * panel; the middle for the two inner ones. The files' corner is under its
 * button, so its leader meets the panel's left edge just under the corner,
 * passing between the name and the button. The others' run to the foot
 * of their place.
 */
const NAMES = {
  files: { x: 100, y: 26, top: true, at: -1 },
  outline: { x: 168, y: 26, top: true, at: 0 },
  shell: { x: 264, y: 26, top: true, at: 0 },
  agent: { x: 352, y: 26, top: true, at: 1 },
  projects: { x: 84, y: 224, top: false },
  chats: { x: 236, y: 224, top: false },
};
/**
 * The box: the whole of it when wide, the window alone when narrow, with
 * room under it for a part standing forward, which grows downward. The
 * pointer arrives in Hairline's 400 × 320 units.
 */
const BOX_WIDE = [0, -18, 400, 268], BOX_NARROW = [36, 38, 328, 192], WIDE = 720;
/** The window faces the eye from a hair above, and stays so. */
const REST_AZ = 0, REST_K = 0.05;
/** How much larger a part is drawn for each unit it stands forward, how far down its shadow falls, and how far a panel slides in. */
const NEAR = 0.006, FALL = 0.22, SLIDE = 14;
let shades = 0;
/** The app's icon, from the site's root, which a page's offset names (`quarto:offset`). */
const ICON = (document.querySelector('meta[name="quarto:offset"]')?.getAttribute("content") ?? "./") + "assets/emaki-icon.png";
/** A four-pointed star around (u, v), r its reach: the sparkles' shape, closed. */
const star = (u, v, r) => {
  const i = r * 0.28, pts = [];
  for (let n = 0; n < 8; n++) { const a = (n * Math.PI) / 4, q = n % 2 ? i : r; pts.push([u + q * Math.sin(a), v + q * Math.cos(a)]); }
  return [...pts, pts[0]];
};

/** The projects: a heading, then the folders, the first open with its sessions along a guide line. */
function projectsDrawn(p, [a, , c, d]) {
  const wd = c - a;
  p.text(a + 3.5, d - 5, "Projects", 4, "emk-text emk-small");
  let v = d - 12;
  [[0.5, [0.52, 0.38, 0.58]], [0.36], [0.46], [0.3]].forEach(([len, sessions], k) => {
    if (k === 0) p.ring(a + 1.5, v - 3.4, c - 1.5, v + 3.4, 2.2, "nf hi");
    p.ring(a + 4, v - 2, a + 9, v + 2, 0.8);
    if (k === 0) p.text(a + 12, v, "emaki", 4.4, "emk-text emk-lit");
    else p.h(a + 12, a + 12 + len * (wd - 16), v);
    if (sessions) {
      const top = v;
      sessions.forEach((sl, j) => {
        v -= 7.5;
        p.dot(a + 11, v, 1.1, j === 0 ? "dot" : "dot m");
        p.h(a + 15, a + 15 + sl * (wd - 18), v);
      });
      p.line([[a + 6.5, top - 4], [a + 6.5, v + 1]], "nf lo");
    }
    v -= 8.5;
  });
}

/** The settings sheet over the main area, its rail's width, and the sections the rail answers with. */
const SHEET = [M0 + 8, 12, M1 - 8, TOP - 6], RAIL = SHEET[0] + 38;
const SECTIONS = [["appearance", "Appearance"], ["fonts", "Fonts"], ["composer", "Composer"], ["sessions", "New sessions"], ["terminal", "Terminal"], ["files", "Files"], ["updates", "Updates"], ["about", "About"]];
const DRAWN_SECTIONS = ["appearance", "fonts", "sessions", "updates"];
const railV = (i) => SHEET[3] - 8 - i * 9;
/** A dropdown at the row's right: its box, a line for its choice, the chevron. */
const drop = (p, v) => { const R = SHEET[2] - 6; p.ring(R - 34, v - 3.6, R - 4, v + 3.6, 1.6, "nf", 1.2); p.h(R - 31, R - 16, v, "nf lo", 1.2); p.line([[R - 10.5, v + 1], [R - 9, v - 0.5], [R - 7.5, v + 1]], "nf", 1.2); };
/** Claude's mark, an asterisk of three strokes around (u, v), as the agent's terminal draws it (window.js). */
const asterisk = (p, u, v, r, w) => [0, 60, 120].forEach((a) => { const dx = Math.cos((a * Math.PI) / 180) * r, dy = Math.sin((a * Math.PI) / 180) * r; p.line([[u - dx, v - dy], [u + dx, v + dy]], "nf emk-claude", w); });
/** The sheet: its card, the rail's words and the rule beside them; each section's name and groups apart. */
function settingsDrawn() {
  const [a, , c, d] = SHEET, R = c - 6, base = pen(), sections = {};
  base.line([[RAIL, SHEET[1] + 2], [RAIL, d - 2]], "nf lo");
  SECTIONS.forEach(([, word], i) => base.text(a + 5, railV(i), word, 3.8, "emk-text", 0.6));
  const head = (p, word) => { p.text(RAIL + 6, d - 8, word, 4.8, "emk-text emk-lit", 0.6); p.h(RAIL, c - 1, d - 14, "nf lo", 0.6); };
  const card = (p, v0) => p.ring(RAIL + 6, v0, R, d - 20, 2.4, "nf", 0.8);
  const rule = (p, v) => p.h(RAIL + 6, R, v, "nf lo", 0.8);
  const label = (p, v, word) => p.text(RAIL + 10, v, word, 3.6, "emk-text", 1.2);
  // Appearance: the look, a segmented control with Auto on its plate; the accent, seven discs, the chosen one ringed.
  let p = (sections.appearance = pen());
  head(p, "Appearance"); card(p, d - 54);
  label(p, d - 26.5, "Appearance");
  p.ring(R - 44, d - 30, R - 4, d - 23, 2, "nf", 1.2);
  p.ring(R - 43, d - 29.2, R - 30, d - 23.8, 1.6, "emk-seg", 1.2);
  p.text(R - 41, d - 26.5, "Auto", 3, "emk-text emk-lit", 1.4);
  p.h(R - 26, R - 18, d - 26.5, "nf lo", 1.2); p.h(R - 14, R - 7, d - 26.5, "nf lo", 1.2);
  rule(p, d - 35);
  label(p, d - 41, "Accent"); p.text(RAIL + 10, d - 47, "Periwinkle", 3, "emk-text emk-small", 1.2);
  ["accent", "mauve", "rose", "ochre", "sage", "teal", "slate"].forEach((t, i) => p.dot(R - 44 + i * 6.6, d - 44, 2.4, "dot emk-fill-" + t, 1.2));
  p.dot(R - 44, d - 44, 1.1, "dot emk-fill-plate", 1.3);
  // Fonts: the chat's face and the code's, each a dropdown, and one text size.
  p = sections.fonts = pen();
  head(p, "Fonts"); card(p, d - 68);
  label(p, d - 26.5, "Chat"); p.text(170, d - 26.5, "Aa", 4.6, "emk-text emk-aa", 1.2); drop(p, d - 26.5);
  rule(p, d - 35);
  label(p, d - 43.5, "Code"); p.text(170, d - 43.5, "Aa", 4, "emk-text emk-aa-mono", 1.2); drop(p, d - 43.5);
  rule(p, d - 52);
  label(p, d - 60, "Text size"); p.h(170, R - 4, d - 60, "nf lo", 1.2); p.h(170, 194, d - 60, "nf emk-acc", 1.2); p.dot(194, d - 60, 2, "dot emk-fill-accent", 1.3);
  // New sessions: one agent's three at a time, its mark and name at the head, the agents a small segmented control.
  p = sections.sessions = pen();
  head(p, "New sessions"); card(p, d - 86);
  asterisk(p, RAIL + 12, d - 26.5, 2.4, 1.2);
  p.text(RAIL + 17, d - 26.5, "Claude Code", 3.6, "emk-text emk-lit", 1.2);
  p.ring(R - 18, d - 30, R - 4, d - 23, 2, "nf", 1.2); p.ring(R - 17.3, d - 29.3, R - 11, d - 23.7, 1.6, "emk-seg", 1.2);
  asterisk(p, R - 14.2, d - 26.5, 1.8, 1.4); p.dot(R - 7.5, d - 26.5, 1.4, "dot emk-fill-codex", 1.2);
  rule(p, d - 35);
  [["Mode", d - 43.5], ["Model", d - 58], ["Effort", d - 72.5]].forEach(([w, v]) => { label(p, v, w); drop(p, v); });
  // Updates: a daily check, a switch, on; up to date, and a button to check now.
  p = sections.updates = pen();
  head(p, "Updates"); card(p, d - 54);
  label(p, d - 26.5, "Check daily");
  p.ring(R - 14, d - 29.5, R - 4, d - 23.5, 3, "emk-fill-accent", 1.2); p.dot(R - 7, d - 26.5, 2, "dot emk-fill-plate", 1.3);
  rule(p, d - 35);
  label(p, d - 41.5, "Up to date"); p.h(RAIL + 10, RAIL + 26, d - 47.5, "nf lo", 1.2);
  p.ring(R - 30, d - 48, R - 4, d - 40, 2.4, "nf", 1.2); p.text(R - 26.5, d - 44, "Check now", 3, "emk-text emk-lit", 1.4);
  return { base: base.out, sections: Object.fromEntries(Object.entries(sections).map(([k, q]) => [k, q.out])) };
}

export function layout({ focus = null } = {}) {
  return ({ stage, svg, read }, value) => {
    const bag = disposer();
    let LIFT = value;
    const box = stage.closest(".layout") ?? stage.parentElement;
    const labels = {};
    box.querySelectorAll(".layout-part[data-part]").forEach((el) => { labels[el.getAttribute("data-part")] = el; });

    const C = Cam(REST_AZ, REST_K, S);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);

    // The window: its slab, the chrome's rule, lights and name, the sidebar's edge, its three rows and its foot.
    const g = mk("g", {}, svg);
    const base = [{ t: "tile", r: [0, 0, W, H], rad: 7, h: SLAB, cls: "", w: -SLAB }];
    const ch = pen();
    ch.h(2, W - 2, TOP + 2, "nf lo");
    [7, 12.5, 18].forEach((u) => ch.dot(u, H - 6.5, 1.5, "dot m"));
    ch.image(24.5, H - 6.5, ICON, 6.5);
    ch.text(29, H - 6.5, "Emaki", 6.5, "emk-text emk-name");
    ch.line([[EDGE, 2], [EDGE, TOP + 2]], "nf lo");
    // New Session, its plus in a ring; All Sessions, a square with a bar; Agents, the sparkles.
    const v1 = TOP - 7, v2 = TOP - 14.5, v3 = TOP - 22;
    ch.ring(5, v1 - 2.2, 9.4, v1 + 2.2, 2.2, "nf hi");
    ch.line([[7.2, v1 - 1.2], [7.2, v1 + 1.2]], "nf hi");
    ch.line([[6, v1], [8.4, v1]], "nf hi");
    ch.ring(5.2, v2 - 2, 9.2, v2 + 2, 0.6, "nf");
    ch.line([[6.2, v2], [8.2, v2]], "nf");
    ch.line(star(6.8, v3 - 0.4, 2), "nf");
    ch.line(star(9.4, v3 + 1.6, 0.9), "nf");
    [[v1, "New Session", "emk-text emk-lit"], [v2, "All Sessions", "emk-text"], [v3, "Agents", "emk-text"]].forEach(([v, word, cls]) => ch.text(12, v, word, 4.6, cls));
    ch.dot(8, 8, 2, "dot m");
    ch.h(13, 30, 8, "nf");
    base.push(...ch.out);
    base.forEach((q) => element(q, g));

    // Each part in a group of its own: its shadow, its guides, its slab and its drawing; its leader over everything.
    const lead = mk("g", { class: "emk-leads" }, svg);
    const fid = ++shades, defs = mk("defs", {}, svg);
    const fl = mk("filter", { id: "emk-lay-" + fid, x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
    mk("feGaussianBlur", { stdDeviation: 5 }, fl);
    const rectOf = { projects: PROJECTS, chats: [M0, 4, M1, TOP] };
    for (const k in PANELS) rectOf[k] = PANELS[k].side < 0 ? [M0, 4, M0 + PW, TOP] : [M1 - PW, 4, M1, TOP];
    const parts = {};
    for (const id of ["chats", "projects", "files", "outline", "shell", "agent"]) {
      const pg = mk("g", { class: "emk-p-" + id }, g);
      const shade = mk("path", { class: "emk-shade", filter: `url(#emk-lay-${fid})` }, pg);
      const guides = mk("path", { class: "nf dash emk-guide" }, pg);
      const r = rectOf[id].slice();
      const prims = [{ t: "tile", r, rad: 3, h: PART, cls: "hi emk-wash", w: -PART }];
      const p = pen();
      if (id === "projects") projectsDrawn(p, r); else REGIONS[DRAWN[id]](p, r);
      prims.push(...p.out);
      prims.forEach((q) => element(q, pg));
      const lg = mk("g", { class: "emk-p-" + id }, lead);
      if (focus) pg.classList.toggle("emk-mute", id !== focus);
      parts[id] = {
        g: pg, shade, guides, prims, r, lg,
        amt: spring(0, { eps: 0.002 }),
        vis: spring(id === focus && PANELS[id] ? 1 : 0, { eps: 0.002 }),
        line: mk("path", { class: "nf emk-lead" }, lg),
        end: mk("path", { class: "dot emk-lead-dot" }, lg),
      };
    }
    // The panels' buttons, in the chrome, each in its part's group: filled while its panel shows.
    for (const k in PANELS) {
      const u = PANELS[k].btn, bg = mk("g", { class: "emk-p-" + k + (focus && k !== focus ? " emk-mute" : "") }, g);
      parts[k].bg = bg;
      parts[k].btn = element({ t: "ring", r: [u, H - 9.5, u + 6, H - 3.5], rad: 1.4, cls: "nf hi emk-btn", w: 0 }, bg);
    }

    // The settings sheet: forward over the main area, its rail's rows washed where they answer, a section showing.
    let sheet = null, section = "appearance";
    if (focus === "settings") {
      const sg = mk("g", { class: "emk-sheet" }, g);
      const shade = mk("path", { class: "emk-shade", filter: `url(#emk-lay-${fid})` }, sg);
      const card = { t: "tile", r: SHEET, rad: 4, h: 1.4, cls: "emk-card", w: -0.8 };
      element(card, sg);
      const washes = {};
      for (const k of DRAWN_SECTIONS) {
        const i = SECTIONS.findIndex(([key]) => key === k), v = railV(i);
        washes[k] = element({ t: "ring", r: [SHEET[0] + 2, v - 3.8, RAIL - 2, v + 3.8], rad: 2, cls: "emk-cur", w: 0.6 }, sg);
      }
      const { base: bp, sections } = settingsDrawn();
      bp.forEach((q) => element(q, sg));
      const groups = {};
      for (const k in sections) { const sub = mk("g", {}, sg); sections[k].forEach((q) => element(q, sub)); groups[k] = { g: sub, prims: sections[k] }; }
      sheet = { g: sg, shade, prims: [card, ...Object.values(washes), ...bp], washes, groups };
    }

    let on = null, wide = null, vb = BOX_WIDE;

    /**
     * Lights a part, or none: it alone stands forward, and a panel shows
     * only while it is lit. With a focus there is the part, "away" (its
     * button, which puts its panel away), or none; the part keeps its
     * color throughout, and its button is filled while its panel shows.
     */
    function light(id) {
      on = id;
      if (sheet) {
        section = id ?? "appearance";
        for (const k in sheet.groups) sheet.groups[k].g.style.display = k === section ? "" : "none";
        for (const k in sheet.washes) sheet.washes[k].el.style.opacity = k === section ? 1 : 0;
      } else if (focus) {
        const pt = parts[focus];
        pt.amt.t = id === focus ? 1 : 0;
        if (PANELS[focus]) pt.vis.t = id === "away" ? 0 : 1;
        pt.g.classList.add("emk-on");
        pt.bg?.classList.toggle("emk-on", id !== "away");
        g.appendChild(pt.g);
      } else {
        for (const k in parts) parts[k].amt.t = parts[k].vis.t = k === id ? 1 : 0;
        if (id) g.appendChild(parts[id].g);
        for (const k in parts) {
          for (const el of [parts[k].g, parts[k].lg, parts[k].bg]) el?.classList.toggle("emk-on", k === id);
          if (labels[k]) labels[k].toggleAttribute("data-on", k === id);
        }
      }
      read.textContent = id ?? "rest";
      B.wake();
    }

    /** How far each side's panel is in: the chat gives up that much room. */
    const room = (side) => Math.max(...Object.keys(PANELS).filter((k) => PANELS[k].side === side).map((k) => parts[k].vis.x));
    /** A part's projector: larger as it comes forward, from the middle of its head down, so it never covers the chrome; a panel slides in from its side. */
    const PN = (r, z, dx) => {
      const cu = (r[0] + r[2]) / 2, d = r[3], k = 1 + NEAR * z;
      return (u, v, w) => P2(cu + (u + dx - cu) * k, d + (v - d) * k, w);
    };

    function frame() {
      C.az = rad(REST_AZ); C.k = REST_K;
      const W3 = (u, v, w) => [u, w, v];
      fit(C, [W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, H, -SLAB), W3(W, H, -SLAB), W3(0, 0, 0), W3(W, H, 0)], 200, 125);
      P = proj(C);
      const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
      base.forEach((q) => draw(q, 0, front, P2));

      // The chat makes room for the panels: drawn again for its width now, into the same elements.
      const cr = parts.chats.r;
      cr[0] = M0 + (PW + GAP) * room(-1);
      cr[2] = M1 - (PW + GAP) * room(1);
      const fresh = pen();
      REGIONS.conv(fresh, cr);
      fresh.out.forEach((q, i) => { const o = parts.chats.prims[i + 1]; o.pts = q.pts; o.r = q.r; o.u = q.u; o.v = q.v; });

      for (const id in parts) {
        const pt = parts[id], a = pt.amt.x, z = LIFT * a, panel = PANELS[id], vis = pt.vis.x;
        const dx = panel ? panel.side * SLIDE * (1 - vis) : 0, Pn = PN(pt.r, z, dx);
        const [u0, v0, u1, v1] = pt.r, k = 1 + NEAR * z, cu = (u0 + u1) / 2, fall = FALL * z;
        const shown = panel ? vis > 0.002 : true;
        pt.g.style.display = shown ? "" : "none";
        if (shown) {
          if (panel) pt.g.style.opacity = clamp(vis * 1.6, 0, 1);
          pt.shade.setAttribute("d", poly(rrect(cu + (u0 + dx - cu) * k + fall * 0.4, v1 + (v0 - v1) * k - fall, cu + (u1 + dx - cu) * k + fall * 0.4, v1 - fall, 4, 3).map((q) => P2(q.u, q.v, 0))));
          pt.shade.style.opacity = a;
          const corners = [[u0 + 2, v0 + 2], [u1 - 2, v0 + 2], [u1 - 2, v1 - 2], [u0 + 2, v1 - 2]];
          pt.guides.setAttribute("d", corners.map(([u, v]) => open([P2(u + dx, v, 0), Pn(u, v, z)])).join(""));
          pt.guides.style.opacity = a;
          pt.prims.forEach((q) => draw(q, z + PART, front, Pn));
        }
        if (pt.btn) draw(pt.btn, 0, front, P2);
        // The leader: from its name's end to its place, a panel's from its button to its head as it comes in.
        const n = NAMES[id];
        let q;
        if (panel) {
          const [hu, hv] = n.at < 0 ? [u0, v1 - 5] : n.at > 0 ? [u1 - 3, v1] : [cu, v1];
          const bq = P2(panel.btn + 3, H - 3.5, 0), hq = Pn(hu, hv, z + PART);
          q = [lerp(bq[0], hq[0], a), lerp(bq[1], hq[1], a)];
        } else q = Pn(cu, v0, z + PART);
        pt.line.setAttribute("d", open([[n.x, n.y], q]));
        pt.end.setAttribute("d", circle((u, v) => [u, v], q[0], q[1], 1.4));
      }
      if (sheet) {
        const z = LIFT, Pn = PN(SHEET, z, 0), [u0, v0, u1, v1] = SHEET, k = 1 + NEAR * z, cu = (u0 + u1) / 2, fall = FALL * z;
        sheet.shade.setAttribute("d", poly(rrect(cu + (u0 - cu) * k + fall * 0.4, v1 + (v0 - v1) * k - fall, cu + (u1 - cu) * k + fall * 0.4, v1 - fall, 4, 3).map((q) => P2(q.u, q.v, 0))));
        sheet.prims.forEach((q) => draw(q, z + 0.8, front, Pn));
        sheet.groups[section].prims.forEach((q) => draw(q, z + 0.8, front, Pn));
      }
    }

    const B = register(stage, (dt) => {
      const m = [...Object.values(parts).flatMap((pt) => [stepS(pt.amt, dt), stepS(pt.vis, dt)])].some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    // Wide or narrow, by the room the figure has: the box, and where the names go.
    function size() {
      const next = !focus && box.clientWidth >= WIDE;
      if (next === wide) return;
      wide = next;
      vb = wide ? BOX_WIDE : BOX_NARROW;
      svg.setAttribute("viewBox", vb.join(" "));
      box.toggleAttribute("data-wide", wide);
      for (const id in labels) {
        const n = NAMES[id], el = labels[id];
        el.style.left = wide ? ((n.x - vb[0]) / vb[2]) * 100 + "%" : "";
        el.style.top = wide ? ((n.y - vb[1]) / vb[3]) * 100 + "%" : "";
        el.toggleAttribute("data-top", n.top);
      }
    }
    const ro = new ResizeObserver(size);
    ro.observe(box);
    bag.add(() => ro.disconnect());
    size();

    /** Whether a point is inside the quad a projector makes of a rectangle at height w. */
    const inside = (pt, Pq, [u0, v0, u1, v1], w) => {
      const q = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => Pq(u, v, w));
      let hit = false;
      for (let i = 0, j = 3; i < 4; j = i++) {
        const [xi, yi] = q[i], [xj, yj] = q[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    /** The part under a point of the box: a panel's button, a panel that shows, the projects, the chat. */
    function under(pt) {
      if (sheet) {
        const Pn = PN(SHEET, LIFT, 0);
        return DRAWN_SECTIONS.find((k) => { const v = railV(SECTIONS.findIndex(([key]) => key === k)); return inside(pt, Pn, [SHEET[0] + 2, v - 4.5, RAIL - 2, v + 4.5], LIFT + 1.4); }) ?? null;
      }
      if (focus) {
        const p = PANELS[focus], f = parts[focus], z = LIFT * f.amt.x;
        if (p && inside(pt, P2, [p.btn - 1, TOP + 2, p.btn + 7, H - 1], 0)) return "away";
        return (!p || f.vis.x > 0.5) && inside(pt, PN(f.r, z, 0), f.r, z + PART) ? focus : null;
      }
      for (const k in PANELS) if (inside(pt, P2, [PANELS[k].btn - 1, TOP + 2, PANELS[k].btn + 7, H - 1], 0)) return k;
      for (const k in PANELS) {
        const p = parts[k], z = LIFT * p.amt.x;
        if (p.vis.x > 0.5 && inside(pt, PN(p.r, z, 0), p.r, z + PART)) return k;
      }
      for (const k of ["projects", "chats"]) {
        const p = parts[k], z = LIFT * p.amt.x;
        if (inside(pt, PN(p.r, z, 0), p.r, z + PART)) return k;
      }
      return null;
    }
    const rest = () => light(null);
    if (focus) light(null);
    bag.add(pointer(stage, {
      move: (pt) => {
        const x = vb[0] + (pt[0] / 400) * vb[2], y = vb[1] + (pt[1] / 320) * vb[3];
        const id = under([x, y]);
        if (id !== on) light(id); else B.wake();
      },
      leave: rest,
    }));
    // A name lights its part under the pointer and under the keyboard's focus.
    for (const id in labels) {
      const el = labels[id];
      bag.on(el, "pointerenter", () => light(id));
      bag.on(el, "pointerleave", rest);
      bag.on(el, "focusin", () => light(id));
      bag.on(el, "focusout", rest);
    }
    bag.add(() => { for (const id in labels) { labels[id].removeAttribute("data-on"); labels[id].style.left = labels[id].style.top = ""; } box.removeAttribute("data-wide"); });
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { LIFT = v; B.wake(); },
      destroy: bag.dispose,
    };
  };
}
