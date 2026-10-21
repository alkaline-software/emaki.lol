# Design

The standard every page of emaki.lol is held to. The bar is the work that
wins Awwwards, the Webbys and the FWA: minimal, calm, intuitive, finished
in every state. The app is held to the same (`../emaki/AGENTS.md`, The
standard), and the site reads as the window does: its neutrals, faces and
radii are the app's, and what differs here is written here.

## Rules

- **Calm.** One accent, indigo (`--accent`), for what can be done: a link,
  the one pill a page is for, the entry you are on, the focus ring. The
  supportive colors each have one job (The palette) and never decorate. A
  page with many of the same action (two agents, Git and GitHub) draws
  them quiet.
- **Readable.** Words are set in the app's chat face, 17 px on a line of
  1.6, in a column of 60 to 75 characters. There are six sizes of type and
  nothing is set in a seventh. Bold is 600, never 700.
- **Easy to follow.** Anything a person does is numbered steps
  (`.starts`), one action each, in the order they happen, its words first
  and its controls under them. Nothing to decide inside a step: a choice
  stands before the steps.
- **Nothing jumps.** What appears, changes, opens or moves does so over a
  moment with the app's own easing (`--ease`), and not at all for someone
  who asked the system for less motion. A page fades in; the figure winds
  under the pointer; a card rises as it comes into view, once.
- **Words are few.** Say what the app does, once, to someone who can use a
  computer. A line under a name is there only where the name does not say
  it all. The current version is never written into a page: the navbar
  reads the latest from the app's releases when the page opens, the
  releases on GitHub are the record, and the download links always take
  the latest.
- **One way to draw each thing.** A button is a pill with an icon before
  its word. A group of like facts is a card on a grid. A procedure is
  steps. A reference is a table. A key is a cap. A path, a command or a
  setting is code. An agent is its mark in its color beside its name. A
  new element is a new pattern for every page, or it is not made.
- **Things line up.** One column for the words, and what is wider (a grid
  of cards) is centered on it. Every pill, tile and cap in a
  row is one height. Every edge is a hairline in the border's color, and
  nothing casts a shadow at rest, save the two windows of the shift on
  the landing page, each on a halo in its own color, and the two buttons
  in the ADE's chrome, which glow to ask for the pointer (The elements,
  The shift).
- **Every width.** From 360 to 1600 wide nothing scrolls sideways, the
  gutter is 16 px at a phone's width, and a grid folds to one column
  before its cells squeeze their words.
- **Both appearances, every state.** Light and dark are designed together,
  never one inverted: every color is a token with a value in each. A
  change is looked at in both, and in every state it has: hover, focus,
  pressed, the stars not yet fetched, a narrow window, mid-motion.
- **Accessible.** Words read on their ground at 4.5 to 1 or better and a
  control's edge at 3 to 1. A focus is visible. The figure has its
  description. Every control is reached by keyboard. A key is drawn as a
  key (`kbd`), never as code.

## The palette

Tokens in `css/theme.scss`: a value each for the light appearance
(`:root`) and the dark (`body.quarto-dark`). The neutrals are the app's
own (`../emaki/crates/emaki-app/themes/emaki.json`); the colors are the
icon's.

