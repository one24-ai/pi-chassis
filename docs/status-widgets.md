# Status widgets from what you already have

A status widget shows one fact the user should not have to look up: which cluster a command will hit, which environment a deploy targets, how many builds are failing. Most of the time that fact is already in pi's process environment, in a file a tool keeps up to date, or in a status line another extension prints. This page shows how to turn each of those into a widget with [`registerWidget`](widgets.md).

Every recipe below is a whole extension for a small pi package. Put it in a package that depends on `pi-chassis`, as described in [Adding a widget](widgets.md), and list it under `pi.extensions`.

## Rules that keep a status widget safe

- **Read, do not run.** Read an environment variable or a file. Do not run a command from `render` or `update`: it runs every refresh, and a credential or login tool may open a browser window just to draw a status line. If a recipe needs a command, run it once, on demand, from a palette action.
- **Keep `render` cheap.** It runs on every repaint. Do the slow work in `update` (on a timer, `refreshMs`) and store the result in a variable that `render` reads.
- **Everything you return is cleaned.** pi-chassis strips escape sequences and control characters from widget text, so a file name or a tool's output cannot draw over the screen. Do not rely on escape codes for colour: use `color` and `level`.
- **Show nothing when there is nothing to show.** Return `undefined` from `render` and the widget disappears.

## Recipe 1: an environment variable

Show the value of a variable the user or a wrapper script sets, such as the environment a deploy targets.

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWidget } from "pi-chassis/client";

export default function (pi: ExtensionAPI) {
	registerWidget(pi, {
		id: "deploy-env",
		title: "Env",
		order: 25,
		refreshMs: 5_000, // the variable can change when something edits pi's own environment
		render: () => {
			const env = process.env.DEPLOY_ENV?.trim();
			if (!env) return undefined;
			return { text: env, level: env === "prod" ? "warn" : "ok" };
		},
	});
}
```

An environment variable is read from pi's own process. A change you make in your shell afterwards is not visible to a running pi.

## Recipe 2: a file another tool keeps current

Many tools write down what is active: a current context, a selected profile, a checked-out environment. Read it in `update`, and keep the last good value if the read fails.

```ts
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWidget } from "pi-chassis/client";

const FILE = join(homedir(), ".config", "mytool", "active");

export default function (pi: ExtensionAPI) {
	let active: string | undefined;
	registerWidget(pi, {
		id: "mytool",
		title: "MyTool",
		refreshMs: 10_000,
		update: () => {
			try {
				active = readFileSync(FILE, "utf8").split("\n")[0]?.trim() || undefined;
			} catch {
				active = undefined; // no file means nothing active
			}
		},
		render: () => (active ? { text: active } : undefined),
	});
}
```

The first line is enough for most files. A file in a structured format such as YAML or JSON needs a parser, which pi-chassis does not ship. Parse it in your own package, and keep the parsing in a function you can test without pi.

## Recipe 3: a count with detail lines and a warning level

Use `level` to say how the number should read, and `detail` for the lines under the heading.

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerWidget } from "pi-chassis/client";

interface Build { name: string; state: "passing" | "running" | "failing" }

export default function (pi: ExtensionAPI) {
	let builds: Build[] = [];
	registerWidget(pi, {
		id: "builds",
		title: "Builds",
		sidebar: "section", // its own sidebar section, with the detail lines as the body
		refreshMs: 30_000,
		update: async () => {
			builds = await loadBuilds(); // your own fetch; cache it, and catch your own errors
		},
		render: () => {
			if (!builds.length) return undefined;
			const failing = builds.filter((b) => b.state === "failing").length;
			return { text: failing ? `${failing} failing` : "all passing", level: failing ? "error" : "ok" };
		},
		detail: () => builds.filter((b) => b.state !== "passing").slice(0, 5).map((b) => `${b.name}: ${b.state}`),
	});
}

declare function loadBuilds(): Promise<Build[]>;
```

An `update` that throws, or runs longer than `updateTimeoutMs` (10 seconds by default), shows its error under the widget and does not break the sidebar.

## Recipe 4: link a line to its page

A detail line can hold a link, built from pieces. Only a plain https URL makes a link, and the label shows alone where the terminal cannot draw links:

```ts
detail: () => builds.map((b) => [`${b.name}  `, { text: b.state, url: `https://ci.example.com/builds/${b.name}` }]),
```

## Recipe 5: replace another extension's status line

An extension that already prints a line with `ctx.ui.setStatus("deploy", "prod 3 jobs")` shows up in the footer as plain text. Register a widget with a matching `statusKey` and pi-chassis hides the raw line and draws yours:

```ts
registerWidget(pi, {
	id: "deploy",
	title: "Deploy",
	statusKey: "deploy", // the key the other extension passes to setStatus
	render: () => ({ text: "prod", level: "warn" }),
});
```

To restyle a status you do not control, read the same source the other extension reads (a file or variable), not its status text.

## Recipe 6: show something that needs a command, safely

If the fact only comes from a command, run it from a palette action and keep the result, so the user decides when it runs:

```ts
let cluster: string | undefined;
registerWidget(pi, {
	id: "cluster",
	title: "Cluster",
	render: () => (cluster ? { text: cluster } : { text: "not checked", level: "off" }),
	actions: [
		{
			id: "check",
			label: "Check the active cluster",
			run: async (ctx) => {
				const r = await pi.exec("mytool", ["current"], { timeout: 5_000 });
				cluster = r.code === 0 ? r.stdout.trim().split("\n")[0] : undefined;
				ctx.ui.notify(cluster ? `Cluster: ${cluster}` : "mytool failed", cluster ? "info" : "warning");
			},
		},
	],
});
```

The action appears in the `ctrl+p` palette as "Cluster: Check the active cluster". Nothing runs until the user picks it.

## Without pi-chassis installed

`registerWidget` from `pi-chassis/client` still works when pi-chassis is not installed: the widget becomes a plain `ctx.ui.setStatus` line with its text, updated on `refreshMs`. Detail lines, colours and caching are dropped. A package that should not depend on pi-chassis at all can register through `globalThis` instead; see [Adding a widget without depending on pi-chassis](widgets.md#adding-a-widget-without-depending-on-pi-chassis).
