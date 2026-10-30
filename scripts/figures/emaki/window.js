import { Cam, clamp, fit, lerp, open, poly, prism, proj, rad, rings, rrect } from "hairline/core/iso.ts";
import { spring, stepS } from "hairline/core/motion.ts";
import { disposer, mk, pointer, register } from "hairline/core/stage.ts";

/**
 * Emaki's window, seen from the front, with one
 * of its parts taken out of it: the six figures of the app's parts on the
 * landing page are this one drawing, each with its own part forward.
 *
 * The window stands at the back, its chrome across the head with the
 * lights, the name and the two panels' buttons at the strip's ends, and
 * its regions under it, the sidebar, the chat with a seam at each edge of
 * its column and, where the part is a panel, that panel open beside the
 * chat, the outline's drawer at the chat's left edge, or the agent
 * terminal in the chat's place, every one drawn faintly. The part stands
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
/**
 * The chat is its column alone, centered in its pane as the app centers
 * it, most of the pane wide (COL_SHARE) with a margin at each side where
 * the seams stand, each in the middle of its margin, clear of the column,
 * running from over the composer, where the outline's drawer ends too, to
 * under the chrome, its knob halfway. The drawer comes out into the left
 * margin, a breath of air off the pane's edge (AIR) and a gap off the
 * column (DGAP), with its foot a little under the seam's (DV0), so the seam
 * ends on its straight edge, and the seam riding out onto its outer edge, as
 * the right seam rides onto the agent CLI's edge while it is in: a seam
 * stands on the outer edge of what it brought in; the column is nudged right to make room for
 * it, and a panel coming in nudges it the other way: the far margin gives
 * first, down to MARG_MIN, and the column narrows only then (`place`).
 * The agent CLI takes exactly the column.
 */
export const COL_SHARE = 0.68, DRAWER_SHARE = 0.21, MARG_MIN = 12, AIR = 6, DGAP = 4, DV0 = 29, SEAM_TOP = TOP - 8, SEAM_FOOT = 33;
export const colWidth = (paneW) => Math.round(paneW * COL_SHARE);
export const drawerW = (paneW) => Math.round(paneW * DRAWER_SHARE);
/**
 * Where everything in the chat's pane stands, with the drawer `ov` of
 * the way out and the agent CLI `av` of the way in: the column, colW
 * wide where the pane allows, the drawer's place at the column's left,
 * and the two seams, each in the middle of its margin, the left one on
 * the drawer's outer edge as it comes out, the right one on the
 * terminal's, which is the column's, as it comes in.
 */
export function place([a, b, c, d], colW, ow, ov = 0, av = 0) {
  const pw = c - a, m0 = Math.max(MARG_MIN, (pw - colW) / 2), need = AIR + ow + DGAP;
  const ml = lerp(m0, Math.max(m0, need), ov);
  const mr = clamp(pw - ml - colW, MARG_MIN, m0);
  const col = [a + ml, b, c - mr, d];
  const drawer = [col[0] - DGAP - ow, DV0, col[0] - DGAP, d - 3];
  return { col, drawer, seamL: lerp(a + m0 / 2, drawer[0], ov), seamR: lerp(c - mr / 2, col[2], av) };
}
/**
 * The window as each figure has it: the sidebar, the chat's pane, and the
 * part that is the figure's own. A panel stands beside the pane (`left`,
 * `right`); the outline's drawer stands out in the pane's left margin,
 * the column nudged right for it (`drawer`); the agent CLI takes the
 * column itself, and the chat is not drawn (`cli`).
 */
const LAYOUTS = {
  plain: { side: [4, 4, 54, TOP], conv: [58, 4, W - 4, TOP] },
  left: { side: [4, 4, 44, TOP], panel: [48, 4, 96, TOP], conv: [100, 4, W - 4, TOP] },
  right: { side: [4, 4, 44, TOP], conv: [48, 4, 146, TOP], panel: [150, 4, W - 4, TOP] },
  drawer: { side: [4, 4, 54, TOP], conv: [58, 4, W - 4, TOP], drawer: true },
  cli: { side: [4, 4, 54, TOP], conv: [58, 4, W - 4, TOP], cli: true },
};
/** At rest the window faces the eye (no turn, in degrees) from a hair above (sin of the elevation); the pointer turns it as far as AZ and tips it from K0 to K1. */
const REST_AZ = 0, AZ = 30, REST_K = 0.05, K0 = 0.1, K1 = 0.34, MORE = 8;
/** How much larger the part is drawn for each unit it stands forward, and how far down its shadow falls for each. */
const NEAR = 0.006, FALL = 0.22;
/**
 * Which of a slab's two rings is its outer edge on one side: the near
 * face's, or, where the window is turned so that that side of the slab
 * faces the eye, the far ring's, which then stands out by the slab's
 * depth. `nu` is the side's normal along u, `s` the sine of the turn; the
 * answer is how far of the way to the far ring, blended over a small
 * band about the middle, where the two rings are a hair apart.
 */
