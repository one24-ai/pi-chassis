# pi-chassis

A workbench for [pi](https://pi.dev): an interface, git workflows and a widget platform for everyday engineering. It adds a sidebar and home screen, Build and Plan modes, a git diff view, and git commands that draft commit messages and pull requests for you. The brand (name, mark, colours, startup art) is a replaceable layer: see [Branding](docs/branding.md).

Requires pi 1.2 and Node.js 22.19 or later.

## Install

```bash
pi install npm:pi-chassis@0.4.0                        # from npm, pinned
pi install git:github.com/one24-ai/pi-chassis@v0.4.0   # from git, pinned to a tag
pi install /path/to/pi-chassis                         # a local checkout
```

Pin a version: pi keeps a pinned npm version or git tag until you change it, so an update never arrives by surprise. See the [changelog](CHANGELOG.md) before moving to a new one.

pi-chassis replaces pi's header, footer and editor, so it does not combine with another package that replaces any of them (pi-open-tui is one): keep only one such package in `packages`.

## Documentation

- [Using pi-chassis](docs/usage.md): features, keys, icons and themes, subagents
- [Git workflows](docs/git.md)
- [Adding a widget](docs/widgets.md)
- [Tool rows for your extension's tools](docs/tool-rows.md)
- [Diff view API](docs/diff-api.md)
- [Branding](docs/branding.md)
- [Provider status](docs/provider-status.md)
- [How the sidebar works](docs/internals.md)
- [Development](docs/development.md)
- [Moving from pi-halo](docs/moving-from-pi-halo.md)

## Versioning

pi-chassis follows [Semantic Versioning](https://semver.org). The public API is:

- the exports in `package.json` (`pi-chassis/client`, `api`, `brand`, `icons`, `provider`, `aws`) and the types they export,
- the slash commands, their arguments and the `ctrl+x` and `ctrl+p` keys,
- the settings it stores in `~/.pi/agent/chassis.json`.

A change that breaks one of those is a major version, a new feature is a minor version, and a fix is a patch. Before 1.0.0, a breaking change bumps the minor version instead (0.1 to 0.2). Each release supports one pi minor version, declared in `peerDependencies`; supporting a new pi minor is a minor release of pi-chassis. Every change is listed in [CHANGELOG.md](CHANGELOG.md); how a release is cut is in [RELEASING.md](RELEASING.md).

## Credits

The interface is inspired by [OpenCode](https://opencode.ai). The thinking peek and turn telemetry are adapted from [pi-open-tui](https://github.com/OldSuns/pi-open-tui). The plan-mode bash allowlist started from pi's plan-mode example. See `THIRD_PARTY_NOTICES`.