| Token | Job | Light | Dark |
|---|---|---|---|
| `--page` | the page, a warm paper on the light side | `#F4F1EA` | `#1A1918` |
| `--ink` | words | `#1F1E1D` | `#F3F1EA` |
| `--muted` | a line under a name, a date, a caption, an icon at rest | `#77746B` | `#A09D94` |
| `--panel` | a card, a tile, a code block | `#ECE8DF` | `#222120` |
| `--border` | every hairline | `#DED8CB` | `#32312E` |
| `--frame` | the navbar and the footer, graphite in both | `#3D3A36` | `#3A3733` |
| `--accent` | what can be done, and a figure's one bright stroke | `#5061B3` | `#94A7ED` |
| `--accent-hover`, `--accent-active` | the pill under the pointer, pressed | `#4A5BAC`, `#4050A0` | `#A0B3FB`, `#879AE0` |
| `--link` | a link among words | `#4A5BAC` | `#94A7ED` |
| `--mark` | the one bright mark: the sun, a step that is done | `#D99A1F` | `#FFB83E` |
| `--spark` | the agent's spark: a glyph, never a ground | `#715CC7` | `#B5ADF4` |
| `--seal` | the handscroll's title, 絵巻, in an old seal's faded red, and nothing else | `#A8665B` | `#D49A90` |
| `--claude`, `--codex` | an agent's mark beside its name, and nothing else | `#D97757`, `#5F9E6E` | `#D97757`, `#79B487` |
| `--sk-ochre`, `--sk-slate`, `--sk-sage`, `--sk-mauve`, `--sk-rose` | the drawings' own set, and nothing else: the files, the code, the terminal, the agent's spark, and the lights and dots (The shift); a value's color in the composer's close-ups; a panel's own color in its button, its docs page's window and its figure, the files ochre, the outline mauve, the shell sage (the agent's terminal is Claude's) | `#9E793D`, `#4489AE`, `#578F63`, `#986EA2`, `#AF6974` | `#DAB883`, `#8AC7EA`, `#99CDA3`, `#D5ADDE`, `#ECA9B2` |

Where they come from: the light page and its panels and hairlines are a
warm paper, as Kaku's site has it, with the app's ink and muted ink on it;
the dark appearance's neutrals are the app's own. The accent is the icon's
navy (`#2B2556`) lifted to read on either page (OKLCH hue 272, chroma 0.13
light and 0.105 dark); the mark is its amber bar and the spark its violet;
the agents' colors are the app's own for them (`look::ACCENTS`).
Terracotta, the app's default accent, is Claude's color here, beside
its name and in the agent's terminal, and never
the page's. Amber is never text. The frame is graphite given the
accent's hue (OKLCH L 0.35, C 0.04, h 272, a step darker in the dark
appearance), so the navbar and the footer belong to the accent without
being it; on it the accent is its dark shade in both appearances. The shift's set is five hues at one lightness and chroma (OKLCH L
0.60, C 0.09 on the light page; L 0.80, C 0.08 on the dark), so a drawing
of many panes reads as one calm, warm family and not as colors picked one
by one; it is the drawings' alone. A color that is not a token is a
mistake.

## The type

Three faces, each with one job, as the window has them:

- **Words**: Source Serif 4, the app's first chat face. Body, headings,
  the cards' words, the steps.
- **The chrome**: the system's sans (`--font-ui`). The navbar, pills,
  caps, chips, labels, table heads, dates, the footer: everything that is
  a control or a label rather than a sentence.
- **Code**: JetBrains Mono, the app's first monospace face, at 0.9 em of
  the words around it.
- **The name**: Optima where the system has it, else Belleza, regular
  weight, as the app's sidebar sets it.

Six sizes: the hero's name (3 to 4.75 rem by the window), h1 2.25 rem, h2
1.5 rem, h3 1.125 rem, body 1.0625 rem (17 px; 16 px below 600 wide),
small 0.875 rem for labels, captions and caps.

## The page

- The navbar is the frame: graphite with the accent's hue in both
  appearances, the name in the accent's dark shade, the words in the
  paper color. Four things at the
  left, as Kaku's has them: the icon and the name, which is the way home;
  the app's latest version in the code face, read from its releases when
  the page opens and opening them on GitHub; Docs; About. At the right
  the appearance toggle, the source with its stars, and the search, each
  a quiet tile. The app's icon and the tiles are one size, 30 px square
  (`$tile`; the icon's drawing, its image a little larger for the margin
  round it), their glyphs 16, and the name beside the icon is set to it
  (1.6 rem, set solid). The bar is thin: 0.45 rem above and below. Below 992 wide the menu button is a tile of the same kind at
  the left, and the links fold out under it flush left, each with its
  icon: the latest release's box, Docs' open book, About's info. Its icons
  and the search's are the paper in both appearances (`$navbar-bg` and
  `$navbar-fg` in both sheets, or Bootstrap picks them by contrast with
  the accent).
