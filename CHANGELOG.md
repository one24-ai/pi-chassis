# Changelog

All notable changes to pi-chassis (published under an earlier name up to 0.3.0) are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html); see [Versioning](README.md#versioning) for what counts as a breaking change here.

## [Unreleased]

### Changed

- Allows pi 1.3 and 1.4: the peer dependency range is now `>=1.2.0 <1.5.0`. Checked on pi 1.2.0 and 1.4.0; pi 1.3 was not tested. `docs/internals.md` now lists every unofficial pi hook chassis uses.
- Versioning: a release now declares a range of supported pi versions instead of one pi minor. Adding a pi minor is a minor release, dropping one is a breaking change, and CI tests the lowest and highest supported versions (README, Versioning).

## [0.7.1] - 2026-10-23

### Changed

- README: the install commands no longer pin a version or a tag, and the advice to pin is gone.

## [0.7.0] - 2026-10-23

### Changed

- **Breaking:** the shared `globalThis` keys are now `Symbol.for("pi-chassis/<name>")`: `registry`, `pending`, `pendingToolRows`, `brand`, `icons`, `providers`, `diff`, `original-root` and `original-render`. The plain message types set is now `globalThis[Symbol.for("pi-chassis/plainMessageTypes")]`. A package that talks to chassis through globals must update the keys.
- **Breaking:** the session entry types are now `chassis-mode`, `chassis-plan-context` and `chassis-git`. Sessions written with the old names no longer restore their mode or their git reports.

### Removed

- **Breaking:** the fallbacks for the old environment variables, the migration of the old settings file, the old command aliases and the compatibility package for the old name.

## [0.6.1] - 2026-10-21

### Changed

- Documentation only: the 0.6.0 changelog entry and `docs/status-widgets.md` no longer name the package the AWS widget moved to. No code change.

## [0.6.0] - 2026-10-15

### Added

- `docs/status-widgets.md`: recipes for building a status widget from what you already have, an environment variable, a file another tool keeps current, a count with detail lines, a linked line, another extension's `setStatus` line, and a value that needs a command (run from a palette action, never on a timer). Each recipe was type-checked against the real API and run through the sidebar renderer. It also lists the rules that keep a status widget safe.

### Removed

- **Breaking:** the built-in AWS widget is gone. It moved to a separate package. Anything that relied on it must change:
  - The sidebar and footer no longer show an AWS row unless a package supplies one.
  - The `pi-chassis/aws` export is removed. `registerCredentialProcessResolver`, `resolveAwsContext`, `resolveRegion`, `parseAwsConfig`, `accountFromAccessKeyId`, `roleTone`, `awsExpiresIn`, `formatRemaining`, `formatAwsStatus`, `EXPIRY_SOON_MS`, `SESSION_EXPIRY_VAR` and the types `AwsContext`, `CredentialProcessCall`, `CredentialProcessResult` and `CredentialProcessResolver` have no replacement in pi-chassis. The shared registry key for credential process resolvers is no longer read.
  - `/widgets disable aws` and an `aws` entry in `disabledWidgets` do nothing now. The entry is harmless.
  - The event `aws-status:refresh` and the variable `PI_AWS_SESSION_EXPIRATION` are no longer read by pi-chassis. A package that registers its own `aws` widget keeps using them.
  - The icon table loses `widgetAws` and `widgetAwsFooter`.
  - To get the same row, write one with the recipes in `docs/status-widgets.md`.

### Changed

- `docs/widgets.md` now says where `onDetailClick` works: only in fullscreen mode with the split sidebar. In regular mode, and in the pop-up sidebar that stands in for the split one, clicks do not reach the widget, so anything the user must reach by clicking needs a second way, such as a palette action.

## [0.5.1] - 2026-10-14

### Changed

- The README is now a short overview with links, and the detail lives in `docs/` (usage, git workflows, widgets, tool rows, the diff view API, branding, provider status, how the sidebar works, development). `docs/` is part of the published package, so the docs match the installed version. The README sections that other packages refer to by name moved: "Adding a widget" and "Adding a widget without depending on pi-chassis" are in `docs/widgets.md`, "Tool rows for your extension's tools" is in `docs/tool-rows.md`.

## [0.5.0] - 2026-10-14

### Added

- Detail lines can hold links. A `detail` line may be a list of pieces, each a string or a `{ text, url }` link (the new `DetailLine` and `DetailLink` types, exported from `pi-chassis/client` and `pi-chassis/api`). chassis builds the link itself, and only from a plain https URL (no user name, whitespace or control characters, at most 2048 characters). It shows the label alone when the terminal cannot show links, when the URL is refused, or when the label is empty once cleaned. Text is still stripped of every escape sequence, so a link written into a string, or one that arrives inside a ticket summary or an incident title, never becomes a link. Until now a widget could not show a link in the sidebar at all, because chassis strips escape sequences from widget text.

## [0.4.0] - 2026-10-14

### Changed

- **Breaking:** the package is now named **pi-chassis**. Install `npm:pi-chassis` and import `pi-chassis/client` (and the other exports). The commands are `/chassis` and `/chassis-resume-last`, the settings file is `~/.pi/agent/chassis.json`, the environment variables are `PI_CHASSIS_ICONS` and `PI_CHASSIS_STATE`, and the brand line reads `chassis X.Y.Z`.
- **Breaking:** requires pi 1.2 (`>=1.2.0 <1.3.0`). pi 1.1.0 no longer installs cleanly. The sidebar layout, prompt bars and thinking peek were checked against pi 1.2.0. Plan mode's read-only reminder now also reaches runs another extension starts with a custom message, which pi 1.2 passes through `before_agent_start`.

## [0.3.0] - 2026-10-08

### Added

- Tool rows for other extensions' tools: `registerToolRows(specs)` in `pi-chassis/client` (and `registerToolRows` plus `toolRowsVersion` on the shared registry on `globalThis` for a package that does not depend on pi-chassis) has chassis draw a tool's calls as one-line rows with an icon, title, description, outcome and an expanded view. Specs are `ToolRowSpec` (`icon`, `title`, `describe`, `summarize`, `expand`), exported as types from `pi-chassis/client`. Everything a spec returns is sanitized, a spec that throws falls back to the tool's own renderer, registration works in any load order and returns a function that removes it, and chassis's rows for pi's built-in tools cannot be overridden. `registerToolRows(specs, { id })` takes an optional owner id: registering again with the same id replaces that registrant's earlier rows, so a package that registers on every `session_start` or after /reload does not pile up groups. Entries need a string `title` and function `describe` and `summarize` (and `expand`, if given) or they are skipped. A spec that throws while a call's arguments or output are still arriving is retried on the next frame; one that fails on three finished calls is skipped for new calls, which then use the tool's own renderers and shell. This is a new capability, not a change to `apiVersion`: check `toolRowsVersion`.
- `register(pi, spec, ctx?)` on the registry, and `registerWidget(pi, spec, ctx?)` in `pi-chassis/client`, take an optional `ctx`. A widget registered from inside a `session_start` handler passes the handler's `ctx` so its first `update` and its timer start at once.
- README: how a package without a dependency on pi-chassis registers a widget (including a sidebar section whose detail lines open the full text on click) and tool rows through `globalThis` alone.

### Removed

- **Breaking for the old memory extension's users:** chassis no longer draws the `memory_write`, `memory_update`, `memory_forget` and `memory_search` tools with its own rows, and no longer treats the `memory-recall` message type as a plain row. A memory extension now registers its own rows (`registerToolRows`) and its message type (the shared plain message types set); until it does, those tools use pi's default rendering and `memory-recall` notices get chassis's panel and bar. The `toolMemory` icon is removed from `pi-chassis/icons`.

## [0.2.1] - 2026-10-08

### Changed

- pi-chassis describes itself as a workbench for pi (an interface, git workflows and a widget platform) instead of an OpenCode-style TUI, in the README and the npm description. OpenCode is credited as the inspiration for the interface.

## [0.2.0] - 2026-10-08

### Changed

- **Breaking:** the package exports (`pi-chassis/client`, `api`, `brand`, `icons`, `provider`, `aws`) now resolve to compiled JavaScript in `dist/` with type declarations, instead of the `.ts` sources. A package that depends on pi-chassis can now import it from plain `node --test` and type-check it with `tsc`; before, Node refused to strip types from files under `node_modules`. Deep imports of `pi-chassis/extensions/...` paths are not part of the API and may stop working. pi still loads chassis's own extensions from the `.ts` sources, so nothing changes for users of the TUI.

## [0.1.1] - 2026-10-08

### Security

- Releases are published by CI with npm trusted publishing (OIDC) and carry a provenance attestation. No npm token is stored in the repository.

## [0.1.0] - 2026-10-08

First public release.

### Added

- OpenCode-style TUI for pi: home screen, right sidebar, one-line footer, prompt row with the mode and model, `ctrl+x` leader keys and a `ctrl+p` command palette.
- Build and Plan modes. Plan mode turns off edit and write and limits bash to a read-only allow-list (a guardrail, not a sandbox).
- Tool rows for pi's built-in tools, drawn through `pi.registerToolRenderer`, with live bash output, expandable results, diffs for edit and numbered lines for write.
- Thinking peek, turn telemetry and a finish alert (terminal bell and window title mark).
- Git diff view (`/diff`): changes and branch views, hunks, mouse support, and an API for other extensions (`openDiff`, `openChanges`, `addDiffAction`).
- Git commands: `/commit` (drafts the message from the diff), `/push`, `/merge`, `/pr` (drafts the title and description, opens it with `gh` or `glab`) and `/git`. Each reports its outcome and a fresh repository status to the model on its next turn.
- Widget API (`pi-chassis/client`) for status rows and sidebar sections, with built-in widgets for containers, AWS, MCP, TODO.md, session todos and subagents.
- Replaceable brand layer (`pi-chassis/brand`): name, mark, colours, startup art and surface shades.
- Plain and Nerd Font icon sets (`/chassis icons`).
- Sanitizing of untrusted text (file contents, tool output, git and forge output, session names, widget text) before it reaches the terminal.

[Unreleased]: https://github.com/one24-ai/pi-chassis/compare/v0.7.1...HEAD
[0.7.1]: https://github.com/one24-ai/pi-chassis/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/one24-ai/pi-chassis/releases/tag/v0.7.0
