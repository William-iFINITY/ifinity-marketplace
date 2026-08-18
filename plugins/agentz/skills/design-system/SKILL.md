---
name: design-system
description: >-
  Resolve, apply, build, and update AgentZ Design — the org-scoped design
  system whose tokens every AgentZ creation tool applies to generated artifacts.
  This skill should be used when the user says "design system", "design
  tokens", "brand colours", "brand guidelines", "our branding", "style guide",
  "make it match our brand", "change our colours", "fonts", "theme our
  dashboards", "rebrand", or before designing/generating ANY visual artifact
  (dashboard, page, layout, iPart, chart, report, email) in this org.
when_to_use: >-
  Load before any task that produces visual output, and for any request to
  view or change the org's design rules. AgentZ Design is stored
  server-side against the organisation, is readable and updatable by any seat
  through imis_design_system, and is applied server-side by generator tools —
  but your own composed HTML/CSS/copy must follow it too, in every harness.
  This is the brand/token layer only: building pages, iParts, or themes belongs
  to rise-website-design, and authoring ContentHtml or exhibit surfaces belongs
  to content-management.
argument-hint: "[get|assess|preview_update|update|reset|audit|export_exhibit|list_sets|sync_status|sync_instance] [brand notes]"
---

# Org Design System

One typed token document per organisation (`DesignTokensV1`) governs how every
MCP-created artifact looks: brand palette, fixed-meaning status colours,
typography scale, shape/spacing/motion, language rules, optional dark theme.
It is stored server-side against the org, proxied through the connected
AgentZ app, and falls back cached → AgentZ default so creation never breaks.

## Directory

- [references/artifact-surfaces.md](references/artifact-surfaces.md) — how
  AgentZ Design binds to ContentHtml, registered client iPart packages, prebuilt
  ZIPs, retired query-client artifact migration, and theme surfaces.
- [references/exhibits.md](references/exhibits.md) — how to export existing
  exhibits, place them as iParts/page components, create new patterns, and
  promote reusable patterns back into the design system.
- [../imis-domain-knowledge/design-surface-routing.md](../imis-domain-knowledge/design-surface-routing.md)
  — the cross-iMIS routing model for native iParts, designed ContentHtml,
  registered client packages, retired query-client artifact migration, exhibits, and theme work.

**The contract (applies in EVERY harness — Claude Code, Codex, Cowork):**

1. **Resolve before you design.** Before composing any visual output — page or
   layout HTML/CSS, dashboard sections, chart colours, fonts, email markup —
   call `imis_design_system action='get'`. Read
   `agentContract.requiredReading` first, then the written nuance layers:
   `identity`, `doctrine`, `components`, and `exhibits`. Only then use the
   returned `tokens`, `agentContract.usage`, `agentContract.rules`, and
   relevant `emissions` for values. In normal generated iMIS artifacts, do
   not paste large CSS emissions yourself: pass `designSetKey`/`designMode`
   and let the writer bind canonical CSS and provenance. Mention the
   provenance (`org`, `cached`, or `default`) when you present a design.
2. **Doctrine before pattern.** Tokens answer which values exist; written
   notation answers when a visual move is valid. Do not infer that a colour,
   radius, font, rail, badge, card treatment, or exhibit pattern is allowed
   merely because the token exists. If the host returns a compacted design
   packet and the needed doctrine/voice/component notes are not visible,
   retrieve the full payload or report the notation gap before designing.
3. **Fixed status semantics.** Red = failure only, green = confirmed success
   only, orange = needs attention, yellow = transient. Never decorative.
4. **Language rules.** Sentence-case headings (no uppercase transforms),
   humanized labels (IQA Display aliases — never raw column keys), detail
   defers behind expansion, never truncated away.
5. **Typography honesty.** Only declare a font the artifact actually loads
   (the emissions include @font-face for declared webFonts) or a
   web-safe/system family. Text never below the scale floor — express finer
   hierarchy with weight/opacity.
6. **Explicit user input wins.** If the user supplies specific colours/fonts
   for an artifact, those override the tokens for that artifact; org tokens
   override the AgentZ default for everything else.