- The page is Kaku's width, 1280 at most: a menu of 220 at the left,
  the words in 804 in the middle, the table of contents in a column of
  200 at the right, and 28 between them (`grid` in `_quarto.yml`). On the
  Docs pages the menu lists the section's pages, as Kaku's docs have it,
  in four groups with a hairline between: Get Started; Main System, the
  two things always in the window, Projects and Chats; Panels, the
  four of them named without the word; and Settings and Keys, a size
  down. The two middle groups carry their name as a small label in the
  UI face. The page showing wears a short rounded bar in the
  accent at its row's left, as the app's sidebar marks the session
  showing, and its name in the accent. About has the words and the table
  of contents without the menu; the landing page has neither. Below 992
  the menu folds into the navbar's toggle and the table of contents goes
  above the words. A docs page is a title, one line under it, and
  `##` sections with an icon each, and it ends with the way to the page
  before and the page after.
  The landing page uses the full width and centers one column, Kaku's
  1152 px (`--w-page`), for everything on it. The hero is one column,
  centered, and keeps what the app is for the shift under it: the
  handscroll alone, wide and short (a sheet 400 long for the app's 300,
  at most 30 rem, about 140 px tall), so it intrigues and takes little
  room; then the name with its own characters
  beside it, the one line, and the download and Get Started. Under it a
  hairline across the whole page, as Kaku's site closes its head, and
  the first band after 3.5 rem of air. Between the sections below it a
  softer line (`.rule`), the column's width, the hairline's color fading
  out at both ends, with 3.5 rem of air over it and the next heading's
  under it. From 992 wide a band of words is
  split as Kaku's sections are, the heading in the left part and the
  words in the right, so the words keep a reading measure; Get started's
  three steps (`.starts`) take the whole width, three to a row where
  their column is 640 wide, each a card with its numbered disc, its words and its links; the
  shift is its two windows side by side, each as wide as its half, an
  arrow across between them, centered on both, and each one's words
  under it, so the two halves are one shape and the words keep a reading
  measure; the cards of a group
  of the app's parts (`.cards-2`) are two to a row, as the docs' menu
  groups them. Below 992 everything stacks in one column, the shift a
  window at most 30 rem, its words, the arrow turned down, and the next; the cards two to a row and
  one under 640.
- A section begins with its h2 and 3 rem of air above it. There is no rule
  under a heading; the air and the table of contents do that work. The
  landing page's sections are parted by the soft line above (`.rule`),
  and a docs page's sections by the same line, drawn by the sheet in the
  air over each h2 after the first; never by a rule under a heading.
- Radii: 8 px for a tile, a block of code and a cap; 12 px for a card;
  a full round for a pill. A shadow only on what floats (a menu, the
  search).
- The footer is the frame again, one line fixed at the window's foot on
  every page, as the navbar is at its head, in three parts of equal width:
  who at the left, a link to the studio on GitHub, in the body's face as
  words are; the icon
  and the name in the middle, as the navbar sets them; the source at the
  right as a mark alone. The page leaves its height free under the words.
  The full credits are on the About page.

## The elements

- **Pill** (`.pill`): `[Download](install.qmd){.pill .pill-accent
  .i-download}`. A full round, 2.5 rem tall, the icon 1.1 em before its
  word. `.pill-accent`, filled, is for the one thing the page is for;
  the rest are quiet, a hairline and the ink.
- **Card** (`.cards > .card`): the panel's ground, a hairline, radius 12,
  an icon in the muted ink or a figure, an h3 and one paragraph. A card is
  not a link; its h3 may be, the part's name in the ink, the accent under
  the pointer, to the part's page, with the part's key at the far end.
  A card of one of the app's parts is washed faintly in the part's own
  color (6% into the panel's ground, its hairline 16%): the main
  system's two in the accent, each panel in its own. Its name and its
  figure both go to the part's page; the name is in a deep shade of the
  part's color (62% of it in the ink), nearer the color under the
  pointer (85%), deepest pressed (45%), the same once visited.
- **Steps** (`.starts > .start`): a card a step, on the landing page
  and on Get Started alike: a numbered disc, an h3, a line or two, and
  its controls at the card's foot (the compact download,
  `_download-step.html`, or a pair of pills in equal widths), so the
  three rows line up. Three to a row where the column is 640 wide, one
  under the other in less.
