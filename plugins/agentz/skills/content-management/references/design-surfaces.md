# Content Design Surfaces

Use this when content work includes authored HTML, custom dashboard sections,
retired query-client artifact migration, registered client iPart packages, or design-system exhibits.

## Surface Choices

- **Design notation first**: before picking any visual treatment, read
  `imis_design_system action='get'` `agentContract.requiredReading` and the
  written layers (`identity`, `doctrine`, `components`, `exhibits`). Tokens
  are values; written notation decides whether a card rail, accent, layout,
  voice, or exhibit pattern is valid. Palette-only generation is a design
  conformance failure.
- **Native iMIS iPart**: use for standard iMIS behavior: QueryMenu,
  QueryTemplateDisplay, charts, forms, reports, related items, progress
  trackers, checkout/donation/event components. Native output is iMIS-owned;
  AgentZ can brand the surrounding shell.
- **Designed ContentHtml**: use for branded content sections, panels, CTAs,
  instructions, composed dashboard text, and exhibit placement.
- **Registered client iPart package**: use for every discrete custom app or
  runtime ZIP, including live IQA user interfaces such as calendars, command
  surfaces, KPI dashboards, card boards, and custom chart shells. Register the
  RCT, runtime, and `config.html` configuration area, even when the app exposes
  no business settings.
- **Retired query-client artifact**: no query-client write is permitted. Inspect
  an existing artifact only to migrate it to a registered client iPart or remove it.
  Use ordinary ContentHtml links or iframes only for a genuinely external document.
- **Design-system exhibit**: use when the design system already has a pattern
  matching the job; export it and place through the normal writer.

## ContentHtml Design Mode

For new generated visual HTML, omit `designMode` unless you need an override;
the writer defaults to self-contained AgentZ design binding. It wraps markup in
`.agentz-design`, injects canonical token/kit CSS into the ContentHtml
stylesheet, and returns a `designContract`.

For updates, omitted `designMode` preserves the current behavior. Do not
silently re-skin legacy content unless the user asked for a design update.

Local `stylesheet` CSS must be scoped under `.agentz-design` and use design
tokens. Example:

```css
.agentz-design .notice-panel {
  border: 1px solid var(--ds-line);
  background: var(--ds-surface-alt);
}
```

## Verification

After writing a generated visual artifact, inspect the iParts/readback and use
rendered audit when the result is user-facing. Do not claim success if expected
text is missing, the route 404s, data fetches return 401/403, or design
evidence/provenance is missing.
