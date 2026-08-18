---
name: website-migration
description: >-
  Migrate an external client website into iMIS RiSE. This skill should be used
  when the user says "migrate our website", "move our site into iMIS", "website
  migration", "crawl our site", "import our web pages", "rebuild our site in
  RiSE", "site migration project", or when moving pages, images, and files from
  a non-iMIS website into RiSE content. This skill owns the end-to-end migration
  pipeline (crawl → classify → map → preview → write → rollback); building new
  pages from scratch belongs to rise-website-design, and moving configuration
  BETWEEN iMIS tenants belongs to configuration-packages.
argument-hint: "[source-url-or-project-id]"
---

# External Website Migration into RiSE

Migrate a client's external website into iMIS RiSE through one tool — `imis_website_migration` — as a durable, resumable project with explicit approval gates. Every phase produces evidence; nothing writes to iMIS without an exact confirmation.

## The Pipeline

```
create_project → crawl → classify → map → preview_batch → write_batch → (rollback_batch if needed)
```

## Step 1: Create the Project

```
imis_website_migration action="create_project" projectName="Acme Society" sourceOrigin="https://www.example.org"
```
The project persists locally and survives across sessions (`action="list_projects"` / `action="get_project"` to resume). Saving an iMIS TXT snapshot of the project is optional and gated behind its own exact `confirmationText`.

## Step 2: Crawl the Source Site (no iMIS writes)

```
imis_website_migration action="crawl" projectId={id}
```
Robots-respecting, GET-only, anonymous: it inventories pages, assets, and redirects with titles, headings, content hashes, and risk flags. It cannot crawl login-protected areas or execute page JavaScript — client-rendered or authenticated content is flagged for manual review, never guessed.

## Step 3: Classify and Map

```
imis_website_migration action="classify" projectId={id}
imis_website_migration action="map" projectId={id} targetRootPath="@/Migrated/acme"
```
Classification sorts pages into migration patterns (landing, article, directory, form candidate, events, donation, member-only, …) with a manual-review queue for low-confidence rows. Mapping produces a dependency-ordered target plan (folders → assets → pages → navigation) under the target root. The target root must be an `@/` path and must already exist in iMIS — `write_batch` refuses, before consuming any approval, when it is missing or not a usable published folder.

## Step 4: Preview a Batch (no iMIS writes)

```
imis_website_migration action="preview_batch" projectId={id} batchSize=10
```
Returns the ordered rows, read-only target-collision checks, unsupported patterns, a rollback strategy, and the exact `confirmationText` that `write_batch` requires. Review the collisions and unsupported rows with the user before writing.

## Step 5: Write the Batch (gated, create-only)

```
imis_website_migration action="write_batch" projectId={id} batchId={id} confirmationText="{exact text from preview_batch}"
```
- **Create-only**: an existing page at a target path fails that row (never overwritten); an existing published folder is reused; a non-reusable folder collision refuses the whole batch before the approval is consumed.
- The approval is **single-use** and drift-checked: if the plan or live target state changed since the preview, the write refuses — run `preview_batch` again.
- Every created artifact is independently read back; navigation rows are returned as explicit handoff packets for `imis_navigation_items` (this tool never writes navigation).
- Batches containing folder rows need the connected companion; the tool tells you before consuming the approval if it is unavailable.

## Step 6: Roll Back if Needed (gated)

```
imis_website_migration action="rollback_batch" projectId={id} batchId={id}
→ returns the rollback plan + confirmationText
imis_website_migration action="rollback_batch" projectId={id} batchId={id} confirmationText="{exact text}"
```
Deletes ONLY artifacts this writer created, in reverse order, with per-artifact absence readback. Pre-existing reused folders and handoff rows are never touched. A partially failed rollback is resumable — re-run it; already-verified deletions are not repeated.

## Boundaries and Verification

- A successful `write_batch` proves artifact creation + readback, NOT that the migrated site renders, routes, or redirects correctly. Prove rendered routes with `imis_rendered_page_audit` per target page.
- Migrated pages keep absolute source URLs for internal links (watchlisted, not rewritten); plan a link-rewrite pass before launch.
- Avoid rolling back one batch of a multi-batch project that shares an asset folder with another batch — check the rollback plan's skipped/failed rows and prefer rolling back newest-first.
- Redirect/SEO parity and post-launch monitoring are not part of this tool yet; record them as launch tasks.
