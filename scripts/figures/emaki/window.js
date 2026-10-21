import { Cam, clamp, fit, lerp, open, poly, prism, proj, rad, rings, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";

/**
 * Emaki's window, seen from the front, with one
 * of its parts taken out of it: the six figures of the app's parts on the
 * landing page are this one drawing, each with its own part forward.
 *
 * The window stands at the back, its chrome across the head with the
 * lights, the name and the panels' buttons, and its regions under it, the
 * sidebar, the chat and, where the part is a panel, that panel
 * open beside the chat, every one drawn faintly. The part stands
 * forward of it as a slab of its own, drawn in full in the darker ink, its
 * frame bright and its face washed in its own color, and dashed guides run
 * back from its corners to the place it left, empty in the window. It is
 * nearer the eye, so it is drawn larger, as far as it stands out, from
 * the middle of its head down, so it never covers the chrome, and
 * casts a soft shadow on the window under it: seen straight on, the
 * overhang, the spread of the guides and the shadow say how far forward it
 * is. The part's button in the chrome is bright too.
 *
 * The pointer's x turns the window a little to either side and its y
 * tips it, on springs, so the layers part and close as the eye moves round
 * them; on the part, the part comes further forward. At rest the window
 * faces the eye, seen from a hair above. The slider is how far forward the part
 * stands.
 *
 * The window stands in the x–z plane and faces +y, so the figure draws in
 * its own frame: u across, v up, w out of the face, P2(u, v, w) = P(u, w, v).
 */

const W = 200, H = 128, SLAB = 4, TOP = H - 15, PART = 3;
const LAYOUTS = {
  plain: { side: [4, 4, 54, TOP], conv: [58, 4, W - 4, TOP] },
  left: { side: [4, 4, 44, TOP], panel: [48, 4, 96, TOP], conv: [100, 4, W - 4, TOP] },
  right: { side: [4, 4, 44, TOP], conv: [48, 4, 146, TOP], panel: [150, 4, W - 4, TOP] },
};
/** At rest the window faces the eye (no turn, in degrees) from a hair above (sin of the elevation); the pointer turns it as far as AZ and tips it from K0 to K1. */
const REST_AZ = 0, AZ = 30, REST_K = 0.05, K0 = 0.1, K1 = 0.34, MORE = 8;
/** How much larger the part is drawn for each unit it stands forward, and how far down its shadow falls for each. */
const NEAR = 0.006, FALL = 0.22;
let shades = 0;

/* ---------- what is drawn: primitives in the window's frame ---------- */

/** A pen that collects a region's drawing: lines, outlines, raised tiles and dots, each at a height w over its layer. */
export function pen() {
  const out = [];
  return {
    out,
    line: (pts, cls = "nf", w = 0) => out.push({ t: "line", pts, cls, w }),
    h: (u0, u1, v, cls = "nf", w = 0) => out.push({ t: "line", pts: [[u0, v], [u1, v]], cls, w }),
    ring: (u0, v0, u1, v1, r, cls = "nf", w = 0) => out.push({ t: "ring", r: [u0, v0, u1, v1], rad: r, cls, w }),
    tile: (u0, v0, u1, v1, r, h, cls = "", w = 0) => out.push({ t: "tile", r: [u0, v0, u1, v1], rad: r, h, cls, w }),
    dot: (u, v, rr, cls = "dot m", w = 0) => out.push({ t: "dot", u, v, rr, cls, w }),
    // A word, `s` units high, from (u, v) on its middle line; a picture, `s` units square, centered there.
    text: (u, v, str, s, cls = "emk-text", w = 0) => out.push({ t: "text", u, v, str, s, cls, w }),
    image: (u, v, href, s, w = 0) => out.push({ t: "image", u, v, href, s, w }),
  };
}
export const chev = (p, u, v, w, cls = "nf") => p.line([[u, v + 1.6], [u + 2, v], [u, v - 1.6]], cls, w);

/** The regions, each drawn in full; the window's faint copy of a region is the same drawing, flattened. */
export const REGIONS = {
  side(p, [a, , c, d]) {
    const wd = c - a;
    p.tile(a + 3, d - 10, c - 3, d - 3, 3, 1.4);
    p.h(a + 6, a + 10, d - 6.5, "nf", 1.4);
    p.line([[a + 8, d - 8.5], [a + 8, d - 4.5]], "nf", 1.4);
    p.h(a + 13, a + 13 + wd * 0.35, d - 6.5, "nf", 1.4);
    let v = d - 18;
    [[0.42, [0.5, 0.36, 0.56]], [0.3], [0.48], [0.36]].forEach(([len, s], k) => {
      if (s) p.ring(a + 2, v - 3.6, c - 2, v + 3.6, 2.4, "nf hi");
      p.ring(a + 5, v - 2, a + 10, v + 2, 0.8);
      p.h(a + 13, a + 13 + len * (wd - 16), v);
      if (s) {
        const top = v;
        s.forEach((sl, j) => {
          v -= 8;
          p.dot(a + 11, v, 1.1, j === 0 ? "dot" : "dot m");
          p.h(a + 15, a + 15 + sl * (wd - 18), v);
        });
        p.line([[a + 7.5, top - 4], [a + 7.5, v + 1]], "nf lo");
      }
      v -= 9;
    });
  },
  conv(p, [a, b, c, d]) {
    const wd = c - a;
    p.h(a + 5, a + 5 + wd * 0.82, d - 6);
    p.h(a + 5, a + 5 + wd * 0.74, d - 11);
    p.h(a + 5, a + 5 + wd * 0.5, d - 16);
    p.tile(c - 5 - wd * 0.42, d - 29, c - 5, d - 21, 3.5, 1.6);
    p.h(c - wd * 0.42, c - 12, d - 25, "nf", 1.6);
    p.tile(a + 5, d - 42, a + 5 + wd * 0.55, d - 35, 2, 1.2);
    p.dot(a + 9, d - 38.5, 1.1, "dot m", 1.2);
    p.h(a + 13, a + 5 + wd * 0.42, d - 38.5, "nf", 1.2);
    p.h(a + 5, a + 5 + wd * 0.86, d - 50);
    p.h(a + 5, a + 5 + wd * 0.6, d - 55);
    p.tile(a + 3, b + 8, c - 3, b + 26, 4, 2);
    const end = a + 8 + wd * 0.4;
    p.h(a + 8, end, b + 21, "nf", 2);
    p.line([[end + 1.6, b + 19], [end + 1.6, b + 23]], "nf hi", 2);
    [0, 14, 28].forEach((o) => p.ring(a + 8 + o, b + 11, a + 20 + o, b + 15, 2, "nf", 2));
    p.tile(c - 13, b + 10, c - 6, b + 17, 3.5, 1.4, "hi", 2);
    p.line([[c - 9.5, b + 11.5], [c - 9.5, b + 15.5]], "nf", 3.4);
    p.line([[c - 11.2, b + 13.8], [c - 9.5, b + 15.5], [c - 7.8, b + 13.8]], "nf", 3.4);
    p.h(a + 5, a + 20, b + 3.5, "nf lo");
    p.h(a + 24, a + 36, b + 3.5, "nf lo");
  },
  tree(p, [a, , c, d]) {
    const wd = c - a;
    p.tile(a + 3, d - 10, a + wd * 0.66, d - 3, 3, 1.2);
    p.dot(a + 7, d - 6.5, 1, "dot m", 1.2);
    p.h(a + 10, a + wd * 0.54, d - 6.5, "nf", 1.2);
    const rows = [[0, "dir", 0.3, 2], [1, "f", 0.45, 1], [1, "f", 0.34, 0], [1, "dirc", 0.28, 0], [0, "f", 0.42, 1],
      [0, "f", 0.36, 1], [0, "f", 0.3, 0], [0, "f", 0.38, 0], [0, "f", 0.26, 0], [0, "f", 0.33, 0]];
    rows.forEach(([dep, kind, len, git], i) => {
      const v = d - 17 - i * 7.5, x = a + 4 + dep * 4, sel = i === 1, w = sel ? 1 : 0;
      if (sel) p.tile(a + 2, v - 3.4, c - 2, v + 3.4, 2, 1, "hi");
      if (kind === "dir") p.line([[x, v + 1], [x + 1.6, v - 0.8], [x + 3.2, v + 1]], "nf", w);
      else if (kind === "dirc") chev(p, x + 0.6, v, w);
      else p.ring(x, v - 2, x + 3, v + 2, 0.6, "nf", w);
      p.h(x + 5.5, x + 5.5 + len * wd, v, "nf", w);
      if (git) p.dot(c - 5, v, git === 1 ? 1 : 0.8, git === 1 ? "dot m" : "dot off", w);
    });
  },
  outline(p, [a, , c, d]) {
    const wd = c - a;
    p.h(a + 4, a + 18, d - 6, "nf sil");
    [0.6, 0.45, 0.7, 0.5, 0.62, null, 0.4, 0.66, 0.52, 0.58].forEach((len, i) => {
      const v = d - 15 - i * 9;
      if (len === null) { p.h(a + 4, a + 16, v, "nf sil"); return; }
      const on = i === 3;
      p.tile(a + 3, v - 2.5, a + 11, v + 2.5, 1.2, on ? 1.6 : 1, on ? "hi" : "");
      p.h(a + 14, a + 14 + len * (wd - 17), v, on ? "nf hi" : "nf");
    });
  },
  shell(p, [a, , c, d]) {
    const wd = c - a;
    p.tile(a + 2, d - 11, c - 2, d - 2, 3, 0.8);
    p.tile(a + 4, d - 9.5, a + 4 + wd * 0.34, d - 3.5, 2.4, 1.4, "hi", 0.8);
    chev(p, a + 7, d - 6.5, 2.2);
    p.h(a + 11, a + wd * 0.3, d - 6.5, "nf", 2.2);
    p.tile(a + 6 + wd * 0.34, d - 9.5, a + 4 + wd * 0.66, d - 3.5, 2.4, 0.8, "", 0.8);
    p.ring(c - 10, d - 9.5, c - 4, d - 3.5, 3, "nf", 0.8);
    const rows = [[">", 0.3], [[0, 0.2], [0.3, 0.24], [0.62, 0.18]], [[0, 0.26], [0.3, 0.16], [0.62, 0.22]], [[0, 0.18], [0.3, 0.28]],
      [">", 0.42], [[0, 0.74]], [[0.06, 0.56]], [[0.06, 0.66]], [[0.06, 0.48]], [[0, 0.38]], [">", 0.24], [[0, 0.5]], [">", 0]];
    let cur = null;
    rows.forEach((row, i) => {
      const v = d - 18 - i * 7;
      if (row[0] === ">") { chev(p, a + 4, v, 0); if (row[1]) p.h(a + 9, a + 9 + row[1] * (wd - 12), v); cur = [a + 9 + row[1] * (wd - 12) + (row[1] ? 2 : 0), v]; }
      else for (const [o, l] of row) p.h(a + 4 + o * (wd - 8), a + 4 + (o + l) * (wd - 8), v);
    });
    p.tile(cur[0], cur[1] - 2.6, cur[0] + 4, cur[1] + 2.6, 0.8, 1.4, "hi");
  },
  agent(p, [a, b, c, d]) {
    const wd = c - a, sp = (u, v) => [0, 60, 120].forEach((g) => {
      const x = Math.cos(rad(g)) * 2.4, y = Math.sin(rad(g)) * 2.4;
      p.line([[u - x, v - y], [u + x, v + y]], "nf hi");
    });
    p.ring(a + 3, d - 14, a + 3 + wd * 0.8, d - 3, 2);
    sp(a + 8.5, d - 8.5);
    p.h(a + 14, a + wd * 0.55, d - 8.5);
    chev(p, a + 4, d - 21, 0);
    p.h(a + 9, a + wd * 0.62, d - 21);
    p.dot(a + 5.5, d - 29, 1, "dot m");
    p.h(a + 9, a + wd * 0.86, d - 29);
    p.h(a + 9, a + wd * 0.7, d - 34);
    p.dot(a + 5.5, d - 42, 1, "dot m");
    p.h(a + 9, a + wd * 0.46, d - 42);
    p.line([[a + 9, d - 44.5], [a + 9, d - 47], [a + 11.5, d - 47]]);
    p.h(a + 13.5, a + wd * 0.62, d - 47);
    p.tile(a + 3, d - 76, c - 3, d - 54, 2, 1.4, "hi");
    p.h(a + 7, a + wd * 0.66, d - 59, "nf", 1.4);
    p.h(a + 7, a + 10, d - 64.5, "nf hi", 1.4);
    p.h(a + 13, a + wd * 0.44, d - 64.5, "nf hi", 1.4);
    p.h(a + 7, a + 10, d - 70.5, "nf", 1.4);
    p.h(a + 13, a + wd * 0.38, d - 70.5, "nf", 1.4);
    p.ring(a + 3, b + 3, c - 3, b + 11, 1.6);
    chev(p, a + 6, b + 7, 0);
  },
};

/** The faint copy: everything flat on the window's face, in the faintest stroke. */
const flatten = (prims) => prims.map((q) =>
  q.t === "tile" ? { t: "ring", r: q.r, rad: q.rad, cls: "nf lo", w: 0 }
  : q.t === "dot" ? { ...q, cls: "dot off", w: 0 }
  : { ...q, cls: "nf lo", w: 0 });

/** The full drawing, in the darker ink: what is drawn in the middle stroke takes the silhouettes'. */
export const strengthen = (prims) => prims.map((q) => (q.cls === "nf" ? { ...q, cls: "nf sil" } : q));

/* ---------- drawing a primitive ---------- */

/** The element for a primitive, made once in `parent`: a tile is a silhouette and its crease, the rest one path. */
export function element(q, parent) {
  if (q.t === "text") {
    q.el = mk("text", { class: q.cls, "dominant-baseline": "central" }, parent);
    q.el.textContent = q.str;
  } else if (q.t === "image") q.el = mk("image", { href: q.href }, parent);
  else if (q.t === "tile") {
    const gg = mk("g", {}, parent);
    q.el = mk("path", { class: "sil" + (q.cls ? " " + q.cls : "") }, gg);
    q.cr = mk("path", { class: "nf lo" }, gg);
  } else q.el = mk("path", { class: q.cls }, parent);
  return q;
}

export const circle = (P2, u, v, r, w) => poly(Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return P2(u + r * Math.cos(t), v + r * Math.sin(t), w); }));

