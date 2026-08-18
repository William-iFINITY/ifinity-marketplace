---
name: configuration-packages
description: >-
  Move iMIS configuration between tenants as durable packages. This skill should
  be used when the user says "export our configuration", "copy this to the other
  tenant", "move queries/pages/forms to production", "configuration package",
  "tenant-to-tenant", "deploy to the live site", "import the package", "roll back
  the import", or when transporting queries, content pages, layouts, forms,
  business objects, panels, or client iPart packages from one iMIS instance to
  another. This is iMIS-to-iMIS transport; migrating an EXTERNAL website into
  RiSE belongs to website-migration.
argument-hint: "[export-root-or-package-path]"
---

# Configuration Packages (Tenant-to-Tenant Transport)

Export a working configuration from one iMIS tenant into a durable local package, then import it into another tenant as one gated operation with a persisted rollback manifest. Two tools own the lane: `imis_configuration_export` and `imis_configuration_import`.

## Step 1: Export a Package

```
imis_configuration_export action="plan" contentRootPath="@/AcmeSite" queryRootPath="$/Common/Queries/Acme"   # no-write scope preview
imis_configuration_export action="export_package" contentRootPath="@/AcmeSite" queryRootPath="$/Common/Queries/Acme" packageName="acme-rollout"
```
Seed selectors with the root params (`contentRootPath`, `queryRootPath`) or explicit path arrays (`contentDocumentPathsArray`, `queryPathsArray`, `groupNamesArray`, …). The export walks the selected roots plus discovered dependencies — queries, content folders/pages, content layouts, navigation, forms, business objects, panels, client iPart ZIP packages, notification sets — into a local package with a manifest, per-artifact files, and explicit gaps. Page-discovered dependencies (queries a page binds, form bindings, client packages) are pulled in automatically, so exporting a content root carries its runtime dependencies without listing each one.

Review the returned manifest summary and the `gaps` list with the user before promising the package is complete.

## Step 2: Plan Before Import (no writes)

```
imis_configuration_import action="plan" packageRoot={package folder}
```
Read-only: shows what the package contains, per-artifact import lanes, what will be created vs. what already exists on the target, and the exact `confirmationText` the import requires. (Point at the package with `packageRoot` — the package folder — or `packageManifestPath` — the MANIFEST.json.)

## Step 3: Import (gated, per-artifact routing)

```
imis_configuration_import action="import_package" packageRoot={package folder} confirmationText="{exact text from plan}"
```
- Make sure the ACTIVE connection is the TARGET tenant first (import always writes to the active connection) — confirm with `imis_connection_status`.
- Each artifact kind is routed through its guarded owner lane (queries through the query writer, forms through the form writer, layouts before the pages that bind them, client ZIPs as packages); source→target keys are remapped incrementally so imported pages point at imported dependencies.
- **Collision handling is per-lane and defaults to SKIP existing.** An artifact that already exists on the target is left untouched unless you set that lane's `overwriteExisting*` flag (`overwriteExistingDocuments`, `overwriteExistingForms`, `overwriteExistingTaskDefinitions`, `overwriteExistingContentLayouts`, `overwriteExistingClientIpartPackages`, `overwriteExistingGroups`, `overwriteExistingNotificationSets`, `overwriteExistingPanelRecords`) to `true` — an overwrite captures a pre-write backup of each replaced artifact. There is no single create/skip/overwrite mode.
- The result reports per-artifact outcomes (`imported` / `updated` / `skippedExisting` / handoff); a run that skipped existing artifacts returns `imported_with_skips`. Treat any skipped entry as an INCOMPLETE import — the target keeps its existing copy — unless the user explicitly accepts that. A rollback manifest is persisted alongside the package.

## Step 4: Verify on the Target

- Re-read imported artifacts on the target (the import result carries readback ids/paths).
- For content pages, verify a rendered route with `imis_rendered_page_audit` after publish — import readback alone does not prove the page renders.
- Navigation placement is returned as an `imis_navigation_items` handoff, not written by the import.
- **Reskin imported design CSS.** Transport is byte-exact and never re-resolves design, so artifacts with baked AgentZ design CSS (selfContained ContentHtml stylesheets, AgentZ Forms Chrome items, `design-tokens.css` in packages) arrive wearing the SOURCE instance's branding. Run `imis_design_system action="reskin_scan"` with `paths` set to the imported document paths, then `preview_reskin` + `reskin` to re-emit those blocks from the TARGET instance's active design set — authored content is preserved byte for byte. Skip this only when source and target deliberately share identical design tokens.

## Step 5: Roll Back an Import (gated)

```
imis_configuration_import action="rollback" rollbackManifestPath={rollback manifest} → plan + confirmationText
imis_configuration_import action="rollback" rollbackManifestPath={rollback manifest} confirmationText="{exact text}"
```
Reverses the import from its persisted manifest in reverse order: created artifacts are deleted with absence readback, overwritten artifacts are restored from their pre-write backups, and forms/navigation reversals that need native steps are returned as handoffs. A stale confirmation (manifest edited or partially rolled back) is refused — request a fresh plan.

## Boundaries

- Security/access keys are NOT remapped by packages — access assignments on the target are a native/human step per artifact.
- Business Object deletion during rollback is irreversible (it drops data); the rollback plan requires identity evidence captured at import and will hand off rather than guess.
- A green import is configuration transport proof, not business-behavior proof: verify the consuming surface (rendered page, running query, submitting form) on the target before claiming success.
