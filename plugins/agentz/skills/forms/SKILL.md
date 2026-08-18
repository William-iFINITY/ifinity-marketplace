---
name: forms
description: >-
  Build, edit, place, submit, and verify native iMIS Forms. This skill should
  be used when the user says "form builder", "form design", "create a form",
  "edit a form", "form responses", "form routing", "form submission", "form
  launch", "form reporting", "form verification", "Forms iPart", "form
  placement", "form writeback", "form approval", "form notifications",
  "member form", "public form", "staff form", "survey", "contact form",
  "signup form", "contact update form", "registration form using Forms",
  "application approval form", "form health check", "form groups", or "form security".
---

# iMIS Forms — Build, Place, Submit, Verify

Design, build, place, submit, and verify native iMIS Form Builder forms through the MCP Forms tool family, from planning through reporting, administration, and governed cloud post-processing.

Use this skill for all native Form Builder authoring, placement, submission, verification, reporting, and administration. Start with `imis_forms_inventory` or `imis_form_capture_contract` before any write, and use the registered structured tool inputs rather than hand-building FormDesignerLibrary/FormDefinition payloads. `system-configuration` owns only Settings > Forms posture.

**Two separate authoring surfaces**: Native Form Builder (FormDesignerLibrary — the tenant-visible surface) and REST FormDefinition (a shell/response lane). User-visible Forms use `imis_form_builder_write`. `imis_form_definition_write` is the controlled REST shell/response lane; REST-created definitions are not treated as launchable until sections/fields survive readback.

## Key Concepts

**FormDesignerLibrary** is the native Form Builder record. `FormVersionKey` is its stable binding key; it is the value placed in `b:FormName` on a Forms iPart.

**FormDefinition** is the REST response-lane entity. It carries visible field schema, response counts, and writeback/approval/notification configuration. It is NOT the native Form Builder definition surface.

**FormResponse** is a single submission row tied to a FormDefinition.

**Forms iPart** is the RiSE content-page control that renders a native Form Builder form. Its `b:FormName` element binds to `FormVersionKey`. Always prepare placement with `imis_form_display_contract`; it validates the form and display settings together and returns the canonical `imis_page_iparts action=place kind=nativeIpart` packet. Direct placement settings delegate to this owner and the page builder consumes its packet, so there is one persisted XML contract rather than competing placement formats.

**Confirmation pattern**: Never invent confirmation text. `action=validate` validates only; it does not authorize or issue a create confirmation. For native create, deactivate, and delete, call the intended mutation once without `confirmationText` to receive a current-state-bound plan. Existing-form update first runs `imis_form_builder_diff`. FormDefinition and FormResponse create/update/delete, administration execute actions, migration, and runtime Submit likewise return their exact confirmation from a non-mutating plan/preview call. Re-run the unchanged operation with that exact, expiring, single-use value. Any tenant state, identity, payload, response history, placement, or candidate-baseline drift requires a fresh plan.

**Readback after write**: After every write, verify the saved FormDesignerLibrary/FormDefinition/FormResponse record by reading it back. A saved record is not a launched form. Placement, route publication, rendered submit, writeback, duplicate/CAPTCHA, notifications, approvals, security, reporting, and rollback checks are each separate readiness gates.

**Retirement and deletion**: Prefer `action=deactivate` for retirement. `action=delete` is governed by the same lifecycle owner and is issued only when authoritative submission count is zero and no Forms iPart placement references the form. The tool takes a durable pre-write backup, uses the tenant-supported REST/native path, verifies absence, and restores or reports preserved state when deletion does not complete. Never bypass its plan because a direct endpoint appears callable.

**Legacy/source-form recreation is requirements analysis, not automatic migration**: When the source is WebFormZ, another form product, screenshots, or an export, inventory its controls, rules, data mappings, payment behavior, status actions, and post-submit effects. Do not build or assume a source-product parser. Recreate only the faithfully supported native subset, record a concrete alternative for every unsupported behavior, and do not silently omit or downgrade anything.

## Forms Lifecycle — Entry Points

### Step 1 — Discovery: Read before touching

**Entry point**: `imis_forms_inventory` — lists FormDefinition records, extracts visible field/schema hints, counts FormResponse rows, and inspects supplied content pages for Forms iPart placements.

