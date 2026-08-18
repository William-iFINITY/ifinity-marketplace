---
name: iqa-query-design
description: >-
  Design, build, and analyse IQA queries and reports in iMIS. This skill should
  be used when the user says "design a query", "build a query", "create a
  report", "IQA", "query builder", "business intelligence", "reporting",
  "build me a report", "create an IQA query", "query design", "dashboard
  report", "export data", "analytics", "data extract", "member report",
  "financial report", "event report", or when working with iMIS reporting
  and data analysis.
when_to_use: >-
  Use for any query or report request, including unknown client fields,
  multi-surface dashboard/content work, runtime prompts, Query Template Display,
  charts, alerts, exports, custom Business Objects, and panel sources. Start
  from live source/profile evidence, submit structured IQD forms to the MCP
  builder, and use safe existing-query/read alternatives when backend validation
  rejects a write form. DESIGN and WRITE queries here; to execute an
  already-saved query use run-query, and for a query-backed page hand off to
  content-management or rise-website-design.
argument-hint: "[query-path-or-description] [action: design|run|analyse|browse]"
---

# IQA Query Design & Reporting

Design, execute, and analyse Intelligent Query Architect (IQA) queries in iMIS — the primary reporting and analytics engine.

**Documentation resource**: Use the `imis-docs` connector to search official iMIS help articles for IQA query design guidance, BO property details, filter syntax, templates, dashboards, reports, alerts, and downstream content configuration. Use the `imis-docs-dev` connector to look up Query/IQA endpoint details, filter operators, runtime parameter syntax, `QueryDocumentVersionKey`, Search Label filters, and `queryUrlParameters`.

**Adjacent reporting tools**: `imis_iqa_reporting` profiles how existing IQA queries are consumed by reporting/display surfaces; `imis_iqa_parameter_definitions` CRUDs standalone `QueryParameterDefinition` registry rows — it does NOT add a prompt to a query you are building (most report prompts are authored inline in the `imis_iqd_query` design as a filter value `@Prompt`); `imis_ssrs_reporting` owns the SSRS report surface — SSRS is a separate engine from IQA, so route "SSRS report" requests there, not to the query builder.

## Understanding IQA

IQA is the query-building tool that extracts data from the iMIS database. Key principles:

- **Design once, use everywhere**: A query defined in IQA can be displayed in iParts, dashboards, exports, and accessed via API
- **Business Object-based**: Queries draw from Business Objects (BOs) — not raw SQL tables
- **Non-technical friendly**: The IQA UI enables non-SQL users to build queries
- **Composable**: Copy and combine existing queries to build new ones
- **Real-time**: Query results are live, searchable, and sortable

Queries are stored as Documents in the Document System at `$/` paths.

---

## Current MCP IQA Build Posture

Agents should design from intent, live source metadata, and the agent-facing `imis_iqd_query action="capabilities"` contract. Submit a structured `imis_iqd_query` form; do not choose iMIS templates, inspect native IQD payload internals, or work around backend validation with raw IQD document writes.

