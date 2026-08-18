# RiSE Design Surfaces And Exhibits

RiSE work crosses content, navigation, layout, native iParts, custom widgets,
and themes. Treat design as a routing choice, not a blanket CSS paste.

## Embedded Page Artifacts

For page sections, dashboards, and widgets embedded inside RiSE content:

- Resolve the current AgentZ design set first and read
  `agentContract.requiredReading` before choosing a pattern.
- Treat `identity`, `doctrine`, `components`, and `exhibits` as written
  design law. Tokens provide values; notation decides whether a layout,
  accent, card treatment, voice, or exhibit is valid.
- Prefer native iMIS iParts for native iMIS behavior.
- Use designed ContentHtml for authored sections and design-system exhibits.
- Use registered client iPart packages for custom IQA-backed UI and all other
  discrete runtime widgets. Each ZIP needs an RCT and registered `config.html`
  configuration area, even when it exposes no business settings.
- Treat `queryClient` as a retired write path. Inspect existing artifacts only
  to migrate them to registered client iParts or remove them.
- Keep custom CSS under `.agentz-design` and use `var(--ds-*)` /
  `var(--ifx-*)` tokens.
- Do not provide `design-tokens.css`; runtime/package writers own that file.

## Exhibits In RiSE

Existing exhibits can be inserted into pages as configurable patterns. Export
the exhibit, place the returned scoped HTML/place args through
`imis_page_iparts` or `imis_page_builder`, then edit copy/data/actions for the
page.

If the page needs a new reusable pattern, build it locally first and verify it.
Promote it into `tokens.exhibits[]` only when the user wants it to become part
of the design system.

## Theme Work

Root/theme CSS is appropriate only when the task is explicitly a RiSE theme or
app theme package. Theme changes require their own rollout evidence: theme
package readback, website binding, publish state, and rendered route checks.

Embedded iParts should not smuggle root/theme CSS into ContentHtml.

## Route Proof

For Staff/member/public placement, verify the actual `~/` route and expected
site shell, not only the raw `@/` content URL. Rendered success requires:

- expected content text present,
- no 404/error landing page,
- live data available when data is part of the promise,
- AgentZ design evidence for generated visual artifacts,
- native iMIS behavior verified separately where relevant.
