# Install

Three steps, and the first may be done already.

1.  ### Have an agent

    Emaki reads and drives the coding agents on your machine, so at least one has to be installed and signed in.

    **Claude Code**

    [Install it from Anthropic’s documentation](https://docs.claude.com/en/docs/claude-code), then run `claude` once to sign in.

    **Codex**

    [Install it from OpenAI’s documentation](https://developers.openai.com/codex/cli), then run `codex` once to sign in.

    Not sure what this machine has? Emaki’s Agents page (⌘E) says, and walks through installing an agent a numbered step at a time, with a shell beside the steps. Git is optional: with it, Emaki shows a project’s changes and branches and commits for you.

2.  ### Download Emaki

    [**macOS** Apple silicon](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-arm64.dmg) [**macOS** Intel](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-x64.dmg) [**Windows** x64 installer](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-windows-x64-setup.exe) [**Linux** x64 AppImage](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-x64.AppImage)

    Each link takes the [latest release](https://github.com/alkaline-software/emaki/releases/latest). The Mac image is signed and notarized and opens without argument; it needs macOS 14 or later. Windows is unsigned, so SmartScreen asks once: *More info*, then *Run anyway*. On Linux run the AppImage, or install the `.deb` from the release page.

3.  ### Open it

    The first launch copies every Claude Code transcript it finds into `~/.emaki/archive`, and every later launch catches up, so nothing is lost while the app was closed. Pick a folder and type a message to start a session, or open one from the sidebar.

    From then on the app updates itself: from Settings, Updates, or on a daily check.

## What it keeps

Everything is under `~/.emaki`:

|  |  |
|----|----|
| `archive/` | every Claude Code session, copied byte for byte, a folder an agent and a project |
| `logs/` | each session rendered as markdown |
| `search.db` | the full-text index |
| `models/` | the dictation models you download |
| `config.json` | your settings |

Only `archive/` cannot be rebuilt from something else. That is the folder to back up.

## The one thing it changes

Emaki sets a single thing in Claude Code’s settings: its own status line, which feeds the context and rate-limit row under the composer. Nothing else is touched, and no hook is installed. To put your old status line back:

``` sh
emaki-core statusline restore
```

## Dictation

On a Mac, Settings, Dictate downloads a speech model (Qwen3-ASR or Whisper) and, if you want it, a small language model that tidies what was said. Both run on this machine, and nothing you say leaves it. To dictate into other apps, allow Accessibility when Dictate asks. [More on dictation](features.llms.md#dictation).

## Building from source

Rust, with [GPUI](https://www.gpui.rs). On a Mac the build needs CMake (`brew install cmake`) for the dictation model runner.

``` sh
git clone https://github.com/alkaline-software/emaki
cd emaki
cargo build -p emaki-app && ./target/debug/Emaki
```

Back to top
