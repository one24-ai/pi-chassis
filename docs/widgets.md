# Adding a widget

A widget is one call. It can show in the footer, the sidebar, or both:

```ts
// my-widget/index.ts, in a pi package that depends on pi-chassis (see below)
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWidget } from "pi-chassis/client";

export default function (pi: ExtensionAPI) {
	let count = 0;
	registerWidget(pi, {
		id: "builds",
		title: "Builds",              // sidebar heading
		slots: ["footer", "sidebar"], // default: both
		order: 40,                    // container 0, mcp 30
		refreshMs: 15_000,            // optional polling
		update: async (ctx) => {      // optional: fetch slow data here
			count = 3;
		},
		render: () => ({ icon: { nerd: "\u{F0AD}", plain: "" }, label: "CI", text: `${count} running`, level: count ? "warn" : "ok" }),
		detail: () => ["main: passing", "feature/x: running"], // extra sidebar lines
	});
}
```

`pi-chassis/client` is resolved like any npm import, from the widget's own folder, so the widget lives in a pi package that has pi-chassis in its `node_modules`. A single file in `~/.pi/agent/extensions/` can't import it. The exports are compiled JavaScript with type declarations, so the package's own tests can import them with plain `node --test` and type-check with `tsc`. A minimal package:

```json
{
  "name": "my-widget",
  "type": "module",
  "keywords": ["pi-package"],
  "pi": { "extensions": ["./index.ts"] },
  "dependencies": { "pi-chassis": "^0.4.0" }
}
```

Install its dependencies (`pnpm install`), then `pi install /path/to/my-widget`.

