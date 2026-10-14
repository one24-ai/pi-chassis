# Development

```bash
pnpm install          # typescript + @types/node only
pnpm test             # unit tests (node --test, no pi needed)
pnpm typecheck        # links the installed pi's packages into node_modules, then tsc
pnpm build            # compiles the exports to dist/ (JavaScript and type declarations)
pnpm check            # tests, type check and build, as CI runs them
```

Screenshots (pi in a detached tmux pane, replayed to PNG with pyte + Pillow from public PyPI):

```bash
scripts/screenshot.sh /tmp/shot.png 160 42 "Read button.ts and change red to blue"
# a brand with private-use glyphs: SHOT_FONT=/path/Font-Regular.ttf SHOT_FONT_BOLD=/path/Font-Bold.ttf
```

Try it without touching your settings:

```bash
pi -e /path/to/pi-chassis/extensions/chassis/index.ts
```
