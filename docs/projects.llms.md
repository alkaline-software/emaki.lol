# Projects

The sidebar lists your sessions grouped under their projects.

## Projects

All sessions in Emaki are project-based, all listed in the sidebar. You can pin your selected projects and show or hide sessions. To start a new session, you can either click the + button on an existing project or press ⌘T in the project you are in. With ⌘N, you can start one anywhere (the same as going to your landing page).

The projects card belongs to one computer, named at its top: This computer, or a device you saved in [Connected Devices](../docs/settings.llms.md#connected-devices). Your other computers wait in a small card at the bottom of the sidebar, each with a dot that is green while it’s connected; click one to open its projects. A connected one shows at its top whether it’s reached over your local network or from anywhere. While one isn’t connected, it shows a button for each of its addresses to connect by, and one to its settings. With no device saved, the small card holds Connect a Device….

Put away (⌘⇧B), the sidebar folds to a rail of icons: search, New Session, All Sessions, Agents, and Projects, which opens your projects beside the rail until you choose one.

## Sessions

### In the sidebar

Sessions are managed under their projects. A session’s leading logo tells you which agent it belongs to and lights up while the agent runs. A dot shows where the session stands: orange while a question waits for you, blue while the agent works or something it started still runs, green for half an hour after it finishes. A bar at the left marks a session that is open in a tab. Claude Code and Codex sessions sit side by side, each read from the agent’s own files.

### All Sessions

All Sessions (⌘L) lists every project and session with the day it was last used. This page provides plenty of ways of easily managing your existing sessions.

## Archiving

Claude Code deletes its transcripts after 30 days. Emaki copies each one into `~/.emaki/archive`. Codex never deletes sessions by age, so Emaki reads them in place.

An archived session is kept but not continued until you unarchive it. You can archive and unarchive sessions yourself. An unarchived Claude Code session goes back to Claude Code dated now, so its thirty days start again.

## Tabs

Each open session is a tab, grouped by project. ⌘1 to ⌘9 switch tabs, ⌘W closes one, ⌘⇧T reopens the last one closed, and you can drag tabs to reorder them.

Back to top
