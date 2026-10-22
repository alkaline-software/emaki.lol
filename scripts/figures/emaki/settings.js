import { Cam, fit, lerp, proj, rad } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { aim, draw, element, pen } from "./window.js";
import { inside } from "./layout.js";
import { icon, value } from "./composer.js";

/**
 * One section of Emaki's settings window, on its own (Settings): the
 * section's groups as the app lays them out (`workbench/settings.rs`), a
 * card of rows each, a name at the left and its control at the right, on
 * the pane's ground, with no window round it. Seven sections are drawn,
 * Appearance to Files, one figure each; Updates and About are not.
 *
 * A click or a tap works a control as the app's does, and nothing else
 * changes: a switch's knob slides and its track fills with the accent, a
 * choice's plate slides to the segment, an accent's ring moves to its
 * disc and its name under Accent, a face's tile is chosen, a tick comes
 * and goes, a size steps a point (under Custom only, as the app's), a
 * dropdown turns to its next value, and a button flashes. A control
 * under the pointer darkens; the choices that hang on a switch (the
 * spelling's languages, the formatters) dim while it is off and take no
 * click. Leaving keeps what was set. The pointer turns the pane a little,
 * as every figure on the docs pages (window.js, SLIGHT).
 *
 * Its frame is the composer's (260 across there, 280 here; v up), laid
 * out from the top down: a row at y is drawn at v = -y.
 */

const W = 280, SLAB = 4, S = 1.4, REST_AZ = 0, REST_K = 0.05;
/** The card's edges, a row's name's start, the controls' right edge and the widest control's start. */
const M = 12, L = 20, R = W - 20, C0 = 107;
/** A row's height, one with a line under its name, and the sizes of a name, a group's head, a line and a choice. */
const RH = 22, RH2 = 28, TS = 6.2, HS = 5.6, SS = 5.2, CS = 5.6;

const box = (u0, y0, u1, y1) => [u0, -y1, u1, -y0];
const ring = (p, u0, y0, u1, y1, r, cls, w = 1.2) => p.ring(u0, -y1, u1, -y0, r, cls, w);
const text = (p, u, y, str, s, cls, w = 1.4) => p.text(u, -y, str, s, cls, w);
const hl = (p, u0, u1, y, cls = "nf lo", w = 0.8) => p.h(u0, u1, -y, cls, w);
const line = (p, pts, cls, w = 1.4) => p.line(pts.map(([u, y]) => [u, -y]), cls, w);
/** Claude's mark, three strokes about (u, y), as the agent's terminal draws it; Codex's, a ring in its color. */
const asterisk = (p, u, y, r, w) => [0, 60, 120].forEach((a) => { const du = Math.cos(rad(a)) * r, dy = Math.sin(rad(a)) * r; line(p, [[u - du, y - dy], [u + du, y + dy]], "nf emk-claude", w); });
const codexMark = (p, u, y, r, w) => { ring(p, u - r, y - r, u + r, y + r, r, "nf emk-codex", w); line(p, [[u - r * 0.45, y], [u + r * 0.45, y]], "nf emk-codex", w); };

/**
 * A control: its own group, its prims, the springs that move it, and the
 * places a click finds it. `frame` puts its moving parts where its springs
 * are; `live` says whether it takes a click now.
 */
function control(parent, build) {
  const g = mk("g", { class: "emk-ctl" }, parent);
  const c = { g, prims: [], springs: [], hits: [], frame: () => {}, live: () => true };
  const add = (p) => p.out.map((q) => { element(q, g); c.prims.push(q); return q; });
  build(c, add);
  return c;
}
const press = () => spring(0, { k: 90, c: 16, eps: 0.004 });
const flash = (sp) => { sp.x = 1; sp.t = 0; };

