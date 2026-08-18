# Design Surface Routing

Use this when an iMIS task creates or updates something visual: pages, iParts,
dashboards, widgets, charts, layouts, report shells, email bodies, or RiSE
theme work.

The routing model is layered. Pick the lowest-risk surface that matches the job.

| Need | Preferred surface | Design-system relationship |
| --- | --- | --- |
| Standard iMIS workflow or transaction | Native iMIS iPart | Native output is iMIS-owned. Generated surrounding shells can use AgentZ design, but do not claim the native renderer is fully design-system controlled. |
| Branded static/composed page section | Designed ContentHtml | New generated visual HTML defaults to AgentZ self-contained design binding. Local CSS must stay under `.agentz-design` and use tokens. |
| Live IQA data in a custom UI | Registered client iPart package | A custom data user interface is a discrete app. Its ZIP needs an RCT, registered runtime, registered `config.html` configuration area, and `clientIpart` placement. The package writer owns `design-tokens.css`. |
| Reusable richer widget or other discrete app | Registered client iPart package | Every runtime ZIP needs the same RCT and configuration-area contract, even when it exposes no business settings. Package CSS is scoped/tokenized; prebuilt ZIPs must already contain matching canonical CSS. |
| Existing unregistered query-client artifact | Inspect, migrate, or remove | The queryClient write path is retired. Migrate the runtime to a registered client iPart with RCT, `DisplayHtmlPath`, and `ConfigHtmlPath`, or remove it. A normal ContentHtml link or iframe can point to a genuinely external document, but it must not deploy or proxy an iMIS runtime package. |
| Known reusable pattern | Design-system exhibit | Export/place the exhibit with tool-owned CSS binding, then edit copy/data/options for the page. |
| Novel reusable pattern | New exhibit proposal | Build it for the job with scoped token CSS; promote it into `exhibits[]` only through the design-system preview/update workflow. |
| Whole site/theme skin | App theme package or native RiSE theme workflow | Theme/root CSS is explicit theme work, not an embedded iPart shortcut. |

## Design Rules For Generated Artifacts

- Resolve `imis_design_system action='get'` before designing and read
  `agentContract.requiredReading`.
- Consume the written notation layers before selecting a visual treatment:
  `identity` for voice, `doctrine` for compositional law, `components` for
  anatomy recipes, and `exhibits` for reusable pattern notes. Tokens provide
  values; notation decides whether a pattern is valid.
- If the visible tool result is compacted and the required notation is not
  visible, do not proceed from palette values alone. Retrieve the full payload
  or report a design-notation gap.
- Pass `designSetKey` when the artifact belongs to a microsite/sub-brand.
- Do not copy large design packets into generated iParts. Generated artifact
  writers bind the canonical design set server-side.
- `design-tokens.css` is reserved and tool-owned for runtime/package outputs.
- Embedded artifact CSS selectors must be scoped under `.agentz-design`.
- Use `var(--ds-*)` or `var(--ifx-*)` for colors, fonts, spacing, and local
  styling. Literal colors/fonts are only allowed when the user explicitly
  specifies them and the writer accepts that surface.
- Root/theme CSS belongs only to explicit theme surfaces.
- Existing tenant artifacts are reported as-is. Do not run a migration sweep
  unless the user asks for one.

## Verification Rules

For generated visual artifacts, treat success as incomplete when any of these
are true:

- Expected rendered text is missing.
- The route is a 404 or lands on an unrelated iMIS shell/page.
- Data fetches return 401/403 or no expected rows.
- Expected AgentZ design scope/provenance/CSS evidence is missing.
- A write response omits or fails its `designContract` for a generated visual
  artifact.

Native iMIS iParts still need their own functional/rendered proof. Design proof
for the surrounding shell is not proof of native transaction behavior.