export const outer = (nu, s) => clamp((nu * s) / 0.15, 0, 1);
/**
 * The docs' figures turn less: a few degrees to either side and a small
 * tip about where they rest, so the layers still part as the eye moves
 * while what is pointed at stays where it was.
 */
export const SLIGHT = { AZ: 6, K0: 0.03, K1: 0.09 };
/** Sends a figure's turn and tip springs where the pointer at (x, y) in the box `vb` asks, within SLIGHT. */
export const aim = (az, kk, x, y, vb) => {
  az.t = lerp(SLIGHT.AZ, -SLIGHT.AZ, clamp((x - vb[0]) / vb[2], 0, 1));
  kk.t = lerp(SLIGHT.K0, SLIGHT.K1, clamp((y - vb[1]) / vb[3], 0, 1));
};
let shades = 0;
/**
 * The two agents' marks, the app's own icons (assets/icons/claude.svg,
 * assets/icons/agents/codex.svg), each a filled path in a 24-unit box,
 * drawn upright by `mark` wherever a figure shows an agent: a session's
 * leading mark in the sidebar, the agent CLI's banner, the settings. With
 * them two of the app's own stroked icons (`emk-icon`, a stroke and no
 * fill), the sidebar's All Sessions and Agents rows' (assets/icons/
 * scroll.svg, sparkles.svg).
 */
export const MARKS = {
  claude: "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z",
  codex: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
  scroll: "M17 20h-11a3 3 0 0 1 0 -6h11a3 3 0 0 0 0 6h1a3 3 0 0 0 3 -3v-11a2 2 0 0 0 -2 -2h-10a2 2 0 0 0 -2 2v8",
  sparkles: "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6",
};

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
    // A word, `s` units high, from (u, v) on its middle line, turned `rot` degrees about it; a picture, `s` units square, centered there.
    text: (u, v, str, s, cls = "emk-text", w = 0, rot = 0) => out.push({ t: "text", u, v, str, s, cls, w, rot }),
    image: (u, v, href, s, w = 0) => out.push({ t: "image", u, v, href, s, w }),
    // A mark: an icon's path (MARKS), `s` units square, centered at (u, v), upright, filled in its class's color.
    mark: (u, v, d, s, cls = "emk-mark", w = 0) => out.push({ t: "path", u, v, d, s, cls, w }),
  };
}
export const chev = (p, u, v, w, cls = "nf") => p.line([[u, v + 1.6], [u + 2, v], [u, v - 1.6]], cls, w);
/**
 * A seam at an edge of the chat's column, as the app draws it: a line
 * down the edge, parted for its round knob halfway, which holds the
 * thing's icon: the outline's list at the left, the layout's terminal at
 * the right. The knob is a plate, which hides the edge it rides on, and
 * takes the part's wash while the seam's thing shows (`emk-btn`, as a
 * panel's button does; `knob` marks one whose thing is shown).
 */
export function seam(p, u, kind, cls = "nf", w = 0, knob = "") {
  const mid = (SEAM_TOP + SEAM_FOOT) / 2;
  p.line([[u, SEAM_FOOT], [u, mid - 4.5]], cls, w);
  p.line([[u, mid + 4.5], [u, SEAM_TOP]], cls, w);
  p.ring(u - 3, mid - 3, u + 3, mid + 3, 3, cls + " emk-btn" + knob, w);
  if (kind === "outline") {
    p.h(u - 1.3, u + 1.3, mid + 0.9, cls, w);
    p.h(u - 1.3, u + 1.3, mid - 0.9, cls, w);
  } else {
    p.line([[u - 1.4, mid + 1.2], [u - 0.2, mid], [u - 1.4, mid - 1.2]], cls, w);
    p.h(u + 0.2, u + 1.5, mid - 1.3, cls, w);
  }
}

