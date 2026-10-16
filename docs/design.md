# Design

The standard every page of emaki.lol is held to. The bar is the work that
wins Awwwards, the Webbys and the FWA: minimal, calm, intuitive, finished
in every state. The app is held to the same (`../emaki/AGENTS.md`, The
standard), and the site reads as the window does: its neutrals, faces and
radii are the app's, and what differs here is written here.

## Rules

- **Calm.** One accent, indigo (`--accent`), for what can be done: a link,
  the one pill a page is for, the entry you are on, the focus ring. The
  supportive colours each have one job (The palette) and never decorate. A
  page with many of the same action (four downloads) draws them quiet.
- **Readable.** Words are set in the app's chat face, 17 px on a line of
  1.6, in a column of 60 to 75 characters. There are six sizes of type and
  nothing is set in a seventh. Bold is 600, never 700.
- **Easy to follow.** Anything a person does is numbered steps on a rail,
  one action each, in the order they happen, its words first and its
  command under them, as the app's Agents page has it. Nothing to decide
  inside a step: a choice stands before the steps.
- **Nothing jumps.** What appears, changes, opens or moves does so over a
  moment with the app's own easing (`--ease`), and not at all for someone
  who asked the system for less motion. A page fades in; the figure winds
  under the pointer; a card rises as it comes into view, once.
- **Words are few.** Say what the app does, once, to someone who can use a
  computer. A line under a name is there only where the name does not say
  it all. The current version is never written on a page: the releases
  page is the record, and the download links always take the latest.
- **One way to draw each thing.** A button is a pill with an icon before
  its word. A group of like facts is a card on a grid. A procedure is
  steps. A reference is a table. A key is a cap. A path, a command or a
  setting is code. An agent is its mark in its colour beside its name. A
  new element is a new pattern for every page, or it is not made.
- **Things line up.** One column for the words, and what is wider (a grid
  of cards, the downloads) is centred on it. Every pill, tile and cap in a
  row is one height. Every edge is a hairline in the border's colour, and
  nothing casts a shadow at rest.
- **Every width.** From 360 to 1600 wide nothing scrolls sideways, the
  gutter is 16 px at a phone's width, and a grid folds to one column
  before its cells squeeze their words.
- **Both appearances, every state.** Light and dark are designed together,
  never one inverted: every colour is a token with a value in each. A
  change is looked at in both, and in every state it has: hover, focus,
  pressed, the stars not yet fetched, a narrow window, mid-motion.
- **Accessible.** Words read on their ground at 4.5 to 1 or better and a
  control's edge at 3 to 1. A focus is visible. The figure has its
  description. Every control is reached by keyboard. A key is drawn as a
  key (`kbd`), never as code.

## The palette

Tokens in `css/theme.scss`: a value each for the light appearance
(`:root`) and the dark (`body.quarto-dark`). The neutrals are the app's
own (`../emaki/crates/emaki-app/themes/emaki.json`); the colours are the
icon's.

| Token | Job | Light | Dark |
|---|---|---|---|
| `--page` | the page | `#FBFBFA` | `#1A1918` |
| `--ink` | words | `#1F1E1D` | `#F3F1EA` |
| `--muted` | a line under a name, a date, a caption, an icon at rest | `#77746B` | `#A09D94` |
| `--panel` | a card, a tile, a code block | `#F0EFED` | `#222120` |
| `--border` | every hairline | `#DFDFDC` | `#32312E` |
| `--frame` | the navbar and the footer, graphite in both | `#3D3A36` | `#3A3733` |
| `--accent` | what can be done | `#5061B3` | `#94A7ED` |
| `--accent-hover`, `--accent-active` | the pill under the pointer, pressed | `#4A5BAC`, `#4050A0` | `#A0B3FB`, `#879AE0` |
| `--link` | a link among words | `#4A5BAC` | `#94A7ED` |
| `--mark` | the one bright mark: the sun, a step that is done | `#D99A1F` | `#FFB83E` |
| `--spark` | the agent's spark: a glyph, never a ground | `#715CC7` | `#B5ADF4` |
| `--claude`, `--codex` | an agent's mark beside its name, and nothing else | `#D97757`, `#5F9E6E` | `#D97757`, `#79B487` |