```
imis_forms_inventory limit=50 includeDefinitionDetails=true
```

**Capture a working form before editing**:

```
imis_form_capture_contract formDesignerLibraryId="<id>"
imis_form_capture_contract formId="<FormDefinitionId>" includeResponseSamples=true responseSampleLimit=5
```

`imis_form_capture_contract` snapshots the current native FormDesignerLibrary, response counts, optional specific FormResponse, optional Forms iPart XML from supplied content pages, and returns a launch-readiness checklist covering submission, writeback, notifications, approvals, security, spam posture, reporting, and rollback. Pass the returned `rollbackReadinessInput` into `imis_form_launch_readiness` later.

### Step 2 — Plan: Choose the right form surface

**Route the requirement before writing**:

```
imis_form_plan requirement="Member updates their address and communication preferences" audience="authenticated-member" needsWriteback=true writebackTargets=["contact","address"]
```

`imis_form_plan` converts a form or self-service requirement into the right native iMIS Form, PanelEditor, cloud REST post-processing, native commerce, Process Automation, client iPart, import/upload, or native-handoff recommendation. It returns structured alternative surfaces plus data, security, approval, launch-readiness, and rollback requirements.

Key planning inputs:

- `audience`: `anonymous-public`, `authenticated-member`, `staff`
- `publicFacing`: whether the route is public/anonymous
- `needsWriteback` + `writebackTargets`: contact, address, panel, activity, group, consent, task, communication
- `needsNotification`, `needsApproval`, `acceptsAttachments`, `needsPayment`

For a supplied legacy/source form, build a behavior ledger before authoring:

- visual/input control and validation
- show/hide/required/read-only/default/value rules
- read and write data sources
- submit/status actions and notifications
- membership/product/subscription/payment effects
- post-submit SQL, stored procedure, script, or integration effects

Classify each item as native Form Builder, captured native FormHtmlCode/FormRules, PanelEditor, Forms cloud REST post-processing, native Join Now/Cart/Payment Creator/Pay Central, Process Automation, or custom/client iPart. Any unclassified item blocks a claim of faithful recreation.

## Task Router — load the reference for your lane

Steps 1–2 above are always the entry points. For everything past planning, load the matching reference file; each one assumes the Key Concepts and confirmation/readback rules on this page.

| Task | Lifecycle steps | Reference |
| --- | --- | --- |
| Map fields/elements, author, edit, retire a form | 3, 4, 5 | [references/authoring.md](references/authoring.md) |
| Cloud REST post-processing (webhook on Submit/approval) | 3, 5, 9 | [references/post-processing.md](references/post-processing.md) |
| Groups, Multi Layouts, mode conversion, Preview, History, Health, approvals | admin | [references/administration.md](references/administration.md) |
| Place on a page, find routes, security posture, migrate between tenants | 6, 7, 8 | [references/placement-routes-migration.md](references/placement-routes-migration.md) |
| Rendered audit/submit, readback, response rows, reporting, launch gate | 9–13 | [references/runtime-and-verification.md](references/runtime-and-verification.md) |

Load [references/authoring.md](references/authoring.md) when building or changing any form definition — it owns the complete element/field/rule contract and the diff-then-update token flow.

Load [references/post-processing.md](references/post-processing.md) whenever a submission must mutate records beyond the form's own writeback — it contains the full proven chain and the create-time `sp_name` binding rule.

Load [references/administration.md](references/administration.md) for anything on the native administration surface, including every approval decision.

Load [references/placement-routes-migration.md](references/placement-routes-migration.md) before placing a form, resolving where it renders, or moving forms between tenants.

Load [references/runtime-and-verification.md](references/runtime-and-verification.md) before claiming a form works — rendered submission, writeback readback, and the launch-readiness evidence matrix live there.

## Reads vs Writes Summary

