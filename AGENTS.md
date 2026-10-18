# AGENTS.md

## What this is

**emaki.lol** is the website for [Emaki](https://github.com/alkaline-software/emaki),
a Quarto site served at <https://emaki.lol>. It has a landing page with the
handscroll alone at its head, small, which keeps what the app is for
the shift under it, then the shift and the figures; a Docs section with a sidebar, as
Kaku's docs are laid out, in four groups with a line between: Get
Started (`docs/index.qmd`, the section's address); Main System, the two
things always in the window, the sidebar (Projects) and the
Chats; Panels, Files, Outline, Shell Terminal and Agent Terminal;
then Settings and Keys, a size down; and About. The navbar is
four things, as Kaku's is: the name, the app's latest version, Docs and
About; the releases live on GitHub.
The landing page says what the app is, an ADE, an agentic development
environment, against the IDE, then how to start in three steps (the app,
the two agents, GitHub if wanted), and
then what is in it, in the docs' groups: Main system, its two parts, and
Panels, its four, a card and a figure a part, each card's name the way to
its page; the docs pages say how each part works, one page a part, in
the same order.

The app's own repo is checked out beside this one, at
`/Users/pingfan/Documents/GitHub/software/emaki` (`../emaki` from here). Its
`AGENTS.md` is what the app is and the rules it holds to; read it before writing
about how the app behaves.

## The standard

The site is held to the level of Awwwards, the Webbys and the FWA: minimal,
calm, intuitive, finished in every state. `docs/design.md` is that standard:
the rules, the palette and its roles, the faces, the page, every element,
the motion, and how a change is checked. Read it before changing anything a
person sees, and meet it unasked. A page that reads well but breaks a rule
there is not done.

## The one idea

**The site describes the app; the app is the source of truth.** Every claim on
these pages, every shortcut, face and file name, comes from the app repo.
Check it there before writing it here, and never describe a feature the app
does not have.

| On this site | Comes from |
|---|---|
| What a part does (`docs/*.qmd`, `index.qmd`) | `../emaki/README.md`, `CHANGELOG.md`, the part's doc under `docs/` (`window.md`, `panels.md`, `core.md`, `agents.md`, `composer.md`, `conversation.md`) |
| What a page says of privacy or of what git never does | `../emaki/AGENTS.md`, Rules that hold everywhere; git's and the agents page's in `docs/panels.md` and `docs/agents.md` |
| The two key tables in `docs/keys.qmd` | the `KeyBinding`s in `../emaki/crates/emaki-app/src/main.rs`: `secondary-shift-` is a panel, `secondary-` a page or one thing |
| The download links in `docs/index.qmd` and `_download.html` | the `asset:` names in `../emaki/.github/workflows/release.yml` |
| Build from source, `~/.emaki` layout, the status line | `../emaki/README.md`, `docs/core.md`, `docs/platform.md`, `docs/composer.md` |
| The dark neutrals and the inks in `css/theme.scss` | `../emaki/crates/emaki-app/themes/emaki.json` |
| The accent and the supportive colors | `docs/design.md`, The palette: the icon's own colors, lifted |
| The icons in `assets/icons/` | copied from `../emaki/crates/emaki-app/assets/icons/`, under the same names |
| `_hero.html`, `js/hero-scroll.js` | `Workbench::home_scroll` in `../emaki/crates/emaki-app/src/workbench.rs`, `scripts/home-scroll.py` |
| `_shift-ade.html`, the ADE window | the app's window, as `../emaki/docs/window.md` and `docs/panels.md` draw it, with its panes named |
| `docs/_sk/*.html`, the docs pages' sketches | the app's window, sheets and pages, as its docs draw them: `window.md` (the sidebar, the strip, settings), `panels.md` (the tree, the file's pane, the outline, Changes), `channels.md` (the terminal panel), `composer.md` |
| `js/figures.js` | `@lucasmarkes/hairline` at the tag in `scripts/figures/build.sh`; Emaki's own figures (`scripts/figures/emaki/`) from the app's parts, as the docs pages describe them |
| The version in the navbar | the app's latest GitHub release, read by `js/navbar-widgets.js` when the page opens |

When a release changes something a page describes, update that page in the same
pass. The version in the navbar follows the releases by itself; the pages do not.

## Layout

```
_quarto.yml               site config, navbar, footer, fonts
index.qmd                 landing page, full width; includes _hero.html, _download.html, _shift-ide.html and _shift-ade.html; the figures on its bands and cards
docs/index.qmd            Get Started, the Docs section's first page: download, an agent, GitHub; open a project; the window; what it keeps
docs/projects.qmd         the sidebar: projects, sessions, kept and archived, search, tabs
docs/chats.qmd            the main panel: the transcript, the composer, mode, model and effort, the status bar
docs/files.qmd            the files panel: the tree, open and edit, the kinds of file (.types), git
docs/outline.qmd          the outline panel: entries, going back
docs/shell.qmd            the shell terminal panel
docs/agent.qmd            the agent terminal panel
docs/settings.qmd         the eight sections
docs/keys.qmd             the keys in two groups: ⌘⇧ a panel, ⌘ a page or one thing
docs/_sk/                 the docs pages' sketches, one a page from one base window, written by scripts/sketches/gen.py
about.qmd                 the name and the handscroll, why, how, who makes it, credits, license
404.qmd
_hero.html                the handscroll figure, inline SVG
_download.html            the download as one control: the pill for this computer, a menu for the rest
_shift-ide.html           the shift's first row, an IDE window, inline SVG
_shift-ade.html           the shift's second row, the arrow down and Emaki's window, inline SVG
css/theme.scss            the tokens, both appearances, and every element
css/dark.scss             the dark appearance's Bootstrap knobs (Sass defaults only)
js/navbar-widgets.js      the version in the navbar, appearance toggle, GitHub stars/forks, ⌘F to the search
js/hero-scroll.js         the spring that winds the handscroll under the pointer
js/shift.js               the ADE's panes sliding in and its project folding under the pointer; the boxes light by CSS
js/sketches.js            the docs pages' sketches answering the pointer, from what each svg says of itself
js/page.js                names this computer's installer on the download and marks it among the Get Started page's tiles; the rise; the docs foot's way across the menu's groups
js/figures.js             Hairline's engine and Emaki's six parts drawn on it, built by scripts/figures/build.sh
assets/icons/             the app's Tabler icons, drawn through CSS masks
assets/team/              the studio's mark and the makers' pictures, for the About page
assets/                   the app icon and favicon
docs/design.md            the standard; not a page of the site (only `*.qmd` under docs/ render)
scripts/figures/          entry.js names the figures; emaki/ draws the app's six parts on Hairline's core; build.sh writes js/figures.js
scripts/sketches/         gen.py writes docs/_sk/*.html, the sketches, from one base window
.github/workflows/publish.yml  render on every push and PR; publish from main
```

## Running it

```sh
quarto preview   # http://localhost:5680
quarto render    # into _site/
```

Pushing to `main` renders the site and publishes it to the `gh-pages` branch;
Netlify serves `emaki.lol` from there. A pull request renders but does not
publish. So a push to `main` is a deploy: never push without the person saying
so. Nothing on the site is written from the app's releases at render time:
the version in the navbar is read by the browser, so a release needs no
render here.

## Rules

- **The version in the navbar is the browser's to read.** `_quarto.yml`
  writes the word "Releases" with the id `nav-version` and the link to the
  releases on GitHub; `js/navbar-widgets.js` swaps the word for the latest
  tag, cached for a few hours, and leaves it when the API cannot be
  reached. No version is ever written into a page.
- **Only `*.qmd` files render** (`project.render`: the root's and
  `docs/`). A markdown file anywhere (`docs/design.md`, this file) is not
  a page, and Quarto would make one of it without that list. A new docs
  page goes in `docs/` and in the sidebar's `contents` in `_quarto.yml`,
  which is also the order the foot of each page walks (`page-navigation`);
  an entry whose text is `---` is the line between two groups, and a
  `section` with no `href` is a group's label (the sheet hides its
  toggle, `bread-crumbs: false` keeps it off the title). Quarto's walk at
  the foot stops at a line, so `js/page.js` fills the way across the
  groups from the menu. The page
  is Kaku's width (`grid`: 220 for the menu, 804 for the words, 200 for
  the table of contents at the right, 28 between).
- **A docs page is one part of the app**, named as the app names it, with
  a title and one line under it, and `##` sections with an icon each
  (`{.i-<name>}`). What belongs to another part is a link to that page,
  not a second telling. The keys are on `docs/keys.qmd` alone, in two
  groups as the app binds them: `⌘⇧` and a letter shows or hides a panel,
  `⌘` and a letter opens a page or does one thing.
- **`_hero.html`, `_download.html`, `_shift-ide.html`, `_shift-ade.html` and the sketches in
  `docs/_sk/` have no blank line, not even one of spaces alone, and
  nothing under a div indented four spaces, however deep it nests.** Pandoc reads what stands between a div's
  tags as Markdown: a blank line ends the block, and a line indented four
  spaces becomes a code block. An svg's inside is left alone.
- **A `<figure>` gets Quarto's `figure` class**, and `figure.figure {
  display: block }` outranks a rule with one class. A figure whose display
  the sheet sets is selected from its parent (`.shift > .shift-pane`), or
  the rule silently loses.
- **Do not hand-edit the handscroll's layer paths.** They are generated by
  `scripts/home-scroll.py` in the app repo; re-copy them when the figure
  changes there. The constants in `js/hero-scroll.js` are the app's, so the two
  move alike; change them only to follow the app. One is the site's own:
  the box is 400 wide for the app's 300, a longer sheet so the figure is
  wide and short at the page's head (`W`; `_hero.html`'s rest geometry,
  its right roll, edges, clip and the layers' offset, are drawn for it).
  400 is as long as the landscape still covers the sheet at the farthest
  wind.
- **The keyboard is the browser's.** ⌘F on a Mac, Ctrl+F elsewhere, opens
  the search (`js/navbar-widgets.js`), and that is the only key the site
  takes: Quarto's own letters for the search (f, /, s) are turned off in
  `_quarto.yml` (`search.keyboard-shortcut: []`), and there is no
  shortcuts overlay, no button for one, and no bare letter that moves
  the page.
- **The navbar's GitHub link points at the app repo, not this one.**
  `js/navbar-widgets.js` reads the owner and repo from that link for the
  stars and forks, and skips the version's link, which also goes to
  GitHub, by its `nav-version` id.
- **Colors are tokens** (`docs/design.md`, The palette): a value in `:root`
  and one in `body.quarto-dark`. The light page is a warm paper, as
  Kaku's site has it, the dark neutrals the app's own; the accent
  is indigo, from the icon's navy; the frame is graphite given the
  accent's hue (`--frame`); the mark is its amber, the spark its
  violet; the handscroll's title, 絵巻, is an old seal's faded red
  (`--seal`) and nothing else is; terracotta is Claude's color, beside its name and on the
  agent's side of the terminal in its sketch, and never the page's; the
  shift has a set of its own (`--sk-*`), used in the sketches and the
  figures of the app's parts and nowhere else. Each panel has one color
  of its own, the same in its button, its docs sketch and its figure:
  the files ochre, the outline mauve, the shell sage, the agent's
  terminal Claude's; the sidebar and the chat keep the accent.
  A color that is not a token is a mistake.
- **An icon is a file in `assets/icons/`**, copied from the app under the
  same name, and drawn through a mask (`.i-<name>` sets `--icon`). A path in
  a stylesheet's `url()` is written from the project's root: Quarto resolves
  it when it compiles the sheet and carries the file over.
- **The appearance follows the system** (`respect-user-color-scheme`), as
  the app's does; the toggle pins one. `css/dark.scss` must set both
  `$body-bg` and `$body-color`, or Quarto does not treat the sheet as dark.
  Its defaults carry `!default`, and so do `theme.scss`'s: Quarto lays a
  later sheet's defaults under an earlier one's.
- **A button is a pill with an icon:** `[Word](page.qmd){.pill .i-download}`,
  with `.pill-accent` for the one thing a page is for. A key is
  `[⌘K]{.kbd}`, never code. A procedure is `.steps`. The rest of the
  elements are in `docs/design.md`.
- **A two-column reference table sets its widths**
  (`: {.table-keys tbl-colwidths="[26,74]"}`), or Pandoc splits it half and
  half.
- **Links are relative, and the docs are one level down.** A page under
  `docs/` sees `js/` and `assets/` as `../js/` and `../assets/`, so the
  scripts are loaded from the offset Quarto writes into each page
  (`quarto:offset`, `_quarto.yml`), the stylesheet draws the footer's icon
  (Quarto resolves a sheet's `url()` for every depth), and the footer's
  way home is the site's root, since Quarto rewrites none of the footer's
  paths. A page outside the docs sets `sidebar: false`, or Quarto's one
  sidebar shows on it too.
- **The landing page has no `title`.** The hero sets the name; `pagetitle`
  names the tab and the search entry.
- **Dictation is not Emaki's.** It moved to Kotoba, the studio's menu bar
  app (`../kotoba`); the site names Kotoba once, in Docs, Chats, The composer, and
  describes none of it.
- **The handscroll is one to a page.** `_hero.html` is included on the
  landing page and the About page; `js/hero-scroll.js` finds it by id, so
  a second copy on one page would stand still.
- **A figure is drawn on Hairline.** `js/figures.js` is generated:
  `scripts/figures/build.sh` clones Hairline at a pinned tag, bundles the
  figures `scripts/figures/entry.js` names, and writes it; never edit the
  output, and rerun the script after changing `entry.js`, a figure in
  `scripts/figures/emaki/` or the tag. The
  app's six parts (projects, chats, files, outline, shell,
  agent) are Emaki's, one engine on Hairline's core
  (`scripts/figures/emaki/window.js`), put into Hairline's own wrapper
  and its intensity table by `entry.js` (`OWN`): Emaki's window seen
  from the front, drawn faintly at the back, with the one part a figure is about standing forward of it as
  a layer of its own, in full, its frame bright, dashed guides back to
  the empty place it left, and its button in the chrome bright. The
  pointer turns the window to either side and tips it, and on the part
  brings it further forward. Each part is one drawing in `REGIONS`,
  the same for the faint copy and the layer; when the part changes in
  the app, its drawing changes with it. A figure in
  a page is `::: {.fig data-figure="<name>" aria-label="<what it
  shows>"}` with nothing inside; `data-play="true"` makes it walk its
  tour until the pointer arrives; a panel's figure takes the panel's
  color by its name (`.fig[data-figure]`, css/theme.scss). The names are the keys of `FIGURES`
  in `entry.js`.
- **The shift is drawn by hand, from the front, its panes named.**
  `_shift-ide.html` and `_shift-ade.html` are its two rows, each a window
  at the left with its words beside it in `index.qmd`, and an arrow down
  between the windows, centered on both, in the handscroll's manner,
  the strokes not scaling, and each pane a box (`.sk-box[data-pane]`, its
  rect first, its name a `<text>`) with its name in it: the names are the
  only words in the drawing besides Emaki's. The ADE window is Emaki's
  own, drawn from the app, so when the app's window changes, the sketch
  changes with it; its four panels rest beyond the main area's edges and
  slide in when the pointer finds their buttons, as the app's buttons
  toggle them, files and outline sharing the left, the two terminals the
  right, each in the panel's own color. Its colors are
  classes in `css/theme.scss` (The shift), each a token in its job; a
  color written into the svg is a mistake. A box lights under the
  pointer by CSS alone (`.sk-box:hover`), in place: nothing travels
  between boxes. `js/shift.js` moves only the four panels and the fold of the
  first project's chats, by its constants (`FILES_OUT`, `TERM_OUT`,
  `ROOM`, `CHATS_TOP`, `CHATS_H`) and the ids of what moves, so a box
  moved in the svg needs nothing in the script, and a pane or the chats
  moved needs the constants moved with them.