7. **Tokens constrain values, never ambition.** Do not flatten designs into
   bare kit cards: the kit has an expressive tier — `.ds-hero` (token-derived
   gradient band), `.ds-display` + `.ds-text-accent` (display/gradient type),
   `.ds-stat`/`.ds-stat-row`, `.ds-grid`, `.ds-wash`, `.ds-band` — and custom
   CSS written from `var(--ds-*)` (plus `emissions.gradients`) is first-class
   when scoped under `.agentz-design`. Match the visual ambition of the
   surface; a brand page deserves a hero, not a table. Lay out actions with
   `.ds-button-row` (and stats with `.ds-stat-row`) — never with text spaces
   between inline buttons, which collapse to zero gap when they wrap.

   **Titles are a composable family**, not a fixed block: anatomy
   `.ds-title > .ds-eyebrow + h_.ds-title-text + .ds-subtitle +
   .ds-title-meta/.ds-title-actions` with stackable variants `--bar`,
   `--rule`, `--center`, `--display` (pairs with `.ds-text-accent` gradient
   words), `--compact`, `--split` (actions right). The generated dashboard
   shell header IS this family (`titleVariant` option, default `bar`), so
   custom and generated titles never drift; for a fully bespoke header, set
   `includeGeneratedShell: false` and compose your own from the family or raw
   `var(--ds-*)`.
8. **Embedding rules.** Artifacts render inside host pages: image srcs must
   be root-relative (`/images/Brand/...`) or absolute https — iMIS does NOT
   resolve `~/` inside raw HTML. Dark surfaces are a deliberate choice via
   `data-ds-theme="dark"` on a scope or band — never the OS preference, which
   would flip a component against its light host page.

## Reading

`imis_design_system action='get'` → active tokens + provenance + writeCount +
CSS emissions + `agentContract.requiredReading`. The required reading is the
front-loaded design-language brief: identity/voice, doctrine, component
recipes, exhibit notes, and the warning that a token is not permission to use
a pattern. Treat emissions as reasoning, manual export, email/theme, or
fallback material. Generated iMIS artifact writers bind CSS through their own
design contracts. `action='audit'` lists which generator surfaces consume
tokens server-side versus pending migration.

If an MCP host compacts a large result, do not continue from the colour sample
alone. The design system is the written notation plus tokens; palette-only
generation is a conformance failure.

## Building the system out (the framework)

`action='assess'` is the build entry point — run it when the system is
unbuilt, stubbed in an area, or the user asks to build/extend it. It returns:

- **Completeness report**: which areas are still stubs (palette, typography,
  web fonts, logo roles, favicon, email logo, asset registry, dark theme).
- **Materials checklist** — what to request from the org: brand colours;
  primary logo (SVG preferred) plus dark-surface variant; favicon; email
  header image; hosted font URLs (https woff2) or an agreed web-safe stack;
  the brand guide document; their public website URL (a legitimate derivation
  source); and a list of microsites/sub-brands needing their own set.
- **Build plan** — the ordered steps below, ready to follow.

**Image assets are uploaded into iMIS and indexed.** For every image the user
provides, chain the existing upload tool, then register the result:

1. `imis_site_assets assetKind='image' action='upload'` (name it under
   `Brand/…`) → returns `webPath` / `documentPath` / `documentId`.
2. Record it in `tokens.assets.registry` under a stable role
   (`logo-primary`, `logo-dark`, `favicon`, `email-logo`, `hero-…`):
   `{ role, label, tenants: [{ instance: <active iMIS base URL>,
   documentPath, url, documentId }] }`.
3. **Multi-tenant orgs**: repeat the upload on each instance (instance
   switching) and append one `tenants[]` entry per instance — the registry is
   the manifest of where every brand asset lives on every tenant.

Then compose the **complete** DesignTokensV1 (start from `get`, modify) and:

1. `action='preview_update'` — validates the closed schema, https-only
   assets, the ≥10px type floor, and **accessibility contrast** (unreadable
   combinations are rejected); returns a diff + exact `confirmationText` +
   `expectedWriteCount`.
2. Show the user the diff and confirm they want it applied.
3. `action='update'` with the same document, the exact `confirmationText`,
   and the previewed `expectedWriteCount`. The result's readback
   (`readbackVerified: true`) is the only success proof. A 409 conflict means
   someone else changed it — re-read and re-preview.
4. Prove it: regenerate one visible artifact and check it with
   `imis_rendered_page_audit`.

`action='reset'` (confirmation-gated, `resetConfirmationText` comes from
`get`) returns the org to the AgentZ default.

## Ingesting full brand guidelines (blue-chip nuance, captured whole)

When the org has a real brand guidelines document (PDF, site, or deck), it is
the PRIMARY source and must be ingested **page by page** — skimming
normalises; reading captures. The point of the nuance layers is that the
finished system reads like the brand wrote it, not like a template wearing
the brand's colours.

