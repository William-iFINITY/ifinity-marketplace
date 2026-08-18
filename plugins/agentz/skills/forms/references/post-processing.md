# Forms Cloud Post-Processing — Contract, Script Page, Binding, and Runtime Proof

The declarative REST post-processing lane: operation contract, canonical formswebhook script, script-page placement, create-time Submit binding, artifact verification, and runtime/approval proof. Loaded from the forms skill router.

For cloud Forms post-processing, use the dedicated contract rather than authoring a free-form script:

```text
imis_form_post_processing action=plan contractName="Joining interests" formName="Member Joining" processContentPath="@/Shared/Forms/Member Joining Post Process" operationsArray=[...]
imis_form_post_processing action=build_script ...
imis_form_post_processing action=verify formDesignerLibraryId="<id>" contentDocumentId="<script-page-id>" ...
```

- The operation contract is declarative and accepts only registered entity sources or live metadata-verified custom panel sources. Custom-panel request bodies are flat intended property bags at the tool boundary; AgentZ validates fields/identity against metadata and applies the canonical `imis_panel_records` GenericEntityData envelope. Mutation steps must name the purpose owner returned by the tool.
- Use `{{ID}}`, `{{Ordinal}}`, `{{FormName}}`, a bounded loop item such as `{{row.PartyId}}`, or an earlier stable result such as `{{result.load-party.records.0.Status.PartyStatusId}}`. `forEach={from,as,maxItems}` iterates an earlier collection GET. `bodyFrom` plus dotted `setFields` implements the documented GET→modify→PUT pattern, and `when` supports `equals`, `not-equals`, `exists`, and `not-exists`. Any unresolved request template stops before fetch; only existence checks and display messages tolerate a missing optional value.
- The generated `formswebhook` validates the 10-character ID limit, exact form name, optional integer ordinal, same-origin `/API/` route, and request-verification token. Contact-scoped targets must be identity-rooted in the submitted/on-behalf `{{ID}}`. Native Forms supplies a blank string when no process table is bound; the compiler normalizes that to an absent Ordinal and also accepts an integer encoded as a string.
- `POST` requires a get-by-id preflight or an identity-complete query whose uniqueness can be proven; conflicts are reconciled by authoritative readback. `POST`/`PUT` require non-empty `expectedFields` tied exactly to the intended mutation, and the matched readback record becomes the operation's stable `records` result even when iMIS returned HTTP 204. `DELETE` needs explicit destructive-plan acknowledgement and absent readback. The compiler rejects a worst-case request plan above its fixed budget and runtime failures return a partial-application ledger for purpose-owned reconciliation.
- Optional `successMessage` and `failureMessage` are exact user-facing strings (up to 500 characters) and may reference stable prior results. The configured failure message never receives internal HTTP/error text; diagnostics remain separate.
- Use `imis_page_builder`/`imis_page_iparts` to create or update and publish the RiSE script page, then use `imis_form_builder_write` to merge the returned `processName`/`processTable`/`processContractFingerprint` patch into the intended validated Submit action. The writer re-runs the post-processing compiler against the embedded contract, byte-compares the authoritative saved script, requires `Document.Status=Published`, and accepts only one active canonical script with no second script or executable markup. A copied marker, modified script, Working page, comment/template-hidden hook, or mixed-script page is rejected. Native Save does not run processes. Do not append a second Submit action blindly, and bind `processTable` only to a multi-instance source present on that form.
- A main form's post-processing cannot consume a just-saved Multi Layout row as pending main-form field data. Native row-update processing is supported when the Submit binding names the exact Multi Layout `processTable`/`processOrdinalSource`; the runtime supplies the saved row's `Ordinal`. Keep main-form and row-update contracts separate and verify the intended row by source plus Ordinal.
- `action=verify` applies the same Published, active-only, canonical-page check and proves the saved script fingerprint plus exact `sp_name`/`processtable` binding. It emits `runtimeArtifactContract`; pass that object unchanged to `imis_form_runtime_submit postProcessingArtifactObject` and, for approval-time processing, to `imis_form_administration postProcessingArtifactObject`. It does not prove the hook ran; controlled before/submit/after target evidence is still required.
- For launch-grade proof, pass purpose-owned `postProcessingTargetChecksArray` to `imis_form_runtime_submit`. Success requires an absent target before submit, a verified native counter increment, the bound process resource observed, a matching target afterward, and cleanup. A counter increment alone is never webhook success.
- Approval forms defer post-processing until `imis_form_administration action=approval_execute_decision` completes the native approval. AgentZ gives the native approval its full bounded observation window first. Recovery is eligible only when REST and native status are both completed, native process history matches the selected updates, the approval snapshot changed, persisted `ButtonProcess`/`ProcessObjectName` are blank, and no native process resource, call, or receipt appeared. It then invokes the exact same current Published canonical artifact once through the approval page's native `callWebHook` contract and labels the proof `agentz-canonical-recovery-after-native-approval-process-omission`; never describe that recovery as a native iMIS invocation.
- When an approval Submit action names a `processTable`, supply `approvalPostProcessingOrdinal` only from already-correlated submission evidence. Otherwise AgentZ snapshots every Party-scoped row before approval and accepts an Ordinal only from one unique, complete post-approval diff; missing, truncated, or ambiguous diffs fail closed. Success still requires a nonce-bound canonical receipt, authoritative target readback, and purpose-owned cleanup.
- Commerce, billing, payment, subscription, security, arbitrary URL, raw JavaScript, SQL, and stored-procedure paths are rejected or routed to their purpose-owned alternatives.

