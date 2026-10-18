// The landing page's figures: six of Emaki's own parts drawn on Hairline's
// engine (scripts/figures/emaki/).
// scripts/figures/build.sh bundles this file into js/figures.js, which the
// pages load.
//
// A figure is a `.fig` element with `data-figure="<name>"`; `data-play` makes
// it walk its tour until the pointer arrives, and its aria-label, set in the
// markup, is left as it is. The plate and the four strokes are the page's
// tokens (css/theme.scss, Figures).
import { create } from "hairline/mount.ts";
import { TABLE } from "hairline/intensity.ts";
import { figure } from "./emaki/window.js";

// Emaki's figures, each with the one number its engine takes at intensity
// 0, 0.5 and 1, put into Hairline's table so its wrapper reads them as its
// own figures' (hairline/intensity.ts).
const OWN = {
  projects: { engine: figure({ layout: "plain", focus: "side" }), label: "Emaki's window with its sidebar standing forward of it: projects, the open one with its sessions." },
  chats: { engine: figure({ layout: "plain", focus: "conv" }), label: "Emaki's window with its chat standing forward of it: the transcript and the composer." },
  files: { engine: figure({ layout: "left", focus: "panel", region: "tree", button: "files" }), label: "Emaki's window with its files panel standing forward of it: the tree with git's marks." },
  outline: { engine: figure({ layout: "left", focus: "panel", region: "outline", button: "outline" }), label: "Emaki's window with its outline standing forward of it: an entry for every prompt." },
  shell: { engine: figure({ layout: "right", focus: "panel", region: "shell", button: "shell" }), label: "Emaki's window with its shell terminal standing forward of it, in tabs." },
  agent: { engine: figure({ layout: "right", focus: "panel", region: "agent", button: "agent" }), label: "Emaki's window with the agent's own terminal standing forward of it." },
};

const FIGURES = {};
for (const id in OWN) {
  const f = OWN[id];
  TABLE[id] = [14, 22, 30]; // how far forward the part stands, viewBox units
  FIGURES[id] = (el, options) => create({ id, label: f.label, rest: "rest", engine: f.engine }, el, options);
}

function mountAll() {
  const hosts = document.querySelectorAll(".fig[data-figure]");
  for (let i = 0; i < hosts.length; i++) {
    const el = hosts[i];
    const figure = FIGURES[el.getAttribute("data-figure")];
    if (!figure || el.hasAttribute("data-hairline")) continue;
    figure(el, { play: el.hasAttribute("data-play") });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
else mountAll();