| Workload | Current MCP path |
|----------|------------------|
| Run an existing REST-enabled query | `imis_query` |
| Run a path-stable query after path changes | `imis_query queryDocumentVersionKey="<DocumentVersionId>"` |
| Resolve broad iMIS reporting intent to likely query/source surfaces | `imis_iqa action=surface search="<intent>" liveCheck=true` |
| Profile a live BO/panel source and resolve custom fields | `imis_iqa action=source_profile source="<BusinessObjectOrPanelSource>" requestedFieldsArray=["field idea"]` |
| Produce an IQA/content/iPart design packet from live BO or panel metadata | `imis_iqa action=content_plan goal="<intent>" sourcesArray=["<BOOrPanelSource>"] requestedFieldsArray=["field idea"] targetExperience="table"` |
| Inspect supported public query-form features | `imis_iqd_query action="capabilities"` |
| Inspect exported native IQD XML | `imis_iqd_query action="inspect_export_xml" exportXml="<AsiDocumentExport...>"` reads the iMIS export, classifies/imports the embedded IQD Blob when supported, returns document/blob metadata, and performs no write |
| Assemble generated IQD export XML | `imis_iqd_query action="assemble_export_xml" includeExportXml=false` validates a design, assembles native iMIS export XML, self-inspects it, and only returns raw XML when `includeExportXml=true` |
| Import supported IQD export XML | `imis_iqd_query action="import_export_xml"` returns exact confirmation before writing; with matching `confirmationText`, it creates the IQD Document, resolves QueryDefinition, and previews display-row queries |
| Create an IQD from a supported form | Guarded `imis_iqd_query` workflow: validate -> assemble -> create; display-row IQDs preview through `/api/Query`, while native row-count Summary/Run IQDs use `resultShape="rowCount"` with `columns=[]` and verify through QueryDefinition plus native Summary/Run/export checks |
| Formatted list / card layout / styled directory / badge wall from query rows | Include `templateHtml` in the `imis_iqd_query` design (placeholders `{#query.DisplayColumnAlias}` against Display aliases), then place `imis_page_iparts action=place kind=queryIpart queryDisplay=template` — Query Template Display is the templated-presentation lane |
| Date trend / time-series report ("growth by month", "registrations over time", DateDimension) | `dateBucket` column + separate aggregate measure columns in the `imis_iqd_query` design; never CONVERT-style date grouping expressions (see Date Trends And Grouping) |
| Unsupported source/relation/display/filter/report form features | Do not attempt a manual IQD write; return the backend validation message and use only safe existing-query/read alternatives |
| Bind existing IQDs or a query folder to a page | `imis_page_iparts action=place kind=queryIpart queryDisplay=menu` for searchable/exportable results |
| Bind a proven template-backed query to a page | `imis_page_iparts action=place kind=queryIpart queryDisplay=template` after query execution is verified |
| Bind a proven grouped query to a native chart | `imis_page_iparts action=place kind=queryIpart queryDisplay=chart`; supported native-rendered chartType values are `donut`, `bar`, `barvertical`, `barhorizontal`, and `line`, with Display-alias label/value binding, optional `seriesColumnName`, `enableStackedSeries`, and `seriesDataDateAsCategory`. Use `barvertical` (or `bar`) for vertical column charts; `column` is normalized to `barvertical` because persisted `column` renders an empty series. |
| Bind a proven IQA to native ProgressTracker/RelatedItems/SummaryDisplay | `imis_page_iparts action="place"` with `kind="progressTracker"`, `kind="relatedItems"`, or `kind="summaryDisplay"`; these are structured native writers, not captured typed-XML fallbacks. ProgressTracker source queries need `Sum_Total` and `Goal_Amount` aliases, plus `End_Date` for days remaining. RelatedItems source queries need case-sensitive `key_Id`. |

Important: The MCP can assemble and create IQD documents from the declarative query form. Do not describe IQD creation as impossible in all cases, and do not hard-code an unproven shape as unsupported. REST metadata is not enough to prove that a name is a valid IQA source, and missing REST metadata is not enough to reject a native IQA field when `supportedFeatureRails.sources.nativeIqaFieldPacks` lists that field. Fields in that capability pack are first-class authoring fields for `imis_iqd_query`; field-limited sources still reject fields outside their supported pack. A display-row write is complete only after `QueryDefinition` resolution and a limited `/api/Query` preview; a native row-count Summary/Run write uses `resultShape="rowCount"` and is complete only after `QueryDefinition` plus native Summary/Run/export verification because REST display-row endpoints can reject zero-display-column IQDs.

Generated IQD responses include validation and runtime status. Treat `validate` and `assemble` as pre-write checks only. Treat `create` and `update` as complete only when the returned result says the Document was saved, QueryDefinition resolved, and the appropriate preview or row-count verification route passed. If the result reports `native_runtime_invalid`, the existing native IQD itself failed native runtime validation before generated comparison; treat it as non-comparable rather than as a generated-query failure.

Do not describe native IQD parity as complete until the tool capabilities and verification results cover import/classification, generated re-emission, preview equivalence for native-valid preview-eligible IQDs, native editor/import-export behavior, generated export/import behavior, rendered page behavior where applicable, prompt/runtime breadth, source breadth, packaged runtime behavior, and cross-tenant behavior. Unsupported native features need a machine-readable owner or rejection reason.

Grouped calculated expression columns are supported in the declarative contract by setting `expression` plus `subtotal=true`; native iMIS stores these as expression grouping columns, and the MCP verifies execution at create/update preview. The expression text is a native IQA SQL fragment, so a saved payload is not enough by itself. If an expression alias is omitted, iMIS supplies an `ExprN` auto label; set a stable alias when templates, charts, or downstream consumers need a predictable field name. For native date trend charts, prefer `dateBucket` columns instead of grouping calculated date expressions.

### Date Trends And Grouping (dateBucket)

