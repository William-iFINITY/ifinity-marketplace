---
name: billing-management
description: >-
  Manage billing, payments, auto-pay, and financial operations in iMIS. This
  skill should be used when the user says "auto-pay", "recurring payment",
  "scheduled payment", "automatic billing", "payment schedule",
  "why wasn't their payment taken", "set up auto-pay", "deactivate auto-pay",
  "payment failed", "billing automation", "post a payment", "apply payment",
  "invoice", "refund", "credit", "wrong amount", "statement", "receipt",
  "outstanding balance", "overdue", or when troubleshooting billing or
  payment issues.
argument-hint: "[member-name-or-id] [action: auto-pay|payment|invoice|refund|statement]"
---

# Billing & Payment Management

Manage billing operations in iMIS: auto-pay, payment posting, scheduled payments, invoices, and financial troubleshooting.

## Key Concepts

- **Subscription**: The billing product linking a member to their dues (PaidThrough date = membership status)
- **InvoiceSummary**: An invoice sent to a member for dues, events, or products. Read invoices through `imis_invoice_billing_records` rather than raw entity lists.
- **PaymentSummary**: A payment received against an invoice
- **InvoicePayment**: Closed to direct writes — no create/list/get through this entity. Post invoice payments via `imis_pay_open_invoice` and verify via `imis_billing_summary`/PaymentSummary scoped by `PayorParty.PartyId`.
- **imis_invoice_billing_records**: The invoice read tool (InvoiceSummary and related billing records); use it instead of raw `imis_entity action=list` on InvoiceSummary.
- **AutoPayAccount**: The payment method on file (credit card, bank account)
- **AutoPayInstruction**: Rules for what gets paid automatically
- **ScheduledPayment**: Future-dated payments queued for processing
- **PartyPledgeScheduledPayment**: Pledge-specific payment schedules

---

## Auto-Pay Operations

### Check Auto-Pay Status
```
imis_autopay_summary partyId={id}
```
Returns accounts (payment methods), instructions (what gets paid), and scheduled payments in one call.

### Set Up Auto-Pay
1. Verify member has an active subscription: `imis_billing_summary` partyId={id}
2. Create instruction (gated): `imis_manage_autopay` action="preview_create_instruction" → action="create_instruction" confirmationText="{exact text from preview}"
3. Confirm setup
4. Note: The actual payment method (credit card, bank account) must be entered by the member through the iMIS website — CC details CANNOT be submitted via API.

### Modify Auto-Pay
- Update instruction (gated): `imis_manage_autopay` action="preview_update_instruction" instructionId={id} → action="update_instruction" confirmationText="{exact text from preview}"
- Cancel/deactivate instruction (gated): `imis_manage_autopay` action="preview_cancel_instruction" instructionId={id} → action="cancel_instruction" confirmationText="{exact text from preview}" (or preview_delete_instruction → delete_instruction)

### View Scheduled Payments
```
imis_scheduled_payments action=list
```
Tenant-wide list — there is no party filter; correlate rows to the member client-side, or use `imis_billing_summary partyId={id}` for the party-scoped view. Shows both general scheduled payments and pledge-specific schedules.

### Troubleshoot Auto-Pay Failures
billing-management configures/repairs auto-pay and posts payments; use troubleshoot-member for a member-reported complaint that needs the full decision tree. See the detailed decision tree in the troubleshoot-member skill. Quick summary:
1. `imis_autopay_summary` — is auto-pay configured?
2. Check AutoPayAccount — is the payment method expired?
3. `imis_gateway_accounts` — is the gateway active?
4. `imis_scheduled_payments` — are payments stuck in queue?
5. Common fixes: reactivate instruction, advise member to update payment method

---

## Payment Posting

### Post a Cash/Check Payment to an Invoice

For recording a payment received by cash or check against an outstanding invoice.

1. **Find the invoice**: `imis_billing_summary` partyId={id} — identify the outstanding InvoiceSummary
   - Note the InvoiceNumber and Balance
2. **Verify the amount**: Confirm the payment amount with the user
3. **Post the payment** (gated; the only invoice-payment route): `imis_pay_open_invoice` action="preview" with the invoice/amount → `imis_pay_open_invoice` action="submit" confirmationText="{exact text from preview}"
   - **paymentRoute=cash** posts a cash or check payment (optional `referenceNumber` ≤9 chars, e.g. a check number)
   - **paymentRoute=paycentral_card** posts a card payment using a fresh `DataVaultPaymentIntentId`
   - There is no ACH route and no `PaymentMethodCode`.
4. **Verify**: Re-check `imis_billing_summary` partyId={id} to confirm the invoice balance decreased
5. **Log** (gated): `imis_contact_activity` action="preview_log" partyId={id} description="Payment posted: {amount} to invoice {invoiceNumber}" → action="log" confirmationText="{exact text from preview}" (set `interactionTypeCode` only after `action=list_types`)

**IMPORTANT**: Card payments require a fresh `DataVaultPaymentIntentId` (paymentRoute=paycentral_card); raw card details CANNOT be submitted via the API.

**NOTE**: InvoicePayment is closed — no create/list/get through this entity. Post via `imis_pay_open_invoice`, then verify via `imis_billing_summary` or PaymentSummary scoped by `PayorParty.PartyId`.

