# Moving from pi-halo

pi-chassis was called pi-halo up to 0.3.0. To switch:

```bash
pi remove npm:pi-halo
pi install npm:pi-chassis@0.4.0
```

- Your settings carry over: the first time pi-chassis starts and finds `~/.pi/agent/halo.json` but no `chassis.json`, it copies it. `halo.json` is left in place.
- `/halo` and `/halo-resume-last` still work and do the same as `/chassis` and `/chassis-resume-last`.
- `PI_HALO_ICONS` and `PI_HALO_STATE` still work when `PI_CHASSIS_ICONS` and `PI_CHASSIS_STATE` are unset.
- A package that imports `pi-halo/client` (or `api`, `brand`, `icons`, `provider`, `aws`) changes the import to `pi-chassis/...`. The exports are the same.
- Packages that talk to it through `globalThis` change nothing: the keys keep their `pi-halo/` names (`Symbol.for("pi-halo/registry")` and the rest, and `halo.plainMessageTypes`), so a package built against pi-halo works with pi-chassis and the other way round. Sessions saved under pi-halo keep their Build/Plan colours for the same reason.
- `pi-halo` 0.4.0 and later on npm is a thin package that installs pi-chassis and loads it, so an existing install keeps working after `pi update`. Do not install both: remove `pi-halo` when you add `pi-chassis`.