/** A switch at the row's right: the track fills with the accent and the knob slides. */
function toggle(parent, yc, on, set) {
  return control(parent, (c, add) => {
    const p = pen();
    ring(p, R - 17, yc - 4.8, R, yc + 4.8, 4.8, "emk-track");
    ring(p, R - 17, yc - 4.8, R, yc + 4.8, 4.8, "emk-fill-accent");
    p.dot(0, -yc, 3.3, "dot emk-knob", 1.5);
    const [, fill, knob] = add(p);
    const amt = spring(on ? 1 : 0, { k: 220, c: 26, eps: 0.002 });
    c.springs.push(amt);
    c.frame = () => { fill.el.style.opacity = amt.x; knob.u = lerp(R - 12.2, R - 4.8, amt.x); };
    c.hits.push({ r: box(R - 19, yc - 6.5, R + 1, yc + 6.5), act: () => { on = !on; amt.t = on ? 1 : 0; set?.(on); return on ? "on" : "off"; } });
  });
}

/** A choice of a few, its plate sliding to the one picked; `sub` names it under the row's name when it changes. */
function choice(parent, u0, u1, yc, words, idx, set, h = 12) {
  return control(parent, (c, add) => {
    const p = pen(), n = words.length, sw = (u1 - u0 - 2) / n;
    ring(p, u0, yc - h / 2, u1, yc + h / 2, 3.2, "emk-track");
    ring(p, 0, 0, 1, 1, 2.6, "emk-segplate", 1.3);
    words.forEach((word, i) => text(p, u0 + 1 + (i + 0.5) * sw, yc, word, CS, "emk-text emk-mid", 1.6));
    const [, plate, ...labels] = add(p);
    const pos = spring(idx, { k: 200, c: 24, eps: 0.002 });
    c.springs.push(pos);
    c.frame = () => {
      plate.r = box(u0 + 1 + pos.x * sw, yc - h / 2 + 1, u0 + 1 + (pos.x + 1) * sw, yc + h / 2 - 1);
      labels.forEach((q, i) => q.el.classList.toggle("emk-lit", i === idx));
    };
    words.forEach((word, i) => c.hits.push({ r: box(u0 + 1 + i * sw, yc - h / 2, u0 + 1 + (i + 1) * sw, yc + h / 2), act: () => { idx = i; pos.t = i; set?.(i); return word; } }));
  });
}

/** A button, a pill with its word: it flashes when pressed. */
function button(parent, u0, u1, yc, word, cls = "") {
  return control(parent, (c, add) => {
    const p = pen();
    ring(p, u0, yc - 6, u1, yc + 6, 6, "emk-press");
    ring(p, u0, yc - 6, u1, yc + 6, 6, "nf emk-btnline" + (cls ? " " + cls : ""));
    text(p, (u0 + u1) / 2, yc, word, CS, "emk-text emk-lit emk-mid" + (cls ? " " + cls + "-t" : ""), 1.6);
    const [wash] = add(p);
    const fl = press();
    c.springs.push(fl);
    c.frame = () => { wash.el.style.opacity = fl.x; };
    c.hits.push({ r: box(u0, yc - 6, u1, yc + 6), act: () => { flash(fl); return word; } });
  });
}

/** A tick before a name: the box fills with the accent and the tick comes. */
function tick(parent, u, yc, on, live) {
  return control(parent, (c, add) => {
    const p = pen();
    ring(p, u - 3.6, yc - 3.6, u + 3.6, yc + 3.6, 1.4, "nf emk-boxline");
    ring(p, u - 3.6, yc - 3.6, u + 3.6, yc + 3.6, 1.4, "emk-fill-accent");
    line(p, [[u - 2, yc + 0.1], [u - 0.6, yc + 1.6], [u + 2.1, yc - 1.5]], "nf emk-on-hi", 1.6);
    const [, fill, mark] = add(p);
    const amt = spring(on ? 1 : 0, { k: 220, c: 26, eps: 0.002 });
    c.springs.push(amt);
    c.live = live;
    c.frame = () => { fill.el.style.opacity = amt.x; mark.el.style.opacity = amt.x; };
    c.hits.push({ r: box(u - 5, yc - 5, u + 5, yc + 5), act: () => { on = !on; amt.t = on ? 1 : 0; return on ? "ticked" : "unticked"; } });
  });
}

