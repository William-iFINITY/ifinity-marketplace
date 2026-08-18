# iMIS Agent Routing Contract

Use this contract before choosing between a workflow tool, raw entity/API tool,
IQA/IQD tooling, content tooling, a specialist agent, or a skill. The goal is to
answer the user's business question with the lowest-risk proven surface, while
reserving query/content builders for cases where the output is actually a
query, report, page, dashboard, automation, or reusable artifact.

## Classification Frame

Classify each request on four axes:

| Axis | Values |
| --- | --- |
| Intent | `answer`, `analyse`, `design`, `write`, `integrate`, `verify` |
| Surface | Party/contact/org, membership/subscription/billing, event/registration, fundraising/gift, finance/order/invoice/payment, IQA/report, RiSE/content/iPart/navigation, native Forms/Form Builder, configuration/import/automation |
| Grain | known record, small named set, broad cohort, reusable artifact, cross-surface implementation |
| Output | immediate answer, evidence table, export/report/IQA, created/updated iMIS artifact, verification packet |

The routing decision comes from all four axes, not from keywords alone. A request
that mentions "data" can still be a Party workflow. A request that mentions
"members" can still be an IQA/report request if the desired output is a reusable
report or export.

## Decision Ladder

1. **Known Party/contact/org or small named set**
   - Prefer workflow/domain tools first: `imis_find_member`,
     `imis_member_360`, `imis_billing_summary`, `imis_party_relationships`,
     event/fundraising/engagement tools as appropriate.
   - These tools are Party-scoped even when their historical names say
     "member". In iMIS, members, prospects, donors, customers, and
     organisations are all Party records.

2. **Domain operation or support workflow**
   - Route by domain surface before routing by data mechanism:
     membership/prospect/billing to `membership-specialist`, events to
     `event-coordinator`, fundraising/donor work to `fundraising-specialist`,
     configuration/import/security to the configuration or implementation
     specialist.
   - Use raw entity tools freely for reads of simple native records with known
     filters and manageable payloads. Raw create/update/delete/execute is a
     fail-closed escape hatch: the MCP purpose-owner map must explicitly leave
     the entity operation unowned (or allowlist it) before the call can reach
     iMIS. When the guard names an owner tool/action, route there instead.

3. **Broad cohort analysis**
   - First ask whether the goal is an immediate business answer or a reusable
     report/export.
   - For an immediate answer, get a compact candidate ID set, then enrich with
     workflow/domain tools. Use `imis_party_search_compact` for the candidate
     Party list and domain workflows such as `imis_prospect_opportunities` when
     one matches the business question.
   - For a reusable report/export, use IQA/query tooling.

4. **IQA/report/query artifact**
   - Use `imis_iqa action=surface` to resolve likely Business Objects or packaged query
     names, then prove execution with `imis_query` or prove creation with the
     guarded `imis_iqd_query` flow.
   - `imis_iqa action=surface` is a resolver. A `DocumentSummary` candidate proves a
     document with that name exists, not that the current user can execute it or
     that it is an end-user report.
   - Treat paths under `/Query Sources/` as source/query-builder material until
     `imis_query` proves otherwise.
   - For a reusable event-registration export with one row per registration,
     all program titles, and all question responses, route to IQD authoring and
     use the `eventRegistrationTextFolding` capability recipe. Do not route this
     proven data shape to three exports or multi-dataset SSRS because of an old
     bare-`SELECT` syntax failure.
   - Question responses are event-participant data because the standard source
     has no order key. Do not fail on duplicate registration rows. Keep programs
     order-specific, repeat the answers on each matching row, add
     `ResponseScope=event-participant`, and do not guess an owning order.

5. **IQA/IQD creation, content, page, iPart, dashboard, navigation, or automation**
   - Route to `implementation-consultant` unless a narrower slash command or
     skill owns the workflow.
   - Use `imis_iqa action=content_plan` only when IQA fields/aliases need to drive
     content/iPart/template decisions.
   - Use `imis_iqd_query` with a structured query form for query write/design
     work. `action="capabilities"` is a public form-feature summary; serialized
     IQD internals are MCP engineering concerns, not task-agent workflow.

6. **Native Forms (Form Builder) work**
   - Surveys, applications, contact/self-service/update forms, signup forms,
     form approvals, form submissions, form health/groups, and submission
     post-processing all route to the `forms` skill and its tool family
     (`imis_forms_inventory`, `imis_form_plan`, `imis_form_builder_write`,
     `imis_form_runtime_submit`, `imis_form_administration`, ...).
   - The forms skill is a router: load only the reference lane the task needs —
     authoring, post-processing, administration/approvals,
     placement/routes/migration, or runtime/verification.
   - Do not route form building to generic content/page writers or raw
     `FormDefinition` REST writes; the Forms iPart placement packet comes from
     `imis_form_display_contract`, and a saved definition is never treated as a
     launched form without the runtime/verification lane.

7. **Unknown product behaviour or UI-only configuration**
   - Use official iMIS docs for product behaviour.
   - Use browser/native UI observation as a temporary check, then encode the
     learned rule in a tool, skill, command, or agent prompt before relying on it
     as an autonomous workflow.

## Agent Ownership

| Agent | Owns |
| --- | --- |
| `membership-specialist` | Member, prospect, non-member, subscription, renewal, billing, group membership, conversion opportunity, and Party lifecycle questions |
| `imis-data-analyst` | Existing IQA/report execution, cohort data-shape discovery, metrics, aggregations, and result interpretation |
| `event-coordinator` | Event records, registrations, attendance, capacity, transfers, and event revenue evidence |
| `fundraising-specialist` | Donors, gifts, pledges, campaigns, Gift Aid, fundraising communications, and giving analytics |
| `implementation-consultant` | Cross-surface builds, IQD creation, RiSE/content/iPart/navigation, custom BO/panel, process automation, and final architecture decisions |
| `configuration-specialist` | Security/roles, billing cycles, pricing, commerce/order setup, process-automation setup, and iImport data-load setup |

Agents can collaborate, but the handoff must name the intent, surface, grain,
current evidence, and the next bounded question. Do not ask another agent to
"figure out iMIS" from scratch.

## Guardrails

- Purpose-built ownership is enforced in the MCP, not left to agent judgement.
  Generic create/update/delete and execute cannot be used to bypass an owning
  workflow's preview, confirmation, validation, or readback contract. Raw
  execute is denied by default unless an explicit operation allowlist exists.
- Do not start IQD builder work for an answer-only business question.
- Do not treat `imis_iqa action=surface` results as executable verification.
- Do not treat a query-source document as an end-user query until execution is
  proven.
- Do not let a failed packaged query push the agent into broad schema wandering.
  Fall back to domain workflow tools or identify the missing compact primitive.
- Do not hard-code demo examples as product logic. Examples can validate a
  workflow, but the durable fix must be a routing rule, workflow primitive, or
  reusable verification contract.
- When a workflow tool works for Party records, describe it that way even if its
  historical name contains "member".
