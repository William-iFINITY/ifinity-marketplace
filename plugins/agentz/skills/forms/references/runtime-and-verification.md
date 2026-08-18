# Forms Runtime, Verification, Response Writes, Reporting, and Launch Readiness

Rendered audit/rule-exercise/submit with explicit audience+actor identity, authoritative response/writeback/lifecycle readback, controlled REST response rows, reporting profiles, and the launch-readiness evidence gate. Loaded from the forms skill router.

### Step 9a — Choose the audience BEFORE any runtime call

`routeAudience` is a deliberate decision, never a default. Leave it unset and the tool returns `state="route_audience_required"` with the options rather than borrowing the Staff session — because submitting a public form with staff cookies is a different actor, and its failures surface as opaque runtime errors that read like tool defects.

| routeAudience | partition | What it costs you |
|---|---|---|
| `anonymous-public` | `public-anonymous` | **Nothing.** AgentZ requests its own isolated proof-only tab (no Staff or member cookies). This is the normal choice for public join/enquiry/application forms. |
| `signed-in-public` | `member-login` | **A human must sign in.** AgentZ can open the tab but never enters credentials. Request one with `imis_agentz_work_session op=request_tab identityContext="member-login"`, have a person sign in and approve the share, then pass its `tabId` as `browserTabId`. |
| `staff` | `staff-mcp` | **Nothing** — the existing agent-owned staff session is used. Submits AS STAFF; for a specific contact use `submissionActor="staff-on-behalf"` and target them explicitly (the form's contact context comes from the URL `ID`, not the signed-in identity). |

Every runtime session states `selfServiceable` and, when false, the exact `humanActionRequired` — do not infer a human handoff, read it. If you supply a `browserTabId` that does not qualify, the response itemises which check failed (owner, partition, lifecycle, sharing, approval); an unusable **anonymous** tab is replaced automatically (nothing identity-bearing is lost, and the substitution is reported), while a **member** tab is never silently replaced.

To obtain a non-staff browser session for anything else, use `imis_agentz_work_session op=request_tab`. Staff routes need no tab request.

### Step 9 — Runtime: Audit, exercise rules, and submit

`imis_form_runtime_submit` uses the connected AgentZ companion browser and has three actions: `audit`, `exercise-rules`, and `submit`. It never accepts credentials. Anonymous routes use an isolated anonymous partition; signed-in member or delegated-administrator routes reuse an operator-established isolated tab via `browserTabId` and verify `actorPartyId` from iMIS context. A staff session, staff-on-behalf context, and member/public session are distinct identities.

```
# Audit only (no mutation)
imis_form_runtime_submit action="audit" url="https://example.org/forms/signup" routeAudience="anonymous-public" submissionActor="anonymous-public-user"

# Exercise conditional rules without submitting
imis_form_runtime_submit action="exercise-rules" url="https://example.org/forms/signup" routeAudience="anonymous-public" submissionActor="anonymous-public-user" formDesignerLibraryId="<native-id>" ruleScenariosArray=[{"id":"country-rule","set":{"Country":"United Kingdom"},"expect":[{"field":"County","visible":true,"required":true}]}]

# Guarded submit (returns an expiring, single-use state/payload plan first)
imis_form_runtime_submit action="submit" url="https://example.org/forms/signup" routeAudience="anonymous-public" submissionActor="anonymous-public-user" formDesignerLibraryId="<native-id>" formDefinitionId="<definition-id-if-addressable>" fieldValuesObject={"First Name":"Jane","Last Name":"Doe","Email":"jane@example.com"}
# Re-run the unchanged call once with the returned exact confirmationText.
```

- Uploads require `fileInputsArray=[{field,path,bytes,sha256}]`. AgentZ transfers only the exact hash-bound local file to the resolved native upload control and requires native upload-success/readback before Submit.
- Stage reusable Multi Layout rows with `multiRowsArray=[{layout,fields,waitMs?}]`. Before each native Save attempt, AgentZ records the exact pre-stage row set. The saved row must resolve by one unique native Telerik data key (normally the source identity/Ordinal), reopen by that key, and match every requested field value before the containing form can submit. A row whose bound row-update process and target are both verified is an independent committed update and is retained even if the later main Submit fails. If the main submit is not authoritatively accepted, every other potentially durable staged row is deleted by its native key in reverse order and the exact pre-stage key/value set is verified. Duplicate visible values never select a row. Stop for reconciliation when the native key is unavailable or `state=partial_native_multi_row_write_requires_reconciliation`; never treat that state as a clean failure.
- Use `ruleScenariosArray` only with `action=exercise-rules`; each scenario supplies `set` values and explicit visibility/required/read-only/disabled/value expectations. This action never clicks Submit.
- Use `routeAudience="anonymous-public" submissionActor="anonymous-public-user" captchaSpam="required" captchaAttempt="missing-response-probe"` only for an anonymous negative enforcement check. It clears response fields immediately before Submit and must prove no counter/response/target mutation. AgentZ cannot solve, inject, or bypass CAPTCHA; complete the allowed branch through the visible provider/user flow in the same isolated session, then verify its counter/target result.
- Route targeting accepts exactly one resolved route: use `url`, or `navigationPath`, or `contentPath` with optional `publicBaseUrl`. Use `submitButtonText` only to disambiguate multiple native action buttons, and use bounded `waitMs` only for the form's documented asynchronous behavior.
- To verify an action redirect, perform the same guarded two-call Submit workflow and inspect the returned `postSubmitFinalUrl`. A created-contact redirect is complete only when that URL contains the exact new contact `ID` parameter and authoritative contact readback matches it; action serialization or a generic counter increment is not redirect proof.
- Identity inputs are explicit: `routeAudience`, `submissionActor`, `browserTabId`, `actorPartyId`, `participantPartyId`, `onBehalfPartyId`, `onBehalfContextUrl`, `delegatedTargetPartyId`, `delegatedGroupId`, `delegatedOperation`, and `staffUserId`. Supply only the fields appropriate to that actor model; the tool rejects crossed Staff/delegated contexts.
- Every Submit requires exact `formDesignerLibraryId`. Before issuing confirmation, AgentZ proves the row's current `FormVersionKey` is bound by exactly one published Forms iPart at the requested route; after navigation it requires one and only one rendered native namespace whose **complete** control-id/chartype signature exactly equals the persisted FormHtmlCode signature. Missing, extra, duplicate, textarea-only, Lookup-only, CAPTCHA, heading, or action-control mismatches all block; an empty or partial shared-field signature is never accepted. Any mismatch blocks before fields, uploads, Multi Layout rows, or Submit are touched. Supply `formDefinitionId` whenever that REST response identity exists or a FormResponse claim is required; AgentZ then binds the complete strict same-form/participant candidate baseline. Native Form Builder forms with no addressable FormDefinition bind that explicit non-addressable state instead of inventing an ID. The plan also binds the full native form snapshot, route/actor/session inputs, field values, uploads, Multi Layout rows, process artifacts/gates, and authoritative declared-target states. Any state or input drift, invented token, expiry, or reuse fails before navigation or Submit.
- Readback inputs are composable: `expectedValuesObject` describes the expected FormResponse values, `targetChecksArray` describes ordinary target writeback, `privateTextChecksArray` guards privacy exposure, and `postProcessingTargetChecksArray` describes the governed process targets. Keep these lanes separate rather than treating one successful counter change as all evidence.
- The tool emits structured `launchReadinessInput` and `securityReadinessInput`; pass them directly to launch readiness.

For staff-on-behalf, `onBehalfPartyId` means only the native Staff represented Party. If the target route has no picker, add a same-origin `onBehalfContextUrl`; AgentZ selects/verifies the Party there, submits on the intended route, and restores the prior context:

```
imis_form_runtime_submit action="submit" url="..." routeAudience="staff" submissionActor="staff-on-behalf" onBehalfPartyId="<partyId>" participantPartyId="<partyId>" formDesignerLibraryId="<native-id>" formDefinitionId="<definition-id-if-addressable>" fieldValuesObject={...}
```

For Company/Chapter Administrator workflows, establish the signed-in public session outside the tool, then submit with `routeAudience="signed-in-public"`, `submissionActor="company-administrator"` or `"chapter-administrator"`, `browserTabId`, exact `actorPartyId`, `delegatedTargetPartyId`, `delegatedGroupId`, and `delegatedOperation`. AgentZ verifies the session actor, URL target, administrator role, target membership/relationship, and chapter roster posture before Submit. Do not put a delegated URL target in `onBehalfPartyId`.

For canonical post-processing, pass `postProcessingArtifactObject` and `postProcessingTargetChecksArray`; success requires clean-before/matched-after target evidence plus native process observation, not merely a counter increment. Use the returned `postProcessingEvidence` directly as the launch-readiness handoff. A configuration import may return an inactive migrated form with a launch gate. To assess it without leaving it active, also pass the exact `postProcessingLaunchGateObject` and `temporarilyActivateInactiveForm=true`; AgentZ verifies the tenant/form/binding/artifact gate, activates only for that confirmed submit, and returns the form to inactive before returning an attested proof. For a mutating artifact include its purpose-owned target checks; a canonical read-only artifact uses its verified result lane without invented mutation targets.

### Step 10 — Verify: Read back response, writeback, and lifecycle

Pick the verification lane with `check=`:

```
# Confirm a safe submit produced the expected FormResponse
imis_form_verify check="submission" responseId="<id>" formDefinitionId="<id>" participantPartyId="<partyId>"

# Run FormResponse/_validate (and optionally _execute) against a response
imis_form_verify check="validation" responseId="<id>" attemptExecute=false

# Read back target records after a write (Party, panel/BO rows, groups)
imis_form_verify check="writeback" responseId="<id>" targetChecksArray=[{"entityName":"Contact","id":"<partyId>","label":"Contact","expectedFields":{"EmailAddress":"jane@example.com"}}] targetEvidenceOrigin="rendered-native-submission"

# Correlate approval/communication/task rows generated by the observed native submit
imis_form_verify check="lifecycle" submissionChannel="rendered-native" formDesignerLibraryId="<id>" participantPartyId="<partyId>" submittedAfter="2026-06-08T09:00:00Z" routeAudience="signed-in-public" submissionActor="signed-in-public-user" correlationTextChecksArray=["Jane Doe"]
```

`imis_form_verify` verifies an existing controlled form submission by readback. It does NOT submit a form.

The four checks return readiness packets for `imis_form_launch_readiness`:

- `check=submission` → `launchReadinessInput` (`submissionEvidenceObject`)
- `check=validation` → `validationReadinessInput` (`validationEvidenceObject`)
- `check=writeback` / `check=lifecycle` → contribute to the overall readback record

For rendered-route and security/UX verification use `imis_form_route_verify check=rendered` (normalizes a safe rendered/native submit observation):

```
imis_form_route_verify check="rendered" routeUrl="https://..." routeAudience="anonymous-public" submissionActor="anonymous-public-user" responseId="<id>" nativeSubmitConfirmation="verified" duplicateBehavior="not-required" captchaSpam="not-required"
```

When the lifecycle packet discovers communication or task identifiers, continue through the existing canonical owners rather than treating Forms correlation as delivery or task-execution proof:

```text
imis_communication_history_profile action="party" partyId="<participantPartyId>"
imis_communication_operations_profile action="inventory" partyId="<participantPartyId>"
imis_task_automation_profile action="diagnostics_failure_packet" taskActionLogId="<discovered TaskActionLogId>"
```

The communication history owner verifies recorded recipient/history evidence and preferences; it does not claim delivery, open, or consumption. The task diagnostics owner reads the exact log chain. Only when the user separately intends to run an existing task should the automation execution owner be used:

```text
imis_task_automation_execution action="plan_task_request" taskDefinitionId="<id>"
imis_task_automation_execution action="run_task_request" taskDefinitionId="<same id>" confirmationText="<exact plan confirmation>"
```

After any task run, re-read its logs and the purpose-owned affected records. A Forms lifecycle match never authorizes a rerun by itself.

### Step 11 — API Response Write: Controlled REST response rows

For controlled response-row completion on an existing native FormDefinition:

Actions: `validate`, `create`, `complete`, `update`, `delete`

```
imis_form_response_write action="validate" formDefinitionId="<id>" fieldsObject={"FieldName":"value"}
imis_form_response_write action="create" formDefinitionId="<id>" participantPartyId="<partyId>" fieldsObject={"FieldName":"value"}
imis_form_response_write action="create" formDefinitionId="<id>" participantPartyId="<partyId>" fieldsObject={"FieldName":"value"} confirmationText="<exact state-bound create confirmation>"
```

The first create/complete/update/delete call performs no write and binds the exact payload, current response or complete same-form/participant candidate baseline into its returned plan. The confirmed call takes a durable backup and compares every requested response property and named field—not only identity and field values—then removes a partial create or restores the prior row on any mismatch. `imis_form_response_write` does NOT make a REST-created FormDefinition equivalent to a native Form Builder form. API-created response rows have `targetEvidenceOrigin=api-response-write` — they do not close rendered-native writeback readiness.

After write, verify target writeback and lifecycle separately using `imis_form_verify check=writeback`.

### Step 12 — Reporting Profile: Profile sources before building reports

Before creating form IQAs or dashboards:

```
imis_form_reporting_profile formDefinitionId="<id>" includeSamples=true sampleLimit=10 includeLifecycleSources=true
```

`imis_form_reporting_profile` profiles live tenant sources used for form-response reporting. Reads metadata and bounded samples for FormDefinitionFieldData, FormFieldResponseData, FormResponse, NetContactData, and event-question sources. Returns tenant-specific fields, joins to validate, operational queues, and reporting gaps.

Key constraint: `FormFieldResponseData` must be scoped through derived `FormDefinitionFieldId`/`FormResponseId` values, NOT through `FormDefinitionId` directly.

For native Form Builder submissions that write targets without exposing a FormResponse row, supply `targetChecksArray` to read target metadata and exact target rows.

To create a reusable Forms-response IQA, validate the design, create it through
the canonical IQD owner, then pass the returned `queryPath` unchanged to the
query runner:

```text
imis_iqd_query action="validate" designObject={<form-response query design>}
imis_iqd_query action="create" designObject={<same design>} folderPath="$/Common/Queries/Forms"
imis_query queryPath="<exact queryPath returned by create>"
```

Validation alone does not create a query and an unrelated path does not prove
the new IQA can run. The create result must contain the reusable `queryPath`;
the subsequent `imis_query` result is the independent execution readback.

### Step 13 — Launch Readiness: Gate the form before going live

After all checks, aggregate into a single launch decision:

```
imis_form_launch_readiness formDesignerLibraryId="<id>" formDefinitionId="<id>" submissionEvidenceObject={<from step 10>} validationEvidenceObject={<from step 10>} securityEvidenceObject={<from step 8 or 9>} reportingEvidenceObject={<from step 12>} rollbackEvidenceObject={<from step 1 or 4>} postProcessingEvidenceObject={<exact postProcessingEvidence returned by runtime or approval execution when the form has a process binding>} contentDocumentPaths=["@/Shared_Content/SignupPage"] routeUrls=["https://example.org/forms/signup"] expectedAudiences=["anonymous","member"]
```

`imis_form_launch_readiness` combines native definition, active Form Library authoring-surface safety, Forms iPart placement, rendered page audit results, response, writeback, notification/task/approval, route/security, reporting, and rollback state into one usage-oriented readiness matrix. It does not mutate the tenant or submit rendered forms.

Pass readiness packets by name — the tool maps each lane internally:

- `submissionEvidenceObject` from `imis_form_verify check=submission` or `imis_form_response_write`
- `validationEvidenceObject` from `imis_form_verify check=validation`
- `securityEvidenceObject` from `imis_form_route_verify check=security` or `imis_form_runtime_submit`
- `reportingEvidenceObject` from `imis_form_reporting_profile`
- `rollbackEvidenceObject` from `imis_form_capture_contract` or `imis_form_builder_diff`
- `postProcessingEvidenceObject` from `imis_form_runtime_submit` or `imis_form_administration approval_execute_decision` whenever any Submit action is process-bound; pass its attested `runtimeProofs` bundle unchanged

The readiness matrix is NOT complete until all five base evidence packets are supplied and each lane closes. A form with any native post-processing binding also requires the sixth post-processing evidence packet; row-save and main-submit bindings are validated against their own trigger-specific proofs.