Any date-trend request — "membership growth by month", "registrations over time", "joins per year", "monthly giving trend", or a user who says the query needs `DateDimension` — is the `dateBucket` column shape. Do NOT reach for a calculated date expression: `CONVERT`/`DATEPART`-style date grouping expressions can save and resolve but fail `/api/Query` preview.

`dateBucket` compiles a date-only/date-normalized source field to a native `DateDimension` join and groups/sorts a physical bucket field. Put aggregates on SEPARATE measure columns — the bucket column carries only the grouping:

```
imis_iqd_query action="validate" designObject='{"name":"MembershipGrowthByMonth","source":{"businessObject":"Contact"},"columns":[{"alias":"Month","dateBucket":{"column":"JOIN_DATE","granularity":"month"}},{"name":"ID","alias":"Members","aggregate":"count"}]}'
```

Granularity values (default `month`) map to physical `DateDimension` bucket fields: `day` → `TheDate`, `month` → `FiscalYearMonth`, `year` → `FiscalYear`, `fiscalMonth` → `FiscalMonth`. `dateBucket.source` names the owning query source in multi-source designs. For a native chart over the result, bind the bucket alias as the label column with `seriesDataDateAsCategory=false` (see Chart iParts below).

### One Row Per Event Registration With Programs And Responses

This result shape is supported. Do not report it as an IQA limitation and do not split it into Summary, Programs, and Question Responses exports only because a bare calculated `SELECT` failed.

Use `supportedFeatureRails.domainRecipes.eventRegistrationTextFolding` from `imis_iqd_query action="capabilities"`. The recipe keeps `CsRegistration` as the outer row source and creates separate `Programs` and `Responses` calculated columns:

- `Programs` uses an ordered correlated `STRING_AGG` scalar subquery over `CsRegFunctions` and `CsFunction`. It correlates by `EventCode`, `ShipToId`, and `OrderNumber`.
- `Responses` uses an ordered correlated `STRING_AGG` scalar subquery over `EventQuestionResponse`. It correlates by `EventCode` and `RegistrantId`.
- `ResponseScope` is the literal `event-participant`. It makes the answer grain explicit in the export.
- Keeping both child sets inside independent scalar subqueries avoids the Programs-by-Responses row multiplication that a normal join can cause.

The query builder accepts an expression that starts with `SELECT`. It removes a trailing statement terminator and inserts the expression as one parenthesized scalar subquery. The earlier `Incorrect syntax near the keyword 'SELECT'` result proved that a bare query was inserted into a generated SELECT list; it did not prove that calculated scalar subqueries or `STRING_AGG` are unsupported. A leading `WITH` is still rejected because a CTE cannot be inserted there.

Start with `options.limitResults=true` and a small `limitResultsCount`. Require Document save, QueryDefinition resolve, and `/api/Query` L4 preview. Inspect a row that has multiple programs and multiple responses before production use.

`EventQuestionResponse` has no `OrderNumber`. `FormResponse` also stores the form and participant, not the registration order. Treat the answers as event-participant data:

- Do not fail the export when the same contact has duplicate registration rows for one event.
- Keep `Programs` order-specific.
- Repeat the same participant-scoped `Responses` on each matching registration row.
- Include `ResponseScope=event-participant`. Do not claim that one order owns the answers.

If the business needs a different answer set for each duplicate order, the standard historical sources cannot prove that mapping. Add a custom captured registration/order key to the form submission or a custom Business Object for future responses. Do not infer a historical link from time, row order, or the current active order.

`imis_ssrs_reporting action=author_report` supports both report shapes. The IQA-backed path uses one query and one dataset. The standalone path accepts the complete `layout.dataSets` list, preserves top-level `fields[].expression` or `table.columns[].expression`, writes the RDL without an RSP, and places ReportDisplay. Use the IQA folding recipe for this export because it produces one reusable flat data export. Use standalone multi-dataset RDL when the report genuinely needs independent datasets. Require rendered/export proof for the standalone lane.

Native display placement is handled by `imis_page_iparts`, not custom SVG/client chart workarounds. Supported query-backed placements are QueryMenu/Grid, QueryTemplateDisplay, QueryChartViewer, ProgressTracker, RelatedItems, and SummaryDisplay. For row-count Summary/Run IQDs, use `resultShape="rowCount"` with `columns=[]`; `/api/Query` display-row failure is not the verification route for that shape.

