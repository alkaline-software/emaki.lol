# Get Started

Download the app and install an agent to get started.

## Install

### Download Emaki

For macOS, Windows and Linux.

[Download](https://github.com/alkaline-software/emaki/releases/latest)

[**macOS** Apple silicon](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-arm64.dmg) [**macOS** Intel](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-mac-x64.dmg) [**Windows** x64 installer](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-windows-x64-setup.exe) [**Linux** x64 AppImage](https://github.com/alkaline-software/emaki/releases/latest/download/Emaki-linux-x64.AppImage)

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

The sidebar and the chat are always there. The four panels are hidden by default: files or outline opens on the left of the chat, the shell or agent terminal on its right.

[Projects](../docs/projects.llms.md)

[Chats](../docs/chats.llms.md)

[Files](../docs/files.llms.md) ⌘⇧F

[Outline](../docs/outline.llms.md) ⌘⇧O

[Shell Terminal](../docs/shell.llms.md) ⌘⇧S

[Agent Terminal](../docs/agent.llms.md) ⌘⇧A

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
