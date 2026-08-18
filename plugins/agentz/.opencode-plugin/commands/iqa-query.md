---
description: "Plan, run, or create an IQA query from a live source profile and a structured query form"
---

# IQA Query Workflow

Use this command for iMIS IQA reporting, query design, guarded IQD creation, and downstream report/dashboard/content/alert workflows. Do not use it as the default path for answer-only Party/contact/member/prospect support questions; those route through the domain workflow first.

## Step 1: Ground the Workload in Live Shape

Start by naming the generic delivery frame:
- Intent class: `read`, `design`, `write`, `integrate`, or `verify`
- Target surfaces: IQA/IQD, Business Object/panel source, content record, iPart, navigation, report, alert, or downstream automation
- Required proof: metadata profile, existing query result, IQD preview, content XML inspection, browser/editor check, package/test output

Call the relevant discovery tools for the selected IQA/report/content path:
```
imis_iqa action=surface search="<goal>" liveCheck=true
imis_iqa action=source_profile source="<candidate BO or panel source>" requestedFields='["field ideas"]'
imis_iqa action=content_plan goal="<goal>" sources='["<candidate BO or panel source>"]' requestedFields='["field ideas"]' targetExperience="table"
```

Do not call every tool mechanically. `imis_iqa action=content_plan` is for IQA plus
content/iPart/template decisions. For query creation, submit a structured
`imis_iqd_query` design form; do not ask the agent to inspect or choose an iMIS
template.

Use live source metadata, the iMIS docs, and existing-query examples to decide the next proof path:
- Existing query execution
- New IQD creation from a supported MCP query form
- Source/relationship growth from a matching example query
- IQA Template tab HTML and Query Template Display content integration
- Report/dashboard/content integration
- Alert/process automation query source work
- Panel/custom business object reporting

Use `imis_iqa action=content_plan` when the goal crosses surfaces. It should return the source keys, likely parent/join signals, custom field matches, Display alias/template placeholder contract, filter prompt plan, and safest iPart route before any writer mutates IQA or content.

## Step 2: Check Official Docs

Use `imis-docs` and `imis-docs-dev` when the request involves unfamiliar IQA features, runtime parameters, Search Labels, template display, SSRS, alerts, panel sources, or REST availability.

## Step 3: Reuse Before Creating

Browse existing query folders:
```
imis_document action=browse path="$/Common/Queries/" maxDepth=2
```

For promising queries:
```
imis_query queryPath="$/path/to/query" limit=10
```

If a stable path-independent key is needed, fetch `DocumentSummary` and run with `queryDocumentVersionKey`.

## Step 4: Create Only When Appropriate

For IQD creation:
```
imis_iqd_query action="capabilities"
imis_iqd_query action="validate" design="{...}"
imis_iqd_query action="assemble" design="{...}"
imis_iqd_query action="create" folderPath="$/Common/Queries/Custom" design="{...}" limit=5
```

Treat the query as usable only after:
- `Document/_validate` passes
- `Document` create succeeds
- `QueryDefinition.FindByPath` succeeds
- `/api/Query` preview returns expected rows or a valid empty result

### Known Event Registration Flattening Route

For a single data export with one row per event registration, all registered programs, and all question responses, read `supportedFeatureRails.domainRecipes.eventRegistrationTextFolding` from `imis_iqd_query action="capabilities"`. Use its two independent ordered correlated `STRING_AGG` calculated columns. Do not join both child sets, split the result into three exports, fail on duplicate registration rows, or move it to SSRS only because a previous bare `SELECT` failed. The builder now normalizes a leading `SELECT` to one parenthesized scalar subquery. Keep a small first-run row limit and require `/api/Query` L4 preview. `EventQuestionResponse` has no `OrderNumber`, so keep programs order-specific, repeat the event-participant answers on each matching registration row, and include `ResponseScope=event-participant`. Never guess which order owns the answers.

## Step 5: Do Not Work Around Builder Limits