- **The layout** (`.layout`, Get Started): Emaki's window on Hairline as
  the app opens it, the sidebar and the chat, and the six parts named
  around it: the four panels over it, Files, Outline, Shell Terminal and
  Agent Terminal, each its name over its key, with a leader to its
  button in the chrome; Projects and Chats under it, with leaders to the
  projects' box in the sidebar (not the sidebar whole: New Session, All
  Sessions and Agents are over it) and to the chat. A few of the app's
  own words say it is Emaki's window, small, in the wordmark's face and
  the muted ink: the icon and the name in the accent in the chrome, the
  sidebar's three rows with their icons, the projects' heading and the
  open project's name; the chat and the panels stay lines. Each part is in its
  own color: its frame and faint wash, its leader, its button and its
  name in the shade a part's card gives it. The panels are hidden until
  the pointer finds a panel's button or its name: then it slides in
  from its side while the chat makes room, its button fills, and its
  leader runs on to its head: the middle of it for the outline and the
  shell, the outer corner for the files and the agent's terminal, so no
  leader crosses a button, the name or a panel. A lit part stands forward as a part does
  in the six figures, and its name nears its color. Where the box is
  under 720 wide the names are tiles under the window, two to a row and
  one under 480, washed as a part's card is, the key at the far end, and
  the box keeps room under the window for a part standing forward.
  The same window opens each part's docs page (`.layout-page`, under the
  title, centered and at most 36 rem wide): no names, only that part in
  its color, the rest in the window's gray at half strength, so the six
  pages read as one window looked at six ways. A panel's page has its
  panel in from the start, its button filled; the pointer on the button
  puts it away and on the part brings it forward.
- **People** (`.people > .person`): who makes it, on the About page. A
  picture from `assets/team/`, a name in bold that is a link, and a line
  or two. A person's picture is a circle; the studio's mark
  (`.person-org`) a rounded square.
- **The docs menu** (`#quarto-sidebar`): the pages in the words' serif
  at 0.95 rem, in the muted ink, the ink under the pointer; the page
  showing in the accent with a 3 px bar, 56% of the row's height and
  rounded, at the row's left; a hairline between the groups
  (`.sidebar-divider`), a group's label over its pages
  (`.sidebar-item-section`) in small spaced capitals in the UI face, a
  shade lighter than the muted ink, with the plain arrow over it, so it
  reads as a heading and not a link, and the last group's pages at
  0.85 rem. The table of contents is in the same serif, a size down,
  under its label in the UI face.
- **Page navigation** (`.page-navigation`, Quarto's, on the docs pages):
  under a hairline at the page's foot, the page before at the left and
  the page after at the right, each a quiet word in the chrome's face
  with the app's arrow beside it, the ink under the pointer. The way
  runs through the whole menu, across the groups (`js/page.js`).
- **The settings sheet** (Settings, `layout-settings`): the layout's
  window, gray at half strength, and the sheet standing forward over its
  main area with its shadow under it: the rail of the eight sections at
  the left, the one showing washed, and its name over its groups at the
  right, each group a card of rows, a name at the left and the control
  at the right as the app lays them: Appearance's look and seven accents
  (the chosen one ringed), Fonts' two faces and text size, New
  sessions' agent and its three, Updates' switch and button. The
  pointer on a section in the rail shows it.
- **The composer's foot** (Chats, `composer-pills` and
  `composer-status`, composer.js): the chat's face close up as a slab,
  the composer on it and the status line under it, in the layout's
  strokes and the app's own words. On Mode, model and effort the pills
  are the figure's own and the status line gray; a pill under the
  pointer opens its list over it, standing forward with its shadow,
  the current row washed and ticked, and a row under the pointer puts
  its value on the pill, which grows to fit it and moves the next. On
  Status line the box is cut to the composer's last row and the line,
  the composer gray; a part under the pointer stands forward on a plate
  in the accent and shows a higher number. Each mode, level and number
  is in the agent's color in the nearest of the set: the muted ink for
  manual, mauve for accept edits and extra high, slate for plan, ochre
  for auto and low, sage for medium, the accent for high, max in three
  through its letters; the context sage, ochre from 70% and rose from
  85%; a limit slate, mauve from 70% and rose from 90%.
