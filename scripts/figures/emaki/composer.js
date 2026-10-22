import { Cam, clamp, fit, poly, proj, rad, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { aim, draw, element, pen } from "./window.js";

/**
 * The foot of Emaki's composer, close up (Chats: Mode, model and effort,
 * and Status line), drawn as the layout is (layout.js): the chat's face as
 * a slab, the composer on it with what is typed and its row (the plus, the
 * mode, effort and model pills, send), and the status line under it, in
 * the app's own words. One part is the figure's own and the rest is gray
 * at half strength (`emk-mute`), as at a docs page's head.
 *
 * `pills`: a pill under the pointer opens its list, which stands forward
 * of the composer over it, as the app's list opens upward from its pill:
 * the agent's choices, each mode and level in its color, a line on each,
 * the current one washed and ticked. A row under the pointer picks its
 * value, and the pill takes it, growing to fit its words; the next pill
 * makes room. Off the pill and its list, the list closes; off the figure,
 * the picks go back to the app's at rest.
 *
 * `status`: the context and the two windows, colored at the app's
 * thresholds. A part under the pointer stands forward on a plate and shows
 * a higher number in the color it takes there. The box is cut to the
 * composer's last row and the line.
 *
 * Its frame is the flat sketch's (260 across, v up): the words are set at
 * widths measured in the wordmark's face (Optima, F), the pills' at 7 high
 * and the rest at 6.5. The pointer turns the slab a little and tips it,
 * as the layout's window (window.js, SLIGHT).
 */

const W = 260, H = 152, SLAB = 4, S = 1.46;
/** The pills' middle, the status line's, and how high a pill is. */
const PV = 38, SV = 12, PH = 13, PS = 7, TS = 6.5;
/** A list: its width, a row's height, how far it stands forward, and the gap to its pill. */
const LW = 96, RH = 16, LIFT = 12, GAP = 4;
const REST_AZ = 0, REST_K = 0.05, NEAR = 0.006;
/** Widths in the wordmark's face, per unit of size (measured at 100 in Optima). */
const F = {
  Manual: 3.399, "Accept edits": 5.63, Plan: 1.97, Auto: 2.174, mode: 2.525,
  Low: 1.882, Medium: 3.732, High: 2.192, "Extra high": 4.578, Max: 1.949, effort: 2.343,
  "Fable 5.1": 4.127, "Opus 5.5": 4.162, "Sonnet 5.5": 4.869, "Haiku 5.5": 4.46,
  Context: 3.475, "5h:": 1.45, "7d:": 1.45, pct: 2.172, "(2h41m)": 3.753, "(5d1h)": 2.9, M: 0.909, Ma: 1.429,
};
const wd = (str, s) => F[str] * s;
/** The three lists as the app has them for Claude Code: key, word, color. The model is plain. */
const LISTS = {
  mode: { tail: "mode", cur: "auto", rows: [["manual", "Manual", "muted"], ["edits", "Accept edits", "mauve"], ["plan", "Plan", "slate"], ["auto", "Auto", "ochre"]] },
  effort: { tail: "effort", cur: "high", rows: [["low", "Low", "ochre"], ["medium", "Medium", "sage"], ["high", "High", "accent"], ["xhigh", "Extra high", "mauve"], ["max", "Max", "max"]] },
  model: { tail: "", cur: "opus", rows: [["fable", "Fable 5.1", ""], ["opus", "Opus 5.5", ""], ["sonnet", "Sonnet 5.5", ""], ["haiku", "Haiku 5.5", ""]] },
};
/** "mode" after a one-word mode, "effort" after any level, nothing after a model. */
const tailOf = (k, word) => (k === "mode" && word.includes(" ") ? "" : LISTS[k].tail);
const pillW = (k, word) => { const t = tailOf(k, word); return 14 + wd(word, PS) + (t ? 3 + wd(t, PS) : 0) + 7; };
/** The status line: label, where its number stands, at rest and further on, its tail. */
const PARTS = [
  { id: "context", x: 14, word: "Context", px: 39.6, rest: ["38%", "sage"], high: ["78%", "ochre"], tail: "", x1: 57 },
  { id: "five", x: 66, word: "5h:", px: 78.4, rest: ["34%", "slate"], high: ["93%", "rose"], tail: "(2h41m)", x1: 123 },
  { id: "seven", x: 132.2, word: "7d:", px: 144.6, rest: ["12%", "slate"], high: ["74%", "mauve"], tail: "(5d1h)", x1: 184 },
];
let shades = 0;

/** A value in its color: Max in three through its letters, as Claude Code's rainbow, still. */
function value(p, u, v, word, tint, s, w = 0) {
  if (tint === "max") {
    p.text(u, v, "M", s, "emk-text emk-v emk-v-rose", w);
    p.text(u + wd("M", s), v, "a", s, "emk-text emk-v emk-v-ochre", w);
    p.text(u + wd("Ma", s), v, "x", s, "emk-text emk-v emk-v-sage", w);
  } else p.text(u, v, word, s, "emk-text emk-v" + (tint ? " emk-v-" + tint : ""), w);
}
/** A pill's icon at (u, v): the mode's shield, the effort's gauge, the model's cube. */
function icon(p, k, u, v) {
  if (k === "mode") p.line([[u - 2.75, v + 2.5], [u, v + 3.9], [u + 2.75, v + 2.5], [u + 2.75, v - 0.5], [u, v - 3.1], [u - 2.75, v - 0.5], [u - 2.75, v + 2.5]], "nf emk-ico", 2.4);
  else if (k === "effort") {
    p.ring(u - 3, v - 3, u + 3, v + 3, 3, "nf emk-ico", 2.4);
    p.line([[u, v], [u + 1.6, v + 1.6]], "nf emk-ico", 2.4);
  } else {
    p.line([[u, v + 3.3], [u + 2.9, v + 1.65], [u + 2.9, v - 1.65], [u, v - 3.3], [u - 2.9, v - 1.65], [u - 2.9, v + 1.65], [u, v + 3.3]], "nf emk-ico", 2.4);
    p.line([[u - 2.9, v + 1.65], [u, v], [u + 2.9, v + 1.65]], "nf emk-ico", 2.4);
    p.line([[u, v], [u, v - 3.3]], "nf emk-ico", 2.4);
  }
}

export function composer({ focus = "pills" } = {}) {
  return ({ stage, svg, read }) => {
    const bag = disposer();
    const C = Cam(REST_AZ, REST_K, S);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);
    const az = spring(REST_AZ, { k: 60, c: 14, eps: 0.01 }), kk = spring(REST_K, { k: 60, c: 14, eps: 0.0005 });
    const g = mk("g", {}, svg);
    const defs = mk("defs", {}, svg), fid = "emk-cmp-" + ++shades;
    mk("feGaussianBlur", { stdDeviation: 5 }, mk("filter", { id: fid, x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs));
    /** A group of prims drawn with one projector; `off` is its height over the face. */
    const groups = [];
    const group = (cls, parent = g) => { const o = { g: mk("g", cls ? { class: cls } : {}, parent), prims: [], off: 0, P: null }; groups.push(o); return o; };
    const put = (o, p) => { p.out.forEach((q) => { element(q, o.g); o.prims.push(q); }); return p.out; };

    // The chat's face, and the end of the agent's reply over the composer.
    const face = group("");
    const fp = pen();
    fp.tile(0, 0, W, H, 8, SLAB, "", -SLAB);
    put(face, fp);
    const reply = group("emk-mute");
    const rp = pen();
    [[132, 176], [121, 138], [110, 160], [99, 96]].forEach(([v, l]) => rp.h(14, 14 + l, v));
    put(reply, rp);

    // The composer: its box, what is typed, the plus, and send.
    const comp = group("emk-p-chats" + (focus === "pills" ? "" : " emk-mute"));
    const cp = pen();
    cp.tile(10, 24, 250, 78, 9, 1.4);
    cp.h(20, 170, 65, "nf sil", 1.4);
    cp.h(20, 116, 55, "nf", 1.4);
    cp.line([[22, PV - 3], [22, PV + 3]], "nf sil", 1.4);
    cp.h(19, 25, PV, "nf sil", 1.4);
    cp.line([[238, PV - 3.5], [238, PV + 3.5]], "nf emk-on-hi", 1.4);
    cp.line([[234.5, PV], [238, PV + 3.5], [241.5, PV]], "nf emk-on-hi", 1.4);
    put(comp, cp);
    // send: a true circle, which a dot's twelve sides are not at this size
    const send = mk("circle", { class: "emk-send" }, comp.g);
    comp.g.insertBefore(send, comp.prims[comp.prims.length - 2].el);

    // The pills, each with every value it can show; only the picked one is.
    const picks = {}, pills = {};
    for (const k in LISTS) {
      picks[k] = LISTS[k].cur;
      const o = group("emk-pill-g");
      const p = pen();
      p.tile(0, PV - PH / 2, 1, PV + PH / 2, PH / 2, 1, "emk-pill", 1.4);
      icon(p, k, 0, PV);
      const face = put(o, p);
      const labels = {};
      for (const [key, word, tint] of LISTS[k].rows) {
        const lp = pen();
        value(lp, 0, PV, word, tint, PS, 2.4);
        const t = tailOf(k, word);
        if (t) lp.text(wd(word, PS) + 3, PV, t, PS, "emk-text emk-tail", 2.4);
        labels[key] = { prims: put(o, lp), offs: lp.out.map((q) => q.u) };
      }
      pills[k] = { o, tile: face[0], icon: face.slice(1), iconU: face.slice(1).map((q) => q.t === "line" ? q.pts.map((pt) => pt[0]) : [q.r[0], q.r[2]]), labels, w: spring(pillW(k, LISTS[k].rows.find((r) => r[0] === picks[k])[1]), { k: 160, c: 22, eps: 0.02 }) };
      if (focus !== "pills") o.g.classList.add("emk-mute");
    }
    /** Where each pill stands now: the mode from the plus, the effort after it, the model against send. */
    const place = () => {
      const mw = pills.mode.w.x, ew = pills.effort.w.x, dw = pills.model.w.x;
      return { mode: [32, 32 + mw], effort: [32 + mw + 5, 32 + mw + 5 + ew], model: [225 - dw, 225] };
    };

    // The lists: a card each, standing forward over its pill, its rows.
    const lists = {};
    if (focus === "pills") {
      for (const k in LISTS) {
        const rows = LISTS[k].rows, lh = rows.length * RH + 6;
        const o = group("emk-list");
        o.shade = mk("path", { class: "emk-shade", filter: `url(#${fid})` }, o.g);
        const p = pen();
        p.tile(0, 0, LW, lh, 6, 1.2, "emk-card");
        const rowsAt = rows.map(([key, word, tint], i) => {
          const top = lh - 3 - i * RH;
          return { key, word, tint, top };
        });
        const card = put(o, p);
        const parts = rowsAt.map(({ key, word, tint, top }, i) => {
          const rp2 = pen();
          rp2.ring(3, top - RH, LW - 3, top, 4, "emk-cur", 1.2);
          value(rp2, 9, top - 5.5, word, tint, TS, 1.2);
          rp2.line([[9 + wd(word, TS) + 3.5, top - 5.7], [9 + wd(word, TS) + 5.1, top - 7.3], [9 + wd(word, TS) + 8.3, top - 3.7]], "nf emk-tick", 1.2);
          rp2.h(9, 9 + [52, 40, 60, 46, 34][i % 5], top - 12, "nf lo", 1.2);
          const prims = put(o, rp2);
          return { key, top, cur: prims[0], tick: prims[prims.length - 2] };
        });
        lists[k] = { o, card, rows: parts, lh, amt: spring(0, { k: 140, c: 20, eps: 0.002 }) };
      }
    }

    // The status line: each part's words, its number at rest and further on, and the plate it stands on.
    const stat = {};
    const sline = group("emk-p-chats" + (focus === "status" ? "" : " emk-mute"));
    const sp = pen();
    sp.line([[60, SV - 4], [60, SV + 4]], "nf lo");
    sp.line([[126, SV - 4], [126, SV + 4]], "nf lo");
    put(sline, sp);
    for (const part of PARTS) {
      const o = group("", sline.g);
      const p = pen();
      p.tile(part.x - 4, SV - 7, part.x1 + 1, SV + 7, 4, 1, "emk-plate");
      p.text(part.x, SV, part.word, TS, "emk-text", 1);
      if (part.tail) p.text(part.px + wd("pct", TS) + 3.5, SV, part.tail, TS, "emk-text", 1);
      const prims = put(o, p);
      const lo = pen(), hi = pen();
      value(lo, part.px, SV, part.rest[0], part.rest[1], TS, 1);
      value(hi, part.px, SV, part.high[0], part.high[1], TS, 1);
      stat[part.id] = { o, part, plate: prims[0], lo: put(o, lo), hi: put(o, hi), amt: spring(0, { k: 140, c: 20, eps: 0.002 }) };
    }

    let open = null, lit = null;

    function frame() {
      C.az = rad(az.x); C.k = kk.x;
      const W3 = (u, v, w) => [u, w, v];
      fit(C, [W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, H, -SLAB), W3(W, H, -SLAB), W3(0, 0, 0), W3(W, H, 0)], 200, 160);
      P = proj(C);
      const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
      for (const o of [face, reply, comp]) o.prims.forEach((q) => draw(q, 0, front, P2));
      {
        const [x, y] = P2(238, PV, 1.4), [x1, y1] = P2(239, PV, 1.4);
        send.setAttribute("cx", x.toFixed(2)); send.setAttribute("cy", y.toFixed(2)); send.setAttribute("r", (7 * Math.hypot(x1 - x, y1 - y)).toFixed(2));
      }

      // The pills, at their widths now, each showing its pick.
      const at = place();
      for (const k in pills) {
        const pl = pills[k], [u0, u1] = at[k];
        pl.tile.r = [u0, PV - PH / 2, u1, PV + PH / 2];
        draw(pl.tile, 0, front, P2);
        pl.icon.forEach((q, i) => {
          const d = u0 + 8;
          if (q.t === "line") q.pts = q.pts.map((pt, j) => [pl.iconU[i][j] + d, pt[1]]);
          else q.r = [pl.iconU[i][0] + d, q.r[1], pl.iconU[i][1] + d, q.r[3]];
          draw(q, 0, front, P2);
        });
        for (const key in pl.labels) {
          const lb = pl.labels[key], on = key === picks[k];
          const lu = k === "model" ? u1 - 7 - wd(LISTS.model.rows.find((r) => r[0] === key)[1], PS) : u0 + 14;
          lb.prims.forEach((q, i) => {
            q.el.style.display = on ? "" : "none";
            if (on) { q.u = lu + lb.offs[i]; draw(q, 0, front, P2); }
          });
        }
        pl.o.g.classList.toggle("emk-open", open === k);
      }

      // The lists: over their pills, coming forward as they open.
      for (const k in lists) {
        const L = lists[k], a = L.amt.x, [u0, u1] = at[k];
        L.o.g.style.display = a > 0.002 ? "" : "none";
        if (a <= 0.002) continue;
        L.o.g.style.opacity = clamp(a * 1.4, 0, 1);
        const lu = k === "model" ? u1 - LW : u0, lv = PV + PH / 2 + GAP, z = LIFT * a, kz = 1 + NEAR * z, cu = lu + LW / 2;
        const Pn = (u, v, w) => P2(cu + (u + lu - cu) * kz, lv + v * kz, w);
        L.o.shade.setAttribute("d", poly(rrect(lu + z * 0.1, lv - z * 0.22, lu + LW + z * 0.1, lv + L.lh - z * 0.22, 6, 3).map((q) => P2(q.u, q.v, 0))));
        L.o.shade.style.opacity = a;
        for (const r of L.rows) {
          const on = r.key === picks[k];
          r.cur.el.style.opacity = on ? 1 : 0;
          r.tick.el.style.opacity = on ? 1 : 0;
        }
        L.o.prims.forEach((q) => draw(q, z, front, Pn));
      }

      // The status line: a part under the pointer forward on its plate, its number further on.
      sline.prims.forEach((q) => draw(q, 0, front, P2));
      for (const id in stat) {
        const st = stat[id], a = st.amt.x, z = 5 * a;
        st.plate.el.parentNode.style.opacity = a;
        st.o.prims.forEach((q) => draw(q, z, front, P2));
        st.lo.forEach((q) => { q.el.style.display = lit === id ? "none" : ""; });
        st.hi.forEach((q) => { q.el.style.display = lit === id ? "" : "none"; });
      }
    }

    const B = register(stage, (dt) => {
      const m = [stepS(az, dt), stepS(kk, dt), ...Object.values(pills).map((p) => stepS(p.w, dt)), ...Object.values(lists).map((l) => stepS(l.amt, dt)), ...Object.values(stat).map((s) => stepS(s.amt, dt))].some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    // The box: the whole foot for the pills, the last row and the line for the status.
    const cut = focus === "status" ? 54 : H;
    let vb;
    {
      frame();
      const pts = [[0, 0], [W, 0], [0, cut], [W, cut]].map(([u, v]) => P2(u, v, 0));
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const x0 = Math.min(...xs) - 8, x1 = Math.max(...xs) + 8, y0 = Math.min(...ys) - (focus === "status" ? 0 : 8), y1 = Math.max(...ys) + 12;
      svg.setAttribute("viewBox", [x0, y0, x1 - x0, y1 - y0].map((n) => n.toFixed(1)).join(" "));
      svg.style.overflow = "hidden";
      stage.style.aspectRatio = `${(x1 - x0).toFixed(1)} / ${(y1 - y0).toFixed(1)}`;
      vb = [x0, y0, x1 - x0, y1 - y0];
    }

    /** Whether a point of the box is inside a rectangle of the face at height w. */
    const inside = (pt, Pq, [u0, v0, u1, v1], w) => {
      const q = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => Pq(u, v, w));
      let hit = false;
      for (let i = 0, j = 3; i < 4; j = i++) {
        const [xi, yi] = q[i], [xj, yj] = q[j];
        if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const listP = (k) => {
      const at = place()[k], lu = k === "model" ? at[1] - LW : at[0], lv = PV + PH / 2 + GAP;
      return [lu, lv];
    };
    function move(pt) {
      if (focus === "pills") {
        const at = place();
        const pill = Object.keys(pills).find((k) => inside(pt, P2, [at[k][0], PV - PH / 2, at[k][1], PV + PH / 2], 1.4));
        if (pill) open = pill;
        else if (open) {
          const L = lists[open], [lu, lv] = listP(open), z = LIFT * L.amt.x, kz = 1 + NEAR * z, cu = lu + LW / 2;
          const Pn = (u, v, w) => P2(cu + (u - cu) * kz, lv + (v - lv) * kz, w);
          // the list, and the gap between it and its pill, keep it open
          if (inside(pt, Pn, [lu, lv, lu + LW, lv + L.lh], z + 1.2)) {
            const row = L.rows.find((r) => inside(pt, Pn, [lu + 3, lv + r.top - RH, lu + LW - 3, lv + r.top], z + 1.2));
            if (row && picks[open] !== row.key) {
              picks[open] = row.key;
              pills[open].w.t = pillW(open, LISTS[open].rows.find((r) => r[0] === row.key)[1]);
            }
          } else if (!inside(pt, P2, [lu, PV, lu + LW, lv], 1.4)) open = null;
        }
        for (const k in lists) lists[k].amt.t = k === open ? 1 : 0;
        read.textContent = open ? `${open}: ${picks[open]}` : "rest";
      } else {
        const hit = PARTS.find((p) => inside(pt, P2, [p.x - 4, SV - 7, p.x1 + 1, SV + 7], 1));
        lit = hit ? hit.id : null;
        for (const id in stat) stat[id].amt.t = id === lit ? 1 : 0;
        read.textContent = lit ?? "rest";
      }
    }
    function rest() {
      az.t = REST_AZ; kk.t = REST_K;
      open = null; lit = null;
      for (const k in LISTS) { picks[k] = LISTS[k].cur; pills[k].w.t = pillW(k, LISTS[k].rows.find((r) => r[0] === picks[k])[1]); }
      for (const k in lists) lists[k].amt.t = 0;
      for (const id in stat) stat[id].amt.t = 0;
      read.textContent = "rest";
      B.wake();
    }
    bag.add(pointer(stage, {
      move: (p) => {
        const x = vb[0] + (p[0] / 400) * vb[2], y = vb[1] + (p[1] / 320) * vb[3];
        aim(az, kk, x, y, vb);
        move([x, y]);
        B.wake();
      },
      leave: rest,
    }));
    bag.add(() => { svg.replaceChildren(); stage.style.aspectRatio = ""; });
    return { set: () => B.wake(), destroy: bag.dispose };
  };
}