If `imis_iqd_query` cannot create the requested form, do not hunt for templates,
do not hand-build raw IQD documents, and do not switch to browser automation as a
substitute for the backend writer. Return the tool's backend validation message
and continue only with safe alternatives such as reusing an existing
query, running an answer-only analysis, or building the page around an already
verified IQD. Areas that may currently require backend writer expansion include:
- Native graph features that `imis_iqd_query action="capabilities"` does not list
- Calculated expressions that require a leading `WITH`/CTE instead of an inline scalar subquery
- Standalone multi-dataset SSRS authoring and rendered/export verification
- Process automation alert task configuration
- Unlisted PanelEditor, chart, navigation, and other type-specific iPart shapes

Use content/RiSE tools after the query is proven:
- `imis_document action=create`
- `imis_page_iparts action="place (kind=queryIpart, queryDisplay=menu)"` for existing IQDs or query folders
- `imis_page_iparts action="place (kind=queryIpart, queryDisplay=template)"` for Template tab output
- `imis_page_iparts` for other iParts
- `imis_document action=content_items`
- `imis_document action=update`

## Step 6: Report Back

Summarize:
- Business goal
- Intent class and target surfaces
- Existing query reused or new query created
- Source(s), columns, filters, prompts, sorts
- Display aliases and template placeholders when Query Template Display is involved
- REST/API execution method
- Validation and preview evidence
- Downstream page/report/dashboard/alert steps
- Known limits or manual UI work remaining

## Orchestrator Task Split

For long-horizon agentic work, the orchestrator should create bounded work packets with explicit handoff artifacts instead of asking one worker to "figure out iMIS":

1. **Discovery packet** — input: business goal. Output: candidate IQA folders/queries, source profiles, REST availability, custom BO/panel fields, and permission risks.
2. **IQA construction packet** — input: proven source profile and desired result shape. Output: existing query reuse or `imis_iqd_query` design, validation result, created path, and preview evidence.
3. **Content composition packet** — input: verified query paths/source keys and target workspace. Output: content page path, iPart list, layout zones, query bindings, HTML/CSS scope, and publish recommendation.
4. **Verification packet** — input: created artifacts. Output: API inspection, browser/editor check, test results, unresolved iMIS UI/manual steps, and rollback/cleanup notes.

Each packet must name the iMIS path(s), document id(s), and exact tool evidence it produced. If a shape is not proven, the packet returns the specific missing iMIS example to inspect; it must not encode the gap as a permanent product limitation.

### Agent-Facing Completion Packet

Use this agnostic packet regardless of whether the query is for members, finance, events, fundraising, commerce, scoring, custom panels, or a client-specific workflow:

```text
Goal:
Intent class:
Target surfaces:
Primary artifacts:
- query path / DocumentId / DocumentVersionId:
- content path / DocumentId:
- iPart contentItemKey / sourceKey:
Query contract:
- sources and aliases:
- display aliases:
- filters/prompts:
- sort/group/template rules:
Verification:
- metadata/profile:
- create/update result:
- QueryDefinition and preview:
- content XML/browser:
Risks:
Unresolved proof gaps:
Next action:
```

### Plugin Agent Routing

This plugin ships six specialist agents in `/agents`. Use them as role boundaries when Cowork/Claude Code orchestration is available:

- `implementation-consultant`: lead for cross-surface RiSE/content/IQA/BO/configuration builds and the final architecture decision.
- `imis-data-analyst`: discovery lead for query/source profiling, existing IQA reuse, preview evidence, and data-shape validation.
- `configuration-specialist`: security, system settings, gateways, imports, data quality, and permission-risk review.
- `membership-specialist`, `event-coordinator`, `fundraising-specialist`: domain reviewers when the business workload is membership, events, or fundraising specific.

Every handoff must include the business goal, iMIS paths, DocumentId/DocumentVersionId values, source aliases, selected display aliases, iPart keys, preview/error evidence, and unresolved shape work. Do not hand a specialist a vague "reverse-engineer iMIS" task; the MCP design should carry the learned iMIS behavior forward.