/** Writes a primitive's paths for the projector P2, `off` over the window's face; `front` says which way a tile's sides face. */
export function draw(q, off, front, P2) {
  const w = off + q.w;
  if (q.t === "tile") {
    const [u0, v0, u1, v1] = q.r, bv = Math.min(1.2, (u1 - u0) / 4, (v1 - v0) / 4);
    const [ring, inner] = rings(u0, v0, u1, v1, q.rad, bv), s = prism(P2, front, ring, inner, w, w + q.h);
    q.el.setAttribute("d", s.sil); q.cr.setAttribute("d", s.crease);
  } else if (q.t === "ring") q.el.setAttribute("d", poly(rrect(...q.r, q.rad, 3).map((s) => P2(s.u, s.v, w))));
  else if (q.t === "line") q.el.setAttribute("d", open(q.pts.map(([u, v]) => P2(u, v, w))));
  else if (q.t === "dot") q.el.setAttribute("d", circle(P2, q.u, q.v, q.rr, w));
  else {
    // A word or a picture stays upright: placed at its point, sized by how far a unit across reaches there.
    const [x, y] = P2(q.u, q.v, w), [x1, y1] = P2(q.u + 1, q.v, w), k = Math.hypot(x1 - x, y1 - y) * q.s;
    if (q.t === "text") { q.el.setAttribute("x", x.toFixed(2)); q.el.setAttribute("y", y.toFixed(2)); q.el.setAttribute("font-size", k.toFixed(2)); }
    else { q.el.setAttribute("x", (x - k / 2).toFixed(2)); q.el.setAttribute("y", (y - k / 2).toFixed(2)); q.el.setAttribute("width", k.toFixed(2)); q.el.setAttribute("height", k.toFixed(2)); }
  }
}

