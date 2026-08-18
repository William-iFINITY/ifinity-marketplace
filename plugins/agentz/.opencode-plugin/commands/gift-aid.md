---
description: "Manage Gift Aid declarations and HMRC claims — check declarations, create new ones, preview tax reclaims"
---

# Gift Aid Management

Manage UK Gift Aid declarations and HMRC claim preparation in iMIS.

## Step 1: Determine Action

From $ARGUMENTS, determine what the user wants:
- **Check**: Check if a donor has a Gift Aid declaration
- **Declare**: Create a new Gift Aid declaration
- **Claim**: Preview an HMRC Gift Aid claim for a tax year

## Step 2: Find the Donor (for check/declare)

If a donor name or ID is provided, use `imis_find_member` to locate them.

## Step 3: Execute

### Check Declaration
```
imis_gift_aid action="declaration_check" partyId="<party-id>"
```

Present:
- Whether a declaration exists
- Declaration date, type, and period
- Which panel source it was found in

### Create Declaration
```
imis_gift_aid action="declaration_create" partyId="<party-id>" declarationDate="<today>" declarationType="written"
```

Ask the user to confirm:
- Declaration type (written, oral, online)
- Start date (when the declaration takes effect)
- End date (leave blank for ongoing)

### Preview HMRC Claim
```
imis_gift_aid action="claim_preview" taxYear="<year>"
```

Present:
- Tax year period (e.g., 6 April 2024 – 5 April 2025)
- Total eligible donations
- 25% reclaim amount
- Number of qualifying gifts
- Reminder that HMRC submission is done outside iMIS

## Step 4: Confirm

Summarise what was done and any next steps:
- For declarations: Remind that the donor must be a UK taxpayer
- For claims: Note that actual HMRC submission is via Charities Online
