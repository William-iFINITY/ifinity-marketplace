---
description: "Process membership renewals, upgrades, downgrades, and lapse management in iMIS"
---

# Membership Renewal Management

Handle membership renewals, upgrades, downgrades, and lapse management in iMIS.

## Determine Action

Parse $ARGUMENTS for the member and action. If not specified, ask:
- **renew** — Extend current membership
- **upgrade** — Change to a higher membership tier
- **downgrade** — Change to a lower membership tier
- **check** — Review renewal status without making changes

## Step 1: Find Member & Current Status

1. `imis_find_member` — locate the member
2. `imis_billing_summary` — get current subscriptions, invoices, payments

Key fields to check:
- Current Subscription ItemId (membership type)
- PaidThrough date (active vs lapsed)
- Outstanding invoices
- Payment history

## Step 2: Action-Specific Processing

### Renew
Use `imis_manage_subscription` with `action: "update"`:
- Extend PaidThrough by the standard billing cycle
- If there's an outstanding invoice, note it

### Upgrade / Downgrade
1. List available membership types: `imis_entity action=list` Item with membership filter
2. Present options with pricing differences
3. Use `imis_manage_subscription` with `action: "update"` to change the ItemId
4. Handle prorated billing if applicable

### Check Status
Present a clear summary:
- Current type and tier
- PaidThrough date and days until expiration
- Outstanding balance
- Renewal history (recent payments)

### Reinstate Lapsed Member

Reinstatement is different from renewal — the member's PaidThrough has already passed and they may have been removed from groups or lost access.

1. **Check lapse duration**: Compare PaidThrough date to today
   - `imis_billing_summary` shows the gap

2. **Within grace period** (typically 30–90 days after PaidThrough):
   - This is a late renewal, not a full reinstatement
   - `imis_manage_subscription` action="update" to extend PaidThrough from the original expiry date (backdate to maintain continuous membership)
   - No new subscription needed

3. **Beyond grace period** (lapsed for months or years):
   - This is a reinstatement — may have different pricing or require reinstatement fee
   - Option A: Update existing subscription — `imis_manage_subscription` action="update" with new PaidThrough and BeginDate
   - Option B: Create new subscription if old one was fully cancelled — `imis_manage_subscription` action="create"
   - Re-add to groups if removed: `imis_entity action=list` GroupMember with PartyId to check, then `imis_group_membership` action="preview_add_member" for each
   - Verify login credentials still work: `imis_membership_login_setup action=list` partyId={id}

4. **Log**: `imis_contact_activity action=preview_log` documenting the reinstatement and any gap period

### Grace Period Handling

When a member's PaidThrough is past but they haven't been gone long:

- **Typical grace periods**: 30 days (standard), 60 days (common for annual), 90 days (generous)
- **During grace**: Member is technically lapsed but most organisations continue benefits. Renewal extends from the original PaidThrough (no gap).
- **After grace**: Full lapse. Reinstatement may require:
  - Different pricing tier
  - Reinstatement fee (check with user about organisation's policy)
  - New start date (gap in membership record)
  - Re-application to groups/committees
- **Policy check**: The grace period is organisational policy, not an iMIS system setting. Ask the user what their organisation's grace period is, or check `imis_entity action=list` LegacyCustomerType for billing cycle rules that may indicate grace windows.

## Step 3: Confirm & Summarize

- Previous status -> new status
- Billing impact (if any)
- Next renewal date
- Gap period noted (for reinstatements)
- Groups re-added (for reinstatements)
- Log the activity with `imis_contact_activity action=preview_log`
