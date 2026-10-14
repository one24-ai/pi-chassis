# Provider status

The sidebar's provider section shows the provider's name (as registered with pi), the model, context use, tokens and cost for any provider, with no setup. A provider that publishes its plan usage as a `setStatus("<provider>-usage", "... 71%")` line gets a Plan bar automatically (and the figure in the footer when the sidebar is hidden). Any other provider can add its own bars, such as how much of a plan or quota is used, with `registerProviderStatus`:

```ts
import { registerProviderStatus } from "pi-chassis/client";

// The provider already publishes a percentage with ctx.ui.setStatus("acme-usage", "Acme 71%"):
registerProviderStatus({ provider: "acme", name: "Acme", color: "plan", statusKey: "acme-usage", label: "Plan" });

// Or compute bars from anything:
registerProviderStatus({
	provider: ["acme", "acme-eu"],
	meters: (ctx) => [{ label: "Quota", percent: 25, detail: "5 of 20 requests" }],
});
```

Each provider bar has a circle in front of it that fills in eighths with the percentage (`nf-md-circle-slice-*`, U+F0A9E to U+F0AA5; an empty outline at 0). It takes the bar's colour: the status's own colour, the meter's `color`, or accent, then warning from 60% and error from 85%.

- `provider` is the `model.provider` id (or several). `name` overrides the heading (default: the name the provider gave pi), `color` the heading glyph's colour (same tokens as widgets).
- `statusKey` reads a percentage from a `setStatus()` line. The bar takes the status's own colour, and the status is left out of the generic lists. With the sidebar hidden, the footer shows it next to the context.
- `meters` returns `{ label, percent?, detail?, color? }` bars. It runs on every repaint, so keep it cheap. An error in it is ignored.
- A later registration for the same provider replaces the earlier one.