Native IQD import/classification, query-source references, native root options, dynamic-group metadata, aggregate filters, value-source filters, multi-value filters, same-column filter-set alternatives, and `filterSets[].priority` are exposed through `imis_iqd_query action="capabilities"`. Use that tool output as the capability contract instead of relying on examples from this skill. For user-supplied native iMIS export XML, use `imis_iqd_query action="inspect_export_xml"` and treat the returned status, imported design, or blocker reason as the contract; do not ask the agent to inspect embedded IQD payload internals. For generated export XML, use `assemble_export_xml`; to write supported export XML back as an IQD Document, use `import_export_xml` with exact confirmation and verify the returned QueryDefinition/preview result.

For "remove duplicate rows" / distinct-results intent, set `options.distinctRows=true` on the design rather than reworking columns or grouping.

Sort intent — "newest first", "alphabetical", "top N by amount" — maps to `sorts[{column, direction, priority}]` with `direction` one of `ascending` (default), `descending`, or `random`, and `priority` ordering multi-column sorts; pair "top N" with `options.limitResults=true` plus `limitResultsCount`. For "users must pick a filter before results show" intent, set `options.filterRequired=true` (the native Require filters root option).

Date and numeric filters use literal IQA values, not SQL expressions. Prefer full ISO DateTime literals such as `2026-07-18T00:00:00`; the MCP normalizes date-only range bounds to start/end-of-day, but agents should emit explicit DateTime values when they can. Do not use `GETDATE()`, `DATEADD()`, or SQL snippets in `value`. For same-column literal ranges, pass `compare="between"` with a two-value array; the builder emits native compare code 9. For runtime-prompted ranges, use `compare="promptedBetween"` or `compare="betweenPrompt"` with `userProvided=true` or an omitted `userProvided` value. For native multi-value equality, pass `compare="in"` with a value array. For same-column alternatives that are not a simple in-list, give the filters the same explicit `filterSet` key; set `filterSets[].priority` only when preserving native `QueryFilterSet.mPriority` matters. For "exclude …" / negation intent over a whole alternative set, set `filterSets[].isNot=true` on that set. For prompts, add `userRequired=true` when the prompt must be answered before the query runs. For native blank literal comparisons, pass `value=""` and `allowBlankValue=true`; blank filter values without that flag are rejected as likely missing input. For native context tokens, use `runtimeValue={"kind":"url","name":"SelectedID"}` for `@url:<name>` or `runtimeValue={"kind":"system","name":"Date"}` / `{"kind":"system","name":"SelectedID","quoted":true}` for `@Date`, `@Now`, `@SelectedID`, and similar system tokens. Use the returned `runtimeParameterContract.parameterKey` values for `previewParameters`; `promptLabel` is native display text and is not guaranteed to be the API key. For HAVING-style filters on grouped measures, set `aggregate` on the filter, e.g. `{"column":"ID","aggregate":"count","compare":"greaterThan","value":1}`. For native field-to-field filters, use `valueSource`, e.g. `{"column":"Attendees","compare":"greaterThanOrEqual","valueSource":{"column":"MaxRegistrants"}}`; for source-backed prompt/runtime metadata, use `valueSource:{}` or set its source fields. If backend validation rejects the form, do not attempt a manual IQD write.

Preview rows are business verification, not just saved-query verification. Do not infer membership/renewal semantics from a field name like `IsMember`, `Status`, or `MemberStatus` until preview rows match the requested business rule. For renewal windows, verify the returned `PaidThrough` values are inside the requested dates before claiming active, expiring, or lapsed cohorts.

**Templated display intent → Query Template Display.** When the user asks for a formatted list, card layout, styled directory, badge wall, branded roster, or any presentation of query rows beyond a plain grid, that is Query Template Display: author `templateHtml` on the IQD design with `{#query.DisplayAlias}` placeholders, then place it with `imis_page_iparts action=place kind=queryIpart queryDisplay=template`. Do not build a custom client iPart or hand-rendered HTML page for this intent when the QTD lane can express it (the custom `ifx-query-client.js` runtime is the escalation for client-side sort/filter/export — see One Template, Two Consumers below).

For Query Template Display, placeholders are resolved against **Display tab aliases**, not raw Business Object property names. If the template uses `{#query.Lender}`, the IQD must expose a display column with alias `Lender`; otherwise iMIS renders `Invalid property`. Prefer space-free aliases so tokens are unambiguous, and remember the IQA "Run" tab never renders the template — only a placed QTD iPart does.