1. **Read every page.** For each rule the guidelines state, write a
   `doctrine[]` entry **as written** (lightly compressed, never paraphrased
   into genericity) with `area`, optional `rationale`, and a `source`
   citation (e.g. `"Slack Brand Guidelines p.24 — logo misuse"`).
   Logo clear-space, minimum sizes, misuse lists, accessible colour
   combinations, photography direction, governance limits — all of it.
2. **Distil the persona into `identity`.** `essence` is "the system in one
   paragraph"; `voice` carries the voice/tone rules; `sentenceExamples`
   carries don't/do pairs (write new ones in the brand's voice if the
   guidelines teach by description); `forbiddenWords`, `eyebrowVocabulary`,
   `locale`, `person` complete the voice law.
3. **Map the measurable into tokens** — palette (watch for accessible-combination
   tables: encode them as doctrine too), type stacks WITH substitutes
   (declare only loadable fonts; record the ideal stack in doctrine),
   spacing/radii/motion where stated.
4. **Author the brand kit** (`brandKitCss` + `components[]`): translate the
   brand's compositional language into its own CSS vocabulary — rails,
   rhythm, eyebrow treatments, card recipes, named with the brand's terms.
   Scope under `.agentz-design`; it layers AFTER the generic kit, so restyle
   `ds-*` where the brand disagrees and add brand-named classes for what the
   generic kit cannot say. Each named component also gets a `components[]`
   recipe (anatomy in words) so future agents compose semantically.
5. **Grow the exhibit catalogue** (`exhibits[]`): every pattern worth
   repeating becomes an exhibit — `id`, `title`, `section` (e.g. "Brand",
   "Patterns", "Institutional"), and sanitized `html` composed from kit +
   brand classes. The catalogue is OPEN: it is built from the work, never
   prescriptively filled, and renders live in the AgentZ Design page in the
   companion app. Reuse existing exhibits as composition starting points.
   **The sophistication bar**: an exhibit a recoloured kit could produce is
   NOT an exhibit. Compose novel structure — split heroes with embedded
   console/trace mockups, workflow rails, editorial stat spreads,
   sourced-answer cards, asymmetric grids — with the brandKitCss classes to
   support them. Compositions are never hardcoded into surfaces: the bundled
   `agentz-default-*` exhibits are the generic floor and a real brand build
   REPLACES them. Image srcs in exhibits are root-relative for tenant
   placement (the Design page resolves them against the active instance);
   email-context exhibits use absolute https (email clients need it).
   Sanitization: no script/iframe/object/embed/link/meta/base/form, no
   event-handler attributes, no `javascript:`, src/url() https or
   root-relative; ≤ 24KB per exhibit, max 40.
6. **Prove with collateral, not swatches.** Build a preview artifact in the
   brand's own genre (their hero, their report cover, their card grid) and
   compare against the guidelines' examples before `update`.

## Authoring the brand kit (escaping the generic floor)

The generic `ds-*` kit is a bootstrap floor for orgs with no built system.
An org with an authored brand kit should barely look like it: the kit you
write defines the brand's section rhythm, its activation-colour law, its
hero/diagram language, its component anatomy. Sophistication bar: the org's
own best collateral. Sanitization rules for `brandKitCss`: no `@import`, no
markup (`<`), no `expression()`/`javascript:`, `url()` only https or
root-relative; ≤ 64KB.

## Archaeology before authoring (source triage)

A design system is reverse-engineered, not invented. Before composing:

1. **Inventory and verify every source** — stop and ask if a named source
   will not open. Rank by truth value: the org's EXISTING iMIS SITE (theme
   CSS, rendered production pages — the closest thing to a codebase) >
   brand guideline documents > the public website > screenshots > prose.
   Higher rank wins conflicts.
2. **Declared intent first, frequency second.** Guideline-stated values and
   existing theme variables are ground truth — preserve their names in
   doctrine. With no declared system, frequency analysis: a colour/radius/
   shadow repeated across production pages is a token; a one-off is noise.
3. **Preserve irregularities.** If buttons are 6px radius and cards 16px,
   that asymmetry IS the system — normalising it away produces off-brand
   output. Document looseness honestly instead of inventing tidiness.
4. **Omission over invention.** Anything not observable is omitted or
   recorded as a doctrine entry with source "substitution" (e.g. a font
   fallback when binaries are unobtainable) so the gap stays visible.
5. **Negative space is binding.** What the brand never does (no gradients,
   no emoji, no drop shadows…) is captured as doctrine, same as positive law.
6. **Iconography and imagery are first-class**: record the icon set, stroke
   weight, filled/outline policy and imagery temperature as doctrine areas;
   upload real icon/illustration assets via imis_site_assets — never redraw.