/** A size: a step down, the number on its plate with "pt" after it, a step up; the steps only under Custom. */
function stepper(parent, yc, get, set, live) {
  return control(parent, (c, add) => {
    const p = pen(), u0 = R - 66;
    ring(p, u0, yc - 6, R, yc + 6, 3.2, "emk-track");
    ring(p, u0 + 2, yc - 4.6, u0 + 14, yc + 4.6, 2, "emk-press");
    ring(p, R - 14, yc - 4.6, R - 2, yc + 4.6, 2, "emk-press");
    ring(p, u0 + 21, yc - 4.6, u0 + 39, yc + 4.6, 2, "emk-segplate", 1.3);
    hl(p, u0 + 5.5, u0 + 10.5, yc, "nf emk-step", 1.6);
    hl(p, R - 10.5, R - 5.5, yc, "nf emk-step", 1.6);
    line(p, [[R - 8, yc - 2.5], [R - 8, yc + 2.5]], "nf emk-step", 1.6);
    text(p, u0 + 30, yc, String(get()), CS, "emk-text emk-lit emk-mid", 1.8);
    text(p, u0 + 42, yc, "pt", SS, "emk-text", 1.6);
    const [, down, up, plate, s0, s1, s2, num] = add(p);
    const fd = press(), fu = press();
    c.springs.push(fd, fu);
    c.frame = () => {
      down.el.style.opacity = fd.x; up.el.style.opacity = fu.x;
      const on = live();
      plate.el.style.opacity = on ? 1 : 0;
      [s0, s1, s2].forEach((q) => q.el.classList.toggle("emk-quiet", !on));
      if (num.el.textContent !== String(get())) num.el.textContent = String(get());
    };
    const step = (d, fl) => () => { if (!live()) return null; set(get() + d); flash(fl); return get() + " pt"; };
    c.hits.push({ r: box(u0, yc - 6, u0 + 16, yc + 6), act: step(-1, fd) }, { r: box(R - 16, yc - 6, R, yc + 6), act: step(1, fu) });
  });
}

/** A dropdown the width of a control: its icon, its value, the chevrons; a click turns it to the next value, which slides in. */
function dropdown(parent, yc, kind, lists, which, start = 0) {
  return control(parent, (c, add) => {
    const p = pen();
    ring(p, C0, yc - 6, R, yc + 6, 3.2, "emk-field");
    icon(p, kind, C0 + 8, -yc);
    line(p, [[R - 9, yc - 1.2], [R - 7, yc - 3], [R - 5, yc - 1.2]], "nf emk-ico", 1.6);
    line(p, [[R - 9, yc + 1.2], [R - 7, yc + 3], [R - 5, yc + 1.2]], "nf emk-ico", 1.6);
    add(p);
    // every list's every value, each shown only while it is the one
    const vals = {};
    for (const k in lists) vals[k] = lists[k].map(([word, tint]) => { const vp = pen(); value(vp, C0 + 15, -yc, word, tint, CS, 1.6); return add(vp); });
    const idx = Object.fromEntries(Object.keys(lists).map((k) => [k, k === which() ? start : 0]));
    const slide = spring(0, { k: 160, c: 22, eps: 0.004 });
    c.springs.push(slide);
    c.frame = () => {
      const k = which();
      for (const kk in vals) vals[kk].forEach((qs, i) => qs.forEach((q) => {
        const on = kk === k && i === idx[kk];
        q.el.style.display = on ? "" : "none";
        if (on) { q.v = -yc + slide.x * 3; q.el.style.opacity = 1 - slide.x; }
      }));
    };
    c.hits.push({ r: box(C0, yc - 6, R, yc + 6), act: () => { const k = which(); idx[k] = (idx[k] + 1) % lists[k].length; slide.x = 1; slide.t = 0; return lists[k][idx[k]][0]; } });
  });
}

