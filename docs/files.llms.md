# Files Panel

⌘⇧F: the project as a tree, a pane to read and edit any file, and git.

## The tree

The project’s folder as a tree, with Catppuccin’s file icons and git’s marks: a letter on a changed file, a dot on a folder with changes inside, and ignored files dimmed. It works like a file manager: drag files in from Finder, drag rows to move them, cut, copy, duplicate, move to the Trash (⌘⌫) and undo (⌘Z). New File and New Folder are at the top, and a file the agent writes appears as soon as it lands.

## Open and edit

Click a file to open it in a pane between the tree and the chat; click it again to close it. The enlarge button gives the pane the chat’s room. ⌘S saves, ⌘W closes, and Emaki asks before anything unsaved is lost. Format on save covers ten languages and is off until you turn it on.

Code has line numbers, colors, and a gutter mark for each git change, with a card to see or revert it. Every kind of file is drawn for what it is:

- Code every language, colored
- Markdown as it reads, or as written
- CSV and TSV a grid you can edit in place
- Parquet a table with each column’s type
- Word pages you can type in and format
- Excel cells with their number formats
- PowerPoint slides as they look
- PDF sharp at any width, with search and page previews
- HTML in the system’s web view
- Pictures at their own size

## Git

In a repository, the branch’s name sits at the top of the tree. Click it to switch branches, make one (⌘⇧N) or publish one; Fetch and Pull are at the bottom of the list. If you switch with uncommitted changes, Emaki asks whether to leave them or bring them along, and switches only when every change can go where you asked.

The **Changes** pill (⌘⇧G) opens the Changes sheet: tick the files, write the message, commit (⌘↩︎) and push (⌘P). A changed picture shows before and after, side by side. **History** lists the commits: Undo takes back the newest while the remote does not have it, and Revert takes back any one as a new commit. Nothing is committed, pushed or pulled until you click to do it.

Back to top