**QTD rendering-access and timing (G-038, live-proven).** The RENDERING site user must be able to read the source IQD's folder — a member/public page bound to a staff-only-visible query renders "No data source has been configured" (the SourceKey format is fine; the access is not). Separately, a freshly created query is not immediately resolvable by the page rendering tier: a page bound to a just-created query can render "Could not find requested source query" or "No template definition found for the specified query" even while QueryDefinition and `/api/Query` are fully healthy. Republishing the page through the native Content Designer refreshes the rendering tier immediately — `imis_page_builder action=designer_republish` drives it via the companion (row-level Publish does not do it); left alone, the error clears when the rendering cache refreshes (typically within ~20 minutes). Re-writing the page or query does not help. Every `imis_page_iparts place kind=queryIpart` response carries this as `queryAccessAdvisory`.

**Editing a QTD-bound query: prefer `action=replace` over `action=update`.** Replace is verifiable end-to-end, while `update` carries an unreproduced report of relocating/breaking a bound query. `imis_iqd_query action=replace` is the proven-safe swap behind one plan-hash-bound confirmation: it creates the replacement through the fully verified create path, rebinds the EXPLICITLY listed `consumingPagePaths` (zero-remnant readback; unlisted consumers keep the old binding), and only then optionally deletes the original (`deleteOriginal=true`, refused unless every listed rebind verified). The rebind reaches the served route immediately, but because the replacement query is freshly created the page can show "No template definition found for the specified query" until the rendering tier resolves it — republish the page with `imis_page_builder action=designer_republish` to make the cutover render immediately, then verify rendered.

**One template, two consumers (G-037, live-proven).** The same `templateHtml` string a QTD iPart renders server-side can render client-side in a registered custom iPart via the packaged `ifx-query-client.js` helper: `ifxQueryClient.fetchQueryRows({queryPath|queryDocumentVersionKey, parameters, fetchAll, maxRows})` for filtered/complete row sets, then `ifxQueryClient.renderQueryTemplate(templateHtml, rows)` — proven text-equal to the QTD's own rendering for the same rows. Use the QTD for simple paginated display and the custom runtime when the page needs client-side sort/filter/export or complete print sets.

---

## Error → Remedy Index

Route these EXACT observed errors to their proven remedies before diagnosing anything else:

| Error observed | What it actually means | Remedy |
|---|---|---|
| REST `DELETE Document/{id}` returns 500 on an IQD, and native recycle refuses with "cannot delete System objects" | A native IQA editor Save flagged the IQD `IsSystem=true` (a native-editor side effect, not corruption; builder-only IQDs delete normally) | `PUT` the Document clearing `IsSystem:false`, then run the guarded `imis_iqd_query action=delete` exact-confirmation flow |
| "No data source has been configured" on a rendered query-backed page | The RENDERING site user cannot read the source IQD's folder (member/public page bound to a staff-only-visible query); the SourceKey format is fine | Move the query to, or grant read on, a folder the rendering audience can read, then re-verify rendered |
| "Could not find requested source query" or "No template definition found for the specified query" right after a query was created/replaced | Rendering-tier resolution lag while QueryDefinition and `/api/Query` are fully healthy | Republish the page through `imis_page_builder action=designer_republish` (row-level Publish does not refresh it); left alone it clears when the rendering cache refreshes (typically ~20 minutes) |
| "Invalid property" rendered inside a Query Template Display | A `{#query.X}` token does not match a Display-tab alias | Add or rename the display column alias to match the token; prefer space-free aliases |
| "Incorrect syntax near the keyword 'SELECT'" from a calculated expression | A bare `SELECT` was inserted into the generated SELECT list — scalar subqueries ARE supported | Keep the expression one inline scalar subquery (the builder parenthesizes a leading `SELECT`); a leading `WITH`/CTE remains unsupported |
| A date-grouping expression query saves and resolves but `/api/Query` preview fails | `CONVERT`/`DATEPART`-style date grouping is the unsupported shape | Rebuild the grouping as a `dateBucket` column (see Date Trends And Grouping) |

---

## Agentic Orchestration Contract

For broad IQA/content requests, split the work into explicit packets:

1. **Discovery**: resolve intent with `imis_iqa action=surface`, browse existing query folders, profile live BO/panel sources with `imis_iqa action=source_profile`, produce a cross-surface packet with `imis_iqa action=content_plan` when content/iParts are involved, and identify REST/API permission status.
2. **IQA verification**: reuse an existing query or create a new IQD only after form validation, assembly, creation, QueryDefinition resolution, and preview evidence.
3. **Content composition**: choose a peripheral content workspace, create or reuse the page, add proven iParts (`action=place kind=html`, `action=place kind=queryIpart queryDisplay=menu`, `action=place kind=queryIpart queryDisplay=template`), and record layout zones plus source keys.
4. **Verification**: inspect the final Document Data XML, use browser/editor checks when useful, run tests/package when code changed, and list exact remaining iMIS manual or unproven-shape work.

