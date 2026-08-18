# Forms Administration — Groups, Multi Layouts, Mode Conversion, Preview, History, Health, Approvals

The complete `imis_form_administration` action surface and its plan/execute workflows, including the approval decision matrix and approval-time post-processing. Loaded from the forms skill router.

For the native administration surface, use the dedicated read/plan/execute contract. Its complete action surface is:

```text
surface
health_inventory, health_export, health_plan_resolve_all, health_execute_resolve_all
group_inventory, group_validate, group_plan_create, group_execute_create,
group_plan_update, group_execute_update, group_plan_delete, group_execute_delete
mode_conversion_plan, mode_conversion_execute
preview_plan, preview_execute
history_inventory, history_plan_restore, history_execute_restore
approval_inventory, approval_get, approval_plan_save_notes,
approval_execute_save_notes, approval_plan_decision, approval_execute_decision
multi_layout_surface, multi_layout_inventory, multi_layout_plan_create,
multi_layout_execute_create, multi_layout_plan_update, multi_layout_execute_update,
multi_layout_plan_delete, multi_layout_execute_delete
```

Administration inputs are grouped by workflow and should be carried unchanged from plan to execute:

- Groups: `groupCode`, `groupName`, `requiresApproval`, and `acknowledgeGroupReassignment`.
- Preview/history/conversion: `formDesignerLibraryId`, `historicalFormDesignerLibraryId`, `acknowledgeRuleLoss`, optional tenant-verified `websiteKey`, and only a returned, same-form `nativeDesignerUrl`.
- Reusable layouts: `hostFormDesignerLibraryId`, `layoutKey`, `multiLayoutObject`, and `acknowledgeReferencedDelete`.
- Approvals: `approvalSubmissionId`, `approvalStatus`, `approvalFormName`, `approvalGroupName`, `approvalSubmissionFilter`, `approvalSubmittedOrder`, `approvalDecision`, `staffNotes`, `approvalSelectedFieldIndexes`, `approvalSelectAll`, `approvalPostProcessingOrdinal`, and the exact `postProcessingArtifactObject` where applicable.
- Health export/cleanup: `fileName` and `acknowledgeDiagnosticHistoryLoss`.
- Every execute lane adds only the exact returned `confirmationText` to its unchanged plan inputs.