/**
 * The regions, each drawn in full; the window's faint copy of a region is
 * the same drawing, flattened. A list (the tree, the outline, the shell)
 * keeps its rows `foot` over the region's foot, leaving that room clear;
 * the shell still ends on its prompt.
 */
/** The open project's sessions' agents, in order: the leading mark of each row. */
export const AGENTS = ["claude", "claude", "codex"];
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
          p.mark(a + 11, v, MARKS[AGENTS[j]], 3.2, "emk-mark emk-" + AGENTS[j]);
          p.h(a + 15, a + 15 + sl * (wd - 18), v);
        });
        p.line([[a + 7.5, top - 4], [a + 7.5, v + 1]], "nf lo");
      }
      v -= 9;
    });
  },
  conv(p, [a, b, c, d]) {
    const ta = a, wd = c - ta;
    p.h(ta + 5, ta + 5 + wd * 0.82, d - 6);
    p.h(ta + 5, ta + 5 + wd * 0.74, d - 11);
    p.h(ta + 5, ta + 5 + wd * 0.5, d - 16);
    p.tile(c - 5 - wd * 0.42, d - 29, c - 5, d - 21, 3.5, 1.6);
    p.h(c - wd * 0.42, c - 12, d - 25, "nf", 1.6);
    p.tile(ta + 5, d - 42, ta + 5 + wd * 0.55, d - 35, 2, 1.2);
    p.dot(ta + 9, d - 38.5, 1.1, "dot m", 1.2);
    p.h(ta + 13, ta + 5 + wd * 0.42, d - 38.5, "nf", 1.2);
    p.h(ta + 5, ta + 5 + wd * 0.86, d - 50);
    p.h(ta + 5, ta + 5 + wd * 0.6, d - 55);
    p.tile(a + 3, b + 8, c - 3, b + 26, 4, 2);
    const cw = c - a, end = a + 8 + cw * 0.4;
    p.h(a + 8, end, b + 21, "nf", 2);
    p.line([[end + 1.6, b + 19], [end + 1.6, b + 23]], "nf hi", 2);
    // the three pills, narrower in a narrow column as the app folds them, clear of the send button
    const pw = clamp((cw - 32) / 3.4, 4, 12);
    [0, 1, 2].forEach((i) => p.ring(a + 8 + i * (pw + 2), b + 11, a + 8 + i * (pw + 2) + pw, b + 15, 2, "nf", 2));
    p.tile(c - 13, b + 10, c - 6, b + 17, 3.5, 1.4, "hi", 2);
    p.line([[c - 9.5, b + 11.5], [c - 9.5, b + 15.5]], "nf", 3.4);
    p.line([[c - 11.2, b + 13.8], [c - 9.5, b + 15.5], [c - 7.8, b + 13.8]], "nf", 3.4);
    p.h(a + 5, a + 20, b + 3.5, "nf lo");
    p.h(a + 24, a + 36, b + 3.5, "nf lo");
  },
  tree(p, [a, b, c, d], foot = 0) {
    const wd = c - a;
    p.tile(a + 3, d - 10, a + wd * 0.66, d - 3, 3, 1.2);
    p.dot(a + 7, d - 6.5, 1, "dot m", 1.2);
    p.h(a + 10, a + wd * 0.54, d - 6.5, "nf", 1.2);
    const rows = [[0, "dir", 0.3, 2], [1, "f", 0.45, 1], [1, "f", 0.34, 0], [1, "dirc", 0.28, 0], [0, "f", 0.42, 1],
      [0, "f", 0.36, 1], [0, "f", 0.3, 0], [0, "f", 0.38, 0], [0, "f", 0.26, 0], [0, "f", 0.33, 0]];
    rows.forEach(([dep, kind, len, git], i) => {
      const v = d - 17 - i * 7.5, x = a + 4 + dep * 4, sel = i === 1, w = sel ? 1 : 0;
      if (v - 2 < b + foot) return;
      if (sel) p.tile(a + 2, v - 3.4, c - 2, v + 3.4, 2, 1, "hi");
      if (kind === "dir") p.line([[x, v + 1], [x + 1.6, v - 0.8], [x + 3.2, v + 1]], "nf", w);
      else if (kind === "dirc") chev(p, x + 0.6, v, w);
      else p.ring(x, v - 2, x + 3, v + 2, 0.6, "nf", w);
      p.h(x + 5.5, x + 5.5 + len * wd, v, "nf", w);
      if (git) p.dot(c - 5, v, git === 1 ? 1 : 0.8, git === 1 ? "dot m" : "dot off", w);
    });
  },
  // The rows stand in from the drawer's left edge, clear of the seam's knob, which rides on it.
  outline(p, [a, b, c, d], foot = 0) {
    const wd = c - a, x = a + 3;
    p.h(x + 4, x + 18, d - 6, "nf sil");
    [0.6, 0.45, 0.7, 0.5, 0.62, null, 0.4, 0.66, 0.52, 0.58].forEach((len, i) => {
      const v = d - 15 - i * 9;
      if (v - 2.5 < b + foot) return;
      if (len === null) { p.h(x + 4, x + 16, v, "nf sil"); return; }
      const on = i === 3;
      p.tile(x + 3, v - 2.5, x + 11, v + 2.5, 1.2, on ? 1.6 : 1, on ? "hi" : "");
      p.h(x + 14, x + 14 + len * (wd - 20), v, on ? "nf hi" : "nf");
    });
  },
  shell(p, [a, b, c, d], foot = 0) {
    const wd = c - a;
    p.tile(a + 2, d - 11, c - 2, d - 2, 3, 0.8);
    p.tile(a + 4, d - 9.5, a + 4 + wd * 0.34, d - 3.5, 2.4, 1.4, "hi", 0.8);
    chev(p, a + 7, d - 6.5, 2.2);
    p.h(a + 11, a + wd * 0.3, d - 6.5, "nf", 2.2);
    p.tile(a + 6 + wd * 0.34, d - 9.5, a + 4 + wd * 0.66, d - 3.5, 2.4, 0.8, "", 0.8);
    p.ring(c - 10, d - 9.5, c - 4, d - 3.5, 3, "nf", 0.8);
    const rows = [[">", 0.3], [[0, 0.2], [0.3, 0.24], [0.62, 0.18]], [[0, 0.26], [0.3, 0.16], [0.62, 0.22]], [[0, 0.18], [0.3, 0.28]],
      [">", 0.42], [[0, 0.74]], [[0.06, 0.56]], [[0.06, 0.66]], [[0.06, 0.48]], [[0, 0.38]], [">", 0.24], [[0, 0.5]], [">", 0]];
    // As many rows as fit over the foot, the last of them the prompt.
    const fit = rows.filter((_, i) => d - 18 - i * 7 - 2.6 >= b + foot).length;
    rows.splice(fit - 1, rows.length, [">", 0]);
    let cur = null;
    rows.forEach((row, i) => {
      const v = d - 18 - i * 7;
      if (row[0] === ">") { chev(p, a + 4, v, 0); if (row[1]) p.h(a + 9, a + 9 + row[1] * (wd - 12), v); cur = [a + 9 + row[1] * (wd - 12) + (row[1] ? 2 : 0), v]; }
      else for (const [o, l] of row) p.h(a + 4 + o * (wd - 8), a + 4 + (o + l) * (wd - 8), v);
    });
    p.tile(cur[0], cur[1] - 2.6, cur[0] + 4, cur[1] + 2.6, 0.8, 1.4, "hi");
  },
  // Its rows stop short of the right edge, clear of the seam's knob, which rides on it.
  agent(p, [a, b, cc, d]) {
    const c = cc - 3, wd = c - a;
    p.ring(a + 3, d - 14, a + 3 + wd * 0.8, d - 3, 2);
    p.mark(a + 8.5, d - 8.5, MARKS.claude, 5.6, "emk-mark emk-claude");
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
  : q.t === "path" ? { ...q, cls: q.cls.includes("emk-icon") ? "nf lo emk-icon" : "emk-mark lo", w: 0 }
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
  else if (q.t === "path") q.el = mk("path", { class: q.cls, d: q.d }, parent);
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
  else if (q.t === "path") {
    // A mark stays upright at its size: its 24-unit box set to `s` units where it stands.
    const [x, y] = P2(q.u, q.v, w), [x1, y1] = P2(q.u + 1, q.v, w), k = Math.hypot(x1 - x, y1 - y) * q.s;
    q.el.setAttribute("transform", `translate(${(x - k / 2).toFixed(2)} ${(y - k / 2).toFixed(2)}) scale(${(k / 24).toFixed(4)})`);
  } else {
    // A word or a picture stays upright: placed at its point, sized by how far a unit across reaches there.
    const [x, y] = P2(q.u, q.v, w), [x1, y1] = P2(q.u + 1, q.v, w), k = Math.hypot(x1 - x, y1 - y) * q.s;
    if (q.t === "text") {
      q.el.setAttribute("x", x.toFixed(2)); q.el.setAttribute("y", y.toFixed(2)); q.el.setAttribute("font-size", k.toFixed(2));
      if (q.rot) q.el.setAttribute("transform", `rotate(${q.rot} ${x.toFixed(2)} ${y.toFixed(2)})`);
    }
    else { q.el.setAttribute("x", (x - k / 2).toFixed(2)); q.el.setAttribute("y", (y - k / 2).toFixed(2)); q.el.setAttribute("width", k.toFixed(2)); q.el.setAttribute("height", k.toFixed(2)); }
  }
}

