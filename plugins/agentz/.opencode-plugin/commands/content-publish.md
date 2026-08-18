---
description: "Create and manage iMIS content pages, folders, and site structure in the Document System"
---

# Content Publishing

Create and update content in the iMIS Document System, and handle publish as a verified state transition. Publishing uses the native iMIS/AgentZ companion workflow plus `DocumentSummary.Status` readback; do not attempt a REST status write or claim live content before `Published` verifies.

## Understanding the Document System

Everything in iMIS — pages, folders, queries, templates — is stored as a Document.

Key paths:
- `@/` — Site root
- `@/Shared Content/` — preferred peripheral area for generated/custom proof content when present
- `@/iCore/Content/` — system/sample content pages; inspect freely, but avoid creating proof pages here
- `~/` — sitemap/navigation hierarchy (`NAV` documents); this is separate from content folders/pages
- `$/Common/Queries/` — System IQA queries

Document types:
- `FOL` — Generic folder
- `CFL` — Content folder in the `@/` content tree
- `NAV` — Sitemap/sidebar navigation item in the `~/` tree
- `CON` — Content record (page)
- `IQD` — IQA query definition
- `LAY` — Content layout definition

## Actions

Before acting, classify the target surface so the next agent can follow the decision:
- `site-discovery`: Perspective/site ownership, website key, content roots, navigation roots via `imis_site_profile scope=discovery`
- `document`: folder/page create or metadata update
- `content-layout`: custom `LAY` layout definition via `imis_content_layouts`
- `html-ipart`: custom HTML/CSS block
- `query-menu-ipart`: query/folder table, prompts, export/search
- `query-template-ipart`: IQA Template tab output; requires Display alias proof
- `query-content-plan`: custom BO/panel/IQA data driving page or iPart design; use `imis_iqa action=content_plan`
- `typed-ipart`: another iPart type captured from a working example
- `navigation`: sitemap/routing/publish state

Navigation proof rule: NAV creation is native Site Builder/AgentZ only. A created NAV item is installed only when `DocumentSummary.Path` is the intended non-empty `~/...` path and a Hierarchy lookup resolves; do not attempt REST navigation creation or report the sidebar item as complete before that readback.

Change safety rule: before editing an existing page, content folder, layout, query document, navigation item, or iPart XML, keep `backupBeforeWrite` enabled on the relevant write primitive. Carry the returned `backup.snapshotId` or `backup.snapshotPath` as the rollback reference instead of pasting full Data blobs into chat context.

### Discover and Prepare
For existing public sites, microsites, member portals, sitemap/SEO work, or navigation-aware content:
```
imis_site_profile scope=discovery perspectiveName="<site name>"
```
Use the returned `contentRoots`, `navigationRoots`, `websiteKey`, and recommended next calls to scope the rest of the work.

### Browse
Use `imis_document action=browse` with the path from $ARGUMENTS (default: `@/`).
Show the folder tree with document names, types, and statuses.

### Create a Page or Folder
1. Ask for: name, parent path, type (page vs folder), description
2. If the page will be query-backed or custom-panel-backed, run `imis_iqa action=content_plan` before choosing the IQD/iPart shape.
3. Use `imis_document action=create`:
   - `name`: the document name
   - `parentPath`: where to create it (e.g., `@/Shared Content/AgentZ`)
   - `documentTypeId`: CON for pages, CFL for content folders, FOL for generic folders
   - `isFolder`: true for folders, false for pages
4. Confirm creation with the assigned DocumentId
5. Only pass `allowSystemPath=true` if deliberately editing `@/iCore` system/sample content.

### Create a Custom Layout
Use `imis_content_layouts` when a page needs arbitrary zones instead of an existing preset:
```
imis_content_layouts action="plan" layoutName="Client_Bento" parentPath="$/Custom/Layouts" layoutSpec='{"rows":[{"columns":[{"zone":1,"className":"col-sm-8"},{"zone":2,"className":"col-sm-4"}]}]}'
imis_content_layouts action="create" layoutName="Client_Bento" parentPath="$/Custom/Layouts" reuseExisting=true layoutSpec='...'
```
The tool validates the iMIS zone contract: one outer `<div>`, unique numbered zones starting at 1, and safest Bootstrap `col-sm-*` row totals. Agents may provide public custom-layout tokens such as `<p>1</p>`, but the writer stores the native `LAY` form (`{1}`) so Content Designer renders real editable zones. Use stable layout names and `reuseExisting=true` by default; use `replaceExisting=true` only when intentionally updating an existing layout. Bind the returned `layoutDocumentVersionKey` to content pages through `imis_page_builder recipe=dashboard` page specs or by using the dashboard `customLayout` field.

### Update Content
1. Get current document: `imis_document action=get` with documentId or path
2. Keep `backupBeforeWrite` enabled when updating; set `backupLabel="<short-label>"` if the change needs a named rollback point.
3. Show current state (name, status, description, iPart/layout/navigation dependencies)
4. Apply changes with `imis_document action=update`:
   - `documentId`: the document to update
   - `name`, `description`, `status`, `data` as needed

To restore a saved backup intentionally, use `imis_document action=update restoreSnapshotRef="<snapshotId-or-path>" confirmRestore=true`. The restore path captures a pre-restore backup by default.

### Publish
Use `imis_document action=update` with `status: "Published"` to request publish, then inspect the response:
- If `statusVerification.verified` is `true`, publish is proven through the callable API path.
- If `publishState` is `user_intervention_required`, hand the `userIntervention` packet to the user or orchestrator. The required route is RiSE > Page Builder > Manage content or the Page Builder Task list approval workflow.

Browser/native staff flows may be used to observe and reverse-engineer iMIS behavior, but they are not the MCP publish mechanism because downstream agents do not have GUI access.

### Inspect Page Content
Use `imis_page_iparts action="inspect"` for full XML-aware inspection. It returns parsed iParts plus `placeTemplate` for captured types; use that before `place (kind=nativeIpart)` for charts, PanelEditor, navigation/content organizer, and specialist commerce/event iParts. `imis_document action=content_items` is useful for read-only metadata but does not expose the full XML contract.

## Summarize

- Document created/updated with ID and path
- Site/Perspective, websiteKey, contentRoots/navigationRoots used
- BackupRef/snapshotPath for every existing document changed
- Current status (Draft, Published, Archived)
- Navigation impact if applicable
- Surface classification and write primitive used
- iPart details when applicable: type, contentItemKey, layout zone, sort order, query path/source key, alias/template assumptions
- Publish evidence: `statusVerification`, `publishState`, and any `userIntervention` packet
- Verification evidence: Document Data XML inspection, query preview, browser/editor observation when used as proof, and unresolved proof gaps
