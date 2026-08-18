---
name: member-lifecycle
description: >-
  Create, onboard, renew, reinstate, cancel, resign, or non-renew iMIS
  members. Use when the user says "onboard member", "create a member",
  "new member", "renew membership", "reinstate member", "upgrade membership",
  "downgrade membership", "cancel membership", "resign", "non-renew",
  "membership lifecycle", or asks to change a member's subscription state.
  Use this skill for intentional, healthy lifecycle changes; when the member
  reports a problem or symptom, diagnose with troubleshoot-member first and
  return here only for the deliberate state change.
argument-hint: "[member-name-or-id] [action: onboard|renew|reinstate|cancel|non-renew]"
---

# Member Lifecycle

Use this skill for member creation and subscription lifecycle changes. Prefer
read-only discovery first, ask for confirmation before writes, and leave a clear
activity/audit trail.

**Party discovery tools**: `imis_party_search_compact` returns compact routing fields (IDs, names) for cohort work without dumping full contact payloads — use it before any multi-party workflow. `imis_organization_360` returns one normalized contract for an organization (profile, roster, relationships, finance, groups, data quality). `imis_prospect_opportunities` finds non-members already spending money (subscriptions/invoices/payments) who have not joined — the conversion-opportunity scan. `imis_party_profile` owns Party reference data and adjunct records (address formats/purposes, prefixes/suffixes, salutations, statuses, notes, images).

## Onboard A New Member

1. Gather first name, last name, email, organisation, and intended membership type.
2. Check duplicates:
   - `imis_find_member` with the email address.
   - `imis_search` on Party with first and last name.
3. If no duplicate should be used, create the Party with `imis_entity action=create`. Set the correct `$type`: `PersonData` for an individual, `InstitutionData` for an organisation. Link a person to their organisation with `imis_party_relationships`.
4. Add the membership subscription with `imis_manage_subscription operation="create"` (set `partyId`, `itemId` (the dues item, e.g. REG), `billSubscription`; run `mode=preview` first, then `mode=submit` with the exact `confirmationText`).
5. Ask whether to add chapters, committees, or groups, then use `imis_group_membership action="add_member"` (run `action="preview_add_member"` first).
6. Send a welcome email only after the user confirms the content.
7. Verify with `imis_find_member` and `imis_billing_summary`.

Summarise the PartyId, membership item, billing dates, group assignments, and whether a welcome email was sent.

## Renew, Upgrade, Downgrade, Or Reinstate

1. Find the member with `imis_find_member`.
2. Read billing state with `imis_billing_summary`.
3. Identify current subscription ItemId, PaidThrough date, outstanding invoices, and payment history.
4. For upgrades or downgrades, list candidate membership products before changing anything.
5. Use `imis_manage_subscription operation="renew"` for renewal (run `mode=preview` then `mode=submit` with `confirmationText`). Use `operation="update"` only to correct `PaidThrough`; a tier change is create-new + cancel-old, not an in-place update.
6. For reinstatement, check the lapse duration and whether groups or access were removed.
7. Re-add groups only after confirmation.
8. Log the interaction with `imis_contact_activity`: resolve the code via `action="list_types"`, run `action="preview_log" description=... interactionTypeCode=...`, then `action="log" confirmationText=<exact>`.

If payment allocation, write-off, or card/bank collection is needed, explain that staff-site or payment-gateway handling may be required.

## Cancel, Resign, Or Non-Renew

Before any cancellation write, present the member identity, current membership, PaidThrough date, outstanding balance, group memberships, and auto-pay state.

Ask for confirmation on:
- immediate cancellation vs end-of-term non-renewal
- outstanding balance handling
- group removals
- auto-pay deactivation
- cancellation reason

Use:
- `imis_manage_subscription operation="cancel"` for immediate cancellation (`mode=preview` then `mode=submit` with `confirmationText`).
- `imis_manage_subscription operation="update"` for non-renewal/end-of-term handling when supported by the client's policy (`mode=preview` then `mode=submit` with `confirmationText`).
- `imis_manage_autopay action="cancel_instruction"` for active auto-pay instructions (run `action="preview_cancel_instruction"` first); use `action="cancel_account"` to stop the whole auto-pay account.
- `imis_group_membership action="remove_member"` for confirmed group removals (run `action="preview_remove_member"` first).
- `imis_contact_activity` for the final interaction: resolve the code via `action="list_types"`, run `action="preview_log" description=... interactionTypeCode=...`, then `action="log" confirmationText=<exact>`.

Summarise the effective date, subscriptions changed, groups removed or retained, auto-pay action, outstanding balance status, and logged activity.