7. **States carry brand feel**: hover/focus-visible/disabled treatments
   (darken? lighten? scale?) are extracted and encoded in the brand kit, not
   left to the generic defaults.

Per-face web fonts: one `webFonts[]` entry per weight/style face
(`weight`, `style` descriptors) — declaring only the family makes the
browser synthesise faux bold, which reads off-brand instantly.

## Porting exhibits into pages and iParts

Exhibits are not just a gallery — they are deployable patterns. To put one on
a tenant page: `action='export_exhibit'` with `exhibitId` returns scoped
placement markup plus place arguments for `imis_page_iparts` (action=place
kind=html) or an `imis_page_builder` html component. Normal iMIS placement
lets the writer inject canonical CSS and return the `designContract`;
`portableHtml` is only for manual/foreign-host use. Edit copy and data
bindings to fit the page; keep the scope wrapper. Omit `exhibitId` to list the
catalogue. The reverse flow matters equally: when you compose a strong pattern
directly on a page, propose saving it back as an exhibit so the catalogue grows
deliberately.

## Native iMIS Forms chrome bridge

The design system also reaches native Form Builder controls — not by pasting
`.ds-*` classes onto form fields (never do that), but through the opt-in
forms-chrome bridge: pass `formsChrome=true` when placing a Forms iPart with
`imis_page_iparts` (kind=nativeIpart with the display-contract packet, or
kind=formsDisplay). It places an "AgentZ Forms Chrome" ContentHtml whose
stylesheet is emitted from the org tokens and styles the rendered native
controls: adjacent action-button spacing, the native
`PrimaryButton`/`SuccessButton`/`DangerButton`/`LinkButton` variants, field
borders and focus ring, labels, required markers, and
`FormsMessage`/`AsiSuccess`/`AsiError` results. Every selector is scoped to
the Forms iPart's own rendered container, so tenant chrome, other iParts, and
pages without the item are untouched, and org token changes flow through on
the next placement. Verify with `imis_rendered_page_audit` — its design
evidence includes a `formsChrome` packet with computed button styles.

**The scope is bound to the Forms iPart's name.** iMIS builds the rendered
container id from the iPart's `ContentItemName` (`ci` + the name's
id-legal characters), so the chrome stylesheet is derived from the title you
place with. Two consequences:

- **Renaming a Forms iPart breaks its chrome**, because the container id
  changes. `imis_page_iparts update_properties` refuses such a rename while a
  chrome item is present and names the remedy; after any rename, either
  re-place with `formsChrome=true` or run `imis_design_system action=reskin`,
  which re-scopes the chrome to the page's current Forms iPart.
- **The audit disproves an inert bridge.** If the marker is present but its
  declared scope matches no rendered container, the audit raises a high
  `design` issue naming the declared scope and the containers actually
  rendered — inert chrome produces no browser error, so this is the only
  signal. `formsChrome.scopeMatchesRenderedForm` is the field to check.

Reskin fails closed when a page has no Forms iPart (orphaned chrome) or more
than one (ambiguous target) rather than guessing which container to target.

## Typography beyond the body scale

`typography.scale.display` (optional, px, xxl..120) sets the display/hero
type ceiling — without it the display clamp defaults to `xxl*2`. Brands with
oversized editorial display type declare it; brands with restrained display
type cap it low. Further type styles (named per-brand title anatomies) are
authored as brandKitCss + exhibits, not new schema slots.

## The expressive tier is a DEFAULT, not the brand

The bundled gradient hero / display type / stat chips are the house style —
a prescription that exists so unbuilt orgs never render unstyled. `assess`
flags "expressive tier: stub" until brandKitCss restyles the expressive
vocabulary (ds-hero/ds-display/ds-band) or exhibits exist. A finished brand
build REPLACES the house expressive language with the brand's own.

## The report/print tier (complexity when the page needs it)

The kit ships a report/print vocabulary for genuinely complex pages (G-039,
born from the IRSE badge-report field session): `ds-table--dense` for compact
data tables, `ds-toolbar` (with styled inputs/selects/labels) for filter
rows, `ds-pager` for paging controls, and `ds-print-sheet` +
`ds-card--physical` for PHYSICAL-UNIT print layouts — card dimensions come
from `--ds-print-card-w`/`--ds-print-card-h` (defaults 90×54mm, the UK Avery
L4727 name-badge insert) with `@media print` rules that hide `ds-print-hide`
chrome and keep cards unbroken across sheets. Reach for these before
hand-rolling report CSS.

