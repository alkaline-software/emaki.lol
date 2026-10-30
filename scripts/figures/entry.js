// The site's figures, drawn on Hairline's engine (scripts/figures/emaki/):
// six of Emaki's own parts on the landing page, the layout, the whole
// window with the six named around it, on Get Started, and the same window
// at the head of each part's docs page, that part alone in color, the
// settings' sections one by one on Settings (settings.js), the composer's
// foot close up on Chats (composer.js), and the shift's two windows on the landing page,
// the IDE's (ide.js) and Emaki's, each pane named in it.
// scripts/figures/build.sh bundles this file into js/figures.js, which the
// pages load.
//
// A figure is a `.fig` element with `data-figure="<name>"`; `data-play` makes
// it walk its tour until the pointer arrives, as a figure with a tour of its
// own does on a screen with no pointer to hover; its aria-label, set in the
// markup, is left as it is. The plate and the four strokes are the page's
// tokens (css/theme.scss, Figures).
import { create } from "hairline/mount.ts";
import { TABLE } from "hairline/intensity.ts";
import { figure } from "./emaki/window.js";
import { ADE_TOUR, layout } from "./emaki/layout.js";
import { IDE_TOUR, ide } from "./emaki/ide.js";
import { composer } from "./emaki/composer.js";
import { settings } from "./emaki/settings.js";

// Emaki's figures, each with the one number its engine takes at intensity
// 0, 0.5 and 1, put into Hairline's table so its wrapper reads them as its
// own figures' (hairline/intensity.ts).
const OWN = {
  projects: { engine: figure({ layout: "plain", focus: "side" }), label: "Emaki's window with its sidebar standing forward of it: projects, the open one with its sessions." },
  chats: { engine: figure({ layout: "plain", focus: "conv" }), label: "Emaki's window with its chat standing forward of it: the transcript and the composer." },
  files: { engine: figure({ layout: "left", focus: "panel", region: "tree", button: "files" }), label: "Emaki's window with its files panel standing forward of it: the tree with git's marks." },
  outline: { engine: figure({ layout: "drawer", focus: "panel", region: "outline", button: "outline" }), label: "Emaki's window with its outline standing forward of it: the drawer at the chat's left edge, an entry for every round." },
  shell: { engine: figure({ layout: "right", focus: "panel", region: "shell", button: "shell" }), label: "Emaki's window with its terminal panel standing forward of it, in tabs." },
  agent: { engine: figure({ layout: "cli", focus: "panel", region: "agent", button: "agent" }), label: "Emaki's window with the agent's own terminal standing forward of it, in the chat's place." },
  layout: { engine: layout(), label: "Emaki's window as it opens, the sidebar and the chat, with the six parts named around it.", lift: [8, 12, 16] },
  // The same window at the head of each part's docs page, that part alone in its color.
  "layout-projects": { engine: layout({ focus: "projects" }), label: "Emaki's window with the projects in color in the sidebar, the rest gray.", lift: [8, 12, 16] },
  "layout-chats": { engine: layout({ focus: "chats" }), label: "Emaki's window with the chat in color, the rest gray.", lift: [8, 12, 16] },
  "layout-files": { engine: layout({ focus: "files" }), label: "Emaki's window with the files panel shown in color at the chat's left, the rest gray.", lift: [8, 12, 16] },
  "layout-outline": { engine: layout({ focus: "outline" }), label: "Emaki's window with the outline's drawer out in color at the chat's left edge, the rest gray.", lift: [8, 12, 16] },
  "layout-shell": { engine: layout({ focus: "shell" }), label: "Emaki's window with the terminal panel shown in color at the chat's right, the rest gray.", lift: [8, 12, 16] },
  "layout-agent": { engine: layout({ focus: "agent" }), label: "Emaki's window with the agent CLI in color in the chat's place, the rest gray.", lift: [8, 12, 16] },
  // Settings: each section's groups on their own, their controls worked by a click.
  "settings-appearance": { engine: settings({ section: "appearance" }), label: "The Appearance section of Emaki's settings." },
  "settings-fonts": { engine: settings({ section: "fonts" }), label: "The Fonts page of the Text section of Emaki's settings." },
  "settings-size": { engine: settings({ section: "size" }), label: "The Size page of the Text section of Emaki's settings." },
  "settings-conversation": { engine: settings({ section: "conversation" }), label: "The Conversation section of Emaki's settings." },
  "settings-models": { engine: settings({ section: "models" }), label: "The Model calls section of Emaki's settings." },
  "settings-sessions": { engine: settings({ section: "sessions" }), label: "The New sessions section of Emaki's settings." },
  "settings-panels": { engine: settings({ section: "panels" }), label: "The Panels section of Emaki's settings." },
  "settings-files": { engine: settings({ section: "files" }), label: "The Files section of Emaki's settings." },
  "settings-terminal": { engine: settings({ section: "terminal" }), label: "The Terminal section of Emaki's settings." },
  "settings-shortcuts": { engine: settings({ section: "shortcuts" }), label: "The Shortcuts section of Emaki's settings." },
  // Chats: the composer's foot close up, the pills or the status line its own.
  "composer-pills": { engine: composer({ focus: "pills" }), label: "The foot of Emaki's composer, close up, with its mode, effort and model pills." },
  "composer-status": { engine: composer({ focus: "status" }), label: "The status line under Emaki's composer, close up." },
  // The shift: an IDE's window and Emaki's, side by side, each pane named, still.
  "shift-ide": { engine: ide(), label: "An IDE's window with its panes named.", lift: [8, 12, 16], tour: IDE_TOUR },
  "shift-ade": { engine: layout({ named: true }), label: "Emaki's window with its panes named.", lift: [8, 12, 16], tour: ADE_TOUR },
};
const coarse = window.matchMedia("(hover: none)");

const FIGURES = {};
for (const id in OWN) {
  const f = OWN[id];
  TABLE[id] = f.lift ?? [14, 22, 30]; // how far forward the part stands, viewBox units
  FIGURES[id] = (el, options) => create({ id, label: f.label, rest: "rest", engine: f.engine, tour: f.tour }, el, options);
}

function mountAll() {
  const hosts = document.querySelectorAll(".fig[data-figure]");
  for (let i = 0; i < hosts.length; i++) {
    const el = hosts[i];
    const name = el.getAttribute("data-figure"), figure = FIGURES[name];
    if (!figure || el.hasAttribute("data-hairline")) continue;
    figure(el, { play: el.hasAttribute("data-play") || (!!OWN[name].tour && coarse.matches) });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
else mountAll();
