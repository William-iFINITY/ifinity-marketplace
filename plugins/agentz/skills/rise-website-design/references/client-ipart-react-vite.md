# React and Vite client iParts

Use the `react-vite` profile only after you read the common framework authoring contract.

- Keep Vite `base` equal to `/iPartSource/<package-name>.zip/`. Bundle React and all runtime dependencies. Do not use a CDN.
- Do not mount one fixed `#root`. Find all unclaimed package wrappers. Create one React root per wrapper. Observe later insertions and unmount removed wrappers.
- Keep effects read-only or cancelable. Do not write to iMIS from mount or an effect. React development replay must not duplicate a transaction.
- Create an overlay node inside each instance scope. Pass it to portal-based components. Do not portal to `document.body`.
- Keep modal focus entry, containment, Escape handling, accessible name, and focus return inside the owning instance.
- Use `useId` or an instance key for label/control ids. Never repeat document-wide control ids across placements.
- Do not use `dangerouslySetInnerHTML` for untrusted data. Keep IQA template value escaping enabled unless the project contract names a trusted and sanitized source.
- Do not install a service worker or take control of the RiSE route and browser history.

The starter loader supports initial, later, and removed instances. Extend that loader. Do not replace it with the default Vite single-root example.
