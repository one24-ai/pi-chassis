# pi-halo is now pi-chassis

This package only keeps existing installs working. It bundles [pi-chassis](https://www.npmjs.com/package/pi-chassis) and loads it, and `pi-halo/client` (and the other exports) forward to `pi-chassis/...`.

Switch when you can:

```bash
pi remove npm:pi-halo
pi install npm:pi-chassis
```

Your settings carry over, and `/halo` still works. See [Moving from pi-halo](https://github.com/one24-ai/pi-chassis#moving-from-pi-halo).