Where they come from: the accent is the icon's navy (`#2B2556`) lifted to
read on either page (OKLCH hue 272, chroma 0.13 light and 0.105 dark); the
mark is its amber bar and the spark its violet; the agents' colours are the
app's own for them (`look::ACCENTS`). Terracotta, the app's default accent,
is Claude's colour here and never the page's. Amber is never text. On the
frame, which is graphite in both appearances, the accent is its dark shade
in both. A colour that is not a token is a mistake.

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

- The navbar is the frame: graphite in both appearances, the name in the
  accent's dark shade, the links in the paper colour.
- The words stand in a column 640 px wide at most, centred; the table of
  contents is at its right from 992 wide and above the words below it.
  The landing page uses the full width and centres its own columns: 46 rem
  for the hero, 40 rem for a band of words, 48 rem for a grid of cards,
  two by two.
- A section begins with its h2 and 3 rem of air above it. There is no rule
  under a heading; the air and the table of contents do that work.
- Radii: 8 px for a tile, a block of code and a cap; 12 px for a card;
  a full round for a pill. A shadow only on what floats (a menu, the
  search).
- The footer is the frame again: the licence at the left, Quarto in the
  middle, the two repositories at the right, small, in the chrome's face.

## The elements

- **Pill** (`.pill`): `[Download](install.qmd){.pill .pill-accent
  .i-download}`. A full round, 2.5 rem tall, the icon 1.1 em before its
  word. `.pill-accent`, filled, is for the one thing the page is for;
  the rest are quiet, a hairline and the ink.
- **Card** (`.cards > .card`): the panel's ground, a hairline, radius 12,
  an icon in the muted ink, an h3 and one paragraph. A card is not a link.
- **Steps** (`.steps`): an ordered list. Each item is a numbered disc on a
  rail, an h3, its words, and any command in a code block under them.
- **Downloads** (`.downloads > .download`): four tiles, each the
  system's mark (the app's own `os/` icons), its name and a chip. The
  visitor's own system is marked by `js/page.js`, which tells a Mac's
  chip by its graphics renderer and marks both Mac tiles when it cannot.
- **Agents** (`.agents > .agent`): the agent's mark in its colour, its
  name in bold, and what Emaki does with it.
- **Checks** (`.checks`): a list with a check before each item, for what
  holds.
- **Keys**: `[⌘K]{.kbd}`, a cap in the chrome's face. Named as the Mac
  has them; the keyboard table says once that ⌘ is Ctrl elsewhere.
- **Tables**: hairline rows, the head in the muted ink, no vertical lines,
  no zebra.
- **Code**: a block on the panel's ground with a hairline; inline, the
  accent on its faint plate.
- **Note** (`.note`): an aside with a hairline at its left, in the muted
  ink, for what most readers can skip.
- **The figure** (`_hero.html`): the handscroll, its lines in the ink and
  its sun in the mark.

## Motion

- Easing `--ease`, gpui's ease_out_quint. 160 ms for a hover, 240 ms for
  something that appears, 400 ms for the page's fade.
- The content fades in on each page. On the landing page a `.rise`
  element rises 16 px and fades as it comes into view, once, cards in a
  grid a beat apart. Not on the documentation pages, where a jump to a
  heading would catch it mid-motion.
- Under `prefers-reduced-motion`, none of it, and the figure at rest.

## Checking

Render, then look at every page in both appearances at 1280 and 390 wide,
whole and close up. Playwright's own command does it without a script:

```sh
npx playwright screenshot --full-page --viewport-size=1280,900 \
  --color-scheme=dark http://localhost:5680/install.html install-dark.png
```

Then go round again: what is out of line, louder than it needs to be, or
not consistent with its neighbours is fixed and shot again, until nothing
is left to change.