| Tool                                                                                                                                                         | Type                        | Confirmation required |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------- |
| `imis_forms_inventory`                                                                                                                                       | Read                        | No                    |
| `imis_form_capture_contract`                                                                                                                                 | Read                        | No                    |
| `imis_form_plan`                                                                                                                                             | Read (plan only)            | No                    |
| `imis_form_element_library`                                                                                                                                  | Read                        | No                    |
| `imis_form_builder_diff`                                                                                                                                     | Read (diff/plan)            | No                    |
| `imis_form_definition_diff`                                                                                                                                  | Read (diff/plan)            | No                    |
| `imis_form_display_contract mode=plan`                                                                                                                       | Read                        | No                    |
| `imis_form_display_contract mode=inspect_existing`                                                                                                           | Read                        | No                    |
| `imis_form_routes`                                                                                                                                           | Read                        | No                    |
| `imis_form_route_verify check=security`                                                                                                                      | Read                        | No                    |
| `imis_form_route_verify check=rendered`                                                                                                                      | Read (normalizer)           | No                    |
| `imis_form_verify check=*`                                                                                                                                   | Read                        | No                    |
| `imis_form_reporting_profile`                                                                                                                                | Read                        | No                    |
| `imis_form_launch_readiness`                                                                                                                                 | Read (aggregator)           | No                    |
| `imis_form_administration action=surface/health_inventory/health_export/approval_inventory/approval_get/group_inventory/group_validate/*_plan_*`             | Read / validation / plan    | No                    |
| `imis_form_administration action=health_execute_*/approval_execute_*/group_execute_*/mode_conversion_execute/history_execute_restore/multi_layout_execute_*` | **Write** (companion)       | **Yes**               |
| `imis_form_builder_write action=validate/get`                                                                                                                | Read                        | No                    |
| `imis_form_builder_write action=create/update/deactivate/delete`                                                                                             | **Write**                   | **Yes**               |
| `imis_form_definition_write action=validate/changelog`                                                                                                       | Read                        | No                    |
| `imis_form_definition_write action=create/update/delete`                                                                                                     | **Write**                   | **Yes**               |
| `imis_form_response_write action=validate`                                                                                                                   | Read                        | No                    |
| `imis_form_response_write action=create/complete/update/delete`                                                                                              | **Write**                   | **Yes**               |
| `imis_form_runtime_submit action=audit`                                                                                                                      | Read (companion)            | No                    |
| `imis_form_runtime_submit action=exercise-rules`                                                                                                             | DOM exercise without Submit | No                    |
| `imis_form_runtime_submit action=submit`                                                                                                                     | **Write** (companion)       | **Yes**               |

## Guardrails

**Do NOT**:

- Treat a saved Forms iPart binding as launched. Saved does not mean published, rendered, or verified.
- Use `imis_form_definition_write` as the native Form Builder writer. It is the REST shell/response lane only.
- Treat a successful `FormResponse/_validate` result, FormResponse row, or basic snapshot as proof of rendered duplicate/CAPTCHA enforcement, writeback, notification, approval, spam posture, or rollback behavior.
- Claim anonymous/member behavior from a staff WebForms session; staff-on-behalf and true anonymous/member are different audience contexts.
- Treat OAuth/bearer API access as confirming that WebForms routes share the same rendered login/session UX. Direct `/iCore` routes still need rendered/browser checks.
- Call direct FormDesignerLibrary delete/deactivate endpoints. Use the lifecycle actions so submissions, placements, backup, state-bound confirmation, absence/readback, and recovery are governed.
- Reuse a Staff-cookie tab to claim anonymous/member/delegated behavior. Use the correct isolated audience session and verified actor context.
- Treat a WebFormZ/legacy export as an instruction to build a generic migration parser or to preserve on-prem SQL/stored procedures in EMS.
- Approximate an unsupported control/rule as a text field, omit it, or claim faithful recreation while a behavior-ledger row is unresolved.
- Add another Forms writer, migration command, iPart XML serializer, IQA parser, or native-browser workflow when a canonical owner already exists. Extend the owner and route all callers through it.
- Update an existing completed/live form merely because it appears to implement the same requirement. Recreate into a new draft/inactive target unless the user explicitly requests an edit and capture/diff/rollback checks pass.

**Always**:

- Run `imis_form_capture_contract` or `imis_forms_inventory` before editing any existing form.
- When Forms ownership is unclear, call `imis_capability_guide area="forms"` and follow the returned canonical tool/action. Do not bypass a purpose owner with generic entity writes or ad-hoc browser actions, and do not invent a second Forms writer, migration lane, iPart serializer, or IQA owner.
- Run `imis_form_builder_diff` before editing a form with response history.
- Run `imis_form_builder_write action=validate` before create; then call create once without confirmation for its plan. Run `imis_form_builder_diff` before update, and call the lifecycle action without confirmation before deactivate/delete. Apply the same plan-then-confirm pattern to FormDefinition and FormResponse mutations.
- Inspect `formDesignSupport`, `ruleSupport`, and `alternativeRoutes`; stop the write when the result is not `writer_ready`.
- Verify exact native FormDesignerLibrary authoring-payload readback after Form Builder writes; field ids alone are insufficient.
- Use `imis_form_routes` to resolve content routes from iMIS data, not from guessing based on form names.
- Run `imis_form_launch_readiness` with all five evidence packets before claiming a form is ready to go live.
- Run `imis_form_administration action=mode_conversion_plan` before any drag-and-drop to Advanced conversion; retain its rules snapshot and rollback packet, and never reuse a confirmation after the form snapshot changes.
- Run `multi_layout_inventory` before changing a reusable layout, review every returned placement, and use the matching `multi_layout_plan_*` confirmation exactly once. Never claim a Multi Layout change from a clicked Save alone; require exact native manager readback and separate rendered row/writeback proof.

**Requires exact governed confirmation**:

- Form definition changes, reusable Multi Layout create/update/delete, drag-and-drop to Advanced conversion, Forms iPart placement on published/public pages, controlled test submissions that mutate data or send email.

**Requires native handoff or an existing purpose owner**:

- Tenant-specific Forms iPart settings not represented by `imis_form_display_contract`.
- Tenant-specific Form Builder controls, selector shapes beyond the verified default/table/IQA/text contract (including inline options or custom value/display columns), unsafe/executable rich markup, and Form Rules beyond the verified normalized writer set, unless their exact matching native payload is captured. Bounded rich instruction blocks and native text-entry HTML-editor behavior are normalized writer-owned and are not part of this fallback.
- Cloud Forms post-processing operations outside `imis_form_post_processing`'s supported REST/source-owner contract. Each deployed form still needs its own script-page render, exact action binding, controlled target before/after evidence, and cleanup. On-prem SQL/stored procedures must be decomposed rather than copied.
- Membership/product/payment journeys to standard Join Now/Cart/Payment Creator/Pay Central surfaces, or to a custom client iPart only where standard content items cannot express the journey.
- Native RiSE publish/render checks for the intended route (REST archive/publish behavior remains a tenant boundary).
- Establishing credentials or solving CAPTCHA. The operator signs into an isolated public/member companion tab or completes the provider challenge visibly; AgentZ reuses and verifies that session without receiving credentials.

## What This Does NOT Prove

- **Other audiences**: A successful route/submit in one isolated actor partition proves only that route and actor. Staff-on-behalf, anonymous, signed-in member, Company Administrator, and Chapter Administrator evidence are not interchangeable.
- **Delivery**: Notification and email delivery must be verified through communication/task lifecycle readback — `imis_form_verify check=lifecycle` correlates form-generated rows. A configured notification without live form-generated `CommunicationLogRecipient`/`CommunicationLog`/`TaskActionLog` readback is not proven.
- **Approval workflow**: Approval-gated forms require live `FormApprovalSubmission` readback correlated to the form, participant, and time window.
- **CAPTCHA enforcement**: A rendered CAPTCHA marker is not enforcement proof. CAPTCHA authoring is normalized, but enforcement requires a blocked submit with no counter/record mutation and an allowed submit with authoritative readback under the intended anti-spam configuration.
- **Rollback**: Ordinary writer recovery uses exact restore or deactivate/retire as appropriate. Official configuration-package migration additionally owns exact update restore and create-branch namespace/group/Multi Layout cleanup. Content-page restore/archive and response-history migration remain workflow-specific checks.
- **Form Builder delete**: A failed direct REST delete does not authorize a workaround. Use the governed lifecycle; it may choose the tenant-supported native path or return a preserved-state boundary, and deactivation remains the normal retirement route.
