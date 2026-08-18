# Agent Delivery Contract

Use this contract for any agentic iMIS task, regardless of subject area. It is intentionally surface-agnostic: the same loop applies to contacts, membership, events, fundraising, finance, IQA, RiSE content, iParts, panel sources, automation, and custom client extensions.

## Universal Delivery Loop

Use the packaged MCP tools, skills, prompts, and capability guide as the operating contract for iMIS work. If a needed rule is not available through those surfaces, treat it as an unresolved product capability gap and hand off the exact missing contract.

1. **Classify the intent**
   - `read`: inspect, answer, summarize, analyse
   - `design`: propose a query, page, process, data model, or configuration
   - `write`: create or update iMIS data/configuration/content
   - `integrate`: connect query/content/iPart/navigation/process surfaces
   - `verify`: prove an artifact works through API, native UI, browser, or domain readback

2. **Name the target surface**
   - Entity/API record
   - IQA/IQD query
   - RiSE site/Perspective ownership
   - Document/content record
   - iPart/content item
   - Navigation/sitemap
   - Business Object or panel source
   - Communication/template
   - Process automation/task
   - Import/export/bulk operation

3. **Discover live shape before writing**
   - Use `imis_site_profile scope=discovery` when a request touches existing websites, microsites, member portals, sitemap/SEO, navigation-aware content, or unclear content ownership. Carry `perspectiveName`, `websiteKey`, `contentRoots`, and `navigationRoots` forward.
   - Browse existing iMIS artifacts in the relevant `@/`, `$/`, or `~/` path.
   - Profile live metadata for Business Objects, panel sources, and suspected custom fields.
   - Use `imis_iqa action=content_plan` when live BO/panel fields need to drive IQA aliases, filters, template placeholders, and iPart selection.
   - Inspect a working iMIS example when iPart XML, relation mappings, or UI-only configuration is involved.
   - Use official help/dev docs when product behavior or endpoint contracts are unfamiliar.

4. **Choose the lowest-risk write primitive**
   - Content write primitives snapshot before mutation by default. Keep `backupBeforeWrite` enabled on `imis_document action=update`, `imis_page_iparts`, layout replacement, and other existing-document writers so the rollback artifact is a compact backupRef, not a pasted Data blob.
   - API entity tools for normal data records.
   - `imis_document action=create` / `imis_document action=update` for content folders and content records. Treat publish as a verified transition; if `statusVerification.verified` is not true, hand off the returned intervention packet.
   - `imis_content_layouts` for custom `LAY` page layouts. Use it when the requested layout is arbitrary; do not force native dashboard presets to stand in for novel designs. Prefer stable layout names with reuse; use replacement only for deliberate reusable-layout changes.
   - `imis_page_builder recipe=dashboard` for multi-page dashboard/content sections that need layout binding, iParts, query/chart/template bindings, subpage tabs, and optional NAV/intervention state in one delivery packet.
   - `imis_navigation_items` for explicit sitemap work. A NAV write is proven only when `DocumentSummary.Path` matches the intended `~/...` path and a Hierarchy lookup resolves for the returned `DocumentVersionId`. Empty-path Working NAV documents are REST-created orphans, not installed navigation.
   - `imis_iqd_query` for guarded IQD query-form validation, assembly, creation, and preview flows.
   - `imis_page_iparts action="place" kind="html"`, `action="place" kind="queryIpart" queryDisplay="menu"`, or `action="place" kind="queryIpart" queryDisplay="template"` for proven page iPart writes.
   - `imis_page_iparts action="place" kind="nativeIpart"` only after capturing the type-specific `b:` XML from a working example.
   - iMIS UI/browser steps when the write shape is not yet proven. Capture the working native example or return the exact missing writer contract before treating the gap as a product limitation.

5. **Verify with the strongest available signal**
   - Entity write: fetch by ID or list with a narrow filter.
   - IQD write: validate, create, resolve `QueryDefinition`, and run a limited `/api/Query` preview.
   - Query Template Display: confirm Template placeholders match Display aliases.
   - Content layout write: inspect decoded `LayoutMarkup`, verify zone tokens, then browser-test a page bound to the layout.
   - Content/iPart write: inspect Document Data XML, verify `DocumentSummary.Status` for publish requests, and use `imis_rendered_page_audit` as routable-page evidence when AgentZ is connected.
   - Navigation write: create/place NAV only through native Site Builder/AgentZ, inspect the NAV by intended path, verify Hierarchy, then browse/run the linked page. If the tool returns `nativeEditorUrl`, the next action is native Site Builder completion, not REST navigation creation or another dashboard/content write. After native completion, re-list/inspect the parent path and report duplicate path records instead of assuming one path maps to one row.
6. **Present action surfaces inline in Cowork**
   - When Cowork exposes `show_widget`, use it for any iMIS result board, choice matrix, remediation queue, audit summary, or approval/action prompt. The widget should carry the evidence rows plus follow-up buttons for predictable actions such as inspecting a page, running a rendered audit, drafting metadata, preparing an update, opening a native handoff, or exporting a report.
   - Do not use `create_artifact` as the primary presentation surface for those Cowork boards. Files are secondary exports after the inline widget, not a substitute for the in-chat action surface.
   - If `show_widget` is unavailable, use the same packet shape in Markdown/files and state the next actions plainly.

## Handoff Packet

Every agent handoff or final delivery should include this packet shape in plain language:

```text
Goal:
Intent class:
Target surfaces:
Primary artifacts:
- path:
- documentId:
- documentVersionId/sourceKey:
- contentItemKey:
Data/query contract:
- sources:
- source aliases:
- display aliases:
- filters/prompts:
- sort/group/template rules:
Content contract:
- site/Perspective:
- websiteKey:
- content path:
- iParts:
- query bindings:
- layout zones:
Backup/restore:
- backupRef:
- snapshot documents:
Verification:
- API checks:
- UI/browser checks:
- domain/readback checks:
Risks:
Unresolved verification gaps:
Next action:
```

## Rules Agents Must Not Hide

- Do not hard-code a demo shape as a permanent product model.
- Do not mark an iMIS shape unsupported until a live example or official documentation proves the boundary.
- Do not rely on raw Business Object property names in Query Template Display; placeholders resolve through Display aliases.
- Do not create generated content under `@/iCore` unless explicitly instructed.
- Do not claim sidebar/navigation placement from a REST-created NAV unless the tool verifies the sitemap path and Hierarchy row.
- Do not mutate original client/system artifacts when a derived working artifact in a peripheral workspace is safer.
- Do not update existing RiSE content, iParts, layouts, navigation, or IQD documents without first capturing a `backupRef` or explicitly explaining why the target is newly created and needs no backup.
- Do not convert native browser/staff publish clicks into an agent contract. Agents either prove publish through a callable API path or return the user-intervention-required packet.
- Do not hand another agent a vague "figure out iMIS" task. Hand off exact artifacts, evidence, and the missing verification step.
