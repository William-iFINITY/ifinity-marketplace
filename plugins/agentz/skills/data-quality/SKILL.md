---
name: data-quality
description: >-
  Find and manage duplicate contacts and maintain data quality in iMIS. This
  skill should be used when the user says "duplicate", "merge contacts",
  "clean up data", "find duplicates", "data quality", "duplicate records",
  "same person twice", "merge organisations", or when investigating potential
  duplicate contacts or planning data cleanup.
argument-hint: "[name-or-email-to-check]"
---

# Data Quality & Duplicate Management

Find duplicate contacts and merge records in iMIS to maintain clean, accurate data.

## When NOT to Use

A duplicate Subscription or Invoice on ONE Party is a subscription/billing fix (troubleshoot-member / `imis_manage_subscription`), not a merge — merging is for two separate Party records for the same person or organisation. A candidate hit is not proof of a duplicate; confirm before acting. To locate one member, use `imis_find_member`, not the merge tool.

## Key Concepts

- **PartyDuplicate**: iMIS-flagged potential duplicate records
- **OrganizationMerge**: Merge duplicate organisation records (uses `_execute`)
- **PartyMerge**: Merge two individual-contact records, or flag a pair as not-a-duplicate (`mark_records_non_duplicate`), via `_execute`
- Merging is **irreversible** — the duplicate record is permanently retired into the survivor (mark-records-non-duplicate is the reversible exception)

## Step 1: Find Duplicates

`imis_duplicate_resolution` is a single action-dispatched tool. Start with `action=surface` — it needs no inputs and returns the action map, destructive-operation warnings, and the writable entities (OrganizationMerge, PartyMerge). Then `find_candidates` (by partyId, or firstName/lastName/email).

### System-flagged duplicate overview
```
imis_duplicate_resolution action=surface
```

### Find candidates for a specific contact
```
imis_duplicate_resolution action=find_candidates partyId="12345"
```

### Search by name / email
```
imis_duplicate_resolution action=find_candidates firstName="John" lastName="Smith"
imis_duplicate_resolution action=find_candidates email="john@example.com"
```

## Step 2: Review Matches

For each potential duplicate pair, compare:
- Names and email addresses
- Addresses and phone numbers
- Membership status and history
- Group memberships
- ContactInteraction (interaction) history

Use `imis_entity action=get entityType=Party id={id}` for detailed comparison of both records (add `raw=true` only if you intend to PUT the record back).

## Step 3: Merge (review → confirm → execute)

**WARNING**: Merging is irreversible — the duplicate is permanently retired into the survivor. The tool enforces a **two-step guarded flow**: a `review_*` action returns an exact `confirmationText`, which you pass back to the matching `execute_*` action. There is no `dryRun` flag — the `review_*` action *is* the dry run.

In both flows: `mergeToPartyId` = the **survivor** (keeps its Party ID); `mergeFromPartyId` = the **duplicate** (retired).

### Organisations
```
# 1. Review (safe, no write) — returns confirmationText
imis_duplicate_resolution action=review_organization_merge mergeToPartyId="12345" mergeFromPartyId="67890"
# 2. Explain the impact to the user (which record survives, what moves) and get explicit confirmation
# 3. Execute with the exact confirmationText from step 1
imis_duplicate_resolution action=execute_organization_merge mergeToPartyId="12345" mergeFromPartyId="67890" confirmationText="<exact text from review>"
```

### Individuals (people)
```
# Optional: inspect an existing iMIS PartyMerge first
imis_duplicate_resolution action=get_party_merge partyMergeId="<id>"
# 1. Review — returns confirmationText
imis_duplicate_resolution action=review_party_merge mergeToPartyId="12345" mergeFromPartyId="67890" mergeTask="combine_two_records"
# 2. Get explicit confirmation, then execute
imis_duplicate_resolution action=execute_party_merge mergeToPartyId="12345" mergeFromPartyId="67890" mergeTask="combine_two_records" confirmationText="<exact text from review>"
```
Use `mergeTask="mark_records_non_duplicate"` to flag a pair as **not** a duplicate instead of merging them.

### Choosing the Survivor (mergeToPartyId)
- Keep the record with the most complete data
- Keep the record with the longest history
- Keep the record that's actively used for billing/membership
- The survivor keeps its Party ID; the duplicate's ID is retired

## Notes
- Both organisation and individual (party) merges are supported through the `review_*`/`execute_*` actions above — no manual entity surgery is needed for the merge itself.
- Always compare both records thoroughly (Step 2) before merging; the operation cannot be undone.
