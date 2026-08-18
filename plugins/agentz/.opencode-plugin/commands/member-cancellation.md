---
description: "Process a member cancellation or resignation — verify identity, confirm intent, cancel subscriptions, handle groups, send confirmation, log everything"
---

# Member Cancellation / Resignation

Process a membership cancellation, resignation, or non-renewal in iMIS.

## Determine Action

Parse $ARGUMENTS for the member and action type:
- **cancel** — Immediate cancellation, effective today
- **resign** — Formal resignation (same process as cancel, different reason code)
- **non-renew** — Let membership lapse at end of current term (do not auto-renew)

If not specified, ask the user which type.

## Step 1: Find & Verify the Member

1. `imis_find_member` with name/email/ID from $ARGUMENTS
2. `imis_billing_summary` partyId={id} — get current membership status

Present:
- Member name, ID, email
- Membership type (Subscription ItemId)
- PaidThrough date (when current term ends)
- Outstanding balance (unpaid invoices)
- Auto-pay status: `imis_autopay_summary` partyId={id}

## Step 2: Confirm Intent

IMPORTANT — ask the user to confirm before proceeding:

1. **Cancellation type**: Immediate or at end of term?
2. **Outstanding balance**: If balance exists, it needs to be addressed first:
   - Should we write off the balance? (Requires iMIS staff site)
   - Should we collect payment first?
   - Should we proceed with cancellation and note the outstanding amount?
3. **Group memberships**: Should the member be removed from all committees and chapters?
   - `imis_entity action=list` GroupMember with PartyId filter — show current group memberships
4. **Auto-pay**: Should auto-pay instructions be deactivated?
5. **Reason**: Why is the member cancelling? (Record this in the activity log)

## Step 3: Process Cancellation

### For Immediate Cancellation

1. **Cancel subscription**: `imis_manage_subscription` action="cancel" partyId={id} productCode={itemId}

2. **Deactivate auto-pay** (if active):
   - `imis_manage_autopay` action="deactivate" for any active instructions

3. **Remove from groups** (if confirmed by user):
   - For each group membership from the list above:
   - `imis_group_membership` action="preview_remove_member" groupId={groupId} partyId={id}

4. **Handle additional subscriptions**:
   - Check for chapter/section subscriptions (e.g., CHAPT/ prefix items)
   - Cancel these too: `imis_manage_subscription` action="cancel" for each

### For Non-Renewal (Lapse at End of Term)

1. **Update subscription**: `imis_manage_subscription` action="update" partyId={id} productCode={itemId} with data to flag for non-renewal
   - The member retains benefits until PaidThrough date passes
2. **Deactivate auto-pay** (to prevent automatic renewal billing):
   - `imis_manage_autopay` action="deactivate"
3. **Keep group memberships active** until PaidThrough expires
4. **Note**: The member will naturally lapse when PaidThrough < today

## Step 4: Send Confirmation

Send a cancellation confirmation email:

`imis_communication_message_submit` to={member_email} subject="Membership cancellation confirmation" body including:
- Effective date of cancellation
- What access/benefits remain (if non-renewal, benefits continue until PaidThrough)
- How to rejoin in the future
- Contact information for questions
- Outstanding balance note if applicable

## Step 5: Log Everything

`imis_contact_activity action=preview_log` partyId={id} with:
- subject: "Membership cancelled — {reason}" or "Membership set for non-renewal"
- interactionType: "Note"
- notes: Include:
  - Cancellation type (immediate/non-renewal/resignation)
  - Reason given by member
  - Subscriptions cancelled
  - Groups removed from
  - Auto-pay deactivated (yes/no)
  - Outstanding balance status
  - Confirmation email sent (yes/no)
  - Who authorised the cancellation

## Step 6: Summarize

Present to the user:
- **Member**: Name, ID
- **Action taken**: Immediate cancellation / non-renewal / resignation
- **Effective date**: Today or PaidThrough date
- **Subscriptions cancelled**: List with item codes
- **Groups removed from**: List (or "retained until lapse" for non-renewal)
- **Auto-pay**: Deactivated / was not active
- **Outstanding balance**: Amount and status
- **Confirmation email**: Sent to {email}
- **Activity logged**: Yes, with reason