The orchestrator should pass concrete artifacts between packets: iMIS paths, DocumentId/DocumentVersionId values, selected BO property names, iPart keys, preview/error evidence, and cleanup notes. Downstream agents should not be asked to rediscover basic iMIS behavior already captured in the MCP tools and skills.

When running in Cowork and `show_widget` is available, present IQA/source/content result boards inline in chat. Use it for source comparison matrices, query design choices, preview evidence, dashboard/iPart delivery plans, and follow-up action prompts, with buttons for predictable next steps such as `Preview query`, `Inspect source`, `Create IQD`, `Bind to page`, `Run rendered audit`, or `Export`. Do not use `create_artifact` as the primary Cowork surface for those boards; files are secondary exports.

When plugin agents are available, route by the roles defined in `/agents`:
- `implementation-consultant` owns the end-to-end RiSE/IQA/content architecture and final integration plan.
- `imis-data-analyst` owns source profiling, existing-query discovery, query preview verification, and result-shape validation.
- `configuration-specialist` reviews permissions, security, data-quality, import, gateway, and system-setting risks.
- `membership-specialist`, `event-coordinator`, and `fundraising-specialist` review domain-specific semantics before a query/page is treated as business-correct.

Each handoff should be a bounded packet with exact tool evidence. Never ask an agent to "RE iMIS" broadly when the learned rule can be encoded in MCP behavior, a skill, or a command.

### Surface-Agnostic Query Delivery Checklist

Use this checklist for every query workload, regardless of business domain:

1. **Intent**: classify as analysis, query design, query write, content integration, report/dashboard/alert integration, or verification.
2. **Surface**: name every target surface: IQA source, IQD document, Query endpoint, content record, iPart, navigation, process automation, or external export.
3. **Contract**: list sources, aliases, display aliases, filters/prompts, sort/group rules, template placeholders, and expected runtime parameters.
4. **Verification**: capture live metadata, existing-query examples, IQD validation, QueryDefinition resolution, preview rows, content XML, and browser/editor evidence as applicable.
5. **Handoff**: leave exact paths, keys, iPart bindings, evidence, risks, and the next verification gap. Do not leave the next agent to infer context from prose.

---

## Business Object Concepts

Business Objects (BOs) are the data sources for IQA queries. Understanding BOs is essential for query design.

### Standard Business Objects
These are built into iMIS:
- **CsContact**: Contact/Party data (names, addresses, emails, demographics)
- **CsEvent**: Event definitions (name, dates, location, capacity)
- **CsRegistration**: Event registrations (attendee records)
- **CsOrders**: Commerce orders and transactions
- **CsSubscriptions**: Membership subscriptions and billing (subscription fields are not previewable via IQA — use a REST-executable membership query or domain tools)
- **Activity / CsActivity**: legacy contact-activity source, field-limited to `DESCRIPTION` and `AMOUNT`. "Activity type" is ambiguous — it maps to either LegacyActivityType or InteractionType, both owned by `imis_contact_activity`
- **Committee** / **Chapter**: group sources for committees and chapters
- **Gift** / **GiftsReceivedSummary** / **GiftTransaction**: fundraising gifts and donations
- **InvoiceSummary**: invoice records
- **PaymentSummary**: payment records

Always confirm a source name and its available fields with `imis_iqa action=surface` / `action=source_profile` before authoring — catalog names vary per tenant.

### Custom Business Objects
Created in the Business Object Designer (RiSE > Business Object Designer):
- Naming convention: `My_` prefix (e.g., `My_CustomBOname`)
- Must be published before use in IQA
- Properties must have "Available in IQA" enabled

### Discovering Available BOs
```
imis_entity action=list BOEntityDefinition limit=100
```
This lists all Business Object definitions including custom ones.

For field details of any entity:
```
imis_entity_discover action=schema entityType={entityName}
```

---

## Query Design Workflow

### Step 1: Understand the Question
Translate the user's business question into iMIS data terms:
- "How many active members do we have?" → Subscription where PaidThrough > today, count
- "Who registered for the conference?" → CsRegistration joined to CsEvent where EventCode={id}
- "What's our giving total this year?" → CsGift where GiftDate in current year, sum Amount