The complete operational cloud post-processing chain is:

```text
imis_form_post_processing action="plan" contractName="..." formName="..." processContentPath="@/..." operationsArray=[...]
imis_form_post_processing action="build_script" contractName="..." formName="..." processContentPath="@/..." operationsArray=[...]
imis_page_builder action="plan" pageSetName="..." pageSetTitle="..." parentContentPath="@/..." manifestObject={<one process page>}
imis_page_builder action="create" pageSetName="..." pageSetTitle="..." parentContentPath="@/..." manifestObject={<same manifest>}
# Use this form when build_script returned scriptHtml inline. designMode="none" is mandatory: any design wrapper fails the strict canonical-script verification.
imis_page_iparts action="place" documentId="<created process page>" kind="html" html="<exact scriptHtml>" designMode="none" showTitle=false
# Use this form when build_script returned a packetized scriptHtmlHandoff.
imis_page_iparts action="place" documentId="<created process page>" kind="html" htmlHandoffObject={<exact scriptHtmlHandoff>} designMode="none" showTitle=false
imis_page_builder action="launch_existing" pageSetName="..." pageSetTitle="..." manifestObject={<same manifest>}
imis_page_builder action="launch_existing" pageSetName="..." pageSetTitle="..." manifestObject={<same manifest>} confirmLaunch="<exact confirmationText returned by the first launch_existing call>"
# Bind the process AT CREATE TIME: iMIS persists sp_name Submit bindings on FormDesignerLibrary create but silently strips them on REST update (a native platform boundary; the update writer detects the strip and rolls back). For an existing form, create a replacement form carrying the binding and re-point the Forms iPart (imis_page_iparts action="update_properties" properties={"b:FormName":"<new FormVersionKey>"}), then retire the old form.
imis_form_builder_write action="create" formName="..." formStatus="A" simpleFormObject={<design whose Submit carries the returned processName + processContractFingerprint (+ processTable when multi-instance)>}
# The confirmed create repeats the identical input with the returned confirmationText.
imis_form_post_processing action="verify" contractName="..." formName="..." processContentPath="@/..." operationsArray=[...] formDesignerLibraryId="<form id>" contentDocumentId="<process page id>"
imis_form_runtime_submit action="submit" url="<published form route>" routeAudience="<anonymous-public|signed-in-public|staff>" submissionActor="<matching explicit actor>" formDesignerLibraryId="<form id>" postProcessingArtifactObject={<runtimeArtifactContract>} postProcessingTargetChecksArray=[...]
# Repeat the identical submit input with confirmationText="<exact state-bound value from the first call>".
```

Carry `scriptHtml` or `scriptHtmlHandoff`, the page identities, `runtimeArtifactContract`, confirmation values, and target-check packets directly between tools. Large scripts are returned as a typed, hash-bound `scriptHtmlHandoff`; pass it unchanged to `imis_page_iparts htmlHandoffObject`. That owner resolves and verifies the exact stored script server-side, so do not manually read, copy, truncate, or reconstruct it. Supply exactly one of `html` and `htmlHandoffObject`, and do not add a second page/form serializer.

When `processTable`/`processOrdinalSource` names a reusable Multi Layout source, exercise the row-save trigger explicitly:

```text
imis_form_runtime_submit action="submit" url="<published form route>" routeAudience="..." submissionActor="..." formDesignerLibraryId="<form id>" multiRowsArray=[{"layout":"<exact reusable layout identity>","fields":{...}}] postProcessingArtifactObject={<runtimeArtifactContract>} postProcessingTargetChecksArray=[...]
# Repeat the identical input once with confirmationText="<exact state-bound value from the first call>".
```

Require `multiLayoutRowPostProcessing.launchReady=true`, one verified attempt for every selected row, `expectedOrdinal=observedOrdinal`, and a corresponding attested entry in `postProcessingRuntimeProofs`. Carry the returned `postProcessingEvidence` object unchanged to `imis_form_launch_readiness postProcessingEvidenceObject`. This row proof is complete at the native row Save. Assess the later main-form Submit and its counter/response/writeback independently; a verified row process remains committed if that later Submit is blocked or not authoritatively accepted.
