# iMIS API Patterns & Tool Selection

**Developer docs resource**: Use the `imis-docs-dev` connector (`search_dev_docs`, `list_api_modules`, `get_dev_article`) to look up exact API endpoint behaviour, request/response formats, `$type` values, and Swagger specs. Use when this reference file doesn't cover a specific detail.

## API Conventions

### Party $type (REQUIRED for creation)
- Person: `"$type": "Asi.Soa.Core.DataContracts.PersonData, Asi.Contracts"`
- Organization: `"$type": "Asi.Soa.Core.DataContracts.InstitutionData, Asi.Contracts"`

### Composite Keys
Format: `~key1|key2` or `key1~key2`
- GroupMember: `~GroupId|PartyId`
- GenTable: `~TableName|Code`
- EventRegistration: `EventId~PartyId`
- Subscription: `PartyId~ItemId`

### Pagination
- Max 500 records per page (default 100)
- Prefer IQA queries for large datasets
- Use `limit` and `offset` parameters

### Entities that CANNOT be listed (get by ID only)
EventRegistration, EventRegistrationSummary, EventFunction, Communication, ComboOrder, Order, UserSecurity, Message

### Entities requiring filters to list
- EventRegistration: requires `EventId`
- EventRegistrationSummary: requires `EventId`
- Communication: requires `PartyId`
- ItemPrice: requires `ItemId`

### Special Operations
- `_execute` — for EventRegistration creation, ComboOrder processing
- `_validate` — check data without saving

### Document System
The Document System has two separate hierarchies with different allowed document types:
- **`@/` (content tree)**: Only `CFL` (content folder) and `CON` (content record/page). This is the Page Builder / Site Builder hierarchy.
- **`$/` (definition objects)**: `FOL` (generic folder), `IQD` (query), `BOD` (business object), file uploads.
- **`~/` (sitemaps)**: Individual sitemap hierarchies.

**CRITICAL — Type-to-hierarchy**: The REST API does NOT validate document type against hierarchy. Creating the wrong type in the wrong tree (e.g. a FOL in @/) causes site corruption requiring database rollback. Use `imis_document action=create` which enforces type-to-hierarchy validation.

**CRITICAL — Data blobs**: CFL and CON documents require a base64-encoded XML Data blob (ContentFolder or Content XML). Without it, documents appear in the tree but crash the iMIS editor UI with 500 errors. `imis_document action=create` auto-generates these. FOL documents do not need a Data blob.

**CRITICAL — DELETE is hard delete**: API DELETE permanently removes the document record. There is NO Recycle Bin via the API. Raw `imis_entity action=delete` is blocked for Document entities; use `imis_document action=preview_delete` then the exact-confirmed `action=delete`, or use the native recycle handoff when that is the intended lifecycle.

**IQD creation requires the dedicated IQD writer**: Do not use generic Document create for IQDs. Use `imis_iqd_query` with a structured query form to validate, assemble, create, resolve `QueryDefinition`, and preview through `/api/Query`. Agents should not choose native templates, inspect IQD payload internals, or work around backend rejections with raw IQD writes.

- `Path` and `FolderPath` are both REQUIRED for Document POST. Both should be set to the parent folder path — the API constructs the final path as `Path/Name` internally.
- `NAV` is the exception that must be verified, not assumed. Native Site Builder/AgentZ creates a `NAV` document plus a `Hierarchy` row; direct REST navigation creation is not a production path. Agents must use the native placement handoff and claim installation only after the intended non-empty `DocumentSummary.Path` and Hierarchy row verify.
- `AlternateName` is the display title (shown in UI as "Title"). Set it or the document will show a blank title.
- Existing-document content writes should return compact pre-write backup metadata from the primitive itself. Do not create separate workflow-only tools for backup when the writer can own its safety contract.
- Document lifecycle: Working → Published → Archived → Recycled.
- Publish is not just a blind `Status="Published"` PUT. For content/navigation records, the MCP must verify `DocumentSummary.Status` after the write. If it remains Working, PublishRequested, or otherwise unverified, return the `userIntervention` packet and route the human to RiSE > Page Builder > Manage content or Page Builder > Task list. Browser/native flows are observational checks, not the agent publish primitive.

### Query Endpoints
- **Query** (`/api/Query`) — Modern, returns flat JSON. Default for `imis_query`.
- **IQA** (`/api/IQA`) — Legacy, returns nested GenericPropertyData. Use `useLegacyEndpoint: true`.
- Both require queries to have "Available via the REST API" enabled.

## Tool Selection Guide

Before choosing a tool, classify the request by intent (`answer`, `analyse`, `design`, `write`, `integrate`, `verify`), surface, grain, and desired output. Use [routing-contract.md](routing-contract.md) as the authority for deciding between workflow tools, raw entity/API tools, IQA/report tools, content tools, specialist agents, and skills.

The tool surface should stay primitive-first. Add narrowly scoped workflow prose to skills/prompts, but add top-level MCP tools only when a new reusable iMIS primitive is needed across contexts. Prefer shared services for recurring mechanics such as discovery, XML/Data parsing, backup, publish verification, intervention packets, and AgentZ navigation.

Selection ladder:

1. Known Party/contact/org or small named set: use workflow/domain tools first.
2. Simple native record list with known filters and manageable payload: use entity/search tools.
3. Broad cohort immediate answer: get compact candidate IDs with `imis_party_search_compact`, then enrich with workflow/domain tools such as `imis_prospect_opportunities` when applicable.
4. Reusable report/export/query or complex joins/aggregation: use IQA/query tooling.
5. IQD/content/iPart/navigation/configuration write: inspect live shape, use the proven writer, and verify.

`imis_iqa action=surface` resolves likely IQA sources; it does not prove executable access. A `DocumentSummary` match and especially a `/Query Sources/` path must still be proven with `imis_query` before it is treated as a usable report.