/* ---------- the figure ---------- */

/** One of the six: `layout` is the window's (LAYOUTS), `focus` the region taken out, `region` how it is drawn, `button` the chrome's button that is its own. */
export function figure({ layout, focus, region, button }) {
  return ({ stage, svg, read }, value) => {
    const bag = disposer();
    let LIFT = value;
    const L = LAYOUTS[layout], g = mk("g", {}, svg);
    const C = Cam(REST_AZ, REST_K, 1.75);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);
    const az = spring(REST_AZ, { k: 60, c: 14, eps: 0.01 }), kk = spring(REST_K, { k: 60, c: 14, eps: 0.0005 }), lift = spring(value, { eps: 0.01 });

    // The window: its slab, its chrome, and its regions faint, the one taken out left as an empty place.
    const base = [{ t: "tile", r: [0, 0, W, H], rad: 7, h: SLAB, cls: "", w: -SLAB }];
    const ch = pen();
    ch.h(2, W - 2, TOP + 2, "nf lo");
    [8, 14, 20].forEach((u) => ch.dot(u, H - 6.5, 1.5, "dot m"));
    ch.h(26, 40, H - 6.5, "nf");
    const btns = { files: L.side[2] + 4, outline: L.side[2] + 12, shell: W - 20, agent: W - 11 };
    for (const k in btns) ch.ring(btns[k], H - 9.5, btns[k] + 6, H - 3.5, 1.4, k === button ? "nf hi" : "nf lo");
    base.push(...ch.out);
    const rects = { side: L.side, conv: L.conv, panel: L.panel };
    for (const k in rects) {
      if (!rects[k]) continue;
      const [a, b, c, d] = rects[k];
      if (k === focus) { base.push({ t: "ring", r: [a, b, c, d], rad: 3, cls: "nf lo dash", w: 0 }); continue; }
      base.push({ t: "ring", r: [a, b, c, d], rad: 3, cls: "nf lo", w: 0 });
      const p = pen();
      REGIONS[k === "panel" ? region : k](p, rects[k]);
      base.push(...flatten(p.out));
    }
    // The part: guides back to its place, its slab, and its drawing in full over it.
    const R = rects[focus], [a, b, c, d] = R;
    const guides = { t: "guides", cls: "nf dash" };
    const part = [{ t: "tile", r: R, rad: 3, h: PART, cls: "hi emk-wash", w: -PART }];
    const p = pen();
    REGIONS[focus === "panel" ? region : focus](p, R);
    part.push(...strengthen(p.out));
    // It grows from the middle of its head, so it spreads to the sides and down, and never over the chrome.
    const cu = (a + c) / 2, cv = d, near = () => 1 + NEAR * lift.x;
    /** The part's own projector: larger as it comes forward. */
    const PN = (u, v, w) => { const k = near(); return P2(cu + (u - cu) * k, cv + (v - cv) * k, w); };

    // An element for each primitive, made once, in paint order: the window, the guides, the part.
    const make = (q) => element(q, g);
    base.forEach(make);
    // The shadow: the part's outline on the window, blurred.
    const fid = "emk-shade-" + ++shades, defs = mk("defs", {}, svg);
    const fl = mk("filter", { id: fid, x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
    mk("feGaussianBlur", { stdDeviation: 5 }, fl);
    const shade = mk("path", { class: "emk-shade", filter: `url(#${fid})` }, g);
    make(guides); part.forEach(make);

    function frame() {
      C.az = rad(az.x); C.k = kk.x;
      const W3 = (u, v, w) => [u, w, v], z = lift.x + PART, k = near();
      const [sa, sb, sc, sd] = [cu + (a - cu) * k, cv + (b - cv) * k, cu + (c - cu) * k, cv + (d - cv) * k];
      fit(C, [W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, H, -SLAB), W3(W, H, -SLAB), W3(0, 0, 0), W3(W, H, 0), W3(sa, sb, z), W3(sc, sd, z), W3(sa, sd, z), W3(sc, sb, z)], 200, 160);
      P = proj(C);
      const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
      base.forEach((q) => draw(q, 0, front, P2));
      const fall = FALL * lift.x;
      shade.setAttribute("d", poly(rrect(sa + fall * 0.4, sb - fall, sc + fall * 0.4, sd - fall, 4, 3).map((q) => P2(q.u, q.v, 0))));
      const corners = [[a + 2, b + 2], [c - 2, b + 2], [c - 2, d - 2], [a + 2, d - 2]];
      guides.el.setAttribute("d", corners.map(([u, v]) => open([P2(u, v, 0), PN(u, v, lift.x)])).join(""));
      part.forEach((q) => draw(q, lift.x + PART, front, PN));
    }

    const B = register(stage, (dt) => {
      const m = [stepS(az, dt), stepS(kk, dt), stepS(lift, dt)].some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    /** Whether p is on the part, where it stands now. */
    function onPart(pt) {
      const q = [[a, b], [c, b], [c, d], [a, d]].map(([u, v]) => PN(u, v, lift.x + PART));
      let inside = false;
      for (let i = 0, j = 3; i < 4; j = i++) {
        const [xi, yi] = q[i], [xj, yj] = q[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
    function rest() { az.t = REST_AZ; kk.t = REST_K; lift.t = LIFT; read.textContent = "rest"; B.wake(); }
    bag.add(pointer(stage, {
      move: (pt) => {
        az.t = lerp(AZ, -AZ, clamp(pt[0] / 400, 0, 1));
        kk.t = lerp(K0, K1, clamp(pt[1] / 320, 0, 1));
        const on = onPart(pt);
        lift.t = LIFT + (on ? MORE : 0);
        read.textContent = on ? focus : "turn";
        B.wake();
      },
      leave: rest,
    }));
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { LIFT = v; lift.t = v; B.wake(); },
      destroy: bag.dispose,
    };
  };
}