/** A face's tile: its sample over its name; the one chosen washed, its edge in the accent. */
function faceTile(parent, u0, y0, u1, y1, sample, cls, name, i, pick) {
  return control(parent, (c, add) => {
    const p = pen();
    ring(p, u0, y0, u1, y1, 3, "emk-tilewash");
    ring(p, u0, y0, u1, y1, 3, "nf emk-tileline");
    ring(p, u0, y0, u1, y1, 3, "nf emk-acc", 1.3);
    text(p, u0 + 5, y0 + 10, sample, cls === "emk-aa-mono" ? 6.2 : 9, "emk-text " + cls, 1.6);
    text(p, u0 + 5, y1 - 6, name, SS, "emk-text", 1.6);
    const [wash, , edge, , label] = add(p);
    const amt = spring(pick.at === i ? 1 : 0, { k: 200, c: 24, eps: 0.002 });
    c.springs.push(amt);
    c.frame = () => {
      amt.t = pick.at === i ? 1 : 0;
      wash.el.style.opacity = amt.x; edge.el.style.opacity = amt.x;
      label.el.classList.toggle("emk-lit", pick.at === i);
    };
    c.hits.push({ r: box(u0, y0, u1, y1), act: () => { pick.at = i; return name; } });
  });
}

/**
 * The page a section draws on: its groups' heads and cards down the pane,
 * the rules between a card's rows, and the controls in them.
 */
function pane() {
  let y = 8;
  const base = pen(), rows = [];
  const api = {
    get y() { return y; },
    gap: (n) => { y += n; },
    head: (word) => { text(base, L - 1.5, y + 5, word, HS, "emk-text emk-head", 0.8); y += 12; },
    /** A card of rows: each `[height, name, line or null, (yc) => control(s)]`. */
    card: (list, pad = 0) => {
      const top = y;
      // the card under its rows, so its ground never covers their words
      ring(base, M, top, W - M, top + 2 * pad + list.reduce((n, r) => n + r[0], 0), 5, "nf emk-cardg", 0.6);
      let at = y + pad;
      list.forEach(([h, name, sub, make], i) => {
        const yc = at + h / 2;
        if (i) hl(base, M, W - M, at);
        if (name && sub) { text(base, L, yc - 3.4, name, TS, "emk-text emk-row", 1); if (typeof sub === "string") text(base, L, yc + 4.4, sub, SS, "emk-text", 1); }
        else if (name) text(base, L, yc, name, TS, "emk-text emk-row", 1);
        if (make) rows.push({ yc, make, sub });
        at += h;
      });
      y = at + pad + 10;
    },
    base, rows,
  };
  return api;
}

/** Text Size's presets, as the app's (`TextSizes`): conversation, composer, file preview, file editor, terminal. */
const PRESETS = [[15, 13, 14, 12, 12], [16, 14, 15, 13, 13], [18, 16, 17, 15, 15]];
const PLACES = ["Conversation", "Composer", "File preview", "File editor", "Terminal"];
const ACCENTS = [["Periwinkle", "accent"], ["Orchid", "mauve"], ["Rose", "rose"], ["Amber", "ochre"], ["Moss", "sage"], ["Jade", "teal"], ["Teal", "slate"]];
/** New sessions: each agent's lists, the first the value shown at rest. The model and the effort start at the agent's default. */
const AGENT_LISTS = {
  mode: { claude: [["Auto", "ochre"], ["Manual", "muted"], ["Accept edits", "mauve"], ["Plan", "slate"]], codex: [["Default", ""], ["Read Only", ""], ["Plan", ""], ["Full Access", ""]] },
  model: { claude: [["Default", ""], ["Fable 5.1", ""], ["Opus 5.5", ""], ["Sonnet 5.5", ""], ["Haiku 5.5", ""]], codex: [["Default", ""]] },
  effort: { claude: [["Default", ""], ["Low", "ochre"], ["Medium", "sage"], ["High", "accent"], ["Extra high", "mauve"], ["Max", "max"]], codex: [["Default", ""]] },
};
const FORMATTERS = [
  [["R", "Air"], ["Python", "Ruff"], ["Rust", "rustfmt"], ["Go", "gofmt"], ["C and C++", "clang-format"]],
  [["TypeScript", "dprint"], ["JavaScript", "dprint"], ["JSON", "dprint"], ["Markdown", "dprint"], ["TOML", "dprint"]],
];

