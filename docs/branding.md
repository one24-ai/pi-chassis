# Branding

The brand is one small object, set by calling `registerBrand` from any extension:

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerBrand } from "pi-chassis/client";

export default function (_pi: ExtensionAPI) {
	registerBrand({
		name: "Acme",                     // "<glyph> Acme pi 1.2.0"; omit for "<glyph> pi 1.2.0"
		glyph: "A",                       // one cell; a private-use glyph (your own icon font) is shown as "●" when the user has plain icons
		icons: "plain",                   // the icon set when the user has not chosen: "nerd" if your users have a Nerd Font
		tagline: "Ship it",               // under the startup art; omit for none
		art: ["▄██▄", "████"],            // startup header rows, painted in `primary`; omit for the pi logo
		colors: { primary: "#E4572E", primaryDark: "#A33B1F", plan: "#F2B134", neutral: "#C9CCC9" },
		surfaces: { panel: "#121212", element: "#1C1C1C" }, // sidebar/messages and the prompt box, dark themes
		lightSurfaces: { panel: "#F0F0F0", element: "#E6E6E6" }, // the same, for light themes
	});
}
```

Every field is optional and merges onto the defaults (a neutral blue, the pi logo, no name or tagline). The brand lives on `globalThis`, so it doesn't matter which package loads first, and `registerBrand` returns a function that puts the previous brand back. Pick `surfaces` (and `lightSurfaces`, if your package has a light theme) to match your theme's `userMessageBg` and `toolSuccessBg`, so pi's own blocks and chassis's agree. Under a light theme chassis uses `lightSurfaces` and darkens the brand colours it draws as text until they reach 4.5:1 contrast on them; rails, bars and the mode pill keep the brand colour exactly, and a dark theme is untouched. A glyph from a patched font is fine as long as your users have that font; otherwise use a plain character.

A brand package is an ordinary pi package with an extension (the `registerBrand` call), and usually a theme. Install it next to chassis; nothing in chassis needs to know it exists. The same package can hold widgets that only make sense for its users.