- **The kinds of file** (`.types`, on the Files Panel page): a tile a
  kind, two to a row and one under 600 wide, the icon in the accent at
  the left, the name in the ink and one line under it in the muted ink.
- **The download** (`.dl`, `_download.html`): one control on the landing
  page. The accent pill takes the installer for this computer, which
  `js/page.js` names from the browser ("Download for macOS"), and the
  segment at its right, a chevron, opens the other systems in a menu
  that floats as a menu does, this computer's marked with a check. A Mac
  whose chip cannot be read gets the Apple silicon build and the menu
  offers the Intel one. Without the script the pill takes the latest
  release and the menu is a list of four. The two parts are one accent
  pill, the chevron's part a lighter tint of it past a light seam; the menu is white on the paper
  (`--pop-bg`), 14 px round, a row an installer. Beside it, a quiet pill,
  Get Started, with the play glyph, into the docs.
- **Keys**: `[⌘K]{.kbd}`, a cap in the chrome's face. Named as the Mac
  has them; the keyboard table says once that ⌘ is Ctrl elsewhere.
- **Tables**: hairline rows, the head in the muted ink, no vertical lines,
  no zebra.
- **Code**: a block on the panel's ground with a hairline; inline, the
  accent on its faint plate.
- **Note** (`.note`): an aside with a hairline at its left, in the muted
  ink, for what most readers can skip.
- **The handscroll** (`_hero.html`): the figure of the app's own, its
  lines in the ink and its sun in the mark, and the name in its own
  characters, 絵巻, written down the sheet's sky at its head in a heavy
  Mincho face and an old seal's faded red, as a scroll carries its title; they stay while the picture winds,
  and the sheet's clip keeps them off the roll. On the landing page it
  stands over the name; on the About page, under The name, at the
  column's width (`.about-fig`). One to a page: the script finds it by id.
