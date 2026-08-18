---
name: troubleshoot-member
description: >-
  Diagnose and resolve iMIS member account issues. This skill should be used
  when the user says "why can't this member log in", "check member status",
  "investigate billing issue", "member has a problem", "fix account",
  "membership expired", "renewed but still lapsed", "auto-pay failing",
  "can't access content", "wrong amount charged", "double billed",
  "payment failed", "account locked", "missing from committee", or when
  a member reports access, billing, or data issues. Diagnose reported
  symptoms here; for a pure billing action (configure/repair autopay,
  post a payment) use billing-management, and for a deliberate healthy
  lifecycle change (renew, cancel, upgrade) use member-lifecycle.
argument-hint: "[member-name-or-id]"
---

# Member Troubleshooting

Systematically diagnose and fix member account issues in iMIS. This skill covers the most common support requests with specific decision trees for each problem type.

## Step 1: Find the Member

Use `imis_find_member` with the name, email, or ID from $ARGUMENTS.
If multiple matches, present them and ask which one.

## Step 2: Get the Full Picture

Run these to build a complete diagnostic view:

1. **Contact record**: `imis_entity action=get entityType=Party id={id}` — name, email, status, address, member type
2. **Billing summary**: `imis_billing_summary` partyId={id} — subscriptions, invoices, payments
3. **Login status**: `imis_security_access_profile action=principal userName={username-or-email}` — does a credential/principal record exist and what is its status? (This is credential evidence only; it does not prove WebForms sign-in or protected-route access. Or `imis_membership_login_setup action=list` and match the member's PartyId client-side — the tool has no partyId param.)
4. **Group memberships**: `imis_entity action=list` GroupMember with filter `PartyId={id}` — committees, chapters
5. **Recent changes**: `imis_entity action=changelog entityType=Party id={id}` — what changed recently

For a complete 360-degree view, use `imis_member_360` partyId={id} which pulls all of the above plus relationships, engagement, and giving history in a single call.

## Step 3: Diagnose — Problem Decision Trees

Based on the member's symptoms, follow the appropriate decision tree below.

---

### Problem: "Renewed but still shows lapsed"

The member paid their renewal but the system still shows them as lapsed or inactive.

**Diagnostic flow:**
1. `imis_billing_summary` partyId={id} — check Subscription `PaidThrough` dates
2. Check recent PaymentSummary entries — was a renewal payment actually received?
3. Check InvoiceSummary — is there a renewal invoice? Was it applied/paid?

**Root cause analysis:**
- **PaidThrough is in the past despite payment**: The payment was received but the Subscription `PaidThrough` date was not updated. This is the most common cause.
  - FIX: `imis_manage_subscription operation=update itemId={itemId} paidThrough={date} mode=preview` → `mode=submit confirmationText=<exact text from preview>`
  - Log: `imis_contact_activity action=preview_log partyId={id} description="Corrected PaidThrough date" interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>`

- **Payment exists but not applied to invoice**: Payment received but not linked to the renewal invoice.
  - FIX: This typically requires iMIS staff site intervention to apply the payment. Log the issue and escalate.

- **No payment found**: Member believes they paid but no payment record exists.
  - Check if payment was made to wrong account or duplicate Party record
  - Use `imis_duplicate_resolution` to check for duplicate records
  - Ask member for payment confirmation/receipt

---

### Problem: "Auto-pay keeps failing"

The member's automatic payment is not processing correctly.

**Diagnostic flow:**
1. `imis_autopay_summary` partyId={id} — check AutoPayAccount (payment method on file) and AutoPayInstruction (what gets paid)
2. `imis_gateway_accounts` action="list" — verify the payment gateway is active
3. `imis_scheduled_payments` action="list" — check for queued/failed payments
4. `imis_billing_summary` partyId={id} — check for outstanding invoices that should have been auto-paid

**Root cause analysis:**
- **No AutoPayAccount on file**: Member has no payment method stored.
  - ADVISE: Member must add payment method through the iMIS public site or staff must enter it. Credit card details CANNOT be submitted via API (PCI compliance).

- **Expired payment method**: Card on file has expired.
  - Check AutoPayAccount for expiry date
  - ADVISE: Member needs to update their payment method. Cannot update CC via API.

- **AutoPayInstruction is deactivated**: The instruction exists but is inactive.
  - FIX: `imis_manage_autopay action=preview_update_instruction instructionId={id} payloadObject={...}` → `action=update_instruction confirmationText=<exact text from preview>`
  - Log: `imis_contact_activity action=preview_log ... description=... interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>`

- **Gateway account issues**: Payment gateway is misconfigured or inactive.
  - Check `imis_gateway_accounts` — is the gateway active?
  - ESCALATE: Gateway configuration changes require admin access

- **Scheduled payment stuck in queue**: Payment is scheduled but hasn't processed.
  - Check `imis_scheduled_payments` for status
  - Check `imis_task_automation_profile` for automation errors
  - May need to wait for next processing cycle or trigger manually in iMIS

---

### Problem: "Can't access member-only content"

The member can visit the website but cannot see member-restricted pages or features.

**Diagnostic flow:**
1. `imis_membership_login_setup action=list` (match the member's PartyId client-side — no partyId param) or `imis_security_access_profile action=principal userName={username-or-email}` — does the member have login credentials?
2. `imis_billing_summary` partyId={id} — is their membership active? (PaidThrough > today)
3. `imis_entity action=list` GroupMember with filter `PartyId={id}` — are they in the required access groups?
4. `imis_entity action=get entityType=Party id={id}` — check email address (login may be tied to email)

**Root cause analysis:**
- **No login credentials**: Member has never been given login access.
  - FIX: `imis_membership_login_setup action=preview_create payloadObject={...}` → `action=create confirmationText=<exact text from preview>` (does not prove sign-in)
  - ADVISE: Tell member to log in and change their password
  - Log: `imis_contact_activity action=preview_log ... description=... interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>`

- **Lapsed membership**: PaidThrough < today means membership benefits are suspended.
  - FIX: Renew membership — `imis_manage_subscription operation=renew ... mode=preview` (or `operation=update` with `paidThrough`) → `mode=submit confirmationText=<exact>`
  - Or process a renewal payment first

- **Missing group membership**: Content may require membership in a specific group (SIG, section, chapter).
  - Check what group the content requires (ask user or check content access settings)
  - FIX: `imis_group_membership action=preview_add_member groupId={required_group} partyId={id} roleId={GroupRole-RoleId}` → `action=add_member confirmationText=<exact>` (resolve RoleId via `list_group_classes`/`get_group`)
  - Log: `imis_contact_activity action=preview_log ... description=... interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>`

- **Email mismatch**: Login email doesn't match the email on the Party record.
  - Check `imis_security_access_profile action=principal userName={email}` (or `action=user partyId={id}`)
  - FIX: Update Party email to match login, or recreate credentials

- **Account disabled or expired**: User security record may be disabled.
  - `imis_security_access_profile action=principal userName={email}` for status details (no disable/enable write here — route via `imis_membership_login_setup`)
  - FIX: May need to delete and recreate credentials via `imis_membership_login_setup preview_update`/`update` (or delete + create), each with confirmationText

---

### Problem: "Wrong amount charged"

The member was billed an unexpected amount on their invoice or subscription.

**Diagnostic flow:**
1. `imis_billing_summary` partyId={id} — check subscriptions and recent invoices
2. Note the Subscription ItemId (the membership product code)
3. `imis_entity action=list` ItemPrice with filter `ItemId={subscription_item_id}` — see the pricing tiers
4. `imis_entity action=get entityType=Party id={id}` — check CustomerType / member type field
5. Compare: expected price for their member type vs actual invoice amount

**Root cause analysis:**
- **Wrong member type**: The member's CustomerType doesn't match the expected pricing tier.
  - The subscription is billing at the rate for their current member type
  - FIX: Update the member type if incorrect, then reprocess billing
  - ESCALATE: Price adjustments on existing invoices require iMIS staff site

- **Pricing recently changed**: ItemPrice was updated but existing subscriptions bill at the old rate until renewal.
  - Check ItemPrice effective dates
  - ADVISE: New pricing typically takes effect at next billing cycle

- **Prorated amount**: Mid-cycle membership changes (join, upgrade, downgrade) result in prorated charges.
  - Check subscription BeginDate and BillThrough dates
  - Prorated amounts are correct if the change was mid-cycle
  - ADVISE: Explain the proration calculation to the user

- **Chapter/section surcharge**: Member may have chapter or section subscriptions adding to the total.
  - `imis_entity action=list` Subscription with PartyId filter — look for chapter subscriptions (often with CHAPT/ prefix)
  - Each chapter subscription adds its own billing item

---

### Problem: "Duplicate charges / double billed"

The member sees two charges or invoices for the same thing.

**Diagnostic flow:**
1. `imis_billing_summary` partyId={id} — check all subscriptions and invoices
2. Look for: duplicate Subscription records for the same ItemId
3. Look for: multiple InvoiceSummary entries with similar amounts and dates
4. `imis_duplicate_resolution action=find_candidates partyId={id}` — check if the member has a duplicate Party record

**Root cause analysis:**
- **Duplicate subscriptions**: Two active Subscription records for the same product.
  - This can happen when a member is re-added instead of renewed
  - FIX: Cancel the duplicate subscription — `imis_manage_subscription operation=cancel itemId={dup} mode=preview` → `mode=submit confirmationText=<exact>`
  - ESCALATE: Reversing the duplicate invoice requires iMIS staff site

- **Duplicate Party records**: The member exists twice in the system with separate billing.
  - `imis_duplicate_resolution action=find_candidates firstName={first} lastName={last} email={email}`
  - FIX: `imis_duplicate_resolution action=review_party_merge`/`action=review_organization_merge` then `execute_party_merge`/`execute_organization_merge` after dry-run review
  - WARNING: Merging is irreversible — always do a dry run first

- **Invoice correction**: A corrected invoice was issued alongside the original.
  - Check invoice descriptions and dates for correction indicators
  - ADVISE: One invoice may be a reversal/correction — check the net balance

---

## Step 4: Present Findings

Summarize diagnostics clearly:

- **Member**: Name, ID, email, status
- **Membership**: Type (ItemId), PaidThrough date, Active/Lapsed/Cancelled
- **Problem identified**: Specific root cause from decision tree above
- **Impact**: What the member is experiencing because of this issue
- **Recommended fix**: Specific actions with tool calls
- **Risk**: What could go wrong (e.g., "this will affect billing cycle")

## Step 5: Fix (with confirmation)

ALWAYS explain what you're about to do and get confirmation before making changes.

For each fix:
1. **Explain**: What will change and why
2. **Confirm**: Ask the user to approve
3. **Execute**: Run the appropriate tool
4. **Verify**: Re-check with `imis_billing_summary` or `imis_entity action=get entityType=Party id={id}` to confirm the fix worked
5. **Log**: Always log via `imis_contact_activity action=preview_log ... description=... interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>` to document what was done, when, and why

Common fixes and their tools:
- Update subscription dates: `imis_manage_subscription operation=update` (mode=preview→submit)
- Update contact info: `imis_entity action=update entityType=Party id={id}`
- Add/remove group membership: `imis_group_membership action=add_member`/`action=remove_member` (preview_add_member/preview_remove_member first, gated)
- Create login credentials: `imis_membership_login_setup action=preview_create` → `action=create confirmationText=<exact>`
- Reset login (delete + recreate): `imis_membership_login_setup action=preview_delete`/`delete` then `preview_create`/`create` (each gated with confirmationText)
- Reactivate auto-pay: `imis_manage_autopay action=preview_update_instruction` → `action=update_instruction confirmationText=<exact>`
- Cancel duplicate subscription: `imis_manage_subscription operation=cancel` (mode=preview→submit)

## When to Escalate

Some issues cannot be resolved via the API:
- **Credit card updates**: PCI compliance prevents CC data via API — member must use iMIS website
- **Invoice reversals and refunds**: supported via the gated tools `imis_payment_adjustments` (reverse a payment), `imis_refund_returned_order_payment`, and `imis_return_order_invoice`; only a credit memo with no tool lane needs the iMIS staff site
- **Gateway configuration**: Requires admin access to iMIS settings
- **Content access rules**: Page-level security configured in RiSE Page Builder

In these cases: log the issue via `imis_contact_activity action=preview_log ... description=... interactionTypeCode={code from list_types}` → `action=log confirmationText=<exact>`, explain clearly what needs to happen, and advise who should handle it.
