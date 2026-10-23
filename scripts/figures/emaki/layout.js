import { Cam, clamp, fit, lerp, open, poly, proj, rad, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { REGIONS, aim, circle, draw, element, pen } from "./window.js";

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
 * pointer turns the window a few degrees and tips it a little (SLIGHT,
 * window.js): there are many places to point at, and a window that turned
 * further moved them all.
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
 * A finger has no hover, so a tap holds: on a part of the window, its
 * button, or its name's tile beside the link, the part comes forward and
 * stays, and a tap on it again, in either place, lets it go; a tap on
 * another part moves to it, and one on the bare window rests it. The
 * window turns a hair toward the tap and settles back once the finger
 * is gone, the part still forward. A mouse arriving takes over.
 *
 * With `focus`, the same window heads a part's own docs page, about that
 * part alone: no names, the window's box only, and only that part in its
 * color, the rest in the window's gray (`emk-mute`). A panel's page shows
 * its panel from the start, its button filled and the chat making room;
 * the pointer on the button puts the panel away, as the button does in
 * the app, and on the part brings it forward.
 *
 * With `named`, the window is the shift's second (index.qmd, From the IDE
 * to the ADE), beside the IDE's (ide.js): each part's name in it, in its
 * color, as the IDE's panes have theirs, no leaders, the box narrow, and
 * the window still, as the IDE's is, so the two compare as they stand.
 */

export const W = 240, H = 128, SLAB = 4, TOP = H - 15, PART = 3, S = 1.25;
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
export const BOX_WIDE = [0, -18, 400, 268], BOX_NARROW = [36, 38, 328, 192], WIDE = 720;
/** The window faces the eye from a hair above; the pointer turns it within SLIGHT (window.js). */
export const REST_AZ = 0, REST_K = 0.05;
/** How much larger a part is drawn for each unit it stands forward, how far down its shadow falls, and how far a panel slides in. */
export const NEAR = 0.006, FALL = 0.22, SLIDE = 14;
let shades = 0;
/** Whether a point is inside the quad a projector makes of a rectangle at height w. */
export function inside(pt, Pq, [u0, v0, u1, v1], w) {
  const q = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => Pq(u, v, w));
  let hit = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const [xi, yi] = q[i], [xj, yj] = q[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
/** The camera on the window at rest, fitted as frame() fits it, so (u, v, w) projects where the figure draws it. */
export function restCam() {
  const C = Cam(REST_AZ, REST_K, S), W3 = (u, v, w) => [u, w, v];
  fit(C, [W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, H, -SLAB), W3(W, H, -SLAB), W3(0, 0, 0), W3(W, H, 0)], 200, 125);
  return C;
}
/**
 * The shift's box: its window at rest, a hair of air at the sides, and as
 * much over it as under it, where a part standing forward grows, so the
 * window fills its column, is the box's middle, and the arrow between the
 * two meets it there.
 */
export const SHIFT_BOX = (() => {
  const P = proj(restCam()), pts = [[0, 0, -SLAB], [W, 0, -SLAB], [0, H, 0], [W, H, 0]].map(([u, v, w]) => P(u, w, v));
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), side = 4, air = 12;
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  return [x0 - side, y0 - air, Math.max(...xs) - x0 + 2 * side, Math.max(...ys) - y0 + 2 * air];
})();
/** Where a point of a shift's window at rest is in the pointer's 400 × 320: a stop for a tour. */
export function shiftAt(u, v) {
  const P = proj(restCam()), [x, y] = P(u, 0, v), [bx, by, bw, bh] = SHIFT_BOX;
  return [((x - bx) / bw) * 400, ((y - by) / bh) * 320];
}
/** The shift's tour on a phone (`named`): the files' button, then its panel, the shell's, then its, the projects, the chat, then off. */
export const ADE_TOUR = [[PANELS.files.btn + 3, H - 6.5], [M0 + PW / 2, 60], [PANELS.shell.btn + 3, H - 6.5], [M1 - PW / 2, 60], [27, 50], [146, 60]].map(([u, v]) => shiftAt(u, v)).concat([null]);
/** The app's icon, from the site's root, which a page's offset names (`quarto:offset`). */
const ICON = (document.querySelector('meta[name="quarto:offset"]')?.getAttribute("content") ?? "./") + "assets/emaki-icon.png";
/** A four-pointed star around (u, v), r its reach: the sparkles' shape, closed. */
const star = (u, v, r) => {
  const i = r * 0.28, pts = [];
  for (let n = 0; n < 8; n++) { const a = (n * Math.PI) / 4, q = n % 2 ? i : r; pts.push([u + q * Math.sin(a), v + q * Math.cos(a)]); }
  return [...pts, pts[0]];
};