---

## Invoice Management

### View Outstanding Invoices
```
imis_billing_summary partyId={id}
```
Shows all subscriptions, invoices, and payments for the member.

For more detail: `imis_invoice_billing_records action=list entity=InvoiceSummary paramsObject={"BillToPartyId":"{id}"}`

### Invoice Details
- InvoiceNumber, InvoiceDate, Description
- BillToParty (who owes)
- Balance (outstanding amount)
- FinancialEntity (which book/entity)

---

## Refund / Credit Processing

**Available refund/reversal tools** (each gated preview→execute): most refunds and reversals CAN be processed via MCP tools. Only a credit memo with no tool lane needs the staff site.

When a refund is requested:
1. **Document the request** (gated): `imis_contact_activity` action="preview_log" partyId={id} description="Refund requested: {amount} — {reason}" → action="log" confirmationText="{exact text from preview}" (set `interactionTypeCode` only after `action=list_types`)
2. **Check the original payment**: `imis_entity action=list` entityType="PaymentSummary" filter="PayorParty.PartyId={id}" — find the payment to be refunded (prefer `imis_billing_summary` partyId={id})
3. **Process the refund/reversal** with the appropriate tool:
   - **imis_refund_returned_order_payment** — refund a payment on a returned order
   - **imis_payment_adjustments** action="preview_reverse" → action="reverse" confirmationText="{exact}" — reverse a payment
   - **imis_return_order_invoice** — return an order invoice
4. **Escalation**: Only a credit memo with no tool lane needs the iMIS staff site (Commerce > Adjusting and reversing order invoices).
5. **Follow up**: After the refund is processed, verify with `imis_billing_summary`

---

## Financial Diagnostics

### "Why was this member charged the wrong amount?"

1. `imis_billing_summary` partyId={id} — check Subscription ItemId and recent invoices
2. `imis_entity action=list` entityType="ItemPrice" filter="ItemId={subscription_item_id}" — see pricing tiers
3. `imis_entity action=get` entityType="Party" id={id} — check CustomerType (member type controls pricing tier)
4. Compare expected price for their member type vs actual invoice amount

**Common causes:**
- Wrong member type → billing at wrong rate
- Pricing changed but existing subscription hasn't renewed yet
- Prorated amount for mid-cycle change (this is correct behaviour)
- Chapter/section surcharges adding to total (check for additional Subscriptions)
- Multiple overlapping subscriptions

### "This member has an outstanding balance — what's owed?"

1. `imis_billing_summary` partyId={id} — full billing view
2. `imis_invoice_billing_records action=list entity=InvoiceSummary paramsObject={"BillToPartyId":"{id}"}` — all invoices with balances
3. Present:
   - Invoice Number | Date | Description | Amount | Balance
   - Total outstanding
   - Oldest unpaid invoice (aging)

---

## Statement / Receipt Generation

**Formal PDFs**: Printed statements and official receipts must be generated through the iMIS staff site or SSRS reports.

**Data view via API**: Compile the information for review:

1. `imis_billing_summary` partyId={id} — subscriptions, invoices, payments
2. For detailed statement data:
   - `imis_invoice_billing_records action=list entity=InvoiceSummary paramsObject={"BillToPartyId":"{id}"}` — all invoices
   - `imis_entity action=list` entityType="PaymentSummary" filter="PayorParty.PartyId={id}" — all payments
3. Present as a formatted statement:
   ```
   Member: {name} (ID: {partyId})
   Statement Period: {start} to {end}

   INVOICES:
   Date       | Invoice#  | Description        | Amount   | Balance
   2025-01-15 | INV-1234  | Annual Membership   | $250.00  | $0.00
   2025-03-01 | INV-1235  | Conference Reg       | $150.00  | $150.00

   PAYMENTS:
   Date       | Reference | Method  | Amount
   2025-01-20 | PAY-5678  | Check   | $250.00

   BALANCE DUE: $150.00
   ```

---

## Presenting Billing Findings

- **Auto-pay status**: Active/inactive, what it covers, payment methods on file
- **Billing status**: Outstanding balance, overdue invoices, subscription status
- **Upcoming**: Next scheduled payments, next billing dates
- **Issues**: Expired payment methods, failed payments, wrong amounts
- **Actions taken**: Payments posted, auto-pay changes made
- **Escalation**: Items with no MCP tool lane — CC/payment-method updates (member-entered, PCI) and credit memos with no adjustment/reversal lane. Most refunds and reversals use the gated tools above (`imis_payment_adjustments` / `imis_refund_returned_order_payment` / `imis_return_order_invoice`).

## Related Configuration Tools

- `imis_payment_methods` — read-only: enumerate configured payment methods and payment method sets before a checkout or auto-pay flow. It does not prove a gateway will accept a method (`imis_gateway_checkout_readiness` does) and does not edit methods (that is `imis_accounting_configuration_setup` entity=PaymentMethod).
- `imis_automatic_payment_settings` — read/preview/save the tenant-wide automatic-payment settings that allow recurring donations and auto-renewing memberships; saving requires exact confirmation and the connected companion.
