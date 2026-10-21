# Agent Terminal Panel

⌘⇧A: the session’s own agent in its terminal, as it runs.

## The agent’s own screen

If you want your agent’s original CLI, this is the panel. Every session Emaki runs has a terminal behind it: Claude Code’s hidden one, or the one Codex’s driver joins. This panel shows it whole, at the chat’s right, so you can watch the agent work as in the CLI and type into it. It is the same terminal the chat reads from and types into, so answering here is the same as answering in the chat, and nothing is doubled. Pasted screenshots reach the agent as they would in the CLI.

Open it with nothing running and it starts the agent (Claude Code). Where it cannot start one, while a turn runs in a terminal of your own or in an archived session, it says why. Anything the agent asks that the chat has no card for can be answered here. It shares the right side with the [shell terminal](../docs/shell.llms.md): one shows at a time.

Back to top
