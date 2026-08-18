---
name: process-automation
description: >-
  Author, run, and monitor iMIS Process Automation tasks and triage the legacy
  workflow queue. This skill should be used when the user says "scheduled task",
  "process automation", "automated alert", "run this nightly", "task definition",
  "automation failed", "task log", "workflow queue", "stuck workflow", "pending
  work items", "renewal reminder automation", or when creating, executing, or
  diagnosing iMIS automation. Sending a one-off communication belongs to
  communications-management; import batch posting belongs to bulk-operations.
argument-hint: "[task-name-or-action]"
---

# Process Automation & Workflow Queue

Two distinct iMIS surfaces, two tool families — do not mix them:

- **Process Automation** (modern, supported): scheduled tasks and alerts. Owned by `imis_task_automation_design` (author), `imis_task_automation_setup` (record-level CRUD), `imis_task_automation_execution` (run), and `imis_task_automation_profile` (read/diagnose).
- **Workflow QUEUE** (legacy Process Manager): system-process work items you can view and triage but not mutate over the API. Owned by `imis_workflow_runtime`.

## Author an Automation (declarative)

```
imis_task_automation_design action="preview_create" designObject={ name, enabled?: false, trigger: {kind: "scheduled"|"dataChange"|"onDemand", ...}, source?: {queryDocumentVersionKey, name?}, action: {kind: "email"|"storedProcedure"|"systemJob", ...} }
→ imis_task_automation_design action="create" designObject={same} confirmationText="{exact text from preview}"
```
- The design goes in `designObject`; trigger and action are selected by `kind`. An email action needs a `source` (the IQA recipients/cohort). New tasks default to `enabled: false` — nothing auto-fires until it is deliberately enabled.
- `action="prove"` validates the design end-to-end (create disabled → read back → delete) without ever running it, and is itself gated: `confirmationText="PROVE PROCESS AUTOMATION TASK <name>"`.
- Built-in system jobs (e.g. refreshing dynamic groups, engagement scores) are selected by job name in the design; email actions reference a communication template.

## Run a Task (gated)

```
imis_task_automation_execution action="plan_task_request" taskDefinitionId={id}
→ imis_task_automation_execution action="run_task_request" taskDefinitionId={id} confirmationText="{exact text from plan}"
```
Read the task's logs back (`imis_task_automation_profile action="diagnostics_health"`) after a run. A completed run is NOT proof the downstream business effect happened — verify the affected records (the sent communications, the refreshed group, the updated parties) through their owning tools.

## Monitor and Diagnose

```
imis_task_automation_profile action="inventory"          # what automations exist, enabled state
imis_task_automation_profile action="diagnostics_health" # recent failures across task logs
imis_task_automation_profile action="diagnostics_failure_packet" ...  # evidence packet for one failure
```

## Triage the Legacy Workflow Queue

```
imis_workflow_runtime action="surface"                     # queue model + available queries
imis_workflow_runtime action="list" kind="tasks"|"work_items"|"participants"
imis_workflow_runtime action="plan_manage" ...             # native-handoff plan for a queue fix
```
- Queue reads go through REST-enabled IQA queries. On a 403, the fix is to tick "Available via the REST API" on the query (or provision a REST-enabled equivalent with `imis_iqd_query`) — the tool's error tells you which.
- Queue MUTATIONS (complete/reassign/requeue/unlock/delete) are not possible over the API: `plan_manage` returns a step-by-step native staff-UI handoff instead. After the human performs it, re-read the queue before claiming the state changed.
- Do not author automation here — creation lives in Process Automation above. The legacy engine has no create surface.

## Boundaries

- Schedule pause/resume and retry semantics beyond the documented run operation are native handoffs — plan them, don't fake them.
- Task logs are execution evidence, not a process-definition inventory; list definitions through `imis_task_automation_profile action="inventory"`.
- Queue row counts are identity-scoped: a differently-permissioned staff session may see more rows than the API connection does — say so when reporting counts.
