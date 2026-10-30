import { Cam, fit, lerp, proj, rad } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";
import { MARKS, aim, draw, element, pen } from "./window.js";
import { inside, keep, shift } from "./layout.js";
import { icon, value } from "./composer.js";

/**
 * One section of Emaki's settings window, on its own (Settings): the
 * section's groups as the app lays them out (`workbench/settings.rs`), a
 * card of rows each, a name at the left and its control at the right, on
 * the pane's ground, with no window round it. Ten figures: Appearance,
 * Text's two pages, Fonts and Size, Conversation, Model calls, New
 * sessions, Panels, Files, Terminal and Shortcuts; About is not drawn.
 *
 * A click or a tap works a control as the app's does, and nothing else
 * changes: a switch's knob slides and its track fills with the accent, a
 * choice's plate slides to the segment, an accent's ring moves to its
 * disc and its name under Accent, a face's tile is chosen, a tick comes
 * and goes, a size steps a point (under Custom only, as the app's), a
 * dropdown turns to its next value, a button flashes, a side's choice
 * moves the Panels picture's pieces to their sides, and a shortcut
 * pressed waits for new keys until a click elsewhere. A control under
 * the pointer darkens; the choices that hang on a switch (the spelling's
 * languages, the formatters) dim while it is off and take no click.
 * Leaving keeps what was set. The pointer turns the pane a little, as
 * every figure on the docs pages (window.js, SLIGHT).
 *
 * A section of two pages (Shortcuts: the window's commands and the file
 * editor's) draws both on one pane, each tagged with its page, and shows
 * the one its control at the head chooses.
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
/** An agent's mark, the app's own icon (MARKS, window.js), `s` across about (u, y), in the agent's color. */
const mark = (p, agent, u, y, s, w = 1) => p.mark(u, -y, MARKS[agent], s, "emk-mark emk-" + agent, w);

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

/**
 * A choice of a few, its plate sliding to the one picked. A segment is a
 * word, or a drawing: `[name, (p, u, yc) => …]`, as the Panels section's
 * pairs of icons are.
 */
function choice(parent, u0, u1, yc, words, idx, set, h = 12) {
  return control(parent, (c, add) => {
    const p = pen(), n = words.length, sw = (u1 - u0 - 2) / n;
    ring(p, u0, yc - h / 2, u1, yc + h / 2, 3.2, "emk-track");
    ring(p, 0, 0, 1, 1, 2.6, "emk-segplate", 1.3);
    const [, plate] = add(p);
    const labels = words.map((word, i) => {
      const lp = pen(), u = u0 + 1 + (i + 0.5) * sw;
      if (typeof word === "string") text(lp, u, yc, word, CS, "emk-text emk-mid", 1.6);
      else word[1](lp, u, yc);
      return add(lp);
    });
    const pos = spring(idx, { k: 200, c: 24, eps: 0.002 });
    c.springs.push(pos);
    c.frame = () => {
      plate.r = box(u0 + 1 + pos.x * sw, yc - h / 2 + 1, u0 + 1 + (pos.x + 1) * sw, yc + h / 2 - 1);
      labels.forEach((qs, i) => qs.forEach((q) => { if (q.t === "text") q.el.classList.toggle("emk-lit", i === idx); }));
    };
    words.forEach((word, i) => c.hits.push({ r: box(u0 + 1 + i * sw, yc - h / 2, u0 + 1 + (i + 1) * sw, yc + h / 2), act: () => { idx = i; pos.t = i; set?.(i); return typeof word === "string" ? word : word[0]; } }));
  });
}

/**
 * The window's small icons, drawn in a few strokes at (u, yc), `s` their
 * reach: the files' tree, the terminal's prompt, the outline's list and
 * the layout's terminal in its square. The Panels section's picture and
 * its two choices are made of them.
 */