## Guest palettes (third-party brands without a design set)

A demo/prospect page for an org that is NOT the licensed brand needs that
org's colours, but literal colours are banned in caller CSS. Pass
`guestPalette` ({"primary":"#3DAE2B", ...}) on `imis_client_ipart_package`
— the tool mints scoped `--ds-x-<name>` variables inside the tool-owned
`design-tokens.css`, and package CSS styles with `var(--ds-x-primary)`,
staying fully inside the design contract. Guest variables are additive; the
core `--ds-*` tokens keep the licensed design. For a REAL ongoing sub-brand,
build a child design set instead (next section). QTD `templateHtml` remains
the intentional unvalidated surface (native-IQD content outside the artifact
contract) — use it for brand-bespoke query cards when needed, and prefer the
guest palette wherever the contract applies.

## Parallel / child design sets (microsites, sub-brands)

An org has one base set (`default`) plus optional named sets for design
deviations. `action='list_sets'` enumerates them. To create one: `get` the
parent, copy its document, change **only** the deviating tokens (e.g. a
microsite palette and its logo roles — keep status semantics), then
`preview_update`/`update` with `setKey='<child>'` and
`parentSetKey='<parent>'`. Children are **deliberate build-time forks** with
recorded lineage — parent edits do not flow through; re-derive or update
children when the base brand changes. `reset` on a child removes it.
Child-set confirmation text is `APPLY AGENTZ DESIGN SET "<setKey>" "<name>"
(writeCount N)` (the base set uses `APPLY AGENTZ DESIGN "<name>" (writeCount
N)`); always submit the verbatim `confirmationText` the preview returned rather
than reconstructing it.

**Using a child set in builds:** pass `designSetKey='<child>'` to
`imis_page_builder` or `imis_page_iparts` — everything that build generates
(dashboard shells and registered client iPart packages) styles from that set, and its
provenance stamps carry `set:<child>`. An unknown set falls back to the org
base so nothing renders unstyled. Apply the same set's tokens to any markup
you author for that microsite yourself.

## Syncing sets across licensing accounts (same instance)

When multiple licensing accounts share one iMIS instance, `action='sync_status'`
reports which design sets exist on the other account versus this one, and
`action='sync_instance'` performs a **pull-only** copy of the sets this account
is missing from another account on the same instance. It never pushes local sets
outward and never overwrites a set that already exists here — it only fills gaps —
so run `sync_status` first to see what a `sync_instance` would pull.

## Reskinning existing artifacts (token updates and cross-instance imports)

Design CSS is **baked into artifacts at write time** and provenance-stamped
(`agentz-design: org vN schemaN`). It never re-resolves on its own, so two
situations leave artifacts wearing the wrong design:

1. **A token update** — artifacts written before the update keep the old
   version until regenerated.
2. **A cross-instance configuration import** — package transport is byte-exact
   and does no design re-resolution, so imported artifacts arrive carrying the
   SOURCE instance's baked branding.

The reskin actions bring stamped artifacts to the ACTIVE instance's current
design without touching authored content:

```
imis_design_system action="reskin_scan"    paths=[...imported document paths] and/or rootPaths=[...folders]
imis_design_system action="preview_reskin" {same scope}            → plan + exact confirmationText
imis_design_system action="reskin"         {same scope} confirmationText="{exact text}"
```

- Discovery covers selfContained ContentHtml stylesheets, "AgentZ Forms
  Chrome" items, and `design-tokens.css` inside iPart-source / theme ZIP
  packages. Classification is a byte-compare of each stored tool-owned design
  block against the active set's regenerated emission — `current` needs
  nothing; `stale` is rewritten.
- Authored caller CSS and HTML are preserved byte for byte; only the emitted
  design block is replaced. A legacy stylesheet whose brand-kit tail cannot be
  separated from authored CSS is reported `ambiguous` and fails closed —
  re-place that item through its owner writer.
- Artifacts stamped from a different design set are listed as `other_set` and
  untouched unless you re-run with that `setKey` or pass `adoptAllSets=true`.
- Apply takes a durable backup first and proves each write by byte-exact
  readback; rendered adoption still needs `imis_rendered_page_audit`.

Run reskin as the **standard post-import step** after migrating configuration
packages between iMIS instances, scoped to the imported document paths.

## Boundaries

- Governs MCP-created artifacts only — never the AgentZ product chrome.
  Existing artifacts adopt new tokens when regenerated or through the gated
  reskin actions above.
- Token storage is not rendering proof: restyled pages still need publish +
  rendered verification (imis_rendered_page_audit) like any content change.
