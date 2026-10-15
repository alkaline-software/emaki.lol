# Install

Download the installer for your system. Each link takes the asset from the [latest release](https://github.com/alkaline-software/emaki/releases/latest).

[**macOS** Apple silicon](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-arm64.dmg) [**macOS** Intel](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-x64.dmg) [**Windows** x64](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-windows-x64-setup.exe) [**Linux** x64](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-x64.AppImage)

The Mac downloads are disk images, Windows an installer, Linux an AppImage. A `.deb` is on the [release page](https://github.com/alkaline-software/emaki/releases/latest) too.

macOS 14 or later. The Mac image is signed and notarized, so it opens without argument. Windows is unsigned, so SmartScreen asks once: *More info*, then *Run anyway*.

## You need an agent first

Emaki reads and drives the coding agents already on your machine, so at least one of them has to be installed and signed in:

- [Claude Code](https://docs.claude.com/en/docs/claude-code) — fully supported: read, search, and continue a session from the window.
- [Codex](https://developers.openai.com/codex/cli) — read, search, start, continue and stop, with approvals, questions and plans on the same cards.

The Agents page in the app (`⌘E`) shows which are installed and which are signed in, and walks through installing git and each agent a numbered step at a time for your system, with a shell beside the instructions.

## The first launch

Open the app. The first launch copies every transcript it finds into `~/.emaki/archive`, and every later launch catches up. Capture does not depend on the app running: whenever you open it, it backfills every session you have ever run.

Everything Emaki keeps is under `~/.emaki`:

|               |                                                           |
|---------------|-----------------------------------------------------------|
| `archive/`    | every session, copied byte for byte, one folder per agent |
| `logs/`       | each session rendered as markdown                         |
| `search.db`   | the full-text index                                       |
| `config.json` | your settings                                             |

Only `archive/` cannot be rebuilt from something else. That is the directory to back up.

## The one thing it changes

Emaki sets a single thing in Claude Code’s settings: its own status line, which feeds the context and rate-limit row shown under the composer. Nothing else is touched, and no hook is installed.

To put your old status line back:

``` sh
emaki-core statusline restore
```

## Updating

The app updates itself — from Settings, or on a daily check. Nothing to reinstall.

## Building from source

Rust, with [GPUI](https://www.gpui.rs):

``` sh
git clone https://github.com/alkaline-software/emaki
cd emaki
cargo build -p emaki-app && ./target/debug/Emaki
```

On a Mac the build needs CMake (`brew install cmake`) for the dictation model runner.

Back to top
