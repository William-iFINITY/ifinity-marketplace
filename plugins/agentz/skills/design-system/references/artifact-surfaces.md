# Design Artifact Surfaces

AgentZ Design is a product-owned contract, not a CSS snippet agents paste into
each artifact. Large design packets remain useful for reasoning, review,
manual export, and theme work; generated iMIS artifacts should bind the current
design set through the writer tools.

## Design Notation Gate

Before choosing a layout, card treatment, accent, copy voice, chart language,
or exhibit pattern, read `imis_design_system action='get'`
`agentContract.requiredReading`. Then check the written layers:

- `identity`: voice, sentence examples, forbidden words, locale/person.
- `doctrine`: compositional law with rationale/source citations.
- `components`: named anatomy recipes and local vocabulary.
- `exhibits`: reusable patterns and notes.

Tokens answer which values exist; written notation answers when a visual move
is allowed. If the result visible to the agent is compacted and the needed
notation is not visible, do not proceed from palette values alone.

## Normal Binding Paths

| Surface | How CSS is delivered |
| --- | --- |
| ContentHtml `selfContained` | The writer injects canonical token/kit CSS into the ContentHtml stylesheet and wraps markup in `.agentz-design`. |
| ContentHtml `wrap` | The writer wraps markup in `.agentz-design`; use only when the host already supplies the design CSS. |
| Retired query-client artifact | No writer is permitted. Inspect its design binding only as migration evidence, then replace it with a registered client iPart package or remove it. |
| Registered client iPart package | The packager injects or refreshes canonical `design-tokens.css` for files, `zipPath`, and `zipBase64` inputs, and links/scopes the registered runtime entry. A discrete app also requires an RCT and registered `config.html` configuration area. |
| Prebuilt ZIP | The caller must not own `design-tokens.css`. The packager rebuilds the ZIP with the resolved canonical file and runtime link before validation or deployment. Other HTML entries, including `config.html`, must already contain their absolute canonical link and `.agentz-design` scope. |
| App/theme package | Theme work may use root/theme CSS deliberately; this is not an embedded iPart path. |

Every generated visual write should return a `designContract` describing the
set key, provenance, delivery mode, canonical CSS path/URL, scope selector,
and enforcement result.

## CSS Ownership

`design-tokens.css` is reserved. Callers must not provide or overwrite it in
runtime/package files. Use another file or `runtimeCss` for local styling.

Embedded local CSS is allowed when the job needs it, but it must:

- Scope selectors under `.agentz-design`.
- Use `var(--ds-*)` and `var(--ifx-*)` tokens for colors, fonts, and visual
  values.
- Avoid literal colors/fonts unless the user explicitly requires them and the
  surface contract allows that override.
- Avoid `@import`; package assets explicitly and let the tool provide design CSS.

Good:

```css
.agentz-design .event-tile {
  border-color: var(--ds-line);
  background: var(--ds-surface);
  color: var(--ds-ink);
}
```

Bad:

```css
.event-tile {
  color: #156082;
  font-family: Aptos, sans-serif;
}
```

## Update Defaults

- New generated visual ContentHtml/page-builder HTML defaults to
  `designMode: "selfContained"`.
- `update_html` preserves the existing design mode unless the caller explicitly
  changes it.
- Native iMIS iParts remain native surfaces. Do not claim their internal output
  is fully controlled by AgentZ Design.
- Existing tenant artifacts are not migrated automatically.

## Retired Query-Client Artifacts

Do not deploy or update an unregistered query-client runtime. Existing artifacts
can be read to support migration into a registered client iPart package. The old helper reads `#RequestVerificationToken`,
`#__RequestVerificationToken`, matching input/meta names across parent/top/local
document scopes, sends `RequestVerificationToken` with
`credentials: "include"`, and unwraps IQA rows consistently.
