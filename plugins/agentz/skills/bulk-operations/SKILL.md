---
name: bulk-operations
description: >-
  Bulk import and batch data operations in iMIS. This skill should be used when
  the user says "import members", "bulk upload", "batch import", "import contacts",
  "import file", "bulk data", "import status", "import log",
  or when working with large-scale data loading operations. This skill reads,
  plans, and posts existing ImportBatch records; end-to-end iImport setup (file
  types, templates, column mapping) belongs to system-configuration, and
  record merges belong to data-quality.
argument-hint: "[batch-id-or-action]"
---

# Bulk Import & Batch Operations

Read, inspect, plan, and post existing bulk-import batches in iMIS (member lists, event registrations, donation records). These tools do not upload files or map columns — file upload and column mapping are set at ImportBatch creation through native iImport (handled by system-configuration).

## Key Concepts

- **ImportBatch**: A batch import job with status tracking
- **ImportBatchSummary**: Overview of import batches with counts and status
- **ImportBatchLog**: Detailed log entries for each batch (errors, warnings, successes)
- **ImportFileType**: Defines the format and field mapping for an import

## Step 1: Check Available Import Types and Batches

```
imis_import_operations_profile action="inventory"
```
Read-only; does not upload or post. Shows what import setup and batches exist (contacts, events, donations).

## Step 2: Create an Import Batch

```
imis_import_setup action="preview_create" entity="ImportBatch" payloadObject={...batch fields...} → action="create" entity="ImportBatch" payloadObject={...same fields...} confirmationText="{exact text from preview}"
```
No MCP tool uploads the file or maps columns — that is a native iImport handoff (system-configuration).

## Step 3: Monitor Import Status

```
imis_import_operations_profile action="batch_status" batchId="BATCH-001"
```
Returns both the batch record and its log entries showing progress, errors, and warnings.

## Step 4: Post and Review Results

### Post a Batch (gated)
```
imis_import_processing action="plan_post_batch" batchId="BATCH-001" → imis_import_processing action="post_batch" batchId="BATCH-001" confirmationText="{exact text from plan}"
```
Read `imis_import_operations_profile action="batch_post_plan" batchId="BATCH-001"` first for the guarded plan context. Re-posting an already-Posted batch requires `allowRepost=true` on `imis_import_processing` and risks duplicate target records. Then confirm with `imis_import_operations_profile action="target_readback" batchId="BATCH-001" targetEntity="Party" identifiersArray=[...]` (API-created batches have no log identifiers, so pass the identifiers explicitly). A completed post is not proof the target records exist — verify the target records.

### Get Batch Details
```
imis_import_operations_profile action="batch_status" batchId="BATCH-001"
```
(or `imis_import_setup action="get" entity="ImportBatch" id="BATCH-001"` for the setup record)

## Troubleshooting Imports

When an import fails or has errors:
1. Check the batch status: `imis_import_operations_profile action="batch_status" batchId={id}` then `action="diagnostics_error_packet" batchId={id} importBatchLogId={logId}`
2. Review log entries for specific error messages
3. Common issues: duplicate records, missing required fields, invalid data formats
4. For duplicate issues, use `imis_duplicate_resolution` to investigate
