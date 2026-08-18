# Forms Placement, Routes, Security Posture, and Migration

Display-contract placement, route discovery, route/spam security assessment, and native Forms migration through the configuration-package owner. Loaded from the forms skill router.

### Step 6 — Display Contract: Prepare the Forms iPart binding

Before every Forms iPart placement, generate the display contract:

```
imis_form_display_contract mode="plan" formDesignerLibraryId="<id>" targetContentPath="@/Shared_Content/SignupPage" targetRoute="https://example.org/signup" successMessage="Thank you for submitting." createContact=false duplicateCheck="None"
```

`imis_form_display_contract` builds the sole native Forms iPart `typeElements` contract and binds `b:FormName` to `FormDesignerLibrary.FormVersionKey`. It emits `pageIpartsAddTypedArgs` only when the combined form/display contract is placement-ready; pass that packet to `imis_page_iparts`. Do not hand-build a second XML shape or bypass the assessment for a “plain” form.

For placement, add only the target `documentId` to the returned `pageIpartsAddTypedArgs` and pass that packet unchanged to `imis_page_iparts`. Its canonical kind is `nativeIpart`; do not change it to `formsDisplay` or reconstruct `typeElements`. The inline `formsDisplay` convenience path is a separate call shape that accepts Form settings and re-runs the same display assessment; it rejects supplied `typeElements`. Then run `imis_page_iparts action="inspect"` and `imis_form_routes`; a saved iPart is not a published or rendered route.

Key settings available in the contract:

- `createContact` + `newContactType` + `memberType` + `billingCategory` + `autoAssignCompany` — create an Individual/Company contact and apply the native company-assignment choice
- `duplicateCheck`, `uniqueEmail`, `advancedDuplicateCheck`, `duplicateCheckIqa`, `duplicateMessage`, `overwriteDuplicateMessage`, `allowProceedAnyway` — duplicate detection, custom-message replacement, and whether a matched user may proceed
- `lockId` + `targetId` — lock form to a specific contact
- `successMessage`, `failureMessage`, `additionalMessageTop`

Inspect existing placements with `mode="inspect_existing"` and `contentDocumentPaths`:

```
imis_form_display_contract mode="inspect_existing" contentDocumentIds=["<docId>"]
```

Create-contact and duplicate settings are fail-closed. The required Contact fields must be present and required; additional writable fields without native Signup are blocked because iMIS would discard them. Duplicate checks require Username plus Password. Query mode resolves the selected IQA through the existing canonical IQA importer and verifies that every `fb_duplicate` form field is an IQA filter. Locked anonymous targets require a multi-instance source, a resolvable non-system Party, and no create-contact setting.

### Form chrome, custom page layout, and HTML customization

A placed form composes at three layers; choose the narrowest layer that owns the requirement.

**Inside the form (normalized writer):**

- Every action button accepts `cssClass`; the defaults are `btn PrimaryButton` (Submit), `btn` (Save), `btn DangerButton` (Cancel), and `btn LinkButton` (Link). Fields accept `cssClass`, `labelLocation`, and the native width vocabulary.
- `header` (levels 1–9) and reviewed `rich-text` blocks are the sanctioned in-form markup lanes; the sanitizer rejects scripts, event handlers, and active embeds. One captured control goes in as `type: "native-fragment"`.
- When the requirement genuinely needs a complete hand-written control graph, use the Advanced-mode `htmlCode` lane, which preserves the full FormHtmlCode byte-exact. Do not mix it with normalized lanes.

**On the page (layout and composition):** `formsDisplay` is an ordinary page-graph component. Use `imis_page_builder` with `layoutPreset`/`layoutPath`/`customLayout` and zone assignments to place the form among `html`, query, chart, and client-iPart components; move or reorder any iPart later with `imis_page_iparts action="update_properties"` (`a:LayoutZone`, `sortOrder`). A form in one column with intro HTML above and other iParts beside it is a normal page graph, not a special case.

**Chrome and CSS (styling native controls):** iMIS renders each control in its own `div.node` and adjacent `.btn` buttons inherit only the RiSE theme's spacing — stock themes leave adjacent form buttons with no gap. Levers, narrowest first:

1. **The AgentZ forms-chrome bridge (preferred for token consistency):** pass `formsChrome=true` on the Forms placement (`imis_page_iparts action="place" kind="nativeIpart"` with the display-contract packet, or `kind="formsDisplay"`). This also places an "AgentZ Forms Chrome" ContentHtml beside the form whose stylesheet styles the rendered native controls from the org design tokens: adjacent action-button spacing, `PrimaryButton`/`SuccessButton`/`DangerButton`/`LinkButton` variants, field borders and focus ring, labels, required markers, and `FormsMessage`/`AsiSuccess`/`AsiError` results. Every selector is scoped to the Forms iPart's rendered container, so other iParts and pages without the item are untouched; it is page-side CSS only, so FormHtmlCode and webhook-script verification are unaffected. Remove later with `action="remove" contentItemName="AgentZ Forms Chrome"`. Verify with `imis_rendered_page_audit`; its design evidence includes a `formsChrome` packet with the bridge marker and computed button styles.
2. Per-button `cssClass` values that your theme or a page style block defines.
3. A companion `html` iPart on the same page carrying a scoped `<style>` block that targets the Forms iPart container. Scope every selector to the form's container so other iParts on the page are untouched; verify with a rendered route audit.
4. Tenant-wide chrome belongs to the theme owners (`imis_app_theme_package` / RiSE theme lanes) — use them when the fix should apply to every form on the site.

