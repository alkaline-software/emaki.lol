# Files Panel ⌘⇧F

The file tree, file preview and editing, and git.

## File tree

The Files Panel opens from the button at the left end of the strip over the chat, and stays open or closed across launches. The file tree is shown with its root folder expanded. Folders and files are drawn with [Catppuccin’s file icons](https://catppuccin.com). If the project is a git repository, its changes are shown on the folders and files. The file tree supports mouse dragging and common keyboard shortcuts.

## File preview & editing

Click a file to open it in a pane between the tree and the chat; click it again to close it. Markdown, Quarto, LaTeX and Typst documents open rendered, and ⌘⇧V switches a file between its rendered and raw views. The enlarge button gives the pane the chat’s room. You can use common keyboard shortcuts to undo, redo, save, and close.

Emaki supports format on save for common languages. It is off by default and can be turned on in [Settings](../docs/settings.llms.md): tick all the languages, or only the ones you want.

Supported file types:

- Code
- Markdown
- LaTeX
- Typst
- CSV and TSV
- Parquet
- Word
- Excel
- PowerPoint
- PDF
- HTML
- Pictures

## Git

If the project is a git repository, the git buttons appear in the Files Panel’s header. Click the branch name to switch branches or create a new one (⌘⇧N). You can also fetch, pull, and push from there.

The **Changes** pill (⌘⇧G) opens the Changes sheet. There you can review your changes, write a commit message, commit (⌘↩︎), and push (⌘P). The sheet’s **History** side lists your past commits.

Back to top
