---
name: imis-domain-knowledge
description: >-
  iMIS EMS Cloud domain knowledge and agent routing contract. Use for every
  iMIS task to classify intent, name target surfaces, discover live shape,
  choose the lowest-risk MCP writer, verify results, and leave a handoff packet
  so the next agent does not rediscover iMIS behavior from scratch.
when_to_use: >-
  Trigger on any request involving iMIS, RiSE, IQA/IQD, content, iParts,
  navigation, Business Objects, panels, contacts, members, events, fundraising,
  finance, commerce, certification, imports, configuration, or client-specific
  custom fields. Load this before specialist iMIS skills.
user-invocable: false
---

# iMIS EMS Cloud — Domain Knowledge

You are connected to **iMIS EMS Cloud**, an association and membership management system used by nonprofits, professional associations, and membership organizations. Think in iMIS terms, not generic REST API terms.

## iMIS Routing Contract

This skill is the durable context entrypoint for iMIS work. Rely on the MCP tool descriptions, specialist skills, prompts, and capability guide for the current product contract; if a needed iMIS rule is missing from those surfaces, treat it as an unresolved capability gap and hand off the exact missing contract.

## Cowork Inline Presentation Contract

When running in Claude Cowork and the `show_widget` inline chat visualization tool is available, present iMIS task results that require the user to read, compare, choose, approve, or act as an inline widget in the conversation. This applies to sitemap/SEO/a11y audits, rendered page evidence, content and iPart change plans, IQA/source comparisons, publish checklists, excluded findings, remediation queues, and any call-to-action matrix.

Use `show_widget` as the primary surface with compact summary cards, filterable/detail rows, severity or status chips, evidence links/paths, and follow-up buttons for predictable actions. Do not use `create_artifact` for those boards in Cowork. A saved HTML, DOCX, CSV, or other export can be offered only as a secondary deliverable when the user asks for a file or when a file is the explicit deliverable; still render the actionable board inline first.

Do not apply this as a hard requirement in Claude Code, CLI, or other runtimes where `show_widget` is not loaded. In those environments, preserve the same structure in concise Markdown and ordinary files while making the follow-up actions explicit.

For every iMIS request:

1. Classify intent, surface, grain, and desired output. Use [routing-contract.md](routing-contract.md) to decide whether the work belongs to a domain workflow, raw entity/API lookup, IQA/report tooling, content tooling, a specialist agent, or an implementation packet.
2. For answer-only or operational Party/contact questions, prefer workflow/domain tools before IQA/IQD design. Members, prospects, donors, customers, and organisations are all Party records; do not route them to IQD creation just because the user asks for analysis.
3. For broad cohort work, distinguish an immediate answer from a reusable report/export. If the MCP lacks a compact candidate-list primitive, identify that as a tool gap and use the lowest-noise proven path instead of drifting through unrelated schemas.
4. Discover live shape before writing or integrating. Use `imis_site_profile scope=discovery` before RiSE/content/navigation/member portal/microsite work to resolve Perspective/site ownership, content roots, website keys, and NAV targets; use `imis_iqa action=surface`, `imis_iqa action=source_profile`, and `imis_iqa action=content_plan` for query/content planning; browse existing `@/`, `$/`, or `~/` artifacts; inspect working examples through the relevant MCP capture/profile tool.
   For visual content, load [design-surface-routing.md](design-surface-routing.md) before choosing between native iMIS iParts, designed ContentHtml, registered client iPart packages, retired query-client artifact migration, design-system exhibits, or theme work.
5. For existing content changes, keep backup enabled on the mutating primitive (`imis_document action=update`, `imis_page_iparts`, layout replacement, or the relevant writer) so the handoff carries a compact backupRef instead of the full XML payload in chat context.
6. Enforce one canonical owner before adding capability. Search the registered tools, specialist skills, capability guide, service owners, configuration-package transport, and gap registry first. If an owner or established pattern already exists, extend it; do not create a parallel tool, serializer, migration product, or browser workflow. A native/browser operation may be added as an internal primitive only when the existing owner cannot express the operation safely, and it must be routed through that owner with one explicit verification boundary.
7. Choose the purpose-built supported writer. Generic entity mutation is a fail-closed escape hatch: create/update/delete and execute are rejected before network I/O when the purpose-owner map names an owning tool/action, and raw execute is denied by default unless explicitly allowlisted. Use `imis_iqd_query`, `imis_document action=create`, `imis_document action=update`, `imis_content_layouts`, `imis_page_builder recipe=dashboard`, `imis_navigation_items`, `imis_page_iparts`, or the named domain writer rather than retrying through `imis_entity`. Browser/native iMIS actions are observational checks, not an autonomous agent contract unless the tool returns a user-intervention packet.
8. Verify and hand off with exact paths, IDs, source aliases, display aliases, iPart keys, backupRef, publish state, preview/browser/domain readback evidence, risks, and unresolved verification gaps.

Do not preserve demo-specific workflows as permanent code paths. If a shape is not yet synthesizable, find or create a representative iMIS example, inspect it, extend the relevant writer, and prove it with the strongest available signal.

