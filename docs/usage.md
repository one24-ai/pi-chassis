# Using pi-chassis

## Features

- **Home screen**: until the first message, the pi logo, the prompt, a random tip and a bottom bar. Fullscreen mode only. [Details](#home-screen)
- **Sidebar** on the right with session title, context and cost, status widgets and todos. `ctrl+x b` toggles it.
- **Footer**: one line with cwd, git, widgets, other extensions' statuses, context % and cost.
- **Prompt**: a left rail in the mode colour, with a `BUILD` / `PLAN` badge and the model.
- **Build / Plan modes**: `tab` on an empty prompt switches. Plan mode turns off edit and write and limits bash to read-only commands. It is a guardrail, not a sandbox. [Details](#build-and-plan-modes)
- **`ctrl+x` leader keys** and a **`ctrl+p` command palette**.
- **Tool rows**: one line per call, with an icon per tool. `ctrl+o` or a click expands a row. [Details](#tool-rows)
- **User prompts** get a left bar and a label in the colour of the mode they were sent in. [Details](#user-prompts)
- **Thinking peek**: a spinner and the tail of the reasoning, shown in place of "Thinking...".
- **Turn telemetry**: tok/s, TTFT, duration, tokens and the run's cost after each run.
- **Git diff view**: `/diff` (or `ctrl+x d`) opens the changed files and their diffs in a full-size panel. [Details](git.md#diff-view)

## Home screen

Until the first message, the screen shows the pi logo, the prompt (75 columns, with an `Ask anything…` placeholder and a blinking cursor), a random tip, and a bottom bar with the brand, the pi and chassis versions, the directory and branch, MCP count, and the last session here (`ctrl+x r` resumes it). Fullscreen mode only.

## Build and Plan modes

Press `tab` on an empty prompt (`shift+tab` cycles the thinking level, as in pi). Plan mode turns off edit and write and limits bash to read-only commands (an allow-list that rejects redirects to files, command substitution, unquoted expansion such as `{a,b}`, `*` and `$VAR`, and options that write files or run other programs). It is a guardrail, not a sandbox: tools from other extensions (MCP and custom tools) are not restricted, test and build commands it allows (`pnpm test`, `cargo test`) run project code, and git honours the repository's own config, so do not rely on it in a repository you do not trust.

## Tool rows

Each call is one line, with its own icon per tool (`󰧮 Read src/x.ts   120 lines`). `ctrl+o` expands them. For bash, the row shows the line count, the exit code on failure and the run time for commands over a second. Under it, the last 3 lines of output stay visible, with a dim `… N more lines · ctrl+o or click to expand` above them. The command and its output sit in one shaded block with a blank shaded row above, between and below. `edit` and `write` are blocks too: the diff of an edit, or the numbered lines of a new file (the first 20, then a note of how many more). Blocks start with a one-column strip of the page background before the shade, like a left border, and an inline row sits tight under another one-line row but keeps a blank row under a block. A call that printed nothing, and every `read`, `grep`, `find` and `ls` call, is a plain unshaded line instead. Every call starts as a plain line and only becomes a block when it has output or fails, so a row changes shape at most once. Click a row or press `ctrl+o` to open it: long output then keeps its first 6 and last 14 lines (errors are usually at the end), with the full-output path when pi truncated it. While a command runs for more than half a second, the last 5 lines of its output show under the row and update as it prints. Colour codes and progress-bar redraws are cleaned up, and a line over 1000 characters is cut.

## User prompts

Your prompts get a left bar in the colour of the mode they were sent in (brand colour for Build, plan colour for Plan) and a muted `Build` or `Plan` label in a column on the right, centred vertically; the message wraps before that column. The mode is read from the session, so earlier messages keep their colour and label when you switch modes, and after a resume.

## Keys

| Key | Action |
|---|---|
| `tab` (empty prompt) | Switch Build / Plan |
| `shift+tab` | Cycle the thinking level (pi's own binding) |
| `ctrl+p` | Command palette (all slash commands, fuzzy search) |
| `ctrl+x` then `n` `l` `r` `m` `t` | New session, sessions, resume the last session here, models, settings/themes |
| `ctrl+x` then `b` `d` `a` `c` `x` | Toggle sidebar, diff view, switch mode, compact, export |
| `ctrl+x` then `g` `y` `s` `h` `q` | Tree, copy last message, session info, hotkeys, quit |
| `ctrl+x` then `?` | Leader help |
| `ctrl+alt+b` | Toggle sidebar |

`ctrl+p` replaces pi's default "cycle model" binding inside the prompt. Pick models with `ctrl+x m` or `ctrl+l`.

`/chassis [on|off|sidebar|status|alert|icons]` turns the TUI off for a session, toggles the sidebar, or reports the layout and the registered widgets.

**Finish alert.** When a run that lasted at least 30 seconds ends, fails, or stops to wait for you (a confirmation prompt), chassis rings the terminal bell and puts a mark in the window title (`✓`, `✗` or `?` in front of pi's title), so you notice from another window. The mark clears on your next prompt. A run you abort with `esc` never rings. It writes only a BEL character and the standard title escape, with no OS commands, so what you see (a taskbar flash, a tab badge, a sound, or nothing) is your terminal's bell setting. `/chassis alert` shows the setting, `/chassis alert off|on` switches it, and `/chassis alert 90` (or `45s`, `2m`) sets the threshold. It is saved in `chassis.json` next to the disabled widgets.

## Subagents

With [pi-subagents](https://github.com/nicobailon/pi-subagents) installed, the sidebar's Subagents section lists this session's children: a status dot, the label or agent, the current tool and elapsed time, with running ones first. Foreground runs show as `fg` rows. To inspect, steer or stop a child, use pi-subagents' own FleetView: press `↓` on an empty prompt, or run `/subagents-fleet`.

The section reads pi-subagents' public `status` RPC only, so it keeps working as pi-subagents changes internally, and hides itself when pi-subagents isn't installed. The one exception is the parallel limit, which comes from `globalConcurrencyLimit` in `~/.pi/agent/extensions/subagent/config.json` (20 when unset).

## Icons and themes

**Icons.** pi-chassis draws with plain characters by default (`● ○ ▲ × • → ↑ ↓` and half-block pill caps), which every common monospace font has, so it works in any terminal. With a [Nerd Font](https://www.nerdfonts.com) in the terminal it can draw real icons instead (a robot, a branch, a file, a clock, round pill caps). Switch with `/chassis icons nerd|plain|auto`; `auto` forgets the choice. The setting is saved in `chassis.json`, and the `PI_CHASSIS_ICONS=nerd|plain` environment variable overrides it. A brand can set the default for its users with `icons: "nerd"` (see Branding). The plain set takes the same number of cells as the Nerd one, so nothing moves when you switch. Where a Nerd icon is only decoration (telemetry, the mode pill, the diff header) the plain set shows the words alone.

pi-chassis ships no theme. It works with any pi theme; the brand only supplies the mark colour, the plan-mode colour and two surface shades (see Branding).
