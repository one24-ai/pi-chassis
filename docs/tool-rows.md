# Tool rows for your extension's tools

chassis draws pi's built-in tools (read, write, edit, bash, grep, find, ls) as one-line rows. It knows no other tool by name. An extension can have its own tools drawn the same way by registering a row spec per tool name:

```ts
import { registerToolRows } from "pi-chassis/client";

const off = registerToolRows(
  {
    deploy_status: {
      icon: { nerd: "\u{F0AD}", plain: "#" },
      title: "Deploy",
      describe: (args, _cwd, theme) => `${theme.fg("muted", String(args.env))} ${theme.fg("text", String(args.version))}`,
      summarize: (result, _args, theme, isError) => (isError ? theme.fg("error", "failed") : theme.fg("success", String(result.details?.state ?? "done"))),
      expand: (result) => (result.content ?? []).map((c) => c.text ?? ""), // optional: shown on ctrl+o
    },
  },
  { id: "my-deploy-package" }, // see "Registering again" in the list below
);
// off() removes the rows again
```

The types:

```ts
interface ToolRowSpec {
  icon?: IconLike;                                   // string, or { nerd, plain }; omit for none. In the plain set a string loses its Nerd Font characters, so "#" stays and "\u{F0AD}" shows nothing
  title: string;                                     // before the description; may be ""
  describe(args: any, cwd: string, theme: Theme): string;
  summarize(result: ToolRowResult, args: any, theme: Theme, isError: boolean): string;
  expand?(result: ToolRowResult, args: any, theme: Theme): string[];
}
interface ToolRowResult { content?: Array<{ type: string; text?: string }>; details?: any }
type ToolRowSpecs = Record<string /* tool name */, ToolRowSpec>;
interface ToolRowsOptions { id?: string }
function registerToolRows(specs: ToolRowSpecs, options?: ToolRowsOptions): () => void; // pi-chassis/client
```

- `args` and `result` come from the model and the tool, and a call is drawn while its arguments are still arriving, so a spec reads them defensively (`args?.query`).
- Every string a spec returns is treated as untrusted: escape sequences, control characters and bidi controls are removed and line breaks become spaces. Colour from `theme` is kept. `expand` lines are indented and cut at 120 (only the lines that can be shown are cleaned; the "N more lines" note counts all of them).
- An entry is used only if `title` is a string, `describe` and `summarize` are functions, and `expand` is a function when given. Any other entry is skipped and the rest of the group still registers.
- A spec that throws costs only that frame: it is drawn by the tool's own renderers instead, and when the tool has none, by pi's plain fallback. A throw while the call's arguments or output are still arriving is not held against the call (the next frame tries the spec again). A throw on a finished call latches: the rest of that call uses the tool's own renderers. After a spec has failed on three finished calls, new calls skip it, so the tool is drawn entirely by its own renderers; registering the spec again gives it a fresh start. Limit: pi reads a tool's `renderShell` once, when it creates the row, so a call that falls back after it started stays inside chassis's shell (no padding or background of the tool's own); only a call created after the spec is known to be broken gets the tool's own shell.
- Registering again: a package that registers on every `session_start`, or that /reload loads again, passes an `id` (`registerToolRows(specs, { id: "my-package" })`), and registering with the same id replaces its earlier group instead of piling up another. Without an `id`, keep the returned remover and call it (for example on `session_shutdown`) before registering again, or each call adds a group that lives until the process ends.
- Order does not matter. The spec is looked up when a call is drawn, so the tool's extension, the extension registering the rows and chassis can load in any order, and rows registered before chassis loads are queued and taken over when it does. A call already on screen keeps the renderer it started with. With chassis absent, `registerToolRows` does nothing and the tools keep their own rows.
- chassis's own rows for the built-in tools always win: a spec registered under one of those names is ignored. For any other name the most recent registration wins, and removing it brings back the one before.
- Dependency-free: `globalThis[Symbol.for("pi-chassis/registry")]` has `toolRowsVersion` (a number, 1 today, raised only when `registerToolRows` or `ToolRowSpec` break) and `registerToolRows(specs, { id }?)`, which returns the remover. When `typeof registry.registerToolRows === "function"` and `registry.toolRowsVersion >= 1`, call it. Otherwise chassis has not loaded yet (or is too old): push `{ specs, id, attach(remove) {} }` (`id` optional, as above) onto the array at `globalThis[Symbol.for("pi-chassis/pendingToolRows")]` (create it with `[]` if it is missing) and chassis registers it when it loads, calling `attach` with the remover. A package that wants to react to chassis being absent checks at `session_start`, when every extension has loaded.

Message types that draw a plain row of their own (no panel or bar from chassis) are added the same way, through the shared set at `globalThis[Symbol.for("pi-chassis/plainMessageTypes")]`.

Widgets are described in [widgets.md](widgets.md).