The generic `.ds-*` component-kit classes remain for designed ContentHtml; do not paste them onto native form fields — the forms-chrome bridge is the token route for native controls.

### Native Forms migration — use the configuration-package owner

Do not add a Forms-only migration tool. `imis_configuration_export` and `imis_configuration_import` are the single cross-tenant transport owner:

```text
imis_configuration_export action=export_package packageName="Forms package" formDesignerLibraryIdsArray=["<id>"] includeNativeFormsEnvelope=true
imis_configuration_import action=plan packageRoot="<package-folder>" includeForms=true
imis_configuration_import action=import_package packageRoot="<package-folder>" includeForms=true
imis_configuration_import action=import_package packageRoot="<same package-folder>" includeForms=true confirmationText="<exact package-bound text from the first import_package call>"
```

When the package was handed off as a manifest rather than an extracted root, use `packageManifestPath="<absolute path to MANIFEST.json>"` in place of `packageRoot` for all three import calls. Keep the same locator and all other plan inputs unchanged for the confirmed execution. Never supply both locators, and never use the obsolete `packagePath` alias.

Export does not temporarily activate inactive forms by default. If the selected native envelope must include an inactive form, repeat the export with `allowNativeFormsTemporaryActivation=true`. The export owner registers the exact inactive snapshot before the first activation request and restores every temporarily activated form independently in its finalization path. Without that explicit opt-in, it must report the native-envelope gap and preserve the REST fallback rather than changing form status silently.

With the Companion connected, export uses the official Form Builder migration JSON and preserves selected forms, layouts, rules, custom groups, and reusable Multi Layout definitions. During a confirmed import, the official active-only grid may require temporary activation for an exact collision backup, shared-definition discovery, or post-import re-export. The import owner registers each exact inactive snapshot before the first write and independently restores every attempted form with readback in finalization; this transport step never makes an imported form launch-ready. Import orders existing Business Object, Panel Source, GenTable, and IQA owners before the Forms envelope. For every native `@content:@/...` process binding it also imports transitive content-folder ancestors first, verifies exact process-page bytes, publishes folders/page through the existing governed RiSE owner, rechecks exact bytes plus Published/active script state, and only then stages the dependent form. For a gated migrated process, pass `formImports[n].postProcessingArtifacts[m]` unchanged as `postProcessingArtifactObject` and the matching `formImports[n].launchGate` unchanged as `postProcessingLaunchGateObject`; do not reconstruct either object from prose.

Every destination import must plan from the active connection, preflight exact source/lookup/group/Multi Layout prerequisites, choose collision update or skip deliberately, and persist the pre-import backup and destination-assigned form/version identities before writing. Accept success only after `_validate`, native Preview, exact official re-export, and placement/runtime checks appropriate to that destination. The returned rollback owns both branches: updates restore the exact prior native envelope; creates remove the imported form's original namespace and any introduced group/Multi Layout definitions, then verify the source definitions unchanged. REST `FormDesignerLibrary` files are an explicit degraded fallback only when the native envelope cannot be used; never describe that fallback as lossless native migration.

### Step 7 — Routes: Find where forms are placed

Before route audit or submit work, resolve iMIS content routes from saved Forms iPart XML:

```
imis_form_routes formDesignerLibraryId="<id>" includeUnpublished=false
imis_form_routes formVersionKey="<versionKey>" pathPrefix="@/Shared_Content/BSA"
```

`imis_form_routes` scans or targets content Document XML, extracts Forms iPart `b:FormName`/`FormVersionKey` bindings and duplicate/contact settings, derives public route URLs, and separates published routes from saved-but-unpublished placements. Do not guess routes from form names.

### Step 8 — Security: Assess route and spam posture

```
imis_form_route_verify check="security" formDesignerLibraryId="<id>" formId="<FormDefinitionId>" expectedAudiences=["anonymous","member"] publicRouteUrls=["https://example.org/forms/signup"] contentDocumentPaths=["@/Shared_Content/SignupPage"]
```

`imis_form_route_verify check=security` assesses route/security/spam/privacy posture from FormDefinition/native FormDesignerLibrary hints, Forms iPart placement settings, rendered audits, and normalized behavior observations. Returns `securityReadinessInput` — pass this directly into `imis_form_launch_readiness securityEvidenceObject`.

Supply rendered audit results and behavior observation arrays for audience-access, CAPTCHA/spam, duplicate behavior, and privacy-exposure checks.
