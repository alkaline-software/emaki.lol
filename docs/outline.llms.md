# Outline ⌘⇧O

A drawer at the chat’s left: every round, labeled by what came of it.

Going back through a long session is a pain. The Outline lists every round of the chat under its day, each with its time and a short label of what came of it, written by a small model of your agent’s, the one [Settings, Model calls](../docs/settings.llms.md#model-calls) names for it. Click an entry to scroll back to its round.

## The drawer

The Outline lives in the chat’s left margin. Move the pointer there and a seam appears, a line down the margin with a knob halfway. Click the knob, or press ⌘⇧O, and the drawer slides out, the chat moving over for it; click again to put it away. It belongs to the chat: switching to the [Agent CLI](../docs/agent-cli.llms.md) folds it away, and the chat brings it back as it was.

## Summaries

**Summarize session**, under the entries, writes a summary of the session in bullets and heads the entries with sections. **Update** brings it up to date from the new rounds alone, and **Hide** puts it away. The Outline summaries switch in [Settings, Model calls](../docs/settings.llms.md#model-calls) turns the labels and summaries off while keeping the Outline.

Each label and summary is a call to a small model of your agent’s, on your account. [Settings](../docs/settings.llms.md#model-calls) turns them off, which keeps the Outline without them, and chooses the model for each agent. Settings, Conversation, turns the Outline itself off.

Back to top
