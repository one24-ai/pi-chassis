# How the sidebar works

pi has no extension API for a side panel. In fullscreen mode (`"tuiMode": "fullscreen"`), pi renders one layout root, a vertical stack of transcript plus input. pi-chassis wraps that root in a horizontal stack with the sidebar as a fixed 48-column right column, using pi-tui's `setLayoutRoot()`.

This was last checked on pi 1.2.0. A pi update could change these internals. If that happens, or in regular mode, the sidebar falls back to a pop-up overlay (`ctrl+x b`), and everything else keeps working.

Below 116 columns the split sidebar hides itself. Context, cost and provider usage, status widgets and other extensions' statuses (MCP, LSP, ...) live in the sidebar; whenever it is hidden they show in the footer instead.

Other unsupported hooks, all checked on pi 1.2.0:

- Prompt bars: patches `UserMessageComponent.prototype.render`. The original is restored on `/chassis off` and on shutdown.
- Tool rows: a renderer resolver (`pi.registerToolRenderer`) draws the built-in tools' calls; pi's own tool definitions, settings and active tool set are not touched.
- Thinking peek: finds the latest assistant message component in the TUI tree.
