---
description: "Record donations, process gifts, manage pledges, and review giving history in iMIS"
---

# Donor & Gift Management

Record donations, manage pledges, and review giving history in iMIS.

## Step 1: Find the Donor

Use `imis_find_member` with the name or ID from $ARGUMENTS.

## Actions

### Record a Gift
Gather details (ask if not provided):
- **Amount** (required)
- **Campaign/Fund** (optional — list available with `imis_entity action=list` Item filtered to fundraising products)
- **Payment type** (check, cash, in-kind — CC payments cannot go via API)
- **Tribute** (in honor/memory of someone — optional)
- **Soft credits** (attribute to additional parties — optional)

Use `imis_process_gift` (guarded two-step: `action=preview` returns a `confirmationText`, then `action=submit` with that exact text posts the gift):
- `partyId`: the donor
- `amount`: gift amount
- `itemId`: the fund/campaign product
- `giftType`: "donation" or "pledge"
- Include tribute and soft credit details if applicable

### View Giving History
Use `imis_billing_summary` for an overview, then:
- `imis_entity action=list` GiftInformationBatch with relevant filters for detailed history
- Show: date, amount, fund, campaign, payment method

### Process a Pledge
Use `imis_process_gift` with:
- `giftType: "pledge"`
- `pledgeFrequency`: monthly, quarterly, annually
- `numberOfInstallments`: how many payments
- `amount`: total pledge amount

## Step 2: Summarize

- Gift/pledge recorded with confirmation
- Running total for the donor (this year, lifetime)
- Campaign progress if applicable
- Log the interaction with `imis_contact_activity action=preview_log`
