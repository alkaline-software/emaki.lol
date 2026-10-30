# Get Started

Download the app and install an agent to get started.

## Install

### Download Emaki

For macOS, Windows and Linux.

[Download](https://github.com/alkaline-software/emaki/releases/latest)

[**macOS** Apple silicon](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-arm64.dmg) [**macOS** Intel](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-x64.dmg) [**Windows** x64](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-windows-x64-setup.exe) [**Windows** ARM](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-windows-arm64-setup.exe) [**Linux** x64 .deb](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-x64.deb) [**Linux** ARM .deb](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-arm64.deb) [**Linux** x64 AppImage](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-x64.AppImage) [**Linux** ARM AppImage](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-arm64.AppImage) [**Other systems**](https://github.com/alkaline-software/emaki/releases/latest)

### Install the agents

Emaki works with Claude Code and Codex.

[Claude Code](https://docs.claude.com/en/docs/claude-code) [Codex](https://developers.openai.com/codex/cli)

### Git (optional)

Install Git and the GitHub CLI to commit, branch and push from Emaki.

[Git](https://git-scm.com/downloads) [GitHub](https://cli.github.com)

The Agents page (⌘E) checks whether your agents and Git are installed and walks you through installing them.

## Open a project

Choose a folder, pick an agent, and type your first prompt. That starts a session in the folder, with a tab and a row in the sidebar. To pick up an older one, find it in the sidebar: every session on this computer is listed under its project, from both agents.

On the first launch, Emaki copies every Claude Code session into `~/.emaki/archive`, and each later launch catches up, so a session Claude Code has deleted is still here. See [Projects](../docs/projects.llms.md).

## Layout

The sidebar and the chat are always there. Two panels are hidden until you need them: the Files Panel opens at the chat’s left and the Terminal Panel at its right, each from a button at an end of the strip over the chat. Two more things wait in the chat’s margins. The Outline is a drawer that slides out into the left margin, and the Agent CLI, your agent’s own screen, takes the chat’s place from the right margin and gives it back. Each has a seam in its margin, a line with a knob halfway, which shows when the pointer comes near. [Settings](../docs/settings.llms.md#panels) puts each on the side you choose.

[Projects](../docs/projects.llms.md)

[Chats](../docs/chats.llms.md)

[Files](../docs/files.llms.md) ⌘⇧F

[Outline](../docs/outline.llms.md) ⌘⇧O

[Terminal](../docs/terminal.llms.md) ⌘⇧S

[Agent CLI](../docs/agent-cli.llms.md) ⌘⇧L

## What Emaki keeps

Everything Emaki keeps is in `~/.emaki`:

|               |                                                 |
|---------------|-------------------------------------------------|
| `archive/`    | every Claude Code session, copied byte for byte |
| `logs/`       | each session rendered as markdown               |
| `search.db`   | the full-text index                             |
| `config.json` | your settings                                   |

Codex has its own archiving system, so `archive/` only stores Claude Code sessions.

Emaki changes one setting in Claude Code: its status line, which feeds Emaki’s own [status line](../docs/chats.llms.md#status-line) under the composer. To put yours back, run `emaki-core statusline restore`.

Back to top
