---
name: commerce-operations
description: >-
  iMIS commerce and order operations — product/item catalog, pricing, carts,
  orders, checkout readiness, and collection runs. This skill should be used
  when the user says "product", "item catalog", "price sheet", "shopping cart",
  "order", "checkout", "can members buy", "set up a product", "order history",
  "run the autopay collection", "recurring donation checkout", or when working
  with what the tenant sells and how orders flow. Invoice/billing-cycle
  questions belong to billing-management; one-off gift processing belongs to
  fundraising; event registration purchases belong to event-management.
argument-hint: "[item-code-or-action]"
---

# Commerce & Order Operations

What the tenant sells (items, prices), how it is bought (cart, checkout), and what happened (orders). Read with the profile tools first; every write is preview → exact confirmation → readback.

## Item Catalog

### Read (always start here)
```
imis_item_catalog_profile action="inventory"                 # items, item classes, price sheets, billing items
imis_item_catalog_profile action="resolve_party_item_price" partyId={id} itemId={id}   # or productId={id}
```
`resolve_party_item_price` answers "what would THIS member pay for THIS item" using the tenant's own pricing resolution — use it instead of guessing from price-sheet rows.

### Write (gated)
```
imis_item_catalog_setup action="preview_create" entity="Item"|"ProductItem"|"ItemPrice"|"ItemClass"|... payloadObject={...}
→ imis_item_catalog_setup action="create" entity={same} payloadObject={same} confirmationText="{exact text from preview}"
```
Covers items, product items, item sets/classes, prices, price-sheet groups/product prices, and legacy billing/product records. After a price change, re-resolve a representative party's price to prove the change is being consumed, not just stored.

## Commerce System Settings

```
imis_commerce_system_setup action="inventory"    # read commerce-wide settings
imis_commerce_system_setup action="preview_update" ... → action="update" ... confirmationText=...
```
Tenant-wide commerce configuration. Change settings only with explicit user intent — they affect every purchase path.

## Carts and Checkout

```
imis_cart_operations action="get"|"list"                     # read cart state
imis_cart_operations action="preview_update"|"preview_remove_line"|"preview_submit"|"preview_clear" → gated mutation with confirmationText
imis_gateway_checkout_readiness ...                          # is a real checkout possible on this tenant?
```
`imis_cart_operations` is the LOW-LEVEL cart primitive — avoid it for standard flows that have purpose-built guarded tools (`imis_create_billme_order`, event registration, donation lanes); submit/clear are irreversible and require downstream order/payment readback before claiming completion. `imis_gateway_checkout_readiness` reports whether gateway accounts, payment methods, and settings line up for live checkout — run it BEFORE building any purchase flow so a broken gateway is found before the user-facing failure. Building the checkout PAGE belongs to rise-website-design (`imis_page_builder recipe=cartCheckout`).

## Orders

```
imis_order_processing_records action="inventory"|"list"|"get"    # order records
imis_invoice_billing_records action="get_invoice_order" orderNumber={n}  # full order packet by number
imis_order_processing_records action="preview_order_create" → gated create with confirmationText
```
Read an order packet as evidence; order pricing updates (`preview_order_update_pricing`) and returns/refunds are separately gated lanes (`imis_return_order_invoice`, `imis_refund_returned_order_payment` — see billing-management for the money-movement side). For a "bill me" order, prefer the purpose-built `imis_create_billme_order`.

## Recurring/Scheduled Collection Lanes

```
imis_recurring_donation_checkout action="prepare" ...   # build a HOSTED checkout handoff (no money moves here)
imis_recurring_donation_checkout action="verify" partyId={id}   # verify a completed hosted submission
imis_submit_paycentral_gift ...                          # gated: submit a gift through the hosted payment lane
imis_process_autopay_collection action="preview_process_recurring_donations" → action="process_recurring_donations" confirmationText=...   # gated collection pass (send-due-invoices / retrieve-processed legs have their own preview actions)
```
- `imis_recurring_donation_checkout` does NOT move money itself: `prepare` hands the payer off to a hosted checkout page, `verify` confirms a completed submission afterward — treat it as a handoff, not a charge.
- The gated collection/gift lanes (`imis_process_autopay_collection`, `imis_submit_paycentral_gift`) DO move real money. Always: preview/plan first, show the user what will be charged, require the exact confirmation, then read back the resulting payment/order records. A submitted payment is proven by its readback record, never by the submit response alone.

## Boundaries

- Never construct or log full card/bank details; hosted payment lanes exist so raw instruments stay out of the conversation.
- Catalog readback proves the record exists, not that public/member pricing pages display it — verify the rendered commerce surface for storefront claims.
- Autopay ENROLLMENT and schedule questions belong to billing-management (`imis_manage_autopay`, `imis_scheduled_payments`); this skill owns catalog, carts, orders, and collection runs.