- **A docs page's sketch is Emaki's window with the page's part in
  color** (`docs/_sk/<page>.html`, included under the page's title). One
  base, drawn as the shift's ADE is and with its set: the sidebar, the
  chat with its composer and status row, and the four panels at
  its sides. Each page's version keeps its own part (`sk-part`) in color
  and dims the rest (`sk-dim`); the frame, the lights, the name and the
  send button are never dimmed. The things in it that can be done are
  drawn as the app has them, a button, a row, a segment, and answer the
  pointer only in the page's own part. The eight are written by
  `scripts/sketches/gen.py`; edit the script and run it, never the
  output. What answers the pointer is
  said in the svg itself and read by `js/sketches.js`: `data-go` on a hit
  names a state, `data-show` and `data-hide` fade things in and out of
  it, `data-when` with `data-rest`, `data-on` and `data-grow` move them,
  `data-home` on the figure is the state at rest and `data-still` the
  one shown with motion off (the script's head says each). A new sketch
  needs nothing in the script. A button in the chrome is a square, as
  the app's icon buttons are (`square()` in the script), its glyph small
  and in the thin stroke (`.sk-glyph`, as every button's glyph is), lit
  only where it is the page's own (`controls()`), filled while its panel
  shows, the rest faint; on Get Started all four are lit and bring their
  panels. The agent's is Claude's color, and so is its side. The
  composer's caret blinks on the Chats page (`.sk-caret`), still
  with motion off.
- **A rule on `.sk-box text` outranks a class alone.** A name's own size
  or anchor is set as `.sk-box text.sk-big`, as specific as the rule it
  overrides, or it silently loses.

## Writing

Write as the app's own docs do: plain statements, few words, nothing the reader
already knows. American spelling (color, license, center), never British
(colour, licence, centre), on every page and in these files. No dashes in prose: a comma, a colon or a full stop instead.

- Name shortcuts as the Mac has them, with the signs: `⌘K`, `⌘⇧O`, `⇧Tab`.
  The keyboard table says once that `⌘` is `Ctrl` elsewhere.
- Say what the app does now. What was tried and dropped does not belong on the
  site, and neither does the current version number.
- The main panel is the chat, its page Chats, as the ADE sketch names it
  (Agent Chat): "the chat", or "agent chat" where the agent is the
  point, everywhere on the site, labels and sketches included; never
  "conversation".
- The app is an ADE, an agentic development environment: the chat
  in the middle, the files, git and the terminal at its side. Say it that
  way, against the IDE, once, on the landing page; the other pages take it
  as read.
- A claim about privacy or safety (no hooks, nothing written to a transcript,
  nothing in a session's context) must match the app's `AGENTS.md` word for
  word in meaning. If the app's rules change, these pages change with them.

## Checking a change

Render it and look at every page it touches in both appearances, at 1280 and
390 wide, whole and close up, and in every state it has (`docs/design.md`,
Checking: a Playwright one-liner shoots a page). A change to `css/`, `js/`,
`_hero.html` or `_download.html` is checked on the landing page, where all three meet, and a
change to an element on every page that has one.