| Need | Tool |
|------|------|
| Check connection status | `imis_connection_status` |
| Switch iMIS instance | `imis_connection_status` |
| Find contact | `imis_find_member` |
| Compact Party/cohort candidates | `imis_party_search_compact` |
| Prospect/non-member spend opportunities | `imis_prospect_opportunities` |
| Complete Party/contact 360-degree view | `imis_member_360` |
| Get record by ID | `imis_entity action=get` |
| List records | `imis_entity action=list` |
| Search by fields | `imis_search` |
| Validate data before saving | `imis_entity action=validate` |
| Execute special operations (`_execute`) | Use the purpose-built owner tool. Raw `imis_entity action=execute` is default-deny and exists only for explicitly allowlisted operations. |
| View entity change history | `imis_entity action=changelog` |
| Run IQA report | `imis_query` |
| Resolve IQA source/query intent | `imis_iqa action=surface liveCheck=true` |
| Profile BO/panel fields and custom fields | `imis_iqa action=source_profile source="<name>" requestedFields='["field ideas"]'` |
| Plan IQA plus content/iPart delivery from live BO/panel metadata | `imis_iqa action=content_plan goal="<intent>" sources='["<name>"]' targetExperience="table|cards|dashboard|form"` |
| Inspect supported IQD query-form features | `imis_iqd_query action="capabilities"` |
| Available entity types | `imis_entity_discover action=types` |
| Field schema/metadata | `imis_entity_discover action=schema` |
| Create/Update/Delete | Use the purpose-built writer when the purpose-owner map names one. Raw `imis_entity` mutation is available only for explicitly unowned/allowlisted entity operations. |
| Event registration | `imis_register_for_event` |
| Committee management | `imis_group_membership` |
| Place order | `imis_create_billme_order` |
| Party/contact billing picture | `imis_billing_summary` |
| Record donation | `imis_process_gift` |
| Log activity/note | `imis_contact_activity` |
| View relationships | `imis_party_relationships` |
| Manage membership | `imis_manage_subscription` |
| Custom panel data | `imis_panel_records` |
| Discover site/content/navigation topology | `imis_site_profile scope=discovery` before site, microsite, member portal, sitemap/SEO, or navigation-aware content work |
| Render/audit a routable page | `imis_rendered_page_audit` for AgentZ-backed DOM/a11y/SEO/timing evidence before edit attribution |
| Browse site content | `imis_document action=browse` |
| Get page content | `imis_document action=get` |
| Create page/folder | `imis_document action=create` (auto-generates Data blobs for CFL/CON) |
| Build dashboard/subpage content set | `imis_page_builder recipe=dashboard` for generated shell HTML, query/menu/template/chart iParts, optional NAV/intervention state, and a single delivery packet |
| Update page / request verified publish | `imis_document action=update` |
| Delete document | Use iMIS web UI (API DELETE is hard delete — blocked for safety) |
| Create IQA query | `imis_iqd_query` for guarded IQD form validation, assembly, creation, and preview |
| Execute IQA query | `imis_query` |
| Inspect iParts (metadata) | `imis_document action=content_items` |
| Add/remove/inspect iParts (full) | `imis_page_iparts` (list_types, inspect, place kind=html, queryIpart menu/template/chart, progressTracker, relatedItems, summaryDisplay, contentCollection, bigButtonPanel, formsDisplay, nativeIpart, raw, remove). `inspect` returns `placeTemplate`; reuse it only for registered iParts that do not yet have a structured kind. |
| Manage themes | `imis_entity action=list entityType="Themes"` / full CRUD |
| Manage templates | `imis_entity action=list entityType="Template"` / full CRUD |
| Manage URL redirects | `imis_entity action=list entityType="RedirectRule"` / full CRUD |
| Manage content tags | `imis_entity action=list entityType="Tag"` |
| Manage panel definitions | `imis_entity action=list entityType="PanelDefinition"` / full CRUD |
| Manage dropdown values | `imis_lookup_configuration` |
| Send email | `imis_communication_message_submit` |
| Certification programs | `imis_certification_program_catalog` |
| Enrol in certification | `imis_certification_transcript_records` |
| Certification progress | `imis_certification_transcript_profile` |
| Log CPD/CPE credits | `imis_certification_transcript_records` |
| Auto-pay summary | `imis_autopay_summary` |
| Manage auto-pay | `imis_manage_autopay` |
| Scheduled payments | `imis_scheduled_payments` |
| Gift Aid declarations | `imis_gift_aid` |
| Gift Aid HMRC claims | `imis_gift_aid` |
| VAT rules | `imis_accounting_configuration_profile` |
| UK Direct Debit status | `imis_uk_direct_debit` |
| Payment gateways | `imis_gateway_accounts` |
| Payment methods | `imis_payment_methods` |
| Check login credentials | `imis_membership_login_setup` |
| Manage user security | `imis_security_access_profile` |
| Import batches | `imis_import_processing` |
| Import file types | `imis_import_operations_profile` |
| Find duplicates | `imis_duplicate_resolution` |
| Merge contacts | `imis_duplicate_resolution` |
| Engagement scores | `imis_engagement action=definitions` |
| Engagement summary | `imis_engagement action=summary` |
| Forms/surveys | `imis_forms_inventory` |
| Form responses | `imis_forms_inventory` |
| Communication history | `imis_communication_operations_profile` |
| Campaigns/appeals | `imis_campaign_management` |
| Notifications config | `imis_communication_delivery` |
| Task/automation logs | `imis_task_automation_profile` |
| Media assets | `imis_advertising_operations_profile` |
| Media/ad orders | `imis_advertising_orders` |
| Ad inventory | `imis_advertising_operations_profile` |
