# Diff view API

Other extensions can show their own diff in the panel and add actions to it (`a` opens the menu). An action runs after the panel has closed, with the file and hunk under the cursor and the file's patch, so chassis shows the diff and leaves what to do with it to you:

```ts
import { addDiffAction, openChanges, openDiff } from "pi-chassis/client";

addDiffAction({
  id: "review-hunk",
  label: "Send this hunk to the reviewer",
  run: ({ file, hunk, filePatch, source }) => { /* file.path, hunk?.text, ... */ },
});

const shown = await openDiff(ctx, { title: "Proposed change", diff: unifiedDiffText }); // true once it was shown and closed; false when nothing was shown (the diff view is not loaded, switched off or already open, or there is no interactive UI)
const opened = await openChanges(ctx, "src/api.ts"); // the git changes view with that file selected (same result)
```

Both work whichever package loads first, and neither needs chassis's registry.