- Widgets in other extensions should import `client.ts`, not `api.ts`. A package that cannot depend on pi-chassis registers through `globalThis` instead (see [Adding a widget without depending on pi-chassis](#adding-a-widget-without-depending-on-pi-chassis)). It only looks for chassis on `globalThis`, so load order doesn't matter: a widget that registers before chassis loads is queued and taken over when it does. Without chassis installed, the widget falls back to a plain `ctx.ui.setStatus(id, "<icon> <label or title> <text>")` line, polled on `refreshMs` (no detail lines, colours or caching). It also checks the registry's `apiVersion`, so a chassis with an older API is ignored rather than called wrongly. The package exports `./client`, `./api`, `./brand`, `./icons` and `./provider` for use from another package (`./icons` has `iconSet`, `safeGlyph` and the glyph table, for a brand or widget that wants to match the user's icon choice). Built-in widgets in this repo keep importing `api.ts`.
- An `icon` (on the widget or in the view) is either one string, used as given with a Nerd Font and dropped without one, or `{ nerd, plain }` to give one for each set. A string of ordinary characters such as `"CI"` survives in both. With no icon in the current set, a row shows its level marker or the bullet, and a section heading shows no glyph.
- `render` returns `{ icon?, label?, text, color?, level? }`, or `undefined` to hide the widget. In the sidebar's status list a `level` shows as a marker: a check (`ok`), warning triangle (`warn`), cross (`error`), minus (`off`) or information circle (`info`), in that level's colour. `label` is shown only in the footer, because the sidebar uses `title` instead.
- `color` takes theme tokens (`text`, `muted`, `accent`, `success`, `warning`, `error`) the brand colours (`brand`, `brandDark`, `plan`), or any `#RRGGBB` value. If omitted, `level` (`ok`, `warn`, `error`, `off`, `info`) picks the colour.
- An `update` runs one at a time and is abandoned after `updateTimeoutMs` (default 10000). A failing `update`, `render` or `detail` shows its last error under the widget in the sidebar.
- `render` and `detail` run on every repaint, so keep them cheap. A widget that reads session state can pass `cacheKey` (for example the session branch key), and its output is then reused until that key, the width, the theme or any widget update changes. A widget whose render takes over 50 ms three times in a row is suspended (shown as "suspended") until `/widgets enable ID`.
- `actions: [{ id, label, description?, run(ctx) }]` adds entries to the ctrl+p palette, shown as "<title>: <label>". They are hidden while the widget is disabled or suspended. A thrown error is shown as a notification and recorded on the widget.
- A `detail` line is a string, or a list of pieces for a line that links part of its text: `detail: () => [["ABC-1234", "  ", { text: "Open", url: "https://example.com/browse/ABC-1234" }]]`. A piece is a string or a `{ text, url }` link. Only a plain https URL (no user name, no whitespace or control characters, at most 2048 characters) makes a link, and the label shows alone where the terminal cannot show links. A link written into a string does not work: every escape sequence is removed from text, so a ticket summary or incident title that carries its own link cannot draw one.
- `onDetailClick(index, ctx)` makes the lines `detail` returns clickable in the sidebar (left click; the heading, error lines and rows cut off on a short terminal are not). Clicks need pi's fullscreen mode (`"tuiMode": "fullscreen"`) and the split sidebar. In regular mode pi-tui does not report the mouse at all, and the pop-up sidebar that stands in for the split one has no click handling, so `onDetailClick` never runs there: show anything the user must reach by clicking in another way too, such as a palette `actions` entry. Only the sidebar leaf handles the mouse, so moving the pointer over it costs nothing. A thrown error is shown as a notification and recorded on the widget.
- A `sidebar: "section"` widget with only detail lines can return `{}` from `render`: `text` is optional.
- `/widgets [list|disable ID|enable ID|refresh ID]` shows each widget's state and switches one off. The disabled list is saved in `~/.pi/agent/chassis.json`.
- `registerWidget` returns a handle. `refresh()` re-renders on demand, for example from a `pi.events` listener, and `dispose()` removes the widget.
- `sidebar: "section"` gives a widget its own sidebar section (bold title, value beside it, detail lines as the body) instead of a row in the status list. The `todo` widget uses it. Its optional `icon` goes in front of the title; on a row widget it is the row's marker instead of the bullet (a brand logo works well there).
- Plain `ctx.ui.setStatus(key, text)` from any extension still shows in the footer. A widget whose `id` (or `statusKey`) matches a status key replaces that status, so it doesn't show twice; `statusKeys: [...]` claims several more. The Subagents widget uses it for pi-subagents' slash-command statuses.

For worked examples that read an environment variable, a file or a command, see [Status widgets from what you already have](status-widgets.md). `extensions/widgets/` has the built-in widgets, which are also good templates:

| Widget | Shows |
|---|---|
| `container` | The container, devcontainer or pod name when pi runs inside one |
| `mcp` | Connected/enabled MCP servers, and which ones are pending |
| `todo` | Open items from the repo's `TODO.md` (or `TODO`, `TODO.txt`), sidebar only, hidden when there's none |
| `session-todos` | The latest todo list a todo-style tool reported in this session, sidebar only, hidden when nothing is open |
| `subagents` | pi-subagents children for this session (see [Subagents](usage.md#subagents)), hidden until one runs. Running children show their model and token count, and a last line shows spawned-of-cap and the parallel limit |

## Adding a widget without depending on pi-chassis

A package that should work with or without chassis, and that does not want a dependency on it, can register through `globalThis` alone. This is the whole protocol; `pi-chassis/client` is a typed wrapper around it (and adds the plain `setStatus` fallback).

- The registry is `globalThis[Symbol.for("pi-chassis/registry")]`. It exists once chassis has loaded (and may exist earlier, created by another package that imports chassis's `api`), so check the fields, not just the object.
- `apiVersion` (a number) is the widget API version, 1 today. It changes only when `WidgetSpec` or the registry break. Use the registry only when `typeof registry.register === "function"` and `registry.apiVersion >= 1`.
- `register(pi, spec, ctx?)` registers or replaces the widget with that `id` and returns `{ refresh(), dispose() }`. `spec` is the `WidgetSpec` described above.
- Register from your `session_start` handler. By then every extension has loaded, so a missing registry means chassis is not installed: show nothing (or your own `ctx.ui.setStatus`). pi collects the handlers for an event before it calls any of them, so the `session_start` listeners that `register` adds for the widget's timers miss the event that is already running; pass the handler's `ctx` as the third argument and chassis uses it for the widget's first `update` and its timer. Registering again on a later `session_start` replaces the widget.
- Everything the widget returns is cleaned of escape sequences and control characters before it is drawn, as for any widget.

```ts
// A pi package with no dependency on pi-chassis: a "Memory" sidebar section.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const saved: Array<{ id: number; title: string; text: string }> = [];
  let recalled = { count: 0, total: 0, chars: 0, budget: 2000 };

  pi.on("session_start", async (_event, ctx) => {
    const host = (globalThis as any)[Symbol.for("pi-chassis/registry")];
    if (typeof host?.register !== "function" || !(host.apiVersion >= 1)) return; // chassis is absent: show nothing

    host.register(
      pi,
      {
        id: "memory",
        title: "Memory",
        sidebar: "section",          // its own section; the value sits beside the title
        slots: ["sidebar"],
        order: 60,
        cacheKey: () => `${recalled.count}|${saved.length}`, // render and detail rerun only when this changes
        render: () => ({ text: `${recalled.count} of ${recalled.total} recalled, ${recalled.chars} of ${recalled.budget} chars` }),
        detail: () => saved.map((m) => `#${m.id} ${m.title}`), // the memories saved or changed this session
        onDetailClick: async (index, clickCtx) => {
          const m = saved[index];
          if (m) await clickCtx.ui.editor(`Memory #${m.id}`, m.text); // the full text, in pi's own editor
        },
      },
      ctx,
    );
    // Later, when the state changes: handle.refresh() (keep the return value of register).
  });
}
```

A widget that is not a status of its own, only detail lines, can return `{}` from `render`. Clicking a detail line calls `onDetailClick(index, ctx)` with the live session context, so the extension can show the full text with `ctx.ui` (an editor, a selector or a notification). `handle.refresh()` re-renders after the extension's own state changes (a memory was saved), and `cacheKey` must change with that state when it is used.

Related: [tool rows for your extension's tools](tool-rows.md), [the diff view API](diff-api.md), [branding](branding.md) and [provider status](provider-status.md).
