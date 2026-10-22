import { open, poly, proj, rad, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { chev, draw, element, pen } from "./window.js";
import { FALL, H, NEAR, PART, SHIFT_BOX, SLAB, TOP, W, inside, restCam, shiftAt } from "./layout.js";

/**
 * The shift's first window (index.qmd, From the IDE to the ADE): an
 * editor's window as one has it today, on the layout's frame (layout.js)
 * so it is the size of Emaki's beside it, seen from the front, each pane a
 * part with its name in it: an activity bar, a file browser with the
 * outline and the timeline folded under it, an editor of code, a terminal
 * in the panel under the editor, and the agent chat squeezed into a pane
 * at the right edge, one dial among the dials. A status bar runs along
 * its foot.
 *
 * Each pane is in its color, as the shift's set has it (css/theme.scss,
 * The shift): the activity bar the muted ink, the files, the outline and
 * the timeline ochre, the code slate, the terminal sage, the agent chat
 * the accent, which Emaki's window gives the middle. The pane under the
 * pointer stands forward as a part of the layout does, its shadow under it
 * and guides back to its place. The window stays still, as Emaki's does
 * beside it: the two are compared as they stand.
 */

/** The panes: where each is, and its name: its words, where they stand, their size, and whether they start there or are centered. */
const PANES = {
  activity: { r: [4, 11, 16, TOP], name: { word: "Activity Bar", u: 10, v: 51, s: 5.5, rot: -90 } },
  // The file browser's name heads it, as the explorer's title does, away from the two names folded under it.
  files: { r: [19, 31, 65, TOP], name: { word: "File Browser", u: 42, v: TOP - 7, s: 6 } },
  outline: { r: [19, 21, 65, 29], name: { word: "Outline", u: 28, v: 25, s: 5, start: true } },
  timeline: { r: [19, 11, 65, 19], name: { word: "Timeline", u: 28, v: 15, s: 5, start: true } },
  // The code's and the terminal's names stand at their right, where the lines leave room.
  code: { r: [68, 45, 177, TOP], name: { word: "Code", u: 149, v: 79, s: 6.5 } },
  terminal: { r: [68, 11, 177, 42], name: { word: "Terminal", u: 146, v: 23, s: 6.5 } },
  chat: { r: [180, 11, W - 4, TOP], name: { word: "Agent Chat", u: 208, v: 47, s: 6.5 } },
};

/** Each pane's drawing, in the layout's strokes (window.js, REGIONS). */
const DRAWN = {
  activity(p, [a, b, , d]) {
    const u = a + 6;
    [7, 16, 25, 34].forEach((o, i) => p.ring(u - 2.5, d - o - 2.5, u + 2.5, d - o + 2.5, 1, i === 0 ? "nf hi" : "nf"));
    p.dot(u + 2.6, d - 31.6, 1.1, "dot emk-fill-rose");
    [b + 14, b + 6].forEach((v) => p.ring(u - 2.5, v - 2.5, u + 2.5, v + 2.5, 2.5));
  },
  files(p, [a, , c, d]) {
    const wd = c - a;
    const rows = [[0, "o", 0.42], [1, "c", 0.36], [1, "o", 0.3], [2, "f", 0.4, 1], [2, "f", 0.34], [2, "f", 0.46], [1, "c", 0.4], [1, "f", 0.32], [0, "f", 0.38]];
    rows.forEach(([dep, kind, len, git], i) => {
      const v = d - 16 - i * 7, x = a + 4 + dep * 4;
      if (kind === "o") p.line([[x, v + 1], [x + 1.6, v - 0.8], [x + 3.2, v + 1]]);
      else if (kind === "c") chev(p, x + 0.6, v, 0);
      else p.ring(x, v - 2, x + 3, v + 2, 0.6);
      p.h(x + 5.5, x + 5.5 + len * wd, v);
      if (git) p.dot(c - 4, v, 1, "dot");
    });
  },
  outline(p, [a, b, , d]) { chev(p, a + 4, (b + d) / 2, 0); },
  timeline(p, [a, b, , d]) { chev(p, a + 4, (b + d) / 2, 0); },
  code(p, [a, b, c, d]) {
    const wd = c - a - 30;
    // The tabs, the open one ruled under in the pane's color, its close; the crumbs.
    p.h(a + 1, c - 1, d - 9.5, "nf lo");
    p.h(a + 5, a + 20, d - 5, "nf sil");
    p.line([[a + 23, d - 6], [a + 25, d - 4]]);
    p.line([[a + 23, d - 4], [a + 25, d - 6]]);
    p.h(a + 2, a + 29, d - 9.5, "nf hi");
    p.h(a + 34, a + 46, d - 5);
    p.h(a + 51, a + 61, d - 5);
    [c - 15, c - 9].forEach((u) => p.h(u, u + 3, d - 5, "nf lo"));
    p.h(a + 5, a + 12, d - 15, "nf lo"); chev(p, a + 14.5, d - 15, 0, "nf lo");
    p.h(a + 18, a + 28, d - 15, "nf lo"); chev(p, a + 30.5, d - 15, 0, "nf lo");
    p.h(a + 34, a + 46, d - 15, "nf lo");
    // The lines, numbered, and the minimap at the right.
    const rows = [[0, 0.2], [0, 0.36, 0.24], [1, 0.3, 0.12], [1, 0.2, 0.32], [2, 0.16, 0.18], [1, 0.34, 0.18], [0, 0.12, 0.3], [1, 0.26]];
    rows.forEach(([ind, l0, l1], i) => {
      const v = d - 22 - i * 6, u = a + 11 + ind * 5;
      p.h(a + 4, a + 6.5, v, "nf lo");
      p.h(u, u + l0 * wd, v);
      if (l1) p.h(u + l0 * wd + 3, u + (l0 + l1) * wd + 3, v);
    });
    p.line([[c - 10, d - 12], [c - 10, b + 3]], "nf lo");
    for (let v = d - 14, i = 0; v > b + 4; v -= 3.5, i++) p.h(c - 8, c - 8 + [3, 2, 3.5, 1.5][i % 4], v, "nf lo");
  },
  terminal(p, [a, , c, d]) {
    p.h(a + 1, c - 1, d - 9.5, "nf lo");
    [[a + 5, a + 14], [a + 18, a + 27], [a + 31, a + 43]].forEach(([u0, u1]) => p.h(u0, u1, d - 5, "nf lo"));
    p.h(a + 48, a + 60, d - 5, "nf sil");
    p.h(a + 47, a + 61, d - 9.5, "nf hi");
    [c - 15, c - 9].forEach((u) => p.h(u, u + 3, d - 5, "nf lo"));
    chev(p, a + 5, d - 16, 0, "nf hi");
    p.h(a + 10, a + 36, d - 16, "nf sil");
    p.ring(a + 38.5, d - 18.5, a + 41, d - 13.5, 0.3, "emk-fill-accent");
    p.h(a + 5, a + 40, d - 22.5);
    p.h(a + 5, a + 28, d - 27);
  },
  chat(p, [a, b, c, d]) {
    // Its head, the agent's spark and a title; a message of yours, the reply; the box to write in and send.
    spark(p, a + 6, d - 5.5, 2.2);
    [c - 15, c - 9].forEach((u) => p.h(u, u + 3, d - 5.5, "nf lo"));
    p.h(a + 1, c - 1, d - 10, "nf lo");
    p.h(a + 5, a + 28, d - 16, "nf sil");
    p.ring(a + 20, d - 30, c - 4, d - 23, 3.5);
    p.h(a + 24, c - 9, d - 26.5, "nf lo");
    spark(p, a + 6, d - 38, 1.6);
    p.h(a + 11, a + 40, d - 38);
    p.h(a + 5, a + 44, d - 44);
    p.h(a + 5, a + 34, d - 49);
    p.tile(a + 3, b + 3, c - 3, b + 20, 3, 1.2);
    p.h(a + 7, a + 30, b + 15, "nf", 1.2);
    p.dot(c - 9, b + 8, 2.6, "dot", 1.2);
  },
};
/** The chat's spark, a sparkle's asterisk of three strokes, in the shift's mauve; bright (`hi`), so it keeps its color while its pane stands forward. */
const spark = (p, u, v, r) => [0, 60, 120].forEach((g) => {
  const x = Math.cos(rad(g)) * r, y = Math.sin(rad(g)) * r;
  p.line([[u - x, v - y], [u + x, v + y]], "nf hi emk-spark");
});

/** The phone's tour: a beat on each pane, in the order they are drawn, then off. */
export const IDE_TOUR = [...Object.values(PANES).map(({ r }) => shiftAt((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)), null];

let shades = 0;

export function ide() {
  return ({ stage, svg, read }, value) => {
    const bag = disposer();
    let LIFT = value;
    const C = restCam(), P = proj(C), P2 = (u, v, w) => P(u, w, v);
    const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
    svg.setAttribute("viewBox", SHIFT_BOX.join(" "));
    stage.style.aspectRatio = SHIFT_BOX[2] + " / " + SHIFT_BOX[3];

    // The window: its slab, the chrome with its lights, the way back and on, the search and the layout's toggles; the status bar's rule and its marks.
    const g = mk("g", {}, svg);
    const base = [{ t: "tile", r: [0, 0, W, H], rad: 7, h: SLAB, cls: "", w: -SLAB }];
    const ch = pen(), cv = H - 6.5;
    ch.h(2, W - 2, TOP + 2, "nf lo");
    [7, 12.5, 18].forEach((u) => ch.dot(u, cv, 1.5, "dot m"));
    ch.line([[82, cv + 1.6], [80, cv], [82, cv - 1.6]], "nf lo");
    ch.line([[86, cv + 1.6], [88, cv], [86, cv - 1.6]], "nf lo");
    ch.ring(93, cv - 3, 160, cv + 3, 2);
    [206, 213, 220, 227].forEach((u) => ch.h(u, u + 4, cv, "nf lo"));
    ch.h(2, W - 2, 9, "nf lo");
    ch.ring(4, 3, 13, 7, 1.4, "emk-fill-accent");
    [[18, 28], [32, 38], [47, 51], [59, 63], [168, 178], [182, 189], [193, 203], [207, 215], [219, 233]].forEach(([u0, u1]) => ch.h(u0, u1, 5));
    ch.dot(43.5, 5, 1.2, "dot emk-fill-rose");
    ch.dot(55.5, 5, 1.2, "dot emk-fill-ochre");
    base.push(...ch.out);
    base.forEach((q) => { element(q, g); draw(q, 0, front, P2); });

    // Each pane in a group of its own: its shadow, its guides, its slab, its drawing and its name.
    const fid = "emk-ide-" + ++shades, defs = mk("defs", {}, svg);
    mk("feGaussianBlur", { stdDeviation: 5 }, mk("filter", { id: fid, x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs));
    const panes = {};
    for (const id in PANES) {
      const { r, name } = PANES[id], pg = mk("g", { class: "emk-p-ide-" + id }, g);
      const shade = mk("path", { class: "emk-shade", filter: `url(#${fid})` }, pg);
      const guides = mk("path", { class: "nf dash emk-guide" }, pg);
      const p = pen();
      DRAWN[id](p, r);
      p.text(name.u, name.v, name.word, name.s, "emk-name-in" + (name.start ? " emk-name-start" : ""), 0, name.rot ?? 0);
      const prims = [{ t: "tile", r, rad: 3, h: PART, cls: "hi emk-wash", w: -PART }, ...p.out];
      prims.forEach((q) => element(q, pg));
      panes[id] = { g: pg, shade, guides, prims, r, amt: spring(0, { eps: 0.002 }) };
    }

    /** A pane's projector: larger as it comes forward, from the middle of its head down, so it never covers the chrome. */
    const PN = ([u0, , u1, d], z) => {
      const cu = (u0 + u1) / 2, k = 1 + NEAR * z;
      return (u, v, w) => P2(cu + (u - cu) * k, d + (v - d) * k, w);
    };

    function frame() {
      for (const id in panes) {
        const pt = panes[id], a = pt.amt.x, z = LIFT * a, Pn = PN(pt.r, z);
        const [u0, v0, u1, v1] = pt.r, k = 1 + NEAR * z, cu = (u0 + u1) / 2, fall = FALL * z;
        pt.shade.setAttribute("d", poly(rrect(cu + (u0 - cu) * k + fall * 0.4, v1 + (v0 - v1) * k - fall, cu + (u1 - cu) * k + fall * 0.4, v1 - fall, 4, 3).map((q) => P2(q.u, q.v, 0))));
        pt.shade.style.opacity = a;
        const corners = [[u0 + 2, v0 + 2], [u1 - 2, v0 + 2], [u1 - 2, v1 - 2], [u0 + 2, v1 - 2]];
        pt.guides.setAttribute("d", corners.map(([u, v]) => open([P2(u, v, 0), Pn(u, v, z)])).join(""));
        pt.guides.style.opacity = a;
        pt.prims.forEach((q) => draw(q, z + PART, front, Pn));
      }
    }
    const B = register(stage, (dt) => {
      const m = Object.values(panes).map((pt) => stepS(pt.amt, dt)).some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    let on = null;
    /** Lights a pane, or none: it alone stands forward, over the rest. */
    function light(id) {
      on = id;
      for (const k in panes) {
        panes[k].amt.t = k === id ? 1 : 0;
        panes[k].g.classList.toggle("emk-on", k === id);
      }
      if (id) g.appendChild(panes[id].g);
      read.textContent = id ?? "rest";
      B.wake();
    }
    /**
     * The pane under a point of the box: each where it rests first, so the
     * outline and the timeline answer under the file browser's overhang,
     * then the one standing forward, over its overhang.
     */
    function under(pt) {
      const at = (k, z) => inside(pt, PN(panes[k].r, z), panes[k].r, z + PART);
      return Object.keys(panes).find((k) => at(k, 0)) ?? (on && at(on, LIFT * panes[on].amt.x) ? on : null);
    }
    bag.add(pointer(stage, {
      move: (pt) => {
        const [bx, by, bw, bh] = SHIFT_BOX, id = under([bx + (pt[0] / 400) * bw, by + (pt[1] / 320) * bh]);
        if (id !== on) light(id);
      },
      leave: () => light(null),
    }));
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { LIFT = v; B.wake(); },
      destroy: bag.dispose,
    };
  };
}