/** Each section's groups, laid out on `pn`, its controls made into `g`. */
const SECTIONS = {
  appearance(pn, g) {
    let accent = 0;
    pn.head("You");
    pn.card([
      [RH, "Avatar", null, (yc) => {
        const p = pen();
        p.dot(R - 95.5, -yc, 6.4, "dot emk-avatar", 1.4);
        p.dot(R - 95.5, -(yc - 1.8), 2.1, "dot emk-fill-plate", 1.6);
        ring(p, R - 99.7, yc + 1.4, R - 91.3, yc + 5.8, 3, "emk-fill-plate", 1.6);
        p.out.forEach((q) => { element(q, g); pn.base.out.push(q); });
        return [button(g, R - 85, R - 42, yc, "Choose…"), button(g, R - 38, R, yc, "Remove", "emk-danger")];
      }],
      [RH, "Name", null, (yc) => { const p = pen(); ring(p, C0, yc - 6, R, yc + 6, 3.2, "emk-field"); hl(p, C0 + 7, C0 + 30, yc, "nf emk-ico", 1.6); p.out.forEach((q) => { element(q, g); pn.base.out.push(q); }); return []; }],
    ]);
    pn.gap(4);
    pn.head("Window");
    pn.card([
      [RH, "Theme", null, (yc) => choice(g, C0, R, yc, ["System", "Light", "Dark"], 0)],
      [RH2, "Accent", true, (yc) => control(g, (c, add) => {
        const p = pen(), gap = (R - C0 - 11) / 6;
        ACCENTS.forEach(([, tint], i) => p.dot(C0 + 5.5 + i * gap, -yc, 5.4, "dot emk-fill-" + tint, 1.4));
        ACCENTS.forEach(() => ring(p, 0, 0, 1, 1, 1, "nf emk-swring", 1.6));
        ACCENTS.forEach(([name]) => text(p, L, yc + 4.4, name, SS, "emk-text", 1));
        const prims = add(p), rings = prims.slice(7, 14), names = prims.slice(14);
        const amts = ACCENTS.map((_, i) => spring(i === accent ? 1 : 0, { k: 200, c: 22, eps: 0.002 }));
        c.springs.push(...amts);
        c.frame = () => ACCENTS.forEach((_, i) => {
          const u = C0 + 5.5 + i * gap, r = 3.4 * amts[i].x;
          rings[i].r = box(u - r, yc - r, u + r, yc + r); rings[i].rad = r;
          rings[i].el.style.display = amts[i].x > 0.03 ? "" : "none";
          names[i].el.style.opacity = amts[i].x;
        });
        ACCENTS.forEach(([name], i) => c.hits.push({ r: box(C0 + i * gap, yc - 6.5, C0 + 11 + i * gap, yc + 6.5), act: () => { accent = i; amts.forEach((a, j) => { a.t = j === i ? 1 : 0; }); return name; } }));
      })],
    ]);
  },
  fonts(pn, g) {
    const chat = { at: 0 }, mono = { at: 0 }, tw = (W - 2 * M - 14 - 12) / 4;
    const tiles = (y0, faces, cls, sample, pick, from = 0) => faces.map((name, i) => faceTile(g, M + 7 + i * (tw + 4), y0, M + 7 + i * (tw + 4) + tw, y0 + 29, sample, cls, name, from + i, pick));
    pn.head("Chat font");
    const top = pn.y;
    pn.card([[93, null, null, null]]);
    text(pn.base, L, top + 8, "Serif", SS, "emk-text", 1);
    text(pn.base, L, top + 53, "Sans serif", SS, "emk-text", 1);
    pn.gap(4);
    pn.head("Monospace font");
    const mtop = pn.y;
    pn.card([[43, null, null, null]]);
    pn.rows.push({ make: () => [
      ...tiles(top + 14, ["Source Serif", "Newsreader", "Literata", "Lora"], "emk-aa", "Ag", chat),
      ...tiles(top + 59, ["Inter", "IBM Plex Sans", "Source Sans", "Geist"], "emk-aa-sans", "Ag", chat, 4),
      ...tiles(mtop + 7, ["JetBrains Mono", "Monaco", "Maple Mono", "Geist Mono"], "emk-aa-mono", "fn(0) -> 1", mono),
    ] });
  },
  text(pn, g) {
    let preset = 3;
    const custom = [...PRESETS[1]];
    pn.card([[RH, "Size", null, (yc) => choice(g, C0, R, yc, ["Small", "Medium", "Large", "Custom"], preset, (i) => { preset = i; })]]);
    pn.gap(-2);
    pn.card(PLACES.map((name, i) => [RH, name, null, (yc) => stepper(g, yc, () => (preset === 3 ? custom[i] : PRESETS[preset][i]), (n) => { custom[i] = Math.min(32, Math.max(9, n)); }, () => preset === 3)]));
  },
  composer(pn, g) {
    let enter = false, check = true;
    pn.card([
      [RH2, "Send with", true, (yc) => {
        const p = pen();
        text(p, L, yc + 4.4, "↩ or ⇧↩ for a new line", SS, "emk-text", 1);
        text(p, L, yc + 4.4, "⇧↩ for a new line", SS, "emk-text", 1);
        const [a, b] = p.out.map((q) => element(q, g));
        pn.base.out.push(a, b);
        const note = control(g, (c) => { c.frame = () => { a.el.style.display = enter ? "none" : ""; b.el.style.display = enter ? "" : "none"; }; });
        return [note, choice(g, C0, R, yc, ["⌘↩", "↩"], 0, (i) => { enter = i === 1; })];
      }],
      [RH, "Auto-capitalization", null, (yc) => toggle(g, yc, true)],
    ]);
    pn.gap(4);
    pn.head("Spelling and grammar");
    pn.card([
      [RH, "Check as you type", null, (yc) => toggle(g, yc, true, (on) => { check = on; })],
      [RH, "Language", null, (yc) => { const c = choice(g, C0, R, yc, ["US", "UK", "ES", "FR", "DE"], 0); c.live = () => check; return c; }],
    ]);
  },
  sessions(pn, g) {
    let agent = "claude";
    const top = pn.y;
    pn.gap(16);
    pn.card([
      [RH, "Permission mode", null, (yc) => dropdown(g, yc, "mode", AGENT_LISTS.mode, () => agent)],
      [RH, "Model", null, (yc) => dropdown(g, yc, "model", AGENT_LISTS.model, () => agent)],
      [RH, "Effort", null, (yc) => dropdown(g, yc, "effort", AGENT_LISTS.effort, () => agent)],
    ]);
    pn.rows.push({ make: () => {
      const yc = top + 5;
      const head = control(g, (c, add) => {
        const a = pen(), b = pen();
        asterisk(a, L + 1, yc, 2.6, 1);
        text(a, L + 7, yc, "Claude Code", HS, "emk-text emk-head", 1);
        codexMark(b, L + 1, yc, 2.4, 1);
        text(b, L + 7, yc, "Codex", HS, "emk-text emk-head", 1);
        const qa = add(a), qb = add(b);
        c.frame = () => { qa.forEach((q) => { q.el.style.display = agent === "claude" ? "" : "none"; }); qb.forEach((q) => { q.el.style.display = agent === "codex" ? "" : "none"; }); };
      });
      const pick = control(g, (c, add) => {
        const p = pen(), u0 = R - 26, sw = 12;
        ring(p, u0, yc - 5.5, R, yc + 5.5, 3, "emk-track");
        ring(p, 0, 0, 1, 1, 2.4, "emk-segplate", 1.3);
        asterisk(p, u0 + 7, yc, 2.2, 1.6);
        codexMark(p, u0 + 19, yc, 2.1, 1.6);
        const [, plate] = add(p);
        const pos = spring(0, { k: 200, c: 24, eps: 0.002 });
        c.springs.push(pos);
        c.frame = () => { plate.r = box(u0 + 1 + pos.x * sw, yc - 4.5, u0 + 1 + (pos.x + 1) * sw, yc + 4.5); };
        ["claude", "codex"].forEach((k, i) => c.hits.push({ r: box(u0 + 1 + i * sw, yc - 5.5, u0 + 1 + (i + 1) * sw, yc + 5.5), act: () => { agent = k; pos.t = i; return k === "claude" ? "Claude Code" : "Codex"; } }));
      });
      return [head, pick];
    } });
  },
  terminal(pn, g) {
    pn.head("Look");
    pn.card([
      [RH, "Theme", null, (yc) => choice(g, C0, R, yc, ["Match window", "Dark", "Light"], 0)],
      [RH, "Cursor", null, (yc) => choice(g, C0, R, yc, ["Bar", "Block", "Underline"], 0)],
      [RH, "Blinking cursor", null, (yc) => toggle(g, yc, true)],
      [RH, "Font", null, (yc) => button(g, R - 40, R, yc, "Open Fonts")],
      [RH, "Size", null, (yc) => button(g, R - 30, R, yc, "13 pt")],
    ]);
    pn.gap(4);
    pn.head("Behavior");
    pn.card([
      [RH2, "Ligatures", "Joins -> and != into one mark.", (yc) => toggle(g, yc, true)],
      [RH, "Copy on select", null, (yc) => toggle(g, yc, true)],
    ]);
    text(pn.base, L - 1.5, pn.y, "The styling and UI design are from Kaku, made by tw93.", SS, "emk-text", 0.8);
    pn.gap(6);
  },
  files(pn, g) {
    let format = true;
    pn.card([[RH2, "Format on save", "A file saved from its pane is put in its language's form.", (yc) => toggle(g, yc, true, (on) => { format = on; })]]);
    pn.gap(4);
    pn.head("Languages");
    const top = pn.y;
    pn.card([[86, null, null, null]]);
    const cols = [L, 143.5], by = [84, 209];
    cols.forEach((u, j) => text(pn.base, u, top + 9, ["Code", "Documents and data"][j], SS, "emk-text", 1));
    pn.rows.push({ make: () => FORMATTERS.flatMap((col, j) => col.map(([name, tool], i) => {
      const yc = top + 22 + i * 13.5;
      const c = tick(g, cols[j] + 3.6, yc, true, () => format);
      const p = pen();
      text(p, cols[j] + 11, yc, name, TS - 0.4, "emk-text emk-row", 1.4);
      text(p, by[j], yc, "by " + tool, SS, "emk-text", 1.4);
      p.out.forEach((q) => { element(q, c.g); c.prims.push(q); });
      return c;
    })) });
  },
};