/** The projects: a heading, then the folders, the first open with its sessions along a guide line; `rows` folders in all. */
function projectsDrawn(p, [a, , c, d], rows = 4) {
  const wd = c - a;
  p.text(a + 3.5, d - 5, "Projects", 4, "emk-text emk-small");
  let v = d - 12;
  [[0.5, [0.52, 0.38, 0.58]], [0.36], [0.46], [0.3]].slice(0, rows).forEach(([len, sessions], k) => {
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

/**
 * Each part's name inside it, for the shift (`named`): its words, one to a
 * line, centered on the part. The panels' and the projects' stand at one
 * height (NAME_V, their middle), low in the pane but clear of its foot:
 * the projects draw three folders, and the files, the outline and the
 * shell keep their rows over FOOT, so nothing runs under a name; the
 * agent's prompt stays at its foot, under its name. The chat's stands at
 * the middle of its own room, between the reply and the composer.
 */
const NAMED = {
  projects: { words: ["Sessions"] },
  chats: { words: ["Agent Chat"], v: 44, s: 7.5 },
  files: { words: ["Files"] },
  outline: { words: ["Outline"] },
  shell: { words: ["Shell", "Terminal"] },
  agent: { words: ["Agent", "Terminal"] },
};
/** A name's size, the room between its lines, where the panels' stand, and the room their rows leave over a panel's foot for it. */
const NAME_S = 6.5, NAME_LH = 7.5, NAME_V = 24, FOOT = 30;

export function layout({ focus = null, named = false } = {}) {
  return ({ stage, svg, read }, value) => {
    const bag = disposer();
    let LIFT = value;
    const box = stage.closest(".layout") ?? stage.parentElement;
    const labels = {};
    box.querySelectorAll(".layout-part[data-part]").forEach((el) => { labels[el.getAttribute("data-part")] = el; });

    const C = Cam(REST_AZ, REST_K, S);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);
    const az = spring(REST_AZ, { k: 60, c: 14, eps: 0.01 }), kk = spring(REST_K, { k: 60, c: 14, eps: 0.0005 });

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
    // Named, the window has no names around it, so its leaders are drawn nowhere.
    const lead = mk("g", { class: "emk-leads" }, named ? null : svg);
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
      if (id === "projects") projectsDrawn(p, r, named ? 3 : 4); else REGIONS[DRAWN[id]](p, r, named ? FOOT : 0);
      prims.push(...p.out);
      // The part's name, last, so the chat's drawing keeps its order when it is drawn again for its width.
      if (named) {
        const n = NAMED[id], s = n.s ?? NAME_S, np = pen(), v0 = (n.v ?? NAME_V) + ((n.words.length - 1) * NAME_LH) / 2;
        n.words.forEach((word, i) => np.text((r[0] + r[2]) / 2, v0 - i * NAME_LH, word, s, "emk-name-in"));
        prims.push(...np.out);
      }
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

    let on = null, wide = null, vb = BOX_WIDE;

    /**
     * Lights a part, or none: it alone stands forward, and a panel shows
     * only while it is lit. With a focus there is the part, "away" (its
     * button, which puts its panel away), or none; the part keeps its
     * color throughout, and its button is filled while its panel shows.
     */
    function light(id) {
      on = id;
      if (focus) {
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
      C.az = rad(az.x); C.k = kk.x;
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
        // A name stands at its part's middle, which the chat's moves as it makes room.
        if (named) for (const q of pt.prims) if (q.cls === "emk-name-in") q.u = (pt.r[0] + pt.r[2]) / 2;
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
    }

    const B = register(stage, (dt) => {
      const m = [stepS(az, dt), stepS(kk, dt), ...Object.values(parts).flatMap((pt) => [stepS(pt.amt, dt), stepS(pt.vis, dt)])].some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    // Wide or narrow, by the room the figure has: the box, and where the names go.
    function size() {
      const next = !focus && !named && box.clientWidth >= WIDE;
      if (next === wide) return;
      wide = next;
      vb = named ? SHIFT_BOX : wide ? BOX_WIDE : BOX_NARROW;
      svg.setAttribute("viewBox", vb.join(" "));
      box.toggleAttribute("data-wide", wide);
      for (const id in labels) {
        const n = NAMES[id], el = labels[id];
        el.style.left = wide ? ((n.x - vb[0]) / vb[2]) * 100 + "%" : "";
        el.style.top = wide ? ((n.y - vb[1]) / vb[3]) * 100 + "%" : "";
        el.toggleAttribute("data-top", n.top);
      }
    }
    if (named) stage.style.aspectRatio = SHIFT_BOX[2] + " / " + SHIFT_BOX[3];
    const ro = new ResizeObserver(size);
    ro.observe(box);
    bag.add(() => ro.disconnect());
    size();

    /** The part under a point of the box: a panel's button, a panel that shows, the projects, the chat. */
    function under(pt) {
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
    /** The window back to rest; and rest, the window back with no part lit. */
    const settle = () => { az.t = REST_AZ; kk.t = REST_K; B.wake(); };
    const rest = () => { settle(); light(null); };
    /** The part a tap holds lit, if any: a finger has no hover, so a tap on a part or its tile pins it, and a tap on it again lets it go. */
    let pinned = null;
    const touch = (e) => e.pointerType === "touch";
    const tap = (id) => { pinned = id && id !== pinned ? id : null; if (pinned) light(pinned); else rest(); };
    /** The box's point under Hairline's 400 × 320. */
    const at = (pt) => [vb[0] + (pt[0] / 400) * vb[2], vb[1] + (pt[1] / 320) * vb[3]];
    /** A mouse, a pen or the tour: the window turns toward it, and what is under it is lit. */
    const hover = (pt) => {
      pinned = null;
      const [x, y] = at(pt);
      if (!named) aim(az, kk, x, y, vb);
      const id = under([x, y]);
      if (id !== on) light(id); else B.wake();
    };
    if (focus) light(null);
    bag.add(pointer(stage, {
      // A finger's moves are not a hover, and the tour's ghost waits while a tap holds a part.
      move: (pt, e) => { if (!touch(e) && !(pinned && e.pointerType === "ghost")) hover(pt); },
      down: (pt, e) => {
        if (!touch(e)) return hover(pt);
        const [x, y] = at(pt);
        if (!named) aim(az, kk, x, y, vb);
        tap(under([x, y]));
      },
      // Hairline hears a leave a moment late: off the figure onto a name, the name has lit its part by then, and keeps it.
      // A finger gone leaves the part it pinned where it is, and the window settles.
      leave: () => {
        if (pinned) settle();
        else if (!Object.values(labels).some((el) => el.matches(":hover, :focus-within"))) rest();
      },
    }));
    // A name lights its part under the pointer and under the keyboard's focus. A finger's tap on it, beside
    // the link, pins the part, and a tap again lets it go; the link itself goes to the part's page.
    for (const id in labels) {
      const el = labels[id];
      let by = "mouse";
      bag.on(el, "pointerdown", (e) => { by = e.pointerType; });
      bag.on(el, "pointerenter", (e) => { if (!touch(e)) { pinned = null; light(id); } });
      bag.on(el, "pointerleave", (e) => { if (!touch(e)) rest(); });
      bag.on(el, "click", (e) => { if (by === "touch" && !e.target.closest("a")) tap(id); });
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