For complete terminology, see [glossary.md](glossary.md).
For entity relationships and lifecycles, see [data-model.md](data-model.md).
For API conventions and tool selection, see [api-patterns.md](api-patterns.md).
For exact agent/tool/workflow routing rules, see [routing-contract.md](routing-contract.md).
For visual artifact routing and design-system boundaries, see [design-surface-routing.md](design-surface-routing.md).
For agent handoffs and verification packets, see [agent-delivery-contract.md](agent-delivery-contract.md).
For UK-specific features (Gift Aid, VAT, Direct Debit), see [uk-localisation.md](uk-localisation.md).
For implementation partner guidance, see [implementation-guide.md](implementation-guide.md).

## Official iMIS Product Documentation

The `imis-docs` connector provides searchable access to 1,200+ articles from the official iMIS help site (help.imis.com). These cover product features, configuration, and UI workflows — not API/developer reference. Use it when you need to:
- Explain how to configure something in the iMIS UI that the API cannot do (e.g., IQA query creation, page layouts, SSO setup, payment gateway configuration)
- Look up iMIS feature behaviour, settings options, or step-by-step UI workflows
- Provide accurate guidance on RiSE website design, billing cycle setup, process automation, form builder, or commerce configuration
- Answer "how does this work in iMIS?" questions with official product documentation rather than assumptions

This is product documentation for iMIS administrators and users, not API/developer reference.

The `imis-docs-dev` connector provides searchable access to the iMIS developer documentation (developer.imis.com) — 2,115 API reference pages, 72 developer guides, and 17 Swagger specs. Use it when you need to:
- Look up exact API endpoint behaviour, request/response formats, or field definitions
- Verify which operations an entity supports or check `$type` values for entity creation
- Find data contract details, filter syntax, or special endpoint parameters
- Reference Swagger/OpenAPI specs for a specific API module (accounting, events, party, etc.)

## Capability & Coverage Discovery

Before planning unfamiliar work, discover what the toolset can do rather than assuming:

- `imis_capability_guide` — per-area can-do / cannot-do / approval / native-handoff / verification contract. Consult it (optionally by area) before multi-step work in an area you haven't touched this session.
- `imis_module_inventory` — read-only inventory of iMIS service modules: what is endpoint-visible, readable, writable, workflow-capable, owner-closed, or out of scope, before planning module-specific work.
- `imis_endpoint_coverage` — endpoint/module coverage report distinguishing API-declared route visibility from operations this toolset supports; visible routes can still be owner-closed, so coverage reflects evidence, not a write guarantee.
- `imis_source_contracts` — resolve the owned contract for brittle reporting/readback sources: which purpose-built tool, scope field, fallback boundary, or readback filter to use instead of hand-authoring source-specific payload rules.
- `imis_agentz_work_session` — read/resume prior AgentZ work sessions for handoff: list or search recent sessions by goal/artifact/route and export a resume packet when continuing work without chat history.

## Quick Reference

- **Party** = Contact/Person. Use `$type` for PersonData (individual) vs InstitutionData (org).
- **Subscription** = Membership dues. Active = `PaidThrough > today`. Composite key: `PartyId~ItemId`.
- **Group** = Committee or Chapter. Members via GroupMember (key: `~GroupId|PartyId`).
- **EventRegistration** = Use `imis_register_for_event` or `imis_manage_event_registration`; their guarded workflow owns the underlying `_execute` calls. Key: `EventId~PartyId`.
- **Document** = Content/CMS item. `Path` field is REQUIRED for creation.
- **Perspective** = native RiSE site record. Content folders assign site ownership with `DefaultWebsiteKey` and `AdditionalWebsiteKeys`; NAV rows inherit that ownership through their target content path.
- **GenTable** = Lookup/dropdown values. Key: `~TableName|Code`.
- **IQA** = Intelligent Query Architect — the primary reporting tool.

## Agent Delivery Rule

Every iMIS task should leave a surface-agnostic verification trail: intent class, target surfaces, iMIS paths/keys, data/query contract, content/iPart contract when applicable, verification evidence, risks, and unresolved verification gaps. Use [agent-delivery-contract.md](agent-delivery-contract.md) as the standard packet format before handing work to another agent or reporting completion.

Deliver that trail through `imis_agent_report` so it becomes the durable record in the AgentZ activity feed, not just chat text: `kind=intention` (with a short `sessionName`) when you pick up the task, `kind=progress` at meaningful checkpoints, and `kind=outcome` at the end of any multi-tool investigation or whenever you create/modify an iMIS artifact — carrying the saved paths, document/version ids, preview counts, recommendation, and unresolved verification gaps. Keep bodies sanitized Markdown (no secrets or raw payload dumps).

## User Language Translation

When users say "member" they mean a Party with active Subscriptions. "Dues" = Subscription products. "Chapter" = Group with Chapter class. "Committee" = Group with Committee class. "Renewal" = updated PaidThrough dates. "Lapsed" = PaidThrough < today. "Panel" = custom data table. "Page" = Document in Document System. "Dropdown values" = GenTable entries.