export function settings({ section = "appearance" } = {}) {
  return ({ stage, svg, read }) => {
    const bag = disposer();
    const C = Cam(REST_AZ, REST_K, S);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);
    const az = spring(REST_AZ, { k: 60, c: 14, eps: 0.01 }), kk = spring(REST_K, { k: 60, c: 14, eps: 0.0005 });
    const g = mk("g", {}, svg);

    // The pane: its ground, then the section's heads, cards and rules, then the controls.
    const pn = pane();
    const groundG = mk("g", {}, g), baseG = mk("g", {}, g), ctlG = mk("g", {}, g);
    SECTIONS[section](pn, ctlG);
    const H = pn.y - 2;
    const ground = element({ t: "tile", r: [0, -H, W, 0], rad: 8, h: SLAB, cls: "", w: -SLAB }, groundG);
    const ctls = pn.rows.flatMap((r) => [].concat(r.make(r.yc)));
    const fixed = pn.base.out;
    fixed.forEach((q) => { if (!q.el) element(q, baseG); });

    let hov = null;
    function frame() {
      C.az = rad(az.x); C.k = kk.x;
      const W3 = (u, v, w) => [u, w, v];
      fit(C, [W3(0, -H, -SLAB), W3(W, -H, -SLAB), W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, -H, 0), W3(W, 0, 0)], 200, 160);
      P = proj(C);
      const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
      draw(ground, 0, front, P2);
      fixed.forEach((q) => draw(q, 0, front, P2));
      for (const c of ctls) {
        c.frame();
        c.g.classList.toggle("emk-off", !c.live());
        c.g.classList.toggle("emk-hov", c === hov);
        c.prims.forEach((q) => draw(q, 0, front, P2));
      }
    }

    const B = register(stage, (dt) => {
      const m = [stepS(az, dt), stepS(kk, dt), ...ctls.flatMap((c) => c.springs.map((sp) => stepS(sp, dt)))].some(Boolean);
      frame();
      return m;
    });
    bag.add(B.unregister);

    // The box: the pane and a margin, the stage given its proportions.
    let vb;
    {
      frame();
      const pts = [[0, -H], [W, -H], [0, 0], [W, 0]].map(([u, v]) => P2(u, v, 0));
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const x0 = Math.min(...xs) - 8, x1 = Math.max(...xs) + 8, y0 = Math.min(...ys) - 8, y1 = Math.max(...ys) + 12;
      svg.setAttribute("viewBox", [x0, y0, x1 - x0, y1 - y0].map((n) => n.toFixed(1)).join(" "));
      svg.style.overflow = "hidden";
      stage.style.aspectRatio = `${(x1 - x0).toFixed(1)} / ${(y1 - y0).toFixed(1)}`;
      vb = [x0, y0, x1 - x0, y1 - y0];
    }

    /** The control and the place on it under a point of the box, among those that take a click now. */
    const under = (pt) => {
      for (const c of ctls) {
        if (!c.live()) continue;
        const h = c.hits.find((hh) => inside(pt, P2, hh.r, 1.2));
        if (h) return { c, h };
      }
      return null;
    };
    const at = (p) => [vb[0] + (p[0] / 400) * vb[2], vb[1] + (p[1] / 320) * vb[3]];
    bag.add(pointer(stage, {
      move: (p) => {
        const pt = at(p);
        aim(az, kk, pt[0], pt[1], vb);
        const u = under(pt);
        hov = u ? u.c : null;
        stage.style.cursor = u ? "pointer" : "";
        B.wake();
      },
      down: (p) => {
        const u = under(at(p));
        if (u) { const said = u.h.act(); if (said) read.textContent = said; }
        hov = u ? u.c : null;
        B.wake();
      },
      leave: () => {
        az.t = REST_AZ; kk.t = REST_K;
        hov = null;
        stage.style.cursor = "";
        B.wake();
      },
    }));
    bag.add(() => { svg.replaceChildren(); stage.style.aspectRatio = ""; stage.style.cursor = ""; });
    return { set: () => B.wake(), destroy: bag.dispose };
  };
}