- Health Check inventory uses the authenticated AgentZ companion page and classifies missing fields/lookups, field size/type drift, retained Load/Submit errors, and source/IQA/Advanced runtime messages. Native Health Check is triggered by render-after-24-hours and Preview; there is no manual Run button.
- `health_export` opens Electron's native Save dialog. The operator chooses/confirms the destination; the tool resumes and returns the verified path and file hash. `health_plan_resolve_all`/`health_execute_resolve_all` bind the complete log snapshot and require explicit diagnostic-history-loss acknowledgement, exact confirmation, and empty-grid readback. Clear only after the underlying source/form faults have been repaired.
- Approval configuration is validated across both `FormDesignerLibrary.IsApprovalType` and inherited Form-group approval. Multi Layouts, Documents, Signup fields, and Where/Where multi-instance modes are rejected before validation/write when approval applies.
- Approval inventory/get, notes, and decisions use `imis_form_administration`. Use `approvalSelectedFieldIndexes` only for partial **Approve**; use `approvalSelectAll=true` for approve-all, Reject, and Return because Reject and Return govern the whole submission. Always plan first, submit the exact returned confirmation once, and rely on the tool's native/REST/target readback before reporting the outcome. Keep approval-time post-processing in this same owner. `Post Error` is diagnostic-only; native Forms exposes no resubmit/retry action, so do not invent one.
- If the held submission's Submit action is process-bound, pass the exact `postProcessingArtifactObject` to both `approval_plan_decision` and `approval_execute_decision`; when an already-correlated row identity is required, pass the same `approvalPostProcessingOrdinal` to both calls as well. The execute call must otherwise repeat the complete plan input unchanged and add only `confirmationText`.
- Approval detail requires the official IQAs at `$/Forms/Approvals/PartyInformation` and `$/Forms/Approvals/SubmitterInformation`. Inspect or repair them through the canonical `imis_iqd_query` owner while preserving the display fields required by the native approval detail. The `Code`/`Description` alias rule applies to Form field Lookup-selector IQAs, not to these approval-context IQAs. Re-open `approval_get` after any repair; do not add a Forms-specific IQA writer.
- When held approval is not the intended workflow, use the documented Unreviewed alternative: author the native form so the actual target status is written as `Unreviewed` immediately, then use `imis_iqd_query` to create a review IQA filtered to that status and `imis_query` to run it. This is immediate target writeback plus a reporting queue, not a held approval. Do not offer Approve/Reject/Return semantics or imply that rejecting an IQA row can transactionally undo the original update.
- Group inventory correlates `FormDesignerType` with `FormDesignerLibrary`, protects the immutable `GENERAL` system group, reports approval flags and bound-form counts, and states the native delete-to-General behavior.
- `group_validate` is non-mutating and requires a stable code plus display name because `FormDesignerType/_validate` does not derive the code. It is not create/update/delete proof.
- Native group creation accepts only `groupName`; iMIS assigns the stable code, which AgentZ discovers from the exact post-create inventory diff. `requiresApproval=true` is then applied through the native edit row. Do not invent a create code or improvise group writes through generic entity calls.
- Group create planning and execution must carry the identical desired state: call `group_plan_create` with both `groupName` and explicit `requiresApproval`, then call `group_execute_create` with those same values plus the returned `confirmationText`. Changing either value invalidates the plan.
- Group plan actions inspect the native controls and bind the complete current group/form-assignment state into a ten-minute single-use confirmation. Create/update succeed only on exact definition readback and attempt bounded rollback on mismatch. Delete requires explicit bound-form reassignment acknowledgement and exact absence plus per-form `GENERAL` readback; it is intentionally non-reversible because a recreated group may receive a different code.
- Do not clear the global Health Check log to hide errors.
- `mode_conversion_plan` opens and cancels the authenticated native warning, captures the full FormDesignerLibrary version and FormRules graph, prepares a native Form History rollback packet, and returns an exact confirmation only after `acknowledgeRuleLoss=true`. REST does not expose a reliable `IsAdvancedMode` flag on the proven tenant, so the native edit row is authoritative.
- `mode_conversion_execute` is a real irreversible-version write. It re-profiles the native control, rejects a changed snapshot, clicks Proceed only after exact confirmation, and reports success only when the Advanced editor and Form Library mode marker read back. If Proceed was clicked but readback is incomplete, treat the result as attempted/unverified and inspect Form History before retrying.
- Treat native Designer **Preview as side-effecting**, not read-only. Current-tenant companion proof rendered the HTML editor and counter correctly but the Preview postback changed `FormDesignerLibrary.UpdatedOn` while the authoring payload/version stayed unchanged. Use the opt-in diagnostic only on a controlled scratch form with exact before/after snapshots; prefer placed-form route/runtime verification for launch proof.
- Reusable Multi Layouts are first-class companion-owned definitions, not opaque MILayout strings. Inventory existing `LayoutName.Source` definitions before reuse; create/update `multiLayoutObject` must explicitly include the complete ordered native source field set, general settings, filter, and each field's labels/default/visibility/read-only/required/lookup mode. Activity and file-upload fields fail closed. `refreshFieldList=true` is governed because native Update field list resets unsaved layout settings.
- Multi Layout plan actions never click field Update, Update field list, layout Save/Delete, Preview, or Form Save. Execute uses a tenant/current-definition/dependency-bound confirmation with a ten-minute TTL and single-use nonce consumed before the first native write. Success requires exact definition readback (or absence for delete). Reusable-layout row values save immediately; separately verify every placed form's rendered grid/popup and row writeback, and use the explicit row-update post-processing contract above when required.