- **The shift** (`_shift-ide.html`, `_shift-ade.html`): under "From the
  IDE to the ADE", two windows seen from the front, side by side with an
  arrow across from the one to the other, centered on both, and each
  one's words under it, headed by the window's name, small; one under the
  other below 992, the arrow turned down; each
  pane in each window a box with its name in it, as Positron's
  own diagram of its window names its regions, drawn in the handscroll's
  manner. The left is an editor's window as one has it today, its panes
  named: Activity Bar, File Browser with Outline and Timeline folded under
  it, Code, a Terminal under the code, and the Agent Chat squeezed into a
  pane at the right edge, one dial among the dials. The right is Emaki's:
  New Chat and Chats in the sidebar, a project a folder with its chats
  stepped in under it along a guide line and one of them live, two more
  projects folded under, Agent Chat in the middle, and the four panels,
  Files, Outline, Shell Terminal and Agent Terminal, nowhere until the
  pointer finds their buttons. The structure in the muted ink and the
  two borders, the words' stand-ins in the ink, and everything else in
  the shift's own set (The palette), each box in one color with its name
  in the same: ochre for the files, mauve for the outline, slate for the
  code, sage for the terminal, Claude's terracotta for the agent's
  terminal, mauve for the agent's spark, the lights and the dots in rose,
  ochre and sage, and the accent on the agent chat and on what can be
  done. The terminal is sage in both windows and the agent chat the
  accent in both, so the eye finds each in each, the one small at the
  edge, the other in the middle. The
  names are in the wordmark's face, as the name beside the icon is, in
  title case, 8 of 320 units (the chat's 10, the folded panes' 6.5), on
  a halo in the page's color so they read over the lines they cross. Each window has a frame heavier than the lines inside it and
  a halo under it, in its own color: the IDE's gray and faint, the ADE's
  the accent. The ADE carries the name, in the wordmark face beside the
  app's icon, as its sidebar has them: of the two it is the one that is
  Emaki, and the one the page is for.
  One over the other, each beside its words, the arrow down between the
  windows; one column below 992 wide.
  Both answer the pointer as a hover: the box under it lights in place
  over 160 ms, its edge heavier, its face washed a little in its color
  and its name in the ink, and nothing travels between boxes. The ADE
  has four buttons in its chrome, as the app has them, two at each end in
  a frame: the files' and the outline's at the main area's left end, the
  shell terminal's and the agent terminal's at the right, each in its
  panel's own color. At rest each glows, its face
  washed in its color on a soft halo of the same, still, the only lit
  things in the chrome, to ask for the pointer. When the pointer finds
  one its pane slides in from its side and the chat makes room
  (`js/shift.js`), as the app does when the button is pressed: files or
  outline between the sidebar and the chat, a terminal at the right, the
  two of a side sharing it, so one coming puts the other away, and a
  side each at once if both are asked. The button fills solid while its pane is
  out. The pane stays until the pointer passes over the button again,
  which sends it away, and the next pass brings it back. The first
  project's folder in the sidebar is a toggle of the same kind, in the
  files' ochre and glowing in both its states: a pass over its row folds
  the chats up into it and the projects under them close up, as a click
  on the row does in the app, and the next pass opens it again. Off the
  sketch altogether everything returns to rest: the panes away, the
  project open. On a phone the light walks the
  boxes on its own while the figure is in view, and each panel comes out, and the project folds,
  at its turn. Under reduced motion the whole picture stands at rest,
  the files and the shell out and the project open.
- **Figures** (`.fig[data-figure]`): isometric line drawings on
  Hairline's engine, which answer the pointer, in the handscroll's
  manner. One shows what a card is about: for each of the app's parts
  Emaki's window, seen from
  the front, faint at the back, with that part
  standing forward of it as a layer of its own, drawn in full with its
  frame bright in the part's own color and its face washed in it,
  drawn larger as it stands nearer the eye, from its head down, with a
  soft shadow on the window under it, and dashed guides back to the
  empty place it left, so it reads as forward straight on. The
  pointer turns the window to either side, so the layers part and close,
  and on the part brings it further forward. A
  figure sets no color of its own: its plate is the ground it stands on,
  its bright stroke the accent, or on a panel's the panel's own color
  (The palette), its silhouettes the muted ink, the rest the two
  borders. In a card it is 86% of the width over the words, or 88% and
  at most 25 rem two to a row. They stand
  composed until touched, and rest under reduced motion.

## Motion

- Easing `--ease`, gpui's ease_out_quint. 160 ms for a hover, 240 ms for
  something that appears, 400 ms for the page's fade.
- The content fades in on each page. On the landing page a `.rise`
  element rises 16 px and fades as it comes into view, once, cards in a
  grid a beat apart. Not on the documentation pages, where a jump to a
  heading would catch it mid-motion.
- A figure answers the pointer on Hairline's own clocks, a spring for
  where and a 700 ms ease for which, and sleeps when nothing moves. The
  shift's boxes light as a hover, 160 ms in place, and its terminal
  slides on the handscroll's spring.
- Under `prefers-reduced-motion`, none of it, and the figures and the
  shift at rest, the shift with a panel out on each side.

## Checking

Render, then look at every page in both appearances at 1280 and 390 wide,
whole and close up. Playwright's own command does it without a script:

```sh
npx playwright screenshot --full-page --viewport-size=1280,900 \
  --color-scheme=dark http://localhost:5680/install.html install-dark.png
```

Then go round again: what is out of line, louder than it needs to be, or
not consistent with its neighbors is fixed and shot again, until nothing
is left to change.