/* ---------- the figure ---------- */

/** One of the six: `layout` is the window's (LAYOUTS), `focus` the region taken out, `region` how it is drawn, `button` the control that is its own: a panel's button in the chrome, or the outline's or the layout's seam. */
export function figure({ layout, focus, region, button }) {
  return ({ stage, svg, read }, value) => {
    const bag = disposer();
    let LIFT = value;
    const L = LAYOUTS[layout], g = mk("g", {}, svg);
    const C = Cam(REST_AZ, REST_K, 1.75);
    let P = proj(C);
    const P2 = (u, v, w) => P(u, w, v);
    const az = spring(REST_AZ, { k: 60, c: 14, eps: 0.01 }), kk = spring(REST_K, { k: 60, c: 14, eps: 0.0005 }), lift = spring(value, { eps: 0.01 });

    // The window: its slab, its chrome with the two panels' buttons at the strip's ends, the two seams at the
    // chat column's edges, and its regions faint, the one taken out left as an empty place.
    const base = [{ t: "tile", r: [0, 0, W, H], rad: 7, h: SLAB, cls: "", w: -SLAB }];
    const ch = pen();
    ch.h(2, W - 2, TOP + 2, "nf lo");
    [8, 14, 20].forEach((u) => ch.dot(u, H - 6.5, 1.5, "dot m"));
    ch.h(26, 40, H - 6.5, "nf");
    const btns = { files: L.side[2] + 4, shell: W - 11 };
    for (const k in btns) ch.ring(btns[k], H - 9.5, btns[k] + 6, H - 3.5, 1.4, k === button ? "nf hi" : "nf lo");
    // The seams in the chat's margins: faint on the window, but the one that is the part's own is drawn
    // bright over the part (`top`), since the drawer and the terminal stand forward over their own seam;
    // each rides on the edge of its own part, so it is drawn with the part, as far forward and as large.
    // The chat's column in its pane (its width the share of the pane as the window opens, whichever panel is in),
    // the drawer out in the left margin with the column nudged right for it, or the terminal in the column's
    // place. The outline's seam rides on the drawer's outer edge while it is out, and the CLI layout has no
    // outline's seam: it goes with the chat.
    const colW = colWidth(W - 4 - 58), ow = drawerW(W - 4 - 58), top = pen();
    const { col, drawer, seamL, seamR } = place(L.conv, colW, ow, L.drawer ? 1 : 0, L.cli ? 1 : 0);
    const panel = L.panel ?? (L.drawer ? drawer : L.cli ? col.slice() : null);
    if (!L.cli) seam(button === "outline" ? top : ch, seamL, "outline", button === "outline" ? "nf hi" : "nf lo", 0, button === "outline" ? " emk-in" : "");
    seam(button === "agent" ? top : ch, seamR, "agent", button === "agent" ? "nf hi" : "nf lo", 0, button === "agent" ? " emk-in" : "");
    base.push(...ch.out);
    const rects = { side: L.side, conv: col, panel };
    for (const k in rects) {
      // the chat is not drawn where the agent CLI has its place
      if (!rects[k] || (k === "conv" && L.cli)) continue;
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
    make(guides); part.forEach(make); top.out.forEach(make);

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
      // The seam rides on the part's edge, so it is drawn on whichever ring is the outer one there.
      const over = outer(button === "agent" ? 1 : -1, s);
      top.out.forEach((q) => draw(q, lift.x + PART * (1 - over), front, PN));
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