### Step 2: Discover Available Data Sources
```
imis_iqa action=surface search="<business intent>" liveCheck=true
imis_entity action=list BOEntityDefinition
imis_entity_discover action=schema entityType={relevantEntity}
imis_iqa action=source_profile source="{relevantEntity}" requestedFieldsArray=["fields the report needs"]
imis_iqa action=content_plan goal="<business intent>" sourcesArray=["{relevantEntity}"] requestedFieldsArray=["fields the report needs"] targetExperience="table"
```

For client-specific custom fields, prefer `imis_iqa action=source_profile` and `imis_iqa action=content_plan` over guessing. Panel sources are IQA business objects when exposed by Panel Designer, and their available properties come from live metadata rather than this skill's examples. If the output will be a RiSE page, the content plan should carry Display aliases, template placeholders, iPart choice, and verification gaps before any IQD or content write starts.

### Step 3: Browse Existing Queries
Check if a suitable query already exists:
```
imis_document action=browse path="$/Common/Queries/"
```

Common query locations:
- `$/Common/Queries/ContactManagement/` — Contact and member queries
- `$/Common/Queries/Commerce/` — Financial and order queries
- `$/Common/Queries/Events/` — Event and registration queries
- `$/Common/Queries/Membership/` — Membership-specific queries
- `$/Common/Queries/Finance/` — GL and accounting queries

### Step 4: Test an Existing Query
```
imis_query queryPath="$/Common/Queries/ContactManagement/AllContacts" limit=10
```
Preview with limit=10 to see the data structure before pulling full results.

### Step 5: Design a New Query
If no existing query meets the need, use guarded MCP creation from the structured query form:

**Guarded MCP creation is appropriate when:**
- Required sources, columns, filters, and sorts are accepted by `imis_iqd_query validate`.
- Required properties validate against live metadata or an existing IQA source example.
- The user accepts that display-row queries are not done until iMIS resolves and previews them; native row-count Summary/Run queries are not done until the saved graph resolves as `resultShape="rowCount"` and has native Summary/Run/export verification.

```
imis_iqd_query action="capabilities"
imis_iqd_query action="validate" design='{"name":"MyQuery","source":{"businessObject":"Contact"},"columns":[{"name":"ID"},{"name":"FullName"}],"filters":[],"templateHtml":"<strong>{#query.FullName}</strong>"}'
imis_iqd_query action="create" folderPath="$/Common/Queries/Custom" design='...'
```

For native Summary/Run row counts, make the result shape explicit instead of sending an accidental empty Display tab:

```
imis_iqd_query action="validate" design='{"name":"ExpiredOrInactiveRegistrations","resultShape":"rowCount","source":{"businessObject":"CertificationProgramRegistration"},"columns":[],"filterSets":[{"key":2,"isOr":true}],"filters":[{"filterSet":1,"column":"ExpirationDate","compare":"lessThanOrEqual","value":"@date"},{"filterSet":2,"column":"RegistrationStatusCode","compare":"equal","value":"IN"}]}'
```

If the backend rejects the form, stop the write path. Do not ask the agent to
inspect native payload internals or use the browser as a substitute query writer.

### Step 6: Analyse Results
After running a query:
- Total record count
- Column headers and data types
- Summary statistics (counts, totals, averages)
- Key patterns and anomalies
- Suggestions for follow-up analysis

---

## SQL Reference for IQA

IQA uses a SQL-like syntax for advanced query configuration:

### Source Specification
When multiple BOs share a property name, qualify with the source:
```
[source].[property name]
```
Example: `vBoCsEvent.EventCode` vs `vBoCsRegistration.EventCode`

The Summary tab in the IQA designer shows exact source names for reference.

### Alias
Use the Alias column to override query column headers:
```
Property: PersonName.LastName → Alias: "Surname"
```

### Filter Expressions
In the native iMIS UI, advanced filters can use WHERE-style conditions (omit the WHERE keyword):
```
PaidThrough > GETDATE()
Status = 'A'
Amount > 1000
GiftDate BETWEEN '2025-01-01' AND '2025-12-31'
```

For `imis_iqd_query`, pass each condition as a structured filter with a literal `value`; do not put these SQL expressions into the JSON `value` field.

---

## Common Query Patterns

### Active Members
Source: CsSubscriptions (subscription fields are not previewable via IQA — use a REST-executable membership query or domain tools)
Filter: PaidThrough > today, Status = Active
Properties: PartyId, ItemId, PaidThrough, BeginDate

### Lapsing Members (Expiring in N Days)
Source: CsSubscriptions (subscription fields are not previewable via IQA — confirm previewability, or use a REST-executable membership query or domain tools)
Filter: PaidThrough BETWEEN today AND today+30
Properties: PartyId, ItemId, PaidThrough
Join: CsContact for name/email