const ICONS = {
  tree(p, u, yc, s = 2.4, cls = "nf emk-ico", w = 1.6) {
    hl(p, u - s, u + 0.1 * s, yc - 0.8 * s, cls, w);
    line(p, [[u - 0.65 * s, yc - 0.8 * s], [u - 0.65 * s, yc + 0.85 * s], [u + s, yc + 0.85 * s]], cls, w);
    hl(p, u - 0.65 * s, u + s, yc, cls, w);
  },
  terminal(p, u, yc, s = 2.4, cls = "nf emk-ico", w = 1.6) {
    line(p, [[u - 0.9 * s, yc - 0.8 * s], [u - 0.2 * s, yc - 0.1 * s], [u - 0.9 * s, yc + 0.6 * s]], cls, w);
    hl(p, u + 0.1 * s, u + s, yc + 0.8 * s, cls, w);
  },
  list(p, u, yc, s = 2.4, cls = "nf emk-ico", w = 1.6) {
    [-0.8, 0, 0.8].forEach((k) => { hl(p, u - 0.35 * s, u + s, yc + k * s, cls, w); p.dot(u - 0.9 * s, -(yc + k * s), 0.16 * s, "dot m", w); });
  },
  layout(p, u, yc, s = 2.4, cls = "nf emk-ico", w = 1.6) {
    ring(p, u - s, yc - s, u + s, yc + s, 0.3 * s, cls, w);
    line(p, [[u - 0.55 * s, yc - 0.45 * s], [u - 0.15 * s, yc], [u - 0.55 * s, yc + 0.45 * s]], cls, w);
    hl(p, u + 0.1 * s, u + 0.55 * s, yc + 0.5 * s, cls, w);
  },
};
/** A segment showing two icons in the order its choice sets them. */
const pair = (a, b) => (p, u, yc) => { ICONS[a](p, u - 4.2, yc); ICONS[b](p, u + 4.2, yc); };

/**
 * A key on its cap, as the app draws a shortcut: a small plate, the sign
 * or letter in its middle, `w` wide. A shortcut's caps stand in a row, a
 * chord's strokes parted.
 */
const CAP = 7.2, CAP_GAP = 1.2;
function cap(p, u, yc, sign, w = CAP) {
  ring(p, u, yc - CAP / 2, u + w, yc + CAP / 2, 1.6, "emk-cap", 1.2);
  text(p, u + w / 2, yc + 0.2, sign, 4.6, "emk-text emk-mid emk-cap-t", 1.6);
}
/** The caps of a shortcut, written as the Mac has it, right-aligned to `u1`; a space parts a chord's strokes. */
function caps(p, u1, yc, keys) {
  // F5 and the like are one cap: a key named by letters.
  const list = keys.split(" ").map((k) => (/^F\d+$/.test(k) ? [[k, 9.5]] : [...k].map((sg) => [sg, CAP])));
  let total = 0;
  list.forEach((st, i) => { st.forEach(([, w]) => { total += w + CAP_GAP; }); if (i) total += 3; });
  let u = u1 - total + CAP_GAP;
  list.forEach((st, i) => {
    if (i) u += 3;
    st.forEach(([sg, w]) => { cap(p, u, yc, sg, w); u += w + CAP_GAP; });
  });
  return [u1 - total + CAP_GAP, u1];
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
    set y(v) { y = v; },
    /** The page being laid out, tagged on what it draws (`tag`), and the page showing; null for a section of one. */
    page: null,
    current: null,
    tag: (from) => base.out.slice(from).forEach((q) => { q.page = api.page; }),
    /** What a click on nothing, and the pointer leaving, tell the section. */
    miss: [],
    gone: [],
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
        if (make) rows.push({ yc, make, sub, page: api.page });
        at += h;
      });
      y = at + pad + 10;
    },
    base, rows,
  };
  return api;
}

