# How the sidebar works

pi has no extension API for a side panel. In fullscreen mode (`"tuiMode": "fullscreen"`), pi renders one layout root, a vertical stack of transcript plus input. pi-chassis wraps that root in a horizontal stack with the sidebar as a fixed 48-column right column, using pi-tui's `setLayoutRoot()`.

This was last checked on pi 1.4.0. A pi update could change these internals. If that happens, or in regular mode, the sidebar falls back to a pop-up overlay (`ctrl+x b`), and everything else keeps working.

Below 116 columns the split sidebar hides itself. Context, cost and provider usage, status widgets and other extensions' statuses (MCP, LSP, ...) live in the sidebar; whenever it is hidden they show in the footer instead.

The split relies on `tui.layoutRoot`, `tui.setLayoutRoot()`, the entries of pi-tui's `HStack` and `VStack` (`basis`, `grow`, `shrink`, `minSize`, `visible`) and the `Symbol.for("@earendil-works/pi-tui/layout-node")` method.

Other unsupported hooks, all checked on pi 1.4.0:

- Prompt bars: patches `UserMessageComponent.prototype.render`. The original is restored on `/chassis off` and on shutdown.
- Tool rows: a renderer resolver (`pi.registerToolRenderer`) draws the built-in tools' calls; pi's own tool definitions, settings and active tool set are not touched. Rows from other extensions are compacted by patching `ToolExecutionComponent.prototype.render` (reads `expanded`, `isPartial`, `result`, `contentBox`, `imageComponents`, `toolDefinition`).
- Finished thinking: patches `AssistantMessageComponent.prototype.render` to drop the hidden-thinking label from settled messages (reads `contentContainer`, `lastMessage`, `isStreaming`, `hideThinkingBlock`, `thinkingVisibilityOverrides`).
- Extension notices: patches `CustomMessageComponent.prototype.render` (reads `message.customType`).
- Thinking peek: finds the latest assistant message component in the TUI tree and calls `setHiddenThinkingLabel`.
- Leader keys that map to slash commands call the editor's `onSubmit`, which pi copies onto chassis's editor.
- The prompt reads the editor's `renderedVisibleLineCount`, and the chat container is found by matching component class names (`UserMessageComponent`, `AssistantMessageComponent`, `ToolExecutionComponent`) in the TUI tree.

Several of these read members that are private or protected in pi's types (`Stack.entries`, `ScrollView.child`, `MouseRegion.child`) or match class names, so the type check does not catch a change: re-check them by running pi after each pi update.