### Event Registrations
Source: CsRegistration joined to CsEvent
Filter: EventCode = '{eventId}'
Properties: PartyId, EventCode, RegistrationDate, Status, FunctionIds

For one export row per registration with all program titles and all question responses, use the `eventRegistrationTextFolding` capability recipe instead of joining both child sets or creating three exports. Keep the response grain explicit with `ResponseScope=event-participant`.

### Donor Giving Summary
Source: Gift (or GiftsReceivedSummary / GiftTransaction)
Filter: GiftDate in current year
Properties: PartyId, Amount, GiftDate, CampaignCode, SourceCode
Aggregate: SUM(Amount), COUNT(*) grouped by PartyId

### Chapter Membership Counts
Source: Chapter (or Committee) joined to the group-member source
Filter: GroupClass = 'CHAPT'
Properties: GroupId, GroupName, COUNT(PartyId)
Group by: GroupId, GroupName

### Financial Summary
Source: InvoiceSummary joined to PaymentSummary
Properties: InvoiceNumber, InvoiceDate, Amount, Balance, PaymentAmount
Filter: Date range

Confirm every source name and its join keys with `imis_iqa action=surface` before authoring — catalog names and keys vary per tenant.

---

## Dashboard Integration

IQA queries power dashboard widgets throughout iMIS:

### Query Menu iPart
The most versatile display iPart for query results:
- **Display options**: Title, parameters, columns, labels
- **Export formats**: DOC, XLS, PDF, CSV, XML
- **Email merge**: Send templates to query results
- **Address mapping**: Auto-map results if address fields available
- **Filtering**: Horizontal display of up to 3 filters per row
- **Paging**: Simple, Advanced, NextPrev, Slider, NextPrevAndNumeric
- **Results per page**: Configurable (0 = show all)

### Chart iParts
Use the structured QueryChartViewer writer first:

```
imis_page_iparts action="place" kind="queryIpart" queryDisplay="chart" documentId="<uuid>" queryPath="$/path/to/query" chartType="barvertical" labelColumnName="Region" dataColumnName="Members"
```

Supported native-rendered chartType values are `donut`, `bar`, `barvertical`, `barhorizontal`, and `line`. Use `barvertical` (or `bar`) for vertical column charts and `barhorizontal` for horizontal bars; incoming `column` is normalized to `barvertical` because persisted `column` renders an empty series. The chart maps `labelColumnName` and `dataColumnName` to IQA Display aliases; `seriesColumnName` adds native series grouping; `enableStackedSeries` stacks compatible series; and `seriesDataDateAsCategory` controls Date/DateTime label category behavior. Use `dateBucket` for generated date trend categories, then bind the non-date bucket label with `seriesDataDateAsCategory=false`.

Treat other chart type strings, including area, pie, and funnel, as unsupported unless `imis_iqd_query action="capabilities"` and `imis_page_iparts` identify them as supported and a rendered audit confirms the output. Do not build a custom SVG/client chart workaround when the native QueryChartViewer query shape is supported.

---

## Making Queries REST-Available

For a query to be accessible via `imis_query`:

1. Open the query in the IQA designer
2. On the Summary tab, check "Available via the REST API"
3. Save and publish

**API endpoints**:
- **Modern Query endpoint** (`/api/Query`): Returns flat JSON — preferred
- **Legacy IQA endpoint** (`/api/IQA`): Returns nested GenericPropertyData — use `useLegacyEndpoint: true`
- **Stable identifier**: Use `QueryDocumentVersionKey` when you have the query's `DocumentVersionId` from `DocumentSummary`; this survives path changes.

**Pagination**: Max 500 records per API page. Use `offset` parameter for subsequent pages.

**Runtime Parameters**: IQA queries can have runtime prompts. Pass Query endpoint prompt values by name through `parametersObject`. For legacy IQA, ordered prompt values can be passed as repeated `Parameter` entries. For filters that depend on URL parameters, pass `queryUrlParametersObject`.

---

## Best Practices

1. **Reuse before creating**: Always check existing queries first
2. **Start simple**: Build basic query, verify data, then add complexity
3. **Use aliases**: Make column headers user-friendly
4. **Index awareness**: Queries on indexed fields perform better
5. **Limit results**: Always use limits when testing (limit=10)
6. **REST-enable selectively**: Only enable REST access for queries that need API access
7. **Document queries**: Use meaningful names and paths
8. **For large datasets**: Use IQA instead of entity list — better for joins and aggregation