/** The window's commands and the file editor's, as Settings, Shortcuts lists them, with their keys as the Mac has them (shortcuts.rs). */
const SHORTCUTS = [
  [
    ["Sessions", [["Search", "⌘K"], ["New Session", "⌘N"], ["New Session Here", "⌘T"], ["Choose Folder…", "⌘O"], ["New Branch…", "⌘⇧N"], ["All Sessions", "⌘L"], ["Agents", "⌘E"], ["Reopen Tab", "⌘⇧T"], ["Refresh", "⌘R"]]],
    ["Panels", [["Sidebar", "⌘⇧B"], ["Files", "⌘⇧F"], ["Shell Terminal", "⌘⇧S"], ["Outline", "⌘⇧O"], ["Layout Switch", "⌘⇧L"], ["Git Changes", "⌘⇧G"], ["Editor Switch", "⌘⇧V"]]],
  ],
  [
    ["Lines", [["Delete Line", "⌃⇧K"], ["Duplicate Line", "⌘⇧D"], ["Move Line Up", "⌃⌘↑"], ["Move Line Down", "⌃⌘↓"], ["Insert Line After", "⌘↩"], ["Insert Line Before", "⌘⇧↩"], ["Join Lines", "⌘⇧J"], ["Sort Lines", "F5"], ["Expand to Line", "⌘L"]]],
    ["Text", [["Toggle Comment", "⌘/"], ["Block Comment", "⌥⌘/"], ["Upper Case", "⌘K ⌘U"], ["Lower Case", "⌘K ⌘L"], ["Select Next Match", "⌘D"], ["Use Selection for Find", "⌘E"], ["Jump to Bracket", "⌃M"], ["Fold", "⌥⌘["], ["Unfold", "⌥⌘]"]]],
  ],
];
/** Model calls: what each agent's sessions are asked of, Default first, named with the agent's fast model as the app's pill names it, then the agent's own list; the names follow the agents' releases. */
const HELPERS = {
  claude: [["Default (Haiku 4.5)", ""], ["Sonnet 5.5", ""], ["Opus 5.5", ""], ["Fable 5.1", ""]],
  codex: [["Default (GPT-6-Luna)", ""]],
};

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
    pn.gap(4);
    pn.head("Power");
    pn.card([[RH, "Keep the display on while a session works", null, (yc) => toggle(g, yc, false)]]);
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
  size(pn, g) {
    let preset = 3;
    const custom = [...PRESETS[1]];
    pn.card([[RH, "Size", null, (yc) => choice(g, C0, R, yc, ["Small", "Medium", "Large", "Custom"], preset, (i) => { preset = i; })]]);
    pn.gap(-2);
    pn.card(PLACES.map((name, i) => [RH, name, null, (yc) => stepper(g, yc, () => (preset === 3 ? custom[i] : PRESETS[preset][i]), (n) => { custom[i] = Math.min(32, Math.max(9, n)); }, () => preset === 3)]));
  },
  conversation(pn, g) {
    pn.head("Agent");
    pn.card([
      [RH2, "Fold runs of tool calls", "Three or more in a row show as one row that opens.", (yc) => toggle(g, yc, true)],
      [RH, "Outline panel", null, (yc) => toggle(g, yc, true)],
    ]);
    pn.gap(4);
    SECTIONS.composer(pn, g);
  },
  models(pn, g) {
    pn.card([
      [RH, "Explain tool calls", null, (yc) => toggle(g, yc, true)],
      [RH, "Outline summaries", null, (yc) => toggle(g, yc, true)],
    ]);
    pn.gap(4);
    pn.head("Model");
    pn.card([
      [RH, "Claude Code", null, (yc) => dropdown(g, yc, "model", { claude: HELPERS.claude }, () => "claude")],
      [RH, "Codex", null, (yc) => dropdown(g, yc, "model", { codex: HELPERS.codex }, () => "codex")],
    ]);
  },
  /**
   * Panels: the app's picture of the window, then the two choices. The
   * picture is the app's own, scaled to the card: the strip with the two
   * panels' icons at its ends, a side panel at either side of the column,
   * each with its icon and name, the conversation's bars and composer in
   * the column, and in its margins the two seams, each named under its
   * knob. A choice moves its pair to the other sides, the pieces sliding.
   */
  panels(pn, g) {
    const top = pn.y, PW = W - 2 * M - 28, s = PW / 528, PH = 176 * s;
    const x0 = M + 14, y0 = top + 14;
    pn.card([[PH + 28, null, null, null]]);
    const STRIP = 20 * s, SIDE = 96 * s, COL = 168 * s, SEAM_OUT = 26 * s;
    const colL = SIDE + (PW - 2 * SIDE - COL) / 2, colR = colL + COL, seamL = colL - SEAM_OUT, seamR = colR + SEAM_OUT;
    const X = (x) => x0 + x, Y = (y) => y0 + y;
    const kf = spring(0, { k: 120, c: 20, eps: 0.002 }), ko = spring(0, { k: 120, c: 20, eps: 0.002 });
    const picture = control(g, (c, add) => {
      // the frame, the strip, and the conversation, which stay
      const p = pen();
      ring(p, X(0), Y(0), X(PW), Y(PH), 4, "emk-pic", 0.8);
      hl(p, X(0), X(PW), Y(STRIP), "nf lo", 0.8);
      ring(p, X(PW / 2 - 40 * s), Y(5 * s), X(PW / 2 + 40 * s), Y(15 * s), 2, "emk-bar", 1);
      ring(p, X(colR - 14 * s - 64 * s), Y(STRIP + 14 * s), X(colR - 14 * s), Y(STRIP + 26 * s), 2.6, "emk-bar", 1);
      [[36, 126], [46, 110], [56, 80]].forEach(([y, w]) => ring(p, X(colL + 14 * s), Y(STRIP + y * s), X(colL + (14 + w) * s), Y(STRIP + (y + 4) * s), 0.9, "emk-bar", 1));
      ring(p, X(colR - 14 * s - 48 * s), Y(STRIP + 72 * s), X(colR - 14 * s), Y(STRIP + 84 * s), 2.6, "emk-bar", 1);
      ring(p, X(colL), Y(PH - 32 * s), X(colL + COL), Y(PH - 10 * s), 3.4, "nf lo", 1);
      add(p);
      // a side panel: its ground from the strip down, its icon over its name; and its icon in the strip, drawn at the picture's left edge and moved to its end
      const side = (icon, word, cls) => {
        const q = pen();
        ring(q, X(0), Y(STRIP + 0.4), X(SIDE), Y(PH - 0.4), 0.1, cls, 0.9);
        ICONS[icon](q, X(SIDE / 2), Y((STRIP + PH) / 2 - 5), 2.8, "nf emk-ico", 1.4);
        text(q, X(SIDE / 2), Y((STRIP + PH) / 2 + 4.5), word, 4.4, "emk-text emk-mid", 1.4);
        const panel = add(q);
        const sq = pen();
        ICONS[icon](sq, X(0), Y(10 * s), 2, "nf emk-ico", 1.4);
        const strip = add(sq);
        keep(panel); keep(strip);
        return { panel, strip };
      };
      const files = side("tree", "Files", "emk-pic-side"), term = side("terminal", "Terminal", "emk-pic-term");
      // a seam: the line parted for its knob, the knob with its icon, and its name under it
      const seamAt = (icon, word) => {
        const q = pen(), topV = STRIP + 12 * s, foot = PH - 42 * s, mid = (topV + foot) / 2 - 8 * s;
        line(q, [[X(0), Y(topV)], [X(0), Y(mid - 9 * s)]], "nf emk-acc", 1.2);
        line(q, [[X(0), Y(mid + 30 * s)], [X(0), Y(foot)]], "nf emk-acc", 1.2);
        ring(q, X(-9 * s), Y(mid - 9 * s), X(9 * s), Y(mid + 9 * s), 9 * s, "nf emk-acc emk-knob", 1.4);
        ICONS[icon](q, X(0), Y(mid), 1.7, "nf emk-acc", 1.6);
        text(q, X(0), Y(mid + 18 * s), word, 4.4, "emk-text emk-mid", 1.4);
        const prims = add(q);
        keep(prims);
        return prims;
      };
      const outline = seamAt("list", "Outline"), layout = seamAt("layout", "Layout");
      c.springs.push(kf, ko);
      c.frame = () => {
        shift(files.panel, lerp(0, PW - SIDE, kf.x));
        shift(term.panel, lerp(PW - SIDE, 0, kf.x));
        // the strip's icons stand at its ends, each over its panel
        shift(files.strip, lerp(13 * s, PW - 15 * s, kf.x));
        shift(term.strip, lerp(PW - 15 * s, 13 * s, kf.x));
        shift(outline, lerp(seamL, seamR, ko.x));
        shift(layout, lerp(seamR, seamL, ko.x));
      };
    });
    pn.rows.push({ make: () => [picture] });
    pn.card([
      [RH, "Side panels", null, (yc) => choice(g, R - 68, R, yc, [["Files at the left", pair("tree", "terminal")], ["Files at the right", pair("terminal", "tree")]], 0, (i) => { kf.t = i; })],
      [RH, "Margins", null, (yc) => choice(g, R - 68, R, yc, [["Outline at the left", pair("list", "layout")], ["Outline at the right", pair("layout", "list")]], 0, (i) => { ko.t = i; })],
    ]);
  },
  /**
   * Shortcuts: the window's commands and the file editor's, two pages
   * chosen at the head's right, each in two groups, a card of rows, two
   * commands to a row parted by a hairline, the name at the left and the
   * keys at the right on caps. A click on a command's keys waits for new
   * ones: its keys become a field in the accent that says to press a
   * shortcut, until a click anywhere else or the pointer leaving.
   */
  shortcuts(pn, g) {
    let page = 0, waiting = null;
    pn.current = 0;
    const top = pn.y;
    pn.gap(16);
    const y0 = pn.y, ends = [], half = (W - 2 * M) / 2;
    SHORTCUTS.forEach((groups, pi) => {
      pn.y = y0;
      pn.page = pi;
      const from = pn.base.out.length;
      groups.forEach(([name, cmds]) => {
        pn.head(name);
        const rows = [];
        for (let i = 0; i < cmds.length; i += 2) rows.push(cmds.slice(i, i + 2));
        const t = pn.y;
        pn.card(rows.map(() => [RH, null, null, null]));
        line(pn.base, [[W / 2, t], [W / 2, t + rows.length * RH]], "nf lo", 0.8);
        rows.forEach((row, i) => row.forEach(([cmd, keys], j) => {
          const yc = t + i * RH + RH / 2, u0 = M + j * half, id = pi + ":" + cmd;
          text(pn.base, u0 + 8, yc, cmd, TS - 0.6, "emk-text emk-row", 1);
          pn.rows.push({ page: pi, make: () => control(g, (c, add) => {
            const kp = pen(), [ku0] = caps(kp, u0 + half - 6, yc, keys);
            const shown = add(kp);
            const fp = pen();
            ring(fp, u0 + half - 6 - 46, yc - 5.2, u0 + half - 6, yc + 5.2, 3, "emk-wait", 1.2);
            text(fp, u0 + half - 6 - 23, yc + 0.2, "Press a shortcut", 4.6, "emk-text emk-mid emk-wait-t", 1.6);
            const field = add(fp);
            c.frame = () => {
              const on = waiting === id;
              shown.forEach((q) => { q.el.style.display = on ? "none" : ""; });
              field.forEach((q) => { q.el.style.display = on ? "" : "none"; });
            };
            c.hits.push({ r: box(Math.min(ku0, u0 + half - 52) - 3, yc - 6, u0 + half - 3, yc + 6), act: () => { waiting = waiting === id ? null : id; return waiting ? "waiting" : "kept"; } });
          }) });
        }));
        pn.gap(4);
      });
      pn.tag(from);
      ends.push(pn.y);
    });
    pn.page = null;
    pn.y = Math.max(...ends);
    pn.miss.push(() => { waiting = null; });
    pn.gone.push(() => { waiting = null; });
    pn.rows.push({ make: () => choice(g, R - 76, R, top + 5, ["Window", "File editor"], page, (i) => { page = i; pn.current = i; waiting = null; }, 11) });
  },
  composer(pn, g) {
    let enter = false, check = true;
    pn.head("Composer");
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
        mark(a, "claude", L + 1, yc, 5.6);
        text(a, L + 7, yc, "Claude Code", HS, "emk-text emk-head", 1);
        mark(b, "codex", L + 1, yc, 5.4);
        text(b, L + 7, yc, "Codex", HS, "emk-text emk-head", 1);
        const qa = add(a), qb = add(b);
        c.frame = () => { qa.forEach((q) => { q.el.style.display = agent === "claude" ? "" : "none"; }); qb.forEach((q) => { q.el.style.display = agent === "codex" ? "" : "none"; }); };
      });
      const pick = control(g, (c, add) => {
        const p = pen(), u0 = R - 26, sw = 12;
        ring(p, u0, yc - 5.5, R, yc + 5.5, 3, "emk-track");
        ring(p, 0, 0, 1, 1, 2.4, "emk-segplate", 1.3);
        mark(p, "claude", u0 + 7, yc, 5, 1.6);
        mark(p, "codex", u0 + 19, yc, 4.8, 1.6);
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
    pn.card([[RH2, "Open files as", "For supported files.", (yc) => choice(g, C0, R, yc, ["Rendered", "Raw"], 0)]]);
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
    const ctls = pn.rows.flatMap((r) => [].concat(r.make(r.yc)).map((c) => { c.page = r.page; return c; }));
    const fixed = pn.base.out;
    fixed.forEach((q) => { if (!q.el) element(q, baseG); });
    /** Whether something is on the page showing: everything, in a section of one page. */
    const onPage = (q) => q.page == null || q.page === pn.current;

    let hov = null;
    function frame() {
      C.az = rad(az.x); C.k = kk.x;
      const W3 = (u, v, w) => [u, w, v];
      fit(C, [W3(0, -H, -SLAB), W3(W, -H, -SLAB), W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, -H, 0), W3(W, 0, 0)], 200, 160);
      P = proj(C);
      const s = Math.sin(C.az), t = C.k / Math.sqrt(1 - C.k * C.k), front = (q) => q.nu * s + q.nv * t > 0;
      draw(ground, 0, front, P2);
      fixed.forEach((q) => { q.el.style.display = onPage(q) ? "" : "none"; if (q.cr) q.cr.style.display = onPage(q) ? "" : "none"; draw(q, 0, front, P2); });
      for (const c of ctls) {
        c.g.style.display = onPage(c) ? "" : "none";
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
        if (!c.live() || !onPage(c)) continue;
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
        else pn.miss.forEach((fn) => fn());
        hov = u ? u.c : null;
        B.wake();
      },
      leave: () => {
        az.t = REST_AZ; kk.t = REST_K;
        hov = null;
        pn.gone.forEach((fn) => fn());
        stage.style.cursor = "";
        B.wake();
      },
    }));
    bag.add(() => { svg.replaceChildren(); stage.style.aspectRatio = ""; stage.style.cursor = ""; });
    return { set: () => B.wake(), destroy: bag.dispose };
  };
}
